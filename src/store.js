/* ============================================================
   Storage + spaced repetition (SM-2 variant, day based)
   Framework-agnostic. React subscribes via useStore() / useSyncExternalStore.
   ============================================================ */

import { VOCAB, ACTIVE_LEVELS } from "./data.js";
import { PHRASES } from "./phrases.js";

const STORAGE_KEY = "leoflash";
// older key names, read once and migrated into STORAGE_KEY so progress carries over
const LEGACY_STORAGE_KEYS = ["flashb1.v2"];

/* ---- spaced-repetition tuning ---------------------------- */
const MS_PER_DAY = 86_400_000;
const DEFAULT_EASE_FACTOR = 2.5;   // SM-2 starting ease
const MIN_EASE_FACTOR = 1.3;       // SM-2 never lets ease drop below this
const MAX_INTERVAL_DAYS = 365;     // cap so reviews never drift more than a year out
const KNOWN_INTERVAL_DAYS = 3650;  // "Never repeat" — effectively retired (~10 years)
const MATURE_INTERVAL_DAYS = 21;   // interval at which a card counts as fully learned
const LEARNED_INTERVAL_DAYS = 7;   // interval at which a card counts as "learned"
const MIN_STARTED_MASTERY = 0.08;  // a touched-but-weak card still shows some progress

// Phrase practice uses a simple Leitner box: days until a phrase comes
// back, indexed by box (0 = brand new / just missed, 6 = well known).
const PHRASE_BOX_DAYS = [0, 1, 2, 4, 8, 16, 30];
const PHRASE_MASTERED_BOX = 6;
const DEFAULT_PHRASES_PER_ROUND = 10;   // round size, when the setting is missing/invalid
const DEFAULT_NEW_PHRASES_PER_DAY = 10; // daily new-phrase target, when the setting is missing/invalid
const QUICK_PHRASE_ROUND = 5;           // "Quick 5": extra practice past the daily target

/* ---- tiny pub/sub so the UI can react to changes ---- */
let revision = 0;
const listeners = new Set();
function notifyListeners() {
  revision++;
  listeners.forEach((listener) => listener());
}

const DEFAULT_SETTINGS = {
  name: "",             // the learner's name, for a personalised greeting
  newPerDay: 20,        // the ONE configurable number: new words to learn each day
  phrasesPerRound: 10,     // phrases in one Phrases practice round
  newPhrasesPerDay: 10,    // brand-new phrases the daily practice introduces each day
  theme: "dark",        // colour scheme: "dark" | "light"
  accent: "violet",
  voice: "",            // preferred speechSynthesis voice name
  autoSpeak: true,
  enabledLevels: null,  // null = all levels; otherwise ["a1","a2",...] loaded into study
  levelsChosen: false,  // has the learner picked their levels yet?
};

// YYYY-MM-DD in the LOCAL timezone, so the "day" rolls over at local
// midnight for everyone (toISOString would use UTC and shift the boundary).
function toLocalYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayStr(date) {
  return toLocalYmd(date ? new Date(date) : new Date());
}

function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return toLocalYmd(new Date(year, month - 1, day + days));
}

function daysBetween(fromStr, toStr) {
  return Math.round(
    (new Date(toStr + "T00:00:00") - new Date(fromStr + "T00:00:00")) / MS_PER_DAY
  );
}

// Bring a stored blob up to the current shape: fill new settings, rename
// fields that were cryptic in older versions. Idempotent and defensive.
function migrate(data) {
  data.settings = { ...DEFAULT_SETTINGS, ...data.settings };

  // settings.themesEnabled -> settings.enabledLevels
  if (
    data.settings.themesEnabled !== undefined &&
    data.settings.enabledLevels == null
  ) {
    data.settings.enabledLevels = data.settings.themesEnabled;
  }
  delete data.settings.themesEnabled;

  // per-card: ef -> easeFactor, last -> lastReviewed
  for (const card of Object.values(data.cards || {})) {
    if (card.ef !== undefined && card.easeFactor === undefined) {
      card.easeFactor = card.ef;
    }
    delete card.ef;
    if (card.last !== undefined && card.lastReviewed === undefined) {
      card.lastReviewed = card.last;
    }
    delete card.last;
  }

  data.maxStreak = Math.max(data.maxStreak || 0, data.streak || 0);
  data.phraseCards = data.phraseCards || {}; // id -> Leitner progress for phrase practice
  data.phraseLog = data.phraseLog || {};     // date -> { reviews, correct, newSeen } for phrases
  data.phraseStreak = data.phraseStreak || 0;
  data.phraseMaxStreak = data.phraseMaxStreak || 0;
  data.phraseLastStudied = data.phraseLastStudied || null;
  data.removedWords = data.removedWords || {}; // id -> true: hidden from the deck
  return data;
}

