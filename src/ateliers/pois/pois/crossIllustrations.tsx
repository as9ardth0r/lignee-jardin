/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * du pois, le geste de Mendel : choisir un bouton encore fermé, ouvrir la
 * carène et retirer les 10 étamines, prendre le pollen d’une fleur ouverte
 * du père, le déposer sur le stigmate, étiqueter, récolter les gousses.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#6a8a4a';
const PETAL = '#fbf8f0';
const PETAL_EDGE = '#b9ae9a';
const KEEL = '#efe9d8';
const ANTHER = '#f2c230';
const ANTHER_DEEP = '#c8921a';
const POD = '#8fb04a';
const POD_DEEP = '#5e7d2a';

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

/** Fleur de pois vue de profil : étendard, aile, carène. */
function Flower({ x, y, s = 1, open = true }: { x: number; y: number; s?: number; open?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -4 0 L -10 2" stroke={STEM} strokeWidth={1.4} />
      <path d="M -4 -1 C -6 -6 -3 -8 0 -8 L 2 2 Z" fill="#9ab86a" stroke="#5e7d34" strokeWidth={0.6} />
      {open ? (
        <>
          <path d="M 0 -6 C 2 -24 22 -26 22 -8 C 18 -10 8 -8 2 -2 Z" fill={PETAL} stroke={PETAL_EDGE} strokeWidth={0.8} />
          <path d="M 2 -2 C 6 -10 18 -10 20 -2 C 14 2 6 2 2 -2 Z" fill="#f4efe2" stroke={PETAL_EDGE} strokeWidth={0.7} />
          <path d="M 2 0 C 8 -2 16 0 18 4 C 12 6 6 4 2 0 Z" fill={KEEL} stroke={PETAL_EDGE} strokeWidth={0.7} />
        </>
      ) : (
        <path d="M 0 -4 C 4 -12 14 -10 14 -2 C 10 2 4 2 0 -1 Z" fill="#eef0d8" stroke={PETAL_EDGE} strokeWidth={0.8} />
      )}
    </g>
  );
}

// --- 1. Repérer le bouton -------------------------------------------------------

export function IdIllustration({ bud, flower, keel, caption }: { bud: string; flower: string; keel: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 70 176 C 72 140 66 100 74 40" fill="none" stroke={STEM} strokeWidth={3} />
      <path d="M 72 120 C 90 112 104 104 112 92" fill="none" stroke={STEM} strokeWidth={1.4} />
      <path d="M 70 80 C 86 72 96 62 104 52" fill="none" stroke={STEM} strokeWidth={1.4} />
      <Flower x={118} y={92} s={1.8} />
      <Flower x={108} y={52} s={1.5} open={false} />
      <Callout x={124} y={42} tx={176} ty={30} text={bud} max={24} />
      <Callout x={148} y={64} tx={196} ty={70} text={flower} max={20} />
      <Callout x={140} y={100} tx={176} ty={118} text={keel} max={24} />
    </Frame>
  );
}

// --- 2. Castrer -------------------------------------------------------------------------

