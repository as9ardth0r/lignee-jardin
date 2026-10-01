/**
 * Illustrations pédagogiques (SVG dessinés à la main) de la pollinisation
 * manuelle du maïs : reconnaître panicule et épi, ensacher l’épi avant la
 * sortie des soies, ensacher la panicule du père la veille, récolter le
 * pollen, polliniser, refermer et étiqueter, récolter l’épi (xénie).
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#5d8a3a';
const LEAF = '#6c9a46';
const LEAF_DARK = '#3f6b3a';
const HUSK = '#a9bf72';
const SILK = '#d9a35a';
const TASSEL = '#c9b46a';
const POLLEN = '#f5c211';
const GLASSINE = '#f4f1e6';
const PAPER = '#c9a46a';

const W = 320;
const H = 180;

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={8} fill="#f3ecd9" stroke="#e8dcc0" />
      <defs>
        <marker id="mz-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={INK_SOFT} />
        </marker>
      </defs>
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

/** Panicule (fleurs mâles) au sommet d’une tige. */
function Tassel({ x, y, s = 1, pollen = false }: { x: number; y: number; s?: number; pollen?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,0 L0,-34" stroke={TASSEL} strokeWidth={2.2} />
      {[-22, -12, 12, 22].map((a, i) => (
        <path key={i} d={`M0,${-8 - i * 5} q${a * 0.5},-6 ${a},${4 + Math.abs(a) * 0.2}`} stroke={TASSEL} strokeWidth={1.6} fill="none" />
      ))}
      {pollen && [-14, -6, 4, 12, 18, -18].map((d, i) => <circle key={i} cx={d} cy={-10 + (i % 3) * 6} r={1.1} fill={POLLEN} />)}
    </g>
  );
}

/** Épi encore dans ses spathes, avec ou sans soies. */
function EarShoot({ x, y, s = 1, silks = true, bag = false }: { x: number; y: number; s?: number; silks?: boolean; bag?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,0 C-6,-10 -6,-34 0,-46 C6,-34 6,-10 0,0 Z" fill={HUSK} stroke={LEAF_DARK} strokeWidth={0.9} />
      <path d="M0,-2 L0,-44" stroke={LEAF_DARK} strokeWidth={0.5} opacity={0.6} />
      {silks && [-8, -4, 0, 4, 8].map((d, i) => <path key={i} d={`M0,-46 q${d * 0.6},-8 ${d},-16`} stroke={SILK} strokeWidth={1} fill="none" />)}
      {bag && <path d="M-11,-58 L11,-58 L11,-14 Q0,-8 -11,-14 Z" fill={GLASSINE} stroke="#b9ae8e" strokeWidth={0.9} opacity={0.92} />}
    </g>
  );
}

// --- 1. Reconnaître panicule et épi -------------------------------------------

export function IdIllustration({ tassel, ear, silks, caption }: { tassel: string; ear: string; silks: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 120 176 C 120 120 118 80 120 44" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M 120 150 C 96 140 80 142 60 150" stroke={LEAF} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M 120 90 C 146 82 164 84 186 92" stroke={LEAF} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Tassel x={120} y={46} pollen />
      <g transform="rotate(25 120 120)">
        <EarShoot x={120} y={124} />
      </g>
      <Callout x={128} y={22} tx={170} ty={24} text={`♂ ${tassel}`} max={22} />
      <Callout x={128} y={108} tx={176} ty={128} text={`♀ ${ear}`} max={20} />
      <Callout x={134} y={74} tx={180} ty={64} text={silks} max={22} />
    </Frame>
  );
}

// --- 2. Ensacher l’épi avant la sortie des soies ----------------------------------

export function CoverIllustration({ bag, early, caption }: { bag: string; early: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 110 176 C 110 140 108 110 110 80" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <g transform="rotate(20 110 140)">
        <EarShoot x={110} y={144} silks={false} bag />
      </g>
      <Callout x={128} y={92} tx={168} ty={78} text={bag} max={22} />
      <text x={230} y={140} textAnchor="middle" fill={INK_SOFT}>
        {wrap(early, 24).map((l, i) => (
          <tspan key={i} x={230} dy={i === 0 ? 0 : 11}>
            {l}
          </tspan>
        ))}
      </text>
    </Frame>
  );
}

