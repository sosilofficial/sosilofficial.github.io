const HOME_MOTION_CONFIG = Object.freeze({
  speedSeconds: 58,
  trailOpacity: 0.045,
  trailBlur: 1.2,
  trailIntervalMinMs: 280,
  trailIntervalMaxMs: 380,
  trailScaleVariance: 0.003,
  jitterPx: 0.45,
  brightnessVariation: 0.025,
  colorDriftAmount: 0.018,
  exposurePeriodMs: 4100
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
function createHomeMotionPath() {
  const tau = Math.PI * 2;
  const phaseX = Math.random() * tau;
  const phaseY = Math.random() * tau;
  const bendX = Math.random() * tau;
  const bendY = Math.random() * tau;
  const rateX = .85 + Math.random() * .3;
  const rateY = .9 + Math.random() * .35;
  return (time) => ({
    x: .5 + .34 * Math.sin(time * rateX + phaseX) + .1 * Math.sin(time * .53 + bendX),
    y: .5 + .34 * Math.sin(time * rateY + phaseY) + .1 * Math.sin(time * .67 + bendY)
  });
}

function setupHomeMotion() {
  const field = document.querySelector("[data-home-motion]");
  const cover = field?.querySelector(".moving-cover");
  if (!field || !cover || matchMedia("(max-width: 820px)").matches) return;

  // Reduced-motion keeps the quiet path and persistent long-exposure traces,
  // minus jitter and tonal modulation.
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const config = reducedMotion
    ? {
        ...HOME_MOTION_CONFIG,
        jitterPx: 0,
        trailScaleVariance: 0,
        brightnessVariation: 0,
        colorDriftAmount: 0
      }
    : HOME_MOTION_CONFIG;
  document.documentElement.style.setProperty("--speed", `${config.speedSeconds}s`);
  document.documentElement.style.setProperty("--trail-opacity", config.trailOpacity);
  document.documentElement.style.setProperty("--trail-blur", `${config.trailBlur}px`);
  document.documentElement.style.setProperty("--jitter", `${config.jitterPx}px`);

  cover.style.left = "0";
  cover.style.top = "0";
  const motionPath = createHomeMotionPath();
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
  history.className = "motion-history";
  history.setAttribute("aria-hidden", "true");
  const context = history.getContext("2d");
  const artwork = cover.querySelector("img");
  const stamp = document.createElement("canvas");
  stamp.width = stamp.height = 256;
  const stampContext = stamp.getContext("2d");
  let stampReady = false;
  let historyScale = 1;

  function prepareStamp() {
    if (!artwork?.naturalWidth || !stampContext) return;
    stampContext.clearRect(0, 0, 256, 256);
    stampContext.globalCompositeOperation = "source-over";
    stampContext.drawImage(artwork, 0, 0, 256, 256);
    stampContext.globalCompositeOperation = "destination-in";
    for (const axis of ["x", "y"]) {
      const feather = stampContext.createLinearGradient(0, 0, axis === "x" ? 256 : 0, axis === "y" ? 256 : 0);
      feather.addColorStop(0, "transparent");
      feather.addColorStop(.08, "#000");
      feather.addColorStop(.92, "#000");
      feather.addColorStop(1, "transparent");
      stampContext.fillStyle = feather;
      stampContext.fillRect(0, 0, 256, 256);
    }
    stampReady = true;
  }

  function resizeHistory() {
    if (!context || !field.clientWidth || !field.clientHeight) return;
    const scale = Math.min(window.devicePixelRatio || 1, 1.5, 1600 / field.clientWidth, 1600 / field.clientHeight);
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
    if (artwork?.complete) prepareStamp();
    artwork?.addEventListener("load", prepareStamp);
  }

  // Paint each afterimage once onto the history canvas and never clear it.
  // This behaves like a long exposure: the path accumulates for the life of the page.
  function makeTrail(now) {
    if (context && stampReady) {
      const scale = 1 + (Math.random() - .5) * config.trailScaleVariance * 2;
      const width = cover.offsetWidth * scale;
      const height = cover.offsetHeight * scale;
      const left = x + (cover.offsetWidth - width) / 2;
      const top = y + (cover.offsetHeight - height) / 2;

      context.save();
      context.setTransform(historyScale, 0, 0, historyScale, 0, 0);
      context.filter = `blur(${config.trailBlur}px) saturate(.7)`;
      context.globalAlpha = config.trailOpacity * (.9 + Math.random() * .2);
      context.drawImage(stamp, left, top, width, height);
      context.restore();
    }
    lastTrail = now;
    nextTrailDelay = config.trailIntervalMinMs + Math.random() * (config.trailIntervalMaxMs - config.trailIntervalMinMs);
  }

  function animate(now) {
    frameId = 0;
    if (document.hidden) return;
    const dt = Math.min((now - lastTime) / 1000, .1);
    lastTime = now;
    motionTime += dt * 2.2 / config.speedSeconds;
    trailTime += dt * 1000;
    syncMotionPosition();
    const jitterX = (Math.random() - .5) * config.jitterPx;
    const jitterY = (Math.random() - .5) * config.jitterPx;
    const exposure = .98 + Math.sin(now / config.exposurePeriodMs) * config.brightnessVariation;
    const saturation = .82 + Math.sin(now / (config.exposurePeriodMs * 1.37)) * config.colorDriftAmount;
    cover.style.transform = `translate(${x + jitterX}px, ${y + jitterY}px)`;
    cover.style.filter = `saturate(${saturation}) contrast(.94) brightness(${exposure})`;
    if (trailTime - lastTrail > nextTrailDelay) makeTrail(trailTime);
    frameId = requestAnimationFrame(animate);
  }

  const resizeObserver = new ResizeObserver(() => {
    resizeHistory();
    syncMotionPosition();
  });
  resizeObserver.observe(field);
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
  setupHomeGrid();
  setupHomeMotion();
});
