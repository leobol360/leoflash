import { useEffect, useMemo, useRef, useState } from "react";
import { VOCAB, THEMES } from "../data.js";
import { Store } from "../store.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import { fmtInterval } from "../format.js";
import {
  pickMode,
  choiceOptions,
  checkTyped,
  projectedDays,
} from "../session.js";
import { Sentence } from "../components/ui.jsx";

export default function Study({ queue, onExit, onKeepGoing }) {
  const store = useStore();
  const total = queue.length;
  const startedAt = useRef(Date.now());

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [stage, setStage] = useState("prompt"); // learn: prompt | revealed
  const [answered, setAnswered] = useState(false); // typed/choice done
  const [feedback, setFeedback] = useState(null); // { grade, almost }
  const [typed, setTyped] = useState("");

  const finished = idx >= total;
  const id = finished ? null : queue[idx];
  const v = useMemo(() => (id ? VOCAB.find((x) => x.id === id) : null), [id]);
  const mode = useMemo(() => (id ? pickMode(Store.data.cards[id]) : null), [id]);
  const options = useMemo(() => (v && mode === "choice" ? choiceOptions(v) : []), [id, mode]);

  // reset per-card state + audio
  useEffect(() => {
    if (!v) return;
    setStage("prompt");
    setAnswered(false);
    setFeedback(null);
    setTyped("");
    const s = Store.settings();
    if (mode === "learn" && s.autoSpeak) {
      const t = setTimeout(() => Speech.say(v.word), 250);
      return () => clearTimeout(t);
    }
    if (mode === "listen") {
      const t = setTimeout(() => Speech.say(v.word), 300);
      return () => clearTimeout(t);
    }
  }, [id, mode]);

  const advance = () => {
    setDone((d) => d + 1);
    setIdx((i) => i + 1);
  };

  const gradeLearn = (g) => {
    if (g === "never") {
      Store.markKnown(id);
      setCorrect((c) => c + 1);
    } else {
      Store.grade(id, g, false);
      if (g >= 2) setCorrect((c) => c + 1);
    }
    advance();
  };

  const submitAnswer = () => {
    const res = checkTyped(typed, v.word);
    if (!res) return;
    Store.grade(id, res.grade, true);
    if (res.grade >= 2) setCorrect((c) => c + 1);
    setFeedback(res);
    setAnswered(true);
    if (mode !== "choice") Speech.say(v.word);
  };

  const chooseOption = (opt) => {
    if (answered) return;
    const ok = opt.id === v.id;
    Store.grade(id, ok ? 2 : 0, true);
    if (ok) setCorrect((c) => c + 1);
    setFeedback({ grade: ok ? 2 : 0, almost: false, picked: opt.id });
    setAnswered(true);
  };

  const markKnownAndAdvance = () => {
    Store.markKnown(id);
    advance();
  };

  /* ---- keyboard ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (finished || !v) return;
      const inInput =
        document.activeElement && document.activeElement.tagName === "INPUT";
      if (e.key === " " && mode === "learn" && stage === "prompt" && !inInput) {
        e.preventDefault();
        setStage("revealed");
        return;
      }
      if (mode === "learn" && stage === "revealed" && ["1", "2", "3"].includes(e.key)) {
        e.preventDefault();
        gradeLearn(+e.key - 1);
        return;
      }
      if (mode === "learn" && stage === "revealed" && e.key === "4") {
        e.preventDefault();
        gradeLearn("never");
        return;
      }
      if (answered && e.key === "Enter" && mode !== "learn") {
        e.preventDefault();
        advance();
        return;
      }
      if (e.key.toLowerCase() === "s" && !inInput) Speech.say(v.word);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, mode, stage, answered, finished]);

  /* ---- finish screen ---- */
  if (finished) {
    const secs = Math.round((Date.now() - startedAt.current) / 1000);
    const acc = total ? Math.round((correct / total) * 100) : 0;
    const sum = store.dueSummary();
    return (
      <div className="study">
        <div className="done-card card">
          <div className="done-emoji">{acc >= 90 ? "🏆" : acc >= 70 ? "🎉" : "💪"}</div>
          <h1>Session complete</h1>
          <div className="done-stats">
            <div>
              <b>{total}</b>
              <span>cards</span>
            </div>
            <div>
              <b>{acc}%</b>
              <span>correct</span>
            </div>
            <div>
              <b>
                {Math.floor(secs / 60)}m {secs % 60}s
              </b>
              <span>time</span>
            </div>
          </div>
          <p className="muted">
            {store.data.streak} day streak · {sum.due} card
            {sum.due === 1 ? "" : "s"} still due today
          </p>
          <div className="done-actions">
            {(sum.due > 0 || sum.newLeft > 0) && (
              <button className="btn btn-primary" onClick={onKeepGoing}>
                Keep going
              </button>
            )}
            <button className="btn btn-ghost" onClick={onExit}>
              Back to dashboard
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
            v={v}
            card={card}
            stage={stage}
            onReveal={() => setStage("revealed")}
            onGrade={gradeLearn}
          />
        )}

        {(mode === "type" || mode === "gap" || mode === "listen") && (
          <TypedCard
            v={v}
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
            v={v}
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

/* ---------- flashcard (new word) ---------- */
function LearnCard({ v, card, stage, onReveal, onGrade }) {
  const revealed = stage === "revealed";
  return (
    <>
      <div className="mode-tag">New word · read, listen, then rate yourself</div>
      <div className={"flip" + (revealed ? " flipped" : "")} onClick={() => !revealed && onReveal()}>
        <div className="flip-inner">
          <div className="flip-face front">
            <div className="fc-word">{v.word}</div>
            <div className="fc-ipa">
              {v.ipa ? v.ipa + " · " : ""}
              <span className="muted">{v.pos}</span>
            </div>
            <button
              className="icon-btn big-speak"
              onClick={(e) => {
                e.stopPropagation();
                Speech.say(v.word);
              }}
            >
              🔊
            </button>
            <div className="fc-hint">Press Space to see the meaning</div>
          </div>
          <div className="flip-face back">
            <div className="fc-es">{v.es}</div>
            <div className="fc-def">{v.def}</div>
            <div className="fc-ex">
              “<Sentence text={v.ex} word={v.word} />”
            </div>
            <div className="theme-tag">
              {THEMES[v.theme].icon} {THEMES[v.theme].label}
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
                No<small>{fmtInterval(projectedDays(card, 0))}</small>
              </button>
              <button className="btn grade g1" onClick={() => onGrade(1)}>
                Almost<small>{fmtInterval(projectedDays(card, 1))}</small>
              </button>
              <button className="btn grade g2" onClick={() => onGrade(2)}>
                Yes<small>{fmtInterval(projectedDays(card, 2))}</small>
              </button>
              <button className="btn grade gN" onClick={() => onGrade("never")}>
                Never<small>never again</small>
              </button>
            </div>
            <div className="kbd-hint">Keys 1–4 · Never = you already know it</div>
          </>
        )}
      </div>
    </>
  );
}

/* ---------- typed answer (type / gap / listen) ---------- */
function TypedCard({ v, mode, typed, setTyped, answered, feedback, onSubmit, onAdvance, onNever, card }) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (!answered) inputRef.current?.focus();
  }, [answered, v.id]);

  const tag =
    mode === "type"
      ? "Type the English word"
      : mode === "gap"
      ? "Complete the sentence"
      : "Listen and write what you hear";

  return (
    <>
      <div className="mode-tag">{tag}</div>

      {mode === "listen" ? (
        <div className="listen-box">
          <button className="icon-btn huge-speak" onClick={() => Speech.say(v.word)}>
            🔊
          </button>
          <p className="muted">Tap to hear it again</p>
        </div>
      ) : mode === "gap" ? (
        <div className="prompt-box">
          <div className="gap-sentence">
            <Sentence text={v.ex} word={v.word} blank />
          </div>
          <div className="p-def muted">
            {v.es} — {v.def}
          </div>
        </div>
      ) : (
        <div className="prompt-box">
          <div className="p-es">{v.es}</div>
          <div className="p-def">{v.def}</div>
          <div className="p-pos muted">
            {v.pos}
            {v.word.includes(" ") ? " · two words" : ""}
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

      {feedback && <Feedback v={v} feedback={feedback} />}

      {answered && (
        <div className="controls">
          <button className="btn btn-primary wide" onClick={onAdvance}>
            Continue <kbd>Enter</kbd>
          </button>
          <div className="post-answer">
            <span className="muted small">
              Next review in {fmtInterval((card && card.interval) || 1)}
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
function ChoiceCard({ v, options, answered, feedback, onChoose, onAdvance, onNever, card }) {
  return (
    <>
      <div className="mode-tag">Choose the right word</div>
      <div className="prompt-box">
        <div className="p-es">{v.es}</div>
        <div className="p-def">{v.def}</div>
      </div>

      <div className="choice-grid">
        {options.map((o) => {
          let cls = "choice-btn";
          if (answered) {
            if (o.id === v.id) cls += " right";
            else if (feedback && feedback.picked === o.id) cls += " wrong";
          }
          return (
            <button
              key={o.id}
              className={cls}
              disabled={answered}
              onClick={() => onChoose(o)}
            >
              {o.word}
            </button>
          );
        })}
      </div>

      {feedback && <Feedback v={v} feedback={feedback} />}

      {answered && (
        <div className="controls">
          <button className="btn btn-primary wide" onClick={onAdvance}>
            Continue <kbd>Enter</kbd>
          </button>
          <div className="post-answer">
            <span className="muted small">
              Next review in {fmtInterval((card && card.interval) || 1)}
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

function Feedback({ v, feedback }) {
  const ok = feedback.grade > 0;
  const almost = !!feedback.almost;
  const cls = ok ? (almost ? "fb-almost" : "fb-ok") : "fb-bad";
  const head = ok ? (almost ? "Almost — spelling" : "Correct!") : "Not quite";
  return (
    <div className={"feedback " + cls}>
      <div className="fb-head">{head}</div>
      <div className="fb-word">
        <b>{v.word}</b>
        {v.ipa && <span className="ipa">{v.ipa}</span>}
        <button className="icon-btn" onClick={() => Speech.say(v.word)}>
          🔊
        </button>
      </div>
      <div className="fb-es">
        {v.es} · <span className="muted">{v.pos}</span>
      </div>
      <div className="fb-def">{v.def}</div>
      <div className="fb-ex">
        “<Sentence text={v.ex} word={v.word} />”
      </div>
    </div>
  );
}
