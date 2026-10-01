/**
 * Illustrations pédagogiques (SVG dessinés à la main) de la pollinisation
 * manuelle des courges : reconnaître les fleurs, les fermer la veille,
 * cueillir la fleur mâle, polliniser, refermer et étiqueter, récolter.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const PETAL = '#f2b632';
const PETAL_DARK = '#c47f12';
const PETAL_LIGHT = '#f8d36a';
const GREEN_DARK = '#3f6b3a';
const STEM = '#5d7f48';
const POLLEN = '#f5c211';
const TAPE = '#e9e2cf';
const SQUASH = '#e8801e';
const SQUASH_DEEP = '#a8500c';

const W = 320;
const H = 180;

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={8} fill="#f3ecd9" stroke="#e8dcc0" />
      <defs>
        <marker id="sq-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
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

function Callout({ x, y, tx, ty, text, anchor = 'start', color = INK, max = 20 }: { x: number; y: number; tx: number; ty: number; text: string; anchor?: 'start' | 'end' | 'middle'; color?: string; max?: number }) {
  const lines = wrap(text, max);
  const dx = anchor === 'start' ? 3 : anchor === 'end' ? -3 : 0;
  return (
    <g>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={INK_SOFT} strokeWidth={0.8} />
      <circle cx={x} cy={y} r={1.6} fill={INK_SOFT} />
      <text x={tx + dx} y={ty + 3} textAnchor={anchor} fill={color}>
        {lines.map((l, i) => (
          <tspan key={i} x={tx + dx} dy={i === 0 ? 0 : 11}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}

/** Fleur ouverte de profil, vers le haut : corolle en trompette à 5 pointes. */
function OpenFlower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -6 0 C -14 -16 -30 -28 -40 -40 L -26 -38 L -20 -48 L -8 -40 L 0 -52 L 8 -40 L 20 -48 L 26 -38 L 40 -40 C 30 -28 14 -16 6 0 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={1} />
      <path d="M -4 -4 C -10 -16 -18 -26 -24 -34 M 4 -4 C 10 -16 18 -26 24 -34 M 0 -4 L 0 -40" stroke={PETAL_DARK} strokeWidth={0.7} fill="none" opacity={0.6} />
      <path d="M -8 2 L -14 -6 M 8 2 L 14 -6 M 0 3 L 0 -6" stroke={GREEN_DARK} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** Bouton fermé de profil (pointes jointes), vers le haut. */
function ClosedBud({ x, y, s = 1, taped = false }: { x: number; y: number; s?: number; taped?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -7 0 C -14 -14 -12 -34 0 -46 C 12 -34 14 -14 7 0 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={1} />
      <path d="M -3 -2 C -6 -16 -5 -32 0 -44 M 3 -2 C 6 -16 5 -32 0 -44" stroke={PETAL_DARK} strokeWidth={0.7} fill="none" opacity={0.6} />
      {taped && <rect x={-9} y={-44} width={18} height={9} rx={1.5} fill={TAPE} stroke="#b9ae8e" strokeWidth={0.8} transform="rotate(-8 0 -40)" />}
      <path d="M -7 2 L -12 -6 M 7 2 L 12 -6" stroke={GREEN_DARK} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** Ovaire : petite courge sous la fleur femelle. */
function Ovary({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={10} rx={8} ry={12} fill="#7fa25a" stroke={GREEN_DARK} strokeWidth={1} />
      {[-4, 0, 4].map((d) => (
        <path key={d} d={`M ${d} 0 Q ${d * 1.6} 10 ${d} 21`} stroke={GREEN_DARK} strokeWidth={0.6} fill="none" opacity={0.6} />
      ))}
    </g>
  );
}

// --- 1. Reconnaître les fleurs ---------------------------------------------

export function IdIllustration({ female, male, ovary, stalk, caption }: { female: string; male: string; ovary: string; stalk: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* femelle : tige courte + ovaire + fleur */}
      <path d="M 90 168 C 90 150 88 140 88 128" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ovary x={88} y={104} />
      <OpenFlower x={88} y={104} />
      <circle cx={88} cy={92} r={4} fill="#e6a51c" stroke={PETAL_DARK} strokeWidth={0.6} />
      <text x={88} y={32} textAnchor="middle" fontWeight={600}>
        ♀ {female}
      </text>
      <Callout x={96} y={118} tx={124} ty={136} text={ovary} max={16} />

      {/* mâle : longue tige fine */}
      <path d="M 230 170 C 232 140 228 120 230 96" stroke={STEM} strokeWidth={2} fill="none" strokeLinecap="round" />
      <OpenFlower x={230} y={98} />
      <rect x={228} y={74} width={4} height={18} rx={2} fill={POLLEN} stroke={PETAL_DARK} strokeWidth={0.6} />
      <text x={230} y={32} textAnchor="middle" fontWeight={600}>
        ♂ {male}
      </text>
      <Callout x={231} y={140} tx={256} ty={150} text={stalk} max={14} />
    </Frame>
  );
}

// --- 2. La veille : fermer les fleurs --------------------------------------

export function CloseIllustration({ tape, evening, caption }: { tape: string; evening: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* lune et étoiles */}
      <path d="M 40 30 a 14 14 0 1 0 14 18 a 11 11 0 1 1 -14 -18 z" fill="#d9c98c" />
      {[
        [70, 24],
        [86, 40],
        [60, 52],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.4} fill="#b9ae8e" />
      ))}
      <text x={30} y={76} fill={INK_SOFT}>
        {evening}
      </text>
      {/* femelle fermée */}
      <path d="M 150 168 C 150 150 148 140 148 132" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ovary x={148} y={108} />
      <ClosedBud x={148} y={108} taped />
      <text x={148} y={46} textAnchor="middle" fontWeight={600}>
        ♀
      </text>
      {/* mâle fermé */}
      <path d="M 250 170 C 252 140 248 124 250 110" stroke={STEM} strokeWidth={2} fill="none" strokeLinecap="round" />
      <ClosedBud x={250} y={110} taped />
      <text x={250} y={48} textAnchor="middle" fontWeight={600}>
        ♂
      </text>
      <Callout x={157} y={66} tx={188} ty={56} text={tape} max={12} />
      <line x1={188} y1={56} x2={242} y2={66} stroke={INK_SOFT} strokeWidth={0.8} />
    </Frame>
  );
}

