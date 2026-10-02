import { useEffect, useMemo, useRef, useState } from 'react';
import { PHENO_KEY, QUANT_TRAITS, AmEngine, type QuantTraitId, type AmIndividual, type AmJournalEntry } from '../engine/muflier/engine';
import { gardenOutcome, loadGarden, saveGarden, type GardenSettings } from '../engine/muflier/garden';
import { SPECIES, AM_LOCI } from '../engine/muflier/loci';
import { AM_VARIETIES, VARIETY_BY_ID, type AmVariety } from '../engine/muflier/varieties';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { downloadTextFile, readFileAsText } from '../utils/download';
import { CrossPanel, FixationChart, FounderPanel, MendelPanel, SpecimenSheet, AmCard } from './components';
import { ComparePanel, GardenPanel, ProgramPanel, TraitDistribution, journalAsText } from './extras';
import { loadMyVarieties, parseMyVarieties, saveMyVarieties, serializeMyVarieties, varietyFromIndividual } from './myVarieties';
import type { ProgramResult } from '../engine/muflier/program';
import { FlowerDot } from './SnapdragonPortrait';
import { Tutorial, tutorialSeen } from './Tutorial';
import { useDcT, type AmKey } from './i18n';
import { loadAmCatalog, parseAmCatalog, saveAmCatalog, serializeAmCatalog } from './persistence';

type SortKey = 'recent' | 'garden' | 'stems' | QuantTraitId;

