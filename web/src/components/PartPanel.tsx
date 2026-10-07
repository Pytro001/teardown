import { useEffect, useRef } from 'react';
import type { Teardown, Usage } from '../lib/types';
import { confidenceLabel } from '../lib/confidence';
import { calloutAt, easeOut, prog, T } from '../film';

type Props = {
  data: Teardown;
  now: number;
  revealAt: number;
  selected: number | null;
  selectedAt: number;
  onSelect: (i: number | null) => void;
  source: { kind: 'sample' | 'live'; usage?: Usage; ms?: number };
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Object name, the numbered part list, and the card for the selected part. */
export function PartPanel({ data, now, revealAt, selected, selectedAt, onSelect, source }: Props) {
  const titleP = easeOut(prog(now, revealAt, 500));
  const listRef = useRef<HTMLOListElement>(null);
  const part = selected !== null ? data.parts[selected] : null;
  const cardP = easeOut(prog(now, selectedAt, 420));

  useEffect(() => {
    if (selected === null) return;
    const el = listRef.current?.querySelectorAll('button')[selected] as HTMLButtonElement | undefined;
    if (el && document.activeElement?.closest('.parts')) el.focus();
  }, [selected]);

  const onKey = (e: React.KeyboardEvent) => {
    const n = data.parts.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const cur = selected ?? (e.key === 'ArrowDown' ? -1 : n);
      onSelect((cur + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (e.key === 'Escape') onSelect(null);
  };

  const conf = part ? confidenceLabel(part.confidence) : null;

  return (
    <aside className="panel" aria-label="Parts">
      <div className="panel-head" style={{ opacity: titleP, transform: `translateY(${(1 - titleP) * 8}px)` }}>
        <h2 className="object-name">{data.object}</h2>
        <p className="object-summary">{data.summary}</p>
      </div>

      <ol className="parts" ref={listRef} onKeyDown={onKey}>
        {data.parts.map((p, i) => {
          const lp = easeOut(prog(now, revealAt + calloutAt(i) + 200, T.label + 120));
          const c = confidenceLabel(p.confidence);
          return (
            <li key={i} style={{ opacity: lp, transform: `translateX(${(1 - lp) * 12}px)` }}>
              <button type="button" className={selected === i ? 'part-row active' : 'part-row'} onClick={() => onSelect(selected === i ? null : i)} aria-pressed={selected === i}>
                <span className="row-num">{pad(i + 1)}</span>
                <span className="row-name">{p.name}</span>
                <span className={`row-conf ${c.tone}`} title={`${c.word}, ${Math.round(p.confidence * 100)}%`} />
              </button>
            </li>
          );
        })}
      </ol>
      <div className="legend" style={{ opacity: titleP }} aria-label="Confidence key">
        <span><i className="high" />Confident</span><span><i className="mid" />Likely</span><span><i className="low" />Best guess</span>
      </div>

      <div className="card-slot">
        {part && conf ? (
          <article className="card" key={selected} style={{ opacity: cardP, transform: `translateY(${(1 - cardP) * 14}px)` }} aria-live="polite">
            <header className="card-head">
              <span className="card-num">{pad(selected! + 1)}</span>
              <h3 className="card-name">{part.name}</h3>
              {part.internal && <span className="tag">inside</span>}
            </header>
            <dl className="card-grid">
              <dt>Material</dt>
              <dd>{part.material}</dd>
              <dt>Made by</dt>
              <dd><span className="proc">{part.process}</span><span className="proc-detail">{part.process_detail}</span></dd>
              <dt>Confidence</dt>
              <dd className="conf">
                <span className={`conf-word ${conf.tone}`}>{conf.word}</span>
                <span className="conf-bar"><span className={conf.tone} style={{ width: `${part.confidence * 100 * cardP}%` }} /></span>
                <span className="conf-num">{part.confidence.toFixed(2)}</span>
              </dd>
            </dl>
            <p className="fact"><span className="fact-k">Did you know</span>{part.fun_fact}</p>
          </article>
        ) : (
          <div className="card-hint" style={{ opacity: titleP }}>Tap a part to see what it is made of and how.</div>
        )}
      </div>

      <footer className="panel-foot">
        {source.kind === 'sample'
          ? 'Example. Saved answer from Claude Sonnet 4.5 on Amazon Bedrock.'
          : `Claude Sonnet 4.5 on Amazon Bedrock · ${source.usage?.inputTokens ?? 0} in / ${source.usage?.outputTokens ?? 0} out tokens · ${((source.ms ?? 0) / 1000).toFixed(1)} s`}
      </footer>
    </aside>
  );
}
