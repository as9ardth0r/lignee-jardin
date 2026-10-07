/**
 * Cultures → Champignons : mes cultures (de la gélose à la récolte), les
 * espèces cultivables, le labo (guides et calculateurs) et l'aide aux
 * problèmes (contaminations, fructification).
 */
import { useMemo, useState } from 'react';
import { LAB_GUIDES, MUSH_PROBLEMS, MUSHROOM_BY_ID, MUSHROOMS, PROBLEM_COLORS, SUBSTRATE_BY_ID, SUBSTRATES, type MushMethod, type MushroomSpecies, type ProblemColor, type SubstrateId } from './data/mushrooms';
import { bedFor, childStage, colonRange, generation, jarsFor, labRecipe, lineage, mushInfo, MUSH_STAGES, plugsFor, spawnFor, strainOf, strainRanking, waterToAdd, wetWeight, DRY_GRAIN_KG_PER_L, type MushNext } from './engine/mushroom';
import { addDays } from './engine/dates';
import { shiftWindows } from './engine/crop';
import { fmtDate, fmtNum } from './format';
import { useJT, type JKey } from './i18n';
import { uid, type MushBatch, type MushStage, type MushStatus } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Chip, Empty, Field, INK500, INK700, Notice, Select, Sheet, TextArea, TextInput, Why } from './ui';
import { PhotoStrip, SpeciesHero, SpeciesIcon, useCachedSpecies } from './Photos';
import { YearCalendar } from './CatalogView';

const STAGE_ICON: Record<MushStage, string> = { agar: '🧫', lc: '🧪', grain: '🌾', substrate: '🛍', log: '🪵', bed: '🟫' };
const STATUS_COLOR: Record<MushStatus, [string, string]> = {
  incubating: ['#f3e6d2', '#6a4a1c'],
  colonized: ['#e6efdc', '#2f4a22'],
  fruiting: ['#e3ecf3', '#24485e'],
  resting: ['var(--color-paper-200)', 'var(--color-ink-700)'],
  done: ['var(--color-paper-200)', 'var(--color-ink-500)'],
  contam: ['#f6dcd4', '#8a2e14'],
};

function useMushName() {
  const { lang } = useJT();
  return (b: Pick<MushBatch, 'speciesId'> & { strain?: string }) => {
    const sp = MUSHROOM_BY_ID[b.speciesId];
    return `${sp?.name[lang] ?? b.speciesId}${b.strain ? ` · ${b.strain}` : ''}`;
  };
}

/** Texte de la prochaine action. */
export function nextText(tt: ReturnType<typeof useJT>['tt'], next: MushNext, sp: MushroomSpecies, b: MushBatch): string {
  return tt(`mush.next.${next}` as JKey, { stage: tt(`mush.stage.${b.stage}` as JKey), days: sp.restDays });
}

export function MushroomsView() {
  const { tt } = useJT();
  const [tab, setTab] = useState<'cultures' | 'species' | 'lab' | 'problems'>('cultures');
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={tab === 'cultures'} onClick={() => setTab('cultures')}>
          🍄 {tt('mush.tabCultures')}
        </Chip>
        <Chip active={tab === 'species'} onClick={() => setTab('species')}>
          📖 {tt('mush.tabSpecies')}
        </Chip>
        <Chip active={tab === 'lab'} onClick={() => setTab('lab')}>
          🧫 {tt('mush.tabLab')}
        </Chip>
        <Chip active={tab === 'problems'} onClick={() => setTab('problems')}>
          🔍 {tt('mush.tabProblems')}
        </Chip>
      </div>
      {tab === 'cultures' && (
        <>
          <CultureList />
          <Strains />
        </>
      )}
      {tab === 'species' && <SpeciesList />}
      {tab === 'lab' && <LabView />}
      {tab === 'problems' && <ProblemsView />}
    </>
  );
}

// --- Mes cultures ---------------------------------------------------------------------------------

