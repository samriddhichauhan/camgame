import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import type { PersonDetection } from '../types/VisionTypes';

// The MediaPipe package doesn't export the `WasmFileset` type it declares —
// derive it from the resolver's own return type instead.
export type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

// EfficientDet-Lite0, COCO-trained (includes a "person" category). This model's
// only job is finding people — it never estimates a skeleton, so it stays
// reliable with 0, 1, or 2+ people standing normally in frame.
const MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite';

export async function loadVisionFileset(): Promise<VisionFileset> {
  return FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
  );
}

export async function initializePersonDetector(vision: VisionFileset): Promise<ObjectDetector> {
  return ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_PATH,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    categoryAllowlist: ['person'],
    scoreThreshold: 0.35,
    maxResults: 5,
  });
}

let lastTimestamp = -1;

export function detectPersons(
  detector: ObjectDetector,
  videoElement: HTMLVideoElement,
  timestamp: number
): PersonDetection[] {
  const vw = videoElement.videoWidth;
  const vh = videoElement.videoHeight;
  if (vw === 0 || vh === 0) return [];

  let safeTimestamp = timestamp;
  if (safeTimestamp <= lastTimestamp) {
    safeTimestamp = lastTimestamp + 1;
  }
  lastTimestamp = safeTimestamp;

  let result;
  try {
    result = detector.detectForVideo(videoElement, safeTimestamp);
  } catch (err) {
    console.error('Error in detectPersons:', err);
    return [];
  }

  return result.detections
    .filter((d) => !!d.boundingBox)
    .map((d, idx): PersonDetection => {
      const box = d.boundingBox!;
      const x = Math.max(0, box.originX / vw);
      const y = Math.max(0, box.originY / vh);
      const width = Math.min(1 - x, box.width / vw);
      const height = Math.min(1 - y, box.height / vh);
      const confidence = d.categories[0]?.score ?? 0;

      return {
        id: idx,
        boundingBox: { x, y, width, height },
        confidence,
        centerX: x + width / 2,
        centerY: y + height / 2,
        width,
        height,
      };
    });
}
