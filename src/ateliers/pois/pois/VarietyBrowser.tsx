import { useDeferredValue, useMemo, useState } from 'react';
import { POD_TYPES, sizeClassOf, type FruitAppearance, type PodType, type SizeClass, type PsEngine } from '../engine/pois/engine';
import { SPECIES, SPECIES_INFO, type SpeciesId } from '../engine/pois/loci';
import { PS_KINDS, type PsKind, type PsVariety } from '../engine/pois/varieties';
import { FruitDot, PeaPortrait, Seed } from './PeaPortrait';
import { usePsT, type PsKey, type TT } from './i18n';
import { appearanceSummary } from './summary';
import { formatTraitValue } from './format';


const INK500 = 'var(--color-ink-500)';

const SIZES: SizeClass[] = ['mini', 'small', 'medium', 'large', 'giant'];

function normalize(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Résumé d’une variété à partir de ses caractères. */
export function describeVariety(v: PsVariety, app: FruitAppearance, tt: TT): string {
  const parts = [appearanceSummary(app, sizeClassOf(v.weightG), tt)];
  if (v.kinds.length) parts.push(v.kinds.map((k) => tt(`kind.${k}` as PsKey)).join(', '));
  return parts.join(' — ');
}

export function VarietyBrowser({
  engine,
  varieties,
  picked,
  onPick,
}: {
  engine: PsEngine;
  varieties: PsVariety[];
  picked: PsVariety;
  onPick: (v: PsVariety) => void;
}) {
  const { tt, language } = usePsT();
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<SpeciesId | 'all'>('all');
  const [seedC, setSeedC] = useState<'all' | 'round-yellow' | 'round-green' | 'wrinkled-yellow' | 'wrinkled-green'>('all');
  const [podT, setPodT] = useState<PodType | 'all'>('all');
  const [purpleOnly, setPurpleOnly] = useState(false);
  const [habit, setHabit] = useState<'all' | 'dwarf' | 'tall' | 'afila' | 'winter'>('all');
  const [size, setSize] = useState<SizeClass | 'all'>('all');
  const [kind, setKind] = useState<PsKind | 'all'>('all');
  const [hybridsOnly, setHybridsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

  const index = useMemo(
    () => varieties.map((v) => ({ v, app: engine.appearanceFromVariety(v), key: normalize(`${v.name} ${v.origin ?? ''} ${SPECIES_INFO[v.species].latin}`) })),
    [engine, varieties]
  );

  const results = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    return index.filter(({ v, app, key }) => {
      if (q && !key.includes(q)) return false;
      if (species !== 'all' && v.species !== species) return false;
      if (seedC !== 'all' && `${app.seedShape}-${app.cotyledon}` !== seedC) return false;
      if (podT !== 'all' && app.pod !== podT) return false;
      if (purpleOnly && app.flower === 'white') return false;
      if (habit === 'dwarf' && !app.dwarf) return false;
      if (habit === 'tall' && app.dwarf) return false;
      if (habit === 'afila' && app.leaf === 'normal') return false;
      if (habit === 'winter' && !app.winter) return false;
      if (size !== 'all' && sizeClassOf(v.weightG) !== size) return false;
      if (kind !== 'all' && !v.kinds.includes(kind)) return false;
      if (hybridsOnly && !v.hybrid) return false;
      return true;
    });
  }, [index, deferredQuery, species, seedC, podT, purpleOnly, habit, size, kind, hybridsOnly]);

  const activeFilters = (species !== 'all' ? 1 : 0) + (seedC !== 'all' ? 1 : 0) + (podT !== 'all' ? 1 : 0) + (purpleOnly ? 1 : 0) + (habit !== 'all' ? 1 : 0) + (size !== 'all' ? 1 : 0) + (kind !== 'all' ? 1 : 0) + (hybridsOnly ? 1 : 0);
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
            {sp === 'all' ? tt('filter.allSpecies') : <i>{tt(`species.${sp}` as PsKey)}</i>}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mt-2 space-y-2 rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSeedC('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(seedC === 'all')}>
              {tt('filter.anySeed')}
            </button>
            {(['round-yellow', 'round-green', 'wrinkled-yellow', 'wrinkled-green'] as const).map((c) => {
              const [shape, coty] = c.split('-') as ['round' | 'wrinkled', 'yellow' | 'green'];
              return (
                <button key={c} type="button" onClick={() => setSeedC(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(seedC === c)}>
                  <svg width={10} height={10} viewBox="-6 -6 12 12" aria-hidden="true">
                    <Seed x={0} y={0} r={4.6} shape={shape} cotyledon={coty} coat="clear" />
                  </svg>
                  {tt(`seed.${shape}` as PsKey)} {tt(`coty.${coty}` as PsKey)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setPodT('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(podT === 'all')}>
              {tt('filter.anyPod')}
            </button>
            {POD_TYPES.map((c) => (
              <button key={c} type="button" onClick={() => setPodT(c)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(podT === c)}>
                {tt(`pod.${c}` as PsKey)}
              </button>
            ))}
            <button type="button" aria-pressed={purpleOnly} onClick={() => setPurpleOnly((b) => !b)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(purpleOnly)}>
              {tt('filter.purple')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(['dwarf', 'tall', 'afila', 'winter'] as const).map((h) => (
              <button key={h} type="button" onClick={() => setHabit(habit === h ? 'all' : h)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(habit === h)}>
                {tt(`filter.${h}` as PsKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSize('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === 'all')}>
              {tt('filter.anySize')}
            </button>
            {SIZES.map((s) => (
              <button key={s} type="button" onClick={() => setSize(s)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === s)}>
                {tt(`size.${s}` as PsKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {PS_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setKind(kind === k ? 'all' : k)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(kind === k)}>
                {tt(`kind.${k}` as PsKey)}
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
                setPodT('all');
                setPurpleOnly(false);
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
                <svg width={11} height={11} viewBox="-6 -6 12 12" aria-hidden="true" className="shrink-0"><Seed x={0} y={0} r={4.6} shape={app.seedShape} cotyledon={app.cotyledon} coat={app.coat} /></svg>
                <span className="w-14 text-right font-data text-[9px] opacity-70">{formatTraitValue('weight', v.weightG, tt, locale)}</span>
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
          <PeaPortrait seed={picked.id} appearance={pickedApp} weightUnit={engine.unitOfValue('weight', picked.weightG)} size={88} />
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
          {formatTraitValue('weight', picked.weightG, tt, locale)} · {formatTraitValue('days', picked.days, tt, locale)} · {formatTraitValue('height', picked.heightCm, tt, locale)} · {tt('sheet.seed100', { g: picked.seed100 })}
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
