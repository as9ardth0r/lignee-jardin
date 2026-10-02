import type { ReactElement } from 'react';
import { hashSeed, mulberry32, type Rng } from '../engine/core';
import type { FlowerAppearance, FlowerColor } from '../engine/muflier/engine';

export const COLOR_PAINT: Record<FlowerColor, { base: string; deep: string; light: string }> = {
  white: { base: '#f8f6f0', deep: '#cfcac0', light: '#ffffff' },
  ivory: { base: '#f4ebcf', deep: '#cdbf96', light: '#fcf8ea' },
  pale: { base: '#f3d6df', deep: '#cf9fb0', light: '#fbeef2' },
  pink: { base: '#ee8db4', deep: '#c25586', light: '#f8c4da' },
  magenta: { base: '#c2187a', deep: '#80104f', light: '#e46aa8' },
  yellow: { base: '#f5d33a', deep: '#c49a12', light: '#fbe98c' },
  orange: { base: '#f0842a', deep: '#b55314', light: '#f8b070' },
  red: { base: '#c8202e', deep: '#80121a', light: '#e66060' },
};
const FLECK = '#b8126e';
const VEIN = '#a8124c';
const PALATE = '#f5c21a';

type App = Pick<FlowerAppearance, 'color' | 'face' | 'veins' | 'flecked' | 'shape'>;

export function flowerColor(app: Pick<FlowerAppearance, 'color'>): string {
  return COLOR_PAINT[app.color].base;
}

/** Couleur de la face (lèvre inférieure) : claire si Eluta. */
function facePaint(app: App) {
  if (!app.face) return COLOR_PAINT[app.color];
  return app.color === 'red' || app.color === 'orange' ? COLOR_PAINT.yellow : COLOR_PAINT.ivory;
}

function palateColor(app: App): string {
  if (app.color === 'white') return '#f2f0e6';
  if (app.color === 'yellow' || app.color === 'orange' || app.color === 'red') return '#f8a810';
  return PALATE;
}

function Flecks({ rng, r, n }: { rng: Rng; r: number; n: number }) {
  const out: ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = rng() * r;
    const streak = rng() < 0.35;
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    out.push(
      streak ? (
        <path key={i} d={`M${x.toFixed(1)},${y.toFixed(1)} l${(Math.cos(a) * r * 0.35).toFixed(1)},${(Math.sin(a) * r * 0.35).toFixed(1)}`} stroke={FLECK} strokeWidth={0.9} strokeLinecap="round" />
      ) : (
        <circle key={i} cx={x} cy={y} r={0.5 + rng() * 0.8} fill={FLECK} />
      )
    );
  }
  return <>{out}</>;
}

/** Fleur vue de face (gros plan) : deux lèvres, ou étoile si pélorique. */
export function FlowerFace({ app, seed, r = 16 }: { app: App; seed: string; r?: number }) {
  const rng = mulberry32(hashSeed(`${seed}face`));
  const p = COLOR_PAINT[app.color];
  const f = facePaint(app);
  const k = r / 16;
  const lobes: ReactElement[] = [];
  const veins: ReactElement[] = [];
  if (app.shape === 'peloric' || app.shape === 'semi') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const big = app.shape === 'semi' && (i === 0 || i === 1 || i === 4) ? 1.12 : 1;
      const lr = 6.2 * k * big;
      const d = 8 * k * big;
      lobes.push(<circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={lr} fill={i === 0 || app.shape === 'peloric' ? p.base : f.base} stroke={p.deep} strokeWidth={0.6} />);
      if (app.veins) veins.push(<path key={`v${i}`} d={`M0,0 L${(Math.cos(a) * d * 1.5).toFixed(1)},${(Math.sin(a) * d * 1.5).toFixed(1)}`} stroke={VEIN} strokeWidth={0.7} />);
    }
  } else {
    // lèvre supérieure : deux lobes ; lèvre inférieure : trois lobes et le palais.
    for (const x of [-5.5, 5.5]) lobes.push(<circle key={`u${x}`} cx={x * k} cy={-6.5 * k} r={7 * k} fill={p.base} stroke={p.deep} strokeWidth={0.6} />);
    for (const [x, y] of [
      [-9, 5],
      [0, 8],
      [9, 5],
    ])
      lobes.push(<circle key={`l${x}`} cx={x * k} cy={y * k} r={6 * k} fill={f.base} stroke={p.deep} strokeWidth={0.6} />);
    if (app.veins)
      for (const a of [-2.4, -1.9, -1.2, -0.7, 0.7, 1.2, 1.57, 1.9, 2.4])
        veins.push(<path key={`v${a}`} d={`M0,0 L${(Math.cos(a) * 13 * k).toFixed(1)},${(Math.sin(a) * 13 * k).toFixed(1)}`} stroke={VEIN} strokeWidth={0.7} opacity={0.85} />);
  }
  return (
    <g>
      {lobes}
      {veins}
      {app.shape === 'normal' ? (
        <ellipse cx={0} cy={1.5 * k} rx={6.5 * k} ry={3.6 * k} fill={palateColor(app)} stroke="#d08a0a" strokeWidth={0.4} />
      ) : (
        <circle r={3.2 * k} fill={palateColor(app)} stroke={p.deep} strokeWidth={0.5} />
      )}
      {app.flecked && <Flecks rng={rng} r={13 * k} n={18} />}
    </g>
  );
}

