/**
 * Champignons : prévisions d'une culture (colonisation, fructification,
 * volées), prochaine action, efficacité biologique, lignée des souches et
 * calculateurs du labo (hydratation, ensemencement, grain, chevilles…).
 */
import { MUSHROOM_BY_ID, MUSHROOM_PRICE, SUBSTRATE_BY_ID, type MushroomSpecies, type SubstrateId } from '../data/mushrooms';
import type { GardenData, ISODate, MushBatch, MushStage } from '../model';
import { addDays, diffDays, monthOf } from './dates';
import { inWindow } from './crop';

export const MUSH_STAGES: MushStage[] = ['agar', 'lc', 'grain', 'substrate', 'log', 'bed'];

/** Ralentissement de la colonisation hors de la plage de température de l'espèce. */
export function tempFactor(sp: Pick<MushroomSpecies, 'colonTemp'>, t: number | undefined): number {
  if (t === undefined) return 1;
  const [lo, hi] = sp.colonTemp;
  if (t < lo) return 1 + 0.12 * (lo - t);
  if (t > hi) return 1 + 0.15 * (t - hi);
  return 1;
}

/** Durée de colonisation attendue (jours) d'une étape, à la température donnée. */
export function colonRange(sp: MushroomSpecies, stage: MushStage, t?: number): [number, number] {
  const k = tempFactor(sp, t);
  const slow = Math.min(2, Math.max(0.8, sp.colonDays[0] / 14));
  let r: [number, number];
  if (stage === 'agar' || stage === 'lc') r = [7, 14];
  else if (stage === 'grain') r = [Math.round(10 * slow), Math.round(21 * slow)];
  else if (stage === 'substrate') r = sp.colonDays;
  else r = sp.outdoor ? [sp.outdoor.firstMonths[0] * 30, sp.outdoor.firstMonths[1] * 30] : sp.colonDays;
  if (stage === 'log' || stage === 'bed') return r;
  return [Math.round(r[0] * k), Math.round(r[1] * k)];
}

/** Espèces dont le bloc doit mûrir après colonisation (shiitake : croûte brune ; shimeji). */
export function maturationDays(sp: MushroomSpecies): number {
  if (sp.id === 'm-shiitake') return 28;
  if (sp.id === 'm-shimeji') return 35;
  return 0;
}

export type MushNext =
  | 'shake'
  | 'checkColon'
  | 'overdue'
  | 'transfer'
  | 'useLC'
  | 'spawn'
  | 'mature'
  | 'initiate'
  | 'coldShock'
  | 'pins'
  | 'harvest'
  | 'rest'
  | 'nextFlush'
  | 'spent'
  | 'waitSeason'
  | 'fruitSeason'
  | 'water'
  | 'none';

export interface MushInfo {
  species: MushroomSpecies;
  age: number;
  /** Colonisation prévue (dates) et avancement estimé (0–1). */
  colonFrom: ISODate;
  colonTo: ISODate;
  progress: number;
  next: MushNext;
  due: ISODate;
  /** Récolte totale (g), efficacité biologique (%), récolte attendue (g, fourchette). */
  totalG: number;
  be?: number;
  expectG?: [number, number];
  flushesDone: number;
  tempWarn?: 'cold' | 'hot';
}

const lastHarvest = (b: MushBatch) => b.harvests.reduce<ISODate | undefined>((m, h) => (!m || h.date > m ? h.date : m), undefined);

/** Efficacité biologique : g frais récoltés pour 100 g de substrat sec. */
export function bioEfficiency(b: Pick<MushBatch, 'harvests' | 'dryKg'>): number | undefined {
  if (!b.dryKg || b.dryKg <= 0 || b.harvests.length === 0) return undefined;
  return (b.harvests.reduce((s, h) => s + h.g, 0) / (b.dryKg * 1000)) * 100;
}

