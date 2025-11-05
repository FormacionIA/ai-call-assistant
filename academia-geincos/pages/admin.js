import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function AdminPanel(){
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(()=>{
    const a = localStorage.getItem("admin_ok");
    if(a==="1") setOk(true); else router.replace("/login-admin");
  },[router]);

  useEffect(()=>{
    if(!ok) return;
    (async ()=>{
      const { data: users } = await supabase
        .from("postulantes")
        .select("dni, nombreCompleto, cartera, created_at")
        .order("created_at", { ascending:false });
      setRows(users || []);
    })();
  },[ok]);

  function salir(){ localStorage.removeItem("admin_ok"); router.replace("/login-admin"); }

  if(!ok) return null;

  return (
    <div style={page}>
      <div style={row}>
        <div>
          <div style={h1}>Panel Admin · Academia Geincos</div>
          <div style={sub}>Acceso autorizado: Formación</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button style={btn} onClick={()=>router.push("/admin/modulos")}>Gestionar módulos</button>
          <button style={btn} onClick={()=>router.push("/admin/preguntas")}>Gestionar preguntas</button>
          <button style={btn} onClick={()=>router.push("/admin/resultados")}>Resultados</button>
          <button style={btnOutline} onClick={salir}>Cerrar sesión</button>
        </div>
      </div>

      <div style={card}>
        <div style={{fontWeight:800, marginBottom:8}}>Postulantes registrados</div>
        <div style={{overflowX:"auto"}}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>DNI</th>
                <th style={th}>Nombre</th>
                <th style={th}>Cartera</th>
                <th style={th}>Fecha registro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.dni}>
                  <td style={td}>{r.dni}</td>
                  <td style={td}>{r.nombreCompleto}</td>
                  <td style={td}>{r.cartera}</td>
                  <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {rows.length===0 && <tr><td style={td} colSpan={4}>Sin registros.</td></tr>}
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
const card={background:"#0b1220",border:"1px solid #334155",borderRadius:12,padding:12};
const btn={background:"#22d3ee",border:"none",color:"#000",borderRadius:8,padding:"8px 12px",fontWeight:700,cursor:"pointer"};
const btnOutline={background:"transparent",border:"1px solid #334155",color:"#fff",borderRadius:8,padding:"8px 12px",fontWeight:600,cursor:"pointer"};
const tbl={width:"100%",borderCollapse:"collapse"};
const th={textAlign:"left",padding:"8px",borderBottom:"1px solid #334155", color:"#22d3ee"};
const td={padding:"8px",borderBottom:"1px solid #334155"};
