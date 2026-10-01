/**
 * Espèces et loci mendéliens des courges (genre Cucurbita, 2n = 40).
 *
 * Source principale : liste des gènes de Cucurbita du Cucurbit Genetics
 * Cooperative (Paris & Padley 2014, CGC Report 37 ; Paris & Kabelka 2009),
 * complétée par Om et al. 1988 (Bu), Mutschler & Pearson 1987 (Bn), Cohen,
 * Hanan & Paris 2003 (Pm-0).
 *
 * Tous les individus portent TOUS les loci (allèle standard par défaut),
 * ce qui permet de croiser des espèces compatibles sans cas particulier.
 * Chaque locus indique dans quelles espèces il est documenté ; quand on
 * l'utilise dans une autre espèce pour représenter une variété (ex. peau
 * saumon du Galeux d'Eysines), il est marqué HYPOTHÉTIQUE pour cette
 * espèce : l'hérédité réelle de ce caractère n'y est pas publiée.
 *
 * Simplifications assumées :
 *  - séries alléliques réduites (D > Ds > d → D/d ; L-1 à 5 allèles → 3) ;
 *  - mo-1 + mo-2 (deux gènes récessifs) réunis en un seul locus « mo » ;
 *  - Zym-1/2/3 réunis en un gène dominant « Zym » ;
 *  - aucune liaison génétique : quasiment aucune n'est documentée chez
 *    Cucurbita (seules D–mo-2, M–Wt et Bi–Lo-2 le sont, faiblement).
 */

export type SpeciesId = 'pepo' | 'maxima' | 'moschata' | 'argyrosperma' | 'ficifolia';

export const SPECIES: SpeciesId[] = ['pepo', 'maxima', 'moschata', 'argyrosperma', 'ficifolia'];

export const SPECIES_INFO: Record<SpeciesId, { latin: string; name: { fr: string; en: string }; examples: { fr: string; en: string } }> = {
  pepo: {
    latin: 'Cucurbita pepo',
    name: { fr: 'Courgettes, pâtissons, citrouilles', en: 'Zucchini, pattypans, pumpkins' },
    examples: { fr: 'courgette, pâtisson, courge spaghetti, citrouille, courge de Styrie, coloquintes', en: 'zucchini, pattypan, spaghetti squash, field pumpkin, Styrian pumpkin, ornamental gourds' },
  },
  maxima: {
    latin: 'Cucurbita maxima',
    name: { fr: 'Potirons', en: 'Winter squashes (maxima)' },
    examples: { fr: 'Rouge vif d’Étampes, Galeux d’Eysines, potimarron, Hubbard, Buttercup, géantes', en: 'Rouge vif d’Étampes, Galeux d’Eysines, Red Kuri, Hubbard, Buttercup, giants' },
  },
  moschata: {
    latin: 'Cucurbita moschata',
    name: { fr: 'Courges musquées', en: 'Butternut & musk squashes' },
    examples: { fr: 'butternut, Musquée de Provence, Longue de Nice, Sucrine du Berry', en: 'butternut, Musquée de Provence, Long of Naples, Sucrine du Berry' },
  },
  argyrosperma: {
    latin: 'Cucurbita argyrosperma',
    name: { fr: 'Cushaws (courges à graines argentées)', en: 'Cushaws (silver-seed squashes)' },
    examples: { fr: 'Green Striped Cushaw, Tennessee Sweet Potato', en: 'Green Striped Cushaw, Tennessee Sweet Potato' },
  },
  ficifolia: {
    latin: 'Cucurbita ficifolia',
    name: { fr: 'Courge de Siam', en: 'Fig-leaf gourd' },
    examples: { fr: 'courge de Siam (chilacayote)', en: 'fig-leaf gourd (chilacayote)' },
  },
};

export type SquashLocusId =
  | 'bu'
  | 'n'
  | 'b'
  | 'd'
  | 'l1'
  | 'l2'
  | 'mo'
  | 'y'
  | 'w'
  | 'wf'
  | 'di'
  | 'hr'
  | 'wt'
  | 'm'
  | 'bi'
  | 'pm0'
  | 'zym'
  | 'rd'
  | 'bl'
  | 'bn'
  | 'gr'
  | 'pk'
  | 'tu';

