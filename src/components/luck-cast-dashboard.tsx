"use client";

import { FortuneChart } from "@/components/fortune-chart";
import { FortuneFormInput, FortunePayload, FortunePeriod } from "@/lib/fortune-types";
import {
  Activity,
  BriefcaseBusiness,
  Compass,
  HeartHandshake,
  LoaderCircle,
  Sparkles,
  Star,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const ONE_LINE_TONE_LABEL: Record<"sharp" | "seductive" | "cool", string> = {
  sharp: "Sharp",
  seductive: "Seductive",
  cool: "Cool",
};

const PERIOD_TABS: Array<{ value: FortunePeriod; label: string; hint: string }> = [
  { value: "daily", label: "일별", hint: "오늘부터 7일" },
  { value: "monthly", label: "월별", hint: "향후 6개월" },
  { value: "yearly", label: "연별", hint: "앞으로 5년" },
];

const defaultForm: FortuneFormInput = {
  name: "사랑사람",
  birthDate: "1994-09-18",
  birthTime: "09:00",
  calendarType: "solar",
  gender: "other",
};

const categoryIconMap = {
  love: HeartHandshake,
  wealth: Sparkles,
  career: BriefcaseBusiness,
  health: Activity,
} as const;

function sourceLabel(source: FortunePayload["source"]) {
  return source === "gemini" ? "Gemini 분석" : "로컬 예측";
}

async function requestFortune(
  nextPeriod: FortunePeriod,
  nextForm: FortuneFormInput,
): Promise<FortunePayload> {
  const response = await fetch("/api/fortune", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...nextForm,
      period: nextPeriod,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error || "운세를 불러오지 못했습니다.");
  }

  return (await response.json()) as FortunePayload;
}

