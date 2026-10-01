/**
 * Climats de référence de la France métropolitaine.
 *
 * ORDRES DE GRANDEUR pour faire tourner le bilan hydrique et décaler les
 * calendriers hors-ligne, en attendant la météo locale (phase 2) :
 * - ET₀ : évapotranspiration de référence moyenne (mm/jour) par mois ;
 * - pluie : cumul mensuel moyen (mm) ;
 * - gelées : dates médianes de dernière gelée de printemps et de première
 *   gelée d'automne (jour de l'année), qui varient fortement localement.
 * Valeurs arrondies à partir des normales climatiques usuelles des villes
 * représentatives indiquées ; à remplacer par les données de la station
 * la plus proche dès que possible.
 */
import type { ClimateId, Texture } from '../model';

export interface ClimateProfile {
  id: ClimateId;
  /** ET₀ moyenne (mm/jour), janvier → décembre. */
  et0: number[];
  /** Pluie moyenne (mm/mois), janvier → décembre. */
  rain: number[];
  /** Dernière gelée de printemps et première d'automne (jour de l'année). */
  lastFrost: number;
  firstFrost: number;
}

export const CLIMATES: Record<ClimateId, ClimateProfile> = {
  oceanic: {
    id: 'oceanic',
    et0: [0.5, 0.9, 1.6, 2.5, 3.2, 3.7, 3.8, 3.2, 2.2, 1.2, 0.6, 0.4],
    rain: [110, 85, 75, 65, 65, 45, 45, 50, 65, 95, 105, 115],
    lastFrost: 91, // 1er avril
    firstFrost: 329, // 25 novembre
  },
  parisian: {
    id: 'parisian',
    et0: [0.5, 1.0, 1.8, 2.8, 3.6, 4.2, 4.4, 3.7, 2.4, 1.3, 0.6, 0.4],
    rain: [50, 45, 50, 50, 65, 55, 60, 55, 50, 60, 55, 55],
    lastFrost: 105, // 15 avril
    firstFrost: 309, // 5 novembre
  },
  continental: {
    id: 'continental',
    et0: [0.4, 0.9, 1.8, 2.9, 3.8, 4.4, 4.7, 3.9, 2.6, 1.3, 0.5, 0.3],
    rain: [35, 35, 40, 50, 80, 80, 70, 70, 60, 55, 50, 45],
    lastFrost: 115, // 25 avril
    firstFrost: 293, // 20 octobre
  },
  mediterranean: {
    id: 'mediterranean',
    et0: [1.0, 1.5, 2.5, 3.5, 4.6, 5.6, 6.2, 5.3, 3.6, 2.2, 1.2, 0.9],
    rain: [60, 50, 45, 55, 45, 25, 12, 30, 70, 90, 75, 65],
    lastFrost: 60, // 1er mars
    firstFrost: 344, // 10 décembre
  },
  mountain: {
    id: 'mountain',
    et0: [0.3, 0.7, 1.4, 2.3, 3.1, 3.6, 3.9, 3.3, 2.2, 1.1, 0.4, 0.2],
    rain: [100, 90, 95, 100, 120, 110, 95, 105, 100, 110, 115, 110],
    lastFrost: 140, // 20 mai
    firstFrost: 278, // 5 octobre
  },
};

export const CLIMATE_IDS: ClimateId[] = ['oceanic', 'parisian', 'continental', 'mediterranean', 'mountain'];

/** Le calendrier du catalogue est celui de la région parisienne : décalage (jours) des semis de printemps. */
export function springShiftDays(climate: ClimateId): number {
  return CLIMATES[climate].lastFrost - CLIMATES.parisian.lastFrost;
}

/** Réserve en eau utile (mm par cm de sol exploré par les racines), ordres de grandeur. */
export const AWC_MM_PER_CM: Record<Texture, number> = {
  sand: 0.7,
  sandyLoam: 1.1,
  loam: 1.6,
  siltLoam: 1.9,
  clayLoam: 1.7,
  clay: 1.5,
};

export const TEXTURES: Texture[] = ['sand', 'sandyLoam', 'loam', 'siltLoam', 'clayLoam', 'clay'];
