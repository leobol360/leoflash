/* Small shared helpers. */

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// Human-readable spaced-repetition interval.
export function fmtInterval(days) {
  if (days <= 0) return "today";
  if (days < 1.5) return "1 day";
  if (days < 10) return Math.round(days) + " days";
  if (days < 45) return Math.round(days / 7) + " wk";
  if (days < 330) return Math.round(days / 30) + " mo";
  if (days >= 3000) return "removed";
  return Math.round(days / 365) + " yr";
}

// Highlight (or blank out) the target word inside an example sentence.
export function highlightParts(sentence, word, blank) {
  const core = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${core}\\w*`, "i");
  const m = sentence.match(re);
  if (!m) return [{ text: sentence }];
  const before = sentence.slice(0, m.index);
  const after = sentence.slice(m.index + m[0].length);
  return [
    { text: before },
    blank ? { blank: true } : { mark: m[0] },
    { text: after },
  ];
}
