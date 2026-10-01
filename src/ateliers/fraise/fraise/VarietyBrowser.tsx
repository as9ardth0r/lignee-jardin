import { useDeferredValue, useMemo, useState } from 'react';
import { FRUIT_COLORS, sizeClassOf, type FruitAppearance, type FruitColor, type SizeClass, type FaEngine } from '../engine/fraise/engine';
import { SPECIES, SPECIES_INFO, type SpeciesId } from '../engine/fraise/loci';
import { FA_KINDS, type FaKind, type FaVariety } from '../engine/fraise/varieties';
import { FruitDot, StrawberryPortrait } from './StrawberryPortrait';
import { useDcT, type FaKey, type TT } from './i18n';
import { appearanceSummary } from './summary';
import { formatTraitValue } from './format';


const INK500 = 'var(--color-ink-500)';

const SIZES: SizeClass[] = ['tiny', 'small', 'medium', 'large', 'giant'];

function normalize(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Résumé d’une variété à partir de ses caractères. */
export function describeVariety(v: FaVariety, app: FruitAppearance, tt: TT): string {
  const parts = [appearanceSummary(app, sizeClassOf(v.weightG), tt)];
  if (v.kinds.length) parts.push(v.kinds.map((k) => tt(`kind.${k}` as FaKey)).join(', '));
  return parts.join(' — ');
}

export function VarietyBrowser({
  engine,
  varieties,
  picked,
  onPick,
}: {
  engine: FaEngine;
  varieties: FaVariety[];
  picked: FaVariety;
  onPick: (v: FaVariety) => void;
}) {
  const { tt, language } = useDcT();
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<SpeciesId | 'all'>('all');
  const [color, setColor] = useState<FruitColor | 'all'>('all');
  const [habit, setHabit] = useState<'all' | 'juneBearing' | 'everbearing' | 'runnerless' | 'female'>('all');
  const [size, setSize] = useState<SizeClass | 'all'>('all');
  const [kind, setKind] = useState<FaKind | 'all'>('all');
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
      if (color !== 'all' && app.color !== color) return false;
      if (habit === 'juneBearing' && app.everbearing) return false;
      if (habit === 'everbearing' && !app.everbearing) return false;
      if (habit === 'runnerless' && !app.runnerless) return false;
      if (habit === 'female' && !app.maleSterile) return false;
      if (size !== 'all' && sizeClassOf(v.weightG) !== size) return false;
      if (kind !== 'all' && !v.kinds.includes(kind)) return false;
      return true;
    });
  }, [index, deferredQuery, species, color, habit, size, kind]);

  const activeFilters = (species !== 'all' ? 1 : 0) + (color !== 'all' ? 1 : 0) + (habit !== 'all' ? 1 : 0) + (size !== 'all' ? 1 : 0) + (kind !== 'all' ? 1 : 0);
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
            {sp === 'all' ? tt('filter.allSpecies') : <i>{tt(`species.${sp}` as FaKey)}</i>}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mt-2 space-y-2 rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setColor('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(color === 'all')}>
              {tt('filter.anyColor')}
            </button>
            {FRUIT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(color === c)}>
                <FruitDot appearance={{ color: c }} size={8} />
                {tt(`color.${c}` as FaKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {(['juneBearing', 'everbearing', 'runnerless', 'female'] as const).map((h) => (
              <button key={h} type="button" onClick={() => setHabit(habit === h ? 'all' : h)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(habit === h)}>
                {tt(`filter.${h}` as FaKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSize('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === 'all')}>
              {tt('filter.anySize')}
            </button>
            {SIZES.map((s) => (
              <button key={s} type="button" onClick={() => setSize(s)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === s)}>
                {tt(`size.${s}` as FaKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {FA_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setKind(kind === k ? 'all' : k)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(kind === k)}>
                {tt(`kind.${k}` as FaKey)}
              </button>
            ))}
          </div>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setSpecies('all');
                setColor('all');
                setHabit('all');
                setSize('all');
                setKind('all');
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
                {app.everbearing && (
                  <span className="rounded px-1 font-data text-[9px]" style={{ background: 'var(--color-bloom-500)', color: 'var(--color-paper-100)' }} title={tt('fruit.everbearing')}>
                    ↻
                  </span>
                )}
                <span className="font-data text-[9px] italic opacity-70">{v.species.slice(0, 4)}.</span>
                {app.maleSterile && (
                  <span className="rounded px-1 font-data text-[9px]" style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }} title={tt('fruit.female')}>
                    ♀
                  </span>
                )}
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
          <StrawberryPortrait seed={picked.id} appearance={pickedApp} weightUnit={engine.unitOfValue('weight', picked.weightG)} runners={picked.runners > 0} size={88} />
          <div className="min-w-0">
            <p className="font-display text-base leading-tight">{picked.name}</p>
            <p className="text-[11px] mt-0.5 italic" style={{ color: INK500 }}>
              {SPECIES_INFO[picked.species].latin}
              {picked.hybridWith ? ` × ${SPECIES_INFO[picked.hybridWith].latin}` : ''}
              {picked.origin ? <span className="not-italic"> · {picked.origin}</span> : null}
            </p>
            <p className="font-data text-[10px] mt-1" style={{ color: 'var(--color-ink-700)' }}>
              {picked.variants.length || picked.het?.length ? [...picked.variants.map((l) => engine.variantLabel(l)), ...(picked.het ?? []).map((l) => engine.hetLabel(l))].join(' ') : '+'}
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
          {formatTraitValue('weight', picked.weightG, tt, locale)} · {formatTraitValue('firmness', picked.firmness, tt, locale)} · {formatTraitValue('brix', picked.brix, tt, locale)} · {formatTraitValue('early', picked.early, tt, locale)} · {formatTraitValue('runners', picked.runners, tt, locale)}
          {picked.year ? ` · ${picked.year}` : ''}
          {picked.inbred ? ` · ${tt('founder.inbred')}` : ` · ${tt('founder.clone')}`}
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
        {!picked.inbred && picked.species === 'ananassa' && (
          <p className="text-[10px] mt-1.5 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
            {tt('sheet.cloneFounder')}
          </p>
        )}
      </div>
    </>
  );
}
