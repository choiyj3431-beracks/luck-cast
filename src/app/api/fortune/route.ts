import { generateFortune } from "@/lib/fortune-engine";
import { FortuneFormInput, FortunePeriod } from "@/lib/fortune-types";
import { NextRequest, NextResponse } from "next/server";

function isFortunePeriod(value: unknown): value is FortunePeriod {
  return value === "daily" || value === "monthly" || value === "yearly";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<FortuneFormInput> & {
      period?: FortunePeriod;
    };

    if (!body.birthDate || !isFortunePeriod(body.period)) {
      return NextResponse.json(
        { error: "birthDate and valid period are required." },
        { status: 400 },
      );
    }

    const payload = await generateFortune(
      {
        name: body.name?.trim() || "사용자",
        birthDate: body.birthDate,
        birthTime: body.birthTime?.trim() || "09:00",
        calendarType: body.calendarType === "lunar" ? "lunar" : "solar",
        gender:
          body.gender === "female" || body.gender === "male" || body.gender === "other"
            ? body.gender
            : "other",
      },
      body.period,
    );

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate fortune.",
      },
      { status: 500 },
    );
  }
}
