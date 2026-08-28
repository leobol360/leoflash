import { useMemo, useState } from "react";
import { VOCAB, ACTIVE_THEMES, THEMES } from "../data.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import WordForms from "../components/WordForms.jsx";
import { Example, Glossable } from "../components/ui.jsx";

export default function Browse({ onOpenLevels }) {
  const store = useStore();
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState("");
  const [status, setStatus] = useState("");

  const version = store.getVersion();
  const scoped = useMemo(() => VOCAB.filter((v) => store.inScope(v)), [version]);
  const levelKeys = store.enabledLevels();

  const rows = scoped.filter((v) => {
    if (theme && v.theme !== theme) return false;
    const c = store.data.cards[v.id];
    const iv = (c && c.interval) || 0;
    const listStatus = !c || !c.seen ? "new" : iv >= 7 ? "known" : "learning";
    if (status && status !== listStatus) return false;
    if (
      q &&
      !(
        v.word.toLowerCase().includes(q.toLowerCase()) ||
        v.es.toLowerCase().includes(q.toLowerCase()) ||
        v.def.toLowerCase().includes(q.toLowerCase())
      )
    )
      return false;
    return true;
  });

  return (
    <div className="page">
      <div className="browse-bar card">
        <input
          type="search"
          placeholder="Search words, meanings…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="">All loaded levels</option>
          {Object.entries(ACTIVE_THEMES)
            .filter(([k]) => levelKeys.includes(k))
            .map(([k, m]) => (
              <option value={k} key={k}>
                {m.icon} {m.label}
              </option>
            ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="new">Not started</option>
          <option value="learning">Learning</option>
          <option value="known">Known well</option>
        </select>
      </div>

      <p className="muted small">
        Showing <b>{rows.length}</b> of {scoped.length} words in your loaded levels (
        {levelKeys.filter((k) => k !== "software").map((k) => k.toUpperCase()).join(", ") || "—"}) ·{" "}
        <button className="linkish" onClick={onOpenLevels}>
          change levels
        </button>
      </p>

      <div className="word-list">
        {rows.map((v) => {
          const c = store.data.cards[v.id];
          const iv = (c && c.interval) || 0;
          const s =
            !c || !c.seen ? "new" : iv >= 21 ? "mature" : iv >= 7 ? "known" : "learning";
          return (
            <div className="word-card" key={v.id}>
              <div className="word-head">
                <div>
                  <span className="w">{v.word}</span>
                  <span className="pos">{v.pos}</span>
                  {v.ipa && <span className="ipa">{v.ipa}</span>}
                </div>
                <div className="word-actions">
                  <span className={`status ${s}`}>{s}</span>
                  <button
                    className="icon-btn"
                    title="Listen"
                    onClick={() => Speech.say(v.word)}
                  >
                    🔊
                  </button>
                </div>
              </div>
              <div className="es">{v.es}</div>
              <div className="def"><Glossable text={v.def} /></div>
              <div className="ex">
                <Example text={v.ex} word={v.word} onSpeak={(t) => Speech.say(t)} />
              </div>
              <WordForms word={v.word} pos={v.pos} onSpeak={(t) => Speech.say(t)} />
              <div className="theme-tag">
                {THEMES[v.theme].icon} {THEMES[v.theme].label}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="muted">No words match your filters.</p>}
      </div>
    </div>
  );
}
