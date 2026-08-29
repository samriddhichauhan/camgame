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
    tagline: 'Punch the ice. Break the most.',
    description: 'Arcade ice-smashing action! Punch floating 3D ice cubes with your virtual fists to shatter blocks and rack up combo points before time runs out.',
    gameNumber: '02',
    focus: 'Physical Punching',
    detectionType: 'VIRTUAL FIST COLLISION',
    supportedModes: ['SINGLE_PLAYER', 'TWO_PLAYERS'],
  },
  {
    id: 'reaction-rush',
    name: 'Reaction Rush',
    tagline: 'React first. Win first.',
    description: 'A lightning speed race! When visual action prompts appear on screen, react faster than time runs out to score maximum points.',
    gameNumber: '03',
    focus: 'Speed & Reaction',
    detectionType: 'RAPID GESTURE DETECTION',
    supportedModes: ['SINGLE_PLAYER', 'TWO_PLAYERS'],
  },
];
