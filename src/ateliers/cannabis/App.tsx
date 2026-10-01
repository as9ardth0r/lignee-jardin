import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BreedingEngine,
  CHEMOTYPES,
  type ChemotypeId,
  type Individual,
  type JournalEntry,
  type Sex,
  type StrainInfo,
  type StrainPreset,
} from './engine/genetics';
import { loadFromLocalStorage, parseCatalog, saveToLocalStorage, serializeCatalog } from './engine/persistence';
import {
  generateCustomStrainId,
  loadCustomStrainsFromLocalStorage,
  parseCustomStrains,
  saveCustomStrainsToLocalStorage,
  serializeCustomStrains,
} from './engine/customStrains';
import { downloadTextFile, readFileAsText } from './utils/download';
import { LeafMark } from './components/LeafMark';
import { FounderForm } from './components/FounderForm';
import { AddStrainForm } from './components/AddStrainForm';
import { SpecimenJournal } from './components/SpecimenJournal';
import { SpecimenCard } from './components/SpecimenCard';
import { CrossPanel } from './components/CrossPanel';
import { ComparisonPanel } from './components/ComparisonPanel';
import { SegregationChart } from './components/SegregationChart';
import { PedigreeTree } from './components/PedigreeTree';
import { ResinSwatch } from './components/ResinSwatch';
import { TerpeneProfile } from './components/TerpeneProfile';
import { PlantPortrait } from './components/PlantPortrait';
import { StrainInfoPanel } from './components/StrainInfoPanel';
import { NutrientPanel } from './components/NutrientPanel';
import { YieldPanel } from './components/YieldPanel';
import { VigorGauge } from './components/VigorGauge';
import { VigorDistribution } from './components/VigorDistribution';
import { SelectionProgramPanel } from './components/SelectionProgramPanel';
import { CatalogDiversityPanel } from './components/CatalogDiversityPanel';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useTranslation } from './i18n/LanguageContext';
import { STRAIN_PRESETS } from './engine/genetics';
import type { SelectionProgramResult } from './engine/selectionProgram';

/** Loci mendéliens modélisés (B, O, P, C, pigment V, terpinolène T) +
 * les loci additifs du trait de vigueur (N_VIGOR_LOCI dans
 * genetics.ts, non exporté) — voir l'en-tête de genetics.ts pour le
 * détail de chacun. Total figé tant que le moteur génétique n'ajoute
 * pas de locus ; recompter ici si genetics.ts en gagne un.
 */
const GENETIC_LOCI_COUNT = 6 + 8;

