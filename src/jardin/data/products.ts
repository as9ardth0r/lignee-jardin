/**
 * Engrais et amendements courants dans les jardineries françaises.
 *
 * Teneurs : ordres de grandeur de produits typiques (les étiquettes varient
 * d'une marque à l'autre — l'utilisateur peut saisir la sienne). N, P₂O₅ et
 * K₂O en % du produit tel qu'il est vendu, comme sur les étiquettes.
 * « nAvail » : part de l'azote disponible l'année de l'apport (fourchettes
 * usuelles des guides de fertilisation, valeur centrale retenue).
 */
import type { Product } from '../model';

export const PRODUCTS: Product[] = [
  {
    id: 'horn', name: { fr: 'Corne broyée', en: 'Hoof and horn meal' }, kind: 'organic',
    N: 13, P2O5: 0, K2O: 0, nAvail: 0.5, organicOK: true,
    note: { fr: 'Azote lent (2 à 4 mois) : à apporter avant la plantation.', en: 'Slow nitrogen (2–4 months): apply before planting.' },
  },
  {
    id: 'blood', name: { fr: 'Sang séché', en: 'Dried blood' }, kind: 'organic',
    N: 12, P2O5: 0, K2O: 0, nAvail: 0.8, organicOK: true,
    note: { fr: 'Azote rapide : coup de pouce en cours de culture.', en: 'Fast nitrogen: a boost during growth.' },
  },
  {
    id: 'guano', name: { fr: 'Guano', en: 'Guano' }, kind: 'organic',
    N: 10, P2O5: 8, K2O: 2, nAvail: 0.7, organicOK: true,
    note: { fr: 'Rapide et riche en phosphore.', en: 'Fast and rich in phosphorus.' },
  },
  {
    id: 'castor', name: { fr: 'Tourteau de ricin', en: 'Castor meal' }, kind: 'organic',
    N: 5, P2O5: 2, K2O: 1, nAvail: 0.6, organicOK: true,
    note: { fr: 'Toxique pour les animaux domestiques : à enfouir aussitôt.', en: 'Toxic to pets: dig in straight away.' },
  },
  {
    id: 'poultry', name: { fr: 'Fumier de volaille déshydraté', en: 'Dried poultry manure' }, kind: 'organic',
    N: 4, P2O5: 3, K2O: 3, nAvail: 0.45, organicOK: true,
    note: { fr: 'Engrais complet assez rapide, en granulés.', en: 'Fairly fast complete fertiliser, pelleted.' },
  },
  {
    id: 'organicNPK', name: { fr: 'Engrais organique universel 4-3-6', en: 'General organic fertiliser 4-3-6' }, kind: 'organic',
    N: 4, P2O5: 3, K2O: 6, nAvail: 0.5, organicOK: true,
    note: { fr: 'Mélange équilibré pour légumes.', en: 'Balanced vegetable mix.' },
  },
  {
    id: 'tomatoFeed', name: { fr: 'Engrais organique tomates 4-4-8', en: 'Organic tomato feed 4-4-8' }, kind: 'organic',
    N: 4, P2O5: 4, K2O: 8, nAvail: 0.5, organicOK: true,
    note: { fr: 'Riche en potasse pour la fructification.', en: 'Potash-rich for fruiting.' },
  },
  {
    id: 'cattle', name: { fr: 'Fumier de bovin composté', en: 'Composted cattle manure' }, kind: 'organic',
    N: 0.6, P2O5: 0.4, K2O: 0.8, nAvail: 0.2, organicOK: true,
    note: { fr: 'Surtout un amendement : nourrit le sol plus que la culture.', en: 'Mostly a soil conditioner: feeds the soil more than the crop.' },
  },
  {
    id: 'horse', name: { fr: 'Fumier de cheval composté', en: 'Composted horse manure' }, kind: 'organic',
    N: 0.6, P2O5: 0.3, K2O: 0.6, nAvail: 0.2, organicOK: true,
    note: { fr: 'Pailleux, réchauffe le sol au printemps.', en: 'Strawy, warms the soil in spring.' },
  },
  {
    id: 'compost', name: { fr: 'Compost mûr', en: 'Mature compost' }, kind: 'organic',
    N: 0.8, P2O5: 0.4, K2O: 0.8, nAvail: 0.1, organicOK: true,
    note: { fr: 'L’essentiel de son azote se libère sur plusieurs années.', en: 'Most of its nitrogen is released over several years.' },
  },
  {
    id: 'woodAsh', name: { fr: 'Cendres de bois', en: 'Wood ash' }, kind: 'organic',
    N: 0, P2O5: 1.5, K2O: 5, nAvail: 0, organicOK: true,
    note: { fr: 'Potasse et chaux : à éviter en sol calcaire, jamais de cendres de bois traité.', en: 'Potash and lime: avoid on chalky soil, never ash from treated wood.' },
  },
  {
    id: 'potSulphate', name: { fr: 'Sulfate de potasse', en: 'Sulphate of potash' }, kind: 'mineral',
    N: 0, P2O5: 0, K2O: 50, nAvail: 0, organicOK: true,
    note: { fr: 'Potasse pure, autorisée en bio si d’origine naturelle.', en: 'Pure potash, allowed in organic growing if naturally sourced.' },
  },
  {
    id: 'patentkali', name: { fr: 'Patentkali (potasse et magnésie)', en: 'Patentkali (potash and magnesium)' }, kind: 'mineral',
    N: 0, P2O5: 0, K2O: 30, nAvail: 0, organicOK: true,
    note: { fr: '30 % K₂O, 10 % MgO : utile en sol pauvre en magnésie.', en: '30 % K₂O, 10 % MgO: useful on magnesium-poor soil.' },
  },
  {
    id: 'nettle', name: { fr: 'Purin d’ortie (pur)', en: 'Nettle tea (undiluted)' }, kind: 'liquid',
    N: 0.3, P2O5: 0.05, K2O: 0.3, nAvail: 0.8, organicOK: true, density: 1,
    note: { fr: 'Très variable selon la fabrication ; diluer à 10 % avant arrosage.', en: 'Highly variable; dilute to 10 % before watering.' },
  },
  {
    id: 'npk15', name: { fr: 'Engrais minéral 15-15-15', en: 'Mineral fertiliser 15-15-15' }, kind: 'mineral',
    N: 15, P2O5: 15, K2O: 15, nAvail: 1, organicOK: false,
    note: { fr: 'Rapide et lessivable : fractionner les apports.', en: 'Fast and leachable: split the doses.' },
  },
  {
    id: 'ammonitrate', name: { fr: 'Ammonitrate 33,5 %', en: 'Ammonium nitrate 33.5 %' }, kind: 'mineral',
    N: 33.5, P2O5: 0, K2O: 0, nAvail: 1, organicOK: false,
    note: { fr: 'Azote immédiat : petites doses, jamais sur feuillage mouillé.', en: 'Immediate nitrogen: small doses, never on wet leaves.' },
  },
  // Amendements calcaires (chaulage) : valeur neutralisante en équivalent CaO.
  {
    id: 'limestone', name: { fr: 'Calcaire broyé (carbonate de calcium)', en: 'Ground limestone (calcium carbonate)' }, kind: 'amendment',
    N: 0, P2O5: 0, K2O: 0, nAvail: 0, organicOK: true, cao: 50,
    note: { fr: 'Action lente et douce ; à épandre en automne ou en hiver, sur sol ressuyé.', en: 'Slow, gentle action; spread in autumn or winter on drained soil.' },
  },
  {
    id: 'dolomite', name: { fr: 'Dolomie (calcaire magnésien)', en: 'Dolomitic limestone' }, kind: 'amendment',
    N: 0, P2O5: 0, K2O: 0, nAvail: 0, organicOK: true, cao: 52, mgo: 18,
    note: { fr: 'Remonte le pH et apporte de la magnésie : le bon choix si le magnésium est bas.', en: 'Raises pH and supplies magnesium: the right choice when magnesium is low.' },
  },
  {
    id: 'lithothamne', name: { fr: 'Lithothamne', en: 'Calcified seaweed (lithothamnion)' }, kind: 'amendment',
    N: 0, P2O5: 0, K2O: 0, nAvail: 0, organicOK: true, cao: 45, mgo: 3,
    note: { fr: 'Algue calcaire fine et rapide ; plus chère au kilo de CaO.', en: 'Fine, fast-acting calcareous seaweed; dearer per kilo of CaO.' },
  },
  {
    id: 'slakedLime', name: { fr: 'Chaux éteinte', en: 'Slaked lime' }, kind: 'amendment',
    N: 0, P2O5: 0, K2O: 0, nAvail: 0, organicOK: true, cao: 70,
    note: { fr: 'Rapide et caustique : gants, jamais avec un fumier frais (pertes d’azote).', en: 'Fast and caustic: wear gloves, never with fresh manure (nitrogen loss).' },
  },
];

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
