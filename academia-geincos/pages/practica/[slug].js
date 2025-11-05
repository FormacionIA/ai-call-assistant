import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatSeconds(value) {
  const total = Math.max(0, Math.floor(Number(value) || 0));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function buildOrderState(questions) {
  const state = {};
  questions.forEach((q) => {
    if (q.tipo === "ordenar") {
      const steps = Array.isArray(q.data?.pasos) ? q.data.pasos : [];
      state[q.id] = shuffle(steps);
    }
  });
  return state;
}

function buildMatchState(questions) {
  const state = {};
  questions.forEach((q) => {
    if (q.tipo === "emparejar") {
      state[q.id] = {};
    }
  });
  return state;
}

function buildMatchOptions(questions) {
  const state = {};
  questions.forEach((q) => {
    if (q.tipo === "emparejar") {
      const pairs = Array.isArray(q.data?.pares) ? q.data.pares : [];
      state[q.id] = shuffle(
        pairs.map((pair, index) => ({
          id: `${index}-${pair.der}`,
          value: pair.der,
        }))
      );
    }
  });
  return state;
}

export default function PracticaModulo() {
  const router = useRouter();
  const { slug } = router.query;
  const videoRef = useRef(null);

  const [dni, setDni] = useState(null);
  const [modulo, setModulo] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [answers, setAnswers] = useState({});
  const [orderState, setOrderState] = useState({});
  const [matchState, setMatchState] = useState({});
  const [matchOptions, setMatchOptions] = useState({});
  const [completed, setCompleted] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [dragOption, setDragOption] = useState(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("dni") : null;
    if (!stored) {
      router.replace("/login");
      return;
    }
    setDni(stored);
  }, [router]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: mod } = await supabase
        .from("modulos")
        .select("slug,titulo,video_url,descripcion,contenido")
        .eq("slug", slug)
        .maybeSingle();
      setModulo(mod || null);

      const { data: lista } = await supabase
        .from("preguntas_modulo")
        .select("id,tipo,enunciado,data,orden")
        .eq("slug_modulo", slug)
        .order("orden", { ascending: true });

      const sorted = (lista || []).slice().sort((a, b) => {
        const timeA = Number(a.data?.time_s ?? 0);
        const timeB = Number(b.data?.time_s ?? 0);
        if (timeA !== timeB) return timeA - timeB;
        return Number(a.orden ?? 0) - Number(b.orden ?? 0);
      });
      setPreguntas(sorted);
    })();
  }, [slug]);

  useEffect(() => {
    setAnswers({});
    setCompleted({});
    setActiveId(null);
    setFeedback(null);
    setOrderState(buildOrderState(preguntas));
    setMatchState(buildMatchState(preguntas));
    setMatchOptions(buildMatchOptions(preguntas));
    setDragInfo(null);
    setDragOption(null);
  }, [preguntas]);

  const activeQuestion = useMemo(
    () => preguntas.find((q) => q.id === activeId) || null,
    [preguntas, activeId]
  );

  function handleTimeUpdate(event) {
    if (!preguntas.length || activeId) return;
    const current = event?.target?.currentTime ?? 0;
    const pending = preguntas.find((q) => {
      if (completed[q.id]) return false;
      const checkpoint = Number(q.data?.time_s ?? 0);
      return current >= checkpoint;
    });
    if (pending) {
      event.target.pause();
      setActiveId(pending.id);
      setFeedback(null);
    }
  }

  function handleRadio(qid, value) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function handleOrderDrop(qid, targetIndex) {
    setOrderState((prev) => {
      const current = prev[qid] ? [...prev[qid]] : [];
      if (!dragInfo || dragInfo.qid !== qid) return prev;
      const [moved] = current.splice(dragInfo.index, 1);
      current.splice(targetIndex, 0, moved);
      return { ...prev, [qid]: current };
    });
    setDragInfo(null);
  }

  function handleMatchDrop(qid, leftKey) {
    if (!dragOption || dragOption.qid !== qid) return;
    setMatchState((prev) => {
      const mapping = { ...(prev[qid] || {}) };
      Object.keys(mapping).forEach((key) => {
        if (mapping[key] === dragOption.option.id) {
          delete mapping[key];
        }
      });
      mapping[leftKey] = dragOption.option.id;
      return { ...prev, [qid]: mapping };
    });
    setDragOption(null);
  }

  function clearMatch(qid, leftKey) {
    setMatchState((prev) => {
      const mapping = { ...(prev[qid] || {}) };
      delete mapping[leftKey];
      return { ...prev, [qid]: mapping };
    });
  }

  function getAssignedValue(q, leftKey) {
    const options = matchOptions[q.id] || [];
    const mapping = matchState[q.id] || {};
    const optId = mapping[leftKey];
    const opt = options.find((item) => item.id === optId);
    return opt?.value || null;
  }

  function optionIsUsed(qid, optId) {
    const mapping = matchState[qid] || {};
    return Object.values(mapping).includes(optId);
  }

  function evaluateAnswer(question) {
    if (!question) return { ok: false, message: "Pregunta no disponible." };
    if (question.tipo === "opcion") {
      const selected = answers[question.id];
      if (!selected) return { ok: false, message: "Selecciona una alternativa." };
      const correct = question.data?.correcta;
      return selected === correct
        ? { ok: true, message: "¡Respuesta correcta!" }
        : { ok: false, message: `La alternativa correcta es ${correct}.` };
    }
    if (question.tipo === "ordenar") {
      const arr = orderState[question.id] || [];
      const expected = Array.isArray(question.data?.pasos) ? question.data.pasos : [];
      const isSame = arr.length === expected.length && arr.every((value, index) => value === expected[index]);
      return isSame
        ? { ok: true, message: "¡Orden correcto!" }
        : { ok: false, message: "Revisa el orden de los pasos." };
    }
    if (question.tipo === "emparejar") {
      const mapping = matchState[question.id] || {};
      const expected = Array.isArray(question.data?.pares) ? question.data.pares : [];
      const options = matchOptions[question.id] || [];
      const resolver = (id) => options.find((opt) => opt.id === id)?.value;
      const allAnswered = expected.every((pair) => mapping[pair.izq]);
      if (!allAnswered) {
        return { ok: false, message: "Completa todas las asociaciones." };
      }
      const allMatch = expected.every((pair) => resolver(mapping[pair.izq]) === pair.der);
      return allMatch
        ? { ok: true, message: "¡Asociaciones correctas!" }
        : { ok: false, message: "Algunas asociaciones no coinciden." };
    }
    return { ok: false, message: "Tipo de pregunta no soportado." };
  }

  function enviarRespuesta() {
    const result = evaluateAnswer(activeQuestion);
    setFeedback(result);
    if (result.ok && activeQuestion) {
      setCompleted((prev) => ({ ...prev, [activeQuestion.id]: true }));
    }
  }

  function continuarVideo() {
    setFeedback(null);
    setActiveId(null);
    if (videoRef.current) {
      videoRef.current.play();
    }
  }

  function reiniciarPractica() {
    setAnswers({});
    setCompleted({});
    setActiveId(null);
    setFeedback(null);
    setOrderState(buildOrderState(preguntas));
    setMatchState(buildMatchState(preguntas));
    setMatchOptions(buildMatchOptions(preguntas));
    setDragInfo(null);
    setDragOption(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  const allCompleted = preguntas.length > 0 && Object.keys(completed).length === preguntas.length;

  return (
    <div style={page}>
      <div style={topRow}>
        <div style={topLeft}>
          <button style={btnOutline} onClick={() => router.push("/")}>Volver</button>
          {dni && <span style={dniBadge}>DNI · {dni}</span>}
        </div>
        <button style={btn} onClick={reiniciarPractica} disabled={!preguntas.length}>Reiniciar práctica</button>
      </div>

      <h2 style={{ marginBottom: 6 }}>{modulo?.titulo || "Práctica"}</h2>
      {modulo?.contenido && <p style={paragraph}>{modulo.contenido}</p>}

      <div style={videoWrapper}>
        {modulo?.video_url ? (
          <video
            ref={videoRef}
            style={videoStyles}
            controls
            src={modulo.video_url}
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <div style={noVideo}>Este módulo no cuenta con un video asociado.</div>
        )}

        {activeQuestion && (
          <div style={overlay}>
            <div style={questionCard}>
              <div style={badge}>Checkpoint · {formatSeconds(activeQuestion.data?.time_s ?? 0)}</div>
              <div style={questionTitle}>{activeQuestion.enunciado}</div>

              {activeQuestion.tipo === "opcion" && (
                <div style={{ display: "grid", gap: 8 }}>
                  {(activeQuestion.data?.alternativas || []).map((alt) => (
                    <label key={alt.id} style={choice}>
                      <input
                        type="radio"
                        name={`op-${activeQuestion.id}`}
                        checked={answers[activeQuestion.id] === alt.id}
                        onChange={() => handleRadio(activeQuestion.id, alt.id)}
                      />
                      <span><b>{alt.id})</b> {alt.texto}</span>
                    </label>
                  ))}
                </div>
              )}

              {activeQuestion.tipo === "ordenar" && (
                <div style={box}>
                  {(orderState[activeQuestion.id] || []).map((step, index) => (
                    <div
                      key={`${step}-${index}`}
                      style={chip}
                      draggable
                      onDragStart={() => setDragInfo({ qid: activeQuestion.id, index })}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleOrderDrop(activeQuestion.id, index)}
                    >
                      <span style={{ opacity: 0.6, marginRight: 8 }}>≡</span> {step}
                    </div>
                  ))}
                </div>
              )}

              {activeQuestion.tipo === "emparejar" && (
                <div style={matchGrid}>
                  <div>
                    {(activeQuestion.data?.pares || []).map((pair) => (
                      <div
                        key={pair.izq}
                        style={drop}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleMatchDrop(activeQuestion.id, pair.izq)}
                      >
                        <div style={{ fontWeight: 700 }}>{pair.izq}</div>
                        <div style={{ opacity: 0.85, minHeight: 20 }}>
                          {getAssignedValue(activeQuestion, pair.izq) || "Arrastra aquí"}
                        </div>
                        {getAssignedValue(activeQuestion, pair.izq) && (
                          <button
                            style={smallBtn}
                            onClick={() => clearMatch(activeQuestion.id, pair.izq)}
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    {(matchOptions[activeQuestion.id] || []).map((option) => (
                      <div
                        key={option.id}
                        style={{
                          ...chip,
                          opacity: optionIsUsed(activeQuestion.id, option.id) ? 0.5 : 1,
                          cursor: optionIsUsed(activeQuestion.id, option.id) ? "not-allowed" : "grab",
                        }}
                        draggable={!optionIsUsed(activeQuestion.id, option.id)}
                        onDragStart={() =>
                          !optionIsUsed(activeQuestion.id, option.id) &&
                          setDragOption({ qid: activeQuestion.id, option })
                        }
                      >
                        {option.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feedback && (
                <div
                  style={{
                    marginTop: 10,
                    color: feedback.ok ? "#4ade80" : "#f87171",
                    fontWeight: 600,
                  }}
                >
                  {feedback.message}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button style={btn} onClick={enviarRespuesta}>Validar respuesta</button>
                <button
                  style={{ ...btnOutline, opacity: feedback?.ok ? 1 : 0.4, cursor: feedback?.ok ? "pointer" : "not-allowed" }}
                  disabled={!feedback?.ok}
                  onClick={continuarVideo}
                >
                  Continuar video
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Checkpoints del módulo</div>
        {preguntas.length === 0 && <div style={{ color: "#94a3b8" }}>Sin preguntas configuradas.</div>}
        {preguntas.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {preguntas.map((q) => {
              const status = completed[q.id]
                ? "Completada"
                : activeId === q.id
                ? "En curso"
                : "Pendiente";
              return (
                <div key={q.id} style={progressRow}>
                  <div style={timeBadge}>{formatSeconds(q.data?.time_s ?? 0)}</div>
                  <div style={{ flex: 1 }}>{q.enunciado}</div>
                  <div style={statusStyles(status)}>{status}</div>
                </div>
              );
            })}
          </div>
        )}
        {allCompleted && <div style={{ color: "#22d3ee", marginTop: 8 }}>¡Has respondido todas las preguntas!</div>}
      </div>
    </div>
  );
}

function statusStyles(status) {
  const base = {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  };
  if (status === "Completada") return { ...base, background: "rgba(34,211,238,0.15)", color: "#22d3ee" };
  if (status === "En curso") return { ...base, background: "rgba(250,204,21,0.15)", color: "#facc15" };
  return { ...base, background: "rgba(148,163,184,0.12)", color: "#94a3b8" };
}

const page = {
  background: "#0f172a",
  minHeight: "100vh",
  color: "#fff",
  fontFamily: "sans-serif",
  padding: 20,
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const topLeft = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const videoWrapper = {
  position: "relative",
  marginBottom: 16,
};

const overlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(15,23,42,0.92)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const videoStyles = {
  width: "100%",
  maxWidth: 960,
  borderRadius: 14,
  border: "1px solid #334155",
};

const questionCard = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 20,
  width: "100%",
  maxWidth: 720,
  display: "grid",
  gap: 12,
};

const badge = {
  alignSelf: "flex-start",
  background: "rgba(34,211,238,0.15)",
  color: "#22d3ee",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const questionTitle = {
  fontWeight: 800,
  fontSize: "1.05rem",
};

const choice = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  background: "#0b1220",
  border: "1px solid #334155",
  borderRadius: 10,
  padding: "8px 10px",
};

const box = {
  background: "#0b1220",
  border: "1px dashed #475569",
  borderRadius: 12,
  padding: 10,
};

const chip = {
  background: "#1f2937",
  border: "1px solid #475569",
  borderRadius: 12,
  padding: "10px 14px",
  marginBottom: 8,
  cursor: "grab",
  userSelect: "none",
};

const matchGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 220px",
  gap: 16,
};

const drop = {
  background: "#0b1220",
  border: "2px dashed #475569",
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
  display: "grid",
  gap: 8,
};

const smallBtn = {
  justifySelf: "start",
  background: "transparent",
  border: "1px solid #334155",
  color: "#94a3b8",
  borderRadius: 8,
  padding: "4px 10px",
  fontSize: 12,
  cursor: "pointer",
};

const btn = {
  background: "#22d3ee",
  border: "none",
  color: "#000",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnOutline = {
  background: "transparent",
  border: "1px solid #334155",
  color: "#fff",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: 600,
  cursor: "pointer",
};

const dniBadge = {
  background: "rgba(148,163,184,0.12)",
  color: "#cbd5e1",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 600,
};

const card = {
  background: "#0b1220",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 16,
  marginTop: 16,
};

const timeBadge = {
  background: "rgba(148,163,184,0.15)",
  color: "#94a3b8",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 600,
};

const progressRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const paragraph = {
  color: "#cbd5f5",
  marginBottom: 12,
  maxWidth: 720,
};

const noVideo = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 24,
  color: "#94a3b8",
  textAlign: "center",
};
