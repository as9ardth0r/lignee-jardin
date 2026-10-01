import { useId } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FleshColor, FruitAppearance, RindColor, SeedColor } from '../engine/pasteque/engine';

/** Teintes de l’écorce : fond, ombre, rayures. */
export const RIND_COLORS: Record<RindColor, { base: string; deep: string; stripe: string }> = {
  dark: { base: '#2f5a2a', deep: '#173418', stripe: '#1d3d1c' },
  striped: { base: '#9cc070', deep: '#4f7a34', stripe: '#2e5a26' },
  light: { base: '#b9d29a', deep: '#7c9a5c', stripe: '#9cb87c' },
};
const GOLDEN = { base: '#e8c13a', deep: '#a8841a', stripe: '#c79f22' };

export const FLESH_COLORS: Record<FleshColor, string> = {
  red: '#e2384a',
  orange: '#f2883a',
  salmon: '#f3b27a',
  canary: '#f5d63c',
  white: '#f3efdc',
};

export const SEED_COLORS: Record<SeedColor, string> = {
  black: '#1f1a17',
  tan: '#a87d4e',
  red: '#a3302a',
  white: '#f6f0dc',
};

/** Feuille de pastèque, profondément découpée (pennatilobée). */
function Leaf({ x, y, s, rot, uid }: { x: number; y: number; s: number; rot: number; uid: string }) {
  const pts: string[] = [];
  const N = 160;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const th = (-0.85 + 1.7 * t) * Math.PI;
    const lobe = Math.abs(Math.cos(t * Math.PI * 2.5));
    const sub = 0.12 * Math.abs(Math.sin(t * Math.PI * 9));
    const r = s * (0.35 + 0.6 * Math.pow(lobe, 0.7) + sub) * (1 - 0.15 * Math.abs(t - 0.5));
    pts.push(`${(Math.sin(th) * r * 0.75).toFixed(1)},${(-Math.cos(th) * r - s * 0.25).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0,0L${pts.join('L')}Z`} fill={`url(#${uid}-leaf)`} stroke="#355a2a" strokeWidth={0.6} strokeLinejoin="round" />
      {[-0.55, 0, 0.55].map((f) => (
        <line key={f} x1={0} y1={-s * 0.25} x2={Math.sin(f * Math.PI) * s * 0.6} y2={-Math.cos(f * Math.PI) * s * 0.85 - s * 0.25} stroke="#355a2a" strokeWidth={0.5} opacity={0.5} />
      ))}
    </g>
  );
}

