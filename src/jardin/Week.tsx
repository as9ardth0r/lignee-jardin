/** « Cette semaine au jardin » : résumé des 7 prochains jours. */
import { useMemo } from 'react';
import { MONTH_WORKS } from './data/monthWorks';
import { SPECIES_BY_ID } from './data/species';
import { weekPlan } from './engine/week';
import { fmtDate, fmtNum, monthName, plantTitle, speciesName } from './format';
import { useJT } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { TaskText } from './TodayView';
import { Button, Card, INK500, INK700, Notice, Sheet } from './ui';

export function WeekCard() {
  const { data, today } = useGarden();
  const { tt } = useJT();
  const nav = useNav();
  const w = useMemo(() => weekPlan(data, today), [data, today]);
  return (
    <Card title={`📅 ${tt('week.title')}`} action={<Button small kind="primary" onClick={() => nav.open({ type: 'week' })}>{tt('week.open')}</Button>}>
      <p className="text-sm" style={{ color: INK700 }} data-testid="week-summary">
        {tt('week.summary', { tasks: w.tasks.length, sow: w.sow.length, harvest: w.harvest.length + w.orchard.length })}
        {w.frost ? ` ❄ ${tt('week.frostShort', { t: Math.round(w.frost.tmin) })}` : ''}
      </p>
    </Card>
  );
}

export function WeekSheet({ onClose }: { onClose: () => void }) {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const w = useMemo(() => weekPlan(data, today), [data, today]);
  const H = ({ children }: { children: React.ReactNode }) => <h3 className="mb-1 mt-1 font-display text-base">{children}</h3>;
  return (
    <Sheet title={`📅 ${tt('week.title')}`} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <p className="text-xs" style={{ color: INK500 }}>
          {tt('week.range', { from: fmtDate(w.from, lang), to: fmtDate(w.to, lang) })}
        </p>
        {(w.frost || w.hot || w.rainMm !== undefined) && (
          <section>
            <H>🌦 {tt('week.weather')}</H>
            {w.frost && <Notice tone="warn">❄ {tt('week.frost', { date: fmtDate(w.frost.date, lang), t: fmtNum(w.frost.tmin, lang, 0) })}</Notice>}
            {w.hot && <Notice tone="warn">🔥 {tt('week.hot', { date: fmtDate(w.hot.date, lang), t: fmtNum(w.hot.tmax, lang, 0) })}</Notice>}
            {w.rainMm !== undefined && <p className="mt-1 text-sm">{tt(w.rainMm < 5 ? 'week.dry' : 'week.rain', { mm: fmtNum(w.rainMm, lang, 0) })}</p>}
          </section>
        )}
        <section>
          <H>✅ {tt('week.tasks', { n: w.tasks.length })}</H>
          {w.tasks.length === 0 ? (
            <p className="text-sm" style={{ color: INK500 }}>
              {tt('week.noTasks')}
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {w.tasks.map((t) => (
                <li key={t.key} className="flex gap-2">
                  <span className="w-16 shrink-0 text-xs" style={{ color: INK500 }}>
                    {t.due <= today ? tt('today.today') : fmtDate(t.due, lang)}
                  </span>
                  <span>
                    <TaskText task={t} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {w.sow.length > 0 && (
          <section>
            <H>🌱 {tt('week.sow')}</H>
            <p className="mb-1 text-xs" style={{ color: INK700 }}>
              {tt('week.sowLead')}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {w.sow.map((s) => (
                <li key={s.speciesId}>
                  <button type="button" onClick={() => nav.open({ type: 'addPlant', speciesId: s.speciesId, indoor: s.how === 'indoor' || undefined, varietyName: s.variety })} className="rounded-full px-2.5 py-1 text-xs" style={{ background: s.how === 'indoor' ? '#f3e6d2' : '#e6efdc' }}>
                    {SPECIES_BY_ID[s.speciesId]?.emoji} {speciesName(s.speciesId, lang)}
                    {s.variety ? ` · ${s.variety}` : ''} · {tt(s.how === 'indoor' ? 'week.indoor' : 'week.outdoor')}
                    {s.old ? ' ⚠' : ''}
                  </button>
                </li>
              ))}
            </ul>
            {w.sow.some((s) => s.old) && (
              <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
                ⚠ {tt('week.oldSeeds')}
              </p>
            )}
          </section>
        )}
        {(w.harvest.length > 0 || w.orchard.length > 0) && (
          <section>
            <H>🧺 {tt('week.harvest')}</H>
            <ul className="flex flex-wrap gap-1.5">
              {w.harvest.map((h) => {
                const p = data.plants.find((x) => x.id === h.plantId)!;
                return (
                  <li key={h.plantId}>
                    <button type="button" onClick={() => nav.open({ type: 'plant', id: h.plantId })} className="rounded-full px-2.5 py-1 text-xs" style={{ background: 'var(--color-paper-200)' }}>
                      {SPECIES_BY_ID[h.speciesId]?.emoji} {plantTitle(p, lang)}
                    </button>
                  </li>
                );
              })}
              {w.orchard.map((id) => (
                <li key={id} className="rounded-full px-2.5 py-1 text-xs" style={{ background: '#f3e6d2' }}>
                  {SPECIES_BY_ID[id]?.emoji} {speciesName(id, lang)}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <H>🗓 {tt('week.works', { month: monthName(w.month, lang, 'long') })}</H>
          <ul className="list-disc space-y-1 pl-5 text-sm" style={{ color: INK700 }}>
            {(MONTH_WORKS[w.month] ?? []).map((x, i) => (
              <li key={i}>{x[lang]}</li>
            ))}
          </ul>
          <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
            {tt('week.worksNote')}
          </p>
        </section>
      </div>
    </Sheet>
  );
}
