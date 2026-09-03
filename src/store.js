/* ============================================================
   Storage + spaced repetition (SM-2 variant, day based)
   Framework-agnostic. React subscribes via useStore() / useSyncExternalStore.
   ============================================================ */

import { VOCAB, ACTIVE_LEVELS } from "./data.js";
import { PHRASES, PHRASE_TENSES, tensesForLevels } from "./phrases.js";

const STORAGE_KEY = "leoflash";
// older key names, read once and migrated into STORAGE_KEY so progress carries over
const LEGACY_STORAGE_KEYS = ["flashb1.v2"];

/* ---- spaced-repetition tuning ---------------------------- */
const MS_PER_DAY = 86_400_000;
const DEFAULT_EASE_FACTOR = 2.5;   // SM-2 starting ease
const MIN_EASE_FACTOR = 1.3;       // SM-2 never lets ease drop below this
const MAX_INTERVAL_DAYS = 365;     // cap so reviews never drift more than a year out
const KNOWN_REFRESH_DAYS = 30;     // "I know it" — kept, but refreshed once a month
const MATURE_INTERVAL_DAYS = 21;   // interval at which a card counts as fully learned
const LEARNED_INTERVAL_DAYS = 7;   // interval at which a card counts as "learned"
const MIN_STARTED_MASTERY = 0.08;  // a touched-but-weak card still shows some progress

// New-card brake — the thing that keeps a review backlog from spiralling.
// Once the reviews still waiting today pass these counts, throttle (then
// stop) new material for the day so you clear the debt instead of growing it.
const NEW_BRAKE_SOFT_DUE = 50;  // > this many reviews due  → at most NEW_BRAKE_CAP new
const NEW_BRAKE_HARD_DUE = 80;  // > this many reviews due  → no new at all
const NEW_BRAKE_CAP = 10;
// Phrases run their own, smaller schedule, so they brake sooner.
const PHRASE_BRAKE_SOFT_DUE = 30;
const PHRASE_BRAKE_HARD_DUE = 50;

// Apply the backlog brake to an already-computed new-item budget.
function braked(rawLeft, dueCount, softAt, hardAt) {
  if (dueCount > hardAt) return 0;
  return dueCount > softAt ? Math.min(rawLeft, NEW_BRAKE_CAP) : rawLeft;
}
// New words today: the goal minus what's done minus the reviews still
// waiting (reviews always take priority), then the backlog brake.
function newBudget(goal, gradedToday, dueCount, softAt, hardAt) {
  const left = Math.max(0, goal - gradedToday - dueCount);
  return braked(left, dueCount, softAt, hardAt);
}
function brakeLevel(dueCount, softAt, hardAt) {
  return dueCount > hardAt ? "hard" : dueCount > softAt ? "soft" : null;
}

// Phrase-translation practice runs its own SM-2 schedule (same tuning as
// the word cards), kept in data.phraseCards. It never touches data.cards.
const DEFAULT_PHRASES_PER_DAY = 10; // daily new-phrase target (Settings)
const MAX_PHRASES_PER_DAY = 50;
// A phrase answered 100 % verbatim this many times is "parked": mastered,
// back in a month. Until then a perfect answer is just a "Yes" (3 days). A
// real miss (< 60 %) resets the count. See gradePhrase.
const PHRASE_MONTHLY_DAYS = 30;
const PHRASE_PERFECT_TO_PARK = 5;

