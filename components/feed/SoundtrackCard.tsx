"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { FreesoundTrack, AudioState, LocalTrack } from "@/lib/types";
import { searchFreesound } from "@/lib/ai";

interface Props {
  initialQuery: string;
  freesoundKey: string;
  themes: string[];
  audioState: AudioState | null;
  onPlay: (track: { id: string; name: string; url: string }) => void;
  onStop: () => void;
}

function fmtDur(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function highlightMatching(tags: string[], themes: string[]): { tag: string; match: boolean }[] {
  const lc = themes.map(t => t.toLowerCase());
  return tags.map(tag => ({ tag, match: lc.some(t => tag.toLowerCase().includes(t) || t.includes(tag.toLowerCase())) }));
}

export default function SoundtrackCard({ initialQuery, freesoundKey, themes, audioState, onPlay, onStop }: Props) {
  const [results, setResults] = useState<FreesoundTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didAutoSearch = useRef(false);

  const search = useCallback(async (q: string) => {
    if (!freesoundKey || !q.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const tracks = await searchFreesound(freesoundKey, q);
      setResults(tracks);
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [freesoundKey]);

  // Auto-search on mount
  useEffect(() => {
    if (!didAutoSearch.current && freesoundKey && initialQuery) {
      didAutoSearch.current = true;
      search(initialQuery);
    }
  }, [freesoundKey, initialQuery, search]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const tracks: LocalTrack[] = Array.from(files)
      .filter(f => f.type.startsWith("audio/"))
      .map(f => ({
        id: `local-${f.name}-${f.size}`,
        name: f.name.replace(/\.[^.]+$/, ""),
        url: URL.createObjectURL(f),
      }));
    setLocalTracks(prev => [...prev, ...tracks]);
  };

  const handlePlay = (id: string, name: string, url: string) => {
    if (audioState?.trackId === id && audioState.playing) {
      onStop();
    } else {
      onPlay({ id, name, url });
    }
  };

  const allTracks: { id: string; name: string; url: string; duration?: number; tags?: string[]; isLocal?: boolean }[] = [
    ...localTracks.map(t => ({ ...t, isLocal: true })),
    ...results.map(t => ({ id: `fs-${t.id}`, name: t.name, url: t.preview, duration: t.duration, tags: t.tags })),
  ];

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <span style={{fontSize:"16px"}}>🎵</span>
        <h2>Ambient Soundscape</h2>
        <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"center"}}>
          <button className="btn btn-ghost" style={{padding:"4px 10px",fontSize:"12px"}}
            onClick={() => fileInputRef.current?.click()}>
            + Local files
          </button>
          <input ref={fileInputRef} type="file" accept="audio/*" multiple style={{display:"none"}}
            onChange={e => addFiles(e.target.files)} />
        </div>
      </div>

      <div className="panel-body" style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {/* Search bar */}
        <div style={{display:"flex",gap:"8px"}}>
          <input type="text"
            placeholder={freesoundKey ? "Refine search…" : "Add a Freesound API key to search online tracks"}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search(query)}
            style={{flex:1}}
            disabled={!freesoundKey}
          />
          <button className="btn btn-ghost" style={{flexShrink:0,padding:"8px 14px"}}
            onClick={() => search(query)}
            disabled={!freesoundKey || searching || !query.trim()}>
            {searching ? <span className="spinner"/> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            )}
          </button>
        </div>

        {/* Current scene tags as clickable search filters */}
        {themes.length > 0 && (
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:"11px",color:"var(--text-muted)",whiteSpace:"nowrap"}}>Search by theme:</span>
            {themes.map(t => (
              <span key={t}
                className="tag tag-accent tag-tip"
                data-tip="Click to search this theme"
                onClick={() => { setQuery(t); search(t); }}
                style={{cursor:"pointer"}}>
                {t}
              </span>
            ))}
          </div>
        )}

        {searchError && (
          <div style={{color:"var(--red)",fontSize:"13px",background:"var(--red-dim)",
            padding:"10px 14px",borderRadius:"8px"}}>
            {searchError}
          </div>
        )}

        {!freesoundKey && localTracks.length === 0 && (
          <div style={{padding:"14px",background:"var(--surface-raised)",borderRadius:"8px",
            border:"1px solid var(--border)",fontSize:"13px",color:"var(--text-muted)",lineHeight:"1.6"}}>
            <strong style={{color:"var(--text)"}}>No Freesound key set.</strong>{" "}
            Upload local audio files above, or add a Freesound key in the API settings (top-right) to auto-search ambient tracks.
          </div>
        )}

        {/* Track list */}
        {allTracks.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
            {allTracks.map(track => {
              const isPlaying = audioState?.trackId === track.id && audioState.playing;
              const matchedTags = track.tags ? highlightMatching(track.tags, themes) : [];

              return (
                <div key={track.id} className={`track-row ${isPlaying ? "playing" : ""}`}
                  onClick={() => handlePlay(track.id, track.name, track.url)}>

                  {/* Play button */}
                  <button className={`play-btn ${isPlaying ? "active" : ""}`}
                    onClick={e => { e.stopPropagation(); handlePlay(track.id, track.name, track.url); }}>
                    {isPlaying ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    )}
                  </button>

                  {/* Name + tags */}
                  <div style={{flex:1,overflow:"hidden"}}>
                    <div style={{fontSize:"13px",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",
                      whiteSpace:"nowrap",color: isPlaying ? "var(--accent)" : "var(--text)"}}>
                      {track.name}
                      {track.isLocal && (
                        <span style={{marginLeft:"6px",fontSize:"10px",color:"var(--text-muted)"}}>LOCAL</span>
                      )}
                    </div>

                    {matchedTags.length > 0 && (
                      <div style={{display:"flex",flexWrap:"wrap",gap:"3px",marginTop:"4px"}}>
                        {matchedTags.slice(0, 6).map(({ tag, match }) => (
                          <span key={tag}
                            className={match ? "tag tag-accent" : "tag"}
                            style={{fontSize:"10px",padding:"1px 7px"}}
                            title={match ? "Matches your scene theme" : undefined}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  {track.duration && (
                    <span style={{fontSize:"12px",color:"var(--text-muted)",flexShrink:0}}>
                      {fmtDur(track.duration)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {searching && results.length === 0 && (
          <div style={{padding:"20px",textAlign:"center",color:"var(--text-muted)",fontSize:"13px"}}>
            Searching for ambient tracks…
          </div>
        )}
      </div>
    </div>
  );
}
