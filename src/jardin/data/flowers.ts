/**
 * Les fleurs du jardin : annuelles, bisannuelles, vivaces et bulbes.
 *
 * Mêmes conventions que les légumes (calendrier « région parisienne »,
 * décalé selon le climat ; durées en jours après le semis ou la
 * plantation). Pour une fleur, la « récolte » est la FLORAISON :
 * daysToHarvest = [début, fin] de floraison.
 * Les besoins nutritifs sont rapportés à la biomasse produite (kg/m²) :
 * ordres de grandeur pour un massif ou une bordure, pas une production
 * de fleurs coupées.
 * Sources : catalogues des semenciers (Vilmorin, Graines Baumaux,
 * Ducrettet), Société nationale d’horticulture de France, RHS (fiches
 * plantes, toxicité), ANSES (plantes toxiques), Centre antipoison.
 */
import type { Family, Feeding, Frost, MonthRange, Species, SpeciesExtra, Sun, Txt } from '../model';
import { MORE_FLOWER_DEFS, MORE_FLOWER_EXTRA } from './flowersMore';
import { EXTRA_FLOWER_DEFS, EXTRA_FLOWER_EXTRA } from './flowersExtra';

export type FlowerColor = 'white' | 'yellow' | 'orange' | 'red' | 'pink' | 'purple' | 'blue';
export const FLOWER_COLORS: FlowerColor[] = ['white', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue'];
export const COLOR_HEX: Record<FlowerColor, string> = {
  white: '#f4f1e8',
  yellow: '#f2cf3a',
  orange: '#ef8a2c',
  red: '#cf3a2c',
  pink: '#e98ab4',
  purple: '#8a4fb0',
  blue: '#4f7fd6',
};

/**
 * Usages : pollinisateurs (abeilles, bourdons, papillons), auxiliaires
 * (syrphes, chrysopes, coccinelles), compagne du potager, comestible,
 * fleur à couper, fleur séchée, parfumée, se ressème seule, engrais vert.
 */
export type FlowerUse = 'pollinators' | 'beneficials' | 'companion' | 'edible' | 'cut' | 'dried' | 'fragrant' | 'selfSeeds' | 'greenManure' | 'pots';
export const FLOWER_USES: FlowerUse[] = ['pollinators', 'beneficials', 'companion', 'edible', 'cut', 'dried', 'fragrant', 'selfSeeds', 'greenManure', 'pots'];

export interface FlowerInfo {
  /** Mois de floraison (région parisienne), décalés selon le climat comme le reste du calendrier. */
  bloom: MonthRange[];
  /** Hauteur adulte (cm). */
  height: [number, number];
  colors: FlowerColor[];
  uses: FlowerUse[];
  /** Couper les fleurs fanées prolonge la floraison (rappel hebdomadaire). */
  deadhead?: boolean;
  /** Bulbe ou tubercule gélif : à rentrer avant les gelées (rappel). */
  lift?: boolean;
  /** Plante toxique : précaution à afficher. */
  toxic?: Txt;
  /** Bulbe, corme, griffe ou tubercule (filtre « bulbes »). */
  bulb?: boolean;
}

export type FlowerDef = Def;

interface Def {
  id: string;
  name: Txt;
  latin: string;
  emoji: string;
  family: Family;
  life: Species['life'];
  sun: Sun;
  frost: Frost;
  tBase: number;
  pH: [number, number];
  spacing: [number, number];
  sowIndoor?: MonthRange[];
  sowOutdoor?: MonthRange[];
  plantOut?: MonthRange[];
  transplantAfter?: number;
  /** Floraison : [début, fin] en jours après le semis ou la plantation. */
  bloomDays: [number, number];
  season: number;
  feeding: Feeding;
  root: number;
  returnYears?: number;
  note: Txt;
  info: FlowerInfo;
}

/** Biomasse de référence (kg/m²) selon l'appétit : sert au calcul des besoins. */
const BIOMASS: Record<Feeding, [number, number]> = { heavy: [2.5, 3.5], medium: [1.5, 2.5], light: [0.6, 1], improver: [1.5, 2.5] };

function flower(d: Def): { species: Species; info: FlowerInfo } {
  const seeded = Boolean(d.sowIndoor || d.sowOutdoor);
  return {
    species: {
      id: d.id,
      name: d.name,
      latin: d.latin,
      emoji: d.emoji,
      family: d.family,
      type: 'flower',
      life: d.life,
      sun: d.sun,
      frost: d.frost,
      tBase: d.tBase,
      tOpt: [15, 25],
      pH: d.pH,
      spacing: { row: d.spacing[0], inRow: d.spacing[1] },
      sowIndoor: d.sowIndoor,
      sowOutdoor: d.sowOutdoor,
      plantOut: d.plantOut,
      transplantAfter: d.transplantAfter,
      daysToHarvest: d.bloomDays,
      season: d.season,
      stages: seeded ? [['germination', 0], ['vegetative', 10], ['flowering', d.bloomDays[0]]] : [['vegetative', 0], ['flowering', d.bloomDays[0]]],
      kc: [0.4, 0.85, 0.7],
      rootDepth: d.root,
      yieldM2: BIOMASS[d.feeding],
      exports: { N: 2.5, P2O5: 1, K2O: 3.5 },
      feeding: d.feeding,
      returnYears: d.returnYears ?? 1,
      note: d.note,
    },
    info: d.info,
  };
}

const T = (fr: string, en: string): Txt => ({ fr, en });

const DEFS: Def[] = [
  // --- Annuelles -------------------------------------------------------------
  {
    id: 'cosmos', name: T('Cosmos', 'Cosmos'), latin: 'Cosmos bipinnatus', emoji: '🌸', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 8, pH: [6, 7.5], spacing: [40, 30], sowIndoor: [[3, 4]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 40,
    bloomDays: [90, 200], season: 210, feeding: 'light', root: 0.4,
    note: T('Sol pauvre et plein soleil : trop d’engrais donne des feuilles et peu de fleurs. Tuteurer les grandes variétés.', 'Poor soil and full sun: too much feeding gives leaves and few flowers. Stake tall varieties.'),
    info: { bloom: [[7, 10]], height: [60, 150], colors: ['white', 'pink', 'purple', 'orange'], uses: ['pollinators', 'beneficials', 'cut', 'selfSeeds'], deadhead: true },
  },
  {
    id: 'zinnia', name: T('Zinnia', 'Zinnia'), latin: 'Zinnia elegans', emoji: '🌺', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, pH: [6, 7.5], spacing: [40, 30], sowIndoor: [[4, 4]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 30,
    bloomDays: [75, 170], season: 180, feeding: 'medium', root: 0.4,
    note: T('Craint le froid et l’humidité sur le feuillage (oïdium) : semer chaud, arroser au pied.', 'Dislikes cold and wet foliage (powdery mildew): sow warm, water at the base.'),
    info: { bloom: [[7, 10]], height: [30, 100], colors: ['red', 'orange', 'yellow', 'pink', 'white', 'purple'], uses: ['pollinators', 'cut'], deadhead: true },
  },
  {
    id: 'calendula', name: T('Souci', 'Pot marigold'), latin: 'Calendula officinalis', emoji: '🌼', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'hardy',
    tBase: 4, pH: [6, 7.5], spacing: [30, 25], sowOutdoor: [[3, 5], [9, 9]],
    bloomDays: [55, 170], season: 190, feeding: 'light', root: 0.3,
    note: T('Facile partout, se ressème seul. Pétales comestibles (salades, riz). Attire syrphes et coccinelles au potager.', 'Easy anywhere, self-seeds. Edible petals (salads, rice). Draws hoverflies and ladybirds to the vegetable garden.'),
    info: { bloom: [[5, 10]], height: [30, 60], colors: ['orange', 'yellow'], uses: ['edible', 'beneficials', 'companion', 'pollinators', 'selfSeeds'], deadhead: true },
  },
  {
    id: 'nasturtium', name: T('Capucine', 'Nasturtium'), latin: 'Tropaeolum majus', emoji: '🌼', family: 'tropaeolaceae', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, pH: [6, 7.5], spacing: [50, 40], sowIndoor: [[4, 4]], sowOutdoor: [[5, 6]], plantOut: [[5, 5]], transplantAfter: 25,
    bloomDays: [55, 150], season: 170, feeding: 'light', root: 0.3,
    note: T('Sol pauvre : sinon beaucoup de feuilles. Plante-piège : elle attire les pucerons noirs loin des fèves et des haricots. Feuilles, fleurs et boutons se mangent.', 'Poor soil, or mostly leaves. A trap plant: draws black aphids away from broad beans and beans. Leaves, flowers and buds are edible.'),
    info: { bloom: [[6, 10]], height: [30, 200], colors: ['orange', 'yellow', 'red'], uses: ['edible', 'companion', 'pollinators'] },
  },
  {
    id: 'sunflower', name: T('Tournesol', 'Sunflower'), latin: 'Helianthus annuus', emoji: '🌻', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'half',
    tBase: 7, pH: [6, 7.5], spacing: [60, 40], sowOutdoor: [[4, 6]],
    bloomDays: [75, 120], season: 150, feeding: 'medium', root: 0.8,
    note: T('Semer en place (supporte mal le repiquage), tuteurer les géants. Graines pour les oiseaux en hiver ; variétés sans pollen pour les bouquets.', 'Sow in place (dislikes transplanting), stake giants. Seeds for birds in winter; pollen-free varieties for bouquets.'),
    info: { bloom: [[7, 9]], height: [60, 300], colors: ['yellow', 'orange', 'red'], uses: ['pollinators', 'cut', 'edible'] },
  },
  {
    id: 'cornflower', name: T('Bleuet', 'Cornflower'), latin: 'Centaurea cyanus', emoji: '💠', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'hardy',
    tBase: 4, pH: [6, 7.5], spacing: [30, 20], sowOutdoor: [[3, 5], [9, 10]],
    bloomDays: [65, 120], season: 140, feeding: 'light', root: 0.3,
    note: T('Fleur des moissons, très mellifère. Semé à l’automne, il fleurit plus tôt et plus longtemps. Fleurs comestibles.', 'Cornfield flower, loved by bees. Autumn-sown, it flowers earlier and longer. Edible flowers.'),
    info: { bloom: [[5, 7]], height: [40, 80], colors: ['blue', 'pink', 'white', 'purple'], uses: ['pollinators', 'edible', 'cut', 'selfSeeds'], deadhead: true },
  },
  {
    id: 'nigella', name: T('Nigelle de Damas', 'Love-in-a-mist'), latin: 'Nigella damascena', emoji: '💠', family: 'ranunculaceae', life: 'annual', sun: 'full', frost: 'hardy',
    tBase: 4, pH: [6, 7.5], spacing: [25, 20], sowOutdoor: [[3, 5], [9, 9]],
    bloomDays: [75, 120], season: 150, feeding: 'light', root: 0.3,
    note: T('Semer en place, ne pas repiquer. Capsules décoratives en bouquets secs. Se ressème abondamment.', 'Sow in place, do not transplant. Decorative seed pods for dried bouquets. Self-seeds freely.'),
    info: { bloom: [[6, 8]], height: [30, 50], colors: ['blue', 'white', 'pink'], uses: ['pollinators', 'cut', 'dried', 'selfSeeds'] },
  },
  {
    id: 'sweetpea', name: T('Pois de senteur', 'Sweet pea'), latin: 'Lathyrus odoratus', emoji: '🌸', family: 'fabaceae', life: 'annual', sun: 'full', frost: 'half',
    tBase: 5, pH: [6.5, 7.5], spacing: [50, 15], sowIndoor: [[2, 3]], sowOutdoor: [[3, 4]], plantOut: [[4, 4]], transplantAfter: 40,
    bloomDays: [100, 170], season: 180, feeding: 'medium', root: 0.6,
    note: T('Grimpant : grillage ou rames. Plus on cueille, plus il fleurit. Craint la chaleur de l’été.', 'A climber: netting or pea sticks. The more you pick, the more it flowers. Dislikes summer heat.'),
    info: {
      bloom: [[6, 8]], height: [100, 200], colors: ['pink', 'purple', 'white', 'red', 'blue'], uses: ['cut', 'fragrant'], deadhead: true,
      toxic: T('Graines toxiques (lathyrisme) : ne pas les confondre avec des petits pois, à garder hors de portée des enfants.', 'Seeds are toxic (lathyrism): never confuse them with garden peas, keep away from children.'),
    },
  },
  {
    id: 'frenchmarigold', name: T('Œillet d’Inde', 'French marigold'), latin: 'Tagetes patula', emoji: '🌼', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, pH: [6, 7.5], spacing: [30, 25], sowIndoor: [[3, 4]], plantOut: [[5, 6]], transplantAfter: 40,
    bloomDays: [70, 170], season: 180, feeding: 'light', root: 0.3,
    note: T('Compagne classique des tomates. Ses racines réduisent certains nématodes du sol (effet démontré en culture dense) ; son effet sur les aleurodes est plus incertain.', 'A classic tomato companion. Its roots reduce some soil nematodes (shown in dense plantings); its effect on whitefly is less certain.'),
    info: { bloom: [[6, 10]], height: [20, 40], colors: ['orange', 'yellow', 'red'], uses: ['companion', 'pollinators'], deadhead: true },
  },
  {
    id: 'eschscholzia', name: T('Pavot de Californie', 'California poppy'), latin: 'Eschscholzia californica', emoji: '🌼', family: 'papaveraceae', life: 'annual', sun: 'full', frost: 'hardy',
    tBase: 5, pH: [6, 8], spacing: [25, 20], sowOutdoor: [[3, 5], [9, 9]],
    bloomDays: [60, 140], season: 160, feeding: 'light', root: 0.3,
    note: T('Sols secs et pauvres, aucun arrosage une fois installé. Semer en place.', 'Dry, poor soils, no watering once established. Sow in place.'),
    info: { bloom: [[6, 9]], height: [30, 40], colors: ['orange', 'yellow', 'white', 'pink'], uses: ['pollinators', 'selfSeeds'] },
  },
  {
    id: 'phacelia', name: T('Phacélie', 'Phacelia'), latin: 'Phacelia tanacetifolia', emoji: '💜', family: 'boraginaceae', life: 'annual', sun: 'full', frost: 'half',
    tBase: 3, pH: [6, 8], spacing: [20, 5], sowOutdoor: [[3, 9]],
    bloomDays: [45, 90], season: 100, feeding: 'improver', root: 0.5,
    note: T('L’une des plantes les plus mellifères. Aussi engrais vert : faucher à la floraison et laisser en paillis. Ne se croise avec aucun légume.', 'One of the best bee plants. Also a green manure: cut at flowering and leave as mulch. Unrelated to any vegetable.'),
    info: { bloom: [[5, 10]], height: [50, 80], colors: ['blue', 'purple'], uses: ['pollinators', 'beneficials', 'greenManure', 'selfSeeds'] },
  },
  {
    id: 'borage', name: T('Bourrache', 'Borage'), latin: 'Borago officinalis', emoji: '💙', family: 'boraginaceae', life: 'annual', sun: 'full', frost: 'hardy',
    tBase: 5, pH: [6, 7.5], spacing: [50, 40], sowOutdoor: [[4, 6]],
    bloomDays: [50, 120], season: 140, feeding: 'light', root: 0.4,
    note: T('Fleurs bleues comestibles au goût d’huître. Très visitée par les bourdons : utile près des fraisiers, tomates et courges.', 'Edible blue flowers with an oyster-like taste. Heavily visited by bumblebees: useful near strawberries, tomatoes and squash.'),
    info: { bloom: [[6, 9]], height: [40, 80], colors: ['blue'], uses: ['pollinators', 'edible', 'companion', 'selfSeeds'] },
  },
  {
    id: 'alyssum', name: T('Alysse odorante', 'Sweet alyssum'), latin: 'Lobularia maritima', emoji: '🤍', family: 'brassicaceae', life: 'annual', sun: 'full', frost: 'half',
    tBase: 5, pH: [6, 7.5], spacing: [20, 15], sowIndoor: [[3, 4]], sowOutdoor: [[4, 6]], plantOut: [[5, 5]], transplantAfter: 30,
    bloomDays: [45, 150], season: 170, feeding: 'light', root: 0.2,
    note: T('Tapis parfumé en bordure. Nourrit les syrphes dont les larves mangent les pucerons. Famille des choux : compte dans la rotation.', 'Fragrant edging carpet. Feeds hoverflies whose larvae eat aphids. Cabbage family: counts in the rotation.'),
    info: { bloom: [[6, 10]], height: [10, 20], colors: ['white', 'purple', 'pink'], uses: ['beneficials', 'fragrant', 'pollinators', 'selfSeeds'] },
  },
  {
    id: 'snapdragon', name: T('Muflier', 'Snapdragon'), latin: 'Antirrhinum majus', emoji: '🌺', family: 'plantaginaceae', life: 'annual', sun: 'full', frost: 'half',
    tBase: 5, pH: [6, 7.5], spacing: [30, 25], sowIndoor: [[2, 3]], plantOut: [[4, 5]], transplantAfter: 60,
    bloomDays: [110, 230], season: 240, feeding: 'medium', root: 0.4,
    note: T('Graines minuscules : semer en surface sans couvrir. Pincer jeune pour ramifier. Les bourdons ouvrent la « gueule » de la fleur.', 'Tiny seeds: sow on the surface, uncovered. Pinch young plants to branch. Bumblebees open the flower’s “mouth”.'),
    info: { bloom: [[6, 10]], height: [30, 90], colors: ['red', 'pink', 'yellow', 'white', 'orange', 'purple'], uses: ['pollinators', 'cut'], deadhead: true },
  },
  {
    id: 'chinaaster', name: T('Reine-marguerite', 'China aster'), latin: 'Callistephus chinensis', emoji: '🌸', family: 'asteraceae', life: 'annual', sun: 'full', frost: 'half',
    tBase: 8, pH: [6.5, 7.5], spacing: [30, 25], sowIndoor: [[3, 4]], plantOut: [[5, 5]], transplantAfter: 40,
    bloomDays: [120, 190], season: 200, feeding: 'medium', root: 0.4, returnYears: 3,
    note: T('Fleur à couper de fin d’été. Ne pas la replanter au même endroit avant 3 ans (flétrissement).', 'A late-summer cut flower. Do not replant in the same spot for 3 years (wilt disease).'),
    info: { bloom: [[8, 10]], height: [30, 80], colors: ['purple', 'pink', 'white', 'blue', 'red'], uses: ['cut'] },
  },
  {
    id: 'petunia', name: T('Pétunia', 'Petunia'), latin: 'Petunia × atkinsiana', emoji: '🌺', family: 'solanaceae', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, pH: [5.5, 6.5], spacing: [30, 25], sowIndoor: [[2, 3]], plantOut: [[5, 5]], transplantAfter: 60,
    bloomDays: [110, 230], season: 240, feeding: 'heavy', root: 0.25,
    note: T('Jardinières et suspensions, engrais liquide tous les quinze jours. Famille des tomates : mêmes maladies (mildiou, virus).', 'Window boxes and baskets, liquid feed every fortnight. Tomato family: same diseases (blight, viruses).'),
    info: { bloom: [[6, 10]], height: [20, 40], colors: ['purple', 'pink', 'white', 'red', 'blue'], uses: ['fragrant'], deadhead: true },
  },

  // --- Bisannuelles ------------------------------------------------------------
  {
    id: 'foxglove', name: T('Digitale', 'Foxglove'), latin: 'Digitalis purpurea', emoji: '🔔', family: 'plantaginaceae', life: 'biennial', sun: 'partial', frost: 'hardy',
    tBase: 4, pH: [5, 6.5], spacing: [50, 40], sowOutdoor: [[5, 7]], plantOut: [[9, 10]],
    bloomDays: [340, 400], season: 420, feeding: 'light', root: 0.4,
    note: T('Bisannuelle : feuilles la première année, hampe florale l’été suivant. Mi-ombre et sol frais, se ressème en sous-bois.', 'Biennial: leaves the first year, flower spike the next summer. Part shade and moist soil, self-seeds in woodland.'),
    info: {
      bloom: [[6, 7]], height: [80, 150], colors: ['pink', 'purple', 'white'], uses: ['pollinators', 'selfSeeds'],
      toxic: T('TRÈS TOXIQUE (toutes les parties, cardiotoxique). Gants pour la manipuler, loin des enfants, des animaux et du potager.', 'HIGHLY TOXIC (all parts, affects the heart). Wear gloves, keep away from children, pets and the vegetable beds.'),
    },
  },
  {
    id: 'hollyhock', name: T('Rose trémière', 'Hollyhock'), latin: 'Alcea rosea', emoji: '🌸', family: 'malvaceae', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 5, pH: [6, 8], spacing: [60, 50], sowOutdoor: [[5, 7]], plantOut: [[9, 10]],
    bloomDays: [360, 420], season: 450, feeding: 'medium', root: 0.8,
    note: T('Hautes hampes contre un mur ensoleillé. Supprimer les feuilles touchées par la rouille (taches orange).', 'Tall spikes against a sunny wall. Remove leaves with rust (orange spots).'),
    info: { bloom: [[7, 9]], height: [150, 250], colors: ['pink', 'red', 'white', 'yellow', 'purple'], uses: ['pollinators', 'selfSeeds'] },
  },
  {
    id: 'pansy', name: T('Pensée', 'Pansy'), latin: 'Viola × wittrockiana', emoji: '🌸', family: 'violaceae', life: 'biennial', sun: 'partial', frost: 'hardy',
    tBase: 3, pH: [6, 7], spacing: [20, 20], sowIndoor: [[6, 8]], plantOut: [[9, 10]], transplantAfter: 60,
    bloomDays: [100, 300], season: 320, feeding: 'medium', root: 0.2,
    note: T('Fleurit de l’automne au printemps selon les variétés. Fleurs comestibles en décoration.', 'Flowers from autumn to spring depending on variety. Edible flowers for garnish.'),
    info: { bloom: [[10, 12], [3, 5]], height: [10, 20], colors: ['purple', 'yellow', 'blue', 'white', 'orange', 'red'], uses: ['edible'], deadhead: true },
  },
  {
    id: 'forgetmenot', name: T('Myosotis', 'Forget-me-not'), latin: 'Myosotis sylvatica', emoji: '💙', family: 'boraginaceae', life: 'biennial', sun: 'partial', frost: 'hardy',
    tBase: 3, pH: [6, 7.5], spacing: [20, 20], sowOutdoor: [[6, 7]], plantOut: [[9, 10]],
    bloomDays: [280, 330], season: 350, feeding: 'light', root: 0.2,
    note: T('Tapis bleu sous les tulipes au printemps. Se ressème partout : arracher après floraison si besoin.', 'A blue carpet under tulips in spring. Self-seeds everywhere: pull out after flowering if needed.'),
    info: { bloom: [[4, 5]], height: [15, 30], colors: ['blue', 'pink', 'white'], uses: ['pollinators', 'selfSeeds'] },
  },
  {
    id: 'wallflower', name: T('Giroflée', 'Wallflower'), latin: 'Erysimum cheiri', emoji: '🌼', family: 'brassicaceae', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 3, pH: [6.5, 8], spacing: [30, 25], sowOutdoor: [[5, 6]], plantOut: [[9, 10]],
    bloomDays: [280, 340], season: 360, feeding: 'light', root: 0.3, returnYears: 3,
    note: T('Parfum puissant au printemps, aime les sols calcaires. Famille des choux : éviter les planches touchées par la hernie.', 'Strong spring scent, likes chalky soil. Cabbage family: avoid beds with clubroot.'),
    info: { bloom: [[3, 5]], height: [30, 60], colors: ['yellow', 'orange', 'red', 'purple'], uses: ['fragrant', 'pollinators'] },
  },
  {
    id: 'sweetwilliam', name: T('Œillet de poète', 'Sweet William'), latin: 'Dianthus barbatus', emoji: '🌸', family: 'caryophyllaceae', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, pH: [6.5, 8], spacing: [30, 25], sowOutdoor: [[5, 6]], plantOut: [[9, 9]],
    bloomDays: [370, 420], season: 440, feeding: 'light', root: 0.3,
    note: T('Bouquets parfumés en juin. Sol drainé et calcaire.', 'Fragrant bunches in June. Well-drained, chalky soil.'),
    info: { bloom: [[6, 7]], height: [30, 60], colors: ['red', 'pink', 'white', 'purple'], uses: ['cut', 'fragrant', 'pollinators'] },
  },

  // --- Vivaces -------------------------------------------------------------------
  {
    id: 'lavender', name: T('Lavande', 'Lavender'), latin: 'Lavandula angustifolia', emoji: '💜', family: 'lamiaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 5, pH: [6.5, 8], spacing: [60, 50], plantOut: [[3, 5], [9, 10]],
    bloomDays: [75, 120], season: 210, feeding: 'light', root: 0.5,
    note: T('Sol sec, drainé, plutôt calcaire, jamais d’engrais. Tailler juste après la floraison sans couper dans le vieux bois.', 'Dry, free-draining, rather chalky soil, never fed. Trim right after flowering without cutting into old wood.'),
    info: { bloom: [[6, 8]], height: [40, 60], colors: ['purple', 'blue', 'white'], uses: ['pollinators', 'fragrant', 'dried'] },
  },
  {
    id: 'echinacea', name: T('Échinacée', 'Coneflower'), latin: 'Echinacea purpurea', emoji: '🌸', family: 'asteraceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 6, pH: [6, 7.5], spacing: [50, 45], sowIndoor: [[3, 4]], plantOut: [[4, 5], [9, 10]], transplantAfter: 60,
    bloomDays: [110, 170], season: 200, feeding: 'light', root: 0.6,
    note: T('Laisser les têtes sèches en hiver : les chardonnerets en mangent les graines.', 'Leave the dry heads in winter: goldfinches eat the seeds.'),
    info: { bloom: [[7, 9]], height: [60, 100], colors: ['pink', 'purple', 'white', 'orange'], uses: ['pollinators', 'cut'] },
  },
  {
    id: 'rudbeckia', name: T('Rudbeckia', 'Black-eyed Susan'), latin: 'Rudbeckia fulgida', emoji: '🌻', family: 'asteraceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 6, pH: [6, 7.5], spacing: [50, 40], sowIndoor: [[3, 4]], plantOut: [[4, 5], [9, 10]], transplantAfter: 50,
    bloomDays: [110, 190], season: 210, feeding: 'medium', root: 0.5,
    note: T('Floraison jaune d’or jusqu’aux gelées ; diviser les touffes tous les 3-4 ans.', 'Golden flowers until frost; divide clumps every 3–4 years.'),
    info: { bloom: [[7, 10]], height: [50, 90], colors: ['yellow', 'orange'], uses: ['pollinators', 'cut'], deadhead: true },
  },
  {
    id: 'yarrow', name: T('Achillée millefeuille', 'Yarrow'), latin: 'Achillea millefolium', emoji: '🌼', family: 'asteraceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 4, pH: [6, 8], spacing: [40, 35], sowIndoor: [[3, 4]], plantOut: [[4, 5], [9, 10]], transplantAfter: 50,
    bloomDays: [80, 150], season: 190, feeding: 'light', root: 0.5,
    note: T('Ombelles plates très visitées par les syrphes et les guêpes parasitoïdes, alliées contre les pucerons. Supporte la sécheresse.', 'Flat flower heads loved by hoverflies and parasitoid wasps, allies against aphids. Drought tolerant.'),
    info: { bloom: [[6, 9]], height: [40, 80], colors: ['white', 'yellow', 'pink', 'red'], uses: ['beneficials', 'pollinators', 'dried', 'cut'] },
  },
  {
    id: 'catmint', name: T('Népéta (herbe aux chats)', 'Catmint'), latin: 'Nepeta × faassenii', emoji: '💜', family: 'lamiaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 5, pH: [6, 8], spacing: [50, 45], plantOut: [[3, 5], [9, 10]],
    bloomDays: [50, 150], season: 200, feeding: 'light', root: 0.4,
    note: T('Bordure bleue très mellifère ; rabattre après la première floraison pour une seconde en fin d’été.', 'A blue edging adored by bees; cut back after the first flush for a second in late summer.'),
    info: { bloom: [[5, 9]], height: [30, 50], colors: ['blue', 'purple'], uses: ['pollinators', 'fragrant'] },
  },
  {
    id: 'rose', name: T('Rosier', 'Rose'), latin: 'Rosa', emoji: '🌹', family: 'rosaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 5, pH: [6, 7], spacing: [100, 80], plantOut: [[11, 3]],
    bloomDays: [150, 300], season: 330, feeding: 'heavy', root: 0.8, returnYears: 5,
    note: T('Racines nues de novembre à mars, point de greffe au ras du sol. Pas de rosier là où un rosier a poussé (fatigue du sol).', 'Bare-root from November to March, graft union at soil level. No rose where a rose has grown (replant disease).'),
    info: { bloom: [[5, 10]], height: [50, 200], colors: ['red', 'pink', 'white', 'yellow', 'orange'], uses: ['cut', 'fragrant', 'edible', 'pollinators'], deadhead: true },
  },
  {
    id: 'peony', name: T('Pivoine', 'Peony'), latin: 'Paeonia lactiflora', emoji: '🌸', family: 'paeoniaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 4, pH: [6, 7.5], spacing: [90, 80], plantOut: [[9, 10]],
    bloomDays: [220, 250], season: 380, feeding: 'medium', root: 0.6,
    note: T('Planter peu profond (bourgeons à 3-5 cm) en automne ; elle fleurit souvent à partir de la 2e ou 3e année et vit des décennies. Ne pas la déplacer.', 'Plant shallow (buds 3–5 cm deep) in autumn; often flowers from the 2nd or 3rd year and lives for decades. Do not move it.'),
    info: { bloom: [[5, 6]], height: [60, 90], colors: ['pink', 'white', 'red'], uses: ['cut', 'fragrant'] },
  },
  {
    id: 'iris', name: T('Iris des jardins', 'Bearded iris'), latin: 'Iris germanica', emoji: '💜', family: 'iridaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 4, pH: [6.5, 8], spacing: [40, 35], plantOut: [[7, 9]],
    bloomDays: [270, 300], season: 360, feeding: 'light', root: 0.3,
    note: T('Rhizome à moitié hors de terre, au soleil. Diviser après floraison tous les 3-4 ans.', 'Rhizome half out of the soil, in full sun. Divide after flowering every 3–4 years.'),
    info: {
      bloom: [[5, 6]], height: [60, 100], colors: ['purple', 'blue', 'yellow', 'white'], uses: ['cut', 'fragrant'],
      toxic: T('Rhizome irritant et toxique s’il est mangé.', 'Rhizome irritant and toxic if eaten.'),
    },
  },
  {
    id: 'aster', name: T('Aster d’automne', 'Michaelmas daisy'), latin: 'Symphyotrichum novi-belgii', emoji: '💜', family: 'asteraceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 5, pH: [6, 7.5], spacing: [60, 50], plantOut: [[3, 5], [9, 10]],
    bloomDays: [150, 200], season: 220, feeding: 'medium', root: 0.5,
    note: T('Dernier repas des abeilles et des papillons avant l’hiver. Aérer pour limiter l’oïdium.', 'The last meal for bees and butterflies before winter. Space out to limit mildew.'),
    info: { bloom: [[9, 10]], height: [60, 120], colors: ['purple', 'blue', 'pink', 'white'], uses: ['pollinators', 'cut'] },
  },

  // --- Bulbes ---------------------------------------------------------------------
  {
    id: 'tulip', name: T('Tulipe', 'Tulip'), latin: 'Tulipa', emoji: '🌷', family: 'liliaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 3, pH: [6, 7.5], spacing: [15, 10], plantOut: [[10, 11]],
    bloomDays: [150, 190], season: 230, feeding: 'light', root: 0.2, returnYears: 3,
    note: T('Planter à 2-3 fois la hauteur du bulbe. Après floraison, laisser jaunir le feuillage 6 semaines avant de couper : il nourrit le bulbe de l’an prochain.', 'Plant at 2–3 times the bulb’s height. After flowering, let the foliage yellow for 6 weeks before cutting: it feeds next year’s bulb.'),
    info: { bulb: true,
      bloom: [[3, 5]], height: [20, 60], colors: ['red', 'yellow', 'pink', 'white', 'purple', 'orange'], uses: ['cut'],
      toxic: T('Bulbe toxique et irritant pour la peau (« doigt des tulipiers »).', 'Bulb toxic and irritating to skin (“tulip fingers”).'),
    },
  },
  {
    id: 'daffodil', name: T('Narcisse, jonquille', 'Daffodil'), latin: 'Narcissus', emoji: '🌼', family: 'amaryllidaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 3, pH: [6, 7.5], spacing: [15, 12], plantOut: [[9, 10]],
    bloomDays: [150, 200], season: 240, feeding: 'light', root: 0.2,
    note: T('Se naturalise dans l’herbe et revient chaque année. Les rongeurs n’y touchent pas.', 'Naturalises in grass and returns every year. Rodents leave it alone.'),
    info: { bulb: true,
      bloom: [[2, 4]], height: [15, 50], colors: ['yellow', 'white', 'orange'], uses: ['cut', 'fragrant'],
      toxic: T('TOXIQUE : bulbe confondu avec un oignon, intoxications fréquentes. Ne pas le stocker avec les oignons. Sa sève irrite la peau et fane les autres fleurs du vase.', 'TOXIC: the bulb is mistaken for an onion, poisonings are common. Never store it with onions. Its sap irritates skin and wilts other flowers in a vase.'),
    },
  },
  {
    id: 'crocus', name: T('Crocus', 'Crocus'), latin: 'Crocus vernus', emoji: '💜', family: 'iridaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 2, pH: [6, 7.5], spacing: [10, 8], plantOut: [[9, 10]],
    bloomDays: [130, 180], season: 220, feeding: 'light', root: 0.15,
    note: T('Première nourriture des abeilles en fin d’hiver. À planter en masse dans la pelouse.', 'The first food for bees at winter’s end. Plant in drifts in the lawn.'),
    info: { bulb: true, bloom: [[2, 3]], height: [8, 12], colors: ['purple', 'white', 'yellow'], uses: ['pollinators'] },
  },
  {
    id: 'ornamentalallium', name: T('Ail d’ornement', 'Ornamental onion'), latin: 'Allium giganteum, A. hollandicum', emoji: '💜', family: 'amaryllidaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 3, pH: [6, 7.5], spacing: [30, 25], plantOut: [[9, 10]],
    bloomDays: [220, 260], season: 280, feeding: 'light', root: 0.3, returnYears: 3,
    note: T('Boules violettes très mellifères. Même famille que l’ail et l’oignon : il compte dans leur rotation (pourriture blanche).', 'Purple globes loved by bees. Same family as garlic and onion: it counts in their rotation (white rot).'),
    info: { bulb: true, bloom: [[5, 6]], height: [60, 120], colors: ['purple', 'white'], uses: ['pollinators', 'cut', 'dried'] },
  },
  {
    id: 'dahlia', name: T('Dahlia', 'Dahlia'), latin: 'Dahlia', emoji: '🌺', family: 'asteraceae', life: 'perennial', sun: 'full', frost: 'tender',
    tBase: 8, pH: [6, 7.5], spacing: [80, 60], plantOut: [[4, 5]],
    bloomDays: [80, 170], season: 180, feeding: 'heavy', root: 0.5,
    note: T('Tubercules plantés après les dernières gelées, tuteurés. Arroser et nourrir en été. Rentrer les tubercules à l’abri du gel en automne.', 'Tubers planted after the last frosts, staked. Water and feed in summer. Lift the tubers before frost in autumn.'),
    info: { bulb: true, bloom: [[7, 10]], height: [40, 150], colors: ['red', 'pink', 'orange', 'yellow', 'white', 'purple'], uses: ['cut', 'pollinators'], deadhead: true, lift: true },
  },
  {
    id: 'gladiolus', name: T('Glaïeul', 'Gladiolus'), latin: 'Gladiolus', emoji: '🌸', family: 'iridaceae', life: 'perennial', sun: 'full', frost: 'tender',
    tBase: 8, pH: [6, 7.5], spacing: [30, 15], plantOut: [[4, 6]],
    bloomDays: [90, 120], season: 150, feeding: 'medium', root: 0.3,
    note: T('Planter en plusieurs fois (toutes les 2 semaines) pour étaler la floraison. Rentrer les bulbes en automne.', 'Plant in batches (every 2 weeks) to spread flowering. Lift the corms in autumn.'),
    info: { bulb: true, bloom: [[7, 9]], height: [80, 120], colors: ['red', 'pink', 'white', 'yellow', 'orange', 'purple'], uses: ['cut'], lift: true },
  },
  {
    id: 'lily', name: T('Lys', 'Lily'), latin: 'Lilium', emoji: '🌸', family: 'liliaceae', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 5, pH: [6, 7], spacing: [30, 20], plantOut: [[10, 11], [3, 4]],
    bloomDays: [230, 270], season: 290, feeding: 'medium', root: 0.4,
    note: T('Tête au soleil, pied à l’ombre. Surveiller le criocère (petit coléoptère rouge) qui dévore les feuilles.', 'Head in the sun, feet in the shade. Watch for the lily beetle (small red beetle) that eats the leaves.'),
    info: { bulb: true,
      bloom: [[6, 8]], height: [60, 150], colors: ['white', 'pink', 'orange', 'yellow', 'red'], uses: ['cut', 'fragrant'],
      toxic: T('MORTEL POUR LES CHATS (même le pollen ou l’eau du vase). Couper les étamines pour les bouquets.', 'DEADLY TO CATS (even pollen or vase water). Remove stamens for bouquets.'),
    },
  },
];

const BUILT = [...DEFS, ...MORE_FLOWER_DEFS, ...EXTRA_FLOWER_DEFS].map(flower);
export const FLOWERS: Species[] = BUILT.map((b) => b.species);
export const FLOWER_INFO: Record<string, FlowerInfo> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.info]));

