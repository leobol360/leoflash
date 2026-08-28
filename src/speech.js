/* Text-to-speech via the Web Speech API. */
import { Store } from "./store.js";

export const Speech = {
  _voices: [],

  init() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => { this._voices = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  },

  voices() {
    return this._voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  },

  say(text) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const pref = Store.settings().voice;
    const list = this.voices();
    u.voice =
      list.find((v) => v.name === pref) ||
      list.find((v) => /GB|UK/i.test(v.lang)) ||
      list[0] ||
      null;
    u.lang = (u.voice && u.voice.lang) || "en-GB";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  },
};
