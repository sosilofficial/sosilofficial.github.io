import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const viewports = [
  { name: "small-mobile", width: 360, height: 740 },
  { name: "mobile", width: 390, height: 844 },
  { name: "large-mobile", width: 430, height: 932 },
  { name: "desktop", width: 1440, height: 900 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const mime = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".svg", "image/svg+xml"],
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".webp", "image/webp"], [".png", "image/png"],
]);

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const relative = pathname.replace(/^\/+/, "");
  let file = path.join(ROOT, relative);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    file = path.join(ROOT, "404.html");
    response.statusCode = 404;
  }
  response.setHeader("content-type", mime.get(path.extname(file)) || "application/octet-stream");
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
const browser = await chromium.launch({ headless: true, executablePath });

async function open(page, route) {
  const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
  assert(response && response.status() < 400, `${route}: HTTP ${response?.status()}`);
}

async function visibleImages(page, selector, label) {
  const states = await page.locator(selector).evaluateAll((images) => images.map((image) => {
    const style = getComputedStyle(image);
    const rect = image.getBoundingClientRect();
    return { display: style.display, visibility: style.visibility, width: rect.width, height: rect.height, alt: image.getAttribute("alt") };
  }));
  assert(states.length > 0, `${label}: 이미지가 없습니다`);
  for (const state of states) {
    assert(state.display !== "none" && state.visibility !== "hidden" && state.width > 0 && state.height > 0, `${label}: 숨겨진 이미지가 있습니다`);
    assert(Boolean(state.alt), `${label}: 의미 있는 alt가 없습니다`);
  }
}

async function closeDetail(page, landing, itemSelector, detailSelector, label) {
  await open(page, landing);
  const href = await page.locator(itemSelector).first().getAttribute("href");
  assert(href, `${label}: 상세 링크가 없습니다`);
  await open(page, href);
  await page.locator(detailSelector).waitFor({ state: "visible" });
  await Promise.all([
    page.waitForURL((url) => url.pathname.replace(/\/$/, "") === landing.replace(/\/$/, "")),
    page.locator(".close-detail").click(),
  ]);
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    const page = await context.newPage();

    await open(page, "/");
    assert(await page.locator(".rail-nav a").count() === 7, `${viewport.name}: 주요 nav가 완전하지 않습니다`);
    const mailing = page.locator(".home-mailing form");
    await mailing.waitFor({ state: "visible" });
    const mailingBox = await mailing.boundingBox();
    assert(mailingBox && mailingBox.width > 0, `${viewport.name}: Mailing List가 렌더링되지 않습니다`);
    if (viewport.width <= 430) assert(mailingBox.y < viewport.height + 40, `${viewport.name}: Mailing List가 첫 화면에서 너무 멉니다`);
    const coverTransformA = await page.locator(".moving-cover").evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(180);
    const coverTransformB = await page.locator(".moving-cover").evaluate((node) => getComputedStyle(node).transform);
    assert(coverTransformA === coverTransformB, `${viewport.name}: reduced motion에서 홈 커버가 움직입니다`);

    await open(page, "/works/discography");
    await visibleImages(page, ".release-index img", `${viewport.name} discography`);
    if (viewport.width <= 430) {
      const columns = await page.locator(".release-index").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
      assert(columns === 2, `${viewport.name}: Discography가 2열이 아닙니다`);
    }
    await closeDetail(page, "/works/discography", ".release-index a", ".release-detail", `${viewport.name} discography`);
    await closeDetail(page, "/works/videos", ".video-index a", ".works-video-detail", `${viewport.name} video`);
    await closeDetail(page, "/merch", ".merch-index a", ".merch-detail", `${viewport.name} merch`);

    await open(page, "/notes/1");
    const otherNote = page.locator('.note-index a:not(.is-selected)').first();
    const otherHref = await otherNote.getAttribute("href");
    assert(otherHref, `${viewport.name}: Notes 교차 이동 링크가 없습니다`);
    await otherNote.click();
    await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === otherHref.replace(/\/$/, ""));

    await open(page, "/notes");
    const categoryY = await page.locator(".category-top h1").evaluate((node) => node.getBoundingClientRect().top);
    await open(page, "/contact");
    const contactY = await page.locator(".contact-top h1").evaluate((node) => node.getBoundingClientRect().top);
    assert(Math.abs(categoryY - contactY) <= 24, `${viewport.name}: Contact 제목 정렬이 ${Math.abs(categoryY - contactY)}px 어긋납니다`);

    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const routes = [...fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").matchAll(/<loc>https:\/\/sosilofficial\.github\.io([^<]*)<\/loc>/g)].map((match) => match[1]);
  const checked = new Set();
  for (const route of routes) {
    await open(page, route);
    for (const href of await page.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
      const pathname = href.split(/[?#]/, 1)[0] || "/";
      if (checked.has(pathname)) continue;
      checked.add(pathname);
      const response = await page.request.get(`${base}${pathname}`);
      assert(response.status() < 400, `${route}: broken local link ${href} (${response.status()})`);
    }
  }
  await context.close();
  console.log(`Browser QA passed at ${viewports.map((viewport) => `${viewport.width}x${viewport.height}`).join(", ")} and checked ${checked.size} local links.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
