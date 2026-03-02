"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, BarChart3, Settings } from "lucide-react";
import { cn } from "../lib/cn";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Zap },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur border-t border-white/5 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition",
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
  );
}
