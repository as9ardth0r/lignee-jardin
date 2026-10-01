import { useState } from 'react';
import { addDays } from './engine/dates';
import { cacheAgeHours, geocodingURL, parseGeocoding, round2, suggestClimate, weatherAlerts, weatherIndex, type Place, type WeatherAlert } from './engine/weather';
import { fmtDate, fmtNum, locale } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Field, INK500, INK700, Notice, TextInput } from './ui';

const ALERT_ICON: Record<WeatherAlert['kind'], string> = { frost: '❄', heat: '🔥', wind: '💨', rain: '🌧' };

function dayIcon(rain: number, tmax: number): string {
  if (rain >= 5) return '🌧';
  if (rain >= 1) return '🌦';
  if (tmax >= 28) return '☀';
  return '⛅';
}

export function AlertLine({ alert }: { alert: WeatherAlert }) {
  const { tt, lang } = useJT();
  return (
    <li className="flex gap-2 text-sm leading-snug">
      <span aria-hidden="true">{ALERT_ICON[alert.kind]}</span>
      <span>
        <b>{tt(`alert.${alert.kind}` as JKey, { value: fmtNum(alert.value, lang), date: fmtDate(alert.date, lang) })}</b>{' '}
        <span style={{ color: INK700 }}>{tt(`alert.${alert.kind}.advice` as JKey)}</span>
      </span>
    </li>
  );
}

