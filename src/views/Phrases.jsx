import { useEffect, useRef, useState } from "react";
import { getPhrase, similarity } from "../phrases.js";
import { Store } from "../store.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import { Ring, StatCard } from "../components/ui.jsx";
import { formatInterval, formatRelativeDate } from "../format.js";

function backIn(days) {
  if (days >= 28 && days <= 32) return "back in a month";
  const label = formatInterval(days);
  if (label === "today") return "back today";
  return `back in ${label}`;
}

const DECK_DONE_MSG =
  "You've got a total grip on this phrase deck — contact Leonardo so he can refresh your phrases deck.";

// The answer is graded automatically from how close it is to the expected
// English (0–100% by edit distance). Bands, highest first:
const GRADE_BANDS = [
  { min: 91, grade: "never", label: "I know it", fb: "fb-ok" },
  { min: 61, grade: 2, label: "Yes", fb: "fb-ok" },
  { min: 26, grade: 1, label: "Almost", fb: "fb-almost" },
  { min: 0, grade: 0, label: "No", fb: "fb-bad" },
];
const bandForMatch = (pct) => GRADE_BANDS.find((b) => pct >= b.min);

export default function Phrases() {
  const [session, setSession] = useState(null); // { key, queue } | null

  const start = () => {
    const queue = Store.buildPhraseQueue();
    if (queue.length === 0) {
      alert(
        Store.phraseDeckExhausted()
          ? DECK_DONE_MSG
          : "Nothing to practise right now — come back later, or raise your daily goal in Settings."
      );
      return;
    }
    setSession({ key: Date.now(), queue });
  };

  if (session) {
    return (
      <PhraseSession
        key={session.key}
        queue={session.queue}
        onExit={() => setSession(null)}
        onKeepGoing={start}
      />
    );
  }
  return <PhraseHome onStart={start} />;
}

/* ---------------- dashboard ---------------- */
function PhraseHome({ onStart }) {
  const store = useStore();
  const settings = store.settings();
  const stats = store.phraseStats();
  const summary = store.phraseDaySummary();
  const perDay = store.phrasesPerDay();

  const newWordsLeft = summary.newLeft > 0 && summary.unseen > 0;
  const workLeft = summary.due > 0 || newWordsLeft;
  const challengeDone = summary.newLeft === 0 && summary.due === 0;
  const deckDone = store.phraseDeckExhausted();

  let statusLine;
  if (workLeft) {
    const parts = [];
    if (summary.due > 0)
      parts.push(`${summary.due} phrase${summary.due === 1 ? "" : "s"} to review`);
    if (newWordsLeft)
      parts.push(`${summary.newLeft} new phrase${summary.newLeft === 1 ? "" : "s"} today`);
    statusLine = <>{parts.join(" · ")}.</>;
  } else if (challengeDone) {
    statusLine = (
      <>
        🎉 Day complete{settings.name ? `, ${settings.name}` : ""}! Every phrase
        review is cleared and you've hit today's goal of {perDay}.{" "}
        {stats.streak > 0 ? (
          <>Come back tomorrow to keep your {stats.streak}-day streak 🔥</>
        ) : (
          <>See you tomorrow 🌱</>
        )}
      </>
    );
  } else if (deckDone) {
    statusLine = <>🏆 {DECK_DONE_MSG}</>;
  } else {
    statusLine = (
      <>🌱 You've practised every phrase for your loaded levels — load another level, or come back tomorrow.</>
    );
  }

  const pctStarted = stats.total ? Math.round((stats.seen / stats.total) * 100) : 0;
  const pctMastered = stats.total ? Math.round((stats.mature / stats.total) * 100) : 0;

  return (
    <div className="page">
      <div className="hero card">
        <div className="hero-left">
          <p className="eyebrow">Phrase translation</p>
          <h1>
            {challengeDone
              ? `Nice work${settings.name ? `, ${settings.name}` : ""}!`
              : "Translate the phrase"}
          </h1>
          <p className="muted">{statusLine}</p>
          {workLeft && (
            <div className="hero-actions">
              <button className="btn btn-primary big" onClick={onStart}>
                Start practice
              </button>
            </div>
          )}
        </div>
        <Ring
          value={Math.min(perDay, stats.today.reviews)}
          max={perDay}
          label="Today's phrases"
          sub={`${stats.today.newSeen} new · ${
            stats.today.reviews - stats.today.newSeen
          } reviews`}
        />
      </div>

      {deckDone && workLeft && (
        <div className="feedback fb-ok" style={{ marginBottom: 14 }}>
          <div className="fb-head">Deck mastered 🏆</div>
          {DECK_DONE_MSG}
        </div>
      )}

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
        <StatCard label="Mastered" value={stats.mature} sub={`${pctMastered}% of all`} />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          sub={`${stats.reviews} answer${stats.reviews === 1 ? "" : "s"}`}
        />
      </div>

      <p className="muted small" style={{ marginTop: 14 }}>
        Short Spanish sentences built from your vocabulary — mostly words you're
        reviewing right now. Type the English; it's scored automatically on how
        close you got. It has its own schedule and never changes your word cards.
      </p>
    </div>
  );
}

