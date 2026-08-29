import type { BodyLandmark } from '../../vision/types/VisionTypes';

export type CopyCatStatus = 
  | 'intro'
  | 'round-intro'
  | 'leader-ready'
  | 'leader-pose'
  | 'copy-ready'
  | 'copy-pose'
  | 'round-result'
  | 'game-over';

export interface CopyCatRoundState {
  roundNumber: number;
  leaderPlayerIndex: 1 | 2; // 1 = P1, 2 = P2
  copyPlayerIndex: 1 | 2; // 1 = P1, 2 = P2
  leaderPose: BodyLandmark[] | null;
  matchPercentage: number;
}
