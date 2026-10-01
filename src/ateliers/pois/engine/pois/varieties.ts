/**
 * Bibliothèque de pois : lignées « de Mendel », petits pois, mangetout,
 * pois gourmands, pois protéagineux et fourragers, curiosités et espèces
 * sauvages.
 *
 * Sources : catalogues de semenciers (Vilmorin, Graines Baumaux, Kokopelli,
 * Thompson & Morgan, Johnny’s), catalogue officiel des protéagineux
 * (Terres Inovia), John Innes Pisum collection, USDA GRIN (PI 193586 et
 * sbm1 ; Mexique 4 et er1), Fondevilla et al. 2007 (P. fulvum et Er3).
 *
 * Valeurs chiffrées = ordres de grandeur (graines sèches par plante, jours
 * jusqu’à la récolte des graines, hauteur réelle, poids de 100 graines).
 * Génotypes DÉDUITS de l’aspect avec le modèle de loci.ts. Le pois est
 * autogame : les variétés sont des lignées fixées.
 */

import type { QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type PsKind = 'mendel' | 'shelling' | 'snow' | 'snap' | 'field' | 'fodder' | 'heirloom' | 'curiosity' | 'wild';
export const PS_KINDS: PsKind[] = ['mendel', 'shelling', 'snow', 'snap', 'field', 'fodder', 'heirloom', 'curiosity', 'wild'];

export interface PsVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  variants: VariantId[];
  het?: VariantId[];
  /** Graines sèches par plante (g). */
  weightG: number;
  days: number;
  /** Hauteur réelle (cm). */
  heightCm: number;
  /** Poids de 100 graines (g). */
  seed100: number;
  kinds: PsKind[];
  hybrid?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<PsVariety, 'hybrid' | 'origin' | 'het' | 'fertility'>>;

function v(id: string, name: string, species: SpeciesId, variants: VariantId[], weightG: number, days: number, heightCm: number, seed100: number, kinds: PsKind[], fr: string, en: string, opt: Opt = {}): PsVariety {
  return { id, name, species, variants, weightG, days, heightCm, seed100, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

const FR = { origin: 'France' };
const UK = { origin: 'Royaume-Uni' };
const US = { origin: 'États-Unis' };
const MENDEL = { origin: 'Brno (stock)' };

export const PS_VARIETIES: PsVariety[] = [
  // --- Lignées de Mendel ----------------------------------------------------------------
  v('mendel-rond-jaune', 'Rond jaune (lignée de Mendel)', 'sativum', [], 40, 100, 180, 22, ['mendel'], 'Graines rondes à cotylédons jaunes, fleurs blanches, gousses vertes et pleines, fleurs axillaires, tige longue : tous les allèles dominants de Mendel sauf A.', 'Round yellow seeds, white flowers, green inflated pods, axial flowers, tall stem: all of Mendel’s dominant alleles except A.', MENDEL),
  v('mendel-ride-vert', 'Ridé vert (lignée de Mendel)', 'sativum', ['r', 'i'], 35, 100, 170, 20, ['mendel'], 'Graines ridées et vertes : croisée avec « Rond jaune », elle donne la célèbre F2 9 : 3 : 3 : 1 (Mendel : 315 : 108 : 101 : 32).', 'Wrinkled green seeds: crossed with “Round yellow”, it gives the famous 9:3:3:1 F2 (Mendel: 315:108:101:32).', MENDEL),
  v('mendel-pourpre', 'Fleurs pourpres (lignée de Mendel)', 'sativum', ['A'], 40, 100, 180, 22, ['mendel'], 'Fleurs pourpres et tégument gris-brun.', 'Purple flowers and grey-brown seed coat.', MENDEL),
  v('mendel-etrangle', 'Gousse étranglée (lignée de Mendel)', 'sativum', ['v'], 35, 100, 180, 20, ['mendel'], 'Gousse sans parchemin, étranglée entre les graines.', 'Pod without parchment, pinched between the seeds.', MENDEL),
  v('mendel-gousse-jaune', 'Gousse jaune (lignée de Mendel)', 'sativum', ['gp'], 38, 100, 180, 22, ['mendel'], 'Gousses jaunes.', 'Yellow pods.', MENDEL),
  v('mendel-terminal', 'Fleurs terminales (lignée de Mendel)', 'sativum', ['fa'], 35, 105, 160, 22, ['mendel'], 'Tige fasciée, fleurs en bouquet au sommet.', 'Fasciated stem, flowers clustered at the top.', MENDEL),
  v('mendel-nain', 'Nain (lignée de Mendel)', 'sativum', ['le'], 30, 95, 45, 22, ['mendel'], 'Tige naine : Mendel compte 787 longues pour 277 naines en F2.', 'Dwarf stem: Mendel counted 787 tall to 277 dwarf in the F2.', MENDEL),
  v('mendel-testeur', 'Testeur récessif (6 caractères)', 'sativum', ['r', 'i', 'v', 'gp', 'fa', 'le'], 25, 100, 40, 18, ['mendel'], 'Récessif pour six des sept caractères de Mendel : idéal pour un croisement-test (rétrocroisement), où chaque gène ségrège en 1 : 1.', 'Recessive for six of Mendel’s seven traits: ideal for a test cross (backcross), where each gene segregates 1:1.', MENDEL),
  // --- Petits pois à écosser --------------------------------------------------------------
  v('kelvedon-wonder', 'Merveille de Kelvedon', 'sativum', ['r', 'i', 'le'], 28, 90, 45, 22, ['shelling'], 'Petit pois nain ridé, très sucré, classique des jardins.', 'Sweet, wrinkled dwarf pea, a garden classic.', UK),
  v('progress-9', 'Progress n° 9', 'sativum', ['r', 'i', 'le', 'Fw'], 30, 85, 45, 24, ['shelling'], 'Nain ridé à grosses gousses, résistant à la fusariose.', 'Wrinkled dwarf with large pods, Fusarium-resistant.', US),
  v('little-marvel', 'Little Marvel', 'sativum', ['r', 'i', 'le'], 26, 85, 45, 21, ['shelling', 'heirloom'], 'Nain ridé de 1900, gousses par paires.', 'Wrinkled dwarf from 1900, pods in pairs.', UK),
  v('douce-provence', 'Douce Provence', 'sativum', ['i', 'le', 'Hr'], 26, 200, 50, 20, ['shelling'], 'Grain rond, rustique : se sème à l’automne dans le Midi.', 'Round-seeded and hardy: sown in autumn in southern France.', FR),
  v('feltham-first', 'Feltham First', 'sativum', ['le', 'Hr'], 25, 200, 45, 20, ['shelling'], 'Rond et rustique, pour les semis d’automne.', 'Round and hardy, for autumn sowing.', UK),
  v('meteor', 'Meteor', 'sativum', ['le', 'Hr', 'i'], 24, 195, 40, 19, ['shelling'], 'Un des plus rustiques au froid.', 'One of the hardiest in cold weather.', UK),
  v('serpette', 'Serpette Guilloteaux', 'sativum', ['i'], 38, 110, 120, 23, ['shelling', 'heirloom'], 'Grain rond, gousses arquées en serpette, demi-rames.', 'Round seed, sickle-shaped pods, half-tall.', FR),
  v('alderman', 'Alderman (Téléphone)', 'sativum', ['r', 'i'], 55, 120, 180, 28, ['shelling', 'heirloom'], 'Pois à rames ridé, tardif, très grosses gousses (1891).', 'Tall wrinkled pea, late, huge pods (1891).', UK),
  v('champion-of-england', 'Champion of England', 'sativum', ['r', 'i'], 50, 120, 200, 26, ['shelling', 'heirloom'], 'L’un des premiers pois ridés « marrowfat » (1843) : Mendel aurait pu le cultiver.', 'One of the first wrinkled “marrowfat” peas (1843): Mendel could have grown it.', UK),
  v('hurst-green-shaft', 'Hurst Green Shaft', 'sativum', ['r', 'i', 'Fw'], 38, 105, 75, 23, ['shelling'], 'Gousses longues par paires, résistant à la fusariose.', 'Long paired pods, Fusarium-resistant.', UK),
  v('onward', 'Onward', 'sativum', ['r', 'i', 'le', 'Fw'], 32, 100, 60, 24, ['shelling'], 'Nain ridé, résistant à la fusariose.', 'Wrinkled dwarf, Fusarium-resistant.', UK),
  v('ambassador', 'Ambassador', 'sativum', ['r', 'i', 'le', 'er1', 'Fw'], 32, 100, 60, 23, ['shelling'], 'Nain ridé résistant à l’oïdium (er1) et à la fusariose : pour les semis tardifs.', 'Wrinkled dwarf resistant to powdery mildew (er1) and Fusarium: for late sowings.', UK),
  v('twinkle', 'Twinkle', 'sativum', ['r', 'i', 'le', 'Fw'], 24, 80, 45, 20, ['shelling'], 'Très précoce.', 'Very early.', UK),
  v('markana', 'Markana', 'sativum', ['r', 'i', 'le', 'af'], 30, 100, 60, 22, ['shelling'], 'Semi-aphylle (afila) : les plantes se tiennent entre elles, sans rames.', 'Semi-leafless (afila): plants hold each other up, no sticks.', { origin: 'Pays-Bas' }),
  v('tom-thumb', 'Tom Thumb', 'sativum', ['le'], 12, 80, 20, 18, ['shelling', 'heirloom'], 'Minuscule pois rond (vers 1850), cultivable en pot.', 'Tiny round pea (about 1850), grows in a pot.', UK),
  v('lincoln', 'Lincoln', 'sativum', ['r', 'i'], 35, 105, 70, 22, ['shelling', 'heirloom'], 'Ridé, très sucré (1908).', 'Wrinkled, very sweet (1908).', UK),
  v('maro', 'Maro (marrowfat)', 'sativum', ['i'], 45, 110, 80, 38, ['shelling'], 'Gros grains ronds verts pour les « mushy peas » et les pois secs.', 'Large round green seeds for “mushy peas” and dried peas.', UK),
  // --- Mangetout et pois gourmands ------------------------------------------------------
  v('carouby', 'Carouby de Maussane', 'sativum', ['v', 'A'], 40, 110, 180, 22, ['snow', 'heirloom'], 'Mangetout à rames, fleurs pourpres, larges gousses plates.', 'Tall snow pea, purple flowers, wide flat pods.', FR),
  v('golden-sweet', 'Golden Sweet', 'sativum', ['v', 'gp', 'A'], 35, 105, 180, 20, ['snow', 'heirloom'], 'Mangetout à gousses jaune citron et fleurs bicolores, retrouvé sur un marché indien.', 'Snow pea with lemon-yellow pods and bicolour flowers, found at an Indian market.', { origin: 'Inde' }),
  v('corne-de-belier', 'Corne de bélier', 'sativum', ['v'], 40, 110, 170, 24, ['snow', 'heirloom'], 'Mangetout à rames, gousses larges et tordues.', 'Tall snow pea, wide twisted pods.', FR),
  v('norli', 'Norli', 'sativum', ['v', 'le'], 25, 85, 50, 18, ['snow'], 'Mangetout nain, précoce.', 'Early dwarf snow pea.', { origin: 'Pays-Bas' }),
  v('dwarf-grey-sugar', 'Dwarf Grey Sugar', 'sativum', ['v', 'A', 'le'], 25, 85, 60, 20, ['snow', 'heirloom'], 'Mangetout nain à fleurs pourpres (vers 1770).', 'Dwarf snow pea with purple flowers (about 1770).', US),
  v('sugar-snap', 'Sugar Snap', 'sativum', ['v', 'n', 'r'], 40, 105, 180, 23, ['snap'], 'Le premier pois gourmand (Lamborn, 1979) : gousse sans parchemin (v) ET épaisse (n), croquante.', 'The first snap pea (Lamborn, 1979): pod without parchment (v) AND thick (n), crunchy.', US),
  v('sugar-ann', 'Sugar Ann', 'sativum', ['v', 'n', 'r', 'le'], 26, 85, 55, 22, ['snap'], 'Pois gourmand nain, précoce.', 'Early dwarf snap pea.', US),
  v('cascadia', 'Cascadia', 'sativum', ['v', 'n', 'r', 'le', 'er1'], 28, 90, 70, 22, ['snap'], 'Pois gourmand nain résistant à l’oïdium.', 'Dwarf snap pea resistant to powdery mildew.', US),
  v('super-sugar-snap', 'Super Sugar Snap', 'sativum', ['v', 'n', 'r', 'er1'], 40, 105, 150, 23, ['snap'], 'Sugar Snap amélioré, résistant à l’oïdium.', 'Improved Sugar Snap, powdery-mildew resistant.', US),
  // --- Protéagineux et fourragers -----------------------------------------------------------
  v('kayanne', 'Kayanne', 'sativum', ['af', 'le'], 45, 115, 70, 25, ['field'], 'Pois protéagineux de printemps, afila, graines jaunes rondes riches en protéines.', 'Spring field pea, afila, round yellow protein-rich seeds.', FR),
  v('astronaute', 'Astronaute', 'sativum', ['af', 'le'], 48, 110, 70, 27, ['field'], 'Protéagineux de printemps, afila, tenue de tige.', 'Spring field pea, afila, good standing.', FR),
  v('isard', 'Isard', 'sativum', ['af', 'le', 'Hr'], 50, 230, 80, 18, ['field'], 'Pois protéagineux d’hiver (Hr) : semé en novembre, il passe l’hiver en rosette.', 'Winter field pea (Hr): sown in November, it overwinters as a rosette.', FR),
  v('arvense', 'Pois fourrager d’hiver', 'sativum', ['A', 'Hr'], 30, 230, 150, 14, ['fodder'], 'Pois « arvense » à fleurs pourpres et graines tachetées, semé avec du seigle ou de l’avoine.', '“Arvense” pea with purple flowers and speckled seeds, sown with rye or oats.', FR),
  v('kapuziner', 'Capucijner', 'sativum', ['A'], 40, 115, 160, 26, ['fodder', 'heirloom'], 'Pois gris des Pays-Bas, cuisiné sec, fleurs pourpres, tégument brun.', 'Dutch grey pea, cooked dry, purple flowers, brown seed coat.', { origin: 'Pays-Bas' }),
  // --- Curiosités --------------------------------------------------------------------------------
  v('pois-a-bouquet', 'Pois à bouquet (Mummy)', 'sativum', ['fa', 'A'], 30, 110, 120, 22, ['curiosity', 'heirloom'], 'Fleurs en bouquet au sommet d’une tige fasciée ; la légende le dit trouvé dans un tombeau égyptien.', 'Flowers clustered on top of a fasciated stem; legend says it was found in an Egyptian tomb.', UK),
  v('pois-persil', 'Pois persil', 'sativum', ['af', 'tl'], 25, 100, 90, 20, ['curiosity'], 'af + tl : feuillage finement découpé comme du persil, se mange en pousses.', 'af + tl: finely cut, parsley-like foliage, eaten as shoots.', UK),
  v('pois-acacia', 'Pois acacia', 'sativum', ['tl'], 30, 100, 120, 22, ['curiosity'], 'tl : pas de vrilles, des folioles à la place ; la plante ne grimpe plus.', 'tl: no tendrils, leaflets instead; the plant no longer climbs.', UK),
  // --- Donneurs de résistance -----------------------------------------------------------------
  v('mexique-4', 'Mexique 4 (er1)', 'sativum', ['er1'], 30, 110, 150, 20, ['mendel'], 'Lignée mexicaine source de er1, la résistance durable à l’oïdium.', 'Mexican line, source of er1, durable powdery mildew resistance.', { origin: 'Mexique' }),
  v('pi193586', 'PI 193586 (sbm1)', 'sativum', ['sbm1', 'A'], 28, 115, 140, 18, ['mendel'], 'Lignée éthiopienne résistante au virus de la mosaïque transmis par les semences (eIF4E).', 'Ethiopian line resistant to seed-borne mosaic virus (eIF4E).', { origin: 'Éthiopie' }),
  // --- Espèces sauvages et cousines ------------------------------------------------------------
  v('elatius', 'Pois sauvage (elatius)', 'elatius', ['A', 'Hr'], 10, 170, 200, 8, ['wild'], 'L’ancêtre du pois : grimpant, gousses qui éclatent, graines dures et petites.', 'The pea’s ancestor: climbing, shattering pods, small hard seeds.', { origin: 'Turquie' }),
  v('fulvum', 'Pisum fulvum', 'fulvum', ['A', 'er3'], 8, 150, 140, 6, ['wild'], 'Fleurs orangées ; source de Er3 contre l’oïdium et de résistance aux bruches. Se croise mieux quand le pois cultivé est la mère.', 'Orange flowers; source of Er3 against powdery mildew and of bruchid resistance. Crosses best with garden pea as mother.', { origin: 'Israël' }),
  v('abyssinicum', 'Pisum abyssinicum', 'abyssinicum', ['A'], 18, 75, 70, 10, ['wild'], 'Pois d’Éthiopie domestiqué à part, très précoce ; hybrides peu fertiles avec le pois commun.', 'Ethiopian pea domesticated separately, very early; hybrids with common pea have low fertility.', { origin: 'Éthiopie' }),
];

export const VARIETY_BY_ID: Record<string, PsVariety> = Object.fromEntries(PS_VARIETIES.map((x) => [x.id, x]));
