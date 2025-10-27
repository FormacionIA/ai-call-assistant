// Cambia la URL al dominio que StackBlitz te asigne para el backend
const API_BASE = "http://localhost:3000";

async function api_sendAudio(blob) {
  const form = new FormData();
  form.append("audio", blob, "chunk.webm");

  const res = await fetch(`${API_BASE}/api/live-chunk`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) return {};
  return res.json();
}

async function api_getSuggestion(textFromClient) {
  const res = await fetch(`${API_BASE}/api/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientText: textFromClient || "" }),
  });

  if (!res.ok) return {};
  return res.json();
}

window.api_sendAudio = api_sendAudio;
window.api_getSuggestion = api_getSuggestion;