export function EmasculateIllustration({ stamens, tweezers, stigma, caption }: { stamens: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 40 150 L 90 120" stroke={STEM} strokeWidth={2.4} />
      {/* bouton ouvert : carène écartée, pistil courbé au centre */}
      <path d="M 90 120 C 100 100 130 96 150 104" fill="none" stroke="#a7b85a" strokeWidth={3} />
      <circle cx={152} cy={104} r={3} fill="#c9d48a" stroke="#6a7a3a" strokeWidth={0.6} />
      <path d="M 92 126 C 110 140 140 140 160 128" fill={KEEL} stroke={PETAL_EDGE} strokeWidth={1} />
      <path d="M 92 114 C 104 86 132 80 150 88" fill="none" stroke={PETAL_EDGE} strokeWidth={1} strokeDasharray="3 2" />
      {/* étamines retirées */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${196 + i * 7} ${62 + (i % 2) * 4}) rotate(${20 - i * 6})`}>
          <path d="M 0 0 L 0 12" stroke="#d8c88a" strokeWidth={1} />
          <ellipse cx={0} cy={0} rx={1.8} ry={3} fill={ANTHER} stroke={ANTHER_DEEP} strokeWidth={0.4} />
        </g>
      ))}
      <path d="M 230 30 L 190 66 M 236 36 L 194 70" stroke="#8a8a8a" strokeWidth={2.6} strokeLinecap="round" />
      <Callout x={204} y={70} tx={252} ty={110} text={stamens} anchor="middle" max={16} />
      <Callout x={152} y={104} tx={150} ty={160} text={stigma} anchor="middle" max={30} />
      <Callout x={232} y={34} tx={252} ty={22} text={tweezers} max={14} />
    </Frame>
  );
}

// --- 3. Prendre le pollen --------------------------------------------------------------

export function PollenIllustration({ open, brush, caption }: { open: string; brush: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 40 160 C 50 130 60 110 70 96" fill="none" stroke={STEM} strokeWidth={2.4} />
      <Flower x={84} y={92} s={2.2} />
      {/* carène pressée : le pistil sort, couvert de pollen */}
      <path d="M 110 98 C 124 92 134 88 140 80" fill="none" stroke="#a7b85a" strokeWidth={2.4} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={128 + i * 2.2} cy={88 - i * 1.6} r={1.3} fill={ANTHER} />
      ))}
      <path d="M 190 40 L 146 76" stroke="#7a5a3a" strokeWidth={3} strokeLinecap="round" />
      <path d="M 146 76 l -6 6" stroke="#d9b98a" strokeWidth={5} strokeLinecap="round" />
      <Callout x={96} y={66} tx={118} ty={22} text={open} max={18} />
      <Callout x={186} y={44} tx={210} ty={60} text={brush} max={18} />
    </Frame>
  );
}

// --- 4. Polliniser ---------------------------------------------------------------------------

export function PollinateIllustration({ stigma, pollen, caption }: { stigma: string; pollen: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 40 150 L 90 120" stroke={STEM} strokeWidth={2.4} />
      <path d="M 90 120 C 100 100 130 96 150 104" fill="none" stroke="#a7b85a" strokeWidth={3} />
      <circle cx={152} cy={104} r={3.2} fill="#e9d86a" stroke="#6a7a3a" strokeWidth={0.6} />
      <path d="M 92 126 C 110 140 140 140 160 128" fill={KEEL} stroke={PETAL_EDGE} strokeWidth={1} />
      <path d="M 210 56 L 160 98" stroke="#7a5a3a" strokeWidth={3} strokeLinecap="round" />
      <path d="M 160 98 l -6 6" stroke={ANTHER} strokeWidth={5} strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={150 + i * 2} cy={100 + (i % 2) * 2} r={1.1} fill={ANTHER} />
      ))}
      <Callout x={150} y={106} tx={120} ty={160} text={stigma} anchor="middle" max={30} />
      <Callout x={206} y={60} tx={226} ty={84} text={pollen} max={20} />
    </Frame>
  );
}

// --- 5. Étiqueter -----------------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 60 176 C 62 140 58 100 64 40" fill="none" stroke={STEM} strokeWidth={3} />
      <path d="M 62 110 C 74 104 82 98 88 88" fill="none" stroke={STEM} strokeWidth={1.4} />
      <Flower x={96} y={86} s={1.4} />
      <path d="M 86 92 C 110 94 130 98 150 100" fill="none" stroke="#b8412a" strokeWidth={1.6} />
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

// --- 6. Gousses et graines ------------------------------------------------------------------------

export function SeedsIllustration({ wait, seeds, caption }: { wait: string; seeds: string; caption: string }) {
  return (
    <Frame label={caption}>
      <g transform="translate(30 70)">
        <path d="M 0 0 C 10 -22 90 -22 104 0 C 90 12 10 12 0 0 Z" fill="#c9b27a" stroke="#8a7a4a" strokeWidth={1.2} />
        <path d="M 10 -2 C 30 -10 80 -10 96 -2" fill="none" stroke="#8a7a4a" strokeWidth={0.8} />
      </g>
      <text x={82} y={104} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <path d="M 150 70 L 186 70" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 182 66 L 188 70 L 182 74" fill="none" stroke={INK_SOFT} strokeWidth={1.4} />
      <g transform="translate(200 50)">
        <path d="M 0 20 C 6 -2 90 -2 100 20 C 90 32 6 32 0 20 Z" fill={POD} stroke={POD_DEEP} strokeWidth={1} />
        <path d="M 6 20 C 12 10 86 10 94 20 C 86 26 12 26 6 20 Z" fill="#eef3d8" />
        {[18, 34, 50, 66, 82].map((cx, i) => (
          <circle key={i} cx={cx} cy={19} r={6} fill={i % 2 ? '#8fb04a' : '#e9c84a'} stroke={i % 2 ? '#5e7d2a' : '#b8962a'} />
        ))}
      </g>
      <text x={250} y={104} textAnchor="middle">
        {seeds}
      </text>
    </Frame>
  );
}
