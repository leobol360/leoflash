import { useMemo, useState } from "react";
import { VOCAB, ACTIVE_LEVELS } from "../data.js";
import { Store } from "../store.js";
import { useStore } from "../useStore.js";

const LEARNED_INTERVAL_DAYS = 7;
const MATURE_INTERVAL_DAYS = 21;
const RENDER_CAP = 400;

const STATUS_RANK = { new: 0, learning: 1, known: 2, mature: 3, removed: 4 };

function wordStatus(card) {
  if (!card || !card.seen) return "new";
  const interval = card.interval || 0;
  if (interval >= MATURE_INTERVAL_DAYS) return "mature";
  if (interval >= LEARNED_INTERVAL_DAYS) return "known";
  return "learning";
}

export default function DeckTable({ onOpenLevels }) {
  const store = useStore();
  const version = store.getVersion();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState({ col: "word", dir: 1 });

  const loadedLevels = store.enabledLevels();
  const removedView = statusFilter === "removed";
  const removedCount = store.removedCount();

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const base = VOCAB.filter((entry) => {
      if (!store.levelEnabled(entry.level)) return false;
      return removedView ? store.isRemoved(entry.id) : !store.isRemoved(entry.id);
    });

    const filtered = base
      .map((entry) => ({
        entry,
        status: removedView ? "removed" : wordStatus(store.data.cards[entry.id]),
      }))
      .filter(({ entry, status }) => {
        if (levelFilter && entry.level !== levelFilter) return false;
        if (!removedView && statusFilter && statusFilter !== status) return false;
        if (
          needle &&
          !(
            entry.word.toLowerCase().includes(needle) ||
            entry.es.toLowerCase().includes(needle)
          )
        )
          return false;
        return true;
      });

    filtered.sort((a, b) => {
      let cmp;
      if (sort.col === "status") cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      else if (sort.col === "es") cmp = a.entry.es.localeCompare(b.entry.es);
      else cmp = a.entry.word.localeCompare(b.entry.word);
      return cmp * sort.dir;
    });
    return filtered;
  }, [version, query, levelFilter, statusFilter, sort]);

  const shown = rows.slice(0, RENDER_CAP);

  const toggleSort = (col) =>
    setSort((s) => (s.col === col ? { col, dir: -s.dir } : { col, dir: 1 }));
  const arrow = (col) => (sort.col === col ? (sort.dir === 1 ? " ▲" : " ▼") : "");

  return (
    <>
      <div className="browse-bar">
        <input
          type="search"
          placeholder="Buscar palabra o traducción…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="">Todos los niveles</option>
          {Object.entries(ACTIVE_LEVELS)
            .filter(([key]) => loadedLevels.includes(key))
            .map(([key, level]) => (
              <option value={key} key={key}>
                {level.icon} {level.label}
              </option>
            ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Cualquier estado</option>
          <option value="new">new</option>
          <option value="learning">learning</option>
          <option value="known">known</option>
          <option value="mature">mature</option>
          <option value="removed">removed ({removedCount})</option>
        </select>
      </div>

      <p className="muted small">
        {rows.length} palabra{rows.length === 1 ? "" : "s"}
        {rows.length > RENDER_CAP ? ` · mostrando ${RENDER_CAP}` : ""} ·{" "}
        <button className="linkish" onClick={onOpenLevels}>
          cambiar niveles
        </button>
      </p>

      <div className="deck-table-wrap">
        <table className="deck-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("word")}>Palabra{arrow("word")}</th>
              <th onClick={() => toggleSort("es")}>Traducción{arrow("es")}</th>
              <th onClick={() => toggleSort("status")}>Estado{arrow("status")}</th>
              <th aria-label="acciones" />
            </tr>
          </thead>
          <tbody>
            {shown.map(({ entry, status }) => (
              <tr key={entry.id}>
                <td title={entry.pos}>{entry.word}</td>
                <td className="deck-es" title={entry.es}>{entry.es}</td>
                <td>
                  <span className={"status " + status}>{status}</span>
                </td>
                <td className="deck-action">
                  {removedView ? (
                    <button
                      className="linkish"
                      onClick={() => Store.restoreWord(entry.id)}
                    >
                      restaurar
                    </button>
                  ) : (
                    <button
                      className="deck-del"
                      title="Quitar del deck"
                      onClick={() => {
                        if (confirm(`¿Quitar «${entry.word}» del deck?`))
                          Store.removeWord(entry.id);
                      }}
                    >
                      🗑
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="muted small">
            {removedView
              ? "No has quitado ninguna palabra."
              : "Nada coincide con los filtros."}
          </p>
        )}
        {rows.length > RENDER_CAP && (
          <p className="muted small">
            …y {rows.length - RENDER_CAP} más — afina la búsqueda.
          </p>
        )}
      </div>
    </>
  );
}
