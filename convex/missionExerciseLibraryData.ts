// @ts-nocheck
import { MISSIONS } from "./progressionCatalog";

const TAG_VOCAB = {
  home: [
    ["l'affitto", "the rent", "Quanto costa l'affitto al mese?"],
    ["il deposito", "the deposit", "Il deposito è di due mesi."],
    ["le spese", "the utilities / extra bills", "Le spese sono incluse o no?"],
    ["il contratto", "the contract", "Il contratto inizia a maggio."],
    ["la stanza", "the room", "La stanza è piccola ma luminosa."],
    ["il quartiere", "the neighborhood", "Il quartiere è tranquillo la sera."],
    ["l'appartamento", "the apartment", "L'appartamento è vicino alla metro."],
    ["la visita", "the viewing", "Possiamo fare una visita domani?"],
    ["la cucina", "the kitchen", "La cucina è condivisa."],
    ["il bagno", "the bathroom", "Il bagno è privato?"],
    ["il proprietario", "the landlord", "Il proprietario vive in città."],
    ["incluso", "included", "Il wifi è incluso nel prezzo?"],
  ],
  housing: [
    ["il trasloco", "the move", "Il trasloco è previsto per lunedì."],
    ["la data di ingresso", "the move-in date", "Qual è la data di ingresso?"],
    ["l'agenzia", "the agency", "L'agenzia chiede una commissione."],
    ["l'annuncio", "the listing", "Ho visto il suo annuncio online."],
  ],
  food: [
    ["il menù", "the menu", "Posso vedere il menù?"],
    ["il conto", "the bill", "Il conto, per favore."],
    ["il cameriere", "the waiter", "Il cameriere arriva subito."],
    ["l'antipasto", "the appetizer", "Come antipasto prendiamo bruschette."],
    ["il primo", "the first course", "Come primo vorrei la pasta."],
    ["il secondo", "the second course", "Come secondo prendo il pesce."],
    ["la prenotazione", "the reservation", "Abbiamo una prenotazione per due."],
    ["senza glutine", "gluten-free", "Avete qualcosa senza glutine?"],
    ["vegetariano", "vegetarian", "Il mio ospite è vegetariano."],
    ["il dolce", "the dessert", "Prendiamo un dolce da dividere."],
    ["acqua naturale", "still water", "Per me acqua naturale."],
    ["dividere il conto", "to split the bill", "Possiamo dividere il conto?"],
  ],
  restaurant: [
    ["il tavolo", "the table", "Vorrei un tavolo per due."],
    ["la forchetta", "the fork", "Mi porta un'altra forchetta?"],
    ["allergia", "allergy", "Ho un'allergia alle noccioline."],
  ],
  social: [
    ["l'invito", "the invitation", "Grazie per l'invito."],
    ["l'appuntamento", "the meetup / appointment", "Confermiamo l'appuntamento alle otto."],
    ["fare conoscenza", "to get to know each other", "Voglio fare conoscenza con i tuoi amici."],
    ["molto gentile", "very kind", "È molto gentile da parte vostra."],
    ["che piacere", "what a pleasure", "Che piacere conoscerla."],
    ["il programma", "the plan", "Qual è il programma per stasera?"],
    ["cambiare idea", "to change one's mind", "Possiamo cambiare idea se piove."],
    ["confermare", "to confirm", "Ti scrivo per confermare tutto."],
    ["rimandare", "to postpone", "Possiamo rimandare a domani?"],
    ["presentarsi", "to introduce oneself", "Vorrei presentarmi bene."],
    ["essere puntuale", "to be on time", "Cerco di essere puntuale."],
    ["fare due chiacchiere", "to have a chat", "Facciamo due chiacchiere prima di cena."],
  ],
  travel: [
    ["il biglietto", "the ticket", "Ho bisogno di un biglietto per Firenze."],
    ["il binario", "the platform", "Da quale binario parte il treno?"],
    ["la coincidenza", "the connection", "Perdo la coincidenza a Bologna."],
    ["il ritardo", "the delay", "C'è un ritardo di venti minuti."],
    ["la partenza", "the departure", "A che ora è la partenza?"],
    ["l'arrivo", "the arrival", "L'arrivo è previsto alle nove."],
    ["lo sciopero", "the strike", "Lo sciopero blocca molti treni."],
    ["la stazione", "the station", "La stazione è piena oggi."],
    ["prenotare un posto", "to reserve a seat", "Vorrei prenotare un posto."],
    ["cambiare itinerario", "to change itinerary", "Devo cambiare itinerario subito."],
    ["andata e ritorno", "round trip", "Serve un biglietto di andata e ritorno."],
    ["la fermata", "the stop", "Questa è la mia fermata?"],
  ],
  transport: [
    ["la coincidenza persa", "the missed connection", "Ho perso la coincidenza."],
    ["il controllo biglietti", "ticket control", "Il controllo biglietti parte adesso."],
  ],
  work: [
    ["la riunione", "the meeting", "La riunione inizia alle dieci."],
    ["il progetto", "the project", "Il progetto è quasi pronto."],
    ["la scadenza", "the deadline", "La scadenza è venerdì."],
    ["il collega", "the colleague", "Il collega mi spiega tutto."],
    ["l'ufficio", "the office", "L'ufficio è al terzo piano."],
    ["la pausa", "the break", "Facciamo una pausa alle undici."],
    ["l'agenda", "the schedule / agenda", "Aggiorno l'agenda ogni mattina."],
    ["la disponibilità", "availability", "Ti mando la mia disponibilità."],
    ["il turno", "the shift", "Domani ho il turno di mattina."],
    ["il responsabile", "the manager", "Il responsabile arriva tra poco."],
    ["prendere appunti", "to take notes", "Prendo appunti durante la call."],
    ["fare il punto", "to review status", "Facciamo il punto sul progetto."],
  ],
  shopping: [
    ["la taglia", "the size", "Avete questa taglia in blu?"],
    ["il prezzo", "the price", "Il prezzo è un po' alto."],
    ["lo sconto", "the discount", "C'è uno sconto oggi?"],
    ["il camerino", "the fitting room", "Dov'è il camerino?"],
    ["provare", "to try on", "Posso provare questa giacca?"],
    ["cambiare articolo", "to exchange an item", "Posso cambiare articolo domani?"],
    ["la cassa", "the register", "Pago alla cassa."],
    ["il reso", "the return", "Qual è la politica di reso?"],
    ["un altro colore", "another color", "Avete un altro colore?"],
    ["la misura", "the measurement / size", "Mi serve una misura più grande."],
    ["elegante", "elegant", "Cerco qualcosa di elegante."],
    ["il regalo", "the gift", "È un regalo di compleanno."],
  ],
  money: [
    ["il rimborso", "the refund", "Vorrei chiedere un rimborso."],
    ["la fattura", "the invoice", "Mi manda la fattura per email?"],
    ["il budget", "the budget", "Il budget è abbastanza limitato."],
    ["il pagamento", "the payment", "Il pagamento risulta già fatto."],
  ],
  health: [
    ["la farmacia", "the pharmacy", "La farmacia è aperta tutta la notte."],
    ["la dose", "the dosage", "Qual è la dose giusta?"],
    ["il sintomo", "the symptom", "Il sintomo principale è la febbre."],
    ["la ricetta", "the prescription", "Mi serve una ricetta?"],
    ["il mal di testa", "the headache", "Ho mal di testa da stamattina."],
    ["la febbre", "the fever", "Ho la febbre alta."],
    ["la visita", "the check-up", "Vorrei prenotare una visita."],
    ["l'allergia", "the allergy", "Ho un'allergia al lattosio."],
    ["la medicina", "the medicine", "Quando devo prendere la medicina?"],
    ["gli effetti collaterali", "side effects", "Ci sono effetti collaterali?"],
    ["lo stomaco vuoto", "empty stomach", "Va presa a stomaco vuoto?"],
    ["la guarigione", "the recovery", "Quanto dura la guarigione?"],
  ],
  safety: [
    ["l'avvertenza", "the warning", "Leggo bene l'avvertenza."],
    ["vietato", "forbidden", "Qui è vietato fumare."],
  ],
  routine: [
    ["la sveglia", "the alarm", "La sveglia suona alle sette."],
    ["la colazione", "the breakfast", "Faccio colazione a casa."],
    ["l'orario", "the schedule", "Questo è il mio orario di lavoro."],
    ["la mattina", "the morning", "La mattina arrivo presto."],
    ["il pomeriggio", "the afternoon", "Il pomeriggio ho una riunione."],
    ["la sera", "the evening", "La sera vado in palestra."],
    ["di solito", "usually", "Di solito pranzo alle tredici."],
    ["fare la spesa", "to do groceries", "Faccio la spesa il sabato."],
    ["essere libero", "to be free / available", "Sono libero dopo le sei."],
    ["organizzare la giornata", "to organize the day", "Organizzo la giornata la mattina."],
    ["l'abitudine", "the habit", "È una mia abitudine quotidiana."],
    ["il programma di domani", "tomorrow's plan", "Ti dico il programma di domani."],
  ],
  planning: [
    ["spostare l'orario", "to move the time", "Possiamo spostare l'orario?"], 
    ["trovare un accordo", "to reach an agreement", "Cerchiamo di trovare un accordo."],
  ],
  bureaucracy: [
    ["il modulo", "the form", "Devo compilare questo modulo."],
    ["lo sportello", "the counter / window", "Vado allo sportello tre."],
    ["l'appuntamento", "the appointment", "Ho un appuntamento alle undici."],
    ["la pratica", "the application / paperwork", "La pratica è quasi completa."],
    ["il documento", "the document", "Mi manca un documento importante."],
    ["la firma", "the signature", "Manca solo la firma qui."],
    ["il permesso", "the permit", "Il permesso scade a giugno."],
    ["la ricevuta", "the receipt", "Conservo la ricevuta."],
    ["la procedura", "the procedure", "Qual è la procedura corretta?"],
    ["l'ufficio competente", "the relevant office", "Qual è l'ufficio competente?"], 
    ["la richiesta", "the request", "Faccio una richiesta urgente."],
    ["la scadenza", "the deadline", "La scadenza è questa settimana."],
  ],
  negotiation: [
    ["la proposta", "the proposal", "La proposta mi sembra ragionevole."],
    ["il compromesso", "the compromise", "Possiamo trovare un compromesso."],
    ["la controproposta", "the counterproposal", "Questa è la mia controproposta."],
    ["le condizioni", "the conditions", "Vorrei chiarire le condizioni."],
  ],
  media: [
    ["l'intervista", "the interview", "L'intervista dura dieci minuti."],
    ["il messaggio chiave", "the key message", "Ripeto il messaggio chiave."],
    ["la domanda scomoda", "the uncomfortable question", "Arriva una domanda scomoda."],
    ["il pubblico", "the audience", "Penso al pubblico finale."],
  ],
  tech: [
    ["la demo", "the demo", "La demo funziona bene."],
    ["la roadmap", "the roadmap", "Presento la roadmap del prodotto."],
    ["l'utente", "the user", "L'utente vuole semplicità."],
    ["il lancio", "the launch", "Il lancio è previsto a settembre."],
  ],
};

