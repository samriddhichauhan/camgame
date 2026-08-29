export type ReactionRushStatus =
  | 'intro'
  | 'round-intro'
  | 'countdown'
  | 'challenge-active'
  | 'round-result'
  | 'game-over';

export type ReactionActionKey =
  | 'raise-left-hand'
  | 'raise-right-hand'
  | 'raise-both-hands'
  | 'touch-head'
  | 'crouch'
  | 'wave'
  | 'move-left'
  | 'move-right';

export interface ReactionPrompt {
  id: string;
  detectorKey: ReactionActionKey;
  promptText: string;
  iconName: string;
  instruction: string;
}

export interface PlayerBaseline {
  shoulderY: number;
  hipY: number;
  torsoHeight: number;
  centerX: number;
}

export interface PlayerRoundResult {
  completed: boolean;
  reactionTimeMs: number | null;
  score: number;
  ratingText: string;
}

export interface ReactionRushRoundState {
  roundNumber: number;
  prompt: ReactionPrompt;
  player1Result: PlayerRoundResult;
  player2Result: PlayerRoundResult;
  winner: 1 | 2 | 'draw' | null;
}
