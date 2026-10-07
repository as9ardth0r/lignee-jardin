import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { TEXTURES } from './data/climate';
import { PRODUCT_BY_ID } from './data/products';
import { SPECIES_BY_ID } from './data/species';
import { uid, type Bed, type BedKind, type Obstacle, type ObstacleKind, type Texture, type MulchMaterial } from './model';
import { bedSun, clockHourOf, compassPoint, dayOfYear, DEFAULT_LAT, DEFAULT_LON, isGable, shadowPolygon, solarHourAt, sunDir, sunMismatch, sunPosition } from './engine/sun';
import { isActiveOn, speciesOf } from './engine/crop';
import { MULCH_INFO, MULCH_MATERIALS, bedMulchSummary, bedSurfaceCN, litersToDepth, mulchContentM2 } from './engine/mulch';
import { cnAdvice } from './engine/compost';
import { bedCropsOfYear, bedGroupOfYear, bedRotationIssues, rotationGroup, ROTATION_COLOR, ROTATION_GROUPS, type RotationGroup } from './engine/rotation';
import { bedArea, waterAdvice, WATER_THRESHOLD, type WaterAdvice, type WaterDay } from './engine/water';
import type { TT } from './i18n';
import { fmtDate, fmtG, fmtL, fmtNum, plantTitle } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Chip, Empty, Field, INK500, INK700, Meter, Notice, Select, Sheet, TextInput, Why } from './ui';
import { BedSensors, SensorsCard } from './Sensors';
import { LocateButtons } from './Locate';
import { CompostCard } from './Compost';
import { RainTankCard } from './RainTank';
import { BedLayout } from './BedLayout';
import { layoutBed, neighbours } from './engine/layout';
import { BedSoil, SoilCard } from './Soil';
import { BedMushrooms } from './Mushrooms';
import { mushroomsOnBed } from './engine/mushroom';

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
  wall: { fill: '#9a9280', stroke: '#4a4434' },
  tree: { fill: '#2f5a26', stroke: '#1d3a17' },
  hedge: { fill: '#2f5f2a', stroke: '#1d3a17' },
};

/** Jours proposés pour l'aperçu des ombres. */
export const SUN_DAYS: Array<{ doy: number; key: 'march' | 'june' | 'sept' | 'dec' }> = [
  { doy: 80, key: 'march' },
  { doy: 172, key: 'june' },
  { doy: 266, key: 'sept' },
  { doy: 355, key: 'dec' },
];

/** Taille maximale du terrain (m). */
export const PLAN_MAX = 200;

/** Agrandit le terrain si une planche ou un obstacle en dépasse (avec 0,5 m de marge). */
function fitPlan(store: { data: { settings: { planW: number; planH: number } }; updateSettings: (p: { planW?: number; planH?: number }) => void }, it: { x: number; y: number; w: number; h: number }) {
  const { planW, planH } = store.data.settings;
  // Seulement si l'élément dépasse vraiment (un élément posé contre le bord ne change rien).
  const needW = it.x + it.w > planW + 1e-6 ? Math.min(PLAN_MAX, Math.ceil(it.x + it.w + 0.5)) : planW;
  const needH = it.y + it.h > planH + 1e-6 ? Math.min(PLAN_MAX, Math.ceil(it.y + it.h + 0.5)) : planH;
  if (needW > planW || needH > planH) store.updateSettings({ planW: Math.max(planW, needW), planH: Math.max(planH, needH) });
}

/** Taille du terrain, réglable directement au-dessus du plan. */
function PlanSize() {
  const { data, updateSettings } = useGarden();
  const { tt } = useJT();
  const { planW, planH } = data.settings;
  const items = [...data.beds, ...data.obstacles];
  const minW = Math.max(2, ...items.map((b) => Math.ceil(b.x + b.w)));
  const minH = Math.max(2, ...items.map((b) => Math.ceil(b.y + b.h)));
  // Une planche qui dépasse du terrain (anciennes données, import) l'agrandit.
  useEffect(() => {
    if (minW > planW || minH > planH) updateSettings({ planW: Math.min(PLAN_MAX, Math.max(planW, minW)), planH: Math.min(PLAN_MAX, Math.max(planH, minH)) });
  }, [minW, minH, planW, planH, updateSettings]);
  const clamp = (v: string, min: number) => Math.max(min, Math.min(PLAN_MAX, Math.round(Number(v) || min)));
  return (
    <div className="mb-3 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
      <p className="text-sm font-medium">📐 {tt('garden.size')}</p>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 text-sm">
        <TextInput type="number" value={planW} onChange={(v) => updateSettings({ planW: clamp(v, minW) })} />
        <span>×</span>
        <TextInput type="number" value={planH} onChange={(v) => updateSettings({ planH: clamp(v, minH) })} />
        <span>m</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('garden.sizeHint')}
      </p>
    </div>
  );
}

type DragTarget = { kind: 'bed' | 'obs'; id: string; dx: number; dy: number; moved: boolean };
/** Vue du plan : facteur de zoom et centre (m). z = 1 : tout le terrain. */
type View = { z: number; cx: number; cy: number };
type Gesture = { kind: 'pinch'; d0: number; z0: number; wx: number; wy: number } | { kind: 'pan'; sx: number; sy: number; cx0: number; cy0: number; moved: boolean };

/** Longueurs proposées pour la barre d'échelle (m). */
const SCALE_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
/** Dernière vue du plan (gardée quand on change d'onglet). */
let savedPlanView: View | null = null;
/** Largeur visible minimale (m) : zoom maximal. */
const MIN_VIEW_M = 1.2;

