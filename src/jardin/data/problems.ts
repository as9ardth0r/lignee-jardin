/**
 * Base de diagnostic : symptômes, problèmes (carences, maladies, ravageurs,
 * accidents) et moyens d'action autorisés aux jardiniers amateurs.
 *
 * Un diagnostic par symptômes reste une HYPOTHÈSE : carences, maladies et
 * accidents climatiques se ressemblent. Le moteur classe les causes
 * plausibles et dit ce qui colle ou non ; à confirmer à l'œil (loupe,
 * dessous des feuilles, racines).
 *
 * Moyens d'action : en France, depuis le 1er janvier 2019 (loi Labbé), un
 * amateur ne peut utiliser que des produits de biocontrôle, à faible
 * risque, utilisables en agriculture biologique (UAB) ou des préparations
 * naturelles peu préoccupantes (PNPP). Méthodes non chimiques d'abord.
 * Les délais avant récolte dépendent de chaque produit commercial : lire
 * l'étiquette (ou E-Phy).
 */
import type { Family, Txt } from '../model';

export type Organ = 'leaves' | 'fruits' | 'stems' | 'roots' | 'seedlings' | 'whole';
export const ORGANS: Organ[] = ['leaves', 'fruits', 'stems', 'roots', 'seedlings', 'whole'];

export type Sign =
  | 'yellowOld'
  | 'yellowYoung'
  | 'interveinal'
  | 'purple'
  | 'edgeBurn'
  | 'spotsBrown'
  | 'concentric'
  | 'oilySpots'
  | 'whitePowder'
  | 'greyFuzz'
  | 'rustPustules'
  | 'holes'
  | 'smallHoles'
  | 'slime'
  | 'mines'
  | 'aphids'
  | 'whiteFlies'
  | 'webbing'
  | 'stippled'
  | 'caterpillars'
  | 'beetles'
  | 'curl'
  | 'sticky'
  | 'wilt'
  | 'wiltHot'
  | 'blossomEndRot'
  | 'fruitCrack'
  | 'fruitRot'
  | 'rootTunnels'
  | 'rootGalls'
  | 'collapse'
  | 'stunted'
  | 'scorch'
  | 'frostBlack';

export const SIGNS: Sign[] = [
  'yellowOld', 'yellowYoung', 'interveinal', 'purple', 'edgeBurn', 'spotsBrown', 'concentric', 'oilySpots', 'whitePowder', 'greyFuzz', 'rustPustules',
  'holes', 'smallHoles', 'slime', 'mines', 'aphids', 'whiteFlies', 'webbing', 'stippled', 'caterpillars', 'beetles', 'curl', 'sticky',
  'wilt', 'wiltHot', 'blossomEndRot', 'fruitCrack', 'fruitRot', 'rootTunnels', 'rootGalls', 'collapse', 'stunted', 'scorch', 'frostBlack',
];

export type Context = 'humid' | 'hot' | 'dry' | 'cold' | 'greenhouse';
export const CONTEXTS: Context[] = ['humid', 'hot', 'dry', 'cold', 'greenhouse'];

export type RemedyCategory = 'cultural' | 'barrier' | 'macro' | 'biocontrol' | 'lowRisk' | 'organic' | 'pnpp';

export interface Remedy {
  id: string;
  name: Txt;
  category: RemedyCategory;
  /** Un produit (avec étiquette, dose et délai avant récolte) ou une méthode. */
  isProduct: boolean;
  note: Txt;
}

