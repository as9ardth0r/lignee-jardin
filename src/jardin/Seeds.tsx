import { useState } from 'react';
import { SPECIES, SPECIES_BY_ID } from './data/species';
import { SPECIES_EXTRA } from './data/speciesExtra';
import { yearOf } from './engine/dates';
import { germRate, seasonSummary, seedsFor, seedState, type SeedState } from './engine/season';
import { fmtDate, fmtG, fmtNum, speciesName } from './format';
import { useJT, type JKey } from './i18n';
import { uid, type SeedLot } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Empty, Field, INK500, INK700, Notice, Select, Sheet, TextInput, Why } from './ui';

const STATE_COLOR: Record<SeedState, string> = { ok: '#4a7f36', lastYear: '#b07a1a', old: '#a5532f' };

/** Stock de graines, classé par espèce. */
export function SeedsPanel() {
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
        <Button small kind="primary" onClick={() => nav.open({ type: 'seed' })}>
          + {tt('seeds.add')}
        </Button>
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
                      </span>
                      <span className="block text-[11px]" style={{ color: INK500 }}>
                        {l.year}
                        {l.quantity ? ` · ${l.quantity}` : ''}
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
          <Field label={tt('seeds.year')} hint={tt('seeds.yearHint')}>
            {(fid) => <TextInput id={fid} type="number" value={year} onChange={setYear} />}
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
  const years = [...new Set([yearOf(today), ...data.observations.filter((o) => o.harvestG).map((o) => yearOf(o.date))])].sort((a, b) => b - a);
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
    </div>
  );
}
