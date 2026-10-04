/**
 * Disposition des cultures sur une planche, et voisinages.
 *
 * Chaque culture peut avoir un emplacement (rectangle en mètres dans le
 * repère de la planche : x le long de la largeur, y le long de la
 * profondeur). Sans emplacement, l'app en propose un : rectangle de la
 * surface de la culture, posé à la première place libre (de gauche à
 * droite). Les voisinages (bons et mauvais compagnons) se calculent sur
 * ces rectangles, y compris d'une planche à l'autre.
 */
import { COMPANIONS, type Companion } from '../data/speciesExtra';
import type { Bed, GardenData, Plant, PlantPos } from '../model';
import { plantArea } from './crop';

/** Pas de placement (m). */
export const SNAP = 0.05;
/** Distance (m) en dessous de laquelle deux cultures sont voisines. */
export const NEIGHBOUR_GAP = 0.5;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Cultures dessinées sur la planche : en place ou prévues (les cultures terminées n'occupent plus le sol). */
export function bedPlantsShown(data: GardenData, bedId: string): Plant[] {
  return data.plants.filter((p) => p.bedId === bedId && p.status !== 'ended').sort((a, b) => a.sowDate.localeCompare(b.sowDate) || a.id.localeCompare(b.id));
}

/** Rectangle par défaut d'une culture : sa surface, sur toute la profondeur de la planche si elle est étroite. */
export function defaultFootprint(plant: Pick<Plant, 'area' | 'count' | 'speciesId'>, bed: Pick<Bed, 'w' | 'h'>): { w: number; h: number } {
  const area = Math.max(0.01, plantArea(plant));
  const side = Math.sqrt(area);
  // Planche étroite : bandes sur toute la profondeur ; sinon carré.
  const h = r2(snap(Math.max(SNAP, Math.min(bed.h, bed.h <= 1.2 || side >= bed.h * 0.6 ? bed.h : side))));
  const w = r2(snap(Math.max(SNAP, Math.min(bed.w, area / h))));
  return { w, h };
}

export function overlap(a: PlantPos, b: PlantPos): number {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ox * oy;
}

/** Distance entre deux rectangles (0 s'ils se touchent ou se chevauchent). */
export function rectGap(a: PlantPos, b: PlantPos): number {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return Math.hypot(dx, dy);
}

/** Garde un rectangle dans la planche. */
export function clampPos(p: PlantPos, bed: Pick<Bed, 'w' | 'h'>): PlantPos {
  const w = Math.min(bed.w, Math.max(SNAP, snap(p.w)));
  const h = Math.min(bed.h, Math.max(SNAP, snap(p.h)));
  return { x: r2(Math.max(0, Math.min(bed.w - w, snap(p.x)))), y: r2(Math.max(0, Math.min(bed.h - h, snap(p.y)))), w: r2(w), h: r2(h) };
}

/** Première place libre pour un rectangle (balayage de gauche à droite, puis de haut en bas). */
export function findSpot(size: { w: number; h: number }, bed: Pick<Bed, 'w' | 'h'>, taken: PlantPos[]): PlantPos | null {
  for (let x = 0; x + size.w <= bed.w + 1e-6; x += SNAP)
    for (let y = 0; y + size.h <= bed.h + 1e-6; y += SNAP) {
      const c = { x: r2(x), y: r2(y), w: size.w, h: size.h };
      if (taken.every((t) => overlap(c, t) < 1e-6)) return c;
    }
  return null;
}

export interface LaidOut {
  plant: Plant;
  pos: PlantPos;
  /** Emplacement choisi par l'app (pas encore enregistré). */
  auto: boolean;
  /** Pas de place libre : posé par-dessus les autres. */
  overflow: boolean;
}

/** Disposition d'une planche : emplacements enregistrés, puis les autres placés à la première place libre. */
export function layoutBed(data: GardenData, bed: Bed): LaidOut[] {
  const plants = bedPlantsShown(data, bed.id);
  const out: LaidOut[] = [];
  for (const p of plants) if (p.pos) out.push({ plant: p, pos: clampPos(p.pos, bed), auto: false, overflow: false });
  for (const p of plants) {
    if (p.pos) continue;
    const size = defaultFootprint(p, bed);
    const taken = out.map((o) => o.pos);
    const spot = findSpot(size, bed, taken);
    if (spot) {
      out.push({ plant: p, pos: spot, auto: true, overflow: false });
      continue;
    }
    // Pas la place : on la dessine, rétrécie, dans le plus grand trou restant (signalée comme débordant).
    let squeezed: PlantPos | null = null;
    for (let w = r2(size.w - SNAP); w >= SNAP - 1e-6 && !squeezed; w = r2(w - SNAP)) squeezed = findSpot({ w, h: size.h }, bed, taken);
    out.push({ plant: p, pos: squeezed ?? { x: 0, y: 0, ...size }, auto: true, overflow: true });
  }
  return out;
}

/** Surface libre de la planche (m²). */
export function freeArea(bed: Pick<Bed, 'w' | 'h'>, laid: LaidOut[]): number {
  // Grille de 5 cm : robuste aux chevauchements.
  const nx = Math.max(1, Math.round(bed.w / SNAP));
  const ny = Math.max(1, Math.round(bed.h / SNAP));
  let used = 0;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const cx = (i + 0.5) * SNAP;
      const cy = (j + 0.5) * SNAP;
      if (laid.some((l) => cx >= l.pos.x && cx <= l.pos.x + l.pos.w && cy >= l.pos.y && cy <= l.pos.y + l.pos.h)) used++;
    }
  return Math.max(0, bed.w * bed.h - used * SNAP * SNAP);
}

