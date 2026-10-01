/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * des choux : repérer les boutons sur la hampe florale, castrer le bouton
 * (6 étamines : 4 longues, 2 courtes), ensacher, polliniser avec une fleur
 * ouverte du père, étiqueter, récolter les siliques.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#6a8a4a';
const PETAL = '#f2d23c';
const PETAL_DARK = '#c79a14';
const POLLEN = '#f5c211';
const BAG = '#f4f1e6';
const SILIQUE = '#a9b86a';

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

/** Fleur ouverte de crucifère : 4 pétales en croix. */
function Flower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 90, 180, 270].map((a) => (
        <ellipse key={a} cx={0} cy={-6} rx={3.6} ry={6} transform={`rotate(${a + 45})`} fill={PETAL} stroke={PETAL_DARK} strokeWidth={0.5} />
      ))}
      <circle r={2} fill="#9aa84a" />
    </g>
  );
}

function Bud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={3} ry={5} fill="#b9c87a" stroke="#6a7a3a" strokeWidth={0.6} />
      <path d="M-1.5,-4.5 L0,-6.5 L1.5,-4.5" fill={PETAL} />
    </g>
  );
}

/** Hampe florale : boutons en haut, fleurs ouvertes, siliques en bas. */
function Raceme({ x, y, h = 120, open = 3 }: { x: number; y: number; h?: number; open?: number }) {
  const items: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const yy = y - h + 10 + i * (h / 10);
    const side = i % 2 ? 1 : -1;
    const px = x + side * 10;
    items.push(<path key={`p${i}`} d={`M${x},${yy + 6} L${px},${yy}`} stroke={STEM} strokeWidth={1} />);
    if (i < 4) items.push(<Bud key={i} x={px} y={yy} s={0.9 + i * 0.1} />);
    else if (i < 4 + open) items.push(<Flower key={i} x={px} y={yy} s={0.9} />);
    else items.push(<path key={i} d={`M${px},${yy} l${side * 3},18`} stroke={SILIQUE} strokeWidth={2.4} strokeLinecap="round" />);
  }
  return (
    <g>
      <path d={`M${x},${y} L${x},${y - h}`} stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
      {items}
    </g>
  );
}

// --- 1. Repérer les boutons ----------------------------------------------------

export function IdIllustration({ bud, flower, silique, caption }: { bud: string; flower: string; silique: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Raceme x={120} y={172} h={150} />
      <Callout x={130} y={48} tx={170} ty={36} text={bud} max={24} />
      <Callout x={130} y={100} tx={176} ty={96} text={flower} max={22} />
      <Callout x={114} y={158} tx={176} ty={150} text={silique} max={22} />
    </Frame>
  );
}

// --- 2. Castrer le bouton ------------------------------------------------------

export function EmasculateIllustration({ stamens, tweezers, stigma, caption }: { stamens: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 100 172 L 100 110" stroke={STEM} strokeWidth={3} strokeLinecap="round" />
      {/* bouton ouvert : sépales et pétales écartés */}
      <path d="M 100 112 C 84 104 78 88 82 76 M 100 112 C 116 104 122 88 118 76" fill="none" stroke="#9aa84a" strokeWidth={2} />
      <path d="M 100 110 L 100 66" stroke="#9aa84a" strokeWidth={3} />
      <ellipse cx={100} cy={63} rx={3} ry={2.4} fill="#c9d48a" stroke="#6a7a3a" strokeWidth={0.6} />
      {/* 6 étamines : 4 longues, 2 courtes */}
      {[-9, -4, 4, 9].map((d, i) => (
        <g key={i}>
          <path d={`M${100 + d * 0.3},106 L${100 + d},74`} stroke="#d8c88a" strokeWidth={1} />
          <ellipse cx={100 + d} cy={72} rx={1.6} ry={3} fill={POLLEN} stroke={PETAL_DARK} strokeWidth={0.4} />
        </g>
      ))}
      {[-14, 14].map((d, i) => (
        <g key={`s${i}`}>
          <path d={`M${100 + d * 0.3},106 L${100 + d},90`} stroke="#d8c88a" strokeWidth={1} />
          <ellipse cx={100 + d} cy={88} rx={1.6} ry={3} fill={POLLEN} stroke={PETAL_DARK} strokeWidth={0.4} />
        </g>
      ))}
      <path d="M 140 40 L 112 70 M 146 44 L 114 72" stroke="#8a8a8a" strokeWidth={2.4} strokeLinecap="round" />
      <Callout x={91} y={72} tx={66} ty={52} text={stamens} anchor="end" max={13} />
      <Callout x={100} y={63} tx={176} ty={88} text={stigma} max={20} />
      <Callout x={140} y={42} tx={176} ty={30} text={tweezers} max={20} />
    </Frame>
  );
}

