# 콘텐츠 등록 방법

1. 저장소의 **Issues** 탭에서 **New issue**를 누릅니다.
2. **콘텐츠 등록** 양식의 **Get started**를 누릅니다.
3. 카테고리와 내용을 입력하고 이미지는 입력 칸에 드래그해 업로드합니다.
4. **Submit new issue**를 누릅니다.

입력이 유효하면 콘텐츠 파일과 사이트 페이지가 자동으로 생성되고 Issue가 닫힙니다. 실패한 경우 Issue는 열린 상태로 남으며 저장소의 **Actions → Publish content from issue**에서 오류 이유를 확인할 수 있습니다.

기존 콘텐츠를 수정할 때는 **New issue → Edit existing content**를 선택하고 카테고리와 기존 slug 또는 URL을 입력합니다. 새 값을 입력한 항목만 변경되며 비운 항목은 기존 값을 유지합니다.

`slug`를 비워두면 `날짜-Issue번호`가 사용됩니다. 직접 입력할 때는 글자, 숫자, 하이픈만 사용하세요. 외부 링크는 URL만 입력하거나 `표시 이름 | URL` 형식으로 입력할 수 있습니다.

## 기존 값 삭제

Edit existing content에서 비워둔 항목은 그대로 유지됩니다. 선택 항목을 완전히 삭제하려면 해당 칸에 `__REMOVE__`만 입력하세요.

- 설명, 썸네일, 영상, 재생 시간, 종류, 크레딧, 노트, 가격, 판매 상태, 추가 설명은 빈 문자열로 저장됩니다.
- 본문 이미지와 외부 링크는 빈 배열로 저장됩니다. 본문도 빈 글로 만들 수 있습니다.
- 제목과 날짜는 필수 값이므로 삭제할 수 없습니다. slug와 기존 상세 페이지 주소는 변경되지 않습니다.
- 영상 삭제 시 해당 영상에서 자동 생성된 썸네일도 제거됩니다. 직접 지정한 썸네일은 유지됩니다.
- 썸네일 필드 삭제 후에도 기존 렌더러는 본문 첫 이미지나 영상의 YouTube 썸네일을 대체 이미지로 사용할 수 있습니다. 대체 이미지까지 없애려면 관련 이미지/영상 필드도 삭제하세요.

## 첨부 이미지 보존

새로 등록하거나 수정할 때 입력한 GitHub Issue 첨부 이미지는 원본 바이트 그대로 `/media/catalog/YYYY-MM-DD/<sha256>.<확장자>`에 저장합니다. 날짜는 저장 시점 UTC 기준입니다. 썸네일, 본문 이미지 목록, Markdown 본문의 이미지가 대상이며 같은 첨부 파일은 한 번만 다운로드합니다.

기존 콘텐츠의 이미지와 일반 외부 URL은 일괄 변경하지 않습니다. 공개 접근 가능한 GitHub 첨부 URL만 다운로드하며, 인증이 필요하거나 다운로드 실패, 20 MiB 초과, 지원하지 않는 형식이면 원래 URL을 유지하고 Actions 로그에 경고를 남깁니다. 경고가 있으면 해당 이미지의 로컬 보존은 완료되지 않은 상태입니다. PNG/JPEG/GIF/WebP/AVIF를 지원하며 변환이나 재압축은 하지 않습니다.

## 공통 빌드와 확인

`npm ci` 및 `npx playwright install --with-deps chromium`으로 준비한 뒤 `npm run build:site`를 실행합니다. `npm run build`도 같은 명령입니다.

Issue 등록/수정과 content/script 변경 workflow는 모두 이 명령을 사용합니다. 기존 순서대로 스타일 통합 → 콘텐츠 생성 → Video/Discography/Live/Merch/Archive Photo/Archive Text/Notes/Home/Shared UI/Mobile 후처리 → 인라인 스타일 정리 → Archive Video 경로 정리 → 검증 → 브라우저 QA를 수행합니다. 어느 단계든 실패하면 커밋 단계로 진행하지 않습니다.

`npm test`는 임시 폴더에서 등록/수정/삭제, 첨부 이미지 처리, 생성 결과 보존을 검사합니다. Pull Request에서도 테스트와 전체 빌드를 실행합니다. 브라우저가 없는 환경에서만 `node scripts/build-site.mjs --skip-browser-qa`로 정적 검증까지 실행할 수 있습니다. 운영 workflow는 이 옵션을 사용하지 않습니다.
