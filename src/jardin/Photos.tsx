/**
 * Images : photo de chaque espèce du catalogue (Wikimedia Commons, avec
 * crédit) et photos personnelles sur les variétés et les lots de graines.
 */
import { useEffect, useRef, useState } from 'react';
import { SPECIES } from './data/species';
import { cachedIds, cachedPhoto, clearPhotos, downloadAll, speciesPhoto, type ShownPhoto } from './engine/speciesPhoto';
import { useJT } from './i18n';
import type { Species } from './model';
import { useGarden } from './store';
import { Button, Card, INK500, INK700 } from './ui';

function Viewer({ url, onClose, label, children }: { url: string; onClose: () => void; label: string; children?: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-2 p-3" style={{ background: 'rgba(0,0,0,0.88)' }} onClick={onClose} role="dialog" aria-label={label}>
      <img src={url} alt="" className="max-h-[85vh] max-w-full rounded object-contain" />
      {children}
    </div>
  );
}

/** Photo de l'espèce en tête de sa fiche (téléchargée la première fois si internet). */
export function SpeciesHero({ species }: { species: Species }) {
  const { tt } = useJT();
  const [photo, setPhoto] = useState<ShownPhoto | null | undefined>(undefined);
  const [big, setBig] = useState(false);
  useEffect(() => {
    let alive = true;
    setPhoto(undefined);
    speciesPhoto(species).then((p) => alive && setPhoto(p));
    return () => {
      alive = false;
    };
  }, [species]);
  if (photo === null) return null;
  const credit = photo && (
    <p className="text-[10px] leading-snug" style={{ color: INK500 }}>
      📷 {photo.credit.author} ·{' '}
      <a href={photo.credit.page} target="_blank" rel="noreferrer" className="underline" onClick={(e) => e.stopPropagation()}>
        {photo.credit.license}
      </a>{' '}
      · Wikimedia Commons
    </p>
  );
  return (
    <figure className="space-y-1" data-testid="species-photo">
      {photo ? (
        <button type="button" onClick={() => setBig(true)} className="block w-full overflow-hidden rounded" aria-label={tt('photo.enlarge')}>
          <img src={photo.url} alt={species.name.fr} className="h-48 w-full object-cover sm:h-60" />
        </button>
      ) : (
        <div className="flex h-48 w-full items-center justify-center rounded text-xs sm:h-60" style={{ background: 'var(--color-paper-200)', color: INK500 }}>
          {tt('photo.loading')}
        </div>
      )}
      {credit}
      {big && photo && (
        <Viewer url={photo.url} onClose={() => setBig(false)} label={tt('photo.enlarge')}>
          <p className="max-w-md text-center text-[11px]" style={{ color: '#ddd' }}>
            📷 {photo.credit.author} · {photo.credit.license}
          </p>
        </Viewer>
      )}
    </figure>
  );
}

/** Petite image de la liste du catalogue : la photo si déjà sur l'appareil, sinon l'émoji. */
export function SpeciesIcon({ species, have }: { species: Species; have: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!have) return;
    let alive = true;
    cachedPhoto(species.id).then((p) => alive && setUrl(p?.url ?? null));
    return () => {
      alive = false;
    };
  }, [species.id, have]);
  if (url) return <img src={url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded object-cover" />;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl" aria-hidden="true">
      {species.emoji}
    </span>
  );
}

/** Identifiants des espèces dont la photo est sur l'appareil (mis à jour au téléchargement). */
const listeners = new Set<() => void>();
export function notifyPhotos() {
  for (const l of listeners) l();
}
export function useCachedSpecies(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    const load = () => cachedIds().then((s) => alive && setIds(s)).catch(() => {});
    load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, []);
  return ids;
}

