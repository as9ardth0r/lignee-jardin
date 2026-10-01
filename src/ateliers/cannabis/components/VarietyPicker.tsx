import { useMemo, useRef, useState } from 'react';
import type { ChemotypeId, StrainPreset } from '../engine/genetics';
import { CHEMOTYPES, parseCannabinoidRates, formatCannabinoidRates } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';

const PAGE_SIZE = 150;
const chemotypeOrder: ChemotypeId[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/**
 * Champ de recherche pour choisir une variété parmi ~3 400 entrées —
 * un <select> natif serait inutilisable à cette échelle (aucune
 * recherche, liste interminable). Les variétés "documentées"
 * (STRAIN_PRESETS, fiche de culture vérifiée) sont mises en avant,
 * qu'un filtre soit tapé ou non. Sans filtre, la liste complète
 * (triée alphabétiquement) est parcourable par pages de PAGE_SIZE —
 * pour permettre de "feuilleter" les noms plutôt que de devoir déjà
 * savoir lequel chercher.
 */
export function VarietyPicker({
  allPresets,
  selected,
  onSelect,
  onClear,
}: {
  allPresets: StrainPreset[];
  selected: StrainPreset | null;
  onSelect: (preset: StrainPreset) => void;
  onClear: () => void;
}) {
  const { t, tPlural } = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Aucun filtre chimiotype actif au départ = toutes les variétés.
  const [chemotypeFilter, setChemotypeFilter] = useState<Set<ChemotypeId>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // "Documentée" = fiche de culture complète (`info`) — vrai pour le
  // catalogue vérifié à la main ET pour les souches ajoutées par
  // l'utilisateur (toujours saisies avec une fiche complète), faux
  // pour la bibliothèque ouverte élargie (nom + chimiotype seulement).
  const allSorted = useMemo(() => {
    const arr = [...allPresets];
    arr.sort((a, b) => {
      const da = a.info ? 0 : 1;
      const db = b.info ? 0 : 1;
      if (da !== db) return da - db;
      return a.name.localeCompare(b.name);
    });
    return arr;
  }, [allPresets]);

  function toggleChemotype(id: ChemotypeId) {
    setChemotypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setVisibleCount(PAGE_SIZE);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = allSorted;
    if (chemotypeFilter.size > 0) {
      arr = arr.filter((p) => chemotypeFilter.has(p.chemotype));
    }
    if (q) {
      arr = arr.filter((p) => p.name.toLowerCase().includes(q));
    }
    return arr;
  }, [query, allSorted, chemotypeFilter]);

  const results = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > results.length;

  return (
    <div className="relative">
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={selected ? selected.name : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
            setOpen(true);
            if (selected) onClear();
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder={t('varietyPicker.searchPlaceholder')}
          className="w-full rounded px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
        />
        {selected && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery('');
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded px-2 text-xs"
            style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-300)' }}
            title={t('varietyPicker.clearSelection')}
          >
            ✕
          </button>
        )}
      </div>

      {open && !selected && (
        <div
          className="absolute z-10 mt-1 max-h-96 w-full overflow-y-auto rounded shadow-lg"
          style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-600)' }}
        >
          <div
            className="sticky top-0 z-10 flex flex-wrap gap-1 px-3 pt-2 pb-1.5"
            style={{ background: 'var(--color-canopy-900)', borderBottom: '1px solid var(--color-canopy-600)' }}
          >
            {chemotypeOrder.map((id) => {
              const active = chemotypeFilter.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleChemotype(id)}
                  title={CHEMOTYPES[id].description}
                  className="rounded-full px-2 py-1 text-[10px] leading-tight transition-colors"
                  style={{
                    background: active ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                    color: active ? 'var(--color-ink-900)' : 'var(--color-paper-300)',
                  }}
                >
                  {id} · {CHEMOTYPES[id].description}
                </button>
              );
            })}
            {chemotypeFilter.size > 0 && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setChemotypeFilter(new Set())}
                className="rounded-full px-2 py-1 text-[10px] leading-tight"
                style={{ color: 'var(--color-bloom-400)' }}
              >
                ✕ {t('varietyPicker.clearSelection')}
              </button>
            )}
          </div>
          <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-paper-300)' }}>
            {query || chemotypeFilter.size > 0
              ? tPlural('varietyPicker.results', filtered.length)
              : t('varietyPicker.allVarieties', { n: allSorted.length })}
          </p>
          {results.length === 0 && (
            <p className="px-3 py-2 text-xs" style={{ color: 'var(--color-paper-300)' }}>
              {t('varietyPicker.noMatch')}
            </p>
          )}
          {results.map((p) => {
            const documented = Boolean(p.info);
            const rates = formatCannabinoidRates(parseCannabinoidRates(p.description));
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(p);
                  setQuery('');
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:brightness-125"
                style={{ color: 'var(--color-paper-100)' }}
              >
                <span className="truncate">{p.name}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {rates && (
                    <span className="text-[9px] tabular-nums" style={{ color: 'var(--color-paper-300)' }}>
                      {rates}
                    </span>
                  )}
                  {documented && (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px]"
                      style={{ background: 'var(--color-resin-500)', color: 'var(--color-ink-900)' }}
                    >
                      {t('varietyPicker.fullSheet')}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {hasMore && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="block w-full px-3 py-1.5 text-center text-[10px] transition-colors hover:brightness-125"
              style={{ color: 'var(--color-ink-500)', background: 'var(--color-canopy-800)' }}
            >
              {t('varietyPicker.showMore', {
                shown: Math.min(PAGE_SIZE, filtered.length - results.length),
                remaining: filtered.length - results.length,
              })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
