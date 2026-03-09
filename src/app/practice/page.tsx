"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getTodayWarsaw } from "@/lib/date";

export default function PracticePage() {
  const router = useRouter();
  const today = getTodayWarsaw();
  const target = `/session/${today}?mode=quick`;

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center max-w-lg mx-auto px-4 gap-4">
      <Loader2 size={32} className="text-accent animate-spin" />
      <p className="text-sm text-white/60">Opening Bronze session...</p>
      <Link
        href={target}
        className="text-xs text-accent-light hover:text-accent transition"
      >
        Continue if redirect does not start
      </Link>
    </main>
  );
}
