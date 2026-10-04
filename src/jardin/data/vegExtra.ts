/**
 * Légumes supplémentaires : feuilles asiatiques et salades d’hiver,
 * racines et tubercules oubliés ou andins, légumineuses à grains,
 * fruits d’ailleurs et quinoa.
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
  // --- Feuilles asiatiques et cressons ---------------------------------------------------
  {
    id: 'mizuna', name: T('Mizuna', 'Mizuna'), latin: 'Brassica rapa var. nipposinica', emoji: '🥬', family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [12, 20], pH: [6, 7.5], spacing: [25, 15], sowOutdoor: [[3, 5], [8, 9]],
    harvest: [25, 50], season: 80, stages: [['germination', 0], ['vegetative', 6], ['harvest', 25]], kc: [0.7, 1.0, 0.95], root: 0.3,
    yieldM2: [1.5, 3], exports: [3, 1.2, 4.5], feeding: 'medium', returnYears: 4, height: 30,
    note: T('Feuilles finement découpées au goût doux, en jeunes pousses dès 3-4 semaines ; coupée à 3 cm du sol, elle repousse plusieurs fois. Monte vite en jours longs : préférer les semis de fin d’été, qui tiennent sous abri tout l’hiver.', 'Finely cut, mild leaves, picked as baby leaf from 3–4 weeks; cut 3 cm above the soil, it regrows several times. Bolts quickly in long days: favour late-summer sowings, which last all winter under cover.'),
    seed: [5, 'insect', 500, 15, 'mostly', 'Même espèce que navet, pak-choï et chou chinois : ils se croisent tous.', 'Same species as turnip, pak choi and Chinese cabbage: they all cross.'],
  },
  {
    id: 'brownmustard', name: T('Moutarde brune à feuilles', 'Mustard greens'), latin: 'Brassica juncea', emoji: '🥬', family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [12, 20], pH: [6, 7.5], spacing: [30, 20], sowOutdoor: [[3, 4], [8, 9]],
    harvest: [30, 60], season: 90, stages: [['germination', 0], ['vegetative', 6], ['harvest', 30]], kc: [0.7, 1.0, 0.95], root: 0.4,
    yieldM2: [2, 3], exports: [3.5, 1.3, 4.5], feeding: 'medium', returnYears: 4, height: 50,
    note: T('Feuilles piquantes (vertes ou pourpres, comme « Red Giant »), crues jeunes ou cuites plus grandes. Très rustique, idéale en culture d’automne-hiver ; au printemps elle monte vite en graines. Bon engrais vert biofumigant.', 'Peppery leaves (green or purple, like ‘Red Giant’), raw when young or cooked when larger. Very hardy, ideal as an autumn–winter crop; in spring it bolts quickly. A good biofumigant green manure.'),
    seed: [5, 'insect', 500, 10, 'mostly', 'Siliques faciles à récolter sèches ; se croise peu avec les autres choux (espèce différente).', 'Pods are easy to gather dry; seldom crosses with other brassicas (a different species).'],
  },
  {
    id: 'tatsoi', name: T('Tatsoï', 'Tatsoi'), latin: 'Brassica rapa subsp. narinosa', emoji: '🥬', family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'hardy',
    tBase: 4, tOpt: [12, 20], pH: [6, 7.5], spacing: [30, 20], sowOutdoor: [[3, 4], [8, 9]],
    harvest: [30, 55], season: 80, stages: [['germination', 0], ['vegetative', 6], ['harvest', 30]], kc: [0.7, 1.0, 0.95], root: 0.3,
    yieldM2: [1.5, 2.5], exports: [3, 1.2, 4.5], feeding: 'medium', returnYears: 4, height: 15,
    note: T('Rosette plate de feuilles en cuillère vert sombre, au goût doux. Supporte −10 °C : parfait sous tunnel en hiver. Semé au printemps, il monte en graines dès les jours longs.', 'A flat rosette of dark green spoon-shaped leaves with a mild taste. Tolerates −10 °C: perfect in a winter tunnel. Sown in spring, it bolts as days lengthen.'),
    seed: [5, 'insect', 500, 20, 'mostly', 'Se croise avec navets, mizuna et pak-choï.', 'Crosses with turnips, mizuna and pak choi.'],
  },
  {
    id: 'gardencress', name: T('Cresson alénois', 'Garden cress'), latin: 'Lepidium sativum', emoji: '🌱', family: 'brassicaceae', type: 'leaf', life: 'annual', sun: 'partial', frost: 'half',
    tBase: 4, tOpt: [10, 20], pH: [6, 7.5], spacing: [15, 2], sowOutdoor: [[3, 5], [8, 10]],
    harvest: [12, 25], season: 35, stages: [['germination', 0], ['vegetative', 3], ['harvest', 12]], kc: [0.7, 1.0, 1.0], root: 0.15,
    yieldM2: [0.5, 1], exports: [4, 1.5, 5], feeding: 'light', returnYears: 2, height: 20,
    note: T('Le plus rapide du potager : on coupe aux ciseaux 10 à 15 jours après le semis. Semer dru tous les 10 jours ; monte en graines en été. Pousse aussi en barquette sur la fenêtre toute l’année.', 'The quickest crop in the garden: snip with scissors 10–15 days after sowing. Sow thickly every 10 days; bolts in summer. Also grows in a tray on the windowsill all year round.'),
    seed: [5, 'self', 10, 10, 'yes', 'Laisser monter quelques pieds au printemps ; graines en abondance en été.', 'Let a few plants bolt in spring; plenty of seed by summer.'],
  },
  {
    id: 'watercress', name: T('Cresson de fontaine', 'Watercress'), latin: 'Nasturtium officinale', emoji: '🌿', family: 'brassicaceae', type: 'leaf', life: 'perennial', sun: 'partial', frost: 'hardy',
    tBase: 5, tOpt: [10, 20], pH: [6.5, 7.5], spacing: [20, 15], sowIndoor: [[3, 4]], plantOut: [[4, 5], [8, 9]], transplantAfter: 30,
    harvest: [50, 200], season: 240, stages: [['germination', 0], ['vegetative', 7], ['harvest', 50]], kc: [1.0, 1.2, 1.1], root: 0.15,
    yieldM2: [1, 2], exports: [4, 1.5, 5], feeding: 'medium', returnYears: 2, height: 20,
    note: T('Exige une humidité constante : bac ou fossé inondé, eau fraîche et renouvelée, ou pot posé dans une soucoupe toujours pleine. Au sec, il durcit et monte aussitôt. Ne pas le cueillir dans les fossés sauvages pâturés (douve du foie).', 'Needs constant moisture: a flooded tub or ditch with fresh moving water, or a pot standing in a saucer that is always full. In dry soil it toughens and bolts at once. Never pick it from wild ditches near grazing land (liver fluke).'),
    seed: [4, 'insect', 200, 60, 'yes', 'Plus simple : bouturer des tiges du commerce dans un verre d’eau, elles s’enracinent en une semaine.', 'Easier: root shop-bought stems in a glass of water; they root within a week.'],
  },

  // --- Feuilles d’été ------------------------------------------------------------------
  {
    id: 'orach', name: T('Arroche', 'Orach'), latin: 'Atriplex hortensis', emoji: '🍃', family: 'amaranthaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'half',
    tBase: 5, tOpt: [15, 25], pH: [6, 8], spacing: [40, 30], sowOutdoor: [[3, 6]],
    harvest: [40, 90], season: 120, stages: [['germination', 0], ['vegetative', 8], ['harvest', 40], ['flowering', 90]], kc: [0.6, 1.0, 0.9], root: 0.5,
    yieldM2: [1.5, 3], exports: [4, 1.2, 6], feeding: 'medium', returnYears: 3, height: 150,
    note: T('L’« épinard géant » : verte, blonde ou pourpre, elle se cuisine comme l’épinard et tolère mieux la chaleur. Pincer la tête pour ramifier ; cueillir les jeunes feuilles avant la floraison.', 'The ‘giant spinach’: green, gold or purple, cooked like spinach and copes better with heat. Pinch the top to make it branch; pick young leaves before flowering.'),
    seed: [4, 'wind', 500, 30, 'mostly', 'Se ressème volontiers ; les couleurs se mélangent entre variétés voisines.', 'Readily self-seeds; colours mix between nearby varieties.'],
  },
  {
    id: 'leafamaranth', name: T('Amarante à feuilles', 'Leaf amaranth'), latin: 'Amaranthus tricolor', emoji: '🌿', family: 'amaranthaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [22, 32], pH: [6, 7.5], spacing: [30, 20], sowIndoor: [[4, 5]], sowOutdoor: [[5, 7]], plantOut: [[5, 6]], transplantAfter: 25,
    harvest: [35, 80], season: 110, stages: [['germination', 0], ['vegetative', 7], ['harvest', 35]], kc: [0.5, 1.0, 0.9], root: 0.5,
    yieldM2: [1.5, 3], exports: [5, 1.5, 6], feeding: 'medium', returnYears: 3, height: 60,
    note: T('Épinard tropical (callaloo, épinard de Chine) qui adore la chaleur et ne monte pas en graines l’été. Semer sur sol bien réchauffé ; couper les sommités tous les 15 jours, la plante ramifie.', 'A tropical spinach (callaloo, Chinese spinach) that loves heat and does not bolt in summer. Sow into well-warmed soil; cut the tips every fortnight and the plant branches out.'),
    seed: [5, 'wind', 500, 30, 'mostly', 'Graines minuscules et nombreuses : secouer les épis secs dans un sac.', 'Tiny seeds in huge numbers: shake dry heads in a bag.'],
  },
  {
    id: 'malabarspinach', name: T('Baselle', 'Malabar spinach'), latin: 'Basella alba', emoji: '🍃', family: 'basellaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 14, tOpt: [25, 32], pH: [6, 7.5], spacing: [80, 40], sowIndoor: [[4, 4]], plantOut: [[6, 6]], transplantAfter: 45,
    harvest: [80, 150], season: 160, stages: [['germination', 0], ['vegetative', 12], ['harvest', 80]], kc: [0.5, 1.05, 0.9], root: 0.5,
    yieldM2: [1.5, 3], exports: [4, 1.2, 6], feeding: 'medium', returnYears: 2, height: 200,
    note: T('Liane à feuilles charnues et mucilagineuses, cuites comme l’épinard. Très frileuse : semis au chaud (25 °C), plantation en juin au pied d’un treillage, idéalement en serre au nord de la Loire. Pincer les tiges pour récolter.', 'A vine with fleshy, mucilaginous leaves cooked like spinach. Very tender: sow in warmth (25 °C), plant out in June against a trellis, ideally in a greenhouse north of the Loire. Pinch stems to harvest.'),
    seed: [4, 'self', 10, 60, 'yes', 'Baies noires à écraser ; faire tremper les graines dures 24 h avant semis.', 'Squash the black berries; soak the hard seeds for 24 h before sowing.'],
  },
  {
    id: 'iceplant', name: T('Ficoïde glaciale', 'Ice plant'), latin: 'Mesembryanthemum crystallinum', emoji: '💧', family: 'aizoaceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [18, 28], pH: [6.5, 8], spacing: [50, 40], sowIndoor: [[4, 4]], plantOut: [[5, 6]], transplantAfter: 35,
    harvest: [60, 130], season: 140, stages: [['germination', 0], ['vegetative', 12], ['harvest', 60]], kc: [0.4, 0.8, 0.7], root: 0.3,
    yieldM2: [1, 2], exports: [2.5, 1, 5], feeding: 'light', returnYears: 2, height: 15,
    note: T('Feuilles charnues couvertes de perles cristallines, croquantes et légèrement salées, en salade. Rampante, elle aime le sol léger, sec et chaud, même salé. Graines très fines : semer en surface, sans couvrir.', 'Fleshy leaves covered in glistening beads, crunchy and slightly salty, eaten in salads. A trailing plant that likes light, dry, warm soil, even salty. Very fine seed: sow on the surface, uncovered.'),
    seed: [4, 'self', 10, 150, 'yes', 'Laisser sécher les capsules en fin d’été.', 'Let the capsules dry at the end of summer.'],
  },

  // --- Chicorées et laitue -------------------------------------------------------------
  {
    id: 'radicchio', name: T('Chicorée rouge (Vérone, Trévise)', 'Radicchio'), latin: 'Cichorium intybus var. foliosum', emoji: '🥬', family: 'asteraceae', type: 'leaf', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [12, 20], pH: [6, 7.5], spacing: [35, 30], sowIndoor: [[6, 7]], sowOutdoor: [[6, 7]], plantOut: [[7, 8]], transplantAfter: 30,
    harvest: [100, 150], season: 200, stages: [['germination', 0], ['vegetative', 10], ['harvest', 100]], kc: [0.7, 1.0, 0.95], root: 0.5,
    yieldM2: [1.5, 3], exports: [2.5, 1, 5], feeding: 'medium', returnYears: 3, height: 30,
    note: T('Semer en juin-juillet (trop tôt, elle monte) : les pommes rouges et amères se colorent avec les nuits fraîches d’automne. Rustique, récolte d’octobre à février ; la Trévise tardive se force aussi en cave comme l’endive.', 'Sow in June–July (too early and it bolts): the bitter red heads colour with cool autumn nights. Hardy, harvested October to February; late Treviso can also be forced in a cellar like chicory.'),
    seed: [5, 'insect', 500, 60, 'mostly', 'Bisannuelle : fleurs bleues l’été suivant ; se croise avec witloof et chicorées sauvages.', 'Biennial: blue flowers the next summer; crosses with witloof and wild chicory.'],
  },
  {
    id: 'witloof', name: T('Chicorée witloof (endive)', 'Belgian endive (witloof)'), latin: 'Cichorium intybus var. foliosum', emoji: '🥬', family: 'asteraceae', type: 'leaf', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [14, 22], pH: [6, 7.5], spacing: [30, 10], sowOutdoor: [[5, 6]],
    harvest: [180, 240], season: 260, stages: [['germination', 0], ['vegetative', 12], ['bulking', 90], ['harvest', 180]], kc: [0.6, 1.0, 0.8], root: 0.8,
    yieldM2: [1, 2], exports: [3, 1.2, 5], feeding: 'light', returnYears: 4, height: 50,
    note: T('Culture en deux temps. 1) Semer en mai-juin en sol profond, sans fumure fraîche : on obtient en octobre-novembre une grosse racine pivotante. 2) Arracher, couper les feuilles à 3 cm, laisser les racines au froid une à deux semaines, puis les planter serrées dans un bac de terre humide, à 15-18 °C dans le noir complet (cave, seau couvert) : les chicons blancs poussent en 3 à 4 semaines, de décembre à mars.', 'A two-phase crop. 1) Sow in May–June in deep soil without fresh manure: by October–November you get a large taproot. 2) Lift, cut leaves back to 3 cm, keep the roots cold for one to two weeks, then plant them close together in a tub of moist soil at 15–18 °C in complete darkness (cellar, covered bucket): white chicons grow in 3–4 weeks, from December to March.'),
    seed: [5, 'insect', 500, 50, 'mostly', 'Replanter une racine au printemps, elle fleurit l’été ; isoler des autres chicorées.', 'Replant one root in spring, it flowers in summer; isolate from other chicories.'],
  },
  {
    id: 'celtuce', name: T('Laitue asperge', 'Celtuce'), latin: 'Lactuca sativa var. augustana', emoji: '🥬', family: 'asteraceae', type: 'leaf', life: 'annual', sun: 'full', frost: 'half',
    tBase: 4, tOpt: [14, 22], pH: [6, 7.5], spacing: [40, 30], sowIndoor: [[3, 4]], sowOutdoor: [[4, 7]], plantOut: [[4, 8]], transplantAfter: 30,
    harvest: [70, 100], season: 110, stages: [['germination', 0], ['vegetative', 8], ['bulking', 50], ['harvest', 70]], kc: [0.7, 1.0, 0.95], root: 0.4,
    yieldM2: [1.5, 3], exports: [2, 0.8, 4.5], feeding: 'medium', returnYears: 2, height: 60,
    note: T('Laitue chinoise cultivée pour sa tige épaisse : on la pèle et on la mange crue ou sautée, au goût de cœur de laitue et de concombre. Récolter quand la tige atteint 3-4 cm de diamètre, avant la floraison. Arrosage régulier, sinon elle devient amère.', 'A Chinese lettuce grown for its thick stem: peel it and eat it raw or stir-fried; it tastes of lettuce heart and cucumber. Harvest when the stem is 3–4 cm across, before flowering. Water regularly or it turns bitter.'),
    seed: [4, 'self', 5, 40, 'yes', 'Autogame comme la laitue : graines plumeuses à cueillir sur les capitules secs.', 'Self-pollinated like lettuce: gather the feathery seed from dry heads.'],
  },

  // --- Racines et tubercules -----------------------------------------------------------
  {
    id: 'swede', name: T('Rutabaga', 'Swede (rutabaga)'), latin: 'Brassica napus var. napobrassica', emoji: '🥔', family: 'brassicaceae', type: 'root', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [12, 20], pH: [6, 7.5], spacing: [40, 25], sowOutdoor: [[5, 7]],
    harvest: [100, 150], season: 200, stages: [['germination', 0], ['vegetative', 8], ['bulking', 60], ['harvest', 100]], kc: [0.6, 1.0, 0.9], root: 0.6,
    yieldM2: [3, 5], exports: [2, 0.8, 3.5], feeding: 'medium', returnYears: 4, height: 40,
    note: T('Plus gros, plus sucré et plus rustique que le navet, à chair jaune. Semer en mai-juin, récolter d’octobre à la fin de l’hiver : il supporte les gelées en place. Aime la fraîcheur ; altises au semis.', 'Larger, sweeter and hardier than turnip, with yellow flesh. Sow in May–June, harvest from October to late winter: it stands frost in the ground. Likes cool conditions; watch for flea beetles at sowing.'),
    seed: [5, 'insect', 500, 15, 'mostly', 'Bisannuel ; se croise avec colza et chou-navet, pas avec le navet.', 'Biennial; crosses with oilseed rape, not with turnip.'],
  },
  {
    id: 'rootparsley', name: T('Persil tubéreux', 'Root parsley'), latin: 'Petroselinum crispum var. tuberosum', emoji: '🥕', family: 'apiaceae', type: 'root', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 4, tOpt: [14, 22], pH: [6, 7.5], spacing: [30, 10], sowOutdoor: [[3, 5]],
    harvest: [150, 210], season: 270, stages: [['germination', 0], ['vegetative', 20], ['bulking', 90], ['harvest', 150]], kc: [0.6, 1.0, 0.9], root: 0.5,
    yieldM2: [1.5, 2.5], exports: [3, 1.2, 5], feeding: 'light', returnYears: 4, height: 40,
    note: T('Racine blanche au goût de céleri et de panais, et feuilles utilisables comme le persil plat. Germination lente (3-4 semaines) : semer en place en sol meuble, sans fumure fraîche. Récolte d’octobre à mars, il reste en terre.', 'A white root tasting of celery and parsnip, with leaves usable like flat parsley. Slow germination (3–4 weeks): sow in place in loose soil without fresh manure. Harvest October to March; it can stay in the ground.'),
    seed: [2, 'insect', 500, 30, 'mostly', 'Se croise avec le persil feuille ; graines à semer dans les deux ans.', 'Crosses with leaf parsley; sow seed within two years.'],
  },
  {
    id: 'skirret', name: T('Chervis', 'Skirret'), latin: 'Sium sisarum', emoji: '🥕', family: 'apiaceae', type: 'root', life: 'perennial', sun: 'partial', frost: 'hardy',
    tBase: 5, tOpt: [14, 22], pH: [6, 7.5], spacing: [40, 30], sowIndoor: [[3, 3]], sowOutdoor: [[4, 4]], plantOut: [[3, 4]], transplantAfter: 50,
    harvest: [200, 240], season: 270, stages: [['germination', 0], ['vegetative', 20], ['bulking', 120], ['harvest', 200]], kc: [0.6, 1.05, 0.9], root: 0.5,
    yieldM2: [0.8, 1.5], exports: [3, 1.2, 5], feeding: 'medium', returnYears: 4, height: 100,
    note: T('Légume oublié vivace : une touffe de fines racines blanches et sucrées, récoltées d’octobre à mars. Aime un sol frais et humide. Plus simple à partir d’éclats de souche plantés au printemps qu’en semis (graines vite périmées).', 'A forgotten perennial vegetable: a clump of thin, sweet white roots, harvested October to March. Likes cool, moist soil. Easier from crown divisions planted in spring than from seed (which loses viability quickly).'),
    seed: [1, 'vegetative', 0, 40, 'mostly', 'Diviser la touffe à la récolte et replanter le collet avec quelques racines.', 'Divide the clump at harvest and replant the crown with a few roots.'],
  },
  {
    id: 'whitesalsify', name: T('Salsifis blanc', 'Salsify'), latin: 'Tragopogon porrifolius', emoji: '🥕', family: 'asteraceae', type: 'root', life: 'biennial', sun: 'full', frost: 'hardy',
    tBase: 5, tOpt: [15, 22], pH: [6, 7.5], spacing: [30, 10], sowOutdoor: [[3, 5]],
    harvest: [150, 270], season: 300, stages: [['germination', 0], ['vegetative', 15], ['bulking', 90], ['harvest', 150]], kc: [0.5, 1.0, 0.9], root: 0.6,
    yieldM2: [1, 1.5], exports: [3, 1.5, 5], feeding: 'light', returnYears: 4, height: 50,
    note: T('Racine fine et blanchâtre au goût d’huître, plus courte que la scorsonère : sol profond, meuble, sans cailloux ni fumure fraîche. Récolter d’octobre à mars ; les jeunes pousses de printemps se mangent aussi. Belles fleurs violettes la 2e année.', 'A slim, whitish root with an oyster-like taste, shorter than black salsify: deep, loose soil with no stones or fresh manure. Harvest October to March; young spring shoots are edible too. Pretty purple flowers in the 2nd year.'),
    seed: [2, 'self', 50, 30, 'yes', 'Akènes à aigrette (comme le pissenlit) à cueillir avant qu’ils s’envolent ; semer frais.', 'Plumed seeds (like dandelion) to gather before they blow away; sow fresh.'],
  },
  {
    id: 'crosne', name: T('Crosne du Japon', 'Chinese artichoke'), latin: 'Stachys affinis', emoji: '🥔', family: 'lamiaceae', type: 'root', life: 'perennial', sun: 'partial', frost: 'hardy',
    tBase: 6, tOpt: [15, 24], pH: [6, 7.5], spacing: [40, 30], plantOut: [[3, 4]],
    harvest: [210, 270], season: 300, stages: [['vegetative', 0], ['bulking', 120], ['harvest', 210]], kc: [0.5, 1.05, 0.8], root: 0.3,
    yieldM2: [0.5, 1], exports: [3, 1.2, 5], feeding: 'medium', returnYears: 3, height: 40,
    note: T('Petits tubercules annelés et nacrés, croquants, au goût d’artichaut. Planter en mars-avril, arroser l’été ; récolter de novembre à mars au fur et à mesure, car ils se dessèchent vite hors du sol. Envahissant : chaque tubercule oublié repousse.', 'Small, ringed, pearly tubers, crunchy, tasting of artichoke. Plant in March–April, water in summer; dig as needed from November to March, as they dry out fast once lifted. Invasive: every forgotten tuber regrows.'),
    seed: [0, 'vegetative', 0, 30, 'no', 'Ne fleurit presque jamais : replanter quelques tubercules bien fermes.', 'Rarely flowers: replant a few firm tubers.'],
  },
  {
    id: 'oca', name: T('Oca du Pérou', 'Oca'), latin: 'Oxalis tuberosa', emoji: '🥔', family: 'oxalidaceae', type: 'root', life: 'perennial', sun: 'full', frost: 'tender',
    tBase: 6, tOpt: [12, 20], pH: [5.5, 7], spacing: [60, 40], sowIndoor: [[3, 4]], plantOut: [[5, 5]], transplantAfter: 40,
    harvest: [200, 240], season: 240, stages: [['vegetative', 0], ['bulking', 150], ['harvest', 200]], kc: [0.5, 1.0, 0.9], root: 0.4,
    yieldM2: [0.8, 1.5], exports: [3, 1.2, 5], feeding: 'medium', returnYears: 3, height: 40,
    note: T('Tubercules colorés, acidulés crus, sucrés après quelques jours au soleil. Ils ne se forment qu’en jours courts, à partir d’octobre : protéger le feuillage des premières gelées (voile) et attendre que les fanes meurent, en novembre, pour récolter.', 'Colourful tubers, tangy raw and sweeter after a few days in the sun. They only form in short days, from October: protect the foliage from the first frosts (fleece) and wait until the tops die back, in November, to harvest.'),
    seed: [0, 'vegetative', 0, 20, 'no', 'Garder les tubercules au frais et au sec, les démarrer en godets en mars-avril.', 'Store tubers cool and dry; start them in pots in March–April.'],
  },
  {
    id: 'yacon', name: T('Yacon', 'Yacon'), latin: 'Smallanthus sonchifolius', emoji: '🍠', family: 'asteraceae', type: 'root', life: 'perennial', sun: 'full', frost: 'tender',
    tBase: 8, tOpt: [15, 25], pH: [6, 7.5], spacing: [100, 70], sowIndoor: [[3, 4]], plantOut: [[5, 5]], transplantAfter: 45,
    harvest: [180, 210], season: 210, stages: [['vegetative', 0], ['bulking', 120], ['harvest', 180]], kc: [0.5, 1.1, 0.8], root: 0.6,
    yieldM2: [2, 4], exports: [2, 0.8, 4], feeding: 'heavy', returnYears: 3, height: 180,
    note: T('Grandes racines croquantes et sucrées (inuline), à manger crues comme une poire. Elles grossissent surtout à l’automne, quand les jours raccourcissent : récolter après les premières gelées qui noircissent le feuillage, sans casser les racines fragiles. Laisser mûrir quelques jours au soleil.', 'Large, crisp, sweet roots (inulin), eaten raw like a pear. They swell mainly in autumn as days shorten: harvest after the first frosts blacken the foliage, without breaking the brittle roots. Let them cure a few days in the sun.'),
    seed: [0, 'vegetative', 0, 8, 'no', 'Garder la souche (les rhizomes rougeâtres, pas les racines de réserve) hors gel, à diviser au printemps.', 'Keep the crown (the reddish rhizomes, not the storage roots) frost-free and divide it in spring.'],
  },

  // --- Légumineuses et graines ---------------------------------------------------------
  {
    id: 'peanut', name: T('Arachide', 'Peanut'), latin: 'Arachis hypogaea', emoji: '🥜', family: 'fabaceae', type: 'legume', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 13, tOpt: [25, 32], pH: [5.8, 7], spacing: [50, 25], sowIndoor: [[4, 4]], sowOutdoor: [[5, 6]], plantOut: [[5, 6]], transplantAfter: 30,
    harvest: [130, 160], season: 160, stages: [['germination', 0], ['vegetative', 10], ['flowering', 45], ['fruiting', 60], ['harvest', 130]], kc: [0.4, 1.05, 0.6], root: 0.6,
    yieldM2: [0.1, 0.25], exports: [30, 6, 8], feeding: 'improver', returnYears: 4, height: 40,
    note: T('Plante de chaleur : sol sableux et chaud, plein soleil, au mieux sous tunnel au nord de la Loire. Après la floraison, les gynophores s’enfoncent dans le sol : biner léger et butter, ne pas pailler épais. Arracher quand le feuillage jaunit et faire sécher les gousses.', 'A heat lover: warm sandy soil, full sun, best under a tunnel north of the Loire. After flowering, the pegs push into the soil: hoe lightly and earth up, do not mulch thickly. Lift when foliage yellows and dry the pods.'),
    seed: [1, 'self', 5, 15, 'yes', 'Garder des gousses crues non grillées, décortiquer juste avant le semis.', 'Keep raw, unroasted pods; shell just before sowing.'],
  },
  {
    id: 'soybean', name: T('Soja (edamame)', 'Soybean (edamame)'), latin: 'Glycine max', emoji: '🫛', family: 'fabaceae', type: 'legume', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [20, 30], pH: [6, 7.5], spacing: [45, 10], sowOutdoor: [[5, 6]],
    harvest: [85, 130], season: 140, stages: [['germination', 0], ['vegetative', 8], ['flowering', 50], ['fruiting', 65], ['harvest', 85]], kc: [0.4, 1.1, 0.5], root: 0.7,
    yieldM2: [0.4, 0.8], exports: [10, 3, 8], feeding: 'improver', returnYears: 4, height: 70,
    note: T('En edamame, cueillir les gousses bien pleines mais encore vertes, à cuire à l’eau salée ; en grains secs, attendre que la plante perde ses feuilles. Choisir des variétés précoces adaptées au nord. Semer sur sol réchauffé (> 12 °C).', 'For edamame, pick pods that are plump but still green, boiled in salted water; for dry beans, wait until the plant drops its leaves. Choose early varieties suited to the north. Sow into warm soil (> 12 °C).'),
    seed: [2, 'self', 5, 10, 'yes', 'Autogame : laisser sécher quelques plantes sur pied.', 'Self-pollinated: let a few plants dry standing.'],
  },
  {
    id: 'lentil', name: T('Lentille', 'Lentil'), latin: 'Lens culinaris', emoji: '🫘', family: 'fabaceae', type: 'legume', life: 'annual', sun: 'full', frost: 'half',
    tBase: 4, tOpt: [15, 25], pH: [6, 8], spacing: [30, 5], sowOutdoor: [[3, 4]],
    harvest: [100, 130], season: 130, stages: [['germination', 0], ['vegetative', 12], ['flowering', 60], ['harvest', 100]], kc: [0.4, 1.0, 0.3], root: 0.6,
    yieldM2: [0.1, 0.2], exports: [40, 9, 10], feeding: 'improver', returnYears: 4, height: 40,
    note: T('Légumineuse rustique de sol pauvre et sec, semée en mars-avril. Rendement modeste au jardin : prévoir une bonne surface. Arracher les plantes quand les gousses brunissent, faire sécher à l’abri puis battre et trier.', 'A hardy pulse for poor dry soil, sown in March–April. Modest yields in a garden: plan a good area. Pull plants when the pods turn brown, dry under cover, then thresh and winnow.'),
    seed: [4, 'self', 5, 6, 'yes', 'Autogame : garder une partie de la récolte comme semence.', 'Self-pollinated: keep part of the harvest as seed.'],
  },
  {
    id: 'quinoa', name: T('Quinoa', 'Quinoa'), latin: 'Chenopodium quinoa', emoji: '🌾', family: 'amaranthaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'half',
    tBase: 5, tOpt: [15, 25], pH: [6, 8], spacing: [50, 20], sowOutdoor: [[4, 5]],
    harvest: [120, 160], season: 160, stages: [['germination', 0], ['vegetative', 10], ['flowering', 70], ['fruiting', 90], ['harvest', 120]], kc: [0.4, 1.0, 0.6], root: 0.8,
    yieldM2: [0.1, 0.25], exports: [20, 7, 8], feeding: 'medium', returnYears: 3, height: 150,
    note: T('Cultivé pour ses graines (et ses jeunes feuilles, comme l’épinard). Craint les fortes chaleurs à la floraison : semer tôt en avril. Récolter les panicules sèches en septembre, battre puis rincer longuement les graines pour enlever la saponine amère.', 'Grown for its seeds (and young leaves, used like spinach). Dislikes strong heat at flowering: sow early, in April. Harvest dry panicles in September, thresh, then rinse the seeds well to remove the bitter saponin.'),
    seed: [3, 'self', 50, 10, 'mostly', 'Surtout autogame ; se croise avec le chénopode blanc sauvage.', 'Mostly self-pollinated; crosses with wild fat hen.'],
  },

  // --- Fruits ----------------------------------------------------------------------------
  {
    id: 'tomatillo', name: T('Tomatillo', 'Tomatillo'), latin: 'Physalis philadelphica', emoji: '🟢', family: 'solanaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 10, tOpt: [20, 28], pH: [6, 7.5], spacing: [100, 80], sowIndoor: [[3, 4]], plantOut: [[5, 6]], transplantAfter: 45,
    harvest: [110, 180], season: 200, stages: [['germination', 0], ['vegetative', 15], ['flowering', 60], ['fruiting', 75], ['harvest', 110]], kc: [0.6, 1.05, 0.85], root: 0.6,
    yieldM2: [1.5, 3], exports: [2, 0.8, 3.5], feeding: 'medium', returnYears: 4, height: 100,
    note: T('Base de la salsa verde : fruits verts ou violets dans une lanterne, à cueillir quand ils la remplissent. Autostérile : planter au moins deux pieds. Culture de la tomate (même famille, rotation), plante étalée à tuteurer.', 'The base of salsa verde: green or purple fruit in a husk, picked when they fill it. Self-incompatible: grow at least two plants. Grown like tomato (same family, rotation); a sprawling plant to stake.'),
    seed: [5, 'insect', 300, 30, 'mostly', 'Écraser les fruits mûrs, laver et sécher les graines.', 'Mash ripe fruit, wash and dry the seeds.'],
  },
  {
    id: 'cucamelon', name: T('Concombre à confire (mélothrie)', 'Cucamelon'), latin: 'Melothria scabra', emoji: '🥒', family: 'cucurbitaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 12, tOpt: [20, 28], pH: [6, 7.5], spacing: [80, 40], sowIndoor: [[4, 4]], plantOut: [[5, 6]], transplantAfter: 30,
    harvest: [90, 150], season: 160, stages: [['germination', 0], ['vegetative', 10], ['flowering', 55], ['fruiting', 65], ['harvest', 90]], kc: [0.5, 1.0, 0.8], root: 0.5,
    yieldM2: [0.5, 1], exports: [1.5, 0.8, 2.5], feeding: 'medium', returnYears: 3, height: 250,
    note: T('Minuscules fruits rayés comme des pastèques, au goût de concombre citronné, à croquer ou à confire au vinaigre. Liane fine et vigoureuse sur filet. Racine tubéreuse qu’on peut rentrer hors gel pour la replanter au printemps.', 'Tiny fruits striped like watermelons, tasting of lemony cucumber, eaten raw or pickled. A fine, vigorous vine for netting. Its tuberous root can be lifted and stored frost-free for replanting in spring.'),
    seed: [4, 'insect', 300, 200, 'yes', 'Laisser jaunir quelques fruits sur la plante, extraire et rincer les graines.', 'Let a few fruits turn yellow on the vine; extract and rinse the seeds.'],
  },
  {
    id: 'luffa', name: T('Luffa (éponge végétale)', 'Luffa'), latin: 'Luffa aegyptiaca', emoji: '🧽', family: 'cucurbitaceae', type: 'fruit', life: 'annual', sun: 'full', frost: 'tender',
    tBase: 15, tOpt: [25, 32], pH: [6, 7.5], spacing: [150, 80], sowIndoor: [[4, 4]], plantOut: [[6, 6]], transplantAfter: 30,
    harvest: [90, 180], season: 180, stages: [['germination', 0], ['vegetative', 10], ['flowering', 60], ['fruiting', 70], ['harvest', 90]], kc: [0.5, 1.05, 0.8], root: 0.6,
    yieldM2: [1, 2], exports: [2, 0.8, 3], feeding: 'heavy', returnYears: 3, height: 400,
    note: T('Jeunes fruits (15 cm) cuisinés comme la courgette, ou fruits mûrs séchés pour faire des éponges. Très longue saison chaude : en serre au nord, sur une structure solide. Faire tremper les graines 24 h avant de semer à 25 °C.', 'Young fruits (15 cm) cooked like courgette, or mature fruits dried to make sponges. Needs a very long hot season: greenhouse in the north, on a sturdy frame. Soak seeds 24 h before sowing at 25 °C.'),
    seed: [5, 'insect', 500, 60, 'mostly', 'Les graines tombent toutes seules du fruit sec qu’on épluche pour l’éponge.', 'Seeds fall out of the dry fruit when you peel it for the sponge.'],
  },
];

const BUILT = DEFS.map(veg);
export const EXTRA_VEGETABLES: Species[] = BUILT.map((b) => b.species);
export const EXTRA_VEG_EXTRA: Record<string, SpeciesExtra> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.extra]));
export const EXTRA_VEG_HEIGHT: Record<string, number> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.height]));
