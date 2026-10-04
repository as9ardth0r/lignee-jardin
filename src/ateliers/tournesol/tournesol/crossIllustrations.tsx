/**
 * Illustrations pédagogiques (SVG dessinés à la main) du croisement manuel
 * des tournesols : capitule en bouton à ensacher, fleurons du cœur (tube
 * d’anthères puis stigmate à deux branches, à retirer ou à laver chaque
 * matin), capitule ensaché, pollen frotté au pinceau, étiquette, capitule
 * mûr penché et graines striées.
 */
import type { ReactNode } from 'react';

const INK = '#3a352a';
const INK_SOFT = '#6b6455';
const STEM = '#5f8a46';
const LEAF = '#6f9a4a';
const POLLEN = '#f0c83a';
const BAG = '#f4f1e6';

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

const RAY = '#f5b81c';
const RAY_DEEP = '#b8800a';
const DISK = '#4a2c16';

/** Capitule de profil ou de trois quarts (bouton fermé, ouvert ou mûr penché). */
function Head({ x, y, r, stage = 'open', rot = 0 }: { x: number; y: number; r: number; stage?: 'bud' | 'open' | 'ripe'; rot?: number }) {
  if (stage === 'bud')
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <ellipse rx={r * 0.8} ry={r * 0.55} fill="#7aa64e" stroke="#3f6e30" strokeWidth={0.7} />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${-r * 0.7 + i * r * 0.17},${-r * 0.3} l${r * 0.06},${-r * 0.35} l${r * 0.06},${r * 0.35}`} fill="#6a9a40" stroke="#3f6e30" strokeWidth={0.5} />
        ))}
        <path d={`M${-r * 0.5},${-r * 0.45} q${r * 0.5},${-r * 0.25} ${r},0`} fill="none" stroke={RAY} strokeWidth={1.5} />
      </g>
    );
  const ripe = stage === 'ripe';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {!ripe &&
        Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * 360;
          return <path key={i} transform={`rotate(${a})`} d={`M0,${-r * 0.55} C${r * 0.14},${-r * 0.7} ${r * 0.1},${-r * 0.95} 0,${-r} C${-r * 0.1},${-r * 0.95} ${-r * 0.14},${-r * 0.7} 0,${-r * 0.55} Z`} fill={RAY} stroke={RAY_DEEP} strokeWidth={0.5} />;
        })}
      <circle r={r * 0.58} fill={ripe ? '#6a5030' : DISK} stroke={ripe ? '#3a2a14' : '#2a170a'} strokeWidth={0.7} />
      {ripe && <circle r={r * 0.64} fill="none" stroke="#a8875a" strokeWidth={r * 0.12} strokeDasharray="2 2" />}
      {!ripe && <circle r={r * 0.45} fill="none" stroke={POLLEN} strokeWidth={r * 0.08} strokeDasharray="2 1.5" />}
    </g>
  );
}

/** Pied de tournesol : tige, grandes feuilles, capitule au sommet. */
function Spike({ x, y, len = 110, stage = 'open', flowers = 1, colored = 0, capsules = false }: { x: number; y: number; len?: number; stage?: 'bud' | 'open' | 'ripe'; flowers?: number; colored?: number; capsules?: boolean }) {
  void flowers;
  void colored;
  const st = capsules ? 'ripe' : stage;
  const top = y - len;
  return (
    <g>
      <path d={`M${x},${y} C${x + 2},${y - len * 0.4} ${x - 2},${top + len * 0.3} ${x + (st === 'ripe' ? 8 : 0)},${top + 4}`} fill="none" stroke={capsules ? '#8a7a4a' : STEM} strokeWidth={3} strokeLinecap="round" />
      {[0.2, 0.42, 0.62].map((t, i) => {
        const yy = y - len * t;
        const d = i % 2 ? 1 : -1;
        return <path key={i} d={`M${x},${yy} c${d * 8},-10 ${d * 26},-12 ${d * 30},-2 c${d * -4},8 ${d * -20},10 ${d * -30},2 Z`} fill={capsules ? '#a89a5a' : LEAF} stroke="#3f6e30" strokeWidth={0.6} />;
      })}
      <Head x={x + (st === 'ripe' ? 14 : 0)} y={top + (st === 'ripe' ? 12 : 0)} r={st === 'bud' ? 14 : 22} stage={st} rot={st === 'ripe' ? 60 : 0} />
    </g>
  );
}

// --- 1. Repérer le bon capitule ---------------------------------------------

export function IdIllustration({ bud, flower, spike, caption }: { bud: string; flower: string; spike: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={60} y={172} len={128} stage="bud" />
      <g transform="translate(110 0)">
        <Spike x={20} y={172} len={110} stage="open" />
      </g>
      <Callout x={70} y={42} tx={168} ty={22} text={bud} max={28} />
      <Callout x={148} y={62} tx={200} ty={96} text={flower} max={22} />
      <Callout x={60} y={140} tx={200} ty={150} text={spike} max={22} />
    </Frame>
  );
}

// --- 2. Retirer le pollen de la mère --------------------------------------------

export function EmasculateIllustration({ stamens, tweezers, stigma, caption }: { stamens: string; tweezers: string; stigma: string; caption: string }) {
  // Gros plan sur quelques fleurons tubulaires : tube d’anthères soudées (pollen) puis, le lendemain, stigmate à deux branches.
  const floret = (x: number, h: number, kind: 'anther' | 'stigma' | 'bud', key: string) => (
    <g key={key} transform={`translate(${x} 150)`}>
      <path d={`M-3,0 L-3,${-h} L3,${-h} L3,0 Z`} fill="#e8b830" stroke="#a87a10" strokeWidth={0.5} />
      {kind === 'anther' && (
        <g>
          <rect x={-2.2} y={-h - 16} width={4.4} height={16} rx={1} fill="#3a2414" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={-1 + i} cy={-h - 18 - i * 2} r={1.1} fill={POLLEN} />
          ))}
        </g>
      )}
      {kind === 'stigma' && <path d={`M0,${-h} L0,${-h - 14} M0,${-h - 14} q-5,-2 -6,-8 M0,${-h - 14} q5,-2 6,-8`} fill="none" stroke="#c8a020" strokeWidth={1.4} />}
      {kind === 'bud' && <ellipse cx={0} cy={-h - 3} rx={3.6} ry={4.5} fill="#5a3a1a" />}
    </g>
  );
  return (
    <Frame label={caption}>
      <path d="M 20 150 L 300 150" stroke="#6a4a2a" strokeWidth={6} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => floret(40 + i * 18, 34 - (i % 2) * 3, i < 3 ? 'stigma' : i < 6 ? 'anther' : 'bud', `f${i}`))}
      <path d="M 250 30 L 132 104 M 256 36 L 136 108" stroke="#8a8a8a" strokeWidth={2.4} strokeLinecap="round" />
      <Callout x={130} y={104} tx={10} ty={22} text={stamens} max={24} />
      <Callout x={58} y={110} tx={180} ty={120} text={stigma} max={26} />
      <Callout x={250} y={32} tx={252} ty={60} text={tweezers} max={14} />
    </Frame>
  );
}

// --- 3. Ensacher le capitule -----------------------------------------------------

export function BagIllustration({ bag, insects, caption }: { bag: string; insects: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={90} y={176} len={120} stage="open" />
      <path d="M 58 24 L 122 24 L 128 86 Q 90 92 52 86 Z" fill={BAG} stroke="#b9ae8e" strokeWidth={1} opacity={0.9} />
      <rect x={80} y={86} width={20} height={4} fill="#9a9a9a" />
      <Callout x={124} y={50} tx={160} ty={36} text={bag} max={26} />
      {/* abeille */}
      <g transform="translate(206 112)">
        <ellipse rx={8} ry={5} fill="#d8a020" />
        <rect x={-2} y={-5} width={2} height={10} fill="#2a2a2a" />
        <rect x={2.5} y={-4.6} width={2} height={9.2} fill="#2a2a2a" />
        <ellipse cx={-2} cy={-7} rx={4.5} ry={2.6} fill="#dfe8ee" opacity={0.85} />
        <ellipse cx={3} cy={-7} rx={4.5} ry={2.6} fill="#dfe8ee" opacity={0.85} />
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

// --- 4. Polliniser ---------------------------------------------------------------

export function PollinateIllustration({ stigma, pollen, caption }: { stigma: string; pollen: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Head x={80} y={96} r={56} stage="open" />
      <g transform="translate(150 70) rotate(-35)">
        <rect x={0} y={-2.5} width={80} height={5} rx={2} fill="#b0844a" />
        <path d="M0,-3 L-14,-1 L-14,1 L0,3 Z" fill="#5a4630" />
        <circle cx={-14} cy={0} r={1.8} fill={POLLEN} />
      </g>
      <Callout x={96} y={86} tx={180} ty={140} text={stigma} max={24} />
      <Callout x={176} y={56} tx={196} ty={24} text={pollen} max={22} />
    </Frame>
  );
}

// --- 5. Étiqueter ------------------------------------------------------------------------

export function SealIllustration({ line1, line2, line3, caption }: { line1: string; line2: string; line3: string; caption: string }) {
  return (
    <Frame label={caption}>
      <Spike x={60} y={176} len={130} stage="open" />
      <path d="M 62 110 C 94 106 116 98 140 94" fill="none" stroke="#b8412a" strokeWidth={1.6} />
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
      <Spike x={70} y={156} len={120} capsules />
      <text x={80} y={170} textAnchor="middle" fill={INK_SOFT}>
        {wait}
      </text>
      <path d="M 130 90 L 170 90" stroke={INK_SOFT} strokeWidth={1.4} />
      <path d="M 166 86 L 172 90 L 166 94" fill="none" stroke={INK_SOFT} strokeWidth={1.4} />
      <g transform="translate(244 90)">
        <ellipse rx={56} ry={22} fill="#fbfaf5" stroke="#b9b3a2" />
        {/* graines striées */}
        {Array.from({ length: 10 }, (_, i) => (
          <g key={i} transform={`translate(${-40 + (i % 5) * 20} ${-6 + Math.floor(i / 5) * 12}) rotate(${(i * 37) % 60 - 30})`}>
            <path d="M0,-6 C4,-3 4,3 0,6 C-4,3 -4,-3 0,-6 Z" fill="#2a2018" />
            <path d="M0,-5 L0,5 M-1.8,-3 L-1.8,3 M1.8,-3 L1.8,3" stroke="#e8e0cc" strokeWidth={0.6} />
          </g>
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
