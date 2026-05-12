"use client";
import { useState } from "react";
import { ApiKeys } from "@/lib/types";

interface Props {
  onSave: (keys: ApiKeys) => void;
}

export default function ApiKeysModal({ onSave }: Props) {
  const [groqKey, setGroqKey] = useState("");
  const [freesoundKey, setFreesoundKey] = useState("");

  const save = () => onSave({ groqKey: groqKey.trim(), freesoundKey: freesoundKey.trim() });

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:100,
      background:"rgba(8,8,16,0.88)",
      display:"flex",alignItems:"center",justifyContent:"center",
      backdropFilter:"blur(4px)",
    }}>
      <div style={{
        background:"var(--surface)",border:"1px solid var(--border)",
        borderRadius:"16px",padding:"32px",width:"420px",maxWidth:"calc(100vw - 32px)",
        display:"flex",flexDirection:"column",gap:"24px",
      }}>
        {/* Logo */}
        <div style={{textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",marginBottom:"8px"}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z"
                fill="var(--accent)" fillOpacity="0.2" stroke="var(--accent)" strokeWidth="1.5"/>
              <path d="M9 12l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{fontWeight:700,fontSize:"22px",letterSpacing:"-0.02em"}}>Rolline</span>
          </div>
          <p style={{color:"var(--text-muted)",fontSize:"14px",margin:0}}>
            AI assistant for game masters. Enter your API keys to begin.
          </p>
        </div>

        {/* Groq key */}
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <label style={{fontSize:"12px",fontWeight:600,color:"var(--text-dim)",
              textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Groq API Key <span style={{color:"var(--red)"}}>*</span>
            </label>
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
              style={{fontSize:"11px",color:"var(--accent)",textDecoration:"none"}}>
              Get free key →
            </a>
          </div>
          <input type="password" placeholder="gsk_…"
            value={groqKey} onChange={e => setGroqKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && groqKey.trim() && save()} />
          <p style={{fontSize:"12px",color:"var(--text-muted)",margin:0}}>
            Used for all AI text generation — plot twists, NPCs, session summaries.
          </p>
        </div>

        {/* Freesound key */}
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <label style={{fontSize:"12px",fontWeight:600,color:"var(--text-dim)",
              textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Freesound API Key
              <span style={{marginLeft:"6px",fontSize:"10px",color:"var(--text-muted)",
                fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span>
            </label>
            <a href="https://freesound.org/apiv2/apply/" target="_blank" rel="noopener noreferrer"
              style={{fontSize:"11px",color:"var(--accent)",textDecoration:"none"}}>
              Apply free →
            </a>
          </div>
          <input type="password" placeholder="Search ambient tracks online…"
            value={freesoundKey} onChange={e => setFreesoundKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && groqKey.trim() && save()} />
          <p style={{fontSize:"12px",color:"var(--text-muted)",margin:0}}>
            Auto-searches ambient tracks matching your scene. You can also upload local audio files.
          </p>
        </div>

        {/* Buttons */}
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:"11px"}}
            onClick={save} disabled={!groqKey.trim()}>
            Start Session
          </button>
          <button className="btn btn-ghost" style={{width:"100%",justifyContent:"center"}}
            onClick={() => onSave({ groqKey: "", freesoundKey: "" })}>
            Continue without keys
          </button>
        </div>
      </div>
    </div>
  );
}
