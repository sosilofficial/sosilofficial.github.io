import fs from "node:fs";

const file = new URL("../index.html", import.meta.url);
let html = fs.readFileSync(file, "utf8");

const newsletter = html.match(/<a class="letter-link" href="([^"]+)"/) || html.match(/<a href="([^"]+)">join the mailing list<\/a>/);


const mailingHref = newsletter?.[1] || "https://docs.google.com/forms/d/e/1FAIpQLSfAEUUjmWWbcCj-dZvg8DohqeDwNF7SxTJe1OcUBVQhUvkLxA/viewform";


if (!html.includes('/assets/home-swiss.css')) {
  html = html.replace('</head>', '<link rel="stylesheet" href="/assets/home-swiss.css?v=20260918-mirrored"/></head>');
}

const body = `<body class="home-swiss-body"><div class="site-frame"><a href="/" class="site-brand" aria-label="소실 홈페이지"><span class="brand-roman">sosil</span></a><aside class="side-rail"><nav class="rail-nav" aria-label="주요 메뉴"><a href="/info">info</a><a href="/works/discography">works</a><a href="/news">news</a><a href="/archive">archive</a><a href="/merch">merch</a><a href="/notes">notes</a><a href="/contact">contact</a></nav></aside><main class="site-main"><div class="home-swiss"><section class="home-swiss-intro"><div class="home-swiss-copy"><div class="home-swiss-role"><p>slowcore / alternative folk musician</p><p>based in seoul, south korea</p></div><div class="home-swiss-contact"><a href="mailto:sosil.contact@gmail.com">sosil.contact@gmail.com</a><a href="https://www.instagram.com/headlesssosil/" target="_blank" rel="noreferrer">@headlesssosil</a></div></div></section><nav class="home-text-links" aria-label="소실 소식과 발매"><a href="/news">upcoming shows</a><a href="/works/discography">releases</a><a href="${mailingHref}">join the mailing list</a></nav></div></main></div></body></html>`;

html = html.replace(/<body\b[^>]*>[\s\S]*<\/body><\/html>$/, body);
fs.writeFileSync(file, html);
