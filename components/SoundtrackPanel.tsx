"use client";
import { useState, useRef, useCallback } from "react";
import { SessionData, LocalTrack, FreesoundTrack } from "@/lib/types";

interface Props { session: SessionData; }

export default function SoundtrackPanel({ session }: Props) {
  const [library, setLibrary] = useState<LocalTrack[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [freesoundKey, setFreesoundKey] = useState("");
  const [results, setResults] = useState<FreesoundTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const play = useCallback((url: string, id: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (playing === id) { setPlaying(null); return; }
    const audio = new Audio(url);
    audio.volume = volume;
    audio.loop = true;
    audio.play().catch(() => {});
    audio.onended = () => setPlaying(null);
    audioRef.current = audio;
    setPlaying(id);
  }, [playing, volume]);

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const tracks: LocalTrack[] = Array.from(files)
      .filter(f => f.type.startsWith("audio/"))
      .map(f => ({
        id: `local-${f.name}-${f.size}`,
        name: f.name.replace(/\.[^.]+$/, ""),
        url: URL.createObjectURL(f),
        file: f,
      }));
    setLibrary(prev => [...prev, ...tracks]);
  };

  const searchFreesound = async () => {
    if (!session.themes.length && !session.currentAction) return;
    setSearching(true); setSearchError("");
    const query = [...session.themes, session.currentAction.split(" ").slice(0, 3).join(" ")].join(" ");
    try {
      const res = await fetch(`/api/freesound?query=${encodeURIComponent(query)}&apiKey=${encodeURIComponent(freesoundKey)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.tracks);
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const stopAll = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  };

  const fmtDur = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="panel" style={{height:"100%"}}>
      <div className="panel-header" style={{justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <h2>Ambient Soundscape</h2>
        </div>
        {playing && (
          <button className="btn btn-danger" style={{padding:"5px 12px",fontSize:"12px"}} onClick={stopAll}>
            ⏹ Stop
          </button>
        )}
      </div>

      <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:"16px"}}>
        {/* Volume */}
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          <input type="range" min={0} max={1} step={0.01} value={volume}
            onChange={e => handleVolumeChange(parseFloat(e.target.value))}
            style={{flex:1}} />
          <span style={{fontSize:"12px",color:"var(--text-muted)",width:"32px",textAlign:"right"}}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Local library */}
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
            <span style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:600,
              textTransform:"uppercase",letterSpacing:"0.06em"}}>Local Library</span>
            <button className="btn btn-ghost" style={{padding:"4px 10px",fontSize:"12px"}}
              onClick={() => fileInputRef.current?.click()}>+ Add Files</button>
          </div>
          <input ref={fileInputRef} type="file" accept="audio/*" multiple style={{display:"none"}}
            onChange={e => addFiles(e.target.files)} />

          {library.length === 0 ? (
            <div style={{padding:"12px",textAlign:"center",fontSize:"13px",color:"var(--text-muted)",
              background:"var(--surface-raised)",borderRadius:"8px",border:"1px dashed var(--border)"}}>
              Drop audio files here or click + Add Files
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"160px",overflowY:"auto"}}>
              {library.map(track => (
                <div key={track.id} onClick={() => play(track.url, track.id)}
                  style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 10px",
                    borderRadius:"6px",cursor:"pointer",
                    background: playing === track.id ? "var(--accent-dim)" : "var(--surface-raised)",
                    border: `1px solid ${playing === track.id ? "var(--border-accent)" : "var(--border)"}`,
                    transition:"all 0.15s"}}>
                  <span style={{fontSize:"16px"}}>{playing === track.id ? "⏸" : "▶"}</span>
                  <span style={{flex:1,fontSize:"13px",overflow:"hidden",textOverflow:"ellipsis",
                    whiteSpace:"nowrap",color: playing === track.id ? "var(--accent)" : "var(--text)"}}>
                    {track.name}
                  </span>
                  {playing === track.id && (
                    <span style={{fontSize:"11px",color:"var(--accent)"}}>Playing</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Freesound search */}
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
            <span style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:600,
              textTransform:"uppercase",letterSpacing:"0.06em"}}>Freesound Search</span>
            <a href="https://freesound.org/apiv2/apply/" target="_blank" rel="noopener noreferrer"
              style={{fontSize:"11px",color:"var(--accent)",textDecoration:"none"}}>Get free key →</a>
          </div>
          <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
            <input type="password" placeholder="Freesound API key (optional)"
              value={freesoundKey} onChange={e => setFreesoundKey(e.target.value)}
              style={{flex:1}} />
            <button className="btn btn-ghost" style={{flexShrink:0,padding:"8px 12px"}}
              onClick={searchFreesound}
              disabled={!freesoundKey || searching || !session.themes.length}>
              {searching ? <span className="spinner"/> : "Search"}
            </button>
          </div>

          {searchError && (
            <p style={{color:"var(--red)",fontSize:"13px",margin:"0 0 8px"}}>{searchError}</p>
          )}

          {results.length > 0 && (
            <div style={{display:"flex",flexDirection:"column",gap:"4px",maxHeight:"180px",overflowY:"auto"}}>
              {results.map(track => (
                <div key={track.id} onClick={() => play(track.preview, `fs-${track.id}`)}
                  style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 10px",
                    borderRadius:"6px",cursor:"pointer",
                    background: playing === `fs-${track.id}` ? "var(--accent-dim)" : "var(--surface-raised)",
                    border: `1px solid ${playing === `fs-${track.id}` ? "var(--border-accent)" : "var(--border)"}`,
                    transition:"all 0.15s"}}>
                  <span style={{fontSize:"16px"}}>{playing === `fs-${track.id}` ? "⏸" : "▶"}</span>
                  <div style={{flex:1,overflow:"hidden"}}>
                    <div style={{fontSize:"13px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                      color: playing === `fs-${track.id}` ? "var(--accent)" : "var(--text)"}}>
                      {track.name}
                    </div>
                    <div style={{fontSize:"11px",color:"var(--text-muted)"}}>
                      {fmtDur(track.duration)} · {track.tags.slice(0,3).join(", ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!freesoundKey && (
            <p style={{fontSize:"12px",color:"var(--text-muted)",margin:"8px 0 0",lineHeight:"1.5"}}>
              Note: AI audio generation (Suno, Udio) requires paid APIs. Freesound offers thousands of free ambient tracks.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
