/**
 * Atelier général de sélection, pour toute espèce du catalogue : choisir
 * deux variétés de départ, croiser, semer, trier les plantes selon un
 * objectif, autoféconder ou recroiser, cloner, et garder les lignées
 * obtenues (importables au jardin comme celles des ateliers détaillés).
 */
import { useEffect, useMemo, useState } from 'react';
import { SPECIES_BY_ID } from '../../jardin/data/species';
import { COLOR_HEX, FLOWER_COLORS, type FlowerColor } from '../../jardin/data/flowers';
import { useJT, type JKey } from '../../jardin/i18n';
import { Button, Card, Chip, INK500, INK700, Notice } from '../../jardin/ui';
import { archetypes, clone, cross, homozygosity, isFixed, meetsGoal, mulberry32, plantFrom, profileOf, stats, type Archetype, type ColorTrait, type Goal, type Plant, type Profile, type QuantId, type QuantTrait } from './engine';

export interface SavedLine {
  name: string;
  date: string;
  gen: number;
  fixed: boolean;
  homo: number;
  pheno: Plant['pheno'];
  origin: string;
}
interface State {
  seed: number;
  a?: string;
  b?: string;
  pop: Plant[];
  selected: string[];
  seasons: number;
  history: Array<{ label: string; gen: number; n: number; seasons: number }>;
  goal: Goal;
  lines: SavedLine[];
  batch: number;
}

export const stateKey = (id: string) => `lignee.gen.${id}.v1`;
export const linesKey = (id: string) => `lignee.gen.${id}.myvarieties.v1`;

function load(id: string): State {
  try {
    const raw = window.localStorage.getItem(stateKey(id));
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (Array.isArray(s.pop)) return { ...{ batch: 16, goal: {}, lines: [], history: [], selected: [], seasons: 0 }, ...s };
    }
  } catch {
    /* stockage indisponible */
  }
  return { seed: Math.floor(Math.random() * 2 ** 31), pop: [], selected: [], seasons: 0, history: [], goal: {}, lines: [], batch: 16 };
}
function save(id: string, s: State) {
  try {
    window.localStorage.setItem(stateKey(id), JSON.stringify(s));
    // « Mes lignées », au format lu par l'import du jardin.
    window.localStorage.setItem(linesKey(id), JSON.stringify(s.lines.map((l) => ({ name: l.name, days: l.pheno.quant.earliness, notes: { fr: l.origin } }))));
  } catch {
    /* best-effort */
  }
}

/** Jour de l'année → « 15 août ». */
function doyLabel(doy: number, lang: 'fr' | 'en') {
  const d = new Date(Date.UTC(2025, 0, 1) + (((doy - 1) % 365) + 365) % 365 * 86400000);
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function useFmt() {
  const { tt, lang } = useJT();
  return (t: QuantTrait, v: number | undefined) => {
    if (v === undefined) return '—';
    if (t.unit === 'days') return tt('gen.unit.days', { n: Math.round(v) });
    if (t.unit === 'doy') return doyLabel(Math.round(v), lang);
    if (t.unit === 'kgm2') return tt('gen.unit.kgm2', { n: v.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 1 }) });
    if (t.unit === 'gm2') return tt('gen.unit.gm2', { n: v.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 1 }) });
    if (t.unit === 'cm') return tt('gen.unit.cm', { n: Math.round(v) });
    return tt('gen.unit.score', { n: v.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 1 }) });
  };
}

const quantLabel = (p: Profile, id: QuantId): JKey => {
  const t = p.traits.find((x): x is QuantTrait => x.kind === 'quant' && x.id === id);
  if (id === 'height' && t?.unit === 'score') return 'gen.trait.vigour';
  if (id === 'earliness') return p.species.type === 'flower' ? 'gen.trait.firstBloom' : t?.unit === 'doy' ? 'gen.trait.ripening' : 'gen.trait.earliness';
  return `gen.trait.${id}` as JKey;
};

