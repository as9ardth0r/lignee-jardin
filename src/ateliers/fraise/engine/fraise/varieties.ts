/**
 * Bibliothèque de fraisiers : variétés françaises et européennes du
 * jardin, variétés californiennes, remontantes, anciennes, fraises
 * blanches, fraisiers des bois et des quatre saisons, espèces sauvages.
 *
 * Sources : catalogues d’obtenteurs et de pépiniéristes (Ciref, Marionnet,
 * Darbonne, Planfor, Lepage), fiches variétales du CTIFL, UC Davis
 * (Albion, Camarosa, Fronteras), James Hutton Institute (Rhapsody), Darrow
 * 1966 (« The Strawberry », histoire et espèces), Staudt 1989 (Fragaria
 * sauvages).
 *
 * Valeurs chiffrées = ORDRES DE GRANDEUR (poids moyen d’un fruit, fermeté
 * notée de 1 à 9, °Brix, jour de la première fraise mûre en plein champ
 * en climat océanique, stolons par plante). Génotypes D’ARÔME ET DE
 * RÉSISTANCE : hypothèses plausibles tirées de la réputation des variétés,
 * pas de génotypages publiés. Les variétés de fraisier cultivé sont des
 * CLONES hétérozygotes ; `inbred` = lignée (fraisier des bois).
 */

import type { QuantTraitId } from './engine';
import type { SpeciesId, VariantId } from './loci';

export type FaKind = 'early' | 'midseason' | 'late' | 'everbearing' | 'aromatic' | 'firm' | 'heritage' | 'white' | 'alpine' | 'resistant' | 'wild';
export const FA_KINDS: FaKind[] = ['early', 'midseason', 'late', 'everbearing', 'aromatic', 'firm', 'heritage', 'white', 'alpine', 'resistant', 'wild'];

export interface FaVariety {
  id: string;
  name: string;
  species: SpeciesId;
  hybridWith?: SpeciesId;
  fertility?: number;
  variants: VariantId[];
  /** Allèles portés à l’état hétérozygote (un seul exemplaire). */
  het?: VariantId[];
  /** Poids moyen d’un fruit (g). */
  weightG: number;
  /** Fermeté (1 à 9). */
  firmness: number;
  /** Sucres solubles (°Brix). */
  brix: number;
  /** Première fraise mûre (jours après le 1er avril). */
  early: number;
  /** Stolons par plante et par saison. */
  runners: number;
  kinds: FaKind[];
  /** Lignée consanguine (homozygote) — fraisiers des bois. */
  inbred?: boolean;
  /** Année d’obtention ou de description. */
  year?: number;
  origin?: string;
  notes?: { fr: string; en: string };
  source: 'curated' | 'custom';
  haps?: Partial<Record<QuantTraitId, number[]>>;
  /** Clone enregistré par l’utilisateur : ses deux haplotypes exacts pour chaque trait. */
  clone?: Record<QuantTraitId, [number[], number[]]>;
  createdAt?: number;
}

type Opt = Partial<Pick<FaVariety, 'origin' | 'het' | 'inbred' | 'fertility' | 'year'>>;

function v(
  id: string,
  name: string,
  species: SpeciesId,
  variants: VariantId[],
  weightG: number,
  firmness: number,
  brix: number,
  early: number,
  runners: number,
  kinds: FaKind[],
  fr: string,
  en: string,
  opt: Opt = {}
): FaVariety {
  return { id, name, species, variants, weightG, firmness, brix, early, runners, kinds, notes: { fr, en }, source: 'curated', ...opt };
}

const FR = { origin: 'France' };
const US = { origin: 'États-Unis' };
const UK = { origin: 'Royaume-Uni' };

