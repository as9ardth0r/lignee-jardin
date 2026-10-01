/**
 * Modèle de données de Lignée Jardin (phase 1).
 *
 * Tout vit sur l'appareil (IndexedDB). Les dates sont des chaînes ISO
 * « AAAA-MM-JJ » (jour local du jardinier) : un jardin raisonne en jours,
 * pas en millisecondes, et ces chaînes se trient et se comparent telles
 * quelles.
 */

export type Lang = 'fr' | 'en';
export type Txt = { fr: string; en: string };
export type ISODate = string;

// --- Catalogue (lecture seule, livré avec l'app) ---------------------------

export type Family =
  | 'solanaceae'
  | 'cucurbitaceae'
  | 'brassicaceae'
  | 'fabaceae'
  | 'apiaceae'
  | 'asteraceae'
  | 'amaranthaceae'
  | 'amaryllidaceae'
  | 'lamiaceae'
  | 'poaceae'
  | 'rosaceae'
  | 'polygonaceae'
  | 'caprifoliaceae'
  | 'convolvulaceae';

export const FAMILIES: Family[] = [
  'solanaceae',
  'cucurbitaceae',
  'brassicaceae',
  'fabaceae',
  'apiaceae',
  'asteraceae',
  'amaranthaceae',
  'amaryllidaceae',
  'lamiaceae',
  'poaceae',
  'rosaceae',
  'polygonaceae',
  'caprifoliaceae',
  'convolvulaceae',
];

/** Type de culture : décide la répartition des besoins par stade. */
export type CropType = 'fruit' | 'leaf' | 'root' | 'legume' | 'bulb' | 'herb' | 'perennial';
export const CROP_TYPES: CropType[] = ['fruit', 'leaf', 'root', 'legume', 'bulb', 'herb', 'perennial'];

export type StageId = 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'bulking' | 'harvest';
export const STAGE_IDS: StageId[] = ['germination', 'vegetative', 'flowering', 'fruiting', 'bulking', 'harvest'];

export type Sun = 'full' | 'partial' | 'shade';
export type Frost = 'tender' | 'half' | 'hardy';
export type Feeding = 'heavy' | 'medium' | 'light' | 'improver';

/** Mois inclusifs [début, fin], 1 = janvier. Une fenêtre peut chevaucher l'année (ex. [9, 2]). */
export type MonthRange = [number, number];

export interface Species {
  id: string;
  name: Txt;
  latin: string;
  emoji: string;
  family: Family;
  type: CropType;
  life: 'annual' | 'biennial' | 'perennial';
  sun: Sun;
  frost: Frost;
  /** Température de base des degrés-jours (°C). */
  tBase: number;
  /** Températures diurnes optimales (°C). */
  tOpt: [number, number];
  pH: [number, number];
  /** Espacement (cm) : entre les rangs, sur le rang. */
  spacing: { row: number; inRow: number };
  /** Calendrier de référence (région parisienne), décalé selon le climat. */
  sowIndoor?: MonthRange[];
  sowOutdoor?: MonthRange[];
  /** Plantation au jardin (repiquage des semis à l'abri, ou plants, bulbes, tubercules). */
  plantOut?: MonthRange[];
  /** Jours après le semis avant d'être repiqué (si semé à l'abri). */
  transplantAfter?: number;
  /** Jours entre le semis et la première récolte [min, max]. */
  daysToHarvest: [number, number];
  /** Durée totale de culture après le semis (jours), fin de récolte comprise. */
  season: number;
  /** Début de chaque stade, en jours après le semis ou la plantation (le premier commence à 0). */
  stages: Array<[StageId, number]>;
  /** Coefficients cultural FAO-56 : début, plein développement, fin. */
  kc: [number, number, number];
  /** Profondeur racinaire utile au jardin (m). */
  rootDepth: number;
  /** Rendement de référence au jardin (kg/m²) [bas, haut]. */
  yieldM2: [number, number];
  /** Exportations par kg récolté (g de N, P₂O₅, K₂O). */
  exports: { N: number; P2O5: number; K2O: number };
  feeding: Feeding;
  /** Années minimales avant de revenir sur la même planche avec la même famille. */
  returnYears: number;
  note: Txt;
}

export type ProductKind = 'organic' | 'mineral' | 'liquid';

export interface Product {
  id: string;
  name: Txt;
  kind: ProductKind;
  /** Teneurs en % du produit tel qu'il est vendu (N, P₂O₅, K₂O). */
  N: number;
  P2O5: number;
  K2O: number;
  /** Part de l'azote disponible l'année de l'apport (0–1). */
  nAvail: number;
  /** Utilisable en agriculture biologique. */
  organicOK: boolean;
  /** Densité (kg/L) pour les produits liquides. */
  density?: number;
  note: Txt;
}

