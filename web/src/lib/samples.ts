// The five examples. Photos are AI generated; results are real cached model outputs.
export const SAMPLES = [
  { id: 'headphones', label: 'Headphones' },
  { id: 'kettle', label: 'Kettle' },
  { id: 'drill', label: 'Cordless drill' },
  { id: 'keyboard', label: 'Keyboard' },
  { id: 'pedal', label: 'Bicycle pedal' }
] as const;

export type SampleId = (typeof SAMPLES)[number]['id'];

export const sampleImage = (id: string) => `${import.meta.env.BASE_URL}samples/${id}.jpg`;
export const sampleResult = (id: string) => `${import.meta.env.BASE_URL}samples/${id}.json`;
