import fs from "node:fs";

const file = new URL("../index.html", import.meta.url);
let html = fs.readFileSync(file, "utf8");

const cover = html.match(/<a class="home-featured-release" href="([^"]+)"[^>]*><img src="([^"]+)" alt="([^"]+)"\/><\/a>/);
const newsletter = html.match(/<a class="letter-link" href="([^"]+)"/);
const newsSection = html.match(/<section class="home-panel news-panel"[\s\S]*?<div class="panel-head">[\s\S]*?<\/div>([\s\S]*?)<\/section>/);

const coverHref = cover?.[1] || "https://sosil.bandcamp.com/album/reverie-is-my-pony";
const coverSrc = cover?.[2] || "/media/catalog/2026-09-04/a78bfa4e-a48f-4757-9783-26024fff6536.webp";
const coverAlt = cover?.[3] || "소실 앨범 커버";
const mailingHref = newsletter?.[1] || "https://docs.google.com/forms/d/e/1FAIpQLSfAEUUjmWWbcCj-dZvg8DohqeDwNF7SxTJe1OcUBVQhUvkLxA/viewform";
const newsMarkup = newsSection?.[1] || '<p class="panel-empty">다음 소식을 준비하고 있습니다.</p>';

if (!html.includes('/assets/home-swiss.css')) {
  html = html.replace('</head>', '<link rel="stylesheet" href="/assets/home-swiss.css"/></head>');
}

const body = `<body class="home-swiss-body"><div class="site-frame"><a href="/" class="site-brand" aria-label="소실 홈페이지"><span class="brand-roman">sosil</span></a><aside class="side-rail"><nav class="rail-nav" aria-label="주요 메뉴"><a href="/info">info</a><a href="/works/discography">works</a><a href="/news">news</a><a href="/archive">archive</a><a href="/merch">merch</a><a href="/notes">notes</a><a href="/contact">contact</a></nav></aside><main class="site-main"><div class="home-swiss"><section class="home-swiss-intro"><a class="home-swiss-cover" href="${coverHref}" target="_blank" rel="noreferrer"><img src="${coverSrc}" alt="${coverAlt}"/></a><div class="home-swiss-copy"><div class="home-swiss-role"><p>slowcore / alternative folk musician</p><p>based in seoul, south korea</p></div><div class="home-swiss-contact"><a href="mailto:sosil.contact@gmail.com">sosil.contact@gmail.com</a><a href="https://www.instagram.com/headlesssosil/" target="_blank" rel="noreferrer">@headlesssosil</a></div></div></section><nav class="home-swiss-platforms" aria-label="소실 음악 플랫폼"><a href="https://www.youtube.com/channel/UC0XEauOekig2JVFOf_AEeRQ" target="_blank" rel="noreferrer">youtube</a><a href="https://open.spotify.com/artist/4BazSsfQh7YXzpEeiYhFUq?si=dtZBrzbPSRu7DuahpR_yUw" target="_blank" rel="noreferrer">spotify</a><a href="https://sosil.bandcamp.com/" target="_blank" rel="noreferrer">bandcamp</a><a href="https://music.apple.com/us/artist/sosil/1590350372" target="_blank" rel="noreferrer">apple music</a><a href="https://soundcloud.com/sosil-headless" target="_blank" rel="noreferrer">soundcloud</a></nav><section class="home-swiss-news" aria-labelledby="home-news-title"><h2 id="home-news-title">latest news</h2><div class="home-swiss-news-list">${newsMarkup}</div></section><section class="home-swiss-mailing" aria-labelledby="home-mailing-title"><h2 id="home-mailing-title">mailing list</h2><form action="${mailingHref}" method="get" target="_blank" class="home-swiss-mailing-form"><input type="email" name="emailAddress" placeholder="your@email.com" aria-label="메일 주소"/><input type="hidden" name="usp" value="pp_url"/><button type="submit">메일 남기기 <span>join the mailing list</span></button></form></section></div></main></div></body></html>`;

html = html.replace(/<body>[\s\S]*<\/body><\/html>$/, body);
fs.writeFileSync(file, html);