// --- Réglages du jardin ---------------------------------------------------

export type ClimateId = 'oceanic' | 'parisian' | 'continental' | 'mediterranean' | 'mountain';
export type GardenKind = 'vegetable' | 'orchard' | 'ornamental' | 'balcony' | 'greenhouse';
export type Practice = 'conventional' | 'livingSoil' | 'permaculture' | 'organic' | 'soilless';
export type Texture = 'sand' | 'sandyLoam' | 'loam' | 'siltLoam' | 'clayLoam' | 'clay';
export type WaterSetup = 'manual' | 'drip' | 'rainTank';

export interface Settings {
  onboarded: boolean;
  gardenName: string;
  climate: ClimateId;
  /** Position facultative (gardée pour la météo de la phase 2). */
  lat?: number;
  lon?: number;
  kinds: GardenKind[];
  practices: Practice[];
  texture: Texture;
  pH?: number;
  water: WaterSetup[];
  /** Pluie : relevés du pluviomètre seulement, ou moyennes du climat les jours sans relevé. */
  rainSource: 'manual' | 'average';
  /** Dimensions du plan (m). */
  planW: number;
  planH: number;
  terrain: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  gardenName: 'Mon jardin',
  climate: 'parisian',
  kinds: ['vegetable'],
  practices: ['conventional'],
  texture: 'loam',
  water: ['manual'],
  rainSource: 'average',
  planW: 12,
  planH: 8,
  terrain: false,
};

// --- Données du jardinier ---------------------------------------------------

export type BedKind = 'bed' | 'pot' | 'greenhouse';

export interface Bed {
  id: string;
  name: string;
  kind: BedKind;
  /** Position et taille sur le plan (m). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Texture propre à la planche (sinon celle du jardin). */
  texture?: Texture;
  mulch: boolean;
  drip: boolean;
  createdAt: ISODate;
}

export interface Variety {
  id: string;
  speciesId: string;
  name: string;
  /** D'où elle vient : « catalogue », « moi », « lignee:tomato »… */
  origin: string;
  daysToHarvest?: number;
  note?: string;
}

export type PlantStatus = 'planned' | 'growing' | 'ended';

export interface Plant {
  id: string;
  speciesId: string;
  varietyId?: string;
  varietyName?: string;
  bedId: string;
  /** Nombre de pieds. */
  count: number;
  /** Surface occupée (m²) — calculée depuis l'espacement si absente. */
  area?: number;
  /** Semé à l'abri puis repiqué ? */
  indoor: boolean;
  status: PlantStatus;
  /** Date de semis (prévue si status = planned). */
  sowDate: ISODate;
  transplantDate?: ISODate;
  endDate?: ISODate;
  /** Rendement visé (kg/m²) — sinon le milieu de la fourchette du catalogue. */
  yieldTarget?: number;
  note?: string;
  createdAt: ISODate;
}

export type Health = 'good' | 'watch' | 'sick';

export interface Observation {
  id: string;
  plantId?: string;
  bedId?: string;
  date: ISODate;
  note: string;
  heightCm?: number;
  fruits?: number;
  harvestG?: number;
  health?: Health;
  photoIds: string[];
}

export interface Application {
  id: string;
  bedId: string;
  /** Apport ciblé sur une culture ; sinon réparti sur la planche au prorata des surfaces. */
  plantId?: string;
  productId: string;
  /** Quantité totale apportée (g, ou mL pour un liquide). */
  amount: number;
  date: ISODate;
  note?: string;
}

export interface WaterEvent {
  id: string;
  kind: 'rain' | 'irrigation';
  /** Pluie : mm, pour tout le jardin. Arrosage : litres, pour une planche. */
  amount: number;
  bedId?: string;
  date: ISODate;
}

export interface ManualTask {
  id: string;
  title: string;
  due: ISODate;
  bedId?: string;
  plantId?: string;
  done?: ISODate;
}

/** État d'une tâche générée (faite ou reportée), indexé par sa clé stable. */
export interface TaskState {
  key: string;
  done?: ISODate;
  snoozeUntil?: ISODate;
}

export interface PhotoMeta {
  id: string;
  date: ISODate;
  width: number;
  height: number;
}

export interface GardenData {
  settings: Settings;
  beds: Bed[];
  plants: Plant[];
  varieties: Variety[];
  observations: Observation[];
  applications: Application[];
  water: WaterEvent[];
  tasks: ManualTask[];
  taskStates: TaskState[];
}

export const EMPTY_DATA: GardenData = {
  settings: DEFAULT_SETTINGS,
  beds: [],
  plants: [],
  varieties: [],
  observations: [],
  applications: [],
  water: [],
  tasks: [],
  taskStates: [],
};

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
