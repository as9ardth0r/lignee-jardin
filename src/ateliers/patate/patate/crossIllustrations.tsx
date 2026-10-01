/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * de la pomme de terre : repérer les boutons, castrer (cône d’anthères),
 * récolter le pollen par vibration (les anthères s’ouvrent par un pore),
 * polliniser, étiqueter, récolter les baies et laver les graines.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#6a8a4a';
const PETAL = '#efe6f6';
const PETAL_EDGE = '#a58bc0';
const ANTHER = '#f2c230';
const ANTHER_DEEP = '#c8921a';
const BERRY = '#8fae5a';
const BERRY_DEEP = '#5e7d34';

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

/** Fleur de pomme de terre vue de face : corolle en étoile à 5 lobes, cône d’anthères jaune, stigmate. */
function Flower({ x, y, s = 1, anthers = true }: { x: number; y: number; s?: number; anthers?: boolean }) {
  const lobes = [0, 72, 144, 216, 288].map((a) => <path key={a} d="M0,0 L-7,-13 Q0,-19 7,-13 Z" transform={`rotate(${a})`} fill={PETAL} stroke={PETAL_EDGE} strokeWidth={0.7} />);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={9} fill={PETAL} />
      {lobes}
      {anthers ? (
        <>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={0} cy={-4} rx={1.8} ry={4.2} transform={`rotate(${a})`} fill={ANTHER} stroke={ANTHER_DEEP} strokeWidth={0.5} />
          ))}
          <circle r={1.4} fill="#7a8a3a" />
        </>
      ) : (
        <circle r={1.8} fill="#7a8a3a" />
      )}
    </g>
  );
}

function Bud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,6 C-5,2 -4,-6 0,-9 C4,-6 5,2 0,6 Z" fill="#d9cce6" stroke={PETAL_EDGE} strokeWidth={0.7} />
      <path d="M-3,5 L0,8 L3,5" fill="none" stroke={STEM} strokeWidth={1} />
    </g>
  );
}

/** Inflorescence (cyme) : un pédoncule, des pédicelles, boutons et fleurs. */
function Cyme({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x},${y} L${x},${y - 70}`} stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
      {[
        [-30, -96],
        [-8, -110],
        [16, -104],
        [34, -86],
        [-38, -76],
      ].map(([dx, dy], i) => (
        <path key={i} d={`M${x},${y - 70} Q${x + dx * 0.4},${y + dy * 0.75} ${x + dx},${y + dy}`} fill="none" stroke={STEM} strokeWidth={1.2} />
      ))}
      <Flower x={x - 30} y={y - 100} s={0.95} />
      <Flower x={x + 34} y={y - 90} s={0.9} />
      <Bud x={x - 8} y={y - 112} s={1.1} />
      <Bud x={x + 16} y={y - 106} />
      <Bud x={x - 38} y={y - 78} s={0.9} />
    </g>
  );
}

// --- 1. Repérer les boutons ---------------------------------------------------

export function IdIllustration({ bud, flower, stigma, caption }: { bud: string; flower: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Cyme x={110} y={176} />
      <Callout x={102} y={66} tx={160} ty={34} text={bud} max={26} />
      <Callout x={150} y={86} tx={176} ty={80} text={flower} max={24} />
      <Callout x={80} y={76} tx={62} ty={40} text={stigma} anchor="end" max={10} />
    </Frame>
  );
}

// --- 2. Castrer ---------------------------------------------------------------------

export function EmasculateIllustration({ anthers, tweezers, stigma, caption }: { anthers: string; tweezers: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 100 176 L 100 110" stroke={STEM} strokeWidth={3} strokeLinecap="round" />
      {/* bouton ouvert : lobes de la corolle écartés */}
      <path d="M 100 112 C 80 106 72 88 76 72 M 100 112 C 120 106 128 88 124 72" fill="none" stroke={PETAL_EDGE} strokeWidth={3} />
      <path d="M 100 110 L 100 62" stroke="#8a9a4a" strokeWidth={2.5} />
      <circle cx={100} cy={60} r={3} fill="#a7b85a" stroke="#6a7a3a" strokeWidth={0.6} />
      {/* cône d’anthères, en partie retiré, tenu par la pince */}
      <g transform="translate(140 64) rotate(25)">
        {[-6, -3, 0, 3, 6].map((d, i) => (
          <ellipse key={i} cx={d} cy={0} rx={2.2} ry={9} fill={ANTHER} stroke={ANTHER_DEEP} strokeWidth={0.5} />
        ))}
      </g>
      <path d="M 186 30 L 146 58 M 190 36 L 150 64" stroke="#8a8a8a" strokeWidth={2.6} strokeLinecap="round" />
      <Callout x={140} y={70} tx={176} ty={98} text={anthers} max={24} />
      <Callout x={100} y={60} tx={70} ty={40} text={stigma} anchor="end" max={14} />
      <Callout x={186} y={30} tx={210} ty={24} text={tweezers} max={18} />
    </Frame>
  );
}

// --- 3. Récolter le pollen par vibration ------------------------------------------------

export function PollenIllustration({ buzz, vial, caption }: { buzz: string; vial: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* fleur tête en bas au-dessus d’un petit tube */}
      <path d="M 90 20 L 90 48" stroke={STEM} strokeWidth={2.2} />
      <g transform="translate(90 60) rotate(180)">
        <Flower x={0} y={0} s={1.3} />
      </g>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={86 + (i % 3) * 4} cy={80 + i * 5} r={1.2} fill={ANTHER} />
      ))}
      <rect x={78} y={110} width={24} height={46} rx={4} fill="#ffffff" stroke="#9a9a9a" strokeWidth={1.2} opacity={0.9} />
      <rect x={80} y={142} width={20} height={12} rx={2} fill={ANTHER} opacity={0.8} />
      {/* outil vibrant (brosse à dents électrique) qui touche le pédoncule */}
      <rect x={110} y={28} width={60} height={12} rx={6} fill="#5a8aa6" />
      <rect x={104} y={30} width={8} height={8} rx={2} fill="#d9e6ee" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${100 - i * 5} ${22 - i * 2} q -3 6 0 12`} fill="none" stroke="#5a8aa6" strokeWidth={1} opacity={0.7} />
      ))}
      <Callout x={168} y={34} tx={196} ty={48} text={buzz} max={22} />
      <Callout x={102} y={140} tx={196} ty={128} text={vial} max={22} />
    </Frame>
  );
}

