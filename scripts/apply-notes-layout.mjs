import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NOTES_DIR = path.join(ROOT, "notes");
const STYLE = `<style id="slow-notes-style">
@media (min-width: 821px) {
  /*
   * Notes should read like a compact archive rather than isolated cards.
   * Use an 8px-based rhythm so the two rows feel deliberately related.
   */
  .note-index {
    display: grid;
    gap: 24px;
    max-width: 32rem;
  }
  .note-index a {
    display: grid;
    grid-template-columns: 7.2rem minmax(0, 1fr);
    align-items: baseline;
    gap: 0 12px;
    padding: 0;
    line-height: 1.6;
  }
  .note-index a.is-selected {
    background: rgba(72, 80, 91, .022);
  }

  /*
   * Mirror the real Notes heading in the detail column instead of estimating
   * its height with a calc(). This spacer intentionally does not use the
   * category-top class, so the later category-grid pass can still normalize
   * the visible Notes heading on the left.
   */
  .split-layout > .detail-panel {
    padding-top: var(--category-top-y, clamp(48px, 6.8vh, 70px)) !important;
  }
  .notes-top-spacer {
    visibility: hidden;
    pointer-events: none;
    margin: 0 0 clamp(44px, 6vh, 72px);
  }
  .notes-top-spacer h1 {
    margin: 0 0 24px !important;
    font-size: 1.08rem !important;
    font-weight: 400 !important;
    line-height: 1.2 !important;
    letter-spacing: .02em !important;
  }
  .note-detail {
    max-width: 48rem;
    margin: 0 auto !important;
  }
  .note-detail > p:first-of-type {
    margin: 0 0 8px !important;
    line-height: 1.6;
  }
  .note-detail h1 {
    margin: 0 0 clamp(42px, 6vh, 70px) !important;
  }
  .note-detail .prose p {
    max-width: 50ch;
    margin-bottom: 2.15em;
    line-height: 1.82;
  }
  .note-detail .prose img,
  .note-detail .detail-gallery,
  .note-detail .video-embed {
    margin-top: clamp(42px, 6vh, 72px);
    margin-bottom: clamp(42px, 6vh, 72px);
  }
}
@media (max-width: 820px) {
  .note-index { gap: 24px; }
  .note-index a {
    grid-template-columns: 6.4rem minmax(0, 1fr);
    align-items: baseline;
    gap: 0 12px;
    padding: 0;
    line-height: 1.6;
  }
  .notes-top-spacer { display: none; }
}
</style>`;

function apply(file) {
  let html = fs.readFileSync(file, "utf8");

  if (
    html.includes('<section class="detail-panel"><article class="text-detail note-detail">') &&
    !html.includes('notes-top-spacer')
  ) {
    html = html.replace(
      '<section class="detail-panel"><article class="text-detail note-detail">',
      '<section class="detail-panel"><div class="notes-top-spacer" aria-hidden="true"><h1>notes</h1></div><article class="text-detail note-detail">'
    );
  }

  if (html.includes('id="slow-notes-style"')) {
    html = html.replace(/<style id="slow-notes-style">[\s\S]*?<\/style>/, STYLE);
  } else {
    html = html.replace("</head>", `${STYLE}</head>`);
  }
  fs.writeFileSync(file, html);
}

if (!fs.existsSync(NOTES_DIR)) process.exit(0);
for (const entry of fs.readdirSync(NOTES_DIR, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    const file = path.join(NOTES_DIR, entry.name, "index.html");
    if (fs.existsSync(file)) apply(file);
  }
}
const landing = path.join(NOTES_DIR, "index.html");
if (fs.existsSync(landing)) apply(landing);
console.log("Tightened Notes list rhythm and locked detail dates to the exact shared heading grid.");
