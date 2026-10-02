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
  | 'convolvulaceae'
  | 'tropaeolaceae'
  | 'ranunculaceae'
  | 'papaveraceae'
  | 'boraginaceae'
  | 'plantaginaceae'
  | 'malvaceae'
  | 'violaceae'
  | 'caryophyllaceae'
  | 'liliaceae'
  | 'iridaceae'
  | 'paeoniaceae'
  | 'cleomaceae'
  | 'plumbaginaceae'
  | 'campanulaceae'
  | 'verbenaceae'
  | 'limnanthaceae'
  | 'onagraceae'
  | 'acanthaceae'
  | 'portulacaceae'
  | 'nyctaginaceae'
  | 'balsaminaceae'
  | 'begoniaceae'
  | 'scrophulariaceae'
  | 'polemoniaceae'
  | 'asphodelaceae'
  | 'crassulaceae'
  | 'geraniaceae'
  | 'lythraceae'
  | 'primulaceae'
  | 'apocynaceae'
  | 'alstroemeriaceae'
  | 'hydrangeaceae'
  | 'asparagaceae'
  | 'cannaceae'
  | 'araceae'
  | 'colchicaceae';

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
  'tropaeolaceae',
  'ranunculaceae',
  'papaveraceae',
  'boraginaceae',
  'plantaginaceae',
  'malvaceae',
  'violaceae',
  'caryophyllaceae',
  'liliaceae',
  'iridaceae',
  'paeoniaceae',
  'cleomaceae',
  'plumbaginaceae',
  'campanulaceae',
  'verbenaceae',
  'limnanthaceae',
  'onagraceae',
  'acanthaceae',
  'portulacaceae',
  'nyctaginaceae',
  'balsaminaceae',
  'begoniaceae',
  'scrophulariaceae',
  'polemoniaceae',
  'asphodelaceae',
  'crassulaceae',
  'geraniaceae',
  'lythraceae',
  'primulaceae',
  'apocynaceae',
  'alstroemeriaceae',
  'hydrangeaceae',
  'asparagaceae',
  'cannaceae',
  'araceae',
  'colchicaceae',
];

/** Type de culture : décide la répartition des besoins par stade. */
export type CropType = 'fruit' | 'leaf' | 'root' | 'legume' | 'bulb' | 'herb' | 'perennial' | 'flower';
export const CROP_TYPES: CropType[] = ['fruit', 'leaf', 'root', 'legume', 'bulb', 'herb', 'perennial', 'flower'];

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
  /** Type de culture appliqué (voir SpeciesType), quand l'espèce a été précisée. */
  typeId?: string;
}

/**
 * Type de culture d'une espèce (ail d'automne ou de printemps, oignon de
 * printemps ou d'hiver…) : il remplace le calendrier et la durée de culture
 * de l'espèce. Les autres caractéristiques restent celles de l'espèce.
 */
export interface SpeciesType {
  id: string;
  name: Txt;
  note: Txt;
  /** Exemples de variétés de ce type. */
  examples?: string;
  sowIndoor?: MonthRange[];
  sowOutdoor?: MonthRange[];
  plantOut?: MonthRange[];
  transplantAfter?: number;
  daysToHarvest: [number, number];
  season: number;
  stages: Array<[StageId, number]>;
}

/** Données complémentaires d'une espèce (phase 2), dans data/speciesExtra.ts. */
export interface SpeciesExtra {
  /** Durée de germination des graines bien conservées (années). */
  seedLife: number;
  /** Fécondation : autogame (se croise peu), par les insectes, par le vent ; ou multiplication végétative. */
  pollination: 'self' | 'insect' | 'wind' | 'vegetative';
  /** Distance d'isolement conseillée pour garder des graines pures (m). */
  isolation: number;
  /** Prix de référence au détail (€/kg), pour le bilan de saison. */
  priceKg: number;
  /**
   * Graines fidèles ? « yes » : redonnent la même plante ; « mostly » :
   * oui si les variétés sont isolées ; « no » : ne redonnent pas la plante
   * (hybrides, cultivars multipliés autrement).
   */
  trueToSeed?: 'yes' | 'mostly' | 'no';
  /** Beaucoup de variétés du commerce sont des hybrides F1. */
  f1Common?: boolean;
  /** Comment récolter et conserver les graines (ou multiplier la plante). */
  seedTip?: Txt;
}

