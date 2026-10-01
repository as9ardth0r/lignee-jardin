import { useDeferredValue, useMemo, useState } from 'react';
import { HEAT_CLASSES, RIPE_COLORS as RIPE_LIST, sizeClassOf, type FruitAppearance, type HeatClass, type RipeColor, type SizeClass, type PepperEngine } from '../engine/piment/engine';
import { SPECIES, SPECIES_INFO, type SpeciesId } from '../engine/piment/loci';
import { PEPPER_KINDS, type PepperKind, type PepperVariety } from '../engine/piment/varieties';
import { FruitDot, PepperPortrait } from './PepperPortrait';
import { usePepperT, type PepperKey, type TT } from './i18n';
import { formatKg, formatShu } from './format';

const INK500 = 'var(--color-ink-500)';

const SIZES: SizeClass[] = ['mini', 'small', 'medium', 'large', 'giant'];

function normalize(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Résumé d’une variété à partir de ses caractères. */
export function describeVariety(v: PepperVariety, app: FruitAppearance, tt: TT): string {
  const extra = [app.unripe !== 'green' ? tt(`unripe.${app.unripe}` as PepperKey) : '', app.erect ? tt('fruit.erect') : '', app.clustered ? tt('fruit.clustered') : ''].filter(Boolean);
  const parts = [[tt(`ripe.${app.ripe}` as PepperKey), tt(`shape.${app.shape}` as PepperKey), tt(`size.${sizeClassOf(v.weightKg)}` as PepperKey), tt(`heat.${app.heat}` as PepperKey), ...extra].join(' · ')];
  if (v.kinds.length) parts.push(v.kinds.map((k) => tt(`kind.${k}` as PepperKey)).join(', '));
  return parts.join(' — ');
}

export function VarietyBrowser({
  engine,
  varieties,
  picked,
  onPick,
}: {
  engine: PepperEngine;
  varieties: PepperVariety[];
  picked: PepperVariety;
  onPick: (v: PepperVariety) => void;
}) {
  const { tt, language } = usePepperT();
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<SpeciesId | 'all'>('all');
  const [ripe, setRipe] = useState<RipeColor | 'all'>('all');
  const [heat, setHeat] = useState<HeatClass | 'all'>('all');
  const [size, setSize] = useState<SizeClass | 'all'>('all');
  const [kind, setKind] = useState<PepperKind | 'all'>('all');
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
      if (ripe !== 'all' && app.ripe !== ripe) return false;
      if (heat !== 'all' && app.heat !== heat) return false;
      if (size !== 'all' && sizeClassOf(v.weightKg) !== size) return false;
      if (kind !== 'all' && !v.kinds.includes(kind)) return false;
      if (hybridsOnly && !v.hybrid) return false;
      return true;
    });
  }, [index, deferredQuery, species, ripe, heat, size, kind, hybridsOnly]);

  const activeFilters = (species !== 'all' ? 1 : 0) + (ripe !== 'all' ? 1 : 0) + (heat !== 'all' ? 1 : 0) + (size !== 'all' ? 1 : 0) + (kind !== 'all' ? 1 : 0) + (hybridsOnly ? 1 : 0);
  const pickedApp = engine.appearanceFromVariety(picked);
  const chip = (active: boolean) => ({
    background: active ? 'var(--color-tomato-500)' : 'var(--color-paper-300)',
    color: active ? 'var(--color-paper-100)' : 'var(--color-ink-700)',
  });
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

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
            {sp === 'all' ? tt('filter.allSpecies') : <i>{tt(`species.${sp}` as PepperKey)}</i>}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mt-2 space-y-2 rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setRipe('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(ripe === 'all')}>
              {tt('filter.anyColor')}
            </button>
            {RIPE_LIST.map((c) => (
              <button key={c} type="button" onClick={() => setRipe(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(ripe === c)}>
                <FruitDot appearance={{ ripe: c, unripe: 'green', heat: 'sweet' }} size={9} />
                {tt(`ripe.${c}` as PepperKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setHeat('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(heat === 'all')}>
              {tt('filter.anyHeat')}
            </button>
            {HEAT_CLASSES.map((h) => (
              <button key={h} type="button" onClick={() => setHeat(h)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(heat === h)}>
                {tt(`heat.${h}` as PepperKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSize('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === 'all')}>
              {tt('filter.anySize')}
            </button>
            {SIZES.map((s) => (
              <button key={s} type="button" onClick={() => setSize(s)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === s)}>
                {tt(`size.${s}` as PepperKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {PEPPER_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setKind(kind === k ? 'all' : k)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(kind === k)}>
                {tt(`kind.${k}` as PepperKey)}
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
                setRipe('all');
                setHeat('all');
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
                <span className="w-14 text-right font-data text-[9px] opacity-70">{v.shu ? formatShu(v.shu, tt, locale).replace(' SHU', '') : '0'}</span>
                <span className="w-12 text-right font-data text-[10px] opacity-70">{formatKg(v.weightKg, locale)}</span>
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
          <PepperPortrait seed={picked.id} appearance={pickedApp} weightUnit={engine.unitOfValue('weight', picked.weightKg)} size={88} />
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
          ≈ {formatKg(picked.weightKg, locale)} × {picked.fruits} · {formatShu(picked.shu, tt, locale)} · {picked.days} {tt('trait.daysUnit')} · {picked.heightCm} cm
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
