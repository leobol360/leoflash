/* Small shared helpers. */

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// "tomorrow" / "in 3 days" / "Sat 30 Aug" for a YYYY-MM-DD date string.
export function formatRelativeDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d - today) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

// Human-readable spaced-repetition interval.
export function formatInterval(days) {
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
