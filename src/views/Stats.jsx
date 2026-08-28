import { VOCAB } from "../data.js";
import { useStore } from "../useStore.js";
import { StatCard } from "../components/ui.jsx";

export default function Stats() {
  const store = useStore();
  const st = store.stats();
  const days = store.last14();
  const maxR = Math.max(1, ...days.map((d) => d.reviews));

  const scopeIds = new Set(VOCAB.filter((v) => store.inScope(v)).map((v) => v.id));
  const leeches = Object.entries(store.data.cards)
    .filter(([k, c]) => c.lapses >= 2 && scopeIds.has(k))
    .map(([, c]) => c)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 12);

  return (
    <div className="page">
      <div className="card">
        <h2>Last 14 days</h2>
        <div className="chart">
          {days.map((d) => (
            <div className="chart-col" key={d.day}>
              <div
                className={"chart-bar" + (d.reviews === 0 ? " empty" : "")}
                style={{ height: `${Math.round((d.reviews / maxR) * 100)}%` }}
                title={`${d.day}: ${d.reviews} reviews`}
              />
              <span className="chart-x">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total reviews" value={st.reviews} />
        <StatCard label="Overall accuracy" value={`${st.accuracy}%`} />
        <StatCard label="Mature words" value={st.mature} sub="interval ≥ 21 days" />
        <StatCard label="Day streak" value={`${st.streak} 🔥`} />
      </div>

      <div className="card">
        <h2>Words to watch</h2>
        {leeches.length === 0 ? (
          <p className="muted">No tricky words yet — you're doing great.</p>
        ) : (
          <div className="watch-list">
            {leeches.map((c) => {
              const v = VOCAB.find((x) => x.id === c.id);
              if (!v) return null;
              return (
                <div className="watch-item" key={c.id}>
                  <b>{v.word}</b> <span className="muted">{v.es}</span>{" "}
                  <span className="tag">{c.lapses} slips</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
