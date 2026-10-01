import { useMemo, useState } from 'react';
import { RealCrossGuide } from './RealCross';
import { MAIN_TRAITS, QUANT_TRAITS, type QuantTraitId, type MelonEngine, type MelonIndividual, type MelonJournalEntry, type SexType } from '../engine/melon/engine';
import { GROUPS, LOCUS_BY_ID, MELON_LOCI, variantInfo, type LocusCategory, type MelonGroup, type VariantId } from '../engine/melon/loci';
import { MELON_VARIETIES, type MelonVariety } from '../engine/melon/varieties';
import { FruitDot, MelonPortrait, fruitColor } from './MelonPortrait';
import { useMelonT, type MelonKey, type TT } from './i18n';
import { LOWER_IS_BETTER, TRAIT_COLOR, formatKg, formatTrait } from './format';
import { VarietyBrowser, describeVariety } from './VarietyBrowser';
import { CultureSheet, GardenSheet, MelonJournal, MelonNutrientPanel, MelonPedigree } from './extras';
import { gardenOutcome, type GardenSettings } from '../engine/melon/garden';

const INK500 = 'var(--color-ink-500)';
const RED = 'var(--color-tomato-600)';

// --- Petits utilitaires d'affichage ----------------------------------------

export function fruitSummary(engine: MelonEngine, ind: MelonIndividual, tt: TT): string {
  const app = engine.appearance(ind);
  const parts = [tt(`rind.${app.rind}` as MelonKey), tt(`shape.${app.shape}` as MelonKey), tt(`size.${engine.sizeClass(ind)}` as MelonKey), tt(`flesh.${app.flesh}` as MelonKey)];
  if (app.netted) parts.push(tt('fruit.netted'));
  if (app.sutures) parts.push(tt('fruit.sutures'));
  if (app.mottled) parts.push(tt('fruit.mottled'));
  if (app.striped) parts.push(tt('fruit.striped'));
  return parts.join(' · ');
}

export function groupLabel(ind: Pick<MelonIndividual, 'group'>, tt: TT): string {
  return ind.group ? tt(`group.${ind.group}` as MelonKey) : tt('group.mixed');
}

/** Encadré « type de fleurs » : qui peut être mère, père, faut-il castrer. */
export function FlowerBox({ engine, a, b }: { engine: MelonEngine; a: MelonIndividual; b: MelonIndividual | null }) {
  const { tt } = useMelonT();
  const sa = engine.sexType(a);
  const sb = b ? engine.sexType(b) : null;
  const noPollen = b ? !engine.canPollinate(b) : !engine.canPollinate(a);
  const tone = noPollen
    ? { bg: '#f6ded8', border: '#b8412a', color: '#7a2414', icon: '⛔' }
    : engine.needsEmasculation(a)
      ? { bg: '#f7ecd2', border: 'var(--color-resin-500)', color: '#6b4a10', icon: '✂' }
      : { bg: 'var(--color-paper-200)', border: 'var(--color-leaf-500)', color: 'var(--color-ink-700)', icon: '✓' };
  return (
    <div className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: tone.bg, borderLeft: `3px solid ${tone.border}`, color: tone.color }}>
      <p className="font-semibold">
        {tone.icon} {tt('flower.title')} · A : {tt(`sex.${sa}` as MelonKey)}
        {sb && b && b.id !== a.id ? ` · B : ${tt(`sex.${sb}` as MelonKey)}` : ''}
      </p>
      {noPollen ? (
        <p className="mt-1">{tt(b ? 'flower.noPollenFather' : 'flower.noPollenSelf')}</p>
      ) : (
        <p className="mt-1">{tt(engine.needsEmasculation(a) ? 'flower.emasculate' : 'flower.noEmasculate')}</p>
      )}
      <p className="mt-1 opacity-80">🐝 {tt('flower.garden')}</p>
    </div>
  );
}

