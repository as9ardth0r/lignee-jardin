import { useDeferredValue, useMemo, useState } from 'react';
import { FLESH_COLORS, SKIN_COLORS, TUBER_SHAPES, sizeClassOf, type FleshColor, type FruitAppearance, type SizeClass, type SkinColor, type TuberShape, type PtEngine } from '../engine/patate/engine';
import { SPECIES, SPECIES_INFO, type SpeciesId } from '../engine/patate/loci';
import { PT_KINDS, type PtKind, type PtVariety } from '../engine/patate/varieties';
import { FruitDot, PotatoPortrait } from './PotatoPortrait';
import { usePtT, type PtKey, type TT } from './i18n';
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
export function describeVariety(v: PtVariety, app: FruitAppearance, tt: TT): string {
  const parts = [appearanceSummary(app, sizeClassOf(v.weightKg), tt)];
  if (v.kinds.length) parts.push(v.kinds.map((k) => tt(`kind.${k}` as PtKey)).join(', '));
  return parts.join(' — ');
}

export function VarietyBrowser({
  engine,
  varieties,
  picked,
  onPick,
}: {
  engine: PtEngine;
  varieties: PtVariety[];
  picked: PtVariety;
  onPick: (v: PtVariety) => void;
}) {
  const { tt, language } = usePtT();
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState<SpeciesId | 'all'>('all');
  const [skinC, setSkinC] = useState<SkinColor | 'all'>('all');
  const [fleshC, setFleshC] = useState<FleshColor | 'all'>('all');
  const [shape, setShape] = useState<TuberShape | 'all'>('all');
  const [ploidy, setPloidy] = useState<'all' | '2' | '4' | 'other'>('all');
  const [size, setSize] = useState<SizeClass | 'all'>('all');
  const [kind, setKind] = useState<PtKind | 'all'>('all');
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
      if (skinC !== 'all' && app.skin !== skinC) return false;
      if (fleshC !== 'all' && app.flesh !== fleshC) return false;
      if (shape !== 'all' && app.shape !== shape) return false;
      if (ploidy !== 'all' && (ploidy === 'other' ? app.ploidy === 2 || app.ploidy === 4 : String(app.ploidy) !== ploidy)) return false;
      if (size !== 'all' && sizeClassOf(v.weightKg) !== size) return false;
      if (kind !== 'all' && !v.kinds.includes(kind)) return false;
      if (hybridsOnly && !v.hybrid) return false;
      return true;
    });
  }, [index, deferredQuery, species, skinC, fleshC, shape, ploidy, size, kind, hybridsOnly]);

  const activeFilters = (species !== 'all' ? 1 : 0) + (skinC !== 'all' ? 1 : 0) + (fleshC !== 'all' ? 1 : 0) + (shape !== 'all' ? 1 : 0) + (ploidy !== 'all' ? 1 : 0) + (size !== 'all' ? 1 : 0) + (kind !== 'all' ? 1 : 0) + (hybridsOnly ? 1 : 0);
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
            {sp === 'all' ? tt('filter.allSpecies') : <i>{tt(`species.${sp}` as PtKey)}</i>}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mt-2 space-y-2 rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSkinC('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(skinC === 'all')}>
              {tt('filter.anySkin')}
            </button>
            {SKIN_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setSkinC(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(skinC === c)}>
                <FruitDot appearance={{ skin: c, flesh: c === 'buff' ? 'cream' : c }} size={8} />
                {tt(`skin.${c}` as PtKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setFleshC('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(fleshC === 'all')}>
              {tt('filter.anyFlesh')}
            </button>
            {FLESH_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setFleshC(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(fleshC === c)}>
                <FruitDot appearance={{ skin: 'buff', flesh: c }} size={8} />
                {tt(`flesh.${c}` as PtKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {TUBER_SHAPES.map((c) => (
              <button key={c} type="button" onClick={() => setShape(shape === c ? 'all' : c)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(shape === c)}>
                {tt(`shape.${c}` as PtKey)}
              </button>
            ))}
            {(['2', '4', 'other'] as const).map((h) => (
              <button key={h} type="button" onClick={() => setPloidy(ploidy === h ? 'all' : h)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(ploidy === h)}>
                {tt(`filter.ploidy${h}` as PtKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSize('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === 'all')}>
              {tt('filter.anySize')}
            </button>
            {SIZES.map((s) => (
              <button key={s} type="button" onClick={() => setSize(s)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === s)}>
                {tt(`size.${s}` as PtKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {PT_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setKind(kind === k ? 'all' : k)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(kind === k)}>
                {tt(`kind.${k}` as PtKey)}
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
                setSkinC('all');
                setFleshC('all');
                setShape('all');
                setPloidy('all');
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
                <span className="font-data text-[9px] opacity-70">{app.ploidy}x</span>
                {v.cyto === 'W' && (
                  <span className="rounded px-1 font-data text-[9px]" style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}>
                    W
                  </span>
                )}
                <span className="w-14 text-right font-data text-[9px] opacity-70">{formatTraitValue('weight', v.weightKg, tt, locale)}</span>
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
          <PotatoPortrait seed={picked.id} appearance={pickedApp} weightUnit={engine.unitOfValue('weight', picked.weightKg)} size={88} />
          <div className="min-w-0">
            <p className="font-display text-base leading-tight">{picked.name}</p>
            <p className="text-[11px] mt-0.5 italic" style={{ color: INK500 }}>
              {SPECIES_INFO[picked.species].latin}
              {picked.hybridWith ? ` × ${SPECIES_INFO[picked.hybridWith].latin}` : ''}
              {picked.origin ? <span className="not-italic"> · {picked.origin}</span> : null}
            </p>
            <p className="font-data text-[10px] mt-1" style={{ color: 'var(--color-ink-700)' }}>
              {engine.varietyCode(picked) || '+'}
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
          {tt('sheet.ploidy', { p: pickedApp.ploidy, e: pickedApp.ebn })} · {formatTraitValue('weight', picked.weightKg, tt, locale)} · {formatTraitValue('days', picked.days, tt, locale)} · {formatTraitValue('dm', picked.dm, tt, locale)} · {formatTraitValue('frost', picked.frostC, tt, locale)}
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
