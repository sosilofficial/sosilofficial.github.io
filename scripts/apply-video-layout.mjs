import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const VIDEO_DIR = path.join(ROOT, "works", "videos");
const LANDING = path.join(VIDEO_DIR, "index.html");

if (!fs.existsSync(LANDING)) {
  console.log("Works video landing not found; skipping stable video layout.");
  process.exit(0);
}

const detailFiles = fs.existsSync(VIDEO_DIR)
  ? fs.readdirSync(VIDEO_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(VIDEO_DIR, entry.name, "index.html"))
      .filter((file) => fs.existsSync(file))
  : [];

if (!detailFiles.length) {
  console.log("No Works video detail pages found; leaving empty landing as generated.");
  process.exit(0);
}

const template = fs.readFileSync(detailFiles[0], "utf8");
const indexPanel = template.match(/<section class="index-panel">([\s\S]*?)<\/section><section class="detail-panel">/)?.[1];

if (!indexPanel) {
  throw new Error("VIDEO LAYOUT ERROR: detail page index panel could not be extracted.");
}

const cleanIndexPanel = indexPanel.replace(/ class="is-selected" aria-current="page"/g, "");
let landing = fs.readFileSync(LANDING, "utf8");
const replacement = `<main class="site-main"><div class="split-layout video-split"><section class="index-panel">${cleanIndexPanel}</section><section class="detail-panel"></section></div></main>`;

if (!/<main class="site-main">[\s\S]*?<\/main>/.test(landing)) {
  throw new Error("VIDEO LAYOUT ERROR: landing main region not found.");
}

landing = landing.replace(/<main class="site-main">[\s\S]*?<\/main>/, replacement);
fs.writeFileSync(LANDING, landing);
console.log("Applied stable Works video index layout to landing page.");
