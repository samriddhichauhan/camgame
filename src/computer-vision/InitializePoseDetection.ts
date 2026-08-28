import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export async function initializePoseDetection(): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
  );
  return await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 2,
    minPoseDetectionConfidence: 0.35,
    minPosePresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
  });
}
