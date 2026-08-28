import { wordForms } from "../inflect.js";

// Compact table of a word's forms — verb conjugation or noun singular/plural.
export default function WordForms({ word, pos, onSpeak }) {
  const info = wordForms(word, pos);
  if (!info) return null;

  // Each row: [label, displayed value, text to speak (null = no audio)].
  const rows =
    info.kind === "verb"
      ? [
          ["base", info.forms.base, info.forms.base],
          ["3ª persona", info.forms.third, info.forms.third],
          ["pasado", info.forms.past, info.forms.past],
          ["participio", info.forms.participle, info.forms.participle],
          ["gerundio (-ing)", info.forms.gerund, info.forms.gerund],
        ]
      : info.forms.pluralOnly
      ? [["plural", `${info.forms.plural} (sustantivo plural)`, info.forms.plural]]
      : [
          ["singular", info.forms.singular, info.forms.singular],
          [
            "plural",
            info.forms.plural == null
              ? "— (incontable)"
              : info.forms.invariant
              ? `${info.forms.plural} (invariable)`
              : info.forms.plural,
            info.forms.plural,
          ],
        ];

  return (
    <div className={"word-forms wf-" + info.kind}>
      {rows.map(([label, value, speak]) => (
        <div className="wf-row" key={label}>
          <span className="wf-label">{label}</span>
          <span className="wf-value">
            {value}
            {onSpeak && speak && (
              <button
                type="button"
                className="wf-speak"
                title="Escuchar"
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeak(speak);
                }}
              >
                🔊
              </button>
            )}
          </span>
        </div>
      ))}
      {info.kind === "verb" && !info.forms.regular && (
        <p className="wf-note">verbo irregular</p>
      )}
    </div>
  );
}
