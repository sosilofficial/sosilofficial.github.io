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
  .release-split .release-tracklist-left {
    margin: -20px 0 4px;
    padding: 0 2px;
    max-width: 34rem;
  }
  .release-split .release-tracklist-left h2 {
    margin: 0 0 13px;
    color: var(--muted);
    font-size: .64rem;
    font-weight: 400;
    letter-spacing: .045em;
    text-transform: lowercase;
  }
  .release-split .release-tracklist-left .track-list {
    display: grid;
    gap: 7px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .release-split .release-tracklist-left .track-list li {
    display: grid;
    grid-template-columns: 2.2rem minmax(0, 1fr);
    gap: 0 8px;
    padding: 0;
    font-size: .68rem;
    line-height: 1.45;
    letter-spacing: .008em;
  }
  .release-split .release-tracklist-left .track-list li span:first-child {
    color: var(--muted);
    opacity: .7;
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
  }
  .release-split .release-detail header {
    margin-top: 0;
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

const cleanIndexPanel = indexPanel.replace(/ class="is-selected" aria-current="page"/g, "");
let landing = fs.readFileSync(LANDING, "utf8");
const landingReplacement = `<main class="site-main"><div class="split-layout release-split"><section class="index-panel">${cleanIndexPanel}</section><section class="detail-panel"></section></div></main>`;
if (!/<main class="site-main">[\s\S]*?<\/main>/.test(landing)) {
  throw new Error("DISCOGRAPHY LAYOUT ERROR: landing main region not found.");
}
landing = ensureStyle(landing.replace(/<main class="site-main">[\s\S]*?<\/main>/, landingReplacement));
fs.writeFileSync(LANDING, landing);

for (const file of detailFiles) {
  let html = fs.readFileSync(file, "utf8");
  const trackSection = html.match(/<section class="detail-section"><h2>tracklist<\/h2>([\s\S]*?)<\/section>/i);
  if (trackSection) {
    const leftTracklist = `<div class="release-tracklist-left"><h2>tracklist</h2>${trackSection[1]}</div>`;
    html = html.replace(trackSection[0], "");
    html = html.replace(/(<a href="[^"]+" class="is-selected" aria-current="page">[\s\S]*?<\/a>)/, `$1${leftTracklist}`);
  }
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Applied video-like Discography index spacing, fixed detail column, and minimal left tracklists.");
