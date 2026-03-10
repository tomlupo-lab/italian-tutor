function getConversationMetrics(exercises, results) {
  const conversationExercise = exercises.find((exercise) => exercise.type === "conversation");
  if (!conversationExercise) {
    return {
      usedTargets: 0,
      userTurns: 0,
      completedAll: results.size >= exercises.length && exercises.length > 0,
    };
  }

  const conversationResult = results.get(conversationExercise._id);
  const completedAll = results.size >= exercises.length && exercises.length > 0;
  if (!conversationResult) {
    return { usedTargets: 0, userTurns: 0, completedAll };
  }

  const userTurns =
    typeof conversationResult.user_turns === "number"
      ? conversationResult.user_turns
      : Array.isArray(conversationResult.messages)
        ? conversationResult.messages.filter((message) => message.role === "user" && message.content.trim()).length
        : 0;

  const usedTargets = Array.isArray(conversationResult.target_phrases_used)
    ? conversationResult.target_phrases_used.length
    : (() => {
        const targetPhrases = Array.isArray(conversationExercise.content?.target_phrases)
          ? conversationExercise.content.target_phrases
          : [];
        const userText = Array.isArray(conversationResult.messages)
          ? conversationResult.messages
              .filter((message) => message.role === "user")
              .map((message) => String(message.content || "").toLowerCase())
              .join(" ")
          : "";
        return targetPhrases.filter((phrase) => userText.includes(String(phrase).toLowerCase())).length;
      })();

  return {
    usedTargets,
    userTurns,
    completedAll,
  };
}

function evaluateGoldContract(exercises, results) {
  const metrics = getConversationMetrics(exercises, results);
  const checkpointPassed =
    metrics.completedAll && metrics.usedTargets >= 2 && metrics.userTurns >= 4;

  return {
    ...metrics,
    checkpointPassed,
    contractStatus: !metrics.completedAll ? "missed" : checkpointPassed ? "strong" : "partial",
  };
}

function computeTierCredits(exercises, results) {
  let bronzeCredit = 0;
  let silverCredit = 0;
  let goldCredit = 0;

  for (const exercise of exercises) {
    if (!results.has(exercise._id)) continue;
    if (exercise.type === "srs") bronzeCredit += 1;
    if (["cloze", "word_builder", "pattern_drill", "speed_translation", "error_hunt"].includes(exercise.type)) {
      silverCredit += 1;
    }
    if (["conversation", "reflection"].includes(exercise.type)) goldCredit += 1;
  }

  return { bronzeCredit, silverCredit, goldCredit };
}

module.exports = {
  computeTierCredits,
  evaluateGoldContract,
  getConversationMetrics,
};
