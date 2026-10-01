import { useId } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FruitAppearance, FruitShape } from '../engine/tomato/engine';

/** Teinte de base de la peau selon la couleur perçue. */
export const FRUIT_COLORS: Record<FruitAppearance['colorKey'], { base: string; deep: string; stripe: string }> = {
  red: { base: '#d23a24', deep: '#8f1f14', stripe: '#f08a3a' },
  crimson: { base: '#b3121e', deep: '#6a0a12', stripe: '#e0503a' },
  bicolor: { base: '#f3bf3a', deep: '#c98a1c', stripe: '#e0503a' },
  pink: { base: '#e2707a', deep: '#a8404f', stripe: '#f4b0a8' },
  yellow: { base: '#f2c230', deep: '#c48a12', stripe: '#fbe27a' },
  cream: { base: '#f1e2a6', deep: '#c9b06a', stripe: '#fff4c8' },
  orange: { base: '#f08a24', deep: '#b8560e', stripe: '#f8bb5c' },
  black: { base: '#7a2e22', deep: '#3f1812', stripe: '#9a5a2a' },
  purple: { base: '#8e3c50', deep: '#4e1a2a', stripe: '#b86a70' },
  green: { base: '#b5c94e', deep: '#6d8a26', stripe: '#4f7322' },
};

/** Contour du fruit (vue de profil), en coordonnées polaires déformées. */
function fruitPath(shape: FruitShape, s: number): string {
  const pts: string[] = [];
  const N = 72;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2;
    const c = Math.cos(th);
    const sn = Math.sin(th); // > 0 = bas du fruit (SVG)
    let x = c * s;
    let y = sn * s * 0.9;
    switch (shape) {
      case 'ribbed':
        x = c * s * 1.2 * (1 + 0.045 * Math.cos(10 * th));
        y = sn * s * 0.72;
        break;
      case 'heart':
        x = c * s * (1 - 0.5 * Math.max(0, sn) ** 1.6) * (1 + 0.03 * Math.cos(8 * th));
        y = sn * s * (sn > 0 ? 1.2 : 0.78);
        break;
      case 'oval':
        x = c * s * 0.78;
        y = sn * s * 1.08;
        break;
      case 'pear': {
        const widen = 0.45 + 0.55 * ((sn + 1) / 2) ** 1.4;
        x = c * s * widen;
        y = sn * s * 1.3;
        break;
      }
      case 'elongated':
        x = c * s * 0.6 * (1 - 0.18 * Math.max(0, sn) ** 3);
        y = sn * s * (sn > 0 ? 1.5 : 1.3);
        break;
    }
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

function Fruit({
  app,
  s,
  x,
  y,
  uid,
  rng,
}: {
  app: FruitAppearance;
  s: number;
  x: number;
  y: number;
  uid: string;
  rng: () => number;
}) {
  const col = FRUIT_COLORS[app.colorKey];
  const d = fruitPath(app.shape, s);
  const clip = `${uid}-clip-${Math.round(x)}-${Math.round(y)}`;
  const topY = app.shape === 'elongated' ? -s * 1.3 : app.shape === 'pear' ? -s * 1.3 : app.shape === 'ribbed' ? -s * 0.72 : -s * 0.9;
  const stripes = app.striped ? 7 : 0;
  const spots = app.anthocyanin === 'patches' ? 5 : 0;

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`url(#${uid}-body-${app.colorKey})`} />
      <g clipPath={`url(#${clip})`}>
        {Array.from({ length: stripes }, (_, i) => {
          const off = ((i - (stripes - 1) / 2) / stripes) * s * 2.2;
          return (
            <path
              key={i}
              d={`M${off * 0.4},${topY} Q${off * 1.25},0 ${off * 0.4},${-topY * 1.4}`}
              stroke={col.stripe}
              strokeWidth={s * 0.11}
              fill="none"
              opacity={0.55}
              strokeLinecap="round"
            />
          );
        })}
        {app.greenShoulder && (
          <ellipse cx={0} cy={topY} rx={s * 0.9} ry={s * 0.45} fill="#4d7a24" opacity={0.42} filter={`url(#${uid}-blur)`} />
        )}
        {app.anthocyanin === 'indigo' && (
          <ellipse cx={-s * 0.1} cy={topY * 0.55} rx={s * 1.3} ry={s * 0.85} fill="#241a3a" opacity={0.88} filter={`url(#${uid}-blur)`} />
        )}
        {Array.from({ length: spots }, (_, i) => (
          <ellipse
            key={i}
            cx={(rng() - 0.5) * s * 1.4}
            cy={topY * (0.2 + rng() * 0.6)}
            rx={s * (0.18 + rng() * 0.2)}
            ry={s * (0.12 + rng() * 0.15)}
            fill="#2c1f45"
            opacity={0.75}
            filter={`url(#${uid}-blur)`}
          />
        ))}
        {app.colorKey === 'bicolor' && (
          <>
            <ellipse cx={0} cy={-topY * 0.75} rx={s * 0.95} ry={s * 0.6} fill="#e0503a" opacity={0.7} filter={`url(#${uid}-blur)`} />
            {[-0.45, 0, 0.45].map((k) => (
              <path key={k} d={`M${k * s * 1.2},${-topY * 1.2} Q${k * s * 0.8},${topY * 0.1} ${k * s * 0.3},${topY * 0.7}`} stroke="#e0503a" strokeWidth={s * 0.12} fill="none" opacity={0.45} strokeLinecap="round" filter={`url(#${uid}-blur)`} />
            ))}
          </>
        )}
        <path d={d} fill={`url(#${uid}-shade)`} />
        {app.fuzzy && <path d={d} fill="#fff" opacity={0.16} />}
      </g>
      <ellipse cx={-s * 0.32} cy={topY * 0.45} rx={s * 0.16} ry={s * 0.26} fill="#fff" opacity={app.fuzzy ? 0.08 : 0.35} transform="rotate(-20)" />
      {/* Calice */}
      <g transform={`translate(0 ${topY + s * 0.04})`}>
        {Array.from({ length: 5 }, (_, i) => (
          <path
            key={i}
            d={`M0,0 Q${s * 0.12},${-s * 0.06} ${s * 0.42},${s * 0.08} Q${s * 0.14},${s * 0.06} 0,0Z`}
            fill="#3f6b2a"
            transform={`rotate(${i * 72 + rng() * 20 - 110})`}
          />
        ))}
        <rect x={-s * 0.04} y={-s * 0.22} width={s * 0.08} height={s * 0.24} rx={s * 0.03} fill="#355c24" />
      </g>
    </g>
  );
}

