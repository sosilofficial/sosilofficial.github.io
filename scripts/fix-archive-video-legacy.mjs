import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ORIGIN = "https://sosilofficial.github.io";

function contentSlugs(dir) {
  if (!fs.existsSync(dir)) return new Set();
  const files = fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return [...contentSlugs(full)];
    if (!entry.name.endsWith(".md")) return [];
    const raw = fs.readFileSync(full, "utf8");
    const match = raw.match(/^slug:\s*(.+)$/m);
    if (!match) return [];
    try { return [String(JSON.parse(match[1].trim()))]; }
    catch { return [match[1].trim().replace(/^['"]|['"]$/g, "")]; }
  });
  return new Set(files);
}

const videoSlugs = contentSlugs(path.join(ROOT, "content", "archive", "video"));
const photoSlugs = contentSlugs(path.join(ROOT, "content", "archive", "photo"));
let normalized = 0;

for (const slug of videoSlugs) {
  /* Never overwrite a real photo detail page when a photo and video share a slug. */
  if (photoSlugs.has(slug)) continue;

  const canonicalDir = path.join(ROOT, "archive", "videos", slug);
  const legacyDir = path.join(ROOT, "archive", "photo-video", slug);
  const canonicalFile = path.join(canonicalDir, "index.html");
  if (!fs.existsSync(canonicalFile)) continue;

  const canonicalHtml = fs.readFileSync(canonicalFile, "utf8");
  const cssHref = canonicalHtml.match(/<link rel="stylesheet" href="(\/assets\/site-redesign\.css\?v=[^"]+)"/)?.[1] || "/assets/site-redesign.css";
  const target = `/archive/videos/${slug}`;
  const canonical = `${ORIGIN}${target}/`;
  const title = canonicalHtml.match(/<title>([^<]+)<\/title>/)?.[1] || "archive / video | 소실 SOSIL";

  fs.mkdirSync(legacyDir, { recursive: true });
  fs.writeFileSync(path.join(legacyDir, "index.html"), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="${cssHref}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0; url=${target}"><script>location.replace(${JSON.stringify(target)});</script></head><body class="redirect-page"><main><a class="site-brand" href="/">sosil</a><p><a href="${target}">archive / video</a></p></main></body></html>`);
  normalized += 1;
}

console.log(`Normalized ${normalized} Archive video legacy route(s).`);
