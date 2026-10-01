/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * des piments : reconnaître le bouton, le castrer, récolter le pollen,
 * polliniser, ensacher et étiqueter, récolter les graines.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const PETAL = '#fbfaf2';
const PETAL_EDGE = '#b9b49c';
const ANTHER = '#6a6fc2';
const ANTHER_DEEP = '#454a92';
const POLLEN = '#f2dc6a';
const STIGMA = '#c9d36a';
const STEM = '#4c7a2c';
const GREEN_DARK = '#2f5a24';
const RED = '#d42a1c';
const RED_DEEP = '#8a130b';

const W = 320;
const H = 180;

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={8} fill="#f3ecd9" stroke="#e8dcc0" />
      <defs>
        <marker id="pp-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
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

/** Fleur ouverte vue de face : étoile blanche à 5-6 pétales, anthères bleues. */
function OpenFlower({ x, y, s = 1, anthers = true }: { x: number; y: number; s?: number; anthers?: boolean }) {
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {petals.map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0,0 C6,-6 5,-18 0,-24 C-5,-18 -6,-6 0,0 Z" fill={PETAL} stroke={PETAL_EDGE} strokeWidth={0.8} />
      ))}
      <circle r={5} fill="#e6edc0" />
      {anthers &&
        petals.map((a) => (
          <ellipse key={`a${a}`} transform={`rotate(${a + 30}) translate(0 -7)`} rx={2.2} ry={3.6} fill={ANTHER} stroke={ANTHER_DEEP} strokeWidth={0.5} />
        ))}
      <circle r={2.2} fill={STIGMA} stroke="#7d8a3a" strokeWidth={0.5} />
    </g>
  );
}

/** Bouton fermé, pendant : pétales blancs encore joints. */
function Bud({ x, y, s = 1, bag = false }: { x: number; y: number; s?: number; bag?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,-30 L0,-10" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M-7,-10 Q0,-15 7,-10 L5,-6 L-5,-6 Z" fill={STEM} />
      <path d="M-6,-6 C-8,6 -4,16 0,20 C4,16 8,6 6,-6 Z" fill={PETAL} stroke={PETAL_EDGE} strokeWidth={0.8} />
      <path d="M-2,-5 C-3,6 -1,14 0,19 M2,-5 C3,6 1,14 0,19" stroke={PETAL_EDGE} strokeWidth={0.6} fill="none" />
      {bag && <path d="M-16,-16 C-20,10 -14,32 0,36 C14,32 20,10 16,-16 Z" fill="#ffffff" fillOpacity={0.35} stroke="#b9ae8e" strokeDasharray="2 2" />}
    </g>
  );
}

// --- 1. Reconnaître le bon bouton ----------------------------------------------

export function IdIllustration({ bud, flower, anthers, caption }: { bud: string; flower: string; anthers: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 40 170 C 60 120 70 70 100 40 M 100 40 C 150 20 200 26 250 40" stroke={STEM} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Bud x={100} y={78} s={1.2} />
      <text x={100} y={152} textAnchor="middle" fontWeight={600}>
        {bud}
      </text>
      <path d="M 250 40 L 250 64" stroke={STEM} strokeWidth={2.4} />
      <OpenFlower x={250} y={96} s={1.2} />
      <text x={250} y={150} textAnchor="middle" fontWeight={600}>
        {flower}
      </text>
      <Callout x={244} y={88} tx={196} ty={84} text={anthers} anchor="end" max={24} />
    </Frame>
  );
}

// --- 2. Castrer le bouton de la mère ----------------------------------------------

export function EmasculateIllustration({ anthers, tweezers, stigma, caption }: { anthers: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 110 20 L 110 58" stroke={STEM} strokeWidth={3} strokeLinecap="round" />
      <path d="M 100 58 Q 110 52 120 58 L 118 64 L 102 64 Z" fill={STEM} />
      {/* pétales écartés */}
      <path d="M 104 66 C 88 80 80 96 78 110 Q 92 102 102 84 Z M 116 66 C 132 80 140 96 142 110 Q 128 102 118 84 Z" fill={PETAL} stroke={PETAL_EDGE} strokeWidth={0.8} />
      {/* ovaire, style, stigmate */}
      <ellipse cx={110} cy={72} rx={6} ry={5} fill="#9ac06a" stroke={GREEN_DARK} strokeWidth={0.6} />
      <path d="M 110 76 L 110 104" stroke="#b9c46a" strokeWidth={2.2} />
      <circle cx={110} cy={106} r={3} fill={STIGMA} stroke="#7d8a3a" strokeWidth={0.6} />
      {/* deux anthères encore en place */}
      <ellipse cx={100} cy={92} rx={2.6} ry={5} fill={ANTHER} stroke={ANTHER_DEEP} strokeWidth={0.5} />
      <ellipse cx={120} cy={92} rx={2.6} ry={5} fill={ANTHER} stroke={ANTHER_DEEP} strokeWidth={0.5} />
      {/* anthères retirées */}
      {[
        [196, 150],
        [210, 156],
        [186, 162],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={2.6} ry={5} transform={`rotate(${40 * i} ${x} ${y})`} fill={ANTHER} stroke={ANTHER_DEEP} strokeWidth={0.5} />
      ))}
      <path d="M 280 40 L 124 90 M 286 50 L 126 94" stroke="#8a8f96" strokeWidth={3} strokeLinecap="round" />
      <Callout x={99} y={94} tx={70} ty={132} text={anthers} anchor="end" max={16} />
      <Callout x={112} y={108} tx={150} ty={140} text={stigma} max={16} />
      <Callout x={240} y={54} tx={236} ty={86} text={tweezers} max={14} />
    </Frame>
  );
}

