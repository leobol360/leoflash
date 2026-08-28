/* ============================================================
   Common English phrases & idioms, with Spanish equivalents.
   Used by the Phrases section: a reference list plus a
   fill-in-the-gap practice mode.

   The data lives in data/phrases.json (the single source of truth):
     {
       categories: [{ key, label, icon }],
       phrases:    [{ level, category, en, es, gap, accept? }]
     }
       level   — CEFR band (a1/a2/b1/b2); the list only shows the
                 levels the learner picked at the start
       en      — the natural English phrase
       es      — what a Spanish speaker would actually say
       gap     — the chunk hidden in practice; must appear in `en`
       accept  — extra answers counted as correct
   ============================================================ */

import PHRASES_JSON from "../data/phrases.json";

export const PHRASE_CATEGORIES = PHRASES_JSON.categories;

export const PHRASES = PHRASES_JSON.phrases.map((phrase) => ({
  id: phrase.en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  ...phrase,
}));

// Split `en` around `gap` so the practice card can blank the middle out.
export function splitOnGap(en, gap) {
  const at = en.toLowerCase().indexOf(gap.toLowerCase());
  if (at === -1) return { before: en, gap: "", after: "" };
  return {
    before: en.slice(0, at),
    gap: en.slice(at, at + gap.length),
    after: en.slice(at + gap.length),
  };
}

const normalize = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"'¿¡]/g, "")
    .replace(/\s+/g, " ");

// Is the typed guess an acceptable fill for this phrase's gap?
export function checkGap(guess, phrase) {
  const answer = normalize(guess);
  if (!answer) return false;
  if (answer === normalize(phrase.gap)) return true;
  return (phrase.accept || []).some((alt) => normalize(alt) === answer);
}
