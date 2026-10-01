import type { BreedingEngine, Individual } from '../engine/genetics';
import { estimateNutrientProfile, NPK_STAGE_GUIDANCE } from '../engine/nutrients';

interface Props {
  individual: Individual;
  engine: BreedingEngine;
}

const appetiteColor: Record<string, string> = {
  léger: 'var(--color-leaf-500)',
  modéré: 'var(--color-resin-500)',
  soutenu: 'var(--color-bloom-500)',
};

/**
 * Estimation qualitative de l'appétit nutritionnel — dérivée de la
 * vigueur, de la consanguinité, de l'autofloraison et de la durée de
 * floraison déjà connues du moteur, PAS un plan de fertilisation
 * chiffré. Voir l'avertissement en pied de panneau.
 */
export function NutrientPanel({ individual, engine }: Props) {
  const profile = estimateNutrientProfile(individual, engine, individual.strainInfo);
  const [lo, hi] = profile.doseFactorRange;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="rounded px-2 py-0.5 text-[11px] font-medium"
          style={{ background: appetiteColor[profile.appetite], color: 'var(--color-ink-900)' }}
        >
          appétit {profile.appetite}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--color-ink-500)' }}>
          ≈ {Math.round(lo * 100)}–{Math.round(hi * 100)}% d'un programme d'engrais standard
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ color: 'var(--color-paper-300)' }}>
        <div className="rounded p-2" style={{ background: 'var(--color-canopy-800)' }}>
          <p className="uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-ink-500)' }}>
            Croissance
          </p>
          {NPK_STAGE_GUIDANCE.vegetative}
        </div>
        <div className="rounded p-2" style={{ background: 'var(--color-canopy-800)' }}>
          <p className="uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-ink-500)' }}>
            Floraison
          </p>
          {NPK_STAGE_GUIDANCE.bloom}
        </div>
      </div>

      {profile.notes.length > 0 && (
        <ul className="mt-2 space-y-1 list-disc list-inside">
          {profile.notes.map((n, i) => (
            <li key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--color-ink-500)' }}>
              {n}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] italic mt-2 leading-relaxed" style={{ color: 'var(--color-ink-500)' }}>
        Estimation qualitative (vigueur, consanguinité, autofloraison, durée de floraison) — pas une valeur mesurée
        sur cette génétique précise. Calcium, magnésium et oligo-éléments restent nécessaires dans tous les cas ; à
        ajuster à l'observation (jaunissement = carence, brûlure des pointes = excès).
      </p>
    </div>
  );
}
