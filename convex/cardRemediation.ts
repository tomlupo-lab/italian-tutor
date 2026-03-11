export type LibraryCard = {
  it: string;
  en: string;
  example: string;
  tag: string;
  level: "A1" | "A2" | "B1" | "B2";
};

export const MISSION_TOPUP_PATCHES: Record<string, Partial<LibraryCard>> = {
  "la visita": {
    en: "the apartment viewing",
    example: "Possiamo fissare una visita per domani pomeriggio?",
  },
  "le spese": {
    en: "the extra monthly costs",
    example: "Le spese mensili sono incluse nell'affitto?",
  },
  "il deposito": {
    it: "il deposito cauzionale",
    en: "the security deposit",
    example: "Il deposito cauzionale corrisponde a due mensilità.",
  },
  "la data di ingresso": {
    it: "la data di disponibilità",
    en: "the move-in date",
    example: "Qual è la data di disponibilità dell'appartamento?",
  },
  "il dettaglio": {
    en: "the detail",
    example: "Mi manda un dettaglio in più sulle spese?",
  },
  "la conferma": {
    en: "the confirmation",
    example: "Aspetto la conferma della visita per email.",
  },
};

export const SEED_CARD_PATCHES: Array<{ matchIt: string; changes: Partial<LibraryCard> }> = [
  { matchIt: "ciao", changes: { en: "hello", example: "Ciao, come stai?" } },
  { matchIt: "mi chiamo...", changes: { it: "mi chiamo", en: "my name is", example: "Mi chiamo Luca." } },
  {
    matchIt: "sono allergico/a a...",
    changes: { it: "sono allergico a", en: "I am allergic to", example: "Sono allergico alle noccioline." },
  },
  {
    matchIt: "il primo / il secondo",
    changes: { it: "il primo piatto", en: "the first course", example: "Come primo piatto prendo la pasta." },
  },
  {
    matchIt: "avere fame / sete",
    changes: { it: "avere fame", en: "to be hungry", example: "Ho fame, andiamo a mangiare?" },
  },
  {
    matchIt: "il/la partner",
    changes: { it: "il partner", en: "the partner", example: "Il mio partner lavora a Milano." },
  },
  {
    matchIt: "assaggiare",
    changes: { en: "to taste", example: "Vuoi assaggiare il mio tiramisu?" },
  },
  {
    matchIt: "magari",
    changes: { en: "if only", example: "Magari fossi gia in vacanza." },
  },
  {
    matchIt: "piuttosto",
    changes: { en: "rather", example: "Preferisco restare a casa, piuttosto." },
  },
  {
    matchIt: "figurati",
    changes: { en: "don't mention it", example: "Grazie per l'aiuto. Figurati." },
  },
  {
    matchIt: "il portafoglio",
    changes: { en: "the wallet", example: "Ho lasciato il portafoglio sul tavolo." },
  },
  {
    matchIt: "la pratica",
    changes: { en: "the application file", example: "La pratica per il permesso e ancora in lavorazione." },
  },
  {
    matchIt: "il documento",
    changes: { en: "the document", example: "Mi manca ancora un documento per la domanda." },
  },
  {
    matchIt: "sbattere",
    changes: { en: "to slam", example: "Non sbattere la porta, per favore." },
  },
];

export const SEED_CARD_INSERTS: LibraryCard[] = [
  { it: "avere sete", en: "to be thirsty", example: "Dopo il viaggio ho molta sete.", tag: "food", level: "A2" },
  { it: "il secondo piatto", en: "the second course", example: "Come secondo piatto prendo il pesce.", tag: "food", level: "A2" },
  { it: "la partner", en: "the partner", example: "La mia partner arriva piu tardi.", tag: "emotions", level: "B1" },
  { it: "magari no", en: "maybe not", example: "Usciamo stasera? Magari no, sono stanco.", tag: "connectors", level: "B2" },
  { it: "piuttosto che", en: "rather than", example: "Prendo il treno piuttosto che la macchina.", tag: "connectors", level: "B2" },
  { it: "figurati che", en: "just imagine", example: "Figurati che ho perso l'ultimo treno.", tag: "idioms", level: "B2" },
  { it: "il portafoglio titoli", en: "the investment portfolio", example: "Il portafoglio titoli e ben diversificato.", tag: "finance", level: "B2" },
  { it: "la pratica burocratica", en: "the paperwork file", example: "La pratica burocratica richiede ancora due firme.", tag: "bureaucracy", level: "B2" },
  { it: "sbattersi", en: "to bust one's ass", example: "Mi sono sbattuto tutto il giorno per chiudere il progetto.", tag: "slang", level: "B2" },
];

