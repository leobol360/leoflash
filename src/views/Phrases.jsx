import { useMemo, useRef, useState, useEffect } from "react";
import { PHRASES, PHRASE_CATEGORIES, splitOnGap, checkGap } from "../phrases.js";
import { LEVELS } from "../data.js";
import { Store, shuffle } from "../store.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import { Ring, StatCard } from "../components/ui.jsx";
import { formatRelativeDate } from "../format.js";

const CATEGORY = Object.fromEntries(PHRASE_CATEGORIES.map((c) => [c.key, c]));
const LEVEL_ORDER = ["a1", "a2", "b1", "b2"];

const STATUS_LABEL = {
  new: "new",
  learning: "learning",
  review: "review",
  mastered: "mastered",
};

// "back tomorrow" / "back in 4 days"
const dueLabel = (days) =>
  days <= 1 ? "back tomorrow" : `back in ${days} days`;

export default function Phrases() {
  const [session, setSession] = useState(null); // null = browsing the list

  const start = () =>
    setSession({ id: Date.now(), phrases: Store.buildPhraseSession() });
  const startRandom = () =>
    setSession({ id: Date.now(), phrases: Store.randomPhraseSession() });
  const startQuick = () =>
    setSession({ id: Date.now(), phrases: Store.quickPhraseSession() });

  if (session) {
    if (session.phrases.length === 0) {
      return (
        <AllCaughtUp onRandom={startRandom} onQuit={() => setSession(null)} />
      );
    }
    return (
      <Session
        key={session.id}
        phrases={session.phrases}
        onQuit={() => setSession(null)}
        onRestart={start}
      />
    );
  }
  return <Browse onPractice={start} onQuick={startQuick} />;
}

/* ---------------- daily practice dashboard ---------------- */
function PhraseHero({ onPractice, onQuick }) {
  const store = useStore();
  const perDay = store.newPhrasesPerDay();
  const stats = store.phraseStats();
  const summary = store.phraseDaySummary();

  const quotaDone = summary.newLeft === 0;
  const canPractice = summary.due > 0 || summary.unseen > 0;
  const somethingLeft = canPractice || summary.aheadAvailable;

  let action = null;
  if (!quotaDone && canPractice) {
    action = { label: "Practice", run: onPractice };
  } else if (quotaDone && somethingLeft) {
    action = { label: "Quick 5", run: onQuick };
  }

  let statusLine;
  if (!quotaDone && canPractice) {
    statusLine = (
      <>
        {summary.due > 0
          ? `${summary.due} phrase${summary.due === 1 ? "" : "s"} to review · `
          : ""}
        {summary.newLeft} new phrase{summary.newLeft === 1 ? "" : "s"} today.
      </>
    );
  } else if (quotaDone && somethingLeft) {
    statusLine = (
      <>
        🎉 Today's {perDay} new phrases — done! Nice work.
        <br />
        {summary.due > 0
          ? `🔁 ${summary.due} review${summary.due === 1 ? "" : "s"} still waiting. `
          : summary.nextDue
          ? `🔁 Next review: ${formatRelativeDate(summary.nextDue)}. `
          : "✨ All caught up. "}
        <b>Quick 5</b> keeps you going 💪
      </>
    );
  } else {
    statusLine = (
      <>🌱 You've practised every phrase in your loaded levels — come back tomorrow.</>
    );
  }

  const pctStarted = stats.total
    ? Math.round((stats.seen / stats.total) * 100)
    : 0;
  const pctMastered = stats.total
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0;

  return (
    <>
      <div className="hero card">
        <div className="hero-left">
          <p className="eyebrow">Daily practice</p>
          <h1>Phrases · Common phrases &amp; idioms</h1>
          <p className="muted">{statusLine}</p>
          {action && (
            <div className="hero-actions">
              <button className="btn btn-primary big" onClick={action.run}>
                {action.label}
              </button>
            </div>
          )}
        </div>
        <Ring
          value={stats.today.newSeen}
          max={perDay}
          label="New phrases today"
          sub={`${stats.today.reviews} review${
            stats.today.reviews === 1 ? "" : "s"
          } today`}
        />
      </div>

      <div className="stat-grid">
        <StatCard
          label="Phrase streak"
          value={`${stats.streak} 🔥`}
          sub={stats.streak > 0 ? "Keep it going" : "Practise to start"}
        />
        <StatCard
          label="Phrases started"
          value={`${stats.seen}/${stats.total}`}
          sub={`${pctStarted}% of your levels`}
        />
        <StatCard
          label="Mastered"
          value={stats.mastered}
          sub={`${pctMastered}% of all`}
        />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          sub={`${stats.reviews} answer${stats.reviews === 1 ? "" : "s"}`}
        />
      </div>
    </>
  );
}

