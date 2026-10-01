import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { TEXTURES } from './data/climate';
import { PRODUCT_BY_ID } from './data/products';
import { SPECIES_BY_ID } from './data/species';
import { uid, type Bed, type BedKind, type Obstacle, type ObstacleKind, type Texture } from './model';
import { bedSun, DEFAULT_LAT, shadowPolygon, sunMismatch, sunPosition } from './engine/sun';
import { isActiveOn } from './engine/crop';
import { bedArea, waterAdvice, WATER_THRESHOLD, type WaterAdvice, type WaterDay } from './engine/water';
import type { TT } from './i18n';
import { fmtDate, fmtG, fmtL, fmtNum, plantTitle } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Chip, Empty, Field, INK500, INK700, Meter, Notice, Select, Sheet, TextInput, Why } from './ui';
import { BedSensors, SensorsCard } from './Sensors';
import { BedSoil, SoilCard } from './Soil';

const BED_FILL: Record<BedKind, { fill: string; stroke: string }> = {
  bed: { fill: '#8a6a44', stroke: '#5a4329' },
  pot: { fill: '#b8643a', stroke: '#7a3f22' },
  greenhouse: { fill: '#cfe3e8', stroke: '#6f8f98' },
  hydro: { fill: '#3f7f8c', stroke: '#24525b' },
};

const snap = (v: number) => Math.round(v * 10) / 10;

/** Conseil d'arrosage en une ligne (partagé avec l'écran Aujourd'hui). */
export function waterText(adv: WaterAdvice, tt: TT, lang: 'fr' | 'en'): string {
  if (!adv.hasPlants) return tt('water.noPlants');
  if (adv.postponed) return `🌧 ${tt('water.postponed', { mm: fmtNum(adv.rainExpected, lang, 0) })}`;
  if (adv.water) return `💧 ${tt('water.needLiters', { liters: fmtL(adv.liters, lang) })}${adv.dripMinutes ? ` (${tt('water.dripMin', { min: adv.dripMinutes })})` : ''}`;
  return `${tt('water.okDays', { days: Math.min(adv.daysLeft, 30) })}${adv.sensorToday ? ` · 📡 ${tt('water.probe')}` : ''}`;
}

const OBSTACLE_FILL: Record<ObstacleKind, { fill: string; stroke: string }> = {
  building: { fill: '#6b6455', stroke: '#3a352a' },
  wall: { fill: '#8a8270', stroke: '#4a4434' },
  tree: { fill: '#3f6a34', stroke: '#2a4a22' },
  hedge: { fill: '#4f7a3c', stroke: '#2f5040' },
};

/** Jours proposés pour l'aperçu des ombres. */
export const SUN_DAYS: Array<{ doy: number; key: 'march' | 'june' | 'sept' | 'dec' }> = [
  { doy: 80, key: 'march' },
  { doy: 172, key: 'june' },
  { doy: 266, key: 'sept' },
  { doy: 355, key: 'dec' },
];

type DragTarget = { kind: 'bed' | 'obs'; id: string; dx: number; dy: number; moved: boolean };

