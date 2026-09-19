import fs from "node:fs";
import path from "node:path";

// Final frontend pass: one shared source of truth for typography, grids and dividers.
const ROOT = process.cwd();

const STYLE = `<style id="shared-ui-style">
:root {
  --font-ui: "American Typewriter", "Courier Prime", "Courier New", "Apple SD Gothic Neo", "Noto Sans KR", monospace;
  --font-content: "Helvetica Neue", Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  --category-top-y: clamp(48px, 6.8vh, 70px);
  --category-x: clamp(30px, 2.75vw, 44px);
}

/* readable content */
.home-intro p,
.home-news > a:not(.small-link),
.mailing-copy,
.home-mailing input,
.release-grid strong,
.release-index strong,
.release-detail header h1,
.track-list li span:last-child,
.release-credits-section p,
.liner-notes,
.external-links a,
.work-video-grid strong,
.video-index strong,
.video-detail h1,
.video-detail .prose,
.media-credit,
.summary,
.live-row .live-title,
.live-row .live-artists,
.live-row .live-venue,
.text-index strong,
.note-index strong,
.others-index strong,
.others-index em,
.text-detail h1,
.text-detail .prose,
.photo-detail h1,
.photo-detail .prose,
.archive-video-grid strong,
.archive-text-detail h1,
.archive-text-detail .prose,
.merch-index strong,
.merch-detail h1,
.merch-detail p,
.purchase-links a,
.info-korean,
.info-english,
.info-aside figcaption,
.contact-page p,
.contact-page dd,
.contact-page dd a {
  font-family: var(--font-content);
  letter-spacing: 0;
}

/* structural labels */
.site-brand,
.rail-nav,
.panel-title,
.panel-headline,
.works-top,
.subnav,
.section-kicker,
.live-log h2,
.live-row time,
.release-detail header p,
.detail-section h2,
.track-list li span:first-child,
.release-grid small,
.release-index small,
.video-index small,
.work-video-grid small,
.archive-video-grid small,
.text-index span,
.note-index span,
.merch-data,
.info-copy h1,
.info-aside nav,
.contact-page h1,
.contact-page dt,
.home-news h2,
.home-mailing h2,
.home-news p,
.home-news .small-link {
  font-family: var(--font-ui);
}

.category-top {
  margin: 0 0 clamp(44px, 6vh, 72px);
}
.category-top h1 {
  margin: 0 0 24px;
  font-family: var(--font-ui);
  font-size: 1.08rem;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: .02em;
  text-transform: lowercase;
}
.category-top .subnav { margin: 0; }
.panel-headline > .category-top { margin-bottom: 0; }
.info-top-spacer {
  visibility: hidden;
  pointer-events: none;
}

@media (min-width: 821px) {
  html { scrollbar-gutter: stable; }

  .site-main {
    margin-left: max(var(--sidebar), 118px);
    width: calc(100% - max(var(--sidebar), 118px));
    max-width: none;
  }

  .side-rail { border-right: 0; }
  .side-rail::after {
    content: "";
    position: absolute;
    z-index: 1;
    top: 9vh;
    bottom: 9vh;
    right: 0;
    width: 1px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--line) 14%,
      var(--line) 86%,
      transparent 100%
    );
    opacity: .24;
    pointer-events: none;
  }

  .split-layout:not(.info-split):not(.live-split) {
    display: grid;
    position: relative;
    width: 100%;
    min-width: 0;
    max-width: none;
    grid-template-columns: minmax(0, 38.8888889%) minmax(0, 61.1111111%);
  }
  .split-layout:not(.info-split):not(.live-split) > .index-panel {
    grid-column: 1;
    width: auto;
    min-width: 0;
    max-width: none;
  }
  .split-layout:not(.info-split):not(.live-split) > .detail-panel {
    grid-column: 2;
    width: auto;
    min-width: 0;
    max-width: none;
    left: auto;
    right: auto;
    box-sizing: border-box;
    border-left: 0;
  }
  .split-layout:not(.info-split):not(.live-split)::after {
    content: "";
    position: absolute;
    z-index: 40;
    top: 9vh;
    bottom: 9vh;
    left: 38.8888889%;
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

  .split-layout > .index-panel {
    padding-top: var(--category-top-y);
    padding-left: var(--category-x);
  }
  .site-main > .wide-page,
  .site-main > .archive-text-flat-page {
    padding-top: var(--category-top-y);
    padding-left: var(--category-x);
  }
  .contact-page {
    padding-top: var(--category-top-y);
    padding-left: var(--category-x);
  }

  .works-top.category-top,
  .category-top.works-top {
    transform: translateY(3px);
  }

  .info-split {
    display: grid;
    position: relative;
    width: 100%;
    min-width: 0;
    max-width: none;
    grid-template-columns: minmax(0, 42.7%) minmax(0, 57.3%);
  }
  .info-split > .index-panel,
  .info-split > .detail-panel {
    width: auto;
    min-width: 0;
    max-width: none;
    box-sizing: border-box;
    border-left: 0;
    padding-top: var(--category-top-y);
    padding-left: var(--category-x);
    padding-right: var(--category-x);
    padding-bottom: clamp(42px, 5.5vh, 58px);
  }
  .info-split > .index-panel { grid-column: 1; }
  .info-split > .detail-panel {
    grid-column: 2;
    left: auto;
    right: auto;
  }
  .info-split .info-aside,
  .info-split .info-copy {
    margin-top: 0;
    justify-self: start;
  }
  .info-split .info-aside { width: min(100%, 420px); }
  .info-split .info-copy {
    width: min(100%, 40ch);
    max-width: 40ch;
  }
  .info-split .info-korean,
  .info-split .info-english { line-height: 1.66; }
  .info-split .info-korean p,
  .info-split .info-english p { margin: 0 0 16px; }
  .info-split .info-korean p:last-child,
  .info-split .info-english p:last-child { margin-bottom: 0; }
  .info-split .info-copy .section-mark {
    display: block;
    margin: 16px 0;
    line-height: 1;
  }
  .info-split::after { content: none; display: none; }
}

@media (max-width: 820px) {
  .category-top { margin-bottom: 44px; }
  .category-top h1 {
    margin-bottom: 18px;
    font-size: .92rem;
  }
  .contact-page {
    padding: 24px 18px 80px;
  }
  .info-top-spacer { display: none; }
  .info-split .info-korean p,
  .info-split .info-english p { margin-bottom: 16px; }
  .info-split .info-copy .section-mark { margin: 16px 0; }
}
</style>`;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if ([".git", "node_modules", "content", "scripts", "samples"].includes(entry.name)) return [];
    return entry.isDirectory() ? walk(full) : entry.name === "index.html" ? [full] : [];
  });
}

