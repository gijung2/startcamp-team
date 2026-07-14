# LocalHub API 명세서

- 문서 버전: 1.0.0
- 작성일: 2026-07-14
- 대상 프론트엔드: Vue 3 CDN 버전 LocalHub
- 권장 백엔드: FastAPI
- 기본 개발 서버: `http://localhost:8000`
- API 공통 경로: `/api`

## 1. 목적과 연결 구조

LocalHub 프론트엔드는 DB에 직접 접속하지 않고 백엔드 REST API를 통해서만 데이터를 처리한다.

```text
Vue 프론트엔드 (http://localhost:5500)
               ↓ JSON HTTP 요청
백엔드 API (http://localhost:8000/api)
               ↓ ORM 또는 SQL
DB
```

프론트엔드 설정 파일 `assets/js/config.local.js`는 다음과 같이 지정한다.

```js
window.LOCALHUB_CONFIG = {
  API_BASE_URL: 'http://localhost:8000',
  USE_MOCK_API: false,
  KAKAO_MAP_KEY: '카카오_JavaScript_키',
}
```

`USE_MOCK_API`가 `true`이면 API를 호출하지 않고 브라우저의 샘플 데이터와 `localStorage`를 사용한다. 실제 연동 테스트에서는 반드시 `false`로 변경한다.

## 2. 공통 규칙

### 2.1 HTTP 및 데이터 형식

- 요청과 응답 본문은 JSON을 사용한다.
- 요청 헤더는 `Content-Type: application/json`을 사용한다.
- 문자 인코딩은 UTF-8을 사용한다.
- 날짜는 `YYYY-MM-DD` 형식의 문자열로 전달한다.
- ID는 양의 정수를 권장한다.
- JSON 필드명은 현재 프론트엔드와 일치하도록 `camelCase`를 사용한다.
- 응답에 비밀번호 또는 비밀번호 해시를 포함하면 안 된다.

### 2.2 API 목록

| 기능 | Method | 경로 | 성공 상태 |
|---|---:|---|---:|
| 지역정보 전체 조회 | GET | `/api/locations` | 200 |
| 게시글 목록·검색 | GET | `/api/posts` | 200 |
| 게시글 상세 조회 | GET | `/api/posts/{postId}` | 200 |
| 게시글 등록 | POST | `/api/posts` | 201 |
| 게시글 수정 | PUT | `/api/posts/{postId}` | 200 |
| 게시글 삭제 | DELETE | `/api/posts/{postId}` | 204 |
| 댓글 등록 | POST | `/api/posts/{postId}/comments` | 201 |
| 댓글 삭제 | DELETE | `/api/posts/{postId}/comments/{commentId}` | 204 |
| 챗봇 질문 | POST | `/api/chat` | 200 |

### 2.3 공통 오류 응답

프론트엔드는 `detail` 또는 `message` 필드를 화면에 표시한다. 모든 오류는 가능한 한 다음 형식으로 통일한다.

```json
{
  "detail": "비밀번호가 일치하지 않습니다."
}
```

| 상태 코드 | 의미 | 사용 예시 |
|---:|---|---|
| 400 | 잘못된 요청 | 빈 검색 조건, 올바르지 않은 카테고리 |
| 404 | 데이터 없음 | 존재하지 않는 게시글 또는 댓글 |
| 409 | 데이터 충돌 | 중복 데이터 등 |
| 422 | 입력값 검증 실패 | 필수값 누락, 글자 수 초과 |
| 500 | 서버 내부 오류 | DB 연결 실패 등 |
| 502 | 외부 서비스 오류 | GPT API 호출 실패 |

FastAPI 기본 422 응답은 `detail`이 배열로 내려올 수 있다. 프론트에 문장을 표시하려면 예외 처리기를 통해 다음처럼 문자열 메시지로 변환하는 것을 권장한다.

```json
{
  "detail": "제목을 입력해 주세요."
}
```

### 2.4 CORS

개발 환경에서 백엔드는 다음 Origin을 허용해야 한다.

```text
http://localhost:5500
http://127.0.0.1:5500
```

권장 설정:

- 허용 메서드: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- 허용 헤더: `Content-Type`
- 쿠키 기반 인증을 사용하지 않는 현재 구조에서는 credentials가 필수는 아니다.
- 운영 환경에서는 실제 프론트 배포 주소만 허용한다.

## 3. 카테고리 규칙

### 3.1 지역정보 카테고리

지역정보의 `type`은 반드시 다음 영문 코드 중 하나를 사용한다.

