import { Fragment } from 'react';
import type { BreedingEngine, Individual } from '../engine/genetics';
import { CHEMOTYPES } from '../engine/genetics';
import { estimateYield } from '../engine/yieldEstimate';
import { estimateNutrientProfile } from '../engine/nutrients';

interface Props {
  a: Individual;
  b: Individual;
  engine: BreedingEngine;
}

interface Row {
  label: string;
  a: string;
  b: string;
  /** true si les deux valeurs diffèrent — permet de les surligner. */
  highlight?: boolean;
}

/** Comparateur côte-à-côte de deux spécimens — indépendant du sexe
 * (contrairement à CrossPanel, sert aussi à comparer deux individus
 * qu'on ne compte pas croiser ensemble). */
export function ComparisonPanel({ a, b, engine }: Props) {
  const chemA = engine.chemotypeOf(a);
  const chemB = engine.chemotypeOf(b);
  const phenoA = engine.cannabinoidPhenotype(a);
  const phenoB = engine.cannabinoidPhenotype(b);
  const yieldA = estimateYield(a, engine);
  const yieldB = estimateYield(b, engine);
  const nutA = estimateNutrientProfile(a, engine, a.strainInfo);
  const nutB = estimateNutrientProfile(b, engine, b.strainInfo);

  const rows: Row[] = [
    { label: 'Chimiotype', a: `${chemA} — ${CHEMOTYPES[chemA].label}`, b: `${chemB} — ${CHEMOTYPES[chemB].label}`, highlight: chemA !== chemB },
    { label: 'Génotype', a: engine.genotypeCode(a), b: engine.genotypeCode(b) },
    {
      label: 'Cannabinoïdes',
      a: phenoA.propylSeries ? `THCV/CBDV (varin)` : `THC ${phenoA.thcPercent}% · CBD ${phenoA.cbdPercent}%`,
      b: phenoB.propylSeries ? `THCV/CBDV (varin)` : `THC ${phenoB.thcPercent}% · CBD ${phenoB.cbdPercent}%`,
    },
    {
      label: 'Vigueur',
      a: `${engine.vigorPercent(a).toFixed(0)}%`,
      b: `${engine.vigorPercent(b).toFixed(0)}%`,
      highlight: Math.abs(engine.vigorPercent(a) - engine.vigorPercent(b)) >= 15,
    },
    { label: 'Hauteur', a: `${engine.heightPercent(a).toFixed(0)}%`, b: `${engine.heightPercent(b).toFixed(0)}%` },
    { label: 'Résist. froid', a: `${engine.coldTolerancePercent(a).toFixed(0)}%`, b: `${engine.coldTolerancePercent(b).toFixed(0)}%` },
    { label: 'Résist. moisissure', a: `${engine.moldResistancePercent(a).toFixed(0)}%`, b: `${engine.moldResistancePercent(b).toFixed(0)}%` },
    {
      label: 'Rendement estimé',
      a: `${yieldA.band} (${yieldA.indoorRangeGramsPerM2[0]}–${yieldA.indoorRangeGramsPerM2[1]} g/m²)`,
      b: `${yieldB.band} (${yieldB.indoorRangeGramsPerM2[0]}–${yieldB.indoorRangeGramsPerM2[1]} g/m²)`,
      highlight: yieldA.band !== yieldB.band,
    },
    { label: 'Appétit nutritif', a: nutA.appetite, b: nutB.appetite },
    {
      label: 'Consanguinité',
      a: `F≈${engine.inbreedingPercent(a)}%`,
      b: `F≈${engine.inbreedingPercent(b)}%`,
      highlight: engine.inbreedingPercent(a) >= 25 || engine.inbreedingPercent(b) >= 25,
    },
    {
      label: 'Pigmentation',
      a: engine.isVioletExpressed(a) ? 'violette' : engine.isVioletCarrier(a) ? 'porteuse v' : 'verte',
      b: engine.isVioletExpressed(b) ? 'violette' : engine.isVioletCarrier(b) ? 'porteuse v' : 'verte',
    },
    { label: 'Auto-floraison', a: a.autoflower ? 'oui' : 'non', b: b.autoflower ? 'oui' : 'non', highlight: a.autoflower !== b.autoflower },
  ];

  return (
    <div className="specimen-card p-5">
      <p className="font-display text-xl mb-3">Comparateur</p>
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-2 gap-y-2 text-xs">
        <span />
        <span className="font-medium truncate" style={{ color: 'var(--color-paper-100)' }}>
          {a.label || a.id}
        </span>
        <span className="font-medium truncate" style={{ color: 'var(--color-paper-100)' }}>
          {b.label || b.id}
        </span>
        {rows.map((row) => (
          <Fragment key={row.label}>
            <span style={{ color: 'var(--color-ink-500)' }}>{row.label}</span>
            <span style={{ color: row.highlight ? 'var(--color-bloom-400)' : 'var(--color-paper-200)' }}>{row.a}</span>
            <span style={{ color: row.highlight ? 'var(--color-bloom-400)' : 'var(--color-paper-200)' }}>{row.b}</span>
          </Fragment>
        ))}
      </div>
      <p className="text-[10px] italic mt-3 leading-relaxed" style={{ color: 'var(--color-ink-500)' }}>
        En orange : les valeurs qui diffèrent nettement entre les deux spécimens.
      </p>
    </div>
  );
}
