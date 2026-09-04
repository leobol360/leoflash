import { useMemo, useRef, useState } from "react";
import { GRAMMAR, GRAMMAR_GROUPS, GRAMMAR_TENSE } from "../grammar.js";
import { randomPhrase, similarity, wordDiff } from "../phrases.js";
import { Speech } from "../speech.js";

const LEVEL_LABEL = { a1: "A1", a2: "A2", b1: "B1", b2: "B2" };

const verdictFor = (pct) =>
  pct >= 90
    ? { fb: "fb-ok", label: "Correct" }
    : pct >= 60
    ? { fb: "fb-almost", label: "Almost" }
    : { fb: "fb-bad", label: "Not quite" };

const diffClass = (state, badClass) =>
  state === "ok" ? "" : state === "near" ? "diff-near" : badClass;

export default function Grammar() {
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GRAMMAR.filter((g) => {
      if (group !== "all" && g.group !== group) return false;
      if (!needle) return true;
      return (
        g.name.toLowerCase().includes(needle) ||
        g.es.toLowerCase().includes(needle) ||
        g.uses.join(" ").toLowerCase().includes(needle)
      );
    });
  }, [group, q]);

  const byGroup = GRAMMAR_GROUPS.map((gr) => ({
    ...gr,
    items: rows.filter((r) => r.group === gr.key),
  })).filter((gr) => gr.items.length);

  return (
    <div className="page">
      <div className="card">
        <h2>Grammar · English tenses &amp; structures</h2>
        <p className="muted small">
          Para qué sirve cada tiempo, cuándo usarlo y cómo se forma
          (afirmativa, negativa, pregunta y pregunta con Wh-). Explicación en
          español, ejemplos en inglés.
        </p>
      </div>

      <div className="browse-bar card">
        <input
          type="search"
          placeholder="Buscar un tiempo verbal…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">Todos los grupos</option>
          {GRAMMAR_GROUPS.map((gr) => (
            <option value={gr.key} key={gr.key}>
              {gr.icon} {gr.label}
            </option>
          ))}
        </select>
      </div>

      {byGroup.map((gr) => (
        <div className="card" key={gr.key}>
          <h3 className="gr-group">
            {gr.icon} {gr.label}
          </h3>
          <div className="gr-list">
            {gr.items.map((g) => (
              <GrammarCard
                key={g.id}
                g={g}
                open={open === g.id}
                onToggle={() => setOpen(open === g.id ? null : g.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <p className="muted">Nada coincide con la búsqueda.</p>
      )}
    </div>
  );
}

function GrammarCard({ g, open, onToggle }) {
  const f = g.forms;
  return (
    <div className={"gr-card" + (open ? " open" : "")}>
      <button className="gr-head" onClick={onToggle}>
        <span className="gr-title">
          {g.name}
          <span className="gr-es"> · {g.es}</span>
        </span>
        <span className="gr-meta">
          <span className={"lvl lvl-" + g.level}>{LEVEL_LABEL[g.level]}</span>
          <span className="gr-caret">{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div className="gr-body">
          {g.gist && <p className="gr-gist">{g.gist}</p>}

          <div className="gr-block">
            <h4>¿Cuándo se usa?</h4>
            <ul className="gr-uses">
              {g.uses.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>

          <div className="gr-block">
            <h4>Formas</h4>
            <div className="gr-forms">
              {f.affirmative && <FormRow label="Afirmativa" row={f.affirmative} />}
              {f.negative && <FormRow label="Negativa" row={f.negative} />}
              {f.question && <FormRow label="Interrogativa" row={f.question} />}
              {f.whQuestion && <FormRow label="Con Wh-" row={f.whQuestion} />}
              {f.short && (
                <div className="gr-form-row">
                  <div className="gr-form-label">Respuestas cortas</div>
                  <div className="gr-form-ex">
                    {f.short.map((sa, i) => (
                      <div key={i}>{sa}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {g.signals && g.signals.length > 0 && (
            <div className="gr-block">
              <h4>Pistas típicas</h4>
              <p className="gr-hint">
                Palabras que suelen aparecer con este tiempo. Son una pista, no
                una regla fija.
              </p>
              <div className="gr-signals">
                {g.signals.map((s, i) => (
                  <span className="chip" key={i}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {g.passive && (
            <div className="gr-block">
              <h4>Voz pasiva</h4>
              <pre className="gr-passive">{g.passive}</pre>
            </div>
          )}

          {g.notes && g.notes.length > 0 && (
            <div className="gr-block gr-notes">
              <h4>Ojo</h4>
              <ul>
                {g.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {GRAMMAR_TENSE[g.id] && <TensePractice tense={GRAMMAR_TENSE[g.id]} />}
        </div>
      )}
    </div>
  );
}

/* Free practice for one tense: a random Spanish sentence in that tense, you
   type the English, get a % match. No schedule, nothing counts. */
function TensePractice({ tense }) {
  const [phrase, setPhrase] = useState(() => randomPhrase(tense));
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null); // { match, fb, label, gaveUp } | null
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef(null);

  if (!phrase) return null;
  const answered = result != null;

  const check = () => {
    if (!typed.trim() || answered) return;
    const match = similarity(typed, phrase.en);
    setResult({ match, ...verdictFor(match), diff: wordDiff(typed, phrase.en) });
    Speech.say(phrase.en);
  };
  const giveUp = () => {
    if (answered) return;
    setResult({
      match: similarity(typed, phrase.en),
      fb: "fb-bad",
      label: "No pasa nada",
      gaveUp: true,
      diff: wordDiff(typed, phrase.en),
    });
    Speech.say(phrase.en);
  };
  const nextOne = () => {
    setPhrase(randomPhrase(tense, phrase.id));
    setTyped("");
    setResult(null);
    setShowHint(false);
  };

  return (
    <div className="gr-block gr-practice">
      <h4>Practica este tiempo</h4>
      <p className="gr-hint">
        Escribe la frase en inglés. Es solo práctica: no cuenta para tu repaso.
      </p>
      <div className="gr-practice-es">{phrase.es}</div>

      {!answered &&
        (showHint ? (
          <div className="phrase-hint">
            {phrase.en}
            <span className="phrase-hint-note">así se escribe</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost tiny-btn"
            onClick={() => setShowHint(true)}
          >
            Show English hint
          </button>
        ))}

      {!answered ? (
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
            placeholder="Type it in English…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button className="btn btn-primary" type="submit">
            Check
          </button>
          <button className="btn btn-danger" type="button" onClick={giveUp}>
            Don't know
          </button>
        </form>
      ) : (
        <>
          <div className={"feedback " + result.fb}>
            <div className="fb-head">
              {result.gaveUp
                ? "Así se escribe"
                : `${result.label} — ${result.match}% match`}
            </div>
            <div className="fb-es">
              You wrote:{" "}
              {result.diff.typed.length ? (
                <span className="diff">
                  {result.diff.typed.map((w, i) => (
                    <span key={i} className={diffClass(w.state, "diff-bad")}>
                      {w.text}{" "}
                    </span>
                  ))}
                </span>
              ) : (
                <b>—</b>
              )}
            </div>
            <div className="fb-word">
              <span className="diff">
                {result.diff.reference.map((w, i) => (
                  <b key={i} className={diffClass(w.state, "diff-miss")}>
                    {w.text}{" "}
                  </b>
                ))}
              </span>
              <button className="icon-btn" onClick={() => Speech.say(phrase.en)}>
                🔊
              </button>
            </div>
            <div className="fb-es muted">{phrase.es}</div>
          </div>
          <button className="btn btn-primary wide" onClick={nextOne}>
            Otra frase
          </button>
        </>
      )}
    </div>
  );
}

function FormRow({ label, row }) {
  // A form can have one pattern (row.s / row.ex) or several alternatives,
  // each on its own line with a "when" subtitle (row.variants).
  const variants = row.variants || [{ s: row.s, ex: row.ex }];
  return (
    <div className="gr-form-row">
      <div className="gr-form-label">{label}</div>
      <div className="gr-form-content">
        {variants.map((v, i) => (
          <div className="gr-variant" key={i}>
            {v.when && <div className="gr-variant-when">{v.when}</div>}
            <code className="gr-struct">{v.s}</code>
            {v.ex && v.ex.length > 0 && (
              <div className="gr-form-ex">
                {v.ex.map((e, j) => (
                  <div key={j}>“{e}”</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
