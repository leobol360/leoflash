import { useState } from "react";
import { ACTIVE_THEMES } from "../data.js";
import { Store } from "../store.js";
import { useStore } from "../useStore.js";

export default function LevelPicker({ firstRun, onDone, onCancel }) {
  const store = useStore();
  const s = store.settings();
  const initial = s.themesEnabled || (s.levelsChosen ? Object.keys(ACTIVE_THEMES) : ["a1"]);
  const [chosen, setChosen] = useState(new Set(initial));
  const [name, setName] = useState(s.name || "");

  const toggle = (k) => {
    setChosen((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const nameOk = !firstRun || name.trim().length > 0;
  const canSave = chosen.size > 0 && nameOk;

  const save = () => {
    if (!canSave) return;
    const all = Object.keys(ACTIVE_THEMES);
    const list = [...chosen];
    s.themesEnabled = list.length === all.length ? null : list;
    s.levelsChosen = true;
    if (firstRun) s.name = name.trim();
    Store.save();
    onDone();
  };

  return (
    <div className="page">
      <div className="card level-picker">
        <p className="eyebrow">CEFR · A1 → B2</p>
        <h1>
          {firstRun
            ? name.trim()
              ? `Welcome, ${name.trim()}!`
              : "Welcome to LeoFlash"
            : "Levels loaded into your study"}
        </h1>

        {firstRun && (
          <label className="name-field">
            <span>What should we call you? <em className="req">(required)</em></span>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              maxLength={24}
              autoComplete="off"
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}

        <p className="muted">
          {firstRun ? "Now pick the levels you want to load. " : "Pick one or more. "}
          The words come from your project's{" "}
          <code>data/vocab.&lt;level&gt;.json</code> files and go into this
          browser's storage, where your repetition history builds up. You can add
          levels later without losing progress.
        </p>

        <div className="level-list">
          {Object.entries(ACTIVE_THEMES).map(([k, meta]) => {
            const tp = store.topicProgress(k);
            return (
              <label className="level-row" key={k}>
                <input
                  type="checkbox"
                  checked={chosen.has(k)}
                  onChange={() => toggle(k)}
                />
                <span className="level-ic">{meta.icon}</span>
                <span className="level-main">
                  <span className="level-name">{meta.label}</span>
                  <span className="level-sub muted">
                    {tp.total} words
                    {tp.started ? ` · ${tp.started} started` : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="hero-actions">
          <button className="btn btn-primary big" onClick={save} disabled={!canSave}>
            {firstRun ? "Load and start" : "Save"}
          </button>
          {!firstRun && (
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
        {firstRun && !canSave && (
          <p className="muted small">
            {!nameOk ? "Enter your name to continue." : "Choose at least one level."}
          </p>
        )}
      </div>
    </div>
  );
}
