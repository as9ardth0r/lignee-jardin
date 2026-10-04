/**
 * Bibliothèque de pois de senteur : variétés anciennes (« grandiflora »,
 * très parfumées), Spencer à grandes fleurs ondulées, naines Cupid,
 * lignées historiques de Bateson et Punnett, gesses voisines.
 *
 * Sources : catalogues de semenciers spécialisés (Owl’s Acre, Roger Parsons,
 * Kings Seeds, Thompson & Morgan, Graines Baumaux), National Sweet Pea
 * Society, Bateson, Saunders & Punnett (1905-1908), Norton (1996, histoire
 * du pois de senteur), Hammett (L. belinensis).
 *
 * Valeurs chiffrées = ordres de grandeur. Les génotypes de couleur sont
 * DÉDUITS de la couleur des fleurs : sauf les lignées de Bateson, aucune
 * analyse publiée ne les donne variété par variété. Le pois de senteur
 * étant autogame, les variétés sont des lignées (inbred).
 */

import type { QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type LoKind = 'cut' | 'bedding' | 'dwarf' | 'heirloom' | 'novelty' | 'resistant' | 'lab' | 'wild';
export const LO_KINDS: LoKind[] = ['cut', 'heirloom', 'dwarf', 'novelty', 'lab', 'wild'];

export interface LoVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  variants: VariantId[];
  het?: VariantId[];
  sAlleles?: [string, string];
  /** Hauteur en fleur (cm). */
  heightCm: number;
  /** Fleurs par tige. */
  florets: number;
  /** Jours du semis à la floraison. */
  days: number;
  /** Parfum (0 à 10). */
  scent: number;
  kinds: LoKind[];
  hybrid?: boolean;
  inbred?: boolean;
  hypothesis?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<LoVariety, 'hybrid' | 'origin' | 'het' | 'inbred' | 'fertility' | 'sAlleles' | 'hypothesis' | 'hybridWith'>>;

function v(id: string, name: string, species: SpeciesId, variants: VariantId[], heightCm: number, florets: number, days: number, scent: number, kinds: LoKind[], fr: string, en: string, opt: Opt = {}): LoVariety {
  return { id, name, species, variants, heightCm, florets, days, scent, kinds, notes: { fr, en }, source: 'curated', inbred: true, hypothesis: true, ...opt };
}

// Raccourcis de couleur (modèle simplifié de l’intensité : D foncé > Dm moyen > d clair)
const MAROON: VariantId[] = [];
const PURPLE: VariantId[] = ['dm'];
const LAVENDER: VariantId[] = ['d'];
const RED: VariantId[] = ['b'];
const PINK: VariantId[] = ['b', 'dm'];
const BLUSH: VariantId[] = ['b', 'd'];
const WHITE: VariantId[] = ['c'];
const SPENCER: VariantId[] = ['wav'];
const UK = { origin: 'Royaume-Uni' };

export const LO_VARIETIES: LoVariety[] = [
  // --- Anciennes (grandiflora), très parfumées -----------------------------------------------
  v('cupani', 'Cupani', 'odoratus', [...MAROON, 'Bi'], 180, 3, 110, 10, ['heirloom'], 'La forme d’origine, envoyée de Sicile en 1699 par le moine Francesco Cupani : étendard bordeaux, ailes violettes, parfum intense.', 'The original form, sent from Sicily in 1699 by the monk Francesco Cupani: maroon standard, violet wings, intense scent.', { origin: 'Italie' }),
  v('matucana', 'Matucana', 'odoratus', [...MAROON, 'Bi'], 180, 3, 110, 10, ['heirloom'], 'Très proche de Cupani, bordeaux et violet, l’un des plus parfumés.', 'Very close to Cupani, maroon and violet, one of the most fragrant.', UK),
  v('painted-lady', 'Painted Lady', 'odoratus', [...PINK, 'Bi'], 180, 3, 105, 9, ['heirloom'], 'Étendard rose, ailes blanc rosé ; cultivé depuis 1737.', 'Pink standard, blush-white wings; grown since 1737.', UK),
  v('black-knight', 'Black Knight', 'odoratus', [...MAROON], 180, 3, 110, 9, ['heirloom'], 'Bordeaux presque noir (Eckford, 1898), très parfumé.', 'Almost black maroon (Eckford, 1898), very fragrant.', UK),
  v('dorothy-eckford', 'Dorothy Eckford', 'odoratus', WHITE, 180, 4, 105, 8, ['heirloom'], 'Blanc pur (1903), grandes fleurs parfumées.', 'Pure white (1903), large fragrant flowers.', UK),
  v('lord-nelson', 'Lord Nelson', 'odoratus', [...PURPLE], 180, 4, 110, 8, ['heirloom'], 'Bleu marine profond (1907).', 'Deep navy blue (1907).', UK),
  v('janet-scott', 'Janet Scott', 'odoratus', [...PINK], 180, 4, 105, 8, ['heirloom'], 'Rose clair saumoné, ancienne américaine (1903).', 'Light salmon pink, an old American type (1903).', { origin: 'États-Unis' }),
  v('king-edward', 'King Edward VII', 'odoratus', [...RED], 180, 4, 110, 8, ['heirloom'], 'Cramoisi vif (1903).', 'Bright crimson (1903).', UK),
  v('flora-norton', 'Flora Norton', 'odoratus', LAVENDER, 180, 4, 105, 8, ['heirloom'], 'Bleu lavande clair (1904).', 'Light lavender blue (1904).', UK),
  // --- Spencer à grandes fleurs ondulées ----------------------------------------------------
  v('countess-spencer', 'Countess Spencer', 'odoratus', [...PINK, ...SPENCER], 200, 4, 115, 5, ['cut', 'heirloom'], 'La première Spencer (1901), rose aux pétales ondulés, trouvée par Silas Cole à Althorp : elle a donné toutes les variétés de concours.', 'The first Spencer (1901), pink with waved petals, found by Silas Cole at Althorp: the ancestor of all show varieties.', UK),
  v('white-frills', 'White Frills', 'odoratus', [...WHITE, ...SPENCER], 200, 5, 115, 6, ['cut'], 'Blanc pur très ondulé, fleur à couper.', 'Pure white, very frilly, cut flower.', UK),
  v('royal-wedding', 'Royal Wedding', 'odoratus', [...WHITE, ...SPENCER], 200, 5, 115, 7, ['cut'], 'Grand blanc parfumé pour bouquets de mariage.', 'Large fragrant white for wedding bouquets.', UK),
  v('gwendoline', 'Gwendoline', 'odoratus', [...PINK, ...SPENCER], 200, 5, 115, 5, ['cut'], 'Rose lilacé tendre.', 'Soft lilac pink.', UK),
  v('mrs-bolton', 'Mrs R. Bolton', 'odoratus', [...BLUSH, ...SPENCER], 200, 4, 115, 6, ['cut', 'heirloom'], 'Rose pâle sur fond crème, Spencer ancienne (1924).', 'Pale pink on cream, an old Spencer (1924).', UK),
  v('winston-churchill', 'Winston Churchill', 'odoratus', [...RED, ...SPENCER], 200, 4, 115, 5, ['cut'], 'Cramoisi éclatant.', 'Brilliant crimson.', UK),
  v('midnight', 'Midnight', 'odoratus', [...MAROON, ...SPENCER], 200, 4, 115, 6, ['cut'], 'Bordeaux très sombre, presque noir.', 'Very dark maroon, almost black.', UK),
  v('oban-bay', 'Oban Bay', 'odoratus', [...PURPLE, ...SPENCER], 200, 5, 115, 6, ['cut'], 'Bleu moyen.', 'Mid blue.', UK),
  v('charlies-angel', 'Charlie’s Angel', 'odoratus', [...LAVENDER, ...SPENCER], 200, 5, 115, 6, ['cut'], 'Bleu lavande clair, parfumé.', 'Light lavender blue, fragrant.', UK),
  v('juliet', 'Juliet', 'odoratus', [...BLUSH, ...SPENCER], 200, 5, 115, 6, ['cut'], 'Rose saumon très pâle.', 'Very pale salmon pink.', UK),
  // --- Naines -------------------------------------------------------------------------------------
  v('cupid-pink', 'Cupid Pink', 'odoratus', [...PINK, 'Bi', 'cu'], 25, 3, 95, 7, ['dwarf', 'heirloom'], 'Pois de senteur nain rampant (1895), rose et blanc : bordures, pots, suspensions.', 'Dwarf trailing sweet pea (1895), pink and white: edging, pots, baskets.', { origin: 'États-Unis' }),
  v('cupid-white', 'Cupid White', 'odoratus', [...WHITE, 'cu'], 25, 3, 95, 7, ['dwarf'], 'Version blanche du nain Cupid.', 'White version of the Cupid dwarf.', { origin: 'États-Unis' }),
  v('little-sweetheart', 'Little Sweetheart (mélange)', 'odoratus', ['cu'], 25, 3, 95, 6, ['dwarf'], 'Mélange nain buissonnant de couleurs variées.', 'Bushy dwarf mixture in varied colours.', { het: ['b', 'd', 'c'], inbred: false }),
  // --- Lignées historiques de Bateson ---------------------------------------------------------------
  v('emily-henderson', 'Emily Henderson (blanc c)', 'odoratus', ['c', 'dm'], 170, 3, 105, 7, ['lab', 'heirloom'], 'Blanc de la fin du XIXe siècle utilisé par Bateson. Croisé avec le « blanc r », il donne une F1 pourpre et une F2 9 : 7.', 'Late-19th-century white used by Bateson. Crossed with the “white r”, it gives a purple F1 and a 9 : 7 F2.', { origin: 'États-Unis' }),
  v('white-r', 'Blanc r (lignée de Bateson)', 'odoratus', ['r', 'l', 'dm'], 170, 3, 105, 7, ['lab'], 'Second blanc, porteur de r : la complémentation C × R reconstitue une fleur pourpre.', 'Second white, carrying r: C × R complementation restores a purple flower.', UK),
  v('purple-long', 'Pourpre, pollen long (BL)', 'odoratus', PURPLE, 170, 3, 105, 8, ['lab'], 'Lignée de l’expérience de liaison : B et L sur le même chromosome.', 'Line from the linkage experiment: B and L on the same chromosome.', UK),
  v('red-round', 'Rouge, pollen rond (bl)', 'odoratus', [...RED, 'l'], 170, 3, 105, 8, ['lab'], 'Partenaire de la lignée BL : F2 avec 3 fois trop de pourpres à pollen long et de rouges à pollen rond par rapport à 9 : 3 : 3 : 1.', 'Partner of the BL line: F2 with three times too many purple-long and red-round plants compared with 9 : 3 : 3 : 1.', UK),
  v('hooded', 'Étendard en capuchon (hooded)', 'odoratus', [...PINK, 'h'], 170, 3, 105, 7, ['lab', 'novelty'], 'Étendard replié en capuchon, récessif (Bateson et Punnett).', 'Standard folded into a hood, recessive (Bateson and Punnett).', UK),
  // --- Gesses -------------------------------------------------------------------------------------------
  v('belinensis', 'Lathyrus belinensis', 'belinensis', ['b', 'Yel'], 100, 2, 100, 2, ['wild'], 'Gesse découverte en 1987 près de Belin (Turquie) : étendard rouge orangé, ailes jaunes. Se croise avec le pois de senteur.', 'Vetchling found in 1987 near Belin (Turkey): orange-red standard, yellow wings. Crosses with sweet pea.', { origin: 'Turquie', hypothesis: true }),
  v('chloranthus', 'Lathyrus chloranthus', 'chloranthus', ['c', 'Yel'], 120, 3, 100, 1, ['wild'], 'Fleurs jaune verdâtre ; croisements difficiles.', 'Greenish-yellow flowers; difficult crosses.', { origin: 'Arménie' }),
  v('tingitanus', 'Gesse de Tanger', 'tingitanus', [], 150, 2, 100, 1, ['wild'], 'Magenta, annuelle d’Afrique du Nord ; pas d’hybride fertile avec le pois de senteur.', 'Magenta North African annual; no fertile hybrid with sweet pea.', { origin: 'Maroc' }),
  v('latifolius', 'Pois vivace', 'latifolius', ['b'], 200, 8, 120, 0, ['wild'], 'Grimpante vivace rose, sans parfum, très rustique ; ne se croise pas avec le pois de senteur.', 'Pink perennial climber, unscented, very hardy; does not cross with sweet pea.', { origin: 'Europe' }),
  v('sativus', 'Gesse commune', 'sativus', ['d'], 60, 1, 90, 0, ['wild'], 'Légumineuse alimentaire à fleurs bleues ou blanches ; graines toxiques en excès (lathyrisme). Aucun croisement.', 'A pulse with blue or white flowers; seeds toxic in excess (lathyrism). No cross.', { origin: 'Méditerranée' }),
];

export const VARIETY_BY_ID: Record<string, LoVariety> = Object.fromEntries(LO_VARIETIES.map((x) => [x.id, x]));
