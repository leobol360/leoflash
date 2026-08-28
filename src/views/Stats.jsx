import { VOCAB } from "../data.js";
import { useStore } from "../useStore.js";
import { StatCard } from "../components/ui.jsx";

export default function Stats() {
  const store = useStore();
  const st = store.stats();
  const days = store.last14();
  const activity = store.activityDays(35);
  const maxR = Math.max(1, ...days.map((d) => d.reviews));

  // which cells belong to the current streak (for the highlight)
  const runSet = new Set();
  let need = st.streak;
  for (let i = activity.length - 1; i >= 0 && need > 0; i--) {
    if (activity[i].active) { runSet.add(i); need--; }
    else if (i === activity.length - 1) continue; // today, not studied yet
    else break;
  }

  const scopeIds = new Set(VOCAB.filter((v) => store.inScope(v)).map((v) => v.id));
  const leeches = Object.entries(store.data.cards)
    .filter(([k, c]) => c.lapses >= 2 && scopeIds.has(k))
    .map(([, c]) => c)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 12);

  return (
    <div className="page">
      {/* streak / activity */}
      <div className="card streak-card">
        <div className="streak-big">
          <span className="streak-num">{st.streak}</span>
          <span className="streak-flame">🔥</span>
          <span className="streak-label">
            day{st.streak === 1 ? "" : "s"} in a row
            {!st.studiedToday && st.streak > 0 && (
              <em className="streak-warn"> · study today to keep it</em>
            )}
          </span>
        </div>
        <div className="streak-strip" title="last 35 days">
          {activity.map((d, i) => (
            <span
              key={d.day}
              className={
                "streak-cell" + (d.active ? " on" : "") + (runSet.has(i) ? " run" : "")
              }
              title={`${d.day}: ${d.reviews} reviews`}
            />
          ))}
        </div>
        <p className="muted small">
          Best streak: <b>{st.maxStreak} day{st.maxStreak === 1 ? "" : "s"}</b> ·{" "}
          {activity.filter((d) => d.active).length} of the last 35 days studied
        </p>
      </div>

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
        <StatCard label="Words started" value={`${st.seen}/${st.total}`} />
        <StatCard label="Mature words" value={st.mature} sub="interval ≥ 21 days" />
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
