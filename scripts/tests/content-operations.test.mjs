import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../../", import.meta.url));
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sosil-content-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(root, dir, { recursive: true, filter: (file) => ![".git", "node_modules"].includes(path.basename(file)) });
  return dir;
}
function run(dir, script, args = [], env = {}) {
  return spawnSync(process.execPath, [path.join(dir, "scripts", script), ...args], {
    cwd: dir, encoding: "utf8", env: { ...process.env, ...env },
  });
}
function issue(dir, edit, fields, number = 99999) {
  const event = path.join(dir, "event.json");
  fs.writeFileSync(event, JSON.stringify({ issue: {
    title: edit ? "[Edit] fixture" : "[Content] fixture", number,
    body: Object.entries(fields).map(([label, value]) => `### ${label}\n\n${value}`).join("\n\n"),
  } }));
  return run(dir, edit ? "edit-content.mjs" : "publish-issue.mjs", [], { GITHUB_EVENT_PATH: event });
}
function ok(result) { assert.equal(result.status, 0, result.stdout + result.stderr); }
function read(dir, folder, slug = "2026-09-21-99999") {
  const raw = fs.readFileSync(path.join(dir, "content", folder, `${slug}.md`), "utf8");
  const [, front, body] = raw.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
  return { data: Object.fromEntries(front.split("\n").map((line) => {
    const i = line.indexOf(":"); return [line.slice(0, i), JSON.parse(line.slice(i + 1))];
  })), body: body.replace(/\n$/, "") };
}
const categories = {
  News: "news", Notes: "notes", "Archive Photo": "archive/photo", "Archive Video": "archive/video",
  "Archive Links": "archive/links", "Works Discography": "works/discography", "Works Video": "works/video",
  "Works Live": "works/live", "Works Others": "works/others", Merch: "merch",
};
const base = { "제목": "운영 테스트", "날짜": "2026-09-21", "본문": "원래 본문", "설명": "설명", "썸네일 이미지": "/media/catalog/da-jinaseo.jpg", "본문 이미지": "/media/catalog/da-jinaseo.jpg\nhttps://example.com/photo.png", "외부 링크": "listen | https://example.com", "영상 링크": "https://youtu.be/abcdefghijk", "가격(KRW)": "12345", "판매 상태": "available" };

test("all ten Issue categories publish with auto slugs, multiple images, price and complete build", (t) => {
  const dir = fixture(t);
  let number = 90000;
  for (const [category, folder] of Object.entries(categories)) {
    number++;
    ok(issue(dir, false, { "카테고리": category, ...base }, number));
    const { data } = read(dir, folder, `2026-09-21-${number}`);
    assert.equal(data.slug, `2026-09-21-${number}`);
    assert.equal(data.price_krw, 12345);
    assert.equal(data.images.length, 2);
    assert.equal(data.links[0].label, "listen");
  }
  ok(run(dir, "build-site.mjs", ["--skip-browser-qa"]));
  assert.equal(fs.existsSync(path.join(dir, "gibberish")), false);
  const sitemap = fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8");
  assert(sitemap.includes("/notes/2026-09-21-90002/"));
  assert(!sitemap.includes("/gibberish"));
  assert(fs.readFileSync(path.join(dir, "robots.txt"), "utf8").includes("sitemap.xml"));
  assert(fs.existsSync(path.join(dir, ".nojekyll")));
});

test("Edit keeps blanks, updates price/body, removes every optional field without changing slug", (t) => {
  const dir = fixture(t);
  ok(issue(dir, false, { "카테고리": "Notes", ...base }));
  const target = { "카테고리": "Notes", "기존 콘텐츠 slug 또는 현재 URL": "https://sosilofficial.github.io/notes/2026-09-21-99999/" };
  const original = read(dir, "notes");
  ok(issue(dir, true, { ...target, "새 본문": "_No response_", "새 설명": "", "새 가격(KRW)": "" }));
  assert.deepEqual(read(dir, "notes"), original);
  ok(issue(dir, true, { ...target, "새 제목": "수정 제목", "새 본문": "수정 본문", "새 가격(KRW)": "0" }));
  assert.equal(read(dir, "notes").data.price_krw, 0);
  assert.equal(read(dir, "notes").body, "수정 본문");
  const labels = ["새 본문", "새 설명", "새 썸네일 이미지", "새 본문 이미지", "새 외부 링크", "새 영상 링크", "새 재생 시간", "새 종류", "새 크레딧", "새 노트", "새 가격(KRW)", "새 판매 상태", "추가 설명"];
  ok(issue(dir, true, { ...target, ...Object.fromEntries(labels.map((label) => [label, "__REMOVE__"])) }));
  const removed = read(dir, "notes");
  for (const key of ["description", "seo_description", "thumbnail", "video", "runtime", "media_type", "credit", "note", "price_krw", "status", "meta"]) assert.equal(removed.data[key], "", key);
  assert.deepEqual(removed.data.images, []);
  assert.deepEqual(removed.data.links, []);
  assert.equal(removed.body, "");
  assert.equal(removed.data.slug, original.data.slug);
  ok(run(dir, "build-site.mjs", ["--skip-browser-qa"]));
});

