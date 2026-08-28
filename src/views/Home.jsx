import { ACTIVE_LEVELS } from "../data.js";
import { useStore } from "../useStore.js";
import { formatRelativeDate } from "../format.js";
import { Ring, StatCard, ProgressBar } from "../components/ui.jsx";

export default function Home({ onStart, onOpenLevels }) {
  const store = useStore();
  const settings = store.settings();
  const stats = store.stats();
  const summary = store.dueSummary();
  const loadedLevels = settings.enabledLevels || Object.keys(ACTIVE_LEVELS);

  const canStart = summary.due + Math.min(summary.newLeft, settings.newPerDay) > 0;
  const eyebrow =
    loadedLevels.filter((key) => key !== "software").map((key) => key.toUpperCase()).join(" · ") || "CEFR";

  const notLoadedLevels = Object.keys(ACTIVE_LEVELS).filter((key) => !loadedLevels.includes(key));

  let statusLine;
  if (canStart) {
    statusLine = (
      <>
        {summary.due} card{summary.due === 1 ? "" : "s"} to review
        {summary.newLeft > 0
          ? ` · ${summary.newLeft} new word${summary.newLeft === 1 ? "" : "s"} today`
          : ""}
        .
      </>
    );
  } else if (summary.aheadAvailable) {
    statusLine = (
      <>
        Today's {settings.newPerDay} new words are done — nice.{" "}
        {summary.nextDue
          ? `Next scheduled review: ${formatRelativeDate(summary.nextDue)}. `
          : ""}
        Want to keep going? <b>Study ahead</b> pulls the next batch now.
      </>
    );
  } else {
    statusLine = (
      <>You've studied every word in your loaded levels. Load another level, or come back tomorrow.</>
    );
  }

  return (
    <div className="page">
      <div className="hero card">
        <div className="hero-left">
          <p className="eyebrow">{eyebrow} · Vocabulary trainer</p>
          <h1>
            {settings.name
              ? `Ready for today's practice, ${settings.name}?`
              : "Ready for today's practice?"}
          </h1>
          <p className="muted">{statusLine}</p>
          <div className="hero-actions">
            {canStart ? (
              <button className="btn btn-primary big" onClick={() => onStart({})}>
                Start studying
              </button>
            ) : summary.aheadAvailable ? (
              <button className="btn btn-primary big" onClick={() => onStart({ ahead: true })}>
                Study ahead
              </button>
            ) : (
              <button className="btn btn-primary big" onClick={onOpenLevels}>
                Load a level
              </button>
            )}
            <button
              className="btn btn-ghost"
              onClick={() => onStart({ limit: 10, allowAheadNew: true })}
            >
              Quick 10
            </button>
          </div>
        </div>
        <Ring
          value={stats.today.newSeen}
          max={settings.newPerDay}
          label="New words today"
          sub={`${stats.today.reviews} reviews done`}
        />
      </div>

      <div className="stat-grid">
        <StatCard
          label="Day streak"
          value={`${stats.streak} 🔥`}
          sub={stats.streak > 0 ? "Keep it going" : "Study to start"}
        />
        <StatCard
          label="Words started"
          value={`${stats.seen}/${stats.total}`}
          sub={`${Math.round((stats.seen / Math.max(1, stats.total)) * 100)}% of loaded levels`}
        />
        <StatCard label="Known well" value={stats.learned} sub={`${summary.known} marked "never"`} />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} sub={`${stats.reviews} reviews total`} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Progress by level</h2>
          <button className="btn btn-ghost tiny-btn" onClick={onOpenLevels}>
            Change levels
          </button>
        </div>
        <div className="theme-grid">
          {Object.entries(ACTIVE_LEVELS)
            .filter(([key]) => loadedLevels.includes(key))
            .map(([key, level]) => {
              const progress = store.levelProgress(key);
              const startedPct = Math.round((progress.started / progress.total) * 100);
              return (
                <button
                  className="theme-row"
                  key={key}
                  onClick={() => onStart({ levelOnly: key })}
                >
                  <span className="theme-icon">{level.icon}</span>
                  <span className="theme-main">
                    <span className="theme-name">
                      {level.label}{" "}
                      <span className="theme-pct">
                        {progress.started} started · {progress.pct}% mastered
                        {progress.known ? ` · ${progress.known} known` : ""}
                      </span>
                    </span>
                    <ProgressBar startedPct={startedPct} masteredPct={progress.pct} />
                  </span>
                  <span className="theme-count">
                    {progress.started}/{progress.total}
                  </span>
                </button>
              );
            })}

          {notLoadedLevels.length > 0 && (
            <button className="theme-row add-more" onClick={onOpenLevels}>
              <span className="theme-icon">＋</span>
              <span className="theme-main">
                <span className="theme-name">
                  Load more levels{" "}
                  <span className="theme-pct">
                    {notLoadedLevels.map((key) => ACTIVE_LEVELS[key].label.split(" ")[0]).join(", ")}
                  </span>
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
