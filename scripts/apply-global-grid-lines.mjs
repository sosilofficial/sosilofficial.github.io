import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STYLE = `<style id="global-grid-lines-style">
@media (min-width: 821px) {
  .split-layout,
  .info-split {
    position: relative !important;
    grid-template-columns: minmax(0, 35fr) minmax(0, 55fr) !important;
  }

  .split-layout > .detail-panel,
  .info-split > .detail-panel {
    border-left: 0 !important;
  }

  .split-layout::after,
  .info-split::after {
    content: "";
    position: absolute;
    z-index: 10;
    top: 0;
    bottom: 0;
    left: 38.8888889%;
    width: 1px;
    background: var(--line);
    pointer-events: none;
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

console.log("Locked every desktop content divider to the exact Discography 35:55 boundary.");