test("video and external-link deletion also clears derived URL and automatic thumbnail", (t) => {
  const dir = fixture(t);
  for (const category of ["Works Video", "Archive Links"]) {
    ok(issue(dir, false, { "카테고리": category, ...base, "썸네일 이미지": "" }));
    if (category === "Works Video") assert.equal(read(dir, categories[category]).data.thumbnail, "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg");
    ok(issue(dir, true, { "카테고리": category, "기존 콘텐츠 slug 또는 현재 URL": "2026-09-21-99999", "새 영상 링크": "__REMOVE__", "새 외부 링크": "__REMOVE__" }));
    const { data } = read(dir, categories[category]);
    assert.equal(data.url, "");
    assert.equal(data.thumbnail, "");
  }
  ok(run(dir, "build-site.mjs", ["--skip-browser-qa"]));
});

test("explicit thumbnail removal wins over new video, custom thumbnails survive video deletion", (t) => {
  const dir = fixture(t);
  ok(issue(dir, false, { "카테고리": "Notes", ...base }));
  const target = { "카테고리": "Notes", "기존 콘텐츠 slug 또는 현재 URL": "2026-09-21-99999" };
  ok(issue(dir, true, { ...target, "새 영상 링크": "__REMOVE__" }));
  assert.equal(read(dir, "notes").data.thumbnail, base["썸네일 이미지"]);
  ok(issue(dir, true, { ...target, "새 영상 링크": "https://youtu.be/other123456", "새 썸네일 이미지": "__REMOVE__" }));
  assert.equal(read(dir, "notes").data.thumbnail, "");
});

test("invalid input fails before writing; duplicate and cross-archive slugs remain rejected", (t) => {
  const dir = fixture(t);
  for (const invalid of [{ "날짜": "bad" }, { "slug": "../escape" }, { "가격(KRW)": "invalid" }, { "판매 상태": "bad" }]) {
    assert.notEqual(issue(dir, false, { "카테고리": "Notes", ...base, ...invalid }).status, 0);
  }
  ok(issue(dir, false, { "카테고리": "Notes", ...base }));
  const before = read(dir, "notes");
  for (const invalid of [{ "새 가격(KRW)": "bad" }, { "새 날짜": "bad" }, { "새 제목": "__REMOVE__" }, { "새 외부 링크": "javascript:bad" }]) {
    assert.notEqual(issue(dir, true, { "카테고리": "Notes", "기존 콘텐츠 slug 또는 현재 URL": "2026-09-21-99999", ...invalid }).status, 0);
    assert.deepEqual(read(dir, "notes"), before);
  }
  assert.notEqual(issue(dir, false, { "카테고리": "Notes", ...base }).status, 0);
  ok(issue(dir, false, { "카테고리": "Archive Photo", ...base }));
  assert.notEqual(issue(dir, false, { "카테고리": "Archive Video", ...base }).status, 0);
});

test("complete build is byte-stable for every existing public page, assets and SEO output", (t) => {
  const dir = fixture(t);
  const files = fs.readdirSync(dir, { recursive: true }).filter((file) => /\.(html|css|js)$/.test(file) || ["robots.txt", "sitemap.xml"].includes(file));
  const before = new Map(files.map((file) => [file, fs.readFileSync(path.join(dir, file))]));
  ok(run(dir, "build-site.mjs", ["--skip-browser-qa"]));
  for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(dir, file)), bytes, file);
  for (const workflow of ["content-from-issue", "rebuild-from-content"]) {
    const source = fs.readFileSync(path.join(dir, `.github/workflows/${workflow}.yml`), "utf8");
    assert(source.includes("run: npm run build:site"));
    assert(!/run: node scripts\/(build-content|apply-)/.test(source));
  }
});
