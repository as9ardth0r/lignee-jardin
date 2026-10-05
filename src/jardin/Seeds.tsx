import { GnisInfo, GnisSuggest, useGnis } from './Gnis';
import { findVariety } from './engine/gnis';
import { useMemo, useState } from 'react';
import { forecast, forecastByMonth, multiYear } from './engine/report';
import { bedResults, cutFlowers, plantResults, seasonReview, wishesFromReview, type PlantResult } from './engine/bilan';
import { toCSV } from './engine/backup';
import { monthName, plantTitle } from './format';
import { saveFile } from '../utils/download';
import { SPECIES, SPECIES_BY_ID } from './data/species';
import { SPECIES_EXTRA } from './data/speciesExtra';
import { yearOf } from './engine/dates';
import { germRate, seasonSummary, seedsFor, seedState, type SeedState } from './engine/season';
import { seedLevel } from './engine/stock';
import { fmtDate, fmtG, fmtNum, speciesName } from './format';
import { useJT, type JKey } from './i18n';
import { uid, type SeedLot } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Empty, Field, INK500, INK700, Notice, Select, Sheet, TextInput, Why } from './ui';

const STATE_COLOR: Record<SeedState, string> = { ok: '#4a7f36', lastYear: '#b07a1a', old: '#a5532f' };

