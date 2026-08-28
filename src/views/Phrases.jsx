import { useMemo, useRef, useState, useEffect } from "react";
import { PHRASES, PHRASE_CATEGORIES, splitOnGap, checkGap } from "../phrases.js";
import { Store, shuffle } from "../store.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";

const CATEGORY = Object.fromEntries(PHRASE_CATEGORIES.map((c) => [c.key, c]));

const STATUS_LABEL = {
  new: "nueva",
  learning: "aprendiendo",
  review: "en repaso",
  mastered: "dominada",
};

export default function Phrases() {
  const [session, setSession] = useState(null); // null = browsing the list

  const start = () =>
    setSession({ id: Date.now(), phrases: Store.buildPhraseSession() });
  const startRandom = () =>
    setSession({ id: Date.now(), phrases: Store.randomPhraseSession() });

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
  return <Browse onPractice={start} />;
}

/* ---------------- reference list ---------------- */
function Browse({ onPractice }) {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const progress = store.phraseStats();

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PHRASES.filter((phrase) => {
      if (category !== "all" && phrase.category !== category) return false;
      if (!needle) return true;
      return (
        phrase.en.toLowerCase().includes(needle) ||
        phrase.es.toLowerCase().includes(needle) ||
        (phrase.literal || "").toLowerCase().includes(needle)
      );
    });
  }, [query, category]);

  const groups = PHRASE_CATEGORIES.map((cat) => ({
    ...cat,
    items: rows.filter((phrase) => phrase.category === cat.key),
  })).filter((group) => group.items.length);

  return (
    <div className="page">
      <div className="card">
        <div className="card-head">
          <h2>Phrases · Frases y expresiones</h2>
          <button className="btn btn-primary tiny-btn" onClick={onPractice}>
            Practicar
          </button>
        </div>
        <p className="muted small">
          Las frases más usadas del inglés hablado y los modismos más comunes.
          <b> Practicar</b> primero te muestra las frases de la ronda para tener
          contexto y luego te pregunta; las que aciertas van espaciándose como
          flashcards.
        </p>
        <p className="muted small">
          {progress.seen} de {progress.total} practicadas ·{" "}
          {progress.learning} aprendiendo · {progress.review} en repaso ·{" "}
          {progress.mastered} dominadas
        </p>
      </div>

      <div className="browse-bar card">
        <input
          type="search"
          placeholder="Buscar una frase o su significado…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Todas las categorías</option>
          {PHRASE_CATEGORIES.map((cat) => (
            <option value={cat.key} key={cat.key}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      {groups.map((group) => (
        <div className="card" key={group.key}>
          <h3 className="gr-group">
            {group.icon} {group.label}
          </h3>
          <div className="phrase-list">
            {group.items.map((phrase) => {
              const status = store.phraseStatus(phrase.id);
              return (
                <div className="phrase-row" key={phrase.id}>
                  <div className="phrase-en">
                    <span>{phrase.en}</span>
                    <button
                      type="button"
                      className="wf-speak"
                      title="Escuchar"
                      onClick={() => Speech.say(phrase.en)}
                    >
                      🔊
                    </button>
                    {status !== "new" && (
                      <span className={"phrase-status ph-" + status}>
                        {STATUS_LABEL[status]}
                      </span>
                    )}
                  </div>
                  <div className="phrase-es">{phrase.es}</div>
                  {phrase.literal && (
                    <div className="phrase-literal">literal: {phrase.literal}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {rows.length === 0 && <p className="muted">Nada coincide con la búsqueda.</p>}
    </div>
  );
}

function AllCaughtUp({ onRandom, onQuit }) {
  return (
    <div className="page">
      <div className="card done-card">
        <div className="done-emoji">🎉</div>
        <h1>Todo al día</h1>
        <p className="muted">
          Has repasado todas las frases pendientes por hoy. Vuelve más tarde o
          practica algunas al azar.
        </p>
        <div className="done-actions">
          <button className="btn btn-primary" onClick={onRandom}>
            Practicar 10 al azar
          </button>
          <button className="btn btn-ghost" onClick={onQuit}>
            Volver a la lista
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
        <button className="icon-btn" title="Salir" onClick={onQuit}>✕</button>
        <div className="progress">
          <span style={{ width: `${((index + 1) / phrases.length) * 100}%` }} />
        </div>
        <div className="count">{index + 1}/{phrases.length}</div>
      </div>

      <div className="mode-tag">Estudia las frases de esta ronda</div>

      <div className="card practice-card">
        <div className="phrase-cat">
          {CATEGORY[phrase.category].icon} {CATEGORY[phrase.category].label}
        </div>
        <div className="study-en">
          {phrase.en}
          <button
            type="button"
            className="wf-speak"
            title="Escuchar"
            onClick={() => Speech.say(phrase.en)}
          >
            🔊
          </button>
        </div>
        <div className="study-es">{phrase.es}</div>
        {phrase.literal && (
          <div className="phrase-literal">literal: {phrase.literal}</div>
        )}
      </div>

      <div className="controls">
        <button
          className="btn btn-primary wide"
          onClick={() => (last ? onReady() : setIndex((n) => n + 1))}
        >
          {last ? "Empezar preguntas" : "Siguiente"}
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
            {pct}% de aciertos. Las acertadas vuelven más adelante; las falladas,
            pronto.
          </p>
          <div className="done-actions">
            <button className="btn btn-primary" onClick={onRestart}>
              Otra ronda
            </button>
            <button className="btn btn-ghost" onClick={onQuit}>
              Volver a la lista
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
    Store.gradePhrase(phrase.id, right);
    Speech.say(phrase.en);
  };

  return (
    <div className="page">
      <div className="study-top">
        <button className="icon-btn" title="Salir" onClick={onQuit}>✕</button>
        <div className="progress">
          <span style={{ width: `${(index / order.length) * 100}%` }} />
        </div>
        <div className="count">{index + 1}/{order.length}</div>
      </div>

      <div className="mode-tag">Completa el hueco</div>

      <div className="card practice-card">
        <div className="phrase-cat">
          {CATEGORY[phrase.category].icon} {CATEGORY[phrase.category].label}
        </div>
        <div className="practice-es">{phrase.es}</div>
        {phrase.literal && <div className="phrase-literal">literal: {phrase.literal}</div>}

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
            placeholder="Completa el hueco en inglés…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={!!result}
          />
          <button className="btn btn-primary" type="submit">
            {result ? "Siguiente" : "Comprobar"}
          </button>
        </form>

        {result === "right" && (
          <div className="feedback fb-ok">
            <div className="fb-head">¡Correcto!</div>
            <div className="fb-es">{phrase.en}</div>
          </div>
        )}
        {result === "wrong" && (
          <div className="feedback fb-bad">
            <div className="fb-head">No exacto</div>
            <div className="fb-es">
              Respuesta correcta: <b>{phrase.gap}</b>
            </div>
            <div className="muted small">{phrase.en}</div>
          </div>
        )}
      </div>
    </div>
  );
}
