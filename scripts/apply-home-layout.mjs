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

/*
 * On mobile, keep the whole first-page rhythm inside the initial viewport as
 * often as possible. The cover remains present, but it no longer consumes
 * almost half the screen before News and Mailing List appear.
 */
@media (max-width: 820px) {
  .home-canvas {
    min-height: calc(100dvh - 60px) !important;
    padding: 18px 18px 32px !important;
  }
  .home-intro {
    gap: 14px !important;
  }
  .home-motion-field {
    height: clamp(150px, 26dvh, 220px) !important;
    margin: 18px 0 20px !important;
  }
  .moving-cover {
    width: min(36vw, 160px) !important;
  }
  .home-news {
    margin: 0 0 32px !important;
  }
  .home-mailing {
    margin-top: 0 !important;
  }
  .home-news h2 {
    margin-bottom: 10px !important;
  }
  .home-mailing h2 {
    margin-bottom: 16px !important;
  }
}

@media (max-width: 520px) {
  .home-intro {
    gap: 12px !important;
  }
  .home-motion-field {
    height: clamp(140px, 23dvh, 190px) !important;
    margin: 16px 0 18px !important;
  }
  .moving-cover {
    width: min(38vw, 150px) !important;
  }
  .home-news {
    margin-bottom: 32px !important;
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
  border-bottom: 1px solid var(--ink);
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
.home-mailing button:disabled { cursor: default; opacity: .42; }
.home-mailing .mailing-status {
  min-height: 1.4em;
  margin: 9px 0 0;
  color: var(--muted);
  font-size: .68rem;
  line-height: 1.4;
}
.home-mailing .mailing-status:empty { min-height: 0; margin-top: 0; }
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

/* Keep the signup intentionally bare: heading, email line, join. */
html = html.replace(/<p class="mailing-copy">[\s\S]*?<\/p>/, "");

html = html.replace(
  /<form action="(https:\/\/docs\.google\.com\/forms\/d\/e\/[^\"]+)\/viewform" method="get" target="_blank">(?:<input type="hidden" name="usp" value="pp_url">)?/,
  (_match, base) => `<form action="${base}/formResponse" method="post" data-mailing-form data-fallback-url="${base}/viewform">`
);

if (html.includes("data-mailing-form") && !html.includes("data-mailing-status")) {
  html = html.replace(
    /(<section class="home-mailing">[\s\S]*?<\/form>)(<\/section>)/,
    '$1<p class="mailing-status" data-mailing-status aria-live="polite"></p>$2'
  );
}

fs.writeFileSync(file, html);
console.log("Simplified Mailing List copy, preserved the 32px mobile break after News, and kept a sparse signup rhythm.");
