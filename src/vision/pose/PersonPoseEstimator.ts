import { PoseLandmarker } from '@mediapipe/tasks-vision';
import type { BodyLandmark, PlayerBoundingBox } from '../types/VisionTypes';
import type { PaddedBox } from './CropPersonRegion';
import type { VisionFileset } from '../detection/PersonDetector';

const LANDMARK_NAMES = [
  'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer', 'right_eye_inner',
  'right_eye', 'right_eye_outer', 'left_ear', 'right_ear', 'mouth_left',
  'mouth_right', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky', 'left_index',
  'right_index', 'left_thumb', 'right_thumb', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_heel',
  'right_heel', 'left_foot_index', 'right_foot_index'
];

// This model instance is dedicated to ONE tracked player slot for its whole
// lifetime. Feeding it that slot's crop every frame (rather than switching
// crops between two people on a shared instance) keeps MediaPipe's internal
// single-object ROI tracker coherent — the well-supported, reliable
// single-person configuration, per-person.
export async function initializeSinglePersonPoseLandmarker(vision: VisionFileset): Promise<PoseLandmarker> {
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.3,
    minPosePresenceConfidence: 0.3,
    minTrackingConfidence: 0.5,
  });
}

export class PersonPoseEstimator {
  private lastTimestamp = -1;
  private landmarker: PoseLandmarker;

  constructor(landmarker: PoseLandmarker) {
    this.landmarker = landmarker;
  }

  /**
   * Runs pose estimation on a person crop and maps the resulting landmarks
   * (normalized within the crop) back into full-frame normalized coordinates
   * using the crop's padded bounding box.
   */
  estimate(
    cropCanvas: HTMLCanvasElement,
    paddedBox: PaddedBox,
    timestamp: number
  ): { landmarks: BodyLandmark[]; visibility: number; boundingBox: PlayerBoundingBox } | null {
    let safeTimestamp = timestamp;
    if (safeTimestamp <= this.lastTimestamp) {
      safeTimestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = safeTimestamp;

    let result;
    try {
      result = this.landmarker.detectForVideo(cropCanvas, safeTimestamp);
    } catch (err) {
      console.error('Error in PersonPoseEstimator.estimate:', err);
      return null;
    }

    const cropLandmarks = result.landmarks[0];
    if (!cropLandmarks || cropLandmarks.length === 0) return null;

    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    let totalVis = 0;

    const landmarks: BodyLandmark[] = cropLandmarks.map((lm, idx) => {
      const fullX = paddedBox.x + lm.x * paddedBox.width;
      const fullY = paddedBox.y + lm.y * paddedBox.height;
      const visibility = lm.visibility ?? 1.0;
      totalVis += visibility;

      if (visibility > 0.25) {
        if (fullX < minX) minX = fullX;
        if (fullX > maxX) maxX = fullX;
        if (fullY < minY) minY = fullY;
        if (fullY > maxY) maxY = fullY;
      }

      return {
        x: fullX,
        y: fullY,
        z: lm.z,
        visibility,
        name: LANDMARK_NAMES[idx] || `landmark_${idx}`,
      };
    });

    const boundingBox: PlayerBoundingBox =
      maxX > minX
        ? { x: minX, y: minY, width: Math.max(0.01, maxX - minX), height: Math.max(0.01, maxY - minY) }
        : paddedBox;

    return {
      landmarks,
      visibility: totalVis / landmarks.length,
      boundingBox,
    };
  }

  close(): void {
    this.landmarker.close();
  }
}
