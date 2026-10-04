import type { ReactElement } from 'react';
import { hashSeed, mulberry32, type Rng } from '../engine/core';
import type { FlowerAppearance, FlowerColor } from '../engine/pdsenteur/engine';

export const COLOR_PAINT: Record<FlowerColor, { base: string; deep: string; light: string }> = {
  white: { base: '#f8f6f0', deep: '#cfcac0', light: '#ffffff' },
  cream: { base: '#f4e7b8', deep: '#cdb878', light: '#fbf4dc' },
  blush: { base: '#f6d3d8', deep: '#d39aa4', light: '#fcecee' },
  pink: { base: '#ec8fae', deep: '#bf5880', light: '#f8c6d6' },
  red: { base: '#c8203a', deep: '#80121f', light: '#e66070' },
  orange: { base: '#ef7a3a', deep: '#b04a1a', light: '#f7ad80' },
  lavender: { base: '#b8a6e6', deep: '#7c66b8', light: '#dcd2f6' },
  purple: { base: '#6a3aa8', deep: '#3e1c70', light: '#9a72cc' },
  maroon: { base: '#6a1430', deep: '#3a0a1a', light: '#9a3a58' },
};

type App = Pick<FlowerAppearance, 'color' | 'face' | 'veins' | 'flecked' | 'shape'>;

export function flowerColor(app: Pick<FlowerAppearance, 'color'>): string {
  return COLOR_PAINT[app.color].base;
}

/** Couleur des ailes : plus claires si bicolore (Cupani : ailes violettes ; Painted Lady : ailes blanches). */
function wingPaint(app: App) {
  if (!app.face) return COLOR_PAINT[app.color];
  if (app.color === 'maroon') return COLOR_PAINT.purple;
  if (app.color === 'red' || app.color === 'pink') return COLOR_PAINT.blush;
  if (app.color === 'purple') return COLOR_PAINT.lavender;
  return COLOR_PAINT.white;
}

/** Contour d’un étendard : rond (grandiflora), ondulé (Spencer) ou replié en capuchon. */
function standardPath(r: number, shape: App['shape'], rng: Rng): string {
  const pts: string[] = [];
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI + (i / N) * Math.PI;
    let rr = r;
    if (shape === 'semi') rr = r * (1 + 0.08 * Math.sin(i * 1.6 + rng() * 0.6));
    if (shape === 'peloric') rr = r * (0.75 + 0.1 * Math.cos(a * 2));
    const sx = shape === 'peloric' ? 0.65 : 1;
    pts.push(`${(Math.cos(a) * rr * sx).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join('L')}Q0,${(r * 0.25).toFixed(1)} ${pts[0]}Z`;
}

/** Fleur vue de face : étendard, deux ailes, carène. */
export function FlowerFace({ app, seed, r = 16 }: { app: App; seed: string; r?: number }) {
  const rng = mulberry32(hashSeed(`${seed}face`));
  const p = COLOR_PAINT[app.color];
  const w = wingPaint(app);
  const k = r / 16;
  return (
    <g>
      <path d={standardPath(16 * k, app.shape, rng)} fill={p.base} stroke={p.deep} strokeWidth={0.6} transform={`translate(0 ${2 * k})`} />
      {app.shape !== 'peloric' && <path d={`M0,${-10 * k} L0,${2 * k}`} stroke={p.deep} strokeWidth={0.4} opacity={0.5} />}
      <ellipse cx={-6 * k} cy={6 * k} rx={6.5 * k} ry={7.5 * k} transform={`rotate(20 ${-6 * k} ${6 * k})`} fill={w.base} stroke={w.deep} strokeWidth={0.6} />
      <ellipse cx={6 * k} cy={6 * k} rx={6.5 * k} ry={7.5 * k} transform={`rotate(-20 ${6 * k} ${6 * k})`} fill={w.base} stroke={w.deep} strokeWidth={0.6} />
      <path d={`M${-2.5 * k},${6 * k} Q0,${15 * k} ${2.5 * k},${6 * k} Z`} fill={w.light} stroke={w.deep} strokeWidth={0.5} />
    </g>
  );
}

/** Fleur de profil le long de la tige. */
function Floret({ x, y, s, dir, app, rng }: { x: number; y: number; s: number; dir: 1 | -1; app: App; rng: Rng }) {
  const p = COLOR_PAINT[app.color];
  const w = wingPaint(app);
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      <path d="M0,0 L4,-1" stroke="#6f9a4a" strokeWidth={0.8} />
      <g transform="translate(9 -2)">
        <path d={standardPath(6, app.shape, rng)} transform="rotate(70)" fill={p.base} stroke={p.deep} strokeWidth={0.5} />
        <ellipse cx={2} cy={2} rx={3.4} ry={2.4} fill={w.base} stroke={w.deep} strokeWidth={0.4} />
      </g>
    </g>
  );
}