/** Plan du jardin : planches et obstacles déplaçables au doigt (pas de 10 cm), ombres portées. */
function GardenPlan({ sun }: { sun: { doy: number; hour: number } | null }) {
  const { data, saveBed, saveObstacle, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<DragTarget | null>(null);
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null);
  const { planW, planH, planNorth } = data.settings;
  const lat = data.settings.lat ?? DEFAULT_LAT;

  const toPlan = (e: RPointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const vw = planW + 0.4;
    const vh = planH + 0.4;
    return { x: ((e.clientX - r.left) / r.width) * vw - 0.2, y: ((e.clientY - r.top) / r.height) * vh - 0.2 };
  };
  const itemOf = (d: DragTarget) => (d.kind === 'bed' ? data.beds.find((x) => x.id === d.id) : data.obstacles.find((x) => x.id === d.id));

  const onDown = (e: RPointerEvent, kind: 'bed' | 'obs', item: { id: string; x: number; y: number }) => {
    const p = toPlan(e);
    drag.current = { kind, id: item.id, dx: p.x - item.x, dy: p.y - item.y, moved: false };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const it = itemOf(d);
    if (!it) return;
    const p = toPlan(e);
    const x = snap(Math.max(0, Math.min(planW - it.w, p.x - d.dx)));
    const y = snap(Math.max(0, Math.min(planH - it.h, p.y - d.dy)));
    if (Math.abs(x - it.x) > 0.05 || Math.abs(y - it.y) > 0.05) d.moved = true;
    if (d.moved) setLive({ id: it.id, x, y });
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.kind === 'bed') {
      const b = data.beds.find((x) => x.id === d.id);
      if (b && d.moved && live) saveBed({ ...b, x: live.x, y: live.y });
      else nav.open({ type: 'bed', id: d.id });
    } else {
      const o = data.obstacles.find((x) => x.id === d.id);
      if (o && d.moved && live) saveObstacle({ ...o, x: live.x, y: live.y });
      else nav.open({ type: 'obstacle', id: d.id });
    }
    setLive(null);
  };
  const pos = (it: { id: string; x: number; y: number }) => (live?.id === it.id ? { x: live.x, y: live.y } : { x: it.x, y: it.y });

  const grid = [];
  for (let x = 0; x <= planW; x++) grid.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={planH} stroke="#3b5942" strokeWidth={0.02} />);
  for (let y = 0; y <= planH; y++) grid.push(<line key={`y${y}`} x1={0} y1={y} x2={planW} y2={y} stroke="#3b5942" strokeWidth={0.02} />);

  const sunPos = sun ? sunPosition(lat, sun.doy, sun.hour) : null;
  const obstaclesLive = data.obstacles.map((o) => ({ ...o, ...pos(o) }));
  // Rose des vents : flèche vers le nord dans le coin haut droit.
  const nr = (planNorth * Math.PI) / 180;
  const cx = planW - 0.55;
  const cy = 0.55;

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`-0.2 -0.2 ${planW + 0.4} ${planH + 0.4}`}
        className="w-full touch-none select-none rounded"
        style={{ background: '#1c2e20', aspectRatio: `${planW + 0.4} / ${planH + 0.4}` }}
        role="img"
        aria-label={tt('garden.planLabel', { w: planW, h: planH })}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drag.current = null;
          setLive(null);
        }}
      >
        <defs>
          <clipPath id="plan-clip">
            <rect x={0} y={0} width={planW} height={planH} />
          </clipPath>
        </defs>
        {grid}
        {data.beds.map((b) => {
          const { x, y } = pos(b);
          const c = BED_FILL[b.kind];
          const emojis = [...new Set(data.plants.filter((p) => p.bedId === b.id && isActiveOn(p, today)).map((p) => SPECIES_BY_ID[p.speciesId]?.emoji))].slice(0, 4).join('');
          const fs = Math.max(0.22, Math.min(0.42, Math.min(b.w, b.h) * 0.28));
          return (
            <g key={b.id} onPointerDown={(e) => onDown(e, 'bed', b)} style={{ cursor: 'grab' }}>
              <rect x={x} y={y} width={b.w} height={b.h} rx={b.kind === 'pot' ? Math.min(b.w, b.h) / 2 : 0.08} fill={c.fill} fillOpacity={b.kind === 'greenhouse' ? 0.35 : 1} stroke={c.stroke} strokeWidth={0.05} />
              {b.mulch && <rect x={x + 0.06} y={y + 0.06} width={Math.max(0, b.w - 0.12)} height={Math.max(0, b.h - 0.12)} rx={0.05} fill="none" stroke="#e8d79a" strokeWidth={0.03} strokeDasharray="0.12 0.08" />}
              <text x={x + b.w / 2} y={y + b.h / 2 - (emojis ? fs * 0.25 : -fs * 0.35)} textAnchor="middle" fontSize={fs} fill="#faf7ee" style={{ pointerEvents: 'none', fontWeight: 600 }}>
                {b.name}
              </text>
              {emojis && (
                <text x={x + b.w / 2} y={y + b.h / 2 + fs * 0.95} textAnchor="middle" fontSize={fs * 0.9} style={{ pointerEvents: 'none' }}>
                  {emojis}
                </text>
              )}
            </g>
          );
        })}
        {sunPos && sunPos.alt > 0 && (
          <g clipPath="url(#plan-clip)" style={{ pointerEvents: 'none' }}>
            {obstaclesLive.map((o) => (
              <polygon key={o.id} points={shadowPolygon(o, sunPos, planNorth).map(([x, y]) => `${x},${y}`).join(' ')} fill="#000" fillOpacity={0.38} />
            ))}
          </g>
        )}
        {data.obstacles.map((o) => {
          const { x, y } = pos(o);
          const c = OBSTACLE_FILL[o.kind];
          // Nom puis hauteur sur deux lignes, taille ajustée à la largeur de l'obstacle.
          const fs = Math.max(0.16, Math.min(0.4, Math.min(o.w, o.h) * 0.3, (o.w * 0.9) / (0.58 * Math.max(4, o.name.length))));
          return (
            <g key={o.id} onPointerDown={(e) => onDown(e, 'obs', o)} style={{ cursor: 'grab' }}>
              {o.kind === 'tree' ? (
                <ellipse cx={x + o.w / 2} cy={y + o.h / 2} rx={o.w / 2} ry={o.h / 2} fill={c.fill} stroke={c.stroke} strokeWidth={0.05} />
              ) : (
                <rect x={x} y={y} width={o.w} height={o.h} rx={o.kind === 'hedge' ? 0.2 : 0.03} fill={c.fill} stroke={c.stroke} strokeWidth={0.05} />
              )}
              <text x={x + o.w / 2} y={y + o.h / 2 - fs * 0.2} textAnchor="middle" fontSize={fs} fill="#faf7ee" style={{ pointerEvents: 'none' }}>
                {o.name}
                <tspan x={x + o.w / 2} dy={fs * 1.15} fontSize={fs * 0.85} opacity={0.85}>
                  ↑ {fmtNum(o.height, lang, 1)} m
                </tspan>
              </text>
            </g>
          );
        })}
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={cx} cy={cy} r={0.38} fill="#0f1a12" fillOpacity={0.7} stroke="#d9ae52" strokeWidth={0.03} />
          <path d={`M ${cx + Math.sin(nr) * 0.3} ${cy - Math.cos(nr) * 0.3} L ${cx - Math.cos(nr) * 0.1} ${cy - Math.sin(nr) * 0.1} L ${cx + Math.cos(nr) * 0.1} ${cy + Math.sin(nr) * 0.1} Z`} fill="#d9ae52" />
          <text x={cx - Math.sin(nr) * 0.2} y={cy + Math.cos(nr) * 0.2 + 0.08} textAnchor="middle" fontSize={0.22} fill="#faf7ee" fontWeight={700}>
            {tt('garden.north')}
          </text>
        </g>
        {sunPos && sunPos.alt <= 0 && (
          <rect x={0} y={0} width={planW} height={planH} fill="#000" fillOpacity={0.45} style={{ pointerEvents: 'none' }} />
        )}
      </svg>
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('garden.planHint', { w: planW, h: planH })}
      </p>
    </div>
  );
}

