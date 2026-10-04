/**
 * Localiser le jardin (GPS du téléphone) et orienter le plan avec la
 * boussole : on pose le téléphone à plat, le haut de l'écran tourné vers
 * ce qui est en haut du plan (le fond du jardin, la clôture…), et l'app en
 * déduit où se trouve le nord sur le plan.
 */
import { useEffect, useRef, useState } from 'react';
import { compassPoint } from './engine/sun';
import { useJT } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, INK500, INK700, Notice, Sheet } from './ui';

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Position du téléphone → latitude et longitude du jardin. */
export function useLocateGarden() {
  const store = useGarden();
  const { tt } = useJT();
  const nav = useNav();
  const [busy, setBusy] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) return nav.toast(tt('loc.unsupported'));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        store.updateSettings({ lat: round2(pos.coords.latitude), lon: round2(pos.coords.longitude), placeName: store.data.settings.placeName || tt('loc.myPosition') });
        nav.toast(tt('loc.saved'));
      },
      () => {
        setBusy(false);
        nav.toast(tt('loc.denied'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 600_000 },
    );
  };
  return { busy, locate };
}

/** Cap du haut du téléphone (degrés depuis le nord, sens horaire), lissé ; null tant qu'aucune mesure. */
function useHeading(active: boolean): { heading: number | null; failed: boolean } {
  const [heading, setHeading] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const buf = useRef<Array<[number, number]>>([]);
  useEffect(() => {
    if (!active) return;
    let got = false;
    const onEvent = (e: Event) => {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let h: number | null = null;
      if (typeof ev.webkitCompassHeading === 'number') h = ev.webkitCompassHeading;
      else if ((ev.absolute || e.type === 'deviceorientationabsolute') && ev.alpha !== null) h = (360 - ev.alpha) % 360;
      if (h === null) return;
      const screenAngle = (screen.orientation?.angle ?? 0) % 360;
      h = (h + screenAngle + 360) % 360;
      got = true;
      // Moyenne circulaire des dernières mesures (la boussole tremble).
      const r = (h * Math.PI) / 180;
      buf.current = [...buf.current.slice(-11), [Math.cos(r), Math.sin(r)]];
      const c = buf.current.reduce((s, v) => s + v[0], 0);
      const s = buf.current.reduce((s2, v) => s2 + v[1], 0);
      setHeading(((Math.atan2(s, c) * 180) / Math.PI + 360) % 360);
    };
    const start = async () => {
      const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
      if (!DOE) return setFailed(true);
      try {
        if (typeof DOE.requestPermission === 'function' && (await DOE.requestPermission()) !== 'granted') return setFailed(true);
      } catch {
        return setFailed(true);
      }
      window.addEventListener('deviceorientationabsolute', onEvent);
      window.addEventListener('deviceorientation', onEvent);
    };
    void start();
    const t = window.setTimeout(() => !got && setFailed(true), 4000);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('deviceorientationabsolute', onEvent);
      window.removeEventListener('deviceorientation', onEvent);
    };
  }, [active]);
  return { heading, failed };
}

/** Feuille « orienter le plan avec la boussole ». */
export function CompassSheet({ onClose }: { onClose: () => void }) {
  const store = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const { heading, failed } = useHeading(true);
  const dir = (az: number) => {
    const p = compassPoint(az);
    return lang === 'fr' ? p.replace(/W/g, 'O') : p;
  };
  // Le haut du plan regarde vers `heading` : le nord est donc à −heading sur le plan (sens horaire depuis le haut).
  const north = heading === null ? null : (Math.round((360 - heading) / 5) * 5) % 360;
  return (
    <Sheet title={tt('compass.title')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
          {tt('compass.how')}
        </p>
        <div className="flex items-center justify-center">
          <svg viewBox="-60 -60 120 120" width={180} height={180} role="img" aria-label={tt('compass.title')}>
            <circle r={56} fill="var(--color-paper-200)" stroke="var(--color-paper-300)" strokeWidth={2} />
            {['N', 'E', 'S', 'W'].map((c, i) => {
              const a = ((i * 90 - (heading ?? 0)) * Math.PI) / 180;
              return (
                <text key={c} x={Math.sin(a) * 44} y={-Math.cos(a) * 44 + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={c === 'N' ? '#a5532f' : INK500}>
                  {lang === 'fr' && c === 'W' ? 'O' : c}
                </text>
              );
            })}
            {/* Flèche fixe : le haut du téléphone = le haut du plan. */}
            <path d="M0,-34 L8,-14 L0,-19 L-8,-14 Z" fill="var(--color-leaf-500)" />
            <line x1={0} y1={-18} x2={0} y2={20} stroke="var(--color-leaf-500)" strokeWidth={3} strokeLinecap="round" />
          </svg>
        </div>
        {failed && heading === null ? (
          <Notice tone="warn">{tt('compass.unsupported')}</Notice>
        ) : heading === null ? (
          <p className="text-center text-sm" style={{ color: INK500 }}>
            {tt('compass.waiting')}
          </p>
        ) : (
          <p className="text-center text-sm font-medium">{tt('compass.result', { dir: dir(heading), deg: Math.round(heading), n: north ?? 0 })}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button
            kind="primary"
            disabled={north === null}
            onClick={() => {
              if (north === null) return;
              store.updateSettings({ planNorth: north });
              nav.toast(tt('compass.saved'));
              onClose();
            }}
          >
            {tt('compass.use')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/** Boutons « localiser » et « boussole », à poser près du plan ou dans les réglages. */
export function LocateButtons({ compact }: { compact?: boolean }) {
  const { data } = useGarden();
  const { tt } = useJT();
  const { busy, locate } = useLocateGarden();
  const [compass, setCompass] = useState(false);
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button small kind="ghost" onClick={locate} disabled={busy}>
        {busy ? tt('garden.locating') : data.settings.lat === undefined || !compact ? tt('garden.locate') : tt('garden.relocate')}
      </Button>
      <Button small kind="ghost" onClick={() => setCompass(true)}>
        {tt('compass.button')}
      </Button>
      {compass && <CompassSheet onClose={() => setCompass(false)} />}
    </div>
  );
}

/** Bouton seul « orienter avec la boussole ». */
export function CompassButton() {
  const { tt } = useJT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button small kind="ghost" onClick={() => setOpen(true)}>
        {tt('compass.button')}
      </Button>
      {open && <CompassSheet onClose={() => setOpen(false)} />}
    </>
  );
}
