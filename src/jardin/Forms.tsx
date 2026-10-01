import { useState } from 'react';
import { VoiceRecorder, type VoiceClip } from './Voice';
import { SPECIES_BY_ID } from './data/species';
import { uid, type Health } from './model';
import { bedArea } from './engine/water';
import { fmtNum, plantTitle } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Chip, Field, INK500, Notice, Select, Sheet, TextArea, TextInput } from './ui';

const num = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Nouvelle observation : note, mesures, état sanitaire, photos. */
export function ObservationSheet({ plantId, bedId, onClose }: { plantId?: string; bedId?: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const growing = data.plants.filter((p) => p.status !== 'planned');
  const [target, setTarget] = useState(plantId ? `p:${plantId}` : bedId ? `b:${bedId}` : growing[0] ? `p:${growing[0].id}` : data.beds[0] ? `b:${data.beds[0].id}` : '');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [height, setHeight] = useState('');
  const [fruits, setFruits] = useState('');
  const [harvest, setHarvest] = useState('');
  const [health, setHealth] = useState<Health | undefined>();
  const [files, setFiles] = useState<File[]>([]);
  const [clips, setClips] = useState<VoiceClip[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const options = [
    ...growing.map((p) => ({ v: `p:${p.id}`, l: `${SPECIES_BY_ID[p.speciesId]?.emoji ?? ''} ${plantTitle(p, lang)} (${data.beds.find((b) => b.id === p.bedId)?.name ?? ''})` })),
    ...data.beds.map((b) => ({ v: `b:${b.id}`, l: `▭ ${b.name}` })),
  ];

  const save = async () => {
    if (!target) return;
    setBusy(true);
    setError(false);
    const [kind, id] = target.split(':');
    const p = kind === 'p' ? data.plants.find((x) => x.id === id) : undefined;
    try {
      await store.addObservation(
        {
          plantId: p?.id,
          bedId: p ? p.bedId : id,
          date,
          note: note.trim(),
          heightCm: num(height),
          fruits: num(fruits),
          harvestG: num(harvest),
          health,
        },
        files,
        clips.map((c) => ({ blob: c.blob, duration: c.duration })),
      );
      nav.toast(tt('toast.observed'));
      onClose();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (options.length === 0)
    return (
      <Sheet title={tt('obs.title')} onClose={onClose} closeLabel={tt('common.close')}>
        <Notice>{tt('add.needBed')}</Notice>
      </Sheet>
    );

  return (
    <Sheet title={tt('obs.title')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('obs.target')}>{(fid) => <Select id={fid} value={target} onChange={setTarget} options={options} />}</Field>
          <Field label={tt('obs.date')}>{(fid) => <TextInput id={fid} type="date" value={date} onChange={(v) => v && setDate(v)} />}</Field>
        </div>
        <Field label={tt('obs.photos')} hint={tt('obs.photosHint')}>
          {(fid) => (
            <input
              id={fid}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))}
              className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:px-3 file:py-2 file:text-sm"
            />
          )}
        </Field>
        {files.length > 0 && (
          <p className="text-xs" style={{ color: INK500 }}>
            {tt('obs.photoCount', { n: files.length })}
          </p>
        )}
        <Field label={tt('obs.note')}>{(fid) => <TextArea id={fid} value={note} onChange={setNote} placeholder={tt('obs.notePlaceholder')} />}</Field>
        <div>
          <p className="mb-1 text-xs font-medium">{tt('voice.title')}</p>
          <VoiceRecorder clips={clips} onChange={setClips} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label={tt('obs.height')}>{(fid) => <TextInput id={fid} type="number" value={height} onChange={setHeight} />}</Field>
          <Field label={tt('obs.fruits')}>{(fid) => <TextInput id={fid} type="number" value={fruits} onChange={setFruits} />}</Field>
          <Field label={tt('obs.harvest')}>{(fid) => <TextInput id={fid} type="number" value={harvest} onChange={setHarvest} />}</Field>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium">{tt('obs.health')}</p>
          <div className="flex flex-wrap gap-1.5">
            {(['good', 'watch', 'sick'] as Health[]).map((h) => (
              <Chip key={h} active={health === h} onClick={() => setHealth(health === h ? undefined : h)}>
                {tt(`health.${h}` as JKey)}
              </Chip>
            ))}
          </div>
        </div>
        {error && <Notice tone="warn">{tt('obs.error')}</Notice>}
        <div className="flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button kind="primary" onClick={save} disabled={busy || !target}>
            {busy ? tt('obs.saving') : tt('common.save')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/** Noter une pluie (mm, tout le jardin) ou un arrosage (litres, une planche). */
export function WaterSheet({ bedId, kind = 'irrigation', liters, onClose }: { bedId?: string; kind?: 'rain' | 'irrigation'; liters?: number; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [k, setK] = useState(kind);
  const [bed, setBed] = useState(bedId ?? data.beds[0]?.id ?? '');
  const [amount, setAmount] = useState(liters ? String(liters) : '');
  const [date, setDate] = useState(today);
  const bedObj = data.beds.find((b) => b.id === bed);
  const qty = num(amount);
  const save = () => {
    if (!qty) return;
    store.addWater({ kind: k, amount: qty, date, bedId: k === 'irrigation' ? bed : undefined });
    nav.toast(k === 'rain' ? tt('toast.rain') : tt('toast.watered', { liters: `${fmtNum(qty, lang, 1)} L` }));
    onClose();
  };
  return (
    <Sheet title={k === 'rain' ? tt('water.logRain') : tt('water.logIrrigation')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <div className="flex gap-1.5">
          <Chip active={k === 'irrigation'} onClick={() => setK('irrigation')}>
            💧 {tt('quick.irrigation')}
          </Chip>
          <Chip active={k === 'rain'} onClick={() => setK('rain')}>
            🌧 {tt('quick.rain')}
          </Chip>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {k === 'irrigation' && (
            <Field label={tt('add.bed')}>{(fid) => <Select id={fid} value={bed} onChange={setBed} options={data.beds.map((b) => ({ v: b.id, l: b.name }))} />}</Field>
          )}
          <Field
            label={k === 'rain' ? tt('water.mm') : tt('water.liters')}
            hint={k === 'irrigation' && bedObj && qty ? tt('water.equiv', { mm: fmtNum(qty / bedArea(bedObj), lang, 1) }) : k === 'rain' ? tt('water.rainHint') : undefined}
          >
            {(fid) => <TextInput id={fid} type="number" value={amount} onChange={setAmount} />}
          </Field>
          <Field label={tt('obs.date')}>{(fid) => <TextInput id={fid} type="date" value={date} onChange={(v) => v && setDate(v)} />}</Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button kind="primary" onClick={save} disabled={!qty || (k === 'irrigation' && !bed)}>
            {tt('common.save')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/** Tâche saisie à la main. */
export function TaskSheet({ onClose }: { onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt } = useJT();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(today);
  const [bed, setBed] = useState('');
  const save = () => {
    if (!title.trim()) return;
    store.saveTask({ id: uid('task'), title: title.trim(), due, bedId: bed || undefined });
    onClose();
  };
  return (
    <Sheet title={tt('task.add')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <Field label={tt('task.title')}>{(fid) => <TextInput id={fid} value={title} onChange={setTitle} placeholder={tt('task.placeholder')} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('task.due')}>{(fid) => <TextInput id={fid} type="date" value={due} onChange={(v) => v && setDue(v)} />}</Field>
          <Field label={tt('add.bed')}>{(fid) => <Select id={fid} value={bed} onChange={setBed} options={[{ v: '', l: '—' }, ...data.beds.map((b) => ({ v: b.id, l: b.name }))]} />}</Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button kind="primary" onClick={save} disabled={!title.trim()}>
            {tt('common.save')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
