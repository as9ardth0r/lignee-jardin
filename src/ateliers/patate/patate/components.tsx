import { useMemo, useState } from 'react';
import { RealCrossGuide } from './RealCross';
import { MAIN_TRAITS, QUANT_TRAITS, type CrossCheck, type QuantTraitId, type PtEngine, type PtIndividual, type PtJournalEntry } from '../engine/patate/engine';
import { crossInGarden } from '../engine/patate/compat';
import { LOCUS_BY_ID, SPECIES, SPECIES_INFO, PT_LOCI, locusHypothetical, locusRelevant, variantInfo, type LocusCategory, type SpeciesId, type VariantId } from '../engine/patate/loci';
import { PT_VARIETIES, type PtVariety } from '../engine/patate/varieties';
import { FLESH_PAINT, FruitDot, PotatoPortrait, fruitColor } from './PotatoPortrait';
import { usePtT, type PtKey, type TT } from './i18n';
import { LOWER_IS_BETTER, TRAIT_COLOR, formatKg, formatTrait } from './format';
import { VarietyBrowser, describeVariety } from './VarietyBrowser';
import { appearanceSummary } from './summary';
import { CultureSheet, GardenSheet, PtJournal, PtNutrientPanel, PtPedigree } from './extras';
import { gardenOutcome, type GardenSettings } from '../engine/patate/garden';

const INK500 = 'var(--color-ink-500)';
const RED = 'var(--color-tomato-600)';

// --- Petits utilitaires d'affichage ----------------------------------------

export function fruitSummary(engine: PtEngine, ind: PtIndividual, tt: TT): string {
  return appearanceSummary(engine.appearance(ind), engine.sizeClass(ind), tt);
}

export function speciesLabel(ind: Pick<PtIndividual, 'species' | 'hybridWith'>): string {
  return ind.hybridWith ? `${SPECIES_INFO[ind.species].latin} × ${SPECIES_INFO[ind.hybridWith].short}` : SPECIES_INFO[ind.species].latin;
}