export const FA_VARIETIES: FaVariety[] = [
  // --- Précoces --------------------------------------------------------------------------
  v('gariguette', 'Gariguette', 'ananassa', [], 15, 5, 9, 40, 18, ['early', 'aromatic'], 'La fraise de printemps française (INRA Avignon, 1976) : allongée, rouge vif, parfumée et acidulée ; sensible à l’oïdium.', 'France’s spring strawberry (INRA Avignon, 1976): long, bright red, fragrant and tangy; prone to mildew.', { ...FR, year: 1976, het: ['FAD1'] }),
  v('ciflorette', 'Ciflorette', 'ananassa', [], 17, 5, 9, 42, 16, ['early', 'aromatic'], 'Fille de Gariguette (Ciref, 1998), plus ronde et plus productive, très sucrée.', 'Gariguette’s offspring (Ciref, 1998), rounder and more productive, very sweet.', { ...FR, year: 1998, het: ['FAD1'] }),
  v('clery', 'Cléry', 'ananassa', [], 20, 6, 8.5, 40, 16, ['early'], 'Précoce italienne, conique, brillante et assez ferme.', 'Early Italian variety, conical, glossy and fairly firm.', { origin: 'Italie', year: 1998 }),
  v('camarosa', 'Camarosa', 'ananassa', [], 30, 8, 7, 38, 15, ['early', 'firm'], 'Californienne de jours courts (UC Davis, 1992) : grosse, très ferme, faite pour voyager ; la fraise d’Espagne d’hiver.', 'Californian short-day variety (UC Davis, 1992): large, very firm, made to travel; Spain’s winter strawberry.', { ...US, year: 1992 }),
  // --- Mi-saison et tardives ------------------------------------------------------------------
  v('darselect', 'Darselect', 'ananassa', [], 25, 7, 8, 55, 15, ['midseason', 'firm'], 'Grosse fraise conique de mi-saison (Darbonne, 1996), ferme et rouge orangé, très cultivée en France.', 'Large conical mid-season strawberry (Darbonne, 1996), firm and orange-red, widely grown in France.', { ...FR, year: 1996 }),
  v('elsanta', 'Elsanta', 'ananassa', [], 18, 7, 7.5, 58, 15, ['midseason', 'firm'], 'La fraise des supermarchés européens (Pays-Bas, 1981) : ronde, ferme, régulière ; sensible à la verticilliose et à l’oïdium.', 'Europe’s supermarket strawberry (Netherlands, 1981): round, firm, regular; prone to verticillium wilt and mildew.', { origin: 'Pays-Bas', year: 1981 }),
  v('senga-sengana', 'Senga Sengana', 'ananassa', [], 12, 4, 8, 68, 20, ['late', 'heritage'], 'Vieille variété allemande (1954) : rouge sombre jusqu’au cœur, parfaite pour les confitures et la congélation.', 'Old German variety (1954): dark red to the core, perfect for jam and freezing.', { origin: 'Allemagne', year: 1954, het: ['OMT'] }),
  v('malwina', 'Malwina', 'ananassa', [], 25, 5, 8, 80, 14, ['late', 'aromatic'], 'Très tardive (Allemagne, 2010) : prolonge la saison jusqu’à mi-juillet ; fruit rouge foncé et parfumé.', 'Very late (Germany, 2010): stretches the season to mid-July; dark red, fragrant fruit.', { origin: 'Allemagne', year: 2010, het: ['OMT'] }),
  v('florence', 'Florence', 'ananassa', ['Pm'], 18, 6, 7.5, 75, 14, ['late', 'resistant'], 'Tardive anglaise (East Malling, 1997), réputée peu sensible à l’oïdium et à la verticilliose.', 'Late English variety (East Malling, 1997), known for little mildew and verticillium wilt.', { ...UK, year: 1997 }),
  v('redgauntlet', 'Redgauntlet', 'ananassa', ['Rpf1'], 15, 5, 7.5, 65, 18, ['midseason', 'resistant'], 'Écossaise (1957) résistante à la stèle rouge, pour les sols lourds et humides.', 'Scottish (1957), resistant to red stele, for heavy, wet soils.', { ...UK, year: 1957 }),
  v('rhapsody', 'Rhapsody', 'ananassa', ['Rpf1'], 15, 6, 8, 70, 16, ['late', 'resistant'], 'Tardive écossaise (James Hutton Institute) résistante à la stèle rouge, bonne saveur.', 'Late Scottish variety (James Hutton Institute) resistant to red stele, good flavour.', { ...UK, year: 1996 }),
  v('fronteras', 'Fronteras', 'ananassa', [], 30, 8, 7.5, 42, 15, ['early', 'firm', 'resistant'], 'Californienne récente (UC Davis), résistante à la fusariose (FW1) des sols chauds.', 'Recent Californian variety (UC Davis), resistant to Fusarium wilt (FW1) in warm soils.', { ...US, year: 2016, het: ['FW1'] }),
  // --- Remontantes -------------------------------------------------------------------------------
  v('mara-des-bois', 'Mara des Bois', 'ananassa', [], 12, 3.5, 10, 60, 6, ['everbearing', 'aromatic'], 'La fraise au goût de fraise des bois (Marionnet, 1991) : remontante, de juin aux gelées, chair tendre et très parfumée.', 'The strawberry that tastes of wild strawberries (Marionnet, 1991): everbearing, June to frost, soft and very fragrant.', { ...FR, year: 1991, het: ['PFRU', 'FAD1'] }),
  v('charlotte', 'Charlotte', 'ananassa', [], 15, 4.5, 9.5, 55, 6, ['everbearing', 'aromatic'], 'Remontante en forme de cœur (Marionnet, 2004), au parfum de fraise des bois.', 'Heart-shaped everbearer (Marionnet, 2004), with a wild-strawberry aroma.', { ...FR, year: 2004, het: ['PFRU', 'FAD1'] }),
  v('mariguette', 'Mariguette', 'ananassa', [], 18, 5, 9.5, 50, 6, ['everbearing', 'aromatic', 'resistant'], 'Remontante allongée (Marionnet, 2007), croisement de Gariguette et Mara des Bois, peu sensible à l’oïdium.', 'Long everbearer (Marionnet, 2007), a cross of Gariguette and Mara des Bois, little mildew.', { ...FR, year: 2007, het: ['PFRU', 'FAD1', 'Pm'] }),
  v('cirafine', 'Cirafine', 'ananassa', [], 18, 6, 8.5, 55, 6, ['everbearing'], 'Remontante française (Ciref, 2007) régulière, conique et assez ferme.', 'French everbearer (Ciref, 2007), regular, conical and fairly firm.', { ...FR, year: 2007, het: ['PFRU'] }),
  v('albion', 'Albion', 'ananassa', [], 25, 8, 9, 55, 5, ['everbearing', 'firm', 'resistant'], 'Californienne à jours neutres (UC Davis, 2006) : grosse, très ferme et sucrée ; tolère l’anthracnose.', 'Californian day-neutral (UC Davis, 2006): large, very firm and sweet; tolerates anthracnose.', { ...US, year: 2006, het: ['PFRU', 'RCa1'] }),
  // --- Anciennes et fraises blanches ---------------------------------------------------------
  v('madame-moutot', 'Madame Moutot', 'ananassa', [], 35, 2.5, 7, 55, 20, ['heritage', 'midseason'], 'Fraise ancienne française (1906), énorme et tendre, au goût fin ; ne voyage pas.', 'Old French strawberry (1906), huge and soft, delicate flavour; does not travel.', { ...FR, year: 1906 }),
  v('docteur-morere', 'Docteur Morère', 'ananassa', [], 20, 3, 8, 65, 18, ['heritage', 'aromatic'], 'Ancienne variété (1896), rouge sombre et très parfumée, cultivée autrefois à Plougastel.', 'Old variety (1896), dark red and very fragrant, once grown at Plougastel.', { ...FR, year: 1896, het: ['OMT'] }),
  v('pineberry', 'Pineberry (fraise blanche)', 'ananassa', ['myb10'], 6, 3, 8, 60, 18, ['white', 'aromatic'], 'Fraise blanche aux akènes rouges, au goût d’ananas : MYB10 inactif, pas d’anthocyanes dans la chair. Les oiseaux la délaissent.', 'White strawberry with red seeds, pineapple-like taste: MYB10 inactive, no anthocyanins in the flesh. Birds leave it alone.', { origin: 'Pays-Bas', year: 2010 }),
  // --- Fraisiers des bois et des quatre saisons --------------------------------------------------
  v('reine-des-vallees', 'Reine des Vallées', 'vesca', ['sfl', 'r'], 1.8, 2, 11, 50, 0, ['alpine', 'everbearing'], 'Fraisier des quatre saisons sans stolons : fruits allongés et parfumés de mai aux gelées ; se sème et reste fidèle (lignée).', 'Runnerless everbearing alpine: long fragrant fruit from May to frost; grown from seed and comes true (inbred line).', { ...FR, inbred: true }),
  v('alexandria', 'Alexandria', 'vesca', ['sfl', 'r'], 2, 2, 11, 50, 0, ['alpine', 'everbearing'], 'Fraise des quatre saisons à gros fruits, sans stolons, idéale en bordure ou en pot.', 'Large-fruited runnerless alpine strawberry, ideal for edging or pots.', { ...US, inbred: true }),
  v('rugen', 'Rügen', 'vesca', ['sfl', 'r'], 1.5, 2, 11.5, 48, 0, ['alpine', 'everbearing'], 'Fraisier des quatre saisons allemand (1920), très productif et sucré.', 'German alpine strawberry (1920), very productive and sweet.', { origin: 'Allemagne', inbred: true, year: 1920 }),
  v('yellow-wonder', 'Yellow Wonder (fraise des bois jaune)', 'vesca', ['sfl', 'r', 'myb10'], 1.5, 2, 11, 52, 0, ['alpine', 'everbearing', 'white'], 'Fraise des bois jaune pâle, très douce, sans stolons : MYB10 inactif chez le fraisier des bois.', 'Pale yellow alpine strawberry, very sweet, runnerless: MYB10 inactive in the woodland strawberry.', { inbred: true }),
  v('fraise-des-bois', 'Fraisier des bois sauvage', 'vesca', [], 1.2, 2, 11, 45, 20, ['wild'], 'Le fraisier des sous-bois d’Europe : une seule floraison, beaucoup de stolons, petits fruits intensément parfumés.', 'Europe’s woodland strawberry: one flowering, many runners, tiny intensely fragrant fruit.', { ...FR, inbred: true }),
  // --- Espèces sauvages ---------------------------------------------------------------------------
  v('virginiana', 'Fraisier de Virginie', 'virginiana', [], 2, 2, 11, 35, 25, ['wild', 'early', 'aromatic'], 'Fraisier sauvage d’Amérique du Nord, petits fruits rouges très parfumés ; plante hermaphrodite.', 'Wild North American strawberry, small very fragrant red fruit; hermaphrodite plant.', { ...US, het: ['FAD1', 'OMT'] }),
  v('virginiana-femelle', 'Fraisier de Virginie (plante femelle)', 'virginiana', [], 2, 2, 11, 35, 25, ['wild'], 'Plante femelle (F/f) : pas de pollen, il lui faut un voisin pour donner des fruits.', 'Female plant (F/f): no pollen, it needs a neighbour to set fruit.', { ...US, het: ['F', 'FAD1'] }),
  v('virginiana-glauca', 'Fraisier de Virginie glauca (Wasatch)', 'virginiana', [], 2, 2, 10, 40, 10, ['wild', 'everbearing'], 'Fraisier sauvage des montagnes de l’Utah, à jours neutres : la source du caractère remontant (PFRU) des fraisiers modernes.', 'Wild strawberry of the Utah mountains, day-neutral: the source of the everbearing trait (PFRU) in modern strawberries.', { ...US, het: ['PFRU'] }),
  v('chili-frezier', 'Fraisier du Chili de Frézier', 'chiloensis', [], 10, 4, 9, 60, 15, ['wild', 'heritage'], 'Les plants rapportés du Chili par Frézier en 1714 étaient FEMELLES : stériles à Versailles, ils n’ont fructifié qu’à Plougastel, plantés près de fraisiers de Virginie. Leur croisement a donné le fraisier cultivé.', 'The plants Frézier brought from Chile in 1714 were FEMALE: barren at Versailles, they only fruited at Plougastel, planted next to Virginia strawberries. Their cross gave the garden strawberry.', { origin: 'Chili', het: ['F'], year: 1714 }),
  v('blanche-du-chili', 'Blanche du Chili', 'chiloensis', ['myb10'], 8, 4, 9, 62, 15, ['wild', 'white', 'heritage'], 'Fraisier du Chili à fruits blancs rosés, au goût d’ananas ; hermaphrodite.', 'Chilean strawberry with pinkish-white fruit, pineapple-like taste; hermaphrodite.', { origin: 'Chili' }),
  v('capron-royal', 'Capron royal (hautbois)', 'moschata', [], 4, 2, 11, 55, 15, ['wild', 'heritage', 'aromatic'], 'Fraisier musqué hermaphrodite, au parfum puissant de musc et de miel ; hexaploïde, ne se croise pas fertilement avec le fraisier cultivé.', 'Hermaphrodite musk strawberry, strong musky and honey aroma; hexaploid, no fertile cross with the garden strawberry.', { origin: 'Europe' }),
];

export const VARIETY_BY_ID: Record<string, FaVariety> = Object.fromEntries(FA_VARIETIES.map((x) => [x.id, x]));
