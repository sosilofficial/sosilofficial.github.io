import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DISCO_DIR = path.join(ROOT, "works", "discography");
const LANDING = path.join(DISCO_DIR, "index.html");

const STYLE = `<style id="stable-discography-layout-style">
@media (min-width: 821px) {
  .release-split .index-panel {
    padding-left: var(--pad);
    padding-right: var(--pad);
  }
  .release-split .release-index {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(34px, 4.2vh, 48px);
    width: 100%;
  }
  .release-split .release-index > a {
    display: block;
    width: 100%;
    padding: 0;
  }
  .release-split .release-index > a.is-selected {
    background: rgba(72, 80, 91, .025);
  }
  .release-split .release-index img {
    width: 100%;
    max-width: none;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }
  .release-split .release-index span {
    width: 100%;
    margin-top: 9px;
  }
  .release-split .release-index strong {
    font-size: .83rem;
    line-height: 1.42;
  }
  .release-split .release-index small {
    margin-top: 3px;
    color: var(--muted);
    opacity: .72;
    font-size: .62rem;
    letter-spacing: .02em;
  }
  .release-split .detail-panel {
    position: sticky;
    top: 0;
    align-self: start;
    height: 100vh;
    overflow-y: auto;
  }
  .release-split .release-detail {
    margin: 0 auto;
    padding-top: clamp(28px, 4vh, 44px);
    max-width: 560px;
  }
  .release-split .release-detail header {
    margin: 0 0 clamp(34px, 5vh, 56px);
  }
  .release-split .release-detail header h1 {
    margin-bottom: 7px;
    font-size: clamp(1.16rem, 1.8vw, 1.68rem);
    line-height: 1.3;
  }
  .release-split .release-detail header p {
    margin-bottom: 5px;
    font-size: .66rem;
    line-height: 1.5;
    color: var(--muted);
  }
  .release-split .release-hero {
    width: min(82%, 470px);
  }
  .release-split .detail-section {
    margin-top: clamp(50px, 7vh, 84px);
  }
  .release-split .detail-section h2 {
    margin-bottom: 16px;
    color: var(--muted);
    opacity: .72;
    font-size: .61rem;
    letter-spacing: .06em;
    text-transform: lowercase;
  }
  .release-split .track-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .release-split .track-list li {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    gap: 0 10px;
    padding: 0;
    font-size: .69rem;
    line-height: 1.48;
    letter-spacing: .004em;
  }
  .release-split .track-list li span:first-child {
    color: var(--muted);
    opacity: .58;
    font-size: .61rem;
  }
  .release-split .liner-notes {
    max-width: 50ch;
    margin-top: clamp(64px, 9vh, 110px);
    line-height: 1.78;
  }
  .release-split .external-links {
    margin-top: clamp(54px, 8vh, 96px);
    padding-bottom: 44px;
  }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="stable-discography-layout-style"')) {
    return html.replace(/<style id="stable-discography-layout-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

if (!fs.existsSync(LANDING)) {
  console.log("Discography landing not found; skipping layout pass.");
  process.exit(0);
}

const detailFiles = fs.readdirSync(DISCO_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(DISCO_DIR, entry.name, "index.html"))
  .filter((file) => fs.existsSync(file));

if (!detailFiles.length) {
  console.log("No Discography detail pages found; skipping layout pass.");
  process.exit(0);
}

const template = fs.readFileSync(detailFiles[0], "utf8");
const indexPanel = template.match(/<section class="index-panel">([\s\S]*?)<\/section><section class="detail-panel">/)?.[1];
if (!indexPanel) throw new Error("DISCOGRAPHY LAYOUT ERROR: index panel could not be extracted.");

const cleanIndexPanel = indexPanel
  .replace(/ class="is-selected" aria-current="page"/g, "")
  .replace(/<div class="release-tracklist-left">[\s\S]*?<\/div>/g, "");

let landing = fs.readFileSync(LANDING, "utf8");
const landingReplacement = `<main class="site-main"><div class="split-layout release-split"><section class="index-panel">${cleanIndexPanel}</section><section class="detail-panel"></section></div></main>`;
if (!/<main class="site-main">[\s\S]*?<\/main>/.test(landing)) {
  throw new Error("DISCOGRAPHY LAYOUT ERROR: landing main region not found.");
}
landing = ensureStyle(landing.replace(/<main class="site-main">[\s\S]*?<\/main>/, landingReplacement));
fs.writeFileSync(LANDING, landing);

for (const file of detailFiles) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<div class="release-tracklist-left">[\s\S]*?<\/div>/g, "");
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Applied Merch-like Discography split layout with a stable left index and right-side detail panel.");
