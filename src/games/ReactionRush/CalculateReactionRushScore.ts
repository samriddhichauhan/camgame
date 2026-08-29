export interface ScoreResult {
  score: number;
  ratingText: string;
  badgeColor: string;
}

/**
 * Calculates reaction score based strictly on reaction speed in milliseconds:
 * Very fast (< 600ms): 90–100 -> PERFECT REACTION!
 * Fast (600–1000ms): 75–89 -> GREAT SPEED!
 * Average (1000–1600ms): 50–74 -> NICE!
 * Slow (1600–2500ms): 25–49 -> TOO SLOW!
 * Miss (> 2500ms or null): 0 -> MISSED!
 */
export function calculateReactionRushScore(reactionTimeMs: number | null): ScoreResult {
  if (reactionTimeMs === null || reactionTimeMs > 2500) {
    return {
      score: 0,
      ratingText: 'MISSED!',
      badgeColor: 'bg-slate-400 text-white',
    };
  }

  if (reactionTimeMs < 600) {
    const raw = 100 - Math.round((reactionTimeMs / 600) * 10);
    return {
      score: Math.max(90, Math.min(100, raw)),
      ratingText: 'PERFECT REACTION!',
      badgeColor: 'bg-brand-purple text-white',
    };
  }

  if (reactionTimeMs < 1000) {
    const raw = 89 - Math.round(((reactionTimeMs - 600) / 400) * 14);
    return {
      score: Math.max(75, Math.min(89, raw)),
      ratingText: 'GREAT SPEED!',
      badgeColor: 'bg-brand-coral text-white',
    };
  }

  if (reactionTimeMs < 1600) {
    const raw = 74 - Math.round(((reactionTimeMs - 1000) / 600) * 24);
    return {
      score: Math.max(50, Math.min(74, raw)),
      ratingText: 'NICE!',
      badgeColor: 'bg-brand-yellow text-slate-950',
    };
  }

  const raw = 49 - Math.round(((reactionTimeMs - 1600) / 900) * 24);
  return {
    score: Math.max(25, Math.min(49, raw)),
    ratingText: 'TOO SLOW!',
    badgeColor: 'bg-slate-500 text-white',
  };
}