/** Identifiant d'un allèle d'intérêt (unique dans tout le modèle). */
export type VariantId =
  | 'Bu'
  | 'n'
  | 'B'
  | 'D'
  | 'st'
  | 'l1'
  | 'l2'
  | 'mo'
  | 'Y'
  | 'W'
  | 'Wf'
  | 'Di'
  | 'Hr'
  | 'Wt'
  | 'M'
  | 'Bi'
  | 'Pm0'
  | 'Zym'
  | 'Rd'
  | 'bl'
  | 'Bn'
  | 'Gr'
  | 'pk'
  | 'Tu';

export type LocusCategory = 'plant' | 'color' | 'shape' | 'fruit' | 'resistance' | 'safety';

type Txt = { fr: string; en: string };

export interface AlleleDef {
  allele: string;
  /** Id de la variante (absent pour l'allèle standard). */
  id?: VariantId;
  name?: Txt;
  effect?: Txt;
}

export interface LocusDef {
  id: SquashLocusId;
  /** Symbole du gène dans la littérature. */
  symbol: string;
  category: LocusCategory;
  name: Txt;
  /** Allèles du plus dominant au plus récessif. */
  alleles: AlleleDef[];
  /** Allèle standard (le plus courant dans les variétés « de base »). */
  standard: string;
  /** Dominance incomplète : l'hétérozygote est intermédiaire. */
  incomplete?: boolean;
  /** Espèces où le gène est documenté. */
  documented: SpeciesId[];
  /** Espèces où on l'utilise sans que son hérédité y soit publiée. */
  hypothetical?: SpeciesId[];
  note?: Txt;
}

const T = (fr: string, en: string): Txt => ({ fr, en });

