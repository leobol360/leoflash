import { useState } from "react";
import { ACTIVE_LEVELS } from "../data.js";
import { Store } from "../store.js";
import { useStore } from "../useStore.js";

export default function LevelPicker({ firstRun, onDone, onCancel }) {
  const store = useStore();
  const settings = store.settings();
  const initial = settings.enabledLevels || (settings.levelsChosen ? Object.keys(ACTIVE_LEVELS) : ["a1"]);
  const [chosen, setChosen] = useState(new Set(initial));
  const [name, setName] = useState(settings.name || "");
  // only ask for a name on a true first run — after a reset the name is kept
  const askName = firstRun && !settings.name;

  const toggle = (level) => {
    setChosen((prev) => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const nameOk = !askName || name.trim().length > 0;
  const canSave = chosen.size > 0 && nameOk;

  const save = () => {
    if (!canSave) return;
    const allLevelKeys = Object.keys(ACTIVE_LEVELS);
    const list = [...chosen];
    settings.enabledLevels = list.length === allLevelKeys.length ? null : list;
    settings.levelsChosen = true;
    if (askName) settings.name = name.trim();
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

        {askName && (
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
          {firstRun
            ? "Now pick the levels you want to study. "
            : "Pick one or more. "}
          Your progress is saved in this browser, so you can add levels later
          without losing anything.
        </p>

        <div className="level-list">
          {Object.entries(ACTIVE_LEVELS).map(([key, level]) => {
            const progress = store.levelProgress(key);
            return (
              <label className="level-row" key={key}>
                <input
                  type="checkbox"
                  checked={chosen.has(key)}
                  onChange={() => toggle(key)}
                />
                <span className="level-ic">{level.icon}</span>
                <span className="level-main">
                  <span className="level-name">{level.label}</span>
                  <span className="level-sub muted">
                    {progress.total} words
                    {progress.started ? ` · ${progress.started} started` : ""}
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
