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
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${label}: title 없음`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) failures.push(`${label}: meta description 없음`);
  if (!/<link rel="canonical" href="https:\/\/sosilofficial\.github\.io\/[^"]*">/.test(html)) failures.push(`${label}: canonical 없음`);
  if (!/<meta name="robots" content="index,follow,max-image-preview:large">/.test(html) || /noindex/i.test(html)) failures.push(`${label}: robots 설정 오류`);
  if (!/<meta property="og:title"/.test(html) || !/<meta property="og:url"/.test(html)) failures.push(`${label}: Open Graph 없음`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = localTarget(match[1]);
    if (target && !fs.existsSync(target)) failures.push(`${label}: 경로 없음 ${match[1]}`);
  }
}

for (const file of ["index.html", "robots.txt", "sitemap.xml", "favicon-sosil.svg"]) {
  if (!fs.existsSync(path.join(ROOT, file))) failures.push(`${file}: 필수 파일 없음`);
}

const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
if (!sitemap.includes("https://sosilofficial.github.io/notes/") || sitemap.includes("/gibberish")) failures.push("sitemap.xml: Notes 공개 URL 설정 오류");
const home = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
if (home.includes("sosil-archive.rezigitar.chatgpt.site/admin") || />edit<\/a>/.test(home)) failures.push("index.html: 이전 edit 링크가 남아 있습니다");
if (!home.includes('href="/notes"')) failures.push("index.html: Notes navigation 경로 오류");
if (!home.includes('href="/works"') || !sitemap.includes("https://sosilofficial.github.io/works/")) failures.push("Works landing 경로 오류");
if (!home.includes('/assets/site-redesign.css') || !home.includes('/assets/site-redesign.js')) failures.push("index.html: 리디자인 자산 연결 오류");
if (!home.includes('https://www.youtube.com/watch?v=zZtQdgaWjBI')) failures.push("index.html: 홈 앨범 YouTube 링크 오류");
if (/[←→↗]/.test(home)) failures.push("index.html: 금지된 방향 화살표 UI가 남아 있습니다");
for (const file of walk(ROOT)) {
  const html = fs.readFileSync(file, "utf8");
  if (/[←→↗]/.test(html)) failures.push(`${path.relative(ROOT, file)}: 금지된 방향 화살표 UI가 남아 있습니다`);
  if (html.includes('class="close-detail"') && !html.includes('<button type="button" class="close-detail"')) failures.push(`${path.relative(ROOT, file)}: 닫기 UI가 button이 아닙니다`);
}
const notesIndex = fs.readFileSync(path.join(ROOT, "notes/index.html"), "utf8");
const noteList = notesIndex.match(/<div class="note-index">([\s\S]*?)<\/div>/)?.[1] || "";
if (/<img\b/.test(noteList)) failures.push("notes/index.html: 목록 썸네일이 남아 있습니다");
if (/\d{4}-\d{2}-\d{2}\s+\d{2}:/.test(noteList)) failures.push("notes/index.html: 날짜에 시간이 남아 있습니다");
const css = fs.readFileSync(path.join(ROOT, "assets/site-redesign.css"), "utf8");
if (/\.track-list li[^}]*border-bottom/s.test(css) || /\.live-row[^}]*border-bottom/s.test(css) || /\.text-index a[^}]*border-bottom/s.test(css) || /\.note-index a[^}]*border-bottom/s.test(css)) failures.push("site-redesign.css: 목록 horizontal divider가 남아 있습니다");
if (process.env.SOSIL_PREVIEW_SAMPLES !== "1" && walk(ROOT).some((file) => fs.readFileSync(file, "utf8").includes("sample preview"))) failures.push("운영 빌드에 sample 콘텐츠가 노출되었습니다");

if (failures.length) throw new Error(`SITE VALIDATION ERROR:\n${[...new Set(failures)].join("\n")}`);
console.log(`Validated ${walk(ROOT).length} HTML pages, SEO metadata, and local asset paths.`);
