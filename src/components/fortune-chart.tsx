"use client";

import { FortunePoint } from "@/lib/fortune-types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FortuneChartProps = {
  data: FortunePoint[];
};

const SERIES = [
  { key: "love", name: "애정", color: "var(--line-love)" },
  { key: "wealth", name: "재물", color: "var(--line-wealth)" },
  { key: "career", name: "직업", color: "var(--line-career)" },
  { key: "health", name: "건강", color: "var(--line-health)" },
] as const;

export function FortuneChart({ data }: FortuneChartProps) {
  return (
    <div className="chart-fade h-[300px] w-full sm:h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 8, left: -24, bottom: 0 }}
        >
          <defs>
            {SERIES.map((series) => (
              <linearGradient
                key={series.key}
                id={`gradient-${series.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={series.color} stopOpacity={0.24} />
                <stop offset="95%" stopColor={series.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="rgba(31, 41, 55, 0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#475569", fontSize: 13 }}
          />
          <YAxis
            domain={[0, 100]}
            tickCount={6}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(31, 41, 55, 0.2)", strokeDasharray: "4 6" }}
            contentStyle={{
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.6)",
              background: "rgba(255, 252, 247, 0.95)",
              boxShadow: "0 18px 44px rgba(50, 55, 72, 0.16)",
            }}
            formatter={(value, name) => [`${value ?? 0} / 100`, String(name)]}
            labelFormatter={(label) => `${String(label ?? "")} 기준`}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: "12px", fontSize: "13px" }}
          />
          {SERIES.map((series) => (
            <Area
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.name}
              stroke={series.color}
              fill={`url(#gradient-${series.key})`}
              fillOpacity={1}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 0, fill: series.color }}
              activeDot={{ r: 7, strokeWidth: 0, fill: series.color }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
