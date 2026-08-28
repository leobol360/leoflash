/* ============================================================
   Word-level glossary for the flashcards.
   Given a token from an English sentence or definition, find the
   Spanish translation of the word it came from — using the deck
   itself as the dictionary, plus data/glossary-extra.json for
   common words that never made it into the deck, plus generated
   inflected forms so "crashes", "slices" or "deployed" resolve.
   ============================================================ */

import { VOCAB } from "./data.js";
import EXTRA from "../data/glossary-extra.json";
import FUNCTION_WORDS from "../data/glossary-function.json";
import WORD_SENSES from "../data/word-senses.json";
import { verbForms, nounForms, primaryPos } from "./inflect.js";

const translations = new Map();

function addForm(form, entry) {
  const key = (form || "").toLowerCase().trim();
  if (key.length < 2 || key.includes(" ")) return;
  if (!translations.has(key)) translations.set(key, entry); // first (more frequent) word wins
}

for (const word of VOCAB) {
  const entry = { word: word.word, es: word.es, pos: word.pos };
  const senses = WORD_SENSES[word.word.toLowerCase()];
  if (senses) entry.senses = senses; // per-meaning glosses + examples
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

// common words missing from the deck — added after it, so a deck word always wins
for (const [word, es] of Object.entries(EXTRA)) {
  const entry = { word, es, pos: "" };
  addForm(word, entry);
  addForm(word + "s", entry);
  if (/(s|x|z|sh|ch)$/.test(word)) addForm(word + "es", entry);
  if (/[^aeiou]y$/.test(word)) addForm(word.slice(0, -1) + "ies", entry);
}

// grammar words, numbers and contractions — added last (lowest priority)
for (const [word, es] of Object.entries(FUNCTION_WORDS)) {
  addForm(word, { word, es, pos: "" });
}

const CONTRACTED_BASE = { "won't": "will", "can't": "can", "shan't": "shall", "ain't": "be" };

// crude fallbacks for inflected forms whose lemma differs from what we generated
const SUFFIX_RULES = [
  [/ies$/, "y"],
  [/ied$/, "y"],
  [/iest$/, "y"],    // easiest -> easy
  [/ier$/, "y"],     // easier -> easy
  [/([^aeiou])es$/, "$1"],
  [/ally$/, "al"],   // officially -> official
  [/ily$/, "y"],     // easily -> easy
  [/ly$/, ""],       // firmly -> firm, carefully -> careful
  [/ing$/, ""],
  [/ing$/, "e"],     // moving -> move
  [/ed$/, ""],
  [/ed$/, "e"],      // moved -> move
  [/est$/, ""],      // highest -> high
  [/est$/, "e"],     // largest -> large
  [/er$/, ""],       // higher -> high, teacher -> teach
  [/er$/, "e"],      // larger -> large
  [/s$/, ""],
];

export function lookup(raw) {
  const token = (raw || "").toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, "");
  if (token.length < 2) return null;
  if (translations.has(token)) return translations.get(token);
  // contractions: "she's" -> "she", "don't" -> "do", "won't" -> "will"
  if (token.includes("'")) {
    if (CONTRACTED_BASE[token] && translations.has(CONTRACTED_BASE[token])) {
      return translations.get(CONTRACTED_BASE[token]);
    }
    const stem = token.replace(/n't$/, "").replace(/'(s|re|ll|ve|d|m)$/, "");
    if (stem.length >= 2 && stem !== token && translations.has(stem)) {
      return translations.get(stem);
    }
  }
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