/** « amendment » : amendement calcaire (chaulage), sans N-P-K. */
export type ProductKind = 'organic' | 'mineral' | 'liquid' | 'amendment';

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
  /** Valeur neutralisante (% d'équivalent CaO) d'un amendement calcaire. */
  cao?: number;
  /** Teneur en magnésie (% MgO). */
  mgo?: number;
  note: Txt;
}

// --- Réglages du jardin ---------------------------------------------------

/**
 * Trace de modification d'un enregistrement (phase 3) : date ISO de la
 * dernière modification et auteur, posées automatiquement par le stockage.
 * Sert à fusionner deux copies d'un même jardin (la plus récente gagne).
 */
export interface Meta {
  mod?: string;
  by?: string;
}

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
  /** Nom du lieu choisi (commune), pour l'affichage. */
  placeName?: string;
  /** Météo locale (Open-Meteo) : activée quand une position est connue. */
  weather: boolean;
  /**
   * Pluie les jours sans relevé du pluviomètre : météo mesurée (si la
   * météo locale est active), moyenne du climat, ou rien.
   */
  rainSource: 'manual' | 'average';
  /** Orientation du plan : direction du nord en degrés (0 = haut du plan, 90 = droite). */
  planNorth: number;
  /** Dimensions du plan (m). */
  planW: number;
  planH: number;
  terrain: boolean;
  /** Afficher la Lune (calendrier lunaire traditionnel, à titre d'information). */
  moon: boolean;
  /** Nom de la personne qui saisit (jardin partagé). */
  author?: string;
  /** Notifications locales : activées, heure du résumé du matin, plafond quotidien. */
  notify: boolean;
  notifyHour: number;
  notifyMax: number;
  /** Date de la dernière sauvegarde exportée (rappel mensuel). */
  lastBackup?: ISODate;
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  gardenName: 'Mon jardin',
  climate: 'parisian',
  kinds: ['vegetable'],
  practices: ['conventional'],
  texture: 'loam',
  water: ['manual'],
  weather: false,
  rainSource: 'average',
  planNorth: 0,
  planW: 12,
  planH: 8,
  terrain: false,
  moon: false,
  notify: false,
  notifyHour: 8,
  notifyMax: 3,
};

// --- Données du jardinier ---------------------------------------------------

export type BedKind = 'bed' | 'pot' | 'greenhouse' | 'hydro';

export interface Bed extends Meta {
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
  /** Débit du goutte-à-goutte de la planche (L/h), pour convertir un arrosage en minutes. */
  dripFlow?: number;
  /** Volume de solution nutritive (L), pour un bac hydroponique. */
  tankL?: number;
  createdAt: ISODate;
}

export type ObstacleKind = 'building' | 'wall' | 'tree' | 'hedge';

/** Ce qui fait de l'ombre sur le plan (maison, mur, arbre, haie). */
export interface Obstacle extends Meta {
  id: string;
  name: string;
  kind: ObstacleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Hauteur (m). */
  height: number;
}

export interface Variety extends Meta {
  id: string;
  speciesId: string;
  name: string;
  /** D'où elle vient : « catalogue », « moi », « lignee:tomato »… */
  origin: string;
  daysToHarvest?: number;
  note?: string;
}

export type PlantStatus = 'planned' | 'growing' | 'ended';

export interface Plant extends Meta {
  id: string;
  speciesId: string;
  /** Type de culture (ail d'automne, oignon d'hiver…), s'il y en a pour l'espèce. */
  typeId?: string;
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
  /** Lot de graines utilisé (pour décompter le stock). */
  seedLotId?: string;
  createdAt: ISODate;
}

export type Health = 'good' | 'watch' | 'sick';

export interface Observation extends Meta {
  id: string;
  plantId?: string;
  bedId?: string;
  date: ISODate;
  note: string;
  /** Notes vocales (identifiants dans le magasin des médias). */
  audioIds?: string[];
  heightCm?: number;
  fruits?: number;
  harvestG?: number;
  health?: Health;
  photoIds: string[];
}

