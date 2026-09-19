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
    padding-right: var(--category-x, clamp(30px, 2.75vw, 44px)) !important;
  }
  .live-split .panel-headline {
    margin-bottom: 48px !important;
  }

  /*
   * Live uses one strict two-column notebook grid: dates are a small annotation
   * rail, while every piece of performance information shares one text axis.
   */
  .live-log {
    --live-date-col: 3.3rem;
    --live-col-gap: 14px;
    width: min(100%, 36rem);
  }
  .live-log h2 {
    margin: 48px 0 24px;
    color: var(--ink);
    opacity: .76;
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
    grid-template-columns: var(--live-date-col) minmax(0, 1fr);
    column-gap: var(--live-col-gap);
    row-gap: 0;
    margin-bottom: 24px;
    align-items: baseline;
  }
  .live-row:last-child {
    margin-bottom: 0;
  }
  .live-row time {
    grid-row: 1 / span 3;
    color: var(--muted);
    opacity: .64;
    font-size: .62rem;
    line-height: 1.5;
    letter-spacing: .025em;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
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
    font-weight: 600 !important;
    line-height: 1.42;
  }
  .live-row .live-artists {
    margin-top: 4px;
    color: var(--ink);
    opacity: .80;
    font-size: .75rem;
    line-height: 1.42;
  }
  .live-row .live-venue {
    margin-top: 4px;
    color: var(--muted);
    opacity: .50;
    font-size: .59rem;
    line-height: 1.4;
    letter-spacing: .02em;
  }
}

@media (max-width: 820px) {
  .live-log {
    --live-date-col: 3.2rem;
    --live-col-gap: 12px;
  }
  .live-log h2 {
    margin: 40px 0 24px;
    font-size: .68rem;
    font-weight: 400;
    letter-spacing: .04em;
  }
  .live-log h2:first-child {
    margin-top: 0;
  }
  .live-row {
    display: grid;
    grid-template-columns: var(--live-date-col) minmax(0, 1fr);
    column-gap: var(--live-col-gap);
    row-gap: 0;
    margin-bottom: 24px;
    align-items: baseline;
  }
  .live-row time {
    grid-row: 1 / span 3;
    font-size: .61rem;
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
  }
  .live-row .live-title,
  .live-row .live-artists,
  .live-row .live-venue {
    grid-column: 2;
    display: block;
  }
  .live-row .live-title {
    font-size: .79rem;
    font-weight: 600 !important;
    line-height: 1.42;
  }
  .live-row .live-artists {
    margin-top: 4px;
    font-size: .74rem;
    line-height: 1.42;
    opacity: .80;
  }
  .live-row .live-venue {
    margin-top: 4px;
    font-size: .59rem;
    line-height: 1.4;
    opacity: .50;
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
console.log("Bolded Live performance titles and tightened the page to one shared notebook grid.");
