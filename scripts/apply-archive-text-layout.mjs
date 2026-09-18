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
  .archive-text-landing .archive-text-index span:empty {
    display: none;
  }
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
  .archive-text-landing .archive-text-index a.is-selected {
    background: transparent;
  }

  .archive-text-page .detail-panel {
    padding-left: clamp(30px, 4vw, 68px);
    padding-right: clamp(30px, 5vw, 86px);
  }
  .archive-text-page .text-detail {
    max-width: 42rem;
    margin-top: clamp(62px, 9vh, 110px);
  }
  .archive-text-page .text-detail h1 {
    max-width: 28ch;
    margin-bottom: clamp(34px, 5vh, 58px);
    font-size: clamp(1.05rem, 1.7vw, 1.5rem);
    line-height: 1.42;
  }
  .archive-text-page .text-detail .prose,
  .archive-text-page .text-detail > p {
    max-width: 50ch;
    line-height: 1.82;
  }
  .archive-text-page .original-link {
    margin-top: clamp(52px, 8vh, 92px);
    font-size: .68rem;
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

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  const isLanding = file === LANDING;
  html = html.replace(/<body class="([^"]*)">/, (_m, cls) => {
    const next = [cls, isLanding ? "archive-text-landing-page" : "archive-text-page"].filter(Boolean).join(" ");
    return `<body class="${next}">`;
  });
  if (isLanding) html = convertLanding(html);
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Aligned Archive/Text landing with Archive/Photo grid and removed empty date gutter.");
