import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { askQuestion, askStream } from "../api.js";
import { announce } from "../components/AccessibilityToolbar.jsx";
import { playSound, useAudioGuide } from "../hooks/useAudioGuide.js";
import { useSTT, useTTS } from "../hooks/useSpeech.js";

function ChatPage({ registerVCHandlers, vcActive, vcToggle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [useStream, setUseStream] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(messages);

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ─── Audio Guide: auto-announce page for blind users ───
  useAudioGuide(
    "Vous êtes sur la page Chat. Tapez votre question ou appuyez sur le bouton micro pour la saisie vocale. Utilisez Tab pour naviguer entre les éléments.",
  );

  // ─── TTS: available via voice commands ("écouter") ───
  const { speak, stop: stopSpeech } = useTTS();

  // ─── STT: Voice input ───
  const onVoiceResult = useCallback((text) => {
    setInput(text);
    announce(`Texte reconnu: ${text}`);
  }, []);

  const {
    startListening: rawStartListening,
    stopListening,
    isListening,
    transcript,
    isSupported: sttSupported,
  } = useSTT({ onResult: onVoiceResult });

  // Track whether VC was active before STT, so we can restart it after
  const vcWasActiveRef = useRef(false);

  // Wrap startListening to stop voice commands first (browser allows only 1 SpeechRecognition)
  const startListening = useCallback(() => {
    if (vcActive && vcToggle) {
      vcWasActiveRef.current = true;
      vcToggle(); // toggle OFF
      // Small delay for the browser to release the mic
      setTimeout(() => rawStartListening(), 300);
    } else {
      vcWasActiveRef.current = false;
      rawStartListening();
    }
  }, [vcActive, vcToggle, rawStartListening]);

  // Restart voice commands after STT ends (if they were active before)
  useEffect(() => {
    if (!isListening && vcWasActiveRef.current) {
      vcWasActiveRef.current = false;
      // Small delay to let browser release mic, then toggle VC back on
      const timer = setTimeout(() => {
        if (vcToggle && !vcActive) {
          vcToggle(); // toggle ON
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isListening, vcToggle, vcActive]);

  // Update input field as user speaks (interim results)
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const buildHistory = () => {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    if (useStream) {
      handleStream(question);
    } else {
      handleSync(question);
    }
  };

  const handleSync = async (question) => {
    setLoading(true);
    try {
      const data = await askQuestion(question, buildHistory());
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          latency: data.latency_ms,
          confidence: data.confidence,
        },
      ]);
      playSound("success");
      announce("Réponse reçue. Utilisez le bouton écouter pour l'entendre.");
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Erreur: ${err.message}` },
      ]);
      playSound("error");
      announce(`Erreur: ${err.message}`);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleStream = (question) => {
    setStreaming(true);
    setStreamText("");

    let accumulated = "";
    askStream(
      question,
      // onToken
      (token) => {
        accumulated += token;
        setStreamText(accumulated);
      },
      // onDone
      () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: accumulated },
        ]);
        setStreamText("");
        setStreaming(false);
        inputRef.current?.focus();
        playSound("success");
        announce(
          "Réponse complète. Utilisez le bouton écouter pour l'entendre.",
        );
      },
      // onError
      () => {
        if (accumulated) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: accumulated },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "❌ Erreur de connexion au serveur.",
            },
          ]);
        }
        setStreamText("");
        setStreaming(false);
      },
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setStreamText("");
    inputRef.current?.focus();
  };

  // ─── Voice Commands: register chat-specific handlers ───
  const handleVoiceAsk = useCallback(
    (question) => {
      setInput(question);
      // Trigger send after a tick so input state is set
      setTimeout(() => {
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: question }]);
        // Use streaming by default
        handleStream(question);
      }, 100);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (registerVCHandlers) {
      registerVCHandlers({
        onChatAsk: handleVoiceAsk,
        onChatReset: () => {
          setMessages([]);
          setStreamText("");
          announce("Conversation effacée");
        },
        onChatListen: () => {
          // Read the last assistant message
          const msgs = messagesRef.current;
          const lastAssistant = [...msgs]
            .reverse()
            .find((m) => m.role === "assistant");
          if (lastAssistant) {
            speak(lastAssistant.content, "vc-listen");
            announce("Lecture de la dernière réponse");
          } else {
            announce("Aucune réponse à lire");
          }
        },
      });
      return () => registerVCHandlers({});
    }
  }, [registerVCHandlers, handleVoiceAsk, speak]);

  return (
    <div
      className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-73px)]"
      role="main"
      aria-label="Chat avec l'assistant documentaire TILI"
    >
      {/* Chat Messages Area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        role="log"
        aria-label="Historique de la conversation"
        aria-live="polite"
      >
        {messages.length === 0 && !streaming && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏛️</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Assistant Documentaire TILI
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Posez vos questions sur les documents internes de TILI :
              comptes-rendus, rapports de mission, conventions et finances.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "Quel est le budget de TILI pour 2026 ?",
                "Résumé de la mission à Kasserine",
                "Quels sont les partenaires de TILI ?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-tili-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Streaming indicator */}
        {streaming && streamText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="prose dark:text-gray-200 text-sm streaming-cursor">
                <ReactMarkdown>{streamText}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-tili-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-tili-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-tili-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
                <span className="text-sm">Analyse en cours...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleReset}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Démarrer une nouvelle conversation"
            >
              🔄 Nouvelle conversation
            </button>
            <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useStream}
                onChange={(e) => setUseStream(e.target.checked)}
                className="rounded text-tili-600"
              />
              Streaming
            </label>
          </div>
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "🎤 Parlez maintenant..."
                  : "Posez votre question sur les documents TILI..."
              }
              rows={1}
              className={`flex-1 resize-none rounded-xl border bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tili-500 focus:border-transparent dark:text-gray-100 placeholder-gray-400 ${
                isListening
                  ? "border-red-400 dark:border-red-500 ring-1 ring-red-200"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              disabled={loading || streaming}
              aria-label="Zone de saisie de votre question. Tapez ou utilisez le bouton micro pour la saisie vocale."
              role="textbox"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || streaming}
              className="px-5 py-3 bg-tili-600 hover:bg-tili-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
              aria-label="Envoyer votre question"
            >
              Envoyer
            </button>
          </div>
          {isListening && (
            <p
              className="mt-1 text-xs text-red-500 dark:text-red-400 animate-pulse"
              role="status"
              aria-live="polite"
            >
              🎤 Écoute en cours... parlez maintenant
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={isUser ? "Votre message" : "Réponse de l'assistant"}
    >
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-tili-600 text-white"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        }`}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <>
            <div className="prose dark:text-gray-200 text-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>

            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  📎 Sources
                </p>
                <div
                  className="flex flex-wrap gap-1"
                  role="list"
                  aria-label="Sources du document"
                >
                  {message.sources.map((s, j) => (
                    <span
                      key={j}
                      role="listitem"
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        s.confidence === "haute"
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : s.confidence === "moyenne"
                            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {s.filename} p.{s.page}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {message.latency && (
              <div
                className="mt-1 text-xs text-gray-400"
                aria-label={`Temps de réponse: ${(message.latency / 1000).toFixed(1)} secondes. Confiance: ${message.confidence}`}
              >
                ⏱ {(message.latency / 1000).toFixed(1)}s • Confiance:{" "}
                {message.confidence}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
