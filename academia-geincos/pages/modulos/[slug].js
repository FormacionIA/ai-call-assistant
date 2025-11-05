import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ModuloDetalle(){
  const router = useRouter();
  const { slug } = router.query;
  const [modulo, setModulo] = useState(null);

  useEffect(() => {
    if (!slug) return;
    supabase.from("modulos").select("*").eq("slug", slug).maybeSingle().then(({data})=>{
      setModulo(data || null);
    });
  }, [slug]);

  if (!modulo) return <div style={page}>Cargando módulo...</div>;

  return (
    <div style={page}>
      <h2 style={{marginBottom:8}}>{modulo.titulo}</h2>
      {modulo.video_url ? (
        <video controls style={{width:"100%", maxWidth:900, borderRadius:12, border:"1px solid #334155"}} src={modulo.video_url}/>
      ) : (
        <div style={{color:"#94a3b8"}}>Este módulo no tiene video_url.</div>
      )}

      <div style={{display:"flex", gap:"10px", marginTop:12}}>
        <button onClick={()=>router.push(`/practica/${slug}`)} style={btn}>Practicar</button>
        <button onClick={()=>router.push(`/evaluacion/${slug}`)} style={btnOutline}>Evaluación</button>
      </div>
    </div>
  );
}
const page={background:"#0f172a",minHeight:"100vh",color:"#fff",fontFamily:"sans-serif",padding:"20px"};
const btn={background:"#22d3ee",border:"none",color:"#000",borderRadius:8,padding:"10px 16px",fontWeight:700,cursor:"pointer"};
const btnOutline={background:"transparent",border:"1px solid #334155",color:"#fff",borderRadius:8,padding:"10px 16px",fontWeight:600,cursor:"pointer"};
