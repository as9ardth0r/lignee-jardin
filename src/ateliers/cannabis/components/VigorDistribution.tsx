import type { BreedingEngine, Individual } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';

const BUCKET_COUNT = 8;

/**
 * Histogramme de la vigueur au sein d'une génération ou d'une portée —
 * contrepoint visuel de SegregationChart : là où le locus B ségrège
 * en classes discrètes (I/II/III), la vigueur est un trait polygénique
 * qui se distribue en continu (cloche approximative), l'illustration
 * classique de l'hérédité quantitative par opposition à mendélienne
 * simple.
 */
export function VigorDistribution({ individuals, engine }: { individuals: Individual[]; engine: BreedingEngine }) {
  const { t, tPlural } = useTranslation();
  if (individuals.length < 2) return null;

  const percents = individuals.map((ind) => engine.vigorPercent(ind));
  const buckets = new Array(BUCKET_COUNT).fill(0);
  for (const p of percents) {
    const idx = Math.min(BUCKET_COUNT - 1, Math.floor((p / 100) * BUCKET_COUNT));
    buckets[idx] += 1;
  }
  const maxCount = Math.max(...buckets, 1);
  const mean = percents.reduce((a, b) => a + b, 0) / percents.length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-xs" style={{ color: 'var(--color-paper-300)' }}>
          {t('vigorDistribution.title')}
        </p>
        <p className="font-data text-[10px]" style={{ color: 'var(--color-leaf-400)' }}>
          {t('vigorDistribution.mean', { value: Math.round(mean) })}
        </p>
      </div>
      <div className="flex h-12 items-end gap-1">
        {buckets.map((count, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${Math.max(6, (count / maxCount) * 100)}%`,
              background: 'var(--color-leaf-500)',
              opacity: count === 0 ? 0.15 : 0.55 + 0.45 * (count / maxCount),
            }}
            title={tPlural('vigorDistribution.bucketTitle', count, {
              lo: Math.round((i / BUCKET_COUNT) * 100),
              hi: Math.round(((i + 1) / BUCKET_COUNT) * 100),
            })}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'var(--color-ink-500)' }}>
        <span>{t('vigorDistribution.low')}</span>
        <span>{t('vigorDistribution.high')}</span>
      </div>
    </div>
  );
}
