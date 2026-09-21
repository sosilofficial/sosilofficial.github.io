const STYLE = `<style id="desktop-detail-scale-override">
@media (min-width: 821px) {
  /* Keep the compact desktop detail treatment without overriding index image scale. */
  .release-split .release-detail {
    --detail-grid-gap: clamp(22px, 2vw, 32px);
    grid-template-columns: clamp(90px, 8.5vw, 120px) minmax(0, 1fr);
    width: min(100%, 600px);
    max-width: 600px;
  }

  .merch-split .merch-detail {
    width: min(100%, 460px);
    max-width: 460px;
  }
  .merch-split .merch-gallery {
    gap: clamp(8px, 1vw, 12px);
  }
}
</style>`;

console.log("Desktop detail scale is consolidated into the shared stylesheet without overriding reduced index images.");
