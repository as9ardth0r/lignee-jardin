import type { CannabinoidPhenotype } from '../engine/genetics';
import { useTranslation } from '../i18n/LanguageContext';

/**
 * Représente le ratio THC:CBD comme une "goutte de résine" —
 * un dégradé vertical dont la ligne de partage indique la
 * proportion, plutôt qu'une jauge de type SaaS générique. La couleur
 * ambrée = THC, la couleur prune = CBD, cohérent avec la palette de
 * l'application (résine = or, anthocyane = prune).
 */
export function ResinSwatch({ pheno, size = 56 }: { pheno: CannabinoidPhenotype; size?: number }) {
  const { t } = useTranslation();
  // Chimiotype IV — CBG dominant : plus de ratio THC:CBD à représenter
  // (les deux valent 0), un remplissage plein dans la teinte "leaf"
  // (verte) distingue visuellement ce profil des I/II/III (or/prune).
  if (pheno.chemotype === 'IV') {
    return (
      <div className="flex items-center gap-3">
        <div
          className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-black/10"
          style={{ width: size, height: size, background: 'linear-gradient(180deg, var(--color-leaf-400), var(--color-leaf-500))' }}
          role="img"
          aria-label={`CBG ${pheno.cbgPercent}%, ${t('resinSwatch.residual')}`}
        />
        <div className="font-data text-xs leading-tight">
          <div style={{ color: 'var(--color-leaf-500)' }}>CBG {pheno.cbgPercent}%</div>
          <div style={{ color: 'var(--color-ink-500)' }}>THC/CBD ≈ 0%</div>
        </div>
      </div>
    );
  }

  // Chimiotype VI — CBC dominant (juvénilité prolongée, cc) : même
  // traitement visuel que le CBG (remplissage plein), mais dans une
  // teinte ambrée/dorée distincte du vert IV et du pâle V, cohérente
  // avec la palette "résine".
  if (pheno.chemotype === 'VI') {
    return (
      <div className="flex items-center gap-3">
        <div
          className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-black/10"
          style={{ width: size, height: size, background: 'linear-gradient(180deg, var(--color-resin-600), var(--color-ink-700))' }}
          role="img"
          aria-label={`CBC ${pheno.cbcPercent}%, ${t('resinSwatch.residual')}`}
        />
        <div className="font-data text-xs leading-tight">
          <div style={{ color: 'var(--color-resin-500)' }}>CBC {pheno.cbcPercent}%</div>
          <div style={{ color: 'var(--color-ink-500)' }}>THC/CBD ≈ 0%</div>
        </div>
      </div>
    );
  }

  // Chimiotype V — chanvre fibre : cannabinoïdes quasi indétectables,
  // remplissage neutre/pâle plutôt qu'un dégradé qui suggérerait une
  // dominance THC ou CBD inexistante ici.
  if (pheno.chemotype === 'V') {
    return (
      <div className="flex items-center gap-3">
        <div
          className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-black/10"
          style={{ width: size, height: size, background: 'var(--color-paper-300)' }}
          role="img"
          aria-label={t('resinSwatch.cannabinoidsApprox', { value: pheno.totalPotencyPercent }) + `, ${t('resinSwatch.hempFiber')}`}
        />
        <div className="font-data text-xs leading-tight">
          <div style={{ color: 'var(--color-ink-500)' }}>{t('resinSwatch.cannabinoidsApprox', { value: pheno.totalPotencyPercent })}</div>
          <div style={{ color: 'var(--color-ink-500)' }}>{t('resinSwatch.hempFiber')}</div>
        </div>
      </div>
    );
  }

  // Chimiotypes I/II/III — le dégradé suit le ratio THC:CBD (proportion
  // allélique, 0–1) : un pur repère visuel. Le texte affiche lui les
  // taux réalistes en % de matière sèche (jamais de valeur du type
  // "97% THC").
  const ratioPct = Math.round(pheno.thc * 100);
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-black/10"
        style={{ width: size, height: size }}
        role="img"
        aria-label={
          pheno.propylSeries
            ? `THCV ${pheno.thcvPercent}%, CBDV ${pheno.cbdvPercent}%`
            : `THC ${pheno.thcPercent}%, CBD ${pheno.cbdPercent}%`
        }
      >
        <div className="absolute inset-0" style={{ background: 'var(--color-bloom-500)' }} />
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: `${ratioPct}%`, background: 'linear-gradient(180deg, var(--color-resin-400), var(--color-resin-600))' }}
        />
      </div>
      <div className="font-data text-xs leading-tight">
        {pheno.propylSeries ? (
          <>
            <div style={{ color: 'var(--color-resin-500)' }}>THCV {pheno.thcvPercent}%</div>
            <div style={{ color: 'var(--color-bloom-500)' }}>CBDV {pheno.cbdvPercent}%</div>
          </>
        ) : (
          <>
            <div style={{ color: 'var(--color-resin-500)' }}>THC {pheno.thcPercent}%</div>
            <div style={{ color: 'var(--color-bloom-500)' }}>CBD {pheno.cbdPercent}%</div>
          </>
        )}
      </div>
    </div>
  );
}
