import fs from "node:fs";

const file = new URL("../index.html", import.meta.url);
if (!fs.existsSync(file)) throw new Error("Homepage must be generated before layout validation.");

const STYLE = `<style id="home-mailing-join-style">
@media (min-width: 821px) {
  .home-canvas {
    --home-copy-width: min(29vw, 443px);
  }
  .home-intro,
  .home-news,
  .home-mailing {
    width: var(--home-copy-width) !important;
  }
  .home-grid-anchor {
    display: inline-block;
    width: max-content;
    max-width: none;
    white-space: nowrap;
  }
}

/*
 * On mobile, keep the whole first-page rhythm inside the initial viewport as
 * often as possible. The cover remains present, but it no longer consumes
 * almost half the screen before News and Mailing List appear.
 */
@media (max-width: 820px) {
  .home-canvas {
    min-height: auto !important;
    padding: 18px 18px 32px !important;
  }
  .home-intro {
    gap: 14px !important;
  }
  .home-motion-field {
    height: clamp(150px, 26dvh, 220px) !important;
    margin: 18px 0 20px !important;
  }
  .moving-cover {
    width: min(36vw, 160px) !important;
  }
  .home-news {
    margin: 0 0 32px !important;
  }
  .home-mailing {
    margin-top: 0 !important;
  }
  .home-news h2 {
    margin-bottom: 10px !important;
  }
  .home-mailing h2 {
    margin-bottom: 16px !important;
  }
}

@media (max-width: 520px) {
  .home-intro {
    gap: 12px !important;
  }
  .home-motion-field {
    height: clamp(140px, 23dvh, 190px) !important;
    margin: 16px 0 18px !important;
  }
  .moving-cover {
    width: min(38vw, 150px) !important;
  }
  .home-news {
    margin-bottom: 32px !important;
  }
}

.home-mailing h2 {
  margin-bottom: 18px;
}
.home-mailing form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  border-bottom: 1px solid var(--ink);
}
.home-mailing input {
  min-width: 0;
  width: 100%;
  padding: 6px 0;
  border: 0;
  outline: 0;
  background: transparent;
}
.home-mailing button {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  padding: 6px 0;
  border: 0;
  background: transparent;
  clip-path: none;
  cursor: pointer;
  text-transform: lowercase;
}
.home-mailing button:hover { opacity: .56; }
</style>`;

