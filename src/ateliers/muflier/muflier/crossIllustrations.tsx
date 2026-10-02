/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * des mufliers : épi avec boutons et fleurs ouvertes, castration du bouton
 * (4 étamines retirées à la pince avant qu’elles ne s’ouvrent), épi ensaché
 * contre les bourdons, pollen déposé au pinceau, étiquette, capsules mûres
 * et graines minuscules.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#5f8a46';
const LEAF = '#6f9a4a';
const POLLEN = '#f0c83a';
const BAG = '#f4f1e6';
const MAG = '#c2187a';
const MAG_DEEP = '#80104f';
const PALE = '#f3d6df';
const PALATE = '#f5c21a';

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

/** Fleur de muflier de profil (« gueule de loup »). */
function Floret({ x, y, s = 1, dir = 1, fill = MAG, edge = MAG_DEEP }: { x: number; y: number; s?: number; dir?: 1 | -1; fill?: string; edge?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      <path d="M0,1 C4,7 12,9 16,5 C17.5,3 16,1 13,1 Z" fill={fill} stroke={edge} strokeWidth={0.6} />
      <path d="M0,0 C3,-7 12,-9 16,-4 C17.5,-2 16,0 13,0.5 Z" fill={fill} stroke={edge} strokeWidth={0.6} />
      <ellipse cx={13.5} cy={0.8} rx={2.6} ry={1.4} fill={PALATE} />
    </g>
  );
}

/** Bouton : vert (jeune) ou coloré (prêt à castrer). */
function Bud({ x, y, s = 1, colored = false }: { x: number; y: number; s?: number; colored?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={5} cy={0} rx={6} ry={3.6} fill={colored ? '#e46aa8' : '#9ab86a'} stroke={colored ? MAG_DEEP : '#5a7a3a'} strokeWidth={0.6} />
      <path d="M-1,0 L2,-2.5 M-1,0 L2,2.5" stroke={STEM} strokeWidth={1} />
    </g>
  );
}

