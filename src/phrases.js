/* ============================================================
   Common English phrases & idioms, with Spanish equivalents.
   Used by the Phrases section: a reference list plus a
   fill-in-the-gap practice mode.

   Entry shape:
     { id, category, en, es, literal?, gap, accept? }
       en      — the natural English phrase
       es      — what a Spanish speaker would actually say
       literal — word-for-word gloss (only for idioms, where it
                 differs enough to be funny/useful)
       gap     — the chunk hidden in practice; must appear in `en`
       accept  — extra answers counted as correct
   ============================================================ */

export const PHRASE_CATEGORIES = [
  { key: "greetings", label: "Saludos y despedidas", icon: "👋" },
  { key: "courtesy", label: "Cortesía y disculpas", icon: "🙏" },
  { key: "requests", label: "Pedir, ofrecer y responder", icon: "🤝" },
  { key: "conversation", label: "Reaccionar en una conversación", icon: "💬" },
  { key: "opinions", label: "Opiniones y acuerdo", icon: "🤔" },
  { key: "work", label: "Trabajo y reuniones", icon: "💼" },
  { key: "travel", label: "Viajes, direcciones y compras", icon: "✈️" },
  { key: "time", label: "Tiempo, prisa y planes", icon: "⏰" },
  { key: "idioms", label: "Expresiones y modismos", icon: "🎭" },
  { key: "slang", label: "Inglés informal / slang", icon: "😎" },
];

