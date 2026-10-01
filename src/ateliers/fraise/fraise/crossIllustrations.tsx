/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * des fraisiers : hampe florale (bouton, fleur, fruit), castration au stade
 * « bouton ballon » (pétales et couronne d’étamines retirés, réceptacle et
 * pistils gardés), sachet, pollinisation au pinceau, étiquette, puis
 * récolte des akènes sur le fruit mûr.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#6a8a4a';
const PETAL = '#fbf8f0';
const PETAL_EDGE = '#c9c2b0';
const POLLEN = '#e8c84a';
const BAG = '#f4f1e6';
const BERRY = '#d8312b';
const BERRY_DEEP = '#8e1a18';
const RECEPT = '#c9d65a';

const W = 320;
const H = 180;

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={8} fill="#f3ecd9" stroke="#e8dcc0" />
      <g fontFamily="var(--font-sans, system-ui)" fontSize={9.5} fill={INK}>
        {children}
      </g>
    </svg>
  );
}

function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

function Callout({ x, y, tx, ty, text, anchor = 'start', max = 20 }: { x: number; y: number; tx: number; ty: number; text: string; anchor?: 'start' | 'end' | 'middle'; max?: number }) {
  const lines = wrap(text, max);
  const dx = anchor === 'start' ? 3 : anchor === 'end' ? -3 : 0;
  return (
    <g>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={INK_SOFT} strokeWidth={0.8} />
      <circle cx={x} cy={y} r={1.6} fill={INK_SOFT} />
      <text x={tx + dx} y={ty + 3} textAnchor={anchor}>
        {lines.map((l, i) => (
          <tspan key={i} x={tx + dx} dy={i === 0 ? 0 : 11}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}

/** Fleur de fraisier vue de face : 5 pétales, couronne d’étamines, réceptacle à pistils. */
function Flower({ x, y, r = 14, stamens = true, petals = true }: { x: number; y: number; r?: number; stamens?: boolean; petals?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={`s${a}`} d={`M0,0 L${-r * 0.18},${-r * 0.95} L0,${-r * 1.15} L${r * 0.18},${-r * 0.95} Z`} transform={`rotate(${a + 36})`} fill="#5f9a46" />
      ))}
      {petals && [0, 72, 144, 216, 288].map((a) => <circle key={`p${a}`} cx={0} cy={-r * 0.62} r={r * 0.5} transform={`rotate(${a})`} fill={PETAL} stroke={PETAL_EDGE} strokeWidth={0.6} />)}
      {stamens &&
        Array.from({ length: 20 }, (_, i) => {
          const a = (i / 20) * Math.PI * 2;
          return <circle key={`a${i}`} cx={Math.cos(a) * r * 0.42} cy={Math.sin(a) * r * 0.42} r={r * 0.07} fill={POLLEN} stroke="#a88a20" strokeWidth={0.3} />;
        })}
      <circle r={r * 0.3} fill={RECEPT} stroke="#8a9a30" strokeWidth={0.5} />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return <circle key={`g${i}`} cx={Math.cos(a) * r * 0.16} cy={Math.sin(a) * r * 0.16} r={r * 0.035} fill="#7a8a20" />;
      })}
    </g>
  );
}

function Bud({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={r} ry={r * 1.1} fill="#f6f1e0" stroke={PETAL_EDGE} strokeWidth={0.6} />
      <path d={`M${-r},${r * 0.3} Q0,${r * 1.6} ${r},${r * 0.3}`} fill="#5f9a46" />
    </g>
  );
}

function Berry({ x, y, s = 1, color = BERRY }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,22 C-6,20 -14,13 -13,5 C-12,-2 -5,-3 0,-1 C5,-3 12,-2 13,5 C14,13 6,20 0,22 Z" fill={color} stroke={BERRY_DEEP} strokeWidth={0.8} />
      {[
        [-6, 4],
        [0, 3],
        [6, 4],
        [-8, 10],
        [-2, 10],
        [4, 10],
        [8, 10],
        [-4, 16],
        [3, 16],
      ].map(([sx, sy], i) => (
        <ellipse key={i} cx={sx} cy={sy} rx={0.8} ry={1.2} fill="#f2c94a" />
      ))}
      <path d="M-9,-1 L0,-4 L9,-1 L4,1 L0,-1 L-4,1 Z" fill="#4f8a3a" />
    </g>
  );
}

// --- 1. Repérer la hampe florale ----------------------------------------------------

export function IdIllustration({ bud, flower, umbel, caption }: { bud: string; flower: string; umbel: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 40 160 L 160 160" stroke="#8a6a44" strokeWidth={1.2} />
      <path d="M 90 160 Q 88 110 96 70 M 96 92 Q 70 80 58 58 M 96 84 Q 120 76 128 104" stroke={STEM} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Flower x={96} y={58} r={16} />
      <Bud x={58} y={54} r={6} />
      <Berry x={128} y={102} s={0.85} color="#e8e0b0" />
      <Callout x={104} y={46} tx={176} ty={30} text={flower} max={24} />
      <Callout x={136} y={112} tx={176} ty={96} text={umbel} max={24} />
      <Callout x={54} y={60} tx={12} ty={120} text={bud} max={18} />
    </Frame>
  );
}

// --- 2. Castrer au stade bouton ballon ------------------------------------------------

