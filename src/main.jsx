import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { Store } from "./store.js";
import { Speech } from "./speech.js";
import App from "./App.jsx";

Store.load();
Speech.init();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
