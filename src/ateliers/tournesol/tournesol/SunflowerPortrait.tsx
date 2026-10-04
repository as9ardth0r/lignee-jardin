import type { ReactElement } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FlowerAppearance, FlowerColor } from '../engine/tournesol/engine';

export const COLOR_PAINT: Record<FlowerColor, { base: string; deep: string; light: string }> = {
  cream: { base: '#f6efcf', deep: '#cdbf86', light: '#fffbea' },
  lemon: { base: '#f6e45a', deep: '#c4ae1e', light: '#fbf2a6' },
  yellow: { base: '#f5b81c', deep: '#b8800a', light: '#fbd970' },
  orange: { base: '#ef8a1e', deep: '#a8560a', light: '#f8b768' },
  bronze: { base: '#c2601e', deep: '#7a3210', light: '#f0b040' },
  red: { base: '#a8242a', deep: '#5e1014', light: '#d0504a' },
  mahogany: { base: '#6e1a1a', deep: '#3a0a0a', light: '#94302a' },
};

type App = Pick<FlowerAppearance, 'color' | 'face' | 'veins' | 'flecked' | 'shape'>;

export function flowerColor(app: Pick<FlowerAppearance, 'color'>): string {
  return COLOR_PAINT[app.color].base;
}

const DISK_DARK = { base: '#4a2c16', deep: '#2a170a', light: '#6a4424' };
const DISK_LIGHT = { base: '#a8b84a', deep: '#6a7a24', light: '#d0d878' };

/** Couleur du bout des ligules : un tournesol bronze (Rd/rd) a des ligules rouges à la base, jaunes au bout. */
function tipPaint(app: App) {
  return app.color === 'bronze' ? COLOR_PAINT.yellow : COLOR_PAINT[app.color];
}

