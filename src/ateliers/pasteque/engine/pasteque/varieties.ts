/**
 * Bibliothèque de variétés de pastèques (5 espèces de Citrullus).
 *
 * Il n’existe pas de base de données ouverte des génotypes de variétés de
 * pastèques : ce catalogue est compilé à la main d’après des catalogues de
 * semenciers (Baker Creek, Seed Savers Exchange, Johnny’s, Kokopelli,
 * Southern Exposure), les descriptions variétales des programmes publics
 * (USDA, universités de Floride, de Caroline du Nord et d’Auburn) et, pour
 * les gènes et les lignées donneuses, la liste des gènes du Cucurbit
 * Genetics Cooperative (Guner & Wehner 2004 ; Wehner 2008).
 *
 * Valeurs chiffrées = ordres de grandeur. Génotypes = DÉDUITS du phénotype
 * (couleur de la chair et de l’écorce, forme, couleur des graines) avec le
 * modèle simplifié de loci.ts. Les résistances ne sont attribuées qu’aux
 * variétés où elles sont publiées ou annoncées par le semencier. Les
 * hybrides F1 ont un génotype supposé ; les pastèques sans pépins sont
 * des triploïdes (3x) stériles.
 */

import type { QuantTraitId } from './engine';
import type { Ploidy } from './compat';
import type { SpeciesId, VariantId } from './loci';

export type WmKind = 'picnic' | 'icebox' | 'colored' | 'seedless' | 'heirloom' | 'egusi' | 'citron' | 'donor';
export const WM_KINDS: WmKind[] = ['picnic', 'icebox', 'colored', 'seedless', 'heirloom', 'egusi', 'citron', 'donor'];

export interface WmVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  ploidy?: Ploidy;
  variants: VariantId[];
  /** Poids moyen d’un fruit (kg). */
  weightKg: number;
  /** Sucre de la chair (°Brix). */
  brix: number;
  /** Jours du semis à la première récolte. */
  days: number;
  /** Fruits par plante. */
  fruits: number;
  kinds: WmKind[];
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<WmVariety, 'hybrid' | 'origin' | 'ploidy'>>;

