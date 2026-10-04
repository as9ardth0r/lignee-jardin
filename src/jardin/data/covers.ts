/**
 * Engrais verts et couverts d'interculture : semés entre deux cultures (ou
 * à l'automne pour l'hiver), ils protègent le sol nu, piègent l'azote qui
 * serait lessivé, nourrissent la vie du sol et, pour les légumineuses,
 * fixent l'azote de l'air. On les fauche avant la montée en graines, on
 * les laisse en paillis quelques jours puis on les incorpore superficiellement
 * (ou on les laisse en surface en sol vivant).
 *
 * « Récolte » = période de destruction (jours depuis le semis), « rendement »
 * = biomasse fraîche (kg/m²). L'azote rendu à la culture suivante (g N/m²)
 * est un ordre de grandeur des guides Arvalis, ITAB et Terres Inovia
 * (couverts d'interculture) : 3 à 5 g pour une graminée ou une crucifère
 * (azote recyclé), 6 à 12 g pour une légumineuse (azote fixé).
 */
import type { Family, Frost, MonthRange, Species, SpeciesExtra, StageId, Sun, Txt } from '../model';

const T = (fr: string, en: string): Txt => ({ fr, en });

export interface CoverInfo {
  /** Azote rendu à la culture suivante (g N/m²). */
  nReturn: number;
  /** Légumineuse : fixe l'azote de l'air. */
  fixes: boolean;
  /** Détruit par le gel (pas besoin de le faucher en sol léger). */
  frostKilled: boolean;
  destroy: Txt;
  caution?: Txt;
}

interface Def {
  id: string;
  name: Txt;
  latin: string;
  emoji: string;
  family: Family;
  life: Species['life'];
  frost: Frost;
  sun?: Sun;
  tBase: number;
  pH: [number, number];
  spacing: [number, number];
  sowOutdoor: MonthRange[];
  /** Destruction [début, fin] en jours depuis le semis. */
  destroy: [number, number];
  biomass: [number, number];
  root: number;
  height: number;
  note: Txt;
  cover: CoverInfo;
  seed: [number, SpeciesExtra['pollination'], number, number, string, string];
}

function cover(d: Def): { species: Species; extra: SpeciesExtra; height: number; info: CoverInfo } {
  const [seedLife, pollination, isolation, priceKg, fr, en] = d.seed;
  const [d0, d1] = d.destroy;
  const stages: Array<[StageId, number]> = [
    ['germination', 0],
    ['vegetative', 10],
    ['harvest', d0],
  ];
  return {
    species: {
      id: d.id,
      name: d.name,
      latin: d.latin,
      emoji: d.emoji,
      family: d.family,
      type: 'cover',
      life: d.life,
      sun: d.sun ?? 'full',
      frost: d.frost,
      tBase: d.tBase,
      tOpt: [12, 22],
      pH: d.pH,
      spacing: { row: d.spacing[0], inRow: d.spacing[1] },
      sowOutdoor: d.sowOutdoor,
      daysToHarvest: [d0, d1],
      season: d1 + 10,
      stages,
      kc: [0.4, 0.9, 0.8],
      rootDepth: d.root,
      yieldM2: d.biomass,
      // Exportations : la biomasse reste au jardin ; valeurs basses pour le calcul de la réserve.
      exports: { N: d.cover.fixes ? 1 : 3, P2O5: 1, K2O: 4 },
      feeding: d.cover.fixes ? 'improver' : 'light',
      returnYears: d.family === 'brassicaceae' ? 3 : 1,
      note: d.note,
    },
    extra: { seedLife, pollination, isolation, priceKg, trueToSeed: 'yes', seedTip: { fr, en } },
    height: d.height,
    info: d.cover,
  };
}

const FAUCHER = T('Faucher avant la floraison (ou dès les premières fleurs), laisser faner quelques jours puis incorporer légèrement sur 5 à 10 cm, 3 à 4 semaines avant de semer.', 'Cut before flowering (or at the first flowers), let it wilt a few days then work it lightly into the top 5–10 cm, 3–4 weeks before sowing.');

