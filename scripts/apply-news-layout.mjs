import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NEWS_DIR = path.join(ROOT, "news");

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (!fs.existsSync(NEWS_DIR)) {
  console.log("No News directory to update.");
  process.exit(0);
}

let changed = 0;
for (const entry of fs.readdirSync(NEWS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(NEWS_DIR, entry.name, "index.html");
  if (!fs.existsSync(file)) continue;

  let html = fs.readFileSync(file, "utf8");
  const thumbnail = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1] || "";
  if (!thumbnail) continue;

  // If the same thumbnail was also supplied as a body image, keep only the hero copy.
  const duplicateImage = new RegExp(`<img\\b[^>]*\\bsrc="${escapeRegExp(thumbnail)}"[^>]*>`, "g");
  html = html.replace(duplicateImage, "");
  html = html.replace(/<div class="detail-gallery">\s*<\/div>/g, "");

  if (!html.includes('class="news-hero-image"')) {
    const hero = `<div class="detail-gallery news-hero"><img class="news-hero-image" src="${thumbnail}" alt="news poster" loading="eager" decoding="async"></div>`;
    html = html.replace(/(<article class="text-detail">[\s\S]*?<h1>[^<]*<\/h1>)/, `$1${hero}`);
  }

  fs.writeFileSync(file, html);
  changed += 1;
}

console.log(`Applied News thumbnail hero layout to ${changed} page(s).`);
