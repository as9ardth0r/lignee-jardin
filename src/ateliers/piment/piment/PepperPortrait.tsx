import { useId } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FruitAppearance, HeatClass, RipeColor, UnripeColor } from '../engine/piment/engine';

/** Teintes du fruit mûr : base, ombre, reflet. */
export const RIPE_COLORS: Record<RipeColor, { base: string; deep: string; light: string }> = {
  red: { base: '#d42a1c', deep: '#8a130b', light: '#f0705e' },
  lightred: { base: '#e5553f', deep: '#a52d1d', light: '#f79a86' },
  orange: { base: '#f07d18', deep: '#a84d06', light: '#f8b060' },
  paleorange: { base: '#f5a55a', deep: '#bb6f2a', light: '#fbd0a0' },
  yellow: { base: '#f5c518', deep: '#b58a06', light: '#fbe27a' },
  lemon: { base: '#f3e35a', deep: '#b8a820', light: '#fbf3a8' },
  cream: { base: '#f2e2a8', deep: '#bca96c', light: '#fbf4d8' },
  white: { base: '#f4f0e0', deep: '#c4bda4', light: '#ffffff' },
  brown: { base: '#6b3322', deep: '#3c1a10', light: '#9a5a44' },
  green: { base: '#5d7a2e', deep: '#34481a', light: '#93ad5c' },
};

export const UNRIPE_COLORS: Record<UnripeColor, { base: string; deep: string; light: string }> = {
  green: { base: '#4f8a2e', deep: '#2a5518', light: '#8cc063' },
  purple: { base: '#3e1f4d', deep: '#1c0c24', light: '#7a4b8e' },
  ivory: { base: '#efe7bd', deep: '#b8ad7a', light: '#fffbe6' },
};

const FLOWER: Record<FruitAppearance['flower'], { petal: string; spot?: string }> = {
  white: { petal: '#fbfaf2' },
  greenish: { petal: '#e9efd2' },
  spotted: { petal: '#fbf6e2', spot: '#b7b04a' },
  purple: { petal: '#8a5aa8' },
};

const HEAT_LEVEL: Record<HeatClass, number> = { sweet: 0, mild: 1, medium: 2, hot: 3, veryhot: 4, extreme: 5 };

/** Contour d’un fruit pendant (pédoncule en haut, pointe en bas). */
function fruitPath(app: Pick<FruitAppearance, 'shape' | 'wrinkled'>, w: number, h: number, rng: () => number): string {
  const N = 48;
  const right: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N; // 0 = épaule, 1 = pointe
    let x: number;
    switch (app.shape) {
      case 'bell':
        x = (0.86 + 0.14 * Math.sin(Math.PI * Math.min(1, t * 1.6))) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, t - 0.55) / 0.45, 3))) * (t < 0.08 ? 0.7 + 3.7 * t : 1);
        break;
      case 'flat':
        x = Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2))) * (1 + 0.08 * Math.cos(t * Math.PI * 6));
        break;
      case 'round':
        x = Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2)));
        break;
      case 'lamuyo':
        x = (t < 0.1 ? 0.75 + 2.5 * t : 1) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, t - 0.7) / 0.3, 2.5)));
        break;
      case 'cone':
        x = (t < 0.12 ? 0.8 + 1.6 * t : 1) * Math.pow(1 - t, 0.85);
        break;
      default:
        // long, thin : fuseau étroit
        x = (t < 0.08 ? 0.85 + 1.8 * t : 1) * Math.pow(1 - t, 0.7);
    }
    if (app.wrinkled) x *= 1 + 0.06 * Math.sin(t * 22 + rng() * 0.5);
    right.push([x * w, t * h]);
  }
  // Pour les formes longues, légère courbure (cayenne)
  const curve = app.shape === 'thin' ? 0.35 : app.shape === 'long' ? 0.18 : 0;
  const bend = ([x, y]: [number, number]): [number, number] => [x + curve * w * 3 * Math.pow(y / h, 2), y];
  const left = [...right].reverse().map(([x, y]) => [-x, y] as [number, number]);
  const pts = [...right, ...left].map(bend);
  return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
}