export interface Application extends Meta {
  id: string;
  bedId: string;
  /** Apport ciblé sur une culture ; sinon réparti sur la planche au prorata des surfaces. */
  plantId?: string;
  productId: string;
  /** Quantité totale apportée (g, ou mL pour un liquide). */
  amount: number;
  date: ISODate;
  note?: string;
  /** Coût (€), facultatif, pour le bilan de saison. */
  cost?: number;
}

export interface WaterEvent extends Meta {
  id: string;
  kind: 'rain' | 'irrigation';
  /** Pluie : mm, pour tout le jardin. Arrosage : litres, pour une planche. */
  amount: number;
  bedId?: string;
  date: ISODate;
}

export interface ManualTask extends Meta {
  id: string;
  title: string;
  due: ISODate;
  bedId?: string;
  plantId?: string;
  done?: ISODate;
}

/** État d'une tâche générée (faite ou reportée), indexé par sa clé stable. */
export interface TaskState extends Meta {
  key: string;
  done?: ISODate;
  snoozeUntil?: ISODate;
}

/** Stade observé (première fleur, première récolte…) : sert à recaler les prévisions. */
export interface PhenoEvent extends Meta {
  id: string;
  plantId: string;
  stage: StageId;
  date: ISODate;
}

export type TreatmentMethod = 'manual' | 'barrier' | 'auxiliary' | 'product' | 'cultural';

/** Intervention sanitaire (registre). */
export interface Treatment extends Meta {
  id: string;
  plantId?: string;
  bedId?: string;
  problemId: string;
  method: TreatmentMethod;
  /** Produit (catalogue des traitements autorisés aux amateurs), le cas échéant. */
  remedyId?: string;
  date: ISODate;
  note?: string;
}

/** Lot de graines en stock. */
export interface SeedLot extends Meta {
  id: string;
  speciesId: string;
  varietyName?: string;
  /** Année de récolte ou du sachet. */
  year: number;
  quantity?: string;
  source?: string;
  /** Nombre de graines du lot (au dernier inventaire), pour suivre ce qu'il en reste. */
  seeds?: number;
  /** Taux de germination mesuré (0–1) et date du test. */
  germRate?: number;
  germTested?: ISODate;
}

/** Une journée de météo (mesurée ou prévue), telle que mise en cache. */
export interface WeatherDay {
  date: ISODate;
  tmax: number;
  tmin: number;
  /** Pluie (mm). */
  rain: number;
  /** Évapotranspiration de référence FAO (mm). */
  et0: number;
  /** Vent moyen max et rafales max (km/h). */
  wind: number;
  gust: number;
}

export interface WeatherCache {
  lat: number;
  lon: number;
  /** Horodatage ISO du dernier téléchargement. */
  fetchedAt: string;
  /** Jours connus, triés ; ceux après `today` sont des prévisions. */
  days: WeatherDay[];
}

export interface PhotoMeta {
  id: string;
  date: ISODate;
  width: number;
  height: number;
  /** Note vocale (phase 5) : rangée avec les photos, sans vignette. */
  kind?: 'audio';
  mime?: string;
  /** Durée (s) d'une note vocale. */
  duration?: number;
}

export type StockUnit = 'g' | 'kg' | 'mL' | 'L' | 'pcs';
export type StockKind = 'product' | 'substrate' | 'other';

/**
 * Article en stock (phase 5). Quantité constatée à une date ; pour un
 * engrais du catalogue, les apports notés ensuite sont déduits
 * automatiquement (rien n'est réécrit : la fusion de jardins reste simple).
 */
export interface StockItem extends Meta {
  id: string;
  kind: StockKind;
  /** Engrais ou amendement du catalogue, le cas échéant. */
  productId?: string;
  name: string;
  qty: number;
  unit: StockUnit;
  /** Date du dernier inventaire ou achat (quantité ci-dessus). */
  since: ISODate;
  /** Seuil de réapprovisionnement (même unité). */
  min?: number;
  priceUnit?: number;
  note?: string;
}

/** Ligne libre de la liste de courses. */
export interface ShoppingItem extends Meta {
  id: string;
  label: string;
  done?: boolean;
}