/** Réglages : télécharger d'un coup toutes les photos des espèces. */
export function SpeciesPhotosCard() {
  const { tt } = useJT();
  const have = useCachedSpecies();
  const [run, setRun] = useState<{ done: number; found: number } | null>(null);
  const [finished, setFinished] = useState<{ found: number } | null>(null);
  const stop = useRef({ stop: false });
  useEffect(() => () => void (stop.current.stop = true), []);
  const start = async () => {
    stop.current = { stop: false };
    setFinished(null);
    setRun({ done: 0, found: have.size });
    let n = 0;
    const r = await downloadAll(SPECIES, (done, found) => {
      setRun({ done, found });
      if (++n % 10 === 0) notifyPhotos();
    }, stop.current);
    notifyPhotos();
    setRun(null);
    setFinished(r);
  };
  return (
    <Card title={`📷 ${tt('photo.cardTitle')}`}>
      <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
        {tt('photo.cardLead')}
      </p>
      <p className="mt-2 text-sm" data-testid="photo-count">
        {tt('photo.have', { n: run ? run.found : have.size, total: SPECIES.length })}
      </p>
      {run && (
        <div className="mt-2">
          <div className="h-2 w-full overflow-hidden rounded" style={{ background: 'var(--color-paper-300)' }}>
            <div className="h-full" style={{ width: `${(100 * run.done) / SPECIES.length}%`, background: '#4a7f36' }} />
          </div>
          <p className="mt-1 text-xs" style={{ color: INK500 }}>
            {tt('photo.progress', { done: run.done, total: SPECIES.length })}
          </p>
        </div>
      )}
      {finished && (
        <p className="mt-2 text-xs" style={{ color: INK700 }}>
          {finished.found < SPECIES.length ? tt('photo.doneSome', { n: finished.found, missing: SPECIES.length - finished.found }) : tt('photo.doneAll')}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {run ? (
          <Button kind="ghost" onClick={() => (stop.current.stop = true)}>
            {tt('photo.stop')}
          </Button>
        ) : (
          <Button kind="primary" onClick={start} disabled={have.size >= SPECIES.length}>
            ⬇ {tt('photo.downloadAll')}
          </Button>
        )}
        {!run && have.size > 0 && (
          <Button
            small
            kind="ghost"
            onClick={() => {
              if (window.confirm(tt('photo.clearConfirm'))) clearPhotos().then(notifyPhotos);
            }}
          >
            {tt('photo.clear')}
          </Button>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('photo.note')}
      </p>
    </Card>
  );
}

function OwnThumb({ id, onOpen, onRemove }: { id: string; onOpen: (url: string) => void; onRemove?: () => void }) {
  const { photoURL } = useGarden();
  const { tt } = useJT();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    photoURL(id, 'thumb').then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [id, photoURL]);
  return (
    <span className="relative inline-block h-16 w-16">
      {url ? (
        <button type="button" onClick={() => photoURL(id, 'full').then((u) => u && onOpen(u))} className="h-16 w-16 overflow-hidden rounded" aria-label={tt('photo.enlarge')}>
          <img src={url} alt="" className="h-full w-full object-cover" />
        </button>
      ) : (
        <span className="inline-block h-16 w-16 rounded" style={{ background: 'var(--color-paper-300)' }} />
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] leading-none text-white" style={{ background: '#9a3b1c' }} aria-label={tt('photo.remove')}>
          ×
        </button>
      )}
    </span>
  );
}

/**
 * Bande de photos personnelles : vignettes, ajout (appareil photo ou galerie)
 * et retrait. `onChange` reçoit la nouvelle liste d'identifiants ; les photos
 * retirées sont à supprimer par l'appelant (voir `removePhotos`).
 */
export function PhotoStrip({ ids, onChange, label }: { ids: string[]; onChange: (ids: string[], added: string[], removed: string[]) => void; label?: string }) {
  const store = useGarden();
  const { tt } = useJT();
  const input = useRef<HTMLInputElement>(null);
  const [full, setFull] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added = await store.addPhotos([...files]);
      onChange([...ids, ...added], added, []);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      {label && <p className="mb-1 text-xs font-semibold" style={{ color: INK500 }}>{label}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {ids.map((id) => (
          <OwnThumb key={id} id={id} onOpen={setFull} onRemove={() => window.confirm(tt('photo.removeConfirm')) && onChange(ids.filter((x) => x !== id), [], [id])} />
        ))}
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="flex h-16 w-16 flex-col items-center justify-center rounded text-[11px]" style={{ boxShadow: 'inset 0 0 0 1px var(--color-paper-300)', color: INK700 }}>
          <span className="text-lg">📷</span>
          {busy ? '…' : tt('photo.add')}
        </button>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files).finally(() => (e.target.value = ''))} />
      </div>
      {full && <Viewer url={full} onClose={() => setFull(null)} label={tt('photo.enlarge')} />}
    </div>
  );
}
