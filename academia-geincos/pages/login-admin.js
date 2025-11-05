import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginAdmin(){
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  function entrar(){
    if(user.toLowerCase() === "formacion@geincos" && pass === "Geincos25*"){
      localStorage.setItem("admin_ok","1");
      router.replace("/admin");
    } else {
      setMsg("Credenciales incorrectas.");
    }
  }

  return (
    <div style={page}>
      <div style={card}>
        <div style={h1}>Acceso Formación</div>
        <input style={input} placeholder="Usuario" value={user} onChange={e=>setUser(e.target.value)}/>
        <input style={input} type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)}/>
        {msg && <div style={{color:"#fca5a5", fontSize:12}}>{msg}</div>}
        <button style={btn} onClick={entrar}>Entrar</button>
      </div>
    </div>
  );
}
const page={background:"#0f172a",minHeight:"100vh",display:"grid",placeItems:"center",color:"#fff",fontFamily:"sans-serif",padding:16};
const card={background:"#0b1220",border:"1px solid #334155",borderRadius:12,padding:16, width:"100%", maxWidth:420,display:"grid",gap:10};
const h1={fontWeight:800, fontSize:"1.1rem"};
const input={width:"100%", background:"#111827", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#fff"};
const btn={background:"#22d3ee",border:"none",color:"#000",borderRadius:8,padding:"10px 12px",fontWeight:700,cursor:"pointer"};
