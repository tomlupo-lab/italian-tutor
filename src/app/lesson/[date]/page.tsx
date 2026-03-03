"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { cn } from "../../../lib/cn";
import { getTodayWarsaw } from "../../../lib/date";
import {
  Volume2,
  Send,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Star,
  Mic,
  BookOpen,
  PenTool,
  MessageCircle,
} from "lucide-react";
import units from "../../../../curriculum/units.json";
import type { Id } from "../../../../convex/_generated/dataModel";

// Types
type Phase = "vocab" | "exercises" | "conversation" | "summary";

interface UnitData {
  unit: number;
  level: string;
  theme: string;
  theme_en: string;
  grammar_point: string;
  vocab: { it: string; en: string; example: string }[];
  exercises: { type: string; sentence: string; answer: string }[];
  scenario: { title: string; setup: string; opening: string; goal: string };
}

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  correction?: { original: string; corrected: string; explanation: string };
}

interface SessionError {
  original: string;
  corrected: string;
  explanation: string;
}

// TTS via API
async function playTTS(text: string) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    // Fallback to browser speech
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "it-IT";
      u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  }
}

// Phase indicator
function PhaseIndicator({ phase }: { phase: Phase }) {
  const phases: { key: Phase; label: string; icon: typeof BookOpen }[] = [
    { key: "vocab", label: "Vocab", icon: BookOpen },
    { key: "exercises", label: "Exercises", icon: PenTool },
    { key: "conversation", label: "Talk", icon: MessageCircle },
  ];
  const currentIdx = phases.findIndex((p) => p.key === phase);

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3">
      {phases.map((p, i) => {
        const Icon = p.icon;
        const active = p.key === phase;
        const done = i < currentIdx;
        return (
          <div key={p.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "w-8 h-0.5 rounded",
                  done ? "bg-accent" : "bg-white/10"
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                active && "bg-accent text-white",
                done && "bg-accent/20 text-accent-light",
                !active && !done && "bg-white/5 text-white/30"
              )}
            >
              <Icon size={12} />
              {p.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PHASE 1: VOCAB ───────────────────────────────
function VocabPhase({
  unit,
  onDone,
}: {
  unit: UnitData;
  onDone: () => void;
}) {
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const allFlipped = flippedCards.size === unit.vocab.length;

  const toggleCard = (idx: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Unit header */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-gradient-to-br from-accent/15 to-accent/5 rounded-2xl border border-accent/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-light font-medium">
              Unit {unit.unit} · {unit.level}
            </span>
          </div>
          <h2 className="text-lg font-semibold">{unit.theme}</h2>
          <p className="text-sm text-white/50">{unit.theme_en}</p>
          <p className="text-xs text-white/30 mt-1">
            📍 {unit.scenario.title}
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            📝 {unit.grammar_point}
          </p>
        </div>
      </div>

      {/* Vocab cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-xs text-white/40 mb-3">
          Tap each card to reveal the translation ({flippedCards.size}/
          {unit.vocab.length})
        </p>
        <div className="space-y-2">
          {unit.vocab.map((word, i) => {
            const isFlipped = flippedCards.has(i);
            return (
              <div
                key={i}
                onClick={() => toggleCard(i)}
                className={cn(
                  "rounded-xl border p-4 cursor-pointer transition-all active:scale-[0.98]",
                  isFlipped
                    ? "bg-card border-accent/30 shadow-lg shadow-accent/5"
                    : "bg-card border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-base">{word.it}</p>
                    {isFlipped && (
                      <div className="mt-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className="text-accent-light text-sm">{word.en}</p>
                        <p className="text-white/40 text-xs italic">
                          &ldquo;{word.example}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playTTS(word.it);
                    }}
                    className="p-2 rounded-full bg-white/5 hover:bg-accent/20 text-white/40 hover:text-accent-light transition flex-shrink-0 ml-3"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <div className="px-4 py-3 border-t border-white/5">
        <button
          onClick={onDone}
          disabled={!allFlipped}
          className={cn(
            "w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2",
            allFlipped
              ? "bg-accent hover:bg-accent/80 text-white"
              : "bg-white/5 text-white/30 cursor-not-allowed"
          )}
        >
          Start Exercises <ArrowRight size={16} />
        </button>
        {!allFlipped && (
          <p className="text-xs text-white/30 text-center mt-1">
            Review all {unit.vocab.length} cards to continue
          </p>
        )}
      </div>
    </div>
  );
}

// ─── PHASE 2: EXERCISES ───────────────────────────
function ExercisesPhase({
  unit,
  onDone,
}: {
  unit: UnitData;
  onDone: () => void;
}) {
  const [currentEx, setCurrentEx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const exercise = unit.exercises[currentEx];
  const isCorrect = answer.trim().toLowerCase() === exercise?.answer.toLowerCase();
  const allDone = results.length === unit.exercises.length;

  useEffect(() => {
    if (!submitted) inputRef.current?.focus();
  }, [currentEx, submitted]);

  const handleSubmit = () => {
    if (!answer.trim() || submitted) return;
    setSubmitted(true);
    setResults((prev) => [...prev, isCorrect]);
  };

  const handleNext = () => {
    if (currentEx < unit.exercises.length - 1) {
      setCurrentEx((p) => p + 1);
      setAnswer("");
      setSubmitted(false);
    }
  };

  if (allDone) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-center">
          <p className="text-4xl mb-2">
            {correct === results.length ? "🎯" : correct > 0 ? "👍" : "📚"}
          </p>
          <h2 className="text-lg font-semibold">
            {correct}/{results.length} correct
          </h2>
          <p className="text-sm text-white/40 mt-1">
            {correct === results.length
              ? "Perfetto! Ready for the conversation."
              : "Good effort! Let's practice more in conversation."}
          </p>
        </div>
        <button
          onClick={onDone}
          className="px-6 py-3 bg-accent rounded-xl font-medium hover:bg-accent/80 transition flex items-center gap-2"
        >
          Start Conversation <MessageCircle size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
      <div className="text-center">
        <p className="text-xs text-white/40 mb-1">
          Exercise {currentEx + 1} of {unit.exercises.length}
        </p>
        <div className="flex gap-1.5 justify-center mb-4">
          {unit.exercises.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-1.5 rounded-full",
                i < results.length
                  ? results[i]
                    ? "bg-success"
                    : "bg-danger"
                  : i === currentEx
                  ? "bg-accent"
                  : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-white/10 p-6 w-full max-w-sm">
        <p className="text-xs text-white/30 mb-3">Fill in the blank:</p>
        <p className="text-lg font-medium text-center leading-relaxed">
          {exercise.sentence}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <input
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (submitted) handleNext();
              else handleSubmit();
            }
          }}
          disabled={submitted}
          placeholder="Type your answer..."
          className={cn(
            "w-full bg-card border rounded-xl px-4 py-3 text-[16px] text-center font-medium focus:outline-none transition",
            submitted && isCorrect && "border-success/50 text-success",
            submitted && !isCorrect && "border-danger/50 text-danger",
            !submitted && "border-white/10 focus:border-accent/50"
          )}
        />
        {submitted && (
          <div
            className={cn(
              "mt-2 px-4 py-2 rounded-xl text-sm text-center",
              isCorrect
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            )}
          >
            {isCorrect ? (
              <span className="flex items-center justify-center gap-1">
                <Check size={14} /> Correct!
              </span>
            ) : (
              <span>
                <X size={14} className="inline mr-1" />
                The answer is: <strong>{exercise.answer}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="px-6 py-3 bg-accent rounded-xl font-medium hover:bg-accent/80 transition disabled:opacity-30"
        >
          Check
        </button>
      ) : currentEx < unit.exercises.length - 1 ? (
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-accent rounded-xl font-medium hover:bg-accent/80 transition flex items-center gap-2"
        >
          Next <ArrowRight size={16} />
        </button>
      ) : (
        <button
          onClick={() => {
            // Trigger allDone render
            setCurrentEx(unit.exercises.length);
          }}
          className="px-6 py-3 bg-accent rounded-xl font-medium hover:bg-accent/80 transition"
        >
          See Results
        </button>
      )}
    </div>
  );
}

// ─── PHASE 3: CONVERSATION ────────────────────────
function ConversationPhase({
  unit,
  lesson,
  onDone,
}: {
  unit: UnitData;
  lesson: { _id: Id<"lessons">; topic: string; targetPhrases?: { it: string; en: string }[] } | null;
  onDone: (errors: SessionError[], phrasesUsed: string[], duration: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedPhrases, setUsedPhrases] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<SessionError[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const sttSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const targetPhrases = unit.vocab.map((v) => v.it);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start conversation with Marco's opening line
  useEffect(() => {
    const openingMsg: ChatMessage = {
      role: "assistant",
      content: unit.scenario.opening,
    };
    setMessages([openingMsg]);
    playTTS(unit.scenario.opening);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPhrasesUsed = (text: string) => {
    const lower = text.toLowerCase();
    const newUsed = new Set(usedPhrases);
    for (const phrase of targetPhrases) {
      if (lower.includes(phrase.toLowerCase())) {
        newUsed.add(phrase);
      }
    }
    setUsedPhrases(newUsed);
  };

  const sendMessage = useCallback(
    async (userMsg: string) => {
      const userMessage: ChatMessage = { role: "user", content: userMsg };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      setLoading(true);
      checkPhrasesUsed(userMsg);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            topic: unit.theme,
            unitNumber: unit.unit,
            scenarioTitle: unit.scenario.title,
            scenarioSetup: unit.scenario.setup,
            scenarioGoal: unit.scenario.goal,
            targetPhrases: unit.vocab.map((v) => ({ it: v.it, en: v.en })),
            grammarFocus: unit.grammar_point,
            level: unit.level,
            lessonType: "structured_unit",
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const content = data.content as string;

        // Parse corrections from JSON block
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
        let correction: ChatMessage["correction"] | undefined;
        let cleanContent = content;

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            cleanContent = content.replace(/```json[\s\S]*?```/, "").trim();

            if (parsed.correction) {
              correction = parsed.correction;
              setErrors((prev) => [...prev, parsed.correction]);
            }
            if (parsed.done) {
              // Extract all errors from the done block too
              if (parsed.errors) {
                setErrors((prev) => {
                  const existing = new Set(prev.map((e) => e.original));
                  const newErrors = parsed.errors.filter(
                    (e: SessionError) => !existing.has(e.original)
                  );
                  return [...prev, ...newErrors];
                });
              }
              const duration = Math.floor(
                (Date.now() - startTimeRef.current) / 1000
              );
              const finalPhrases = Array.from(usedPhrases);
              setTimeout(
                () => onDone(errors, finalPhrases, duration),
                1500
              );
            }
          } catch {
            /* ignore parse errors */
          }
        }

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: cleanContent,
          correction,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        playTTS(cleanContent);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ Error: ${errMsg}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, unit, usedPhrases, errors, onDone]
  );

  const handleEndConversation = () => {
    const duration = Math.floor(
      (Date.now() - startTimeRef.current) / 1000
    );
    onDone(errors, Array.from(usedPhrases), duration);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    if (!sttSupported) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "it-IT";
    recognition.interimResults = true;
    recognition.continuous = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setTranscript("");
    setIsRecording(true);
  };

  const sendTranscript = () => {
    if (transcript.trim()) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      sendMessage(transcript.trim());
      setTranscript("");
    }
  };

  const insertPhrase = (phrase: string) => {
    setInput((prev) => (prev ? prev + " " + phrase : phrase));
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Scenario header */}
      <div className="px-4 py-3 bg-gradient-to-r from-teal-900/30 to-teal-800/10 border-b border-teal-500/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏛️</span>
          <div>
            <p className="text-sm font-medium text-teal-300">
              {unit.scenario.title}
            </p>
            <p className="text-xs text-white/40">{unit.scenario.setup}</p>
          </div>
        </div>
      </div>

      {/* Phrase progress */}
      <div className="px-4 py-2 border-b border-white/5 bg-card/30">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{
                width: `${(usedPhrases.size / targetPhrases.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-white/30">
            {usedPhrases.size}/{targetPhrases.length} phrases
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "bg-teal-900/30 border border-teal-500/20 self-start"
                  : "bg-accent/20 border border-accent/20 self-end ml-auto"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-teal-300 text-xs font-medium">
                    Marco 🇮🇹
                  </span>
                  <button
                    onClick={() => playTTS(msg.content)}
                    className="text-white/30 hover:text-teal-300 transition p-0.5"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {/* Inline correction */}
            {msg.correction && (
              <div className="max-w-[85%] ml-auto mt-1 bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2 text-xs">
                <p>
                  <span className="text-danger">❌ {msg.correction.original}</span>
                </p>
                <p>
                  <span className="text-success">✅ {msg.correction.corrected}</span>
                </p>
                <p className="text-white/40 mt-0.5">
                  {msg.correction.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="bg-teal-900/30 border border-teal-500/20 rounded-2xl px-4 py-3 self-start max-w-[85%]">
            <span className="text-teal-300 text-xs font-medium block mb-1">
              Marco 🇮🇹
            </span>
            <div className="flex gap-1">
              <span className="animate-bounce">·</span>
              <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>·</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Target phrase chips */}
      <div className="px-4 py-2 border-t border-white/5 overflow-x-auto">
        <div className="flex gap-1.5 pb-1">
          {targetPhrases.map((phrase) => {
            const used = usedPhrases.has(phrase);
            return (
              <button
                key={phrase}
                onClick={() => !used && insertPhrase(phrase)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition border",
                  used
                    ? "bg-success/20 border-success/30 text-success"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 active:scale-95"
                )}
              >
                {used && <Check size={10} className="inline mr-1" />}
                {phrase}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-danger/10 border-t border-danger/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-xs text-danger font-medium">
              Recording...
            </span>
          </div>
          {transcript && (
            <p className="text-sm text-white/70 mt-1 italic">{transcript}</p>
          )}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isRecording && transcript.trim()) sendTranscript();
          else if (input.trim() && !loading) sendMessage(input.trim());
        }}
        className="px-4 py-3 border-t border-white/5 flex gap-2"
      >
        {!isRecording ? (
          <>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi in italiano..."
              className="flex-1 bg-card border border-white/10 rounded-xl px-4 py-3 text-[16px] focus:outline-none focus:border-accent/50 transition"
            />
            {sttSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
              >
                <Mic size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-accent rounded-xl disabled:opacity-30 hover:bg-accent/80 transition"
            >
              <Send size={18} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleRecording}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition text-white/60"
            >
              ✕
            </button>
            <div className="flex-1 flex items-center justify-center text-sm text-white/40">
              {transcript ? transcript.slice(-50) : "Parla..."}
            </div>
            <button
              type="button"
              onClick={sendTranscript}
              disabled={!transcript.trim()}
              className="p-3 bg-accent rounded-xl disabled:opacity-30 hover:bg-accent/80 transition"
            >
              <Send size={18} />
            </button>
          </>
        )}
      </form>

      {/* End conversation button */}
      {messages.length >= 4 && (
        <div className="px-4 pb-3">
          <button
            onClick={handleEndConversation}
            className="w-full py-2 text-xs text-white/30 hover:text-white/60 transition"
          >
            End conversation →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SUMMARY PHASE ────────────────────────────────
function SummaryPhase({
  unit,
  errors,
  phrasesUsed,
  duration,
  lesson,
  onSave,
}: {
  unit: UnitData;
  errors: SessionError[];
  phrasesUsed: string[];
  duration: number;
  lesson: { _id: Id<"lessons">; topic: string } | null;
  onSave: (rating: number) => void;
}) {
  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);

  const allPhrases = unit.vocab.map((v) => v.it);
  const mastered = allPhrases.filter((p) => phrasesUsed.includes(p));
  const missed = allPhrases.filter((p) => !phrasesUsed.includes(p));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-4xl">✅</p>
        <h2 className="text-xl font-bold">Unit {unit.unit} Complete!</h2>
        <p className="text-sm text-white/40">
          {unit.theme} · {Math.floor(duration / 60)} min{" "}
          {duration % 60}s
        </p>
      </div>

      {/* Phrases mastered */}
      {mastered.length > 0 && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-success mb-2">
            ✅ Phrases Used ({mastered.length}/{allPhrases.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {mastered.map((p) => (
              <span
                key={p}
                className="px-2 py-1 rounded-full bg-success/20 text-success text-xs"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missed phrases */}
      {missed.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/50 mb-2">
            📝 To Review
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {missed.map((p) => (
              <span
                key={p}
                className="px-2 py-1 rounded-full bg-white/5 text-white/40 text-xs"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-medium text-danger mb-1">
            Corrections ({errors.length})
          </h3>
          {errors.map((e, i) => (
            <div key={i} className="text-xs space-y-0.5">
              <p className="text-danger line-through">{e.original}</p>
              <p className="text-success">→ {e.corrected}</p>
              <p className="text-white/30">{e.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Self rating */}
      {!saved && (
        <div className="text-center space-y-3">
          <p className="text-sm text-white/50">How did it go?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={cn(
                  "p-2 rounded-lg transition",
                  n <= rating
                    ? "text-yellow-400"
                    : "text-white/20 hover:text-white/40"
                )}
              >
                <Star size={24} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              onSave(rating || 3);
              setSaved(true);
            }}
            disabled={!rating}
            className="px-6 py-3 bg-accent rounded-xl font-medium hover:bg-accent/80 transition disabled:opacity-30"
          >
            Save & Finish
          </button>
        </div>
      )}

      {saved && (
        <div className="text-center space-y-3">
          <p className="text-success text-sm">✓ Session saved</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-accent rounded-xl font-medium hover:bg-accent/80 transition"
          >
            Back to Home
          </a>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────
export default function LessonPage() {
  const params = useParams();
  const dateParam = params.date as string;
  const today = getTodayWarsaw();

  const lesson = useQuery(api.lessons.getByDate, { date: dateParam });
  const saveSession = useMutation(api.sessions.save);

  const [phase, setPhase] = useState<Phase>("vocab");
  const [sessionErrors, setSessionErrors] = useState<SessionError[]>([]);
  const [phrasesUsed, setPhrasesUsed] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Match unit from curriculum by topic or unit number
  const unit = useMemo(() => {
    if (!lesson) return null;
    // Try matching by topic name
    const byTopic = (units as UnitData[]).find(
      (u) =>
        u.theme.toLowerCase() === lesson.topic.toLowerCase() ||
        u.theme_en.toLowerCase() === lesson.topic.toLowerCase()
    );
    if (byTopic) return byTopic;
    // Fallback: first unit
    return (units as UnitData[])[0];
  }, [lesson]);

  const handleConversationDone = (
    errors: SessionError[],
    phrases: string[],
    duration: number
  ) => {
    setSessionErrors(errors);
    setPhrasesUsed(phrases);
    setSessionDuration(duration);
    setPhase("summary");
  };

  const handleSave = async (rating: number) => {
    await saveSession({
      lessonId: lesson?._id,
      date: dateParam,
      duration: sessionDuration,
      type: "lesson",
      cardsReviewed: unit?.vocab.length ?? 0,
      cardsCorrect: unit?.vocab.length ?? 0,
      topic: lesson?.topic ?? unit?.theme ?? "Unknown",
      errors: sessionErrors,
      newPhrases: [],
      phrasesUsed,
      rating,
    });
  };

  // Loading state
  if (lesson === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/40">Loading lesson...</p>
      </main>
    );
  }

  if (!lesson || !unit) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/50">No lesson found for {dateParam}</p>
        <a
          href="/"
          className="px-4 py-2 bg-accent rounded-xl text-sm hover:bg-accent/80 transition"
        >
          Back to Home
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col max-w-lg mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-card/50 backdrop-blur sticky top-0 z-10">
        <a
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition text-white/50 hover:text-white"
        >
          <ArrowLeft size={20} />
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">
            Unit {unit.unit}: {unit.theme}
          </h1>
          <p className="text-xs text-white/30">
            {dateParam} · {unit.level}
          </p>
        </div>
      </div>

      {phase !== "summary" && <PhaseIndicator phase={phase} />}

      {phase === "vocab" && (
        <VocabPhase unit={unit} onDone={() => setPhase("exercises")} />
      )}
      {phase === "exercises" && (
        <ExercisesPhase unit={unit} onDone={() => setPhase("conversation")} />
      )}
      {phase === "conversation" && (
        <ConversationPhase
          unit={unit}
          lesson={lesson}
          onDone={handleConversationDone}
        />
      )}
      {phase === "summary" && (
        <SummaryPhase
          unit={unit}
          errors={sessionErrors}
          phrasesUsed={phrasesUsed}
          duration={sessionDuration}
          lesson={lesson}
          onSave={handleSave}
        />
      )}
    </main>
  );
}
