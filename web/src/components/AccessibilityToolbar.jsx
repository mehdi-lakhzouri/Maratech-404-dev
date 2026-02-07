/**
 * AccessibilityToolbar — Floating accessibility controls
 * Features:
 *   • Font size adjustment (A- / A / A+)
 *   • High contrast mode (black/yellow theme for low vision)
 *   • Screen reader announcements
 *   • Keyboard shortcut hints
 */

import { useEffect, useState } from "react";

const FONT_SIZES = [
  { label: "Petit", value: "text-sm", scale: "87.5%" },
  { label: "Normal", value: "text-base", scale: "100%" },
  { label: "Grand", value: "text-lg", scale: "112.5%" },
  { label: "Très grand", value: "text-xl", scale: "125%" },
  { label: "Maximum", value: "text-2xl", scale: "150%" },
];

export default function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontIndex, setFontIndex] = useState(1); // Normal
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Apply font size to document root
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontIndex].scale;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [fontIndex]);

  // Apply high contrast mode
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  // Apply reduced motion
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [reducedMotion]);

  // Keyboard shortcut: Alt+A to toggle toolbar
  useEffect(() => {
    const handleKey = (e) => {
      if (e.altKey && e.key === "a") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const increaseFontSize = () =>
    setFontIndex((i) => Math.min(i + 1, FONT_SIZES.length - 1));
  const decreaseFontSize = () => setFontIndex((i) => Math.max(i - 1, 0));
  const resetFontSize = () => setFontIndex(1);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-tili-600 high-contrast:bg-yellow-400 text-white high-contrast:text-black shadow-lg hover:bg-tili-700 high-contrast:hover:bg-yellow-300 transition-all flex items-center justify-center text-xl"
        aria-label="Ouvrir les paramètres d'accessibilité (Alt+A)"
        title="Accessibilité (Alt+A)"
      >
        ♿
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 bg-white dark:bg-gray-800 high-contrast:bg-black high-contrast:border-yellow-400 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="Paramètres d'accessibilité"
        >
          {/* Header */}
          <div className="bg-tili-600 high-contrast:bg-yellow-500 text-white high-contrast:text-black px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              ♿ Accessibilité
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
              aria-label="Fermer le panneau d'accessibilité"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* ─── Font Size ─── */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 high-contrast:text-yellow-400 uppercase tracking-wide block mb-2">
                Taille du texte
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontIndex === 0}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 high-contrast:border-yellow-400 flex items-center justify-center text-lg font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Réduire la taille du texte"
                >
                  A-
                </button>
                <div className="flex-1 text-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 high-contrast:text-yellow-300">
                    {FONT_SIZES[fontIndex].label}
                  </span>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {FONT_SIZES.map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i <= fontIndex
                            ? "bg-tili-500 high-contrast:bg-yellow-400"
                            : "bg-gray-200 dark:bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={increaseFontSize}
                  disabled={fontIndex === FONT_SIZES.length - 1}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 high-contrast:border-yellow-400 flex items-center justify-center text-lg font-bold disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Augmenter la taille du texte"
                >
                  A+
                </button>
              </div>
              <button
                onClick={resetFontSize}
                className="mt-1 text-xs text-tili-600 dark:text-tili-400 high-contrast:text-yellow-400 hover:underline"
                aria-label="Réinitialiser la taille du texte"
              >
                Réinitialiser
              </button>
            </div>

            {/* ─── High Contrast ─── */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 high-contrast:text-yellow-300">
                  🔲 Contraste élevé
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 high-contrast:text-yellow-500">
                  Noir/jaune pour malvoyants
                </p>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  highContrast
                    ? "bg-yellow-400"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                role="switch"
                aria-checked={highContrast}
                aria-label="Activer le mode contraste élevé"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    highContrast ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {/* ─── Reduced Motion ─── */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 high-contrast:text-yellow-300">
                  ⏸️ Réduire les animations
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 high-contrast:text-yellow-500">
                  Moins de mouvements à l'écran
                </p>
              </div>
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  reducedMotion
                    ? "bg-tili-500 high-contrast:bg-yellow-400"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                role="switch"
                aria-checked={reducedMotion}
                aria-label="Réduire les animations"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    reducedMotion ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>

            {/* ─── Keyboard Shortcuts ─── */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 high-contrast:border-yellow-600">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 high-contrast:text-yellow-400 uppercase tracking-wide">
                Raccourcis clavier
              </span>
              <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400 high-contrast:text-yellow-500">
                <div className="flex justify-between">
                  <span>Page Chat</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                    Alt+1
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Page Documents</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                    Alt+2
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Ouvrir accessibilité</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                    Alt+A
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Thème sombre/clair</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                    Alt+D
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Aide vocale</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                    Alt+H
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Commandes vocales</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                    Alt+V
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Écouter la réponse</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                    🔊 bouton
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Saisie vocale</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                    🎤 bouton
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader live region for announcements */}
      <div
        id="a11y-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

/**
 * Announce a message to screen readers via the live region.
 * Uses a queue to prevent rapid successive calls from dropping messages.
 */
const _announceQueue = [];
let _announceTimer = null;

function _processAnnounceQueue() {
  const el = document.getElementById("a11y-announcer");
  if (!el || _announceQueue.length === 0) {
    _announceTimer = null;
    return;
  }
  const msg = _announceQueue.shift();
  el.textContent = "";
  setTimeout(() => {
    el.textContent = msg;
    // Process next in queue after a short pause
    _announceTimer = setTimeout(_processAnnounceQueue, 600);
  }, 50);
}

export function announce(message) {
  if (!message) return;
  _announceQueue.push(message);
  if (!_announceTimer) {
    _processAnnounceQueue();
  }
}
