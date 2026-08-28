import type { IceBreakerChallenge } from './IceBreakerGameTypes';

export const ICE_BREAKER_CHALLENGES: IceBreakerChallenge[] = [
  {
    id: 'hands-up',
    title: 'Hands Up!',
    instruction: 'Raise both hands above your shoulders',
    emoji: '🙌',
    detectorKey: 'HANDS_UP'
  },
  {
    id: 'hands-on-head',
    title: 'Hands on Head!',
    instruction: 'Place both hands near or on top of your head',
    emoji: '🙆',
    detectorKey: 'HANDS_ON_HEAD'
  },
  {
    id: 'arms-out',
    title: 'Arms Out!',
    instruction: 'Extend both arms fully to the sides',
    emoji: '↔️',
    detectorKey: 'ARMS_OUT'
  },
  {
    id: 'crouch',
    title: 'Crouch Down!',
    instruction: 'Lower your body significantly',
    emoji: '👇',
    detectorKey: 'CROUCH'
  },
  {
    id: 'one-hand-up',
    title: 'One Hand Up!',
    instruction: 'Raise at least one hand above your head',
    emoji: '🙋',
    detectorKey: 'ONE_HAND_UP'
  },
  {
    id: 'freeze',
    title: 'Freeze!',
    instruction: 'Hold completely still. Do not move!',
    emoji: '🥶',
    detectorKey: 'FREEZE'
  },
  {
    id: 'jump',
    title: 'Jump!',
    instruction: 'Jump up off the floor!',
    emoji: '🦘',
    detectorKey: 'JUMP'
  }
];

export function getRandomChallenges(count: number): IceBreakerChallenge[] {
  const selected: IceBreakerChallenge[] = [];
  const available = [...ICE_BREAKER_CHALLENGES];

  for (let i = 0; i < count; i++) {
    if (available.length === 0) {
      // Refill if we empty the pool (shouldn't happen for 5 rounds out of 7 challenges)
      available.push(...ICE_BREAKER_CHALLENGES);
    }

    // Pick random index
    const randIdx = Math.floor(Math.random() * available.length);
    const challenge = available.splice(randIdx, 1)[0];

    // Avoid immediate repeat
    if (selected.length > 0 && selected[selected.length - 1].id === challenge.id && available.length > 0) {
      // Pick another one if possible
      const anotherIdx = Math.floor(Math.random() * available.length);
      const anotherChallenge = available.splice(anotherIdx, 1)[0];
      available.push(challenge); // Return first pick to pool
      selected.push(anotherChallenge);
    } else {
      selected.push(challenge);
    }
  }

  return selected;
}
