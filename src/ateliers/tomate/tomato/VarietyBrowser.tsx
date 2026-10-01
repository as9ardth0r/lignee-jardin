import { useDeferredValue, useMemo, useState } from 'react';
import type { FruitAppearance, TomatoEngine } from '../engine/tomato/engine';
import type { TomatoVariety } from '../engine/tomato/varieties';
import { FruitDot, TomatoPortrait } from './TomatoPortrait';
import { useTomatoT, type TomatoKey } from './i18n';

const INK500 = 'var(--color-ink-500)';
const MAX_SHOWN = 150;

type ColorFilter = 'all' | FruitAppearance['colorKey'] | 'striped' | 'blue';
type SizeFilter = 'all' | 'cherry' | 'cocktail' | 'medium' | 'large';
const COLOR_FILTERS: ColorFilter[] = ['all', 'red', 'pink', 'yellow', 'orange', 'crimson', 'bicolor', 'black', 'purple', 'green', 'cream', 'striped', 'blue'];
const SIZE_FILTERS: SizeFilter[] = ['all', 'cherry', 'cocktail', 'medium', 'large'];
type PlantFlag = 'det' | 'indet' | 'dwarf' | 'potato';

function sizeOf(w: number): Exclude<SizeFilter, 'all'> {
  return w < 30 ? 'cherry' : w < 90 ? 'cocktail' : w < 250 ? 'medium' : 'large';
}

