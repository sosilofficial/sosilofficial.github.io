import fs from "node:fs";

const file = new URL("../index.html", import.meta.url);
if (!fs.existsSync(file)) throw new Error("Homepage must be generated before layout validation.");

const STYLE = `<style id="home-mailing-join-style">
@media (min-width: 821px) {
  .home-canvas {
    --home-copy-width: min(29vw, 443px);
  }
  .home-intro,
  .home-news,
  .home-mailing {
    width: var(--home-copy-width) !important;
  }
  .home-grid-anchor {
    display: inline-block;
    width: max-content;
    max-width: none;
    white-space: nowrap;
  }
}

@media (max-width: 820px) {
  .home-canvas {
    min-height: auto !important;
    padding: 26px 18px 68px !important;
  }
  .home-intro {
    display: block !important;
    width: min(78%, 300px) !important;
    margin: 2px 0 0 2px !important;
    line-height: 1.72;
    letter-spacing: .01em;
  }
  .home-motion-field {
    height: clamp(240px, 36dvh, 320px) !important;
    margin: 18px -2px 28px !important;
  }
  .moving-cover {
    width: min(24vw, 104px) !important;
  }
  .home-news {
    width: min(82%, 310px) !important;
    margin: 0 0 52px 2px !important;
    padding-top: 0;
    border-top: 0;
  }
  .home-mailing {
    width: min(82%, 310px) !important;
    margin: 0 0 0 2px !important;
    padding-top: 0;
    border-top: 0;
  }
  .home-news h2,
  .home-mailing h2 {
    margin-bottom: 12px !important;
    font-size: .69rem;
    letter-spacing: .035em;
    color: var(--muted);
  }
  .home-news p {
    line-height: 1.6;
  }
  .home-mailing form { border-bottom: 0 !important; }
}

@media (max-width: 520px) {
  .home-canvas {
    padding-top: 24px !important;
    padding-bottom: 64px !important;
  }
  .home-intro {
    width: 82% !important;
  }
  .home-motion-field {
    height: clamp(230px, 35dvh, 294px) !important;
    margin: 16px -2px 26px !important;
  }
  .moving-cover {
    width: min(24.5vw, 100px) !important;
  }
  .home-news {
    width: 86% !important;
    margin-bottom: 48px !important;
  }
  .home-mailing {
    width: 86% !important;
  }
}

.home-mailing h2 {
  margin-bottom: 18px;
}
.home-mailing form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  border-bottom: 0;
}
.home-mailing input {
  min-width: 0;
  width: 100%;
  padding: 6px 0;
  border: 0;
  outline: 0;
  background: transparent;
}
.home-mailing button {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  padding: 6px 0;
  border: 0;
  background: transparent;
  clip-path: none;
  cursor: pointer;
  text-transform: lowercase;
}
.home-mailing button:hover { opacity: .56; }
</style>`;

let html = fs.readFileSync(file, "utf8");

if (html.includes('id="home-mailing-join-style"')) {
  html = html.replace(/<style id="home-mailing-join-style">[\s\S]*?<\/style>/, STYLE);
} else {
  html = html.replace("</head>", `${STYLE}</head>`);
}

html = html.replace(
  "<p>slowcore / alternative folk musician<br>based in seoul, south korea</p>",
  '<p><span class="home-grid-anchor">slowcore / alternative folk musician</span><br>based in seoul, south korea</p>'
);

/* Keep the intro to one quiet block. */
html = html.replace(/<p>i make music,<br>and moving images\.<\/p>/, "");

/* Keep the News slot visible even before the first authored News post exists. */
if (!html.includes('class="home-news"')) {
  html = html.replace(
    '<section class="home-mailing">',
    '<section class="home-news"><h2>latest news</h2><p class="empty-note">no news yet.</p></section><section class="home-mailing">'
  );
} else {
  html = html.replace(/(<section class="home-news"><h2>)[^<]*(<\/h2>)/, "$1latest news$2");
}
html = html.replace(/ home-no-news/g, "");

/* Keep the signup intentionally bare: heading, email line, join. */
html = html.replace(/<p class="mailing-copy">[\s\S]*?<\/p>/, "");

/*
 * Keep Google Forms as the final confirmation step. The email field is sent
 * with the viewform GET request so Google opens with the address prefilled;
 * the visitor only needs to press Google's submit button.
 */
html = html.replace(
  /<form action="(https:\/\/docs\.google\.com\/forms\/d\/e\/[^\"]+)\/formResponse" method="post" data-mailing-form(?: data-fallback-url="[^"]+")?>/,
  (_match, base) => `<form action="${base}/viewform" method="get" target="_blank"><input type="hidden" name="usp" value="pp_url">`
);
html = html.replace(/<p class="mailing-status"[\s\S]*?<\/p>/, "");

/* Mobile and desktop cover motion now live together in site-redesign.js. */
html = html.replace(/<script id="home-mobile-motion-script">[\s\S]*?<\/script>/, "");

fs.writeFileSync(file, html);
console.log("Refined the mobile homepage into a quieter asymmetric slowcore layout while preserving News and the Google Forms handoff.");