export function WatermelonPortrait({
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
  const uid = `wm${rawId.replace(/[^a-zA-Z0-9]/g, '')}${hashSeed(seed + rawId).toString(36)}`;
  const col = app.golden ? GOLDEN : RIND_COLORS[app.rind];
  const r = 13 + weightUnit * 18;
  const ratio = app.shape === 'long' ? 1.85 : app.shape === 'oval' ? 1.3 : 1;
  let rx = r * Math.sqrt(ratio);
  let ry = r / Math.sqrt(ratio);
  if (rx > 40) {
    ry *= 40 / rx;
    rx = 40;
  }
  const cx = 52;
  const cy = 74;
  const rot = (rng() - 0.5) * 10;
  const clip = `${uid}-clip`;
  const stripes = app.rind === 'striped' && !app.golden ? 9 : app.rind === 'dark' ? 0 : 7;
  const flesh = FLESH_COLORS[app.flesh];

  // Rayures irrégulières dans le sens de la longueur
  const stripePaths = Array.from({ length: stripes }, (_, i) => {
    const y = -ry + ((i + 0.5) / stripes) * 2 * ry;
    const wig = Array.from({ length: 9 }, (_, k) => {
      const x = -rx * 1.1 + (k / 8) * rx * 2.2;
      const yy = y * Math.sqrt(Math.max(0, 1 - (x / (rx * 1.1)) ** 2)) * 1.05 + (rng() - 0.5) * 2.2;
      return `${x.toFixed(1)},${yy.toFixed(1)}`;
    });
    return `M${wig.join('L')}`;
  });

  // Tranche : quartier avec écorce, chair et pépins
  const seedCol = app.seedless ? '#f3ecd6' : SEED_COLORS[app.seed];
  const seedR = app.seedless ? 0.6 : app.tinySeed ? 0.55 : app.egusi ? 1.5 : 1;
  const seeds: Array<[number, number]> = [];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.12 + (0.76 * i) / 8);
    const d = 7 + (i % 2) * 3;
    seeds.push([Math.cos(a) * d, Math.sin(a) * d]);
  }

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-rind`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={col.base} />
          <stop offset="60%" stopColor={col.base} />
          <stop offset="100%" stopColor={col.deep} />
        </radialGradient>
        <linearGradient id={`${uid}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7aa25e" />
          <stop offset="100%" stopColor="#40703a" />
        </linearGradient>
        <clipPath id={clip}>
          <ellipse cx={0} cy={0} rx={rx} ry={ry} />
        </clipPath>
      </defs>

      {/* Tige coureuse (courte si port nain), vrille, feuilles découpées */}
      {app.bush ? (
        <path d="M30,30 C40,22 56,26 64,20" fill="none" stroke="#557f3f" strokeWidth={2.2} strokeLinecap="round" />
      ) : (
        <>
          <path d="M2,26 C26,14 46,30 70,20 S104,12 118,22" fill="none" stroke="#557f3f" strokeWidth={2} strokeLinecap="round" />
          <path d="M86,17 c4,-6 10,-4 8,2 c-2,5 -8,4 -6,-1" fill="none" stroke="#6c9256" strokeWidth={0.9} />
        </>
      )}
      <Leaf x={app.bush ? 36 : 26} y={app.bush ? 28 : 22} s={app.bush ? 13 : 16} rot={-28} uid={uid} />
      <Leaf x={app.bush ? 62 : 100} y={20} s={app.bush ? 12 : 15} rot={30} uid={uid} />
      {app.spotted && (
        <g opacity={0.9}>
          <circle cx={app.bush ? 36 : 25} cy={app.bush ? 22 : 14} r={1.4} fill="#f2d443" />
          <circle cx={app.bush ? 33 : 30} cy={app.bush ? 17 : 10} r={0.9} fill="#f2d443" />
        </g>
      )}
      {/* petite fleur jaune */}
      <g transform={app.bush ? 'translate(50 22)' : 'translate(62 17)'}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={Math.cos((a * Math.PI) / 180) * 2.4} cy={Math.sin((a * Math.PI) / 180) * 2.4} rx={2.2} ry={1.4} transform={`rotate(${a} ${Math.cos((a * Math.PI) / 180) * 2.4} ${Math.sin((a * Math.PI) / 180) * 2.4})`} fill="#f4d23c" />
        ))}
        <circle r={1.1} fill="#c79a14" />
      </g>

      {/* Fruit entier, couché */}
      <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
        <ellipse cx={2} cy={ry * 0.92} rx={rx * 0.9} ry={3} fill="#000" opacity={0.15} />
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={`url(#${uid}-rind)`} stroke={col.deep} strokeWidth={0.9} />
        <g clipPath={`url(#${clip})`}>
          {stripePaths.map((p, i) => (
            <path key={i} d={p} stroke={col.stripe} strokeWidth={app.rind === 'striped' ? 3.2 : 1.2} fill="none" strokeLinejoin="round" opacity={app.rind === 'light' ? 0.6 : 0.9} />
          ))}
          {app.spotted && (
            <>
              <circle cx={rx * 0.35} cy={-ry * 0.2} r={Math.min(rx, ry) * 0.32} fill="#efcd3a" opacity={0.92} />
              {Array.from({ length: 16 }, (_, i) => (
                <circle key={i} cx={(rng() - 0.5) * 1.8 * rx} cy={(rng() - 0.5) * 1.8 * ry} r={0.7 + rng() * 1.3} fill="#efcd3a" opacity={0.9} />
              ))}
            </>
          )}
          {/* tache de sol */}
          <ellipse cx={-rx * 0.1} cy={ry * 0.85} rx={rx * 0.35} ry={ry * 0.22} fill="#e8d98a" opacity={0.6} />
          <ellipse cx={-rx * 0.35} cy={-ry * 0.45} rx={rx * 0.25} ry={ry * 0.18} fill="#fff" opacity={0.18} />
        </g>
        <path d={`M${rx - 1},${-2} q5,-3 6,-8`} stroke="#6a8a44" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </g>

      {/* Quartier de chair */}
      <g transform="translate(101 100)">
        <path d="M-15,-2 A15,15 0 0 0 15,-2 Z" fill={col.deep} />
        <path d={`M-14,-2 A14,14 0 0 0 14,-2 Z`} fill={app.explosive ? flesh : '#e9f0d0'} />
        <path d={`M${app.explosive ? -13.5 : -12},-2 A${app.explosive ? 13.5 : 12},${app.explosive ? 13.5 : 12} 0 0 0 ${app.explosive ? 13.5 : 12},-2 Z`} fill={flesh} />
        {seeds.map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y - 1} rx={seedR * 0.7} ry={seedR * 1.25} transform={`rotate(${(Math.atan2(y, x) * 180) / Math.PI + 90} ${x} ${y - 1})`} fill={seedCol} stroke={app.seed === 'white' || app.seedless ? '#c9bd92' : 'none'} strokeWidth={0.3} />
        ))}
      </g>
      {app.bitter && (
        <g transform="translate(12 104)">
          <circle r={9} fill="#b8412a" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
            !
          </text>
        </g>
      )}
      {app.ploidy !== 2 && (
        <g transform={app.bitter ? 'translate(12 84)' : 'translate(12 104)'}>
          <rect x={-10} y={-7} width={20} height={14} rx={4} fill="#2e4a35" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#f3e6b8">
            {app.ploidy}x
          </text>
        </g>
      )}
    </svg>
  );
}

/** Pastille : une tranche ronde (chair entourée d’écorce). */
export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'rind' | 'flesh' | 'bitter' | 'golden'>; size?: number }) {
  const c = appearance.golden ? GOLDEN : RIND_COLORS[appearance.rind];
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 50%, ${FLESH_COLORS[appearance.flesh]} 0 52%, #e9f0d0 53% 62%, ${c.base} 63%)`,
        boxShadow: appearance.bitter ? '0 0 0 2px #b8412a' : 'inset 0 -1px 2px rgba(0,0,0,.25)',
      }}
    />
  );
}
