/**
 * SignLanguagePanel — Visual sign-language panel for deaf users.
 *
 * Displays AI-simplified sentences one at a time with:
 * - Large emoji + text per sentence
 * - Animated teleprompter effect (auto-advance)
 * - Play / Pause / Previous / Next / Speed controls
 * - Full sentence list overview
 * - Color-coded progress bar
 */

import { useCallback, useEffect, useRef, useState } from "react";

const SPEEDS = [
  { label: "Lent", ms: 5000 },
  { label: "Normal", ms: 3000 },
  { label: "Rapide", ms: 1800 },
];

export default function SignLanguagePanel({ sentences, filename, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1); // Normal
  const [showAll, setShowAll] = useState(false);
  const timerRef = useRef(null);

  const speed = SPEEDS[speedIdx];
  const total = sentences.length;
  const current = sentences[currentIdx] || { emoji: "💬", text: "" };
  const progress = total > 0 ? ((currentIdx + 1) / total) * 100 : 0;

  // Auto-advance timer
  useEffect(() => {
    if (isPlaying && total > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= total - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed.ms);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed.ms, total]);

  const goNext = useCallback(() => {
    setCurrentIdx((prev) => Math.min(prev + 1, total - 1));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIdx((prev) => Math.max(prev - 1, 0));
  }, []);

  const restart = useCallback(() => {
    setCurrentIdx(0);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((prev) => (prev + 1) % SPEEDS.length);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, togglePlay, onClose]);

  if (!sentences || sentences.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        <p className="text-sm">Aucune phrase simplifiée disponible.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50 overflow-hidden"
      role="region"
      aria-label="Panneau de langue des signes"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-purple-100/50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800/50">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">
            🤟
          </span>
          <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            Mode Langue des Signes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs px-2 py-1 rounded-lg bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors"
            aria-label={
              showAll ? "Afficher phrase par phrase" : "Voir toutes les phrases"
            }
          >
            {showAll ? "📖 Lecture" : "📋 Tout voir"}
          </button>
          <button
            onClick={onClose}
            className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200 transition-colors p-1"
            aria-label="Fermer le panneau langue des signes"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-purple-100 dark:bg-purple-900/50">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentIdx + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Phrase ${currentIdx + 1} sur ${total}`}
        />
      </div>

      {showAll ? (
        /* ─── Full list view ─── */
        <div className="px-4 py-3 max-h-64 overflow-y-auto space-y-2">
          {sentences.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIdx(i);
                setShowAll(false);
              }}
              className={`w-full text-left flex items-start gap-3 px-3 py-2 rounded-lg transition-colors ${
                i === currentIdx
                  ? "bg-purple-200 dark:bg-purple-800/50"
                  : "hover:bg-purple-100 dark:hover:bg-purple-900/30"
              }`}
            >
              <span className="text-xl shrink-0" aria-hidden="true">
                {s.emoji}
              </span>
              <span className="text-sm text-gray-800 dark:text-gray-200">
                {s.text}
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* ─── Teleprompter view ─── */
        <div className="px-6 py-8 text-center min-h-[140px] flex flex-col items-center justify-center">
          {/* Counter */}
          <div className="text-xs text-purple-500 dark:text-purple-400 mb-3 font-medium">
            {currentIdx + 1} / {total}
          </div>

          {/* Big emoji */}
          <div
            className="text-6xl mb-4 transition-all duration-500 transform"
            key={`emoji-${currentIdx}`}
            style={{ animation: "fadeInUp 0.4s ease-out" }}
            aria-hidden="true"
          >
            {current.emoji}
          </div>

          {/* Sentence */}
          <p
            className="text-xl font-semibold text-gray-800 dark:text-gray-100 max-w-lg leading-relaxed transition-all duration-500"
            key={`text-${currentIdx}`}
            style={{ animation: "fadeInUp 0.4s ease-out 0.1s both" }}
            aria-live="polite"
          >
            {current.text}
          </p>
        </div>
      )}

      {/* Controls */}
      {!showAll && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-purple-100/30 dark:bg-purple-900/20 border-t border-purple-200 dark:border-purple-800/50">
          {/* Restart */}
          <button
            onClick={restart}
            className="p-2 rounded-lg text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
            aria-label="Recommencer"
            title="Recommencer"
          >
            ⏮️
          </button>

          {/* Previous */}
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="p-2 rounded-lg text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-30"
            aria-label="Phrase précédente"
            title="Précédent (←)"
          >
            ◀️
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className={`p-3 rounded-xl font-medium text-sm transition-all shadow-sm ${
              isPlaying
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 border border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            }`}
            aria-label={isPlaying ? "Pause" : "Lecture"}
            title={isPlaying ? "Pause (Espace)" : "Lecture (Espace)"}
          >
            {isPlaying ? "⏸️ Pause" : "▶️ Lecture"}
          </button>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={currentIdx >= total - 1}
            className="p-2 rounded-lg text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-30"
            aria-label="Phrase suivante"
            title="Suivant (→)"
          >
            ▶️
          </button>

          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200 hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors"
            aria-label={`Vitesse: ${speed.label}. Cliquez pour changer.`}
            title={`Vitesse: ${speed.label}`}
          >
            ⚡ {speed.label}
          </button>
        </div>
      )}

      {/* CSS animation inline */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
