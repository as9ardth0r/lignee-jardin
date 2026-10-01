import { useId } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FruitAppearance, RindColor } from '../engine/courge/engine';
import type { SpeciesId } from '../engine/courge/loci';

/** Teintes de l’écorce : base, ombre, rayure/marbrure. */
export const RIND_COLORS: Record<RindColor, { base: string; deep: string; stripe: string }> = {
  darkgreen: { base: '#2f4a2a', deep: '#17261a', stripe: '#6f8f4e' },
  green: { base: '#5f8a3a', deep: '#35531f', stripe: '#c8d9a0' },
  lightgreen: { base: '#a9c47a', deep: '#6f8f46', stripe: '#e6efcf' },
  cream: { base: '#ecdfb2', deep: '#bfae78', stripe: '#6f8f4e' },
  white: { base: '#f3efe3', deep: '#c9c2ae', stripe: '#dcd6c4' },
  yellow: { base: '#f1c232', deep: '#b98a10', stripe: '#6f8f4e' },
  orange: { base: '#e8801e', deep: '#a8500c', stripe: '#3a3a22' },
  red: { base: '#d0521f', deep: '#8e2f10', stripe: '#f0a060' },
  pink: { base: '#e7a58c', deep: '#b8705a', stripe: '#f6d2c2' },
  blue: { base: '#7f95a0', deep: '#4c5f69', stripe: '#aebdc4' },
  grey: { base: '#7d8a74', deep: '#4b5646', stripe: '#aab49f' },
  tan: { base: '#d9a860', deep: '#9e7234', stripe: '#ecd09a' },
};

const FLESH: Record<FruitAppearance['flesh'], string> = { white: '#f6f1e2', cream: '#f2e3b3', yellow: '#f3cf5c', orange: '#f08a24' };

/** Contour du fruit, dressé (tige en haut), largeur de référence `w`. */
function outline(app: FruitAppearance, w: number): { d: string; h: number; stemDx: number } {
  const ratio = Math.max(0.35, Math.min(3, app.ratio));
  let h = w * ratio;
  const pts: Array<[number, number]> = [];
  const N = 60;
  const ribAmp = 0.05 * app.ribs;
  // Largeur relative (0–1) le long de l’axe, v de -1 (tige) à 1 (fleur)
  const width = (v: number): number => {
    const e = Math.sqrt(Math.max(0, 1 - v * v));
    switch (app.shape) {
      case 'disc':
        return Math.max(0, 1 - Math.abs(v) ** 3) ** 0.45;
      case 'flat':
        return Math.max(0, 1 - Math.abs(v) ** 2.4) ** 0.55;
      case 'turban':
        // couronne large en haut, petit « bouton » en bas
        return v < 0.5 ? Math.sqrt(Math.max(0, 1 - ((v + 0.25) / 0.75) ** 2)) : 0.45 * Math.sqrt(Math.max(0, 1 - ((v - 0.72) / 0.28) ** 2));
      case 'oval':
        return ratio > 1.45 ? Math.max(0, 1 - v * v) ** 0.75 : e;
      case 'pear':
        return e * (0.55 + 0.45 * ((v + 1) / 2) ** 1.1);
      case 'butternut': {
        const s = Math.min(1, Math.max(0, (v + 0.05) / 0.55));
        return e ** 0.5 * (0.42 + 0.58 * s * s * (3 - 2 * s));
      }
      case 'crookneck': {
        const s = Math.min(1, Math.max(0, (v - 0.1) / 0.6));
        return Math.max(0, 1 - Math.abs(v) ** 5) ** 0.5 * (0.38 + 0.62 * s * s * (3 - 2 * s));
      }
      case 'elongated':
        return Math.max(0, 1 - Math.abs(v) ** 6) ** 0.5 * (0.92 + 0.08 * v);
      default:
        return e;
    }
  };
  if (app.shape === 'disc') h = w * 0.5;
  if (app.shape === 'turban') h = w * 0.95;
  const long = app.shape === 'elongated' || app.shape === 'crookneck' || app.shape === 'butternut';
  let halfW = long ? w / Math.max(1.1, Math.min(ratio, 6) * 0.5) : w;
  if (long) h = Math.min(40, halfW * Math.min(ratio, 6));
  else if (h > 34) {
    // fruit haut (Hubbard, poire) : on réduit l’ensemble pour qu’il tienne
    halfW *= 34 / h;
    h = 34;
  }
  for (let i = 0; i <= N; i++) {
    const v = -1 + (2 * i) / N;
    let x = width(v) * halfW;
    if (app.shape === 'disc') x *= 1 + 0.07 * Math.cos(v * Math.PI * 7);
    pts.push([x, (v * h) / 1]);
  }
  // Côtes : on festonne légèrement la silhouette
  const right = pts.map(([x, y], i) => [x * (1 + ribAmp * Math.cos(i * 0.9)), y] as [number, number]);
  const left = [...right].reverse().map(([x, y]) => [-x, y] as [number, number]);
  const all = [...right, ...left];
  // Col de cygne : on courbe le haut du fruit
  const bent = app.shape === 'crookneck' ? all.map(([x, y]) => [x + 0.55 * h * ((1 - (y / h + 1) / 2) ** 2.2), y] as [number, number]) : all;
  const d = `M${bent.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`;
  return { d, h, stemDx: app.shape === 'crookneck' ? 0.55 * h : 0 };
}

