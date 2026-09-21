import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const LIMIT = 20 * 1024 * 1024;
export function isIssueAttachment(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && (
      (url.hostname === "github.com" && /^\/user-attachments\/assets\/[a-f0-9-]+$/i.test(url.pathname)) ||
      (url.hostname === "user-images.githubusercontent.com" && /^\/\d+\//.test(url.pathname))
    );
  } catch { return false; }
}
function allowedDownload(url) {
  return isIssueAttachment(url.href) || (url.protocol === "https:" && !url.username && !url.password && !url.port &&
    /^github-production-user-asset-[\w-]+\.s3(?:\.[\w-]+)?\.amazonaws\.com$/.test(url.hostname));
}
function imageExtension(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg";
  if (/^GIF8[79]a/.test(bytes.toString("ascii", 0, 6))) return "gif";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (bytes.toString("ascii", 4, 8) === "ftyp" && /avif|avis/.test(bytes.toString("ascii", 8, 32))) return "avif";
  throw new Error("unsupported image format (original URL retained)");
}

// No credentials are sent, including on redirects. Private/inaccessible attachments retain their URL.
export async function localizeIssueImages(data, body = "", {
  root = process.cwd(), fetchImpl = fetch, warn = console.warn,
  date = new Date().toISOString().slice(0, 10),
} = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid image storage date");
  const cache = new Map();
  async function localize(original) {
    if (!isIssueAttachment(original)) return original;
    if (cache.has(original)) return cache.get(original);
    const task = (async () => {
      try {
        let url = new URL(original);
        const signal = AbortSignal.timeout(30_000);
        let response;
        for (let redirects = 0; redirects <= 5; redirects++) {
          if (!allowedDownload(url)) throw new Error("unsupported attachment redirect");
          response = await fetchImpl(url.href, { redirect: "manual", signal });
          if (![301,302,303,307,308].includes(response.status)) break;
          await response.body?.cancel();
          const location = response.headers.get("location");
          if (!location || redirects === 5) throw new Error("invalid attachment redirect");
          url = new URL(location, url);
        }
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        if (Number(response.headers.get("content-length")) > LIMIT) {
          await response.body.cancel();
          throw new Error("image exceeds 20 MiB");
        }
        const chunks = [];
        let size = 0;
        for await (const chunk of response.body) {
          size += chunk.length;
          if (size > LIMIT) throw new Error("image exceeds 20 MiB");
          chunks.push(chunk);
        }
        const bytes = Buffer.concat(chunks);
        const extension = imageExtension(bytes);
        const name = createHash("sha256").update(bytes).digest("hex");
        const relative = `media/catalog/${date}/${name}.${extension}`;
        await fs.mkdir(path.join(root, "media/catalog", date), { recursive: true });
        await fs.writeFile(path.join(root, relative), bytes);
        return `/${relative}`;
      } catch (error) {
        // Exclude URLs/signatures and response bodies from workflow logs.
        warn(`::warning::Issue image could not be saved locally; keeping original URL. ${String(error.message).replace(/[\r\n]/g, " ")}`);
        return original;
      }
    })();
    cache.set(original, task);
    return task;
  }
  data.thumbnail = await localize(data.thumbnail || "");
  data.images = await Promise.all((data.images || []).map(localize));
  // Only Markdown images are copied; ordinary links and existing content are untouched.
  const matches = [...body.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g)];
  for (const match of matches.reverse()) {
    const local = await localize(match[1]);
    body = body.slice(0, match.index) + match[0].replace(match[1], local) + body.slice(match.index + match[0].length);
  }
  return body;
}
