# Luck Cast: AI 하이브리드 운세 웹앱 기획서

## 1. 프로젝트 개요
* **프로젝트명:** Luck Cast (럭 캐스트) - "당신의 운을 예보합니다"
* **핵심 컨셉:** 복잡한 명리학/토정비결 원본은 백엔드에서 숨기고, 프론트엔드에는 오직 직관적인 '미래 운세 점수, 멀티 라인 그래프, AI 요약 해석'만 제공하는 일기예보 스타일의 운세 대시보드 웹앱.
* **타겟 사용자:** 직관적이고 시각적인 데이터로 자신의 운세 흐름을 관리하고 싶은 사용자.

## 2. 핵심 기능 및 데이터 플로우 (Data Flow)

### 2.1. 백엔드 데이터 처리 (Hidden Process)
* 프론트엔드에서 생년월일시를 입력받으면 백엔드(또는 Next.js API Route)에서 만세력 라이브러리를 통해 사주 팔자, 대운, 세운, 일진 등의 원본 데이터를 추출.
* 이 원본 데이터를 Gemini API로 전송 (사용자에게는 노출 안 됨).

### 2.2. 프론트엔드 노출 영역 (User Facing)
* **운세 스코어링 그래프:** 재물, 애정, 직업, 건강 4대 카테고리에 대한 미래(일/월/년) 운세를 0~100점 척도의 꺾은선 그래프로 표시.
* **핵심 요약 해석:** 길고 복잡한 풀이 대신, "내일의 핵심 액션", "이번 달 주의점" 등을 짧은 문장으로 제공.

## 3. 기술 스택 및 아키텍처 (Vibe Coding)

### 3.1. Frontend & Visualization
* **Framework:** Next.js (React) - Vercel 배포.
* **Chart Library:** Recharts 또는 Chart.js (Gemini가 반환한 JSON 데이터를 바로 주입).

### 3.2. Backend & AI Engine (Gemini JSON Mode)
* **API Route:** Next.js 내부 API Route 사용.
* **AI Model:** Gemini 1.5 Pro API.
* **[중요] Structured Output:** API 호출 시 `response_mime_type: "application/json"`을 설정하여 프론트엔드가 바로 파싱할 수 있게 구현.

#### 💡 Gemini Prompt 엔지니어링 예시 (System Instruction)
```json
// 프롬프트: "다음 제공되는 사주 원국과 2026년 4월의 만세력 데이터를 바탕으로, 
// 4월 1일부터 7일까지의 일별 운세를 분석해 줘. 
// 반드시 아래의 JSON 스키마 형식으로만 답변할 것."

// 기대하는 Gemini 출력값 (JSON)
{
  "monthly_summary": "재물운이 상승 곡선을 그리는 주간입니다. 특히 4일경 뜻밖의 수익이 예상됩니다.",
  "daily_scores": [
    { "date": "2026-04-01", "wealth": 60, "love": 70, "career": 80, "health": 50 },
    { "date": "2026-04-02", "wealth": 65, "love": 60, "career": 85, "health": 55 },
    // ... 
    { "date": "2026-04-04", "wealth": 95, "love": 80, "career": 90, "health": 70 }
  ],
  "action_point": "4월 4일(재물운 95점): 중요한 투자 결정이나 계약을 진행하기 가장 좋은 날입니다."
}
```

## 4. 사용자 경험 (UX) 흐름
1. **입력:** 정보 입력.
2. **로딩:** "오늘의 운을 분석 중입니다..." (이때 백엔드에서 사주 연산 -> Gemini JSON 변환 발생).
3. **결과:** JSON 데이터를 바탕으로 화려한 애니메이션과 함께 운세 그래프 렌더링. 하단에 AI의 직관적인 해석(Action Point) 노출.
