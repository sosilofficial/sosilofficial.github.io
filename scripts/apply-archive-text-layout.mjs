import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEXT_DIR = path.join(ROOT, "archive", "links");
const LANDING = path.join(TEXT_DIR, "index.html");
const files = [];

if (fs.existsSync(LANDING)) files.push(LANDING);
if (fs.existsSync(TEXT_DIR)) {
  for (const entry of fs.readdirSync(TEXT_DIR, { withFileTypes: true })) {
    const file = path.join(TEXT_DIR, entry.name, "index.html");
    if (entry.isDirectory() && fs.existsSync(file)) files.push(file);
  }
}

const STYLE = `<style id="archive-text-layout-style">
@media (min-width: 821px) {
  .archive-text-landing .archive-text-index {
    display: grid;
    gap: clamp(36px, 5vh, 58px);
    width: min(100%, 980px);
  }
  .archive-text-landing .archive-text-index a {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    padding: 0;
    align-items: start;
    justify-items: start;
  }
  .archive-text-landing .archive-text-index span:empty { display: none; }
  .archive-text-landing .archive-text-index strong {
    max-width: 42rem;
    font-size: .84rem;
    line-height: 1.42;
    letter-spacing: .006em;
  }
  .archive-text-landing .archive-text-index small {
    grid-column: 1;
    margin-top: 5px;
    color: var(--muted);
    opacity: .72;
    font-size: .62rem;
    letter-spacing: .03em;
  }
  .archive-text-landing .archive-text-index a.is-selected { background: transparent; }

  .archive-text-detail-page {
    position: relative;
  }
  .archive-text-detail-page > .subnav {
    margin-bottom: clamp(52px, 7vh, 86px);
  }
  .archive-text-detail-page .archive-text-detail {
    position: relative;
    width: min(100%, 980px);
    max-width: 980px;
    margin: 0;
    padding-right: 150px;
  }
  .archive-text-detail-page .archive-text-detail .close-detail {
    position: absolute;
    top: 0;
    right: 0;
    float: none;
    width: auto;
    height: auto;
    margin: 0;
    padding: 0;
    color: transparent;
    font-size: 0;
  }
  .archive-text-detail-page .archive-text-detail .close-detail::after {
    content: "back to text";
    color: var(--muted);
    font-size: .76rem;
  }
  .archive-text-detail-page .archive-text-detail > p:first-of-type:empty { display: none; }
  .archive-text-detail-page .archive-text-detail h1 {
    max-width: 34ch;
    margin: 0 0 8px;
    font-size: clamp(1.02rem, 1.35vw, 1.28rem);
    line-height: 1.35;
  }
  .archive-text-detail-page .archive-text-detail .publisher {
    margin: 0 0 clamp(34px, 5vh, 58px);
    color: var(--muted);
  }
  .archive-text-detail-page .source-link {
    width: min(100%, 680px);
    margin-top: clamp(34px, 5vh, 58px);
  }
  .archive-text-detail-page .prose {
    width: min(100%, 680px);
    max-width: 680px;
    line-height: 1.82;
  }
}
@media (max-width: 820px) {
  .archive-text-detail-page .archive-text-detail { position: relative; }
  .archive-text-detail-page .archive-text-detail .close-detail {
    position: static;
    float: none;
    display: inline-block;
    width: auto;
    height: auto;
    margin: 0 0 28px;
    color: var(--muted);
    font-size: 0;
  }
  .archive-text-detail-page .archive-text-detail .close-detail::after {
    content: "back to text";
    font-size: .73rem;
  }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="archive-text-layout-style"')) {
    return html.replace(/<style id="archive-text-layout-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

function convertLanding(html) {
  const subnav = html.match(/<nav class="subnav" aria-label="archive 하위 메뉴">[\s\S]*?<\/nav>/)?.[0] || "";
  const index = html.match(/<div class="text-index archive-text-index">[\s\S]*?<\/div>/)?.[0] || "";
  if (!subnav || !index) return html;
  const main = `<main class="site-main"><div class="wide-page archive-text-landing">${subnav}${index}</div></main>`;
  return html.replace(/<main class="site-main">[\s\S]*?<\/main>/, main);
}

function convertDetail(html) {
  const subnav = html.match(/<nav class="subnav" aria-label="archive 하위 메뉴">[\s\S]*?<\/nav>/)?.[0] || "";
  const article = html.match(/<article class="text-detail archive-text-detail">[\s\S]*?<\/article>/)?.[0] || "";
  if (!subnav || !article) return html;
  const main = `<main class="site-main"><div class="wide-page archive-text-detail-page">${subnav}${article}</div></main>`;
  return html.replace(/<main class="site-main">[\s\S]*?<\/main>/, main);
}

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  const isLanding = file === LANDING;
  html = html.replace(/<body class="([^"]*)">/, (_m, cls) => {
    const next = [cls, isLanding ? "archive-text-landing-page" : "archive-text-page"].filter(Boolean).join(" ");
    return `<body class="${next}">`;
  });
  html = isLanding ? convertLanding(html) : convertDetail(html);
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Aligned Archive/Text landing and detail pages with the Archive/Photo grid.");