export const REMEDIES: Remedy[] = [
  { id: 'netting', name: { fr: 'Voile ou filet anti-insectes', en: 'Insect mesh or fleece' }, category: 'barrier', isProduct: false, note: { fr: 'Poser dès le semis ou la plantation, bords enterrés.', en: 'Put on at sowing or planting, edges buried.' } },
  { id: 'handpick', name: { fr: 'Ramassage à la main', en: 'Hand-picking' }, category: 'cultural', isProduct: false, note: { fr: 'Le soir ou tôt le matin ; écraser les pontes.', en: 'Evening or early morning; crush the eggs.' } },
  { id: 'remove', name: { fr: 'Retirer les parties atteintes', en: 'Remove affected parts' }, category: 'cultural', isProduct: false, note: { fr: 'Les sortir du jardin (pas au compost) et désinfecter le sécateur.', en: 'Take them out of the garden (not to compost) and clean the pruners.' } },
  { id: 'airflow', name: { fr: 'Aérer et arroser au pied', en: 'Improve airflow, water at the base' }, category: 'cultural', isProduct: false, note: { fr: 'Espacer, effeuiller le bas, arroser le matin sans mouiller le feuillage.', en: 'Space out, strip lower leaves, water in the morning without wetting leaves.' } },
  { id: 'regularWater', name: { fr: 'Arrosage régulier et paillage', en: 'Steady watering and mulch' }, category: 'cultural', isProduct: false, note: { fr: 'Éviter l’alternance sécheresse / gros arrosage ; voir le bilan hydrique.', en: 'Avoid drought followed by heavy watering; see the water balance.' } },
  { id: 'rotation', name: { fr: 'Rotation longue', en: 'Long rotation' }, category: 'cultural', isProduct: false, note: { fr: 'Ne pas remettre la même famille sur la planche avant plusieurs années.', en: 'Keep the same family off the bed for several years.' } },
  { id: 'shade', name: { fr: 'Ombrage et arrosage du matin', en: 'Shade cloth, morning watering' }, category: 'cultural', isProduct: false, note: { fr: 'Voile d’ombrage aux heures chaudes, paillage épais.', en: 'Shade cloth in the hottest hours, thick mulch.' } },
  { id: 'fleece', name: { fr: 'Voile d’hivernage la nuit', en: 'Frost fleece at night' }, category: 'barrier', isProduct: false, note: { fr: 'Gagne 2 à 4 °C ; le retirer le jour.', en: 'Gains 2–4 °C; take it off by day.' } },
  { id: 'ladybirds', name: { fr: 'Auxiliaires : coccinelles, chrysopes, syrphes', en: 'Beneficials: ladybirds, lacewings, hoverflies' }, category: 'macro', isProduct: false, note: { fr: 'Les favoriser (fleurs, pas d’insecticide) ou lâcher des larves.', en: 'Encourage them (flowers, no insecticide) or release larvae.' } },
  { id: 'encarsia', name: { fr: 'Encarsia formosa (serre)', en: 'Encarsia formosa (greenhouse)' }, category: 'macro', isProduct: false, note: { fr: 'Petite guêpe parasite des aleurodes, efficace au-dessus de 18 °C.', en: 'Tiny wasp parasitising whitefly, effective above 18 °C.' } },
  { id: 'phytoseiulus', name: { fr: 'Phytoseiulus persimilis (serre)', en: 'Phytoseiulus persimilis (greenhouse)' }, category: 'macro', isProduct: false, note: { fr: 'Acarien prédateur des acariens tisserands ; humidité élevée.', en: 'Predatory mite for spider mites; needs humidity.' } },
  { id: 'slugNematodes', name: { fr: 'Nématodes Phasmarhabditis', en: 'Phasmarhabditis nematodes' }, category: 'biocontrol', isProduct: true, note: { fr: 'Arrosés sur sol humide au-dessus de 5 °C ; action en une à deux semaines.', en: 'Watered onto moist soil above 5 °C; works within one or two weeks.' } },
  { id: 'ferricPhosphate', name: { fr: 'Phosphate ferrique', en: 'Ferric phosphate' }, category: 'lowRisk', isProduct: true, note: { fr: 'Granulés anti-limaces utilisables en bio ; épandre clair, pas en tas.', en: 'Organic-approved slug pellets; scatter thinly, not in heaps.' } },
  { id: 'bt', name: { fr: 'Bacillus thuringiensis', en: 'Bacillus thuringiensis' }, category: 'biocontrol', isProduct: true, note: { fr: 'Contre les jeunes chenilles ; sans effet sur les autres insectes. À renouveler après la pluie.', en: 'Against young caterpillars; harmless to other insects. Reapply after rain.' } },
  { id: 'soap', name: { fr: 'Savon noir ou savon potassique insecticide', en: 'Insecticidal potassium soap' }, category: 'biocontrol', isProduct: true, note: { fr: 'Agit par contact sur pucerons et aleurodes ; viser les colonies, épargner les auxiliaires.', en: 'Contact action on aphids and whitefly; target colonies, spare beneficials.' } },
  { id: 'sulfur', name: { fr: 'Soufre mouillable', en: 'Wettable sulphur' }, category: 'organic', isProduct: true, note: { fr: 'Préventif contre l’oïdium ; jamais au-dessus de 28–30 °C (brûlures).', en: 'Preventive against powdery mildew; never above 28–30 °C (scorch).' } },
  { id: 'bicarbonate', name: { fr: 'Bicarbonate de potassium', en: 'Potassium bicarbonate' }, category: 'biocontrol', isProduct: true, note: { fr: 'Contre l’oïdium, dès les premières taches.', en: 'Against powdery mildew, at the first spots.' } },
  { id: 'copper', name: { fr: 'Bouillie bordelaise (cuivre)', en: 'Bordeaux mixture (copper)' }, category: 'organic', isProduct: true, note: { fr: 'Préventive, avant les pluies ; le cuivre s’accumule dans le sol : petites doses, pas systématiquement.', en: 'Preventive, before rain; copper builds up in soil: small doses, not routinely.' } },
  { id: 'horsetail', name: { fr: 'Décoction de prêle', en: 'Horsetail decoction' }, category: 'pnpp', isProduct: true, note: { fr: 'Préparation naturelle, préventive, à l’efficacité limitée.', en: 'Natural preparation, preventive, of limited effect.' } },
  { id: 'traps', name: { fr: 'Pièges englués jaunes ou bleus', en: 'Yellow or blue sticky traps' }, category: 'barrier', isProduct: false, note: { fr: 'Surtout pour repérer et compter (aleurodes, thrips) ; piègent aussi des auxiliaires.', en: 'Mainly for spotting and counting (whitefly, thrips); also catch beneficials.' } },
  { id: 'lime', name: { fr: 'Chaulage (pH au-dessus de 7,2)', en: 'Liming (pH above 7.2)' }, category: 'cultural', isProduct: false, note: { fr: 'Freine la hernie ; mesurer le pH avant.', en: 'Slows clubroot; measure pH first.' } },
  { id: 'feed', name: { fr: 'Apport d’engrais adapté', en: 'Suitable fertiliser' }, category: 'cultural', isProduct: false, note: { fr: 'Voir la fiche Nutrition de la culture pour la dose.', en: 'See the crop’s Nutrition panel for the dose.' } },
];

