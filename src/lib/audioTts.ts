"use client";

import { apiPath } from "./paths";

let currentAudio: HTMLAudioElement | null = null;
let currentRequestId = 0;

interface PlayOptions {
  rate?: number;
  userInitiated?: boolean;
  onBlocked?: () => void;
}

export function stopItalianTts(): void {
  currentRequestId += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export async function playItalianTts(
  text: string,
  options: PlayOptions = {},
): Promise<boolean> {
  const { rate = 0.9, userInitiated = false, onBlocked } = options;
  if (typeof window === "undefined" || !text.trim()) return false;
  const requestId = ++currentRequestId;

  stopItalianTts();
  currentRequestId = requestId;

  try {
    const res = await fetch(apiPath("/api/tts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("tts_failed");
    const blob = await res.blob();
    if (requestId !== currentRequestId) return false;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
    };
    await audio.play();
    return true;
  } catch {
    if (window.speechSynthesis && userInitiated) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "it-IT";
        utterance.rate = rate;
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        // continue to blocked callback
      }
    }
    onBlocked?.();
    return false;
  }
}
