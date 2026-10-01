import type { BreedingEngine, Individual } from '../engine/genetics';
import { CHEMOTYPES } from '../engine/genetics';
import { ResinSwatch } from './ResinSwatch';
import { VigorGauge } from './VigorGauge';
import { TerpeneProfile } from './TerpeneProfile';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  individual: Individual;
  engine: BreedingEngine;
  selected?: boolean;
  selectable?: boolean;
  onToggleSelect?: (id: string) => void;
  onFocus?: (id: string) => void;
}

const sexSymbol: Record<string, string> = { F: '♀', M: '♂' };

export function SpecimenCard({ individual, engine, selected, selectable, onToggleSelect, onFocus }: Props) {
  const { t } = useTranslation();
  const chemotype = engine.chemotypeOf(individual);
  const pheno = engine.cannabinoidPhenotype(individual);
  const violetExpressed = engine.isVioletExpressed(individual);
  const violetCarrier = engine.isVioletCarrier(individual);

  return (
    <button
      type="button"
      onClick={() => (selectable ? onToggleSelect?.(individual.id) : onFocus?.(individual.id))}
      className={`specimen-card w-full text-left p-4 transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5 ${
        selected ? 'ring-2' : ''
      }`}
      style={selected ? ({ '--tw-ring-color': 'var(--color-resin-500)' } as React.CSSProperties) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-data text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-ink-500)' }}>
            {t('specimenCard.generationAbbr', { n: individual.generation })} · {sexSymbol[individual.sex]}
            {individual.autoflower ? ` · ${t('specimenCard.autoflowerAbbr')}` : ''}
            {individual.reversedFemale ? ` · ⇄ ${t('specimenCard.reversedFemaleAbbr')}` : ''}
            {individual.archived ? ` · 📦 ${t('specimenCard.archivedAbbr')}` : ''}
          </p>
          <p className="font-display text-lg leading-tight mt-0.5">
            {individual.label || CHEMOTYPES[chemotype].label}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="genotype-code text-sm px-1.5 py-0.5 rounded" style={{ background: 'var(--color-paper-300)' }}>
            {engine.genotypeCode(individual)}
          </span>
          {(violetExpressed || violetCarrier) && (
            <span
              className="flex items-center gap-1 text-[10px] genotype-code"
              style={{ color: 'var(--color-bloom-500)' }}
              title={violetExpressed ? t('specimenCard.violet.expressedTitle') : t('specimenCard.violet.carrierTitle')}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--color-bloom-500)', opacity: violetExpressed ? 1 : 0.4 }}
              />
              {violetExpressed ? t('specimenCard.violet.expressed') : t('specimenCard.violet.carrier')}
            </span>
          )}
        </div>
      </div>

      <div className="divider-vine my-3" style={{ background: 'var(--color-paper-300)' }} />

      <div className="flex items-center justify-between">
        <ResinSwatch pheno={pheno} size={44} />
        <p className="text-xs text-right leading-tight" style={{ color: 'var(--color-ink-500)' }}>
          {CHEMOTYPES[chemotype].description}
        </p>
      </div>

      <div className="mt-3">
        <VigorGauge percent={engine.vigorPercent(individual)} raw={individual.vigor} />
        {engine.inbreedingPercent(individual) > 0 && (
          <p
            className="mt-1 text-[11px]"
            style={{ color: engine.inbreedingPercent(individual) >= 25 ? 'var(--color-bloom-400)' : 'var(--color-ink-500)' }}
          >
            Consanguinité F≈{engine.inbreedingPercent(individual)}%
          </p>
        )}
      </div>

      <div className="mt-3">
        <TerpeneProfile individual={individual} engine={engine} compact />
      </div>
    </button>
  );
}
