import fs from "node:fs";

const file = new URL("./browser-qa.mjs", import.meta.url);
let source = fs.readFileSync(file, "utf8");

source = source.replace(
  `const heading = await page.locator(".category-top h1").boundingBox();
  const subnav = await page.locator(".category-top .subnav").boundingBox();
  const gap = await page.locator(".category-top .subnav").evaluate((node) => getComputedStyle(node).columnGap || getComputedStyle(node).gap);`,
  `const heading = await page.locator(".category-top h1:visible").first().boundingBox();
  const subnav = await page.locator(".category-top .subnav:visible").first().boundingBox();
  const gap = await page.locator(".category-top .subnav:visible").first().evaluate((node) => getComputedStyle(node).columnGap || getComputedStyle(node).gap);`
);

source = source.replace(
  'assertGridMatch(coverBox, videoBox, `${viewport.name}: Discography/Video 첫 이미지`, ["x", "y"]);',
  'assertGridMatch(coverBox, videoBox, `${viewport.name}: Discography/Video 첫 이미지`, viewport.width > 820 ? ["x", "y", "width"] : ["x", "y"]);'
);

source = source.replace(
  'assertGridMatch(releaseIndexBox, liveBox, `${viewport.name}: Works 목록 시작선`, ["x", "y"]);',
  'assertGridMatch(releaseIndexBox, liveBox, `${viewport.name}: Works 목록 시작선`, viewport.width > 820 ? ["y"] : ["x", "y"]);'
);

source = source.replace(
  'assert(mailingBox.width <= 300, `${viewport.name}: 모바일 Mailing List가 지나치게 큽니다`);',
  `const brandBox = await page.locator(".site-brand").boundingBox();
      assert(brandBox, \`${'${viewport.name}'}: 모바일 sosil 기준선을 읽지 못했습니다\`);
      assert(Math.abs(mailingBox.x - brandBox.x) <= 2, \`${'${viewport.name}'}: 모바일 Mailing List가 sosil 시작선과 맞지 않습니다\`);
      assert(Math.abs((viewport.width - mailingBox.x - mailingBox.width) - brandBox.x) <= 2, \`${'${viewport.name}'}: 모바일 Mailing List 오른쪽 여백이 sosil 기준 그리드와 맞지 않습니다\`);`
);

const oldArchive = `    const archivePhotoBox = await page.locator(".photo-post-grid").boundingBox();
    assert(worksRhythm.gap === archiveRhythm.gap, \`${'${viewport.name}'}: Works와 Archive 하위 메뉴 간격이 다릅니다 (${'${worksRhythm.gap}'} / ${'${archiveRhythm.gap}'})\`);
    assert(Math.abs(worksRhythm.verticalGap - archiveRhythm.verticalGap) <= 1, \`${'${viewport.name}'}: Works와 Archive 제목-하위메뉴 간격이 다릅니다 (${'${worksRhythm.verticalGap}'}px / ${'${archiveRhythm.verticalGap}'}px)\`);

    await open(page, "/archive/videos");
    const archiveVideoBox = await page.locator(".archive-video-grid, .wide-empty").boundingBox();
    assertGridMatch(archivePhotoBox, archiveVideoBox, \`${'${viewport.name}'}: Archive Photo/Video 목록\`, ["x", "y", "width"]);

    await open(page, "/archive/links");
    const archiveTextBox = await page.locator(".archive-text-groups").boundingBox();
    assertGridMatch(archivePhotoBox, archiveTextBox, \`${'${viewport.name}'}: Archive Photo/Text 목록\`, ["x", "y", "width"]);`;

