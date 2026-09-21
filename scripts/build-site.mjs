import { spawnSync } from "node:child_process";

// Preserve the established rebuild order, including both style consolidation passes.
const steps = [
  ["scripts/consolidate-layout-styles.mjs"],
  ["scripts/build-content.mjs"],
  ["scripts/apply-video-layout.mjs"],
  ["scripts/apply-discography-layout.mjs"],
  ["scripts/apply-live-layout.mjs"],
  ["scripts/apply-merch-layout.mjs"],
  ["scripts/apply-archive-photo-layout.mjs"],
  ["scripts/apply-archive-text-layout.mjs"],
  ["scripts/apply-notes-layout.mjs"],
  ["scripts/apply-home-layout.mjs"],
  ["scripts/apply-shared-ui.mjs"],
  ["scripts/apply-mobile-detail-pages.mjs"],
  ["scripts/consolidate-layout-styles.mjs", "--strip-html"],
  ["scripts/fix-archive-video-legacy.mjs"],
  ["scripts/validate-site.mjs"],
  ["scripts/browser-qa.mjs"]
];
for (const [script, ...args] of steps) {
  if (script.endsWith("browser-qa.mjs") && process.argv.includes("--skip-browser-qa")) continue;
  const result = spawnSync(process.execPath, [script, ...args], { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
