import type { ReactElement } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { CurdColor, FruitAppearance, Morphotype } from '../engine/chou/engine';

/** Couleurs du caillé (chou-fleur, romanesco). */
export const CURD_COLORS: Record<CurdColor, { base: string; deep: string }> = {
  white: { base: '#f4efdc', deep: '#d2c8a6' },
  orange: { base: '#f2a64a', deep: '#c47a24' },
  green: { base: '#b9d47a', deep: '#86a64a' },
  purple: { base: '#7a3a8a', deep: '#4a1f56' },
};

/** Couleur « vue de loin » d’un morphotype (pastilles). */
export function fruitColor(app: Pick<FruitAppearance, 'morphotype' | 'purple' | 'curd' | 'glossy'>): string {
  if (app.morphotype === 'cauliflower' || app.morphotype === 'romanesco') return CURD_COLORS[app.curd].base;
  if (app.purple) return '#7a3a7e';
  if (app.morphotype === 'turnip') return '#efe6d2';
  if (app.morphotype === 'radish') return '#e05a6a';
  if (app.morphotype === 'broccoli') return '#3f6e3a';
  return app.glossy ? '#5f9a46' : '#8aa89a';
}

function leafColor(app: FruitAppearance): { fill: string; vein: string } {
  if (app.purple) return { fill: '#6e3d78', vein: '#a77ab0' };
  return app.glossy ? { fill: '#5f9a46', vein: '#b9d48a' } : { fill: '#7fa392', vein: '#cfe0d6' };
}

/** Feuille de chou : limbe large, nervure claire ; bord frisé ou surface cloquée en option. */
function Leaf({ x, y, len, wid, rot, app }: { x: number; y: number; len: number; wid: number; rot: number; app: FruitAppearance }) {
  const c = leafColor(app);
  const pts: string[] = [];
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = Math.sin(Math.PI * Math.min(1, t * 1.05)) * wid * (app.curly ? 1 + 0.18 * Math.sin(t * 60) : 1);
    pts.push(`${(-w).toFixed(1)},${(-t * len).toFixed(1)}`);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    const w = Math.sin(Math.PI * Math.min(1, t * 1.05)) * wid * (app.curly ? 1 + 0.18 * Math.sin(t * 60 + 1) : 1);
    pts.push(`${w.toFixed(1)},${(-t * len).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M${pts.join('L')}Z`} fill={c.fill} stroke="#2e4a2a" strokeWidth={0.5} strokeLinejoin="round" />
      <path d={`M0,0 L0,${-len * 0.9}`} stroke={c.vein} strokeWidth={1.1} />
      {app.savoy &&
        Array.from({ length: 8 }, (_, i) => (
          <circle key={i} cx={(i % 2 ? 1 : -1) * wid * 0.35} cy={-len * (0.2 + i * 0.08)} r={1.3} fill="none" stroke={c.vein} strokeWidth={0.5} opacity={0.8} />
        ))}
    </g>
  );
}

/** Caillé ou tête de brocoli : grappe de petits bouquets. */
function Curd({ cx, cy, r, color, deep, rng, floret = 0.18 }: { cx: number; cy: number; r: number; color: string; deep: string; rng: () => number; floret?: number }) {
  const dots: ReactElement[] = [];
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * r * 0.8;
    dots.push(<circle key={i} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d * 0.75} r={r * floret} fill={color} stroke={deep} strokeWidth={0.5} />);
  }
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.78} fill={color} stroke={deep} strokeWidth={0.8} />
      {dots}
    </g>
  );
}

/** Romanesco : pyramides en spirale. */
function Romanesco({ cx, cy, r, color, deep }: { cx: number; cy: number; r: number; color: string; deep: string }) {
  const cones: ReactElement[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 1; i < 34; i++) {
    const a = i * golden;
    const d = Math.sqrt(i / 34) * r * 0.85;
    const s = 2.2 + (1 - i / 34) * 3.2;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.7;
    cones.push(<path key={i} d={`M${x - s},${y + s * 0.6} L${x},${y - s} L${x + s},${y + s * 0.6} Z`} fill={color} stroke={deep} strokeWidth={0.5} />);
  }
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.72} fill={deep} />
      {cones.reverse()}
      <path d={`M${cx - 5},${cy - r * 0.55} L${cx},${cy - r * 0.95} L${cx + 5},${cy - r * 0.55} Z`} fill={color} stroke={deep} strokeWidth={0.6} />
    </g>
  );
}

