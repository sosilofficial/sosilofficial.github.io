import { execFileSync } from "node:child_process";

// Keep local builds and both publishing workflows on the same ordered pipeline.
const steps = [
  "consolidate-layout-styles.mjs",
  "build-content.mjs",
  "apply-video-layout.mjs",
  "apply-discography-layout.mjs",
  "apply-live-layout.mjs",
  "apply-merch-layout.mjs",
  "apply-archive-photo-layout.mjs",
  "apply-archive-text-layout.mjs",
  "apply-notes-layout.mjs",
  "apply-home-layout.mjs",
  "apply-shared-ui.mjs",
  "apply-mobile-detail-pages.mjs",
  "consolidate-layout-styles.mjs --strip-html",
  "fix-archive-video-legacy.mjs",
  "validate-site.mjs"
];

for (const step of steps) {
  execFileSync(process.execPath, [`scripts/${step.split(" ")[0]}`, ...step.split(" ").slice(1)], { stdio: "inherit" });
}