export function LuckCastDashboard() {
  const [form, setForm] = useState<FortuneFormInput>(defaultForm);
  const [period, setPeriod] = useState<FortunePeriod>("daily");
  const [fortune, setFortune] = useState<FortunePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<"sharp" | "seductive" | "cool">("sharp");

  async function loadFortune(nextPeriod: FortunePeriod, nextForm = form) {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await requestFortune(nextPeriod, nextForm);
      setFortune(payload);
      setSelectedTone(payload.oneLineVariants[0]?.tone || "sharp");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "운세를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadFortune(period);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);

      void requestFortune("daily", defaultForm)
        .then((payload) => {
          setFortune(payload);
          setSelectedTone(payload.oneLineVariants[0]?.tone || "sharp");
        })
        .catch((requestError: unknown) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "운세를 불러오지 못했습니다.",
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-6 px-4 py-6 text-slate-800 sm:px-6 lg:px-10 lg:py-8">
      <section className="glass-panel stagger-rise overflow-hidden rounded-[32px] border border-white/60 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-sm text-slate-600">
              <Compass className="h-4 w-4" />
              Fortune forecast dashboard
            </div>
            <h1 className="font-serif text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
              럭 캐스트
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              복잡한 풀이 대신 흐름만 남겼습니다. 생년월일과 출생 시간을 넣으면 일별,
              월별, 연별 운세를 점수 그래프와 행동 중심 해석으로 정리합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Daily", "7일 궤적"],
              ["Monthly", "6개월 흐름"],
              ["Yearly", "5년 시야"],
              ["AI JSON", "구조화 출력"],
            ].map(([label, value], index) => (
              <div
                key={label}
                className="stagger-rise rounded-[24px] border border-white/70 bg-white/70 px-4 py-4 text-center shadow-[0_10px_30px_rgba(50,55,72,0.07)]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="glass-panel stagger-rise rounded-[32px] border border-white/60 p-6 sm:p-7"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Input</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">운세 프로필</h2>
            </div>
            <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              Hidden Logic
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">이름</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none ring-0 transition focus:border-slate-400 focus:shadow-[0_0_0_4px_var(--ring)]"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="이름"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">생년월일</span>
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-400 focus:shadow-[0_0_0_4px_var(--ring)]"
                value={form.birthDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, birthDate: event.target.value }))
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">출생 시간</span>
              <input
                type="time"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-400 focus:shadow-[0_0_0_4px_var(--ring)]"
                value={form.birthTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, birthTime: event.target.value }))
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">달력 기준</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-400 focus:shadow-[0_0_0_4px_var(--ring)]"
                  value={form.calendarType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      calendarType: event.target.value as FortuneFormInput["calendarType"],
                    }))
                  }
                >
                  <option value="solar">양력</option>
                  <option value="lunar">음력</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">성별</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition focus:border-slate-400 focus:shadow-[0_0_0_4px_var(--ring)]"
                  value={form.gender}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      gender: event.target.value as FortuneFormInput["gender"],
                    }))
                  }
                >
                  <option value="female">여성</option>
                  <option value="male">남성</option>
                  <option value="other">기타</option>
                </select>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-400"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                운세를 분석하는 중입니다
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                운세 새로 계산하기
              </>
            )}
          </button>

          <p className="mt-4 text-xs leading-6 text-slate-500">
            Gemini API 키가 설정되면 구조화 출력 기반 AI 분석을 우선 사용하고, 없으면
            로컬 예측 엔진으로 fallback 됩니다.
          </p>
        </form>

        <div className="flex flex-col gap-6">
          <section className="glass-panel stagger-rise rounded-[32px] border border-white/60 p-6 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Forecast</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {fortune?.headline || "나의 운세 예보"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  {fortune?.summary || "데이터를 불러오는 중입니다."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {PERIOD_TABS.map((tab) => {
                  const active = tab.value === period;

                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => {
                        setPeriod(tab.value);
                        void loadFortune(tab.value);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
                          : "border-slate-200 bg-white/75 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      {tab.label}
                      <span className="ml-2 text-xs opacity-70">{tab.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              {fortune ? <FortuneChart data={fortune.chart} /> : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1">
                데이터 소스: {fortune ? sourceLabel(fortune.source) : "로딩 중"}
              </span>
              <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1">
                점수 범위: 0-100
              </span>
            </div>
          </section>

          {fortune ? (
            <>
              <section className="glass-panel rounded-[32px] border border-white/60 p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Breakdown</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">세부 운세 확인</h3>
                  </div>
                  <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-500">
                    {fortune.luckyWindow}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                  {fortune.highlights.map((item, index) => {
                    const Icon = categoryIconMap[item.id as keyof typeof categoryIconMap] || Sparkles;

                    return (
                      <article
                        key={item.id}
                        className="stagger-rise rounded-[26px] border border-white/70 bg-white/75 p-5"
                        style={{ animationDelay: `${index * 90}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-2xl font-bold text-slate-900">{item.score}</span>
                        </div>
                        <h4 className="mt-4 text-xl font-bold text-slate-900">{item.label}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="glass-panel rounded-[32px] border border-white/60 p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Hot Picks</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">오늘의 자극 포인트</h3>
                  </div>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    공유하기 좋은 카드
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {fortune.oneLineVariants.map((variant) => {
                    const active = variant.tone === selectedTone;

                    return (
                      <button
                        key={variant.tone}
                        type="button"
                        onClick={() => setSelectedTone(variant.tone)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white/75 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {ONE_LINE_TONE_LABEL[variant.tone]}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {fortune.picks.map((item, index) => {
                    const selectedVariant = fortune.oneLineVariants.find(
                      (variant) => variant.tone === selectedTone,
                    );
                    const displayValue =
                      item.id === "one-line" ? selectedVariant?.text || item.value : item.value;
                    const displayDescription =
                      item.id === "one-line"
                        ? `선택된 톤: ${ONE_LINE_TONE_LABEL[selectedTone]}. 공유용 카피로 바로 써도 되는 강도입니다.`
                        : item.description;

                    return (
                      <article
                        key={item.id}
                        className="stagger-rise rounded-[26px] border border-white/70 bg-linear-to-br from-white/90 to-rose-50/80 p-5"
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                          {item.label}
                        </p>
                        <h4 className="mt-3 text-2xl font-bold leading-9 text-slate-900">
                          {displayValue}
                        </h4>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {displayDescription}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <article className="glass-panel rounded-[32px] border border-white/60 p-6 sm:p-7">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Narrative</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">운세 예측</h3>
                  <p className="mt-5 text-base leading-8 text-slate-700">{fortune.summary}</p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-amber-200/70 bg-amber-50/80 p-5">
                      <p className="text-sm font-semibold text-amber-800">핵심 액션</p>
                      <p className="mt-3 text-sm leading-7 text-amber-900">{fortune.actionPoint}</p>
                    </div>
                    <div className="rounded-[24px] border border-sky-200/70 bg-sky-50/80 p-5">
                      <p className="text-sm font-semibold text-sky-800">주의 포인트</p>
                      <p className="mt-3 text-sm leading-7 text-sky-900">{fortune.caution}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {fortune.focusTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>

                <aside className="glass-panel rounded-[32px] border border-white/60 p-6 sm:p-7">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Checklist</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">주요 실행 항목</h3>

                  <ul className="mt-6 space-y-3">
                    {fortune.checklist.map((item, index) => (
                      <li
                        key={item}
                        className="stagger-rise flex items-start gap-3 rounded-[22px] border border-white/80 bg-white/70 px-4 py-4"
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        <span className="text-sm leading-7 text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </aside>
              </section>
            </>
          ) : null}

          {error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
