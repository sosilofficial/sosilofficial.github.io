const HOME_MOTION_CONFIG = Object.freeze({
  desktop: Object.freeze({
    speedSeconds: 58,
    trailOpacity: 0.045,
    trailBlur: 1.2,
    trailIntervalMinMs: 280,
    trailIntervalMaxMs: 380,
    trailScaleVariance: 0.003,
    jitterPx: 0.45,
    brightnessVariation: 0.025,
    colorDriftAmount: 0.018,
    exposurePeriodMs: 4100,
    motionFactor: 2.2,
    stampSize: 256,
    maxHistoryScale: 1.5,
    maxHistoryPixels: 1600,
    pathX: 0.34,
    pathXBend: 0.1,
    pathY: 0.34,
    pathYBend: 0.1,
    rateXMin: 0.85,
    rateXRange: 0.3,
    rateYMin: 0.9,
    rateYRange: 0.35,
    bendRateX: 0.53,
    bendRateY: 0.67
  }),
  mobile: Object.freeze({
    speedSeconds: 72,
    trailOpacity: 0.028,
    trailBlur: 0.8,
    trailIntervalMinMs: 440,
    trailIntervalMaxMs: 620,
    trailScaleVariance: 0.002,
    jitterPx: 0.22,
    brightnessVariation: 0.012,
    colorDriftAmount: 0.008,
    exposurePeriodMs: 5200,
    motionFactor: 2.0,
    stampSize: 192,
    maxHistoryScale: 1.05,
    maxHistoryPixels: 900,
    pathX: 0.32,
    pathXBend: 0.08,
    pathY: 0.28,
    pathYBend: 0.07,
    rateXMin: 0.82,
    rateXRange: 0.22,
    rateYMin: 0.88,
    rateYRange: 0.22,
    bendRateX: 0.51,
    bendRateY: 0.63
  })
});

function setupPanels() {
  const triggers = [...document.querySelectorAll("[data-panel-target]")];
  if (!triggers.length) return;
  const panels = [...document.querySelectorAll("[data-panel]")];
  const show = (id, updateHash = true) => {
    triggers.forEach((trigger) => trigger.classList.toggle("is-selected", trigger.dataset.panelTarget === id));
    panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== id; });
    if (updateHash) history.replaceState(null, "", `#${id}`);
  };
  triggers.forEach((trigger) => trigger.addEventListener("click", (event) => {
    event.preventDefault();
    show(trigger.dataset.panelTarget);
  }));
  const initial = location.hash.slice(1);
  if (panels.some((panel) => panel.dataset.panel === initial)) show(initial, false);
}

function setupDetailClose() {
  const closeButtons = [...document.querySelectorAll("[data-close-url]")];
  if (!closeButtons.length) return;
  const close = () => { window.location.href = closeButtons[0].dataset.closeUrl; };
  closeButtons.forEach((button) => button.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function setupNoteNavigation() {
  const links = [...document.querySelectorAll(".note-index a[href]")];
  if (!links.length) return;

  links.forEach((link) => link.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const target = new URL(link.href, window.location.href);
    const currentPath = window.location.pathname.replace(/\/+$/, "");
    const targetPath = target.pathname.replace(/\/+$/, "");
    if (targetPath === currentPath) return;

    event.preventDefault();
    window.location.assign(target.href);
  }));
}

function setupHomeGrid() {
  const canvas = document.querySelector(".home-canvas");
  const anchor = document.querySelector(".home-grid-anchor");
  if (!canvas || !anchor || matchMedia("(max-width: 820px)").matches) return;

  const sync = () => {
    const width = Math.ceil(anchor.getBoundingClientRect().width);
    if (width > 0) canvas.style.setProperty("--home-copy-width", `${width}px`);
  };

  sync();
  if (document.fonts?.ready) document.fonts.ready.then(sync);
  if ("ResizeObserver" in window) new ResizeObserver(sync).observe(anchor);
  window.addEventListener("resize", sync, { passive: true });
}

// Randomize once per page load; blended waves keep every turn continuous.
function createHomeMotionPath(config) {
  const tau = Math.PI * 2;
  const phaseX = Math.random() * tau;
  const phaseY = Math.random() * tau;
  const bendX = Math.random() * tau;
  const bendY = Math.random() * tau;
  const rateX = config.rateXMin + Math.random() * config.rateXRange;
  const rateY = config.rateYMin + Math.random() * config.rateYRange;
  return (time) => ({
    x: 0.5 + config.pathX * Math.sin(time * rateX + phaseX) + config.pathXBend * Math.sin(time * config.bendRateX + bendX),
    y: 0.5 + config.pathY * Math.sin(time * rateY + phaseY) + config.pathYBend * Math.sin(time * config.bendRateY + bendY)
  });
}

