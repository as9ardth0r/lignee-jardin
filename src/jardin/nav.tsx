import { createContext, useContext } from 'react';

export type Tab = 'today' | 'garden' | 'plants' | 'catalog' | 'breeding' | 'settings';
export const TABS: Tab[] = ['today', 'garden', 'plants', 'catalog', 'breeding', 'settings'];

export type SheetRequest =
  | { type: 'plant'; id: string }
  | { type: 'bed'; id: string }
  | { type: 'species'; id: string }
  | { type: 'addPlant'; bedId?: string; speciesId?: string; typeId?: string; editId?: string; indoor?: boolean; varietyName?: string }
  | { type: 'observe'; plantId?: string; bedId?: string }
  | { type: 'water'; bedId?: string; kind?: 'rain' | 'irrigation'; liters?: number }
  | { type: 'task' }
  | { type: 'harvest' }
  | { type: 'obstacle'; id: string }
  | { type: 'diagnose'; plantId?: string; bedId?: string }
  | { type: 'seed'; id?: string; speciesId?: string }
  | { type: 'stock'; id?: string; productId?: string }
  | { type: 'pestCount'; plantId?: string; bedId?: string; pestId?: string }
  | { type: 'soil'; id?: string; bedId?: string }
  | { type: 'sensor'; id?: string; bedId?: string; kind?: import('./model').SensorKind };

export interface Nav {
  tab: Tab;
  setTab: (t: Tab) => void;
  open: (s: SheetRequest) => void;
  close: () => void;
  toast: (msg: string) => void;
}

export const NavCtx = createContext<Nav | null>(null);

export function useNav(): Nav {
  const n = useContext(NavCtx);
  if (!n) throw new Error('useNav hors de NavCtx');
  return n;
}
