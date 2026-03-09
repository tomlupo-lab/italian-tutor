"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Dumbbell, BarChart3, Flag, Play } from "lucide-react";
import { cn } from "../lib/cn";
import { getTodayWarsaw } from "@/lib/date";

const leftItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const rightItems = [
  { href: "/missions", label: "Missions", icon: Flag },
  { href: "/exercises", label: "Drills", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export const NAV_SPACER_CLASS = "h-[100px]";

export default function BottomNav() {
  const pathname = usePathname();
  const today = getTodayWarsaw();
  const startHref = `/session/${today}?mode=quick`;
  const startActive = pathname.startsWith("/session/");

  return (
    <>
    {/* Spacer to prevent content from being hidden behind fixed nav */}
    <div className={NAV_SPACER_CLASS} />
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur border-t border-white/5 z-50" style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))", paddingTop: "8px" }}>
      <div className="max-w-lg mx-auto grid grid-cols-[1fr_1fr_auto_1fr_1fr_1fr] items-end gap-1 px-2">
        {leftItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition [-webkit-tap-highlight-color:transparent]",
                active ? "text-accent-light" : "text-white/40 hover:text-white/60"
              )}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href={startHref}
          aria-label="Start session"
          className={cn(
            "flex flex-col items-center gap-1 rounded-2xl px-3 py-2.5 -mt-5 border shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition [-webkit-tap-highlight-color:transparent]",
            startActive
              ? "bg-accent text-black border-accent"
              : "bg-accent/90 text-black border-accent/70 hover:bg-accent",
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10">
            <Play size={18} className="fill-current ml-0.5" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide">Start</span>
        </Link>
        {rightItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition [-webkit-tap-highlight-color:transparent]",
                active ? "text-accent-light" : "text-white/40 hover:text-white/60"
              )}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