export const SQUASH_LOCI: LocusDef[] = [
  {
    id: 'bu',
    symbol: 'Bu',
    category: 'plant',
    name: T('Port buissonnant', 'Bush habit'),
    alleles: [
      { allele: 'Bu', id: 'Bu', name: T('Buissonnant', 'Bush'), effect: T('Entre-nœuds courts : plante compacte, non coureuse (courgettes, butternut « Butterbush »). Dominance incomplète : l’hétérozygote est semi-buissonnant, et l’effet s’atténue en fin de saison.', 'Short internodes: compact, non-running plant (zucchini, ‘Butterbush’). Incompletely dominant: heterozygotes are semi-bush, and the effect weakens late in the season.') },
      { allele: 'bu' },
    ],
    standard: 'bu',
    incomplete: true,
    documented: ['pepo', 'maxima', 'moschata'],
  },
  {
    id: 'n',
    symbol: 'n',
    category: 'fruit',
    name: T('Graines nues (sans enveloppe)', 'Hull-less (naked) seeds'),
    alleles: [
      { allele: 'N' },
      { allele: 'n', id: 'n', name: T('Graines nues', 'Hull-less seeds'), effect: T('Récessif : la graine n’a pas d’enveloppe lignifiée, elle se mange sans décortiquer (courge de Styrie, courges à huile).', 'Recessive: the seed has no lignified coat and can be eaten whole (Styrian oil pumpkin).') },
    ],
    standard: 'N',
    documented: ['pepo', 'moschata'],
  },
  {
    id: 'b',
    symbol: 'B',
    category: 'color',
    name: T('Jaune précoce (Bicolor)', 'Precocious yellow (Bicolor)'),
    alleles: [
      { allele: 'B', id: 'B', name: T('Jaune précoce', 'Precocious yellow'), effect: T('Dominant : le fruit jaunit très tôt, dès la fleur (courgettes jaunes, coloquintes bicolores). Avec L-2, la chair devient orange intense.', 'Dominant: the fruit turns yellow very early, from the flower (golden zucchini, bicolor gourds). With L-2, the flesh becomes intense orange.') },
      { allele: 'b' },
    ],
    standard: 'b',
    documented: ['pepo', 'moschata', 'maxima'],
    note: T('Chez C. maxima : gène Bmax (sous-espèce sauvage andreana) ; chez C. moschata : introduit depuis C. pepo.', 'In C. maxima: Bmax gene (wild subsp. andreana); in C. moschata: introgressed from C. pepo.'),
  },
  {
    id: 'd',
    symbol: 'D',
    category: 'color',
    name: T('Tige et fruit foncés', 'Dark stem and fruit'),
    alleles: [
      { allele: 'D', id: 'D', name: T('Foncé', 'Dark'), effect: T('Dominant : tige et fruit vert très foncé, presque noir (courgettes ‘Black Beauty’, ‘Nero di Milano’). Masque les gènes « clairs » L-1 et L-2.', 'Dominant: very dark green, almost black stem and fruit (‘Black Beauty’, ‘Nero di Milano’ zucchini). Masks the “light” genes L-1 and L-2.') },
      { allele: 'd' },
    ],
    standard: 'd',
    documented: ['pepo'],
  },
  {
    id: 'l1',
    symbol: 'L-1',
    category: 'color',
    name: T('Coloration du fruit 1 (rayures)', 'Fruit colouring 1 (stripes)'),
    alleles: [
      { allele: 'L1' },
      { allele: 'st', id: 'st', name: T('Rayé', 'Striped'), effect: T('Série allélique de L-1 : fruit rayé de bandes foncées sur fond clair (‘Cocozelle’, ‘Delicata’, cushaws). Dominant sur l-1, récessif sur L-1.', 'L-1 allelic series: fruit striped with dark bands on a light background (‘Cocozelle’, ‘Delicata’, cushaws). Dominant over l-1, recessive to L-1.') },
      { allele: 'l1', id: 'l1', name: T('Clair (l-1)', 'Light (l-1)'), effect: T('Récessif : fruit clair, crème à vert pâle (‘Vegetable Spaghetti’, courgettes blanches).', 'Recessive: light fruit, cream to pale green (‘Vegetable Spaghetti’, white zucchini).') },
    ],
    standard: 'L1',
    documented: ['pepo'],
    hypothetical: ['argyrosperma'],
    note: T('Série réelle à 5 allèles (L-1, larges rayures, rayures fines, irrégulières, l-1), réduite à 3 ici.', 'The real series has 5 alleles (L-1, broad stripes, narrow stripes, irregular, l-1), reduced to 3 here.'),
  },
  {
    id: 'l2',
    symbol: 'L-2',
    category: 'color',
    name: T('Coloration du fruit 2 (intensité)', 'Fruit colouring 2 (intensity)'),
    alleles: [
      { allele: 'L2' },
      { allele: 'l2', id: 'l2', name: T('Clair (l-2)', 'Light (l-2)'), effect: T('Récessif : couleur du fruit peu intense. L-2 au contraire intensifie la couleur, et donne une chair orange avec B.', 'Recessive: weakly coloured fruit. L-2 instead intensifies colour, and gives orange flesh together with B.') },
    ],
    standard: 'L2',
    documented: ['pepo'],
  },
  {
    id: 'mo',
    symbol: 'mo',
    category: 'color',
    name: T('Orange à maturité', 'Mature orange'),
    alleles: [
      { allele: 'Mo' },
      { allele: 'mo', id: 'mo', name: T('Orange à maturité', 'Mature orange'), effect: T('Récessif : le fruit perd son vert en mûrissant et devient orange (citrouilles, Jack O’Lantern).', 'Recessive: the fruit loses its green as it ripens and turns orange (field pumpkins, Jack O’Lantern).') },
    ],
    standard: 'Mo',
    documented: ['pepo'],
    hypothetical: ['maxima'],
    note: T('En réalité deux gènes récessifs (mo-1 et mo-2) nécessaires ensemble ; réunis ici en un seul.', 'Actually two recessive genes (mo-1 and mo-2) needed together; merged into one here.'),
  },
  {
    id: 'y',
    symbol: 'Y',
    category: 'color',
    name: T('Fruit jaune', 'Yellow fruit'),
    alleles: [
      { allele: 'Y', id: 'Y', name: T('Jaune', 'Yellow'), effect: T('Dominant sur vert : fruit jaune (courges à col droit et à col tors).', 'Dominant over green: yellow fruit (straightneck and crookneck squashes).') },
      { allele: 'y' },
    ],
    standard: 'y',
    documented: ['pepo'],
  },
  {
    id: 'w',
    symbol: 'W',
    category: 'color',
    name: T('Coloration faible (fruit blanc)', 'Weak colouring (white fruit)'),
    alleles: [
      { allele: 'W', id: 'W', name: T('Blanc', 'White'), effect: T('Dominant : fruit mûr faiblement coloré, blanc à crème (pâtisson blanc). Avec Wf, fruit entièrement blanc.', 'Dominant: weakly coloured mature fruit, white to cream (white pattypan). With Wf, a fully white fruit.') },
      { allele: 'w' },
    ],
    standard: 'w',
    documented: ['pepo'],
    hypothetical: ['maxima', 'argyrosperma'],
  },
  {
    id: 'wf',
    symbol: 'Wf',
    category: 'color',
    name: T('Chair blanche', 'White flesh'),
    alleles: [
      { allele: 'Wf', id: 'Wf', name: T('Chair blanche', 'White flesh'), effect: T('Dominant : chair blanche (pâtissons).', 'Dominant: white flesh (pattypans).') },
      { allele: 'wf' },
    ],
    standard: 'wf',
    documented: ['pepo'],
  },
  {
    id: 'di',
    symbol: 'Di',
    category: 'shape',
    name: T('Fruit en disque (pâtisson)', 'Disc fruit (pattypan)'),
    alleles: [
      { allele: 'Di', id: 'Di', name: T('Disque', 'Disc'), effect: T('Dominant : fruit aplati en soucoupe festonnée, la forme du pâtisson.', 'Dominant: flattened, scalloped saucer fruit — the pattypan shape.') },
      { allele: 'di' },
    ],
    standard: 'di',
    documented: ['pepo'],
  },
  {
    id: 'tu',
    symbol: 'Tu',
    category: 'shape',
    name: T('Turban', 'Turban'),
    alleles: [
      { allele: 'Tu', id: 'Tu', name: T('Turban', 'Turban'), effect: T('Le bout du fruit forme un « bouton » en saillie (Turban turc, Buttercup).', 'The blossom end forms a protruding “button” (Turk’s Turban, Buttercup).') },
      { allele: 'tu' },
    ],
    standard: 'tu',
    documented: [],
    hypothetical: ['maxima'],
    note: T('Hérédité non publiée : modélisée comme un gène dominant par hypothèse.', 'Inheritance not published: modelled as a dominant gene by assumption.'),
  },
  {
    id: 'hr',
    symbol: 'Hr',
    category: 'fruit',
    name: T('Écorce dure', 'Hard rind'),
    alleles: [
      { allele: 'Hr', id: 'Hr', name: T('Écorce dure', 'Hard rind'), effect: T('Dominant : écorce lignifiée, dure comme du bois (coloquintes, courgettes à maturité). Améliore la conservation. Condition pour que les verrues (Wt) apparaissent chez C. pepo.', 'Dominant: lignified, wood-hard rind (gourds, mature zucchini). Improves storage. Required for warts (Wt) to show in C. pepo.') },
      { allele: 'hr' },
    ],
    standard: 'hr',
    documented: ['pepo'],
    hypothetical: ['maxima'],
  },
  {
    id: 'wt',
    symbol: 'Wt',
    category: 'fruit',
    name: T('Fruit verruqueux', 'Warty fruit'),
    alleles: [
      { allele: 'Wt', id: 'Wt', name: T('Verrues', 'Warts'), effect: T('Dominant : fruit couvert de verrues (courges à col tors). Chez C. pepo, visible seulement avec une écorce dure (Hr).', 'Dominant: fruit covered in warts (crooknecks). In C. pepo, only visible with a hard rind (Hr).') },
      { allele: 'wt' },
    ],
    standard: 'wt',
    documented: ['pepo'],
    hypothetical: ['maxima', 'moschata'],
    note: T('Les « galles » du Galeux d’Eysines sont héréditaires mais leur génétique n’est pas publiée.', 'The warts of ‘Galeux d’Eysines’ are heritable but their genetics is unpublished.'),
  },
  {
    id: 'm',
    symbol: 'M',
    category: 'plant',
    name: T('Feuilles marbrées d’argent', 'Silver-mottled leaves'),
    alleles: [
      { allele: 'M', id: 'M', name: T('Marbrure argentée', 'Silver mottle'), effect: T('Dominant : taches gris argenté aux nervures des feuilles. Purement esthétique : ce n’est PAS de l’oïdium, ne pas traiter !', 'Dominant: silvery-grey patches along leaf veins. Purely cosmetic: this is NOT powdery mildew, do not spray!') },
      { allele: 'm' },
    ],
    standard: 'm',
    documented: ['pepo', 'maxima', 'moschata'],
  },
  {
    id: 'bi',
    symbol: 'Bi',
    category: 'safety',
    name: T('Amertume (cucurbitacines) — TOXIQUE', 'Bitterness (cucurbitacins) — TOXIC'),
    alleles: [
      { allele: 'Bi', id: 'Bi', name: T('Amer, toxique', 'Bitter, toxic'), effect: T('Dominant : fruit riche en cucurbitacines, amer et TOXIQUE (coloquintes d’ornement, courges sauvages). Un seul allèle suffit : une courgette pollinisée par une coloquinte donne des graines dont les plantes peuvent porter des fruits dangereux.', 'Dominant: fruit rich in cucurbitacins, bitter and TOXIC (ornamental gourds, wild squashes). One allele is enough: a zucchini pollinated by a gourd gives seed whose plants may bear dangerous fruit.') },
      { allele: 'bi' },
    ],
    standard: 'bi',
    documented: ['pepo', 'maxima'],
  },
  {
    id: 'pm0',
    symbol: 'Pm-0',
    category: 'resistance',
    name: T('Résistance à l’oïdium', 'Powdery mildew resistance'),
    alleles: [
      { allele: 'Pm0', id: 'Pm0', name: T('Pm-0', 'Pm-0'), effect: T('Dominance incomplète : résistance à l’oïdium (Podosphaera xanthii), venue de l’espèce sauvage C. okeechobeensis. Meilleure à l’état homozygote.', 'Incompletely dominant: resistance to powdery mildew (Podosphaera xanthii), from the wild species C. okeechobeensis. Best when homozygous.') },
      { allele: 'pm0' },
    ],
    standard: 'pm0',
    incomplete: true,
    documented: ['pepo', 'moschata'],
  },
  {
    id: 'zym',
    symbol: 'Zym',
    category: 'resistance',
    name: T('Résistance au virus de la mosaïque jaune (ZYMV)', 'Zucchini yellow mosaic virus (ZYMV) resistance'),
    alleles: [
      { allele: 'Zym', id: 'Zym', name: T('Zym', 'Zym'), effect: T('Dominant : résistance au ZYMV, transmis par les pucerons. Venue des courges musquées ‘Menina’ et ‘Nigerian Local’, introduite dans des courgettes.', 'Dominant: resistance to ZYMV, spread by aphids. From the ‘Menina’ and ‘Nigerian Local’ moschatas, bred into zucchini.') },
      { allele: 'zym' },
    ],
    standard: 'zym',
    documented: ['moschata', 'pepo'],
    note: T('Plusieurs gènes (Zym-1, Zym-2, Zym-3…) réunis ici en un seul.', 'Several genes (Zym-1, Zym-2, Zym-3…) merged into one here.'),
  },
  {
    id: 'rd',
    symbol: 'Rd',
    category: 'color',
    name: T('Écorce rouge', 'Red rind'),
    alleles: [
      { allele: 'Rd', id: 'Rd', name: T('Rouge', 'Red'), effect: T('Dominant sur vert, blanc, jaune et gris : écorce rouge-orangé (Turban turc ; potimarron, Rouge vif d’Étampes par hypothèse).', 'Dominant over green, white, yellow and grey: red-orange rind (Turk’s Turban; Red Kuri and Rouge vif d’Étampes by assumption).') },
      { allele: 'rd' },
    ],
    standard: 'rd',
    documented: ['maxima'],
  },
  {
    id: 'bl',
    symbol: 'bl',
    category: 'color',
    name: T('Écorce bleue', 'Blue rind'),
    alleles: [
      { allele: 'Bl' },
      { allele: 'bl', id: 'bl', name: T('Bleu', 'Blue'), effect: T('Incomplètement récessif : écorce bleu-gris (Hubbard bleu, Jarrahdale). L’hétérozygote est gris-vert.', 'Incompletely recessive: blue-grey rind (Blue Hubbard, Jarrahdale). Heterozygotes are grey-green.') },
    ],
    standard: 'Bl',
    incomplete: true,
    documented: ['maxima'],
  },
  {
    id: 'pk',
    symbol: 'pk',
    category: 'color',
    name: T('Écorce saumon', 'Salmon-pink rind'),
    alleles: [
      { allele: 'Pk' },
      { allele: 'pk', id: 'pk', name: T('Saumon', 'Salmon'), effect: T('Écorce rose saumon (Galeux d’Eysines, Pink Banana).', 'Salmon-pink rind (Galeux d’Eysines, Pink Banana).') },
    ],
    standard: 'Pk',
    documented: [],
    hypothetical: ['maxima'],
    note: T('Aucun gène publié : modélisé comme un récessif par hypothèse.', 'No published gene: modelled as a recessive by assumption.'),
  },
  {
    id: 'bn',
    symbol: 'Bn',
    category: 'shape',
    name: T('Forme butternut', 'Butternut shape'),
    alleles: [
      { allele: 'Bn', id: 'Bn', name: T('Butternut', 'Butternut'), effect: T('Dominant sur col tors : fruit allongé en forme de cloche (butternut) plutôt qu’à long col recourbé.', 'Dominant over crookneck: elongated bell-shaped (butternut) fruit rather than a long curved neck.') },
      { allele: 'bn' },
    ],
    standard: 'bn',
    documented: ['moschata'],
  },
  {
    id: 'gr',
    symbol: 'Gr',
    category: 'color',
    name: T('Écorce verte', 'Green rind'),
    alleles: [
      { allele: 'Gr', id: 'Gr', name: T('Vert', 'Green'), effect: T('Dominant sur chamois : le fruit mûr reste vert (‘Long Neapolitan’, ‘Black Futsu’) au lieu de devenir chamois (butternut).', 'Dominant over buff: the ripe fruit stays green (‘Long Neapolitan’, ‘Black Futsu’) instead of turning buff (butternut).') },
      { allele: 'gr' },
    ],
    standard: 'gr',
    documented: ['moschata'],
  },
];

