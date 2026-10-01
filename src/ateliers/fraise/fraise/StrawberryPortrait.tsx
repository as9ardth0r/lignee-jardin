import type { ReactElement } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FruitAppearance, FruitColor } from '../engine/fraise/engine';

export const FRUIT_PAINT: Record<FruitColor, { base: string; deep: string; light: string; flesh: string }> = {
  red: { base: '#d8312b', deep: '#8e1a18', light: '#f0675a', flesh: '#f29a8e' },
  white: { base: '#f4eee0', deep: '#cfc4a6', light: '#fffaf0', flesh: '#fbf6ea' },
  yellow: { base: '#f3dd8a', deep: '#c9a94a', light: '#fbefbf', flesh: '#fbf2cf' },
};

/** Akènes : rouges sur la fraise blanche (Pineberry), dorés ailleurs. */
function seedPaint(color: FruitColor): string {
  return color === 'white' ? '#c8322a' : color === 'yellow' ? '#a8822a' : '#f2c94a';
}

export function fruitColor(app: Pick<FruitAppearance, 'color'>): string {
  return FRUIT_PAINT[app.color].base;
}

/** Contour d’une fraise : cœur arrondi, plus ou moins allongé. */
function berryPath(w: number, h: number): string {
  const top = 0;
  return `M0,${h} C${-w * 0.25},${h * 0.92} ${-w * 0.62},${h * 0.62} ${-w * 0.56},${h * 0.3} C${-w * 0.5},${top + h * 0.04} ${-w * 0.18},${top - h * 0.02} 0,${top + h * 0.06} C${w * 0.18},${top - h * 0.02} ${w * 0.5},${top + h * 0.04} ${w * 0.56},${h * 0.3} C${w * 0.62},${h * 0.62} ${w * 0.25},${h * 0.92} 0,${h} Z`;
}

