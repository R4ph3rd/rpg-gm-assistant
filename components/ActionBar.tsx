"use client";
import { FeedItemType } from "@/lib/types";

interface Action {
  type: FeedItemType;
  icon: string;
  label: string;
  description: string;
}

const ACTIONS: Action[] = [
  { type: "plot-twist", icon: "⚡", label: "Plot Twists", description: "Generate 3 dramatic turns" },
  { type: "npc",        icon: "🧙", label: "Improvise NPC", description: "Create a relevant character" },
  { type: "soundtrack", icon: "🎵", label: "Soundtrack", description: "Find ambient tracks" },
  { type: "summary",    icon: "📜", label: "Session Log",  description: "Chronicle the session" },
];

interface Props {
  onAction: (type: FeedItemType) => void;
  loadingType: FeedItemType | null;
  analyzed: boolean;
}

export default function ActionBar({ onAction, loadingType, analyzed }: Props) {
  return (
    <div style={{
      background:"var(--bg)",
      borderBottom:"1px solid var(--border)",
      padding:"10px 24px",
      flexShrink:0,
    }}>
      <div style={{maxWidth:"860px",margin:"0 auto",display:"flex",gap:"8px",flexWrap:"wrap"}}>
        {ACTIONS.map(a => {
          const loading = loadingType === a.type;
          return (
            <button key={a.type}
              onClick={() => onAction(a.type)}
              disabled={!!loadingType || !analyzed}
              style={{
                display:"flex",alignItems:"center",gap:"10px",
                padding:"10px 18px",borderRadius:"10px",
                border:"1px solid var(--border)",
                background:"var(--surface)",
                cursor: (!analyzed || !!loadingType) ? "not-allowed" : "pointer",
                opacity: !analyzed ? 0.45 : 1,
                transition:"all 0.15s",
                fontFamily:"inherit",
                flex:"1 1 0",
                minWidth:"160px",
              }}
              onMouseEnter={e => {
                if (analyzed && !loadingType)
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              }}>
              <span style={{fontSize:"20px",flexShrink:0}}>
                {loading ? <span className="spinner" style={{width:"18px",height:"18px"}} /> : a.icon}
              </span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:"13px",fontWeight:600,color:"var(--text)"}}>{a.label}</div>
                <div style={{fontSize:"11px",color:"var(--text-muted)"}}>{a.description}</div>
              </div>
            </button>
          );
        })}
      </div>
      {!analyzed && (
        <p style={{maxWidth:"860px",margin:"6px auto 0",fontSize:"11px",
          color:"var(--text-muted)",textAlign:"center"}}>
          Analyze the scene first to unlock all features
        </p>
      )}
    </div>
  );
}