export type SensorKind = 'soilMoisture' | 'soilTemp' | 'airTemp' | 'humidity' | 'ec' | 'ph';
export const SENSOR_KINDS: SensorKind[] = ['soilMoisture', 'soilTemp', 'airTemp', 'humidity', 'ec', 'ph'];
/** Origine des relevés (« ecowitt » : ancienne lecture réseau, retirée en phase 4, lue comme saisie manuelle). */
export type SensorSource = 'manual' | 'csv' | 'ecowitt';

/** Capteur (ou point de mesure manuel) rattaché à une planche ou au jardin. */
export interface Sensor extends Meta {
  id: string;
  name: string;
  kind: SensorKind;
  bedId?: string;
  source: SensorSource;
  /** Ancien canal Ecowitt (ignoré). */
  channel?: string;
  /**
   * Humidité du sol : lectures brutes « sol sec » et « sol ressuyé après
   * arrosage » ; sans étalonnage, la valeur est lue comme une humidité
   * volumique (%) et rapportée à la texture.
   */
  dry?: number;
  wet?: number;
}

/** Relevé : [minutes depuis 1970 (UTC), valeur]. Compact, les capteurs en produisent beaucoup. */
export type Reading = [number, number];

/** Comptage d'un ravageur (et auxiliaires vus), pour la lutte intégrée. */
export interface PestCount extends Meta {
  id: string;
  plantId?: string;
  bedId?: string;
  date: ISODate;
  /** Problème du catalogue de diagnostic (ravageur). */
  pestId: string;
  /** Valeur dans l'unité du ravageur (%, par piège, par plant). */
  value: number;
  beneficials: string[];
  note?: string;
}

/** Envie pour la saison à planifier : espèce, surface, semis échelonnés. */
export interface Wish {
  speciesId: string;
  /** Surface voulue (m²) : pour des semis échelonnés, surface totale de tous les semis. */
  area: number;
  /** Nombre de semis échelonnés (1 = un seul). */
  sowings: number;
  varietyName?: string;
}

export interface SeasonPlan {
  year: number;
  wishes: Wish[];
}

export type PMethod = 'olsen' | 'joretHebert' | 'dyer';

/**
 * Analyse de terre (laboratoire) : pour une planche ou tout le jardin.
 * Unités usuelles des bulletins français : P₂O₅, K₂O et MgO en mg/kg de
 * terre fine, CEC en cmol+/kg (= méq/100 g), matière organique en %.
 */
export interface SoilTest extends Meta {
  id: string;
  /** Planche analysée ; absent = tout le jardin. */
  bedId?: string;
  date: ISODate;
  pH?: number;
  /** Matière organique (%). */
  om?: number;
  pMethod: PMethod;
  P2O5?: number;
  K2O?: number;
  MgO?: number;
  cec?: number;
  /** Argile (%), si le bulletin la donne. */
  clay?: number;
  lab?: string;
  note?: string;
}

/** Renouvellement de la solution d'un bac hydroponique. */
export interface TankChange extends Meta {
  id: string;
  bedId: string;
  date: ISODate;
  volumeL?: number;
  note?: string;
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
  obstacles: Obstacle[];
  phenoEvents: PhenoEvent[];
  treatments: Treatment[];
  seeds: SeedLot[];
  /** Prix au kg choisis par le jardinier (sinon prix de référence du catalogue). */
  prices: Record<string, number>;
  weather?: WeatherCache;
  sensors: Sensor[];
  /** Relevés par capteur, triés par date. */
  readings: Record<string, Reading[]>;
  tankChanges: TankChange[];
  soilTests: SoilTest[];
  pestCounts: PestCount[];
  stocks: StockItem[];
  shopping: ShoppingItem[];
  /** Saison en préparation (planificateur). */
  plan?: SeasonPlan;
  /** Enregistrements supprimés (identifiant → date ISO), pour la fusion de jardins. */
  deleted: Record<string, string>;
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
  obstacles: [],
  phenoEvents: [],
  treatments: [],
  seeds: [],
  prices: {},
  sensors: [],
  readings: {},
  tankChanges: [],
  soilTests: [],
  pestCounts: [],
  stocks: [],
  shopping: [],
  deleted: {},
};

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
