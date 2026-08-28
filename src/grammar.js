/* English tenses & structures, explained in Spanish.
   The data lives in data/grammar.json (the single source of truth):
     { groups: [{ key, label, icon }], entries: [{ id, name, es, level, group, … }] }
*/

import GRAMMAR_JSON from "../data/grammar.json";

export const GRAMMAR_GROUPS = GRAMMAR_JSON.groups;
export const GRAMMAR = GRAMMAR_JSON.entries;