const FALLBACK_VOCAB = [
  ["il problema", "the problem", "C'è un problema da risolvere."],
  ["la soluzione", "the solution", "Questa è una soluzione possibile."],
  ["l'obiettivo", "the objective", "L'obiettivo è chiaro."],
  ["il dettaglio", "the detail", "Serve un dettaglio in più."],
  ["la conferma", "the confirmation", "Aspetto una conferma scritta."],
  ["la decisione", "the decision", "Dobbiamo prendere una decisione."],
];

const CLOZE_BY_FOCUS = {
  article_gender_number: [
    ["___ camera è silenziosa.", ["La", "Il", "Lo", "Le"], 0, "camera is feminine singular"],
    ["Cerco ___ appartamento in centro.", ["un", "una", "uno", "un'"], 0, "appartamento is masculine singular"],
  ],
  preposition: [
    ["Vado ___ stazione alle sei.", ["alla", "nella", "sulla", "dalla"], 0, "direction toward a place"],
    ["Il contratto inizia ___ maggio.", ["a", "in", "da", "per"], 1, "months usually take in"],
  ],
  lexical_gap: [
    ["Ho bisogno di ___ informazione in più.", ["un'", "una", "uno", "un"], 0, "informazione uses elision"],
    ["Vorrei ___ il prezzo finale.", ["sapere", "parlare", "uscire", "aprire"], 0, "you want to know the final price"],
  ],
  lexical_choice: [
    ["Il quartiere è molto ___.", ["tranquillo", "urgente", "salata", "chiuso"], 0, "describe a neighborhood"],
    ["La proposta mi sembra ___.", ["ragionevole", "ritardo", "binario", "allergica"], 0, "describe a proposal"],
  ],
  agreement: [
    ["Le spese sono ___ nel prezzo.", ["incluse", "inclusi", "inclusa", "incluso"], 0, "feminine plural agreement"],
    ["I documenti sono già ___.", ["pronti", "pronte", "pronto", "pronta"], 0, "masculine plural agreement"],
  ],
  word_order: [
    ["Domani ___ il contratto insieme.", ["firmiamo", "firmo", "firmano", "firmi"], 0, "noi form"],
    ["Stasera ___ il punto sul progetto.", ["facciamo", "faccio", "fanno", "fai"], 0, "noi form"],
  ],
  verb_tense: [
    ["Ieri ___ la tua mail.", ["ho letto", "leggo", "leggerò", "leggevo"], 0, "completed past event"],
    ["Domani ___ il cliente.", ["vedrò", "vedo", "ho visto", "vedevo"], 0, "future plan"],
  ],
  verb_conjugation: [
    ["Noi ___ subito il responsabile.", ["chiamiamo", "chiamo", "chiamano", "chiami"], 0, "noi form"],
    ["Lei ___ se il wifi è incluso.", ["chiede", "chiedo", "chiedi", "chiedono"], 0, "lei form"],
  ],
  instruction_misread: [
    ["Per favore ___ il modulo in stampatello.", ["compila", "compilo", "compiliamo", "compilate"], 0, "imperative/request form"],
    ["Prima di partire, ___ il binario corretto.", ["controlla", "controllo", "controlliamo", "controllano"], 0, "check before leaving"],
  ],
  incomplete_response: [
    ["Per chiudere bene la chiamata, ___ il riepilogo finale.", ["serve", "servono", "servi", "servo"], 0, "impersonal expression"],
    ["Alla fine ___ tutti i dettagli importanti.", ["ripeti", "ripeto", "ripete", "ripetono"], 0, "you repeat all details"],
  ],
  off_topic: [
    ["Per restare sul punto, ___ solo la soluzione scelta.", ["spiega", "spiego", "spiegano", "spieghi"], 0, "keep focused on one answer"],
    ["Durante l'intervista ___ alla domanda precisa.", ["rispondi", "rispondo", "risponde", "rispondono"], 0, "stay on the asked point"],
  ],
  pragmatic_mismatch: [
    ["Con una persona anziana è meglio ___ il Lei.", ["usare", "usano", "usiamo", "uso"], 0, "formal register"],
    ["In una riunione formale bisogna ___ un tono calmo.", ["mantenere", "mantieni", "manteniamo", "mantengo"], 0, "formal tone"],
  ],
  negation_reversal: [
    ["Questa medicina ___ va presa a stomaco vuoto.", ["non", "mai", "già", "più"], 0, "safety negation"],
    ["___ dimenticare il documento d'identità.", ["Non", "Mai", "Già", "Più"], 0, "negative reminder"],
  ],
};