function fruitSize(app: Pick<FruitAppearance, 'shape'>, weightUnit: number) {
  const s = 0.35 + 0.65 * weightUnit;
  switch (app.shape) {
    case 'bell':
      return { w: 16 * s + 4, h: 34 * s + 8 };
    case 'flat':
      return { w: 17 * s + 4, h: 20 * s + 6 };
    case 'round':
      return { w: 11 * s + 4, h: 22 * s + 8 };
    case 'lamuyo':
      return { w: 13 * s + 4, h: 44 * s + 10 };
    case 'cone':
      return { w: 9 * s + 3, h: 40 * s + 12 };
    case 'long':
      return { w: 6 * s + 3, h: 50 * s + 16 };
    default:
      return { w: 4 * s + 2, h: 56 * s + 18 };
  }
}

function Leaf({ x, y, s, rot, uid }: { x: number; y: number; s: number; rot: number; uid: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0,0 C${s * 0.45},${-s * 0.25} ${s * 0.45},${-s * 0.8} 0,${-s * 1.25} C${-s * 0.45},${-s * 0.8} ${-s * 0.45},${-s * 0.25} 0,0 Z`} fill={`url(#${uid}-leaf)`} stroke="#2f5a24" strokeWidth={0.6} />
      <path d={`M0,0 L0,${-s * 1.15}`} stroke="#2f5a24" strokeWidth={0.5} opacity={0.6} />
    </g>
  );
}

function Fruit({ app, color, w, h, uid, id, rng, erect }: { app: FruitAppearance; color: { base: string; deep: string; light: string }; w: number; h: number; uid: string; id: string; rng: () => number; erect: boolean }) {
  const d = fruitPath(app, w, h, rng);
  return (
    <g transform={erect ? 'scale(1 -1)' : undefined}>
      <defs>
        <linearGradient id={`${uid}-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color.deep} />
          <stop offset="35%" stopColor={color.base} />
          <stop offset="70%" stopColor={color.base} />
          <stop offset="100%" stopColor={color.deep} />
        </linearGradient>
      </defs>
      {/* calice et pédoncule */}
      <path d={`M-1.2,${-9} Q0,${-4} -0.5,0 L1.5,0 Q1.5,${-5} 1.6,${-9} Z`} fill="#4c7a2c" />
      <path d={d} fill={`url(#${uid}-${id})`} stroke={color.deep} strokeWidth={0.7} />
      {(app.shape === 'bell' || app.shape === 'lamuyo') && (
        <path d={`M${-w * 0.25},${h * 0.1} Q${-w * 0.3},${h * 0.55} ${-w * 0.2},${h * 0.9} M${w * 0.25},${h * 0.1} Q${w * 0.3},${h * 0.55} ${w * 0.2},${h * 0.9}`} fill="none" stroke={color.deep} strokeWidth={0.8} opacity={0.5} />
      )}
      <ellipse cx={-w * 0.4} cy={h * 0.3} rx={Math.max(0.8, w * 0.14)} ry={h * 0.18} fill={color.light} opacity={0.55} />
      <path d={`M-${w * 0.9},0.5 Q0,-2.5 ${w * 0.9},0.5`} fill="#4c7a2c" stroke="#2f5a24" strokeWidth={0.5} />
    </g>
  );
}

export function PepperPortrait({ seed, appearance: app, weightUnit, size = 120 }: { seed: string; appearance: FruitAppearance; weightUnit: number; size?: number }) {
  const rawId = useId();
  const rng = mulberry32(hashSeed(seed));
  const uid = `pp${rawId.replace(/[^a-zA-Z0-9]/g, '')}${hashSeed(seed + rawId).toString(36)}`;
  const { w, h } = fruitSize(app, weightUnit);
  const ripe = RIPE_COLORS[app.ripe];
  const unripe = UNRIPE_COLORS[app.unripe];
  const fl = FLOWER[app.flower];
  const scale = Math.min(1, 86 / (h + 12));
  const erect = app.erect;
  // Point d’attache : en haut pour un fruit pendant, en bas pour un fruit dressé
  const ay = erect ? 100 : 26;
  const heat = HEAT_LEVEL[app.heat];
  const cluster = app.clustered ? 3 : 1;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6fa04e" />
          <stop offset="100%" stopColor="#3b6e2c" />
        </linearGradient>
      </defs>

      {/* Tige ramifiée et feuilles */}
      <path d={erect ? 'M60,118 L60,98 M60,104 C48,96 40,92 30,90 M60,102 C74,94 84,92 94,90' : 'M60,4 L60,26 M60,14 C48,12 40,14 28,20 M60,12 C74,10 84,12 96,18'} fill="none" stroke="#4c7a2c" strokeWidth={2} strokeLinecap="round" />
      {erect ? (
        <>
          <Leaf x={30} y={90} s={16} rot={-70} uid={uid} />
          <Leaf x={94} y={90} s={16} rot={70} uid={uid} />
          <Leaf x={60} y={112} s={12} rot={200} uid={uid} />
        </>
      ) : (
        <>
          <Leaf x={28} y={20} s={17} rot={-110} uid={uid} />
          <Leaf x={96} y={18} s={17} rot={110} uid={uid} />
          <Leaf x={48} y={12} s={12} rot={-30} uid={uid} />
        </>
      )}

      {/* Fleur (couleur selon l’espèce et le gène A) */}
      <g transform={erect ? 'translate(92 104)' : 'translate(92 30)'}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={Math.cos((a * Math.PI) / 180) * 3.2} cy={Math.sin((a * Math.PI) / 180) * 3.2} rx={3} ry={1.7} transform={`rotate(${a} ${Math.cos((a * Math.PI) / 180) * 3.2} ${Math.sin((a * Math.PI) / 180) * 3.2})`} fill={fl.petal} stroke="#9a9a80" strokeWidth={0.3} />
        ))}
        {fl.spot && [36, 108, 180, 252, 324].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 2.4} cy={Math.sin((a * Math.PI) / 180) * 2.4} r={0.7} fill={fl.spot} />)}
        <circle r={1.3} fill={app.maleSterile ? '#bdb6a0' : '#6a79c8'} />
      </g>

      {/* Fruits : un mûr (et ses voisins en bouquet), un encore immature */}
      <g transform={`translate(60 ${ay}) scale(${scale})`}>
        {Array.from({ length: cluster }, (_, i) => {
          const dx = cluster === 1 ? 0 : (i - 1) * (w * 1.5 + 3);
          const tilt = cluster === 1 ? (rng() - 0.5) * 8 : (i - 1) * 14;
          return (
            <g key={i} transform={`translate(${dx} 0) rotate(${tilt})`}>
              <Fruit app={app} color={ripe} w={w} h={h} uid={uid} id={`r${i}`} rng={rng} erect={erect} />
            </g>
          );
        })}
      </g>
      <g transform={`translate(${erect ? 22 : 20} ${erect ? 96 : 34}) scale(${scale * 0.55})`}>
        <Fruit app={app} color={unripe} w={w} h={h} uid={uid} id="u" rng={rng} erect={erect} />
      </g>

      {/* Piquant : de 0 à 5 flammes */}
      <g transform="translate(104 8)">
        {Array.from({ length: heat }, (_, i) => (
          <path key={i} transform={`translate(0 ${i * 8})`} d="M0,6 C-3,4 -2,1 0,-1 C0.5,1.5 2,2 2.5,0.5 C4,3 3,5.5 0,6 Z" fill={heat >= 5 ? '#8a0f0f' : '#d93a1c'} />
        ))}
      </g>
      {app.blackSeeds && <circle cx={10} cy={112} r={2.5} fill="#1a1a1a" />}
      {app.deciduous && (
        <g transform="translate(12 104)">
          <circle r={7} fill="#6b8a3a" />
          <text x={0} y={3} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
            S
          </text>
        </g>
      )}
    </svg>
  );
}

export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'ripe' | 'unripe' | 'heat'>; size?: number }) {
  const c = RIPE_COLORS[appearance.ripe];
  const u = UNRIPE_COLORS[appearance.unripe];
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c.light} 0%, ${c.base} 55%, ${c.deep} 100%)`,
        boxShadow: appearance.unripe !== 'green' ? `0 0 0 2px ${u.base}` : 'inset 0 -1px 2px rgba(0,0,0,.25)',
      }}
    />
  );
}
