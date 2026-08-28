export function calculateIceBreakerScore(reactionTimeMs: number | null): number {
  if (reactionTimeMs === null) return 0;
  
  // Base score for successfully completing the action
  const baseScore = 100;
  
  // Speed bonus: up to 100 points for immediate reaction, dropping to 0 at 5.0 seconds
  const maxTimeMs = 5000;
  const speedBonus = Math.max(0, Math.round((maxTimeMs - reactionTimeMs) / 50));
  
  return baseScore + speedBonus;
}