/** Capitule vu de face : ligules, cœur, pollen ; double = pompon de ligules. */
export function FlowerFace({ app, seed, r = 16 }: { app: App; seed: string; r?: number }) {
  const rng = mulberry32(hashSeed(`${seed}face`));
  const p = COLOR_PAINT[app.color];
  const tip = tipPaint(app);
  const disk = app.face ? DISK_DARK : DISK_LIGHT;
  const diskR = app.shape === 'peloric' ? r * 0.18 : app.shape === 'semi' ? r * 0.32 : r * 0.42;
  const n = 21;
  const rays: ReactElement[] = [];
  const ring = (k: number, len: number, wid: number, rot: number, key: string) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + rot + rng() * 4;
      rays.push(
        <g key={`${key}${i}`} transform={`rotate(${a})`}>
          <path d={`M0,${-k} C${wid},${-k - len * 0.3} ${wid * 0.8},${-k - len * 0.85} 0,${-k - len} C${-wid * 0.8},${-k - len * 0.85} ${-wid},${-k - len * 0.3} 0,${-k} Z`} fill={app.color === 'bronze' ? `url(#bz-${seed.length % 7})` : p.base} stroke={p.deep} strokeWidth={0.35} />
        </g>
      );
    }
  };
  ring(diskR * 0.9, r - diskR * 0.9, r * 0.13, 0, 'a');
  if (app.shape !== 'normal') ring(diskR * 0.7, (r - diskR) * 0.75, r * 0.11, 360 / n / 2, 'b');
  if (app.shape === 'peloric') {
    ring(diskR * 0.3, (r - diskR) * 0.55, r * 0.1, 360 / n / 4, 'c');
    ring(0, (r - diskR) * 0.35, r * 0.08, (3 * 360) / n / 4, 'd');
  }
  // Graines en spirale (angle d’or) sur le cœur.
  const dots: ReactElement[] = [];
  if (app.shape !== 'peloric') {
    const N = 70;
    for (let i = 1; i < N; i++) {
      const rr = diskR * 0.92 * Math.sqrt(i / N);
      const a = i * 2.39996;
      dots.push(<circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={diskR * 0.055} fill={disk.deep} opacity={0.7} />);
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={`bz-${seed.length % 7}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={COLOR_PAINT.red.base} />
          <stop offset="55%" stopColor={COLOR_PAINT.bronze.base} />
          <stop offset="100%" stopColor={tip.base} />
        </linearGradient>
      </defs>
      {rays}
      {app.shape !== 'peloric' && <circle r={diskR} fill={disk.base} stroke={disk.deep} strokeWidth={0.5} />}
      {dots}
      {/* anneau de fleurons en train de libérer leur pollen */}
      {app.shape !== 'peloric' && !app.veins && <circle r={diskR * 0.8} fill="none" stroke="#f2cf3a" strokeWidth={diskR * 0.12} strokeDasharray={`${diskR * 0.08} ${diskR * 0.08}`} opacity={0.9} />}
    </g>
  );
}

function Leaf({ x, y, s, dir }: { x: number; y: number; s: number; dir: 1 | -1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      <path d="M0,0 C6,-8 18,-10 22,-2 C24,4 14,8 0,0 Z" fill="#6f9a4a" stroke="#3f6e30" strokeWidth={0.5} />
      <path d="M0,0 L20,-2" stroke="#3f6e30" strokeWidth={0.4} />
    </g>
  );
}

export function SunflowerPortrait({
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
  /** Diamètre du capitule (cm). */
  florets: number;
  size?: number;
}) {
  const rng = mulberry32(hashSeed(seed));
  const u = Math.max(0, Math.min(1, heightUnit));
  const ground = 114;
  const top = ground - (40 + u * 58);
  const sx = 40;
  const headR = Math.max(5, Math.min(15, 4 + florets * 0.3));
  const items: ReactElement[] = [];
  const stem = `M${sx},${ground} C${sx + 2},${ground - 30} ${sx - 2},${top + 30} ${sx + 3},${top + headR * 0.6}`;
  const nLeaves = Math.max(2, Math.round((ground - top) / 16));
  for (let i = 0; i < nLeaves; i++) {
    const t = (i + 0.6) / (nLeaves + 0.6);
    const yy = ground - t * (ground - top - headR);
    items.push(<Leaf key={`l${i}`} x={sx} y={yy} s={1 - t * 0.4} dir={i % 2 ? 1 : -1} />);
  }
  // Têtes : une seule (tige unique) ou plusieurs petites sur des rameaux (ramifié).
  const heads: Array<[number, number, number]> = [[sx + 3, top + headR * 0.4, headR]];
  if (app.flecked) {
    const nb = 3 + Math.floor(rng() * 2);
    for (let i = 0; i < nb; i++) {
      const t = 0.3 + i * 0.16;
      const yy = ground - (1 - t) * (ground - top);
      const dir = i % 2 ? 1 : -1;
      const hx = sx + dir * (12 + rng() * 6);
      items.push(<path key={`br${i}`} d={`M${sx},${yy + 10} Q${sx + dir * 6},${yy + 2} ${hx},${yy - 4}`} fill="none" stroke="#4f7a3c" strokeWidth={1.1} />);
      heads.push([hx, yy - 4, headR * 0.7]);
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <ellipse cx={42} cy={115} rx={28} ry={3.5} fill="#000" opacity={0.1} />
      <path d={stem} fill="none" stroke="#4f7a3c" strokeWidth={2.2} strokeLinecap="round" />
      {items}
      {heads.map(([x, y, r], i) => (
        <g key={`h${i}`} transform={`translate(${x} ${y})`}>
          <FlowerFace app={app} seed={`${seed}${i}`} r={r} />
        </g>
      ))}
      {/* gros plan du capitule */}
      <g transform="translate(94 78)">
        <circle r={23} fill="#fff" opacity={0.5} />
        <FlowerFace app={app} seed={seed} r={20} />
      </g>
    </svg>
  );
}

/** Pastille : ligules et cœur. */
export function FlowerDot({ appearance, size = 14 }: { appearance: App; size?: number }) {
  const o = COLOR_PAINT[appearance.color].base;
  const d = appearance.shape === 'peloric' ? o : appearance.face ? DISK_DARK.base : DISK_LIGHT.base;
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${d} 0 38%, ${o} 40% 100%)`,
        boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.12)',
      }}
    />
  );
}