/* ---------------- practice session ---------------- */
function PhraseSession({ queue, onExit, onKeepGoing }) {
  const store = useStore();
  const total = queue.length;
  const startedAt = useRef(Date.now());

  const [pos, setPos] = useState(0);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null); // { match, band, interval } once answered
  const inputRef = useRef(null);

  const finished = pos >= total;
  const phrase = finished ? null : getPhrase(queue[pos]);
  const checked = result != null;

  useEffect(() => {
    if (!finished && !checked) inputRef.current?.focus();
  }, [pos, checked, finished]);

  // grade the typed answer automatically from the similarity %
  const check = () => {
    if (!typed.trim() || checked) return;
    const match = similarity(typed, phrase.en);
    const band = bandForMatch(match);
    let interval;
    if (band.grade === "never") {
      interval = Store.parkPhraseMonthly(phrase.id).interval;
      setCorrect((n) => n + 1);
    } else {
      interval = Store.gradePhrase(phrase.id, band.grade, match === 100).interval;
      if (band.grade >= 2) setCorrect((n) => n + 1);
    }
    setResult({ match, band, interval });
    Speech.say(phrase.en);
  };

  const next = () => {
    setTyped("");
    setResult(null);
    setDone((n) => n + 1);
    setPos((n) => n + 1);
  };

  // once graded, Enter advances to the next phrase
  useEffect(() => {
    if (!checked) return;
    const onKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checked]);

  /* ---- finish ---- */
  if (finished) {
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const summary = store.phraseDaySummary();
    const settings = store.settings();
    const doneForToday = summary.due === 0 && summary.newLeft === 0;
    const more = summary.due > 0 || (summary.newLeft > 0 && summary.unseen > 0);

    return (
      <div className="study">
        <div className="done-card card">
          <div className="done-emoji">
            {doneForToday ? "🎉" : accuracy >= 80 ? "🏆" : accuracy >= 50 ? "💪" : "📚"}
          </div>
          <h1>
            {doneForToday
              ? `That's the phrase goal for today${settings.name ? `, ${settings.name}` : ""}!`
              : `${correct} / ${total}`}
          </h1>
          <div className="done-stats">
            <div><b>{total}</b><span>phrases</span></div>
            <div><b>{accuracy}%</b><span>got it (≥61%)</span></div>
            <div><b>{Math.floor(seconds / 60)}m {seconds % 60}s</b><span>time</span></div>
          </div>

          {doneForToday ? (
            <p className="muted">
              🎉 Today's goal of {store.phrasesPerDay()} met and every review
              cleared.
              {summary.nextDue ? ` Next review ${formatRelativeDate(summary.nextDue)}.` : ""}{" "}
              Come back tomorrow.
            </p>
          ) : more ? (
            <p className="muted">
              {[
                summary.due > 0 ? `${summary.due} still due` : null,
                summary.newLeft > 0 && summary.unseen > 0
                  ? `${summary.newLeft} new phrase${summary.newLeft === 1 ? "" : "s"} left today`
                  : null,
              ].filter(Boolean).join(" · ")}.
            </p>
          ) : store.phraseDeckExhausted() ? (
            <p className="muted">🏆 {DECK_DONE_MSG}</p>
          ) : (
            <p className="muted">
              You've practised every phrase for your loaded levels — load another,
              or come back tomorrow.
            </p>
          )}

          <div className="done-actions">
            {more && (
              <button className="btn btn-primary" onClick={onKeepGoing}>
                Keep going
              </button>
            )}
            <button className="btn btn-ghost" onClick={onExit}>
              Back to Cards
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="study">
      <div className="study-top">
        <button className="icon-btn" title="Quit" onClick={onExit}>✕</button>
        <div className="progress">
          <span style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <div className="count">{done}/{total}</div>
      </div>

      <div className="mode-tag">Write it in English</div>

      <div className="card practice-card">
        <div className="study-en">{phrase.es}</div>

        <form
          className="answer-form"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type the English sentence…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={checked}
          />
          {!checked && (
            <button className="btn btn-primary" type="submit">Check</button>
          )}
        </form>

        {checked && (
          <div className={"feedback " + result.band.fb}>
            <div className="fb-head">
              {result.band.label} — {result.match}% match
            </div>
            <div className="fb-es">
              You wrote: <b>{typed || "—"}</b>
            </div>
            <div className="fb-word">
              <b>{phrase.en}</b>
              <button className="icon-btn" onClick={() => Speech.say(phrase.en)}>🔊</button>
            </div>
            <div className="fb-es muted">{phrase.es}</div>
            <div className="fb-es muted">
              {backIn(result.interval).replace(/^back/, "Back")}.
            </div>
          </div>
        )}
      </div>

      {checked && (
        <div className="controls">
          <button className="btn btn-primary wide" onClick={next}>
            Continue <kbd>Enter</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
