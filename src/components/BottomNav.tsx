"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BarChart3, Flag } from "lucide-react";
import { cn } from "../lib/cn";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/missions", label: "Missions", icon: Flag },
  { href: "/exercises", label: "Drills", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export const NAV_SPACER_CLASS = "h-[100px]";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
    {/* Spacer to prevent content from being hidden behind fixed nav */}
    <div className={NAV_SPACER_CLASS} />
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur border-t border-white/5 z-50" style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))", paddingTop: "8px" }}>
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {items.map((item) => {
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
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition [-webkit-tap-highlight-color:transparent]",
                active ? "text-accent-light" : "text-white/40 hover:text-white/60"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
