import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "works", "live", "index.html");
if (!fs.existsSync(FILE)) {
  console.log("Works live page not found; skipping live layout.");
  process.exit(0);
}

const STYLE = `<style id="works-live-layout-style">
@media (min-width: 821px) {
  .live-split .index-panel {
    padding-right: clamp(34px, 4.2vw, 72px);
  }
  .live-log {
    width: min(100%, 48rem);
  }
  .live-log h2 {
    margin: clamp(76px, 10vh, 116px) 0 28px;
    color: var(--ink);
    font-size: .98rem;
    line-height: 1;
    letter-spacing: .035em;
  }
  .live-log h2:first-child {
    margin-top: 0;
  }
  .live-row {
    display: grid;
    grid-template-columns: 6.2rem minmax(0, 1fr);
    gap: 3px 18px;
    margin-bottom: clamp(24px, 3.6vh, 38px);
    align-items: start;
  }
  .live-row time {
    color: var(--muted);
    opacity: .68;
    font-size: .63rem;
    line-height: 1.55;
    letter-spacing: .025em;
  }
  .live-row > span {
    font-size: .83rem;
    line-height: 1.48;
    letter-spacing: .004em;
  }
  .live-row small {
    grid-column: 2;
    color: var(--muted);
    opacity: .76;
    font-size: .63rem;
    line-height: 1.45;
    letter-spacing: .02em;
  }
}
</style>`;

let html = fs.readFileSync(FILE, "utf8");
if (html.includes('id="works-live-layout-style"')) {
  html = html.replace(/<style id="works-live-layout-style">[\s\S]*?<\/style>/, STYLE);
} else {
  html = html.replace("</head>", `${STYLE}</head>`);
}
fs.writeFileSync(FILE, html);
console.log("Applied clearer chronological Works/Live hierarchy.");
