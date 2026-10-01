import { useMemo, useState } from 'react';
import { PRODUCT_BY_ID, PRODUCTS } from './data/products';
import { autoShopping, seedLevel, stockLevel, type AutoLine } from './engine/stock';
import { fmtDate, fmtNum, speciesName } from './format';
import { useJT, type JKey } from './i18n';
import { uid, type StockItem, type StockKind, type StockUnit } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Empty, Field, INK500, INK700, Notice, Select, Sheet, TextInput, Why } from './ui';
import { saveFile } from '../utils/download';

const UNITS: StockUnit[] = ['g', 'kg', 'mL', 'L', 'pcs'];
const KIND_ICON: Record<StockKind, string> = { product: '🧺', substrate: '🪴', other: '📦' };

function fmtQty(q: number, unit: StockUnit, lang: 'fr' | 'en', tt: ReturnType<typeof useJT>['tt']) {
  const d = unit === 'kg' || unit === 'L' ? 1 : 0;
  return `${fmtNum(q, lang, d)} ${unit === 'pcs' ? tt('stock.pcs') : unit}`;
}

function autoText(l: AutoLine, tt: ReturnType<typeof useJT>['tt'], lang: 'fr' | 'en'): string {
  if (l.kind === 'stock') return tt('shop.stock', { name: l.item.name, left: fmtQty(l.remaining, l.item.unit, lang, tt) });
  if (l.kind === 'seeds') return tt(`shop.seeds.${l.reason}` as JKey, { species: speciesName(l.speciesId, lang), n: l.plants });
  if (l.kind === 'plants') return tt('shop.plants', { species: speciesName(l.speciesId, lang), n: l.plants });
  return tt('shop.lime', { product: PRODUCT_BY_ID[l.productId]?.name[lang] ?? l.productId, kg: fmtNum(l.grams / 1000, lang, 1) });
}