// --- 3. Récolter le pollen du père -------------------------------------------------

export function PickIllustration({ pollen, caption }: { pollen: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* soleil du matin */}
      <circle cx={34} cy={36} r={11} fill="#f5c85a" />
      <path d="M 120 18 L 120 50" stroke={STEM} strokeWidth={2.4} />
      <g transform="rotate(180 120 78)">
        <OpenFlower x={120} y={78} s={1.1} />
      </g>
      {/* pollen tombé dans une cuillère */}
      <path d="M 70 150 Q 120 176 170 150 Q 120 160 70 150 Z" fill="#d9d4c3" stroke="#9a9480" />
      <path d="M 170 150 L 250 142" stroke="#9a9480" strokeWidth={4} strokeLinecap="round" />
      {Array.from({ length: 22 }, (_, i) => (
        <circle key={i} cx={96 + (i % 11) * 5} cy={153 + Math.floor(i / 11) * 3} r={1.4} fill={POLLEN} stroke="#c9a820" strokeWidth={0.3} />
      ))}
      {[104, 112, 120, 128, 136].map((x, i) => (
        <circle key={`f${i}`} cx={x} cy={112 + (i % 2) * 12} r={1.2} fill={POLLEN} />
      ))}
      <path d="M 196 80 q 10 -8 20 0" fill="none" stroke={INK_SOFT} strokeWidth={1} markerEnd="url(#pp-arrow)" />
      <Callout x={130} y={156} tx={210} ty={112} text={pollen} max={18} />
    </Frame>
  );
}

// --- 4. Polliniser -------------------------------------------------------------------

export function PollinateIllustration({ stigma, brush, caption }: { stigma: string; brush: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 110 20 L 110 58" stroke={STEM} strokeWidth={3} strokeLinecap="round" />
      <path d="M 100 58 Q 110 52 120 58 L 118 64 L 102 64 Z" fill={STEM} />
      <path d="M 104 66 C 88 80 80 96 78 110 Q 92 102 102 84 Z M 116 66 C 132 80 140 96 142 110 Q 128 102 118 84 Z" fill={PETAL} stroke={PETAL_EDGE} strokeWidth={0.8} />
      <ellipse cx={110} cy={72} rx={6} ry={5} fill="#9ac06a" stroke={GREEN_DARK} strokeWidth={0.6} />
      <path d="M 110 76 L 110 104" stroke="#b9c46a" strokeWidth={2.2} />
      <circle cx={110} cy={106} r={3.2} fill={POLLEN} stroke="#7d8a3a" strokeWidth={0.6} />
      {/* pinceau */}
      <path d="M 250 150 L 124 112" stroke="#b08a5a" strokeWidth={4} strokeLinecap="round" />
      <path d="M 126 113 L 114 109" stroke={POLLEN} strokeWidth={6} strokeLinecap="round" />
      <Callout x={106} y={108} tx={50} ty={140} text={stigma} anchor="end" max={16} />
      <Callout x={200} y={136} tx={220} ty={100} text={brush} max={16} />
    </Frame>
  );
}

// --- 5. Ensacher et étiqueter ------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 90 10 L 90 40" stroke={STEM} strokeWidth={3} />
      <Bud x={90} y={78} s={1.4} bag />
      <path d="M 94 60 C 120 70 140 90 160 104" fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <circle cx={92} cy={58} r={3} fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <g transform="translate(160 82) rotate(-4)">
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

// --- 6. Récolter les graines -----------------------------------------------------

export function SeedsIllustration({ wait, dry, gloves, caption }: { wait: string; dry: string; gloves: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* piment mûr ouvert en long */}
      <g transform="translate(24 60)">
        <path d="M 0 30 C 10 0 60 -4 90 10 C 70 30 30 52 0 30 Z" fill={RED} stroke={RED_DEEP} strokeWidth={1.2} />
        <path d="M 8 28 C 20 12 56 8 80 14 C 60 28 30 42 8 28 Z" fill="#f28a6a" />
        <path d="M 14 26 C 26 18 44 16 60 18" stroke="#f6e7b8" strokeWidth={4} fill="none" strokeLinecap="round" />
        {[18, 26, 34, 42, 50, 58].map((x, i) => (
          <ellipse key={i} cx={x} cy={20 + (i % 2) * 5} rx={3} ry={2} fill="#f3e2a2" stroke="#b8943c" strokeWidth={0.5} />
        ))}
      </g>
      <text x={70} y={130} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <path d="M 130 80 L 164 80" stroke={INK_SOFT} strokeWidth={1.4} markerEnd="url(#pp-arrow)" />
      {/* graines sur une assiette */}
      <g transform="translate(236 84)">
        <ellipse rx={56} ry={22} fill="#fbfaf5" stroke="#b9b3a2" />
        <ellipse rx={44} ry={15} fill="#ffffff" stroke="#d9d2bd" strokeWidth={0.6} />
        {Array.from({ length: 16 }, (_, i) => {
          const x = -36 + (i % 8) * 10 + (i > 7 ? 5 : 0);
          const y = i > 7 ? 5 : -4;
          return <circle key={i} cx={x} cy={y} r={2.6} fill="#f1e2a8" stroke="#b8943c" strokeWidth={0.5} />;
        })}
      </g>
      <text x={236} y={128} textAnchor="middle">
        {dry}
      </text>
      <text x={236} y={160} textAnchor="middle" fill="#b8412a" fontWeight={600}>
        🧤 {gloves}
      </text>
    </Frame>
  );
}