function categoryHeader(label, subnav = "") {
  const extra = label === "works" ? " works-top" : label === "archive" ? " archive-top" : "";
  return `<header class="category-top${extra}"><h1>${label}</h1>${subnav}</header>`;
}

function addWorksHeaderClass(html) {
  return html
    .replaceAll('class="works-top category-top"', 'class="category-top works-top"')
    .replaceAll('class="works-top"', 'class="category-top works-top"');
}

function addArchiveHeader(html) {
  if (html.includes('class="category-top archive-top"')) return html;
  return html.replace(
    /<nav class="subnav" aria-label="archive 하위 메뉴">[\s\S]*?<\/nav>/,
    (nav) => categoryHeader("archive", nav)
  );
}

function addSingleHeader(html, label) {
  if (html.includes(`<h1>${label}</h1>`) && html.includes('class="category-top')) return html;
  const panel = new RegExp(`<div class="panel-title">${label}<\\/div>`);
  return panel.test(html) ? html.replace(panel, categoryHeader(label)) : html;
}

function normalizeInfo(html) {
  html = html.replace('<article class="info-copy"><h1>info</h1>', '<article class="info-copy">');
  if (!html.includes('class="category-top info-top"')) {
    html = html.replace(
      '<section class="index-panel"><aside class="info-aside">',
      '<section class="index-panel"><header class="category-top info-top"><h1>info</h1></header><aside class="info-aside">'
    );
  }
  if (!html.includes('class="category-top info-top info-top-spacer"')) {
    html = html.replace(
      '<section class="detail-panel"><article class="info-copy">',
      '<section class="detail-panel"><div class="category-top info-top info-top-spacer" aria-hidden="true"><h1>info</h1></div><article class="info-copy">'
    );
  }
  return html;
}

function normalizeContact(html) {
  if (!html.includes('class="category-top contact-top"')) {
    html = html.replace(
      '<article class="contact-page"><h1>contact</h1>',
      '<article class="contact-page"><header class="category-top contact-top"><h1>contact</h1></header>'
    );
  }
  return html.replace(
    "for booking, collaboration, video work, or other inquiries.",
    "for booking, collaboration, video work,<br>or other inquiries."
  );
}

function replaceSharedStyle(html) {
  html = html
    .replace(/<style id="global-grid-lines-style">[\s\S]*?<\/style>/g, "")
    .replace(/<style id="content-font-system-style">[\s\S]*?<\/style>/g, "")
    .replace(/<style id="category-grid-style">[\s\S]*?<\/style>/g, "")
    .replace(/<style id="shared-ui-style">[\s\S]*?<\/style>/g, "");
  return html.replace("</head>", `${STYLE}</head>`);
}

for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("</head>")) continue;

  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  if (relative !== "index.html") {
    if (relative.startsWith("works/")) html = addWorksHeaderClass(html);
    if (relative.startsWith("archive/") || relative === "archive/index.html") html = addArchiveHeader(html);
    if (relative.startsWith("news/")) html = addSingleHeader(html, "news");
    if (relative.startsWith("notes/") || relative.startsWith("gibberish/")) html = addSingleHeader(html, "notes");
    if (relative.startsWith("merch/")) html = addSingleHeader(html, "merch");
    if (relative === "info/index.html") html = normalizeInfo(html);
    if (relative === "contact/index.html") html = normalizeContact(html);
  }

  html = replaceSharedStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Applied one shared UI system for typography, category coordinates, dividers, Info rhythm, and mobile Contact alignment.");
