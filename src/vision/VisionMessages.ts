import type { VisionPhase } from './types/VisionTypes';

export interface VisionMessage {
  title: string;
  subtitle: string;
}

/**
 * Single source of truth for player-facing vision status copy. Replaces the
 * generic "STEP INTO THE FRAME" that used to fire for every failure mode,
 * technical or not.
 */
export function getVisionMessage(
  phase: VisionPhase,
  requiredPlayers: 1 | 2,
  player2Name: string
): VisionMessage {
  switch (phase) {
    case 'VISION_INITIALIZING':
      return { title: 'Getting Camera Ready...', subtitle: 'Loading VYBE’s vision models' };
    case 'CAMERA_ERROR':
      return { title: 'Camera Permission Needed', subtitle: 'Allow camera access to continue' };
    case 'MODEL_ERROR':
      return { title: 'Camera Detection Unavailable', subtitle: 'Something went wrong loading the vision system' };
    case 'TRACKING_LOST':
      return { title: 'Hold Still...', subtitle: 'Reconnecting to your position' };
    case 'NO_PLAYERS':
      return { title: 'Step Into The Frame', subtitle: 'We need to see you clearly in the camera' };
    case 'ONE_PLAYER':
      if (requiredPlayers === 1) {
        return { title: 'Ready', subtitle: 'Player detected — let’s go!' };
      }
      return { title: `${player2Name || 'Player 2'}, Step Into The Frame`, subtitle: 'Waiting for a second player' };
    case 'TWO_PLAYERS':
      return { title: 'Ready', subtitle: 'Both players detected — let’s go!' };
    default:
      return { title: 'Step Into The Frame', subtitle: 'We need to see you clearly in the camera' };
  }
}

export function isPhaseReady(phase: VisionPhase, requiredPlayers: 1 | 2): boolean {
  if (requiredPlayers === 1) return phase === 'ONE_PLAYER' || phase === 'TWO_PLAYERS';
  return phase === 'TWO_PLAYERS';
}
