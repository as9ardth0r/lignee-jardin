import type { FruitAppearance, SizeClass } from '../engine/patate/engine';
import type { TT, PtKey } from './i18n';

/** Résumé lisible : peau, chair, forme, taille, ploïdie, reproduction. */
export function appearanceSummary(app: FruitAppearance, size: SizeClass, tt: TT): string {
  const parts = [tt(`skin.${app.skin}` as PtKey), tt(`flesh.${app.flesh}` as PtKey), tt(`shape.${app.shape}` as PtKey), tt(`size.${size}` as PtKey)];
  if (app.deepEyes) parts.push(tt('fruit.deepEyes'));
  if (!app.longDay) parts.push(tt('fruit.shortDay'));
  if (app.ploidy === 2) parts.push(tt(app.selfCompatible ? 'fruit.sc' : 'fruit.si'));
  if (app.twoNPollen) parts.push(tt('fruit.twoN'));
  if (app.maleSterile) parts.push(tt('fruit.wSterile'));
  if (app.inducer) parts.push(tt('fruit.inducer'));
  return parts.join(' · ');
}
