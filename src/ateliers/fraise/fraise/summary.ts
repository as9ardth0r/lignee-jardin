import type { FruitAppearance, SizeClass } from '../engine/fraise/engine';
import type { TT, FaKey } from './i18n';

/** Résumé lisible : couleur, taille, floraison, stolons, sexe. */
export function appearanceSummary(app: FruitAppearance, size: SizeClass, tt: TT): string {
  const parts: string[] = [];
  parts.push(tt(`color.${app.color}` as FaKey));
  parts.push(tt(`size.${size}` as FaKey));
  parts.push(tt(app.everbearing ? 'fruit.everbearing' : 'fruit.juneBearing'));
  if (app.runnerless) parts.push(tt('fruit.runnerless'));
  if (app.peach) parts.push(tt('fruit.peach'));
  if (app.sterility) parts.push(tt('fruit.female'));
  if (app.sterileHybrid) parts.push(tt('fruit.sterileHybrid'));
  return parts.join(' · ');
}
