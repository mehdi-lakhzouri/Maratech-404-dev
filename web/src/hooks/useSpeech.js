/**
 * Custom hooks for Text-to-Speech (TTS) and Speech-to-Text (STT)
 * Uses the browser's built-in Web Speech API — no external dependencies.
 * Designed for accessibility: visually impaired users of TILI platform.
 *
 * Fixes applied:
 *   - speakingId: tracks WHICH text is being read (not just boolean)
 *   - Text chunking: splits long text into ~150-word segments (Chrome 15s bug)
 *   - Async voice loading: listens for voiceschanged event
 *   - STT onResult via ref: avoids re-creating recognition on each render
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TEXT-TO-SPEECH (TTS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Strip Markdown formatting for clean speech output.
 */
function stripMarkdown(text) {
  return text
    .replace(/#{1,6}\s+/g, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/[•\-]\s+/g, ", ") // bullets
    .replace(/📎.*$/gm, "") // source lines
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

/**
 * Split long text into chunks that Chrome can handle without cutting off.
 * Splits at sentence boundaries, keeping chunks under ~150 words.
 */
function chunkText(text, maxWords = 150) {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    const combined = current
      ? current + " " + sentence.trim()
      : sentence.trim();
    if (combined.split(/\s+/).length > maxWords && current) {
      chunks.push(current.trim());
      current = sentence.trim();
    } else {
      current = combined;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ─── Cached French voice (loaded async) ───
let _cachedFrVoice = null;
let _voicesLoaded = false;

function loadVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const pickFr = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      _voicesLoaded = true;
      // Prefer local French voice, fallback to any French
      _cachedFrVoice =
        voices.find((v) => v.lang.startsWith("fr") && v.localService) ||
        voices.find((v) => v.lang.startsWith("fr")) ||
        null;
    }
  };
  pickFr();
  if (!_voicesLoaded) {
    window.speechSynthesis.addEventListener("voiceschanged", pickFr);
  }
}
loadVoices();

/**
 * Hook for Text-to-Speech.
 *
 * Returns:
 *   speak(text, id?, opts?)  — read text aloud, optional id for tracking
 *   stop()                   — cancel speech
 *   isSpeaking               — boolean, true if any speech is active
 *   speakingId               — the id passed to speak(), or null
 *   isSupported              — browser support
 *
 * Usage:
 *   const { speak, stop, isSpeaking, speakingId, isSupported } = useTTS();
 *   speak("Bonjour", "msg-3");  // speakingId === "msg-3" while reading
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const chunksRef = useRef([]); // remaining chunks to speak
  const activeRef = useRef(false); // true while a speak session is in progress

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (isSupported) {
      activeRef.current = false;
      chunksRef.current = [];
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingId(null);
    }
  }, [isSupported]);

  const speakNextChunk = useCallback((lang, rate, pitch) => {
    if (!activeRef.current || chunksRef.current.length === 0) {
      // All chunks done
      activeRef.current = false;
      setIsSpeaking(false);
      setSpeakingId(null);
      return;
    }

    const text = chunksRef.current.shift();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = pitch;
    if (_cachedFrVoice) utter.voice = _cachedFrVoice;

    utter.onend = () => {
      // Speak next chunk after a tiny pause
      if (activeRef.current && chunksRef.current.length > 0) {
        setTimeout(() => speakNextChunk(lang, rate, pitch), 80);
      } else {
        activeRef.current = false;
        setIsSpeaking(false);
        setSpeakingId(null);
      }
    };
    utter.onerror = () => {
      activeRef.current = false;
      chunksRef.current = [];
      setIsSpeaking(false);
      setSpeakingId(null);
    };

    window.speechSynthesis.speak(utter);
  }, []);

  const speak = useCallback(
    (text, id = null, { lang = "fr-FR", rate = 0.95, pitch = 1.0 } = {}) => {
      if (!isSupported || !text) return;

      // Stop any ongoing speech
      activeRef.current = false;
      chunksRef.current = [];
      window.speechSynthesis.cancel();

      const cleaned = stripMarkdown(text);
      if (!cleaned) return;

      const chunks = chunkText(cleaned);
      if (chunks.length === 0) return;

      chunksRef.current = chunks;
      activeRef.current = true;
      setIsSpeaking(true);
      setSpeakingId(id);

      speakNextChunk(lang, rate, pitch);
    },
    [isSupported, speakNextChunk],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      chunksRef.current = [];
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  return { speak, stop, isSpeaking, speakingId, isSupported };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SPEECH-TO-TEXT (STT) — Voice Input
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Hook for Speech-to-Text (voice input).
 *
 * onResult is stored in a ref to avoid re-creating the recognition instance
 * when the callback identity changes.
 */
export function useSTT({ lang = "fr-FR", onResult, continuous = false } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);

  // Keep ref current without re-creating recognition
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      const text = final || interim;
      setTranscript(text);
      if (final && onResultRef.current) {
        onResultRef.current(final.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn("STT error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening, lang, continuous, SpeechRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    isSupported,
  };
}
