"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { SessionData, ApiKeys, FeedItem, FeedItemType, AudioState, PlotTwist, NPC } from "@/lib/types";
import { analyzeScene, generatePlotTwists, generateNPC } from "@/lib/ai";
import ApiKeysModal from "@/components/ApiKeysModal";
import SessionBar from "@/components/SessionBar";
import ActionBar from "@/components/ActionBar";
import NowPlayingBar from "@/components/NowPlayingBar";
import PlotTwistCard from "@/components/feed/PlotTwistCard";
import NPCCard from "@/components/feed/NPCCard";
import SoundtrackCard from "@/components/feed/SoundtrackCard";
import SummaryCard from "@/components/feed/SummaryCard";

const KEYS_STORAGE = "rolline-api-keys";
const NPC_ALIGNMENT_STORAGE = "rolline-npc-alignment";

const DEFAULT_SESSION: SessionData = {
  sessionContext: "", currentAction: "",
  contextSummary: "", actionSummary: "",
  themes: [], groqKey: "",
};

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [keys, setKeys] = useState<ApiKeys>({ groqKey: "", freesoundKey: "" });
  const [session, setSession] = useState<SessionData>(DEFAULT_SESSION);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loadingType, setLoadingType] = useState<FeedItemType | null>(null);
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const [npcAlignment, setNpcAlignment] = useState<"protagonist" | "antagonist">("protagonist");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Load saved keys on mount
  useEffect(() => {
    const saved = localStorage.getItem(KEYS_STORAGE);
    if (saved) {
      const k: ApiKeys = JSON.parse(saved);
      setKeys(k);
      setSession(s => ({ ...s, groqKey: k.groqKey }));
    } else {
      setShowModal(true);
    }
    const alignment = localStorage.getItem(NPC_ALIGNMENT_STORAGE);
    if (alignment === "antagonist") setNpcAlignment("antagonist");
  }, []);

  // Scroll feed to bottom when new item added
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feedItems.length]);

  const saveKeys = (k: ApiKeys) => {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(k));
    setKeys(k);
    setSession(s => ({ ...s, groqKey: k.groqKey }));
    setShowModal(false);
  };

  const handleAnalyze = async () => {
    if (!session.sessionContext.trim() || !keys.groqKey) return;
    setAnalyzing(true);
    try {
      const data = await analyzeScene(keys.groqKey, session.sessionContext, session.currentAction);
      setSession(s => ({
        ...s,
        themes: data.themes ?? [],
        contextSummary: data.contextSummary ?? "",
        actionSummary: data.actionSummary ?? "",
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const addFeedItem = (type: FeedItemType, data?: FeedItem["data"]) => {
    const id = `${type}-${Date.now()}`;
    setFeedItems(prev => [...prev, { id, type, timestamp: Date.now(), loading: !data, data }]);
    return id;
  };

  const updateFeedItem = (id: string, patch: Partial<FeedItem>) => {
    setFeedItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const handleAction = useCallback(async (type: FeedItemType) => {
    if (type === "summary") {
      addFeedItem("summary", {});
      return;
    }

    setLoadingType(type);
    const id = addFeedItem(type);

    try {
      if (type === "plot-twist") {
        const twists = await generatePlotTwists(
          keys.groqKey,
          session.contextSummary || session.sessionContext,
          session.actionSummary || session.currentAction,
          session.themes,
        );
        updateFeedItem(id, { loading: false, data: twists as PlotTwist[] });
      }

      if (type === "npc") {
        const alignment = npcAlignment;
        const npc = await generateNPC(
          keys.groqKey,
          session.contextSummary || session.sessionContext,
          session.actionSummary || session.currentAction,
          session.themes,
          alignment,
        );
        const npcData: NPC & { alignment: string } = { ...npc, alignment };
        updateFeedItem(id, { loading: false, data: npcData });
        // Toggle alignment for next NPC
        const next = alignment === "protagonist" ? "antagonist" : "protagonist";
        setNpcAlignment(next);
        localStorage.setItem(NPC_ALIGNMENT_STORAGE, next);
      }

      if (type === "soundtrack") {
        const queryParts = [...session.themes];
        if (session.currentAction) queryParts.push(session.currentAction.split(" ").slice(0, 3).join(" "));
        const query = queryParts.join(" ").trim() || "ambient";
        updateFeedItem(id, { loading: false, data: { query } });
      }
    } catch (e: unknown) {
      updateFeedItem(id, { loading: false, error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setLoadingType(null);
    }
  }, [session, keys, npcAlignment]);

  // Tag click: trigger soundtrack search with that theme
  const handleTagClick = useCallback((tag: string) => {
    const existingSound = feedItems.findLast(i => i.type === "soundtrack" && !i.loading);
    if (existingSound) {
      // Update the last soundtrack item's query by adding a new one
      addFeedItem("soundtrack", { query: tag });
    } else {
      addFeedItem("soundtrack", { query: tag });
    }
  }, [feedItems]);

  // Audio controls
  const playTrack = useCallback((track: { id: string; name: string; url: string }) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const audio = new Audio(track.url);
    const vol = audioState?.volume ?? 0.7;
    const loop = audioState?.loop ?? true;
    audio.volume = vol;
    audio.loop = loop;
    audio.play().catch(() => {});
    audio.onended = () => setAudioState(s => s ? { ...s, playing: false } : null);
    audioRef.current = audio;
    setAudioState({ trackId: track.id, trackName: track.name, url: track.url, playing: true, volume: vol, loop });
  }, [audioState]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      if (audioState?.playing) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
    }
    setAudioState(s => s ? { ...s, playing: !s.playing } : null);
  }, [audioState]);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setAudioState(null);
  }, []);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setAudioState(s => s ? { ...s, volume: v } : null);
  }, []);

  const toggleLoop = useCallback(() => {
    if (audioRef.current) audioRef.current.loop = !audioState?.loop;
    setAudioState(s => s ? { ...s, loop: !s.loop } : null);
  }, [audioState]);

  const analyzed = session.themes.length > 0;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:"var(--bg)"}}>
      {showModal && <ApiKeysModal onSave={saveKeys} />}

      {/* App header */}
      <header style={{
        background:"var(--surface)",borderBottom:"1px solid var(--border)",
        padding:"0 24px",height:"48px",display:"flex",alignItems:"center",
        gap:"12px",flexShrink:0,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z"
              fill="var(--accent)" fillOpacity="0.2" stroke="var(--accent)" strokeWidth="1.5"/>
            <path d="M9 12l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{fontWeight:700,fontSize:"15px",letterSpacing:"-0.01em"}}>Rolline</span>
        </div>

        {/* NPC alignment toggle (small, in header) */}
        <div style={{display:"flex",alignItems:"center",gap:"6px",marginLeft:"16px"}}>
          <span style={{fontSize:"11px",color:"var(--text-muted)"}}>Next NPC:</span>
          <button onClick={() => {
            const next = npcAlignment === "protagonist" ? "antagonist" : "protagonist";
            setNpcAlignment(next);
            localStorage.setItem(NPC_ALIGNMENT_STORAGE, next);
          }}
            style={{padding:"2px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:600,
              cursor:"pointer",border:"1px solid",fontFamily:"inherit",
              borderColor: npcAlignment === "antagonist" ? "rgba(201,85,85,0.4)" : "rgba(76,170,122,0.4)",
              background: npcAlignment === "antagonist" ? "var(--red-dim)" : "var(--green-dim)",
              color: npcAlignment === "antagonist" ? "var(--red)" : "var(--green)"}}>
            {npcAlignment}
          </button>
        </div>

        <button className="btn btn-ghost" style={{marginLeft:"auto",padding:"4px 12px",fontSize:"12px"}}
          onClick={() => setShowModal(true)}>
          API Keys
        </button>
      </header>

      {/* Session bar — always visible */}
      <SessionBar
        session={session}
        onSessionChange={setSession}
        onAnalyze={handleAnalyze}
        onTagClick={handleTagClick}
        analyzing={analyzing}
      />

      {/* Now playing bar — only when audio active */}
      {audioState && (
        <NowPlayingBar
          audio={audioState}
          onPlayPause={pauseAudio}
          onStop={stopAudio}
          onVolumeChange={setVolume}
          onLoopToggle={toggleLoop}
        />
      )}

      {/* Action bar — always visible */}
      <ActionBar
        onAction={handleAction}
        loadingType={loadingType}
        analyzed={analyzed}
      />

      {/* Scrollable feed */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:"14px"}}>
        <div style={{maxWidth:"860px",margin:"0 auto",width:"100%",display:"flex",flexDirection:"column",gap:"14px"}}>

          {feedItems.length === 0 && (
            <div style={{
              textAlign:"center",padding:"60px 24px",
              color:"var(--text-muted)",fontSize:"14px",lineHeight:"1.7",
            }}>
              <div style={{fontSize:"32px",marginBottom:"12px",opacity:0.4}}>🎲</div>
              <div style={{fontWeight:600,color:"var(--text-dim)",marginBottom:"6px"}}>
                {analyzed ? "Use the action buttons above to generate content" : "Start by describing your scene above"}
              </div>
              {!analyzed && (
                <div style={{fontSize:"13px"}}>
                  Fill in the session context, current action, then click <strong style={{color:"var(--accent)"}}>Analyze Scene →</strong>
                </div>
              )}
            </div>
          )}

          {feedItems.map(item => (
            <div key={item.id} className="feed-item">
              {item.type === "plot-twist" && (
                <PlotTwistCard
                  twists={item.data as PlotTwist[]}
                  loading={item.loading}
                  error={item.error}
                />
              )}
              {item.type === "npc" && (
                <NPCCard
                  npc={item.data}
                  loading={item.loading}
                  error={item.error}
                />
              )}
              {item.type === "soundtrack" && (
                <SoundtrackCard
                  initialQuery={item.data?.query ?? session.themes.join(" ")}
                  freesoundKey={keys.freesoundKey}
                  themes={session.themes}
                  audioState={audioState}
                  onPlay={playTrack}
                  onStop={stopAudio}
                />
              )}
              {item.type === "summary" && (
                <SummaryCard
                  session={session}
                  loading={item.loading}
                  error={item.error}
                  summary={item.data?.summary}
                />
              )}
            </div>
          ))}

          <div ref={feedEndRef} />
        </div>
      </div>
    </div>
  );
}
