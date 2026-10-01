import type { ReactElement } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { Cotyledon, FlowerColor, FruitAppearance, SeedCoat, SeedShape } from '../engine/pois/engine';

export const COTYLEDON_PAINT: Record<Cotyledon, { base: string; deep: string }> = {
  yellow: { base: '#e9c84a', deep: '#b8962a' },
  green: { base: '#8fb04a', deep: '#5e7d2a' },
};
const COAT_GREY = { base: '#9a8466', deep: '#6a5640' };
const FLOWER_PAINT: Record<FlowerColor, { standard: string; wing: string }> = {
  white: { standard: '#fbf8f0', wing: '#f1ece0' },
  purple: { standard: '#d98fb4', wing: '#7a2a6e' },
  tawny: { standard: '#e8955a', wing: '#b85a2a' },
};
const POD = { green: { base: '#7fae4a', deep: '#4f7a2a' }, yellow: { base: '#e9cf4a', deep: '#b39a2a' } };

/** Couleur d’une graine vue de l’extérieur : le tégument gris cache les cotylédons. */
export function seedPaint(cotyledon: Cotyledon, coat: SeedCoat) {
  return coat === 'grey' ? COAT_GREY : COTYLEDON_PAINT[cotyledon];
}

/** Couleur « vue de loin » (pastilles) : la graine. */
export function fruitColor(app: Pick<FruitAppearance, 'cotyledon' | 'coat'>): string {
  return seedPaint(app.cotyledon, app.coat).base;
}

/** Une graine : ronde et lisse, ou ridée (contour bosselé et plis). */
export function Seed({ x, y, r, shape, cotyledon, coat, rot = 0 }: { x: number; y: number; r: number; shape: SeedShape; cotyledon: Cotyledon; coat: SeedCoat; rot?: number }) {
  const c = seedPaint(cotyledon, coat);
  if (shape === 'round') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={r} fill={c.base} stroke={c.deep} strokeWidth={r * 0.12} />
        <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.28} fill="#fff" opacity={0.35} />
        <ellipse cx={r * 0.55} cy={0} rx={r * 0.12} ry={r * 0.28} fill={c.deep} opacity={0.6} />
      </g>
    );
  }
  const pts: string[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const k = 0.88 + 0.1 * Math.sin(a * 6 + rot);
    pts.push(`${(Math.cos(a) * r * k).toFixed(2)},${(Math.sin(a) * r * k * 0.92).toFixed(2)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot * 40})`}>
      <path d={`M${pts.join('L')}Z`} fill={c.base} stroke={c.deep} strokeWidth={r * 0.12} strokeLinejoin="round" />
      <path d={`M${-r * 0.5},${-r * 0.2} q${r * 0.3},${r * 0.35} ${r * 0.7},${r * 0.1} M${-r * 0.3},${r * 0.35} q${r * 0.35},${-r * 0.25} ${r * 0.75},${r * 0.05}`} fill="none" stroke={c.deep} strokeWidth={r * 0.1} opacity={0.7} />
    </g>
  );
}

function Flower({ x, y, color, s = 1 }: { x: number; y: number; color: FlowerColor; s?: number }) {
  const p = FLOWER_PAINT[color];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={-2} rx={4.6} ry={4} fill={p.standard} stroke="#b9ae9a" strokeWidth={0.4} />
      <ellipse cx={-1.8} cy={1.5} rx={2.2} ry={2.6} fill={p.wing} stroke="#9a8a7a" strokeWidth={0.3} />
      <ellipse cx={1.8} cy={1.5} rx={2.2} ry={2.6} fill={p.wing} stroke="#9a8a7a" strokeWidth={0.3} />
    </g>
  );
}