/** Fleuron vu de profil sur l’épi. */
function Floret({ x, y, s, dir, app, rng }: { x: number; y: number; s: number; dir: 1 | -1; app: App; rng: Rng }) {
  const p = COLOR_PAINT[app.color];
  const f = facePaint(app);
  if (app.shape !== 'normal') {
    const lobes: ReactElement[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5;
      lobes.push(<circle key={i} cx={Math.cos(a) * 3.2} cy={Math.sin(a) * 3.2} r={3} fill={p.base} stroke={p.deep} strokeWidth={0.4} />);
    }
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path d={`M0,0 L${dir * 4},0`} stroke="#5f8a46" strokeWidth={1} />
        <g transform={`translate(${dir * 7} 0)`}>
          {lobes}
          <circle r={1.6} fill={palateColor(app)} />
          {app.flecked && <Flecks rng={rng} r={5} n={4} />}
        </g>
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      {/* lèvre inférieure (face) */}
      <path d="M0,1 C4,7 12,9 16,5 C17.5,3 16,1 13,1 Z" fill={f.base} stroke={p.deep} strokeWidth={0.5} />
      {/* lèvre supérieure (capuchon) */}
      <path d="M0,0 C3,-7 12,-9 16,-4 C17.5,-2 16,0 13,0.5 Z" fill={p.base} stroke={p.deep} strokeWidth={0.5} />
      <ellipse cx={13.5} cy={0.8} rx={2.6} ry={1.4} fill={palateColor(app)} />
      {app.veins && <path d="M3,-3 C7,-6 11,-6 14,-3 M3,3 C7,6 11,6 14,4" fill="none" stroke={VEIN} strokeWidth={0.5} />}
      {app.flecked && (
        <g transform="translate(9 0)">
          <Flecks rng={rng} r={6} n={5} />
        </g>
      )}
    </g>
  );
}

export function SnapdragonPortrait({
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
  const u = Math.max(0, Math.min(1, heightUnit));
  const ground = 112;
  const stemTop = ground - (40 + u * 56);
  const n = Math.max(3, Math.min(9, Math.round(florets / 5)));
  const spikeLen = (ground - stemTop) * 0.62;
  const sx = 46;
  const flowers: ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const y = stemTop + 6 + (1 - t) * spikeLen;
    const s = 0.62 + 0.3 * (1 - t);
    flowers.push(<Floret key={i} x={sx} y={y} s={s} dir={i % 2 ? 1 : -1} app={app} rng={rng} />);
  }
  const leaves: ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    const y = ground - 4 - i * 7;
    const dir = i % 2 ? 1 : -1;
    const l = 15 - i * 1.6;
    leaves.push(<path key={i} d={`M${sx},${y} q${dir * l * 0.5},${-5} ${dir * l},${-2} q${-dir * l * 0.5},${4} ${-dir * l},${2} Z`} fill="#5f9a46" stroke="#3f6e30" strokeWidth={0.5} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <ellipse cx={46} cy={114} rx={30} ry={3.5} fill="#000" opacity={0.1} />
      <path d={`M${sx},${ground} L${sx},${stemTop}`} stroke="#4f7a3c" strokeWidth={1.8} strokeLinecap="round" />
      {leaves}
      {flowers}
      <path d={`M${sx},${stemTop + 2} l-1.5,-4 M${sx},${stemTop + 2} l1.5,-4`} stroke="#6f9a4a" strokeWidth={1.4} strokeLinecap="round" />
      {/* gros plan de face */}
      <g transform="translate(94 78)">
        <circle r={22} fill="#fff" opacity={0.5} />
        <FlowerFace app={app} seed={seed} r={14} />
      </g>
      {app.species !== 'majus' && (
        <g transform="translate(96 12)">
          <rect x={-20} y={-7} width={40} height={14} rx={4} fill="#2e4a35" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#f3e6b8">
            {app.species === 'linaria' ? 'Linaria' : app.species.slice(0, 7)}
          </text>
        </g>
      )}
      {app.selfIncompatible && (
        <g transform="translate(14 12)">
          <rect x={-10} y={-7} width={20} height={14} rx={4} fill="#6b4a6e" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
            S
          </text>
        </g>
      )}
    </svg>
  );
}

/** Pastille : couleur de la fleur, face et palais. */
export function FlowerDot({ appearance, size = 14 }: { appearance: App; size?: number }) {
  const o = COLOR_PAINT[appearance.color].base;
  const c = appearance.face ? facePaint(appearance).base : palateColor(appearance);
  const inner = appearance.face ? '0 50%' : '0 26%';
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: appearance.flecked ? `radial-gradient(circle at 30% 30%, ${FLECK} 0 12%, transparent 14%), radial-gradient(circle at 70% 60%, ${FLECK} 0 10%, transparent 12%), radial-gradient(circle at 50% 75%, ${c} ${inner}, ${o} 30% 100%)` : `radial-gradient(circle at 50% 70%, ${c} ${inner}, ${o} 30% 100%)`,
        boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.12)',
      }}
    />
  );
}
