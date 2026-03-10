"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, Clock3, Loader2, TriangleAlert } from "lucide-react";
import Badge from "@/components/Badge";
import { DashboardShell } from "@/components/layout/ScreenShell";

type SessionRow = {
  _id: string;
  mode?: string;
  type: string;
  duration: number;
  exercisesCompleted?: number;
  exercisesTotal?: number;
  rating?: number;
  errors: Array<{
    original: string;
    corrected: string;
    explanation?: string;
    category?: string;
  }>;
  appliedCredits?: { bronze: number; silver: number; gold: number };
  checkpointAwardedId?: string;
  duplicatePenaltyApplied?: boolean;
};

const MODE_LABELS: Record<string, string> = {
  quick: "Bronze",
  standard: "Silver",
  deep: "Gold",
};

export default function SessionHistoryPage() {
  const params = useParams();
  const date = params.date as string;
  const sessions = useQuery(api.sessions.getByDate, { date }) as SessionRow[] | undefined;

  const summary = useMemo(() => {
    if (!sessions) return null;
    const rated = sessions.filter((s) => typeof s.rating === "number");
    return {
      total: sessions.length,
      minutes: sessions.reduce((sum, s) => sum + Math.round((s.duration ?? 0) / 60), 0),
      errors: sessions.reduce((sum, s) => sum + s.errors.length, 0),
      avgRating: rated.length ? (rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length).toFixed(1) : null,
    };
  }, [sessions]);

  if (sessions === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center gap-3">
        <Link
          href="/progress"
          className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition text-white/50 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Session History</h1>
          <p className="text-xs text-white/35">{date}</p>
        </div>
      </div>

      {summary && (
        <section className="grid grid-cols-4 gap-2">
          <div className="rounded-xl border border-white/10 bg-card p-3 text-center">
            <p className="text-lg font-semibold">{summary.total}</p>
            <p className="text-[10px] text-white/35">sessions</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-3 text-center">
            <p className="text-lg font-semibold">{summary.minutes}</p>
            <p className="text-[10px] text-white/35">minutes</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-3 text-center">
            <p className="text-lg font-semibold">{summary.errors}</p>
            <p className="text-[10px] text-white/35">errors</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-3 text-center">
            <p className="text-lg font-semibold">{summary.avgRating ?? "—"}</p>
            <p className="text-[10px] text-white/35">avg rating</p>
          </div>
        </section>
      )}

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card p-5 text-center">
          <p className="text-white/40">No sessions recorded for this day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => (
            <section key={index} className="rounded-2xl border border-white/10 bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="accent" className="uppercase tracking-wider border-0">
                    {MODE_LABELS[session.mode ?? ""] ?? session.type}
                  </Badge>
                  <h2 className="text-sm font-semibold mt-0.5">Session {sessions.length - index}</h2>
                </div>
                <div className="text-right text-[11px] text-white/40">
                  <div className="inline-flex items-center gap-1">
                    <Clock3 size={12} />
                    {Math.round((session.duration ?? 0) / 60)} min
                  </div>
                  <p className="mt-1">Rating {session.rating ?? "—"}/5</p>
                </div>
              </div>

              <div className="text-[12px] text-white/45 space-y-1">
                <p>
                  Exercises: {session.exercisesCompleted ?? 0}
                  {session.exercisesTotal ? `/${session.exercisesTotal}` : ""}
                </p>
                {session.appliedCredits && (
                  <p>
                    Credits: Bronze {session.appliedCredits.bronze} · Silver {session.appliedCredits.silver} · Gold {session.appliedCredits.gold}
                  </p>
                )}
                {session.checkpointAwardedId && <p>Checkpoint: {session.checkpointAwardedId}</p>}
                {session.duplicatePenaltyApplied && <p className="text-warn">Duplicate-session penalty applied</p>}
              </div>

              {session.errors.length > 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-white/35">Errors</p>
                  {session.errors.slice(0, 6).map((err, i) => (
                    <div key={`${index}-${i}`} className="text-sm">
                      <span className="text-danger line-through">{err.original}</span>
                      {" → "}
                      <span className="text-success">{err.corrected}</span>
                      {err.explanation && (
                        <p className="text-xs text-white/35 mt-0.5">{err.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/35 inline-flex items-center gap-2">
                  <TriangleAlert size={14} className="text-white/30" />
                  No correction events recorded
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
