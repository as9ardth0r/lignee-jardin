import type { ChemotypeId, StrainPreset } from './genetics';

export interface AncestorFrequency {
  name: string;
  count: number;
}

export interface CatalogDiversityReport {
  totalVarieties: number;
  withParseableLineage: number;
  uniqueAncestors: number;
  topAncestors: AncestorFrequency[];
  chemotypeCounts: Record<ChemotypeId, number>;
  autofloweringCount: number;
  violetCount: number;
}

/**
 * Extrait les noms de parents mentionnés en tête de la description
 * d'une variété (convention observée dans STRAIN_PRESETS : la
 * description commence généralement par "Parent A × Parent B[, reste
 * des infos]") — un parseur pragmatique sur texte libre, PAS une
 * généalogie vérifiée. Coupe à la première virgule de profondeur 0
 * (les virgules à l'intérieur de parenthèses, ex. "Face Mints ×
 * (Biscotti × Sherbet BX)", ne comptent pas comme séparateur), puis
 * découpe sur "×". Une description sans "×" dans cette portion
 * initiale ne produit aucun nom (variété sans lignée textuelle
 * identifiable — landrace, variété non hybridée connue, ou
 * simplement non documentée dans la description).
 */
export function extractLineageNames(description: string): string[] {
  let cut = description.length;
  let depth = 0;
  for (let i = 0; i < description.length; i++) {
    const c = description[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      cut = i;
      break;
    }
  }
  const lineage = description.slice(0, cut);
  if (!lineage.includes('×')) return [];

  return lineage
    .split('×')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) =>
      p
        .replace(/^\(+/, '')
        .replace(/\)+$/, '')
        .replace(/^(mâle |femelle |clone |pheno |phéno |male |female )/i, '')
        .trim()
    )
    .filter((p) => p.length > 1 && p.length < 40);
}

/**
 * Analyse de diversité génétique du catalogue — À PARTIR DU TEXTE LIBRE
 * des descriptions (voir `extractLineageNames`), donc approximative et
 * dépendante de comment chaque description a été rédigée, PAS une
 * généalogie systématique/vérifiée comme le reste du moteur essaie de
 * l'être ailleurs. Utile pour repérer une tendance (quelques génétiques
 * fondatrices très recyclées à travers le catalogue) plutôt que pour un
 * chiffre exact.
 */
export function analyzeCatalogDiversity(presets: StrainPreset[], topN = 20): CatalogDiversityReport {
  const freq = new Map<string, number>();
  let withParseableLineage = 0;
  const chemotypeCounts: Record<ChemotypeId, number> = { I: 0, II: 0, III: 0, IV: 0, V: 0, VI: 0 };
  let autofloweringCount = 0;
  let violetCount = 0;

  for (const p of presets) {
    chemotypeCounts[p.chemotype] += 1;
    if (p.autoflower) autofloweringCount += 1;
    if (p.violet) violetCount += 1;

    const names = extractLineageNames(p.description);
    if (names.length > 0) withParseableLineage += 1;
    for (const n of names) freq.set(n, (freq.get(n) ?? 0) + 1);
  }

  const topAncestors = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, count]) => ({ name, count }));

  return {
    totalVarieties: presets.length,
    withParseableLineage,
    uniqueAncestors: freq.size,
    topAncestors,
    chemotypeCounts,
    autofloweringCount,
    violetCount,
  };
}
