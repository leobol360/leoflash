/* ============================================================
   Storage + spaced repetition (SM-2 variant, day based)
   Framework-agnostic. React subscribes via useStore() / useSyncExternalStore.
   ============================================================ */

import { VOCAB, ACTIVE_THEMES } from "./data.js";

const STORE_KEY = "leoflash";
// older key names, read once and migrated into STORE_KEY so progress carries over
const LEGACY_STORE_KEYS = ["flashb1.v2"];

/* ---- tiny pub/sub so the UI can react to changes ---- */
let _version = 0;
const _listeners = new Set();
function _emit() {
  _version++;
  _listeners.forEach((fn) => fn());
}

const DEFAULT_SETTINGS = {
  name: "",             // the learner's name, for a personalised greeting
  newPerDay: 20,        // the ONE configurable number: new words to learn each day
  theme: "dark",        // "dark" | "light"
  accent: "violet",
  voice: "",            // preferred speechSynthesis voice name
  autoSpeak: true,
  themesEnabled: null,  // null = all levels; otherwise ["a1","a2",...] — the levels loaded into study
  levelsChosen: false,  // has the learner picked their levels yet?
};

// YYYY-MM-DD in the LOCAL timezone, so the "day" rolls over at local
// midnight for everyone (toISOString would use UTC and shift the boundary).
function ymd(t) {
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr(d) {
  return ymd(d ? new Date(d) : new Date());
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ymd(new Date(y, m - 1, d + n));
}

function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
}