function Body({ m, app, size, rng }: { m: Morphotype; app: FruitAppearance; size: number; rng: () => number }) {
  const lc = leafColor(app);
  const wrappers = (n: number, len: number, wid: number, y = 96) =>
    Array.from({ length: n }, (_, i) => {
      const rot = -75 + (150 * i) / (n - 1);
      return <Leaf key={i} x={60} y={y} len={len} wid={wid} rot={rot} app={app} />;
    });
  switch (m) {
    case 'cabbage': {
      const r = 18 + size * 14;
      return (
        <>
          {wrappers(7, 40, 13)}
          <circle cx={60} cy={84 - r * 0.3} r={r} fill={lc.fill} stroke="#2e4a2a" strokeWidth={0.8} />
          <path d={`M${60 - r * 0.7},${84 - r * 0.6} Q60,${84 - r * 1.25} ${60 + r * 0.7},${84 - r * 0.6}`} fill="none" stroke={lc.vein} strokeWidth={1.2} />
          <path d={`M${60 - r * 0.9},${84 - r * 0.1} Q60,${84 - r * 0.9} ${60 + r * 0.9},${84 - r * 0.1}`} fill="none" stroke={lc.vein} strokeWidth={1} opacity={0.8} />
          {app.savoy &&
            Array.from({ length: 22 }, (_, i) => <circle key={i} cx={60 + (rng() - 0.5) * r * 1.6} cy={84 - r * 0.3 + (rng() - 0.5) * r * 1.6} r={1.4} fill="none" stroke={lc.vein} strokeWidth={0.5} />)}
          <ellipse cx={52} cy={84 - r * 0.8} rx={r * 0.25} ry={r * 0.15} fill="#fff" opacity={0.18} />
        </>
      );
    }
    case 'looseHead':
      return (
        <>
          {wrappers(8, 42, 13)}
          {wrappers(5, 28, 11, 92)}
        </>
      );
    case 'kale':
      return (
        <>
          <path d="M60,112 L60,40" stroke="#5a7a4a" strokeWidth={4} strokeLinecap="round" />
          {[96, 84, 72, 60, 48, 38].map((y, i) => (
            <Leaf key={i} x={60} y={y} len={34 - i * 2} wid={app.curly ? 9 : 11} rot={i % 2 ? 55 : -55} app={app} />
          ))}
          <Leaf x={60} y={40} len={26} wid={9} rot={0} app={app} />
        </>
      );
    case 'cauliflower':
    case 'romanesco': {
      const cc = CURD_COLORS[app.curd];
      const r = 14 + size * 12;
      return (
        <>
          {wrappers(7, 42, 12)}
          {m === 'romanesco' ? <Romanesco cx={60} cy={76} r={r} color={cc.base} deep={cc.deep} /> : <Curd cx={60} cy={78} r={r} color={cc.base} deep={cc.deep} rng={rng} />}
          <Leaf x={60} y={96} len={30} wid={10} rot={-30} app={app} />
          <Leaf x={60} y={96} len={30} wid={10} rot={30} app={app} />
        </>
      );
    }
    case 'broccoli': {
      const head = app.purple ? { base: '#6a3a7a', deep: '#3e1f4a' } : { base: '#3f6e3a', deep: '#284a26' };
      const r = 12 + size * 10;
      return (
        <>
          <path d="M60,112 L60,74" stroke="#7aa05a" strokeWidth={7} strokeLinecap="round" />
          {wrappers(6, 40, 11)}
          <Curd cx={60} cy={66} r={r} color={head.base} deep={head.deep} rng={rng} floret={0.13} />
        </>
      );
    }
    case 'sprouts':
      return (
        <>
          <path d="M60,114 L60,30" stroke="#7aa05a" strokeWidth={6} strokeLinecap="round" />
          {Array.from({ length: 9 }, (_, i) => {
            const y = 104 - i * 8;
            return (
              <g key={i}>
                <circle cx={60 + (i % 2 ? 6 : -6)} cy={y} r={4.2} fill={lc.fill} stroke="#2e4a2a" strokeWidth={0.6} />
                <path d={`M${60 + (i % 2 ? 4 : -4)},${y - 1} q${i % 2 ? 2 : -2},-2 ${i % 2 ? 4 : -4},-1`} stroke={lc.vein} strokeWidth={0.6} fill="none" />
              </g>
            );
          })}
          <Leaf x={60} y={32} len={24} wid={9} rot={-40} app={app} />
          <Leaf x={60} y={32} len={24} wid={9} rot={40} app={app} />
          <Leaf x={60} y={32} len={20} wid={8} rot={0} app={app} />
        </>
      );
    case 'kohlrabi': {
      const r = 12 + size * 10;
      const ball = app.purple ? { base: '#7a4a8a', deep: '#4a2756' } : { base: '#bcd49a', deep: '#86a466' };
      return (
        <>
          <circle cx={60} cy={96 - r} r={r} fill={ball.base} stroke={ball.deep} strokeWidth={0.9} />
          {[-50, -20, 15, 45].map((a, i) => (
            <g key={i}>
              <path d={`M${60 + Math.sin((a * Math.PI) / 180) * r * 0.7},${96 - r - Math.cos((a * Math.PI) / 180) * r * 0.7} l${a * 0.35},${-20}`} stroke={ball.deep} strokeWidth={1.4} />
              <Leaf x={60 + Math.sin((a * Math.PI) / 180) * r * 0.7 + a * 0.35} y={96 - r - Math.cos((a * Math.PI) / 180) * r * 0.7 - 20} len={20} wid={8} rot={a} app={app} />
            </g>
          ))}
          <path d="M56,96 l-3,10 M64,96 l3,10" stroke="#8a7a5a" strokeWidth={1} />
        </>
      );
    }
    case 'turnip':
    case 'radish': {
      const long = m === 'radish' && size > 0.45;
      const color = m === 'radish' ? (app.purple ? '#7a3a8a' : size < 0.3 ? '#d84a5c' : '#f2efe6') : '#f2ecdc';
      const top = app.purple ? '#8a4a9a' : m === 'radish' && size < 0.3 ? '#d84a5c' : '#c8d4a8';
      const r = 9 + size * 9;
      return (
        <>
          {[-40, -15, 15, 40].map((a, i) => (
            <Leaf key={i} x={60} y={78} len={34} wid={9} rot={a} app={{ ...app, purple: false, curly: false }} />
          ))}
          {long ? (
            <path d={`M${60 - r * 0.55},80 L${60 + r * 0.55},80 L60,${80 + r * 3.2} Z`} fill={color} stroke="#b8ad90" strokeWidth={0.7} />
          ) : (
            <>
              <ellipse cx={60} cy={82 + r * 0.6} rx={r} ry={r * 0.9} fill={color} stroke="#b8ad90" strokeWidth={0.7} />
              <path d={`M${60 - r},${82 + r * 0.4} A${r},${r * 0.9} 0 0 1 ${60 + r},${82 + r * 0.4} Z`} fill={top} opacity={0.9} />
              <path d={`M60,${82 + r * 1.5} q2,6 0,12`} stroke="#b8ad90" strokeWidth={0.9} fill="none" />
            </>
          )}
          <path d="M14,84 L106,84" stroke="#8a7a5a" strokeWidth={0.8} opacity={0.6} />
        </>
      );
    }
    default:
      return (
        <>
          {wrappers(7, 34, 10)}
          <path d="M60,96 L60,24" stroke="#6a8a4a" strokeWidth={2} />
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={60 + (i % 2 ? 4 : -4)} cy={26 + i * 3.4} r={2.2} fill="#f2d23c" />
          ))}
        </>
      );
  }
}

