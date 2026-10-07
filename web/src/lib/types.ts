export type Box = { x: number; y: number; w: number; h: number };

export type Part = {
  name: string;
  box: Box;
  internal?: boolean;
  material: string;
  process: string;
  process_detail: string;
  confidence: number;
  fun_fact: string;
};

export type JourneyStep = { stage: string; title: string; detail: string };

export type Teardown = { object: string; summary: string; parts: Part[]; journey: JourneyStep[] };

export type Usage = { inputTokens: number; outputTokens: number; costUsd?: number };

export type Photo = { url: string; w: number; h: number };
