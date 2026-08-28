/* Pure helpers for a study session: queue building, mode choice, answer checks. */
import { VOCAB } from "./data.js";
import { Store, srsUtil } from "./store.js";

// Build the list of card ids for a new session.
// opts: { themeOnly?, limit?, allowAheadNew? }
export function buildSessionQueue(opts = {}) {
  let queue;
  if (opts.themeOnly) {
    const ids = VOCAB.filter((v) => v.theme === opts.themeOnly)
      .map((v) => v.id)
      .filter((id) => !(Store.data.cards[id] || {}).known);
    const today = srsUtil.todayStr();
    queue = ids.filter((id) => {
      const c = Store.data.cards[id];
      return !c || !c.seen || c.due <= today;
    });
    if (queue.length === 0) queue = ids.slice();
    srsUtil.shuffle(queue);
  } else {
    const built = Store.buildQueue();
    queue = built.queue;
    if (opts.allowAheadNew && queue.length < (opts.limit || 10)) {
      const have = new Set(queue);
      const extra = VOCAB.filter((v) => {
        const c = Store.data.cards[v.id];
        return !have.has(v.id) && (!c || !c.seen);
      }).map((v) => v.id);
      srsUtil.shuffle(extra);
      queue = queue.concat(extra);
    }
  }
  if (opts.limit) queue = queue.slice(0, opts.limit);
  return queue;
}

export function pickMode(prog) {
  if (!prog || !prog.seen) return "learn";
  const r = prog.reps || 0;
  if (r <= 1) return Math.random() < 0.55 ? "type" : "choice";
  const roll = Math.random();
  if (roll < 0.3) return "type";
  if (roll < 0.55) return "gap";
  if (roll < 0.8) return "listen";
  return "choice";
}

// four multiple-choice options (correct + 3 distractors), shuffled
export function choiceOptions(v) {
  let distractors = srsUtil
    .shuffle(VOCAB.filter((x) => x.id !== v.id && x.pos === v.pos))
    .slice(0, 3);
  if (distractors.length < 3) {
    distractors = distractors.concat(
      srsUtil
        .shuffle(VOCAB.filter((x) => x.id !== v.id && !distractors.includes(x)))
        .slice(0, 3 - distractors.length)
    );
  }
  return srsUtil.shuffle([v, ...distractors]);
}

function normalize(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(to |the |a |an )/, "")
    .replace(/[.,!?;:"']/g, "")
    .replace(/\s+/g, " ");
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[m][n];
}

// grade a typed answer: returns { grade: 0|2|3, almost }
export function checkTyped(raw, word) {
  const a = normalize(raw || "");
  const b = normalize(word);
  if (!a) return null;
  const dist = levenshtein(a, b);
  if (a === b) return { grade: 3, almost: false };
  if (dist <= 1 && b.length > 3) return { grade: 2, almost: true };
  return { grade: 0, almost: false };
}

// projected next interval (in days) for a grade on a card
export function projectedDays(card, grade) {
  if (grade === "never") return 3650;
  if (grade === 0) return 1;
  if (!card || card.reps === 0) return grade === 1 ? 2 : grade === 3 ? 4 : 3;
  if (card.reps === 1) return grade === 1 ? 3 : grade === 3 ? 8 : 6;
  const m = grade === 1 ? 1.2 : grade === 3 ? card.ef * 1.3 : card.ef;
  return Math.max(1, Math.round(card.interval * m));
}
