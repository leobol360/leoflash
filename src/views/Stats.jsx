import { VOCAB } from "../data.js";
import { useStore } from "../useStore.js";
import { StatCard } from "../components/ui.jsx";

export default function Stats() {
  const store = useStore();
  const stats = store.stats();
  const recentDays = store.activityDays(14);
  const activity = store.activityDays(35);
  const maxReviews = Math.max(1, ...recentDays.map((day) => day.reviews));

  // which cells belong to the current streak (for the highlight)
  const streakCells = new Set();
  let remaining = stats.streak;
  for (let i = activity.length - 1; i >= 0 && remaining > 0; i--) {
    if (activity[i].active) { streakCells.add(i); remaining--; }
    else if (i === activity.length - 1) continue; // today, not studied yet
    else break;
  }

  const scopeIds = new Set(VOCAB.filter((entry) => store.inScope(entry)).map((entry) => entry.id));
  const leeches = Object.entries(store.data.cards)
    .filter(([id, card]) => card.lapses >= 2 && scopeIds.has(id))
    .map(([, card]) => card)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 12);

  return (
    <div className="page">
      {/* streak / activity */}
      <div className="card streak-card">
        <div className="streak-big">
          <span className="streak-num">{stats.streak}</span>
          <span className="streak-flame">🔥</span>
          <span className="streak-label">
            day{stats.streak === 1 ? "" : "s"} in a row
            {!stats.studiedToday && stats.streak > 0 && (
              <em className="streak-warn"> · study today to keep it</em>
            )}
          </span>
        </div>
        <div className="streak-strip" title="last 35 days">
          {activity.map((day, i) => (
            <span
              key={day.day}
              className={
                "streak-cell" + (day.active ? " on" : "") + (streakCells.has(i) ? " run" : "")
              }
              title={`${day.day}: ${day.reviews} reviews`}
            />
          ))}
        </div>
        <p className="muted small">
          Best streak: <b>{stats.maxStreak} day{stats.maxStreak === 1 ? "" : "s"}</b> ·{" "}
          {activity.filter((day) => day.active).length} of the last 35 days studied
        </p>
      </div>

      <div className="card">
        <h2>Last 14 days</h2>
        <div className="chart">
          {recentDays.map((day) => (
            <div className="chart-col" key={day.day}>
              <div
                className={"chart-bar" + (day.reviews === 0 ? " empty" : "")}
                style={{ height: `${Math.round((day.reviews / maxReviews) * 100)}%` }}
                title={`${day.day}: ${day.reviews} reviews`}
              />
              <span className="chart-x">{day.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total reviews" value={stats.reviews} />
        <StatCard label="Overall accuracy" value={`${stats.accuracy}%`} />
        <StatCard label="Words started" value={`${stats.seen}/${stats.total}`} />
        <StatCard label="Mature words" value={stats.mature} sub="interval ≥ 21 days" />
      </div>

      <div className="card">
        <h2>Words to watch</h2>
        {leeches.length === 0 ? (
          <p className="muted">No tricky words yet — you're doing great.</p>
        ) : (
          <div className="watch-list">
            {leeches.map((card) => {
              const entry = VOCAB.find((x) => x.id === card.id);
              if (!entry) return null;
              return (
                <div className="watch-item" key={card.id}>
                  <b>{entry.word}</b> <span className="muted">{entry.es}</span>{" "}
                  <span className="tag">{card.lapses} slips</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
