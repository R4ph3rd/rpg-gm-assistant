import Groq from "groq-sdk";
import { PlotTwist, NPC, FreesoundTrack } from "./types";

const MODEL = "llama-3.3-70b-versatile";

function groq(apiKey: string) {
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
}

async function chat(apiKey: string, system: string, user: string): Promise<string> {
  const res = await groq(apiKey).chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.8,
    max_tokens: 2048,
  });
  return res.choices[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string, arrayMode = false): T {
  const pattern = arrayMode ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = raw.match(pattern);
  if (!match) throw new Error("Unexpected AI response format");
  return JSON.parse(match[0]) as T;
}

// ── Scene analysis ──────────────────────────────────────────────────────────

export async function analyzeScene(
  apiKey: string,
  sessionContext: string,
  currentAction: string,
): Promise<{ themes: string[]; contextSummary: string; actionSummary: string }> {
  const system = `You are a game master assistant for tabletop RPGs.
Analyze the session context and current action, then extract exactly 4 short thematic tags (1-3 words each) that capture the subjects, stakeholders, and critical points.
Return ONLY valid JSON in this exact shape:
{"themes":["theme1","theme2","theme3","theme4"],"contextSummary":"4-5 sentence summary of the session context","actionSummary":"one sentence summary of the current action"}`;

  const raw = await chat(apiKey, system, `Session context: ${sessionContext}\nCurrent action: ${currentAction}`);
  return parseJson(raw);
}

// ── Plot twists ─────────────────────────────────────────────────────────────

export async function generatePlotTwists(
  apiKey: string,
  sessionContext: string,
  currentAction: string,
  themes: string[],
): Promise<PlotTwist[]> {
  const system = `You are a creative game master assistant for tabletop RPGs.
Generate exactly 3 dramatic plot twists based on the session context and current action.
Each twist must draw from at least one of the provided themes.
Return ONLY valid JSON as an array of 3 objects:
[{"twist":"one dramatic sentence","themes":["relevant","themes"],"implications":["implication 1","implication 2","implication 3"],"whatNext":["next event 1","next event 2"]}]`;

  const raw = await chat(apiKey, system, `Session context: ${sessionContext}\nCurrent action: ${currentAction}\nAvailable themes: ${themes.join(", ")}`);
  return parseJson<PlotTwist[]>(raw, true);
}

// ── NPC ─────────────────────────────────────────────────────────────────────

export async function generateNPC(
  apiKey: string,
  sessionContext: string,
  currentAction: string,
  themes: string[],
  alignment: "protagonist" | "antagonist",
): Promise<NPC & { entrance: string; secret: string }> {
  const system = `You are a creative game master assistant for tabletop RPGs.
Improvise a compelling NPC that could appear in the current scene.
The character should be ${alignment === "antagonist" ? "an antagonist who opposes the party or complicates their goals" : "a protagonist or ally who can help or add depth to the scene"}.
Return ONLY valid JSON:
{"name":"character name","age":"age or age range","role":"their role or title","objectives":"personal goals in 2 sentences","appearance":"brief physical description","entrance":"how and why they appear in 1-2 sentences","secret":"one hidden detail"}`;

  const raw = await chat(apiKey, system, `Session context: ${sessionContext}\nCurrent action: ${currentAction}\nKey themes: ${themes.join(", ")}\nAlignment: ${alignment}`);
  return parseJson(raw);
}

// ── Session summary ─────────────────────────────────────────────────────────

export async function generateSummary(
  apiKey: string,
  sessionContext: string,
  events: string[],
): Promise<string> {
  const system = `You are a chronicler for a tabletop RPG campaign.
Write a rich, formatted session summary in Markdown suitable for a campaign journal.
Include: a session title, a narrative overview paragraph, key events as sections, notable NPCs encountered, dramatic moments, and a cliffhanger or next session hook.
Use evocative fantasy prose while remaining accurate to the events provided.`;

  return chat(apiKey, system, `Session setting/context: ${sessionContext}\n\nEvents that occurred this session:\n${events.map((e, i) => `${i + 1}. ${e}`).join("\n")}`);
}

// ── Freesound ───────────────────────────────────────────────────────────────

export async function searchFreesound(
  apiKey: string,
  query: string,
): Promise<FreesoundTrack[]> {
  const url = new URL("https://freesound.org/apiv2/search/text/");
  url.searchParams.set("query", query);
  url.searchParams.set("token", apiKey);
  url.searchParams.set("fields", "id,name,url,previews,duration,tags");
  url.searchParams.set("filter", "duration:[30 TO 300]");
  url.searchParams.set("page_size", "8");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Freesound error ${res.status}`);
  const data = await res.json();

  return (data.results ?? []).map((r: {
    id: number; name: string; url: string;
    previews?: { "preview-hq-mp3"?: string };
    duration: number; tags: string[];
  }) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    preview: r.previews?.["preview-hq-mp3"] ?? "",
    duration: Math.round(r.duration),
    tags: (r.tags ?? []).slice(0, 6),
  }));
}
