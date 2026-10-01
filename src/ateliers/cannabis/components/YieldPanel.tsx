import type { BreedingEngine, Individual } from '../engine/genetics';
import { estimateYield } from '../engine/yieldEstimate';

interface Props {
  individual: Individual;
  engine: BreedingEngine;
}

const bandColor: Record<string, string> = {
  faible: 'var(--color-ink-500)',
  moyen: 'var(--color-resin-500)',
  élevé: 'var(--color-leaf-500)',
};

export function YieldPanel({ individual, engine }: Props) {
  const est = estimateYield(individual, engine);
  const [lo, hi] = est.indoorRangeGramsPerM2;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="rounded px-2 py-0.5 text-[11px] font-medium"
          style={{ background: bandColor[est.band], color: 'var(--color-ink-900)' }}
        >
          rendement {est.band}
        </span>
        <span className="font-data text-sm" style={{ color: 'var(--color-paper-100)' }}>
          ≈ {lo}–{hi} g/m²
        </span>
      </div>
      <ul className="space-y-1 list-disc list-inside">
        {est.notes.map((n, i) => (
          <li key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--color-ink-500)' }}>
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}