function Leaf({ x, y, s, rot, mottled, fig, uid }: { x: number; y: number; s: number; rot: number; mottled: boolean; fig: boolean; uid: string }) {
  // Feuille palmée : 5 lobes pointus (courges) ou arrondis (courge de Siam),
  // attachée par le pétiole au point (0, 0), limbe vers le haut.
  const pts: string[] = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const th = (-0.82 + 1.64 * t) * Math.PI; // de -148° à +148° autour de « haut »
    const phase = t * 5;
    const local = phase - Math.floor(phase) - 0.5;
    const lobe = fig ? 1 - 1.4 * local * local : 1 - 1.5 * Math.abs(local);
    const r = s * (0.5 + 0.5 * lobe) * (1 - 0.35 * Math.abs(t - 0.5) ** 2);
    pts.push(`${(Math.sin(th) * r).toFixed(1)},${(-Math.cos(th) * r - s * 0.25).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0,0L${pts.join('L')}Z`} fill={`url(#${uid}-leaf)`} stroke="#2f4d24" strokeWidth={0.7} strokeLinejoin="round" />
      {[-0.56, -0.28, 0, 0.28, 0.56].map((f) => (
        <line key={f} x1={0} y1={-s * 0.25} x2={Math.sin(f * Math.PI) * s * 0.85} y2={-Math.cos(f * Math.PI) * s * 0.85 - s * 0.25} stroke="#2f4d24" strokeWidth={0.6} opacity={0.55} />
      ))}
      {mottled &&
        [-0.4, -0.14, 0.14, 0.4].map((f) => {
          const cx = Math.sin(f * Math.PI) * s * 0.42;
          const cy = -Math.cos(f * Math.PI) * s * 0.42 - s * 0.25;
          return <ellipse key={f} cx={cx} cy={cy} rx={s * 0.1} ry={s * 0.045} transform={`rotate(${f * 180} ${cx} ${cy})`} fill="#e4ece6" opacity={0.8} />;
        })}
    </g>
  );
}

