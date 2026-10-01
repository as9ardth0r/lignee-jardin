import { useState } from 'react';
import { SPECIES_BY_ID } from './data/species';
import { limeAdvice, limeSeason, P_THRESHOLDS, phMismatches, soilFor, testIsOld, TARGET_PH, type Level, type SoilReading } from './engine/soil';
import { bedArea } from './engine/water';
import { fmtDate, fmtNum, speciesName } from './format';
import { useJT, type JKey } from './i18n';
import { uid, type Bed, type PMethod, type SoilTest } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Empty, Field, INK500, INK700, Notice, Select, Sheet, TextInput, Why } from './ui';

const LEVEL_COLOR: Record<Level, string> = { low: '#b07a1a', ok: '#4a7f36', high: '#2f6a96', veryHigh: '#7a3f8f' };

function LevelChip({ level }: { level: Level }) {
  const { tt } = useJT();
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: LEVEL_COLOR[level], color: '#fff' }}>
      {tt(`soil.level.${level}` as JKey)}
    </span>
  );
}

/** Lecture d'une analyse : niveaux, chaulage, cultures hors de leur pH. */
export function SoilSummary({ reading, bed }: { reading: SoilReading; bed?: Bed }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const t = reading.test;
  const lime = limeAdvice(reading, data, bed);
  const plants = data.plants.filter((p) => p.status !== 'ended' && (!bed || p.bedId === bed.id));
  const mismatch = phMismatches(reading, plants);
  const rows: Array<{ k: string; v: string; level?: Level; hint?: string }> = [];
  if (reading.ph) rows.push({ k: 'pH', v: fmtNum(reading.ph.value, lang, 1), hint: tt(`soil.ph.${reading.ph.state}` as JKey) });
  if (t.om !== undefined) rows.push({ k: tt('soil.om'), v: `${fmtNum(t.om, lang, 1)} %`, hint: t.om < 2 ? tt('soil.omLow') : t.om > 5 ? tt('soil.omHigh') : undefined });
  if (reading.P) rows.push({ k: 'P₂O₅', v: `${t.P2O5} mg/kg`, level: reading.P.level, hint: tt('soil.range', { lo: reading.P.range[0], hi: reading.P.range[1], method: tt(`soil.method.${t.pMethod}` as JKey) }) });
  if (reading.K) rows.push({ k: 'K₂O', v: `${t.K2O} mg/kg`, level: reading.K.level, hint: tt('soil.rangeCec', { lo: reading.K.range[0], hi: reading.K.range[1] }) });
  if (reading.Mg) rows.push({ k: 'MgO', v: `${t.MgO} mg/kg`, level: reading.Mg.level, hint: tt('soil.rangeCec', { lo: reading.Mg.range[0], hi: reading.Mg.range[1] }) });
  if (reading.fromLab) rows.push({ k: tt('soil.cec'), v: `${fmtNum(reading.cec, lang, 1)} cmol+/kg${reading.cecEstimated ? ` (${tt('soil.estimated')})` : ''}` });

  const recordLime = () => {
    if (!lime) return;
    const beds = bed ? [bed] : data.beds.filter((b) => b.kind !== 'hydro' && b.kind !== 'pot');
    for (const b of beds) store.addApplication({ bedId: b.id, productId: lime.product.id, amount: Math.round(lime.productPerM2 * bedArea(b)), date: today });
    nav.toast(tt('soil.limeRecorded'));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: INK500 }}>
        {reading.fromLab ? tt('soil.from', { date: fmtDate(t.date, lang, true), lab: t.lab ? ` · ${t.lab}` : '' }) : tt('soil.fromSettings')}
        {testIsOld(t, today) ? ` · ${tt('soil.old')}` : ''}
      </p>
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1 text-sm">
        {rows.map((r) => (
          <div key={r.k} className="contents">
            <dt style={{ color: INK700 }}>{r.k}</dt>
            <dd>
              <span className="font-data">{r.v}</span> {r.level && <LevelChip level={r.level} />}
              {r.hint && (
                <span className="block text-[11px]" style={{ color: INK500 }}>
                  {r.hint}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {reading.fromLab && (reading.factor.P2O5 !== 1 || reading.factor.K2O !== 1 || reading.nPerYear) && (
        <Notice>
          {tt('soil.correction', { p: fmtNum(reading.factor.P2O5, lang, 1), k: fmtNum(reading.factor.K2O, lang, 1) })}
          {reading.nPerYear ? ` ${tt('soil.nCredit', { n: fmtNum(reading.nPerYear, lang, 0) })}` : ''}
        </Notice>
      )}
      {reading.Mg?.level === 'low' && <Notice tone="warn">{tt('soil.mgLow')}</Notice>}
      {lime && (
        <Notice tone="warn">
          <b>{tt('soil.limeTitle', { target: fmtNum(TARGET_PH, lang, 1) })}</b>{' '}
          {tt('soil.limeDose', { product: lime.product.name[lang], perM2: fmtNum(Math.round(lime.productPerM2 / 10) * 10, lang, 0), total: fmtNum(lime.productTotal / 1000, lang, 1), area: fmtNum(lime.area, lang, 1) })}
          {lime.multiYear ? ` ${tt('soil.limeMulti', { cao: fmtNum(lime.caoPerM2, lang, 0) })}` : ''}
          {lime.alreadyPerM2 > 0 ? ` ${tt('soil.limeAlready', { cao: fmtNum(lime.alreadyPerM2, lang, 0) })}` : ''}
          <span className="mt-1 block text-xs">{limeSeason(today) ? tt('soil.limeNow') : tt('soil.limeLater')}</span>
          <span className="mt-2 block">
            <Button small kind="ghost" onClick={recordLime}>
              ✓ {tt('soil.limeDone')}
            </Button>
          </span>
        </Notice>
      )}
      {reading.ph?.state === 'alkaline' && <Notice>{tt('soil.alkaline')}</Notice>}
      {mismatch.length > 0 && (
        <Notice tone="warn">
          {tt('soil.phMismatch', {
            list: [...new Set(mismatch.map((p) => p.speciesId))].map((id) => `${speciesName(id, lang)} (${SPECIES_BY_ID[id].pH[0]}–${SPECIES_BY_ID[id].pH[1]})`).join(', '),
          })}
        </Notice>
      )}
      <Why label={tt('common.why')}>
        <p>{tt('soil.why')}</p>
      </Why>
    </div>
  );
}

/** Analyses de sol du jardin (écran Jardin). */
export function SoilCard() {
  const store = useGarden();
  const { data } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const reading = soilFor(data);
  const tests = [...data.soilTests].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card
      title={`🪨 ${tt('soil.title')}`}
      action={
        <Button small kind="primary" onClick={() => nav.open({ type: 'soil' })}>
          + {tt('soil.add')}
        </Button>
      }
    >
      {reading ? <SoilSummary reading={reading} /> : <Empty>{tt('soil.none')}</Empty>}
      {tests.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {tests.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => nav.open({ type: 'soil', id: t.id })} className="flex w-full justify-between gap-2 rounded px-3 py-1.5 text-left" style={{ background: 'var(--color-paper-200)' }}>
                <span>
                  {fmtDate(t.date, lang, true)} · {t.bedId ? data.beds.find((b) => b.id === t.bedId)?.name ?? '—' : tt('sensors.wholeGarden')}
                </span>
                <span className="font-data text-xs">{t.pH !== undefined ? `pH ${fmtNum(t.pH, lang, 1)}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Bloc « sol » dans la fiche d'une planche. */
export function BedSoil({ bed }: { bed: Bed }) {
  const { data } = useGarden();
  const { tt } = useJT();
  const nav = useNav();
  if (bed.kind === 'hydro') return null;
  const reading = soilFor(data, bed.id);
  return (
    <section>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg">🪨 {tt('soil.title')}</h3>
        <Button small kind="ghost" onClick={() => nav.open({ type: 'soil', bedId: bed.id })}>
          + {tt('soil.addBed')}
        </Button>
      </div>
      {reading ? <SoilSummary reading={reading} bed={bed} /> : <p className="text-xs" style={{ color: INK500 }}>{tt('soil.none')}</p>}
    </section>
  );
}

const num = (v: string): number | undefined => {
  const x = Number(v.replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(x) && x >= 0 ? x : undefined;
};

/** Saisie d'une analyse de sol. */
export function SoilTestSheet({ id, bedId, onClose }: { id?: string; bedId?: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt } = useJT();
  const nav = useNav();
  const editing = id ? data.soilTests.find((t) => t.id === id) : undefined;
  const [t, setT] = useState<SoilTest>(() => editing ?? { id: uid('soil'), bedId, date: today, pMethod: 'olsen', pH: data.settings.pH });
  const set = (patch: Partial<SoilTest>) => setT((x) => ({ ...x, ...patch }));
  const field = (k: 'pH' | 'om' | 'P2O5' | 'K2O' | 'MgO' | 'cec' | 'clay', label: string, hint?: string, step = 1) => (
    <Field label={label} hint={hint}>
      {(fid) => <TextInput id={fid} type="number" step={step} value={t[k] ?? ''} onChange={(v) => set({ [k]: num(v) } as Partial<SoilTest>)} />}
    </Field>
  );
  const save = () => {
    const pH = t.pH !== undefined && (t.pH < 3 || t.pH > 10) ? undefined : t.pH;
    store.saveSoilTest({ ...t, pH, lab: t.lab?.trim() || undefined, note: t.note?.trim() || undefined });
    nav.toast(tt('soil.saved'));
    onClose();
  };
  return (
    <Sheet title={editing ? tt('soil.editTitle') : tt('soil.addTitle')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
          {tt('soil.formLead')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('csv.date')}>{(fid) => <TextInput id={fid} type="date" value={t.date} onChange={(v) => v && set({ date: v })} />}</Field>
          <Field label={tt('sensors.where')}>
            {(fid) => <Select id={fid} value={t.bedId ?? ''} onChange={(v) => set({ bedId: v || undefined })} options={[{ v: '', l: tt('sensors.wholeGarden') }, ...data.beds.filter((b) => b.kind !== 'hydro').map((b) => ({ v: b.id, l: b.name }))]} />}
          </Field>
          {field('pH', tt('soil.phWater'), tt('soil.phHint'), 0.1)}
          {field('om', tt('soil.omField'), tt('soil.omHint'), 0.1)}
          <Field label={tt('soil.pMethod')} hint={tt('soil.pMethodHint')}>
            {(fid) => <Select id={fid} value={t.pMethod} onChange={(v) => set({ pMethod: v as PMethod })} options={(Object.keys(P_THRESHOLDS) as PMethod[]).map((m) => ({ v: m, l: tt(`soil.method.${m}` as JKey) }))} />}
          </Field>
          {field('P2O5', 'P₂O₅ (mg/kg)', tt('soil.unitHint'))}
          {field('K2O', 'K₂O (mg/kg)')}
          {field('MgO', 'MgO (mg/kg)')}
          {field('cec', tt('soil.cecField'), tt('soil.cecHint'), 0.1)}
          {field('clay', tt('soil.clayField'), undefined, 1)}
          <Field label={tt('soil.lab')}>{(fid) => <TextInput id={fid} value={t.lab ?? ''} onChange={(v) => set({ lab: v })} />}</Field>
        </div>
        <Why label={tt('soil.unitsTitle')}>
          <p>{tt('soil.units')}</p>
        </Why>
        <div className="flex flex-wrap justify-between gap-2">
          {editing ? (
            <Button
              kind="danger"
              small
              onClick={() => {
                if (window.confirm(tt('soil.deleteConfirm'))) {
                  store.deleteSoilTest(editing.id);
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
