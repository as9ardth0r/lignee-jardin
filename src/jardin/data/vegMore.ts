/**
 * Légumes complémentaires : vivaces du potager (artichaut, asperge,
 * oseille, raifort, topinambour), légumes oubliés ou d'ailleurs, et
 * quelques légumineuses de plus.
 *
 * Mêmes conventions et sources que species.ts (catalogues des semenciers,
 * CTIFL, guides de fertilisation) : ordres de grandeur, calendrier
 * « région parisienne » décalé selon le climat.
 */
import type { Family, Feeding, Frost, MonthRange, Species, SpeciesExtra, StageId, Sun, Txt, CropType } from '../model';

const T = (fr: string, en: string): Txt => ({ fr, en });

interface Def {
  id: string;
  name: Txt;
  latin: string;
  emoji: string;
  family: Family;
  type: CropType;
  life: Species['life'];
  sun: Sun;
  frost: Frost;
  tBase: number;
  tOpt: [number, number];
  pH: [number, number];
  spacing: [number, number];
  sowIndoor?: MonthRange[];
  sowOutdoor?: MonthRange[];
  plantOut?: MonthRange[];
  transplantAfter?: number;
  harvest: [number, number];
  season: number;
  stages: Array<[StageId, number]>;
  kc: [number, number, number];
  root: number;
  yieldM2: [number, number];
  exports: [number, number, number];
  feeding: Feeding;
  returnYears: number;
  height: number;
  note: Txt;
  /** Graines : durée, fécondation, isolement (m), prix (€/kg), fidélité, conseil. */
  seed: [number, SpeciesExtra['pollination'], number, number, NonNullable<SpeciesExtra['trueToSeed']>, string, string];
}

function veg(d: Def): { species: Species; extra: SpeciesExtra; height: number } {
  const [seedLife, pollination, isolation, priceKg, trueToSeed, fr, en] = d.seed;
  return {
    species: {
      id: d.id,
      name: d.name,
      latin: d.latin,
      emoji: d.emoji,
      family: d.family,
      type: d.type,
      life: d.life,
      sun: d.sun,
      frost: d.frost,
      tBase: d.tBase,
      tOpt: d.tOpt,
      pH: d.pH,
      spacing: { row: d.spacing[0], inRow: d.spacing[1] },
      sowIndoor: d.sowIndoor,
      sowOutdoor: d.sowOutdoor,
      plantOut: d.plantOut,
      transplantAfter: d.transplantAfter,
      daysToHarvest: d.harvest,
      season: d.season,
      stages: d.stages,
      kc: d.kc,
      rootDepth: d.root,
      yieldM2: d.yieldM2,
      exports: { N: d.exports[0], P2O5: d.exports[1], K2O: d.exports[2] },
      feeding: d.feeding,
      returnYears: d.returnYears,
      note: d.note,
    },
    extra: { seedLife, pollination, isolation, priceKg, trueToSeed, seedTip: { fr, en } },
    height: d.height,
  };
}