function Pod({ x, y, app, rot, len = 22 }: { x: number; y: number; app: FruitAppearance; rot: number; len?: number }) {
  const c = POD[app.podColor];
  const w = app.pod === 'snap' ? 6.5 : app.pod === 'snow' ? 4.2 : 5.6;
  const bumps = app.pod === 'shelling' ? 5 : app.pod === 'snow' ? 5 : 0;
  const pts: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const bump = bumps ? Math.abs(Math.sin(t * Math.PI * bumps)) * (app.pod === 'snow' ? 1.3 : 0.6) : 0;
    pts.push(`${(t * len).toFixed(1)},${(-(Math.sin(Math.PI * t) * w) - bump).toFixed(1)}`);
  }
  for (let i = 20; i >= 0; i--) {
    const t = i / 20;
    pts.push(`${(t * len).toFixed(1)},${(Math.sin(Math.PI * t) * w * 0.35 + t * 1.5).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M${pts.join('L')}Z`} fill={c.base} stroke={c.deep} strokeWidth={0.7} strokeLinejoin="round" />
      <path d={`M ${len * 0.1} ${-w * 0.3} Q ${len / 2} ${-w * 0.9} ${len * 0.9} ${-w * 0.3}`} fill="none" stroke="#fff" strokeWidth={0.6} opacity={0.35} />
    </g>
  );
}

function Leaf({ x, y, side, app, rng }: { x: number; y: number; side: 1 | -1; app: FruitAppearance; rng: () => number }) {
  const els: ReactElement[] = [];
  const leaflet = app.leaf === 'normal' || app.leaf === 'acacia';
  const tendril = app.leaf === 'normal' || app.leaf === 'afila';
  const tiny = app.leaf === 'parsley';
  const n = app.leaf === 'acacia' ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const dx = side * (6 + i * 6);
    const dy = -2 - i * 3;
    if (leaflet) els.push(<ellipse key={`l${i}`} cx={x + dx} cy={y + dy} rx={4.2} ry={2.6} transform={`rotate(${side * -20} ${x + dx} ${y + dy})`} fill="#7fa86a" stroke="#4a6e3a" strokeWidth={0.5} />);
    if (tiny)
      for (let j = 0; j < 3; j++) els.push(<ellipse key={`p${i}${j}`} cx={x + dx + (j - 1) * 2.2} cy={y + dy - (j % 2) * 2} rx={1.6} ry={1} fill="#7fa86a" stroke="#4a6e3a" strokeWidth={0.3} />);
  }
  if (tendril) {
    const tx = x + side * (n * 6 + 6);
    const ty = y - n * 3 - 2;
    els.push(<path key="t" d={`M ${x + side * 4} ${y - 1} Q ${tx - side * 2} ${ty + 2} ${tx} ${ty} q ${side * 3} -3 ${side * 1} -5 q ${-side * 2} -1 ${-side * 1} 1`} fill="none" stroke="#5f8a3e" strokeWidth={0.7} />);
    if (app.leaf === 'afila') els.push(<path key="t2" d={`M ${x + side * 3} ${y - 1} q ${side * 6} -8 ${side * 12} -6 q ${side * 2} 2 0 4`} fill="none" stroke="#5f8a3e" strokeWidth={0.7} />);
  }
  // Grande stipule à la base, signature du pois
  els.push(<path key="s" d={`M ${x} ${y} q ${side * 6} ${3 + rng()} ${side * 7} -2 q ${-side * 3} -3 ${-side * 7} 2 Z`} fill="#8fb47a" stroke="#4a6e3a" strokeWidth={0.4} />);
  return <g>{els}</g>;
}

