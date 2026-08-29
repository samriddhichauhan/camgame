import type { BodyLandmark } from '../../computer-vision/ComputerVisionTypes';

export interface ComputerPose {
  id: string;
  name: string;
  description: string;
  emoji: string;
  landmarks: BodyLandmark[];
}

function makeLandmarks(overrides: Record<string, { x: number; y: number }>): BodyLandmark[] {
  // Base neutral standing pose coordinates in normalized [0, 1] space
  const defaultJoints: Record<string, { x: number; y: number }> = {
    nose: { x: 0.5, y: 0.18 },
    left_eye_inner: { x: 0.48, y: 0.16 },
    left_eye: { x: 0.47, y: 0.16 },
    left_eye_outer: { x: 0.46, y: 0.16 },
    right_eye_inner: { x: 0.52, y: 0.16 },
    right_eye: { x: 0.53, y: 0.16 },
    right_eye_outer: { x: 0.54, y: 0.16 },
    left_ear: { x: 0.44, y: 0.18 },
    right_ear: { x: 0.56, y: 0.18 },
    mouth_left: { x: 0.48, y: 0.22 },
    mouth_right: { x: 0.52, y: 0.22 },
    left_shoulder: { x: 0.38, y: 0.32 },
    right_shoulder: { x: 0.62, y: 0.32 },
    left_elbow: { x: 0.32, y: 0.48 },
    right_elbow: { x: 0.68, y: 0.48 },
    left_wrist: { x: 0.3, y: 0.64 },
    right_wrist: { x: 0.7, y: 0.64 },
    left_pinky: { x: 0.29, y: 0.66 },
    right_pinky: { x: 0.71, y: 0.66 },
    left_index: { x: 0.29, y: 0.66 },
    right_index: { x: 0.71, y: 0.66 },
    left_thumb: { x: 0.3, y: 0.64 },
    right_thumb: { x: 0.7, y: 0.64 },
    left_hip: { x: 0.42, y: 0.62 },
    right_hip: { x: 0.58, y: 0.62 },
    left_knee: { x: 0.42, y: 0.78 },
    right_knee: { x: 0.58, y: 0.78 },
    left_ankle: { x: 0.42, y: 0.92 },
    right_ankle: { x: 0.58, y: 0.92 },
    left_heel: { x: 0.42, y: 0.94 },
    right_heel: { x: 0.58, y: 0.94 },
    left_foot_index: { x: 0.41, y: 0.95 },
    right_foot_index: { x: 0.59, y: 0.95 },
  };

  const finalJoints = { ...defaultJoints, ...overrides };

  return Object.entries(finalJoints).map(([name, coords]) => ({
    name,
    x: coords.x,
    y: coords.y,
    z: 0,
    visibility: 1.0,
  }));
}

export const computerPosesLibrary: ComputerPose[] = [
  {
    id: 'both-hands-up',
    name: 'Both Hands Up',
    description: 'Raise both arms straight up into the air!',
    emoji: '🙌',
    landmarks: makeLandmarks({
      left_elbow: { x: 0.36, y: 0.2 },
      left_wrist: { x: 0.34, y: 0.08 },
      right_elbow: { x: 0.64, y: 0.2 },
      right_wrist: { x: 0.66, y: 0.08 },
    }),
  },
  {
    id: 'left-hand-up',
    name: 'Left Hand Up',
    description: 'Raise your left arm up, keep your right arm down!',
    emoji: '🙋‍♂️',
    landmarks: makeLandmarks({
      left_elbow: { x: 0.34, y: 0.2 },
      left_wrist: { x: 0.32, y: 0.08 },
      right_elbow: { x: 0.66, y: 0.48 },
      right_wrist: { x: 0.68, y: 0.64 },
    }),
  },
  {
    id: 'right-hand-up',
    name: 'Right Hand Up',
    description: 'Raise your right arm up high!',
    emoji: '🙋‍♀️',
    landmarks: makeLandmarks({
      left_elbow: { x: 0.34, y: 0.48 },
      left_wrist: { x: 0.32, y: 0.64 },
      right_elbow: { x: 0.66, y: 0.2 },
      right_wrist: { x: 0.68, y: 0.08 },
    }),
  },
  {
    id: 'arms-out',
    name: 'Arms Out',
    description: 'Extend both arms out straight to your sides like a T!',
    emoji: '🧍',
    landmarks: makeLandmarks({
      left_elbow: { x: 0.22, y: 0.32 },
      left_wrist: { x: 0.08, y: 0.32 },
      right_elbow: { x: 0.78, y: 0.32 },
      right_wrist: { x: 0.92, y: 0.32 },
    }),
  },
  {
    id: 'hands-on-head',
    name: 'Hands on Head',
    description: 'Touch both hands to the top of your head!',
    emoji: '🙆',
    landmarks: makeLandmarks({
      left_elbow: { x: 0.26, y: 0.22 },
      left_wrist: { x: 0.45, y: 0.14 },
      right_elbow: { x: 0.74, y: 0.22 },
      right_wrist: { x: 0.55, y: 0.14 },
    }),
  },
  {
    id: 'victory-pose',
    name: 'Victory Pose',
    description: 'Raise both arms outward in a huge V shape!',
    emoji: '✌️',
    landmarks: makeLandmarks({
      left_elbow: { x: 0.26, y: 0.22 },
      left_wrist: { x: 0.16, y: 0.08 },
      right_elbow: { x: 0.74, y: 0.22 },
      right_wrist: { x: 0.84, y: 0.08 },
    }),
  },
  {
    id: 'wide-stance',
    name: 'Wide Stance T-Pose',
    description: 'Spread your legs wide and extend your arms out!',
    emoji: '🤸',
    landmarks: makeLandmarks({
      left_elbow: { x: 0.22, y: 0.32 },
      left_wrist: { x: 0.08, y: 0.32 },
      right_elbow: { x: 0.78, y: 0.32 },
      right_wrist: { x: 0.92, y: 0.32 },
      left_knee: { x: 0.32, y: 0.78 },
      right_knee: { x: 0.68, y: 0.78 },
      left_ankle: { x: 0.24, y: 0.92 },
      right_ankle: { x: 0.76, y: 0.92 },
    }),
  },
  {
    id: 'left-high-right-out',
    name: 'L-Shape Pose',
    description: 'Left arm straight up, right arm straight out!',
    emoji: '🕺',
    landmarks: makeLandmarks({
      left_elbow: { x: 0.36, y: 0.2 },
      left_wrist: { x: 0.34, y: 0.08 },
      right_elbow: { x: 0.78, y: 0.32 },
      right_wrist: { x: 0.92, y: 0.32 },
    }),
  },
];

export function getRandomComputerPoses(count: number): ComputerPose[] {
  const shuffled = [...computerPosesLibrary].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
