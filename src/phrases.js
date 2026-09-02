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

// id === the vocab word, plus "#n" for the 2nd, 3rd… sentence of that word.
export const PHRASES = Object.entries(PHRASE_JSON).flatMap(([word, entry]) => {
  const variants = Array.isArray(entry) ? entry : [entry];
  return variants.map((p, i) => ({
    id: i === 0 ? word : `${word}#${i}`,
    word,
    level: LEVEL_BY_WORD.get(word) || "a1",
    es: p.es,
    en: p.en,
    tense: p.tense || "present",
  }));
});

const BY_ID = new Map(PHRASES.map((p) => [p.id, p]));
export const getPhrase = (id) => BY_ID.get(id);

/* ---- similarity score that auto-grades the typed answer ---- */

const normalize = (text) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"'¿¡()]/g, "")
    .replace(/\s+/g, " ");

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

// 0–100: how close the typed answer is to the expected English, by edit
// distance over the longer of the two (punctuation/·case ignored).
export function similarity(typed, reference) {
  const a = normalize(typed);
  const b = normalize(reference);
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  if (a === b) return 100;
  return Math.round((1 - levenshtein(a, b) / Math.max(a.length, b.length)) * 100);
}
