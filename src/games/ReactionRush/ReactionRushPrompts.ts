import type { ReactionPrompt } from './ReactionRushGameTypes';

export const REACTION_PROMPTS: ReactionPrompt[] = [
  {
    id: 'raise-left',
    detectorKey: 'raise-left-hand',
    promptText: 'RAISE YOUR LEFT HAND',
    iconName: 'Hand',
    instruction: 'Raise your LEFT hand high above your shoulder!'
  },
  {
    id: 'raise-right',
    detectorKey: 'raise-right-hand',
    promptText: 'RAISE YOUR RIGHT HAND',
    iconName: 'Hand',
    instruction: 'Raise your RIGHT hand high above your shoulder!'
  },
  {
    id: 'raise-both',
    detectorKey: 'raise-both-hands',
    promptText: 'RAISE BOTH HANDS',
    iconName: 'Sparkles',
    instruction: 'Raise BOTH hands high into the air!'
  },
  {
    id: 'touch-head',
    detectorKey: 'touch-head',
    promptText: 'TOUCH YOUR HEAD',
    iconName: 'UserCheck',
    instruction: 'Touch your head or ears with your hand!'
  },
  {
    id: 'crouch',
    detectorKey: 'crouch',
    promptText: 'CROUCH DOWN',
    iconName: 'ArrowDown',
    instruction: 'Squat or crouch low towards the ground!'
  },
  {
    id: 'wave',
    detectorKey: 'wave',
    promptText: 'WAVE YOUR ARMS',
    iconName: 'Zap',
    instruction: 'Wave your arm rapidly side-to-side!'
  },
  {
    id: 'move-left',
    detectorKey: 'move-left',
    promptText: 'MOVE LEFT',
    iconName: 'ArrowLeft',
    instruction: 'Dodge or step to your LEFT!'
  },
  {
    id: 'move-right',
    detectorKey: 'move-right',
    promptText: 'MOVE RIGHT',
    iconName: 'ArrowRight',
    instruction: 'Dodge or step to your RIGHT!'
  }
];

export function getRandomReactionPrompts(count: number): ReactionPrompt[] {
  const shuffled = [...REACTION_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
