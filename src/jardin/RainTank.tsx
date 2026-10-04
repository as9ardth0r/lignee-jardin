/**
 * Carte « Récupérateurs d'eau de pluie » (onglet Jardin) : niveau estimé de
 * chaque cuve (pluie sur le toit, arrosages puisés), réserve en jours,
 * débordements, et relevé du niveau pour recaler l'estimation.
 */
import { useState } from 'react';
import { suggestedCapacity, tankStatus } from './engine/rainTank';
import { fmtDate, fmtNum } from './format';
import { useJT } from './i18n';
import { uid, type RainTank } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Empty, INK500, INK700, Meter } from './ui';

const inputStyle = { background: 'var(--color-paper-100)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' };
const n = (v: string) => {
  const x = Number(v.replace(',', '.'));
  return Number.isFinite(x) && x >= 0 ? x : NaN;
};

function TankRow({ tank }: { tank: RainTank }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [reading, setReading] = useState<string | null>(null);
  const st = tankStatus(tank, data, today);
  const last30 = st.history.reduce((s, d) => s + d.inflow, 0);
  return (
    <li className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">🛢 {tank.name}</p>
        <span className="font-data text-sm">
          {fmtNum(st.level, lang, 0)} / {fmtNum(tank.capacityL, lang, 0)} L
        </span>
      </div>
      <div className="mt-1.5">
        <Meter value={st.level} max={tank.capacityL} threshold={tank.capacityL * 0.15} color="#4a86b0" label={tt('tankRain.levelLabel', { pct: Math.round(st.ratio * 100) })} />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed" style={{ color: INK700 }}>
        {st.daysLeft !== null ? tt('tankRain.daysLeft', { days: st.daysLeft, l: fmtNum(st.drawPerDay, lang, 0) }) : tt('tankRain.noDraw')}
        {st.expectedInflow >= 1 ? ` ${tt('tankRain.expected', { l: fmtNum(st.expectedInflow, lang, 0) })}` : ''}
        {` ${tt('tankRain.month', { l: fmtNum(last30, lang, 0) })}`}
        {st.overflowL >= 10 ? ` ${tt('tankRain.overflow', { l: fmtNum(st.overflowL, lang, 0) })}` : ''}
      </p>
      <p className="text-[11px]" style={{ color: INK500 }}>
        {tt('tankRain.since', { date: fmtDate(tank.since, lang, true), l: fmtNum(tank.level, lang, 0), roof: fmtNum(tank.roofM2, lang, 0) })}
      </p>
      {reading === null ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button small kind="ghost" onClick={() => setReading(String(st.level))}>
            📏 {tt('tankRain.read')}
          </Button>
          <Button small kind="ghost" onClick={() => window.confirm(tt('tankRain.deleteConfirm', { name: tank.name })) && store.deleteRainTank(tank.id)}>
            {tt('common.delete')}
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={reading} onChange={(e) => setReading(e.target.value)} inputMode="decimal" aria-label={tt('tankRain.read')} className="field w-24 rounded px-2 py-1.5 text-right font-data text-sm outline-none" style={inputStyle} />
          <span className="text-sm">L</span>
          <Button
            small
            kind="primary"
            disabled={!(n(reading) >= 0)}
            onClick={() => {
              store.saveRainTank({ ...tank, level: Math.min(tank.capacityL, n(reading)), since: today });
              setReading(null);
              nav.toast(tt('tankRain.saved'));
            }}
          >
            {tt('common.save')}
          </Button>
          <Button small kind="ghost" onClick={() => setReading(null)}>
            {tt('common.cancel')}
          </Button>
        </div>
      )}
    </li>
  );
}

export function RainTankCard() {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [cap, setCap] = useState('300');
  const [roof, setRoof] = useState('20');
  const [level, setLevel] = useState('0');
  const tanks = data.rainTanks ?? [];
  const ok = n(cap) > 0 && n(roof) > 0 && n(level) >= 0;
  return (
    <Card
      title={`🛢 ${tt('tankRain.title')}`}
      action={
        <Button small kind="primary" onClick={() => setAdding(!adding)}>
          + {tt('tankRain.add')}
        </Button>
      }
    >
      {adding && (
        <div className="mb-3 space-y-2 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tt('tankRain.namePh')} aria-label={tt('tankRain.name')} className="field w-full rounded px-2 py-1.5 text-sm outline-none" style={inputStyle} />
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(
              [
                [tt('tankRain.capacity'), cap, setCap],
                [tt('tankRain.roof'), roof, setRoof],
                [tt('tankRain.levelNow'), level, setLevel],
              ] as Array<[string, string, (v: string) => void]>
            ).map(([label, v, set]) => (
              <label key={label} className="block">
                <span className="mb-0.5 block" style={{ color: INK700 }}>
                  {label}
                </span>
                <input value={v} onChange={(e) => set(e.target.value)} inputMode="decimal" className="field w-full rounded px-2 py-1.5 text-right font-data text-sm outline-none" style={inputStyle} />
              </label>
            ))}
          </div>
          {n(roof) > 0 && (
            <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
              {tt('tankRain.sizeHint', { l: fmtNum(suggestedCapacity(n(roof)), lang, 0), roof: fmtNum(n(roof), lang, 0) })}
            </p>
          )}
          <Button
            small
            kind="primary"
            disabled={!ok}
            onClick={() => {
              store.saveRainTank({ id: uid('rt'), name: name.trim() || tt('tankRain.defaultName', { n: tanks.length + 1 }), capacityL: n(cap), roofM2: n(roof), level: Math.min(n(cap), n(level)), since: today });
              setAdding(false);
              setName('');
            }}
          >
            {tt('common.save')}
          </Button>
        </div>
      )}
      {tanks.length === 0 ? <Empty>{tt('tankRain.none')}</Empty> : <ul className="space-y-2">{tanks.map((t) => <TankRow key={t.id} tank={t} />)}</ul>}
      <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('tankRain.note')}
      </p>
    </Card>
  );
}