const Store = {
  data: null,

  load() {
    let raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) {}
    if (!raw) {
      // first run after a key rename: move the old data over, then drop the old key
      for (const k of LEGACY_STORE_KEYS) {
        try {
          const old = localStorage.getItem(k);
          if (old) {
            raw = old;
            localStorage.setItem(STORE_KEY, old);
            localStorage.removeItem(k);
            break;
          }
        } catch (e) {}
      }
    }
    if (raw) {
      try { this.data = JSON.parse(raw); } catch (e) { this.data = null; }
    }
    if (!this.data) {
      this.data = {
        settings: { ...DEFAULT_SETTINGS },
        cards: {},          // id -> card progress
        log: {},            // date -> { reviews, correct, newSeen }
        streak: 0,
        lastStudied: null,
        createdAt: todayStr(),
      };
    }
    // fill any missing settings after an update
    this.data.settings = { ...DEFAULT_SETTINGS, ...this.data.settings };
    this.data.maxStreak = Math.max(this.data.maxStreak || 0, this.data.streak || 0);
    this.migrateIds();
    this.save();
    return this.data;
  },

  // Older versions keyed cards by a numeric position (1, 2, 3…).
  // The deck now uses the word itself as the id so progress survives
  // reordering. Remap any old numeric keys once, using VOCAB order.
  migrateIds() {
    if (this.data.idScheme === "word") return;
    const cards = this.data.cards || {};
    const hasNumeric = Object.keys(cards).some((k) => /^\d+$/.test(k));
    if (hasNumeric && VOCAB) {
      const out = {};
      VOCAB.forEach((v, i) => {
        const old = cards[String(i + 1)];
        if (old) { old.id = v.id; out[v.id] = old; }
      });
      for (const k of Object.keys(cards)) if (!/^\d+$/.test(k)) out[k] = cards[k];
      this.data.cards = out;
    }
    this.data.idScheme = "word";
  },

  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) {}
    _emit();
  },

  /* ---- subscription (for React's useSyncExternalStore) ---- */
  subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn); },
  getVersion() { return _version; },
  touch() { _emit(); },

  reset() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    this.data = null;
    return this.load();
  },

  /* ---- backup / restore -------------------------------- */
  exportBlob() {
    const payload = {
      app: "leoflash",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: this.data,
    };
    return JSON.stringify(payload, null, 2);
  },

  importJSON(text) {
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { throw new Error("The file is not valid JSON."); }
    const d = parsed && parsed.data ? parsed.data : parsed;
    if (!d || typeof d !== "object" || !d.cards || !d.settings) {
      throw new Error("This does not look like a LeoFlash backup.");
    }
    this.data = d;
    this.data.settings = { ...DEFAULT_SETTINGS, ...this.data.settings };
    this.data.cards = this.data.cards || {};
    this.data.log = this.data.log || {};
    this.migrateIds();
    this.save();
    return this.data;
  },

  lastActivityDays() {
    if (!this.data.lastStudied) return null;
    return daysBetween(this.data.lastStudied, todayStr());
  },

  settings() { return this.data.settings; },

  // Which CEFR levels are loaded into study. null = all.
  enabledLevels() {
    return this.settings().themesEnabled || Object.keys(ACTIVE_THEMES);
  },
  levelEnabled(key) {
    const e = this.settings().themesEnabled;
    return !e || e.includes(key);
  },
  // Predicate: is this word inside a loaded level?
  inScope(v) {
    return this.levelEnabled(v.theme);
  },
  // Words that belong to the loaded levels only.
  scopedVocab() {
    return VOCAB.filter((v) => this.inScope(v));
  },

  // Everything derives from the single "new words per day" number.
  // The daily activity target = new words + the reviews they generate.
  dailyGoal() { return Math.max(10, Math.round(this.settings().newPerDay * 2.5)); },

  // How well a single card is known: 0 = unseen, 1 = mature (21-day interval).
  // Grows on every successful review, so topic bars advance word by word.
  mastery(id) {
    const c = this.data.cards[id];
    if (!c || !c.seen) return 0;
    if (c.known) return 1;
    const ramp = Math.min(1, (c.interval || 1) / 21);
    return Math.max(0.08, ramp);
  },

  // Aggregate progress for one theme/level: average mastery + words touched.
  topicProgress(themeKey) {
    const words = VOCAB.filter((v) => v.theme === themeKey);
    let sum = 0, started = 0, known = 0;
    for (const v of words) {
      const m = this.mastery(v.id);
      sum += m;
      if (m > 0) started++;
      if ((this.data.cards[v.id] || {}).known) known++;
    }
    return {
      total: words.length,
      started,
      known,
      pct: words.length ? Math.round((sum / words.length) * 100) : 0,
    };
  },

  card(id) {
    if (!this.data.cards[id]) {
      this.data.cards[id] = {
        id,
        ef: 2.5,
        interval: 0,
        reps: 0,
        lapses: 0,
        due: todayStr(),
        last: null,
        seen: false,      // has ever been studied
        known: false,     // "Never repeat" — learner already knows it well
        correctCount: 0,
        totalCount: 0,
      };
    }
    return this.data.cards[id];
  },

  // "Never" button — the learner already knows this word; take it out of rotation.
  markKnown(id) {
    const c = this.card(id);
    const firstTime = !c.seen;
    c.seen = true;
    c.known = true;
    c.interval = 3650;
    c.reps = Math.max(c.reps, 5);
    c.last = todayStr();
    c.due = addDays(todayStr(), 3650);
    c.totalCount++;
    c.correctCount++;
    const log = this.logToday();
    log.reviews++;
    log.correct++;
    if (firstTime) log.newSeen++;
    this.updateStreak();
    this.save();
    return c;
  },

  // Bring a "known" word back into normal study.
  unmarkKnown(id) {
    const c = this.data.cards[id];
    if (!c) return;
    c.known = false;
    c.interval = 1;
    c.reps = 0;
    c.due = todayStr();
    this.save();
  },

  logToday() {
    const d = todayStr();
    if (!this.data.log[d]) this.data.log[d] = { reviews: 0, correct: 0, newSeen: 0 };
    return this.data.log[d];
  },

  /* ---- session queue ------------------------------------- */
  buildQueue() {
    const s = this.settings();
    const enabled = s.themesEnabled;
    const inScope = (v) => !enabled || enabled.includes(v.theme);
    const today = todayStr();

    const pool = VOCAB.filter(inScope);
    const due = [];
    const fresh = [];

    for (const v of pool) {
      const c = this.data.cards[v.id];
      if (c && c.known) continue;                 // never repeat
      if (c && c.seen) {
        if (c.due <= today) due.push(v.id);
      } else {
        fresh.push(v.id);
      }
    }

    // order due cards by how overdue they are (most overdue first)
    due.sort((a, b) => (this.data.cards[a].due).localeCompare(this.data.cards[b].due));

    const newSeenToday = this.logToday().newSeen;
    const newRemaining = Math.max(0, s.newPerDay - newSeenToday);

    // shuffle fresh so themes are mixed
    shuffle(fresh);
    const newCards = fresh.slice(0, newRemaining);

    const queue = [...due, ...newCards];
    shuffle(queue);
    return { queue, dueCount: due.length, newCount: newCards.length };
  },

  dueSummary() {
    const s = this.settings();
    const enabled = s.themesEnabled;
    const inScope = (v) => !enabled || enabled.includes(v.theme);
    const today = todayStr();
    let due = 0, learning = 0, newLeft = 0, mature = 0, unseen = 0, known = 0;
    let nextDue = null;                          // soonest upcoming review date
    const newSeenToday = this.logToday().newSeen;
    for (const v of VOCAB.filter(inScope)) {
      const c = this.data.cards[v.id];
      if (!c || !c.seen) { unseen++; continue; }
      if (c.known) { known++; mature++; continue; }
      if (c.due <= today) due++;
      else if (!nextDue || c.due < nextDue) nextDue = c.due;
      if (c.interval >= 21) mature++; else learning++;
    }
    newLeft = Math.max(0, s.newPerDay - newSeenToday);
    const aheadAvailable = unseen > 0 || nextDue != null;
    return { due, learning, mature, unseen, known, newLeft, nextDue, aheadAvailable };
  },

  /* ---- grading (SM-2 variant) --------------------------- */
  // grade: 0 = again, 1 = hard, 2 = good, 3 = easy
  grade(id, grade, wasTyped) {
    const c = this.card(id);
    const firstTime = !c.seen;
    c.seen = true;
    c.totalCount++;
    if (grade >= 2) c.correctCount++;

    const q = [2, 3, 4, 5][grade];
    c.ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

    if (grade === 0) {
      c.reps = 0;
      c.lapses++;
      c.interval = 1;
    } else {
      if (c.reps === 0) {
        c.interval = grade === 1 ? 2 : grade === 3 ? 4 : 3;
      } else if (c.reps === 1) {
        c.interval = grade === 1 ? 3 : grade === 3 ? 8 : 6;
      } else {
        const mult = grade === 1 ? 1.2 : grade === 3 ? c.ef * 1.3 : c.ef;
        c.interval = Math.round(c.interval * mult);
      }
      c.interval = Math.max(1, Math.min(c.interval, 365));
      c.reps++;
    }

    c.last = todayStr();
    c.due = addDays(todayStr(), c.interval);

    const log = this.logToday();
    log.reviews++;
    if (grade >= 2) log.correct++;
    if (firstTime) log.newSeen++;

    this.updateStreak();
    this.save();
    return c;
  },

  updateStreak() {
    const d = todayStr();
    if (this.data.lastStudied === d) return;
    if (this.data.lastStudied === addDays(d, -1)) this.data.streak++;
    else this.data.streak = 1;
    this.data.lastStudied = d;
    this.data.maxStreak = Math.max(this.data.maxStreak || 0, this.data.streak);
  },

  // last `n` days for the Stats activity strip; `active` = studied that day
  activityDays(n = 35) {
    const out = [];
    const today = todayStr();
    for (let i = n - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      const l = this.data.log[day];
      const reviews = l ? l.reviews : 0;
      out.push({ day, reviews, active: reviews > 0 });
    }
    return out;
  },

  /* ---- global stats ------------------------------------- */
  stats() {
    // counts are limited to the loaded levels
    const scoped = this.scopedVocab();
    const inScopeIds = new Set(scoped.map((v) => v.id));
    const cards = Object.entries(this.data.cards)
      .filter(([k, c]) => c.seen && inScopeIds.has(k))
      .map(([, c]) => c);
    const total = scoped.length;
    const learned = cards.filter((c) => c.interval >= 7).length;
    const mature = cards.filter((c) => c.interval >= 21).length;
    let reviews = 0, correct = 0;
    for (const day of Object.values(this.data.log)) {
      reviews += day.reviews; correct += day.correct;
    }
    const accuracy = reviews ? Math.round((correct / reviews) * 100) : 0;
    return {
      total, seen: cards.length, learned, mature,
      reviews, accuracy,
      streak: this.data.streak,
      maxStreak: this.data.maxStreak || this.data.streak || 0,
      studiedToday: this.data.lastStudied === todayStr(),
      today: this.logToday(),
    };
  },

  last14() {
    const out = [];
    let d = todayStr();
    for (let i = 13; i >= 0; i--) {
      const day = addDays(d, -i);
      const l = this.data.log[day];
      out.push({ day, reviews: l ? l.reviews : 0 });
    }
    return out;
  },
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export { Store, todayStr, addDays, daysBetween, shuffle };
export const srsUtil = { todayStr, addDays, daysBetween, shuffle };
