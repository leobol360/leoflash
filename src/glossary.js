/* ============================================================
   Word-level glossary for the flashcards.
   Given a token from an English sentence or definition, find the
   Spanish translation of the word it came from — using the deck
   itself as the dictionary, plus generated inflected forms so
   "crashes", "deployed" or "servers" still resolve.
   ============================================================ */

import { VOCAB } from "./data.js";
import { verbForms, nounForms, primaryPos } from "./inflect.js";

const translations = new Map();

function addForm(form, entry) {
  const key = (form || "").toLowerCase().trim();
  if (key.length < 2 || key.includes(" ")) return;
  if (!translations.has(key)) translations.set(key, entry); // first (more frequent) word wins
}

for (const word of VOCAB) {
  const entry = { word: word.word, es: word.es, pos: word.pos };
  addForm(word.word, entry);
  const pos = primaryPos(word.pos);
  if (pos === "verb") {
    const forms = verbForms(word.word);
    if (forms) [forms.third, forms.gerund, forms.past, forms.participle].forEach((f) => addForm(f, entry));
  } else if (pos === "noun") {
    const forms = nounForms(word.word);
    if (forms && forms.plural) addForm(forms.plural, entry);
  }
}

// crude fallbacks for inflected forms whose lemma differs from what we generated
const SUFFIX_RULES = [
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
  if (translations.has(token)) return translations.get(token);
  for (const [pattern, replacement] of SUFFIX_RULES) {
    if (!pattern.test(token)) continue;
    const base = token.replace(pattern, replacement);
    if (translations.has(base)) return translations.get(base);
    // undo a doubled final consonant: "stopped" -> "stopp" -> "stop"
    if (/([bcdfghjklmnpqrstvwxz])\1$/.test(base)) {
      const single = base.slice(0, -1);
      if (translations.has(single)) return translations.get(single);
    }
  }
  return null;
}