function setupHomeMotion() {
  const field = document.querySelector("[data-home-motion]");
  const cover = field?.querySelector(".moving-cover");
  const artwork = cover?.querySelector("img");
  if (!field || !cover || !artwork) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const isMobile = matchMedia("(max-width: 820px)").matches;
  const config = isMobile ? HOME_MOTION_CONFIG.mobile : HOME_MOTION_CONFIG.desktop;

  document.documentElement.style.setProperty("--speed", `${config.speedSeconds}s`);
  document.documentElement.style.setProperty("--trail-opacity", config.trailOpacity);
  document.documentElement.style.setProperty("--trail-blur", `${config.trailBlur}px`);
  document.documentElement.style.setProperty("--jitter", `${config.jitterPx}px`);

  if (isMobile) {
    cover.style.setProperty("left", "0", "important");
    cover.style.setProperty("top", "0", "important");
  } else {
    cover.style.left = "0";
    cover.style.top = "0";
  }

  const motionPath = createHomeMotionPath(config);
  let motionTime = 0;
  let x = 0;
  let y = 0;

  function syncMotionPosition() {
    const point = motionPath(motionTime);
    x = point.x * Math.max(0, field.clientWidth - cover.offsetWidth);
    y = point.y * Math.max(0, field.clientHeight - cover.offsetHeight);
  }

  syncMotionPosition();
  let lastTime = performance.now();
  let lastTrail = 0;
  let nextTrailDelay = config.trailIntervalMinMs;
  let frameId = 0;
  let trailTime = 0;

  const history = document.createElement("canvas");
  history.className = isMobile ? "motion-history mobile-motion-history" : "motion-history";
  history.setAttribute("aria-hidden", "true");
  if (isMobile) {
    history.style.display = "block";
    history.style.position = "absolute";
    history.style.inset = "0";
    history.style.width = "100%";
    history.style.height = "100%";
    history.style.zIndex = "1";
    history.style.pointerEvents = "none";
  }

  const context = history.getContext("2d", { alpha: true });
  const stamp = document.createElement("canvas");
  stamp.width = stamp.height = config.stampSize;
  const stampContext = stamp.getContext("2d", { alpha: true });
  let stampReady = false;
  let historyScale = 1;

  function prepareStamp() {
    if (!artwork.naturalWidth || !stampContext) return;
    const size = config.stampSize;
    stampContext.clearRect(0, 0, size, size);
    stampContext.globalCompositeOperation = "source-over";
    stampContext.drawImage(artwork, 0, 0, size, size);
    stampContext.globalCompositeOperation = "destination-in";
    for (const axis of ["x", "y"]) {
      const feather = stampContext.createLinearGradient(0, 0, axis === "x" ? size : 0, axis === "y" ? size : 0);
      feather.addColorStop(0, "transparent");
      feather.addColorStop(0.08, "#000");
      feather.addColorStop(0.92, "#000");
      feather.addColorStop(1, "transparent");
      stampContext.fillStyle = feather;
      stampContext.fillRect(0, 0, size, size);
    }
    stampReady = true;
  }

  function resizeHistory() {
    if (!context || !field.clientWidth || !field.clientHeight) return;
    const scale = Math.min(
      window.devicePixelRatio || 1,
      config.maxHistoryScale,
      config.maxHistoryPixels / field.clientWidth,
      config.maxHistoryPixels / field.clientHeight
    );
    const width = Math.max(1, Math.round(field.clientWidth * scale));
    const height = Math.max(1, Math.round(field.clientHeight * scale));
    if (history.width === width && history.height === height) return;
    history.width = width;
    history.height = height;
    historyScale = scale;
  }

  if (context && stampContext) {
    field.insertBefore(history, cover);
    resizeHistory();
    if (artwork.complete) prepareStamp();
    artwork.addEventListener("load", prepareStamp, { once: true });
  }

  // Paint each afterimage once and never clear it: a long-exposure trace.
  function makeTrail(now) {
    if (context && stampReady) {
      const scale = 1 + (Math.random() - 0.5) * config.trailScaleVariance * 2;
      const width = cover.offsetWidth * scale;
      const height = cover.offsetHeight * scale;
      const left = x + (cover.offsetWidth - width) / 2;
      const top = y + (cover.offsetHeight - height) / 2;

      context.save();
      context.setTransform(historyScale, 0, 0, historyScale, 0, 0);
      context.filter = `blur(${config.trailBlur}px) saturate(${isMobile ? 0.72 : 0.7})`;
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
    motionTime += dt * config.motionFactor / config.speedSeconds;
    trailTime += dt * 1000;
    syncMotionPosition();

    const jitterX = (Math.random() - 0.5) * config.jitterPx;
    const jitterY = (Math.random() - 0.5) * config.jitterPx;
    const exposureBase = isMobile ? 0.985 : 0.98;
    const exposure = exposureBase + Math.sin(now / config.exposurePeriodMs) * config.brightnessVariation;
    const saturation = 0.82 + Math.sin(now / (config.exposurePeriodMs * 1.37)) * config.colorDriftAmount;
    const transform = `translate(${x + jitterX}px, ${y + jitterY}px)`;

    if (isMobile) cover.style.setProperty("transform", transform, "important");
    else cover.style.transform = transform;
    cover.style.filter = `saturate(${saturation}) contrast(.94) brightness(${exposure})`;

    if (trailTime - lastTrail > nextTrailDelay) makeTrail(trailTime);
    frameId = requestAnimationFrame(animate);
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      resizeHistory();
      syncMotionPosition();
    }).observe(field);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !frameId) {
      lastTime = performance.now();
      frameId = requestAnimationFrame(animate);
    }
  });

  frameId = requestAnimationFrame(animate);
}

document.addEventListener("DOMContentLoaded", () => {
  setupPanels();
  setupDetailClose();
  setupNoteNavigation();
  setupHomeGrid();
  setupHomeMotion();
});