export function EmasculateIllustration({ stamens, tweezers, stigma, caption }: { stamens: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Flower x={72} y={92} r={34} />
      
      <Flower x={200} y={92} r={34} petals={false} stamens={false} />
      <path d="M 128 92 L 150 92" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 146 88 L 152 92 L 146 96" fill="none" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 300 30 L 222 78 M 306 38 L 226 82" stroke="#8a8a8a" strokeWidth={2.4} strokeLinecap="round" />
      <Callout x={86} y={80} tx={10} ty={20} text={stamens} max={20} />
      <Callout x={200} y={96} tx={196} ty={150} text={stigma} max={26} />
      <Callout x={290} y={36} tx={250} ty={18} text={tweezers} max={18} anchor="end" />
    </Frame>
  );
}

// --- 3. Ensacher -------------------------------------------------------------------------

export function BagIllustration({ bag, insects, caption }: { bag: string; insects: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 110 172 Q 108 120 110 74" stroke={STEM} strokeWidth={2} fill="none" />
      <Flower x={110} y={62} r={18} petals={false} stamens={false} />
      <path d="M 80 26 L 140 26 L 146 104 Q 110 112 74 104 Z" fill={BAG} stroke="#b9ae8e" strokeWidth={1} opacity={0.82} />
      <rect x={100} y={104} width={20} height={4} fill="#9a9a9a" />
      <Callout x={142} y={60} tx={176} ty={46} text={bag} max={22} />
      <g transform="translate(176 120)">
        <ellipse rx={5} ry={3.4} fill="#e0a83a" />
        <path d="M-2,-3 L-2,3 M1,-3 L1,3" stroke="#3a2a10" strokeWidth={1} />
        <ellipse cx={-1} cy={-5} rx={3} ry={2} fill="#dfe8ee" opacity={0.85} />
      </g>
      <path d="M 166 116 L 152 108" stroke="#b8412a" strokeWidth={1.2} />
      <path d="M 156 104 L 162 116 M 162 104 L 156 116" stroke="#b8412a" strokeWidth={1.2} />
      <text x={240} y={150} textAnchor="middle" fill={INK_SOFT}>
        {wrap(insects, 26).map((l, i) => (
          <tspan key={i} x={240} dy={i === 0 ? 0 : 11}>
            {l}
          </tspan>
        ))}
      </text>
    </Frame>
  );
}

// --- 4. Polliniser au pinceau -------------------------------------------------------------

export function PollinateIllustration({ stigma, pollen, caption }: { stigma: string; pollen: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Flower x={84} y={100} r={28} petals={false} stamens={false} />
      <Flower x={232} y={54} r={22} />
      <path d="M 206 120 L 112 92" stroke="#a07a4a" strokeWidth={3} strokeLinecap="round" />
      <path d="M 112 92 L 100 89" stroke="#3a2a1a" strokeWidth={4.5} strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={98 + (i % 3) * 2} cy={88 + i} r={1.1} fill={POLLEN} />
      ))}
      <Callout x={84} y={104} tx={20} ty={152} text={stigma} max={26} />
      <Callout x={232} y={46} tx={196} ty={18} text={pollen} max={26} anchor="middle" />
    </Frame>
  );
}

// --- 5. Étiqueter ---------------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 80 172 Q 78 120 80 76" stroke={STEM} strokeWidth={2} fill="none" />
      <Flower x={80} y={62} r={18} petals={false} stamens={false} />
      <path d="M 82 110 C 104 108 126 100 150 94" fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <g transform="translate(150 62) rotate(-4)">
        <path d="M 0 22 L 12 12 L 150 12 L 150 70 L 12 70 L 0 60 Z" fill="#fffdf6" stroke={INK_SOFT} strokeWidth={1} />
        <circle cx={9} cy={40} r={3} fill="#f3ecd9" stroke={INK_SOFT} />
        <text x={20} y={30} fontSize={10} fontWeight={600} fill={INK}>
          {line1}
        </text>
        <text x={20} y={45} fontSize={10} fill={INK}>
          {line2}
        </text>
        <text x={20} y={60} fontSize={9} fill={INK_SOFT}>
          {line3}
        </text>
      </g>
    </Frame>
  );
}

// --- 6. Fruit mûr et akènes ------------------------------------------------------------------

export function SeedsIllustration({ wait, dry, caption }: { wait: string; dry: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 84 30 Q 82 50 84 62" stroke={STEM} strokeWidth={1.8} fill="none" />
      <Berry x={84} y={66} s={2.4} />
      <text x={84} y={166} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <path d="M 140 90 L 180 90" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 176 86 L 182 90 L 176 94" fill="none" stroke={INK_SOFT} strokeWidth={1.4} />
      <g transform="translate(244 94)">
        <ellipse rx={56} ry={22} fill="#fbfaf5" stroke="#b9b3a2" />
        {Array.from({ length: 28 }, (_, i) => {
          const cx = -42 + (i % 10) * 9.4;
          const cy = -8 + Math.floor(i / 10) * 7.5;
          return <ellipse key={i} cx={cx} cy={cy} rx={1.6} ry={2.3} transform={`rotate(${(i * 41) % 180} ${cx} ${cy})`} fill="#b8862a" />;
        })}
      </g>
      <text x={244} y={136} textAnchor="middle">
        {wrap(dry, 30).map((l, i) => (
          <tspan key={i} x={244} dy={i === 0 ? 0 : 11}>
            {l}
          </tspan>
        ))}
      </text>
    </Frame>
  );
}