function PlantCard({ p, pl, n, sel, goalOk, onToggle }: { p: Profile; pl: Plant; n: number; sel: boolean; goalOk: boolean; onToggle: () => void }) {
  const { tt } = useJT();
  const fmt = useFmt();
  const homo = homozygosity(pl.genotype);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={sel}
      className="flex w-full flex-col gap-1 rounded p-2 text-left text-xs transition-transform"
      style={{ background: sel ? '#f3ead3' : 'var(--color-paper-100)', boxShadow: sel ? 'inset 0 0 0 2px #7a5a1c' : goalOk ? 'inset 0 0 0 2px #4f8a3a' : 'inset 0 0 0 1px var(--color-paper-300)' }}
    >
      <span className="flex items-center justify-between gap-1">
        <b className="font-data">#{n}</b>
        <span className="flex items-center gap-1">
          {pl.pheno.color && <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: COLOR_HEX[pl.pheno.color], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25)' }} title={tt(`color.${pl.pheno.color}` as JKey)} />}
          {pl.pheno.resistant !== undefined && <span title={pl.pheno.resistant ? tt('gen.resistant') : tt('gen.susceptible')}>{pl.pheno.resistant ? '🛡' : '·'}</span>}
          {sel ? '✓' : goalOk ? '★' : ''}
        </span>
      </span>
      {p.traits
        .filter((t): t is QuantTrait => t.kind === 'quant')
        .map((t) => (
          <span key={t.id} className="flex justify-between gap-1" style={{ color: INK700 }}>
            <span>{tt(quantLabel(p, t.id))}</span>
            <span className="font-data">{fmt(t, pl.pheno.quant[t.id])}</span>
          </span>
        ))}
      <span className="mt-0.5 block h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-paper-300)' }} title={tt('gen.homo', { pct: Math.round(homo * 100) })}>
        <span className="block h-full" style={{ width: `${homo * 100}%`, background: homo >= 0.9 ? '#4f8a3a' : '#c9962e' }} />
      </span>
    </button>
  );
}

