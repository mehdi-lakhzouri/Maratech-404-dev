import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
    deleteDocument,
    getDocumentImages,
    getDocuments,
    summarizeDocument,
    uploadDocument,
} from "../api.js";
import { announce } from "../components/AccessibilityToolbar.jsx";
import { playSound, useAudioGuide } from "../hooks/useAudioGuide.js";
import { useTTS } from "../hooks/useSpeech.js";

// ─── Type configuration ───
const TYPE_CONFIG = {
  "Compte-Rendu": {
    icon: "📋",
    label: "Comptes-Rendus",
    description: "Procès-verbaux des réunions stratégiques et de projet",
    color: "blue",
    badgeCls:
      "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    borderCls: "border-blue-200 dark:border-blue-800",
    headerCls: "bg-blue-50 dark:bg-blue-900/30",
    accentCls: "bg-blue-500",
  },
  "Rapport de Mission": {
    icon: "🗺️",
    label: "Rapports de Mission",
    description: "Comptes-rendus des missions terrain",
    color: "green",
    badgeCls:
      "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    borderCls: "border-green-200 dark:border-green-800",
    headerCls: "bg-green-50 dark:bg-green-900/30",
    accentCls: "bg-green-500",
  },
  Convention: {
    icon: "🤝",
    label: "Conventions",
    description: "Accords de partenariat avec entreprises et organisations",
    color: "purple",
    badgeCls:
      "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
    borderCls: "border-purple-200 dark:border-purple-800",
    headerCls: "bg-purple-50 dark:bg-purple-900/30",
    accentCls: "bg-purple-500",
  },
  "Rapport Financier": {
    icon: "💰",
    label: "Rapports Financiers",
    description: "Bilans budgétaires et suivi de trésorerie",
    color: "amber",
    badgeCls:
      "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    borderCls: "border-amber-200 dark:border-amber-800",
    headerCls: "bg-amber-50 dark:bg-amber-900/30",
    accentCls: "bg-amber-500",
  },
  "Rapport d'Activité": {
    icon: "📊",
    label: "Rapports d'Activité",
    description: "Bilans annuels et indicateurs de performance",
    color: "teal",
    badgeCls:
      "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300",
    borderCls: "border-teal-200 dark:border-teal-800",
    headerCls: "bg-teal-50 dark:bg-teal-900/30",
    accentCls: "bg-teal-500",
  },
  "Plan Stratégique": {
    icon: "🎯",
    label: "Plans Stratégiques",
    description: "Vision, axes stratégiques et feuille de route",
    color: "indigo",
    badgeCls:
      "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300",
    borderCls: "border-indigo-200 dark:border-indigo-800",
    headerCls: "bg-indigo-50 dark:bg-indigo-900/30",
    accentCls: "bg-indigo-500",
  },
  Statuts: {
    icon: "⚖️",
    label: "Statuts",
    description: "Statuts juridiques de l'association",
    color: "slate",
    badgeCls:
      "bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300",
    borderCls: "border-slate-200 dark:border-slate-800",
    headerCls: "bg-slate-50 dark:bg-slate-900/30",
    accentCls: "bg-slate-500",
  },
  "Guide de Formation": {
    icon: "📖",
    label: "Guides de Formation",
    description: "Supports pédagogiques et guides",
    color: "cyan",
    badgeCls:
      "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300",
    borderCls: "border-cyan-200 dark:border-cyan-800",
    headerCls: "bg-cyan-50 dark:bg-cyan-900/30",
    accentCls: "bg-cyan-500",
  },
  "Programme de Formation": {
    icon: "🎓",
    label: "Programmes de Formation",
    description: "Programmes détaillés de formation",
    color: "sky",
    badgeCls: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
    borderCls: "border-sky-200 dark:border-sky-800",
    headerCls: "bg-sky-50 dark:bg-sky-900/30",
    accentCls: "bg-sky-500",
  },
  "Rapport d'Évaluation": {
    icon: "📝",
    label: "Rapports d'Évaluation",
    description: "Évaluations de projets et programmes",
    color: "orange",
    badgeCls:
      "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
    borderCls: "border-orange-200 dark:border-orange-800",
    headerCls: "bg-orange-50 dark:bg-orange-900/30",
    accentCls: "bg-orange-500",
  },
  "Rapport de Suivi": {
    icon: "📈",
    label: "Rapports de Suivi",
    description: "Suivi et monitoring des projets",
    color: "lime",
    badgeCls:
      "bg-lime-100 dark:bg-lime-900/50 text-lime-700 dark:text-lime-300",
    borderCls: "border-lime-200 dark:border-lime-800",
    headerCls: "bg-lime-50 dark:bg-lime-900/30",
    accentCls: "bg-lime-500",
  },
  "Rapport Annuel": {
    icon: "📅",
    label: "Rapports Annuels",
    description: "Rapports annuels complets",
    color: "rose",
    badgeCls:
      "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
    borderCls: "border-rose-200 dark:border-rose-800",
    headerCls: "bg-rose-50 dark:bg-rose-900/30",
    accentCls: "bg-rose-500",
  },
  "Termes de Référence": {
    icon: "📌",
    label: "Termes de Référence",
    description: "TdR pour missions et consultants",
    color: "violet",
    badgeCls:
      "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
    borderCls: "border-violet-200 dark:border-violet-800",
    headerCls: "bg-violet-50 dark:bg-violet-900/30",
    accentCls: "bg-violet-500",
  },
  "Projet de Développement": {
    icon: "🚀",
    label: "Projets de Développement",
    description: "Projets de développement et cadres logiques",
    color: "emerald",
    badgeCls:
      "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    borderCls: "border-emerald-200 dark:border-emerald-800",
    headerCls: "bg-emerald-50 dark:bg-emerald-900/30",
    accentCls: "bg-emerald-500",
  },
  "Budget Prévisionnel": {
    icon: "💵",
    label: "Budgets Prévisionnels",
    description: "Budgets détaillés et ventilations",
    color: "yellow",
    badgeCls:
      "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
    borderCls: "border-yellow-200 dark:border-yellow-800",
    headerCls: "bg-yellow-50 dark:bg-yellow-900/30",
    accentCls: "bg-yellow-500",
  },
  "Demande de Financement": {
    icon: "💼",
    label: "Demandes de Financement",
    description: "Dossiers de demande de subvention",
    color: "fuchsia",
    badgeCls:
      "bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300",
    borderCls: "border-fuchsia-200 dark:border-fuchsia-800",
    headerCls: "bg-fuchsia-50 dark:bg-fuchsia-900/30",
    accentCls: "bg-fuchsia-500",
  },
  "Protocole d'Accord": {
    icon: "📜",
    label: "Protocoles d'Accord",
    description: "Protocoles d'entente entre parties",
    color: "purple",
    badgeCls:
      "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
    borderCls: "border-purple-200 dark:border-purple-800",
    headerCls: "bg-purple-50 dark:bg-purple-900/30",
    accentCls: "bg-purple-500",
  },
  "Plan d'Action": {
    icon: "✅",
    label: "Plans d'Action",
    description: "Plans d'action opérationnels",
    color: "green",
    badgeCls:
      "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    borderCls: "border-green-200 dark:border-green-800",
    headerCls: "bg-green-50 dark:bg-green-900/30",
    accentCls: "bg-green-500",
  },
  "Manuel de Procédures": {
    icon: "📕",
    label: "Manuels de Procédures",
    description: "Procédures opérationnelles et workflows",
    color: "red",
    badgeCls: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
    borderCls: "border-red-200 dark:border-red-800",
    headerCls: "bg-red-50 dark:bg-red-900/30",
    accentCls: "bg-red-500",
  },
  Charte: {
    icon: "🏛️",
    label: "Chartes",
    description: "Chartes de valeurs et d'éthique",
    color: "zinc",
    badgeCls:
      "bg-zinc-100 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300",
    borderCls: "border-zinc-200 dark:border-zinc-800",
    headerCls: "bg-zinc-50 dark:bg-zinc-900/30",
    accentCls: "bg-zinc-500",
  },
  "Politique RH": {
    icon: "👥",
    label: "Politique RH",
    description: "Politique de ressources humaines",
    color: "pink",
    badgeCls:
      "bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300",
    borderCls: "border-pink-200 dark:border-pink-800",
    headerCls: "bg-pink-50 dark:bg-pink-900/30",
    accentCls: "bg-pink-500",
  },
  "Politique Interne": {
    icon: "📐",
    label: "Politiques Internes",
    description: "Documents de politique interne",
    color: "stone",
    badgeCls:
      "bg-stone-100 dark:bg-stone-900/50 text-stone-700 dark:text-stone-300",
    borderCls: "border-stone-200 dark:border-stone-800",
    headerCls: "bg-stone-50 dark:bg-stone-900/30",
    accentCls: "bg-stone-500",
  },
  "Règlement Intérieur": {
    icon: "📏",
    label: "Règlements Intérieurs",
    description: "Règles internes de fonctionnement",
    color: "neutral",
    badgeCls:
      "bg-neutral-100 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300",
    borderCls: "border-neutral-200 dark:border-neutral-800",
    headerCls: "bg-neutral-50 dark:bg-neutral-900/30",
    accentCls: "bg-neutral-500",
  },
};

