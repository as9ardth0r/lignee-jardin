import type { FlowerAppearance, HeightClass } from '../engine/tournesol/engine';
import type { TT, HaKey } from './i18n';

/** Résumé lisible : couleur, motifs, forme, taille, auto-incompatibilité. */
export function appearanceSummary(app: FlowerAppearance, height: HeightClass, tt: TT): string {
  const parts: string[] = [tt(`color.${app.color}` as HaKey)];
  if (!app.face && app.shape !== 'peloric') parts.push(tt('fruit.face'));
  if (app.veins) parts.push(tt('fruit.veins'));
  if (app.flecked) parts.push(tt('fruit.flecked'));
  if (app.shape !== 'normal') parts.push(tt(`shape.${app.shape}` as HaKey));
  parts.push(tt(`size.${height}` as HaKey));
  if (app.selfIncompatible) parts.push(tt('fruit.selfIncompatible'));
  return parts.join(' · ');
}
