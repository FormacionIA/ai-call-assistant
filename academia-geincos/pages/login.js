import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Login(){
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  async function entrar(){
    setMsg("");
    if(!dni || !pass){ setMsg("Completa DNI y contraseña."); return; }
    const { data: u } = await supabase.from("postulantes").select("*").eq("dni", dni).maybeSingle();
    if(!u){ setMsg("DNI no registrado."); return; }
    if(u.password !== pass){ setMsg("Contraseña incorrecta."); return; }
    localStorage.setItem("dni", dni);
    router.replace("/");
  }

  return (
    <div style={page}>
      <div style={card}>
        <div style={h1}>Acceso Postulante</div>
        <input style={input} placeholder="DNI" value={dni} onChange={e=>setDni(e.target.value)}/>
        <input style={input} placeholder="Contraseña" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
        {msg && <div style={{color:"#fca5a5", fontSize:12}}>{msg}</div>}
        <button style={btn} onClick={entrar}>Entrar</button>
        <button style={btnOutline} onClick={()=>router.push("/registro")}>Primera vez / Registrarme</button>
      </div>
    </div>
  );
}
const page={background:"#0f172a",minHeight:"100vh",display:"grid",placeItems:"center",color:"#fff",fontFamily:"sans-serif",padding:16};
const card={background:"#0b1220",border:"1px solid #334155",borderRadius:12,padding:16, width:"100%", maxWidth:420,display:"grid",gap:10};
const h1={fontWeight:800, fontSize:"1.1rem"};
const input={width:"100%", background:"#111827", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#fff"};
const btn={background:"#22d3ee",border:"none",color:"#000",borderRadius:8,padding:"10px 12px",fontWeight:700,cursor:"pointer"};
const btnOutline={background:"transparent",border:"1px solid #334155",color:"#fff",borderRadius:8,padding:"10px 12px",fontWeight:600,cursor:"pointer"};
