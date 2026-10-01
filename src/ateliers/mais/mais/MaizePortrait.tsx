import type { ReactElement } from 'react';
import { hashSeed, mulberry32 } from '../engine/core';
import { kernelColor, type FruitAppearance, type Kernel, type KernelColor, type PlantColor } from '../engine/mais/engine';

/** Teintes des grains vus de l’extérieur. */
export const KERNEL_COLORS: Record<KernelColor, { base: string; deep: string }> = {
  yellow: { base: '#f2c230', deep: '#c8921a' },
  white: { base: '#f3ecd6', deep: '#c9bd98' },
  purple: { base: '#4b2a5e', deep: '#2a1636' },
  blue: { base: '#3f5591', deep: '#253462' },
  red: { base: '#a3262a', deep: '#6e1517' },
  bronze: { base: '#9c6a3a', deep: '#6b4523' },
  variegated: { base: '#f0d79a', deep: '#c49a52' },
};

const STALK: Record<PlantColor, string> = { green: '#5d8a3a', sunred: '#8a5a3a', purple: '#5a2e5e' };
const LEAF: Record<PlantColor, string> = { green: '#6c9a46', sunred: '#6c8a46', purple: '#6a4a72' };

/** Un grain (vu de face), coloré selon péricarpe, aleurone, albumen et texture. */
function KernelShape({ k, x, y, w, h, i }: { k: Kernel; x: number; y: number; w: number; h: number; i: number }) {
  const c = KERNEL_COLORS[kernelColor(k)];
  const shrunk = k.texture === 'shrunken';
  const sugary = k.texture === 'sugary';
  const ww = shrunk ? w * 0.82 : w;
  const hh = shrunk ? h * 0.85 : h;
  const matte = k.texture === 'waxy' || k.texture === 'opaque';
  return (
    <g>
      <rect x={x - ww / 2} y={y - hh / 2} width={ww} height={hh} rx={Math.min(ww, hh) * 0.35} fill={c.base} stroke={c.deep} strokeWidth={0.35} />
      {k.pericarp === 'variegated' && <path d={`M${x - ww / 2 + 0.4},${y - hh * 0.2 + (i % 3)} L${x + ww / 2 - 0.4},${y + hh * 0.1 - (i % 2)}`} stroke="#b32a2a" strokeWidth={0.7} />}
      {sugary && <path d={`M${x - ww * 0.25},${y - hh * 0.1} q${ww * 0.25},${hh * 0.25} ${ww * 0.5},0`} fill="none" stroke={c.deep} strokeWidth={0.4} />}
      {shrunk && <path d={`M${x - ww * 0.3},${y} q${ww * 0.3},${-hh * 0.3} ${ww * 0.6},0`} fill="none" stroke={c.deep} strokeWidth={0.5} />}
      {!matte && !shrunk && <ellipse cx={x - ww * 0.15} cy={y - hh * 0.18} rx={ww * 0.18} ry={hh * 0.14} fill="#fff" opacity={0.35} />}
    </g>
  );
}

/**
 * Épi vu de face : les grains d’un même épi peuvent différer (xénie). Les
 * `kernels` sont répartis en rangs ; s’il y en a moins que de places, ils
 * sont répétés dans l’ordre.
 */
export function Ear({
  kernels,
  cx,
  cy,
  length,
  width,
  rot = 0,
  rows = 7,
  redCob,
  encased,
}: {
  kernels: Kernel[];
  cx: number;
  cy: number;
  length: number;
  width: number;
  rot?: number;
  rows?: number;
  redCob?: boolean;
  encased?: boolean;
}) {
  const cols = Math.max(4, Math.round((length / width) * rows * 0.75));
  const kw = width / rows;
  const kh = length / cols;
  const cells: ReactElement[] = [];
  if (!encased) {
    for (let c = 0; c < cols; c++) {
      const t = (c + 0.5) / cols;
      const taper = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.02)), 0.35);
      for (let r = 0; r < rows; r++) {
        const v = (r + 0.5) / rows - 0.5;
        const x = v * width * taper;
        const w = kw * taper * (1 - Math.abs(v) * 0.5);
        const y = -length / 2 + t * length;
        const idx = c * rows + r;
        cells.push(<KernelShape key={idx} k={kernels[idx % kernels.length]} x={x} y={y} w={w * 0.92} h={kh * 0.9} i={idx} />);
      }
    }
  }
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <ellipse cx={0} cy={0} rx={width / 2 + 0.6} ry={length / 2 + 0.6} fill={redCob ? '#8a2a22' : '#e6dcc0'} />
      {encased
        ? Array.from({ length: Math.max(3, Math.round(length / 4)) }, (_, i) => (
            <path key={i} d={`M0,${-length / 2 + i * 4} l${width * 0.45},2 l-${width * 0.45},2 l-${width * 0.45},-2 z`} fill="#6b5a46" stroke="#3a2f22" strokeWidth={0.4} />
          ))
        : cells}
    </g>
  );
}