const DEFS: Def[] = [
  {
    id: 'whitemustard', name: T('Moutarde blanche', 'White mustard'), latin: 'Sinapis alba', emoji: '🌼', family: 'brassicaceae', life: 'annual', frost: 'half',
    tBase: 3, pH: [5.5, 8], spacing: [15, 2], sowOutdoor: [[3, 9]], destroy: [45, 80], biomass: [2, 4], root: 0.6, height: 80,
    note: T('L’engrais vert le plus rapide : couvre le sol en 3 semaines, piège l’azote avant l’hiver et ses racines pivotantes ameublissent. Gélive vers −6 °C.', 'The fastest green manure: covers the soil in 3 weeks, traps nitrogen before winter and its taproots loosen the soil. Killed by frost around −6 °C.'),
    cover: { nReturn: 4, fixes: false, frostKilled: true, destroy: FAUCHER, caution: T('Crucifère : ne pas la semer avant ou après des choux, navets ou radis (hernie du chou, altises).', 'A brassica: do not sow it before or after cabbages, turnips or radishes (clubroot, flea beetles).') },
    seed: [4, 'insect', 500, 6, 'Laisser monter quelques pieds : les siliques sèchent en juillet.', 'Let a few plants bolt: the pods dry in July.'],
  },
  {
    id: 'fodderradish', name: T('Radis fourrager', 'Fodder radish'), latin: 'Raphanus sativus var. oleiformis', emoji: '🥕', family: 'brassicaceae', life: 'annual', frost: 'half',
    tBase: 3, pH: [5.5, 8], spacing: [20, 3], sowOutdoor: [[8, 9]], destroy: [60, 120], biomass: [3, 5], root: 1, height: 80,
    note: T('Grosse racine pivotante qui « laboure » le sol tassé et remonte les éléments du sous-sol ; elle pourrit sur place après le gel.', 'A big taproot that “ploughs” compacted soil and lifts nutrients from the subsoil; it rots in place after frost.'),
    cover: { nReturn: 4, fixes: false, frostKilled: true, destroy: T('Le gel le détruit souvent ; sinon faucher en fin d’hiver avant la montée en fleurs.', 'Frost often kills it; otherwise cut in late winter before it flowers.'), caution: T('Crucifère : pas avant ou après des choux (hernie).', 'A brassica: not before or after cabbages (clubroot).') },
    seed: [4, 'insect', 500, 5, 'Comme le radis : siliques à récolter sèches.', 'Like radish: harvest the pods when dry.'],
  },
  {
    id: 'winterrye', name: T('Seigle d’hiver', 'Winter rye'), latin: 'Secale cereale', emoji: '🌾', family: 'poaceae', life: 'annual', frost: 'hardy',
    tBase: 1, pH: [5, 7.5], spacing: [15, 2], sowOutdoor: [[9, 11]], destroy: [150, 220], biomass: [3, 6], root: 1, height: 150,
    note: T('Le couvert d’hiver le plus rustique : se sème tard, pousse dès 2 °C et étouffe les herbes. Ses résidus freinent la levée des petites graines : planter plutôt des plants (courges, tomates) derrière.', 'The hardiest winter cover: sow late, it grows from 2 °C and smothers weeds. Its residues hold back small seeds: follow with transplants (squash, tomatoes).'),
    cover: { nReturn: 3, fixes: false, frostKilled: false, destroy: T('Faucher à l’épiaison (avril), au rouleau ou à la cisaille ; laisser en paillis épais pour planter au travers.', 'Cut at heading (April), with a roller or shears; leave as a thick mulch to plant through.') },
    seed: [3, 'wind', 250, 2, 'Céréale allogame : récolter les épis secs en juillet.', 'An outcrossing cereal: harvest dry ears in July.'],
  },
  {
    id: 'oats', name: T('Avoine', 'Oats'), latin: 'Avena sativa', emoji: '🌾', family: 'poaceae', life: 'annual', frost: 'half',
    tBase: 2, pH: [5, 7.5], spacing: [15, 2], sowOutdoor: [[3, 4], [8, 9]], destroy: [60, 120], biomass: [2, 4], root: 0.8, height: 100,
    note: T('Semée fin d’été, elle couvre vite et gèle l’hiver (vers −8 °C) : on sème au printemps à travers ses résidus, sans travail du sol.', 'Sown in late summer, it covers fast and is killed in winter (around −8 °C): sow in spring through its residues, no digging.'),
    cover: { nReturn: 3, fixes: false, frostKilled: true, destroy: FAUCHER },
    seed: [3, 'self', 5, 2, 'Autogame : garder les plus beaux grains.', 'Self-pollinated: keep the best grains.'],
  },
  {
    id: 'ryegrass', name: T('Ray-grass d’Italie', 'Italian ryegrass'), latin: 'Lolium multiflorum', emoji: '🌿', family: 'poaceae', life: 'annual', frost: 'hardy',
    tBase: 3, pH: [5.5, 8], spacing: [15, 1], sowOutdoor: [[3, 4], [8, 9]], destroy: [90, 200], biomass: [2, 5], root: 0.6, height: 60,
    note: T('Racines fasciculées très denses qui structurent le sol ; se fauche plusieurs fois. Difficile à détruire sans retourner : réserver aux planches qu’on peut bâcher.', 'Very dense fibrous roots that build soil structure; can be mown several times. Hard to kill without digging: keep it for beds you can tarp.'),
    cover: { nReturn: 3, fixes: false, frostKilled: false, destroy: T('Faucher ras puis bâcher 4 à 6 semaines (occultation), ou bêcher.', 'Mow short then tarp for 4–6 weeks (occultation), or dig in.') },
    seed: [3, 'wind', 200, 3, 'Rarement gardé : graines bon marché.', 'Rarely saved: seed is cheap.'],
  },
  {
    id: 'commonvetch', name: T('Vesce commune', 'Common vetch'), latin: 'Vicia sativa', emoji: '🌱', family: 'fabaceae', life: 'annual', frost: 'hardy',
    tBase: 1, pH: [6, 8], spacing: [20, 3], sowOutdoor: [[8, 10]], destroy: [150, 220], biomass: [2, 4], root: 0.6, height: 70,
    note: T('Légumineuse grimpante qui fixe l’azote de l’air : semée à l’automne, elle nourrit la culture gourmande suivante (courges, choux, maïs).', 'A climbing legume that fixes nitrogen from the air: sown in autumn, it feeds the next hungry crop (squash, cabbages, sweetcorn).'),
    cover: { nReturn: 8, fixes: true, frostKilled: false, destroy: T('Faucher en début de floraison (avril-mai), quand l’azote fixé est au maximum.', 'Cut at early flowering (April–May), when fixed nitrogen peaks.') },
    seed: [4, 'self', 5, 4, 'Gousses à récolter sèches ; autogame.', 'Harvest pods when dry; self-pollinated.'],
  },
  {
    id: 'ryevetch', name: T('Mélange seigle-vesce', 'Rye and vetch mix'), latin: 'Secale cereale + Vicia villosa', emoji: '🌾', family: 'fabaceae', life: 'annual', frost: 'hardy',
    tBase: 1, pH: [5.5, 7.5], spacing: [15, 2], sowOutdoor: [[9, 10]], destroy: [180, 230], biomass: [4, 7], root: 1, height: 120,
    note: T('Le classique de l’hiver : le seigle sert de tuteur à la vesce, qui fixe l’azote ; beaucoup de biomasse, sol couvert tout l’hiver.', 'The winter classic: rye props up the vetch, which fixes nitrogen; lots of biomass, soil covered all winter.'),
    cover: { nReturn: 7, fixes: true, frostKilled: false, destroy: T('Faucher ou rouler à la floraison de la vesce (mai), laisser en paillis et planter à travers.', 'Cut or roll at vetch flowering (May), leave as mulch and plant through.') },
    seed: [3, 'insect', 0, 3, 'Acheter le mélange : les deux espèces ne mûrissent pas ensemble.', 'Buy the mix: the two species do not ripen together.'],
  },
  {
    id: 'whiteclover', name: T('Trèfle blanc nain', 'White clover'), latin: 'Trifolium repens', emoji: '☘', family: 'fabaceae', life: 'perennial', frost: 'hardy', sun: 'partial',
    tBase: 4, pH: [5.5, 7.5], spacing: [10, 1], sowOutdoor: [[3, 5], [8, 9]], destroy: [90, 365], biomass: [1, 2.5], root: 0.4, height: 15,
    note: T('Couvre-sol vivace bas : allées, pieds des fruitiers, sous les choux ou le maïs en couvert permanent ; mellifère.', 'A low perennial ground cover: paths, under fruit trees, under cabbages or sweetcorn as a living mulch; loved by bees.'),
    cover: { nReturn: 6, fixes: true, frostKilled: false, destroy: T('Tondre régulièrement ; pour libérer une planche, tondre ras puis bâcher.', 'Mow regularly; to clear a bed, mow short then tarp.') },
    seed: [4, 'insect', 300, 15, 'Rarement gardé au jardin.', 'Rarely saved in the garden.'],
  },
  {
    id: 'redclover', name: T('Trèfle violet', 'Red clover'), latin: 'Trifolium pratense', emoji: '☘', family: 'fabaceae', life: 'biennial', frost: 'hardy',
    tBase: 4, pH: [6, 7.5], spacing: [15, 1], sowOutdoor: [[3, 5], [8, 9]], destroy: [120, 400], biomass: [3, 5], root: 1, height: 60,
    note: T('Légumineuse de longue durée (12 à 18 mois) pour reposer une planche fatiguée ; racine pivotante profonde, très mellifère.', 'A long-term legume (12–18 months) to rest a tired bed; deep taproot, very good for bees.'),
    cover: { nReturn: 10, fixes: true, frostKilled: false, destroy: T('Faucher 2 à 3 fois dans l’année (laisser en paillis), détruire au printemps suivant.', 'Mow 2–3 times a year (leave as mulch), clear it the following spring.') },
    seed: [4, 'insect', 300, 8, 'Pollinisé par les bourdons.', 'Pollinated by bumblebees.'],
  },
  {
    id: 'alfalfa', name: T('Luzerne', 'Alfalfa'), latin: 'Medicago sativa', emoji: '🌿', family: 'fabaceae', life: 'perennial', frost: 'hardy',
    tBase: 5, pH: [6.5, 8], spacing: [20, 1], sowOutdoor: [[4, 8]], destroy: [365, 1000], biomass: [4, 8], root: 1, height: 80,
    note: T('Racines très profondes (plusieurs mètres) qui décompactent et vont chercher l’eau ; plusieurs coupes par an pour pailler le potager. Sol calcaire, pas acide.', 'Very deep roots (several metres) that break up the soil and fetch water; several cuts a year to mulch the vegetable garden. Chalky soil, not acid.'),
    cover: { nReturn: 12, fixes: true, frostKilled: false, destroy: T('Prairie de 2 à 3 ans : faucher à chaque floraison ; pour la retourner, bâcher ou bêcher en automne.', 'A 2–3 year ley: cut at each flowering; to clear it, tarp or dig in autumn.') },
    seed: [5, 'insect', 300, 8, 'Rarement gardé au jardin.', 'Rarely saved in the garden.'],
  },
  {
    id: 'sainfoin', name: T('Sainfoin', 'Sainfoin'), latin: 'Onobrychis viciifolia', emoji: '🌸', family: 'fabaceae', life: 'perennial', frost: 'hardy',
    tBase: 5, pH: [6.5, 8], spacing: [20, 2], sowOutdoor: [[3, 5]], destroy: [365, 900], biomass: [2, 4], root: 1, height: 60,
    note: T('Légumineuse des sols secs et calcaires, superbe floraison rose très mellifère ; pour reposer une planche 2 à 3 ans.', 'A legume for dry chalky soils, superb pink flowers loved by bees; to rest a bed for 2–3 years.'),
    cover: { nReturn: 8, fixes: true, frostKilled: false, destroy: T('Faucher après la floraison ; bêcher ou bâcher pour remettre la planche en culture.', 'Cut after flowering; dig or tarp to bring the bed back into use.') },
    seed: [4, 'insect', 300, 5, 'Gousses épineuses à récolter sèches.', 'Spiny pods to harvest dry.'],
  },
  {
    id: 'fieldpea', name: T('Pois fourrager', 'Field pea'), latin: 'Pisum sativum subsp. arvense', emoji: '🫛', family: 'fabaceae', life: 'annual', frost: 'half',
    tBase: 3, pH: [6, 7.5], spacing: [20, 3], sowOutdoor: [[3, 4], [8, 9]], destroy: [70, 120], biomass: [2, 4], root: 0.6, height: 80,
    note: T('Légumineuse rapide en été ou en mélange avec l’avoine en automne ; gèle vers −8 °C.', 'A quick legume in summer or mixed with oats in autumn; killed around −8 °C.'),
    cover: { nReturn: 7, fixes: true, frostKilled: true, destroy: FAUCHER, caution: T('Ne pas le semer avant des pois ou des fèves (maladies du pied).', 'Do not sow before peas or broad beans (foot rot).') },
    seed: [3, 'self', 5, 3, 'Autogame : garder les plus beaux grains.', 'Self-pollinated: keep the best seeds.'],
  },
];

const BUILT = DEFS.map(cover);
export const COVERS: Species[] = BUILT.map((b) => b.species);
export const COVER_EXTRA: Record<string, SpeciesExtra> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.extra]));
export const COVER_HEIGHT: Record<string, number> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.height]));
export const COVER_INFO: Record<string, CoverInfo> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.info]));

/** Fleurs du catalogue qui servent aussi d'engrais vert (phacélie, sarrasin, trèfle incarnat). */
COVER_INFO.phacelia = { nReturn: 3, fixes: false, frostKilled: true, destroy: T('Faucher au début de la floraison (sinon elle se ressème) ; gèle vers −8 °C.', 'Cut at early flowering (or it self-seeds); killed around −8 °C.') };
COVER_INFO.buckwheat = { nReturn: 2, fixes: false, frostKilled: true, destroy: T('Faucher 6 à 8 semaines après le semis, à la floraison ; très gélif.', 'Cut 6–8 weeks after sowing, at flowering; very frost-tender.') };
COVER_INFO.crimsonclover = { nReturn: 8, fixes: true, frostKilled: false, destroy: T('Faucher à la floraison (avril-mai), laisser en paillis.', 'Cut at flowering (April–May), leave as mulch.') };