// One SM-2 step. Given { easeFactor, interval, reps, lapses } and a grade
// (0 again · 1 hard · 2 good · 3 easy), return the next values.
function sm2Step({ easeFactor, interval, reps, lapses }, grade) {
  const quality = [2, 3, 4, 5][grade];
  const nextEase = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  if (grade === 0) {
    return { easeFactor: nextEase, interval: 1, reps: 0, lapses: lapses + 1 };
  }
  let next;
  if (reps === 0) next = grade === 1 ? 2 : grade === 3 ? 4 : 3;
  else if (reps === 1) next = grade === 1 ? 3 : grade === 3 ? 8 : 6;
  else {
    const mult = grade === 1 ? 1.2 : grade === 3 ? nextEase * 1.3 : nextEase;
    next = Math.round(interval * mult);
  }
  return {
    easeFactor: nextEase,
    interval: Math.max(1, Math.min(next, MAX_INTERVAL_DAYS)),
    reps: reps + 1,
    lapses,
  };
}

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
  phrasesPerDay: 10,    // phrases per day: the daily target AND the Practice round size
  theme: "dark",        // colour scheme: "dark" | "light"
  accent: "violet",
  voice: "",            // preferred speechSynthesis voice name
  voiceAccent: "any",   // "us" | "gb" | "any" — which English accent to offer
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

  // settings.phrasesPerRound + settings.newPhrasesPerDay merged into one
  // settings.phrasesPerDay (keep whichever the learner had customised)
  if (
    data.settings.phrasesPerRound !== undefined ||
    data.settings.newPhrasesPerDay !== undefined
  ) {
    data.settings.phrasesPerDay =
      data.settings.phrasesPerRound ?? data.settings.newPhrasesPerDay;
  }
  delete data.settings.phrasesPerRound;
  delete data.settings.newPhrasesPerDay;

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
    // "known" used to retire a card for ~10 years; now it just refreshes
    // monthly. Pull any long-retired known card back onto the 30-day cycle.
    if (card.known && (card.interval || 0) > KNOWN_REFRESH_DAYS) {
      card.interval = KNOWN_REFRESH_DAYS;
      card.due = addDays(todayStr(), KNOWN_REFRESH_DAYS);
    }
  }

  data.maxStreak = Math.max(data.maxStreak || 0, data.streak || 0);
  data.phraseCards = data.phraseCards || {}; // id -> SM-2 progress for phrase-translation practice
  // the old idioms bank + its Leitner cards are gone — drop any leftover progress
  if (Object.values(data.phraseCards).some((c) => "box" in c)) data.phraseCards = {};
  for (const c of Object.values(data.phraseCards)) {
    if (c.perfect === undefined) c.perfect = 0;
    // "known" (retired for good) is now "monthly" (mastered, back every 30 days)
    if (c.known) {
      c.monthly = true;
      c.interval = PHRASE_MONTHLY_DAYS;
      c.due = addDays(todayStr(), PHRASE_MONTHLY_DAYS);
    }
    delete c.known;
  }
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

  // Wipe all study progress (cards, phrases, logs, streaks, stats) but keep
  // the learner's profile — name and preferences. The level choice is
  // cleared, so the level picker asks again.
  reset() {
    const keptSettings = this.data?.settings ? { ...this.data.settings } : {};
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    this.data = null;
    this.load(); // fresh, empty data with default settings
    Object.assign(this.data.settings, keptSettings, {
      enabledLevels: null,
      levelsChosen: false,
    });
    this.save();
    return this.data;
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
        known: false,     // "I know it" — mastered, but still refreshed monthly
        correctCount: 0,
        totalCount: 0,
      };
    }
    return this.data.cards[id];
  },

  // "I know it" button — the learner knows this word well. It stops coming
  // up in regular study but still returns once a month so it isn't forgotten.
  markKnown(id) {
    const card = this.card(id);
    const firstTime = !card.seen;
    card.seen = true;
    card.known = true;
    card.interval = KNOWN_REFRESH_DAYS;
    card.reps = Math.max(card.reps, 5);
    card.lastReviewed = todayStr();
    card.due = addDays(todayStr(), KNOWN_REFRESH_DAYS);
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
      if (card && card.seen) {
        // "known" cards are in too — but only on their monthly refresh date
        if (card.due <= today) due.push(entry.id);
      } else {
        fresh.push(entry.id);
      }
    }

    // due reviews come first, oldest (most overdue) first
    due.sort((a, b) => this.data.cards[a].due.localeCompare(this.data.cards[b].due));

    // the daily number is a goal for the whole day: reviews are counted
    // first, new words only fill the slots left under it
    const goal = settings.newPerDay;
    const gradedToday = this.logToday().reviews; // every card answered today
    const slotsForNew = newBudget(
      goal, gradedToday, due.length, NEW_BRAKE_SOFT_DUE, NEW_BRAKE_HARD_DUE
    );

    shuffle(fresh); // mix levels
    const newCards = fresh.slice(0, slotsForNew);

    const queue = [...due, ...newCards]; // reviews first, then new
    return { queue, dueCount: due.length, newCount: newCards.length };
  },

  dueSummary() {
    const settings = this.settings();
    const enabled = settings.enabledLevels;
    const inScope = (entry) =>
      (!enabled || enabled.includes(entry.level)) && !this.isRemoved(entry.id);
    const today = todayStr();
    let due = 0, learning = 0, mature = 0, unseen = 0, known = 0;
    let nextDue = null;                          // soonest upcoming review date
    for (const entry of VOCAB.filter(inScope)) {
      const card = this.data.cards[entry.id];
      if (!card || !card.seen) { unseen++; continue; }
      if (card.known) known++;
      if (card.known || card.interval >= MATURE_INTERVAL_DAYS) mature++;
      else learning++;
      if (card.due <= today) due++;
      else if (!nextDue || card.due < nextDue) nextDue = card.due;
    }
    const goal = settings.newPerDay;
    const gradedToday = this.logToday().reviews;
    const newLeft = newBudget(
      goal, gradedToday, due, NEW_BRAKE_SOFT_DUE, NEW_BRAKE_HARD_DUE
    );
    // review pressure signals for the UI
    const reviewsFillGoal = due > 0 && gradedToday + due >= goal;
    const newBrake = brakeLevel(due, NEW_BRAKE_SOFT_DUE, NEW_BRAKE_HARD_DUE);
    return {
      due, learning, mature, unseen, known, newLeft, nextDue,
      goal, reviewsFillGoal, newBrake,
    };
  },

  /* ---- grading (SM-2 variant) --------------------------- */
  // grade: 0 = again, 1 = hard, 2 = good, 3 = easy
  grade(id, grade, wasTyped) {
    const card = this.card(id);
    const firstTime = !card.seen;
    card.seen = true;
    card.totalCount++;
    if (grade >= 2) card.correctCount++;

    Object.assign(card, sm2Step(card, grade));
    if (card.known) {
      // a "known" card on its monthly check: a miss drops it back into normal
      // study, anything else keeps it on the 30-day refresh cycle.
      if (grade === 0) card.known = false;
      else card.interval = KNOWN_REFRESH_DAYS;
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

  // Per-level phrase completion, counting only phrases mastered for good
  // (SM-2 interval >= 21 days). Loaded levels only, and only phrases in a
  // tense the level teaches (matching what practice actually shows).
  phraseLevelProgress() {
    const tenses = this.allowedPhraseTenses();
    return Object.keys(ACTIVE_LEVELS)
      .filter((level) => this.levelEnabled(level))
      .map((level) => {
        const phrases = PHRASES.filter(
          (phrase) =>
            phrase.level === level &&
            tenses.has(phrase.tense) &&
            !this.isRemoved(phrase.cardId)
        );
        let mastered = 0, started = 0;
        for (const phrase of phrases) {
          const status = this.phraseStatus(phrase.id);
          if (status === "new") continue;
          started++;
          if (status === "mature") mastered++;
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

  // Per-tense mastery across the phrases in the learner's levels:
  // [{ key, label, total, seen, mastered }], skipping tenses with no phrases.
  phraseTenseProgress() {
    const acc = new Map(
      PHRASE_TENSES.map((t) => [t.key, { ...t, total: 0, seen: 0, mastered: 0 }])
    );
    for (const phrase of this.scopedPhrases()) {
      const row = acc.get(phrase.tense) || acc.get("present");
      row.total++;
      const status = this.phraseStatus(phrase.id);
      if (status === "new") continue;
      row.seen++;
      if (status === "mature") row.mastered++;
    }
    return [...acc.values()].filter((row) => row.total > 0);
  },

  /* ---- phrase-translation practice (its own SM-2 schedule) ---- */

  phraseCard(id) {
    if (!this.data.phraseCards[id]) {
      this.data.phraseCards[id] = {
        id,
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        reps: 0,
        lapses: 0,
        due: todayStr(),
        lastReviewed: null,
        seen: false,
        monthly: false, // parked: mastered, comes back every ~30 days
        perfect: 0,     // times typed exactly right (>4 → parked)
        correctCount: 0,
        totalCount: 0,
      };
    }
    return this.data.phraseCards[id];
  },

  // "new" | "learning" | "known" | "mature" — same scale as the word cards
  phraseStatus(id) {
    const card = this.data.phraseCards[id];
    if (!card || !card.seen) return "new";
    if (card.monthly || (card.interval || 0) >= MATURE_INTERVAL_DAYS) return "mature";
    if ((card.interval || 0) >= LEARNED_INTERVAL_DAYS) return "known";
    return "learning";
  },

  // Grammatical tenses the learner's chosen levels actually teach.
  allowedPhraseTenses() {
    return tensesForLevels(this.enabledLevels());
  },

  // The phrase deck for this learner: the word is in a chosen level and not
  // curated out of the deck, AND the sentence is written in a tense those
  // levels teach (so an a1 learner never gets a conditional sentence).
  scopedPhrases() {
    const tenses = this.allowedPhraseTenses();
    return PHRASES.filter(
      (phrase) =>
        this.levelEnabled(phrase.level) &&
        !this.isRemoved(phrase.cardId) &&
        tenses.has(phrase.tense)
    );
  },

  // Daily new-phrase target (Settings, 1..50).
  phrasesPerDay() {
    const n = Math.round(this.settings().phrasesPerDay);
    return Number.isFinite(n) && n > 0
      ? Math.min(MAX_PHRASES_PER_DAY, n)
      : DEFAULT_PHRASES_PER_DAY;
  },

  // date -> { reviews, correct, newSeen } for phrase practice
  phraseLogToday() {
    const today = todayStr();
    if (!this.data.phraseLog[today])
      this.data.phraseLog[today] = { reviews: 0, correct: 0, newSeen: 0 };
    return this.data.phraseLog[today];
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

  phraseStats() {
    let learning = 0, known = 0, mature = 0, seen = 0;
    const scoped = this.scopedPhrases();
    for (const phrase of scoped) {
      const status = this.phraseStatus(phrase.id);
      if (status === "new") continue;
      seen++;
      if (status === "mature") mature++;
      else if (status === "known") known++;
      else learning++;
    }
    let reviews = 0, correct = 0;
    for (const day of Object.values(this.data.phraseLog || {})) {
      reviews += day.reviews;
      correct += day.correct;
    }
    return {
      total: scoped.length, seen, learning, known, mature,
      reviews,
      accuracy: reviews ? Math.round((correct / reviews) * 100) : 0,
      streak: this.data.phraseStreak || 0,
      maxStreak: this.data.phraseMaxStreak || this.data.phraseStreak || 0,
      today: this.phraseLogToday(),
    };
  },

  // Today's phrase practice at a glance (mirrors dueSummary() for words).
  phraseDaySummary() {
    const today = todayStr();
    let due = 0, unseen = 0;
    let nextDue = null;
    for (const phrase of this.scopedPhrases()) {
      const card = this.data.phraseCards[phrase.id];
      if (!card || !card.seen) { unseen++; continue; }
      // parked phrases still come back — every ~30 days — so they count here too
      if (card.due <= today) due++;
      else if (!nextDue || card.due < nextDue) nextDue = card.due;
    }
    const rawNewLeft = Math.max(
      0,
      this.phrasesPerDay() - this.phraseLogToday().newSeen
    );
    const newLeft = braked(rawNewLeft, due, PHRASE_BRAKE_SOFT_DUE, PHRASE_BRAKE_HARD_DUE);
    const newBrake = brakeLevel(due, PHRASE_BRAKE_SOFT_DUE, PHRASE_BRAKE_HARD_DUE);
    return { due, unseen, newLeft, nextDue, newBrake };
  },

  // A phrase-practice session: every phrase card that's due, then new phrase
  // cards up to the daily budget. Every phrase here is in a tense the chosen
  // levels teach (scopedPhrases handles that). New phrases are ordered by the
  // state of the matching WORD card — words being reviewed today first, then
  // words in the rotation, then words marked "known", and finally, only as a
  // fallback, words not studied yet (random within the chosen levels), so the
  // session is never empty. Picked phrases are interleaved by tense. Reading
  // the word cards here never changes them.
  buildPhraseQueue() {
    const today = todayStr();
    const due = [];
    const fresh = []; // [phraseId, priority, tense]  (lower priority = sooner)

    for (const phrase of this.scopedPhrases()) {
      const pcard = this.data.phraseCards[phrase.id];
      if (pcard && pcard.seen) {
        // every started phrase (parked ones included) is a review once due
        if (pcard.due <= today) due.push(phrase.id);
        continue;
      }
      const wcard = this.data.cards[phrase.cardId];
      let priority;
      if (wcard && wcard.seen && !wcard.known && wcard.due <= today) priority = 0;
      else if (wcard && wcard.seen && !wcard.known) priority = 1;
      else if (wcard && wcard.seen) priority = 2; // word marked "known"
      else priority = 3; // word not studied yet — random fallback from the levels
      fresh.push([phrase.id, priority, phrase.tense || "present"]);
    }

    due.sort((a, b) =>
      this.data.phraseCards[a].due.localeCompare(this.data.phraseCards[b].due)
    );

    // backlog brake: throttle / stop new phrases when reviews pile up
    const newLeft = braked(
      Math.max(0, this.phrasesPerDay() - this.phraseLogToday().newSeen),
      due.length, PHRASE_BRAKE_SOFT_DUE, PHRASE_BRAKE_HARD_DUE
    );
    shuffle(fresh);
    fresh.sort((a, b) => a[1] - b[1]); // priority first, shuffled within a priority
    const picked = fresh.slice(0, newLeft);

    // round-robin the day's new phrases across their tenses
    const buckets = new Map();
    for (const [id, , tense] of picked) {
      if (!buckets.has(tense)) buckets.set(tense, []);
      buckets.get(tense).push(id);
    }
    const lists = [...buckets.values()];
    const newCards = [];
    for (let i = 0; newCards.length < picked.length; i++) {
      const list = lists[i % lists.length];
      if (list.length) newCards.push(list.shift());
    }

    return [...due, ...newCards];
  },

  // Grade an answered phrase straight from how close the typed English was
  // to the expected sentence (0–100 %, punctuation/case/spacing ignored):
  //   100 %  → counts a perfect answer; back in 3 days ("Yes") until you've
  //            hit 5 of them, then it's parked — mastered, back in a month
  //   90–99  → back in 3 days
  //   60–89  → back in 2 days
  //   0–59   → back tomorrow, and the perfect count resets
  // Fixed steps, no SM-2 progression. Never touches data.cards.
  // Returns { card, interval, perfect, parked }.
  gradePhrase(id, match) {
    const card = this.phraseCard(id);
    const firstTime = !card.seen;
    const pct = Math.max(0, Math.min(100, Math.round(match || 0)));
    const got = pct >= 60;

    if (pct >= 100) card.perfect = (card.perfect || 0) + 1;
    else if (!got) card.perfect = 0;

    const parked = pct >= 100 && (card.perfect || 0) >= PHRASE_PERFECT_TO_PARK;
    let interval;
    if (parked) interval = PHRASE_MONTHLY_DAYS;
    else if (pct >= 90) interval = 3;
    else if (pct >= 60) interval = 2;
    else interval = 1;

    card.seen = true;
    card.monthly = parked;
    card.interval = interval;
    card.totalCount++;
    if (got) card.correctCount++;
    if (!got) card.lapses = (card.lapses || 0) + 1;
    card.lastReviewed = todayStr();
    card.due = addDays(todayStr(), interval);

    const log = this.phraseLogToday();
    log.reviews++;
    if (got) log.correct++;
    if (firstTime) log.newSeen++;
    this.updatePhraseStreak();

    this.save();
    return { card, interval, perfect: card.perfect || 0, parked };
  },

  // True once ALL levels are loaded and their whole phrase deck has been
  // introduced and essentially mastered (≥80% parked or mature). Only then
  // does the Phrases screen nudge the learner to ask Leonardo for a fresh
  // deck — before that, adding a level still unlocks more.
  phraseDeckExhausted() {
    if (this.settings().enabledLevels) return false; // a level is still off
    const s = this.phraseStats();
    if (!s.total) return false;
    return s.seen >= s.total && s.mature >= Math.ceil(s.total * 0.8);
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
