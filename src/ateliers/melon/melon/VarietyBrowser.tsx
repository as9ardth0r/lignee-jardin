import { useDeferredValue, useMemo, useState } from 'react';
import { sizeClassOf, type FleshColor, type FruitAppearance, type RindColor, type SizeClass, type MelonEngine } from '../engine/melon/engine';
import { GROUPS, type MelonGroup } from '../engine/melon/loci';
import type { MelonKind, MelonVariety } from '../engine/melon/varieties';
import { FruitDot, MelonPortrait } from './MelonPortrait';
import { useMelonT, type MelonKey, type TT } from './i18n';
import { formatKg } from './format';

const INK500 = 'var(--color-ink-500)';

const FLESHES: FleshColor[] = ['orange', 'green', 'white'];
const RINDS: RindColor[] = ['green', 'yellow', 'cream'];
const SIZES: SizeClass[] = ['mini', 'small', 'medium', 'large', 'giant'];
const KINDS: MelonKind[] = ['charentais', 'netted', 'winter', 'asian', 'snake', 'ornamental', 'donor'];
const FLESH_DOT: Record<FleshColor, string> = { orange: '#f29a45', green: '#b9d27a', white: '#efe8cf' };

function normalize(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Résumé d’une variété à partir de ses caractères. */
export function describeVariety(v: MelonVariety, app: FruitAppearance, tt: TT): string {
  const parts = [
    [tt('flesh.label', { c: tt(`flesh.${app.flesh}` as MelonKey) }), tt(`rind.${app.rind}` as MelonKey), tt(`shape.${app.shape}` as MelonKey), tt(`size.${sizeClassOf(v.weightKg)}` as MelonKey)]
      .concat(app.netted ? [tt('fruit.netted')] : [], app.sutures ? [tt('fruit.sutures')] : [], app.mottled ? [tt('fruit.mottled')] : [])
      .join(' · '),
    tt(`sex.${app.sex}` as MelonKey),
  ];
  if (v.kinds.length) parts.push(v.kinds.map((k) => tt(`kind.${k}` as MelonKey)).join(', '));
  return parts.join(' — ');
}

export function VarietyBrowser({
  engine,
  varieties,
  picked,
  onPick,
}: {
  engine: MelonEngine;
  varieties: MelonVariety[];
  picked: MelonVariety;
  onPick: (v: MelonVariety) => void;
}) {
  const { tt, language } = useMelonT();
  const [query, setQuery] = useState('');
  const [kind0, setKind0] = useState<MelonKind | 'all'>('all');
  const [flesh, setFlesh] = useState<FleshColor | 'all'>('all');
  const [rind, setRind] = useState<RindColor | 'all'>('all');
  const [size, setSize] = useState<SizeClass | 'all'>('all');
  const [group, setGroup] = useState<MelonGroup | 'all'>('all');
  const [hybridsOnly, setHybridsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const index = useMemo(
    () => varieties.map((v) => ({ v, app: engine.appearanceFromVariety(v), key: normalize(`${v.name} ${v.origin ?? ''} ${v.group} ${tt(`group.${v.group}` as MelonKey)}`) })),
    [engine, varieties, tt]
  );

  const results = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    return index.filter(({ v, app, key }) => {
      if (q && !key.includes(q)) return false;
      if (kind0 !== 'all' && !v.kinds.includes(kind0)) return false;
      if (flesh !== 'all' && app.flesh !== flesh) return false;
      if (group !== 'all' && v.group !== group) return false;
      if (rind !== 'all' && app.rind !== rind) return false;
      if (size !== 'all' && sizeClassOf(v.weightKg) !== size) return false;
      if (hybridsOnly && !v.hybrid) return false;
      return true;
    });
  }, [index, deferredQuery, kind0, flesh, group, rind, size, hybridsOnly]);

  const activeFilters = (flesh !== 'all' ? 1 : 0) + (group !== 'all' ? 1 : 0) + (rind !== 'all' ? 1 : 0) + (size !== 'all' ? 1 : 0) + (hybridsOnly ? 1 : 0);
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

      {/* Grands types de melons : toujours visibles */}
      <div className="mt-2 flex flex-wrap gap-1">
        {(['all', ...KINDS] as Array<MelonKind | 'all'>).map((k) => (
          <button key={k} type="button" onClick={() => setKind0(k)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(kind0 === k)}>
            {k === 'all' ? tt('filter.all') : tt(`kind.${k}` as MelonKey)}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mt-2 space-y-2 rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setFlesh('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(flesh === 'all')}>
              {tt('filter.anyFlesh')}
            </button>
            {FLESHES.map((c) => (
              <button key={c} type="button" onClick={() => setFlesh(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(flesh === c)}>
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: FLESH_DOT[c] }} />
                {tt('flesh.label', { c: tt(`flesh.${c}` as MelonKey) })}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setRind('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(rind === 'all')}>
              {tt('filter.anyRind')}
            </button>
            {RINDS.map((c) => (
              <button key={c} type="button" onClick={() => setRind(c)} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]" style={chip(rind === c)}>
                <FruitDot appearance={{ rind: c, netted: false, striped: false, bitter: false, sour: false }} size={9} />
                {tt(`rind.${c}` as MelonKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <select value={group} onChange={(e) => setGroup(e.target.value as MelonGroup | 'all')} className="rounded px-1.5 py-0.5 text-[11px] outline-none" style={chip(group !== 'all')} aria-label={tt('group.label')}>
              <option value="all">{tt('filter.allGroups')}</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {tt(`group.${g}` as MelonKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setSize('all')} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === 'all')}>
              {tt('filter.anySize')}
            </button>
            {SIZES.map((s) => (
              <button key={s} type="button" onClick={() => setSize(s)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(size === s)}>
                {tt(`size.${s}` as MelonKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button type="button" aria-pressed={hybridsOnly} onClick={() => setHybridsOnly((b) => !b)} className="rounded px-1.5 py-0.5 text-[11px]" style={chip(hybridsOnly)}>
              F1 {tt('filter.hybrid')}
            </button>
          </div>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setFlesh('all');
                setGroup('all');
                setRind('all');
                setSize('all');
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
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: FLESH_DOT[app.flesh] }} title={tt(`flesh.${app.flesh}` as MelonKey)} />
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
          <MelonPortrait seed={picked.id} appearance={pickedApp} weightUnit={engine.unitOfValue('weight', picked.weightKg)} size={88} />
          <div className="min-w-0">
            <p className="font-display text-base leading-tight">{picked.name}</p>
            <p className="text-[11px] mt-0.5 italic" style={{ color: INK500 }}>
              {tt(`group.${picked.group}` as MelonKey)}
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
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: pickedApp.bitter || pickedApp.sour ? 'var(--color-tomato-600)' : 'var(--color-ink-700)', fontWeight: pickedApp.bitter || pickedApp.sour ? 500 : 400 }}>
            {picked.notes[language]}
          </p>
        )}
        <p className="font-data text-[10px] mt-1.5" style={{ color: INK500 }}>
          ≈ {formatKg(picked.weightKg, locale)} × {picked.fruits} · {picked.brix}°Brix · {picked.days} {tt('trait.daysUnit')} · {tt('trait.storage')} {picked.storageDays} {tt('trait.daysUnit')}
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