/** Météo des prochains jours et alertes, sur l'écran Aujourd'hui. */
export function WeatherCard() {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const s = data.settings;
  if (!s.weather || s.lat === undefined) {
    return (
      <Card title={`🌦 ${tt('wx.title')}`}>
        <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('wx.off')}
        </p>
        <div className="mt-3">
          <Button kind="ghost" small onClick={() => nav.setTab('settings')}>
            {tt('wx.enable')}
          </Button>
        </div>
      </Card>
    );
  }
  const cache = data.weather;
  const idx = weatherIndex(cache);
  const days = Array.from({ length: 5 }, (_, i) => addDays(today, i)).map((d) => ({ date: d, w: idx.get(d) }));
  const alerts = weatherAlerts(cache, today);
  const age = cache ? cacheAgeHours(cache, new Date()) : null;
  const refresh = async () => {
    const r = await store.refreshWeather(true);
    nav.toast(tt(`wx.result.${r}` as JKey));
  };
  return (
    <Card
      title={`🌦 ${tt('wx.title')}`}
      action={
        <Button small kind="ghost" onClick={refresh} disabled={store.weatherBusy}>
          {store.weatherBusy ? '…' : `↻ ${tt('wx.refresh')}`}
        </Button>
      }
    >
      <p className="-mt-2 mb-2 text-[11px]" style={{ color: INK500 }}>
        {s.placeName || `${fmtNum(s.lat, lang, 2)}, ${fmtNum(s.lon ?? 0, lang, 2)}`}
        {age !== null ? ` · ${age < 1 ? tt('wx.justNow') : tt('wx.ago', { h: Math.round(age) })}` : ` · ${tt('wx.waiting')}`}
      </p>
      {cache ? (
        <ul className="grid grid-cols-5 gap-1 text-center">
          {days.map(({ date, w }, i) => (
            <li key={date} className="rounded px-1 py-1.5" style={{ background: 'var(--color-paper-200)' }}>
              <span className="block text-[11px] capitalize" style={{ color: INK500 }}>
                {i === 0 ? tt('today.today') : new Date(`${date}T12:00:00Z`).toLocaleDateString(locale(lang), { weekday: 'short', timeZone: 'UTC' })}
              </span>
              {w ? (
                <>
                  <span className="block text-lg leading-tight" aria-hidden="true">
                    {dayIcon(w.rain, w.tmax)}
                  </span>
                  <span className="block font-data text-[11px]">
                    {Math.round(w.tmax)}° / {Math.round(w.tmin)}°
                  </span>
                  <span className="block font-data text-[10px]" style={{ color: w.rain >= 1 ? '#2f6a96' : INK500 }}>
                    {fmtNum(w.rain, lang, 1)} mm
                  </span>
                </>
              ) : (
                <span className="block text-xs" style={{ color: INK500 }}>
                  —
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm" style={{ color: INK700 }}>
          {tt('wx.none')}
        </p>
      )}
      {alerts.length > 0 && <ul className="mt-3 space-y-1.5">{alerts.map((a) => <AlertLine key={a.kind} alert={a} />)}</ul>}
      <p className="mt-3 text-[10px]" style={{ color: INK500 }}>
        {tt('wx.attribution')}
      </p>
    </Card>
  );
}

/** Choix du lieu : position de l'appareil, recherche d'une commune, ou coordonnées. */
export function LocationPicker({ compact = false }: { compact?: boolean }) {
  const store = useGarden();
  const s = store.data.settings;
  const { tt, lang } = useJT();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [suggest, setSuggest] = useState<ReturnType<typeof suggestClimate> | null>(null);

  const choose = (lat: number, lon: number, name: string, elevation?: number) => {
    store.updateSettings({ lat: round2(lat), lon: round2(lon), placeName: name, weather: true });
    const c = suggestClimate(lat, lon, elevation);
    setSuggest(c !== s.climate ? c : null);
    setResults(null);
    setMsg(null);
  };

  const locate = () => {
    if (!navigator.geolocation) return setMsg(tt('loc.unsupported'));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        choose(pos.coords.latitude, pos.coords.longitude, tt('loc.myPosition'), pos.coords.altitude ?? undefined);
      },
      () => {
        setBusy(false);
        setMsg(tt('loc.denied'));
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 3_600_000 },
    );
  };

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(geocodingURL(q.trim(), lang));
      const list = parseGeocoding(await res.json());
      setResults(list);
      if (!list.length) setMsg(tt('loc.noResult'));
    } catch {
      setMsg(tt('loc.offline'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {s.lat !== undefined && (
        <p className="text-sm">
          📍 <b>{s.placeName || tt('loc.custom')}</b>{' '}
          <span className="text-xs" style={{ color: INK500 }}>
            ({fmtNum(s.lat, lang, 2)}, {fmtNum(s.lon ?? 0, lang, 2)})
          </span>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button small kind="primary" onClick={locate} disabled={busy}>
          📍 {tt('loc.locate')}
        </Button>
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
          placeholder={tt('loc.searchPlaceholder')}
          aria-label={tt('loc.search')}
          className="field min-w-0 flex-1 rounded px-2.5 py-1.5 text-sm outline-none"
          style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }}
        />
        <Button small kind="ghost" onClick={() => void search()} disabled={busy || !q.trim()}>
          {tt('loc.search')}
        </Button>
      </div>
      {results && results.length > 0 && (
        <ul className="space-y-1">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button type="button" onClick={() => choose(r.lat, r.lon, r.name, r.elevation)} className="w-full rounded px-2.5 py-1.5 text-left text-sm" style={{ background: 'var(--color-paper-200)' }}>
                <b>{r.name}</b> <span className="text-xs" style={{ color: INK500 }}>{r.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!compact && (
        <details className="text-xs" style={{ color: INK700 }}>
          <summary className="cursor-pointer">{tt('loc.manual')}</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label={tt('loc.lat')}>{(fid) => <TextInput id={fid} type="number" step={0.01} value={s.lat ?? ''} onChange={(v) => Number.isFinite(Number(v)) && v !== '' && store.updateSettings({ lat: Math.max(-90, Math.min(90, Number(v))), placeName: '' })} />}</Field>
            <Field label={tt('loc.lon')}>{(fid) => <TextInput id={fid} type="number" step={0.01} value={s.lon ?? ''} onChange={(v) => Number.isFinite(Number(v)) && v !== '' && store.updateSettings({ lon: Math.max(-180, Math.min(180, Number(v))), placeName: '' })} />}</Field>
          </div>
        </details>
      )}
      {msg && <Notice tone="warn">{msg}</Notice>}
      {suggest && (
        <Notice>
          {tt('loc.suggest', { climate: tt(`climate.${suggest}` as JKey) })}{' '}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              store.updateSettings({ climate: suggest });
              setSuggest(null);
            }}
          >
            {tt('loc.apply')}
          </button>
        </Notice>
      )}
      <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('loc.privacy')}
      </p>
    </div>
  );
}
