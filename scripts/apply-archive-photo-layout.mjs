import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PHOTO_DIR = path.join(ROOT, "archive", "photo-video");
const LANDINGS = [path.join(ROOT, "archive", "index.html"), path.join(PHOTO_DIR, "index.html")];

/*
 * Archive Photo uses one representative image per post in the index, while
 * every image attached to that post remains visible inside its detail page.
 * The final desktop split/landing behavior is applied by
 * apply-unified-desktop-grid.mjs.
 */
const STYLE = `<style id="archive-photo-post-style">
@media (min-width: 821px) {
  .archive-photo-split .detail-panel {
    background: var(--bg);
  }
}
.photo-post-gallery {
  display: grid;
  gap: clamp(18px, 3vw, 36px);
  width: 100%;
  margin: 0 0 var(--space-lg);
}
.photo-post-gallery .photo-selected {
  display: block;
  width: 100%;
  max-width: none;
  height: auto;
  margin: 0;
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="archive-photo-post-style"')) {
    return html.replace(/<style id="archive-photo-post-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

function combinePostImages(html, slug) {
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const articlePattern = new RegExp(
    `<article id="photo-${escapedSlug}-(\\d+)" class="photo-detail switch-panel"[^>]*>[\\s\\S]*?<\\/article>`,
    "g"
  );
  const articles = [...html.matchAll(articlePattern)]
    .sort((a, b) => Number(a[1]) - Number(b[1]));

  if (!articles.length) return html;

  const first = articles[0][0];
  const close = first.match(/<button[^>]*class="close-detail"[\s\S]*?<\/button>/)?.[0] || "";
  const title = first.match(/<h1>[\s\S]*?<\/h1>/)?.[0] || "";
  const date = first.match(/<p>[\s\S]*?<\/p>/)?.[0] || "";
  const prose = first.match(/<div class="prose">[\s\S]*?<\/div>/)?.[0] || "";

  const images = articles.map((match, index) => {
    const image = match[0].match(/<img class="photo-selected"[^>]*>/)?.[0] || "";
    if (!image) return "";
    return image
      .replace(/ loading="(?:eager|lazy)"/, ` loading="${index === 0 ? "eager" : "lazy"}"`)
      .replace(/ id="[^"]*"/, "")
      .replace("<img ", `<img id="photo-${slug}-${index}" `);
  }).filter(Boolean).join("");

  const combined = `<article class="photo-detail photo-post-detail">${close}<div class="photo-post-gallery">${images}</div>${title}${date}${prose}</article>`;
  const firstIndex = articles[0].index;
  const last = articles[articles.length - 1];
  const lastIndex = last.index + last[0].length;
  return html.slice(0, firstIndex) + combined + html.slice(lastIndex);
}

for (const file of LANDINGS) {
  if (!fs.existsSync(file)) continue;
  fs.writeFileSync(file, ensureStyle(fs.readFileSync(file, "utf8")));
}

if (fs.existsSync(PHOTO_DIR)) {
  for (const entry of fs.readdirSync(PHOTO_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(PHOTO_DIR, entry.name, "index.html");
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    html = combinePostImages(html, entry.name);
    fs.writeFileSync(file, ensureStyle(html));
  }
}

console.log("Kept one Archive Photo cover per post while showing every post image in the detail gallery.");
