/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * des carottes : racine porte-graine replantée et son ombelle, castration
 * des fleurs (5 étamines, protandrie), sac ou cage avec mouches, frottement
 * d’ombelle contre ombelle, étiquette, récolte des akènes épineux.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#6a8a4a';
const PETAL = '#fbf8f0';
const PETAL_EDGE = '#c9c2b0';
const POLLEN = '#e8c84a';
const BAG = '#f4f1e6';
const ROOT = '#f08a2a';
const ROOT_DEEP = '#b85a14';

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

/**
 * Ombelle vue de profil : rayons partant d’un point, ombellules blanches.
 * `state` : 'bud' (verte, fermée), 'open' (blanche), 'seed' (brune, en nid).
 */
function Umbel({ x, y, r = 26, state = 'open', purple = true }: { x: number; y: number; r?: number; state?: 'bud' | 'open' | 'seed'; purple?: boolean }) {
  const rays: ReactNode[] = [];
  const n = 9;
  const closed = state === 'seed' ? 0.55 : state === 'bud' ? 0.4 : 1;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI;
    const ex = x + Math.cos(a) * r * closed;
    const ey = y + Math.sin(a) * r * 0.55 - (state === 'seed' ? (1 - Math.abs(Math.cos(a))) * 4 : 0);
    rays.push(<path key={`r${i}`} d={`M${x},${y + 10} L${ex},${ey}`} stroke={STEM} strokeWidth={0.8} />);
    const fill = state === 'bud' ? '#b9c87a' : state === 'seed' ? '#8a6a3a' : PETAL;
    const edge = state === 'seed' ? '#5a3f1e' : state === 'bud' ? '#6a7a3a' : PETAL_EDGE;
    rays.push(<circle key={`u${i}`} cx={ex} cy={ey} r={state === 'open' ? 4.2 : 3.4} fill={fill} stroke={edge} strokeWidth={0.5} />);
  }
  return (
    <g>
      <path d={`M${x},${y + 10} L${x},${y + 40}`} stroke={STEM} strokeWidth={2} />
      {rays}
      {state === 'open' && purple && <circle cx={x} cy={y - r * 0.55 + 2} r={1.8} fill="#5a2050" />}
    </g>
  );
}

