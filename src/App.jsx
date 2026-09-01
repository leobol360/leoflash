import { useEffect, useState } from "react";
import { Store } from "./store.js";
import { useStore } from "./useStore.js";
import { buildSessionQueue } from "./session.js";
import Home from "./views/Home.jsx";
import Study from "./views/Study.jsx";
import Stats from "./views/Stats.jsx";
import Grammar from "./views/Grammar.jsx";
import Phrases from "./views/Phrases.jsx";
import Settings from "./views/Settings.jsx";
import LevelPicker from "./views/LevelPicker.jsx";

const NAV = [
  { id: "home", label: "Cards", icon: "🃏" },
  { id: "phrases", label: "Phrases", icon: "💬" },
  { id: "grammar", label: "Grammar", icon: "📖" },
  { id: "stats", label: "Stats", icon: "📈" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

const VIEWS = ["home", "phrases", "grammar", "stats", "settings"];

export default function App() {
  const store = useStore();
  const settings = store.settings();
  const [view, setView] = useState(() => {
    const hash = location.hash.replace("#", "");
    return VIEWS.includes(hash) ? hash : "home";
  });
  const [session, setSession] = useState(null); // { queue, key } | null
  const [pickingLevels, setPickingLevels] = useState(false);

  // keep <html> theme attributes in sync
  useEffect(() => {
    document.documentElement.dataset.appTheme = settings.theme;
    document.documentElement.dataset.accent = settings.accent;
  }, [settings.theme, settings.accent]);

  // simple hash routing for the top-level views
  useEffect(() => {
    const onHashChange = () => {
      const hash = location.hash.replace("#", "");
      if (VIEWS.includes(hash)) {
        setSession(null);
        setPickingLevels(false);
        setView(hash);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (nextView) => {
    setSession(null);
    setPickingLevels(false);
    setView(nextView);
    if (VIEWS.includes(nextView)) location.hash = nextView;
  };

  const startSession = (opts) => {
    const queue = buildSessionQueue(opts);
    if (queue.length === 0) {
      const summary = Store.dueSummary();
      alert(
        summary.newLeft === 0 && summary.unseen > 0
          ? "That's today's new-word batch done, and nothing is due right now. Come back later for reviews, or raise \"New words per day\" in Settings."
          : "You've studied every word in your loaded levels. Add another level in the level picker, or come back when reviews are due."
      );
      return;
    }
    setPickingLevels(false);
    setSession({ queue, key: Date.now() });
    setView("study");
  };

  // first run: force the level picker
  const needsLevels = !settings.levelsChosen;

  let screen;
  if (needsLevels) {
    screen = <LevelPicker firstRun onDone={() => navigate("home")} />;
  } else if (pickingLevels) {
    screen = (
      <LevelPicker
        onDone={() => setPickingLevels(false)}
        onCancel={() => setPickingLevels(false)}
      />
    );
  } else if (view === "study" && session) {
    screen = (
      <Study
        key={session.key}
        queue={session.queue}
        onExit={() => navigate("home")}
        onKeepGoing={(opts) => startSession(opts || {})}
      />
    );
  } else if (view === "stats") {
    screen = <Stats />;
  } else if (view === "grammar") {
    screen = <Grammar />;
  } else if (view === "phrases") {
    screen = <Phrases />;
  } else if (view === "settings") {
    screen = (
      <Settings
        onOpenLevels={() => setPickingLevels(true)}
        onRestored={() => navigate("home")}
        onReset={() => navigate("home")}
      />
    );
  } else {
    screen = <Home onStart={startSession} onOpenLevels={() => setPickingLevels(true)} />;
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
            {NAV.map((item) => (
              <button
                key={item.id}
                className={"nav-btn" + (activeNav === item.id ? " active" : "")}
                onClick={() => navigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>
      )}

      <main>
        {screen}
        {showNav && (
          <footer className="site-credit">
            <span className="site-credit-name">LeoFlash</span>
            <span>© {new Date().getFullYear()} Leonardo Pineda · Todos los derechos reservados.</span>
            <span>
              Creado por Leonardo Pineda en colaboración con Claude (Anthropic).
            </span>
          </footer>
        )}
      </main>

      {showNav && (
        <nav className="tabbar">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={"nav-btn" + (activeNav === item.id ? " active" : "")}
              onClick={() => navigate(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
