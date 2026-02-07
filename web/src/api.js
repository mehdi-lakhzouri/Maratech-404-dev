const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function askQuestion(question, chatHistory = []) {
  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, chat_history: chatHistory }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
  return res.json();
}

export function askStream(question, onToken, onDone, onError) {
  const url = `${API_URL}/ask/stream?question=${encodeURIComponent(question)}`;
  const source = new EventSource(url);

  source.addEventListener("token", (e) => {
    onToken(e.data);
  });

  source.addEventListener("done", () => {
    source.close();
    if (onDone) onDone();
  });

  source.addEventListener("error", (e) => {
    source.close();
    if (onError) onError(e);
  });

  source.onerror = () => {
    source.close();
    if (onError) onError(new Error("Connexion SSE perdue"));
  };

  return source;
}

export async function getDocuments() {
  const res = await fetch(`${API_URL}/documents`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function summarizeDocument(filename) {
  const res = await fetch(`${API_URL}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function deleteDocument(filename) {
  const res = await fetch(
    `${API_URL}/documents/${encodeURIComponent(filename)}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function getDocumentImages(filename) {
  const res = await fetch(
    `${API_URL}/documents/${encodeURIComponent(filename)}/images`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  return res.json();
}