const WORD_BUILDERS_BY_TAG = {
  home: [
    ["Quanto costa l'affitto al mese", "How much is the monthly rent"],
    ["Le spese sono incluse nel prezzo", "Are the bills included in the price"],
    ["Quando posso visitare l'appartamento", "When can I visit the apartment"],
  ],
  food: [
    ["Vorrei ordinare un tavolo per due", "I would like to arrange a table for two"],
    ["Possiamo dividere il conto alla fine", "Can we split the bill at the end"],
    ["Il mio ospite è vegetariano stasera", "My guest is vegetarian tonight"],
  ],
  social: [
    ["Ti scrivo per confermare l'invito", "I am writing to confirm the invitation"],
    ["Possiamo spostare l'orario di un'ora", "Can we move the time by one hour"],
    ["Ci vediamo davanti al bar centrale", "Let's meet in front of the main bar"],
  ],
  travel: [
    ["Da quale binario parte il treno", "Which platform does the train leave from"],
    ["Ho perso la coincidenza a Bologna", "I missed the connection in Bologna"],
    ["Mi serve un biglietto di andata e ritorno", "I need a round-trip ticket"],
  ],
  work: [
    ["Domani confermo la mia disponibilità", "Tomorrow I confirm my availability"],
    ["Facciamo il punto sul progetto oggi", "Let's review the project today"],
    ["La riunione inizia alle dieci precise", "The meeting starts at exactly ten"],
  ],
  shopping: [
    ["Cerco una taglia più grande", "I am looking for a bigger size"],
    ["Posso provare questo vestito blu", "Can I try this blue dress"],
    ["Qual è la politica di reso", "What is the return policy"],
  ],
  health: [
    ["Ogni quanto devo prendere la medicina", "How often should I take the medicine"],
    ["Ho mal di testa da stamattina", "I have had a headache since this morning"],
    ["Ci sono effetti collaterali importanti", "Are there important side effects"],
  ],
  bureaucracy: [
    ["Devo compilare questo modulo oggi", "I need to fill out this form today"],
    ["Mi manca ancora un documento importante", "I am still missing an important document"],
    ["Ho un appuntamento allo sportello tre", "I have an appointment at counter three"],
  ],
  negotiation: [
    ["Vorrei fare una controproposta chiara", "I would like to make a clear counterproposal"],
    ["Possiamo trovare un compromesso realistico", "Can we find a realistic compromise"],
    ["Queste condizioni per me sono fondamentali", "These conditions are fundamental for me"],
  ],
  media: [
    ["Ripeto il messaggio chiave con calma", "I repeat the key message calmly"],
    ["Rispondo prima alla domanda principale", "I answer the main question first"],
    ["Alla fine riassumo i punti centrali", "At the end I summarize the main points"],
  ],
  tech: [
    ["La demo mostra il valore del prodotto", "The demo shows the product value"],
    ["La roadmap copre i prossimi sei mesi", "The roadmap covers the next six months"],
    ["L'utente vuole un flusso più semplice", "The user wants a simpler flow"],
  ],
};