/** Racine porte-graine replantée (steckling) avec sa hampe. */
function Steckling({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 70},${y} L${x + 70},${y}`} stroke="#8a6a44" strokeWidth={1.2} />
      <path d={`M${x - 9},${y - 2} C ${x - 10} ${y + 20}, ${x - 3} ${y + 36}, ${x} ${y + 44} C ${x + 3} ${y + 36}, ${x + 10} ${y + 20}, ${x + 9} ${y - 2} Z`} fill={ROOT} stroke={ROOT_DEEP} strokeWidth={0.8} />
    </g>
  );
}

// --- 1. Repérer porte-graine et ombelles ----------------------------------------

export function IdIllustration({ bud, flower, umbel, caption }: { bud: string; flower: string; umbel: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Steckling x={90} y={134} />
      <path d="M 90 132 L 90 70 M 90 100 L 60 64 M 90 108 L 122 84" stroke={STEM} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Umbel x={90} y={34} r={28} state="open" />
      <Umbel x={60} y={52} r={14} state="bud" />
      <Umbel x={122} y={74} r={14} state="seed" />
      <Callout x={88} y={20} tx={176} ty={22} text={flower} max={24} />
      <Callout x={126} y={70} tx={176} ty={66} text={umbel} max={24} />
      <Callout x={60} y={52} tx={176} ty={116} text={bud} max={24} />
    </Frame>
  );
}

// --- 2. Castrer les fleurs ---------------------------------------------------------

export function EmasculateIllustration({ stamens, tweezers, stigma, caption }: { stamens: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* une fleur de carotte agrandie : 5 pétales, 5 étamines, 2 styles */}
      <g transform="translate(100 96)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-18} rx={9} ry={15} transform={`rotate(${a})`} fill={PETAL} stroke={PETAL_EDGE} strokeWidth={0.8} />
        ))}
        <circle r={7} fill="#d8d07a" stroke="#9a9040" strokeWidth={0.6} />
        <path d="M-2,0 L-4,-9 M2,0 L4,-9" stroke="#9a9040" strokeWidth={1.4} />
        {[36, 108, 180, 252, 324].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M0,-6 L0,-30" stroke="#d8c88a" strokeWidth={1} />
            <ellipse cx={0} cy={-32} rx={2.6} ry={3.4} fill={POLLEN} stroke="#a88a20" strokeWidth={0.5} />
          </g>
        ))}
      </g>
      <path d="M 170 30 L 124 72 M 176 36 L 127 75" stroke="#8a8a8a" strokeWidth={2.4} strokeLinecap="round" />
      <Callout x={82} y={74} tx={10} ty={24} text={stamens} max={14} />
      <Callout x={102} y={90} tx={190} ty={110} text={stigma} max={22} />
      <Callout x={170} y={32} tx={196} ty={24} text={tweezers} max={20} />
    </Frame>
  );
}

// --- 3. Ensacher / encager avec des mouches -------------------------------------

export function BagIllustration({ bag, insects, caption }: { bag: string; insects: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 110 172 L 110 60" stroke={STEM} strokeWidth={2.4} />
      <Umbel x={110} y={46} r={26} state="open" />
      <path d="M 70 14 L 150 14 L 156 120 Q 110 128 64 120 Z" fill={BAG} stroke="#b9ae8e" strokeWidth={1} opacity={0.82} />
      <rect x={100} y={120} width={20} height={4} fill="#9a9a9a" />
      <Callout x={152} y={60} tx={176} ty={46} text={bag} max={22} />
      {[
        [96, 70],
        [124, 84],
      ].map(([fx, fy], i) => (
        <g key={i} transform={`translate(${fx} ${fy})`}>
          <ellipse cx={0} cy={0} rx={4} ry={2.6} fill="#2e4a5a" />
          <ellipse cx={-2} cy={-3} rx={2.6} ry={1.6} fill="#dfe8ee" opacity={0.85} />
          <ellipse cx={2} cy={-3} rx={2.6} ry={1.6} fill="#dfe8ee" opacity={0.85} />
        </g>
      ))}
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

// --- 4. Polliniser : ombelle contre ombelle --------------------------------------

export function PollinateIllustration({ stigma, pollen, caption }: { stigma: string; pollen: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 86 172 L 86 96" stroke={STEM} strokeWidth={2.4} />
      <Umbel x={86} y={82} r={26} state="open" purple={false} />
      <g transform="translate(132 46) rotate(160)">
        <Umbel x={0} y={0} r={22} state="open" purple={false} />
      </g>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={96 + i * 4} cy={60 + (i % 2) * 4} r={1.1} fill={POLLEN} />
      ))}
      <Callout x={104} y={82} tx={150} ty={118} text={stigma} max={24} />
      <Callout x={146} y={40} tx={186} ty={30} text={pollen} max={22} />
    </Frame>
  );
}

// --- 5. Étiqueter ------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 80 172 L 80 70" stroke={STEM} strokeWidth={2.4} />
      <Umbel x={80} y={56} r={24} state="open" />
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

// --- 6. Ombelles mûres et graines ----------------------------------------------------

export function SeedsIllustration({ wait, dry, caption }: { wait: string; dry: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 84 150 L 84 70" stroke="#8a7a4a" strokeWidth={2.2} />
      <Umbel x={84} y={56} r={30} state="seed" />
      <text x={84} y={166} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <path d="M 140 90 L 180 90" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 176 86 L 182 90 L 176 94" fill="none" stroke={INK_SOFT} strokeWidth={1.4} />
      <g transform="translate(244 94)">
        <ellipse rx={56} ry={22} fill="#fbfaf5" stroke="#b9b3a2" />
        {Array.from({ length: 21 }, (_, i) => {
          const cx = -40 + (i % 7) * 13;
          const cy = -7 + Math.floor(i / 7) * 7;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${(i * 37) % 180})`}>
              <ellipse rx={3.2} ry={1.8} fill="#7a5a32" />
              {i % 3 === 0 && <path d="M-3,-2 l-1.5,-1.5 M0,-2 l0,-2 M3,-2 l1.5,-1.5" stroke="#7a5a32" strokeWidth={0.5} />}
            </g>
          );
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
