"use client";
import { useState, useRef } from "react";
import { SessionData } from "@/lib/types";

interface Props { session: SessionData; }

export default function SessionSummaryPanel({ session }: Props) {
  const [events, setEvents] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEvent = () => {
    const e = newEvent.trim();
    if (!e) return;
    setEvents(prev => [...prev, e]);
    setNewEvent("");
    inputRef.current?.focus();
  };

  const removeEvent = (i: number) =>
    setEvents(prev => prev.filter((_, idx) => idx !== i));

  const generate = async () => {
    if (!events.length) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionContext: session.sessionContext,
          events,
          groqKey: session.groqKey,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
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
      .replace(/^## (.+)$/gm, '<h2 style="color:var(--accent);font-size:15px;margin:16px 0 6px;font-weight:600">$2</h2>')
      .replace(/^### (.+)$/gm, '<h3 style="color:var(--text-dim);font-size:13px;margin:12px 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li style="margin-bottom:3px;font-size:14px;line-height:1.5">$1</li>')
      .replace(/(<li.*<\/li>\n?)+/g, s => `<ul style="padding-left:18px;margin:6px 0">${s}</ul>`)
      .replace(/^(?!<[h|u|l]).+$/gm, s => s.trim() ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.6">${s}</p>` : "")
      .replace(/---/g, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0"/>');

  return (
    <div className="panel" style={{height:"100%"}}>
      <div className="panel-header" style={{justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <h2>Session Summary</h2>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          {summary && (
            <button className="btn btn-ghost" style={{padding:"5px 12px",fontSize:"12px"}}
              onClick={copyMarkdown}>
              {copied ? "✓ Copied!" : "Copy Markdown"}
            </button>
          )}
          <button className="btn btn-ghost" style={{padding:"5px 12px",fontSize:"12px"}}
            onClick={generate} disabled={!events.length || loading || !session.groqKey}>
            {loading ? <><span className="spinner"/>Writing…</> : "Generate Summary"}
          </button>
        </div>
      </div>

      <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:"14px",overflowY:"auto"}}>
        {error && (
          <div style={{color:"var(--red)",fontSize:"13px",background:"var(--red-dim)",
            padding:"10px 14px",borderRadius:"8px"}}>
            {error}
          </div>
        )}

        {/* Event log */}
        <div>
          <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
            <input ref={inputRef} type="text"
              placeholder="Log a session event (e.g. Party defeated the bandit camp…)"
              value={newEvent}
              onChange={e => setNewEvent(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addEvent()} />
            <button className="btn btn-ghost" style={{flexShrink:0,padding:"8px 14px"}}
              onClick={addEvent} disabled={!newEvent.trim()}>+ Add</button>
          </div>

          {events.length === 0 ? (
            <div style={{padding:"12px",textAlign:"center",fontSize:"13px",color:"var(--text-muted)",
              background:"var(--surface-raised)",borderRadius:"8px",border:"1px dashed var(--border)"}}>
              Add events as they happen during the session
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"160px",overflowY:"auto"}}>
              {events.map((ev, i) => (
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"8px",
                  padding:"8px 10px",background:"var(--surface-raised)",borderRadius:"6px",
                  border:"1px solid var(--border)"}}>
                  <span style={{color:"var(--text-muted)",fontSize:"12px",fontWeight:600,
                    minWidth:"20px",paddingTop:"1px"}}>{i + 1}.</span>
                  <span style={{flex:1,fontSize:"13px",color:"var(--text-dim)",lineHeight:"1.5"}}>{ev}</span>
                  <button onClick={() => removeEvent(i)}
                    style={{background:"none",border:"none",cursor:"pointer",
                      color:"var(--text-muted)",padding:"0",fontSize:"16px",lineHeight:1}}
                    title="Remove">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated summary */}
        {summary ? (
          <div className="fade-in" style={{flex:1,overflowY:"auto",
            background:"var(--surface-raised)",borderRadius:"8px",
            border:"1px solid var(--border)",padding:"16px"}}>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }} />
          </div>
        ) : !loading && events.length > 0 && (
          <div className="empty-state">
            <div>Click "Generate Summary" to chronicle your session</div>
          </div>
        )}
      </div>
    </div>
  );
}
