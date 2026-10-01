import type { BreedingEngine, Individual } from '../engine/genetics';
import { CHEMOTYPES, type ChemotypeId } from '../engine/genetics';

const COLORS: Record<ChemotypeId, string> = {
  I: 'var(--color-resin-500)',
  II: 'var(--color-leaf-400)',
  III: 'var(--color-bloom-500)',
  IV: 'var(--color-leaf-500)',
  V: 'var(--color-paper-300)',
  VI: 'var(--color-resin-600)',
};

/**
 * Barre empilée montrant la ségrégation des chimiotypes au sein
 * d'une génération — la démonstration visuelle la plus directe du
 * modèle mendélien sous-jacent (ex. ratio 1:2:1 attendu sur une
 * auto-fécondation d'hétérozygotes).
 */
export function SegregationChart({ individuals, engine }: { individuals: Individual[]; engine: BreedingEngine }) {
  if (individuals.length === 0) return null;

  const counts: Record<ChemotypeId, number> = { I: 0, II: 0, III: 0, IV: 0, V: 0, VI: 0 };
  for (const ind of individuals) counts[engine.chemotypeOf(ind)] += 1;
  const total = individuals.length;

  // I/II/III toujours affichés (cas courant) ; IV/V/VI n'apparaissent
  // dans la légende que s'ils ségrégent réellement dans cette portée —
  // trop rares pour justifier une entrée à 0/total à chaque fois.
  const order: ChemotypeId[] = [
    'I',
    'II',
    'III',
    ...(counts.IV > 0 ? (['IV'] as ChemotypeId[]) : []),
    ...(counts.V > 0 ? (['V'] as ChemotypeId[]) : []),
    ...(counts.VI > 0 ? (['VI'] as ChemotypeId[]) : []),
  ];

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full ring-1 ring-white/10">
        {order.map((id) =>
          counts[id] > 0 ? (
            <div
              key={id}
              style={{ width: `${(counts[id] / total) * 100}%`, background: COLORS[id] }}
              title={`${CHEMOTYPES[id].label} — ${counts[id]}/${total}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
        {order.map((id) => (
          <div key={id} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-paper-200)' }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[id] }} />
            {CHEMOTYPES[id].label}
            <span className="font-data" style={{ color: 'var(--color-paper-300)' }}>
              {counts[id]}/{total} · {Math.round((counts[id] / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
