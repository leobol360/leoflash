/* Pure helpers for a study session: queue building, mode choice, answer checks. */
import { VOCAB } from "./data.js";
import { Store, todayStr, shuffle } from "./store.js";

const NEVER_REPEAT_DAYS = 3650; // matches KNOWN_INTERVAL_DAYS in store.js

// Build the list of card ids for a new session.
// opts: { levelOnly?, limit?, allowAheadNew?, ahead? }
//   ahead         → deliberately study upcoming work (past the daily cap /
//                   before cards are due) when the scheduled queue is empty
//   allowAheadNew → top the queue up to `limit` with unseen words (Quick 10)
export function buildSessionQueue(opts = {}) {
  const today = todayStr();
  let queue;

  if (opts.levelOnly) {
    const ids = VOCAB.filter((entry) => entry.level === opts.levelOnly)
      .map((entry) => entry.id)
      .filter((id) => !(Store.data.cards[id] || {}).known);
    queue = ids.filter((id) => {
      const card = Store.data.cards[id];
      return !card || !card.seen || card.due <= today;
    });
    if (queue.length === 0) queue = ids.slice(); // whole level if nothing due
    shuffle(queue);
  } else {
    const scheduled = Store.buildQueue(); // due-today + up to newPerDay new, in loaded levels
    queue = scheduled.queue;

    const wantAhead =
      opts.ahead || (opts.allowAheadNew && queue.length < (opts.limit || 10));

    if (wantAhead) {
      const queuedIds = new Set(queue);
      const unseen = [];
      const future = []; // [id, dueDate] — seen, not known, not due yet
      for (const entry of VOCAB) {
        if (!Store.inScope(entry) || queuedIds.has(entry.id)) continue;
        const card = Store.data.cards[entry.id];
        if (!card || !card.seen) unseen.push(entry.id);
        else if (!card.known && card.due > today) future.push([entry.id, card.due]);
      }
      shuffle(unseen);
      future.sort((a, b) => a[1].localeCompare(b[1])); // soonest review first
      queue = queue.concat(unseen, future.map(([id]) => id));
    }
  }

  // cap: explicit limit, or one "day" worth when studying ahead
  const cap =
    opts.limit ||
    (opts.ahead ? Math.max(10, Store.settings().newPerDay) : Infinity);
  if (cap !== Infinity) queue = queue.slice(0, cap);
  return queue;
}

// Which exercise a card gets, weighted by how well it's known.
export function pickMode(card) {
  if (!card || !card.seen) return "learn";
  const reps = card.reps || 0;
  if (reps <= 1) return Math.random() < 0.55 ? "type" : "choice";
  const roll = Math.random();
  if (roll < 0.3) return "type";
  if (roll < 0.55) return "gap";
  if (roll < 0.8) return "listen";
  return "choice";
}

// four multiple-choice options (correct + 3 distractors), shuffled
export function choiceOptions(entry) {
  let distractors = shuffle(
    VOCAB.filter((x) => x.id !== entry.id && x.pos === entry.pos)
  ).slice(0, 3);
  if (distractors.length < 3) {
    distractors = distractors.concat(
      shuffle(
        VOCAB.filter((x) => x.id !== entry.id && !distractors.includes(x))
      ).slice(0, 3 - distractors.length)
    );
  }
  return shuffle([entry, ...distractors]);
}

function normalizeAnswer(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/^(to |the |a |an )/, "")
    .replace(/[.,!?;:"']/g, "")
    .replace(/\s+/g, " ");
}

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

// grade a typed answer: returns { grade: 0|2|3, almost }
export function checkTyped(raw, word) {
  const guess = normalizeAnswer(raw || "");
  const answer = normalizeAnswer(word);
  if (!guess) return null;
  const dist = levenshtein(guess, answer);
  if (guess === answer) return { grade: 3, almost: false };
  if (dist <= 1 && answer.length > 3) return { grade: 2, almost: true };
  return { grade: 0, almost: false };
}

// projected next interval (in days) for a grade on a card
export function projectedDays(card, grade) {
  if (grade === "never") return NEVER_REPEAT_DAYS;
  if (grade === 0) return 1;
  if (!card || card.reps === 0) return grade === 1 ? 2 : grade === 3 ? 4 : 3;
  if (card.reps === 1) return grade === 1 ? 3 : grade === 3 ? 8 : 6;
  const multiplier = grade === 1 ? 1.2 : grade === 3 ? card.easeFactor * 1.3 : card.easeFactor;
  return Math.max(1, Math.round(card.interval * multiplier));
}
