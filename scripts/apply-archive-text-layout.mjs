import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, "archive", "links");
const LANDING = path.join(GENERATED_DIR, "index.html");
const CONTENT_DIR = path.join(ROOT, "content", "archive", "links");
const SITEMAP = path.join(ROOT, "sitemap.xml");
const ARCHIVE_LANDINGS = [
  path.join(ROOT, "archive", "index.html"),
  path.join(ROOT, "archive", "photo-video", "index.html"),
  path.join(ROOT, "archive", "videos", "index.html"),
  LANDING,
];

if (!fs.existsSync(LANDING)) throw new Error("Archive/Text landing must be generated before layout postprocessing.");

const esc = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function parseContent(file) {
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  const data = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim();
    try { data[key] = JSON.parse(line.slice(colon + 1).trim()); }
    catch { data[key] = line.slice(colon + 1).trim().replace(/^"|"$/g, ""); }
  }
  data.body = match[2].trim();
  return data;
}

function originalUrl(item) {
  return item?.links?.find((link) => link?.url)?.url || item?.url || item?.video || "";
}

function publisher(item) {
  try { return new URL(originalUrl(item)).hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

function groupFor(item) {
  const explicit = String(item.meta || item.media_type || "").trim().toLowerCase();
  if (["interview", "interviews"].includes(explicit)) return "interviews";
  if (["review", "reviews"].includes(explicit)) return "reviews";
  if (["feature", "features", "press", "article", "articles", "essay", "essays"].includes(explicit)) return "features";

  const haystack = `${item.title || ""} ${originalUrl(item)}`.toLowerCase();
  if (/pick! new indie musician|interview|인터뷰/.test(haystack)) return "interviews";
  if (/sisain\.co\.kr|시사in|단편선과 플리들/.test(haystack)) return "features";
  if (/overtone\.kr|vop\.co\.kr|review|리뷰|좋은 음악/.test(haystack)) return "reviews";
  return "features";
}

const items = fs.existsSync(CONTENT_DIR)
  ? fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => parseContent(path.join(CONTENT_DIR, entry.name)))
      .filter((item) => item && item.published !== false && originalUrl(item))
  : [];

const order = ["features", "interviews", "reviews"];
const grouped = new Map(order.map((group) => [group, []]));
for (const item of items) grouped.get(groupFor(item))?.push(item);

const renderItem = (item) => {
  const url = originalUrl(item);
  const source = publisher(item);
  const description = item.description || item.note || "";
  return `<article class="archive-text-entry"><p class="archive-text-entry-line"><a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(item.title)}</a>${source ? `<em>${esc(source)}</em>` : ""}</p>${description ? `<p class="archive-text-entry-description">${esc(description)}</p>` : ""}</article>`;
};

const groupsHtml = order.map((group) => {
  const groupItems = grouped.get(group) || [];
  return `<section class="archive-text-group"><h2>${group}</h2>${groupItems.length ? `<div class="archive-text-flat-list">${groupItems.map(renderItem).join("")}</div>` : '<p class="archive-text-empty">—</p>'}</section>`;
}).join("");

const MAIN = `<main class="site-main"><div class="wide-page archive-text-flat-page"><div class="archive-text-top">${'<nav class="subnav" aria-label="archive 하위 메뉴"><a href="/archive/photo-video">photo</a><a href="/archive/videos">video</a><a href="/archive/links" class="is-active" aria-current="page">text</a></nav>'}</div><div class="archive-text-groups">${groupsHtml}</div></div></main>`;

const STYLE = `<style id="archive-text-layout-style">
/* Keep Photo, Video and Text on one shared Archive index coordinate. */
.archive-index-page .wide-page {
  min-height: 100vh;
  max-width: none;
  padding: clamp(42px, 5.5vh, 58px) clamp(38px, 5.5vw, 86px) 110px !important;
}
.archive-index-page .wide-page > .subnav {
  margin-bottom: clamp(68px, 9vh, 110px) !important;
}
.archive-index-page .photo-post-grid,
.archive-index-page .archive-video-grid,
.archive-index-page .archive-text-groups {
  width: min(100%, 1040px);
}
.archive-index-page .wide-empty {
  width: min(100%, 1040px);
  margin-top: 0;
  text-align: left;
}
.archive-text-page .archive-text-top {
  margin-bottom: clamp(68px, 9vh, 110px);
}
.archive-text-page .archive-text-top .subnav {
  margin-bottom: 0;
}
.archive-text-page .archive-text-group {
  margin-bottom: clamp(54px, 7vh, 82px);
}
.archive-text-page .archive-text-group:last-child {
  margin-bottom: 0;
}
.archive-text-page .archive-text-group h2 {
  margin: 0 0 clamp(24px, 3vh, 34px);
  font-family: var(--font-ui, "American Typewriter", "Courier Prime", "Courier New", monospace);
  font-size: .76rem;
  font-weight: 600;
  letter-spacing: .035em;
  text-transform: lowercase;
}
.archive-text-page .archive-text-flat-list {
  display: grid;
  gap: 13px;
}
.archive-text-page .archive-text-entry {
  margin: 0;
}
.archive-text-page .archive-text-entry-line,
.archive-text-page .archive-text-entry-description {
  margin: 0;
  font-family: var(--font-content, "Helvetica Neue", Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif);
}
.archive-text-page .archive-text-entry-line {
  font-size: clamp(.84rem, .95vw, .96rem);
  line-height: 1.48;
}
.archive-text-page .archive-text-entry-line a {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}
.archive-text-page .archive-text-entry-line em {
  margin-left: 7px;
  color: var(--muted);
  font-size: .88em;
  font-style: italic;
}
.archive-text-page .archive-text-entry-description {
  max-width: 76ch;
  margin-top: 4px;
  color: var(--ink);
  font-size: clamp(.78rem, .86vw, .88rem);
  line-height: 1.5;
}
.archive-text-page .archive-text-empty {
  margin: 0;
  color: var(--muted);
  font-family: var(--font-content, "Helvetica Neue", Helvetica, Arial, sans-serif);
}
@media (max-width: 820px) {
  .archive-index-page .wide-page {
    padding: 24px 18px 80px !important;
  }
  .archive-index-page .wide-page > .subnav,
  .archive-text-page .archive-text-top {
    margin-bottom: 56px !important;
  }
  .archive-text-page .archive-text-group {
    margin-bottom: 52px;
  }
  .archive-text-page .archive-text-entry-line em {
    display: block;
    margin: 2px 0 0;
  }
}
</style>`;

function addBodyClass(html, className) {
  return html.replace(/<body class="([^"]*)">/, (_m, cls) => {
    const classes = new Set(cls.split(/\s+/).filter(Boolean));
    classes.add(className);
    return `<body class="${[...classes].join(" ")}">`;
  });
}

