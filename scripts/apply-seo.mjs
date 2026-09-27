import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ORIGIN = "https://sosilofficial.github.io";
const HOME = path.join(ROOT, "index.html");

const SAME_AS = [
  "https://music.bugs.co.kr/artist/20148017",
  "https://sosil.bandcamp.com/",
  "https://open.spotify.com/artist/4BazSsfQh7YXzpEeiYhFUq",
  "https://music.apple.com/us/artist/sosil/1590350372",
  "https://soundcloud.com/sosil-headless",
  "https://www.youtube.com/channel/UC0XEauOekig2JVFOf_AEeRQ",
  "https://www.instagram.com/headlesssosil/"
];

const HOME_TITLE = "소실 (Sosil) — 공식 홈페이지 | Slowcore / Folk";
const HOME_DESCRIPTION = "소실(Sosil) 공식 홈페이지. 서울을 기반으로 활동하는 김성빈의 slowcore / alternative folk 음악 프로젝트입니다. 음악, 영상, 공연, 아카이브와 소식을 확인하세요.";

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${ORIGIN}/#website`,
      url: `${ORIGIN}/`,
      name: "소실 (Sosil)",
      alternateName: ["Sosil", "소실 SOSIL"],
      inLanguage: ["ko", "en"],
      about: { "@id": `${ORIGIN}/#artist` }
    },
    {
      "@type": "MusicGroup",
      "@id": `${ORIGIN}/#artist`,
      name: "소실",
      alternateName: "Sosil",
      url: `${ORIGIN}/`,
      description: "소실(Sosil)은 서울을 기반으로 활동하는 김성빈의 slowcore / alternative folk 음악 프로젝트입니다.",
      genre: ["Slowcore", "Alternative Folk", "Folk"],
      location: { "@type": "Place", name: "Seoul, South Korea" },
      member: { "@id": `${ORIGIN}/#kim-sungbin` },
      sameAs: SAME_AS
    },
    {
      "@type": "Person",
      "@id": `${ORIGIN}/#kim-sungbin`,
      name: "김성빈",
      alternateName: "Kim Sungbin",
      url: `${ORIGIN}/info/`
    }
  ]
};

function replaceMeta(html, attr, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta ${attr}="${escapedKey}" content="[^"]*">`);
  const tag = `<meta ${attr}="${key}" content="${value}">`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `${tag}</head>`);
}

function addAuthorMeta(html) {
  if (html.includes('<meta name="author"')) return html;
  return html.replace("</head>", '<meta name="author" content="소실 (Sosil) / 김성빈 (Kim Sungbin)"></head>');
}

function walkHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules"].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkHtml(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

for (const file of walkHtml(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  html = addAuthorMeta(html);

  if (file === HOME) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${HOME_TITLE}</title>`);
    html = replaceMeta(html, "name", "description", HOME_DESCRIPTION);
    html = replaceMeta(html, "property", "og:title", HOME_TITLE);
    html = replaceMeta(html, "property", "og:description", HOME_DESCRIPTION);

    const jsonLd = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(html)) {
      html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLd);
    } else {
      html = html.replace("</head>", `${jsonLd}</head>`);
    }
  }

  fs.writeFileSync(file, html);
}

console.log("Applied persistent SEO metadata and identity structured data.");