/** Plan du jardin : planches et obstacles déplaçables au doigt (pas de 10 cm), ombres portées, zoom. */
function GardenPlan({ sun, rotationYear }: { sun: { doy: number; hour: number } | null; rotationYear: number | null }) {
  const { data, saveBed, saveObstacle, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragTarget | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null);
  const [boxW, setBoxW] = useState(340);
  const { planW, planH, planNorth } = data.settings;
  const lat = data.settings.lat ?? DEFAULT_LAT;

  // Repère complet (terrain + marge de 20 cm) et vue zoomée dans ce repère.
  const W0 = planW + 0.4;
  const H0 = planH + 0.4;
  const zMax = Math.max(1, W0 / MIN_VIEW_M);
  const clampView = (v: View): View => {
    const z = Math.max(1, Math.min(zMax, v.z));
    const w = W0 / z;
    const h = H0 / z;
    return { z, cx: Math.max(-0.2 + w / 2, Math.min(-0.2 + W0 - w / 2, v.cx)), cy: Math.max(-0.2 + h / 2, Math.min(-0.2 + H0 - h / 2, v.cy)) };
  };
  /** Cadre (zoom, centre) qui montre des éléments du plan avec 40 cm de marge. */
  const frameOf = (items: Array<{ x: number; y: number; w: number; h: number }>): View => {
    if (items.length === 0) return { z: 1, cx: planW / 2, cy: planH / 2 };
    const x0 = Math.min(...items.map((b) => b.x)) - 0.4;
    const y0 = Math.min(...items.map((b) => b.y)) - 0.4;
    const x1 = Math.max(...items.map((b) => b.x + b.w)) + 0.4;
    const y1 = Math.max(...items.map((b) => b.y + b.h)) + 0.4;
    return clampView({ z: Math.min(W0 / (x1 - x0), H0 / (y1 - y0)), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
  };
  // Au premier affichage : cadré sur ce qui est dessiné (planches et obstacles) ; ensuite, la dernière vue est gardée.
  const [rawView, setRawView] = useState<View>(() => savedPlanView ?? frameOf([...data.beds, ...data.obstacles]));
  const setView = (v: View) => {
    savedPlanView = v;
    setRawView(v);
  };
  const view = clampView(rawView);
  const vw = W0 / view.z;
  const vh = H0 / view.z;
  const vx = view.cx - vw / 2;
  const vy = view.cy - vh / 2;
  /** Mètres par pixel affiché, et pixels par mètre. */
  const mpp = vw / Math.max(1, boxW);
  const ppm = 1 / mpp;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth || 340));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Zoom autour d'un point du plan (wx, wy) qui reste sous le même point de l'écran (fx, fy en fraction de la vue). */
  const zoomAt = (z: number, wx: number, wy: number, fx: number, fy: number) => {
    const nz = Math.max(1, Math.min(zMax, z));
    const w = W0 / nz;
    const h = H0 / nz;
    setView(clampView({ z: nz, cx: wx - fx * w + w / 2, cy: wy - fy * h + h / 2 }));
  };
  const frac = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { fx: (clientX - r.left) / r.width, fy: (clientY - r.top) / r.height };
  };

  // Ctrl + molette (et pincement du pavé tactile) : zoom autour du curseur.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  });
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const v = viewRef.current;
      const { fx, fy } = frac(e.clientX, e.clientY);
      const w = W0 / v.z;
      const h = H0 / v.z;
      zoomAt(v.z * Math.exp(-e.deltaY * 0.01), v.cx - w / 2 + fx * w, v.cy - h / 2 + fy * h, fx, fy);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const toPlan = (e: { clientX: number; clientY: number }) => {
    const { fx, fy } = frac(e.clientX, e.clientY);
    return { x: vx + fx * vw, y: vy + fy * vh };
  };
  const itemOf = (d: DragTarget) => (d.kind === 'bed' ? data.beds.find((x) => x.id === d.id) : data.obstacles.find((x) => x.id === d.id));

  const onDown = (e: RPointerEvent, kind: 'bed' | 'obs', item: { id: string; x: number; y: number }) => {
    const p = toPlan(e);
    drag.current = { kind, id: item.id, dx: p.x - item.x, dy: p.y - item.y, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  // Tous les doigts passent ici (après le gestionnaire de la planche touchée).
  const onSvgDown = (e: RPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      // Deuxième doigt : on abandonne le déplacement de planche et on pince.
      drag.current = null;
      setLive(null);
      const [a, b] = pts;
      const mid = toPlan({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      gesture.current = { kind: 'pinch', d0: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), z0: view.z, wx: mid.x, wy: mid.y };
      return;
    }
    if (!drag.current) {
      // Un doigt sur l'herbe : on fait glisser la vue (si zoomée).
      svgRef.current?.setPointerCapture?.(e.pointerId);
      gesture.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, cx0: view.cx, cy0: view.cy, moved: false };
    }
  };
  const onMove = (e: RPointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (g?.kind === 'pinch') {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const [a, b] = pts;
      const { fx, fy } = frac((a.x + b.x) / 2, (a.y + b.y) / 2);
      zoomAt(g.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / g.d0), g.wx, g.wy, fx, fy);
      return;
    }
    if (g?.kind === 'pan') {
      const r = svgRef.current!.getBoundingClientRect();
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) g.moved = true;
      if (view.z > 1) setView(clampView({ z: view.z, cx: g.cx0 - (dx / r.width) * vw, cy: g.cy0 - (dy / r.height) * vh }));
      return;
    }
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
  const onUp = (e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (g) {
      if (g.kind === 'pinch' && pointers.current.size > 0) {
        // Il reste un doigt : il continue en déplaçant la vue.
        const [p] = [...pointers.current.values()];
        gesture.current = { kind: 'pan', sx: p.x, sy: p.y, cx0: viewRef.current.cx, cy0: viewRef.current.cy, moved: true };
      } else if (pointers.current.size === 0) gesture.current = null;
      return;
    }
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
  const onCancel = (e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
    drag.current = null;
    setLive(null);
  };
  const pos = (it: { id: string; x: number; y: number }) => (live?.id === it.id ? { x: live.x, y: live.y } : { x: it.x, y: it.y });

  // Boutons de zoom.
  const zoomBy = (k: number) => zoomAt(view.z * k, view.cx, view.cy, 0.5, 0.5);
  const fitBeds = () => setView(frameOf(data.beds.length > 0 ? data.beds : data.obstacles));

  // Quadrillage (traits d'épaisseur fixe à l'écran) : 1 m, plus marqué tous les 5 m ; de près, 50 puis 10 cm.
  const grid = [];
  const sub = ppm >= 260 ? 0.1 : ppm >= 70 ? 0.5 : null;
  if (sub) {
    const n0 = Math.max(0, Math.floor(vx / sub));
    const n1 = Math.min(Math.round(planW / sub), Math.ceil((vx + vw) / sub));
    for (let i = n0; i <= n1; i++) if (Math.abs(i * sub - Math.round(i * sub)) > 1e-6) grid.push(<line key={`sx${i}`} x1={i * sub} y1={Math.max(0, vy)} x2={i * sub} y2={Math.min(planH, vy + vh)} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1} vectorEffect="non-scaling-stroke" />);
    const m0 = Math.max(0, Math.floor(vy / sub));
    const m1 = Math.min(Math.round(planH / sub), Math.ceil((vy + vh) / sub));
    for (let i = m0; i <= m1; i++) if (Math.abs(i * sub - Math.round(i * sub)) > 1e-6) grid.push(<line key={`sy${i}`} x1={Math.max(0, vx)} y1={i * sub} x2={Math.min(planW, vx + vw)} y2={i * sub} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1} vectorEffect="non-scaling-stroke" />);
  }
  for (let x = 0; x <= planW; x++) grid.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={planH} stroke="#ffffff" strokeOpacity={x % 5 === 0 ? 0.32 : ppm < 24 ? 0.09 : 0.18} strokeWidth={x % 5 === 0 ? 1.5 : 1} vectorEffect="non-scaling-stroke" />);
  for (let y = 0; y <= planH; y++) grid.push(<line key={`y${y}`} x1={0} y1={y} x2={planW} y2={y} stroke="#ffffff" strokeOpacity={y % 5 === 0 ? 0.32 : ppm < 24 ? 0.09 : 0.18} strokeWidth={y % 5 === 0 ? 1.5 : 1} vectorEffect="non-scaling-stroke" />);

  const sunPos = sun ? sunPosition(lat, sun.doy, sun.hour) : null;
  // Emplacements des cultures (placées à la main, ou proposées par l'app quand on zoome), et mauvais voisins à signaler.
  const layouts = useMemo(() => new Map(data.beds.map((b) => [b.id, layoutBed(data, b)])), [data]);
  const badPlants = useMemo(() => new Set(neighbours(data).filter((n) => n.effect === 'bad').flatMap((n) => [n.a.id, n.b.id])), [data]);
  const obstaclesLive = data.obstacles.map((o) => ({ ...o, ...pos(o) }));
  // Rose des vents et échelle : taille fixe à l'écran, dans les coins de la vue.
  const nr = (planNorth * Math.PI) / 180;
  const cr = 15 * mpp;
  const cx = vx + vw - cr - 8 * mpp;
  const cy = vy + cr + 8 * mpp;
  const scaleM = SCALE_STEPS.find((s) => s * ppm >= 32) ?? SCALE_STEPS[SCALE_STEPS.length - 1];
  const px = (n: number) => n * mpp;

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-end gap-1.5">
        {/* Barre d'échelle : longueur réelle à l'écran. */}
        <div className="mr-auto flex items-end gap-1.5 text-xs font-medium" style={{ color: INK700 }} aria-label={tt('garden.scale')}>
          <span className="block h-2 border-x-2 border-b-2" style={{ width: scaleM * ppm, borderColor: '#24331f' }} />
          <span className="font-data leading-none">{scaleM < 1 ? `${Math.round(scaleM * 100)} cm` : `${scaleM} m`}</span>
        </div>
        {(
          [
            ['−', tt('garden.zoomOut'), () => zoomBy(1 / 1.6), view.z <= 1, ''],
            ['+', tt('garden.zoomIn'), () => zoomBy(1.6), view.z >= zMax - 1e-6, ''],
            ['▣', tt('garden.zoomBeds'), fitBeds, false, tt('garden.zoomBedsShort')],
            ['⤢', tt('garden.zoomAll'), () => setView({ z: 1, cx: planW / 2, cy: planH / 2 }), view.z <= 1, tt('garden.zoomAllShort')],
          ] as Array<[string, string, () => void, boolean, string]>
        ).map(([sym, label, act, off, wide]) => (
          <button key={label} type="button" onClick={act} disabled={off} title={label} aria-label={label} className={`flex h-9 items-center justify-center gap-1 rounded-full text-sm font-medium disabled:opacity-40 ${wide ? 'w-9 text-base sm:w-auto sm:px-3 sm:text-sm' : 'w-9 text-lg'}`} style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)', color: '#24331f' }}>
            <span aria-hidden="true">{sym}</span>
            {wide && <span className="hidden sm:inline">{wide}</span>}
          </button>
        ))}
      </div>
      <div ref={boxRef} className="relative">
        <svg
          ref={svgRef}
          viewBox={`${vx} ${vy} ${vw} ${vh}`}
          className="w-full touch-none select-none rounded"
          style={{ background: '#1c2e20', aspectRatio: `${W0} / ${H0}`, cursor: view.z > 1 ? 'move' : undefined }}
          role="img"
          aria-label={tt('garden.planLabel', { w: planW, h: planH })}
          onPointerDown={onSvgDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
          onDoubleClick={(e) => {
            if ((e.target as Element).getAttribute('data-bg') !== '1') return;
            const p = toPlan(e);
            const { fx, fy } = frac(e.clientX, e.clientY);
            zoomAt(view.z * 2, p.x, p.y, fx, fy);
          }}
        >
          <defs>
            <clipPath id="plan-clip">
              <rect x={0} y={0} width={planW} height={planH} />
            </clipPath>
            {/* Herbe : brins clairs et sombres sur un vert prairie. */}
            <pattern id="plan-grass" patternUnits="userSpaceOnUse" width={0.6} height={0.6}>
              <rect width={0.6} height={0.6} fill="#5f8f3c" />
              <path d="M0.05 0.18 l0.02 -0.08 M0.21 0.47 l-0.02 -0.08 M0.38 0.12 l0.015 -0.07 M0.5 0.36 l-0.02 -0.07 M0.12 0.56 l0.02 -0.06 M0.31 0.3 l0.01 -0.07" stroke="#7aa94e" strokeWidth={0.018} strokeLinecap="round" />
              <path d="M0.15 0.28 l-0.015 -0.07 M0.44 0.55 l0.02 -0.07 M0.55 0.1 l-0.015 -0.06 M0.26 0.08 l0.02 -0.06 M0.03 0.42 l0.015 -0.07" stroke="#4d7a30" strokeWidth={0.018} strokeLinecap="round" />
            </pattern>
            {/* Terre : grumeaux plus sombres et plus clairs. */}
            <pattern id="plan-soil" patternUnits="userSpaceOnUse" width={0.3} height={0.3}>
              <rect width={0.3} height={0.3} fill="#7a5634" />
              <circle cx={0.05} cy={0.07} r={0.018} fill="#5e4026" />
              <circle cx={0.2} cy={0.15} r={0.014} fill="#916a44" />
              <circle cx={0.12} cy={0.24} r={0.02} fill="#5e4026" />
              <circle cx={0.26} cy={0.04} r={0.012} fill="#916a44" />
              <circle cx={0.27} cy={0.26} r={0.015} fill="#664629" />
            </pattern>
          </defs>
          <rect data-bg="1" x={0} y={0} width={planW} height={planH} fill={ppm >= 45 ? 'url(#plan-grass)' : '#5f8f3c'} />
          <g style={{ pointerEvents: 'none' }}>{grid}</g>
          {data.beds.map((b) => {
            const { x, y } = pos(b);
            const base = BED_FILL[b.kind];
            const group = rotationYear !== null ? bedGroupOfYear(b.id, data.plants, rotationYear) : null;
            const issue = rotationYear !== null && bedRotationIssues(b.id, data.plants, rotationYear).length > 0;
            const c = rotationYear === null ? (b.kind === 'bed' ? { fill: ppm >= 45 ? 'url(#plan-soil)' : '#7a5634', stroke: '#c49a62' } : base) : group ? { fill: ROTATION_COLOR[group], stroke: '#2a2a22' } : { fill: '#5a5448', stroke: '#3a362e' };
            const emojis = [...new Set([...data.plants.filter((p) => p.bedId === b.id && isActiveOn(p, today)).map((p) => SPECIES_BY_ID[p.speciesId]?.emoji), ...(mushroomsOnBed(data, b.id).length ? ['🍄'] : [])])].slice(0, 4).join('');
            const laid = layouts.get(b.id) ?? [];
            // De près (planche d'au moins 110 px), les cultures s'affichent dans la planche, avec leur nom.
            const close = rotationYear === null && b.kind !== 'hydro' && Math.min(b.w, b.h) * ppm >= 60 && b.w * ppm >= 110;
            // Nom lisible même sur un grand terrain ; écrit dans le sens de la longueur pour une planche étroite.
            const vertical = b.h > b.w * 2.5;
            const along = vertical ? b.h : b.w;
            const across = vertical ? b.w : b.h;
            const fs = Math.min(px(17), Math.max(0.22, Math.min(0.42 * Math.max(1, Math.max(planW, planH) / 30), across * (emojis ? 0.4 : 0.7), (along * 0.9) / (0.6 * Math.max(4, b.name.length)))));
            const tcx = x + b.w / 2;
            const tcy = y + b.h / 2;
            const frame = b.kind === 'bed' && rotationYear === null;
            return (
              <g key={b.id} onPointerDown={(e) => onDown(e, 'bed', b)} style={{ cursor: 'grab' }}>
                {frame && <rect x={x + px(1.5)} y={y + px(2)} width={b.w} height={b.h} rx={0.06} fill="#000" fillOpacity={0.25} />}
                <rect x={x} y={y} width={b.w} height={b.h} rx={b.kind === 'pot' ? Math.min(b.w, b.h) / 2 : 0.06} fill={c.fill} fillOpacity={b.kind === 'greenhouse' && rotationYear === null ? 0.45 : 1} stroke={issue ? '#ff3b2f' : c.stroke} strokeWidth={issue ? 3 : frame ? Math.max(2, Math.min(0.06 * ppm, 6)) : 1.5} vectorEffect="non-scaling-stroke" strokeDasharray={issue ? '6 3' : undefined} />
                {b.mulch && <rect x={x + 0.06} y={y + 0.06} width={Math.max(0, b.w - 0.12)} height={Math.max(0, b.h - 0.12)} rx={0.05} fill="none" stroke="#e8d79a" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />}
                {rotationYear === null &&
                  laid
                    .filter((l) => close || !l.auto)
                    .map((l) => {
                      const sp = speciesOf(l.plant);
                      const bad = badPlants.has(l.plant.id);
                      const name = SPECIES_BY_ID[l.plant.speciesId]?.name[lang] ?? '';
                      const fc = Math.min(px(13), l.pos.h * 0.35);
                      const fitName = (name.length + 3) * fc * 0.6 <= l.pos.w - px(6);
                      return (
                        <g key={l.plant.id} style={{ pointerEvents: 'none' }}>
                          <rect
                            x={x + l.pos.x + px(2)}
                            y={y + l.pos.y + px(2)}
                            width={Math.max(0.02, l.pos.w - px(4))}
                            height={Math.max(0.02, l.pos.h - px(4))}
                            rx={px(4)}
                            fill={close ? ROTATION_COLOR[rotationGroup(sp)] : '#faf7ee'}
                            fillOpacity={close ? (l.plant.status === 'planned' ? 0.35 : 0.7) : l.plant.status === 'planned' ? 0.08 : 0.16}
                            stroke={bad ? '#ff3b2f' : 'rgba(250,247,238,.7)'}
                            strokeWidth={bad ? 2.5 : 1}
                            strokeDasharray={l.auto ? '4 3' : undefined}
                            vectorEffect="non-scaling-stroke"
                          />
                          {close && (
                            <text x={x + l.pos.x + l.pos.w / 2} y={y + l.pos.y + l.pos.h / 2 + fc * 0.35} textAnchor="middle" fontSize={fitName ? fc : Math.min(fc * 1.3, l.pos.w * 0.7)} fill="#faf7ee" style={{ fontWeight: 600, paintOrder: 'stroke', stroke: 'rgba(0,0,0,.45)', strokeWidth: fc * 0.12 }}>
                              {fitName ? `${sp.emoji} ${name}` : sp.emoji}
                            </text>
                          )}
                        </g>
                      );
                    })}
                {close ? (
                  // Nom de la planche en étiquette, au-dessus de la planche.
                  <text x={x} y={y - px(5)} fontSize={px(12)} fill="#faf7ee" style={{ fontWeight: 700, paintOrder: 'stroke', stroke: 'rgba(0,0,0,.55)', strokeWidth: px(2.5) }}>
                    {issue ? '⚠ ' : ''}
                    {b.name} · {fmtNum(b.w, lang, 2)} × {fmtNum(b.h, lang, 2)} m
                  </text>
                ) : (
                  <g transform={vertical ? `rotate(-90 ${tcx} ${tcy})` : undefined}>
                    <text x={tcx} y={tcy - (emojis ? fs * 0.25 : -fs * 0.35)} textAnchor="middle" fontSize={fs} fill="#faf7ee" style={{ pointerEvents: 'none', fontWeight: 600, paintOrder: 'stroke', stroke: 'rgba(0,0,0,.45)', strokeWidth: fs * 0.1 }}>
                      {issue ? '⚠ ' : ''}
                      {b.name}
                    </text>
                    {emojis && (
                      <text x={tcx} y={tcy + fs * 0.95} textAnchor="middle" fontSize={fs * 0.9} style={{ pointerEvents: 'none' }}>
                        {emojis}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
          {sunPos && sunPos.alt > 0 && (
            <g clipPath="url(#plan-clip)" style={{ pointerEvents: 'none' }}>
              {obstaclesLive.map((o) => (
                <polygon key={o.id} points={shadowPolygon(o, sunPos, planNorth).map(([x, y]) => `${x},${y}`).join(' ')} fill="#0b1a08" fillOpacity={0.42} />
              ))}
            </g>
          )}
          {data.obstacles.map((o) => {
            const { x, y } = pos(o);
            const c = OBSTACLE_FILL[o.kind];
            // Nom puis hauteur sur deux lignes, taille ajustée à la largeur de l'obstacle.
            const fs = Math.min(px(15), Math.max(0.16, Math.min(0.4, Math.min(o.w, o.h) * 0.3, (o.w * 0.9) / (0.58 * Math.max(4, o.name.length)))));
            return (
              <g key={o.id} onPointerDown={(e) => onDown(e, 'obs', o)} style={{ cursor: 'grab' }}>
                {o.kind === 'tree' ? (
                  <>
                    <ellipse cx={x + o.w / 2 + px(2)} cy={y + o.h / 2 + px(3)} rx={o.w / 2} ry={o.h / 2} fill="#000" fillOpacity={0.25} />
                    <ellipse cx={x + o.w / 2} cy={y + o.h / 2} rx={o.w / 2} ry={o.h / 2} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                    <ellipse cx={x + o.w * 0.4} cy={y + o.h * 0.38} rx={o.w * 0.22} ry={o.h * 0.18} fill="#5a8a46" fillOpacity={0.6} />
                  </>
                ) : (
                  <>
                    <rect x={x} y={y} width={o.w} height={o.h} rx={o.kind === 'hedge' ? 0.2 : 0.03} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                    {isGable(o) &&
                      ((o.ridge === 'short' ? o.w < o.h : o.w >= o.h) ? (
                        <>
                          <rect x={x} y={y} width={o.w} height={o.h / 2} fill="#fff" fillOpacity={0.06} style={{ pointerEvents: 'none' }} />
                          <line x1={x} y1={y + o.h / 2} x2={x + o.w} y2={y + o.h / 2} stroke="#2a251c" strokeOpacity={0.6} strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
                        </>
                      ) : (
                        <>
                          <rect x={x} y={y} width={o.w / 2} height={o.h} fill="#fff" fillOpacity={0.06} style={{ pointerEvents: 'none' }} />
                          <line x1={x + o.w / 2} y1={y} x2={x + o.w / 2} y2={y + o.h} stroke="#2a251c" strokeOpacity={0.6} strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
                        </>
                      ))}
                  </>
                )}
                <text x={x + o.w / 2} y={y + o.h / 2 - fs * 0.2} textAnchor="middle" fontSize={fs} fill="#faf7ee" style={{ pointerEvents: 'none', paintOrder: 'stroke', stroke: 'rgba(0,0,0,.4)', strokeWidth: fs * 0.08 }}>
                  {o.name}
                  <tspan x={x + o.w / 2} dy={fs * 1.15} fontSize={fs * 0.85} opacity={0.9}>
                    ↑ {isGable(o) ? `${fmtNum(o.eaveHeight ?? o.height, lang, 1)}–${fmtNum(o.height, lang, 1)}` : fmtNum(o.height, lang, 1)} m
                  </tspan>
                </text>
              </g>
            );
          })}
          {sunPos && sunPos.alt <= 0 && <rect x={0} y={0} width={planW} height={planH} fill="#000" fillOpacity={0.45} style={{ pointerEvents: 'none' }} />}
          {sunPos &&
            sunPos.alt > 0 &&
            (() => {
              // Soleil dessiné au bord du plan, du côté d’où viennent les rayons.
              const [dx, dy] = sunDir(sunPos.az, planNorth);
              const r = Math.max(0.22, Math.min(0.9, Math.min(planW, planH) * 0.045));
              const hx = planW / 2 - r * 1.6;
              const hy = planH / 2 - r * 1.6;
              const t = Math.min(Math.abs(dx) > 1e-6 ? hx / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? hy / Math.abs(dy) : Infinity);
              const sx = planW / 2 + dx * t;
              const sy = planH / 2 + dy * t;
              return (
                <g style={{ pointerEvents: 'none' }} aria-hidden="true">
                  {Array.from({ length: 8 }, (_, i) => {
                    const a = (i * Math.PI) / 4;
                    return <line key={i} x1={sx + Math.cos(a) * r * 1.25} y1={sy + Math.sin(a) * r * 1.25} x2={sx + Math.cos(a) * r * 1.7} y2={sy + Math.sin(a) * r * 1.7} stroke="#f5c84a" strokeWidth={r * 0.22} strokeLinecap="round" />;
                  })}
                  <circle cx={sx} cy={sy} r={r} fill="#f5c84a" stroke="#c8901a" strokeWidth={r * 0.12} />
                </g>
              );
            })()}
          {/* Rose des vents (coin haut droit de la vue). */}
          <g style={{ pointerEvents: 'none' }}>
            <circle cx={cx} cy={cy} r={cr} fill="#0f1a12" fillOpacity={0.7} stroke="#d9ae52" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
            <path d={`M ${cx + Math.sin(nr) * cr * 0.8} ${cy - Math.cos(nr) * cr * 0.8} L ${cx - Math.cos(nr) * cr * 0.27} ${cy - Math.sin(nr) * cr * 0.27} L ${cx + Math.cos(nr) * cr * 0.27} ${cy + Math.sin(nr) * cr * 0.27} Z`} fill="#d9ae52" />
            <text x={cx - Math.sin(nr) * cr * 0.52} y={cy + Math.cos(nr) * cr * 0.52 + cr * 0.2} textAnchor="middle" fontSize={cr * 0.58} fill="#faf7ee" fontWeight={700}>
              {tt('garden.north')}
            </text>
          </g>
        </svg>
      </div>
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
  const thisYear = Number(today.slice(0, 4));
  const [rotYear, setRotYear] = useState<number | null>(null);
  const lon = data.settings.lon ?? DEFAULT_LON;
  const lat = data.settings.lat ?? DEFAULT_LAT;
  // Par défaut, les ombres suivent l’heure du téléphone (mise à jour chaque minute).
  const [sunMode, setSunMode] = useState<'now' | 'manual'>('now');
  const [now, setNow] = useState(() => new Date());
  const [doy, setDoy] = useState(() => dayOfYear(new Date()));
  const [hour, setHour] = useState(() => Math.round(solarHourAt(new Date(), data.settings.lon ?? DEFAULT_LON) * 4) / 4);
  useEffect(() => {
    if (!showSun || sunMode !== 'now') return;
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, [showSun, sunMode]);
  const sunAt = sunMode === 'now' ? { doy: dayOfYear(now), hour: solarHourAt(now, lon) } : { doy, hour };
  const sunAtPos = sunPosition(lat, sunAt.doy, sunAt.hour);
  const hhmm = (h: number) => {
    const m = Math.round(h * 60) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };
  const clock = sunMode === 'now' ? now.getHours() + now.getMinutes() / 60 : clockHourOf(hour, doy, lon, now.getFullYear());
  const compass = (az: number) => {
    const p = compassPoint(az);
    return lang === 'fr' ? p.replace(/W/g, 'O') : p;
  };
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
        <PlanSize />
        <GardenPlan sun={showSun ? sunAt : null} rotationYear={rotYear} />
        <RotationPanel year={rotYear} thisYear={thisYear} onYear={setRotYear} />
        <div className="mt-3 rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={showSun} onChange={(e) => setShowSun(e.target.checked)} /> ☀ {tt('garden.shadows')}
          </label>
          {showSun && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <Chip active={sunMode === 'now'} onClick={() => setSunMode('now')}>
                  🕑 {tt('garden.now')}
                </Chip>
                {SUN_DAYS.map((d) => (
                  <Chip
                    key={d.key}
                    active={sunMode === 'manual' && doy === d.doy}
                    onClick={() => {
                      if (sunMode === 'now') setHour(Math.round(sunAt.hour * 4) / 4);
                      setDoy(d.doy);
                      setSunMode('manual');
                    }}
                  >
                    {tt(`sunday.${d.key}` as JKey)}
                  </Chip>
                ))}
              </div>
              <label className="flex items-center gap-3 text-xs" style={{ color: INK700 }}>
                <span className="shrink-0 whitespace-nowrap font-data">{tt('garden.clock', { t: hhmm(clock) })}</span>
                <input
                  type="range"
                  min={4}
                  max={22}
                  step={0.25}
                  value={Math.max(4, Math.min(22, sunAt.hour))}
                  onChange={(e) => {
                    if (sunMode === 'now') setDoy(sunAt.doy);
                    setHour(Number(e.target.value));
                    setSunMode('manual');
                  }}
                  className="resin-range"
                  style={{ ['--range-progress' as string]: `${((Math.max(4, Math.min(22, sunAt.hour)) - 4) / 18) * 100}%` }}
                  aria-label={tt('garden.hourLabel')}
                />
              </label>
              <p className="text-xs font-medium" style={{ color: INK700 }}>
                {sunAtPos.alt > 0
                  ? tt('garden.sunNow', { alt: Math.round(sunAtPos.alt), dir: compass(sunAtPos.az), solar: hhmm(sunAt.hour) })
                  : tt('garden.night', { solar: hhmm(sunAt.hour) })}
              </p>
              <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
                {tt(sunMode === 'now' ? 'garden.shadowsNowHint' : 'garden.shadowsHint', { lat: fmtNum(lat, lang, 1), lon: fmtNum(lon, lang, 1) })}
                {data.settings.lon === undefined ? ` ${tt('garden.shadowsNoLon')}` : ''}
              </p>
              <LocateButtons compact />
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
                      <span className="truncate">{active.length || mushroomsOnBed(data, b.id).length ? [...active.map((p) => SPECIES_BY_ID[p.speciesId]?.emoji), ...(mushroomsOnBed(data, b.id).length ? ['🍄'] : [])].join(' ') : tt('garden.bedEmpty')}</span>
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
      <CompostCard />
      <RainTankCard />
      <SensorsCard />
    </div>
  );
}

// --- Rotation -------------------------------------------------------------------------

function RotationPanel({ year, thisYear, onYear }: { year: number | null; thisYear: number; onYear: (y: number | null) => void }) {
  const { data } = useGarden();
  const { tt, lang } = useJT();
  const years = [thisYear - 3, thisYear - 2, thisYear - 1, thisYear, thisYear + 1];
  const present = new Set<RotationGroup>();
  if (year !== null) for (const b of data.beds) for (const p of bedCropsOfYear(b.id, data.plants, year)) present.add(rotationGroup(speciesOf(p)));
  const issues = year !== null ? data.beds.flatMap((b) => bedRotationIssues(b.id, data.plants, year).map((i) => ({ bed: b, ...i }))) : [];
  return (
    <div className="mt-3 rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={year !== null} onChange={(e) => onYear(e.target.checked ? thisYear : null)} /> 🔄 {tt('rot.title')}
      </label>
      {year !== null && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {years.map((y) => (
              <Chip key={y} active={year === y} onClick={() => onYear(y)}>
                {y}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: INK700 }}>
            {ROTATION_GROUPS.filter((g) => present.has(g)).map((g) => (
              <span key={g} className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: ROTATION_COLOR[g] }} />
                {tt(`rot.group.${g}` as JKey)}
              </span>
            ))}
            {present.size === 0 && <span>{tt('rot.empty')}</span>}
          </div>
          {issues.map((i) => (
            <Notice key={i.plant.id} tone="warn">
              {tt('rot.issue', { bed: i.bed.name, crop: speciesOf(i.plant).name[lang], prev: speciesOf(i.warning.previous).name[lang], years: i.warning.years, wanted: i.warning.wanted })}
            </Notice>
          ))}
          <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
            {tt('rot.hint')}
          </p>
        </div>
      )}
    </div>
  );
}

/** Paillage et broyat de la planche : couches posées, azote libéré. */
function BedMulch({ bed }: { bed: Bed }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  // Petit carré ou bac : on y verse surtout des restes de cuisine, comptés en litres.
  const small = bed.w * bed.h <= 4;
  const [material, setMaterial] = useState<MulchMaterial>(small ? 'kitchen' : 'meadow');
  const [unit, setUnit] = useState<'cm' | 'L'>(small ? 'L' : 'cm');
  const [amount, setAmount] = useState(small ? 5 : 10);
  const depth = unit === 'cm' ? amount : litersToDepth(amount, bed);
  const sum = bedMulchSummary(bed, data, today);
  const surf = bedSurfaceCN(bed, data, today);
  const all = (data.mulches ?? []).filter((m) => m.bedId === bed.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const info = MULCH_INFO[material];
  const preview = mulchContentM2({ material, depthCm: depth });
  const area = bedArea(bed);
  return (
    <section>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg">🍂 {tt('mulch.title')}</h3>
        <Button small kind={open ? 'ghost' : 'primary'} onClick={() => setOpen((v) => !v)}>
          {open ? tt('common.cancel') : `+ ${tt('mulch.add')}`}
        </Button>
      </div>
      {sum.active.length > 0 ? (
        <p className="text-sm">
          {tt('mulch.summary', { n: fmtNum(sum.yearN, lang, 1), nBed: fmtNum(sum.yearN * area, lang, 0), k: fmtNum(sum.yearK, lang, 1), sofar: fmtNum(sum.soFarN, lang, 1) })}
        </p>
      ) : (
        <p className="text-sm" style={{ color: INK500 }}>
          {tt('mulch.none')}
        </p>
      )}
      {surf && surf.layers >= 2 && (
        <p className="mt-1 text-xs" style={{ color: cnAdvice(surf.cn) === 'good' ? '#4a7f36' : '#a5532f' }}>
          {tt('mulch.cn', { cn: fmtNum(surf.cn, lang, 0) })} {tt(`mulch.cn.${cnAdvice(surf.cn)}` as JKey)}
        </p>
      )}
      {sum.lockup && (
        <div className="mt-2">
          <Notice tone="warn">{tt('mulch.lockup')}</Notice>
        </div>
      )}
      {open && (
        <div className="mt-2 space-y-2 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
          <div className="grid grid-cols-2 gap-2">
            <Field label={tt('mulch.date')}>{(fid) => <TextInput id={fid} type="date" value={date} onChange={setDate} />}</Field>
            <Field label={unit === 'cm' ? tt('mulch.depth') : tt('mulch.liters')}>
              {(fid) => (
                <div className="flex gap-1.5">
                  <TextInput id={fid} type="number" value={amount} onChange={(v) => setAmount(Math.max(0.1, Math.min(unit === 'cm' ? 40 : 2000, Number(v) || 0.1)))} />
                  <Select value={unit} onChange={(v) => setUnit(v as 'cm' | 'L')} options={[{ v: 'cm', l: 'cm' }, { v: 'L', l: 'L' }]} />
                </div>
              )}
            </Field>
          </div>
          <Field label={tt('mulch.material')}>
            {(fid) => <Select id={fid} value={material} onChange={(v) => setMaterial(v as MulchMaterial)} options={MULCH_MATERIALS.map((m) => ({ v: m, l: `${MULCH_INFO[m].emoji} ${MULCH_INFO[m].name[lang]}` }))} />}
          </Field>
          <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
            {tt('mulch.preview', { kg: fmtNum(depth * 10 * info.density, lang, 1), n: fmtNum(preview.N, lang, 0), avail: Math.round(info.nAvail * 100), cn: info.cn, lo: info.depth[0], hi: info.depth[1] })}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
            💡 {info.tip[lang]}
          </p>
          <Button
            kind="primary"
            onClick={() => {
              store.addMulch({ bedId: bed.id, date, material, depthCm: depth });
              if (!bed.mulch) store.saveBed({ ...bed, mulch: true });
              setOpen(false);
            }}
          >
            {tt('mulch.save')}
          </Button>
        </div>
      )}
      {all.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {all.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 rounded px-2 py-1" style={{ background: 'var(--color-paper-200)' }}>
              <span>
                {fmtDate(m.date, lang, true)} · {MULCH_INFO[m.material].emoji} {MULCH_INFO[m.material].name[lang]} · {m.depthCm >= 1 ? `${fmtNum(m.depthCm, lang, 0)} cm` : `${fmtNum(m.depthCm * area * 10, lang, 0)} L`}
              </span>
              <button type="button" onClick={() => store.deleteMulch(m.id)} className="text-xs underline" style={{ color: INK500 }}>
                {tt('common.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('mulch.hint')}
      </p>
    </section>
  );
}

/** Historique de la planche sur 4 ans, par groupe de rotation. */
function BedHistory({ bedId }: { bedId: string }) {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const y0 = Number(today.slice(0, 4));
  const years = [y0 + 1, y0, y0 - 1, y0 - 2, y0 - 3];
  const rows = years.map((y) => ({ y, plants: bedCropsOfYear(bedId, data.plants, y) })).filter((r) => r.plants.length || r.y === y0);
  const issues = bedRotationIssues(bedId, data.plants, y0).concat(bedRotationIssues(bedId, data.plants, y0 + 1));
  return (
    <section>
      <h3 className="mb-1 font-display text-lg">🔄 {tt('rot.history')}</h3>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.y} className="flex items-start gap-2">
            <span className="w-12 shrink-0 font-medium">{r.y}</span>
            <span className="flex flex-wrap gap-1">
              {r.plants.length === 0 ? (
                <span style={{ color: INK500 }}>{tt('rot.none')}</span>
              ) : (
                [...new Set(r.plants.map((p) => p.speciesId))].map((id) => {
                  const p = r.plants.find((x) => x.speciesId === id)!;
                  const sp = speciesOf(p);
                  return (
                    <span key={id} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs" style={{ background: 'var(--color-paper-300)' }}>
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: ROTATION_COLOR[rotationGroup(sp)] }} />
                      {sp.emoji} {sp.name[lang]}
                    </span>
                  );
                })
              )}
            </span>
          </li>
        ))}
      </ul>
      {issues.map((i) => (
        <div key={i.plant.id} className="mt-2">
          <Notice tone="warn">{tt('rot.issueBed', { crop: speciesOf(i.plant).name[lang], prev: speciesOf(i.warning.previous).name[lang], years: i.warning.years, wanted: i.warning.wanted })}</Notice>
        </div>
      ))}
      <p className="mt-1 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('rot.order')}
      </p>
    </section>
  );
}

// --- Obstacle -------------------------------------------------------------------------

export function ObstacleSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const store = useGarden();
  const { tt } = useJT();
  const o = store.data.obstacles.find((x) => x.id === id);
  if (!o) return null;
  const set = (patch: Partial<Obstacle>) => {
    const next = { ...o, ...patch };
    store.saveObstacle(next);
    fitPlan(store, next);
  };
  const num = (v: string, min: number, max: number) => Math.max(min, Math.min(max, Number(v.replace(',', '.')) || min));
  const gable = o.kind === 'building' && o.roof === 'gable';
  return (
    <Sheet title={o.name || tt('obstacle.title')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('bed.name')}>{(fid) => <TextInput id={fid} value={o.name} onChange={(v) => set({ name: v })} />}</Field>
          <Field label={tt('obstacle.kind')}>
            {(fid) => <Select id={fid} value={o.kind} onChange={(v) => set({ kind: v })} options={(['building', 'wall', 'tree', 'hedge'] as ObstacleKind[]).map((k) => ({ v: k, l: tt(`obstacleKind.${k}` as JKey) }))} />}
          </Field>
          <Field label={tt('bed.w')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={o.w} onChange={(v) => set({ w: num(v, 0.1, PLAN_MAX) })} />}</Field>
          <Field label={tt('bed.h')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={o.h} onChange={(v) => set({ h: num(v, 0.1, PLAN_MAX) })} />}</Field>
          {o.kind === 'building' && (
            <Field label={tt('obstacle.roof')}>
              {(fid) => (
                <Select
                  id={fid}
                  value={o.roof ?? 'flat'}
                  onChange={(v) => set(v === 'gable' ? { roof: 'gable', eaveHeight: o.eaveHeight ?? Math.round(Math.min(o.height - 0.5, Math.max(2.5, o.height * 0.45)) * 10) / 10 } : { roof: 'flat' })}
                  options={(['flat', 'gable'] as const).map((k) => ({ v: k, l: tt(`obstacle.roof.${k}` as JKey) }))}
                />
              )}
            </Field>
          )}
          <Field label={gable ? tt('obstacle.heightRidge') : tt('obstacle.height')} hint={gable ? undefined : tt('obstacle.heightHint')}>
            {(fid) => <TextInput id={fid} type="number" step={0.5} value={o.height} onChange={(v) => set({ height: num(v, 0.2, 40) })} />}
          </Field>
          {gable && (
            <>
              <Field label={tt('obstacle.eave')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={o.eaveHeight ?? o.height} onChange={(v) => set({ eaveHeight: num(v, 0, o.height) })} />}</Field>
              <Field label={tt('obstacle.ridge')}>
                {(fid) => <Select id={fid} value={o.ridge ?? 'long'} onChange={(v) => set({ ridge: v })} options={(['long', 'short'] as const).map((k) => ({ v: k, l: tt(`obstacle.ridge.${k}` as JKey) }))} />}
              </Field>
            </>
          )}
        </div>
        {gable && (
          <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
            {tt('obstacle.roofHint')}
          </p>
        )}
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
  const set = (patch: Partial<Bed>) => {
    const next = { ...bed, ...patch };
    store.saveBed(next);
    fitPlan(store, next);
  };
  const plants = data.plants.filter((p) => p.bedId === bed.id).sort((a, b) => b.sowDate.localeCompare(a.sowDate));
  const apps = data.applications.filter((a) => a.bedId === bed.id).sort((a, b) => b.date.localeCompare(a.date));
  const waters = data.water.filter((w) => w.bedId === bed.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const num = (v: string) => Math.max(0.2, Math.min(PLAN_MAX, Number(v.replace(',', '.')) || 0.2));
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
            <div className="flex items-end">
              <Button small kind="ghost" onClick={() => set({ w: bed.h, h: bed.w })}>
                ↻ {tt('bed.rotate')}
              </Button>
            </div>
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

        {bed.kind !== 'hydro' && <BedLayout bed={bed} />}
        {bed.kind !== 'hydro' && <BedHistory bedId={bed.id} />}
        {bed.kind !== 'hydro' && bed.kind !== 'pot' && <BedMulch bed={bed} />}

        <BedMushrooms bedId={bed.id} exposure={sun?.exposure} />

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
