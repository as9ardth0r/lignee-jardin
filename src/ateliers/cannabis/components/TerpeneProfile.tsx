import type { BreedingEngine, Individual, TerpeneKey, TerpeneProfile as TerpeneProfileData } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';

/**
 * Affiche le profil terpénique (chemovar) d'un individu : une rangée
 * de pastilles empilées (une par terpène, largeur proportionnelle à
 * sa part relative dans le mélange) suivie du détail chiffré des
 * terpènes dominants — dans le même langage graphique que
 * `ResinSwatch` (planche botanique, pas de composant SaaS générique).
 *
 * Les pourcentages affichés sont RELATIFS entre les 7 terpènes
 * modélisés (voir `TerpeneProfile` dans genetics.ts) : ce ne sont pas
 * des taux de matière sèche vérifiables, et aucune variété nommée n'a
 * de profil terpénique réel documenté dans ce projet — chaque
 * individu simulé reçoit le sien, généré/hérité par le moteur.
 */

const TERPENE_ORDER: TerpeneKey[] = ['myrcene', 'limonene', 'pinene', 'linalool', 'caryophyllene', 'humulene', 'terpinolene'];

const TERPENE_COLOR: Record<TerpeneKey, string> = {
  myrcene: 'var(--color-terp-myrcene)',
  limonene: 'var(--color-terp-limonene)',
  pinene: 'var(--color-terp-pinene)',
  linalool: 'var(--color-terp-linalool)',
  caryophyllene: 'var(--color-terp-caryophyllene)',
  humulene: 'var(--color-terp-humulene)',
  terpinolene: 'var(--color-terp-terpinolene)',
};

function percentOf(profile: TerpeneProfileData, key: TerpeneKey): number {
  switch (key) {
    case 'myrcene':
      return profile.myrcenePercent;
    case 'limonene':
      return profile.limonenePercent;
    case 'pinene':
      return profile.pinenePercent;
    case 'linalool':
      return profile.linaloolPercent;
    case 'caryophyllene':
      return profile.caryophyllenePercent;
    case 'humulene':
      return profile.humulenePercent;
    case 'terpinolene':
      return profile.terpinolenePercent;
  }
}

export function TerpeneProfile({
  individual,
  engine,
  compact = false,
}: {
  individual: Individual;
  engine: BreedingEngine;
  compact?: boolean;
}) {
  const { t, tEnum } = useTranslation();
  const profile = engine.terpeneProfile(individual);
  const dominant = profile.dominantTerpenes as TerpeneKey[];
  const chemovarLabel = engine.chemovarLabel(individual, (key) => tEnum('terpene', key));

  const others = TERPENE_ORDER.filter((k) => !dominant.includes(k) && percentOf(profile, k) > 0.5);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <span
          className={compact ? 'text-[10px]' : 'text-xs'}
          style={{ color: 'var(--color-ink-500)' }}
        >
          {t('terpeneProfile.title')}
        </span>
        <span
          className={`font-data ${compact ? 'text-[10px]' : 'text-xs'}`}
          style={{ color: 'var(--color-leaf-500)' }}
        >
          {chemovarLabel}
        </span>
      </div>

      {/* Rangée de pastilles empilées — largeur ∝ part relative du terpène. */}
      <div
        className="flex w-full overflow-hidden rounded-full ring-1 ring-black/10"
        style={{ height: compact ? 6 : 10, background: 'var(--color-paper-300)' }}
        role="img"
        aria-label={TERPENE_ORDER.map((k) => `${tEnum('terpene', k)} ${percentOf(profile, k)}%`).join(', ')}
      >
        {TERPENE_ORDER.map((key) => {
          const pct = percentOf(profile, key);
          if (pct <= 0) return null;
          return (
            <div
              key={key}
              style={{ width: `${pct}%`, background: TERPENE_COLOR[key] }}
              title={`${tEnum('terpene', key)} ${pct}%`}
            />
          );
        })}
      </div>

      {/* Légende — uniquement les terpènes dominants, avec leur pastille. */}
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {dominant.map((key) => (
          <span key={key} className="flex items-center gap-1 font-data text-[10px]" style={{ color: 'var(--color-ink-700)' }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0" style={{ background: TERPENE_COLOR[key] }} />
            {tEnum('terpene', key)} {percentOf(profile, key)}%
          </span>
        ))}
      </div>

      {!compact && others.length > 0 && (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--color-ink-500)' }}>
          {t('terpeneProfile.otherTerpenes', {
            list: others.map((k) => `${tEnum('terpene', k)} ${percentOf(profile, k)}%`).join(', '),
          })}
        </p>
      )}

      {(profile.terpinoleneDominant || engine.isTerpinoleneCarrier(individual)) && (
        <p
          className="mt-1.5 flex items-center gap-1 text-[10px]"
          style={{ color: 'var(--color-terp-terpinolene)' }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: 'var(--color-terp-terpinolene)', opacity: profile.terpinoleneDominant ? 1 : 0.4 }}
          />
          {profile.terpinoleneDominant
            ? t('terpeneProfile.terpinoleneDominantNote')
            : t('terpeneProfile.terpinoleneCarrierNote')}
        </p>
      )}

      {!compact && (
        <p className="mt-1.5 text-[10px] italic" style={{ color: 'var(--color-ink-500)' }}>
          {t('terpeneProfile.randomDisclaimer')}
        </p>
      )}
    </div>
  );
}
