import { cn } from "@/lib/cn";

type Props = {
  name: string;
  rating: number;
  level?: string;
};

export default function MilestoneBar({ name, rating, level }: Props) {
  const pct = Math.max(0, Math.min(100, (rating / 4) * 100));
  const barColor =
    rating >= 3
      ? "bg-success"
      : rating >= 2
      ? "bg-accent"
      : rating >= 1
      ? "bg-yellow-400"
      : "bg-warn";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-white/60">
        <span className="font-medium text-white/90 truncate">{name}</span>
        <span className="text-[9px] uppercase tracking-widest text-white/30">
          {level ?? "Skill"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-white/40 tabular-nums w-10 text-right">
          {rating.toFixed(1)}/4
        </span>
      </div>
    </div>
  );
}
