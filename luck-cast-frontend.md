# Luck Cast: 백엔드 핵심 로직 (Python + Gemini API)

이 문서는 `Luck Cast`의 백엔드에서 만세력 라이브러리와 Gemini API를 결합하여 프론트엔드용 JSON 데이터를 생성하는 핵심 파이프라인 코드입니다. Vercel의 Serverless Function(Python)이나 FastAPI 환경에서 바로 응용할 수 있습니다.

## 1. 필요 라이브러리
Python 환경에서는 날짜 연산에 강한 패키지들과 Gemini 공식 SDK가 필요합니다.
```bash
pip install google-generativeai
pip install korean-lunar-calendar # 양음력 변환용 (또는 만세력 전용 라이브러리)
```

## 2. 코어 로직: `luck_engine.py`

바이브 코딩 시 AI(Claude/Gemini)에게 이 구조를 던져주면, `get_saju_palja` 같은 빈 함수를 실제 작동하는 만세력 계산 코드로 완벽하게 채워줄 것입니다.

```python
import os
import json
import google.generativeai as genai

# 가상의 사주/만세력 변환 함수 (AI에게 이 부분의 구현을 지시하면 됩니다)
def get_saju_palja(year, month, day, time):
    # 실제로는 여기서 korean-lunar-calendar 등을 사용해 정확한 간지를 도출합니다.
    # 예시 반환값: "임술년 을사월 신해일 계사시"
    return "壬戌年 乙巳月 辛亥日 癸巳時" 

# Gemini API 키 설정
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

def generate_luck_cast_data(birth_year, birth_month, birth_day, birth_time):
    # 1단계: 만세력 라이브러리로 정확한 명리학 데이터 추출 (계산)
    saju_data = get_saju_palja(birth_year, birth_month, birth_day, birth_time)
    
    # 2단계: Gemini API 모델 설정 (JSON 출력 강제 설정이 핵심입니다)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-pro",
        generation_config={"response_mime_type": "application/json"}
    )
    
    # 3단계: 시스템 프롬프트 작성 (해석 및 스코어링 지시)
    prompt = f"""
    너는 'Luck Cast'라는 운세 앱의 코어 엔진이야.
    사용자의 사주 원국은 다음과 같아: {saju_data}
    
    이 데이터를 바탕으로 내일(2026년 4월 18일)부터 3일간의 운세를 분석해서 
    반드시 아래의 JSON 형식으로만 답변해 줘. 
    점수는 0~100점 사이로, 해석은 현대적이고 직관적인 문장으로 작성해.
    
    {{
      "summary": "전체적인 3일간의 흐름 요약",
      "daily_scores": [
        {{
          "date": "2026-04-18",
          "wealth": 80,
          "love": 60,
          "career": 75,
          "health": 90,
          "action_point": "컨디션이 최고조에 달하는 날. 중요한 프로젝트 기획을 이때 시작하세요."
        }}
      ]
    }}
    """
    
    # 4단계: Gemini에게 질의 및 JSON 결과 반환
    response = model.generate_content(prompt)
    
    # 프론트엔드로 바로 전송할 수 있는 JSON 텍스트를 반환합니다.
    return response.text

# 테스트 실행 예시
if __name__ == "__main__":
    # 입력값: 1982년 5월 8일 오전 9시
    result_json = generate_luck_cast_data(1982, 5, 8, "09:00")
    print(result_json)
```

## 3. 작동 원리 요약 및 연동 포인트
1. **계산의 외주화:** 날짜와 시간에 따른 정확한 한자(간지) 변환은 검증된 Python 로직이 담당하여 오차를 없앱니다.
2. **해석의 AI화:** 변환된 한자(간지)를 보고 운세 점수를 매기고, 직관적인 조언(`action_point`)을 작성하는 것은 Gemini가 담당합니다.
3. **JSON 파이프라인:** Gemini의 결과물이 완벽한 JSON 스트링으로 도출되므로, Next.js 프론트엔드는 이 값을 받아 Recharts에 바로 렌더링하면 됩니다.
