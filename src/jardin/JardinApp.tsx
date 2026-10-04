import { HarvestSheet } from './Harvest';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CatalogView, SpeciesSheet } from './CatalogView';
import { ObservationSheet, TaskSheet, WaterSheet } from './Forms';
import { BedSheet, GardenView, ObstacleSheet } from './GardenView';
import { DiagnosisSheet } from './Health';
import { SeedSheet } from './Seeds';
import { useJT, type JKey } from './i18n';
import { NavCtx, TABS, type Nav, type SheetRequest, type Tab } from './nav';
import { Onboarding } from './Onboarding';
import { AddPlantSheet, PlantSheet, PlantsView } from './PlantsView';
import { SettingsView } from './SettingsView';
import { GardenProvider, useGarden } from './store';
import { useRemoteSync } from './remoteSync';
import { TodayView } from './TodayView';
import { SensorSheet } from './Sensors';
import { SoilTestSheet } from './Soil';
import { PestCountSheet } from './Pests';
import { StockSheet } from './Stocks';
import { rescheduleNotifications } from './notifications';
import { AtelierHost, AteliersView } from './Ateliers';
import type { AtelierId } from '../ateliers/registry';

const TAB_ICON: Record<Tab, string> = { today: '☀', garden: '▦', plants: '🌱', catalog: '📖', breeding: '🧬', settings: '⚙' };

