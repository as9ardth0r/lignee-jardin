import { useMemo, useState } from 'react';
import { RealCrossGuide } from './RealCross';
import {
  MAIN_TRAITS,
  QUANT_TRAITS,
  type QuantTraitId,
  type TomatoEngine,
  type TomatoIndividual,
  type TomatoJournalEntry,
} from '../engine/tomato/engine';
import { LOCUS_BY_ID, TOMATO_LOCI, variantInfo, type LocusCategory, type VariantId } from '../engine/tomato/loci';
import { TOMATO_VARIETIES, type TomatoVariety } from '../engine/tomato/varieties';
import { FRUIT_COLORS, FruitDot, TomatoPortrait } from './TomatoPortrait';
import { useTomatoT, type TomatoKey } from './i18n';
import { LOWER_IS_BETTER, TRAIT_COLOR, formatTrait } from './format';
import { VarietyBrowser, describeVariety } from './VarietyBrowser';
import { CultureSheet, GardenSheet, TomatoJournal, TomatoNutrientPanel, TomatoPedigree } from './extras';
import { gardenOutcome, type GardenSettings } from '../engine/tomato/garden';

type TT = ReturnType<typeof useTomatoT>['tt'];

const INK500 = 'var(--color-ink-500)';

// --- Petits utilitaires d'affichage ----------------------------------------

export function fruitSummary(engine: TomatoEngine, ind: TomatoIndividual, tt: TT): string {
  const app = engine.appearance(ind);
  const parts = [
    tt(`color.${app.colorKey}` as TomatoKey),
    tt(`shape.${app.shape}` as TomatoKey),
    tt(`size.${engine.sizeClass(ind)}` as TomatoKey),
  ];
  if (app.striped) parts.push(tt('fruit.striped'));
  if (app.anthocyanin === 'indigo') parts.push(tt('fruit.anthoIndigo'));
  if (app.anthocyanin === 'patches') parts.push(tt('fruit.anthoPatches'));
  if (app.fuzzy) parts.push(tt('fruit.fuzzy'));
  return parts.join(' · ');
}

