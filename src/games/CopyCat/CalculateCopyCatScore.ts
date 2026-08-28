import type { BodyLandmark } from '../../computer-vision/ComputerVisionTypes';

interface BoneSegment {
  parent: string;
  child: string;
  weight: number;
}

// Key joints used to score overall pose similarity
const BONE_SEGMENTS: BoneSegment[] = [
  { parent: 'left_shoulder', child: 'left_elbow', weight: 1.5 },
  { parent: 'left_elbow', child: 'left_wrist', weight: 1.5 },
  { parent: 'right_shoulder', child: 'right_elbow', weight: 1.5 },
  { parent: 'right_elbow', child: 'right_wrist', weight: 1.5 },
  { parent: 'left_shoulder', child: 'left_hip', weight: 0.8 },
  { parent: 'right_shoulder', child: 'right_hip', weight: 0.8 },
  { parent: 'left_hip', child: 'left_knee', weight: 1.0 },
  { parent: 'left_knee', child: 'left_ankle', weight: 1.0 },
  { parent: 'right_hip', child: 'right_knee', weight: 1.0 },
  { parent: 'right_knee', child: 'right_ankle', weight: 1.0 }
];

export function calculateCopyCatScore(
  leaderPose: BodyLandmark[],
  copyPose: BodyLandmark[]
): number {
  let weightedScoreSum = 0;
  let totalWeight = 0;

  BONE_SEGMENTS.forEach((segment) => {
    const leaderParent = leaderPose.find((lm) => lm.name === segment.parent);
    const leaderChild = leaderPose.find((lm) => lm.name === segment.child);
    const copyParent = copyPose.find((lm) => lm.name === segment.parent);
    const copyChild = copyPose.find((lm) => lm.name === segment.child);

    // Only compare if coordinates exist and are tracked with high visibility
    if (
      leaderParent && 
      leaderChild && 
      copyParent && 
      copyChild &&
      leaderParent.visibility > 0.25 &&
      leaderChild.visibility > 0.25 &&
      copyParent.visibility > 0.25 &&
      copyChild.visibility > 0.25
    ) {
      // 1. Calculate Leader Vector segment
      const vLeader = {
        x: leaderChild.x - leaderParent.x,
        y: leaderChild.y - leaderParent.y
      };
      const lenLeader = Math.hypot(vLeader.x, vLeader.y);

      // 2. Calculate Copy Cat Vector segment
      const vCopy = {
        x: copyChild.x - copyParent.x,
        y: copyChild.y - copyParent.y
      };
      const lenCopy = Math.hypot(vCopy.x, vCopy.y);

      if (lenLeader > 0.001 && lenCopy > 0.001) {
        // Normalize vectors to unit length
        const normLeader = { x: vLeader.x / lenLeader, y: vLeader.y / lenLeader };
        const normCopy = { x: vCopy.x / lenCopy, y: vCopy.y / lenCopy };

        // Cosine similarity via dot product (-1 to 1)
        const dot = normLeader.x * normCopy.x + normLeader.y * normCopy.y;
        
        // Map dot product from [-1, 1] to [0, 1] using Math.max(0, dot) for responsive alignment feedback
        const match = Math.max(0, dot);

        weightedScoreSum += match * segment.weight;
        totalWeight += segment.weight;
      }
    }
  });

  if (totalWeight === 0) return 0;
  const matchRatio = weightedScoreSum / totalWeight;
  
  // Convert ratio to 0-100 percentage
  return Math.round(matchRatio * 100);
}
