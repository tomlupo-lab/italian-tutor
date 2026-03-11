import { extendedVocab } from "./vocab-extended";

export interface VocabCard {
  id: string;
  it: string;
  en: string;
  ex: string;
  speakText?: string;
  exampleSpeakText?: string;
  tag?: string;
  level?: "A1" | "A2" | "B1" | "B2";
}

const coreVocab: VocabCard[] = [
  // ─── Sport & Champions ───────────────────────────────
  { id: "1", it: "il fuoriclasse", en: "the champion / outstanding person", ex: "Messi è un fuoriclasse assoluto.", tag: "sport", level: "B1" },
  { id: "2", it: "la determinazione", en: "determination", ex: "Senza determinazione non si arriva da nessuna parte.", tag: "sport", level: "B1" },
  { id: "3", it: "il talento naturale", en: "natural talent", ex: "Il talento naturale non basta, serve anche lavoro.", tag: "sport", level: "B1" },
  { id: "4", it: "la disciplina", en: "discipline", ex: "La disciplina è la chiave del successo.", tag: "sport", level: "A2" },
  { id: "5", it: "superare i propri limiti", en: "to exceed one's limits", ex: "Ogni atleta deve superare i propri limiti.", tag: "sport", level: "B1" },
  { id: "6", it: "la costanza", en: "consistency / perseverance", ex: "La costanza fa la differenza nel lungo termine.", tag: "sport", level: "B1" },
  { id: "7", it: "il sacrificio", en: "sacrifice", ex: "Ci vogliono molti sacrifici per diventare campioni.", tag: "sport", level: "A2" },
  { id: "8", it: "la mentalità vincente", en: "winning mentality", ex: "Serve una mentalità vincente per competere.", tag: "sport", level: "B1" },
  { id: "9", it: "allenarsi duramente", en: "to train hard", ex: "Si allena duramente ogni giorno.", tag: "sport", level: "A2" },
  { id: "10", it: "raggiungere un obiettivo", en: "to achieve a goal", ex: "Ha raggiunto il suo obiettivo dopo anni di lavoro.", tag: "sport", level: "B1" },
  { id: "11", it: "avere la stoffa", en: "to have what it takes", ex: "Quel ragazzo ha la stoffa del campione.", tag: "sport", level: "B2" },
  { id: "12", it: "fare il salto di qualità", en: "to level up", ex: "Quest'anno ha fatto il salto di qualità.", tag: "sport", level: "B2" },

  // ─── Daily Routines ──────────────────────────────────
  { id: "13", it: "svegliarsi presto", en: "to wake up early", ex: "Mi sveglio presto ogni mattina.", tag: "routine", level: "A1" },
  { id: "14", it: "fare colazione", en: "to have breakfast", ex: "Faccio colazione alle sette.", tag: "routine", level: "A1" },
  { id: "15", it: "la routine mattutina", en: "morning routine", ex: "La mia routine mattutina è molto semplice.", tag: "routine", level: "A2" },
  { id: "16", it: "andare in palestra", en: "to go to the gym", ex: "Vado in palestra tre volte a settimana.", tag: "routine", level: "A1" },
  { id: "17", it: "fare la spesa", en: "to do grocery shopping", ex: "Faccio la spesa al supermercato.", tag: "routine", level: "A1" },
  { id: "18", it: "rilassarsi la sera", en: "to relax in the evening", ex: "Mi rilasso la sera guardando un film.", tag: "routine", level: "A2" },
  { id: "19", it: "l'abitudine quotidiana", en: "daily habit", ex: "Leggere è la mia abitudine quotidiana.", tag: "routine", level: "A2" },
  { id: "20", it: "organizzare la giornata", en: "to organize the day", ex: "Organizzo la giornata la mattina presto.", tag: "routine", level: "A2" },

  // ─── Fitness & Health ────────────────────────────────
  { id: "21", it: "l'allenamento", en: "training/workout", ex: "L'allenamento di oggi è stato intenso.", tag: "fitness", level: "A2" },
  { id: "22", it: "il recupero muscolare", en: "muscle recovery", ex: "Il recupero muscolare è fondamentale.", tag: "fitness", level: "B1" },
  { id: "23", it: "fare stretching", en: "to stretch", ex: "Faccio stretching dopo ogni allenamento.", tag: "fitness", level: "A2" },
  { id: "24", it: "la resistenza fisica", en: "physical endurance", ex: "La resistenza fisica migliora con il tempo.", tag: "fitness", level: "B1" },
  { id: "25", it: "mangiare sano", en: "to eat healthy", ex: "Cerco di mangiare sano ogni giorno.", tag: "fitness", level: "A1" },
  { id: "26", it: "il riposo attivo", en: "active rest", ex: "Il riposo attivo aiuta il recupero.", tag: "fitness", level: "B1" },
  { id: "27", it: "allenarsi regolarmente", en: "to train regularly", ex: "Mi alleno regolarmente durante la settimana.", tag: "fitness", level: "A2" },
  { id: "28", it: "il benessere fisico", en: "physical well-being", ex: "Il benessere fisico è importante per la salute.", tag: "fitness", level: "A2" },

  // ─── Work & Productivity ─────────────────────────────
  { id: "29", it: "la scadenza", en: "the deadline", ex: "La scadenza del progetto è domani.", tag: "work", level: "A2" },
  { id: "30", it: "lavorare da remoto", en: "to work remotely", ex: "Lavoro da remoto da due anni.", tag: "work", level: "A2" },
  { id: "31", it: "gestire il tempo", en: "to manage time", ex: "Bisogna imparare a gestire il tempo.", tag: "work", level: "A2" },
  { id: "32", it: "essere produttivo", en: "to be productive", ex: "Sono più produttivo la mattina.", tag: "work", level: "A2" },
  { id: "33", it: "risolvere un problema", en: "to solve a problem", ex: "Dobbiamo risolvere questo problema insieme.", tag: "work", level: "A2" },
  { id: "34", it: "il flusso di lavoro", en: "the workflow", ex: "Il flusso di lavoro è molto efficiente.", tag: "work", level: "B1" },
  { id: "35", it: "prendere appunti", en: "to take notes", ex: "Prendo appunti durante le riunioni.", tag: "work", level: "A2" },
  { id: "36", it: "il progetto in corso", en: "ongoing project", ex: "Il progetto in corso va molto bene.", tag: "work", level: "A2" },

  // ─── Connectors & Conversation ───────────────────────
  { id: "37", it: "comunque", en: "anyway / however", ex: "Comunque, non è un problema.", tag: "connectors", level: "B1" },
  { id: "38", it: "infatti", en: "in fact / indeed", ex: "Infatti, hai ragione.", tag: "connectors", level: "A2" },
  { id: "39", it: "piuttosto", en: "rather / quite", ex: "È piuttosto difficile da spiegare.", tag: "connectors", level: "B1" },
  { id: "40", it: "insomma", en: "in short / basically", ex: "Insomma, non mi è piaciuto.", tag: "connectors", level: "B1" },
  { id: "41", it: "anzi", en: "on the contrary / actually", ex: "Non è facile, anzi è molto difficile.", tag: "connectors", level: "B1" },
  { id: "42", it: "magari", en: "maybe / I wish", ex: "Magari potremmo andare al cinema stasera.", tag: "connectors", level: "B1" },
  { id: "43", it: "eppure", en: "and yet / still", ex: "Ha studiato tanto, eppure non ha passato l'esame.", tag: "connectors", level: "B1" },
  { id: "44", it: "siccome", en: "since / given that", ex: "Siccome piove, restiamo a casa.", tag: "connectors", level: "B1" },
  { id: "45", it: "nonostante", en: "despite / in spite of", ex: "Nonostante la pioggia, siamo usciti.", tag: "connectors", level: "B1" },
  { id: "46", it: "a proposito", en: "by the way", ex: "A proposito, hai visto il nuovo film?", tag: "connectors", level: "A2" },

  // ─── Opinions & Feelings ─────────────────────────────
  { id: "47", it: "mi sembra che", en: "it seems to me that", ex: "Mi sembra che tu abbia ragione.", tag: "opinions", level: "B1" },
  { id: "48", it: "secondo me", en: "in my opinion", ex: "Secondo me, è la scelta giusta.", tag: "opinions", level: "A2" },
  { id: "49", it: "non ne sono sicuro", en: "I'm not sure about it", ex: "Non ne sono sicuro, devo controllare.", tag: "opinions", level: "A2" },
  { id: "50", it: "vale la pena", en: "it's worth it", ex: "Vale la pena provare.", tag: "opinions", level: "B1" },
  { id: "51", it: "non vedo l'ora", en: "I can't wait", ex: "Non vedo l'ora di andare in vacanza.", tag: "opinions", level: "A2" },
  { id: "52", it: "mi dà fastidio", en: "it bothers me", ex: "Mi dà fastidio il rumore.", tag: "opinions", level: "B1" },
  { id: "53", it: "sono d'accordo", en: "I agree", ex: "Sono d'accordo con te.", tag: "opinions", level: "A1" },
  { id: "54", it: "non è un granché", en: "it's nothing special", ex: "Il ristorante non è un granché.", tag: "opinions", level: "B1" },
  { id: "55", it: "avere voglia di", en: "to feel like (doing sth)", ex: "Ho voglia di un gelato.", tag: "opinions", level: "A2" },
  { id: "56", it: "mi fa piacere", en: "it pleases me / I'm glad", ex: "Mi fa piacere sentirti.", tag: "opinions", level: "A2" },

  // ─── Food & Restaurant ───────────────────────────────
  { id: "57", it: "prenotare un tavolo", en: "to book a table", ex: "Vorrei prenotare un tavolo per due.", tag: "food", level: "A1" },
  { id: "58", it: "il conto", en: "the bill", ex: "Scusi, il conto per favore.", tag: "food", level: "A1" },
  { id: "59", it: "il piatto del giorno", en: "dish of the day", ex: "Qual è il piatto del giorno?", tag: "food", level: "A2" },
  { id: "60", it: "assaggiare", en: "to taste / to try", ex: "Vuoi assaggiare il mio tiramisù?", tag: "food", level: "A2" },
  { id: "61", it: "un bicchiere di vino", en: "a glass of wine", ex: "Prendo un bicchiere di vino rosso.", tag: "food", level: "A1" },
  { id: "62", it: "il primo / il secondo", en: "first / second course", ex: "Come primo prendo la pasta e come secondo il pesce.", tag: "food", level: "A2" },
  { id: "63", it: "avere fame / sete", en: "to be hungry / thirsty", ex: "Ho fame, andiamo a mangiare?", tag: "food", level: "A1" },
  { id: "64", it: "la ricetta", en: "the recipe", ex: "Mi puoi dare la ricetta?", tag: "food", level: "A1" },

  // ─── Travel & City ───────────────────────────────────
  { id: "65", it: "fare un giro", en: "to take a walk / tour", ex: "Facciamo un giro per il centro.", tag: "travel", level: "A1" },
  { id: "66", it: "perdersi", en: "to get lost", ex: "Mi sono perso nelle stradine.", tag: "travel", level: "A2" },
  { id: "67", it: "il quartiere", en: "the neighborhood", ex: "Abito in un quartiere tranquillo.", tag: "travel", level: "A2" },
  { id: "68", it: "prendere il treno", en: "to take the train", ex: "Devo prendere il treno delle otto.", tag: "travel", level: "A1" },
  { id: "69", it: "il biglietto di andata e ritorno", en: "round-trip ticket", ex: "Un biglietto di andata e ritorno per Roma, per favore.", tag: "travel", level: "A2" },
  { id: "70", it: "godersi il viaggio", en: "to enjoy the trip", ex: "Bisogna godersi il viaggio.", tag: "travel", level: "A2" },
  { id: "71", it: "la meta", en: "the destination", ex: "Qual è la meta delle vacanze?", tag: "travel", level: "A2" },
  { id: "72", it: "fare le valigie", en: "to pack the suitcases", ex: "Devo ancora fare le valigie.", tag: "travel", level: "A2" },

  // ─── Verbs & Grammar Patterns ────────────────────────
  { id: "73", it: "stare per + infinito", en: "to be about to", ex: "Sto per uscire.", tag: "grammar", level: "B1" },
  { id: "74", it: "farcela", en: "to manage / to make it", ex: "Ce la faccio, non ti preoccupare.", tag: "grammar", level: "B1" },
  { id: "75", it: "andarsene", en: "to leave / to go away", ex: "Me ne vado, è tardi.", tag: "grammar", level: "B1" },
  { id: "76", it: "metterci", en: "to take (time)", ex: "Ci metto mezz'ora per arrivare.", tag: "grammar", level: "B1" },
  { id: "77", it: "volerci", en: "to take / to need (impersonal)", ex: "Ci vogliono due ore per arrivare.", tag: "grammar", level: "B1" },
  { id: "78", it: "cavarsela", en: "to manage / to get by", ex: "Me la cavo bene con l'italiano.", tag: "grammar", level: "B1" },
  { id: "79", it: "rendersene conto", en: "to realize", ex: "Non me ne sono reso conto.", tag: "grammar", level: "B1" },
  { id: "80", it: "averne abbastanza", en: "to have had enough", ex: "Ne ho abbastanza di questo traffico.", tag: "grammar", level: "B1" },

  // ─── Idiomatic Expressions ───────────────────────────
  { id: "81", it: "in bocca al lupo", en: "good luck (lit: in the wolf's mouth)", ex: "Domani hai l'esame? In bocca al lupo!", tag: "idioms", level: "A2" },
  { id: "82", it: "non c'entra niente", en: "it has nothing to do with it", ex: "Questo non c'entra niente con il problema.", tag: "idioms", level: "B1" },
  { id: "83", it: "avere un sacco di", en: "to have a lot of", ex: "Ho un sacco di cose da fare.", tag: "idioms", level: "A2" },
  { id: "84", it: "che figata!", en: "how cool! (informal)", ex: "Hai comprato la moto? Che figata!", tag: "idioms", level: "B1" },
  { id: "85", it: "dai!", en: "come on! / go on!", ex: "Dai, non essere timido.", tag: "idioms", level: "A1" },
  { id: "86", it: "boh", en: "I dunno / who knows", ex: "Dove vuoi andare? Boh, non lo so.", tag: "idioms", level: "A1" },
  { id: "87", it: "figurati", en: "don't mention it / imagine that", ex: "Grazie! — Figurati, è stato un piacere.", tag: "idioms", level: "A2" },
  { id: "88", it: "che palle!", en: "what a pain! (informal)", ex: "Ancora pioggia? Che palle!", tag: "idioms", level: "B1" },
  { id: "89", it: "fare bella figura", en: "to make a good impression", ex: "In Italia è importante fare bella figura.", tag: "idioms", level: "B1" },
  { id: "90", it: "tirare avanti", en: "to get by / to keep going", ex: "Si tira avanti, giorno dopo giorno.", tag: "idioms", level: "B1" },

  // ─── Finance & Trading ───────────────────────────────
  { id: "91", it: "il rendimento", en: "the return / yield", ex: "Il rendimento del portafoglio è stato buono.", tag: "finance", level: "B2" },
  { id: "92", it: "il mercato azionario", en: "the stock market", ex: "Il mercato azionario è volatile oggi.", tag: "finance", level: "B2" },
  { id: "93", it: "investire", en: "to invest", ex: "Preferisco investire a lungo termine.", tag: "finance", level: "B1" },
  { id: "94", it: "il rischio", en: "risk", ex: "Bisogna sempre calcolare il rischio.", tag: "finance", level: "A2" },
  { id: "95", it: "il tasso di interesse", en: "interest rate", ex: "La BCE ha alzato il tasso di interesse.", tag: "finance", level: "B2" },
  { id: "96", it: "il portafoglio", en: "the portfolio / wallet", ex: "Ho diversificato il portafoglio.", tag: "finance", level: "B1" },

  // ─── Tech & Digital ──────────────────────────────────
  { id: "97", it: "l'intelligenza artificiale", en: "artificial intelligence", ex: "L'intelligenza artificiale sta cambiando tutto.", tag: "tech", level: "B1" },
  { id: "98", it: "il codice sorgente", en: "source code", ex: "Ho scritto il codice sorgente in Python.", tag: "tech", level: "B2" },
  { id: "99", it: "l'aggiornamento", en: "the update", ex: "C'è un nuovo aggiornamento disponibile.", tag: "tech", level: "A2" },
  { id: "100", it: "scaricare", en: "to download", ex: "Devo scaricare l'applicazione.", tag: "tech", level: "A2" },
];

export const vocab: VocabCard[] = [...coreVocab, ...extendedVocab];
