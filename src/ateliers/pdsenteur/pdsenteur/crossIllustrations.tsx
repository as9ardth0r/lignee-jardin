/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * des pois de senteur : tige florale avec boutons et fleurs ouvertes,
 * castration du bouton la veille de l’ouverture (carène ouverte, 10 étamines
 * retirées à la pince), fleur protégée par un sachet, pollen déposé au
 * pinceau, étiquette, gousses mûres et graines.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#5f8a46';
const LEAF = '#6f9a4a';
const POLLEN = '#f0c83a';
const BAG = '#f4f1e6';
const MAG = '#8a4cc0';
const MAG_DEEP = '#4a2478';
const PALE = '#e4d6f4';

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

/** Fleur de pois de senteur de profil : étendard dressé, aile, carène. */
function Floret({ x, y, s = 1, dir = 1, fill = MAG, edge = MAG_DEEP }: { x: number; y: number; s?: number; dir?: 1 | -1; fill?: string; edge?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      <path d="M0,0 L6,-1" stroke={STEM} strokeWidth={0.9} />
      <path d="M8,-1 C6,-12 10,-17 15,-16 C20,-15 21,-8 16,0 Z" fill={fill} stroke={edge} strokeWidth={0.6} />
      <path d="M7,0 C9,-5 16,-5 18,1 C16,5 10,5 7,0 Z" fill={PALE} stroke={edge} strokeWidth={0.5} />
      <path d="M8,1 C11,4 17,4 19,1" fill="none" stroke={edge} strokeWidth={0.5} />
    </g>
  );
}

/** Bouton : vert (jeune) ou teinté (s’ouvrira demain : à castrer). */
function Bud({ x, y, s = 1, colored = false, dir = 1 }: { x: number; y: number; s?: number; colored?: boolean; dir?: 1 | -1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${dir * s} ${s})`}>
      <path d="M0,0 L5,-1" stroke={STEM} strokeWidth={0.9} />
      <path d="M5,-1 C6,-6 12,-7 13,-2 C12,2 7,2 5,-1 Z" fill={colored ? '#e8a0c4' : '#a8c47a'} stroke={colored ? MAG_DEEP : '#5a7a3a'} strokeWidth={0.6} />
      <path d="M4,-1 L6,-3 M4,-1 L6,1" stroke={STEM} strokeWidth={0.8} />
    </g>
  );
}

/** Tige de pois de senteur : feuilles à deux folioles, vrille, hampe florale (fleurs en bas, boutons en haut) ou gousses. */
function Spike({ x, y, len = 110, flowers = 3, colored = 2, capsules = false }: { x: number; y: number; len?: number; flowers?: number; colored?: number; capsules?: boolean }) {
  const items: ReactNode[] = [];
  const n = 6;
  const top = y - len;
  const ped = top + len * 0.15;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const yy = top + 6 + t * (len * 0.45);
    const xx = x + 10 + t * 2;
    const dir = i % 2 ? 1 : -1;
    const fromBottom = n - 1 - i;
    if (capsules) {
      if (i % 2 === 0) continue;
      items.push(
        <g key={i} transform={`translate(${xx} ${yy})`}>
          <path d={`M0,0 C${dir * 4},4 ${dir * 6},14 ${dir * 5},30`} fill="none" stroke="#9a8455" strokeWidth={4.5} strokeLinecap="round" />
          <path d={`M0,0 C${dir * 4},4 ${dir * 6},14 ${dir * 5},30`} fill="none" stroke="#c4a870" strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    } else if (fromBottom < flowers) items.push(<Floret key={i} x={xx} y={yy} s={1.15 - t * 0.15} dir={dir} />);
    else if (fromBottom < flowers + colored) items.push(<Bud key={i} x={xx} y={yy} s={1} colored dir={dir} />);
    else items.push(<Bud key={i} x={xx} y={yy} s={0.7 + t * 0.2} dir={dir} />);
  }
  const color = capsules ? '#8a7a4a' : STEM;
  return (
    <g>
      <path d={`M${x},${y} L${x},${top + 10}`} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M${x},${y - len * 0.25} C${x + 6},${ped + 30} ${x + 8},${ped + 10} ${x + 10},${top + 6}`} fill="none" stroke={color} strokeWidth={1.3} />
      {[0, 1].map((i) => {
        const yy = y - 12 - i * 30;
        const d = i % 2 ? 1 : -1;
        return (
          <g key={i}>
            <path d={`M${x},${yy} q${d * 8},-2 ${d * 10},-10 q${d * 6},2 ${d * 2},12 Z`} fill={LEAF} stroke="#3f6e30" strokeWidth={0.5} />
            <path d={`M${x},${yy} q${d * 10},4 ${d * 16},-2 q${d * 2},8 ${d * -6},6 Z`} fill={LEAF} stroke="#3f6e30" strokeWidth={0.5} />
            <path d={`M${x},${yy - 2} q${-d * 8},-6 ${-d * 10},-14 q0,-4 ${d * 3},-3 q2,2 ${-d * 1},4`} fill="none" stroke="#7aa64e" strokeWidth={0.7} />
          </g>
        );
      })}
      {items}
    </g>
  );
}

// --- 1. Repérer l’épi et les boutons ---------------------------------------------

export function IdIllustration({ bud, flower, spike, caption }: { bud: string; flower: string; spike: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={80} y={172} len={160} flowers={3} colored={1} />
      <Callout x={82} y={44} tx={168} ty={22} text={bud} max={28} />
      <Callout x={110} y={82} tx={168} ty={92} text={flower} max={28} />
      <Callout x={96} y={24} tx={168} ty={150} text={spike} max={28} />
    </Frame>
  );
}

