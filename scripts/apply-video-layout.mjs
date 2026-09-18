import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const VIDEO_DIR = path.join(ROOT, "works", "videos");
const LANDING = path.join(VIDEO_DIR, "index.html");
const STYLE = `<style id="stable-video-index-style">
@media (min-width: 821px) {
  .video-split .video-index { display: grid; gap: 34px; }
  .video-split .video-index a { width: min(100%, 320px); padding: 8px; }
  .video-split .video-index img { width: 100%; max-width: 300px; }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="stable-video-index-style"')) return html;
  return html.replace("</head>", `${STYLE}</head>`);
}

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

landing = ensureStyle(landing.replace(/<main class="site-main">[\s\S]*?<\/main>/, replacement));
fs.writeFileSync(LANDING, landing);

for (const file of detailFiles) {
  const html = ensureStyle(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, html);
}

console.log("Applied stable Works video index layout and larger thumbnail scale.");