| 코드 | 화면 표시명 |
|---|---|
| `tourist` | 관광지 |
| `sports` | 레포츠 |
| `culture` | 문화시설 |
| `shopping` | 쇼핑 |
| `stay` | 숙박 |
| `course` | 여행코스 |
| `festival` | 축제공연행사 |

### 3.2 게시판 카테고리

현재 프론트엔드는 게시판 카테고리를 다음 한글 문자열로 전송한다.

```text
관광지
레포츠
문화시설
쇼핑
숙박
여행코스
축제공연행사
```

백엔드는 위 값만 허용하거나, 내부 코드로 변환하여 DB에 저장한 뒤 응답에서는 다시 한글 표시명으로 반환해야 한다.

## 4. 지역정보 API

### 4.1 지역정보 전체 조회

```http
GET /api/locations
```

현재 프론트엔드는 지역정보를 한 번에 받은 다음 브라우저에서 카테고리 필터, 검색, 페이지당 20개 처리를 수행한다. 따라서 이 API에는 현재 페이지 쿼리 파라미터가 없다.

#### 성공 응답

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "items": [
    {
      "id": 1,
      "name": "세종문화회관",
      "type": "culture",
      "lat": 37.5724,
      "lng": 126.9757,
      "address": "서울 종로구 세종대로 175",
      "desc": "다양한 공연과 전시가 열리는 문화예술 공간입니다.",
      "image": "https://example.com/images/sejong.jpg"
    }
  ]
}
```

프론트엔드는 배열만 반환되어도 처리할 수 있지만, API 형식 통일을 위해 `{ "items": [...] }` 형태를 권장한다.

#### 필드 정의

| 필드 | 타입 | 필수 | 설명 |
|---|---|---:|---|
| `id` | integer | O | 지역정보 고유 ID |
| `name` | string | O | 장소명 |
| `type` | string | O | 지역정보 카테고리 영문 코드 |
| `lat` | number | O | 위도, WGS84 |
| `lng` | number | O | 경도, WGS84 |
| `address` | string | O | 도로명 또는 지번 주소 |
| `desc` | string | O | 상세 팝업에서 표시할 설명 |
| `image` | string | O | 이미지의 HTTPS URL |

전화번호 필드는 프론트 화면에서 사용하지 않는다. 응답에 포함해도 무시되지만, 개인정보 및 불필요한 데이터 최소화를 위해 제외하는 것을 권장한다.

#### 오류 예시

```http
HTTP/1.1 500 Internal Server Error
```

```json
{
  "detail": "지역정보를 불러오지 못했습니다."
}
```

## 5. 게시판 API

### 5.1 게시글 목록 및 검색

```http
GET /api/posts?search=한강&category=관광지&page=1&size=10
```

#### 쿼리 파라미터

| 이름 | 타입 | 필수 | 기본값 | 규칙 |
|---|---|---:|---|---|
| `search` | string | X | 빈 문자열 | 제목과 내용만 검색 |
| `category` | string | X | `all` | `all` 또는 게시판 카테고리 한글명 |
| `page` | integer | X | `1` | 1 이상 |
| `size` | integer | X | `10` | 1 이상, 최대 100 권장 |

검색 대상은 반드시 `title`과 `content`만 사용한다. 작성자, 날짜, 조회수는 검색하지 않는다. 조회수 기능은 사용하지 않으므로 `views`, `viewCount` 같은 필드를 반환할 필요가 없다.

정렬은 최신 게시글이 먼저 오도록 권장한다.

```sql
ORDER BY created_at DESC, id DESC
```

#### 성공 응답

```json
{
  "items": [
    {
      "id": 15,
      "category": "관광지",
      "title": "한강공원 야경 후기",
      "author": "서울여행자",
      "content": "저녁에 방문했는데 야경이 좋았습니다.",
      "date": "2026-07-14"
    }
  ],
  "total": 1
}
```

`total`은 현재 페이지의 개수가 아니라 검색 및 카테고리 조건에 맞는 전체 게시글 개수다. 프론트는 `total / size`로 전체 페이지 수를 계산한다.

### 5.2 게시글 상세 조회

```http
GET /api/posts/{postId}
```

#### 경로 파라미터

| 이름 | 타입 | 설명 |
|---|---|---|
| `postId` | integer | 조회할 게시글 ID |

#### 성공 응답

```json
{
  "id": 15,
  "category": "관광지",
  "title": "한강공원 야경 후기",
  "author": "서울여행자",
  "content": "저녁에 방문했는데 야경이 좋았습니다.",
  "date": "2026-07-14",
  "comments": [
    {
      "id": 3,
      "author": "익명",
      "content": "정보 감사합니다.",
      "date": "2026-07-14"
    }
  ]
}
```

비밀번호와 비밀번호 해시는 절대 응답하지 않는다. `comments`가 없으면 `null` 대신 빈 배열 `[]`을 반환한다.

#### 없는 게시글

```http
HTTP/1.1 404 Not Found
```

```json
{
  "detail": "게시글을 찾을 수 없습니다."
}
```

### 5.3 게시글 등록

```http
POST /api/posts
Content-Type: application/json
```

#### 요청 본문

```json
{
  "category": "관광지",
  "title": "한강공원 야경 후기",
  "author": "서울여행자",
  "content": "저녁에 방문했는데 야경이 좋았습니다.",
  "password": "1234"
}
```

#### 검증 규칙

| 필드 | 타입 | 필수 | 권장 제한 |
|---|---|---:|---|
| `category` | string | O | 허용된 게시판 카테고리 |
| `title` | string | O | 공백 제외 1~100자 |
| `author` | string | O | 공백 제외 1~30자 |
| `content` | string | O | 공백 제외 1~5000자 |
| `password` | string | O | 4~12자 권장 |

백엔드는 문자열 양끝 공백을 제거하고, 제목과 작성자에는 HTML 태그를 허용하지 않는 것을 권장한다. 프론트가 전달한 비밀번호는 bcrypt 또는 Argon2로 해시하여 저장하고 평문은 폐기한다.

#### 성공 응답

```http
HTTP/1.1 201 Created
```

```json
{
  "id": 15,
  "category": "관광지",
  "title": "한강공원 야경 후기",
  "author": "서울여행자",
  "content": "저녁에 방문했는데 야경이 좋았습니다.",
  "date": "2026-07-14",
  "comments": []
}
```

프론트는 응답의 `id`를 사용하여 작성 완료 후 `/board/{id}` 화면으로 이동한다.

### 5.4 게시글 수정

```http
PUT /api/posts/{postId}
Content-Type: application/json
```

#### 요청 본문

```json
{
  "category": "문화시설",
  "title": "수정된 게시글 제목",
  "author": "서울여행자",
  "content": "수정된 게시글 내용입니다.",
  "password": "1234"
}
```

현재 프론트 구현상 상세 조회에서 받은 `id`, `date`, `comments` 같은 추가 필드가 요청에 포함될 가능성이 있다. 백엔드는 정의된 수정 필드만 사용하고 나머지 필드는 무시하도록 구현하는 것을 권장한다.

#### 처리 순서

1. `postId`로 게시글을 조회한다.
2. 게시글이 없으면 404를 반환한다.
3. 요청 비밀번호와 DB의 비밀번호 해시를 비교한다.
4. 비밀번호가 틀리면 400 또는 403을 반환한다.
5. 허용된 필드만 수정한다.
6. 수정된 게시글을 반환한다.

#### 성공 응답

```http
HTTP/1.1 200 OK
```

```json
{
  "id": 15,
  "category": "문화시설",
  "title": "수정된 게시글 제목",
  "author": "서울여행자",
  "content": "수정된 게시글 내용입니다.",
  "date": "2026-07-14",
  "comments": []
}
```

#### 비밀번호 불일치

```http
HTTP/1.1 403 Forbidden
```

```json
{
  "detail": "비밀번호가 일치하지 않습니다."
}
```

### 5.5 게시글 삭제

```http
DELETE /api/posts/{postId}
Content-Type: application/json
```

#### 요청 본문

```json
{
  "password": "1234"
}
```

현재 프론트는 DELETE 요청 본문으로 비밀번호를 전송한다. 백엔드는 해당 본문을 읽을 수 있도록 구현해야 한다.

#### 성공 응답

```http
HTTP/1.1 204 No Content
```

응답 본문은 없다. 게시글 삭제 시 해당 게시글의 댓글도 함께 삭제한다.

#### 오류

- 게시글 없음: `404 Not Found`
- 비밀번호 불일치: `403 Forbidden`

## 6. 댓글 API

### 6.1 댓글 등록

```http
POST /api/posts/{postId}/comments
Content-Type: application/json
```

#### 요청 본문

```json
{
  "author": "익명",
  "content": "정보 감사합니다.",
  "password": "1234"
}
```

#### 검증 규칙

| 필드 | 타입 | 필수 | 권장 제한 |
|---|---|---:|---|
| `author` | string | O | 1~30자 |
| `content` | string | O | 1~1000자 |
| `password` | string | O | 4~12자 권장 |

#### 성공 응답

```http
HTTP/1.1 201 Created
```

```json
{
  "id": 3,
  "author": "익명",
  "content": "정보 감사합니다.",
  "date": "2026-07-14"
}
```

프론트는 반환된 댓글을 기존 댓글 배열 끝에 추가한다.

#### 오류

- 부모 게시글 없음: `404 Not Found`
- 입력값 검증 실패: `422 Unprocessable Entity`

### 6.2 댓글 삭제

```http
DELETE /api/posts/{postId}/comments/{commentId}
Content-Type: application/json
```

#### 요청 본문

```json
{
  "password": "1234"
}
```

#### 성공 응답

```http
HTTP/1.1 204 No Content
```

응답 본문은 없다.

#### 오류

- 게시글 또는 댓글 없음: `404 Not Found`
- 비밀번호 불일치: `403 Forbidden`

댓글 삭제 시 `commentId`가 반드시 `postId`에 속한 댓글인지 확인해야 한다.

## 7. 챗봇 API

### 7.1 질문 전송

```http
POST /api/chat
Content-Type: application/json
```

#### 요청 본문

```json
{
  "message": "종로구에서 갈 만한 문화시설을 추천해줘",
  "history": [
    {
      "role": "assistant",
      "text": "안녕하세요! LocalHub 지역정보 안내입니다."
    },
    {
      "role": "user",
      "text": "종로구에 갈 예정이야."
    }
  ]
}
```

#### 필드 정의

| 필드 | 타입 | 필수 | 설명 |
|---|---|---:|---|
| `message` | string | O | 현재 사용자의 질문 |
| `history` | array | X | 이전 대화 목록, 기본값 빈 배열 |
| `history[].role` | string | O | `user` 또는 `assistant` |
| `history[].text` | string | O | 대화 내용 |

현재 프론트의 대화 이력 필드는 OpenAI API의 `content`가 아니라 `text`다. 백엔드는 GPT API를 호출할 때 `text`를 `content`로 변환한다.

#### 성공 응답

```http
HTTP/1.1 200 OK
```

```json
{
  "message": "종로구에서는 세종문화회관과 국립현대미술관 서울관을 추천합니다."
}
```

프론트는 `message`를 우선 사용한다. 호환을 위해 `answer` 또는 `content`도 읽을 수 있지만 공식 응답 필드는 `message`로 통일한다.

#### 오류 예시

```http
HTTP/1.1 502 Bad Gateway
```

```json
{
  "detail": "챗봇 응답을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."
}
```

#### 보안 및 운영 규칙

- OpenAI API 키는 백엔드 환경변수에만 저장한다.
- API 키를 프론트 JavaScript나 Git 저장소에 넣지 않는다.
- 빈 질문을 거부한다.
- 질문 길이와 대화 이력 개수를 제한한다.
- 시스템 프롬프트는 서버에서 관리한다.
- 사용자 입력을 로그에 저장할 경우 개인정보가 포함되지 않도록 주의한다.
- 요청 횟수 제한을 적용하는 것을 권장한다.

## 8. 권장 DB 구조

실제 테이블명과 타입은 사용하는 DB에 맞게 변경할 수 있다.

### 8.1 locations

| 컬럼 | 권장 타입 | 제약 조건 |
|---|---|---|
| `id` | BIGINT 또는 INTEGER | PK |
| `name` | VARCHAR(200) | NOT NULL |
| `type` | VARCHAR(30) | NOT NULL, 카테고리 검사 |
| `latitude` | DECIMAL(10,7) | NOT NULL |
| `longitude` | DECIMAL(10,7) | NOT NULL |
| `address` | VARCHAR(500) | NOT NULL |
| `description` | TEXT | NOT NULL |
| `image_url` | TEXT | NOT NULL |
| `created_at` | DATETIME | NOT NULL |
| `updated_at` | DATETIME | NOT NULL |

API 응답을 만들 때 `latitude → lat`, `longitude → lng`, `description → desc`, `image_url → image`로 변환한다.

### 8.2 posts

| 컬럼 | 권장 타입 | 제약 조건 |
|---|---|---|
| `id` | BIGINT 또는 INTEGER | PK |
| `category` | VARCHAR(30) | NOT NULL |
| `title` | VARCHAR(100) | NOT NULL |
| `author` | VARCHAR(30) | NOT NULL |
| `content` | TEXT | NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `created_at` | DATETIME | NOT NULL |
| `updated_at` | DATETIME | NOT NULL |

조회수 컬럼은 요구사항에 없으므로 만들지 않아도 된다.

### 8.3 comments

| 컬럼 | 권장 타입 | 제약 조건 |
|---|---|---|
| `id` | BIGINT 또는 INTEGER | PK |
| `post_id` | BIGINT 또는 INTEGER | FK → posts.id, ON DELETE CASCADE |
| `author` | VARCHAR(30) | NOT NULL |
| `content` | VARCHAR(1000) 또는 TEXT | NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `created_at` | DATETIME | NOT NULL |

`post_id`에는 인덱스를 생성한다.

## 9. 백엔드 구현 체크리스트

### 공통

- [ ] `/api` 경로로 라우터 구성
- [ ] JSON UTF-8 응답
- [ ] 프론트 개발 주소 CORS 허용
- [ ] 공통 오류 응답을 `{ "detail": "문장" }`으로 통일
- [ ] 운영 DB 접속 정보와 외부 API 키를 환경변수로 관리

### 지역정보

- [ ] `GET /api/locations` 구현
- [ ] 좌표를 숫자 타입으로 응답
- [ ] `type` 값을 지정된 영문 코드로 변환
- [ ] 이미지가 없을 때 사용할 기본 이미지 결정

### 게시판

- [ ] 목록 조회 및 페이지네이션 구현
- [ ] 검색 대상을 제목과 내용으로 제한
- [ ] 카테고리 필터 구현
- [ ] 최신순 정렬 구현
- [ ] 상세 응답에 댓글 배열 포함
- [ ] 등록·수정·삭제 구현
- [ ] 비밀번호 해시 저장과 검증 구현
- [ ] 응답에서 비밀번호 관련 필드 제외

### 댓글

- [ ] 댓글 등록·삭제 구현
- [ ] 댓글 비밀번호 해시 저장
- [ ] 게시글 삭제 시 댓글 연쇄 삭제
- [ ] 댓글이 해당 게시글에 속하는지 검증

### 챗봇

- [ ] `POST /api/chat` 구현
- [ ] `history[].text`를 GPT 메시지의 `content`로 변환
- [ ] GPT API 키를 서버 환경변수에 저장
- [ ] 요청 길이 제한과 오류 처리 적용

## 10. 프론트·백엔드 통합 테스트 순서

1. 백엔드를 `http://localhost:8000`에서 실행한다.
2. Swagger 또는 Postman에서 각 API를 단독 테스트한다.
3. 프론트 `config.local.js`의 `API_BASE_URL`을 설정한다.
4. `USE_MOCK_API`를 `false`로 변경한다.
5. 프론트를 `http://localhost:5500`에서 실행한다.
6. 지역정보 목록과 카카오맵 마커를 확인한다.
7. 게시글을 등록하고 DB에 저장됐는지 확인한다.
8. 브라우저를 새로고침해도 게시글이 유지되는지 확인한다.
9. 제목 검색과 내용 검색이 모두 작동하는지 확인한다.
10. 작성자 검색으로는 결과가 나오지 않는지 확인한다.
11. 올바른 비밀번호와 틀린 비밀번호로 수정·삭제를 각각 테스트한다.
12. 댓글 등록과 삭제를 테스트한다.
13. 챗봇 질문과 오류 상황을 테스트한다.
14. 브라우저 개발자 도구 Network 탭에서 상태 코드와 JSON 응답을 확인한다.

## 11. 완료 기준

다음 조건을 모두 만족하면 프론트·백엔드·DB 연동이 완료된 것으로 본다.

- 샘플 모드를 끈 상태에서 모든 화면이 백엔드 데이터를 표시한다.
- 게시글과 댓글이 새로고침 후에도 DB에 유지된다.
- 게시글 검색은 제목과 내용에만 적용된다.
- 조회수와 지역정보 전화번호가 화면 및 필수 API 규격에 없다.
- 지역정보는 프론트에서 페이지당 최대 20개, 데스크톱에서 한 줄 4개로 표시된다.
- 잘못된 비밀번호와 없는 데이터에 대해 사용자에게 명확한 오류가 표시된다.
- GPT API 키와 DB 접속 정보가 프론트 또는 Git에 노출되지 않는다.
