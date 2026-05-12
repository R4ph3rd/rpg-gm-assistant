# Role Play GM Assistant

An AI-powered assistant for tabletop RPG game masters. Capture your session in text or via audio context, and it generates plot twists, improvised NPCs, ambient soundscapes, and session chronicles.

---

## Features

### Session Context 
- **Text or mic input** : type your session context and current action, or click the mic button to speak. Web Speech API transcribes live.
- **Scene analysis** : one click extracts up to 4 thematic tags (e.g. *Hidden identity*, *Time pressure*, *Betrayal*) from your context using Groq AI.
- **Theme tags** : clicking a tag triggers a Freesound search for matching ambient tracks.

### Narrative Twists
Generates 3 dramatic plot twists, each tied to at least one scene theme. Returns a formatted table with:
- The twist (one sentence)
- Relevant themes from the identified list
- 3-5 potential implications
- 2-3 "what could happen next" bullet points

### Improvise NPC
Creates a contextually relevant character on the fly. Toggle between **protagonist** and **antagonist** (auto-alternates each generation). Outputs a structured card with:
- Name, age, role
- Appearance
- Personal objectives
- Scene entrance
- A hidden secret

### Ambient Soundscape
- **Auto-search** : triggers a Freesound search immediately using scene themes and current action when opened.
- **Local library** : upload any audio files; they appear alongside online results.
- **Matching keywords** : tags on each track are highlighted gold when they match your scene themes.
- **Now Playing bar** : sticky bar with animated equalizer, play/pause, stop, volume, and loop controls appears above the action buttons while audio is playing.
- **Clickable theme search** : click any theme tag in the search bar or session bar to re-search with that keyword.

### Session Log (Chronicle)
- Running event log : add events as they happen during play.
- **Generate chronicle** : sends the event list to Groq and returns a formatted Markdown session summary with title, narrative overview, key events, notable NPCs, dramatic moments, and a next-session hook.
- Copy-to-clipboard for pasting into campaign notes.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| AI text | [Groq API](https://console.groq.com) : `llama-3.3-70b-versatile` |
| Voice input | Web Speech API (browser-native, no key needed) |
| Audio search | [Freesound.org API v2](https://freesound.org/apiv2/apply/) |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Enter API keys

On first launch a modal asks for:

| Key | Required | Where to get |
|---|---|---|
| **Groq API key** | Yes | [console.groq.com](https://console.groq.com) : free tier |
| **Freesound API key** | No | [freesound.org/apiv2/apply](https://freesound.org/apiv2/apply/) : free |

Keys are saved in `localStorage` and never sent anywhere except the respective APIs. You can update them anytime via the **API Keys** button in the top-right.

---

## Usage Flow

1. **Describe the scene** : fill Session Context (4-5 sentences) and Current Action (1 sentence) by typing or using the mic.
2. **Analyze** : click *Analyze Scene →* to extract themes. Action buttons unlock.
3. **Generate content** : click any action button. Results appear as cards in the scrollable feed below.
4. **Play audio** : click any track in a Soundscape card. The Now Playing bar appears and stays visible while you work.
5. **Log events** : open the Session Log card and add events as play progresses. Generate the chronicle at the end.

---

## Deploy to GitHub Pages

All AI calls run directly in the browser (no server needed), so the app exports as a fully static site.

### 1. Set your repo name in `package.json`

The `predeploy` script sets the base path to match your GitHub repo name. Open `package.json` and change `/rpg-ai` if your repo has a different name:

```json
"predeploy": "cross-env NEXT_PUBLIC_BASE_PATH=/your-repo-name next build"
```

### 2. Enable GitHub Pages in your repo settings

Go to **Settings → Pages → Source** and select **Deploy from a branch**, then choose the `gh-pages` branch, `/ (root)`.

### 3. Run the deploy command

```bash
npm run deploy
```

This runs the static build, then pushes the `./out` folder to the `gh-pages` branch automatically. Your app will be live at `https://your-username.github.io/your-repo-name`.

> **Note:** After the first deploy you may need to wait ~1 minute and hard-refresh the browser.

---

## Development

```bash
npm run dev      # local dev server (Turbopack, port 3000)
npm run build    # static export to ./out (no base path)
npm run deploy   # build with base path + push to gh-pages branch
```

---

## Notes on Audio Generation

True AI music generation (Suno, Udio, Mubert) has no publicly available free API. This project uses **Freesound.org search** as the free alternative : it has thousands of atmospheric, ambient, and environmental audio files. You can also upload your own local tracks directly in the Soundscape card.
