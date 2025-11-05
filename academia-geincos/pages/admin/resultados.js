import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function ResultadosAdmin(){
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
      const { data } = await supabase
        .from("evaluaciones_resultados")
        .select("*")
        .order("created_at",{ascending:false});
      setRows(data || []);
    })();
  },[ok]);

  function descargarCSV(){
    const headers = ["dni","slug_modulo","total","correctas","nota","aprobado","created_at"];
    const sep = ",";
    const lines = [headers.join(sep)];
    for(const r of rows){
      lines.push([
        r.dni,
        r.slug_modulo,
        r.total,
        r.correctas,
        r.nota,
        r.aprobado ? "APROBADO" : "NO APROBADO",
        new Date(r.created_at).toISOString()
      ].join(sep));
    }
    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "resultados.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  if(!ok) return null;

  return (
    <div style={page}>
      <div style={row}>
        <div>
          <div style={h1}>Resultados de Evaluación</div>
          <div style={sub}>Descarga en CSV con columnas</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button style={btn} onClick={()=>router.push("/admin")}>Volver</button>
          <button style={btn} onClick={descargarCSV}>Descargar CSV</button>
        </div>
      </div>

      <div style={card}>
        <div style={{overflowX:"auto"}}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={th}>DNI</th>
                <th style={th}>Módulo</th>
                <th style={th}>Total</th>
                <th style={th}>Correctas</th>
                <th style={th}>Nota</th>
                <th style={th}>Estado</th>
                <th style={th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={r.id || i}>
                  <td style={td}>{r.dni}</td>
                  <td style={td}>{r.slug_modulo}</td>
                  <td style={td}>{r.total}</td>
                  <td style={td}>{r.correctas}</td>
                  <td style={td}>{r.nota}</td>
                  <td style={td}>{r.aprobado ? "APROBADO" : "NO APROBADO"}</td>
                  <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {rows.length===0 && <tr><td style={td} colSpan={7}>Sin datos.</td></tr>}
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
const tbl={width:"100%",borderCollapse:"collapse"};
const th={textAlign:"left",padding:"8px",borderBottom:"1px solid #334155", color:"#22d3ee"};
const td={padding:"8px",borderBottom:"1px solid #334155"};
