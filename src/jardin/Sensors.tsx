import { useMemo, useRef, useState } from 'react';
import { latestReading, moistureToFraction, nextRenewal, parseReadingsCSV, readingDate, SENSOR_UNIT, tankStatus, toMinutes, type CsvResult } from './engine/sensors';
import { fmtDate, fmtNum, locale, speciesName } from './format';
import { useJT, type JKey } from './i18n';
import { SENSOR_KINDS, uid, type Bed, type Reading, type Sensor, type SensorKind, type SensorSource } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Empty, Field, INK500, INK700, Notice, Select, Sheet, TextInput, Why } from './ui';
import { readFileAsText } from '../utils/download';

const KIND_ICON: Record<SensorKind, string> = { soilMoisture: '💧', soilTemp: '🌡', airTemp: '🌡', humidity: '☁', ec: '⚡', ph: '🧪' };

function fmtValue(kind: SensorKind, v: number, lang: 'fr' | 'en') {
  const d = kind === 'ec' || kind === 'ph' ? (kind === 'ec' ? 2 : 1) : 1;
  const u = SENSOR_UNIT[kind];
  return `${fmtNum(v, lang, d)}${u ? (u === '%' ? ' %' : ` ${u}`) : ''}`;
}

function fmtWhen(t: number, lang: 'fr' | 'en') {
  return new Date(t * 60_000).toLocaleString(locale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Petite courbe des 30 derniers jours (avec la plage cible si connue). */
export function Sparkline({ series, band, label }: { series: Reading[]; band?: [number, number]; label: string }) {
  const now = toMinutes(new Date());
  const win = series.filter((r) => r[0] >= now - 30 * 1440);
  // Moins de 30 jours de relevés : l'axe commence au premier.
  const from = win.length ? Math.min(win[0][0], now - 1440) : now - 30 * 1440;
  const pts = win;
  if (pts.length < 2) return null;
  const vals = pts.map((r) => r[1]).concat(band ?? []);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const W = 300;
  const H = 60;
  const x = (t: number) => ((t - from) / (now - from)) * W;
  const y = (v: number) => H - 4 - ((v - lo) / span) * (H - 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-16 w-full" role="img" aria-label={label} preserveAspectRatio="none">
      {band && <rect x={0} width={W} y={y(band[1])} height={Math.max(1, y(band[0]) - y(band[1]))} fill="#6c9256" opacity={0.15} />}
      <polyline points={pts.map((r) => `${x(r[0]).toFixed(1)},${y(r[1]).toFixed(1)}`).join(' ')} fill="none" stroke="#2f6a96" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Liste des capteurs du jardin, sur l'écran Jardin. */
export function SensorsCard() {
  const store = useGarden();
  const { data } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [busy, setBusy] = useState(false);
  const ecowitt = data.sensors.some((s) => s.source === 'ecowitt');
  const poll = async () => {
    setBusy(true);
    const r = await store.pollEcowitt();
    setBusy(false);
    nav.toast(tt(`ecowitt.result.${r}` as JKey));
  };
  return (
    <Card
      title={`📡 ${tt('sensors.title')}`}
      action={
        <Button small kind="primary" onClick={() => nav.open({ type: 'sensor' })}>
          + {tt('sensors.add')}
        </Button>
      }
    >
      {data.sensors.length === 0 ? (
        <Empty>{tt('sensors.none')}</Empty>
      ) : (
        <ul className="space-y-1.5">
          {data.sensors.map((s) => {
            const r = latestReading(data, s.id);
            const bed = data.beds.find((b) => b.id === s.bedId);
            return (
              <li key={s.id}>
                <button type="button" onClick={() => nav.open({ type: 'sensor', id: s.id })} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                  <span className="text-xl" aria-hidden="true">
                    {KIND_ICON[s.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.name}</span>
                    <span className="block text-[11px]" style={{ color: INK500 }}>
                      {tt(`sensorKind.${s.kind}` as JKey)} · {bed?.name ?? tt('sensors.wholeGarden')} · {tt(`sensorSource.${s.source}` as JKey)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-data text-sm font-semibold">{r ? fmtValue(s.kind, r[1], lang) : '—'}</span>
                    {r && (
                      <span className="block text-[10px]" style={{ color: INK500 }}>
                        {fmtWhen(r[0], lang)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {ecowitt && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: INK700 }}>
          <Button small kind="ghost" onClick={() => void poll()} disabled={busy}>
            {busy ? '…' : `↻ ${tt('ecowitt.poll')}`}
          </Button>
          {store.ecowittAt && <span>{tt('ecowitt.lastPoll', { when: new Date(store.ecowittAt).toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' }) })}</span>}
        </div>
      )}
      <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('sensors.note')}
      </p>
    </Card>
  );
}

function nowLocalInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** Création, réglage et relevés d'un capteur. */
export function SensorSheet({ id, bedId, kind, onClose }: { id?: string; bedId?: string; kind?: SensorKind; onClose: () => void }) {
  const store = useGarden();
  const { data } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const editing = id ? data.sensors.find((s) => s.id === id) : undefined;
  const [s, setS] = useState<Sensor>(
    () =>
      editing ?? {
        id: uid('sn'),
        name: '',
        kind: kind ?? 'soilMoisture',
        bedId: bedId ?? data.beds[0]?.id,
        source: 'manual',
      },
  );
  const set = (patch: Partial<Sensor>) => setS((x) => ({ ...x, ...patch }));
  const [value, setValue] = useState('');
  const [when, setWhen] = useState(nowLocalInput);
  const [csv, setCsv] = useState<{ text: string; res: CsvResult; col?: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const series = useMemo(() => data.readings[s.id] ?? [], [data.readings, s.id]);
  const bed = data.beds.find((b) => b.id === s.bedId);
  const saved = !!data.sensors.find((x) => x.id === s.id);
  const texture = bed?.texture ?? data.settings.texture;
  const status = bed?.kind === 'hydro' && (s.kind === 'ec' || s.kind === 'ph') ? tankStatus(bed.id, data, readingDate(toMinutes(new Date()))) : null;
  const band = status?.target?.[s.kind as 'ec' | 'ph'];

  const save = () => {
    const name = s.name.trim() || `${tt(`sensorKind.${s.kind}` as JKey)}${bed ? ` · ${bed.name}` : ''}`;
    store.saveSensor({ ...s, name, channel: s.source === 'ecowitt' ? s.channel || (s.kind === 'airTemp' || s.kind === 'humidity' ? 'outdoor' : '1') : undefined });
    return name;
  };
  const addValue = () => {
    const v = Number(value.replace(',', '.'));
    if (!Number.isFinite(v) || value.trim() === '') return;
    if (!saved) save();
    const t = toMinutes(new Date(when));
    const n = store.addReadings(s.id, [[t, v]]);
    setValue('');
    nav.toast(n > 0 ? tt('sensors.added') : tt('sensors.duplicate'));
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await readFileAsText(f);
    setCsv({ text, res: parseReadingsCSV(text, s.kind) });
  };
  const importCsv = () => {
    if (!csv) return;
    if (!saved) save();
    const n = store.addReadings(s.id, csv.res.readings);
    nav.toast(tt('sensors.imported', { n, skipped: csv.res.skipped }));
    setCsv(null);
  };
  const recent = [...series].slice(-8).reverse();
  const last = series[series.length - 1];

  return (
    <Sheet title={editing ? s.name : tt('sensors.new')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('bed.name')}>{(fid) => <TextInput id={fid} value={s.name} onChange={(v) => set({ name: v })} placeholder={tt(`sensorKind.${s.kind}` as JKey)} />}</Field>
          <Field label={tt('sensors.kind')}>{(fid) => <Select id={fid} value={s.kind} onChange={(v) => set({ kind: v as SensorKind })} options={SENSOR_KINDS.map((k) => ({ v: k, l: tt(`sensorKind.${k}` as JKey) }))} />}</Field>
          <Field label={tt('sensors.where')}>
            {(fid) => <Select id={fid} value={s.bedId ?? ''} onChange={(v) => set({ bedId: v || undefined })} options={[{ v: '', l: tt('sensors.wholeGarden') }, ...data.beds.map((b: Bed) => ({ v: b.id, l: b.name }))]} />}
          </Field>
          <Field label={tt('sensors.source')}>{(fid) => <Select id={fid} value={s.source} onChange={(v) => set({ source: v as SensorSource })} options={(['manual', 'csv', 'ecowitt'] as const).map((k) => ({ v: k, l: tt(`sensorSource.${k}` as JKey) }))} />}</Field>
        </div>

        {s.source === 'ecowitt' && (
          <section className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tt('ecowitt.host')} hint={tt('ecowitt.hostHint')}>
                {(fid) => <TextInput id={fid} value={data.settings.ecowittHost ?? ''} onChange={(v) => store.updateSettings({ ecowittHost: v.trim() || undefined })} placeholder="192.168.1.50" />}
              </Field>
              <Field label={tt('ecowitt.channel')} hint={tt(s.kind === 'airTemp' || s.kind === 'humidity' ? 'ecowitt.channelAir' : 'ecowitt.channelSoil')}>
                {(fid) => <TextInput id={fid} value={s.channel ?? ''} onChange={(v) => set({ channel: v.trim() })} placeholder={s.kind === 'airTemp' || s.kind === 'humidity' ? 'outdoor' : '1'} />}
              </Field>
            </div>
            {!['soilMoisture', 'soilTemp', 'airTemp', 'humidity'].includes(s.kind) && <p className="mt-2 text-xs" style={{ color: '#a5532f' }}>{tt('ecowitt.unsupportedKind')}</p>}
            <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
              {tt('ecowitt.note')}
            </p>
          </section>
        )}

        {s.kind === 'soilMoisture' && (
          <Why label={tt('sensors.calibrate')}>
            <p>{tt('sensors.calibrateHow')}</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Field label={tt('sensors.dry')}>{(fid) => <TextInput id={fid} type="number" value={s.dry ?? ''} onChange={(v) => set({ dry: v === '' ? undefined : Number(v) })} />}</Field>
              <Field label={tt('sensors.wet')}>{(fid) => <TextInput id={fid} type="number" value={s.wet ?? ''} onChange={(v) => set({ wet: v === '' ? undefined : Number(v) })} />}</Field>
            </div>
            {last && <p className="mt-1">{tt('sensors.reserveNow', { pct: Math.round(moistureToFraction(s, last[1], texture) * 100) })}</p>}
          </Why>
        )}

        {status && (
          <Notice tone={status[s.kind as 'ec' | 'ph']?.state === 'ok' ? 'good' : 'warn'}>
            {band ? tt('tank.target', { what: tt(`sensorKind.${s.kind}` as JKey), lo: fmtNum(band[0], lang, 1), hi: fmtNum(band[1], lang, 1), crops: status.target!.known.map((x) => speciesName(x, lang)).join(', ') }) : tt('tank.noTarget')}
          </Notice>
        )}

        <section>
          <h3 className="mb-1 text-sm font-semibold">{tt('sensors.readings', { n: series.length })}</h3>
          <Sparkline series={series} band={band} label={tt('sensors.chart')} />
          {recent.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-sm">
              {recent.map((r) => (
                <li key={r[0]} className="flex justify-between gap-2">
                  <span style={{ color: INK700 }}>{fmtWhen(r[0], lang)}</span>
                  <span className="font-data">{fmtValue(s.kind, r[1], lang)}</span>
                  <button type="button" className="text-[11px] underline" style={{ color: INK500 }} onClick={() => store.deleteReading(s.id, r[0])}>
                    {tt('common.delete')}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{tt('sensors.noReading')}</Empty>
          )}
        </section>

        <section className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
          <h3 className="mb-1 text-sm font-semibold">✎ {tt('sensors.manual')}</h3>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs">
              {tt('sensors.when')}
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="field mt-1 block rounded px-2 py-1.5 text-sm outline-none" style={{ background: 'var(--color-paper-100)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }} />
            </label>
            <label className="w-28 text-xs">
              {tt('sensors.value')} {SENSOR_UNIT[s.kind] && `(${SENSOR_UNIT[s.kind]})`}
              <span className="mt-1 block">
                <TextInput type="number" step={0.1} value={value} onChange={setValue} />
              </span>
            </label>
            <Button small kind="primary" onClick={addValue} disabled={value.trim() === ''}>
              {tt('sensors.addValue')}
            </Button>
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold">📄 {tt('sensors.csv')}</h3>
          <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
            {tt('sensors.csvHow')}
          </p>
          <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} aria-label={tt('sensors.csv')} />
          <div className="mt-2">
            <Button small kind="ghost" onClick={() => fileRef.current?.click()}>
              {tt('sensors.csvPick')}
            </Button>
          </div>
          {csv && (
            <div className="mt-2 space-y-2">
              {csv.res.columns.length > 1 && (
                <Field label={tt('sensors.csvColumn')}>
                  {(fid) => (
                    <Select
                      id={fid}
                      value={String(csv.col ?? csv.res.columns[0])}
                      onChange={(v) => setCsv({ ...csv, col: Number(v), res: parseReadingsCSV(csv.text, s.kind, Number(v)) })}
                      options={csv.res.columns.map((c) => ({ v: String(c), l: csv.res.header?.[c] || `#${c + 1}` }))}
                    />
                  )}
                </Field>
              )}
              <Notice tone={csv.res.readings.length ? 'info' : 'warn'}>
                {tt('sensors.csvPreview', { n: csv.res.readings.length, skipped: csv.res.skipped })}
                {csv.res.readings.length > 0 && ` ${fmtDate(readingDate(csv.res.readings[0][0]), lang, true)} → ${fmtDate(readingDate(csv.res.readings[csv.res.readings.length - 1][0]), lang, true)}`}
              </Notice>
              <Button small kind="primary" onClick={importCsv} disabled={!csv.res.readings.length}>
                {tt('sensors.csvImport')}
              </Button>
            </div>
          )}
        </section>

        <div className="flex flex-wrap justify-between gap-2">
          {saved ? (
            <Button
              kind="danger"
              small
              onClick={() => {
                if (window.confirm(tt('sensors.deleteConfirm'))) {
                  store.deleteSensor(s.id);
                  onClose();
                }
              }}
            >
              {tt('common.delete')}
            </Button>
          ) : (
            <span />
          )}
          <Button
            kind="primary"
            onClick={() => {
              save();
              nav.toast(tt('sensors.saved'));
              onClose();
            }}
          >
            {tt('common.save')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/** Bloc capteurs et bac dans la fiche d'une planche. */
export function BedSensors({ bed }: { bed: Bed }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const sensors = data.sensors.filter((s) => s.bedId === bed.id);
  const hydro = bed.kind === 'hydro';
  const st = hydro ? tankStatus(bed.id, data, today) : null;
  const [vol, setVol] = useState('');
  if (!hydro && sensors.length === 0) {
    return (
      <p className="text-xs" style={{ color: INK500 }}>
        <button type="button" className="underline" onClick={() => nav.open({ type: 'sensor', bedId: bed.id })}>
          + {tt('sensors.addForBed')}
        </button>
      </p>
    );
  }
  return (
    <section>
      <h3 className="mb-1 font-display text-lg">{hydro ? `🧪 ${tt('tank.title')}` : `📡 ${tt('sensors.title')}`}</h3>
      {st && (
        <div className="space-y-1.5 text-sm">
          {st.target ? (
            <p style={{ color: INK700 }}>
              {tt('tank.targets', { ec0: fmtNum(st.target.ec[0], lang, 1), ec1: fmtNum(st.target.ec[1], lang, 1), ph0: fmtNum(st.target.ph[0], lang, 1), ph1: fmtNum(st.target.ph[1], lang, 1) })}
            </p>
          ) : (
            <p style={{ color: INK700 }}>{tt('tank.noTarget')}</p>
          )}
          {(['ec', 'ph'] as const).map((m) => {
            const r = st[m];
            return (
              <p key={m}>
                <b>{tt(`sensorKind.${m}` as JKey)}</b> :{' '}
                {r ? (
                  <>
                    <span className="font-data">{fmtValue(m, r.value, lang)}</span> <span style={{ color: r.state === 'ok' ? '#4a7f36' : '#a5532f' }}>({tt(`tank.state.${r.state}` as JKey)})</span>
                  </>
                ) : (
                  <span style={{ color: INK500 }}>{tt('tank.noMeasure')}</span>
                )}
              </p>
            );
          })}
          <p>
            {st.lastChange ? tt('tank.lastChange', { date: fmtDate(st.lastChange, lang), next: fmtDate(nextRenewal(st, today), lang) }) : tt('tank.neverChanged')}
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="w-28 text-xs">
              {tt('tank.volume')}
              <span className="mt-1 block">
                <TextInput type="number" value={vol} onChange={setVol} placeholder={bed.tankL ? String(bed.tankL) : 'L'} />
              </span>
            </label>
            <Button
              small
              kind="primary"
              onClick={() => {
                store.addTankChange({ bedId: bed.id, date: today, volumeL: Number(vol) > 0 ? Number(vol) : bed.tankL });
                setVol('');
                nav.toast(tt('tank.changed'));
              }}
            >
              {tt('tank.renew')}
            </Button>
          </div>
        </div>
      )}
      {sensors.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {sensors.map((s) => {
            const r = latestReading(data, s.id);
            return (
              <li key={s.id}>
                <button type="button" className="flex w-full justify-between gap-2 rounded px-2 py-1 text-left" style={{ background: 'var(--color-paper-200)' }} onClick={() => nav.open({ type: 'sensor', id: s.id })}>
                  <span>
                    {KIND_ICON[s.kind]} {s.name}
                  </span>
                  <span className="shrink-0 text-right text-xs"><span className="font-data">{r ? fmtValue(s.kind, r[1], lang) : '—'}</span>{r && <span className="block text-[10px]" style={{ color: INK500 }}>{fmtWhen(r[0], lang)}</span>}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {hydro && !sensors.some((s) => s.kind === 'ec') && (
          <Button small kind="ghost" onClick={() => nav.open({ type: 'sensor', bedId: bed.id, kind: 'ec' })}>
            + {tt('sensorKind.ec')}
          </Button>
        )}
        {hydro && !sensors.some((s) => s.kind === 'ph') && (
          <Button small kind="ghost" onClick={() => nav.open({ type: 'sensor', bedId: bed.id, kind: 'ph' })}>
            + {tt('sensorKind.ph')}
          </Button>
        )}
        <Button small kind="ghost" onClick={() => nav.open({ type: 'sensor', bedId: bed.id })}>
          + {tt('sensors.add')}
        </Button>
      </div>
      {hydro && (
        <Why label={tt('common.why')}>
          <p>{tt('tank.why')}</p>
        </Why>
      )}
      {!hydro && sensors.some((s) => s.kind === 'soilMoisture') && <p className="mt-1 text-[11px]" style={{ color: INK500 }}>{tt('sensors.waterLinked')}</p>}
    </section>
  );
}
