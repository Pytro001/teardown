// Confidence wording shown on every part. Under 0.6 is a best guess.
export function confidenceLabel(c: number): { word: string; tone: 'high' | 'mid' | 'low' } {
  if (c >= 0.8) return { word: 'Confident', tone: 'high' };
  if (c >= 0.6) return { word: 'Likely', tone: 'mid' };
  return { word: 'Best guess', tone: 'low' };
}