export const PHRASES = [
  /* -- greetings -- */
  { category: "greetings", en: "How's it going?", es: "¿Qué tal? / ¿Cómo va todo?", gap: "How's it going" },
  { category: "greetings", en: "How have you been?", es: "¿Cómo has estado?", gap: "How have you been" },
  { category: "greetings", en: "Long time no see.", es: "Cuánto tiempo sin verte.", gap: "Long time no see" },
  { category: "greetings", en: "Nice to meet you.", es: "Encantado de conocerte.", gap: "Nice to meet you" },
  { category: "greetings", en: "What have you been up to?", es: "¿Qué has estado haciendo últimamente?", gap: "up to" },
  { category: "greetings", en: "Take care.", es: "Cuídate.", gap: "Take care" },
  { category: "greetings", en: "See you around.", es: "Nos vemos por ahí.", gap: "See you around" },
  { category: "greetings", en: "Catch you later.", es: "Hasta luego. / Nos vemos.", gap: "Catch you later" },
  { category: "greetings", en: "Have a good one.", es: "Que te vaya bien.", gap: "Have a good one" },
  { category: "greetings", en: "It's been a while.", es: "Ha pasado tiempo.", gap: "been a while" },

  /* -- courtesy -- */
  { category: "courtesy", en: "Excuse me.", es: "Disculpe. / Perdón.", gap: "Excuse me" },
  { category: "courtesy", en: "I'm sorry to bother you.", es: "Siento molestarte.", gap: "to bother you" },
  { category: "courtesy", en: "No worries.", es: "No pasa nada. / Tranquilo.", gap: "No worries" },
  { category: "courtesy", en: "Don't mention it.", es: "No hay de qué.", gap: "Don't mention it" },
  { category: "courtesy", en: "My apologies.", es: "Mis disculpas.", gap: "My apologies" },
  { category: "courtesy", en: "After you.", es: "Usted primero. / Pasa tú.", gap: "After you" },
  { category: "courtesy", en: "Bless you.", es: "Salud (cuando alguien estornuda).", gap: "Bless you" },
  { category: "courtesy", en: "It's my fault.", es: "Es culpa mía.", gap: "my fault" },
  { category: "courtesy", en: "I didn't mean to.", es: "No fue mi intención.", gap: "didn't mean to" },
  { category: "courtesy", en: "I owe you one.", es: "Te debo una.", gap: "owe you one" },

  /* -- requests -- */
  { category: "requests", en: "Could you give me a hand?", es: "¿Me echas una mano?", gap: "give me a hand" },
  { category: "requests", en: "Would you mind opening the window?", es: "¿Te importaría abrir la ventana?", gap: "Would you mind" },
  { category: "requests", en: "Do you have a minute?", es: "¿Tienes un minuto?", gap: "have a minute" },
  { category: "requests", en: "Can you do me a favor?", es: "¿Me haces un favor?", gap: "do me a favor" },
  { category: "requests", en: "Here you go.", es: "Aquí tienes.", gap: "Here you go" },
  { category: "requests", en: "Help yourself.", es: "Sírvete tú mismo.", gap: "Help yourself" },
  { category: "requests", en: "Go ahead.", es: "Adelante.", gap: "Go ahead" },
  { category: "requests", en: "Be my guest.", es: "Adelante, todo tuyo.", gap: "Be my guest" },
  { category: "requests", en: "Suit yourself.", es: "Como quieras. / Allá tú.", gap: "Suit yourself" },
  { category: "requests", en: "Let me know.", es: "Avísame. / Dime algo.", gap: "Let me know" },
  { category: "requests", en: "Keep me posted.", es: "Mantenme al tanto.", gap: "Keep me posted" },

  /* -- conversation -- */
  { category: "conversation", en: "No way!", es: "¡No me digas! / ¡Ni hablar!", gap: "No way" },
  { category: "conversation", en: "You're kidding!", es: "¡Estás de broma!", gap: "You're kidding" },
  { category: "conversation", en: "That makes sense.", es: "Tiene sentido.", gap: "makes sense" },
  { category: "conversation", en: "I see what you mean.", es: "Ya veo a qué te refieres.", gap: "what you mean" },
  { category: "conversation", en: "Fair enough.", es: "Me parece justo. / Vale.", gap: "Fair enough" },
  { category: "conversation", en: "You bet.", es: "Por supuesto. / Claro.", gap: "You bet" },
  { category: "conversation", en: "I have no idea.", es: "No tengo ni idea.", gap: "no idea" },
  { category: "conversation", en: "Good point.", es: "Buen punto.", gap: "Good point" },
  { category: "conversation", en: "Never mind.", es: "Déjalo. / No importa.", gap: "Never mind" },
  { category: "conversation", en: "It's up to you.", es: "Tú decides.", gap: "up to you" },
  { category: "conversation", en: "What do you mean?", es: "¿Qué quieres decir?", gap: "What do you mean" },
  { category: "conversation", en: "Guess what!", es: "¡Adivina qué!", gap: "Guess what" },
  { category: "conversation", en: "Tell me about it.", es: "Ni me lo digas. / A quién se lo dices.", gap: "Tell me about it" },
  { category: "conversation", en: "That's the thing.", es: "Ahí está el tema.", gap: "the thing" },

  /* -- opinions -- */
  { category: "opinions", en: "In my opinion, it's too expensive.", es: "En mi opinión, es demasiado caro.", gap: "In my opinion" },
  { category: "opinions", en: "If you ask me, we should wait.", es: "Si me preguntas, deberíamos esperar.", gap: "If you ask me" },
  { category: "opinions", en: "I couldn't agree more.", es: "No podría estar más de acuerdo.", gap: "couldn't agree more" },
  { category: "opinions", en: "I'm not so sure about that.", es: "No estoy tan seguro de eso.", gap: "not so sure" },
  { category: "opinions", en: "It depends.", es: "Depende.", gap: "It depends" },
  { category: "opinions", en: "I guess so.", es: "Supongo que sí.", gap: "I guess so" },
  { category: "opinions", en: "Not really.", es: "La verdad es que no.", gap: "Not really" },
  { category: "opinions", en: "I doubt it.", es: "Lo dudo.", gap: "I doubt it" },
  { category: "opinions", en: "That's a good question.", es: "Buena pregunta.", gap: "good question" },
  { category: "opinions", en: "I'm on the fence.", es: "Estoy indeciso.", gap: "on the fence" },

  /* -- work -- */
  { category: "work", en: "Let's touch base tomorrow.", es: "Pongámonos al día mañana.", gap: "touch base" },
  { category: "work", en: "Let's circle back to this later.", es: "Retomemos esto más tarde.", gap: "circle back" },
  { category: "work", en: "We're on the same page.", es: "Estamos de acuerdo. / En sintonía.", gap: "the same page" },
  { category: "work", en: "Let's call it a day.", es: "Dejémoslo por hoy.", gap: "call it a day" },
  { category: "work", en: "I'll get back to you.", es: "Te respondo luego.", gap: "get back to you" },
  { category: "work", en: "Can we push it back a week?", es: "¿Podemos aplazarlo una semana?", gap: "push it back" },
  { category: "work", en: "That's out of scope.", es: "Eso está fuera del alcance.", gap: "out of scope" },
  { category: "work", en: "Let's play it by ear.", es: "Vamos viendo sobre la marcha.", gap: "play it by ear" },
  { category: "work", en: "I'm swamped this week.", es: "Estoy hasta arriba de trabajo esta semana.", gap: "swamped" },
  { category: "work", en: "Let's take this offline.", es: "Hablemos esto aparte / luego.", gap: "take this offline" },
  { category: "work", en: "Ping me when you're done.", es: "Avísame cuando termines.", gap: "Ping me" },
  { category: "work", en: "Let's keep it short.", es: "Vamos a ser breves.", gap: "keep it short" },

  /* -- travel -- */
  { category: "travel", en: "How do I get to the station?", es: "¿Cómo llego a la estación?", gap: "How do I get to" },
  { category: "travel", en: "Is this seat taken?", es: "¿Está ocupado este asiento?", gap: "seat taken" },
  { category: "travel", en: "Could you tell me the way to the museum?", es: "¿Me puede indicar cómo llegar al museo?", gap: "the way to" },
  { category: "travel", en: "I'd like a table for two.", es: "Quisiera una mesa para dos.", gap: "a table for two" },
  { category: "travel", en: "Can I get the check, please?", es: "¿Me trae la cuenta, por favor?", gap: "the check" },
  { category: "travel", en: "Keep the change.", es: "Quédese con el cambio.", gap: "Keep the change" },
  { category: "travel", en: "I'll have the same.", es: "Yo tomaré lo mismo.", gap: "the same" },
  { category: "travel", en: "How much is it?", es: "¿Cuánto cuesta?", gap: "How much is it" },
  { category: "travel", en: "Do you take card?", es: "¿Aceptan tarjeta?", gap: "take card" },
  { category: "travel", en: "I'm just looking, thanks.", es: "Solo estoy mirando, gracias.", gap: "just looking" },
  { category: "travel", en: "Where's the restroom?", es: "¿Dónde está el baño?", gap: "the restroom" },
  { category: "travel", en: "Could you take a picture of us?", es: "¿Nos puede hacer una foto?", gap: "take a picture" },

  /* -- time -- */
  { category: "time", en: "I'm running late.", es: "Voy con retraso.", gap: "running late" },
  { category: "time", en: "I'll be there in a bit.", es: "Llego en un rato.", gap: "in a bit" },
  { category: "time", en: "Give me a second.", es: "Dame un segundo.", gap: "a second" },
  { category: "time", en: "Let's take a rain check.", es: "Dejémoslo para otro día.", gap: "rain check" },
  { category: "time", en: "Better late than never.", es: "Más vale tarde que nunca.", gap: "Better late than never" },
  { category: "time", en: "Time flies.", es: "Cómo pasa el tiempo.", gap: "Time flies" },
  { category: "time", en: "Hang on a minute.", es: "Espera un momento.", gap: "Hang on" },
  { category: "time", en: "We're out of time.", es: "Se nos acabó el tiempo.", gap: "out of time" },
  { category: "time", en: "You made it just in the nick of time.", es: "Llegaste justo a tiempo.", gap: "the nick of time" },
  { category: "time", en: "Take your time.", es: "Tómate tu tiempo.", gap: "Take your time" },

  /* -- idioms -- */
  { category: "idioms", en: "It's raining cats and dogs.", literal: "Llueven gatos y perros.", es: "Está lloviendo a cántaros.", gap: "cats and dogs" },
  { category: "idioms", en: "It's a piece of cake.", literal: "Es un trozo de pastel.", es: "Es pan comido. / Está chupado.", gap: "a piece of cake" },
  { category: "idioms", en: "Break a leg!", literal: "¡Rómpete una pierna!", es: "¡Mucha suerte! / ¡Mucha mierda!", gap: "Break a leg" },
  { category: "idioms", en: "I'm feeling under the weather.", literal: "Me siento bajo el clima.", es: "Estoy pachucho / malito.", gap: "under the weather" },
  { category: "idioms", en: "It cost an arm and a leg.", literal: "Costó un brazo y una pierna.", es: "Costó un ojo de la cara / un riñón.", gap: "an arm and a leg" },
  { category: "idioms", en: "Once in a blue moon.", literal: "Una vez en una luna azul.", es: "De higos a brevas. / Muy de vez en cuando.", gap: "a blue moon" },
  { category: "idioms", en: "Don't spill the beans.", literal: "No derrames los frijoles.", es: "No te vayas de la lengua.", gap: "spill the beans" },
  { category: "idioms", en: "The ball is in your court.", literal: "La pelota está en tu cancha.", es: "Te toca mover ficha a ti.", gap: "in your court" },
  { category: "idioms", en: "Let's bite the bullet.", literal: "Mordamos la bala.", es: "Hagámoslo de una vez, aunque cueste.", gap: "bite the bullet" },
  { category: "idioms", en: "Let's cut to the chase.", literal: "Cortemos a la persecución.", es: "Vayamos al grano.", gap: "cut to the chase" },
  { category: "idioms", en: "Stop beating around the bush.", literal: "Deja de golpear alrededor del arbusto.", es: "Deja de andarte con rodeos.", gap: "beating around the bush" },
  { category: "idioms", en: "He's pulling your leg.", literal: "Te está tirando de la pierna.", es: "Te está tomando el pelo.", gap: "pulling your leg" },
  { category: "idioms", en: "It's a blessing in disguise.", literal: "Es una bendición disfrazada.", es: "No hay mal que por bien no venga.", gap: "in disguise" },
  { category: "idioms", en: "Speak of the devil.", literal: "Habla del diablo.", es: "Hablando del rey de Roma…", gap: "of the devil" },
  { category: "idioms", en: "When pigs fly.", literal: "Cuando los cerdos vuelen.", es: "Cuando las ranas críen pelo.", gap: "pigs fly" },
  { category: "idioms", en: "You hit the nail on the head.", literal: "Le diste al clavo en la cabeza.", es: "Diste en el clavo.", gap: "the nail on the head" },
  { category: "idioms", en: "The cat's out of the bag.", literal: "El gato salió de la bolsa.", es: "Se descubrió el pastel.", gap: "out of the bag" },
  { category: "idioms", en: "Back to the drawing board.", literal: "De vuelta a la mesa de dibujo.", es: "A empezar de cero otra vez.", gap: "the drawing board" },
  { category: "idioms", en: "I'm burning the midnight oil.", literal: "Estoy quemando el aceite de medianoche.", es: "Estoy quemándome las pestañas.", gap: "the midnight oil" },
  { category: "idioms", en: "I'm getting cold feet.", literal: "Se me están enfriando los pies.", es: "Me estoy echando atrás.", gap: "cold feet" },
  { category: "idioms", en: "Go the extra mile.", literal: "Recorre la milla de más.", es: "Hacer un esfuerzo extra.", gap: "the extra mile" },
  { category: "idioms", en: "It's not rocket science.", literal: "No es ciencia de cohetes.", es: "No es tan difícil.", gap: "rocket science" },
  { category: "idioms", en: "Kill two birds with one stone.", literal: "Matar dos pájaros con una piedra.", es: "Matar dos pájaros de un tiro.", gap: "two birds with one stone" },
  { category: "idioms", en: "You missed the boat.", literal: "Perdiste el barco.", es: "Se te pasó el tren.", gap: "the boat" },
  { category: "idioms", en: "No pain, no gain.", literal: "Sin dolor, no hay ganancia.", es: "El que algo quiere, algo le cuesta.", gap: "no gain" },
  { category: "idioms", en: "It came out of the blue.", literal: "Salió del azul.", es: "Salió de la nada, sin avisar.", gap: "out of the blue" },
  { category: "idioms", en: "That's the last straw.", literal: "Esa es la última paja.", es: "Es la gota que colma el vaso.", gap: "the last straw" },
  { category: "idioms", en: "Don't throw in the towel.", literal: "No tires la toalla.", es: "No te rindas.", gap: "throw in the towel" },
  { category: "idioms", en: "I can't wrap my head around it.", literal: "No puedo envolver mi cabeza en eso.", es: "No consigo entenderlo.", gap: "wrap my head around" },
  { category: "idioms", en: "It's the best of both worlds.", literal: "Es lo mejor de ambos mundos.", es: "Lo mejor de los dos mundos.", gap: "both worlds" },
  { category: "idioms", en: "It's a small world.", literal: "Es un mundo pequeño.", es: "El mundo es un pañuelo.", gap: "a small world" },
  { category: "idioms", en: "Actions speak louder than words.", literal: "Las acciones hablan más alto que las palabras.", es: "Del dicho al hecho hay mucho trecho.", gap: "louder than words" },
  { category: "idioms", en: "The early bird catches the worm.", literal: "El pájaro madrugador atrapa el gusano.", es: "A quien madruga, Dios le ayuda.", gap: "catches the worm" },
  { category: "idioms", en: "Don't judge a book by its cover.", literal: "No juzgues un libro por su portada.", es: "Las apariencias engañan.", gap: "by its cover" },
  { category: "idioms", en: "We'll cross that bridge when we come to it.", literal: "Cruzaremos ese puente cuando lleguemos a él.", es: "Ya nos preocuparemos de eso cuando toque.", gap: "cross that bridge" },

  /* -- slang -- */
  { category: "slang", en: "What's up?", es: "¿Qué pasa? / ¿Qué tal?", gap: "What's up" },
  { category: "slang", en: "Chill out.", es: "Relájate. / Tranquilo.", gap: "Chill out" },
  { category: "slang", en: "Let's hang out this weekend.", es: "Quedemos este finde.", gap: "hang out" },
  { category: "slang", en: "My bad.", es: "Culpa mía. / Perdón.", gap: "My bad" },
  { category: "slang", en: "No biggie.", es: "No es para tanto. / Nada grave.", gap: "No biggie" },
  { category: "slang", en: "You rock!", es: "¡Eres genial! / ¡Grande!", gap: "rock" },
  { category: "slang", en: "You rule!", es: "¡Eres el mejor! / ¡Máquina!", gap: "rule" },
  { category: "slang", en: "That's sick!", es: "¡Qué bueno! / ¡Brutal!", gap: "sick" },
  { category: "slang", en: "I'm beat.", es: "Estoy hecho polvo.", gap: "beat" },
  { category: "slang", en: "Sounds good.", es: "Me parece bien.", gap: "Sounds good" },
  { category: "slang", en: "For real.", es: "En serio. / De verdad.", gap: "For real" },
  { category: "slang", en: "Hang in there.", es: "Aguanta. / Ánimo.", gap: "Hang in there" },
  { category: "slang", en: "Same here.", es: "Yo igual. / Lo mismo digo.", gap: "Same here" },
  { category: "slang", en: "I'm down for that.", es: "Me apunto a eso.", gap: "I'm down" },
  { category: "slang", en: "That's a rip-off.", es: "Es una estafa / un timo.", gap: "a rip-off" },
  { category: "slang", en: "Wrap it up.", es: "Ve terminando.", gap: "Wrap it up" },
  { category: "slang", en: "Cut it out.", es: "Basta ya. / Para.", gap: "Cut it out" },
  { category: "slang", en: "It's awesome.", es: "Es genial.", gap: "awesome" },
].map((phrase) => ({
  id: phrase.en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  ...phrase,
}));

// Split `en` around `gap` so the practice card can blank the middle out.
export function splitOnGap(en, gap) {
  const at = en.toLowerCase().indexOf(gap.toLowerCase());
  if (at === -1) return { before: en, gap: "", after: "" };
  return {
    before: en.slice(0, at),
    gap: en.slice(at, at + gap.length),
    after: en.slice(at + gap.length),
  };
}

const normalize = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"'¿¡]/g, "")
    .replace(/\s+/g, " ");

// Is the typed guess an acceptable fill for this phrase's gap?
export function checkGap(guess, phrase) {
  const answer = normalize(guess);
  if (!answer) return false;
  if (answer === normalize(phrase.gap)) return true;
  return (phrase.accept || []).some((alt) => normalize(alt) === answer);
}
