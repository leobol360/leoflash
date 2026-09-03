/* ============================================================
   Phrase-translation practice.

   Short AI-written Spanish sentences, each built around one vocab
   word. The Phrases screen shows the Spanish, you type the English,
   then rate yourself. Each sentence has its own SM-2 schedule in
   store.js — completely separate from the word cards.

   Data: data/phrase-cards.json — { "<word>": <entry> } where <entry> is
   either one { es, en, tense } or an array of them (several short
   sentences for the same word, across different tenses). Each sentence
   gets its own id and its own SM-2 schedule. Regenerate the file with
   `npm run gen:phrases` (see scripts/gen-phrases.mjs).
   ============================================================ */

import PHRASE_JSON from "../data/phrase-cards.json";
import { VOCAB } from "./data.js";

const LEVEL_BY_WORD = new Map(VOCAB.map((v) => [v.word, v.level]));

// Grammatical tenses a phrase can carry, with a short label for Stats.
export const PHRASE_TENSES = [
  { key: "present", label: "Present" },
  { key: "past", label: "Past" },
  { key: "future", label: "Future" },
  { key: "present_perfect", label: "Present perfect" },
  { key: "conditional", label: "Conditional" },
  { key: "present_continuous", label: "Present cont." },
  { key: "past_continuous", label: "Past cont." },
  { key: "imperative", label: "Imperative" },
];
const TENSE_LABEL = new Map(PHRASE_TENSES.map((t) => [t.key, t.label]));
export const tenseLabel = (key) => TENSE_LABEL.get(key) || "Present";

// Which grammatical tenses a learner practises at each CEFR level — cumulative,
// so a higher level also gets everything below it. A phrase is only shown once
// its tense is one the selected level(s) actually teach.
const A1 = ["present", "imperative", "present_continuous"];
const A2 = [...A1, "past", "future"];
const B1 = [...A2, "present_perfect", "past_continuous"];
const B2 = [...B1, "conditional"];
export const TENSES_BY_LEVEL = { a1: A1, a2: A2, b1: B1, b2: B2, software: B2 };

// Union of the tenses taught across a set of levels.
export function tensesForLevels(levels) {
  const set = new Set();
  for (const lvl of levels)
    for (const t of TENSES_BY_LEVEL[lvl] || B2) set.add(t);
  return set;
}

// id === the vocab word, plus "#n" for the 2nd, 3rd… sentence of that word.
// cardId === that word's flashcard id (lower-cased), so we can look up how
// far the learner has got with the underlying word.
export const PHRASES = Object.entries(PHRASE_JSON).flatMap(([word, entry]) => {
  const variants = Array.isArray(entry) ? entry : [entry];
  return variants.map((p, i) => ({
    id: i === 0 ? word : `${word}#${i}`,
    word,
    cardId: word.toLowerCase().trim(),
    level: LEVEL_BY_WORD.get(word) || "a1",
    es: p.es,
    en: p.en,
    tense: p.tense || "present",
  }));
});

const BY_ID = new Map(PHRASES.map((p) => [p.id, p]));
export const getPhrase = (id) => BY_ID.get(id);

// Phrases grouped by grammatical tense — used by the Grammar screen's
// free practice (no schedule, no scoring against your deck).
const BY_TENSE = new Map();
for (const p of PHRASES) {
  if (!BY_TENSE.has(p.tense)) BY_TENSE.set(p.tense, []);
  BY_TENSE.get(p.tense).push(p);
}
export const phrasesInTense = (tense) => BY_TENSE.get(tense) || [];
export function randomPhrase(tense, excludeId) {
  const pool = BY_TENSE.get(tense) || [];
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  let p;
  do {
    p = pool[Math.floor(Math.random() * pool.length)];
  } while (p.id === excludeId);
  return p;
}

/* ---- similarity score + word diff that grade the typed answer ---- */

