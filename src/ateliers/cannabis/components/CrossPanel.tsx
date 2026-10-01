import { useState } from 'react';
import type { Individual } from '../engine/genetics';
import { CHEMOTYPES } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  parentA: Individual | null;
  parentB: Individual | null;
  onCross: (n: number) => void;
  chemotypeOf: (ind: Individual) => keyof typeof CHEMOTYPES;
  genotypeCode: (ind: Individual) => string;
}

export function CrossPanel({ parentA, parentB, onCross, chemotypeOf, genotypeCode }: Props) {
  const { t } = useTranslation();
  const [count, setCount] = useState(24);
  const ready = Boolean(parentA && parentB);
  const sameSex = parentA && parentB && parentA.sex === parentB.sex;
  const reversedFemaleInvolved = sameSex && (parentA?.reversedFemale || parentB?.reversedFemale);

  return (
    <div className="specimen-card p-5">
      <p className="font-display text-xl mb-3">{t('cross.title')}</p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4">
        <ParentSlot individual={parentA} chemotypeOf={chemotypeOf} genotypeCode={genotypeCode} />
        <span className="font-display text-2xl" style={{ color: 'var(--color-resin-500)' }}>
          ×
        </span>
        <ParentSlot individual={parentB} chemotypeOf={chemotypeOf} genotypeCode={genotypeCode} />
      </div>

      {sameSex && (
        <p
          className="text-xs mb-3"
          style={{ color: reversedFemaleInvolved ? 'var(--color-leaf-500)' : 'var(--color-bloom-400)' }}
        >
          {reversedFemaleInvolved ? t('cross.reversedFemaleNote') : t('cross.sameSexWarning')}
        </p>
      )}

      <div className="flex items-center gap-3">
        <label className="text-xs" style={{ color: 'var(--color-paper-300)' }} htmlFor="offspring-count">
          {t('cross.offspringLabel')}
        </label>
        <input
          id="offspring-count"
          type="number"
          min={1}
          max={60}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
          className="w-20 rounded px-2 py-1.5 text-sm outline-none"
          style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
        />
        <button
          type="button"
          disabled={!ready}
          onClick={() => onCross(count)}
          className="ml-auto rounded px-4 py-2 text-sm font-medium transition-transform disabled:opacity-40 hover:not-disabled:-translate-y-0.5"
          style={{ background: 'var(--color-resin-500)', color: 'var(--color-ink-900)' }}
        >
          {t('cross.pollinateButton')}
        </button>
      </div>
    </div>
  );
}

function ParentSlot({
  individual,
  chemotypeOf,
  genotypeCode,
}: {
  individual: Individual | null;
  chemotypeOf: (ind: Individual) => keyof typeof CHEMOTYPES;
  genotypeCode: (ind: Individual) => string;
}) {
  const { t } = useTranslation();
  if (!individual) {
    return (
      <div
        className="rounded border border-dashed px-3 py-3 text-center text-xs"
        style={{ borderColor: 'var(--color-ink-500)', color: 'var(--color-ink-500)' }}
      >
        {t('cross.chooseSpecimen')}
      </div>
    );
  }
  const chem = chemotypeOf(individual);
  return (
    <div className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-900)' }}>
      <p className="text-sm font-medium truncate">
        {individual.label || individual.id}
        {individual.reversedFemale ? ' ⇄' : ''}
      </p>
      <p className="genotype-code text-xs opacity-70">
        {genotypeCode(individual)} · {CHEMOTYPES[chem].label}
      </p>
    </div>
  );
}
