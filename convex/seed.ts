import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { EXERCISE_TEMPLATES } from "./exerciseTemplatesData";
import {
  A1_AUDIT_EXPANSION,
  A2_AUDIT_EXPANSION,
  B1_AUDIT_EXPANSION,
  MISSION_TOPUP_PATCHES,
  SEED_CARD_INSERTS,
  SEED_CARD_PATCHES,
} from "./cardRemediation";
import { FAST_TRACK_DOCS_SEED_CARDS } from "./fastTrackDocsContent";

// All vocab data inline to avoid importing from src/
const baseVocab = [
  // ─── A1 Foundations: Daily Survival
  { it: "ciao", en: "hi / hello", example: "Ciao, come stai?", tag: "basics", level: "A1" },
  { it: "buongiorno", en: "good morning", example: "Buongiorno, signora.", tag: "basics", level: "A1" },
  { it: "buonasera", en: "good evening", example: "Buonasera, avete un tavolo libero?", tag: "basics", level: "A1" },
  { it: "per favore", en: "please", example: "Un caffè, per favore.", tag: "basics", level: "A1" },
  { it: "grazie mille", en: "thank you very much", example: "Grazie mille per l'aiuto.", tag: "basics", level: "A1" },
  { it: "mi chiamo...", en: "my name is...", example: "Mi chiamo Luca.", tag: "basics", level: "A1" },
  { it: "come ti chiami?", en: "what is your name?", example: "Ciao, come ti chiami?", tag: "basics", level: "A1" },
  { it: "non capisco", en: "I don't understand", example: "Scusi, non capisco.", tag: "basics", level: "A1" },
  { it: "puoi ripetere?", en: "can you repeat?", example: "Puoi ripetere, per favore?", tag: "basics", level: "A1" },
  { it: "parlo un po' di italiano", en: "I speak a little Italian", example: "Parlo un po' di italiano.", tag: "basics", level: "A1" },
  { it: "vorrei", en: "I would like", example: "Vorrei un panino.", tag: "basics", level: "A1" },
  { it: "ho bisogno di aiuto", en: "I need help", example: "Scusi, ho bisogno di aiuto.", tag: "basics", level: "A1" },
  { it: "dov'è il bagno?", en: "where is the bathroom?", example: "Scusi, dov'è il bagno?", tag: "basics", level: "A1" },
  { it: "quanto costa?", en: "how much does it cost?", example: "Quanto costa questo?", tag: "basics", level: "A1" },
  { it: "a destra", en: "to the right", example: "La farmacia è a destra.", tag: "directions", level: "A1" },
  { it: "a sinistra", en: "to the left", example: "La stazione è a sinistra.", tag: "directions", level: "A1" },
  { it: "dritto", en: "straight ahead", example: "Vai sempre dritto.", tag: "directions", level: "A1" },
  { it: "vicino", en: "near", example: "L'hotel è vicino alla stazione.", tag: "directions", level: "A1" },
  { it: "lontano", en: "far", example: "Il supermercato è lontano.", tag: "directions", level: "A1" },
  { it: "la stazione", en: "the station", example: "La stazione è qui vicino.", tag: "directions", level: "A1" },
  { it: "il biglietto", en: "the ticket", example: "Vorrei un biglietto per Firenze.", tag: "travel", level: "A1" },
  { it: "il binario", en: "the platform", example: "Da quale binario parte il treno?", tag: "travel", level: "A1" },
  { it: "il treno è in ritardo", en: "the train is delayed", example: "Scusi, il treno è in ritardo?", tag: "travel", level: "A1" },
  { it: "un tavolo per due", en: "a table for two", example: "Vorrei un tavolo per due.", tag: "food", level: "A1" },
  { it: "il menù", en: "the menu", example: "Posso vedere il menù?", tag: "food", level: "A1" },
  { it: "l'acqua naturale", en: "still water", example: "Per me, acqua naturale.", tag: "food", level: "A1" },
  { it: "il conto, per favore", en: "the bill, please", example: "Scusi, il conto, per favore.", tag: "food", level: "A1" },
  { it: "una camera singola", en: "a single room", example: "Avete una camera singola?", tag: "home", level: "A1" },
  { it: "l'affitto al mese", en: "the monthly rent", example: "Quanto costa l'affitto al mese?", tag: "home", level: "A1" },
  { it: "è incluso?", en: "is it included?", example: "Il wifi è incluso?", tag: "home", level: "A1" },
  { it: "sono allergico/a a...", en: "I am allergic to...", example: "Sono allergico alle noccioline.", tag: "health", level: "A1" },
  { it: "mi fa male la testa", en: "my head hurts", example: "Mi fa male la testa da stamattina.", tag: "health", level: "A1" },
  { it: "ogni quanto?", en: "how often?", example: "Ogni quanto devo prendere questa medicina?", tag: "health", level: "A1" },
  { it: "oggi", en: "today", example: "Oggi lavoro fino alle sei.", tag: "time", level: "A1" },
  { it: "domani", en: "tomorrow", example: "Domani parto per Roma.", tag: "time", level: "A1" },
  { it: "stasera", en: "this evening", example: "Stasera ceniamo fuori.", tag: "time", level: "A1" },
  { it: "alle otto", en: "at eight", example: "Ci vediamo alle otto.", tag: "time", level: "A1" },
  // ─── Daily Routines
  { it: "svegliarsi presto", en: "to wake up early", example: "Mi sveglio presto ogni mattina.", tag: "routine", level: "A2" },
  { it: "fare colazione", en: "to have breakfast", example: "Faccio colazione alle sette.", tag: "routine", level: "A2" },
  { it: "la routine mattutina", en: "morning routine", example: "La mia routine mattutina è molto semplice.", tag: "routine", level: "A2" },
  { it: "andare in palestra", en: "to go to the gym", example: "Vado in palestra tre volte a settimana.", tag: "routine", level: "A2" },
  { it: "fare la spesa", en: "to do grocery shopping", example: "Faccio la spesa al supermercato.", tag: "routine", level: "A2" },
  { it: "rilassarsi la sera", en: "to relax in the evening", example: "Mi rilasso la sera guardando un film.", tag: "routine", level: "A2" },
  { it: "l'abitudine quotidiana", en: "daily habit", example: "Leggere è la mia abitudine quotidiana.", tag: "routine", level: "A2" },
  { it: "organizzare la giornata", en: "to organize the day", example: "Organizzo la giornata la mattina presto.", tag: "routine", level: "A2" },
  // ─── Work & Productivity
  { it: "la scadenza", en: "the deadline", example: "La scadenza del progetto è domani.", tag: "work", level: "B1" },
  { it: "lavorare da remoto", en: "to work remotely", example: "Lavoro da remoto da due anni.", tag: "work", level: "B1" },
  { it: "gestire il tempo", en: "to manage time", example: "Bisogna imparare a gestire il tempo.", tag: "work", level: "B1" },
  { it: "essere produttivo", en: "to be productive", example: "Sono più produttivo la mattina.", tag: "work", level: "B1" },
  { it: "risolvere un problema", en: "to solve a problem", example: "Dobbiamo risolvere questo problema insieme.", tag: "work", level: "B1" },
  { it: "il flusso di lavoro", en: "the workflow", example: "Il flusso di lavoro è molto efficiente.", tag: "work", level: "B1" },
  { it: "prendere appunti", en: "to take notes", example: "Prendo appunti durante le riunioni.", tag: "work", level: "B1" },
  { it: "il progetto in corso", en: "ongoing project", example: "Il progetto in corso va molto bene.", tag: "work", level: "B1" },
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
];

