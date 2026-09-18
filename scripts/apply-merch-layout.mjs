import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MERCH_DIR = path.join(ROOT, "merch");
const LANDING = path.join(MERCH_DIR, "index.html");

if (!fs.existsSync(LANDING)) {
  console.log("Merch landing not found; skipping stable merch layout.");
  process.exit(0);
}

let html = fs.readFileSync(LANDING, "utf8");

if (!html.includes('class="split-layout merch-split"')) {
  throw new Error("MERCH LAYOUT ERROR: merch split layout not found.");
}

html = html
  .replace(/ class="is-selected" aria-current="page"/g, "")
  .replace(/<section class="detail-panel">[\s\S]*?<\/section>/, '<section class="detail-panel"></section>');

fs.writeFileSync(LANDING, html);
console.log("Applied stable Merch index layout to landing page.");
