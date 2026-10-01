import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { TEXTURES } from './data/climate';
import { PRODUCT_BY_ID } from './data/products';
import { SPECIES_BY_ID } from './data/species';
import { uid, type Bed, type BedKind, type Texture } from './model';
import { isActiveOn } from './engine/crop';
import { bedArea, waterAdvice, WATER_THRESHOLD, type WaterDay } from './engine/water';
import { fmtDate, fmtG, fmtL, fmtNum, plantTitle } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Empty, Field, INK500, INK700, Meter, Notice, Select, Sheet, TextInput, Why } from './ui';

const BED_FILL: Record<BedKind, { fill: string; stroke: string }> = {
  bed: { fill: '#8a6a44', stroke: '#5a4329' },
  pot: { fill: '#b8643a', stroke: '#7a3f22' },
  greenhouse: { fill: '#cfe3e8', stroke: '#6f8f98' },
};

const snap = (v: number) => Math.round(v * 10) / 10;

/** Plan du jardin : planches déplaçables au doigt (pas de 10 cm). */
function GardenPlan() {
  const { data, saveBed } = useGarden();
  const { tt } = useJT();
  const nav = useNav();
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null);
  const { planW, planH } = data.settings;
  const today = useGarden().today;

  const toPlan = (e: RPointerEvent) => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * planW, y: ((e.clientY - r.top) / r.height) * planH };
  };

  const onDown = (e: RPointerEvent, b: Bed) => {
    const p = toPlan(e);
    drag.current = { id: b.id, dx: p.x - b.x, dy: p.y - b.y, moved: false };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const b = data.beds.find((x) => x.id === d.id)!;
    const p = toPlan(e);
    const x = snap(Math.max(0, Math.min(planW - b.w, p.x - d.dx)));
    const y = snap(Math.max(0, Math.min(planH - b.h, p.y - d.dy)));
    if (Math.abs(x - b.x) > 0.05 || Math.abs(y - b.y) > 0.05) d.moved = true;
    if (d.moved) setLive({ id: b.id, x, y });
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const b = data.beds.find((x) => x.id === d.id)!;
    if (d.moved && live) saveBed({ ...b, x: live.x, y: live.y });
    else nav.open({ type: 'bed', id: d.id });
    setLive(null);
  };

  const grid = [];
  for (let x = 0; x <= planW; x++) grid.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={planH} stroke="#3b5942" strokeWidth={0.02} />);
  for (let y = 0; y <= planH; y++) grid.push(<line key={`y${y}`} x1={0} y1={y} x2={planW} y2={y} stroke="#3b5942" strokeWidth={0.02} />);

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`-0.2 -0.2 ${planW + 0.4} ${planH + 0.4}`}
        className="w-full touch-none select-none rounded"
        style={{ background: '#1c2e20', aspectRatio: `${planW + 0.4} / ${planH + 0.4}` }}
        role="img"
        aria-label={tt('garden.planLabel', { w: planW, h: planH })}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => {
          drag.current = null;
          setLive(null);
        }}
      >
        {grid}
        {data.beds.map((b) => {
          const x = live?.id === b.id ? live.x : b.x;
          const y = live?.id === b.id ? live.y : b.y;
          const c = BED_FILL[b.kind];
          const emojis = [...new Set(data.plants.filter((p) => p.bedId === b.id && isActiveOn(p, today)).map((p) => SPECIES_BY_ID[p.speciesId]?.emoji))].slice(0, 4).join('');
          const fs = Math.max(0.22, Math.min(0.42, Math.min(b.w, b.h) * 0.28));
          return (
            <g key={b.id} onPointerDown={(e) => onDown(e, b)} style={{ cursor: 'grab' }}>
              <rect x={x} y={y} width={b.w} height={b.h} rx={b.kind === 'pot' ? Math.min(b.w, b.h) / 2 : 0.08} fill={c.fill} fillOpacity={b.kind === 'greenhouse' ? 0.35 : 1} stroke={c.stroke} strokeWidth={0.05} />
              {b.mulch && <rect x={x + 0.06} y={y + 0.06} width={Math.max(0, b.w - 0.12)} height={Math.max(0, b.h - 0.12)} rx={0.05} fill="none" stroke="#e8d79a" strokeWidth={0.03} strokeDasharray="0.12 0.08" />}
              <text x={x + b.w / 2} y={y + b.h / 2 - (emojis ? fs * 0.25 : -fs * 0.35)} textAnchor="middle" fontSize={fs} fill="#faf7ee" style={{ pointerEvents: 'none', fontWeight: 600 }}>
                {b.name}
              </text>
              {emojis && (
                <text x={x + b.w / 2} y={y + b.h / 2 + fs * 0.95} textAnchor="middle" fontSize={fs * 0.9} style={{ pointerEvents: 'none' }}>
                  {emojis}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('garden.planHint', { w: planW, h: planH })}
      </p>
    </div>
  );
}

export function GardenView() {
  const { data, saveBed, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();

  const addBed = () => {
    const { planW, planH } = data.settings;
    // Première place libre en balayant le plan de haut en bas.
    let spot = { x: 0.5, y: 0.5 };
    const w = Math.min(4, planW - 1);
    const h = 1.2;
    outer: for (let y = 0.5; y + h <= planH; y += 0.5)
      for (let x = 0.5; x + w <= planW; x += 0.5) {
        const free = data.beds.every((b) => x + w <= b.x - 0.3 || x >= b.x + b.w + 0.3 || y + h <= b.y - 0.3 || y >= b.y + b.h + 0.3);
        if (free) {
          spot = { x, y };
          break outer;
        }
      }
    const bed: Bed = { id: uid('bed'), name: tt('garden.bedN', { n: data.beds.length + 1 }), kind: 'bed', ...spot, w, h, mulch: false, drip: false, createdAt: today };
    saveBed(bed);
    nav.open({ type: 'bed', id: bed.id });
  };

  return (
    <div className="space-y-4">
      <Card title={tt('garden.title')} action={<Button kind="primary" small onClick={addBed}>+ {tt('garden.addBed')}</Button>}>
        <GardenPlan />
      </Card>
      <Card title={tt('garden.beds', { n: data.beds.length })}>
        {data.beds.length === 0 ? (
          <Empty>{tt('garden.noBed')}</Empty>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.beds.map((b) => {
              const active = data.plants.filter((p) => p.bedId === b.id && p.status !== 'ended');
              return (
                <li key={b.id}>
                  <button type="button" onClick={() => nav.open({ type: 'bed', id: b.id })} className="w-full rounded px-3 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-[11px]" style={{ color: INK500 }}>
                        {tt(`bedKind.${b.kind}` as JKey)} · {fmtNum(bedArea(b), lang, 1)} m²
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs" style={{ color: INK700 }}>
                      {active.length ? active.map((p) => SPECIES_BY_ID[p.speciesId]?.emoji).join(' ') : tt('garden.bedEmpty')}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

// --- Courbe de la réserve en eau ---------------------------------------------

/** Réserve utile sur 30 jours, avec le seuil d'arrosage et une lecture au survol. */
function WaterChart({ days }: { days: WaterDay[] }) {
  const { tt, lang } = useJT();
  const pts = days.slice(-30);
  const [hover, setHover] = useState<number | null>(null);
  if (pts.length < 2) return null;
  const W = 320;
  const H = 120;
  const L = 34;
  const R = 8;
  const T = 10;
  const B = 22;
  const maxRU = Math.max(...pts.map((p) => p.ru));
  const X = (i: number) => L + (i / (pts.length - 1)) * (W - L - R);
  const Y = (v: number) => T + (1 - v / maxRU) * (H - T - B);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.reserve).toFixed(1)}`).join(' ');
  const thr = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.ru * WATER_THRESHOLD).toFixed(1)}`).join(' ');
  const h = hover !== null ? pts[hover] : null;
  return (
    <figure className="mt-3">
      <figcaption className="mb-1 text-xs font-medium" style={{ color: INK700 }}>
        {tt('water.chartTitle')}
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={tt('water.chartTitle')}
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const x = ((e.clientX - r.left) / r.width) * W;
            setHover(Math.max(0, Math.min(pts.length - 1, Math.round(((x - L) / (W - L - R)) * (pts.length - 1)))));
          }}
          onPointerLeave={() => setHover(null)}
        >
          {[0, 0.5, 1].map((k) => (
            <g key={k}>
              <line x1={L} x2={W - R} y1={Y(maxRU * k)} y2={Y(maxRU * k)} stroke="#e8dcc0" strokeWidth={1} />
              <text x={L - 4} y={Y(maxRU * k) + 3} textAnchor="end" fontSize={9} fill="#6b6455">
                {Math.round(maxRU * k)}
              </text>
            </g>
          ))}
          <path d={thr} fill="none" stroke="#a87d2b" strokeWidth={1.2} strokeDasharray="4 3" />
          <path d={line} fill="none" stroke="#4a86b0" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (p.irrigation > 0 ? <circle key={i} cx={X(i)} cy={Y(p.reserve)} r={4} fill="#4a86b0" stroke="#faf7ee" strokeWidth={2} /> : null))}
          <text x={L} y={H - 6} fontSize={9} fill="#6b6455">
            {fmtDate(pts[0].date, lang)}
          </text>
          <text x={W - R} y={H - 6} fontSize={9} fill="#6b6455" textAnchor="end">
            {fmtDate(pts[pts.length - 1].date, lang)}
          </text>
          <text x={W - R} y={Y(pts[pts.length - 1].ru * WATER_THRESHOLD) - 4} fontSize={9} fill="#a87d2b" textAnchor="end">
            {tt('water.threshold')}
          </text>
          {h && hover !== null && <line x1={X(hover)} x2={X(hover)} y1={T} y2={H - B} stroke="#6b6455" strokeWidth={1} />}
        </svg>
        {h && hover !== null && (
          <div className="pointer-events-none absolute top-0 rounded px-2 py-1 text-[11px] leading-snug shadow" style={{ left: `${Math.min(70, (X(hover) / W) * 100)}%`, background: 'var(--color-canopy-900)', color: 'var(--color-paper-100)' }}>
            <b>{fmtDate(h.date, lang)}</b>
            <br />
            {tt('water.tipReserve', { mm: fmtNum(h.reserve, lang, 0), ru: fmtNum(h.ru, lang, 0) })}
            <br />
            {tt('water.tipFlux', { etc: fmtNum(h.etc, lang, 1), rain: fmtNum(h.rain, lang, 1), irr: fmtNum(h.irrigation, lang, 1) })}
          </div>
        )}
      </div>
      <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
        {tt('water.chartLegend')}
      </p>
    </figure>
  );
}

// --- Fiche d'une planche -------------------------------------------------------

export function BedSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const bed = data.beds.find((b) => b.id === id);
  const adv = useMemo(() => (bed ? waterAdvice(bed, data, today) : null), [bed, data, today]);
  if (!bed || !adv) return null;
  const set = (patch: Partial<Bed>) => store.saveBed({ ...bed, ...patch });
  const plants = data.plants.filter((p) => p.bedId === bed.id).sort((a, b) => b.sowDate.localeCompare(a.sowDate));
  const apps = data.applications.filter((a) => a.bedId === bed.id).sort((a, b) => b.date.localeCompare(a.date));
  const waters = data.water.filter((w) => w.bedId === bed.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const num = (v: string) => Math.max(0.2, Math.min(50, Number(v.replace(',', '.')) || 0.2));

  return (
    <Sheet title={bed.name} onClose={onClose} closeLabel={tt('common.close')}>
      <div className="space-y-5">
        <section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label={tt('bed.name')}>{(fid) => <TextInput id={fid} value={bed.name} onChange={(v) => set({ name: v })} />}</Field>
            <Field label={tt('bed.kind')}>
              {(fid) => <Select id={fid} value={bed.kind} onChange={(v) => set({ kind: v })} options={(['bed', 'pot', 'greenhouse'] as BedKind[]).map((k) => ({ v: k, l: tt(`bedKind.${k}` as JKey) }))} />}
            </Field>
            <Field label={tt('bed.texture')}>
              {(fid) => (
                <Select
                  id={fid}
                  value={(bed.texture ?? '') as Texture | ''}
                  onChange={(v) => set({ texture: v === '' ? undefined : (v as Texture) })}
                  options={[{ v: '' as const, l: tt('bed.textureGarden', { t: tt(`texture.${data.settings.texture}` as JKey) }) }, ...TEXTURES.map((t) => ({ v: t as Texture | '', l: tt(`texture.${t}` as JKey) }))]}
                />
              )}
            </Field>
            <Field label={tt('bed.w')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={bed.w} onChange={(v) => set({ w: num(v) })} />}</Field>
            <Field label={tt('bed.h')}>{(fid) => <TextInput id={fid} type="number" step={0.1} value={bed.h} onChange={(v) => set({ h: num(v) })} />}</Field>
            <div className="flex flex-col justify-end gap-1.5 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={bed.mulch} onChange={(e) => set({ mulch: e.target.checked })} /> {tt('bed.mulch')}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={bed.drip} onChange={(e) => set({ drip: e.target.checked })} /> {tt('bed.drip')}
              </label>
            </div>
          </div>
          <p className="mt-2 text-xs" style={{ color: INK500 }}>
            {tt('bed.area', { m2: fmtNum(bedArea(bed), lang, 1) })}
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-display text-lg">💧 {tt('water.title')}</h3>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span>{tt('water.reserveLabel', { pct: Math.round(adv.ratio * 100) })}</span>
            <span className="text-xs" style={{ color: adv.water ? 'var(--color-tomato-600)' : INK500 }}>
              {!adv.hasPlants ? tt('water.noPlants') : adv.water ? tt('water.needLiters', { liters: fmtL(adv.liters, lang) }) : tt('water.okDays', { days: Math.min(adv.daysLeft, 30) })}
            </span>
          </div>
          <div className="mt-1.5">
            <Meter value={adv.reserve} max={adv.ru} threshold={adv.ru * WATER_THRESHOLD} color="#4a86b0" label={tt('water.reserveLabel', { pct: Math.round(adv.ratio * 100) })} />
          </div>
          <WaterChart days={adv.history} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button kind="primary" small onClick={() => nav.open({ type: 'water', bedId: bed.id, kind: 'irrigation', liters: adv.water ? Math.round(adv.liters) : undefined })}>
              + {tt('water.logIrrigation')}
            </Button>
            <Button kind="ghost" small onClick={() => nav.open({ type: 'water', kind: 'rain' })}>
              + {tt('water.logRain')}
            </Button>
          </div>
          {waters.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs" style={{ color: INK700 }}>
              {waters.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2">
                  <span>
                    {fmtDate(w.date, lang)} · {fmtL(w.amount, lang)}
                  </span>
                  <button type="button" onClick={() => store.deleteWater(w.id)} className="underline" style={{ color: INK500 }}>
                    {tt('common.delete')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Why label={tt('common.why')}>
            <p>{tt('water.why1', { ru: fmtNum(adv.ru, lang, 0), etc: fmtNum(adv.etcToday, lang, 1) })}</p>
            <p>{tt('water.why2')}</p>
            <p>{tt('water.dose')}</p>
            {bed.mulch && <p>{tt('water.whyMulch')}</p>}
            {bed.kind === 'greenhouse' && <p>{tt('water.whyGreenhouse')}</p>}
          </Why>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg">🌱 {tt('bed.plants')}</h3>
            <Button small kind="primary" onClick={() => nav.open({ type: 'addPlant', bedId: bed.id })}>
              + {tt('quick.plant')}
            </Button>
          </div>
          {plants.length === 0 ? (
            <Empty>{tt('garden.bedEmpty')}</Empty>
          ) : (
            <ul className="space-y-1.5">
              {plants.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => nav.open({ type: 'plant', id: p.id })} className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm" style={{ background: 'var(--color-paper-200)' }}>
                    <span aria-hidden="true">{SPECIES_BY_ID[p.speciesId]?.emoji}</span>
                    <span className="min-w-0 flex-1 truncate">{plantTitle(p, lang)}</span>
                    <span className="text-[11px]" style={{ color: INK500 }}>
                      {tt(`status.${p.status}` as JKey)} · {fmtDate(p.sowDate, lang, true)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-display text-lg">🧺 {tt('bed.applications')}</h3>
          {apps.length === 0 ? (
            <Empty>{tt('bed.noApplication')}</Empty>
          ) : (
            <ul className="space-y-1 text-xs" style={{ color: INK700 }}>
              {apps.map((a) => {
                const pr = PRODUCT_BY_ID[a.productId];
                const target = a.plantId ? data.plants.find((p) => p.id === a.plantId) : undefined;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span>
                      {fmtDate(a.date, lang, true)} · {pr ? pr.name[lang] : a.productId} · {pr?.kind === 'liquid' ? `${fmtNum(a.amount, lang)} mL` : fmtG(a.amount, lang)}
                      {target ? ` → ${plantTitle(target, lang)}` : ''}
                    </span>
                    <button type="button" onClick={() => store.deleteApplication(a.id)} className="underline" style={{ color: INK500 }}>
                      {tt('common.delete')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--color-paper-300)' }}>
          <Button kind="ghost" onClick={() => nav.open({ type: 'observe', bedId: bed.id })}>
            📷 {tt('quick.observe')}
          </Button>
          <Button
            kind="danger"
            onClick={() => {
              if (window.confirm(tt('bed.deleteConfirm', { name: bed.name }))) {
                store.deleteBed(bed.id);
                onClose();
              }
            }}
          >
            {tt('bed.delete')}
          </Button>
        </div>
        {plants.some((p) => p.status === 'growing' && !isActiveOn(p, today)) && <Notice>{tt('bed.indoorNote')}</Notice>}
      </div>
    </Sheet>
  );
}
