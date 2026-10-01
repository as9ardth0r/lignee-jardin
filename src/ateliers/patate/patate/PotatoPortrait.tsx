import type { ReactElement } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FleshColor, FruitAppearance, SkinColor, TuberShape } from '../engine/patate/engine';

export const SKIN_PAINT: Record<SkinColor, { base: string; deep: string; light: string }> = {
  buff: { base: '#d9b77e', deep: '#9c7744', light: '#efd9ab' },
  red: { base: '#b5414a', deep: '#7a2430', light: '#d9737a' },
  purple: { base: '#4a2a58', deep: '#26132e', light: '#7a5590' },
};

export const FLESH_PAINT: Record<FleshColor, string> = {
  white: '#f7f2e2',
  cream: '#f4e6ad',
  yellow: '#f1cd52',
  orange: '#f09a2a',
  red: '#c23a4c',
  purple: '#6b2f86',
};

/** Couleur « vue de loin » (pastilles) : la peau. */
export function fruitColor(app: Pick<FruitAppearance, 'skin' | 'flesh'>): string {
  return SKIN_PAINT[app.skin].base;
}

const SHAPE_RATIO: Record<TuberShape, number> = { round: 1.08, oval: 1.4, long: 2.1 };

/** Contour d’un tubercule un peu irrégulier, centré sur 0,0. */
function tuberPath(rx: number, ry: number, rng: () => number, bend = 0): string {
  const pts: string[] = [];
  const N = 28;
  const wob = Array.from({ length: 5 }, () => (rng() - 0.5) * 0.12);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = 1 + wob[i % 5] * Math.sin(a * 3 + wob[0] * 10);
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k + bend * (x / rx) * (x / rx) * ry;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

function Tuber({ x, y, rx, ry, rot, app, rng, cut = false }: { x: number; y: number; rx: number; ry: number; rot: number; app: FruitAppearance; rng: () => number; cut?: boolean }) {
  const skin = SKIN_PAINT[app.skin];
  const bend = app.shape === 'long' ? 0.25 : 0;
  const d = tuberPath(rx, ry, rng, bend);
  const eyes: ReactElement[] = [];
  const nEyes = app.shape === 'long' ? 6 : 4;
  for (let i = 0; i < nEyes; i++) {
    const ex = (rng() - 0.5) * rx * 1.5;
    const ey = (rng() - 0.5) * ry * 1.2;
    eyes.push(
      app.deepEyes ? (
        <g key={i}>
          <ellipse cx={ex} cy={ey} rx={2.2} ry={1.4} fill={skin.deep} opacity={0.9} />
          <path d={`M${ex - 2.4},${ey - 1.2} q2.4,-1.6 4.8,0`} fill="none" stroke={skin.light} strokeWidth={0.6} opacity={0.7} />
        </g>
      ) : (
        <path key={i} d={`M${ex - 1.4},${ey} q1.4,-0.9 2.8,0`} fill="none" stroke={skin.deep} strokeWidth={0.7} opacity={0.7} />
      )
    );
  }
  if (cut) {
    // Demi-tubercule vu par la face coupée : chair, cerne vasculaire, liseré de peau.
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <path d={d} fill={skin.base} stroke={skin.deep} strokeWidth={0.8} />
        <ellipse cx={0} cy={ry * 0.02} rx={rx * 0.9} ry={ry * 0.86} fill={FLESH_PAINT[app.flesh]} />
        <ellipse cx={0} cy={ry * 0.02} rx={rx * 0.72} ry={ry * 0.66} fill="none" stroke="#000" strokeOpacity={0.08} strokeWidth={1} />
        <ellipse cx={-rx * 0.25} cy={-ry * 0.25} rx={rx * 0.25} ry={ry * 0.18} fill="#fff" opacity={0.18} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={d} fill={skin.base} stroke={skin.deep} strokeWidth={0.8} />
      <ellipse cx={-rx * 0.3} cy={-ry * 0.35} rx={rx * 0.45} ry={ry * 0.28} fill={skin.light} opacity={0.35} />
      {eyes}
    </g>
  );
}

/** Petit rameau de feuilles composées, derrière les tubercules. */
function Foliage({ rng }: { rng: () => number }) {
  const leaflets: ReactElement[] = [];
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = 36 + t * 48 + (rng() - 0.5) * 4;
    const y = 30 - Math.sin(t * Math.PI) * 14 + (rng() - 0.5) * 4;
    leaflets.push(<ellipse key={i} cx={x} cy={y} rx={7} ry={4.4} transform={`rotate(${-30 + t * 60} ${x} ${y})`} fill="#6f9a52" stroke="#3f6230" strokeWidth={0.5} />);
  }
  return (
    <g opacity={0.9}>
      <path d="M 34 34 Q 60 6 86 34" fill="none" stroke="#4f7a3c" strokeWidth={1.6} />
      {leaflets}
    </g>
  );
}

export function PotatoPortrait({
  seed,
  appearance: app,
  weightUnit,
  size = 120,
}: {
  seed: string;
  appearance: FruitAppearance;
  /** Récolte sur l’échelle 0–1 (taille relative des tubercules). */
  weightUnit: number;
  size?: number;
}) {
  const rng = mulberry32(hashSeed(seed));
  const u = Math.max(0, Math.min(1, weightUnit));
  const ratio = SHAPE_RATIO[app.shape];
  const ry = 9 + u * 11;
  const rx = Math.min(36, ry * ratio);
  const cut = { rx: rx * 0.85, ry: ry * 0.85 };
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <ellipse cx={60} cy={110} rx={46} ry={4} fill="#000" opacity={0.12} />
      <Foliage rng={rng} />
      <Tuber x={42} y={66} rx={rx} ry={ry} rot={-18} app={app} rng={rng} />
      <Tuber x={74} y={84} rx={rx * 0.9} ry={ry * 0.9} rot={12} app={app} rng={rng} />
      <Tuber x={44} y={96} rx={cut.rx} ry={cut.ry} rot={-4} app={app} rng={rng} cut />
      {app.ploidy !== 4 && (
        <g transform="translate(104 12)">
          <rect x={-13} y={-7} width={26} height={14} rx={4} fill="#2e4a35" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#f3e6b8">
            {app.ploidy}x
          </text>
        </g>
      )}
      {app.maleSterile && (
        <g transform="translate(16 12)">
          <rect x={-10} y={-7} width={20} height={14} rx={4} fill="#6b4a6e" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
            W
          </text>
        </g>
      )}
    </svg>
  );
}

/** Pastille : peau et chair, en deux moitiés. */
export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'skin' | 'flesh'>; size?: number }) {
  const s = SKIN_PAINT[appearance.skin].base;
  const f = FLESH_PAINT[appearance.flesh];
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${s} 0 52%, ${f} 52% 100%)`, boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.12)' }}
    />
  );
}
