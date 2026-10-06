import { useRef, useState, type ReactNode } from 'react';
import { CLIMATE_IDS, TEXTURES } from './data/climate';
import { PRODUCT_BY_ID } from './data/products';
import { PROBLEM_BY_ID, REMEDY_BY_ID } from './data/problems';
import { SPECIES_BY_ID } from './data/species';
import type { ClimateId, GardenKind, Practice, Settings, Texture, WaterSetup } from './model';
import { parseLigneeVarieties, toCSV } from './engine/backup';
import { todayISO } from './engine/dates';
import { plantTitle, speciesName } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Chip, Field, INK500, INK700, Notice, Select, TextInput } from './ui';
import { downloadTextFile, readFileAsText } from '../utils/download';
import { LocationPicker } from './Weather';
import { CompassButton } from './Locate';
import { GardensCard, NotificationsCard } from './ProSettings';
import { SyncCard } from './SyncCard';
import { SpeciesPhotosCard } from './Photos';

export const KINDS: GardenKind[] = ['vegetable', 'orchard', 'ornamental', 'balcony', 'greenhouse'];
export const PRACTICES: Practice[] = ['conventional', 'livingSoil', 'permaculture', 'organic', 'soilless'];
export const WATER: WaterSetup[] = ['manual', 'drip', 'rainTank'];

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function ClimatePicker({ value, onChange }: { value: ClimateId; onChange: (c: ClimateId) => void }) {
  const { tt } = useJT();
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {CLIMATE_IDS.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className="rounded px-3 py-2 text-left"
          style={{ background: value === c ? 'var(--color-tomato-500)' : 'var(--color-paper-200)', color: value === c ? 'var(--color-paper-100)' : 'var(--color-ink-900)' }}
        >
          <span className="block text-sm font-medium">{tt(`climate.${c}` as JKey)}</span>
          <span className="block text-[11px] leading-snug opacity-80">{tt(`climate.${c}.desc` as JKey)}</span>
        </button>
      ))}
    </div>
  );
}

export function ChoiceChips<T extends string>({ values, selected, onToggle, prefix }: { values: T[]; selected: T[]; onToggle: (v: T) => void; prefix: string }) {
  const { tt } = useJT();
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <Chip key={v} active={selected.includes(v)} onClick={() => onToggle(v)} title={tt(`${prefix}.${v}.desc` as JKey)}>
          {tt(`${prefix}.${v}` as JKey)}
        </Chip>
      ))}
    </div>
  );
}