export default function SnapdragonApp() {
  const { tt, language } = useDcT();
  const engineRef = useRef<AmEngine | null>(null);
  if (!engineRef.current) engineRef.current = new AmEngine();
  const engine = engineRef.current;

  const [individuals, setIndividuals] = useState<AmIndividual[]>(() => {
    const list = loadAmCatalog().map((i) => engine.normalize(i));
    engine.ensureIdsAbove(list.map((i) => i.id));
    return list;
  });
  // Variétés perso (lignées fixées enregistrées par l'utilisateur)
  const [myVarieties, setMyVarieties] = useState<AmVariety[]>(() => loadMyVarieties());
  useEffect(() => saveMyVarieties(myVarieties), [myVarieties]);
  const myVarImportRef = useRef<HTMLInputElement>(null);
  const allVarieties = useMemo(() => [...myVarieties, ...AM_VARIETIES], [myVarieties]);
  const [selected, setSelected] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<{ ids: string[]; parents: [string, string] } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [garden, setGarden] = useState<GardenSettings>(() => loadGarden());
  useEffect(() => saveGarden(garden), [garden]);
  const [showArchived, setShowArchived] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Guide de démarrage : ouvert d'office au premier lancement
  const [showTutorial, setShowTutorial] = useState(() => !tutorialSeen());

  function plantExample() {
    const a0 = engine.createFromVariety(VARIETY_BY_ID['lab-wild']);
    const b0 = engine.createFromVariety(VARIETY_BY_ID['lab-rosea']);
    setIndividuals((prev) => [...prev, a0, b0]);
    setLastBatch(null);
    setSelected([a0.id, b0.id]);
    setFocusedId(null);
    setMessage(tt('tuto.example.done'));
  }
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveAmCatalog(individuals), [individuals]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const byId = useMemo(() => new Map(individuals.map((i) => [i.id, i])), [individuals]);
  const a = selected[0] ? byId.get(selected[0]) ?? null : null;
  const b = selected[1] ? byId.get(selected[1]) ?? null : null;
  const focused = focusedId ? byId.get(focusedId) ?? null : null;
  const archivedCount = individuals.filter((i) => i.archived).length;
  const freshIds = useMemo(() => new Set(lastBatch?.ids ?? []), [lastBatch]);

  const sortFn = (x: AmIndividual, y: AmIndividual) => {
    switch (sortKey) {
      case 'recent':
        return y.createdAt - x.createdAt || y.id.localeCompare(x.id);
      case 'days':
        return x.pheno.days - y.pheno.days;
      case 'stems':
        return engine.stems(y) - engine.stems(x);
      case 'garden':
        return gardenOutcome(engine, y, garden).realized - gardenOutcome(engine, x, garden).realized;
      default:
        return y.pheno[PHENO_KEY[sortKey]] - x.pheno[PHENO_KEY[sortKey]];
    }
  };

  const generations = useMemo(() => {
    const visible = showArchived ? individuals : individuals.filter((i) => !i.archived);
    const m = new Map<number, AmIndividual[]>();
    for (const ind of visible) {
      if (!m.has(ind.generation)) m.set(ind.generation, []);
      m.get(ind.generation)!.push(ind);
    }
    return Array.from(m.entries())
      .sort((x, y) => y[0] - x[0])
      .map(([g, list]) => [g, [...list].sort(sortFn)] as const);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [individuals, showArchived, sortKey]);

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 2 ? [prev[1], id] : [...prev, id]));
  }

  function addBatch(list: AmIndividual[], parents: [string, string] | null) {
    setIndividuals((prev) => [...prev, ...list]);
    setLastBatch(parents ? { ids: list.map((x) => x.id), parents } : null);
    if (list.length === 1 || !parents) setFocusedId(list[list.length - 1].id);
  }

  /** Pollinisation : entre espèces, moins de graines viables que demandé
   * (voire aucune) — on l’explique au lieu d’échouer en silence. */
  function pollinate(mother: AmIndividual, father: AmIndividual, n: number) {
    const check = engine.crossCheck(mother, father);
    const kids = engine.cross(mother, father, n);
    if (kids.length === 0) {
      setMessage(tt('cross.noSeed', { reason: tt(`compat.${check.reason}` as AmKey) }));
      return;
    }
    if (kids.length < n) setMessage(tt('cross.fewSeeds', { n: kids.length, total: n }));
    addBatch(kids, [mother.id, father.id]);
    setSelected([]);
  }
  function handleCross(n: number) {
    if (a && b) pollinate(a, b, n);
  }
  function handleSelf(n: number) {
    if (a) pollinate(a, a, n);
  }

  function keepBest(n: number) {
    if (!lastBatch) return;
    const batch = lastBatch.ids.map((id) => byId.get(id)).filter((x): x is AmIndividual => Boolean(x));
    const keep = new Set([...batch].sort(sortFn).slice(0, n).map((x) => x.id));
    setIndividuals((prev) => prev.map((x) => (lastBatch.ids.includes(x.id) ? { ...x, archived: !keep.has(x.id) } : x)));
  }

  function update(id: string, patch: Partial<AmIndividual>) {
    setIndividuals((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function remove(id: string) {
    setIndividuals((prev) => prev.filter((x) => x.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
    setFocusedId(null);
  }

  function handleClone(ind: AmIndividual) {
    const c = engine.cloneOf(ind, tt('sheet.clonedFrom', { name: ind.label }));
    setIndividuals((prev) => [...prev, c]);
    setFocusedId(c.id);
  }

  function handleSaveVariety(ind: AmIndividual) {
    const name = window.prompt(tt('sheet.saveVarietyPrompt'), ind.label);
    if (!name || !name.trim()) return;
    const v = varietyFromIndividual(engine, ind, name.trim());
    if (!v) {
      setMessage(tt('sheet.saveVarietyNotFixed'));
      return;
    }
    setMyVarieties((prev) => [v, ...prev]);
    setMessage(tt('sheet.savedVariety', { name: v.name }));
  }

  function addJournal(id: string, entry: Omit<AmJournalEntry, 'id'>) {
    const withId = { ...entry, id: `tj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` };
    setIndividuals((prev) => prev.map((x) => (x.id === id ? { ...x, journal: [...(x.journal ?? []), withId] } : x)));
  }
  function deleteJournal(id: string, entryId: string) {
    setIndividuals((prev) => prev.map((x) => (x.id === id ? { ...x, journal: (x.journal ?? []).filter((e) => e.id !== entryId) } : x)));
  }

  function handleProgramDone(res: ProgramResult) {
    setIndividuals((prev) => [...prev, ...res.lineage.filter((x) => !prev.some((p) => p.id === x.id))]);
    setFocusedId(res.final.id);
    setLastBatch(null);
  }

  async function handleImportMyVarieties(file: File) {
    try {
      const list = parseMyVarieties(await readFileAsText(file));
      const known = new Set(myVarieties.map((v) => v.id));
      const fresh = list.filter((v) => !known.has(v.id));
      setMyVarieties((prev) => [...fresh, ...prev]);
      setMessage(tt('myvar.imported', { n: fresh.length }));
    } catch {
      setMessage(tt('catalog.importError'));
    }
  }

  async function handleImport(file: File) {
    try {
      const list = parseAmCatalog(await readFileAsText(file));
      const known = new Set(individuals.map((i) => i.id));
      const fresh = list.filter((x) => !known.has(x.id)).map((x) => engine.normalize(x));
      engine.ensureIdsAbove(list.map((i) => i.id));
      setIndividuals((prev) => [...prev, ...fresh]);
      setMessage(tt('catalog.imported', { n: fresh.length }));
    } catch {
      setMessage(tt('catalog.importError'));
    }
  }

  const batchInd = lastBatch ? lastBatch.ids.map((id) => byId.get(id)).filter((x): x is AmIndividual => Boolean(x)) : [];
  const batchParents: [AmIndividual, AmIndividual] | null =
    lastBatch && byId.get(lastBatch.parents[0]) && byId.get(lastBatch.parents[1])
      ? [byId.get(lastBatch.parents[0])!, byId.get(lastBatch.parents[1])!]
      : null;
  const fmt = (n: number) => n.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US');

  const showcase = ['rocket-red', 'rocket-yellow', 'rocket-rose', 'rocket-bronze', 'royal-bride', 'liberty-cherry', 'night-and-day', 'brighton-rock', 'darwin-peloric', 'lab-venosa', 'pseudomajus', 'striatum', 'linaria-peloria'];

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden border-b" style={{ borderColor: 'var(--color-canopy-800)' }}>
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-[0.16] blur-3xl"
          style={{ background: 'var(--color-tomato-500)' }}
        />
        <div className="relative mx-auto max-w-[1440px] px-5 py-8 sm:py-12">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: 'var(--color-canopy-800)', color: 'var(--color-resin-400)', border: '1px solid var(--color-canopy-600)' }}
              title={tt('disclaimer.body')}
            >
              {tt('disclaimer.badge')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                title={tt('help.openTitle')}
                className="flex h-8 items-center gap-1 rounded-full px-3 text-xs"
                style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-canopy-600)' }}
              >
                <span aria-hidden="true">?</span> {tt('help.open')}
              </button>
              <LanguageSwitcher />
            </div>
          </div>
          <p className="text-xs tracking-wide mt-6" style={{ color: 'var(--color-tomato-400)' }}>
            {tt('app.eyebrow')}
          </p>
          <div className="mt-2 grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end xl:gap-12">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl" style={{ color: 'var(--color-paper-100)' }}>
                Lignée <span className="italic" style={{ color: 'var(--color-tomato-400)' }}>· {tt('app.title')}</span>
              </h1>
              <p className="font-display italic text-lg sm:text-xl mt-3 max-w-xl" style={{ color: 'var(--color-paper-200)' }}>
                {tt('app.subtitle')}
              </p>
              <p className="text-sm mt-4 max-w-xl leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
                {tt('app.description')}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {showcase.map((id) => {
                  const v = VARIETY_BY_ID[id];
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                      style={{ background: 'var(--color-canopy-900)', color: 'var(--color-paper-200)', border: '1px solid var(--color-canopy-700)' }}
                    >
                      <FlowerDot appearance={engine.appearanceFromVariety(v)} size={11} />
                      {v.name}
                    </span>
                  );
                })}
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-x-6 gap-y-4 xl:min-w-[380px] xl:max-w-[460px]">
              {[
                { value: allVarieties.length, label: tt('app.stats.varieties', { n: allVarieties.filter((v) => v.hybrid).length }) },
                { value: AM_LOCI.length, label: tt('app.stats.loci') },
                { value: SPECIES.length, label: tt('app.stats.species') },
              ].map((s, i) => (
                <div key={i} className="border-l pl-3" style={{ borderColor: 'var(--color-canopy-700)' }}>
                  <p className="genotype-code font-display text-3xl sm:text-4xl" style={{ color: 'var(--color-tomato-400)' }}>
                    {fmt(s.value)}
                  </p>
                  <p className="text-[11px] leading-snug mt-1" style={{ color: 'var(--color-paper-300)' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1440px] px-5 py-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(260px,330px)_minmax(0,1fr)_minmax(300px,390px)]">
          <div className="min-w-0 lg:sticky lg:top-4">
            <FounderPanel engine={engine} varieties={allVarieties} onPlant={(list) => addBatch(list, null)} />
            <div className="mt-4 rounded px-4 py-3" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
              <div className="flex items-center gap-2">
                <p className="font-display text-base mr-auto" style={{ color: 'var(--color-paper-100)' }}>
                  ✎ {tt('myvar.title')} <span className="font-data text-xs opacity-60">{myVarieties.length}</span>
                </p>
                <button
                  type="button"
                  disabled={myVarieties.length === 0}
                  onClick={() => downloadTextFile('lignee-mes-varietes-muflier.json', serializeMyVarieties(myVarieties), 'application/json')}
                  className="rounded px-2 py-1 text-[11px] disabled:opacity-40"
                  style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
                >
                  {tt('myvar.export')}
                </button>
                <button
                  type="button"
                  onClick={() => myVarImportRef.current?.click()}
                  className="rounded px-2 py-1 text-[11px]"
                  style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
                >
                  {tt('myvar.import')}
                </button>
                <input
                  ref={myVarImportRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportMyVarieties(f);
                    e.target.value = '';
                  }}
                />
              </div>
              {myVarieties.length === 0 ? (
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
                  {tt('myvar.none')}
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {myVarieties.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-paper-200)' }}>
                      <FlowerDot appearance={engine.appearanceFromVariety(v)} size={10} />
                      <span className="flex-1 truncate">{v.name}</span>
                      <button
                        type="button"
                        onClick={() => setMyVarieties((prev) => prev.filter((x) => x.id !== v.id))}
                        title={tt('myvar.delete')}
                        className="text-[11px] opacity-60 hover:opacity-100"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-6 min-w-0">
            <GardenPanel garden={garden} onChange={setGarden} />
            <CrossPanel engine={engine} a={a} b={b} onCross={handleCross} onSelf={handleSelf} />
            {a && b && <ComparePanel engine={engine} a={a} b={b} garden={garden} />}
            <ProgramPanel engine={engine} garden={garden} a={a} b={b} onDone={handleProgramDone} onSaveVariety={handleSaveVariety} />
            {(batchInd.length > 0 || individuals.length > 1) && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 [&>*:last-child:nth-child(odd)]:col-span-full">
                <MendelPanel engine={engine} batch={batchInd} parents={batchParents} />
                <TraitDistribution engine={engine} batch={batchInd} parents={batchParents} />
                <FixationChart engine={engine} individuals={individuals} />
              </div>
            )}

            <section>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl mr-auto" style={{ color: 'var(--color-paper-100)' }}>
                  {tt('catalog.title')}{' '}
                  <span className="font-data text-sm opacity-60">{individuals.length - archivedCount}</span>
                </h2>
                <label className="text-xs" style={{ color: 'var(--color-paper-300)' }}>
                  {tt('catalog.sortBy')}{' '}
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="ml-1 rounded px-2 py-1 text-xs outline-none"
                    style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)' }}
                  >
                    {(['recent', 'garden', 'stems', ...QUANT_TRAITS] as SortKey[]).map((k) => (
                      <option key={k} value={k}>
                        {k === 'recent' || k === 'garden' || k === 'stems' ? tt(`sort.${k}` as AmKey) : tt(`trait.${k}` as AmKey)}
                      </option>
                    ))}
                  </select>
                </label>
                {lastBatch && lastBatch.ids.length > 6 && sortKey !== 'recent' && (
                  <button
                    type="button"
                    onClick={() => keepBest(3)}
                    className="rounded px-2.5 py-1 text-xs"
                    style={{ background: 'var(--color-resin-500)', color: 'var(--color-ink-900)' }}
                  >
                    {tt('catalog.keepBest', { n: 3 })}
                  </button>
                )}
                {archivedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowArchived((s) => !s)}
                    className="rounded px-2.5 py-1 text-xs"
                    style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
                  >
                    {showArchived ? tt('catalog.hideArchived') : tt('catalog.showArchived', { n: archivedCount })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadTextFile(`lignee-muflier-${new Date().toISOString().slice(0, 10)}.json`, serializeAmCatalog(individuals), 'application/json')}
                  disabled={individuals.length === 0}
                  className="rounded px-2.5 py-1 text-xs disabled:opacity-40"
                  style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
                >
                  {tt('catalog.export')}
                </button>
                <button
                  type="button"
                  onClick={() => importRef.current?.click()}
                  className="rounded px-2.5 py-1 text-xs"
                  style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-200)' }}
                >
                  {tt('catalog.import')}
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImport(f);
                    e.target.value = '';
                  }}
                />
                {individuals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(tt('catalog.clearConfirm'))) {
                        setIndividuals([]);
                        setSelected([]);
                        setFocusedId(null);
                        setLastBatch(null);
                      }
                    }}
                    className="rounded px-2.5 py-1 text-xs"
                    style={{ background: 'var(--color-bloom-600)', color: 'var(--color-paper-100)' }}
                  >
                    {tt('catalog.clear')}
                  </button>
                )}
              </div>
              {message && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-leaf-400)' }}>
                  {message}
                </p>
              )}

              {generations.length === 0 ? (
                <p className="mt-6 rounded px-4 py-8 text-center text-sm" style={{ border: '1px dashed var(--color-canopy-600)', color: 'var(--color-paper-300)' }}>
                  {tt('catalog.empty')}
                </p>
              ) : (
                generations.map(([g, list]) => (
                  <div key={g} className="mt-5">
                    <div className="flex items-center gap-3 mb-3">
                      <p className="font-data text-xs uppercase tracking-wider" style={{ color: 'var(--color-tomato-400)' }}>
                        {g === 0 ? tt('catalog.founders') : tt('catalog.generation', { n: g })}
                      </p>
                      <span className="font-data text-[11px] opacity-50">{list.length}</span>
                      <span className="divider-vine flex-1" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                      {list.map((ind) => (
                        <AmCard
                          key={ind.id}
                          engine={engine}
                          ind={ind}
                          garden={garden}
                          focused={ind.id === focusedId}
                          fresh={freshIds.has(ind.id)}
                          selectedSlot={selected[0] === ind.id ? 'A' : selected[1] === ind.id ? 'B' : null}
                          onFocus={() => setFocusedId(ind.id)}
                          onToggleSelect={() => toggleSelect(ind.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          <div className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            {focused ? (
              <SpecimenSheet
                engine={engine}
                ind={focused}
                garden={garden}
                varieties={allVarieties}
                byId={byId}
                onNotes={(text) => update(focused.id, { notes: text })}
                onArchive={() => update(focused.id, { archived: !focused.archived })}
                onDelete={() => remove(focused.id)}
                onFocus={setFocusedId}
                onRename={(label) => update(focused.id, { label })}
                onClone={() => handleClone(focused)}
                onSaveVariety={() => handleSaveVariety(focused)}
                onJournalAdd={(e) => addJournal(focused.id, e)}
                onJournalDelete={(entryId) => deleteJournal(focused.id, entryId)}
                onJournalExport={() =>
                  downloadTextFile(`journal-${focused.id}.txt`, journalAsText(engine, focused, tt, language === 'fr' ? 'fr-FR' : 'en-US'), 'text/plain')
                }
              />
            ) : (
              <div className="specimen-card p-6 text-center">
                <p className="font-display text-lg">{tt('sheet.title')}</p>
                <div className="divider-vine my-3" style={{ background: 'var(--color-paper-300)' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-700)' }}>
                  {tt('sheet.empty')}
                </p>
              </div>
            )}
          </div>
        </div>

        <section className="mt-14">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--color-paper-100)' }}>
              {tt('lesson.title')}
            </h2>
            <span className="divider-vine hidden flex-1 sm:block" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded px-4 py-4" style={{ background: 'var(--color-canopy-900)', border: '1px solid var(--color-canopy-700)' }}>
                <p className="genotype-code text-2xl" style={{ color: 'var(--color-tomato-400)' }}>
                  {i}
                </p>
                <p className="font-display text-base mt-1" style={{ color: 'var(--color-paper-100)' }}>
                  {tt(`lesson.${i}.title` as AmKey)}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
                  {tt(`lesson.${i}.body` as AmKey)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1440px] px-5 pb-10 pt-6">
        <div className="divider-vine mb-4" />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-paper-300)' }}>
          <strong>{tt('disclaimer.title')}</strong> {tt('disclaimer.body')}
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-ink-500)' }}>
          {tt('app.footer')}
        </p>
      </footer>
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} onExample={plantExample} />}
    </div>
  );
}
