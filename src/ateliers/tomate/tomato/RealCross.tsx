import { useEffect, useRef, type ReactNode } from 'react';
import type { TomatoEngine, TomatoIndividual } from '../engine/tomato/engine';
import { fruitSummary } from './components';
import { DepositIllustration, EmasculateIllustration, LabelIllustration, PollenIllustration, SeedsIllustration, StageIllustration } from './crossIllustrations';
import { useTomatoT, type TomatoKey } from './i18n';
import { FruitDot } from './TomatoPortrait';

const INK500 = 'var(--color-ink-500)';

function short(name: string, n = 16) {
  return name.length > n ? `${name.slice(0, n - 1)}…` : name;
}

/**
 * « Faire ce croisement pour de vrai » : la pollinisation manuelle de la
 * tomate pas à pas, illustrée, avec les noms des parents A (mère) et
 * B (père) choisis dans le simulateur et ce que la simulation prévoit.
 */
export function RealCrossGuide({
  engine,
  mother,
  father,
  onClose,
}: {
  engine: TomatoEngine;
  mother: TomatoIndividual | null;
  father: TomatoIndividual | null;
  onClose: () => void;
}) {
  const { tt, language } = useTomatoT();
  const ref = useRef<HTMLDivElement>(null);
  const mName = mother?.label ?? tt('real.motherGeneric');
  const fName = father?.label ?? tt('real.fatherGeneric');
  const f1 = mother && father ? engine.cross(mother, father, 1)[0] : null;
  const today = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit' });

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

  const t = (k: string, vars?: Record<string, string | number>) => tt(k as TomatoKey, vars);

  const steps: Array<{ key: string; img: ReactNode }> = [
    {
      key: 'stage',
      img: <StageIllustration early={t('real.img.early')} right={t('real.img.right')} late={t('real.img.late')} caption={t('real.stage.title')} />,
    },
    {
      key: 'emasculate',
      img: <EmasculateIllustration cone={t('real.img.cone')} pistil={t('real.img.pistil')} petals={t('real.img.petals')} caption={t('real.emasculate.title')} />,
    },
    {
      key: 'pollen',
      img: <PollenIllustration father={t('real.img.father', { name: short(fName, 14) })} brush={t('real.img.toothbrush')} spoon={t('real.img.spoon')} caption={t('real.pollen.title')} />,
    },
    {
      key: 'deposit',
      img: <DepositIllustration mother={t('real.img.mother', { name: short(mName, 14) })} stigma={t('real.img.stigma')} caption={t('real.deposit.title')} />,
    },
    {
      key: 'label',
      img: <LabelIllustration line1={short(mName, 17)} line2={`× ${short(fName, 15)}`} line3={today} caption={t('real.label.title')} />,
    },
    {
      key: 'seeds',
      img: <SeedsIllustration cut={t('real.img.cut')} ferment={t('real.img.ferment')} dry={t('real.img.dry')} caption={t('real.seeds.title')} />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto p-3 sm:p-6" style={{ background: 'rgba(8, 14, 10, 0.72)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="real-title" className="specimen-card my-auto h-fit w-full max-w-2xl p-5 outline-none sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-tomato-500)' }}>
              {tt('real.eyebrow')}
            </p>
            <h2 id="real-title" className="font-display text-2xl sm:text-3xl leading-tight mt-1">
              {tt('real.title')}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label={tt('real.close')} className="rounded px-2 py-1 text-lg leading-none" style={{ color: INK500 }}>
            ✕
          </button>
        </div>

        {/* Les deux parents */}
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
          <div className="rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: INK500 }}>
              {tt('real.motherRole')}
            </p>
            <p className="flex items-center gap-1.5 truncate font-medium">
              {mother && <FruitDot appearance={engine.appearance(mother)} />}
              {mName}
            </p>
          </div>
          <span className="font-display text-2xl" style={{ color: 'var(--color-tomato-500)' }}>
            ×
          </span>
          <div className="rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: INK500 }}>
              {tt('real.fatherRole')}
            </p>
            <p className="flex items-center gap-1.5 truncate font-medium">
              {father && <FruitDot appearance={engine.appearance(father)} />}
              {fName}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
          {tt('real.intro')}
        </p>

        {/* Matériel */}
        <div className="mt-4 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
          <p className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: INK500 }}>
            {tt('real.kit.title')}
          </p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2" style={{ color: 'var(--color-ink-700)' }}>
            {['tweezers', 'toothbrush', 'brush', 'labels', 'loupe', 'alcohol'].map((k) => (
              <li key={k}>• {t(`real.kit.${k}`)}</li>
            ))}
          </ul>
        </div>

        {/* Étapes illustrées */}
        <ol className="mt-5 space-y-6">
          {steps.map((s, i) => (
            <li key={s.key}>
              <div className="flex items-baseline gap-2">
                <span className="font-data text-sm font-semibold" style={{ color: 'var(--color-tomato-500)' }}>
                  {i + 1}.
                </span>
                <h3 className="font-display text-lg leading-tight">{t(`real.${s.key}.title`)}</h3>
              </div>
              <div className="mt-2 space-y-2">
                <div>{s.img}</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
                  {t(`real.${s.key}.body`, { mother: mName, father: fName })}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Ce que prévoit la simulation */}
        <div className="mt-6 rounded p-3.5" style={{ background: 'var(--color-paper-200)', borderLeft: '3px solid var(--color-tomato-500)' }}>
          <p className="font-display text-base">{tt('real.expect.title')}</p>
          <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
            <li>• {tt('real.expect.fruit', { mother: mName })}</li>
            {f1 && (
              <li className="flex flex-wrap items-center gap-1.5">
                • {tt('real.expect.f1')} <FruitDot appearance={engine.appearance(f1)} /> <strong>{fruitSummary(engine, f1, tt)}</strong>
              </li>
            )}
            <li>• {tt('real.expect.f2')}</li>
          </ul>
        </div>

        {/* Conseils */}
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: INK500 }}>
            {tt('real.tips.title')}
          </p>
          <ul className="space-y-1 text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
            {['time', 'weather', 'several', 'remove', 'isolation'].map((k) => (
              <li key={k}>• {t(`real.tips.${k}`)}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' }}>
            {tt('real.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
