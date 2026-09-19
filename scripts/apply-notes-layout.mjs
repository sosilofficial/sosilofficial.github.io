import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NOTES_DIR = path.join(ROOT, "notes");
const STYLE = `<style id="slow-notes-style">
@media (min-width: 821px) {
  .note-index {
    display: grid;
    gap: clamp(38px, 5.2vh, 64px);
    max-width: 32rem;
  }
  .note-index a {
    grid-template-columns: 7.2rem minmax(0, 1fr);
    gap: 3px 13px;
    padding: 4px 6px;
    line-height: 1.72;
  }
  .note-index a.is-selected {
    background: rgba(72, 80, 91, .03);
  }

  /*
   * Put the detail date on the same horizontal row as the first item in the
   * Notes index. The left column starts after the shared category heading,
   * so mirror that exact vertical rhythm instead of using an arbitrary 10vh.
   */
  .note-detail {
    max-width: 48rem;
    margin-top: calc(
      var(--category-top-y, clamp(48px, 6.8vh, 70px))
      + 1.296rem
      + 24px
      + clamp(44px, 6vh, 72px)
      + 4px
      - var(--pad)
    );
  }
  .note-detail > p:first-of-type {
    margin: 0 0 8px !important;
    line-height: 1.72;
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
  .note-index { gap: 30px; }
  .note-index a {
    grid-template-columns: 6.4rem minmax(0, 1fr);
    gap: 4px 12px;
    padding: 4px 2px;
    line-height: 1.65;
  }
}
</style>`;

function apply(file) {
  let html = fs.readFileSync(file, "utf8");
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
console.log("Applied Notes spacing and aligned detail dates to the shared index grid.");
