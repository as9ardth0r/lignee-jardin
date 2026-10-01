/**
 * Bibliothèque de carottes : types variétaux occidentaux (Paris, Chantenay,
 * Nantes, Danvers, Flakkee, Imperator), carottes de couleur, carottes
 * orientales, lignées de stérilité mâle, résistances, espèces sauvages.
 *
 * Sources : catalogues de semenciers (Vilmorin, Graines Baumaux,
 * Kokopelli, Agrosemens, Bejo, Johnny’s, Baker Creek), USDA Carrot
 * Breeding (P.W. Simon : Purple Haze, Brasilia et Mj-1, lignées B493…),
 * Banga 1963 (types variétaux), Stolarczyk & Janick 2011 (histoire des
 * couleurs).
 *
 * Valeurs chiffrées = ordres de grandeur (poids et longueur de la racine,
 * jours jusqu’à la récolte, °Brix). Génotypes de couleur DÉDUITS de la
 * couleur de la racine. Les variétés de population sont hétérozygotes pour
 * les caractères chiffrés ; `inbred` = lignée consanguine.
 */

import type { Cytoplasm, QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type DcKind = 'early' | 'nantes' | 'chantenay' | 'long' | 'storage' | 'colour' | 'eastern' | 'resistant' | 'stock' | 'wild';
export const DC_KINDS: DcKind[] = ['early', 'nantes', 'chantenay', 'long', 'storage', 'colour', 'eastern', 'resistant', 'stock', 'wild'];

export interface DcVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  cyto?: Cytoplasm;
  variants: VariantId[];
  het?: VariantId[];
  /** Poids de la racine (g). */
  weightG: number;
  /** Longueur de la racine (cm). */
  lengthCm: number;
  days: number;
  /** Sucres solubles (°Brix). */
  brix: number;
  kinds: DcKind[];
  hybrid?: boolean;
  /** Lignée consanguine (homozygote). */
  inbred?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<DcVariety, 'hybrid' | 'origin' | 'het' | 'cyto' | 'inbred' | 'fertility'>>;

function v(id: string, name: string, species: SpeciesId, variants: VariantId[], weightG: number, lengthCm: number, days: number, brix: number, kinds: DcKind[], fr: string, en: string, opt: Opt = {}): DcVariety {
  return { id, name, species, variants, weightG, lengthCm, days, brix, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

const FR = { origin: 'France' };
const NL = { origin: 'Pays-Bas' };
const US = { origin: 'États-Unis' };
const OR = ['y2'] as VariantId[];
const F1SP = { hybrid: true, cyto: 'Sp' as Cytoplasm, origin: 'Pays-Bas' };
const F1BA = { hybrid: true, cyto: 'Ba' as Cytoplasm, origin: 'Pays-Bas' };

export const DC_VARIETIES: DcVariety[] = [
  // --- Primeurs et rondes --------------------------------------------------------------
  v('grelot', 'Grelot (ronde de Paris)', 'sativus', OR, 40, 5, 70, 8, ['early'], 'Carotte ronde comme une balle, pour les sols lourds et caillouteux.', 'Ball-shaped carrot, for heavy and stony soils.', FR),
  v('parisian', 'Parisienne (Paris Market)', 'sativus', OR, 35, 5, 65, 8, ['early'], 'Petite carotte ronde des maraîchers parisiens du XIXe siècle.', 'Small round carrot of 19th-century Paris market gardeners.', FR),
  v('amsterdam', 'Amsterdam forcing', 'sativus', OR, 60, 12, 65, 8.5, ['early'], 'Petite, fine et très précoce, pour les semis sous châssis.', 'Small, slender and very early, for sowing under frames.', NL),
  v('touchon', 'Touchon', 'sativus', OR, 110, 17, 90, 9, ['nantes'], 'Nantaise demi-longue, cylindrique, sans cœur.', 'Half-long cylindrical Nantes type, coreless.', FR),
  // --- Nantaises et demi-longues -------------------------------------------------------
  v('nantaise-2', 'Nantaise 2', 'sativus', OR, 120, 17, 100, 9, ['nantes'], 'La carotte du jardin français : cylindrique, bout arrondi, tendre et sucrée.', 'The French garden carrot: cylindrical, blunt-tipped, tender and sweet.', FR),
  v('scarlet-nantes', 'Scarlet Nantes', 'sativus', OR, 115, 16, 95, 9.5, ['nantes'], 'Nantaise rouge-orange, très colorée.', 'Deep red-orange Nantes type.', US),
  v('napoli', 'Napoli F1', 'sativus', OR, 120, 18, 80, 9, ['nantes', 'early'], 'Hybride nantais précoce, très uniforme.', 'Early, very uniform Nantes hybrid.', F1SP),
  v('bolero', 'Bolero F1', 'sativus', [...OR, 'Alt'], 150, 18, 120, 9.5, ['nantes', 'storage', 'resistant'], 'Hybride de conservation résistant à l’alternariose.', 'Storage hybrid resistant to Alternaria leaf blight.', F1BA),
  v('nelson', 'Nelson F1', 'sativus', OR, 110, 16, 75, 9, ['nantes', 'early'], 'Nantais hybride précoce, pour la vente en botte.', 'Early Nantes hybrid, for bunching.', F1SP),
  v('mokum', 'Mokum F1', 'sativus', OR, 90, 15, 60, 10, ['nantes', 'early'], 'Très sucrée et cassante, la « carotte à croquer ».', 'Very sweet and crunchy, the “snacking carrot”.', F1SP),
  v('berlicum', 'Berlicum', 'sativus', OR, 180, 22, 120, 8.5, ['storage'], 'Longue et cylindrique, de conservation.', 'Long and cylindrical, for storage.', NL),
  // --- Chantenay, Danvers ------------------------------------------------------------------
  v('chantenay', 'Chantenay à cœur rouge', 'sativus', OR, 180, 13, 110, 8.5, ['chantenay', 'storage'], 'Courte et large, conique : pour les sols lourds, de garde.', 'Short, wide and conical: for heavy soils, keeps well.', FR),
  v('kuroda', 'Kuroda', 'sativus', OR, 220, 15, 100, 8, ['chantenay', 'eastern'], 'Type Chantenay japonais, tolère la chaleur, cultivé en Afrique et en Asie.', 'Japanese Chantenay type, heat tolerant, grown in Africa and Asia.', { origin: 'Japon' }),
  v('oxheart', 'Oxheart (Guérande)', 'sativus', OR, 300, 12, 110, 8, ['chantenay'], 'Énorme et trapue, jusqu’à 500 g.', 'Huge and stocky, up to 500 g.', FR),
  v('danvers', 'Danvers 126', 'sativus', OR, 170, 18, 110, 8.5, ['chantenay', 'storage'], 'Conique, polyvalente, pour la conserverie (Massachusetts, 1871).', 'Conical, all-purpose, for canning (Massachusetts, 1871).', US),
  // --- Longues ----------------------------------------------------------------------------
  v('flakkee', 'Flakkee (Autumn King)', 'sativus', OR, 300, 26, 140, 8, ['long', 'storage'], 'Grosse carotte d’automne et d’hiver, de très bonne garde.', 'Large autumn and winter carrot, keeps very well.', NL),
  v('st-valery', 'De Saint-Valery', 'sativus', OR, 250, 25, 130, 8.5, ['long'], 'Longue carotte ancienne, rouge-orange, de saveur fine.', 'Long heirloom carrot, red-orange, fine flavour.', FR),
  v('imperator', 'Imperator 58', 'sativus', OR, 160, 26, 110, 8, ['long'], 'Longue et effilée, la carotte des supermarchés américains.', 'Long and tapered, the American supermarket carrot.', US),
  v('rothild', 'Rothild', 'sativus', OR, 200, 22, 120, 8.5, ['long', 'storage'], 'Très riche en carotène, pour les jus.', 'Very high in carotene, for juicing.', { origin: 'Allemagne' }),
  // --- Résistances ------------------------------------------------------------------------
  v('flyaway', 'Flyaway F1', 'sativus', [...OR, 'cf'], 120, 17, 110, 9.5, ['nantes', 'resistant'], 'Peu attaquée par la mouche de la carotte (faible acide chlorogénique).', 'Rarely hit by carrot fly (low chlorogenic acid).', { hybrid: true, cyto: 'Sp', origin: 'Royaume-Uni' }),
  v('resistafly', 'Resistafly F1', 'sativus', [...OR, 'cf', 'Alt'], 130, 18, 115, 9.5, ['nantes', 'resistant'], 'Résistance partielle à la mouche et à l’alternariose.', 'Partial resistance to carrot fly and Alternaria.', { hybrid: true, cyto: 'Sp', origin: 'Royaume-Uni' }),
  v('brasilia', 'Brasilia', 'sativus', [...OR, 'Mj1', 'Alt'], 150, 16, 100, 7.5, ['chantenay', 'resistant'], 'Carotte tropicale brésilienne (1981) : chaleur, nématodes à galles (Mj-1) et alternariose.', 'Brazilian tropical carrot (1981): heat, root-knot nematodes (Mj-1) and Alternaria.', { origin: 'Brésil' }),
  // --- Couleurs -----------------------------------------------------------------------------
  v('jaune-doubs', 'Jaune du Doubs', 'sativus', [], 250, 22, 130, 7.5, ['colour', 'storage'], 'Carotte jaune ancienne, longue et grosse ; jadis aussi fourragère.', 'Long, large heirloom yellow carrot; once also a fodder carrot.', FR),
  v('solar-yellow', 'Solar Yellow', 'sativus', [], 130, 18, 100, 8.5, ['colour'], 'Jaune citron vif (lutéine).', 'Bright lemon yellow (lutein).', US),
  v('blanche-collet-vert', 'Blanche à collet vert', 'sativus', ['Y'], 350, 28, 140, 6.5, ['colour', 'storage'], 'Grosse carotte blanche fourragère : Y dominant, comme la carotte sauvage.', 'Large white fodder carrot: dominant Y, like wild carrot.', FR),
  v('kuttiger', 'Küttiger', 'sativus', ['Y'], 200, 20, 120, 7.5, ['colour'], 'Carotte blanche suisse d’Argovie, sauvée par ProSpecieRara.', 'White Swiss carrot from Aargau, saved by ProSpecieRara.', { origin: 'Suisse' }),
  v('lunar-white', 'Lunar White', 'sativus', ['Y'], 120, 20, 90, 8, ['colour'], 'Blanche et douce, sans amertume.', 'White and mild, not bitter.', US),
  v('kintoki', 'Kintoki', 'sativus', [...OR, 'l'], 180, 25, 120, 9, ['colour', 'eastern'], 'Carotte rouge japonaise, colorée par le lycopène comme la tomate ; cuisinée au Nouvel An.', 'Red Japanese carrot, coloured by lycopene like tomato; cooked at New Year.', { origin: 'Japon' }),
  v('atomic-red', 'Atomic Red', 'sativus', [...OR, 'l'], 150, 22, 90, 8.5, ['colour'], 'Rouge vif, encore plus rouge à la cuisson.', 'Bright red, even redder when cooked.', US),
  v('purple-haze', 'Purple Haze F1', 'sativus', [...OR, 'P1'], 130, 20, 80, 9.5, ['colour'], 'Peau violette, cœur orange : P1 sans Px (USDA, P.W. Simon).', 'Purple skin, orange core: P1 without Px (USDA, P.W. Simon).', { hybrid: true, cyto: 'Sp', origin: 'États-Unis' }),
  v('cosmic-purple', 'Cosmic Purple', 'sativus', [...OR, 'P1'], 110, 18, 90, 9, ['colour'], 'Violette dehors, orange dedans.', 'Purple outside, orange inside.', US),
  v('dragon', 'Dragon', 'sativus', [...OR, 'P1'], 140, 20, 95, 9, ['colour'], 'Peau rouge-violet, cœur orange-jaune.', 'Red-purple skin, orange-yellow core.', US),
  v('black-nebula', 'Black Nebula', 'sativus', ['P1', 'Px'], 120, 20, 100, 9, ['colour'], 'Violet presque noir jusqu’au cœur (P1 + Px) ; colore l’eau de cuisson.', 'Nearly black purple to the core (P1 + Px); dyes the cooking water.', US),
  v('pusa-asita', 'Pusa Asita', 'sativus', ['P1', 'Px', 'Vrn1'], 150, 22, 90, 8, ['colour', 'eastern'], 'Carotte noire indienne de type oriental, annuelle (Vrn1) : fleurit dès la première année.', 'Black Indian carrot of eastern type, annual (Vrn1): flowers in its first year.', { origin: 'Inde' }),
  v('afghane', 'Carotte violette afghane', 'sativus', ['P1', 'Px', 'Vrn1', 'Y'], 80, 18, 100, 7, ['colour', 'eastern'], 'Variété de pays d’Afghanistan, berceau de la carotte cultivée : racine violette, annuelle, souvent ramifiée.', 'Landrace from Afghanistan, cradle of the cultivated carrot: purple, annual, often branched root.', { origin: 'Afghanistan' }),
  v('turque-jaune', 'Carotte jaune turque', 'sativus', ['Vrn1'], 100, 18, 100, 7.5, ['colour', 'eastern'], 'Carotte orientale jaune, ancêtre des carottes jaunes d’Europe.', 'Yellow eastern carrot, ancestor of European yellow carrots.', { origin: 'Turquie' }),
  // --- Lignées et stocks ------------------------------------------------------------------
  v('lignee-sp', 'Lignée mâle stérile pétaloïde (Sp)', 'sativus', OR, 90, 16, 100, 9, ['stock'], 'Lignée consanguine à cytoplasme pétaloïde : étamines changées en pétales. Mère d’hybrides F1, à croiser avec une lignée « mainteneuse » ou un père pollinisateur.', 'Inbred line with petaloid cytoplasm: stamens turned into petals. Mother of F1 hybrids, to be crossed with a “maintainer” line or a pollinator father.', { cyto: 'Sp', inbred: true, origin: 'États-Unis' }),
  v('lignee-ba', 'Lignée mâle stérile brown anther (Ba)', 'sativus', OR, 90, 16, 100, 9, ['stock'], 'Lignée consanguine à cytoplasme « brown anther » : anthères brunes et vides.', 'Inbred line with “brown anther” cytoplasm: brown, empty anthers.', { cyto: 'Ba', inbred: true, origin: 'États-Unis' }),
  v('lignee-b', 'Lignée mainteneuse (B)', 'sativus', OR, 85, 16, 100, 9.5, ['stock'], 'Lignée consanguine fertile, cytoplasme normal : le « mainteneur » qui, croisé avec la lignée Sp, reproduit la lignée mâle stérile. Chétive, comme toute carotte consanguine.', 'Fertile inbred line with normal cytoplasm: the “maintainer” which, crossed with the Sp line, reproduces the male-sterile line. Puny, like every inbred carrot.', { inbred: true, origin: 'États-Unis' }),
  v('lignee-rfp', 'Lignée restauratrice (Rfp)', 'sativus', [...OR, 'Rfp'], 85, 16, 100, 9, ['stock'], 'Porte le restaurateur Rfp : ses hybrides avec une mère pétaloïde ont des étamines normales.', 'Carries the Rfp restorer: its hybrids with a petaloid mother have normal stamens.', { inbred: true, origin: 'États-Unis' }),
  // --- Espèces sauvages ---------------------------------------------------------------------
  v('carotte-sauvage', 'Carotte sauvage', 'carota', ['Y'], 8, 12, 150, 5, ['wild'], 'Dentelle de la reine Anne : racine blanche et ligneuse, fleur centrale pourpre ; elle pollinise les porte-graines du voisinage.', 'Queen Anne’s lace: white woody root, purple central flower; it pollinates nearby seed crops.', FR),
  v('carotte-sauvage-annuelle', 'Carotte sauvage annuelle', 'carota', ['Y', 'Vrn1'], 6, 10, 120, 5, ['wild'], 'Population sauvage annuelle (Vrn1) du Midi.', 'Annual (Vrn1) wild population from southern France.', FR),
  v('carotte-de-mer', 'Carotte de mer (gummifer)', 'gummifer', ['Y'], 12, 10, 160, 5.5, ['wild'], 'Carotte sauvage des falaises bretonnes, feuilles épaisses et luisantes.', 'Wild carrot of Breton cliffs, thick glossy leaves.', FR),
  v('capillifolius', 'Daucus capillifolius', 'capillifolius', ['Y', 'Vrn1'], 6, 10, 110, 5, ['wild'], 'Sauvage d’Afrique du Nord (2n = 18) qui se croise avec la carotte ; source de diversité.', 'North African wild species (2n = 18) that crosses with carrot; a source of diversity.', { origin: 'Libye' }),
  v('pusillus', 'Daucus pusillus', 'pusillus', ['Y', 'Vrn1'], 6, 6, 100, 4, ['wild'], 'Petite carotte sauvage d’Amérique, 2n = 22 : aucun croisement possible avec la carotte.', 'Small American wild carrot, 2n = 22: no cross possible with carrot.', US),
];

export const VARIETY_BY_ID: Record<string, DcVariety> = Object.fromEntries(DC_VARIETIES.map((x) => [x.id, x]));
