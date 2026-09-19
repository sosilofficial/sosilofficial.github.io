import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DISCO_DIR = path.join(ROOT, "works", "discography");
const LANDING = path.join(DISCO_DIR, "index.html");

const STYLE = `<style id="stable-discography-layout-style">
@media (min-width: 821px) {
  /* Keep the same complete Works navigation used by Video / Live / Others. */
  .release-split .works-top {
    display: block;
  }
  .release-split .works-top h1 {
    margin: 0 0 var(--space-md);
    font-size: 1.08rem;
    letter-spacing: .02em;
  }
  .release-split .works-top .subnav {
    display: flex;
    gap: clamp(16px, 2vw, 32px);
    margin: 0;
  }
  .release-split .works-top .subnav::before {
    content: none;
  }
  .release-split .works-top .subnav a,
  .release-split .works-top .subnav a:not(.is-active) {
    display: inline-block !important;
  }
  .release-split .works-top .subnav a:not(.is-active) {
    color: var(--muted);
    text-decoration: none;
  }
  .release-split .works-top .subnav a.is-active {
    display: inline-block !important;
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  /* Outer split coordinates now come from the shared UI pass. */
  .release-split > .detail-panel {
    position: sticky;
    top: 0;
    align-self: start;
    height: 100vh;
    overflow-y: auto;
    background: var(--bg);
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
  .release-split .release-index > a.is-selected { background: rgba(72, 80, 91, .018); }
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

  .release-split .release-detail {
    --detail-grid-gap: clamp(28px, 3vw, 44px);
    position: relative;
    display: grid;
    grid-template-columns: clamp(112px, 12vw, 150px) minmax(0, 1fr);
    column-gap: var(--detail-grid-gap);
    row-gap: var(--detail-grid-gap);
    align-items: start;
    width: min(100%, 760px);
    max-width: 760px;
    margin: 0 auto;
    padding: clamp(28px, 4vh, 42px) clamp(4px, .5vw, 10px) 72px;
  }
  .release-split .release-detail .close-detail {
    position: absolute;
    top: 0;
    right: 0;
    float: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    margin: 0;
    padding: 0;
    color: var(--ink);
    font-size: 1.15rem;
    opacity: .62;
  }
  .release-split .release-detail .close-detail::after { content: none; }
  .release-split .release-detail header {
    grid-column: 1 / -1;
    margin: 0;
    padding-right: 40px;
  }
  .release-split .release-detail header p {
    margin: 0 0 4px;
    color: var(--muted);
    opacity: .72;
    font-size: .72rem;
    line-height: 1.45;
    letter-spacing: .035em;
  }
  .release-split .release-detail header h1 {
    max-width: 30ch;
    margin: 0 0 5px;
    font-size: clamp(.97rem, 1.05vw, 1.13rem);
    line-height: 1.42;
    letter-spacing: .008em;
  }

  .release-split .release-hero {
    grid-column: 1;
    grid-row: 2;
    display: block;
    width: 100%;
    max-width: none;
    margin: 0;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    filter: saturate(.84) contrast(.95);
  }
  .release-split .detail-section {
    width: auto;
    margin: 0;
  }
  .release-split .release-tracklist-section {
    grid-column: 2;
    grid-row: 2;
    align-self: start;
  }
  .release-split .release-credits-section {
    grid-column: 1 / -1;
    margin: 0;
  }
  .release-split .detail-section h2 {
    margin: 0 0 13px;
    color: var(--muted);
    opacity: .66;
    font-size: .68rem;
    font-weight: 400;
    letter-spacing: .08em;
    text-transform: lowercase;
  }
  .release-split .track-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(5, auto);
    grid-auto-flow: column;
    column-gap: clamp(16px, 1.8vw, 26px);
    row-gap: 7px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .release-split .track-list li {
    min-width: 0;
    display: grid;
    grid-template-columns: 1.25rem max-content;
    gap: 0 5px;
    padding: 0;
    font-size: .73rem;
    line-height: 1.46;
    letter-spacing: 0;
  }
  .release-split .track-list li span:first-child {
    color: var(--muted);
    opacity: .48;
    font-size: .67rem;
  }
  .release-split .track-list li span:last-child { white-space: nowrap; }
  .release-split .release-credits-section p {
    margin: 0;
    color: var(--muted);
    font-size: .74rem;
    line-height: 1.7;
    white-space: pre-line;
  }
  .release-split .liner-notes {
    grid-column: 1 / -1;
    width: 100%;
    max-width: none;
    margin: 0;
    font-size: .77rem;
    line-height: 1.86;
    letter-spacing: .003em;
  }
  .release-split .liner-notes p {
    max-width: none;
    margin: 0 0 1.9em;
  }
  .release-split .external-links {
    grid-column: 1 / -1;
    display: flex;
    margin: 0;
    padding-bottom: 18px;
    gap: 12px 24px;
    font-size: .74rem;
  }
  .release-split .external-links a { border-bottom-color: rgba(17, 21, 27, .5); }
}

@media (max-width: 820px) {
  /* On a selected release, keep Works context but remove the long list above the detail. */
  .release-split.has-detail .release-index { display: none !important; }
  .release-split.has-detail > .index-panel { padding-bottom: 0; }
  .release-split.has-detail .panel-headline { margin-bottom: 18px; }
  .release-split.has-detail > .detail-panel { padding-top: 0; }
  .release-split.has-detail .release-detail {
    max-width: none;
    margin-top: 0;
  }
  .release-split.has-detail .release-detail header { margin-top: 0; }
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
  html = html.replace('class="split-layout release-split"', 'class="split-layout release-split has-detail"');
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Restored the complete Works subnavigation and kept Discography on the shared grid.");
