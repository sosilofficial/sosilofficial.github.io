import { execFileSync } from "node:child_process";

// Reproduce the pipeline that generated 97fcbdf (2026-09-27), retaining News posters.
// Both issue publishing and rebuilds must use this same ordered pipeline.
const steps = [
  ["consolidate-layout-styles.mjs"],
  ["build-content.mjs"],
  ["apply-video-layout.mjs"],
  ["apply-discography-layout.mjs"],
  ["apply-live-layout.mjs"],
  ["apply-merch-layout.mjs"],
  ["apply-archive-photo-layout.mjs"],
  ["apply-archive-text-layout.mjs"],
  ["apply-notes-layout.mjs"],
  ["apply-home-layout.mjs"],
  ["apply-shared-ui.mjs"],
  ["apply-mobile-detail-pages.mjs"],
  ["apply-unified-desktop-grid.mjs"],
  ["consolidate-layout-styles.mjs", "--strip-html"],
  ["fix-archive-video-legacy.mjs"],
  ["apply-news-layout.mjs"],
  ["apply-seo.mjs"],
  ["validate-site.mjs"],
];
for (const [script, ...args] of steps) {
  execFileSync(process.execPath, [`scripts/${script}`, ...args], { stdio: "inherit" });
}
