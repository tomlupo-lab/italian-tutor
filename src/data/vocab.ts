export interface VocabCard {
  id: string;
  it: string;
  en: string;
  ex: string;
  speakText?: string;
  exampleSpeakText?: string;
  tag?: string;
  level?: "A1" | "A2" | "B1" | "B2";
}

// Legacy compatibility export. Live seed data now lives under `convex/`.
export const vocab: VocabCard[] = [];