/** Feuille composée : dentelée (standard) ou lisse et large (c/c). */
function Leaf({ potato, x, y, rot, scale, rugose }: { potato: boolean; x: number; y: number; rot: number; scale: number; rugose?: boolean }) {
  const leaflet = (len: number, w: number) => {
    if (potato) return `M0,0 C${w},${-len * 0.2} ${w * 0.9},${-len * 0.85} 0,${-len} C${-w * 0.9},${-len * 0.85} ${-w},${-len * 0.2} 0,0Z`;
    const pts: string[] = ['M0,0'];
    const n = 6;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const ww = w * Math.sin(Math.PI * t) * (i % 2 ? 1.15 : 0.8);
      pts.push(`L${ww.toFixed(1)},${(-len * t * 0.95).toFixed(1)}`);
    }
    pts.push(`L0,${-len}`);
    for (let i = n; i >= 1; i--) {
      const t = i / n;
      const ww = w * Math.sin(Math.PI * t) * (i % 2 ? 1.15 : 0.8);
      pts.push(`L${(-ww).toFixed(1)},${(-len * t * 0.95).toFixed(1)}`);
    }
    return pts.join('') + 'Z';
  };
  const items = potato
    ? [
        { r: 0, d: 0, len: 34, w: 15 },
        { r: -62, d: 14, len: 26, w: 12 },
        { r: 62, d: 14, len: 26, w: 12 },
      ]
    : [
        { r: 0, d: 0, len: 30, w: 9 },
        { r: -58, d: 10, len: 22, w: 7 },
        { r: 58, d: 10, len: 22, w: 7 },
        { r: -70, d: 24, len: 19, w: 6 },
        { r: 70, d: 24, len: 19, w: 6 },
      ];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      <path d="M0,40 L0,0" stroke="#355c24" strokeWidth={2} />
      {items.map((it, i) => (
        <path key={i} d={leaflet(it.len, it.w)} fill={rugose ? (i === 0 ? '#2f5a22' : '#3a6a2a') : i === 0 ? '#4f7f34' : '#5c8d3d'} stroke={rugose ? '#244a1a' : 'none'} strokeWidth={rugose ? 1.2 : 0} strokeDasharray={rugose ? '2 2' : undefined} transform={`translate(0 ${it.d}) rotate(${it.r})`} />
      ))}
    </g>
  );
}

