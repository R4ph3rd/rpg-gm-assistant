"use client";
import { PlotTwist } from "@/lib/types";

interface Props {
  twists?: PlotTwist[];
  loading: boolean;
  error?: string;
}

export default function PlotTwistCard({ twists, loading, error }: Props) {
  if (loading) return (
    <div style={{padding:"24px",display:"flex",alignItems:"center",gap:"12px",color:"var(--text-muted)"}}>
      <span className="spinner"/>
      <span style={{fontSize:"14px"}}>Generating plot twists…</span>
    </div>
  );

  if (error) return (
    <div style={{padding:"16px 18px",color:"var(--red)",fontSize:"13px",
      background:"var(--red-dim)",border:"1px solid rgba(201,85,85,0.2)",borderRadius:"10px"}}>
      {error}
    </div>
  );

  if (!twists?.length) return null;

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <span style={{fontSize:"16px"}}>⚡</span>
        <h2>Narrative Twists</h2>
      </div>
      <div style={{overflowX:"auto"}}>
        <table className="result-table">
          <thead>
            <tr>
              <th style={{width:"28%"}}>Plot Twist</th>
              <th style={{width:"16%"}}>Themes</th>
              <th style={{width:"28%"}}>Implications</th>
              <th style={{width:"28%"}}>What Could Happen Next</th>
            </tr>
          </thead>
          <tbody>
            {twists.map((t, i) => (
              <tr key={i}>
                <td>
                  <span style={{fontWeight:600,color:"var(--text)",lineHeight:"1.5",display:"block"}}>
                    {t.twist}
                  </span>
                </td>
                <td>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                    {t.themes.map(th => (
                      <span key={th} className="tag tag-accent" style={{fontSize:"11px"}}>{th}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <ul style={{margin:0,paddingLeft:"14px"}}>
                    {t.implications.map((imp, j) => (
                      <li key={j} style={{color:"var(--text-dim)",fontSize:"13px",marginBottom:"3px",lineHeight:"1.5"}}>{imp}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul style={{margin:0,paddingLeft:"14px"}}>
                    {t.whatNext.map((w, j) => (
                      <li key={j} style={{color:"var(--text-dim)",fontSize:"13px",marginBottom:"3px",lineHeight:"1.5"}}>{w}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
