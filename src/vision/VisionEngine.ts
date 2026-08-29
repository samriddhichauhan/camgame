import type { ObjectDetector } from '@mediapipe/tasks-vision';
import { startCameraStream } from '../camera/StartCameraStream';
import { stopCameraStream } from '../camera/StopCameraStream';
import { loadVisionFileset, initializePersonDetector, detectPersons } from './detection/PersonDetector';
import { initializeSinglePersonPoseLandmarker, PersonPoseEstimator } from './pose/PersonPoseEstimator';
import { padBoundingBox, cropPersonToCanvas } from './pose/CropPersonRegion';
import { PlayerTracker } from './tracking/PlayerTracker';
import type { VisionFrame, VisionPhase, VisionErrorInfo, VisionDebugStats, TrackedPlayer } from './types/VisionTypes';

// Target inference rate. Skipping frames rather than piling up inference
// calls keeps the main thread responsive on slower devices.
const TARGET_FPS = 24;
const MIN_FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

type EngineStatus = 'idle' | 'initializing' | 'running' | 'error';

const EMPTY_FRAME: VisionFrame = { timestamp: 0, players: [] };

class VisionEngine {
  private status: EngineStatus = 'idle';
  private error: VisionErrorInfo | null = null;
  private startPromise: Promise<void> | null = null;

  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  private personDetector: ObjectDetector | null = null;
  private poseP1: PersonPoseEstimator | null = null;
  private poseP2: PersonPoseEstimator | null = null;
  private cropCanvasP1 = document.createElement('canvas');
  private cropCanvasP2 = document.createElement('canvas');

  private tracker = new PlayerTracker();
  private rafId: number | null = null;
  private lastProcessedAt = 0;
  private frameTimestamps: number[] = [];

  private latestFrame: VisionFrame = EMPTY_FRAME;
  private latestPersonCount = 0;
  private phase: VisionPhase = 'VISION_INITIALIZING';

  private frameListeners = new Set<(frame: VisionFrame) => void>();
  private phaseListeners = new Set<(phase: VisionPhase) => void>();

  start(): Promise<void> {
    if (this.status === 'running') return Promise.resolve();
    if (this.startPromise) return this.startPromise;

    this.startPromise = this.doStart().finally(() => {
      this.startPromise = null;
    });
    return this.startPromise;
  }

  private async doStart(): Promise<void> {
    this.status = 'initializing';
    this.error = null;
    this.setPhase('VISION_INITIALIZING');

    try {
      this.stream = await startCameraStream();
    } catch (err) {
      this.error = { type: 'camera', message: err instanceof Error ? err.message : 'CAMERA_ERROR' };
      this.status = 'error';
      this.setPhase('CAMERA_ERROR');
      throw err;
    }

    try {
      this.videoElement = await createHiddenVideoElement(this.stream);

      const vision = await loadVisionFileset();
      const [detector, landmarkerP1, landmarkerP2] = await Promise.all([
        initializePersonDetector(vision),
        initializeSinglePersonPoseLandmarker(vision),
        initializeSinglePersonPoseLandmarker(vision),
      ]);

      this.personDetector = detector;
      this.poseP1 = new PersonPoseEstimator(landmarkerP1);
      this.poseP2 = new PersonPoseEstimator(landmarkerP2);
      this.tracker.reset();

      this.status = 'running';
      this.setPhase('NO_PLAYERS');
      this.rafId = requestAnimationFrame(this.loop);
    } catch (err) {
      console.error('VisionEngine model init failed:', err);
      this.error = { type: 'model', message: err instanceof Error ? err.message : 'MODEL_INIT_FAILED' };
      this.status = 'error';
      this.setPhase('MODEL_ERROR');
      stopCameraStream(this.stream);
      this.stream = null;
      throw err;
    }
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    stopCameraStream(this.stream);
    this.stream = null;

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.remove();
      this.videoElement = null;
    }

    this.personDetector?.close();
    this.personDetector = null;
    this.poseP1?.close();
    this.poseP1 = null;
    this.poseP2?.close();
    this.poseP2 = null;

