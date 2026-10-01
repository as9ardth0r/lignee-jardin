import { useEffect, useRef, useState } from 'react';
import { diffDays, todayISO } from './engine/dates';
import { fmtDate } from './format';
import { useJT } from './i18n';
import { useNav } from './nav';
import { isNative, notifyPermission, requestNotifyPermission, testNotification, type NotifyPermission } from './notifications';
import { useGarden } from './store';
import { Button, Card, Field, INK500, INK700, Notice, Select, TextInput } from './ui';
import { downloadTextFile, readFileAsText } from '../utils/download';

/** Plusieurs jardins sur l'appareil, et jardin partagé par échange de fichiers. */
export function GardensCard() {
  const store = useGarden();
  const { data } = store;
  const { tt } = useJT();
  const nav = useNav();
  const mergeRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const s = data.settings;

  const share = async () => {
    setBusy(true);
    try {
      const slug = s.gardenName.normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'jardin';
      downloadTextFile(`lignee-jardin-${slug}-${todayISO()}.json`, await store.exportBackup(), 'application/json');
    } finally {
      setBusy(false);
    }
  };
  const merge = async (f: File) => {
    try {
      const st = await store.mergeBackup(await readFileAsText(f));
      nav.toast(tt('share.merged', { added: st.added, updated: st.updated, removed: st.removed }));
      if (st.conflicts) window.alert(tt('share.conflicts', { n: st.conflicts }));
    } catch {
      window.alert(tt('settings.importError'));
    }
  };

  return (
    <Card title={`🏡 ${tt('gardens.title')}`}>
      <ul className="space-y-1.5">
        {store.gardens.map((g) => (
          <li key={g.id} className="flex items-center justify-between gap-2 rounded px-3 py-2 text-sm" style={{ background: 'var(--color-paper-200)' }}>
            <span className="min-w-0 truncate">
              {g.id === store.activeGarden ? '● ' : ''}
              <b>{g.name}</b>
            </span>
            <span className="flex shrink-0 gap-2">
              {g.id !== store.activeGarden && (
                <Button small kind="ghost" onClick={() => void store.switchGarden(g.id)}>
                  {tt('gardens.open')}
                </Button>
              )}
              {store.gardens.length > 1 && (
                <button type="button" className="text-[11px] underline" style={{ color: INK500 }} onClick={() => window.confirm(tt('gardens.deleteConfirm', { name: g.name })) && void store.deleteGarden(g.id)}>
                  {tt('common.delete')}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <Button small kind="primary" onClick={() => void store.createGarden()}>
          + {tt('gardens.new')}
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('gardens.hint')}
      </p>

      <h3 className="mb-1 mt-5 font-display text-base">🤝 {tt('share.title')}</h3>
      <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
        {tt('share.lead')}
      </p>
      <div className="mt-2 max-w-xs">
        <Field label={tt('share.author')} hint={tt('share.authorHint')}>
          {(fid) => <TextInput id={fid} value={s.author ?? ''} onChange={(v) => store.updateSettings({ author: v || undefined })} placeholder={tt('share.authorPlaceholder')} />}
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button kind="ghost" onClick={() => void share()} disabled={busy}>
          ⬇ {tt('share.export')}
        </Button>
        <Button kind="ghost" onClick={() => mergeRef.current?.click()}>
          ⇄ {tt('share.merge')}
        </Button>
        <input ref={mergeRef} type="file" accept="application/json,.json" className="hidden" aria-label={tt('share.merge')} onChange={(e) => e.target.files?.[0] && void merge(e.target.files[0]).finally(() => (e.target.value = ''))} />
      </div>
      <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('share.how')}
      </p>
    </Card>
  );
}

/** Réglages des notifications locales. */
export function NotificationsCard() {
  const store = useGarden();
  const s = store.data.settings;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [perm, setPerm] = useState<NotifyPermission | null>(null);
  useEffect(() => {
    let alive = true;
    void notifyPermission().then((p) => alive && setPerm(p));
    return () => {
      alive = false;
    };
  }, [s.notify]);

  const toggle = async (on: boolean) => {
    if (on) {
      const p = await requestNotifyPermission();
      setPerm(p);
      if (p !== 'granted') {
        nav.toast(tt(p === 'unsupported' ? 'notif.unsupported' : 'notif.denied'));
        return;
      }
    }
    store.updateSettings({ notify: on });
  };
  const since = s.lastBackup ? diffDays(s.lastBackup, store.today) : null;

  return (
    <Card title={`🔔 ${tt('notif.title')}`}>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={s.notify} onChange={(e) => void toggle(e.target.checked)} className="mt-1" disabled={perm === 'unsupported'} />
        <span>
          <b>{tt('notif.enable')}</b>
          <span className="block text-xs" style={{ color: INK700 }}>
            {tt('notif.hint')}
          </span>
        </span>
      </label>
      {s.notify && (
        <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
          <Field label={tt('notif.hour')}>
            {(fid) => <Select id={fid} value={String(s.notifyHour)} onChange={(v) => store.updateSettings({ notifyHour: Number(v) })} options={[5, 6, 7, 8, 9, 10, 12, 18, 20].map((h) => ({ v: String(h), l: `${h} h` }))} />}
          </Field>
          <Field label={tt('notif.max')}>
            {(fid) => <Select id={fid} value={String(s.notifyMax)} onChange={(v) => store.updateSettings({ notifyMax: Number(v) })} options={[1, 2, 3, 5].map((n) => ({ v: String(n), l: tt('notif.perDay', { n }) }))} />}
          </Field>
        </div>
      )}
      {perm === 'denied' && <div className="mt-2"><Notice tone="warn">{tt('notif.denied')}</Notice></div>}
      {!isNative() && <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>{tt('notif.webLimit')}</p>}
      {s.notify && (
        <div className="mt-3">
          <Button small kind="ghost" onClick={() => void testNotification(lang).then((ok) => !ok && nav.toast(tt('notif.denied')))}>
            {tt('notif.test')}
          </Button>
        </div>
      )}
      <p className="mt-3 text-xs" style={{ color: since === null || since >= 30 ? '#a5532f' : INK700 }}>
        💾 {since === null ? tt('notif.backupNeverShort') : tt('notif.lastBackup', { date: fmtDate(s.lastBackup!, lang, true), days: since })}
      </p>
    </Card>
  );
}