export function mushInfo(b: MushBatch, today: ISODate): MushInfo {
  const sp = MUSHROOM_BY_ID[b.speciesId];
  const [lo, hi] = colonRange(sp, b.stage, b.tempC);
  const age = Math.max(0, diffDays(b.started, today));
  const colonFrom = addDays(b.started, lo);
  const colonTo = addDays(b.started, hi);
  const progress = b.status === 'incubating' ? Math.min(1, age / Math.max(1, (lo + hi) / 2)) : 1;
  const totalG = b.harvests.reduce((s, h) => s + h.g, 0);
  const flushesDone = countFlushes(b);
  const fruiting = b.stage === 'substrate' || b.stage === 'log' || b.stage === 'bed';
  const expectG: [number, number] | undefined = fruiting && b.dryKg && sp.be[1] > 0 ? [Math.round(b.dryKg * 10 * sp.be[0]), Math.round(b.dryKg * 10 * sp.be[1])] : undefined;
  const tempWarn: MushInfo['tempWarn'] = b.tempC === undefined || b.status !== 'incubating' ? undefined : b.tempC < sp.colonTemp[0] - 2 ? 'cold' : b.tempC > sp.colonTemp[1] + 2 ? 'hot' : undefined;
  const base = { species: sp, age, colonFrom, colonTo, progress, totalG, be: bioEfficiency(b), expectG, flushesDone, tempWarn };
  const month = monthOf(today);
  const out = (next: MushNext, due: ISODate): MushInfo => ({ ...base, next, due });

  if (b.status === 'done' || b.status === 'contam') return out('none', today);

  // Bûches et planches extérieures : on attend la saison de fructification.
  if ((b.stage === 'log' || b.stage === 'bed') && sp.outdoor) {
    const inSeason = inWindow(month, sp.outdoor.fruit);
    if (b.status === 'fruiting') return out('harvest', addDays(b.fruiting ?? today, sp.pinDays[0] + sp.fruitDays[0]));
    if (age < lo) return out('waitSeason', colonFrom);
    if (inSeason) return out(sp.coldShock && b.stage === 'log' && (!lastHarvest(b) || diffDays(lastHarvest(b)!, today) >= 42) ? 'coldShock' : 'fruitSeason', today);
    return out('waitSeason', nextSeasonStart(sp.outdoor.fruit, today));
  }

  if (b.status === 'incubating') {
    if (b.stage === 'grain' && age < Math.round(lo * 0.35)) return out('shake', addDays(b.started, Math.round(lo * 0.35)));
    if (age < lo) return out('checkColon', colonFrom);
    if (age > hi + 7) return out('overdue', colonTo);
    return out('checkColon', today);
  }
  if (b.status === 'colonized') {
    const col = b.colonized ?? today;
    if (b.stage === 'agar') return out('transfer', col);
    if (b.stage === 'lc') return out('useLC', col);
    if (b.stage === 'grain') return out('spawn', col);
    const mat = maturationDays(sp);
    if (mat && diffDays(col, today) < mat) return out('mature', addDays(col, mat));
    return out(sp.coldShock ? 'coldShock' : 'initiate', mat ? addDays(col, mat) : col);
  }
  if (b.status === 'fruiting') {
    const f = b.fruiting ?? today;
    const last = lastHarvest(b);
    if (last && last >= f) return out('rest', addDays(last, sp.restDays));
    return out(diffDays(f, today) < sp.pinDays[0] ? 'pins' : 'harvest', addDays(f, sp.pinDays[0] + sp.fruitDays[0]));
  }
  // Au repos entre deux volées.
  if (flushesDone >= sp.flushes) return out('spent', today);
  const last = lastHarvest(b) ?? today;
  return out('nextFlush', addDays(last, sp.restDays));
}

/** Volées : récoltes séparées de plus de 5 jours. */
export function countFlushes(b: Pick<MushBatch, 'harvests'>): number {
  const dates = [...new Set(b.harvests.map((h) => h.date))].sort();
  let n = 0;
  let prev: ISODate | undefined;
  for (const d of dates) {
    if (!prev || diffDays(prev, d) > 5) n++;
    prev = d;
  }
  return n;
}

function nextSeasonStart(ranges: Array<[number, number]>, today: ISODate): ISODate {
  for (let i = 1; i <= 366; i += 7) {
    const d = addDays(today, i);
    if (inWindow(monthOf(d), ranges)) return `${d.slice(0, 7)}-01`;
  }
  return today;
}

