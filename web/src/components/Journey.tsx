import type { JourneyStep } from '../lib/types';
import { easeOut, prog, T } from '../film';

const ICONS: Record<string, string> = {
  'raw material': 'M10 40l10-18 8 10 6-8 12 16z M22 14a4 4 0 1 0 0.1 0',
  refining: 'M28 8c6 8 10 13 10 20a10 10 0 0 1-20 0c0-5 3-8 5-11 1 4 3 6 5 6-2-5-1-10 0-15z',
  parts: 'M28 14a14 14 0 1 0 0.1 0 M28 22a6 6 0 1 0 0.1 0 M28 8v6 M28 42v6 M8 28h6 M42 28h6',
  assembly: 'M12 40l16-16 M30 22l6-6a6 6 0 0 0 8 8l-6 6z M10 42l4 4',
  testing: 'M14 28l9 9 19-19',
  shipping: 'M10 18h24v20H10z M34 24h8l6 7v7H34 M16 42a3 3 0 1 0 0.1 0 M40 42a3 3 0 1 0 0.1 0',
  desk: 'M8 40h40 M14 40v8 M42 40v8 M30 40V22l8-8 M38 14l5 5'
};

type Props = { steps: JourneyStep[]; now: number; startAt: number };

/** "How it is made": raw material to desk, one step after another. */
export function Journey({ steps, now, startAt }: Props) {
  const lineP = easeOut(prog(now, startAt, 300 + steps.length * T.journeyGap + 400));
  return (
    <section className="journey" aria-label="How it is made">
      <h2 className="journey-title" style={{ opacity: easeOut(prog(now, startAt, 400)) }}>How it is made</h2>
      <div className="journey-track" style={{ ['--n' as string]: steps.length }}>
        <div className="journey-line"><span style={{ width: `${lineP * 100}%` }} /></div>
        {steps.map((s, i) => {
          const p = easeOut(prog(now, startAt + 200 + i * T.journeyGap, 500));
          return (
            <div className="step" key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
              <div className="step-icon" aria-hidden="true">
                <svg viewBox="0 0 56 56"><path d={ICONS[s.stage] || ICONS.parts} /></svg>
              </div>
              <div className="step-n">{String(i + 1).padStart(2, '0')} <span>{s.stage}</span></div>
              <div className="step-title">{s.title}</div>
              <div className="step-detail">{s.detail}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
