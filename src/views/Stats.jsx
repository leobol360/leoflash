import { VOCAB } from "../data.js";
import { useStore } from "../useStore.js";
import { StatCard } from "../components/ui.jsx";

// One level's completion row: a bar plus "N to go" / "complete".
function LevelRow({ row, noun }) {
  const startedPct = row.total ? (row.started / row.total) * 100 : 0;
  return (
    <div className="lvlp-row">
      <div className="lvlp-top">
        <span className="lvlp-name">
          {row.icon} {row.label}
        </span>
        <span className="lvlp-count">
          {row.mastered}/{row.total}
        </span>
      </div>
      <span className="bar">
        <span className="bar-seen" style={{ width: `${startedPct}%` }} />
        <span className="bar-known" style={{ width: `${row.pct}%` }} />
      </span>
      <span className="lvlp-note">
        {row.remaining === 0 ? (
          <b className="lvlp-done">✅ Level complete</b>
        ) : (
          <>
            <b>{row.remaining}</b> {noun}
            {row.remaining === 1 ? "" : "s"} to master · {row.pct}%
          </>
        )}
      </span>
    </div>
  );
}

function LevelCompletion({ title, rows, noun }) {
  if (rows.length === 0) return null;
  const mastered = rows.reduce((n, r) => n + r.mastered, 0);
  const total = rows.reduce((n, r) => n + r.total, 0);
  const remaining = total - mastered;
  return (
    <div className="card">
      <div className="card-head">
        <h2>{title}</h2>
        <span className="muted small">
          {mastered}/{total} mastered
        </span>
      </div>
      <p className="muted small">
        {remaining === 0
          ? `Every ${noun} in your loaded levels is mastered. 🎉`
          : `${remaining} ${noun}${remaining === 1 ? "" : "s"} left to finish your loaded levels.`}
      </p>
      <div className="lvlp-list">
        {rows.map((row) => (
          <LevelRow key={row.level} row={row} noun={noun} />
        ))}
      </div>
    </div>
  );
}