export function TraitBar({ engine, ind, trait, large }: { engine: MelonEngine; ind: MelonIndividual; trait: QuantTraitId; large?: boolean }) {
  const { tt, language } = useMelonT();
  const u = engine.unitOf(trait, ind);
  const pct = (LOWER_IS_BETTER[trait] ? 1 - u : u) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-1.5">
        <span className={`min-w-0 truncate ${large ? 'text-xs' : 'text-[10px]'}`} style={{ color: INK500 }} title={tt(`trait.${trait}` as MelonKey)}>
          {tt(`trait.${trait}` as MelonKey)}
        </span>
        <span className={`shrink-0 font-data ${large ? 'text-xs' : 'text-[10px]'}`} style={{ color: 'var(--color-ink-700)' }}>
          {formatTrait(ind, trait, tt, language === 'fr' ? 'fr-FR' : 'en-US')}
        </span>
      </div>
      <div className={`mt-0.5 w-full overflow-hidden rounded-full ${large ? 'h-2' : 'h-1'}`} style={{ background: 'var(--color-paper-300)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(3, pct)}%`, background: TRAIT_COLOR[trait] }} />
      </div>
    </div>
  );
}

function Seg({ options, value, onChange }: { options: Array<{ id: string; label: string }>; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex rounded p-0.5" style={{ background: 'var(--color-canopy-800)' }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className="flex-1 rounded px-2 py-1.5 text-xs transition-colors"
          style={{ background: value === o.id ? 'var(--color-resin-500)' : 'transparent', color: value === o.id ? 'var(--color-ink-900)' : 'var(--color-paper-200)' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function GardenLine({ engine, ind, garden }: { engine: MelonEngine; ind: MelonIndividual; garden: GardenSettings }) {
  const { tt, language } = useMelonT();
  const out = gardenOutcome(engine, ind, garden);
  const loss = Math.round(out.totalLoss * 100);
  return (
    <p className="mt-2 text-[10px] font-data" style={{ color: loss >= 35 ? 'var(--color-tomato-500)' : INK500 }}>
      🌦 {formatKg(out.realizedKg, language === 'fr' ? 'fr-FR' : 'en-US')} {tt('garden.inGarden')} (−{loss} %)
    </p>
  );
}

const chipStyle = { background: 'var(--color-paper-200)', color: 'var(--color-ink-700)' };

// --- Carte ------------------------------------------------------------------

export function MelonCard({
  engine,
  ind,
  garden,
  selectedSlot,
  focused,
  fresh,
  onFocus,
  onToggleSelect,
}: {
  engine: MelonEngine;
  ind: MelonIndividual;
  garden: GardenSettings;
  selectedSlot: 'A' | 'B' | null;
  focused: boolean;
  fresh: boolean;
  onFocus: () => void;
  onToggleSelect: () => void;
}) {
  const { tt, language } = useMelonT();
  const app = engine.appearance(ind);
  const fixed = engine.isFixed(ind);
  const seg = engine.segregatingLoci(ind).length;
  const res = engine.resistances(ind);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFocus}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onFocus())}
      className={`specimen-card relative cursor-pointer p-3.5 transition-transform hover:-translate-y-0.5 ${fresh ? 'animate-sprout' : ''}`}
      style={{
        outline: focused ? '2px solid var(--color-tomato-500)' : selectedSlot ? '2px solid var(--color-resin-500)' : undefined,
        outlineOffset: 1,
        opacity: ind.archived ? 0.55 : 1,
      }}
    >
      <button
        type="button"
        aria-pressed={Boolean(selectedSlot)}
        title={tt('card.select')}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full font-data text-[11px] font-semibold"
        style={{
          background: selectedSlot ? 'var(--color-resin-500)' : 'transparent',
          color: 'var(--color-ink-900)',
          boxShadow: selectedSlot ? 'none' : 'inset 0 0 0 1.5px var(--color-ink-500)',
        }}
      >
        {selectedSlot ?? ''}
        <span className="sr-only">{tt('card.select')}</span>
      </button>

      <div className="flex items-start gap-3 pr-7">
        <div className="-ml-1 -mt-1 shrink-0">
          <MelonPortrait seed={ind.id} appearance={app} weightUnit={engine.unitOf('weight', ind)} size={68} />
        </div>
        <div className="min-w-0">
          <p className="font-data text-[10px] uppercase tracking-wide" style={{ color: INK500 }}>
            {ind.generation === 0 ? 'P' : `F${ind.generation}`}
            {ind.selfed ? ' · ⊗' : ''} · {ind.id}
          </p>
          <p className="font-display text-base leading-tight mt-0.5 truncate" title={ind.label}>
            {ind.label}
          </p>
          <p className="text-[10px] italic" style={{ color: INK500 }}>
            {groupLabel(ind, tt)}
          </p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-ink-700)' }}>
            {fruitSummary(engine, ind, tt)}
          </p>
        </div>
      </div>

      {(app.bitter || app.sour) && (
        <p className="mt-2 rounded px-2 py-1 text-[11px] font-semibold" style={{ background: '#b8412a', color: '#fff' }}>
          ⚠ {tt(app.bitter ? 'fruit.bitter' : 'fruit.sour')}
        </p>
      )}

      <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1.5">
        {MAIN_TRAITS.map((trait) => (
          <TraitBar key={trait} engine={engine} ind={ind} trait={trait} />
        ))}
      </div>

      <GardenLine engine={engine} ind={ind} garden={garden} />

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
        {ind.hybridFounder && (
          <span className="rounded px-1.5 py-0.5 font-data" style={{ background: 'var(--color-bloom-500)', color: 'var(--color-paper-100)' }}>
            F1
          </span>
        )}
        <span
          className="rounded px-1.5 py-0.5 font-data"
          style={{ background: fixed ? 'var(--color-leaf-500)' : 'var(--color-paper-300)', color: fixed ? 'var(--color-paper-100)' : 'var(--color-ink-700)' }}
        >
          {fixed ? `✓ ${tt('card.fixed')}` : seg === 0 ? `≈ ${tt('card.nearlyFixed')}` : tt('card.segregating', { n: seg })}
        </span>
        <span className="rounded px-1.5 py-0.5" style={chipStyle} title={tt(`sex.${app.sex}.desc` as MelonKey)}>
          {tt(`sexShort.${app.sex}` as MelonKey)}
        </span>
        {res.length > 0 && (
          <span className="rounded px-1.5 py-0.5 font-data" style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }} title={res.map((r) => variantInfo(r).locus.name[language]).join(', ')}>
            {engine.resistanceCode(ind)}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Plantation -------------------------------------------------------------

const CATEGORY_ORDER: LocusCategory[] = ['flower', 'flesh', 'rind', 'fruit', 'resistance', 'safety'];

export function FounderPanel({ engine, varieties, onPlant }: { engine: MelonEngine; varieties: MelonVariety[]; onPlant: (list: MelonIndividual[]) => void }) {
  const { tt, language } = useMelonT();
  const [mode, setMode] = useState<'library' | 'custom'>('library');
  const [picked, setPicked] = useState<MelonVariety>(MELON_VARIETIES.find((v) => v.id === 'charentais') ?? MELON_VARIETIES[0]);
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState<MelonGroup>('cantalupensis');
  const [variants, setVariants] = useState<VariantId[]>([]);
  const [targets, setTargets] = useState<Record<QuantTraitId, number>>({ weight: 0.45, fruits: 0.35, days: 0.4, brix: 0.6, storage: 0.3, shape: 0.2 });

  function plant() {
    const out: MelonIndividual[] = [];
    for (let i = 0; i < count; i++) {
      if (mode === 'library') {
        const base = label.trim() || picked.name;
        out.push(engine.createFromVariety(picked, count > 1 ? `${base} ${i + 1}` : base));
      } else {
        const base = label.trim() || tt('founder.custom.defaultName');
        out.push(engine.createCustom({ label: count > 1 ? `${base} ${i + 1}` : base, group, variants, targets }));
      }
    }
    onPlant(out);
    setLabel('');
  }

  const preview = useMemo(() => engine.createCustom({ label: '', group, variants, targets }), [engine, group, variants, targets]);

  return (
    <div className="specimen-card p-5">
      <p className="font-display text-xl mb-3">{tt('founder.title')}</p>
      <Seg
        options={[
          { id: 'library', label: tt('founder.library') },
          { id: 'custom', label: tt('founder.custom') },
        ]}
        value={mode}
        onChange={(id) => setMode(id as 'library' | 'custom')}
      />

      {mode === 'library' ? (
        <VarietyBrowser engine={engine} varieties={varieties} picked={picked} onPick={setPicked} />
      ) : (
        <>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
            {tt('founder.custom.help')}
          </p>
          <label className="mt-2 block">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: INK500 }}>
              {tt('group.label')}
            </span>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as MelonGroup)}
              className="mt-1 w-full rounded px-2 py-1.5 text-xs outline-none"
              style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {tt(`group.${g}` as MelonKey)}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-2 flex items-center gap-3 rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
            <MelonPortrait seed="custom-preview" appearance={engine.appearance(preview)} weightUnit={targets.weight} size={76} />
            <p className="text-[11px] leading-snug" style={{ color: 'var(--color-ink-700)' }}>
              {fruitSummary(engine, preview, tt)}
            </p>
          </div>
          <div className="mt-3 space-y-3">
            {CATEGORY_ORDER.map((cat) => {
              const loci = MELON_LOCI.filter((l) => l.category === cat);
              if (!loci.length) return null;
              return (
                <div key={cat}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: INK500 }}>
                    {tt(`cat.${cat}` as MelonKey)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {loci.flatMap((l) =>
                      l.alleles
                        .filter((a) => a.id)
                        .map((a) => {
                          const id = a.id!;
                          const on = variants.includes(id);
                          const siblings = l.alleles.filter((x) => x.id && x.id !== id).map((x) => x.id!);
                          return (
                            <button
                              key={id}
                              type="button"
                              title={(a.effect ?? l.name)[language]}
                              aria-pressed={on}
                              onClick={() => setVariants((v) => (on ? v.filter((x) => x !== id) : [...v.filter((x) => !siblings.includes(x)), id]))}
                              className="rounded px-2 py-1 text-[11px] transition-colors"
                              style={{
                                background: on ? (cat === 'safety' ? '#b8412a' : 'var(--color-tomato-500)') : 'var(--color-paper-300)',
                                color: on ? 'var(--color-paper-100)' : 'var(--color-ink-700)',
                              }}
                            >
                              <span className="font-data mr-1 opacity-80">{a.allele}</span>
                              {(a.name ?? l.name)[language]}
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              );
            })}
            {QUANT_TRAITS.map((trait) => (
              <label key={trait} className="block">
                <span className="flex justify-between text-[11px]" style={{ color: 'var(--color-ink-700)' }}>
                  {tt(`trait.${trait}` as MelonKey)}
                  <span className="font-data" style={{ color: INK500 }}>
                    {formatTrait(preview, trait, tt, language === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={targets[trait]}
                  onChange={(e) => setTargets((t) => ({ ...t, [trait]: Number(e.target.value) }))}
                  className="resin-range mt-1"
                  style={{ '--range-progress': `${targets[trait] * 100}%` } as React.CSSProperties}
                />
              </label>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={tt('founder.label')}
          className="rounded px-2.5 py-2 text-sm outline-none"
          style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
        />
        <input
          type="number"
          min={1}
          max={12}
          value={count}
          aria-label={tt('founder.count')}
          onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
          className="w-16 rounded px-2 py-2 text-sm outline-none"
          style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
        />
      </div>
      <button
        type="button"
        onClick={plant}
        className="mt-2 w-full rounded px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
        style={{ background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' }}
      >
        {tt('founder.plant')}
      </button>
    </div>
  );
}

// --- Pollinisation --------------------------------------------------------------

export function CrossPanel({
  engine,
  a,
  b,
  onCross,
  onSelf,
}: {
  engine: MelonEngine;
  a: MelonIndividual | null;
  b: MelonIndividual | null;
  onCross: (n: number) => void;
  onSelf: (n: number) => void;
}) {
  const { tt, language } = useMelonT();
  const [n, setN] = useState(24);
  const [showReal, setShowReal] = useState(false);
  const blocked = Boolean(a && !engine.canPollinate(b ?? a));
  const selfBlocked = Boolean(a && !engine.canPollinate(a));
  const prediction = a && !blocked ? engine.predict(a, b ?? a) : [];
  const danger = (['Bif', 'So'] as VariantId[])
    .map((v) => {
      const p = prediction.find((x) => x.variant === v);
      const all = Boolean(a && !blocked && !p && engine.has(a.genotype, v) && (!b || engine.has(b.genotype, v)));
      return p || all ? { v, pct: all ? '100 %' : formatFraction(p!.pExpressed) } : null;
    })
    .filter((x): x is { v: VariantId; pct: string } => x !== null);

  const slot = (ind: MelonIndividual | null, letter: string, role: string) =>
    ind ? (
      <div className="flex items-center gap-2 rounded px-2.5 py-2" style={{ background: 'var(--color-paper-200)' }}>
        <span className="font-data text-[11px] font-semibold" style={{ color: 'var(--color-resin-600)' }}>
          {letter}
          <span className="block text-[9px] font-normal" style={{ color: INK500 }}>
            {role}
          </span>
        </span>
        <FruitDot appearance={engine.appearance(ind)} />
        <div className="min-w-0">
          <p className="truncate text-sm">{ind.label}</p>
          <p className="truncate text-[10px] italic" style={{ color: INK500 }}>
            {groupLabel(ind, tt)} · {tt(`sexShort.${engine.sexType(ind)}` as MelonKey)}
          </p>
        </div>
      </div>
    ) : (
      <div className="rounded border border-dashed px-3 py-3 text-center text-xs" style={{ borderColor: INK500, color: INK500 }}>
        {letter} ({role}) · {tt('cross.choose')}
      </div>
    );

  return (
    <div className="specimen-card p-5">
      <p className="font-display text-xl mb-3">{tt('cross.title')}</p>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
        {slot(a, 'A', `♀ ${tt('sheet.mother')}`)}
        <span className="text-center font-display text-2xl" style={{ color: 'var(--color-tomato-500)' }}>
          ×
        </span>
        {slot(b, 'B', `♂ ${tt('sheet.father')}`)}
      </div>
      {!a && (
        <p className="text-xs mt-3" style={{ color: INK500 }}>
          {tt('cross.hint')}
        </p>
      )}

      {a && <FlowerBox engine={engine} a={a} b={b} />}

      {a && b && (
        <button
          type="button"
          onClick={() => setShowReal(true)}
          title={tt('real.openHint')}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded px-3 py-2 text-sm transition-transform hover:-translate-y-0.5"
          style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-900)', border: '1px solid var(--color-paper-300)' }}
        >
          <span aria-hidden="true">🌼</span> {tt('real.open')}
        </button>
      )}
      {showReal && <RealCrossGuide engine={engine} mother={a} father={b} onClose={() => setShowReal(false)} />}

      {danger.length > 0 && (
        <div className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: '#b8412a', color: '#fff' }}>
          {danger.map((d) => (
            <p key={d.v} className="font-semibold">
              {tt(d.v === 'Bif' ? 'bitter.predict' : 'sour.predict', { pct: d.pct })}
            </p>
          ))}
          <p className="mt-1 opacity-90">{tt('bitter.advice')}</p>
        </div>
      )}

      {a && !blocked && (
        <div className="mt-3 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
          <p className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: INK500 }}>
            {tt('cross.predict')} · {b ? 'A × B' : 'A ⊗'}
          </p>
          {prediction.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-ink-700)' }}>
              {tt('cross.predictNone')}
            </p>
          ) : (
            <ul className="space-y-1">
              {prediction.map((p) => {
                const info = variantInfo(p.variant);
                return (
                  <li key={p.variant} className="flex items-center gap-2 text-xs">
                    <span className="genotype-code w-12 shrink-0" style={{ color: p.variant === 'Bif' || p.variant === 'So' ? RED : 'var(--color-resin-600)' }}>
                      {info.label}
                    </span>
                    <span className="flex-1 truncate" style={{ color: p.variant === 'Bif' || p.variant === 'So' ? RED : 'var(--color-ink-700)' }}>
                      {info.name[language]}
                    </span>
                    <span className="font-data">{formatFraction(p.pExpressed)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-xs" style={{ color: INK500 }} htmlFor="melon-seeds">
          {tt('cross.count')}
        </label>
        <input
          id="melon-seeds"
          type="number"
          min={1}
          max={200}
          value={n}
          onChange={(e) => setN(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
          className="w-20 rounded px-2 py-1.5 text-sm outline-none"
          style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
        />
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            disabled={!a || selfBlocked}
            onClick={() => onSelf(n)}
            className="rounded px-3 py-2 text-sm font-medium transition-transform disabled:opacity-40 hover:not-disabled:-translate-y-0.5"
            style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}
          >
            ⊗ {tt('cross.self')}
          </button>
          <button
            type="button"
            disabled={!a || !b || blocked}
            onClick={() => onCross(n)}
            className="rounded px-3 py-2 text-sm font-medium transition-transform disabled:opacity-40 hover:not-disabled:-translate-y-0.5"
            style={{ background: 'var(--color-resin-500)', color: 'var(--color-ink-900)' }}
          >
            {tt('cross.cross')}
          </button>
        </div>
      </div>
      <p className="text-[11px] mt-2 leading-relaxed" style={{ color: INK500 }}>
        {tt('cross.selfNote')}
      </p>
    </div>
  );
}

export function formatFraction(p: number): string {
  const known: Array<[number, string]> = [
    [0, '0'],
    [1, '100 %'],
    [0.25, '1/4'],
    [0.75, '3/4'],
    [0.5, '1/2'],
  ];
  for (const [v, s] of known) if (Math.abs(p - v) < 1e-9) return s;
  return `${Math.round(p * 100)} %`;
}

// --- Attendu vs observé -------------------------------------------------------

export function MendelPanel({ engine, batch, parents }: { engine: MelonEngine; batch: MelonIndividual[]; parents: [MelonIndividual, MelonIndividual] | null }) {
  const { tt, language } = useMelonT();
  if (!parents || batch.length === 0) return null;
  const pred = engine.predict(parents[0], parents[1]).filter((p) => p.pExpressed > 0 && p.pExpressed < 1);
  const nBitter = batch.filter((x) => engine.isBitter(x) || engine.isSour(x)).length;

  return (
    <div className="rounded px-4 py-4" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-base" style={{ color: 'var(--color-paper-100)' }}>
          {tt('mendel.title')}
        </p>
        <span className="font-data text-xs shrink-0" style={{ color: 'var(--color-paper-300)' }}>
          n = {batch.length}
        </span>
      </div>
      {nBitter > 0 && (
        <p className="mt-2 rounded px-2 py-1.5 text-[11px] font-semibold" style={{ background: '#b8412a', color: '#fff' }}>
          {tt('bitter.batch', { n: nBitter, total: batch.length })}
        </p>
      )}
      <ColorBreakdown engine={engine} batch={batch} />
      <div className="mt-4 space-y-2.5">
        {pred.map((p) => {
          const obs = batch.filter((x) => engine.has(x.genotype, p.variant)).length / batch.length;
          const info = variantInfo(p.variant);
          return (
            <div key={p.variant}>
              <div className="flex items-baseline justify-between text-xs" style={{ color: 'var(--color-paper-200)' }}>
                <span>
                  <span className="genotype-code mr-1.5" style={{ color: 'var(--color-resin-400)' }}>
                    {info.label}
                  </span>
                  {info.name[language]}
                </span>
                <span className="font-data text-[11px]">
                  {Math.round(obs * 100)} % <span className="opacity-50">/ {Math.round(p.pExpressed * 100)} %</span>
                </span>
              </div>
              <div className="relative mt-1 h-2 rounded-full" style={{ background: 'var(--color-canopy-700)' }}>
                <div className="h-full rounded-full" style={{ width: `${obs * 100}%`, background: p.variant === 'Bif' || p.variant === 'So' ? '#e05a40' : 'var(--color-tomato-400)' }} />
                <div className="absolute -top-0.5 h-3 w-0.5 rounded" style={{ left: `calc(${p.pExpressed * 100}% - 1px)`, background: 'var(--color-paper-100)' }} title={tt('mendel.expected')} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] mt-3" style={{ color: 'var(--color-paper-300)', opacity: 0.7 }}>
        ▮ {tt('mendel.observed')} · | {tt('mendel.expected')}
      </p>
    </div>
  );
}

function ColorBreakdown({ engine, batch }: { engine: MelonEngine; batch: MelonIndividual[] }) {
  const { tt } = useMelonT();
  const counts = new Map<string, { n: number; sample: MelonIndividual }>();
  for (const ind of batch) {
    const app = engine.appearance(ind);
    const key = `${app.flesh}-${app.rind}${app.netted ? '-n' : ''}`;
    const cur = counts.get(key);
    if (cur) cur.n++;
    else counts.set(key, { n: 1, sample: ind });
  }
  const rows = Array.from(counts.values()).sort((a, b) => b.n - a.n);
  if (rows.length < 2) return null;
  return (
    <div className="mt-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {rows.map((r, i) => (
          <div key={i} style={{ width: `${(r.n / batch.length) * 100}%`, background: FLESH_DOT[engine.appearance(r.sample).flesh] }} className="h-full" />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {rows.map((r, i) => {
          const app = engine.appearance(r.sample);
          return (
            <span key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-paper-200)' }}>
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: FLESH_DOT[app.flesh], boxShadow: `0 0 0 2px ${fruitColor(app)}` }} />
              {tt('flesh.label', { c: tt(`flesh.${app.flesh}` as MelonKey) })} · {tt(`rind.${app.rind}` as MelonKey)}
              {app.netted ? ` ${tt('fruit.netted')}` : ''}
              <span className="font-data opacity-60">{r.n}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

const FLESH_DOT = { orange: '#f29a45', green: '#b9d27a', white: '#efe8cf' } as const;

// --- Courbe de fixation --------------------------------------------------------

export function FixationChart({ engine, individuals }: { engine: MelonEngine; individuals: MelonIndividual[] }) {
  const { tt } = useMelonT();
  const rows = useMemo(() => {
    const m = new Map<number, number[]>();
    for (const ind of individuals) {
      if (!m.has(ind.generation)) m.set(ind.generation, []);
      m.get(ind.generation)!.push(engine.heterozygosity(ind));
    }
    return Array.from(m.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([g, v]) => ({ g, h: v.reduce((a, b) => a + b, 0) / v.length }));
  }, [engine, individuals]);

  if (rows.length < 2) return null;
  const maxG = Math.max(8, rows[rows.length - 1].g);
  const W = 320;
  const H = 130;
  const px = (g: number) => 28 + (g / maxG) * (W - 40);
  const py = (h: number) => 12 + (1 - h / Math.max(0.6, ...rows.map((r) => r.h))) * (H - 34);
  const peak = rows.find((r) => r.g === 1) ?? rows.find((r) => r.h > 0);
  const theory = peak ? Array.from({ length: maxG - peak.g + 1 }, (_, i) => ({ g: peak.g + i, h: peak.h / 2 ** i })) : [];

  return (
    <div className="rounded px-4 py-4" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
      <p className="font-display text-base" style={{ color: 'var(--color-paper-100)' }}>
        {tt('fixation.title')}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={tt('fixation.title')}>
        <line x1={28} y1={H - 22} x2={W - 12} y2={H - 22} stroke="var(--color-canopy-600)" />
        {Array.from({ length: maxG + 1 }, (_, g) => (
          <text key={g} x={px(g)} y={H - 8} fontSize={9} textAnchor="middle" fill="var(--color-paper-300)" fontFamily="var(--font-data)">
            {g === 0 ? 'P' : `F${g}`}
          </text>
        ))}
        {theory.length > 1 && <polyline points={theory.map((r) => `${px(r.g)},${py(r.h)}`).join(' ')} fill="none" stroke="var(--color-paper-300)" strokeDasharray="3 3" opacity={0.6} />}
        <polyline points={rows.map((r) => `${px(r.g)},${py(r.h)}`).join(' ')} fill="none" stroke="var(--color-tomato-400)" strokeWidth={2} />
        {rows.map((r) => (
          <g key={r.g}>
            <circle cx={px(r.g)} cy={py(r.h)} r={3.5} fill="var(--color-tomato-400)" />
            <text x={px(r.g)} y={py(r.h) - 7} fontSize={8.5} textAnchor="middle" fill="var(--color-paper-200)" fontFamily="var(--font-data)">
              {Math.round(r.h * 100)}%
            </text>
          </g>
        ))}
      </svg>
      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
        {tt('fixation.help')}
      </p>
    </div>
  );
}

// --- Fiche détaillée -----------------------------------------------------------

export function SpecimenSheet({
  engine,
  ind,
  garden,
  varieties,
  byId,
  onNotes,
  onDelete,
  onArchive,
  onFocus,
  onRename,
  onClone,
  onSaveVariety,
  onJournalAdd,
  onJournalDelete,
  onJournalExport,
}: {
  engine: MelonEngine;
  ind: MelonIndividual;
  garden: GardenSettings;
  varieties: MelonVariety[];
  byId: Map<string, MelonIndividual>;
  onNotes: (text: string) => void;
  onDelete: () => void;
  onArchive: () => void;
  onFocus: (id: string) => void;
  onRename: (label: string) => void;
  onClone: () => void;
  onSaveVariety: () => void;
  onJournalAdd: (e: Omit<MelonJournalEntry, 'id'>) => void;
  onJournalDelete: (entryId: string) => void;
  onJournalExport: () => void;
}) {
  const { tt, language } = useMelonT();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const app = engine.appearance(ind);
  const variety = ind.varietyId ? varieties.find((v) => v.id === ind.varietyId) : undefined;
  const fixed = engine.isFixed(ind);
  const seg = engine.segregatingLoci(ind);
  const res = engine.resistances(ind);
  const divider = <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />;
  const label = (k: MelonKey) => (
    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: INK500 }}>
      {tt(k)}
    </p>
  );
  const sex: SexType = app.sex;
  const code = engine.resistanceCode(ind);

  return (
    <div className="specimen-card p-5 animate-sprout" key={ind.id}>
      <p className="font-data text-[11px] uppercase tracking-wide" style={{ color: INK500 }}>
        {ind.generation === 0 ? 'P' : `F${ind.generation}`} · {ind.id}
      </p>
      <input
        value={ind.label}
        onChange={(e) => onRename(e.target.value)}
        aria-label={tt('sheet.rename')}
        title={tt('sheet.rename')}
        className="font-display text-2xl leading-tight mt-0.5 w-full bg-transparent outline-none rounded focus:ring-1"
        style={{ color: 'var(--color-ink-900)', '--tw-ring-color': 'var(--color-resin-500)' } as React.CSSProperties}
      />
      <p className="text-xs italic mt-0.5" style={{ color: 'var(--color-ink-700)' }}>
        {groupLabel(ind, tt)}
      </p>
      <p className="genotype-code text-xs mt-1" style={{ color: 'var(--color-ink-700)' }}>
        {engine.genotypeCode(ind)}
      </p>
      {ind.hybridFounder && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
          {tt('sheet.hybridFounder')}
        </p>
      )}
      {ind.clonedFromId && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--color-leaf-500)' }}>
          {tt('sheet.clonedFrom', { name: byId.get(ind.clonedFromId)?.label ?? ind.clonedFromId })}
        </p>
      )}

      {(app.bitter || app.sour) && (
        <div className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: '#b8412a', color: '#fff' }}>
          {app.bitter && <p className="font-semibold">⚠ {tt('fruit.bitter')}</p>}
          {app.sour && <p className="font-semibold">⚠ {tt('fruit.sour')}</p>}
          <p className="mt-1 opacity-90">{tt('bitter.advice')}</p>
        </div>
      )}

      <div className="mt-3 flex justify-center rounded" style={{ background: 'var(--color-paper-200)' }}>
        <MelonPortrait seed={ind.id} appearance={app} weightUnit={engine.unitOf('weight', ind)} size={220} />
      </div>
      <p className="text-[10px] text-center italic mt-1" style={{ color: INK500 }}>
        {tt('sheet.portraitCaption')}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onClone} title={tt('sheet.cloneHint')} className="rounded px-3 py-1.5 text-xs" style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}>
          ✂ {tt('sheet.clone')}
        </button>
        <button
          type="button"
          onClick={onSaveVariety}
          disabled={!fixed}
          title={fixed ? tt('sheet.saveVariety') : tt('sheet.saveVarietyNotFixed')}
          className="rounded px-3 py-1.5 text-xs disabled:opacity-40"
          style={{ background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' }}
        >
          ★ {tt('sheet.saveVariety')}
        </button>
      </div>

      {divider}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        <dt style={{ color: INK500 }}>{tt('sheet.fruit')}</dt>
        <dd>
          {fruitSummary(engine, ind, tt)}
          <span style={{ color: INK500 }}>
            {' '}
            · {tt(app.slips ? 'fruit.slips' : 'fruit.noSlip')}
            {app.sweet ? ` · ${tt('fruit.sweet')}` : ''}
            {app.whiteSeeds ? ` · ${tt('fruit.whiteSeeds')}` : ''}
          </span>
        </dd>
        <dt style={{ color: INK500 }}>{tt('sheet.flowers')}</dt>
        <dd>
          {tt(`sex.${sex}` as MelonKey)} <span style={{ color: INK500 }}>— {tt(`sex.${sex}.desc` as MelonKey)}</span>
        </dd>
        <dt style={{ color: INK500 }}>{tt('sheet.yield')}</dt>
        <dd className="font-data">
          {formatKg(ind.pheno.weightKg, locale)} × {ind.pheno.fruits} = {formatKg(engine.yieldKg(ind), locale)}
        </dd>
        <dt style={{ color: INK500 }}>{tt('sheet.resistances')}</dt>
        <dd>
          {res.length ? (
            <>
              <span className="font-data">{code}</span>
              <span style={{ color: INK500 }}> — {res.map((r) => variantInfo(r).locus.name[language]).join(', ')}</span>
            </>
          ) : (
            tt('sheet.noResistance')
          )}
        </dd>
      </dl>

      {divider}
      {label('sheet.traits')}
      <div className="space-y-2.5">
        {QUANT_TRAITS.map((trait) => (
          <TraitBar key={trait} engine={engine} ind={ind} trait={trait} large />
        ))}
      </div>

      {divider}
      {label('sheet.garden')}
      <GardenSheet engine={engine} ind={ind} garden={garden} />

      {divider}
      {label('sheet.fixation')}
      <p className="text-xs leading-relaxed" style={{ color: fixed ? 'var(--color-leaf-500)' : 'var(--color-ink-700)' }}>
        {fixed ? tt('sheet.fixed') : tt('sheet.notFixed', { pct: Math.round(engine.heterozygosity(ind) * 100) })}
      </p>
      {seg.length > 0 && (
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
          {tt('sheet.segregating')} {seg.map((id) => LOCUS_BY_ID[id].name[language]).join(', ')}
        </p>
      )}

      {divider}
      {label('sheet.culture')}
      <CultureSheet engine={engine} ind={ind} />

      {divider}
      {label('nut.title')}
      <MelonNutrientPanel engine={engine} ind={ind} />

      {divider}
      {label('sheet.genotype')}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ color: INK500 }}>
              <th className="py-1 pr-2 text-left font-normal">{tt('sheet.locus')}</th>
              <th className="py-1 pr-2 text-left font-normal">{tt('sheet.alleles')}</th>
              <th className="py-1 text-left font-normal">{tt('sheet.status')}</th>
            </tr>
          </thead>
          <tbody>
            {MELON_LOCI.map((l) => {
              const pair = ind.genotype[l.id];
              const variantAlleles = l.alleles.filter((a) => a.id);
              const expressed = variantAlleles.find((a) => engine.has(ind.genotype, a.id!));
              const full = expressed && (!l.incomplete || engine.dose(ind.genotype, expressed.id!) === 2);
              const carrier = !expressed && variantAlleles.some((a) => pair.includes(a.allele));
              return (
                <tr key={l.id} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }} title={(expressed?.effect ?? variantAlleles[0]?.effect ?? l.name)[language]}>
                  <td className="py-1 pr-2">
                    <span className="genotype-code" style={{ color: l.category === 'safety' ? RED : 'var(--color-resin-600)' }}>
                      {l.symbol}
                    </span>{' '}
                    <span style={{ color: 'var(--color-ink-700)' }}>{l.name[language]}</span>
                  </td>
                  <td className="py-1 pr-2 genotype-code">
                    {pair[0]}/{pair[1]}
                  </td>
                  <td className="py-1">
                    {expressed ? (
                      <span style={{ color: l.category === 'safety' ? RED : 'var(--color-tomato-500)' }}>● {full ? tt('sheet.status.expressed') : tt('sheet.status.partial')}</span>
                    ) : carrier ? (
                      <span style={{ color: 'var(--color-bloom-500)' }}>◐ {tt('sheet.status.carrier')}</span>
                    ) : (
                      <span style={{ color: INK500 }}>{tt('sheet.status.standard')}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(variety || ind.parentIds) && divider}
      {variety && (
        <>
          {label('sheet.variety')}
          <p className="text-sm font-display">{variety.name}</p>
          <p className="text-[11px]" style={{ color: INK500 }}>
            {variety.origin}
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
            {variety.notes ? variety.notes[language] : describeVariety(variety, engine.appearanceFromVariety(variety), tt)}
          </p>
          {variety.source === 'custom' && (
            <p className="text-[10px] mt-1 italic leading-snug" style={{ color: INK500 }}>
              {tt('myvar.note')}
            </p>
          )}
        </>
      )}
      {ind.parentIds && (
        <>
          {label('sheet.parents')}
          {ind.selfed ? (
            <p className="text-xs">
              {tt('sheet.selfedFrom', { name: '' })}
              <ParentLink id={ind.parentIds[0]} byId={byId} onFocus={onFocus} />
            </p>
          ) : (
            <p className="text-xs">
              ♀ <ParentLink id={ind.parentIds[0]} byId={byId} onFocus={onFocus} /> × ♂ <ParentLink id={ind.parentIds[1]} byId={byId} onFocus={onFocus} />
            </p>
          )}
          <div className="mt-3" />
          {label('sheet.pedigree')}
          <div className="max-h-[36vh] overflow-y-auto">
            <MelonPedigree engine={engine} ind={ind} byId={byId} onFocus={onFocus} />
          </div>
        </>
      )}
      {divider}
      {label('sheet.notes')}
      <textarea
        value={ind.notes ?? ''}
        onChange={(e) => onNotes(e.target.value)}
        placeholder={tt('sheet.notesPlaceholder')}
        rows={3}
        className="w-full rounded px-2.5 py-2 text-xs outline-none resize-y"
        style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
      />

      {divider}
      {label('journal.title')}
      <MelonJournal ind={ind} onAdd={onJournalAdd} onDelete={onJournalDelete} onExport={onJournalExport} />

      {divider}
      <div className="flex gap-2">
        <button type="button" onClick={onArchive} className="flex-1 rounded px-3 py-1.5 text-xs" style={{ background: 'var(--color-paper-300)', color: 'var(--color-ink-900)' }}>
          {ind.archived ? tt('sheet.unarchive') : tt('sheet.archive')}
        </button>
        <button type="button" onClick={onDelete} className="flex-1 rounded px-3 py-1.5 text-xs" style={{ background: 'var(--color-bloom-600)', color: 'var(--color-paper-100)' }}>
          {tt('sheet.delete')}
        </button>
      </div>
    </div>
  );
}

function ParentLink({ id, byId, onFocus }: { id: string; byId: Map<string, MelonIndividual>; onFocus: (id: string) => void }) {
  const p = byId.get(id);
  if (!p) return <span className="genotype-code opacity-60">{id}</span>;
  return (
    <button type="button" onClick={() => onFocus(id)} className="underline decoration-dotted underline-offset-2">
      {p.label}
    </button>
  );
}
