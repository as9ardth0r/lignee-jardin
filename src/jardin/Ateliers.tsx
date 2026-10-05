import { Component, Suspense, lazy, useEffect, useMemo, useState, type CSSProperties, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { ATELIERS, ATELIER_BY_ID, BESPOKE_BY_SPECIES, generalAtelier, readAtelierVarieties, skipTutorials, type Atelier, type AtelierId, type OpenAtelierId } from '../ateliers/registry';
import { SPECIES, SPECIES_BY_ID } from './data/species';
import type { Species } from './model';
import { pendingVarieties } from '../ateliers/pending';
import { useJT, type JKey } from './i18n';
import type { Variety } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Chip, INK500, INK700, Notice } from './ui';

// --- Import des « Mes lignées » d'un atelier vers le catalogue du jardin -------

function inGardenCount(a: Atelier, existing: Variety[]): number {
  return a.myVarieties ? existing.filter((v) => v.origin === `lignee:${a.myVarieties!.crop}`).length : 0;
}

function useImport() {
  const store = useGarden();
  const nav = useNav();
  const { tt } = useJT();
  return (atelierList: Atelier[]) => {
    const add = atelierList.flatMap((a) => pendingVarieties(a, store.data.varieties));
    if (!add.length) {
      const any = atelierList.some((a) => readAtelierVarieties(a).length > 0);
      nav.toast(tt(any ? 'ateliers.upToDate' : 'ateliers.noneToImport'));
      return;
    }
    store.saveVarieties(add);
    nav.toast(tt('ateliers.imported', { n: add.length }));
  };
}

/** Relit régulièrement le stockage de l'atelier (les lignées s'enregistrent pendant qu'on y travaille). */
function useTick(ms: number) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => set((x) => x + 1), ms);
    const onFocus = () => set((x) => x + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [ms]);
}

// --- Atelier général -------------------------------------------------------------

/** Espèces proposées dans l'atelier général : tout le catalogue sauf les engrais verts. */
const GENERAL_SPECIES = SPECIES.filter((sp) => sp.type !== 'cover');
const genAtelier = (sp: Species) => generalAtelier(sp.id, sp.name, sp.latin, sp.emoji);
/** Ateliers généraux où des lignées ont été gardées. */
function generalWithLines(): Atelier[] {
  return GENERAL_SPECIES.filter((sp) => !BESPOKE_BY_SPECIES[sp.id]).map(genAtelier).filter((a) => readAtelierVarieties(a).length > 0);
}

type GFilter = 'all' | 'veg' | 'fruit' | 'flower' | 'herb' | 'mine';
const groupOf = (sp: Species): Exclude<GFilter, 'all' | 'mine'> => (sp.type === 'flower' ? 'flower' : sp.type === 'orchard' ? 'fruit' : sp.type === 'herb' ? 'herb' : 'veg');

