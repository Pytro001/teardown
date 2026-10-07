import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Photo } from '../lib/types';
import { easeOut, prog } from '../film';

type Props = {
  photo: Photo;
  photoAt: number;
  now: number;
  scanning: boolean;
  dimmed: boolean;
  message: string | null;
  children: (size: { w: number; h: number }) => ReactNode;
};

/** The photo, fitted inside the stage, with the scanning sweep and the overlay on top. */
export function Stage({ photo, photoAt, now, scanning, dimmed, message, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const s = box.w && box.h ? Math.min(box.w / photo.w, box.h / photo.h) : 0;
  const w = Math.floor(photo.w * s), h = Math.floor(photo.h * s);
  const inP = easeOut(prog(now, photoAt, 650));
  const sweep = ((now - photoAt) % 1700) / 1700;

  return (
    <div className="stage" ref={ref}>
      {s > 0 && (
        <div className="photo" style={{ width: w, height: h, opacity: inP, transform: `scale(${0.96 + 0.04 * inP})` }}>
          <img src={photo.url} alt="Your photo" draggable={false} style={{ filter: dimmed ? 'brightness(0.86) saturate(0.9)' : undefined }} />
          {scanning && (
            <div className="scan" aria-hidden="true">
              <div className="scan-grid" />
              <div className="scan-line" style={{ top: `${sweep * 100}%` }} />
              <div className="scan-chip"><span className="spin" style={{ transform: `rotate(${(now / 3) % 360}deg)` }} />Looking inside...</div>
            </div>
          )}
          {!scanning && children({ w, h })}
          {message && <div className="photo-msg" role="alert">{message}</div>}
        </div>
      )}
    </div>
  );
}
