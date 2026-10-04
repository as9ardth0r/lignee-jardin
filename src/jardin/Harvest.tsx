/**
 * Saisie rapide des récoltes : les cultures en pleine récolte (et les fleurs
 * en floraison) sont listées, on tape les poids ou les tiges coupées et on
 * enregistre tout d'un coup. Le bilan de fin de saison n'est bon que si l'on
 * pèse : moins il faut de gestes, plus on pèse.
 */
import { useMemo, useState } from 'react';
import { SPECIES_BY_ID } from './data/species';
import { harvestCandidates } from './engine/bilan';
import { fmtG, plantTitle } from './format';
import { useJT } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Empty, INK500, Sheet } from './ui';

const num = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function HarvestSheet({ onClose }: { onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [all, setAll] = useState(false);
  const [unitKg, setUnitKg] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const list = useMemo(() => harvestCandidates(data, today, all), [data, today, all]);
  const filled = list.filter((c) => num(values[c.plant.id] ?? '') > 0);

  const save = async () => {
    setBusy(true);
    try {
      for (const c of filled) {
        const v = num(values[c.plant.id]);
        await store.addObservation(
          {
            plantId: c.plant.id,
            bedId: c.plant.bedId,
            date: today,
            note: '',
            ...(c.unit === 'stems' ? { stems: Math.round(v) } : { harvestG: Math.round(unitKg ? v * 1000 : v) }),
          },
          [],
        );
      }
      nav.toast(tt('harvest.saved', { n: filled.length }));
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={`🧺 ${tt('harvest.title')}`} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> {tt('harvest.all')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={unitKg} onChange={(e) => setUnitKg(e.target.checked)} /> {tt('harvest.inKg')}
          </label>
        </div>
        {list.length === 0 ? (
          <Empty>{tt('harvest.none')}</Empty>
        ) : (
          <ul className="space-y-1.5">
            {list.map((c) => {
              const sp = SPECIES_BY_ID[c.plant.speciesId];
              const bed = data.beds.find((b) => b.id === c.plant.bedId)?.name ?? '';
              const unit = c.unit === 'stems' ? tt('harvest.stems') : unitKg ? 'kg' : 'g';
              return (
                <li key={c.plant.id} className="flex items-center gap-2 rounded px-2 py-1.5" style={{ background: 'var(--color-paper-200)' }}>
                  <span className="w-6 shrink-0 text-center text-lg" aria-hidden="true">
                    {sp?.emoji}
                  </span>
                  <span className="min-w-0 flex-1 text-sm leading-snug">
                    <span className="block truncate">{plantTitle(c.plant, lang)}</span>
                    <span className="block text-[11px]" style={{ color: INK500 }}>
                      {bed}
                      {c.todayAmount > 0 ? ` · ${tt('harvest.already', { v: c.unit === 'stems' ? `${c.todayAmount} ${tt('harvest.stems')}` : fmtG(c.todayAmount, lang) })}` : ''}
                    </span>
                  </span>
                  <span className="w-24 shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values[c.plant.id] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setValues((s) => ({ ...s, [c.plant.id]: v }));
                      }}
                      placeholder={unit}
                      aria-label={tt('harvest.amountFor', { crop: plantTitle(c.plant, lang), unit })}
                      className="field w-full rounded px-2 py-1.5 text-right font-data text-sm outline-none"
                      style={{ background: 'var(--color-paper-100)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('harvest.hint')}
        </p>
        <div className="flex justify-end gap-2">
          <Button kind="ghost" onClick={onClose}>
            {tt('common.cancel')}
          </Button>
          <Button kind="primary" onClick={() => void save()} disabled={busy || filled.length === 0}>
            {busy ? '…' : tt('harvest.save', { n: filled.length })}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
