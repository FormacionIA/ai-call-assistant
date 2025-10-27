const panel = document.getElementById("ia-panel");
const toggleBtn = document.getElementById("ia-toggle");
const closeBtn = document.getElementById("close-panel");
const transcriptBox = document.getElementById("transcript");
const suggestionBox = document.getElementById("suggestion");
const copyBtn = document.getElementById("copy-btn");
const nextBtn = document.getElementById("next-btn");
const listenBtn = document.getElementById("listen-btn");
const statusEl = document.getElementById("status");

let lastClientText = "";
let listening = false;

toggleBtn.addEventListener("click", () => {
  panel.classList.toggle("ia-hidden");
});

closeBtn.addEventListener("click", () => {
  panel.classList.add("ia-hidden");
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(suggestionBox.innerText || "");
  copyBtn.innerText = "Copiado ✓";
  setTimeout(() => (copyBtn.innerText = "Copiar"), 1200);
});

nextBtn.addEventListener("click", async () => {
  const alt = await api_getSuggestion(lastClientText);
  if (alt && alt.suggestion) {
    suggestionBox.innerText = alt.suggestion.trim();
  }
});

listenBtn.addEventListener("click", async () => {
  if (!listening) {
    listening = true;
    statusEl.innerText = "Escuchando…";
    listenBtn.innerText = "⏸ Pausar";

    audioRecorder.start(async (wavBlob) => {
      const { clientText, suggestion } = await api_sendAudio(wavBlob);

      if (clientText) {
        lastClientText = clientText;
        transcriptBox.innerText = clientText;
      }
      if (suggestion) {
        suggestionBox.innerText = suggestion;
      }
    });

  } else {
    listening = false;
    statusEl.innerText = "Inactivo";
    listenBtn.innerText = "🎙 Escuchar";
    audioRecorder.stop();
  }
});
