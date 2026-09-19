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

  /* Discography remains the master split for all regular list/detail pages. */
  .split-layout:not(.info-split) {
    display: grid !important;
    position: relative !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    grid-template-columns: minmax(0, 38.8888889%) minmax(0, 61.1111111%) !important;
  }

  .split-layout:not(.info-split) > .index-panel {
    grid-column: 1 !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
  }

  .split-layout:not(.info-split) > .detail-panel {
    grid-column: 2 !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    left: auto !important;
    right: auto !important;
    box-sizing: border-box !important;
    border-left: 0 !important;
  }

  .split-layout:not(.info-split)::after {
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

  /* Info: media/links on the narrower left, biography on the wider right. */
  .info-split {
    display: grid !important;
    position: relative !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    grid-template-columns: minmax(0, 42.7%) minmax(0, 57.3%) !important;
  }

  .info-split > .index-panel,
  .info-split > .detail-panel {
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    box-sizing: border-box !important;
    border-left: 0 !important;
    padding: clamp(42px, 5.5vh, 58px) !important;
  }

  .info-split > .index-panel {
    grid-column: 1 !important;
  }

  .info-split > .detail-panel {
    grid-column: 2 !important;
    left: auto !important;
    right: auto !important;
  }

  .info-split .info-aside,
  .info-split .info-copy {
    margin-top: 0 !important;
    justify-self: start !important;
  }

  .info-split .info-aside {
    width: min(100%, 420px) !important;
  }

  .info-split .info-copy {
    width: min(100%, 44ch) !important;
    max-width: 44ch !important;
  }

  .info-split::after {
    content: "" !important;
    position: absolute !important;
    z-index: 40 !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 42.7% !important;
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
  if (file === path.join(ROOT, "contact", "index.html")) {
    html = html.replace(
      "for booking, collaboration, video work, or other inquiries.",
      "for booking, collaboration, video work,<br>or other inquiries."
    );
  }
  fs.writeFileSync(file, html);
}

console.log("Kept Discography-based split lines globally, swapped Info into a 42.7/57.3 media-to-bio grid, and preserved the Contact line break.");
