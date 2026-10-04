/**
 * Carte « Compost » (onglet Jardin) : tas, bacs et lombricomposteurs, avec
 * les apports, les retournements, la température, l'équilibre carbone /
 * azote et la date de maturité estimée. Le compost tamisé passe au stock.
 */
import { useState } from 'react';
import { COMPOST_MATERIALS, MATERIAL_INFO, cnAdvice, cnCorrection, compostYieldLiters, heapStatus } from './engine/compost';
import { fmtDate, fmtNum } from './format';
import { useJT, type JKey } from './i18n';
import { uid, type CompostHeap, type CompostKind, type CompostMaterial } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Empty, INK500, INK700, Select } from './ui';

const KINDS: CompostKind[] = ['heap', 'bin', 'worm'];
const KIND_EMOJI: Record<CompostKind, string> = { heap: '⛰', bin: '🗑', worm: '🪱' };
const STAGE_COLOR = { filling: '#6c9256', active: '#b07a1a', curing: '#8a6a3a', ready: '#4a7f36', harvested: INK500 } as const;

const inputStyle = { background: 'var(--color-paper-100)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' };

function HeapRow({ heap }: { heap: CompostHeap }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const [mode, setMode] = useState<'none' | 'add' | 'temp'>('none');
  const [material, setMaterial] = useState<CompostMaterial>('kitchen');
  const [liters, setLiters] = useState('');
  const [temp, setTemp] = useState('');
  const st = heapStatus(heap, today);
  const fix = cnCorrection(heap);
  const save = (h: CompostHeap) => store.saveCompost(h);
  const n = (v: string) => {
    const x = Number(v.replace(',', '.'));
    return Number.isFinite(x) ? x : NaN;
  };

  const harvest = () => {
    const l = compostYieldLiters(heap);
    if (!window.confirm(tt('compost.harvestConfirm', { l }))) return;
    save({ ...heap, harvested: { date: today, liters: l } });
    const name = tt('compost.stockName');
    const cur = data.stocks.find((s) => s.kind === 'substrate' && s.name === name && s.unit === 'L');
    store.saveStock(cur ? { ...cur, qty: cur.qty + l, since: today } : { id: uid('stk'), kind: 'substrate', name, qty: l, unit: 'L', since: today });
    nav.toast(tt('compost.harvested', { l }));
  };

  return (
    <li className="rounded px-3 py-2" style={{ background: 'var(--color-paper-200)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          {KIND_EMOJI[heap.kind]} {heap.name}
        </p>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: STAGE_COLOR[st.stage], color: '#faf7ee' }}>
          {tt(`compost.stage.${st.stage}` as JKey)}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: INK700 }}>
        {tt('compost.summary', { l: fmtNum(st.liters, lang, 0), n: heap.inputs.length })}
        {st.lastTurn ? ` · ${tt('compost.lastTurn', { date: fmtDate(st.lastTurn, lang) })}` : ''}
        {st.hot ? ` · 🔥 ${tt('compost.hot')}` : ''}
        {st.readyOn && st.stage !== 'harvested' ? ` · ${tt(st.stage === 'ready' ? 'compost.readySince' : 'compost.readyOn', { date: fmtDate(st.readyOn, lang, true) })}` : ''}
        {heap.harvested ? ` · ${tt('compost.harvestedOn', { date: fmtDate(heap.harvested.date, lang, true), l: heap.harvested.liters })}` : ''}
      </p>
      {st.cn !== null && st.stage !== 'harvested' && (
        <p className="mt-1 text-xs leading-relaxed" style={{ color: cnAdvice(st.cn) === 'good' ? '#4a7f36' : '#a5532f' }}>
          C/N ≈ {fmtNum(st.cn, lang, 0)} · {tt(`compost.cn.${cnAdvice(st.cn)}` as JKey)}
          {fix ? ` ${tt('compost.fix', { l: fix.liters, what: MATERIAL_INFO[fix.material].name[lang].toLowerCase() })}` : ''}
        </p>
      )}
      {!heap.harvested && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button small kind="ghost" onClick={() => setMode(mode === 'add' ? 'none' : 'add')}>
            + {tt('compost.add')}
          </Button>
          {heap.kind !== 'worm' && (
            <Button
              small
              kind="ghost"
              onClick={() => {
                save({ ...heap, turns: [...heap.turns, today] });
                nav.toast(tt('compost.turned'));
              }}
            >
              🔄 {tt('compost.turn')}
            </Button>
          )}
          {heap.kind !== 'worm' && (
            <Button small kind="ghost" onClick={() => setMode(mode === 'temp' ? 'none' : 'temp')}>
              🌡 {tt('compost.temp')}
            </Button>
          )}
          <Button small kind={st.stage === 'ready' ? 'primary' : 'ghost'} onClick={harvest}>
            ✓ {tt('compost.harvest')}
          </Button>
        </div>
      )}
      {mode === 'add' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <Select value={material} onChange={(v) => setMaterial(v as CompostMaterial)} options={COMPOST_MATERIALS.map((m) => ({ v: m, l: `${MATERIAL_INFO[m].emoji} ${MATERIAL_INFO[m].name[lang]} (${MATERIAL_INFO[m].green ? tt('compost.green') : tt('compost.brown')})` }))} />
          </div>
          <input value={liters} onChange={(e) => setLiters(e.target.value)} inputMode="decimal" placeholder="L" aria-label={tt('compost.liters')} className="field w-20 rounded px-2 py-1.5 text-right font-data text-sm outline-none" style={inputStyle} />
          <Button
            small
            kind="primary"
            disabled={!(n(liters) > 0)}
            onClick={() => {
              save({ ...heap, inputs: [...heap.inputs, { date: today, material, liters: n(liters) }] });
              setLiters('');
              setMode('none');
            }}
          >
            {tt('common.save')}
          </Button>
        </div>
      )}
      {mode === 'temp' && (
        <div className="mt-2 flex items-center gap-2">
          <input value={temp} onChange={(e) => setTemp(e.target.value)} inputMode="decimal" placeholder="°C" aria-label={tt('compost.temp')} className="field w-20 rounded px-2 py-1.5 text-right font-data text-sm outline-none" style={inputStyle} />
          <Button
            small
            kind="primary"
            disabled={!Number.isFinite(n(temp))}
            onClick={() => {
              save({ ...heap, temps: [...heap.temps, { date: today, c: n(temp) }] });
              setTemp('');
              setMode('none');
            }}
          >
            {tt('common.save')}
          </Button>
          <span className="text-[11px]" style={{ color: INK500 }}>
            {tt('compost.tempHint')}
          </span>
        </div>
      )}
      <button
        type="button"
        className="mt-2 text-[11px] underline"
        style={{ color: INK500 }}
        onClick={() => window.confirm(tt('compost.deleteConfirm', { name: heap.name })) && store.deleteCompost(heap.id)}
      >
        {tt('compost.delete')}
      </button>
    </li>
  );
}