interface Props {
  seed: string;
  appearance: FruitAppearance;
  /** Position 0–1 du poids sur l'échelle log (5–800 g). */
  weightUnit: number;
  potatoLeaf: boolean;
  determinate: boolean;
  /** Gène d (nain) : feuillage rugueux vert foncé, feuilles serrées. */
  dwarf?: boolean;
  size?: number;
}

/**
 * Portrait botanique procédural d'une grappe : forme, couleur de chair et
 * de peau, rayures, collet vert, anthocyanes, type de feuille et nombre
 * de fruits par grappe découlent tous du génotype. Reproductible (graine
 * = id du spécimen).
 */
export function TomatoPortrait({ seed, appearance, weightUnit, potatoLeaf, determinate, dwarf, size = 160 }: Props) {
  const uid = useId().replace(/:/g, '');
  const rng = mulberry32(hashSeed(seed));
  const s = 11 + weightUnit * 30; // rayon du fruit
  const n = weightUnit < 0.3 ? 6 : weightUnit < 0.5 ? 4 : weightUnit < 0.72 ? 3 : 2;

  // Positions le long d'une rafle qui retombe
  const fruits = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const spread = Math.min(1, 0.55 + n * 0.08);
    return {
      x: 100 + (t - 0.5) * 118 * spread + (rng() - 0.5) * 6,
      y: 108 + Math.sin(t * Math.PI) * -10 + (i % 2) * s * 0.5 + (rng() - 0.5) * 6,
    };
  });

  const colors = Object.entries(FRUIT_COLORS);

  return (
    <svg viewBox="0 0 200 180" width={size} height={size * 0.9} role="img" aria-hidden="true">
      <defs>
        {colors.map(([k, c]) => (
          <radialGradient key={k} id={`${uid}-body-${k}`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={c.base} stopOpacity={0.85} />
            <stop offset="55%" stopColor={c.base} />
            <stop offset="100%" stopColor={c.deep} />
          </radialGradient>
        ))}
        <radialGradient id={`${uid}-shade`} cx="35%" cy="28%" r="80%">
          <stop offset="60%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.28} />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
      </defs>

      {/* Tige principale : droite et terminée par une grappe si déterminée */}
      <path
        d={determinate ? 'M100,6 C98,30 102,48 100,62' : 'M100,0 C96,30 106,52 100,70 C96,86 104,96 102,110'}
        stroke="#3e6a2a"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <Leaf potato={potatoLeaf} rugose={dwarf} x={100} y={46} rot={-62} scale={dwarf ? 1.05 : 1.25} />
      <Leaf potato={potatoLeaf} rugose={dwarf} x={100} y={40} rot={58} scale={dwarf ? 0.95 : 1.1} />

      {/* Rafle */}
      <path
        d={`M100,58 Q${fruits[0].x + 10},70 ${fruits[0].x},${fruits[0].y - s}`}
        stroke="#467232"
        strokeWidth={2}
        fill="none"
      />
      {fruits.map((f, i) => (
        <path key={`p${i}`} d={`M100,60 Q${(100 + f.x) / 2},66 ${f.x},${f.y - s * 0.8}`} stroke="#467232" strokeWidth={1.6} fill="none" />
      ))}

      {fruits
        .map((f, i) => ({ ...f, i }))
        .sort((a, b) => a.y - b.y)
        .map((f) => (
          <Fruit key={f.i} app={appearance} s={s * (0.92 + ((f.i * 37) % 10) / 70)} x={f.x} y={f.y} uid={uid} rng={rng} />
        ))}
    </svg>
  );
}

/** Pastille ronde de couleur (listes, cartes). */
export function FruitDot({ appearance, size = 14 }: { appearance: FruitAppearance; size?: number }) {
  const c = FRUIT_COLORS[appearance.colorKey];
  const anth = appearance.anthocyanin !== 'none';
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: anth
          ? `linear-gradient(160deg, #2a1f44 0%, #2a1f44 45%, ${c.base} 60%)`
          : appearance.colorKey === 'bicolor'
            ? `linear-gradient(20deg, #e0503a 0%, #e0503a 30%, ${c.base} 70%)`
          : appearance.striped
            ? `repeating-linear-gradient(100deg, ${c.base} 0 3px, ${c.stripe} 3px 5px)`
            : `radial-gradient(circle at 35% 30%, ${c.base}, ${c.deep})`,
        boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25)',
      }}
    />
  );
}