export default function GeneralAtelier({ speciesId }: { speciesId: string }) {
  const { tt, lang } = useJT();
  const fmt = useFmt();
  const sp = SPECIES_BY_ID[speciesId];
  const profile = useMemo(() => profileOf(sp), [sp]);
  const arch = useMemo(() => archetypes(profile), [profile]);
  const [s, setS] = useState<State>(() => load(speciesId));
  const [lineName, setLineName] = useState('');
  useEffect(() => save(speciesId, s), [speciesId, s]);
  const rng = useMemo(() => mulberry32(s.seed + s.history.length * 7919 + s.pop.length), [s.seed, s.history.length, s.pop.length]);
  const archById = (id?: string) => arch.find((a) => a.id === id);
  const A = archById(s.a);
  const B = archById(s.b);
  const selected = s.pop.filter((pl) => s.selected.includes(pl.id));
  const color = profile.traits.find((t): t is ColorTrait => t.kind === 'color');
  const quants = profile.traits.filter((t): t is QuantTrait => t.kind === 'quant');
  const goalCount = s.pop.filter((pl) => meetsGoal(pl, s.goal)).length;
  const goalSet = Object.values(s.goal).some((v) => v !== undefined && v !== false && v !== '');

  const step = (label: string, pop: Plant[], seasons: number) =>
    setS((x) => ({ ...x, pop, selected: [], seasons: x.seasons + seasons, history: [...x.history, { label, gen: pop[0]?.gen ?? 0, n: pop.length, seasons: x.seasons + seasons }] }));

  const start = () => {
    if (!A || !B) return;
    const a = plantFrom(profile, A, rng);
    const b = plantFrom(profile, B, rng);
    if (!profile.sexual) {
      step(tt('gen.h.plantAB', { a: A.name[lang], b: B.name[lang] }), [...clone(profile, a, Math.ceil(s.batch / 2), rng), ...clone(profile, b, Math.floor(s.batch / 2), rng)], profile.seasonsPerClone);
      return;
    }
    step(`${A.name[lang]} × ${B.name[lang]}`, cross(profile, a, b, s.batch, rng, 'F1'), profile.seasonsPerGen);
  };
  const sowOne = (ar: Archetype) => step(tt('gen.h.sow', { a: ar.name[lang] }), Array.from({ length: s.batch }, () => plantFrom(profile, ar, rng)), profile.seasonsPerGen);
  const selfSel = () => {
    const per = Math.max(2, Math.ceil(s.batch / selected.length));
    step(tt('gen.h.self', { n: selected.length }), selected.flatMap((pl) => cross(profile, pl, pl, per, rng, 'self')), profile.seasonsPerGen);
  };
  const interSel = () => {
    const kids: Plant[] = [];
    for (let i = 0; i < s.batch; i++) {
      const a = selected[Math.floor(rng() * selected.length)];
      let b = selected[Math.floor(rng() * selected.length)];
      if (b.id === a.id && selected.length > 1) b = selected[(selected.indexOf(a) + 1) % selected.length];
      kids.push(...cross(profile, a, b, 1, rng, 'inter'));
    }
    step(tt('gen.h.inter', { n: selected.length }), kids, profile.seasonsPerGen);
  };
  const backcross = (ar: Archetype) => {
    const per = Math.max(2, Math.ceil(s.batch / selected.length));
    step(tt('gen.h.back', { a: ar.name[lang] }), selected.flatMap((pl) => cross(profile, pl, plantFrom(profile, ar, rng), per, rng, 'back')), profile.seasonsPerGen);
  };
  const cloneSel = () => {
    const per = Math.max(1, Math.ceil(s.batch / selected.length));
    step(tt('gen.h.clone', { n: selected.length }), selected.flatMap((pl) => clone(profile, pl, per, rng)), profile.seasonsPerClone);
  };
  const keepLine = () => {
    const pl = selected[0];
    if (!pl || !lineName.trim()) return;
    const line: SavedLine = { name: lineName.trim(), date: new Date().toISOString().slice(0, 10), gen: pl.gen, fixed: isFixed(pl), homo: homozygosity(pl.genotype), pheno: pl.pheno, origin: `${sp.name.fr} · ${s.history[0]?.label ?? ''} · F${pl.gen}` };
    setS((x) => ({ ...x, lines: [...x.lines.filter((l) => l.name !== line.name), line] }));
    setLineName('');
  };
  const restart = () => {
    if (s.pop.length && !window.confirm(tt('gen.restartConfirm'))) return;
    setS((x) => ({ ...x, seed: Math.floor(Math.random() * 2 ** 31), pop: [], selected: [], seasons: 0, history: [] }));
  };
  const toggle = (id: string) => setS((x) => ({ ...x, selected: x.selected.includes(id) ? x.selected.filter((y) => y !== id) : [...x.selected, id] }));
  const setGoal = (g: Partial<Goal>) => setS((x) => ({ ...x, goal: { ...x.goal, ...g } }));
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')));
  const inputStyle = { background: 'var(--color-paper-100)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' };
  const goalField = (label: string, value: number | undefined, on: (v: number | undefined) => void) => (
    <label className="block text-xs">
      <span className="mb-0.5 block" style={{ color: INK700 }}>
        {label}
      </span>
      <input defaultValue={value ?? ''} onBlur={(e) => on(num(e.target.value))} inputMode="decimal" className="field w-full rounded px-2 py-1 font-data text-sm outline-none" style={inputStyle} />
    </label>
  );
  const pollKey: Record<Profile['pollination'], JKey> = { self: 'gen.poll.self', insect: 'gen.poll.insect', wind: 'gen.poll.wind', vegetative: 'gen.poll.vegetative' };

  return (
    <div className="mx-auto max-w-3xl space-y-3 px-3 py-4">
      <Card title={`${sp.emoji} ${tt('gen.title', { name: sp.name[lang] })}`}>
        <p className="text-xs italic" style={{ color: INK500 }}>
          {sp.latin}
        </p>
        <ul className="mt-2 space-y-0.5 text-xs leading-relaxed" style={{ color: INK700 }}>
          <li>🌼 {tt(pollKey[profile.pollination])}</li>
          <li>⏳ {tt('gen.genTime', { n: profile.seasonsPerGen })}</li>
          {!profile.sexual && <li>✂ {tt('gen.sterile')}</li>}
          {profile.clonable && profile.sexual && <li>✂ {tt('gen.clonable', { n: profile.seasonsPerClone })}</li>}
          <li>🧬 {tt('gen.traits', { list: [...quants.map((t) => tt(quantLabel(profile, t.id))), ...(color ? [tt('gen.trait.color')] : []), tt('gen.trait.resist', { disease: (profile.traits.find((t) => t.kind === 'resist') as { disease: { fr: string; en: string } }).disease[lang] })].join(', ') })}</li>
        </ul>
        <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('gen.model')}
        </p>
      </Card>

      {s.pop.length === 0 ? (
        <Card title={`1. ${tt('gen.parents')}`}>
          <p className="mb-2 text-xs leading-relaxed" style={{ color: INK700 }}>
            {tt(profile.sexual ? 'gen.parentsLead' : 'gen.parentsLeadClone')}
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {arch.map((ar) => {
              const pl = plantFrom(profile, ar, mulberry32(ar.id.length * 131 + s.seed));
              const isA = s.a === ar.id;
              const isB = s.b === ar.id;
              return (
                <li key={ar.id} className="rounded p-2.5" style={{ background: 'var(--color-paper-200)', boxShadow: isA || isB ? 'inset 0 0 0 2px #7a5a1c' : undefined }}>
                  <p className="flex items-center justify-between gap-2 text-sm font-medium">
                    <span>
                      {pl.pheno.color && <span className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle" style={{ background: COLOR_HEX[pl.pheno.color], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25)' }} />}
                      {ar.name[lang]}
                    </span>
                    {pl.pheno.resistant && <span title={tt('gen.resistant')}>🛡</span>}
                  </p>
                  <p className="text-[11px]" style={{ color: INK700 }}>
                    {quants.map((t) => `${tt(quantLabel(profile, t.id))} ${fmt(t, pl.pheno.quant[t.id])}`).join(' · ')}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Chip active={isA} onClick={() => setS((x) => ({ ...x, a: ar.id }))}>
                      A
                    </Chip>
                    <Chip active={isB} onClick={() => setS((x) => ({ ...x, b: ar.id }))}>
                      B
                    </Chip>
                    <Button small kind="ghost" onClick={() => sowOne(ar)}>
                      {tt('gen.sowOnly')}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button kind="primary" disabled={!A || !B || s.a === s.b} onClick={start}>
              {profile.sexual ? tt('gen.crossAB', { n: s.batch }) : tt('gen.plantAB')}
            </Button>
            <BatchPicker value={s.batch} onChange={(b) => setS((x) => ({ ...x, batch: b }))} />
          </div>
        </Card>
      ) : (
        <>
          <Card title={`2. ${tt('gen.pop', { gen: s.pop[0]?.gen ?? 0, n: s.pop.length })}`} action={<Button small kind="ghost" onClick={restart}>↺ {tt('gen.restart')}</Button>}>
            <p className="mb-2 text-xs" style={{ color: INK700 }}>
              {tt('gen.time', { seasons: s.seasons })} · {tt('gen.selectHint')}
            </p>
            <details className="mb-2 rounded p-2" style={{ background: 'var(--color-paper-200)' }} open={!goalSet}>
              <summary className="cursor-pointer text-sm font-medium">
                🎯 {tt('gen.goal')} {goalSet ? `· ${tt('gen.goalCount', { n: goalCount, total: s.pop.length })}` : ''}
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quants.some((t) => t.id === 'earliness' && t.unit === 'days') && goalField(tt(profile.species.type === 'flower' ? 'gen.goal.firstBloom' : 'gen.goal.earliness'), s.goal.earlinessMax, (v) => setGoal({ earlinessMax: v }))}
                {quants.some((t) => t.id === 'yield' && t.unit === 'kgm2') && goalField(tt('gen.goal.yield'), s.goal.yieldMin, (v) => setGoal({ yieldMin: v }))}
                {quants.some((t) => t.id === 'abundance') && goalField(tt('gen.goal.abundance'), s.goal.abundanceMin, (v) => setGoal({ abundanceMin: v }))}
                {quants.some((t) => t.id === 'height') && goalField(tt(quants.find((t) => t.id === 'height')!.unit === 'cm' ? 'gen.goal.heightMin' : 'gen.goal.vigourMin'), s.goal.heightMin, (v) => setGoal({ heightMin: v }))}
                {quants.some((t) => t.id === 'height' && t.unit === 'cm') && goalField(tt('gen.goal.heightMax'), s.goal.heightMax, (v) => setGoal({ heightMax: v }))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {color && (
                  <>
                    <Chip active={!s.goal.color} onClick={() => setGoal({ color: undefined })}>
                      {tt('flowerGroup.anyColor')}
                    </Chip>
                    {FLOWER_COLORS.filter((c) => color.hues.includes(c) || (c === 'white' && color.white)).map((c: FlowerColor) => (
                      <Chip key={c} active={s.goal.color === c} onClick={() => setGoal({ color: c })}>
                        <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: COLOR_HEX[c] }} />
                        {tt(`color.${c}` as JKey)}
                      </Chip>
                    ))}
                  </>
                )}
                <Chip active={Boolean(s.goal.resistant)} onClick={() => setGoal({ resistant: !s.goal.resistant })}>
                  🛡 {tt('gen.goal.resistant')}
                </Chip>
              </div>
            </details>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {s.pop.map((pl, i) => (
                <li key={pl.id}>
                  <PlantCard p={profile} pl={pl} n={i + 1} sel={s.selected.includes(pl.id)} goalOk={goalSet && meetsGoal(pl, s.goal)} onToggle={() => toggle(pl.id)} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: INK500 }}>
              {quants
                .map((t) => {
                  const st = stats(s.pop, t.id);
                  return st ? `${tt(quantLabel(profile, t.id))} ${fmt(t, st.mean)} ± ${t.unit === 'doy' ? tt('gen.unit.days', { n: Math.round(st.sd) }) : fmt(t, st.sd).replace(/\/10$/, '')}` : '';
                })
                .filter(Boolean)
                .join(' · ')}
              {' · '}
              {tt('gen.legend')}
            </p>
          </Card>

          <Card title={`3. ${tt('gen.actions', { n: selected.length })}`}>
            {selected.length === 0 ? (
              <p className="text-sm" style={{ color: INK700 }}>
                {tt('gen.pickFirst')}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {profile.sexual && (
                    <Button kind="primary" small onClick={selfSel}>
                      🔁 {tt('gen.self')}
                    </Button>
                  )}
                  {profile.sexual && selected.length >= 2 && (
                    <Button small kind="primary" onClick={interSel}>
                      ✖ {tt('gen.inter')}
                    </Button>
                  )}
                  {profile.sexual && A && (
                    <Button small kind="ghost" onClick={() => backcross(A)}>
                      ↩ {tt('gen.back', { a: A.name[lang] })}
                    </Button>
                  )}
                  {profile.sexual && B && (
                    <Button small kind="ghost" onClick={() => backcross(B)}>
                      ↩ {tt('gen.back', { a: B.name[lang] })}
                    </Button>
                  )}
                  {(profile.clonable || !profile.sexual) && (
                    <Button small kind={profile.sexual ? 'ghost' : 'primary'} onClick={cloneSel}>
                      ✂ {tt('gen.clone')}
                    </Button>
                  )}
                  <BatchPicker value={s.batch} onChange={(b) => setS((x) => ({ ...x, batch: b }))} />
                </div>
                {profile.sexual && profile.pollination !== 'self' && (
                  <div className="mt-2">
                    <Notice tone="warn">{tt('gen.depressionWarn')}</Notice>
                  </div>
                )}
                {selected.length === 1 && (
                  <div className="mt-3 rounded p-2.5" style={{ background: 'var(--color-paper-200)' }}>
                    <p className="text-sm font-medium">{isFixed(selected[0]) ? `✓ ${tt('gen.fixed')}` : tt('gen.notFixed', { pct: Math.round(homozygosity(selected[0].genotype) * 100) })}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input value={lineName} onChange={(e) => setLineName(e.target.value)} placeholder={tt('gen.lineName')} aria-label={tt('gen.lineName')} className="field min-w-0 flex-1 rounded px-2 py-1.5 text-sm outline-none" style={inputStyle} />
                      <Button small kind="primary" disabled={!lineName.trim()} onClick={keepLine}>
                        ☆ {tt('gen.keep')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}

      {s.history.length > 0 && (
        <Card title={`📜 ${tt('gen.history')}`}>
          <ol className="list-decimal space-y-0.5 pl-5 text-xs" style={{ color: INK700 }}>
            {s.history.map((h, i) => (
              <li key={i}>
                {h.label} → F{h.gen} ({h.n}) · {tt('gen.time', { seasons: h.seasons })}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card title={`☆ ${tt('gen.lines', { n: s.lines.length })}`}>
        {s.lines.length === 0 ? (
          <p className="text-sm" style={{ color: INK500 }}>
            {tt('gen.linesNone')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {s.lines.map((l) => (
              <li key={l.name} className="rounded px-2.5 py-2 text-xs" style={{ background: 'var(--color-paper-200)' }}>
                <p className="flex items-center justify-between gap-2 text-sm font-medium">
                  <span>
                    {l.pheno.color && <span className="mr-1.5 inline-block h-3 w-3 rounded-full align-middle" style={{ background: COLOR_HEX[l.pheno.color] }} />}
                    {l.name}
                  </span>
                  <span className="text-[11px] font-normal" style={{ color: l.fixed ? '#2f6a2a' : '#7a4a10' }}>
                    {l.fixed ? tt('gen.fixedShort') : tt('gen.notFixedShort', { pct: Math.round(l.homo * 100) })}
                  </span>
                </p>
                <p style={{ color: INK700 }}>
                  F{l.gen} · {quants.map((t) => `${tt(quantLabel(profile, t.id))} ${fmt(t, l.pheno.quant[t.id])}`).join(' · ')}
                  {l.pheno.resistant ? ` · 🛡 ${tt('gen.resistant')}` : ''}
                </p>
                <button type="button" className="mt-1 underline" style={{ color: INK500 }} onClick={() => window.confirm(tt('gen.deleteLine', { name: l.name })) && setS((x) => ({ ...x, lines: x.lines.filter((y) => y.name !== l.name) }))}>
                  {tt('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('gen.linesNote')}
        </p>
      </Card>
    </div>
  );
}

function BatchPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { tt } = useJT();
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: INK700 }}>
      {tt('gen.batch')}
      {[8, 16, 32].map((n) => (
        <Chip key={n} active={value === n} onClick={() => onChange(n)}>
          {n}
        </Chip>
      ))}
    </span>
  );
}
