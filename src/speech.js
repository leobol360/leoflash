/* Text-to-speech via the Web Speech API.

   getVoices() returns everything the OS/browser has — dozens of accents
   plus macOS/Windows novelty and old "compact" voices that sound robotic
   (and whose names get localised, so "Good News" shows as "Buenas
   noticias"). For a learner only clear US / UK English is useful, so the
   list shown in Settings is an allow-list: right accent, known-decent
   voices only, best ones first. */
import { Store } from "./store.js";

// clearly-intelligible standard voices, by platform. Matched against the
// start of the voice name (locale suffixes like " (Enhanced)" are fine).
const ALLOW_VOICE =
  /^(samantha|alex|allison|ava|susan|zoe|nathan|tom|evan|daniel|arthur|kate|serena|oliver|stephanie|martha|jamie|nicky|aaron|siri|google (us|uk) english|microsoft \w+|english \((united states|united kingdom)\)|en-(us|gb))/i;

// the nicer end of that set — gets a ✨ in the picker
const GOOD_VOICE =
  /^(samantha|alex|ava|allison|siri|daniel|arthur|serena|kate|google (us|uk) english|microsoft (aria|jenny|guy|ana|andrew|emma|brian|christopher|michelle|roger|sonia|ryan|libby|thomas))/i;

// last-resort blocklist for the fallback path (English names only)
const JUNK_VOICE =
  /^(albert|bad news|bahh|bells|boing|bubbles|cellos|wobble|good news|jester|organ|pipe organ|superstar|trinoids|whisper|zarvox|deranged|hysterical|fred|ralph|kathy|princess|bruce|junior|agnes|victoria|vicki|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|eloquence)\b/i;

const normLang = (v) => (v.lang || "").replace("_", "-").toLowerCase();
const isUS = (v) => normLang(v).startsWith("en-us");
const isGB = (v) => normLang(v).startsWith("en-gb");

export const Speech = {
  _voices: [],

  init() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => { this._voices = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  },

  isRecommended(voice) {
    return voice.localService === false || GOOD_VOICE.test(voice.name);
  },

  accentOf(voice) {
    return isGB(voice) ? "gb" : "us";
  },

  // Curated list for the Settings picker.
  //   accent: "us" | "gb" | "any" (defaults to the saved preference)
  voices(accent = Store.settings().voiceAccent) {
    const english = this._voices.filter((v) => isUS(v) || isGB(v));

    // known-decent voices only
    let good = english.filter(
      (v) => this.isRecommended(v) || ALLOW_VOICE.test(v.name)
    );
    // if we recognised nothing on this device, show every non-novelty
    // en-US / en-GB voice rather than an empty picker
    if (good.length === 0) good = english.filter((v) => !JUNK_VOICE.test(v.name));
    // still nothing? take any English voice at all
    if (good.length === 0) {
      good = this._voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
    }

    let list = good;
    if (accent === "us") list = good.filter(isUS);
    else if (accent === "gb") list = good.filter(isGB);
    if (list.length === 0) list = good; // chosen accent had none — show both

    const score = (v) =>
      (GOOD_VOICE.test(v.name) ? 2 : 0) + (v.localService === false ? 1 : 0);
    return [...list].sort(
      (a, b) => score(b) - score(a) || a.name.localeCompare(b.name)
    );
  },

  say(text) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const list = this.voices();
    const pref = Store.settings().voice;
    u.voice = list.find((v) => v.name === pref) || list[0] || this._voices[0] || null;
    u.lang = (u.voice && u.voice.lang) || "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  },
};
