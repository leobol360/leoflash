import { useRef } from "react";
import { ACTIVE_LEVELS } from "../data.js";
import { Store, todayStr } from "../store.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import { clamp } from "../format.js";

export default function Settings({ onOpenLevels, onRestored, onReset }) {
  const store = useStore();
  const settings = store.settings();
  const stats = store.stats();
  const fileInput = useRef(null);
  const allLevelKeys = Object.keys(ACTIVE_LEVELS);
  const enabledLevels = settings.enabledLevels || allLevelKeys;
  const idleDays = store.lastActivityDays();

  const update = (patch) => {
    Object.assign(settings, patch);
    Store.save();
  };

  const toggleLevel = (level) => {
    const chosen = new Set(enabledLevels);
    chosen.has(level) ? chosen.delete(level) : chosen.add(level);
    if (chosen.size === 0) return; // keep at least one
    const list = [...chosen];
    settings.enabledLevels = list.length === allLevelKeys.length ? null : list;
    settings.levelsChosen = true;
    Store.save();
  };

  const download = () => {
    const blob = new Blob([Store.exportJSON()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leoflash-backup-${todayStr()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const restore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importJSON(reader.result);
        alert("Backup restored. Your progress is back.");
        onRestored();
      } catch (err) {
        alert("Could not restore: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    if (confirm("Delete ALL progress and start over?")) {
      Store.reset();
      onReset();
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Settings</h2>

        <label className="field">
          <span>Your name</span>
          <input
            type="text"
            placeholder="Your name"
            maxLength={24}
            value={settings.name}
            onChange={(e) => update({ name: e.target.value })}
            onBlur={(e) => update({ name: e.target.value.trim() })}
          />
        </label>

        <label className="field">
          <span>
            New words per day
            <small className="field-hint">
              Your one dial. Reviews of words you already started are always
              included on top — the daily target adjusts automatically (
              {store.dailyGoal()} today).
            </small>
          </span>
          <input
            type="number"
            min="1"
            max="200"
            value={settings.newPerDay}
            onChange={(e) => update({ newPerDay: clamp(+e.target.value || 1, 1, 200) })}
          />
        </label>

        <label className="field">
          <span>Theme</span>
          <select value={settings.theme} onChange={(e) => update({ theme: e.target.value })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>

        <label className="field">
          <span>Accent colour</span>
          <select value={settings.accent} onChange={(e) => update({ accent: e.target.value })}>
            {["violet", "emerald", "sky", "amber", "rose"].map((color) => (
              <option value={color} key={color}>
                {color}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Pronunciation voice</span>
          <select value={settings.voice} onChange={(e) => update({ voice: e.target.value })}>
            <option value="">Auto (English)</option>
            {Speech.voices().map((voice) => (
              <option value={voice.name} key={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>

        <label className="field checkbox">
          <input
            type="checkbox"
            checked={settings.autoSpeak}
            onChange={(e) => update({ autoSpeak: e.target.checked })}
          />
          <span>Speak the word automatically on flashcards</span>
        </label>

        <h3>Levels loaded</h3>
        <p className="muted small">
          Which CEFR levels are in your study rotation. Adding a level loads its
          words; your history per word is kept either way.
        </p>
        <div className="topic-toggles">
          {Object.entries(ACTIVE_LEVELS).map(([key, level]) => (
            <label className="chip-toggle" key={key}>
              <input
                type="checkbox"
                checked={enabledLevels.includes(key)}
                onChange={() => toggleLevel(key)}
              />
              <span>
                {level.icon} {level.label}
              </span>
            </label>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={onOpenLevels}>
          Open level picker
        </button>

        <h3>Backup &amp; restore</h3>
        <p className="muted">
          Your progress lives in this browser only. Save a backup file now and
          then, or to move it to another device.
        </p>
        <div className="backup-row">
          <button className="btn" onClick={download}>
            ⬇︎ Download backup
          </button>
          <button className="btn" onClick={() => fileInput.current.click()}>
            ⬆︎ Restore from file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={restore}
          />
        </div>
        <p className="muted small">
          You have started {stats.seen} of {stats.total} words · {stats.reviews} reviews so
          far
          {idleDays == null
            ? ""
            : idleDays === 0
            ? " · studied today"
            : ` · last studied ${idleDays} day${idleDays === 1 ? "" : "s"} ago`}
        </p>

        <div className="danger-zone">
          <h3>Reset</h3>
          <p className="muted">
            This deletes all your progress, streak and stats. It cannot be undone.
          </p>
          <button className="btn btn-danger" onClick={reset}>
            Reset all progress
          </button>
        </div>
      </div>
    </div>
  );
}
