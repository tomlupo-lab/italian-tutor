// @ts-nocheck
import { MISSIONS } from "./progressionCatalog";

const TAG_VOCAB = {
  home: [
    ["l'affitto", "the rent", "Quanto costa l'affitto al mese?"],
    ["il deposito cauzionale", "the security deposit", "Il deposito cauzionale è di due mensilità."],
    ["le spese", "the extra monthly costs", "Le spese mensili sono incluse o no?"],
    ["il contratto", "the contract", "Il contratto inizia a maggio."],
    ["la stanza", "the room", "La stanza è piccola ma luminosa."],
    ["il quartiere", "the neighborhood", "Il quartiere è tranquillo la sera."],
    ["l'appartamento", "the apartment", "L'appartamento è vicino alla metro."],
    ["la visita", "the apartment viewing", "Possiamo fissare una visita domani?"],
    ["la cucina", "the kitchen", "La cucina è condivisa."],
    ["il bagno", "the bathroom", "Il bagno è privato?"],
    ["il proprietario", "the landlord", "Il proprietario vive in città."],
    ["incluso", "included", "Il wifi è incluso nel prezzo?"],
  ],
  housing: [
    ["il trasloco", "the move", "Il trasloco è previsto per lunedì."],
    ["la data di disponibilità", "the move-in date", "Qual è la data di disponibilità?"],
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
    ["La spiegazione è molto ___.", ["chiara", "urgente", "salata", "chiuso"], 0, "describe an explanation naturally"],
    ["Questa scelta mi sembra ___.", ["ragionevole", "ritardo", "binario", "allergica"], 0, "describe a choice or option"],
  ],
  agreement: [
    ["Le spese sono ___ nel prezzo.", ["incluse", "inclusi", "inclusa", "incluso"], 0, "feminine plural agreement"],
    ["I documenti sono già ___.", ["pronti", "pronte", "pronto", "pronta"], 0, "masculine plural agreement"],
  ],
  word_order: [
    ["Domani ___ il contratto insieme.", ["firmiamo", "firmo", "firmano", "firmi"], 0, "noi form"],
    ["Adesso ___ un riepilogo finale.", ["facciamo", "faccio", "fanno", "fai"], 0, "noi form"],
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
    ["Vorrei un tavolo per due", "I would like a table for two"],
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

const GENERAL_WORD_BUILDERS = [
  ["Può ripetere l'ultima informazione", "Can you repeat the last piece of information"],
  ["Vorrei confermare i dettagli principali", "I would like to confirm the main details"],
  ["Grazie, adesso è tutto chiaro", "Thank you, now everything is clear"],
];

const A1_GENERAL_WORD_BUILDERS = [
  ["Vorrei un caffè per favore", "I would like a coffee please"],
  ["Ho bisogno di aiuto adesso", "I need help now"],
  ["Può ripetere più lentamente", "Can you repeat more slowly"],
  ["A che ora ci vediamo", "What time are we meeting"],
  ["Mi serve una farmacia vicina", "I need a nearby pharmacy"],
  ["Scusi dove si compra il biglietto", "Excuse me where do I buy the ticket"],
];

const A1_WORD_BUILDERS_BY_TAG = {
  home: [
    ["Il supermercato è vicino a casa", "The supermarket is close to home"],
    ["Abito al terzo piano senza ascensore", "I live on the third floor without an elevator"],
    ["La fermata è davanti al portone", "The stop is in front of the building entrance"],
  ],
  social: [
    ["Ti scrivo per confermare l'orario", "I am writing to confirm the time"],
    ["Ci vediamo davanti alla stazione", "Let's meet in front of the station"],
    ["Possiamo spostare l'appuntamento di un'ora", "Can we move the appointment by one hour"],
  ],
  travel: [
    ["Da quale binario parte il treno", "Which platform does the train leave from"],
    ["Scusi dove posso comprare il biglietto", "Excuse me where can I buy the ticket"],
    ["Questa è la fermata giusta", "Is this the right stop"],
  ],
  work: [
    ["Domani arrivo in ufficio alle nove", "Tomorrow I arrive at the office at nine"],
    ["La riunione è online o in ufficio", "Is the meeting online or at the office"],
    ["Posso fare una pausa adesso", "Can I take a break now"],
  ],
  shopping: [
    ["Avete questa taglia in nero", "Do you have this size in black"],
    ["Posso pagare con la carta", "Can I pay by card"],
    ["Cerco un regalo semplice", "I am looking for a simple gift"],
  ],
  health: [
    ["Mi fa male la testa da stamattina", "My head has hurt since this morning"],
    ["Mi serve una farmacia di turno", "I need an open duty pharmacy"],
    ["Quando devo prendere questa medicina", "When do I need to take this medicine"],
  ],
  bureaucracy: [
    ["Devo portare il passaporto domani", "I need to bring the passport tomorrow"],
    ["Scusi dov'è lo sportello informazioni", "Excuse me where is the information desk"],
    ["Mi manca una firma qui", "I am missing one signature here"],
  ],
  routine: [
    ["Ieri ho preso il treno alle otto", "Yesterday I took the train at eight"],
    ["La mattina esco di casa presto", "In the morning I leave home early"],
    ["Dopo il lavoro torno subito a casa", "After work I go straight home"],
  ],
  planning: [
    ["Prima confermo l'orario poi ti scrivo", "First I confirm the time then I write to you"],
    ["Se arrivo tardi ti mando un messaggio", "If I am late I send you a message"],
    ["Organizzo la giornata questa sera", "I organize the day this evening"],
  ],
};

const A2_WORD_BUILDERS_BY_TAG = {
  home: [
    ["Dobbiamo chiarire le regole della casa prima di lunedì", "We need to clarify the house rules before Monday"],
    ["Possiamo dividere le spese in modo più equo", "Can we split the costs more fairly"],
    ["Vorrei confermare quando è disponibile la stanza", "I would like to confirm when the room is available"],
    ["Ieri sono passato davanti all'appartamento ma non c'era nessuno", "Yesterday I went by the apartment but nobody was there"],
    ["La lavanderia è dietro la piazza principale", "The laundromat is behind the main square"],
    ["Quando arrivi sali al secondo piano e gira a sinistra", "When you arrive go up to the second floor and turn left"],
  ],
  social: [
    ["Ti scrivo per confermare l'orario e il punto d'incontro", "I am writing to confirm the time and meeting point"],
    ["Se cambia il programma avvisami il prima possibile", "If the plan changes let me know as soon as possible"],
    ["Vorrei spiegare meglio perché arrivo più tardi", "I would like to explain better why I am arriving later"],
  ],
  travel: [
    ["Se perdo la coincidenza devo trovare un'altra soluzione", "If I miss the connection I have to find another solution"],
    ["Mi serve un biglietto che posso cambiare senza problemi", "I need a ticket that I can change without problems"],
    ["Vorrei sapere se il ritardo influisce sulla prenotazione", "I would like to know whether the delay affects the booking"],
    ["Ieri siamo arrivati in stazione troppo tardi per il cambio", "Yesterday we arrived at the station too late for the change"],
    ["Il pullman ferma davanti al museo e poi gira a destra", "The bus stops in front of the museum and then turns right"],
  ],
  work: [
    ["Devo spiegare il problema in modo chiaro al collega", "I have to explain the problem clearly to my colleague"],
    ["Possiamo spostare la riunione perché manca un'informazione", "Can we move the meeting because one piece of information is missing"],
    ["Alla fine mando un messaggio con i dettagli confermati", "At the end I send a message with the confirmed details"],
    ["Ieri abbiamo finito tardi e oggi riprendiamo dallo stesso punto", "Yesterday we finished late and today we pick up from the same point"],
  ],
  health: [
    ["Vorrei confermare ogni quanto devo prendere la medicina", "I would like to confirm how often I need to take the medicine"],
    ["Se il sintomo peggiora richiamo domani mattina", "If the symptom gets worse I call back tomorrow morning"],
    ["Mi serve una spiegazione più chiara degli effetti collaterali", "I need a clearer explanation of the side effects"],
  ],
  bureaucracy: [
    ["Mi manca ancora un documento e non so dove trovarlo", "I am still missing one document and I do not know where to find it"],
    ["Vorrei capire quale modulo devo compilare per primo", "I would like to understand which form I need to fill out first"],
    ["Posso fissare un nuovo appuntamento se cambia la procedura", "Can I set a new appointment if the procedure changes"],
  ],
  planning: [
    ["Prima confermo l'orario poi mando il riepilogo finale", "First I confirm the time then I send the final recap"],
    ["Se qualcosa cambia troviamo subito un'altra soluzione", "If something changes we find another solution immediately"],
    ["Vorrei organizzare meglio la giornata di domani", "I would like to organize tomorrow better"],
  ],
  routine: [
    ["Ieri sono uscito più tardi del previsto e ho perso l'autobus", "Yesterday I left later than expected and missed the bus"],
    ["Di solito passo dal supermercato prima di tornare a casa", "I usually stop by the supermarket before going home"],
    ["Questa mattina ho cambiato strada perché c'era traffico", "This morning I changed route because there was traffic"],
  ],
};

const A2_CLOZE_BY_FOCUS = {
  preposition: [
    ["Se c'è un ritardo, avvisami ___ messaggio.", ["con", "da", "su", "di"], 0, "you notify someone with a message"],
    ["Vorrei un chiarimento ___ questo punto del contratto.", ["su", "a", "di", "da"], 0, "you ask for clarification on a point"],
    ["La fermata giusta è proprio ___ farmacia.", ["davanti alla", "dentro la", "sotto la", "contro la"], 0, "location in front of a place"],
    ["Passo ___ stazione prima di andare a casa.", ["dalla", "sulla", "nella", "tra"], 0, "movement via a place"],
  ],
  lexical_gap: [
    ["Se cambia l'orario, mandami un ___ appena puoi.", ["messaggio", "binario", "quartiere", "antipasto"], 0, "you send a message when plans change"],
    ["Prima di chiudere la chiamata faccio un breve ___.", ["riepilogo", "ritardo", "deposito", "sciopero"], 0, "you make a recap before ending"],
  ],
  lexical_choice: [
    ["La tua spiegazione è più ___ adesso.", ["chiara", "storta", "chiusa", "salata"], 0, "describe an explanation naturally"],
    ["Questa soluzione mi sembra più ___.", ["pratica", "nuvolosa", "stretta", "fermata"], 0, "evaluate a practical solution"],
  ],
  agreement: [
    ["Le nuove condizioni sono già state ___.", ["confermate", "confermato", "confermati", "confermata"], 0, "conditions is feminine plural"],
    ["I dettagli principali restano ___.", ["uguali", "uguale", "uguala", "ugualiamo"], 0, "details stay the same"],
  ],
  word_order: [
    ["Prima di uscire ___ i dettagli finali.", ["controllo", "controlli", "controllano", "controlliamo"], 0, "first person singular"],
    ["Alla fine della chiamata ___ tutto con calma.", ["ripeto", "ripeti", "ripetono", "ripetiamo"], 0, "repeat everything calmly"],
  ],
  verb_tense: [
    ["Se domani non ___ risposta, richiamo io.", ["ricevo", "riceverò", "ricevevo", "ho ricevuto"], 0, "real future condition"],
    ["Ieri ti ___ per confermare l'orario.", ["ho scritto", "scrivo", "scriverò", "scrivevo"], 0, "completed past action"],
    ["Ieri sera ___ l'ultimo autobus e ho preso un taxi.", ["ho perso", "perdo", "perderò", "perdevo"], 0, "completed past disruption"],
    ["Quando sono arrivato in ufficio, tutti ___ già la modifica.", ["avevano visto", "vedono", "vedranno", "hanno visto"], 0, "prior completed action in the past"],
  ],
  verb_conjugation: [
    ["Se loro non ___ in tempo, cambiamo il piano.", ["arrivano", "arriva", "arriviamo", "arrivi"], 0, "loro form"],
    ["Lei ___ se manca ancora un allegato.", ["controlla", "controllo", "controlli", "controlliamo"], 0, "formal third person"],
    ["Noi ___ sempre dalla stessa uscita quando piove.", ["passiamo", "passo", "passano", "passi"], 0, "noi form with movement"],
    ["Loro ___ al terzo piano senza prendere l'ascensore.", ["salgono", "sale", "saliamo", "sali"], 0, "loro form with location"],
  ],
  instruction_misread: [
    ["Prima di inviare tutto, ___ anche la ricevuta.", ["allega", "allego", "allegano", "alleghi"], 0, "attach the receipt too"],
    ["Quando finisci la chiamata, ___ data e orario concordati.", ["conferma", "confermo", "confermano", "confermi"], 0, "confirm date and time"],
    ["Quando arrivi in stazione, ___ subito verso il binario indicato.", ["vai", "vado", "andiamo", "vanno"], 0, "go to the indicated platform"],
    ["Prima di tornare a casa, ___ dal supermercato per la spesa.", ["passa", "passo", "passano", "passiamo"], 0, "stop by a location before returning"],
  ],
  incomplete_response: [
    ["Per essere più completo, ___ anche il motivo del cambio.", ["spiega", "spiego", "spieghi", "spiegano"], 0, "add the reason too"],
    ["Se qualcosa non è chiaro, ___ una domanda in più.", ["fai", "faccio", "fanno", "faiamo"], 0, "ask an extra question"],
  ],
  off_topic: [
    ["Per restare sul punto, ___ prima al problema principale.", ["rispondi", "rispondo", "risponde", "rispondono"], 0, "stay on the main issue"],
    ["Se la situazione cambia, ___ solo i dettagli utili.", ["spiega", "spiego", "spieghi", "spiegano"], 0, "give only useful details"],
  ],
  pragmatic_mismatch: [
    ["In una richiesta delicata è meglio ___ un tono più gentile.", ["usare", "usano", "usiamo", "uso"], 0, "choose a softer tone"],
    ["Se non sei sicuro, puoi ___ una conferma.", ["chiedere", "chiedono", "chiedi", "chiedo"], 0, "ask for confirmation"],
  ],
  negation_reversal: [
    ["Con questa medicina ___ devi bere alcolici.", ["non", "mai", "già", "più"], 0, "negative safety instruction"],
    ["Nel messaggio finale ___ dimenticare il riferimento della pratica.", ["non", "mai", "già", "più"], 0, "important reminder"],
  ],
};

const A1_CLOZE_BY_FOCUS = {
  article_gender_number: [
    ["___ stazione è vicina.", ["La", "Il", "Lo", "Le"], 0, "stazione is feminine singular"],
    ["Cerco ___ farmacia aperta.", ["una", "un", "uno", "un'"], 0, "farmacia is feminine singular"],
  ],
  preposition: [
    ["Vado ___ stazione alle sei.", ["alla", "nella", "sulla", "dalla"], 0, "direction toward a place"],
    ["Ci vediamo ___ bar centrale.", ["al", "nel", "sul", "dal"], 0, "meeting point at a place"],
  ],
  lexical_gap: [
    ["Mi serve un ___ per Firenze.", ["biglietto", "quartiere", "cameriere", "dolce"], 0, "travel noun"],
    ["Vorrei ___ il prezzo finale.", ["sapere", "mangiare", "partire", "aprire"], 0, "basic information request"],
  ],
  lexical_choice: [
    ["La spiegazione è molto ___.", ["chiara", "salata", "chiuso", "stanco"], 0, "describe a simple explanation"],
    ["Questa stanza mi sembra ___.", ["tranquilla", "ritardo", "aperta", "binario"], 0, "natural room description"],
  ],
  agreement: [
    ["Le chiavi sono già ___.", ["pronte", "pronti", "pronta", "pronto"], 0, "feminine plural agreement"],
    ["I documenti sono ___.", ["pronti", "pronte", "pronta", "pronto"], 0, "masculine plural agreement"],
  ],
  word_order: [
    ["Adesso ___ il prezzo finale.", ["controllo", "controlli", "controllano", "controlliamo"], 0, "first person singular"],
    ["Prima ___ il biglietto poi entro.", ["compro", "compriamo", "comprano", "comprate"], 0, "single speaker action order"],
  ],
  verb_tense: [
    ["Ieri ___ il proprietario.", ["ho chiamato", "chiamo", "chiamerò", "chiamavo"], 0, "completed past action"],
    ["Domani ___ in stazione presto.", ["arrivo", "sono arrivato", "arrivavo", "arriverai"], 0, "near-future plan in present"],
    ["Stamattina ___ il treno delle sette.", ["ho preso", "prendo", "prenderò", "prendevo"], 0, "completed travel event"],
    ["Ieri sera ___ a casa molto tardi.", ["sono tornato", "torno", "tornerò", "tornavo"], 0, "completed movement back home"],
  ],
  verb_conjugation: [
    ["Noi ___ il tavolo per le otto.", ["prenotiamo", "prenoto", "prenotano", "prenoti"], 0, "noi form"],
    ["Lei ___ se il wifi è incluso.", ["chiede", "chiedo", "chiedono", "chiedi"], 0, "lei form"],
    ["Io ___ sempre dal binario tre.", ["parto", "parti", "parte", "partiamo"], 0, "first person singular"],
    ["Loro ___ davanti alla stazione.", ["aspettano", "aspetta", "aspettiamo", "aspetti"], 0, "loro form"],
  ],
  instruction_misread: [
    ["Per favore ___ il nome qui.", ["scrivi", "scrivo", "scriviamo", "scrivete"], 0, "simple instruction"],
    ["Prima di salire ___ il binario.", ["controlla", "controllo", "controlliamo", "controllano"], 0, "check before boarding"],
    ["Quando arrivi ___ subito al numero giusto.", ["vai", "vado", "andiamo", "vanno"], 0, "move to the correct place"],
    ["Prima di uscire ___ le chiavi sul tavolo.", ["metti", "metto", "mettiamo", "mettono"], 0, "place the keys before leaving"],
  ],
  incomplete_response: [
    ["Per essere più chiaro, ___ anche l'orario.", ["conferma", "confermo", "confermano", "confermi"], 0, "include the time too"],
    ["Se non capisci, ___ di ripetere.", ["chiedi", "chiedo", "chiedono", "chiede"], 0, "ask for repetition"],
  ],
  off_topic: [
    ["Per restare sul punto, ___ solo il prezzo.", ["spiega", "spiego", "spiegano", "spieghi"], 0, "answer the asked detail"],
    ["Se ti chiedono l'orario, ___ solo l'orario.", ["dici", "dico", "dicono", "dice"], 0, "avoid drifting away"],
  ],
  pragmatic_mismatch: [
    ["Con una persona sconosciuta è meglio ___ buongiorno.", ["dire", "dico", "dicono", "dici"], 0, "polite greeting"],
    ["Per chiedere aiuto puoi ___ scusi.", ["dire", "dici", "dicono", "dico"], 0, "basic polite marker"],
  ],
  negation_reversal: [
    ["Con questa medicina ___ bere alcolici.", ["non", "mai", "già", "più"], 0, "negative safety instruction"],
    ["___ dimenticare il passaporto.", ["Non", "Mai", "Già", "Più"], 0, "negative reminder"],
  ],
};

const B1_WORD_BUILDERS_BY_TAG = {
  home: [
    ["Vorrei chiarire le clausole del contratto prima di firmare", "I would like to clarify the contract clauses before signing"],
    ["Il deposito cauzionale non copre le spese straordinarie", "The security deposit does not cover extraordinary costs"],
    ["Possiamo rivedere le condizioni di recesso anticipato", "Can we review the early termination conditions"],
    ["Ieri ho fatto un sopralluogo nell'edificio e ho notato due accessi diversi", "Yesterday I inspected the building and noticed two different entrances"],
  ],
  travel: [
    ["Se perdo la coincidenza mi serve un itinerario alternativo completo", "If I miss the connection I need a complete alternative itinerary"],
    ["Vorrei una conferma scritta del rimborso e del nuovo orario", "I would like written confirmation of the refund and the new schedule"],
    ["Mi serve una soluzione che garantisca l'arrivo entro stasera", "I need a solution that guarantees arrival by tonight"],
    ["Ieri il treno è stato deviato via Bologna e abbiamo dovuto ricalcolare tutto il percorso", "Yesterday the train was rerouted via Bologna and we had to recalculate the whole route"],
  ],
  work: [
    ["Dobbiamo definire responsabilità e scadenze in modo più preciso", "We need to define responsibilities and deadlines more precisely"],
    ["Vorrei allineare il team sulle priorità del prossimo rilascio", "I would like to align the team on the priorities for the next release"],
    ["Serve un riepilogo scritto con decisioni rischi e prossimi passi", "We need a written summary with decisions risks and next steps"],
    ["Ieri abbiamo ricostruito la sequenza degli eventi per capire dove il processo si è bloccato", "Yesterday we reconstructed the sequence of events to understand where the process got stuck"],
  ],
  bureaucracy: [
    ["La pratica resta sospesa finché non arriva il documento integrativo", "The application remains suspended until the supplemental document arrives"],
    ["Vorrei capire quale ufficio è competente per questa eccezione", "I would like to understand which office is responsible for this exception"],
    ["Mi serve una ricevuta che confermi data importo e riferimento", "I need a receipt confirming date amount and reference number"],
    ["All'ingresso bisogna passare prima dal desk informazioni e poi dall'ufficio competente", "At the entrance you need to go first to the information desk and then to the relevant office"],
  ],
  negotiation: [
    ["La controproposta è valida solo se cambiano tempi e penali", "The counterproposal is valid only if timing and penalties change"],
    ["Possiamo trovare un compromesso senza rinunciare alle condizioni chiave", "Can we find a compromise without giving up the key conditions"],
    ["Vorrei mettere per iscritto i punti su cui siamo già d'accordo", "I would like to put in writing the points we already agree on"],
  ],
  media: [
    ["Prima rispondo alla domanda centrale poi chiarisco il contesto", "First I answer the main question then I clarify the context"],
    ["Devo ripetere il messaggio chiave senza sembrare evasivo", "I need to repeat the key message without sounding evasive"],
    ["Alla fine riassumo posizione dati e prossima decisione", "At the end I summarize position data and next decision"],
  ],
  tech: [
    ["La roadmap cambia se il lancio slitta al trimestre successivo", "The roadmap changes if the launch slips to the next quarter"],
    ["Dobbiamo spiegare il valore per l'utente con meno gergo tecnico", "We need to explain the user value with less technical jargon"],
    ["La demo funziona meglio se il flusso iniziale è più semplice", "The demo works better if the initial flow is simpler"],
  ],
};

const B1_CLOZE_BY_FOCUS = {
  preposition: [
    ["La proposta è valida solo ___ certe condizioni.", ["a", "in", "da", "per"], 0, "conditions usually take a fixed preposition here"],
    ["Vorrei un chiarimento ___ merito alla penale.", ["in", "di", "a", "da"], 0, "the fixed expression is in merito a"],
    ["L'accesso secondario si trova ___ retro dell'edificio.", ["sul", "al", "nel", "da"], 1, "fixed location on the back side"],
    ["Il fascicolo è rimasto ___ segreteria fino a stamattina.", ["in", "a", "su", "da"], 0, "location in an office"],
  ],
  lexical_gap: [
    ["Se manca un allegato, la pratica resta ___ fino a verifica.", ["sospesa", "convinta", "guidata", "prestata"], 0, "administrative procedures can remain suspended"],
    ["Prima di chiudere, vorrei un ___ scritto dei punti concordati.", ["riepilogo", "quartiere", "binario", "antipasto"], 0, "you want a written recap"],
  ],
  lexical_choice: [
    ["La controproposta mi sembra ___ ma ancora migliorabile.", ["ragionevole", "ritardata", "cucinata", "gratuita"], 0, "evaluate the offer naturally"],
    ["In intervista conviene dare una risposta ___ e verificabile.", ["misurata", "fermata", "allergica", "privata"], 0, "describe a controlled public answer"],
  ],
  agreement: [
    ["Le condizioni aggiuntive non sono ancora state ___.", ["approvate", "approvato", "approvati", "approvata"], 0, "conditions is feminine plural"],
    ["I punti principali restano ___ anche dopo la revisione.", ["validi", "valide", "valido", "valida"], 0, "points is masculine plural"],
  ],
  word_order: [
    ["Prima di chiudere, ___ in breve i punti principali.", ["riassumiamo", "riassumo", "riassumono", "riassumi"], 0, "noi form for collective review"],
    ["Alla fine dell'intervista, ___ subito il messaggio chiave.", ["ripeto", "ripeti", "ripetono", "ripetiamo"], 0, "first person singular in a personal answer"],
  ],
  verb_tense: [
    ["Se il cliente ___ ieri, oggi avremmo già una risposta.", ["avesse firmato", "ha firmato", "firmava", "firma"], 0, "unreal past condition"],
    ["Entro domani ___ una versione rivista della proposta.", ["maderò", "manderò", "manda", "avrei mandato"], 1, "future commitment"],
    ["Quando siamo arrivati, il treno ___ già da dieci minuti.", ["era partito", "parte", "partiva", "è partito"], 0, "action completed before another past moment"],
    ["Ieri abbiamo ricostruito tutto quello che ___ durante il blocco.", ["era successo", "succede", "succederà", "è successo"], 0, "reported sequence of past events"],
  ],
  verb_conjugation: [
    ["Se loro non ___ le priorità, il progetto rallenta.", ["chiariscono", "chiarisce", "chiariamo", "chiarisci"], 0, "loro form"],
    ["Lei ___ se la documentazione è completa.", ["verifica", "verifico", "verifichi", "verifichiamo"], 0, "formal third person"],
    ["Noi ___ attraverso l'ingresso laterale per evitare la fila.", ["passiamo", "passo", "passano", "passi"], 0, "noi form with route choice"],
    ["Loro ___ gli eventi in ordine cronologico nel verbale.", ["ricostruiscono", "ricostruisce", "ricostruiamo", "ricostruisci"], 0, "loro form with event reconstruction"],
  ],
  instruction_misread: [
    ["Prima di inviare la pratica, ___ anche il documento integrativo.", ["alleghi", "allega", "allego", "allegate"], 0, "formal instruction"],
    ["Quando chiudi la call, ___ data importo e prossimi passi.", ["riepiloga", "riepiloghi", "riepilogo", "riepilogano"], 0, "clear action at the end"],
    ["All'arrivo ___ prima al desk informazioni e poi alla segreteria.", ["si rivolga", "rivolgiti", "mi rivolgo", "ci rivolgiamo"], 0, "formal route through two offices"],
    ["Nel verbale ___ prima i fatti e poi le conseguenze.", ["indichi", "indica", "indico", "indicano"], 0, "formal sequencing of past events"],
  ],
  incomplete_response: [
    ["Per dare una risposta completa, ___ anche condizioni e scadenze.", ["indica", "indichi", "indico", "indicano"], 0, "include every required detail"],
    ["Se una domanda è vaga, ___ un chiarimento mirato.", ["chiedi", "chiede", "chiedo", "chiedono"], 0, "ask a targeted follow-up"],
  ],
  off_topic: [
    ["In un'intervista difficile, ___ alla domanda prima di aprire una digressione.", ["torna", "torni", "torno", "tornano"], 0, "stay on the asked point"],
    ["Per evitare di divagare, ___ il dato essenziale per primo.", ["dai", "dia", "do", "danno"], 0, "give the key fact first"],
  ],
  pragmatic_mismatch: [
    ["Con un interlocutore istituzionale conviene ___ un tono misurato.", ["mantenere", "mantiene", "mantieni", "mantengo"], 0, "keep register controlled"],
    ["Quando una richiesta è delicata, meglio ___ una formula indiretta.", ["usare", "usano", "usiamo", "usa"], 0, "choose an indirect formula"],
  ],
  negation_reversal: [
    ["Questa clausola ___ può essere modificata dopo la firma.", ["non", "mai", "già", "più"], 0, "the negation is legally relevant"],
    ["Nel foglio istruzioni ___ bisogna invertire i passaggi.", ["non", "mai", "già", "più"], 0, "do not reverse the steps"],
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
      ["Per descrivere una risposta dico che è ___.", "___", "chiara", "natural description"],
      ["Quando valuto un'opzione la trovo ___.", "___", "ragionevole", "natural evaluation"],
      ["Durante uno scambio difficile cerco una ___ chiara.", "___", "soluzione", "problem-solving noun"],
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

const A2_PATTERN_DRILLS_BY_FOCUS = {
  preposition: {
    name: "Clarifying details",
    description: "Use practical prepositions for follow-up questions and change handling.",
    sentences: [
      ["Se c'è un ritardo, avvisami ___ messaggio.", "___", "con", "notify with a message"],
      ["Vorrei un chiarimento ___ questo punto.", "___", "su", "clarify a specific point"],
      ["Possiamo parlare ___ nuova data?", "___", "della", "talk about the new date"],
    ],
  },
  verb_conjugation: {
    name: "Change-management verbs",
    description: "Control the verbs you need for updates, confirmations, and follow-up.",
    sentences: [
      ["Se loro non ___ in tempo, cambiamo il piano.", "___", "arrivano", "loro form"],
      ["Lei ___ se manca ancora un allegato.", "___", "controlla", "formal third person"],
      ["Noi ___ tutto con un messaggio finale.", "___", "confermiamo", "noi form"],
      ["Loro ___ al terzo piano senza prendere l'ascensore.", "___", "salgono", "movement to a location"],
    ],
  },
  verb_tense: {
    name: "Updates across time",
    description: "Move between what happened and the next practical step.",
    sentences: [
      ["Ieri ti ___ per confermare l'orario.", "___", "ho scritto", "completed past action"],
      ["Se domani non ___ risposta, richiamo io.", "___", "ricevo", "real future condition"],
      ["La settimana scorsa ___ già lo stesso problema.", "___", "avevo", "background possession/state"],
      ["Ieri sera ___ l'ultimo autobus e ho preso un taxi.", "___", "ho perso", "completed disruption"],
    ],
  },
  agreement: {
    name: "Stable details",
    description: "Keep agreement correct when summarizing practical details.",
    sentences: [
      ["Le nuove condizioni sono state ___ ieri.", "___", "confermate", "feminine plural"],
      ["I dettagli principali restano ___.", "___", "uguali", "unchanged plural details"],
      ["La spiegazione finale è più ___.", "___", "chiara", "feminine singular"],
    ],
  },
  pragmatic_mismatch: {
    name: "Softer requests",
    description: "Use polite but still natural language in semi-formal situations.",
    sentences: [
      ["Se possibile, ___ una conferma oggi.", "___", "vorrei", "soft request"],
      ["Mi scusi, ___ capire meglio il problema.", "___", "vorrei", "polite clarification"],
      ["Grazie, ___ molto utile avere un riepilogo scritto.", "___", "sarebbe", "semi-formal follow-up"],
    ],
  },
  off_topic: {
    name: "Stay on the issue",
    description: "Answer the problem first before adding extra context.",
    sentences: [
      ["Per restare sul punto, ___ prima al problema principale.", "___", "rispondi", "answer the key issue"],
      ["Se la situazione cambia, ___ solo i dettagli utili.", "___", "spiega", "keep only useful details"],
      ["Alla fine ___ il punto più importante.", "___", "ripeti", "close clearly"],
    ],
  },
  incomplete_response: {
    name: "Complete practical answer",
    description: "Add the missing detail, reason, or next step before closing.",
    sentences: [
      ["Per essere più completo, ___ anche il motivo del cambio.", "___", "spiega", "add the reason"],
      ["Se qualcosa non è chiaro, ___ una domanda in più.", "___", "fai", "ask for clarification"],
      ["Alla fine ___ data, orario e soluzione scelta.", "___", "conferma", "state all key details"],
    ],
  },
  lexical_gap: {
    name: "Useful follow-up chunks",
    description: "Insert the chunk that keeps the exchange practical and clear.",
    sentences: [
      ["Prima di chiudere faccio un breve ___.", "___", "riepilogo", "summary noun"],
      ["Se il piano cambia mandami un ___.", "___", "messaggio", "update noun"],
      ["Mi serve una ___ finale per procedere.", "___", "conferma", "confirmation noun"],
    ],
  },
  lexical_choice: {
    name: "Practical wording",
    description: "Choose the most natural expression for mid-level everyday coordination.",
    sentences: [
      ["Questa soluzione mi sembra più ___.", "___", "pratica", "evaluate a workable option"],
      ["La spiegazione ora è molto più ___.", "___", "chiara", "describe clarity"],
      ["Per evitare confusione serve una risposta più ___.", "___", "precisa", "precision matters"],
    ],
  },
  instruction_misread: {
    name: "Follow the sequence",
    description: "Keep multi-step instructions in the right order.",
    sentences: [
      ["Prima ___ la ricevuta, poi invii tutto.", "___", "allega", "attach first"],
      ["Quando finisci la chiamata ___ data e orario concordati.", "___", "conferma", "confirm at the end"],
      ["Se manca qualcosa ___ subito un aggiornamento.", "___", "chiedi", "request an update"],
      ["Quando arrivi in stazione ___ subito verso il binario indicato.", "___", "vai", "go to the indicated platform"],
    ],
  },
};

const B1_PATTERN_DRILLS_BY_FOCUS = {
  preposition: {
    name: "Clause and context framing",
    description: "Use higher-value prepositional structures in negotiation and formal communication.",
    sentences: [
      ["La proposta è valida solo ___ certe condizioni.", "___", "a", "fixed expression with conditions"],
      ["Vorrei un chiarimento ___ merito alla penale.", "___", "in", "fixed frame in merito a"],
      ["Possiamo discutere ___ tempi di consegna più realistici.", "___", "di", "discutere di + topic"],
    ],
  },
  verb_conjugation: {
    name: "Negotiation verb control",
    description: "Control verbs used to frame conditions requests and follow-up actions.",
    sentences: [
      ["Se loro non ___ le priorità, il progetto slitta.", "___", "chiariscono", "loro form"],
      ["Lei ___ se la documentazione è sufficiente.", "___", "conferma", "formal third person"],
      ["Noi ___ una controproposta entro domani.", "___", "presentiamo", "noi form"],
      ["Loro ___ gli eventi in ordine cronologico nel verbale.", "___", "ricostruiscono", "sequence reconstruction"],
    ],
  },
  verb_tense: {
    name: "Hypothesis and commitment",
    description: "Move between hypothetical outcomes and concrete next steps.",
    sentences: [
      ["Se il contratto ___ ieri, oggi saremmo già operativi.", "___", "fosse arrivato", "past unreal condition"],
      ["Entro stasera ___ il riepilogo definitivo.", "___", "manderò", "future commitment"],
      ["Pensavo che il cliente ___ più margine di trattativa.", "___", "avesse", "reported past assumption"],
      ["Quando siamo arrivati, il treno ___ già da dieci minuti.", "___", "era partito", "past before past"],
    ],
  },
  agreement: {
    name: "Formal agreement control",
    description: "Keep agreement accurate in dense administrative and professional phrases.",
    sentences: [
      ["Le condizioni aggiuntive restano ___ fino alla firma.", "___", "invariate", "feminine plural"],
      ["I punti discussi sono stati ___ nel verbale.", "___", "riportati", "masculine plural participle"],
      ["La proposta finale sembra abbastanza ___.", "___", "solida", "feminine singular adjective"],
    ],
  },
  pragmatic_mismatch: {
    name: "Institutional register",
    description: "Use indirect and measured forms in formal high-stakes exchanges.",
    sentences: [
      ["Se possibile, ___ ricevere una conferma formale entro oggi.", "___", "vorrei", "indirect request"],
      ["La ringrazio, ___ utile avere un riepilogo scritto.", "___", "sarebbe", "measured institutional tone"],
      ["Per evitare equivoci, ___ mettere questo punto per iscritto.", "___", "preferirei", "softened preference"],
    ],
  },
  off_topic: {
    name: "Media focus control",
    description: "Answer the question asked before expanding the context.",
    sentences: [
      ["In intervista ___ prima alla domanda centrale.", "___", "rispondi", "core question first"],
      ["Se vuoi restare credibile, ___ il dato verificabile per primo.", "___", "dai", "lead with evidence"],
      ["Alla fine ___ il messaggio chiave senza aprire un altro tema.", "___", "ripeti", "close without drifting"],
    ],
  },
  incomplete_response: {
    name: "High-stakes completeness",
    description: "Make sure the answer covers scope timing and next action.",
    sentences: [
      ["Per chiudere bene la trattativa ___ prezzo tempi e penali.", "___", "riassumi", "cover all three elements"],
      ["Se manca un dettaglio ___ una domanda mirata.", "___", "fai", "targeted clarification"],
      ["Alla fine della call ___ chi fa cosa e entro quando.", "___", "confermi", "ownership and timing"],
    ],
  },
  lexical_gap: {
    name: "Administrative precision",
    description: "Insert the exact lexical chunk that keeps the task precise.",
    sentences: [
      ["Prima della firma serve una ___ scritta dell'accordo.", "___", "conferma", "formal noun phrase"],
      ["Per sbloccare la pratica manca ancora un ___ integrativo.", "___", "documento", "administrative term"],
      ["Se la proposta cambia, aggiorniamo subito il ___ finale.", "___", "riepilogo", "summary term"],
    ],
  },
  lexical_choice: {
    name: "Nuanced evaluation",
    description: "Choose language that evaluates options without sounding simplistic.",
    sentences: [
      ["La controproposta mi sembra ___ ma non ancora sufficiente.", "___", "ragionevole", "measured evaluation"],
      ["In pubblico è meglio mantenere un tono ___ e verificabile.", "___", "misurato", "media-facing tone"],
      ["Per chiudere bene lo scambio serve una sintesi ___ e concreta.", "___", "chiara", "precise wrap-up"],
    ],
  },
  instruction_misread: {
    name: "Procedural sequencing",
    description: "Keep multi-step instructions in the right order and register.",
    sentences: [
      ["Prima ___ il documento integrativo, poi invii la pratica.", "___", "alleghi", "formal ordered action"],
      ["Alla fine ___ ricevuta importo e riferimento.", "___", "controlli", "verification step"],
      ["Se qualcosa non coincide, ___ subito un chiarimento.", "___", "chieda", "formal repair move"],
      ["All'arrivo ___ prima al desk informazioni e poi alla segreteria.", "___", "si rivolga", "formal route through two offices"],
    ],
  },
};

const A1_PATTERN_DRILLS_BY_FOCUS = {
  preposition: {
    name: "Simple place words",
    description: "Use the right preposition for common beginner situations.",
    sentences: [
      ["Vado ___ stazione adesso.", "___", "alla", "direction toward a place"],
      ["Ci vediamo ___ bar centrale.", "___", "al", "meeting point"],
      ["Il biglietto è ___ borsa.", "___", "nella", "location inside"],
    ],
  },
  verb_conjugation: {
    name: "Everyday verbs",
    description: "Control the core verbs you need for requests and plans.",
    sentences: [
      ["Noi ___ il tavolo per le otto.", "___", "prenotiamo", "noi form"],
      ["Lei ___ se il wifi è incluso.", "___", "chiede", "third person singular"],
      ["Tu ___ il numero del binario.", "___", "controlli", "tu form"],
    ],
  },
  verb_tense: {
    name: "Today tomorrow yesterday",
    description: "Switch between simple past, present, and next-step plans.",
    sentences: [
      ["Ieri ___ la farmacia di turno.", "___", "ho trovato", "completed past action"],
      ["Domani ___ in ufficio alle nove.", "___", "arrivo", "near future plan"],
      ["Adesso ___ il cameriere.", "___", "chiamo", "present action"],
      ["Stamattina ___ il treno delle sette.", "___", "ho preso", "completed travel event"],
    ],
  },
  agreement: {
    name: "Basic agreement",
    description: "Keep common articles and adjectives aligned with the noun.",
    sentences: [
      ["Le chiavi sono già ___.", "___", "pronte", "feminine plural"],
      ["I documenti sono ___.", "___", "pronti", "masculine plural"],
      ["La stanza è molto ___.", "___", "tranquilla", "feminine singular"],
    ],
  },
  pragmatic_mismatch: {
    name: "Polite basics",
    description: "Use simple polite forms in everyday interactions.",
    sentences: [
      ["Scusi, ___ aiutarmi?", "___", "può", "polite question"],
      ["Buongiorno, ___ un tavolo per due.", "___", "vorrei", "polite request"],
      ["Grazie, ___ più lentamente?", "___", "può ripetere", "polite clarification"],
    ],
  },
  off_topic: {
    name: "Answer the question",
    description: "Stay on the exact detail the other person asked for.",
    sentences: [
      ["Se ti chiedono il prezzo, ___ solo il prezzo.", "___", "dici", "focused answer"],
      ["Se ti chiedono l'orario, ___ prima l'orario.", "___", "confermi", "answer the asked detail"],
      ["Alla fine ___ l'informazione importante.", "___", "ripeti", "repeat the key fact"],
    ],
  },
  incomplete_response: {
    name: "Add one more detail",
    description: "Give a complete beginner answer with time place or need.",
    sentences: [
      ["Per chiudere bene la risposta ___ anche l'orario.", "___", "conferma", "include the time"],
      ["Se manca un dettaglio ___ una domanda in più.", "___", "fai", "ask for missing detail"],
      ["Alla fine ___ dove ci vediamo.", "___", "ripeti", "confirm the place"],
    ],
  },
  lexical_gap: {
    name: "Useful beginner chunks",
    description: "Insert practical chunks for common everyday needs.",
    sentences: [
      ["Mi serve un ___ per Firenze.", "___", "biglietto", "travel noun"],
      ["Vorrei un ___ per due.", "___", "tavolo", "restaurant noun"],
      ["Ho bisogno di una ___ aperta.", "___", "farmacia", "health noun"],
    ],
  },
  lexical_choice: {
    name: "Natural beginner wording",
    description: "Choose the most natural phrase for simple situations.",
    sentences: [
      ["Per descrivere una spiegazione dico che è ___.", "___", "chiara", "natural description"],
      ["Quando un quartiere mi piace dico che è ___.", "___", "tranquillo", "basic evaluation"],
      ["Quando chiedo aiuto uso una formula ___.", "___", "gentile", "register cue"],
    ],
  },
  instruction_misread: {
    name: "Follow the order",
    description: "Keep two-step beginner instructions in the right sequence.",
    sentences: [
      ["Prima ___ il nome, poi firmi.", "___", "scrivi", "write first"],
      ["Alla fine ___ il binario corretto.", "___", "controlli", "check the platform"],
      ["Se qualcosa non è chiaro ___ di ripetere.", "___", "chiedi", "repair move"],
      ["Quando arrivi ___ subito allo sportello due.", "___", "vai", "move to the correct place"],
    ],
  },
};

const ERROR_HUNTS_BY_FOCUS = {
  article_gender_number: [
    ["Il stanza è disponibile subito.", "La stanza è disponibile subito.", "Use the correct feminine article."],
    ["Le contratto inizia lunedì.", "Il contratto inizia lunedì.", "Contratto is masculine singular."],
  ],
  preposition: [
    ["Vado al appuntamento alle sei.", "Vado all'appuntamento alle sei.", "Before a vowel, al contracts to all'."],
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
    ["Sì, va bene.", "Sì, va bene: confermo il prezzo, le spese incluse e la data di disponibilità.", "A closing answer should restate the key facts."],
  ],
  pragmatic_mismatch: [
    ["Ciao signora, dimmi pure.", "Buongiorno signora, mi dica pure.", "A more respectful register fits this interaction."],
    ["Ehi, mandami una conferma scritta.", "Potrebbe mandarmi una conferma scritta?", "A polite request is more appropriate here."],
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

const A2_ERROR_HUNTS_BY_FOCUS = {
  preposition: [
    ["Se cambia l'orario ti avviso da messaggio.", "Se cambia l'orario ti avviso con un messaggio.", "You notify someone with a message, not da messaggio."],
    ["Vorrei un chiarimento a questo punto del contratto.", "Vorrei un chiarimento su questo punto del contratto.", "You ask for clarification su un punto."],
  ],
  agreement: [
    ["Le nuove condizioni sono stato confermate ieri.", "Le nuove condizioni sono state confermate ieri.", "The participle must agree with the feminine plural subject."],
    ["I dettagli principali restano uguale.", "I dettagli principali restano uguali.", "Plural details need the plural form."],
  ],
  instruction_misread: [
    ["Invii tutto e poi alleghi la ricevuta.", "Alleghi la ricevuta e poi invii tutto.", "The order of the actions is reversed."],
    ["Conferma l'orario ma non la data finale.", "Conferma sia la data sia l'orario finale.", "The original leaves out a required detail."],
  ],
  incomplete_response: [
    ["Va bene, allora ci sentiamo.", "Va bene, allora confermo l'orario e ti mando un messaggio con i dettagli.", "The answer needs the concrete next step."],
    ["Domani richiamo.", "Domani richiamo se non ricevo conferma entro mattina.", "The response should include the condition or reason."],
  ],
  pragmatic_mismatch: [
    ["Ehi, spiegami meglio il problema.", "Mi può spiegare meglio il problema?", "The request is too blunt for a semi-formal situation."],
    ["Ciao, mandami subito la conferma.", "Buongiorno, potrebbe mandarmi la conferma appena possibile?", "A softer request fits better here."],
  ],
  off_topic: [
    ["Parliamo del ritardo, però il ristorante era ottimo.", "Sul ritardo, posso dirti quando arrivo e se devo cambiare prenotazione.", "The answer drifts away from the practical issue."],
    ["Mi chiedi del documento, ma la città è bellissima.", "Per il documento, mi manca ancora la ricevuta e posso portarla domani.", "Stay on the requested topic."],
  ],
  negation_reversal: [
    ["Con questa medicina puoi bere alcolici senza problemi.", "Con questa medicina non puoi bere alcolici.", "Negation changes the safety meaning."],
    ["Nel riepilogo finale devi dimenticare il numero pratica.", "Nel riepilogo finale non devi dimenticare il numero pratica.", "The negation is essential here."],
  ],
};

const B1_ERROR_HUNTS_BY_FOCUS = {
  preposition: [
    ["Vorrei un chiarimento a merito della penale.", "Vorrei un chiarimento in merito alla penale.", "The fixed expression is in merito a, with the articulated preposition after it."],
    ["La controproposta è valida in certe condizioni scritte.", "La controproposta è valida a certe condizioni scritte.", "This expression naturally takes a certe condizioni."],
  ],
  agreement: [
    ["Le condizioni aggiuntive sono stato approvate ieri.", "Le condizioni aggiuntive sono state approvate ieri.", "The participle must agree with the feminine plural subject."],
    ["I punti discussi restano invariata fino alla firma.", "I punti discussi restano invariati fino alla firma.", "Masculine plural agreement is required."],
  ],
  instruction_misread: [
    ["Prima invii la pratica e poi alleghi il documento integrativo.", "Prima alleghi il documento integrativo e poi invii la pratica.", "The order matters and cannot be reversed."],
    ["Porti solo la ricevuta, il riferimento non serve.", "Porti sia la ricevuta sia il riferimento della pratica.", "The original drops required information."],
  ],
  incomplete_response: [
    ["Accetto la proposta.", "Accetto la proposta se confermiamo prezzo finale tempi di consegna e penale di uscita.", "At B1 the answer should state the conditions, not just accept vaguely."],
    ["Domani mando tutto.", "Domani mando il riepilogo con decisioni responsabili e prossimi passi.", "The reply is too vague for a high-stakes follow-up."],
  ],
  pragmatic_mismatch: [
    ["Ehi, fammi avere il verbale oggi.", "Potrebbe inviarmi il verbale entro oggi?", "The original is too blunt for a formal or professional interaction."],
    ["Ciao, ti dico subito le condizioni.", "Buongiorno, le espongo subito le condizioni principali.", "The register should match a formal listener."],
  ],
  off_topic: [
    ["La domanda era sul budget, ma comunque il prodotto è bellissimo.", "Sul budget, posso confermare il costo previsto e i margini principali.", "The answer drifts into promotion instead of addressing the question."],
    ["Mi chiede dei ritardi, però vorrei parlare della squadra.", "Sui ritardi, posso spiegare la causa principale e il nuovo calendario.", "Stay on the requested topic before broadening the answer."],
  ],
  negation_reversal: [
    ["Questa clausola può essere modificata dopo la firma.", "Questa clausola non può essere modificata dopo la firma.", "Negation changes the contractual meaning."],
    ["Non è necessario evitare alcolici durante la terapia.", "È necessario evitare alcolici durante la terapia.", "The negation reverses a safety instruction."],
  ],
};

const A1_ERROR_HUNTS_BY_FOCUS = {
  article_gender_number: [
    ["Il stazione è vicina.", "La stazione è vicina.", "Stazione is feminine singular."],
    ["Un farmacia è aperta.", "Una farmacia è aperta.", "Farmacia is feminine singular."],
  ],
  preposition: [
    ["Vado al appuntamento alle sei.", "Vado all'appuntamento alle sei.", "Before a vowel, al contracts to all'."],
    ["Ci vediamo in bar centrale.", "Ci vediamo al bar centrale.", "Use the articulated preposition with bar."],
  ],
  agreement: [
    ["Le chiavi sono pronto.", "Le chiavi sono pronte.", "The adjective must agree in feminine plural."],
    ["I documenti sono pronta.", "I documenti sono pronti.", "Masculine plural agreement is required."],
  ],
  instruction_misread: [
    ["Scrivi il nome dopo firma qui.", "Scrivi il nome, poi firma qui.", "The sequence needs to be clear."],
    ["Controlla il binario ma non il biglietto.", "Controlla il binario e anche il biglietto.", "The original leaves out a required step."],
  ],
  incomplete_response: [
    ["Ci vediamo domani.", "Ci vediamo domani alle otto davanti alla stazione.", "The answer needs time and place."],
    ["Sì, va bene.", "Sì, va bene: confermo l'orario e il punto d'incontro.", "A closing answer should restate the main detail."],
  ],
  pragmatic_mismatch: [
    ["Ehi signora, dimmi pure.", "Buongiorno signora, mi dica pure.", "A more respectful register fits this interaction."],
    ["Dammi il biglietto per Roma.", "Mi dà il biglietto per Roma, per favore?", "A polite request is more appropriate here."],
  ],
  off_topic: [
    ["Quanto costa il biglietto? Milano è molto bella.", "Il biglietto costa trenta euro.", "The answer should stay on the asked detail."],
    ["A che ora ci vediamo? Mi piace molto questo bar.", "Ci vediamo alle otto davanti al bar.", "Stay on the time and place."],
  ],
  negation_reversal: [
    ["Puoi prendere questa medicina a stomaco vuoto.", "Non puoi prendere questa medicina a stomaco vuoto.", "Negation changes the safety meaning."],
    ["Puoi dimenticare il passaporto oggi.", "Non puoi dimenticare il passaporto oggi.", "Negation changes the practical instruction."],
  ],
};

const GENERAL_ERROR_HUNT_ROWS = [
  ["Mi serve una informazione chiara.", "Mi serve un'informazione chiara.", "Use the elided form before a feminine noun beginning with a vowel."],
  ["Grazie, mandami una conferma scritta.", "Grazie, potrebbe mandarmi una conferma scritta?", "A more polite request fits formal or semi-formal interactions."],
];

const A1_GENERAL_ERROR_HUNT_ROWS = [
  ["Scusi, dove è la stazione?", "Scusi, dov'è la stazione?", "Use the contracted form dov'è."],
  ["Vorrei un tavolo due.", "Vorrei un tavolo per due.", "The phrase needs the preposition per."],
];

const A2_GENERAL_ERROR_HUNT_ROWS = [
  ["Va bene, poi vediamo.", "Va bene: confermo l'orario e ti aggiorno con un messaggio tra poco.", "A2 answers should add the concrete follow-up step."],
  ["Se cambia qualcosa ti scrivo sul numero.", "Se cambia qualcosa ti scrivo a questo numero.", "The preposition is wrong in this context."],
];

const B1_GENERAL_ERROR_HUNT_ROWS = [
  ["Vorrei un chiarimento sul merito alla penale.", "Vorrei un chiarimento in merito alla penale.", "The fixed formal expression is in merito a."],
  ["Va bene, poi vediamo.", "Va bene: confermo prezzo, condizioni e prossimi passi nel riepilogo.", "A B1 closing answer should be explicit and complete."],
];

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

const GENERAL_SPEED_TRANSLATIONS = [
  ["Can you repeat the last detail?", ["Può ripetere l'ultimo dettaglio?", "Può chiudere l'ultimo dettaglio?", "Può cambiare l'ultimo dettaglio?", "Può portare l'ultimo dettaglio?"], 0],
  ["I want to confirm the main details.", ["Voglio confermare i dettagli principali.", "Voglio comprare i dettagli principali.", "Voglio perdere i dettagli principali.", "Voglio dividere i dettagli principali."], 0],
];

const A1_GENERAL_SPEED_TRANSLATIONS = [
  ["I would like a table for two.", ["Vorrei un tavolo per due.", "Vorrei un binario per due.", "Vorrei una farmacia per due.", "Vorrei un contratto per due."], 0],
  ["Can you repeat more slowly?", ["Può ripetere più lentamente?", "Può chiudere più lentamente?", "Può cambiare più lentamente?", "Può portare più lentamente?"], 0],
  ["Where can I buy the ticket?", ["Dove posso comprare il biglietto?", "Dove posso chiudere il biglietto?", "Dove posso provare il biglietto?", "Dove posso invitare il biglietto?"], 0],
  ["We are meeting at eight in front of the station.", ["Ci vediamo alle otto davanti alla stazione.", "Ci vediamo alle otto dentro la stazione?", "Ci vediamo alle otto contro la stazione.", "Ci vediamo alle otto sotto la farmacia."], 0],
];

const A1_SPEED_TRANSLATION_BY_TAG = {
  home: [
    ["The stop is in front of the building.", ["La fermata è davanti al palazzo.", "La fermata è dentro il palazzo.", "La fermata è sopra il palazzo.", "La fermata è contro il palazzo."], 0],
    ["I live on the third floor.", ["Abito al terzo piano.", "Abito nel terzo treno.", "Abito sopra il binario tre.", "Abito al terzo cameriere."], 0],
  ],
  social: [
    ["Can we move the appointment by one hour?", ["Possiamo spostare l'appuntamento di un'ora?", "Possiamo spostare l'appuntamento di una farmacia?", "Possiamo spostare l'appuntamento di un binario?", "Possiamo spostare l'appuntamento di una taglia?"], 0],
    ["I am writing to confirm the time.", ["Ti scrivo per confermare l'orario.", "Ti scrivo per confermare il quartiere.", "Ti scrivo per confermare il menù.", "Ti scrivo per confermare il camerino."], 0],
  ],
  travel: [
    ["Where can I buy the ticket?", ["Dove posso comprare il biglietto?", "Dove posso cucinare il biglietto?", "Dove posso indossare il biglietto?", "Dove posso dividere il biglietto?"], 0],
    ["Is this the right stop?", ["Questa è la fermata giusta?", "Questa è la farmacia giusta?", "Questa è la taglia giusta?", "Questa è la forchetta giusta?"], 0],
  ],
  work: [
    ["Tomorrow I arrive at the office at nine.", ["Domani arrivo in ufficio alle nove.", "Domani arrivo in farmacia alle nove.", "Domani arrivo in stazione alle giacche.", "Domani arrivo in ufficio al tavolo."], 0],
    ["Is the meeting online or at the office?", ["La riunione è online o in ufficio?", "La riunione è online o in cucina?", "La riunione è online o in binario?", "La riunione è online o in dolce?"], 0],
  ],
  bureaucracy: [
    ["Excuse me, where is the information desk?", ["Scusi, dov'è lo sportello informazioni?", "Scusi, dov'è la coincidenza informazioni?", "Scusi, dov'è la taglia informazioni?", "Scusi, dov'è il cameriere informazioni?"], 0],
    ["I need to bring the passport tomorrow.", ["Devo portare il passaporto domani.", "Devo portare il quartiere domani.", "Devo portare il tavolo domani.", "Devo portare il menù domani."], 0],
  ],
  routine: [
    ["Yesterday I took the train at eight.", ["Ieri ho preso il treno alle otto.", "Ieri ho chiuso il treno alle otto.", "Ieri ho provato il treno alle otto.", "Ieri ho mangiato il treno alle otto."], 0],
    ["After work I go straight home.", ["Dopo il lavoro torno subito a casa.", "Dopo il lavoro torno subito al binario.", "Dopo il lavoro torno subito alla taglia.", "Dopo il lavoro torno subito al cameriere."], 0],
  ],
  planning: [
    ["First I confirm the time, then I write to you.", ["Prima confermo l'orario, poi ti scrivo.", "Prima confermo il binario, poi ti mangio.", "Prima confermo il dolce, poi ti divido.", "Prima confermo la taglia, poi ti chiudo."], 0],
    ["If I am late, I send you a message.", ["Se arrivo tardi, ti mando un messaggio.", "Se arrivo tardi, ti porto un quartiere.", "Se arrivo tardi, ti provo una forchetta.", "Se arrivo tardi, ti chiudo un binario."], 0],
  ],
};

const A2_GENERAL_SPEED_TRANSLATIONS = [
  ["I would like to confirm the time and the meeting point.", ["Vorrei confermare l'orario e il punto d'incontro.", "Vorrei confermare il quartiere e il punto d'incontro.", "Vorrei confermare il binario e il punto d'incontro.", "Vorrei confermare il dolce e il punto d'incontro."], 0],
  ["If something changes let me know as soon as possible.", ["Se qualcosa cambia fammelo sapere il prima possibile.", "Se qualcosa cambia fammelo mangiare il prima possibile.", "Se qualcosa cambia fammelo dividere il prima possibile.", "Se qualcosa cambia fammelo chiudere il prima possibile."], 0],
];

const B1_GENERAL_SPEED_TRANSLATIONS = [
  ["I would like written confirmation of the points we agreed on.", ["Vorrei una conferma scritta dei punti su cui siamo d'accordo.", "Vorrei una conferma scritta dei tavoli su cui siamo d'accordo.", "Vorrei una conferma scritta dei binari su cui siamo d'accordo.", "Vorrei una conferma scritta dei camerini su cui siamo d'accordo."], 0],
  ["Before closing, I want to summarize timing conditions and next steps.", ["Prima di chiudere, voglio riassumere tempi condizioni e prossimi passi.", "Prima di chiudere, voglio riassumere taglie condizioni e prossimi passi.", "Prima di chiudere, voglio riassumere stazioni condizioni e prossimi passi.", "Prima di chiudere, voglio riassumere dessert condizioni e prossimi passi."], 0],
];

const B1_SPEED_TRANSLATION_BY_TAG = {
  home: [
    ["I need the updated contract with the revised conditions.", ["Mi serve il contratto aggiornato con le condizioni riviste.", "Mi serve il quartiere aggiornato con le condizioni riviste.", "Mi serve il soggiorno aggiornato con le condizioni riviste.", "Mi serve la cucina aggiornata con le condizioni riviste."], 0],
    ["The security deposit does not include extraordinary expenses.", ["Il deposito cauzionale non include le spese straordinarie.", "Il deposito cauzionale non include le fermate straordinarie.", "Il deposito cauzionale non include le visite straordinarie.", "Il deposito cauzionale non include le taglie straordinarie."], 0],
    ["Yesterday I inspected the building and noticed two different entrances.", ["Ieri ho fatto un sopralluogo nell'edificio e ho notato due accessi diversi.", "Ieri ho fatto un sopralluogo nel menù e ho notato due accessi diversi.", "Ieri ho cucinato nell'edificio e ho notato due accessi diversi.", "Ieri ho fatto un sopralluogo nell'edificio e ho notato due taglie diverse."], 0],
  ],
  travel: [
    ["I need a written confirmation of the refund and the new route.", ["Mi serve una conferma scritta del rimborso e del nuovo itinerario.", "Mi serve una conferma scritta del binario e del nuovo tavolo.", "Mi serve una conferma scritta del quartiere e del nuovo sconto.", "Mi serve una conferma scritta del cameriere e del nuovo ufficio."], 0],
    ["If I miss the connection, I need an alternative that gets me there tonight.", ["Se perdo la coincidenza, mi serve un'alternativa che mi faccia arrivare stasera.", "Se perdo la coincidenza, mi serve un'antipasto che mi faccia arrivare stasera.", "Se perdo la coincidenza, mi serve una farmacia che mi faccia arrivare stasera.", "Se perdo la coincidenza, mi serve una taglia che mi faccia arrivare stasera."], 0],
    ["Yesterday the train was rerouted via Bologna and we had to recalculate the whole route.", ["Ieri il treno è stato deviato via Bologna e abbiamo dovuto ricalcolare tutto il percorso.", "Ieri il treno è stato cucinato via Bologna e abbiamo dovuto ricalcolare tutto il percorso.", "Ieri il treno è stato deviato via Bologna e abbiamo dovuto ricalcolare tutto il dessert.", "Ieri il treno è stato deviato via farmacia e abbiamo dovuto ricalcolare tutto il percorso."], 0],
  ],
  work: [
    ["We need to define responsibilities and deadlines more precisely.", ["Dobbiamo definire responsabilità e scadenze in modo più preciso.", "Dobbiamo dividere responsabilità e scadenze in modo più preciso.", "Dobbiamo visitare responsabilità e scadenze in modo più preciso.", "Dobbiamo chiudere responsabilità e scadenze in modo più preciso."], 0],
    ["I will send a recap with decisions risks and next steps.", ["Manderò un riepilogo con decisioni rischi e prossimi passi.", "Manderò un binario con decisioni rischi e prossimi passi.", "Manderò un dolce con decisioni rischi e prossimi passi.", "Manderò un orario con decisioni rischi e prossimi passi."], 0],
    ["Yesterday we reconstructed the sequence of events to understand where the process got stuck.", ["Ieri abbiamo ricostruito la sequenza degli eventi per capire dove il processo si è bloccato.", "Ieri abbiamo ricostruito la sequenza dei tavoli per capire dove il processo si è bloccato.", "Ieri abbiamo mangiato la sequenza degli eventi per capire dove il processo si è bloccato.", "Ieri abbiamo ricostruito la sequenza degli eventi per capire dove il dessert si è bloccato."], 0],
  ],
  bureaucracy: [
    ["The application remains suspended until the supplemental document arrives.", ["La pratica resta sospesa finché non arriva il documento integrativo.", "La pratica resta salata finché non arriva il documento integrativo.", "La pratica resta condivisa finché non arriva il documento integrativo.", "La pratica resta elegante finché non arriva il documento integrativo."], 0],
    ["I need a receipt confirming the date amount and reference number.", ["Mi serve una ricevuta che confermi data importo e riferimento.", "Mi serve una ricevuta che confermi tavolo taglia e riferimento.", "Mi serve una ricevuta che confermi quartiere cucina e riferimento.", "Mi serve una ricevuta che confermi stazione visita e riferimento."], 0],
    ["At the entrance you need to go first to the information desk and then to the relevant office.", ["All'ingresso bisogna passare prima dal desk informazioni e poi dall'ufficio competente.", "All'ingresso bisogna passare prima dal dessert informazioni e poi dall'ufficio competente.", "All'ingresso bisogna mangiare prima dal desk informazioni e poi dall'ufficio competente.", "All'ingresso bisogna passare prima dal desk informazioni e poi dal quartiere competente."], 0],
  ],
  negotiation: [
    ["The counterproposal works only if we revise timing and penalties.", ["La controproposta funziona solo se rivediamo tempi e penali.", "La controproposta funziona solo se rivediamo cucine e penali.", "La controproposta funziona solo se rivediamo binari e penali.", "La controproposta funziona solo se rivediamo farmacie e penali."], 0],
    ["I can accept the offer if the key conditions are written down.", ["Posso accettare l'offerta se le condizioni chiave vengono messe per iscritto.", "Posso accettare l'offerta se le condizioni chiave vengono messe per cucina.", "Posso accettare l'offerta se le condizioni chiave vengono messe per stazione.", "Posso accettare l'offerta se le condizioni chiave vengono messe per taglia."], 0],
  ],
  media: [
    ["I want to answer the main question before adding more context.", ["Voglio rispondere alla domanda principale prima di aggiungere altro contesto.", "Voglio rispondere alla domanda principale prima di aggiungere altro binario.", "Voglio rispondere alla domanda principale prima di aggiungere altro dolce.", "Voglio rispondere alla domanda principale prima di aggiungere altro sconto."], 0],
    ["At the end I will repeat the key message in a more measured way.", ["Alla fine ripeterò il messaggio chiave in modo più misurato.", "Alla fine ripeterò il messaggio chiave in modo più condiviso.", "Alla fine ripeterò il messaggio chiave in modo più ritardo.", "Alla fine ripeterò il messaggio chiave in modo più binario."], 0],
  ],
  tech: [
    ["The launch slips if the roadmap depends on too many assumptions.", ["Il lancio slitta se la roadmap dipende da troppe ipotesi.", "Il lancio slitta se la roadmap dipende da troppe forchette.", "Il lancio slitta se la roadmap dipende da troppe fermate.", "Il lancio slitta se la roadmap dipende da troppe camere."], 0],
    ["We have to explain the user value without too much technical jargon.", ["Dobbiamo spiegare il valore per l'utente senza troppo gergo tecnico.", "Dobbiamo spiegare il valore per l'utente senza troppo binario tecnico.", "Dobbiamo spiegare il valore per l'utente senza troppo menù tecnico.", "Dobbiamo spiegare il valore per l'utente senza troppo quartiere tecnico."], 0],
  ],
};

const A2_SPEED_TRANSLATION_BY_TAG = {
  home: [
    ["We need to clarify the house rules before Monday.", ["Dobbiamo chiarire le regole della casa prima di lunedì.", "Dobbiamo chiarire le regole della casa prima di fermata.", "Dobbiamo chiarire le regole della casa prima di farmacia.", "Dobbiamo chiarire le regole della casa prima di dessert."], 0],
    ["Can we split the costs more fairly?", ["Possiamo dividere le spese in modo più equo?", "Possiamo dividere le spese in modo più nuvoloso?", "Possiamo dividere le spese in modo più chiuso?", "Possiamo dividere le spese in modo più fermo?"], 0],
  ],
  social: [
    ["I am writing to confirm the time and the meeting point.", ["Ti scrivo per confermare l'orario e il punto d'incontro.", "Ti scrivo per confermare il binario e il punto d'incontro.", "Ti scrivo per confermare il quartiere e il punto d'incontro.", "Ti scrivo per confermare il menù e il punto d'incontro."], 0],
    ["If the plan changes let me know as soon as possible.", ["Se il programma cambia avvisami il prima possibile.", "Se il programma cambia assaggiami il prima possibile.", "Se il programma cambia dividimi il prima possibile.", "Se il programma cambia chiudimi il prima possibile."], 0],
  ],
  travel: [
    ["If I miss the connection I need another solution.", ["Se perdo la coincidenza mi serve un'altra soluzione.", "Se perdo la coincidenza mi serve un'altra forchetta.", "Se perdo la coincidenza mi serve un'altra farmacia.", "Se perdo la coincidenza mi serve un'altra cucina."], 0],
    ["I need a ticket that I can change without problems.", ["Mi serve un biglietto che posso cambiare senza problemi.", "Mi serve un biglietto che posso cucinare senza problemi.", "Mi serve un biglietto che posso dividere senza problemi.", "Mi serve un biglietto che posso indossare senza problemi."], 0],
    ["Yesterday we arrived at the station too late for the change.", ["Ieri siamo arrivati in stazione troppo tardi per il cambio.", "Ieri siamo arrivati in cucina troppo tardi per il cambio.", "Ieri siamo arrivati in stazione troppo tardi per il dolce.", "Ieri siamo arrivati nel quartiere troppo tardi per il cambio."], 0],
    ["The bus stops in front of the museum and then turns right.", ["Il pullman ferma davanti al museo e poi gira a destra.", "Il pullman ferma dentro il museo e poi gira a destra.", "Il pullman ferma davanti al museo e poi mangia a destra.", "Il pullman ferma sopra il museo e poi gira il dolce."], 0],
  ],
  work: [
    ["Can we move the meeting because one detail is missing?", ["Possiamo spostare la riunione perché manca un dettaglio?", "Possiamo spostare la riunione perché manca un quartiere?", "Possiamo spostare la riunione perché manca un binario?", "Possiamo spostare la riunione perché manca un cameriere?"], 0],
    ["At the end I send a message with the confirmed details.", ["Alla fine mando un messaggio con i dettagli confermati.", "Alla fine mando un binario con i dettagli confermati.", "Alla fine mando un dessert con i dettagli confermati.", "Alla fine mando un armadio con i dettagli confermati."], 0],
    ["Yesterday we finished late and today we continue from the same point.", ["Ieri abbiamo finito tardi e oggi riprendiamo dallo stesso punto.", "Ieri abbiamo finito tardi e oggi riprendiamo dallo stesso binario.", "Ieri abbiamo finito tardi e oggi mangiamo dallo stesso punto.", "Ieri abbiamo finito tardi e oggi riprendiamo dal cameriere."], 0],
  ],
  routine: [
    ["This morning I changed route because there was traffic.", ["Questa mattina ho cambiato strada perché c'era traffico.", "Questa mattina ho cambiato tavolo perché c'era traffico.", "Questa mattina ho cambiato strada perché c'era dessert.", "Questa mattina ho mangiato strada perché c'era traffico."], 0],
    ["I usually stop by the supermarket before going home.", ["Di solito passo dal supermercato prima di tornare a casa.", "Di solito passo dal supermercato prima di tornare al binario.", "Di solito passo dal cameriere prima di tornare a casa.", "Di solito passo dalla farmacia prima di mangiare casa."], 0],
  ],
  health: [
    ["I would like to confirm how often I need to take the medicine.", ["Vorrei confermare ogni quanto devo prendere la medicina.", "Vorrei confermare ogni quanto devo prendere la fermata.", "Vorrei confermare ogni quanto devo prendere la taglia.", "Vorrei confermare ogni quanto devo prendere la prenotazione."], 0],
    ["I need a clearer explanation of the side effects.", ["Mi serve una spiegazione più chiara degli effetti collaterali.", "Mi serve una spiegazione più chiara dei binari collaterali.", "Mi serve una spiegazione più chiara delle taglie collaterali.", "Mi serve una spiegazione più chiara dei menù collaterali."], 0],
  ],
  bureaucracy: [
    ["I am still missing one document and I do not know where to find it.", ["Mi manca ancora un documento e non so dove trovarlo.", "Mi manca ancora un documento e non so dove dividerlo.", "Mi manca ancora un documento e non so dove cucinarlo.", "Mi manca ancora un documento e non so dove provarlo."], 0],
    ["Can I set a new appointment if the procedure changes?", ["Posso fissare un nuovo appuntamento se cambia la procedura?", "Posso fissare un nuovo appuntamento se cambia la fermata?", "Posso fissare un nuovo appuntamento se cambia la forchetta?", "Posso fissare un nuovo appuntamento se cambia la cucina?"], 0],
  ],
  planning: [
    ["First I confirm the time then I send the final recap.", ["Prima confermo l'orario poi mando il riepilogo finale.", "Prima confermo l'orario poi mando il binario finale.", "Prima confermo l'orario poi mando il menù finale.", "Prima confermo l'orario poi mando il bagno finale."], 0],
    ["If something changes we find another solution immediately.", ["Se qualcosa cambia troviamo subito un'altra soluzione.", "Se qualcosa cambia troviamo subito un'altra farmacia.", "Se qualcosa cambia troviamo subito un'altra taglia.", "Se qualcosa cambia troviamo subito un'altra forchetta."], 0],
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

function getClozeBank(level) {
  if (level === "B1") return B1_CLOZE_BY_FOCUS;
  if (level === "A2") return A2_CLOZE_BY_FOCUS;
  if (level === "A1") return A1_CLOZE_BY_FOCUS;
  return CLOZE_BY_FOCUS;
}

function getPatternBank(level) {
  if (level === "B1") return B1_PATTERN_DRILLS_BY_FOCUS;
  if (level === "A2") return A2_PATTERN_DRILLS_BY_FOCUS;
  if (level === "A1") return A1_PATTERN_DRILLS_BY_FOCUS;
  return PATTERN_DRILLS_BY_FOCUS;
}

function getErrorHuntBank(level) {
  if (level === "B1") return B1_ERROR_HUNTS_BY_FOCUS;
  if (level === "A2") return A2_ERROR_HUNTS_BY_FOCUS;
  if (level === "A1") return A1_ERROR_HUNTS_BY_FOCUS;
  return ERROR_HUNTS_BY_FOCUS;
}

function getGeneralErrorRows(level) {
  if (level === "B1") return B1_GENERAL_ERROR_HUNT_ROWS;
  if (level === "A2") return A2_GENERAL_ERROR_HUNT_ROWS;
  if (level === "A1") return A1_GENERAL_ERROR_HUNT_ROWS;
  return GENERAL_ERROR_HUNT_ROWS;
}

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
  for (const row of GENERAL_WORD_BUILDERS) combined.push({ tag: "general", row });
  return uniqueBy(combined, (entry) => entry.row[0]);
}

function pickWordBuildersForLevel(tags, level) {
  if (level === "A1") {
    const combined = [];
    for (const tag of tags) {
      for (const row of A1_WORD_BUILDERS_BY_TAG[tag] ?? WORD_BUILDERS_BY_TAG[tag] ?? []) combined.push({ tag, row });
    }
    for (const row of A1_GENERAL_WORD_BUILDERS) combined.push({ tag: "general", row });
    return uniqueBy(combined, (entry) => entry.row[0]);
  }
  if (level === "A2") {
    const combined = [];
    for (const tag of tags) {
      for (const row of A2_WORD_BUILDERS_BY_TAG[tag] ?? []) combined.push({ tag, row });
    }
    for (const row of GENERAL_WORD_BUILDERS) combined.push({ tag: "general", row });
    return uniqueBy(combined, (entry) => entry.row[0]);
  }
  if (level !== "B1") return pickWordBuilders(tags);
  const combined = [];
  for (const tag of tags) {
    for (const row of B1_WORD_BUILDERS_BY_TAG[tag] ?? []) combined.push({ tag, row });
  }
  for (const row of GENERAL_WORD_BUILDERS) combined.push({ tag: "general", row });
  return uniqueBy(combined, (entry) => entry.row[0]);
}

function pickSpeedTranslations(tags) {
  const combined = [];
  for (const tag of tags) {
    for (const row of SPEED_TRANSLATION_BY_TAG[tag] ?? []) combined.push({ tag, row });
  }
  for (const row of GENERAL_SPEED_TRANSLATIONS) combined.push({ tag: "general", row });
  return uniqueBy(combined, (entry) => entry.row[0]);
}

function pickSpeedTranslationsForLevel(tags, level) {
  if (level === "A1") {
    const combined = [];
    for (const tag of tags) {
      for (const row of A1_SPEED_TRANSLATION_BY_TAG[tag] ?? SPEED_TRANSLATION_BY_TAG[tag] ?? []) combined.push({ tag, row });
    }
    for (const row of A1_GENERAL_SPEED_TRANSLATIONS) combined.push({ tag: "general", row });
    return uniqueBy(combined, (entry) => entry.row[0]);
  }
  if (level === "A2") {
    const combined = [];
    for (const tag of tags) {
      for (const row of A2_SPEED_TRANSLATION_BY_TAG[tag] ?? []) combined.push({ tag, row });
    }
    for (const row of A2_GENERAL_SPEED_TRANSLATIONS) combined.push({ tag: "general", row });
    return uniqueBy(combined, (entry) => entry.row[0]);
  }
  if (level !== "B1") return pickSpeedTranslations(tags);
  const combined = [];
  for (const tag of tags) {
    for (const row of B1_SPEED_TRANSLATION_BY_TAG[tag] ?? []) combined.push({ tag, row });
  }
  for (const row of B1_GENERAL_SPEED_TRANSLATIONS) combined.push({ tag: "general", row });
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

const REFLECTION_PROMPT_BUILDERS = [
  (mission) => ({
    title: "Mission reflection",
    variantKey: "reflection-main",
    prompt: `After "${mission.title}", which detail was hardest to communicate or confirm?`,
    follow_up: `What exact phrase will you reuse next time to improve the mission objective: ${mission.objective}`,
  }),
  (mission) => ({
    title: "Mission debrief",
    variantKey: "reflection-debrief",
    prompt: `Which part of "${mission.title}" still feels unstable when you have to answer quickly?`,
    follow_up: `Write one short Italian response you want to produce more confidently next time.`,
  }),
  (mission) => ({
    title: "Mission replay plan",
    variantKey: "reflection-replay",
    prompt: `If you repeated "${mission.title}" tomorrow, where would you slow down or ask a better follow-up question?`,
    follow_up: `Name one phrase, connector, or clarification move that would make your response more complete.`,
  }),
  (mission) => ({
    title: "Pattern extraction",
    variantKey: "reflection-patterns",
    prompt: `Which response pattern from "${mission.title}" felt reusable beyond this single mission?`,
    follow_up: `Write one short Italian sentence frame you want to reuse in another situation.`,
  }),
  (mission) => ({
    title: "Repair check",
    variantKey: "reflection-repair",
    prompt: `Where in "${mission.title}" did you need to clarify, repair, or slow down?`,
    follow_up: `Write the exact repair line you want to remember for next time.`,
  }),
];

const CONVERSATION_PROMPT_BUILDERS = [
  (mission, checkpoint, targetPhrases, tonePrompt) => ({
    title: checkpoint.title,
    scenario: `${mission.scenario} Focus now on this checkpoint: ${checkpoint.description}`,
    target_phrases: targetPhrases.slice(0, 5),
    system_prompt: `${tonePrompt} The learner's task is: ${checkpoint.description} Require a clear practical answer before closing the conversation.`,
  }),
  (mission, checkpoint, targetPhrases, tonePrompt) => ({
    title: `${checkpoint.title} clarification`,
    scenario: `${mission.scenario} The learner's first answer was incomplete. Stay on this checkpoint: ${checkpoint.description} Ask for the missing detail before you accept the answer.`,
    target_phrases: targetPhrases.slice(1, 6),
    system_prompt: `${tonePrompt} Push for one missing detail, then ask the learner to confirm the final time, place, or condition before you close.`,
  }),
  (mission, checkpoint, targetPhrases, tonePrompt) => ({
    title: `${checkpoint.title} pressure check`,
    scenario: `${mission.scenario} Time is limited now. Keep the exchange short and require a concise but complete answer for: ${checkpoint.description}`,
    target_phrases: [...targetPhrases.slice(0, 3), "confermo", "va bene"],
    system_prompt: `${tonePrompt} Keep the exchange brisk. Interrupt vague answers and ask the learner to restate the key fact in one compact reply.`,
  }),
  (mission, checkpoint, targetPhrases, tonePrompt) => ({
    title: `${checkpoint.title} recap close`,
    scenario: `${mission.scenario} You are closing the interaction. Ask the learner to summarize the final outcome of: ${checkpoint.description}`,
    target_phrases: ["allora", "ricapitolando", ...targetPhrases.slice(0, 3)],
    system_prompt: `${tonePrompt} End only after the learner gives a short recap with the final decision and one next step.`,
  }),
];

function buildMissionLibrary(mission) {
  const entries = [];
  let order = 1;
  const tagBank = pickTagBank(mission.tags);
  const wordBuilders = pickWordBuildersForLevel(mission.tags, mission.level);
  const speedTranslations = pickSpeedTranslationsForLevel(mission.tags, mission.level);
  const clozeBank = getClozeBank(mission.level);
  const patternBank = getPatternBank(mission.level);
  const errorHuntBank = getErrorHuntBank(mission.level);
  const generalErrorRows = getGeneralErrorRows(mission.level);
  const clozeRows = pickFocusRows(mission.errorFocus, clozeBank);
  const patternRows = pickFocusRows(mission.errorFocus, patternBank);
  const errorHunts = pickFocusRows(mission.errorFocus, errorHuntBank);
  const focusFallback = mission.errorFocus[0] ?? "lexical_gap";
  const primaryTag = mission.tags[0] ?? "work";
  const tonePrompt = CONVERSATION_STYLES[primaryTag] ?? CONVERSATION_STYLES.work;
  const checkpoints = mission.checkpoints ?? [];

  for (const { tag, row } of tagBank.slice(0, 36)) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "srs",
      tier: "bronze",
      order: order++,
      title: row[0],
      skillId: exerciseSkillForType("srs"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `srs-${slug(row[0])}`,
      content: { front: row[0], back: row[1], example: row[2], tag, level: mission.level, direction: "it_to_en" },
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
      tier: "bronze",
      order: order++,
      title: `${row[0]} review`,
      skillId: exerciseSkillForType("srs"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `srs-fallback-${slug(row[0])}-${countType(entries, "srs")}`,
      content: { front: row[0], back: row[1], example: row[2], tag, level: mission.level, direction: "it_to_en" },
      active: true,
    });
  }

  for (const { focus, row } of clozeRows.slice(0, 6)) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "cloze",
      tier: "silver",
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
      tier: "silver",
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
      tier: "silver",
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
      tier: "silver",
      order: order++,
      title: row.name,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("pattern_drill"),
      tags: mission.tags,
      errorFocus: [focus],
      variantKey: `pattern-${focus}-${slug(row.name)}`,
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
      tier: "silver",
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
      tier: "silver",
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

  const fallbackCloze = (clozeBank[focusFallback] ?? clozeBank.lexical_gap)[0];
  while (countType(entries, "cloze") < 6) {
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "cloze",
      tier: "silver",
      order: order++,
      title: `${focusFallback} fallback cloze`,
      checkpointId: checkpoints[0]?.id,
      skillId: exerciseSkillForType("cloze"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `cloze-fallback-${focusFallback}-${countType(entries, "cloze")}`,
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

  const fallbackPattern = patternBank[focusFallback] ?? patternBank.verb_conjugation;
  const patternFallbackKeys = uniqueBy(
    mission.errorFocus
      .filter((focus) => Boolean(patternBank[focus]))
      .map((focus) => ({ focus, row: patternBank[focus] })),
    (entry) => entry.focus
  );

  for (const { focus, row } of patternFallbackKeys) {
    if (countType(entries, "pattern_drill") >= 4) break;
    if (entries.some((entry) => entry.type === "pattern_drill" && entry.variantKey === `pattern-${focus}-${slug(row.name)}`)) continue;
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "pattern_drill",
      tier: "silver",
      order: order++,
      title: row.name,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("pattern_drill"),
      tags: mission.tags,
      errorFocus: [focus],
      variantKey: `pattern-${focus}-${slug(row.name)}`,
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
      tier: "silver",
      order: order++,
      title: fallbackPattern.name,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("pattern_drill"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `pattern-fallback-${focusFallback}-${countType(entries, "pattern_drill")}`,
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

  const fallbackErrorRows = errorHuntBank[focusFallback] ?? generalErrorRows;
  while (countType(entries, "error_hunt") < 4) {
    const fallbackError = fallbackErrorRows[countType(entries, "error_hunt") % fallbackErrorRows.length];
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "error_hunt",
      tier: "silver",
      order: order++,
      title: `${focusFallback} fallback hunt`,
      checkpointId: checkpoints[2]?.id ?? checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("error_hunt"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `error-fallback-${focusFallback}-${countType(entries, "error_hunt")}`,
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

  const fallbackTranslationRows = SPEED_TRANSLATION_BY_TAG[primaryTag] ?? GENERAL_SPEED_TRANSLATIONS;
  while (countType(entries, "speed_translation") < 4) {
    const fallbackTranslation = fallbackTranslationRows[countType(entries, "speed_translation") % fallbackTranslationRows.length];
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "speed_translation",
      tier: "silver",
      order: order++,
      title: `${primaryTag} fallback translation`,
      checkpointId: checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("speed_translation"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `translation-fallback-${primaryTag}-${countType(entries, "speed_translation")}`,
      content: {
        sentences: [{ source: fallbackTranslation[0], options: fallbackTranslation[1], correct: fallbackTranslation[2] }],
        time_limit_seconds: 30,
      },
      active: true,
    });
  }

  while (countType(entries, "error_hunt") < 4) {
    const fallback = generalErrorRows[countType(entries, "error_hunt") % generalErrorRows.length];
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "error_hunt",
      tier: "silver",
      order: order++,
      title: `${focusFallback} extra hunt`,
      checkpointId: checkpoints[2]?.id ?? checkpoints[1]?.id ?? checkpoints[0]?.id,
      skillId: exerciseSkillForType("error_hunt"),
      tags: mission.tags,
      errorFocus: [focusFallback],
      variantKey: `error-extra-${focusFallback}-${countType(entries, "error_hunt")}`,
      content: {
        sentences: [
          { text: fallback[0], has_error: true, corrected: fallback[1], explanation: fallback[2] },
          { text: fallback[1], has_error: false, corrected: fallback[1], explanation: "The sentence is already correct." },
        ],
      },
      active: true,
    });
  }

  const conversationTarget = Math.max(3, mission.exerciseMix?.conversation ?? 3);
  const conversationCheckpoints = checkpoints.length > 0
    ? checkpoints
    : [{ id: `${mission.missionId}:main`, title: mission.title, description: mission.objective }];

  for (let index = 0; index < conversationTarget; index += 1) {
    const checkpoint = conversationCheckpoints[index % conversationCheckpoints.length];
    const builder = CONVERSATION_PROMPT_BUILDERS[index % CONVERSATION_PROMPT_BUILDERS.length];
    const variantNumber = Math.floor(index / conversationCheckpoints.length) + 1;
    const targetBank = pickTagBank(mission.tags).map((entry) => entry.row[0]);
    const offset = (index * 2) % Math.max(1, targetBank.length);
    const rotatedTargets = [...targetBank.slice(offset), ...targetBank.slice(0, offset)].slice(0, 5);
    const conversationTemplate = builder(mission, checkpoint, rotatedTargets, tonePrompt);
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "conversation",
      tier: "gold",
      order: order++,
      title: variantNumber === 1 ? conversationTemplate.title : `${conversationTemplate.title} ${variantNumber}`,
      checkpointId: checkpoint.id,
      skillId: exerciseSkillForType("conversation"),
      tags: mission.tags,
      errorFocus: mission.errorFocus.slice(0, 2),
      variantKey: `conversation-${slug(checkpoint.id)}-${slug(conversationTemplate.title)}-${variantNumber}`,
      content: {
        scenario: conversationTemplate.scenario,
        target_phrases: conversationTemplate.target_phrases,
        grammar_focus: mission.errorFocus.slice(0, 2).join(" + "),
        difficulty: mission.level,
        system_prompt: conversationTemplate.system_prompt,
      },
      active: true,
    });
  }

  const reflectionTarget = Math.max(1, mission.exerciseMix?.reflection ?? 1);
  for (let index = 0; index < reflectionTarget; index += 1) {
    const template = REFLECTION_PROMPT_BUILDERS[index % REFLECTION_PROMPT_BUILDERS.length](mission);
    const variantNumber = Math.floor(index / REFLECTION_PROMPT_BUILDERS.length) + 1;
    entries.push({
      missionId: mission.missionId,
      level: mission.level,
      type: "reflection",
      tier: "gold",
      order: order++,
      title: variantNumber === 1 ? template.title : `${template.title} ${variantNumber}`,
      checkpointId: checkpoints.at(-1)?.id,
      skillId: exerciseSkillForType("reflection"),
      tags: mission.tags,
      errorFocus: mission.errorFocus.slice(0, 2),
      variantKey: variantNumber === 1 ? template.variantKey : `${template.variantKey}-${variantNumber}`,
      content: {
        prompt: template.prompt,
        follow_up: template.follow_up,
      },
      active: true,
    });
  }

  return entries;
}

export const EXERCISE_TEMPLATES = MISSIONS
  .filter((mission) => mission.level !== "B2")
  .flatMap((mission) => buildMissionLibrary(mission));
