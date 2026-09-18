import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STYLE = `<style id="global-grid-lines-style">
@media (min-width: 821px) {
  /* Discography is the master desktop split: 35 / 55 = 38.8889% / 61.1111%. */
  .split-layout,
  .info-split {
    display: grid !important;
    position: relative !important;
    width: 100% !important;
    max-width: none !important;
    grid-template-columns: 38.8888889% 61.1111111% !important;
  }

  .split-layout > .index-panel,
  .info-split > .index-panel {
    grid-column: 1 !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
  }

  .split-layout > .detail-panel,
  .info-split > .detail-panel {
    grid-column: 2 !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    left: auto !important;
    right: auto !important;
    box-sizing: border-box !important;
    border-left: 1px solid var(--line) !important;
  }

  /* Remove the old overlay divider: the real panel edge is now the Discography edge. */
  .split-layout::after,
  .info-split::after {
    content: none !important;
  }
}
</style>`;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return [".git", "node_modules"].includes(entry.name) ? [] : walk(full);
    return entry.name === "index.html" ? [full] : [];
  });
}

for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("</head>")) continue;
  if (html.includes('id="global-grid-lines-style"')) {
    html = html.replace(/<style id="global-grid-lines-style">[\s\S]*?<\/style>/, STYLE);
  } else {
    html = html.replace("</head>", `${STYLE}</head>`);
  }
  fs.writeFileSync(file, html);
}

console.log("Matched every desktop split panel width and divider to the exact Discography 35:55 grid.");
