import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { Store } from "./store.js";
import { Speech } from "./speech.js";
import App from "./App.jsx";

Store.load();
Speech.init();

// register the minimal service worker so the app is installable to the
// home screen (see public/sw.js — it caches nothing)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
