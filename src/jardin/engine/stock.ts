/**
 * Stocks et liste de courses (phase 5).
 *
 * Un article garde la quantité constatée au dernier inventaire ; pour un
 * engrais ou un amendement du catalogue, les apports notés depuis sont
 * déduits à la volée. Les graines : un lot garde son nombre de graines,
 * et les cultures semées avec ce lot en consomment (graines semées
 * estimées d'après le taux de germination ; les cultures prévues sont
 * « réservées »).
 */
import { PRODUCT_BY_ID } from '../data/products';
import { SPECIES_BY_ID } from '../data/species';
import type { GardenData, ISODate, Plant, SeedLot, StockItem, StockUnit } from '../model';
import { addDays } from './dates';
import { isPlanted } from './crop';
import { seedState, seedsFor } from './season';
import { limeAdvice, soilFor } from './soil';

/** Facteur vers l'unité de base (g pour les masses, mL pour les volumes). */
const BASE: Record<StockUnit, number> = { g: 1, kg: 1000, mL: 1, L: 1000, pcs: 1 };

export function sameDimension(a: StockUnit, b: StockUnit): boolean {
  const dim = (u: StockUnit) => (u === 'g' || u === 'kg' ? 'mass' : u === 'mL' || u === 'L' ? 'volume' : 'count');
  return dim(a) === dim(b);
}

/** Convertit une quantité d'une unité à l'autre (même dimension). */
export function convert(q: number, from: StockUnit, to: StockUnit): number {
  return (q * BASE[from]) / BASE[to];
}

export interface StockLevel {
  item: StockItem;
  /** Consommé depuis l'inventaire (dans l'unité de l'article). */
  used: number;
  remaining: number;
  low: boolean;
  /** Les apports notés dépassent le stock : inventaire à refaire. */
  negative: boolean;
}

export function stockLevel(item: StockItem, data: Pick<GardenData, 'applications'>): StockLevel {
  let used = 0;
  const p = item.productId ? PRODUCT_BY_ID[item.productId] : undefined;
  if (p) {
    const appUnit: StockUnit = p.kind === 'liquid' ? 'mL' : 'g';
    if (sameDimension(appUnit, item.unit)) {
      for (const a of data.applications) if (a.productId === p.id && a.date >= item.since) used += convert(a.amount, appUnit, item.unit);
    }
  }
  const raw = item.qty - used;
  const remaining = Math.max(0, raw);
  return { item, used, remaining, low: item.min !== undefined && remaining <= item.min, negative: raw < 0 };
}

/** Article suivi pour un produit du catalogue (le plus récent). */
export function stockForProduct(data: Pick<GardenData, 'stocks' | 'applications'>, productId: string): StockLevel | undefined {
  const item = data.stocks.filter((s) => s.productId === productId).sort((a, b) => b.since.localeCompare(a.since))[0];
  return item ? stockLevel(item, data) : undefined;
}

/** Graines semées (estimées) pour une culture : plants ÷ taux de germination ; plants, bulbes, tubercules : un par pied. */
export function seedsUsedBy(plant: Plant, lot: SeedLot): number {
  const sp = SPECIES_BY_ID[plant.speciesId];
  if (!sp || isPlanted(sp)) return plant.count;
  return seedsFor(plant.count, lot.germRate ?? 0.8);
}

export interface SeedLevel {
  lot: SeedLot;
  used: number;
  reserved: number;
  /** undefined si le nombre de graines du lot n'est pas connu. */
  remaining?: number;
  low: boolean;
}

export function seedLevel(lot: SeedLot, plants: Plant[]): SeedLevel {
  let used = 0;
  let reserved = 0;
  for (const p of plants) {
    if (p.seedLotId !== lot.id) continue;
    if (p.status === 'planned') reserved += seedsUsedBy(p, lot);
    else used += seedsUsedBy(p, lot);
  }
  const remaining = lot.seeds !== undefined ? Math.max(0, lot.seeds - used - reserved) : undefined;
  return { lot, used, reserved, remaining, low: remaining !== undefined && remaining < 10 };
}

