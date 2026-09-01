import { useState } from "react";
import { ACTIVE_LEVELS } from "../data.js";
import { useStore } from "../useStore.js";
import { Ring, StatCard, ProgressBar } from "../components/ui.jsx";
import DeckTable from "./DeckTable.jsx";

export default function Home({ onStart, onOpenLevels }) {
  const store = useStore();
  const [deckOpen, setDeckOpen] = useState(false);
  const settings = store.settings();
  const stats = store.stats();
  const summary = store.dueSummary();
  const loadedLevels = settings.enabledLevels || Object.keys(ACTIVE_LEVELS);

  const eyebrow =
    loadedLevels.filter((key) => key !== "software").map((key) => key.toUpperCase()).join(" · ") || "CEFR";

  const notLoadedLevels = Object.keys(ACTIVE_LEVELS).filter((key) => !loadedLevels.includes(key));

  // Just the daily session: "Start studying" until today's reviews are
  // cleared and the new-word count is met. Then the button disappears and
  // the day's challenge is done — nothing to pull forward.
  const newWordsLeft = summary.newLeft > 0 && summary.unseen > 0;
  const dailyWorkLeft = summary.due > 0 || newWordsLeft;
  const challengeDone = summary.newLeft === 0 && summary.due === 0;

  let action = null;
  if (dailyWorkLeft) {
    action = { label: "Start studying", run: () => onStart({}) };
  } else if (!challengeDone && notLoadedLevels.length > 0) {
    action = { label: "Load a level", run: onOpenLevels };
  }

  let statusLine;
  if (dailyWorkLeft && summary.reviewBacklog) {
    statusLine = (
      <>
        ⚠️ {summary.due} reviews due — about {Math.round(summary.due / summary.goal)}×
        your daily goal of {summary.goal}. Your review backlog is growing: raise{" "}
        <b>New words per day</b> in Settings, or fit in an extra session to catch
        up.
      </>
    );
  } else if (dailyWorkLeft && summary.reviewsFillGoal) {
    statusLine = (
      <>
        🔁 {summary.due} review{summary.due === 1 ? "" : "s"} due — that fills
        today's goal, so no new words yet. Clear them (or raise{" "}
        <b>New words per day</b>) to add new words again.
      </>
    );
  } else if (dailyWorkLeft) {
    const parts = [];
    if (summary.due > 0)
      parts.push(`${summary.due} card${summary.due === 1 ? "" : "s"} to review`);
    if (newWordsLeft)
      parts.push(`${summary.newLeft} new word${summary.newLeft === 1 ? "" : "s"} today`);
    statusLine = <>{parts.join(" · ")}.</>;
  } else if (challengeDone) {
    statusLine = (
      <>
        🎉 Day complete{settings.name ? `, ${settings.name}` : ""}! Every review
        is cleared and you've hit today's goal of {settings.newPerDay}.{" "}
        {stats.streak > 0 ? (
          <>Come back tomorrow to keep your {stats.streak}-day streak 🔥</>
        ) : (
          <>See you tomorrow 🌱</>
        )}
      </>
    );
  } else {
    statusLine = (
      <>🌱 You've studied every word in your loaded levels — load another, or come back tomorrow.</>
    );
  }

  return (
    <div className="page">
      <div className="hero card">
        <div className="hero-left">
          <p className="eyebrow">{eyebrow} · Vocabulary trainer</p>
          <h1>
            {challengeDone
              ? settings.name
                ? `Nice work today, ${settings.name}!`
                : "Nice work today!"
              : settings.name
              ? `Ready for today's practice, ${settings.name}?`
              : "Ready for today's practice?"}
          </h1>
          <p className="muted">{statusLine}</p>
          {action && (
            <div className="hero-actions">
              <button className="btn btn-primary big" onClick={action.run}>
                {action.label}
              </button>
            </div>
          )}
        </div>
        <Ring
          value={Math.min(settings.newPerDay, stats.today.reviews)}
          max={settings.newPerDay}
          label="Today's goal"
          sub={`${stats.today.newSeen} new · ${
            stats.today.reviews - stats.today.newSeen
          } reviews`}
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

      <div className={"gr-card" + (deckOpen ? " open" : "")}>
        <button className="gr-head" onClick={() => setDeckOpen((v) => !v)}>
          <span className="gr-title">
            Deck
            <span className="gr-es"> · {stats.total} words · remove any you don't want</span>
          </span>
          <span className="gr-caret">{deckOpen ? "▲" : "▼"}</span>
        </button>
        {deckOpen && (
          <div className="gr-body">
            <DeckTable onOpenLevels={onOpenLevels} />
          </div>
        )}
      </div>
    </div>
  );
}
