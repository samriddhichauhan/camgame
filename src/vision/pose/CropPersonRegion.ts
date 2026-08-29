import type { PlayerBoundingBox } from '../types/VisionTypes';

// Extra margin around a person's detected box before cropping for pose
// estimation, so gestures that extend past the torso box (arms out, jump)
// aren't clipped out of frame.
const PADDING_RATIO = 0.25;

const CROP_SIZE = 256;

export type PaddedBox = PlayerBoundingBox;

export function padBoundingBox(box: PlayerBoundingBox): PaddedBox {
  const padX = box.width * PADDING_RATIO;
  const padY = box.height * PADDING_RATIO;
  const x = Math.max(0, box.x - padX);
  const y = Math.max(0, box.y - padY);
  const width = Math.min(1 - x, box.width + padX * 2);
  const height = Math.min(1 - y, box.height + padY * 2);
  return { x, y, width, height };
}

/**
 * Crops the padded region of `video` into `targetCanvas` (reused across
 * frames to avoid per-frame canvas allocation) for single-person pose
 * estimation.
 */
export function cropPersonToCanvas(
  video: HTMLVideoElement,
  paddedBox: PaddedBox,
  targetCanvas: HTMLCanvasElement
): void {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (targetCanvas.width !== CROP_SIZE || targetCanvas.height !== CROP_SIZE) {
    targetCanvas.width = CROP_SIZE;
    targetCanvas.height = CROP_SIZE;
  }

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const srcX = paddedBox.x * vw;
  const srcY = paddedBox.y * vh;
  const srcW = paddedBox.width * vw;
  const srcH = paddedBox.height * vh;

  ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);
}