const PATTERN_DRILLS_BY_FOCUS = {
  preposition: {
    name: "Prepositions under pressure",
    description: "Use the correct preposition in practical scenario questions.",
    sentences: [
      ["Vado ___ stazione dopo la riunione.", "___", "alla", "direction toward a place"],
      ["Il documento è ___ scrivania.", "___", "sulla", "location on top"],
      ["L'appuntamento è ___ maggio.", "___", "a", "day/time checkpoint wording"],
    ],
  },
  verb_conjugation: {
    name: "Mission verb control",
    description: "Conjugate practical verbs needed to close the task.",
    sentences: [
      ["Noi ___ il riepilogo finale adesso.", "___", "facciamo", "noi form"],
      ["Lei ___ una conferma scritta.", "___", "manda", "lei form"],
      ["Tu ___ la proposta con calma.", "___", "spieghi", "tu form"],
    ],
  },
  verb_tense: {
    name: "Past and future anchors",
    description: "Switch between what happened and what will happen next.",
    sentences: [
      ["Ieri ___ il problema al cliente.", "___", "ho spiegato", "completed past event"],
      ["Domani ___ la pratica in ufficio.", "___", "porterò", "future plan"],
      ["La settimana scorsa ___ in ritardo.", "___", "ero", "background state"],
    ],
  },
  agreement: {
    name: "Agreement check",
    description: "Keep articles and adjectives aligned with the noun.",
    sentences: [
      ["Le informazioni sono già ___.", "___", "pronte", "feminine plural"],
      ["I documenti sono ___.", "___", "corretti", "masculine plural"],
      ["La soluzione è molto ___.", "___", "chiara", "feminine singular"],
    ],
  },
  pragmatic_mismatch: {
    name: "Polite register",
    description: "Use the right register for formal conversations.",
    sentences: [
      ["Buongiorno, ___ una domanda.", "___", "avrei", "formal conditional"],
      ["La ringrazio, ___ molto utile.", "___", "è stato", "formal closing"],
      ["Se possibile, ___ una conferma scritta.", "___", "vorrei", "polite request"],
    ],
  },
  off_topic: {
    name: "Focused answers",
    description: "Answer the exact task without drifting away from the point.",
    sentences: [
      ["Per restare sul punto, ___ solo il costo finale.", "___", "spiega", "focus on the requested detail"],
      ["Durante l'intervista ___ prima alla domanda principale.", "___", "rispondi", "answer the main question first"],
      ["Alla fine ___ il dato più importante.", "___", "ripeti", "close by repeating the key fact"],
    ],
  },
  incomplete_response: {
    name: "Complete response builder",
    description: "Give answers that include every required detail.",
    sentences: [
      ["Per chiudere bene la chiamata ___ il riepilogo completo.", "___", "fai", "include a full recap"],
      ["Alla fine ___ prezzo, data e condizioni.", "___", "conferma", "state all mandatory details"],
      ["Se manca un'informazione ___ una domanda in più.", "___", "fai", "ask for the missing detail"],
    ],
  },
  lexical_gap: {
    name: "Core mission vocabulary",
    description: "Use practical lexical chunks needed to complete the task.",
    sentences: [
      ["Ho bisogno di ___ scritta dal responsabile.", "___", "una conferma", "key task noun phrase"],
      ["Prima di partire controllo ___ esatto.", "___", "il binario", "travel detail"],
      ["Per chiudere la pratica manca ___ firmato.", "___", "il modulo", "bureaucracy detail"],
    ],
  },
  lexical_choice: {
    name: "Precise lexical choice",
    description: "Choose the most natural mission phrase for the situation.",
    sentences: [
      ["Per descrivere il quartiere dico che è ___.", "___", "tranquillo", "natural description"],
      ["Quando negozio il prezzo propongo un ___.", "___", "compromesso", "negotiation vocabulary"],
      ["Durante una call difficile cerco una ___ chiara.", "___", "soluzione", "problem-solving noun"],
    ],
  },
  pronunciation_prosody: {
    name: "Clear spoken delivery",
    description: "Shape sentences for stress, pacing, and intelligibility.",
    sentences: [
      ["Quando parlo in radio ___ più lentamente.", "___", "respiro", "keep phrasing under control"],
      ["Per essere chiaro ___ una pausa prima del numero.", "___", "faccio", "prosody support"],
      ["Alla fine ___ bene la parola chiave.", "___", "ripeto", "repeat key word clearly"],
    ],
  },
  instruction_misread: {
    name: "Instruction decoding",
    description: "Follow multi-step instructions in the correct order.",
    sentences: [
      ["Prima ___ il modulo, poi vai allo sportello.", "___", "compila", "step one first"],
      ["Alla fine ___ la ricevuta e il documento.", "___", "porta", "carry both required items"],
      ["Se qualcosa non è chiaro ___ di ripetere.", "___", "chiedi", "clarify the instruction"],
    ],
  },
};

