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

async function assertHomeMotion(viewport, label) {
  const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await open(page, "/");
  const cover = page.locator(".moving-cover");
  await cover.waitFor({ state: "visible" });

  const positions = [];
  for (let i = 0; i < 7; i += 1) {
    const box = await cover.boundingBox();
    assert(box, `${label}: 홈 앨범커버 좌표를 읽지 못했습니다`);
    positions.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await page.waitForTimeout(400);
  }

  const start = positions[0];
  const maxDistance = Math.max(...positions.map((point) => Math.hypot(point.x - start.x, point.y - start.y)));
  // The desktop cover intentionally drifts very slowly (58s cycle). Keep the
  // threshold high enough to catch a frozen cover without rejecting valid
  // gentle curved paths that happen to move less during this short sample.
  const minDistance = viewport.width > 820 ? 4 : 0.5;
  assert(maxDistance >= minDistance, `${label}: 홈 앨범커버의 실제 이동량이 너무 작습니다 (${maxDistance.toFixed(2)}px)`);

  const canvas = page.locator(".home-motion-field canvas.motion-history");
  assert(await canvas.count() === 1, `${label}: 홈 잔상 canvas가 생성되지 않았습니다`);
  const paintedTrail = await canvas.evaluate((node) => {
    const context2d = node.getContext("2d");
    if (!context2d || !node.width || !node.height) return false;
    const pixels = context2d.getImageData(0, 0, node.width, node.height).data;
    for (let index = 3; index < pixels.length; index += 32) {
      if (pixels[index] > 0) return true;
    }
    return false;
  });
  assert(paintedTrail, `${label}: 잔상 canvas에 실제 픽셀이 그려지지 않았습니다`);

  await context.close();
}

async function categoryRhythm(page) {
  const heading = await page.locator(".category-top h1:visible").first().boundingBox();
  const subnav = await page.locator(".category-top .subnav:visible").first().boundingBox();
  const gap = await page.locator(".category-top .subnav:visible").first().evaluate((node) => getComputedStyle(node).columnGap || getComputedStyle(node).gap);
  assert(heading && subnav, "category heading/subnav 좌표를 읽지 못했습니다");
  return { verticalGap: subnav.y - (heading.y + heading.height), gap };
}

function assertGridMatch(reference, candidate, label, properties = ["x", "y"]) {
  assert(reference && candidate, `${label}: 그리드 좌표를 읽지 못했습니다`);
  for (const property of properties) {
    const delta = Math.abs(reference[property] - candidate[property]);
    assert(delta <= 2, `${label}: ${property} 좌표가 ${delta.toFixed(1)}px 어긋납니다`);
  }
}