    this.tracker.reset();
    this.latestFrame = EMPTY_FRAME;
    this.latestPersonCount = 0;
    this.frameTimestamps = [];
    this.status = 'idle';
    this.error = null;
    this.setPhase('VISION_INITIALIZING');
  }

  subscribe(cb: (frame: VisionFrame) => void): () => void {
    this.frameListeners.add(cb);
    return () => this.frameListeners.delete(cb);
  }

  subscribePhase(cb: (phase: VisionPhase) => void): () => void {
    this.phaseListeners.add(cb);
    return () => this.phaseListeners.delete(cb);
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  getPhase(): VisionPhase {
    return this.phase;
  }

  getError(): VisionErrorInfo | null {
    return this.error;
  }

  getLatestFrame(): VisionFrame {
    return this.latestFrame;
  }

  getDebugStats(requiredPlayers: 1 | 2): VisionDebugStats {
    const now = performance.now();
    const recentTimestamps = this.frameTimestamps.filter((t) => now - t <= 1000);
    return {
      cameraReady: !!this.stream,
      resolutionWidth: this.videoElement?.videoWidth ?? 0,
      resolutionHeight: this.videoElement?.videoHeight ?? 0,
      visionRunning: this.status === 'running',
      fps: recentTimestamps.length,
      personDetectionCount: this.latestPersonCount,
      trackedPlayerCount: this.latestFrame.players.length,
      requiredPlayers,
      gameReady: this.latestFrame.players.length >= requiredPlayers,
      players: this.latestFrame.players.map((p) => ({
        id: p.id,
        confidence: p.confidence,
        trackingState: p.trackingState,
      })),
    };
  }

  private setPhase(phase: VisionPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.phaseListeners.forEach((cb) => cb(phase));
  }

  private loop = (): void => {
    if (this.status !== 'running') return;

    const now = performance.now();
    if (now - this.lastProcessedAt >= MIN_FRAME_INTERVAL_MS) {
      this.lastProcessedAt = now;
      this.processFrame(now);
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private processFrame(now: number): void {
    const video = this.videoElement;
    const detector = this.personDetector;
    if (!video || !detector || !this.poseP1 || !this.poseP2) return;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return;

    const detections = detectPersons(detector, video, now);
    this.latestPersonCount = detections.length;

    const slots = this.tracker.update(detections, now);
    const players: TrackedPlayer[] = [];

    for (const slot of slots) {
      if (slot.state === 'empty') continue;

      if (slot.detection) {
        // Fresh detection matched this frame — run per-person pose estimation.
        const estimator = slot.id === 'player-1' ? this.poseP1 : this.poseP2;
        const cropCanvas = slot.id === 'player-1' ? this.cropCanvasP1 : this.cropCanvasP2;
        const paddedBox = padBoundingBox(slot.detection.boundingBox);
        cropPersonToCanvas(video, paddedBox, cropCanvas);
        const result = estimator.estimate(cropCanvas, paddedBox, now);

        if (result) {
          this.tracker.recordLandmarks(slot.id, result.landmarks, result.visibility);
          players.push({
            id: slot.id,
            playerIndex: slot.id === 'player-1' ? 1 : 2,
            confidence: slot.detection.confidence,
            boundingBox: result.boundingBox,
            centerPoint: { x: slot.detection.centerX, y: slot.detection.centerY },
            bodyLandmarks: result.landmarks,
            visibility: result.visibility,
            trackingState: 'tracked',
          });
        }
      } else if (slot.state === 'lost' && slot.landmarks && slot.boundingBox) {
        // In grace period — keep showing the last known pose, frozen.
        players.push({
          id: slot.id,
          playerIndex: slot.id === 'player-1' ? 1 : 2,
          confidence: slot.confidence,
          boundingBox: slot.boundingBox,
          centerPoint: { x: slot.boundingBox.x + slot.boundingBox.width / 2, y: slot.boundingBox.y + slot.boundingBox.height / 2 },
          bodyLandmarks: slot.landmarks,
          visibility: slot.visibility,
          trackingState: 'lost',
        });
      }
    }

    this.latestFrame = { timestamp: now, players };
    this.frameTimestamps.push(now);
    this.frameTimestamps = this.frameTimestamps.filter((t) => now - t <= 1000);

    const trackedCount = players.filter((p) => p.trackingState === 'tracked').length;
    const lostCount = players.filter((p) => p.trackingState === 'lost').length;

    if (trackedCount === 0 && lostCount > 0) {
      this.setPhase('TRACKING_LOST');
    } else if (trackedCount === 0) {
      this.setPhase('NO_PLAYERS');
    } else if (trackedCount === 1) {
      this.setPhase('ONE_PLAYER');
    } else {
      this.setPhase('TWO_PLAYERS');
    }

    this.frameListeners.forEach((cb) => cb(this.latestFrame));
  }
}

async function createHiddenVideoElement(stream: MediaStream): Promise<HTMLVideoElement> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  // Kept in the document (off-screen, not display:none) so browsers don't
  // throttle decoding of a fully detached / invisible element.
  video.style.position = 'fixed';
  video.style.left = '-9999px';
  video.style.width = '2px';
  video.style.height = '2px';
  video.srcObject = stream;
  document.body.appendChild(video);

  await new Promise<void>((resolve) => {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      resolve();
      return;
    }
    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('loadeddata', onReady);
        resolve();
      }
    };
    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('loadeddata', onReady);
  });

  await video.play().catch(() => {
    // Autoplay rejection is fine — metadata is already loaded and frames
    // still decode for canvas/MediaPipe consumption in supported browsers.
  });

  return video;
}

export const visionEngine = new VisionEngine();

// Safety net: always release the camera when the tab is closed/reloaded,
// even if no screen's explicit Back/Quit handler ran first.
window.addEventListener('pagehide', () => visionEngine.stop());
