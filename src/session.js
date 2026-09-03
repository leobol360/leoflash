/* Pure helpers for a study session: queue building, mode choice, answer checks. */
import { VOCAB } from "./data.js";
import { Store, todayStr, shuffle } from "./store.js";

const KNOWN_REFRESH_DAYS = 30; // matches KNOWN_REFRESH_DAYS in store.js — "I know it" comes back monthly

// Build the list of card ids for a study session. Just the daily session:
// due reviews first (always all of them), then new words filling whatever
// slots are left under the daily goal. Nothing pulled forward from tomorrow.
//   opts.levelOnly → study one CEFR level's due reviews + its share of
//                    the day's remaining new-word slots
export function buildSessionQueue(opts = {}) {
  const today = todayStr();
  let queue;

  if (opts.levelOnly) {
    const levelIds = VOCAB.filter(
      (entry) => entry.level === opts.levelOnly && !Store.isRemoved(entry.id)
    ).map((entry) => entry.id);
    const due = [];
    const unseen = [];
    for (const id of levelIds) {
      const card = Store.data.cards[id];
      if (!card || !card.seen) unseen.push(id);
      else if (card.due <= today) due.push(id); // includes "known" cards on their monthly date
    }
    due.sort((a, b) =>
      Store.data.cards[a].due.localeCompare(Store.data.cards[b].due)
    );
    shuffle(unseen);
    queue =
      due.length || unseen.length ? [...due, ...unseen] : levelIds.slice();
  } else {
    queue = Store.buildQueue().queue; // reviews first, then new up to the goal
  }

  // new words can only fill the slots still left under today's goal
  // (reviews always come first and count toward it)
  const newLeft = Store.dueSummary().newLeft;
  let newTaken = 0;
  return queue.filter((id) => {
    const card = Store.data.cards[id];
    if (card && card.seen) return true; // a review — always keep
    if (newTaken < newLeft) {
      newTaken++;
      return true;
    }
    return false; // no new-word slots left today — drop
  });
}

// Which exercise a card gets. A brand-new word (never studied) always gets
// the flip card ("learn") — you can't type a word you've never seen. Every
// review after that follows `style` (Settings → Review style):
//   "flip"  → mostly the flip card, some typing
//   "type"  → never the flip card: type / gap / listen only
//   "mixed" → an even blend of flip + type + gap + listen (default)
// `gap` (fill the blank in the example) needs the word reasonably known, so
// it's held back until a card has a couple of reps.
export function pickMode(card, style = "mixed") {
  if (!card || !card.seen) return "learn";
  const reps = card.reps || 0;
  const r = Math.random();

  if (style === "flip") {
    return r < 0.7 ? "learn" : r < 0.85 ? "type" : "listen";
  }
  if (style === "type") {
    if (reps < 2) return r < 0.7 ? "type" : "listen";
    return r < 0.4 ? "type" : r < 0.7 ? "gap" : "listen";
  }
  // mixed
  if (reps < 2) {
    return r < 0.34 ? "learn" : r < 0.7 ? "type" : "listen";
  }
  return r < 0.25 ? "learn" : r < 0.5 ? "type" : r < 0.78 ? "gap" : "listen";
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
  if (grade === "never") return KNOWN_REFRESH_DAYS;
  if (grade === 0) return 1;
  if (!card || card.reps === 0) return grade === 1 ? 2 : grade === 3 ? 4 : 3;
  if (card.reps === 1) return grade === 1 ? 3 : grade === 3 ? 8 : 6;
  const multiplier = grade === 1 ? 1.2 : grade === 3 ? card.easeFactor * 1.3 : card.easeFactor;
  return Math.max(1, Math.round(card.interval * multiplier));
}
