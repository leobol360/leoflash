/* ============================================================
   English inflection — verb conjugation and noun plurals.
   Regular rules + tables of irregulars. Used to show every
   form of a word on its flashcard.
   ============================================================ */

// base -> [past simple, past participle]  (3rd person / -ing are handled
// separately since they are regular even for most irregular verbs)
const IRREGULAR_VERBS = {
  be: ["was / were", "been"],
  have: ["had", "had"],
  do: ["did", "done"],
  say: ["said", "said"],
  go: ["went", "gone"],
  get: ["got", "got / gotten"],
  make: ["made", "made"],
  know: ["knew", "known"],
  think: ["thought", "thought"],
  take: ["took", "taken"],
  see: ["saw", "seen"],
  come: ["came", "come"],
  give: ["gave", "given"],
  find: ["found", "found"],
  tell: ["told", "told"],
  feel: ["felt", "felt"],
  leave: ["left", "left"],
  become: ["became", "become"],
  mean: ["meant", "meant"],
  keep: ["kept", "kept"],
  let: ["let", "let"],
  begin: ["began", "begun"],
  show: ["showed", "shown"],
  hear: ["heard", "heard"],
  run: ["ran", "run"],
  bring: ["brought", "brought"],
  write: ["wrote", "written"],
  sit: ["sat", "sat"],
  stand: ["stood", "stood"],
  lose: ["lost", "lost"],
  pay: ["paid", "paid"],
  meet: ["met", "met"],
  set: ["set", "set"],
  lead: ["led", "led"],
  understand: ["understood", "understood"],
  speak: ["spoke", "spoken"],
  read: ["read", "read"],
  spend: ["spent", "spent"],
  grow: ["grew", "grown"],
  win: ["won", "won"],
  buy: ["bought", "bought"],
  send: ["sent", "sent"],
  build: ["built", "built"],
  fall: ["fell", "fallen"],
  cut: ["cut", "cut"],
  sell: ["sold", "sold"],
  break: ["broke", "broken"],
  hit: ["hit", "hit"],
  eat: ["ate", "eaten"],
  catch: ["caught", "caught"],
  draw: ["drew", "drawn"],
  choose: ["chose", "chosen"],
  throw: ["threw", "thrown"],
  fly: ["flew", "flown"],
  drive: ["drove", "driven"],
  stick: ["stuck", "stuck"],
  teach: ["taught", "taught"],
  wear: ["wore", "worn"],
  put: ["put", "put"],
  cost: ["cost", "cost"],
  hold: ["held", "held"],
  hurt: ["hurt", "hurt"],
  shut: ["shut", "shut"],
  quit: ["quit", "quit"],
  bet: ["bet", "bet"],
  rid: ["rid", "rid"],
  shed: ["shed", "shed"],
  spread: ["spread", "spread"],
  burst: ["burst", "burst"],
  cast: ["cast", "cast"],
  bend: ["bent", "bent"],
  bite: ["bit", "bitten"],
  bleed: ["bled", "bled"],
  blow: ["blew", "blown"],
  breed: ["bred", "bred"],
  cling: ["clung", "clung"],
  creep: ["crept", "crept"],
  deal: ["dealt", "dealt"],
  dig: ["dug", "dug"],
  dream: ["dreamt / dreamed", "dreamt / dreamed"],
  drink: ["drank", "drunk"],
  feed: ["fed", "fed"],
  fight: ["fought", "fought"],
  flee: ["fled", "fled"],
  fling: ["flung", "flung"],
  forbid: ["forbade", "forbidden"],
  forget: ["forgot", "forgotten"],
  forgive: ["forgave", "forgiven"],
  forgo: ["forwent", "forgone"],
  forsake: ["forsook", "forsaken"],
  freeze: ["froze", "frozen"],
  grind: ["ground", "ground"],
  hang: ["hung", "hung"],
  hide: ["hid", "hidden"],
  kneel: ["knelt / kneeled", "knelt / kneeled"],
  lay: ["laid", "laid"],
  lean: ["leant / leaned", "leant / leaned"],
  leap: ["leapt / leaped", "leapt / leaped"],
  learn: ["learnt / learned", "learnt / learned"],
  lend: ["lent", "lent"],
  lie: ["lay", "lain"],
  light: ["lit / lighted", "lit / lighted"],
  mistake: ["mistook", "mistaken"],
  overcome: ["overcame", "overcome"],
  overhear: ["overheard", "overheard"],
  overtake: ["overtook", "overtaken"],
  overthrow: ["overthrew", "overthrown"],
  ride: ["rode", "ridden"],
  ring: ["rang", "rung"],
  rise: ["rose", "risen"],
  seek: ["sought", "sought"],
  shake: ["shook", "shaken"],
  shine: ["shone", "shone"],
  shoot: ["shot", "shot"],
  shrink: ["shrank", "shrunk"],
  sing: ["sang", "sung"],
  sink: ["sank", "sunk"],
  sleep: ["slept", "slept"],
  slide: ["slid", "slid"],
  speed: ["sped", "sped"],
  spell: ["spelt / spelled", "spelt / spelled"],
  spill: ["spilt / spilled", "spilt / spilled"],
  spin: ["spun", "spun"],
  spit: ["spat", "spat"],
  split: ["split", "split"],
  spring: ["sprang", "sprung"],
  steal: ["stole", "stolen"],
  sting: ["stung", "stung"],
  stride: ["strode", "stridden"],
  strike: ["struck", "struck"],
  swear: ["swore", "sworn"],
  sweep: ["swept", "swept"],
  swim: ["swam", "swum"],
  swing: ["swung", "swung"],
  tear: ["tore", "torn"],
  thrust: ["thrust", "thrust"],
  tread: ["trod", "trodden"],
  undergo: ["underwent", "undergone"],
  undertake: ["undertook", "undertaken"],
  undo: ["undid", "undone"],
  upset: ["upset", "upset"],
  wake: ["woke", "woken"],
  weave: ["wove", "woven"],
  weep: ["wept", "wept"],
  wet: ["wet / wetted", "wet / wetted"],
  wind: ["wound", "wound"],
  withdraw: ["withdrew", "withdrawn"],
  withstand: ["withstood", "withstood"],
  wring: ["wrung", "wrung"],
};

