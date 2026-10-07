import type { Part } from '../lib/types';
import { calloutAt, easeOut, prog, T } from '../film';

type Props = {
  parts: Part[];
  w: number;
  h: number;
  now: number;
  revealAt: number;
  selected: number | null;
  selectedAt: number;
  onSelect: (i: number) => void;
};

type Layout = { i: number; cx: number; cy: number; side: 'L' | 'R'; ly: number; edge: number; elbow: number; len: number };

/** Places one label per part on the left or right edge, sorted and spaced so labels never overlap. */
function layout(parts: Part[], w: number, h: number, pillW: number, pitch: number, margin: number): Layout[] {
  const pts = parts.map((p, i) => ({ i, cx: (p.box.x + p.box.w / 2) * w, cy: (p.box.y + p.box.h / 2) * h }));
  // Push dots that sit on top of each other apart, so every number stays readable.
  const minD = 34;
  for (let it = 0; it < 30; it++) {
    for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
      const dx = pts[b].cx - pts[a].cx, dy = pts[b].cy - pts[a].cy, d = Math.hypot(dx, dy) || 0.01;
      if (d < minD) {
        const push = (minD - d) / 2, ux = d > 0.01 ? dx / d : 1, uy = d > 0.01 ? dy / d : 0;
        pts[a].cx -= ux * push; pts[a].cy -= uy * push; pts[b].cx += ux * push; pts[b].cy += uy * push;
      }
    }
  }
  // Each label goes to the side its dot is on, then the busier side gives its most central parts away.
  const left = pts.filter((p) => p.cx < w / 2), right = pts.filter((p) => p.cx >= w / 2);
  const centre = (p: { cx: number }) => Math.abs(p.cx - w / 2);
  while (Math.abs(left.length - right.length) > 2) {
    const [from, to] = left.length > right.length ? [left, right] : [right, left];
    from.sort((a, b) => centre(a) - centre(b));
    to.push(from.shift()!);
  }
  const out: Layout[] = [];
  for (const side of ['L', 'R'] as const) {
    const group = (side === 'L' ? left : right).sort((a, b) => a.cy - b.cy);
    const top = margin + pitch / 2, bottom = h - margin - pitch / 2;
    // Dots that sit inside this label column are obstacles: labels move below them.
    const colA = side === 'L' ? margin - 14 : w - margin - pillW - 14, colB = colA + pillW + 28;
    const obstacles = pts.filter((p) => p.cx > colA && p.cx < colB).map((p) => p.cy);
    const clear = (y: number) => { for (const oy of obstacles) if (Math.abs(y - oy) < pitch / 2 + 6) return oy + pitch / 2 + 8; return y; };
    const ys = group.map((g) => clear(Math.min(bottom, Math.max(top, g.cy))));
    for (let k = 1; k < ys.length; k++) ys[k] = clear(Math.max(ys[k], ys[k - 1] + pitch));
    for (let k = ys.length - 1; k >= 0; k--) {
      const limit = k === ys.length - 1 ? bottom : ys[k + 1] - pitch;
      ys[k] = Math.min(ys[k], limit);
    }
    // Swap neighbouring label slots whose leader lines would cross.
    const edgeX = side === 'L' ? margin + pillW + 22 : w - margin - pillW - 22;
    const cross = (a: { cx: number; cy: number }, ya: number, b: { cx: number; cy: number }, yb: number) => {
      const d = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
      const d1 = d(a.cx, a.cy, edgeX, ya, b.cx, b.cy), d2 = d(a.cx, a.cy, edgeX, ya, edgeX, yb);
      const d3 = d(b.cx, b.cy, edgeX, yb, a.cx, a.cy), d4 = d(b.cx, b.cy, edgeX, yb, edgeX, ya);
      return d1 * d2 < 0 && d3 * d4 < 0;
    };
    for (let pass = 0; pass < group.length; pass++) {
      let swapped = false;
      for (let k = 0; k + 1 < group.length; k++) {
        if (cross(group[k], ys[k], group[k + 1], ys[k + 1])) { [group[k], group[k + 1]] = [group[k + 1], group[k]]; swapped = true; }
      }
      if (!swapped) break;
    }
    group.forEach((g, k) => {
      const edge = side === 'L' ? margin + pillW : w - margin - pillW;
      const elbow = side === 'L' ? edge + 22 : edge - 22;
      const len = Math.abs(elbow - edge) + Math.hypot(g.cx - elbow, g.cy - ys[k]);
      out.push({ ...g, side, ly: ys[k], edge, elbow, len });
    });
  }
  return out.sort((a, b) => a.i - b.i);
}

