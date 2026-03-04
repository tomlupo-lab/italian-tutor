import { mutation } from "./_generated/server";
import { v } from "convex/values";

// All vocab data inline to avoid importing from src/
const allVocab = [
  // ─── Sport & Champions
  { it: "il fuoriclasse", en: "the champion / outstanding person", example: "Messi è un fuoriclasse assoluto.", tag: "sport", level: "B1" },
  { it: "la determinazione", en: "determination", example: "Senza determinazione non si arriva da nessuna parte.", tag: "sport", level: "B1" },
  { it: "il talento naturale", en: "natural talent", example: "Il talento naturale non basta, serve anche lavoro.", tag: "sport", level: "B1" },
  { it: "la disciplina", en: "discipline", example: "La disciplina è la chiave del successo.", tag: "sport", level: "B1" },
  { it: "superare i propri limiti", en: "to exceed one's limits", example: "Ogni atleta deve superare i propri limiti.", tag: "sport", level: "B1" },
  { it: "la costanza", en: "consistency / perseverance", example: "La costanza fa la differenza nel lungo termine.", tag: "sport", level: "B1" },
  { it: "il sacrificio", en: "sacrifice", example: "Ci vogliono molti sacrifici per diventare campioni.", tag: "sport", level: "B1" },
  { it: "la mentalità vincente", en: "winning mentality", example: "Serve una mentalità vincente per competere.", tag: "sport", level: "B1" },
  { it: "allenarsi duramente", en: "to train hard", example: "Si allena duramente ogni giorno.", tag: "sport", level: "B1" },
  { it: "raggiungere un obiettivo", en: "to achieve a goal", example: "Ha raggiunto il suo obiettivo dopo anni di lavoro.", tag: "sport", level: "B1" },
  { it: "avere la stoffa", en: "to have what it takes", example: "Quel ragazzo ha la stoffa del campione.", tag: "sport", level: "B1" },
  { it: "fare il salto di qualità", en: "to level up", example: "Quest'anno ha fatto il salto di qualità.", tag: "sport", level: "B1" },
  // ─── Daily Routines
  { it: "svegliarsi presto", en: "to wake up early", example: "Mi sveglio presto ogni mattina.", tag: "routine", level: "A2" },
  { it: "fare colazione", en: "to have breakfast", example: "Faccio colazione alle sette.", tag: "routine", level: "A2" },
  { it: "la routine mattutina", en: "morning routine", example: "La mia routine mattutina è molto semplice.", tag: "routine", level: "A2" },
  { it: "andare in palestra", en: "to go to the gym", example: "Vado in palestra tre volte a settimana.", tag: "routine", level: "A2" },
  { it: "fare la spesa", en: "to do grocery shopping", example: "Faccio la spesa al supermercato.", tag: "routine", level: "A2" },
  { it: "rilassarsi la sera", en: "to relax in the evening", example: "Mi rilasso la sera guardando un film.", tag: "routine", level: "A2" },
  { it: "l'abitudine quotidiana", en: "daily habit", example: "Leggere è la mia abitudine quotidiana.", tag: "routine", level: "A2" },
  { it: "organizzare la giornata", en: "to organize the day", example: "Organizzo la giornata la mattina presto.", tag: "routine", level: "A2" },
  // ─── Fitness & Health
  { it: "l'allenamento", en: "training/workout", example: "L'allenamento di oggi è stato intenso.", tag: "fitness", level: "B1" },
  { it: "il recupero muscolare", en: "muscle recovery", example: "Il recupero muscolare è fondamentale.", tag: "fitness", level: "B1" },
  { it: "fare stretching", en: "to stretch", example: "Faccio stretching dopo ogni allenamento.", tag: "fitness", level: "B1" },
  { it: "la resistenza fisica", en: "physical endurance", example: "La resistenza fisica migliora con il tempo.", tag: "fitness", level: "B1" },
  { it: "mangiare sano", en: "to eat healthy", example: "Cerco di mangiare sano ogni giorno.", tag: "fitness", level: "B1" },
  { it: "il riposo attivo", en: "active rest", example: "Il riposo attivo aiuta il recupero.", tag: "fitness", level: "B1" },
  { it: "allenarsi regolarmente", en: "to train regularly", example: "Mi alleno regolarmente durante la settimana.", tag: "fitness", level: "B1" },
  { it: "il benessere fisico", en: "physical well-being", example: "Il benessere fisico è importante per la salute.", tag: "fitness", level: "B1" },
  // ─── Work & Productivity
  { it: "la scadenza", en: "the deadline", example: "La scadenza del progetto è domani.", tag: "work", level: "B1" },
  { it: "lavorare da remoto", en: "to work remotely", example: "Lavoro da remoto da due anni.", tag: "work", level: "B1" },
  { it: "gestire il tempo", en: "to manage time", example: "Bisogna imparare a gestire il tempo.", tag: "work", level: "B1" },
  { it: "essere produttivo", en: "to be productive", example: "Sono più produttivo la mattina.", tag: "work", level: "B1" },
  { it: "risolvere un problema", en: "to solve a problem", example: "Dobbiamo risolvere questo problema insieme.", tag: "work", level: "B1" },
  { it: "il flusso di lavoro", en: "the workflow", example: "Il flusso di lavoro è molto efficiente.", tag: "work", level: "B1" },
  { it: "prendere appunti", en: "to take notes", example: "Prendo appunti durante le riunioni.", tag: "work", level: "B1" },
  { it: "il progetto in corso", en: "ongoing project", example: "Il progetto in corso va molto bene.", tag: "work", level: "B1" },
  // ─── Connectors & Conversation
  { it: "comunque", en: "anyway / however", example: "Comunque, non è un problema.", tag: "connectors", level: "B2" },
  { it: "infatti", en: "in fact / indeed", example: "Infatti, hai ragione.", tag: "connectors", level: "B2" },
  { it: "piuttosto", en: "rather / quite", example: "È piuttosto difficile da spiegare.", tag: "connectors", level: "B2" },
  { it: "insomma", en: "in short / basically", example: "Insomma, non mi è piaciuto.", tag: "connectors", level: "B2" },
  { it: "anzi", en: "on the contrary / actually", example: "Non è facile, anzi è molto difficile.", tag: "connectors", level: "B2" },
  { it: "magari", en: "maybe / I wish", example: "Magari potremmo andare al cinema stasera.", tag: "connectors", level: "B2" },
  { it: "eppure", en: "and yet / still", example: "Ha studiato tanto, eppure non ha passato l'esame.", tag: "connectors", level: "B2" },
  { it: "siccome", en: "since / given that", example: "Siccome piove, restiamo a casa.", tag: "connectors", level: "B2" },
  { it: "nonostante", en: "despite / in spite of", example: "Nonostante la pioggia, siamo usciti.", tag: "connectors", level: "B2" },
  { it: "a proposito", en: "by the way", example: "A proposito, hai visto il nuovo film?", tag: "connectors", level: "B2" },
  // ─── Opinions & Feelings
  { it: "mi sembra che", en: "it seems to me that", example: "Mi sembra che tu abbia ragione.", tag: "opinions", level: "B2" },
  { it: "secondo me", en: "in my opinion", example: "Secondo me, è la scelta giusta.", tag: "opinions", level: "B2" },
  { it: "non ne sono sicuro", en: "I'm not sure about it", example: "Non ne sono sicuro, devo controllare.", tag: "opinions", level: "B2" },
  { it: "vale la pena", en: "it's worth it", example: "Vale la pena provare.", tag: "opinions", level: "B2" },
  { it: "non vedo l'ora", en: "I can't wait", example: "Non vedo l'ora di andare in vacanza.", tag: "opinions", level: "B2" },
  { it: "mi dà fastidio", en: "it bothers me", example: "Mi dà fastidio il rumore.", tag: "opinions", level: "B2" },
  { it: "sono d'accordo", en: "I agree", example: "Sono d'accordo con te.", tag: "opinions", level: "B2" },
  { it: "non è un granché", en: "it's nothing special", example: "Il ristorante non è un granché.", tag: "opinions", level: "B2" },
  { it: "avere voglia di", en: "to feel like (doing sth)", example: "Ho voglia di un gelato.", tag: "opinions", level: "B2" },
  { it: "mi fa piacere", en: "it pleases me / I'm glad", example: "Mi fa piacere sentirti.", tag: "opinions", level: "B2" },
  // ─── Food & Restaurant
  { it: "prenotare un tavolo", en: "to book a table", example: "Vorrei prenotare un tavolo per due.", tag: "food", level: "A2" },
  { it: "il conto", en: "the bill", example: "Scusi, il conto per favore.", tag: "food", level: "A2" },
  { it: "il piatto del giorno", en: "dish of the day", example: "Qual è il piatto del giorno?", tag: "food", level: "A2" },
  { it: "assaggiare", en: "to taste / to try", example: "Vuoi assaggiare il mio tiramisù?", tag: "food", level: "A2" },
  { it: "un bicchiere di vino", en: "a glass of wine", example: "Prendo un bicchiere di vino rosso.", tag: "food", level: "A2" },
  { it: "il primo / il secondo", en: "first / second course", example: "Come primo prendo la pasta e come secondo il pesce.", tag: "food", level: "A2" },
  { it: "avere fame / sete", en: "to be hungry / thirsty", example: "Ho fame, andiamo a mangiare?", tag: "food", level: "A2" },
  { it: "la ricetta", en: "the recipe", example: "Mi puoi dare la ricetta?", tag: "food", level: "A2" },
  // ─── Travel & City
  { it: "fare un giro", en: "to take a walk / tour", example: "Facciamo un giro per il centro.", tag: "travel", level: "B1" },
  { it: "perdersi", en: "to get lost", example: "Mi sono perso nelle stradine.", tag: "travel", level: "B1" },
  { it: "il quartiere", en: "the neighborhood", example: "Abito in un quartiere tranquillo.", tag: "travel", level: "B1" },
  { it: "prendere il treno", en: "to take the train", example: "Devo prendere il treno delle otto.", tag: "travel", level: "B1" },
  { it: "il biglietto di andata e ritorno", en: "round-trip ticket", example: "Un biglietto di andata e ritorno per Roma, per favore.", tag: "travel", level: "B1" },
  { it: "godersi il viaggio", en: "to enjoy the trip", example: "Bisogna godersi il viaggio.", tag: "travel", level: "B1" },
  { it: "la meta", en: "the destination", example: "Qual è la meta delle vacanze?", tag: "travel", level: "B1" },
  { it: "fare le valigie", en: "to pack the suitcases", example: "Devo ancora fare le valigie.", tag: "travel", level: "B1" },
  // ─── Verbs & Grammar Patterns
  { it: "stare per + infinito", en: "to be about to", example: "Sto per uscire.", tag: "grammar", level: "B2" },
  { it: "farcela", en: "to manage / to make it", example: "Ce la faccio, non ti preoccupare.", tag: "grammar", level: "B2" },
  { it: "andarsene", en: "to leave / to go away", example: "Me ne vado, è tardi.", tag: "grammar", level: "B2" },
  { it: "metterci", en: "to take (time)", example: "Ci metto mezz'ora per arrivare.", tag: "grammar", level: "B2" },
  { it: "volerci", en: "to take / to need (impersonal)", example: "Ci vogliono due ore per arrivare.", tag: "grammar", level: "B2" },
  { it: "cavarsela", en: "to manage / to get by", example: "Me la cavo bene con l'italiano.", tag: "grammar", level: "B2" },
  { it: "rendersene conto", en: "to realize", example: "Non me ne sono reso conto.", tag: "grammar", level: "B2" },
  { it: "averne abbastanza", en: "to have had enough", example: "Ne ho abbastanza di questo traffico.", tag: "grammar", level: "B2" },
  // ─── Idiomatic Expressions
  { it: "in bocca al lupo", en: "good luck (lit: in the wolf's mouth)", example: "Domani hai l'esame? In bocca al lupo!", tag: "idioms", level: "B2" },
  { it: "non c'entra niente", en: "it has nothing to do with it", example: "Questo non c'entra niente con il problema.", tag: "idioms", level: "B2" },
  { it: "avere un sacco di", en: "to have a lot of", example: "Ho un sacco di cose da fare.", tag: "idioms", level: "B2" },
  { it: "che figata!", en: "how cool! (informal)", example: "Hai comprato la moto? Che figata!", tag: "idioms", level: "B2" },
  { it: "dai!", en: "come on! / go on!", example: "Dai, non essere timido.", tag: "idioms", level: "B2" },
  { it: "boh", en: "I dunno / who knows", example: "Dove vuoi andare? Boh, non lo so.", tag: "idioms", level: "B2" },
  { it: "figurati", en: "don't mention it / imagine that", example: "Grazie! — Figurati, è stato un piacere.", tag: "idioms", level: "B2" },
  { it: "che palle!", en: "what a pain! (informal)", example: "Ancora pioggia? Che palle!", tag: "idioms", level: "B2" },
  { it: "fare bella figura", en: "to make a good impression", example: "In Italia è importante fare bella figura.", tag: "idioms", level: "B2" },
  { it: "tirare avanti", en: "to get by / to keep going", example: "Si tira avanti, giorno dopo giorno.", tag: "idioms", level: "B2" },
  // ─── Finance & Trading
  { it: "il rendimento", en: "the return / yield", example: "Il rendimento del portafoglio è stato buono.", tag: "finance", level: "B2" },
  { it: "il mercato azionario", en: "the stock market", example: "Il mercato azionario è volatile oggi.", tag: "finance", level: "B2" },
  { it: "investire", en: "to invest", example: "Preferisco investire a lungo termine.", tag: "finance", level: "B2" },
  { it: "il rischio", en: "risk", example: "Bisogna sempre calcolare il rischio.", tag: "finance", level: "B2" },
  { it: "il tasso di interesse", en: "interest rate", example: "La BCE ha alzato il tasso di interesse.", tag: "finance", level: "B2" },
  { it: "il portafoglio", en: "the portfolio / wallet", example: "Ho diversificato il portafoglio.", tag: "finance", level: "B2" },
  // ─── Tech & Digital
  { it: "l'intelligenza artificiale", en: "artificial intelligence", example: "L'intelligenza artificiale sta cambiando tutto.", tag: "tech", level: "B1" },
  { it: "il codice sorgente", en: "source code", example: "Ho scritto il codice sorgente in Python.", tag: "tech", level: "B1" },
  { it: "l'aggiornamento", en: "the update", example: "C'è un nuovo aggiornamento disponibile.", tag: "tech", level: "B1" },
  { it: "scaricare", en: "to download", example: "Devo scaricare l'applicazione.", tag: "tech", level: "B1" },
  // ─── Emotions & Relationships (extended)
  { it: "innamorarsi", en: "to fall in love", example: "Mi sono innamorato al primo sguardo.", tag: "emotions", level: "B1" },
  { it: "litigare", en: "to argue / to quarrel", example: "Non mi piace litigare per niente.", tag: "emotions", level: "B1" },
  { it: "fare pace", en: "to make up / to reconcile", example: "Dopo la discussione abbiamo fatto pace.", tag: "emotions", level: "B1" },
  { it: "essere geloso", en: "to be jealous", example: "Non essere geloso, è solo un amico.", tag: "emotions", level: "B1" },
  { it: "fidarsi di", en: "to trust (someone)", example: "Mi fido di te completamente.", tag: "emotions", level: "B1" },
  { it: "tradire", en: "to betray / to cheat on", example: "Non potrei mai tradire la fiducia di qualcuno.", tag: "emotions", level: "B1" },
  { it: "il/la partner", en: "the partner", example: "Il mio partner è molto comprensivo.", tag: "emotions", level: "B1" },
  { it: "la coppia", en: "the couple", example: "Sono una coppia molto affiatata.", tag: "emotions", level: "B1" },
  { it: "andare d'accordo", en: "to get along", example: "Andiamo d'accordo su tutto.", tag: "emotions", level: "B1" },
  { it: "il rapporto", en: "the relationship", example: "Il nostro rapporto è migliorato molto.", tag: "emotions", level: "B1" },
  { it: "sentirsi solo/a", en: "to feel lonely", example: "A volte mi sento solo la sera.", tag: "emotions", level: "B1" },
  { it: "preoccuparsi", en: "to worry", example: "Non preoccuparti, andrà tutto bene.", tag: "emotions", level: "B1" },
  { it: "vergognarsi", en: "to be ashamed / embarrassed", example: "Mi vergogno di quello che ho detto.", tag: "emotions", level: "B1" },
  { it: "arrabbiarsi", en: "to get angry", example: "Mi arrabbio quando le cose non funzionano.", tag: "emotions", level: "B1" },
  { it: "commuoversi", en: "to be moved (emotionally)", example: "Mi sono commosso guardando quel film.", tag: "emotions", level: "B1" },
  // ─── Shopping & Errands
  { it: "lo scontrino", en: "the receipt", example: "Hai tenuto lo scontrino?", tag: "shopping", level: "A2" },
  { it: "il camerino", en: "the fitting room", example: "Posso provare questa maglia in camerino?", tag: "shopping", level: "A2" },
  { it: "la taglia", en: "the size (clothing)", example: "Che taglia porti?", tag: "shopping", level: "A2" },
  { it: "provare", en: "to try on", example: "Vorrei provare queste scarpe.", tag: "shopping", level: "A2" },
  { it: "il reso", en: "the return (of goods)", example: "Vorrei fare un reso, il prodotto è difettoso.", tag: "shopping", level: "A2" },
  { it: "fare la fila", en: "to stand in line / to queue", example: "Ho fatto la fila per mezz'ora.", tag: "shopping", level: "A2" },
  { it: "il centro commerciale", en: "the shopping mall", example: "Andiamo al centro commerciale sabato?", tag: "shopping", level: "A2" },
  { it: "lo sconto", en: "the discount", example: "C'è uno sconto del venti per cento.", tag: "shopping", level: "A2" },
  { it: "il prezzo", en: "the price", example: "Il prezzo mi sembra un po' alto.", tag: "shopping", level: "A2" },
  { it: "il contante", en: "cash", example: "Preferisco pagare in contante.", tag: "shopping", level: "A2" },
  { it: "la carta di credito", en: "the credit card", example: "Accettate la carta di credito?", tag: "shopping", level: "A2" },
  { it: "pagare alla cassa", en: "to pay at the register", example: "Puoi pagare alla cassa laggiù.", tag: "shopping", level: "A2" },
  // ─── Home & Living
  { it: "traslocare", en: "to move (house)", example: "Trasloco il mese prossimo.", tag: "home", level: "A2" },
  { it: "l'affitto", en: "the rent", example: "L'affitto è aumentato quest'anno.", tag: "home", level: "A2" },
  { it: "il coinquilino", en: "the roommate", example: "Il mio coinquilino è molto ordinato.", tag: "home", level: "A2" },
  { it: "i lavori di casa", en: "housework", example: "Ci dividiamo i lavori di casa.", tag: "home", level: "A2" },
  { it: "fare il bucato", en: "to do the laundry", example: "Devo fare il bucato oggi.", tag: "home", level: "A2" },
  { it: "stirare", en: "to iron", example: "Odio stirare le camicie.", tag: "home", level: "A2" },
  { it: "passare l'aspirapolvere", en: "to vacuum", example: "Passo l'aspirapolvere due volte a settimana.", tag: "home", level: "A2" },
  { it: "il piano", en: "the floor (of a building)", example: "Abito al terzo piano.", tag: "home", level: "A2" },
  { it: "le bollette", en: "the bills (utilities)", example: "Le bollette sono arrivate ieri.", tag: "home", level: "A2" },
  { it: "arredare", en: "to furnish / to decorate", example: "Ho arredato il salotto in stile moderno.", tag: "home", level: "A2" },
  { it: "il quartiere", en: "the neighborhood", example: "Il mio quartiere è molto tranquillo.", tag: "home", level: "A2" },
  { it: "il vicino di casa", en: "the neighbor", example: "Il vicino di casa è molto gentile.", tag: "home", level: "A2" },
  // ─── Weather & Nature
  { it: "il temporale", en: "the thunderstorm", example: "Sta arrivando un temporale.", tag: "weather", level: "B1" },
  { it: "la grandine", en: "the hail", example: "La grandine ha danneggiato le macchine.", tag: "weather", level: "B1" },
  { it: "nevicare", en: "to snow", example: "Ha nevicato tutta la notte.", tag: "weather", level: "B1" },
  { it: "il vento forte", en: "strong wind", example: "Oggi c'è un vento forte incredibile.", tag: "weather", level: "B1" },
  { it: "l'afa", en: "the muggy heat / humidity", example: "Non sopporto l'afa estiva.", tag: "weather", level: "B1" },
  { it: "umido", en: "humid / damp", example: "Il clima qui è molto umido.", tag: "weather", level: "B1" },
  { it: "sereno", en: "clear (sky)", example: "Domani sarà sereno tutto il giorno.", tag: "weather", level: "B1" },
  { it: "nuvoloso", en: "cloudy", example: "Il cielo è nuvoloso ma non piove.", tag: "weather", level: "B1" },
  { it: "la previsione del tempo", en: "the weather forecast", example: "Hai visto la previsione del tempo?", tag: "weather", level: "B1" },
  { it: "il tramonto", en: "the sunset", example: "Il tramonto sul mare è bellissimo.", tag: "weather", level: "B1" },
  // ─── Social Life
  { it: "fare un aperitivo", en: "to have an aperitivo", example: "Facciamo un aperitivo dopo il lavoro?", tag: "social", level: "B1" },
  { it: "brindare", en: "to toast / to clink glasses", example: "Brindiamo al nuovo anno!", tag: "social", level: "B1" },
  { it: "organizzare una festa", en: "to organize a party", example: "Voglio organizzare una festa per il mio compleanno.", tag: "social", level: "B1" },
  { it: "invitare", en: "to invite", example: "Ti invito a cena sabato sera.", tag: "social", level: "B1" },
  { it: "rifiutare un invito", en: "to decline an invitation", example: "Mi dispiace, devo rifiutare l'invito.", tag: "social", level: "B1" },
  { it: "fare tardi", en: "to stay out late", example: "Ieri sera ho fatto tardi.", tag: "social", level: "B1" },
  { it: "annoiarsi", en: "to be bored", example: "Mi annoio quando non ho niente da fare.", tag: "social", level: "B1" },
  { it: "divertirsi", en: "to have fun", example: "Mi sono divertito moltissimo alla festa.", tag: "social", level: "B1" },
  { it: "il passatempo", en: "the hobby / pastime", example: "Il mio passatempo preferito è leggere.", tag: "social", level: "B1" },
  { it: "il pettegolezzo", en: "the gossip", example: "Non mi piacciono i pettegolezzi.", tag: "social", level: "B1" },
  { it: "il gossip", en: "gossip (informal)", example: "Hai sentito l'ultimo gossip?", tag: "social", level: "B1" },
  { it: "fare due chiacchiere", en: "to have a chat", example: "Facciamo due chiacchiere davanti a un caffè.", tag: "social", level: "B1" },
  // ─── Health & Body
  { it: "il mal di testa", en: "the headache", example: "Ho un mal di testa terribile.", tag: "health", level: "A2" },
  { it: "la febbre", en: "the fever", example: "Ho la febbre a trentotto.", tag: "health", level: "A2" },
  { it: "il raffreddore", en: "the cold (illness)", example: "Ho preso un raffreddore.", tag: "health", level: "A2" },
  { it: "la ricetta medica", en: "the prescription", example: "Il dottore mi ha dato la ricetta medica.", tag: "health", level: "A2" },
  { it: "la farmacia", en: "the pharmacy", example: "Devo passare in farmacia.", tag: "health", level: "A2" },
  { it: "lo sciroppo", en: "the syrup (medicine)", example: "Prendo lo sciroppo per la tosse.", tag: "health", level: "A2" },
  { it: "sentirsi male", en: "to feel sick", example: "Mi sento male, forse ho mangiato troppo.", tag: "health", level: "A2" },
  { it: "guarire", en: "to heal / to recover", example: "Ci vuole tempo per guarire.", tag: "health", level: "A2" },
  { it: "il pronto soccorso", en: "the emergency room", example: "Siamo andati al pronto soccorso.", tag: "health", level: "A2" },
  { it: "la visita medica", en: "the medical check-up", example: "Ho una visita medica domani.", tag: "health", level: "A2" },
  { it: "la puntura", en: "the injection / shot", example: "Ho paura delle punture.", tag: "health", level: "A2" },
  { it: "allergico", en: "allergic", example: "Sono allergico al polline.", tag: "health", level: "A2" },
  // ─── Media & Entertainment
  { it: "il telegiornale", en: "the TV news", example: "Guardo il telegiornale ogni sera.", tag: "media", level: "B1" },
  { it: "il documentario", en: "the documentary", example: "Ho visto un documentario interessantissimo.", tag: "media", level: "B1" },
  { it: "la serie tv", en: "the TV series", example: "Sto guardando una nuova serie tv.", tag: "media", level: "B1" },
  { it: "il personaggio", en: "the character", example: "Il personaggio principale è molto complesso.", tag: "media", level: "B1" },
  { it: "la trama", en: "the plot", example: "La trama del film è avvincente.", tag: "media", level: "B1" },
  { it: "il regista", en: "the director (film)", example: "Chi è il regista di questo film?", tag: "media", level: "B1" },
  { it: "lo spettacolo", en: "the show / performance", example: "Lo spettacolo è stato emozionante.", tag: "media", level: "B1" },
  { it: "il palcoscenico", en: "the stage", example: "Gli attori sono saliti sul palcoscenico.", tag: "media", level: "B1" },
  { it: "recitare", en: "to act / to perform", example: "Ha recitato in molti film famosi.", tag: "media", level: "B1" },
  { it: "il concerto", en: "the concert", example: "Andiamo al concerto stasera?", tag: "media", level: "B1" },
  // ─── Bureaucracy & Documents
  { it: "il documento", en: "the document / ID", example: "Ha un documento di identità?", tag: "bureaucracy", level: "B2" },
  { it: "la carta d'identità", en: "the ID card", example: "La mia carta d'identità è scaduta.", tag: "bureaucracy", level: "B2" },
  { it: "il permesso di soggiorno", en: "the residence permit", example: "Devo rinnovare il permesso di soggiorno.", tag: "bureaucracy", level: "B2" },
  { it: "compilare un modulo", en: "to fill out a form", example: "Devi compilare questo modulo.", tag: "bureaucracy", level: "B2" },
  { it: "la firma", en: "the signature", example: "Metta la firma qui in basso.", tag: "bureaucracy", level: "B2" },
  { it: "il timbro", en: "the stamp (official)", example: "Serve il timbro dell'ufficio.", tag: "bureaucracy", level: "B2" },
  { it: "lo sportello", en: "the counter / window (office)", example: "Si rivolga allo sportello numero tre.", tag: "bureaucracy", level: "B2" },
  { it: "la pratica", en: "the paperwork / application", example: "La pratica è ancora in lavorazione.", tag: "bureaucracy", level: "B2" },
  { it: "l'appuntamento", en: "the appointment", example: "Ho preso un appuntamento per domani.", tag: "bureaucracy", level: "B2" },
  { it: "la scadenza del documento", en: "the document expiry date", example: "Controlla la scadenza del documento.", tag: "bureaucracy", level: "B2" },
  // ─── Slang & Informal
  { it: "una fregatura", en: "a rip-off / a scam", example: "Quel negozio è una fregatura!", tag: "slang", level: "B2" },
  { it: "sgamare", en: "to catch / to bust (slang)", example: "Mi hanno sgamato mentre copiavo.", tag: "slang", level: "B2" },
  { it: "beccarsi", en: "to catch / to get (slang)", example: "Mi sono beccato un raffreddore.", tag: "slang", level: "B2" },
  { it: "mollare", en: "to dump / to give up", example: "Ha mollato il lavoro da un giorno all'altro.", tag: "slang", level: "B2" },
  { it: "fregarsene", en: "to not give a damn", example: "Me ne frego di quello che pensano.", tag: "slang", level: "B2" },
  { it: "sbattere", en: "to slam / to bother (slang)", example: "Non mi va di sbattermi per niente.", tag: "slang", level: "B2" },
  { it: "scocciare", en: "to annoy / to bother", example: "Smettila di scocciare, sto lavorando.", tag: "slang", level: "B2" },
  { it: "spaccare", en: "to rock / to crush it (slang)", example: "Quel concerto ha spaccato!", tag: "slang", level: "B2" },
  { it: "scherzare", en: "to joke", example: "Stavo solo scherzando, non arrabbiarti.", tag: "slang", level: "B2" },
  { it: "il casino", en: "the mess / chaos (slang)", example: "Che casino in questa stanza!", tag: "slang", level: "B2" },
];

