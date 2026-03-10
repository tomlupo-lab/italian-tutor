import { mutation } from "./_generated/server";

export const backfillMissingDirections = mutation({
  handler: async (ctx) => {
    const allCards = await ctx.db.query("cards").collect();

    let patched = 0;
    for (const card of allCards) {
      if (card.direction) continue;
      await ctx.db.patch(card._id, { direction: "it_to_en" });
      patched++;
    }

    const cards = await ctx.db.query("cards").collect();
    const byItDirection = new Set(
      cards.map((card) => `${card.it}::${card.direction ?? "it_to_en"}`)
    );

    let cloned = 0;
    for (const card of cards) {
      const direction = card.direction ?? "it_to_en";
      if (direction !== "it_to_en") continue;

      const reverseKey = `${card.it}::en_to_it`;
      if (byItDirection.has(reverseKey)) continue;

      await ctx.db.insert("cards", {
        it: card.it,
        en: card.en,
        example: card.example,
        tag: card.tag,
        level: card.level,
        source: card.source,
        direction: "en_to_it",
        ease: card.ease,
        interval: card.interval,
        repetitions: card.repetitions,
        nextReview: card.nextReview,
        lastQuality: card.lastQuality,
        lastReviewed: card.lastReviewed,
        skillId: card.skillId,
        errorCategory: card.errorCategory,
      });
      byItDirection.add(reverseKey);
      cloned++;
    }

    return { patched, cloned, total: cards.length };
  },
});