function CultureList() {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const nameOf = useMushName();
  const [ended, setEnded] = useState(false);
  const all = data.mushrooms ?? [];
  const list = all
    .filter((b) => MUSHROOM_BY_ID[b.speciesId])
    .filter((b) => (ended ? b.status === 'done' || b.status === 'contam' : b.status !== 'done' && b.status !== 'contam'))
    .map((b) => ({ b, i: mushInfo(b, today) }))
    .sort((x, y) => (ended ? (y.b.ended ?? y.b.started).localeCompare(x.b.ended ?? x.b.started) : x.i.due.localeCompare(y.i.due)));
  return (
    <Card
      title={`🍄 ${tt('mush.title')}`}
      action={
        <Button kind="primary" small onClick={() => nav.open({ type: 'mushroom' })}>
          + {tt('mush.new')}
        </Button>
      }
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        <Chip active={!ended} onClick={() => setEnded(false)}>
          {tt('mush.running')}
        </Chip>
        <Chip active={ended} onClick={() => setEnded(true)}>
          {tt('mush.finished')}
        </Chip>
      </div>
      {list.length === 0 ? (
        ended ? (
          <Empty>{tt('mush.noneEnded')}</Empty>
        ) : (
          <div className="space-y-2 text-sm leading-relaxed" style={{ color: INK700 }}>
            <p>{tt('mush.emptyLead')}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{tt('mush.emptyKit')}</li>
              <li>{tt('mush.emptyOutdoor')}</li>
              <li>{tt('mush.emptyLab')}</li>
            </ul>
          </div>
        )
      ) : (
        <ul className="space-y-2">
          {list.map(({ b, i }) => {
            const [bg, fg] = STATUS_COLOR[b.status];
            return (
              <li key={b.id}>
                <button type="button" onClick={() => nav.open({ type: 'mushroom', id: b.id })} className="w-full rounded px-3 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">
                      {STAGE_ICON[b.stage]} {nameOf({ speciesId: b.speciesId, strain: strainOf(b, all) })}
                    </span>
                    <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: bg, color: fg }}>
                      {tt(`mush.status.${b.status}` as JKey)}
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: INK500 }}>
                    {tt(`mush.stage.${b.stage}` as JKey)}
                    {b.qty > 1 ? ` ×${b.qty}` : ''}
                    {generation(b, all) > 0 ? ` · G${generation(b, all)}` : ''} · {tt('mush.since', { date: fmtDate(b.started, lang) })}
                    {i.totalG > 0 ? ` · ${fmtNum(i.totalG / 1000, lang, 2)} kg` : ''}
                    {i.be !== undefined ? ` · ${tt('mush.beShort', { be: Math.round(i.be) })}` : ''}
                  </p>
                  {b.status === 'incubating' && (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded" style={{ background: 'var(--color-paper-300)' }}>
                      <div className="h-full" style={{ width: `${Math.round(i.progress * 100)}%`, background: '#c89b3c' }} />
                    </div>
                  )}
                  {i.next !== 'none' && (
                    <p className="mt-1 text-xs" style={{ color: INK700 }}>
                      → {nextText(tt, i.next, i.species, b)}
                      {i.due > today ? ` (${fmtDate(i.due, lang)})` : ''}
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Strains() {
  const { data } = useGarden();
  const { tt, lang } = useJT();
  const rank = useMemo(() => strainRanking(data.mushrooms ?? []), [data.mushrooms]);
  if (rank.length === 0) return null;
  return (
    <Card title={`🧬 ${tt('mush.strains')}`}>
      <p className="mb-2 text-xs leading-relaxed" style={{ color: INK700 }}>
        {tt('mush.strainsLead')}
      </p>
      <ul className="space-y-1 text-sm">
        {rank.map((r, k) => (
          <li key={`${r.speciesId}|${r.strain}`} className="flex items-baseline justify-between gap-2">
            <span>
              {k === 0 ? '🏆 ' : ''}
              {MUSHROOM_BY_ID[r.speciesId]?.name[lang]} · <b>{r.strain}</b>
            </span>
            <span className="text-xs" style={{ color: INK500 }}>
              {tt('mush.strainScore', { be: Math.round(r.be), n: r.runs, kg: fmtNum(r.totalG / 1000, lang, 1) })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// --- Fiche d'une culture --------------------------------------------------------------------------

export function MushroomSheet({ id, speciesId, parentId, clone, stage, edit, onClose }: { id?: string; speciesId?: string; parentId?: string; clone?: boolean; stage?: MushStage; edit?: boolean; onClose: () => void }) {
  const { data } = useGarden();
  const existing = id ? (data.mushrooms ?? []).find((b) => b.id === id) : undefined;
  if (existing && !edit) return <MushroomDetail b={existing} onClose={onClose} />;
  return <MushroomForm existing={existing} speciesId={speciesId} parentId={parentId} clone={clone} stage={stage} onClose={onClose} />;
}

function MushroomForm({ existing, speciesId, parentId, clone, stage, onClose }: { existing?: MushBatch; speciesId?: string; parentId?: string; clone?: boolean; stage?: MushStage; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const all = data.mushrooms ?? [];
  const parent = all.find((b) => b.id === (existing?.parentId ?? parentId));
  const [sp, setSp] = useState(existing?.speciesId ?? parent?.speciesId ?? speciesId ?? 'm-oyster');
  const species = MUSHROOM_BY_ID[sp];
  const defStage: MushStage = existing?.stage ?? stage ?? (clone ? 'agar' : parent ? childStage(parent.stage, species) : species.methods.includes('bed') && !species.methods.includes('bag') ? 'bed' : species.methods.includes('tree') ? 'bed' : 'substrate');
  const [st, setSt] = useState<MushStage>(defStage);
  const [strain, setStrain] = useState(existing?.strain ?? '');
  const [source, setSource] = useState(existing?.source ?? '');
  const [par, setPar] = useState(existing?.parentId ?? parentId ?? '');
  const [qty, setQty] = useState(String(existing?.qty ?? 1));
  const [sub, setSub] = useState<string>(existing?.substrate ?? species.substrates[0] ?? '');
  const [dry, setDry] = useState(existing?.dryKg !== undefined ? String(existing.dryKg) : '');
  const [area, setArea] = useState(existing?.areaM2 !== undefined ? String(existing.areaM2) : '');
  const [temp, setTemp] = useState(existing?.tempC !== undefined ? String(existing.tempC) : '');
  const [started, setStarted] = useState(existing?.started ?? today);
  const [bed, setBed] = useState(existing?.bedId ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [photos, setPhotos] = useState<string[]>(existing?.photoIds ?? []);
  const fruitingStage = st === 'substrate' || st === 'log' || st === 'bed';
  const parents = all.filter((b) => b.speciesId === sp && b.status !== 'contam' && b.id !== existing?.id);
  const outdoor = st === 'log' || st === 'bed';
  const num = (v: string) => (v.trim() === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));

  const save = () => {
    const b: MushBatch = {
      id: existing?.id ?? uid('mu'),
      speciesId: sp,
      strain: strain.trim() || undefined,
      stage: st,
      parentId: par || undefined,
      clone: existing?.clone ?? (clone || undefined),
      source: par ? undefined : source.trim() || undefined,
      started,
      qty: Math.max(1, Math.round(num(qty) ?? 1)),
      areaM2: st === 'bed' ? num(area) : undefined,
      substrate: fruitingStage && sub ? sub : undefined,
      dryKg: fruitingStage ? num(dry) : undefined,
      tempC: outdoor ? undefined : num(temp),
      status: existing?.status ?? 'incubating',
      colonized: existing?.colonized,
      fruiting: existing?.fruiting,
      harvests: existing?.harvests ?? [],
      contam: existing?.contam,
      ended: existing?.ended,
      bedId: outdoor && bed ? bed : undefined,
      note: note.trim() || undefined,
      photoIds: photos.length ? photos : undefined,
    };
    store.saveMushroom(b);
    nav.toast(tt('mush.saved'));
    onClose();
  };

  const [lo, hi] = colonRange(species, st, num(temp));
  return (
    <Sheet title={existing ? tt('mush.editTitle') : clone ? tt('mush.cloneTitle') : tt('mush.newTitle')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        {clone && parent && <Notice tone="info">{tt('mush.cloneHint')}</Notice>}
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('mush.species')}>
            {(fid) => (
              <Select
                id={fid}
                value={sp}
                onChange={(v) => {
                  setSp(v);
                  setSub(MUSHROOM_BY_ID[v].substrates[0] ?? '');
                  setPar('');
                }}
                options={[...MUSHROOMS].sort((a, b) => a.name[lang].localeCompare(b.name[lang])).map((m) => ({ v: m.id, l: m.name[lang] }))}
              />
            )}
          </Field>
          <Field label={tt('mush.strain')} hint={parent && !strain ? tt('mush.strainInherit', { name: strainOf(parent, all) ?? '—' }) : undefined}>
            {(fid) => <TextInput id={fid} value={strain} onChange={setStrain} placeholder={tt('mush.strainPh')} />}
          </Field>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium" style={{ color: INK700 }}>
            {tt('mush.stageLabel')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MUSH_STAGES.map((s) => (
              <Chip key={s} active={st === s} onClick={() => setSt(s)}>
                {STAGE_ICON[s]} {tt(`mush.stage.${s}` as JKey)}
              </Chip>
            ))}
          </div>
          <p className="mt-1 text-[11px] leading-snug" style={{ color: INK500 }}>
            {tt(`mush.stageHint.${st}` as JKey)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('mush.parent')}>
            {(fid) => (
              <Select
                id={fid}
                value={par}
                onChange={setPar}
                options={[{ v: '', l: tt('mush.parentNone') }, ...parents.map((b) => ({ v: b.id, l: `${STAGE_ICON[b.stage]} ${tt(`mush.stage.${b.stage}` as JKey)} · ${fmtDate(b.started, lang)}${strainOf(b, all) ? ` · ${strainOf(b, all)}` : ''}` }))]}
              />
            )}
          </Field>
          {!par ? (
            <Field label={tt('mush.source')}>{(fid) => <TextInput id={fid} value={source} onChange={setSource} placeholder={tt('mush.sourcePh')} />}</Field>
          ) : (
            <span />
          )}
          <Field label={tt('mush.started')}>{(fid) => <TextInput id={fid} type="date" value={started} onChange={(v) => v && setStarted(v)} />}</Field>
          <Field label={tt(`mush.qty.${st}` as JKey)}>{(fid) => <TextInput id={fid} type="number" min={1} value={qty} onChange={setQty} />}</Field>
          {fruitingStage && species.substrates.length > 0 && (
            <Field label={tt('mush.substrate')}>
              {(fid) => <Select id={fid} value={sub} onChange={setSub} options={species.substrates.map((x) => ({ v: x, l: SUBSTRATE_BY_ID[x].name[lang] }))} />}
            </Field>
          )}
          {fruitingStage && st !== 'log' && (
            <Field label={tt('mush.dryKg')} hint={tt('mush.dryKgHint')}>
              {(fid) => <TextInput id={fid} type="number" min={0} step={0.1} value={dry} onChange={setDry} />}
            </Field>
          )}
          {st === 'bed' && <Field label={tt('mush.area')}>{(fid) => <TextInput id={fid} type="number" min={0} step={0.1} value={area} onChange={setArea} />}</Field>}
          {!outdoor && (
            <Field label={tt('mush.temp')} hint={tt('mush.tempHint', { lo: species.colonTemp[0], hi: species.colonTemp[1] })}>
              {(fid) => <TextInput id={fid} type="number" value={temp} onChange={setTemp} />}
            </Field>
          )}
          {outdoor && data.beds.length > 0 && (
            <Field label={tt('mush.bed')}>
              {(fid) => <Select id={fid} value={bed} onChange={setBed} options={[{ v: '', l: '—' }, ...data.beds.map((b) => ({ v: b.id, l: b.name }))]} />}
            </Field>
          )}
        </div>
        {fruitingStage && num(dry) && species.be[1] > 0 ? (
          <p className="text-xs" style={{ color: INK700 }}>
            {tt('mush.expect', { lo: fmtNum((num(dry)! * species.be[0]) / 100, lang, 1), hi: fmtNum((num(dry)! * species.be[1]) / 100, lang, 1) })}
          </p>
        ) : null}
        <Notice tone="info">{outdoor ? tt('mush.colonOutdoor', { lo: Math.round(lo / 30), hi: Math.round(hi / 30) }) : tt('mush.colonIndoor', { lo, hi, date: fmtDate(addDays(started, Math.round((lo + hi) / 2)), lang) })}</Notice>
        <Field label={tt('mush.note')}>{(fid) => <TextArea id={fid} value={note} onChange={setNote} />}</Field>
        <PhotoStrip
          label={tt('mush.photos')}
          ids={photos}
          onChange={(ids, _a, r) => {
            setPhotos(ids);
            if (r.length) store.removePhotos(r);
          }}
        />
        <div className="flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button kind="primary" onClick={save}>
            {tt('common.save')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function MushroomDetail({ b, onClose }: { b: MushBatch; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const nameOf = useMushName();
  const all = data.mushrooms ?? [];
  const sp = MUSHROOM_BY_ID[b.speciesId];
  const i = mushInfo(b, today);
  const chain = lineage(b, all);
  const children = all.filter((x) => x.parentId === b.id);
  const [grams, setGrams] = useState('');
  const [hDate, setHDate] = useState(today);
  const [contam, setContam] = useState<{ problem: string; units: string } | null>(null);
  const save = (patch: Partial<MushBatch>, toast?: string) => {
    store.saveMushroom({ ...b, ...patch });
    if (toast) nav.toast(toast);
  };
  const fruitingStage = b.stage === 'substrate' || b.stage === 'log' || b.stage === 'bed';
  const [bg, fg] = STATUS_COLOR[b.status];
  const strain = strainOf(b, all);
  const gen = generation(b, all);
  const bedName = b.bedId ? data.beds.find((x) => x.id === b.bedId)?.name : undefined;
  const contamOptions = MUSH_PROBLEMS.filter((p) => p.kind === 'contam');

  return (
    <Sheet
      title={
        <span>
          {STAGE_ICON[b.stage]} {nameOf({ speciesId: b.speciesId, strain })}
        </span>
      }
      onClose={onClose}
      closeLabel={tt('common.close')}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full px-2 py-0.5" style={{ background: bg, color: fg }}>
            {tt(`mush.status.${b.status}` as JKey)}
          </span>
          <span className="rounded-full px-2 py-0.5" style={{ background: 'var(--color-paper-200)' }}>
            {tt(`mush.stage.${b.stage}` as JKey)}
            {b.qty > 1 ? ` ×${b.qty}` : ''}
          </span>
          {gen > 0 && (
            <span className="rounded-full px-2 py-0.5" style={{ background: gen >= 6 ? '#f3e6d2' : 'var(--color-paper-200)' }} title={tt('mush.genHint')}>
              G{gen}
            </span>
          )}
          {b.clone && <span className="rounded-full px-2 py-0.5" style={{ background: '#e3ecf3', color: '#24485e' }}>🧬 {tt('mush.cloneBadge')}</span>}
          <button type="button" className="underline" style={{ color: INK700 }} onClick={() => nav.open({ type: 'mushSpecies', id: b.speciesId })}>
            {tt('mush.speciesSheet')}
          </button>
        </div>
        <p className="text-xs" style={{ color: INK500 }}>
          {tt('mush.since', { date: fmtDate(b.started, lang) })} · {tt('mush.ageDays', { n: i.age })}
          {b.substrate ? ` · ${SUBSTRATE_BY_ID[b.substrate as SubstrateId]?.name[lang] ?? b.substrate}` : ''}
          {b.dryKg ? ` · ${tt('mush.dryShort', { kg: fmtNum(b.dryKg, lang, 1) })}` : ''}
          {b.areaM2 ? ` · ${fmtNum(b.areaM2, lang, 1)} m²` : ''}
          {bedName ? ` · ${bedName}` : ''}
          {b.tempC !== undefined ? ` · ${b.tempC} °C` : ''}
          {b.source ? ` · ${b.source}` : ''}
        </p>

        {chain.length > 1 && (
          <section>
            <h3 className="mb-1 text-sm font-semibold">{tt('mush.lineage')}</h3>
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {chain.map((x, k) => (
                <span key={x.id} className="flex items-center gap-1">
                  {k > 0 && <span style={{ color: INK500 }}>→</span>}
                  {x.id === b.id ? (
                    <b>
                      {STAGE_ICON[x.stage]} {tt(`mush.stage.${x.stage}` as JKey)}
                    </b>
                  ) : (
                    <button type="button" className="underline" onClick={() => nav.open({ type: 'mushroom', id: x.id })}>
                      {STAGE_ICON[x.stage]} {tt(`mush.stage.${x.stage}` as JKey)} {fmtDate(x.started, lang)}
                    </button>
                  )}
                </span>
              ))}
            </div>
          </section>
        )}
        {gen >= 6 && <Notice tone="warn">{tt('mush.senescence', { n: gen })}</Notice>}
        {i.tempWarn && <Notice tone="warn">{tt(i.tempWarn === 'cold' ? 'mush.tooCold' : 'mush.tooHot', { lo: sp.colonTemp[0], hi: sp.colonTemp[1] })}</Notice>}

        {i.next !== 'none' && (
          <Notice tone={i.next === 'overdue' ? 'warn' : 'good'}>
            <b>{tt('mush.nextLabel')}</b> {nextText(tt, i.next, sp, b)}
            {i.due > today ? ` — ${fmtDate(i.due, lang)}` : ''}
          </Notice>
        )}
        {b.status === 'incubating' && b.stage !== 'log' && b.stage !== 'bed' && (
          <div>
            <div className="h-2 w-full overflow-hidden rounded" style={{ background: 'var(--color-paper-300)' }}>
              <div className="h-full" style={{ width: `${Math.round(i.progress * 100)}%`, background: '#c89b3c' }} />
            </div>
            <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
              {tt('mush.colonWindow', { from: fmtDate(i.colonFrom, lang), to: fmtDate(i.colonTo, lang) })}
            </p>
          </div>
        )}
        {b.status === 'fruiting' && fruitingStage && (
          <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
            {tt('mush.fruitConditions', { lo: sp.fruitTemp[0], hi: sp.fruitTemp[1], rh: `${sp.humidity[0]}–${sp.humidity[1]}`, fae: tt(`mush.fae.${sp.fae}` as JKey), light: tt(`mush.light.${sp.light}` as JKey) })}
          </p>
        )}

        {/* Actions selon l'état */}
        {b.status !== 'done' && b.status !== 'contam' && (
          <div className="flex flex-wrap gap-2">
            {b.status === 'incubating' && b.stage !== 'log' && b.stage !== 'bed' && (
              <Button kind="primary" small onClick={() => save({ status: 'colonized', colonized: today }, tt('mush.toastColonized'))}>
                ✓ {tt('mush.markColonized')}
              </Button>
            )}
            {fruitingStage && (b.status === 'colonized' || b.status === 'resting' || ((b.stage === 'log' || b.stage === 'bed') && b.status === 'incubating')) && (
              <Button kind="primary" small onClick={() => save({ status: 'fruiting', fruiting: today }, tt('mush.toastFruiting'))}>
                ⛺ {tt(sp.coldShock && b.stage !== 'bed' ? 'mush.startFruitingShock' : 'mush.startFruiting')}
              </Button>
            )}
            {!fruitingStage && b.status === 'colonized' && (
              <Button kind="primary" small onClick={() => nav.open({ type: 'mushroom', parentId: b.id, stage: childStage(b.stage, sp) })}>
                ➜ {tt('mush.inoculateFrom')}
              </Button>
            )}
            {b.status === 'incubating' && b.stage !== 'log' && b.stage !== 'bed' && (
              <Button kind="danger" small onClick={() => setContam({ problem: contamOptions[0].id, units: String(b.qty) })}>
                ⚠ {tt('mush.markContam')}
              </Button>
            )}
          </div>
        )}
        {contam && (
          <div className="space-y-2 rounded p-3" style={{ background: '#f6dcd4' }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tt('mush.contamWhat')}>{(fid) => <Select id={fid} value={contam.problem} onChange={(v) => setContam({ ...contam, problem: v })} options={contamOptions.map((p) => ({ v: p.id, l: p.name[lang] }))} />}</Field>
              {b.qty > 1 && <Field label={tt('mush.contamUnits', { n: b.qty })}>{(fid) => <TextInput id={fid} type="number" min={1} max={b.qty} value={contam.units} onChange={(v) => setContam({ ...contam, units: v })} />}</Field>}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#5a2010' }}>
              {MUSH_PROBLEMS.find((p) => p.id === contam.problem)?.fix[lang]}
            </p>
            <div className="flex gap-2">
              <Button
                kind="danger"
                small
                onClick={() => {
                  const n = Math.min(b.qty, Math.max(1, Math.round(Number(contam.units) || b.qty)));
                  if (n < b.qty) save({ qty: b.qty - n, note: [b.note, tt('mush.contamNote', { n, what: MUSH_PROBLEMS.find((p) => p.id === contam.problem)?.name[lang] ?? '', date: fmtDate(today, lang) })].filter(Boolean).join('\n') }, tt('mush.toastContamPart', { n }));
                  else save({ status: 'contam', contam: { date: today, problemId: contam.problem, units: n }, ended: today }, tt('mush.toastContam'));
                  setContam(null);
                }}
              >
                {tt('mush.confirmContam')}
              </Button>
              <Button kind="ghost" small onClick={() => setContam(null)}>
                {tt('common.cancel')}
              </Button>
            </div>
          </div>
        )}
        {b.status === 'contam' && b.contam && (
          <Notice tone="warn">
            {tt('mush.contamDone', { what: MUSH_PROBLEMS.find((p) => p.id === b.contam?.problemId)?.name[lang] ?? '?', date: fmtDate(b.contam.date, lang) })}
          </Notice>
        )}

        {fruitingStage && (
          <section>
            <h3 className="mb-1 text-sm font-semibold">🧺 {tt('mush.harvests')}</h3>
            {b.harvests.length > 0 ? (
              <ul className="mb-2 space-y-0.5 text-sm">
                {[...b.harvests]
                  .sort((x, y) => y.date.localeCompare(x.date))
                  .map((h, k) => (
                    <li key={`${h.date}-${k}`} className="flex items-center justify-between gap-2">
                      <span>
                        {fmtDate(h.date, lang)} — <b>{fmtNum(h.g, lang, 0)} g</b>
                      </span>
                      <button type="button" className="text-xs underline" style={{ color: INK500 }} onClick={() => window.confirm(tt('mush.removeHarvest')) && save({ harvests: b.harvests.filter((x) => x !== h) })}>
                        {tt('common.delete')}
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mb-2 text-xs" style={{ color: INK500 }}>
                {tt('mush.noHarvest')}
              </p>
            )}
            <p className="mb-2 text-xs" style={{ color: INK700 }}>
              {tt('mush.totals', { kg: fmtNum(i.totalG / 1000, lang, 2), n: i.flushesDone, of: sp.flushes })}
              {i.be !== undefined ? ` · ${tt('mush.be', { be: Math.round(i.be), lo: sp.be[0], hi: sp.be[1] })}` : ''}
              {i.be === undefined && i.expectG ? ` · ${tt('mush.expect', { lo: fmtNum(i.expectG[0] / 1000, lang, 1), hi: fmtNum(i.expectG[1] / 1000, lang, 1) })}` : ''}
            </p>
            {b.status !== 'done' && b.status !== 'contam' && (
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-24">
                  <Field label={tt('mush.grams')}>{(fid) => <TextInput id={fid} type="number" min={0} value={grams} onChange={setGrams} />}</Field>
                </div>
                <div className="w-36">
                  <Field label={tt('mush.date')}>{(fid) => <TextInput id={fid} type="date" value={hDate} onChange={(v) => v && setHDate(v)} />}</Field>
                </div>
                <Button
                  kind="primary"
                  small
                  disabled={!(Number(grams) > 0)}
                  onClick={() => {
                    save({ harvests: [...b.harvests, { date: hDate, g: Math.round(Number(grams)) }], status: 'resting' }, tt('mush.toastHarvest', { g: Math.round(Number(grams)) }));
                    setGrams('');
                  }}
                >
                  + {tt('mush.addHarvest')}
                </Button>
              </div>
            )}
            {i.next === 'spent' && <p className="mt-2 text-xs leading-relaxed" style={{ color: INK700 }}>♻ {tt('mush.spentTip')}</p>}
          </section>
        )}

        {children.length > 0 && (
          <section>
            <h3 className="mb-1 text-sm font-semibold">{tt('mush.children', { n: children.length })}</h3>
            <ul className="space-y-0.5 text-sm">
              {children.map((c) => (
                <li key={c.id}>
                  <button type="button" className="underline" onClick={() => nav.open({ type: 'mushroom', id: c.id })}>
                    {STAGE_ICON[c.stage]} {tt(`mush.stage.${c.stage}` as JKey)} ×{c.qty} · {fmtDate(c.started, lang)} · {tt(`mush.status.${c.status}` as JKey)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {b.note && (
          <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: INK700 }}>
            {b.note}
          </p>
        )}
        <PhotoStrip
          label={tt('mush.photos')}
          ids={b.photoIds ?? []}
          onChange={(ids, _a, r) => {
            save({ photoIds: ids.length ? ids : undefined });
            if (r.length) store.removePhotos(r);
          }}
        />

        <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--color-paper-300)' }}>
          {(b.status === 'fruiting' || b.status === 'resting' || b.harvests.length > 0) && (
            <Button small kind="ghost" onClick={() => nav.open({ type: 'mushroom', parentId: b.id, clone: true, stage: 'agar' })}>
              🧬 {tt('mush.clone')}
            </Button>
          )}
          {b.status !== 'contam' && (
            <Button small kind="ghost" onClick={() => nav.open({ type: 'mushroom', parentId: b.id, stage: childStage(b.stage, sp) })}>
              ➜ {tt('mush.child')}
            </Button>
          )}
          <Button small kind="ghost" onClick={() => nav.open({ type: 'mushroom', id: b.id, edit: true })}>
            ✎ {tt('mush.edit')}
          </Button>
          {b.status !== 'done' && b.status !== 'contam' && (
            <Button small kind="ghost" onClick={() => window.confirm(tt('mush.finishConfirm')) && save({ status: 'done', ended: today }, tt('mush.toastDone'))}>
              ✓ {tt('mush.finish')}
            </Button>
          )}
          {(b.status === 'done' || b.status === 'contam') && (
            <Button small kind="ghost" onClick={() => save({ status: b.harvests.length ? 'resting' : 'incubating', ended: undefined, contam: undefined })}>
              ↺ {tt('mush.reopen')}
            </Button>
          )}
          <Button
            small
            kind="danger"
            onClick={() => {
              if (window.confirm(tt('mush.deleteConfirm'))) {
                store.deleteMushroom(b.id);
                onClose();
              }
            }}
          >
            {tt('common.delete')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

// --- Espèces -------------------------------------------------------------------------------------------

type SpeciesFilter = 'all' | 'easy' | 'indoor' | 'outdoor' | 'medicinal';
const INDOOR: MushMethod[] = ['bag', 'bucket', 'jar', 'straw', 'compost'];
const OUTDOOR: MushMethod[] = ['log', 'bed', 'tree'];

function SpeciesList() {
  const { tt, lang } = useJT();
  const nav = useNav();
  const pics = useCachedSpecies();
  const [f, setF] = useState<SpeciesFilter>('all');
  const list = MUSHROOMS.filter((m) => (f === 'easy' ? m.difficulty === 1 : f === 'indoor' ? m.methods.some((x) => INDOOR.includes(x)) : f === 'outdoor' ? m.methods.some((x) => OUTDOOR.includes(x)) : f === 'medicinal' ? m.medicinal : true)).sort((a, b) => a.name[lang].localeCompare(b.name[lang]));
  return (
    <Card title={tt('mush.speciesTitle', { n: MUSHROOMS.length })}>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(['all', 'easy', 'indoor', 'outdoor', 'medicinal'] as SpeciesFilter[]).map((x) => (
          <Chip key={x} active={f === x} onClick={() => setF(x)}>
            {tt(`mush.filter.${x}` as JKey)}
          </Chip>
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {list.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => nav.open({ type: 'mushSpecies', id: m.id })} className="flex h-full w-full items-center gap-2 rounded px-2.5 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
              <SpeciesIcon species={m} have={pics.has(m.id)} />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{m.name[lang]}</span>
                <span className="block truncate text-[11px]" style={{ color: INK500 }}>
                  {'●'.repeat(m.difficulty)}
                  {'○'.repeat(3 - m.difficulty)} · {m.methods.map((x) => tt(`mush.method.${x}` as JKey)).join(', ')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('mush.speciesNote')}
      </p>
    </Card>
  );
}

export function MushSpeciesSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const m = MUSHROOM_BY_ID[id];
  if (!m) return null;
  const tree = m.methods.includes('tree');
  const rows: Array<[string, string]> = [
    [tt('mush.difficulty'), tt(`mush.diff.${m.difficulty}` as JKey)],
    [tt('mush.methods'), m.methods.map((x) => tt(`mush.method.${x}` as JKey)).join(', ')],
    ...(tree
      ? []
      : ([
          [tt('mush.colonTemp'), `${m.colonTemp[0]}–${m.colonTemp[1]} °C`],
          [tt('mush.fruitTemp'), `${m.fruitTemp[0]}–${m.fruitTemp[1]} °C${m.coldShock ? ` · ${tt('mush.coldShock')}` : ''}`],
          [tt('mush.colonDays'), tt('mush.daysRange', { lo: m.colonDays[0], hi: m.colonDays[1] })],
          [tt('mush.toHarvest'), tt('mush.daysRange', { lo: m.pinDays[0] + m.fruitDays[0], hi: m.pinDays[1] + m.fruitDays[1] })],
          [tt('mush.flushes'), tt('mush.flushesV', { n: m.flushes, rest: m.restDays })],
          [tt('mush.beLabel'), `${m.be[0]}–${m.be[1]} %`],
          [tt('mush.humidity'), `${m.humidity[0]}–${m.humidity[1]} %`],
          [tt('mush.faeLabel'), tt(`mush.fae.${m.fae}` as JKey)],
          [tt('mush.lightLabel'), tt(`mush.light.${m.light}` as JKey)],
        ] as Array<[string, string]>)),
    [tt('mush.keep'), m.keepDays >= 365 ? tt('mush.keepDried') : tt('mush.keepDays', { n: m.keepDays })],
  ];
  return (
    <Sheet title={<span>🍄 {m.name[lang]}</span>} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <SpeciesHero species={m} />
        <p className="text-sm italic" style={{ color: INK700 }}>
          {m.latin}
        </p>
        <p className="text-sm leading-relaxed">💡 {m.note[lang]}</p>
        {m.caution && <Notice tone="warn">⚠ {m.caution[lang]}</Notice>}
        {m.outdoor && (
          <section>
            <h3 className="mb-1 font-display text-base">{tt('mush.outdoorCal')}</h3>
            <YearCalendar
              rows={[
                { label: tt(tree ? 'mush.calPlant' : 'mush.calInoculate'), ranges: shiftWindows(m.outdoor.inoculate, data.settings.climate), color: '#c89b3c' },
                { label: tt('mush.calHarvest'), ranges: shiftWindows(m.outdoor.fruit, data.settings.climate), color: '#c0612e' },
              ]}
            />
            <p className="mt-1 text-xs" style={{ color: INK700 }}>
              {tt(m.outdoor.firstMonths[0] >= 24 ? 'mush.firstYears' : 'mush.firstMonths', { lo: m.outdoor.firstMonths[0] >= 24 ? Math.round(m.outdoor.firstMonths[0] / 12) : m.outdoor.firstMonths[0], hi: m.outdoor.firstMonths[0] >= 24 ? Math.round(m.outdoor.firstMonths[1] / 12) : m.outdoor.firstMonths[1], years: m.outdoor.years })}
            </p>
          </section>
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt style={{ color: INK500 }}>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {m.woods && (
          <p className="text-sm">
            🪵 <b>{tt('mush.woods')}</b> {m.woods[lang]}
          </p>
        )}
        <p className="text-sm">
          🧺 <b>{tt('mush.harvestWhen')}</b> {m.harvest[lang]}
        </p>
        {m.substrates.length > 0 && (
          <section>
            <h3 className="mb-1 font-display text-base">{tt('mush.substrates')}</h3>
            {m.substrates.map((s) => (
              <Why key={s} label={SUBSTRATE_BY_ID[s].name[lang]}>
                <p>{SUBSTRATE_BY_ID[s].how[lang]}</p>
                {SUBSTRATE_BY_ID[s].spawnRate[1] > 0 && <p>{tt('mush.subFacts', { m: SUBSTRATE_BY_ID[s].moisture, lo: SUBSTRATE_BY_ID[s].spawnRate[0], hi: SUBSTRATE_BY_ID[s].spawnRate[1], prep: tt(`mush.prep.${SUBSTRATE_BY_ID[s].prep}` as JKey) })}</p>}
              </Why>
            ))}
          </section>
        )}
        {!tree && (
          <Button kind="primary" onClick={() => nav.open({ type: 'mushroom', speciesId: m.id })}>
            + {tt('mush.startOne')}
          </Button>
        )}
      </div>
    </Sheet>
  );
}

// --- Labo -----------------------------------------------------------------------------------------------

function LabView() {
  const { tt, lang } = useJT();
  return (
    <>
      <Card title={`🧫 ${tt('mush.labTitle')}`}>
        <p className="mb-2 text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('mush.labLead')}
        </p>
        {LAB_GUIDES.map((g) => (
          <Why key={g.id} label={`${g.icon} ${g.title[lang]}`}>
            <p>{g.body[lang]}</p>
          </Why>
        ))}
      </Card>
      <Calculators />
      <Card title={`🧾 ${tt('mush.kitTitle')}`}>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed" style={{ color: INK700 }}>
          {(['kit1', 'kit2', 'kit3', 'kit4', 'kit5', 'kit6'] as const).map((k) => (
            <li key={k}>{tt(`mush.${k}` as JKey)}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function NumIn({ label, value, onChange, step = 1, hint }: { label: string; value: string; onChange: (v: string) => void; step?: number; hint?: string }) {
  return <Field label={label} hint={hint}>{(fid) => <TextInput id={fid} type="number" min={0} step={step} value={value} onChange={onChange} />}</Field>;
}

function Calculators() {
  const { tt, lang } = useJT();
  const [calc, setCalc] = useState<'hydrate' | 'spawn' | 'grain' | 'logs' | 'bed' | 'agar' | 'lc'>('hydrate');
  // Hydratation + ensemencement
  const [subId, setSubId] = useState<SubstrateId>('straw');
  const sub = SUBSTRATE_BY_ID[subId];
  const [dry, setDry] = useState('2');
  const [target, setTarget] = useState(String(sub.moisture));
  const [rate, setRate] = useState(String(sub.spawnRate[1] || 10));
  const [wet, setWet] = useState('5');
  const [jars, setJars] = useState('4');
  const [jarL, setJarL] = useState('1');
  const [diam, setDiam] = useState('15');
  const [len, setLen] = useState('100');
  const [nLogs, setNLogs] = useState('3');
  const [area, setArea] = useState('2');
  const [depth, setDepth] = useState('20');
  const [vol, setVol] = useState('0.5');
  const n = (v: string) => Math.max(0, Number(v) || 0);
  const kg = (x: number) => `${fmtNum(x, lang, x < 10 ? 2 : 1)} kg`;
  const water = waterToAdd(n(dry), sub.dryMoisture, n(target));
  const wetTot = wetWeight(n(dry), sub.dryMoisture, n(target));
  const spawnKg = spawnFor(n(wet), n(rate));
  const plugs = plugsFor(n(diam), n(len));
  const bed = bedFor(n(area), n(depth));
  const recipe = labRecipe(calc === 'lc' ? 'lc' : 'agar', n(vol));
  const Out = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-3 rounded px-3 py-2 text-sm leading-relaxed" style={{ background: '#e6efdc', color: '#2f4a22' }} data-testid="calc-out">
      {children}
    </div>
  );
  return (
    <Card title={`🧮 ${tt('mush.calcTitle')}`}>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(['hydrate', 'spawn', 'grain', 'logs', 'bed', 'agar', 'lc'] as const).map((c) => (
          <Chip key={c} active={calc === c} onClick={() => setCalc(c)}>
            {tt(`mush.calc.${c}` as JKey)}
          </Chip>
        ))}
      </div>
      {(calc === 'hydrate' || calc === 'spawn') && (
        <Field label={tt('mush.substrate')}>
          {(fid) => (
            <Select
              id={fid}
              value={subId}
              onChange={(v) => {
                setSubId(v);
                setTarget(String(SUBSTRATE_BY_ID[v].moisture));
                setRate(String(SUBSTRATE_BY_ID[v].spawnRate[1] || 10));
              }}
              options={SUBSTRATES.filter((s) => s.id !== 'logs').map((s) => ({ v: s.id, l: s.name[lang] }))}
            />
          )}
        </Field>
      )}
      {calc === 'hydrate' && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <NumIn label={tt('mush.calcDry')} value={dry} onChange={setDry} step={0.1} />
            <NumIn label={tt('mush.calcTarget')} value={target} onChange={setTarget} hint={tt('mush.calcTargetHint', { m: sub.moisture })} />
          </div>
          <Out>
            {tt('mush.calcWater', { l: fmtNum(water, lang, 2), wet: kg(wetTot) })}
            <br />
            <span className="text-xs">{tt('mush.calcSqueeze')}</span>
          </Out>
        </>
      )}
      {calc === 'spawn' && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <NumIn label={tt('mush.calcWet')} value={wet} onChange={setWet} step={0.1} />
            <NumIn label={tt('mush.calcRate')} value={rate} onChange={setRate} hint={sub.spawnRate[1] ? tt('mush.calcRateHint', { lo: sub.spawnRate[0], hi: sub.spawnRate[1] }) : undefined} />
          </div>
          <Out>{tt('mush.calcSpawn', { kg: kg(spawnKg), jars: jarsFor(spawnKg, 1) })}</Out>
        </>
      )}
      {calc === 'grain' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumIn label={tt('mush.calcJars')} value={jars} onChange={setJars} />
            <NumIn label={tt('mush.calcJarL')} value={jarL} onChange={setJarL} step={0.25} />
          </div>
          <Out>{tt('mush.calcGrain', { kg: kg(n(jars) * n(jarL) * DRY_GRAIN_KG_PER_L), spawn: kg(n(jars) * n(jarL) * 0.6), min: n(jarL) > 1 ? 150 : 90 })}</Out>
        </>
      )}
      {calc === 'logs' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <NumIn label={tt('mush.calcDiam')} value={diam} onChange={setDiam} />
            <NumIn label={tt('mush.calcLen')} value={len} onChange={setLen} />
            <NumIn label={tt('mush.calcLogs')} value={nLogs} onChange={setNLogs} />
          </div>
          <Out>{tt('mush.calcPlugs', { rows: plugs.rows, per: plugs.perRow, total: plugs.total, all: plugs.total * Math.max(1, Math.round(n(nLogs))) })}</Out>
        </>
      )}
      {calc === 'bed' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumIn label={tt('mush.area')} value={area} onChange={setArea} step={0.1} />
            <NumIn label={tt('mush.calcDepth')} value={depth} onChange={setDepth} />
          </div>
          <Out>{tt('mush.calcBed', { m3: fmtNum(bed.chipsM3, lang, 2), l: Math.round(bed.chipsM3 * 1000), lo: fmtNum(bed.spawnKg[0], lang, 1), hi: fmtNum(bed.spawnKg[1], lang, 1) })}</Out>
        </>
      )}
      {(calc === 'agar' || calc === 'lc') && (
        <>
          <NumIn label={tt('mush.calcVol')} value={vol} onChange={setVol} step={0.1} />
          <Out>
            <ul>
              {recipe.map((r) => (
                <li key={r.what}>{tt(`mush.rec.${r.what}` as JKey, { n: fmtNum(r.amount, lang, r.what === 'water' ? 2 : 0) })}</li>
              ))}
            </ul>
            <span className="text-xs">{tt(calc === 'agar' ? 'mush.recAgarTip' : 'mush.recLcTip')}</span>
          </Out>
        </>
      )}
    </Card>
  );
}

// --- Problèmes ----------------------------------------------------------------------------------------

const COLOR_SWATCH: Record<ProblemColor, string> = { green: '#3f8f4a', blue: '#4a7f9a', black: '#2a2a2a', orange: '#e08a3c', grey: '#a6a6a6', wet: '#c9c08a', yellow: '#e2b93b', white: '#f4f1ea', shape: '#b08d63', pests: '#6b4f3a' };

function ProblemsView() {
  const { tt, lang } = useJT();
  const [c, setC] = useState<ProblemColor | 'all'>('all');
  const list = MUSH_PROBLEMS.filter((p) => c === 'all' || p.color === c);
  return (
    <Card title={`🔍 ${tt('mush.problemsTitle')}`}>
      <p className="mb-2 text-sm leading-relaxed" style={{ color: INK700 }}>
        {tt('mush.problemsLead')}
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={c === 'all'} onClick={() => setC('all')}>
          {tt('mush.pc.all')}
        </Chip>
        {PROBLEM_COLORS.map((x) => (
          <Chip key={x} active={c === x} onClick={() => setC(x)}>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: COLOR_SWATCH[x], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25)' }} />
            {tt(`mush.pc.${x}` as JKey)}
          </Chip>
        ))}
      </div>
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="rounded px-3 py-2" style={{ background: p.kind === 'normal' ? '#e6efdc' : p.kind === 'contam' ? '#f6e4dc' : 'var(--color-paper-200)' }}>
            <p className="text-sm font-medium">
              {p.kind === 'normal' ? '✅' : p.kind === 'contam' ? '☣' : '⚠'} {p.name[lang]}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed">
              <b>{tt('mush.looks')}</b> {p.looks[lang]}
            </p>
            <p className="text-xs leading-relaxed">
              <b>{tt('mush.cause')}</b> {p.cause[lang]}
            </p>
            <p className="text-xs leading-relaxed">
              <b>{tt('mush.fix')}</b> {p.fix[lang]}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('mush.problemsNote')}
      </p>
    </Card>
  );
}

