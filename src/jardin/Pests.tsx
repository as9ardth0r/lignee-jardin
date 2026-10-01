import { useState } from 'react';
import { PROBLEM_BY_ID } from './data/problems';
import { SPECIES_BY_ID } from './data/species';
import { BENEFICIALS, countablePests, PEST_RULES, pestStatuses, type PestStatus } from './engine/pests';
import { fmtDate, fmtNum } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Chip, Field, INK500, INK700, Select, Sheet, TextInput, Why } from './ui';

const ADVICE_COLOR = { act: '#a5532f', beneficials: '#4a7f36', watch: '#b07a1a', ok: '#4a7f36' } as const;

function Trend({ st }: { st: PestStatus }) {
  const vals = st.series.slice(-8).map((c) => c.value);
  if (vals.length < 2) return null;
  const max = Math.max(st.rule.threshold * 1.2, ...vals);
  const W = 90;
  const H = 24;
  const x = (i: number) => (i / (vals.length - 1)) * W;
  const y = (v: number) => H - 2 - (v / max) * (H - 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-6 w-24 shrink-0" aria-hidden="true">
      <line x1={0} x2={W} y1={y(st.rule.threshold)} y2={y(st.rule.threshold)} stroke="#a5532f" strokeDasharray="3 2" strokeWidth={0.8} />
      <polyline points={vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke="#2f6a96" strokeWidth={1.5} />
    </svg>
  );
}

/** Comptages d'une culture : dernier relevé, tendance, conseil. */
export function PestPanel({ plantId }: { plantId: string }) {
  const store = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const statuses = pestStatuses(store.data.pestCounts, { plantId });
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">🔢 {tt('pest.title')}</h4>
        <Button small kind="ghost" onClick={() => nav.open({ type: 'pestCount', plantId })}>
          + {tt('pest.count')}
        </Button>
      </div>
      {statuses.length === 0 ? (
        <p className="text-xs" style={{ color: INK500 }}>
          {tt('pest.none')}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {statuses.map((st) => (
            <li key={st.pestId} className="rounded px-3 py-2 text-sm" style={{ background: 'var(--color-paper-200)' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <b>{PROBLEM_BY_ID[st.pestId]?.name[lang]}</b>{' '}
                  <span className="text-xs">
                    · {fmtNum(st.last.value, lang, 0)} {tt(`pest.unit.${st.rule.unit}` as JKey)}
                  </span>
                  <span className="block text-[11px]" style={{ color: INK500 }}>
                    {fmtDate(st.last.date, lang)} · {tt('pest.threshold', { n: st.rule.threshold })} · {tt(`pest.trend.${st.trend}` as JKey)}
                    {st.last.beneficials.length > 0 && ` · ${st.last.beneficials.map((b) => tt(`beneficial.${b}` as JKey)).join(', ')}`}
                  </span>
                </span>
                <Trend st={st} />
              </div>
              <p className="mt-1 text-xs font-medium" style={{ color: ADVICE_COLOR[st.advice] }}>
                {tt(`pest.advice.${st.advice}` as JKey)}
              </p>
              <button type="button" className="mt-0.5 text-[11px] underline" style={{ color: INK500 }} onClick={() => nav.open({ type: 'pestCount', plantId, pestId: st.pestId })}>
                {tt('pest.recount')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Saisie d'un comptage. */
export function PestCountSheet({ plantId, bedId, pestId, onClose }: { plantId?: string; bedId?: string; pestId?: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const plant = plantId ? data.plants.find((p) => p.id === plantId) : undefined;
  const family = plant ? SPECIES_BY_ID[plant.speciesId]?.family : undefined;
  const pests = countablePests(family);
  const [pest, setPest] = useState(pestId && pests.includes(pestId) ? pestId : pests[0]);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(today);
  const [bens, setBens] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const rule = PEST_RULES[pest];
  const save = () => {
    const v = Number(value.replace(',', '.'));
    if (!Number.isFinite(v) || v < 0 || value.trim() === '') return;
    store.addPestCount({ plantId, bedId: bedId ?? plant?.bedId, date, pestId: pest, value: v, beneficials: bens, note: note.trim() || undefined });
    nav.toast(tt('pest.saved'));
    onClose();
  };
  const history = data.pestCounts.filter((c) => c.pestId === pest && (plantId ? c.plantId === plantId : c.bedId === bedId)).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Sheet title={`🔢 ${tt('pest.sheetTitle')}`} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('pest.pest')}>{(fid) => <Select id={fid} value={pest} onChange={setPest} options={pests.map((id) => ({ v: id, l: PROBLEM_BY_ID[id].name[lang] }))} />}</Field>
          <Field label={tt('csv.date')}>{(fid) => <TextInput id={fid} type="date" value={date} onChange={(v) => v && setDate(v)} />}</Field>
          <Field label={tt(`pest.unit.${rule.unit}` as JKey)} hint={tt(`pest.how.${rule.unit}` as JKey)}>
            {(fid) => <TextInput id={fid} type="number" min={0} step={1} value={value} onChange={setValue} />}
          </Field>
          <Field label={tt('diag.note')}>{(fid) => <TextInput id={fid} value={note} onChange={setNote} />}</Field>
        </div>
        <section>
          <h3 className="mb-1 text-sm font-semibold">🐞 {tt('pest.beneficials')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {BENEFICIALS.map((b) => (
              <Chip key={b} active={bens.includes(b)} onClick={() => setBens((x) => (x.includes(b) ? x.filter((y) => y !== b) : [...x, b]))}>
                {tt(`beneficial.${b}` as JKey)}
              </Chip>
            ))}
          </div>
        </section>
        <p className="text-xs" style={{ color: INK700 }}>
          {tt('pest.ruleLine', { n: rule.threshold, unit: tt(`pest.unit.${rule.unit}` as JKey) })} {rule.regulated ? tt('pest.regulated') : ''}
        </p>
        {history.length > 0 && (
          <ul className="space-y-0.5 text-xs" style={{ color: INK700 }}>
            {history.slice(0, 6).map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span>
                  {fmtDate(c.date, lang)} · {fmtNum(c.value, lang, 0)}
                  {c.beneficials.length ? ` · ${c.beneficials.map((b) => tt(`beneficial.${b}` as JKey)).join(', ')}` : ''}
                </span>
                <button type="button" className="underline" style={{ color: INK500 }} onClick={() => store.deletePestCount(c.id)}>
                  {tt('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Why label={tt('common.why')}>
          <p>{tt('pest.why')}</p>
        </Why>
        <div className="flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button kind="primary" onClick={save} disabled={value.trim() === ''}>
            {tt('common.save')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
