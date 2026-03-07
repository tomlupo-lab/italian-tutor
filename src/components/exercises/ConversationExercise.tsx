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
import { apiPath } from "@/lib/paths";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Check, Mic, Send, Square, Volume2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  correction?: { original: string; corrected: string; explanation: string };
}

interface Props {
  content: unknown;
  onComplete: (result: ExerciseResult) => void;
}

interface ActiveMissionResult {
  missionId: string;
  title: string;
  summary: string;
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const options = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  return options.find((t) => MediaRecorder.isTypeSupported?.(t));
}

export default function ConversationExercise({ content, onComplete }: Props) {
  const c = content as ConversationContent;
  const activeMission = useQuery(api.missions.getActiveMission, {}) as ActiveMissionResult | null | undefined;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedPhrases, setUsedPhrases] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<ConversationError[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioPending, setAudioPending] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [tapToPlayText, setTapToPlayText] = useState("");

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagLines, setDiagLines] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const diagSessionIdRef = useRef("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ttsRequestIdRef = useRef(0);

  const micSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";

  const logDiagnostic = useCallback(
    (event: string, data: Record<string, unknown> = {}) => {
      const ts = new Date().toISOString();
      if (showDiagnostics) {
        setDiagLines((prev) => [...prev.slice(-9), `${ts.slice(11, 19)} ${event}`]);
      }
      const payload = {
        source: "conversation_mediarec",
        event,
        session_id: diagSessionIdRef.current || "unset",
        data,
      };
      console.info("[mediarec-diag]", payload);
      void fetch(apiPath("/api/client-log"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
    },
    [showDiagnostics],
  );

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
    async (text: string, userInitiated = false) => {
      if (!text.trim()) return;
      const requestId = ++ttsRequestIdRef.current;
      stopAudioPlayback();
      setAudioPending(true);
      setTapToPlayText("");

      try {
        const res = await fetch(apiPath("/api/tts"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (requestId !== ttsRequestIdRef.current) return;
        if (!res.ok) throw new Error("tts_failed");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audioRef.current = audio;
        audioUrlRef.current = url;

        audio.onended = () => {
          if (audioRef.current === audio) audioRef.current = null;
          if (audioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            audioUrlRef.current = null;
          }
          setAudioPending(false);
        };

        audio.onerror = () => {
          if (audioRef.current === audio) audioRef.current = null;
          if (audioUrlRef.current === url) {
            URL.revokeObjectURL(url);
            audioUrlRef.current = null;
          }
          setAudioPending(false);
        };

        await audio.play();
      } catch {
        if (requestId !== ttsRequestIdRef.current) return;
        if (userInitiated && typeof window !== "undefined" && window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "it-IT";
          u.rate = 0.92;
          u.onend = () => setAudioPending(false);
          u.onerror = () => {
            setAudioPending(false);
            setTapToPlayText(text);
          };
          window.speechSynthesis.cancel();
          try {
            window.speechSynthesis.speak(u);
          } catch {
            setAudioPending(false);
            setTapToPlayText(text);
          }
          return;
        }
        setAudioPending(false);
        setTapToPlayText(text);
      }
    },
    [stopAudioPlayback],
  );

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
        messages: finalMessages.map((m) => ({ role: m.role, content: m.content })) as ConversationMessage[],
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
        const res = await fetch(apiPath("/api/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            systemPrompt: [
              c.system_prompt,
              activeMission
                ? `Active mission: ${activeMission.title}. ${activeMission.summary} Keep dialogue immersive, goal-driven, and corrective.`
                : "Continuous mission mode: adapt to learner errors and move toward practical task completion.",
            ]
              .filter(Boolean)
              .join("\n\n"),
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
                  const newErrs = (parsed.errors as ConversationError[]).filter((e) => !existing.has(e.original));
                  return [...prev, ...newErrs];
                });
              }
              const allErrors = [
                ...errors,
                ...(parsed.correction ? [parsed.correction] : []),
                ...((parsed.errors as ConversationError[]) || []),
              ];
              const assistantMsg: ChatMessage = { role: "assistant", content: cleanContent, correction };
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

        const assistantMsg: ChatMessage = { role: "assistant", content: cleanContent, correction };
        setMessages((prev) => [...prev, assistantMsg]);
        void playAssistantAudio(cleanContent);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errMsg}` }]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      messages,
      c,
      usedPhrases,
      errors,
      finishConversation,
      playAssistantAudio,
    ],
  );

  const stopMediaTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const transcribeRecording = useCallback(
    async (blob: Blob) => {
      if (!blob || blob.size < 800) {
        logDiagnostic("stt_blob_too_small", { size: blob?.size || 0 });
        return;
      }
      setIsTranscribing(true);
      logDiagnostic("stt_transcribe_start", { size: blob.size, type: blob.type });
      try {
        const form = new FormData();
        const ext = blob.type.includes("mp4") ? "m4a" : "webm";
        form.append("audio", new File([blob], `recording.${ext}`, { type: blob.type || "audio/webm" }));
        form.append("language", "it");

        const res = await fetch(apiPath("/api/stt"), {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `stt_${res.status}`);
        }

        const text = String(data.text || "").trim();
        logDiagnostic("stt_transcribe_done", { len: text.length });
        setTranscript(text);
        if (text) {
          void sendMessage(text);
        }
      } catch (err) {
        logDiagnostic("stt_transcribe_error", {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setIsTranscribing(false);
      }
    },
    [logDiagnostic, sendMessage],
  );

  const stopRecording = useCallback(() => {
    logDiagnostic("stt_stop_requested", { has_rec: Boolean(mediaRecorderRef.current) });
    const rec = mediaRecorderRef.current;
    if (!rec) {
      setIsRecording(false);
      stopMediaTracks();
      return;
    }
    try {
      if (rec.state !== "inactive") {
        rec.stop();
      }
    } catch {
      // ignore recorder stop race
    }
    setIsRecording(false);
  }, [logDiagnostic, stopMediaTracks]);

  const startRecording = useCallback(async () => {
    if (!micSupported || loading || isTranscribing) {
      logDiagnostic("stt_start_blocked", {
        mic_supported: micSupported,
        loading,
        is_transcribing: isTranscribing,
      });
      return;
    }

    stopAudioPlayback();
    setTranscript("");
    recordedChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const mimeType = pickRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        logDiagnostic("stt_recorder_error", {
          name: event.error?.name || "unknown",
          message: event.error?.message || "",
        });
        setIsRecording(false);
        stopMediaTracks();
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        logDiagnostic("stt_recording_stopped", { size: blob.size, type: blob.type });
        stopMediaTracks();
        void transcribeRecording(blob);
      };

      recorder.start(250);
      setIsRecording(true);
      logDiagnostic("stt_start_ok", { mime: recorder.mimeType || "unknown" });
    } catch (err) {
      logDiagnostic("stt_start_error", {
        error: err instanceof Error ? err.message : String(err),
      });
      setIsRecording(false);
      stopMediaTracks();
    }
  }, [
    isTranscribing,
    loading,
    logDiagnostic,
    micSupported,
    stopAudioPlayback,
    stopMediaTracks,
    transcribeRecording,
  ]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const debugEnabled = search.includes("sttDebug=1");
    setShowDiagnostics(debugEnabled);
    diagSessionIdRef.current = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    logDiagnostic("diag_init", {
      mic_supported: micSupported,
      user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
      debug_enabled: debugEnabled,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // ignore
      }
      stopMediaTracks();
      stopAudioPlayback();
      logDiagnostic("diag_unmount");
    };
  }, [logDiagnostic, stopAudioPlayback, stopMediaTracks]);

  useEffect(() => {
    if (!c?.scenario) return;
    const opening: ChatMessage = { role: "assistant", content: `Ciao! ${c.scenario}` };
    setMessages([opening]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!c?.scenario || !Array.isArray(c?.target_phrases)) {
    return <div className="bg-card rounded-2xl border border-white/10 p-5 text-white/50 text-sm">Exercise data missing</div>;
  }

  const handleEndConversation = () => {
    finishConversation(errors, messages);
  };

  const insertPhrase = (phrase: string) => {
    setInput((prev) => (prev ? `${prev} ${phrase}` : phrase));
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 w-full max-w-[430px] mx-auto rounded-2xl border border-white/10 bg-card/20 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-teal-900/30 to-teal-800/10 border-b border-teal-500/10 rounded-t-2xl">
        <p className="text-sm font-medium text-teal-300">{c.scenario}</p>
        {c.grammar_focus && <p className="text-xs text-white/40 mt-0.5">Focus: {c.grammar_focus}</p>}
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
                    onClick={() => void playAssistantAudio(msg.content, true)}
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

      {(isRecording || isTranscribing) && (
        <div className="px-4 py-2 bg-danger/10 border-t border-danger/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-xs text-danger font-medium">
              {isRecording ? "Recording..." : "Transcribing..."}
            </span>
          </div>
          {transcript && <p className="text-sm text-white/70 mt-1 italic">{transcript}</p>}
        </div>
      )}

      {tapToPlayText && !isRecording && !isTranscribing && (
        <div className="px-4 py-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => void playAssistantAudio(tapToPlayText, true)}
            className="w-full py-2 rounded-xl bg-teal-900/30 border border-teal-500/30 text-teal-200 text-sm hover:bg-teal-900/40 transition"
          >
            Tap to play assistant audio
          </button>
        </div>
      )}

      {showDiagnostics && diagLines.length > 0 && (
        <div className="px-4 pb-2 text-[10px] text-white/45 border-t border-white/5">
          {diagLines.map((line, idx) => (
            <div key={`${line}-${idx}`}>{line}</div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && !loading && !isTranscribing && !isRecording) {
            void sendMessage(input.trim());
          }
        }}
        className="px-4 py-3 border-t border-white/5 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi in italiano..."
          className="flex-1 bg-card border border-white/10 rounded-xl px-4 py-3 text-[16px] focus:outline-none focus:border-accent/50 transition"
          disabled={loading || isRecording || isTranscribing}
        />
        {micSupported && (
          <button
            type="button"
            onClick={toggleRecording}
            disabled={loading || isTranscribing}
            className={cn(
              "p-3 rounded-xl transition disabled:opacity-40",
              isRecording
                ? "bg-danger/30 hover:bg-danger/40 text-danger"
                : "bg-white/5 hover:bg-white/10",
            )}
            aria-label={isRecording ? "Stop recording" : "Start voice recording"}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
        <button
          type="submit"
          disabled={!input.trim() || loading || isRecording || isTranscribing}
          className="p-3 bg-accent rounded-xl disabled:opacity-30 hover:bg-accent/80 transition"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
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