export const seedCards = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("cards").take(1);
    if (existing.length > 0) {
      return { status: "already_seeded", count: 0 };
    }

    const today = new Date().toISOString().slice(0, 10);
    let count = 0;

    // Convex mutations have size limits, so batch in chunks
    for (const card of allVocab) {
      await ctx.db.insert("cards", {
        it: card.it,
        en: card.en,
        example: card.example,
        tag: card.tag,
        level: card.level,
        source: "builtin" as const,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: today,
      });
      count++;
    }

    return { status: "seeded", count };
  },
});

export const seedCurriculum = mutation({
  args: {
    cards: v.array(
      v.object({
        it: v.string(),
        en: v.string(),
        example: v.string(),
        tag: v.string(),
        level: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);
    let added = 0;
    let skipped = 0;

    for (const card of args.cards) {
      const existing = await ctx.db
        .query("cards")
        .filter((q) => q.eq(q.field("it"), card.it))
        .first();
      if (existing) {
        if (!existing.level && card.level) {
          await ctx.db.patch(existing._id, { level: card.level });
        }
        skipped++;
        continue;
      }

      await ctx.db.insert("cards", {
        it: card.it,
        en: card.en,
        example: card.example,
        tag: card.tag,
        level: card.level,
        source: "builtin" as const,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: today,
      });
      added++;
    }

    return { added, skipped };
  },
});

export const backfillLevels = mutation({
  args: {},
  handler: async (ctx) => {
    const TAG_LEVELS: Record<string, string> = {
      routine: "A2", food: "A2", home: "A2", health: "A2", shopping: "A2",
      weather: "B1", social: "B1", media: "B1", travel: "B1", work: "B1",
      fitness: "B1", sport: "B1", tech: "B1", emotions: "B1",
      connectors: "B2", opinions: "B2", idioms: "B2", grammar: "B2",
      finance: "B2", bureaucracy: "B2", slang: "B2",
    };

    const cards = await ctx.db.query("cards").collect();
    let updated = 0;
    for (const card of cards) {
      if (card.level) continue;
      const level = card.tag ? TAG_LEVELS[card.tag] : undefined;
      if (level) {
        await ctx.db.patch(card._id, { level });
        updated++;
      }
    }
    return { updated };
  },
});
