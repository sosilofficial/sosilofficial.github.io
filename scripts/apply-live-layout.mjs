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
    padding-right: clamp(32px, 3.8vw, 58px);
  }

  /*
   * Treat Live like a small performance notebook: compact repeated entries
   * against a deliberately large empty field, rather than a portfolio table.
   */
  .live-log {
    width: min(100%, 38rem);
  }
  .live-log h2 {
    margin: 52px 0 24px;
    color: var(--ink);
    opacity: .78;
    font-size: .69rem;
    font-weight: 400;
    line-height: 1;
    letter-spacing: .045em;
  }
  .live-log h2:first-child {
    margin-top: 0;
  }

  .live-row {
    display: grid;
    grid-template-columns: 4.25rem minmax(0, 1fr);
    gap: 0 12px;
    margin-bottom: 22px;
    align-items: baseline;
  }
  .live-row:last-child {
    margin-bottom: 0;
  }
  .live-row time {
    grid-row: 1 / span 3;
    color: var(--muted);
    opacity: .66;
    font-size: .62rem;
    line-height: 1.52;
    letter-spacing: .03em;
    white-space: nowrap;
  }
  .live-row .live-title,
  .live-row .live-artists,
  .live-row .live-venue {
    grid-column: 2;
    display: block;
    min-width: 0;
  }
  .live-row .live-title {
    font-size: .80rem;
    line-height: 1.42;
  }
  .live-row .live-artists {
    margin-top: 3px;
    color: var(--ink);
    opacity: .82;
    font-size: .75rem;
    line-height: 1.42;
  }
  .live-row .live-venue {
    margin-top: 3px;
    color: var(--muted);
    opacity: .52;
    font-size: .59rem;
    line-height: 1.4;
    letter-spacing: .02em;
  }
}

@media (max-width: 820px) {
  .live-log h2 {
    margin: 44px 0 22px;
    font-size: .68rem;
    font-weight: 400;
    letter-spacing: .04em;
  }
  .live-log h2:first-child {
    margin-top: 0;
  }
  .live-row {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr);
    gap: 0 10px;
    margin-bottom: 22px;
    align-items: baseline;
  }
  .live-row time {
    grid-row: 1 / span 3;
    font-size: .61rem;
    line-height: 1.5;
  }
  .live-row .live-title,
  .live-row .live-artists,
  .live-row .live-venue {
    grid-column: 2;
    display: block;
  }
  .live-row .live-title {
    font-size: .79rem;
    line-height: 1.42;
  }
  .live-row .live-artists {
    margin-top: 3px;
    font-size: .74rem;
    line-height: 1.42;
    opacity: .82;
  }
  .live-row .live-venue {
    margin-top: 3px;
    font-size: .59rem;
    line-height: 1.4;
    opacity: .52;
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

/* Keep the full authored date in datetime, but let the year heading carry the year visually. */
html = html.replace(
  /<time>(\d{4})\.(\d{2})\.(\d{2})<\/time>/g,
  (_match, year, month, day) => `<time datetime="${year}-${month}-${day}">${month}.${day}</time>`
);

if (html.includes('id="works-live-layout-style"')) {
  html = html.replace(/<style id="works-live-layout-style">[\s\S]*?<\/style>/, STYLE);
} else {
  html = html.replace("</head>", `${STYLE}</head>`);
}
fs.writeFileSync(FILE, html);
console.log("Refined Works/Live into a compact performance-log rhythm with year-scoped dates.");
