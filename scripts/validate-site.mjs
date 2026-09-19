import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if ([".git", "node_modules", "content", "scripts"].includes(entry.name)) return [];
    return entry.isDirectory() ? walk(full) : entry.name === "index.html" ? [full] : [];
  });
}

function localTarget(url) {
  const clean = url.split(/[?#]/, 1)[0];
  if (!clean.startsWith("/") || clean.startsWith("//")) return null;
  const relative = clean.replace(/^\//, "");
  if (!relative) return path.join(ROOT, "index.html");
  if (path.extname(relative)) return path.join(ROOT, relative);
  return path.join(ROOT, relative, "index.html");
}

for (const file of walk(ROOT)) {
  const html = fs.readFileSync(file, "utf8");
  const label = path.relative(ROOT, file);
  const isRedirect = /<meta name="robots" content="noindex,follow">/.test(html) && /http-equiv="refresh"/.test(html);
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${label}: title 없음`);
  if (!isRedirect && !/<meta name="description" content="[^"]+">/.test(html)) failures.push(`${label}: meta description 없음`);
  if (!/<link rel="canonical" href="https:\/\/sosilofficial\.github\.io\/[^"]*">/.test(html)) failures.push(`${label}: canonical 없음`);
  if (isRedirect ? !/noindex,follow/.test(html) : !/<meta name="robots" content="index,follow,max-image-preview:large">/.test(html)) failures.push(`${label}: robots 설정 오류`);
  if (!isRedirect && (!/<meta property="og:title"/.test(html) || !/<meta property="og:url"/.test(html))) failures.push(`${label}: Open Graph 없음`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = localTarget(match[1]);
    if (target && !fs.existsSync(target)) failures.push(`${label}: 경로 없음 ${match[1]}`);
  }
  if (/[←→↗]/.test(html)) failures.push(`${label}: 금지된 방향 화살표 UI가 남아 있습니다`);
  if (html.includes('class="close-detail"') && !html.includes('<button type="button" class="close-detail"')) failures.push(`${label}: 닫기 UI가 button이 아닙니다`);
  if (/<style\b/i.test(html)) failures.push(`${label}: 반복 inline style이 남아 있습니다`);
  if (/mqdefault\.jpg/.test(html)) failures.push(`${label}: 저해상도 YouTube thumbnail이 남아 있습니다`);
}

for (const file of ["index.html", "404.html", "robots.txt", "sitemap.xml", "favicon-sosil.svg"]) {
  if (!fs.existsSync(path.join(ROOT, file))) failures.push(`${file}: 필수 파일 없음`);
}

const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
if (!sitemap.includes("https://sosilofficial.github.io/notes/") || sitemap.includes("/gibberish")) failures.push("sitemap.xml: Notes 공개 URL 설정 오류");
if (!sitemap.includes("https://sosilofficial.github.io/works/discography/") || sitemap.includes("https://sosilofficial.github.io/works/</loc>")) failures.push("sitemap.xml: Works 공개 URL 설정 오류");

const home = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
if (home.includes("sosil-archive.rezigitar.chatgpt.site/admin") || />edit<\/a>/.test(home)) failures.push("index.html: 이전 edit 링크가 남아 있습니다");
if (!home.includes('href="/notes"') || !home.includes('href="/works/discography"')) failures.push("index.html: 주요 navigation 경로 오류");
if (!home.includes('/assets/site-redesign.css') || !home.includes('/assets/site-redesign.js')) failures.push("index.html: 리디자인 자산 연결 오류");
if (!home.includes('https://www.youtube.com/watch?v=zZtQdgaWjBI')) failures.push("index.html: 홈 앨범 YouTube 링크 오류");
if (!home.includes('method="get" target="_blank"') || !home.includes('name="emailAddress"') || !home.includes('/viewform') || /formResponse|data-mailing-form|mailing-status|sending\.\.\.|thank you\./i.test(home)) failures.push("index.html: Mailing List Google Form 동작 오류");
if (!home.includes('class="home-news"') || !home.includes('<h2>latest news</h2>')) failures.push("index.html: 홈 latest news 영역이 없습니다");
if (home.includes("i make music,<br>and moving images.")) failures.push("index.html: 삭제한 홈 소개 문구가 남아 있습니다");
if (!/site-redesign\.css\?v=[a-f0-9]{12}/.test(home) || !/site-redesign\.js\?v=[a-f0-9]{12}/.test(home)) failures.push("index.html: 자산 cache version이 content hash가 아닙니다");

const notesIndex = fs.readFileSync(path.join(ROOT, "notes/index.html"), "utf8");
const noteList = notesIndex.match(/<div class="note-index">([\s\S]*?)<\/div>/)?.[1] || "";
if (/<img\b/.test(noteList)) failures.push("notes/index.html: 목록 썸네일이 남아 있습니다");
if (/\d{4}-\d{2}-\d{2}\s+\d{2}:/.test(noteList)) failures.push("notes/index.html: 날짜에 시간이 남아 있습니다");

const discographyIndex = fs.readFileSync(path.join(ROOT, "works", "discography", "index.html"), "utf8");
const worksSubnav = discographyIndex.match(/<nav class="subnav" aria-label="works 하위 메뉴">([\s\S]*?)<\/nav>/)?.[1] || "";
for (const href of ["/works/discography", "/works/videos", "/works/live", "/works/others"]) {
  if (!worksSubnav.includes(`href="${href}"`)) failures.push(`works/discography/index.html: Works 하위 메뉴 누락 ${href}`);
}

const css = fs.readFileSync(path.join(ROOT, "assets/site-redesign.css"), "utf8");
if (/\.track-list li[^}]*border-bottom/s.test(css) || /\.text-index a[^}]*border-bottom/s.test(css) || /\.note-index a[^}]*border-bottom/s.test(css)) failures.push("site-redesign.css: 목록 horizontal divider가 남아 있습니다");
const scripts = fs.readdirSync(path.join(ROOT, "scripts")).filter((name) => name.endsWith(".mjs")).map((name) => fs.readFileSync(path.join(ROOT, "scripts", name), "utf8")).join("\n");
if (/calc\(100(?:d?vh|vh) - 60px\)/.test(`${css}\n${scripts}`)) failures.push("모바일 레이아웃에 60px 고정 헤더 가정이 남아 있습니다");

const worksRedirect = fs.readFileSync(path.join(ROOT, "works", "index.html"), "utf8");
if (!worksRedirect.includes('content="0; url=/works/discography"') || !worksRedirect.includes('content="noindex,follow"')) failures.push("works/index.html: Discography redirect 설정 오류");
for (const route of ["gibberish", "gibberish/1", "gibberish/3"]) {
  const redirect = fs.readFileSync(path.join(ROOT, route, "index.html"), "utf8");
  if (!redirect.includes('content="noindex,follow"') || !redirect.includes("location.replace")) failures.push(`${route}: Notes legacy redirect 설정 오류`);
}
const notFound = fs.readFileSync(path.join(ROOT, "404.html"), "utf8");
if (!notFound.includes("nothing here.") || !notFound.includes('href="/"') || !notFound.includes('content="noindex,follow"')) failures.push("404.html: 커스텀 404 구성 오류");

if (process.env.SOSIL_PREVIEW_SAMPLES !== "1" && walk(ROOT).some((file) => fs.readFileSync(file, "utf8").includes("sample preview"))) failures.push("운영 빌드에 sample 콘텐츠가 노출되었습니다");

if (failures.length) throw new Error(`SITE VALIDATION ERROR:\n${[...new Set(failures)].join("\n")}`);
console.log(`Validated ${walk(ROOT).length} HTML pages, SEO metadata, redirects, and local asset paths.`);
