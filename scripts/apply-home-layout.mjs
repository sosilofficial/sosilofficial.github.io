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

html = html.replace(
  /(<form action="https:\/\/docs\.google\.com\/forms\/d\/e\/[^"]+\/viewform" method="get" target="_blank">)(?!<input type="hidden" name="usp" value="pp_url">)/,
  '$1<input type="hidden" name="usp" value="pp_url">'
);

fs.writeFileSync(file, html);
console.log("Aligned the homepage right-column grid to the intro line while keeping Mailing List prefill behavior.");
