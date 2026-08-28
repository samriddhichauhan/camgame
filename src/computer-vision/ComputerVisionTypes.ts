export interface BodyLandmark {
  x: number; // Normalized 0-1 (horizontal, from camera left)
  y: number; // Normalized 0-1 (vertical, from camera top)
  z: number; // Normalized depth representation
  visibility: number; // Detection confidence
  name: string; // Joint name identifier (e.g. 'left_shoulder')
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface DetectedHand {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
  score: number; // Tracking confidence
}

export interface PlayerBoundingBox {
  x: number; // Left edge, normalized 0-1
  y: number; // Top edge, normalized 0-1
  width: number; // Bounding box width, normalized 0-1
  height: number; // Bounding box height, normalized 0-1
}

export interface DetectedPlayer {
  playerIndex: 1 | 2; // 1 = Screen Left, 2 = Screen Right
  bodyLandmarks: BodyLandmark[];
  leftHand: DetectedHand | null;
  rightHand: DetectedHand | null;
  boundingBox: PlayerBoundingBox;
  centerPoint: { x: number; y: number };
  visibility: number; // Average visibility confidence
}

export interface VisionState {
  cameraReady: boolean;
  visionReady: boolean;
  detectedPlayerCount: number;
  players: DetectedPlayer[];
  lastDetectionTime: number;
}