export function TraitBar({
  engine,
  ind,
  trait,
  large,
}: {
  engine: TomatoEngine;
  ind: TomatoIndividual;
  trait: QuantTraitId;
  large?: boolean;
}) {
  const { tt, language } = useTomatoT();
  // Précocité : moins de jours = mieux, la barre se remplit donc à l'envers.
  const u = engine.unitOf(trait, ind);
  const pct = (LOWER_IS_BETTER[trait] ? 1 - u : u) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={large ? 'text-xs' : 'text-[10px]'} style={{ color: INK500 }}>
          {tt(`trait.${trait}` as TomatoKey)}
        </span>
        <span className={`font-data ${large ? 'text-xs' : 'text-[10px]'}`} style={{ color: 'var(--color-ink-700)' }}>
          {formatTrait(ind, trait, tt, language === 'fr' ? 'fr-FR' : 'en-US')}
        </span>
      </div>
      <div className={`mt-0.5 w-full overflow-hidden rounded-full ${large ? 'h-2' : 'h-1'}`} style={{ background: 'var(--color-paper-300)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(3, pct)}%`, background: TRAIT_COLOR[trait] }} />
      </div>
    </div>
  );
}

function Seg({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex rounded p-0.5" style={{ background: 'var(--color-canopy-800)' }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className="flex-1 rounded px-2 py-1.5 text-xs transition-colors"
          style={{
            background: value === o.id ? 'var(--color-resin-500)' : 'transparent',
            color: value === o.id ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function GardenLine({ engine, ind, garden }: { engine: TomatoEngine; ind: TomatoIndividual; garden: GardenSettings }) {
  const { tt, language } = useTomatoT();
  const out = gardenOutcome(engine, ind, garden);
  const loss = Math.round(out.totalLoss * 100);
  return (
    <p className="mt-2 text-[10px] font-data" style={{ color: loss >= 35 ? 'var(--color-tomato-500)' : 'var(--color-ink-500)' }}>
      🌦 {out.realizedKg.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')} {tt('trait.yieldUnit')} {tt('garden.inGarden')} (−{loss} %)
    </p>
  );
}

// --- Carte de spécimen -----------------------------------------------------

export function TomatoCard({
  engine,
  ind,
  garden,
  selectedSlot,
  focused,
  fresh,
  onFocus,
  onToggleSelect,
}: {
  engine: TomatoEngine;
  ind: TomatoIndividual;
  garden: GardenSettings;
  selectedSlot: 'A' | 'B' | null;
  focused: boolean;
  fresh: boolean;
  onFocus: () => void;
  onToggleSelect: () => void;
}) {
  const { tt } = useTomatoT();
  const app = engine.appearance(ind);
  const fixed = engine.isFixed(ind);
  const seg = engine.segregatingLoci(ind).length;
  const res = engine.resistanceCode(ind);

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
          <TomatoPortrait
            seed={ind.id}
            appearance={app}
            weightUnit={engine.unitOf('weight', ind)}
            potatoLeaf={engine.isPotatoLeaf(ind)}
            determinate={engine.isDeterminate(ind)}
            dwarf={engine.isDwarf(ind)}
            size={64}
          />
        </div>
        <div className="min-w-0">
          <p className="font-data text-[10px] uppercase tracking-wide" style={{ color: INK500 }}>
            {ind.generation === 0 ? 'P' : `F${ind.generation}`}
            {ind.selfed ? ' · ⊗' : ''} · {ind.id}
          </p>
          <p className="font-display text-base leading-tight mt-0.5 truncate" title={ind.label}>
            {ind.label}
          </p>
          <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-ink-700)' }}>
            {fruitSummary(engine, ind, tt)}
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
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
        {engine.isLongKeeper(ind) && (
          <span className="rounded px-1.5 py-0.5" style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-700)' }}>
            {tt('plant.longkeeper')}
          </span>
        )}
        <span
          className="rounded px-1.5 py-0.5 font-data"
          style={{
            background: fixed ? 'var(--color-leaf-500)' : 'var(--color-paper-300)',
            color: fixed ? 'var(--color-paper-100)' : 'var(--color-ink-700)',
          }}
        >
          {fixed ? `✓ ${tt('card.fixed')}` : seg === 0 ? `≈ ${tt('card.nearlyFixed')}` : tt('card.segregating', { n: seg })}
        </span>
        {engine.isDeterminate(ind) && (
          <span className="rounded px-1.5 py-0.5" style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-700)' }}>
            {tt('plant.determinate').split(' (')[0]}
          </span>
        )}
        {engine.isPotatoLeaf(ind) && (
          <span className="rounded px-1.5 py-0.5" style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-700)' }}>
            {tt('plant.potatoLeaf')}
          </span>
        )}
        {engine.isDwarf(ind) && (
          <span className="rounded px-1.5 py-0.5" style={{ background: 'var(--color-paper-200)', color: 'var(--color-ink-700)' }}>
            {tt('plant.dwarf')}
          </span>
        )}
        {res && (
          <span className="rounded px-1.5 py-0.5 font-data" style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}>
            {res}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Formulaire de plantation ---------------------------------------------

const CATEGORY_ORDER: LocusCategory[] = ['color', 'plant', 'shape', 'resistance'];

export function FounderPanel({
  engine,
  varieties,
  loading,
  onPlant,
}: {
  engine: TomatoEngine;
  varieties: TomatoVariety[];
  loading: boolean;
  onPlant: (list: TomatoIndividual[]) => void;
}) {
  const { tt, language } = useTomatoT();
  const [mode, setMode] = useState<'library' | 'custom'>('library');
  const [picked, setPicked] = useState<TomatoVariety>(TOMATO_VARIETIES[0]);
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState('');
  const [variants, setVariants] = useState<VariantId[]>([]);
  const [targets, setTargets] = useState<Record<QuantTraitId, number>>({ weight: 0.55, brix: 0.3, days: 0.55, yield: 0.5, acidity: 0.4, crack: 0.5, shelf: 0.3, heat: 0.45, cold: 0.45 });

  function plant() {
    const out: TomatoIndividual[] = [];
    for (let i = 0; i < count; i++) {
      if (mode === 'library') {
        const base = label.trim() || picked.name;
        out.push(engine.createFromVariety(picked, count > 1 ? `${base} ${i + 1}` : base));
      } else {
        const base = label.trim() || tt('founder.custom.defaultName');
        out.push(engine.createCustom({ label: count > 1 ? `${base} ${i + 1}` : base, variants, targets }));
      }
    }
    onPlant(out);
    setLabel('');
  }

  const previewOfCustom = useMemo(
    () => engine.createCustom({ label: '', variants, targets }),
    [engine, variants, targets]
  );

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
        <VarietyBrowser engine={engine} varieties={varieties} loading={loading} picked={picked} onPick={setPicked} />
      ) : (
        <>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
            {tt('founder.custom.help')}
          </p>
          <div className="mt-2 flex items-center gap-3 rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
            <TomatoPortrait
              seed="custom-preview"
              appearance={engine.appearance(previewOfCustom)}
              weightUnit={targets.weight}
              potatoLeaf={variants.includes('c')}
              determinate={variants.includes('sp')}
              dwarf={variants.includes('d')}
              size={72}
            />
            <p className="text-[11px] leading-snug" style={{ color: 'var(--color-ink-700)' }}>
              {fruitSummary(engine, previewOfCustom, tt)}
            </p>
          </div>
          <div className="mt-3 space-y-3">
            {CATEGORY_ORDER.map((cat) => (
              <div key={cat}>
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: INK500 }}>
                  {tt(`cat.${cat}` as TomatoKey)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {TOMATO_LOCI.filter((l) => l.category === cat)
                    .flatMap((l) => [
                      { id: l.id as VariantId, allele: l.variant, name: l.name, effect: l.effect, exclusive: l.extra?.id as VariantId | undefined },
                      ...(l.extra ? [{ id: l.extra.id as VariantId, allele: l.extra.allele, name: l.extra.name, effect: l.extra.effect, exclusive: l.id as VariantId }] : []),
                    ])
                    .map((c) => {
                    const on = variants.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        title={c.effect[language]}
                        aria-pressed={on}
                        onClick={() =>
                          setVariants((v) => (on ? v.filter((x) => x !== c.id) : [...v.filter((x) => x !== c.exclusive), c.id]))
                        }
                        className="rounded px-2 py-1 text-[11px] transition-colors"
                        style={{
                          background: on ? 'var(--color-tomato-500)' : 'var(--color-paper-300)',
                          color: on ? 'var(--color-paper-100)' : 'var(--color-ink-700)',
                        }}
                      >
                        <span className="font-data mr-1 opacity-80">{c.allele}</span>
                        {c.name[language]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {QUANT_TRAITS.map((trait) => (
              <label key={trait} className="block">
                <span className="text-[11px]" style={{ color: 'var(--color-ink-700)' }}>
                  {tt(`trait.${trait}` as TomatoKey)}
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

// --- Pollinisation ----------------------------------------------------------

export function CrossPanel({
  engine,
  a,
  b,
  onCross,
  onSelf,
}: {
  engine: TomatoEngine;
  a: TomatoIndividual | null;
  b: TomatoIndividual | null;
  onCross: (n: number) => void;
  onSelf: (n: number) => void;
}) {
  const { tt, language } = useTomatoT();
  const [n, setN] = useState(24);
  const [showReal, setShowReal] = useState(false);
  const prediction = a ? engine.predict(a, b ?? a) : [];

  const slot = (ind: TomatoIndividual | null, letter: string) =>
    ind ? (
      <div className="flex items-center gap-2 rounded px-2.5 py-2" style={{ background: 'var(--color-paper-200)' }}>
        <span className="font-data text-[11px] font-semibold" style={{ color: 'var(--color-resin-600)' }}>
          {letter}
        </span>
        <FruitDot appearance={engine.appearance(ind)} />
        <div className="min-w-0">
          <p className="truncate text-sm">{ind.label}</p>
          <p className="genotype-code truncate text-[10px]" style={{ color: INK500 }}>
            {engine.genotypeCode(ind)}
          </p>
        </div>
      </div>
    ) : (
      <div
        className="rounded border border-dashed px-3 py-3 text-center text-xs"
        style={{ borderColor: INK500, color: INK500 }}
      >
        {letter} · {tt('cross.choose')}
      </div>
    );

  return (
    <div className="specimen-card p-5">
      <p className="font-display text-xl mb-3">{tt('cross.title')}</p>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
        {slot(a, 'A')}
        <span className="text-center font-display text-2xl" style={{ color: 'var(--color-tomato-500)' }}>
          ×
        </span>
        {slot(b, 'B')}
      </div>
      {!a && (
        <p className="text-xs mt-3" style={{ color: INK500 }}>
          {tt('cross.hint')}
        </p>
      )}
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

      {a && (
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
              {prediction.map((p) => (
                <li key={p.locus} className="flex items-center gap-2 text-xs">
                  <span className="genotype-code w-12 shrink-0" style={{ color: 'var(--color-resin-600)' }}>
                    {variantInfo(p.locus).label}
                  </span>
                  <span className="flex-1 truncate" style={{ color: 'var(--color-ink-700)' }}>
                    {variantInfo(p.locus).name[language]}
                  </span>
                  <span className="font-data">{formatFraction(p.pExpressed)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-xs" style={{ color: INK500 }} htmlFor="tomato-seeds">
          {tt('cross.count')}
        </label>
        <input
          id="tomato-seeds"
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
            disabled={!a}
            onClick={() => onSelf(n)}
            className="rounded px-3 py-2 text-sm font-medium transition-transform disabled:opacity-40 hover:not-disabled:-translate-y-0.5"
            style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}
          >
            ⊗ {tt('cross.self')}
          </button>
          <button
            type="button"
            disabled={!a || !b}
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

function formatFraction(p: number): string {
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

// --- Attendu vs observé ----------------------------------------------------

export function MendelPanel({
  engine,
  batch,
  parents,
}: {
  engine: TomatoEngine;
  batch: TomatoIndividual[];
  parents: [TomatoIndividual, TomatoIndividual] | null;
}) {
  const { tt, language } = useTomatoT();
  if (!parents || batch.length === 0) return null;
  const pred = engine.predict(parents[0], parents[1]).filter((p) => p.pExpressed > 0 && p.pExpressed < 1);
  if (pred.length === 0) return null;

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
      <ColorBreakdown engine={engine} batch={batch} />
      <div className="mt-4 space-y-2.5">
        {pred.map((p) => {
          const obs = batch.filter((x) => engine.expressesVariant(x.genotype, p.locus)).length / batch.length;
          return (
            <div key={p.locus}>
              <div className="flex items-baseline justify-between text-xs" style={{ color: 'var(--color-paper-200)' }}>
                <span>
                  <span className="genotype-code mr-1.5" style={{ color: 'var(--color-resin-400)' }}>
                    {variantInfo(p.locus).label}
                  </span>
                  {variantInfo(p.locus).name[language]}
                </span>
                <span className="font-data text-[11px]">
                  {Math.round(obs * 100)} % <span className="opacity-50">/ {Math.round(p.pExpressed * 100)} %</span>
                </span>
              </div>
              <div className="relative mt-1 h-2 rounded-full" style={{ background: 'var(--color-canopy-700)' }}>
                <div className="h-full rounded-full" style={{ width: `${obs * 100}%`, background: 'var(--color-tomato-400)' }} />
                <div
                  className="absolute -top-0.5 h-3 w-0.5 rounded"
                  style={{ left: `calc(${p.pExpressed * 100}% - 1px)`, background: 'var(--color-paper-100)' }}
                  title={tt('mendel.expected')}
                />
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

/** Répartition des couleurs de fruit dans une portée (ex. 9:3:3:1 en F2). */
function ColorBreakdown({ engine, batch }: { engine: TomatoEngine; batch: TomatoIndividual[] }) {
  const { tt } = useTomatoT();
  const counts = new Map<string, { n: number; sample: TomatoIndividual }>();
  for (const ind of batch) {
    const app = engine.appearance(ind);
    const key = `${app.colorKey}${app.striped ? '-s' : ''}${app.anthocyanin !== 'none' ? '-a' : ''}`;
    const cur = counts.get(key);
    if (cur) cur.n++;
    else counts.set(key, { n: 1, sample: ind });
  }
  const rows = Array.from(counts.values()).sort((a, b) => b.n - a.n);
  if (rows.length < 2) return null;
  return (
    <div className="mt-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {rows.map((r, i) => {
          const app = engine.appearance(r.sample);
          return (
            <div key={i} style={{ width: `${(r.n / batch.length) * 100}%` }} className="h-full">
              <span className="block h-full w-full" style={{ background: FRUIT_COLORS[app.colorKey].base }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {rows.map((r, i) => {
          const app = engine.appearance(r.sample);
          return (
            <span key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-paper-200)' }}>
              <FruitDot appearance={app} size={10} />
              {tt(`color.${app.colorKey}` as TomatoKey)}
              {app.striped ? ` ${tt('fruit.striped')}` : ''}
              <span className="font-data opacity-60">{r.n}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// --- Courbe de fixation ------------------------------------------------------

export function FixationChart({ engine, individuals }: { engine: TomatoEngine; individuals: TomatoIndividual[] }) {
  const { tt } = useTomatoT();
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
  const theory = peak
    ? Array.from({ length: maxG - peak.g + 1 }, (_, i) => ({ g: peak.g + i, h: peak.h / 2 ** i }))
    : [];

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
        {theory.length > 1 && (
          <polyline
            points={theory.map((r) => `${px(r.g)},${py(r.h)}`).join(' ')}
            fill="none"
            stroke="var(--color-paper-300)"
            strokeDasharray="3 3"
            opacity={0.6}
          />
        )}
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

// --- Fiche détaillée -------------------------------------------------------

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
  engine: TomatoEngine;
  ind: TomatoIndividual;
  garden: GardenSettings;
  varieties: TomatoVariety[];
  byId: Map<string, TomatoIndividual>;
  onNotes: (text: string) => void;
  onDelete: () => void;
  onArchive: () => void;
  onFocus: (id: string) => void;
  onRename: (label: string) => void;
  onClone: () => void;
  onSaveVariety: () => void;
  onJournalAdd: (e: Omit<TomatoJournalEntry, 'id'>) => void;
  onJournalDelete: (entryId: string) => void;
  onJournalExport: () => void;
}) {
  const { tt, language } = useTomatoT();
  const app = engine.appearance(ind);
  const variety = ind.varietyId ? varieties.find((v) => v.id === ind.varietyId) : undefined;
  const fixed = engine.isFixed(ind);
  const seg = engine.segregatingLoci(ind);
  const res = engine.resistances(ind);
  const divider = <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />;
  const label = (k: TomatoKey) => (
    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: INK500 }}>
      {tt(k)}
    </p>
  );

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

      <div className="mt-3 flex justify-center rounded" style={{ background: 'var(--color-paper-200)' }}>
        <TomatoPortrait
          seed={ind.id}
          appearance={app}
          weightUnit={engine.unitOf('weight', ind)}
          potatoLeaf={engine.isPotatoLeaf(ind)}
          determinate={engine.isDeterminate(ind)}
          dwarf={engine.isDwarf(ind)}
          size={210}
        />
      </div>
      <p className="text-[10px] text-center italic mt-1" style={{ color: INK500 }}>
        {tt('sheet.portraitCaption')}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onClone}
          title={tt('sheet.cloneHint')}
          className="rounded px-3 py-1.5 text-xs"
          style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}
        >
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
          <span style={{ color: INK500 }}> · {app.greenShoulder ? tt('fruit.greenShoulder') : tt('fruit.uniform')}</span>
        </dd>
        <dt style={{ color: INK500 }}>{tt('sheet.plant')}</dt>
        <dd>
          {engine.isDeterminate(ind) ? tt('plant.determinate') : tt('plant.indeterminate')} ·{' '}
          {engine.isPotatoLeaf(ind) ? tt('plant.potatoLeaf') : tt('plant.regularLeaf')}
          {engine.isDwarf(ind) ? ` · ${tt('plant.dwarf')}` : ''}
          {engine.isLongKeeper(ind) ? ` · ${tt('plant.longkeeper')}` : ''}
        </dd>
        <dt style={{ color: INK500 }}>{tt('sheet.resistances')}</dt>
        <dd>{res.length ? res.map((id) => LOCUS_BY_ID[id].name[language]).join(', ') : tt('sheet.noResistance')}</dd>
      </dl>

      {divider}
      {label('sheet.traits')}
      <div className="space-y-2.5">
        {QUANT_TRAITS.map((trait) => (
          <TraitBar key={trait} engine={engine} ind={ind} trait={trait} large />
        ))}
      </div>

      <p className="text-xs mt-3" style={{ color: 'var(--color-ink-700)' }}>
        {(() => {
          const ratio = engine.sugarAcidRatio(ind);
          const lbl = ratio < 10 ? 'taste.tangy' : ratio > 15 ? 'taste.sweet' : 'taste.balanced';
          return tt('sheet.taste', { ratio: ratio.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US'), label: tt(lbl as TomatoKey) });
        })()}
      </p>

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
          {tt('sheet.segregating')}{' '}
          {seg.map((id) => LOCUS_BY_ID[id].name[language]).join(', ')}
        </p>
      )}

      {divider}
      {label('sheet.culture')}
      <CultureSheet engine={engine} ind={ind} />

      {divider}
      {label('nut.title')}
      <TomatoNutrientPanel engine={engine} ind={ind} />

      {divider}
      {label('sheet.genotype')}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ color: INK500 }}>
              <th className="py-1 pr-2 text-left font-normal">{tt('sheet.locus')}</th>
              <th className="py-1 pr-2 text-left font-normal">{tt('sheet.chr')}</th>
              <th className="py-1 pr-2 text-left font-normal">{tt('sheet.alleles')}</th>
              <th className="py-1 text-left font-normal">{tt('sheet.status')}</th>
            </tr>
          </thead>
          <tbody>
            {TOMATO_LOCI.map((l) => {
              const pair = ind.genotype[l.id];
              const expressed = engine.expresses(ind.genotype, l.id);
              const carrier = engine.isCarrier(ind.genotype, l.id);
              return (
                <tr key={l.id} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }} title={l.effect[language]}>
                  <td className="py-1 pr-2">
                    <span className="genotype-code" style={{ color: 'var(--color-resin-600)' }}>
                      {l.variant}
                    </span>{' '}
                    <span style={{ color: 'var(--color-ink-700)' }}>{l.name[language]}</span>
                  </td>
                  <td className="py-1 pr-2 font-data" style={{ color: INK500 }}>
                    {l.chromosome}
                  </td>
                  <td className="py-1 pr-2 genotype-code">
                    {pair[0]}/{pair[1]}
                  </td>
                  <td className="py-1">
                    {expressed ? (
                      <span style={{ color: 'var(--color-tomato-500)' }}>● {tt('sheet.status.expressed')}</span>
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
            {variety.description
              ? variety.description[language]
              : describeVariety(variety, engine.appearanceFromVariants(variety.variants, variety.weightG), tt)}
          </p>
          {variety.source === 'tomatobase' && (
            <p className="text-[10px] mt-1 italic leading-snug" style={{ color: INK500 }}>
              {tt('founder.tomatobaseNote')}
            </p>
          )}
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
              <ParentLink id={ind.parentIds[0]} byId={byId} onFocus={onFocus} /> ×{' '}
              <ParentLink id={ind.parentIds[1]} byId={byId} onFocus={onFocus} />
            </p>
          )}
        </>
      )}

      {ind.parentIds && (
        <>
          <div className="mt-3" />
          {label('sheet.pedigree')}
          <div className="max-h-[36vh] overflow-y-auto">
            <TomatoPedigree engine={engine} ind={ind} byId={byId} onFocus={onFocus} />
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
      <TomatoJournal ind={ind} onAdd={onJournalAdd} onDelete={onJournalDelete} onExport={onJournalExport} />

      {divider}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onArchive}
          className="flex-1 rounded px-3 py-1.5 text-xs"
          style={{ background: 'var(--color-paper-300)', color: 'var(--color-ink-900)' }}
        >
          {ind.archived ? tt('sheet.unarchive') : tt('sheet.archive')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 rounded px-3 py-1.5 text-xs"
          style={{ background: 'var(--color-bloom-600)', color: 'var(--color-paper-100)' }}
        >
          {tt('sheet.delete')}
        </button>
      </div>
    </div>
  );
}

function ParentLink({
  id,
  byId,
  onFocus,
}: {
  id: string;
  byId: Map<string, TomatoIndividual>;
  onFocus: (id: string) => void;
}) {
  const p = byId.get(id);
  if (!p) return <span className="genotype-code opacity-60">{id}</span>;
  return (
    <button type="button" onClick={() => onFocus(id)} className="underline decoration-dotted underline-offset-2">
      {p.label}
    </button>
  );
}