// --- 3. Ensacher ---------------------------------------------------------------

export function BagIllustration({ bag, insects, caption }: { bag: string; insects: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Raceme x={110} y={172} h={130} open={2} />
      <path d="M 86 26 L 134 26 L 140 150 Q 110 158 80 150 Z" fill={BAG} stroke="#b9ae8e" strokeWidth={1} opacity={0.85} />
      <rect x={100} y={150} width={20} height={4} fill="#9a9a9a" />
      <Callout x={136} y={70} tx={170} ty={60} text={bag} max={22} />
      <g transform="translate(240 120)">
        <ellipse cx={0} cy={0} rx={8} ry={5} fill="#d9a42a" />
        <path d="M-4,-2 l-6,-6 M4,-2 l6,-6" stroke="#6b5a3a" strokeWidth={1} />
        <path d="M-6,0 L6,0" stroke="#3a2f22" strokeWidth={1.4} />
      </g>
      <text x={240} y={146} textAnchor="middle" fill={INK_SOFT}>
        {insects}
      </text>
    </Frame>
  );
}

// --- 4. Polliniser -----------------------------------------------------------------

export function PollinateIllustration({ stigma, pollen, caption }: { stigma: string; pollen: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 90 172 L 90 110" stroke={STEM} strokeWidth={3} strokeLinecap="round" />
      <path d="M 90 110 L 90 70" stroke="#9aa84a" strokeWidth={3} />
      <ellipse cx={90} cy={67} rx={3.4} ry={2.6} fill="#e9d86a" stroke="#6a7a3a" strokeWidth={0.6} />
      {/* fleur du père tenue par la pince, étamines frottées sur le stigmate */}
      <g transform="translate(118 50) rotate(-30)">
        <Flower x={0} y={0} s={1.6} />
        {[-3, 0, 3].map((d, i) => (
          <ellipse key={i} cx={d} cy={6} rx={1.4} ry={2.6} fill={POLLEN} />
        ))}
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={94 + i * 3} cy={62 + (i % 2) * 3} r={1} fill={POLLEN} />
      ))}
      <Callout x={88} y={67} tx={74} ty={100} text={stigma} anchor="end" max={15} />
      <Callout x={124} y={46} tx={176} ty={40} text={pollen} max={22} />
    </Frame>
  );
}

// --- 5. Étiqueter ------------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Raceme x={80} y={172} h={130} open={1} />
      <path d="M 86 120 C 110 116 130 104 150 98" fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <g transform="translate(150 66) rotate(-4)">
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

// --- 6. Siliques et graines -----------------------------------------------------------------

export function SeedsIllustration({ wait, dry, caption }: { wait: string; dry: string; caption: string }) {
  return (
    <Frame label={caption}>
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i} transform={`translate(${40 + i * 18} 50) rotate(${-10 + i * 5})`}>
          <path d="M0,0 C4,10 4,60 0,76 C-4,60 -4,10 0,0 Z" fill="#c9b87a" stroke="#8a7a4a" strokeWidth={0.8} />
          {Array.from({ length: 8 }, (_, k) => (
            <circle key={k} cx={0} cy={8 + k * 8} r={1.6} fill="#6a3a22" />
          ))}
        </g>
      ))}
      <text x={84} y={150} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <path d="M 140 90 L 180 90" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 176 86 L 182 90 L 176 94" fill="none" stroke={INK_SOFT} strokeWidth={1.4} />
      <g transform="translate(240 94)">
        <ellipse rx={56} ry={22} fill="#fbfaf5" stroke="#b9b3a2" />
        {Array.from({ length: 30 }, (_, i) => (
          <circle key={i} cx={-40 + (i % 10) * 9} cy={-6 + Math.floor(i / 10) * 6} r={2} fill="#5a3a22" />
        ))}
      </g>
      <text x={240} y={136} textAnchor="middle">
        {dry}
      </text>
    </Frame>
  );
}
