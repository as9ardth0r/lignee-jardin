import { useEffect, useRef, type ReactNode } from 'react';
import type { BrEngine, BrIndividual } from '../engine/chou/engine';
import { fruitSummary, speciesLabel } from './components';
import { BagIllustration, EmasculateIllustration, IdIllustration, PollinateIllustration, SealIllustration, SeedsIllustration } from './crossIllustrations';
import { useBrT, type BrKey } from './i18n';
import { FruitDot } from './CabbagePortrait';

const INK500 = 'var(--color-ink-500)';

function short(name: string, n = 16) {
  return name.length > n ? `${name.slice(0, n - 1)}…` : name;
}

/**
 * « Faire ce croisement pour de vrai » : croisement manuel des choux,
 * illustré, avec les noms de la mère (A) et du père (B), la castration (sauf
 * mère Ogura), l’auto-incompatibilité et les barrières du triangle de U.
 */
export function RealCrossGuide({
  engine,
  mother,
  father,
  onClose,
}: {
  engine: BrEngine;
  mother: BrIndividual | null;
  father: BrIndividual | null;
  onClose: () => void;
}) {
  const { tt, language } = useBrT();
  const ref = useRef<HTMLDivElement>(null);
  const mName = mother?.label ?? tt('real.motherGeneric');
  const fName = father?.label ?? tt('real.fatherGeneric');
  const noPollen = Boolean(father && !engine.canPollinate(father));
  const ogura = mother ? engine.isMaleSterile(mother) : false;
  const check = mother && father ? engine.crossCheck(mother, father) : null;
  const f1 = mother && father && !noPollen && check?.level !== 'blocked' ? engine.cross(mother, father, 12).find(Boolean) ?? null : null;
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

  const t = (k: string, vars?: Record<string, string | number>) => tt(k as BrKey, vars);

  const steps: Array<{ key: string; img: ReactNode }> = [
    { key: 'id', img: <IdIllustration bud={t('real.img.bud')} flower={t('real.img.flower')} silique={t('real.img.silique')} caption={t('real.id.title')} /> },
    ...(ogura
      ? []
      : [{ key: 'emasculate', img: <EmasculateIllustration stamens={t('real.img.stamens')} tweezers={t('real.img.tweezers')} stigma={t('real.img.stigmaKeep')} caption={t('real.emasculate.title')} /> }]),
    { key: 'bag', img: <BagIllustration bag={t('real.img.bag')} insects={t('real.img.insects')} caption={t('real.bag.title')} /> },
    { key: 'pollinate', img: <PollinateIllustration stigma={t('real.img.stigma')} pollen={t('real.img.pollen')} caption={t('real.pollinate.title')} /> },
    { key: 'seal', img: <SealIllustration line1={short(mName, 17)} line2={`× ${short(fName, 15)}`} line3={today} caption={t('real.seal.title')} /> },
    { key: 'seeds', img: <SeedsIllustration wait={t('real.img.wait')} dry={t('real.img.dry')} caption={t('real.seeds.title')} /> },
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

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm">
          {[
            { ind: mother, name: mName, role: tt('real.motherRole') },
            { ind: father, name: fName, role: tt('real.fatherRole') },
          ].map((p, i) => (
            <div key={i} className={`rounded p-2.5 row-start-1 ${i === 1 ? 'col-start-3' : 'col-start-1'}`} style={{ background: 'var(--color-paper-200)' }}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: INK500 }}>
                {p.role}
              </p>
              <p className="flex items-center gap-1.5 truncate font-medium">
                {p.ind && <FruitDot appearance={engine.appearance(p.ind)} />}
                {p.name}
              </p>
              {p.ind && (
                <p className="truncate text-[10px] italic" style={{ color: INK500 }}>
                  {speciesLabel(p.ind)}{p.ind.cyto === 'Ogu' ? ' · Ogura' : ''} · {p.ind.genome}
                </p>
              )}
            </div>
          ))}
          <span className="col-start-2 row-start-1 font-display text-2xl" style={{ color: 'var(--color-tomato-500)' }}>
            ×
          </span>
        </div>

        {noPollen && (
          <p className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: '#f6ded8', color: '#7a2414', borderLeft: '3px solid #b8412a' }}>
            {tt('real.warnNoPollen', { father: fName })}
          </p>
        )}
        {check && !noPollen && check.level === 'blocked' && (
          <p className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: '#f6ded8', color: '#7a2414', borderLeft: '3px solid #b8412a' }}>
            {tt('real.warnBlocked', { why: t(`compat.${check.reason}`) })}
          </p>
        )}
        {check && check.level === 'difficult' && (
          <p className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: '#f7ecd2', color: '#6b4a10', borderLeft: '3px solid var(--color-resin-500)' }}>
            {tt('real.warnDifficult', { why: t(`compat.${check.reason}`) })}
          </p>
        )}
        {check && check.level === 'related' && (
          <p className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-700)', borderLeft: '3px solid var(--color-leaf-500)' }}>
            {tt('real.warnRelated')}
          </p>
        )}
        {mother && (
          <p className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-700)', borderLeft: `3px solid ${ogura ? 'var(--color-bloom-500)' : 'var(--color-leaf-500)'}` }}>
            {ogura ? tt('real.cmsMother', { mother: mName }) : tt('real.emascMother', { mother: mName })}
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
          {tt('real.intro')}
        </p>

        <div className="mt-4 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
          <p className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: INK500 }}>
            {tt('real.kit.title')}
          </p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2" style={{ color: 'var(--color-ink-700)' }}>
            {['tweezers', 'bags', 'labels', 'alcohol'].map((k) => (
              <li key={k}>• {t(`real.kit.${k}`)}</li>
            ))}
          </ul>
        </div>

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

        {!noPollen && check?.level !== 'blocked' && (
          <div className="mt-6 rounded p-3.5" style={{ background: 'var(--color-paper-200)', borderLeft: '3px solid var(--color-tomato-500)' }}>
            <p className="font-display text-base">{tt('real.expect.title')}</p>
            <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
              <li>• {tt('real.expect.fruit', { mother: mName })}</li>
              {f1 && (
                <li className="flex flex-wrap items-center gap-1.5">
                  • {tt('real.expect.f1')} <FruitDot appearance={engine.appearance(f1)} /> <strong>{fruitSummary(engine, f1, tt)}</strong>
                  {engine.isMaleSterile(f1) && <strong style={{ color: 'var(--color-bloom-500)' }}> — {tt('fruit.cms')}</strong>}
                </li>
              )}
              <li>• {tt('real.expect.f2')}</li>
            </ul>
          </div>
        )}

        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: INK500 }}>
            {tt('real.tips.title')}
          </p>
          <ul className="space-y-1 text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
            {['vernalisation', 'distance', 'budSelf', 'several', 'species'].map((k) => (
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
