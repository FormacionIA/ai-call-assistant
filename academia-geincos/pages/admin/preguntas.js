import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function AdminPreguntas(){
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [slug, setSlug] = useState("");
  const [tipo, setTipo] = useState("opcion");
  const [enunciado, setEnunciado] = useState("");
  const [time, setTime] = useState(0);
  const [orden, setOrden] = useState(1);

  // opcion
  const [altsRaw, setAltsRaw] = useState("A) ...\nB) ...\nC) ...\nD) ...");
  const [correcta, setCorrecta] = useState("A");

  // ordenar
  const [pasosRaw, setPasosRaw] = useState("Paso 1\nPaso 2\nPaso 3");

  // emparejar
  const [paresRaw, setParesRaw] = useState("Pregunta 1 => Respuesta 1\nPregunta 2 => Respuesta 2");

  const [list, setList] = useState([]);
  const [modulos, setModulos] = useState([]);

  useEffect(()=>{
    const a = localStorage.getItem("admin_ok");
    if(a==="1") setOk(true); else router.replace("/login-admin");
  },[router]);

  useEffect(()=>{
    if(!ok) return;
    (async ()=>{
      const { data: m } = await supabase.from("modulos").select("slug,titulo").order("orden",{ascending:true});
      setModulos(m||[]);
    })();
  },[ok]);

  useEffect(()=>{
    if(!slug) { setList([]); return; }
    (async ()=>{
      const { data } = await supabase
        .from("preguntas_modulo")
        .select("*")
        .eq("slug_modulo", slug)
        .order("orden",{ascending:true});
      setList(data||[]);
    })();
  },[slug]);

  function parseData(){
    let data = { time_s: Number(time) };
    if(tipo==="opcion"){
      const lines = altsRaw.split("\n").map(s=>s.trim()).filter(Boolean);
      const alternativas = lines.map(line=>{
        const m = line.match(/^([A-Z])\)\s*(.*)$/);
        if(m) return { id: m[1], texto: m[2] };
        return null;
      }).filter(Boolean);
      data.alternativas = alternativas;
      data.correcta = correcta;
    }else if(tipo==="ordenar"){
      data.pasos = pasosRaw.split("\n").map(s=>s.trim()).filter(Boolean);
    }else if(tipo==="emparejar"){
      const pares = paresRaw.split("\n").map(s=>s.trim()).filter(Boolean).map(line=>{
        const [izq, der] = line.split("=>").map(x=>x.trim());
        return { izq, der };
      });
      data.pares = pares;
    }
    return data;
  }

  async function crear(){
    if(!slug){ alert("Selecciona un módulo."); return; }
    if(!enunciado){ alert("Enunciado requerido."); return; }
    const data = parseData();
    const payload = {
      slug_modulo: slug,
      tipo, enunciado,
      data,
      orden: Number(orden)
    };
    const { error } = await supabase.from("preguntas_modulo").insert([payload]);
    if(error){ alert("Error creando."); return; }
    setEnunciado(""); setOrden(1); setTime(0);
    setAltsRaw("A) ...\nB) ...\nC) ...\nD) ..."); setCorrecta("A");
    setPasosRaw("Paso 1\nPaso 2\nPaso 3");
    setParesRaw("Pregunta 1 => Respuesta 1\nPregunta 2 => Respuesta 2");
    const { data } = await supabase
      .from("preguntas_modulo").select("*").eq("slug_modulo", slug).order("orden",{ascending:true});
    setList(data||[]);
  }

  async function eliminar(id){
    await supabase.from("preguntas_modulo").delete().eq("id", id);
    const { data } = await supabase
      .from("preguntas_modulo").select("*").eq("slug_modulo", slug).order("orden",{ascending:true});
    setList(data||[]);
  }

  if(!ok) return null;

  return (
    <div style={page}>
      <div style={row}>
        <div>
          <div style={h1}>Preguntas con Checkpoints</div>
          <div style={sub}>Aparecen en la práctica, según el segundo del video (time_s).</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button style={btn} onClick={()=>router.push("/admin")}>Volver</button>
        </div>
      </div>

      <div style={card}>
        <div style={grid}>
          <div>
            <label style={lab}>Módulo</label>
            <select style={input} value={slug} onChange={e=>setSlug(e.target.value)}>
              <option value="">-- elige --</option>
              {modulos.map(m=><option key={m.slug} value={m.slug}>{m.slug} · {m.titulo}</option>)}
            </select>
          </div>
          <div>
            <label style={lab}>Tipo</label>
            <select style={input} value={tipo} onChange={e=>setTipo(e.target.value)}>
              <option value="opcion">Opción múltiple</option>
              <option value="ordenar">Ordenar pasos</option>
              <option value="emparejar">Emparejar</option>
            </select>
          </div>
          <div>
            <label style={lab}>Segundo del video (time_s)</label>
            <input style={input} type="number" value={time} onChange={e=>setTime(e.target.value)} />
          </div>
          <div>
            <label style={lab}>Orden en lista</label>
            <input style={input} type="number" value={orden} onChange={e=>setOrden(e.target.value)} />
          </div>
        </div>

        <label style={lab}>Enunciado</label>
        <input style={input} value={enunciado} onChange={e=>setEnunciado(e.target.value)} />

        {tipo==="opcion" && (
          <>
            <label style={lab}>Alternativas (una por línea con formato: A) texto)</label>
            <textarea style={{...input, minHeight:100}} value={altsRaw} onChange={e=>setAltsRaw(e.target.value)} />
            <label style={lab}>Correcta (A, B, C, ...)</label>
            <input style={input} value={correcta} onChange={e=>setCorrecta(e.target.value.toUpperCase())}/>
          </>
        )}

        {tipo==="ordenar" && (
          <>
            <label style={lab}>Pasos (uno por línea)</label>
            <textarea style={{...input, minHeight:100}} value={pasosRaw} onChange={e=>setPasosRaw(e.target.value)} />
          </>
        )}

        {tipo==="emparejar" && (
          <>
            <label style={lab}>Pares (formato: Izquierda => Derecha) por línea</label>
            <textarea style={{...input, minHeight:100}} value={paresRaw} onChange={e=>setParesRaw(e.target.value)} />
          </>
        )}

        <button style={{...btn, marginTop:10}} onClick={crear}>Crear pregunta</button>
      </div>

      <div style={card}>
        <div style={{fontWeight:800, marginBottom:8}}>Preguntas del módulo</div>
        <div style={{overflowX:"auto"}}>
          <table style={tbl}>
            <thead><tr>
              <th style={th}>Orden</th><th style={th}>time_s</th><th style={th}>Tipo</th><th style={th}>Enunciado</th><th style={th}>Acciones</th>
            </tr></thead>
            <tbody>
              {list.map(q=>(
                <tr key={q.id}>
                  <td style={td}>{q.orden}</td>
                  <td style={td}>{q.data?.time_s}</td>
                  <td style={td}>{q.tipo}</td>
                  <td style={td}>{q.enunciado}</td>
                  <td style={td}><button style={btnOutline} onClick={()=>eliminar(q.id)}>Eliminar</button></td>
                </tr>
              ))}
              {list.length===0 && <tr><td style={td} colSpan={5}>Sin preguntas.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const page={background:"#0f172a",minHeight:"100vh",color:"#fff",fontFamily:"sans-serif",padding:16};
const h1={fontWeight:800, fontSize:"1.1rem"};
const sub={color:"#94a3b8", fontSize:12};
const row={display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap", marginBottom:12};
const card={background:"#0b1220",border:"1px solid #334155",borderRadius:12,padding:12, marginBottom:12};
const grid={display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:8, marginBottom:8};
const lab={fontSize:12, color:"#cbd5e1"};
const input={width:"100%", background:"#111827", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#fff"};
const btn={background:"#22d3ee",border:"none",color:"#000",borderRadius:8,padding:"8px 12px",fontWeight:700,cursor:"pointer"};
const btnOutline={background:"transparent",border:"1px solid #334155",color:"#fff",borderRadius:8,padding:"6px 10px",fontWeight:600,cursor:"pointer"};
const tbl={width:"100%",borderCollapse:"collapse"};
const th={textAlign:"left",padding:"8px",borderBottom:"1px solid #334155", color:"#22d3ee"};
const td={padding:"8px",borderBottom:"1px solid #334155"};
