import { useMemo, useState } from 'react';
import { PRODUCTS, PRODUCT_BY_ID } from './data/products';
import type { Plant } from './model';
import { allowedProducts, bestProduct, doseFor, NUTRIENTS, nutrientStatus, OXIDE_TO_ELEMENT, LEGUME_N_FIXED, NEED_MARGIN, type Nutrient } from './engine/nutrition';
import { fmtDate, fmtG, fmtNum } from './format';
import { stockForProduct } from './engine/stock';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Field, INK500, INK700, Meter, Notice, Select, TextInput, Why } from './ui';

export const NUT_LABEL: Record<Nutrient, string> = { N: 'N', P2O5: 'P₂O₅', K2O: 'K₂O' };
/** Trois teintes repérées par leur nom écrit à côté (jamais la couleur seule). */
export const NUT_COLOR: Record<Nutrient, string> = { N: '#4a7f36', P2O5: '#b4561a', K2O: '#7a5aa8' };

export function NutritionPanel({ plant }: { plant: Plant }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const st = useMemo(() => nutrientStatus(plant, data, today), [plant, data, today]);
  const products = allowedProducts(PRODUCTS, data.settings);
  const inSeason = st.byStage.length > 0 && today >= (st.byStage[1]?.from ?? st.byStage[0].from);
  const suggested = bestProduct(products, st.dueNow, st.area, inSeason) ?? products[0];
  const [productId, setProductId] = useState(suggested?.id ?? 'organicNPK');
  const product = PRODUCT_BY_ID[productId] ?? products[0];
  const dose = product ? doseFor(product, st.dueNow, st.area) : null;
  const [amount, setAmount] = useState('');
  const [cost, setCost] = useState('');
  const unit = product?.kind === 'liquid' ? 'mL' : 'g';
  const stock = product ? stockForProduct(data, product.id) : undefined;
  const noSoilTest = data.settings.pH === undefined;
  const livingSoil = data.settings.practices.some((p) => p === 'livingSoil' || p === 'permaculture');
  const history = data.applications.filter((a) => a.bedId === plant.bedId && (!a.plantId || a.plantId === plant.id)).sort((a, b) => b.date.localeCompare(a.date));
  const g = (v: number) => fmtG(v, lang);

  const record = () => {
    const qty = Number(amount.replace(',', '.')) || (dose ? Math.round(dose.amount) : 0);
    if (!product || qty <= 0) return;
    const c = Number(cost.replace(',', '.'));
    store.addApplication({ bedId: plant.bedId, plantId: plant.id, productId: product.id, amount: qty, date: today, cost: c > 0 ? c : undefined });
    setAmount('');
    setCost('');
    nav.toast(tt('nut.recorded'));
  };

  return (
    <section>
      <h3 className="mb-1 font-display text-lg">🧺 {tt('nut.title')}</h3>
      <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
        {tt('nut.lead', { kg: fmtNum(st.yieldKg, lang, 1), m2: fmtNum(st.area, lang, 1) })}
      </p>
      {st.soil && (
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-canopy-700)' }}>
          🪨 {tt('nut.soil', { date: fmtDate(st.soil.date, lang, true), p: fmtNum(st.soil.P2O5, lang, 1), k: fmtNum(st.soil.K2O, lang, 1), n: fmtNum(st.soil.nCredit, lang, 0) })}
        </p>
      )}
      {(st.mulch.N >= 0.5 || st.mulch.K2O >= 0.5) && (
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-canopy-700)' }}>
          🍂 {tt('nut.mulch', { n: fmtNum(st.mulch.N, lang, 0), k: fmtNum(st.mulch.K2O, lang, 0) })}
        </p>
      )}
      {st.cover >= 0.5 && (
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-canopy-700)' }}>
          🌾 {tt('nut.cover', { n: fmtNum(st.cover, lang, 0) })}
        </p>
      )}

      <table className="mt-3 w-full text-xs">
        <thead>
          <tr style={{ color: INK500 }}>
            <th className="py-1 pr-2 text-left font-normal">{tt('nut.col.element')}</th>
            <th className="py-1 pr-2 text-right font-normal">{tt('nut.col.need')}</th>
            <th className="py-1 pr-2 text-right font-normal">{tt('nut.col.applied')}</th>
            <th className="py-1 text-right font-normal">{tt('nut.col.now')}</th>
          </tr>
        </thead>
        <tbody>
          {NUTRIENTS.map((n) => (
            <tr key={n} className="border-t" style={{ borderColor: 'var(--color-paper-300)' }}>
              <td className="py-1.5 pr-2">
                <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: NUT_COLOR[n] }} /> <b>{NUT_LABEL[n]}</b>
              </td>
              <td className="py-1.5 pr-2 text-right font-data">
                {g(st.low[n])} – {g(st.high[n])}
              </td>
              <td className="py-1.5 pr-2 text-right font-data">{g(st.applied[n])}</td>
              <td className="py-1.5 text-right font-data font-semibold" style={{ color: st.dueNow[n] > 0.5 ? 'var(--color-tomato-600)' : INK500 }}>
                {g(st.dueNow[n])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 space-y-1.5">
        {NUTRIENTS.map((n) => (
          <div key={n} className="flex items-center gap-2 text-[11px]">
            <span className="w-9 font-data">{NUT_LABEL[n]}</span>
            <div className="flex-1">
              <Meter value={st.applied[n]} max={Math.max(st.need[n], st.applied[n], 0.01)} color={NUT_COLOR[n]} label={tt('nut.coverage', { el: NUT_LABEL[n], pct: Math.round((st.applied[n] / Math.max(st.need[n], 0.01)) * 100) })} />
            </div>
            <span className="w-12 text-right" style={{ color: INK500 }}>
              {Math.round((st.applied[n] / Math.max(st.need[n], 0.01)) * 100)} %
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wide" style={{ color: INK500 }}>
          {tt('nut.byStage')}
        </p>
        <ul className="mt-1 space-y-0.5 text-xs" style={{ color: INK700 }}>
          {st.byStage.map((s) => (
            <li key={s.stage} className="flex justify-between gap-2">
              <span>
                {tt(`stage.${s.stage}` as JKey)} <span style={{ color: INK500 }}>({tt('nut.from', { date: fmtDate(s.from, lang) })})</span>
              </span>
              <span className="font-data">
                N {g(s.need.N)} · K₂O {g(s.need.K2O)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {st.legume && <div className="mt-3"><Notice tone="good">{tt('nut.legume', { pct: Math.round(LEGUME_N_FIXED * 100) })}</Notice></div>}
      {st.excess.length > 0 && <div className="mt-3"><Notice tone="warn">{tt('nut.excess', { els: st.excess.map((n) => NUT_LABEL[n]).join(', ') })}</Notice></div>}

      {plant.status !== 'ended' && product && (
        <div className="mt-3 rounded p-3" style={{ background: 'var(--color-paper-200)' }}>
          <p className="text-sm font-medium">{tt('nut.doseTitle')}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Field label={tt('nut.product')}>{(fid) => <Select id={fid} value={product.id} onChange={setProductId} options={products.map((p) => ({ v: p.id, l: `${p.name[lang]} (${p.N}-${p.P2O5}-${p.K2O})` }))} />}</Field>
          </div>
          {dose ? (
            <p className="mt-2 text-sm leading-relaxed">
              {tt('nut.dose', {
                amount: unit === 'mL' ? `${fmtNum(dose.amount, lang)} mL` : g(dose.amount),
                perM2: `${fmtNum(dose.perM2, lang, dose.perM2 < 10 ? 1 : 0)} ${unit}/m²`,
                el: NUT_LABEL[dose.drivenBy],
              })}{' '}
              <span style={{ color: INK500 }}>{tt('nut.gives', { n: g(dose.gives.N), p: g(dose.gives.P2O5), k: g(dose.gives.K2O) })}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm" style={{ color: INK700 }}>
              {tt('nut.nothingDue')}
            </p>
          )}
          {dose && dose.overshoot.length > 0 && <p className="mt-1 text-xs" style={{ color: 'var(--color-tomato-600)' }}>{tt('nut.overshoot', { els: dose.overshoot.map((n) => NUT_LABEL[n]).join(', ') })}</p>}
          <p className="mt-1 text-[11px] leading-snug" style={{ color: INK500 }}>
            {product.note[lang]}
          </p>
          {stock ? (
            <p className="mt-1 text-[11px]" style={{ color: stock.low ? '#a5532f' : INK700 }}>
              📦 {tt('nut.inStock', { qty: `${fmtNum(stock.remaining, lang, stock.item.unit === 'kg' || stock.item.unit === 'L' ? 1 : 0)} ${stock.item.unit}` })}
              {stock.low ? ` · ${tt('stock.low')}` : ''}
            </p>
          ) : (
            <button type="button" className="mt-1 text-[11px] underline" style={{ color: INK500 }} onClick={() => nav.open({ type: 'stock', productId: product.id })}>
              📦 {tt('nut.trackStock')}
            </button>
          )}
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div className="w-32">
              <Field label={tt('nut.amount', { unit })}>{(fid) => <TextInput id={fid} type="number" value={amount} onChange={setAmount} placeholder={dose ? String(Math.round(dose.amount)) : '0'} />}</Field>
            </div>
            <div className="w-24">
              <Field label={tt('nut.cost')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={cost} onChange={setCost} placeholder="€" />}</Field>
            </div>
            <Button kind="primary" small onClick={record} disabled={!dose && !(Number(amount) > 0)}>
              {tt('nut.record')}
            </Button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-xs" style={{ color: INK700 }}>
          {history.slice(0, 6).map((a) => {
            const pr = PRODUCT_BY_ID[a.productId];
            return (
              <li key={a.id}>
                {fmtDate(a.date, lang, true)} · {pr?.name[lang] ?? a.productId} · {pr?.kind === 'liquid' ? `${fmtNum(a.amount, lang)} mL` : g(a.amount)}
                {!a.plantId ? ` (${tt('nut.bedShare')})` : ''}
              </li>
            );
          })}
        </ul>
      )}

      <Why label={tt('common.why')}>
        <p>{tt('nut.why1', { margin: Math.round(NEED_MARGIN * 100) })}</p>
        <p>{tt('nut.why2', { p: OXIDE_TO_ELEMENT.P2O5, k: OXIDE_TO_ELEMENT.K2O })}</p>
        <p>{tt('nut.why3')}</p>
        {noSoilTest && <p>{tt('nut.whyNoTest')}</p>}
        {livingSoil && <p>{tt('nut.whyLivingSoil')}</p>}
      </Why>
    </section>
  );
}
