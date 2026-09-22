(() => {
  const isArchivePhoto = location.pathname === "/archive/photo-video/" || location.pathname.startsWith("/archive/photo-video/");
  if (!isArchivePhoto) return;

  const photoIdPattern = /^#photo-(.+)-(\d+)$/;

  for (const link of document.querySelectorAll(".photo-index a, .photo-masonry a")) {
    const rawHref = link.getAttribute("href");
    if (!rawHref) continue;

    const target = new URL(rawHref, location.href);
    const match = target.hash.match(photoIdPattern);
    if (match) {
      const slug = match[1];
      target.pathname = `/archive/photo-video/${slug}/`;
      target.hash = "";
      link.setAttribute("href", `${target.pathname}${target.search}`);
    }
    link.removeAttribute("data-panel-target");
  }

  sessionStorage.removeItem("sosil:detail-scroll:archive-photo:y");
  sessionStorage.removeItem("sosil:detail-scroll:archive-photo:pending");

  if (location.hash.startsWith("#photo-")) {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }

  const isDetail = /^\/archive\/photo-video\/[^/]+\/?$/.test(location.pathname);
  if (!isDetail) return;

  history.scrollRestoration = "manual";
  const resetToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const detailPanel = document.querySelector(".archive-photo-split > .detail-panel");
    if (detailPanel) detailPanel.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  resetToTop();
  requestAnimationFrame(() => requestAnimationFrame(resetToTop));
  window.addEventListener("load", resetToTop, { once: true });
})();