const ERROR_HUNTS_BY_FOCUS = {
  article_gender_number: [
    ["Il stanza è disponibile subito.", "La stanza è disponibile subito.", "Use the correct feminine article."],
    ["Le contratto inizia lunedì.", "Il contratto inizia lunedì.", "Contratto is masculine singular."],
  ],
  preposition: [
    ["Vado in stazione alle sei.", "Vado alla stazione alle sei.", "Direction toward a place needs a + article."],
    ["Abito a Italia da due mesi.", "Abito in Italia da due mesi.", "Countries usually take in."],
  ],
  agreement: [
    ["Le spese sono incluso nel prezzo.", "Le spese sono incluse nel prezzo.", "The adjective must agree in feminine plural."],
    ["I documenti sono pronta.", "I documenti sono pronti.", "Masculine plural agreement is required."],
  ],
  instruction_misread: [
    ["Compili il modulo dopo vai allo sportello tre.", "Compili il modulo, poi vada allo sportello tre.", "The sequence and formal register should be clearer."],
    ["Porta la ricevuta ma non il documento.", "Porti la ricevuta e anche il documento.", "The original changes the instruction meaning."],
  ],
  incomplete_response: [
    ["Il treno parte alle nove.", "Il treno parte alle nove dal binario quattro.", "The answer is incomplete because it omits the platform."],
    ["Sì, va bene.", "Sì, va bene: confermo il prezzo, le spese incluse e la data di ingresso.", "A closing answer should restate the key facts."],
  ],
  off_topic: [
    ["Mi piace molto Milano, comunque il rimborso...", "Per il rimborso mi serve il numero pratica e la data del pagamento.", "The answer should stay on the task."],
    ["Il mio progetto è interessante ma parlando della taglia...", "Per la taglia mi serve una misura 42 in blu.", "The answer drifts away from the question."],
  ],
  negation_reversal: [
    ["Puoi prendere questa medicina a stomaco vuoto.", "Non puoi prendere questa medicina a stomaco vuoto.", "Negation changes the safety meaning."],
    ["Non serve evitare alcolici con questo farmaco.", "Serve evitare alcolici con questo farmaco.", "The negation reverses the warning."],
  ],
};