export function TexturePicker({ value, onChange }: { value: Texture; onChange: (t: Texture) => void }) {
  const { tt } = useJT();
  return (
    <div>
      <Select value={value} onChange={onChange} options={TEXTURES.map((t) => ({ v: t, l: tt(`texture.${t}` as JKey) }))} />
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt(`texture.${value}.desc` as JKey)}
      </p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: INK500 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export function SettingsView() {
  const store = useGarden();
  const { data } = store;
  const s = data.settings;
  const { tt, lang } = useJT();
  const nav = useNav();
  const backupRef = useRef<HTMLInputElement>(null);
  const ligneeRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Settings>) => store.updateSettings(patch);
  const stamp = todayISO();

  const exportJSON = async () => {
    setBusy(true);
    try {
      downloadTextFile(`lignee-jardin-${stamp}.json`, await store.exportBackup(), 'application/json');
    } finally {
      setBusy(false);
    }
  };

  const importJSON = async (file: File) => {
    if (!window.confirm(tt('settings.importConfirm'))) return;
    try {
      await store.importBackup(await readFileAsText(file));
      nav.toast(tt('settings.imported'));
    } catch {
      window.alert(tt('settings.importError'));
    }
  };

  const importLignee = async (file: File) => {
    try {
      const list = parseLigneeVarieties(await readFileAsText(file));
      store.saveVarieties(list);
      nav.toast(tt('settings.ligneeImported', { n: list.length, species: list[0] ? speciesName(list[0].speciesId, lang) : '' }));
    } catch {
      window.alert(tt('settings.ligneeError'));
    }
  };

  const csvJournal = () => {
    const rows: Array<Array<string | number | undefined>> = [[tt('csv.date'), tt('csv.plant'), tt('csv.bed'), tt('csv.note'), tt('csv.height'), tt('csv.fruits'), tt('csv.harvest'), tt('csv.stems'), tt('csv.health'), tt('csv.photos'), tt('csv.voice')]];
    for (const o of [...data.observations].sort((a, b) => a.date.localeCompare(b.date))) {
      const p = o.plantId ? data.plants.find((x) => x.id === o.plantId) : undefined;
      rows.push([o.date, p ? plantTitle(p, lang) : '', data.beds.find((b) => b.id === o.bedId)?.name, o.note, o.heightCm, o.fruits, o.harvestG, o.stems, o.health ? tt(`health.${o.health}` as JKey) : '', o.photoIds.length, o.audioIds?.length ?? 0]);
    }
    downloadTextFile(`lignee-jardin-journal-${stamp}.csv`, toCSV(rows), 'text/csv');
  };

  const csvInputs = () => {
    const rows: Array<Array<string | number | undefined>> = [[tt('csv.date'), tt('csv.bed'), tt('csv.plant'), tt('csv.product'), tt('csv.amount'), 'N %', 'P₂O₅ %', 'K₂O %', tt('csv.organic'), tt('csv.cost')]];
    for (const a of [...data.applications].sort((x, y) => x.date.localeCompare(y.date))) {
      const pr = PRODUCT_BY_ID[a.productId];
      const p = a.plantId ? data.plants.find((x) => x.id === a.plantId) : undefined;
      rows.push([a.date, data.beds.find((b) => b.id === a.bedId)?.name, p ? plantTitle(p, lang) : '', pr?.name[lang] ?? a.productId, a.amount, pr?.N, pr?.P2O5, pr?.K2O, pr?.organicOK ? tt('common.yes') : tt('common.no'), a.cost]);
    }
    downloadTextFile(`lignee-jardin-apports-${stamp}.csv`, toCSV(rows), 'text/csv');
  };

  const csvTreatments = () => {
    const rows: Array<Array<string | number | undefined>> = [[tt('csv.date'), tt('csv.bed'), tt('csv.plant'), tt('csv.problem'), tt('csv.method'), tt('csv.product'), tt('csv.note')]];
    for (const t of [...data.treatments].sort((x, y) => x.date.localeCompare(y.date))) {
      const p = t.plantId ? data.plants.find((x) => x.id === t.plantId) : undefined;
      const bedId = t.bedId ?? p?.bedId;
      rows.push([t.date, data.beds.find((b) => b.id === bedId)?.name, p ? plantTitle(p, lang) : '', PROBLEM_BY_ID[t.problemId]?.name[lang] ?? t.problemId, tt(`method.${t.method}` as JKey), t.remedyId ? REMEDY_BY_ID[t.remedyId]?.name[lang] : '', t.note]);
    }
    downloadTextFile(`lignee-jardin-interventions-${stamp}.csv`, toCSV(rows), 'text/csv');
  };

  const csvPlants = () => {
    const rows: Array<Array<string | number | undefined>> = [[tt('csv.species'), tt('csv.variety'), tt('csv.bed'), tt('csv.count'), tt('csv.status'), tt('csv.sow'), tt('csv.transplant'), tt('csv.end'), tt('csv.harvest')]];
    for (const p of data.plants) {
      const harvest = data.observations.filter((o) => o.plantId === p.id).reduce((x, o) => x + (o.harvestG ?? 0), 0);
      rows.push([SPECIES_BY_ID[p.speciesId]?.name[lang], p.varietyName, data.beds.find((b) => b.id === p.bedId)?.name, p.count, tt(`status.${p.status}` as JKey), p.sowDate, p.transplantDate, p.endDate, harvest || undefined]);
    }
    downloadTextFile(`lignee-jardin-cultures-${stamp}.csv`, toCSV(rows), 'text/csv');
  };

  return (
    <div className="space-y-4">
      {store.volatile && <Notice tone="warn">{tt('settings.volatile')}</Notice>}
      <Card title={tt('settings.garden')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <Field label={tt('settings.name')}>{(fid) => <TextInput id={fid} value={s.gardenName} onChange={(v) => set({ gardenName: v })} />}</Field>
            </div>
            <Field label={tt('settings.planW')}>{(fid) => <TextInput id={fid} type="number" value={s.planW} onChange={(v) => set({ planW: Math.max(2, Math.min(200, Number(v) || 2)) })} />}</Field>
            <Field label={tt('settings.planH')}>{(fid) => <TextInput id={fid} type="number" value={s.planH} onChange={(v) => set({ planH: Math.max(2, Math.min(200, Number(v) || 2)) })} />}</Field>
            <div className="col-span-2 sm:col-span-4">
              <Field label={tt('settings.planNorth')}>
                {(fid) => (
                  <Select
                    id={fid}
                    value={String(s.planNorth)}
                    onChange={(v) => set({ planNorth: Number(v) })}
                    options={[
                      ...[0, 90, 180, 270].map((d) => ({ v: String(d), l: tt(`north.${d}` as JKey) })),
                      ...([0, 90, 180, 270].includes(s.planNorth) ? [] : [{ v: String(s.planNorth), l: tt('north.custom', { d: s.planNorth }) }]),
                    ]}
                  />
                )}
              </Field>
              <div className="mt-1.5">
                <CompassButton />
              </div>
            </div>
          </div>
          <Block title={tt('onb.where')}>
            <LocationPicker />
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input type="checkbox" checked={s.weather} disabled={s.lat === undefined} onChange={(e) => set({ weather: e.target.checked })} className="mt-1" />
              <span>
                <b>{tt('settings.weather')}</b>
                <span className="block text-xs" style={{ color: INK700 }}>
                  {tt('settings.weatherHint')}
                </span>
              </span>
            </label>
            <p className="mb-1.5 mt-3 text-xs font-medium" style={{ color: INK700 }}>
              {tt('settings.climateRef')}
            </p>
            <ClimatePicker value={s.climate} onChange={(c) => set({ climate: c })} />
          </Block>
          <Block title={tt('onb.what')}>
            <ChoiceChips values={KINDS} selected={s.kinds} onToggle={(v) => set({ kinds: toggle(s.kinds, v) })} prefix="kind" />
          </Block>
          <Block title={tt('onb.how')}>
            <ChoiceChips values={PRACTICES} selected={s.practices} onToggle={(v) => set({ practices: toggle(s.practices, v) })} prefix="practice" />
            <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
              {tt('onb.howHint')}
            </p>
          </Block>
          <div className="grid gap-3 sm:grid-cols-2">
            <Block title={tt('onb.soil')}>
              <TexturePicker value={s.texture} onChange={(t) => set({ texture: t })} />
            </Block>
            <Field label={tt('settings.pH')} hint={tt('settings.pHHint')}>
              {(fid) => <TextInput id={fid} type="number" step={0.1} value={s.pH ?? ''} onChange={(v) => set({ pH: Number(v) >= 3 && Number(v) <= 10 ? Number(v) : undefined })} />}
            </Field>
          </div>
          <Block title={tt('onb.water')}>
            <ChoiceChips values={WATER} selected={s.water} onToggle={(v) => set({ water: toggle(s.water, v) })} prefix="waterSetup" />
            <div className="mt-2 max-w-sm">
              <Field label={tt('settings.rainSource')}>
                {(fid) => <Select id={fid} value={s.rainSource} onChange={(v) => set({ rainSource: v })} options={[{ v: 'average', l: tt(s.weather ? 'settings.rainWeather' : 'settings.rainAverage') }, { v: 'manual', l: tt('settings.rainManual') }]} />}
              </Field>
            </div>
          </Block>
        </div>
      </Card>

      <Card title={tt('settings.display')}>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={s.terrain} onChange={(e) => set({ terrain: e.target.checked })} className="mt-1" />
          <span>
            <b>{tt('settings.terrain')}</b>
            <span className="block text-xs" style={{ color: INK700 }}>
              {tt('settings.terrainHint')}
            </span>
          </span>
        </label>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" checked={s.moon} onChange={(e) => set({ moon: e.target.checked })} className="mt-1" />
          <span>
            <b>🌙 {tt('settings.moon')}</b>
            <span className="block text-xs" style={{ color: INK700 }}>
              {tt('settings.moonHint')}
            </span>
          </span>
        </label>
      </Card>

      <SyncCard />

      <NotificationsCard />

      <GardensCard />

      <Card title={tt('settings.data')}>
        <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('settings.dataLead')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button kind="primary" onClick={exportJSON} disabled={busy}>
            ⬇ {tt('settings.export')}
          </Button>
          <Button kind="ghost" onClick={() => backupRef.current?.click()}>
            ⬆ {tt('settings.import')}
          </Button>
          <input ref={backupRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0]).finally(() => (e.target.value = ''))} />
        </div>
        <p className="mt-3 text-xs font-semibold" style={{ color: INK500 }}>
          {tt('settings.csv')}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Button small kind="ghost" onClick={csvPlants}>
            {tt('settings.csvPlants')}
          </Button>
          <Button small kind="ghost" onClick={csvJournal}>
            {tt('settings.csvJournal')}
          </Button>
          <Button small kind="ghost" onClick={csvInputs}>
            {tt('settings.csvInputs')}
          </Button>
          <Button small kind="ghost" onClick={csvTreatments}>
            {tt('settings.csvTreatments')}
          </Button>
        </div>
      </Card>

      <SpeciesPhotosCard />

      <Card title={tt('settings.lignee')}>
        <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('settings.ligneeLead')}
        </p>
        <div className="mt-3">
          <Button kind="ghost" onClick={() => ligneeRef.current?.click()}>
            ⬆ {tt('settings.ligneeImport')}
          </Button>
          <input ref={ligneeRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importLignee(e.target.files[0]).finally(() => (e.target.value = ''))} />
        </div>
        {data.varieties.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {data.varieties.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2">
                <span>
                  {SPECIES_BY_ID[v.speciesId]?.emoji} {v.name}{' '}
                  <span className="text-xs" style={{ color: INK500 }}>
                    ({speciesName(v.speciesId, lang)}
                    {v.daysToHarvest ? ` · ${tt('sp.harvestV', { lo: v.daysToHarvest, hi: v.daysToHarvest })}` : ''})
                  </span>
                </span>
                <button type="button" onClick={() => store.deleteVariety(v.id)} className="text-xs underline" style={{ color: INK500 }}>
                  {tt('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={tt('settings.about')}>
        <div className="space-y-2 text-sm leading-relaxed" style={{ color: INK700 }}>
          <p>{tt('about.p1')}</p>
          <p>{tt('about.p2')}</p>
          <p>{tt('about.p3')}</p>
          <p className="text-xs">{tt('about.sources')}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button small kind="ghost" onClick={() => set({ onboarded: false })}>
            {tt('settings.replay')}
          </Button>
          <Button small kind="ghost" onClick={() => window.confirm(tt('settings.demoConfirm')) && store.loadDemo()}>
            {tt('settings.demo')}
          </Button>
          <Button
            small
            kind="danger"
            onClick={async () => {
              if (window.confirm(tt('settings.resetConfirm'))) await store.resetAll();
            }}
          >
            {tt('settings.reset')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
