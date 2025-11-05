import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Home(){
  const router = useRouter();
  const [dni, setDni] = useState(null);
  const [alumno, setAlumno] = useState(null);
  const [mods, setMods] = useState([]);

  useEffect(() => {
    const d = localStorage.getItem("dni");
    if (!d) { router.replace("/login"); return; }
    setDni(d);
  }, [router]);

  useEffect(() => {
    if (!dni) return;
    (async ()=>{
      const { data: u } = await supabase
        .from("postulantes").select("*").eq("dni", dni).maybeSingle();
      setAlumno(u || null);

      const { data: m } = await supabase
        .from("modulos")
        .select("slug,titulo,obligatorio,orden,video_url")
        .order("orden", { ascending: true });
      setMods(m || []);
    })();
  }, [dni]);

  function logout(){
    localStorage.removeItem("dni");
    router.replace("/login");
  }

  if (!dni) return null;

  return (
    <div style={page}>
      <div style={card}>
        <div style={row}>
          <div>
            <div style={h1}>Panel del Postulante</div>
            <div style={sub}>Bienvenido, {alumno?.nombreCompleto || dni}</div>
          </div>
          <div style={{display:"flex", gap:8}}>
            <button style={btn} onClick={()=>router.push("/registro")}>Cambiar usuario</button>
            <button style={btnOutline} onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={section}>Módulos disponibles</div>
        <div style={{display:"grid", gap:"10px"}}>
          {mods.map(m=>(
            <div key={m.slug} style={modRow}>
              <div>
                <div style={{fontWeight:700}}>{m.orden}. {m.titulo}</div>
                <div style={{fontSize:12, color:"#94a3b8"}}>
                  {m.obligatorio ? "OBLIGATORIO" : "Opcional"}
                </div>
              </div>
              <div style={{display:"flex", gap:8}}>
                <button style={btn} onClick={()=>router.push(`/modulos/${m.slug}`)}>Abrir</button>
                <button style={btn} onClick={()=>router.push(`/practica/${m.slug}`)}>Practicar</button>
                <button style={btnOutline} onClick={()=>router.push(`/evaluacion/${m.slug}`)}>Evaluación</button>
              </div>
            </div>
          ))}
          {mods.length===0 && <div style={{color:"#94a3b8"}}>Aún no hay módulos.</div>}
        </div>
      </div>
    </div>
  );
}
const page={background:"#0f172a",minHeight:"100vh",color:"#fff",fontFamily:"sans-serif",padding:16};
const card={background:"#0b1220",border:"1px solid #334155",borderRadius:12,padding:12,marginBottom:12};
const h1={fontWeight:800,fontSize:"1.1rem"};
const sub={color:"#94a3b8",fontSize:12};
const row={display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"};
const section={fontWeight:800, marginBottom:8};
const modRow={display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px",background:"#111827",border:"1px solid #334155",borderRadius:10};
const btn={background:"#22d3ee",border:"none",color:"#000",borderRadius:8,padding:"8px 12px",fontWeight:700,cursor:"pointer"};
const btnOutline={background:"transparent",border:"1px solid #334155",color:"#fff",borderRadius:8,padding:"8px 12px",fontWeight:600,cursor:"pointer"};
