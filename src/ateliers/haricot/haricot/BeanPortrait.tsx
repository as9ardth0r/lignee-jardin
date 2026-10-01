import { useId } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import type { FruitAppearance, PodColor, SeedColor } from '../engine/haricot/engine';

/** Teintes de la graine : base, ombre, motif (marbrure, œil). */
export const SEED_COLORS: Record<SeedColor, { base: string; deep: string; light: string }> = {
  white: { base: '#f4f0e2', deep: '#cfc6ad', light: '#ffffff' },
  black: { base: '#22201f', deep: '#0c0b0b', light: '#5a5550' },
  violet: { base: '#5d3a63', deep: '#33203a', light: '#8e6a95' },
  red: { base: '#8e2a24', deep: '#5a1612', light: '#c0574e' },
  brown: { base: '#7a4f2c', deep: '#4c2f18', light: '#a87d55' },
  olive: { base: '#7c7a44', deep: '#4f4d26', light: '#a8a670' },
  yellow: { base: '#d9b44a', deep: '#a3842c', light: '#ecd58c' },
  buff: { base: '#cfb48a', deep: '#9e8660', light: '#e6d6b6' },
};

/** Fond clair des graines marbrées ou à œil. */
const PALE = '#efe6cf';

const POD: Record<PodColor, { base: string; deep: string }> = {
  green: { base: '#5f9a3a', deep: '#3a6a22' },
  yellow: { base: '#e8cf4a', deep: '#b39a20' },
  purple: { base: '#5a2e6e', deep: '#331a42' },
};

const FLOWER: Record<FruitAppearance['flower'], { a: string; b: string }> = {
  white: { a: '#fbfaf2', b: '#e8e6d8' },
  purple: { a: '#9a5cc0', b: '#c79be0' },
  lilac: { a: '#c6a7e0', b: '#e4d4f2' },
  scarlet: { a: '#e0301c', b: '#f05a40' },
  bicolor: { a: '#e0301c', b: '#fbf6ea' },
  greenish: { a: '#e9efd2', b: '#f6f8ea' },
};

/** Graine vue de côté, en forme de rognon (ou plate et large pour le Lima). */
function Seed({ x, y, s, rot, app, uid, id }: { x: number; y: number; s: number; rot: number; app: FruitAppearance; uid: string; id: string }) {
  const col = SEED_COLORS[app.seed];
  const lima = app.species === 'lunatus';
  const w = lima ? 1.25 : 1;
  const d = `M ${-9 * w},0 C ${-9 * w},-6 ${-4 * w},-7.5 0,-6.5 C ${4 * w},-7.5 ${9 * w},-6 ${9 * w},0 C ${9 * w},6 ${4 * w},7.5 ${1.5 * w},5 C ${0.5 * w},3.8 ${-0.5 * w},3.8 ${-1.5 * w},5 C ${-4 * w},7.5 ${-9 * w},6 ${-9 * w},0 Z`;
  const clip = `${uid}-${id}`;
  const bg = app.pattern === 'plain' ? col.base : PALE;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={bg} stroke={app.pattern === 'plain' ? col.deep : '#b8ab88'} strokeWidth={0.6} />
      <g clipPath={`url(#${clip})`}>
        {app.pattern === 'marbled' &&
          [
            [-6, -3, 3.5, 1.8, 20],
            [-1, 1, 4, 1.6, -15],
            [5, -2, 3, 2, 40],
            [3, 4, 3.2, 1.4, 10],
            [-5, 3, 2.4, 1.2, -30],
          ].map(([cx, cy, rx, ry, r], i) => <ellipse key={i} cx={cx * w} cy={cy} rx={rx} ry={ry} transform={`rotate(${r} ${cx * w} ${cy})`} fill={col.base} opacity={0.9} />)}
        {app.pattern === 'eye' && <ellipse cx={0} cy={2} rx={6 * w} ry={6} fill={col.base} />}
        <ellipse cx={-3 * w} cy={-3} rx={3 * w} ry={1.4} fill="#fff" opacity={0.25} />
      </g>
      {/* hile */}
      <ellipse cx={0} cy={4.2} rx={1.8} ry={0.7} fill="#f8f2df" stroke="#6b5f45" strokeWidth={0.3} />
    </g>
  );
}

function Trifoliate({ x, y, s, rot }: { x: number; y: number; s: number; rot: number }) {
  const leaf = (r: number, k: number) => (
    <path
      key={r}
      transform={`rotate(${r}) scale(${k})`}
      d="M0,0 C6,-4 7,-14 0,-20 C-7,-14 -6,-4 0,0 Z"
      fill="#5f9a3a"
      stroke="#3a6a22"
      strokeWidth={0.6}
    />
  );
  return <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>{[leaf(-70, 0.85), leaf(70, 0.85), leaf(0, 1)]}</g>;
}

