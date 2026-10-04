import { useMemo, useState } from 'react';
import { CLIMATES } from './data/climate';
import { SPECIES_BY_ID } from './data/species';
import { addDays, dayOfYear, fromDayOfYear, yearOf } from './engine/dates';
import { speciesOf } from './engine/crop';
import { generateTasks, type Task } from './engine/tasks';
import { bedArea, waterAdvice } from './engine/water';
import { fmtDate, fmtL, fmtLongDate, plantTitle } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { waterText } from './GardenView';
import { WeatherCard } from './Weather';
import { timeline } from './engine/phenology';
import { moonDay, PHASE_EMOJI } from './engine/moon';
import { Button, Card, Empty, INK500, INK700, Meter } from './ui';
import { taskText } from './taskText';

const TASK_ICON: Record<Task['kind'], string> = {
  sow: '🌱',
  plantOut: '🪴',
  transplant: '🪴',
  water: '💧',
  feed: '🧺',
  harvest: '🧺',
  bloom: '✂',
  lift: '🪣',
  observe: '📷',
  frost: '❄',
  alert: '⚠',
  tank: '🧪',
  lime: '🪨',
  pest: '🐞',
  manual: '✎',
  cover: '🌾',
  compost: '♻',
  raintank: '🛢',
};

/** Nombre de tâches montrées d'emblée (le reste derrière « voir tout »). */
const SHOWN = 8;

export function TaskText({ task }: { task: Task }) {
  const { tt, lang } = useJT();
  return <>{taskText(task, tt, lang)}</>;
}