export const REMEDY_BY_ID: Record<string, Remedy> = Object.fromEntries(REMEDIES.map((r) => [r.id, r]));

export type ProblemKind = 'deficiency' | 'disease' | 'pest' | 'abiotic';

export interface Problem {
  id: string;
  kind: ProblemKind;
  name: Txt;
  /** Familles concernées ; vide = toutes. */
  hosts: Family[];
  organs: Organ[];
  /** Poids de chaque signe (3–4 : caractéristique, 1–2 : compatible). */
  signs: Partial<Record<Sign, number>>;
  context?: Partial<Record<Context, number>>;
  /** À vérifier pour confirmer. */
  check: Txt;
  /** Seuil d'intervention (lutte intégrée), si pertinent. */
  threshold?: Txt;
  remedies: string[];
}

const all: Family[] = [];

export const PROBLEMS: Problem[] = [
  {
    id: 'nDef', kind: 'deficiency', hosts: all, organs: ['leaves', 'whole'],
    name: { fr: 'Manque d’azote', en: 'Nitrogen deficiency' },
    signs: { yellowOld: 4, stunted: 2 }, context: { cold: 1 },
    check: { fr: 'Jaunissement uniforme qui part des vieilles feuilles du bas ; plante pâle et peu vigoureuse. Sol froid ou détrempé aggrave.', en: 'Even yellowing starting on the old lower leaves; pale, weak plant. Cold or waterlogged soil makes it worse.' },
    remedies: ['feed'],
  },
  {
    id: 'kDef', kind: 'deficiency', hosts: all, organs: ['leaves', 'fruits'],
    name: { fr: 'Manque de potasse', en: 'Potassium deficiency' },
    signs: { edgeBurn: 4, yellowOld: 1 },
    check: { fr: 'Bords des vieilles feuilles jaunis puis brûlés ; fruits qui mûrissent mal (collet vert de la tomate).', en: 'Edges of old leaves yellow then scorched; fruit ripening unevenly (green shoulders on tomato).' },
    remedies: ['feed'],
  },
  {
    id: 'mgDef', kind: 'deficiency', hosts: all, organs: ['leaves'],
    name: { fr: 'Manque de magnésium', en: 'Magnesium deficiency' },
    signs: { interveinal: 4, yellowOld: 2 },
    check: { fr: 'Jaunissement ENTRE les nervures, qui restent vertes, sur les feuilles âgées. Fréquent en sol acide ou après beaucoup de potasse.', en: 'Yellowing BETWEEN green veins on older leaves. Common on acid soil or after heavy potash.' },
    remedies: ['feed'],
  },
  {
    id: 'feDef', kind: 'deficiency', hosts: all, organs: ['leaves'],
    name: { fr: 'Chlorose ferrique', en: 'Iron chlorosis' },
    signs: { interveinal: 3, yellowYoung: 4 },
    check: { fr: 'Jaunissement entre les nervures sur les JEUNES feuilles du haut ; typique des sols calcaires (pH au-dessus de 7,5) ou détrempés.', en: 'Interveinal yellowing on YOUNG top leaves; typical of chalky (pH above 7.5) or waterlogged soils.' },
    remedies: ['feed'],
  },
  {
    id: 'pDef', kind: 'deficiency', hosts: all, organs: ['leaves', 'whole'],
    name: { fr: 'Manque de phosphore (ou sol froid)', en: 'Phosphorus deficiency (or cold soil)' },
    signs: { purple: 4, stunted: 2 }, context: { cold: 2 },
    check: { fr: 'Feuilles violacées dessous, croissance lente ; souvent passager au printemps quand le sol est froid.', en: 'Purplish leaf undersides, slow growth; often temporary in spring when the soil is cold.' },
    remedies: ['feed'],
  },
  {
    id: 'ber', kind: 'abiotic', hosts: ['solanaceae', 'cucurbitaceae'], organs: ['fruits'],
    name: { fr: 'Nécrose apicale (cul noir)', en: 'Blossom-end rot' },
    signs: { blossomEndRot: 5 }, context: { dry: 1, hot: 1 },
    check: { fr: 'Tache noire et sèche au bout du fruit, à l’opposé du pédoncule. Manque de calcium dans le fruit, presque toujours dû à un arrosage irrégulier, rarement au sol.', en: 'Dark dry patch at the fruit tip, opposite the stalk. Calcium shortage in the fruit, nearly always from irregular watering, rarely the soil.' },
    remedies: ['regularWater'],
  },
  {
    id: 'lateBlight', kind: 'disease', hosts: ['solanaceae'], organs: ['leaves', 'fruits', 'stems'],
    name: { fr: 'Mildiou (tomate, pomme de terre)', en: 'Late blight (tomato, potato)' },
    signs: { oilySpots: 4, spotsBrown: 2, fruitRot: 2, collapse: 1 }, context: { humid: 3 },
    check: { fr: 'Taches huileuses qui brunissent vite, duvet blanc dessous par temps humide ; fruits marbrés de brun. Explose après plusieurs jours doux et pluvieux.', en: 'Oily patches that brown fast, white down underneath in damp weather; fruit marbled brown. Explodes after several mild, wet days.' },
    remedies: ['remove', 'airflow', 'copper', 'horsetail'],
  },
  {
    id: 'downyMildew', kind: 'disease', hosts: ['cucurbitaceae', 'asteraceae', 'amaryllidaceae', 'brassicaceae', 'amaranthaceae'], organs: ['leaves'],
    name: { fr: 'Mildiou des feuilles (cucurbitacées, salades, oignons)', en: 'Downy mildew (cucurbits, salads, onions)' },
    signs: { oilySpots: 3, spotsBrown: 1, yellowOld: 1, greyFuzz: 1 }, context: { humid: 3 },
    check: { fr: 'Taches jaunes anguleuses limitées par les nervures, feutrage gris-violet dessous.', en: 'Angular yellow patches bounded by veins, grey-purple fuzz underneath.' },
    remedies: ['remove', 'airflow', 'copper'],
  },
  {
    id: 'powderyMildew', kind: 'disease', hosts: ['cucurbitaceae', 'fabaceae', 'solanaceae', 'apiaceae', 'lamiaceae', 'rosaceae', 'brassicaceae'], organs: ['leaves', 'stems'],
    name: { fr: 'Oïdium (blanc)', en: 'Powdery mildew' },
    signs: { whitePowder: 5, yellowOld: 1 }, context: { dry: 1, hot: 1 },
    check: { fr: 'Poudre blanche farineuse qui s’essuie au doigt, surtout sur le dessus des feuilles. Aime les journées sèches et les nuits fraîches.', en: 'White floury powder that wipes off, mostly on leaf tops. Likes dry days and cool nights.' },
    remedies: ['airflow', 'bicarbonate', 'sulfur'],
  },
  {
    id: 'botrytis', kind: 'disease', hosts: all, organs: ['fruits', 'stems', 'leaves'],
    name: { fr: 'Pourriture grise (botrytis)', en: 'Grey mould (botrytis)' },
    signs: { greyFuzz: 5, fruitRot: 2, collapse: 1 }, context: { humid: 2, greenhouse: 1 },
    check: { fr: 'Feutrage gris qui libère un nuage de spores quand on le touche ; part souvent d’une blessure ou d’une fleur fanée.', en: 'Grey fuzz releasing a cloud of spores when touched; often starts from a wound or a dead flower.' },
    remedies: ['remove', 'airflow'],
  },
  {
    id: 'alternaria', kind: 'disease', hosts: ['solanaceae', 'apiaceae', 'brassicaceae'], organs: ['leaves', 'fruits'],
    name: { fr: 'Alternariose', en: 'Alternaria (early blight)' },
    signs: { concentric: 5, spotsBrown: 2, yellowOld: 1 }, context: { hot: 1, humid: 1 },
    check: { fr: 'Taches brunes à cercles concentriques (en cible), d’abord sur les vieilles feuilles.', en: 'Brown spots with concentric rings (target-like), first on old leaves.' },
    remedies: ['remove', 'rotation', 'copper'],
  },
  {
    id: 'rust', kind: 'disease', hosts: ['amaryllidaceae', 'fabaceae'], organs: ['leaves'],
    name: { fr: 'Rouille (poireau, ail, haricot)', en: 'Rust (leek, garlic, bean)' },
    signs: { rustPustules: 5 }, context: { humid: 1 },
    check: { fr: 'Petites pustules orange qui laissent une poudre rousse sur le doigt.', en: 'Small orange pustules leaving a rusty powder on your finger.' },
    remedies: ['remove', 'rotation', 'airflow'],
  },
  {
    id: 'dampingOff', kind: 'disease', hosts: all, organs: ['seedlings', 'stems'],
    name: { fr: 'Fonte des semis', en: 'Damping off' },
    signs: { collapse: 4, wilt: 1 }, context: { humid: 2, cold: 1 },
    check: { fr: 'Les plantules s’affaissent d’un coup, tige étranglée et brune au ras du sol.', en: 'Seedlings suddenly flop over, stem pinched and brown at soil level.' },
    remedies: ['airflow', 'remove'],
  },
  {
    id: 'aphids', kind: 'pest', hosts: all, organs: ['leaves', 'stems', 'whole'],
    name: { fr: 'Pucerons', en: 'Aphids' },
    signs: { aphids: 5, curl: 2, sticky: 2 },
    check: { fr: 'Colonies d’insectes mous (verts, noirs, gris) sous les feuilles et au bout des pousses ; fourmis qui montent et descendent.', en: 'Colonies of soft insects (green, black, grey) under leaves and on shoot tips; ants going up and down.' },
    threshold: { fr: 'Tolérer tant que coccinelles, syrphes ou momies de pucerons sont présents ; intervenir si plus d’un tiers des pousses sont colonisées.', en: 'Tolerate while ladybirds, hoverflies or aphid mummies are present; act if more than a third of shoots are colonised.' },
    remedies: ['ladybirds', 'soap'],
  },
  {
    id: 'whitefly', kind: 'pest', hosts: ['solanaceae', 'cucurbitaceae', 'brassicaceae'], organs: ['leaves'],
    name: { fr: 'Aleurodes (mouches blanches)', en: 'Whitefly' },
    signs: { whiteFlies: 5, sticky: 2, yellowOld: 1 }, context: { greenhouse: 2, hot: 1 },
    check: { fr: 'Nuage de minuscules mouches blanches quand on secoue la plante ; miellat collant et fumagine noire.', en: 'A cloud of tiny white flies when the plant is shaken; sticky honeydew and black sooty mould.' },
    threshold: { fr: 'Compter sur un piège jaune : intervenir quand les captures augmentent nettement d’une semaine à l’autre.', en: 'Count on a yellow trap: act when catches rise clearly week on week.' },
    remedies: ['traps', 'encarsia', 'soap'],
  },
  {
    id: 'spiderMites', kind: 'pest', hosts: ['cucurbitaceae', 'solanaceae', 'fabaceae', 'rosaceae'], organs: ['leaves'],
    name: { fr: 'Acariens (araignées rouges)', en: 'Spider mites' },
    signs: { webbing: 5, stippled: 3, yellowOld: 1 }, context: { hot: 2, dry: 2, greenhouse: 1 },
    check: { fr: 'Feuilles finement piquetées de jaune, fines toiles dessous ; à la loupe, minuscules points mobiles.', en: 'Leaves finely speckled yellow, fine webs underneath; under a lens, tiny moving dots.' },
    remedies: ['phytoseiulus', 'regularWater', 'sulfur'],
  },
  {
    id: 'thrips', kind: 'pest', hosts: ['amaryllidaceae', 'solanaceae', 'cucurbitaceae', 'fabaceae'], organs: ['leaves'],
    name: { fr: 'Thrips', en: 'Thrips' },
    signs: { stippled: 4, curl: 1 }, context: { hot: 1, dry: 2 },
    check: { fr: 'Plages argentées ponctuées de petits points noirs (déjections) ; insectes allongés minuscules.', en: 'Silvery patches dotted with tiny black specks (droppings); minute elongated insects.' },
    remedies: ['traps', 'regularWater', 'ladybirds'],
  },
  {
    id: 'fleaBeetle', kind: 'pest', hosts: ['brassicaceae'], organs: ['leaves', 'seedlings'],
    name: { fr: 'Altises', en: 'Flea beetles' },
    signs: { smallHoles: 5 }, context: { dry: 2, hot: 1 },
    check: { fr: 'Feuilles criblées de petits trous ronds ; minuscules coléoptères qui sautent quand on approche.', en: 'Leaves peppered with small round holes; tiny beetles that jump when approached.' },
    remedies: ['netting', 'regularWater'],
  },
  {
    id: 'slugs', kind: 'pest', hosts: all, organs: ['leaves', 'seedlings', 'fruits'],
    name: { fr: 'Limaces et escargots', en: 'Slugs and snails' },
    signs: { slime: 5, holes: 2, collapse: 1 }, context: { humid: 2 },
    check: { fr: 'Grandes morsures irrégulières, traces de bave brillante ; dégâts de nuit, surtout après la pluie.', en: 'Large ragged bites, shiny slime trails; night damage, especially after rain.' },
    remedies: ['handpick', 'slugNematodes', 'ferricPhosphate'],
  },
  {
    id: 'caterpillars', kind: 'pest', hosts: all, organs: ['leaves', 'fruits'],
    name: { fr: 'Chenilles (piéride, noctuelles)', en: 'Caterpillars (cabbage white, cutworms)' },
    signs: { caterpillars: 5, holes: 3 },
    check: { fr: 'Feuilles dévorées, excréments verts ; chenilles sous les feuilles ou au collet le soir.', en: 'Leaves eaten, green droppings; caterpillars under leaves or at the base in the evening.' },
    threshold: { fr: 'Chou : intervenir dès les premières jeunes chenilles, avant qu’elles n’entrent dans la pomme.', en: 'Cabbage: act at the first young caterpillars, before they enter the head.' },
    remedies: ['netting', 'handpick', 'bt'],
  },
  {
    id: 'coloradoBeetle', kind: 'pest', hosts: ['solanaceae'], organs: ['leaves'],
    name: { fr: 'Doryphore', en: 'Colorado potato beetle' },
    signs: { beetles: 5, holes: 3 },
    check: { fr: 'Coléoptères rayés jaune et noir, larves rouges dodues ; pontes orange sous les feuilles.', en: 'Yellow-and-black striped beetles, plump red larvae; orange egg clusters under leaves.' },
    remedies: ['handpick', 'rotation'],
  },
  {
    id: 'carrotFly', kind: 'pest', hosts: ['apiaceae'], organs: ['roots'],
    name: { fr: 'Mouche de la carotte', en: 'Carrot fly' },
    signs: { rootTunnels: 5, yellowOld: 1 },
    check: { fr: 'Galeries rouillées dans la racine, feuillage qui rougit.', en: 'Rusty tunnels in the root, foliage turning reddish.' },
    remedies: ['netting', 'rotation'],
  },
  {
    id: 'leekMoth', kind: 'pest', hosts: ['amaryllidaceae'], organs: ['leaves', 'stems'],
    name: { fr: 'Teigne et mouche mineuse du poireau', en: 'Leek moth and allium leaf miner' },
    signs: { mines: 5, holes: 1 },
    check: { fr: 'Galeries translucides dans les feuilles, fût qui pourrit ; petites chenilles ou asticots dedans.', en: 'Translucent tunnels in leaves, rotting shaft; small caterpillars or maggots inside.' },
    remedies: ['netting', 'remove', 'bt'],
  },
  {
    id: 'rootKnot', kind: 'pest', hosts: all, organs: ['roots', 'whole'],
    name: { fr: 'Nématodes à galles', en: 'Root-knot nematodes' },
    signs: { rootGalls: 5, wiltHot: 2, stunted: 2 }, context: { hot: 1 },
    check: { fr: 'Renflements en chapelet sur les racines (qu’on ne peut pas détacher, à la différence des nodosités des légumineuses).', en: 'Bead-like swellings on roots (which cannot be rubbed off, unlike legume nodules).' },
    remedies: ['rotation', 'regularWater'],
  },
  {
    id: 'clubroot', kind: 'disease', hosts: ['brassicaceae'], organs: ['roots', 'whole'],
    name: { fr: 'Hernie du chou', en: 'Clubroot' },
    signs: { rootGalls: 5, wiltHot: 2, stunted: 2 }, context: { humid: 1 },
    check: { fr: 'Racines déformées en massues ; la plante fane aux heures chaudes. Le champignon survit 15 ans dans le sol.', en: 'Roots swollen into clubs; plant wilts in the heat. The pathogen survives 15 years in soil.' },
    remedies: ['lime', 'rotation', 'remove'],
  },
  {
    id: 'waterStress', kind: 'abiotic', hosts: all, organs: ['whole', 'leaves', 'fruits'],
    name: { fr: 'Manque d’eau', en: 'Water stress' },
    signs: { wiltHot: 4, wilt: 2, curl: 1, edgeBurn: 1 }, context: { dry: 2, hot: 2 },
    check: { fr: 'La plante fane aux heures chaudes et se redresse le soir ; sol sec à 10 cm. Comparez avec le bilan hydrique de la planche.', en: 'The plant wilts in the heat and recovers in the evening; soil dry at 10 cm. Compare with the bed’s water balance.' },
    remedies: ['regularWater'],
  },
  {
    id: 'wiltDisease', kind: 'disease', hosts: ['solanaceae', 'cucurbitaceae'], organs: ['whole', 'stems'],
    name: { fr: 'Flétrissement vasculaire (fusariose, verticilliose)', en: 'Vascular wilt (fusarium, verticillium)' },
    signs: { wilt: 4, yellowOld: 2, collapse: 1 },
    check: { fr: 'Flétrissement qui ne reprend pas le soir, souvent d’un seul côté ; vaisseaux bruns quand on coupe la tige.', en: 'Wilting that does not recover in the evening, often one-sided; brown vessels when the stem is cut.' },
    remedies: ['remove', 'rotation'],
  },
  {
    id: 'sunscald', kind: 'abiotic', hosts: ['solanaceae', 'cucurbitaceae'], organs: ['fruits', 'leaves'],
    name: { fr: 'Coup de soleil', en: 'Sunscald' },
    signs: { scorch: 5 }, context: { hot: 3 },
    check: { fr: 'Plage blanchâtre ou parcheminée sur la face exposée du fruit ou des feuilles, après une forte chaleur.', en: 'Whitish, papery patch on the exposed side of fruit or leaves after a heatwave.' },
    remedies: ['shade', 'regularWater'],
  },
  {
    id: 'frostDamage', kind: 'abiotic', hosts: all, organs: ['leaves', 'whole'],
    name: { fr: 'Dégâts de gel', en: 'Frost damage' },
    signs: { frostBlack: 5, collapse: 1 }, context: { cold: 3 },
    check: { fr: 'Feuilles noircies, comme cuites, après une nuit froide ; dégâts sur les parties les plus exposées.', en: 'Leaves blackened, as if cooked, after a cold night; worst on exposed parts.' },
    remedies: ['fleece'],
  },
  {
    id: 'fruitCracking', kind: 'abiotic', hosts: ['solanaceae', 'cucurbitaceae', 'rosaceae', 'apiaceae'], organs: ['fruits', 'roots'],
    name: { fr: 'Éclatement des fruits ou des racines', en: 'Fruit or root splitting' },
    signs: { fruitCrack: 5 }, context: { humid: 1, dry: 1 },
    check: { fr: 'Fentes après une grosse pluie ou un gros arrosage suivant une période sèche.', en: 'Splits after heavy rain or watering following a dry spell.' },
    remedies: ['regularWater'],
  },
];

export const PROBLEM_BY_ID: Record<string, Problem> = Object.fromEntries(PROBLEMS.map((p) => [p.id, p]));
