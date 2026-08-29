// Public types for the VYBE vision pipeline.
// Game code should only ever import from here — never from @mediapipe/tasks-vision directly.

export interface BodyLandmark {
  x: number; // Normalized 0-1 (horizontal, from camera left)
  y: number; // Normalized 0-1 (vertical, from camera top)
  z: number; // Normalized depth representation
  visibility: number; // Detection confidence
  name: string; // Joint name identifier (e.g. 'left_shoulder')
}

export interface PlayerBoundingBox {
  x: number; // Left edge, normalized 0-1
  y: number; // Top edge, normalized 0-1
  width: number; // Normalized 0-1
  height: number; // Normalized 0-1
}

// Raw output of the PERSON DETECTION stage, before any identity tracking.
export interface PersonDetection {
  id: number;
  boundingBox: PlayerBoundingBox;
  confidence: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export type TrackingState = 'tracked' | 'lost';

// A tracked, identity-stable player produced by the TRACKING stage,
// carrying the POSE ESTIMATION stage's landmarks for that person.
export interface TrackedPlayer {
  id: 'player-1' | 'player-2';
  playerIndex: 1 | 2; // Same value as `id`, kept for existing game-scoring code
  confidence: number;
  boundingBox: PlayerBoundingBox;
  centerPoint: { x: number; y: number };
  bodyLandmarks: BodyLandmark[];
  visibility: number;
  trackingState: TrackingState;
}

export interface VisionFrame {
  timestamp: number;
  players: TrackedPlayer[];
}

// High-level state machine the UI renders against. Replaces ad-hoc
// "step into the frame" booleans scattered across screens.
export type VisionPhase =
  | 'VISION_INITIALIZING'
  | 'NO_PLAYERS'
  | 'ONE_PLAYER'
  | 'TWO_PLAYERS'
  | 'TRACKING_LOST'
  | 'CAMERA_ERROR'
  | 'MODEL_ERROR';

export interface VisionDebugPlayerStats {
  id: 'player-1' | 'player-2';
  confidence: number;
  trackingState: TrackingState;
}

export interface VisionDebugStats {
  cameraReady: boolean;
  resolutionWidth: number;
  resolutionHeight: number;
  visionRunning: boolean;
  fps: number;
  personDetectionCount: number;
  trackedPlayerCount: number;
  requiredPlayers: number;
  gameReady: boolean;
  players: VisionDebugPlayerStats[];
}

export interface VisionErrorInfo {
  type: 'camera' | 'model' | 'inference';
  message: string;
}