export default function Stats() {
  const store = useStore();
  const stats = store.stats();
  const practice = store.practiceSummary(35);
  const wordLevels = store.wordLevelProgress();
  const phraseLevels = store.phraseLevelProgress();
  const phraseTenses = store.phraseTenseProgress();

  const wordsMastered = wordLevels.reduce((n, r) => n + r.mastered, 0);
  const wordsTotal = wordLevels.reduce((n, r) => n + r.total, 0);
  const phrasesMastered = phraseLevels.reduce((n, r) => n + r.mastered, 0);
  const phrasesTotal = phraseLevels.reduce((n, r) => n + r.total, 0);

  const wordsPct = wordsTotal ? Math.round((wordsMastered / wordsTotal) * 100) : 0;
  const phrasesPct = phrasesTotal
    ? Math.round((phrasesMastered / phrasesTotal) * 100)
    : 0;

  // 14-day chart from the same calendar
  const chart = practice.calendar.slice(-14);
  const maxDay = Math.max(
    1,
    ...chart.map((d) => d.wordReviews + d.phraseReviews)
  );

  // which calendar cells are part of the ongoing streak (for the highlight)
  const streakCells = new Set();
  let left = practice.currentStreak;
  for (let i = practice.calendar.length - 1; i >= 0 && left > 0; i--) {
    if (practice.calendar[i].active) {
      streakCells.add(i);
      left--;
    } else if (i === practice.calendar.length - 1) {
      continue; // today, not practised yet
    } else break;
  }

  const scopeIds = new Set(
    VOCAB.filter((entry) => store.inScope(entry)).map((entry) => entry.id)
  );
  const leeches = Object.entries(store.data.cards)
    .filter(([id, card]) => card.lapses >= 2 && scopeIds.has(id))
    .map(([, card]) => card)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 12);

  return (
    <div className="page">
      {/* ---- what you've mastered ---- */}
      <div className="card">
        <h2>Mastered for good</h2>
        <div className="mastery-grid">
          <div className="mastery-cell">
            <div className="mastery-num">
              {wordsMastered}
              <small>/ {wordsTotal}</small>
            </div>
            <div className="mastery-label">words</div>
            <span className="bar">
              <span className="bar-known" style={{ width: `${wordsPct}%` }} />
            </span>
            <span className="muted tiny">{wordsPct}% · interval ≥ 21 days</span>
          </div>
          <div className="mastery-cell">
            <div className="mastery-num">
              {phrasesMastered}
              <small>/ {phrasesTotal}</small>
            </div>
            <div className="mastery-label">phrases</div>
            <span className="bar">
              <span className="bar-known" style={{ width: `${phrasesPct}%` }} />
            </span>
            <span className="muted tiny">{phrasesPct}% · parked or interval ≥ 21 days</span>
          </div>
        </div>
      </div>

      {/* ---- practice consistency ---- */}
      <div className="card streak-card">
        <div className="streak-big">
          <span className="streak-num">{practice.currentStreak}</span>
          <span className="streak-flame">🔥</span>
          <span className="streak-label">
            day{practice.currentStreak === 1 ? "" : "s"} in a row
            {!practice.practisedToday && practice.currentStreak > 0 && (
              <em className="streak-warn"> · practise today to keep it</em>
            )}
          </span>
        </div>

        <div className="streak-strip" title="last 35 days">
          {practice.calendar.map((day, i) => (
            <span
              key={day.day}
              className={
                "streak-cell" +
                (day.active ? " on" : "") +
                (streakCells.has(i) ? " run" : "")
              }
              title={`${day.day}: ${day.wordReviews} words · ${day.phraseReviews} phrases`}
            />
          ))}
        </div>

        <div className="stat-grid">
          <StatCard
            label="Practised"
            value={`${practice.activeInWindow}/${practice.windowDays}`}
            sub="last 35 days"
          />
          <StatCard
            label="Missed"
            value={practice.missedInWindow}
            sub="last 35 days"
          />
          <StatCard label="Best streak" value={`${practice.bestStreak} d`} />
          <StatCard label="Days practised" value={practice.daysPractised} sub="all time" />
        </div>
      </div>

      {/* ---- recent effort ---- */}
      <div className="card">
        <h2>Last 14 days</h2>
        <div className="chart">
          {chart.map((day) => {
            const total = day.wordReviews + day.phraseReviews;
            return (
              <div className="chart-col" key={day.day}>
                <div
                  className="chart-stack"
                  style={{ height: `${Math.round((total / maxDay) * 100)}%` }}
                  title={`${day.day}: ${day.wordReviews} words · ${day.phraseReviews} phrases`}
                >
                  {total === 0 ? (
                    <span className="chart-seg empty" style={{ flexGrow: 1 }} />
                  ) : (
                    <>
                      <span
                        className="chart-seg seg-phrase"
                        style={{ flexGrow: day.phraseReviews }}
                      />
                      <span
                        className="chart-seg seg-word"
                        style={{ flexGrow: day.wordReviews }}
                      />
                    </>
                  )}
                </div>
                <span className="chart-x">{day.day.slice(8)}</span>
              </div>
            );
          })}
        </div>
        <p className="muted small chart-legend">
          <span className="dot seg-word" /> words &nbsp;
          <span className="dot seg-phrase" /> phrases &nbsp;·&nbsp;
          {stats.reviews} word reviews all time · {stats.accuracy}% accuracy
        </p>
      </div>

      {/* ---- level completion ---- */}
      <LevelCompletion title="Words — level completion" rows={wordLevels} noun="word" />
      <LevelCompletion
        title="Phrases — level completion"
        rows={phraseLevels}
        noun="phrase"
      />

      {phraseTenses.length > 1 && (
        <div className="card">
          <div className="card-head">
            <h2>Phrases — grammatical tense</h2>
            <span className="muted small">mastered / total</span>
          </div>
          <div className="lvlp-list">
            {phraseTenses.map((row) => {
              const pct = row.total
                ? Math.round((row.mastered / row.total) * 100)
                : 0;
              return (
                <div className="lvlp-row" key={row.key}>
                  <div className="lvlp-top">
                    <span className="lvlp-name">{row.label}</span>
                    <span className="lvlp-count">
                      {row.mastered}/{row.total}
                    </span>
                  </div>
                  <span className="bar">
                    <span
                      className="bar-seen"
                      style={{ width: `${row.total ? (row.seen / row.total) * 100 : 0}%` }}
                    />
                    <span className="bar-known" style={{ width: `${pct}%` }} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- leeches ---- */}
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
