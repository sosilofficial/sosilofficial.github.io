import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NOTES_DIR = path.join(ROOT, "notes");
const STYLE = `<style id="slow-notes-style">
@media (min-width: 821px) {
  /* Notes should feel like an ongoing personal log rather than a set of UI cards. */
  .note-index {
    display: grid;
    gap: 30px;
    max-width: 34rem;
  }
  .note-index a {
    display: grid;
    grid-template-columns: 6.6rem minmax(0, 1fr);
    align-items: baseline;
    gap: 0 14px;
    padding: 2px 0;
    line-height: 1.6;
  }
  .note-index a.is-selected {
    background: transparent;
  }
  .note-index span {
    font-size: .66rem;
    letter-spacing: .02em;
    opacity: .72;
  }
  .note-index strong {
    font-size: .84rem;
    font-weight: 400;
    line-height: 1.52;
  }
  .note-index a.is-selected strong {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
  }

  /* Keep the detail page anchored like a journal page, not centered like a portfolio card. */
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
    max-width: 44rem;
    margin: 0 !important;
  }
  .note-detail > p:first-of-type {
    margin: 0 0 8px !important;
    line-height: 1.6;
  }
  .note-detail h1 {
    margin: 0 0 clamp(38px, 5.5vh, 62px) !important;
  }
  .note-detail .prose p {
    max-width: 54ch;
    margin-bottom: 2.35em;
    line-height: 1.88;
  }
  .note-detail .prose img,
  .note-detail .detail-gallery,
  .note-detail .video-embed {
    margin-top: clamp(44px, 6vh, 74px);
    margin-bottom: clamp(44px, 6vh, 74px);
  }
}
@media (max-width: 820px) {
  .note-index { gap: 28px; }
  .note-index a {
    grid-template-columns: 6.1rem minmax(0, 1fr);
    align-items: baseline;
    gap: 0 12px;
    padding: 0;
    line-height: 1.6;
  }
  .note-index a.is-selected { background: transparent; }
  .note-index span { font-size: .64rem; opacity: .72; }
  .note-index strong { font-weight: 400; line-height: 1.55; }
  .note-index a.is-selected strong { text-decoration: underline; text-underline-offset: 3px; }
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
console.log("Refined Notes into a quieter ongoing journal with less card-like UI.");
