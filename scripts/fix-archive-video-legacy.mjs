import fs from "node:fs";
import { ANALYTICS_SCRIPT } from "./analytics.mjs";
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
  fs.writeFileSync(path.join(legacyDir, "index.html"), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="${cssHref}"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0; url=${target}"><script>location.replace(${JSON.stringify(target)});</script>${ANALYTICS_SCRIPT}</head><body class="redirect-page"><main><a class="site-brand" href="/">sosil</a><p><a href="${target}">archive / video</a></p></main></body></html>`);
  normalized += 1;
}

/*
 * Archive Photo used to carry per-image hash targets. That made browsers jump
 * directly to an image and interacted badly with desktop scroll restoration.
 * Keep one canonical post URL per Photo post instead.
 */
const photoRoot = path.join(ROOT, "archive", "photo-video");
let normalizedPhotoLinks = 0;

function normalizePhotoLinks(file) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  html = html.replace(
    /href="\/archive\/photo-video\/([^"#/]+)#photo-\1-\d+"/g,
    (_match, slug) => `href="/archive/photo-video/${slug}/"`
  );
  html = html.replace(
    /href="#photo-([^"#]+)-\d+"(?:\s+data-panel-target="photo-\1-\d+")?/g,
    (_match, slug) => `href="/archive/photo-video/${slug}/"`
  );
  html = html.replace(/\sdata-panel-target="photo-[^"]+"/g, "");

  if (html !== before) {
    fs.writeFileSync(file, html);
    normalizedPhotoLinks += 1;
  }
}

if (fs.existsSync(photoRoot)) {
  const stack = [photoRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name === "index.html") normalizePhotoLinks(full);
    }
  }
}

console.log(`Normalized ${normalized} Archive video legacy route(s) and ${normalizedPhotoLinks} Archive Photo page link set(s).`);