// irregular / special 3rd-person-singular forms
const IRREGULAR_THIRD = { be: "is", have: "has", do: "does", go: "goes" };
// irregular / special -ing forms
const IRREGULAR_GERUND = { be: "being", lie: "lying", die: "dying", tie: "tying" };

// multi-syllable verbs that still double the final consonant (BrE also -l)
const DOUBLERS = new Set([
  "prefer", "occur", "refer", "admit", "permit", "commit", "control", "equip",
  "regret", "transfer", "propel", "compel", "deter", "incur", "recur", "submit",
  "omit", "transmit", "patrol", "rebel", "repel", "expel", "acquit",
  "begin", "forget", "upset", "reset", "offset", "overrun",
  "travel", "cancel", "label", "signal", "model", "quarrel", "marvel", "fulfil",
]);

const VOWELS = "aeiou";
const isVowel = (c) => VOWELS.includes(c);

function endsWithSibilant(w) {
  return /(s|x|z|sh|ch)$/.test(w) || /(ss)$/.test(w);
}

// one-syllable CVC that should double (run, stop, sit) — final letter not w/x/y
function doublesFinalConsonant(w) {
  if (DOUBLERS.has(w)) return true;
  if (w.length < 3) return false;
  const [a, b, c] = w.slice(-3);
  const cvc = !isVowel(a) && isVowel(b) && !isVowel(c) && !"wxy".includes(c);
  if (!cvc) return false;
  // crude one-syllable check: no vowel before the last CVC block
  return !/[aeiou]/.test(w.slice(0, -3));
}

export function thirdPerson(base) {
  if (IRREGULAR_THIRD[base]) return IRREGULAR_THIRD[base];
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
  if (endsWithSibilant(base) || /[^aeiou]o$/.test(base)) return base + "es";
  return base + "s";
}

export function gerund(base) {
  if (IRREGULAR_GERUND[base]) return IRREGULAR_GERUND[base];
  if (base.endsWith("ie")) return base.slice(0, -2) + "ying";
  if (base.endsWith("ee") || base.endsWith("oe") || base.endsWith("ye"))
    return base + "ing";
  if (base.endsWith("e") && base.length > 2) return base.slice(0, -1) + "ing";
  if (doublesFinalConsonant(base)) return base + base.slice(-1) + "ing";
  return base + "ing";
}

function regularPast(base) {
  if (base.endsWith("e")) return base + "d";
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ied";
  if (doublesFinalConsonant(base)) return base + base.slice(-1) + "ed";
  return base + "ed";
}

// { base, third, past, participle, gerund, regular }
export function verbForms(base) {
  const b = base.toLowerCase().trim();
  if (b.includes(" ") || b.includes("-")) return null; // phrasal / compound
  const irr = IRREGULAR_VERBS[b];
  const past = irr ? irr[0] : regularPast(b);
  const participle = irr ? irr[1] : regularPast(b);
  return {
    base: b,
    third: thirdPerson(b),
    past,
    participle,
    gerund: gerund(b),
    regular: !irr,
  };
}

/* ---------------- NOUNS ---------------- */

const IRREGULAR_PLURALS = {
  child: "children", person: "people", man: "men", woman: "women",
  foot: "feet", tooth: "teeth", goose: "geese", mouse: "mice",
  louse: "lice", ox: "oxen",
  knife: "knives", wife: "wives", life: "lives", leaf: "leaves",
  half: "halves", shelf: "shelves", wolf: "wolves", thief: "thieves",
  loaf: "loaves", calf: "calves", self: "selves", scarf: "scarves",
  analysis: "analyses", basis: "bases", crisis: "crises", thesis: "theses",
  hypothesis: "hypotheses", diagnosis: "diagnoses", oasis: "oases",
  phenomenon: "phenomena", criterion: "criteria",
  datum: "data", medium: "media", bacterium: "bacteria",
  curriculum: "curricula", cactus: "cacti", fungus: "fungi",
  nucleus: "nuclei", stimulus: "stimuli", radius: "radii",
  syllabus: "syllabuses", index: "indexes", appendix: "appendices",
  potato: "potatoes", tomato: "tomatoes", hero: "heroes", echo: "echoes",
};