function v(
  id: string,
  name: string,
  species: SpeciesId,
  variants: VariantId[],
  weightKg: number,
  brix: number,
  days: number,
  fruits: number,
  kinds: WmKind[],
  fr: string,
  en: string,
  opt: Opt = {}
): WmVariety {
  return { id, name, species, variants, weightKg, brix, days, fruits, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

// Raccourcis : écorce foncée, rayée ; fruit long ; résistances Fusarium + anthracnose
const DK: VariantId = 'G';
const ST: VariantId = 'gs';
const L: VariantId = 'O';
const FA: VariantId[] = ['Fo1', 'Ar1'];

export const WM_VARIETIES: WmVariety[] = [
  // --- Grosses pastèques rouges (« picnic ») ---------------------------------
  v('crimson-sweet', 'Crimson Sweet', 'lanatus', [ST, ...FA], 11, 11.5, 85, 2, ['picnic'], 'La pastèque ronde rayée la plus cultivée au monde (Kansas, 1963) : chair rouge vif très sucrée, résistante à la fusariose et à l’anthracnose.', 'The world’s most grown round striped watermelon (Kansas, 1963): bright red, very sweet flesh, Fusarium- and anthracnose-resistant.', { origin: 'USA' }),
  v('charleston-gray', 'Charleston Gray', 'lanatus', [L, ...FA], 12, 10.5, 90, 2, ['picnic'], 'Longue pastèque à écorce gris-vert clair (USDA, 1954), première grande variété résistante à la fusariose et à l’anthracnose.', 'Long light grey-green watermelon (USDA, 1954), the first major Fusarium- and anthracnose-resistant variety.', { origin: 'USA' }),
  v('jubilee', 'Jubilee', 'lanatus', [ST, L, ...FA], 14, 10.5, 95, 2, ['picnic'], 'Grande pastèque longue rayée de Floride (1963), chair rouge ferme.', 'Large long striped watermelon from Florida (1963), firm red flesh.', { origin: 'USA' }),
  v('allsweet', 'Allsweet', 'lanatus', [ST, L, ...FA], 13, 11.5, 95, 2, ['picnic'], 'Longue, rayée en zigzag, réputée pour sa chair très sucrée jusqu’à l’écorce.', 'Long, zigzag-striped, famous for flesh sweet right to the rind.', { origin: 'USA' }),
  v('congo', 'Congo', 'lanatus', [ST, L, 'Ar1'], 15, 10.5, 95, 2, ['picnic'], 'Première variété résistante à l’anthracnose (USDA, 1949), gène Ar-1 venu d’Africa 8.', 'The first anthracnose-resistant variety (USDA, 1949), Ar-1 from Africa 8.', { origin: 'USA' }),
  v('fairfax', 'Fairfax', 'lanatus', [ST, L, 'Ar1'], 14, 10.5, 95, 2, ['picnic'], 'Longue rayée résistante à l’anthracnose (USDA, 1952).', 'Long striped, anthracnose-resistant (USDA, 1952).', { origin: 'USA' }),
  v('calhoun-gray', 'Calhoun Gray', 'lanatus', [L, ...FA], 12, 11, 90, 2, ['picnic'], 'Version améliorée de Charleston Gray (Louisiane, 1965).', 'Improved Charleston Gray (Louisiana, 1965).', { origin: 'USA' }),
  v('dixielee', 'Dixielee', 'lanatus', [ST, ...FA], 10, 11.5, 90, 2, ['picnic'], 'Ronde rayée de Floride (1979), chair rouge foncé croquante.', 'Round striped from Florida (1979), crisp dark red flesh.', { origin: 'USA' }),
  v('black-diamond', 'Black Diamond', 'lanatus', [DK], 18, 10, 90, 2, ['picnic'], 'Énorme pastèque ronde vert presque noir, chair rouge.', 'Huge round almost-black watermelon, red flesh.', { origin: 'USA' }),
  v('florida-giant', 'Florida Giant', 'lanatus', [DK, L], 20, 10, 95, 1, ['picnic'], 'Variante allongée de Black Diamond, très grosse.', 'An elongated, very large Black Diamond type.', { origin: 'USA' }),
  v('carolina-cross', 'Carolina Cross #183', 'lanatus', [ST, L, 't'], 35, 9.5, 100, 1, ['picnic', 'heirloom'], 'La variété des records (plus de 100 kg au concours) ; graines brun clair. Pour les longues saisons.', 'The record-breaker (over 100 kg in competitions); tan seeds. For long seasons.', { origin: 'USA' }),
  v('klondike-striped', 'Klondike Striped Blue Ribbon', 'lanatus', [ST, L, 'e'], 11, 11, 90, 2, ['picnic', 'heirloom'], 'Klondike à écorce fine et cassante : elle éclate sous le couteau (gène e).', 'Klondike with a thin, brittle rind that bursts under the knife (e gene).', { origin: 'USA' }),
  v('kleckley-sweet', 'Kleckley Sweet (Monte Cristo)', 'lanatus', [DK, L, 'e'], 11, 11.5, 90, 2, ['heirloom'], 'Ancienne variété (1897) à écorce mince, trop fragile pour le commerce, délicieuse au jardin.', 'An 1897 heirloom with a thin rind, too fragile to ship, delicious in the garden.', { origin: 'USA' }),
  v('tom-watson', 'Tom Watson', 'lanatus', [ST, L, 't'], 15, 10.5, 95, 2, ['heirloom'], 'Longue variété géorgienne de 1906, graines brun clair.', 'Long Georgia heirloom from 1906, tan seeds.', { origin: 'USA' }),
  v('georgia-rattlesnake', 'Georgia Rattlesnake', 'lanatus', [ST, L, 't'], 14, 11, 95, 2, ['heirloom'], 'Rayures sinueuses « peau de serpent » (années 1830).', 'Wavy “snakeskin” stripes (1830s).', { origin: 'USA' }),
  v('bradford', 'Bradford', 'lanatus', [ST, L, 'e'], 13, 11.5, 95, 2, ['heirloom'], 'Légendaire pastèque de Caroline du Sud (1840), sauvée par la famille Bradford ; écorce tendre.', 'Legendary South Carolina melon (1840), saved by the Bradford family; tender rind.', { origin: 'USA' }),
  v('peacock-improved', 'Peacock Improved', 'lanatus', [DK, L], 10, 11, 88, 2, ['picnic'], 'Longue, vert foncé uni, chair rouge.', 'Long, solid dark green, red flesh.', { origin: 'USA' }),
  v('mountain-hoosier', 'Mountain Hoosier', 'lanatus', [DK], 15, 10.5, 90, 2, ['heirloom'], 'Grosse ronde vert foncé de l’Indiana.', 'Large round dark green from Indiana.', { origin: 'USA' }),
  v('ali-baba', 'Ali Baba', 'lanatus', [L], 12, 11, 90, 2, ['heirloom'], 'Pastèque irakienne ovale-longue à écorce vert clair, très vigoureuse.', 'An oval-long Iraqi watermelon with a light green rind, very vigorous.', { origin: 'Irak' }),
  v('astrakhanski', 'Astrakhanski', 'lanatus', [ST], 8, 10.5, 85, 2, ['heirloom'], 'Ronde rayée de la Volga, classique russe.', 'Round striped from the Volga, a Russian classic.', { origin: 'Russie' }),
  v('densuke', 'Densuke', 'lanatus', [DK], 8, 11.5, 85, 2, ['heirloom'], 'La pastèque noire de Hokkaido, vendue aux enchères à prix d’or.', 'Hokkaido’s black watermelon, auctioned at sky-high prices.', { origin: 'Japon' }),
  v('moon-and-stars', 'Moon and Stars (Cherokee)', 'lanatus', [DK, 'Sp', L, 't'], 12, 10.5, 95, 2, ['heirloom'], 'Écorce vert foncé constellée de « lunes et étoiles » jaunes, jusque sur les feuilles (gène Sp). Redécouverte en 1980.', 'Dark rind spangled with yellow “moon and stars”, even on the leaves (Sp gene). Rediscovered in 1980.', { origin: 'USA' }),
  v('sangria', 'Sangria F1', 'lanatus', [ST, L, ...FA], 10, 12, 88, 2, ['picnic'], 'Hybride longue rayée, très sucrée.', 'Long striped hybrid, very sweet.', { hybrid: true, origin: 'USA' }),
  v('sweet-princess', 'Sweet Princess', 'lanatus', [ST, L, 'ts'], 10, 11.5, 88, 2, ['picnic'], 'Graines minuscules qu’on avale sans s’en rendre compte (type « tomato seed »).', 'Tiny seeds you swallow without noticing (“tomato seed” type).', { origin: 'USA' }),
  // --- Petites pastèques (« icebox ») ---------------------------------------
  v('sugar-baby', 'Sugar Baby', 'lanatus', [DK], 3.5, 10.5, 75, 3, ['icebox'], 'La petite ronde vert noir des jardins (1955), précoce, chair rouge.', 'The small round black-green garden classic (1955), early, red flesh.', { origin: 'USA' }),
  v('blacktail-mountain', 'Blacktail Mountain', 'lanatus', [DK], 4, 11, 70, 3, ['icebox'], 'Sélectionnée dans l’Idaho par un adolescent pour les étés courts et frais.', 'Bred in Idaho by a teenager for short, cool summers.', { origin: 'USA' }),
  v('ogonek', 'Ogonek (« petite lumière »)', 'lanatus', [DK], 2, 10.5, 70, 4, ['icebox', 'heirloom'], 'Petite pastèque russe très précoce pour les climats frais.', 'Very early small Russian watermelon for cool climates.', { origin: 'Russie' }),
  v('golden-midget', 'Golden Midget', 'lanatus', ['go'], 1.5, 10, 65, 4, ['icebox'], 'Minuscule, son écorce vire au jaune d’or quand elle est mûre (gène go) : impossible de rater la récolte.', 'Tiny; its rind turns golden yellow when ripe (go gene): you can’t miss harvest time.', { origin: 'USA' }),
  v('bush-sugar-baby', 'Bush Sugar Baby', 'lanatus', [DK, 'dw'], 3, 10.5, 80, 2, ['icebox'], 'Sugar Baby en port nain (dw-1) : tiges courtes pour les petits jardins.', 'Sugar Baby on a dwarf (dw-1) plant: short vines for small gardens.', { origin: 'USA' }),
  v('bush-charleston-gray', 'Bush Charleston Gray', 'lanatus', [L, 'dw', ...FA], 9, 10.5, 90, 2, ['picnic'], 'Charleston Gray en port nain.', 'A dwarf-habit Charleston Gray.', { origin: 'USA' }),
  v('mini-love', 'Mini Love F1', 'lanatus', [ST], 3, 12, 70, 4, ['icebox'], 'Mini-pastèque hybride à écorce fine, tolérante au froid.', 'Hybrid mini watermelon with a thin rind, cold-tolerant.', { hybrid: true, origin: 'USA' }),
  // --- Chairs jaunes, orange, blanches ----------------------------------------
  v('yellow-doll', 'Yellow Doll F1', 'lanatus', [ST, 'C'], 3.5, 11, 70, 3, ['colored', 'icebox'], 'Petite hybride à chair jaune canari (gène C).', 'Small hybrid with canary yellow flesh (C gene).', { hybrid: true, origin: 'USA' }),
  v('early-moonbeam', 'Early Moonbeam', 'lanatus', [ST, 'C'], 3, 11, 70, 3, ['colored', 'icebox'], 'Petite rayée à chair jaune, sélection paysanne de l’Oregon.', 'Small striped with yellow flesh, an Oregon farmer’s selection.', { origin: 'USA' }),
  v('desert-king', 'Desert King', 'lanatus', ['C', 't'], 8, 11, 85, 2, ['colored'], 'Écorce vert très pâle, chair jaune, résiste à la sécheresse et se garde longtemps sur pied.', 'Very pale green rind, yellow flesh, drought-hardy and holds well in the field.', { origin: 'USA' }),
  v('petite-yellow', 'Petite Yellow', 'lanatus', ['C'], 2, 10.5, 70, 4, ['colored', 'icebox'], 'Mini ronde vert clair à chair jaune.', 'Light green round mini with yellow flesh.', { origin: 'USA' }),
  v('yellow-moon-and-stars', 'Moon and Stars à chair jaune', 'lanatus', [DK, 'Sp', 'C', L, 't'], 10, 10.5, 95, 2, ['colored', 'heirloom'], 'Moon and Stars à chair jaune canari.', 'Canary-yellow-fleshed Moon and Stars.', { origin: 'USA' }),
  v('orangeglo', 'Orangeglo', 'lanatus', [ST, L, 'yo'], 12, 11.5, 90, 2, ['colored', 'heirloom'], 'Chair orange vif (allèle y-o) au goût tropical.', 'Bright orange flesh (y-o allele) with a tropical taste.', { origin: 'USA' }),
  v('tendersweet-orange', 'Tendersweet Orange', 'lanatus', [ST, L, 'yo'], 15, 11, 90, 2, ['colored'], 'Grosse longue rayée à chair orange.', 'Large long striped with orange flesh.', { origin: 'USA' }),
  v('sweet-siberian', 'Sweet Siberian', 'lanatus', ['yo'], 4, 11, 75, 3, ['colored', 'icebox', 'heirloom'], 'Petite pastèque russe à chair abricot, pour les étés courts.', 'Small Russian melon with apricot flesh, for short summers.', { origin: 'Russie' }),
  v('golden-honey', 'Golden Honey', 'lanatus', [ST, 'y'], 8, 10.5, 88, 2, ['colored', 'heirloom'], 'Chair jaune saumon (allèle y, récessif), la lignée de référence de ce gène.', 'Salmon yellow flesh (recessive y allele), the reference line for this gene.', { origin: 'USA' }),
  v('cream-of-saskatchewan', 'Cream of Saskatchewan', 'lanatus', [ST, 'Wf'], 4, 10, 80, 3, ['colored', 'heirloom'], 'Chair blanc crème (Wf), écorce fine ; apportée au Canada par des immigrants russes.', 'Cream-white flesh (Wf), thin rind; brought to Canada by Russian immigrants.', { origin: 'Canada' }),
  // --- Sans pépins (triploïdes) -------------------------------------------------
  v('tri-x-313', 'Tri-X 313 (sans pépins)', 'lanatus', [ST, L], 7, 11.5, 90, 2, ['seedless'], 'Hybride triploïde, la variété qui a lancé les pastèques sans pépins : stérile, il lui faut un pollinisateur diploïde à côté.', 'Triploid hybrid, the variety that launched seedless watermelons: sterile, it needs a diploid pollinizer nearby.', { hybrid: true, ploidy: 3, origin: 'USA' }),
  v('millionaire', 'Millionaire (sans pépins)', 'lanatus', [ST], 7, 11.5, 88, 2, ['seedless'], 'Triploïde ronde rayée.', 'Round striped triploid.', { hybrid: true, ploidy: 3, origin: 'USA' }),
  v('mini-seedless', 'Mini sans pépins (type)', 'lanatus', [DK], 2.5, 12, 80, 3, ['seedless', 'icebox'], 'Mini-pastèque triploïde à écorce foncée (type générique des « personal size »).', 'Dark-rinded triploid mini (generic “personal size” type).', { hybrid: true, ploidy: 3 }),
  // --- Lignées donneuses ------------------------------------------------------------
  v('sugar-baby-gms', 'Sugar Baby gms', 'lanatus', [DK, 'gms'], 3.5, 10.5, 75, 3, ['donor'], 'Mutant glabre mâle stérile trouvé dans Sugar Baby (Watts 1962) : plantes sans poils et sans pollen, mères idéales pour les hybrides.', 'Glabrous male-sterile mutant found in Sugar Baby (Watts 1962): hairless, pollenless plants, ideal hybrid mothers.', { origin: 'USA' }),
  v('andro-line', 'Lignée andromonoïque (a)', 'lanatus', [ST, 'a'], 6, 10.5, 85, 2, ['donor'], 'Lignée type porteuse du gène a (fleurs femelles à étamines), rare dans les variétés du commerce mais présente dans les collections.', 'A model line carrying the a gene (stamens in female flowers), rare in commercial varieties but present in collections.'),
  v('au-producer', 'AU-Producer', 'lanatus', [ST, 'Fo1', 'db'], 10, 11, 90, 2, ['donor', 'picnic'], 'Variété d’Auburn tolérante à la pourriture gommeuse (hérédité simplifiée ici en un gène) et à la fusariose.', 'Auburn variety tolerant to gummy stem blight (simplified here to one gene) and Fusarium.', { origin: 'USA' }),
  // --- C. mucosospermus (égousi) ------------------------------------------------------
  v('egusi', 'Égousi', 'mucosospermus', ['Wf', 'eg', 'w', ST], 2, 3, 100, 6, ['egusi'], 'Cultivé en Afrique de l’Ouest pour ses graines blanches à enveloppe charnue (eg), grillées ou moulues en soupe ; chair blanche fade.', 'Grown in West Africa for its white, fleshy-coated seeds (eg), roasted or ground for soup; bland white flesh.', { origin: 'Nigeria' }),
  v('egusi-bara', 'Égousi « bara »', 'mucosospermus', ['Wf', 'eg', 'w'], 3, 3, 105, 5, ['egusi'], 'Type à grosses graines, cultivé en association avec l’igname et le maïs.', 'Large-seeded type, intercropped with yam and maize.', { origin: 'Nigeria' }),
  v('pi-595203', 'PI 595203 (Egun)', 'mucosospermus', ['Wf', 'eg', 'w', 'zym'], 2, 3, 100, 6, ['egusi', 'donor'], 'Égousi du Nigeria, source de la résistance au ZYMV (zym, gène eIF4E).', 'Nigerian egusi, source of ZYMV resistance (zym, eIF4E gene).', { origin: 'Nigeria' }),
  // --- C. amarus (citre) -----------------------------------------------------------------
  v('citron-red-seed', 'Citre à graines rouges', 'amarus', ['Wf', 'r', ST], 4, 3, 110, 6, ['citron'], 'Pastèque à confiture : chair blanche dure, peu sucrée, qui se garde des mois ; graines rouges (r). Confitures et fruits confits.', 'Preserving melon: hard, barely sweet white flesh that keeps for months; red seeds (r). For jams and candied peel.', { origin: 'Afrique australe' }),
  v('tsamma', 'Tsamma (Kalahari)', 'amarus', ['Wf', 't', ST], 3, 3.5, 110, 8, ['citron'], 'Melon d’eau sauvage du Kalahari, réserve d’eau des hommes et des animaux du désert.', 'Wild Kalahari melon, a water store for desert people and animals.', { origin: 'Botswana' }),
  v('pi-189225', 'PI 189225', 'amarus', ['Wf', 'db', 't'], 2.5, 3, 110, 6, ['citron', 'donor'], 'Citre du Zimbabwe, source de résistance à la pourriture gommeuse (db).', 'Zimbabwean citron, source of gummy stem blight resistance (db).', { origin: 'Zimbabwe' }),
  // --- C. colocynthis et C. ecirrhosus (sauvages) ---------------------------------------
  v('colocynth', 'Coloquinte', 'colocynthis', ['Bi', 'Wf', 't', ST], 0.3, 2, 110, 25, ['donor'], 'L’ancêtre amer et toxique (Bi) des déserts d’Afrique du Nord et d’Asie : une poignée de petites boules rayées par plante. Ne pas consommer.', 'The bitter, toxic (Bi) wild relative from North African and Asian deserts: lots of small striped balls per plant. Do not eat.', { origin: 'Sahara' }),
  v('colocynth-india', 'Coloquinte d’Inde (indrayan)', 'colocynthis', ['Bi', 'Wf', 't'], 0.4, 2, 110, 20, ['donor'], 'Forme indienne, utilisée en médecine traditionnelle (purgatif violent).', 'Indian form, used in traditional medicine (a violent purgative).', { origin: 'Inde' }),
  v('ecirrhosus', 'Pastèque du Namib', 'ecirrhosus', ['Bi', 'Wf', 't'], 0.6, 2.5, 120, 10, ['donor'], 'Vivace sans vrilles du désert du Namib, amère ; parent sauvage étudié pour sa résistance à la sécheresse.', 'Tendril-less, bitter perennial of the Namib desert; a wild relative studied for drought tolerance.', { origin: 'Namibie' }),
];

export const VARIETY_BY_ID: Record<string, WmVariety> = Object.fromEntries(WM_VARIETIES.map((x) => [x.id, x]));
