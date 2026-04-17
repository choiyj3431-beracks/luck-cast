import {
  FortuneFormInput,
  FortuneInsight,
  FortunePick,
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

function bestCategory(points: FortunePoint[]) {
  const ranked = [...CATEGORY_META]
    .map(({ key, label }) => ({ key, label, score: averageOf(points, key) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0];
}

function buildLuckyNumbers(seed: number) {
  const numbers = new Set<number>();
  let step = 0;

  while (numbers.size < 4) {
    const value = 1 + Math.floor(seededUnit(seed, step, 8) * 45);
    numbers.add(value);
    step += 1;
  }

  return [...numbers].sort((a, b) => a - b).join(", ");
}

function buildPicks(input: FortuneFormInput, period: FortunePeriod, chart: FortunePoint[]): FortunePick[] {
  const anchor = chart[0];
  const top = bestCategory(chart);
  const seed = hashString(`${input.name}|${period}|${anchor.date}|${top.key}`);
  const coffeeByMood = [
    ["드립 커피", "속도를 높이기보다 판단을 또렷하게 가져가는 편이 맞습니다."],
    ["콜드브루", "감정 소모를 줄이고 집중력만 길게 끌고 가는 흐름입니다."],
    ["바닐라 라테", "사람을 만나는 자리에 부드러운 첫인상이 더 잘 먹힙니다."],
    ["에스프레소", "짧고 강한 결정을 내려야 할 때 추진력이 붙습니다."],
  ] as const;
  const drinkByMood = [
    ["하이볼", "길게 늘어지는 자리보다 가볍고 선명한 템포가 어울립니다."],
    ["레드와인", "관계와 분위기를 천천히 끌어올리는 쪽이 유리합니다."],
    ["위스키 온더록스", "혼자 생각을 정리하는 밤에 잘 맞는 무드입니다."],
    ["논알코올 맥주", "오늘은 과열보다 컨디션 보존이 결과를 지킵니다."],
  ] as const;
  const oneLiners = {
    love: "밀어붙이는 날이 아니라, 답장을 끌어내는 날.",
    wealth: "감으로 지르기보다 타이밍을 잡아먹는 날.",
    career: "말을 아끼기보다 첫 문장을 선점해야 하는 날.",
    health: "버티는 힘보다 회복 속도가 성과를 가르는 날.",
  } as const;
  const actions = {
    love: "먼저 한 줄 연락 보내기",
    wealth: "보류하던 결제 기준 다시 세우기",
    career: "중요 메시지 오전 안에 발송하기",
    health: "카페인과 수면 시간 먼저 정리하기",
  } as const;
  const coffee = coffeeByMood[seed % coffeeByMood.length];
  const drink = drinkByMood[(seed + 1) % drinkByMood.length];

  return [
    {
      id: "one-line",
      label: "오늘의 한 줄",
      value: oneLiners[top.key],
      description: `${top.label} 흐름이 가장 강하게 올라와 있습니다.`,
    },
    {
      id: "lucky-numbers",
      label: period === "daily" ? "오늘의 행운 숫자" : "이번 흐름의 행운 숫자",
      value: buildLuckyNumbers(seed),
      description: "가벼운 재미 요소로만 보고, 결정은 현실 기준으로 가져가세요.",
    },
    {
      id: "drink",
      label: period === "daily" ? "오늘의 술" : "이번 흐름의 술",
      value: drink[0],
      description: drink[1],
    },
    {
      id: "coffee",
      label: period === "daily" ? "오늘의 커피" : "이번 흐름의 커피",
      value: coffee[0],
      description: coffee[1],
    },
    {
      id: "action",
      label: "오늘의 액션",
      value: actions[top.key],
      description: `${top.label} 점수가 높을 때 가장 바로 체감되는 행동입니다.`,
    },
  ];
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
  const picks = buildPicks(input, period, chart);
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
    picks,
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
    "문체는 자극적이되 싸구려처럼 보이면 안 된다.",
    "한 줄 카피는 사용자가 캡처해서 공유하고 싶을 정도로 강한 문장이어야 한다.",
    "좋은 예시는 '오늘은 버티는 날이 아니라 선점하는 날', '답장을 기다리는 날이 아니라 반응을 끌어내는 날' 같은 톤이다.",
    "문장은 예언자처럼 단정하지 말고, 행동을 부추기는 세련된 카피처럼 작성한다.",
    "picks 항목은 특히 구체적이고 감각적이어야 하며, '오늘의 술', '오늘의 커피', '오늘의 액션'은 바로 떠오르는 장면이 있어야 한다.",
    "행운 숫자는 로또 당첨 보장처럼 쓰지 말고, 재미 요소라는 뉘앙스를 유지한다.",
    "summary, actionPoint, caution도 평범한 상담문처럼 늘어놓지 말고 첫 문장부터 긴장감 있게 쓴다.",
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
      headline: {
        type: "string",
        description: "짧고 강한 제목. 사용자가 바로 시선을 멈추게 하는 운세 헤드라인.",
      },
      summary: {
        type: "string",
        description: "평범한 상담문이 아닌, 첫 문장부터 긴장감 있는 운세 요약.",
      },
      actionPoint: {
        type: "string",
        description: "지금 당장 행동하고 싶게 만드는 선명한 액션 문장.",
      },
      caution: {
        type: "string",
        description: "겁주기보다 감각적으로 경고하는 주의 포인트.",
      },
      luckyWindow: {
        type: "string",
        description: "행동 타이밍이 떠오르게 만드는 짧은 시간 표현.",
      },
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
      picks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            value: { type: "string" },
            description: {
              type: "string",
              description: "공유 가능한 톤의 짧고 자극적인 설명. 감각적인 장면이 떠올라야 한다.",
            },
          },
          required: ["id", "label", "value", "description"],
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
      "picks",
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
    picks: payload.picks?.slice(0, 5) ?? buildPicks(defaultInputForNormalization, period, chart),
    chart,
  };
}

const defaultInputForNormalization: FortuneFormInput = {
  name: "사용자",
  birthDate: "1990-01-01",
  birthTime: "09:00",
  calendarType: "solar",
  gender: "other",
};

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

  const normalized = normalizePayload(
    {
      ...parsed,
      period,
      source: "gemini",
    },
    period,
  );

  if (!normalized.picks.length) {
    normalized.picks = buildPicks(input, period, normalized.chart);
  }

  return normalized;
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
