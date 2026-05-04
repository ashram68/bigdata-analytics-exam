# 빅데이터 분석기사 실기 모의고사

도서 구매자 전용 학습 서비스 — Python(Colab) 트랙 정적 웹.

## 구조

- `index.html` — 라우터: 모바일/PC 분기 + 인증 상태 분기
- `mobile.html` — 모바일 안내 (PC 접속 유도)
- `auth.html` — 페이지 챌린지 인증 (30개 페이지 중 1개 랜덤 표시 → 해당 페이지 인쇄 코드 6자리 입력 → 페이지별 SHA-256 1:1 검증)
- `lobby.html` — 10회차 카드 그리드 + 1·2·3유형 진입
- `viewer.html` — 정답·해설 뷰어
- `data/exams.json` — 회차·유형 메타데이터
- `data/codes.json` — 인증 코드 페이지별 SHA-256 해시 (`page_codes{}` 객체, 페이지번호 → 해시)
- `data/exam-N/` — 회차별 문제 노트북 + 정답 해설 + (6회 이후) 외부 CSV 데이터셋
  - 1~5회: 라이브러리 내장 데이터셋 사용 (`seaborn`, `sklearn.datasets`)
  - 6·7회: 단일 외부 CSV (`titanic.csv` / `heart_disease_uci.csv`) 호스팅 + 노트북 BASE URL fetch
  - 8·9·10회: train/test/test_answer.csv 분리 (실제 시험 형식, 작업형 2 result.csv 제출)

## 사용자 플로우

1. **모바일** → `mobile.html`: PC 접속 안내 + 카카오톡/URL 복사
2. **PC** → `auth.html`: 화면에 표시된 도서 페이지 번호의 인쇄 코드 6자리 입력 (페이지 챌린지)
3. **인증 성공** → `lobby.html`: 10회차 카드 + 1·2·3유형 분리 진입
4. **유형 클릭** → Google Colab 노트북 열기 (별도 탭)
5. **풀이 후** → `viewer.html`: 정답·해설 확인 + 자가채점

## 기술 스택

HTML5 + CSS3 + Vanilla JS (프레임워크 없음). 정적 사이트, Vercel 자동 배포.
백엔드/DB 없음, 모든 상태는 localStorage 에 저장.

## 시험 사양

- 회차: 10회 / 회차당 6~7문항 (3유형 구조에 따라 가변)
- 유형 구성: 작업형 1·2·3유형 분리
  - 1유형: 데이터 전처리 (3문항 × 10점 = 30점, `print()` 제출)
  - 2유형: ML 모델링 (1문항 × 40점 = 40점, 1~6회 `print()` / 7회 이후 `result.csv` 제출)
  - 3유형: 통계 분석 (회차별 2문항 × 15점 또는 3문항 × 10점 = 30점, `print()` 제출)
- 합격선: 60점 / 100점
- 제한 시간: 180분
- 시험 환경: 폐쇄형 (외부 문서 검색 없음, `help()` 함수만 허용)
- 데이터 로드 (회차별 다름):
  - 1~5회: 라이브러리 내장 (`seaborn`, `sklearn.datasets`)
  - 6·7회: 사이트 호스팅 단일 CSV → 노트북 BASE URL fetch
  - 8·9·10회: train/test/test_answer.csv 분리 (실제 시험 형식)

## R 트랙

1차 출시에는 미포함. Python 운영 안정화 후 2차에서 검토 예정.
