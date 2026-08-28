import type { BodyLandmark } from '../../computer-vision/ComputerVisionTypes';

export interface PlayerBaseline {
  shoulderY: number;
  hipY: number;
  torsoHeight: number;
}

export function detectIceBreakerAction(
  detectorKey: string,
  landmarks: BodyLandmark[],
  baseline: PlayerBaseline | null,
  history: BodyLandmark[][]
): boolean {
  // Extract key landmarks
  const nose = landmarks.find(lm => lm.name === 'nose');
  const leftShoulder = landmarks.find(lm => lm.name === 'left_shoulder');
  const rightShoulder = landmarks.find(lm => lm.name === 'right_shoulder');
  const leftWrist = landmarks.find(lm => lm.name === 'left_wrist');
  const rightWrist = landmarks.find(lm => lm.name === 'right_wrist');
  const leftHip = landmarks.find(lm => lm.name === 'left_hip');
  const rightHip = landmarks.find(lm => lm.name === 'right_hip');

  // Verify that core joints are detected with reasonable visibility
  if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
    return false;
  }

  // Upper body visibility check
  const upperBodyVisible = 
    leftShoulder.visibility > 0.25 && 
    rightShoulder.visibility > 0.25 && 
    leftWrist.visibility > 0.25 && 
    rightWrist.visibility > 0.25;

  if (!upperBodyVisible) return false;

  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

  switch (detectorKey) {
    case 'HANDS_UP':
      // Both wrists must be higher than shoulders (smaller Y is higher in screen space)
      return leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;

    case 'HANDS_ON_HEAD':
      // Both wrists near center nose and higher than shoulders
      if (!nose || nose.visibility < 0.25) return false;
      const leftWristNearHead = Math.abs(leftWrist.x - nose.x) < shoulderWidth * 0.75 && leftWrist.y < leftShoulder.y;
      const rightWristNearHead = Math.abs(rightWrist.x - nose.x) < shoulderWidth * 0.75 && rightWrist.y < rightShoulder.y;
      return leftWristNearHead && rightWristNearHead;

    case 'ARMS_OUT':
      // Lateral width wrist-to-wrist is wide, and wrists are close to shoulder height
      const lateralDist = Math.abs(leftWrist.x - rightWrist.x);
      const leftWristAtShoulderHeight = Math.abs(leftWrist.y - leftShoulder.y) < shoulderWidth * 0.8;
      const rightWristAtShoulderHeight = Math.abs(rightWrist.y - rightShoulder.y) < shoulderWidth * 0.8;
      return lateralDist > shoulderWidth * 2.2 && leftWristAtShoulderHeight && rightWristAtShoulderHeight;

    case 'CROUCH':
      // Mid-shoulder Y is significantly lower than baseline standing Y
      if (!baseline || !leftHip || !rightHip) return false;
      const crouchThreshold = baseline.shoulderY + baseline.torsoHeight * 0.22;
      return shoulderY > crouchThreshold;

    case 'ONE_HAND_UP':
      // At least one hand raised above shoulder
      return leftWrist.y < leftShoulder.y || rightWrist.y < rightShoulder.y;

    case 'FREEZE':
      // Look at variation of core joints over the history frames queue
      if (history.length < 12) return false;
      const jointsToTrack = ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];
      let totalVariation = 0;
      let trackedJointsCount = 0;

      jointsToTrack.forEach((jointName) => {
        const coords = history
          .map((frame) => frame.find((lm) => lm.name === jointName))
          .filter((lm): lm is BodyLandmark => !!lm && lm.visibility > 0.25);

        if (coords.length >= 8) {
          const xs = coords.map((c) => c.x);
          const ys = coords.map((c) => c.y);
          const xVar = Math.max(...xs) - Math.min(...xs);
          const yVar = Math.max(...ys) - Math.min(...ys);
          totalVariation += (xVar + yVar) / 2;
          trackedJointsCount++;
        }
      });

      if (trackedJointsCount === 0) return false;
      const averageVariation = totalVariation / trackedJointsCount;
      
      // If average movement is very low, player is holding completely still
      return averageVariation < 0.018;

    case 'JUMP':
      // Mid-hip Y spikes upward (smaller Y) relative to standing baseline
      if (!baseline || !leftHip || !rightHip || leftHip.visibility < 0.25 || rightHip.visibility < 0.25) return false;
      const currentHipY = (leftHip.y + rightHip.y) / 2;
      const jumpThreshold = baseline.hipY - baseline.torsoHeight * 0.15;
      return currentHipY < jumpThreshold;

    default:
      return false;
  }
}
