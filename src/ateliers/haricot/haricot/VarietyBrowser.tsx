import { useDeferredValue, useMemo, useState } from 'react';
import { POD_COLORS, SEED_COLORS as SEED_LIST, sizeClassOf, type FruitAppearance, type PodColor, type SeedColor, type SizeClass, type BeanEngine } from '../engine/haricot/engine';
import { SPECIES, SPECIES_INFO, type SpeciesId } from '../engine/haricot/loci';
import { BEAN_KINDS, type BeanKind, type BeanVariety } from '../engine/haricot/varieties';
import { FruitDot, BeanPortrait } from './BeanPortrait';
import { useBeanT, type BeanKey, type TT } from './i18n';


const INK500 = 'var(--color-ink-500)';

const SIZES: SizeClass[] = ['mini', 'small', 'medium', 'large', 'giant'];

function normalize(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Résumé d’une variété à partir de ses caractères. */
export function describeVariety(v: BeanVariety, app: FruitAppearance, tt: TT): string {
  const parts = [
    [
      `${tt(`seed.${app.seed}` as BeanKey)}${app.pattern !== 'plain' ? ` ${tt(`pattern.${app.pattern}` as BeanKey)}` : ''}`,
      tt(`size.${sizeClassOf(v.seed100)}` as BeanKey),
      tt(`pod.${app.pod}` as BeanKey) + (app.podStreaked ? ` ${tt('fruit.streaked')}` : ''),
      tt(app.bush ? 'plant.bush' : 'plant.pole'),
      app.stringless ? tt('fruit.stringless') : '',
      tt(`flower.${app.flower}` as BeanKey),
    ]
      .filter(Boolean)
      .join(' · '),
  ];
  if (v.kinds.length) parts.push(v.kinds.map((k) => tt(`kind.${k}` as BeanKey)).join(', '));
  return parts.join(' — ');
}

export function VarietyBrowser({
  engine,
  varieties,
  picked,
  onPick,
}: {
  engine: BeanEngine;
  varieties: BeanVariety[];
  picked: BeanVariety;
  onPick: (v: BeanVariety) => void;
}) {
  const { tt, language } = useBeanT();
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<SpeciesId | 'all'>('all');
  const [seedC, setSeedC] = useState<SeedColor | 'all'>('all');
  const [podC, setPodC] = useState<PodColor | 'all'>('all');
  const [habit, setHabit] = useState<'all' | 'bush' | 'pole'>('all');
  const [size, setSize] = useState<SizeClass | 'all'>('all');
  const [kind, setKind] = useState<BeanKind | 'all'>('all');
  const [hybridsOnly, setHybridsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const index = useMemo(
    () => varieties.map((v) => ({ v, app: engine.appearanceFromVariety(v), key: normalize(`${v.name} ${v.origin ?? ''} ${SPECIES_INFO[v.species].latin}`) })),
    [engine, varieties]
  );

  const results = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    return index.filter(({ v, app, key }) => {
      if (q && !key.includes(q)) return false;
      if (species !== 'all' && v.species !== species) return false;
      if (seedC !== 'all' && app.seed !== seedC) return false;
      if (podC !== 'all' && app.pod !== podC) return false;
      if (habit !== 'all' && app.bush !== (habit === 'bush')) return false;
      if (size !== 'all' && sizeClassOf(v.seed100) !== size) return false;
      if (kind !== 'all' && !v.kinds.includes(kind)) return false;
      if (hybridsOnly && !v.hybrid) return false;
      return true;
    });
  }, [index, deferredQuery, species, seedC, podC, habit, size, kind, hybridsOnly]);

  const activeFilters = (species !== 'all' ? 1 : 0) + (seedC !== 'all' ? 1 : 0) + (podC !== 'all' ? 1 : 0) + (habit !== 'all' ? 1 : 0) + (size !== 'all' ? 1 : 0) + (kind !== 'all' ? 1 : 0) + (hybridsOnly ? 1 : 0);
  const pickedApp = engine.appearanceFromVariety(picked);
  const chip = (active: boolean) => ({
    background: active ? 'var(--color-tomato-500)' : 'var(--color-paper-300)',
    color: active ? 'var(--color-paper-100)' : 'var(--color-ink-700)',
  });

  return (
    <>
      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tt('founder.searchMany', { n: varieties.length })}
          className="min-w-0 flex-1 rounded px-2.5 py-2 text-sm outline-none"
          style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
        />
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className="shrink-0 rounded px-2.5 text-xs"
          style={{ background: activeFilters ? 'var(--color-tomato-500)' : 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}
        >
          {tt('founder.filters')}
          {activeFilters ? ` · ${activeFilters}` : ''}
        </button>
      </div>

      {/* Espèces : toujours visibles, c’est le premier critère pour croiser */}
      <div className="mt-2 flex flex-wrap gap-1">
        {(['all', ...SPECIES] as Array<SpeciesId | 'all'>).map((sp) => (
          <button key={sp} type="button" onClick={() => setSpecies(sp)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(species === sp)} title={sp === 'all' ? '' : SPECIES_INFO[sp].name[language]}>
            {sp === 'all' ? tt('filter.allSpecies') : <i>{tt(`species.${sp}` as BeanKey)}</i>}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mt-2 space-y-2 rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSeedC('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(seedC === 'all')}>
              {tt('filter.anySeed')}
            </button>
            {SEED_LIST.map((c) => (
              <button key={c} type="button" onClick={() => setSeedC(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(seedC === c)}>
                <FruitDot appearance={{ seed: c, pattern: 'plain' }} size={8} />
                {tt(`seed.${c}` as BeanKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setPodC('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(podC === 'all')}>
              {tt('filter.anyPod')}
            </button>
            {POD_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setPodC(c)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(podC === c)}>
                {tt(`pod.${c}` as BeanKey)}
              </button>
            ))}
            {(['bush', 'pole'] as const).map((h) => (
              <button key={h} type="button" onClick={() => setHabit(habit === h ? 'all' : h)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(habit === h)}>
                {tt(`plant.${h}` as BeanKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSize('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === 'all')}>
              {tt('filter.anySize')}
            </button>
            {SIZES.map((s) => (
              <button key={s} type="button" onClick={() => setSize(s)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === s)}>
                {tt(`size.${s}` as BeanKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {BEAN_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setKind(kind === k ? 'all' : k)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(kind === k)}>
                {tt(`kind.${k}` as BeanKey)}
              </button>
            ))}
            <button type="button" aria-pressed={hybridsOnly} onClick={() => setHybridsOnly((b) => !b)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(hybridsOnly)}>
              F1 {tt('filter.hybrid')}
            </button>
          </div>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setSpecies('all');
                setSeedC('all');
                setPodC('all');
                setHabit('all');
                setSize('all');
                setKind('all');
                setHybridsOnly(false);
              }}
              className="text-[11px] underline"
              style={{ color: INK500 }}
            >
              {tt('filter.reset')}
            </button>
          )}
        </div>
      )}

      <p className="mt-2 text-[11px]" style={{ color: INK500 }}>
        {tt('founder.resultCount', { n: results.length })}
      </p>
      <ul className="mt-1 max-h-[300px] overflow-y-auto rounded" style={{ background: 'var(--color-paper-200)' }}>
        {results.map(({ v, app }) => {
          const active = v.id === picked.id;
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onPick(v)}
                className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-sm transition-colors"
                style={{ background: active ? 'var(--color-canopy-800)' : 'transparent', color: active ? 'var(--color-paper-100)' : 'var(--color-ink-900)' }}
              >
                <FruitDot appearance={app} size={14} />
                <span className="flex-1 truncate">
                  {v.source === 'custom' && (
                    <span className="mr-1" style={{ color: 'var(--color-tomato-500)' }} title={tt('filter.custom')}>
                      ✎
                    </span>
                  )}
                  {v.name}
                </span>
                {v.hybrid && (
                  <span className="rounded px-1 font-data text-[9px]" style={{ background: 'var(--color-bloom-500)', color: 'var(--color-paper-100)' }}>
                    F1
                  </span>
                )}
                <span className="font-data text-[9px] italic opacity-70">{v.species.slice(0, 4)}.</span>
                <span className="w-12 text-right font-data text-[9px] opacity-70">{v.seed100} g</span>
              </button>
            </li>
          );
        })}
        {results.length === 0 && (
          <li className="px-2.5 py-3 text-xs" style={{ color: INK500 }}>
            {tt('founder.noResult')}
          </li>
        )}
      </ul>

      <div className="mt-3 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
        <div className="flex items-center gap-3">
          <BeanPortrait seed={picked.id} appearance={pickedApp} weightUnit={engine.unitOfValue('seed', picked.seed100)} size={88} />
          <div className="min-w-0">
            <p className="font-display text-base leading-tight">{picked.name}</p>
            <p className="text-[11px] mt-0.5 italic" style={{ color: INK500 }}>
              {SPECIES_INFO[picked.species].latin}
              {picked.hybridWith ? ` × ${SPECIES_INFO[picked.hybridWith].latin}` : ''}
              {picked.origin ? <span className="not-italic"> · {picked.origin}</span> : null}
            </p>
            <p className="font-data text-[10px] mt-1" style={{ color: 'var(--color-ink-700)' }}>
              {picked.variants.length ? picked.variants.map((l) => engine.variantLabel(l)).join(' ') : '+'}
            </p>
          </div>
        </div>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
          {describeVariety(picked, pickedApp, tt)}
        </p>
        {picked.notes && (
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-ink-700)', fontWeight: 400 }}>
            {picked.notes[language]}
          </p>
        )}
        <p className="font-data text-[10px] mt-1.5" style={{ color: INK500 }}>
          {tt('trait.seed')} {picked.seed100} g · {tt('trait.podLength')} {picked.podCm} cm · {picked.pods} {tt('sheet.podsUnit')} · {picked.days} {tt('trait.daysUnit')} · {picked.heightCm} cm
        </p>
        {picked.source === 'curated' ? (
          <p className="text-[10px] mt-1.5 leading-snug italic" style={{ color: INK500 }}>
            {tt('founder.catalogNote')}
          </p>
        ) : (
          <p className="text-[10px] mt-1.5 leading-snug italic" style={{ color: INK500 }}>
            {tt('myvar.note')}
          </p>
        )}
        {picked.hybrid && (
          <p className="text-[10px] mt-1.5 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
            {tt('sheet.hybridFounder')}
          </p>
        )}
      </div>
    </>
  );
}