function GeneralList({ onOpen }: { onOpen: (id: OpenAtelierId) => void }) {
  const { tt, lang } = useJT();
  const [q, setQ] = useState('');
  const [f, setF] = useState<GFilter>('all');
  const [all, setAll] = useState(false);
  const withLines = new Set(generalWithLines().map((a) => a.id));
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return GENERAL_SPECIES.filter((sp) => (f === 'all' ? true : f === 'mine' ? withLines.has(`gen:${sp.id}` as AtelierId) : groupOf(sp) === f))
      .filter((sp) => !ql || sp.name[lang].toLowerCase().includes(ql) || sp.latin.toLowerCase().includes(ql))
      .sort((a, b) => a.name[lang].localeCompare(b.name[lang]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, f, lang, withLines.size]);
  const shown = all || q ? list : list.slice(0, 60);
  return (
    <Card title={`🌍 ${tt('ateliers.general')} (${GENERAL_SPECIES.length})`}>
      <p className="mb-2 text-sm leading-relaxed" style={{ color: INK700 }}>
        {tt('ateliers.generalLead')}
      </p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt('ateliers.search')} aria-label={tt('ateliers.search')} className="field w-full rounded px-2.5 py-2 text-sm outline-none" style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }} />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(['all', 'veg', 'fruit', 'flower', 'herb', 'mine'] as GFilter[]).map((x) => (
          <Chip key={x} active={f === x} onClick={() => setF(x)}>
            {tt(`ateliers.f.${x}` as JKey)}
          </Chip>
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {shown.map((sp) => {
          const bespoke = BESPOKE_BY_SPECIES[sp.id];
          const lines = withLines.has(`gen:${sp.id}` as AtelierId);
          return (
            <li key={sp.id}>
              <button type="button" onClick={() => onOpen(bespoke ?? (`gen:${sp.id}` as OpenAtelierId))} className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                <span className="text-xl" aria-hidden="true">
                  {sp.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {sp.name[lang]}
                  {bespoke ? ' ★' : ''}
                </span>
                {lines && <span title={tt('ateliers.f.mine')}>☆</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {!all && !q && list.length > shown.length && (
        <div className="mt-2">
          <Button small kind="ghost" onClick={() => setAll(true)}>
            {tt('ateliers.more', { n: list.length - shown.length })}
          </Button>
        </div>
      )}
    </Card>
  );
}

// --- Liste des ateliers ----------------------------------------------------------

export function AteliersView({ onOpen }: { onOpen: (id: OpenAtelierId) => void }) {
  const { tt, lang } = useJT();
  const store = useGarden();
  const importFrom = useImport();
  useTick(4000);
  const varieties = store.data.varieties;
  const generalLines = generalWithLines();
  const totalPending = [...ATELIERS, ...generalLines].reduce((n, a) => n + pendingVarieties(a, varieties).length, 0);
  return (
    <div className="space-y-3">
      <Card title={`🧬 ${tt('ateliers.title')}`}>
        <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('ateliers.lead')}
        </p>
        {totalPending > 0 && (
          <div className="mt-3">
            <Button kind="primary" small onClick={() => importFrom([...ATELIERS, ...generalLines])}>
              🌱 {tt('ateliers.importAll')} ({totalPending})
            </Button>
          </div>
        )}
      </Card>
      <h2 className="px-1 font-display text-lg" style={{ color: 'var(--color-paper-100)' }}>
        {tt('ateliers.detailed')} ({ATELIERS.length})
      </h2>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {ATELIERS.map((a) => {
          const mine = readAtelierVarieties(a).length;
          const inGarden = inGardenCount(a, varieties);
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onOpen(a.id)}
                className="specimen-card flex h-full w-full flex-col items-start gap-1 p-3 text-left transition-transform hover:-translate-y-0.5"
                style={{ borderTop: `4px solid ${a.accent[1]}` }}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {a.emoji}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: a.accent[1], color: 'var(--color-paper-100)' }}>
                    {tt('ateliers.open')} →
                  </span>
                </span>
                <span className="font-display text-base leading-tight">{a.name[lang]}</span>
                <span className="text-[11px] italic" style={{ color: INK500 }}>
                  {a.latin}
                </span>
                <span className="mt-auto pt-1 text-[10px] leading-snug" style={{ color: INK500 }}>
                  {a.myVarieties ? (
                    <>
                      {tt('ateliers.mine', { n: mine })}
                      {inGarden > 0 && ` · ${tt('ateliers.inGarden', { n: inGarden })}`}
                    </>
                  ) : (
                    tt('ateliers.noGardenSpecies')
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <GeneralList onOpen={onOpen} />
      <Notice>{tt('ateliers.note')}</Notice>
    </div>
  );
}

// --- Atelier ouvert ------------------------------------------------------------------

const loaded = new Map<AtelierId, LazyExoticComponent<ComponentType>>();
function lazyAtelier(a: Atelier) {
  let c = loaded.get(a.id);
  if (!c) {
    c = lazy(a.load);
    loaded.set(a.id, c);
  }
  return c;
}

class Boundary extends Component<{ fallback: (retry: () => void) => ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback(() => this.setState({ failed: false })) : this.props.children;
  }
}

const GeneralAtelier = lazy(() => import('../ateliers/general/GeneralAtelier'));

export function AtelierHost({ id, onExit }: { id: OpenAtelierId; onExit: () => void }) {
  const { tt, lang } = useJT();
  const store = useGarden();
  const importFrom = useImport();
  const [attempt, setAttempt] = useState(0);
  useTick(2500);
  // Plus de tutoriel au premier lancement d'un atelier (il reste derrière le bouton d'aide).
  skipTutorials();
  const genId = id.startsWith('gen:') ? id.slice(4) : null;
  const genSp = genId ? SPECIES_BY_ID[genId] : undefined;
  const a = genSp ? genAtelier(genSp) : ATELIER_BY_ID[id as AtelierId];
  const Comp = genSp ? null : lazyAtelier(a);
  const pending = pendingVarieties(a, store.data.varieties).length;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  // Chaque atelier reprend la couleur d'accent de son app d'origine.
  const accent = { '--color-tomato-400': a.accent[0], '--color-tomato-500': a.accent[1], '--color-tomato-600': a.accent[2] } as CSSProperties;

  return (
    <div style={accent} className="min-h-screen">
      <div className="sticky top-0 z-[60] border-b" style={{ background: 'var(--color-canopy-950)', borderColor: 'var(--color-canopy-700)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={onExit}
            title={tt('ateliers.backTitle')}
            className="btn flex h-9 items-center gap-1.5 rounded-full px-3 text-sm"
            style={{ background: 'var(--color-canopy-800)', color: 'var(--color-paper-100)', boxShadow: 'inset 0 0 0 1px var(--color-canopy-600)' }}
          >
            ← 🌱 {tt('ateliers.back')}
          </button>
          <p className="min-w-0 flex-1 truncate font-display text-base" style={{ color: 'var(--color-paper-100)' }}>
            <span aria-hidden="true">{a.emoji}</span> {a.name[lang]}
          </p>
          {a.myVarieties && (
            <button
              type="button"
              onClick={() => importFrom([a])}
              title={tt('ateliers.importTitle')}
              className="btn flex h-9 shrink-0 items-center rounded-full px-3 text-xs font-medium"
              style={{ background: pending ? a.accent[1] : 'var(--color-canopy-800)', color: 'var(--color-paper-100)', boxShadow: pending ? undefined : 'inset 0 0 0 1px var(--color-canopy-600)' }}
            >
              🌱 {tt('ateliers.import', { n: pending })}
            </button>
          )}
        </div>
      </div>
      <Boundary
        key={attempt}
        fallback={(retry) => (
          <div className="mx-auto max-w-md p-6 text-center" style={{ color: 'var(--color-paper-200)' }}>
            <p className="text-sm">{tt('ateliers.loadError')}</p>
            <div className="mt-3">
              <Button
                kind="primary"
                onClick={() => {
                  loaded.delete(a.id);
                  setAttempt((x) => x + 1);
                  retry();
                }}
              >
                ↻
              </Button>
            </div>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center text-sm" style={{ color: 'var(--color-paper-300)' }}>
              <span className="animate-pulse">
                {a.emoji} {tt('ateliers.loading')}
              </span>
            </div>
          }
        >
          {genSp ? <GeneralAtelier key={genSp.id} speciesId={genSp.id} /> : Comp && <Comp />}
        </Suspense>
      </Boundary>
    </div>
  );
}
