import type { FruitAppearance, SizeClass } from '../engine/pasteque/engine';
import type { TT, WmKey } from './i18n';

/** Résumé lisible de l’aspect d’un fruit (chair, forme, écorce, taille, graines…). */
export function appearanceSummary(app: FruitAppearance, size: SizeClass, tt: TT): string {
  const parts = [tt(`flesh.${app.flesh}` as WmKey), tt(`shape.${app.shape}` as WmKey), tt(app.golden ? 'rind.golden' : (`rind.${app.rind}` as WmKey)), tt(`size.${size}` as WmKey)];
  if (app.spotted) parts.push(tt('fruit.spotted'));
  if (app.seedless) parts.push(tt('fruit.seedless'));
  else {
    parts.push(tt(`seed.${app.seed}` as WmKey));
    if (app.egusi) parts.push(tt('fruit.egusi'));
    if (app.tinySeed) parts.push(tt('fruit.tinySeed'));
  }
  if (app.explosive) parts.push(tt('fruit.explosive'));
  if (app.bush) parts.push(tt('plant.bush'));
  if (app.bitter) parts.push(tt('fruit.bitter'));
  return parts.join(' · ');
}

