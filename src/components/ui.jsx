import { highlightParts } from "../format.js";
import { lookup } from "../glossary.js";

// Runs of English text where each known word gets a hover/tap tooltip
// with its Spanish translation.
export function Glossable({ text }) {
  if (!text) return null;
  const tokens = text.split(/(\s+)/);
  return (
    <>
      {tokens.map((tok, i) => {
        if (!/[a-zA-Z]/.test(tok)) return <span key={i}>{tok}</span>;
        const m = tok.match(/^([^a-zA-Z]*)(.*?)([^a-zA-Z]*)$/);
        const [, pre, core, post] = m;
        const hit = lookup(core);
        if (!hit) return <span key={i}>{tok}</span>;
        return (
          <span key={i}>
            {pre}
            <span className="gloss" tabIndex={0}>
              {core}
              <span className="gloss-tip" role="tooltip">
                {hit.es}
              </span>
            </span>
            {post}
          </span>
        );
      })}
    </>
  );
}

// Example sentence with the target word highlighted (or blanked out).
export function Sentence({ text, word, blank, gloss }) {
  const parts = highlightParts(text, word, blank);
  return (
    <>
      {parts.map((p, i) =>
        p.blank ? (
          <span key={i} className="blank">_____</span>
        ) : p.mark ? (
          <mark key={i}>{p.mark}</mark>
        ) : gloss ? (
          <Glossable key={i} text={p.text} />
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

// Example sentence in quotes with a "read it aloud" button.
export function Example({ text, word, onSpeak }) {
  return (
    <span className="ex-line">
      “<Sentence text={text} word={word} gloss />”
      {onSpeak && (
        <button
          type="button"
          className="ex-speak"
          title="Escuchar la frase"
          onClick={(e) => {
            e.stopPropagation();
            onSpeak(text);
          }}
        >
          🔊
        </button>
      )}
    </span>
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
