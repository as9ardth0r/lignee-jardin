/**
 * Illustrations pédagogiques (SVG dessinés à la main) de la pollinisation
 * manuelle de la tomate : stade du bouton, castration, récolte du pollen,
 * dépôt sur le stigmate, étiquetage, récolte des graines.
 * Style « planche botanique » : traits encrés, aplats doux, légendes.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const PETAL = '#f2c94c';
const PETAL_DARK = '#c99a1c';
const CONE = '#e0a82e';
const GREEN = '#6c9256';
const GREEN_DARK = '#3f6b3a';
const STEM = '#5d7f48';
const POLLEN = '#f0b90b';
const RED = '#c7412a';
const RED_DARK = '#9e2f1c';
const OK = '#4f8a3c';
const BAD = '#b8412a';

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

/** Coupe un texte en lignes d'au plus `max` caractères (au mot près). */
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

/** Légende avec trait de rappel ; le texte revient à la ligne s'il est long. */
function Callout({
  x,
  y,
  tx,
  ty,
  text,
  anchor = 'start',
  color = INK,
  max = 22,
}: {
  x: number;
  y: number;
  tx: number;
  ty: number;
  text: string;
  anchor?: 'start' | 'end' | 'middle';
  color?: string;
  max?: number;
}) {
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

/** Calice vu de profil (sépales verts en étoile), orienté vers la droite. */
function Calyx({ x, y, s = 1, open = 0.5 }: { x: number; y: number; s?: number; open?: number }) {
  const lobes = [-1, -0.45, 0.2, 0.75];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {lobes.map((k, i) => (
        <path
          key={i}
          d={`M0 0 Q ${10} ${k * 6 * (1 + open)} ${22} ${k * 9 * (1 + open * 1.6)}`}
          fill="none"
          stroke={GREEN}
          strokeWidth={3.2}
          strokeLinecap="round"
        />
      ))}
      <ellipse cx={1} cy={0} rx={5} ry={6} fill={GREEN_DARK} />
    </g>
  );
}

/** Bouton floral de profil, pointe vers la droite. `stage` 0 = vert fermé, 1 = jaune fermé. */
function Bud({ x, y, s = 1, stage }: { x: number; y: number; s?: number; stage: 0 | 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {stage === 1 && <path d="M2 -7 C 18 -9 30 -4 36 0 C 30 4 18 9 2 7 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={1} />}
      <path
        d={stage === 1 ? 'M0 -8 C 10 -9 18 -6 22 -2 L 22 2 C 18 6 10 9 0 8 Z' : 'M0 -7 C 10 -8 18 -5 24 0 C 18 5 10 8 0 7 Z'}
        fill={GREEN}
        stroke={GREEN_DARK}
        strokeWidth={1}
      />
      {[-4, 0, 4].map((d) => (
        <path key={d} d={`M1 ${d * 0.8} Q 12 ${d * 1.1} ${stage === 1 ? 21 : 23} ${d * 0.25}`} fill="none" stroke={GREEN_DARK} strokeWidth={0.6} opacity={0.7} />
      ))}
      <ellipse cx={-1} cy={0} rx={4} ry={5.5} fill={GREEN_DARK} />
    </g>
  );
}

/** Fleur ouverte vue de face : pétales en étoile, cône d'anthères au centre. */
function OpenFlowerFront({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const n = 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {Array.from({ length: n }, (_, i) => (
        <path key={`s${i}`} d="M0 0 L 3 -4 L 0 -21 L -3 -4 Z" fill={GREEN} transform={`rotate(${(360 / n) * i + 30})`} />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <path key={`p${i}`} d="M0 0 C 6 -6 5 -18 0 -26 C -5 -18 -6 -6 0 0 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={0.8} transform={`rotate(${(360 / n) * i})`} />
      ))}
      <circle r={7.5} fill={CONE} stroke={PETAL_DARK} strokeWidth={1} />
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`l${i}`} x1={0} y1={-2.2} x2={0} y2={-7} stroke={PETAL_DARK} strokeWidth={0.6} transform={`rotate(${60 * i})`} />
      ))}
      <circle r={2.2} fill={GREEN_DARK} />
    </g>
  );
}

