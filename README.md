# LeoFlash — English A1–B2 Vocabulary Trainer

**Live:** https://leobol360.github.io/leoflash/ · auto-deployed from `main` via GitHub Actions.

A React app for building English vocabulary. It teaches the most useful words
**in frequency order** with a spaced‑repetition schedule, five practice modes,
audio pronunciation and progress tracking. Everything runs in the browser and
your progress is saved locally — no account, no server needed.

Built with **React 19 + Vite**.

The deck holds **~3,000 words** (frequency‑ranked, full A1 through B2) plus a
thematic **Software & IT** set. Words are grouped by **CEFR level** — A1 / A2 /
B1 / B2 — and you choose which levels to load. "Progress by level" tracks how
much of each you have started, mastered, and marked as already known.

## How to run

```bash
npm install     # once
```

**Everyday use — no server needed:**

```bash
npm run build          # dist/index.html + the home-screen icons & manifest
```

Then just **open `dist/index.html`** in your browser (double-click it). Everything
— the app and the whole ~3000-word deck — is inlined into that one file, so it
works fully offline and reloading any section is fine. (`dist/` also carries the
lion icons + `manifest.webmanifest` so "Add to Home Screen" on a phone gets the
lion icon and opens fullscreen.) Re-run `npm run build`
whenever you change the code or the deck.

**Development (hot reload):**

```bash
npm run dev            # http://localhost:4173  (keep this terminal open)
npm run preview        # serve the built dist/ on the same port
```

> The dev/preview server always uses port **4173** (`strictPort`). If you reload a
> page and the browser says *"can't reach the site"*, the dev server isn't
> running — start `npm run dev` again, or use the built `dist/index.html`.
>
> Your progress is stored by the browser and tied to the address, so stick to
> one way of opening the app (either always `localhost:4173`, or always the same
> `dist/index.html`).

## The data lives in `data/`

All app content is plain JSON in `data/`, the single source of truth:

```
data/vocab.json      every word: { word, pos, ipa, es, def, ex, level, rank }
data/levels.json     the CEFR bands + "software" track: { key: { label, icon } }
data/grammar.json    the tenses & structures reference: { groups, entries }
data/phrases.json    common phrases & idioms: { categories, phrases }
```

The `src/*.js` modules just import these (Vite bundles the JSON into the build,
so the app works fully offline) and add the derived bits — a stable `id` per
word/phrase, which levels actually contain words, etc. Edit the JSON directly to
change the content; no build step to regenerate anything.

### Loading a level

On first run the app asks which levels you want. Picking a level puts its words
into this browser's storage and your **repetition history builds up there**,
keyed by the word itself — so you can add a level later (Home → *Change levels*,
or Settings → *Levels loaded*) **without losing any progress**.

The whole app is limited to the loaded levels: the study queue, the **Deck**
table, the dashboard counts and the Stats page only ever show words from the
levels you have loaded.

The **Deck** lives inside the **Cards** tab as a collapsible table (word ·
translation · status · delete). Deleting a word removes it from your deck — it
stops showing up in study, counts and stats. It's recoverable: the *Removed*
status filter lists deleted words with a **restore** button.

## Never lose your progress

Progress (learned words, streak, stats, schedule) is saved to `localStorage`
after every card. To keep it safe or move it between browsers/computers:

- **Settings → Download backup** — saves `leoflash-backup-YYYY-MM-DD.json`.
- **Settings → Restore from file** — loads a backup back in.

Do a backup now and then, and before clearing browser data.

## What makes it good for learning

| Feature | Why it helps |
|---|---|
| **Spaced repetition (SM‑2)** | Each word comes back right before you'd forget it. Interval grows on success, resets on a slip. |
| **5 mixed modes** | Flashcard + self‑rating, *type the word*, listening dictation, sentence gap‑fill, multiple choice. Retrieval, not re‑reading. |
| **Production practice** | Type English from a Spanish prompt + definition — the hardest, most useful direction. |
| **Audio** | Web Speech API pronounces every word; a listening mode trains your ear. |
| **Level‑based, frequency‑ordered** | Words taught most‑common‑first, grouped into A1/A2/B1/B2. Each has POS, Spanish gloss, a simple English definition and an example sentence. |
| **"Never" button** | On a new word: *No / Almost / Yes / **Never*** — "Never" means you already know it, so it leaves the rotation for good. Each button shows the next interval. |
| **One dial** | *New words per day* is a daily goal. **Due reviews always come first** and count toward it; new words only fill the slots left over. If your reviews alone reach the goal you get no new words that day and the app warns you the backlog is growing. Clear the goal and you're done — the button disappears until tomorrow. |
| **Phrases** | Common phrases & idioms with one dial (*Phrases per day* — the daily target and the Practice round size), a Leitner practice loop, a streak of its own, and **Quick 5** for extra rounds once the target is met. |
| **Stats** | What you've mastered for good (words at interval ≥ 21 days, phrases in the top Leitner box), a 35-day practice calendar (words *and* phrases) with current / best streak, and per-level completion — how many words and phrases are left to finish each loaded level. |
| **Grammar reference** | A **Grammar** tab with all English tenses (the 12 core ones + future forms, past habits, conditionals, passive) — uses, structure for the affirmative / negative / question forms, examples, time markers and common mistakes. Explanations in Spanish, examples in English. |

## Keyboard shortcuts (during study)

- `Space` — flip the flashcard
- `1` `2` `3` `4` — on a new word: **No / Almost / Yes / Never**
- `Enter` — submit a typed answer / continue
- `S` — hear the word again

## Project layout

```
index.html                Vite entry (dev)
vite.config.js             build config (single-file output via vite-plugin-singlefile)
dist/index.html            the built app — one self-contained file, runs offline
src/
  main.jsx                 bootstraps React
  App.jsx                  shell: nav, routing, session handling
  style.css                all styling (light/dark, 5 accents)
  data.js                  loads data/vocab.json + data/levels.json, adds ids
  grammar.js               re-exports data/grammar.json
  phrases.js               loads data/phrases.json + the practice helpers
  store.js                 localStorage + SM-2 + Leitner phrases + backup/restore + pub/sub
  session.js               queue building, mode choice, answer checking
  speech.js                Web Speech API wrapper
  install.js               "Add to Home Screen" helper (captures beforeinstallprompt)
  format.js                small shared helpers
  useStore.js              React hook (useSyncExternalStore)
  components/ui.jsx        Ring, ProgressBar, StatCard, Sentence…
  views/                   LevelPicker, Home (+ DeckTable), Study, Grammar, Phrases, Stats, Settings
data/*.json                all app content — the single source of truth
public/                    home-screen icons, manifest.webmanifest, sw.js (minimal, no caching)
```

### Adding your own words

Append an object to `data/vocab.json` with an explicit `level`
(`a1`/`a2`/`b1`/`b2`/`software`):

```json
{ "word": "…", "pos": "…", "ipa": "", "es": "…", "def": "…", "ex": "…", "level": "b1", "rank": 3100 }
```

Card history is keyed by the word text, so reordering the list never loses
progress. Older installs keyed by number are migrated automatically.
