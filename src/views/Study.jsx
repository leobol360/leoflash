import { useEffect, useMemo, useRef, useState } from "react";
import { VOCAB, LEVELS } from "../data.js";
import { Store } from "../store.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import { formatInterval, formatRelativeDate } from "../format.js";
import {
  pickMode,
  choiceOptions,
  checkTyped,
  projectedDays,
} from "../session.js";
import { Sentence, Example, Glossable } from "../components/ui.jsx";
import WordForms from "../components/WordForms.jsx";

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 300, 365];

// keyboard shortcut -> grade on a revealed new-word card
const NEW_WORD_GRADE_KEYS = { 1: 0, 2: 1, 3: 2, 4: "never" };

const AUTO_SPEAK_DELAY_MS = 250;
const LISTEN_MODE_SPEAK_DELAY_MS = 300;

export default function Study({ queue, onExit, onKeepGoing }) {
  const store = useStore();
  const total = queue.length;
  const startedAt = useRef(Date.now());

  const [position, setPosition] = useState(0);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [stage, setStage] = useState("prompt"); // learn: prompt | revealed
  const [answered, setAnswered] = useState(false); // typed/choice done
  const [feedback, setFeedback] = useState(null); // { grade, almost }
  const [typed, setTyped] = useState("");

  const finished = position >= total;
  const id = finished ? null : queue[position];
  const entry = useMemo(() => (id ? VOCAB.find((word) => word.id === id) : null), [id]);
  const mode = useMemo(() => (id ? pickMode(Store.data.cards[id]) : null), [id]);
  const options = useMemo(() => (entry && mode === "choice" ? choiceOptions(entry) : []), [id, mode]);

  // reset per-card state + audio
  useEffect(() => {
    if (!entry) return;
    setStage("prompt");
    setAnswered(false);
    setFeedback(null);
    setTyped("");
    const settings = Store.settings();
    if (mode === "learn" && settings.autoSpeak) {
      const timer = setTimeout(() => Speech.say(entry.word), AUTO_SPEAK_DELAY_MS);
      return () => clearTimeout(timer);
    }
    if (mode === "listen") {
      const timer = setTimeout(() => Speech.say(entry.word), LISTEN_MODE_SPEAK_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [id, mode]);

  const advance = () => {
    setDone((n) => n + 1);
    setPosition((n) => n + 1);
  };

  const gradeNewWord = (grade) => {
    if (grade === "never") {
      Store.markKnown(id);
      setCorrect((n) => n + 1);
    } else {
      Store.grade(id, grade, false);
      if (grade >= 2) setCorrect((n) => n + 1);
    }
    advance();
  };

  const submitAnswer = () => {
    const result = checkTyped(typed, entry.word);
    if (!result) return;
    Store.grade(id, result.grade, true);
    if (result.grade >= 2) setCorrect((n) => n + 1);
    setFeedback(result);
    setAnswered(true);
    if (mode !== "choice") Speech.say(entry.word);
  };

  const chooseOption = (option) => {
    if (answered) return;
    const isCorrect = option.id === entry.id;
    Store.grade(id, isCorrect ? 2 : 0, true);
    if (isCorrect) setCorrect((n) => n + 1);
    setFeedback({ grade: isCorrect ? 2 : 0, almost: false, picked: option.id });
    setAnswered(true);
  };

  const markKnownAndAdvance = () => {
    Store.markKnown(id);
    advance();
  };

  /* ---- keyboard ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (finished || !entry) return;
      const inInput =
        document.activeElement && document.activeElement.tagName === "INPUT";
      if (e.key === " " && mode === "learn" && stage === "prompt" && !inInput) {
        e.preventDefault();
        setStage("revealed");
        return;
      }
      if (
        mode === "learn" &&
        stage === "revealed" &&
        Object.hasOwn(NEW_WORD_GRADE_KEYS, e.key)
      ) {
        e.preventDefault();
        gradeNewWord(NEW_WORD_GRADE_KEYS[e.key]);
        return;
      }
      if (answered && e.key === "Enter" && mode !== "learn") {
        e.preventDefault();
        advance();
        return;
      }
      if (e.key.toLowerCase() === "s" && !inInput) Speech.say(entry.word);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, mode, stage, answered, finished]);

  /* ---- finish screen ---- */
  if (finished) {
    const elapsedSeconds = Math.round((Date.now() - startedAt.current) / 1000);
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const summary = store.dueSummary();
    const name = store.settings().name;
    const streak = store.data.streak;
    const isBestStreak = streak >= 3 && streak === (store.data.maxStreak || 0);
    const milestone = STREAK_MILESTONES.includes(streak);
    const doneForToday = summary.due === 0 && summary.newLeft === 0;

    const emoji = milestone ? "🏅" : doneForToday ? "🎉" : accuracy >= 90 ? "🏆" : accuracy >= 70 ? "🎉" : "💪";
    const heading = milestone
      ? `${streak} days in a row!`
      : doneForToday
      ? `That's everything for today${name ? `, ${name}` : ""}!`
      : "Session complete";

    return (
      <div className="study">
        <div className="done-card card">
          <div className="done-emoji">{emoji}</div>
          <h1>{heading}</h1>
          <div className="done-stats">
            <div><b>{total}</b><span>cards</span></div>
            <div><b>{accuracy}%</b><span>correct</span></div>
            <div><b>{Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</b><span>time</span></div>
          </div>

          <p className="done-streak">
            🔥 {streak}-day streak
            {isBestStreak && <span className="badge-best"> new best!</span>}
          </p>

          {doneForToday ? (
            <p className="muted">
              You've cleared the queue.
              {summary.nextDue ? ` Next review ${formatRelativeDate(summary.nextDue)}.` : ""}
              {" "}Come back tomorrow to keep the streak going.
            </p>
          ) : (
            <p className="muted">
              {summary.due} card{summary.due === 1 ? "" : "s"} still due
              {summary.newLeft > 0 ? ` · ${summary.newLeft} new word${summary.newLeft === 1 ? "" : "s"} left today` : ""}.
            </p>
          )}

          <div className="done-actions">
            {(summary.due > 0 || summary.newLeft > 0) && (
              <button className="btn btn-primary" onClick={() => onKeepGoing({})}>
                Keep going
              </button>
            )}
            {doneForToday && summary.aheadAvailable && (
              <button className="btn btn-primary" onClick={() => onKeepGoing({ ahead: true })}>
                Study ahead
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

  const card = Store.data.cards[id];

  return (
    <div className="study">
      <div className="study-top">
        <button className="icon-btn" title="End session" onClick={onExit}>
          ✕
        </button>
        <div className="progress">
          <span style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <div className="count">
          {done}/{total}
        </div>
      </div>

      <div className="stage">
        {mode === "learn" && (
          <LearnCard
            entry={entry}
            card={card}
            stage={stage}
            onReveal={() => setStage("revealed")}
            onGrade={gradeNewWord}
          />
        )}

        {(mode === "type" || mode === "gap" || mode === "listen") && (
          <TypedCard
            entry={entry}
            mode={mode}
            typed={typed}
            setTyped={setTyped}
            answered={answered}
            feedback={feedback}
            onSubmit={submitAnswer}
            onAdvance={advance}
            onNever={markKnownAndAdvance}
            card={card}
          />
        )}

        {mode === "choice" && (
          <ChoiceCard
            entry={entry}
            options={options}
            answered={answered}
            feedback={feedback}
            onChoose={chooseOption}
            onAdvance={advance}
            onNever={markKnownAndAdvance}
            card={card}
          />
        )}
      </div>
    </div>
  );
}

// Small caption under a grade button: when the card will come back.
function backIn(days) {
  const label = formatInterval(days);
  if (label === "today") return "back today";
  if (label === "removed") return "removed";
  return `back in ${label}`;
}

/* ---------- flashcard (new word) ---------- */
function LearnCard({ entry, card, stage, onReveal, onGrade }) {
  const revealed = stage === "revealed";
  return (
    <>
      <div className="mode-tag">New word · read, listen, then rate yourself</div>
      <div className={"flip" + (revealed ? " flipped" : "")} onClick={() => !revealed && onReveal()}>
        <div className="flip-inner">
          <div className="flip-face front">
            <div className="fc-word">{entry.word}</div>
            <div className="fc-ipa">
              {entry.ipa ? entry.ipa + " · " : ""}
              <span className="muted">{entry.pos}</span>
            </div>
            <button
              className="icon-btn big-speak"
              onClick={(e) => {
                e.stopPropagation();
                Speech.say(entry.word);
              }}
            >
              🔊
            </button>
            <div className="fc-hint">Press Space to see the meaning</div>
          </div>
          <div className="flip-face back">
            <div className="fc-es">{entry.es}</div>
            <div className="fc-def"><Glossable text={entry.def} /></div>
            <div className="fc-ex">
              <Example text={entry.ex} word={entry.word} onSpeak={(t) => Speech.say(t)} />
            </div>
            <WordForms word={entry.word} pos={entry.pos} onSpeak={(t) => Speech.say(t)} />
            <div className="theme-tag">
              {LEVELS[entry.level].icon} {LEVELS[entry.level].label}
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        {!revealed ? (
          <button className="btn btn-primary wide" onClick={onReveal}>
            Show answer <kbd>Space</kbd>
          </button>
        ) : (
          <>
            <div className="ask-label">Did you know it?</div>
            <div className="grade-row four">
              <button className="btn grade g0" onClick={() => onGrade(0)}>
                No<small>{backIn(projectedDays(card, 0))}</small>
              </button>
              <button className="btn grade g1" onClick={() => onGrade(1)}>
                Almost<small>{backIn(projectedDays(card, 1))}</small>
              </button>
              <button className="btn grade g2" onClick={() => onGrade(2)}>
                Yes<small>{backIn(projectedDays(card, 2))}</small>
              </button>
              <button className="btn grade gN" onClick={() => onGrade("never")}>
                Never<small>never again</small>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ---------- typed answer (type / gap / listen) ---------- */
function TypedCard({ entry, mode, typed, setTyped, answered, feedback, onSubmit, onAdvance, onNever, card }) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (!answered) inputRef.current?.focus();
  }, [answered, entry.id]);

  const promptLabel =
    mode === "type"
      ? "Type the English word"
      : mode === "gap"
      ? "Complete the sentence"
      : "Listen and write what you hear";

  return (
    <>
      <div className="mode-tag">{promptLabel}</div>

      {mode === "listen" ? (
        <div className="listen-box">
          <button className="icon-btn huge-speak" onClick={() => Speech.say(entry.word)}>
            🔊
          </button>
          <p className="muted">Tap to hear it again</p>
        </div>
      ) : mode === "gap" ? (
        <div className="prompt-box">
          <div className="gap-sentence">
            <Sentence text={entry.ex} word={entry.word} blank />
          </div>
          <div className="p-def muted">
            {entry.es} — {entry.def}
          </div>
        </div>
      ) : (
        <div className="prompt-box">
          <div className="p-es">{entry.es}</div>
          <div className="p-def">{entry.def}</div>
          <div className="p-pos muted">
            {entry.pos}
            {entry.word.includes(" ") ? " · two words" : ""}
          </div>
        </div>
      )}

      <form
        className="answer-form"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          answered ? onAdvance() : onSubmit();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={mode === "type" ? "Write it in English…" : mode === "gap" ? "The missing word…" : "Type the word…"}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          disabled={answered}
        />
        <button className="btn btn-primary" type="submit">
          {answered ? "Continue" : "Check"}
        </button>
      </form>

      {feedback && <Feedback entry={entry} feedback={feedback} />}

      {answered && (
        <div className="controls">
          <button className="btn btn-primary wide" onClick={onAdvance}>
            Continue <kbd>Enter</kbd>
          </button>
          <div className="post-answer">
            <span className="muted small">
              Next review in {formatInterval((card && card.interval) || 1)}
            </span>
            <button className="btn btn-ghost tiny-btn" onClick={onNever}>
              I already know this — never repeat
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- multiple choice ---------- */
function ChoiceCard({ entry, options, answered, feedback, onChoose, onAdvance, onNever, card }) {
  return (
    <>
      <div className="mode-tag">Choose the right word</div>
      <div className="prompt-box">
        <div className="p-es">{entry.es}</div>
        <div className="p-def">{entry.def}</div>
      </div>

      <div className="choice-grid">
        {options.map((option) => {
          let className = "choice-btn";
          if (answered) {
            if (option.id === entry.id) className += " right";
            else if (feedback && feedback.picked === option.id) className += " wrong";
          }
          return (
            <button
              key={option.id}
              className={className}
              disabled={answered}
              onClick={() => onChoose(option)}
            >
              {option.word}
            </button>
          );
        })}
      </div>

      {feedback && <Feedback entry={entry} feedback={feedback} />}

      {answered && (
        <div className="controls">
          <button className="btn btn-primary wide" onClick={onAdvance}>
            Continue <kbd>Enter</kbd>
          </button>
          <div className="post-answer">
            <span className="muted small">
              Next review in {formatInterval((card && card.interval) || 1)}
            </span>
            <button className="btn btn-ghost tiny-btn" onClick={onNever}>
              I already know this — never repeat
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Feedback({ entry, feedback }) {
  const isCorrect = feedback.grade > 0;
  const almost = !!feedback.almost;
  const className = isCorrect ? (almost ? "fb-almost" : "fb-ok") : "fb-bad";
  const heading = isCorrect ? (almost ? "Almost — spelling" : "Correct!") : "Not quite";
  return (
    <div className={"feedback " + className}>
      <div className="fb-head">{heading}</div>
      <div className="fb-word">
        <b>{entry.word}</b>
        {entry.ipa && <span className="ipa">{entry.ipa}</span>}
        <button className="icon-btn" onClick={() => Speech.say(entry.word)}>
          🔊
        </button>
      </div>
      <div className="fb-es">
        {entry.es} · <span className="muted">{entry.pos}</span>
      </div>
      <div className="fb-def"><Glossable text={entry.def} /></div>
      <div className="fb-ex">
        <Example text={entry.ex} word={entry.word} onSpeak={(t) => Speech.say(t)} />
      </div>
      <WordForms word={entry.word} pos={entry.pos} onSpeak={(t) => Speech.say(t)} />
    </div>
  );
}
