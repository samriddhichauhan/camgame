import type { PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';

export function detectBodyPose(
  landmarker: PoseLandmarker,
  videoElement: HTMLVideoElement,
  timestamp: number
): PoseLandmarkerResult | null {
  try {
    return landmarker.detectForVideo(videoElement, timestamp);
  } catch (err) {
    console.error('Error in detectBodyPose:', err);
    return null;
  }
}