export const LOCUS_BY_ID: Record<SquashLocusId, LocusDef> = Object.fromEntries(SQUASH_LOCI.map((l) => [l.id, l])) as Record<SquashLocusId, LocusDef>;

export const LOCUS_IDS: SquashLocusId[] = SQUASH_LOCI.map((l) => l.id);

/** Variante → [locus, allèle]. */
export const VARIANT_ALLELE: Record<VariantId, [SquashLocusId, string]> = (() => {
  const out = {} as Record<VariantId, [SquashLocusId, string]>;
  for (const l of SQUASH_LOCI) for (const a of l.alleles) if (a.id) out[a.id] = [l.id, a.allele];
  return out;
})();

export const VARIANT_IDS = Object.keys(VARIANT_ALLELE) as VariantId[];

export function variantInfo(id: VariantId): { label: string; locus: LocusDef; name: Txt; effect: Txt } {
  const [lid, allele] = VARIANT_ALLELE[id];
  const locus = LOCUS_BY_ID[lid];
  const a = locus.alleles.find((x) => x.allele === allele)!;
  return { label: allele, locus, name: a.name ?? locus.name, effect: a.effect ?? locus.name };
}

/** Le locus concerne-t-il cette espèce (documenté ou hypothétique) ? */
export function locusRelevant(l: LocusDef, sp: SpeciesId): boolean {
  return l.documented.includes(sp) || (l.hypothetical ?? []).includes(sp);
}

export function locusHypothetical(l: LocusDef, sp: SpeciesId): boolean {
  return !l.documented.includes(sp) && (l.hypothetical ?? []).includes(sp);
}
