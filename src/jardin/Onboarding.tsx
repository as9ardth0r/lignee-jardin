import { useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import type { Settings } from './model';
import { useJT } from './i18n';
import { useGarden } from './store';
import { ChoiceChips, ClimatePicker, KINDS, PRACTICES, TexturePicker, WATER } from './SettingsView';
import { Button, Field, INK500, INK700, TextInput } from './ui';
import { LocationPicker } from './Weather';

const STEPS = ['welcome', 'where', 'what', 'how', 'soil', 'water', 'start'] as const;

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/** Cinq questions pour régler le jardin (toutes modifiables ensuite dans Réglages). */
export function Onboarding() {
  const store = useGarden();
  const { tt } = useJT();
  const [i, setI] = useState(0);
  const [s, setS] = useState<Settings>(store.data.settings);
  const step = STEPS[i];
  const set = (patch: Partial<Settings>) => setS((x) => ({ ...x, ...patch }));
  const [climateChosen, setClimateChosen] = useState(false);
  const finish = (demo: boolean) => {
    // Lieu et météo sont réglés directement par le sélecteur de lieu ; le climat suggéré reste sauf choix explicite.
    const cur = store.data.settings;
    store.updateSettings({ ...s, lat: cur.lat, lon: cur.lon, placeName: cur.placeName, weather: cur.weather, climate: climateChosen ? s.climate : cur.climate, onboarded: true });
    if (demo) store.loadDemo();
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl" style={{ color: 'var(--color-paper-100)' }}>
            Lignée <span className="italic" style={{ color: 'var(--color-tomato-400)' }}>· {tt('app.title')}</span>
          </p>
          <LanguageSwitcher />
        </div>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {STEPS.map((x, k) => (
            <div key={x} className="h-1 flex-1 rounded-full" style={{ background: k <= i ? 'var(--color-tomato-400)' : 'var(--color-canopy-700)' }} />
          ))}
        </div>
        <div className="specimen-card mt-5 p-5 sm:p-7">
          <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-tomato-500)' }}>
            {tt('onb.progress', { n: i + 1, total: STEPS.length })}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight">{tt(`onb.${step}`)}</h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: INK700 }}>
            {tt(`onb.${step}.body`)}
          </p>
          <div className="mt-4">
            {step === 'welcome' && <Field label={tt('settings.name')}>{(fid) => <TextInput id={fid} value={s.gardenName} onChange={(v) => set({ gardenName: v })} />}</Field>}
            {step === 'where' && (
              <>
                <div className="mb-4">
                  <LocationPicker compact />
                </div>
                <ClimatePicker
                  value={climateChosen ? s.climate : store.data.settings.climate}
                  onChange={(c) => {
                    setClimateChosen(true);
                    set({ climate: c });
                  }}
                />
                <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
                  {tt('onb.whereHint')}
                </p>
              </>
            )}
            {step === 'what' && <ChoiceChips values={KINDS} selected={s.kinds} onToggle={(v) => set({ kinds: toggle(s.kinds, v) })} prefix="kind" />}
            {step === 'how' && (
              <>
                <ChoiceChips values={PRACTICES} selected={s.practices} onToggle={(v) => set({ practices: toggle(s.practices, v) })} prefix="practice" />
                <ul className="mt-3 space-y-1 text-xs leading-snug" style={{ color: INK700 }}>
                  {s.practices.map((p) => (
                    <li key={p}>
                      • <b>{tt(`practice.${p}`)}</b> : {tt(`practice.${p}.desc`)}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {step === 'soil' && (
              <div className="space-y-3">
                <TexturePicker value={s.texture} onChange={(t) => set({ texture: t })} />
                <details className="rounded px-3 py-2 text-xs leading-relaxed" style={{ background: 'var(--color-paper-200)', color: INK700 }}>
                  <summary className="cursor-pointer font-medium" style={{ color: 'var(--color-tomato-600)' }}>
                    {tt('onb.ribbon')}
                  </summary>
                  <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                    <li>{tt('onb.ribbon1')}</li>
                    <li>{tt('onb.ribbon2')}</li>
                    <li>{tt('onb.ribbon3')}</li>
                  </ol>
                </details>
                <Field label={tt('settings.pH')} hint={tt('settings.pHHint')}>
                  {(fid) => <TextInput id={fid} type="number" step={0.1} value={s.pH ?? ''} onChange={(v) => set({ pH: Number(v) >= 3 && Number(v) <= 10 ? Number(v) : undefined })} />}
                </Field>
              </div>
            )}
            {step === 'water' && (
              <>
                <ChoiceChips values={WATER} selected={s.water} onToggle={(v) => set({ water: toggle(s.water, v) })} prefix="waterSetup" />
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={s.rainSource === 'manual'} onChange={(e) => set({ rainSource: e.target.checked ? 'manual' : 'average' })} className="mt-1" />
                  <span>
                    {tt('onb.gauge')}
                    <span className="block text-xs" style={{ color: INK500 }}>
                      {tt('onb.gaugeHint')}
                    </span>
                  </span>
                </label>
              </>
            )}
            {step === 'start' && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Button kind="primary" onClick={() => finish(false)}>
                  {tt('onb.startEmpty')}
                </Button>
                <Button kind="ghost" onClick={() => finish(true)}>
                  {tt('onb.startDemo')}
                </Button>
              </div>
            )}
          </div>
          {step !== 'start' && (
            <div className="mt-6 flex items-center justify-between">
              <Button kind="ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
                ← {tt('common.back')}
              </Button>
              <Button kind="primary" onClick={() => setI((x) => Math.min(STEPS.length - 1, x + 1))}>
                {tt('common.next')} →
              </Button>
            </div>
          )}
          {step === 'start' && (
            <button type="button" onClick={() => setI(i - 1)} className="mt-4 text-xs underline" style={{ color: INK500 }}>
              ← {tt('common.back')}
            </button>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] leading-snug" style={{ color: 'var(--color-paper-300)' }}>
          {tt('onb.privacy')}
        </p>
      </div>
    </div>
  );
}
