"use client";
import { AudioState } from "@/lib/types";

interface Props {
  audio: AudioState;
  onPlayPause: () => void;
  onStop: () => void;
  onVolumeChange: (v: number) => void;
  onLoopToggle: () => void;
}

export default function NowPlayingBar({ audio, onPlayPause, onStop, onVolumeChange, onLoopToggle }: Props) {
  return (
    <div style={{
      background:"var(--surface-raised)",
      borderBottom:"1px solid var(--border-accent)",
      padding:"10px 24px",
      flexShrink:0,
    }}>
      <div style={{maxWidth:"860px",margin:"0 auto",display:"flex",alignItems:"center",gap:"12px"}}>

        {/* Animated icon */}
        <div style={{display:"flex",gap:"2px",alignItems:"flex-end",height:"16px",flexShrink:0}}>
          {[3,5,4,6,3].map((h,i) => (
            <div key={i} style={{
              width:"3px",borderRadius:"2px",background:"var(--accent)",
              height: audio.playing ? `${h * 2}px` : "4px",
              animation: audio.playing ? `sound-bar-${i} 0.8s ease-in-out infinite alternate` : "none",
              animationDelay:`${i * 0.1}s`,
              transition:"height 0.3s",
            }}/>
          ))}
        </div>

        {/* Track name */}
        <span style={{fontSize:"13px",fontWeight:500,color:"var(--accent)",
          flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {audio.trackName}
        </span>

        {/* Controls */}
        <div style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
          {/* Loop */}
          <button onClick={onLoopToggle} title={audio.loop ? "Loop on" : "Loop off"}
            style={{background:"none",border:"none",cursor:"pointer",padding:"4px",
              color: audio.loop ? "var(--accent)" : "var(--text-muted)",transition:"color 0.15s"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </button>

          {/* Volume */}
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <input type="range" min={0} max={1} step={0.01} value={audio.volume}
              onChange={e => onVolumeChange(parseFloat(e.target.value))}
              style={{width:"70px"}} />
          </div>

          {/* Play/Pause */}
          <button onClick={onPlayPause}
            style={{width:"32px",height:"32px",borderRadius:"50%",border:"none",
              background:"var(--accent)",color:"#08080f",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {audio.playing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>

          {/* Stop */}
          <button onClick={onStop} title="Stop"
            style={{background:"none",border:"none",cursor:"pointer",padding:"4px",
              color:"var(--text-muted)",transition:"color 0.15s"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes sound-bar-0{from{height:6px}to{height:12px}}
        @keyframes sound-bar-1{from{height:10px}to{height:4px}}
        @keyframes sound-bar-2{from{height:4px}to{height:14px}}
        @keyframes sound-bar-3{from{height:12px}to{height:6px}}
        @keyframes sound-bar-4{from{height:6px}to{height:10px}}
      `}</style>
    </div>
  );
}
