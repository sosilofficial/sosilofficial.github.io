import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const SAMPLE_CONTENT = path.join(ROOT, "samples");
const USE_SAMPLES = process.env.SOSIL_PREVIEW_SAMPLES === "1";
const ORIGIN = "https://sosilofficial.github.io";
const ALBUM_YOUTUBE = "https://www.youtube.com/watch?v=zZtQdgaWjBI";
const INFO_IMAGE = "/media/catalog/2026-09-03/bea73aac-1cd3-40a4-b56a-889b5a3b5ded.webp";

const esc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const uniq = (values = []) => [...new Set(values.filter(Boolean))];
const displayDate = (value = "") => {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : String(value);
};
const absolute = (url = "") => url.startsWith("/") ? `${ORIGIN}${url}` : url;
const linkUrl = (item, label) => item?.links?.find((link) => !label || link.label === label)?.url || "";

function youtubeId(url = "") {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || "";
    if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) return parsed.searchParams.get("v") || parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] || "";
  } catch {}
  return "";
}
const youtubeThumbnail = (url = "") => youtubeId(url) ? `https://i.ytimg.com/vi/${youtubeId(url)}/mqdefault.jpg` : "";
const firstImage = (item = {}) => item.thumbnail || item.images?.[0] || youtubeThumbnail(item.video) || "";

function parseFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`CONTENT ERROR: front matter가 없습니다: ${path.relative(ROOT, file)}`);
  const data = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon < 1) throw new Error(`CONTENT ERROR: 잘못된 front matter: ${path.relative(ROOT, file)} / ${line}`);
    const key = line.slice(0, colon).trim();
    try { data[key] = JSON.parse(line.slice(colon + 1).trim()); }
    catch { throw new Error(`CONTENT ERROR: ${key} 값은 JSON 형식이어야 합니다: ${path.relative(ROOT, file)}`); }
  }
  data.body = match[2].replace(/^\n/, "").replace(/\n$/, "");
  data.source = path.relative(ROOT, file);
  for (const key of ["type", "category", "title", "slug"]) if (!data[key]) throw new Error(`CONTENT ERROR: ${key} 값이 없습니다: ${data.source}`);
  if (!Array.isArray(data.images) || !Array.isArray(data.links)) throw new Error(`CONTENT ERROR: images와 links는 배열이어야 합니다: ${data.source}`);
  return data;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : entry.name.endsWith(".md") ? [full] : [];
  });
}

const sourceFiles = [...walk(CONTENT), ...(USE_SAMPLES && fs.existsSync(SAMPLE_CONTENT) ? walk(SAMPLE_CONTENT) : [])];
const all = sourceFiles.map(parseFile).filter((item) => item.published !== false);
const newestFirst = (a, b) => String(b.date).localeCompare(String(a.date)) || Number(a.order || 0) - Number(b.order || 0);
const by = (category, subcategory = "") => all.filter((item) => item.type === "content" && item.category === category && item.subcategory === subcategory).sort(newestFirst);
const site = (category) => all.find((item) => item.type === "site" && item.category === category);

function inlineMarkdown(text = "") {
  return esc(text)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async">')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(new RegExp("\\*\\*([^*]+)\\*\\*", "g"), "<strong>$1</strong>")
    .replace(new RegExp("\\*([^*]+)\\*", "g"), "<em>$1</em>");
}
function bodyHtml(item, className = "prose") {
  const body = item.body || "";
  if (!body) return "";
  if (item.body_format === "plain") return `<div class="${className}">${esc(body)}</div>`;
  const blocks = body.split(/\n{2,}/).filter(Boolean).map((block) => {
    const lines = block.split("\n");
    if (lines.every((line) => /^[-*] /.test(line))) return `<ul>${lines.map((line) => `<li>${inlineMarkdown(line.slice(2))}</li>`).join("")}</ul>`;
    if (lines.every((line) => /^\d+[.)] /.test(line))) return `<ol>${lines.map((line) => `<li>${inlineMarkdown(line.replace(/^\d+[.)] /, ""))}</li>`).join("")}</ol>`;
    return `<p>${inlineMarkdown(block).replaceAll("\n", "<br>")}</p>`;
  });
  return `<div class="${className}">${blocks.join("")}</div>`;
}