/** Heures de soleil des planches (mémorisées tant que planches et obstacles ne bougent pas). */
export function useBedSun() {
  const { data } = useGarden();
  const lat = data.settings.lat ?? DEFAULT_LAT;
  return useMemo(() => {
    const m = new Map<string, ReturnType<typeof bedSun>>();
    for (const b of data.beds) m.set(b.id, bedSun(b, data.obstacles, lat, data.settings.planNorth));
    return m;
  }, [data.beds, data.obstacles, lat, data.settings.planNorth]);
}

export function GardenView() {
  const { data, saveBed, saveObstacle, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const [showSun, setShowSun] = useState(false);
  const [doy, setDoy] = useState(172);
  const [hour, setHour] = useState(16);
  const sunInfo = useBedSun();

  const freeSpot = (w: number, h: number) => {
    const { planW, planH } = data.settings;
    const items = [...data.beds, ...data.obstacles];
    for (let y = 0.5; y + h <= planH; y += 0.5)
      for (let x = 0.5; x + w <= planW; x += 0.5) {
        if (items.every((b) => x + w <= b.x - 0.3 || x >= b.x + b.w + 0.3 || y + h <= b.y - 0.3 || y >= b.y + b.h + 0.3)) return { x, y };
      }
    return { x: 0.5, y: 0.5 };
  };

  const addBed = () => {
    const w = Math.min(4, data.settings.planW - 1);
    const bed: Bed = { id: uid('bed'), name: tt('garden.bedN', { n: data.beds.length + 1 }), kind: 'bed', ...freeSpot(w, 1.2), w, h: 1.2, mulch: false, drip: false, createdAt: today };
    saveBed(bed);
    nav.open({ type: 'bed', id: bed.id });
  };

  const addObstacle = () => {
    const o: Obstacle = { id: uid('obs'), name: tt('obstacle.default'), kind: 'tree', ...freeSpot(2, 2), w: 2, h: 2, height: 4 };
    saveObstacle(o);
    nav.open({ type: 'obstacle', id: o.id });
  };

  return (
    <div className="space-y-4">
      <Card
        title={tt('garden.title')}
        action={
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button kind="ghost" small onClick={addObstacle}>
              + {tt('garden.addObstacle')}
            </Button>
            <Button kind="primary" small onClick={addBed}>
              + {tt('garden.addBed')}
            </Button>
          </div>
        }
      >
        <GardenPlan sun={showSun ? { doy, hour } : null} />
        <div className="mt-3 rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={showSun} onChange={(e) => setShowSun(e.target.checked)} /> ☀ {tt('garden.shadows')}
          </label>
          {showSun && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {SUN_DAYS.map((d) => (
                  <Chip key={d.key} active={doy === d.doy} onClick={() => setDoy(d.doy)}>
                    {tt(`sunday.${d.key}` as JKey)}
                  </Chip>
                ))}
              </div>
              <label className="flex items-center gap-3 text-xs" style={{ color: INK700 }}>
                <span className="w-24 shrink-0">{tt('garden.hour', { h: hour })}</span>
                <input type="range" min={5} max={21} step={1} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="resin-range" style={{ ['--range-progress' as string]: `${((hour - 5) / 16) * 100}%` }} aria-label={tt('garden.hourLabel')} />
              </label>
              <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
                {tt('garden.shadowsHint', { lat: fmtNum(data.settings.lat ?? DEFAULT_LAT, lang, 1) })}
              </p>
            </div>
          )}
        </div>
      </Card>
      <Card title={tt('garden.beds', { n: data.beds.length })}>
        {data.beds.length === 0 ? (
          <Empty>{tt('garden.noBed')}</Empty>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.beds.map((b) => {
              const active = data.plants.filter((p) => p.bedId === b.id && p.status !== 'ended');
              const sun = sunInfo.get(b.id);
              return (
                <li key={b.id}>
                  <button type="button" onClick={() => nav.open({ type: 'bed', id: b.id })} className="w-full rounded px-3 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-[11px]" style={{ color: INK500 }}>
                        {tt(`bedKind.${b.kind}` as JKey)} · {fmtNum(bedArea(b), lang, 1)} m²
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-baseline justify-between gap-2 text-xs" style={{ color: INK700 }}>
                      <span className="truncate">{active.length ? active.map((p) => SPECIES_BY_ID[p.speciesId]?.emoji).join(' ') : tt('garden.bedEmpty')}</span>
                      {sun && (
                        <span className="shrink-0" title={tt('sun.seasonHint')}>
                          ☀ {tt('sun.hours', { h: fmtNum(sun.season, lang, 1) })} · {tt(`sun.${sun.exposure}` as JKey)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <SoilCard />
      <SensorsCard />
    </div>
  );
}

// --- Obstacle -------------------------------------------------------------------------

export function ObstacleSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const store = useGarden();
  const { tt } = useJT();
  const o = store.data.obstacles.find((x) => x.id === id);
  if (!o) return null;
  const set = (patch: Partial<Obstacle>) => store.saveObstacle({ ...o, ...patch });
  const num = (v: string, min: number, max: number) => Math.max(min, Math.min(max, Number(v.replace(',', '.')) || min));
  return (
    <Sheet title={o.name || tt('obstacle.title')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('bed.name')}>{(fid) => <TextInput id={fid} value={o.name} onChange={(v) => set({ name: v })} />}</Field>
          <Field label={tt('obstacle.kind')}>
            {(fid) => <Select id={fid} value={o.kind} onChange={(v) => set({ kind: v })} options={(['building', 'wall', 'tree', 'hedge'] as ObstacleKind[]).map((k) => ({ v: k, l: tt(`obstacleKind.${k}` as JKey) }))} />}
          </Field>
          <Field label={tt('bed.w')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={o.w} onChange={(v) => set({ w: num(v, 0.1, 60) })} />}</Field>
          <Field label={tt('bed.h')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={o.h} onChange={(v) => set({ h: num(v, 0.1, 60) })} />}</Field>
          <Field label={tt('obstacle.height')} hint={tt('obstacle.heightHint')}>
            {(fid) => <TextInput id={fid} type="number" step={0.5} value={o.height} onChange={(v) => set({ height: num(v, 0.2, 40) })} />}
          </Field>
        </div>
        <Button
          kind="danger"
          onClick={() => {
            store.deleteObstacle(o.id);
            onClose();
          }}
        >
          {tt('obstacle.delete')}
        </Button>
      </div>
    </Sheet>
  );
}

// --- Courbe de la réserve en eau ---------------------------------------------

/** Réserve utile sur 30 jours, avec le seuil d'arrosage et une lecture au survol. */
function WaterChart({ days }: { days: WaterDay[] }) {
  const { tt, lang } = useJT();
  const pts = days.slice(-30);
  const [hover, setHover] = useState<number | null>(null);
  if (pts.length < 2) return null;
  const W = 320;
  const H = 120;
  const L = 34;
  const R = 8;
  const T = 10;
  const B = 22;
  const maxRU = Math.max(...pts.map((p) => p.ru));
  const X = (i: number) => L + (i / (pts.length - 1)) * (W - L - R);
  const Y = (v: number) => T + (1 - v / maxRU) * (H - T - B);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.reserve).toFixed(1)}`).join(' ');
  const thr = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.ru * WATER_THRESHOLD).toFixed(1)}`).join(' ');
  const h = hover !== null ? pts[hover] : null;
  return (
    <figure className="mt-3">
      <figcaption className="mb-1 text-xs font-medium" style={{ color: INK700 }}>
        {tt('water.chartTitle')}
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={tt('water.chartTitle')}
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const x = ((e.clientX - r.left) / r.width) * W;
            setHover(Math.max(0, Math.min(pts.length - 1, Math.round(((x - L) / (W - L - R)) * (pts.length - 1)))));
          }}
          onPointerLeave={() => setHover(null)}
        >
          {[0, 0.5, 1].map((k) => (
            <g key={k}>
              <line x1={L} x2={W - R} y1={Y(maxRU * k)} y2={Y(maxRU * k)} stroke="#e8dcc0" strokeWidth={1} />
              <text x={L - 4} y={Y(maxRU * k) + 3} textAnchor="end" fontSize={9} fill="#6b6455">
                {Math.round(maxRU * k)}
              </text>
            </g>
          ))}
          <path d={thr} fill="none" stroke="#a87d2b" strokeWidth={1.2} strokeDasharray="4 3" />
          <path d={line} fill="none" stroke="#4a86b0" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (p.irrigation > 0 ? <circle key={i} cx={X(i)} cy={Y(p.reserve)} r={4} fill="#4a86b0" stroke="#faf7ee" strokeWidth={2} /> : null))}
          <text x={L} y={H - 6} fontSize={9} fill="#6b6455">
            {fmtDate(pts[0].date, lang)}
          </text>
          <text x={W - R} y={H - 6} fontSize={9} fill="#6b6455" textAnchor="end">
            {fmtDate(pts[pts.length - 1].date, lang)}
          </text>
          <text x={W - R} y={Y(pts[pts.length - 1].ru * WATER_THRESHOLD) - 4} fontSize={9} fill="#a87d2b" textAnchor="end">
            {tt('water.threshold')}
          </text>
          {h && hover !== null && <line x1={X(hover)} x2={X(hover)} y1={T} y2={H - B} stroke="#6b6455" strokeWidth={1} />}
        </svg>
        {h && hover !== null && (
          <div className="pointer-events-none absolute top-0 rounded px-2 py-1 text-[11px] leading-snug shadow" style={{ left: `${Math.min(70, (X(hover) / W) * 100)}%`, background: 'var(--color-canopy-900)', color: 'var(--color-paper-100)' }}>
            <b>{fmtDate(h.date, lang)}</b>
            <br />
            {tt('water.tipReserve', { mm: fmtNum(h.reserve, lang, 0), ru: fmtNum(h.ru, lang, 0) })}
            <br />
            {tt('water.tipFlux', { etc: fmtNum(h.etc, lang, 1), rain: fmtNum(h.rain, lang, 1), irr: fmtNum(h.irrigation, lang, 1) })}
          </div>
        )}
      </div>
      <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
        {tt('water.chartLegend')}
      </p>
    </figure>
  );
}

