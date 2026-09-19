import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const STYLE = `<style id="category-grid-style">
:root {
  --category-top-y: clamp(48px, 6.8vh, 70px);
  --category-x: clamp(30px, 2.75vw, 44px);
}

.category-top {
  margin: 0 0 clamp(44px, 6vh, 72px);
}
.category-top h1 {
  margin: 0 0 24px !important;
  font-family: var(--font-ui, "American Typewriter", "Courier Prime", "Courier New", monospace) !important;
  font-size: 1.08rem !important;
  font-weight: 400 !important;
  line-height: 1.2 !important;
  letter-spacing: .02em !important;
  text-transform: lowercase;
}
.category-top .subnav {
  margin: 0 !important;
}
.panel-headline > .category-top {
  margin-bottom: 0 !important;
}

@media (min-width: 821px) {
  /* Category labels use the same top and inner-left coordinates as the sosil brand. */
  .split-layout > .index-panel {
    padding-top: var(--category-top-y) !important;
    padding-left: var(--category-x) !important;
  }
  .site-main > .wide-page,
  .site-main > .archive-text-flat-page {
    padding-top: var(--category-top-y) !important;
    padding-left: var(--category-x) !important;
  }
  .info-split > .index-panel {
    padding-top: var(--category-top-y) !important;
    padding-left: var(--category-x) !important;
  }
  .contact-page {
    padding-top: var(--category-top-y) !important;
    padding-left: var(--category-x) !important;
  }

  .works-top.category-top h1,
  .archive-top.category-top h1 {
    font-size: 1.08rem !important;
  }
}

@media (max-width: 820px) {
  .category-top {
    margin-bottom: 44px;
  }
  .category-top h1 {
    margin-bottom: 18px !important;
    font-size: .92rem !important;
  }
}
</style>`;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if ([".git", "node_modules", "content", "scripts", "samples"].includes(entry.name)) return [];
    return entry.isDirectory() ? walk(full) : entry.name === "index.html" ? [full] : [];
  });
}

function ensureStyle(html) {
  if (html.includes('id="category-grid-style"')) {
    return html.replace(/<style id="category-grid-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
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
  if (panel.test(html)) return html.replace(panel, categoryHeader(label));
  return html;
}

function normalizeInfo(html) {
  html = html.replace('<article class="info-copy"><h1>info</h1>', '<article class="info-copy">');
  if (html.includes('class="category-top info-top"')) return html;
  return html.replace(
    '<section class="index-panel"><aside class="info-aside">',
    `<section class="index-panel"><header class="category-top info-top"><h1>info</h1></header><aside class="info-aside">`
  );
}

function normalizeContact(html) {
  if (html.includes('class="category-top contact-top"')) return html;
  return html.replace(
    '<article class="contact-page"><h1>contact</h1>',
    '<article class="contact-page"><header class="category-top contact-top"><h1>contact</h1></header>'
  );
}

for (const file of walk(ROOT)) {
  if (file === path.join(ROOT, "index.html")) continue;
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("</head>")) continue;

  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  if (relative.startsWith("works/")) html = addWorksHeaderClass(html);
  if (relative.startsWith("archive/") || relative === "archive/index.html") html = addArchiveHeader(html);
  if (relative.startsWith("news/")) html = addSingleHeader(html, "news");
  if (relative.startsWith("notes/") || relative.startsWith("gibberish/")) html = addSingleHeader(html, "notes");
  if (relative.startsWith("merch/")) html = addSingleHeader(html, "merch");
  if (relative === "info/index.html") html = normalizeInfo(html);
  if (relative === "contact/index.html") html = normalizeContact(html);

  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Unified category headers, added Archive hierarchy, and aligned category coordinates with the sosil brand grid.");