// --- 3. Le matin : cueillir la fleur mâle -------------------------------------

export function PickIllustration({ anther, caption }: { anther: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* soleil levant */}
      <circle cx={34} cy={40} r={12} fill="#f5c85a" />
      {[0, 45, 90, 135, 180].map((a) => (
        <line key={a} x1={34 + Math.cos(((a + 180) * Math.PI) / 180) * 16} y1={40 + Math.sin(((a + 180) * Math.PI) / 180) * 16} x2={34 + Math.cos(((a + 180) * Math.PI) / 180) * 22} y2={40 + Math.sin(((a + 180) * Math.PI) / 180) * 22} stroke="#f5c85a" strokeWidth={2} />
      ))}
      {/* fleur mâle cueillie, pétales retirés, tenue à la main */}
      <g transform="rotate(-25 150 110)">
        <path d="M 150 170 L 150 110" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M 144 112 L 139 104 M 156 112 L 161 104 M 150 113 L 150 105" stroke={GREEN_DARK} strokeWidth={2} strokeLinecap="round" />
        <rect x={146} y={70} width={8} height={40} rx={4} fill={POLLEN} stroke={PETAL_DARK} strokeWidth={0.8} />
        {[76, 84, 92, 100].map((y) => (
          <circle key={y} cx={150 + (y % 8) - 3} cy={y} r={1.2} fill="#e0a000" />
        ))}
      </g>
      {/* pétales retirés tombés */}
      <path d="M 230 150 C 240 140 262 138 272 146 C 262 152 244 156 230 150 Z" fill={PETAL_LIGHT} stroke={PETAL_DARK} strokeWidth={0.8} />
      <path d="M 244 164 C 256 156 278 158 286 166 C 274 170 256 172 244 164 Z" fill={PETAL_LIGHT} stroke={PETAL_DARK} strokeWidth={0.8} />
      <path d="M 196 112 L 214 112" stroke={INK_SOFT} strokeWidth={1.2} markerEnd="url(#sq-arrow)" />
      <Callout x={140} y={82} tx={196} ty={60} text={anther} max={18} />
    </Frame>
  );
}

// --- 4. Polliniser la fleur femelle ----------------------------------------