const allVocab = [...baseVocab, ...FAST_TRACK_DOCS_SEED_CARDS];

async function upsertSeedCards(
  ctx: any,
  cards: typeof allVocab,
  today: string,
) {
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const card of cards) {
    const existing = await ctx.db
      .query("cards")
      .withIndex("by_it_direction", (q) => q.eq("it", card.it).eq("direction", "it_to_en"))
      .first();

    if (existing) {
      const patch: Record<string, string> = {};
      if (card.en !== existing.en) patch.en = card.en;
      if (card.example !== existing.example) patch.example = card.example;
      if (card.tag !== existing.tag) patch.tag = card.tag;
      if (card.level !== existing.level) patch.level = card.level;

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await ctx.db.insert("cards", {
      it: card.it,
      en: card.en,
      example: card.example,
      tag: card.tag,
      level: card.level,
      source: "seed" as const,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: today,
      direction: "it_to_en",
    });
    added += 1;
  }

  return {
    total: cards.length,
    added,
    updated,
    skipped,
  };
}

export const seedCards = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    return upsertSeedCards(ctx, allVocab, today);
  },
});

export const repairMissionTopupCards = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    let updated = 0;

    for (const card of cards) {
      if (card.source !== "mission_topup") continue;
      const patch = MISSION_TOPUP_PATCHES[card.it];
      if (!patch) continue;
      await ctx.db.patch(card._id, {
        ...(patch.it ? { it: patch.it } : {}),
        ...(patch.en ? { en: patch.en } : {}),
        ...(patch.example ? { example: patch.example } : {}),
        ...(patch.tag ? { tag: patch.tag } : {}),
        ...(patch.level ? { level: patch.level } : {}),
      });
      updated += 1;
    }

    return { updated };
  },
});

