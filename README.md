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

Vue Router는 History 방식을 사용하며, Netlify의 SPA rewrite 설정은 `netlify.toml`에 포함되어 있습니다.

## 설정

배포용 백엔드 주소는 Git에 포함되는 `assets/js/config.deploy.js`에서 설정합니다.

```js
window.LOCALHUB_CONFIG = {
  API_BASE_URL: 'https://fastapi-project-xadk.onrender.com',
  USE_MOCK_API: false,
}
```

Netlify 배포 설정의 Environment variables에 아래 항목을 등록합니다.

```text
OPENWEATHER_API_KEY=OpenWeather API 키
OPENAI_API_KEY=OpenAI API 키
KAKAO_MAP_KEY=카카오 JavaScript 키
```

날씨와 챗봇은 Netlify Functions가 외부 API를 호출하므로 비밀 키가 브라우저 코드에 포함되지 않습니다. 카카오 JavaScript 키는 지도 SDK 실행을 위해 브라우저에 전달되며, 카카오 개발자 콘솔에서 실제 Netlify 도메인을 허용해야 합니다.

## 현재 팀 백엔드 연결

- 백엔드 기본 주소: `https://fastapi-project-xadk.onrender.com`
- 지역정보: `GET /api/places?category=&keyword=&page=`
- 지도: `GET /api/places/map?category=`
- 최근 글: `GET /api/community/recent`
- 게시글 목록·작성: `GET`, `POST /api/community`
- 게시글 상세·수정·삭제: `GET`, `PUT`, `DELETE /api/community/:id`

프론트의 장소·게시글 필드명은 `assets/js/api.js`에서 현재 FastAPI 응답 형식으로 변환됩니다. 현재 게시판 검색은 백엔드 구현에 따라 제목만 검색합니다. CDN과 카카오맵 사용에는 인터넷 연결이 필요합니다.

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