function PhraseRow({ phrase, showLevel }) {
  const store = useStore();
  const status = store.phraseStatus(phrase.id);
  return (
    <div className="phrase-row">
      <div className="phrase-en">
        <span>{phrase.en}</span>
        <button
          type="button"
          className="wf-speak"
          title="Listen"
          onClick={() => Speech.say(phrase.en)}
        >
          🔊
        </button>
        {showLevel && (
          <span className="phrase-level">{phrase.level.toUpperCase()}</span>
        )}
        {status !== "new" && (
          <span className={"phrase-status ph-" + status}>
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>
      <div className="phrase-es">{phrase.es}</div>
    </div>
  );
}

/* ---------------- reference list ---------------- */
function Browse({ onPractice, onQuick }) {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [openLevels, setOpenLevels] = useState(() => new Set());
  const [openSections, setOpenSections] = useState(() => new Set());

  const version = store.getVersion();
  const scoped = useMemo(() => store.scopedPhrases(), [version]);

  const needle = query.trim().toLowerCase();
  const searching = needle.length > 0;

  const matches = useMemo(
    () =>
      searching
        ? scoped.filter(
            (phrase) =>
              phrase.en.toLowerCase().includes(needle) ||
              phrase.es.toLowerCase().includes(needle)
          )
        : [],
    [scoped, needle, searching]
  );

  // scoped phrases grouped: level -> [{ category, items }]
  const levelGroups = useMemo(
    () =>
      LEVEL_ORDER.filter((lv) => store.levelEnabled(lv))
        .map((lv) => {
          const inLevel = scoped.filter((phrase) => phrase.level === lv);
          const sections = PHRASE_CATEGORIES.map((cat) => ({
            ...cat,
            items: inLevel.filter((phrase) => phrase.category === cat.key),
          })).filter((section) => section.items.length);
          return { level: lv, count: inLevel.length, sections };
        })
        .filter((group) => group.count),
    [scoped, version]
  );

  const toggle = (setter) => (key) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const toggleLevel = toggle(setOpenLevels);
  const toggleSection = toggle(setOpenSections);

  return (
    <div className="page">
      {scoped.length > 0 && (
        <PhraseHero onPractice={onPractice} onQuick={onQuick} />
      )}

      {scoped.length === 0 && (
        <p className="muted">
          Turn on an A1–B2 level on the home screen to see its phrases.
        </p>
      )}

      {scoped.length > 0 && (
        <div className="browse-bar card">
          <input
            type="search"
            placeholder="Search a phrase or its meaning…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {searching ? (
        <div className="card">
          <h3 className="gr-group">
            {matches.length} result{matches.length === 1 ? "" : "s"}
          </h3>
          <div className="phrase-list">
            {matches.map((phrase) => (
              <PhraseRow key={phrase.id} phrase={phrase} showLevel />
            ))}
          </div>
          {matches.length === 0 && (
            <p className="muted">Nothing matches your search.</p>
          )}
        </div>
      ) : (
        levelGroups.map((group) => {
          const levelOpen = openLevels.has(group.level);
          return (
            <div
              className={"gr-card" + (levelOpen ? " open" : "")}
              key={group.level}
            >
              <button className="gr-head" onClick={() => toggleLevel(group.level)}>
                <span className="gr-title">
                  {LEVELS[group.level].label}
                  <span className="gr-es"> · {group.count} phrases</span>
                </span>
                <span className="gr-caret">{levelOpen ? "▲" : "▼"}</span>
              </button>

              {levelOpen && (
                <div className="gr-body phrase-sections">
                  {group.sections.map((section) => {
                    const key = group.level + "|" + section.key;
                    const sectionOpen = openSections.has(key);
                    return (
                      <div
                        className={"phrase-section" + (sectionOpen ? " open" : "")}
                        key={key}
                      >
                        <button
                          className="phrase-section-head"
                          onClick={() => toggleSection(key)}
                        >
                          <span>
                            {section.icon} {section.label}
                            <span className="gr-es"> ({section.items.length})</span>
                          </span>
                          <span className="gr-caret">
                            {sectionOpen ? "▲" : "▼"}
                          </span>
                        </button>
                        {sectionOpen && (
                          <div className="phrase-list">
                            {section.items.map((phrase) => (
                              <PhraseRow key={phrase.id} phrase={phrase} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function AllCaughtUp({ onRandom, onQuit }) {
  return (
    <div className="page">
      <div className="card done-card">
        <div className="done-emoji">🎉</div>
        <h1>All caught up</h1>
        <p className="muted">
          You've reviewed every phrase due today. Come back later, or practise a
          few at random.
        </p>
        <div className="done-actions">
          <button className="btn btn-primary" onClick={onRandom}>
            Practise {Store.phrasesPerRound()} at random
          </button>
          <button className="btn btn-ghost" onClick={onQuit}>
            Back to the list
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- study → quiz session ---------------- */
function Session({ phrases, onQuit, onRestart }) {
  const [phase, setPhase] = useState("study"); // "study" | "quiz"

  if (phase === "study") {
    return <Study phrases={phrases} onQuit={onQuit} onReady={() => setPhase("quiz")} />;
  }
  return <Quiz phrases={phrases} onQuit={onQuit} onRestart={onRestart} />;
}

function Study({ phrases, onQuit, onReady }) {
  const [index, setIndex] = useState(0);
  const phrase = phrases[index];
  const last = index === phrases.length - 1;

  useEffect(() => {
    if (Store.settings().autoSpeak) {
      const timer = setTimeout(() => Speech.say(phrase.en), 250);
      return () => clearTimeout(timer);
    }
  }, [index]);

  return (
    <div className="page">
      <div className="study-top">
        <button className="icon-btn" title="Quit" onClick={onQuit}>✕</button>
        <div className="progress">
          <span style={{ width: `${((index + 1) / phrases.length) * 100}%` }} />
        </div>
        <div className="count">{index + 1}/{phrases.length}</div>
      </div>

      <div className="mode-tag">Study this round's phrases</div>

      <div className="card practice-card">
        <div className="phrase-cat">
          {CATEGORY[phrase.category].icon} {CATEGORY[phrase.category].label}
        </div>
        <div className="study-en">
          {phrase.en}
          <button
            type="button"
            className="wf-speak"
            title="Listen"
            onClick={() => Speech.say(phrase.en)}
          >
            🔊
          </button>
        </div>
        <div className="study-es">{phrase.es}</div>
      </div>

      <div className="controls">
        <button
          className="btn btn-primary wide"
          onClick={() => (last ? onReady() : setIndex((n) => n + 1))}
        >
          {last ? "Start questions" : "Next"}
        </button>
      </div>
    </div>
  );
}

function Quiz({ phrases, onQuit, onRestart }) {
  const order = useMemo(() => shuffle([...phrases]), []);

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null); // "right" | "wrong" | null
  const [dueInDays, setDueInDays] = useState(0); // when the graded phrase comes back
  const inputRef = useRef(null);

  const finished = index >= order.length;
  const phrase = finished ? null : order[index];
  const parts = phrase ? splitOnGap(phrase.en, phrase.gap) : null;

  useEffect(() => {
    if (!finished && !result) inputRef.current?.focus();
  }, [index, result, finished]);

  if (finished) {
    const total = order.length;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="page">
        <div className="card done-card">
          <div className="done-emoji">{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
          <h1>{correct} / {total}</h1>
          <p className="muted">
            {pct}% correct. The ones you got come back later; the ones you
            missed, soon.
          </p>
          <div className="done-actions">
            <button className="btn btn-primary" onClick={onRestart}>
              Another round
            </button>
            <button className="btn btn-ghost" onClick={onQuit}>
              Back to the list
            </button>
          </div>
        </div>
      </div>
    );
  }

  const submit = () => {
    if (result) {
      setIndex((n) => n + 1);
      setTyped("");
      setResult(null);
      return;
    }
    if (!typed.trim()) return;
    const right = checkGap(typed, phrase);
    setResult(right ? "right" : "wrong");
    if (right) setCorrect((n) => n + 1);
    const { dueInDays: days } = Store.gradePhrase(phrase.id, right);
    setDueInDays(days);
    Speech.say(phrase.en);
  };

  return (
    <div className="page">
      <div className="study-top">
        <button className="icon-btn" title="Quit" onClick={onQuit}>✕</button>
        <div className="progress">
          <span style={{ width: `${(index / order.length) * 100}%` }} />
        </div>
        <div className="count">{index + 1}/{order.length}</div>
      </div>

      <div className="mode-tag">Fill the gap</div>

      <div className="card practice-card">
        <div className="phrase-cat">
          {CATEGORY[phrase.category].icon} {CATEGORY[phrase.category].label}
        </div>
        <div className="practice-es">{phrase.es}</div>

        <div className="practice-gap">
          <span>{parts.before}</span>
          {result ? (
            <b className={result === "right" ? "gap-right" : "gap-wrong"}>{parts.gap}</b>
          ) : (
            <span className="blank">_____</span>
          )}
          <span>{parts.after}</span>
        </div>

        <form
          className="answer-form"
          autoComplete="off"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Fill the gap in English…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={!!result}
          />
          <button className="btn btn-primary" type="submit">
            {result ? "Next" : "Check"}
          </button>
        </form>

        {result === "right" && (
          <div className="feedback fb-ok">
            <div className="fb-head">Correct!</div>
            <div className="fb-es">{phrase.en}</div>
            <div className="muted small">🔁 {dueLabel(dueInDays)}</div>
          </div>
        )}
        {result === "wrong" && (
          <div className="feedback fb-bad">
            <div className="fb-head">Not quite</div>
            <div className="fb-es">
              Correct answer: <b>{phrase.gap}</b>
            </div>
            <div className="muted small">{phrase.en}</div>
            <div className="muted small">🔁 {dueLabel(dueInDays)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
