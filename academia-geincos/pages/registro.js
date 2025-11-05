import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Registro(){
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [cartera, setCartera] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  async function crear(){
    setMsg("");
    if(!dni || !nombre || !cartera || !pass){ setMsg("Completa todos los campos."); return; }
    const { data: existe } = await supabase.from("postulantes").select("dni").eq("dni", dni).maybeSingle();
    if(existe){ setMsg("DNI ya registrado."); return; }
    const { error } = await supabase.from("postulantes").insert([{ dni, nombreCompleto:nombre, cartera, password: pass }]);
    if(error){ setMsg("Error registrando."); return; }
    localStorage.setItem("dni", dni);
    router.replace("/");
  }

  return (
    <div style={page}>
      <div style={card}>
        <div style={h1}>Registro de Postulante</div>
        <input style={input} placeholder="DNI" value={dni} onChange={e=>setDni(e.target.value)}/>
        <input style={input} placeholder="Nombre completo" value={nombre} onChange={e=>setNombre(e.target.value)}/>
        <input style={input} placeholder="Cartera (BANCOS, AUNA, etc.)" value={cartera} onChange={e=>setCartera(e.target.value)}/>
        <input style={input} placeholder="Contraseña" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
        {msg && <div style={{color:"#fca5a5", fontSize:12}}>{msg}</div>}
        <button style={btn} onClick={crear}>Crear cuenta</button>
        <button style={btnOutline} onClick={()=>router.push("/login")}>Ya tengo cuenta</button>
      </div>
    </div>
  );
}
const page={background:"#0f172a",minHeight:"100vh",display:"grid",placeItems:"center",color:"#fff",fontFamily:"sans-serif",padding:16};
const card={background:"#0b1220",border:"1px solid #334155",borderRadius:12,padding:16, width:"100%", maxWidth:460,display:"grid",gap:10};
const h1={fontWeight:800, fontSize:"1.1rem"};
const input={width:"100%", background:"#111827", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#fff"};
const btn={background:"#22d3ee",border:"none",color:"#000",borderRadius:8,padding:"10px 12px",fontWeight:700,cursor:"pointer"};
const btnOutline={background:"transparent",border:"1px solid #334155",color:"#fff",borderRadius:8,padding:"10px 12px",fontWeight:600,cursor:"pointer"};
