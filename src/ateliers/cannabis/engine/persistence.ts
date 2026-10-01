import type { Individual } from './genetics';
import { ensureIdCounterAbove } from './genetics';

/**
 * Persistance du catalogue — deux mécanismes complémentaires :
 *  1. Sauvegarde automatique dans le localStorage du navigateur (clé
 *     `LOCAL_STORAGE_KEY`), pour survivre à un rafraîchissement de
 *     page. Propre à CE navigateur/appareil, jamais transmise nulle
 *     part.
 *  2. Export/import explicite en fichier .json (voir `serializeCatalog`
 *     / `parseCatalog`), pour une sauvegarde portable entre appareils
 *     ou une archive datée — c'est ce fichier qu'il faut partager ou
 *     conserver au long cours, pas le localStorage (effaçable par le
 *     navigateur, ex. en navigation privée ou après nettoyage du cache).
 */

export const LOCAL_STORAGE_KEY = 'lignee-catalogue-v1';
const FORMAT_VERSION = 1;

interface CatalogFile {
  formatVersion: number;
  savedAt: number;
  individuals: Individual[];
}

export function serializeCatalog(individuals: Individual[]): string {
  const file: CatalogFile = { formatVersion: FORMAT_VERSION, savedAt: Date.now(), individuals };
  return JSON.stringify(file, null, 2);
}

/** Valide grossièrement la forme attendue avant d'accepter un import —
 * pas une validation exhaustive de chaque locus, juste de quoi éviter
 * de planter l'app sur un fichier étranger ou corrompu. */
function looksLikeIndividual(x: unknown): x is Individual {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.generation === 'number' &&
    (o.sex === 'F' || o.sex === 'M') &&
    Array.isArray(o.B) &&
    Array.isArray(o.SEX)
  );
}

export function parseCatalog(json: string): Individual[] {
  const parsed: unknown = JSON.parse(json);
  const individuals = Array.isArray(parsed)
    ? parsed // ancien format éventuel : tableau brut
    : (parsed as Partial<CatalogFile>)?.individuals;
  if (!Array.isArray(individuals) || !individuals.every(looksLikeIndividual)) {
    throw new Error('Fichier non reconnu : ce n\'est pas un export de catalogue Lignée valide.');
  }
  return individuals;
}

export function saveToLocalStorage(individuals: Individual[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, serializeCatalog(individuals));
  } catch {
    // Best-effort — quota dépassé ou stockage désactivé (navigation
    // privée) : on continue sans bloquer l'utilisateur.
  }
}

/** Charge le catalogue sauvegardé (s'il existe) et fait avancer le
 * compteur d'ids en conséquence — à appeler une seule fois au montage
 * de l'app. */
export function loadFromLocalStorage(): Individual[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const individuals = parseCatalog(raw);
    ensureIdCounterAbove(individuals.map((i) => i.id));
    return individuals;
  } catch {
    return null;
  }
}
