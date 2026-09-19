import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STYLE = `<style id="mobile-detail-screen-style">
@media (max-width: 820px) {
  /*
   * Discography and Merch details should read as their own mobile screen,
   * not as the second half of a stacked desktop split.
   */
  .mobile-detail-screen.has-detail {
    display: block !important;
    min-height: calc(100vh - 60px) !important;
  }

  .mobile-detail-screen.has-detail > .index-panel {
    display: none !important;
  }

  .mobile-detail-screen.has-detail > .detail-panel {
    display: block !important;
    width: 100% !important;
    min-height: calc(100vh - 60px) !important;
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
    width: 28px !important;
    height: 28px !important;
    z-index: 4 !important;
  }

  .mobile-detail-screen.has-detail .release-detail {
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
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
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

console.log("Turned Discography and Merch detail routes into dedicated mobile detail screens with close-to-list behavior.");
