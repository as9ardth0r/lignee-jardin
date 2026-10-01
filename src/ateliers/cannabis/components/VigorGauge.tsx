import { useTranslation } from '../i18n/LanguageContext';

/**
 * Jauge de vigueur — affiche la valeur du trait polygénique
 * ("vigueur", 8 loci additifs + bruit environnemental) normalisée en
 * pourcentage de la borne théorique de la session en cours.
 */
export function VigorGauge({
  percent,
  raw,
  size = 'sm',
}: {
  percent: number;
  raw: number;
  size?: 'sm' | 'lg';
}) {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(100, percent));
  const height = size === 'lg' ? 'h-2.5' : 'h-1.5';

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <span
          className={size === 'lg' ? 'text-xs' : 'text-[10px]'}
          style={{ color: 'var(--color-ink-500)' }}
        >
          {t('vigorGauge.label')}
        </span>
        <span
          className={`font-data ${size === 'lg' ? 'text-xs' : 'text-[10px]'}`}
          style={{ color: 'var(--color-leaf-500)' }}
          title={t('vigorGauge.rawValueTitle', { value: raw.toFixed(2) })}
        >
          {Math.round(clamped)}%
        </span>
      </div>
      <div
        className={`w-full overflow-hidden rounded-full ring-1 ring-black/10 ${height}`}
        style={{ background: 'var(--color-paper-300)' }}
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${clamped}%`, background: 'var(--color-leaf-500)' }}
        />
      </div>
    </div>
  );
}