// Dynamic color palette for unknown types (LLM-generated types)
const DYNAMIC_COLORS = [
  {
    badgeCls:
      "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
    borderCls: "border-rose-200 dark:border-rose-800",
    headerCls: "bg-rose-50 dark:bg-rose-900/30",
    accentCls: "bg-rose-500",
  },
  {
    badgeCls: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
    borderCls: "border-sky-200 dark:border-sky-800",
    headerCls: "bg-sky-50 dark:bg-sky-900/30",
    accentCls: "bg-sky-500",
  },
  {
    badgeCls:
      "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    borderCls: "border-emerald-200 dark:border-emerald-800",
    headerCls: "bg-emerald-50 dark:bg-emerald-900/30",
    accentCls: "bg-emerald-500",
  },
  {
    badgeCls:
      "bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300",
    borderCls: "border-fuchsia-200 dark:border-fuchsia-800",
    headerCls: "bg-fuchsia-50 dark:bg-fuchsia-900/30",
    accentCls: "bg-fuchsia-500",
  },
  {
    badgeCls:
      "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
    borderCls: "border-orange-200 dark:border-orange-800",
    headerCls: "bg-orange-50 dark:bg-orange-900/30",
    accentCls: "bg-orange-500",
  },
  {
    badgeCls:
      "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300",
    borderCls: "border-cyan-200 dark:border-cyan-800",
    headerCls: "bg-cyan-50 dark:bg-cyan-900/30",
    accentCls: "bg-cyan-500",
  },
];

