import type { BodyLandmark } from '../../vision/types/VisionTypes';
import type { ReactionActionKey, PlayerBaseline } from './ReactionRushGameTypes';

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function detectReactionRushAction(
  detectorKey: ReactionActionKey,
  landmarks: BodyLandmark[],
  baseline: PlayerBaseline | null,
  landmarkHistory: BodyLandmark[][]
): boolean {
  if (!landmarks || landmarks.length === 0) return false;

  const leftShoulder = landmarks.find(lm => lm.name === 'left_shoulder');
  const rightShoulder = landmarks.find(lm => lm.name === 'right_shoulder');
  const leftWrist = landmarks.find(lm => lm.name === 'left_wrist');
  const rightWrist = landmarks.find(lm => lm.name === 'right_wrist');
  const leftEar = landmarks.find(lm => lm.name === 'left_ear');
  const rightEar = landmarks.find(lm => lm.name === 'right_ear');
  const nose = landmarks.find(lm => lm.name === 'nose');

  switch (detectorKey) {
    case 'raise-left-hand': {
      if (!leftShoulder || !leftWrist) return false;
      return leftWrist.y < leftShoulder.y - 0.05 && (leftWrist.visibility ?? 1) > 0.3;
    }

    case 'raise-right-hand': {
      if (!rightShoulder || !rightWrist) return false;
      return rightWrist.y < rightShoulder.y - 0.05 && (rightWrist.visibility ?? 1) > 0.3;
    }

    case 'raise-both-hands': {
      if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) return false;
      const leftUp = leftWrist.y < leftShoulder.y - 0.05;
      const rightUp = rightWrist.y < rightShoulder.y - 0.05;
      return leftUp && rightUp;
    }

    case 'touch-head': {
      if (!leftWrist && !rightWrist) return false;
      const targetEar = leftEar || rightEar || nose;
      if (!targetEar) return false;

      const distL = leftWrist ? distance(leftWrist, targetEar) : 999;
      const distR = rightWrist ? distance(rightWrist, targetEar) : 999;
      return distL < 0.14 || distR < 0.14;
    }

    case 'crouch': {
      if (!baseline || !leftShoulder || !rightShoulder) return false;
      const currentShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      // Shoulder lowered by at least 0.07 relative to standing baseline
      return currentShoulderY > baseline.shoulderY + 0.07;
    }

    case 'wave': {
      if (landmarkHistory.length < 10) return false;
      let totalDx = 0;
      let directionSwaps = 0;
      let lastDir = 0;

      for (let i = 1; i < landmarkHistory.length; i++) {
        const prevW = landmarkHistory[i - 1].find(lm => lm.name === 'right_wrist' || lm.name === 'left_wrist');
        const currW = landmarkHistory[i].find(lm => lm.name === 'right_wrist' || lm.name === 'left_wrist');
        if (prevW && currW) {
          const dx = currW.x - prevW.x;
          totalDx += Math.abs(dx);
          const dir = Math.sign(dx);
          if (dir !== 0 && lastDir !== 0 && dir !== lastDir) {
            directionSwaps++;
          }
          if (dir !== 0) lastDir = dir;
        }
      }
      return totalDx > 0.4 && directionSwaps >= 2;
    }

    case 'move-left': {
      if (!leftShoulder || !rightShoulder) return false;
      const currentCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      if (!baseline) return false;
      // Camera is mirrored: moving to viewer's LEFT corresponds to higher X (>= baseline + 0.10)
      return currentCenterX >= baseline.centerX + 0.10;
    }

    case 'move-right': {
      if (!leftShoulder || !rightShoulder) return false;
      const currentCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      if (!baseline) return false;
      // Camera is mirrored: moving to viewer's RIGHT corresponds to lower X (<= baseline - 0.10)
      return currentCenterX <= baseline.centerX - 0.10;
    }

    default:
      return false;
  }
}
