/**
 * Catalogue → « Flore » : toutes les plantes de France (BDTFX, Tela
 * Botanica) par nom français, scientifique ou ancien nom, et l'inventaire
 * des plantes du jardin (spontanées ou installées).
 */
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { SPECIES } from './data/species';
import { catalogLinks, loadFlore, norm, searchFlore, telaUrl, type Flore, type Taxon } from './engine/flore';
import { fmtDate } from './format';
import { useJT } from './i18n';
import { uid, type WildPlant } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Empty, INK500, INK700 } from './ui';

const inputStyle = { background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' };

function Badges({ t }: { t: Pick<Taxon, 'present' | 'native' | 'introduced' | 'cultivated'> }) {
  const { tt } = useJT();
  const b: Array<[string, string, string]> = [];
  if (t.native) b.push([tt('flore.native'), '#e6efdc', '#2f4a22']);
  if (t.introduced) b.push([tt('flore.introduced'), '#f3e6d2', '#6a4a1c']);
  if (t.cultivated) b.push([tt('flore.cultivated'), '#e3ecf3', '#24485e']);
  if (!t.present) b.push([tt('flore.absent'), 'var(--color-paper-200)', INK700]);
  return (
    <>
      {b.map(([l, bg, fg]) => (
        <span key={l} className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: bg, color: fg }}>
          {l}
        </span>
      ))}
    </>
  );
}

function Inventory({ flore }: { flore: Flore | null }) {
  const store = useGarden();
  const { tt, lang } = useJT();
  const list = [...(store.data.wildPlants ?? [])].sort((a, b) => (a.fr || a.sci).localeCompare(b.fr || b.sci));
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const fams = new Set(list.map((w) => w.family).filter(Boolean)).size;
  return (
    <Card title={`🌿 ${tt('flore.mine', { n: list.length })}`}>
      {list.length === 0 ? (
        <Empty>{tt('flore.mineNone')}</Empty>
      ) : (
        <>
          <p className="mb-2 text-xs" style={{ color: INK700 }}>
            {tt('flore.mineStats', { n: list.length, f: fams })}
          </p>
          <ul className="space-y-1.5">
            {list.map((w) => {
              const t = flore?.byNn.get(w.nn);
              return (
                <li key={w.id} className="rounded px-2.5 py-2" style={{ background: 'var(--color-paper-200)' }}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">{w.fr || w.sci}</span>
                    {w.fr && (
                      <i className="text-xs" style={{ color: INK700 }}>
                        {w.sci}
                      </i>
                    )}
                    {t && <Badges t={t} />}
                  </div>
                  <p className="text-[11px]" style={{ color: INK500 }}>
                    {w.family} · {tt('flore.since', { date: fmtDate(w.since, lang, true) })}
                    {w.note ? ` · ${w.note}` : ''}
                  </p>
                  {editing === w.id ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={tt('flore.notePh')} aria-label={tt('flore.note')} className="field min-w-0 flex-1 rounded px-2 py-1 text-sm outline-none" style={inputStyle} />
                      <Button
                        small
                        kind="primary"
                        onClick={() => {
                          store.saveWildPlant({ ...w, note: note.trim() || undefined });
                          setEditing(null);
                        }}
                      >
                        {tt('common.save')}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Button
                        small
                        kind="ghost"
                        onClick={() => {
                          setEditing(w.id);
                          setNote(w.note ?? '');
                        }}
                      >
                        ✎ {tt('flore.note')}
                      </Button>
                      <a href={telaUrl(w.nn)} target="_blank" rel="noreferrer" className="btn rounded px-2.5 py-1 text-xs font-medium" style={{ boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }}>
                        {tt('flore.tela')} ↗
                      </a>
                      <Button small kind="ghost" onClick={() => window.confirm(tt('flore.removeConfirm', { name: w.fr || w.sci })) && store.deleteWildPlant(w.id)}>
                        {tt('common.delete')}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}

export function FloreView() {
  const store = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const [flore, setFlore] = useState<Flore | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  useEffect(() => {
    let alive = true;
    loadFlore()
      .then((f) => alive && setFlore(f))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);
  const links = useMemo(() => (flore ? catalogLinks(flore, SPECIES) : new Map()), [flore]);
  const hits = useMemo(() => (flore ? searchFlore(flore, dq) : []), [flore, dq]);
  const mine = new Set((store.data.wildPlants ?? []).map((w) => w.nn));
  const add = (t: Taxon, name?: string) => {
    const w: WildPlant = { id: uid('wp'), nn: t.nn, sci: t.sci, fr: name || t.fr || undefined, family: t.family, since: store.today };
    store.saveWildPlant(w);
    nav.toast(tt('flore.added', { name: name || t.fr || t.sci }));
  };
  return (
    <>
      <Card title={`🔎 ${tt('flore.title')}`}>
        <p className="mb-2 text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('flore.lead', { n: flore ? flore.taxa.length.toLocaleString() : '23 000' })}
        </p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt('flore.search')} aria-label={tt('flore.search')} className="field w-full rounded px-2.5 py-2 text-sm outline-none" style={inputStyle} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        {!flore && !failed && (
          <p className="mt-2 text-xs" style={{ color: INK500 }}>
            {tt('flore.loading')}
          </p>
        )}
        {failed && (
          <p className="mt-2 text-xs" style={{ color: '#9a3b1c' }}>
            {tt('flore.failed')}
          </p>
        )}
        {flore && dq.trim().length >= 2 && (
          <div className="mt-3">
            {hits.length === 0 ? (
              <Empty>{tt('flore.none')}</Empty>
            ) : (
              <ul className="space-y-1.5">
                {hits.map(({ taxon: t, via, alias }) => {
                  const crop = links.get(t.nn);
                  const title = alias ?? (crop ? crop.name[lang] : t.fr);
                  return (
                    <li key={t.nn} className="rounded px-2.5 py-2" style={{ background: 'var(--color-paper-200)' }}>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm font-medium">{title || <i>{t.sci}</i>}</span>
                        {title && (
                          <i className="text-xs" style={{ color: INK700 }}>
                            {t.sci}
                          </i>
                        )}
                        <Badges t={t} />
                      </div>
                      <p className="text-[11px]" style={{ color: INK500 }}>
                        {t.family}
                        {title && t.fr && norm(title) !== norm(t.fr) ? ` · ${tt('flore.bdtfxName', { name: t.fr })}` : ''}
                        {via ? ` · ${tt('flore.via', { name: via })}` : ''}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Button small kind={mine.has(t.nn) ? 'ghost' : 'primary'} disabled={mine.has(t.nn)} onClick={() => add(t, title)}>
                          {mine.has(t.nn) ? `✓ ${tt('flore.inGarden')}` : `+ ${tt('flore.addGarden')}`}
                        </Button>
                        {crop && (
                          <Button small kind="ghost" onClick={() => nav.open({ type: 'species', id: crop.id })}>
                            {crop.emoji} {tt('flore.crop')}
                          </Button>
                        )}
                        <a href={telaUrl(t.nn)} target="_blank" rel="noreferrer" className="btn rounded px-2.5 py-1 text-xs font-medium" style={{ boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }}>
                          {tt('flore.tela')} ↗
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('flore.credit', { date: flore?.date ? fmtDate(flore.date, lang, true) : '' })}
        </p>
      </Card>
      <Inventory flore={flore} />
    </>
  );
}