export function PeaPortrait({
  seed,
  appearance: app,
  weightUnit,
  size = 120,
}: {
  seed: string;
  appearance: FruitAppearance;
  /** Récolte sur l’échelle 0–1 (nombre de gousses). */
  weightUnit: number;
  size?: number;
}) {
  const rng = mulberry32(hashSeed(seed));
  const u = Math.max(0, Math.min(1, weightUnit));
  const top = app.dwarf ? 54 : 10;
  const nodes = app.dwarf ? 4 : 7;
  const stemPts: Array<[number, number]> = [];
  for (let i = 0; i <= nodes; i++) {
    const t = i / nodes;
    stemPts.push([46 + (i % 2 ? 3 : -3) * (app.terminal ? 0.4 : 1), 104 - t * (104 - top)]);
  }
  const nPods = 1 + Math.round(u * 3);
  const flowerNodes = app.terminal ? [nodes] : Array.from({ length: Math.min(3, nodes - 1) }, (_, i) => nodes - 1 - i);
  const els: ReactElement[] = [];
  for (let i = 1; i < nodes; i++) els.push(<Leaf key={`lf${i}`} x={stemPts[i][0]} y={stemPts[i][1]} side={i % 2 ? 1 : -1} app={app} rng={rng} />);
  flowerNodes.forEach((ni, k) => {
    const [x, y] = stemPts[ni];
    if (app.terminal) {
      for (let j = 0; j < 5; j++) els.push(<Flower key={`f${j}`} x={x - 8 + j * 4} y={y - 4 - (j % 2) * 4} color={app.flower} s={0.9} />);
    } else els.push(<Flower key={`f${k}`} x={x + (k % 2 ? -8 : 8)} y={y - 4} color={app.flower} />);
  });
  for (let i = 0; i < nPods; i++) {
    const ni = Math.max(1, nodes - 2 - i);
    const [x, y] = stemPts[ni];
    const side = i % 2 ? -1 : 1;
    els.push(<Pod key={`p${i}`} x={x + side * 2} y={y + 4} app={app} rot={side > 0 ? 70 : 110} len={18 + u * 6} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <ellipse cx={60} cy={110} rx={46} ry={4} fill="#000" opacity={0.12} />
      {!app.dwarf && app.leaf !== 'afila' && <line x1={40} y1={108} x2={40} y2={6} stroke="#b08a5a" strokeWidth={1.6} opacity={0.6} />}
      <path d={`M${stemPts.map(([x, y]) => `${x},${y}`).join(' L')}`} fill="none" stroke="#5f8a3e" strokeWidth={app.terminal ? 3.4 : 1.8} strokeLinejoin="round" />
      {els}
      {/* gousse ouverte et graines */}
      <g transform="translate(80 92)">
        <path d="M -12 0 C -10 -10 22 -10 26 0 C 22 6 -10 6 -12 0 Z" fill={POD[app.podColor].base} stroke={POD[app.podColor].deep} strokeWidth={0.8} />
        <path d="M -9 0 C -6 -5 19 -5 23 0 C 19 3 -6 3 -9 0 Z" fill="#eef3d8" />
        {[-4, 3.5, 11, 18.5].map((dx, i) => (
          <Seed key={i} x={dx} y={-0.4} r={3.4} shape={app.seedShape} cotyledon={app.cotyledon} coat={app.coat} rot={i} />
        ))}
      </g>
      {app.species !== 'sativum' && (
        <g transform="translate(102 12)">
          <rect x={-16} y={-7} width={32} height={14} rx={4} fill="#2e4a35" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#f3e6b8">
            {app.species === 'elatius' ? 'elat.' : app.species === 'fulvum' ? 'fulv.' : 'abys.'}
          </text>
        </g>
      )}
      {app.winter && (
        <g transform="translate(16 12)">
          <circle r={7} fill="#4a7fb0" />
          <text x={0} y={3} textAnchor="middle" fontSize={9} fill="#fff">
            ❄
          </text>
        </g>
      )}
    </svg>
  );
}

/** Pastille : la graine (tégument ou cotylédons), cerclée de la couleur de la gousse. */
export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'cotyledon' | 'coat'> & Partial<Pick<FruitAppearance, 'podColor'>>; size?: number }) {
  const c = fruitColor(appearance);
  const ring = appearance.podColor === 'yellow' ? '#d9b82a' : '#5f8a3e';
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: `radial-gradient(circle at 35% 30%, #ffffff66, ${c} 55%, ${c})`, boxShadow: `inset 0 -1px 2px rgba(0,0,0,.25), 0 0 0 1.5px ${ring}` }}
    />
  );
}
