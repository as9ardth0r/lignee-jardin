/**
 * Onglet Cultures → « Semis » : le coin semis. Chaque semis à l'abri avec
 * ses étapes (semé, levée, godets, endurcissement, mise en place), leurs
 * dates, les gestes du moment ; les semis prévus ; ce qu'il est temps de
 * semer à l'abri.
 */
import { useState } from 'react';
import { SPECIES } from './data/species';
import { HARDEN_DAYS, nurseryPlants, nurseryStatus, sowIndoorNow, type NurseryStatus } from './engine/nursery';
import { addDays } from './engine/dates';
import { fmtDate, plantTitle } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Chip, Empty, INK500, INK700, Notice } from './ui';

const STAGE_COLOR: Record<NurseryStatus['stage'], string> = {
  sown: '#8a6a44',
  seedling: '#5f8f3c',
  potted: '#3f7a34',
  hardening: '#c9962e',
  ready: '#2f6a2a',
};

function SeedlingCard({ ns }: { ns: NurseryStatus }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const p = ns.plant;
  const bed = data.beds.find((b) => b.id === p.bedId);
  const d = (x: string) => fmtDate(x, lang);
  const germKnown = Boolean(p.germDate) || ns.stage !== 'sown';
  type Step = { key: string; label: string; when: string; done: boolean; current: boolean };
  const steps: Step[] = [
    { key: 'sown', label: tt('nursery.step.sown'), when: d(p.sowDate), done: true, current: false },
    { key: 'germ', label: tt('nursery.step.germ'), when: p.germDate ? d(p.germDate) : `≈ ${d(ns.germFrom)}–${d(ns.germTo)}`, done: germKnown, current: ns.stage === 'sown' },
  ];
  if (ns.potUpDue) steps.push({ key: 'potUp', label: tt('nursery.step.potUp'), when: p.potUpDate ? d(p.potUpDate) : `≈ ${d(ns.potUpDue)}`, done: Boolean(p.potUpDate) || ns.stage === 'hardening' || ns.stage === 'ready', current: ns.stage === 'seedling' });
  if (!ns.sheltered) steps.push({ key: 'harden', label: tt('nursery.step.harden'), when: p.hardenDate ? d(p.hardenDate) : `≈ ${d(ns.hardenFrom)}`, done: ns.stage === 'ready', current: ns.stage === 'hardening' || (ns.stage === 'potted' && !ns.potUpDue) });
  steps.push({ key: 'out', label: tt('nursery.step.out'), when: `≈ ${d(ns.outDate)}`, done: false, current: ns.stage === 'ready' });

  const depth = ns.germ.depthMm === 0 ? tt('nursery.depthSurface') : tt('nursery.depthMm', { mm: ns.germ.depthMm });
  let advice = '';
  if (ns.stage === 'sown') advice = tt('nursery.adv.sown', { t1: ns.germ.temp[0], t2: ns.germ.temp[1], depth });
  else if (ns.stage === 'seedling') advice = `${tt('nursery.adv.seedling')}${ns.potUpDue && !p.potUpDate ? ` ${tt('nursery.adv.potUp', { date: d(ns.potUpDue) })}` : ''}`;
  else if (ns.stage === 'potted') advice = tt(ns.sheltered ? 'nursery.adv.pottedShelter' : 'nursery.adv.potted', { date: d(ns.sheltered ? ns.outDate : ns.hardenFrom) });
  else if (ns.stage === 'hardening') advice = tt('nursery.adv.hardening', { days: HARDEN_DAYS, t: ns.germ.nightMin, date: d(ns.outDate) });
  else advice = tt(ns.sheltered ? 'nursery.adv.readyShelter' : 'nursery.adv.ready', { bed: bed?.name ?? '' });

  const undo = p.hardenDate ? { hardenDate: undefined } : p.potUpDate ? { potUpDate: undefined } : p.germDate ? { germDate: undefined } : null;

  return (
    <li className="rounded px-3 py-2.5" style={{ background: 'var(--color-paper-200)' }}>
      <div className="flex items-baseline justify-between gap-2">
        <button type="button" className="min-w-0 text-left text-sm font-medium" onClick={() => nav.open({ type: 'plant', id: p.id })}>
          {ns.species.emoji} {plantTitle(p, lang)} <span className="font-normal" style={{ color: INK700 }}>· {p.count} · {tt('nursery.to', { bed: bed?.name ?? '—' })}</span>
        </button>
        <span className="shrink-0 rounded-full px-2 py-0.5 font-data text-xs text-white" style={{ background: STAGE_COLOR[ns.stage] }}>
          {tt('nursery.age', { n: ns.age })}
        </span>
      </div>
      <ol className="mt-2 flex flex-wrap gap-1 text-[11px]">
        {steps.map((s) => (
          <li key={s.key} className="rounded-full px-2 py-0.5" style={{ background: s.current ? STAGE_COLOR[ns.stage] : s.done ? '#dfe9d3' : 'var(--color-paper-100)', color: s.current ? '#fff' : s.done ? '#2f4a22' : INK700, boxShadow: s.current || s.done ? undefined : 'inset 0 0 0 1px var(--color-paper-300)' }}>
            {s.done ? '✓ ' : ''}
            <b>{s.label}</b> {s.when}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: INK700 }}>
        {advice}
      </p>
      {ns.frostDelay && ns.stage !== 'ready' && (
        <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
          ❄ {tt('nursery.frostDelay', { date: d(ns.outDate) })}
        </p>
      )}
      {ns.noGerm && (
        <div className="mt-2">
          <Notice tone="warn">{tt('nursery.noGerm', { days: ns.age, t1: ns.germ.temp[0], t2: ns.germ.temp[1] })}</Notice>
        </div>
      )}
      {ns.coldNight && (
        <div className="mt-2">
          <Notice tone="warn">{tt('nursery.cold', { t: Math.round(ns.coldNight.tmin), date: d(ns.coldNight.date) })}</Notice>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ns.stage === 'sown' && (
          <Button small kind="primary" onClick={() => store.savePlant({ ...p, germDate: today })}>
            {tt('nursery.markGerm')}
          </Button>
        )}
        {ns.stage === 'seedling' && ns.potUpDue && !p.potUpDate && (
          <Button small kind="primary" onClick={() => store.savePlant({ ...p, potUpDate: today })}>
            {tt('nursery.markPotUp')}
          </Button>
        )}
        {!ns.sheltered && (ns.stage === 'seedling' || ns.stage === 'potted') && today >= addDays(ns.hardenFrom, -7) && (
          <Button small kind="ghost" onClick={() => store.savePlant({ ...p, hardenDate: today })}>
            {tt('nursery.markHarden')}
          </Button>
        )}
        {ns.stage !== 'sown' && (
          <Button small kind={ns.stage === 'ready' ? 'primary' : 'ghost'} onClick={() => store.savePlant({ ...p, transplantDate: today })}>
            {tt('nursery.markOut')}
          </Button>
        )}
        {undo && (
          <Button small kind="ghost" onClick={() => store.savePlant({ ...p, ...undo })}>
            ↶ {tt('nursery.undo')}
          </Button>
        )}
      </div>
    </li>
  );
}

export function NurseryView() {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [showAll, setShowAll] = useState(false);
  const list = nurseryPlants(data).map((p) => nurseryStatus(p, data, today));
  const planned = data.plants.filter((p) => p.status === 'planned' && p.indoor && p.sowDate <= addDays(today, 45)).sort((a, b) => a.sowDate.localeCompare(b.sowDate));
  const { now, next } = sowIndoorNow(data, today, SPECIES);
  const shown = showAll ? now : now.slice(0, 12);
  return (
    <>
      <Card
        title={`🪴 ${tt('nursery.title')}`}
        action={
          <Button small kind="primary" onClick={() => nav.open({ type: 'addPlant', indoor: true })}>
            + {tt('nursery.add')}
          </Button>
        }
      >
        <p className="mb-3 text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('nursery.lead')}
        </p>
        {list.length === 0 ? <Empty>{tt('nursery.none')}</Empty> : <ul className="space-y-2">{list.map((ns) => <SeedlingCard key={ns.plant.id} ns={ns} />)}</ul>}
      </Card>

      {planned.length > 0 && (
        <Card title={`🗓 ${tt('nursery.planned')}`}>
          <ul className="space-y-1.5">
            {planned.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded px-3 py-2 text-sm" style={{ background: 'var(--color-paper-200)' }}>
                <span className="min-w-0">
                  {SPECIES.find((s) => s.id === p.speciesId)?.emoji} {plantTitle(p, lang)}{' '}
                  <span className="text-xs" style={{ color: INK700 }}>
                    · {fmtDate(p.sowDate, lang)}
                  </span>
                </span>
                <Button small kind="ghost" onClick={() => store.savePlant({ ...p, status: 'growing', sowDate: today })}>
                  {tt('nursery.sowToday')}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={`🌱 ${tt('nursery.nowTitle')}`}>
        <p className="mb-2 text-xs" style={{ color: INK500 }}>
          {tt('nursery.nowHint')}
        </p>
        {now.length === 0 ? (
          <Empty>{tt('nursery.nothingNow')}</Empty>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {shown.map((s) => (
              <Chip key={s.id} onClick={() => nav.open({ type: 'addPlant', speciesId: s.id, indoor: true })}>
                {s.emoji} {s.name[lang]}
              </Chip>
            ))}
            {!showAll && now.length > shown.length && <Chip onClick={() => setShowAll(true)}>{tt('nursery.more', { n: now.length })}</Chip>}
          </div>
        )}
        {next.length > 0 && (
          <p className="mt-3 text-xs leading-relaxed" style={{ color: INK700 }}>
            <b>{tt('nursery.nextTitle')}</b> {next.slice(0, 14).map((s) => `${s.emoji} ${s.name[lang]}`).join(', ')}
            {next.length > 14 ? '…' : ''}
          </p>
        )}
      </Card>

      <Card title={`💡 ${tt('nursery.tipsTitle')}`}>
        <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed" style={{ color: INK700 }}>
          {(['1', '2', '3', '4', '5'] as const).map((k) => (
            <li key={k}>{tt(`nursery.tip${k}` as JKey)}</li>
          ))}
        </ul>
      </Card>
    </>
  );
}
