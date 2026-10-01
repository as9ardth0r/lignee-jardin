import { useMemo } from 'react';
import { addDays, diffDays } from './engine/dates';
import { growthReport, harvestProgress, type GrowthState } from './engine/growth';
import { fmtDate, fmtNum } from './format';
import { useJT, type JKey } from './i18n';
import type { Plant } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, INK500, INK700, Why } from './ui';

const STATE_COLOR: Record<GrowthState, string> = { ahead: '#2f6a96', normal: '#4a7f36', behind: '#a5532f' };
const W = 320;
const H = 130;
const PAD = { l: 30, r: 8, t: 16, b: 18 };

/** Petit graphique : courbe de référence (pointillés) et mesures (points). */
function Chart({ from, to, max, ref, pts, today, unit, label }: { from: string; to: string; max: number; ref: Array<[string, number]>; pts: Array<[string, number]>; today: string; unit: string; label: string }) {
  const { lang } = useJT();
  const span = Math.max(1, diffDays(from, to));
  const x = (d: string) => PAD.l + (Math.max(0, Math.min(span, diffDays(from, d))) / span) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
  const line = (l: Array<[string, number]>) => l.map(([d, v]) => `${x(d).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={label}>
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="var(--color-paper-300)" />
      <line x1={PAD.l} x2={W - PAD.r} y1={y(max / 2)} y2={y(max / 2)} stroke="var(--color-paper-300)" strokeDasharray="2 3" />
      <text x={PAD.l - 4} y={y(max) + 8} textAnchor="end" fontSize={9} fill="var(--color-ink-500)">
        {fmtNum(max, lang, 0)}
      </text>
      <text x={PAD.l - 4} y={y(max / 2) + 3} textAnchor="end" fontSize={9} fill="var(--color-ink-500)">
        {fmtNum(max / 2, lang, 0)}
      </text>
      <text x={PAD.l} y={9} fontSize={9} fill="var(--color-ink-500)">
        {unit}
      </text>
      <text x={PAD.l} y={H - 4} fontSize={9} fill="var(--color-ink-500)">
        {fmtDate(from, lang)}
      </text>
      <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize={9} fill="var(--color-ink-500)">
        {fmtDate(to, lang)}
      </text>
      {today >= from && today <= to && <line x1={x(today)} x2={x(today)} y1={PAD.t} y2={H - PAD.b} stroke="var(--color-ink-700)" strokeWidth={0.8} opacity={0.5} />}
      <polyline points={line(ref)} fill="none" stroke="#a08a5c" strokeWidth={1.6} strokeDasharray="5 3" />
      {pts.length > 1 && <polyline points={line(pts)} fill="none" stroke="#2f6a96" strokeWidth={1.6} />}
      {pts.map(([d, v]) => (
        <circle key={d} cx={x(d)} cy={y(v)} r={3} fill="#2f6a96" />
      ))}
    </svg>
  );
}

/** Croissance et récolte comparées à la référence, dans la fiche d'une culture. */
export function GrowthPanel({ plant }: { plant: Plant }) {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const g = useMemo(() => growthReport(plant, data, today), [plant, data, today]);
  const h = useMemo(() => harvestProgress(plant, data, today), [plant, data, today]);
  if (plant.status === 'planned') return null;
  // Axe : du semis à un mois après aujourd'hui (ou la dernière mesure), sans dépasser la fin de saison.
  const seasonEnd = g.curve[g.curve.length - 1]?.date ?? today;
  const lastSeen = g.points.length && g.points[g.points.length - 1].date > today ? g.points[g.points.length - 1].date : today;
  const horizon = addDays(lastSeen, 30);
  const end = horizon < seasonEnd ? horizon : seasonEnd;
  const curve = g.curve.filter((c) => c.date <= end);
  const maxH = Math.max(g.mature, ...g.points.map((p) => p.measured)) * 1.1;
  return (
    <section>
      <h3 className="mb-1 font-display text-lg">📏 {tt('growth.title')}</h3>
      {g.points.length === 0 ? (
        <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
          {tt('growth.noMeasure', { h: g.mature })}
        </p>
      ) : (
        g.latest && (
          <p className="text-sm">
            {tt('growth.latest', { m: fmtNum(g.latest.measured, lang, 0), r: fmtNum(g.latest.reference, lang, 0), date: fmtDate(g.latest.date, lang) })}{' '}
            <b style={{ color: STATE_COLOR[g.latest.state] }}>{tt(`growth.state.${g.latest.state}` as JKey, { pct: Math.round(Math.abs(g.latest.ratio - 1) * 100) })}</b>
          </p>
        )
      )}
      <Chart from={plant.sowDate} to={end} max={maxH} ref={curve.map((c) => [c.date, c.reference])} pts={g.points.map((p) => [p.date, p.measured])} today={today} unit="cm" label={tt('growth.chart')} />
      <p className="text-[11px]" style={{ color: INK500 }}>
        <span style={{ color: '#a08a5c' }}>- - -</span> {tt('growth.legendRef')} · <span style={{ color: '#2f6a96' }}>●</span> {tt('growth.legendMeasured')}
      </p>
      {plant.status === 'growing' && (
        <div className="mt-1">
          <Button small kind="ghost" onClick={() => nav.open({ type: 'observe', plantId: plant.id })}>
            📏 {tt('growth.measure')}
          </Button>
        </div>
      )}

      {h && (
        <div className="mt-3">
          <p className="text-sm">
            {tt('growth.harvest', { got: fmtNum(h.harvestedKg, lang, 1), due: fmtNum(h.dueKg, lang, 1), total: fmtNum(h.expectedKg, lang, 1) })}{' '}
            {h.state && <b style={{ color: STATE_COLOR[h.state] }}>{tt(`growth.harvestState.${h.state}` as JKey)}</b>}
          </p>
          <Chart
            from={h.from < (h.cumul[0]?.date ?? h.from) ? h.from : h.cumul[0].date}
            to={h.to > today ? h.to : today}
            max={Math.max(h.expectedKg, h.harvestedKg, 0.1) * 1.1}
            ref={[
              [h.from, 0],
              [h.to, h.expectedKg],
            ]}
            pts={h.cumul.map((c) => [c.date, c.kg])}
            today={today}
            unit="kg"
            label={tt('growth.harvestChart')}
          />
        </div>
      )}
      <Why label={tt('common.why')}>
        <p>{tt('growth.why', { h: g.mature })}</p>
      </Why>
    </section>
  );
}
