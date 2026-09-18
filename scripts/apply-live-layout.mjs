import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "works", "live", "index.html");
if (!fs.existsSync(FILE)) {
  console.log("Works live page not found; skipping live layout.");
  process.exit(0);
}

const STYLE = `<style id="works-live-layout-style">
@media (min-width: 821px) {
  .live-split .index-panel {
    padding-right: clamp(34px, 4.2vw, 72px);
  }
  .live-log {
    width: min(100%, 48rem);
  }
  .live-log h2 {
    margin: clamp(76px, 10vh, 116px) 0 28px;
    color: var(--ink);
    font-size: .98rem;
    line-height: 1;
    letter-spacing: .035em;
  }
  .live-log h2:first-child {
    margin-top: 0;
  }
  .live-row {
    display: grid;
    grid-template-columns: 6.2rem minmax(0, 1fr);
    gap: 0 18px;
    margin-bottom: clamp(28px, 4vh, 42px);
    align-items: start;
  }
  .live-row time {
    grid-row: 1 / span 3;
    color: var(--muted);
    opacity: .68;
    font-size: .63rem;
    line-height: 1.55;
    letter-spacing: .025em;
  }
  .live-row .live-title,
  .live-row .live-artists,
  .live-row .live-venue {
    grid-column: 2;
    display: block;
  }
  .live-row .live-title {
    font-size: .83rem;
    line-height: 1.46;
    letter-spacing: .004em;
  }
  .live-row .live-artists {
    margin-top: 4px;
    color: var(--ink);
    opacity: 1;
    font-size: .64rem;
    line-height: 1.5;
    letter-spacing: .015em;
  }
  .live-row .live-venue {
    margin-top: 3px;
    color: var(--muted);
    opacity: .64;
    font-size: .61rem;
    line-height: 1.45;
    letter-spacing: .025em;
  }
}
</style>`;

function splitPerformance(raw) {
  const text = raw.trim();
  const parenthetical = text.match(/^(.*?)\s*\(\s*w\s*\/\s*([\s\S]*?)\s*\)\s*$/i);
  if (parenthetical) {
    return { title: parenthetical[1].trim(), artists: parenthetical[2].trim() };
  }
  const artistsOnly = text.match(/^w\s*\/\s*([\s\S]+)$/i);
  if (artistsOnly) {
    return { title: "", artists: artistsOnly[1].trim() };
  }
  return { title: text, artists: "" };
}

let html = fs.readFileSync(FILE, "utf8");

html = html.replace(
  /<div class="live-row"><time>([\s\S]*?)<\/time><span(?: class="live-title")?>([\s\S]*?)<\/span>(?:<span class="live-artists">[\s\S]*?<\/span>)?<small(?: class="live-venue")?>([\s\S]*?)<\/small><\/div>/g,
  (_match, date, rawPerformance, venue) => {
    const { title, artists } = splitPerformance(rawPerformance.replace(/<[^>]+>/g, ""));
    const titleHtml = title ? `<span class="live-title">${title}</span>` : "";
    const artistsHtml = artists ? `<span class="live-artists">${artists}</span>` : "";
    const venueHtml = venue.trim() ? `<small class="live-venue">${venue.trim()}</small>` : "";
    return `<div class="live-row"><time>${date}</time>${titleHtml}${artistsHtml}${venueHtml}</div>`;
  }
);

if (html.includes('id="works-live-layout-style"')) {
  html = html.replace(/<style id="works-live-layout-style">[\s\S]*?<\/style>/, STYLE);
} else {
  html = html.replace("</head>", `${STYLE}</head>`);
}
fs.writeFileSync(FILE, html);
console.log("Split Works/Live entries into title, artists and venue lines with black artist text.");
