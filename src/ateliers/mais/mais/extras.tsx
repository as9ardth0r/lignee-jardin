import { useMemo, useState } from 'react';
import {
  QUANT_TRAITS,
  MZ_STAGES,
  KERNEL_COLORS as COLOR_LIST,
  TEXTURES,
  type QuantTraitId,
  type KernelColor,
  type Texture,
  type MzEngine,
  type MzIndividual,
  type MzJournalEntry,
  type MzStage,
} from '../engine/mais/engine';
import { variantInfo, type VariantId } from '../engine/mais/loci';
import { goalIsEmpty, runProgram, type BreedingGoal, type ProgramResult } from '../engine/mais/program';
import { NUTRIENTS, mzNutrientPlan, type Nutrient } from '../engine/mais/nutrients';
import { gardenOutcome, type ClimateId, type GardenSettings, type LossCause } from '../engine/mais/garden';
import { FruitDot } from './MaizePortrait';
import { fruitSummary, speciesLabel } from './components';
import { useMzT, type MzKey, type TT } from './i18n';
import { formatKg, formatTrait } from './format';

const INK500 = 'var(--color-ink-500)';
const INK700 = 'var(--color-ink-700)';
const inputStyle = { background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' };

function toDateInput(ms: number) {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// --- Journal de culture -----------------------------------------------------

export function MzJournal({
  ind,
  onAdd,
  onDelete,
  onExport,
}: {
  ind: MzIndividual;
  onAdd: (e: Omit<MzJournalEntry, 'id'>) => void;
  onDelete: (entryId: string) => void;
  onExport: () => void;
}) {
  const { tt, language } = useMzT();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => toDateInput(Date.now()));
  const [stage, setStage] = useState<MzStage | ''>('');
  const [height, setHeight] = useState('');
  const [fruits, setFruits] = useState('');
  const [harvest, setHarvest] = useState('');
  const [issues, setIssues] = useState('');
  const [actions, setActions] = useState('');
  const [text, setText] = useState('');

  const entries = [...(ind.journal ?? [])].sort((a, b) => b.date - a.date);
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const totalFruits = entries.reduce((s, e) => s + (e.fruits ?? 0), 0);
  const totalKg = entries.reduce((s, e) => s + (e.harvestKg ?? 0), 0);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!text.trim() && !issues.trim() && !actions.trim() && !fruits && !harvest && !stage) return;
    const d = new Date(date);
    const now = new Date();
    d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    onAdd({
      date: d.getTime(),
      stage: stage || undefined,
      heightCm: height ? Number(height) : undefined,
      fruits: fruits ? Number(fruits) : undefined,
      harvestKg: harvest ? Number(harvest) : undefined,
      issues: issues.trim() || undefined,
      actions: actions.trim() || undefined,
      text: text.trim(),
    });
    setStage('');
    setHeight('');
    setFruits('');
    setHarvest('');
    setIssues('');
    setActions('');
    setText('');
    setOpen(false);
  }

  const label = (k: MzKey, htmlFor: string) => (
    <label htmlFor={htmlFor} className="block text-[10px] mb-1" style={{ color: 'var(--color-paper-300)' }}>
      {tt(k)}
    </label>
  );
  const field = 'w-full rounded px-2 py-1.5 text-xs outline-none';

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded px-2.5 py-1.5 text-xs font-medium"
          style={{ background: open ? 'var(--color-resin-500)' : 'var(--color-canopy-800)', color: open ? 'var(--color-ink-900)' : 'var(--color-paper-200)' }}
        >
          {open ? tt('journal.cancel') : tt('journal.open')}
        </button>
        {entries.length > 0 && (
          <button type="button" onClick={onExport} className="rounded px-2.5 py-1.5 text-xs" style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}>
            {tt('journal.export')}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mb-3 space-y-2 rounded p-3" style={{ background: 'var(--color-canopy-900)' }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              {label('journal.date', 'sj-date')}
              <input id="sj-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} style={inputStyle} />
            </div>
            <div>
              {label('journal.stage', 'sj-stage')}
              <select id="sj-stage" value={stage} onChange={(e) => setStage(e.target.value as MzStage | '')} className={field} style={inputStyle}>
                <option value="">—</option>
                {MZ_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {tt(`stage.${s}` as MzKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              {label('journal.height', 'sj-h')}
              <input id="sj-h" type="number" min={0} value={height} onChange={(e) => setHeight(e.target.value)} className={field} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                {label('journal.fruits', 'sj-f')}
                <input id="sj-f" type="number" min={0} value={fruits} onChange={(e) => setFruits(e.target.value)} className={field} style={inputStyle} />
              </div>
              <div>
                {label('journal.harvest', 'sj-g')}
                <input id="sj-g" type="number" min={0} step={0.1} value={harvest} onChange={(e) => setHarvest(e.target.value)} className={field} style={inputStyle} />
              </div>
            </div>
          </div>
          <div>
            {label('journal.issues', 'sj-i')}
            <input id="sj-i" value={issues} onChange={(e) => setIssues(e.target.value)} className={field} style={inputStyle} />
          </div>
          <div>
            {label('journal.actions', 'sj-a')}
            <input id="sj-a" value={actions} onChange={(e) => setActions(e.target.value)} className={field} style={inputStyle} />
          </div>
          <div>
            {label('journal.text', 'sj-t')}
            <textarea id="sj-t" rows={3} value={text} onChange={(e) => setText(e.target.value)} className={`${field} resize-y`} style={inputStyle} />
          </div>
          <button type="submit" className="w-full rounded px-3 py-2 text-xs font-medium" style={{ background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' }}>
            {tt('journal.save')}
          </button>
        </form>
      )}

      {(totalFruits > 0 || totalKg > 0) && (
        <p className="text-[11px] mb-2 font-data" style={{ color: 'var(--color-leaf-500)' }}>
          {tt('journal.total', { fruits: totalFruits, kg: totalKg.toLocaleString(locale, { maximumFractionDigits: 1 }) })}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="text-xs italic" style={{ color: INK500 }}>
          {tt('journal.empty')}
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded p-2.5 text-xs" style={{ background: 'var(--color-paper-200)' }}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-data text-[11px]" style={{ color: INK700 }}>
                  {new Date(e.date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                  {e.stage ? ` · ${tt(`stage.${e.stage}` as MzKey)}` : ''}
                  {e.heightCm != null ? ` · ${e.heightCm} cm` : ''}
                </p>
                <button type="button" onClick={() => onDelete(e.id)} className="text-[10px] underline" style={{ color: INK500 }}>
                  {tt('journal.delete')}
                </button>
              </div>
              {(e.fruits != null || e.harvestKg != null) && (
                <p className="mt-0.5 font-data text-[11px]" style={{ color: 'var(--color-leaf-500)' }}>
                  🫘 {e.fruits ?? '–'} · {e.harvestKg != null ? `${e.harvestKg} kg` : '–'}
                </p>
              )}
              {e.text && <p className="mt-1 leading-relaxed">{e.text}</p>}
              {e.issues && (
                <p className="mt-1" style={{ color: 'var(--color-bloom-500)' }}>
                  ⚠ {e.issues}
                </p>
              )}
              {e.actions && (
                <p className="mt-0.5" style={{ color: INK700 }}>
                  → {e.actions}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function journalAsText(engine: MzEngine, ind: MzIndividual, tt: TT, locale: string): string {
  const entries = [...(ind.journal ?? [])].sort((a, b) => a.date - b.date);
  const lines = [`# ${tt('journal.title')} — ${ind.label} (${ind.id})`, `${speciesLabel(ind)} · ${engine.genotypeCode(ind)}`, fruitSummary(engine, ind, tt), ''];
  for (const e of entries) {
    const d = new Date(e.date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
    lines.push(`## ${d}${e.stage ? ` — ${tt(`stage.${e.stage}` as MzKey)}` : ''}${e.heightCm != null ? ` — ${e.heightCm} cm` : ''}`);
    if (e.fruits != null || e.harvestKg != null) lines.push(`${tt('journal.fruits')}: ${e.fruits ?? '–'} · ${tt('journal.harvest')}: ${e.harvestKg ?? '–'}`);
    if (e.text) lines.push(e.text);
    if (e.issues) lines.push(`${tt('journal.issues')}: ${e.issues}`);
    if (e.actions) lines.push(`${tt('journal.actions')}: ${e.actions}`);
    lines.push('');
  }
  return lines.join('\n');
}

// --- Généalogie -------------------------------------------------------------

export function MzPedigree({
  engine,
  ind,
  byId,
  onFocus,
  depth = 0,
}: {
  engine: MzEngine;
  ind: MzIndividual;
  byId: Map<string, MzIndividual>;
  onFocus: (id: string) => void;
  depth?: number;
}) {
  const { tt } = useMzT();
  const parents = ind.parentIds ? Array.from(new Set(ind.parentIds)) : [];
  return (
    <div className={depth > 0 ? 'ml-3 border-l pl-3' : ''} style={{ borderColor: 'var(--color-paper-300)' }}>
      <button type="button" onClick={() => onFocus(ind.id)} className="flex w-full items-center gap-2 py-1 text-left">
        <FruitDot appearance={engine.appearance(ind)} size={10} />
        <span className="truncate text-xs" style={{ color: INK700 }}>
          {depth > 0 && parents.length !== 1 && ind.parentIds ? '' : ''}
          {ind.label}
        </span>
        <span className="ml-auto shrink-0 font-data text-[10px]" style={{ color: INK500 }}>
          {ind.generation === 0 ? 'P' : `F${ind.generation}`}
        </span>
      </button>
      {depth < 12 &&
        parents.map((pid) => {
          const p = byId.get(pid);
          return p ? <MzPedigree key={pid} engine={engine} ind={p} byId={byId} onFocus={onFocus} depth={depth + 1} /> : null;
        })}
      {parents.length === 1 && ind.parentIds && (
        <p className="ml-3 pl-3 text-[10px] italic" style={{ color: INK500 }}>
          ⊗ {tt('pedigree.selfed')}
        </p>
      )}
    </div>
  );
}

// --- Fiche de culture -------------------------------------------------------

export function CultureSheet({ engine, ind }: { engine: MzEngine; ind: MzIndividual }) {
  const { tt } = useMzT();
  const app = engine.appearance(ind);
  const res = new Set(engine.resistances(ind));
  const tips: Array<{ t: string; danger?: boolean }> = [];
  if (ind.fertility === 0) tips.push({ t: tt('culture.sterile'), danger: true });
  tips.push({ t: tt('culture.sow', { days: ind.pheno.days }) });
  tips.push({ t: tt(`culture.species.${ind.species}` as MzKey) });
  tips.push({ t: tt('culture.block') });
  tips.push({ t: tt(`culture.texture.${app.kernel.texture}` as MzKey) });
  if (app.popBarrier) tips.push({ t: tt('culture.ga1s') });
  if (ind.cyto === 'T') tips.push({ t: tt(app.maleSterile ? 'culture.cmsT' : 'culture.cmsTRestored') });
  if (engine.vigor(ind) < 0.8) tips.push({ t: tt('culture.inbred') });
  if (app.branched || app.fruitCase !== 'naked') tips.push({ t: tt('culture.teosinte') });
  if (res.has('Ht1')) tips.push({ t: tt('culture.ht1') });
  if (res.has('Rp1')) tips.push({ t: tt('culture.rp1') });
  if (ind.hybridWith) tips.push({ t: tt('culture.interspecific') });
  tips.push({ t: tt('culture.seeds') });
  const fixed = engine.isFixed(ind);
  return (
    <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: INK700 }}>
      {tips.map((x, i) => (
        <li key={i} className="flex gap-2" style={x.danger ? { color: 'var(--color-tomato-600)', fontWeight: 600 } : undefined}>
          <span style={{ color: x.danger ? 'var(--color-tomato-600)' : 'var(--color-leaf-500)' }}>{x.danger ? '⚠' : '•'}</span>
          <span>{x.t}</span>
        </li>
      ))}
      {!fixed && ind.fertility > 0 && (
        <li className="flex gap-2" style={{ color: 'var(--color-bloom-500)' }}>
          <span>⚠</span>
          <span>{tt('culture.seedsNotFixed')}</span>
        </li>
      )}
    </ul>
  );
}

// --- Comparaison A / B --------------------------------------------------------

export function ComparePanel({ engine, a, b, garden }: { engine: MzEngine; a: MzIndividual; b: MzIndividual; garden: GardenSettings }) {
  const { tt, language } = useMzT();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const gardenShort = (x: MzIndividual) => {
    const o = gardenOutcome(engine, x, garden);
    return formatKg(o.realizedKg, locale);
  };
  const res = (x: MzIndividual) => engine.resistanceCode(x) || '—';
  const rows: Array<{ k: string; a: string; b: string; code?: boolean }> = [
    { k: tt('compare.species'), a: speciesLabel(a), b: speciesLabel(b) },
    { k: tt('compare.fruit'), a: fruitSummary(engine, a, tt), b: fruitSummary(engine, b, tt) },
    { k: tt('compare.cyto'), a: a.cyto === 'T' ? (engine.isMaleSterile(a) ? 'T (stérile)' : 'T + Rf1') : 'N', b: b.cyto === 'T' ? (engine.isMaleSterile(b) ? 'T (stérile)' : 'T + Rf1') : 'N' },
    { k: tt('compare.vigor'), a: `${Math.round(engine.vigor(a) * 100)} %`, b: `${Math.round(engine.vigor(b) * 100)} %` },
    ...QUANT_TRAITS.map((t) => ({ k: tt(`trait.${t}` as MzKey), a: formatTrait(a, t, tt, locale), b: formatTrait(b, t, tt, locale) })),
    { k: tt('trait.yield'), a: formatKg(engine.yieldKg(a), locale), b: formatKg(engine.yieldKg(b), locale) },
    { k: tt('compare.garden'), a: gardenShort(a), b: gardenShort(b) },
    { k: tt('compare.nutrients'), a: nutrientSummary(engine, a), b: nutrientSummary(engine, b) },
    { k: tt('compare.resistances'), a: res(a), b: res(b) },
    { k: tt('compare.fixation'), a: `${Math.round(engine.heterozygosity(a) * 100)} %`, b: `${Math.round(engine.heterozygosity(b) * 100)} %` },
    { k: tt('compare.genotype'), a: engine.genotypeCode(a), b: engine.genotypeCode(b), code: true },
  ];
  return (
    <div className="specimen-card p-5">
      <p className="font-display text-xl mb-3">{tt('compare.title')}</p>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1.5 text-xs">
        <span />
        <span className="flex items-center gap-1.5 font-medium truncate">
          <FruitDot appearance={engine.appearance(a)} size={10} /> A · {a.label}
        </span>
        <span className="flex items-center gap-1.5 font-medium truncate">
          <FruitDot appearance={engine.appearance(b)} size={10} /> B · {b.label}
        </span>
        {rows.map((r) => {
          const diff = r.a !== r.b;
          const st = { color: diff ? 'var(--color-ink-900)' : INK500, fontWeight: diff ? 500 : 400 };
          return (
            <div key={r.k} className="contents">
              <span style={{ color: INK500 }}>{r.k}</span>
              <span className={r.code ? 'genotype-code text-[10px]' : ''} style={st}>
                {r.a}
              </span>
              <span className={r.code ? 'genotype-code text-[10px]' : ''} style={st}>
                {r.b}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Distribution d'un trait quantitatif --------------------------------------

export function TraitDistribution({ engine, batch, parents }: { engine: MzEngine; batch: MzIndividual[]; parents: [MzIndividual, MzIndividual] | null }) {
  const { tt, language } = useMzT();
  const [trait, setTrait] = useState<QuantTraitId>('earLength');
  const BINS = 14;
  const data = useMemo(() => {
    const units = batch.map((x) => engine.unitOf(trait, x));
    const pu = parents ? parents.map((p) => engine.unitOf(trait, p)) : [];
    const all = [...units, ...pu];
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const span = Math.max(1e-6, hi - lo);
    const bins = Array.from({ length: BINS }, () => 0);
    for (const u of units) bins[Math.min(BINS - 1, Math.floor(((u - lo) / span) * BINS))]++;
    return { bins, lo, span, pu };
  }, [engine, batch, parents, trait]);
  if (batch.length < 8) return null;
  const max = Math.max(...data.bins);
  const W = 320;
  const H = 110;
  const bw = (W - 20) / BINS;
  const sorted = [...batch].sort((x, y) => engine.unitOf(trait, x) - engine.unitOf(trait, y));
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div className="rounded px-4 py-4" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-base" style={{ color: 'var(--color-paper-100)' }}>
          {tt('dist.title')}
        </p>
        <select value={trait} onChange={(e) => setTrait(e.target.value as QuantTraitId)} className="rounded px-2 py-1 text-xs outline-none" style={inputStyle}>
          {QUANT_TRAITS.map((t) => (
            <option key={t} value={t}>
              {tt(`trait.${t}` as MzKey)}
            </option>
          ))}
        </select>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="mt-2 w-full" role="img" aria-label={tt('dist.title')}>
        {data.bins.map((n, i) => {
          const h = max ? (n / max) * (H - 16) : 0;
          return <rect key={i} x={10 + i * bw + 1} y={H - h} width={bw - 2} height={h} rx={2} fill="var(--color-tomato-400)" opacity={0.85} />;
        })}
        <line x1={10} y1={H} x2={W - 10} y2={H} stroke="var(--color-canopy-600)" />
        {data.pu.map((u, i) => {
          const x = 10 + ((u - data.lo) / data.span) * (W - 20);
          return (
            <g key={i}>
              <line x1={x} y1={12} x2={x} y2={H} stroke="var(--color-paper-100)" strokeDasharray="3 3" />
              <text x={x} y={9} fontSize={9} textAnchor="middle" fill="var(--color-paper-200)" fontFamily="var(--font-data)">
                {i === 0 ? 'A' : 'B'}
              </text>
            </g>
          );
        })}
        <text x={10} y={H + 14} fontSize={9} fill="var(--color-paper-300)" fontFamily="var(--font-data)">
          {formatTrait(sorted[0], trait, tt, locale)}
        </text>
        <text x={W - 10} y={H + 14} fontSize={9} textAnchor="end" fill="var(--color-paper-300)" fontFamily="var(--font-data)">
          {formatTrait(sorted[sorted.length - 1], trait, tt, locale)}
        </text>
      </svg>
      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
        ┆ {tt('dist.parents')} — {tt('dist.help')}
      </p>
    </div>
  );
}

// --- Programme de sélection ----------------------------------------------------

const RESISTANCES: VariantId[] = ['Ht1', 'Rp1'];

export function ProgramPanel({
  engine,
  a,
  b,
  onDone,
  onSaveVariety,
  garden,
}: {
  engine: MzEngine;
  garden: GardenSettings;
  a: MzIndividual | null;
  b: MzIndividual | null;
  onDone: (result: ProgramResult) => void;
  onSaveVariety: (ind: MzIndividual) => void;
}) {
  const { tt, language } = useMzT();
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState<BreedingGoal>({ resistances: [], domesticated: false });
  const [family, setFamily] = useState(40);
  const [maxGen, setMaxGen] = useState(10);
  const [result, setResult] = useState<ProgramResult | null>(null);
  const set = (patch: Partial<BreedingGoal>) => setGoal((g) => ({ ...g, ...patch }));

  const sel = (value: string | undefined, onChange: (v: string) => void, options: Array<{ v: string; l: string }>, id: string, lbl: MzKey) => (
    <label htmlFor={id} className="block">
      <span className="block text-[10px] mb-0.5" style={{ color: INK500 }}>
        {tt(lbl)}
      </span>
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded px-2 py-1.5 text-xs outline-none" style={inputStyle}>
        <option value="">{tt('program.any')}</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
  const num = (id: string, lbl: MzKey, value: number | undefined, onChange: (v: number | undefined) => void, step = 1) => (
    <label htmlFor={id} className="block">
      <span className="block text-[10px] mb-0.5" style={{ color: INK500 }}>
        {tt(lbl)}
      </span>
      <input
        id={id}
        type="number"
        min={0}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full rounded px-2 py-1.5 text-xs outline-none"
        style={inputStyle}
      />
    </label>
  );

  function run() {
    if (!a || goalIsEmpty(goal)) return;
    const res = runProgram(engine, a, b, { ...goal, garden }, { familySize: family, maxGenerations: maxGen });
    setResult(res);
    onDone(res);
  }

  const resultKey: MzKey | null = result
    ? result.stopped === 'blocked'
      ? 'program.result.blocked'
      : result.stopped === 'sterile'
        ? 'program.result.sterile'
        : result.goalReached && result.fixed
          ? 'program.result.fixed'
          : 'program.result.partial'
    : null;

  return (
    <div className="specimen-card p-5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left" aria-expanded={open}>
        <span className="font-display text-xl">{tt('program.title')}</span>
        <span className="text-lg" style={{ color: INK500 }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: INK700 }}>
            {tt('program.help')}
          </p>
          {!a && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-bloom-500)' }}>
              {tt('program.needA')}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sel(goal.color, (v) => set({ color: (v || undefined) as KernelColor | undefined }), COLOR_LIST.map((c) => ({ v: c, l: tt(`color.${c}` as MzKey) })), 'pg-color', 'program.color')}
            {sel(goal.texture, (v) => set({ texture: (v || undefined) as Texture | undefined }), TEXTURES.map((c) => ({ v: c, l: tt(`textureName.${c}` as MzKey) })), 'pg-texture', 'program.texture')}
            {sel(goal.domesticated ? 'yes' : '', (v) => set({ domesticated: v === 'yes' }), [{ v: 'yes', l: tt('program.yes') }], 'pg-dom', 'program.domesticated')}
          </div>
          <p className="text-[10px] mt-3 mb-1" style={{ color: INK500 }}>
            {tt('program.resistances')}
          </p>
          <div className="flex flex-wrap gap-1">
            {RESISTANCES.map((id) => {
              const on = goal.resistances.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ resistances: on ? goal.resistances.filter((x) => x !== id) : [...goal.resistances, id] })}
                  className="rounded px-2 py-1 text-[11px]"
                  style={{ background: on ? 'var(--color-tomato-500)' : 'var(--color-paper-300)', color: on ? 'var(--color-paper-100)' : INK700 }}
                >
                  {variantInfo(id).label} <span className="opacity-75">{variantInfo(id).locus.name[language]}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {num('pg-ear', 'program.minEar', goal.minEar, (v) => set({ minEar: v }))}
            {num('pg-k', 'program.minKernel', goal.minKernel, (v) => set({ minKernel: v }))}
            {num('pg-h', 'program.maxHeight', goal.maxHeight, (v) => set({ maxHeight: v }), 10)}
            {num('pg-d', 'program.maxDays', goal.maxDays, (v) => set({ maxDays: v }))}
            {num('pg-y', 'program.minYieldGarden', goal.minYieldKg ? goal.minYieldKg * 1000 : undefined, (v) => set({ minYieldKg: v ? v / 1000 : undefined }), 10)}
            {num('pg-f', 'program.family', family, (v) => setFamily(Math.max(10, Math.min(200, v ?? 40))))}
            {num('pg-g', 'program.maxGen', maxGen, (v) => setMaxGen(Math.max(1, Math.min(20, v ?? 10))))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: INK500 }}>
            🌦 {tt('program.gardenNote')}
          </p>
          <button
            type="button"
            disabled={!a || goalIsEmpty(goal)}
            onClick={run}
            className="mt-4 w-full rounded px-4 py-2.5 text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--color-resin-500)', color: 'var(--color-ink-900)' }}
          >
            {a && goalIsEmpty(goal) ? tt('program.emptyGoal') : tt('program.run')}
          </button>

          {result && resultKey && (
            <div className="mt-4">
              <p className="text-xs leading-relaxed" style={{ color: result.goalReached && result.fixed ? 'var(--color-leaf-500)' : 'var(--color-bloom-500)' }}>
                {tt(resultKey, { gen: result.final.generation, n: result.totalGrown.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') })}{' '}
                {result.steps.length > 0 && <span style={{ color: INK500 }}>{tt('program.added')}</span>}
              </p>
              {result.steps.length > 0 && (
                <>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr style={{ color: INK500 }}>
                          <th className="py-1 pr-2 text-left font-normal">{tt('program.col.gen')}</th>
                          <th className="py-1 pr-2 text-left font-normal">{tt('program.col.step')}</th>
                          <th className="py-1 pr-2 text-left font-normal">{tt('program.col.conform')}</th>
                          <th className="py-1 pr-2 text-left font-normal">{tt('program.col.test')}</th>
                          <th className="py-1 text-left font-normal">{tt('program.col.het')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.steps.map((s, i) => (
                          <tr key={i} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }}>
                            <td className="py-1 pr-2 font-data">F{s.generation}</td>
                            <td className="py-1 pr-2">
                              <span className="inline-flex items-center gap-1.5">
                                <FruitDot appearance={engine.appearance(s.chosen)} size={9} />
                                {tt(s.kind === 'cross' ? 'program.step.cross' : 'program.step.self')}
                              </span>
                            </td>
                            <td className="py-1 pr-2 font-data">
                              {s.conforming}/{s.grown}
                            </td>
                            <td className="py-1 pr-2 font-data">{s.familyConformity != null ? `${Math.round(s.familyConformity * 100)} %` : '—'}</td>
                            <td className="py-1 font-data">{Math.round(s.heterozygosity * 100)} %</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
                    <FruitDot appearance={engine.appearance(result.final)} size={16} />
                    <span className="text-xs flex-1">{fruitSummary(engine, result.final, tt)}</span>
                    {result.fixed && result.goalReached && (
                      <button type="button" onClick={() => onSaveVariety(result.final)} className="rounded px-2.5 py-1 text-xs" style={{ background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' }}>
                        {tt('program.saveVariety')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Nutriments -----------------------------------------------------------------

const NUT_LABEL: Record<Nutrient, string> = { N: 'N', P2O5: 'P₂O₅', K2O: 'K₂O', CaO: 'CaO', MgO: 'MgO' };
const NUT_COLOR: Record<Nutrient, string> = {
  N: 'var(--color-leaf-500)',
  P2O5: 'var(--color-bloom-500)',
  K2O: 'var(--color-resin-500)',
  CaO: 'var(--color-paper-300)',
  MgO: 'var(--color-canopy-600)',
};
const APPETITE_COLOR = { light: 'var(--color-leaf-400)', moderate: 'var(--color-resin-400)', heavy: 'var(--color-tomato-400)' } as const;

export function MzNutrientPanel({ engine, ind }: { engine: MzEngine; ind: MzIndividual }) {
  const { tt, language } = useMzT();
  const plan = mzNutrientPlan(engine, ind);
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const max = Math.max(...NUTRIENTS.map((n) => plan.season[n]));
  const fmt = (v: number) => v.toLocaleString(locale, { maximumFractionDigits: 1 });

  return (
    <div className="text-xs" style={{ color: INK700 }}>
      <span className="rounded px-2 py-0.5 text-[11px] font-medium" style={{ background: APPETITE_COLOR[plan.appetite], color: 'var(--color-ink-900)' }}>
        {tt(`nut.appetite.${plan.appetite}` as MzKey)}
      </span>
      <p className="mt-2 text-[11px]" style={{ color: INK500 }}>
        {tt('nut.season', { kg: fmt(engine.yieldKg(ind)) })}
      </p>
      <div className="mt-1.5 space-y-1">
        {NUTRIENTS.map((n) => (
          <div key={n} className="grid grid-cols-[44px_1fr_60px] items-center gap-2">
            <span className="font-data text-[11px]">{NUT_LABEL[n]}</span>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--color-paper-300)' }}>
              <div className="h-full rounded-full" style={{ width: `${(plan.season[n] / max) * 100}%`, background: NUT_COLOR[n] }} />
            </div>
            <span className="text-right font-data text-[11px]">{fmt(plan.season[n])} g</span>
          </div>
        ))}
      </div>
      <p className="mt-2 leading-relaxed">{tt('nut.compost', { kg: plan.compostKg })}</p>
      <p className="mt-1 leading-relaxed">{tt('nut.generic', { g: plan.generic436G.toLocaleString(locale) })}</p>

      <p className="mt-3 text-[11px] uppercase tracking-wide" style={{ color: INK500 }}>
        {tt('nut.stages')}
      </p>
      <table className="mt-1 w-full text-[11px]">
        <thead>
          <tr style={{ color: INK500 }}>
            <th className="py-1 pr-2 text-left font-normal">{tt('nut.col.stage')}</th>
            <th className="py-1 pr-2 text-right font-normal">N</th>
            <th className="py-1 text-right font-normal">K₂O</th>
          </tr>
        </thead>
        <tbody>
          {plan.stages.map((st) => (
            <tr key={st.stage} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }}>
              <td className="py-1 pr-2">{tt(`nut.stage.${st.stage}` as MzKey)}</td>
              <td className="py-1 pr-2 text-right font-data">{fmt(st.nG)} g</td>
              <td className="py-1 text-right font-data">{fmt(st.k2oG)} g</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-2 space-y-1">
        {plan.tips.map((t) => (
          <li key={t} className="flex gap-2 leading-relaxed">
            <span style={{ color: 'var(--color-leaf-500)' }}>•</span>
            <span>{tt(`nut.tip.${t}` as MzKey)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] italic leading-relaxed" style={{ color: INK500 }}>
        {tt('nut.footer')}
      </p>
    </div>
  );
}

export function nutrientSummary(engine: MzEngine, ind: MzIndividual) {
  const p = mzNutrientPlan(engine, ind);
  return `${p.season.N} · ${p.season.K2O} g`;
}

// --- Mon jardin -----------------------------------------------------------------

const CLIMATE_IDS: ClimateId[] = ['oceanic', 'continental', 'mediterranean', 'mountain', 'tropical'];

export function GardenPanel({ garden, onChange }: { garden: GardenSettings; onChange: (g: GardenSettings) => void }) {
  const { tt } = useMzT();
  const toggle = (k: 'rust' | 'raceT' | 'irrigated') => onChange({ ...garden, [k]: !garden[k] });
  return (
    <div className="rounded px-4 py-3" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display text-base mr-1" style={{ color: 'var(--color-paper-100)' }}>
          🌦 {tt('garden.title')}
        </p>
        <select aria-label={tt('garden.climate')} value={garden.climate} onChange={(e) => onChange({ ...garden, climate: e.target.value as ClimateId })} className="rounded px-2 py-1 text-xs outline-none" style={inputStyle}>
          {CLIMATE_IDS.map((c) => (
            <option key={c} value={c}>
              {tt(`climate.${c}` as MzKey)}
            </option>
          ))}
        </select>
        {(
          [
            ['rust', 'garden.rust'],
            ['raceT', 'garden.raceT'],
            ['irrigated', 'garden.irrigated'],
          ] as const
        ).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            aria-pressed={garden[k]}
            onClick={() => toggle(k)}
            className="rounded px-2 py-1 text-[11px]"
            style={{ background: garden[k] ? 'var(--color-bloom-500)' : 'var(--color-canopy-800)', color: garden[k] ? 'var(--color-paper-100)' : 'var(--color-paper-300)' }}
          >
            {garden[k] ? '● ' : '○ '}
            {tt(lbl)}
          </button>
        ))}
      </div>
      <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
        {tt(`climate.${garden.climate}.desc` as MzKey)} {tt('garden.help')}
      </p>
    </div>
  );
}

const LOSS_ICON: Record<LossCause, string> = { nlb: '🟤', rust: '🟠', raceT: '☠', cool: '🌡', season: '❄', photoperiod: '🌗', drought: '🔥' };

export function GardenSheet({ engine, ind, garden }: { engine: MzEngine; ind: MzIndividual; garden: GardenSettings }) {
  const { tt, language } = useMzT();
  const out = gardenOutcome(engine, ind, garden);
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const pct = (x: number) => `${Math.round(x * 100)} %`;
  return (
    <div className="text-xs" style={{ color: INK700 }}>
      <p className="text-[11px]" style={{ color: INK500 }}>
        {tt(`climate.${garden.climate}` as MzKey)}
        {garden.rust ? ` · ${tt('garden.rust')}` : ''}
        {garden.raceT ? ` · ${tt('garden.raceT')}` : ''}
        {garden.irrigated ? '' : ` · ${tt('garden.dry')}`}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <div className="rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
          <p className="text-[10px]" style={{ color: INK500 }}>
            {tt('garden.potential')}
          </p>
          <p className="font-data text-sm">{formatKg(out.potentialKg, locale)}</p>
        </div>
        <div className="rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
          <p className="text-[10px]" style={{ color: INK500 }}>
            {tt('garden.realized')}
          </p>
          <p className="font-data text-sm" style={{ color: out.totalLoss > 0.35 ? 'var(--color-tomato-500)' : 'var(--color-leaf-500)' }}>
            {formatKg(out.realizedKg, locale)}
          </p>
        </div>
        <div className="rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
          <p className="text-[10px]" style={{ color: INK500 }}>
            {tt('garden.firstHarvest')}
          </p>
          <p className="font-data text-sm">
            {out.days} {tt('trait.daysUnit')}
          </p>
        </div>
        <div className="rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
          <p className="text-[10px]" style={{ color: INK500 }}>
            {tt('garden.perFruit')}
          </p>
          <p className="font-data text-sm">
            {engine.kernelsPerEar(ind)} × {ind.pheno.ears}
          </p>
        </div>
      </div>
      {out.losses.length > 0 && (
        <ul className="mt-2 space-y-1">
          {out.losses.map((l) => (
            <li key={l.cause} className="flex items-center gap-2">
              <span className="w-4 text-center">{LOSS_ICON[l.cause]}</span>
              <span className="flex-1">
                {tt(`loss.${l.cause}` as MzKey)}
                {l.gene && (
                  <span
                    className="ml-1.5 rounded px-1 py-0.5 font-data text-[10px]"
                    style={{ background: l.protectedBy ? (l.partial ? 'var(--color-resin-500)' : 'var(--color-leaf-500)') : 'var(--color-paper-300)', color: l.protectedBy ? 'var(--color-paper-100)' : INK500 }}
                    title={l.partial ? tt('garden.partialProt') : l.protectedBy ? tt('garden.protected') : tt('garden.unprotected')}
                  >
                    {variantInfo(l.gene).label} {l.protectedBy ? (l.partial ? '½' : '✓') : '✗'}
                  </span>
                )}
              </span>
              <span className="font-data" style={{ color: l.pct >= 0.2 ? 'var(--color-tomato-500)' : INK700 }}>
                −{pct(l.pct)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[10px] italic leading-relaxed" style={{ color: INK500 }}>
        {tt('garden.footer')}
      </p>
    </div>
  );
}
