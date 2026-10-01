import { useMemo, useState } from 'react';
import { SPECIES, SPECIES_BY_ID } from './data/species';
import { yearOf } from './engine/dates';
import { planCalendar, planSeason, planToPlants, wishesFromYear, type Note, type PlannedCrop } from './engine/planner';
import { fmtDate, fmtNum, monthName, speciesName } from './format';
import { useJT, type JKey } from './i18n';
import { uid, type Wish } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Empty, INK500, INK700, Meter, Notice, Select, TextInput, Why } from './ui';

function noteText(n: Note, tt: ReturnType<typeof useJT>['tt'], lang: 'fr' | 'en', kind: 'reason' | 'warn'): string {
  const vars: Record<string, string | number> = { ...(n.vars ?? {}) };
  for (const k of ['prev', 'other', 'before']) if (typeof vars[k] === 'string') vars[k] = speciesName(String(vars[k]), lang);
  if (typeof vars.until === 'string') vars.until = fmtDate(String(vars.until), lang);
  if (typeof vars.years === 'number') vars.years = fmtNum(vars.years, lang, 1);
  if (typeof vars.ph === 'number') vars.ph = fmtNum(vars.ph, lang, 1);
  return tt(`plan.${kind}.${n.code}` as JKey, vars);
}

/** Planificateur de la saison suivante (onglet Cultures). */
export function PlannerView() {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const thisYear = yearOf(today);
  const defaultYear = Number(today.slice(5, 7)) >= 8 ? thisYear + 1 : thisYear;
  const plan = data.plan ?? { year: defaultYear, wishes: [] };
  const setPlan = (p: typeof plan) => store.setPlan(p);
  const [pick, setPick] = useState('tomato');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const result = useMemo(() => planSeason(data, plan), [data, plan]);
  const kept = result.crops.filter((c) => !excluded.has(c.key));
  const calendar = useMemo(() => planCalendar({ ...result, crops: kept }), [result, kept]);
  const already = (c: PlannedCrop) => data.plants.some((p) => p.speciesId === c.speciesId && p.bedId === c.bedId && p.sowDate === c.sowDate);

  const setWish = (i: number, patch: Partial<Wish>) => setPlan({ ...plan, wishes: plan.wishes.map((w, k) => (k === i ? { ...w, ...patch } : w)) });
  const addWish = () => {
    if (plan.wishes.some((w) => w.speciesId === pick)) return;
    const sp = SPECIES_BY_ID[pick];
    setPlan({ ...plan, wishes: [...plan.wishes, { speciesId: pick, area: Math.max(0.5, Math.round(((sp.spacing.row * sp.spacing.inRow * 6) / 10000) * 10) / 10), sowings: 1 }] });
  };
  const fromLastYear = () => {
    const list = wishesFromYear(data, plan.year - 1);
    if (!list.length) return nav.toast(tt('plan.noLastYear'));
    const have = new Set(plan.wishes.map((w) => w.speciesId));
    setPlan({ ...plan, wishes: [...plan.wishes, ...list.filter((w) => !have.has(w.speciesId))] });
  };
  const apply = () => {
    const todo = kept.filter((c) => !already(c));
    if (!todo.length) return nav.toast(tt('plan.nothingNew'));
    if (!window.confirm(tt('plan.applyConfirm', { n: todo.length }))) return;
    store.addPlannedPlants(planToPlants({ ...result, crops: todo }, today, uid));
    nav.toast(tt('plan.applied', { n: todo.length }));
  };
  const byBed = data.beds.filter((b) => b.kind !== 'hydro').map((b) => ({ bed: b, crops: result.crops.filter((c) => c.bedId === b.id), usage: result.usage.find((u) => u.bedId === b.id) }));
  const speciesOptions = SPECIES.filter((s) => s.life !== 'perennial').sort((a, b) => a.name[lang].localeCompare(b.name[lang]));

  if (data.beds.length === 0) return <Empty>{tt('add.needBed')}</Empty>;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
        {tt('plan.lead')}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs">
          {tt('plan.year')}
          <span className="mt-1 block w-28">
            <Select value={String(plan.year)} onChange={(v) => setPlan({ ...plan, year: Number(v) })} options={[thisYear, thisYear + 1, thisYear + 2].map((y) => ({ v: String(y), l: String(y) }))} />
          </span>
        </label>
        <Button small kind="ghost" onClick={fromLastYear}>
          ↺ {tt('plan.fromLastYear', { year: plan.year - 1 })}
        </Button>
        {plan.wishes.length > 0 && (
          <Button small kind="ghost" onClick={() => window.confirm(tt('plan.clearConfirm')) && setPlan({ ...plan, wishes: [] })}>
            {tt('plan.clear')}
          </Button>
        )}
      </div>

      <section>
        <h3 className="mb-2 font-display text-base">🌱 {tt('plan.wishes')}</h3>
        {plan.wishes.length === 0 ? (
          <Empty>{tt('plan.noWish')}</Empty>
        ) : (
          <ul className="space-y-1.5">
            {plan.wishes.map((w, i) => (
              <li key={w.speciesId} className="flex flex-wrap items-center gap-2 rounded px-3 py-1.5 text-sm" style={{ background: 'var(--color-paper-200)' }}>
                <span className="min-w-[7rem] flex-1">
                  {SPECIES_BY_ID[w.speciesId]?.emoji} {speciesName(w.speciesId, lang)}
                </span>
                <label className="flex items-center gap-1 text-xs">
                  <span className="w-16">
                    <TextInput type="number" step={0.5} min={0} value={w.area} onChange={(v) => setWish(i, { area: Math.max(0, Number(v.replace(',', '.')) || 0) })} />
                  </span>
                  m²
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <span className="w-24">
                    <Select value={String(w.sowings)} onChange={(v) => setWish(i, { sowings: Number(v) })} options={[1, 2, 3, 4, 5, 6].map((n) => ({ v: String(n), l: n === 1 ? tt('plan.once') : tt('plan.sowingsN', { n }) }))} />
                  </span>
                </label>
                <button type="button" className="text-[11px] underline" style={{ color: INK500 }} onClick={() => setPlan({ ...plan, wishes: plan.wishes.filter((_, k) => k !== i) })} aria-label={tt('common.delete')}>
                  {tt('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="w-48">
            <Select value={pick} onChange={setPick} options={speciesOptions.map((s) => ({ v: s.id, l: `${s.emoji} ${s.name[lang]}` }))} />
          </span>
          <Button small kind="primary" onClick={addWish}>
            + {tt('plan.addWish')}
          </Button>
        </div>
      </section>

      {plan.wishes.length > 0 && (
        <>
          <section>
            <h3 className="mb-2 font-display text-base">🗺 {tt('plan.byBed')}</h3>
            {result.unplaced.length > 0 && (
              <div className="mb-2">
                <Notice tone="warn">{tt('plan.unplaced', { list: result.unplaced.map((u) => `${speciesName(u.speciesId, lang)} (${fmtNum(u.area, lang, 1)} m²)`).join(', ') })}</Notice>
              </div>
            )}
            <div className="space-y-3">
              {byBed.map(({ bed, crops, usage }) => (
                <div key={bed.id} className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
                  <div className="flex items-baseline justify-between gap-2">
                    <b>{bed.name}</b>
                    <span className="text-[11px]" style={{ color: INK500 }}>
                      {tt('plan.usage', { used: fmtNum(usage?.used ?? 0, lang, 1), area: fmtNum(usage?.area ?? 0, lang, 1) })}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Meter value={usage?.used ?? 0} max={usage?.area ?? 1} color="#6c9256" label={tt('plan.usageLabel')} />
                  </div>
                  {crops.length === 0 ? (
                    <p className="mt-1 text-xs" style={{ color: INK500 }}>
                      {tt('plan.bedFree')}
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {crops.map((c) => {
                        const off = excluded.has(c.key);
                        return (
                          <li key={c.key} className="text-sm" style={{ opacity: off ? 0.45 : 1 }}>
                            <div className="flex items-start justify-between gap-2">
                              <span>
                                {SPECIES_BY_ID[c.speciesId]?.emoji} <b>{speciesName(c.speciesId, lang)}</b>
                                {c.round ? ` · ${tt('plan.round', { n: c.round })}` : ''}
                                {c.role === 'catch' ? ` · ${tt('plan.catchLabel')}` : ''}
                                <span className="block text-xs" style={{ color: INK700 }}>
                                  {c.indoor ? tt('plan.datesIndoor', { sow: fmtDate(c.sowDate, lang), out: fmtDate(c.transplantDate ?? c.sowDate, lang) }) : tt('plan.datesDirect', { sow: fmtDate(c.sowDate, lang) })} · {fmtNum(c.area, lang, 1)} m² · {tt('plan.plants', { n: c.count })}
                                  {already(c) ? ` · ✓ ${tt('plan.inGarden')}` : ''}
                                </span>
                              </span>
                              <button
                                type="button"
                                className="shrink-0 text-[11px] underline"
                                style={{ color: INK500 }}
                                onClick={() =>
                                  setExcluded((s) => {
                                    const n = new Set(s);
                                    if (n.has(c.key)) n.delete(c.key);
                                    else n.add(c.key);
                                    return n;
                                  })
                                }
                              >
                                {off ? tt('plan.keep') : tt('plan.skip')}
                              </button>
                            </div>
                            {c.reasons.length > 0 && (
                              <p className="text-[11px]" style={{ color: '#4a7f36' }}>
                                ✓ {c.reasons.map((n) => noteText(n, tt, lang, 'reason')).join(' · ')}
                              </p>
                            )}
                            {c.warnings.length > 0 && (
                              <p className="text-[11px]" style={{ color: '#a5532f' }}>
                                ⚠ {c.warnings.map((n) => noteText(n, tt, lang, 'warn')).join(' · ')}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-display text-base">📅 {tt('plan.calendar')}</h3>
            <ul className="space-y-0.5 text-sm">
              {calendar.map((a, i) => {
                const newMonth = i === 0 || a.date.slice(0, 7) !== calendar[i - 1].date.slice(0, 7);
                return (
                  <li key={`${a.crop.key}-${a.kind}`}>
                    {newMonth && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-tomato-600)' }}>
                        {monthName(Number(a.date.slice(5, 7)), lang)} {a.date.slice(0, 4)}
                      </p>
                    )}
                    <span className="font-data text-xs" style={{ color: INK500 }}>
                      {fmtDate(a.date, lang)}
                    </span>{' '}
                    {tt(`plan.action.${a.kind}` as JKey, { crop: speciesName(a.crop.speciesId, lang), bed: data.beds.find((b) => b.id === a.crop.bedId)?.name ?? '' })}
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <Button kind="primary" onClick={apply}>
              {tt('plan.apply', { n: kept.filter((c) => !already(c)).length })}
            </Button>
            <span className="text-[11px]" style={{ color: INK500 }}>
              {tt('plan.applyHint')}
            </span>
          </div>
          <Why label={tt('common.why')}>
            <p>{tt('plan.why')}</p>
          </Why>
        </>
      )}
    </div>
  );
}
