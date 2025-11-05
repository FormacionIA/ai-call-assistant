import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function AdminModulos(){
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [mods, setMods] = useState([]);

  // form
  const [slug, setSlug] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contenido, setContenido] = useState("");
  const [obligatorio, setObligatorio] = useState(true);
  const [orden, setOrden] = useState(1);
  const [videoURL, setVideoURL] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(()=>{
    const a = localStorage.getItem("admin_ok");
    if(a==="1") setOk(true); else router.replace("/login-admin");
  },[router]);

  useEffect(()=>{
    if(!ok) return;
    listar();
  },[ok]);

  async function listar(){
    const { data } = await supabase
      .from("modulos")
      .select("*")
      .order("orden", { ascending: true });
    setMods(data || []);
  }

  async function crear(){
    setMsg("");
    if(!slug || !titulo){ setMsg("Completa slug y título."); return; }
    const payload = {
      slug, titulo, descripcion, contenido,
      obligatorio, orden:Number(orden), video_url: videoURL
    };
    const { error } = await supabase.from("modulos").insert([payload]);
    if(error){ setMsg("Error creando."); return; }
    setSlug(""); setTitulo(""); setDescripcion(""); setContenido("");
    setObligatorio(true); setOrden(1); setVideoURL("");
    await listar();
    setMsg("Módulo creado ✅");
  }

  async function eliminar(s){
    await supabase.from("modulos").delete().eq("slug", s);
    listar();
  }

  if(!ok) return null;

  return (
    <div style={page}>
      <div style={row}>
        <div>
          <div style={h1}>Gestión de Módulos</div>
          <div style={sub}>Define contenido y URL del video</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button style={btn} onClick={()=>router.push("/admin")}>Volver</button>
        </div>
      </div>

      <div style={card}>
        <div style={{fontWeight:800, marginBottom:8}}>Nuevo módulo</div>
        <div style={grid}>
          <div>
            <label style={lab}>Slug</label>
            <input style={input} value={slug} onChange={e=>setSlug(e.target.value)} placeholder="sin espacios, ej: induccion"/>
          </div>
          <div>
            <label style={lab}>Título</label>
            <input style={input} value={titulo} onChange={e=>setTitulo(e.target.value)} />
          </div>
          <div>
            <label style={lab}>Orden</label>
            <input style={input} type="number" value={orden} onChange={e=>setOrden(e.target.value)} />
          </div>
          <div>
            <label style={lab}>Obligatorio</label>
            <select style={input} value={obligatorio ? "si":"no"} onChange={e=>setObligatorio(e.target.value==="si")}>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <label style={lab}>Descripción corta</label>
        <input style={input} value={descripcion} onChange={e=>setDescripcion(e.target.value)} />

        <label style={lab}>Contenido (texto largo, speech, pasos, etc.)</label>
        <textarea style={{...input, minHeight:100}} value={contenido} onChange={e=>setContenido(e.target.value)} />

        <label style={lab}>URL del video (pública)</label>
        <input style={input} value={videoURL} onChange={e=>setVideoURL(e.target.value)} placeholder="https://...mp4" />

        {msg && <div style={{color:"#cbd5e1", fontSize:12}}>{msg}</div>}
        <button style={{...btn, marginTop:8}} onClick={crear}>Guardar módulo</button>
      </div>

      <div style={card}>
        <div style={{fontWeight:800, marginBottom:8}}>Módulos existentes</div>
        <div style={{overflowX:"auto"}}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>Orden</th>
                <th style={th}>Slug</th>
                <th style={th}>Título</th>
                <th style={th}>Oblig.</th>
                <th style={th}>Video</th>
                <th style={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mods.map(m=>(
                <tr key={m.slug}>
                  <td style={td}>{m.orden}</td>
                  <td style={td}>{m.slug}</td>
                  <td style={td}>{m.titulo}</td>
                  <td style={td}>{m.obligatorio ? "Sí":"No"}</td>
                  <td style={td} title={m.video_url} >{m.video_url ? "OK":"—"}</td>
                  <td style={td}><button style={btnOutline} onClick={()=>eliminar(m.slug)}>Eliminar</button></td>
                </tr>
              ))}
              {mods.length===0 && <tr><td style={td} colSpan={6}>Sin módulos.</td></tr>}
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
const btn={background:"#22d3ee",border:"none",color:"#000",borderRadius:8,padding:"8px 12px",fontWeight:700,cursor:"pointer"};
const btnOutline={background:"transparent",border:"1px solid #334155",color:"#fff",borderRadius:8,padding:"8px 12px",fontWeight:600,cursor:"pointer"};
const tbl={width:"100%",borderCollapse:"collapse"};
const th={textAlign:"left",padding:"8px",borderBottom:"1px solid #334155", color:"#22d3ee"};
const td={padding:"8px",borderBottom:"1px solid #334155"};
const grid={display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:8, marginBottom:8};
const lab={fontSize:12, color:"#cbd5e1"};
const input={width:"100%", background:"#111827", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#fff"};
