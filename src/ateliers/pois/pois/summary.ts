import type { FruitAppearance, SizeClass } from '../engine/pois/engine';
import type { TT, PsKey } from './i18n';

/** Résumé lisible : graines, fleurs, gousses, port. */
export function appearanceSummary(app: FruitAppearance, size: SizeClass, tt: TT): string {
  const parts = [tt(`seed.${app.seedShape}` as PsKey), tt(`coty.${app.cotyledon}` as PsKey), tt(`flower.${app.flower}` as PsKey), tt(`pod.${app.pod}` as PsKey)];
  if (app.podColor === 'yellow') parts.push(tt('fruit.yellowPod'));
  if (app.terminal) parts.push(tt('fruit.terminal'));
  parts.push(tt(app.dwarf ? 'fruit.dwarf' : 'fruit.tall'));
  if (app.leaf !== 'normal') parts.push(tt(`leaf.${app.leaf}` as PsKey));
  if (app.winter) parts.push(tt('fruit.winter'));
  parts.push(tt(`size.${size}` as PsKey));
  return parts.join(' · ');
}