/** Stock de graines, classé par espèce. */
export function SeedsPanel() {
  const gnis = useGnis();
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const lots = [...data.seeds].sort((a, b) => speciesName(a.speciesId, lang).localeCompare(speciesName(b.speciesId, lang)) || b.year - a.year);
  const toTest = lots.filter((l) => seedState(l, today).state !== 'ok').length;
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm" style={{ color: INK700 }}>
          {tt('seeds.count', { n: lots.length })}
          {toTest > 0 && ` · ${tt('seeds.toTest', { n: toTest })}`}
        </p>
        <div className="flex flex-wrap justify-end gap-1.5">
          {lots.length > 0 && (
            <Button
              small
              kind="ghost"
              onClick={async () => {
                try {
                  const { buildSeedLabelsPdf } = await import('./labelsPdf');
                  await saveFile(`lignee-jardin-etiquettes-graines.pdf`, await buildSeedLabelsPdf(data, lots, lang), 'application/pdf');
                } catch {
                  nav.toast(tt('report.error'));
                }
              }}
            >
              🏷 {tt('seeds.labels')}
            </Button>
          )}
          <Button small kind="primary" onClick={() => nav.open({ type: 'seed' })}>
            + {tt('seeds.add')}
          </Button>
        </div>
      </div>
      <div className="mt-3">
        {lots.length === 0 ? (
          <Empty>{tt('seeds.none')}</Empty>
        ) : (
          <ul className="space-y-1.5">
            {lots.map((l) => {
              const st = seedState(l, today);
              const sp = SPECIES_BY_ID[l.speciesId];
              return (
                <li key={l.id}>
                  <button type="button" onClick={() => nav.open({ type: 'seed', id: l.id })} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                    <span className="text-2xl" aria-hidden="true">
                      {sp?.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {sp?.name[lang]}
                        {l.varietyName ? ` « ${l.varietyName} »` : ''}
                        {gnis && findVariety(gnis, l.speciesId, l.varietyName)?.hybrid ? (
                          <span className="ml-1.5 rounded-full px-1.5 py-0.5 align-middle text-[10px] font-normal" style={{ background: '#f6e3c8', color: '#7a4a10' }} title={tt('gnis.hybridSeeds')}>
                            F1
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-[11px]" style={{ color: INK500 }}>
                        {l.year}
                        {l.quantity ? ` · ${l.quantity}` : ''}
                        {l.seeds !== undefined ? ` · ${tt('seeds.left', { n: seedLevel(l, data.plants).remaining ?? 0 })}` : ''}
                        {l.germRate !== undefined ? ` · ${tt('seeds.germV', { pct: Math.round(l.germRate * 100) })}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: STATE_COLOR[st.state], color: '#fff' }}>
                      {tt(`seeds.state.${st.state}` as JKey)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('seeds.note')}
      </p>
    </div>
  );
}

export function SeedSheet({ id, speciesId, onClose }: { id?: string; speciesId?: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const editing = id ? data.seeds.find((s) => s.id === id) : undefined;
  const [sp, setSp] = useState(editing?.speciesId ?? speciesId ?? 'tomato');
  const [variety, setVariety] = useState(editing?.varietyName ?? '');
  const [year, setYear] = useState(String(editing?.year ?? yearOf(today)));
  const [quantity, setQuantity] = useState(editing?.quantity ?? '');
  const [count, setCount] = useState(editing?.seeds !== undefined ? String(editing.seeds) : '');
  const [source, setSource] = useState(editing?.source ?? '');
  const [sown, setSown] = useState('');
  const [up, setUp] = useState('');
  const extra = SPECIES_EXTRA[sp];
  const draft: SeedLot = {
    id: editing?.id ?? uid('sd'),
    speciesId: sp,
    varietyName: variety.trim() || undefined,
    year: Math.max(1990, Math.min(yearOf(today) + 1, Math.round(Number(year)) || yearOf(today))),
    quantity: quantity.trim() || undefined,
    seeds: Number(count) > 0 ? Math.round(Number(count)) : undefined,
    source: source.trim() || undefined,
    germRate: editing?.germRate,
    germTested: editing?.germTested,
  };
  const st = seedState(draft, today);
  const testRate = Number(sown) > 0 && up !== '' ? germRate(Number(sown), Number(up)) : null;

  const save = () => {
    const lot = testRate !== null ? { ...draft, germRate: testRate, germTested: today } : draft;
    store.saveSeed(lot);
    nav.toast(tt('seeds.saved'));
    onClose();
  };

  return (
    <Sheet title={editing ? tt('seeds.editTitle') : tt('seeds.addTitle')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('add.species')}>
            {(fid) => (
              <Select
                id={fid}
                value={sp}
                onChange={setSp}
                options={[...SPECIES].sort((a, b) => a.name[lang].localeCompare(b.name[lang])).map((s) => ({ v: s.id, l: `${s.emoji} ${s.name[lang]}` }))}
              />
            )}
          </Field>
          <Field label={tt('add.variety')}>{(fid) => <TextInput id={fid} value={variety} onChange={setVariety} placeholder={tt('add.varietyPlaceholder')} />}</Field>
          <GnisSuggest speciesId={sp} value={variety} onPick={setVariety} />
          <GnisInfo speciesId={sp} name={variety} seeds />
          <Field label={tt('seeds.year')} hint={tt('seeds.yearHint')}>
            {(fid) => <TextInput id={fid} type="number" value={year} onChange={setYear} />}
          </Field>
          <Field label={tt('seeds.seedCount')} hint={editing && editing.seeds !== undefined ? tt('seeds.countHint', { used: seedLevel(editing, data.plants).used, reserved: seedLevel(editing, data.plants).reserved }) : tt('seeds.countHintNew')}>
            {(fid) => <TextInput id={fid} type="number" min={0} value={count} onChange={setCount} />}
          </Field>
          <Field label={tt('seeds.quantity')}>{(fid) => <TextInput id={fid} value={quantity} onChange={setQuantity} placeholder={tt('seeds.quantityPlaceholder')} />}</Field>
          <Field label={tt('seeds.source')}>{(fid) => <TextInput id={fid} value={source} onChange={setSource} placeholder={tt('seeds.sourcePlaceholder')} />}</Field>
        </div>

        <Notice tone={st.state === 'ok' ? 'good' : 'warn'}>
          <b>{tt(`seeds.state.${st.state}` as JKey)}</b> — {tt('seeds.lifeV', { life: st.life, age: Math.max(0, st.ageYears) })}
          {draft.germRate !== undefined && draft.germTested ? ` ${tt('seeds.lastTest', { pct: Math.round(draft.germRate * 100), date: fmtDate(draft.germTested, lang) })}` : ''}
          {draft.germRate !== undefined ? ` ${tt('seeds.sowMore', { n: seedsFor(10, draft.germRate) })}` : ''}
        </Notice>

        <section>
          <h3 className="mb-1 text-sm font-semibold">🧪 {tt('seeds.test')}</h3>
          <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
            {tt('seeds.testHow')}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Field label={tt('seeds.sown')}>{(fid) => <TextInput id={fid} type="number" min={1} value={sown} onChange={setSown} placeholder="20" />}</Field>
            <Field label={tt('seeds.up')}>{(fid) => <TextInput id={fid} type="number" min={0} value={up} onChange={setUp} />}</Field>
          </div>
          {testRate !== null && (
            <p className="mt-1 text-sm">
              {tt('seeds.testResult', { pct: Math.round(testRate * 100) })} {tt('seeds.sowMore', { n: seedsFor(10, testRate) })}
            </p>
          )}
        </section>

        {extra && (
          <Why label={tt('seeds.saving')}>
            <p>{tt('seeds.savingV', { poll: tt(`pollination.${extra.pollination}` as JKey), m: extra.isolation, life: extra.seedLife })}</p>
          </Why>
        )}

        <div className="flex flex-wrap justify-between gap-2">
          {editing ? (
            <Button
              kind="danger"
              small
              onClick={() => {
                if (window.confirm(tt('seeds.deleteConfirm'))) {
                  store.deleteSeed(editing.id);
                  onClose();
                }
              }}
            >
              {tt('common.delete')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button kind="ghost" onClick={onClose}>
              {tt('common.cancel')}
            </Button>
            <Button kind="primary" onClick={save}>
              {tt('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** Bilan de saison : récoltes pesées, valeur au prix du marché, intrants. */
export function SeasonView() {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const years = [...new Set([yearOf(today), ...data.observations.filter((o) => o.harvestG || o.stems).map((o) => yearOf(o.date))])].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0]);
  const sum = seasonSummary(data, year);
  const eur = (v: number) => `${fmtNum(v, lang, v < 100 ? 2 : 0)} €`;
  return (
    <div>
      {years.length > 1 && (
        <div className="mb-2 w-32">
          <Select value={String(year)} onChange={(v) => setYear(Number(v))} options={years.map((y) => ({ v: String(y), l: String(y) }))} />
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          [tt('season.harvested'), fmtG(sum.grams, lang)],
          [tt('season.value'), eur(sum.value)],
          [tt('season.inputs'), eur(sum.inputsCost)],
        ].map(([k, v]) => (
          <div key={k} className="rounded px-2 py-2" style={{ background: 'var(--color-paper-200)' }}>
            <span className="block text-[11px]" style={{ color: INK500 }}>
              {k}
            </span>
            <span className="block font-data text-base font-semibold">{v}</span>
          </div>
        ))}
      </div>
      {sum.rows.length === 0 ? (
        <div className="mt-3">
          <Empty>{tt('season.none')}</Empty>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: INK500 }}>
                <th className="py-1 pr-2 text-left font-normal">{tt('season.col.crop')}</th>
                <th className="py-1 pr-2 text-right font-normal">{tt('season.col.weight')}</th>
                <th className="py-1 pr-2 text-right font-normal">{tt('season.col.perM2')}</th>
                <th className="py-1 pr-2 text-right font-normal">{tt('season.col.price')}</th>
                <th className="py-1 text-right font-normal">{tt('season.col.value')}</th>
              </tr>
            </thead>
            <tbody>
              {sum.rows.map((r) => (
                <tr key={r.speciesId} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }}>
                  <td className="py-1 pr-2">
                    {SPECIES_BY_ID[r.speciesId]?.emoji} {speciesName(r.speciesId, lang)}
                  </td>
                  <td className="py-1 pr-2 text-right font-data">{fmtG(r.grams, lang)}</td>
                  <td className="py-1 pr-2 text-right font-data">{r.area > 0 ? `${fmtNum(r.grams / 1000 / r.area, lang, 1)} kg` : '—'}</td>
                  <td className="py-1 pr-2 text-right">
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      defaultValue={r.priceKg}
                      aria-label={tt('season.priceFor', { crop: speciesName(r.speciesId, lang) })}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        store.setPrice(r.speciesId, v > 0 ? v : undefined);
                      }}
                      className="field w-16 rounded px-1 py-0.5 text-right font-data text-sm outline-none"
                      style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }}
                    />
                  </td>
                  <td className="py-1 text-right font-data">{eur(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('season.note')}
      </p>
      <SeasonReviewPanel year={year} />
      <ForecastPanel />
      <ProExports year={year} />
    </div>
  );
}

/** Fin de saison : fleurs coupées, résultats par planche, ce qui a marché et ce qui est à revoir. */
function SeasonReviewPanel({ year }: { year: number }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const flowers = useMemo(() => cutFlowers(data, year), [data, year]);
  const results = useMemo(() => plantResults(data, year, today), [data, year, today]);
  const beds = useMemo(() => bedResults(data, year, today, results), [data, year, today, results]);
  const review = seasonReview(results);
  const pct = (r: number) => `${Math.round(r * 100)} %`;
  const resultLine = (r: PlantResult) => (
    <li key={r.plant.id}>
      <button type="button" className="w-full rounded px-2 py-1.5 text-left text-sm" style={{ background: 'var(--color-paper-200)' }} onClick={() => nav.open({ type: 'plant', id: r.plant.id })}>
        <span className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate">
            {SPECIES_BY_ID[r.plant.speciesId]?.emoji} {plantTitle(r.plant, lang)} <span style={{ color: INK500 }}>· {data.beds.find((b) => b.id === r.plant.bedId)?.name}</span>
          </span>
          <span className="shrink-0 font-data text-xs">{r.harvestedKg > 0 ? `${fmtNum(r.harvestedKg, lang, 1)} / ${fmtNum(r.expectedKg, lang, 1)} kg · ${pct(r.ratio)}` : tt('review.noWeight')}</span>
        </span>
        {r.causes.length > 0 && (
          <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: INK700 }}>
            {r.causes.map((c) => tt(`review.cause.${c}` as JKey, { n: r.problems })).join(' · ')}
          </span>
        )}
      </button>
    </li>
  );
  if (!flowers.rows.length && !beds.length && !results.length) return null;
  return (
    <section className="mt-5 space-y-4">
      <h3 className="font-display text-base">🗒 {tt('review.title', { year })}</h3>
      {flowers.rows.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium">💐 {tt('review.flowers', { n: flowers.stems })}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: INK500 }}>
                <th className="py-1 pr-2 text-left font-normal">{tt('season.col.crop')}</th>
                <th className="py-1 pr-2 text-right font-normal">{tt('review.col.stems')}</th>
                <th className="py-1 pr-2 text-right font-normal">{tt('review.col.perPlant')}</th>
                <th className="py-1 text-right font-normal">{tt('review.col.perM2')}</th>
              </tr>
            </thead>
            <tbody>
              {flowers.rows.map((r) => (
                <tr key={r.speciesId} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }}>
                  <td className="py-1 pr-2">
                    {SPECIES_BY_ID[r.speciesId]?.emoji} {speciesName(r.speciesId, lang)}
                  </td>
                  <td className="whitespace-nowrap py-1 pr-2 text-right font-data text-xs">{r.stems}</td>
                  <td className="whitespace-nowrap py-1 pr-2 text-right font-data text-xs">{r.plants > 0 ? fmtNum(r.stems / r.plants, lang, 1) : '—'}</td>
                  <td className="py-1 text-right font-data">{r.area > 0 ? fmtNum(r.stems / r.area, lang, 0) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {beds.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium">▭ {tt('review.beds')}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs" style={{ color: INK500 }}>
                  <th className="py-1 pr-2 text-left font-normal">{tt('report.bed')}</th>
                  <th className="py-1 pr-2 text-right font-normal">{tt('season.col.weight')}</th>
                  <th className="py-1 pr-2 text-right font-normal">{tt('season.col.perM2')}</th>
                  <th className="py-1 pr-2 text-right font-normal">{tt('review.col.vsExpected')}</th>
                  <th className="py-1 text-right font-normal">☀</th>
                </tr>
              </thead>
              <tbody>
                {beds.map((b) => (
                  <tr key={b.bedId} className="border-t align-top" style={{ borderColor: 'var(--color-paper-300)' }}>
                    <td className="py-1 pr-2">
                      <button type="button" className="text-left underline-offset-2 hover:underline" onClick={() => nav.open({ type: 'bed', id: b.bedId })}>
                        {b.name}
                      </button>
                      <span className="block text-[11px] leading-snug" style={{ color: INK500 }}>
                        {b.speciesIds.map((id) => SPECIES_BY_ID[id]?.emoji ?? '').join(' ')}
                        {b.stems > 0 ? ` · ${tt('review.stemsShort', { n: b.stems })}` : ''}
                        {b.mulched ? ` · ${tt('review.mulched')}` : ''}
                        {b.problems > 0 ? ` · ${tt('review.problemsShort', { n: b.problems })}` : ''}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-1 pr-2 text-right font-data text-xs">{b.grams > 0 ? fmtG(b.grams, lang) : '—'}</td>
                    <td className="whitespace-nowrap py-1 pr-2 text-right font-data text-xs">{b.grams > 0 ? `${fmtNum(b.grams / 1000 / b.area, lang, 1)} kg` : '—'}</td>
                    <td className="whitespace-nowrap py-1 pr-2 text-right font-data text-xs" style={{ color: b.ratio === null ? INK500 : b.ratio >= 0.9 ? '#4a7f36' : b.ratio >= 0.5 ? '#b07a1a' : '#a5532f' }}>
                      {b.ratio === null ? '—' : pct(b.ratio)}
                    </td>
                    <td className="whitespace-nowrap py-1 text-right font-data text-xs">{fmtNum(b.sunHours, lang, 1)} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-medium" style={{ color: '#4a7f36' }}>
            ✓ {tt('review.worked')}
          </p>
          {review.worked.length ? <ul className="space-y-1">{review.worked.slice(0, 8).map(resultLine)}</ul> : <p className="text-xs" style={{ color: INK500 }}>{tt('review.workedNone')}</p>}
        </div>
        <div>
          <p className="mb-1 text-sm font-medium" style={{ color: '#a5532f' }}>
            ↻ {tt('review.toReview')}
          </p>
          {review.review.length ? <ul className="space-y-1">{review.review.slice(0, 8).map(resultLine)}</ul> : <p className="text-xs" style={{ color: INK500 }}>{tt('review.toReviewNone')}</p>}
        </div>
      </div>
      <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('review.note')}
      </p>
      <div>
        <Button
          small
          kind="primary"
          onClick={() => {
            const wishes = wishesFromReview(data, year, today);
            if (!wishes.length) return nav.toast(tt('plan.noLastYear'));
            if (data.plan?.wishes.length && data.plan.year === year + 1 && !window.confirm(tt('review.replanConfirm', { year: year + 1 }))) return;
            store.setPlan({ year: year + 1, wishes });
            nav.toast(tt('review.replanned', { year: year + 1, n: wishes.length }));
          }}
        >
          🗓 {tt('review.replan', { year: year + 1 })}
        </Button>
        <p className="mt-1 text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('review.replanHint')}
        </p>
      </div>
    </section>
  );
}

/** Récoltes prévues des cultures en place, par culture et par mois. */
function ForecastPanel() {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const rows = useMemo(() => forecast(data, today).filter((r) => r.remainingKg > 0.05), [data, today]);
  const months = useMemo(() => forecastByMonth(rows, today), [rows, today]);
  if (!rows.length) return null;
  const maxKg = Math.max(...months.map((m) => m.kg), 1);
  const total = rows.reduce((s, r) => s + r.remainingKg, 0);
  const value = rows.reduce((s, r) => s + r.valueEur, 0);
  return (
    <section className="mt-5">
      <h3 className="mb-1 font-display text-base">📈 {tt('forecast.title')}</h3>
      <p className="text-sm" style={{ color: INK700 }}>
        {tt('forecast.lead', { kg: fmtNum(total, lang, 1), eur: fmtNum(value, lang, 0) })}
      </p>
      <ul className="mt-2 space-y-1" aria-label={tt('forecast.byMonth')}>
        {months.map((m) => (
          <li key={m.month} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 capitalize">
              {monthName(Number(m.month.slice(5, 7)), lang)}
              {m.month.slice(0, 4) !== today.slice(0, 4) ? ` ${m.month.slice(2, 4)}` : ''}
            </span>
            <span className="h-3 rounded" style={{ width: `${Math.max(2, (m.kg / maxKg) * 55)}%`, background: '#6c9256' }} />
            <span className="whitespace-nowrap font-data">{fmtNum(m.kg, lang, 1)} kg</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs" style={{ color: INK500 }}>
              <th className="py-1 pr-2 text-left font-normal">{tt('season.col.crop')}</th>
              <th className="py-1 pr-2 text-left font-normal">{tt('report.window')}</th>
              <th className="py-1 pr-2 text-right font-normal">{tt('report.expected')}</th>
              <th className="py-1 text-right font-normal">{tt('report.remaining')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = data.plants.find((x) => x.id === r.plantId);
              return (
                <tr key={r.plantId} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }}>
                  <td className="py-1 pr-2">
                    {SPECIES_BY_ID[r.speciesId]?.emoji} {p ? plantTitle(p, lang) : speciesName(r.speciesId, lang)}
                  </td>
                  <td className="py-1 pr-2 text-xs">
                    {fmtDate(r.from, lang, r.from.slice(0, 4) !== today.slice(0, 4))} – {fmtDate(r.to, lang, r.to.slice(0, 4) !== today.slice(0, 4))}
                  </td>
                  <td className="whitespace-nowrap py-1 pr-2 text-right font-data">{fmtNum(r.expectedKg, lang, 1)} kg</td>
                  <td className="whitespace-nowrap py-1 text-right font-data">{fmtNum(r.remainingKg, lang, 1)} kg</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('forecast.note')}
      </p>
    </section>
  );
}

/** Rapport PDF de la saison et bilan pluriannuel (tableur). */
function ProExports({ year }: { year: number }) {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const [busy, setBusy] = useState(false);
  const slug = data.settings.gardenName.normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'jardin';
  const pdf = async () => {
    setBusy(true);
    try {
      const { buildReportPdf } = await import('./reportPdf');
      await saveFile(`lignee-jardin-${slug}-rapport-${year}.pdf`, await buildReportPdf(data, year, today, lang), 'application/pdf');
    } catch {
      nav.toast(tt('report.error'));
    } finally {
      setBusy(false);
    }
  };
  const csv = () => {
    const my = multiYear(data);
    const rows: Array<Array<string | number | undefined>> = [[tt('report.year'), tt('season.col.crop'), tt('report.kg'), tt('report.m2'), tt('report.kgm2'), tt('report.valueEur')]];
    for (const r of my.rows) rows.push([r.year, speciesName(r.speciesId, lang), Math.round(r.grams) / 1000, Math.round(r.area * 100) / 100, r.area > 0 ? Math.round((r.grams / 1000 / r.area) * 100) / 100 : undefined, Math.round(r.value * 100) / 100]);
    rows.push([]);
    rows.push([tt('report.year'), tt('report.inputsEur'), tt('report.valueEur'), tt('report.balanceEur')]);
    for (const y of my.years) {
      const v = my.rows.filter((r) => r.year === y).reduce((s, r) => s + r.value, 0);
      rows.push([y, Math.round(my.inputs[y] * 100) / 100, Math.round(v * 100) / 100, Math.round((v - my.inputs[y]) * 100) / 100]);
    }
    void saveFile(`lignee-jardin-${slug}-bilan-pluriannuel.csv`, toCSV(rows), 'text/csv');
  };
  return (
    <section className="mt-5">
      <h3 className="mb-1 font-display text-base">📄 {tt('report.section')}</h3>
      <div className="flex flex-wrap gap-2">
        <Button small kind="primary" onClick={() => void pdf()} disabled={busy}>
          {busy ? '…' : tt('report.pdf', { year })}
        </Button>
        <Button small kind="ghost" onClick={csv}>
          {tt('report.multiYear')}
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('report.hint')}
      </p>
    </section>
  );
}
