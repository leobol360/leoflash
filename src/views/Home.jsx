import { ACTIVE_THEMES } from "../data.js";
import { useStore } from "../useStore.js";
import { relDate } from "../format.js";
import { Ring, StatCard, ProgressBar } from "../components/ui.jsx";

export default function Home({ onStart, onOpenLevels }) {
  const store = useStore();
  const s = store.settings();
  const st = store.stats();
  const sum = store.dueSummary();
  const loaded = s.themesEnabled || Object.keys(ACTIVE_THEMES);

  const canStart = sum.due + Math.min(sum.newLeft, s.newPerDay) > 0;
  const eyebrow =
    loaded.filter((k) => k !== "software").map((k) => k.toUpperCase()).join(" · ") || "CEFR";

  const notLoaded = Object.keys(ACTIVE_THEMES).filter((k) => !loaded.includes(k));

  let statusLine;
  if (canStart) {
    statusLine = (
      <>
        {sum.due} card{sum.due === 1 ? "" : "s"} to review
        {sum.newLeft > 0
          ? ` · ${sum.newLeft} new word${sum.newLeft === 1 ? "" : "s"} today`
          : ""}
        .
      </>
    );
  } else if (sum.aheadAvailable) {
    statusLine = (
      <>
        Today's {s.newPerDay} new words are done — nice.{" "}
        {sum.nextDue
          ? `Next scheduled review: ${relDate(sum.nextDue)}. `
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
          <h1>Ready for today's practice?</h1>
          <p className="muted">{statusLine}</p>
          <div className="hero-actions">
            {canStart ? (
              <button className="btn btn-primary big" onClick={() => onStart({})}>
                Start studying
              </button>
            ) : sum.aheadAvailable ? (
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
          value={st.today.newSeen}
          max={s.newPerDay}
          label="New words today"
          sub={`${st.today.reviews} reviews done`}
        />
      </div>

      <div className="stat-grid">
        <StatCard
          label="Day streak"
          value={`${st.streak} 🔥`}
          sub={st.streak > 0 ? "Keep it going" : "Study to start"}
        />
        <StatCard
          label="Words started"
          value={`${st.seen}/${st.total}`}
          sub={`${Math.round((st.seen / Math.max(1, st.total)) * 100)}% of loaded levels`}
        />
        <StatCard label="Known well" value={st.learned} sub={`${sum.known} marked "never"`} />
        <StatCard label="Accuracy" value={`${st.accuracy}%`} sub={`${st.reviews} reviews total`} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Progress by level</h2>
          <button className="btn btn-ghost tiny-btn" onClick={onOpenLevels}>
            Change levels
          </button>
        </div>
        <div className="theme-grid">
          {Object.entries(ACTIVE_THEMES)
            .filter(([k]) => loaded.includes(k))
            .map(([key, meta]) => {
              const tp = store.topicProgress(key);
              const startedPct = Math.round((tp.started / tp.total) * 100);
              return (
                <button
                  className="theme-row"
                  key={key}
                  onClick={() => onStart({ themeOnly: key })}
                >
                  <span className="theme-icon">{meta.icon}</span>
                  <span className="theme-main">
                    <span className="theme-name">
                      {meta.label}{" "}
                      <span className="theme-pct">
                        {tp.started} started · {tp.pct}% mastered
                        {tp.known ? ` · ${tp.known} known` : ""}
                      </span>
                    </span>
                    <ProgressBar startedPct={startedPct} masteredPct={tp.pct} />
                  </span>
                  <span className="theme-count">
                    {tp.started}/{tp.total}
                  </span>
                </button>
              );
            })}

          {notLoaded.length > 0 && (
            <button className="theme-row add-more" onClick={onOpenLevels}>
              <span className="theme-icon">＋</span>
              <span className="theme-main">
                <span className="theme-name">
                  Load more levels{" "}
                  <span className="theme-pct">
                    {notLoaded.map((k) => ACTIVE_THEMES[k].label.split(" ")[0]).join(", ")}
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