function Shell() {
  const store = useGarden();
  useRemoteSync();
  const { tt, lang } = useJT();
  const [tab, setTabState] = useState<Tab>('today');
  const [stack, setStack] = useState<SheetRequest[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const terrain = store.data.settings.terrain;
  const [atelier, setAtelier] = useState<AtelierId | null>(null);

  // Ouvrir un atelier ajoute une entrée d'historique : le bouton « retour »
  // d'Android (ou du navigateur) ramène au jardin au lieu de quitter l'app.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => setAtelier((e.state as { atelier?: AtelierId } | null)?.atelier ?? null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const openAtelier = useCallback((id: AtelierId) => {
    window.history.pushState({ atelier: id }, '');
    setAtelier(id);
  }, []);
  const closeAtelier = useCallback(() => {
    if ((window.history.state as { atelier?: AtelierId } | null)?.atelier) window.history.back();
    else setAtelier(null);
    window.setTimeout(() => window.scrollTo({ top: 0 }), 0);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('terrain', terrain);
  }, [terrain]);

  // Notifications : reprogrammées quelques secondes après chaque changement (et au changement de langue).
  const { data, ready, activeGarden } = store;
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => void rescheduleNotifications(data, lang).catch(() => {}), 3000);
    return () => window.clearTimeout(t);
  }, [ready, data, lang]);

  // Changer de jardin ferme les fiches ouvertes.
  useEffect(() => setStack([]), [activeGarden]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const close = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const nav = useMemo<Nav>(
    () => ({
      tab,
      setTab: (t) => {
        setTabState(t);
        setStack([]);
        window.scrollTo({ top: 0 });
      },
      // Une fiche ouverte depuis une autre s'empile ; fermer revient à la précédente.
      open: (s) => setStack((st) => [...st.filter((x) => JSON.stringify(x) !== JSON.stringify(s)), s].slice(-4)),
      close,
      toast: setToastMsg,
    }),
    [tab, close],
  );

  if (!store.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ color: 'var(--color-paper-300)' }}>
        {tt('common.loading')}
      </div>
    );
  }
  if (!store.data.settings.onboarded) return <Onboarding />;

  const top = stack[stack.length - 1];

  const toast = toastMsg && (
    <div role="status" className="animate-sprout fixed inset-x-0 bottom-20 z-50 mx-auto w-fit max-w-[90vw] rounded-full px-4 py-2 text-sm shadow-lg" style={{ background: 'var(--color-paper-100)', color: 'var(--color-ink-900)' }}>
      {toastMsg}
    </div>
  );

  if (atelier) {
    return (
      <NavCtx.Provider value={nav}>
        <AtelierHost id={atelier} onExit={closeAtelier} />
        {toast}
      </NavCtx.Provider>
    );
  }

  return (
    <NavCtx.Provider value={nav}>
      <div className="min-h-screen pb-24">
        <header className="border-b" style={{ borderColor: 'var(--color-canopy-800)' }}>
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <p className="font-display text-xl" style={{ color: 'var(--color-paper-100)' }}>
              Lignée <span className="italic" style={{ color: 'var(--color-tomato-400)' }}>· {tt('app.title')}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => store.updateSettings({ terrain: !terrain })}
                aria-pressed={terrain}
                title={tt('settings.terrainHint')}
                className="btn flex h-8 items-center rounded-full px-3 text-xs"
                style={{ background: terrain ? 'var(--color-resin-500)' : 'var(--color-canopy-800)', color: terrain ? 'var(--color-ink-900)' : 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-canopy-600)' }}
              >
                🧤 {tt('settings.terrainShort')}
              </button>
              {store.gardens.length > 1 && (
                <select
                  value={store.activeGarden}
                  onChange={(e) => void store.switchGarden(e.target.value)}
                  aria-label={tt('gardens.switch')}
                  className="h-8 max-w-[8.5rem] truncate rounded-full px-2 text-xs"
                  style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-canopy-600)' }}
                >
                  {store.gardens.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4">
          {store.volatile && (
            <p className="mb-3 rounded px-3 py-2 text-xs" style={{ background: '#f7ecd2', color: '#6b4a10' }}>
              {tt('settings.volatile')}
            </p>
          )}
          {tab === 'today' && <TodayView />}
          {tab === 'garden' && <GardenView />}
          {tab === 'plants' && <PlantsView />}
          {tab === 'catalog' && <CatalogView />}
          {tab === 'breeding' && <AteliersView onOpen={openAtelier} />}
          {tab === 'settings' && <SettingsView />}
          <p className="mt-6 px-2 text-center text-[11px] leading-snug" style={{ color: 'var(--color-paper-300)', opacity: 0.8 }}>
            {tt('app.footer')}
          </p>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t" style={{ background: 'var(--color-canopy-900)', borderColor: 'var(--color-canopy-700)', paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label={tt('nav.label')}>
          <ul className="mx-auto flex max-w-3xl">
            {TABS.map((t) => (
              <li key={t} className="flex-1">
                <button
                  type="button"
                  onClick={() => nav.setTab(t)}
                  aria-current={tab === t ? 'page' : undefined}
                  className="tab flex w-full flex-col items-center gap-0.5 py-2 text-[11px]"
                  style={{ color: tab === t ? 'var(--color-tomato-400)' : 'var(--color-paper-300)' }}
                >
                  <span className="text-lg leading-none" aria-hidden="true">
                    {TAB_ICON[t]}
                  </span>
                  {tt(`nav.${t}` as JKey)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {top?.type === 'plant' && <PlantSheet key={top.id} id={top.id} onClose={close} />}
        {top?.type === 'bed' && <BedSheet key={top.id} id={top.id} onClose={close} />}
        {top?.type === 'species' && <SpeciesSheet key={top.id} id={top.id} onClose={close} />}
        {top?.type === 'addPlant' && <AddPlantSheet key={`${top.editId}-${top.bedId}-${top.speciesId}-${top.typeId}`} bedId={top.bedId} speciesId={top.speciesId} typeId={top.typeId} editId={top.editId} onClose={close} />}
        {top?.type === 'observe' && <ObservationSheet plantId={top.plantId} bedId={top.bedId} onClose={close} />}
        {top?.type === 'harvest' && <HarvestSheet onClose={close} />}
        {top?.type === 'water' && <WaterSheet bedId={top.bedId} kind={top.kind} liters={top.liters} onClose={close} />}
        {top?.type === 'task' && <TaskSheet onClose={close} />}
        {top?.type === 'obstacle' && <ObstacleSheet key={top.id} id={top.id} onClose={close} />}
        {top?.type === 'diagnose' && <DiagnosisSheet key={`${top.plantId}-${top.bedId}`} plantId={top.plantId} bedId={top.bedId} onClose={close} />}
        {top?.type === 'stock' && <StockSheet key={`${top.id}-${top.productId}`} id={top.id} productId={top.productId} onClose={close} />}
        {top?.type === 'pestCount' && <PestCountSheet key={`${top.plantId}-${top.bedId}-${top.pestId}`} plantId={top.plantId} bedId={top.bedId} pestId={top.pestId} onClose={close} />}
        {top?.type === 'soil' && <SoilTestSheet key={`${top.id}-${top.bedId}`} id={top.id} bedId={top.bedId} onClose={close} />}
        {top?.type === 'sensor' && <SensorSheet key={`${top.id}-${top.bedId}-${top.kind}`} id={top.id} bedId={top.bedId} kind={top.kind} onClose={close} />}
        {top?.type === 'seed' && <SeedSheet key={`${top.id}-${top.speciesId}`} id={top.id} speciesId={top.speciesId} onClose={close} />}

        {toast}
      </div>
    </NavCtx.Provider>
  );
}

export default function JardinApp() {
  return (
    <GardenProvider>
      <Shell />
    </GardenProvider>
  );
}
