import { useMemo, useState } from "react";
import { VOCAB, ACTIVE_LEVELS, LEVELS } from "../data.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import WordForms from "../components/WordForms.jsx";
import { Example, Glossable } from "../components/ui.jsx";

const LEARNED_INTERVAL_DAYS = 7;
const MATURE_INTERVAL_DAYS = 21;

export default function Browse({ onOpenLevels }) {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const version = store.getVersion();
  const scoped = useMemo(() => VOCAB.filter((entry) => store.inScope(entry)), [version]);
  const loadedLevels = store.enabledLevels();

  const rows = scoped.filter((entry) => {
    if (levelFilter && entry.level !== levelFilter) return false;
    const card = store.data.cards[entry.id];
    const interval = (card && card.interval) || 0;
    const status = !card || !card.seen ? "new" : interval >= LEARNED_INTERVAL_DAYS ? "known" : "learning";
    if (statusFilter && statusFilter !== status) return false;
    const needle = query.toLowerCase();
    if (
      query &&
      !(
        entry.word.toLowerCase().includes(needle) ||
        entry.es.toLowerCase().includes(needle) ||
        entry.def.toLowerCase().includes(needle)
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="">All loaded levels</option>
          {Object.entries(ACTIVE_LEVELS)
            .filter(([key]) => loadedLevels.includes(key))
            .map(([key, level]) => (
              <option value={key} key={key}>
                {level.icon} {level.label}
              </option>
            ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Any status</option>
          <option value="new">Not started</option>
          <option value="learning">Learning</option>
          <option value="known">Known well</option>
        </select>
      </div>

      <p className="muted small">
        Showing <b>{rows.length}</b> of {scoped.length} words in your loaded levels (
        {loadedLevels.filter((key) => key !== "software").map((key) => key.toUpperCase()).join(", ") || "—"}) ·{" "}
        <button className="linkish" onClick={onOpenLevels}>
          change levels
        </button>
      </p>

      <div className="word-list">
        {rows.map((entry) => {
          const card = store.data.cards[entry.id];
          const interval = (card && card.interval) || 0;
          const status =
            !card || !card.seen
              ? "new"
              : interval >= MATURE_INTERVAL_DAYS
              ? "mature"
              : interval >= LEARNED_INTERVAL_DAYS
              ? "known"
              : "learning";
          return (
            <div className="word-card" key={entry.id}>
              <div className="word-head">
                <div>
                  <span className="w">{entry.word}</span>
                  <span className="pos">{entry.pos}</span>
                  {entry.ipa && <span className="ipa">{entry.ipa}</span>}
                </div>
                <div className="word-actions">
                  <span className={`status ${status}`}>{status}</span>
                  <button
                    className="icon-btn"
                    title="Listen"
                    onClick={() => Speech.say(entry.word)}
                  >
                    🔊
                  </button>
                </div>
              </div>
              <div className="es">{entry.es}</div>
              <div className="def"><Glossable text={entry.def} /></div>
              <div className="ex">
                <Example text={entry.ex} word={entry.word} onSpeak={(t) => Speech.say(t)} />
              </div>
              <WordForms word={entry.word} pos={entry.pos} onSpeak={(t) => Speech.say(t)} />
              <div className="theme-tag">
                {LEVELS[entry.level].icon} {LEVELS[entry.level].label}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="muted">No words match your filters.</p>}
      </div>
    </div>
  );
}