const SPEED_TRANSLATION_BY_TAG = {
  home: [
    ["Is the wifi included?", ["Il wifi è incluso?", "Il wifi è chiuso?", "Il wifi costa?", "Il wifi arriva domani?"], 0],
    ["When can I visit the room?", ["Quando posso visitare la stanza?", "Quanto posso pagare la stanza?", "Dove posso comprare la stanza?", "Perché posso lasciare la stanza?"], 0],
  ],
  food: [
    ["Can we split the bill?", ["Possiamo dividere il conto?", "Possiamo prenotare il conto?", "Possiamo cambiare il menù?", "Possiamo chiudere la cucina?"], 0],
    ["My guest is vegetarian.", ["Il mio ospite è vegetariano.", "Il mio ospite è in ritardo.", "Il mio ospite è di Milano.", "Il mio ospite è sul tavolo."], 0],
  ],
  travel: [
    ["Which platform does the train leave from?", ["Da quale binario parte il treno?", "Quanto costa il binario del treno?", "Dove dorme il treno?", "Perché parte la stazione?"], 0],
    ["I missed the connection in Bologna.", ["Ho perso la coincidenza a Bologna.", "Ho pagato la coincidenza a Bologna.", "Ho trovato la stazione a Bologna.", "Ho chiuso il binario a Bologna."], 0],
  ],
  work: [
    ["The meeting starts at ten.", ["La riunione inizia alle dieci.", "La riunione finisce alle dieci?", "La riunione costa alle dieci.", "La riunione chiama alle dieci."], 0],
    ["I will send the summary today.", ["Manderò il riepilogo oggi.", "Chiederò il riepilogo oggi.", "Cambierò il riepilogo oggi?", "Chiudo il riepilogo oggi."], 0],
  ],
  shopping: [
    ["Can I try this size?", ["Posso provare questa taglia?", "Posso comprare questa taglia?", "Posso chiudere questa taglia?", "Posso vedere questa cassa?"], 0],
    ["Do you have another color?", ["Avete un altro colore?", "Avete un altro contratto?", "Avete un altro binario?", "Avete un altro medico?"], 0],
  ],
  health: [
    ["How often do I take this medicine?", ["Ogni quanto prendo questa medicina?", "Quanto costa questa medicina?", "Dove porto questa medicina?", "Perché apro questa medicina?"], 0],
    ["I have had a headache since this morning.", ["Ho mal di testa da stamattina.", "Ho il treno da stamattina.", "Ho la taglia da stamattina.", "Ho la firma da stamattina."], 0],
  ],
  bureaucracy: [
    ["I still need one document.", ["Mi serve ancora un documento.", "Mi costa ancora un documento.", "Mi piace ancora un documento.", "Mi aspetta ancora un documento."], 0],
    ["I have an appointment at counter three.", ["Ho un appuntamento allo sportello tre.", "Ho un progetto allo sportello tre.", "Ho una visita allo sportello tre?", "Ho un binario allo sportello tre."], 0],
  ],
  media: [
    ["I want to repeat the key message clearly.", ["Voglio ripetere chiaramente il messaggio chiave.", "Voglio chiudere chiaramente il binario chiave.", "Voglio comprare il messaggio chiave.", "Voglio visitare il messaggio chiave."], 0],
  ],
};

const CONVERSATION_STYLES = {
  home: "You are practical and direct. Ask follow-up questions about cost, timing, and included items. Speak naturally in Italian.",
  food: "You are warm but busy. Keep the interaction realistic and ask one clarification question if the learner is vague. Speak Italian.",
  social: "You are friendly and natural. React to tone and register, and keep the conversation grounded in the social situation.",
  travel: "You are helpful but under time pressure. Give exact times, platforms, or route details in Italian.",
  work: "You are concise and professional. Push for clarity on timing, ownership, and next steps.",
  shopping: "You are a helpful shop assistant. Suggest alternatives and ask about size, color, or budget.",
  health: "You are careful and safety-focused. Ask about timing, dosage, and allergies. Speak clearly in Italian.",
  bureaucracy: "You are formal and procedural. Require the learner to provide the correct detail before moving on.",
  media: "You are a journalist. Ask short follow-up questions and expect focused answers.",
  negotiation: "You are firm but open to compromise. Ask the learner to justify tradeoffs.",
  tech: "You are a product stakeholder. Ask about value, roadmap, and user impact.",
};

function uniqueBy(list, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function slug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickTagBank(tags) {
  const combined = [];
  for (const tag of tags) {
    for (const row of TAG_VOCAB[tag] ?? []) combined.push({ tag, row });
  }
  for (const row of FALLBACK_VOCAB) combined.push({ tag: "general", row });
  return uniqueBy(combined, (entry) => entry.row[0]);
}

function pickWordBuilders(tags) {
  const combined = [];
  for (const tag of tags) {
    for (const row of WORD_BUILDERS_BY_TAG[tag] ?? []) combined.push({ tag, row });
  }
  for (const row of WORD_BUILDERS_BY_TAG.work) combined.push({ tag: "general", row });
  return uniqueBy(combined, (entry) => entry.row[0]);
}

function pickSpeedTranslations(tags) {
  const combined = [];
  for (const tag of tags) {
    for (const row of SPEED_TRANSLATION_BY_TAG[tag] ?? []) combined.push({ tag, row });
  }
  for (const row of SPEED_TRANSLATION_BY_TAG.work) combined.push({ tag: "general", row });
  return uniqueBy(combined, (entry) => entry.row[0]);
}

function pickFocusRows(focuses, bank) {
  const combined = [];
  for (const focus of focuses) {
    const value = bank[focus];
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const row of value) combined.push({ focus, row });
      continue;
    }
    combined.push({ focus, row: value });
  }
  return combined;
}

function exerciseSkillForType(type) {
  if (type === "srs") return "vocab_core";
  if (type === "cloze" || type === "pattern_drill") return "grammar_forms";
  if (type === "word_builder") return "grammar_syntax";
  if (type === "speed_translation") return "listening_literal";
  if (type === "error_hunt") return "reading_comprehension";
  if (type === "conversation") return "speaking_fluency";
  return "task_completion";
}

function countType(entries, type) {
  return entries.filter((entry) => entry.type === type).length;
}

