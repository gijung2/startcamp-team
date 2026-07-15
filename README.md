# LocalHub

Vue 3와 Vue Router를 CDN으로 불러오는 서울 지역정보 커뮤니티입니다. Vite, npm 설치, 빌드 과정 없이 정적 서버에서 바로 실행할 수 있습니다.

## 실행 방법

VS Code에서 이 폴더를 열고 `index.html`을 우클릭한 뒤 **Open with Live Server**를 누르세요. 또는 프로젝트 폴더에서 아래 명령을 실행합니다.

```powershell
py -m http.server 5500
```

그다음 `http://localhost:5500/#/`로 접속합니다. `index.html`을 직접 더블클릭하지 말고 반드시 정적 서버로 실행하세요.

## 화면 주소

- 홈: `/#/`
- 지역정보: `/#/info`
- 지도: `/#/map`
- 커뮤니티: `/#/board`

Vue Router는 새로고침에 별도 서버 설정이 필요 없는 해시 방식을 사용합니다.

## 설정

`assets/js/config.local.js`에서 실행 환경을 설정합니다. 이 파일은 카카오 키 보호를 위해 Git에서 제외됩니다. 새 환경에서는 `config.example.js`를 `config.local.js`로 복사한 뒤 값을 입력하세요.

```js
window.LOCALHUB_CONFIG = {
  API_BASE_URL: '',
  USE_MOCK_API: true,
  KAKAO_MAP_KEY: '카카오_JavaScript_키',
}
```

- 샘플 모드: `USE_MOCK_API: true`
- 실제 백엔드: `API_BASE_URL` 입력 후 `USE_MOCK_API: false`
- 카카오 개발자 콘솔의 JavaScript SDK 도메인에 `http://localhost:5500` 등록

## 현재 팀 백엔드 연결

- 백엔드 기본 주소: `http://localhost:8000`
- 지역정보: `GET /api/places?category=&keyword=&page=`
- 지도: `GET /api/places/map?category=`
- 최근 글: `GET /api/community/recent`
- 게시글 목록·작성: `GET`, `POST /api/community`
- 게시글 상세·수정·삭제: `GET`, `PUT`, `DELETE /api/community/:id`

프론트의 장소·게시글 필드명은 `assets/js/api.js`에서 현재 FastAPI 응답 형식으로 변환됩니다. 댓글과 챗봇은 백엔드 API가 추가되기 전까지 실제 모드에서 안내 오류를 표시합니다. 현재 게시판 검색은 백엔드 구현에 따라 제목만 검색합니다. CDN과 카카오맵 사용에는 인터넷 연결이 필요합니다.

`assets/js/config.local.js`의 `KAKAO_MAP_KEY`에는 카카오 JavaScript 키를 입력해야 지도가 표시됩니다. 이 파일은 Git에 포함되지 않습니다.

## 파일 구조

```text
index.html
assets/css/style.css
assets/js/app.js
assets/js/api.js
assets/js/data.js
assets/js/config.example.js
assets/js/config.local.js  # Git 제외
src/styles.css
```
