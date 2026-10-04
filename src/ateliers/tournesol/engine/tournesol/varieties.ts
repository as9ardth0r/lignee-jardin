/**
 * Bibliothèque de tournesols : variétés à bouquet sans pollen, variétés
 * ramifiées de jardin, géants, nains et doubles, tournesols oléagineux,
 * lignées publiques de l’USDA, tournesols sauvages et espèces voisines.
 *
 * Sources : catalogues de semenciers (Takii pour la série Sunrich, Sakata
 * pour ProCut, Johnny’s Selected Seeds, Graines Baumaux, Kokopelli),
 * USDA-ARS (lignées HA et RHA), Cockerell (1912, tournesol rouge), Chapman
 * et al. (2012, fleurs doubles), Terres Inovia (tournesol oléagineux).
 *
 * Valeurs chiffrées = ordres de grandeur ; « florets » = diamètre du
 * capitule (cm), « scent » = remplissage en graines (0 à 10). Les
 * génotypes sont DÉDUITS de l’aspect des fleurs. Les hybrides F1 « sans
 * pollen » du commerce sont en réalité à stérilité mâle cytoplasmique :
 * ici, modèle nucléaire ms1.
 */

import type { QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type HaKind = 'cut' | 'giant' | 'seed' | 'dwarf' | 'heirloom' | 'novelty' | 'resistant' | 'lab' | 'wild';
export const HA_KINDS: HaKind[] = ['cut', 'giant', 'seed', 'dwarf', 'heirloom', 'novelty', 'resistant', 'lab', 'wild'];

export interface HaVariety {
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
  /** Diamètre du capitule (cm). */
  florets: number;
  /** Jours du semis à la floraison. */
  days: number;
  /** Remplissage en graines (0 à 10). */
  scent: number;
  kinds: HaKind[];
  hybrid?: boolean;
  inbred?: boolean;
  hypothesis?: boolean;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  createdAt?: number;
}

type Opt = Partial<Pick<HaVariety, 'hybrid' | 'origin' | 'het' | 'inbred' | 'fertility' | 'sAlleles' | 'hypothesis' | 'hybridWith'>>;

function v(id: string, name: string, species: SpeciesId, variants: VariantId[], heightCm: number, florets: number, days: number, scent: number, kinds: HaKind[], fr: string, en: string, opt: Opt = {}): HaVariety {
  return { id, name, species, variants, heightCm, florets, days, scent, kinds, notes: { fr, en }, source: 'curated', inbred: true, hypothesis: true, ...opt };
}

const F1 = { hybrid: true, inbred: false } as const;
const WILDPOP = { inbred: false } as const;

export const HA_VARIETIES: HaVariety[] = [
  // --- À bouquet, sans pollen (hybrides F1) -----------------------------------------------------
  v('procut-orange', 'ProCut Orange', 'annuus', ['Or', 'ms'], 150, 14, 58, 3, ['cut'], 'Le grand classique des fleuristes : une tige, un capitule orangé à cœur foncé, sans pollen. Semer toutes les deux semaines pour couper tout l’été.', 'The florists’ classic: one stem, one orange head with a dark disc, pollenless. Sow every two weeks to cut all summer.', { ...F1, origin: 'Japon' }),
  v('procut-lemon', 'ProCut Lemon', 'annuus', ['ly', 'ms'], 150, 14, 58, 3, ['cut'], 'Jaune citron à cœur foncé, sans pollen, très précoce.', 'Lemon yellow with a dark disc, pollenless, very early.', { ...F1, origin: 'Japon' }),
  v('procut-bicolor', 'ProCut Bicolor', 'annuus', ['ms'], 150, 14, 60, 3, ['cut'], 'Ligules rouges à la base, jaunes au bout : un hybride hétérozygote Rd/rd. On ne fixe pas une plante bicolore : sa descendance donne 1 rouge, 2 bicolores, 1 jaune.', 'Rays red at the base, yellow at the tip: an Rd/rd heterozygous hybrid. A bicolour cannot be fixed: its offspring give 1 red, 2 bicolour, 1 yellow.', { ...F1, het: ['Rd'], origin: 'Japon' }),
  v('procut-red', 'ProCut Red', 'annuus', ['Rd', 'ms'], 150, 13, 60, 3, ['cut'], 'Rouge profond à cœur foncé, sans pollen.', 'Deep red with a dark disc, pollenless.', { ...F1, origin: 'Japon' }),
  v('claret', 'Claret', 'annuus', ['Rd', 'Or', 'ms'], 170, 14, 65, 3, ['cut'], 'Rouge acajou presque noir, sans pollen.', 'Almost black mahogany red, pollenless.', { ...F1, origin: 'Royaume-Uni' }),
  v('sunrich-orange', 'Sunrich Orange', 'annuus', ['Or', 'ms'], 160, 15, 62, 3, ['cut'], 'Série Sunrich : tige droite, capitule tourné vers le haut, sans pollen.', 'Sunrich series: straight stem, upward-facing head, pollenless.', { ...F1, origin: 'Japon' }),
  v('vincents-fresh', 'Vincent’s Fresh', 'annuus', ['Or', 'ms', 'p'], 150, 14, 60, 3, ['cut'], 'Orangé à cœur vert clair, sans pollen.', 'Orange with a light green disc, pollenless.', { ...F1, origin: 'Pays-Bas' }),
  v('white-nite', 'ProCut White Nite', 'annuus', ['cr', 'ms', 'p'], 150, 13, 60, 3, ['cut', 'novelty'], 'Ligules crème et cœur clair : le plus pâle des tournesols à bouquet.', 'Cream rays and a light disc: the palest cut-flower sunflower.', { ...F1, origin: 'Japon' }),
  // --- Ramifiés de jardin ------------------------------------------------------------------------
  v('lemon-queen', 'Lemon Queen', 'annuus', ['ly', 'b'], 200, 12, 80, 5, ['cut', 'heirloom'], 'Très ramifié, des dizaines de capitules citron à cœur foncé ; adoré des bourdons (étude « Great Sunflower Project »).', 'Highly branched, dozens of lemon heads with a dark disc; loved by bumblebees (the “Great Sunflower Project”).', { origin: 'États-Unis' }),
  v('velvet-queen', 'Velvet Queen', 'annuus', ['Rd', 'b'], 180, 12, 80, 5, ['cut', 'heirloom'], 'Ramifié, ligules rouge velouté.', 'Branched, velvety red rays.', { origin: 'Europe' }),
  v('evening-sun', 'Evening Sun', 'annuus', ['b'], 200, 13, 80, 6, ['cut', 'heirloom'], 'Mélange de teintes rouges, bronze et jaunes : population en ségrégation.', 'Mix of red, bronze and yellow shades: a segregating population.', { ...F1, het: ['Rd'] }),
  v('autumn-beauty', 'Autumn Beauty', 'annuus', ['b'], 180, 13, 80, 6, ['cut', 'heirloom'], 'Mélange ancien : jaune, orangé, bronze, rouge.', 'Old mix: yellow, orange, bronze, red.', { ...F1, het: ['Rd', 'Or'] }),
  v('strawberry-blonde', 'Strawberry Blonde', 'annuus', ['ly', 'b'], 180, 12, 80, 5, ['cut', 'novelty'], 'Ligules rosées à pointe citron : rouge en une dose sur fond citron.', 'Pinkish rays with lemon tips: one dose of red on a lemon background.', { ...F1, het: ['Rd'] }),
  v('italian-white', 'Italian White', 'debilis', ['cr', 'b'], 150, 10, 75, 4, ['cut', 'heirloom'], 'Tournesol à feuilles de concombre aux ligules crème et cœur foncé, très ramifié.', 'Cucumberleaf sunflower with cream rays and a dark disc, very branched.', { origin: 'Italie' }),
  // --- Géants et oléagineux ------------------------------------------------------------------------
  v('mammoth', 'Géant de Russie (Mammoth)', 'annuus', [], 300, 30, 90, 9, ['giant', 'seed', 'heirloom'], 'Tige unique de 3 m, capitule de 30 cm penché à maturité ; graines striées à croquer.', 'Single 3 m stem, 30 cm head that nods when ripe; striped seeds for eating.', { origin: 'Russie' }),
  v('titan', 'Titan', 'annuus', [], 330, 40, 95, 9, ['giant', 'seed'], 'Capitule énorme, jusqu’à 40 cm et plus ; tuteurer.', 'Huge head, up to 40 cm and more; stake it.', { origin: 'États-Unis' }),
  v('american-giant', 'American Giant', 'annuus', [], 400, 28, 95, 8, ['giant'], 'Hybride très haut (4 m) à tige épaisse qui verse peu.', 'Very tall hybrid (4 m) with a thick stem that rarely lodges.', { ...F1, origin: 'États-Unis' }),
  v('peredovik', 'Peredovik', 'annuus', [], 170, 22, 85, 9, ['seed', 'heirloom'], 'Variété oléagineuse de Pustovoit (URSS, 1950) : riche en huile, base de l’essor du tournesol en Europe ; graines noires.', 'Pustovoit’s oilseed variety (USSR, 1950): rich in oil, the basis of sunflower’s rise in Europe; black seeds.', { origin: 'Russie' }),
  v('oil-hybrid', 'Hybride oléagineux résistant', 'annuus', ['Pl'], 160, 20, 90, 9, ['seed', 'resistant'], 'Type des hybrides cultivés en plein champ : résistant au mildiou, homogène, capitules bien remplis.', 'Typical field hybrid: downy mildew resistant, uniform, well-filled heads.', { ...F1, origin: 'France' }),
  // --- Nains et doubles ------------------------------------------------------------------------------
  v('teddy-bear', 'Teddy Bear', 'annuus', ['Dbl', 'dw', 'b'], 80, 12, 70, 1, ['dwarf', 'novelty'], 'Capitules entièrement doubles, en pompon : le « nounours ». Pas de cœur, presque pas de graines.', 'Fully double pompom heads: the “teddy bear”. No disc, hardly any seed.', { origin: 'États-Unis' }),
  v('sungold', 'Sungold (double)', 'annuus', ['Dbl', 'b'], 180, 15, 80, 1, ['novelty', 'heirloom'], 'Ancien tournesol double de grande taille.', 'Old tall double sunflower.', { origin: 'États-Unis' }),
  v('double-dandy', 'Double Dandy', 'annuus', ['Rd', 'ms', 'dw', 'b'], 60, 12, 65, 1, ['dwarf', 'novelty'], 'Nain, rouge, semi-double et sans pollen : hétérozygote Dbl/dbl.', 'Dwarf, red, semi-double and pollenless: Dbl/dbl heterozygous.', { ...F1, het: ['Dbl'] }),
  v('big-smile', 'Big Smile', 'annuus', ['dw'], 50, 12, 55, 5, ['dwarf'], 'Nain de 40 à 50 cm, un capitule doré ; en pot.', '40–50 cm dwarf, one golden head; for pots.', { origin: 'Japon' }),
  v('sunspot', 'Sunspot', 'annuus', ['dw'], 60, 25, 75, 8, ['dwarf', 'seed'], 'Nain à très grand capitule : graines pour les oiseaux.', 'Dwarf with a very large head: seed for the birds.', { origin: 'États-Unis' }),
  v('music-box', 'Music Box', 'annuus', ['dw', 'b'], 70, 11, 70, 4, ['dwarf'], 'Nain ramifié, mélange de jaunes, bronzes et rouges.', 'Branched dwarf, mix of yellows, bronzes and reds.', { ...F1, het: ['Rd', 'ly'] }),
  // --- Lignées publiques et de laboratoire --------------------------------------------------------------
  v('ha-89', 'HA 89 (lignée mainteneuse)', 'annuus', [], 140, 18, 80, 8, ['lab'], 'Lignée publique (USDA, d’après VNIIMK 8931) : tige unique, très utilisée comme parent femelle. Lignée consanguine : vigueur réduite.', 'Public line (USDA, from VNIIMK 8931): single stem, widely used as a female parent. Inbred: reduced vigour.', { origin: 'États-Unis' }),
  v('rha-271', 'RHA 271 (lignée restauratrice)', 'annuus', ['b'], 130, 10, 75, 7, ['lab'], 'Lignée restauratrice ramifiée (USDA) : beaucoup de capitules, donc du pollen longtemps. Croisée avec HA 89 : hybride à tige unique et vigoureux.', 'Branched restorer line (USDA): many heads, so pollen for a long time. Crossed with HA 89: a single-stemmed, vigorous hybrid.', { origin: 'États-Unis' }),
  v('ha-335', 'HA 335 (Pl)', 'annuus', ['Pl'], 140, 17, 80, 8, ['lab', 'resistant'], 'Lignée publique porteuse d’un gène de résistance au mildiou (type Pl6).', 'Public line carrying a downy mildew resistance gene (Pl6 type).', { origin: 'États-Unis' }),
  v('lab-ms1', 'Lignée ms1 (sans pollen)', 'annuus', ['ms'], 150, 18, 80, 8, ['lab'], 'Stérilité mâle nucléaire récessive : ne peut être que mère. Croisée avec une sœur porteuse Ms/ms, elle donne moitié de plantes sans pollen : c’est ainsi qu’on la maintient.', 'Recessive nuclear male sterility: can only be a mother. Crossed with a carrier sister (Ms/ms) it gives half pollenless plants: that is how it is kept.', { origin: 'France' }),
  v('lab-lemon-light', 'Citron à cœur clair', 'annuus', ['ly', 'p'], 160, 16, 75, 7, ['lab'], 'Lignée double récessive : citron et cœur clair. Croisée avec un tournesol doré à cœur foncé, F2 9 : 3 : 3 : 1.', 'Double recessive line: lemon and light disc. Crossed with a golden dark-disc sunflower, F2 9 : 3 : 3 : 1.', { origin: 'France' }),
  // --- Sauvages ------------------------------------------------------------------------------------------
  v('wild-annuus', 'Tournesol sauvage (Kansas)', 'annuus', ['b'], 200, 6, 80, 4, ['wild'], 'Plante très ramifiée à petits capitules, auto-incompatible : l’ancêtre du tournesol cultivé.', 'Highly branched plant with small heads, self-incompatible: the ancestor of the cultivated sunflower.', { ...WILDPOP, sAlleles: ['S1', 'S2'], origin: 'États-Unis' }),
  v('cockerell-red', 'Tournesol rouge de Cockerell', 'annuus', ['b'], 200, 7, 80, 4, ['wild', 'heirloom'], 'En 1910, T. D. A. Cockerell trouve près de Boulder (Colorado) un tournesol sauvage aux ligules rouges ; tous les tournesols rouges en descendent. Ici une plante Rd/rd, bicolore.', 'In 1910, T. D. A. Cockerell found a wild sunflower with red rays near Boulder (Colorado); all red sunflowers descend from it. Here an Rd/rd, bicolour plant.', { ...WILDPOP, het: ['Rd'], sAlleles: ['S2', 'S3'], origin: 'États-Unis' }),
  v('petiolaris', 'Helianthus petiolaris', 'petiolaris', ['b'], 100, 5, 70, 3, ['wild'], 'Tournesol des prairies sableuses ; source de la stérilité mâle cytoplasmique PET1 (Leclercq, INRA, 1969) qui a permis les hybrides.', 'Sand-prairie sunflower; source of the PET1 cytoplasmic male sterility (Leclercq, INRA, 1969) that made hybrids possible.', { ...WILDPOP, sAlleles: ['S3', 'S4'], origin: 'États-Unis' }),
  v('argophyllus', 'Helianthus argophyllus', 'argophyllus', ['b', 'Pl'], 200, 7, 85, 3, ['wild', 'resistant'], 'Tournesol argenté du Texas : se croise facilement avec le tournesol, source de résistances (mildiou, sécheresse).', 'Texas silverleaf sunflower: crosses easily with sunflower, a source of resistances (downy mildew, drought).', { ...WILDPOP, sAlleles: ['S4', 'S5'], origin: 'États-Unis' }),
  v('debilis', 'Helianthus debilis', 'debilis', ['b'], 120, 6, 75, 3, ['wild'], 'Tournesol à feuilles de concombre des dunes de Floride et du Texas.', 'Cucumberleaf sunflower of the Florida and Texas dunes.', { ...WILDPOP, sAlleles: ['S1', 'S5'], origin: 'États-Unis' }),
  v('maximiliani', 'Helianthus maximiliani', 'maximiliani', ['b'], 250, 6, 108, 2, ['wild'], 'Vivace des prairies à floraison d’automne ; hybrides très rares.', 'Prairie perennial flowering in autumn; very rare hybrids.', { ...WILDPOP, sAlleles: ['S2', 'S4'], origin: 'États-Unis' }),
  v('tuberosus', 'Topinambour', 'tuberosus', ['b'], 250, 7, 108, 1, ['wild'], 'Vivace à tubercules comestibles, hexaploïde : pas d’hybride au jardin.', 'Perennial with edible tubers, hexaploid: no hybrid in the garden.', { ...WILDPOP, sAlleles: ['S3', 'S5'], origin: 'Amérique du Nord' }),
];

export const VARIETY_BY_ID: Record<string, HaVariety> = Object.fromEntries(HA_VARIETIES.map((x) => [x.id, x]));
