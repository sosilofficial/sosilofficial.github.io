const HOME_MOTION_CONFIG = Object.freeze({
  speedSeconds: 90,
  trailCount: 6,
  trailOpacity: 0.08,
  trailBlur: 5,
  trailLifetimeMs: 2400,
  jitterPx: 1.2
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

function setupHomeMotion() {
  const field = document.querySelector("[data-home-motion]");
  const cover = field?.querySelector(".moving-cover");
  if (!field || !cover || matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(max-width: 820px)").matches) return;

  const config = HOME_MOTION_CONFIG;
  document.documentElement.style.setProperty("--speed", `${config.speedSeconds}s`);
  document.documentElement.style.setProperty("--trail-count", config.trailCount);
  document.documentElement.style.setProperty("--trail-opacity", config.trailOpacity);
  document.documentElement.style.setProperty("--trail-blur", `${config.trailBlur}px`);
  document.documentElement.style.setProperty("--trail-lifetime", `${config.trailLifetimeMs}ms`);
  document.documentElement.style.setProperty("--jitter", `${config.jitterPx}px`);

  let x = field.clientWidth * .34;
  let y = field.clientHeight * .42;
  let vx = field.clientWidth / config.speedSeconds;
  let vy = field.clientHeight / (config.speedSeconds * 1.18);
  let lastTime = performance.now();
  let lastTrail = 0;
  const trails = [];

  function makeTrail(now) {
    const trail = cover.cloneNode(true);
    trail.removeAttribute("href");
    trail.removeAttribute("aria-label");
    trail.className = "motion-trail";
    trail.style.transform = `translate(${x}px, ${y}px)`;
    field.insertBefore(trail, cover);
    trails.push(trail);
    while (trails.length > config.trailCount) trails.shift()?.remove();
    window.setTimeout(() => {
      trail.remove();
      const index = trails.indexOf(trail);
      if (index >= 0) trails.splice(index, 1);
    }, config.trailLifetimeMs);
    lastTrail = now;
  }

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, .1);
    lastTime = now;
    const maxX = Math.max(0, field.clientWidth - cover.offsetWidth);
    const maxY = Math.max(0, field.clientHeight - cover.offsetHeight);
    x += vx * dt;
    y += vy * dt;
    if (x <= 0 || x >= maxX) { x = Math.max(0, Math.min(maxX, x)); vx *= -1; }
    if (y <= 0 || y >= maxY) { y = Math.max(0, Math.min(maxY, y)); vy *= -1; }
    const jitterX = (Math.random() - .5) * config.jitterPx;
    const jitterY = (Math.random() - .5) * config.jitterPx;
    const exposure = .98 + Math.sin(now / 4100) * .025;
    cover.style.transform = `translate(${x + jitterX}px, ${y + jitterY}px)`;
    cover.style.filter = `saturate(.82) contrast(.94) brightness(${exposure})`;
    if (now - lastTrail > 420) makeTrail(now);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

document.addEventListener("DOMContentLoaded", () => {
  setupPanels();
  setupDetailClose();
  setupHomeMotion();
});