// --- Lignée et souches ------------------------------------------------------------------------

/** Chaîne des cultures parentes, de la plus ancienne à celle-ci. */
export function lineage(b: MushBatch, all: MushBatch[]): MushBatch[] {
  const byId = new Map(all.map((x) => [x.id, x]));
  const chain: MushBatch[] = [b];
  const seen = new Set([b.id]);
  let cur = b;
  while (cur.parentId && byId.has(cur.parentId) && !seen.has(cur.parentId)) {
    cur = byId.get(cur.parentId)!;
    seen.add(cur.id);
    chain.unshift(cur);
  }
  return chain;
}

/** Génération de culture : nombre de repiquages sur gélose ou liquide depuis l'origine ou le dernier clone. */
export function generation(b: MushBatch, all: MushBatch[]): number {
  let g = 0;
  for (const x of lineage(b, all)) {
    if (x.clone) g = 0;
    if (x.stage === 'agar' || x.stage === 'lc') g++;
  }
  return g;
}

/** Nom de souche : le sien, sinon celui de la culture parente la plus proche. */
export function strainOf(b: MushBatch, all: MushBatch[]): string | undefined {
  const chain = lineage(b, all);
  for (let i = chain.length - 1; i >= 0; i--) if (chain[i].strain) return chain[i].strain;
  return undefined;
}

export interface StrainScore {
  speciesId: string;
  strain: string;
  runs: number;
  be: number;
  totalG: number;
}

/** Classement des souches par efficacité biologique moyenne (cultures de fructification pesées). */
export function strainRanking(all: MushBatch[]): StrainScore[] {
  const groups = new Map<string, { speciesId: string; strain: string; bes: number[]; totalG: number }>();
  for (const b of all) {
    const be = bioEfficiency(b);
    if (be === undefined) continue;
    const strain = strainOf(b, all) ?? '—';
    const key = `${b.speciesId}|${strain}`;
    const g = groups.get(key) ?? { speciesId: b.speciesId, strain, bes: [], totalG: 0 };
    g.bes.push(be);
    g.totalG += b.harvests.reduce((s, h) => s + h.g, 0);
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({ speciesId: g.speciesId, strain: g.strain, runs: g.bes.length, be: g.bes.reduce((s, x) => s + x, 0) / g.bes.length, totalG: g.totalG })).sort((a, b) => b.be - a.be);
}

/** Étape suivante proposée quand on ensemence à partir d'une culture. */
export function childStage(stage: MushStage, sp: MushroomSpecies): MushStage {
  if (stage === 'agar') return 'grain';
  if (stage === 'lc') return 'grain';
  if (stage === 'grain') return sp.methods.includes('bag') || sp.methods.includes('straw') || sp.methods.includes('bucket') || sp.methods.includes('jar') ? 'substrate' : sp.methods.includes('bed') ? 'bed' : 'log';
  return 'agar';
}

// --- Tâches du jour ------------------------------------------------------------------------------

export interface MushTask {
  key: string;
  batchId: string;
  what: MushNext;
  due: ISODate;
  priority: 1 | 2 | 3;
  bedId?: string;
}

