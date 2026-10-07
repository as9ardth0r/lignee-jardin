/**
 * Réglages → « Synchronisation avec le PC » : sur le PC, adresse et code à
 * saisir sur le téléphone ; sur le téléphone, saisie de l'adresse et du code,
 * état de la synchronisation.
 */
import { useState } from 'react';
import { useJT, type JKey } from './i18n';
import { normalizeUrl, syncNow, testConnection, useSyncStatus, type SyncState } from './remoteSync';
import { useGarden } from './store';
import { Button, Card, INK500, INK700, Notice } from './ui';

const inputStyle = { background: 'var(--color-paper-100)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' };

const STATE_KEY: Record<SyncState, JKey> = {
  off: 'sync.state.off',
  connecting: 'sync.state.connecting',
  ok: 'sync.state.ok',
  offline: 'sync.state.offline',
  auth: 'sync.state.auth',
  error: 'sync.state.error',
  otherGarden: 'sync.state.otherGarden',
};

export function SyncCard() {
  const { data, updateSettings } = useGarden();
  const { tt, lang } = useJT();
  const st = useSyncStatus();
  const cfg = data.settings.sync;
  const [url, setUrl] = useState(cfg?.url ?? '');
  const [code, setCode] = useState(cfg?.code ?? '');
  const [test, setTest] = useState<null | 'busy' | 'ok' | 'offline' | 'auth' | 'notPc'>(null);
  const time = st.lastAt ? new Date(st.lastAt).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  const tone = st.state === 'ok' ? '#2f6a2a' : st.state === 'connecting' || st.state === 'off' ? INK700 : '#9a3b1c';
  const stateLine = (
    <p className="mt-2 text-sm font-medium" style={{ color: tone }} role="status">
      {st.state === 'ok' ? '●' : '○'} {tt(STATE_KEY[st.state], { time })}
      {st.state === 'ok' && (st.photosPending ?? 0) > 0 ? ` · ${tt('sync.photosPending', { n: st.photosPending ?? 0 })}` : ''}
    </p>
  );

  if (st.mode === 'pc') {
    return (
      <Card title={`🔄 ${tt('sync.title')}`}>
        <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('sync.pcLead')}
        </p>
        <div className="mt-2 rounded p-3 font-data text-sm" style={{ background: 'var(--color-paper-200)' }}>
          <p>
            {tt('sync.address')} : <b>{st.info?.urls[0] ?? '—'}</b>
          </p>
          {(st.info?.urls.length ?? 0) > 1 && (
            <p className="text-xs" style={{ color: INK500 }}>
              {tt('sync.otherUrls', { list: st.info!.urls.slice(1).join(', ') })}
            </p>
          )}
          <p className="mt-1">
            {tt('sync.code')} : <b>{st.info?.code}</b>
          </p>
        </div>
        {stateLine}
        <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('sync.note')}
        </p>
      </Card>
    );
  }

  const connected = !!cfg?.url;
  return (
    <Card title={`🔄 ${tt('sync.title')}`}>
      <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
        {tt('sync.lead')}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
        <label className="block text-xs">
          <span className="mb-0.5 block" style={{ color: INK700 }}>
            {tt('sync.address')}
          </span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://192.168.1.20:8787" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} className="field w-full rounded px-2 py-2 font-data text-sm outline-none" style={inputStyle} />
        </label>
        <label className="block text-xs">
          <span className="mb-0.5 block" style={{ color: INK700 }}>
            {tt('sync.code')}
          </span>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCD-1234" autoCapitalize="characters" autoCorrect="off" spellCheck={false} className="field w-full rounded px-2 py-2 font-data text-sm uppercase outline-none" style={inputStyle} />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          kind="primary"
          disabled={!url.trim() || !code.trim() || test === 'busy'}
          onClick={async () => {
            setTest('busy');
            const r = await testConnection(url, code);
            setTest(r);
            if (r === 'ok') {
              setUrl(normalizeUrl(url));
              updateSettings({ sync: { url: normalizeUrl(url), code: code.trim().toUpperCase() } });
            }
          }}
        >
          {test === 'busy' ? tt('sync.testing') : connected ? tt('sync.update') : tt('sync.connect')}
        </Button>
        {connected && (
          <>
            <Button kind="ghost" onClick={syncNow}>
              ↻ {tt('sync.now')}
            </Button>
            <Button
              kind="ghost"
              onClick={() => {
                updateSettings({ sync: undefined });
                setTest(null);
              }}
            >
              {tt('sync.disconnect')}
            </Button>
          </>
        )}
      </div>
      {test && test !== 'busy' && test !== 'ok' && (
        <div className="mt-2">
          <Notice tone="warn">{tt(`sync.test.${test}` as JKey)}</Notice>
        </div>
      )}
      {connected && stateLine}
      <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('sync.howto')} {tt('sync.note')}
      </p>
    </Card>
  );
}