// Cache for dynamic type configs
const dynamicTypeCache = {};
let dynamicColorIndex = 0;

function getTypeConfig(typeName) {
  if (TYPE_CONFIG[typeName]) return TYPE_CONFIG[typeName];
  if (dynamicTypeCache[typeName]) return dynamicTypeCache[typeName];

  // Generate a config for this unknown type
  const colorSet = DYNAMIC_COLORS[dynamicColorIndex % DYNAMIC_COLORS.length];
  dynamicColorIndex++;
  dynamicTypeCache[typeName] = {
    icon: "📄",
    label: typeName,
    description: `Documents classifiés: ${typeName}`,
    color: "dynamic",
    ...colorSet,
  };
  return dynamicTypeCache[typeName];
}

const DEFAULT_TYPE = {
  icon: "📄",
  label: "Autres Documents",
  description: "Documents divers",
  color: "gray",
  badgeCls: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  borderCls: "border-gray-200 dark:border-gray-700",
  headerCls: "bg-gray-50 dark:bg-gray-800/50",
  accentCls: "bg-gray-500",
};

function DocumentsPage({ registerVCHandlers }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [summaryCache, setSummaryCache] = useState({});
  const [summarizing, setSummarizing] = useState(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Delete state
  const [deleting, setDeleting] = useState(null);

  // Image captioning state
  const [imagePanel, setImagePanel] = useState(null); // filename or null
  const [imageCache, setImageCache] = useState({}); // {filename: {images: [...], image_count}}
  const [loadingImages, setLoadingImages] = useState(null);

  // TTS for summaries
  const {
    speak,
    stop: stopSpeech,
    speakingId,
    isSupported: ttsSupported,
  } = useTTS();

  // ─── Audio Guide: auto-announce on page load ───
  const { speakGuide } = useAudioGuide(
    documents.length > 0
      ? `Vous êtes sur la page Documents. ${documents.length} documents disponibles dans ${
          Object.keys(
            documents.reduce((a, d) => {
              a[d.doc_type] = true;
              return a;
            }, {}),
          ).length
        } catégories. Utilisez Tab pour naviguer entre les documents. Appuyez Entrée pour résumer un document.`
      : "Vous êtes sur la page Documents. Chargement en cours.",
    { autoSpeak: !loading, delay: 800 },
  );

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ─── Upload handlers ───
  const handleUpload = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const result = await uploadDocument(file);
      setUploadResult(result);
      playSound("success");
      announce(
        `Document ${result.filename} uploadé et classifié comme ${result.doc_type}. ${result.chunks} chunks indexés.`,
      );
      await loadDocuments(); // Refresh list
    } catch (err) {
      setUploadError(err.message);
      playSound("error");
      announce(`Erreur d'upload: ${err.message}`);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = ""; // Reset input
  };

  // ─── Delete handler ───
  const handleDelete = async (filename, e) => {
    e.stopPropagation();
    if (
      !confirm(
        `Supprimer définitivement "${filename}" ?\nCette action est irréversible.`,
      )
    )
      return;
    setDeleting(filename);
    try {
      await deleteDocument(filename);
      playSound("success");
      announce(`Document ${filename} supprimé.`);
      setSummaryCache((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });
      setImageCache((prev) => {
        const next = { ...prev };
        delete next[filename];
        return next;
      });
      if (expandedDoc === filename) setExpandedDoc(null);
      if (imagePanel === filename) setImagePanel(null);
      await loadDocuments();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
    setDeleting(null);
  };

  // Group documents by doc_type
  const grouped = documents.reduce((acc, doc) => {
    const type = doc.doc_type || "Autre";
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  // Order types: use TYPE_CONFIG keys order, then any remaining
  const orderedTypes = [
    ...Object.keys(TYPE_CONFIG).filter((t) => grouped[t]),
    ...Object.keys(grouped).filter((t) => !TYPE_CONFIG[t]),
  ];

  const handleSummarize = async (filename) => {
    // Toggle off
    if (expandedDoc === filename) {
      setExpandedDoc(null);
      return;
    }

    setExpandedDoc(filename);

    // Already cached
    if (summaryCache[filename]) return;

    setSummarizing(filename);
    try {
      const data = await summarizeDocument(filename);
      setSummaryCache((prev) => ({ ...prev, [filename]: data.summary }));
      playSound("success");
      announce(
        `Résumé généré pour ${filename}. Utilisez le bouton écouter pour l'entendre.`,
      );
    } catch (err) {
      setSummaryCache((prev) => ({
        ...prev,
        [filename]: `❌ Erreur: ${err.message}`,
      }));
      playSound("error");
      announce(`Erreur lors du résumé: ${err.message}`);
    }
    setSummarizing(null);
  };

  // ─── Image captioning handler ───
  const handleImages = async (filename) => {
    // Toggle off
    if (imagePanel === filename) {
      setImagePanel(null);
      return;
    }
    setImagePanel(filename);

    // Already cached
    if (imageCache[filename]) return;

    setLoadingImages(filename);
    try {
      const data = await getDocumentImages(filename);
      setImageCache((prev) => ({ ...prev, [filename]: data }));
    } catch (err) {
      setImageCache((prev) => ({
        ...prev,
        [filename]: { images: [], image_count: 0, error: err.message },
      }));
    }
    setLoadingImages(null);
  };

  // ─── Stats ───
  const totalChunks = documents.reduce((a, d) => a + d.chunk_count, 0);
  const totalTypes = orderedTypes.length;

  // ─── Flat list of all documents (for voice command ordinal access) ───
  const flatDocs = orderedTypes.flatMap((type) => grouped[type] || []);

  // ─── Voice Commands: register document-specific handlers ───
  const resolveIndex = useCallback(
    (idx) => {
      if (flatDocs.length === 0) return null;
      if (idx === -1) return flatDocs.length - 1; // "dernier"
      if (idx >= 0 && idx < flatDocs.length) return idx;
      return null;
    },
    [flatDocs],
  );

  useEffect(() => {
    if (registerVCHandlers) {
      registerVCHandlers({
        onDocSummarize: (idx) => {
          const i = resolveIndex(idx);
          if (i !== null) {
            handleSummarize(flatDocs[i].filename);
          } else {
            announce(`Aucun document à l'index ${idx + 1}`);
          }
        },
        onDocImages: (idx) => {
          const i = resolveIndex(idx);
          if (i !== null) {
            handleImages(flatDocs[i].filename);
          } else {
            announce(`Aucun document à l'index ${idx + 1}`);
          }
        },
        onDocUpload: () => {
          fileInputRef.current?.click();
        },
        onDocDelete: (idx) => {
          const i = resolveIndex(idx);
          if (i !== null) {
            const fn = flatDocs[i].filename;
            if (confirm(`Supprimer définitivement "${fn}" ?`)) {
              deleteDocument(fn).then(() => {
                playSound("success");
                announce(`Document ${fn} supprimé.`);
                loadDocuments();
              });
            }
          } else {
            announce(`Aucun document à l'index ${idx + 1}`);
          }
        },
      });
      return () => registerVCHandlers({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerVCHandlers, flatDocs.length, resolveIndex]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-tili-500 border-t-transparent rounded-full animate-spin"></div>
          Chargement des documents...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <p className="text-red-600 dark:text-red-400 font-medium">
            ❌ {error}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Vérifiez que le serveur API est démarré (port 8000)
          </p>
          <button
            onClick={loadDocuments}
            className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* ─── Header with stats ─── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          📄 Base Documentaire TILI
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Documents classés par catégorie — cliquez sur un document pour générer
          son résumé IA
        </p>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
            📁 {documents.length} documents
          </div>
          <div className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
            🧩 {totalChunks} chunks vectorisés
          </div>
          <div className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
            📂 {totalTypes} catégories
          </div>
          <div className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
            ✅ {Object.keys(summaryCache).length} résumés générés
          </div>
        </div>
      </div>

      {/* ─── Upload Zone ─── */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-tili-500 bg-tili-50 dark:bg-tili-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-tili-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-3 text-tili-600 dark:text-tili-400">
            <div className="w-5 h-5 border-2 border-tili-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">
              Upload et classification en cours...
            </span>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2">📤</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Glissez un PDF ici ou{" "}
              <span className="text-tili-600 dark:text-tili-400 underline">
                cliquez pour parcourir
              </span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Le type de document sera détecté automatiquement par l'IA
            </p>
          </>
        )}
      </div>

      {/* Upload result toast */}
      {uploadResult && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="text-sm text-green-700 dark:text-green-300">
            <span className="font-bold">✅ {uploadResult.filename}</span>{" "}
            classifié comme{" "}
            <span className="font-bold">{uploadResult.doc_type}</span> —{" "}
            {uploadResult.pages} pages, {uploadResult.chunks} chunks indexés
          </div>
          <button
            onClick={() => setUploadResult(null)}
            className="text-green-500 hover:text-green-700 text-lg ml-3"
          >
            ✕
          </button>
        </div>
      )}
      {uploadError && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="text-sm text-red-700 dark:text-red-300">
            ❌ {uploadError}
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-700 text-lg ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Document groups by type ─── */}
      <div className="space-y-6">
        {orderedTypes.map((type) => {
          const cfg = getTypeConfig(type);
          const docs = grouped[type];

          return (
            <div
              key={type}
              className={`border rounded-2xl overflow-hidden shadow-sm ${cfg.borderCls}`}
            >
              {/* Category header */}
              <div className={`px-5 py-4 ${cfg.headerCls}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cfg.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">
                        {cfg.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {cfg.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.badgeCls}`}
                  >
                    {docs.length} doc{docs.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Documents in this category */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {docs.map((doc) => {
                  const isExpanded = expandedDoc === doc.filename;
                  const isSummarizing = summarizing === doc.filename;
                  const hasSummary = !!summaryCache[doc.filename];
                  const isImageOpen = imagePanel === doc.filename;
                  const isLoadingImg = loadingImages === doc.filename;
                  const hasImages = imageCache[doc.filename]?.image_count > 0;
                  return (
                    <div
                      key={doc.filename}
                      className="bg-white dark:bg-gray-800"
                    >
                      {/* Document row */}
                      <div className="flex items-center">
                        {/* Color accent bar */}
                        <div
                          className={`w-1 self-stretch ${cfg.accentCls} opacity-40`}
                        ></div>

                        <button
                          onClick={() => handleSummarize(doc.filename)}
                          className="flex-1 px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                              {doc.filename.replace(".pdf", "")}
                            </p>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {doc.chunk_count} chunks
                              {hasSummary && (
                                <span className="ml-2 text-green-500">
                                  • résumé disponible
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            {/* Image captioning button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImages(doc.filename);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isImageOpen
                                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600"
                              }`}
                              aria-label={
                                isImageOpen
                                  ? "Fermer les descriptions d'images"
                                  : "Décrire les images du document"
                              }
                              title="Description IA des images (accessibilité)"
                            >
                              {isLoadingImg
                                ? "⏳ Analyse..."
                                : isImageOpen
                                  ? "▲ Fermer"
                                  : hasImages
                                    ? `📷 ${imageCache[doc.filename].image_count} image(s)`
                                    : "📷 Images"}
                            </button>

                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isExpanded
                                  ? "bg-tili-100 dark:bg-tili-900/50 text-tili-700 dark:text-tili-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-tili-50 dark:hover:bg-tili-900/30 hover:text-tili-600"
                              }`}
                            >
                              {isSummarizing
                                ? "⏳ En cours..."
                                : isExpanded
                                  ? "▲ Fermer"
                                  : hasSummary
                                    ? "📖 Voir résumé"
                                    : "✨ Résumer"}
                            </span>
                          </div>
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(doc.filename, e)}
                          disabled={deleting === doc.filename}
                          className="px-3 py-2 mr-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Supprimer ce document"
                        >
                          {deleting === doc.filename ? (
                            <span className="text-xs">⏳</span>
                          ) : (
                            <span className="text-sm">🗑️</span>
                          )}
                        </button>
                      </div>

                      {/* Expanded summary panel */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700/50 px-6 py-5 bg-gray-50/50 dark:bg-gray-850">
                          {isSummarizing ? (
                            <div className="flex items-center gap-3 text-gray-500 py-6 justify-center">
                              <div className="flex gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 bg-tili-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                ></span>
                                <span
                                  className="w-2.5 h-2.5 bg-tili-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                ></span>
                                <span
                                  className="w-2.5 h-2.5 bg-tili-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                ></span>
                              </div>
                              <span className="text-sm">
                                L'IA analyse le document et génère un résumé
                                structuré...
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-200">
                                <ReactMarkdown>
                                  {summaryCache[doc.filename]}
                                </ReactMarkdown>
                              </div>
                              {/* TTS: Read summary aloud */}
                              {ttsSupported && summaryCache[doc.filename] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const id = `summary-${doc.filename}`;
                                    speakingId === id
                                      ? stopSpeech()
                                      : speak(summaryCache[doc.filename], id);
                                  }}
                                  className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    speakingId === `summary-${doc.filename}`
                                      ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse"
                                      : "bg-tili-50 dark:bg-tili-900/30 text-tili-700 dark:text-tili-300 hover:bg-tili-100 dark:hover:bg-tili-900/50"
                                  }`}
                                  aria-label={
                                    speakingId === `summary-${doc.filename}`
                                      ? "Arrêter la lecture du résumé"
                                      : "Écouter le résumé à voix haute"
                                  }
                                >
                                  {speakingId === `summary-${doc.filename}`
                                    ? "🔊 Lecture en cours..."
                                    : "🔊 Écouter le résumé"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ─── Image captions panel ─── */}
                      {isImageOpen && (
                        <div className="border-t border-gray-100 dark:border-gray-700/50 px-6 py-5 bg-indigo-50/30 dark:bg-indigo-900/10">
                          {isLoadingImg ? (
                            <div className="flex items-center gap-3 text-gray-500 py-6 justify-center">
                              <div className="flex gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                ></span>
                                <span
                                  className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                ></span>
                                <span
                                  className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                ></span>
                              </div>
                              <span className="text-sm">
                                L'IA analyse les images du document... Cela peut
                                prendre quelques secondes.
                              </span>
                            </div>
                          ) : imageCache[doc.filename]?.error ? (
                            <p className="text-sm text-red-500 dark:text-red-400 py-2">
                              ❌ {imageCache[doc.filename].error}
                            </p>
                          ) : imageCache[doc.filename]?.image_count === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 py-2 text-center">
                              📷 Aucune image significative trouvée dans ce
                              document.
                            </p>
                          ) : (
                            <div>
                              <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3">
                                📷 {imageCache[doc.filename].image_count}{" "}
                                image(s) décrite(s) par l'IA
                              </h4>
                              <div className="grid gap-4">
                                {imageCache[doc.filename].images.map(
                                  (img, idx) => (
                                    <div
                                      key={idx}
                                      className="flex gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/40 shadow-sm"
                                      role="img"
                                      aria-label={img.caption_fr}
                                    >
                                      {/* Thumbnail */}
                                      <div className="shrink-0">
                                        <img
                                          src={`data:image/jpeg;base64,${img.thumbnail}`}
                                          alt={img.caption_fr}
                                          className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                        />
                                      </div>
                                      {/* Caption */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                                            Page {img.page}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {img.width}×{img.height}px
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                                          {img.caption_fr}
                                        </p>
                                        {img.caption_en !== img.caption_fr && (
                                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
                                            EN: {img.caption_en}
                                          </p>
                                        )}
                                        {/* TTS button for image caption */}
                                        {ttsSupported && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const id = `img-${doc.filename}-${idx}`;
                                              speakingId === id
                                                ? stopSpeech()
                                                : speak(
                                                    `Image page ${img.page}: ${img.caption_fr}`,
                                                    id,
                                                  );
                                            }}
                                            className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                              speakingId ===
                                              `img-${doc.filename}-${idx}`
                                                ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse"
                                                : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                            }`}
                                            aria-label={`Écouter la description de l'image page ${img.page}`}
                                          >
                                            {speakingId ===
                                            `img-${doc.filename}-${idx}`
                                              ? "🔊 Lecture..."
                                              : "🔊 Écouter"}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                              {/* Read all captions button */}
                              {ttsSupported &&
                                imageCache[doc.filename].images.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const allCaptions = imageCache[
                                        doc.filename
                                      ].images
                                        .map(
                                          (img) =>
                                            `Image page ${img.page}: ${img.caption_fr}`,
                                        )
                                        .join(". ");
                                      const id = `img-all-${doc.filename}`;
                                      speakingId === id
                                        ? stopSpeech()
                                        : speak(allCaptions, id);
                                    }}
                                    className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      speakingId === `img-all-${doc.filename}`
                                        ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse"
                                        : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60"
                                    }`}
                                    aria-label="Écouter toutes les descriptions d'images"
                                  >
                                    {speakingId === `img-all-${doc.filename}`
                                      ? "🔊 Lecture en cours..."
                                      : "🔊 Écouter toutes les descriptions"}
                                  </button>
                                )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentsPage;