export function CompostCard() {
  const store = useGarden();
  const { data, today } = store;
  const { tt } = useJT();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CompostKind>('heap');
  const heaps = [...(data.compost ?? [])].sort((a, b) => Number(Boolean(a.harvested)) - Number(Boolean(b.harvested)) || b.started.localeCompare(a.started));
  return (
    <Card
      title={`♻ ${tt('compost.title')}`}
      action={
        <Button small kind="primary" onClick={() => setAdding(!adding)}>
          + {tt('compost.new')}
        </Button>
      }
    >
      {adding && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tt('compost.namePh')} aria-label={tt('compost.name')} className="field min-w-0 flex-1 rounded px-2 py-1.5 text-sm outline-none" style={inputStyle} />
          <div className="w-44">
            <Select value={kind} onChange={(v) => setKind(v as CompostKind)} options={KINDS.map((k) => ({ v: k, l: `${KIND_EMOJI[k]} ${tt(`compost.kind.${k}` as JKey)}` }))} />
          </div>
          <Button
            small
            kind="primary"
            onClick={() => {
              store.saveCompost({ id: uid('cmp'), name: name.trim() || tt('compost.defaultName', { n: (data.compost ?? []).length + 1 }), kind, started: today, inputs: [], turns: [], temps: [] });
              setName('');
              setAdding(false);
            }}
          >
            {tt('common.save')}
          </Button>
        </div>
      )}
      {heaps.length === 0 ? <Empty>{tt('compost.none')}</Empty> : <ul className="space-y-2">{heaps.map((h) => <HeapRow key={h.id} heap={h} />)}</ul>}
      <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('compost.note')}
      </p>
    </Card>
  );
}
