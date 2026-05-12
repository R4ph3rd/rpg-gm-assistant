"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { SessionData } from "@/lib/types";

interface Props {
  session: SessionData;
  onSessionChange: (s: SessionData) => void;
  onAnalyze: () => void;
  analyzing: boolean;
}

export default function ContextPanel({ session, onSessionChange, onAnalyze, analyzing }: Props) {
  const [micMode, setMicMode] = useState(false);
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [transcript, setTranscript] = useState("");

  const startMic = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return alert("Speech recognition not supported in this browser.");
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalText = session.sessionContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim = t;
      }
      setTranscript(interim);
      onSessionChange({ ...session, sessionContext: finalText });
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }, [session, onSessionChange]);

  const stopMic = useCallback(() => {
    recognitionRef.current?.stop();
    setTranscript("");
    setListening(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const set = (key: keyof SessionData, value: string) =>
    onSessionChange({ ...session, [key]: value });

  const canAnalyze =
    session.groqKey.trim() &&
    session.sessionContext.trim() &&
    session.currentAction.trim();

  return (
    <div className="panel flex flex-col gap-0 h-full">
      <div className="panel-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{color:"var(--accent)"}} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <h2>Session Context</h2>
        <div style={{marginLeft:"auto",display:"flex",gap:"6px"}}>
          <button className={`btn btn-ghost ${!micMode ? "active" : ""}`} style={{padding:"5px 12px",fontSize:"12px"}}
            onClick={() => { stopMic(); setMicMode(false); }}>Text</button>
          <button className={`btn btn-ghost ${micMode ? "active" : ""}`} style={{padding:"5px 12px",fontSize:"12px"}}
            onClick={() => setMicMode(true)}>Mic</button>
        </div>
      </div>

      <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {/* API Key */}
        <div>
          <label style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:600,
            textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:"6px"}}>
            Groq API Key *
          </label>
          <input type="password" placeholder="gsk_..." value={session.groqKey}
            onChange={e => set("groqKey", e.target.value)} />
        </div>

        {/* Session context */}
        <div>
          <label style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:600,
            textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:"6px"}}>
            Session Context
          </label>
          {micMode ? (
            <div style={{position:"relative"}}>
              <div style={{
                background:"var(--surface-raised)",border:"1px solid",
                borderColor: listening ? "var(--accent)" : "var(--border)",
                borderRadius:"8px",padding:"12px 14px",minHeight:"100px",
                fontSize:"14px",lineHeight:"1.6",color: session.sessionContext ? "var(--text)" : "var(--text-muted)"
              }}>
                {session.sessionContext || "Listening…"}
                {transcript && <span style={{color:"var(--text-muted)"}}> {transcript}</span>}
              </div>
              <div style={{marginTop:"8px",display:"flex",gap:"8px"}}>
                {!listening ? (
                  <button className={`btn btn-primary ${listening ? "mic-active" : ""}`}
                    onClick={startMic} style={{gap:"8px"}}>
                    <span style={{fontSize:"16px"}}>🎙</span> Start Listening
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={stopMic}>
                    <span style={{fontSize:"16px"}}>⏹</span> Stop
                  </button>
                )}
                {session.sessionContext && (
                  <button className="btn btn-ghost" onClick={() => onSessionChange({ ...session, sessionContext: "" })}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          ) : (
            <textarea rows={5}
              placeholder="Describe the scene: where are the players, what's the mood, who is present, what tension exists in the world right now…"
              value={session.sessionContext}
              onChange={e => set("sessionContext", e.target.value)} />
          )}
        </div>

        {/* Current action */}
        <div>
          <label style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:600,
            textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:"6px"}}>
            Current Action
          </label>
          <input type="text"
            placeholder="The party attempts to negotiate with the thieves guild leader…"
            value={session.currentAction}
            onChange={e => set("currentAction", e.target.value)} />
        </div>

        {/* Themes */}
        {session.themes.length > 0 && (
          <div>
            <label style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:600,
              textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:"8px"}}>
              Identified Themes
            </label>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {session.themes.map(t => (
                <span key={t} className="tag tag-accent">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Analyze button */}
        <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",marginTop:"auto"}}
          onClick={onAnalyze} disabled={!canAnalyze || analyzing}>
          {analyzing ? <><span className="spinner" />Analyzing…</> : (
            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg> Analyze Scene</>
          )}
        </button>

        {!session.groqKey && (
          <p style={{fontSize:"12px",color:"var(--text-muted)",textAlign:"center",margin:0}}>
            Get a free Groq API key at{" "}
            <span style={{color:"var(--accent)"}}>console.groq.com</span>
          </p>
        )}
      </div>
    </div>
  );
}
