export interface PersonalBest {
  score: number;
  date: string;
}

export function getPersonalBest(gameId: string): PersonalBest | null {
  try {
    const data = localStorage.getItem(`vybe_pb_${gameId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read personal best from localStorage:', e);
  }
  return null;
}

export function savePersonalBest(gameId: string, score: number): boolean {
  try {
    const current = getPersonalBest(gameId);
    if (!current || score > current.score) {
      const newPb: PersonalBest = {
        score,
        date: new Date().toLocaleDateString()
      };
      localStorage.setItem(`vybe_pb_${gameId}`, JSON.stringify(newPb));
      return true; // New personal best recorded!
    }
  } catch (e) {
    console.error('Failed to save personal best to localStorage:', e);
  }
  return false;
}
