"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Flame, Trophy, Zap, BarChart3, Loader2, Calendar, ArrowRight } from "lucide-react";
import { getTodayWarsaw } from "../lib/date";
import { cn } from "../lib/cn";
import { TIERS, loadTierData } from "../lib/tiers";
import units from "../../curriculum/units.json";
import { useState, useEffect } from "react";

interface UnitData {
  unit: number; level: string; theme: string; theme_en: string;
  scenario: { title: string; };
}

export default function Home() {
  const today = getTodayWarsaw();
  const stats = useQuery(api.sessions.getStats);
  const dueCards = useQuery(api.cards.getDue, { limit: 999 });
  const todayLesson = useQuery(api.lessons.getByDate, { date: today });

  const [tierCompletion, setTierCompletion] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const data = loadTierData();
    const todayTiers = data[today] ?? {};
    setTierCompletion({
      bronze: todayTiers.bronze?.completed ?? false,
      silver: todayTiers.silver?.completed ?? false,
      gold: todayTiers.gold?.completed ?? false,
    });
  }, [today]);

  // Match unit from curriculum
  const unit = useMemo(() => {
    if (!todayLesson) return null;
    const unitMatch = todayLesson.topic.match(/Unit (\d+)/);
    if (unitMatch) {
      const unitNum = parseInt(unitMatch[1]);
      return (units as UnitData[]).find(u => u.unit === unitNum) ?? null;
    }
    return (units as UnitData[]).find(u =>
      u.theme.toLowerCase() === todayLesson.topic.toLowerCase()
    ) ?? null;
  }, [todayLesson]);

  const hasDueCards = dueCards && dueCards.length > 0;
  const completedCount = Object.values(tierCompletion).filter(Boolean).length;

  if (stats === undefined || todayLesson === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto pb-20 px-4 py-4 flex flex-col gap-5">
      {/* Stats bar */}
      {stats && (
        <div className="flex items-center justify-center gap-6 py-1">
          <div className="flex items-center gap-1.5">
            <Flame size={18} className="text-orange-400" />
            <span className="text-lg font-bold">{stats.streak}</span>
            <span className="text-xs text-white/40">streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={18} className="text-yellow-400" />
            <span className="text-lg font-bold">{stats.masteredCards}</span>
            <span className="text-xs text-white/40">mastered</span>
          </div>
          {hasDueCards && (
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-sm font-medium">{dueCards.length}</span>
              <span className="text-xs text-white/40">due</span>
            </div>
          )}
        </div>
      )}

      {/* Today's lesson card */}
      {todayLesson && unit ? (
        <Link href={`/lesson/${today}`}>
          <div className="bg-gradient-to-br from-accent/15 to-accent/5 rounded-2xl border border-accent/20 p-5 active:scale-[0.98] transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-light font-medium">
                Unit {unit.unit} · {unit.level}
              </span>
              {completedCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">
                  {completedCount}/3 ✓
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold">{unit.theme}</h2>
            <p className="text-sm text-white/50">{unit.theme_en}</p>
            <p className="text-xs text-white/30 mt-1">📍 {unit.scenario.title}</p>
            
            {/* Tier progress */}
            <div className="flex gap-2 mt-4">
              {TIERS.map(t => {
                const done = tierCompletion[t.tier];
                return (
                  <div key={t.tier} className={cn(
                    "flex-1 py-2 rounded-xl text-center text-xs font-medium border transition",
                    done ? "bg-success/15 border-success/30 text-success" : `bg-gradient-to-br ${t.color} ${t.borderColor} text-white/60`
                  )}>
                    {t.emoji} {t.label}
                    {done && " ✓"}
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-end mt-3 text-accent-light text-sm font-medium gap-1">
              {completedCount === 3 ? "All complete! Retry" : "Start lesson"} <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      ) : (
        <div className="bg-card rounded-2xl border border-white/10 p-6 text-center space-y-2">
          <p className="text-white/50">No lesson for today</p>
          <p className="text-xs text-white/30">Check the calendar for available lessons</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/practice">
          <div className="bg-card rounded-xl border border-white/10 p-4 hover:border-white/20 transition">
            <Zap size={20} className="text-yellow-400 mb-2" />
            <h3 className="text-sm font-medium">Practice</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {hasDueCards ? `${dueCards.length} cards due` : "Flashcards"}
            </p>
          </div>
        </Link>
        <Link href="/calendar">
          <div className="bg-card rounded-xl border border-white/10 p-4 hover:border-white/20 transition">
            <Calendar size={20} className="text-accent-light mb-2" />
            <h3 className="text-sm font-medium">Calendar</h3>
            <p className="text-xs text-white/40 mt-0.5">All lessons</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
