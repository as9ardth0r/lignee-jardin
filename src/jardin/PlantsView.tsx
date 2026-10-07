import { FLOWER_VARIETIES } from './data/flowerVarieties';
import { GnisInfo, GnisSuggest } from './Gnis';
import { COLOR_HEX } from './data/flowers';
import { NurseryView } from './Nursery';
import { MushroomsView } from './Mushrooms';
import { useEffect, useMemo, useState } from 'react';
import { SPECIES, SPECIES_BY_ID } from './data/species';
import { speciesWithType, typeOf, typesOf } from './data/speciesTypes';
import { uid, type Plant, type PlantStatus } from './model';
import { cropCalendar, inWindow, isActiveOn, isPlanted, plantArea, plantsForArea, seasonalType, speciesOf } from './engine/crop';
import { timeline } from './engine/phenology';
import { sunMismatch } from './engine/sun';
import { companionsOf } from './data/speciesExtra';
import { useBedSun } from './GardenView';
import { PhenoPanel, TreatmentList } from './Health';
import { SeasonView } from './Seeds';
import { PlannerView } from './Planner';
import { GrowthPanel } from './Growth';
import { PestPanel } from './Pests';
import { VoicePlayer } from './Voice';
import { bestLot, seedLevel, seedsUsedBy } from './engine/stock';
import { addDays, diffDays, monthOf } from './engine/dates';
import { rotationWarning } from './engine/rotation';
import { fmtDate, fmtG, fmtNum, monthName, plantTitle, speciesName } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { NutritionPanel } from './NutritionPanel';
import { useGarden } from './store';
import { Button, Card, Chip, Empty, Field, INK500, INK700, Meter, Notice, Select, Sheet, TextArea, TextInput, Why } from './ui';

const STATUS_FILTERS: PlantStatus[] = ['growing', 'planned', 'ended'];

export function PlantsView() {
  const { tt } = useJT();
  const [mode, setMode] = useState<'crops' | 'nursery' | 'mushrooms' | 'harvests' | 'plan'>('crops');
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={mode === 'crops'} onClick={() => setMode('crops')}>
          🌱 {tt('plants.modeCrops')}
        </Chip>
        <Chip active={mode === 'nursery'} onClick={() => setMode('nursery')}>
          🪴 {tt('nursery.tab')}
        </Chip>
        <Chip active={mode === 'mushrooms'} onClick={() => setMode('mushrooms')}>
          🍄 {tt('mush.tab')}
        </Chip>
        <Chip active={mode === 'harvests'} onClick={() => setMode('harvests')}>
          🧺 {tt('plants.modeHarvests')}
        </Chip>
        <Chip active={mode === 'plan'} onClick={() => setMode('plan')}>
          🗓 {tt('plants.modePlan')}
        </Chip>
      </div>
      {mode === 'crops' && <CropList />}
      {mode === 'nursery' && <NurseryView />}
      {mode === 'mushrooms' && <MushroomsView />}
      {mode === 'harvests' && (
        <Card title={tt('season.title')}>
          <SeasonView />
        </Card>
      )}
      {mode === 'plan' && (
        <Card title={tt('plan.title')}>
          <PlannerView />
        </Card>
      )}
    </>
  );
}