/** Épi de muflier : boutons verts au sommet, boutons colorés, fleurs ouvertes en bas. */
function Spike({ x, y, len = 110, flowers = 3, colored = 2, capsules = false }: { x: number; y: number; len?: number; flowers?: number; colored?: number; capsules?: boolean }) {
  const items: ReactNode[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const yy = y - len + 8 + t * (len * 0.72);
    const dir = i % 2 ? 1 : -1;
    const fromBottom = n - 1 - i;
    if (capsules) {
      items.push(
        <g key={i} transform={`translate(${x + dir * 8} ${yy})`}>
          <path d={`M0,0 L${-dir * 6},0`} stroke="#8a7a4a" strokeWidth={0.8} />
          <ellipse cx={0} cy={0} rx={4.2} ry={5} fill="#a8875a" stroke="#6a4f2a" strokeWidth={0.6} />
          <circle cx={-1.2} cy={-2.2} r={0.9} fill="#4a3418" />
          <circle cx={1.4} cy={-2} r={0.9} fill="#4a3418" />
        </g>
      );
    } else if (fromBottom < flowers) items.push(<Floret key={i} x={x} y={yy} s={0.95 - t * 0.2} dir={dir} />);
    else if (fromBottom < flowers + colored) items.push(<Bud key={i} x={x} y={yy} s={0.9} colored />);
    else items.push(<Bud key={i} x={x} y={yy} s={0.7 + t * 0.2} />);
  }
  return (
    <g>
      <path d={`M${x},${y} L${x},${y - len}`} stroke={capsules ? '#8a7a4a' : STEM} strokeWidth={2.2} strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${x},${y - 6 - i * 9} q${(i % 2 ? 1 : -1) * 9},-6 ${(i % 2 ? 1 : -1) * 18},-3 q${(i % 2 ? -1 : 1) * 9},4 ${(i % 2 ? -1 : 1) * 18},3 Z`} fill={LEAF} stroke="#3f6e30" strokeWidth={0.5} />
      ))}
      {items}
    </g>
  );
}

// --- 1. Repérer l’épi et les boutons ---------------------------------------------

export function IdIllustration({ bud, flower, spike, caption }: { bud: string; flower: string; spike: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={90} y={168} len={150} flowers={3} colored={2} />
      <Callout x={86} y={64} tx={168} ty={22} text={bud} max={28} />
      <Callout x={104} y={112} tx={168} ty={92} text={flower} max={28} />
      <Callout x={90} y={30} tx={168} ty={150} text={spike} max={28} />
    </Frame>
  );
}

// --- 2. Castrer le bouton -----------------------------------------------------------

export function EmasculateIllustration({ stamens, tweezers, stigma, caption }: { stamens: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* bouton agrandi, lèvre supérieure repliée : 4 étamines (2 longues, 2 courtes) et le style */}
      <g transform="translate(70 120)">
        <path d="M0,0 C10,14 50,18 70,6 C76,2 74,-2 66,-2 Z" fill={PALE} stroke={MAG_DEEP} strokeWidth={0.9} />
        <path d="M0,-2 C6,-30 30,-52 48,-44" fill="none" stroke={MAG_DEEP} strokeWidth={0.9} />
        <path d="M0,-2 C6,-30 30,-52 48,-44 C40,-34 30,-22 26,-6 Z" fill={PALE} stroke={MAG_DEEP} strokeWidth={0.7} opacity={0.9} />
        {/* style et stigmate */}
        <path d="M8,-2 C24,-8 40,-14 56,-18" fill="none" stroke="#7aa04a" strokeWidth={1.4} />
        <circle cx={57} cy={-18} r={2.2} fill="#a8c860" />
        {/* étamines */}
        {[
          [44, -26],
          [48, -22],
          [36, -16],
          [40, -12],
        ].map(([ax, ay], i) => (
          <g key={i}>
            <path d={`M10,-2 Q${ax / 2},${ay - 4} ${ax},${ay}`} fill="none" stroke="#e0d6b0" strokeWidth={1} />
            <ellipse cx={ax} cy={ay} rx={2.4} ry={1.8} fill={POLLEN} stroke="#a88a20" strokeWidth={0.5} />
          </g>
        ))}
      </g>
      <path d="M 196 40 L 124 92 M 202 46 L 128 96" stroke="#8a8a8a" strokeWidth={2.4} strokeLinecap="round" />
      <Callout x={106} y={96} tx={10} ty={22} text={stamens} max={22} />
      <Callout x={127} y={102} tx={188} ty={132} text={stigma} max={24} />
      <Callout x={196} y={42} tx={214} ty={26} text={tweezers} max={18} />
    </Frame>
  );
}

// --- 3. Ensacher l’épi -----------------------------------------------------------------

export function BagIllustration({ bag, insects, caption }: { bag: string; insects: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={100} y={172} len={140} flowers={2} colored={2} />
      <path d="M 70 14 L 130 14 L 136 116 Q 100 124 64 116 Z" fill={BAG} stroke="#b9ae8e" strokeWidth={1} opacity={0.82} />
      <rect x={90} y={116} width={20} height={4} fill="#9a9a9a" />
      <Callout x={132} y={50} tx={160} ty={36} text={bag} max={26} />
      {/* bourdon */}
      <g transform="translate(206 112)">
        <ellipse rx={9} ry={6.5} fill="#2a2a2a" />
        <rect x={-3} y={-6.3} width={4} height={12.6} fill="#f0c83a" />
        <ellipse cx={-3} cy={-8} rx={5} ry={3} fill="#dfe8ee" opacity={0.85} />
        <ellipse cx={3} cy={-8} rx={5} ry={3} fill="#dfe8ee" opacity={0.85} />
      </g>
      <text x={250} y={142} textAnchor="middle" fill={INK_SOFT}>
        {wrap(insects, 24).map((l, i) => (
          <tspan key={i} x={250} dy={i === 0 ? 0 : 11}>
            {l}
          </tspan>
        ))}
      </text>
    </Frame>
  );
}

// --- 4. Polliniser au pinceau ---------------------------------------------------------

export function PollinateIllustration({ stigma, pollen, caption }: { stigma: string; pollen: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* stigmate de la mère, collant 2 à 3 jours après la castration */}
      <g transform="translate(60 120)">
        <path d="M0,0 C10,14 50,18 70,6 C76,2 74,-2 66,-2 Z" fill={PALE} stroke={MAG_DEEP} strokeWidth={0.9} />
        <path d="M8,-2 C24,-8 40,-14 56,-18" fill="none" stroke="#7aa04a" strokeWidth={1.4} />
        <circle cx={57} cy={-18} r={2.6} fill="#a8c860" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={55 + i * 2} cy={-21 + (i % 2) * 2} r={0.9} fill={POLLEN} />
        ))}
      </g>
      {/* pinceau chargé de pollen */}
      <g transform="translate(122 98) rotate(-35)">
        <rect x={0} y={-2.5} width={80} height={5} rx={2} fill="#b0844a" />
        <path d="M0,-3 L-14,-1 L-14,1 L0,3 Z" fill="#5a4630" />
        <circle cx={-14} cy={0} r={1.5} fill={POLLEN} />
      </g>
      <Callout x={117} y={102} tx={150} ty={140} text={stigma} max={26} />
      <Callout x={160} y={72} tx={190} ty={34} text={pollen} max={22} />
    </Frame>
  );
}

// --- 5. Étiqueter ------------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={70} y={172} len={150} flowers={2} colored={1} />
      <path d="M 72 110 C 94 108 116 100 140 94" fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <g transform="translate(140 62) rotate(-4)">
        <path d="M 0 22 L 12 12 L 160 12 L 160 70 L 12 70 L 0 60 Z" fill="#fffdf6" stroke={INK_SOFT} strokeWidth={1} />
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

// --- 6. Capsules mûres et graines ----------------------------------------------------------

export function SeedsIllustration({ wait, dry, caption }: { wait: string; dry: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={80} y={156} len={130} capsules />
      <text x={80} y={170} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <path d="M 130 90 L 170 90" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 166 86 L 172 90 L 166 94" fill="none" stroke={INK_SOFT} strokeWidth={1.4} />
      <g transform="translate(244 90)">
        <ellipse rx={56} ry={22} fill="#fbfaf5" stroke="#b9b3a2" />
        {Array.from({ length: 60 }, (_, i) => {
          const cx = -44 + (i % 15) * 6.3;
          const cy = -9 + Math.floor(i / 15) * 6 + ((i * 7) % 3);
          return <circle key={i} cx={cx} cy={cy} r={1} fill="#2a2018" />;
        })}
      </g>
      <text x={244} y={130} textAnchor="middle">
        {wrap(dry, 32).map((l, i) => (
          <tspan key={i} x={244} dy={i === 0 ? 0 : 11}>
            {l}
          </tspan>
        ))}
      </text>
    </Frame>
  );
}
