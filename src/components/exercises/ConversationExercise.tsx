"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConversationContent,
  ConversationError,
  ConversationMessage,
  ConversationResult,
  ExerciseResult,
} from "@/lib/exerciseTypes";
import { cn } from "@/lib/cn";
import { Check, Mic, Send, Volume2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  correction?: { original: string; corrected: string; explanation: string };
}

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

export default function ConversationExercise({ content, onComplete }: Props) {
  const c = content as ConversationContent;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedPhrases, setUsedPhrases] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<ConversationError[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioPending, setAudioPending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const recognitionWantedRef = useRef(false);
  const recognitionRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedTranscriptRef = useRef("");
  const micToggleLockRef = useRef(false);
  const lastToggleAtRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ttsRequestIdRef = useRef(0);

  const sttSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopAudioPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAudioPending(false);
  }, []);

  const playAssistantAudio = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const requestId = ++ttsRequestIdRef.current;
      stopAudioPlayback();
      setAudioPending(true);

      try {
        const res = await fetch("/tutor/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (requestId !== ttsRequestIdRef.current) return;

        if (!res.ok) {
          throw new Error("tts_failed");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audioRef.current = audio;
        audioUrlRef.current = url;

        audio.onended = () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
          if (audioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            audioUrlRef.current = null;
          }
          setAudioPending(false);
        };

        audio.onerror = () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
          if (audioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            audioUrlRef.current = null;
          }
          setAudioPending(false);
        };

        await audio.play();
      } catch {
        if (requestId !== ttsRequestIdRef.current) return;
        if (typeof window !== "undefined" && window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "it-IT";
          u.rate = 0.92;
          u.onend = () => setAudioPending(false);
          u.onerror = () => setAudioPending(false);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
          return;
        }
        setAudioPending(false);
      }
    },
    [stopAudioPlayback],
  );

  const clearRecognitionRestartTimer = useCallback(() => {
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }
  }, []);

  const createRecognition = useCallback(() => {
    if (!sttSupported) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.lang = "it-IT";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const segment = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          finalText += segment;
        } else {
          interimText += segment;
        }
      }
      if (finalText) {
        committedTranscriptRef.current = `${committedTranscriptRef.current} ${finalText}`.trim();
      }
      const merged = `${committedTranscriptRef.current} ${interimText}`.trim();
      setTranscript(merged);
    };

    recognition.onerror = () => {
      // On recoverable errors, onend will run and we auto-restart if user still wants recording.
      if (!recognitionWantedRef.current) {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!recognitionWantedRef.current) {
        setIsRecording(false);
        return;
      }
      clearRecognitionRestartTimer();
      recognitionRestartTimerRef.current = setTimeout(() => {
        if (!recognitionWantedRef.current || loading) return;
        const next = createRecognition();
        if (!next) {
          setIsRecording(false);
          return;
        }
        try {
          next.start();
          recognitionRef.current = next;
          setIsRecording(true);
        } catch {
          setIsRecording(false);
        }
      }, 180);
    };

    return recognition;
  }, [clearRecognitionRestartTimer, loading, sttSupported]);

  const stopRecording = useCallback(() => {
    recognitionWantedRef.current = false;
    clearRecognitionRestartTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop race
      }
    }
    recognitionRef.current = null;
    setIsRecording(false);
  }, [clearRecognitionRestartTimer]);

  const startRecording = useCallback(() => {
    if (!sttSupported || loading) return;
    recognitionWantedRef.current = true;
    committedTranscriptRef.current = "";
    setTranscript("");
    clearRecognitionRestartTimer();

    const recognition = createRecognition();
    if (!recognition) {
      recognitionWantedRef.current = false;
      setIsRecording(false);
      return;
    }

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch {
      recognitionWantedRef.current = false;
      setIsRecording(false);
    }
  }, [clearRecognitionRestartTimer, createRecognition, loading, sttSupported]);

  const toggleRecording = useCallback(() => {
    const now = Date.now();
    if (micToggleLockRef.current || now - lastToggleAtRef.current < 320) {
      return;
    }
    micToggleLockRef.current = true;
    lastToggleAtRef.current = now;
    setTimeout(() => {
      micToggleLockRef.current = false;
    }, 300);

    if (isRecording || recognitionWantedRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      recognitionWantedRef.current = false;
      clearRecognitionRestartTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop race on unmount
        }
      }
      stopAudioPlayback();
    };
  }, [clearRecognitionRestartTimer, stopAudioPlayback]);

  // Open with Marco's greeting
  useEffect(() => {
    if (!c?.scenario) return;
    const opening: ChatMessage = {
      role: "assistant",
      content: `Ciao! ${c.scenario}`,
    };
    setMessages([opening]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPhrasesUsed = (text: string) => {
    const lower = text.toLowerCase();
    const newUsed = new Set(usedPhrases);
    for (const phrase of c.target_phrases) {
      if (lower.includes(phrase.toLowerCase())) {
        newUsed.add(phrase);
      }
    }
    setUsedPhrases(newUsed);
  };

  const finishConversation = useCallback(
    (finalErrors: ConversationError[], finalMessages: ChatMessage[]) => {
      const result: ConversationResult = {
        messages: finalMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })) as ConversationMessage[],
        errors: finalErrors,
        duration_ms: Date.now() - startTimeRef.current,
      };
      onComplete(result);
    },
    [onComplete],
  );

  const sendMessage = useCallback(
    async (userMsg: string) => {
      const userMessage: ChatMessage = { role: "user", content: userMsg };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      setLoading(true);
      checkPhrasesUsed(userMsg);

      try {
        const res = await fetch("/tutor/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            systemPrompt: c.system_prompt || undefined,
            lessonType: "structured_unit",
            scenarioTitle: c.scenario,
            scenarioSetup: c.scenario,
            scenarioGoal: `Practice: ${c.target_phrases.join(", ")}`,
            targetPhrases: c.target_phrases.map((p) => ({ it: p, en: "" })),
            grammarFocus: c.grammar_focus || "",
            level: c.difficulty || "A2",
            unitNumber: 0,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const rawContent = data.content as string;

        const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)```/);
        let correction: ChatMessage["correction"] | undefined;
        let cleanContent = rawContent;

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            cleanContent = rawContent.replace(/```json[\s\S]*?```/, "").trim();

            if (parsed.correction) {
              correction = parsed.correction;
              setErrors((prev) => [...prev, parsed.correction]);
            }
            if (parsed.done) {
              if (parsed.errors) {
                setErrors((prev) => {
                  const existing = new Set(prev.map((e) => e.original));
                  const newErrs = (parsed.errors as ConversationError[]).filter(
                    (e) => !existing.has(e.original),
                  );
                  return [...prev, ...newErrs];
                });
              }
              const allErrors = [
                ...errors,
                ...(parsed.correction ? [parsed.correction] : []),
                ...((parsed.errors as ConversationError[]) || []),
              ];
              const assistantMsg: ChatMessage = {
                role: "assistant",
                content: cleanContent,
                correction,
              };
              const finalMsgs = [...newMessages, assistantMsg];
              setMessages(finalMsgs);
              void playAssistantAudio(cleanContent);
              setTimeout(() => finishConversation(allErrors, finalMsgs), 1500);
              return;
            }
          } catch {
            // ignore parse errors
          }
        }

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: cleanContent,
          correction,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        void playAssistantAudio(cleanContent);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${errMsg}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, c, usedPhrases, errors, finishConversation, playAssistantAudio],
  );

  if (!c?.scenario || !Array.isArray(c?.target_phrases)) {
    return (
      <div className="bg-card rounded-2xl border border-white/10 p-5 text-white/50 text-sm">
        Exercise data missing
      </div>
    );
  }

  const handleEndConversation = () => {
    finishConversation(errors, messages);
  };

  const sendTranscript = () => {
    const text = transcript.trim();
    if (!text) return;
    stopRecording();
    setTranscript("");
    committedTranscriptRef.current = "";
    void sendMessage(text);
  };

  const insertPhrase = (phrase: string) => {
    setInput((prev) => (prev ? `${prev} ${phrase}` : phrase));
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full max-w-[430px] mx-auto rounded-2xl border border-white/10 bg-card/20 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-teal-900/30 to-teal-800/10 border-b border-teal-500/10 rounded-t-2xl">
        <p className="text-sm font-medium text-teal-300">{c.scenario}</p>
        {c.grammar_focus && (
          <p className="text-xs text-white/40 mt-0.5">Focus: {c.grammar_focus}</p>
        )}
      </div>

      {c.target_phrases.length > 0 && (
        <div className="px-4 py-2 border-b border-white/5 bg-card/30">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: `${(usedPhrases.size / c.target_phrases.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/30">
              {usedPhrases.size}/{c.target_phrases.length} phrases
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words",
                msg.role === "assistant"
                  ? "bg-teal-900/30 border border-teal-500/20 self-start"
                  : "bg-accent/20 border border-accent/20 self-end ml-auto",
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-teal-300 text-xs font-medium">Marco</span>
                  <button
                    onClick={() => {
                      void playAssistantAudio(msg.content);
                    }}
                    className="text-white/30 hover:text-teal-300 transition p-0.5"
                    aria-label="Play message audio"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.correction && (
              <div className="max-w-[85%] ml-auto mt-1 bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2 text-xs break-words">
                <p className="text-danger">{msg.correction.original}</p>
                <p className="text-success">{msg.correction.corrected}</p>
                <p className="text-white/40 mt-0.5">{msg.correction.explanation}</p>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="bg-teal-900/30 border border-teal-500/20 rounded-2xl px-4 py-3 self-start max-w-[85%]">
            <span className="text-teal-300 text-xs font-medium block mb-1">Marco</span>
            <div className="flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
                .
              </span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                .
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {c.target_phrases.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5">
          <div className="flex flex-wrap gap-1.5 pb-1">
            {c.target_phrases.map((phrase) => {
              const used = usedPhrases.has(phrase);
              return (
                <button
                  key={phrase}
                  onClick={() => !used && insertPhrase(phrase)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs whitespace-normal break-words max-w-full transition border",
                    used
                      ? "bg-success/20 border-success/30 text-success"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 active:scale-95",
                  )}
                >
                  {used && <Check size={10} className="inline mr-1" />}
                  {phrase}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isRecording && (
        <div className="px-4 py-2 bg-danger/10 border-t border-danger/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-xs text-danger font-medium">Recording...</span>
          </div>
          {transcript && <p className="text-sm text-white/70 mt-1 italic">{transcript}</p>}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isRecording && transcript.trim()) sendTranscript();
          else if (input.trim() && !loading) void sendMessage(input.trim());
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
                disabled={loading}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition disabled:opacity-40"
                aria-label="Start voice recording"
              >
                <Mic size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-accent rounded-xl disabled:opacity-30 hover:bg-accent/80 transition"
              aria-label="Send message"
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
              aria-label="Stop recording"
            >
              ✕
            </button>
            <div className="flex-1 flex items-center justify-center text-sm text-white/40 px-2 truncate">
              {transcript ? transcript.slice(-80) : "Parla..."}
            </div>
            <button
              type="button"
              onClick={sendTranscript}
              disabled={!transcript.trim() || loading}
              className="p-3 bg-accent rounded-xl disabled:opacity-30 hover:bg-accent/80 transition"
              aria-label="Send recorded message"
            >
              <Send size={18} />
            </button>
          </>
        )}
      </form>

      {audioPending && (
        <div className="px-4 pb-1 text-[11px] text-teal-300/70">Playing audio...</div>
      )}

      {messages.length >= 4 && (
        <div className="px-4 pb-3">
          <button
            onClick={handleEndConversation}
            className="w-full py-2 text-xs text-white/30 hover:text-white/60 transition"
          >
            End conversation
          </button>
        </div>
      )}
    </div>
  );
}
