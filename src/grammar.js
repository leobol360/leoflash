/* English tenses & structures, explained in Spanish.
   The data lives in data/grammar.json (the single source of truth):
     { groups: [{ key, label, icon }], entries: [{ id, name, es, level, group, … }] }
*/

import GRAMMAR_JSON from "../data/grammar.json";

export const GRAMMAR_GROUPS = GRAMMAR_JSON.groups;
export const GRAMMAR = GRAMMAR_JSON.entries;

// Which phrase-deck tense each grammar entry practises with (closest match —
// the phrase deck has 8 tense buckets, grammar has finer sub-tenses).
export const GRAMMAR_TENSE = {
  "present-simple": "present",
  "present-continuous": "present_continuous",
  "present-perfect": "present_perfect",
  "present-perfect-continuous": "present_perfect",
  "past-simple": "past",
  "past-continuous": "past_continuous",
  "past-perfect": "past",
  "past-perfect-continuous": "past_continuous",
  "future-will": "future",
  "future-going-to": "future",
  "future-present-forms": "present_continuous",
  "future-continuous": "future",
  "future-perfect": "future",
  "future-perfect-continuous": "future",
  "conditional-0": "present",
  "conditional-1": "conditional",
  "conditional-2": "conditional",
  "conditional-3": "conditional",
  "conditional-mixed": "conditional",
  "used-to": "past",
  "would-past-habits": "conditional",
  "passive-voice": "past",
};