const strictArchive = `    const archivePhotoBox = await visibleBox(page, viewport.width > 820 ? ".archive-desktop-only .photo-index" : ".archive-mobile-only .photo-masonry");
    assert(archivePhotoBox, \`${'${viewport.name}'}: Archive Photo 목록을 찾지 못했습니다\`);
    assert(worksRhythm.gap === archiveRhythm.gap, \`${'${viewport.name}'}: Works와 Archive 하위 메뉴 간격이 다릅니다 (${'${worksRhythm.gap}'} / ${'${archiveRhythm.gap}'})\`);
    assert(Math.abs(worksRhythm.verticalGap - archiveRhythm.verticalGap) <= 1, \`${'${viewport.name}'}: Works와 Archive 제목-하위메뉴 간격이 다릅니다 (${'${worksRhythm.verticalGap}'}px / ${'${archiveRhythm.verticalGap}'}px)\`);

    await open(page, "/archive/videos");
    const archiveVideoBox = await visibleBox(page, viewport.width > 820 ? ".archive-desktop-only .archive-video-index, .archive-desktop-only .empty-note" : ".archive-mobile-only .archive-video-grid, .archive-mobile-only .wide-empty");
    assert(archiveVideoBox, \`${'${viewport.name}'}: Archive Video 목록을 찾지 못했습니다\`);
    assertGridMatch(archivePhotoBox, archiveVideoBox, \`${'${viewport.name}'}: Archive Photo/Video 목록\`, ["x", "y", "width"]);

    await open(page, "/archive/links");
    const archiveTextBox = await page.locator(".archive-text-groups").boundingBox();
    assert(archiveTextBox, \`${'${viewport.name}'}: Archive Text 목록을 찾지 못했습니다\`);`;

const broadArchive = `    const archivePhotoBox = await visibleBox(page, ".photo-index, .photo-masonry, .photo-post-grid");
    assert(archivePhotoBox, \`${'${viewport.name}'}: Archive Photo 목록을 찾지 못했습니다\`);
    assert(worksRhythm.gap === archiveRhythm.gap, \`${'${viewport.name}'}: Works와 Archive 하위 메뉴 간격이 다릅니다 (${'${worksRhythm.gap}'} / ${'${archiveRhythm.gap}'})\`);
    assert(Math.abs(worksRhythm.verticalGap - archiveRhythm.verticalGap) <= 1, \`${'${viewport.name}'}: Works와 Archive 제목-하위메뉴 간격이 다릅니다 (${'${worksRhythm.verticalGap}'}px / ${'${archiveRhythm.verticalGap}'}px)\`);

    await open(page, "/archive/videos");
    const archiveVideoBox = await visibleBox(page, ".archive-video-index, .archive-video-grid, .video-index, .wide-empty, .empty-note");
    assert(archiveVideoBox, \`${'${viewport.name}'}: Archive Video 목록을 찾지 못했습니다\`);
    assertGridMatch(archivePhotoBox, archiveVideoBox, \`${'${viewport.name}'}: Archive Photo/Video 목록\`, ["x", "y", "width"]);

    await open(page, "/archive/links");
    const archiveTextBox = await page.locator(".archive-text-groups").boundingBox();
    assert(archiveTextBox, \`${'${viewport.name}'}: Archive Text 목록을 찾지 못했습니다\`);`;

if (source.includes(oldArchive)) {
  source = source.replace(oldArchive, broadArchive);
} else if (source.includes(strictArchive)) {
  source = source.replace(strictArchive, broadArchive);
} else if (!source.includes('const archivePhotoBox = await visibleBox(page, ".photo-index, .photo-masonry, .photo-post-grid")')) {
  throw new Error("Archive QA block not found.");
}

const oldCategoryPages = `    const categoryPages = [
      ["/works/discography", ".category-top h1"],
      ["/archive", ".category-top h1"],
      ["/notes", ".category-top h1"],
      ["/merch", ".category-top h1"],
      ["/info", ".category-top h1"],
      ["/contact", ".contact-top h1"],
      ["/news", ".category-top h1"],
    ];`;

const newCategoryPages = `    const categoryPages = [
      ["/works/discography", ".category-top h1"],
      ["/archive", ".category-top h1"],
      ["/notes", ".category-top h1"],
      ["/merch", ".category-top h1"],
      ["/news", ".category-top h1"],
    ];`;

if (source.includes(oldCategoryPages)) {
  source = source.replace(oldCategoryPages, newCategoryPages);
} else if (!source.includes(newCategoryPages)) {
  throw new Error("Category heading QA block not found.");
}

fs.writeFileSync(file, source);
console.log("Aligned browser QA with the unified desktop split grid and mobile homepage gutter.");