function Mark({ x, y, ok }: { x: number; y: number; ok: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={8} fill={ok ? OK : BAD} />
      {ok ? (
        <path d="M-4 0 L -1 3.5 L 4.5 -3.5" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M-3.5 -3.5 L 3.5 3.5 M 3.5 -3.5 L -3.5 3.5" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      )}
    </g>
  );
}

// --- 1. Le bon stade --------------------------------------------------------

export function StageIllustration({ early, right, late, caption }: { early: string; right: string; late: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* rameau de la grappe */}
      <path d="M 14 34 C 90 26 200 26 306 34" fill="none" stroke={STEM} strokeWidth={4} strokeLinecap="round" />
      {/* trop tôt */}
      <path d="M 60 30 C 58 52 56 66 56 82" fill="none" stroke={STEM} strokeWidth={2} />
      <g transform="translate(56 84) rotate(90)">
        <Bud x={0} y={0} s={0.85} stage={0} />
      </g>
      {/* le bon moment */}
      <path d="M 160 29 C 160 52 160 64 160 76" fill="none" stroke={STEM} strokeWidth={2.2} />
      <g transform="translate(160 78) rotate(90)">
        <Bud x={0} y={0} s={1.25} stage={1} />
      </g>
      {/* trop tard */}
      <path d="M 262 30 C 264 50 264 62 262 74" fill="none" stroke={STEM} strokeWidth={2} />
      <OpenFlowerFront x={262} y={98} s={0.95} />

      <Mark x={80} y={128} ok={false} />
      <Mark x={184} y={138} ok />
      <Mark x={292} y={128} ok={false} />
      <text x={56} y={158} textAnchor="middle" fill={INK_SOFT}>
        {early}
      </text>
      <text x={160} y={158} textAnchor="middle" fontWeight={600} fill={OK}>
        {right}
      </text>
      <text x={262} y={158} textAnchor="middle" fill={INK_SOFT}>
        {late}
      </text>
    </Frame>
  );
}

// --- 2. Castration ------------------------------------------------------------

function Tweezers({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M 0 -1.5 L 70 -9 L 72 -6 L 4 0 Z" fill="#9aa3a8" stroke="#5f686d" strokeWidth={0.8} />
      <path d="M 0 1.5 L 70 9 L 72 6 L 4 0 Z" fill="#b5bdc1" stroke="#5f686d" strokeWidth={0.8} />
      <rect x={66} y={-9} width={8} height={18} rx={2} fill="#7d878c" />
    </g>
  );
}

export function EmasculateIllustration({ cone, pistil, petals, caption }: { cone: string; pistil: string; petals: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* pédoncule */}
      <path d="M 10 70 C 30 72 44 86 58 92" fill="none" stroke={STEM} strokeWidth={4} strokeLinecap="round" />
      <Calyx x={62} y={94} s={1.5} open={0.9} />
      {/* pétales écartés (vus de profil, repliés vers l'arrière) */}
      <path d="M 72 90 C 88 58 104 44 116 40 C 110 56 98 76 80 92 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={1} />
      <path d="M 72 98 C 88 130 104 144 116 148 C 110 132 98 112 80 96 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={1} />
      <path d="M 74 92 C 92 70 110 62 120 62 C 110 72 96 84 80 94 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={0.8} opacity={0.85} />
      {/* ovaire + pistil (reste en place) */}
      <ellipse cx={80} cy={94} rx={6} ry={5.5} fill={GREEN} stroke={GREEN_DARK} strokeWidth={1} />
      <path d="M 85 94 L 140 94" stroke={GREEN_DARK} strokeWidth={2} />
      <circle cx={142} cy={94} r={3.4} fill={GREEN} stroke={GREEN_DARK} strokeWidth={1} />
      {/* cône d'anthères extrait, tiré par la pince */}
      <g transform="translate(40 0)">
        <path d="M 110 82 L 176 90 L 176 98 L 110 106 Z" fill={CONE} stroke={PETAL_DARK} strokeWidth={1} />
        {[88, 94, 100].map((yy) => (
          <line key={yy} x1={112} y1={yy} x2={174} y2={yy - (yy - 94) * 0.7} stroke={PETAL_DARK} strokeWidth={0.5} />
        ))}
        {/* grains de pollen qui s'échappent */}
        {[
          [122, 110],
          [132, 114],
          [118, 118],
          [140, 111],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={1.4} fill={POLLEN} />
        ))}
      </g>
      <path d="M 158 76 C 162 70 170 70 174 74" fill="none" stroke={INK_SOFT} strokeWidth={1} markerEnd="url(#arrow)" />
      <Tweezers x={214} y={94} angle={0} />
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={INK_SOFT} />
        </marker>
      </defs>

      <Callout x={186} y={84} tx={208} ty={26} text={cone} />
      <Callout x={128} y={94} tx={138} ty={160} text={pistil} color={OK} />
      <Callout x={106} y={48} tx={128} ty={20} text={petals} max={12} />
    </Frame>
  );
}