const DEFS: Def[] = [
  // --- Vivaces du potager ---------------------------------------------------------------
  {
    id: 'artichoke', name: T('Artichaut', 'Globe artichoke'), latin: 'Cynara cardunculus var. scolymus', emoji: '🌱', family: 'asteraceae', type: 'perennial', life: 'perennial', sun: 'full', frost: 'half',
    tBase: 7, tOpt: [15, 24], pH: [6.5, 7.5], spacing: [100, 90], plantOut: [[4, 5]],
    harvest: [100, 160], season: 200, stages: [['vegetative', 0], ['flowering', 90], ['harvest', 100]], kc: [0.5, 1.0, 0.9], root: 0.8,
    yieldM2: [0.8, 1.5], exports: [5, 2, 6], feeding: 'heavy', returnYears: 4, height: 120,
    note: T('Planter des œilletons au printemps ; récolte dès l’été suivant (un peu dès la première année). Butter et pailler l’hiver au nord de la Loire. Renouveler la planche tous les 3-4 ans.', 'Plant offsets in spring; harvest from the next summer (a few the first year). Earth up and mulch in winter north of the Loire. Renew the bed every 3–4 years.'),
    seed: [6, 'insect', 1000, 12, 'no', 'Les semis donnent des plantes très variables : on multiplie par œilletons (rejets) prélevés au printemps.', 'Seedlings are very variable: propagate by offsets taken in spring.'],
  },
  {
    id: 'cardoon', name: T('Cardon', 'Cardoon'), latin: 'Cynara cardunculus', emoji: '🌿', family: 'asteraceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'half',
    tBase: 7, tOpt: [15, 24], pH: [6.5, 7.5], spacing: [120, 100], sowIndoor: [[4, 4]], sowOutdoor: [[5, 5]], plantOut: [[5, 6]], transplantAfter: 40,
    harvest: [150, 210], season: 220, stages: [['germination', 0], ['vegetative', 15], ['harvest', 150]], kc: [0.5, 1.0, 0.9], root: 0.8,
    yieldM2: [2, 4], exports: [3, 1, 5], feeding: 'heavy', returnYears: 4, height: 150,
    note: T('On mange les côtes des feuilles, blanchies 3 semaines (feuilles liées et entourées de carton) avant la récolte d’automne. Le cardon de Tours est épineux, le Plein blanc inerme ne l’est pas.', 'The leaf ribs are eaten, blanched for 3 weeks (leaves tied and wrapped in cardboard) before the autumn harvest. Tours cardoon is spiny, Plein Blanc Inerme is not.'),
    seed: [6, 'insect', 1000, 8, 'mostly', 'Laisser fleurir un pied : se croise avec l’artichaut.', 'Let one plant flower: it crosses with artichoke.'],
  },
  {
    id: 'asparagus', name: T('Asperge', 'Asparagus'), latin: 'Asparagus officinalis', emoji: '🌱', family: 'asparagaceae', type: 'perennial', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 10, tOpt: [15, 25], pH: [6.5, 7.5], spacing: [150, 40], plantOut: [[3, 4]],
    harvest: [740, 790], season: 800, stages: [['vegetative', 0], ['harvest', 740]], kc: [0.5, 0.95, 0.5], root: 1,
    yieldM2: [0.3, 0.6], exports: [8, 3, 8], feeding: 'medium', returnYears: 10, height: 150,
    note: T('Planter les griffes en sol léger et profond ; ne rien récolter les deux premières années, puis 6 à 8 semaines d’avril à mi-juin. La planche dure 10 à 15 ans. Pour l’asperge blanche, butter de 25 cm.', 'Plant crowns in light deep soil; harvest nothing for two years, then 6–8 weeks from April to mid-June. The bed lasts 10–15 years. For white asparagus, earth up 25 cm.'),
    seed: [3, 'insect', 1000, 15, 'no', 'Pieds mâles et femelles ; les variétés mâles (plus productives) ne font pas de baies. On achète des griffes d’un an.', 'Male and female plants; all-male varieties (more productive) set no berries. Buy one-year crowns.'],
  },
  {
    id: 'sorrel', name: T('Oseille', 'Sorrel'), latin: 'Rumex acetosa', emoji: '🍃', family: 'polygonaceae', type: 'perennial', life: 'perennial', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [12, 22], pH: [5.5, 7], spacing: [40, 30], sowOutdoor: [[3, 5]], plantOut: [[3, 4], [9, 10]],
    harvest: [60, 240], season: 260, stages: [['germination', 0], ['vegetative', 12], ['harvest', 60]], kc: [0.6, 1.0, 0.9], root: 0.4,
    yieldM2: [1, 2], exports: [4, 1.5, 5], feeding: 'medium', returnYears: 4, height: 40,
    note: T('Vivace qui donne des feuilles acidulées de mars à novembre. Couper les hampes florales. Riche en acide oxalique : avec modération.', 'Perennial giving sharp leaves from March to November. Cut off flower stalks. High in oxalic acid: in moderation.'),
    seed: [3, 'wind', 500, 20, 'mostly', 'Pieds mâles et femelles ; diviser plutôt les touffes tous les 3-4 ans.', 'Male and female plants; better divide clumps every 3–4 years.'],
  },
  {
    id: 'horseradish', name: T('Raifort', 'Horseradish'), latin: 'Armoracia rusticana', emoji: '🥕', family: 'brassicaceae', type: 'root', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 5, tOpt: [12, 22], pH: [6, 7.5], spacing: [60, 40], plantOut: [[3, 4]],
    harvest: [200, 260], season: 280, stages: [['vegetative', 0], ['bulking', 120], ['harvest', 200]], kc: [0.5, 0.95, 0.8], root: 0.8,
    yieldM2: [1, 2], exports: [4, 1.5, 6], feeding: 'medium', returnYears: 3, height: 70,
    note: T('Planter des bouts de racine ; récolter à l’automne. Envahissant : le moindre fragment repousse, cultiver dans un coin à part ou en bac.', 'Plant root pieces; harvest in autumn. Invasive: the smallest piece regrows, grow in a separate corner or tub.'),
    seed: [0, 'vegetative', 0, 15, 'no', 'Graines rarement fertiles : un tronçon de racine de 15 cm planté en mars suffit.', 'Seed is rarely fertile: a 15 cm root piece planted in March is enough.'],
  },
  {
    id: 'jerusalemartichoke', name: T('Topinambour', 'Jerusalem artichoke'), latin: 'Helianthus tuberosus', emoji: '🥔', family: 'asteraceae', type: 'root', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 6, tOpt: [18, 26], pH: [5.5, 7.5], spacing: [80, 40], plantOut: [[3, 4]],
    harvest: [210, 330], season: 340, stages: [['vegetative', 0], ['bulking', 120], ['harvest', 210]], kc: [0.4, 1.05, 0.8], root: 1,
    yieldM2: [2, 4], exports: [3, 1.5, 6], feeding: 'light', returnYears: 4, height: 250,
    note: T('Increvable et envahissant : chaque tubercule oublié repousse. Grandes tiges en brise-vent, fleurs de tournesol à l’automne. Récolter au fur et à mesure en hiver, les tubercules se gardent mal hors du sol.', 'Indestructible and invasive: every forgotten tuber regrows. Tall stems as a windbreak, sunflower blooms in autumn. Dig as needed in winter, tubers keep poorly out of the ground.'),
    seed: [0, 'vegetative', 0, 4, 'no', 'Replanter quelques tubercules (ceux qu’on oublie suffisent souvent).', 'Replant a few tubers (the forgotten ones are often enough).'],
  },

  // --- Feuilles, côtes -------------------------------------------------------------------
  {
    id: 'celery', name: T('Céleri branche', 'Celery'), latin: 'Apium graveolens var. dulce', emoji: '🥬', family: 'apiaceae', type: 'leaf', life: 'biennial', sun: 'full', frost: 'half',
    tBase: 7, tOpt: [15, 22], pH: [6, 7.5], spacing: [40, 30], sowIndoor: [[3, 4]], plantOut: [[5, 6]], transplantAfter: 60,
    harvest: [140, 190], season: 210, stages: [['germination', 0], ['vegetative', 20], ['harvest', 140]], kc: [0.7, 1.05, 1.0], root: 0.4,
    yieldM2: [3, 5], exports: [3, 1.5, 6], feeding: 'heavy', returnYears: 4, height: 50,
    note: T('Gourmand en eau et en azote : sol riche, arrosage régulier, sinon les côtes deviennent creuses et filandreuses. Semis lent (3 semaines) à la lumière.', 'Hungry for water and nitrogen: rich soil, regular watering, or stalks turn hollow and stringy. Slow germination (3 weeks) in light.'),
    seed: [5, 'insect', 500, 3, 'mostly', 'Bisannuel : laisser un pied passer l’hiver, il fleurit l’été suivant ; se croise avec le céleri-rave.', 'Biennial: overwinter one plant, it flowers the next summer; crosses with celeriac.'],
  },
  {
    id: 'chinesecabbage', name: T('Chou chinois', 'Chinese cabbage'), latin: 'Brassica rapa subsp. pekinensis', emoji: '🥬', family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'half',
    tBase: 5, tOpt: [13, 20], pH: [6.5, 7.5], spacing: [45, 35], sowOutdoor: [[7, 8]], sowIndoor: [[7, 7]], plantOut: [[8, 8]], transplantAfter: 25,
    harvest: [60, 90], season: 100, stages: [['germination', 0], ['vegetative', 8], ['bulking', 40], ['harvest', 60]], kc: [0.7, 1.05, 0.95], root: 0.4,
    yieldM2: [3, 5], exports: [3, 1.2, 4.5], feeding: 'heavy', returnYears: 4, height: 40,
    note: T('Semer après le 14 juillet : semé au printemps il monte en graines (jours longs). Altises et limaces : voile et surveillance.', 'Sow after mid-July: sown in spring it bolts (long days). Flea beetles and slugs: fleece and vigilance.'),
    seed: [5, 'insect', 500, 3, 'mostly', 'Se croise avec navets et pak-choï (même espèce).', 'Crosses with turnips and pak choi (same species).'],
  },
  {
    id: 'pakchoi', name: T('Pak-choï', 'Pak choi'), latin: 'Brassica rapa subsp. chinensis', emoji: '🥬', family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'half',
    tBase: 5, tOpt: [13, 20], pH: [6.5, 7.5], spacing: [30, 20], sowOutdoor: [[4, 5], [8, 9]],
    harvest: [40, 60], season: 70, stages: [['germination', 0], ['vegetative', 8], ['harvest', 40]], kc: [0.7, 1.0, 0.95], root: 0.3,
    yieldM2: [2, 3], exports: [3, 1.2, 4.5], feeding: 'medium', returnYears: 4, height: 30,
    note: T('Très rapide, idéal en fin d’été ou en culture d’automne sous abri. Récolter jeune, entier ou feuille à feuille.', 'Very quick, ideal in late summer or autumn under cover. Pick young, whole or leaf by leaf.'),
    seed: [5, 'insect', 500, 3, 'mostly', 'Se croise avec navets et choux chinois.', 'Crosses with turnips and Chinese cabbage.'],
  },
  {
    id: 'purslane', name: T('Pourpier potager', 'Purslane'), latin: 'Portulaca oleracea', emoji: '🌿', family: 'portulacaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [22, 30], pH: [6, 7.5], spacing: [25, 15], sowOutdoor: [[5, 7]],
    harvest: [35, 90], season: 100, stages: [['germination', 0], ['vegetative', 7], ['harvest', 35]], kc: [0.5, 0.9, 0.85], root: 0.2,
    yieldM2: [1, 2], exports: [3, 1, 5], feeding: 'light', returnYears: 2, height: 25,
    note: T('Salade d’été charnue et croquante, riche en oméga-3. Semer à la volée sur sol chaud ; couper au-dessus des premières feuilles, il repousse.', 'A fleshy, crunchy summer salad rich in omega-3. Broadcast on warm soil; cut above the lowest leaves, it regrows.'),
    seed: [5, 'self', 5, 30, 'yes', 'Se ressème seul (parfois trop).', 'Self-seeds (sometimes too much).'],
  },
  {
    id: 'nzspinach', name: T('Tétragone', 'New Zealand spinach'), latin: 'Tetragonia tetragonioides', emoji: '🍃', family: 'aizoaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [18, 28], pH: [6, 7.5], spacing: [80, 60], sowIndoor: [[4, 4]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 30,
    harvest: [60, 170], season: 180, stages: [['germination', 0], ['vegetative', 15], ['harvest', 60]], kc: [0.5, 1.0, 0.9], root: 0.4,
    yieldM2: [2, 4], exports: [3, 1.2, 5], feeding: 'medium', returnYears: 2, height: 30,
    note: T('L’« épinard d’été » qui ne monte pas en graines par la chaleur. Faire tremper les graines 24 h. Cueillir les extrémités des tiges toute la saison.', 'The “summer spinach” that does not bolt in heat. Soak seeds 24 h. Pick shoot tips all season.'),
    seed: [5, 'self', 5, 20, 'yes', 'Se ressème souvent ; graines dures en capsules.', 'Often self-seeds; hard seeds in capsules.'],
  },
  {
    id: 'dandelion', name: T('Pissenlit cultivé', 'Dandelion'), latin: 'Taraxacum officinale', emoji: '🌼', family: 'asteraceae', type: 'leaf', life: 'perennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [12, 22], pH: [5.5, 7.5], spacing: [30, 20], sowOutdoor: [[4, 6]],
    harvest: [240, 300], season: 320, stages: [['germination', 0], ['vegetative', 12], ['harvest', 240]], kc: [0.5, 0.9, 0.8], root: 0.6,
    yieldM2: [1, 2], exports: [3, 1, 5], feeding: 'light', returnYears: 3, height: 25,
    note: T('Semé au printemps, récolté en salade au printemps suivant, blanchi sous un pot renversé pour l’adoucir. Fleurs précieuses pour les abeilles.', 'Sown in spring, picked as salad the next spring, blanched under an upturned pot to soften it. Flowers precious for bees.'),
    seed: [2, 'insect', 0, 15, 'yes', 'Graines formées sans fécondation : fidèles. Couper les fleurs pour éviter qu’il envahisse.', 'Seeds form without fertilisation: true to type. Cut flowers to stop it spreading.'],
  },

  // --- Fruits, racines -------------------------------------------------------------------
  {
    id: 'physalis', name: T('Physalis', 'Cape gooseberry'), latin: 'Physalis peruviana', emoji: '🏮', family: 'solanaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [20, 28], pH: [6, 7.5], spacing: [100, 80], sowIndoor: [[3, 3]], plantOut: [[5, 6]], transplantAfter: 60,
    harvest: [140, 210], season: 220, stages: [['germination', 0], ['vegetative', 15], ['flowering', 90], ['fruiting', 110], ['harvest', 140]], kc: [0.6, 1.05, 0.85], root: 0.6,
    yieldM2: [0.5, 1], exports: [2, 0.8, 3.5], feeding: 'medium', returnYears: 4, height: 100,
    note: T('Comme une tomate : semis chaud en mars, plantation après les gelées. Fruits dans leur lanterne, à cueillir quand elle sèche. Même famille que la tomate (rotation). Feuilles et fruits verts toxiques.', 'Like a tomato: warm sowing in March, planting after frost. Fruit in a papery lantern, pick when it dries. Same family as tomato (rotation). Leaves and green fruit are toxic.'),
    seed: [5, 'self', 10, 15, 'yes', 'Écraser quelques fruits mûrs, faire sécher les graines.', 'Squash a few ripe fruits, dry the seeds.'],
  },
  {
    id: 'okra', name: T('Gombo', 'Okra'), latin: 'Abelmoschus esculentus', emoji: '🫑', family: 'malvaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 15, tOpt: [24, 32], pH: [6, 7.5], spacing: [70, 40], sowIndoor: [[4, 4]], plantOut: [[6, 6]], transplantAfter: 40,
    harvest: [90, 150], season: 160, stages: [['germination', 0], ['vegetative', 12], ['flowering', 70], ['harvest', 90]], kc: [0.35, 1.0, 0.9], root: 0.6,
    yieldM2: [0.6, 1.2], exports: [4, 1.5, 4.5], feeding: 'medium', returnYears: 3, height: 120,
    note: T('Plante de chaleur : en serre au nord, en pleine terre dans le Sud. Cueillir les gousses tous les 2 jours, à 8-10 cm, avant qu’elles durcissent.', 'A heat lover: greenhouse in the north, outdoors in the south. Pick pods every 2 days at 8–10 cm, before they toughen.'),
    seed: [4, 'insect', 300, 15, 'mostly', 'Laisser sécher quelques gousses sur pied.', 'Let a few pods dry on the plant.'],
  },
  {
    id: 'salsify', name: T('Scorsonère (salsifis noir)', 'Black salsify'), latin: 'Scorzonera hispanica', emoji: '🥕', family: 'asteraceae', type: 'root', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 5, tOpt: [15, 22], pH: [6, 7.5], spacing: [30, 10], sowOutdoor: [[3, 5]],
    harvest: [180, 300], season: 320, stages: [['germination', 0], ['vegetative', 15], ['bulking', 100], ['harvest', 180]], kc: [0.5, 1.0, 0.9], root: 0.6,
    yieldM2: [1, 2], exports: [3, 1.5, 5], feeding: 'light', returnYears: 4, height: 60,
    note: T('Longue racine noire à chair blanche : sol profond et meuble, sans fumure fraîche. Récolter à partir d’octobre, à la fourche-bêche, sans casser les racines.', 'Long black root with white flesh: deep loose soil, no fresh manure. Lift from October with a fork, without breaking the roots.'),
    seed: [2, 'insect', 300, 8, 'mostly', 'Les graines se forment la 2e année ; à semer fraîches.', 'Seeds form in the 2nd year; sow them fresh.'],
  },

  // --- Légumineuses -----------------------------------------------------------------------
  {
    id: 'runnerbean', name: T('Haricot d’Espagne', 'Runner bean'), latin: 'Phaseolus coccineus', emoji: '🫘', family: 'fabaceae', type: 'legume', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [18, 26], pH: [6, 7.5], spacing: [80, 20], sowOutdoor: [[5, 6]],
    harvest: [80, 140], season: 150, stages: [['germination', 0], ['vegetative', 10], ['flowering', 60], ['harvest', 80]], kc: [0.4, 1.05, 0.9], root: 0.6,
    yieldM2: [1.5, 3], exports: [6, 2, 6], feeding: 'improver', returnYears: 3, height: 300,
    note: T('Grimpant à fleurs rouges, mellifère et décoratif ; supporte mieux la fraîcheur que le haricot commun mais coule (avorte) par forte chaleur sèche. Gousses jeunes ou grains secs.', 'Climbing with red flowers, loved by bees and decorative; copes better with cool weather than common bean but drops flowers in hot dry spells. Young pods or dry beans.'),
    seed: [3, 'insect', 300, 8, 'mostly', 'Pollinisé par les bourdons, il se croise entre variétés : isoler ou ensacher quelques fleurs.', 'Pollinated by bumblebees, it crosses between varieties: isolate or bag some flowers.'],
  },
  {
    id: 'chickpea', name: T('Pois chiche', 'Chickpea'), latin: 'Cicer arietinum', emoji: '🫘', family: 'fabaceae', type: 'legume', life: 'annual', sun: 'full', frost: 'half',
    tBase: 5, tOpt: [18, 28], pH: [6, 8], spacing: [40, 10], sowOutdoor: [[3, 4]],
    harvest: [110, 140], season: 150, stages: [['germination', 0], ['vegetative', 12], ['flowering', 70], ['harvest', 110]], kc: [0.4, 1.0, 0.35], root: 0.8,
    yieldM2: [0.15, 0.3], exports: [35, 8, 12], feeding: 'improver', returnYears: 4, height: 50,
    note: T('Légumineuse de sol sec et chaud, résiste bien à la sécheresse. Récolter les plantes quand elles jaunissent, finir de sécher à l’abri, battre.', 'A pulse for dry warm soil, drought tolerant. Pull plants when they yellow, finish drying under cover, thresh.'),
    seed: [4, 'self', 5, 5, 'yes', 'Autogame : garder les plus beaux grains.', 'Self-pollinated: keep the best seeds.'],
  },
];

const BUILT = DEFS.map(veg);
export const MORE_VEGETABLES: Species[] = BUILT.map((b) => b.species);
export const MORE_VEG_EXTRA: Record<string, SpeciesExtra> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.extra]));
export const MORE_VEG_HEIGHT: Record<string, number> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.height]));