export function Overlay({ parts, w, h, now, revealAt, selected, selectedAt, onSelect }: Props) {
  const compact = w < 760;
  const pillW = compact ? 150 : 218;
  const pitch = compact ? 44 : 62;
  const margin = compact ? 10 : 22;
  const items = layout(parts, w, h, pillW, pitch, margin);
  const selP = selected === null ? 0 : easeOut(prog(now, selectedAt, 380));

  return (
    <div className="overlay" style={{ width: w, height: h }}>
      <svg className="overlay-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {selected !== null && parts[selected] && (() => {
          const b = parts[selected].box;
          const x = b.x * w, y = b.y * h, bw = b.w * w, bh = b.h * h;
          const c = Math.min(22, bw / 3, bh / 3);
          const d = `M${x},${y + c}V${y}H${x + c} M${x + bw - c},${y}H${x + bw}V${y + c} M${x + bw},${y + bh - c}V${y + bh}H${x + bw - c} M${x + c},${y + bh}H${x}V${y + bh - c}`;
          return (
            <g style={{ opacity: selP }}>
              <rect x={x} y={y} width={bw} height={bh} rx={6} className="sel-box" />
              <path d={d} className="sel-corners" />
            </g>
          );
        })()}
        {items.map((it) => {
          const start = revealAt + calloutAt(it.i);
          const dotP = easeOut(prog(now, start, 220));
          const lineP = easeOut(prog(now, start + 120, T.line));
          if (dotP <= 0) return null;
          const dim = selected !== null && selected !== it.i ? 1 - 0.65 * selP : 1;
          const active = selected === it.i;
          const d = `M${it.cx},${it.cy}L${it.elbow},${it.ly}L${it.edge},${it.ly}`;
          return (
            <g key={it.i} style={{ opacity: dim }} className={active ? 'callout active' : 'callout'}>
              <path d={d} className="leader-shadow" strokeDasharray={it.len} strokeDashoffset={it.len * (1 - lineP)} />
              <path d={d} className="leader" strokeDasharray={it.len} strokeDashoffset={it.len * (1 - lineP)} />
            </g>
          );
        })}
      </svg>
      {items.map((it) => {
        const p = parts[it.i];
        const start = revealAt + calloutAt(it.i) + 120 + T.line * 0.7;
        const lp = easeOut(prog(now, start, T.label));
        if (lp <= 0) return null;
        const dim = selected !== null && selected !== it.i ? 1 - 0.65 * selP : 1;
        const shift = (1 - lp) * (it.side === 'L' ? -10 : 10);
        return (
          <button
            key={it.i}
            type="button"
            className={`label ${it.side === 'L' ? 'left' : 'right'} ${selected === it.i ? 'active' : ''}`}
            style={{ top: it.ly, width: pillW, [it.side === 'L' ? 'left' : 'right']: margin, opacity: lp * dim, transform: `translate(${shift}px, -50%)` }}
            onClick={() => onSelect(it.i)}
            aria-label={`Part ${it.i + 1}: ${p.name}`}
            tabIndex={-1}
          >
            <span className="label-num">{it.i + 1}</span>
            <span className="label-text">
              <span className="label-name">{p.name}</span>
              <span className="label-proc">{p.internal ? 'inside · ' : ''}{p.process}</span>
            </span>
          </button>
        );
      })}
      <svg className="overlay-svg dots" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {items.map((it) => {
          const dotP = easeOut(prog(now, revealAt + calloutAt(it.i), 220));
          if (dotP <= 0) return null;
          const dim = selected !== null && selected !== it.i ? 1 - 0.65 * selP : 1;
          const active = selected === it.i;
          const ph = ((now - selectedAt) % 1400) / 1400;
          return (
            <g key={it.i} style={{ opacity: dim }} className={active ? 'callout active' : 'callout'}>
              {active && <circle cx={it.cx} cy={it.cy} r={13 + 14 * ph} className="pulse" style={{ opacity: 1 - ph }} />}
              <g transform={`translate(${it.cx} ${it.cy}) scale(${dotP})`} onClick={() => onSelect(it.i)} className="dot-hit">
                <circle r={compact ? 10 : 13} className={parts[it.i].internal ? 'dot internal' : 'dot'} />
                <text className="dot-num" dy="0.35em" textAnchor="middle">{it.i + 1}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
