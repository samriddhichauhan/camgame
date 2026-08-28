import type { HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export function detectHandLandmarks(
  landmarker: HandLandmarker,
  videoElement: HTMLVideoElement,
  timestamp: number
): HandLandmarkerResult | null {
  try {
    return landmarker.detectForVideo(videoElement, timestamp);
  } catch (err) {
    console.error('Error in detectHandLandmarks:', err);
    return null;
  }
}
