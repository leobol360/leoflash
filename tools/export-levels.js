/* ------------------------------------------------------------------
   Export the vocabulary deck (src/data.js) to level-split JSON files
   in data/  — a project-committed backup of every word.

       npm run export-levels

   Files written:
       data/vocab.a1.json   data/vocab.a2.json
       data/vocab.b1.json   data/vocab.b2.json
       data/vocab.software.json
       data/vocab.all.json     (everything, one file)
       data/manifest.json      (counts + level metadata)
   ------------------------------------------------------------------ */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { VOCAB, THEMES } = await import(join(__dirname, "..", "src", "data.js"));

const OUT = join(__dirname, "..", "data");
mkdirSync(OUT, { recursive: true });

const pick = (v) => ({
  word: v.word,
  pos: v.pos,
  ipa: v.ipa || "",
  es: v.es,
  def: v.def,
  ex: v.ex,
  level: v.level,
  rank: v.rank,
});

const byLevel = {};
for (const v of VOCAB) (byLevel[v.level] ||= []).push(pick(v));

const manifest = {
  generatedAt: new Date().toISOString(),
  total: VOCAB.length,
  levels: [],
};

for (const [key, meta] of Object.entries(THEMES)) {
  const rows = byLevel[key] || [];
  const file = `vocab.${key}.json`;
  writeFileSync(join(OUT, file), JSON.stringify(rows, null, 2) + "\n");
  manifest.levels.push({ key, label: meta.label, icon: meta.icon, count: rows.length, file });
  console.log(`  ${file.padEnd(22)} ${rows.length} words`);
}

writeFileSync(join(OUT, "vocab.all.json"), JSON.stringify(VOCAB.map(pick), null, 2) + "\n");
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`  vocab.all.json         ${VOCAB.length} words`);
console.log(`  manifest.json`);
console.log(`\nDone → ${relative(process.cwd(), OUT)}/`);
