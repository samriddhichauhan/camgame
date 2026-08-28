import type { PoseLandmarkerResult, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import type { DetectedPlayer, BodyLandmark, DetectedHand, PlayerBoundingBox } from './ComputerVisionTypes';

// Mapping pose landmark indexes to names
const LANDMARK_NAMES = [
  'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer', 'right_eye_inner',
  'right_eye', 'right_eye_outer', 'left_ear', 'right_ear', 'mouth_left',
  'mouth_right', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky', 'left_index',
  'right_index', 'left_thumb', 'right_thumb', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_heel',
  'right_heel', 'left_foot_index', 'right_foot_index'
];

export function detectPlayers(
  poseResult: PoseLandmarkerResult | null,
  handResult: HandLandmarkerResult | null
): DetectedPlayer[] {
  if (!poseResult || !poseResult.landmarks || poseResult.landmarks.length === 0) {
    return [];
  }

  const rawPlayers: {
    bodyLandmarks: BodyLandmark[];
    boundingBox: PlayerBoundingBox;
    centerPoint: { x: number; y: number };
    visibility: number;
  }[] = [];

  // 1. Process each detected body pose
  poseResult.landmarks.forEach((poseLandmarks) => {
    const bodyLandmarks: BodyLandmark[] = poseLandmarks.map((lm, idx) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 1.0,
      name: LANDMARK_NAMES[idx] || `landmark_${idx}`
    }));

    // Calculate bounding box boundaries from joints
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;
    let sumX = 0;
    let count = 0;

    bodyLandmarks.forEach((lm) => {
      // Exclude low-visibility joints from bounding box calculation to avoid jitter
      if (lm.visibility > 0.25) {
        if (lm.x < minX) minX = lm.x;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.y > maxY) maxY = lm.y;
        sumX += lm.x;
        count++;
      }
    });

    // Fallback if visibility is low overall
    if (count === 0) {
      bodyLandmarks.forEach((lm) => {
        if (lm.x < minX) minX = lm.x;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.y > maxY) maxY = lm.y;
      });
      minX = Math.max(0, Math.min(1, minX));
      maxX = Math.max(0, Math.min(1, maxX));
      minY = Math.max(0, Math.min(1, minY));
      maxY = Math.max(0, Math.min(1, maxY));
    }

    const boundingBox: PlayerBoundingBox = {
      x: minX,
      y: minY,
      width: Math.max(0.01, maxX - minX),
      height: Math.max(0.01, maxY - minY)
    };

    const centerPoint = {
      x: count > 0 ? sumX / count : (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };

    const totalVis = bodyLandmarks.reduce((sum, lm) => sum + lm.visibility, 0);
    const averageVisibility = bodyLandmarks.length > 0 ? totalVis / bodyLandmarks.length : 1.0;

    rawPlayers.push({
      bodyLandmarks,
      boundingBox,
      centerPoint,
      visibility: averageVisibility
    });
  });

  // 2. Deterministic Left-to-Right Screen Sorting
  // Because self-facing (front) camera feeds are mirrored visually on screen:
  // - A player standing on the viewer's LEFT has a HIGHER "x" coordinate in the raw unmirrored video frame (closer to 1.0).
  // - A player standing on the viewer's RIGHT has a LOWER "x" coordinate in the raw unmirrored video frame (closer to 0.0).
  // - By sorting centerPoint.x descending:
  //   - Index 0: Highest raw X center (viewer's left side of screen) -> Assigned Player 1
  //   - Index 1: Lowest raw X center (viewer's right side of screen) -> Assigned Player 2
  const sortedPlayers = rawPlayers.sort((a, b) => b.centerPoint.x - a.centerPoint.x);

  // Take the top 2 players
  const activePlayers: DetectedPlayer[] = sortedPlayers.slice(0, 2).map((p, index) => ({
    playerIndex: (index + 1) as 1 | 2,
    bodyLandmarks: p.bodyLandmarks,
    leftHand: null,
    rightHand: null,
    boundingBox: p.boundingBox,
    centerPoint: p.centerPoint,
    visibility: p.visibility
  }));

  // 3. Proximity Matching for Hand Detections
  if (handResult && handResult.landmarks && handResult.landmarks.length > 0) {
    handResult.landmarks.forEach((handLandmarks, handIdx) => {
      const wrist = handLandmarks[0];
      if (!wrist) return;

      // Extract classifications
      let handedness: 'Left' | 'Right' = 'Right';
      let score = 1.0;
      if (handResult.handednesses && handResult.handednesses[handIdx]) {
        const classif = handResult.handednesses[handIdx][0];
        handedness = classif.categoryName === 'Left' ? 'Left' : 'Right';
        score = classif.score;
      }

      const detectedHand: DetectedHand = {
        landmarks: handLandmarks.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z })),
        handedness,
        score
      };

      // Find the closest player wrist
      let closestPlayerIndex = -1;
      let closestWristType: 'left' | 'right' | null = null;
      let minDistance = Infinity;

      activePlayers.forEach((player, idx) => {
        const leftWrist = player.bodyLandmarks.find((lm) => lm.name === 'left_wrist');
        const rightWrist = player.bodyLandmarks.find((lm) => lm.name === 'right_wrist');

        if (leftWrist) {
          const dist = Math.hypot(wrist.x - leftWrist.x, wrist.y - leftWrist.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestPlayerIndex = idx;
            closestWristType = 'left';
          }
        }
        if (rightWrist) {
          const dist = Math.hypot(wrist.x - rightWrist.x, wrist.y - rightWrist.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestPlayerIndex = idx;
            closestWristType = 'right';
          }
        }
      });

      // Associate hand if it falls within maximum distance (0.25 normalized coordinate radius)
      if (closestPlayerIndex !== -1 && minDistance < 0.25) {
        const targetPlayer = activePlayers[closestPlayerIndex];
        if (closestWristType === 'left') {
          targetPlayer.leftHand = detectedHand;
        } else {
          targetPlayer.rightHand = detectedHand;
        }
      }
    });
  }

  return activePlayers;
}
