import { useId } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FruitAppearance, RindColor } from '../engine/melon/engine';

/** Teintes de l’écorce : base, ombre, marbrure/rayure. */
export const RIND_COLORS: Record<RindColor, { base: string; deep: string; stripe: string }> = {
  green: { base: '#7f9f58', deep: '#465f2c', stripe: '#3b5424' },
  yellow: { base: '#f0c43a', deep: '#b98c14', stripe: '#8f9a3a' },
  cream: { base: '#ece3bf', deep: '#bdb184', stripe: '#a9b27a' },
};

const FLESH: Record<FruitAppearance['flesh'], { flesh: string; rim: string }> = {
  orange: { flesh: '#f29a45', rim: '#9fb86a' },
  green: { flesh: '#c9dc92', rim: '#8fae5a' },
  white: { flesh: '#f4efdc', rim: '#b9c890' },
};

/** Couleur « vue de loin » d’un fruit (pastilles, légendes). */
export function fruitColor(app: Pick<FruitAppearance, 'rind' | 'netted'>): string {
  return app.netted ? '#c9b98a' : RIND_COLORS[app.rind].base;
}

/** Contour du fruit (tige en haut), demi-largeur `w`. */
function outline(app: FruitAppearance, w: number): { d: string; h: number; halfW: number; pts: Array<[number, number]> } {
  const ratio = Math.max(0.6, Math.min(8, app.ratio));
  const snake = app.shape === 'snake';
  let halfW = w;
  let h = w * ratio;
  if (snake) {
    halfW = 6.5;
    h = 46;
  } else if (h > 36) {
    halfW *= 36 / h;
    h = 36;
  }
  const N = 64;
  const right: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const v = -1 + (2 * i) / N;
    let x: number;
    if (snake) x = Math.max(0, 1 - Math.abs(v) ** 8) ** 0.5 * (0.8 + 0.2 * (v + 1) / 2);
    else if (app.shape === 'elongated') x = Math.max(0, 1 - Math.abs(v) ** 2.6) ** 0.6;
    else x = Math.sqrt(Math.max(0, 1 - v * v));
    // côtes des cantaloups : légère ondulation de la silhouette
    if (app.sutures && !snake) x *= 1 + 0.035 * Math.cos(i * 1.4);
    right.push([x * halfW, v * h]);
  }
  const left = [...right].reverse().map(([x, y]) => [-x, y] as [number, number]);
  let all = [...right, ...left];
  // Melon serpent : fruit long et courbé
  if (snake) all = all.map(([x, y]) => [x + 16 * ((y / h + 1) / 2) ** 2, y] as [number, number]);
  const d = `M${all.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
  return { d, h, halfW, pts: all };
}

function Leaf({ x, y, s, rot, uid }: { x: number; y: number; s: number; rot: number; uid: string }) {
  // Feuille de melon : arrondie, réniforme, 5 lobes peu marqués
  const pts: string[] = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const th = (-0.86 + 1.72 * t) * Math.PI;
    const local = t * 5 - Math.floor(t * 5) - 0.5;
    const r = s * (0.86 + 0.14 * (1 - 4 * local * local)) * (1 - 0.18 * Math.abs(t - 0.5));
    pts.push(`${(Math.sin(th) * r).toFixed(1)},${(-Math.cos(th) * r * 0.9 - s * 0.35).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0,0L${pts.join('L')}Z`} fill={`url(#${uid}-leaf)`} stroke="#355a2a" strokeWidth={0.7} strokeLinejoin="round" />
      {[-0.5, -0.25, 0, 0.25, 0.5].map((f) => (
        <line key={f} x1={0} y1={-s * 0.35} x2={Math.sin(f * Math.PI) * s * 0.75} y2={-Math.cos(f * Math.PI) * s * 0.7 - s * 0.35} stroke="#355a2a" strokeWidth={0.55} opacity={0.5} />
      ))}
    </g>
  );
}

