import { useMemo } from 'react';
import type { CannabinoidPhenotype } from '../engine/genetics';
import { mulberry32 } from '../engine/genetics';

/**
 * Portrait botanique généré du spécimen — pas une photo (aucun modèle
 * de génération d'images n'est disponible dans cet environnement),
 * mais une illustration vectorielle procédurale dans le même langage
 * graphique que le reste de l'app (planche botanique, pas de clipart
 * générique). La géométrie est dérivée d'un seed déterministe (l'id
 * du spécimen), donc reproductible d'un rendu à l'autre, et varie
 * réellement avec le génotype :
 *  - couleur du calice : dégradé or (THC) ↔ prune (CBD) selon le ratio
 *  - liseré violet sur les pointes si le trait anthocyane est exprimé
 *    (ou une trace plus discrète si porteur masqué)
 *  - densité de résine (points) proportionnelle au THC et à la vigueur
 *  - hauteur/ampleur de la cola proportionnelle à la vigueur
 */
export function PlantPortrait({
  seed,
  pheno,
  violetExpressed,
  violetCarrier,
  vigorPercent,
  size = 160,
}: {
  seed: string;
  pheno: CannabinoidPhenotype;
  violetExpressed: boolean;
  violetCarrier: boolean;
  vigorPercent: number;
  size?: number;
}) {
  // Densité de résine affichée : pilotée par le THC en chimiotype
  // I/II/III (comme avant), par le CBG en IV (les fleurs CBG-dominantes
  // restent en général bien résineuses), par le CBC en VI (même
  // logique), quasi nulle en V (chanvre fibre, peu de trichomes).
  const isCbgDominant = pheno.chemotype === 'IV';
  const isCbcDominant = pheno.chemotype === 'VI';
  const isFiberType = pheno.chemotype === 'V';
  const resinDrive = isCbgDominant
    ? Math.min(1, pheno.cbgPercent / 20)
    : isCbcDominant
      ? Math.min(1, pheno.cbcPercent / 15)
      : isFiberType
        ? 0.03
        : pheno.thc;

  const geometry = useMemo(
    () => buildCola(seed, resinDrive, vigorPercent, violetExpressed, violetCarrier),
    [seed, resinDrive, vigorPercent, violetExpressed, violetCarrier]
  );

  // Ratio THC:CBD (0–100) pour la ligne de partage du dégradé — pur
  // repère visuel, distinct du taux réel affiché en légende. Sans
  // objet en chimiotype IV/V (traité à part ci-dessous).
  const thcPct = Math.round(pheno.thc * 100);

  const varinSuffix = pheno.propylSeries ? ', série propyl/varin exprimée' : '';
  const ariaLabel = isCbgDominant
    ? `Portrait généré du spécimen — chimiotype IV, ${pheno.propylSeries ? 'CBGV' : 'CBG'} dominant à ${pheno.propylSeries ? pheno.cbgvPercent : pheno.cbgPercent}%${
        violetExpressed ? ', pigmentation violette exprimée' : ''
      }${varinSuffix}`
    : isCbcDominant
      ? `Portrait généré du spécimen — chimiotype VI, ${pheno.propylSeries ? 'CBCV' : 'CBC'} dominant à ${pheno.propylSeries ? pheno.cbcvPercent : pheno.cbcPercent}%${
          violetExpressed ? ', pigmentation violette exprimée' : ''
        }${varinSuffix}`
      : isFiberType
        ? `Portrait généré du spécimen — chimiotype V, cannabinoïdes quasi absents (chanvre fibre)${
            violetExpressed ? ', pigmentation violette exprimée' : ''
          }`
        : `Portrait généré du spécimen — chimiotype à ${pheno.propylSeries ? pheno.thcvPercent : pheno.thcPercent}% ${pheno.propylSeries ? 'THCV' : 'THC'}${
            violetExpressed ? ', pigmentation violette exprimée' : ''
          }${varinSuffix}`;

  return (
    <svg viewBox="0 0 140 176" width={size} height={(size * 176) / 140} role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id={`cola-grad-${seed}`} x1="0" y1="1" x2="0" y2="0">
          {isCbgDominant ? (
            <>
              <stop offset="0%" stopColor="var(--color-leaf-500)" />
              <stop offset="100%" stopColor="var(--color-leaf-400)" />
            </>
          ) : isCbcDominant ? (
            <>
              <stop offset="0%" stopColor="var(--color-resin-600)" />
              <stop offset="100%" stopColor="var(--color-ink-700)" />
            </>
          ) : isFiberType ? (
            <>
              <stop offset="0%" stopColor="var(--color-paper-300)" />
              <stop offset="100%" stopColor="var(--color-paper-200)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="var(--color-bloom-500)" />
              <stop offset={`${100 - thcPct}%`} stopColor="var(--color-bloom-400)" />
              <stop offset={`${100 - thcPct}%`} stopColor="var(--color-resin-400)" />
              <stop offset="100%" stopColor="var(--color-resin-500)" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* tige */}
      <line x1="70" y1="176" x2="70" y2={geometry.stemTop} stroke="var(--color-leaf-500)" strokeWidth={2.5} />

      {/* calices */}
      {geometry.calyxes.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
          <path
            d={teardrop(c.w, c.h)}
            fill={`url(#cola-grad-${seed})`}
            opacity={c.opacity}
            stroke="var(--color-canopy-900)"
            strokeWidth={0.4}
            strokeOpacity={0.25}
          />
          {c.violetTip && (
            <path
              d={teardrop(c.w * 0.72, c.h * 0.5)}
              transform={`translate(0 ${-c.h * 0.22})`}
              fill="var(--color-bloom-400)"
              opacity={0.92}
            />
          )}
        </g>
      ))}

      {/* pistils */}
      {geometry.pistils.map((p, i) => (
        <path
          key={i}
          d={`M ${p.x} ${p.y} Q ${p.cx} ${p.cy} ${p.ex} ${p.ey}`}
          fill="none"
          stroke="var(--color-resin-400)"
          strokeWidth={0.7}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}

      {/* trichomes / résine */}
      {geometry.resin.map((r, i) => (
        <circle key={i} cx={r.x} cy={r.y} r={r.r} fill="var(--color-resin-400)" opacity={r.opacity} />
      ))}
    </svg>
  );
}

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Chemin d'une forme "calice"/pétale en goutte, centrée sur l'origine. */
function teardrop(w: number, h: number): string {
  return `M 0 ${-h / 2} C ${w / 2} ${-h / 4}, ${w / 2} ${h / 4}, 0 ${h / 2} C ${-w / 2} ${h / 4}, ${-w / 2} ${-h / 4}, 0 ${-h / 2} Z`;
}

function buildCola(
  seed: string,
  resinDrive: number,
  vigorPercent: number,
  violetExpressed: boolean,
  violetCarrier: boolean
) {
  const rng = mulberry32(hashSeed(seed));
  const cx = 70;
  const groundY = 168;
  const colaHeight = 98 + (vigorPercent / 100) * 54; // 98–152, remplit bien le cadre
  const stemTop = groundY - colaHeight * 0.3;
  const rings = 8 + Math.round((vigorPercent / 100) * 5); // 8–13, empilement dense
  // probabilité qu'un calice donné porte une pointe violette (anthocyane) —
  // marquée et fréquente si le trait est exprimé, discrète et rare chez un
  // porteur masqué, absente sinon
  const violetTipChance = violetExpressed ? 0.7 : violetCarrier ? 0.12 : 0;

  const calyxes: { x: number; y: number; w: number; h: number; rot: number; opacity: number; violetTip: boolean }[] = [];
  const pistils: { x: number; y: number; cx: number; cy: number; ex: number; ey: number }[] = [];

  for (let ring = 0; ring < rings; ring++) {
    const t = ring / (rings - 1); // 0 bas .. 1 haut
    const ringY = groundY - t * colaHeight;
    const ringRadius = (1 - t * 0.55) * (17 + vigorPercent * 0.1);
    const perRing = 4 + Math.floor(rng() * 3);
    for (let k = 0; k < perRing; k++) {
      const angle = (Math.PI * 2 * k) / perRing + rng() * 0.7 + t * 2.1;
      const jitterR = ringRadius * (0.35 + rng() * 0.35);
      const x = cx + Math.cos(angle) * jitterR;
      const y = ringY + Math.sin(angle) * jitterR * 0.35 - t * 3;
      const w = (15 + rng() * 9) * (1 - t * 0.28);
      const h = (24 + rng() * 12) * (1 - t * 0.22);
      const rot = (angle * 180) / Math.PI + 90 + (rng() - 0.5) * 26;
      calyxes.push({ x, y, w, h, rot, opacity: 0.9 + rng() * 0.1, violetTip: rng() < violetTipChance });

      if (rng() < 0.55) {
        const ex = x + Math.cos(angle) * (11 + rng() * 9);
        const ey = y + Math.sin(angle) * (7 + rng() * 6) - 4;
        pistils.push({
          x,
          y: y - h * 0.3,
          cx: x + Math.cos(angle) * 6,
          cy: y - h * 0.1,
          ex,
          ey,
        });
      }
    }
  }
  // trier du bas vers le haut pour un chevauchement cohérent
  calyxes.sort((a, b) => b.y - a.y);

  const resinCount = Math.round(30 + resinDrive * 90 + (vigorPercent / 100) * 30);
  const resin: { x: number; y: number; r: number; opacity: number }[] = [];
  for (let i = 0; i < resinCount; i++) {
    const t = rng();
    const ringY = groundY - t * colaHeight;
    const spread = (1 - t * 0.5) * (20 + vigorPercent * 0.08);
    resin.push({
      x: cx + (rng() - 0.5) * spread * 1.7,
      y: ringY - t * 3 + (rng() - 0.5) * 11,
      r: 0.4 + rng() * 0.7,
      opacity: 0.35 + rng() * 0.45,
    });
  }

  return { stemTop, calyxes, pistils, resin };
}
