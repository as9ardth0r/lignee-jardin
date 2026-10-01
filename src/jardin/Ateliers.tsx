import { Component, Suspense, lazy, useEffect, useState, type CSSProperties, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { ATELIERS, ATELIER_BY_ID, readAtelierVarieties, type Atelier, type AtelierId } from '../ateliers/registry';
import { pendingVarieties } from '../ateliers/pending';
import { useJT } from './i18n';
import type { Variety } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, INK500, INK700, Notice } from './ui';

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

// --- Liste des ateliers ----------------------------------------------------------

export function AteliersView({ onOpen }: { onOpen: (id: AtelierId) => void }) {
  const { tt, lang } = useJT();
  const store = useGarden();
  const importFrom = useImport();
  useTick(4000);
  const varieties = store.data.varieties;
  const totalPending = ATELIERS.reduce((n, a) => n + pendingVarieties(a, varieties).length, 0);
  return (
    <div className="space-y-3">
      <Card title={`🧬 ${tt('ateliers.title')}`}>
        <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('ateliers.lead')}
        </p>
        {totalPending > 0 && (
          <div className="mt-3">
            <Button kind="primary" small onClick={() => importFrom(ATELIERS)}>
              🌱 {tt('ateliers.importAll')} ({totalPending})
            </Button>
          </div>
        )}
      </Card>
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

export function AtelierHost({ id, onExit }: { id: AtelierId; onExit: () => void }) {
  const { tt, lang } = useJT();
  const store = useGarden();
  const importFrom = useImport();
  const [attempt, setAttempt] = useState(0);
  useTick(2500);
  const a = ATELIER_BY_ID[id];
  const Comp = lazyAtelier(a);
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
          <Comp />
        </Suspense>
      </Boundary>
    </div>
  );
}
