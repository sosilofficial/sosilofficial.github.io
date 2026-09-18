import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEXT_DIR = path.join(ROOT, "archive", "links");
const files = [];

if (fs.existsSync(path.join(TEXT_DIR, "index.html"))) files.push(path.join(TEXT_DIR, "index.html"));
if (fs.existsSync(TEXT_DIR)) {
  for (const entry of fs.readdirSync(TEXT_DIR, { withFileTypes: true })) {
    const file = path.join(TEXT_DIR, entry.name, "index.html");
    if (entry.isDirectory() && fs.existsSync(file)) files.push(file);
  }
}

const STYLE = `<style id="archive-text-layout-style">
@media (min-width: 821px) {
  .archive-text-index {
    display: grid;
    gap: clamp(36px, 5vh, 58px);
    width: min(100%, 39rem);
  }
  .archive-text-index a {
    display: grid;
    grid-template-columns: 5.1rem minmax(0, 1fr);
    gap: 2px 14px;
    padding: 0;
    align-items: start;
  }
  .archive-text-index a.is-selected {
    background: transparent;
  }
  .archive-text-index span {
    grid-row: 1 / span 2;
    color: var(--muted);
    opacity: .55;
    font-size: .62rem;
    letter-spacing: .025em;
    line-height: 1.5;
  }
  .archive-text-index strong {
    font-size: .84rem;
    line-height: 1.42;
    letter-spacing: .006em;
  }
  .archive-text-index small {
    grid-column: 2;
    margin-top: 5px;
    color: var(--muted);
    opacity: .72;
    font-size: .62rem;
    letter-spacing: .03em;
  }
  .archive-text-index a.is-selected strong {
    opacity: .62;
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

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<body class="([^"]*)">/, (_m, cls) => `<body class="${[cls, "archive-text-page"].filter(Boolean).join(" ")}">`);
  if (html.includes('id="archive-text-layout-style"')) {
    html = html.replace(/<style id="archive-text-layout-style">[\s\S]*?<\/style>/, STYLE);
  } else {
    html = html.replace("</head>", `${STYLE}</head>`);
  }
  fs.writeFileSync(file, html);
}

console.log("Applied quieter editorial Archive/Text typography and spacing.");
