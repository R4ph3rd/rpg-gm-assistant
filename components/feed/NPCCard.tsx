"use client";
import { NPC } from "@/lib/types";

interface Props {
  npc?: NPC & { entrance?: string; secret?: string; alignment?: string };
  loading: boolean;
  error?: string;
}

export default function NPCCard({ npc, loading, error }: Props) {
  if (loading) return (
    <div style={{padding:"24px",display:"flex",alignItems:"center",gap:"12px",color:"var(--text-muted)"}}>
      <span className="spinner"/>
      <span style={{fontSize:"14px"}}>Improvising character…</span>
    </div>
  );

  if (error) return (
    <div style={{padding:"16px 18px",color:"var(--red)",fontSize:"13px",
      background:"var(--red-dim)",border:"1px solid rgba(201,85,85,0.2)",borderRadius:"10px"}}>
      {error}
    </div>
  );

  if (!npc) return null;

  const isAnt = npc.alignment === "antagonist";

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <span style={{fontSize:"16px"}}>🧙</span>
        <h2>New Character</h2>
        <span style={{marginLeft:"auto",padding:"2px 10px",borderRadius:"999px",fontSize:"11px",
          fontWeight:600,
          background: isAnt ? "var(--red-dim)" : "var(--green-dim)",
          color: isAnt ? "var(--red)" : "var(--green)",
          border:`1px solid ${isAnt ? "rgba(201,85,85,0.3)" : "rgba(76,170,122,0.3)"}`}}>
          {npc.alignment ?? "character"}
        </span>
      </div>
      <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:"16px"}}>
        {/* Identity row */}
        <div style={{display:"flex",alignItems:"center",gap:"14px",
          padding:"14px",background:"var(--surface-raised)",borderRadius:"10px",
          border:`1px solid ${isAnt ? "rgba(201,85,85,0.25)" : "rgba(76,170,122,0.25)"}`}}>
          <div style={{width:"48px",height:"48px",borderRadius:"50%",
            background: isAnt ? "var(--red-dim)" : "var(--green-dim)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:"22px",flexShrink:0}}>
            {isAnt ? "💀" : "🧙"}
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:"20px",color:"var(--text)"}}>{npc.name}</div>
            <div style={{fontSize:"13px",color:"var(--text-muted)",marginTop:"2px"}}>
              {npc.age} · {npc.role}
            </div>
          </div>
        </div>

        <table className="result-table" style={{borderRadius:"8px",overflow:"hidden",
          border:"1px solid var(--border)"}}>
          <tbody>
            {([
              ["Appearance", npc.appearance],
              ["Objectives", npc.objectives],
              ["Scene Entrance", npc.entrance],
              ["Hidden Secret", npc.secret],
            ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
              <tr key={label}>
                <td style={{width:"26%",color:"var(--text-muted)",fontWeight:600,
                  fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>
                  {label}
                </td>
                <td style={{color:"var(--text-dim)"}}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
