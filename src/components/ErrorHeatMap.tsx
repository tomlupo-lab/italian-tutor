"use client";

import { cn } from "@/lib/cn";

interface ErrorHeatMapProps {
  /** Sessions with date and error categories */
  sessions: Array<{
    date: string;
    errors: Array<{ category?: string }>;
  }>;
  /** Number of days to show */
  days?: number;
}

const CATEGORIES = ["grammar", "vocabulary", "preposition", "construction"];

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-white/5";
  if (count === 1) return "bg-danger/20";
  if (count <= 3) return "bg-danger/40";
  return "bg-danger/70";
}

export default function ErrorHeatMap({ sessions, days = 30 }: ErrorHeatMapProps) {
  // Build a date×category matrix
  const today = new Date();
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString("sv-SE"));
  }

  // Count errors per date per category
  const matrix: Record<string, Record<string, number>> = {};
  for (const date of dates) {
    matrix[date] = {};
    for (const cat of CATEGORIES) {
      matrix[date][cat] = 0;
    }
  }
  for (const session of sessions) {
    if (!matrix[session.date]) continue;
    for (const err of session.errors) {
      const cat = err.category || "grammar";
      if (matrix[session.date][cat] !== undefined) {
        matrix[session.date][cat]++;
      }
    }
  }

  return (
    <div className="space-y-2">
      {/* Category labels */}
      <div className="flex gap-1">
        <div className="w-20" />
        {dates.map((d) => (
          <div
            key={d}
            className="flex-1 min-w-0"
            title={d}
          />
        ))}
      </div>
      {CATEGORIES.map((cat) => (
        <div key={cat} className="flex items-center gap-1">
          <span className="text-[10px] text-white/40 w-20 truncate capitalize">
            {cat}
          </span>
          <div className="flex gap-0.5 flex-1">
            {dates.map((d) => (
              <div
                key={d}
                className={cn(
                  "flex-1 h-3 rounded-sm min-w-[3px]",
                  getIntensityClass(matrix[d]?.[cat] ?? 0),
                )}
                title={`${d}: ${matrix[d]?.[cat] ?? 0} ${cat} errors`}
              />
            ))}
          </div>
        </div>
      ))}
      {/* Legend */}
      <div className="flex items-center gap-2 justify-end text-[10px] text-white/30">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-white/5" />
          <div className="w-3 h-3 rounded-sm bg-danger/20" />
          <div className="w-3 h-3 rounded-sm bg-danger/40" />
          <div className="w-3 h-3 rounded-sm bg-danger/70" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
