import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PHOTO_DIR = path.join(ROOT, "archive", "photo-video");
const LANDINGS = [path.join(ROOT, "archive", "index.html"), path.join(PHOTO_DIR, "index.html")];

/*
 * Archive Photo used to be converted back into a wide-page post layout here.
 * Keep the generator's native split detail markup intact instead. The final
 * desktop grid/landing behavior is applied by apply-unified-desktop-grid.mjs.
 */
const STYLE = `<style id="archive-photo-post-style">
@media (min-width: 821px) {
  .archive-photo-split .detail-panel {
    background: var(--bg);
  }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="archive-photo-post-style"')) {
    return html.replace(/<style id="archive-photo-post-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

for (const file of LANDINGS) {
  if (!fs.existsSync(file)) continue;
  fs.writeFileSync(file, ensureStyle(fs.readFileSync(file, "utf8")));
}

if (fs.existsSync(PHOTO_DIR)) {
  for (const entry of fs.readdirSync(PHOTO_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(PHOTO_DIR, entry.name, "index.html");
    if (!fs.existsSync(file)) continue;
    fs.writeFileSync(file, ensureStyle(fs.readFileSync(file, "utf8")));
  }
}

console.log("Preserved Archive Photo split detail markup for the unified desktop grid pass.");
