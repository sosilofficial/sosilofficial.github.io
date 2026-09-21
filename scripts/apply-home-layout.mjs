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

/* Keep the drifting cover, but make it feel more like a faint printed afterimage than digital FX. */
.moving-cover {
  filter: saturate(.80) contrast(.94) brightness(.99) !important;
}
.moving-cover img {
  filter: blur(.2px) !important;
}
.motion-history {
  opacity: .30 !important;
}
.mobile-motion-history {
  opacity: .14 !important;
}

@media (max-width: 820px) {
  .home-canvas {
    min-height: auto !important;
    padding: 26px 24px 68px !important;
    width: min(100%, 348px);
    margin-inline: auto;
  }
  .home-intro {
    display: block !important;
    width: 100% !important;
    margin: 2px 0 0 !important;
    line-height: 1.72;
    letter-spacing: .01em;
  }
  .home-intro .home-location {
    display: inline-block;
    color: var(--muted);
  }
  .home-motion-field {
    height: clamp(236px, 35dvh, 310px) !important;
    margin: 14px 0 22px !important;
  }
  .moving-cover {
    width: min(24vw, 104px) !important;
  }
  .home-news {
    width: 100% !important;
    margin: 0 0 36px !important;
    padding-top: 0;
    border-top: 0;
  }
  .home-body.home-no-news .home-news {
    display: none !important;
  }
  .home-news h2 {
    margin: 0 0 12px !important;
    padding-bottom: 9px;
    border-bottom: 1px solid rgba(47, 55, 67, .18);
    font-size: .69rem;
    letter-spacing: .035em;
    color: var(--ink);
  }
  .home-news p {
    margin: 0 0 2px;
    color: var(--muted);
    font-size: .64rem;
    line-height: 1.55;
  }
  .home-news > a:not(.small-link) {
    display: block;
    margin-top: 1px;
    line-height: 1.55;
  }
  .home-news .small-link {
    display: none;
  }
  .home-mailing {
    width: 100% !important;
    margin: 0 !important;
    padding-top: 0;
    border-top: 0;
  }
  .home-mailing h2 {
    margin-bottom: 10px !important;
    font-size: .69rem;
    letter-spacing: .035em;
    color: var(--ink);
  }
  .home-canvas .home-mailing form { width: 100%; border-bottom: 0 !important; }
}

@media (max-width: 520px) {
  .home-canvas {
    padding-top: 24px !important;
    padding-bottom: 64px !important;
  }
  .home-intro {
    width: 100% !important;
  }
  .home-motion-field {
    height: clamp(224px, 34dvh, 286px) !important;
    margin: 12px 0 22px !important;
  }
  .moving-cover {
    width: min(24.5vw, 100px) !important;
  }
  .home-news {
    width: 100% !important;
    margin-bottom: 34px !important;
  }
  .home-mailing {
    width: 100% !important;
  }
}

.home-mailing h2 {
  margin-bottom: 10px;
}
.home-mailing form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 0;
  width: min(100%, 240px);
  border-bottom: 0;
  background: rgba(17, 21, 27, .035);
}
.home-mailing input {
  min-width: 0;
  width: 100%;
  padding: 7px 9px;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: .69rem;
}
.home-mailing input:focus-visible {
  outline: 1px solid rgba(17, 21, 27, .42);
  outline-offset: 2px;
}
.home-mailing button {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  padding: 7px 10px;
  border: 0;
  background: var(--ink);
  color: var(--bg);
  clip-path: none;
  cursor: pointer;
  font-size: .64rem;
  letter-spacing: .03em;
  text-transform: lowercase;
}
.home-mailing button:hover { opacity: .82; }
</style>`;

let html = fs.readFileSync(file, "utf8");

if (html.includes('id="home-mailing-join-style"')) {
  html = html.replace(/<style id="home-mailing-join-style">[\s\S]*?<\/style>/, STYLE);
} else {
  html = html.replace("</head>", `${STYLE}</head>`);
}

html = html.replace(
  "<p>a slowcore / alternative folk musician<br>based in seoul, south korea</p>",
  '<p><span class="home-grid-anchor">a slowcore / alternative folk musician</span><br><span class="home-location">based in seoul, south korea</span></p>'
);

/* Keep the intro to one quiet block. */
html = html.replace(/<p>i make music,<br>and moving images\.<\/p>/, "");

/* Keep the News slot available on desktop; when there is no authored News post, mobile hides it. */
if (!html.includes('class="home-news"')) {
  html = html.replace(
    '<section class="home-mailing">',
    '<section class="home-news"><h2>latest news</h2><p class="empty-note">no news yet.</p></section><section class="home-mailing">'
  );
} else {
  html = html.replace(/(<section class="home-news"><h2>)[^<]*(<\/h2>)/, "$1latest news$2");
}

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
console.log("Tightened the mobile homepage rhythm with a quieter intro, structured latest News, and closer lower-page spacing.");
