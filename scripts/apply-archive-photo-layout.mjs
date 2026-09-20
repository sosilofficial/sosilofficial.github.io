import fs from "node:fs";
import path from "node:path";

// Keep Archive Photo as post-based landing + independent gallery detail pages.
const ROOT = process.cwd();
const PHOTO_DIR = path.join(ROOT, "archive", "photo-video");
const LANDINGS = [path.join(ROOT, "archive", "index.html"), path.join(PHOTO_DIR, "index.html")];

const STYLE = `<style id="archive-photo-post-style">
@media (min-width: 821px) {
  .photo-post-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 220px));
    justify-content: start;
    align-items: start;
    gap: clamp(42px, 5vw, 76px) clamp(28px, 3.6vw, 58px);
  }
  .photo-post-grid a { display: block; }
  .photo-post-grid a:nth-child(4n + 2) { margin-top: 22px; }
  .photo-post-grid a:nth-child(4n + 4) { margin-top: 10px; }
  .photo-post-grid img {
    width: 100%;
    max-width: 220px;
    height: auto;
    object-fit: cover;
  }

  /* Give Archive Video the same slightly accumulated, non-catalog rhythm without changing thumbnail size. */
  .archive-index-page .archive-video-grid {
    align-items: start;
  }
  .archive-index-page .archive-video-grid > a:nth-child(4n + 2) { margin-top: 22px; }
  .archive-index-page .archive-video-grid > a:nth-child(4n + 4) { margin-top: 10px; }
  .archive-index-page .archive-video-grid img {
    filter: saturate(.78) contrast(.95);
  }

  .archive-photo-detail-page { position: relative; }
  .archive-photo-detail-page > .subnav { margin-bottom: clamp(52px, 7vh, 86px); }
  .archive-photo-detail-head {
    position: relative;
    width: min(100%, 980px);
    margin-bottom: clamp(34px, 5vh, 58px);
    padding-right: 150px;
  }
  .archive-photo-detail-head h1 {
    max-width: 34ch;
    margin: 0 0 8px;
    font-size: clamp(1.02rem, 1.35vw, 1.28rem);
    line-height: 1.35;
  }
  .archive-photo-detail-head > p { margin: 0 0 18px; color: var(--muted); }
  .archive-photo-detail-head .prose { max-width: 54ch; color: var(--muted); }
  .archive-photo-back {
    position: absolute;
    top: 0;
    right: 0;
    color: var(--muted);
  }
  .archive-photo-post-gallery {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: clamp(24px, 3.2vw, 52px);
    width: min(100%, 980px);
  }
  .archive-photo-post-gallery img {
    width: 100%;
    max-width: 470px;
    height: auto;
  }
}
@media (max-width: 820px) {
  .photo-post-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 34px 16px;
  }
  .photo-post-grid a,
  .archive-index-page .archive-video-grid > a { margin-top: 0 !important; }
  .photo-post-grid img { width: 100%; height: auto; }
  .archive-photo-detail-head { margin-bottom: 34px; }
  .archive-photo-back { display: inline-block; margin-bottom: 28px; color: var(--muted); }
  .archive-photo-post-gallery { display: grid; gap: 24px; }
  .archive-photo-post-gallery img { width: 100%; height: auto; }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="archive-photo-post-style"')) return html;
  return html.replace("</head>", `${STYLE}</head>`);
}

function convertLanding(file) {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  const block = html.match(/<div class="photo-masonry">([\s\S]*?)<\/div>/)?.[1];
  if (!block) return;

  const seen = new Set();
  const posts = [];
  for (const match of block.matchAll(/<a href="\/archive\/photo-video\/([^"#]+)(?:#[^"]*)?">([\s\S]*?)<\/a>/g)) {
    const slug = match[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    posts.push(`<a href="/archive/photo-video/${slug}">${match[2]}</a>`);
  }

  html = html.replace(/<div class="photo-masonry">[\s\S]*?<\/div>/, `<div class="photo-post-grid">${posts.join("")}</div>`);
  fs.writeFileSync(file, ensureStyle(html));
}

function extractArticleData(article) {
  const title = article.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] || "";
  const date = article.match(/<h1>[\s\S]*?<\/h1><p>([\s\S]*?)<\/p>/)?.[1] || "";
  const prose = article.match(/<div class="prose">([\s\S]*?)<\/div>/)?.[1] || "";
  const image = article.match(/<img class="photo-selected"([^>]+)>/)?.[0] || "";
  return { title, date, prose, image };
}

if (fs.existsSync(PHOTO_DIR)) {
  for (const entry of fs.readdirSync(PHOTO_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const file = path.join(PHOTO_DIR, slug, "index.html");
    if (!fs.existsSync(file)) continue;

    let html = fs.readFileSync(file, "utf8");
    if (!html.includes('class="photo-detail switch-panel"')) continue;

    const articles = [...html.matchAll(/<article id="([^"]+)" class="photo-detail switch-panel"[\s\S]*?<\/article>/g)]
      .filter((match) => match[1].startsWith(`photo-${slug}-`));
    if (!articles.length) continue;

    const pieces = articles.map((match) => extractArticleData(match[0]));
    const first = pieces[0];
    const images = pieces.map((piece, index) => piece.image
      .replace('class="photo-selected"', 'class="archive-photo-full"')
      .replace(/loading="[^"]+"/, `loading="${index === 0 ? "eager" : "lazy"}"`)
    ).join("");
    const subnav = html.match(/<nav class="subnav" aria-label="archive 하위 메뉴">[\s\S]*?<\/nav>/)?.[0] || "";
    const head = `<header class="archive-photo-detail-head"><a class="archive-photo-back" href="/archive/photo-video">back to photo</a><h1>${first.title}</h1>${first.date ? `<p>${first.date}</p>` : ""}${first.prose ? `<div class="prose">${first.prose}</div>` : ""}</header>`;
    const main = `<main class="site-main"><div class="wide-page archive-photo-detail-page">${subnav}${head}<div class="archive-photo-post-gallery">${images}</div></div></main>`;

    if (!/<main class="site-main">[\s\S]*?<\/main>/.test(html)) {
      throw new Error(`ARCHIVE PHOTO LAYOUT ERROR: main region not found for ${slug}`);
    }
    html = ensureStyle(html.replace(/<main class="site-main">[\s\S]*?<\/main>/, main));
    fs.writeFileSync(file, html);
  }
}

for (const file of LANDINGS) convertLanding(file);
console.log("Applied a looser accumulated Archive rhythm while preserving thumbnail scale and detail structure.");