async function visibleBox(page, selector) {
  return page.locator(selector).evaluateAll((nodes) => {
    const node = nodes.find((candidate) => {
      const style = getComputedStyle(candidate);
      const rect = candidate.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    const page = await context.newPage();

    await open(page, "/");
    assert(await page.locator(".rail-nav a").count() === 7, `${viewport.name}: 주요 nav가 완전하지 않습니다`);
    const homeNews = page.locator(".home-news");
    await homeNews.waitFor({ state: "visible" });
    assert((await homeNews.locator("h2").textContent())?.trim() === "latest news", `${viewport.name}: 홈 latest news 제목이 없습니다`);
    assert(!(await page.locator(".home-intro").innerText()).includes("i make music"), `${viewport.name}: 삭제한 홈 소개 문구가 다시 나타났습니다`);
    const mailing = page.locator(".home-mailing form");
    await mailing.waitFor({ state: "visible" });
    const mailingBox = await mailing.boundingBox();
    assert(mailingBox && mailingBox.width > 0, `${viewport.name}: Mailing List가 렌더링되지 않습니다`);
    const mailingUi = await mailing.evaluate((form) => {
      const button = form.querySelector("button");
      return { formBackground: getComputedStyle(form).backgroundColor, buttonBackground: getComputedStyle(button).backgroundColor };
    });
    assert(mailingUi.formBackground !== "rgba(0, 0, 0, 0)", `${viewport.name}: Mailing List 입력 영역이 구분되지 않습니다`);
    assert(mailingUi.buttonBackground !== "rgba(0, 0, 0, 0)", `${viewport.name}: Mailing List join 버튼이 구분되지 않습니다`);
    const homeLines = await page.locator(".home-news, .home-mailing, .home-mailing form").evaluateAll((nodes) => nodes.map((node) => {
      const style = getComputedStyle(node);
      return { top: style.borderTopWidth, bottom: style.borderBottomWidth };
    }));
    assert(homeLines.every(({ top, bottom }) => top === "0px" && bottom === "0px"), `${viewport.name}: 홈페이지에 가로선이 남아 있습니다`);
    if (viewport.width <= 430) {
      assert(mailingBox.y < viewport.height + 40, `${viewport.name}: Mailing List가 첫 화면에서 너무 멉니다`);
      const motionFieldBox = await page.locator(".home-motion-field").boundingBox();
      const homeNewsBox = await homeNews.boundingBox();
      const mobileCoverBox = await page.locator(".moving-cover").boundingBox();
      assert(motionFieldBox && homeNewsBox && mobileCoverBox, `${viewport.name}: 모바일 홈 그리드 좌표를 읽지 못했습니다`);
      assert(mailingBox.width <= 300, `${viewport.name}: 모바일 Mailing List가 지나치게 큽니다`);
      for (const selector of [".home-intro", ".home-news", ".home-mailing", ".home-mailing form"]) {
        const box = await page.locator(selector).boundingBox();
        assert(box && Math.abs(box.x - (viewport.width - box.x - box.width)) <= 2,
          `${viewport.name}: ${selector}의 좌우 여백이 다릅니다`);
      }
      assert(mobileCoverBox.width <= viewport.width * .27, `${viewport.name}: 모바일 앨범커버가 충분히 작아지지 않았습니다`);
      assert(homeNewsBox.y >= motionFieldBox.y + motionFieldBox.height + 20, `${viewport.name}: Latest News가 앨범 영역과 충분히 떨어져 있지 않습니다`);
      assert(Math.abs(homeNewsBox.x - mailingBox.x) <= 2, `${viewport.name}: Latest News와 Mailing List의 시작선이 다릅니다`);
    }
    if (viewport.width > 820) {
      await page.evaluate(() => document.fonts.ready);
      const intro = await page.locator(".home-intro").boundingBox();
      const news = await homeNews.boundingBox();
      const signup = await page.locator(".home-mailing").boundingBox();
      assert(intro && news && signup, "Desktop home sections must be visible");
      const gapAbove = news.y - (intro.y + intro.height);
      const gapBelow = signup.y - (news.y + news.height);
      assert(gapAbove >= 0 && gapBelow >= 0, "Latest News overlaps intro or Mailing List");
      assert(Math.abs(gapAbove - gapBelow) <= 2, "Latest News must bisect the gap between intro and Mailing List");
    }
    const coverTransformA = await page.locator(".moving-cover").evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(180);
    const coverTransformB = await page.locator(".moving-cover").evaluate((node) => getComputedStyle(node).transform);
    assert(coverTransformA !== coverTransformB, `${viewport.name}: reduced-motion에서도 홈 커버 이동이 유지되지 않습니다`);

    await open(page, "/works/discography");
    if (viewport.width > 820) {
      const menu = await page.locator('.release-split .subnav').evaluate((nav) => {
        const panel = nav.closest('.index-panel').getBoundingClientRect();
        const links = [...nav.querySelectorAll('a')];
        return links.map((link) => {
          const rect = link.getBoundingClientRect();
          return { text: link.textContent, visible: rect.left >= panel.left && rect.right <= panel.right && rect.width > 0 };
        });
      });
      assert(menu.length === 4 && menu.every((item) => item.visible), "All four Works categories must fit inside the index column");
      const gutters = await page.locator('.release-split').evaluate((split) => {
        const panel = split.querySelector('.index-panel').getBoundingClientRect();
        const image = split.querySelector('.release-index img').getBoundingClientRect();
        const nav = split.querySelector('.subnav').getBoundingClientRect();
        return { left: image.left - panel.left, right: panel.right - image.right, imageWidth: image.width, navWidth: nav.width };
      });
      assert(Math.abs(gutters.left - gutters.right) <= 1, "Index thumbnails need equal divider gutters");
      assert(Math.abs(gutters.imageWidth - gutters.navWidth) <= 3, "Thumbnails must span the full Works menu width");
    }
    const worksTabs = await page.locator(".release-split .subnav a").evaluateAll((links) => links.map((link) => ({
      text: link.textContent?.trim(),
      display: getComputedStyle(link).display,
      visibility: getComputedStyle(link).visibility,
    })));
    assert(worksTabs.length === 4, `${viewport.name}: Works 하위 메뉴가 4개가 아닙니다`);
    assert(worksTabs.every((tab) => tab.display !== "none" && tab.visibility !== "hidden"), `${viewport.name}: Works 하위 메뉴 중 숨겨진 항목이 있습니다`);
    const worksRhythm = await categoryRhythm(page);
    await visibleImages(page, ".release-index img", `${viewport.name} discography`);
    const releaseIndexBox = await page.locator(".release-index").boundingBox();
    if (viewport.width <= 430) {
      const columns = await page.locator(".release-index").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
      assert(columns === 2, `${viewport.name}: Discography가 2열이 아닙니다`);
    }

    const coverBox = await page.locator(".release-index img").first().boundingBox();
    if (viewport.width > 820) {
      const detailBox = await page.locator(".release-split > .detail-panel").boundingBox();
      assert(coverBox && detailBox, `${viewport.name}: Discography 좌표를 읽지 못했습니다`);
      assert(coverBox.x + coverBox.width <= detailBox.x + 1, `${viewport.name}: Discography 앨범커버가 detail panel을 침범합니다`);
    }

    await open(page, "/works/videos");
    const videoIndexBox = await page.locator(".video-index").boundingBox();
    const videoBox = await page.locator(".video-index img").first().boundingBox();
    assertGridMatch(releaseIndexBox, videoIndexBox, `${viewport.name}: Discography/Video 목록`, ["x", "y", "width"]);
    assertGridMatch(coverBox, videoBox, `${viewport.name}: Discography/Video 첫 이미지`, viewport.width > 820 ? ["x", "y", "width"] : ["x", "y"]);

    await open(page, "/works/live");
    const liveBox = await page.locator(".live-log").boundingBox();
    assertGridMatch(releaseIndexBox, liveBox, `${viewport.name}: Works 목록 시작선`, viewport.width > 820 ? ["y"] : ["x", "y"]);
    const liveTypography = await page.locator(".live-row:has(.live-artists)").first().evaluate((row) => {
      const title = getComputedStyle(row.querySelector(".live-title"));
      const artists = getComputedStyle(row.querySelector(".live-artists"));
      return { titleWeight: title.fontWeight, titleColor: title.color, artistsColor: artists.color };
    });
    assert(Number(liveTypography.titleWeight) <= 400, `${viewport.name}: Live 제목에 굵은 글꼴이 남아 있습니다`);
    assert(liveTypography.titleColor === liveTypography.artistsColor, `${viewport.name}: Live 제목과 출연진의 기본 글자색이 다릅니다`);
    const liveLines = await page.locator(".live-log").evaluate((log) => ({
      top: getComputedStyle(log).borderTopColor,
      row: getComputedStyle(log.querySelector(".live-row")).borderBottomColor,
    }));
    const liveLineAlpha = Number(liveLines.row.match(/([\d.]+)\)$/)?.[1] || 1);
    assert(liveLines.top === liveLines.row && liveLineAlpha <= .055, `${viewport.name}: Live 가로선이 세로선보다 진합니다`);

    await open(page, "/archive/photo-video");
    const archiveRhythm = await categoryRhythm(page);
    const archivePhotoBox = await visibleBox(page, ".photo-index, .photo-masonry, .photo-post-grid");
    assert(archivePhotoBox, `${viewport.name}: Archive Photo 목록을 찾지 못했습니다`);
    assert(worksRhythm.gap === archiveRhythm.gap, `${viewport.name}: Works와 Archive 하위 메뉴 간격이 다릅니다 (${worksRhythm.gap} / ${archiveRhythm.gap})`);
    assert(Math.abs(worksRhythm.verticalGap - archiveRhythm.verticalGap) <= 1, `${viewport.name}: Works와 Archive 제목-하위메뉴 간격이 다릅니다 (${worksRhythm.verticalGap}px / ${archiveRhythm.verticalGap}px)`);

    await open(page, "/archive/videos");
    const archiveVideoBox = await visibleBox(page, ".archive-video-index, .archive-video-grid, .video-index, .wide-empty, .empty-note");
    assert(archiveVideoBox, `${viewport.name}: Archive Video 목록을 찾지 못했습니다`);
    assertGridMatch(archivePhotoBox, archiveVideoBox, `${viewport.name}: Archive Photo/Video 목록`, ["x", "y", "width"]);

    await open(page, "/archive/links");
    const archiveTextBox = await page.locator(".archive-text-groups").boundingBox();
    assert(archiveTextBox, `${viewport.name}: Archive Text 목록을 찾지 못했습니다`);

    await closeDetail(page, "/works/discography", ".release-index a", ".release-detail", `${viewport.name} discography`);
    await closeDetail(page, "/works/videos", ".video-index a", ".works-video-detail", `${viewport.name} video`);
    await closeDetail(page, "/merch", ".merch-index a", ".merch-detail", `${viewport.name} merch`);

    await open(page, "/notes/1");
    const otherNote = page.locator('.note-index a:not(.is-selected)').first();
    const otherHref = await otherNote.getAttribute("href");
    assert(otherHref, `${viewport.name}: Notes 교차 이동 링크가 없습니다`);
    await otherNote.click();
    await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === otherHref.replace(/\/$/, ""));

    const categoryPages = [
      ["/works/discography", ".category-top h1"],
      ["/archive", ".category-top h1"],
      ["/notes", ".category-top h1"],
      ["/merch", ".category-top h1"],
      ["/news", ".category-top h1"],
    ];
    let categoryHeadingBox = null;
    for (const [route, selector] of categoryPages) {
      await open(page, route);
      const headingBox = await visibleBox(page, selector);
      if (!categoryHeadingBox) categoryHeadingBox = headingBox;
      else assertGridMatch(categoryHeadingBox, headingBox, `${viewport.name}: ${route} 제목`, ["x", "y"]);
    }

    await context.close();
  }

  await assertHomeMotion({ width: 1440, height: 900 }, "desktop motion");
  await assertHomeMotion({ width: 390, height: 844 }, "mobile motion");

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
  console.log(`Browser QA passed at ${viewports.map((viewport) => `${viewport.width}x${viewport.height}`).join(", ")}, verified Works/Archive rhythm, Discography/Video alignment, visibly moving homepage covers with painted trails, and checked ${checked.size} local links.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
