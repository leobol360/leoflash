import { useEffect, useRef, useState } from "react";
import { ACTIVE_LEVELS } from "../data.js";
import { Store, todayStr } from "../store.js";
import { useStore } from "../useStore.js";
import { Speech } from "../speech.js";
import { clamp } from "../format.js";
import { InstallPrompt } from "../install.js";

// "Add to Home Screen" button — native prompt where the browser allows it,
// short instructions where it doesn't (iOS, or before Chrome is ready).
function InstallButton() {
  const [, bump] = useState(0);
  useEffect(() => InstallPrompt.subscribe(() => bump((n) => n + 1)), []);

  if (InstallPrompt.isStandalone()) {
    return (
      <button className="btn" disabled>
        ✓ Added to Home Screen
      </button>
    );
  }

  const onClick = async () => {
    if (InstallPrompt.canPrompt()) {
      const outcome = await InstallPrompt.promptInstall();
      if (outcome === "unavailable") showHelp();
      return;
    }
    showHelp();
  };

  const showHelp = () => {
    if (InstallPrompt.isIOS()) {
      alert(
        "On iPhone / iPad:\n\n1. Tap the Share button  ⬆️  in Safari's toolbar\n2. Choose “Add to Home Screen”\n3. Tap “Add”\n\n(Apple doesn't let apps do this automatically.)"
      );
    } else {
      alert(
        "Open your browser menu (⋮) and choose “Add to Home screen” or “Install app”.\n\nIf you don't see it yet, use the app a little more and try again."
      );
    }
  };

  return (
    <button className="btn" onClick={onClick}>
      📲 Add to Home Screen
    </button>
  );
}

// A number setting you can fully clear while typing; on blur an empty or
// invalid field falls back to `fallback`, otherwise it's clamped to min..max.
function NumberField({ label, hint, value, min, max, fallback, onCommit }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    const next = Number.isFinite(n) ? clamp(n, min, max) : fallback;
    setText(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <label className="field">
      <span>
        {label}
        {hint && <small className="field-hint">{hint}</small>}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n) && n >= min && n <= max && n !== value) onCommit(n);
        }}
        onBlur={commit}
      />
    </label>
  );
}

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
    if (
      confirm(
        "Delete all your study progress and start over?\n\nYour name and preferences are kept; you'll be asked to pick your levels again."
      )
    ) {
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

        <NumberField
          label="New words per day"
          hint={
            <>
              Your daily target. <b>Due reviews always come first</b> and count
              toward it — new words only fill the slots left over. So on a heavy
              review day you'll get fewer new words (or none), and the app tells
              you when your reviews alone reach the target. A steady pace is
              10–20.
            </>
          }
          value={settings.newPerDay}
          min={1}
          max={200}
          fallback={20}
          onCommit={(newPerDay) => update({ newPerDay })}
        />

        <NumberField
          label="Phrases per day"
          hint={
            <>
              One number for phrases: your daily target on the <b>Phrases</b>{" "}
              screen, and how many a <b>Practice</b> round shows you (study then
              quiz). Due phrases come back for review on top, automatically; once
              you hit the target, <b>Quick 5</b> keeps you going.
            </>
          }
          value={settings.phrasesPerDay}
          min={1}
          max={50}
          fallback={10}
          onCommit={(phrasesPerDay) => update({ phrasesPerDay })}
        />

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
          <span>English accent</span>
          <select
            value={settings.voiceAccent}
            onChange={(e) => update({ voiceAccent: e.target.value, voice: "" })}
          >
            <option value="any">Either</option>
            <option value="us">American 🇺🇸</option>
            <option value="gb">British 🇬🇧</option>
          </select>
        </label>

        <label className="field">
          <span>
            Pronunciation voice
            <small className="field-hint">
              Only clear US / UK voices are listed; ✨ marks the best ones. The
              list depends on your device.
            </small>
          </span>
          <select value={settings.voice} onChange={(e) => update({ voice: e.target.value })}>
            <option value="">Auto (best available)</option>
            {Speech.voices().map((voice) => (
              <option value={voice.name} key={voice.name}>
                {Speech.accentOf(voice) === "gb" ? "🇬🇧" : "🇺🇸"} {voice.name}
                {Speech.isRecommended(voice) ? " ✨" : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn-ghost tiny-btn"
          style={{ marginTop: 10 }}
          onClick={() =>
            Speech.say(
              "Hi! This is how I sound. The quick brown fox jumps over the lazy dog."
            )
          }
        >
          🔊 Test voice
        </button>

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
            This deletes all your study progress, streak and stats, and clears
            your level selection. Your name and preferences stay. It cannot be
            undone.
          </p>
          <div className="backup-row">
            <InstallButton />
            <button className="btn btn-danger" onClick={reset}>
              Reset all progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
