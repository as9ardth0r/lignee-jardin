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
import { FLOWER_EXTRA } from './flowers';
import { HERB_EXTRA } from './herbs';

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
  ...HERB_EXTRA,
  ...FLOWER_EXTRA,
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
  // --- Fleurs et potager ---------------------------------------------------------
  { a: 'nasturtium', b: 'broadbean', effect: 'good', evidence: 'some', why: { fr: 'Plante-piège : les pucerons noirs s’installent d’abord sur la capucine, à arracher quand elle est envahie.', en: 'A trap plant: black aphids settle on the nasturtium first; pull it out once infested.' } },
  { a: 'nasturtium', b: 'bean', effect: 'good', evidence: 'some', why: { fr: 'Détourne une partie des pucerons noirs des haricots.', en: 'Draws part of the black aphids away from beans.' } },
  { a: 'nasturtium', b: 'cabbage', effect: 'good', evidence: 'tradition', why: { fr: 'Attirerait la piéride loin des choux ; effet variable.', en: 'Said to draw cabbage whites away from cabbages; results vary.' } },
  { a: 'frenchmarigold', b: 'tomato', effect: 'good', evidence: 'some', why: { fr: 'Ses racines réduisent certains nématodes du sol en plantation dense ; effet sur les aleurodes incertain.', en: 'Its roots reduce some soil nematodes when planted densely; effect on whitefly uncertain.' } },
  { a: 'calendula', b: 'tomato', effect: 'good', evidence: 'some', why: { fr: 'Attire syrphes et coccinelles, prédateurs des pucerons.', en: 'Draws hoverflies and ladybirds, aphid predators.' } },
  { a: 'borage', b: 'strawberry', effect: 'good', evidence: 'tradition', why: { fr: 'Attire les bourdons : fraises mieux pollinisées, moins déformées.', en: 'Draws bumblebees: better-pollinated, less misshapen strawberries.' } },
  { a: 'borage', b: 'squash', effect: 'good', evidence: 'tradition', why: { fr: 'Plus de pollinisateurs autour des fleurs de courge.', en: 'More pollinators around squash flowers.' } },
  { a: 'dill', b: 'cabbage', effect: 'good', evidence: 'some', why: { fr: 'Ses ombelles nourrissent les petites guêpes parasites des chenilles et pucerons du chou.', en: 'Its umbels feed the small wasps parasitising cabbage caterpillars and aphids.' } },
  { a: 'dill', b: 'fennel', effect: 'bad', evidence: 'some', why: { fr: 'Ils se croisent : graines bâtardes si l’on veut garder les siennes.', en: 'They cross: mongrel seed if you save your own.' } },
  { a: 'savory', b: 'bean', effect: 'good', evidence: 'tradition', why: { fr: 'Tradition : éloignerait le puceron noir ; se cuisine avec.', en: 'Tradition: said to deter black aphid; cooked together.' } },
  { a: 'sage', b: 'cabbage', effect: 'good', evidence: 'tradition', why: { fr: 'Tradition : son odeur gênerait la piéride ; effet non démontré.', en: 'Tradition: its scent may confuse cabbage whites; not proven.' } },
  { a: 'limnanthes', b: 'broadbean', effect: 'good', evidence: 'some', why: { fr: 'Attire les syrphes dont les larves mangent les pucerons noirs de la fève.', en: 'Draws hoverflies whose larvae eat black bean aphids.' } },
  { a: 'limnanthes', b: 'lettuce', effect: 'good', evidence: 'some', why: { fr: 'Bordure basse qui nourrit les syrphes, alliés contre les pucerons.', en: 'Low edging that feeds hoverflies, allies against aphids.' } },
  { a: 'ammi', b: 'cabbage', effect: 'good', evidence: 'some', why: { fr: 'Ombelles qui nourrissent les petites guêpes parasites des chenilles et des pucerons.', en: 'Umbels that feed the small wasps parasitising caterpillars and aphids.' } },
  { a: 'buckwheat', b: 'squash', effect: 'good', evidence: 'some', why: { fr: 'Floraison rapide et très mellifère : plus de pollinisateurs pour les courges.', en: 'Fast flowering loved by bees: more pollinators for squash.' } },
  { a: 'signetmarigold', b: 'tomato', effect: 'good', evidence: 'some', why: { fr: 'Comme l’œillet d’Inde : attire les auxiliaires, et ses racines freinent certains nématodes.', en: 'Like French marigold: draws beneficials, and its roots slow some nematodes.' } },
  { a: 'crimsonclover', b: 'sweetcorn', effect: 'good', evidence: 'some', why: { fr: 'Engrais vert d’hiver qui laisse de l’azote au maïs semé ensuite.', en: 'Winter green manure that leaves nitrogen for the maize sown after it.' } },
  { a: 'phacelia', b: 'zucchini', effect: 'good', evidence: 'some', why: { fr: 'Très mellifère : plus d’abeilles pour polliniser les courgettes.', en: 'A top bee plant: more bees to pollinate courgettes.' } },
  { a: 'alyssum', b: 'lettuce', effect: 'good', evidence: 'some', why: { fr: 'Ses fleurs nourrissent les syrphes ; en bordure de laitues, moins de pucerons dans les essais.', en: 'Its flowers feed hoverflies; edging lettuce, fewer aphids in trials.' } },
  { a: 'alyssum', b: 'cabbage', effect: 'good', evidence: 'some', why: { fr: 'Syrphes et guêpes parasitoïdes contre le puceron cendré du chou.', en: 'Hoverflies and parasitoid wasps against cabbage aphid.' } },
  { a: 'yarrow', b: 'cabbage', effect: 'good', evidence: 'tradition', why: { fr: 'Ombelles qui attirent les auxiliaires près des choux.', en: 'Flat flower heads that draw beneficials near cabbages.' } },
  { a: 'petunia', b: 'tomato', effect: 'bad', evidence: 'some', why: { fr: 'Même famille : mêmes virus et même mildiou, à ne pas planter côte à côte.', en: 'Same family: same viruses and blight, do not plant side by side.' } },
  { a: 'wallflower', b: 'cabbage', effect: 'bad', evidence: 'some', why: { fr: 'Famille des choux : héberge la hernie et les altises.', en: 'Cabbage family: hosts clubroot and flea beetles.' } },
  { a: 'ornamentalallium', b: 'pea', effect: 'bad', evidence: 'tradition', why: { fr: 'Même réputation que l’ail près des pois.', en: 'Same reputation as garlic near peas.' } },
];

export function companionsOf(speciesId: string): Array<Companion & { other: string }> {
  return COMPANIONS.filter((c) => c.a === speciesId || c.b === speciesId).map((c) => ({ ...c, other: c.a === speciesId ? c.b : c.a }));
}
