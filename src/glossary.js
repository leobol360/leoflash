/* ============================================================
   Word-level glossary for the flashcards.
   Given a token from an English sentence or definition, find the
   Spanish translation of the word it came from — using the deck
   itself as the dictionary, plus generated inflected forms so
   "crashes", "deployed" or "servers" still resolve.
   ============================================================ */

import { VOCAB } from "./data.js";
import { verbForms, nounForms, primaryPos } from "./inflect.js";

const _map = new Map();

function add(key, entry) {
  const k = (key || "").toLowerCase().trim();
  if (k.length < 2 || k.includes(" ")) return;
  if (!_map.has(k)) _map.set(k, entry); // first (more frequent) word wins
}

for (const v of VOCAB) {
  const entry = { word: v.word, es: v.es, pos: v.pos };
  add(v.word, entry);
  const p = primaryPos(v.pos);
  if (p === "verb") {
    const f = verbForms(v.word);
    if (f) [f.third, f.gerund, f.past, f.participle].forEach((x) => add(x, entry));
  } else if (p === "noun") {
    const f = nounForms(v.word);
    if (f && f.plural) add(f.plural, entry);
  }
}

// crude fallbacks for inflected forms whose lemma differs from what we generated
const STRIP = [
  [/ies$/, "y"],
  [/ied$/, "y"],
  [/([^aeiou])es$/, "$1"],
  [/ing$/, ""],
  [/ed$/, ""],
  [/s$/, ""],
];

export function lookup(raw) {
  const token = (raw || "").toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
  if (token.length < 2) return null;
  if (_map.has(token)) return _map.get(token);
  for (const [re, rep] of STRIP) {
    if (!re.test(token)) continue;
    const base = token.replace(re, rep);
    if (_map.has(base)) return _map.get(base);
    // undo a doubled final consonant: "stopped" -> "stopp" -> "stop"
    if (/([bcdfghjklmnpqrstvwxz])\1$/.test(base)) {
      const single = base.slice(0, -1);
      if (_map.has(single)) return _map.get(single);
    }
  }
  return null;
}
