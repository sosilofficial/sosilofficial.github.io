import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STYLE = `<style id="global-grid-lines-style">
@media (min-width: 821px) {
  /*
   * One shared coordinate system for every desktop split page.
   * The sidebar itself is unchanged; only the content canvas is normalized.
   * Keeping a stable scrollbar gutter prevents long/short pages from shifting
   * the content width by a few pixels relative to Discography.
   */
  html {
    scrollbar-gutter: stable;
  }

  .site-main {
    margin-left: max(var(--sidebar), 118px) !important;
    width: calc(100% - max(var(--sidebar), 118px)) !important;
    max-width: none !important;
  }

  /* Discography is the master split: 35 / 55 = 38.8889% / 61.1111%. */
  .split-layout,
  .info-split {
    display: grid !important;
    position: relative !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    grid-template-columns: minmax(0, 38.8888889%) minmax(0, 61.1111111%) !important;
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
    border-left: 0 !important;
  }

  /*
   * Draw the divider from the shared grid itself rather than from each
   * page's detail panel. This avoids page-specific sticky/fixed/overflow
   * rules moving or covering the visible line.
   */
  .split-layout::after,
  .info-split::after {
    content: "" !important;
    position: absolute !important;
    z-index: 40 !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 38.8888889% !important;
    width: 1px !important;
    background: var(--line) !important;
    pointer-events: none !important;
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

console.log("Locked every desktop split width and divider to one Discography-based coordinate system.");
