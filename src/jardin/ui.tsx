/**
 * Briques d'interface communes (même registre que les apps Lignée :
 * fond « canopée », fiches papier, accents vert feuille et or résine).
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';

export const INK500 = 'var(--color-ink-500)';
export const INK700 = 'var(--color-ink-700)';

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`specimen-card p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          {title && <h2 className="font-display text-lg leading-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  onClick,
  kind = 'secondary',
  type = 'button',
  disabled,
  title,
  className = '',
  small,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: BtnKind;
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
  className?: string;
  small?: boolean;
}) {
  const styles: Record<BtnKind, React.CSSProperties> = {
    primary: { background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' },
    secondary: { background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' },
    ghost: { background: 'var(--color-paper-200)', color: 'var(--color-ink-900)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' },
    danger: { background: '#9a3324', color: 'var(--color-paper-100)' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`btn rounded font-medium transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 ${small ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'} ${className}`}
      style={styles[kind]}
    >
      {children}
    </button>
  );
}

const fieldStyle = { background: 'var(--color-paper-200)', color: 'var(--color-ink-900)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' };

export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="block">
      <label htmlFor={id} className="mb-1 block text-xs font-medium" style={{ color: INK700 }}>
        {label}
      </label>
      {children(id)}
      {hint && (
        <p className="mt-1 text-[11px] leading-snug" style={{ color: INK500 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextInput({ id, value, onChange, placeholder, type = 'text', step, min, max }: { id?: string; value: string | number | undefined; onChange: (v: string) => void; placeholder?: string; type?: 'text' | 'number' | 'date'; step?: number; min?: number; max?: number }) {
  return (
    <input
      id={id}
      type={type}
      value={value ?? ''}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      inputMode={type === 'number' ? 'decimal' : undefined}
      onChange={(e) => onChange(e.target.value)}
      className="field w-full rounded px-2.5 py-2 text-sm outline-none"
      style={fieldStyle}
    />
  );
}

export function TextArea({ id, value, onChange, placeholder }: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea id={id} value={value} rows={3} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="field w-full rounded px-2.5 py-2 text-sm outline-none" style={fieldStyle} />;
}

export function Select<T extends string>({ id, value, onChange, options }: { id?: string; value: T; onChange: (v: T) => void; options: Array<{ v: T; l: string }> }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="field w-full rounded px-2.5 py-2 text-sm outline-none" style={fieldStyle}>
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
}

export function Chip({ children, active, onClick, title }: { children: ReactNode; active?: boolean; onClick?: () => void; title?: string }) {
  const style = { background: active ? 'var(--color-tomato-500)' : 'var(--color-paper-300)', color: active ? 'var(--color-paper-100)' : 'var(--color-ink-700)' };
  if (!onClick)
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px]" style={style} title={title}>
        {children}
      </span>
    );
  return (
    <button type="button" aria-pressed={active} onClick={onClick} title={title} className="chip inline-flex items-center gap-1 rounded px-2 py-1 text-xs" style={style}>
      {children}
    </button>
  );
}

/** Explication dépliable : le « pourquoi » d'un conseil. */
export function Why({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="mt-2 rounded px-3 py-2 text-xs leading-relaxed" style={{ background: 'var(--color-paper-200)', color: INK700 }}>
      <summary className="cursor-pointer font-medium" style={{ color: 'var(--color-tomato-600)' }}>
        {label}
      </summary>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </details>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'good'; children: ReactNode }) {
  const c = {
    info: { bg: 'var(--color-paper-200)', bar: 'var(--color-canopy-600)', fg: INK700 },
    warn: { bg: '#f7ecd2', bar: 'var(--color-resin-500)', fg: '#6b4a10' },
    good: { bg: '#e6efdc', bar: 'var(--color-tomato-500)', fg: '#2f4a22' },
  }[tone];
  return (
    <div className="rounded px-3 py-2 text-xs leading-relaxed" style={{ background: c.bg, color: c.fg, borderLeft: `3px solid ${c.bar}` }}>
      {children}
    </div>
  );
}

/** Fenêtre par-dessus l'app (plein écran sur téléphone). */
export function Sheet({ title, onClose, children, closeLabel }: { title: ReactNode; onClose: () => void; children: ReactNode; closeLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto sm:p-6" style={{ background: 'rgba(8, 14, 10, 0.72)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" className="specimen-card min-h-full w-full max-w-2xl p-4 outline-none sm:my-auto sm:min-h-0 sm:p-6">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-3 flex items-start justify-between gap-3 px-4 pb-2 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6" style={{ background: 'var(--color-paper-100)' }}>
          <h2 className="font-display text-xl leading-tight sm:text-2xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="btn -mr-1 rounded px-2 py-1 text-xl leading-none" style={{ color: INK500 }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Jauge horizontale avec un repère de seuil et une étiquette (jamais la couleur seule). */
export function Meter({ value, max, threshold, color, label }: { value: number; max: number; threshold?: number; color: string; label: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-label={label} className="relative h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-paper-300)' }}>
      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
      {threshold !== undefined && <div className="absolute inset-y-0 w-0.5" style={{ left: `${Math.min(1, threshold / max) * 100}%`, background: 'var(--color-ink-700)', opacity: 0.6 }} />}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded px-3 py-4 text-center text-sm leading-relaxed" style={{ background: 'var(--color-paper-200)', color: INK500 }}>
      {children}
    </p>
  );
}
