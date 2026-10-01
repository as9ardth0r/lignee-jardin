import { useEffect, useRef, useState } from 'react';
import { useMelonT, type MelonKey } from './i18n';

/** Clé de stockage : le tutoriel ne s'ouvre seul qu'au premier lancement. */
const KEY = 'lignee.melon.tutorial.v1';

export function tutorialSeen(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'done';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(KEY, 'done');
  } catch {
    // best-effort
  }
}

const STEPS: Array<{ icon: string; key: string }> = [
  { icon: '🍈', key: 'welcome' },
  { icon: '🌼', key: 'flowers' },
  { icon: '🐝', key: 'cross' },
  { icon: '📊', key: 'read' },
  { icon: '🔒', key: 'fix' },
  { icon: '🌦', key: 'garden' },
];

/**
 * Tutoriel de premier lancement : 6 écrans courts, le premier porte la
 * mention « simulation pédagogique ». Le dernier propose de planter un
 * exemple (Charentais × PI 161375) déjà sélectionné en A et B.
 */
export function Tutorial({ onClose, onExample }: { onClose: () => void; onExample: () => void }) {
  const { tt } = useMelonT();
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  const close = () => {
    markSeen();
    onClose();
  };

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setStep((x) => Math.min(STEPS.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setStep((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"
      style={{ background: 'rgba(8, 14, 10, 0.72)' }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tuto-title"
        className="specimen-card w-full max-w-md p-5 outline-none sm:p-6"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-tomato-500)' }}>
            {tt('tuto.progress', { n: step + 1, total: STEPS.length })}
          </p>
          <button type="button" onClick={close} className="text-xs underline" style={{ color: 'var(--color-ink-500)' }}>
            {tt('tuto.skip')}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <span className="text-3xl leading-none" aria-hidden="true">
            {s.icon}
          </span>
          <h2 id="tuto-title" className="font-display text-2xl leading-tight">
            {tt(`tuto.${s.key}.title` as MelonKey)}
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
          {tt(`tuto.${s.key}.body` as MelonKey)}
        </p>
        {step === 0 && (
          <p
            className="mt-3 rounded p-3 text-xs leading-relaxed"
            style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-700)', borderLeft: '3px solid var(--color-resin-500)' }}
          >
            <strong>{tt('disclaimer.title')}</strong> {tt('disclaimer.body')}
          </p>
        )}

        <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === step ? 18 : 6, background: i === step ? 'var(--color-tomato-500)' : 'var(--color-paper-300)' }}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStep((x) => x - 1)}
            disabled={step === 0}
            className="rounded px-3 py-2 text-sm disabled:opacity-0"
            style={{ color: 'var(--color-ink-700)' }}
          >
            ← {tt('tuto.prev')}
          </button>
          {last ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={close}
                className="rounded px-3 py-2 text-sm"
                style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-900)' }}
              >
                {tt('tuto.start')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onExample();
                  close();
                }}
                className="rounded px-3 py-2 text-sm font-medium"
                style={{ background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' }}
              >
                {tt('tuto.example')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setStep((x) => x + 1)}
              className="rounded px-4 py-2 text-sm font-medium"
              style={{ background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' }}
            >
              {tt('tuto.next')} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
