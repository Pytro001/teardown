// One clock drives every animation. Normally it is real time; with ?film=1 the recorder
// sets the time frame by frame through window.__film, so the film is deterministic.
import { useEffect, useState, useSyncExternalStore } from 'react';

export const FILM = typeof location !== 'undefined' && new URLSearchParams(location.search).has('film');

let filmTime = 0;
const subs = new Set<() => void>();

export const clock = {
  now: () => (FILM ? filmTime : performance.now()),
  set(t: number) { filmTime = t; subs.forEach((f) => f()); },
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }
};

/** Current clock time. Re-renders every frame while `until` is in the future (real mode) or on every film step. */
export function useNow(until: number): number {
  const filmNow = useSyncExternalStore(clock.subscribe, () => filmTime);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (FILM) return;
    let raf = 0;
    const loop = () => {
      setTick((n) => n + 1);
      if (performance.now() < until) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [until]);
  return FILM ? filmNow : performance.now();
}

// Easing helpers shared by the components.
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
export const easeInOut = (v: number) => { const x = clamp01(v); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
/** Progress 0..1 of an animation that starts at `start` and lasts `dur` ms. */
export const prog = (now: number, start: number, dur: number) => clamp01((now - start) / dur);

// Reveal timing (ms after the result appears), shared by overlay, list and journey.
export const T = {
  title: 0,
  calloutStart: 350,
  calloutGap: 300,
  line: 480,
  label: 260,
  journeyAfter: 250,
  journeyGap: 170
};
export const calloutAt = (i: number) => T.calloutStart + i * T.calloutGap;
export const revealEnd = (n: number) => calloutAt(n) + T.line + T.label;
