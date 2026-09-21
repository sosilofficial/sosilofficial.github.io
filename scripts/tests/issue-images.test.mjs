import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { localizeIssueImages, isIssueAttachment } from "../localize-issue-images.mjs";
const url = "https://github.com/user-attachments/assets/12345678-abcd-abcd-abcd-123456789012";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=", "base64");
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sosil-image-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
test("attachment copied once, exact original bytes, shared by thumbnail/gallery/Markdown body", async (t) => {
  const root = await fixture(t);
  let calls = 0;
  const data = { thumbnail: url, images: [url, "https://example.com/image.png"] };
  const body = await localizeIssueImages(data, `![image](${url})\n[external](${url})`, { root, date: "2026-09-21", fetchImpl: async (_, options) => {
    calls++; assert.equal(options.redirect, "manual"); assert.equal(options.headers, undefined); return new Response(png);
  } });
  assert.equal(calls, 1);
  assert.match(data.thumbnail, /^\/media\/catalog\/2026-09-21\/[a-f0-9]{64}\.png$/);
  assert.equal(data.images[0], data.thumbnail);
  assert.equal(data.images[1], "https://example.com/image.png");
  assert(body.includes(`![image](${data.thumbnail})`));
  assert(body.includes(`[external](${url})`));
  assert.deepEqual(await fs.readFile(path.join(root, data.thumbnail)), png);
});
test("external and spoofed hosts are never downloaded", async (t) => {
  const root = await fixture(t);
  for (const value of ["https://example.com/a.jpg", "https://github.com.evil.test/user-attachments/assets/123", "http://github.com/user-attachments/assets/123", "/media/image.jpg"]) {
    assert.equal(isIssueAttachment(value), false);
    const data = { thumbnail: value };
    await localizeIssueImages(data, "", { root, fetchImpl: () => assert.fail("unexpected fetch") });
    assert.equal(data.thumbnail, value);
  }
});
test("network, HTTP, non-image and oversized failures warn and retain usable original URL", async (t) => {
  const root = await fixture(t);
  for (const fetchImpl of [async () => { throw new Error("network unavailable"); }, async () => new Response("private", { status: 403 }), async () => new Response("<html>login</html>"), async () => new Response(png, { headers: { "content-length": String(21*1024*1024) } }), async () => new Response(new Uint8Array(21*1024*1024))]) {
    const warnings = [];
    const data = { thumbnail: url, images: [url] };
    await localizeIssueImages(data, "", { root, fetchImpl, warn: (s) => warnings.push(s) });
    assert.equal(data.thumbnail, url);
    assert.deepEqual(data.images, [url]);
    assert.equal(warnings.length, 1);
    assert(warnings[0].includes("keeping original URL"));
  }
});
test("allowlisted S3 redirect works; redirect to a local address is blocked", async (t) => {
  const root = await fixture(t);
  for (const allowed of [true, false]) {
    let calls = 0;
    const data = { thumbnail: url };
    await localizeIssueImages(data, "", { root, warn: () => {}, fetchImpl: async () => {
      calls++;
      return calls === 1 ? new Response(null, { status: 302, headers: { location: allowed ? "https://github-production-user-asset-6210df.s3.amazonaws.com/image.png" : "http://127.0.0.1/private" } }) : new Response(png);
    } });
    assert.equal(calls, allowed ? 2 : 1);
    assert.equal(data.thumbnail === url, !allowed);
  }
});
