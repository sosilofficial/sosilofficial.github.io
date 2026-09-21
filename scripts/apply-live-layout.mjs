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
  /*
   * Live is intentionally flatter than the other Works sections: one quiet,
   * full-width performance table with lots of air around it and almost no UI chrome.
   */
  .live-split {
    display: block !important;
    width: 100% !important;
    min-height: 100vh;
  }
  .live-split > .index-panel {
    width: 100% !important;
    max-width: none !important;
    padding-right: var(--category-x, clamp(30px, 2.75vw, 44px)) !important;
  }
  .live-split > .detail-panel {
    display: none !important;
  }
  .live-split .panel-headline {
    margin-bottom: 44px !important;
  }

  .live-log {
    width: 100%;
    max-width: none;
    border-top: 1px solid rgba(47, 55, 67, .052);
  }
  .live-log h2 {
    display: none;
  }
  .live-row {
    display: grid;
    grid-template-columns:
      6.8rem
      minmax(12rem, 1.2fr)
      minmax(14rem, 1.55fr)
      minmax(9rem, 1fr);
    column-gap: clamp(18px, 1.8vw, 28px);
    align-items: baseline;
    min-height: 42px;
    margin: 0;
    padding: 13px 0 14px;
    border-bottom: 1px solid rgba(47, 55, 67, .052);
  }
  .live-row time,
  .live-row .live-title,
  .live-row .live-artists,
  .live-row .live-venue {
    display: block;
    min-width: 0;
    margin: 0;
  }
  .live-row time {
    grid-column: 1;
    color: var(--muted);
    opacity: .58;
    font-size: .62rem;
    line-height: 1.5;
    letter-spacing: .02em;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .live-row .live-title {
    grid-column: 2;
    color: var(--ink);
    opacity: .9;
    font-size: .75rem;
    font-weight: 400 !important;
    line-height: 1.5;
  }
  .live-row .live-artists {
    grid-column: 3;
    color: var(--ink);
    opacity: .68;
    font-size: .70rem;
    line-height: 1.5;
  }
  .live-row .live-venue {
    grid-column: 4;
    color: var(--muted);
    opacity: .58;
    font-size: .62rem;
    line-height: 1.5;
    letter-spacing: .015em;
  }
  .live-row-artists-only .live-artists {
    grid-column: 2 / 4;
    opacity: .9;
    font-size: .75rem;
    font-weight: 400;
  }
}

/* Let the desktop table shrink just above the mobile breakpoint. */
@media (min-width: 821px) and (max-width: 1024px) {
  .live-row {
    grid-template-columns: 6.8rem minmax(0, 1.2fr) minmax(0, 1.55fr) minmax(0, 1fr);
  }
  .live-row .live-title,
  .live-row .live-artists,
  .live-row .live-venue { overflow-wrap: anywhere; }
}

@media (max-width: 820px) {
  .live-log {
    border-top: 1px solid rgba(47, 55, 67, .052);
  }
  .live-log h2 {
    display: none;
  }
  .live-row {
    display: grid;
    grid-template-columns: 5.8rem minmax(0, 1fr);
    column-gap: 16px;
    row-gap: 4px;
    margin: 0;
    padding: 14px 0 15px;
    border-bottom: 1px solid rgba(47, 55, 67, .052);
  }
  .live-row time {
    grid-column: 1;
    grid-row: 1 / span 3;
    color: var(--muted);
    opacity: .58;
    font-size: .61rem;
    line-height: 1.5;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .live-row .live-title,
  .live-row .live-artists,
  .live-row .live-venue {
    grid-column: 2;
    display: block;
    min-width: 0;
    margin: 0;
  }
  .live-row .live-title {
    color: var(--ink);
    opacity: .9;
    font-size: .75rem;
    font-weight: 400 !important;
    line-height: 1.5;
  }
  .live-row .live-artists {
    color: var(--ink);
    opacity: .68;
    font-size: .70rem;
    line-height: 1.5;
  }
  .live-row .live-venue {
    color: var(--muted);
    opacity: .58;
    font-size: .62rem;
    line-height: 1.5;
  }
  .live-row-artists-only .live-artists {
    opacity: .9;
    font-size: .75rem;
    font-weight: 400;
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

/* Flatten the year groups into one continuous table; the full date now carries the year. */
html = html.replace(/<h2>\d{4}<\/h2>/g, "");
html = html.replace(
  /<time datetime="(\d{4})-(\d{2})-(\d{2})">\d{2}\.\d{2}<\/time>/g,
  (_match, year, month, day) => `<time datetime="${year}-${month}-${day}">${year}.${month}.${day}</time>`
);

/* Mark rows that have no separate performance title so their artist names occupy the title axis. */
html = html.replace(
  /<div class="live-row(?: live-row-artists-only)?">([\s\S]*?)<\/div>/g,
  (_match, inner) => {
    const artistsOnly = !inner.includes('class="live-title"') && inner.includes('class="live-artists"');
    return `<div class="live-row${artistsOnly ? " live-row-artists-only" : ""}">${inner}</div>`;
  }
);

if (html.includes('id="works-live-layout-style"')) {
  html = html.replace(/<style id="works-live-layout-style">[\s\S]*?<\/style>/, STYLE);
} else {
  html = html.replace("</head>", `${STYLE}</head>`);
}
fs.writeFileSync(FILE, html);
console.log("Flattened Works/Live into a faint full-width performance table with aligned rows.");
