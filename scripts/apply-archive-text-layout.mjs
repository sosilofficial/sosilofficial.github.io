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
  .archive-text-page .split-layout {
    display: grid;
    grid-template-columns: var(--index) var(--detail);
    min-height: 100vh;
  }
  .archive-text-page .index-panel {
    min-width: 0;
    padding: var(--pad);
  }
  .archive-text-page .detail-panel {
    position: sticky;
    top: 0;
    align-self: start;
    min-width: 0;
    height: 100vh;
    overflow-y: auto;
    border-left: 1px solid var(--line);
    padding: var(--pad);
  }
  .archive-text-page .panel-headline {
    margin-bottom: clamp(52px, 7vh, 86px);
  }
  .archive-text-page .archive-text-index {
    display: grid;
    gap: clamp(36px, 5vh, 58px);
    width: 100%;
  }
  .archive-text-page .archive-text-index a {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    padding: 0;
    align-items: start;
    justify-items: start;
  }
  .archive-text-page .archive-text-index span:empty { display: none; }
  .archive-text-page .archive-text-index strong {
    max-width: 30rem;
    font-size: .84rem;
    line-height: 1.42;
    letter-spacing: .006em;
  }
  .archive-text-page .archive-text-index small {
    grid-column: 1;
    margin-top: 5px;
    color: var(--muted);
    opacity: .72;
    font-size: .62rem;
    letter-spacing: .03em;
  }
  .archive-text-page .archive-text-index a.is-selected {
    background: transparent;
  }
  .archive-text-page .archive-text-index a.is-selected strong {
    opacity: .58;
  }

  .archive-text-page .archive-text-detail {
    position: relative;
    width: min(100%, 620px);
    max-width: 620px;
    margin: clamp(34px, 5vh, 54px) auto 0;
    padding: 0 8px 72px;
  }
  .archive-text-page .archive-text-detail .close-detail {
    position: absolute;
    top: 0;
    right: 0;
    float: none;
    margin: 0;
  }
  .archive-text-page .archive-text-detail > p:first-of-type:empty { display: none; }
  .archive-text-page .archive-text-detail h1 {
    max-width: 32ch;
    margin: 0 40px 8px 0;
    font-size: clamp(.94rem, 1.25vw, 1.16rem);
    line-height: 1.4;
  }
  .archive-text-page .archive-text-detail .publisher {
    margin: 0 0 clamp(36px, 5vh, 58px);
    color: var(--muted);
    font-size: .66rem;
  }
  .archive-text-page .source-link {
    width: 100%;
    max-width: 560px;
    margin-top: clamp(34px, 5vh, 58px);
    font-size: .66rem;
  }
  .archive-text-page .prose {
    width: 100%;
    max-width: 54ch;
    line-height: 1.82;
  }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="archive-text-layout-style"')) {
    return html.replace(/<style id="archive-text-layout-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<body class="([^"]*)">/, (_m, cls) => {
    const classes = new Set(cls.split(/\s+/).filter(Boolean));
    classes.delete("archive-text-landing-page");
    classes.add("archive-text-page");
    return `<body class="${[...classes].join(" ")}">`;
  });
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Restored Archive/Text as a stable split index + right-side detail panel without the empty date gutter.");
