import { parseLigneeVarieties } from '../jardin/engine/backup';
import type { Variety } from '../jardin/model';
import { readAtelierVarieties, type Atelier } from './registry';

/** Variétés de l'atelier pas encore présentes au jardin (même origine, même nom). */
export function pendingVarieties(a: Atelier, existing: Variety[]): Variety[] {
  if (!a.myVarieties) return [];
  const raw = readAtelierVarieties(a);
  if (!raw.length) return [];
  let list: Variety[];
  try {
    list = parseLigneeVarieties(JSON.stringify({ app: 'lignee', crop: a.myVarieties.crop, kind: 'varieties', varieties: raw }));
  } catch {
    return [];
  }
  const have = new Set(existing.map((v) => `${v.origin}|${v.name}`));
  const seen = new Set<string>();
  return list.filter((v) => {
    const k = `${v.origin}|${v.name}`;
    if (have.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