// --- 2. Castrer le bouton -----------------------------------------------------------

export function EmasculateIllustration({ stamens, tweezers, stigma, caption }: { stamens: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* bouton agrandi : étendard et ailes écartés, carène ouverte, 10 étamines (9 soudées + 1 libre) autour du style */}
      <g transform="translate(60 128)">
        <path d="M6,-4 C-6,-34 4,-62 24,-62 C40,-60 40,-36 30,-10 Z" fill={PALE} stroke={MAG_DEEP} strokeWidth={0.9} opacity={0.7} />
        <path d="M10,0 C20,14 58,16 76,4 C80,0 76,-4 70,-4 C50,2 26,0 10,0 Z" fill={PALE} stroke={MAG_DEEP} strokeWidth={0.9} />
        <path d="M10,-2 C26,-6 50,-8 70,-6" fill="none" stroke={MAG_DEEP} strokeWidth={0.6} strokeDasharray="2 2" />
        {/* gaine des étamines */}
        <path d="M10,-2 C24,-10 40,-14 50,-18" fill="none" stroke="#e8e0bc" strokeWidth={4} strokeLinecap="round" />
        {/* style courbé et stigmate barbu */}
        <path d="M10,-2 C30,-8 48,-14 58,-30" fill="none" stroke="#7aa04a" strokeWidth={1.4} />
        <circle cx={58} cy={-31} r={2.4} fill="#a8c860" />
        {Array.from({ length: 10 }, (_, i) => {
          const ax = 44 + (i % 5) * 3.2;
          const ay = -24 + Math.floor(i / 5) * 6 + (i % 2);
          return (
            <g key={i}>
              <path d={`M${ax - 6},${ay + 6} L${ax},${ay}`} stroke="#e0d6b0" strokeWidth={0.7} />
              <ellipse cx={ax} cy={ay} rx={1.6} ry={1.2} fill={POLLEN} stroke="#a88a20" strokeWidth={0.4} />
            </g>
          );
        })}
      </g>
      <path d="M 196 40 L 124 92 M 202 46 L 128 96" stroke="#8a8a8a" strokeWidth={2.4} strokeLinecap="round" />
      <Callout x={110} y={104} tx={10} ty={22} text={stamens} max={22} />
      <Callout x={118} y={97} tx={188} ty={132} text={stigma} max={24} />
      <Callout x={196} y={42} tx={214} ty={26} text={tweezers} max={18} />
    </Frame>
  );
}

// --- 3. Ensacher l’épi -----------------------------------------------------------------

export function BagIllustration({ bag, insects, caption }: { bag: string; insects: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={90} y={172} len={150} flowers={1} colored={2} />
      <path d="M 92 28 L 132 28 L 136 110 Q 114 116 92 110 Z" fill={BAG} stroke="#b9ae8e" strokeWidth={1} opacity={0.82} />
      <rect x={104} y={110} width={14} height={3} fill="#9a9a9a" />
      <Callout x={134} y={60} tx={160} ty={36} text={bag} max={26} />
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
      {/* fleur castrée de la mère : carène ouverte, style et stigmate seuls */}
      <g transform="translate(50 128)">
        <path d="M6,-4 C-6,-34 4,-62 24,-62 C40,-60 40,-36 30,-10 Z" fill={PALE} stroke={MAG_DEEP} strokeWidth={0.9} opacity={0.7} />
        <path d="M10,0 C20,14 58,16 76,4 C80,0 76,-4 70,-4 C50,2 26,0 10,0 Z" fill={PALE} stroke={MAG_DEEP} strokeWidth={0.9} />
        <path d="M10,-2 C30,-8 48,-14 58,-30" fill="none" stroke="#7aa04a" strokeWidth={1.4} />
        <circle cx={58} cy={-31} r={2.8} fill="#a8c860" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={56 + (i % 2) * 3} cy={-33 + Math.floor(i / 2) * 3} r={0.9} fill={POLLEN} />
        ))}
      </g>
      {/* pinceau chargé de pollen */}
      <g transform="translate(124 88) rotate(-35)">
        <rect x={0} y={-2.5} width={80} height={5} rx={2} fill="#b0844a" />
        <path d="M0,-3 L-14,-1 L-14,1 L0,3 Z" fill="#5a4630" />
        <circle cx={-14} cy={0} r={1.5} fill={POLLEN} />
      </g>
      <Callout x={108} y={98} tx={150} ty={140} text={stigma} max={26} />
      <Callout x={160} y={72} tx={190} ty={34} text={pollen} max={22} />
    </Frame>
  );
}

// --- 5. Étiqueter ------------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={60} y={172} len={150} flowers={1} colored={0} />
      <path d="M 72 80 C 94 84 116 92 140 94" fill="none" stroke="#b8412a" strokeWidth={1.6} />
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
        {/* gousse ouverte et ses graines rondes */}
        <path d="M-46,4 C-30,-14 30,-14 46,4 C30,-4 -30,-4 -46,4 Z" fill="#c4a870" stroke="#8a7044" strokeWidth={0.8} />
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} cx={-31 + i * 9} cy={-3 + (i % 2)} r={3.6} fill={i % 3 ? '#4a3a2a' : '#6a5a3a'} stroke="#2a2018" strokeWidth={0.4} />
        ))}
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