/** Semaine (lundi) d'une date, pour ne rappeler l'arrosage qu'une fois par semaine. */
function weekStamp(d: ISODate): string {
  const dow = (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(d, -dow);
}

const TASK_NEXT: MushNext[] = ['shake', 'checkColon', 'overdue', 'transfer', 'useLC', 'spawn', 'initiate', 'coldShock', 'harvest', 'nextFlush', 'spent', 'fruitSeason'];

/** Sécheresse récente : moins de 5 mm de pluie en 7 jours par temps doux, sans pluie annoncée sous 2 jours. */
export function dryWeek(weather: GardenData['weather'], today: ISODate): { rain: number } | null {
  if (!weather) return null;
  const past = weather.days.filter((d) => d.date < today && d.date >= addDays(today, -7));
  const next = weather.days.filter((d) => d.date >= today && d.date <= addDays(today, 1));
  if (past.length < 5) return null;
  const rain = past.reduce((s, d) => s + d.rain, 0);
  if (rain >= 5 || next.reduce((s, d) => s + d.rain, 0) >= 3) return null;
  if (Math.max(...past.map((d) => d.tmax)) < 12) return null;
  return { rain };
}

export function mushroomTasks(data: Pick<GardenData, 'mushrooms'> & Partial<Pick<GardenData, 'weather'>>, today: ISODate, horizon: ISODate): MushTask[] {
  const out: MushTask[] = [];
  const dry = dryWeek(data.weather, today);
  if (dry) {
    for (const b of data.mushrooms ?? []) {
      if ((b.stage !== 'log' && b.stage !== 'bed') || b.status === 'done' || b.status === 'contam' || !MUSHROOM_BY_ID[b.speciesId] || MUSHROOM_BY_ID[b.speciesId].methods.includes('tree')) continue;
      out.push({ key: `mush:water:${b.id}:${weekStamp(today)}`, batchId: b.id, what: 'water', due: today, priority: 2, bedId: b.bedId });
    }
  }
  for (const b of data.mushrooms ?? []) {
    if (!MUSHROOM_BY_ID[b.speciesId] || b.status === 'done' || b.status === 'contam') continue;
    const i = mushInfo(b, today);
    if (!TASK_NEXT.includes(i.next) || i.due > horizon) continue;
    // Une seule tâche par étape et par période (la clé change avec l'état de la culture).
    const stamp = i.next === 'fruitSeason' || i.next === 'coldShock' ? today.slice(0, 7) : (b.fruiting ?? b.colonized ?? b.started) + (b.harvests.length ? `:${b.harvests.length}` : '');
    out.push({ key: `mush:${i.next}:${b.id}:${stamp}`, batchId: b.id, what: i.next, due: i.due < today ? today : i.due, priority: i.next === 'overdue' || i.next === 'harvest' || i.next === 'shake' ? 1 : 2, bedId: b.bedId });
  }
  return out;
}

// --- Calculateurs du labo ------------------------------------------------------------------------

/** Eau à ajouter (L) pour amener `dryKg` de matériau (à `dryMoisture` % d'eau) à `target` % d'humidité. */
export function waterToAdd(dryKg: number, dryMoisture: number, target: number): number {
  if (dryKg <= 0 || target >= 100) return 0;
  const solids = dryKg * (1 - dryMoisture / 100);
  const wet = solids / (1 - target / 100);
  return Math.max(0, wet - dryKg);
}

/** Poids humide du substrat une fois hydraté (kg). */
export function wetWeight(dryKg: number, dryMoisture: number, target: number): number {
  return dryKg + waterToAdd(dryKg, dryMoisture, target);
}

/** Blanc nécessaire (kg) pour un substrat humide (kg) au taux donné (% du poids humide). */
export function spawnFor(wetKg: number, ratePct: number): number {
  return (wetKg * ratePct) / 100;
}

/** Poids de grain colonisé dans un bocal (kg par litre de bocal rempli aux 2/3). */
export const SPAWN_KG_PER_L = 0.6;
/** Grain sec à préparer par litre de bocal (kg). */
export const DRY_GRAIN_KG_PER_L = 0.3;

export function jarsFor(spawnKg: number, jarL = 1): number {
  return spawnKg <= 0 ? 0 : Math.ceil(spawnKg / (SPAWN_KG_PER_L * jarL));
}

/** Chevilles pour une bûche : rangées décalées tous les ~6 cm du tour, un trou tous les 15 cm. */
export function plugsFor(diamCm: number, lengthCm: number): { rows: number; perRow: number; total: number } {
  const rows = Math.max(4, Math.round((Math.PI * diamCm) / 6));
  const perRow = Math.max(1, Math.floor((lengthCm - 10) / 15) + 1);
  return { rows, perRow, total: rows * perRow };
}

/** Planche extérieure : volume de copeaux (m³) et blanc (kg, fourchette). */
export function bedFor(areaM2: number, depthCm = 20): { chipsM3: number; spawnKg: [number, number] } {
  return { chipsM3: (areaM2 * depthCm) / 100, spawnKg: [areaM2 * 1, areaM2 * 2] };
}

/** Recettes du labo pour un volume (L). */
export function labRecipe(kind: 'agar' | 'lc', volumeL: number): Array<{ what: 'malt' | 'agar' | 'yeast' | 'honey' | 'water' | 'plates'; amount: number }> {
  const v = Math.max(0, volumeL);
  if (kind === 'agar')
    return [
      { what: 'water', amount: v },
      { what: 'malt', amount: 20 * v },
      { what: 'agar', amount: 20 * v },
      { what: 'yeast', amount: 1 * v },
      { what: 'plates', amount: Math.floor((v * 1000) / 22) },
    ];
  return [
    { what: 'water', amount: v },
    { what: 'malt', amount: 15 * v },
    { what: 'honey', amount: 30 * v },
  ];
}

/** Hydratation conseillée d'un substrat. */
export function substrateTarget(id: SubstrateId): { moisture: number; dryMoisture: number; spawnRate: [number, number] } {
  const s = SUBSTRATE_BY_ID[id];
  return { moisture: s.moisture, dryMoisture: s.dryMoisture, spawnRate: s.spawnRate };
}

// --- Bilan de la saison -------------------------------------------------------------------------------

export interface MushSeasonRow {
  speciesId: string;
  grams: number;
  priceKg: number;
  value: number;
}

/** Récoltes de champignons d'une année, par espèce, avec leur valeur (prix choisi ou de référence). */
export function mushroomSeason(data: Pick<GardenData, 'mushrooms' | 'prices'>, year: number): { rows: MushSeasonRow[]; grams: number; value: number } {
  const g = new Map<string, number>();
  for (const b of data.mushrooms ?? []) for (const h of b.harvests) if (Number(h.date.slice(0, 4)) === year) g.set(b.speciesId, (g.get(b.speciesId) ?? 0) + h.g);
  const rows = [...g.entries()]
    .map(([speciesId, grams]) => {
      const priceKg = data.prices?.[speciesId] ?? MUSHROOM_PRICE[speciesId] ?? 15;
      return { speciesId, grams, priceKg, value: (grams / 1000) * priceKg };
    })
    .sort((a, b) => b.grams - a.grams);
  return { rows, grams: rows.reduce((s, r) => s + r.grams, 0), value: rows.reduce((s, r) => s + r.value, 0) };
}

/** Années où des champignons ont été récoltés. */
export function mushroomYears(data: Pick<GardenData, 'mushrooms'>): number[] {
  return [...new Set((data.mushrooms ?? []).flatMap((b) => b.harvests.map((h) => Number(h.date.slice(0, 4)))))];
}

// --- Au jardin : exposition --------------------------------------------------------------------

/** Exposition idéale d'une culture extérieure : la truffière veut le soleil, la strophaire et l'agaric la mi-ombre, le reste l'ombre. */
export function outdoorSun(sp: MushroomSpecies): 'full' | 'partial' | 'shade' {
  if (sp.methods.includes('tree')) return 'full';
  if (sp.id === 'm-wine-cap' || sp.id === 'm-almond' || sp.id === 'm-shaggy') return 'partial';
  return 'shade';
}

/** Écart entre l'exposition d'une planche et celle que veut le champignon. */
export function sunAdvice(sp: MushroomSpecies, exposure: 'full' | 'partial' | 'shade'): 'ok' | 'tooSunny' | 'tooShady' {
  const want = outdoorSun(sp);
  const rank = { shade: 0, partial: 1, full: 2 };
  const d = rank[exposure] - rank[want];
  return d > 0 ? 'tooSunny' : d < -1 || (want === 'full' && d < 0) ? 'tooShady' : 'ok';
}

/** Cultures de champignons en cours sur une planche. */
export function mushroomsOnBed(data: Pick<GardenData, 'mushrooms'>, bedId: string): MushBatch[] {
  return (data.mushrooms ?? []).filter((b) => b.bedId === bedId && b.status !== 'done' && b.status !== 'contam');
}
