import type { FruitAppearance, SizeClass } from '../engine/chou/engine';
import type { TT, BrKey } from './i18n';

/** Résumé lisible : morphotype, couleur, feuilles, reproduction. */
export function appearanceSummary(app: FruitAppearance, size: SizeClass, tt: TT): string {
  const curdy = app.morphotype === 'cauliflower' || app.morphotype === 'romanesco';
  const parts = [tt(`morpho.${app.morphotype}` as BrKey)];
  if (curdy) parts.push(tt(`curd.${app.curd}` as BrKey));
  else if (app.purple) parts.push(tt('fruit.purple'));
  parts.push(tt(`size.${size}` as BrKey));
  if (app.savoy) parts.push(tt('fruit.savoy'));
  if (app.curly) parts.push(tt('fruit.curly'));
  if (app.glossy) parts.push(tt('fruit.glossy'));
  if (app.annual) parts.push(tt('fruit.annual'));
  if (app.highGlucoraphanin) parts.push(tt('fruit.gr'));
  parts.push(tt(app.selfCompatible ? 'fruit.sc' : 'fruit.si'));
  if (app.maleSterile) parts.push(tt('fruit.ogura'));
  return parts.join(' · ');
}
