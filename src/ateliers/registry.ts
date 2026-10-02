/**
 * Les ateliers de sélection Lignée intégrés à Lignée Jardin.
 *
 * Chaque atelier est l'application d'origine, copiée telle quelle sous
 * `src/ateliers/<id>/` (moteur, interface, textes FR/EN) et chargée à la
 * demande : rien n'est téléchargé tant qu'on n'ouvre pas l'atelier. Les
 * données restent dans leurs clés `lignee.<culture>.*`, comme dans les
 * apps séparées.
 */
import type { ComponentType } from 'react';

export type AtelierId = 'tomate' | 'piment' | 'courge' | 'melon' | 'pasteque' | 'haricot' | 'pois' | 'mais' | 'chou' | 'carotte' | 'patate' | 'fraise' | 'muflier' | 'cannabis';

export interface Atelier {
  id: AtelierId;
  name: { fr: string; en: string };
  latin: string;
  emoji: string;
  /** Couleur d'accent de l'app d'origine (--color-tomato-400/500/600). */
  accent: [string, string, string];
  /** Clé « Mes lignées » de l'atelier et nom de culture attendu par l'import du jardin. */
  myVarieties?: { key: string; crop: string };
  load: () => Promise<{ default: ComponentType }>;
}

export const ATELIERS: Atelier[] = [
  { id: 'tomate', name: { fr: 'Tomate', en: 'Tomato' }, latin: 'Solanum lycopersicum', emoji: '🍅', accent: ['#e2674b', '#c7412a', '#9e2f1c'], myVarieties: { key: 'lignee.tomato.myvarieties.v1', crop: 'tomato' }, load: () => import('./tomate/tomato/TomatoApp') },
  { id: 'piment', name: { fr: 'Piment et poivron', en: 'Pepper' }, latin: 'Capsicum', emoji: '🌶️', accent: ['#ea5a3c', '#cc3a22', '#9a2616'], myVarieties: { key: 'lignee.piment.myvarieties.v1', crop: 'piment' }, load: () => import('./piment/piment/PepperApp') },
  { id: 'courge', name: { fr: 'Courge', en: 'Squash' }, latin: 'Cucurbita', emoji: '🎃', accent: ['#ec8a36', '#d4661a', '#a3480c'], myVarieties: { key: 'lignee.courge.myvarieties.v1', crop: 'courge' }, load: () => import('./courge/courge/SquashApp') },
  { id: 'melon', name: { fr: 'Melon', en: 'Melon' }, latin: 'Cucumis melo', emoji: '🍈', accent: ['#e9b04a', '#c88a1e', '#9a6812'], myVarieties: { key: 'lignee.melon.myvarieties.v1', crop: 'melon' }, load: () => import('./melon/melon/MelonApp') },
  { id: 'pasteque', name: { fr: 'Pastèque', en: 'Watermelon' }, latin: 'Citrullus lanatus', emoji: '🍉', accent: ['#ef6b78', '#d63a4f', '#a8263a'], myVarieties: { key: 'lignee.pasteque.myvarieties.v1', crop: 'pasteque' }, load: () => import('./pasteque/pasteque/WatermelonApp') },
  { id: 'haricot', name: { fr: 'Haricot', en: 'Bean' }, latin: 'Phaseolus', emoji: '🫘', accent: ['#c0618e', '#9a3f6c', '#722a50'], myVarieties: { key: 'lignee.haricot.myvarieties.v1', crop: 'haricot' }, load: () => import('./haricot/haricot/BeanApp') },
  { id: 'pois', name: { fr: 'Pois', en: 'Pea' }, latin: 'Pisum sativum', emoji: '🫛', accent: ['#8fbf5a', '#5a8a2c', '#3f6a1e'], myVarieties: { key: 'lignee.pois.myvarieties.v1', crop: 'pois' }, load: () => import('./pois/pois/PeaApp') },
  { id: 'mais', name: { fr: 'Maïs', en: 'Maize' }, latin: 'Zea mays', emoji: '🌽', accent: ['#dc7448', '#bf4f2c', '#8e3418'], myVarieties: { key: 'lignee.mais.myvarieties.v1', crop: 'mais' }, load: () => import('./mais/mais/MaizeApp') },
  { id: 'chou', name: { fr: 'Chou', en: 'Cabbage' }, latin: 'Brassica oleracea', emoji: '🥬', accent: ['#a874b4', '#7d4a8e', '#5a2f68'], myVarieties: { key: 'lignee.chou.myvarieties.v1', crop: 'chou' }, load: () => import('./chou/chou/CabbageApp') },
  { id: 'carotte', name: { fr: 'Carotte', en: 'Carrot' }, latin: 'Daucus carota', emoji: '🥕', accent: ['#f0a050', '#b4561a', '#8e4012'], myVarieties: { key: 'lignee.carotte.myvarieties.v1', crop: 'carotte' }, load: () => import('./carotte/carotte/CarrotApp') },
  { id: 'patate', name: { fr: 'Pomme de terre', en: 'Potato' }, latin: 'Solanum tuberosum', emoji: '🥔', accent: ['#c99a4e', '#9a6a2c', '#6e4a1c'], myVarieties: { key: 'lignee.patate.myvarieties.v1', crop: 'patate' }, load: () => import('./patate/patate/PotatoApp') },
  { id: 'fraise', name: { fr: 'Fraise', en: 'Strawberry' }, latin: 'Fragaria', emoji: '🍓', accent: ['#ef6f86', '#c8324f', '#97203a'], myVarieties: { key: 'lignee.fraise.myvarieties.v1', crop: 'fraise' }, load: () => import('./fraise/fraise/StrawberryApp') },
  { id: 'muflier', name: { fr: 'Muflier', en: 'Snapdragon' }, latin: 'Antirrhinum majus', emoji: '🌺', accent: ['#e46aa8', '#b0186e', '#84104f'], myVarieties: { key: 'lignee.muflier.myvarieties.v1', crop: 'muflier' }, load: () => import('./muflier/muflier/SnapdragonApp') },
  { id: 'cannabis', name: { fr: 'Cannabis', en: 'Cannabis' }, latin: 'Cannabis sativa', emoji: '🌿', accent: ['#d9ae52', '#c89b3c', '#a87d2b'], load: () => import('./cannabis/Entry') },
];

export const ATELIER_BY_ID = Object.fromEntries(ATELIERS.map((a) => [a.id, a])) as Record<AtelierId, Atelier>;

/** Variétés « Mes lignées » enregistrées dans un atelier (tableau brut, tel que l'atelier le stocke). */
export function readAtelierVarieties(a: Atelier): unknown[] {
  if (!a.myVarieties) return [];
  try {
    const raw = window.localStorage.getItem(a.myVarieties.key);
    const data = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(data) ? data : Array.isArray(data?.varieties) ? data.varieties : [];
    return list.filter((v: unknown) => v && typeof v === 'object' && typeof (v as { name?: unknown }).name === 'string');
  } catch {
    return [];
  }
}
