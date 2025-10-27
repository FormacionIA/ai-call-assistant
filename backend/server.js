
---

## ⚙️ 5. backend/server.js

```js
import express from "express";
import fileUpload from "express-fileupload";
import cors from "cors";
import dotenv from "dotenv";
import { transcribeAudio, getSuggestionFromLLM } from "./llm.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Servir el frontend estático desde /app (opcional)
app.use("/app", express.static("frontend"));

app.post("/api/live-chunk", async (req, res) => {
  try {
    const audioFile = req.files?.audio;
    if (!audioFile) {
      return res.status(400).json({ error: "no-audio" });
    }

    const clientText = await transcribeAudio(audioFile.data);
    const suggestion = await getSuggestionFromLLM(clientText);

    res.json({
      clientText,
      suggestion,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server-error" });
  }
});

app.post("/api/suggest", async (req, res) => {
  try {
    const { clientText } = req.body;
    const suggestion = await getSuggestionFromLLM(clientText || "");
    res.json({ suggestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server-error" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend del asistente corriendo en puerto ${PORT}`);
});
