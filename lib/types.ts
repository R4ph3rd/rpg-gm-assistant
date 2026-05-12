export interface SessionData {
  sessionContext: string;
  currentAction: string;
  contextSummary: string;
  actionSummary: string;
  themes: string[];
  groqKey: string;
}

export interface ApiKeys {
  groqKey: string;
  freesoundKey: string;
}

export interface PlotTwist {
  twist: string;
  themes: string[];
  implications: string[];
  whatNext: string[];
}

export interface NPC {
  name: string;
  age: string;
  role: string;
  objectives: string;
  appearance: string;
  entrance?: string;
  secret?: string;
}

export interface FreesoundTrack {
  id: number;
  name: string;
  url: string;
  preview: string;
  duration: number;
  tags: string[];
}

export interface LocalTrack {
  id: string;
  name: string;
  url: string;
}

export type NPCAlignment = "protagonist" | "antagonist";

export type FeedItemType = "plot-twist" | "npc" | "soundtrack" | "summary";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  timestamp: number;
  loading: boolean;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export interface AudioState {
  trackId: string;
  trackName: string;
  url: string;
  playing: boolean;
  volume: number;
  loop: boolean;
}
