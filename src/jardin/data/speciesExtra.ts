/**
 * Données complémentaires des espèces (phase 2) : conservation des graines,
 * mode de fécondation et distance d'isolement pour garder ses graines, prix
 * de référence pour le bilan de saison.
 *
 * ORDRES DE GRANDEUR : durées de germination usuelles des tableaux de
 * conservation des semences potagères, distances d'isolement courantes des
 * guides de production de semences au jardin, prix de détail moyens arrondis
 * (France, légumes de saison) — modifiables dans l'app.
 */
import type { SpeciesExtra } from '../model';

const e = (seedLife: number, pollination: SpeciesExtra['pollination'], isolation: number, priceKg: number): SpeciesExtra => ({ seedLife, pollination, isolation, priceKg });

export const SPECIES_EXTRA: Record<string, SpeciesExtra> = {
  tomato: e(4, 'self', 5, 3.5),
  eggplant: e(5, 'self', 20, 4),
  pepper: e(4, 'insect', 150, 4),
  potato: e(1, 'vegetative', 0, 1.5),
  zucchini: e(6, 'insect', 500, 2.5),
  cucumber: e(6, 'insect', 500, 2),
  melon: e(5, 'insect', 500, 3),
  squash: e(6, 'insect', 500, 2),
  watermelon: e(5, 'insect', 500, 2),
  sweetcorn: e(2, 'wind', 300, 2.5),
  bean: e(3, 'self', 5, 6),
  pea: e(3, 'self', 5, 6),
  broadbean: e(4, 'insect', 300, 4),
  lettuce: e(4, 'self', 5, 3),
  endive: e(5, 'self', 20, 3),
  spinach: e(3, 'wind', 1000, 6),
  chard: e(5, 'wind', 1000, 3),
  cornsalad: e(4, 'self', 5, 15),
  rocket: e(4, 'insect', 300, 15),
  cabbage: e(5, 'insect', 500, 2),
  cauliflower: e(5, 'insect', 500, 3),
  broccoli: e(5, 'insect', 500, 5),
  brussels: e(5, 'insect', 500, 4),
  kale: e(5, 'insect', 500, 6),
  kohlrabi: e(5, 'insect', 500, 3),
  radish: e(5, 'insect', 300, 4),
  turnip: e(5, 'insect', 500, 2),
  carrot: e(3, 'insect', 500, 1.8),
  parsnip: e(1, 'insect', 500, 3),
  celeriac: e(5, 'insect', 300, 2.5),
  fennel: e(4, 'insect', 500, 3),
  parsley: e(2, 'insect', 300, 15),
  onion: e(2, 'insect', 500, 2),
  shallot: e(1, 'vegetative', 0, 6),
  garlic: e(1, 'vegetative', 0, 8),
  leek: e(2, 'insect', 500, 3),
  basil: e(5, 'insect', 150, 20),
  strawberry: e(1, 'vegetative', 0, 8),
  rhubarb: e(1, 'vegetative', 0, 4),
  sweetpotato: e(1, 'vegetative', 0, 3),
  beet: e(5, 'wind', 1000, 2),
  chives: e(2, 'insect', 100, 20),
};

/** Associations de voisinage. « tradition » : savoir jardinier sans preuve solide ; « some » : quelques résultats publiés. */
export interface Companion {
  a: string;
  b: string;
  effect: 'good' | 'bad';
  evidence: 'tradition' | 'some';
  why: { fr: string; en: string };
}

export const COMPANIONS: Companion[] = [
  { a: 'carrot', b: 'leek', effect: 'good', evidence: 'some', why: { fr: 'Odeurs croisées qui gênent mouche de la carotte et teigne du poireau (effet modeste dans les essais).', en: 'Mixed scents that confuse carrot fly and leek moth (modest effect in trials).' } },
  { a: 'carrot', b: 'onion', effect: 'good', evidence: 'some', why: { fr: 'Même idée qu’avec le poireau contre la mouche de la carotte ; efficacité variable.', en: 'Same idea as with leek against carrot fly; results vary.' } },
  { a: 'sweetcorn', b: 'bean', effect: 'good', evidence: 'some', why: { fr: 'Les « trois sœurs » : le maïs sert de tuteur au haricot grimpant.', en: 'The “three sisters”: maize supports the climbing bean.' } },
  { a: 'sweetcorn', b: 'squash', effect: 'good', evidence: 'some', why: { fr: 'Les « trois sœurs » : la courge couvre le sol au pied du maïs.', en: 'The “three sisters”: squash covers the ground under the maize.' } },
  { a: 'tomato', b: 'basil', effect: 'good', evidence: 'tradition', why: { fr: 'Association traditionnelle ; pas d’effet démontré sur les ravageurs, mais aucun inconvénient.', en: 'A traditional pairing; no proven pest effect, but no downside.' } },
  { a: 'lettuce', b: 'radish', effect: 'good', evidence: 'tradition', why: { fr: 'Cultures rapides qui partagent la planche sans se gêner.', en: 'Fast crops that share a bed without competing.' } },
  { a: 'cabbage', b: 'celeriac', effect: 'good', evidence: 'tradition', why: { fr: 'Le céleri passerait pour éloigner la piéride ; observation de jardiniers.', en: 'Celery is said to deter cabbage white; a gardeners’ observation.' } },
  { a: 'strawberry', b: 'garlic', effect: 'good', evidence: 'tradition', why: { fr: 'Association traditionnelle contre les maladies du fraisier ; non démontrée.', en: 'Traditional pairing against strawberry diseases; unproven.' } },
  { a: 'bean', b: 'onion', effect: 'bad', evidence: 'tradition', why: { fr: 'Les alliums gêneraient la croissance des légumineuses ; constat de jardiniers.', en: 'Alliums are said to hinder legumes; a gardeners’ observation.' } },
  { a: 'pea', b: 'garlic', effect: 'bad', evidence: 'tradition', why: { fr: 'Même réputation qu’oignon et haricot.', en: 'Same reputation as onion and bean.' } },
  { a: 'tomato', b: 'potato', effect: 'bad', evidence: 'some', why: { fr: 'Mêmes maladies (mildiou) et ravageurs (doryphore) : éviter de les rapprocher.', en: 'Same diseases (late blight) and pests (Colorado beetle): keep apart.' } },
  { a: 'cucumber', b: 'potato', effect: 'bad', evidence: 'tradition', why: { fr: 'Concurrence pour l’eau et maladies favorisées ; observation de jardiniers.', en: 'Competition for water and disease; a gardeners’ observation.' } },
  { a: 'fennel', b: 'tomato', effect: 'bad', evidence: 'tradition', why: { fr: 'Le fenouil passe pour un mauvais voisin de la plupart des légumes.', en: 'Fennel is reputed to be a poor neighbour to most vegetables.' } },
  { a: 'beet', b: 'chard', effect: 'bad', evidence: 'some', why: { fr: 'Même espèce : se croisent par le vent si vous gardez des graines, mêmes maladies.', en: 'Same species: they cross by wind if you save seed, and share diseases.' } },
];

export function companionsOf(speciesId: string): Array<Companion & { other: string }> {
  return COMPANIONS.filter((c) => c.a === speciesId || c.b === speciesId).map((c) => ({ ...c, other: c.a === speciesId ? c.b : c.a }));
}