// --- 3. Ensacher la panicule du père -----------------------------------------------

export function TasselBagIllustration({ bag, evening, caption }: { bag: string; evening: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 70 32 a 14 14 0 1 0 12 20 a 11 11 0 1 1 -12 -20 z" fill="#d6c58a" opacity={0.8} />
      <text x={60} y={78} textAnchor="middle" fill={INK_SOFT}>
        {evening}
      </text>
      <path d="M 180 176 C 180 140 178 110 180 84" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M 160 22 L 200 22 L 204 90 L 156 90 Z" fill={PAPER} stroke="#8a6a3a" strokeWidth={1} />
      <path d="M 156 90 Q 180 98 204 90" fill="none" stroke="#8a6a3a" strokeWidth={1} />
      <rect x={172} y={92} width={16} height={4} fill="#9a9a9a" />
      <Callout x={200} y={50} tx={228} ty={46} text={bag} max={18} />
    </Frame>
  );
}

// --- 4. Récolter le pollen et polliniser ------------------------------------------------

export function PollinateIllustration({ pollen, silks, caption }: { pollen: string; silks: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* sac de pollen versé */}
      <g transform="translate(70 56) rotate(35)">
        <path d="M -18 -30 L 18 -30 L 20 30 L -20 30 Z" fill={PAPER} stroke="#8a6a3a" strokeWidth={1} />
      </g>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <circle key={i} cx={94 + i * 4} cy={86 + (i % 3) * 5 + i * 2} r={1.3} fill={POLLEN} />
      ))}
      <path d="M 170 176 C 170 150 168 130 170 110" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <g transform="rotate(-15 170 150)">
        <EarShoot x={170} y={150} />
      </g>
      <Callout x={108} y={100} tx={40} ty={140} text={pollen} max={16} />
      <Callout x={160} y={92} tx={210} ty={72} text={silks} max={18} />
    </Frame>
  );
}

// --- 5. Refermer et étiqueter --------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 80 176 C 80 150 78 130 80 110" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <g transform="translate(80 120) rotate(-10)">
        <path d="M -20 -70 L 20 -70 L 22 0 L -22 0 Z" fill={PAPER} stroke="#8a6a3a" strokeWidth={1} />
        <rect x={-10} y={-2} width={20} height={4} fill="#9a9a9a" />
        <text x={0} y={-44} textAnchor="middle" fontSize={7.5} fill={INK} fontWeight={600}>
          {line1.slice(0, 9)}
        </text>
        <text x={0} y={-34} textAnchor="middle" fontSize={7.5} fill={INK}>
          ×
        </text>
      </g>
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

// --- 6. Récolter l’épi : la xénie ----------------------------------------------------------

export function SeedsIllustration({ wait, xenia, caption }: { wait: string; xenia: string; caption: string }) {
  const rows = 6;
  const cols = 16;
  const kernels: ReactNode[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const purple = (c * 7 + r * 3) % 4 !== 0;
      const x = 52 + c * 13;
      const y = 72 + r * 9 - Math.abs(r - 2.5) * 0.5;
      kernels.push(<rect key={`${c}-${r}`} x={x} y={y} width={11} height={8} rx={3} fill={purple ? '#4b2a5e' : '#f2c230'} stroke={purple ? '#2a1636' : '#c8921a'} strokeWidth={0.5} />);
    }
  }
  return (
    <Frame label={caption}>
      <ellipse cx={156} cy={98} rx={112} ry={32} fill="#e6dcc0" />
      {kernels}
      <path d="M 44 90 C 30 70 20 66 10 70 M 44 104 C 30 120 22 126 12 124" stroke={HUSK} strokeWidth={3} fill="none" />
      <text x={160} y={30} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <text x={160} y={156} textAnchor="middle" fontWeight={600}>
        {wrap(xenia, 48).map((l, i) => (
          <tspan key={i} x={160} dy={i === 0 ? 0 : 11}>
            {l}
          </tspan>
        ))}
      </text>
    </Frame>
  );
}