export function TodayView() {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [showAll, setShowAll] = useState(false);
  const tasks = useMemo(() => generateTasks(data, today), [data, today]);
  const advice = useMemo(() => data.beds.filter((b) => b.kind !== 'hydro').map((b) => ({ bed: b, adv: waterAdvice(b, data, today) })), [data, today]);
  const growing = data.plants.filter((p) => p.status === 'growing');
  const clim = CLIMATES[data.settings.climate];
  const doy = dayOfYear(today);
  const lastFrost = fromDayOfYear(yearOf(today), clim.lastFrost);
  const firstFrost = fromDayOfYear(yearOf(today), clim.firstFrost);

  const dueLabel = (t: Task) => {
    if (t.due < today) return tt('today.late');
    if (t.due === today) return tt('today.today');
    if (t.due === addDays(today, 1)) return tt('today.tomorrow');
    return fmtDate(t.due, lang);
  };

  const done = (t: Task) => {
    if (t.manualId) {
      const m = data.tasks.find((x) => x.id === t.manualId);
      if (m) store.saveTask({ ...m, done: today });
      return;
    }
    const p = t.plantId ? data.plants.find((x) => x.id === t.plantId) : undefined;
    if ((t.kind === 'sow' || t.kind === 'plantOut') && p) {
      store.savePlant({ ...p, status: 'growing', sowDate: today });
      nav.toast(tt('toast.sown'));
    } else if (t.kind === 'transplant' && p) {
      store.savePlant({ ...p, transplantDate: today });
      nav.toast(tt('toast.transplanted'));
    } else if (t.kind === 'water' && t.bedId) {
      store.addWater({ kind: 'irrigation', bedId: t.bedId, amount: Number(t.vars.liters) || 0, date: today });
      nav.toast(tt('toast.watered', { liters: fmtL(Number(t.vars.liters) || 0, lang) }));
    }
    store.setTaskState({ key: t.key, done: today });
  };

  const snooze = (t: Task) => store.setTaskState({ key: t.key, snoozeUntil: addDays(today, 2) });

  const openTask = (t: Task) => {
    if (t.kind === 'water' && t.bedId) nav.open({ type: 'water', bedId: t.bedId, kind: 'irrigation', liters: Number(t.vars.liters) || undefined });
    else if (t.kind === 'observe' && t.plantId) nav.open({ type: 'observe', plantId: t.plantId });
    else if (t.kind === 'compost') nav.setTab('garden');
    else if (t.plantId) nav.open({ type: 'plant', id: t.plantId });
    else if (t.bedId) nav.open({ type: 'bed', id: t.bedId });
  };

  const shown = showAll ? tasks : tasks.slice(0, SHOWN);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-tomato-500)' }}>
          {data.settings.gardenName} · {tt(`climate.${data.settings.climate}` as JKey)}
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl">{fmtLongDate(today, lang).replace(/^./, (c) => c.toUpperCase())}</h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: INK700 }}>
          {doy < clim.lastFrost
            ? tt('today.frostAhead', { date: fmtDate(lastFrost, lang) })
            : doy < clim.firstFrost
              ? tt('today.season', { date: fmtDate(firstFrost, lang) })
              : tt('today.winter')}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Button kind="primary" onClick={() => nav.open({ type: 'observe' })}>
            📷 {tt('quick.observe')}
          </Button>
          <Button kind="primary" onClick={() => nav.open({ type: 'harvest' })}>
            🧺 {tt('quick.harvest')}
          </Button>
          <Button onClick={() => nav.open({ type: 'water', kind: 'irrigation' })}>💧 {tt('quick.irrigation')}</Button>
          <Button onClick={() => nav.open({ type: 'water', kind: 'rain' })}>🌧 {tt('quick.rain')}</Button>
          <Button className="col-span-2 sm:col-span-1" onClick={() => nav.open({ type: 'addPlant' })}>
            🌱 {tt('quick.plant')}
          </Button>
        </div>
      </Card>

      <WeatherCard />

      {data.settings.moon && <MoonCard today={today} />}

      {data.beds.length === 0 ? (
        <Card title={tt('today.emptyTitle')}>
          <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
            {tt('today.emptyBody')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button kind="primary" onClick={() => nav.setTab('garden')}>
              {tt('today.goGarden')}
            </Button>
            <Button kind="ghost" onClick={() => store.loadDemo()}>
              {tt('settings.demo')}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card
            title={tt('today.tasks', { n: tasks.length })}
            action={
              <Button small kind="ghost" onClick={() => nav.open({ type: 'task' })}>
                + {tt('task.add')}
              </Button>
            }
          >
            {tasks.length === 0 ? (
              <Empty>{tt('today.noTask')}</Empty>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--color-paper-300)' }}>
                {shown.map((t) => (
                  <li key={t.key} className="flex items-center gap-2 py-2">
                    <span className="w-6 shrink-0 text-center text-lg" aria-hidden="true">
                      {t.kind === 'feed' && t.plantId ? speciesOf(data.plants.find((p) => p.id === t.plantId)!).emoji : TASK_ICON[t.kind]}
                    </span>
                    <button type="button" onClick={() => openTask(t)} className="min-w-0 flex-1 text-left text-sm leading-snug">
                      <TaskText task={t} />
                      <span className="block text-[11px]" style={{ color: t.due < today || t.priority === 1 ? 'var(--color-tomato-600)' : INK500 }}>
                        {dueLabel(t)}
                        {t.bedId && t.kind !== 'water' ? ` · ${data.beds.find((b) => b.id === t.bedId)?.name ?? ''}` : ''}
                      </span>
                    </button>
                    <button type="button" onClick={() => snooze(t)} title={tt('task.snooze')} aria-label={tt('task.snooze')} className="btn rounded px-2 py-1.5 text-sm" style={{ background: 'var(--color-paper-200)', color: INK700 }}>
                      ⏭
                    </button>
                    <button type="button" onClick={() => done(t)} title={tt('task.done')} aria-label={tt('task.done')} className="btn rounded px-2.5 py-1.5 text-sm font-semibold" style={{ background: 'var(--color-tomato-500)', color: 'var(--color-paper-100)' }}>
                      ✓
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {tasks.length > SHOWN && (
              <button type="button" onClick={() => setShowAll((x) => !x)} className="mt-2 text-xs underline" style={{ color: INK500 }}>
                {showAll ? tt('today.less') : tt('today.more', { n: tasks.length - SHOWN })}
              </button>
            )}
          </Card>

          <Card title={tt('today.water')}>
            <ul className="space-y-3">
              {advice.map(({ bed, adv }) => (
                <li key={bed.id}>
                  <button type="button" onClick={() => nav.open({ type: 'bed', id: bed.id })} className="w-full text-left">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">{bed.name}</span>
                      <span className="text-right text-xs" style={{ color: adv.water ? 'var(--color-tomato-600)' : INK500 }}>
                        {waterText(adv, tt, lang)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Meter value={adv.reserve} max={adv.ru} threshold={adv.ru * 0.5} color="#4a86b0" label={tt('water.reserveLabel', { pct: Math.round(adv.ratio * 100) })} />
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
                      {tt('water.reserveLabel', { pct: Math.round(adv.ratio * 100) })} · {Math.round(bedArea(bed) * 10) / 10} m²
                      {bed.kind === 'greenhouse' ? ` · ${tt('bedKind.greenhouse')}` : ''}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            {data.settings.rainSource === 'average' && !(data.settings.weather && data.weather) && (
              <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
                {tt('water.averageNote')}
              </p>
            )}
          </Card>

          <Card title={tt('today.growing', { n: growing.length })}>
            {growing.length === 0 ? (
              <Empty>{tt('plants.none')}</Empty>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {growing.map((p) => {
                  const info = timeline(p, data, today);
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => nav.open({ type: 'plant', id: p.id })} className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                        <span className="text-xl" aria-hidden="true">
                          {SPECIES_BY_ID[p.speciesId]?.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{plantTitle(p, lang)}</span>
                          <span className="block text-[11px]" style={{ color: INK500 }}>
                            {tt(`stage.${info.stage}` as JKey)} · {tt('plants.day', { n: info.age })}
                          </span>
                          <span className="mt-1 block">
                            <Meter value={info.progress} max={1} color="var(--color-tomato-500)" label={tt('plants.progress', { pct: Math.round(info.progress * 100) })} />
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

/** Calendrier lunaire traditionnel : information seulement, sans effet sur les conseils de l'app. */
function MoonCard({ today }: { today: string }) {
  const { tt, lang } = useJT();
  const m = useMemo(() => moonDay(today), [today]);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          {PHASE_EMOJI[m.phase]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider" style={{ color: INK500 }}>
            {tt('moon.title')}
          </p>
          <p className="font-display text-lg leading-tight">
            {tt(`moon.phase.${m.phase}` as JKey)} · {Math.round(m.illum * 100)} %
          </p>
          <p className="mt-0.5 text-sm">
            <b>{tt(m.ascending ? 'moon.ascending' : 'moon.descending')}</b> {tt('moon.until', { date: fmtDate(m.turnDate, lang) })}
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: INK700 }}>
            {tt(m.ascending ? 'moon.adviceAscending' : 'moon.adviceDescending')}
          </p>
          <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
            {[
              { d: m.nextNew, l: `🌑 ${tt('moon.phase.new')}` },
              { d: m.nextFull, l: `🌕 ${tt('moon.phase.full')}` },
            ]
              .sort((x, y) => x.d.localeCompare(y.d))
              .map((x) => `${x.l} ${fmtDate(x.d, lang)}`)
              .join(' · ')}
          </p>
          <p className="mt-2 text-[11px] italic leading-snug" style={{ color: INK500 }}>
            {tt('moon.note')}
          </p>
        </div>
      </div>
    </Card>
  );
}