const MOBILE_MOTION = `<script id="home-mobile-motion-script">
(() => {
  const mobileQuery = window.matchMedia("(max-width: 820px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!mobileQuery.matches || reducedMotionQuery.matches) return;

  const field = document.querySelector("[data-home-motion]");
  const cover = field?.querySelector(".moving-cover");
  const artwork = cover?.querySelector("img");
  if (!field || !cover || !artwork) return;

  /* Mobile keeps the same long-exposure idea, but draws fewer, lighter trails. */
  const config = {
    speedSeconds: 72,
    trailOpacity: 0.028,
    trailBlur: 0.8,
    trailIntervalMinMs: 440,
    trailIntervalMaxMs: 620,
    trailScaleVariance: 0.002,
    jitterPx: 0.22,
    brightnessVariation: 0.012,
    colorDriftAmount: 0.008,
    exposurePeriodMs: 5200
  };

  cover.style.setProperty("top", "0", "important");
  cover.style.setProperty("left", "0", "important");

  const tau = Math.PI * 2;
  const phaseX = Math.random() * tau;
  const phaseY = Math.random() * tau;
  const bendX = Math.random() * tau;
  const bendY = Math.random() * tau;
  const rateX = 0.82 + Math.random() * 0.22;
  const rateY = 0.88 + Math.random() * 0.22;
  const motionPath = (time) => ({
    x: 0.5 + 0.32 * Math.sin(time * rateX + phaseX) + 0.08 * Math.sin(time * 0.51 + bendX),
    y: 0.5 + 0.28 * Math.sin(time * rateY + phaseY) + 0.07 * Math.sin(time * 0.63 + bendY)
  });

  const history = document.createElement("canvas");
  history.className = "motion-history mobile-motion-history";
  history.setAttribute("aria-hidden", "true");
  history.style.display = "block";
  history.style.position = "absolute";
  history.style.inset = "0";
  history.style.width = "100%";
  history.style.height = "100%";
  history.style.zIndex = "1";
  history.style.pointerEvents = "none";

  const context = history.getContext("2d", { alpha: true });
  const stamp = document.createElement("canvas");
  stamp.width = stamp.height = 192;
  const stampContext = stamp.getContext("2d", { alpha: true });
  if (!context || !stampContext) return;

  field.insertBefore(history, cover);

  let stampReady = false;
  let historyScale = 1;
  let motionTime = 0;
  let x = 0;
  let y = 0;
  let lastTime = performance.now();
  let trailClock = 0;
  let lastTrail = 0;
  let nextTrailDelay = config.trailIntervalMinMs;
  let frameId = 0;

  function prepareStamp() {
    if (!artwork.naturalWidth) return;
    stampContext.clearRect(0, 0, stamp.width, stamp.height);
    stampContext.globalCompositeOperation = "source-over";
    stampContext.drawImage(artwork, 0, 0, stamp.width, stamp.height);
    stampContext.globalCompositeOperation = "destination-in";

    const horizontal = stampContext.createLinearGradient(0, 0, stamp.width, 0);
    horizontal.addColorStop(0, "transparent");
    horizontal.addColorStop(0.08, "#000");
    horizontal.addColorStop(0.92, "#000");
    horizontal.addColorStop(1, "transparent");
    stampContext.fillStyle = horizontal;
    stampContext.fillRect(0, 0, stamp.width, stamp.height);

    const vertical = stampContext.createLinearGradient(0, 0, 0, stamp.height);
    vertical.addColorStop(0, "transparent");
    vertical.addColorStop(0.08, "#000");
    vertical.addColorStop(0.92, "#000");
    vertical.addColorStop(1, "transparent");
    stampContext.fillStyle = vertical;
    stampContext.fillRect(0, 0, stamp.width, stamp.height);
    stampReady = true;
  }

  function resizeHistory() {
    if (!field.clientWidth || !field.clientHeight) return;
    const scale = Math.min(window.devicePixelRatio || 1, 1.05, 900 / field.clientWidth, 900 / field.clientHeight);
    const width = Math.max(1, Math.round(field.clientWidth * scale));
    const height = Math.max(1, Math.round(field.clientHeight * scale));
    if (history.width === width && history.height === height) return;
    history.width = width;
    history.height = height;
    historyScale = scale;
  }

  function syncPosition() {
    const point = motionPath(motionTime);
    x = point.x * Math.max(0, field.clientWidth - cover.offsetWidth);
    y = point.y * Math.max(0, field.clientHeight - cover.offsetHeight);
  }

  function makeTrail(now) {
    if (stampReady) {
      const scale = 1 + (Math.random() - 0.5) * config.trailScaleVariance * 2;
      const width = cover.offsetWidth * scale;
      const height = cover.offsetHeight * scale;
      const left = x + (cover.offsetWidth - width) / 2;
      const top = y + (cover.offsetHeight - height) / 2;

      context.save();
      context.setTransform(historyScale, 0, 0, historyScale, 0, 0);
      context.filter = "blur(" + config.trailBlur + "px) saturate(.72)";
      context.globalAlpha = config.trailOpacity * (0.9 + Math.random() * 0.2);
      context.drawImage(stamp, left, top, width, height);
      context.restore();
    }
    lastTrail = now;
    nextTrailDelay = config.trailIntervalMinMs + Math.random() * (config.trailIntervalMaxMs - config.trailIntervalMinMs);
  }

  function animate(now) {
    frameId = 0;
    if (document.hidden) return;

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    motionTime += dt * 2.0 / config.speedSeconds;
    trailClock += dt * 1000;
    syncPosition();

    const jitterX = (Math.random() - 0.5) * config.jitterPx;
    const jitterY = (Math.random() - 0.5) * config.jitterPx;
    const exposure = 0.985 + Math.sin(now / config.exposurePeriodMs) * config.brightnessVariation;
    const saturation = 0.82 + Math.sin(now / (config.exposurePeriodMs * 1.37)) * config.colorDriftAmount;

    cover.style.setProperty("transform", "translate(" + (x + jitterX) + "px," + (y + jitterY) + "px)", "important");
    cover.style.filter = "saturate(" + saturation + ") contrast(.94) brightness(" + exposure + ")";

    if (trailClock - lastTrail > nextTrailDelay) makeTrail(trailClock);
    frameId = requestAnimationFrame(animate);
  }

  resizeHistory();
  syncPosition();
  if (artwork.complete) prepareStamp();
  artwork.addEventListener("load", prepareStamp, { once: true });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      resizeHistory();
      syncPosition();
    }).observe(field);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !frameId) {
      lastTime = performance.now();
      frameId = requestAnimationFrame(animate);
    }
  });

  frameId = requestAnimationFrame(animate);
})();
</script>`;

let html = fs.readFileSync(file, "utf8");

if (html.includes('id="home-mailing-join-style"')) {
  html = html.replace(/<style id="home-mailing-join-style">[\s\S]*?<\/style>/, STYLE);
} else {
  html = html.replace("</head>", `${STYLE}</head>`);
}

html = html.replace(
  "<p>slowcore / alternative folk musician<br>based in seoul, south korea</p>",
  '<p><span class="home-grid-anchor">slowcore / alternative folk musician</span><br>based in seoul, south korea</p>'
);

/* Keep the signup intentionally bare: heading, email line, join. */
html = html.replace(/<p class="mailing-copy">[\s\S]*?<\/p>/, "");

/*
 * Keep Google Forms as the final confirmation step. The email field is sent
 * with the viewform GET request so Google opens with the address prefilled;
 * the visitor only needs to press Google's submit button.
 */
html = html.replace(
  /<form action="(https:\/\/docs\.google\.com\/forms\/d\/e\/[^\"]+)\/formResponse" method="post" data-mailing-form(?: data-fallback-url="[^"]+")?>/,
  (_match, base) => `<form action="${base}/viewform" method="get" target="_blank"><input type="hidden" name="usp" value="pp_url">`
);
html = html.replace(/<p class="mailing-status"[\s\S]*?<\/p>/, "");

if (html.includes('id="home-mobile-motion-script"')) {
  html = html.replace(/<script id="home-mobile-motion-script">[\s\S]*?<\/script>/, MOBILE_MOTION);
} else {
  html = html.replace("</body>", `${MOBILE_MOTION}</body>`);
}

fs.writeFileSync(file, html);
console.log("Kept the Google Forms handoff and added a lighter long-exposure home cover motion for mobile.");