function Calyx({ x, y, w }: { x: number; y: number; w: number }) {
  const sep: ReactElement[] = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.95 + (i / 6) * Math.PI * 0.9;
    const len = w * (0.42 + (i % 2) * 0.12);
    sep.push(<path key={i} d={`M${x},${y} l${Math.cos(a) * len * 0.3},${Math.sin(a) * len * 0.15 - 1} L${x + Math.cos(a) * len},${y + Math.sin(a) * len * 0.45 + 2} Z`} fill="#4f8a3a" stroke="#3a6a2a" strokeWidth={0.6} strokeLinejoin="round" />);
  }
  return (
    <g>
      {sep}
      <path d={`M${x},${y - 1} q-1,-7 -4,-12`} stroke="#4f7a3c" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Feuille trifoliée dentée. */
function Leaf({ x, y, rot, s }: { x: number; y: number; rot: number; s: number }) {
  const leaflet = (a: number) => <ellipse key={a} cx={0} cy={-9 * s} rx={5 * s} ry={8 * s} transform={`rotate(${a})`} fill="#5f9a46" stroke="#3f6e30" strokeWidth={0.7} />;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0,${10 * s} L0,0`} stroke="#4f7a3c" strokeWidth={1.2} />
      {[-48, 0, 48].map(leaflet)}
      <path d={`M0,0 L0,${-15 * s} M0,0 L${-11 * s},${-8 * s} M0,0 L${11 * s},${-8 * s}`} stroke="#3f6e30" strokeWidth={0.5} />
    </g>
  );
}

function Flower({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * r} cy={y + Math.sin((a * Math.PI) / 180) * r} r={r * 0.85} fill="#fbf8f0" stroke="#d9d2c0" strokeWidth={0.4} />
      ))}
      <circle cx={x} cy={y} r={r * 0.7} fill="#e8c43a" />
    </g>
  );
}

export function StrawberryPortrait({
  seed,
  appearance: app,
  weightUnit,
  runners = true,
  size = 120,
}: {
  seed: string;
  appearance: FruitAppearance;
  /** Poids sur l’échelle 0–1 (taille relative du fruit). */
  weightUnit: number;
  /** La plante fait des stolons (dessine un stolon et sa fille). */
  runners?: boolean;
  size?: number;
}) {
  const rng = mulberry32(hashSeed(seed));
  const u = Math.max(0, Math.min(1, weightUnit));
  const paint = FRUIT_PAINT[app.color];
  const elong = 0.95 + rng() * 0.45;
  const w = 24 + u * 26;
  const h = w * elong;
  const fx = 50;
  const fy = 46;
  const seeds: ReactElement[] = [];
  const rows = 5 + Math.round(u * 3);
  for (let r = 0; r < rows; r++) {
    const t = (r + 0.7) / (rows + 0.4);
    const half = Math.sin(Math.PI * Math.min(0.98, t * 0.85 + 0.12)) * w * 0.48;
    const n = Math.max(2, Math.round(half / 5));
    for (let i = 0; i < n; i++) {
      const sx = -half + ((i + 0.5 + (r % 2) * 0.5) / (n + 0.5)) * half * 2;
      seeds.push(<ellipse key={`${r}-${i}`} cx={sx} cy={t * h} rx={0.9} ry={1.4} fill={seedPaint(app.color)} opacity={0.95} />);
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <ellipse cx={60} cy={114} rx={42} ry={3.5} fill="#000" opacity={0.1} />
      {/* feuillage */}
      <Leaf x={22} y={34} rot={-24} s={1.05} />
      <Leaf x={84} y={30} rot={22} s={0.95} />
      {app.everbearing && (
        <g>
          <path d="M 86 40 Q 96 26 102 18" stroke="#4f7a3c" strokeWidth={1.2} fill="none" />
          <Flower x={102} y={16} r={4} />
        </g>
      )}
      {/* stolon et plante fille */}
      {runners && !app.runnerless && (
        <g>
          <path d="M 70 100 Q 92 92 108 104" stroke="#8a4a3a" strokeWidth={1.3} fill="none" />
          <Leaf x={108} y={104} rot={8} s={0.5} />
        </g>
      )}
      {/* fruit */}
      <g transform={`translate(${fx} ${fy})`}>
        <path d={berryPath(w, h)} fill={paint.base} stroke={paint.deep} strokeWidth={1} strokeLinejoin="round" />
        <path d={`M${-w * 0.3},${h * 0.18} Q${-w * 0.36},${h * 0.45} ${-w * 0.18},${h * 0.7}`} stroke={paint.light} strokeWidth={w * 0.08} strokeLinecap="round" fill="none" opacity={0.55} />
        {seeds}
      </g>
      <Calyx x={fx} y={fy + 2} w={w} />
      {/* coupe : chair et cœur */}
      <g transform="translate(98 74)">
        <path d={berryPath(18, 22)} transform="translate(0 -11)" fill={paint.base} stroke={paint.deep} strokeWidth={0.8} />
        <path d={berryPath(14, 17)} transform="translate(0 -8)" fill={paint.flesh} />
        <path d="M0,-5 L0,8" stroke={app.color === 'red' ? '#fbe2dc' : '#fffaf0'} strokeWidth={2.5} strokeLinecap="round" />
      </g>
      {app.maleSterile && (
        <g transform="translate(104 12)">
          <rect x={-10} y={-7} width={20} height={14} rx={4} fill="#6b4a6e" />
          <text x={0} y={4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">
            ♀
          </text>
        </g>
      )}
      {app.species !== 'ananassa' && (
        <g transform="translate(18 12)">
          <rect x={-15} y={-7} width={30} height={14} rx={4} fill="#2e4a35" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#f3e6b8">
            {app.species === 'vesca' ? 'bois' : app.species === 'moschata' ? 'musqué' : app.species.slice(0, 5)}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Pastille : couleur du fruit. */
export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'color'>; size?: number }) {
  const p = FRUIT_PAINT[appearance.color];
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: `radial-gradient(circle at 35% 30%, ${p.light} 0 18%, ${p.base} 40% 100%)`, boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.12)' }}
    />
  );
}
