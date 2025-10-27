import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.API_KEY;

// --- Transcripción de audio ---
export async function transcribeAudio(binaryBuffer) {
  // Aquí deberías conectar con tu servicio de transcripción.
  // Por ahora devolvemos texto fijo para pruebas.
  return "No puedo pagar ahora mismo, quizá el próximo mes.";
}

// --- Generación de sugerencia ---
export async function getSuggestionFromLLM(clientText) {
  const systemPrompt = `
Eres una asistente de cobranza amable, empática y orientada al cierre.
Responde en máximo 2 líneas.
Incluye propuesta concreta (descuento, refinanciación o fecha exacta).
No digas que eres una IA.
Cliente dijo: "${clientText}"
`;

  // Aquí puedes usar cualquier endpoint de tu proveedor IA (por ejemplo OpenAI o Groq)
  // Ejemplo de integración si usas un modelo tipo chat:
  //
  // const r = await fetch("https://api.openai.com/v1/chat/completions", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${API_KEY}`,
  //     "Content-Type": "application/json"
  //   },
  //   body: JSON.stringify({
  //     model: "gpt-4o-mini",
  //     messages: [
  //       { role: "system", content: systemPrompt },
  //       { role: "user", content: clientText }
  //     ]
  //   })
  // });
  // const data = await r.json();
  // return data.choices[0].message.content;

  // --- Simulación de respuesta (para que funcione sin API) ---
  return `Entiendo que hoy se te complica, pero quiero ayudarte a cerrar esto con el mejor descuento posible. ¿Te parece si revisamos una alternativa de liquidación con rebaja hoy o agendamos un compromiso para el día 30?`;
}
