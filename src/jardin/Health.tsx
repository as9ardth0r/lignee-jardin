import { useMemo, useState } from 'react';
import { CONTEXTS, ORGANS, PROBLEM_BY_ID, REMEDY_BY_ID, SIGNS, type Context, type Organ, type Remedy, type Sign } from './data/problems';
import { SPECIES_BY_ID } from './data/species';
import { diagnose } from './engine/diagnosis';
import { gddSince, timeline } from './engine/phenology';
import { recentContext } from './engine/weather';
import { fmtDate, fmtNum, plantTitle } from './format';
import { useJT, type JKey } from './i18n';
import type { Plant, StageId, TreatmentMethod } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Chip, Empty, INK500, INK700, Notice, Sheet, TextInput, Why } from './ui';

/** Méthode enregistrée au registre d'après le moyen d'action choisi. */
export function methodOf(r: Remedy): TreatmentMethod {
  if (r.isProduct) return 'product';
  if (r.category === 'barrier') return 'barrier';
  if (r.category === 'macro') return 'auxiliary';
  if (r.id === 'handpick' || r.id === 'remove') return 'manual';
  return 'cultural';
}

const CAT_COLOR: Record<Remedy['category'], string> = {
  cultural: '#6c9256',
  barrier: '#6c9256',
  macro: '#6c9256',
  biocontrol: '#c89b3c',
  lowRisk: '#c89b3c',
  organic: '#d9734e',
  pnpp: '#c89b3c',
};

// --- Stades observés et prévision par degrés-jours ----------------------------------

/** Stades que l'on peut noter (ceux qui servent au recalage). */
function observableStages(plant: Plant): StageId[] {
  const sp = SPECIES_BY_ID[plant.speciesId];
  const list = sp.stages.filter(([, d]) => d >= 10).map(([s]) => s);
  if (!list.includes('harvest')) list.push('harvest');
  return list;
}