export function SquashPortrait({
  seed,
  appearance: app,
  weightUnit,
  species,
  size = 120,
}: {
  seed: string;
  appearance: FruitAppearance;
  /** Poids sur l’échelle 0–1 (taille relative du fruit). */
  weightUnit: number;
  species: SpeciesId;
  size?: number;
}) {
  const rawId = useId();
  const rng = mulberry32(hashSeed(seed));
  // ids SVG uniques et sûrs (dégradés, masque) : useId + graine du plant
  const uid = `sq${rawId.replace(/[^a-zA-Z0-9]/g, '')}${hashSeed(seed + rawId).toString(36)}`;
  const col = RIND_COLORS[app.rind];
  const w = 18 + weightUnit * 18;
  const { d, h, stemDx } = outline(app, w);
  const long = app.shape === 'elongated' || app.shape === 'crookneck' || app.shape === 'butternut';
  const rot = long ? -58 + (rng() - 0.5) * 8 : (rng() - 0.5) * 6;
  const cx = long ? 56 : 62;
  const cy = long ? 70 : 72;
  const topY = -h;
  const ribLines = app.shape === 'disc' ? 0 : Math.round(4 + app.ribs * 8);
  const stripes = app.striped ? (long ? 6 : 9) : 0;
  const warts = app.warty ? 34 : 0;
  const clip = `${uid}-clip`;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-rind`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={col.base} stopOpacity={1} />
          <stop offset="70%" stopColor={col.base} />
          <stop offset="100%" stopColor={col.deep} />
        </radialGradient>
        <linearGradient id={`${uid}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6c9256" />
          <stop offset="100%" stopColor="#3f6b3a" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>

      {/* Tige coureuse ou buissonnante, feuilles */}
      {app.bush === 'vine' ? (
        <path d="M4,26 C30,14 46,30 70,20 S104,12 116,22" fill="none" stroke="#4f7a3c" strokeWidth={2.4} strokeLinecap="round" />
      ) : (
        <path d="M60,8 C58,16 60,22 62,30" fill="none" stroke="#4f7a3c" strokeWidth={3} strokeLinecap="round" />
      )}
      <path d="M92,18 c4,-6 10,-4 8,2 c-2,5 -8,4 -6,-1" fill="none" stroke="#6c9256" strokeWidth={0.9} />
      <Leaf x={app.bush === 'vine' ? 30 : 46} y={app.bush === 'vine' ? 22 : 30} s={app.bush === 'bush' ? 24 : 20} rot={-30} mottled={app.mottledLeaves} fig={species === 'ficifolia'} uid={uid} />
      <Leaf x={app.bush === 'vine' ? 94 : 78} y={app.bush === 'vine' ? 18 : 30} s={app.bush === 'bush' ? 24 : 18} rot={34} mottled={app.mottledLeaves} fig={species === 'ficifolia'} uid={uid} />

      <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
        {/* Pédoncule : épais et côtelé (pepo, moschata), rond et liégeux (maxima) */}
        <path
          transform={`translate(${stemDx} 0)`}
          d={`M-3,${topY + 2} L-2.4,${topY - 7} Q0,${topY - 10} 2.6,${topY - 7} L3,${topY + 2} Z`}
          fill={species === 'maxima' ? '#b89a6a' : '#5d7f48'}
          stroke="#3c4f2c"
          strokeWidth={0.6}
        />
        <path d={d} fill={`url(#${uid}-rind)`} stroke={col.deep} strokeWidth={0.9} />
        <g clipPath={`url(#${clip})`}>
          {Array.from({ length: stripes }, (_, i) => {
            const x = -w + ((i + 0.5) / stripes) * 2 * w;
            return <path key={`s${i}`} d={`M${x},${-h * 1.1} Q${x * 1.25},0 ${x},${h * 1.1}`} stroke={col.stripe} strokeWidth={long ? 2.6 : 2.2} fill="none" opacity={0.85} />;
          })}
          {Array.from({ length: ribLines }, (_, i) => {
            const x = -w + ((i + 0.5) / ribLines) * 2 * w;
            return <path key={`r${i}`} d={`M${x * 0.2},${-h} Q${x * 1.15},0 ${x * 0.2},${h}`} stroke={col.deep} strokeWidth={0.8} fill="none" opacity={0.25 + app.ribs * 0.4} />;
          })}
          {Array.from({ length: warts }, (_, i) => (
            <circle key={`w${i}`} cx={(rng() - 0.5) * 2 * w} cy={(rng() - 0.5) * 2 * h} r={1.2 + rng() * 1.8} fill={app.rind === 'pink' ? '#a87a52' : col.deep} stroke={app.rind === 'pink' ? '#7d5634' : 'none'} strokeWidth={0.4} opacity={0.85} />
          ))}
          {app.shape === 'turban' && <ellipse cx={0} cy={h * 0.62} rx={w * 0.5} ry={h * 0.3} fill={RIND_COLORS.cream.base} opacity={0.35} />}
          <ellipse cx={-w * 0.35} cy={-h * 0.4} rx={w * 0.22} ry={h * 0.16} fill="#fff" opacity={0.18} />
        </g>
      </g>

      {/* Coupe de chair + graines, en médaillon */}
      <g transform="translate(104 100)">
        <circle r={11} fill={FLESH[app.flesh]} stroke="#6b6455" strokeWidth={0.6} />
        <circle r={4.5} fill={app.flesh === 'orange' ? '#f4b163' : '#efe2b6'} />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx={Math.cos((a * Math.PI) / 180) * 3}
            cy={Math.sin((a * Math.PI) / 180) * 3}
            rx={1.7}
            ry={0.9}
            transform={`rotate(${a} ${Math.cos((a * Math.PI) / 180) * 3} ${Math.sin((a * Math.PI) / 180) * 3})`}
            fill={app.blackSeeds ? '#222' : app.hullless ? '#3f6b3a' : '#f6ecd0'}
            stroke="#8a7a50"
            strokeWidth={0.3}
          />
        ))}
      </g>
      {app.bitter && (
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

export function FruitDot({ appearance, size = 14 }: { appearance: FruitAppearance; size?: number }) {
  const c = RIND_COLORS[appearance.rind];
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: appearance.striped
          ? `repeating-linear-gradient(90deg, ${c.base} 0 3px, ${c.stripe} 3px 5px)`
          : `radial-gradient(circle at 35% 30%, ${c.base}, ${c.deep})`,
        boxShadow: appearance.bitter ? '0 0 0 2px #b8412a' : 'inset 0 -1px 2px rgba(0,0,0,.25)',
      }}
    />
  );
}
