import type { Individual } from '../engine/genetics';
import { genotypeCode } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  individual: Individual;
  byId: Map<string, Individual>;
  depth?: number;
}

const sexSymbol: Record<string, string> = { F: '♀', M: '♂' };

/**
 * Arbre généalogique en remontant récursivement les parent_ids —
 * rendu comme une ramure (traits verticaux type "vigne"), plutôt
 * qu'un composant d'arbre générique.
 */
export function PedigreeTree({ individual, byId, depth = 0 }: Props) {
  const { t } = useTranslation();
  const parents = individual.parentIds
    ? ([individual.parentIds[0], individual.parentIds[1]] as const)
    : null;
  const uniqueParents = parents ? Array.from(new Set(parents)) : null;

  return (
    <div className={depth > 0 ? 'ml-4 border-l pl-4' : ''} style={{ borderColor: 'var(--color-canopy-600)' }}>
      <div className="flex items-center gap-2 py-1">
        <span
          className="genotype-code text-xs px-1.5 py-0.5 rounded"
          style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
        >
          {genotypeCode(individual)}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-ink-700)' }}>
          {individual.label || individual.id} <span className="opacity-60">{sexSymbol[individual.sex]}</span>
        </span>
        <span className="text-xs opacity-60" style={{ color: 'var(--color-ink-500)' }}>
          {t('pedigree.generationAbbr', { n: individual.generation })}
        </span>
      </div>
      {uniqueParents && (
        <div>
          {uniqueParents.map((pid) => {
            const parent = byId.get(pid);
            if (!parent) return null;
            return <PedigreeTree key={pid} individual={parent} byId={byId} depth={depth + 1} />;
          })}
          {uniqueParents.length === 1 && (
            <p className="ml-4 pl-4 text-xs italic opacity-50">{t('pedigree.selfPollination')}</p>
          )}
        </div>
      )}
    </div>
  );
}
