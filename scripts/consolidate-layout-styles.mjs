import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CSS_FILE = path.join(ROOT, "assets", "site-redesign.css");
const START = "/* generated postprocessor styles:start */";
const END = "/* generated postprocessor styles:end */";
const sources = [
  "apply-video-layout.mjs",
  "apply-discography-layout.mjs",
  "apply-live-layout.mjs",
  "apply-merch-layout.mjs",
  "apply-archive-photo-layout.mjs",
  "apply-archive-text-layout.mjs",
  "apply-notes-layout.mjs",
  "apply-home-layout.mjs",
  "apply-shared-ui.mjs",
  "apply-mobile-detail-pages.mjs",
  "apply-desktop-detail-scale.mjs",
  "apply-unified-desktop-grid.mjs",
];

const sections = sources.map((name) => {
  const source = fs.readFileSync(path.join(ROOT, "scripts", name), "utf8");
  const match = source.match(/const STYLE = `<style id="([^"]+)">\n([\s\S]*?)\n<\/style>`;/);
  if (!match) throw new Error(`STYLE CONSOLIDATION ERROR: ${name}의 STYLE 블록을 찾지 못했습니다.`);
  return `/* ${match[1]} */\n${match[2]}`;
});

let css = fs.readFileSync(CSS_FILE, "utf8");
const generated = `${START}\n${sections.join("\n\n")}\n${END}`;
const markerPattern = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
css = markerPattern.test(css) ? css.replace(markerPattern, generated) : `${css.trimEnd()}\n\n${generated}\n`;
fs.writeFileSync(CSS_FILE, css);

if (process.argv.includes("--strip-html")) {
  const ids = sections.map((section) => section.match(/^\/\* ([^ ]+) \*\//)?.[1]).filter(Boolean);
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if ([".git", "node_modules", "content", "scripts", "samples"].includes(entry.name)) return [];
    return entry.isDirectory() ? walk(full) : entry.name.endsWith(".html") ? [full] : [];
  });
  for (const file of walk(ROOT)) {
    let html = fs.readFileSync(file, "utf8");
    for (const id of ids) html = html.replace(new RegExp(`<style id="${id}">[\\s\\S]*?<\\/style>`, "g"), "");
    fs.writeFileSync(file, html);
  }
}

console.log(`Consolidated ${sections.length} layout style blocks in assets/site-redesign.css${process.argv.includes("--strip-html") ? " and removed generated inline copies" : ""}.`);
