/**
 * useVoiceCommands — Voice-driven navigation & control for blind/deaf users.
 *
 * Uses fuzzy matching with Levenshtein distance + synonym expansion
 * for robust French voice command recognition. No LLM needed.
 *
 * Supported commands:
 *   Navigation:
 *     "aller au chat" / "page chat" / "ouvre le chat" / "va au chat"
 *     "aller aux documents" / "page docs" / "voir les documents"
 *     "aide" / "help" / "quelles commandes" / "comment ça marche"
 *
 *   Chat page:
 *     "poser une question <...>" / "demander <...>"
 *     "nouvelle conversation" / "effacer" / "recommencer"
 *     "écouter" / "lire" / "lis" / "répète"
 *     "arrêter" / "stop" / "silence" / "tais-toi"
 *
 *   Documents page:
 *     "résumer le [premier/deuxième/...] document"
 *     "images du [premier/...] document" / "décrire les images"
 *     "uploader" / "télécharger" / "ajouter" / "importer"
 *     "supprimer le [premier/...] document" / "effacer le document"
 *
 *   Global:
 *     "thème sombre" / "mode nuit" / "fond noir"
 *     "thème clair" / "mode jour" / "fond blanc"
 *     "accessibilité" / "options accessibilité"
 *     "couper le micro" / "désactiver" / "fermer l'écoute"
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { announce } from "../components/AccessibilityToolbar.jsx";
import { playSound } from "./useAudioGuide.js";
import { useTTS } from "./useSpeech.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FUZZY MATCHING ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Levenshtein distance between two strings.
 * Used for fuzzy matching of voice-recognized text against command patterns.
 */
function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Similarity score between two strings (0 to 1).
 * 1 = identical, 0 = completely different.
 */
function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Check if a phrase contains a pattern as a fuzzy substring.
 * Returns a confidence score (0 to 1) or 0 if no match.
 *
 * Strategy:
 *   1. Exact substring → 1.0
 *   2. Word-level containment → 0.95
 *   3. Fuzzy match against sliding windows → 0.0-0.9
 */