function Tendril({ x, y, dir }: { x: number; y: number; dir: 1 | -1 }) {
  return <path d={`M${x},${y} q${dir * 5},-3 ${dir * 6},-7 q1,-3 -2,-3 q-2,1 0,3`} fill="none" stroke="#7aa64e" strokeWidth={0.7} />;
}

export function SweetPeaPortrait({
  seed,
  appearance: app,
  heightUnit,
  florets,
  size = 120,
}: {
  seed: string;
  appearance: FlowerAppearance;
  /** Hauteur sur l’échelle 0–1. */
  heightUnit: number;
  florets: number;
  size?: number;
}) {
  const rng = mulberry32(hashSeed(seed));
  const dwarf = app.flecked;
  const u = Math.max(0, Math.min(1, heightUnit));
  const ground = 112;
  const top = dwarf ? ground - 30 : ground - (50 + u * 46);
  const sx = 40;
  const n = Math.max(2, Math.min(6, florets));
  const items: ReactElement[] = [];
  // Tige principale en zigzag (plante grimpante) ou rampante (naine).
  const stem: string[] = [];
  const segs = dwarf ? 4 : 7;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const yy = ground - t * (ground - top);
    const xx = sx + (dwarf ? t * 26 : (i % 2 ? 3 : -3));
    stem.push(`${xx.toFixed(1)},${yy.toFixed(1)}`);
    if (i > 0 && i < segs) {
      items.push(<path key={`lf${i}`} d={`M${xx},${yy} q${i % 2 ? 9 : -9},-2 ${i % 2 ? 12 : -12},3 q${i % 2 ? -6 : 6},2 ${i % 2 ? -12 : 12},-3 Z`} fill="#6f9a4a" stroke="#3f6e30" strokeWidth={0.4} />);
      if (!dwarf) items.push(<Tendril key={`td${i}`} x={xx} y={yy - 2} dir={i % 2 ? -1 : 1} />);
    }
  }
  // Tige florale avec ses fleurs.
  const fx = dwarf ? sx + 22 : sx + 2;
  const fy = dwarf ? top + 4 : top + 4;
  const peduncle = dwarf ? 12 : 22;
  items.push(<path key="ped" d={`M${fx},${fy + peduncle} L${fx + 4},${fy}`} stroke="#5f8a46" strokeWidth={1} />);
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    items.push(<Floret key={`f${i}`} x={fx + 4 - t * 2} y={fy + t * peduncle * 0.6} s={0.95 - t * 0.15} dir={i % 2 ? 1 : -1} app={app} rng={rng} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <ellipse cx={46} cy={114} rx={30} ry={3.5} fill="#000" opacity={0.1} />
      {!dwarf && <path d={`M${sx - 8},${ground} L${sx - 8},${top - 6}`} stroke="#a88a5a" strokeWidth={1.2} strokeDasharray="1 2" />}
      <path d={`M${stem.join(' L')}`} fill="none" stroke="#4f7a3c" strokeWidth={1.6} strokeLinecap="round" />
      {items}
      {/* gros plan de face */}
      <g transform="translate(94 74)">
        <circle r={22} fill="#fff" opacity={0.5} />
        <FlowerFace app={app} seed={seed} r={14} />
      </g>
      {/* forme du pollen (gène L) */}
      <g transform="translate(108 104)">
        <circle r={7} fill="#fffdf2" stroke="#d8cfa8" strokeWidth={0.6} />
        {app.veins ? <ellipse rx={4.5} ry={2} fill="#e8c23a" stroke="#a88a20" strokeWidth={0.4} /> : <circle r={2.8} fill="#e8c23a" stroke="#a88a20" strokeWidth={0.4} />}
      </g>
    </svg>
  );
}

/** Pastille : étendard et ailes. */
export function FlowerDot({ appearance, size = 14 }: { appearance: App; size?: number }) {
  const o = COLOR_PAINT[appearance.color].base;
  const w = wingPaint(appearance).base;
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${o} 0 55%, ${w} 55% 100%)`,
        boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.12)',
      }}
    />
  );
}