/** Stocks (Catalogue → Stocks) et liste de courses. */
export function StocksView() {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const levels = useMemo(() => data.stocks.map((s) => stockLevel(s, data)).sort((a, b) => Number(b.low) - Number(a.low) || a.item.name.localeCompare(b.item.name)), [data]);
  const auto = useMemo(() => autoShopping(data, today), [data, today]);
  const seedLow = data.seeds.map((l) => seedLevel(l, data.plants)).filter((l) => l.low);
  const [label, setLabel] = useState('');
  const manual = [...data.shopping].sort((a, b) => Number(a.done ?? false) - Number(b.done ?? false));

  const listText = () => {
    const lines = [...auto.map((l) => `☐ ${autoText(l, tt, lang)}`), ...seedLow.map((l) => `☐ ${tt('shop.seedsLow', { species: speciesName(l.lot.speciesId, lang), n: l.remaining ?? 0 })}`), ...manual.filter((m) => !m.done).map((m) => `☐ ${m.label}`)];
    return `${tt('shop.title')} — ${data.settings.gardenName} (${fmtDate(today, lang, true)})\n\n${lines.join('\n')}\n`;
  };
  const share = async () => {
    const text = listText();
    try {
      if (navigator.share) {
        await navigator.share({ title: tt('shop.title'), text });
        return;
      }
    } catch {
      // partage annulé : on retombe sur le fichier
    }
    try {
      await navigator.clipboard.writeText(text);
      nav.toast(tt('shop.copied'));
    } catch {
      await saveFile(`liste-de-courses-${today}.txt`, text, 'text/plain');
    }
  };
  const add = () => {
    if (!label.trim()) return;
    store.saveShopping({ id: uid('sh'), label: label.trim() });
    setLabel('');
  };
  const count = auto.length + seedLow.length + manual.filter((m) => !m.done).length;

  return (
    <div className="space-y-4">
      <Card
        title={`🛒 ${tt('shop.title')}${count ? ` · ${count}` : ''}`}
        action={
          count > 0 && (
            <Button small kind="ghost" onClick={() => void share()}>
              ⇪ {tt('shop.share')}
            </Button>
          )
        }
      >
        {auto.length + seedLow.length === 0 && manual.length === 0 && <Empty>{tt('shop.empty')}</Empty>}
        {(auto.length > 0 || seedLow.length > 0) && (
          <ul className="space-y-1 text-sm">
            {auto.map((l) => (
              <li key={l.key} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>{autoText(l, tt, lang)}</span>
              </li>
            ))}
            {seedLow.map((l) => (
              <li key={l.lot.id} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>{tt('shop.seedsLow', { species: speciesName(l.lot.speciesId, lang), n: l.remaining ?? 0 })}</span>
              </li>
            ))}
          </ul>
        )}
        {manual.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {manual.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <input type="checkbox" checked={!!m.done} onChange={(e) => store.saveShopping({ ...m, done: e.target.checked })} aria-label={m.label} />
                <span className="flex-1" style={{ textDecoration: m.done ? 'line-through' : undefined, color: m.done ? INK500 : undefined }}>
                  {m.label}
                </span>
                <button type="button" className="text-[11px] underline" style={{ color: INK500 }} onClick={() => store.deleteShopping(m.id)}>
                  {tt('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={tt('shop.placeholder')}
            aria-label={tt('shop.add')}
            className="field min-w-0 flex-1 rounded px-2.5 py-1.5 text-sm outline-none"
            style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }}
          />
          <Button small kind="primary" onClick={add} disabled={!label.trim()}>
            + {tt('shop.add')}
          </Button>
        </div>
        <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('shop.note')}
        </p>
      </Card>

      <Card
        title={`📦 ${tt('stock.title')}`}
        action={
          <Button small kind="primary" onClick={() => nav.open({ type: 'stock' })}>
            + {tt('stock.add')}
          </Button>
        }
      >
        {levels.length === 0 ? (
          <Empty>{tt('stock.none')}</Empty>
        ) : (
          <ul className="space-y-1.5">
            {levels.map((lv) => (
              <li key={lv.item.id}>
                <button type="button" onClick={() => nav.open({ type: 'stock', id: lv.item.id })} className="flex w-full items-center gap-3 rounded px-3 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                  <span className="text-xl" aria-hidden="true">
                    {KIND_ICON[lv.item.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{lv.item.name}</span>
                    <span className="block text-[11px]" style={{ color: INK500 }}>
                      {tt('stock.since', { qty: fmtQty(lv.item.qty, lv.item.unit, lang, tt), date: fmtDate(lv.item.since, lang) })}
                      {lv.used > 0 ? ` · ${tt('stock.used', { qty: fmtQty(lv.used, lv.item.unit, lang, tt) })}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-data text-sm font-semibold" style={{ color: lv.low ? '#a5532f' : undefined }}>
                      {fmtQty(lv.remaining, lv.item.unit, lang, tt)}
                    </span>
                    {lv.low && (
                      <span className="block text-[10px] font-semibold" style={{ color: '#a5532f' }}>
                        {tt('stock.low')}
                      </span>
                    )}
                    {lv.negative && (
                      <span className="block text-[10px]" style={{ color: '#a5532f' }}>
                        {tt('stock.recount')}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('stock.note')}
        </p>
      </Card>
    </div>
  );
}

/** Ajout ou inventaire d'un article. */
export function StockSheet({ id, productId, onClose }: { id?: string; productId?: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const editing = id ? data.stocks.find((s) => s.id === id) : undefined;
  const firstProduct = productId ? PRODUCT_BY_ID[productId] : undefined;
  const [s, setS] = useState<StockItem>(
    () =>
      editing ?? {
        id: uid('st'),
        kind: firstProduct ? 'product' : 'product',
        productId: firstProduct?.id ?? PRODUCTS[0].id,
        name: firstProduct?.name[lang] ?? PRODUCTS[0].name[lang],
        qty: 0,
        unit: firstProduct?.kind === 'liquid' ? 'L' : 'kg',
        since: today,
      },
  );
  const set = (patch: Partial<StockItem>) => setS((x) => ({ ...x, ...patch }));
  const lv = editing ? stockLevel(editing, data) : null;
  const [qty, setQty] = useState(editing ? String(Math.round((lv?.remaining ?? 0) * 100) / 100) : '');
  const [min, setMin] = useState(editing?.min !== undefined ? String(editing.min) : '');
  const [price, setPrice] = useState(editing?.priceUnit !== undefined ? String(editing.priceUnit) : '');
  const n = (v: string) => {
    const x = Number(v.replace(',', '.'));
    return v.trim() !== '' && Number.isFinite(x) && x >= 0 ? x : undefined;
  };
  const pickProduct = (pid: string) => {
    const p = PRODUCT_BY_ID[pid];
    set({ productId: pid, name: p.name[lang], unit: p.kind === 'liquid' ? 'L' : s.unit === 'L' || s.unit === 'mL' ? 'kg' : s.unit });
  };
  const save = () => {
    const q = n(qty) ?? 0;
    // Enregistrer la quantité restante comme nouvel inventaire, daté d'aujourd'hui.
    const changed = !editing || q !== Math.round((lv?.remaining ?? 0) * 100) / 100 || s.unit !== editing.unit;
    store.saveStock({ ...s, name: s.name.trim() || tt('stock.unnamed'), qty: changed ? q : editing!.qty, since: changed ? today : editing!.since, min: n(min), priceUnit: n(price) });
    nav.toast(tt('stock.saved'));
    onClose();
  };
  return (
    <Sheet title={editing ? tt('stock.editTitle') : tt('stock.addTitle')} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={tt('stock.kind')}>
            {(fid) => <Select id={fid} value={s.kind} onChange={(v) => set({ kind: v as StockKind, productId: v === 'product' ? s.productId ?? PRODUCTS[0].id : undefined })} options={(['product', 'substrate', 'other'] as StockKind[]).map((k) => ({ v: k, l: tt(`stock.kind.${k}` as JKey) }))} />}
          </Field>
          {s.kind === 'product' ? (
            <Field label={tt('csv.product')}>{(fid) => <Select id={fid} value={s.productId ?? ''} onChange={pickProduct} options={PRODUCTS.map((p) => ({ v: p.id, l: p.name[lang] }))} />}</Field>
          ) : (
            <Field label={tt('bed.name')}>{(fid) => <TextInput id={fid} value={s.name} onChange={(v) => set({ name: v })} placeholder={tt(s.kind === 'substrate' ? 'stock.substratePlaceholder' : 'stock.otherPlaceholder')} />}</Field>
          )}
          <Field label={editing ? tt('stock.qtyNow') : tt('stock.qty')} hint={editing ? tt('stock.qtyNowHint') : undefined}>
            {(fid) => <TextInput id={fid} type="number" step={0.1} value={qty} onChange={setQty} />}
          </Field>
          <Field label={tt('stock.unit')}>{(fid) => <Select id={fid} value={s.unit} onChange={(v) => set({ unit: v as StockUnit })} options={UNITS.map((u) => ({ v: u, l: u === 'pcs' ? tt('stock.pcs') : u }))} />}</Field>
          <Field label={tt('stock.min')} hint={tt('stock.minHint')}>
            {(fid) => <TextInput id={fid} type="number" step={0.1} value={min} onChange={setMin} />}
          </Field>
          <Field label={tt('stock.price', { unit: s.unit === 'pcs' ? tt('stock.pcs') : s.unit })}>{(fid) => <TextInput id={fid} type="number" step={0.01} value={price} onChange={setPrice} />}</Field>
        </div>
        {lv && lv.used > 0 && <Notice>{tt('stock.deducted', { qty: fmtQty(lv.used, s.unit, lang, tt), date: fmtDate(editing!.since, lang) })}</Notice>}
        {s.kind === 'product' && s.productId && PRODUCT_BY_ID[s.productId] && (
          <p className="text-xs" style={{ color: INK700 }}>
            {tt('stock.autoDeduct')}
          </p>
        )}
        <Why label={tt('common.why')}>
          <p>{tt('stock.why')}</p>
        </Why>
        <div className="flex flex-wrap justify-between gap-2">
          {editing ? (
            <Button
              kind="danger"
              small
              onClick={() => {
                if (window.confirm(tt('stock.deleteConfirm'))) {
                  store.deleteStock(editing.id);
                  onClose();
                }
              }}
            >
              {tt('common.delete')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button kind="ghost" onClick={onClose}>
              {tt('common.cancel')}
            </Button>
            <Button kind="primary" onClick={save} disabled={qty.trim() === ''}>
              {tt('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
