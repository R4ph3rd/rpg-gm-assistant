"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { SessionData } from "@/lib/types";

const WaveformIcon = ({ active }: { active?: boolean }) => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"
    style={{opacity: active ? 1 : 0.5, flexShrink:0}}>
    <rect x="0" y="3" width="2" height="4" rx="1" fill="var(--accent)"/>
    <rect x="3" y="1" width="2" height="8" rx="1" fill="var(--accent)"/>
    <rect x="6" y="0" width="2" height="10" rx="1" fill="var(--accent)"/>
    <rect x="9" y="2" width="2" height="6" rx="1" fill="var(--accent)"/>
    <rect x="12" y="4" width="2" height="2" rx="1" fill="var(--accent)"/>
  </svg>
);

const MicIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

interface Props {
  session: SessionData;
  onSessionChange: (s: SessionData) => void;
  onAnalyze: () => void;
  onTagClick: (tag: string) => void;
  analyzing: boolean;
}

export default function SessionBar({ session, onSessionChange, onAnalyze, onTagClick, analyzing }: Props) {
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [interimText, setInterimText] = useState("");
  const contextRef = useRef<HTMLTextAreaElement>(null);

  const set = (key: keyof SessionData, value: string) =>
    onSessionChange({ ...session, [key]: value });

  const startMic = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return alert("Speech recognition not supported in this browser.");
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let accumulated = session.sessionContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) accumulated += (accumulated ? " " : "") + t;
        else interim = t;
      }
      setInterimText(interim);
      onSessionChange({ ...session, sessionContext: accumulated });
    };
    rec.onend = () => { setListening(false); setInterimText(""); };
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }, [session, onSessionChange]);

  const stopMic = useCallback(() => {
    recognitionRef.current?.stop();
    setInterimText("");
    setListening(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  // Auto-resize context textarea
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.style.height = "auto";
      contextRef.current.style.height = contextRef.current.scrollHeight + "px";
    }
  }, [session.sessionContext]);

  const hasContent = session.sessionContext.trim() || session.currentAction.trim();
  const analyzed = session.themes.length > 0;

  const displayContext = session.contextSummary || session.sessionContext;
  const displayAction = session.actionSummary || session.currentAction;

  return (
    <div style={{
      background:"var(--surface)",
      borderBottom:"1px solid var(--border)",
      padding:"18px 24px",
      flexShrink:0,
    }}>
      <div style={{maxWidth:"860px",margin:"0 auto",display:"flex",gap:"20px",alignItems:"flex-start"}}>

        {/* Mic button column */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",paddingTop:"4px"}}>
          <button
            className={`mic-btn ${listening ? "on" : "off"}`}
            onClick={listening ? stopMic : startMic}
            title={listening ? "Stop listening" : "Start listening"}>
            <MicIcon />
          </button>
          <span style={{fontSize:"10px",fontWeight:600,textTransform:"uppercase",
            letterSpacing:"0.08em",color: listening ? "var(--red)" : "var(--text-muted)"}}>
            {listening ? "Mic on" : "Mic off"}
          </span>
        </div>

        {/* Content column */}
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:"12px"}}>

          {/* Session context */}
          <div>
            <div className="section-label">
              Session Context <WaveformIcon active={listening} />
            </div>
            {analyzed && session.contextSummary ? (
              <p style={{margin:0,fontSize:"14px",lineHeight:"1.65",color:"var(--text)",
                cursor:"text"}}
                onClick={() => onSessionChange({...session, contextSummary:"", themes:[]})}>
                {displayContext}
              </p>
            ) : (
              <div style={{position:"relative"}}>
                <textarea ref={contextRef}
                  className="session-text"
                  rows={2}
                  placeholder="Describe the scene — setting, mood, who is present, what tension exists…"
                  value={session.sessionContext}
                  onChange={e => set("sessionContext", e.target.value)}
                  style={{minHeight:"44px",overflowY:"hidden"}}
                />
                {interimText && (
                  <span style={{color:"var(--text-muted)",fontSize:"14px",fontStyle:"italic"}}>
                    {interimText}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Current action */}
          <div>
            <div className="section-label">
              Current Action <WaveformIcon active={listening} />
            </div>
            {analyzed && session.actionSummary ? (
              <p style={{margin:0,fontSize:"14px",lineHeight:"1.65",color:"var(--text)",cursor:"text"}}
                onClick={() => onSessionChange({...session, actionSummary:"", themes:[]})}>
                {displayAction}
              </p>
            ) : (
              <input type="text" className="session-text"
                placeholder="What is happening right now in one sentence…"
                value={session.currentAction}
                onChange={e => set("currentAction", e.target.value)}
                onKeyDown={e => e.key === "Enter" && hasContent && !analyzing && onAnalyze()}
                style={{display:"block"}}
              />
            )}
          </div>

          {/* Tags + Analyze row */}
          <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
            {session.themes.map(t => (
              <span key={t}
                className="tag tag-accent tag-tip"
                data-tip="Click to search similar tracks"
                onClick={() => onTagClick(t)}
                style={{cursor:"pointer"}}>
                {t}
              </span>
            ))}

            {hasContent && (
              <button
                className="btn btn-ghost"
                style={{marginLeft:"auto",padding:"4px 14px",fontSize:"12px",flexShrink:0}}
                onClick={onAnalyze}
                disabled={analyzing || !session.sessionContext.trim()}>
                {analyzing
                  ? <><span className="spinner" />Analyzing…</>
                  : analyzed ? "Re-analyze" : "Analyze Scene →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
