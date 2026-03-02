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
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "it-IT";
      u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  }
}

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const sttSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Open with Marco's greeting
  useEffect(() => {
    const opening: ChatMessage = {
      role: "assistant",
      content: `Ciao! ${c.scenario}`,
    };
    setMessages([opening]);
    playTTS(opening.content);
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
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            systemPrompt: c.system_prompt || undefined,
            // Fallback fields for the API's built-in prompt builder
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

        // Parse corrections from JSON block
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
                  const newErrs = (
                    parsed.errors as ConversationError[]
                  ).filter((e) => !existing.has(e.original));
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
              playTTS(cleanContent);
              setTimeout(() => finishConversation(allErrors, finalMsgs), 1500);
              return;
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
          { role: "assistant", content: `Error: ${errMsg}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, c, usedPhrases, errors, finishConversation],
  );

  const handleEndConversation = () => {
    finishConversation(errors, messages);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    if (!sttSupported) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
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
    <div className="flex flex-col h-[70vh]">
      {/* Scenario header */}
      <div className="px-4 py-3 bg-gradient-to-r from-teal-900/30 to-teal-800/10 border-b border-teal-500/10 rounded-t-2xl">
        <p className="text-sm font-medium text-teal-300">{c.scenario}</p>
        {c.grammar_focus && (
          <p className="text-xs text-white/40 mt-0.5">
            Focus: {c.grammar_focus}
          </p>
        )}
      </div>

      {/* Phrase progress */}
      {c.target_phrases.length > 0 && (
        <div className="px-4 py-2 border-b border-white/5 bg-card/30">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full">
              <div
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{
                  width: `${(usedPhrases.size / c.target_phrases.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-white/30">
              {usedPhrases.size}/{c.target_phrases.length} phrases
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "bg-teal-900/30 border border-teal-500/20 self-start"
                  : "bg-accent/20 border border-accent/20 self-end ml-auto",
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-teal-300 text-xs font-medium">
                    Marco
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
            {msg.correction && (
              <div className="max-w-[85%] ml-auto mt-1 bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2 text-xs">
                <p className="text-danger">
                  {msg.correction.original}
                </p>
                <p className="text-success">
                  {msg.correction.corrected}
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
              Marco
            </span>
            <div className="flex gap-1">
              <span className="animate-bounce">·</span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0.1s" }}
              >
                ·
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0.2s" }}
              >
                ·
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Target phrase chips */}
      {c.target_phrases.length > 0 && (
        <div className="px-4 py-2 border-t border-white/5 overflow-x-auto">
          <div className="flex gap-1.5 pb-1">
            {c.target_phrases.map((phrase) => {
              const used = usedPhrases.has(phrase);
              return (
                <button
                  key={phrase}
                  onClick={() => !used && insertPhrase(phrase)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition border",
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
            End conversation
          </button>
        </div>
      )}
    </div>
  );
}
