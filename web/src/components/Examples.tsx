import { SAMPLES, sampleImage } from '../lib/samples';

type Props = { active: string | null; onPick: (id: string) => void; compact?: boolean };

/** "Try an example": five objects with saved results, no upload needed. */
export function Examples({ active, onPick, compact }: Props) {
  return (
    <nav className={compact ? 'examples compact' : 'examples'} aria-label="Try an example">
      <span className="examples-k">Try an example</span>
      <div className="examples-row">
        {SAMPLES.map((s) => (
          <button key={s.id} type="button" data-sample={s.id} className={active === s.id ? 'ex active' : 'ex'} onClick={() => onPick(s.id)} aria-label={`Example: ${s.label}`}>
            <img src={sampleImage(s.id)} alt="" loading="eager" />
            {!compact && <span>{s.label}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