export function isFlower(sp: Pick<Species, 'type'>): boolean {
  return sp.type === 'flower';
}

// --- Graines de fleurs (phase 2) ------------------------------------------------


const x = (seedLife: number, pollination: SpeciesExtra['pollination'], isolation: number, trueToSeed: SpeciesExtra['trueToSeed'], fr: string, en: string, f1Common = false): SpeciesExtra => ({
  seedLife,
  pollination,
  isolation,
  priceKg: 0,
  trueToSeed,
  f1Common: f1Common || undefined,
  seedTip: { fr, en },
});

/** Garder ses graines de fleurs : fidélité, isolement, récolte. Ordres de grandeur des guides de semences au jardin. */
export const FLOWER_EXTRA: Record<string, SpeciesExtra> = {
  ...MORE_FLOWER_EXTRA,
  ...EXTRA_FLOWER_EXTRA,
  cosmos: x(3, 'insect', 200, 'mostly', 'Récolter les graines noires en aiguilles quand elles se détachent du cœur sec. Les couleurs se mélangent entre variétés voisines.', 'Collect the black needle-like seeds once they come away from the dry centre. Colours mix between neighbouring varieties.'),
  zinnia: x(4, 'insect', 200, 'mostly', 'Laisser sécher la fleur sur pied ; les graines sont à la base des pétales. Les séries naines « Profusion » sont des F1 stériles.', 'Let the flower dry on the plant; seeds sit at the base of the petals. Dwarf “Profusion” series are sterile F1s.', true),
  calendula: x(5, 'insect', 50, 'mostly', 'Graines en croissant à récolter brunes et sèches ; il se ressème de lui-même.', 'Crescent-shaped seeds, collect brown and dry; it self-seeds anyway.'),
  nasturtium: x(5, 'insect', 50, 'yes', 'Grosses graines vertes qui brunissent et tombent au pied : les ramasser sèches.', 'Large green seeds that turn brown and drop: pick them up once dry.'),
  sunflower: x(5, 'insect', 500, 'mostly', 'Couvrir la tête d’un voile contre les oiseaux ; couper quand le dos jaunit, finir de sécher à l’abri. Les tournesols à bouquets sans pollen sont des F1 qui ne donnent pas de graines.', 'Cover the head with fleece against birds; cut when the back turns yellow, finish drying indoors. Pollen-free bouquet sunflowers are F1s that set no seed.', true),
  cornflower: x(3, 'insect', 100, 'yes', 'Récolter les têtes sèches, frotter pour libérer les graines à aigrette.', 'Collect the dry heads and rub out the tufted seeds.'),
  nigella: x(2, 'insect', 50, 'yes', 'Cueillir les capsules gonflées quand elles brunissent et sonnent ; secouer pour récolter les graines noires.', 'Pick the inflated pods when they brown and rattle; shake out the black seeds.'),
  sweetpea: x(3, 'self', 5, 'yes', 'Autogame : chaque variété reste fidèle. Récolter les gousses brunes et sèches avant qu’elles éclatent. Graines toxiques : à étiqueter et garder hors de portée.', 'Self-pollinated: each variety stays true. Harvest brown dry pods before they split. Toxic seeds: label them and keep out of reach.'),
  frenchmarigold: x(3, 'insect', 100, 'mostly', 'Retirer les capsules sèches et en sortir les graines noir et blanc. Beaucoup d’œillets d’Inde du commerce sont des F1.', 'Pull out the dry seed heads and take the black-and-white seeds. Many shop marigolds are F1s.', true),
  eschscholzia: x(3, 'insect', 100, 'yes', 'Les longues gousses éclatent au soleil : les ensacher ou les cueillir juste avant.', 'The long pods burst in the sun: bag them or pick just before.'),
  phacelia: x(3, 'insect', 10, 'yes', 'Couper les tiges quand les premières graines brunissent, finir de sécher sur un drap.', 'Cut stems when the first seeds turn brown, finish drying on a sheet.'),
  borage: x(3, 'insect', 50, 'yes', 'Graines noires qui tombent vite : on compte plutôt sur le ressemis spontané.', 'Black seeds drop quickly: rely on self-seeding instead.'),
  alyssum: x(4, 'insect', 50, 'mostly', 'Secouer les tiges sèches au-dessus d’un sac.', 'Shake dry stems over a bag.'),
  snapdragon: x(3, 'insect', 200, 'mostly', 'Capsules en forme de petite tête de mort à cueillir sèches ; graines fines comme de la poussière. Les bourdons croisent les variétés voisines ; beaucoup de séries sont des F1.', 'Small skull-shaped capsules to pick when dry; seeds fine as dust. Bumblebees cross neighbouring varieties; many series are F1s.', true),
  chinaaster: x(2, 'self', 10, 'yes', 'Laisser sécher les têtes sur pied puis frotter ; graines peu durables, à ressemer l’année suivante.', 'Let heads dry on the plant then rub out; short-lived seeds, resow the next year.'),
  petunia: x(3, 'insect', 100, 'no', 'Presque tous les pétunias du commerce sont des hybrides F1 ou se multiplient par boutures : leurs graines ne redonnent pas la même plante.', 'Almost all shop petunias are F1 hybrids or grown from cuttings: their seeds do not come true.', true),
  foxglove: x(2, 'insect', 200, 'mostly', 'Couper la hampe quand les capsules du bas brunissent, avec des gants (plante toxique).', 'Cut the spike when the lower capsules brown, wearing gloves (toxic plant).'),
  hollyhock: x(3, 'insect', 300, 'mostly', 'Les galettes de graines se récoltent sèches en automne ; les couleurs se croisent entre pieds voisins.', 'Disc-shaped seed heads are collected dry in autumn; colours cross between neighbouring plants.'),
  pansy: x(2, 'insect', 50, 'no', 'Les pensées du commerce sont surtout des F1 : leurs semis donnent des couleurs mélangées.', 'Shop pansies are mostly F1s: their seedlings come in mixed colours.', true),
  forgetmenot: x(2, 'insect', 20, 'yes', 'Il se ressème partout : secouer les tiges sèches là où on le veut.', 'It self-seeds everywhere: shake dry stems where you want it.'),
  wallflower: x(4, 'insect', 100, 'mostly', 'Gousses fines à récolter sèches en été.', 'Thin pods to collect dry in summer.'),
  sweetwilliam: x(4, 'insect', 100, 'mostly', 'Capsules sèches en fin d’été ; les couleurs se mélangent.', 'Dry capsules in late summer; colours mix.'),
  lavender: x(3, 'insect', 50, 'no', 'Les variétés ne se ressèment pas à l’identique : multiplier par boutures de 10 cm en fin d’été.', 'Varieties do not come true from seed: take 10 cm cuttings in late summer.'),
  echinacea: x(2, 'insect', 100, 'mostly', 'L’espèce se ressème ; les cultivars colorés se multiplient par division au printemps.', 'The species self-seeds; coloured cultivars are divided in spring.'),
  rudbeckia: x(2, 'insect', 100, 'mostly', 'Récolter les cônes secs ; ou diviser les touffes.', 'Collect the dry cones; or divide the clumps.'),
  yarrow: x(3, 'insect', 100, 'mostly', 'Ombelles sèches à secouer ; les variétés colorées reviennent souvent au blanc par semis.', 'Shake dry flower heads; coloured varieties often revert to white from seed.'),
  catmint: x(0, 'vegetative', 0, 'no', 'Hybride stérile : se multiplie par division des touffes au printemps.', 'A sterile hybrid: propagate by dividing clumps in spring.'),
  rose: x(0, 'vegetative', 0, 'no', 'Les graines (cynorhodons) ne redonnent pas la variété : bouturage de rameaux en automne ou greffe.', 'Seeds (hips) do not come true: take hardwood cuttings in autumn, or graft.'),
  peony: x(0, 'vegetative', 0, 'no', 'Division de la souche en septembre, avec 3 à 5 bourgeons par éclat ; les semis mettent 5 ans à fleurir.', 'Divide the crown in September, 3–5 buds per piece; seedlings take 5 years to flower.'),
  iris: x(0, 'vegetative', 0, 'no', 'Diviser les rhizomes après la floraison, tous les 3-4 ans.', 'Divide rhizomes after flowering every 3–4 years.'),
  aster: x(0, 'vegetative', 0, 'no', 'Diviser les touffes au printemps ; les semis ne reproduisent pas la variété.', 'Divide clumps in spring; seedlings do not reproduce the variety.'),
  tulip: x(0, 'vegetative', 0, 'no', 'Se multiplie par les petits bulbes (caïeux) qui se forment autour du bulbe ; les graines mettent 5 à 7 ans à fleurir.', 'Spreads by offsets around the bulb; seedlings take 5–7 years to flower.'),
  daffodil: x(0, 'vegetative', 0, 'no', 'Diviser les touffes trop denses après le jaunissement du feuillage.', 'Lift and split crowded clumps once the foliage has yellowed.'),
  crocus: x(0, 'vegetative', 0, 'no', 'Se multiplie seul par cormes et graines dans la pelouse.', 'Spreads by itself through corms and seed in the lawn.'),
  ornamentalallium: x(0, 'vegetative', 0, 'no', 'Caïeux autour du bulbe ; les têtes sèches font de beaux bouquets.', 'Offsets around the bulb; dry heads make fine bouquets.'),
  dahlia: x(0, 'vegetative', 0, 'no', 'Diviser les tubercules au printemps (un œil par morceau) ou bouturer les jeunes pousses. Les graines donnent des dahlias tous différents.', 'Divide tubers in spring (one eye per piece) or take cuttings from young shoots. Seeds give dahlias that all differ.'),
  gladiolus: x(0, 'vegetative', 0, 'no', 'Garder les petits cormes (caïeux) formés à la base pour les replanter.', 'Keep the small cormels formed at the base and replant them.'),
  lily: x(0, 'vegetative', 0, 'no', 'Écailles du bulbe ou bulbilles à l’aisselle des feuilles (selon les espèces).', 'Bulb scales, or bulbils in the leaf axils (depending on species).'),
};