// --- Fiche d'une planche -------------------------------------------------------

export function BedSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const bed = data.beds.find((b) => b.id === id);
  const adv = useMemo(() => (bed ? waterAdvice(bed, data, today) : null), [bed, data, today]);
  const sunAll = useBedSun();
  if (!bed || !adv) return null;
  const set = (patch: Partial<Bed>) => store.saveBed({ ...bed, ...patch });
  const plants = data.plants.filter((p) => p.bedId === bed.id).sort((a, b) => b.sowDate.localeCompare(a.sowDate));
  const apps = data.applications.filter((a) => a.bedId === bed.id).sort((a, b) => b.date.localeCompare(a.date));
  const waters = data.water.filter((w) => w.bedId === bed.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const num = (v: string) => Math.max(0.2, Math.min(50, Number(v.replace(',', '.')) || 0.2));
  const sun = sunAll.get(bed.id);
  const mismatches = sun
    ? [...new Set(plants.filter((p) => p.status !== 'ended' && sunMismatch(SPECIES_BY_ID[p.speciesId].sun, sun.exposure)).map((p) => SPECIES_BY_ID[p.speciesId].name[lang]))]
    : [];

  return (
    <Sheet title={bed.name} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-5">
        <section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={tt('bed.name')}>{(fid) => <TextInput id={fid} value={bed.name} onChange={(v) => set({ name: v })} />}</Field>
            <Field label={tt('bed.kind')}>
              {(fid) => <Select id={fid} value={bed.kind} onChange={(v) => set({ kind: v })} options={(['bed', 'pot', 'greenhouse', 'hydro'] as BedKind[]).map((k) => ({ v: k, l: tt(`bedKind.${k}` as JKey) }))} />}
            </Field>
            {bed.kind !== 'hydro' && (
            <Field label={tt('bed.texture')}>
              {(fid) => (
                <Select
                  id={fid}
                  value={(bed.texture ?? '') as Texture | ''}
                  onChange={(v) => set({ texture: v === '' ? undefined : (v as Texture) })}
                  options={[{ v: '' as const, l: tt('bed.textureGarden', { t: tt(`texture.${data.settings.texture}` as JKey) }) }, ...TEXTURES.map((t) => ({ v: t as Texture | '', l: tt(`texture.${t}` as JKey) }))]}
                />
              )}
            </Field>
            )}
            <Field label={tt('bed.w')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={bed.w} onChange={(v) => set({ w: num(v) })} />}</Field>
            <Field label={tt('bed.h')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={bed.h} onChange={(v) => set({ h: num(v) })} />}</Field>
            {bed.kind !== 'hydro' && (
            <div className="flex flex-col justify-end gap-1.5 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={bed.mulch} onChange={(e) => set({ mulch: e.target.checked })} /> {tt('bed.mulch')}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={bed.drip} onChange={(e) => set({ drip: e.target.checked })} /> {tt('bed.drip')}
              </label>
            </div>
            )}
          </div>
          {bed.drip && bed.kind !== 'hydro' && (
            <div className="mt-3 max-w-xs">
              <Field label={tt('bed.dripFlow')} hint={tt('bed.dripFlowHint')}>
                {(fid) => <TextInput id={fid} type="number" step={1} value={bed.dripFlow ?? ''} onChange={(v) => set({ dripFlow: Number(v) > 0 ? Number(v) : undefined })} />}
              </Field>
            </div>
          )}
          <p className="mt-2 text-xs" style={{ color: INK500 }}>
            {tt('bed.area', { m2: fmtNum(bedArea(bed), lang, 1) })}
          </p>
        </section>

        {sun && (
          <section>
            <h3 className="mb-1 font-display text-lg">☀ {tt('sun.title')}</h3>
            <p className="text-sm">
              <b>{tt(`sun.${sun.exposure}` as JKey)}</b> · {tt('sun.seasonV', { h: fmtNum(sun.season, lang, 1), open: fmtNum(sun.open, lang, 1) })}
            </p>
            <p className="text-xs" style={{ color: INK700 }}>
              {tt('sun.details', { june: fmtNum(sun.june, lang, 1), eq: fmtNum(sun.equinox, lang, 1) })}
            </p>
            {mismatches.length > 0 && (
              <div className="mt-2">
                <Notice tone="warn">{tt('sun.mismatch', { names: mismatches.join(', ') })}</Notice>
              </div>
            )}
            <Why label={tt('common.why')}>
              <p>{tt('sun.why', { lat: fmtNum(data.settings.lat ?? DEFAULT_LAT, lang, 1) })}</p>
            </Why>
          </section>
        )}

        {bed.kind === 'hydro' && (
          <div className="max-w-xs">
            <Field label={tt('tank.volumeBed')}>{(fid) => <TextInput id={fid} type="number" value={bed.tankL ?? ''} onChange={(v) => set({ tankL: Number(v) > 0 ? Number(v) : undefined })} />}</Field>
          </div>
        )}
        <BedSensors bed={bed} />
        <BedSoil bed={bed} />

        {bed.kind !== 'hydro' && (
        <section>
          <h3 className="mb-2 font-display text-lg">💧 {tt('water.title')}</h3>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span>{tt('water.reserveLabel', { pct: Math.round(adv.ratio * 100) })}</span>
            <span className="text-xs" style={{ color: adv.water ? 'var(--color-tomato-600)' : INK500 }}>
              {waterText(adv, tt, lang)}
            </span>
          </div>
          <div className="mt-1.5">
            <Meter value={adv.reserve} max={adv.ru} threshold={adv.ru * WATER_THRESHOLD} color="#4a86b0" label={tt('water.reserveLabel', { pct: Math.round(adv.ratio * 100) })} />
          </div>
          <WaterChart days={adv.history} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button kind="primary" small onClick={() => nav.open({ type: 'water', bedId: bed.id, kind: 'irrigation', liters: adv.water ? Math.round(adv.liters) : undefined })}>
              + {tt('water.logIrrigation')}
            </Button>
            <Button kind="ghost" small onClick={() => nav.open({ type: 'water', kind: 'rain' })}>
              + {tt('water.logRain')}
            </Button>
          </div>
          {waters.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs" style={{ color: INK700 }}>
              {waters.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2">
                  <span>
                    {fmtDate(w.date, lang)} · {fmtL(w.amount, lang)}
                  </span>
                  <button type="button" onClick={() => store.deleteWater(w.id)} className="underline" style={{ color: INK500 }}>
                    {tt('common.delete')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Why label={tt('common.why')}>
            <p>{tt('water.why1', { ru: fmtNum(adv.ru, lang, 0), etc: fmtNum(adv.etcToday, lang, 1) })}</p>
            <p>{tt('water.why2')}</p>
            <p>{tt('water.dose')}</p>
            {bed.mulch && <p>{tt('water.whyMulch')}</p>}
            {bed.kind === 'greenhouse' && <p>{tt('water.whyGreenhouse')}</p>}
            {adv.history.some((d) => d.sensor) && <p>{tt('water.whySensor')}</p>}
          </Why>
        </section>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg">🌱 {tt('bed.plants')}</h3>
            <Button small kind="primary" onClick={() => nav.open({ type: 'addPlant', bedId: bed.id })}>
              + {tt('quick.plant')}
            </Button>
          </div>
          {plants.length === 0 ? (
            <Empty>{tt('garden.bedEmpty')}</Empty>
          ) : (
            <ul className="space-y-1.5">
              {plants.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => nav.open({ type: 'plant', id: p.id })} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm" style={{ background: 'var(--color-paper-200)' }}>
                    <span aria-hidden="true">{SPECIES_BY_ID[p.speciesId]?.emoji}</span>
                    <span className="min-w-0 flex-1 truncate">{plantTitle(p, lang)}</span>
                    <span className="text-[11px]" style={{ color: INK500 }}>
                      {tt(`status.${p.status}` as JKey)} · {fmtDate(p.sowDate, lang, true)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-display text-lg">🧺 {tt('bed.applications')}</h3>
          {apps.length === 0 ? (
            <Empty>{tt('bed.noApplication')}</Empty>
          ) : (
            <ul className="space-y-1 text-xs" style={{ color: INK700 }}>
              {apps.map((a) => {
                const pr = PRODUCT_BY_ID[a.productId];
                const target = a.plantId ? data.plants.find((p) => p.id === a.plantId) : undefined;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span>
                      {fmtDate(a.date, lang, true)} · {pr ? pr.name[lang] : a.productId} · {pr?.kind === 'liquid' ? `${fmtNum(a.amount, lang)} mL` : fmtG(a.amount, lang)}
                      {target ? ` → ${plantTitle(target, lang)}` : ''}
                    </span>
                    <button type="button" onClick={() => store.deleteApplication(a.id)} className="underline" style={{ color: INK500 }}>
                      {tt('common.delete')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--color-paper-300)' }}>
          <Button kind="ghost" onClick={() => nav.open({ type: 'observe', bedId: bed.id })}>
            📷 {tt('quick.observe')}
          </Button>
          <Button
            kind="danger"
            onClick={() => {
              if (window.confirm(tt('bed.deleteConfirm', { name: bed.name }))) {
                store.deleteBed(bed.id);
                onClose();
              }
            }}
          >
            {tt('bed.delete')}
          </Button>
        </div>
        {plants.some((p) => p.status === 'growing' && !isActiveOn(p, today)) && <Notice>{tt('bed.indoorNote')}</Notice>}
      </div>
    </Sheet>
  );
}