/** Meilleur lot pour semer une espèce : bon état d'abord, puis le plus récent, avec des graines restantes. */
export function bestLot(data: Pick<GardenData, 'seeds' | 'plants'>, speciesId: string, today: ISODate): SeedLot | undefined {
  const rank = { ok: 0, lastYear: 1, old: 2 } as const;
  return data.seeds
    .filter((l) => l.speciesId === speciesId)
    .filter((l) => {
      const r = seedLevel(l, data.plants).remaining;
      return r === undefined || r > 0;
    })
    .sort((a, b) => rank[seedState(a, today).state] - rank[seedState(b, today).state] || b.year - a.year)[0];
}

export type AutoLine =
  | { kind: 'stock'; key: string; item: StockItem; remaining: number }
  | { kind: 'seeds'; key: string; speciesId: string; plants: number; reason: 'none' | 'old' | 'short' }
  | { kind: 'plants'; key: string; speciesId: string; plants: number }
  | { kind: 'lime'; key: string; productId: string; grams: number };

/** Horizon des cultures prévues prises en compte dans la liste de courses. */
export const SHOPPING_HORIZON_DAYS = 120;

/** Lignes ajoutées d'office à la liste de courses. */
export function autoShopping(data: GardenData, today: ISODate): AutoLine[] {
  const out: AutoLine[] = [];
  for (const s of data.stocks) {
    const lv = stockLevel(s, data);
    if (lv.low) out.push({ kind: 'stock', key: `stock:${s.id}`, item: s, remaining: lv.remaining });
  }
  // Cultures prévues dans les prochains mois : graines ou plants à trouver.
  const horizon = addDays(today, SHOPPING_HORIZON_DAYS);
  const need = new Map<string, number>();
  for (const p of data.plants) {
    if (p.status !== 'planned' || p.sowDate > horizon) continue;
    need.set(p.speciesId, (need.get(p.speciesId) ?? 0) + p.count);
  }
  for (const [speciesId, plants] of need) {
    const sp = SPECIES_BY_ID[speciesId];
    if (!sp) continue;
    if (isPlanted(sp)) {
      out.push({ kind: 'plants', key: `plants:${speciesId}`, speciesId, plants });
      continue;
    }
    const lots = data.seeds.filter((l) => l.speciesId === speciesId);
    if (!lots.length) {
      out.push({ kind: 'seeds', key: `seeds:${speciesId}`, speciesId, plants, reason: 'none' });
      continue;
    }
    const good = lots.filter((l) => seedState(l, today).state !== 'old');
    if (!good.length) {
      out.push({ kind: 'seeds', key: `seeds:${speciesId}`, speciesId, plants, reason: 'old' });
      continue;
    }
    // Graines comptées : assez pour les cultures prévues qui n'ont pas encore de lot ?
    const counted = good.filter((l) => l.seeds !== undefined);
    if (counted.length === good.length) {
      const left = counted.reduce((s, l) => s + (seedLevel(l, data.plants).remaining ?? 0), 0);
      const unassigned = data.plants.filter((p) => p.status === 'planned' && p.speciesId === speciesId && !p.seedLotId && p.sowDate <= horizon);
      const wanted = unassigned.reduce((s, p) => s + seedsFor(p.count, counted[0].germRate ?? 0.8), 0);
      if (wanted > left) out.push({ kind: 'seeds', key: `seeds:${speciesId}`, speciesId, plants, reason: 'short' });
    }
  }
  // Chaulage conseillé : de quoi le faire.
  const limeNeed = new Map<string, number>();
  for (const bed of data.beds) {
    if (bed.kind === 'hydro' || bed.kind === 'pot') continue;
    const adv = limeAdvice(soilFor(data, bed.id), data, bed);
    if (adv) limeNeed.set(adv.product.id, (limeNeed.get(adv.product.id) ?? 0) + adv.productTotal);
  }
  for (const [productId, grams] of limeNeed) {
    const have = stockForProduct(data, productId);
    const haveG = have && sameDimension(have.item.unit, 'g') ? convert(have.remaining, have.item.unit, 'g') : 0;
    if (haveG < grams) out.push({ kind: 'lime', key: `lime:${productId}`, productId, grams: grams - haveG });
  }
  return out;
}
