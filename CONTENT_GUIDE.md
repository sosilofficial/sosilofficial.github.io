# 콘텐츠 등록 방법

1. 저장소의 **Issues** 탭에서 **New issue**를 누릅니다.
2. **콘텐츠 등록** 양식의 **Get started**를 누릅니다.
3. 카테고리와 내용을 입력하고 이미지는 입력 칸에 드래그해 업로드합니다.
4. **Submit new issue**를 누릅니다.

입력이 유효하면 콘텐츠 파일과 사이트 페이지가 자동으로 생성되고 Issue가 닫힙니다. 실패한 경우 Issue는 열린 상태로 남으며 저장소의 **Actions → Publish content from issue**에서 오류 이유를 확인할 수 있습니다. 오류를 수정한 뒤에는 해당 Issue를 닫았다가 다시 열면 게시 작업을 재시도할 수 있습니다.

기존 콘텐츠를 수정할 때는 **New issue → Edit existing content**를 선택하고 카테고리와 기존 slug 또는 URL을 입력합니다. 새 값을 입력한 항목만 변경되며 비운 항목은 기존 값을 유지합니다.

`slug`를 비워두면 `날짜-Issue번호`가 사용됩니다. 직접 입력할 때는 글자, 숫자, 하이픈만 사용하세요. 외부 링크는 URL만 입력하거나 `표시 이름 | URL` 형식으로 입력할 수 있습니다.

## Bandsintown upcoming 공연 자동 연동

- 아티스트 ID: `15665087`. `content/works/live/history.md`는 past의 유일한 수동 원본이며 자동 수집기가 수정하지 않습니다. 종료된 upcoming을 history로 자동 복사하지 않습니다.
- 노출된 기존 키는 사용하지 마세요. Bandsintown에서 폐기/회전한 **새 키**를 저장소 Settings → Secrets and variables → Actions의 `BANDSINTOWN_API_KEY`에 등록하세요. 회전 메뉴가 없으면 API@bandsintown.com에 기존 키 폐기와 재발급을 요청하세요. 키를 채팅, 이슈, 파일에 붙여넣지 마세요.
- Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 선택하세요. 봇 커밋만으로는 Pages 빌드가 시작되지 않으므로 rebuild와 이슈 발행 workflow가 검증한 정적 파일을 직접 배포합니다. 기존 이슈 발행 경로도 유지됩니다.
- 병합 후 Actions → Rebuild site from content → Run workflow로 최초 수집을 실행하세요. 이후 매일 UTC 00:17/06:17/12:17/18:17 (한국 09:17/15:17/21:17/03:17)에 실행합니다. GitHub의 예약 실행은 지연되거나 비활성화될 수 있습니다.
- 수집 → 전체 rebuild → 브라우저 QA → 변경분 커밋 → Pages 배포 순서입니다. 키는 수집 단계에만 전달하며 브라우저에서 API를 호출하지 않습니다.
- `content/works/live/upcoming.json`은 인증 정보를 제거한 정상 응답의 스냅샷입니다. 최초 `events: null`은 아직 수집하지 않았음을 뜻합니다. 정상 빈 배열은 공지된 공연이 없음을 뜻합니다. API 오류/시간 초과/잘못된 응답/키 미설정 시 workflow 경고를 남기고 마지막 정상 파일을 유지합니다. 이 경우 수정·취소 정보는 다음 성공까지 지연될 수 있습니다.
- 날짜순으로 표시하며 이용 가능한 티켓은 `tickets`, 없으면 이벤트 페이지의 `rsvp` 링크를 표시합니다. 시각은 공연 현지 시각입니다. 시간대 없는 날짜는 전 세계에서 해당 날짜가 끝난 뒤 제거하므로 최대 26시간 정도 더 표시될 수 있습니다. 제거는 rebuild 때 적용됩니다.
- API의 venue.name은 아티스트가 공연명 표시를 선택한 경우 실제 공연장 대신 공연명이 올 수 있습니다.
- 검증: `node --test scripts/bandsintown.test.mjs`, `npm run build`, `npm run qa:browser`. 실 API 검증은 새 secret 등록 후 workflow의 경고 유무와 live 페이지의 실제 공연 정보를 확인하세요.

공식 문서: [Bandsintown API](https://help.artists.bandsintown.com/en/articles/9186477-api-documentation), [키 발급 및 지원](https://help.artists.bandsintown.com/en/articles/7053475-what-is-the-bandsintown-api), [GitHub Pages 배포 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