const Store = {
  data: null,

  load() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (!raw) {
      // first run after a key rename: move the old data over, then drop the old key
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        try {
          const old = localStorage.getItem(legacyKey);
          if (old) {
            raw = old;
            localStorage.setItem(STORAGE_KEY, old);
            localStorage.removeItem(legacyKey);
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
    migrate(this.data);
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
      VOCAB.forEach((entry, i) => {
        const old = cards[String(i + 1)];
        if (old) { old.id = entry.id; out[entry.id] = old; }
      });
      for (const k of Object.keys(cards)) if (!/^\d+$/.test(k)) out[k] = cards[k];
      this.data.cards = out;
    }
    this.data.idScheme = "word";
  },

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) {}
    notifyListeners();
  },

  /* ---- subscription (for React's useSyncExternalStore) ---- */
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  getVersion() { return revision; },
  touch() { notifyListeners(); },

  reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    this.data = null;
    return this.load();
  },

  /* ---- backup / restore -------------------------------- */
  exportJSON() {
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
    const restored = parsed && parsed.data ? parsed.data : parsed;
    if (!restored || typeof restored !== "object" || !restored.cards || !restored.settings) {
      throw new Error("This does not look like a LeoFlash backup.");
    }
    this.data = restored;
    this.data.cards = this.data.cards || {};
    this.data.log = this.data.log || {};
    migrate(this.data);
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
    return this.settings().enabledLevels || Object.keys(ACTIVE_LEVELS);
  },
  levelEnabled(level) {
    const enabled = this.settings().enabledLevels;
    return !enabled || enabled.includes(level);
  },

  /* ---- removed words (curated out of the deck, kept in localStorage) ---- */
  isRemoved(id) { return !!this.data.removedWords[id]; },
  removeWord(id) { this.data.removedWords[id] = true; this.save(); },
  restoreWord(id) { delete this.data.removedWords[id]; this.save(); },
  removedCount() { return Object.keys(this.data.removedWords).length; },

  // Predicate: is this word in a loaded level AND not removed from the deck?
  inScope(entry) {
    return this.levelEnabled(entry.level) && !this.isRemoved(entry.id);
  },
  // Words that belong to the loaded levels only.
  scopedVocab() {
    return VOCAB.filter((entry) => this.inScope(entry));
  },

  // How well a single card is known: 0 = unseen, 1 = mature (21-day interval).
  // Grows on every successful review, so level bars advance word by word.
  mastery(id) {
    const card = this.data.cards[id];
    if (!card || !card.seen) return 0;
    if (card.known) return 1;
    const ramp = Math.min(1, (card.interval || 1) / MATURE_INTERVAL_DAYS);
    return Math.max(MIN_STARTED_MASTERY, ramp);
  },

  // Aggregate progress for one level: average mastery + words touched.
  levelProgress(level) {
    const words = VOCAB.filter(
      (entry) => entry.level === level && !this.isRemoved(entry.id)
    );
    let masterySum = 0, started = 0, known = 0;
    for (const entry of words) {
      const m = this.mastery(entry.id);
      masterySum += m;
      if (m > 0) started++;
      if ((this.data.cards[entry.id] || {}).known) known++;
    }
    return {
      total: words.length,
      started,
      known,
      pct: words.length ? Math.round((masterySum / words.length) * 100) : 0,
    };
  },

  card(id) {
    if (!this.data.cards[id]) {
      this.data.cards[id] = {
        id,
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        reps: 0,
        lapses: 0,
        due: todayStr(),
        lastReviewed: null,
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
    const card = this.card(id);
    const firstTime = !card.seen;
    card.seen = true;
    card.known = true;
    card.interval = KNOWN_INTERVAL_DAYS;
    card.reps = Math.max(card.reps, 5);
    card.lastReviewed = todayStr();
    card.due = addDays(todayStr(), KNOWN_INTERVAL_DAYS);
    card.totalCount++;
    card.correctCount++;
    const log = this.logToday();
    log.reviews++;
    log.correct++;
    if (firstTime) log.newSeen++;
    this.updateStreak();
    this.save();
    return card;
  },

  // Bring a "known" word back into normal study.
  unmarkKnown(id) {
    const card = this.data.cards[id];
    if (!card) return;
    card.known = false;
    card.interval = 1;
    card.reps = 0;
    card.due = todayStr();
    this.save();
  },

  logToday() {
    const today = todayStr();
    if (!this.data.log[today]) this.data.log[today] = { reviews: 0, correct: 0, newSeen: 0 };
    return this.data.log[today];
  },

  /* ---- session queue ------------------------------------- */
  buildQueue() {
    const settings = this.settings();
    const enabled = settings.enabledLevels;
    const inScope = (entry) =>
      (!enabled || enabled.includes(entry.level)) && !this.isRemoved(entry.id);
    const today = todayStr();

    const pool = VOCAB.filter(inScope);
    const due = [];
    const fresh = [];

    for (const entry of pool) {
      const card = this.data.cards[entry.id];
      if (card && card.known) continue;             // never repeat
      if (card && card.seen) {
        if (card.due <= today) due.push(entry.id);
      } else {
        fresh.push(entry.id);
      }
    }

    // order due cards by how overdue they are (most overdue first)
    due.sort((a, b) => this.data.cards[a].due.localeCompare(this.data.cards[b].due));

    const newSeenToday = this.logToday().newSeen;
    const newRemaining = Math.max(0, settings.newPerDay - newSeenToday);

    // shuffle fresh so levels are mixed
    shuffle(fresh);
    const newCards = fresh.slice(0, newRemaining);

    const queue = [...due, ...newCards];
    shuffle(queue);
    return { queue, dueCount: due.length, newCount: newCards.length };
  },

  dueSummary() {
    const settings = this.settings();
    const enabled = settings.enabledLevels;
    const inScope = (entry) =>
      (!enabled || enabled.includes(entry.level)) && !this.isRemoved(entry.id);
    const today = todayStr();
    let due = 0, learning = 0, newLeft = 0, mature = 0, unseen = 0, known = 0;
    let nextDue = null;                          // soonest upcoming review date
    const newSeenToday = this.logToday().newSeen;
    for (const entry of VOCAB.filter(inScope)) {
      const card = this.data.cards[entry.id];
      if (!card || !card.seen) { unseen++; continue; }
      if (card.known) { known++; mature++; continue; }
      if (card.due <= today) due++;
      else if (!nextDue || card.due < nextDue) nextDue = card.due;
      if (card.interval >= MATURE_INTERVAL_DAYS) mature++; else learning++;
    }
    newLeft = Math.max(0, settings.newPerDay - newSeenToday);
    const aheadAvailable = unseen > 0 || nextDue != null;
    return { due, learning, mature, unseen, known, newLeft, nextDue, aheadAvailable };
  },

  /* ---- grading (SM-2 variant) --------------------------- */
  // grade: 0 = again, 1 = hard, 2 = good, 3 = easy
  grade(id, grade, wasTyped) {
    const card = this.card(id);
    const firstTime = !card.seen;
    card.seen = true;
    card.totalCount++;
    if (grade >= 2) card.correctCount++;

    // SM-2 quality score (0-5); our four grades map onto 2..5
    const quality = [2, 3, 4, 5][grade];
    card.easeFactor = Math.max(
      MIN_EASE_FACTOR,
      card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    if (grade === 0) {
      card.reps = 0;
      card.lapses++;
      card.interval = 1;
    } else {
      if (card.reps === 0) {
        card.interval = grade === 1 ? 2 : grade === 3 ? 4 : 3;
      } else if (card.reps === 1) {
        card.interval = grade === 1 ? 3 : grade === 3 ? 8 : 6;
      } else {
        const multiplier = grade === 1 ? 1.2 : grade === 3 ? card.easeFactor * 1.3 : card.easeFactor;
        card.interval = Math.round(card.interval * multiplier);
      }
      card.interval = Math.max(1, Math.min(card.interval, MAX_INTERVAL_DAYS));
      card.reps++;
    }

    card.lastReviewed = todayStr();
    card.due = addDays(todayStr(), card.interval);

    const log = this.logToday();
    log.reviews++;
    if (grade >= 2) log.correct++;
    if (firstTime) log.newSeen++;

    this.updateStreak();
    this.save();
    return card;
  },

  updateStreak() {
    const today = todayStr();
    if (this.data.lastStudied === today) return;
    if (this.data.lastStudied === addDays(today, -1)) this.data.streak++;
    else this.data.streak = 1;
    this.data.lastStudied = today;
    this.data.maxStreak = Math.max(this.data.maxStreak || 0, this.data.streak);
  },

  // last `days` days for the Stats views; `active` = studied that day
  activityDays(days = 35) {
    const out = [];
    const today = todayStr();
    for (let i = days - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      const log = this.data.log[day];
      const reviews = log ? log.reviews : 0;
      out.push({ day, reviews, active: reviews > 0 });
    }
    return out;
  },

  /* ---- global stats ------------------------------------- */
  stats() {
    // counts are limited to the loaded levels
    const scoped = this.scopedVocab();
    const inScopeIds = new Set(scoped.map((entry) => entry.id));
    const cards = Object.entries(this.data.cards)
      .filter(([id, card]) => card.seen && inScopeIds.has(id))
      .map(([, card]) => card);
    const total = scoped.length;
    const learned = cards.filter((card) => card.interval >= LEARNED_INTERVAL_DAYS).length;
    const mature = cards.filter((card) => card.interval >= MATURE_INTERVAL_DAYS).length;
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

  /* ---- progress for the Stats view --------------------- */

  // Every date (YYYY-MM-DD) with any practice at all — words OR phrases.
  practiceDays() {
    const days = new Set();
    for (const [day, log] of Object.entries(this.data.log || {}))
      if (log.reviews > 0) days.add(day);
    for (const [day, log] of Object.entries(this.data.phraseLog || {}))
      if (log.reviews > 0) days.add(day);
    return [...days].sort();
  },

  // Practice consistency: a day-by-day window plus current / best streak
  // and lifetime days practised. Words and phrases both count.
  practiceSummary(windowDays = 35) {
    const today = todayStr();
    const active = new Set(this.practiceDays());

    let currentStreak = 0;
    for (let i = 0; i < 3650; i++) {
      const day = addDays(today, -i);
      if (active.has(day)) currentStreak++;
      else if (i > 0) break; // today isn't a miss until it's over
    }

    let bestStreak = 0, run = 0, prev = null;
    for (const day of [...active].sort()) {
      run = prev && daysBetween(prev, day) === 1 ? run + 1 : 1;
      if (run > bestStreak) bestStreak = run;
      prev = day;
    }

    const calendar = [];
    for (let i = windowDays - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      const wordReviews = (this.data.log[day] || {}).reviews || 0;
      const phraseReviews = (this.data.phraseLog[day] || {}).reviews || 0;
      calendar.push({
        day,
        wordReviews,
        phraseReviews,
        active: wordReviews + phraseReviews > 0,
      });
    }

    return {
      calendar,
      windowDays,
      activeInWindow: calendar.filter((d) => d.active).length,
      missedInWindow: calendar.filter((d) => !d.active).length,
      daysPractised: active.size,
      currentStreak,
      bestStreak,
      practisedToday: calendar[calendar.length - 1].active,
    };
  },

  // Per-level word completion, counting only words mastered for good
  // (interval ≥ 21 days, or marked "known"). Loaded levels only.
  wordLevelProgress() {
    return Object.keys(ACTIVE_LEVELS)
      .filter((level) => this.levelEnabled(level))
      .map((level) => {
        const words = VOCAB.filter(
          (entry) => entry.level === level && !this.isRemoved(entry.id)
        );
        let mastered = 0, started = 0;
        for (const entry of words) {
          const card = this.data.cards[entry.id];
          if (!card || !card.seen) continue;
          started++;
          if (card.known || (card.interval || 0) >= MATURE_INTERVAL_DAYS) mastered++;
        }
        return {
          level,
          label: ACTIVE_LEVELS[level].label,
          icon: ACTIVE_LEVELS[level].icon,
          total: words.length,
          started,
          mastered,
          remaining: words.length - mastered,
          pct: words.length ? Math.round((mastered / words.length) * 100) : 0,
        };
      })
      .filter((group) => group.total > 0);
  },

  // Per-level phrase completion, counting only mastered phrases (Leitner box 6).
  phraseLevelProgress() {
    return Object.keys(ACTIVE_LEVELS)
      .filter((level) => this.levelEnabled(level))
      .map((level) => {
        const phrases = PHRASES.filter((phrase) => phrase.level === level);
        let mastered = 0, started = 0;
        for (const phrase of phrases) {
          const status = this.phraseStatus(phrase.id);
          if (status === "new") continue;
          started++;
          if (status === "mastered") mastered++;
        }
        return {
          level,
          label: ACTIVE_LEVELS[level].label,
          icon: ACTIVE_LEVELS[level].icon,
          total: phrases.length,
          started,
          mastered,
          remaining: phrases.length - mastered,
          pct: phrases.length ? Math.round((mastered / phrases.length) * 100) : 0,
        };
      })
      .filter((group) => group.total > 0);
  },

  /* ---- phrase practice (Leitner) ----------------------- */
  phraseCard(id) {
    if (!this.data.phraseCards[id]) {
      this.data.phraseCards[id] = {
        id,
        box: 0,
        due: todayStr(),
        seen: false,
        correct: 0,
        attempts: 0,
        lastReviewed: null,
      };
    }
    return this.data.phraseCards[id];
  },

  // "new" | "learning" | "review" | "mastered" for the reference list badges
  phraseStatus(id) {
    const card = this.data.phraseCards[id];
    if (!card || !card.seen) return "new";
    if (card.box >= PHRASE_MASTERED_BOX) return "mastered";
    if (card.box >= 3) return "review";
    return "learning";
  },

  // Phrases within the levels the learner picked at the start.
  scopedPhrases() {
    return PHRASES.filter((phrase) => this.levelEnabled(phrase.level));
  },

  phraseStats() {
    let learning = 0, review = 0, mastered = 0, seen = 0;
    const scoped = this.scopedPhrases();
    for (const phrase of scoped) {
      const status = this.phraseStatus(phrase.id);
      if (status === "new") continue;
      seen++;
      if (status === "mastered") mastered++;
      else if (status === "review") review++;
      else learning++;
    }
    let reviews = 0, correct = 0;
    for (const day of Object.values(this.data.phraseLog || {})) {
      reviews += day.reviews;
      correct += day.correct;
    }
    return {
      total: scoped.length, seen, learning, review, mastered,
      reviews,
      accuracy: reviews ? Math.round((correct / reviews) * 100) : 0,
      streak: this.data.phraseStreak || 0,
      maxStreak: this.data.phraseMaxStreak || this.data.phraseStreak || 0,
      today: this.phraseLogToday(),
    };
  },

  // date -> { reviews, correct, newSeen } for phrase practice
  phraseLogToday() {
    const today = todayStr();
    if (!this.data.phraseLog[today])
      this.data.phraseLog[today] = { reviews: 0, correct: 0, newSeen: 0 };
    return this.data.phraseLog[today];
  },

  // Daily target of brand-new phrases (Settings, 1..100).
  newPhrasesPerDay() {
    const n = Math.round(this.settings().newPhrasesPerDay);
    return Number.isFinite(n) && n > 0
      ? Math.min(100, n)
      : DEFAULT_NEW_PHRASES_PER_DAY;
  },

  updatePhraseStreak() {
    const today = todayStr();
    if (this.data.phraseLastStudied === today) return;
    if (this.data.phraseLastStudied === addDays(today, -1)) this.data.phraseStreak++;
    else this.data.phraseStreak = 1;
    this.data.phraseLastStudied = today;
    this.data.phraseMaxStreak = Math.max(
      this.data.phraseMaxStreak || 0,
      this.data.phraseStreak
    );
  },

  // Today's phrase practice at a glance (mirrors dueSummary() for words).
  phraseDaySummary() {
    const today = todayStr();
    let due = 0, unseen = 0;
    let nextDue = null;
    for (const phrase of this.scopedPhrases()) {
      const card = this.data.phraseCards[phrase.id];
      if (!card || !card.seen) { unseen++; continue; }
      if (card.box >= PHRASE_MASTERED_BOX) continue;
      if (card.due <= today) due++;
      else if (!nextDue || card.due < nextDue) nextDue = card.due;
    }
    const newLeft = Math.max(
      0,
      this.newPhrasesPerDay() - this.phraseLogToday().newSeen
    );
    return {
      due,
      unseen,
      newLeft,
      nextDue,
      aheadAvailable: unseen > 0 || nextDue != null,
    };
  },

  // "Quick 5": extra practice once the daily target is met. Due phrases and
  // already-started ones only — never introduces a brand-new phrase.
  quickPhraseSession(size = QUICK_PHRASE_ROUND) {
    const today = todayStr();
    const due = [];
    const ahead = [];
    for (const phrase of this.scopedPhrases()) {
      const card = this.data.phraseCards[phrase.id];
      if (!card || !card.seen || card.box >= PHRASE_MASTERED_BOX) continue;
      (card.due <= today ? due : ahead).push(phrase);
    }
    const bySoonest = (a, b) =>
      this.data.phraseCards[a.id].due.localeCompare(this.data.phraseCards[b.id].due);
    due.sort(bySoonest);
    ahead.sort(bySoonest);
    let round = [...due, ...ahead];
    if (round.length < size) {
      // top up with any seen phrase (mastered included) so Quick 5 is never empty
      const extra = shuffle(
        this.scopedPhrases().filter((phrase) => {
          const card = this.data.phraseCards[phrase.id];
          return card && card.seen && !round.includes(phrase);
        })
      );
      round = round.concat(extra);
    }
    return round.slice(0, size);
  },

  // How many phrases one practice round holds (Settings, 1..50).
  phrasesPerRound() {
    const n = Math.round(this.settings().phrasesPerRound);
    return Number.isFinite(n) && n > 0 ? Math.min(50, n) : DEFAULT_PHRASES_PER_ROUND;
  },

  // Phrases for one practice round: those due for review first (most
  // overdue first), then unseen ones, capped at phrasesPerRound().
  // Only phrases inside the learner's chosen levels.
  buildPhraseSession(size = this.phrasesPerRound()) {
    const today = todayStr();
    const due = [];
    const fresh = [];
    for (const phrase of this.scopedPhrases()) {
      const card = this.data.phraseCards[phrase.id];
      if (!card || !card.seen) fresh.push(phrase);
      else if (card.due <= today) due.push(phrase);
    }
    due.sort((a, b) =>
      this.data.phraseCards[a.id].due.localeCompare(this.data.phraseCards[b.id].due)
    );
    shuffle(fresh);
    return [...due, ...fresh].slice(0, size);
  },

  // A random round ignoring the schedule (used when nothing is due).
  randomPhraseSession(size = this.phrasesPerRound()) {
    return shuffle(this.scopedPhrases()).slice(0, size);
  },

  // Grade one answered phrase. A hit moves it one box up (so it comes back
  // less often); a miss drops it about halfway down (so it comes back
  // sooner, but a slip on a well-known phrase isn't reset to zero).
  // Returns { card, dueInDays } so the UI can show when it's next due.
  gradePhrase(id, wasCorrect) {
    const card = this.phraseCard(id);
    const firstTime = !card.seen;
    card.seen = true;
    card.attempts++;
    if (wasCorrect) {
      card.correct++;
      card.box = Math.min(PHRASE_MASTERED_BOX, card.box + 1);
    } else {
      card.box = Math.max(1, Math.floor(card.box / 2));
    }
    const dueInDays = PHRASE_BOX_DAYS[card.box];
    card.due = addDays(todayStr(), dueInDays);
    card.lastReviewed = todayStr();

    // record it for the daily ring / streak / accuracy (doesn't touch the quiz flow)
    const log = this.phraseLogToday();
    log.reviews++;
    if (wasCorrect) log.correct++;
    if (firstTime) log.newSeen++;
    this.updatePhraseStreak();

    this.save();
    return { card, dueInDays };
  },
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export { Store, todayStr, shuffle };
