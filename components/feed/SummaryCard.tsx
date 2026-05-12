"use client";
import { useState } from "react";
import { SessionData } from "@/lib/types";
import { generateSummary } from "@/lib/ai";

interface Props {
  session: SessionData;
  loading: boolean;
  error?: string;
  summary?: string;
}

export default function SummaryCard({ session, loading, error, summary: initialSummary }: Props) {
  const [events, setEvents] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState("");
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [copied, setCopied] = useState(false);

  const addEvent = () => {
    const e = newEvent.trim();
    if (!e) return;
    setEvents(prev => [...prev, e]);
    setNewEvent("");
  };

  const generate = async () => {
    if (!events.length || !session.groqKey) return;
    setGenerating(true); setGenError("");
    try {
      const text = await generateSummary(
        session.groqKey,
        session.contextSummary || session.sessionContext,
        events,
      );
      setSummary(text);
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdown = (md: string) =>
    md
      .replace(/^# (.+)$/gm, '<h1 style="color:var(--accent);font-size:18px;margin:0 0 12px;font-weight:700">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 style="color:var(--accent);font-size:15px;margin:16px 0 6px;font-weight:600">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 style="color:var(--text-dim);font-size:13px;margin:12px 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li style="margin-bottom:3px;font-size:14px;line-height:1.5">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, s => `<ul style="padding-left:18px;margin:6px 0">${s}</ul>`)
      .replace(/^(?!<[hul]).+$/gm, s => s.trim() ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.6">${s}</p>` : "")
      .replace(/---/g, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0"/>');

  if (loading) return (
    <div style={{padding:"24px",display:"flex",alignItems:"center",gap:"12px",color:"var(--text-muted)"}}>
      <span className="spinner"/>
      <span style={{fontSize:"14px"}}>Preparing session log…</span>
    </div>
  );

  if (error) return (
    <div style={{padding:"16px 18px",color:"var(--red)",fontSize:"13px",
      background:"var(--red-dim)",border:"1px solid rgba(201,85,85,0.2)",borderRadius:"10px"}}>
      {error}
    </div>
  );

  return (
    <div className="panel fade-in">
      <div className="panel-header" style={{justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"16px"}}>📜</span>
          <h2>Session Log</h2>
        </div>
        {summary && (
          <button className="btn btn-ghost" style={{padding:"4px 12px",fontSize:"12px"}}
            onClick={copyMarkdown}>
            {copied ? "✓ Copied!" : "Copy Markdown"}
          </button>
        )}
      </div>

      <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {/* Event log */}
        <div>
          <p style={{fontSize:"12px",color:"var(--text-muted)",margin:"0 0 8px"}}>
            Log events as they happen, then generate a formatted chronicle.
          </p>
          <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
            <input type="text"
              placeholder="Describe an event that happened…"
              value={newEvent}
              onChange={e => setNewEvent(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addEvent()}
              style={{flex:1}}
            />
            <button className="btn btn-ghost" style={{flexShrink:0,padding:"8px 14px"}}
              onClick={addEvent} disabled={!newEvent.trim()}>
              + Add
            </button>
          </div>

          {events.length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:"3px",marginBottom:"10px"}}>
              {events.map((ev, i) => (
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"8px",
                  padding:"7px 10px",background:"var(--surface-raised)",borderRadius:"6px",
                  border:"1px solid var(--border)"}}>
                  <span style={{color:"var(--text-muted)",fontSize:"11px",fontWeight:600,
                    minWidth:"18px",paddingTop:"2px"}}>{i + 1}.</span>
                  <span style={{flex:1,fontSize:"13px",color:"var(--text-dim)",lineHeight:"1.5"}}>{ev}</span>
                  <button onClick={() => setEvents(e => e.filter((_,j) => j !== i))}
                    style={{background:"none",border:"none",cursor:"pointer",
                      color:"var(--text-muted)",padding:0,fontSize:"16px",lineHeight:1,flexShrink:0}}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {genError && (
            <p style={{color:"var(--red)",fontSize:"13px",margin:"0 0 8px"}}>{genError}</p>
          )}

          <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}}
            onClick={generate}
            disabled={!events.length || generating || !session.groqKey}>
            {generating ? <><span className="spinner"/>Writing chronicle…</> : "Generate Session Chronicle"}
          </button>
        </div>

        {/* Generated summary */}
        {summary && (
          <div style={{background:"var(--surface-raised)",borderRadius:"10px",
            border:"1px solid var(--border)",padding:"18px",lineHeight:"1.6"}}>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }} />
          </div>
        )}
      </div>
    </div>
  );
}
