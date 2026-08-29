import type { BodyLandmark } from '../../vision/types/VisionTypes';

export function averagePoseSamples(samples: BodyLandmark[][]): BodyLandmark[] {
  if (samples.length === 0) return [];
  
  const numLandmarks = samples[0].length;
  const averaged: BodyLandmark[] = [];

  for (let i = 0; i < numLandmarks; i++) {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let sumVis = 0;
    const name = samples[0][i].name;

    samples.forEach((sample) => {
      if (sample[i]) {
        sumX += sample[i].x;
        sumY += sample[i].y;
        sumZ += sample[i].z;
        sumVis += sample[i].visibility;
      }
    });

    averaged.push({
      x: sumX / samples.length,
      y: sumY / samples.length,
      z: sumZ / samples.length,
      visibility: sumVis / samples.length,
      name
    });
  }

  return averaged;
}
