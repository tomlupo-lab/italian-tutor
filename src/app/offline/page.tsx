"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
      <div className="text-6xl">📡</div>
      <h1 className="text-2xl font-bold text-center">You&apos;re offline</h1>
      <p className="text-white/50 text-sm text-center max-w-xs">
        Marco needs an internet connection to load your lessons and cards.
        Reconnect and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-accent rounded-xl text-sm font-medium hover:bg-accent/80 transition"
      >
        Retry
      </button>
    </main>
  );
}