export function TraitBar({ engine, ind, trait, large }: { engine: PtEngine; ind: PtIndividual; trait: QuantTraitId; large?: boolean }) {
  const { tt, language } = usePtT();
  const u = engine.unitOf(trait, ind);
  const pct = (LOWER_IS_BETTER[trait] ? 1 - u : u) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-1.5">
        <span className={`min-w-0 truncate ${large ? 'text-xs' : 'text-[10px]'}`} style={{ color: INK500 }} title={tt(`trait.${trait}` as PtKey)}>
          {tt(`trait.${trait}` as PtKey)}
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

function GardenLine({ engine, ind, garden }: { engine: PtEngine; ind: PtIndividual; garden: GardenSettings }) {
  const { tt, language } = usePtT();
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

export function PtCard({
  engine,
  ind,
  garden,
  selectedSlot,
  focused,
  fresh,
  onFocus,
  onToggleSelect,
}: {
  engine: PtEngine;
  ind: PtIndividual;
  garden: GardenSettings;
  selectedSlot: 'A' | 'B' | null;
  focused: boolean;
  fresh: boolean;
  onFocus: () => void;
  onToggleSelect: () => void;
}) {
  const { tt, language } = usePtT();
  const app = engine.appearance(ind);
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
          <PotatoPortrait seed={ind.id} appearance={app} weightUnit={engine.unitOf('weight', ind)} size={68} />
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
            {speciesLabel(ind)}
          </p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--color-ink-700)' }}>
            {fruitSummary(engine, ind, tt)}
          </p>
        </div>
      </div>


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
        {ind.fertility < 1 && (
          <span className="rounded px-1.5 py-0.5" style={{ background: ind.fertility === 0 ? '#b8412a' : 'var(--color-resin-500)', color: 'var(--color-paper-100)' }}>
            {ind.fertility === 0 ? tt('card.sterile') : tt('card.fertility', { pct: Math.round(ind.fertility * 100) })}
          </span>
        )}
        <span className="rounded px-1.5 py-0.5 font-data" style={{ background: ind.ploidy === 4 ? 'var(--color-paper-300)' : 'var(--color-canopy-700)', color: ind.ploidy === 4 ? 'var(--color-ink-700)' : 'var(--color-paper-100)' }} title={tt('card.ploidyHint')}>
          {ind.ploidy}x · {ind.ebn}EBN
        </span>
        <span
          className="rounded px-1.5 py-0.5 font-data"
          style={{ background: ind.tuberGen > 0 ? 'var(--color-leaf-500)' : 'var(--color-paper-300)', color: ind.tuberGen > 0 ? 'var(--color-paper-100)' : 'var(--color-ink-700)' }}
          title={tt(ind.tuberGen > 0 ? 'card.cloneHint' : ind.generation > 0 ? 'card.seedlingHint' : 'card.certifiedHint')}
        >
          {ind.tuberGen > 0 ? tt('card.clone', { n: ind.tuberGen }) : ind.generation > 0 ? tt('card.seedling') : tt('card.certified')}
        </span>
        {ind.ploidy === 2 && (
          <span className="rounded px-1.5 py-0.5 font-data" style={chipStyle} title={tt(app.selfCompatible ? 'card.scHint' : 'card.siHint')}>
            {app.selfCompatible ? 'SC (Sli)' : [...new Set(ind.genotype.s)].join('/')}
          </span>
        )}
        {app.twoNPollen && (
          <span className="rounded px-1.5 py-0.5 font-data" style={chipStyle} title={tt('card.twoNHint')}>
            2n ♂
          </span>
        )}
        {ind.inducer && (
          <span className="rounded px-1.5 py-0.5 font-data" style={{ background: 'var(--color-bloom-500)', color: 'var(--color-paper-100)' }} title={tt('card.inducerHint')}>
            IVP
          </span>
        )}
        {ind.cyto === 'W' && (
          <span className="rounded px-1.5 py-0.5 font-data" style={{ background: 'var(--color-bloom-500)', color: 'var(--color-paper-100)' }} title={tt('cms.sterile')}>
            W
          </span>
        )}
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

const CATEGORY_ORDER: LocusCategory[] = ['skin', 'flesh', 'tuber', 'flower', 'resistance'];

export function FounderPanel({ engine, varieties, onPlant }: { engine: PtEngine; varieties: PtVariety[]; onPlant: (list: PtIndividual[]) => void }) {
  const { tt, language } = usePtT();
  const [mode, setMode] = useState<'library' | 'custom'>('library');
  const [picked, setPicked] = useState<PtVariety>(PT_VARIETIES.find((v) => v.id === 'charlotte') ?? PT_VARIETIES[0]);
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState('');
  const [species, setSpecies] = useState<SpeciesId>('tuberosum');
  const [variants, setVariants] = useState<VariantId[]>([]);
  const [targets, setTargets] = useState<Record<QuantTraitId, number>>({ weight: 0.75, days: 0.4, dm: 0.4, frost: 0.85 });

  function plant() {
    const out: PtIndividual[] = [];
    for (let i = 0; i < count; i++) {
      if (mode === 'library') {
        const base = label.trim() || picked.name;
        out.push(engine.createFromVariety(picked, count > 1 ? `${base} ${i + 1}` : base));
      } else {
        const base = label.trim() || tt('founder.custom.defaultName');
        out.push(engine.createCustom({ label: count > 1 ? `${base} ${i + 1}` : base, species, variants, targets }));
      }
    }
    onPlant(out);
    setLabel('');
  }

  const preview = useMemo(() => engine.createCustom({ label: '', species, variants, targets }), [engine, species, variants, targets]);

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
              {tt('species.label')}
            </span>
            <select
              value={species}
              onChange={(e) => {
                const sp = e.target.value as SpeciesId;
                setSpecies(sp);
                setVariants((v) => v.filter((id) => locusRelevant(variantInfo(id).locus, sp)));
              }}
              className="mt-1 w-full rounded px-2 py-1.5 text-xs outline-none"
              style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
            >
              {SPECIES.map((sp) => (
                <option key={sp} value={sp}>
                  {SPECIES_INFO[sp].latin} — {SPECIES_INFO[sp].name[language]}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-2 flex items-center gap-3 rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
            <PotatoPortrait seed="custom-preview" appearance={engine.appearance(preview)} weightUnit={targets.weight} size={76} />
            <p className="text-[11px] leading-snug" style={{ color: 'var(--color-ink-700)' }}>
              {fruitSummary(engine, preview, tt)}
            </p>
          </div>
          <div className="mt-3 space-y-3">
            {CATEGORY_ORDER.map((cat) => {
              const loci = PT_LOCI.filter((l) => l.category === cat && locusRelevant(l, species));
              if (!loci.length) return null;
              return (
                <div key={cat}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: INK500 }}>
                    {tt(`cat.${cat}` as PtKey)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {loci.flatMap((l) =>
                      l.alleles
                        .filter((a) => a.id)
                        .map((a) => {
                          const id = a.id!;
                          const on = variants.includes(id);
                          const siblings = l.alleles.filter((x) => x.id && x.id !== id).map((x) => x.id!);
                          const hyp = locusHypothetical(l, species);
                          return (
                            <button
                              key={id}
                              type="button"
                              title={`${(a.effect ?? l.name)[language]}${hyp ? ` (${tt('sheet.hypothetical')})` : ''}`}
                              aria-pressed={on}
                              onClick={() => setVariants((v) => (on ? v.filter((x) => x !== id) : [...v.filter((x) => !siblings.includes(x)), id]))}
                              className="rounded px-2 py-1 text-[11px] transition-colors"
                              style={{
                                background: on ? ('var(--color-tomato-500)') : 'var(--color-paper-300)',
                                color: on ? 'var(--color-paper-100)' : 'var(--color-ink-700)',
                              }}
                            >
                              <span className="font-data mr-1 opacity-80">{a.allele}</span>
                              {(a.name ?? l.name)[language]}
                              {hyp && <span className="ml-1 opacity-70">({tt('founder.hypothetical')})</span>}
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
                  {tt(`trait.${trait}` as PtKey)}
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

// --- Barrière entre espèces --------------------------------------------------

export function CompatBox({ engine, check, a, b }: { engine: PtEngine; check: CrossCheck; a: PtIndividual; b: PtIndividual }) {
  const { tt } = usePtT();
  const tone =
    check.level === 'blocked'
      ? { bg: '#f6ded8', border: '#b8412a', color: '#7a2414', icon: '⛔' }
      : check.level === 'difficult'
        ? { bg: '#f7ecd2', border: 'var(--color-resin-500)', color: '#6b4a10', icon: '⚠' }
        : { bg: 'var(--color-paper-200)', border: 'var(--color-leaf-500)', color: 'var(--color-ink-700)', icon: '✓' };
  const same = a.species === b.species;
  const selfing = a.id === b.id;
  return (
    <div className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: tone.bg, borderLeft: `3px solid ${tone.border}`, color: tone.color }}>
      <p className="font-semibold">
        {tone.icon} {tt(`compat.level.${check.level}` as PtKey)}
        {!same && (
          <span className="ml-1 font-normal italic">
            · {SPECIES_INFO[a.species].short} ♀ × {SPECIES_INFO[b.species].short} ♂
          </span>
        )}
        <span className="ml-1 font-data font-normal">
          · {a.ploidy}x {a.ebn}EBN ♀ × {b.ploidy}x {b.ebn}EBN ♂{check.level !== 'blocked' && !b.inducer ? ` → ${check.childPloidy}x` : ''}
        </span>
        {a.cyto === 'W' && <span className="ml-1 font-data font-normal">· W ♀</span>}
      </p>
      <p className="mt-1">{tt(`compat.${check.reason}` as PtKey)}</p>
      {check.level === 'difficult' && (
        <p className="mt-1 font-data">
          {tt('compat.expected', { pct: Math.max(1, Math.round(check.effectiveSeedSet * 100)) })}
          {!same && (check.f1Fertility === 0 ? ` · ${tt('compat.f1sterile')}` : check.f1Fertility < 1 ? ` · ${tt('compat.f1partial', { pct: Math.round(check.f1Fertility * 100) })}` : '')}
        </p>
      )}
      {check.uncertain && <p className="mt-1 italic">{tt('compat.uncertain')}</p>}
      {check.level !== 'blocked' && (
        <p className="mt-1">
          {engine.isMaleSterile(a) ? '🌼' : '✂'} {tt(selfing ? (a.ploidy === 2 ? 'flower.selfSli' : 'flower.self') : engine.isMaleSterile(a) ? 'flower.wMother' : engine.isSelfCompatible(a) ? 'flower.emasculate' : 'flower.siMother')}
        </p>
      )}
      {!selfing && <p className="mt-1 opacity-80">🐝 {same ? tt('compat.gardenSame') : crossInGarden(a.species, b.species) ? tt('compat.gardenComplex') : tt('compat.gardenApart')}</p>}
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
  engine: PtEngine;
  a: PtIndividual | null;
  b: PtIndividual | null;
  onCross: (n: number) => void;
  onSelf: (n: number) => void;
}) {
  const { tt, language } = usePtT();
  const [n, setN] = useState(24);
  const [showReal, setShowReal] = useState(false);
  const check = a && b ? engine.crossCheck(a, b) : null;
  const selfCheck = a ? engine.crossCheck(a, a) : null;
  const shownCheck = check ?? selfCheck;
  const blocked = shownCheck?.level === 'blocked';
  const prediction = a && !blocked ? engine.predict(a, b ?? a) : [];

  const slot = (ind: PtIndividual | null, letter: string, role: string) =>
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
            {speciesLabel(ind)}
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

      {a && shownCheck && <CompatBox engine={engine} check={shownCheck} a={a} b={b ?? a} />}

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

      {shownCheck?.sharedS && (
        <div className="mt-3 rounded p-3 text-xs leading-relaxed" style={{ background: 'var(--color-paper-200)', borderLeft: '3px solid var(--color-resin-500)', color: 'var(--color-ink-700)' }}>
          <p>🔒 {tt('si.hint', { s: shownCheck.sharedS.join(', ') })}</p>
        </div>
      )}
      {a && b && !blocked && shownCheck && (shownCheck.viaTwoN || b.inducer || shownCheck.childPloidy % 2 === 1 || a.cyto === 'W') && (
        <div className="mt-3 space-y-1 rounded p-3 text-xs leading-relaxed" style={{ background: 'var(--color-paper-200)', borderLeft: '3px solid var(--color-bloom-500)', color: 'var(--color-ink-700)' }}>
          {shownCheck.viaTwoN && <p>🧬 {tt('twoN.hint', { p: shownCheck.childPloidy })}</p>}
          {b.inducer && <p>🧬 {tt('inducer.hint', { pct: Math.round((shownCheck.dihaploidShare ?? 0) * 100), p: a.ploidy / 2 })}</p>}
          {!b.inducer && shownCheck.childPloidy % 2 === 1 && <p>🧬 {tt('odd.hint', { p: shownCheck.childPloidy })}</p>}
          {a.cyto === 'W' && <p>🧬 {tt('w.hint')}</p>}
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
                    <span className="genotype-code w-12 shrink-0" style={{ color: 'var(--color-resin-600)' }}>
                      {info.label}
                    </span>
                    <span className="flex-1 truncate" style={{ color: 'var(--color-ink-700)' }}>
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
        <label className="text-xs" style={{ color: INK500 }} htmlFor="pt-seeds">
          {tt('cross.count')}
        </label>
        <input
          id="pt-seeds"
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
            disabled={!a || selfCheck?.level === 'blocked'}
            onClick={() => onSelf(n)}
            className="rounded px-3 py-2 text-sm font-medium transition-transform disabled:opacity-40 hover:not-disabled:-translate-y-0.5"
            style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}
          >
            ⊗ {tt('cross.self')}
          </button>
          <button
            type="button"
            disabled={!a || !b || check?.level === 'blocked'}
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
  if (Math.abs(p) < 1e-9) return '0';
  if (Math.abs(p - 1) < 1e-9) return '100 %';
  for (const d of [2, 3, 4, 6, 8, 9, 12, 16, 18, 36, 64, 144]) {
    const n = Math.round(p * d);
    if (n > 0 && Math.abs(p * d - n) < 1e-6) return `${n}/${d}`;
  }
  return `${Math.round(p * 100)} %`;
}

// --- Attendu vs observé -------------------------------------------------------

export function MendelPanel({ engine, batch, parents }: { engine: PtEngine; batch: PtIndividual[]; parents: [PtIndividual, PtIndividual] | null }) {
  const { tt, language } = usePtT();
  if (!parents || batch.length === 0) return null;
  const pred = engine.predict(parents[0], parents[1]).filter((p) => p.pExpressed > 0 && p.pExpressed < 1);
  const nSterile = batch.filter((x) => x.fertility < 0.999).length;

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
      {nSterile > 0 && (
        <p className="mt-2 rounded px-2 py-1.5 text-[11px] font-semibold" style={{ background: 'var(--color-bloom-500)', color: '#fff' }}>
          {tt('fertility.batch', { n: nSterile, total: batch.length })}
        </p>
      )}
      <MorphoBreakdown engine={engine} batch={batch} />
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
                <div className="h-full rounded-full" style={{ width: `${obs * 100}%`, background: 'var(--color-tomato-400)' }} />
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

function MorphoBreakdown({ engine, batch }: { engine: PtEngine; batch: PtIndividual[] }) {
  const { tt } = usePtT();
  const counts = new Map<string, { n: number; sample: PtIndividual }>();
  const ploidies = new Map<number, number>();
  for (const ind of batch) {
    const app = engine.appearance(ind);
    const key = `${app.skin}-${app.flesh}`;
    const cur = counts.get(key);
    if (cur) cur.n++;
    else counts.set(key, { n: 1, sample: ind });
    ploidies.set(ind.ploidy, (ploidies.get(ind.ploidy) ?? 0) + 1);
  }
  const rows = Array.from(counts.values()).sort((a, b) => b.n - a.n);
  if (rows.length < 2 && ploidies.size < 2) return null;
  return (
    <div className="mt-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {rows.map((r, i) => {
          const app = engine.appearance(r.sample);
          return <div key={i} style={{ width: `${(r.n / batch.length) * 100}%`, background: `linear-gradient(90deg, ${fruitColor(app)} 0 40%, ${FLESH_PAINT[app.flesh]} 40%)` }} className="h-full" />;
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {rows.map((r, i) => {
          const app = engine.appearance(r.sample);
          return (
            <span key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-paper-200)' }}>
              <FruitDot appearance={app} size={10} />
              {tt(`skin.${app.skin}` as PtKey)} · {tt(`flesh.${app.flesh}` as PtKey)}
              <span className="font-data opacity-60">{r.n}</span>
            </span>
          );
        })}
      </div>
      {ploidies.size > 1 && (
        <p className="mt-1.5 font-data text-[11px]" style={{ color: 'var(--color-paper-300)' }}>
          {[...ploidies.entries()]
            .sort((x, y) => x[0] - y[0])
            .map(([p, n]) => `${p}x : ${n}`)
            .join(' · ')}
        </p>
      )}
    </div>
  );
}

// --- Courbe de fixation --------------------------------------------------------

export function FixationChart({ engine, individuals }: { engine: PtEngine; individuals: PtIndividual[] }) {
  const { tt } = usePtT();
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
  onDouble,
  onSaveVariety,
  onJournalAdd,
  onJournalDelete,
  onJournalExport,
}: {
  engine: PtEngine;
  ind: PtIndividual;
  garden: GardenSettings;
  varieties: PtVariety[];
  byId: Map<string, PtIndividual>;
  onNotes: (text: string) => void;
  onDelete: () => void;
  onArchive: () => void;
  onFocus: (id: string) => void;
  onRename: (label: string) => void;
  onClone: () => void;
  onDouble: () => void;
  onSaveVariety: () => void;
  onJournalAdd: (e: Omit<PtJournalEntry, 'id'>) => void;
  onJournalDelete: (entryId: string) => void;
  onJournalExport: () => void;
}) {
  const { tt, language } = usePtT();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const app = engine.appearance(ind);
  const variety = ind.varietyId ? varieties.find((v) => v.id === ind.varietyId) : undefined;
  const fixed = engine.isFixed(ind);
  const seg = engine.segregatingLoci(ind);
  const res = engine.resistances(ind);
  const divider = <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />;
  const label = (k: PtKey) => (
    <p className="text-xs uppercase tracking-wide mb-2" style={{ color: INK500 }}>
      {tt(k)}
    </p>
  );
  const sp = ind.species;
  const relevant = PT_LOCI.filter((l) => locusRelevant(l, sp) || (ind.hybridWith && locusRelevant(l, ind.hybridWith)) || ind.genotype[l.id].some((x) => x !== l.standard));
  const others = PT_LOCI.filter((l) => !relevant.includes(l));

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
        {speciesLabel(ind)} — {SPECIES_INFO[sp].name[language]}
      </p>
      <p className="genotype-code text-xs mt-1" style={{ color: 'var(--color-ink-700)' }}>
        {engine.genotypeCode(ind)}
      </p>
      {ind.hybridWith && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: ind.fertility === 0 ? RED : 'var(--color-bloom-500)' }}>
          {tt('sheet.interspecific', { a: SPECIES_INFO[sp].latin, b: SPECIES_INFO[ind.hybridWith].latin })}{' '}
          {ind.fertility === 0 ? tt('sheet.sterile') : ind.fertility < 1 ? tt('sheet.fertility', { pct: Math.round(ind.fertility * 100) }) : ''}
        </p>
      )}
      {ind.hybridFounder && !ind.hybridWith && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
          {tt('sheet.hybridFounder')}
        </p>
      )}
      {ind.clonedFromId && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--color-leaf-500)' }}>
          {tt('sheet.clonedFrom', { name: byId.get(ind.clonedFromId)?.label ?? ind.clonedFromId })}
        </p>
      )}
      {ind.doubledFromId && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
          {tt('sheet.doubledFrom', { name: byId.get(ind.doubledFromId)?.label ?? ind.doubledFromId })}
        </p>
      )}
      {ind.dihaploidOf && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
          {tt('sheet.dihaploidOf', { name: byId.get(ind.dihaploidOf)?.label ?? ind.dihaploidOf })}
        </p>
      )}
      {ind.ploidy % 2 === 1 && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
          {tt('sheet.oddPloidy', { p: ind.ploidy })}
        </p>
      )}
      {ind.cyto === 'W' && (
        <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--color-bloom-500)' }}>
          {tt('cms.sterile')}
        </p>
      )}

      <div className="mt-3 flex justify-center rounded" style={{ background: 'var(--color-paper-200)' }}>
        <PotatoPortrait seed={ind.id} appearance={app} weightUnit={engine.unitOf('weight', ind)} size={220} />
      </div>
      <p className="text-[10px] text-center italic mt-1" style={{ color: INK500 }}>
        {tt('sheet.portraitCaption')}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onClone} title={tt('sheet.cloneHint')} className="rounded px-3 py-1.5 text-xs" style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-100)' }}>
          🥔 {tt('sheet.clone')}
        </button>
        <button
          type="button"
          onClick={onDouble}
          disabled={!engine.canDouble(ind)}
          title={tt('sheet.doubleHint')}
          className="rounded px-3 py-1.5 text-xs disabled:opacity-40"
          style={{ background: 'var(--color-bloom-500)', color: 'var(--color-paper-100)' }}
        >
          ×2 {tt('sheet.double')}
        </button>
        <button
          type="button"
          onClick={onSaveVariety}
          title={tt('sheet.saveVarietyHint')}
          className="col-span-2 rounded px-3 py-1.5 text-xs disabled:opacity-40"
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
            · {tt('sheet.ploidy', { p: ind.ploidy, e: ind.ebn })}
          </span>
        </dd>
        <dt style={{ color: INK500 }}>{tt('sheet.flowers')}</dt>
        <dd>
          {ind.ploidy === 2 ? `${tt(app.selfCompatible ? 'fruit.sc' : 'fruit.si')} (${[...new Set(ind.genotype.s)].join('/')})` : tt('fruit.scPoly')}
          {app.twoNPollen ? ` · ${tt('fruit.twoN')}` : ''}
          {app.maleSterile ? ` · ${tt('fruit.wSterile')}` : ''} · <span style={{ color: INK500 }}>{tt('sheet.outcrossing', { pct: Math.round(engine.outcrossingRate(ind) * 100) })}</span>
        </dd>
        <dt style={{ color: INK500 }}>{tt('sheet.yield')}</dt>
        <dd className="font-data">
          {formatKg(engine.yieldKg(ind), locale)} {tt('sheet.perPlant')}
        </dd>
        <dt style={{ color: INK500 }}>{tt('sheet.resistances')}</dt>
        <dd>
          {res.length ? (
            <>
              <span className="font-data">{engine.resistanceCode(ind)}</span>
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
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
        {tt('sheet.clonal')}
      </p>
      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: engine.vigor(ind.haps) < 0.85 ? RED : 'var(--color-ink-700)' }}>
        {tt('sheet.vigor', { pct: Math.round(engine.vigor(ind.haps) * 100), h: Math.round(engine.polygenicHeterozygosity(ind.haps) * 100) })}
        {fixed ? ` ${tt('sheet.fixed')}` : ''}
      </p>
      {seg.length > 0 && (
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
          {tt('sheet.segregating')} {seg.filter((id) => !LOCUS_BY_ID[id].silent).map((id) => LOCUS_BY_ID[id].name[language]).join(', ')}
        </p>
      )}

      {divider}
      {label('sheet.culture')}
      <CultureSheet engine={engine} ind={ind} />

      {divider}
      {label('nut.title')}
      <PtNutrientPanel engine={engine} ind={ind} />

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
            {relevant.map((l) => {
              const pair = ind.genotype[l.id];
              const variantAlleles = l.alleles.filter((a) => a.id);
              const expressed = variantAlleles.find((a) => engine.has(ind.genotype, a.id!));
              const full = expressed && (!l.incomplete || engine.dose(ind.genotype, expressed.id!) === ind.ploidy);
              const carrier = !expressed && variantAlleles.some((a) => pair.includes(a.allele));
              const hyp = locusHypothetical(l, sp);
              return (
                <tr key={l.id} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }} title={(expressed?.effect ?? variantAlleles[0]?.effect ?? l.name)[language]}>
                  <td className="py-1 pr-2">
                    <span className="genotype-code" style={{ color: 'var(--color-resin-600)' }}>
                      {l.symbol}
                    </span>{' '}
                    <span style={{ color: 'var(--color-ink-700)' }}>{l.name[language]}</span>
                    {hyp && (
                      <span className="ml-1 italic" style={{ color: INK500 }} title={tt('sheet.hypothetical')}>
                        ({tt('founder.hypothetical')})
                      </span>
                    )}
                  </td>
                  <td className="py-1 pr-2 genotype-code">{engine.locusCode(pair, l.id)}</td>
                  <td className="py-1">
                    {expressed ? (
                      <span style={{ color: 'var(--color-tomato-500)' }}>● {full ? tt('sheet.status.expressed') : tt('sheet.status.partial')}</span>
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
        {others.length > 0 && (
          <p className="mt-1.5 text-[10px] leading-snug" style={{ color: INK500 }}>
            {tt('sheet.otherLoci')} : {others.map((l) => l.symbol).join(', ')}
          </p>
        )}
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
            <PtPedigree engine={engine} ind={ind} byId={byId} onFocus={onFocus} />
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
      <PtJournal ind={ind} onAdd={onJournalAdd} onDelete={onJournalDelete} onExport={onJournalExport} />

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

function ParentLink({ id, byId, onFocus }: { id: string; byId: Map<string, PtIndividual>; onFocus: (id: string) => void }) {
  const p = byId.get(id);
  if (!p) return <span className="genotype-code opacity-60">{id}</span>;
  return (
    <button type="button" onClick={() => onFocus(id)} className="underline decoration-dotted underline-offset-2">
      {p.label}
    </button>
  );
}
