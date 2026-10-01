/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * des haricots : repérer le bouton, le castrer, prendre le pollen du père
 * avec son style en « goupillon », polliniser, étiqueter, récolter.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STANDARD = '#c79be0';
const STANDARD_EDGE = '#8a5aa8';
const WING = '#e4d4f2';
const KEEL = '#f2ecf8';
const POLLEN = '#f2dc6a';
const STIGMA = '#b9c46a';
const STEM = '#4c7a2c';
const POD = '#5f9a3a';
const POD_DRY = '#d8c48e';

const W = 320;
const H = 180;

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={8} fill="#f3ecd9" stroke="#e8dcc0" />
      <defs>
        <marker id="bn-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
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

/** Fleur de haricot ouverte, de profil : étendard, ailes, carène spiralée. */
function OpenFlower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,0 C-4,-6 -6,-12 -2,-16" stroke={STEM} strokeWidth={2} fill="none" />
      <path d="M-4,-16 C-22,-30 -6,-46 10,-34 C18,-28 14,-18 4,-14 Z" fill={STANDARD} stroke={STANDARD_EDGE} strokeWidth={0.8} />
      <path d="M2,-16 C12,-12 22,-4 18,4 C10,4 4,-6 2,-16 Z" fill={WING} stroke={STANDARD_EDGE} strokeWidth={0.6} />
      <path d="M2,-14 C10,-6 10,6 0,8 C-6,8 -4,0 2,-2 C6,-4 4,-10 2,-14 Z" fill={KEEL} stroke="#b9a8c8" strokeWidth={0.6} />
    </g>
  );
}

/** Bouton fermé : étendard encore enroulé. */
function Bud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,0 C-2,-6 -2,-10 0,-14" stroke={STEM} strokeWidth={2} fill="none" />
      <path d="M-4,-14 L4,-14 L3,-11 L-3,-11 Z" fill={STEM} />
      <path d="M-5,-14 C-8,-24 -2,-32 3,-30 C8,-26 6,-18 5,-14 Z" fill={STANDARD} stroke={STANDARD_EDGE} strokeWidth={0.8} />
    </g>
  );
}

// --- 1. Repérer le bon bouton -------------------------------------------------

export function IdIllustration({ bud, flower, caption }: { bud: string; flower: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 40 170 C 70 120 120 90 170 80 C 210 72 250 74 290 60" stroke={STEM} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M 120 98 L 112 76" stroke={STEM} strokeWidth={2} />
      <Bud x={112} y={78} s={1.6} />
      <text x={140} y={128} textAnchor="middle" fontWeight={600}>
        {bud}
      </text>
      <path d="M 240 74 L 236 58" stroke={STEM} strokeWidth={2} />
      <OpenFlower x={236} y={60} s={1.6} />
      <text x={240} y={140} textAnchor="middle" fontWeight={600}>
        {flower}
      </text>
    </Frame>
  );
}

// --- 2. Castrer le bouton --------------------------------------------------------

export function EmasculateIllustration({ stamens, tweezers, stigma, caption }: { stamens: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 110 170 C 108 150 110 136 112 120" stroke={STEM} strokeWidth={3} fill="none" />
      <path d="M 104 120 L 120 120 L 118 114 L 106 114 Z" fill={STEM} />
      {/* étendard et ailes rabattus, carène ouverte */}
      <path d="M 104 114 C 80 104 74 84 86 74 C 92 92 100 104 108 110 Z" fill={STANDARD} stroke={STANDARD_EDGE} strokeWidth={0.8} />
      <path d="M 118 114 C 140 104 146 86 136 76 C 130 92 122 104 114 110 Z" fill={WING} stroke={STANDARD_EDGE} strokeWidth={0.6} />
      {/* style spiralé et stigmate */}
      <path d="M 112 114 C 112 96 118 86 112 76 C 108 70 112 64 116 66" stroke={STIGMA} strokeWidth={2} fill="none" />
      <circle cx={116} cy={66} r={2.6} fill={STIGMA} stroke="#7d8a3a" strokeWidth={0.5} />
      {/* étamines restantes */}
      {[-6, -3, 3, 6].map((d, i) => (
        <g key={i}>
          <path d={`M ${112 + d * 0.4} 112 L ${112 + d} 86`} stroke="#d9cfa0" strokeWidth={0.8} />
          <ellipse cx={112 + d} cy={84} rx={1.6} ry={2.4} fill={POLLEN} stroke="#b8a030" strokeWidth={0.4} />
        </g>
      ))}
      {/* étamines retirées */}
      {[
        [200, 150],
        [212, 156],
        [190, 160],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={1.6} ry={2.6} fill={POLLEN} stroke="#b8a030" strokeWidth={0.4} />
      ))}
      <path d="M 280 40 L 120 82 M 286 50 L 122 86" stroke="#8a8f96" strokeWidth={3} strokeLinecap="round" />
      <Callout x={106} y={86} tx={60} ty={60} text={stamens} anchor="end" max={16} />
      <Callout x={118} y={66} tx={150} ty={36} text={stigma} max={18} />
      <Callout x={240} y={52} tx={236} ty={92} text={tweezers} max={14} />
    </Frame>
  );
}

// --- 3. Prendre le pollen du père ----------------------------------------------