export function MelonPortrait({
  seed,
  appearance: app,
  weightUnit,
  size = 120,
}: {
  seed: string;
  appearance: FruitAppearance;
  /** Poids sur l’échelle 0–1 (taille relative du fruit). */
  weightUnit: number;
  size?: number;
}) {
  const rawId = useId();
  const rng = mulberry32(hashSeed(seed));
  const uid = `ml${rawId.replace(/[^a-zA-Z0-9]/g, '')}${hashSeed(seed + rawId).toString(36)}`;
  const col = RIND_COLORS[app.rind];
  const w = 15 + weightUnit * 17;
  const { d, h, halfW } = outline(app, w);
  const snake = app.shape === 'snake';
  const rot = snake ? -30 : app.shape === 'elongated' ? -50 + (rng() - 0.5) * 8 : (rng() - 0.5) * 8;
  const cx = snake ? 48 : 60;
  const cy = snake ? 68 : 70;
  const clip = `${uid}-clip`;
  const sutures = app.sutures ? (snake ? 0 : 10) : 0;
  const stripes = app.striped ? (snake ? 7 : 8) : 0;
  const spots = app.mottled ? 40 : 0;
  const fl = FLESH[app.flesh];
  const W = snake ? halfW + 16 : halfW;

  // Broderie : réseau de petites cellules liégeuses
  const net: string[] = [];
  if (app.netted) {
    for (let i = 0; i < 70; i++) {
      const x = (rng() - 0.5) * 2 * W;
      const y = (rng() - 0.5) * 2 * h;
      const a = rng() * Math.PI;
      const l = 3 + rng() * 4;
      net.push(`M${(x - Math.cos(a) * l).toFixed(1)},${(y - Math.sin(a) * l).toFixed(1)} q${(rng() * 3 - 1.5).toFixed(1)},${(rng() * 3 - 1.5).toFixed(1)} ${(2 * Math.cos(a) * l).toFixed(1)},${(2 * Math.sin(a) * l).toFixed(1)}`);
    }
  }

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-rind`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={col.base} />
          <stop offset="65%" stopColor={col.base} />
          <stop offset="100%" stopColor={col.deep} />
        </radialGradient>
        <linearGradient id={`${uid}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7aa25e" />
          <stop offset="100%" stopColor="#40703a" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>

      {/* Tige coureuse, vrille, feuilles rondes */}
      <path d="M4,24 C28,12 46,28 70,18 S104,10 116,20" fill="none" stroke="#557f3f" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M86,16 c4,-6 10,-4 8,2 c-2,5 -8,4 -6,-1" fill="none" stroke="#6c9256" strokeWidth={0.9} />
      <Leaf x={28} y={20} s={17} rot={-26} uid={uid} />
      <Leaf x={100} y={17} s={15} rot={30} uid={uid} />
      {/* petite fleur jaune */}
      <g transform="translate(64 16)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={Math.cos((a * Math.PI) / 180) * 2.6} cy={Math.sin((a * Math.PI) / 180) * 2.6} rx={2.4} ry={1.5} transform={`rotate(${a} ${Math.cos((a * Math.PI) / 180) * 2.6} ${Math.sin((a * Math.PI) / 180) * 2.6})`} fill="#f4d23c" />
        ))}
        <circle r={1.2} fill="#c79a14" />
      </g>

      <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
        {/* Pédoncule */}
        <path d={`M-1.6,${-h + 2} L-1.2,${-h - 7} L1.4,${-h - 7} L1.8,${-h + 2} Z`} fill="#6a8a44" stroke="#3c4f2c" strokeWidth={0.5} />
        <path d={d} fill={`url(#${uid}-rind)`} stroke={col.deep} strokeWidth={0.9} />
        <g clipPath={`url(#${clip})`}>
          {Array.from({ length: stripes }, (_, i) => {
            const x = -W + ((i + 0.5) / stripes) * 2 * W;
            return <path key={`s${i}`} d={`M${x * 0.3},${-h * 1.1} Q${x * 1.2},0 ${x * 0.3},${h * 1.1}`} stroke={col.stripe} strokeWidth={snake ? 1.6 : 2.6} fill="none" opacity={0.8} />;
          })}
          {Array.from({ length: spots }, (_, i) => (
            <ellipse key={`m${i}`} cx={(rng() - 0.5) * 2 * W} cy={(rng() - 0.5) * 2 * h} rx={1.4 + rng() * 2.6} ry={1 + rng() * 1.6} fill={app.rind === 'green' ? '#2f4a22' : '#6f8a3a'} opacity={0.55} />
          ))}
          {sutures > 0 &&
            Array.from({ length: sutures }, (_, i) => {
              const x = -W + ((i + 0.5) / sutures) * 2 * W;
              return <path key={`r${i}`} d={`M${x * 0.12},${-h} Q${x * 1.15},0 ${x * 0.12},${h}`} stroke={app.netted ? '#6f8f4a' : '#3f5a2a'} strokeWidth={app.netted ? 1.6 : 1.2} fill="none" opacity={0.7} />;
            })}
          {net.length > 0 && <path d={net.join(' ')} stroke="#d9cfa6" strokeWidth={1.1} fill="none" opacity={0.95} strokeLinecap="round" />}
          <ellipse cx={-W * 0.35} cy={-h * 0.4} rx={W * 0.22} ry={h * 0.16} fill="#fff" opacity={0.18} />
        </g>
      </g>

      {/* Tranche de chair + graines */}
      <g transform="translate(104 101)">
        <path d="M-12,0 A12,12 0 0 0 12,0 Z" fill={fl.flesh} stroke={fl.rim} strokeWidth={1.6} />
        <path d="M-6,0 A6,5 0 0 0 6,0 Z" fill={app.flesh === 'orange' ? '#e0813a' : '#e9dfb6'} />
        {[-4, -2, 0, 2, 4].map((x) => (
          <ellipse key={x} cx={x} cy={2 + (x === 0 ? 1.4 : Math.abs(x) === 2 ? 1 : 0)} rx={0.8} ry={1.4} fill={app.whiteSeeds ? '#fbf7ea' : '#e6cf8c'} stroke="#a08a50" strokeWidth={0.3} />
        ))}
      </g>
      {(app.bitter || app.sour) && (
        <g transform="translate(14 104)">
          <circle r={9} fill="#b8412a" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
            !
          </text>
        </g>
      )}
    </svg>
  );
}

export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'rind' | 'netted' | 'striped' | 'bitter' | 'sour'>; size?: number }) {
  const c = RIND_COLORS[appearance.rind];
  const base = fruitColor(appearance);
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: appearance.striped
          ? `repeating-linear-gradient(90deg, ${c.base} 0 3px, ${c.stripe} 3px 5px)`
          : appearance.netted
            ? `repeating-linear-gradient(45deg, ${base} 0 2px, #e6dcb8 2px 3px), ${c.base}`
            : `radial-gradient(circle at 35% 30%, ${base}, ${c.deep})`,
        boxShadow: appearance.bitter || appearance.sour ? '0 0 0 2px #b8412a' : 'inset 0 -1px 2px rgba(0,0,0,.25)',
      }}
    />
  );
}
