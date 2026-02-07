/**
 * useAudioGuide — Auto-announces page context for blind users.
 *
 * When a page mounts, it reads a welcome message describing:
 *   - What page they're on
 *   - What content is available
 *   - How to interact (keyboard shortcuts)
 *
 * Also provides helpers:
 *   - announce(text)   → screen reader live region
 *   - speakGuide(text) → TTS audio guide
 *   - playSound(type)  → short audio feedback
 */

import { useCallback, useEffect, useRef } from "react";
import { announce } from "../components/AccessibilityToolbar.jsx";
import { useTTS } from "./useSpeech.js";

// ─── Audio feedback sounds (generated via Web Audio API, no files needed) ───

const audioCtxRef = { current: null };

function getAudioCtx() {
  if (!audioCtxRef.current && typeof AudioContext !== "undefined") {
    audioCtxRef.current = new AudioContext();
  }
  return audioCtxRef.current;
}

/**
 * Play a short audio feedback tone.
 * Types: "success", "error", "loading", "navigate", "click"
 */
export function playSound(type = "click") {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.value = 0.15; // Soft volume

    switch (type) {
      case "success":
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;

      case "error":
        osc.frequency.value = 220;
        osc.type = "square";
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        break;

      case "loading":
        osc.frequency.value = 440;
        osc.type = "sine";
        osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;

      case "navigate":
        osc.frequency.value = 600;
        osc.type = "sine";
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
        break;

      case "click":
      default:
        osc.frequency.value = 1000;
        osc.type = "sine";
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
        break;
    }
  } catch {
    // Audio not supported — silently ignore
  }
}

/**
 * Hook that auto-announces page context on mount.
 *
 * @param {string} pageDescription - Text to read aloud when page loads
 * @param {object} options
 * @param {boolean} options.autoSpeak - Whether to auto-speak on mount (default: true)
 * @param {number} options.delay - Delay before speaking in ms (default: 500)
 */
export function useAudioGuide(
  pageDescription,
  { autoSpeak = true, delay = 600 } = {},
) {
  const { speak, stop, isSpeaking, isSupported } = useTTS();
  const hasSpoken = useRef(false);

  // Auto-announce page on mount — only once per session per page
  useEffect(() => {
    if (!autoSpeak || !isSupported || hasSpoken.current) return;

    // Use sessionStorage to avoid re-announcing on navigation back
    const storageKey = `audioGuide:${pageDescription?.slice(0, 40)}`;
    if (sessionStorage.getItem(storageKey)) {
      hasSpoken.current = true;
      return;
    }

    const timer = setTimeout(() => {
      if (pageDescription) {
        // Screen reader announcement (visual SR)
        announce(pageDescription);
        // TTS audio guide
        speak(pageDescription, "audio-guide");
        hasSpoken.current = true;
        sessionStorage.setItem(storageKey, "1");
        playSound("navigate");
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [pageDescription, autoSpeak, isSupported, delay, speak]);

  // Manual guide trigger
  const speakGuide = useCallback(
    (text) => {
      if (isSupported && text) {
        announce(text);
        speak(text, "guide");
      }
    },
    [isSupported, speak],
  );

  // Stop any ongoing speech on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speakGuide,
    stopGuide: stop,
    isSpeaking,
    isSupported,
    announce,
    playSound,
  };
}
