import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function Evaluacion(){
  const router = useRouter();
  const { slug } = router.query;
  const [dni, setDni] = useState(null);
  const [mod, setMod] = useState(null);
  const [qs, setQs] = useState([]);
  const [resp, setResp] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(()=>{
    const d = localStorage.getItem("dni");
    if(!d){ router.replace("/login"); return; }
    setDni(d);
  },[router]);

  useEffect(()=>{
    if(!slug) return;
    (async ()=>{
      const { data: m } = await supabase
        .from("modulos").select("slug,titulo").eq("slug", slug).maybeSingle();
      setMod(m || null);

      const { data: p } = await supabase
        .from("preguntas_modulo")
        .select("id,tipo,enunciado,data,orden")
        .eq("slug_modulo", slug)
        .order("orden",{ascending:true});
      setQs(p || []);
      const init = {};
      (p||[]).forEach(q=>{
        if(q.tipo==="ordenar") init[q.id] = q.data.pasos ? [...q.data.pasos] : [];
        if(q.tipo==="emparejar") init[q.id] = {};
      });
      setResp(init);
    })();
  },[slug]);

  function setOpcion(qid, val){ setResp(prev=>({...prev,[qid]:val})); }
  const [dragIndex, setDragIndex] = useState(null);
  function onDragStart(i){ setDragIndex(i); }
  function onDragOver(e){ e.preventDefault(); }
  function onDrop(qid, i){
    setResp(prev=>{
      const arr = [...(prev[qid] || [])];
      if(dragIndex===null || dragIndex===i) return prev;
      const [item] = arr.splice(dragIndex,1);
      arr.splice(i,0,item);
      return {...prev,[qid]:arr};
    });
    setDragIndex(null);
  }
  const [dragText, setDragText] = useState(null);
  function onDropLeft(qid, izq){
    if(!dragText) return;
    setResp(prev=>{
      const map = {...(prev[qid]||{})};
      map[izq] = dragText;
      return {...prev,[qid]:map};
    });
    setDragText(null);
  }

  async function enviar(){
    if(enviando) return;
    setEnviando(true);

    let total = qs.length;
    let correctas = 0;

    for(const q of qs){
      if(q.tipo==="opcion"){
        const ok = resp[q.id] && resp[q.id] === q.data?.correcta;
        if(ok) correctas++;
      }else if(q.tipo==="ordenar"){
        const alumno = resp[q.id] || [];
        const correcto = q.data?.pasos || [];
        const ok = alumno.length===correcto.length && alumno.every((v,i)=>v===correcto[i]);
        if(ok) correctas++;
      }else if(q.tipo==="emparejar"){
        const map = resp[q.id] || {};
        const pares = q.data?.pares || [];
        const ok = pares.every(p=> map[p.izq] === p.der);
        if(ok) correctas++;
      }
    }

    const nota = Math.round((correctas/Math.max(total,1))*100);
    const aprobado = nota >= 80;

    await supabase.from("evaluaciones_resultados").insert([{ dni, slug_modulo: slug, total, correctas, nota, aprobado
    }]);

    alert(`Tu nota: ${nota} (${aprobado ? "APROBADO":"NO APROBADO"})`);
    router.replace("/");
  }

  if(!mod) return <div style={page}>Cargando evaluación...</div>;

  return (
    <div style={page}>
      <h2>{mod.titulo} · Evaluación</h2>
      <div style={{display:"grid", gap:12, marginTop:8}}>
        {qs.map(q=>(
          <div key={q.id} style={card}>
            <div style={{fontWeight:700, marginBottom:8}}>{q.enunciado}</div>

            {q.tipo==="opcion" && (
              <div style={{display:"grid", gap:8}}>
                {(q.data?.alternativas||[]).map(alt=>(
                  <label key={alt.id} style={choice}>
                    <input type="radio" name={`q_${q.id}`}
                      checked={resp[q.id]===alt.id}
                      onChange={()=>setOpcion(q.id, alt.id)} />
                    <span><b>{alt.id})</b> {alt.texto}</span>
                  </label>
                ))}
              </div>
            )}

            {q.tipo==="ordenar" && (
              <div style={box}>
                {(resp[q.id]||q.data?.pasos||[]).map((paso,i)=>(
                  <div key={paso+"_"+i} style={chip}
                       draggable onDragStart={()=>onDragStart(i)}
                       onDragOver={onDragOver} onDrop={()=>onDrop(q.id,i)}>
                    <span style={{opacity:.7, marginRight:6}}>≡</span> {paso}
                  </div>
                ))}
              </div>
            )}

            {q.tipo==="emparejar" && (
              <div style={grid}>
                <div>
                  {(q.data?.pares||[]).map(p=>(
                    <div key={p.izq} style={drop}
                         onDragOver={(e)=>e.preventDefault()}
                         onDrop={()=>onDropLeft(q.id, p.izq)}>
                      <div style={{fontWeight:700, marginBottom:6}}>{p.izq}</div>
                      <div style={{opacity:.85, minHeight:20}}>
                        {(resp[q.id]||{})[p.izq] ? `→ ${(resp[q.id]||{})[p.izq]}` : "Arrastra aquí"}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  {(q.data?.pares||[]).map(p=>p.der).map((der,i)=>(
                    <div key={der+"_"+i} style={chip}
                         draggable onDragStart={()=>setDragText(der)}>
                      {der}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button disabled={enviando} onClick={enviar} style={btn}>
        {enviando ? "Enviando..." : "Enviar evaluación"}
      </button>
    </div>
  );
}
const page={background:"#0f172a",minHeight:"100vh",color:"#fff",fontFamily:"sans-serif",padding:"20px"};
const card={background:"#111827", border:"1px solid #334155", borderRadius:12, padding:12};
const choice={display:"flex",gap:8, background:"#0b1220", border:"1px solid #334155", borderRadius:10, padding:"8px"};
const box={background:"#0b1220", border:"1px dashed #475569", padding:8, borderRadius:10};
const chip={background:"#1f2937", border:"1px solid #475569", borderRadius:12, padding:"8px 12px", marginBottom:8, cursor:"grab"};
const grid={display:"grid", gridTemplateColumns:"1fr 200px", gap:12};
const drop={background:"#0b1220", border:"2px dashed #475569", padding:10, borderRadius:10, marginBottom:10};
const btn={background:"#22d3ee", border:"none", color:"#000", borderRadius:8, padding:"10px 16px", fontWeight:800, cursor:"pointer", marginTop:12};
