import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MERCH_DIR = path.join(ROOT, "merch");
const LANDING = path.join(MERCH_DIR, "index.html");

const STYLE = `<style id="stable-merch-layout-style">
@media (min-width: 821px) {
  .merch-split .index-panel {
    padding-left: var(--pad);
    padding-right: var(--pad);
  }
  .merch-split .merch-index {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(34px, 4.2vh, 48px);
    width: 100%;
  }
  .merch-split .merch-index > a {
    display: block;
    width: 100%;
    padding: 0;
  }
  .merch-split .merch-index > a.is-selected {
    background: rgba(72, 80, 91, .025);
  }
  .merch-split .merch-index img {
    width: 100%;
    max-width: none;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }
  .merch-split .merch-index span {
    width: 100%;
    margin-top: 9px;
  }
  .merch-split .detail-panel {
    position: sticky;
    top: 0;
    align-self: start;
    height: 100vh;
    overflow: hidden;
  }
  .merch-split .merch-detail {
    width: min(100%, 620px);
    max-width: 620px;
    margin: calc(1.55em + clamp(44px, 8vh, 100px)) auto 0;
  }
  .merch-split .merch-detail h1 {
    max-width: 34ch;
    margin: 0 0 clamp(22px, 3vh, 32px);
    font-size: clamp(.92rem, 1.35vw, 1.2rem);
    line-height: 1.42;
  }
  .merch-split .merch-gallery {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(10px, 1.4vw, 18px);
    margin: 0 0 clamp(24px, 3.5vh, 36px);
  }
  .merch-split .merch-gallery img {
    width: 100%;
    max-width: none;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }
  .merch-split .purchase-links {
    margin-top: 0;
    padding-bottom: 24px;
  }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="stable-merch-layout-style"')) {
    return html.replace(/<style id="stable-merch-layout-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

if (!fs.existsSync(LANDING)) {
  console.log("Merch landing not found; skipping stable merch layout.");
  process.exit(0);
}

let html = fs.readFileSync(LANDING, "utf8");

if (!html.includes('class="split-layout merch-split"')) {
  throw new Error("MERCH LAYOUT ERROR: merch split layout not found.");
}

html = ensureStyle(html
  .replace(/ class="is-selected" aria-current="page"/g, "")
  .replace(/<section class="detail-panel">[\s\S]*?<\/section>/, '<section class="detail-panel"></section>'));

fs.writeFileSync(LANDING, html);

const detailFiles = fs.readdirSync(MERCH_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(MERCH_DIR, entry.name, "index.html"))
  .filter((file) => fs.existsSync(file));

for (const file of detailFiles) {
  const detailHtml = ensureStyle(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, detailHtml);
}

console.log("Applied large Merch index images, aligned detail heading grid, and compact desktop detail gallery.");