// --- 4. Polliniser -------------------------------------------------------------------------

export function PollinateIllustration({ stigma, pollen, caption }: { stigma: string; pollen: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 90 176 L 90 104" stroke={STEM} strokeWidth={3} strokeLinecap="round" />
      <path d="M 90 104 C 76 98 72 84 74 74 M 90 104 C 104 98 108 84 106 74" fill="none" stroke={PETAL_EDGE} strokeWidth={2.4} />
      <path d="M 90 104 L 90 66" stroke="#8a9a4a" strokeWidth={2.4} />
      <circle cx={90} cy={64} r={3} fill="#e9d86a" stroke="#6a7a3a" strokeWidth={0.6} />
      {/* tube de pollen retourné sur le stigmate */}
      <g transform="translate(92 40) rotate(-15)">
        <rect x={-10} y={-34} width={20} height={36} rx={4} fill="#fff" stroke="#9a9a9a" strokeWidth={1.2} opacity={0.9} />
        <rect x={-8} y={-6} width={16} height={7} rx={2} fill={ANTHER} />
      </g>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={88 + i * 2} cy={58 + (i % 2) * 2} r={1} fill={ANTHER} />
      ))}
      <Callout x={88} y={65} tx={74} ty={120} text={stigma} anchor="end" max={15} />
      <Callout x={104} y={20} tx={176} ty={30} text={pollen} max={24} />
    </Frame>
  );
}

// --- 5. Étiqueter --------------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 70 176 L 70 104" stroke={STEM} strokeWidth={2.4} />
      <path d="M 70 104 Q 60 80 52 66 M 70 104 Q 82 84 92 74" fill="none" stroke={STEM} strokeWidth={1.4} />
      <circle cx={52} cy={62} r={7} fill={BERRY} stroke={BERRY_DEEP} />
      <Flower x={92} y={70} s={0.8} anthers={false} />
      <path d="M 78 90 C 110 92 130 96 150 98" fill="none" stroke="#b8412a" strokeWidth={1.6} />
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

// --- 6. Baies et graines ----------------------------------------------------------------------------

export function SeedsIllustration({ wait, seeds, toxic, caption }: { wait: string; seeds: string; toxic: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* grappe de baies vertes */}
      <path d="M 70 26 L 70 50 M 70 50 Q 52 58 46 72 M 70 50 Q 72 64 72 78 M 70 50 Q 90 58 96 70" fill="none" stroke={STEM} strokeWidth={1.6} />
      {[
        [46, 82, 11],
        [72, 88, 12],
        [96, 80, 10],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={BERRY} stroke={BERRY_DEEP} strokeWidth={1} />
          <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.3} ry={r * 0.2} fill="#fff" opacity={0.35} />
        </g>
      ))}
      <text x={72} y={122} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <text x={72} y={150} textAnchor="middle" fill="#b8412a" fontSize={9}>
        ⚠ {toxic}
      </text>
      <path d="M 130 84 L 170 84" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 166 80 L 172 84 L 166 88" fill="none" stroke={INK_SOFT} strokeWidth={1.4} />
      {/* baie coupée et graines séchées */}
      <g transform="translate(206 84)">
        <circle r={20} fill={BERRY} stroke={BERRY_DEEP} />
        <circle r={16} fill="#dfe8b8" />
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return <ellipse key={i} cx={Math.cos(a) * 9} cy={Math.sin(a) * 9} rx={1.8} ry={1.2} transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 9} ${Math.sin(a) * 9})`} fill="#c9b27a" />;
        })}
      </g>
      <g transform="translate(272 84)">
        <ellipse rx={30} ry={14} fill="#fbfaf5" stroke="#b9b3a2" />
        {Array.from({ length: 18 }, (_, i) => (
          <ellipse key={i} cx={-20 + (i % 6) * 8} cy={-6 + Math.floor(i / 6) * 6} rx={2} ry={1.4} fill="#c9a86a" />
        ))}
      </g>
      <text x={240} y={128} textAnchor="middle">
        {seeds}
      </text>
    </Frame>
  );
}
