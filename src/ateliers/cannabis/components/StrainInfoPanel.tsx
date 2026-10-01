import type { StrainInfo } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';

const tempColor: Record<StrainInfo['tempPreference'], string> = {
  fraîche: 'var(--color-leaf-400)',
  tempérée: 'var(--color-resin-400)',
  chaude: 'var(--color-bloom-400)',
};

/**
 * Fiche de culture d'une variété : climat, floraison, cycle complet,
 * préférence de température, difficulté, environnement, hauteur.
 * Réutilisée en aperçu (formulaire de plantation) et sur la fiche
 * détaillée d'un spécimen issu directement d'une variété.
 *
 * Les libellés de section sont traduits FR/EN, ainsi que les valeurs des
 * trois enums fermées (tempPreference, difficulty, environment) via
 * `tEnum` — mais pas `origin`/`climat`/`heightRange`, texte libre de la
 * bibliothèque de variétés qui reste en français dans les deux langues.
 */
export function StrainInfoPanel({ info, compact = false }: { info: StrainInfo; compact?: boolean }) {
  const { t, tEnum } = useTranslation();
  const rows: Array<{ label: string; value: string }> = [
    { label: t('strainInfo.origin'), value: info.origin },
    { label: t('strainInfo.climate'), value: info.climate },
    { label: t('strainInfo.flowering'), value: `${info.floweringWeeks[0]}–${info.floweringWeeks[1]} ${t('strainInfo.weeks')}` },
    { label: t('strainInfo.totalCycle'), value: `${info.totalCycleWeeks[0]}–${info.totalCycleWeeks[1]} ${t('strainInfo.weeks')}` },
    { label: t('strainInfo.height'), value: info.heightRange },
    { label: t('strainInfo.environment'), value: tEnum('environment', info.environment) },
    { label: t('strainInfo.difficulty'), value: tEnum('difficulty', info.difficulty) },
  ];

  return (
    <div className={compact ? 'text-xs' : 'text-sm'}>
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ background: tempColor[info.tempPreference] }}
        />
        <span style={{ color: tempColor[info.tempPreference] }}>
          {t('strainInfo.temperaturePreference', { temp: tEnum('tempPreference', info.tempPreference) })}
        </span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="opacity-60">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
