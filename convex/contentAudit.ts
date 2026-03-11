import { query } from "./_generated/server";
import { v } from "convex/values";

export const exportCorpus = query({
  args: {},
  handler: async (ctx) => {
    const [cards, exercises, exerciseTemplates] = await Promise.all([
      ctx.db.query("cards").collect(),
      ctx.db.query("exercises").collect(),
      ctx.db.query("exerciseTemplates").collect(),
    ]);

    return {
      cards: cards.map((card) => ({
        _id: card._id,
        source: card.source,
        direction: card.direction,
        level: card.level ?? null,
        tag: card.tag ?? null,
        it: card.it,
        en: card.en,
        example: card.example ?? null,
        prompt: card.prompt ?? null,
        explanation: card.explanation ?? null,
        errorCategory: card.errorCategory ?? null,
      })),
      exercises: exercises.map((exercise) => ({
        _id: exercise._id,
        date: exercise.date,
        type: exercise.type,
        source: exercise.source ?? null,
        difficulty: exercise.difficulty ?? null,
        skillId: exercise.skillId ?? null,
        missionId: exercise.missionId ?? null,
        checkpointId: exercise.checkpointId ?? null,
        completed: exercise.completed,
        content: exercise.content,
      })),
      exerciseTemplates: exerciseTemplates.map((row) => ({
        _id: row._id,
        originMissionId: row.originMissionId ?? null,
        level: row.level,
        type: row.type,
        tier: row.tier,
        skillId: row.skillId ?? null,
        title: row.title ?? null,
        variantKey: row.variantKey,
        active: row.active,
        content: row.content,
      })),
    };
  },
});

export const getTemplatesByVariantKeys = query({
  args: {
    variantKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("exerciseTemplates").collect();
    return all
      .filter((row) => args.variantKeys.includes(row.variantKey))
      .map((row) => ({
        _id: row._id,
        originMissionId: row.originMissionId ?? null,
        level: row.level,
        type: row.type,
        variantKey: row.variantKey,
        content: row.content,
      }));
  },
});
