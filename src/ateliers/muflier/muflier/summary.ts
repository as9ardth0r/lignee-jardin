import type { FlowerAppearance, HeightClass } from '../engine/muflier/engine';
import type { TT, AmKey } from './i18n';

/** Résumé lisible : couleur, motifs, forme, taille, auto-incompatibilité. */
export function appearanceSummary(app: FlowerAppearance, height: HeightClass, tt: TT): string {
  const parts: string[] = [tt(`color.${app.color}` as AmKey)];
  if (app.face) parts.push(tt('fruit.face'));
  if (app.veins) parts.push(tt('fruit.veins'));
  if (app.flecked) parts.push(tt('fruit.flecked'));
  if (app.shape !== 'normal') parts.push(tt(`shape.${app.shape}` as AmKey));
  parts.push(tt(`size.${height}` as AmKey));
  if (app.selfIncompatible) parts.push(tt('fruit.selfIncompatible'));
  return parts.join(' · ');
}
