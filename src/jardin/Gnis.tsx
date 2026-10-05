/**
 * Variétés du Catalogue officiel (GNIS / SEMAE) dans l'interface :
 * badges (hybride F1, ancienne pour amateurs…), suggestions à la saisie,
 * information sur une variété, et liste complète sur la fiche d'une espèce.
 */
import { useEffect, useMemo, useState } from 'react';
import { findVariety, loadGnis, suggestVarieties, varietyKey, type Gnis, type GnisVariety } from './engine/gnis';
import { useJT, type JKey } from './i18n';
import { uid } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Chip, INK500, INK700 } from './ui';

let loaded: Gnis | null = null;
/** Base des variétés, chargée à la première utilisation. */
export function useGnis(): Gnis | null {
  const [g, setG] = useState<Gnis | null>(loaded);
  useEffect(() => {
    if (loaded) return;
    let alive = true;
    loadGnis()
      .then((x) => {
        loaded = x;
        if (alive) setG(x);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return g;
}

export function GnisBadges({ v }: { v: GnisVariety }) {
  const { tt } = useJT();
  const b: Array<[string, string, string, string]> = [];
  if (v.hybrid) b.push([tt('gnis.hybrid'), '#f6e3c8', '#7a4a10', tt('gnis.hybridHint')]);
  else b.push([tt('gnis.classic'), '#e6efdc', '#2f4a22', tt('gnis.classicHint')]);
  if (v.amateur) b.push([tt('gnis.amateur'), '#e6efdc', '#2f4a22', tt('gnis.amateurHint')]);
  if (v.conservation) b.push([tt('gnis.conservation'), '#e6efdc', '#2f4a22', tt('gnis.conservationHint')]);
  if (v.delisted) b.push([tt('gnis.delisted'), 'var(--color-paper-200)', INK700, tt('gnis.delistedHint')]);
  return (
    <>
      {b.map(([l, bg, fg, title]) => (
        <span key={l} title={title} className="whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: bg, color: fg, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)' }}>
          {l}
        </span>
      ))}
    </>
  );
}

/** Une ligne d'information sur la variété saisie (si elle est au catalogue officiel). */
export function GnisInfo({ speciesId, name, seeds = false }: { speciesId: string; name: string | undefined; seeds?: boolean }) {
  const g = useGnis();
  const { tt } = useJT();
  const v = g ? findVariety(g, speciesId, name) : undefined;
  if (!v) return null;
  return (
    <div className="col-span-2 text-xs leading-snug" style={{ color: INK700 }}>
      <span className="mr-1 inline-flex flex-wrap gap-1 align-middle">
        <GnisBadges v={v} />
      </span>
      {tt('gnis.registered', { year: v.year ?? '—' })}
      {v.breeder ? ` · ${v.breeder}` : ''}
      {v.sub ? ` · ${v.sub}` : ''}
      {v.hybrid && <span className="mt-0.5 block font-medium" style={{ color: '#7a4a10' }}>⚠ {tt(seeds ? 'gnis.hybridSeeds' : 'gnis.hybridWarn')}</span>}
    </div>
  );
}

/** Suggestions de variétés inscrites pendant la saisie d'un nom. */
export function GnisSuggest({ speciesId, value, onPick }: { speciesId: string; value: string; onPick: (name: string) => void }) {
  const g = useGnis();
  const { tt } = useJT();
  const list = g ? suggestVarieties(g, speciesId, value) : [];
  if (list.length === 0 || (list.length === 1 && list[0].key === varietyKey(value))) return null;
  return (
    <div className="col-span-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span style={{ color: INK500 }}>{tt('gnis.suggest')}</span>
      {list.map((v) => (
        <Chip key={v.raw} onClick={() => onPick(v.name)}>
          {v.name}
          {v.hybrid ? ' · F1' : v.amateur ? ' · ★' : ''}
        </Chip>
      ))}
    </div>
  );
}

type Filter = 'all' | 'amateur' | 'classic' | 'hybrid';

/** Fiche d'une espèce : toutes ses variétés inscrites, avec recherche et filtres. */
export function GnisSection({ speciesId }: { speciesId: string }) {
  const g = useGnis();
  const store = useGarden();
  const { tt } = useJT();
  const nav = useNav();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [max, setMax] = useState(25);
  const all = useMemo(() => g?.bySpecies.get(speciesId) ?? [], [g, speciesId]);
  const list = useMemo(() => {
    const k = varietyKey(q);
    return all
      .filter((v) => (filter === 'amateur' ? v.amateur || v.conservation : filter === 'classic' ? !v.hybrid : filter === 'hybrid' ? v.hybrid : true))
      .filter((v) => !k || k.split(' ').every((w) => v.key.split(' ').some((x) => x.startsWith(w))));
  }, [all, q, filter]);
  if (!g || all.length === 0) return null;
  const mine = new Set(store.data.varieties.filter((v) => v.speciesId === speciesId).map((v) => varietyKey(v.name)));
  const count = (f: Filter) => all.filter((v) => (f === 'amateur' ? v.amateur || v.conservation : f === 'classic' ? !v.hybrid : f === 'hybrid' ? v.hybrid : true)).length;
  return (
    <section>
      <h3 className="mb-1 font-display text-base">{tt('gnis.title', { n: all.length })}</h3>
      <p className="mb-2 text-xs leading-relaxed" style={{ color: INK700 }}>
        {tt('gnis.lead')}
      </p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt('gnis.search')} aria-label={tt('gnis.search')} className="field mb-2 w-full rounded px-2.5 py-1.5 text-sm outline-none" style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }} />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {(['all', 'amateur', 'classic', 'hybrid'] as Filter[]).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {tt(`gnis.filter.${f}` as JKey)} ({count(f)})
          </Chip>
        ))}
      </div>
      <ul className="space-y-1">
        {list.slice(0, max).map((v) => {
          const kept = mine.has(v.key);
          return (
            <li key={v.raw} className="rounded px-2.5 py-1.5" style={{ background: 'var(--color-paper-200)' }}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium">{v.name}</span>
                <GnisBadges v={v} />
              </div>
              <p className="text-[11px]" style={{ color: INK500 }}>
                {[v.sub, v.breeder, v.year ? tt('gnis.since', { year: v.year }) : ''].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Button small kind="ghost" onClick={() => nav.open({ type: 'addPlant', speciesId, varietyName: v.name })}>
                  + {tt('fvar.plant')}
                </Button>
                <Button
                  small
                  kind="ghost"
                  disabled={kept}
                  onClick={() => {
                    const note = [v.hybrid ? tt('gnis.hybrid') : tt('gnis.classic'), v.amateur ? tt('gnis.amateur') : '', v.breeder ?? '', v.year ? String(v.year) : ''].filter(Boolean).join(' · ');
                    store.saveVarieties([...store.data.varieties, { id: uid('var'), speciesId, name: v.name, origin: 'catalogue', note }]);
                    nav.toast(tt('fvar.kept', { name: v.name }));
                  }}
                >
                  {kept ? `✓ ${tt('fvar.inMine')}` : `☆ ${tt('fvar.keep')}`}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {list.length > max && (
        <div className="mt-2">
          <Button small kind="ghost" onClick={() => setMax(max + 50)}>
            {tt('gnis.more', { n: list.length - max })}
          </Button>
        </div>
      )}
      {list.length === 0 && (
        <p className="text-xs" style={{ color: INK500 }}>
          {tt('gnis.none')}
        </p>
      )}
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('gnis.credit')}
      </p>
    </section>
  );
}
