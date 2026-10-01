import type { ReactElement } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { CoreColor, FruitAppearance, RootShape } from '../engine/carotte/engine';

export const CORE_PAINT: Record<CoreColor, { base: string; deep: string; light: string }> = {
  white: { base: '#f1ead2', deep: '#c9bd98', light: '#fbf7ea' },
  yellow: { base: '#f0cc4a', deep: '#c49a1a', light: '#f8e48a' },
  orange: { base: '#f08a2a', deep: '#b85a14', light: '#f8b06a' },
  red: { base: '#d0402e', deep: '#8e2418', light: '#e8765e' },
};
const PURPLE = { base: '#5a2050', deep: '#2e0c2a', light: '#8a4a7e' };

/** Couleur de l’écorce (vue de l’extérieur). */
export function outerPaint(app: Pick<FruitAppearance, 'core' | 'purple'>) {
  return app.purple === 'none' ? CORE_PAINT[app.core] : PURPLE;
}

/** Couleur du cœur (vue en coupe). */
export function corePaint(app: Pick<FruitAppearance, 'core' | 'purple'>) {
  return app.purple === 'full' ? PURPLE : CORE_PAINT[app.core];
}

export function fruitColor(app: Pick<FruitAppearance, 'core' | 'purple'>): string {
  return outerPaint(app).base;
}

const SHAPE_GEOM: Record<RootShape, { len: number; wid: number; taper: number }> = {
  round: { len: 26, wid: 26, taper: 0.9 },
  short: { len: 44, wid: 20, taper: 0.55 },
  medium: { len: 62, wid: 15, taper: 0.25 },
  long: { len: 78, wid: 13, taper: 0.05 },
};

function rootPath(len: number, wid: number, taper: number, round: boolean): string {
  const pts: string[] = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = round ? (wid / 2) * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)) : (wid / 2) * (t < 0.08 ? 0.8 + t * 2.5 : 1 - (1 - taper) * Math.pow(t, 1.6) - (t > 0.85 ? (t - 0.85) * 4 * taper : 0));
    pts.push(`${(-Math.max(0.6, w)).toFixed(1)},${(t * len).toFixed(1)}`);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    const w = round ? (wid / 2) * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)) : (wid / 2) * (t < 0.08 ? 0.8 + t * 2.5 : 1 - (1 - taper) * Math.pow(t, 1.6) - (t > 0.85 ? (t - 0.85) * 4 * taper : 0));
    pts.push(`${Math.max(0.6, w).toFixed(1)},${(t * len).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

function Fern({ x, y, rot, len }: { x: number; y: number; rot: number; len: number }) {
  const segs: ReactElement[] = [];
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const sx = 0;
    const sy = -t * len;
    const w = (1 - t) * 7 + 2;
    segs.push(<path key={`a${i}`} d={`M${sx},${sy} l${-w},${-w * 0.6} M${sx},${sy} l${w},${-w * 0.6}`} stroke="#5f9a46" strokeWidth={1.4} strokeLinecap="round" />);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0,0 L0,${-len}`} stroke="#4f7a3c" strokeWidth={1.3} />
      {segs}
    </g>
  );
}

function Umbel({ x, y }: { x: number; y: number }) {
  const dots: ReactElement[] = [];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    dots.push(<circle key={i} cx={x + Math.cos(a) * 9} cy={y + Math.sin(a) * 4} r={2.2} fill="#fbf8f0" stroke="#c9c2b0" strokeWidth={0.4} />);
  }
  return (
    <g>
      {dots}
      <circle cx={x} cy={y - 3} r={2.4} fill="#fbf8f0" stroke="#c9c2b0" strokeWidth={0.4} />
      <circle cx={x} cy={y - 2} r={1.3} fill="#5a2050" />
    </g>
  );
}

export function CarrotPortrait({
  seed,
  appearance: app,
  shape,
  weightUnit,
  size = 120,
}: {
  seed: string;
  appearance: FruitAppearance;
  shape: RootShape;
  /** Poids sur l’échelle 0–1 (épaisseur relative). */
  weightUnit: number;
  size?: number;
}) {
  const rng = mulberry32(hashSeed(seed));
  const u = Math.max(0, Math.min(1, weightUnit));
  const g = SHAPE_GEOM[shape];
  const wid = g.wid * (0.75 + u * 0.5);
  const len = g.len;
  const outer = outerPaint(app);
  const core = corePaint(app);
  const top = 32;
  const rings: ReactElement[] = [];
  for (let i = 1; i < 5; i++) {
    const t = 0.15 + i * 0.17;
    rings.push(<path key={i} d={`M${-wid * 0.42},${t * len} q${wid * 0.42},${2 + rng()} ${wid * 0.84},0`} fill="none" stroke={outer.deep} strokeWidth={0.6} opacity={0.5} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <ellipse cx={60} cy={114} rx={40} ry={3.5} fill="#000" opacity={0.1} />
      {/* feuillage */}
      <Fern x={46} y={top + 2} rot={-28} len={26} />
      <Fern x={48} y={top + 2} rot={-6} len={30} />
      <Fern x={50} y={top + 2} rot={16} len={26} />
      {app.annual && (
        <g>
          <path d={`M 52 ${top} L 64 6`} stroke="#4f7a3c" strokeWidth={1.4} />
          <Umbel x={64} y={8} />
        </g>
      )}
      {/* racine */}
      <g transform={`translate(48 ${top})`}>
        <path d={rootPath(len, wid, g.taper, shape === 'round')} fill={outer.base} stroke={outer.deep} strokeWidth={0.9} strokeLinejoin="round" />
        <path d={`M${-wid * 0.25},${len * 0.05} L${-wid * 0.18},${len * 0.75}`} stroke={outer.light} strokeWidth={wid * 0.12} strokeLinecap="round" opacity={0.45} />
        {rings}
        {shape !== 'round' && <path d={`M0,${len} l1,8`} stroke={outer.deep} strokeWidth={0.8} />}
      </g>
      {/* coupe transversale : écorce (phloème) et cœur (xylème) */}
      <g transform="translate(94 74)">
        <circle r={14} fill={outer.base} stroke={outer.deep} strokeWidth={1} />
        <circle r={11.5} fill={app.purple === 'outer' ? PURPLE.light : core.base} />
        <circle r={6.5} fill={app.purple === 'full' ? PURPLE.light : core.light} stroke={core.deep} strokeWidth={0.6} />
        <circle r={1.4} fill={core.deep} opacity={0.6} />
      </g>
      {app.maleSterile && (
        <g transform="translate(104 12)">
          <rect x={-12} y={-7} width={24} height={14} rx={4} fill="#6b4a6e" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
            {app.cyto}
          </text>
        </g>
      )}
      {app.species !== 'sativus' && (
        <g transform="translate(18 12)">
          <rect x={-14} y={-7} width={28} height={14} rx={4} fill="#2e4a35" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#f3e6b8">
            {app.species === 'carota' ? 'sauv.' : app.species.slice(0, 5)}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Pastille : écorce et cœur. */
export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'core' | 'purple'>; size?: number }) {
  const o = outerPaint(appearance).base;
  const c = corePaint(appearance).base;
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: `radial-gradient(circle, ${c} 0 42%, ${o} 46% 100%)`, boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.12)' }}
    />
  );
}
