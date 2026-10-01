import { useMemo } from 'react';
import { STRAIN_PRESETS } from '../engine/genetics';
import { analyzeCatalogDiversity } from '../engine/catalogDiversity';

/**
 * Vue d'ensemble de la diversité génétique du catalogue — dérivée du
 * texte libre des descriptions (voir catalogDiversity.ts), avec
 * l'avertissement correspondant affiché explicitement plutôt que
 * présenté comme une généalogie vérifiée.
 */
export function CatalogDiversityPanel() {
  const report = useMemo(() => analyzeCatalogDiversity(STRAIN_PRESETS, 15), []);
  const maxCount = report.topAncestors[0]?.count ?? 1;
  const parseablePercent = Math.round((report.withParseableLineage / report.totalVarieties) * 100);

  return (
    <section className="mt-14 pb-2">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--color-paper-100)' }}>
          Diversité génétique du catalogue
        </h2>
        <span className="divider-vine hidden flex-1 sm:block" />
      </div>
      <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
        Approximation à partir des mentions de parenté ("Parent A × Parent B") repérées en tête de la description de
        chaque variété — pas une généalogie vérifiée : une variété peut avoir une lignée réelle non décrite ainsi
        dans son texte, ou une description qui omet des ancêtres.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded px-4 py-3" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
          <p className="font-data text-2xl" style={{ color: 'var(--color-resin-400)' }}>
            {parseablePercent}%
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-paper-300)' }}>
            du catalogue ({report.withParseableLineage} / {report.totalVarieties}) a une lignée textuelle identifiable
          </p>
        </div>
        <div className="rounded px-4 py-3" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
          <p className="font-data text-2xl" style={{ color: 'var(--color-resin-400)' }}>
            {report.uniqueAncestors}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-paper-300)' }}>
            noms de parents distincts mentionnés dans l'ensemble du catalogue
          </p>
        </div>
        <div className="rounded px-4 py-3" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
          <p className="font-data text-2xl" style={{ color: 'var(--color-resin-400)' }}>
            {report.topAncestors[0]?.name ?? '—'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-paper-300)' }}>
            génétique fondatrice la plus recyclée ({report.topAncestors[0]?.count ?? 0} mentions comme parent)
          </p>
        </div>
      </div>

      <div className="mt-5 rounded px-5 py-4" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--color-ink-500)' }}>
          Génétiques fondatrices les plus recyclées à travers le catalogue
        </p>
        <div className="space-y-1.5">
          {report.topAncestors.map((a) => (
            <div key={a.name} className="flex items-center gap-2">
              <span className="w-40 shrink-0 truncate text-xs" style={{ color: 'var(--color-paper-100)' }} title={a.name}>
                {a.name}
              </span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'var(--color-canopy-800)', height: 10 }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(a.count / maxCount) * 100}%`, background: 'var(--color-resin-500)' }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-data text-xs" style={{ color: 'var(--color-paper-300)' }}>
                {a.count}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--color-ink-500)' }}>
          Une poignée de génétiques (OG Kush, Sour Diesel, Skunk #1, Wedding Cake...) reviennent comme parent dans un
          grand nombre de variétés du catalogue — signe d'une concentration de la diversité autour de quelques
          lignées fondatrices commerciales, plutôt qu'une base génétique large et indépendante.
        </p>
      </div>
    </section>
  );
}