function Leaf({ x, y, len, rot, color }: { x: number; y: number; len: number; rot: number; color: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${rot})`}
      d={`M0,0 C${len * 0.3},-4 ${len * 0.7},-2 ${len},${len * 0.25} C${len * 0.7},2 ${len * 0.3},3 0,2.5 Z`}
      fill={color}
      stroke="#3a5a28"
      strokeWidth={0.4}
    />
  );
}

export function MaizePortrait({
  seed,
  appearance: app,
  weightUnit,
  kernels,
  size = 120,
}: {
  seed: string;
  appearance: FruitAppearance;
  /** Longueur d’épi sur l’échelle 0–1. */
  weightUnit: number;
  /** Grains de l’épi (autofécondé ou issu d’un croisement) ; sinon grain « type ». */
  kernels?: Kernel[];
  size?: number;
}) {
  const rng = mulberry32(hashSeed(seed));
  const stalk = STALK[app.plant];
  const leaf = LEAF[app.plant];
  const top = app.dwarf ? 62 : app.brachytic ? 34 : 10;
  const ks = kernels && kernels.length ? kernels : [app.kernel];
  const earLen = 22 + weightUnit * 30;
  const earW = app.branched ? 5 : 8 + weightUnit * 4;
  const sway = (rng() - 0.5) * 4;
  const leaves = [];
  for (let i = 0; i < 5; i++) {
    const y = 112 - i * ((112 - top) / 5.5);
    const left = i % 2 === 0;
    leaves.push(<Leaf key={i} x={30} y={y} len={left ? -26 + i * 2 : 30 - i * 2} rot={left ? 18 : -18} color={leaf} />);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-hidden="true">
      {/* Tige, feuilles, panicule */}
      <path d={`M30,118 C30,90 ${30 + sway},50 30,${top}`} stroke={stalk} strokeWidth={3} fill="none" strokeLinecap="round" />
      {leaves}
      <g transform={`translate(30 ${top})`}>
        {[-14, -6, 0, 6, 14].map((a, i) => (
          <path key={i} d={`M0,0 q${a * 0.4},-6 ${a},${-8 + Math.abs(a) * 0.3}`} stroke={app.plant === 'purple' ? '#8a5a8a' : '#c9b46a'} strokeWidth={1.1} fill="none" />
        ))}
        <path d="M0,0 L0,-10" stroke={app.plant === 'purple' ? '#8a5a8a' : '#c9b46a'} strokeWidth={1.4} />
      </g>
      {app.branched && (
        <>
          <path d="M30,96 C42,88 50,80 54,70" stroke={stalk} strokeWidth={1.8} fill="none" />
          <path d="M30,84 C20,76 16,68 14,58" stroke={stalk} strokeWidth={1.8} fill="none" />
        </>
      )}

      {/* Épi (ou épis de téosinte) */}
      {app.branched ? (
        <>
          <Ear kernels={ks} cx={56} cy={66} length={14} width={4} rot={20} rows={2} encased={app.fruitCase === 'encased'} redCob={app.kernel.redCob} />
          <Ear kernels={ks} cx={14} cy={55} length={12} width={4} rot={-15} rows={2} encased={app.fruitCase === 'encased'} redCob={app.kernel.redCob} />
          <Ear kernels={ks} cx={84} cy={72} length={30} width={10} rot={28} rows={4} encased={app.fruitCase === 'encased'} redCob={app.kernel.redCob} />
        </>
      ) : (
        <>
          <path d={`M30,${app.dwarf ? 92 : 80} C38,${app.dwarf ? 88 : 76} 44,${app.dwarf ? 86 : 74} 50,${app.dwarf ? 84 : 72}`} stroke="#8aa85a" strokeWidth={2.5} fill="none" />
          <Ear kernels={ks} cx={78} cy={app.dwarf ? 86 : 70} length={Math.min(56, earLen)} width={earW + 4} rot={50} rows={7} redCob={app.kernel.redCob} encased={app.fruitCase === 'encased'} />
          {/* spathes ouvertes */}
          <path d={`M54,${app.dwarf ? 92 : 76} C62,${app.dwarf ? 104 : 92} 74,${app.dwarf ? 110 : 98} 92,${app.dwarf ? 112 : 102}`} fill="none" stroke="#a9bf72" strokeWidth={2.2} />
          <path d={`M54,${app.dwarf ? 86 : 70} C60,${app.dwarf ? 74 : 56} 70,${app.dwarf ? 66 : 48} 84,${app.dwarf ? 62 : 44}`} fill="none" stroke="#a9bf72" strokeWidth={2.2} />
        </>
      )}
      {app.maleSterile && (
        <g transform="translate(108 12)">
          <rect x={-10} y={-7} width={20} height={14} rx={4} fill="#2e4a35" />
          <text x={0} y={3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#f3e6b8">
            T
          </text>
        </g>
      )}
    </svg>
  );
}

/** Pastille : un grain. */
export function FruitDot({ appearance, size = 14 }: { appearance: Pick<FruitAppearance, 'color'>; size?: number }) {
  const c = KERNEL_COLORS[appearance.color];
  return (
    <span
      className="inline-block shrink-0"
      style={{
        width: size * 0.9,
        height: size,
        borderRadius: '45% 45% 40% 40% / 55% 55% 40% 40%',
        background:
          appearance.color === 'variegated'
            ? `repeating-linear-gradient(60deg, ${c.base} 0 3px, #b32a2a 3px 4px)`
            : `radial-gradient(circle at 35% 30%, #ffffff55, ${c.base} 45%, ${c.deep})`,
        boxShadow: 'inset 0 -1px 2px rgba(0,0,0,.25)',
      }}
    />
  );
}