export const repairSeedCards = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    let patched = 0;
    let inserted = 0;
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });

    for (const patch of SEED_CARD_PATCHES) {
      const matches = cards.filter((card) => card.source === "seed" && card.it === patch.matchIt);
      for (const card of matches) {
        await ctx.db.patch(card._id, patch.changes);
        patched += 1;
      }
    }

    for (const card of [...SEED_CARD_INSERTS, ...A1_AUDIT_EXPANSION, ...A2_AUDIT_EXPANSION, ...B1_AUDIT_EXPANSION]) {
      const existing = await ctx.db
        .query("cards")
        .withIndex("by_it_direction", (q) =>
          q.eq("it", card.it).eq("direction", "it_to_en")
        )
        .first();
      if (existing) continue;

      await ctx.db.insert("cards", {
        ...card,
        source: "seed" as const,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: today,
        direction: "it_to_en",
      });
      inserted += 1;

      const reverseExisting = await ctx.db
        .query("cards")
        .withIndex("by_it_direction", (q) =>
          q.eq("it", card.it).eq("direction", "en_to_it")
        )
        .first();
      if (reverseExisting) continue;

      await ctx.db.insert("cards", {
        ...card,
        source: "seed" as const,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: today,
        direction: "en_to_it",
      });
      inserted += 1;
    }

    return { patched, inserted };
  },
});

function inferRecoveryTag(it: string, example?: string) {
  const sample = `${it} ${example ?? ""}`.toLowerCase();
  if (sample.includes("stazione") || sample.includes("binario") || sample.includes("treno")) {
    return "travel";
  }
  if (sample.includes("stanza") || sample.includes("appartamento") || sample.includes("affitto")) {
    return "home";
  }
  if (sample.includes("riunione") || sample.includes("documento") || sample.includes("pratica")) {
    return "work";
  }
  return "recovery";
}

function inferRecoveryLevel(text: string) {
  return text.length > 55 ? "A2" : "A1";
}

export const repairRecoveryCards = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    let updated = 0;

    for (const card of cards) {
      if (card.source !== "recovery") continue;
      const prompt = card.prompt ?? card.example ?? card.en;
      const explanation = card.explanation ?? card.en;
      await ctx.db.patch(card._id, {
        prompt,
        explanation,
        tag: card.tag ?? inferRecoveryTag(card.it, card.example),
        level: card.level ?? inferRecoveryLevel(card.it),
        en:
          card.errorCategory === "translation"
            ? card.en
            : "Say the corrected sentence in Italian.",
      });
      updated += 1;
    }

    return { updated };
  },
});

