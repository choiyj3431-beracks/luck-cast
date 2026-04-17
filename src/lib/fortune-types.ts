export type FortunePeriod = "daily" | "monthly" | "yearly";

export type FortuneFormInput = {
  name: string;
  birthDate: string;
  birthTime: string;
  calendarType: "solar" | "lunar";
  gender: "female" | "male" | "other";
};

export type FortunePoint = {
  label: string;
  date: string;
  wealth: number;
  love: number;
  career: number;
  health: number;
};

export type FortuneInsight = {
  id: string;
  label: string;
  score: number;
  note: string;
  icon: string;
};

export type FortunePayload = {
  period: FortunePeriod;
  headline: string;
  summary: string;
  actionPoint: string;
  caution: string;
  luckyWindow: string;
  focusTags: string[];
  checklist: string[];
  highlights: FortuneInsight[];
  chart: FortunePoint[];
  source: "gemini" | "fallback";
};
