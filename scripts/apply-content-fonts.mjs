import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STYLE = `<style id="content-font-system-style">
:root {
  --font-ui: "American Typewriter", "Courier Prime", "Courier New", "Apple SD Gothic Neo", "Noto Sans KR", monospace;
  --font-content: "Helvetica Neue", Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
}

/*
 * Keep the site's frame and taxonomy in the existing typewriter voice.
 * Apply the cleaner sans-serif only to material the visitor actually reads.
 * Dates, section labels, navigation, years and other metadata stay typewriter.
 */
.home-intro p,
.home-news > a:not(.small-link),
.mailing-copy,
.home-mailing input,
.release-grid strong,
.release-index strong,
.release-detail header h1,
.track-list li span:last-child,
.release-credits-section p,
.liner-notes,
.external-links a,
.work-video-grid strong,
.video-index strong,
.video-detail h1,
.video-detail .prose,
.media-credit,
.summary,
.live-row .live-title,
.live-row .live-artists,
.live-row .live-venue,
.text-index strong,
.note-index strong,
.others-index strong,
.others-index em,
.text-detail h1,
.text-detail .prose,
.photo-detail h1,
.photo-detail .prose,
.archive-video-grid strong,
.archive-text-detail h1,
.archive-text-detail .prose,
.merch-index strong,
.merch-detail h1,
.merch-detail p,
.purchase-links a,
.info-korean,
.info-english,
.info-aside figcaption,
.contact-page p,
.contact-page dd,
.contact-page dd a {
  font-family: var(--font-content) !important;
  letter-spacing: 0 !important;
}

/* Keep structural labels explicitly in the original typewriter family. */
.site-brand,
.rail-nav,
.panel-title,
.panel-headline,
.works-top,
.subnav,
.section-kicker,
.live-log h2,
.live-row time,
.release-detail header p,
.detail-section h2,
.track-list li span:first-child,
.release-grid small,
.release-index small,
.video-index small,
.work-video-grid small,
.archive-video-grid small,
.text-index span,
.note-index span,
.merch-data,
.info-copy h1,
.info-aside nav,
.contact-page h1,
.contact-page dt,
.home-news h2,
.home-mailing h2,
.home-news p,
.home-news .small-link {
  font-family: var(--font-ui) !important;
}
</style>`;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return [".git", "node_modules"].includes(entry.name) ? [] : walk(full);
    return entry.name === "index.html" ? [full] : [];
  });
}

for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("</head>")) continue;
  if (html.includes('id="content-font-system-style"')) {
    html = html.replace(/<style id="content-font-system-style">[\s\S]*?<\/style>/, STYLE);
  } else {
    html = html.replace("</head>", `${STYLE}</head>`);
  }
  fs.writeFileSync(file, html);
}

console.log("Applied the two-font system: typewriter for structure, Helvetica-style sans for readable content across the site.");
