import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const STYLE = `<style id="unified-desktop-grid-style">
.archive-desktop-only { display: none; }

@media (min-width: 821px) {
  :root {
    --desktop-index-column: max(var(--sidebar), 118px);
    --desktop-index-pad-x: clamp(18px, 1.7vw, 28px);
    --desktop-detail-pad-x: clamp(28px, 3vw, 52px);
  }

  .archive-desktop-only { display: block; }
  .archive-mobile-only { display: none !important; }

  /*
   * Use the sidebar width once more for the index column. This puts the two
   * vertical dividers on one repeating grid: viewport -> sidebar -> index -> detail.
   */
  .split-layout:not(.info-split):not(.live-split) {
    display: grid !important;
    grid-template-columns: var(--desktop-index-column) minmax(0, 1fr) !important;
    width: 100% !important;
    min-width: 0;
    max-width: none !important;
    position: relative;
  }
  .split-layout:not(.info-split):not(.live-split) > .index-panel {
    grid-column: 1 !important;
    min-width: 0;
    width: auto !important;
    max-width: none !important;
    padding-left: var(--desktop-index-pad-x) !important;
    padding-right: var(--desktop-index-pad-x) !important;
  }
  .split-layout:not(.info-split):not(.live-split) > .detail-panel {
    grid-column: 2 !important;
    min-width: 0;
    width: auto !important;
    max-width: none !important;
    padding-left: var(--desktop-detail-pad-x) !important;
    padding-right: var(--desktop-detail-pad-x) !important;
    border-left: 0 !important;
    box-sizing: border-box;
  }
  .split-layout:not(.info-split):not(.live-split)::after {
    content: "" !important;
    display: block !important;
    position: absolute;
    z-index: 40;
    top: 9vh;
    bottom: 9vh;
    left: var(--desktop-index-column) !important;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--line) 12%,
      var(--line) 88%,
      transparent 100%
    );
    opacity: .30;
    pointer-events: none;
  }

  /* One index-thumb width across Discography, Video, Merch and Archive. */
  .release-split .release-index,
  .video-split .video-index,
  .merch-split .merch-index,
  .archive-photo-split .photo-index,
  .archive-video-split .archive-video-index {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: clamp(30px, 4vh, 44px) !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
  }

  .release-split .release-index > a,
  .video-split .video-index > a,
  .merch-split .merch-index > a,
  .archive-photo-split .photo-index > a,
  .archive-video-split .archive-video-index > a {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
  }

  .release-split .release-index img,
  .video-split .video-index img,
  .merch-split .merch-index img,
  .archive-photo-split .photo-index img,
  .archive-video-split .archive-video-index img {
    display: block;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
  }

  .release-split .release-index span,
  .video-split .video-index span,
  .merch-split .merch-index span,
  .archive-video-split .archive-video-index span {
    width: 100% !important;
    max-width: none !important;
    margin-top: 9px !important;
  }

  .release-split .release-index img,
  .merch-split .merch-index img { aspect-ratio: 1 / 1; object-fit: cover; }
  .video-split .video-index img,
  .archive-video-split .archive-video-index img { aspect-ratio: 16 / 9; object-fit: cover; }
  .archive-photo-split .photo-index img { height: auto; object-fit: cover; }

  /* Give the wider detail column enough usable content width without turning it into a full-bleed portfolio. */
  .release-split .release-detail {
    --detail-grid-gap: clamp(24px, 2.2vw, 34px) !important;
    grid-template-columns: clamp(120px, 10vw, 155px) minmax(0, 1fr) !important;
    width: min(100%, 700px) !important;
    max-width: 700px !important;
  }
  .merch-split .merch-detail,
  .video-split .works-video-detail,
  .text-detail,
  .note-detail,
  .archive-text-detail {
    width: min(100%, 680px) !important;
    max-width: 680px !important;
  }
  .video-split .video-embed,
  .archive-video-split .video-embed {
    width: min(100%, 760px) !important;
    max-width: 760px !important;
  }

  /* Archive Photo/Video use the wider detail field more fully. */
  .archive-photo-split .photo-detail {
    width: min(100%, 780px) !important;
    max-width: 780px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .archive-photo-split .photo-selected {
    width: min(100%, 760px) !important;
    max-width: 760px !important;
    height: auto !important;
  }
  .archive-video-split .video-detail {
    width: min(100%, 780px) !important;
    max-width: 780px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .release-split > .detail-panel,
  .video-split > .detail-panel,
  .merch-split > .detail-panel,
  .archive-photo-split > .detail-panel,
  .archive-video-split > .detail-panel {
    position: sticky;
    top: 0;
    align-self: start;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg);
  }
}

@media (max-width: 820px) {
  .archive-desktop-only { display: none !important; }
  .archive-mobile-only { display: block !important; }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="unified-desktop-grid-style"')) {
    return html.replace(/<style id="unified-desktop-grid-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

function mainInner(html) {
  return html.match(/<main class="site-main">([\s\S]*?)<\/main>/)?.[1] || "";
}

function indexPanelFromDetail(html) {
  return html.match(/<section class="index-panel">([\s\S]*?)<\/section><section class="detail-panel">/)?.[1] || "";
}

function cleanSelected(html) {
  return html.replace(/ class="is-selected" aria-current="page"/g, "").replace(/ class="is-selected"/g, "");
}

function firstDetailFile(dir) {
  if (!fs.existsSync(dir)) return "";
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name, "index.html"))
    .find((file) => fs.existsSync(file)) || "";
}

function replaceMain(html, replacement) {
  if (!/<main class="site-main">[\s\S]*?<\/main>/.test(html)) {
    throw new Error("UNIFIED DESKTOP GRID ERROR: main region not found.");
  }
  return html.replace(/<main class="site-main">[\s\S]*?<\/main>/, replacement);
}

function markSplit(html, className) {
  return html.replace(/class="split-layout(?:\s+[^"]*)?"/, (value) => {
    if (value.includes(className)) return value;
    const classes = value.slice(7, -1).trim().split(/\s+/).filter(Boolean);
    if (!classes.includes("split-layout")) classes.unshift("split-layout");
    classes.push(className, "has-detail");
    return `class="${[...new Set(classes)].join(" ")}"`;
  });
}

function photoLandingIndex(indexHtml) {
  return cleanSelected(indexHtml)
    .replace(/<a href="#([^"]+)" data-panel-target="([^"]+)"/g, (match, hrefId, panelId) => {
      const id = panelId || hrefId;
      const parsed = id.match(/^photo-(.+)-(\d+)$/);
      if (!parsed) return match;
      const slug = parsed[1];
      return `<a href="/archive/photo-video/${slug}#${id}"`;
    });
}

function buildDesktopLanding(landingFile, detailFile, splitClass, cleanIndex = cleanSelected) {
  if (!landingFile || !detailFile || !fs.existsSync(landingFile) || !fs.existsSync(detailFile)) return;

  let landing = fs.readFileSync(landingFile, "utf8");
  const originalInner = mainInner(landing);
  const detailHtml = fs.readFileSync(detailFile, "utf8");
  const index = indexPanelFromDetail(detailHtml);
  if (!originalInner || !index) throw new Error(`UNIFIED DESKTOP GRID ERROR: landing/index extraction failed for ${landingFile}`);

  const desktop = `<div class="archive-desktop-only"><div class="split-layout ${splitClass}"><section class="index-panel">${cleanIndex(index)}</section><section class="detail-panel"></section></div></div>`;
  const mobile = `<div class="archive-mobile-only">${originalInner}</div>`;
  landing = replaceMain(landing, `<main class="site-main">${desktop}${mobile}</main>`);
  fs.writeFileSync(landingFile, ensureStyle(landing));
}

const photoDir = path.join(ROOT, "archive", "photo-video");
const photoDetail = firstDetailFile(photoDir);
if (photoDetail) {
  for (const file of [path.join(ROOT, "archive", "index.html"), path.join(photoDir, "index.html")]) {
    buildDesktopLanding(file, photoDetail, "archive-photo-split", photoLandingIndex);
  }
  for (const entry of fs.readdirSync(photoDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(photoDir, entry.name, "index.html");
    if (!fs.existsSync(file)) continue;
    let html = markSplit(fs.readFileSync(file, "utf8"), "archive-photo-split");
    fs.writeFileSync(file, ensureStyle(html));
  }
}

const videoDir = path.join(ROOT, "archive", "videos");
const videoDetail = firstDetailFile(videoDir);
if (videoDetail) {
  buildDesktopLanding(path.join(videoDir, "index.html"), videoDetail, "archive-video-split");
  for (const entry of fs.readdirSync(videoDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(videoDir, entry.name, "index.html");
    if (!fs.existsSync(file)) continue;
    let html = markSplit(fs.readFileSync(file, "utf8"), "archive-video-split");
    fs.writeFileSync(file, ensureStyle(html));
  }
}

console.log("Unified desktop list/detail dividers, thumbnail widths, detail widths, and Archive desktop landing behavior.");
