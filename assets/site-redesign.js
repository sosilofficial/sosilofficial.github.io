const HOME_MOTION_CONFIG = Object.freeze({
  speedSeconds: 58,
  trailOpacity: 0.22,
  trailBlur: 3.5,
  trailIntervalMinMs: 300,
  trailIntervalMaxMs: 380,
  trailScaleVariance: 0.012,
  jitterPx: 0.6,
  brightnessVariation: 0.025,
  colorDriftAmount: 0.018,
  exposurePeriodMs: 4100
});

const MOBILE_HOME_MOTION_CONFIG = Object.freeze({
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

function setupDetailScrollMemory() {
  if (matchMedia("(max-width: 820px)").matches) return;

  const configs = [
    {
      match: (pathname) => pathname === "/works/videos/" || pathname.startsWith("/works/videos/"),
      selector: '.video-index a[href^="/works/videos/"]',
      key: "sosil:detail-scroll:works-videos"
    },
    {
      match: (pathname) => pathname === "/works/discography/" || pathname.startsWith("/works/discography/"),
      selector: '.release-index a[href^="/works/discography/"]',
      key: "sosil:detail-scroll:discography"
    },
    {
      match: (pathname) => pathname === "/notes/" || pathname.startsWith("/notes/"),
      selector: '.note-index a[href^="/notes/"]',
      key: "sosil:detail-scroll:notes"
    },
    {
      match: (pathname) => pathname === "/news/" || pathname.startsWith("/news/"),
      selector: '.news-index a[href^="/news/"]',
      key: "sosil:detail-scroll:news"
    },
    {
      match: (pathname) => pathname === "/merch/" || pathname.startsWith("/merch/"),
      selector: '.merch-index a[href^="/merch/"]',
      key: "sosil:detail-scroll:merch"
    },
    {
      match: (pathname) => pathname === "/archive/photo-video/" || pathname.startsWith("/archive/photo-video/"),
      selector: '.photo-index a[href^="/archive/photo-video/"], .photo-post-grid a[href^="/archive/photo-video/"]',
      key: "sosil:detail-scroll:archive-photo"
    },
    {
      match: (pathname) => pathname === "/archive/videos/" || pathname.startsWith("/archive/videos/"),
      selector: '.video-index a[href^="/archive/videos/"], .archive-video-grid a[href^="/archive/videos/"]',
      key: "sosil:detail-scroll:archive-video"
    }
  ];

  const config = configs.find(({ match }) => match(location.pathname));
  if (!config) return;

  const positionKey = `${config.key}:y`;
  const pendingKey = `${config.key}:pending`;
  const links = [...document.querySelectorAll(config.selector)];

  links.forEach((link) => link.addEventListener("click", (event) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    sessionStorage.setItem(positionKey, String(window.scrollY));
    sessionStorage.setItem(pendingKey, "1");
  }));

  if (sessionStorage.getItem(pendingKey) !== "1") return;
  sessionStorage.removeItem(pendingKey);

  const saved = Number(sessionStorage.getItem(positionKey));
  if (!Number.isFinite(saved) || saved < 0) return;

  history.scrollRestoration = "manual";
  const restore = () => window.scrollTo({ top: saved, left: 0, behavior: "auto" });
  requestAnimationFrame(() => requestAnimationFrame(restore));
  window.addEventListener("load", restore, { once: true });
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

function setupDesktopHomeMotion(field, cover, artwork) {
  if (matchMedia("(max-width: 820px)").matches) return;

  // Match the original desktop behavior: reduced-motion keeps the slow drift and
  // accumulated afterimages, but removes jitter and exposure/color pulsing.
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

  cover.style.setProperty("left", "0", "important");
  cover.style.setProperty("top", "0", "important");

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

  // Keep the earlier long-exposure behavior: every stamp remains for the whole page session.
  const history = document.createElement("canvas");
  history.className = "motion-history";
  history.setAttribute("aria-hidden", "true");
  const context = history.getContext("2d");
  const stamp = document.createElement("canvas");
  stamp.width = stamp.height = 256;
  const stampContext = stamp.getContext("2d");
  let stampReady = false;
  let historyScale = 1;

  function prepareStamp() {
    if (!artwork.naturalWidth || !stampContext) return;
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

    const previous = document.createElement("canvas");
    previous.width = history.width;
    previous.height = history.height;
    const previousContext = previous.getContext("2d");
    if (previousContext && history.width && history.height) previousContext.drawImage(history, 0, 0);

    history.width = width;
    history.height = height;
    if (previousContext && previous.width && previous.height) context.drawImage(previous, 0, 0, width, height);
    historyScale = scale;
  }

  if (context && stampContext) {
    field.insertBefore(history, cover);
    resizeHistory();
    if (artwork.complete) prepareStamp();
    artwork.addEventListener("load", prepareStamp, { once: true });
  }

  function makeTrail(now) {
    if (context && stampReady) {
      const scale = 1 + (Math.random() - .5) * config.trailScaleVariance * 2;
      const width = cover.offsetWidth * scale;
      const height = cover.offsetHeight * scale;

      context.save();
      context.setTransform(historyScale, 0, 0, historyScale, 0, 0);
      context.globalAlpha = config.trailOpacity * (.9 + Math.random() * .2);
      context.filter = `blur(${config.trailBlur}px) saturate(.65)`;
      context.drawImage(
        stamp,
        x + (cover.offsetWidth - width) / 2,
        y + (cover.offsetHeight - height) / 2,
        width,
        height
      );
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
    syncMotionPosition();

    const jitterX = (Math.random() - .5) * config.jitterPx;
    const jitterY = (Math.random() - .5) * config.jitterPx;
    const exposure = .98 + Math.sin(now / config.exposurePeriodMs) * config.brightnessVariation;
    const saturation = .82 + Math.sin(now / (config.exposurePeriodMs * 1.37)) * config.colorDriftAmount;
    cover.style.setProperty("transform", `translate(${x + jitterX}px, ${y + jitterY}px)`, "important");
    cover.style.filter = `saturate(${saturation}) contrast(.94) brightness(${exposure})`;

    if (now - lastTrail > nextTrailDelay) makeTrail(now);
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

function setupMobileHomeMotion(field, cover, artwork) {
  if (!matchMedia("(max-width: 820px)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const config = MOBILE_HOME_MOTION_CONFIG;
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
      context.filter = `blur(${config.trailBlur}px) saturate(.72)`;
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

    cover.style.setProperty("transform", `translate(${x + jitterX}px, ${y + jitterY}px)`, "important");
    cover.style.filter = `saturate(${saturation}) contrast(.94) brightness(${exposure})`;

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
}

function setupHomeMotion() {
  const field = document.querySelector("[data-home-motion]");
  const cover = field?.querySelector(".moving-cover");
  const artwork = cover?.querySelector("img");
  if (!field || !cover || !artwork) return;

  if (matchMedia("(max-width: 820px)").matches) setupMobileHomeMotion(field, cover, artwork);
  else setupDesktopHomeMotion(field, cover, artwork);
}

document.addEventListener("DOMContentLoaded", () => {
  setupPanels();
  setupDetailClose();
  setupDetailScrollMemory();
  setupNoteNavigation();
  setupHomeGrid();
  setupHomeMotion();
});
