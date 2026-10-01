import { useEffect, useRef, useState } from 'react';
import { useJT } from './i18n';
import { useGarden } from './store';
import { Button, INK500 } from './ui';

/** Durée maximale d'une note vocale (s). */
export const MAX_VOICE_S = 120;

export interface VoiceClip {
  blob: Blob;
  duration: number;
  url: string;
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) if (MediaRecorder.isTypeSupported?.(m)) return m;
  return '';
}

const fmtS = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Enregistreur de notes vocales (micro de l'appareil, rien n'est envoyé). */
export function VoiceRecorder({ clips, onChange }: { clips: VoiceClip[]; onChange: (c: VoiceClip[]) => void }) {
  const { tt } = useJT();
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && pickMime() !== undefined;

  useEffect(
    () => () => {
      window.clearInterval(timer.current);
    },
    [],
  );

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        window.clearInterval(timer.current);
        const duration = (Date.now() - started.current) / 1000;
        const blob = new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' });
        if (blob.size > 0) onChange([...clips, { blob, duration, url: URL.createObjectURL(blob) }]);
        setRec(null);
      };
      started.current = Date.now();
      setElapsed(0);
      timer.current = window.setInterval(() => {
        const s = (Date.now() - started.current) / 1000;
        setElapsed(s);
        if (s >= MAX_VOICE_S && r.state === 'recording') r.stop();
      }, 250);
      r.start();
      setRec(r);
    } catch {
      setError(tt('voice.denied'));
    }
  };

  if (!supported) return <p className="text-xs" style={{ color: INK500 }}>{tt('voice.unsupported')}</p>;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {rec ? (
          <Button small kind="danger" onClick={() => rec.state === 'recording' && rec.stop()}>
            ■ {tt('voice.stop')} · {fmtS(elapsed)}
          </Button>
        ) : (
          <Button small kind="ghost" onClick={() => void start()} disabled={clips.length >= 3}>
            🎙 {tt('voice.record')}
          </Button>
        )}
        {rec && (
          <span className="text-xs" style={{ color: '#a5532f' }} aria-live="polite">
            ● {tt('voice.recording', { max: fmtS(MAX_VOICE_S) })}
          </span>
        )}
      </div>
      {clips.map((c, i) => (
        <div key={c.url} className="flex items-center gap-2">
          <audio controls src={c.url} className="h-8 max-w-full flex-1" aria-label={tt('voice.clip', { n: i + 1 })} />
          <button type="button" className="text-[11px] underline" style={{ color: INK500 }} onClick={() => onChange(clips.filter((x) => x !== c))}>
            {tt('common.delete')}
          </button>
        </div>
      ))}
      {error && (
        <p className="text-xs" style={{ color: '#a5532f' }}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Lecture d'une note vocale enregistrée. */
export function VoicePlayer({ id, n }: { id: string; n: number }) {
  const { photoURL } = useGarden();
  const { tt } = useJT();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void photoURL(id, 'full').then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [id, photoURL]);
  if (!url) return null;
  return <audio controls preload="metadata" src={url} className="h-8 w-full max-w-sm" aria-label={tt('voice.clip', { n })} />;
}
