"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warn"
  | "danger"
  | "level"
  | "status"
  | "source";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  level?: string;
  status?: "blocked" | "completed" | "active";
  source?: "recovery";
  className?: string;
}

const LEVEL_CLASS: Record<string, string> = {
  A1: "bg-success/20 text-success border-success/30",
  A2: "bg-accent/20 text-accent-light border-accent/30",
  B1: "bg-warn/20 text-warn border-warn/30",
  B2: "bg-danger/20 text-danger border-danger/30",
};

const STATUS_CLASS: Record<string, string> = {
  blocked: "bg-warn/20 text-warn border-warn/30",
  completed: "bg-success/20 text-success border-success/30",
  active: "bg-accent/20 text-accent-light border-accent/30",
};

function resolveTone({
  tone,
  level,
  status,
  source,
}: Pick<BadgeProps, "tone" | "level" | "status" | "source">) {
  if (tone === "level" && level) {
    return LEVEL_CLASS[level] || "bg-white/5 text-white/40 border-white/10";
  }
  if (tone === "status" && status) {
    return STATUS_CLASS[status] || "bg-white/5 text-white/40 border-white/10";
  }
  if (tone === "source" && source === "recovery") {
    return "bg-warn/20 text-warn border-warn/30";
  }
  switch (tone) {
    case "accent":
      return "bg-accent/20 text-accent-light border-accent/30";
    case "success":
      return "bg-success/20 text-success border-success/30";
    case "warn":
      return "bg-warn/20 text-warn border-warn/30";
    case "danger":
      return "bg-danger/20 text-danger border-danger/30";
    default:
      return "bg-white/5 text-white/35 border-white/10";
  }
}

export default function Badge({
  children,
  tone = "neutral",
  level,
  status,
  source,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        resolveTone({ tone, level, status, source }),
        className,
      )}
    >
      {children}
    </span>
  );
}
