import type { SelectionGoal } from './selectionProgram';

/**
 * Préréglages d'objectifs de sélection — sauvegarder un `SelectionGoal`
 * nommé pour le relancer plus tard sur d'autres fondateurs sans tout
 * reconfigurer. Stocké dans le localStorage (propre à ce navigateur),
 * séparé du catalogue lui-même (voir persistence.ts).
 */

export interface GoalPreset {
  id: string;
  name: string;
  goal: SelectionGoal;
  savedAt: number;
}

const LOCAL_STORAGE_KEY = 'lignee-goal-presets-v1';

function persist(presets: GoalPreset[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Best-effort — quota dépassé ou stockage désactivé : on continue
    // sans bloquer l'utilisateur.
  }
}

export function loadGoalPresets(): GoalPreset[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GoalPreset[]) : [];
  } catch {
    return [];
  }
}

export function saveGoalPreset(name: string, goal: SelectionGoal): GoalPreset[] {
  const presets = loadGoalPresets();
  const preset: GoalPreset = { id: `preset-${Date.now()}-${Math.round(Math.random() * 1000)}`, name, goal, savedAt: Date.now() };
  const updated = [...presets, preset];
  persist(updated);
  return updated;
}

export function deleteGoalPreset(id: string): GoalPreset[] {
  const updated = loadGoalPresets().filter((p) => p.id !== id);
  persist(updated);
  return updated;
}
