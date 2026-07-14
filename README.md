# LocalHub 멀티 파일 버전

## 폴더 구조

```text
localhub-multi-file/
├─ index.html
└─ assets/
   ├─ css/
   │  └─ style.css
   └─ js/
      ├─ tailwind-config.js
      └─ app.js
```

## 파일 역할

- `index.html`: 화면 마크업과 외부 라이브러리 로드
- `assets/css/style.css`: LocalHub 사용자 정의 CSS
- `assets/js/tailwind-config.js`: Tailwind 색상·폰트 설정
- `assets/js/app.js`: Vue 상태, 필터, 페이징, 커뮤니티, 지도, 챗봇 로직

## 실행 방법

HTML 파일을 직접 더블클릭하는 것보다 로컬 서버로 실행하는 것이 안전합니다.

### VS Code Live Server

1. 폴더를 VS Code에서 엽니다.
2. `index.html`을 우클릭합니다.
3. `Open with Live Server`를 선택합니다.

### Python 서버

프로젝트 폴더에서 아래 명령을 실행합니다.

```bash
python -m http.server 5500
```

브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:5500
```

## Kakao Maps 설정

`assets/js/app.js`에서 아래 값을 찾습니다.

```javascript
const KAKAO_MAP_APP_KEY = 'YOUR_KAKAO_JAVASCRIPT_KEY';
```

카카오 개발자 콘솔의 JavaScript 키로 교체하고, 실행 도메인에
`http://localhost:5500`을 등록합니다.
