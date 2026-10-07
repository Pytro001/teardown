import { useRef, useState } from 'react';

type Props = { onFile: (f: File) => void; error: string | null; forceOver?: boolean };

/** The first screen: one big target for a photo. Click, Enter, drag and drop, or the phone camera. */
export function DropZone({ onFile, error, forceOver }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      className={`dropzone ${over || forceOver ? 'over' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Choose a photo of an object"
      onClick={() => input.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
    >
      <svg className="dz-icon" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="8" y="16" width="48" height="36" rx="8" />
        <path d="M24 16l4-6h8l4 6" />
        <circle cx="32" cy="34" r="10" />
        <circle cx="32" cy="34" r="3" className="fill" />
      </svg>
      <div className="dz-title">Drop a photo of any object</div>
      <div className="dz-sub">or click to choose one. On a phone you can take one with the camera.</div>
      {error && <div className="dz-error" role="alert">{error}</div>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
