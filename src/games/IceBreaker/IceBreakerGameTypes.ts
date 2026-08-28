export type IceBreakerStatus = 
  | 'intro'
  | 'round-intro'
  | 'countdown'
  | 'challenge-active'
  | 'round-result'
  | 'game-over';

export interface IceBreakerChallenge {
  id: string;
  title: string;
  instruction: string;
  emoji: string;
  detectorKey: string;
}

export interface PlayerRoundResult {
  completed: boolean;
  reactionTime: number | null; // in milliseconds
  score: number;
}

export interface IceBreakerRoundState {
  roundNumber: number;
  challenge: IceBreakerChallenge;
  player1Result: PlayerRoundResult;
  player2Result: PlayerRoundResult;
  winner: 1 | 2 | 'draw' | null;
}