function CropList() {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const [status, setStatus] = useState<PlantStatus>('growing');
  const [q, setQ] = useState('');
  const list = data.plants
    .filter((p) => p.status === status)
    .filter((p) => !q || plantTitle(p, lang).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (status === 'planned' ? a.sowDate.localeCompare(b.sowDate) : b.sowDate.localeCompare(a.sowDate)));
  return (
    <Card title={tt('plants.title')} action={<Button kind="primary" small onClick={() => nav.open({ type: 'addPlant' })}>+ {tt('quick.plant')}</Button>}>
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {tt(`status.${s}` as JKey)} · {data.plants.filter((p) => p.status === s).length}
          </Chip>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt('plants.search')} aria-label={tt('plants.search')} className="field ml-auto w-40 rounded px-2 py-1 text-sm outline-none" style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }} />
      </div>
      <div className="mt-3">
        {list.length === 0 ? (
          <Empty>{tt('plants.none')}</Empty>
        ) : (
          <ul className="space-y-1.5">
            {list.map((p) => {
              const info = timeline(p, data, today);
              const bed = data.beds.find((b) => b.id === p.bedId);
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => nav.open({ type: 'plant', id: p.id })} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                    <span className="text-2xl" aria-hidden="true">
                      {SPECIES_BY_ID[p.speciesId]?.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{plantTitle(p, lang)}</span>
                      <span className="block text-[11px]" style={{ color: INK500 }}>
                        {bed?.name ?? '—'} · {p.count} {tt('plants.feet')} ·{' '}
                        {p.status === 'planned' ? tt('plants.plannedOn', { date: fmtDate(p.sowDate, lang) }) : `${tt(`stage.${info.stage}` as JKey)} · ${tt('plants.day', { n: info.age })}`}
                      </span>
                      {p.status === 'growing' && (
                        <span className="mt-1 block">
                          <Meter value={info.progress} max={1} color="var(--color-tomato-500)" label={tt('plants.progress', { pct: Math.round(info.progress * 100) })} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

// --- Frise des stades ------------------------------------------------------------

const STAGE_COLOR: Record<string, string> = {
  germination: '#d9c88a',
  vegetative: '#86a870',
  flowering: '#e4b4c8',
  fruiting: '#d9734e',
  bulking: '#c89b3c',
  harvest: '#6c9256',
};

function StageTimeline({ plant }: { plant: Plant }) {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const info = timeline(plant, data, today);
  const total = diffDays(plant.sowDate, info.seasonEnd);
  const yr = (d: string) => d.slice(0, 4) !== plant.sowDate.slice(0, 4);
  const pct = (d: string) => Math.max(0, Math.min(100, (diffDays(plant.sowDate, d) / total) * 100));
  return (
    <figure>
      <div className="relative h-7 w-full overflow-hidden rounded" style={{ background: 'var(--color-paper-300)' }} role="img" aria-label={tt('plant.timelineLabel')}>
        {info.starts.map((s, i) => {
          const end = i + 1 < info.starts.length ? info.starts[i + 1].date : info.seasonEnd;
          return (
            <div key={s.stage} className="absolute inset-y-0 flex items-center overflow-hidden px-1 text-[10px] font-medium" style={{ left: `${pct(s.date)}%`, width: `${pct(end) - pct(s.date)}%`, background: STAGE_COLOR[s.stage], color: 'var(--color-ink-900)', borderRight: '2px solid var(--color-paper-100)' }}>
              <span className="truncate">{tt(`stage.${s.stage}` as JKey)}</span>
            </div>
          );
        })}
        {plant.status !== 'planned' && today <= info.seasonEnd && <div className="absolute inset-y-0 w-0.5" style={{ left: `${pct(today)}%`, background: 'var(--color-ink-900)' }} title={tt('today.today')} />}
      </div>
      <div className="relative mt-1 h-3">
        <div className="absolute h-1.5 rounded-full" style={{ left: `${pct(info.harvestFrom)}%`, width: `${Math.max(2, pct(info.harvestTo) - pct(info.harvestFrom))}%`, background: 'var(--color-tomato-500)' }} />
      </div>
      <figcaption className="flex justify-between text-[11px]" style={{ color: INK500 }}>
        <span>{fmtDate(plant.sowDate, lang)}</span>
        <span>
          {tt(speciesOf(plant).type === 'flower' ? 'plant.bloomWindow' : 'plant.harvestWindow', { from: fmtDate(info.harvestFrom, lang, yr(info.harvestFrom)), to: fmtDate(info.harvestTo, lang, yr(info.harvestTo)) })}
        </span>
        <span>{fmtDate(info.seasonEnd, lang, yr(info.seasonEnd))}</span>
      </figcaption>
    </figure>
  );
}

// --- Fiche d'une culture --------------------------------------------------------

function Thumb({ id, onOpen }: { id: string; onOpen: (url: string) => void }) {
  const { photoURL } = useGarden();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    photoURL(id, 'thumb').then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [id, photoURL]);
  if (!url) return <span className="inline-block h-16 w-16 rounded" style={{ background: 'var(--color-paper-300)' }} />;
  return (
    <button type="button" onClick={() => photoURL(id, 'full').then((u) => u && onOpen(u))} className="h-16 w-16 overflow-hidden rounded">
      <img src={url} alt="" className="h-full w-full object-cover" />
    </button>
  );
}

export function Journal({ plantId, bedId }: { plantId?: string; bedId?: string }) {
  const store = useGarden();
  const { tt, lang } = useJT();
  const [full, setFull] = useState<string | null>(null);
  const list = store.data.observations.filter((o) => (plantId ? o.plantId === plantId : o.bedId === bedId && !o.plantId)).sort((a, b) => b.date.localeCompare(a.date));
  if (list.length === 0) return <Empty>{tt('journal.empty')}</Empty>;
  return (
    <>
      <ul className="space-y-3">
        {list.map((o) => (
          <li key={o.id} className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold">
                {fmtDate(o.date, lang, true)}
                {o.health ? ` · ${tt(`health.${o.health}` as JKey)}` : ''}
              </span>
              <button type="button" onClick={() => window.confirm(tt('journal.deleteConfirm')) && store.deleteObservation(o.id)} className="text-[11px] underline" style={{ color: INK500 }}>
                {tt('common.delete')}
              </button>
            </div>
            {o.note && <p className="mt-1 whitespace-pre-wrap text-sm leading-snug">{o.note}</p>}
            {(o.heightCm || o.fruits || o.harvestG || o.stems) && (
              <p className="mt-1 text-xs" style={{ color: INK700 }}>
                {[o.heightCm ? tt('journal.heightV', { cm: o.heightCm }) : '', o.fruits ? tt('journal.fruitsV', { n: o.fruits }) : '', o.harvestG ? tt('journal.harvestV', { w: fmtG(o.harvestG, lang) }) : '', o.stems ? tt('journal.stemsV', { n: o.stems }) : ''].filter(Boolean).join(' · ')}
              </p>
            )}
            {o.audioIds && o.audioIds.length > 0 && (
              <div className="mt-2 space-y-1">
                {o.audioIds.map((id, i) => (
                  <VoicePlayer key={id} id={id} n={i + 1} />
                ))}
              </div>
            )}
            {o.photoIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {o.photoIds.map((id) => (
                  <Thumb key={id} id={id} onOpen={setFull} />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      {full && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setFull(null)} role="dialog" aria-label={tt('journal.photo')}>
          <img src={full} alt="" className="max-h-full max-w-full rounded" />
        </div>
      )}
    </>
  );
}

export function PlantSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const p = data.plants.find((x) => x.id === id);
  if (!p) return null;
  const sp = SPECIES_BY_ID[p.speciesId];
  const bed = data.beds.find((b) => b.id === p.bedId);
  const info = timeline(p, data, today);
  const harvested = data.observations.filter((o) => o.plantId === p.id).reduce((s, o) => s + (o.harvestG ?? 0), 0);

  return (
    <Sheet
      title={
        <span>
          {sp.emoji} {plantTitle(p, lang)}
        </span>
      }
      onClose={onClose}
      closeLabel={tt('common.close')}
    >
      <div className="space-y-5">
        <section>
          <p className="text-sm" style={{ color: INK700 }}>
            <i>{sp.latin}</i>
            {p.typeId && p.varietyName && typeOf(p.speciesId, p.typeId) ? ` · ${typeOf(p.speciesId, p.typeId)!.name[lang]}` : ''} · {bed?.name ?? '—'} · {p.count} {tt('plants.feet')} · {fmtNum(plantArea(p), lang, 1)} m²
            {p.indoor ? ` · ${tt('plant.indoor')}` : ''}
          </p>
          <p className="mt-1 text-sm">
            <b>{tt(`status.${p.status}` as JKey)}</b>
            {p.status === 'growing' && ` · ${tt(`stage.${info.stage}` as JKey)} · ${tt('plants.day', { n: info.age })}`}
            {p.status === 'planned' && ` · ${tt('plants.plannedOn', { date: fmtDate(p.sowDate, lang) })}`}
            {p.transplantDate && ` · ${tt('plant.transplantedOn', { date: fmtDate(p.transplantDate, lang) })}`}
            {harvested > 0 && ` · ${tt('plant.harvested', { w: fmtG(harvested, lang) })}`}
          </p>
          <div className="mt-3">
            <StageTimeline plant={p} />
            <PhenoPanel plant={p} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.status === 'planned' && (
              <Button kind="primary" small onClick={() => store.savePlant({ ...p, status: 'growing', sowDate: today })}>
                {isPlanted(sp) ? tt('plant.markPlanted') : tt('plant.markSown')}
              </Button>
            )}
            {p.status === 'growing' && p.indoor && !p.transplantDate && (
              <Button kind="primary" small onClick={() => store.savePlant({ ...p, transplantDate: today })}>
                {tt('plant.markTransplanted')}
              </Button>
            )}
            {p.status === 'growing' && (
              <Button small onClick={() => window.confirm(tt('plant.endConfirm')) && store.savePlant({ ...p, status: 'ended', endDate: today })}>
                {tt('plant.markEnded')}
              </Button>
            )}
            {p.status === 'ended' && (
              <Button small onClick={() => store.savePlant({ ...p, status: 'growing', endDate: undefined })}>
                {tt('plant.reopen')}
              </Button>
            )}
            <Button small kind="ghost" onClick={() => nav.open({ type: 'addPlant', editId: p.id })}>
              ✎ {tt('common.edit')}
            </Button>
            <Button small kind="ghost" onClick={() => nav.open({ type: 'species', id: sp.id })}>
              📖 {tt('plant.sheet')}
            </Button>
          </div>
          {p.note && <p className="mt-2 text-sm italic" style={{ color: INK700 }}>{p.note}</p>}
        </section>

        <GrowthPanel plant={p} />

        <NutritionPanel plant={p} />

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg">🐞 {tt('treat.title')}</h3>
            <Button small kind="primary" onClick={() => nav.open({ type: 'diagnose', plantId: p.id })}>
              🔍 {tt('diag.open')}
            </Button>
          </div>
          <TreatmentList plantId={p.id} />
          <PestPanel plantId={p.id} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg">📷 {tt('journal.title')}</h3>
            <Button small kind="primary" onClick={() => nav.open({ type: 'observe', plantId: p.id })}>
              + {tt('quick.observe')}
            </Button>
          </div>
          <Journal plantId={p.id} />
        </section>

        <section className="border-t pt-4" style={{ borderColor: 'var(--color-paper-300)' }}>
          <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
            💡 {sp.note[lang]}
          </p>
          <div className="mt-3">
            <Button
              kind="danger"
              small
              onClick={() => {
                if (window.confirm(tt('plant.deleteConfirm'))) {
                  store.deletePlant(p.id);
                  onClose();
                }
              }}
            >
              {tt('plant.delete')}
            </Button>
          </div>
        </section>
      </div>
    </Sheet>
  );
}

// --- Ajouter ou modifier une culture ----------------------------------------------

function windowsText(ranges: Array<[number, number]>, lang: 'fr' | 'en'): string {
  return ranges.map(([a, b]) => (a === b ? monthName(a, lang) : `${monthName(a, lang)} – ${monthName(b, lang)}`)).join(', ');
}

export function AddPlantSheet({ bedId, speciesId, typeId: initialType, editId, indoor: indoorInit, varietyName: varietyInit, onClose }: { bedId?: string; speciesId?: string; typeId?: string; editId?: string; indoor?: boolean; varietyName?: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const editing = editId ? data.plants.find((p) => p.id === editId) : undefined;
  const [spId, setSpId] = useState(editing?.speciesId ?? speciesId ?? 'tomato');
  const types = typesOf(spId);
  // Type par défaut : celui dont c'est la saison de semis ou de plantation.
  const [typeId, setTypeId] = useState(editing ? editing.typeId ?? '' : initialType ?? seasonalType(speciesId ?? 'tomato', today, data.settings.climate));
  const sp = speciesWithType(SPECIES_BY_ID[spId], typeId || undefined);
  const typeInfo = typeOf(spId, typeId || undefined);
  // Exemple de variété : celles du type choisi, sinon l'exemple générique (tomates).
  const varietyHint = typeInfo?.examples ?? (types[0]?.examples ? types.map((t) => t.examples?.split(',')[0]).join(', ') : spId === 'tomato' ? tt('add.varietyPlaceholder') : '');
  const [bed, setBed] = useState(editing?.bedId ?? bedId ?? data.beds[0]?.id ?? '');
  const [varietyId, setVarietyId] = useState(editing?.varietyId ?? '');
  const [varietyName, setVarietyName] = useState(editing?.varietyName ?? varietyInit ?? '');
  const [count, setCount] = useState(String(editing?.count ?? ''));
  const [area, setArea] = useState(editing?.area ? String(editing.area) : '');
  const [indoor, setIndoor] = useState(editing?.indoor ?? (indoorInit && Boolean(sp.sowIndoor) ? true : Boolean(sp.sowIndoor && !sp.sowOutdoor)));
  const [date, setDate] = useState(editing?.sowDate ?? today);
  const [transplant, setTransplant] = useState(editing?.transplantDate ?? '');
  const [yieldT, setYieldT] = useState(editing?.yieldTarget ? String(editing.yieldTarget) : '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [spQuery, setSpQuery] = useState('');
  const [lotId, setLotId] = useState<string | undefined>(editing ? editing.seedLotId : undefined);

  const cal = cropCalendar(sp, data.settings.climate);
  const varieties = data.varieties.filter((v) => v.speciesId === spId);
  const bedObj = data.beds.find((b) => b.id === bed);
  const defaultCount = bedObj ? plantsForArea(sp, Math.min(bedObj.w * bedObj.h, 2)) : 1;
  const nCount = Math.max(1, Math.round(Number(count) || defaultCount));
  const rot = bed ? rotationWarning(bed, sp, data.plants, date, editing?.id) : null;
  const bedSunAll = useBedSun();
  const exposure = bed ? bedSunAll.get(bed)?.exposure : undefined;
  const sunWarn = exposure && sunMismatch(sp.sun, exposure);
  const neighbours = new Set(data.plants.filter((p) => p.bedId === bed && p.id !== editing?.id && p.status !== 'ended' && (p.status === 'planned' || isActiveOn(p, date))).map((p) => p.speciesId));
  const companions = companionsOf(spId).filter((c) => neighbours.has(c.other));
  const month = monthOf(date);
  const windows = indoor ? cal.sowIndoor : isPlanted(sp) ? cal.plantOut : cal.sowOutdoor.length ? cal.sowOutdoor : cal.plantOut;
  const outOfWindow = windows.length > 0 && !inWindow(month, windows);
  const speciesOptions = useMemo(() => {
    const ql = spQuery.trim().toLowerCase();
    return SPECIES.filter((s) => !ql || s.name[lang].toLowerCase().includes(ql) || s.latin.toLowerCase().includes(ql)).sort((a, b) => a.name[lang].localeCompare(b.name[lang]));
  }, [spQuery, lang]);

  const pickSpecies = (id: string) => {
    setSpId(id);
    const t = editing ? '' : seasonalType(id, today, data.settings.climate);
    setTypeId(t);
    const next = SPECIES_BY_ID[id] ? speciesWithType(SPECIES_BY_ID[id], t || undefined) : undefined;
    if (next && !editing) setIndoor(Boolean(next.sowIndoor && (indoorInit || !next.sowOutdoor) && !isPlanted(next)));
  };

  const pickType = (t: string) => {
    setTypeId(t);
    const next = speciesWithType(SPECIES_BY_ID[spId], t || undefined);
    if (!editing) setIndoor(Boolean(next.sowIndoor && (indoorInit || !next.sowOutdoor) && !isPlanted(next)));
  };

  // Lot de graines : le meilleur par défaut pour une nouvelle culture, « aucun » possible.
  const lots = data.seeds.filter((l) => l.speciesId === spId);
  const autoLot = editing ? undefined : bestLot(data, spId, today)?.id;
  const chosenLot = lotId === undefined ? autoLot ?? '' : lotId;
  const lot = lots.find((l) => l.id === chosenLot);
  const lotLevel = lot ? seedLevel(lot, data.plants.filter((p) => p.id !== editing?.id)) : undefined;
  const lotNeed = lot ? seedsUsedBy({ speciesId: spId, count: nCount } as Plant, lot) : 0;

  const save = () => {
    if (!bed) return;
    const v = varieties.find((x) => x.id === varietyId);
    const plant: Plant = {
      id: editing?.id ?? uid('pl'),
      speciesId: spId,
      typeId: typeInfo?.id,
      varietyId: v?.id,
      varietyName: v ? v.name : varietyName.trim() || undefined,
      bedId: bed,
      count: nCount,
      area: Number(area.replace(',', '.')) > 0 ? Number(area.replace(',', '.')) : undefined,
      indoor: indoor && !isPlanted(sp),
      status: editing?.status === 'ended' ? 'ended' : date > today ? 'planned' : 'growing',
      sowDate: date,
      transplantDate: indoor && transplant ? transplant : undefined,
      endDate: editing?.endDate,
      yieldTarget: Number(yieldT.replace(',', '.')) > 0 ? Number(yieldT.replace(',', '.')) : undefined,
      note: note.trim() || undefined,
      seedLotId: lots.some((l) => l.id === chosenLot) ? chosenLot || undefined : undefined,
      createdAt: editing?.createdAt ?? today,
    };
    store.savePlant(plant);
    onClose();
    nav.open({ type: 'plant', id: plant.id });
  };

  if (data.beds.length === 0) {
    return (
      <Sheet title={tt('add.title')} onClose={onClose} closeLabel={tt('common.close')}>
        <Notice>{tt('add.needBed')}</Notice>
        <div className="mt-3">
          <Button
            kind="primary"
            onClick={() => {
              onClose();
              nav.setTab('garden');
            }}
          >
            {tt('today.goGarden')}
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title={editing ? tt('add.editTitle') : tt('add.title')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <Field label={tt('add.species')}>
          {(fid) => (
            <div>
              <input value={spQuery} onChange={(e) => setSpQuery(e.target.value)} placeholder={tt('catalog.search')} aria-label={tt('catalog.search')} className="field mb-1.5 w-full rounded px-2.5 py-1.5 text-sm outline-none" style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }} />
              <select id={fid} value={spId} onChange={(e) => pickSpecies(e.target.value)} size={5} className="field w-full rounded px-1 py-1 text-sm outline-none" style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }}>
                {speciesOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name[lang]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </Field>

        {types.length > 0 && (
          <Field label={tt('add.type')} hint={tt('add.typeHint')}>
            {(fid) => (
              <div>
                <Select id={fid} value={typeId} onChange={pickType} options={[{ v: '', l: tt('add.typeAll') }, ...types.map((t) => ({ v: t.id, l: t.name[lang] }))]} />
                {typeInfo && (
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: INK700 }}>
                    {typeInfo.note[lang]}
                    {typeInfo.examples && <span style={{ color: INK500 }}> — {tt('types.examples', { list: typeInfo.examples })}</span>}
                  </p>
                )}
              </div>
            )}
          </Field>
        )}

        <Notice>
          {sp.emoji} <b>{typeInfo ? typeInfo.name[lang] : sp.name[lang]}</b> — {tt('add.calendar')}{' '}
          {[
            cal.sowIndoor.length ? `${tt('cal.sowIndoor')} ${windowsText(cal.sowIndoor, lang)}` : '',
            cal.sowOutdoor.length ? `${tt('cal.sowOutdoor')} ${windowsText(cal.sowOutdoor, lang)}` : '',
            cal.plantOut.length ? `${tt('cal.plantOut')} ${windowsText(cal.plantOut, lang)}` : '',
          ]
            .filter(Boolean)
            .join(' · ')}{' '}
          · {tt('add.spacing', { row: sp.spacing.row, inRow: sp.spacing.inRow })}
        </Notice>

        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('add.bed')}>{(fid) => <Select id={fid} value={bed} onChange={setBed} options={data.beds.map((b) => ({ v: b.id, l: b.name }))} />}</Field>
          <Field label={tt('add.variety')}>
            {(fid) =>
              varieties.length ? (
                <Select id={fid} value={varietyId} onChange={setVarietyId} options={[{ v: '', l: tt('add.varietyFree') }, ...varieties.map((v) => ({ v: v.id, l: v.name }))]} />
              ) : (
                <TextInput id={fid} value={varietyName} onChange={setVarietyName} placeholder={varietyHint} />
              )
            }
          </Field>
          {varieties.length > 0 && !varietyId && (
            <Field label={tt('add.varietyName')}>{(fid) => <TextInput id={fid} value={varietyName} onChange={setVarietyName} placeholder={varietyHint} />}</Field>
          )}
          {!varietyId && <GnisSuggest speciesId={spId} value={varietyName} onPick={setVarietyName} />}
          <GnisInfo speciesId={spId} name={varietyId ? varieties.find((v) => v.id === varietyId)?.name : varietyName} />
          {!varietyId && (FLOWER_VARIETIES[spId]?.length ?? 0) > 0 && (
            <div className="col-span-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span style={{ color: INK500 }}>{tt('fvar.suggest')}</span>
              {FLOWER_VARIETIES[spId].map((v) => (
                <Chip key={v.name} active={varietyName === v.name} onClick={() => setVarietyName(v.name)}>
                  <span className="mr-1 inline-flex gap-0.5 align-middle">
                    {v.colors.slice(0, 2).map((c) => (
                      <span key={c} className="inline-block h-2 w-2 rounded-full" style={{ background: COLOR_HEX[c] }} />
                    ))}
                  </span>
                  {v.name}
                </Chip>
              ))}
            </div>
          )}
          <Field label={tt('add.count')} hint={tt('add.countHint', { n: defaultCount })}>
            {(fid) => <TextInput id={fid} type="number" min={1} value={count} onChange={setCount} placeholder={String(defaultCount)} />}
          </Field>
          <Field label={tt('add.area')} hint={tt('add.areaHint', { m2: fmtNum((nCount * sp.spacing.row * sp.spacing.inRow) / 10000, lang, 2) })}>
            {(fid) => <TextInput id={fid} type="number" step={0.1} value={area} onChange={setArea} />}
          </Field>
        </div>

        {!isPlanted(sp) && sp.sowIndoor && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={indoor} onChange={(e) => setIndoor(e.target.checked)} /> {tt('add.indoor')}
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={isPlanted(sp) ? tt('add.plantDate') : tt('add.sowDate')} hint={date > today ? tt('add.futureHint') : undefined}>
            {(fid) => <TextInput id={fid} type="date" value={date} onChange={(v) => v && setDate(v)} />}
          </Field>
          {indoor && !isPlanted(sp) && (
            <Field label={tt('add.transplantDate')} hint={sp.transplantAfter ? tt('add.transplantHint', { date: fmtDate(addDays(date, sp.transplantAfter), lang) }) : undefined}>
              {(fid) => <TextInput id={fid} type="date" value={transplant} onChange={setTransplant} />}
            </Field>
          )}
          {sp.type !== 'flower' && (
            <Field label={tt('add.yield')} hint={tt('add.yieldHint', { lo: sp.yieldM2[0], hi: sp.yieldM2[1] })}>
              {(fid) => <TextInput id={fid} type="number" step={0.1} value={yieldT} onChange={setYieldT} placeholder={fmtNum((sp.yieldM2[0] + sp.yieldM2[1]) / 2, lang, 1)} />}
            </Field>
          )}
        </div>

        {lots.length > 0 && (
          <div>
            <Field label={tt('add.seedLot')}>
              {(fid) => (
                <Select
                  id={fid}
                  value={chosenLot}
                  onChange={(v) => setLotId(v)}
                  options={[{ v: '', l: tt('add.seedLotNone') }, ...lots.map((l) => ({ v: l.id, l: `${l.year}${l.varietyName ? ` · ${l.varietyName}` : ''}${l.seeds !== undefined ? ` · ${tt('seeds.left', { n: seedLevel(l, data.plants.filter((p) => p.id !== editing?.id)).remaining ?? 0 })}` : ''}` }))]}
                />
              )}
            </Field>
            {lot && (
              <p className="mt-1 text-xs" style={{ color: lotLevel?.remaining !== undefined && lotLevel.remaining < lotNeed ? '#a5532f' : INK500 }}>
                {lotLevel?.remaining !== undefined ? tt('add.seedLotUse', { n: lotNeed, left: Math.max(0, lotLevel.remaining - lotNeed) }) : tt('add.seedLotUseUnknown', { n: lotNeed })}
              </p>
            )}
          </div>
        )}

        {outOfWindow && <Notice tone="warn">{tt('add.outOfWindow', { months: windowsText(windows, lang) })}</Notice>}
        {rot && (
          <Notice tone="warn">
            {tt('add.rotation', { family: tt(`family.${sp.family}` as JKey), prev: speciesName(rot.previous.speciesId, lang), years: fmtNum(rot.years, lang, 1), wanted: rot.wanted })}
          </Notice>
        )}

        {sunWarn && <Notice tone="warn">{tt('add.sunWarn', { need: tt(`sunNeed.${sp.sun}` as JKey), got: tt(`sun.${exposure}` as JKey) })}</Notice>}
        {companions.map((c) => (
          <Notice key={c.other} tone={c.effect === 'good' ? 'good' : 'warn'}>
            {tt(c.effect === 'good' ? 'add.companionGood' : 'add.companionBad', { other: speciesName(c.other, lang) })} {c.why[lang]} <i>({tt(`evidence.${c.evidence}` as JKey)})</i>
          </Notice>
        ))}

        <Field label={tt('add.note')}>{(fid) => <TextArea id={fid} value={note} onChange={setNote} />}</Field>

        <Why label={tt('common.why')}>
          <p>{tt('add.why')}</p>
        </Why>

        <div className="flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button kind="primary" onClick={save} disabled={!bed}>
            {editing ? tt('common.save') : tt('add.submit')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