export function PhenoPanel({ plant }: { plant: Plant }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [date, setDate] = useState(today);
  const tl = timeline(plant, data, today);
  const events = data.phenoEvents.filter((e) => e.plantId === plant.id).sort((a, b) => a.date.localeCompare(b.date));
  if (plant.status === 'planned') return null;
  return (
    <div className="mt-3 rounded px-3 py-2 text-xs leading-relaxed" style={{ background: 'var(--color-paper-200)', color: INK700 }}>
      <p>
        🌡 {tt('pheno.summary', { gdd: Math.round(gddSince(plant, data, today < plant.sowDate ? plant.sowDate : today)), eq: Math.round(tl.eqAge), age: Math.max(0, tl.age) })}
        {tl.nEvents > 0 ? ` · ${tt('pheno.factor', { f: fmtNum(tl.factor, lang, 2), n: tl.nEvents })}` : ''}
      </p>
      <p style={{ color: INK500 }}>{tl.measuredShare > 0 ? tt('pheno.measured', { pct: Math.round(tl.measuredShare * 100) }) : tt('pheno.normals')}</p>
      {plant.status === 'growing' && (
        <div className="mt-2">
          <p className="font-medium" style={{ color: 'var(--color-ink-900)' }}>
            {tt('pheno.record')}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="w-32">
              <TextInput type="date" value={date} onChange={(v) => v && setDate(v)} />
            </span>
            {observableStages(plant).map((s) => (
              <Chip
                key={s}
                active={events.some((e) => e.stage === s)}
                onClick={() => {
                  if (date < plant.sowDate || date > today) return nav.toast(tt('pheno.badDate'));
                  store.addPhenoEvent({ plantId: plant.id, stage: s, date });
                  nav.toast(tt('pheno.saved'));
                }}
              >
                {tt(`pheno.stage.${s}` as JKey)}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {events.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {events.map((e) => (
            <li key={e.id} className="flex justify-between gap-2">
              <span>
                ✓ {tt(`pheno.stage.${e.stage}` as JKey)} · {fmtDate(e.date, lang)}
              </span>
              <button type="button" className="underline" style={{ color: INK500 }} onClick={() => store.deletePhenoEvent(e.id)}>
                {tt('common.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Why label={tt('common.why')}>
        <p>{tt('pheno.why')}</p>
      </Why>
    </div>
  );
}

// --- Registre des interventions ----------------------------------------------------

export function TreatmentList({ plantId, bedId }: { plantId?: string; bedId?: string }) {
  const store = useGarden();
  const { tt, lang } = useJT();
  const list = store.data.treatments.filter((t) => (plantId ? t.plantId === plantId : t.bedId === bedId)).sort((a, b) => b.date.localeCompare(a.date));
  if (!list.length) return <Empty>{tt('treat.none')}</Empty>;
  return (
    <ul className="space-y-1.5">
      {list.map((t) => {
        const r = t.remedyId ? REMEDY_BY_ID[t.remedyId] : undefined;
        const pb = PROBLEM_BY_ID[t.problemId];
        return (
          <li key={t.id} className="flex items-start justify-between gap-2 rounded px-3 py-2 text-sm" style={{ background: 'var(--color-paper-200)' }}>
            <span>
              <b>{fmtDate(t.date, lang)}</b> · {r ? r.name[lang] : tt(`method.${t.method}` as JKey)}
              <span className="block text-xs" style={{ color: INK700 }}>
                {pb ? pb.name[lang] : t.problemId}
                {t.note ? ` — ${t.note}` : ''}
              </span>
            </span>
            <button type="button" onClick={() => window.confirm(tt('treat.deleteConfirm')) && store.deleteTreatment(t.id)} className="text-[11px] underline" style={{ color: INK500 }}>
              {tt('common.delete')}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// --- Diagnostic ----------------------------------------------------------------------

export function DiagnosisSheet({ plantId, bedId, onClose }: { plantId?: string; bedId?: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const plant = plantId ? data.plants.find((p) => p.id === plantId) : undefined;
  const sp = plant ? SPECIES_BY_ID[plant.speciesId] : undefined;
  const bed = data.beds.find((b) => b.id === (plant?.bedId ?? bedId));
  const initialContext = useMemo(() => {
    const c: Context[] = [];
    const r = recentContext(data.settings.weather ? data.weather : undefined, today);
    if (r) (['humid', 'hot', 'dry', 'cold'] as const).forEach((k) => r[k] && c.push(k));
    if (bed?.kind === 'greenhouse') c.push('greenhouse');
    return c;
    // Contexte proposé à l'ouverture seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [organ, setOrgan] = useState<Organ | undefined>();
  const [signs, setSigns] = useState<Sign[]>([]);
  const [context, setContext] = useState<Context[]>(initialContext);
  const [note, setNote] = useState('');
  const hyps = diagnose({ organ, signs, context, family: sp?.family });
  const toggleSign = (s: Sign) => setSigns((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]));
  const toggleCtx = (c: Context) => setContext((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]));

  const record = (problemId: string, r: Remedy) => {
    store.addTreatment({ plantId: plant?.id, bedId: bed?.id, problemId, method: methodOf(r), remedyId: r.id, date: today, note: note.trim() || undefined });
    nav.toast(tt('treat.saved'));
  };

  return (
    <Sheet title={`🔍 ${tt('diag.title')}${plant ? ` · ${plantTitle(plant, lang)}` : bed ? ` · ${bed.name}` : ''}`} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <Notice>{tt('diag.intro')}</Notice>
        <section>
          <h3 className="mb-1 text-sm font-semibold">1. {tt('diag.organ')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {ORGANS.map((o) => (
              <Chip key={o} active={organ === o} onClick={() => setOrgan(organ === o ? undefined : o)}>
                {tt(`organ.${o}` as JKey)}
              </Chip>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-1 text-sm font-semibold">2. {tt('diag.signs')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {SIGNS.map((s) => (
              <Chip key={s} active={signs.includes(s)} onClick={() => toggleSign(s)}>
                {tt(`sign.${s}` as JKey)}
              </Chip>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-1 text-sm font-semibold">3. {tt('diag.context')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {CONTEXTS.map((c) => (
              <Chip key={c} active={context.includes(c)} onClick={() => toggleCtx(c)}>
                {tt(`ctx.${c}` as JKey)}
              </Chip>
            ))}
          </div>
          {initialContext.length > 0 && (
            <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
              {tt('diag.contextAuto')}
            </p>
          )}
        </section>

        <section aria-live="polite">
          <h3 className="mb-2 font-display text-lg">{tt('diag.results')}</h3>
          {signs.length === 0 ? (
            <Empty>{tt('diag.pickSigns')}</Empty>
          ) : hyps.length === 0 ? (
            <Empty>{tt('diag.noMatch')}</Empty>
          ) : (
            <ol className="space-y-3">
              {hyps.map((h, i) => (
                <li key={h.problem.id} className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <b>
                      {i + 1}. {h.problem.name[lang]}
                    </b>
                    <span className="font-data text-xs" style={{ color: INK500 }}>
                      {tt(`problemKind.${h.problem.kind}` as JKey)} · {Math.round(h.confidence * 100)} %
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: INK700 }}>
                    {tt('diag.matched')} {h.matched.map((s) => tt(`sign.${s}` as JKey)).join(', ')}
                    {h.contextMatched.length > 0 && ` · ${tt('diag.ctxMatched')} ${h.contextMatched.map((c) => tt(`ctx.${c}` as JKey)).join(', ')}`}
                  </p>
                  {h.missing.length > 0 && (
                    <p className="text-xs" style={{ color: '#a5532f' }}>
                      {tt('diag.missing')} {h.missing.map((s) => tt(`sign.${s}` as JKey)).join(', ')}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm leading-snug">🔎 {h.problem.check[lang]}</p>
                  {h.problem.threshold && <p className="mt-1 text-xs leading-snug">⚖ {tt('diag.threshold')} {h.problem.threshold[lang]}</p>}
                  <ul className="mt-2 space-y-1.5">
                    {h.problem.remedies.map((rid) => {
                      const r = REMEDY_BY_ID[rid];
                      if (!r) return null;
                      return (
                        <li key={rid} className="flex items-start justify-between gap-2 text-sm">
                          <span>
                            <span className="mr-1 inline-block rounded px-1 text-[10px] font-semibold uppercase" style={{ background: CAT_COLOR[r.category], color: '#fff' }}>
                              {tt(`remedyCat.${r.category}` as JKey)}
                            </span>
                            <b>{r.name[lang]}</b>
                            <span className="block text-xs" style={{ color: INK700 }}>
                              {r.note[lang]}
                              {r.isProduct ? ` ${tt('diag.label')}` : ''}
                            </span>
                          </span>
                          <Button small kind="ghost" onClick={() => record(h.problem.id, r)}>
                            ✓ {tt('diag.done')}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
        {hyps.length > 0 && (
          <label className="block text-xs">
            {tt('diag.note')}
            <span className="mt-1 block">
              <TextInput value={note} onChange={setNote} placeholder={tt('diag.notePlaceholder')} />
            </span>
          </label>
        )}
        <Why label={tt('common.why')}>
          <p>{tt('diag.why')}</p>
          <p className="mt-1">{tt('diag.law')}</p>
        </Why>
      </div>
    </Sheet>
  );
}
