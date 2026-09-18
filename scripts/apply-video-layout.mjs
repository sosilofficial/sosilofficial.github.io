import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const VIDEO_DIR = path.join(ROOT, "works", "videos");
const LANDING = path.join(VIDEO_DIR, "index.html");
const STYLE = `<style id="stable-video-index-style">
@media (min-width: 821px) {
  .video-split .index-panel {
    padding-left: var(--pad);
    padding-right: var(--pad);
  }
  .video-split .video-index {
    display: grid;
    gap: clamp(34px, 4.2vh, 48px);
    width: 100%;
  }
  .video-split .video-index a {
    display: block;
    width: 100%;
    padding: 0;
  }
  .video-split .video-index img {
    width: 100%;
    max-width: none;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
  .video-split .video-index span {
    width: 100%;
    margin-top: 9px;
  }
  .video-split .detail-panel {
    position: sticky;
    top: 0;
    align-self: start;
    width: auto;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
    z-index: 5;
  }
  .video-split .works-video-detail {
    position: relative;
    margin: clamp(28px, 4vh, 44px) auto 0;
  }
  .video-split .detail-panel:empty {
    pointer-events: none;
  }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="stable-video-index-style"')) {
    return html.replace(/<style id="stable-video-index-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

if (!fs.existsSync(LANDING)) {
  console.log("Works video landing not found; skipping stable video layout.");
  process.exit(0);
}

const detailFiles = fs.existsSync(VIDEO_DIR)
  ? fs.readdirSync(VIDEO_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(VIDEO_DIR, entry.name, "index.html"))
      .filter((file) => fs.existsSync(file))
  : [];

if (!detailFiles.length) {
  console.log("No Works video detail pages found; leaving empty landing as generated.");
  process.exit(0);
}

const template = fs.readFileSync(detailFiles[0], "utf8");
const indexPanel = template.match(/<section class="index-panel">([\s\S]*?)<\/section><section class="detail-panel">/)?.[1];

if (!indexPanel) {
  throw new Error("VIDEO LAYOUT ERROR: detail page index panel could not be extracted.");
}

const cleanIndexPanel = indexPanel.replace(/ class="is-selected" aria-current="page"/g, "");
let landing = fs.readFileSync(LANDING, "utf8");
const replacement = `<main class="site-main"><div class="split-layout video-split"><section class="index-panel">${cleanIndexPanel}</section><section class="detail-panel"></section></div></main>`;

if (!/<main class="site-main">[\s\S]*?<\/main>/.test(landing)) {
  throw new Error("VIDEO LAYOUT ERROR: landing main region not found.");
}

landing = ensureStyle(landing.replace(/<main class="site-main">[\s\S]*?<\/main>/, replacement));
fs.writeFileSync(LANDING, landing);

for (const file of detailFiles) {
  const html = ensureStyle(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, html);
}

console.log("Applied stable Works video index layout with grid-aligned sticky detail for every video.");
