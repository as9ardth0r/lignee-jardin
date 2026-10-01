import type { FruitAppearance, RootShape, SizeClass } from '../engine/carotte/engine';
import type { TT, DcKey } from './i18n';

/** Résumé lisible : couleur, forme, taille, cycle, stérilité. */
export function appearanceSummary(app: FruitAppearance, size: SizeClass, tt: TT, shape?: RootShape): string {
  const parts: string[] = [];
  if (app.purple === 'none') parts.push(tt(`color.${app.core}` as DcKey));
  else parts.push(tt(app.purple === 'full' ? 'color.purpleFull' : 'color.purpleOuter', { core: tt(`core.${app.core}` as DcKey) }));
  if (shape) parts.push(tt(`shape.${shape}` as DcKey));
  parts.push(tt(`size.${size}` as DcKey));
  parts.push(tt(app.annual ? 'fruit.annual' : 'fruit.biennial'));
  if (app.sterility) parts.push(tt(app.sterility === 'petaloid' ? 'fruit.petaloid' : 'fruit.brownAnther'));
  return parts.join(' · ');
}
