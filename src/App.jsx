import { useEffect, useState } from "react";
import { Store } from "./store.js";
import { useStore } from "./useStore.js";
import { buildSessionQueue } from "./session.js";
import Home from "./views/Home.jsx";
import Study from "./views/Study.jsx";
import Stats from "./views/Stats.jsx";
import Browse from "./views/Browse.jsx";
import Grammar from "./views/Grammar.jsx";
import Settings from "./views/Settings.jsx";
import LevelPicker from "./views/LevelPicker.jsx";

const NAV = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "browse", label: "Deck", icon: "📚" },
  { id: "grammar", label: "Grammar", icon: "📖" },
  { id: "stats", label: "Stats", icon: "📈" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function App() {
  const store = useStore();
  const s = store.settings();
  const VIEWS = ["home", "browse", "grammar", "stats", "settings"];
  const [view, setView] = useState(() => {
    const h = location.hash.replace("#", "");
    return VIEWS.includes(h) ? h : "home";
  });
  const [session, setSession] = useState(null); // { queue, key } | null
  const [pickingLevels, setPickingLevels] = useState(false);

  // keep <html> theme attributes in sync
  useEffect(() => {
    document.documentElement.dataset.appTheme = s.theme;
    document.documentElement.dataset.accent = s.accent;
  }, [s.theme, s.accent]);

  // simple hash routing for the top-level views
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace("#", "");
      if (VIEWS.includes(h)) {
        setSession(null);
        setPickingLevels(false);
        setView(h);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (v) => {
    setSession(null);
    setPickingLevels(false);
    setView(v);
    if (VIEWS.includes(v)) location.hash = v;
  };

  const startSession = (opts) => {
    const q = buildSessionQueue(opts);
    if (q.length === 0) {
      alert(
        "You've studied every word in your loaded levels. Add another level in the level picker, or come back when reviews are due."
      );
      return;
    }
    setPickingLevels(false);
    setSession({ queue: q, key: Date.now() });
    setView("study");
  };

  // first run: force the level picker
  const needsLevels = !s.levelsChosen;

  let body;
  if (needsLevels) {
    body = <LevelPicker firstRun onDone={() => go("home")} />;
  } else if (pickingLevels) {
    body = (
      <LevelPicker
        onDone={() => setPickingLevels(false)}
        onCancel={() => setPickingLevels(false)}
      />
    );
  } else if (view === "study" && session) {
    body = (
      <Study
        key={session.key}
        queue={session.queue}
        onExit={() => go("home")}
        onKeepGoing={(opts) => startSession(opts || {})}
      />
    );
  } else if (view === "stats") {
    body = <Stats />;
  } else if (view === "browse") {
    body = <Browse onOpenLevels={() => setPickingLevels(true)} />;
  } else if (view === "grammar") {
    body = <Grammar />;
  } else if (view === "settings") {
    body = (
      <Settings
        onOpenLevels={() => setPickingLevels(true)}
        onRestored={() => go("home")}
        onReset={() => go("home")}
      />
    );
  } else {
    body = <Home onStart={startSession} onOpenLevels={() => setPickingLevels(true)} />;
  }

  const showNav = !needsLevels;
  const activeNav = pickingLevels ? "" : view;

  return (
    <div id="app">
      {showNav && (
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">🦁</span>
            <span className="brand-name">
              Leo<b>Flash</b>
            </span>
          </div>
          <nav className="nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={"nav-btn" + (activeNav === n.id ? " active" : "")}
                onClick={() => go(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </header>
      )}

      <main>{body}</main>

      {showNav && (
        <nav className="tabbar">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={"nav-btn" + (activeNav === n.id ? " active" : "")}
              onClick={() => go(n.id)}
            >
              <span>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