const CHEMOTYPE_ORDER: ChemotypeId[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export default function App() {
  const { t, tPlural, language } = useTranslation();
  const engineRef = useRef<BreedingEngine>(new BreedingEngine(20260923));
  const engine = engineRef.current;

  // Chargement synchrone depuis le localStorage au premier rendu (voir
  // persistence.ts) — survit à un rafraîchissement de page. Le
  // localStorage reste propre à ce navigateur/appareil ; l'export/import
  // .json (boutons "Sauvegarder"/"Charger" du catalogue) est la voie
  // portable entre appareils ou pour une archive datée.
  const [individuals, setIndividuals] = useState<Individual[]>(() => loadFromLocalStorage() ?? []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [lastBatchIds, setLastBatchIds] = useState<string[]>([]);
  const [showFounderForm, setShowFounderForm] = useState(true);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Souches ajoutées à la main par l'utilisateur ("Ajouter une souche")
  // — persistées séparément du catalogue de spécimens (voir
  // engine/customStrains.ts), propre à ce navigateur/appareil.
  const [customStrains, setCustomStrains] = useState<StrainPreset[]>(() => loadCustomStrainsFromLocalStorage());
  const [showAddStrainForm, setShowAddStrainForm] = useState(false);
  const [customStrainMessage, setCustomStrainMessage] = useState<string | null>(null);
  const customStrainImportRef = useRef<HTMLInputElement>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [markedForDelete, setMarkedForDelete] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  // Conditions de culture simulées (G×E) — voir BreedingEngine.visibleVioletExpression :
  // pas une propriété du spécimen, juste un paramètre d'affichage.
  const [coldStress, setColdStress] = useState<(typeof BreedingEngine.coldStressLevels)[number]>('modéré');

  useEffect(() => {
    saveToLocalStorage(individuals);
  }, [individuals]);

  useEffect(() => {
    saveCustomStrainsToLocalStorage(customStrains);
  }, [customStrains]);

  useEffect(() => {
    if (!catalogMessage) return;
    const timer = setTimeout(() => setCatalogMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [catalogMessage]);

  useEffect(() => {
    if (!customStrainMessage) return;
    const timer = setTimeout(() => setCustomStrainMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [customStrainMessage]);

  // byId reste sur TOUS les individus (y compris archivés) : un
  // descendant non archivé doit toujours pouvoir résoudre un ancêtre
  // archivé dans son arbre généalogique. Seule la liste du catalogue
  // (generations) filtre les archivés par défaut.
  const byId = useMemo(() => new Map(individuals.map((i) => [i.id, i])), [individuals]);
  const focused = focusedId ? byId.get(focusedId) ?? null : null;
  const archivedCount = useMemo(() => individuals.filter((i) => i.archived).length, [individuals]);

  const generations = useMemo(() => {
    const visible = showArchived ? individuals : individuals.filter((i) => !i.archived);
    const groups = new Map<number, Individual[]>();
    for (const ind of visible) {
      if (!groups.has(ind.generation)) groups.set(ind.generation, []);
      groups.get(ind.generation)!.push(ind);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [individuals, showArchived]);

  const parentA = selectedIds[0] ? byId.get(selectedIds[0]) ?? null : null;
  const parentB = selectedIds[1] ? byId.get(selectedIds[1]) ?? null : null;

  function handleCreateFounder(opts: {
    chemotype: ChemotypeId;
    sex: Sex;
    autoflower: boolean;
    violet: boolean;
    propylVariant: boolean;
    reversedFemale: boolean;
    label: string;
    strainInfo?: StrainInfo;
    presetLabel?: string;
  }) {
    const founder = engine.createFounder(opts);
    setIndividuals((prev) => [...prev, founder]);
    setFocusedId(founder.id);
  }

  function handleClone(id: string) {
    const source = byId.get(id);
    if (!source) return;
    const clone = engine.cloneOf(source);
    setIndividuals((prev) => [...prev, clone]);
    setFocusedId(clone.id);
  }

  function handleUpdateNotes(id: string, notes: string) {
    setIndividuals((prev) => prev.map((ind) => (ind.id === id ? { ...ind, notes } : ind)));
  }

  function handleAddJournalEntry(id: string, entry: Omit<JournalEntry, 'id'>) {
    const withId: JournalEntry = { ...entry, id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    setIndividuals((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, journal: [...(ind.journal ?? []), withId] } : ind))
    );
  }

  function handleDeleteJournalEntry(id: string, entryId: string) {
    setIndividuals((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, journal: (ind.journal ?? []).filter((e) => e.id !== entryId) } : ind))
    );
  }

  function handleExportJournal(individual: Individual) {
    const entries = [...(individual.journal ?? [])].sort((a, b) => a.date - b.date);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    const lines = [
      `${t('journal.export.header', { name: individual.label || individual.id })}`,
      `${t('journal.export.genotype')}: ${engine.genotypeCode(individual)}`,
      '',
      ...entries.flatMap((e) => {
        const dateStr = new Date(e.date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
        const parts = [`## ${dateStr}${e.stage ? ` — ${e.stage}` : ''}${e.heightCm != null ? ` — ${e.heightCm} cm` : ''}`];
        if (e.text) parts.push(e.text);
        if (e.issues) parts.push(`${t('journal.form.issues')}: ${e.issues}`);
        if (e.actions) parts.push(`${t('journal.form.actions')}: ${e.actions}`);
        parts.push('');
        return parts;
      }),
    ];
    downloadTextFile(`carnet-${individual.id}.txt`, lines.join('\n'), 'text/plain');
  }

  function handleSetArchived(id: string, archived: boolean) {
    setIndividuals((prev) => prev.map((ind) => (ind.id === id ? { ...ind, archived } : ind)));
  }

  function handleExportCatalog() {
    downloadTextFile('lignee-catalogue.json', serializeCatalog(individuals), 'application/json');
  }

  async function handleImportCatalog(file: File) {
    try {
      const text = await readFileAsText(file);
      const imported = parseCatalog(text);
      setIndividuals(imported);
      setSelectedIds([]);
      setFocusedId(null);
      setCatalogMessage(t('catalog.import.success', { n: imported.length }));
    } catch (e) {
      setCatalogMessage(t('catalog.import.error', { message: e instanceof Error ? e.message : String(e) }));
    }
  }

  function handleCreateCustomStrain(preset: StrainPreset) {
    setCustomStrains((prev) => [...prev, preset]);
    setCustomStrainMessage(t('addStrainForm.success', { name: preset.name }));
  }

  function handleDeleteCustomStrain(id: string) {
    setCustomStrains((prev) => prev.filter((p) => p.id !== id));
  }

  function handleExportCustomStrains() {
    downloadTextFile('lignee-souches-perso.json', serializeCustomStrains(customStrains), 'application/json');
  }

  async function handleImportCustomStrains(file: File) {
    try {
      const text = await readFileAsText(file);
      const imported = parseCustomStrains(text);
      setCustomStrains((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of imported) {
          merged.push(existingIds.has(p.id) ? { ...p, id: generateCustomStrainId(p.name, merged) } : p);
        }
        return merged;
      });
      setCustomStrainMessage(t('addStrainForm.import.success', { n: imported.length }));
    } catch (e) {
      setCustomStrainMessage(t('catalog.import.error', { message: e instanceof Error ? e.message : String(e) }));
    }
  }

  function toggleSelect(id: string) {
    setFocusedId(id);
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length < 2) return [...prev, id];
      return [prev[1], id];
    });
  }

  function toggleMarkForDelete(id: string) {
    setMarkedForDelete((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /** Nombre d'individus du catalogue (hors ceux visés par la
   * suppression elle-même) qui référencent un des ids donnés comme
   * parent — sert à prévenir avant de casser un arbre généalogique
   * consultable ailleurs, sans pour autant bloquer la suppression
   * (PedigreeTree gère déjà un parent manquant sans planter). */
  function countDependents(ids: string[]): number {
    const idSet = new Set(ids);
    return individuals.filter(
      (ind) => !idSet.has(ind.id) && ind.parentIds && (idSet.has(ind.parentIds[0]) || idSet.has(ind.parentIds[1]))
    ).length;
  }

  function deleteIndividuals(ids: string[]) {
    if (ids.length === 0) return;
    const dependents = countDependents(ids);
    const confirmMsg =
      (ids.length > 1 ? `Supprimer ces ${ids.length} spécimens ?` : 'Supprimer ce spécimen ?') +
      (dependents > 0
        ? ` ${dependents} descendant${dependents > 1 ? 's' : ''} resteront dans le catalogue mais perdront la trace de ce(s) parent(s) dans l'arbre généalogique.`
        : '');
    if (!window.confirm(confirmMsg)) return;
    const idSet = new Set(ids);
    setIndividuals((prev) => prev.filter((ind) => !idSet.has(ind.id)));
    setSelectedIds((prev) => prev.filter((id) => !idSet.has(id)));
    setMarkedForDelete((prev) => prev.filter((id) => !idSet.has(id)));
    if (focusedId && idSet.has(focusedId)) setFocusedId(null);
  }

  function handleCross(n: number) {
    if (!parentA || !parentB) return;
    const offspring = engine.crossMany(parentA, parentB, n);
    setIndividuals((prev) => [...prev, ...offspring]);
    setLastBatchIds(offspring.map((o) => o.id));
    setFocusedId(offspring[0]?.id ?? null);
  }

  function handleProgramComplete(result: SelectionProgramResult) {
    const existingIds = new Set(individuals.map((i) => i.id));
    const newOnes = result.chainIndividuals.filter((i) => !existingIds.has(i.id));
    if (newOnes.length === 0) return;
    setIndividuals((prev) => [...prev, ...newOnes]);
    setLastBatchIds(result.steps.map((s) => s.individual.id));
    const finalId = result.best?.individual.id ?? result.steps.at(-1)?.individual.id ?? null;
    if (finalId) setFocusedId(finalId);
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse 1200px 800px at 15% -10%, var(--color-canopy-800) 0%, transparent 60%), radial-gradient(ellipse 900px 700px at 100% 30%, var(--color-canopy-900) 0%, transparent 55%), var(--color-canopy-950)',
      }}
    >
      <header className="relative overflow-hidden border-b" style={{ borderColor: 'var(--color-canopy-800)' }}>
        <LeafMark
          className="pointer-events-none absolute -right-16 -top-10 h-[360px] w-[360px] opacity-[0.14] sm:h-[460px] sm:w-[460px] xl:h-[560px] xl:w-[560px]"
          style={{ color: 'var(--color-resin-500)' }}
        />
        <LeafMark
          className="pointer-events-none absolute -left-24 bottom-0 hidden h-[300px] w-[300px] opacity-[0.07] xl:block"
          style={{ color: 'var(--color-leaf-500)', transform: 'scaleX(-1) rotate(12deg)' }}
        />
        <div className="relative mx-auto max-w-[1440px] px-5 py-10 sm:py-14">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs tracking-wide" style={{ color: 'var(--color-resin-400)' }}>
              {t('app.eyebrow')}
            </p>
            <LanguageSwitcher />
          </div>

          <div className="mt-2 grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-12">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl" style={{ color: 'var(--color-paper-100)' }}>
                {t('app.title')}
              </h1>
              <p className="font-display italic text-lg sm:text-xl mt-3 max-w-xl" style={{ color: 'var(--color-paper-200)' }}>
                {t('app.subtitle')}
              </p>
              <p className="text-sm mt-4 max-w-xl leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
                {t('app.description')}
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-x-6 gap-y-4 xl:min-w-[380px]">
              {[
                { value: STRAIN_PRESETS.length, label: tPlural('app.stats.varieties', STRAIN_PRESETS.length) },
                {
                  value: Object.keys(CHEMOTYPES).length,
                  label: tPlural('app.stats.chemotypes', Object.keys(CHEMOTYPES).length),
                },
                { value: GENETIC_LOCI_COUNT, label: tPlural('app.stats.loci', GENETIC_LOCI_COUNT) },
              ].map((stat, i) => (
                <div key={i} className="border-l pl-3" style={{ borderColor: 'var(--color-canopy-700)' }}>
                  <p className="genotype-code font-display text-3xl sm:text-4xl" style={{ color: 'var(--color-resin-400)' }}>
                    {stat.value.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </p>
                  <p className="text-[11px] leading-snug mt-1" style={{ color: 'var(--color-paper-300)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1440px] px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(280px,380px)] items-start">
          {/* Colonne gauche — catalogue de spécimens */}
          <div className="space-y-4 order-1 lg:order-1">
            <div className="specimen-card p-5">
              <button
                type="button"
                onClick={() => setShowFounderForm((v) => !v)}
                className="flex w-full items-center justify-between font-display text-xl"
              >
                {t('founder.panel.title')}
                <span className="text-sm">{showFounderForm ? '−' : '+'}</span>
              </button>
              {showFounderForm && (
                <div className="mt-4">
                  <FounderForm customStrains={customStrains} onCreate={handleCreateFounder} />
                </div>
              )}
            </div>

            <div className="specimen-card p-5">
              <button
                type="button"
                onClick={() => setShowAddStrainForm((v) => !v)}
                className="flex w-full items-center justify-between font-display text-xl"
              >
                {t('addStrainForm.panel.title')}
                <span className="text-sm">{showAddStrainForm ? '−' : '+'}</span>
              </button>
              {showAddStrainForm && (
                <div className="mt-4">
                  <AddStrainForm
                    makeId={(name) => generateCustomStrainId(name, customStrains)}
                    onCreate={handleCreateCustomStrain}
                  />
                </div>
              )}

              {customStrains.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <p style={{ color: 'var(--color-ink-500)' }}>
                      {tPlural('addStrainForm.list.count', customStrains.length)}
                    </p>
                    <span className="divider-vine flex-1" />
                  </div>
                  <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {customStrains.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded px-2.5 py-1.5 text-xs"
                        style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
                      >
                        <span className="truncate">{p.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomStrain(p.id)}
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px]"
                          style={{ color: 'var(--color-bloom-400)' }}
                          title={t('addStrainForm.list.deleteTitle', { name: p.name })}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleExportCustomStrains}
                      className="rounded px-2 py-1 transition-colors"
                      style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
                    >
                      {t('catalog.export')}
                    </button>
                    <button
                      type="button"
                      onClick={() => customStrainImportRef.current?.click()}
                      className="rounded px-2 py-1 transition-colors"
                      style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
                    >
                      {t('catalog.import')}
                    </button>
                    <input
                      ref={customStrainImportRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleImportCustomStrains(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>
              )}
              {customStrainMessage && (
                <p className="mt-2 text-[11px]" style={{ color: 'var(--color-leaf-500)' }}>
                  {customStrainMessage}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 px-1 text-[11px]">
              <button
                type="button"
                onClick={handleExportCatalog}
                className="rounded px-2 py-1 transition-colors"
                style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
              >
                {t('catalog.export')}
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="rounded px-2 py-1 transition-colors"
                style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
              >
                {t('catalog.import')}
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportCatalog(file);
                  e.target.value = '';
                }}
              />
              {catalogMessage && (
                <span style={{ color: 'var(--color-leaf-500)' }}>{catalogMessage}</span>
              )}
            </div>

            <div className="flex items-center gap-2 px-1 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setDeleteMode((v) => !v);
                  setMarkedForDelete([]);
                }}
                className="rounded px-2 py-1 transition-colors"
                style={{
                  background: deleteMode ? 'var(--color-bloom-500)' : 'var(--color-canopy-800)',
                  color: deleteMode ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
                }}
              >
                {deleteMode ? t('catalog.deleteMode.cancel') : t('catalog.deleteMode.enter')}
              </button>
              {deleteMode && markedForDelete.length > 0 && (
                <button
                  type="button"
                  onClick={() => deleteIndividuals(markedForDelete)}
                  className="rounded px-2 py-1 font-medium transition-colors"
                  style={{ background: 'var(--color-bloom-600, #b91c1c)', color: 'white' }}
                >
                  {t('catalog.deleteMode.confirm', { n: markedForDelete.length })}
                </button>
              )}
              {archivedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  className="rounded px-2 py-1 transition-colors"
                  style={{
                    background: showArchived ? 'var(--color-resin-500)' : 'var(--color-canopy-800)',
                    color: showArchived ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
                  }}
                >
                  {showArchived ? t('catalog.archived.hide') : t('catalog.archived.show', { n: archivedCount })}
                </button>
              )}
            </div>

            <div>
              <p className="text-xs mb-2 px-1" style={{ color: 'var(--color-paper-300)' }}>
                {tPlural('catalog.count', showArchived ? individuals.length : individuals.length - archivedCount)}
              </p>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                {generations.map(([gen, list]) => (
                  <div key={gen}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <p className="text-xs font-medium" style={{ color: 'var(--color-resin-400)' }}>
                        {t('catalog.generation', { n: gen })}
                      </p>
                      <span className="divider-vine flex-1" />
                    </div>
                    {list.length > 1 && (
                      <div className="mb-2 px-1 space-y-3">
                        <SegregationChart individuals={list} engine={engine} />
                        <VigorDistribution individuals={list} engine={engine} />
                      </div>
                    )}
                    <div className="space-y-2">
                      {list.map((ind) => (
                        <SpecimenCard
                          key={ind.id}
                          individual={ind}
                          engine={engine}
                          selectable
                          selected={deleteMode ? markedForDelete.includes(ind.id) : selectedIds.includes(ind.id)}
                          onToggleSelect={deleteMode ? toggleMarkForDelete : toggleSelect}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {individuals.length === 0 && (
                  <div className="specimen-card p-5">
                    <p className="font-display text-lg" style={{ color: 'var(--color-ink-900)' }}>
                      {t('catalog.empty.title')}
                    </p>
                    <div className="divider-vine my-3" style={{ background: 'var(--color-paper-300)' }} />
                    <ol className="space-y-3">
                      {[t('catalog.empty.step1'), t('catalog.empty.step2'), t('catalog.empty.step3')].map(
                        (step, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span
                              className="genotype-code flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px]"
                              style={{ background: 'var(--color-canopy-800)', color: 'var(--color-resin-400)' }}
                            >
                              {i + 1}
                            </span>
                            <span className="text-xs leading-snug pt-0.5" style={{ color: 'var(--color-ink-700)' }}>
                              {step}
                            </span>
                          </li>
                        )
                      )}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne centrale — croisement */}
          <div className="space-y-6 order-2 lg:order-2">
            <CrossPanel
              parentA={parentA}
              parentB={parentB}
              onCross={handleCross}
              chemotypeOf={(i) => engine.chemotypeOf(i)}
              genotypeCode={(i) => engine.genotypeCode(i)}
            />

            <SelectionProgramPanel
              parentA={parentA}
              parentB={parentB}
              engine={engine}
              onProgramComplete={handleProgramComplete}
            />

            {parentA && parentB && <ComparisonPanel a={parentA} b={parentB} engine={engine} />}

            {lastBatchIds.length > 0 && (
              <div className="specimen-card p-5">
                <p className="font-display text-xl mb-1">{t('lastBatch.title')}</p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-ink-500)' }}>
                  {t('lastBatch.count', { n: lastBatchIds.length })}
                </p>
                <SegregationChartWrapper ids={lastBatchIds} byId={byId} engine={engine} />
                <div className="mt-3">
                  <VigorDistribution
                    individuals={lastBatchIds.map((id) => byId.get(id)).filter((x): x is Individual => Boolean(x))}
                    engine={engine}
                  />
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lastBatchIds.map((id, i) => {
                    const ind = byId.get(id);
                    if (!ind) return null;
                    return (
                      <div key={id} className="animate-sprout" style={{ animationDelay: `${Math.min(i * 35, 600)}ms` }}>
                        <SpecimenCard
                          individual={ind}
                          engine={engine}
                          selectable
                          selected={deleteMode ? markedForDelete.includes(ind.id) : selectedIds.includes(ind.id)}
                          onToggleSelect={deleteMode ? toggleMarkForDelete : toggleSelect}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite — détail du spécimen sélectionné */}
          <div className="order-3 space-y-4 lg:sticky lg:top-6">
            {focused ? (
              <div className="specimen-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-ink-500)' }}>
                    {t('specimen.sheetTitle')}
                  </p>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleClone(focused.id)}
                      className="rounded px-2 py-1 text-[10px] font-medium transition-transform hover:-translate-y-0.5"
                      style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-200)' }}
                      title={t('specimen.cloneButtonTitle')}
                    >
                      {t('specimen.cloneButton')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetArchived(focused.id, !focused.archived)}
                      className="rounded px-2 py-1 text-[10px] font-medium transition-transform hover:-translate-y-0.5"
                      style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-200)' }}
                      title={focused.archived ? t('specimen.unarchiveButtonTitle') : t('specimen.archiveButtonTitle')}
                    >
                      {focused.archived ? t('specimen.unarchiveButton') : t('specimen.archiveButton')}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteIndividuals([focused.id])}
                      className="rounded px-2 py-1 text-[10px] font-medium transition-transform hover:-translate-y-0.5"
                      style={{ background: 'var(--color-canopy-700)', color: 'var(--color-paper-200)' }}
                      title={t('specimen.deleteButtonTitle')}
                    >
                      {t('specimen.deleteButton')}
                    </button>
                  </div>
                </div>
                {focused.archived && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--color-resin-400)' }}>
                    {t('specimen.archivedNote')}
                  </p>
                )}
                <p className="font-display text-2xl mt-1">{focused.label || focused.id}</p>
                <p className="genotype-code text-sm opacity-70 mt-0.5">
                  {engine.genotypeCode(focused)} · {CHEMOTYPES[engine.chemotypeOf(focused)].label}
                </p>
                <p className="genotype-code text-xs opacity-60 mt-0.5">
                  {t('specimen.pigment.label', { a: focused.PIGMENT[0], b: focused.PIGMENT[1] })}
                  {engine.isVioletExpressed(focused)
                    ? ` · ${t('specimen.pigment.expressed')}`
                    : engine.isVioletCarrier(focused)
                      ? ` · ${t('specimen.pigment.carrier')}`
                      : ` · ${t('specimen.pigment.green')}`}
                  {focused.autoflower ? ` · ${t('specimen.autoflower')}` : ''}
                </p>
                {focused.clonedFromId && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--color-leaf-500)' }}>
                    {t('specimen.clonedFrom', { name: byId.get(focused.clonedFromId)?.label || focused.clonedFromId })}
                  </p>
                )}

                {focused.PIGMENT.includes('v') && (
                  <div className="mt-2 rounded p-2" style={{ background: 'var(--color-canopy-800)' }}>
                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-500)' }}>
                      Conditions de fin de floraison simulées
                    </p>
                    <div className="flex gap-1">
                      {BreedingEngine.coldStressLevels.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setColdStress(level)}
                          className="flex-1 rounded px-1.5 py-1 text-[10px] transition-colors"
                          style={{
                            background: coldStress === level ? 'var(--color-bloom-500)' : 'var(--color-canopy-700)',
                            color: coldStress === level ? 'var(--color-ink-900)' : 'var(--color-paper-200)',
                          }}
                        >
                          {level === 'faible' ? 'stress faible' : level === 'modéré' ? 'stress modéré' : 'stress fort'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-ink-500)' }}>
                      {(() => {
                        const vis = engine.visibleVioletExpression(focused, coldStress);
                        return vis === 'pleine'
                          ? 'Pigmentation violette pleinement visible dans ces conditions.'
                          : vis === 'légère'
                            ? 'Teinte violette partielle seulement — le potentiel génétique est là mais pas pleinement déclenché.'
                            : 'Reste essentiellement vert dans ces conditions, malgré le potentiel génétique violet.';
                      })()}
                    </p>
                  </div>
                )}

                <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />

                <div className="flex justify-center">
                  <PlantPortrait
                    seed={focused.id}
                    pheno={engine.cannabinoidPhenotype(focused)}
                    violetExpressed={engine.isVioletExpressed(focused)}
                    violetCarrier={engine.isVioletCarrier(focused)}
                    vigorPercent={engine.vigorPercent(focused)}
                    size={150}
                  />
                </div>
                <p className="text-[10px] text-center italic mt-1" style={{ color: 'var(--color-ink-500)' }}>
                  {t('specimen.portraitCaption')}
                </p>

                <div className="mt-3">
                  <ResinSwatch pheno={engine.cannabinoidPhenotype(focused)} size={72} />
                </div>

                <div className="mt-3">
                  <VigorGauge percent={engine.vigorPercent(focused)} raw={focused.vigor} size="lg" />
                  <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-ink-500)' }}>
                    {t('specimen.vigorTraitDescription')}
                  </p>
                </div>

                <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />

                <TerpeneProfile individual={focused} engine={engine} />

                <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />

                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-ink-500)' }}>
                  {t('specimen.cultivationSheet.title')}
                </p>
                {focused.strainInfo ? (
                  <StrainInfoPanel info={focused.strainInfo} />
                ) : focused.presetLabel ? (
                  <p className="text-xs italic" style={{ color: 'var(--color-ink-500)' }}>
                    {t('specimen.cultivationSheet.openLibrary', { name: focused.presetLabel })}
                  </p>
                ) : focused.parentIds ? (
                  <p className="text-xs italic" style={{ color: 'var(--color-ink-500)' }}>
                    {t('specimen.cultivationSheet.hybrid')}
                  </p>
                ) : (
                  <p className="text-xs italic" style={{ color: 'var(--color-ink-500)' }}>
                    {t('specimen.cultivationSheet.customFounder')}
                  </p>
                )}

                <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />

                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-ink-500)' }}>
                  {t('specimen.nutrients.title')}
                </p>
                <NutrientPanel individual={focused} engine={engine} />

                <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />

                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-ink-500)' }}>
                  {t('specimen.yield.title')}
                </p>
                <YieldPanel individual={focused} engine={engine} />

                <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />

                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-ink-500)' }}>
                  {t('specimen.notes.title')}
                </p>
                <textarea
                  value={focused.notes ?? ''}
                  onChange={(e) => handleUpdateNotes(focused.id, e.target.value)}
                  placeholder={t('specimen.notes.placeholder')}
                  rows={3}
                  className="w-full rounded px-2.5 py-2 text-xs outline-none resize-y"
                  style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
                />

                <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />

                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-ink-500)' }}>
                  {t('journal.title')}
                </p>
                <SpecimenJournal
                  individual={focused}
                  onAddEntry={(entry) => handleAddJournalEntry(focused.id, entry)}
                  onDeleteEntry={(entryId) => handleDeleteJournalEntry(focused.id, entryId)}
                  onExport={() => handleExportJournal(focused)}
                />

                <div className="divider-vine my-4" style={{ background: 'var(--color-paper-300)' }} />

                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-ink-500)' }}>
                  {t('specimen.ancestry.title')}
                </p>
                <div className="max-h-[40vh] overflow-y-auto">
                  <PedigreeTree individual={focused} byId={byId} />
                </div>
              </div>
            ) : (
              <div className="specimen-card relative overflow-hidden p-6 text-center">
                <LeafMark
                  className="pointer-events-none absolute -bottom-8 -right-10 h-40 w-40 opacity-[0.08]"
                  style={{ color: 'var(--color-ink-900)' }}
                />
                <p className="relative font-display text-lg" style={{ color: 'var(--color-ink-900)' }}>
                  {t('specimen.sheetTitle')}
                </p>
                <div className="divider-vine my-3" style={{ background: 'var(--color-paper-300)' }} />
                <p className="relative text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
                  {individuals.length === 0
                    ? t('specimen.selectPrompt.emptyCatalog', { formTitle: t('founder.panel.title') })
                    : t('specimen.selectPrompt')}
                </p>
              </div>
            )}
          </div>
        </div>

        <section className="mt-14 pb-2">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--color-paper-100)' }}>
              {t('chemotypeShowcase.title')}
            </h2>
            <span className="divider-vine hidden flex-1 sm:block" />
          </div>
          <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
            {t('chemotypeShowcase.description')}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {CHEMOTYPE_ORDER.map((id) => {
              const info = CHEMOTYPES[id];
              return (
                <div
                  key={id}
                  className="rounded px-4 py-4"
                  style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}
                >
                  <p className="genotype-code text-2xl" style={{ color: 'var(--color-resin-400)' }}>
                    {id}
                  </p>
                  <p className="font-display text-base mt-1" style={{ color: 'var(--color-paper-100)' }}>
                    {info.label}
                  </p>
                  <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--color-paper-300)' }}>
                    {info.description}
                  </p>
                  <p className="genotype-code text-[11px] mt-2 opacity-70" style={{ color: 'var(--color-leaf-400)' }}>
                    {t('chemotypeShowcase.thcMean', { value: Math.round(info.thcMean * 100) })}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            className="mt-6 rounded px-5 py-4"
            style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}
          >
            <p className="font-display text-base" style={{ color: 'var(--color-paper-100)' }}>
              {t('chemotypeShowcase.cbnNote.title')}
            </p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
              {t('chemotypeShowcase.cbnNote.description')}
            </p>
          </div>
        </section>

        <CatalogDiversityPanel />
      </main>

      <footer className="mx-auto max-w-[1440px] px-5 pb-10 pt-6">
        <div className="divider-vine mb-4" />
        <p className="text-xs" style={{ color: 'var(--color-ink-500)' }}>
          {t('app.footer.disclaimer')}
        </p>
      </footer>
    </div>
  );
}

function SegregationChartWrapper({
  ids,
  byId,
  engine,
}: {
  ids: string[];
  byId: Map<string, Individual>;
  engine: BreedingEngine;
}) {
  const list = ids.map((id) => byId.get(id)).filter((x): x is Individual => Boolean(x));
  return <SegregationChart individuals={list} engine={engine} />;
}