export const A1_AUDIT_EXPANSION: LibraryCard[] = [
  { it: "cerco una stanza singola", en: "I am looking for a single room", example: "Cerco una stanza singola vicino alla metro.", tag: "home", level: "A1" },
  { it: "l'affitto e trattabile", en: "the rent is negotiable", example: "L'affitto e trattabile o e fisso?", tag: "home", level: "A1" },
  { it: "quanto costa al mese", en: "how much is it per month", example: "Quanto costa al mese questa stanza?", tag: "home", level: "A1" },
  { it: "la stanza e arredata", en: "the room is furnished", example: "La stanza e arredata oppure no?", tag: "home", level: "A1" },
  { it: "e una stanza doppia", en: "it is a double room", example: "No, non e singola: e una stanza doppia.", tag: "home", level: "A1" },
  { it: "cerco un monolocale", en: "I am looking for a studio apartment", example: "Cerco un monolocale non troppo lontano dal centro.", tag: "home", level: "A1" },
  { it: "la cucina e condivisa", en: "the kitchen is shared", example: "La cucina e condivisa con altri due studenti.", tag: "home", level: "A1" },
  { it: "il bagno e privato", en: "the bathroom is private", example: "Il bagno e privato oppure condiviso?", tag: "home", level: "A1" },
  { it: "la stanza e libera da subito", en: "the room is available immediately", example: "La stanza e libera da subito.", tag: "home", level: "A1" },
  { it: "vorrei vedere l'appartamento", en: "I would like to see the apartment", example: "Vorrei vedere l'appartamento domani.", tag: "home", level: "A1" },
  { it: "a che piano si trova", en: "what floor is it on", example: "A che piano si trova l'appartamento?", tag: "home", level: "A1" },
  { it: "c'e l'ascensore", en: "is there a lift", example: "C'e l'ascensore nel palazzo?", tag: "home", level: "A1" },
  { it: "quanto dura il contratto", en: "how long is the contract", example: "Quanto dura il contratto di affitto?", tag: "home", level: "A1" },
  { it: "posso prendere le misure", en: "can I take the measurements", example: "Posso prendere le misure della stanza?", tag: "home", level: "A1" },
  { it: "quando posso entrare", en: "when can I move in", example: "Quando posso entrare nell'appartamento?", tag: "home", level: "A1" },
  { it: "la zona e tranquilla", en: "the area is quiet", example: "La zona e tranquilla la sera.", tag: "home", level: "A1" },
  { it: "e vicino alla metro", en: "it is near the metro", example: "Si, e vicino alla metro.", tag: "home", level: "A1" },
  { it: "mi serve un posto letto", en: "I need a bed space", example: "Per ora mi serve solo un posto letto.", tag: "home", level: "A1" },
  { it: "posso lasciare una caparra", en: "can I leave a deposit", example: "Posso lasciare una caparra oggi?", tag: "home", level: "A1" },
  { it: "la stanza da sulla strada", en: "the room faces the street", example: "La stanza da sulla strada principale.", tag: "home", level: "A1" },

  { it: "avete un tavolo libero", en: "do you have a free table", example: "Buonasera, avete un tavolo libero?", tag: "food", level: "A1" },
  { it: "abbiamo una prenotazione", en: "we have a reservation", example: "Abbiamo una prenotazione per le otto.", tag: "food", level: "A1" },
  { it: "preferisco stare dentro", en: "I prefer to sit inside", example: "Stasera preferisco stare dentro.", tag: "food", level: "A1" },
  { it: "vorrei ordinare", en: "I would like to order", example: "Vorrei ordinare adesso, grazie.", tag: "food", level: "A1" },
  { it: "per me la pasta", en: "for me, the pasta", example: "Per me la pasta al pomodoro.", tag: "food", level: "A1" },
  { it: "senza formaggio", en: "without cheese", example: "Per me la pasta senza formaggio.", tag: "food", level: "A1" },
  { it: "che cosa consiglia", en: "what do you recommend", example: "Che cosa consiglia oggi?", tag: "food", level: "A1" },
  { it: "e troppo salato", en: "it is too salty", example: "Mi dispiace, per me e troppo salato.", tag: "food", level: "A1" },
  { it: "potrebbe portarci del pane", en: "could you bring us some bread", example: "Potrebbe portarci del pane, per favore?", tag: "food", level: "A1" },
  { it: "dividiamo un antipasto", en: "we are sharing an appetizer", example: "Dividiamo un antipasto e poi prendiamo due primi.", tag: "food", level: "A1" },
  { it: "offro io", en: "it is on me", example: "Stasera offro io.", tag: "social", level: "A1" },
  { it: "che buona idea", en: "what a good idea", example: "Un aperitivo prima di cena? Che buona idea.", tag: "social", level: "A1" },
  { it: "arrivo tra dieci minuti", en: "I am arriving in ten minutes", example: "Scusa il ritardo, arrivo tra dieci minuti.", tag: "social", level: "A1" },
  { it: "ti aspetto fuori", en: "I will wait for you outside", example: "Ti aspetto fuori dal ristorante.", tag: "social", level: "A1" },
  { it: "grazie per l'invito", en: "thanks for the invitation", example: "Grazie per l'invito a cena.", tag: "social", level: "A1" },
  { it: "complimenti, e buonissimo", en: "compliments, it is delicious", example: "Complimenti, e buonissimo questo risotto.", tag: "social", level: "A1" },

  { it: "a che ora parte", en: "what time does it leave", example: "A che ora parte il prossimo treno?", tag: "travel", level: "A1" },
  { it: "da quale binario", en: "from which platform", example: "Da quale binario parte il regionale?", tag: "travel", level: "A1" },
  { it: "ho perso il treno", en: "I missed the train", example: "Scusi, ho perso il treno per Bologna.", tag: "travel", level: "A1" },
  { it: "il treno e cancellato", en: "the train is cancelled", example: "Il treno delle nove e cancellato.", tag: "travel", level: "A1" },
  { it: "devo cambiare a Firenze", en: "I have to change in Florence", example: "Devo cambiare a Firenze o vado diretto?", tag: "travel", level: "A1" },
  { it: "c'e un treno piu tardi", en: "is there a later train", example: "C'e un treno piu tardi per Roma?", tag: "travel", level: "A1" },
  { it: "vorrei cambiare il biglietto", en: "I would like to change the ticket", example: "Vorrei cambiare il biglietto per domani.", tag: "travel", level: "A1" },
  { it: "devo timbrare il biglietto", en: "do I need to validate the ticket", example: "Scusi, devo timbrare il biglietto?", tag: "travel", level: "A1" },
  { it: "c'e uno sciopero oggi", en: "there is a strike today", example: "Mi hanno detto che c'e uno sciopero oggi.", tag: "travel", level: "A1" },
  { it: "questa e la fermata giusta", en: "this is the right stop", example: "Scusi, questa e la fermata giusta?", tag: "travel", level: "A1" },
  { it: "devo prendere il regionale", en: "I need to take the regional train", example: "Per Pisa devo prendere il regionale?", tag: "travel", level: "A1" },
  { it: "quanto tempo ci vuole", en: "how long does it take", example: "Quanto tempo ci vuole fino a Milano?", tag: "travel", level: "A1" },
  { it: "il posto e occupato", en: "the seat is taken", example: "Mi scusi, questo posto e occupato?", tag: "travel", level: "A1" },
  { it: "il controllore arriva", en: "the ticket inspector is coming", example: "Prepara il biglietto, il controllore arriva.", tag: "travel", level: "A1" },
  { it: "scendo alla prossima", en: "I am getting off at the next stop", example: "No grazie, scendo alla prossima.", tag: "travel", level: "A1" },
  { it: "mi puo indicare l'uscita", en: "can you show me the exit", example: "Mi puo indicare l'uscita per i taxi?", tag: "travel", level: "A1" },

  { it: "mi fa male la gola", en: "my throat hurts", example: "Da ieri mi fa male la gola.", tag: "health", level: "A1" },
  { it: "ho la tosse", en: "I have a cough", example: "Buonasera, ho la tosse da due giorni.", tag: "health", level: "A1" },
  { it: "ho mal di stomaco", en: "I have a stomach ache", example: "Dopo pranzo ho mal di stomaco.", tag: "health", level: "A1" },
  { it: "da quanto tempo", en: "for how long", example: "Da quanto tempo hai la febbre?", tag: "health", level: "A1" },
  { it: "ha qualcosa per la febbre", en: "do you have something for a fever", example: "Ha qualcosa per la febbre?", tag: "health", level: "A1" },
  { it: "devo prendere una compressa", en: "I need to take one tablet", example: "Devo prendere una compressa dopo cena?", tag: "health", level: "A1" },
  { it: "prima o dopo i pasti", en: "before or after meals", example: "Questa medicina si prende prima o dopo i pasti?", tag: "health", level: "A1" },
  { it: "sono intollerante al lattosio", en: "I am lactose intolerant", example: "Sono intollerante al lattosio.", tag: "health", level: "A1" },
  { it: "mi gira la testa", en: "I feel dizzy", example: "Da stamattina mi gira la testa.", tag: "health", level: "A1" },
  { it: "devo riposare", en: "I need to rest", example: "Oggi devo riposare tutto il giorno.", tag: "health", level: "A1" },
  { it: "ha bisogno della ricetta", en: "do you need a prescription", example: "Per questo farmaco ha bisogno della ricetta?", tag: "health", level: "A1" },
  { it: "quante volte al giorno", en: "how many times a day", example: "Quante volte al giorno devo prenderlo?", tag: "health", level: "A1" },
  { it: "non mi sento bene", en: "I do not feel well", example: "Oggi non mi sento bene.", tag: "health", level: "A1" },
  { it: "mi serve una farmacia di turno", en: "I need a pharmacy on duty", example: "Mi serve una farmacia di turno qui vicino.", tag: "health", level: "A1" },

  { it: "sono in ritardo di cinque minuti", en: "I am five minutes late", example: "Scusa, sono in ritardo di cinque minuti.", tag: "time", level: "A1" },
  { it: "ci vediamo verso le sette", en: "let's meet around seven", example: "Ci vediamo verso le sette davanti al bar.", tag: "time", level: "A1" },
  { it: "sono libero domani mattina", en: "I am free tomorrow morning", example: "Sono libero domani mattina dalle nove.", tag: "time", level: "A1" },
  { it: "oggi non posso", en: "I cannot today", example: "Oggi non posso, ho gia un impegno.", tag: "time", level: "A1" },
  { it: "rimandiamo a domani", en: "let's postpone it until tomorrow", example: "Sei stanco? Rimandiamo a domani.", tag: "time", level: "A1" },
  { it: "lavoro fino alle sei", en: "I work until six", example: "Oggi lavoro fino alle sei.", tag: "time", level: "A1" },
  { it: "faccio pausa alle due", en: "I take a break at two", example: "Di solito faccio pausa alle due.", tag: "time", level: "A1" },
  { it: "di solito esco presto", en: "I usually leave early", example: "Il venerdi di solito esco presto.", tag: "time", level: "A1" },
  { it: "ho un appuntamento alle tre", en: "I have an appointment at three", example: "Domani ho un appuntamento alle tre.", tag: "time", level: "A1" },
  { it: "torno a casa tardi", en: "I get home late", example: "Il martedi torno a casa tardi.", tag: "time", level: "A1" },
  { it: "mi sveglio alle sette", en: "I wake up at seven", example: "Nei giorni feriali mi sveglio alle sette.", tag: "routine", level: "A1" },
  { it: "faccio la doccia la mattina", en: "I shower in the morning", example: "Di solito faccio la doccia la mattina.", tag: "routine", level: "A1" },

  { it: "come si dice in italiano", en: "how do you say it in Italian", example: "Scusi, come si dice in italiano?", tag: "basics", level: "A1" },
  { it: "come si scrive", en: "how do you spell it", example: "Come si scrive il suo cognome?", tag: "basics", level: "A1" },
  { it: "puo parlare piu piano", en: "can you speak more slowly", example: "Mi scusi, puo parlare piu piano?", tag: "basics", level: "A1" },
  { it: "non ho capito bene", en: "I did not understand well", example: "Mi dispiace, non ho capito bene.", tag: "basics", level: "A1" },
  { it: "puo scriverlo", en: "can you write it down", example: "Puo scriverlo su un foglio?", tag: "basics", level: "A1" },
  { it: "puo mostrarmelo", en: "can you show it to me", example: "Non capisco: puo mostrarmelo?", tag: "basics", level: "A1" },
  { it: "un attimo, per favore", en: "one moment, please", example: "Un attimo, per favore, cerco il portafoglio.", tag: "basics", level: "A1" },
  { it: "va bene cosi", en: "that is fine like that", example: "Si, va bene cosi, grazie.", tag: "basics", level: "A1" },
  { it: "non ne sono sicuro", en: "I am not sure", example: "Non ne sono sicuro, controllo subito.", tag: "basics", level: "A1" },
  { it: "puo aspettare un momento", en: "can you wait a moment", example: "Puo aspettare un momento, per favore?", tag: "basics", level: "A1" },
  { it: "ho bisogno di piu tempo", en: "I need more time", example: "Ho bisogno di piu tempo per decidere.", tag: "basics", level: "A1" },
  { it: "puo ripetere l'ultima frase", en: "can you repeat the last sentence", example: "Puo ripetere l'ultima frase, per favore?", tag: "basics", level: "A1" },
  { it: "sto ancora imparando", en: "I am still learning", example: "Parli pure piano, sto ancora imparando.", tag: "basics", level: "A1" },
  { it: "mi puo aiutare", en: "can you help me", example: "Mi puo aiutare con il modulo?", tag: "basics", level: "A1" },
];