export function CabbagePortrait({
  seed,
  appearance: app,
  weightUnit,
  size = 120,
}: {
  seed: string;
  appearance: FruitAppearance;
  /** Poids sur l’échelle 0–1 (taille relative de l’organe). */
  weightUnit: number;
  size?: number;
}) {
  const rng = mulberry32(hashSeed(seed));
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <ellipse cx={60} cy={112} rx={42} ry={4} fill="#000" opacity={0.12} />
      <Body m={app.morphotype} app={app} size={Math.max(0, Math.min(1, weightUnit))} rng={rng} />
      {app.genome !== 'CC' && (
        <g transform="translate(104 12)">
          <rect x={-14} y={-7} width={28} height={14} rx={4} fill="#2e4a35" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#f3e6b8">
            {app.genome}
          </text>
        </g>
      )}
      {app.maleSterile && (
        <g transform="translate(16 12)">
          <rect x={-12} y={-7} width={24} height={14} rx={4} fill="#6b4a6e" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
            Ogu
          </text>
        </g>
      )}
    </svg>
  );
}

/** Pastille : couleur dominante du légume. */
export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'morphotype' | 'purple' | 'curd' | 'glossy'>; size?: number }) {
  const c = fruitColor(appearance);
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: `radial-gradient(circle at 35% 30%, #ffffff55, ${c} 50%, ${c})`, boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25)' }}
    />
  );
}
