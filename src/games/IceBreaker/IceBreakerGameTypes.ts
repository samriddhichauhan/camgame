export type IceBreakerStatus =
  | 'intro'
  | 'round-intro'
  | 'countdown'
  | 'playing'
  | 'game-over';

export type CubeState = 'active' | 'hit' | 'cracked' | 'breaking' | 'broken';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
}

export interface IceCubeData {
  id: string;
  x: number;
  y: number;
  radius: number;
  state: CubeState;
  crackProgress: number; // 0 to 1
  rotation: number;
  rotationSpeed: number;
  driftX: number;
  driftY: number;
  owner: 1 | 2;
  particles: Particle[];
}

export interface FistData {
  owner: 1 | 2;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPunching: boolean;
  lastHitAt: number;
}

export interface ScorePopup {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  createdAt: number;
}

export interface PlayerStats {
  score: number;
  combo: number;
  highestCombo: number;
  lastHitTime: number;
}
