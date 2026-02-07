/**
 * AudioOnboarding — First-visit modal that asks if the user wants audio mode.
 *
 * On first ever visit:
 *   1. Speaks a question via TTS: "Bienvenue sur TILI. Voulez-vous activer le mode audio?"
 *   2. Listens for "oui" / "yes" or "non" / "no" via STT
 *   3. Also shows visual buttons for sighted users
 *   4. Stores choice in localStorage so it never shows again
 *
 * If audio mode is confirmed → parent enables voice commands + TTS announcements.
 * If declined → normal visual usage.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tili_audio_onboarding_done";
const MODE_KEY = "tili_audio_mode";

/**
 * Check if onboarding has already been completed.
 */
export function isOnboardingDone() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Check if audio mode was chosen.
 */
export function isAudioModeEnabled() {
  try {
    return localStorage.getItem(MODE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * AudioOnboarding component.
 * @param {object} props
 * @param {(audioMode: boolean) => void} props.onComplete - Called when user makes a choice
 */
export default function AudioOnboarding({ onComplete }) {
  const [phase, setPhase] = useState("intro"); // intro → listening → done
  const [heard, setHeard] = useState("");
  const [countdown, setCountdown] = useState(null);
  const recognitionRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const timeoutRef = useRef(null);

  // ─── TTS: speak the welcome question ───
  const speakQuestion = useCallback(() => {
    if (hasSpokenRef.current) return;
    hasSpokenRef.current = true;

    const synth = window.speechSynthesis;
    if (!synth) return;

    // Cancel anything playing
    synth.cancel();

    const msg = new SpeechSynthesisUtterance(
      "Bienvenue sur TILI, votre assistant documentaire accessible. " +
        "Souhaitez-vous activer le mode audio pour contrôler la plateforme à la voix ? " +
        "Dites oui, ou appuyez sur le bouton oui.",
    );
    msg.lang = "fr-FR";
    msg.rate = 0.95;

    // Try to find a French voice
    const voices = synth.getVoices();
    const frVoice =
      voices.find((v) => v.lang.startsWith("fr") && v.localService) ||
      voices.find((v) => v.lang.startsWith("fr"));
    if (frVoice) msg.voice = frVoice;

    msg.onend = () => {
      // After speaking, start listening
      setPhase("listening");
      startListening();
    };

    synth.speak(msg);
  }, []);

  // ─── STT: listen for oui/non ───
  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Auto-timeout after 10 seconds of no speech
    timeoutRef.current = setTimeout(() => {
      // If no answer after 10s, show visual-only mode
      setPhase("timeout");
    }, 10000);

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript.trim().toLowerCase();
        setHeard(text);

        if (event.results[i].isFinal) {
          clearTimeout(timeoutRef.current);
          const normalized = text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          if (
            normalized.includes("oui") ||
            normalized.includes("yes") ||
            normalized.includes("ok") ||
            normalized.includes("d'accord") ||
            normalized.includes("daccord") ||
            normalized.includes("bien sur") ||
            normalized.includes("confirme") ||
            normalized.includes("activer") ||
            normalized.includes("active")
          ) {
            handleChoice(true);
            return;
          }

          if (
            normalized.includes("non") ||
            normalized.includes("no") ||
            normalized.includes("pas") ||
            normalized.includes("refuse") ||
            normalized.includes("annule")
          ) {
            handleChoice(false);
            return;
          }

          // Didn't understand — ask again
          setPhase("retry");
          speakRetry();
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        // Silent — go to timeout
        setPhase("timeout");
        clearTimeout(timeoutRef.current);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn("[AudioOnboarding] STT start error:", e);
    }
  }, []);

  const speakRetry = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();

    const msg = new SpeechSynthesisUtterance(
      "Je n'ai pas compris. Dites oui pour le mode audio, ou non pour le mode normal.",
    );
    msg.lang = "fr-FR";
    msg.rate = 0.95;
    msg.onend = () => {
      setPhase("listening");
      startListening();
    };
    synth.speak(msg);
  }, [startListening]);

  // ─── Handle user's choice ───
  const handleChoice = useCallback(
    (audioMode) => {
      // Stop any ongoing speech/recognition
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      clearTimeout(timeoutRef.current);

      // Persist
      try {
        localStorage.setItem(STORAGE_KEY, "true");
        localStorage.setItem(MODE_KEY, audioMode ? "true" : "false");
      } catch {}

      // Confirm via TTS
      const synth = window.speechSynthesis;
      if (synth && audioMode) {
        const msg = new SpeechSynthesisUtterance(
          "Mode audio activé. Vous pouvez contrôler TILI à la voix. Dites aide pour la liste des commandes.",
        );
        msg.lang = "fr-FR";
        msg.rate = 0.95;
        synth.speak(msg);
      }

      // Start countdown then complete
      setPhase("done");
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(interval);
          onComplete(audioMode);
        } else {
          setCountdown(count);
        }
      }, 1000);
    },
    [onComplete],
  );

  // ─── Auto-speak on mount ───
  useEffect(() => {
    // Small delay to let the page render first
    const timer = setTimeout(() => {
      speakQuestion();
    }, 800);

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutRef.current);
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [speakQuestion]);

  // ─── Keyboard support ───
  useEffect(() => {
    const handler = (e) => {
      if (phase === "done") return;
      if (e.key === "o" || e.key === "O" || e.key === "Enter") {
        e.preventDefault();
        handleChoice(true);
      }
      if (e.key === "n" || e.key === "N" || e.key === "Escape") {
        e.preventDefault();
        handleChoice(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleChoice]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Configuration du mode d'accessibilité"
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-tili-900/90 via-gray-900/85 to-tili-800/90 backdrop-blur-md" />

      {/* Decorative background circles */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-tili-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-tili-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tili-500/5 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative max-w-xl w-full mx-4 animate-slideUp">
        {/* Glass card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] border border-white/20 dark:border-gray-700/50 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-tili-500 via-blue-400 to-tili-600" />

          <div className="px-8 pt-8 pb-10 space-y-7">
            {/* Logo + Icon area */}
            <div className="flex flex-col items-center space-y-4">
              {/* Animated icon with pulse rings */}
              <div className="relative">
                <div className="absolute inset-0 bg-tili-500/20 rounded-full animate-pulseRing" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-tili-500 to-tili-700 rounded-full flex items-center justify-center shadow-lg shadow-tili-500/30 animate-float">
                  {phase === "done" ? (
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : phase === "listening" || phase === "retry" ? (
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Bienvenue sur{" "}
                  <span className="text-tili-600 dark:text-tili-400">TILI</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Assistant Documentaire IA — Accessible
                </p>
              </div>
            </div>

            {/* ─── Active phases: intro / listening / retry / timeout ─── */}
            {phase !== "done" && (
              <>
                {/* Separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                    Mode d'utilisation
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Question */}
                <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed text-center">
                  Souhaitez-vous activer le{" "}
                  <span className="font-semibold text-tili-600 dark:text-tili-400">
                    mode audio
                  </span>{" "}
                  pour contrôler la plateforme entièrement à la voix ?
                </p>

                {/* Status indicator */}
                <div className="flex justify-center">
                  <div
                    className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      phase === "intro"
                        ? "bg-tili-50 dark:bg-tili-900/40 text-tili-700 dark:text-tili-300"
                        : phase === "listening"
                          ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : phase === "retry"
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {phase === "intro" && (
                      <>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tili-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tili-500" />
                        </span>
                        Lecture en cours...
                      </>
                    )}
                    {phase === "listening" && (
                      <>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                        Dites « Oui » ou « Non »
                      </>
                    )}
                    {phase === "retry" && (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                          />
                        </svg>
                        Pas compris, réessayez...
                      </>
                    )}
                    {phase === "timeout" && "Utilisez les boutons ci-dessous"}
                  </div>
                </div>

                {/* Heard transcript */}
                {heard && phase === "listening" && (
                  <p className="text-center text-sm text-gray-400 dark:text-gray-500 italic">
                    Entendu : « {heard} »
                  </p>
                )}

                {/* Choice buttons */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <button
                    onClick={() => handleChoice(true)}
                    className="group relative flex flex-col items-center gap-3 px-6 py-5 bg-gradient-to-b from-tili-500 to-tili-700 hover:from-tili-600 hover:to-tili-800 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-tili-500/25 hover:shadow-xl hover:shadow-tili-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-tili-300/50"
                    aria-label="Oui, activer le mode audio (touche O ou Entrée)"
                    autoFocus
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="text-base">Oui, mode audio</div>
                      <div className="text-xs text-white/70 font-normal mt-0.5">
                        Tout contrôler à la voix
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleChoice(false)}
                    className="group relative flex flex-col items-center gap-3 px-6 py-5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold transition-all duration-200 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-gray-300/50"
                    aria-label="Non, mode visuel normal (touche N ou Échap)"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-xl flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-500 transition-colors">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="text-base">Non, mode normal</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                        Navigation classique
                      </div>
                    </div>
                  </button>
                </div>

                {/* Keyboard hints */}
                <div className="flex justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[11px] font-mono shadow-sm">
                      O
                    </kbd>
                    <span>ou</span>
                    <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[11px] font-mono shadow-sm">
                      Entrée
                    </kbd>
                    <span>= Oui</span>
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[11px] font-mono shadow-sm">
                      N
                    </kbd>
                    <span>ou</span>
                    <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[11px] font-mono shadow-sm">
                      Échap
                    </kbd>
                    <span>= Non</span>
                  </span>
                </div>
              </>
            )}

            {/* ─── Phase: done ─── */}
            {phase === "done" && (
              <div className="space-y-5 py-2">
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold text-lg">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    Configuration enregistrée
                  </div>
                </div>
                {countdown !== null && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Chargement dans...
                    </p>
                    <div className="w-14 h-14 rounded-full bg-tili-100 dark:bg-tili-900/40 flex items-center justify-center">
                      <span className="text-2xl font-bold text-tili-600 dark:text-tili-400">
                        {countdown}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
