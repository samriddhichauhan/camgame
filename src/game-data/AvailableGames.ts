import type { GameMode } from '../context/GameSessionContext';

export interface GameDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  gameNumber: string;
  focus: string;
  detectionType: string;
  supportedModes: GameMode[];
}

export const availableGames: GameDefinition[] = [
  {
    id: 'copy-cat',
    name: 'Copy Cat',
    tagline: 'Watch the move. Copy the move.',
    description: 'The leader strikes a pose. You copy it! VYBE evaluates your body pose landmarks in real-time to compute match accuracy.',
    gameNumber: '01',
    focus: 'Accuracy',
    detectionType: 'POSE MATCHING',
    supportedModes: ['SINGLE_PLAYER', 'TWO_PLAYERS'],
  },
  {
    id: 'ice-breaker',
    name: 'Ice Breaker',
    tagline: 'React fast. Break the ice. Score big.',
    description: 'Physical reaction challenges! Strike motion gestures (hand raises, head touch, crouch, wave) before time expires.',
    gameNumber: '02',
    focus: 'Reaction & Timing',
    detectionType: 'ACTION DETECTION',
    supportedModes: ['SINGLE_PLAYER', 'TWO_PLAYERS'],
  },
];