function normalize(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Texte descriptif d'une variété du catalogue élargi, composé à partir de
 * ses caractères (le site source ne fournit pas de texte réutilisable). */
export function describeVariety(v: TomatoVariety, app: FruitAppearance, tt: ReturnType<typeof useTomatoT>['tt']): string {
  const parts = [
    `${tt(`color.${app.colorKey}` as TomatoKey)} · ${tt(`shape.${app.shape}` as TomatoKey)} · ${tt(`size.${sizeOf(v.weightG)}` as TomatoKey)}`,
  ];
  if (v.kinds?.length) parts.push(v.kinds.map((k) => tt(`kind.${k}` as TomatoKey)).join(', '));
  const notes = (v.flags ?? []).filter((f) => f !== 'hybrid').map((f) => tt(`flag.${f}` as TomatoKey));
  return [parts.join(' — '), ...notes].join(' ');
}

export function VarietyBrowser({
  engine,
  varieties,
  loading,
  picked,
  onPick,
}: {
  engine: TomatoEngine;
  varieties: TomatoVariety[];
  loading: boolean;
  picked: TomatoVariety;
  onPick: (v: TomatoVariety) => void;
}) {
  const { tt, language } = useTomatoT();
  const [query, setQuery] = useState('');
  const [color, setColor] = useState<ColorFilter>('all');
  const [size, setSize] = useState<SizeFilter>('all');
  const [plant, setPlant] = useState<PlantFlag[]>([]);
  const [curatedOnly, setCuratedOnly] = useState(false);
  const [hybridsOnly, setHybridsOnly] = useState<'all' | 'op' | 'f1'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const deferredQuery = useDeferredValue(query);

  // Apparence précalculée une fois par variété (plusieurs milliers)
  const index = useMemo(
    () =>
      varieties.map((v) => ({
        v,
        app: engine.appearanceFromVariants(v.variants, v.weightG),
        key: normalize(`${v.name} ${v.origin}`),
      })),
    [engine, varieties]
  );

  const results = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    return index.filter(({ v, app, key }) => {
      if (q && !key.includes(q)) return false;
      if (curatedOnly && v.source === 'tomatobase') return false;
      if (hybridsOnly === 'op' && v.hybrid) return false;
      if (hybridsOnly === 'f1' && !v.hybrid) return false;
      if (color === 'striped' ? !app.striped : color === 'blue' ? app.anthocyanin === 'none' : color !== 'all' && app.colorKey !== color)
        return false;
      if (size !== 'all' && sizeOf(v.weightG) !== size) return false;
      for (const f of plant) {
        if (f === 'det' && !v.variants.includes('sp')) return false;
        if (f === 'indet' && v.variants.includes('sp')) return false;
        if (f === 'dwarf' && !v.variants.includes('d')) return false;
        if (f === 'potato' && !v.variants.includes('c')) return false;
      }
      return true;
    });
  }, [index, deferredQuery, color, size, plant, curatedOnly, hybridsOnly]);

  const activeFilters = (color !== 'all' ? 1 : 0) + (size !== 'all' ? 1 : 0) + plant.length + (curatedOnly ? 1 : 0) + (hybridsOnly !== 'all' ? 1 : 0);
  const pickedApp = engine.appearanceFromVariants(picked.variants, picked.weightG);
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
          placeholder={tt('founder.searchMany', { n: varieties.length.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') })}
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

      {showFilters && (
        <div className="mt-2 space-y-2 rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
          <div className="flex flex-wrap gap-1">
            {COLOR_FILTERS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(color === c)}>
                {c !== 'all' && c !== 'striped' && c !== 'blue' && (
                  <FruitDot appearance={{ ...pickedApp, colorKey: c, striped: false, anthocyanin: 'none' }} size={9} />
                )}
                {c === 'all' ? tt('filter.all') : c === 'striped' ? tt('fruit.striped') : c === 'blue' ? tt('filter.blue') : tt(`color.${c}` as TomatoKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {SIZE_FILTERS.map((s) => (
              <button key={s} type="button" onClick={() => setSize(s)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === s)}>
                {s === 'all' ? tt('filter.anySize') : tt(`size.${s}` as TomatoKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {(['indet', 'det', 'dwarf', 'potato'] as PlantFlag[]).map((f) => {
              const on = plant.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPlant((p) => (on ? p.filter((x) => x !== f) : [...p.filter((x) => !(f === 'det' && x === 'indet') && !(f === 'indet' && x === 'det')), f]))}
                  className="rounded px-1.5 py-0.5 text-[11px]"
                  style={chip(on)}
                >
                  {tt(`filter.${f}` as TomatoKey)}
                </button>
              );
            })}
            <button type="button" aria-pressed={curatedOnly} onClick={() => setCuratedOnly((c) => !c)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(curatedOnly)}>
              ★ {tt('filter.curated')}
            </button>
            <button
              type="button"
              aria-pressed={hybridsOnly === 'f1'}
              onClick={() => setHybridsOnly((h) => (h === 'f1' ? 'all' : 'f1'))}
              className="rounded px-1.5 py-0.5 text-[11px]"
              style={chip(hybridsOnly === 'f1')}
            >
              F1 {tt('filter.hybrid')}
            </button>
          </div>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setColor('all');
                setSize('all');
                setPlant([]);
                setCuratedOnly(false);
                setHybridsOnly('all');
              }}
              className="text-[11px] underline"
              style={{ color: INK500 }}
            >
              {tt('filter.reset')}
            </button>
          )}
        </div>
      )}

      <p className="mt-2 text-[11px]" style={{ color: 'var(--color-ink-500)' }}>
        {loading ? tt('founder.loadingCatalog') : tt('founder.resultCount', { n: results.length.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') })}
      </p>
      <ul className="mt-1 max-h-[300px] overflow-y-auto rounded" style={{ background: 'var(--color-paper-200)' }}>
        {results.slice(0, MAX_SHOWN).map(({ v, app }) => {
          const active = v.id === picked.id;
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onPick(v)}
                className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-sm transition-colors"
                style={{
                  background: active ? 'var(--color-canopy-800)' : 'transparent',
                  color: active ? 'var(--color-paper-100)' : 'var(--color-ink-900)',
                }}
              >
                <FruitDot appearance={app} size={14} />
                <span className="flex-1 truncate">
                  {v.source === 'custom' ? (
                    <span className="mr-1" style={{ color: 'var(--color-tomato-500)' }} title={tt('filter.custom')}>
                      ✎
                    </span>
                  ) : v.source !== 'tomatobase' ? (
                    <span className="mr-1" style={{ color: 'var(--color-resin-600)' }} title={tt('filter.curated')}>
                      ★
                    </span>
                  ) : null}
                  {v.name}
                </span>
                {v.hybrid && (
                  <span className="rounded px-1 font-data text-[9px]" style={{ background: 'var(--color-bloom-500)', color: 'var(--color-paper-100)' }}>
                    F1
                  </span>
                )}
                <span className="font-data text-[10px] opacity-70">{v.weightG} g</span>
              </button>
            </li>
          );
        })}
        {results.length > MAX_SHOWN && (
          <li className="px-2.5 py-2 text-[11px] italic" style={{ color: INK500 }}>
            {tt('founder.moreResults', { n: (results.length - MAX_SHOWN).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') })}
          </li>
        )}
        {results.length === 0 && !loading && (
          <li className="px-2.5 py-3 text-xs" style={{ color: INK500 }}>
            {tt('founder.noResult')}
          </li>
        )}
      </ul>

      <div className="mt-3 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
        <div className="flex items-center gap-3">
          <TomatoPortrait
            seed={picked.id}
            appearance={pickedApp}
            weightUnit={engine.unitOfValue('weight', picked.weightG)}
            potatoLeaf={picked.variants.includes('c')}
            determinate={picked.variants.includes('sp')}
            dwarf={picked.variants.includes('d')}
            size={84}
          />
          <div className="min-w-0">
            <p className="font-display text-base leading-tight">{picked.name}</p>
            {picked.origin && (
              <p className="text-[11px] mt-0.5" style={{ color: INK500 }}>
                {picked.origin}
              </p>
            )}
            <p className="font-data text-[10px] mt-1" style={{ color: 'var(--color-ink-700)' }}>
              {picked.variants.length ? picked.variants.map((l) => engine.variantLabel(l)).join(' ') : '+'}
            </p>
          </div>
        </div>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
          {picked.description ? picked.description[language] : describeVariety(picked, pickedApp, tt)}
        </p>
        <p className="font-data text-[10px] mt-1.5" style={{ color: INK500 }}>
          {picked.source === 'tomatobase' ? '≈ ' : ''}
          {picked.weightG} g · {picked.brix}°Brix · {picked.days} {tt('trait.daysUnit')} · {picked.yieldKg} {tt('trait.yieldUnit')}
        </p>
        {picked.source === 'tomatobase' && (
          <p className="text-[10px] mt-1.5 leading-snug italic" style={{ color: INK500 }}>
            {tt('founder.tomatobaseNote')}
          </p>
        )}
        {picked.hybrid && (
          <p className="text-[10px] mt-1.5 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
            {tt('sheet.hybridFounder')}
          </p>
        )}
        {picked.source === 'custom' && (
          <p className="text-[10px] mt-1.5 leading-snug italic" style={{ color: INK500 }}>
            {tt('myvar.note')}
            {picked.notes ? ` — ${picked.notes}` : ''}
          </p>
        )}
      </div>
    </>
  );
}
