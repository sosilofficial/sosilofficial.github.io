import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STYLE = `<style id="mobile-detail-screen-style">
@media (max-width: 820px) {
  /*
   * Treat the Discography landing as a real single-column mobile page.
   * Do not leave the empty desktop detail column participating in layout.
   */
  .release-split:not(.has-detail) {
    display: block !important;
    min-height: auto !important;
  }

  .release-split:not(.has-detail) > .index-panel {
    display: block !important;
    width: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    padding: 24px 18px 80px !important;
  }

  .release-split:not(.has-detail) > .detail-panel {
    display: none !important;
  }

  .release-split:not(.has-detail) .release-index {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 32px 16px !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .release-split:not(.has-detail) .release-index > a {
    display: block !important;
    position: relative !important;
    min-width: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .release-split:not(.has-detail) .release-index span {
    display: flex !important;
    width: 100% !important;
    margin-top: 9px !important;
  }

  .release-split:not(.has-detail) .release-index img {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    aspect-ratio: 1 / 1 !important;
    object-fit: cover !important;
  }

  /*
   * Discography and Merch details should read as their own mobile screen,
   * not as the second half of a stacked desktop split.
   */
  .mobile-detail-screen.has-detail {
    display: block !important;
    min-height: auto !important;
  }

  .mobile-detail-screen.has-detail > .index-panel {
    display: none !important;
  }

  .mobile-detail-screen.has-detail > .detail-panel {
    display: block !important;
    width: 100% !important;
    min-height: auto !important;
    padding: 24px 18px 80px !important;
    border-left: 0 !important;
  }

  .mobile-detail-screen.has-detail > .detail-panel > article {
    position: relative !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
  }

  .mobile-detail-screen.has-detail .close-detail {
    position: absolute !important;
    top: 0 !important;
    right: 0 !important;
    float: none !important;
    margin: 0 !important;
    width: 44px !important;
    height: 44px !important;
    z-index: 4 !important;
  }

  .mobile-detail-screen.has-detail .release-detail {
    display: block !important;
    padding: 0 !important;
  }

  .mobile-detail-screen.has-detail .release-detail header {
    margin: 0 0 32px !important;
    padding-right: 42px !important;
  }

  .mobile-detail-screen.has-detail .release-detail header h1 {
    margin-bottom: 5px !important;
    font-size: 1rem !important;
    line-height: 1.42 !important;
  }

  .mobile-detail-screen.has-detail .release-hero {
    display: block !important;
    position: static !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    margin: 0 !important;
    aspect-ratio: auto !important;
    object-fit: contain !important;
  }

  .mobile-detail-screen.has-detail .release-detail .detail-section,
  .mobile-detail-screen.has-detail .release-detail .liner-notes,
  .mobile-detail-screen.has-detail .release-detail .external-links {
    margin-top: 44px !important;
  }

  .mobile-detail-screen.has-detail .merch-detail h1 {
    max-width: none !important;
    margin: 0 42px 28px 0 !important;
    font-size: 1rem !important;
    line-height: 1.42 !important;
  }

  .mobile-detail-screen.has-detail .merch-gallery {
    gap: 18px !important;
    margin: 0 0 32px !important;
  }

  .mobile-detail-screen.has-detail .merch-gallery img {
    width: 100% !important;
    max-width: none !important;
  }

  .mobile-detail-screen.has-detail .purchase-links {
    margin-top: 0 !important;
    padding-bottom: 0 !important;
  }
}
</style>`;

function ensureStyle(html) {
  if (html.includes('id="mobile-detail-screen-style"')) {
    return html.replace(/<style id="mobile-detail-screen-style">[\s\S]*?<\/style>/, STYLE);
  }
  return html.replace("</head>", `${STYLE}</head>`);
}

function detailFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name, "index.html"))
    .filter((file) => fs.existsSync(file));
}

const discographyLanding = path.join(ROOT, "works", "discography", "index.html");
if (fs.existsSync(discographyLanding)) {
  let html = ensureStyle(fs.readFileSync(discographyLanding, "utf8"));
  html = html.replace(/(<div class="release-index">[\s\S]*?<\/div>)/, (index) =>
    index.replace(/loading="lazy"/g, 'loading="eager"')
  );
  fs.writeFileSync(discographyLanding, html);
}

for (const file of detailFiles(path.join(ROOT, "works", "discography"))) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(
    /class="split-layout release-split(?: has-detail)?(?: mobile-detail-screen)?"/,
    'class="split-layout release-split has-detail mobile-detail-screen"'
  );
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

for (const file of detailFiles(path.join(ROOT, "merch"))) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(
    /class="split-layout merch-split(?: has-detail)?(?: mobile-detail-screen)?"/,
    'class="split-layout merch-split has-detail mobile-detail-screen"'
  );
  html = ensureStyle(html);
  fs.writeFileSync(file, html);
}

console.log("Forced Discography landing into a visible two-column mobile list and preserved dedicated Discography/Merch detail screens.");