// same in singular and plural
const INVARIANT_NOUNS = new Set([
  "sheep", "deer", "fish", "species", "series", "aircraft", "means",
  "offspring", "salmon", "trout", "moose", "swine",
]);

// nouns that are already plural in form (no singular, or a different one)
const PLURAL_NOUNS = new Set([
  "police", "cattle", "folk", "clothes", "scissors", "jeans", "trousers",
  "glasses", "pyjamas", "shorts", "stairs", "goods", "savings", "belongings",
  "surroundings", "outskirts", "headquarters", "thanks", "arrivals",
  "premises", "proceeds", "remains",
]);
const PLURAL_OF = { people: "person" };

// uncountable — no plural
const UNCOUNTABLE_NOUNS = new Set([
  "water", "milk", "coffee", "tea", "juice", "bread", "rice", "pasta", "sugar",
  "salt", "pepper", "oil", "butter", "flour", "cheese", "meat", "beef", "pork",
  "bacon", "ham", "fruit", "spinach", "garlic", "seasoning", "dressing", "jam",
  "honey", "vinegar", "spice", "dough", "cereal", "soup", "stew", "money",
  "cash", "wealth", "poverty", "debt", "credit", "income", "information",
  "advice", "news", "knowledge", "research", "progress", "evidence",
  "furniture", "luggage", "equipment", "homework", "traffic", "weather",
  "music", "art", "poetry", "literature", "fiction", "vocabulary", "grammar",
  "software", "hardware", "data", "stuff", "feedback", "damage", "harm",
  "fun", "luck", "help", "love", "happiness", "sadness", "anger", "fear",
  "hope", "pride", "courage", "patience", "honesty", "freedom", "peace",
  "silence", "darkness", "sunlight", "thunder", "lightning", "rain", "snow",
  "wind", "fog", "ice", "heat", "air", "smoke", "steam", "gas", "sand",
  "dust", "grass", "hair", "mud", "oxygen", "hydrogen", "carbon", "nitrogen",
  "radiation", "gravity", "friction", "momentum", "inflation", "electricity",
  "energy", "pollution", "sewage", "sustainability", "biodiversity",
  "deforestation", "erosion", "irrigation", "tourism", "wilderness",
  "wildlife", "cotton", "wool", "leather", "wood", "metal", "gold", "silver",
  "plastic", "clothing", "jewellery", "makeup", "rubbish", "transport",
  "accommodation", "permission", "recognition", "reputation", "importance",
  "existence", "intelligence", "confidence", "guilt", "shame", "stress",
  "tension", "sympathy", "empathy", "enthusiasm", "curiosity", "wisdom",
  "laughter", "applause", "nonsense", "warmth", "comfort", "safety",
]);

// { singular, plural }  or null
export function nounForms(base) {
  const b = base.toLowerCase().trim();
  if (b.includes(" ") || b.includes("-")) return null;
  if (PLURAL_OF[b]) return { singular: PLURAL_OF[b], plural: b };
  if (PLURAL_NOUNS.has(b)) return { singular: null, plural: b, pluralOnly: true };
  if (UNCOUNTABLE_NOUNS.has(b)) return { singular: b, plural: null };
  if (INVARIANT_NOUNS.has(b)) return { singular: b, plural: b };
  const irr = IRREGULAR_PLURALS[b];
  if (irr) return { singular: b, plural: irr };
  let plural;
  if (/[^aeiou]y$/.test(b)) plural = b.slice(0, -1) + "ies";
  else if (/(s|x|z|sh|ch)$/.test(b) || /ss$/.test(b)) plural = b + "es";
  else if (/[^aeiou]o$/.test(b)) plural = b + "s"; // photo, piano, zoo, radio…
  else if (/(f|fe)$/.test(b) && !/(ff|ief|oof|eef|urf|arf)$/.test(b))
    plural = b.replace(/fe?$/, "ves");
  else plural = b + "s";
  return { singular: b, plural };
}

// primary part of speech from a "noun/verb" style string
export function primaryPos(pos) {
  return (pos || "").split("/")[0].trim().toLowerCase();
}

// Returns { kind: "verb"|"noun", forms } or null — what to show on a card.
export function wordForms(word, pos) {
  const p = primaryPos(pos);
  if (p === "verb") {
    const f = verbForms(word);
    return f ? { kind: "verb", forms: f } : null;
  }
  if (p === "noun") {
    const f = nounForms(word);
    if (!f) return null;
    f.invariant = f.plural === f.singular;
    return { kind: "noun", forms: f };
  }
  return null;
}