/** Cultures qui se chevauchent sur la planche. */
export function overlaps(laid: LaidOut[]): Array<[Plant, Plant]> {
  const out: Array<[Plant, Plant]> = [];
  for (let i = 0; i < laid.length; i++) for (let j = i + 1; j < laid.length; j++) if (overlap(laid[i].pos, laid[j].pos) > 0.01) out.push([laid[i].plant, laid[j].plant]);
  return out;
}

/** Rectangle d'une culture dans le repère du plan du jardin. */
export function toPlan(bed: Pick<Bed, 'x' | 'y'>, pos: PlantPos): PlantPos {
  return { x: bed.x + pos.x, y: bed.y + pos.y, w: pos.w, h: pos.h };
}

export interface Neighbour {
  a: Plant;
  b: Plant;
  effect: Companion['effect'];
  evidence: Companion['evidence'];
  why: Companion['why'];
  /** Distance entre les deux cultures (m). */
  gap: number;
  sameBed: boolean;
}

const COMPANION_BY_PAIR = new Map<string, Companion>(COMPANIONS.flatMap((c) => [[`${c.a}|${c.b}`, c] as [string, Companion], [`${c.b}|${c.a}`, c] as [string, Companion]]));

export function companionOf(a: string, b: string): Companion | undefined {
  return COMPANION_BY_PAIR.get(`${a}|${b}`);
}

/**
 * Bons et mauvais voisins dans tout le jardin : deux cultures en place (ou
 * prévues) à moins de 50 cm l'une de l'autre, sur la même planche ou sur
 * deux planches proches, dont l'association est connue.
 */
export function neighbours(data: GardenData, onlyBedId?: string): Neighbour[] {
  const rects: Array<{ plant: Plant; bedId: string; r: PlantPos }> = [];
  for (const bed of data.beds) for (const l of layoutBed(data, bed)) rects.push({ plant: l.plant, bedId: bed.id, r: toPlan(bed, l.pos) });
  const out: Neighbour[] = [];
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const A = rects[i];
      const B = rects[j];
      if (onlyBedId && A.bedId !== onlyBedId && B.bedId !== onlyBedId) continue;
      if (A.plant.speciesId === B.plant.speciesId) continue;
      const c = companionOf(A.plant.speciesId, B.plant.speciesId);
      if (!c) continue;
      const gap = rectGap(A.r, B.r);
      if (gap > NEIGHBOUR_GAP) continue;
      out.push({ a: A.plant, b: B.plant, effect: c.effect, evidence: c.evidence, why: c.why, gap, sameBed: A.bedId === B.bedId });
    }
  return out.sort((x, y) => (x.effect === y.effect ? x.gap - y.gap : x.effect === 'bad' ? -1 : 1));
}
