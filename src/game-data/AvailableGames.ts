export interface GameDefinition {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  gameNumber: string;
}

export const availableGames: GameDefinition[] = [
  {
    id: 'ice-breaker',
    name: 'Ice Breaker',
    shortDescription: 'React fast. Match the challenge.',
    description: 'Perform physical actions and poses in front of the camera under time pressure! Copy movements like raising hands, crouching, or pointing.',
    gameNumber: '01',
  },
  {
    id: 'hand-battle',
    name: 'Hand Battle',
    shortDescription: 'Rock. Paper. Scissors. Your hands are the controller.',
    description: 'Compete in a classic duel using pure hand gesture detection. Face off in Rock, Paper, Scissors using your actual hands!',
    gameNumber: '02',
  },
  {
    id: 'mirror-dance',
    name: 'Mirror Dance',
    shortDescription: 'Copy the move. Beat the score.',
    description: 'A movement-matching rhythm game! One player strikes poses, and the other must copy the body posture perfectly to stay in sync.',
    gameNumber: '03',
  },
];