function ensureStyle(html) {
  return html.includes('id="archive-text-layout-style"')
    ? html.replace(/<style id="archive-text-layout-style">[\s\S]*?<\/style>/, STYLE)
    : html.replace("</head>", `${STYLE}</head>`);
}

let html = fs.readFileSync(LANDING, "utf8");
html = html.replace(/<body class="([^"]*)">/, (_m, cls) => {
  const classes = new Set(cls.split(/\s+/).filter(Boolean));
  classes.delete("archive-text-landing-page");
  classes.add("archive-text-page");
  classes.add("archive-index-page");
  return `<body class="${[...classes].join(" ")}">`;
});
html = ensureStyle(html);
html = html.replace(/<main class="site-main">[\s\S]*?<\/main>/, MAIN);
fs.writeFileSync(LANDING, html);

// Photo and Video use the Text landing as their fixed index reference:
// same top inset, horizontal inset, subnav baseline and content width.
for (const file of ARCHIVE_LANDINGS) {
  if (!fs.existsSync(file)) continue;
  let landingHtml = fs.readFileSync(file, "utf8");
  landingHtml = addBodyClass(landingHtml, "archive-index-page");
  landingHtml = ensureStyle(landingHtml);
  fs.writeFileSync(file, landingHtml);
}

// Detail routes are no longer part of Archive/Text; every title links straight to its source.
for (const entry of fs.readdirSync(GENERATED_DIR, { withFileTypes: true })) {
  if (entry.isDirectory()) fs.rmSync(path.join(GENERATED_DIR, entry.name), { recursive: true, force: true });
}

// Keep sitemap in sync with the flattened Archive/Text route.
if (fs.existsSync(SITEMAP)) {
  const xml = fs.readFileSync(SITEMAP, "utf8");
  const cleaned = xml.split("\n").filter((line) => !/https:\/\/sosilofficial\.github\.io\/archive\/links\/[^<]+\/<\/loc>/.test(line)).join("\n");
  fs.writeFileSync(SITEMAP, cleaned);
}

console.log("Aligned Archive Photo, Video and Text landings to one shared index grid; Text remains a flat external-link archive.");
