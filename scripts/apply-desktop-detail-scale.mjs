import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STYLE_ID = "desktop-detail-scale-override";
const STYLE = `<style id="${STYLE_ID}">
@media (min-width: 821px) {
  /* Keep landing/index image scale aligned with the existing Works grid. */
  .release-split .release-index img {
    width: 100%;
    max-width: 100%;
  }
  .release-split .release-index span {
    width: 100%;
    max-width: none;
  }
  .merch-split .merch-index img {
    width: 100%;
    max-width: none;
  }
  .merch-split .merch-index span {
    width: 100%;
    max-width: none;
  }

  /* Make only the second/detail pages visibly smaller on desktop. */
  .release-split .release-detail {
    --detail-grid-gap: clamp(22px, 2vw, 32px);
    grid-template-columns: clamp(90px, 8.5vw, 120px) minmax(0, 1fr);
    width: min(100%, 600px);
    max-width: 600px;
  }

  .merch-split .merch-detail {
    width: min(100%, 460px);
    max-width: 460px;
  }
  .merch-split .merch-gallery {
    gap: clamp(8px, 1vw, 12px);
  }
}
</style>`;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? walk(full)
      : entry.name === "index.html"
        ? [full]
        : [];
  });
}

function apply(file) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("</head>")) return;
  html = html.replace(
    new RegExp(`<style id="${STYLE_ID}">[\\s\\S]*?<\\/style>`, "g"),
    ""
  );
  html = html.replace("</head>", `${STYLE}</head>`);
  fs.writeFileSync(file, html);
}

const targets = [
  ...walk(path.join(ROOT, "works", "discography")),
  ...walk(path.join(ROOT, "merch")),
];

for (const file of targets) apply(file);

console.log("Applied smaller desktop Discography and Merch detail scale while preserving index alignment and mobile layouts.");
