import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DISCO_DIR = path.join(ROOT, "works", "discography");
const LANDING = path.join(DISCO_DIR, "index.html");

const STYLE = `<style id="stable-discography-layout-style">
@media (min-width: 821px) {
  .release-split {
    display: grid !important;
    grid-template-columns: var(--index) var(--detail) !important;
    min-height: 100vh !important;
  }
  .release-split > .index-panel {
    display: block !important;
    min-width: 0;
    padding: var(--pad) !important;
  }
  .release-split .panel-headline { margin-bottom: clamp(36px, 6vh, 76px) !important; }
  .release-split .works-top { display: block !important; }
  .release-split .works-top h1 {
    margin: 0 0 var(--space-md) !important;
    font-size: 1.08rem !important;
  }
  .release-split .works-top .subnav {
    display: flex !important;
    gap: clamp(16px, 2vw, 32px) !important;
    margin: 0 !important;
  }
  .release-split .works-top .subnav::before { content: none !important; }
  .release-split .works-top .subnav a { display: inline !important; }
  .release-split .works-top .subnav a.is-active {
    color: var(--ink) !important;
    text-decoration: underline !important;
    text-underline-offset: 4px;
  }

  .release-split .release-index {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: clamp(34px, 4.2vh, 48px) !important;
    width: 100%;
  }
  .release-split .release-index > a {
    display: block;
    width: 100%;
    padding: 0 !important;
  }
  .release-split .release-index > a.is-selected { background: rgba(72, 80, 91, .018); }
  .release-split .release-index img {
    width: 100% !important;
    max-width: none !important;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }
  .release-split .release-index span {
    width: 100% !important;
    margin-top: 9px;
  }
  .release-split .release-index strong {
    font-size: .8rem;
    line-height: 1.4;
  }
  .release-split .release-index small {
    margin-top: 3px;
    color: var(--muted);
    opacity: .66;
    font-size: .6rem;
    letter-spacing: .02em;
  }

  .release-split > .detail-panel {
    position: sticky !important;
    top: 0;
    align-self: start;
    min-width: 0;
    height: 100vh;
    overflow-y: auto;
    border-left: 1px solid var(--line) !important;
    padding: var(--pad) !important;
  }
  .release-split .release-detail {
    position: relative;
    display: grid !important;
    grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
    column-gap: clamp(28px, 3.2vw, 52px);
    row-gap: clamp(28px, 4vh, 46px);
    width: min(100%, 760px) !important;
    max-width: 760px !important;
    margin: 0 auto !important;
    padding: clamp(28px, 4vh, 42px) clamp(4px, .5vw, 10px) 72px !important;
    align-items: start;
  }
  .release-split .release-detail .close-detail {
    position: absolute !important;
    top: 0;
    right: 0;
    float: none !important;
    display: grid;
    place-items: center;
    width: 28px !important;
    height: 28px !important;
    margin: 0 !important;
    padding: 0 !important;
    color: var(--ink) !important;
    font-size: 1.15rem !important;
    opacity: .62;
  }
  .release-split .release-detail .close-detail::after { content: none !important; }
  .release-split .release-detail header {
    grid-column: 1 / -1;
    margin: 0 !important;
    padding-right: 40px !important;
  }
  .release-split .release-detail header p {
    margin: 0 0 4px;
    color: var(--muted);
    opacity: .72;
    font-size: .59rem;
    line-height: 1.45;
    letter-spacing: .035em;
  }
  .release-split .release-detail header h1 {
    max-width: 30ch !important;
    margin: 0 0 5px;
    font-size: clamp(.84rem, 1.05vw, 1rem) !important;
    line-height: 1.42;
    letter-spacing: .008em;
  }
  .release-split .release-hero {
    grid-column: 1;
    grid-row: 2 / span 5;
    display: block;
    width: 100% !important;
    max-width: 180px !important;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    filter: saturate(.84) contrast(.95);
  }
  .release-split .detail-section {
    width: 100%;
    margin: 0 !important;
  }
  .release-split .release-tracklist-section { grid-column: 2; }
  .release-split .release-credits-section { grid-column: 2; }
  .release-split .detail-section h2 {
    margin: 0 0 15px;
    color: var(--muted);
    opacity: .68;
    font-size: .56rem;
    font-weight: 400;
    letter-spacing: .08em;
    text-transform: lowercase;
  }
  .release-split .track-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .release-split .track-list li {
    display: grid;
    grid-template-columns: 1.7rem minmax(0, 1fr);
    gap: 0 10px;
    padding: 0;
    font-size: .63rem;
    line-height: 1.48;
    letter-spacing: 0;
  }
  .release-split .track-list li span:first-child {
    color: var(--muted);
    opacity: .5;
    font-size: .55rem;
  }
  .release-split .release-credits-section p {
    margin: 0;
    color: var(--muted);
    font-size: .62rem;
    line-height: 1.7;
    white-space: pre-line;
  }
  .release-split .liner-notes {
    grid-column: 2;
    max-width: 54ch;
    margin: 0 !important;
    font-size: .65rem;
    line-height: 1.82;
    letter-spacing: .004em;
  }
  .release-split .liner-notes p { margin: 0 0 1.85em; }
  .release-split .external-links {
    grid-column: 2;
    display: flex !important;
    margin: 0 !important;
    padding-bottom: 18px;
    gap: 12px 24px;
    font-size: .62rem;
  }
  .release-split .external-links a { border-bottom-color: rgba(17, 21, 27, .5); }
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
  html = html.replace(/<section class="detail-section"><h2>tracklist<\/h2>/gi, '<section class="detail-section release-tracklist-section"><h2>tracklist</h2>');
  html = html.replace(/<section class="detail-section"><h2>credits<\/h2>/gi, '<section class="detail-section release-credits-section"><h2>credits</h2>');
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Reworked Discography detail into compact cover + full-height right content column.");
