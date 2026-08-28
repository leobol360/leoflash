import { wordForms } from "../inflect.js";

// Compact table of a word's forms — verb conjugation or noun singular/plural.
export default function WordForms({ word, pos, onSpeak }) {
  const info = wordForms(word, pos);
  if (!info) return null;

  const rows =
    info.kind === "verb"
      ? [
          ["base", info.forms.base],
          ["3ª persona", info.forms.third],
          ["pasado", info.forms.past],
          ["participio", info.forms.participle],
          ["gerundio (-ing)", info.forms.gerund],
        ]
      : info.forms.pluralOnly
      ? [["plural", `${info.forms.plural} (sustantivo plural)`]]
      : [
          ["singular", info.forms.singular],
          [
            "plural",
            info.forms.plural == null
              ? "— (incontable)"
              : info.forms.invariant
              ? `${info.forms.plural} (invariable)`
              : info.forms.plural,
          ],
        ];

  return (
    <div className={"word-forms wf-" + info.kind}>
      {rows.map(([label, value]) => (
        <div className="wf-row" key={label}>
          <span className="wf-label">{label}</span>
          <span className="wf-value">
            {value}
            {onSpeak && value && !value.includes(" ") && value !== "—" && (
              <button
                type="button"
                className="wf-speak"
                title="Escuchar"
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeak(value);
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
