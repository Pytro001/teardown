import { useCallback, useEffect, useRef, useState } from 'react';
import type { Photo, Teardown, Usage } from './lib/types';
import { prepareFile, loadImage } from './lib/image';
import { requestTeardown } from './lib/api';
import { sampleImage, sampleResult } from './lib/samples';
import { clock, easeOut, FILM, prog, revealEnd, T, useNow } from './film';
import { DropZone } from './components/DropZone';
import { Stage } from './components/Stage';
import { Overlay } from './components/Overlay';
import { PartPanel } from './components/PartPanel';
import { Journey } from './components/Journey';
import { Examples } from './components/Examples';

type Shot = {
  photo: Photo;
  photoAt: number;
  sampleId: string | null;
  data: Teardown | null;
  readyAt: number | null;
  error: string | null;
  usage?: Usage;
  ms?: number;
};

const NO_PARTS = 'Could not find parts in this photo. Try one object, close up, good light.';
const SCAN_MIN = 1400;

export default function App() {
  const [shot, setShot] = useState<Shot | null>(null);
  const [sel, setSel] = useState<{ i: number | null; at: number }>({ i: null, at: 0 });
  const [dropError, setDropError] = useState<string | null>(null);
  const [caption, setCaption] = useState<{ text: string; at: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; down: boolean; at: number } | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; id: string } | null>(null);
  const [filmOver, setFilmOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const token = useRef(0);

  const data = shot?.data ?? null;
  const n = data?.parts.length ?? 0;
  const journeyAt = shot?.readyAt != null ? shot.readyAt + revealEnd(n) + T.journeyAfter : Infinity;
  const animating = !shot ? 0 : shot.readyAt == null || sel.i !== null ? Infinity : Math.max(journeyAt + 2000, sel.at + 1200);
  const now = useNow(animating);
  const scanning = !!shot && !shot.error && (shot.readyAt == null || now < shot.readyAt);
  const ready = !!shot && !!data && !scanning && data.parts.length > 0;

  const select = useCallback((i: number | null) => setSel({ i, at: clock.now() }), []);

  const onFile = useCallback(async (file: File) => {
    const my = ++token.current;
    setDropError(null);
    setSel({ i: null, at: 0 });
    let prepared;
    try { prepared = await prepareFile(file); } catch (e) { setDropError((e as Error).message); setShot(null); return; }
    const photoAt = clock.now();
    setShot({ photo: prepared.photo, photoAt, sampleId: null, data: null, readyAt: null, error: null });
    window.scrollTo({ top: 0 });
    try {
      const res = await requestTeardown(prepared.base64);
      if (my !== token.current) return;
      const none = res.result.object === 'none' || res.result.parts.length === 0;
      setShot((s) => s && ({ ...s, data: res.result, usage: res.usage, ms: res.ms, readyAt: Math.max(clock.now(), photoAt + SCAN_MIN), error: none ? NO_PARTS : null }));
    } catch (e) {
      if (my !== token.current) return;
      setShot((s) => s && ({ ...s, error: (e as Error).message }));
    }
  }, []);

  const pickSample = useCallback(async (id: string, scanMs = SCAN_MIN) => {
    const my = ++token.current;
    setSel({ i: null, at: 0 });
    setDropError(null);
    const url = sampleImage(id);
    const [img, json] = await Promise.all([loadImage(url), fetch(sampleResult(id)).then((r) => r.json())]);
    if (my !== token.current) return;
    const photoAt = clock.now();
    setShot({ photo: { url, w: img.naturalWidth, h: img.naturalHeight }, photoAt, sampleId: id, data: json.result, readyAt: photoAt + scanMs, error: null });
    if (!FILM) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const reset = useCallback(() => { token.current++; setShot(null); setSel({ i: null, at: 0 }); setDropError(null); }, []);

  // Film API: the recorder drives the clock and the actions frame by frame.
  useEffect(() => {
    if (!FILM) return;
    document.documentElement.classList.add('film');
    (window as any).__film = {
      setTime: (t: number) => clock.set(t),
      now: () => clock.now(),
      load: (id: string, scanMs = 2200) => pickSample(id, scanMs),
      select: (i: number | null) => select(i),
      reset,
      caption: (text: string | null) => setCaption(text ? { text, at: clock.now() } : null),
      cursor: (x: number | null, y = 0, down = false) => setCursor(x === null ? null : { x, y, down, at: clock.now() }),
      scrollTo: (y: number) => window.scrollTo(0, y),
      rect: (sel: string) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; },
      drag: (x: number | null, y = 0, id = '') => setDrag(x === null ? null : { x, y, id }),
      over: (v: boolean) => setFilmOver(v),
      dotRect: (i: number) => { const r = document.querySelectorAll('.dots .dot-hit')[i]?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; },
      labelRect: (i: number) => { const r = document.querySelectorAll('.label')[i]?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; },
      ready: true
    };
  }, [pickSample, select, reset]);

  // Drop a new photo anywhere once a result is showing.
  const onPageDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); };

  const capP = caption ? easeOut(prog(now, caption.at, 350)) : 0;

  return (
    <div className={shot ? 'app has-shot' : 'app'} onDragOver={(e) => e.preventDefault()} onDrop={shot ? onPageDrop : undefined}>
      <header className="top">
        <button type="button" className="brand" onClick={reset} aria-label="Teardown, start over">
          <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" /><circle cx="16" cy="16" r="3.2" className="fill" /><path d="M16 1v6M16 25v6M1 16h6M25 16h6" /></svg>
          <span>Teardown</span>
        </button>
        {shot && (
          <div className="top-right">
            <Examples compact active={shot.sampleId} onPick={(id) => pickSample(id)} />
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>New photo</button>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
          </div>
        )}
      </header>

      {!shot ? (
        <main className="hero">
          <h1>What is inside this?</h1>
          <p className="lede">Snap any object. See every part, what it is made of, and how it was made.</p>
          <DropZone onFile={onFile} error={dropError} forceOver={filmOver} />
          <Examples active={null} onPick={(id) => pickSample(id)} />
        </main>
      ) : (
        <>
          <main className="result">
            <div className="stage-col">
              <Stage photo={shot.photo} photoAt={shot.photoAt} now={now} scanning={scanning} dimmed={ready} message={shot.error}>
                {({ w, h }) => ready && data ? (
                  <Overlay parts={data.parts} w={w} h={h} now={now} revealAt={shot.readyAt!} selected={sel.i} selectedAt={sel.at} onSelect={(i) => select(sel.i === i ? null : i)} />
                ) : null}
              </Stage>
              <p className="note">AI estimate from one photo. Positions are approximate and every part shows how sure the model is.</p>
            </div>
            {ready && data ? (
              <PartPanel data={data} now={now} revealAt={shot.readyAt!} selected={sel.i} selectedAt={sel.at} onSelect={select}
                source={shot.sampleId ? { kind: 'sample' } : { kind: 'live', usage: shot.usage, ms: shot.ms }} />
            ) : (
              <aside className="panel panel-wait">
                {shot.error ? (
                  <div className="wait-error">
                    <p>{shot.error}</p>
                    <button type="button" className="btn" onClick={() => fileInput.current?.click()}>Try another photo</button>
                  </div>
                ) : (
                  <div className="wait">
                    {[0, 1, 2, 3, 4].map((k) => <div key={k} className="ghost" style={{ opacity: 0.35 + 0.35 * Math.sin((now - shot.photoAt) / 260 - k * 0.7) }} />)}
                  </div>
                )}
              </aside>
            )}
          </main>
          {ready && data && data.journey.length > 0 && <Journey steps={data.journey} startAt={journeyAt} />}
        </>
      )}

      {FILM && caption && <div className="caption" style={{ opacity: capP, transform: `translate(-50%, ${(1 - capP) * 10}px)` }}>{caption.text}</div>}
      {FILM && drag && <img className="drag-card" src={sampleImage(drag.id)} alt="" style={{ left: drag.x, top: drag.y }} />}
      {FILM && cursor && (
        <div className={cursor.down ? 'touch down' : 'touch'} style={{ left: cursor.x, top: cursor.y }}>
          {cursor.down && <span className="ripple" style={{ transform: `translate(-50%,-50%) scale(${0.4 + 1.4 * easeOut(prog(now, cursor.at, 450))})`, opacity: 1 - prog(now, cursor.at, 450) }} />}
        </div>
      )}
    </div>
  );
}