function fuzzyContains(phrase, pattern) {
  // 1. Exact substring match
  if (phrase.includes(pattern)) return 1.0;

  // 2. All pattern words found in phrase (any order)
  const patternWords = pattern.split(/\s+/);
  const phraseWords = phrase.split(/\s+/);
  const allWordsFound = patternWords.every((pw) =>
    phraseWords.some((fw) => fw === pw || similarity(fw, pw) >= 0.8),
  );
  if (allWordsFound && patternWords.length > 1) return 0.95;

  // 3. Sliding window fuzzy match
  const words = phrase.split(/\s+/);
  const patLen = patternWords.length;
  let bestScore = 0;

  for (let i = 0; i <= words.length - patLen; i++) {
    const window = words.slice(i, i + patLen).join(" ");
    const score = similarity(window, pattern);
    if (score > bestScore) bestScore = score;
  }

  // Also try the whole phrase against short patterns
  if (patternWords.length <= 2) {
    const wholeScore = similarity(phrase, pattern);
    if (wholeScore > bestScore) bestScore = wholeScore;
  }

  return bestScore;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FRENCH ORDINALS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ORDINALS = {
  premier: 0,
  premiere: 0,
  "1er": 0,
  "1ere": 0,
  deuxieme: 1,
  second: 1,
  seconde: 1,
  "2eme": 1,
  "2e": 1,
  troisieme: 2,
  "3eme": 2,
  "3e": 2,
  quatrieme: 3,
  "4eme": 3,
  "4e": 3,
  cinquieme: 4,
  "5eme": 4,
  "5e": 4,
  sixieme: 5,
  "6eme": 5,
  septieme: 6,
  "7eme": 6,
  huitieme: 7,
  "8eme": 7,
  neuvieme: 8,
  "9eme": 8,
  dixieme: 9,
  "10eme": 9,
  dernier: -1,
  derniere: -1,
};

function extractOrdinal(text) {
  const lower = normalize(text);
  for (const [word, index] of Object.entries(ORDINALS)) {
    if (lower.includes(word)) return index;
  }
  const numMatch = lower.match(/(?:document|fichier|doc|numero)\s+(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10) - 1;
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NORMALIZE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COMMAND PATTERNS (with expanded synonyms)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Minimum fuzzy score to consider a match */
const FUZZY_THRESHOLD = 0.72;

const COMMAND_PATTERNS = [
  // ─── Navigation ───
  {
    patterns: [
      "aller au chat",
      "page chat",
      "ouvrir le chat",
      "va au chat",
      "ouvre le chat",
      "retour au chat",
      "voir le chat",
      "aller chat",
      "montre le chat",
      "revenir au chat",
    ],
    action: "NAV_CHAT",
    priority: 10,
  },
  {
    patterns: [
      "aller aux documents",
      "page documents",
      "ouvrir les documents",
      "va aux documents",
      "page document",
      "voir les documents",
      "ouvre les documents",
      "montre les documents",
      "liste des documents",
      "aller documents",
      "voir les docs",
      "page docs",
    ],
    action: "NAV_DOCS",
    priority: 10,
  },
  {
    patterns: [
      "aide",
      "help",
      "quelles sont les commandes",
      "liste des commandes",
      "comment ca marche",
      "quoi dire",
      "que puis-je dire",
      "commandes disponibles",
      "aide vocale",
    ],
    action: "HELP",
    priority: 5,
  },

  // ─── Chat ───
  {
    patterns: [
      "nouvelle conversation",
      "effacer le chat",
      "recommencer",
      "nouveau chat",
      "vider le chat",
      "effacer la conversation",
      "repartir a zero",
      "reinitialiser",
    ],
    action: "CHAT_RESET",
    priority: 8,
  },
  {
    patterns: [
      "ecouter",
      "lire la reponse",
      "lis la reponse",
      "repete",
      "repeter",
      "lire",
      "lis",
      "ecouter la reponse",
      "relire",
      "relis",
      "qu est-ce qu il a dit",
      "repete la reponse",
    ],
    action: "CHAT_LISTEN",
    priority: 7,
  },
  {
    patterns: [
      "arreter",
      "stop",
      "tais-toi",
      "silence",
      "chut",
      "arreter la lecture",
      "couper le son",
      "ferme-la",
      "stop la lecture",
      "arrete",
    ],
    action: "STOP_SPEECH",
    priority: 6,
  },

  // ─── Documents ───
  {
    patterns: [
      "resumer",
      "resume",
      "faire un resume",
      "resumé",
      "fais un resume",
      "resumer le document",
    ],
    action: "DOC_SUMMARIZE",
    priority: 9,
  },
  {
    patterns: [
      "images",
      "decrire les images",
      "description des images",
      "voir les images",
      "montrer les images",
      "photos",
      "images du document",
      "decrire les photos",
    ],
    action: "DOC_IMAGES",
    priority: 9,
  },
  {
    patterns: [
      "uploader",
      "telecharger",
      "ajouter un document",
      "ajouter un fichier",
      "importer",
      "importer un document",
      "charger un fichier",
      "envoyer un fichier",
      "upload",
      "ajouter",
    ],
    action: "DOC_UPLOAD",
    priority: 8,
  },
  {
    patterns: [
      "supprimer",
      "effacer le document",
      "enlever",
      "retirer",
      "supprimer le document",
      "effacer le fichier",
      "delete",
    ],
    action: "DOC_DELETE",
    priority: 9,
  },

  // ─── Global ───
  {
    patterns: [
      "theme sombre",
      "mode sombre",
      "mode nuit",
      "fond noir",
      "activer le noir",
      "theme noir",
      "dark mode",
    ],
    action: "DARK_ON",
    priority: 6,
  },
  {
    patterns: [
      "theme clair",
      "mode clair",
      "mode jour",
      "fond blanc",
      "activer le blanc",
      "theme blanc",
      "light mode",
    ],
    action: "DARK_OFF",
    priority: 6,
  },
  {
    patterns: [
      "accessibilite",
      "ouvrir accessibilite",
      "options accessibilite",
      "panneau accessibilite",
      "outils accessibilite",
    ],
    action: "A11Y_OPEN",
    priority: 5,
  },
  {
    patterns: [
      "arreter l ecoute",
      "desactiver les commandes vocales",
      "fermer le micro",
      "couper le micro",
      "desactiver le micro",
      "arreter les commandes",
      "stop les commandes",
      "fermer l ecoute",
    ],
    action: "VOICE_STOP",
    priority: 10,
  },

  // ─── Question shortcut (lower priority — checked last) ───
  {
    patterns: [
      "poser",
      "demander",
      "question",
      "poser une question",
      "j ai une question",
      "je veux demander",
    ],
    action: "CHAT_ASK",
    priority: 3,
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SMART COMMAND MATCHING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Match a spoken phrase to a command with confidence scoring.
 * Returns { action, rawText, confidence, matchedPattern } or null.
 *
 * Uses fuzzy matching so "allé o chat" still matches "aller au chat".
 */
function matchCommand(transcript) {
  const normalized = normalize(transcript);

  let bestMatch = null;
  let bestScore = 0;

  for (const cmd of COMMAND_PATTERNS) {
    for (const pattern of cmd.patterns) {
      const score = fuzzyContains(normalized, pattern);

      // Weight by priority (higher priority commands win ties)
      const weighted = score + cmd.priority / 100;

      if (score >= FUZZY_THRESHOLD && weighted > bestScore) {
        bestScore = weighted;
        bestMatch = {
          action: cmd.action,
          rawText: transcript,
          confidence: score,
          matchedPattern: pattern,
        };
      }
    }
  }

  if (bestMatch) {
    console.log(
      `[VoiceCmd] ✓ Matched: "${normalized}" → ${bestMatch.action} (pattern: "${bestMatch.matchedPattern}", confidence: ${bestMatch.confidence.toFixed(2)})`,
    );
  }

  return bestMatch;
}

// ─── Help text ───
const HELP_TEXT =
  "Commandes vocales disponibles. La reconnaissance est intelligente " +
  "et comprend même si vous ne prononcez pas exactement la commande. " +
  "Dites 'aller au chat', 'page chat', ou 'ouvre le chat' pour le chat. " +
  "Dites 'aller aux documents' ou 'voir les docs' pour les documents. " +
  "Dites 'poser une question' suivi de votre question. " +
  "Dites 'résumer le premier document' ou 'images du deuxième document'. " +
  "Dites 'nouvelle conversation' ou 'recommencer' pour effacer le chat. " +
  "Dites 'écouter', 'lire', ou 'répète' pour entendre la réponse. " +
  "Dites 'arrêter', 'stop', ou 'silence' pour couper la parole. " +
  "Dites 'thème sombre' ou 'mode nuit' pour le mode sombre. " +
  "Dites 'couper le micro' pour désactiver les commandes vocales. " +
  "Dites 'aide' pour réécouter cette liste.";

/**
 * Voice Commands hook — continuous listening + command dispatch.
 *
 * @param {object} handlers - Map of action handlers
 * @param {Function} handlers.onNavigate - (path: string) => void
 * @param {Function} handlers.onChatAsk - (question: string) => void
 * @param {Function} handlers.onChatReset - () => void
 * @param {Function} handlers.onChatListen - () => void
 * @param {Function} handlers.onStopSpeech - () => void
 * @param {Function} handlers.onDocSummarize - (index: number) => void
 * @param {Function} handlers.onDocImages - (index: number) => void
 * @param {Function} handlers.onDocUpload - () => void
 * @param {Function} handlers.onDocDelete - (index: number) => void
 * @param {Function} handlers.onDarkMode - (dark: boolean) => void
 * @param {Function} handlers.onA11yOpen - () => void
 */
export function useVoiceCommands(handlers = {}) {
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false); // ref mirror to avoid stale closures
  const [lastCommand, setLastCommand] = useState(null);
  const [transcript, setTranscript] = useState(""); // live transcript (interim)
  const [lastHeard, setLastHeard] = useState(""); // last final transcript
  const [unrecognized, setUnrecognized] = useState(false); // true when last phrase wasn't a command
  const recognitionRef = useRef(null);
  const handlersRef = useRef(handlers);
  const { speak, stop: stopTTS, isSupported: ttsSupported } = useTTS();

  // Keep handlers ref current
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const processCommand = useCallback(
    (spokenText) => {
      setLastHeard(spokenText);
      const match = matchCommand(spokenText);
      if (!match) {
        // Show feedback that the phrase wasn't recognized
        setUnrecognized(true);
        console.log(
          "[VoiceCmd] Not recognized:",
          spokenText,
          "→ normalized:",
          normalize(spokenText),
        );
        announce(
          `Commande non reconnue: "${spokenText}". Dites aide pour la liste.`,
        );
        setTimeout(() => setUnrecognized(false), 3000);
        return;
      }
      setUnrecognized(false);

      const { action, rawText, confidence, matchedPattern } = match;
      const h = handlersRef.current;
      setLastCommand(action);
      playSound("click");

      // Fuzzy confidence feedback — let user know what was interpreted
      if (confidence < 0.85) {
        console.log(
          `[VoiceCmd] Low confidence (${confidence.toFixed(2)}) — interpreted as "${matchedPattern}"`,
        );
      }

      switch (action) {
        // Navigation
        case "NAV_CHAT":
          announce("Navigation vers le Chat");
          h.onNavigate?.("/");
          break;
        case "NAV_DOCS":
          announce("Navigation vers les Documents");
          h.onNavigate?.("/documents");
          break;
        case "HELP":
          announce(HELP_TEXT);
          if (ttsSupported) speak(HELP_TEXT, "vc-help", { rate: 0.95 });
          break;

        // Chat
        case "CHAT_ASK": {
          // Extract the question after "poser/demander/question"
          const questionMatch = rawText.match(
            /(?:poser\s+(?:une\s+)?question\s*|demander\s+|question\s+)(.*)/i,
          );
          if (questionMatch && questionMatch[1].trim()) {
            const question = questionMatch[1].trim();
            announce(`Question: ${question}`);
            h.onChatAsk?.(question);
          } else {
            announce("Dites 'poser une question' suivi de votre question.");
            if (ttsSupported)
              speak(
                "Dites poser une question, suivi de votre question.",
                "vc-hint",
              );
          }
          break;
        }
        case "CHAT_RESET":
          announce("Conversation effacée");
          h.onChatReset?.();
          break;
        case "CHAT_LISTEN":
          h.onChatListen?.();
          break;
        case "STOP_SPEECH":
          stopTTS();
          h.onStopSpeech?.();
          announce("Lecture arrêtée");
          break;

        // Documents
        case "DOC_SUMMARIZE": {
          const idx = extractOrdinal(rawText);
          if (idx !== null) {
            announce(
              `Résumé du document numéro ${idx === -1 ? "dernier" : idx + 1}`,
            );
            h.onDocSummarize?.(idx);
          } else {
            announce(
              "Dites résumer le premier document, ou résumer le deuxième document.",
            );
            if (ttsSupported)
              speak(
                "Dites résumer le premier document, ou résumer le deuxième document.",
                "vc-hint",
              );
          }
          break;
        }
        case "DOC_IMAGES": {
          const idx = extractOrdinal(rawText);
          if (idx !== null) {
            announce(
              `Description des images du document numéro ${idx === -1 ? "dernier" : idx + 1}`,
            );
            h.onDocImages?.(idx);
          } else {
            announce("Dites images du premier document.");
          }
          break;
        }
        case "DOC_UPLOAD":
          announce("Ouverture du sélecteur de fichier");
          h.onDocUpload?.();
          break;
        case "DOC_DELETE": {
          const idx = extractOrdinal(rawText);
          if (idx !== null) {
            announce(
              `Suppression du document numéro ${idx === -1 ? "dernier" : idx + 1}`,
            );
            h.onDocDelete?.(idx);
          } else {
            announce("Dites supprimer le premier document.");
          }
          break;
        }

        // Global
        case "DARK_ON":
          announce("Thème sombre activé");
          h.onDarkMode?.(true);
          break;
        case "DARK_OFF":
          announce("Thème clair activé");
          h.onDarkMode?.(false);
          break;
        case "A11Y_OPEN":
          announce("Ouverture du panneau d'accessibilité");
          h.onA11yOpen?.();
          break;
        case "VOICE_STOP":
          announce("Commandes vocales désactivées");
          stop();
          break;
        default:
          break;
      }
    },
    [ttsSupported, speak, stopTTS],
  );

  const start = useCallback(() => {
    if (!isSupported) {
      console.warn(
        "[VoiceCmd] SpeechRecognition not supported in this browser",
      );
      return;
    }
    if (isActiveRef.current) {
      console.log("[VoiceCmd] Already active, ignoring start()");
      return;
    }
    // Stop any existing instance first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    console.log("[VoiceCmd] Creating new SpeechRecognition...");
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("[VoiceCmd] ✅ Speech recognition STARTED");
      isActiveRef.current = true;
      setIsActive(true);
      setTranscript("");
      setLastHeard("");
      setUnrecognized(false);
      playSound("navigate");
      announce(
        "Commandes vocales activées. Dites aide pour la liste des commandes.",
      );
    };

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (result.isFinal) {
          console.log(
            "[VoiceCmd] 🎤 Final:",
            text,
            "(confidence:",
            result[0].confidence,
            ")",
          );
          setTranscript("");
          processCommand(text);
        } else {
          interimText += text;
        }
      }
      if (interimText) {
        setTranscript(interimText);
      }
    };

    recognition.onerror = (event) => {
      console.warn("[VoiceCmd] ❌ error:", event.error, event.message);
      if (event.error === "no-speech") {
        setTranscript("(pas de parole détectée...)");
        setTimeout(() => setTranscript(""), 2000);
        return;
      }
      if (event.error === "aborted") return;
      if (event.error === "not-allowed") {
        announce(
          "Accès au microphone refusé. Veuillez autoriser le micro dans le navigateur.",
        );
        isActiveRef.current = false;
        setIsActive(false);
        recognitionRef.current = null;
        return;
      }
    };

    // Auto-restart on end (continuous mode sometimes stops)
    recognition.onend = () => {
      console.log(
        "[VoiceCmd] onend fired. Active ref:",
        isActiveRef.current,
        "Recognition ref:",
        !!recognitionRef.current,
      );
      if (isActiveRef.current && recognitionRef.current) {
        console.log("[VoiceCmd] Auto-restarting...");
        try {
          setTimeout(() => {
            if (isActiveRef.current && recognitionRef.current) {
              recognition.start();
            }
          }, 200);
        } catch (e) {
          console.warn("[VoiceCmd] Restart failed:", e);
          isActiveRef.current = false;
          setIsActive(false);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      console.log("[VoiceCmd] recognition.start() called successfully");
    } catch (e) {
      console.error("[VoiceCmd] recognition.start() threw:", e);
      recognitionRef.current = null;
    }
  }, [isSupported, SpeechRecognition, processCommand]);

  const stop = useCallback(() => {
    console.log(
      "[VoiceCmd] stop() called. Active ref:",
      isActiveRef.current,
      "Recognition ref:",
      !!recognitionRef.current,
    );
    isActiveRef.current = false;
    setIsActive(false);
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null; // Prevent auto-restart in onend
      try {
        ref.abort(); // abort is more aggressive than stop
      } catch (e) {
        console.warn("[VoiceCmd] abort error:", e);
      }
      playSound("navigate");
    }
  }, []);

  const toggle = useCallback(() => {
    console.log("[VoiceCmd] toggle() called. Active ref:", isActiveRef.current);
    if (isActiveRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isActive,
    lastCommand,
    transcript, // interim (real-time)
    lastHeard, // last finalized text
    unrecognized, // true if last phrase wasn't a command
    start,
    stop,
    toggle,
    isSupported,
  };
}

export { HELP_TEXT };