function buildMissionLibrary(mission) {
  const entries = [];
  let order = 1;
  const tagBank = pickTagBank(mission.tags);
  const wordBuilders = pickWordBuilders(mission.tags);
  const speedTranslations = pickSpeedTranslations(mission.tags);
  const clozeRows = pickFocusRows(mission.errorFocus, CLOZE_BY_FOCUS);
  const patternRows = pickFocusRows(mission.errorFocus, PATTERN_DRILLS_BY_FOCUS);
  const errorHunts = pickFocusRows(mission.errorFocus, ERROR_HUNTS_BY_FOCUS);
  const focusFallback = mission.errorFocus[0] ?? "lexical_gap";
  const primaryTag = mission.tags[0] ?? "work";
  const tonePrompt = CONVERSATION_STYLES[primaryTag] ?? CONVERSATION_STYLES.work;
  const checkpoints = mission.checkpoints ?? [];

  for (const { tag, row } of tagBank.slice(0, 36)) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "srs",
      tier: "quick",
      order: order++,
      title: row[0],
      skillId: exerciseSkillForType("srs"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `srs-${slug(row[0])}`,
      content: { front: row[0], back: row[1], example: row[2], tag, level: mission.level },
      active: true,
    });
  }

  while (countType(entries, "srs") < 36) {
    const idx = countType(entries, "srs") % tagBank.length;
    const { tag, row } = tagBank[idx];
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "srs",
      tier: "quick",
      order: order++,
      title: `${row[0]} review`,
      skillId: exerciseSkillForType("srs"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `srs-fallback-${slug(row[0])}-${countType(entries, "srs")}`,
      content: { front: row[0], back: row[1], example: row[2], tag, level: mission.level },
      active: true,
    });
  }

  for (const { focus, row } of clozeRows.slice(0, 6)) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "cloze",
      tier: "standard",
      order: order++,
      title: `${focus} cloze`,
      checkpointId: checkpoints[0]?.id,
      skillId: exerciseSkillForType("cloze"),
      tags: mission.tags,
      errorFocus: [focus],
      variantKey: `cloze-${focus}-${order}`,
      content: {
        sentence: row[0],
        blank_index: 0,
        options: row[1],
        correct: row[2],
        hint: row[3],
      },
      active: true,
    });
  }

  for (const { tag, row } of wordBuilders.slice(0, 6)) {
    const words = row[0].split(" ");
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "word_builder",
      tier: "standard",
      order: order++,
      title: `${tag} sentence build`,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("word_builder"),
      tags: mission.tags,
      errorFocus: ["word_order"],
      variantKey: `wb-${slug(row[0])}`,
      content: {
        target_sentence: row[0],
        scrambled_words: [...words].reverse(),
        translation: row[1],
      },
      active: true,
    });
  }

  while (countType(entries, "word_builder") < 6) {
    const idx = countType(entries, "word_builder") % wordBuilders.length;
    const { tag, row } = wordBuilders[idx];
    const words = row[0].split(" ");
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "word_builder",
      tier: "standard",
      order: order++,
      title: `${tag} sentence build`,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("word_builder"),
      tags: mission.tags,
      errorFocus: ["word_order"],
      variantKey: `wb-fallback-${slug(row[0])}-${countType(entries, "word_builder")}`,
      content: {
        target_sentence: row[0],
        scrambled_words: [...words].sort((a, b) => b.localeCompare(a)),
        translation: row[1],
      },
      active: true,
    });
  }

  for (const { focus, row } of patternRows.slice(0, 3)) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "pattern_drill",
      tier: "standard",
      order: order++,
      title: row.name,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("pattern_drill"),
      tags: mission.tags,
      errorFocus: [focus],
      variantKey: `pattern-${focus}`,
      content: {
        pattern_name: row.name,
        pattern_description: row.description,
        sentences: row.sentences.map((sentence) => ({
          template: sentence[0],
          blank: sentence[1],
          correct: sentence[2],
          hint: sentence[3],
        })),
      },
      active: true,
    });
  }

  for (const { tag, row } of speedTranslations.slice(0, 4)) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "speed_translation",
      tier: "standard",
      order: order++,
      title: `${tag} translation sprint`,
      checkpointId: checkpoints[2]?.id ?? checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("speed_translation"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `translation-${slug(row[0])}`,
      content: {
        sentences: [
          { source: row[0], options: row[1], correct: row[2] },
        ],
        time_limit_seconds: 30,
      },
      active: true,
    });
  }

  for (const { focus, row } of errorHunts.slice(0, 4)) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "error_hunt",
      tier: "standard",
      order: order++,
      title: `${focus} error hunt`,
      checkpointId: checkpoints[2]?.id ?? checkpoints[1]?.id,
      skillId: exerciseSkillForType("error_hunt"),
      tags: mission.tags,
      errorFocus: [focus],
      variantKey: `error-${focus}-${order}`,
      content: {
        sentences: [
          {
            text: row[0],
            has_error: true,
            corrected: row[1],
            explanation: row[2],
          },
          {
            text: row[1],
            has_error: false,
            corrected: row[1],
            explanation: "The sentence is already correct.",
          },
        ],
      },
      active: true,
    });
  }

  const fallbackCloze = (CLOZE_BY_FOCUS[focusFallback] ?? CLOZE_BY_FOCUS.lexical_gap)[0];
  while (countType(entries, "cloze") < 6) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "cloze",
      tier: "standard",
      order: order++,
      title: `${focusFallback} fallback cloze`,
      checkpointId: checkpoints[0]?.id,
      skillId: exerciseSkillForType("cloze"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `cloze-fallback-${countType(entries, "cloze")}`,
      content: {
        sentence: fallbackCloze[0],
        blank_index: 0,
        options: fallbackCloze[1],
        correct: fallbackCloze[2],
        hint: fallbackCloze[3],
      },
      active: true,
    });
  }

  const fallbackPattern = PATTERN_DRILLS_BY_FOCUS[focusFallback] ?? PATTERN_DRILLS_BY_FOCUS.verb_conjugation;
  const patternFallbackKeys = uniqueBy(
    [...mission.errorFocus, "verb_conjugation", "preposition", "agreement", "incomplete_response", "off_topic"]
      .filter((focus) => Boolean(PATTERN_DRILLS_BY_FOCUS[focus]))
      .map((focus) => ({ focus, row: PATTERN_DRILLS_BY_FOCUS[focus] })),
    (entry) => entry.focus
  );

  for (const { focus, row } of patternFallbackKeys) {
    if (countType(entries, "pattern_drill") >= 4) break;
    if (entries.some((entry) => entry.type === "pattern_drill" && entry.variantKey === `pattern-${focus}`)) continue;
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "pattern_drill",
      tier: "standard",
      order: order++,
      title: row.name,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("pattern_drill"),
      tags: mission.tags,
      errorFocus: [focus],
      variantKey: `pattern-${focus}`,
      content: {
        pattern_name: row.name,
        pattern_description: row.description,
        sentences: row.sentences.map((sentence) => ({
          template: sentence[0],
          blank: sentence[1],
          correct: sentence[2],
          hint: sentence[3],
        })),
      },
      active: true,
    });
  }

  while (countType(entries, "pattern_drill") < 4) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "pattern_drill",
      tier: "standard",
      order: order++,
      title: fallbackPattern.name,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("pattern_drill"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `pattern-fallback-${countType(entries, "pattern_drill")}`,
      content: {
        pattern_name: fallbackPattern.name,
        pattern_description: fallbackPattern.description,
        sentences: fallbackPattern.sentences.map((sentence) => ({
          template: sentence[0],
          blank: sentence[1],
          correct: sentence[2],
          hint: sentence[3],
        })),
      },
      active: true,
    });
  }

  const fallbackError = (ERROR_HUNTS_BY_FOCUS[focusFallback] ?? ERROR_HUNTS_BY_FOCUS.preposition)[0];
  while (countType(entries, "error_hunt") < 4) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "error_hunt",
      tier: "standard",
      order: order++,
      title: `${focusFallback} fallback hunt`,
      checkpointId: checkpoints[2]?.id ?? checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("error_hunt"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `error-fallback-${countType(entries, "error_hunt")}`,
      content: {
        sentences: [
          {
            text: fallbackError[0],
            has_error: true,
            corrected: fallbackError[1],
            explanation: fallbackError[2],
          },
          {
            text: fallbackError[1],
            has_error: false,
            corrected: fallbackError[1],
            explanation: "The sentence is already correct.",
          },
        ],
      },
      active: true,
    });
  }

  const fallbackTranslation = (SPEED_TRANSLATION_BY_TAG[primaryTag] ?? SPEED_TRANSLATION_BY_TAG.work)[0];
  while (countType(entries, "speed_translation") < 4) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "speed_translation",
      tier: "standard",
      order: order++,
      title: `${primaryTag} fallback translation`,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("speed_translation"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `translation-fallback-${countType(entries, "speed_translation")}`,
      content: {
        sentences: [{ source: fallbackTranslation[0], options: fallbackTranslation[1], correct: fallbackTranslation[2] }],
        time_limit_seconds: 30,
      },
      active: true,
    });
  }

  while (countType(entries, "error_hunt") < 4) {
    const fallback = (ERROR_HUNTS_BY_FOCUS.preposition)[countType(entries, "error_hunt") % ERROR_HUNTS_BY_FOCUS.preposition.length];
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "error_hunt",
      tier: "standard",
      order: order++,
      title: `${focusFallback} extra hunt`,
      checkpointId: checkpoints[2]?.id ?? checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("error_hunt"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `error-extra-${countType(entries, "error_hunt")}`,
      content: {
        sentences: [
          { text: fallback[0], has_error: true, corrected: fallback[1], explanation: fallback[2] },
          { text: fallback[1], has_error: false, corrected: fallback[1], explanation: "The sentence is already correct." },
        ],
      },
      active: true,
    });
  }

  for (const checkpoint of checkpoints.slice(0, 3)) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "conversation",
      tier: "deep",
      order: order++,
      title: checkpoint.title,
      checkpointId: checkpoint.id,
      skillId: exerciseSkillForType("conversation"),
      tags: mission.tags,
      errorFocus: mission.errorFocus.slice(0, 2),
      variantKey: `conversation-${slug(checkpoint.id)}`,
      content: {
        scenario: `${mission.scenario} Focus now on this checkpoint: ${checkpoint.description}`,
        target_phrases: pickTagBank(mission.tags).slice(0, 5).map((entry) => entry.row[0]),
        grammar_focus: mission.errorFocus.slice(0, 2).join(" + "),
        difficulty: mission.level,
        system_prompt: `${tonePrompt} The learner's task is: ${checkpoint.description} Require a clear practical answer before closing the conversation.`,
      },
      active: true,
    });
  }

  entries.push({
    missionId: mission.missionId,
    level: mission.level,
    type: "reflection",
    tier: "deep",
    order: order++,
    title: "Mission reflection",
    checkpointId: checkpoints.at(-1)?.id,
    skillId: exerciseSkillForType("reflection"),
    tags: mission.tags,
    errorFocus: mission.errorFocus.slice(0, 2),
    variantKey: "reflection-main",
    content: {
      prompt: `After "${mission.title}", which detail was hardest to communicate or confirm?`,
      follow_up: `What exact phrase will you reuse next time to improve the mission objective: ${mission.objective}`,
    },
    active: true,
  });

  return entries;
}

export const MISSION_EXERCISE_LIBRARY = MISSIONS
  .filter((mission) => mission.level !== "B2")
  .flatMap((mission) => buildMissionLibrary(mission));