export const repairResidualExerciseContent = mutation({
  args: {},
  handler: async (ctx) => {
    let libraryUpdated = 0;
    let exercisesUpdated = 0;

    const templateRows = await ctx.db.query("exerciseTemplates").collect();
    for (const row of templateRows) {
      const content = row.content;
      if (!content || !Array.isArray(content.sentences)) continue;
      let changed = false;
      const sentences = content.sentences.map((sentence: any) => {
        if (
          sentence?.text === "Vado in stazione alle sei." ||
          sentence?.text === "Vado a appuntamento alle sei."
        ) {
          changed = true;
          return {
            ...sentence,
            text: "Vado al appuntamento alle sei.",
            corrected: "Vado all'appuntamento alle sei.",
            explanation: "Before a vowel, al contracts to all'.",
          };
        }
        return sentence;
      });
      if (!changed) continue;
      await ctx.db.patch(row._id, { content: { ...content, sentences } });
      libraryUpdated += 1;
    }

    const exerciseRows = await ctx.db.query("exercises").collect();
    for (const row of exerciseRows) {
      const content = row.content;
      if (!content || !Array.isArray(content.sentences)) continue;
      let changed = false;
      const sentences = content.sentences.map((sentence: any) => {
        if (
          sentence?.text === "Vado in stazione alle sei." ||
          sentence?.text === "Vado a appuntamento alle sei."
        ) {
          changed = true;
          return {
            ...sentence,
            text: "Vado al appuntamento alle sei.",
            corrected: "Vado all'appuntamento alle sei.",
            explanation: "Before a vowel, al contracts to all'.",
          };
        }
        return sentence;
      });
      if (!changed) continue;
      await ctx.db.patch(row._id, { content: { ...content, sentences } });
      exercisesUpdated += 1;
    }

    return { libraryUpdated, exercisesUpdated };
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

export const resetAppState = mutation({
  args: {},
  handler: async (ctx) => {
    const tablesToClear = [
      "exerciseEvidence",
      "sessions",
      "exercises",
      "exerciseTemplates",
      "userMissionProgress",
      "userSkillProgress",
      "userLevelProgress",
      "cards",
    ] as const;

    const deleted: Record<string, number> = {};
    for (const table of tablesToClear) {
      const rows = await ctx.db.query(table).collect();
      deleted[table] = rows.length;
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }

    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
    const seedResult = await upsertSeedCards(ctx, allVocab, today);

    return {
      status: "reset",
      deleted,
      seededCards: seedResult.added,
    };
  },
});

export const seedExerciseTemplates = mutation({
  args: {
    originMissionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const entries = args.originMissionId
      ? EXERCISE_TEMPLATES.filter((entry) => entry.missionId === args.originMissionId)
      : EXERCISE_TEMPLATES;

    let inserted = 0;
    let updated = 0;
    for (const entry of entries) {
      const { missionId, ...rest } = entry as any;
      const payload = {
        ...rest,
        originMissionId: missionId,
      };
      const existing = await ctx.db
        .query("exerciseTemplates")
        .withIndex("by_origin_order", (q) =>
          q.eq("originMissionId", payload.originMissionId).eq("order", payload.order)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, payload);
        updated += 1;
      } else {
        await ctx.db.insert("exerciseTemplates", payload);
        inserted += 1;
      }
    }

    return {
      originMissionId: args.originMissionId ?? "all",
      inserted,
      updated,
      total: entries.length,
    };
  },
});

export const rebuildExerciseTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("exerciseTemplates").collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    let inserted = 0;
    for (const entry of EXERCISE_TEMPLATES) {
      const { missionId, ...rest } = entry as any;
      await ctx.db.insert("exerciseTemplates", {
        ...rest,
        originMissionId: missionId,
      });
      inserted += 1;
    }

    return {
      deleted: existing.length,
      inserted,
    };
  },
});
