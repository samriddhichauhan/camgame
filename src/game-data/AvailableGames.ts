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
    tagline: 'Copy the move. Match the pose.',
    description: 'One player acts as the Leader performing poses, while the other player copies them. VYBE compares body pose landmarks to calculate a Match Score from 0 to 100%.',
    gameNumber: '01',
    focus: 'Accuracy',
    detectionType: 'POSE MATCHING',
    supportedModes: ['SINGLE_PLAYER', 'TWO_PLAYERS'],
  },
  {
    id: 'ice-breaker',
    name: 'Ice Breaker',
    tagline: 'See it. Do it. Score it.',
    description: 'Players receive quick physical action challenges (raise left/right/both hands, touch head, crouch, wave) and must complete them before the timer runs out.',
    gameNumber: '02',
    focus: 'Following challenges',
    detectionType: 'ACTION DETECTION',
    supportedModes: ['SINGLE_PLAYER', 'TWO_PLAYERS'],
  },
  {
    id: 'reaction-rush',
    name: 'Reaction Rush',
    tagline: 'React first. Win first.',
    description: 'A speed race! When visual prompts like "JUMP!" or "MOVE LEFT!" appear, the player who reacts first and fastest wins the round.',
    gameNumber: '03',
    focus: 'Speed',
    detectionType: 'REACTION DETECTION',
    supportedModes: [],
  },
];
