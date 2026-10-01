import type { StrainPreset } from './genetics';
import { STRAIN_PRESETS, ALL_STRAIN_PRESETS } from './genetics';

/**
 * Persistance des souches ajoutées à la main par l'utilisateur (page
 * "Ajouter une souche") — mêmes principes que persistence.ts pour le
 * catalogue de spécimens : sauvegarde automatique dans le localStorage
 * de CE navigateur, propre à l'appareil. Un import/export .json séparé
 * (mêmes fonctions ici) permet de transporter sa bibliothèque perso
 * d'un appareil à l'autre ou de la partager.
 *
 * Ces souches ne modifient jamais genetics.ts : elles sont fusionnées
 * à l'affichage (voir App.tsx, `combinedPresets`) avec STRAIN_PRESETS +
 * ALL_STRAIN_PRESETS, en tête de liste, avec une fiche complète comme
 * les variétés vérifiées à la main.
 */

export const CUSTOM_STRAINS_STORAGE_KEY = 'lignee-souches-perso-v1';
const FORMAT_VERSION = 1;

interface CustomStrainsFile {
  formatVersion: number;
  savedAt: number;
  strains: StrainPreset[];
}

function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function slugify(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Génère un id unique (slug de `name`) qui ne rentre en collision ni
 * avec le catalogue intégré (curé + bibliothèque ouverte) ni avec les
 * souches perso déjà enregistrées. */
export function generateCustomStrainId(name: string, existingCustom: StrainPreset[]): string {
  const taken = new Set<string>([
    ...STRAIN_PRESETS.map((p) => p.id),
    ...ALL_STRAIN_PRESETS.map((p) => p.id),
    ...existingCustom.map((p) => p.id),
  ]);
  const base = slugify(name) || 'souche-perso';
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function serializeCustomStrains(strains: StrainPreset[]): string {
  const file: CustomStrainsFile = { formatVersion: FORMAT_VERSION, savedAt: Date.now(), strains };
  return JSON.stringify(file, null, 2);
}

function looksLikeStrainPreset(x: unknown): x is StrainPreset {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.name === 'string' && typeof o.chemotype === 'string';
}

export function parseCustomStrains(json: string): StrainPreset[] {
  const parsed: unknown = JSON.parse(json);
  const strains = Array.isArray(parsed) ? parsed : (parsed as Partial<CustomStrainsFile>)?.strains;
  if (!Array.isArray(strains) || !strains.every(looksLikeStrainPreset)) {
    throw new Error("Fichier non reconnu : ce n'est pas un export de souches Lignée valide.");
  }
  return strains;
}

export function saveCustomStrainsToLocalStorage(strains: StrainPreset[]) {
  try {
    localStorage.setItem(CUSTOM_STRAINS_STORAGE_KEY, serializeCustomStrains(strains));
  } catch {
    // Best-effort — quota dépassé ou stockage désactivé.
  }
}

export function loadCustomStrainsFromLocalStorage(): StrainPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STRAINS_STORAGE_KEY);
    if (!raw) return [];
    return parseCustomStrains(raw);
  } catch {
    return [];
  }
}
