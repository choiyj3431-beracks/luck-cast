import {
  FortuneFormInput,
  FortuneInsight,
  FortunePayload,
  FortunePeriod,
  FortunePoint,
} from "@/lib/fortune-types";

const KOREAN_PERIOD_LABEL: Record<FortunePeriod, string> = {
  daily: "일별",
  monthly: "월별",
  yearly: "연별",
};

const CATEGORY_META = [
  { key: "love", label: "애정", icon: "♡" },
  { key: "wealth", label: "재물", icon: "◌" },
  { key: "career", label: "직업", icon: "△" },
  { key: "health", label: "건강", icon: "□" },
] as const;

type CategoryKey = (typeof CATEGORY_META)[number]["key"];

const PERIOD_CONFIG: Record<
  FortunePeriod,
  { count: number; unitLabel: string; formatter: Intl.DateTimeFormatOptions }
> = {
  daily: { count: 7, unitLabel: "일", formatter: { month: "numeric", day: "numeric" } },
  monthly: { count: 6, unitLabel: "개월", formatter: { month: "short" } },
  yearly: { count: 5, unitLabel: "년", formatter: { year: "numeric" } },
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function seededUnit(seed: number, step: number, offset: number) {
  const x = Math.sin(seed * 0.0127 + step * 1.371 + offset * 2.193) * 10000;
  return x - Math.floor(x);
}

function clampScore(score: number) {
  return Math.max(20, Math.min(98, Math.round(score)));
}

function createLabels(period: FortunePeriod) {
  const config = PERIOD_CONFIG[period];
  const points: { date: string; label: string }[] = [];
  const base = new Date();

  for (let step = 0; step < config.count; step += 1) {
    const next = new Date(base);

    if (period === "daily") {
      next.setDate(base.getDate() + step);
    } else if (period === "monthly") {
      next.setMonth(base.getMonth() + step);
    } else {
      next.setFullYear(base.getFullYear() + step);
    }

    points.push({
      date: next.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("ko-KR", config.formatter).format(next),
    });
  }

  return points;
}

function buildFallbackChart(input: FortuneFormInput, period: FortunePeriod) {
  const seed = hashString(
    `${input.name}|${input.birthDate}|${input.birthTime}|${input.calendarType}|${input.gender}|${period}`,
  );

  return createLabels(period).map(({ date, label }, step): FortunePoint => {
    const wealth = clampScore(48 + step * 6 + seededUnit(seed, step, 1) * 28);
    const love = clampScore(42 + step * 5 + seededUnit(seed, step, 2) * 32);
    const career = clampScore(44 + step * 7 + seededUnit(seed, step, 3) * 25);
    const health = clampScore(52 + step * 4 + seededUnit(seed, step, 4) * 22);

    return {
      date,
      label,
      wealth,
      love,
      career,
      health,
    };
  });
}

function averageOf(points: FortunePoint[], key: CategoryKey) {
  return Math.round(points.reduce((sum, point) => sum + point[key], 0) / points.length);
}

function buildHighlights(points: FortunePoint[]): FortuneInsight[] {
  return CATEGORY_META.map(({ key, label, icon }) => {
    const score = averageOf(points, key);
    const tone =
      score >= 80
        ? "상승 흐름이 분명합니다."
        : score >= 65
          ? "균형이 좋고 기회가 열립니다."
          : "무리하지 않으면 충분히 안정적입니다.";

    return {
      id: key,
      label,
      score,
      note: tone,
      icon,
    };
  });
}

function periodCopy(period: FortunePeriod) {
  if (period === "daily") {
    return {
      headline: "오늘부터 일주일 흐름",
      actionLead: "가장 중요한 일정은 이 주간의 고점에 맞추세요.",
      caution: "감정 피로가 쌓이기 쉬운 날은 휴식과 속도 조절이 필요합니다.",
      luckyWindow: "오후 2시부터 5시 사이",
    };
  }

  if (period === "monthly") {
    return {
      headline: "향후 여섯 달의 흐름",
      actionLead: "자원을 분산하기보다 핵심 목표 한두 개에 집중할 때 효율이 높습니다.",
      caution: "중반부에는 인간관계나 계약에서 기준을 분명히 해야 합니다.",
      luckyWindow: "매달 둘째 주",
    };
  }

  return {
    headline: "앞으로 다섯 해의 흐름",
    actionLead: "한 해 단위의 테마가 분명해 장기 프로젝트와 커리어 포지셔닝에 유리합니다.",
    caution: "성과가 커질수록 생활 리듬과 체력 관리가 함께 따라와야 합니다.",
    luckyWindow: "상반기 출발 구간",
  };
}

function buildFallbackFortune(input: FortuneFormInput, period: FortunePeriod): FortunePayload {
  const chart = buildFallbackChart(input, period);
  const highlights = buildHighlights(chart);
  const top = [...highlights].sort((a, b) => b.score - a.score);
  const copy = periodCopy(period);
  const periodLabel = KOREAN_PERIOD_LABEL[period];

  return {
    period,
    headline: `${input.name || "사용자"}님의 ${periodLabel} 운세 예보`,
    summary: `${copy.headline}. ${top[0].label}과 ${top[1].label}이 상대적으로 강하게 나타나며, 중요한 선택은 흐름이 열리는 구간에 맞출수록 결과가 선명해집니다.`,
    actionPoint: `${copy.actionLead} 특히 ${top[0].label} 점수가 높게 형성되는 시점에 제안, 발표, 대화를 배치하는 편이 좋습니다.`,
    caution: copy.caution,
    luckyWindow: copy.luckyWindow,
    focusTags: [top[0].label, top[1].label, "균형 회복", "루틴 점검"],
    checklist: [
      `${top[0].label} 관련 핵심 결정을 한 번에 정리하기`,
      "이번 흐름에서 에너지를 빼앗는 약속 줄이기",
      "체력 저하 전에 수면과 식사 루틴 고정하기",
      "한 번 미뤘던 연락이나 제안을 이번 구간에 재개하기",
    ],
    highlights,
    chart,
    source: "fallback",
  };
}

function buildPrompt(input: FortuneFormInput, period: FortunePeriod) {
  const periodText =
    period === "daily"
      ? "오늘부터 7일"
      : period === "monthly"
        ? "이번 달부터 6개월"
        : "올해부터 5년";

  return [
    "너는 Luck Cast의 운세 시각화 엔진이다.",
    "사용자에게는 현대적이고 직관적인 조언만 보여주며, 설명은 짧고 선명해야 한다.",
    `사용자 이름: ${input.name || "사용자"}`,
    `생년월일: ${input.birthDate}`,
    `출생 시간: ${input.birthTime || "미상"}`,
    `달력 기준: ${input.calendarType === "solar" ? "양력" : "음력"}`,
    `성별: ${input.gender}`,
    `분석 기간: ${periodText}`,
    "응답은 반드시 JSON 스키마를 따르고, 점수는 0~100 정수여야 한다.",
    "운세 해석은 과장된 신비주의보다 행동 가능한 인사이트를 우선한다.",
  ].join("\n");
}

function fortuneSchema(pointCount: number) {
  return {
    type: "object",
    properties: {
      headline: { type: "string" },
      summary: { type: "string" },
      actionPoint: { type: "string" },
      caution: { type: "string" },
      luckyWindow: { type: "string" },
      focusTags: {
        type: "array",
        items: { type: "string" },
      },
      checklist: {
        type: "array",
        items: { type: "string" },
      },
      highlights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            score: { type: "integer" },
            note: { type: "string" },
            icon: { type: "string" },
          },
          required: ["id", "label", "score", "note", "icon"],
        },
      },
      chart: {
        type: "array",
        minItems: pointCount,
        maxItems: pointCount,
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            date: { type: "string" },
            wealth: { type: "integer" },
            love: { type: "integer" },
            career: { type: "integer" },
            health: { type: "integer" },
          },
          required: ["label", "date", "wealth", "love", "career", "health"],
        },
      },
    },
    required: [
      "headline",
      "summary",
      "actionPoint",
      "caution",
      "luckyWindow",
      "focusTags",
      "checklist",
      "highlights",
      "chart",
    ],
  };
}

