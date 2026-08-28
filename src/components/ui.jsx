import { highlightParts } from "../format.js";

// Example sentence with the target word highlighted (or blanked out).
export function Sentence({ text, word, blank }) {
  const parts = highlightParts(text, word, blank);
  return (
    <>
      {parts.map((p, i) =>
        p.blank ? (
          <span key={i} className="blank">_____</span>
        ) : p.mark ? (
          <mark key={i}>{p.mark}</mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

export function Ring({ value, max, label, sub }) {
  const p = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="hero-ring">
      <div className="ring" style={{ "--p": p }}>
        <span>
          {value}
          <small>/ {max}</small>
        </span>
      </div>
      <p className="muted center">
        {label}
        {sub != null && (
          <>
            <br />
            <span className="tiny">{sub}</span>
          </>
        )}
      </p>
    </div>
  );
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="stat card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub != null && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// two-tone progress bar: dim = started, bright = mastered
export function ProgressBar({ startedPct, masteredPct }) {
  return (
    <span className="bar">
      <span className="bar-seen" style={{ width: `${startedPct}%` }} />
      <span className="bar-known" style={{ width: `${masteredPct}%` }} />
    </span>
  );
}

export function SpeakButton({ text, className = "icon-btn", label = "🔊", onSpeak }) {
  return (
    <button
      type="button"
      className={className}
      title="Listen"
      onClick={() => onSpeak(text)}
    >
      {label}
    </button>
  );
}