// one word, lower-cased, apostrophes and punctuation stripped
// ("don't" and "dont" both → "dont", "That's." → "thats").
const normWord = (w) =>
  (w || "").toLowerCase().replace(/['’]/g, "").replace(/[.,!?;:"“”¿¡()]/g, "");

const tokenize = (text) =>
  (text || "")
    .trim()
    .split(/\s+/)
    .map((raw) => ({ raw, norm: normWord(raw) }))
    .filter((t) => t.norm);

function levenshtein(a, b) {
  const rows = a.length, cols = b.length;
  const dist = Array.from({ length: rows + 1 }, (_, i) => [i, ...Array(cols).fill(0)]);
  for (let j = 0; j <= cols; j++) dist[0][j] = j;
  for (let i = 1; i <= rows; i++)
    for (let j = 1; j <= cols; j++)
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dist[rows][cols];
}

// A word only counts as right if it's spelled exactly (after lower-case /
// punctuation / apostrophe stripping). A misspelling — even a close one like
// "require" for "requires" — is wrong; it's just shown differently.
const CLOSE = 0.6; // typed word this similar to the target → "near" (still wrong)

// Align the typed answer to the expected sentence, word by word — a plain
// word-level edit distance (every non-exact word costs a full point). Drives
// both the % score and the highlighted diff, so they always agree.
function align(typed, reference) {
  const a = tokenize(typed);
  const b = tokenize(reference);
  const m = a.length, n = b.length;
  const cost = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) cost[i][0] = i;
  for (let j = 0; j <= n; j++) cost[0][j] = j;
  const same = (i, j) => a[i - 1].norm === b[j - 1].norm;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      cost[i][j] = Math.min(
        cost[i - 1][j] + 1,
        cost[i][j - 1] + 1,
        cost[i - 1][j - 1] + (same(i, j) ? 0 : 1)
      );

  // backtrack into an op list
  const ops = [];
  let i = m, j = n;
  const hits = (x) => Math.abs(cost[i][j] - x) < 1e-9;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && hits(cost[i - 1][j - 1] + (same(i, j) ? 0 : 1))) {
      if (same(i, j)) {
        ops.push({ t: "match", a: a[i - 1].raw, b: b[j - 1].raw });
      } else {
        // wrong word — but flag a genuine typo so the UI can show it softer
        const s = 1 - levenshtein(a[i - 1].norm, b[j - 1].norm) /
          Math.max(a[i - 1].norm.length, b[j - 1].norm.length);
        ops.push({ t: s >= CLOSE ? "near" : "sub", a: a[i - 1].raw, b: b[j - 1].raw });
      }
      i--; j--;
    } else if (i > 0 && hits(cost[i - 1][j] + 1)) {
      ops.push({ t: "ins", a: a[i - 1].raw }); i--;
    } else {
      ops.push({ t: "del", b: b[j - 1].raw }); j--;
    }
  }
  ops.reverse();
  return { ops, distance: cost[m][n], denom: Math.max(m, n) };
}

// 0–100: the share of words typed exactly right, in order
// (case / punctuation / apostrophes ignored).
export function similarity(typed, reference) {
  const a = tokenize(typed), b = tokenize(reference);
  if (!a.length && !b.length) return 100;
  if (!a.length || !b.length) return 0;
  const { distance, denom } = align(typed, reference);
  return Math.round(Math.max(0, 1 - distance / denom) * 100);
}

// Word-by-word diff for the feedback panel.
//   typed:     [{ text, state }]  state: "ok" | "near" | "bad" (wrong/extra)
//   reference: [{ text, state }]  state: "ok" | "near" | "bad" (wrong/missed)
export function wordDiff(typed, reference) {
  const { ops } = align(typed, reference);
  const typedOut = [], refOut = [];
  for (const op of ops) {
    if (op.t === "match") {
      typedOut.push({ text: op.a, state: "ok" });
      refOut.push({ text: op.b, state: "ok" });
    } else if (op.t === "near") {
      typedOut.push({ text: op.a, state: "near" });
      refOut.push({ text: op.b, state: "near" });
    } else if (op.t === "sub") {
      typedOut.push({ text: op.a, state: "bad" });
      refOut.push({ text: op.b, state: "bad" });
    } else if (op.t === "ins") {
      typedOut.push({ text: op.a, state: "bad" }); // extra word
    } else {
      refOut.push({ text: op.b, state: "bad" }); // missed word
    }
  }
  return { typed: typedOut, reference: refOut };
}