function normalizePayload(payload: FortunePayload, period: FortunePeriod) {
  const pointCount = PERIOD_CONFIG[period].count;
  const chart = payload.chart.slice(0, pointCount).map((point) => ({
    ...point,
    wealth: clampScore(point.wealth),
    love: clampScore(point.love),
    career: clampScore(point.career),
    health: clampScore(point.health),
  }));

  return {
    ...payload,
    period,
    focusTags: payload.focusTags.slice(0, 4),
    checklist: payload.checklist.slice(0, 5),
    chart,
  };
}

async function requestGeminiFortune(
  input: FortuneFormInput,
  period: FortunePeriod,
): Promise<FortunePayload | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const pointCount = PERIOD_CONFIG[period].count;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(input, period) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: fortuneSchema(pointCount),
          temperature: 0.9,
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return null;
  }

  const parsed = JSON.parse(text) as Omit<FortunePayload, "period" | "source">;

  return normalizePayload(
    {
      ...parsed,
      period,
      source: "gemini",
    },
    period,
  );
}

export async function generateFortune(input: FortuneFormInput, period: FortunePeriod) {
  try {
    const geminiResult = await requestGeminiFortune(input, period);

    if (geminiResult) {
      return geminiResult;
    }
  } catch {
    return buildFallbackFortune(input, period);
  }

  return buildFallbackFortune(input, period);
}
