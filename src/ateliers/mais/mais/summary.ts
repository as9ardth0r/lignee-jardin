import type { FruitAppearance, SizeClass } from '../engine/mais/engine';
import type { TT, MzKey } from './i18n';

/** Résumé lisible : grain (couleur, texture), épi, plante. */
export function appearanceSummary(app: FruitAppearance, size: SizeClass, tt: TT): string {
  const k = app.kernel;
  const parts = [tt(`color.${app.color}` as MzKey)];
  if (k.texture !== 'normal') parts.push(tt(`texture.${k.texture}` as MzKey));
  parts.push(tt(`size.${size}` as MzKey));
  if (k.redCob && k.pericarp === 'none') parts.push(tt('fruit.redCob'));
  if (app.fruitCase !== 'naked') parts.push(tt(`case.${app.fruitCase}` as MzKey));
  if (app.branched) parts.push(tt('plant.branched'));
  if (app.plant !== 'green') parts.push(tt(`plant.${app.plant}` as MzKey));
  if (app.dwarf) parts.push(tt('plant.dwarf'));
  else if (app.brachytic) parts.push(tt('plant.brachytic'));
  if (app.popBarrier) parts.push(tt('fruit.ga1s'));
  if (app.maleSterile) parts.push(tt('fruit.cms'));
  return parts.join(' · ');
}
