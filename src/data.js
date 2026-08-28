/* ============================================================
   LeoFlash vocabulary deck.

   The data lives in JSON under data/ (the single source of truth):
     data/vocab.json   — every word: { word, pos, ipa, es, def, ex, level, rank }
     data/levels.json  — the CEFR bands + the "software" track: { key: { label, icon } }

   This module just loads those, gives each word a stable id, and
   exposes the list plus which levels actually have words.
   ============================================================ */

import VOCAB_JSON from "../data/vocab.json";
import LEVELS from "../data/levels.json";

const slugify = (word) => word.toLowerCase().trim();

const VOCAB = [];
const seenSlugs = new Set();
for (const row of VOCAB_JSON) {
  const id = slugify(row.word);
  if (seenSlugs.has(id)) continue; // guard against accidental duplicates
  seenSlugs.add(id);
  VOCAB.push({ id, ...row });
}

// levels that actually contain at least one word (bands fill up over time)
const levelCounts = VOCAB.reduce((counts, entry) => {
  counts[entry.level] = (counts[entry.level] || 0) + 1;
  return counts;
}, {});
const ACTIVE_LEVELS = Object.fromEntries(
  Object.entries(LEVELS).filter(([key]) => levelCounts[key] > 0)
);

export { LEVELS, ACTIVE_LEVELS, VOCAB };
