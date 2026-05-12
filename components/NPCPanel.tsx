"use client";
import { useState } from "react";
import { SessionData, NPC, NPCAlignment } from "@/lib/types";

interface Props { session: SessionData; }

export default function NPCPanel({ session }: Props) {
  const [npc, setNpc] = useState<NPC & { entrance?: string; secret?: string } | null>(null);
  const [alignment, setAlignment] = useState<NPCAlignment>("protagonist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionContext: session.sessionContext,
          currentAction: session.currentAction,
          themes: session.themes,
          alignment,
          groqKey: session.groqKey,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNpc(data.npc);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const ready = session.themes.length > 0;
  const isAnt = alignment === "antagonist";

  return (
    <div className="panel" style={{height:"100%"}}>
      <div className="panel-header" style={{justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <h2>NPC Generator</h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{display:"flex",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--border)"}}>
            <button onClick={() => setAlignment("protagonist")}
              style={{padding:"5px 12px",fontSize:"12px",fontWeight:500,cursor:"pointer",border:"none",
                fontFamily:"inherit",transition:"all 0.15s",
                background: !isAnt ? "var(--green-dim)" : "var(--surface-raised)",
                color: !isAnt ? "var(--green)" : "var(--text-muted)"}}>
              Protagonist
            </button>
            <button onClick={() => setAlignment("antagonist")}
              style={{padding:"5px 12px",fontSize:"12px",fontWeight:500,cursor:"pointer",border:"none",
                borderLeft:"1px solid var(--border)",fontFamily:"inherit",transition:"all 0.15s",
                background: isAnt ? "var(--red-dim)" : "var(--surface-raised)",
                color: isAnt ? "var(--red)" : "var(--text-muted)"}}>
              Antagonist
            </button>
          </div>
          <button className="btn btn-ghost" style={{padding:"5px 12px",fontSize:"12px"}}
            onClick={generate} disabled={!ready || loading}>
            {loading ? <><span className="spinner"/>Creating…</> : "Improvise NPC"}
          </button>
        </div>
      </div>

      <div className="panel-body" style={{overflowY:"auto"}}>
        {error && (
          <div style={{color:"var(--red)",fontSize:"13px",background:"var(--red-dim)",
            padding:"10px 14px",borderRadius:"8px",marginBottom:"14px"}}>
            {error}
          </div>
        )}

        {!npc && !loading && (
          <div className="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.3}}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <div>{ready ? "Generate an NPC relevant to the current scene" : "Analyze the scene first"}</div>
          </div>
        )}

        {npc && (
          <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {/* Name header */}
            <div style={{display:"flex",alignItems:"center",gap:"12px",
              padding:"14px",background:"var(--surface-raised)",borderRadius:"10px",
              border:`1px solid ${isAnt ? "rgba(201,85,85,0.3)" : "rgba(76,170,122,0.3)"}`}}>
              <div style={{width:"44px",height:"44px",borderRadius:"50%",
                background: isAnt ? "var(--red-dim)" : "var(--green-dim)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>
                {isAnt ? "💀" : "🧙"}
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:"18px",color:"var(--text)"}}>{npc.name}</div>
                <div style={{fontSize:"13px",color:"var(--text-muted)"}}>
                  {npc.age} · {npc.role}
                  <span style={{marginLeft:"8px",padding:"2px 8px",borderRadius:"999px",fontSize:"11px",
                    background: isAnt ? "var(--red-dim)" : "var(--green-dim)",
                    color: isAnt ? "var(--red)" : "var(--green)",
                    border:`1px solid ${isAnt ? "rgba(201,85,85,0.3)" : "rgba(76,170,122,0.3)"}`}}>
                    {alignment}
                  </span>
                </div>
              </div>
            </div>

            <table className="result-table" style={{borderRadius:"8px",overflow:"hidden",
              border:"1px solid var(--border)"}}>
              <tbody>
                {[
                  ["Appearance", npc.appearance],
                  ["Objectives", npc.objectives],
                  ["Scene Entrance", (npc as {entrance?: string}).entrance],
                  ["Hidden Secret", (npc as {secret?: string}).secret],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <tr key={label as string}>
                    <td style={{width:"30%",color:"var(--text-muted)",fontWeight:600,
                      fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em"}}>
                      {label}
                    </td>
                    <td style={{color:"var(--text-dim)"}}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
