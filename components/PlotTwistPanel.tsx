"use client";
import { useState } from "react";
import { SessionData, PlotTwist } from "@/lib/types";

interface Props { session: SessionData; }

export default function PlotTwistPanel({ session }: Props) {
  const [twists, setTwists] = useState<PlotTwist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/plot-twists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionContext: session.sessionContext,
          currentAction: session.currentAction,
          themes: session.themes,
          groqKey: session.groqKey,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTwists(data.twists);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const ready = session.themes.length > 0;

  return (
    <div className="panel" style={{height:"100%"}}>
      <div className="panel-header" style={{justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          <h2>Narrative Twists</h2>
        </div>
        <button className="btn btn-ghost" style={{padding:"5px 12px",fontSize:"12px"}}
          onClick={generate} disabled={!ready || loading}>
          {loading ? <><span className="spinner"/>Generating…</> : "Generate 3 Twists"}
        </button>
      </div>

      <div className="panel-body" style={{padding:0,overflowY:"auto"}}>
        {error && (
          <div style={{padding:"12px 18px",color:"var(--red)",fontSize:"13px",
            background:"var(--red-dim)",borderBottom:"1px solid rgba(201,85,85,0.2)"}}>
            {error}
          </div>
        )}

        {twists.length === 0 && !loading && (
          <div className="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.3}}>
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            <div>{ready ? "Click \"Generate 3 Twists\" to create dramatic turns" : "Analyze the scene first to identify themes"}</div>
          </div>
        )}

        {twists.length > 0 && (
          <table className="result-table fade-in">
            <thead>
              <tr>
                <th style={{width:"30%"}}>Plot Twist</th>
                <th style={{width:"18%"}}>Themes</th>
                <th style={{width:"28%"}}>Implications</th>
                <th style={{width:"24%"}}>What Could Happen Next</th>
              </tr>
            </thead>
            <tbody>
              {twists.map((twist, i) => (
                <tr key={i}>
                  <td>
                    <div style={{fontWeight:600,color:"var(--text)",marginBottom:"4px"}}>
                      {twist.twist}
                    </div>
                  </td>
                  <td>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                      {twist.themes.map(t => (
                        <span key={t} className="tag tag-accent" style={{fontSize:"11px"}}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <ul style={{margin:0,paddingLeft:"14px",listStyle:"disc"}}>
                      {twist.implications.map((imp, j) => (
                        <li key={j} style={{color:"var(--text-dim)",marginBottom:"3px",fontSize:"13px"}}>{imp}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <ul style={{margin:0,paddingLeft:"14px",listStyle:"disc"}}>
                      {twist.whatNext.map((w, j) => (
                        <li key={j} style={{color:"var(--text-dim)",marginBottom:"3px",fontSize:"13px"}}>{w}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
