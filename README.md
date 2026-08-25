# 오늘의 병 v9 — AI Wine Admin

## 새로 추가된 것

### /admin.html
관리자용 Wine Curator 화면입니다.

흐름:
1. 와인 이름 / 출처 URL / 원문 설명 입력
2. `AI로 분석하기`
3. AI가 추천엔진 속성 1~5 + 태그 + 설명으로 구조화
4. 관리자가 직접 수정/검수
5. `검수 완료` 체크 후 DB 저장
6. 사용자 앱 `/`가 `/api/wines`에서 승인 와인을 불러와 기존 샘플 100종에 자동 합칩니다.

### API
- `POST /api/admin/analyze-wine` : OpenAI 분석
- `GET/POST/PATCH /api/admin/wines` : 관리자 Wine DB
- `GET /api/wines` : 사용자 추천 엔진용 승인 Wine DB

## Vercel 환경 변수

- `DATABASE_URL`
- `ADMIN_KEY`
- `OPENAI_API_KEY`
- `OPENAI_WINE_MODEL` (선택, 기본 `gpt-5.6-luna`)

OpenAI API 키와 ADMIN_KEY는 절대 HTML/GitHub에 직접 넣지 마세요.

## DB 업데이트

기존 DB를 이미 만들었다면 `db/schema.sql`에서 새 `wines` 테이블 부분을 SQL Editor에서 실행하세요.
처음 만드는 프로젝트라면 schema.sql 전체를 실행해도 됩니다.

## 중요한 설계

AI가 웹 URL을 임의로 읽었다고 주장하지 않도록 했습니다.
`source_url`은 출처 기록용이고, AI 판단의 근거는 관리자가 붙여넣은 `source_text`입니다.
실제 상품 정보(가격/빈티지/수입사 등)는 반드시 출처와 대조해 검수한 뒤 `verified`로 승인하세요.

현재 사용자 앱에는 기존 100종 샘플도 남아 있습니다.
승인된 DB 와인이 생기면 샘플과 합쳐 추천 후보가 증가합니다.