export function PollinateIllustration({ stigma, anther, caption }: { stigma: string; anther: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 130 172 C 130 158 128 150 128 142" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ovary x={128} y={118} />
      <OpenFlower x={128} y={118} s={1.25} />
      {/* stigmate à 3 lobes */}
      <path d="M 128 112 L 128 96" stroke="#d99a16" strokeWidth={4} strokeLinecap="round" />
      {[-7, 0, 7].map((d) => (
        <ellipse key={d} cx={128 + d} cy={92} rx={5} ry={4} fill="#e8b020" stroke={PETAL_DARK} strokeWidth={0.6} />
      ))}
      {[
        [122, 89],
        [127, 87],
        [133, 90],
        [130, 94],
        [124, 94],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.3} fill="#ffd21a" stroke="#c09000" strokeWidth={0.3} />
      ))}
      {/* étamine (fleur mâle sans pétales) qui frotte le stigmate */}
      <path d="M 212 34 C 190 48 168 64 152 76" stroke={STEM} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M 152 76 L 135 89" stroke={PETAL_DARK} strokeWidth={9.5} strokeLinecap="round" />
      <path d="M 152 76 L 135 89" stroke={POLLEN} strokeWidth={8} strokeLinecap="round" />
      <path d="M 176 44 q 8 -6 16 -2" fill="none" stroke={INK_SOFT} strokeWidth={1} markerEnd="url(#sq-arrow)" />
      <Callout x={118} y={92} tx={60} ty={70} text={stigma} anchor="end" max={14} />
      <Callout x={146} y={80} tx={220} ty={100} text={anther} max={16} />
    </Frame>
  );
}

// --- 5. Refermer et étiqueter --------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 90 172 C 90 158 88 150 88 142" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ovary x={88} y={116} s={1.15} />
      <ClosedBud x={88} y={116} s={1.1} taped />
      {/* fil + étiquette sur la tige du jeune fruit */}
      <path d="M 92 150 C 120 148 140 136 160 128" fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <circle cx={90} cy={150} r={3} fill="none" stroke="#b8412a" strokeWidth={1.6} />
      <g transform="translate(160 92) rotate(-4)">
        <path d="M 0 22 L 12 12 L 140 12 L 140 70 L 12 70 L 0 60 Z" fill="#fffdf6" stroke={INK_SOFT} strokeWidth={1} />
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

// --- 6. Récolter les graines -----------------------------------------------------

export function SeedsIllustration({ wait, dry, caption }: { wait: string; dry: string; caption: string }) {
  const seeds = [
    [-14, -6],
    [-8, -12],
    [0, -14],
    [8, -12],
    [14, -6],
    [-14, 6],
    [-8, 12],
    [0, 14],
    [8, 12],
    [14, 6],
  ];
  return (
    <Frame label={caption}>
      {/* courge mûre ouverte */}
      <g transform="translate(62 90)">
        <ellipse rx={42} ry={34} fill={SQUASH} stroke={SQUASH_DEEP} strokeWidth={1.4} />
        <ellipse rx={34} ry={27} fill="#f4a64a" />
        <ellipse rx={20} ry={16} fill="#f7d08a" />
        {seeds.map(([x, y], i) => (
          <ellipse key={i} cx={x * 0.95} cy={y * 0.75} rx={3.2} ry={1.8} transform={`rotate(${(Math.atan2(y, x) * 180) / Math.PI} ${x * 0.95} ${y * 0.75})`} fill="#f7edcf" stroke="#b8943c" strokeWidth={0.5} />
        ))}
      </g>
      <path d="M 112 90 L 150 90" stroke={INK_SOFT} strokeWidth={1.4} markerEnd="url(#sq-arrow)" />
      <text x={131} y={80} textAnchor="middle" fill={INK_SOFT} fontSize={9}>
        {wait}
      </text>
      {/* graines rincées sur une assiette */}
      <g transform="translate(232 94)">
        <ellipse rx={56} ry={22} fill="#fbfaf5" stroke="#b9b3a2" />
        <ellipse rx={44} ry={15} fill="#ffffff" stroke="#d9d2bd" strokeWidth={0.6} />
        {Array.from({ length: 16 }, (_, i) => {
          const x = -36 + (i % 8) * 10 + (i > 7 ? 5 : 0);
          const y = i > 7 ? 5 : -4;
          return <ellipse key={i} cx={x} cy={y} rx={3.6} ry={2} fill="#f1e2b8" stroke="#b8943c" strokeWidth={0.5} transform={`rotate(${(i * 23) % 60 - 30} ${x} ${y})`} />;
        })}
      </g>
      <text x={232} y={136} textAnchor="middle">
        {dry}
      </text>
    </Frame>
  );
}
