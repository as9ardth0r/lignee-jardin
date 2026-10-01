/**
 * Bibliothèque de choux, de leurs cousins du triangle de U et de radis.
 *
 * Sources : catalogues de semenciers (Kokopelli, Graines Baumaux,
 * Vilmorin, Baker Creek, Johnny’s), lignées publiques et donneuses
 * publiées (Wisconsin All Seasons et la fusariose — Walker 1930 ; OL87123
 * et Pp523 ; ECD 04 et la hernie ; Beneforté et MYB28), « Wisconsin Fast
 * Plants » (Williams & Hill 1986), radis Ogura (Ogura 1968).
 *
 * Valeurs chiffrées = ordres de grandeur. Génotypes = DÉDUITS du
 * morphotype et de la couleur avec le modèle simplifié de loci.ts. Les
 * allèles S (auto-incompatibilité) sont des étiquettes pédagogiques : les
 * vraies variétés en portent des dizaines. `het` liste les gènes à l’état
 * hétérozygote ; `cyto: 'Ogu'` = cytoplasme Ogura (hybrides F1 modernes).
 */

import type { Cytoplasm, QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type BrKind = 'cabbage' | 'cauliflower' | 'broccoli' | 'kale' | 'sprouts' | 'kohlrabi' | 'root' | 'asian' | 'oilseed' | 'donor';
export const BR_KINDS: BrKind[] = ['cabbage', 'cauliflower', 'broccoli', 'kale', 'sprouts', 'kohlrabi', 'root', 'asian', 'oilseed', 'donor'];

export interface BrVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  cyto?: Cytoplasm;
  variants: VariantId[];
  het?: VariantId[];
  /** Allèles S (auto-incompatibilité). */
  s?: [string, string];
  /** Poids de l’organe récolté (kg). */
  weightKg: number;
  days: number;
  heightCm: number;
  /** Gel supporté (°C). */
  frostC: number;
  kinds: BrKind[];
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<BrVariety, 'hybrid' | 'origin' | 'het' | 'cyto'>>;

function v(
  id: string,
  name: string,
  species: SpeciesId,
  variants: VariantId[],
  s: [string, string],
  weightKg: number,
  days: number,
  heightCm: number,
  frostC: number,
  kinds: BrKind[],
  fr: string,
  en: string,
  opt: Opt = {}
): BrVariety {
  return { id, name, species, variants, s, weightKg, days, heightCm, frostC, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

const F1 = { hybrid: true } as const;
const OGU = { hybrid: true, cyto: 'Ogu' } as const;
const SC: [string, string] = ['Sf', 'Sf'];

export const BR_VARIETIES: BrVariety[] = [
  // --- Choux pommés ------------------------------------------------------------
  v('coeur-de-boeuf', 'Cœur de bœuf des Vertus', 'oleracea', ['He'], ['S2', 'S4'], 1.2, 110, 35, -8, ['cabbage'], 'Chou pointu de printemps, tendre, de la plaine des Vertus près de Paris.', 'Tender pointed spring cabbage from the Vertus plain near Paris.', { origin: 'France' }),
  v('quintal-alsace', 'Quintal d’Alsace', 'oleracea', ['He'], ['S1', 'S3'], 4, 150, 45, -8, ['cabbage'], 'Énorme chou blanc à choucroute.', 'Huge white sauerkraut cabbage.', { origin: 'France' }),
  v('golden-acre', 'Golden Acre', 'oleracea', ['He'], ['S2', 'S5'], 1, 70, 30, -5, ['cabbage'], 'Petit chou rond très précoce.', 'Very early small round cabbage.', { origin: 'USA' }),
  v('copenhagen', 'Copenhagen Market', 'oleracea', ['He'], ['S3', 'S6'], 1.8, 75, 35, -6, ['cabbage'], 'Classique danois de 1909, pomme ronde et dense.', '1909 Danish classic, round dense head.', { origin: 'Danemark' }),
  v('tete-noire', 'Rouge tête noire', 'oleracea', ['He', 'Pr'], ['S1', 'S4'], 1.5, 120, 40, -8, ['cabbage'], 'Chou rouge foncé (gène dominant BoMYB2) ; son jus vire au bleu ou au rouge selon l’acidité.', 'Dark red cabbage (dominant BoMYB2 gene); its juice turns blue or red depending on acidity.', { origin: 'France' }),
  v('red-acre', 'Red Acre', 'oleracea', ['He', 'Pr'], ['S2', 'S6'], 1.2, 80, 35, -6, ['cabbage'], 'Chou rouge précoce et compact.', 'Early compact red cabbage.', { origin: 'USA' }),
  v('milan-pontoise', 'Milan de Pontoise', 'oleracea', ['He', 'Sav'], ['S3', 'S5'], 1.5, 180, 40, -14, ['cabbage'], 'Chou de Milan d’hiver aux feuilles cloquées, très rustique.', 'Winter savoy with puckered leaves, very hardy.', { origin: 'France' }),
  v('january-king', 'January King', 'oleracea', ['He', 'Sav'], ['S1', 'S6'], 1.3, 200, 35, -15, ['cabbage'], 'Hybride naturel chou × Milan à feuilles teintées de pourpre, récolté en plein hiver.', 'Natural cabbage × savoy cross with purple-tinged leaves, picked in midwinter.', { origin: 'Angleterre', het: ['Sav'] }),
  v('wisconsin-all-seasons', 'Wisconsin All Seasons', 'oleracea', ['He', 'Foc1'], ['S2', 'S3'], 3, 105, 40, -6, ['cabbage', 'donor'], 'Une des premières variétés sélectionnées pour une résistance (Walker, Wisconsin, années 1920) : la fusariose jaune (FOC1).', 'One of the first varieties bred for resistance (Walker, Wisconsin, 1920s): Fusarium yellows (FOC1).', { origin: 'USA' }),
  v('stonehead', 'Stonehead F1', 'oleracea', ['He', 'Foc1'], ['S4', 'S5'], 1.5, 70, 35, -6, ['cabbage'], 'Hybride compact résistant à la fusariose.', 'Compact Fusarium-resistant hybrid.', { ...F1, origin: 'Japon' }),
  v('kilaxy', 'Kilaxy F1', 'oleracea', ['He', 'CRa'], ['S1', 'S2'], 1.5, 95, 35, -6, ['cabbage'], 'Chou résistant à la hernie grâce à un gène de navet ; hybride sur cytoplasme Ogura.', 'Clubroot-resistant cabbage thanks to a turnip gene; hybrid on Ogura cytoplasm.', { ...OGU, origin: 'Pays-Bas' }),
  v('ogura-cabbage', 'Lignée de chou Ogura', 'oleracea', ['He'], ['S5', 'S5'], 1.2, 90, 35, -6, ['cabbage', 'donor'], 'Chou dans lequel le cytoplasme du radis Ogura a été transféré par rétrocroisements : mâle stérile, mère idéale pour les hybrides.', 'Cabbage into which the Ogura radish cytoplasm was transferred by backcrossing: male sterile, an ideal hybrid mother.', { cyto: 'Ogu' }),
  // --- Choux feuilles ----------------------------------------------------------
  v('frise-nord', 'Chou frisé vert grand du Nord', 'oleracea', ['Cr'], ['S1', 'S5'], 0.6, 90, 80, -18, ['kale'], 'Kale frisé très rustique, sucré après les gelées.', 'Very hardy curly kale, sweeter after frost.', { origin: 'Europe' }),
  v('nero-toscana', 'Nero di Toscana', 'oleracea', ['Sav'], ['S2', 'S4'], 0.5, 90, 70, -12, ['kale'], 'Chou noir de Toscane (lacinato) aux longues feuilles cloquées.', 'Tuscan black kale (lacinato) with long puckered leaves.', { origin: 'Italie' }),
  v('redbor', 'Redbor F1', 'oleracea', ['Cr', 'Pr'], ['S3', 'S4'], 0.6, 80, 80, -15, ['kale'], 'Kale frisé pourpre.', 'Purple curly kale.', { ...F1, origin: 'Pays-Bas' }),
  v('collard', 'Georgia Southern Collard', 'oleracea', [], ['S5', 'S6'], 0.8, 80, 80, -10, ['kale'], 'Chou cavalier à grandes feuilles lisses, pilier de la cuisine du Sud américain.', 'Large smooth-leaved collard, a staple of Southern US cooking.', { origin: 'USA' }),
  v('tronchuda', 'Tronchuda (Couve)', 'oleracea', [], ['S1', 'S2'], 0.8, 90, 50, -6, ['kale'], 'Chou portugais à grosses côtes, pour le caldo verde.', 'Portuguese thick-ribbed cabbage, for caldo verde.', { origin: 'Portugal' }),
  v('daubenton', 'Chou de Daubenton', 'oleracea', [], ['S3', 'S3'], 0.5, 120, 70, -15, ['kale'], 'Chou vivace qui ne fleurit presque jamais : on le multiplie par bouture depuis le XVIIIᵉ siècle.', 'Perennial kale that hardly ever flowers: propagated by cuttings since the 18th century.', { origin: 'France' }),
  // --- Choux-fleurs ------------------------------------------------------------------
  v('merveille-saisons', 'Merveille de toutes saisons', 'oleracea', ['cu'], ['S3', 'S5'], 1.2, 110, 50, -4, ['cauliflower'], 'Chou-fleur blanc polyvalent ; le caillé, ce sont des milliers de méristèmes floraux arrêtés.', 'Versatile white cauliflower; the curd is thousands of stalled floral meristems.', { origin: 'France' }),
  v('snowball', 'Snowball', 'oleracea', ['cu', 'an'], ['S2', 'S4'], 0.8, 70, 45, -3, ['cauliflower'], 'Chou-fleur d’été précoce, annuel.', 'Early summer cauliflower, annual.', { origin: 'Danemark' }),
  v('angers', 'Chou-fleur d’Angers', 'oleracea', ['cu'], ['S1', 'S6'], 1.2, 240, 50, -7, ['cauliflower'], 'Chou-fleur d’hiver de l’Ouest, semé au printemps, récolté au printemps suivant.', 'Western French winter cauliflower, sown in spring, cut the following spring.', { origin: 'France' }),
  v('graffiti', 'Graffiti F1', 'oleracea', ['cu', 'Pr'], ['S2', 'S5'], 0.9, 85, 45, -3, ['cauliflower'], 'Chou-fleur violet (BoMYB2), qui garde sa couleur si on le cuit peu.', 'Purple cauliflower (BoMYB2) that keeps its colour when lightly cooked.', { ...OGU, origin: 'Pays-Bas' }),
  v('cheddar', 'Cheddar F1', 'oleracea', ['cu', 'Or'], ['S4', 'S6'], 0.9, 80, 45, -3, ['cauliflower'], 'Chou-fleur orange riche en bêta-carotène (gène Or).', 'Orange cauliflower rich in beta-carotene (Or gene).', { ...OGU, origin: 'USA' }),
  v('or-mutant', 'Mutant Or (Ontario 1970)', 'oleracea', ['cu', 'Or'], ['S1', 'S3'], 0.6, 90, 45, -3, ['cauliflower', 'donor'], 'Le chou-fleur orange trouvé en 1970 dans un champ de l’Ontario, source du gène Or.', 'The orange cauliflower found in 1970 in an Ontario field, source of the Or gene.', { origin: 'Canada' }),
  v('verde-macerata', 'Verde di Macerata', 'oleracea', ['cu', 'Gc'], ['S2', 'S3'], 1, 100, 50, -4, ['cauliflower'], 'Chou-fleur vert pomme des Marches.', 'Apple-green cauliflower from the Marche.', { origin: 'Italie' }),
  v('romanesco', 'Romanesco', 'oleracea', ['cu', 'fr', 'Gc'], ['S4', 'S5'], 0.9, 120, 50, -4, ['cauliflower'], 'Caillé vert en pyramides fractales qui suivent la suite de Fibonacci.', 'Green curd of fractal pyramids following the Fibonacci sequence.', { origin: 'Italie' }),
  v('clapton', 'Clapton F1', 'oleracea', ['cu', 'CRa'], ['S1', 'S4'], 1.1, 100, 50, -4, ['cauliflower'], 'Premier chou-fleur résistant à la hernie, grâce à un gène de navet introduit par croisement.', 'The first clubroot-resistant cauliflower, thanks to a turnip gene brought in by crossing.', { ...OGU, origin: 'Royaume-Uni' }),
  // --- Brocolis --------------------------------------------------------------------------
  v('calabrese', 'Calabrese', 'oleracea', ['br', 'an'], ['S2', 'S6'], 0.4, 80, 60, -3, ['broccoli'], 'Le brocoli vert à grosse tête, venu de Calabre.', 'The large-headed green broccoli, from Calabria.', { origin: 'Italie' }),
  v('waltham', 'Waltham 29', 'oleracea', ['br', 'an'], ['S3', 'S4'], 0.35, 85, 60, -4, ['broccoli'], 'Brocoli d’automne du Massachusetts (1950).', 'Massachusetts autumn broccoli (1950).', { origin: 'USA' }),
  v('de-cicco', 'De Cicco', 'oleracea', ['br', 'an'], ['S1', 'S2'], 0.3, 65, 55, -3, ['broccoli'], 'Brocoli italien précoce, nombreuses pousses latérales.', 'Early Italian broccoli with many side shoots.', { origin: 'Italie' }),
  v('purple-sprouting', 'Purple Sprouting', 'oleracea', ['br', 'Pr'], ['S5', 'S6'], 0.4, 250, 90, -12, ['broccoli'], 'Brocoli à jets violets qui passe l’hiver au jardin et produit au printemps.', 'Purple sprouting broccoli that overwinters and crops in spring.', { origin: 'Angleterre' }),
  v('marathon', 'Marathon F1', 'oleracea', ['br', 'an'], ['S3', 'S6'], 0.5, 75, 60, -4, ['broccoli'], 'Hybride à tête dôme, référence des maraîchers.', 'Domed-head hybrid, a market-garden standard.', { ...OGU, origin: 'Japon' }),
  v('beneforte', 'Beneforté F1', 'oleracea', ['br', 'an', 'Gr'], ['S1', 'S5'], 0.4, 75, 60, -3, ['broccoli'], 'Brocoli riche en glucoraphanine : un allèle de MYB28 venu de Brassica villosa, chou sauvage de Sicile.', 'Glucoraphanin-rich broccoli: a MYB28 allele from Brassica villosa, a wild Sicilian brassica.', { ...F1, het: ['Gr'], origin: 'Royaume-Uni' }),
  v('ol87123', 'OL87123 (Pp523)', 'oleracea', ['br', 'an', 'Pp523'], ['S4', 'S4'], 0.3, 80, 55, -3, ['broccoli', 'donor'], 'Lignée de brocoli, source de la résistance au mildiou Pp523.', 'Broccoli line, source of the Pp523 downy mildew resistance.', { origin: 'USA' }),
  // --- Choux de Bruxelles et choux-raves -----------------------------------------------------
  v('long-island', 'Long Island Improved', 'oleracea', ['sp'], ['S2', 'S3'], 1, 150, 90, -15, ['sprouts'], 'Choux de Bruxelles : des dizaines de petites pommes le long de la tige.', 'Brussels sprouts: dozens of small heads along the stalk.', { origin: 'USA' }),
  v('groninger', 'Groninger', 'oleracea', ['sp'], ['S1', 'S6'], 1.2, 170, 100, -16, ['sprouts'], 'Variété hollandaise rustique de fin de saison.', 'Hardy late Dutch variety.', { origin: 'Pays-Bas' }),
  v('rubine', 'Rubine', 'oleracea', ['sp', 'Pr'], ['S4', 'S5'], 0.7, 160, 90, -14, ['sprouts'], 'Choux de Bruxelles rouges.', 'Red Brussels sprouts.', { origin: 'Europe' }),
  v('vienne', 'Blanc hâtif de Vienne', 'oleracea', ['Kr'], ['S2', 'S5'], 0.3, 60, 30, -4, ['kohlrabi'], 'Chou-rave vert pâle : on mange la tige renflée.', 'Pale green kohlrabi: the swollen stem is eaten.', { origin: 'Autriche' }),
  v('azur-star', 'Azur Star', 'oleracea', ['Kr', 'Pr'], ['S1', 'S3'], 0.35, 60, 30, -4, ['kohlrabi'], 'Chou-rave violet.', 'Purple kohlrabi.', { origin: 'Allemagne' }),
  v('superschmelz', 'Superschmelz', 'oleracea', ['Kr'], ['S5', 'S6'], 2, 120, 40, -6, ['kohlrabi'], 'Chou-rave géant qui reste tendre.', 'Giant kohlrabi that stays tender.', { origin: 'Allemagne' }),
  // --- Brassica rapa ----------------------------------------------------------------------------
  v('navet-milan', 'Navet de Milan', 'rapa', ['Tu'], ['S1', 'S2'], 0.15, 50, 30, -5, ['root'], 'Navet plat à collet violet, très rapide.', 'Flat purple-necked turnip, very fast.', { origin: 'Italie' }),
  v('boule-or', 'Navet Boule d’or', 'rapa', ['Tu'], ['S3', 'S4'], 0.2, 60, 30, -6, ['root'], 'Navet à chair jaune.', 'Yellow-fleshed turnip.', { origin: 'France' }),
  v('purple-top', 'Purple Top White Globe', 'rapa', ['Tu', 'Pr'], ['S2', 'S5'], 0.3, 55, 35, -6, ['root'], 'Navet rond à collet violet.', 'Round turnip with a purple shoulder.', { origin: 'USA' }),
  v('chou-chinois', 'Chou chinois Granat', 'rapa', ['He'], ['S1', 'S4'], 1.5, 70, 40, -4, ['asian'], 'Chou de Chine (pé-tsaï) pommé : B. rapa, pas B. oleracea !', 'Heading Chinese cabbage (napa): B. rapa, not B. oleracea!', { origin: 'Chine' }),
  v('pak-choi', 'Pak-choï', 'rapa', [], ['S2', 'S6'], 0.4, 45, 25, -3, ['asian'], 'Chou chinois à côtes blanches, très rapide.', 'White-stemmed Chinese cabbage, very fast.', { origin: 'Chine' }),
  v('mizuna', 'Mizuna', 'rapa', ['Cr'], ['S3', 'S5'], 0.3, 40, 25, -6, ['asian'], 'Moutarde japonaise aux feuilles très découpées (B. rapa japonica).', 'Japanese mustard with finely cut leaves (B. rapa japonica).', { origin: 'Japon' }),
  v('ecd04', 'ECD 04 (CRa)', 'rapa', ['Tu', 'CRa'], ['S4', 'S6'], 0.3, 70, 40, -8, ['root', 'donor'], 'Navet fourrager européen de la série différentielle de la hernie : source de résistance transférée au chou et au colza.', 'European fodder turnip from the clubroot differential set: resistance source transferred to cabbage and rapeseed.', { origin: 'Europe' }),
  v('fast-plants', 'Wisconsin Fast Plants', 'rapa', ['an'], SC, 0.03, 35, 15, -1, ['asian', 'donor'], 'B. rapa sélectionné pour un cycle de 35 jours graine à graine, autocompatible : la plante des salles de classe.', 'B. rapa bred for a 35-day seed-to-seed cycle, self-compatible: the classroom plant.', { origin: 'USA' }),
  // --- Autres espèces du triangle de U --------------------------------------------------------
  v('moutarde-noire', 'Moutarde noire', 'nigra', [], ['S1', 'S3'], 0.05, 100, 150, -3, ['oilseed'], 'La moutarde de Dijon d’origine, à graines noires piquantes ; génome BB.', 'The original Dijon mustard, with pungent black seeds; BB genome.', { origin: 'Europe' }),
  v('rutabaga', 'Rutabaga Joan', 'napus', ['Tu'], SC, 1, 100, 40, -10, ['root'], 'Chou-navet : B. napus (AACC), né d’un croisement navet × chou ; autocompatible comme la plupart des espèces doublées.', 'Swede: B. napus (AACC), born from a turnip × cabbage cross; self-compatible like most doubled species.', { origin: 'Europe' }),
  v('colza-hiver', 'Colza d’hiver', 'napus', [], SC, 0.08, 250, 150, -15, ['oilseed'], 'Colza oléagineux : B. napus est né il y a quelques milliers d’années d’un croisement spontané navet × chou.', 'Oilseed rape: B. napus arose a few thousand years ago from a spontaneous turnip × cabbage cross.', { origin: 'Europe' }),
  v('red-russian', 'Red Russian', 'napus', ['Pr'], SC, 0.5, 60, 60, -15, ['kale'], 'Kale de Sibérie aux nervures pourpres : c’est un B. napus, pas un chou !', 'Siberian kale with purple veins: it is B. napus, not a cabbage!', { origin: 'Russie' }),
  v('colza-ogura', 'Colza Ogura-INRA (Rfo)', 'napus', ['Rfo'], SC, 0.08, 250, 150, -15, ['oilseed', 'donor'], 'Colza à cytoplasme Ogura et restaurateur Rfo : le système de l’INRA qui produit la plupart des colzas hybrides.', 'Rapeseed with Ogura cytoplasm and the Rfo restorer: the INRA system behind most hybrid rapeseed.', { cyto: 'Ogu', origin: 'France' }),
  v('moutarde-brune', 'Moutarde brune', 'juncea', [], SC, 0.06, 90, 120, -4, ['oilseed'], 'B. juncea (AABB) : la moutarde de Dijon d’aujourd’hui.', 'B. juncea (AABB): today’s Dijon mustard.', { origin: 'Inde' }),
  v('giant-red', 'Moutarde Giant Red', 'juncea', ['Pr'], SC, 0.4, 45, 40, -8, ['asian'], 'Moutarde à feuilles pourpres et piquantes.', 'Purple, pungent leaf mustard.', { origin: 'Japon' }),
  v('green-wave', 'Moutarde Green Wave', 'juncea', ['Cr'], SC, 0.4, 45, 45, -6, ['asian'], 'Moutarde à feuilles frisées.', 'Curly-leaved mustard.', { origin: 'USA' }),
  v('carinata', 'Chou d’Éthiopie', 'carinata', [], SC, 0.4, 70, 80, -3, ['kale', 'oilseed'], 'B. carinata (BBCC), cultivé en Éthiopie pour ses feuilles et son huile.', 'B. carinata (BBCC), grown in Ethiopia for leaves and oil.', { origin: 'Éthiopie' }),
  // --- Radis -------------------------------------------------------------------------------------
  v('radis-18', 'Radis 18 jours', 'raphanus', ['Tu'], ['S1', 'S2'], 0.03, 30, 15, -2, ['root'], 'Radis rose à bout blanc, prêt en un mois.', 'Pink white-tipped radish, ready in a month.', { origin: 'France' }),
  v('daikon', 'Daïkon Minowase', 'raphanus', ['Tu'], ['S3', 'S4'], 1.2, 60, 40, -4, ['root'], 'Long radis blanc japonais.', 'Long white Japanese radish.', { origin: 'Japon' }),
  v('radis-noir', 'Radis noir rond d’hiver', 'raphanus', ['Tu'], ['S2', 'S5'], 0.4, 90, 35, -5, ['root'], 'Radis d’hiver à peau noire.', 'Black-skinned winter radish.', { origin: 'France' }),
  v('radis-ogura', 'Radis Ogura (mâle stérile)', 'raphanus', ['Tu'], ['S5', 'S6'], 0.3, 60, 35, -3, ['root', 'donor'], 'Le radis japonais mâle stérile découvert par Ogura en 1968 : son cytoplasme a été transféré au chou et au colza.', 'The male-sterile Japanese radish found by Ogura in 1968: its cytoplasm was transferred to cabbage and rapeseed.', { cyto: 'Ogu', origin: 'Japon' }),
  v('radis-kosena', 'Radis Kosena (Rfo)', 'raphanus', ['Tu', 'Rfo'], ['S1', 'S6'], 0.4, 60, 35, -3, ['root', 'donor'], 'Radis japonais porteur du restaurateur Rfo.', 'Japanese radish carrying the Rfo restorer.', { origin: 'Japon' }),
  v('raphanobrassica', 'Radis-chou de Karpechenko', 'raphanobrassica', ['Tu'], ['S2', 'S3'], 0.2, 90, 60, -5, ['donor'], 'Radis × chou doublé (1928) : Karpechenko espérait les feuilles du chou et la racine du radis… il obtint l’inverse. Mais il prouva qu’on pouvait créer une espèce fertile.', 'Doubled radish × cabbage (1928): Karpechenko hoped for cabbage leaves and radish roots… he got the reverse. But he proved a fertile species could be made.', { origin: 'URSS' }),
];

export const VARIETY_BY_ID: Record<string, BrVariety> = Object.fromEntries(BR_VARIETIES.map((x) => [x.id, x]));
