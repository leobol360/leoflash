/* ============================================================
   English tenses & structures — reference for the Grammar view.
   Explanations in Spanish, examples in English.

   Each entry:
     id, name, es, level (a1..b2), group
     uses:   [ "cuándo se usa" ]
     forms:  { affirmative, negative, question, whQuestion?, short? }
             each of affirmative/negative/question is { s: "estructura", ex: [ ... ] }
     signals: [ marcadores temporales ]
     passive: "estructura de la pasiva" | null
     notes:   [ "avisos y errores comunes" ]
   ============================================================ */

export const GRAMMAR_GROUPS = [
  { key: "present", label: "Presente", icon: "🟢" },
  { key: "past", label: "Pasado", icon: "🔵" },
  { key: "future", label: "Futuro", icon: "🟣" },
  { key: "conditional", label: "Condicionales", icon: "🔀" },
  { key: "other", label: "Otras estructuras", icon: "🧩" },
];

export const GRAMMAR = [
  /* ================= PRESENT ================= */
  {
    id: "present-simple",
    name: "Present Simple",
    es: "Presente simple",
    level: "a1",
    group: "present",
    uses: [
      "Hábitos y rutinas: I go to work by bus.",
      "Hechos y verdades generales: Water boils at 100 °C.",
      "Horarios fijos (futuro): The train leaves at 6.",
      "Verbos de estado (no continuos): I know / want / believe…",
    ],
    forms: {
      affirmative: {
        s: "sujeto + verbo (presente)   ·   3ª persona: + -s / -es",
        ex: ["I work from home.", "She works from home."],
      },
      negative: {
        s: "sujeto + don't / doesn't + verbo (base)",
        ex: ["We don't work on Sundays.", "He doesn't drive."],
      },
      question: {
        s: "Do / Does + sujeto + verbo (base)?",
        ex: ["Do you speak English?", "Does she live here?"],
      },
      whQuestion: {
        s: "Wh- + do / does + sujeto + verbo (base)?",
        ex: ["Where do you live?", "What does he do?"],
      },
      short: ["Yes, I do. / No, I don't.", "Yes, she does. / No, she doesn't."],
    },
    signals: ["always", "usually", "often", "sometimes", "rarely", "never", "every day", "on Mondays", "twice a week"],
    passive: "am / is / are + verbo (participio)  →  English is spoken here.",
    notes: [
      "3ª persona: + -s; + -es tras -o, -ss, -sh, -ch, -x (goes, watches); -y → -ies tras consonante (study → studies).",
      "Para una acción que ocurre ahora usa el present continuous, no el simple.",
    ],
  },
  {
    id: "present-continuous",
    name: "Present Continuous",
    es: "Presente continuo",
    level: "a1",
    group: "present",
    uses: [
      "Acción en curso ahora mismo: I'm reading a book.",
      "Situación temporal: I'm staying with my parents this month.",
      "Planes futuros con hora/lugar: We're meeting Ana at 7.",
      "Tendencias y cambios: Prices are rising.",
      "Quejas con always: You're always losing your keys!",
    ],
    forms: {
      affirmative: { s: "sujeto + am / is / are + verbo (-ing)", ex: ["I'm working right now.", "They're playing outside."] },
      negative: { s: "sujeto + am / is / are + not + verbo (-ing)", ex: ["She isn't listening.", "We aren't going."] },
      question: { s: "Am / Is / Are + sujeto + verbo (-ing)?", ex: ["Are you coming?", "Is it raining?"] },
      whQuestion: { s: "Wh- + am / is / are + sujeto + verbo (-ing)?", ex: ["What are you doing?", "Why is she crying?"] },
      short: ["Yes, I am. / No, I'm not.", "Yes, she is. / No, she isn't."],
    },
    signals: ["now", "right now", "at the moment", "currently", "today", "this week", "Look!", "Listen!"],
    passive: "am / is / are + being + verbo (participio)  →  The road is being repaired.",
    notes: [
      "Los verbos de estado normalmente no van en continuo: know, like, want, need, believe, own, seem…",
      "Ortografía -ing: make → making, run → running, lie → lying.",
    ],
  },
  {
    id: "present-perfect",
    name: "Present Perfect",
    es: "Pretérito perfecto",
    level: "a2",
    group: "present",
    uses: [
      "Experiencias de vida (sin decir cuándo): I've been to Japan.",
      "Acción pasada con resultado en el presente: I've lost my keys (= no las tengo ahora).",
      "Acción que empezó en el pasado y continúa (for / since): I've lived here for ten years.",
      "Noticias recientes: just, already, yet.",
    ],
    forms: {
      affirmative: { s: "sujeto + have / has + verbo (participio)", ex: ["I have finished.", "She has arrived."] },
      negative: { s: "sujeto + haven't / hasn't + verbo (participio)", ex: ["They haven't called.", "He hasn't eaten yet."] },
      question: { s: "Have / Has + sujeto + verbo (participio)?", ex: ["Have you seen it?", "Has she left?"] },
      whQuestion: { s: "How long + have / has + sujeto + verbo (participio)?", ex: ["How long have you known her?"] },
      short: ["Yes, I have. / No, I haven't.", "Yes, she has. / No, she hasn't."],
    },
    signals: ["ever", "never", "already", "yet", "just", "so far", "recently", "lately", "for", "since", "this week/year"],
    passive: "have / has been + verbo (participio)  →  The results have been published.",
    notes: [
      "NO se usa con un tiempo pasado terminado y concreto: yesterday, last week, in 2010 → usa Past Simple.",
      "for + periodo (for two years) · since + punto de inicio (since 2015).",
    ],
  },
  {
    id: "present-perfect-continuous",
    name: "Present Perfect Continuous",
    es: "Pretérito perfecto continuo",
    level: "b1",
    group: "present",
    uses: [
      "Acción que empezó en el pasado y sigue ahora, enfatizando la duración: I've been studying all day.",
      "Acción reciente cuyos efectos se ven ahora: You're out of breath — have you been running?",
    ],
    forms: {
      affirmative: { s: "sujeto + have / has been + verbo (-ing)", ex: ["I've been waiting for an hour.", "It's been raining."] },
      negative: { s: "sujeto + haven't / hasn't been + verbo (-ing)", ex: ["She hasn't been sleeping well."] },
      question: { s: "Have / Has + sujeto + been + verbo (-ing)?", ex: ["Have you been crying?", "How long has he been working here?"] },
      short: ["Yes, I have. / No, I haven't."],
    },
    signals: ["for", "since", "all day/morning", "lately", "recently", "How long…?"],
    passive: null,
    notes: [
      "Con verbos de estado usa el perfect simple: I've known her for years (NO 'been knowing').",
      "Simple = resultado / cantidad (I've written three emails). Continuous = actividad / duración (I've been writing emails).",
    ],
  },

  /* ================= PAST ================= */
  {
    id: "past-simple",
    name: "Past Simple",
    es: "Pretérito indefinido",
    level: "a1",
    group: "past",
    uses: [
      "Acción terminada en un momento concreto del pasado: I saw her yesterday.",
      "Secuencia de hechos pasados: I woke up, had breakfast and left.",
      "Hábitos y estados pasados: When I was a child, I lived in Peru.",
    ],
    forms: {
      affirmative: { s: "sujeto + verbo (pasado)   ·   regulares: -ed  ·  irregulares: forma propia", ex: ["We watched a film.", "I went home.", "She had a car."] },
      negative: { s: "sujeto + didn't + verbo (base)", ex: ["They didn't come.", "He didn't know."] },
      question: { s: "Did + sujeto + verbo (base)?", ex: ["Did you call her?", "Did it work?"] },
      whQuestion: { s: "Wh- + did + sujeto + verbo (base)?  ·  sujeto: Who + verbo (pasado)?", ex: ["Where did you go?", "Who called you?"] },
      short: ["Yes, I did. / No, I didn't."],
    },
    signals: ["yesterday", "last night/week/year", "… ago", "in 1999", "then", "when", "that day"],
    passive: "was / were + verbo (participio)  →  The letter was sent yesterday.",
    notes: [
      "Muchos verbos son irregulares: go → went, see → saw, have → had, buy → bought…",
      "Ortografía -ed: like → liked, stop → stopped, study → studied, play → played.",
    ],
  },
  {
    id: "past-continuous",
    name: "Past Continuous",
    es: "Pretérito imperfecto (continuo)",
    level: "a2",
    group: "past",
    uses: [
      "Acción en desarrollo en un momento del pasado: At 8 pm I was cooking.",
      "Acción larga interrumpida por otra corta: I was sleeping when the phone rang.",
      "Dos acciones simultáneas (while): While she was reading, he was cooking.",
      "Ambientar una historia: The sun was shining and the birds were singing.",
    ],
    forms: {
      affirmative: { s: "sujeto + was / were + verbo (-ing)", ex: ["I was working.", "They were waiting outside."] },
      negative: { s: "sujeto + wasn't / weren't + verbo (-ing)", ex: ["She wasn't listening.", "We weren't ready."] },
      question: { s: "Was / Were + sujeto + verbo (-ing)?", ex: ["Were you sleeping?", "What was he doing?"] },
      short: ["Yes, I was. / No, I wasn't.", "Yes, we were. / No, we weren't."],
    },
    signals: ["while", "when", "as", "at that moment", "at 7 o'clock", "all day yesterday"],
    passive: "was / were being + verbo (participio)  →  The house was being painted.",
    notes: [
      "Regla típica: When I arrived (past simple), she was cooking (past continuous).",
      "Los verbos de estado no van en continuo.",
    ],
  },
  {
    id: "past-perfect",
    name: "Past Perfect",
    es: "Pretérito pluscuamperfecto",
    level: "b1",
    group: "past",
    uses: [
      "Acción anterior a otra acción pasada — 'el pasado del pasado': The train had left when we arrived.",
      "En estilo indirecto: She said she had seen the film.",
      "Con by the time / after / before / already / just.",
    ],
    forms: {
      affirmative: { s: "sujeto + had + verbo (participio)", ex: ["I had already eaten.", "They had gone."] },
      negative: { s: "sujeto + hadn't + verbo (participio)", ex: ["I hadn't seen it before.", "She hadn't finished."] },
      question: { s: "Had + sujeto + verbo (participio)?", ex: ["Had you met him before?", "Why had they left?"] },
      short: ["Yes, I had. / No, I hadn't."],
    },
    signals: ["already", "just", "never", "by the time", "after", "before", "until then", "when"],
    passive: "had been + verbo (participio)  →  The room had been cleaned.",
    notes: [
      "Si before / after ya dejan claro el orden, el past perfect es opcional: She left before I arrived.",
      "Es el tiempo de la 3ª condicional: If I had known…",
    ],
  },
  {
    id: "past-perfect-continuous",
    name: "Past Perfect Continuous",
    es: "Pluscuamperfecto continuo",
    level: "b2",
    group: "past",
    uses: [
      "Duración de una acción que ocurría antes de otro momento pasado: I had been driving for hours when I stopped.",
      "Causa pasada de un resultado pasado: She was tired because she had been working all night.",
    ],
    forms: {
      affirmative: { s: "sujeto + had been + verbo (-ing)", ex: ["We had been waiting for ages.", "It had been snowing."] },
      negative: { s: "sujeto + hadn't been + verbo (-ing)", ex: ["He hadn't been feeling well."] },
      question: { s: "Had + sujeto + been + verbo (-ing)?", ex: ["How long had they been living there?"] },
      short: ["Yes, I had. / No, I hadn't."],
    },
    signals: ["for", "since", "how long", "before", "all day"],
    passive: null,
    notes: ["Con verbos de estado usa el past perfect simple."],
  },

  /* ================= FUTURE ================= */
  {
    id: "future-will",
    name: "Future Simple (will)",
    es: "Futuro simple (will)",
    level: "a2",
    group: "future",
    uses: [
      "Decisiones espontáneas (en el momento de hablar): It's cold — I'll close the window.",
      "Predicciones basadas en opinión: I think it will rain.",
      "Promesas, ofertas y peticiones: I'll help you. / Will you open the door?",
      "Hechos futuros inevitables: She'll be 30 next month.",
    ],
    forms: {
      affirmative: { s: "sujeto + will + verbo (base)", ex: ["I'll call you tomorrow.", "It will be fine."] },
      negative: { s: "sujeto + won't + verbo (base)", ex: ["She won't come.", "They won't mind."] },
      question: { s: "Will + sujeto + verbo (base)?", ex: ["Will you be there?", "Will it hurt?"] },
      whQuestion: { s: "Wh- + will + sujeto + verbo (base)?", ex: ["When will they arrive?", "What will you do?"] },
      short: ["Yes, I will. / No, I won't."],
    },
    signals: ["tomorrow", "next week/year", "soon", "in the future", "probably", "I think / expect", "in 2050"],
    passive: "will be + verbo (participio)  →  The winners will be announced on Friday.",
    notes: [
      "Contracción: I'll, she'll, we'll · negativo: won't.",
      "shall solo en ofertas/sugerencias: Shall I help? / Shall we go?",
    ],
  },
  {
    id: "future-going-to",
    name: "be going to",
    es: "Futuro con 'be going to'",
    level: "a2",
    group: "future",
    uses: [
      "Planes e intenciones ya decididos antes de hablar: We're going to move house.",
      "Predicciones con evidencia presente: Look at those clouds — it's going to rain.",
    ],
    forms: {
      affirmative: { s: "sujeto + am / is / are + going to + verbo (base)", ex: ["I'm going to study medicine.", "They're going to sell the car."] },
      negative: { s: "sujeto + am / is / are + not + going to + verbo (base)", ex: ["I'm not going to argue.", "She isn't going to wait."] },
      question: { s: "Am / Is / Are + sujeto + going to + verbo (base)?", ex: ["Are you going to call him?", "What is she going to do?"] },
      short: ["Yes, I am. / No, I'm not."],
    },
    signals: ["tomorrow", "tonight", "this weekend", "next…", "(evidencia visible ahora)"],
    passive: "am / is / are + going to be + verbo (participio)",
    notes: ["will = decisión en este momento · be going to = decisión ya tomada / hay evidencia."],
  },
  {
    id: "future-present-forms",
    name: "Present forms for the future",
    es: "Presentes con valor de futuro",
    level: "b1",
    group: "future",
    uses: [
      "Present continuous: planes fijos con hora/lugar (una cita, una reserva): I'm seeing the dentist at 4.",
      "Present simple: horarios y programaciones oficiales: The flight departs at 09:15. The course starts on Monday.",
    ],
    forms: {
      affirmative: { s: "sujeto + am/is/are + verbo (-ing)   ·   sujeto + verbo (presente)", ex: ["We're flying to Rome on Friday.", "The museum opens at ten tomorrow."] },
      negative: { s: "sujeto + am/is/are + not + verbo (-ing)", ex: ["I'm not working next Monday."] },
      question: { s: "Am/Is/Are + sujeto + verbo (-ing)?", ex: ["Are you doing anything on Saturday?"] },
    },
    signals: ["tomorrow", "on Friday", "at 6", "next week", "tonight"],
    passive: null,
    notes: ["Present continuous futuro = arreglo personal · Present simple futuro = calendario/horario oficial."],
  },
  {
    id: "future-continuous",
    name: "Future Continuous",
    es: "Futuro continuo",
    level: "b1",
    group: "future",
    uses: [
      "Acción en desarrollo en un momento futuro: This time tomorrow I'll be flying to Rome.",
      "Preguntar por planes de forma educada: Will you be using the car tonight?",
    ],
    forms: {
      affirmative: { s: "sujeto + will be + verbo (-ing)", ex: ["At 9 pm I'll be watching the match."] },
      negative: { s: "sujeto + won't be + verbo (-ing)", ex: ["I won't be working next week."] },
      question: { s: "Will + sujeto + be + verbo (-ing)?", ex: ["Will you be joining us for dinner?"] },
      short: ["Yes, I will. / No, I won't."],
    },
    signals: ["this time tomorrow", "at 8 pm tomorrow", "all day tomorrow", "in the future"],
    passive: null,
    notes: [],
  },
  {
    id: "future-perfect",
    name: "Future Perfect",
    es: "Futuro perfecto",
    level: "b2",
    group: "future",
    uses: [
      "Acción que estará terminada antes de un momento futuro: By 2030 they will have built the bridge.",
    ],
    forms: {
      affirmative: { s: "sujeto + will have + verbo (participio)", ex: ["I'll have finished by six.", "She will have left by then."] },
      negative: { s: "sujeto + won't have + verbo (participio)", ex: ["We won't have arrived before dark."] },
      question: { s: "Will + sujeto + have + verbo (participio)?", ex: ["Will you have eaten by the time I get there?"] },
      short: ["Yes, I will. / No, I won't."],
    },
    signals: ["by", "by then", "by the time", "before", "in two years"],
    passive: "will have been + verbo (participio)  →  The work will have been completed by May.",
    notes: [],
  },
  {
    id: "future-perfect-continuous",
    name: "Future Perfect Continuous",
    es: "Futuro perfecto continuo",
    level: "b2",
    group: "future",
    uses: ["Duración de una acción hasta un momento futuro: In May I'll have been working here for ten years."],
    forms: {
      affirmative: { s: "sujeto + will have been + verbo (-ing)", ex: ["By midnight we'll have been driving for eight hours."] },
      negative: { s: "sujeto + won't have been + verbo (-ing)", ex: ["She won't have been studying for very long."] },
      question: { s: "Will + sujeto + have been + verbo (-ing)?", ex: ["How long will you have been waiting?"] },
    },
    signals: ["by", "by the time", "for", "how long"],
    passive: null,
    notes: ["Con verbos de estado usa el future perfect simple."],
  },

  /* ================= CONDITIONALS ================= */
  {
    id: "conditional-0",
    name: "Zero Conditional",
    es: "Condicional cero",
    level: "a2",
    group: "conditional",
    uses: ["Verdades generales, leyes científicas y hábitos automáticos: cuando pasa A, siempre pasa B."],
    forms: {
      affirmative: { s: "If + presente simple , presente simple", ex: ["If you heat ice, it melts.", "If I drink coffee at night, I don't sleep."] },
      question: { s: "¿Qué pasa si…?  →  What happens if + presente?", ex: ["What happens if you press this button?"] },
    },
    signals: ["if", "when", "whenever", "every time"],
    passive: null,
    notes: ["Se puede sustituir if por when sin cambiar el significado: When it rains, the streets flood."],
  },
  {
    id: "conditional-1",
    name: "First Conditional",
    es: "Primer condicional",
    level: "a2",
    group: "conditional",
    uses: ["Situación futura real o probable y su consecuencia: si ocurre X, pasará Y."],
    forms: {
      affirmative: { s: "If + presente simple , will + verbo (base)", ex: ["If it rains, we'll stay in.", "If you help me, I'll finish sooner."] },
      negative: { s: "If + presente , won't + verbo (base)   ·   Unless + presente , will…", ex: ["If you don't hurry, you'll miss the bus.", "Unless you leave now, you'll be late."] },
      question: { s: "What will you do if + presente?", ex: ["What will you do if they say no?"] },
    },
    signals: ["if", "unless", "as soon as", "when", "in case"],
    passive: null,
    notes: [
      "También puedes usar imperativo o un modal en la principal: If you see her, tell her. / If you're tired, you can rest.",
      "Después de if / when / as soon as va presente, NO will.",
    ],
  },
  {
    id: "conditional-2",
    name: "Second Conditional",
    es: "Segundo condicional",
    level: "b1",
    group: "conditional",
    uses: [
      "Situación presente o futura irreal, imaginaria o poco probable: If I won the lottery…",
      "Dar consejos: If I were you, I'd apologise.",
    ],
    forms: {
      affirmative: { s: "If + pasado simple , would + verbo (base)", ex: ["If I had more time, I would travel.", "If I were rich, I'd help everyone."] },
      negative: { s: "If + pasado , wouldn't + verbo (base)", ex: ["If she didn't work so much, she wouldn't be so tired."] },
      question: { s: "What would you do if + pasado?", ex: ["What would you do if you lost your job?"] },
    },
    signals: ["if", "if I were you", "suppose", "imagine"],
    passive: null,
    notes: [
      "Con el verbo be se usa were para todas las personas: If I were… / If he were…",
      "En la principal también valen could o might: If I had a car, I could drive you.",
    ],
  },
  {
    id: "conditional-3",
    name: "Third Conditional",
    es: "Tercer condicional",
    level: "b1",
    group: "conditional",
    uses: ["Situación pasada irreal y su consecuencia — arrepentimientos y críticas: lo que habría pasado si…"],
    forms: {
      affirmative: { s: "If + pasado perfecto , would have + verbo (participio)", ex: ["If I had studied, I would have passed.", "If we had left earlier, we would have caught the train."] },
      negative: { s: "If + hadn't + verbo (participio) , wouldn't have + verbo (participio)", ex: ["If you hadn't helped me, I wouldn't have finished."] },
      question: { s: "What would you have done if + pasado perfecto?", ex: ["What would you have said if he had asked?"] },
    },
    signals: ["if", "if only", "otherwise"],
    passive: null,
    notes: ["En la principal también valen could have / might have: If I had known, I could have helped."],
  },
  {
    id: "conditional-mixed",
    name: "Mixed Conditionals",
    es: "Condicionales mixtos",
    level: "b2",
    group: "conditional",
    uses: [
      "Condición pasada → resultado presente: If I had taken that job, I would be in London now.",
      "Condición presente (permanente) → resultado pasado: If I weren't so shy, I would have spoken up.",
    ],
    forms: {
      affirmative: { s: "If + pasado perfecto , would + verbo (base)   ·   If + pasado simple , would have + verbo (participio)", ex: ["If she had saved money, she wouldn't be in debt now.", "If he were more careful, he wouldn't have crashed."] },
    },
    signals: ["if", "now", "still", "today"],
    passive: null,
    notes: ["Mezclan el tiempo de la condición y el del resultado según cuándo ocurre cada parte."],
  },

  /* ================= OTHER STRUCTURES ================= */
  {
    id: "used-to",
    name: "used to",
    es: "'used to' (hábitos pasados)",
    level: "a2",
    group: "other",
    uses: ["Hábitos y estados del pasado que ya no ocurren: I used to smoke, but I quit."],
    forms: {
      affirmative: { s: "sujeto + used to + verbo (base)", ex: ["I used to live in Madrid.", "She used to have long hair."] },
      negative: { s: "sujeto + didn't use to + verbo (base)", ex: ["We didn't use to lock the door.", "He didn't use to like vegetables."] },
      question: { s: "Did + sujeto + use to + verbo (base)?", ex: ["Did you use to play an instrument?"] },
      short: ["Yes, I did. / No, I didn't."],
    },
    signals: ["as a child", "in those days", "back then", "when I was young"],
    passive: null,
    notes: [
      "Solo existe en pasado. Para hábitos presentes: usually + present simple.",
      "No confundir con be / get used to + -ing = 'estar / acostumbrarse a': I'm used to getting up early.",
    ],
  },
  {
    id: "would-past-habits",
    name: "would (past habits)",
    es: "'would' para rutinas pasadas",
    level: "b1",
    group: "other",
    uses: ["Acciones repetidas del pasado, en tono narrativo o nostálgico: Every summer we would go to the coast."],
    forms: {
      affirmative: { s: "sujeto + would + verbo (base)", ex: ["My grandfather would tell us stories for hours."] },
      negative: { s: "sujeto + wouldn't + verbo (base)", ex: ["She wouldn't eat anything green."] },
    },
    signals: ["every summer", "on Sundays", "as a child", "in those days"],
    passive: null,
    notes: [
      "Solo para acciones, NO para estados: para estados usa used to (used to be / used to have, NO 'would be').",
      "would también forma el condicional (I would help you).",
    ],
  },
  {
    id: "passive-voice",
    name: "Passive Voice",
    es: "La voz pasiva",
    level: "b1",
    group: "other",
    uses: [
      "Cuando la acción o el objeto importan más que quién la hace: The bridge was built in 1890.",
      "Cuando no se sabe o no interesa el agente: My bike has been stolen.",
      "En textos formales, científicos y noticias.",
    ],
    forms: {
      affirmative: { s: "objeto + be (en el tiempo correspondiente) + verbo (participio)  (+ by + agente)", ex: ["The letter was written by Ana.", "This bridge is used by thousands of people."] },
      negative: { s: "objeto + be + not + verbo (participio)", ex: ["The report wasn't finished on time."] },
      question: { s: "be + objeto + verbo (participio)?", ex: ["Was the window broken?", "Has the parcel been delivered?"] },
    },
    signals: ["by + agente", "It is said that…", "is / are made of"],
    passive: [
      "Present Simple → am/is/are + verbo (participio)",
      "Present Continuous → am/is/are being + verbo (participio)",
      "Past Simple → was/were + verbo (participio)",
      "Past Continuous → was/were being + verbo (participio)",
      "Present Perfect → have/has been + verbo (participio)",
      "Past Perfect → had been + verbo (participio)",
      "Future (will) → will be + verbo (participio)",
      "Modales → can/must/should be + verbo (participio)",
    ].join("\n"),
    notes: ["Solo los verbos transitivos (con objeto) tienen pasiva.", "El agente (by…) se omite muy a menudo."],
  },
];