function titleFor(name) { return name === "소실 SOSIL" ? "소실 SOSIL — 김성빈의 slowcore / folk 음악 프로젝트" : `${name} | 소실 SOSIL`; }
function head(name, description, route, image = "", detail = false) {
  const title = titleFor(name);
  const canonical = `${ORIGIN}${route === "/" ? "/" : `${route.replace(/\/$/, "")}/`}`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="icon" href="/favicon-sosil.svg"><link rel="stylesheet" href="/assets/site-redesign.css?v=20260919-3"><script src="/assets/site-redesign.js?v=20260919-3" defer></script><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:locale" content="ko_KR"><meta property="og:type" content="${detail ? "article" : "website"}"><meta property="og:site_name" content="소실 SOSIL"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}">${image ? `<meta property="og:image" content="${esc(absolute(image))}">` : ""}<meta name="twitter:card" content="summary_large_image">${route === "/" ? '<script type="application/ld+json">{"@context":"https://schema.org","@type":"MusicGroup","name":"소실","alternateName":"Sosil","member":{"@type":"Person","name":"김성빈"},"genre":["slowcore","folk"],"url":"https://sosilofficial.github.io/"}</script>' : ""}</head>`;
}
function shell(active, main, bodyClass = "") {
  const nav = [["works", "/works"], ["news", "/news"], ["notes", "/notes"], ["archive", "/archive"], ["merch", "/merch"], ["info", "/info"], ["contact", "/contact"]].map(([label, href]) => `<a href="${href}"${active === label ? ' class="is-active" aria-current="page"' : ""}>${label}</a>`).join("");
  return `<body class="${bodyClass}"><div class="site-frame"><aside class="side-rail"><a href="/" class="site-brand" aria-label="소실 홈">sosil</a><nav class="rail-nav" aria-label="주요 메뉴">${nav}</nav></aside><main class="site-main">${main}</main></div></body></html>`;
}
function page(name, description, route, active, main, image = "", detail = false, bodyClass = "") { return `${head(name, description, route, image, detail)}${shell(active, main, bodyClass)}`; }
function writeRoute(route, contents) {
  const dir = route === "/" ? ROOT : path.join(ROOT, route.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), contents);
}
function clearDetails(route) {
  const dir = path.join(ROOT, route.replace(/^\//, ""));
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) if (entry.isDirectory()) fs.rmSync(path.join(dir, entry.name), { recursive: true });
}

function subnav(type, active) {
  const links = type === "works" ? [["discography", "/works/discography"], ["video", "/works/videos"], ["live", "/works/live"], ["others", "/works/others"]] : [["photo", "/archive/photo-video"], ["video", "/archive/videos"], ["text", "/archive/links"]];
  return `<nav class="subnav" aria-label="${type} 하위 메뉴">${links.map(([label, href]) => `<a href="${href}"${active === label ? ' class="is-active" aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
}
const split = (indexHtml, detailHtml = "", classes = "") => `<div class="split-layout ${classes}"><section class="index-panel">${indexHtml}</section><section class="detail-panel">${detailHtml}</section></div>`;
const closeLink = (href, label) => `<button type="button" class="close-detail" data-close-url="${href}" aria-label="${esc(label)} 닫기">×</button>`;
const sampleMark = (item) => item.sample ? '<small class="sample-badge">sample preview</small>' : "";
function itemList(items, base, selected = "") {
  if (!items.length) return '<p class="empty-note">more soon.</p>';
  return `<div class="text-index">${items.map((item) => `<a href="${base}/${esc(item.slug)}"${selected === item.slug ? ' class="is-selected" aria-current="page"' : ""}><span>${esc(displayDate(item.date))}</span><strong>${esc(item.title)}</strong></a>`).join("")}</div>`;
}
function imageGallery(item, className = "detail-gallery") {
  const images = uniq(item.images || []);
  return images.length ? `<div class="${className}">${images.map((url, i) => `<img src="${esc(url)}" alt="${esc(item.title)} ${i + 1}" loading="${i ? "lazy" : "eager"}" decoding="async">`).join("")}</div>` : "";
}
const externalLinks = (item, className = "external-links") => item.links?.length ? `<nav class="${className}" aria-label="외부 링크">${item.links.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noreferrer">${esc(link.label || "view")}</a>`).join("")}</nav>` : "";
function videoEmbed(item) {
  const source = item.video || linkUrl(item);
  const id = youtubeId(source);
  if (id) return `<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(item.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
  try {
    const parsed = new URL(source);
    const driveId = parsed.hostname === "drive.google.com" ? parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] : "";
    if (driveId) return `<div class="video-embed"><iframe src="https://drive.google.com/file/d/${esc(driveId)}/preview" title="${esc(item.title)}" loading="lazy" allow="autoplay" allowfullscreen></iframe></div>`;
  } catch {}
  const url = source;
  return url ? `<a class="media-fallback" href="${esc(url)}" target="_blank" rel="noreferrer">${firstImage(item) ? `<img src="${esc(firstImage(item))}" alt="" loading="lazy">` : ""}<span>open video</span></a>` : "";
}
function releaseIndex(items, selected = "") {
  return `<div class="release-index">${items.map((item) => `<a href="/works/discography/${esc(item.slug)}"${selected === item.slug ? ' class="is-selected" aria-current="page"' : ""}>${firstImage(item) ? `<img src="${esc(firstImage(item))}" alt="" loading="lazy" decoding="async">` : ""}<span><strong>${esc(item.title)}</strong><small>${esc(displayDate(item.date))}</small></span></a>`).join("")}</div>`;
}
function releaseDetail(item) {
  const tracks = item.tracklist?.length ? `<section class="detail-section"><h2>tracklist</h2><ol class="track-list">${item.tracklist.map((track, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><span>${esc(track)}</span></li>`).join("")}</ol></section>` : "";
  return `<article class="release-detail">${closeLink("/works/discography", "discography")}<header><p>${esc(displayDate(item.date))}</p><h1>${esc(item.title)}</h1>${item.subtitle ? `<p>${esc(item.subtitle)}</p>` : ""}</header>${firstImage(item) ? `<img class="release-hero" src="${esc(firstImage(item))}" alt="${esc(item.title)} 앨범 커버" decoding="async">` : ""}${tracks}${bodyHtml(item, "prose liner-notes")}${item.credits ? `<section class="detail-section"><h2>credits</h2><p>${esc(item.credits)}</p></section>` : ""}${externalLinks(item)}</article>`;
}

const worksDescription = "소실(Sosil)의 음반, 영상과 공연 기록.";
const archiveDescription = "소실(Sosil)의 사진, 영상, 인터뷰와 리뷰 아카이브.";
const routes = [];
function publish(route, html) { writeRoute(route, html); if (!route.startsWith("/gibberish")) routes.push(route); }

clearDetails("/works/discography");
clearDetails("/works/others");
const discography = by("works", "discography");
const workVideos = by("works", "video");
const live = by("works", "live");
const others = by("works", "others");
const worksOverview = `<div class="works-overview">
  <a href="/works/discography"><span>discography</span>${firstImage(discography[0]) ? `<img src="${esc(firstImage(discography[0]))}" alt="" loading="lazy" decoding="async">` : ""}<small>${discography.length} releases</small></a>
  <a href="/works/videos"><span>video</span>${firstImage(workVideos[0]) ? `<img src="${esc(firstImage(workVideos[0]))}" alt="" loading="lazy" decoding="async">` : ""}<small>${workVideos.length} records</small></a>
  <a href="/works/live"><span>live</span><small>history</small></a>
  <a href="/works/others"><span>others</span>${firstImage(others[0]) ? `<img src="${esc(firstImage(others[0]))}" alt="" loading="lazy" decoding="async">` : ""}<small>${others.length ? `${others.length} records` : "more soon."}</small></a>
</div>`;
publish("/works", page("works", worksDescription, "/works", "works", `<div class="wide-page works-landing"><h1>works</h1>${worksOverview}</div>`, firstImage(discography[0])));
const discGrid = `<div class="release-grid">${discography.map((item) => `<article><a href="/works/discography/${esc(item.slug)}">${firstImage(item) ? `<img src="${esc(firstImage(item))}" alt="${esc(item.title)} 앨범 커버" loading="lazy" decoding="async">` : ""}<span><strong>${esc(item.title)}</strong><small>${esc(displayDate(item.date))}</small></span></a></article>`).join("")}</div>`;
publish("/works/discography", page("works / discography", worksDescription, "/works/discography", "works", `<div class="wide-page">${subnav("works", "discography")}${discGrid}</div>`, firstImage(discography[0]), true));
for (const item of discography) {
  const main = split(`<div class="panel-headline">${subnav("works", "discography")}</div>${releaseIndex(discography, item.slug)}`, releaseDetail(item), "release-split");
  publish(`/works/discography/${item.slug}`, page(item.title, item.seo_description || item.description || item.title, `/works/discography/${item.slug}`, "works", main, firstImage(item), true));
}

const videoMeta = (item) => [displayDate(item.date), item.runtime, item.type_label || item.media_type || item.meta].filter(Boolean);
const videoIndex = workVideos.length ? `<div class="video-index">${workVideos.map((item, i) => `<a href="#video-${esc(item.slug)}" data-panel-target="video-${esc(item.slug)}"${i === 0 ? ' class="is-selected"' : ""}>${firstImage(item) ? `<img src="${esc(firstImage(item))}" alt="" loading="lazy" decoding="async">` : ""}<span><strong>${esc(item.title)}</strong>${videoMeta(item).map((value) => `<small>${esc(value)}</small>`).join("")}</span></a>`).join("")}</div>` : '<p class="empty-note">more soon.</p>';
const videoPanels = workVideos.map((item, i) => `<article id="video-${esc(item.slug)}" class="switch-panel"${i ? " hidden" : ""} data-panel="video-${esc(item.slug)}">${videoEmbed(item)}<h1>${esc(item.title)}</h1>${videoMeta(item).length ? `<p class="media-meta">${videoMeta(item).map(esc).join(" · ")}</p>` : ""}${item.credit ? `<p class="media-credit">${esc(item.credit)}</p>` : ""}${item.note ? `<div class="prose">${esc(item.note)}</div>` : ""}${bodyHtml(item)}</article>`).join("");
publish("/works/videos", page("works / video", worksDescription, "/works/videos", "works", split(`<div class="panel-headline">${subnav("works", "video")}</div>${videoIndex}`, videoPanels, "video-split"), firstImage(workVideos[0]), true));

function liveRows(item) {
  let currentYear = "";
  return esc(item.body || `${item.date} | ${item.title}`).split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (/^\d{4}$/.test(trimmed)) {
      if (trimmed === currentYear) return "";
      currentYear = trimmed;
      return `<h2>${trimmed}</h2>`;
    }
    const [date = "", rest = ""] = line.split("|").map((part) => part.trim());
    const year = date.match(/^(\d{4})/)?.[1] || "";
    const heading = year && year !== currentYear ? `<h2>${year}</h2>` : "";
    if (year) currentYear = year;
    const [event = "", venue = ""] = rest.split("@").map((part) => part.trim());
    return `${heading}<div class="live-row"><time>${date}</time><span>${event}</span><small>${venue}</small></div>`;
  }).join("");
}
publish("/works/live", page("works / live", worksDescription, "/works/live", "works", split(`<div class="panel-headline">${subnav("works", "live")}</div><div class="live-log">${live.map(liveRows).join("")}</div>`, "", "live-split"), "", true));
const othersHasDetail = (item) => Boolean(firstImage(item) || item.video || item.body || item.credit);
const othersIndex = (selected = "") => others.length ? `<div class="text-index others-index">${others.map((item) => {
  const inside = `<span>${esc(displayDate(item.date))}</span><strong>${esc(item.title)}</strong><small>${esc(item.type_label || item.meta || "")}</small>${sampleMark(item)}${item.note ? `<em>${esc(item.note)}</em>` : ""}`;
  return othersHasDetail(item) ? `<a href="/works/others/${esc(item.slug)}"${selected === item.slug ? ' class="is-selected" aria-current="page"' : ""}>${inside}</a>` : `<div class="index-static">${inside}</div>`;
}).join("")}</div>` : '<p class="empty-note">more soon.</p>';
publish("/works/others", page("works / others", worksDescription, "/works/others", "works", split(`<div class="panel-headline">${subnav("works", "others")}</div>${othersIndex()}`, ""), "", true));
for (const item of others) {
  if (!othersHasDetail(item)) continue;
  const detail = `<article class="text-detail">${closeLink("/works/others", "others")}<p>${esc(displayDate(item.date))}</p><h1>${esc(item.title)}</h1>${imageGallery(item)}${videoEmbed(item)}${item.credit ? `<p class="media-credit">${esc(item.credit)}</p>` : ""}${item.note ? `<div class="prose">${esc(item.note)}</div>` : ""}${bodyHtml(item)}${externalLinks(item)}</article>`;
  publish(`/works/others/${item.slug}`, page(item.title, item.description || item.title, `/works/others/${item.slug}`, "works", split(`<div class="panel-headline">${subnav("works", "others")}</div>${othersIndex(item.slug)}`, detail), firstImage(item), true));
}

clearDetails("/news");
const news = by("news");
const newsIndex = (selected = "") => news.length ? `<div class="text-index news-index">${news.map((item) => `<a href="/news/${esc(item.slug)}"${selected === item.slug ? ' class="is-selected" aria-current="page"' : ""}><span>${esc(displayDate(item.date))}</span><strong>${esc(item.title)}</strong>${sampleMark(item)}${item.description ? `<small>${esc(item.description)}</small>` : ""}</a>`).join("")}</div>` : '<p class="empty-note">no news yet.</p>';
publish("/news", page("news", "소실(Sosil)의 발매, 공연과 새로운 소식.", "/news", "news", split(`<div class="panel-title">news</div>${newsIndex()}`, ""), "", false));
for (const item of news) {
  const detail = `<article class="text-detail">${closeLink("/news", "news")}<p>${esc(displayDate(item.date))}</p><h1>${esc(item.title)}</h1>${item.description ? `<p class="summary">${esc(item.description)}</p>` : ""}${imageGallery(item)}${bodyHtml(item)}${externalLinks(item)}</article>`;
  publish(`/news/${item.slug}`, page(item.title, item.description || item.title, `/news/${item.slug}`, "news", split(`<div class="panel-title">news</div>${newsIndex(item.slug)}`, detail), firstImage(item), true));
}

clearDetails("/notes");
clearDetails("/gibberish");
const notes = by("notes");
const notesIndex = (selected = "") => `<div class="note-index">${notes.map((item) => `<a href="/notes/${esc(item.slug)}"${selected === item.slug ? ' class="is-selected" aria-current="page"' : ""}><span>${esc(displayDate(item.date))}</span><strong>${esc(item.title)}</strong></a>`).join("")}</div>`;
const notesList = page("notes", "소실(Sosil)의 작업 노트와 기록.", "/notes", "notes", split(`<div class="panel-title">notes</div>${notesIndex()}`, ""), firstImage(notes[0]));
publish("/notes", notesList);
writeRoute("/gibberish", notesList);
for (const item of notes) {
  const detail = `<article class="text-detail note-detail">${closeLink("/notes", "notes")}<p>${esc(displayDate(item.date))}</p><h1>${esc(item.title)}</h1>${videoEmbed(item)}${imageGallery(item)}${bodyHtml(item)}${externalLinks(item)}</article>`;
  const detailPage = page(item.title, item.description || item.body.slice(0, 150) || item.title, `/notes/${item.slug}`, "notes", split(`<div class="panel-title">notes</div>${notesIndex(item.slug)}`, detail), firstImage(item), true);
  publish(`/notes/${item.slug}`, detailPage);
  writeRoute(`/gibberish/${item.slug}`, detailPage);
}

clearDetails("/archive/photo-video");
clearDetails("/archive/videos");
clearDetails("/archive/links");
const archivePhotos = by("archive", "photo");
const archiveVideos = by("archive", "video");
const archiveLinks = by("archive", "links");
const photoTiles = archivePhotos.flatMap((item) => uniq(item.images || []).map((url, i) => ({ item, url, i })));
const photoGrid = `<div class="photo-masonry">${photoTiles.map(({ item, url, i }) => `<a href="/archive/photo-video/${esc(item.slug)}#photo-${esc(item.slug)}-${i}"><img src="${esc(url)}" alt="${esc(item.title)} ${i + 1}" loading="lazy" decoding="async"></a>`).join("")}</div>`;
const archivePhotoMain = `<div class="wide-page">${subnav("archive", "photo")}${photoGrid}</div>`;
publish("/archive", page("archive / photo", archiveDescription, "/archive", "archive", archivePhotoMain, photoTiles[0]?.url || ""));
publish("/archive/photo-video", page("archive / photo", archiveDescription, "/archive/photo-video", "archive", archivePhotoMain, photoTiles[0]?.url || ""));
for (const item of archivePhotos) {
  const selectedId = `photo-${item.slug}-0`;
  const thumbs = `<div class="photo-index">${photoTiles.map(({ item: listed, url, i }) => {
    const id = `photo-${listed.slug}-${i}`;
    return `<a href="#${esc(id)}" data-panel-target="${esc(id)}"${id === selectedId ? ' class="is-selected"' : ""}><img src="${esc(url)}" alt="${esc(listed.title)} ${i + 1}" loading="lazy"></a>`;
  }).join("")}</div>`;
  const detail = photoTiles.map(({ item: listed, url, i }) => {
    const id = `photo-${listed.slug}-${i}`;
    return `<article id="${esc(id)}" class="photo-detail switch-panel"${id === selectedId ? "" : " hidden"} data-panel="${esc(id)}">${closeLink("/archive/photo-video", "photo")}<img class="photo-selected" src="${esc(url)}" alt="${esc(listed.title)} ${i + 1}" loading="${id === selectedId ? "eager" : "lazy"}" decoding="async"><h1>${esc(listed.title)}</h1><p>${esc(displayDate(listed.date))}</p>${bodyHtml(listed)}</article>`;
  }).join("");
  publish(`/archive/photo-video/${item.slug}`, page(item.title, item.description || item.title, `/archive/photo-video/${item.slug}`, "archive", split(`<div class="panel-headline">${subnav("archive", "photo")}</div>${thumbs}`, detail), firstImage(item), true));
}

const archiveVideoGrid = archiveVideos.length ? `<div class="archive-video-grid">${archiveVideos.map((item) => `<a href="/archive/videos/${esc(item.slug)}">${firstImage(item) ? `<img src="${esc(firstImage(item))}" alt="" loading="lazy">` : '<span class="media-placeholder">video</span>'}<span>${item.runtime ? `<small>${esc(item.runtime)}</small>` : ""}<strong>${esc(item.title)}</strong><small>${esc(displayDate(item.date))}</small>${sampleMark(item)}</span></a>`).join("")}</div>` : '<p class="empty-note wide-empty">more soon.</p>';
publish("/archive/videos", page("archive / video", archiveDescription, "/archive/videos", "archive", `<div class="wide-page">${subnav("archive", "video")}${archiveVideoGrid}</div>`));
for (const item of archiveVideos) {
  const archiveVideoIndex = `<div class="video-index archive-video-index">${archiveVideos.map((listed) => `<a href="/archive/videos/${esc(listed.slug)}"${listed.slug === item.slug ? ' class="is-selected" aria-current="page"' : ""}>${firstImage(listed) ? `<img src="${esc(firstImage(listed))}" alt="" loading="lazy">` : '<span class="media-placeholder">video</span>'}<span><strong>${esc(listed.title)}</strong>${listed.runtime ? `<small>${esc(listed.runtime)}</small>` : ""}<small>${esc(displayDate(listed.date))}</small></span></a>`).join("")}</div>`;
  const detail = `<article class="video-detail">${closeLink("/archive/videos", "video")}${videoEmbed(item)}<h1>${esc(item.title)}</h1><p>${esc(displayDate(item.date))}</p>${item.note ? `<div class="prose">${esc(item.note)}</div>` : ""}${bodyHtml(item)}</article>`;
  const detailPage = page(item.title, item.description || item.title, `/archive/videos/${item.slug}`, "archive", split(`<div class="panel-headline">${subnav("archive", "video")}</div>${archiveVideoIndex}`, detail), firstImage(item), true);
  publish(`/archive/videos/${item.slug}`, detailPage);
  writeRoute(`/archive/photo-video/${item.slug}`, detailPage);
}
const linkPublisher = (item) => { try { return new URL(linkUrl(item) || item.video).hostname.replace(/^www\./, ""); } catch { return item.creator || item.meta || ""; } };
const archiveTextIndex = (selected = "") => `<div class="text-index archive-text-index">${archiveLinks.map((item) => `<a href="/archive/links/${esc(item.slug)}"${selected === item.slug ? ' class="is-selected" aria-current="page"' : ""}><span>${esc(displayDate(item.date))}</span><strong>${esc(item.title)}</strong><small>${esc(linkPublisher(item))}</small></a>`).join("")}</div>`;
publish("/archive/links", page("archive / text", archiveDescription, "/archive/links", "archive", split(`<div class="panel-headline">${subnav("archive", "text")}</div>${archiveTextIndex()}`, ""), "", true));
for (const item of archiveLinks) {
  const original = linkUrl(item) || item.video;
  const publisher = linkPublisher(item);
  const detail = `<article class="text-detail archive-text-detail">${closeLink("/archive/links", "text")}<p>${esc(displayDate(item.date))}</p><h1>${esc(item.title)}</h1><p class="publisher">${esc(publisher)}</p>${firstImage(item) ? `<img class="archive-text-image" src="${esc(firstImage(item))}" alt="" loading="lazy">` : ""}${item.description ? `<p class="summary">${esc(item.description)}</p>` : ""}${bodyHtml(item)}${original ? `<dl class="source-link"><dt>original</dt><dd><a href="${esc(original)}" target="_blank" rel="noreferrer">${esc(publisher)}</a></dd><dt>url</dt><dd><a href="${esc(original)}" target="_blank" rel="noreferrer">${esc(original)}</a></dd></dl>` : ""}</article>`;
  publish(`/archive/links/${item.slug}`, page(item.title, item.description || item.title, `/archive/links/${item.slug}`, "archive", split(`<div class="panel-headline">${subnav("archive", "text")}</div>${archiveTextIndex(item.slug)}`, detail), firstImage(item), true));
}

clearDetails("/merch");
const merch = by("merch");
const formatKrw = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? `₩${new Intl.NumberFormat("ko-KR").format(Number(value))}` : "";
const merchMeta = (item) => {
  const price = formatKrw(item.price_krw);
  const status = ["available", "sold out", "preorder"].includes(item.status) ? item.status : "";
  if (!price && !status) return "";
  return `<span class="merch-data"${price ? ` data-price-krw="${Number(item.price_krw)}"` : ""}>${price ? `<small>${esc(price)} KRW</small>` : ""}${status ? `<small>${esc(status)}</small>` : ""}</span>`;
};
const merchIndex = (selected = "") => `<div class="merch-index">${merch.map((item) => `<a href="/merch/${esc(item.slug)}"${selected === item.slug ? ' class="is-selected" aria-current="page"' : ""}>${firstImage(item) ? `<img src="${esc(firstImage(item))}" alt="" loading="lazy">` : ""}<span><strong>${esc(item.title)}</strong>${merchMeta(item)}${sampleMark(item)}${item.meta ? `<small>${esc(item.meta)}</small>` : ""}</span></a>`).join("")}</div>`;
const merchFirst = merch[0];
const merchDetail = (item) => item ? `<article class="merch-detail">${closeLink("/merch", "merch")}<h1>${esc(item.title)}</h1>${merchMeta(item)}${item.description ? `<p>${esc(item.description)}</p>` : ""}${imageGallery(item, "merch-gallery")}${bodyHtml(item)}${externalLinks(item, "purchase-links")}</article>` : "";
publish("/merch", page("merch", "소실(Sosil)의 음반과 머천다이즈.", "/merch", "merch", split(`<div class="panel-title">merch</div>${merchIndex(merchFirst?.slug)}`, merchDetail(merchFirst), "merch-split"), firstImage(merchFirst)));
for (const item of merch) publish(`/merch/${item.slug}`, page(item.title, item.description || item.title, `/merch/${item.slug}`, "merch", split(`<div class="panel-title">merch</div>${merchIndex(item.slug)}`, merchDetail(item), "merch-split"), firstImage(item), true));

const info = site("info");
const infoLinks = info.links.map((link, i) => `<a href="${esc(link.url)}" target="_blank" rel="noreferrer"><span>${String(i + 1).padStart(2, "0")}</span>${esc(link.label)}</a>`).join("");
const [infoKo = "", infoEn = ""] = info.subtitle.split(/\n\s*\n/, 2);
const infoMain = split(`<article class="info-copy"><h1>info</h1><div>${esc(infoKo)}</div></article>`, `<aside class="info-aside"><figure><img src="${INFO_IMAGE}" alt="소실 공연 장면" loading="lazy" decoding="async"><figcaption>slowcore / alternative folk musician<br>based in seoul, south korea</figcaption></figure><div class="info-lower"><div class="info-english">${esc(infoEn)}</div><nav aria-label="소실 외부 링크">${infoLinks}</nav></div></aside>`, "info-split");
publish("/info", page("info", info.description, "/info", "info", infoMain, INFO_IMAGE));

const contact = site("contact");
const instagram = contact.links[0] || { label: "@headlesssosil", url: "https://www.instagram.com/headlesssosil/" };
const contactMain = `<article class="contact-page"><h1>contact</h1><p>for booking, collaboration, video work, or other inquiries.</p><dl><dt>email</dt><dd><a href="mailto:${esc(contact.meta)}">${esc(contact.meta)}</a></dd><dt>instagram</dt><dd><a href="${esc(instagram.url)}" target="_blank" rel="noreferrer">${esc(instagram.label)}</a></dd></dl></article>`;
publish("/contact", page("contact", contact.description, "/contact", "contact", contactMain));

const home = site("home");
const featured = discography.find((item) => firstImage(item)) || discography[0];
const latestNews = news[0];
const mailingUrl = linkUrl(home, "newsletter").split("?")[0];
const homeNews = latestNews ? `<p>${esc(displayDate(latestNews.date))}</p><a href="/news/${esc(latestNews.slug)}">${esc(latestNews.title)}</a><a class="small-link" href="/news">more</a>` : '<p>no news yet.</p>';
const homeMain = `<div class="home-canvas"><section class="home-intro"><p>slowcore / alternative folk musician<br>based in seoul, south korea</p><p>i make music,<br>and moving images.</p></section><div class="home-motion-field" data-home-motion><a class="moving-cover" href="${ALBUM_YOUTUBE}" target="_blank" rel="noreferrer" aria-label="${esc(featured?.title || "몽상은나의조랑말")} YouTube에서 듣기">${featured ? `<img src="${esc(firstImage(featured))}" alt="${esc(featured.title)} 앨범 커버" decoding="async">` : ""}</a></div><section class="home-news"><h2>news</h2>${homeNews}</section><section class="home-mailing"><h2>mailing list</h2><p class="mailing-copy">소실의 소식을 보내드립니다.<br>sending news of sosil</p><form action="${esc(mailingUrl)}" method="get" target="_blank"><label for="mailing-email">your email</label><input id="mailing-email" name="emailAddress" type="email" autocomplete="email" placeholder="your email" required><button type="submit">join</button></form></section></div>`;
publish("/", page("소실 SOSIL", home.description, "/", "", homeMain, firstImage(featured), false, "home-body"));

routes.sort((a, b) => a.localeCompare(b));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniq(routes).map((route) => `  <url><loc>${ORIGIN}${route === "/" ? "/" : `${route}/`}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);
console.log(`Built ${uniq(routes).length} routes from ${all.length} content files.`);
