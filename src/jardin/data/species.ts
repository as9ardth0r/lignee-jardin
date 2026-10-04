/**
 * Catalogue de départ : 42 espèces potagères, petits fruits et aromatiques.
 *
 * Valeurs de référence pour un potager familial du nord de la France
 * (calendrier « région parisienne », décalé ensuite selon le climat).
 * Ce sont des ORDRES DE GRANDEUR compilés à la main :
 * - Kc et profondeur racinaire : FAO-56 (Allen et al. 1998, tableaux 11,
 *   12 et 22), profondeurs ramenées au jardin ;
 * - exportations N-P₂O₅-K₂O par kg récolté : fourchettes usuelles des
 *   guides de fertilisation (CTIFL, Yara), arrondies ;
 * - rendements : potager familial bien conduit, pas maraîchage intensif ;
 * - calendriers, espacements, températures : pratiques jardinières
 *   courantes en France.
 * Chaque valeur est à vérifier et sourcer fiche par fiche (voir README).
 */
import { HERBS } from './herbs';
import { ORCHARD } from './orchard';
import { MORE_VEGETABLES } from './vegMore';
import { COVERS } from './covers';
import type { Species } from '../model';
import { FLOWERS } from './flowers';

/** Légumes, petits fruits et aromatiques. */
export const VEGETABLES: Species[] = [
  // --- Solanacées ---------------------------------------------------------
  {
    id: 'tomato', name: { fr: 'Tomate', en: 'Tomato' }, latin: 'Solanum lycopersicum', emoji: '🍅',
    family: 'solanaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [20, 27], pH: [6, 7], spacing: { row: 80, inRow: 50 },
    sowIndoor: [[2, 4]], plantOut: [[5, 6]], transplantAfter: 50,
    daysToHarvest: [110, 140], season: 200,
    stages: [['germination', 0], ['vegetative', 10], ['flowering', 60], ['fruiting', 85]],
    kc: [0.6, 1.15, 0.8], rootDepth: 0.7, yieldM2: [3, 8], exports: { N: 2.8, P2O5: 1.0, K2O: 4.5 },
    feeding: 'heavy', returnYears: 3,
    note: {
      fr: 'Tuteurer, arroser au pied sans mouiller le feuillage (mildiou) ; la potasse compte surtout à partir de la nouaison.',
      en: 'Stake, water at the base without wetting the leaves (blight); potash matters most from fruit set on.',
    },
  },
  {
    id: 'eggplant', name: { fr: 'Aubergine', en: 'Aubergine' }, latin: 'Solanum melongena', emoji: '🍆',
    family: 'solanaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [22, 30], pH: [6, 7], spacing: { row: 80, inRow: 60 },
    sowIndoor: [[2, 3]], plantOut: [[5, 6]], transplantAfter: 60,
    daysToHarvest: [130, 160], season: 210,
    stages: [['germination', 0], ['vegetative', 12], ['flowering', 70], ['fruiting', 95]],
    kc: [0.6, 1.05, 0.9], rootDepth: 0.7, yieldM2: [2, 4], exports: { N: 3.5, P2O5: 1.0, K2O: 5.5 },
    feeding: 'heavy', returnYears: 3,
    note: {
      fr: 'La plus frileuse des solanacées : plantez dans un sol réchauffé et paillez.',
      en: 'The most cold-sensitive solanaceous crop: plant into warm soil and mulch.',
    },
  },
  {
    id: 'pepper', name: { fr: 'Poivron et piment', en: 'Pepper and chilli' }, latin: 'Capsicum annuum', emoji: '🫑',
    family: 'solanaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [20, 28], pH: [6, 7], spacing: { row: 60, inRow: 45 },
    sowIndoor: [[2, 3]], plantOut: [[5, 6]], transplantAfter: 60,
    daysToHarvest: [120, 160], season: 210,
    stages: [['germination', 0], ['vegetative', 12], ['flowering', 65], ['fruiting', 90]],
    kc: [0.6, 1.05, 0.9], rootDepth: 0.6, yieldM2: [1.5, 3], exports: { N: 3.5, P2O5: 1.0, K2O: 5.0 },
    feeding: 'heavy', returnYears: 3,
    note: {
      fr: 'Un excès d’azote donne des feuilles au détriment des fruits.',
      en: 'Too much nitrogen gives leaves at the expense of fruit.',
    },
  },
  {
    id: 'potato', name: { fr: 'Pomme de terre', en: 'Potato' }, latin: 'Solanum tuberosum', emoji: '🥔',
    family: 'solanaceae', type: 'root', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 7, tOpt: [15, 20], pH: [5.5, 6.5], spacing: { row: 70, inRow: 35 },
    plantOut: [[3, 5]],
    daysToHarvest: [90, 130], season: 130,
    stages: [['germination', 0], ['vegetative', 20], ['bulking', 55]],
    kc: [0.5, 1.15, 0.75], rootDepth: 0.4, yieldM2: [2, 4], exports: { N: 3.5, P2O5: 1.4, K2O: 6.0 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Butter au fil de la croissance ; un sol un peu acide limite la gale commune.',
      en: 'Earth up as it grows; slightly acid soil limits common scab.',
    },
  },

  // --- Cucurbitacées -----------------------------------------------------
  {
    id: 'zucchini', name: { fr: 'Courgette', en: 'Courgette' }, latin: 'Cucurbita pepo', emoji: '🥒',
    family: 'cucurbitaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [20, 28], pH: [6, 7.5], spacing: { row: 100, inRow: 80 },
    sowIndoor: [[4, 5]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 25,
    daysToHarvest: [55, 70], season: 140,
    stages: [['germination', 0], ['vegetative', 8], ['flowering', 40], ['fruiting', 50]],
    kc: [0.5, 0.95, 0.75], rootDepth: 0.6, yieldM2: [4, 8], exports: { N: 3.0, P2O5: 1.2, K2O: 5.0 },
    feeding: 'heavy', returnYears: 3,
    note: {
      fr: 'Récolter jeune et souvent : un fruit oublié freine toute la plante.',
      en: 'Pick young and often: one forgotten fruit slows the whole plant.',
    },
  },
  {
    id: 'cucumber', name: { fr: 'Concombre', en: 'Cucumber' }, latin: 'Cucumis sativus', emoji: '🥒',
    family: 'cucurbitaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [22, 28], pH: [6, 7], spacing: { row: 100, inRow: 50 },
    sowIndoor: [[4, 5]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 25,
    daysToHarvest: [60, 75], season: 140,
    stages: [['germination', 0], ['vegetative', 8], ['flowering', 40], ['fruiting', 55]],
    kc: [0.6, 1.0, 0.75], rootDepth: 0.7, yieldM2: [4, 8], exports: { N: 2.0, P2O5: 1.0, K2O: 3.5 },
    feeding: 'heavy', returnYears: 3,
    note: {
      fr: 'Palisser et garder le sol frais : l’amertume vient souvent d’un manque d’eau.',
      en: 'Trellis and keep the soil moist: bitterness often comes from water stress.',
    },
  },
  {
    id: 'melon', name: { fr: 'Melon', en: 'Melon' }, latin: 'Cucumis melo', emoji: '🍈',
    family: 'cucurbitaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [24, 30], pH: [6, 7.5], spacing: { row: 100, inRow: 80 },
    sowIndoor: [[4, 5]], plantOut: [[5, 6]], transplantAfter: 30,
    daysToHarvest: [90, 110], season: 140,
    stages: [['germination', 0], ['vegetative', 8], ['flowering', 45], ['fruiting', 60]],
    kc: [0.5, 0.85, 0.6], rootDepth: 0.8, yieldM2: [1.5, 3], exports: { N: 3.5, P2O5: 1.5, K2O: 6.0 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Réduire l’arrosage à la maturation pour plus de sucre ; tailler pour garder 4 à 6 fruits.',
      en: 'Cut back watering as fruit ripens for more sugar; prune to keep 4 to 6 fruits.',
    },
  },
  {
    id: 'squash', name: { fr: 'Courge et potiron', en: 'Winter squash and pumpkin' }, latin: 'Cucurbita maxima, C. moschata', emoji: '🎃',
    family: 'cucurbitaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [20, 28], pH: [6, 7.5], spacing: { row: 150, inRow: 120 },
    sowIndoor: [[4, 5]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 25,
    daysToHarvest: [100, 140], season: 160,
    stages: [['germination', 0], ['vegetative', 8], ['flowering', 50], ['fruiting', 65]],
    kc: [0.5, 1.0, 0.8], rootDepth: 0.7, yieldM2: [2, 4], exports: { N: 3.0, P2O5: 1.5, K2O: 5.0 },
    feeding: 'heavy', returnYears: 3,
    note: {
      fr: 'Très gourmande : plantez sur un ancien tas de compost. Récolter avant les gelées, pédoncule sec.',
      en: 'A heavy feeder: plant on an old compost heap. Harvest before frost, stalk dry.',
    },
  },
  {
    id: 'watermelon', name: { fr: 'Pastèque', en: 'Watermelon' }, latin: 'Citrullus lanatus', emoji: '🍉',
    family: 'cucurbitaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [24, 32], pH: [6, 7], spacing: { row: 150, inRow: 100 },
    sowIndoor: [[4, 5]], plantOut: [[5, 6]], transplantAfter: 30,
    daysToHarvest: [90, 120], season: 150,
    stages: [['germination', 0], ['vegetative', 8], ['flowering', 45], ['fruiting', 60]],
    kc: [0.4, 1.0, 0.75], rootDepth: 0.8, yieldM2: [2, 4], exports: { N: 2.5, P2O5: 1.0, K2O: 4.0 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Demande beaucoup de chaleur : réservée au Sud, ou à la serre au nord de la Loire.',
      en: 'Needs a lot of heat: southern gardens, or a greenhouse further north.',
    },
  },

  // --- Poacées ------------------------------------------------------------
  {
    id: 'sweetcorn', name: { fr: 'Maïs doux', en: 'Sweetcorn' }, latin: 'Zea mays', emoji: '🌽',
    family: 'poaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [21, 30], pH: [6, 7], spacing: { row: 75, inRow: 30 },
    sowIndoor: [[4, 5]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 25,
    daysToHarvest: [80, 100], season: 120,
    stages: [['germination', 0], ['vegetative', 10], ['flowering', 60], ['fruiting', 70]],
    kc: [0.3, 1.15, 1.05], rootDepth: 0.8, yieldM2: [1, 2], exports: { N: 5.0, P2O5: 2.0, K2O: 4.0 },
    feeding: 'heavy', returnYears: 2,
    note: {
      fr: 'Semer en carré plutôt qu’en ligne : le vent pollinise mieux. À isoler des maïs fourragers.',
      en: 'Sow in a block rather than a row: wind pollinates better. Keep away from field corn.',
    },
  },

  // --- Fabacées -----------------------------------------------------------
  {
    id: 'bean', name: { fr: 'Haricot', en: 'Bean' }, latin: 'Phaseolus vulgaris', emoji: '🫘',
    family: 'fabaceae', type: 'legume', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [18, 26], pH: [6, 7.5], spacing: { row: 40, inRow: 8 },
    sowOutdoor: [[5, 7]],
    daysToHarvest: [55, 70], season: 100,
    stages: [['germination', 0], ['vegetative', 8], ['flowering', 40], ['fruiting', 50]],
    kc: [0.5, 1.05, 0.9], rootDepth: 0.5, yieldM2: [1, 2], exports: { N: 7.0, P2O5: 2.0, K2O: 6.0 },
    feeding: 'improver', returnYears: 3,
    note: {
      fr: 'Fixe l’azote de l’air : inutile de lui en apporter. Semer dans un sol à plus de 12 °C.',
      en: 'Fixes nitrogen from the air: no need to feed it any. Sow into soil above 12 °C.',
    },
  },
  {
    id: 'pea', name: { fr: 'Pois', en: 'Pea' }, latin: 'Pisum sativum', emoji: '🫛',
    family: 'fabaceae', type: 'legume', life: 'annual', sun: 'full', frost: 'half',
    tBase: 4, tOpt: [13, 18], pH: [6, 7.5], spacing: { row: 50, inRow: 5 },
    sowOutdoor: [[2, 4]],
    daysToHarvest: [80, 100], season: 120,
    stages: [['germination', 0], ['vegetative', 12], ['flowering', 55], ['fruiting', 70]],
    kc: [0.5, 1.15, 1.1], rootDepth: 0.6, yieldM2: [0.5, 1], exports: { N: 10.0, P2O5: 3.0, K2O: 8.0 },
    feeding: 'improver', returnYears: 3,
    note: {
      fr: 'Craint la chaleur : semer tôt. Ramer les variétés grimpantes.',
      en: 'Dislikes heat: sow early. Give climbing varieties supports.',
    },
  },
  {
    id: 'broadbean', name: { fr: 'Fève', en: 'Broad bean' }, latin: 'Vicia faba', emoji: '🫘',
    family: 'fabaceae', type: 'legume', life: 'annual', sun: 'full', frost: 'hardy',
    tBase: 2, tOpt: [12, 18], pH: [6, 7.5], spacing: { row: 50, inRow: 15 },
    sowOutdoor: [[2, 3], [10, 11]],
    daysToHarvest: [100, 140], season: 160,
    stages: [['germination', 0], ['vegetative', 15], ['flowering', 70], ['fruiting', 95]],
    kc: [0.5, 1.15, 1.1], rootDepth: 0.7, yieldM2: [0.8, 1.5], exports: { N: 8.0, P2O5: 2.5, K2O: 7.0 },
    feeding: 'improver', returnYears: 3,
    note: {
      fr: 'Pincer les têtes en pleine floraison contre les pucerons noirs.',
      en: 'Pinch out the tips at full flowering against black aphids.',
    },
  },

  // --- Astéracées, amaranthacées, salades ---------------------------------
  {
    id: 'lettuce', name: { fr: 'Laitue', en: 'Lettuce' }, latin: 'Lactuca sativa', emoji: '🥬',
    family: 'asteraceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'half',
    tBase: 4, tOpt: [15, 20], pH: [6, 7], spacing: { row: 30, inRow: 30 },
    sowIndoor: [[2, 4]], sowOutdoor: [[3, 8]], plantOut: [[3, 9]], transplantAfter: 30,
    daysToHarvest: [50, 75], season: 80,
    stages: [['germination', 0], ['vegetative', 8], ['harvest', 50]],
    kc: [0.7, 1.0, 0.95], rootDepth: 0.3, yieldM2: [2, 4], exports: { N: 2.0, P2O5: 0.8, K2O: 4.5 },
    feeding: 'medium', returnYears: 2,
    note: {
      fr: 'Semer peu et souvent (toutes les trois semaines) ; monte en graines par forte chaleur.',
      en: 'Sow little and often (every three weeks); bolts in hot weather.',
    },
  },
  {
    id: 'endive', name: { fr: 'Chicorée et scarole', en: 'Endive and escarole' }, latin: 'Cichorium endivia', emoji: '🥬',
    family: 'asteraceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'half',
    tBase: 5, tOpt: [15, 20], pH: [6, 7.5], spacing: { row: 40, inRow: 35 },
    sowIndoor: [[5, 7]], sowOutdoor: [[6, 7]], plantOut: [[7, 8]], transplantAfter: 35,
    daysToHarvest: [80, 100], season: 110,
    stages: [['germination', 0], ['vegetative', 10], ['harvest', 80]],
    kc: [0.7, 1.0, 0.95], rootDepth: 0.4, yieldM2: [2, 4], exports: { N: 2.5, P2O5: 1.0, K2O: 5.0 },
    feeding: 'medium', returnYears: 2,
    note: {
      fr: 'Culture d’été et d’automne : semée trop tôt, elle monte en graines.',
      en: 'A summer and autumn crop: sown too early, it bolts.',
    },
  },
  {
    id: 'spinach', name: { fr: 'Épinard', en: 'Spinach' }, latin: 'Spinacia oleracea', emoji: '🌿',
    family: 'amaranthaceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'hardy',
    tBase: 2, tOpt: [12, 18], pH: [6.5, 7.5], spacing: { row: 25, inRow: 8 },
    sowOutdoor: [[3, 4], [8, 9]],
    daysToHarvest: [40, 60], season: 70,
    stages: [['germination', 0], ['vegetative', 8], ['harvest', 40]],
    kc: [0.7, 1.0, 0.95], rootDepth: 0.3, yieldM2: [1, 2], exports: { N: 4.5, P2O5: 1.5, K2O: 6.0 },
    feeding: 'medium', returnYears: 2,
    note: {
      fr: 'Monte en graines quand les jours rallongent : préférez les semis de fin d’été.',
      en: 'Bolts as days lengthen: favour late-summer sowings.',
    },
  },
  {
    id: 'chard', name: { fr: 'Blette', en: 'Swiss chard' }, latin: 'Beta vulgaris subsp. vulgaris (groupe Cicla)', emoji: '🥬',
    family: 'amaranthaceae', type: 'leaf', life: 'biennial', sun: 'partial', frost: 'half',
    tBase: 5, tOpt: [15, 24], pH: [6.5, 7.5], spacing: { row: 45, inRow: 35 },
    sowOutdoor: [[4, 6]],
    daysToHarvest: [60, 80], season: 200,
    stages: [['germination', 0], ['vegetative', 10], ['harvest', 60]],
    kc: [0.5, 1.0, 0.95], rootDepth: 0.5, yieldM2: [3, 6], exports: { N: 3.5, P2O5: 1.2, K2O: 6.0 },
    feeding: 'medium', returnYears: 3,
    note: {
      fr: 'Récolter les feuilles extérieures au fur et à mesure, plusieurs mois durant.',
      en: 'Pick the outer leaves as needed over several months.',
    },
  },
  {
    id: 'cornsalad', name: { fr: 'Mâche', en: 'Lamb’s lettuce' }, latin: 'Valerianella locusta', emoji: '🌱',
    family: 'caprifoliaceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'hardy',
    tBase: 3, tOpt: [10, 16], pH: [6.5, 7.5], spacing: { row: 15, inRow: 5 },
    sowOutdoor: [[8, 9]],
    daysToHarvest: [60, 90], season: 150,
    stages: [['germination', 0], ['vegetative', 10], ['harvest', 60]],
    kc: [0.7, 0.95, 0.9], rootDepth: 0.2, yieldM2: [0.4, 0.8], exports: { N: 4.0, P2O5: 1.5, K2O: 6.0 },
    feeding: 'light', returnYears: 2,
    note: {
      fr: 'Semer sur sol tassé et frais en fin d’été ; se récolte tout l’hiver.',
      en: 'Sow on firm, moist soil in late summer; picked all winter.',
    },
  },

  // --- Brassicacées -------------------------------------------------------
  {
    id: 'rocket', name: { fr: 'Roquette', en: 'Rocket' }, latin: 'Eruca vesicaria', emoji: '🌿',
    family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [12, 20], pH: [6, 7.5], spacing: { row: 20, inRow: 5 },
    sowOutdoor: [[3, 5], [8, 9]],
    daysToHarvest: [30, 45], season: 60,
    stages: [['germination', 0], ['vegetative', 6], ['harvest', 30]],
    kc: [0.7, 1.0, 0.95], rootDepth: 0.3, yieldM2: [0.8, 1.5], exports: { N: 4.0, P2O5: 1.5, K2O: 5.0 },
    feeding: 'light', returnYears: 3,
    note: {
      fr: 'Altises au printemps : voile anti-insectes, ou semis de fin d’été.',
      en: 'Flea beetles in spring: use insect mesh, or sow in late summer.',
    },
  },
  {
    id: 'cabbage', name: { fr: 'Chou pommé', en: 'Cabbage' }, latin: 'Brassica oleracea var. capitata', emoji: '🥬',
    family: 'brassicaceae', type: 'leaf', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [15, 20], pH: [6.5, 7.5], spacing: { row: 60, inRow: 50 },
    sowIndoor: [[3, 5]], plantOut: [[5, 7]], transplantAfter: 40,
    daysToHarvest: [100, 160], season: 180,
    stages: [['germination', 0], ['vegetative', 10], ['bulking', 70]],
    kc: [0.7, 1.05, 0.95], rootDepth: 0.5, yieldM2: [3, 6], exports: { N: 3.5, P2O5: 1.5, K2O: 4.5 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Gourmand en azote ; une rotation longue limite la hernie.',
      en: 'Hungry for nitrogen; a long rotation limits clubroot.',
    },
  },
  {
    id: 'cauliflower', name: { fr: 'Chou-fleur', en: 'Cauliflower' }, latin: 'Brassica oleracea var. botrytis', emoji: '🥦',
    family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'half',
    tBase: 4, tOpt: [15, 20], pH: [6.5, 7.5], spacing: { row: 70, inRow: 60 },
    sowIndoor: [[3, 6]], plantOut: [[5, 7]], transplantAfter: 40,
    daysToHarvest: [100, 150], season: 160,
    stages: [['germination', 0], ['vegetative', 10], ['bulking', 80]],
    kc: [0.7, 1.05, 0.95], rootDepth: 0.5, yieldM2: [1.5, 3], exports: { N: 4.0, P2O5: 1.5, K2O: 4.5 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Arrosage régulier indispensable ; rabattre des feuilles sur la pomme contre le soleil.',
      en: 'Steady watering is essential; fold leaves over the curd against the sun.',
    },
  },
  {
    id: 'broccoli', name: { fr: 'Brocoli', en: 'Broccoli' }, latin: 'Brassica oleracea var. italica', emoji: '🥦',
    family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'half',
    tBase: 4, tOpt: [15, 20], pH: [6.5, 7.5], spacing: { row: 60, inRow: 50 },
    sowIndoor: [[3, 6]], plantOut: [[5, 7]], transplantAfter: 35,
    daysToHarvest: [80, 110], season: 130,
    stages: [['germination', 0], ['vegetative', 10], ['bulking', 65]],
    kc: [0.7, 1.05, 0.95], rootDepth: 0.5, yieldM2: [1, 2], exports: { N: 5.0, P2O5: 2.0, K2O: 5.0 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Couper la tête avant l’ouverture des fleurs jaunes : des pousses latérales suivent.',
      en: 'Cut the head before the yellow flowers open: side shoots follow.',
    },
  },
  {
    id: 'brussels', name: { fr: 'Chou de Bruxelles', en: 'Brussels sprouts' }, latin: 'Brassica oleracea var. gemmifera', emoji: '🥬',
    family: 'brassicaceae', type: 'leaf', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [15, 20], pH: [6.5, 7.5], spacing: { row: 70, inRow: 60 },
    sowIndoor: [[3, 5]], plantOut: [[5, 6]], transplantAfter: 45,
    daysToHarvest: [150, 200], season: 240,
    stages: [['germination', 0], ['vegetative', 10], ['bulking', 120]],
    kc: [0.7, 1.05, 0.95], rootDepth: 0.6, yieldM2: [1, 2], exports: { N: 6.0, P2O5: 2.0, K2O: 6.0 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Récolter après les premières gelées, du bas vers le haut de la tige.',
      en: 'Pick after the first frosts, from the bottom of the stem up.',
    },
  },
  {
    id: 'kale', name: { fr: 'Chou kale', en: 'Kale' }, latin: 'Brassica oleracea var. sabellica', emoji: '🥬',
    family: 'brassicaceae', type: 'leaf', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [15, 20], pH: [6.5, 7.5], spacing: { row: 60, inRow: 50 },
    sowIndoor: [[4, 6]], plantOut: [[6, 7]], transplantAfter: 35,
    daysToHarvest: [70, 90], season: 240,
    stages: [['germination', 0], ['vegetative', 10], ['harvest', 70]],
    kc: [0.7, 1.05, 0.95], rootDepth: 0.5, yieldM2: [1.5, 3], exports: { N: 5.0, P2O5: 1.5, K2O: 5.5 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Récolte de feuilles tout l’hiver ; le gel les rend plus douces.',
      en: 'Leaves all winter; frost makes them sweeter.',
    },
  },
  {
    id: 'kohlrabi', name: { fr: 'Chou-rave', en: 'Kohlrabi' }, latin: 'Brassica oleracea var. gongylodes', emoji: '🥬',
    family: 'brassicaceae', type: 'root', life: 'biennial', sun: 'full', frost: 'half',
    tBase: 4, tOpt: [15, 20], pH: [6.5, 7.5], spacing: { row: 35, inRow: 25 },
    sowIndoor: [[3, 4]], sowOutdoor: [[4, 7]], plantOut: [[4, 8]], transplantAfter: 30,
    daysToHarvest: [55, 75], season: 90,
    stages: [['germination', 0], ['vegetative', 8], ['bulking', 40]],
    kc: [0.7, 1.05, 0.95], rootDepth: 0.4, yieldM2: [2, 4], exports: { N: 3.0, P2O5: 1.2, K2O: 4.5 },
    feeding: 'medium', returnYears: 4,
    note: {
      fr: 'Récolter à la taille d’une balle de tennis, avant qu’il ne devienne fibreux.',
      en: 'Harvest at tennis-ball size, before it turns woody.',
    },
  },
  {
    id: 'radish', name: { fr: 'Radis', en: 'Radish' }, latin: 'Raphanus sativus', emoji: '🌱',
    family: 'brassicaceae', type: 'root', life: 'annual', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [12, 18], pH: [6, 7.5], spacing: { row: 15, inRow: 3 },
    sowOutdoor: [[3, 5], [8, 9]],
    daysToHarvest: [25, 35], season: 40,
    stages: [['germination', 0], ['vegetative', 5], ['bulking', 15]],
    kc: [0.7, 0.9, 0.85], rootDepth: 0.3, yieldM2: [1, 2], exports: { N: 3.0, P2O5: 1.0, K2O: 4.0 },
    feeding: 'light', returnYears: 3,
    note: {
      fr: 'Arroser régulièrement : la sécheresse le rend creux et piquant.',
      en: 'Water regularly: drought makes it hollow and hot.',
    },
  },
  {
    id: 'turnip', name: { fr: 'Navet', en: 'Turnip' }, latin: 'Brassica rapa subsp. rapa', emoji: '🌱',
    family: 'brassicaceae', type: 'root', life: 'biennial', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [12, 18], pH: [6, 7.5], spacing: { row: 30, inRow: 10 },
    sowOutdoor: [[3, 4], [7, 9]],
    daysToHarvest: [50, 70], season: 90,
    stages: [['germination', 0], ['vegetative', 8], ['bulking', 30]],
    kc: [0.5, 1.1, 0.95], rootDepth: 0.5, yieldM2: [2, 4], exports: { N: 3.0, P2O5: 1.2, K2O: 5.0 },
    feeding: 'medium', returnYears: 3,
    note: {
      fr: 'Les semis d’été pour l’automne subissent moins d’altises et de montées en graines.',
      en: 'Summer sowings for autumn suffer fewer flea beetles and less bolting.',
    },
  },

  // --- Apiacées -----------------------------------------------------------
  {
    id: 'carrot', name: { fr: 'Carotte', en: 'Carrot' }, latin: 'Daucus carota subsp. sativus', emoji: '🥕',
    family: 'apiaceae', type: 'root', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [15, 20], pH: [6, 7], spacing: { row: 25, inRow: 4 },
    sowOutdoor: [[3, 7]],
    daysToHarvest: [70, 120], season: 150,
    stages: [['germination', 0], ['vegetative', 20], ['bulking', 60]],
    kc: [0.7, 1.05, 0.95], rootDepth: 0.5, yieldM2: [3, 5], exports: { N: 4.0, P2O5: 1.6, K2O: 6.0 },
    feeding: 'medium', returnYears: 4,
    note: {
      fr: 'Sol meuble, sans fumier frais ; voile contre la mouche de la carotte.',
      en: 'Loose soil, no fresh manure; mesh against carrot fly.',
    },
  },
  {
    id: 'parsnip', name: { fr: 'Panais', en: 'Parsnip' }, latin: 'Pastinaca sativa', emoji: '🥕',
    family: 'apiaceae', type: 'root', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [15, 20], pH: [6, 7.5], spacing: { row: 35, inRow: 10 },
    sowOutdoor: [[3, 5]],
    daysToHarvest: [120, 180], season: 240,
    stages: [['germination', 0], ['vegetative', 25], ['bulking', 80]],
    kc: [0.5, 1.05, 0.95], rootDepth: 0.7, yieldM2: [2, 4], exports: { N: 4.0, P2O5: 1.8, K2O: 6.0 },
    feeding: 'medium', returnYears: 4,
    note: {
      fr: 'Germination lente (trois semaines) : utilisez des graines de l’année.',
      en: 'Slow to germinate (three weeks): use fresh seed.',
    },
  },
  {
    id: 'celeriac', name: { fr: 'Céleri-rave', en: 'Celeriac' }, latin: 'Apium graveolens var. rapaceum', emoji: '🥬',
    family: 'apiaceae', type: 'root', life: 'biennial', sun: 'full', frost: 'half',
    tBase: 7, tOpt: [16, 21], pH: [6.5, 7.5], spacing: { row: 50, inRow: 40 },
    sowIndoor: [[2, 4]], plantOut: [[5, 6]], transplantAfter: 70,
    daysToHarvest: [160, 200], season: 220,
    stages: [['germination', 0], ['vegetative', 20], ['bulking', 110]],
    kc: [0.7, 1.05, 1.0], rootDepth: 0.5, yieldM2: [3, 5], exports: { N: 5.0, P2O5: 2.0, K2O: 7.0 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Grand buveur : ne jamais le laisser sécher ; retirer les feuilles basses à l’automne.',
      en: 'A heavy drinker: never let it dry out; strip the lower leaves in autumn.',
    },
  },
  {
    id: 'fennel', name: { fr: 'Fenouil', en: 'Florence fennel' }, latin: 'Foeniculum vulgare var. azoricum', emoji: '🌿',
    family: 'apiaceae', type: 'bulb', life: 'annual', sun: 'full', frost: 'half',
    tBase: 7, tOpt: [15, 22], pH: [6.5, 7.5], spacing: { row: 40, inRow: 25 },
    sowOutdoor: [[6, 7]],
    daysToHarvest: [70, 100], season: 110,
    stages: [['germination', 0], ['vegetative', 10], ['bulking', 55]],
    kc: [0.7, 1.05, 1.0], rootDepth: 0.5, yieldM2: [1.5, 3], exports: { N: 3.0, P2O5: 1.2, K2O: 5.0 },
    feeding: 'medium', returnYears: 4,
    note: {
      fr: 'Semé avant juin, il monte en graines ; arrosage régulier pour des bulbes tendres.',
      en: 'Sown before June it bolts; steady watering for tender bulbs.',
    },
  },
  {
    id: 'parsley', name: { fr: 'Persil', en: 'Parsley' }, latin: 'Petroselinum crispum', emoji: '🌿',
    family: 'apiaceae', type: 'herb', life: 'biennial', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [15, 20], pH: [6, 7.5], spacing: { row: 25, inRow: 15 },
    sowOutdoor: [[3, 7]],
    daysToHarvest: [70, 90], season: 240,
    stages: [['germination', 0], ['vegetative', 25], ['harvest', 70]],
    kc: [0.7, 1.0, 0.95], rootDepth: 0.4, yieldM2: [1, 2], exports: { N: 5.0, P2O5: 1.5, K2O: 6.0 },
    feeding: 'medium', returnYears: 4,
    note: {
      fr: 'Germination lente : faire tremper les graines une nuit avant le semis.',
      en: 'Slow to germinate: soak the seed overnight before sowing.',
    },
  },

  // --- Amaryllidacées (alliums) -------------------------------------------
  {
    id: 'onion', name: { fr: 'Oignon', en: 'Onion' }, latin: 'Allium cepa', emoji: '🧅',
    family: 'amaryllidaceae', type: 'bulb', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 5, tOpt: [13, 24], pH: [6, 7.5], spacing: { row: 25, inRow: 10 },
    sowOutdoor: [[2, 4], [8, 9]],
    daysToHarvest: [120, 180], season: 180,
    stages: [['germination', 0], ['vegetative', 20], ['bulking', 90]],
    kc: [0.7, 1.05, 0.75], rootDepth: 0.3, yieldM2: [2, 4], exports: { N: 3.0, P2O5: 1.2, K2O: 3.5 },
    feeding: 'medium', returnYears: 4,
    note: {
      fr: 'Arrêter l’arrosage un mois avant la récolte pour une bonne conservation.',
      en: 'Stop watering a month before harvest so the bulbs store well.',
    },
  },
  {
    id: 'shallot', name: { fr: 'Échalote', en: 'Shallot' }, latin: 'Allium cepa (groupe Aggregatum)', emoji: '🧅',
    family: 'amaryllidaceae', type: 'bulb', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [13, 22], pH: [6, 7.5], spacing: { row: 25, inRow: 15 },
    plantOut: [[2, 3]],
    daysToHarvest: [120, 150], season: 160,
    stages: [['vegetative', 0], ['bulking', 80]],
    kc: [0.7, 1.05, 0.75], rootDepth: 0.3, yieldM2: [1.5, 3], exports: { N: 3.0, P2O5: 1.2, K2O: 4.0 },
    feeding: 'light', returnYears: 4,
    note: {
      fr: 'Planter le bulbe à peine enterré ; récolter quand le feuillage jaunit.',
      en: 'Plant the bulb barely covered; lift when the leaves turn yellow.',
    },
  },
  {
    id: 'garlic', name: { fr: 'Ail', en: 'Garlic' }, latin: 'Allium sativum', emoji: '🧄',
    family: 'amaryllidaceae', type: 'bulb', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 3, tOpt: [12, 24], pH: [6, 7.5], spacing: { row: 25, inRow: 10 },
    plantOut: [[10, 12], [2, 3]],
    daysToHarvest: [180, 240], season: 250,
    stages: [['vegetative', 0], ['bulking', 150]],
    kc: [0.7, 1.0, 0.7], rootDepth: 0.3, yieldM2: [0.6, 1.2], exports: { N: 6.0, P2O5: 2.0, K2O: 6.0 },
    feeding: 'light', returnYears: 4,
    note: {
      fr: 'Pas de fumure fraîche ; récolter quand les deux tiers des feuilles ont séché.',
      en: 'No fresh manure; lift when two thirds of the leaves have dried.',
    },
  },
  {
    id: 'leek', name: { fr: 'Poireau', en: 'Leek' }, latin: 'Allium porrum', emoji: '🥬',
    family: 'amaryllidaceae', type: 'leaf', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [13, 24], pH: [6.5, 7.5], spacing: { row: 35, inRow: 12 },
    sowIndoor: [[2, 4]], sowOutdoor: [[3, 5]], plantOut: [[5, 7]], transplantAfter: 70,
    daysToHarvest: [150, 240], season: 270,
    stages: [['germination', 0], ['vegetative', 20], ['bulking', 120]],
    kc: [0.7, 1.0, 1.0], rootDepth: 0.3, yieldM2: [2, 4], exports: { N: 3.5, P2O5: 1.2, K2O: 4.5 },
    feeding: 'heavy', returnYears: 4,
    note: {
      fr: 'Repiquer en raccourcissant racines et feuilles, au fond d’un trou de 15 cm ; butter pour blanchir.',
      en: 'Trim roots and leaves, drop into a 15 cm hole; earth up to blanch.',
    },
  },

  // --- Lamiacées, aromatiques ---------------------------------------------
  {
    id: 'basil', name: { fr: 'Basilic', en: 'Basil' }, latin: 'Ocimum basilicum', emoji: '🌿',
    family: 'lamiaceae', type: 'herb', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [20, 28], pH: [6, 7.5], spacing: { row: 30, inRow: 25 },
    sowIndoor: [[3, 5]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 35,
    daysToHarvest: [50, 70], season: 140,
    stages: [['germination', 0], ['vegetative', 10], ['harvest', 50]],
    kc: [0.6, 1.0, 0.9], rootDepth: 0.3, yieldM2: [0.5, 1], exports: { N: 4.0, P2O5: 1.5, K2O: 5.0 },
    feeding: 'medium', returnYears: 2,
    note: {
      fr: 'Pincer les fleurs pour prolonger la récolte ; souffre dès que la nuit passe sous 10 °C.',
      en: 'Pinch out flowers to prolong picking; suffers once nights drop below 10 °C.',
    },
  },

  // --- Petits fruits et vivaces --------------------------------------------
  {
    id: 'strawberry', name: { fr: 'Fraisier', en: 'Strawberry' }, latin: 'Fragaria × ananassa', emoji: '🍓',
    family: 'rosaceae', type: 'perennial', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 5, tOpt: [18, 25], pH: [5.5, 6.5], spacing: { row: 60, inRow: 30 },
    plantOut: [[8, 9], [3, 4]],
    daysToHarvest: [240, 300], season: 330,
    stages: [['vegetative', 0], ['flowering', 210], ['fruiting', 240]],
    kc: [0.4, 0.85, 0.75], rootDepth: 0.2, yieldM2: [0.5, 1], exports: { N: 4.0, P2O5: 2.0, K2O: 7.0 },
    feeding: 'medium', returnYears: 4,
    note: {
      fr: 'Pailler sous les fruits ; renouveler les plants tous les trois ou quatre ans.',
      en: 'Mulch under the fruit; renew the plants every three or four years.',
    },
  },
  {
    id: 'rhubarb', name: { fr: 'Rhubarbe', en: 'Rhubarb' }, latin: 'Rheum × hybridum', emoji: '🌿',
    family: 'polygonaceae', type: 'perennial', life: 'perennial', sun: 'partial', frost: 'hardy',
    tBase: 3, tOpt: [10, 22], pH: [6, 7], spacing: { row: 100, inRow: 100 },
    plantOut: [[10, 3]],
    daysToHarvest: [365, 400], season: 400,
    stages: [['vegetative', 0], ['harvest', 365]],
    kc: [0.5, 1.0, 0.9], rootDepth: 0.6, yieldM2: [2, 4], exports: { N: 3.0, P2O5: 1.0, K2O: 4.0 },
    feeding: 'heavy', returnYears: 8,
    note: {
      fr: 'Ne rien récolter la première année ; couper les hampes florales. Les feuilles ne se mangent pas.',
      en: 'Harvest nothing in the first year; cut off flower stalks. The leaves are not edible.',
    },
  },
  {
    id: 'sweetpotato', name: { fr: 'Patate douce', en: 'Sweet potato' }, latin: 'Ipomoea batatas', emoji: '🍠',
    family: 'convolvulaceae', type: 'root', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [24, 30], pH: [5.5, 6.5], spacing: { row: 80, inRow: 40 },
    plantOut: [[5, 6]],
    daysToHarvest: [120, 150], season: 150,
    stages: [['vegetative', 0], ['bulking', 60]],
    kc: [0.5, 1.15, 0.65], rootDepth: 0.6, yieldM2: [1.5, 3], exports: { N: 3.0, P2O5: 1.0, K2O: 6.0 },
    feeding: 'medium', returnYears: 3,
    note: {
      fr: 'Planter des boutures sur sol chaud ; récolter avant que le sol ne passe sous 10 °C.',
      en: 'Plant slips into warm soil; lift before the soil drops below 10 °C.',
    },
  },
  {
    id: 'beet', name: { fr: 'Betterave', en: 'Beetroot' }, latin: 'Beta vulgaris subsp. vulgaris', emoji: '🌱',
    family: 'amaranthaceae', type: 'root', life: 'biennial', sun: 'full', frost: 'half',
    tBase: 5, tOpt: [15, 22], pH: [6.5, 7.5], spacing: { row: 30, inRow: 10 },
    sowOutdoor: [[4, 6]],
    daysToHarvest: [70, 100], season: 120,
    stages: [['germination', 0], ['vegetative', 12], ['bulking', 45]],
    kc: [0.5, 1.05, 0.95], rootDepth: 0.6, yieldM2: [3, 5], exports: { N: 3.5, P2O5: 1.5, K2O: 6.5 },
    feeding: 'medium', returnYears: 3,
    note: {
      fr: 'Éclaircir tôt : chaque « graine » est un glomérule qui donne plusieurs plants.',
      en: 'Thin early: each “seed” is a cluster that gives several seedlings.',
    },
  },
  {
    id: 'chives', name: { fr: 'Ciboulette', en: 'Chives' }, latin: 'Allium schoenoprasum', emoji: '🌿',
    family: 'amaryllidaceae', type: 'herb', life: 'perennial', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [13, 24], pH: [6, 7.5], spacing: { row: 25, inRow: 20 },
    sowIndoor: [[3, 4]], sowOutdoor: [[4, 5]], plantOut: [[3, 5], [9, 10]], transplantAfter: 40,
    daysToHarvest: [60, 90], season: 220,
    stages: [['germination', 0], ['vegetative', 15], ['harvest', 60]],
    kc: [0.7, 1.0, 0.95], rootDepth: 0.3, yieldM2: [0.5, 1], exports: { N: 4.0, P2O5: 1.5, K2O: 4.5 },
    feeding: 'light', returnYears: 3,
    note: {
      fr: 'Couper ras régulièrement ; diviser les touffes tous les trois ans.',
      en: 'Cut down regularly; divide the clumps every three years.',
    },
  },
];

/** Tout le catalogue : potager, aromatiques (data/herbs.ts) puis fleurs (data/flowers.ts). */
export const SPECIES: Species[] = [...VEGETABLES, ...MORE_VEGETABLES, ...HERBS, ...ORCHARD, ...FLOWERS, ...COVERS];

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
