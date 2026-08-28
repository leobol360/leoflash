import { useMemo, useState } from "react";
import { GRAMMAR, GRAMMAR_GROUPS } from "../grammar.js";

const LEVEL_LABEL = { a1: "A1", a2: "A2", b1: "B1", b2: "B2" };

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
          Todas las estructuras de los tiempos verbales y sus formas
          (afirmativa, negativa, interrogativa) con ejemplos. Explicaciones en
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
          <div className="gr-block">
            <h4>Se usa para</h4>
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
              <h4>Marcadores temporales</h4>
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
        </div>
      )}
    </div>
  );
}

function FormRow({ label, row }) {
  return (
    <div className="gr-form-row">
      <div className="gr-form-label">{label}</div>
      <div className="gr-form-content">
        <code className="gr-struct">{row.s}</code>
        <div className="gr-form-ex">
          {row.ex.map((e, i) => (
            <div key={i}>“{e}”</div>
          ))}
        </div>
      </div>
    </div>
  );
}