// --- 3. Récolte du pollen ----------------------------------------------------

export function PollenIllustration({ father, brush, spoon, caption }: { father: string; brush: string; spoon: string; caption: string }) {
  return (
    <Frame label={caption}>
      {/* rameau */}
      <path d="M 20 18 C 80 16 120 22 150 30" fill="none" stroke={STEM} strokeWidth={4} strokeLinecap="round" />
      <path d="M 120 24 C 124 36 126 46 126 56" fill="none" stroke={STEM} strokeWidth={2.4} />
      {/* fleur ouverte pendante, vue de profil */}
      <g transform="translate(126 58)">
        <path d="M 0 0 C -18 -2 -30 -10 -36 -20 C -22 -18 -10 -10 -2 2 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={1} />
        <path d="M 0 0 C 18 -2 30 -10 36 -20 C 22 -18 10 -10 2 2 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={1} />
        <path d="M 0 0 C -10 -4 -16 -14 -18 -24 C -8 -16 -3 -8 0 0 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={0.8} opacity={0.9} />
        <path d="M 0 0 C 10 -4 16 -14 18 -24 C 8 -16 3 -8 0 0 Z" fill={PETAL} stroke={PETAL_DARK} strokeWidth={0.8} opacity={0.9} />
        <ellipse cx={0} cy={-1} rx={6} ry={4} fill={GREEN_DARK} />
        {/* cône d'anthères pointant vers le bas */}
        <path d="M -7 2 L 7 2 L 2.5 30 L -2.5 30 Z" fill={CONE} stroke={PETAL_DARK} strokeWidth={1} />
      </g>
      {/* brosse à dents électrique contre le pédoncule */}
      <g transform="translate(132 44) rotate(-18)">
        <rect x={4} y={-4} width={26} height={8} rx={2} fill="#e9eef0" stroke="#7d878c" />
        {[8, 12, 16, 20, 24].map((bx) => (
          <line key={bx} x1={bx} y1={-4} x2={bx} y2={-9} stroke="#7aa6c2" strokeWidth={1.6} />
        ))}
        <rect x={30} y={-3} width={20} height={6} fill="#dfe6e9" stroke="#7d878c" />
        <rect x={50} y={-8} width={80} height={16} rx={7} fill="#4a7fb0" stroke="#2f5a80" />
        <circle cx={70} cy={0} r={3} fill="#dfe6e9" />
      </g>
      {/* ondes de vibration */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${142 + i * 6} ${30 - i * 3} q 4 4 0 8`} fill="none" stroke="#4a7fb0" strokeWidth={1.2} opacity={0.8 - i * 0.2} />
      ))}
      {/* pollen qui tombe */}
      {[
        [124, 96],
        [128, 104],
        [122, 112],
        [127, 120],
        [125, 128],
        [130, 114],
        [121, 102],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.6} fill={POLLEN} />
      ))}
      {/* cuillère */}
      <ellipse cx={126} cy={146} rx={22} ry={8} fill="#d9dde0" stroke="#7d878c" />
      <ellipse cx={126} cy={145} rx={15} ry={4.5} fill={POLLEN} opacity={0.9} />
      <path d="M 148 146 L 210 152" stroke="#7d878c" strokeWidth={4} strokeLinecap="round" />

      <Callout x={100} y={44} tx={40} ty={76} text={father} anchor="middle" max={16} />
      <Callout x={220} y={20} tx={232} ty={78} text={brush} max={16} />
      <Callout x={140} y={144} tx={232} ty={132} text={spoon} max={16} />
    </Frame>
  );
}

// --- 4. Dépôt sur le stigmate -------------------------------------------------

export function DepositIllustration({ mother, stigma, caption }: { mother: string; stigma: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 10 70 C 30 72 44 86 58 92" fill="none" stroke={STEM} strokeWidth={4} strokeLinecap="round" />
      <Calyx x={62} y={94} s={1.5} open={0.9} />
      <ellipse cx={80} cy={94} rx={6} ry={5.5} fill={GREEN} stroke={GREEN_DARK} strokeWidth={1} />
      <path d="M 85 94 L 138 94" stroke={GREEN_DARK} strokeWidth={2} />
      <circle cx={140} cy={94} r={3.6} fill={GREEN} stroke={GREEN_DARK} strokeWidth={1} />
      {/* pollen déposé */}
      {[
        [138, 91],
        [142, 92],
        [140, 97],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1.4} fill={POLLEN} />
      ))}
      {/* pinceau chargé de pollen */}
      <g transform="translate(146 92) rotate(-12)">
        <path d="M 0 0 C 4 -5 12 -6 20 -4 L 20 4 C 12 6 4 5 0 0 Z" fill={POLLEN} stroke={PETAL_DARK} strokeWidth={0.8} />
        <rect x={20} y={-4} width={12} height={8} fill="#b7b0a0" stroke="#7d6f55" />
        <rect x={32} y={-3} width={110} height={6} rx={3} fill="#8a6a42" stroke="#5e4629" />
      </g>
      <Callout x={140} y={98} tx={160} ty={136} text={stigma} color={OK} />
      <Callout x={40} y={78} tx={24} ty={30} text={mother} />
    </Frame>
  );
}

// --- 5. Étiqueter -----------------------------------------------------------

export function LabelIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <path d="M 20 30 C 70 40 110 60 150 96" fill="none" stroke={STEM} strokeWidth={4} strokeLinecap="round" />
      <path d="M 110 62 C 118 76 122 88 124 100" fill="none" stroke={STEM} strokeWidth={2.2} />
      {/* jeune fruit noué, sépales séchés */}
      <circle cx={126} cy={116} r={15} fill="#8fb36b" stroke={GREEN_DARK} strokeWidth={1} />
      <ellipse cx={121} cy={110} rx={4} ry={2.5} fill="#fff" opacity={0.35} />
      <Calyx x={124} y={101} s={0.9} open={1.2} />
      {/* fil de laine + étiquette */}
      <path d="M 118 84 C 140 86 160 90 176 98" fill="none" stroke={RED} strokeWidth={1.6} />
      <circle cx={118} cy={84} r={2.4} fill="none" stroke={RED} strokeWidth={1.6} />
      <g transform="translate(176 90) rotate(6)">
        <path d="M 0 8 L 14 0 L 124 0 L 124 60 L 14 60 L 0 52 Z" fill="#fffdf6" stroke={INK_SOFT} strokeWidth={1} />
        <circle cx={10} cy={30} r={3} fill="#f3ecd9" stroke={INK_SOFT} />
        <text x={22} y={20} fontSize={10} fontWeight={600} fill={INK}>
          {line1}
        </text>
        <text x={22} y={35} fontSize={10} fill={INK}>
          {line2}
        </text>
        <text x={22} y={50} fontSize={9} fill={INK_SOFT}>
          {line3}
        </text>
      </g>
    </Frame>
  );
}

// --- 6. Récolter les graines ----------------------------------------------

export function SeedsIllustration({ cut, ferment, dry, caption }: { cut: string; ferment: string; dry: string; caption: string }) {
  const seeds = [
    [-10, -8],
    [-6, -12],
    [-13, -2],
    [8, -10],
    [12, -4],
    [5, -13],
    [-9, 9],
    [-4, 12],
    [-13, 4],
    [9, 10],
    [13, 3],
    [4, 13],
  ];
  return (
    <Frame label={caption}>
      {/* tomate coupée */}
      <g transform="translate(58 82)">
        <circle r={36} fill={RED} stroke={RED_DARK} strokeWidth={1.4} />
        <circle r={30} fill="#e0624a" />
        {[0, 120, 240].map((a) => (
          <path key={a} d="M 0 -4 C 10 -8 22 -12 24 -2 C 22 8 10 6 0 4 Z" fill="#f2c56b" opacity={0.75} transform={`rotate(${a + 30})`} />
        ))}
        <circle r={7} fill="#e98b72" />
        {[0, 120, 240].map((a) => (
          <g key={a} transform={`rotate(${a + 30}) translate(14 -1)`}>
            {seeds.slice(0, 4).map(([sx, sy], i) => (
              <ellipse key={i} cx={sx * 0.45 + 2} cy={sy * 0.3} rx={1.8} ry={1.2} fill="#f7e7b0" stroke="#b8943c" strokeWidth={0.5} />
            ))}
          </g>
        ))}
      </g>
      {/* flèche */}
      <path d="M 102 82 L 122 82" stroke={INK_SOFT} strokeWidth={1.4} markerEnd="url(#arrow2)" />
      {/* bocal de fermentation */}
      <g transform="translate(160 82)">
        <rect x={-24} y={-30} width={48} height={62} rx={6} fill="#e9f1f3" stroke="#7d878c" strokeWidth={1.2} />
        <rect x={-26} y={-36} width={52} height={8} rx={2} fill="#cfd6d9" stroke="#7d878c" />
        <rect x={-22} y={-6} width={44} height={36} rx={4} fill="#e38a6a" opacity={0.75} />
        <rect x={-22} y={-9} width={44} height={6} rx={2} fill="#f4f1e6" stroke="#d9d2bd" strokeWidth={0.6} />
        {seeds.slice(0, 8).map(([sx, sy], i) => (
          <ellipse key={i} cx={sx * 1.2} cy={20 + sy * 0.6} rx={1.8} ry={1.2} fill="#f7e7b0" stroke="#b8943c" strokeWidth={0.5} />
        ))}
      </g>
      <path d="M 192 82 L 212 82" stroke={INK_SOFT} strokeWidth={1.4} markerEnd="url(#arrow2)" />
      {/* assiette de séchage */}
      <g transform="translate(262 90)">
        <ellipse rx={40} ry={16} fill="#fbfaf5" stroke="#b9b3a2" />
        <ellipse rx={30} ry={11} fill="#ffffff" stroke="#d9d2bd" strokeWidth={0.6} />
        {seeds.map(([sx, sy], i) => (
          <ellipse key={i} cx={sx * 1.7} cy={sy * 0.6} rx={2.2} ry={1.5} fill="#f1dc98" stroke="#b8943c" strokeWidth={0.5} />
        ))}
      </g>
      <defs>
        <marker id="arrow2" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={INK_SOFT} />
        </marker>
      </defs>
      <text x={58} y={140} textAnchor="middle">
        {cut}
      </text>
      <text x={160} y={140} textAnchor="middle">
        {ferment}
      </text>
      <text x={262} y={140} textAnchor="middle">
        {dry}
      </text>
    </Frame>
  );
}
