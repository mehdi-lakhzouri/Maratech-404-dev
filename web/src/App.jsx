import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    BrowserRouter,
    NavLink,
    Route,
    Routes,
    useNavigate,
} from "react-router-dom";
import AccessibilityToolbar, {
    announce,
} from "./components/AccessibilityToolbar.jsx";
import AudioOnboarding, {
    isAudioModeEnabled,
    isOnboardingDone,
} from "./components/AudioOnboarding.jsx";
import VoiceCommandIndicator from "./components/VoiceCommandIndicator.jsx";
import { useVoiceCommands } from "./hooks/useVoiceCommands.js";
import ChatPage from "./pages/ChatPage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";

function AppContent() {
  const [dark, setDark] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !isOnboardingDone(),
  );
  const [audioMode, setAudioMode] = useState(() => isAudioModeEnabled());
  const navigate = useNavigate();

  // ─── Page-specific voice command handlers (registered by active page) ───
  const pageHandlersRef = useRef({});
  const [pageHandlersVersion, setPageHandlersVersion] = useState(0);

  const registerVCHandlers = useCallback((handlers) => {
    pageHandlersRef.current = handlers;
    setPageHandlersVersion((v) => v + 1); // trigger re-memo
  }, []);

  // ─── Voice command handlers (global + page-specific merged) ───
  const vcHandlers = useMemo(
    () => ({
      onNavigate: (path) => navigate(path),
      onDarkMode: (on) => setDark(on),
      onStopSpeech: () => window.speechSynthesis?.cancel(),
      ...pageHandlersRef.current,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, pageHandlersVersion],
  );

  const {
    isActive: vcActive,
    lastCommand,
    transcript: vcTranscript,
    lastHeard: vcLastHeard,
    unrecognized: vcUnrecognized,
    start: vcStart,
    toggle: vcToggle,
    isSupported: vcSupported,
  } = useVoiceCommands(vcHandlers);

  // ─── Onboarding completion handler ───
  const handleOnboardingComplete = useCallback(
    (chosenAudioMode) => {
      setShowOnboarding(false);
      setAudioMode(chosenAudioMode);
      if (chosenAudioMode && vcSupported) {
        // Auto-start voice commands for audio mode users
        setTimeout(() => vcStart(), 1500);
      }
    },
    [vcSupported, vcStart],
  );

  // ─── Auto-start voice commands on reload for audio mode users ───
  const audioAutoStarted = useRef(false);
  useEffect(() => {
    if (
      audioMode &&
      vcSupported &&
      !vcActive &&
      !showOnboarding &&
      !audioAutoStarted.current
    ) {
      audioAutoStarted.current = true;
      setTimeout(() => vcStart(), 500);
    }
  }, [audioMode, vcSupported, vcActive, showOnboarding, vcStart]);

  // ─── Global keyboard shortcuts for blind navigation ───
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Alt+1 → Chat page
      if (e.altKey && e.key === "1") {
        e.preventDefault();
        navigate("/");
        announce("Navigation vers la page Chat");
      }
      // Alt+2 → Documents page
      if (e.altKey && e.key === "2") {
        e.preventDefault();
        navigate("/documents");
        announce("Navigation vers la page Documents");
      }
      // Alt+D → Toggle dark mode
      if (e.altKey && e.key === "d") {
        e.preventDefault();
        setDark((d) => !d);
        announce(dark ? "Thème clair activé" : "Thème sombre activé");
      }
      // Alt+H → Read help/shortcuts
      if (e.altKey && e.key === "h") {
        e.preventDefault();
        announce(
          "Raccourcis clavier: Alt plus 1 pour le Chat. Alt plus 2 pour les Documents. Alt plus A pour l'accessibilité. Alt plus D pour le thème sombre. Alt plus V pour les commandes vocales. Alt plus H pour cette aide.",
        );
      }
      // Alt+V → Toggle voice commands
      if (e.altKey && e.key === "v") {
        e.preventDefault();
        vcToggle();
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [navigate, dark, vcToggle]);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
        {/* Audio onboarding — first visit only */}
        {showOnboarding && (
          <AudioOnboarding onComplete={handleOnboardingComplete} />
        )}

        {/* Skip to content link for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-tili-600 focus:text-white focus:rounded-lg"
        >
          Aller au contenu principal
        </a>

        {/* Header */}
        <header
          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
          role="banner"
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 bg-tili-600 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                aria-hidden="true"
              >
                T
              </div>
              <div>
                <h1 className="text-lg font-bold text-tili-800 dark:text-tili-200">
                  TILI RAG
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Assistant Documentaire IA — Accessible ♿
                </p>
              </div>
            </div>

            <nav
              className="flex items-center gap-1"
              role="navigation"
              aria-label="Navigation principale"
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-tili-100 dark:bg-tili-900 text-tili-700 dark:text-tili-200"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`
                }
                aria-label="Page de chat avec l'assistant"
              >
                💬 Chat
              </NavLink>
              <NavLink
                to="/documents"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-tili-100 dark:bg-tili-900 text-tili-700 dark:text-tili-200"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`
                }
                aria-label="Gestion des documents"
              >
                📄 Documents
              </NavLink>
              <button
                onClick={() => setDark(!dark)}
                className="ml-2 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={
                  dark ? "Passer au thème clair" : "Passer au thème sombre"
                }
                title="Changer le thème"
              >
                {dark ? "☀️" : "🌙"}
              </button>
              {vcSupported && (
                <button
                  onClick={vcToggle}
                  className={`ml-1 p-2 rounded-lg transition-colors ${
                    vcActive
                      ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 animate-pulse"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  aria-label={
                    vcActive
                      ? "Désactiver les commandes vocales (Alt+V)"
                      : "Activer les commandes vocales (Alt+V)"
                  }
                  title={
                    vcActive
                      ? "Commandes vocales actives"
                      : "Commandes vocales (Alt+V)"
                  }
                >
                  🎙️
                </button>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1" id="main-content" role="main">
          <Routes>
            <Route
              path="/"
              element={
                <ChatPage
                  registerVCHandlers={registerVCHandlers}
                  vcActive={vcActive}
                  vcToggle={vcToggle}
                />
              }
            />
            <Route
              path="/documents"
              element={
                <DocumentsPage registerVCHandlers={registerVCHandlers} />
              }
            />
          </Routes>
        </main>

        {/* Voice command floating indicator */}
        {vcActive && (
          <VoiceCommandIndicator
            lastCommand={lastCommand}
            transcript={vcTranscript}
            lastHeard={vcLastHeard}
            unrecognized={vcUnrecognized}
            onStop={vcToggle}
          />
        )}

        {/* Accessibility Toolbar — always visible */}
        <AccessibilityToolbar />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
