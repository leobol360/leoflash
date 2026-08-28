import { useRef } from "react";
import { ACTIVE_THEMES } from "../data.js";
import { Store, srsUtil } from "../store.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import { clamp } from "../format.js";

export default function Settings({ onOpenLevels, onRestored, onReset }) {
  const store = useStore();
  const s = store.settings();
  const st = store.stats();
  const fileRef = useRef(null);
  const themeKeys = Object.keys(ACTIVE_THEMES);
  const enabled = s.themesEnabled || themeKeys;
  const idle = store.lastActivityDays();

  const set = (patch) => {
    Object.assign(s, patch);
    Store.save();
  };

  const toggleLevel = (k) => {
    const chosen = new Set(enabled);
    chosen.has(k) ? chosen.delete(k) : chosen.add(k);
    if (chosen.size === 0) return; // keep at least one
    const list = [...chosen];
    s.themesEnabled = list.length === themeKeys.length ? null : list;
    s.levelsChosen = true;
    Store.save();
  };

  const download = () => {
    const blob = new Blob([Store.exportBlob()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leoflash-backup-${srsUtil.todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
            value={s.name}
            onChange={(e) => set({ name: e.target.value })}
            onBlur={(e) => set({ name: e.target.value.trim() })}
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
            value={s.newPerDay}
            onChange={(e) => set({ newPerDay: clamp(+e.target.value || 1, 1, 200) })}
          />
        </label>

        <label className="field">
          <span>Theme</span>
          <select value={s.theme} onChange={(e) => set({ theme: e.target.value })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>

        <label className="field">
          <span>Accent colour</span>
          <select value={s.accent} onChange={(e) => set({ accent: e.target.value })}>
            {["violet", "emerald", "sky", "amber", "rose"].map((a) => (
              <option value={a} key={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Pronunciation voice</span>
          <select value={s.voice} onChange={(e) => set({ voice: e.target.value })}>
            <option value="">Auto (English)</option>
            {Speech.voices().map((v) => (
              <option value={v.name} key={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>

        <label className="field checkbox">
          <input
            type="checkbox"
            checked={s.autoSpeak}
            onChange={(e) => set({ autoSpeak: e.target.checked })}
          />
          <span>Speak the word automatically on flashcards</span>
        </label>

        <h3>Levels loaded</h3>
        <p className="muted small">
          Which CEFR levels are in your study rotation. Adding a level loads its
          words; your history per word is kept either way.
        </p>
        <div className="topic-toggles">
          {Object.entries(ACTIVE_THEMES).map(([k, m]) => (
            <label className="chip-toggle" key={k}>
              <input
                type="checkbox"
                checked={enabled.includes(k)}
                onChange={() => toggleLevel(k)}
              />
              <span>
                {m.icon} {m.label}
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
          <button className="btn" onClick={() => fileRef.current.click()}>
            ⬆︎ Restore from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={restore}
          />
        </div>
        <p className="muted small">
          You have started {st.seen} of {st.total} words · {st.reviews} reviews so
          far
          {idle == null
            ? ""
            : idle === 0
            ? " · studied today"
            : ` · last studied ${idle} day${idle === 1 ? "" : "s"} ago`}
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