export function BeanPortrait({ seed, appearance: app, weightUnit, size = 120 }: { seed: string; appearance: FruitAppearance; weightUnit: number; size?: number }) {
  const rawId = useId();
  const rng = mulberry32(hashSeed(seed));
  const uid = `bn${rawId.replace(/[^a-zA-Z0-9]/g, '')}${hashSeed(seed + rawId).toString(36)}`;
  const pod = POD[app.pod];
  const fl = FLOWER[app.flower];
  const podLen = 34 + weightUnit * 30;
  const seedScale = 0.7 + weightUnit * 0.6;

  // Gousse pendante légèrement courbée, avec les bosses des graines
  const podPath = (len: number) => {
    const N = 30;
    const pts: string[] = [];
    const back: string[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = 6 * Math.sin(t * 1.6) * t;
      const yy = t * len;
      const bump = 1 + 0.12 * Math.cos(t * Math.PI * 10);
      const w = (t < 0.06 ? t / 0.06 : t > 0.9 ? (1 - t) / 0.1 : 1) * 3.4 * bump;
      pts.push(`${(x + w).toFixed(1)},${yy.toFixed(1)}`);
      back.push(`${(x - w).toFixed(1)},${yy.toFixed(1)}`);
    }
    return `M${pts.join('L')}L${back.reverse().join('L')}Z`;
  };

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      {/* Tige : grimpante (sur une rame) ou naine */}
      {app.bush ? (
        <path d="M44,118 C42,96 48,80 46,60 M46,80 C34,72 28,70 20,72 M46,74 C58,66 66,64 74,66" fill="none" stroke="#4c7a2c" strokeWidth={2} strokeLinecap="round" />
      ) : (
        <>
          <line x1={46} y1={2} x2={46} y2={118} stroke="#a88a5c" strokeWidth={3} strokeLinecap="round" />
          <path d="M46,118 C38,104 54,96 46,84 C38,72 54,64 46,52 C38,40 54,32 46,20 C40,12 50,8 46,2" fill="none" stroke="#4c7a2c" strokeWidth={1.8} />
        </>
      )}
      <Trifoliate x={app.bush ? 22 : 46} y={app.bush ? 70 : 40} s={0.9} rot={-50} />
      <Trifoliate x={app.bush ? 72 : 46} y={app.bush ? 64 : 70} s={0.9} rot={50} />
      {!app.bush && <Trifoliate x={46} y={100} s={0.7} rot={-40} />}

      {/* Fleur papilionacée */}
      <g transform={app.bush ? 'translate(48 56)' : 'translate(50 28)'}>
        <path d="M0,0 C-6,-8 -2,-14 4,-12 C10,-10 10,-2 0,0 Z" fill={fl.a} stroke="#9a8f7a" strokeWidth={0.4} />
        <path d="M0,0 C4,2 8,6 6,9 C3,8 1,4 0,0 Z" fill={fl.b} stroke="#9a8f7a" strokeWidth={0.4} />
        <path d="M0,0 C-3,3 -6,6 -4,9 C-2,8 -1,4 0,0 Z" fill={fl.b} stroke="#9a8f7a" strokeWidth={0.4} />
      </g>

      {/* Gousses */}
      {[0, 1].map((i) => {
        const x = app.bush ? 54 + i * 9 : 50 + i * 9;
        const y = app.bush ? 64 : 46 + i * 6;
        const len = podLen * (i === 0 ? 1 : 0.85);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${-6 + i * 10 + (rng() - 0.5) * 4})`}>
            <path d={podPath(len)} fill={pod.base} stroke={pod.deep} strokeWidth={0.7} />
            {app.podStreaked &&
              [0.2, 0.35, 0.5, 0.65, 0.8].map((t, k) => (
                <path key={k} d={`M${(-2 + Math.sin(t * 1.6) * 6 * t).toFixed(1)},${(t * len).toFixed(1)} l4,${(len * 0.05).toFixed(1)}`} stroke={app.pod === 'yellow' ? '#7a3a8a' : '#9a2a2a'} strokeWidth={1.4} strokeLinecap="round" />
              ))}
            <path d={`M0,-3 L0,2`} stroke={pod.deep} strokeWidth={1.2} />
          </g>
        );
      })}

      {/* Graines (sèches), en médaillon */}
      <g>
        <rect x={76} y={84} width={42} height={32} rx={6} fill="#f6f1e4" opacity={0.85} />
        <Seed x={88} y={96} s={seedScale * 0.9} rot={-15} app={app} uid={uid} id="s1" />
        <Seed x={105} y={92} s={seedScale * 0.8} rot={20} app={app} uid={uid} id="s2" />
        <Seed x={98} y={108} s={seedScale * 0.85} rot={-5} app={app} uid={uid} id="s3" />
      </g>
    </svg>
  );
}

export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'seed' | 'pattern'>; size?: number }) {
  const c = SEED_COLORS[appearance.seed];
  const bg =
    appearance.pattern === 'marbled'
      ? `radial-gradient(circle at 30% 35%, ${c.base} 0 22%, transparent 23%), radial-gradient(circle at 70% 65%, ${c.base} 0 25%, transparent 26%), ${PALE}`
      : appearance.pattern === 'eye'
        ? `radial-gradient(circle at 50% 60%, ${c.base} 0 40%, ${PALE} 41%)`
        : `radial-gradient(circle at 35% 30%, ${c.light}, ${c.base} 55%, ${c.deep})`;
  return (
    <span
      className="inline-block shrink-0"
      style={{ width: size * 1.25, height: size, borderRadius: '50% 50% 45% 45% / 55% 55% 45% 45%', background: bg, boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25)', border: appearance.seed === 'white' ? '1px solid #d6cdb3' : undefined }}
    />
  );
}
