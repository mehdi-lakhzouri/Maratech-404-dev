/**
 * VoiceCommandIndicator — Floating UI showing voice command mode is active.
 * Displays a pulsing microphone + the last recognized command.
 */

import { useEffect, useState } from "react";

const ACTION_LABELS = {
  NAV_CHAT: "→ Chat",
  NAV_DOCS: "→ Documents",
  HELP: "Aide",
  CHAT_ASK: "Question…",
  CHAT_RESET: "Nouvelle conversation",
  CHAT_LISTEN: "Lecture réponse",
  STOP_SPEECH: "Arrêt lecture",
  DOC_SUMMARIZE: "Résumé…",
  DOC_IMAGES: "Images…",
  DOC_UPLOAD: "Upload…",
  DOC_DELETE: "Suppression…",
  DARK_ON: "Thème sombre",
  DARK_OFF: "Thème clair",
  A11Y_OPEN: "Accessibilité",
  VOICE_STOP: "Micro coupé",
};

export default function VoiceCommandIndicator({
  lastCommand,
  transcript,
  lastHeard,
  unrecognized,
  onStop,
}) {
  const [show, setShow] = useState(false);

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const label = lastCommand ? ACTION_LABELS[lastCommand] || lastCommand : null;

  return (
    <div
      className={`fixed bottom-20 left-4 z-50 transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Commandes vocales actives"
    >
      <div className="flex flex-col gap-1">
        {/* Main bar */}
        <div className="flex items-center gap-2 bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg">
          {/* Pulsing dot */}
          <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-100" />
          </span>

          <span className="text-sm font-medium">🎙️ Écoute…</span>

          {label && (
            <span className="text-xs bg-green-700 px-2 py-0.5 rounded-full">
              ✓ {label}
            </span>
          )}

          <button
            onClick={onStop}
            className="ml-1 p-1 hover:bg-red-700 dark:hover:bg-red-800 rounded-full transition-colors"
            aria-label="Arrêter les commandes vocales"
            title="Arrêter (Alt+V)"
          >
            ✕
          </button>
        </div>

        {/* Live transcript (what's being heard right now) */}
        {transcript && (
          <div className="bg-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded-full shadow-lg max-w-xs truncate">
            🗣️ <span className="italic">{transcript}</span>
          </div>
        )}

        {/* Last heard phrase (when unrecognized) */}
        {unrecognized && lastHeard && (
          <div className="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg max-w-xs">
            ❓ "{lastHeard}" — commande inconnue
          </div>
        )}
      </div>
    </div>
  );
}