export function PickIllustration({ brush, caption }: { brush: string; caption: string }) {
  return (
    <Frame label={caption}>
      <circle cx={34} cy={36} r={11} fill="#f5c85a" />
      <g transform="translate(140 100) rotate(-20)">
        <OpenFlower x={0} y={0} s={1.8} />
      </g>
      {/* style « goupillon » qui sort de la carène pressée, chargé de pollen */}
      <path d="M 150 104 C 168 96 178 84 190 70" stroke={STIGMA} strokeWidth={2.2} fill="none" />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={176 + i * 1.6} cy={86 - i * 1.8} r={1.4} fill={POLLEN} stroke="#c9a820" strokeWidth={0.3} />
      ))}
      <path d="M 120 140 q 14 -10 26 -4" fill="none" stroke={INK_SOFT} strokeWidth={1} markerEnd="url(#bn-arrow)" />
      <Callout x={182} y={80} tx={230} ty={60} text={brush} max={18} />
    </Frame>
  );
}

// --- 4. Polliniser -------------------------------------------------------------------

export function PollinateIllustration({ stigma, brush, caption }: { stigma: string; brush: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 100 170 C 98 150 100 136 102 120" stroke={STEM} strokeWidth={3} fill="none" />
      <path d="M 94 120 L 110 120 L 108 114 L 96 114 Z" fill={STEM} />
      <path d="M 94 114 C 70 104 64 84 76 74 C 82 92 90 104 98 110 Z" fill={STANDARD} stroke={STANDARD_EDGE} strokeWidth={0.8} />
      <path d="M 102 114 C 102 96 108 86 102 76 C 98 70 102 64 106 66" stroke={STIGMA} strokeWidth={2} fill="none" />
      <circle cx={106} cy={66} r={2.8} fill={POLLEN} stroke="#7d8a3a" strokeWidth={0.5} />
      {/* fleur du père tenue à la pince, style contre le stigmate */}
      <path d="M 260 30 L 160 56" stroke="#8a8f96" strokeWidth={3} strokeLinecap="round" />
      <g transform="translate(160 60) rotate(160)">
        <OpenFlower x={0} y={0} s={1.1} />
      </g>
      <path d="M 150 62 C 132 64 118 66 108 66" stroke={STIGMA} strokeWidth={2} fill="none" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={112 + i * 4} cy={65 - (i % 2)} r={1.3} fill={POLLEN} />
      ))}
      <Callout x={104} y={70} tx={12} ty={150} text={stigma} max={16} />
      <Callout x={140} y={63} tx={190} ty={110} text={brush} max={18} />
    </Frame>
  );
}

// --- 5. Étiqueter ---------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 90 10 C 92 40 88 60 90 80" stroke={STEM} strokeWidth={3} fill="none" />
      {/* jeune gousse qui pointe */}
      <path d="M 90 80 C 94 100 96 130 92 160 C 90 164 86 164 86 160 C 88 130 86 100 86 80 Z" fill={POD} stroke="#3a6a22" strokeWidth={0.8} />
      <path d="M 92 64 C 120 70 140 84 160 98" fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <circle cx={90} cy={64} r={3} fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <g transform="translate(160 78) rotate(-4)">
        <path d="M 0 22 L 12 12 L 140 12 L 140 70 L 12 70 L 0 60 Z" fill="#fffdf6" stroke={INK_SOFT} strokeWidth={1} />
        <circle cx={9} cy={40} r={3} fill="#f3ecd9" stroke={INK_SOFT} />
        <text x={20} y={30} fontSize={10} fontWeight={600}>
          {line1}
        </text>
        <text x={20} y={45} fontSize={10}>
          {line2}
        </text>
        <text x={20} y={60} fontSize={9} fill={INK_SOFT}>
          {line3}
        </text>
      </g>
    </Frame>
  );
}

// --- 6. Récolter les graines ---------------------------------------------------------

export function SeedsIllustration({ wait, dry, caption }: { wait: string; dry: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* gousse sèche, ouverte */}
      <g transform="translate(30 70) rotate(-10)">
        <path d="M 0 20 C 30 0 80 -4 110 6 C 84 22 34 34 0 20 Z" fill={POD_DRY} stroke="#9e8656" strokeWidth={1.2} />
        {[20, 38, 56, 74, 90].map((x, i) => (
          <ellipse key={i} cx={x} cy={14 - i * 0.6} rx={7} ry={4.5} fill="#7a4f2c" stroke="#4c2f18" strokeWidth={0.6} />
        ))}
      </g>
      <text x={84} y={130} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <path d="M 150 84 L 180 84" stroke={INK_SOFT} strokeWidth={1.4} markerEnd="url(#bn-arrow)" />
      <g transform="translate(244 86)">
        <ellipse rx={56} ry={22} fill="#fbfaf5" stroke="#b9b3a2" />
        {Array.from({ length: 12 }, (_, i) => {
          const x = -34 + (i % 6) * 13 + (i > 5 ? 6 : 0);
          const y = i > 5 ? 6 : -5;
          return <ellipse key={i} cx={x} cy={y} rx={5.5} ry={3.6} fill="#7a4f2c" stroke="#4c2f18" strokeWidth={0.5} />;
        })}
      </g>
      <text x={244} y={130} textAnchor="middle">
        {dry}
      </text>
    </Frame>
  );
}
