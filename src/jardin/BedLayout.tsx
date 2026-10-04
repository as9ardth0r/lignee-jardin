/**
 * Disposition des cultures sur une planche (fiche de la planche) : chaque
 * culture est un rectangle qu'on fait glisser à sa place (pas de 5 cm) et
 * qu'on agrandit par son coin ; les cultures pas encore placées sont posées
 * à la première place libre (contour pointillé). Sous le dessin : surface
 * libre, chevauchements, et bons ou mauvais voisins à moins de 50 cm.
 */
import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { SPECIES_BY_ID } from './data/species';
import { speciesOf } from './engine/crop';
import { clampPos, freeArea, layoutBed, neighbours, overlaps, type LaidOut } from './engine/layout';
import { ROTATION_COLOR, rotationGroup } from './engine/rotation';
import { fmtNum, plantTitle } from './format';
import { useJT } from './i18n';
import type { Bed, PlantPos } from './model';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, INK500, INK700, Notice } from './ui';

type Drag = { id: string; mode: 'move' | 'resize'; start: [number, number]; orig: PlantPos; moved: boolean };

export function BedLayout({ bed }: { bed: Bed }) {
  const store = useGarden();
  const { data } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [live, setLive] = useState<{ id: string; pos: PlantPos } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const laid = useMemo(() => layoutBed(data, bed), [data, bed]);
  const near = useMemo(() => neighbours(data, bed.id), [data, bed.id]);
  const overl = overlaps(laid);
  const free = freeArea(bed, laid);
  const autos = laid.filter((l) => l.auto);
  const badIds = new Set(near.filter((n) => n.effect === 'bad').flatMap((n) => [n.a.id, n.b.id]));
  const overlapIds = new Set(overl.flat().map((p) => p.id));

  // Échelle : lisible au téléphone ; une longue planche défile horizontalement.
  const scale = Math.min(Math.max(320 / bed.w, 70), 300 / Math.max(0.3, bed.h));
  const widthPx = Math.max(280, bed.w * scale);

  if (bed.kind === 'hydro') return null;

  const toBed = (e: RPointerEvent): [number, number] => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * bed.w, ((e.clientY - r.top) / r.height) * bed.h];
  };
  const onDown = (e: RPointerEvent, l: LaidOut, mode: Drag['mode']) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id: l.plant.id, mode, start: toBed(e), orig: l.pos, moved: false };
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const [x, y] = toBed(e);
    const dx = x - d.start[0];
    const dy = y - d.start[1];
    if (Math.abs(dx) + Math.abs(dy) > 0.03) d.moved = true;
    const next = d.mode === 'move' ? { ...d.orig, x: d.orig.x + dx, y: d.orig.y + dy } : { ...d.orig, w: d.orig.w + dx, h: d.orig.h + dy };
    setLive({ id: d.id, pos: clampPos(next, bed) });
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const p = data.plants.find((x) => x.id === d.id);
    if (!d.moved || !live || !p) {
      setSelected(selected === d.id ? null : d.id);
      setLive(null);
      return;
    }
    // Agrandir le rectangle change la surface de la culture (besoins, rendement attendu).
    store.savePlant({ ...p, pos: live.pos, ...(d.mode === 'resize' ? { area: Math.round(live.pos.w * live.pos.h * 100) / 100 } : {}) });
    setSelected(d.id);
    setLive(null);
  };

  const sel = laid.find((l) => l.plant.id === selected);
  const fs = Math.min(0.22, bed.h * 0.28);

  return (
    <section>
      <h3 className="mb-1 font-display text-lg">📐 {tt('layout.title')}</h3>
      {laid.length === 0 ? (
        <p className="text-sm" style={{ color: INK500 }}>
          {tt('layout.empty')}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded" style={{ background: '#1c2e20' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${bed.w} ${bed.h}`}
              width="100%"
              style={{ minWidth: widthPx, maxWidth: Math.max(widthPx, (bed.w * 320) / Math.max(0.3, bed.h)) }}
              className="block h-auto touch-none select-none"
              role="img"
              aria-label={tt('layout.aria', { name: bed.name, w: fmtNum(bed.w, lang, 1), h: fmtNum(bed.h, lang, 1) })}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={() => {
                drag.current = null;
                setLive(null);
              }}
            >
              <rect x={0} y={0} width={bed.w} height={bed.h} fill="#7a5a3a" />
              {Array.from({ length: Math.floor(bed.w) + 1 }, (_, i) => (
                <line key={`gx${i}`} x1={i} y1={0} x2={i} y2={bed.h} stroke="#5e442a" strokeWidth={0.015} />
              ))}
              {Array.from({ length: Math.floor(bed.h) + 1 }, (_, i) => (
                <line key={`gy${i}`} x1={0} y1={i} x2={bed.w} y2={i} stroke="#5e442a" strokeWidth={0.015} />
              ))}
              {laid.map((l) => {
                const pos = live?.id === l.plant.id ? live.pos : l.pos;
                const sp = speciesOf(l.plant);
                const color = ROTATION_COLOR[rotationGroup(sp)];
                const bad = badIds.has(l.plant.id) || overlapIds.has(l.plant.id);
                const isSel = selected === l.plant.id;
                const name = SPECIES_BY_ID[l.plant.speciesId]?.name[lang] ?? '';
                // Nom affiché seulement s'il tient dans le rectangle (≈ 0,6 em par lettre, emoji compris).
                const fit = (pos.w - 0.04) / ((name.length + 3) * 0.62);
                const withName = fit >= fs * 0.6;
                const label = withName ? `${sp.emoji} ${name}` : sp.emoji;
                const fsl = withName ? Math.min(fs, fit) : Math.min(fs, (pos.w - 0.02) * 0.8);
                return (
                  <g key={l.plant.id} onPointerDown={(e) => onDown(e, l, 'move')} style={{ cursor: 'grab' }}>
                    <rect
                      x={pos.x + 0.015}
                      y={pos.y + 0.015}
                      width={Math.max(0.02, pos.w - 0.03)}
                      height={Math.max(0.02, pos.h - 0.03)}
                      rx={0.04}
                      fill={color}
                      fillOpacity={l.plant.status === 'planned' ? 0.45 : 0.85}
                      stroke={bad ? '#ff3b2f' : isSel ? '#faf7ee' : 'rgba(0,0,0,.4)'}
                      strokeWidth={bad || isSel ? 0.035 : 0.015}
                      strokeDasharray={l.auto ? '0.08 0.05' : undefined}
                    />
                    <text x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 + fsl * 0.35} textAnchor="middle" fontSize={fsl} fill="#faf7ee" style={{ pointerEvents: 'none', fontWeight: 600, paintOrder: 'stroke', stroke: 'rgba(0,0,0,.4)', strokeWidth: fsl * 0.08 }}>
                      {label}
                    </text>
                    {isSel && <rect x={pos.x + pos.w - 0.16} y={pos.y + pos.h - 0.16} width={0.15} height={0.15} rx={0.03} fill="#faf7ee" stroke="#2a2a22" strokeWidth={0.015} onPointerDown={(e) => onDown(e, l, 'resize')} style={{ cursor: 'nwse-resize' }} />}
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-1.5 text-xs" style={{ color: INK700 }}>
            {tt('layout.free', { m2: fmtNum(free, lang, 1), total: fmtNum(bed.w * bed.h, lang, 1) })}
            {autos.length > 0 ? ` · ${tt('layout.autoCount', { n: autos.length })}` : ''}
          </p>
          {sel && (
            <div className="mt-2 rounded px-3 py-2 text-sm" style={{ background: 'var(--color-paper-200)' }}>
              <p className="font-medium">
                {speciesOf(sel.plant).emoji} {plantTitle(sel.plant, lang)}
              </p>
              <p className="text-xs" style={{ color: INK700 }}>
                {tt('layout.dims', { w: fmtNum(sel.pos.w, lang, 2), h: fmtNum(sel.pos.h, lang, 2), x: fmtNum(sel.pos.x, lang, 2), y: fmtNum(sel.pos.y, lang, 2) })}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Button small kind="ghost" onClick={() => nav.open({ type: 'plant', id: sel.plant.id })}>
                  {tt('layout.open')}
                </Button>
                {!sel.auto && (
                  <Button
                    small
                    kind="ghost"
                    onClick={() => {
                      store.savePlant({ ...sel.plant, pos: undefined });
                      setSelected(null);
                    }}
                  >
                    {tt('layout.unplace')}
                  </Button>
                )}
              </div>
            </div>
          )}
          {autos.some((l) => !l.overflow) && (
            <div className="mt-2">
              <Button
                small
                kind="ghost"
                onClick={() => {
                  const keep = autos.filter((l) => !l.overflow);
                  for (const l of keep) store.savePlant({ ...l.plant, pos: l.pos });
                  nav.toast(tt('layout.saved', { n: keep.length }));
                }}
              >
                ✓ {tt('layout.keepAuto')}
              </Button>
            </div>
          )}
          {laid.some((l) => l.overflow) && (
            <div className="mt-2">
              <Notice tone="warn">{tt('layout.overflow', { list: laid.filter((l) => l.overflow).map((l) => plantTitle(l.plant, lang)).join(', ') })}</Notice>
            </div>
          )}
          {overl.length > 0 && (
            <div className="mt-2">
              <Notice tone="warn">{tt('layout.overlap', { list: overl.map(([a, b]) => `${plantTitle(a, lang)} / ${plantTitle(b, lang)}`).join(' ; ') })}</Notice>
            </div>
          )}
          {near.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-sm font-medium">🤝 {tt('layout.neighbours')}</p>
              <ul className="space-y-1">
                {near.map((n) => (
                  <li key={`${n.a.id}-${n.b.id}`} className="rounded px-2 py-1.5 text-xs leading-snug" style={{ background: n.effect === 'good' ? '#e6efdc' : '#f6e1d9', color: n.effect === 'good' ? '#2f4a22' : '#7a2e1c' }}>
                    <b>
                      {n.effect === 'good' ? '✓' : '✗'} {speciesOf(n.a).emoji} {plantTitle(n.a, lang)} + {speciesOf(n.b).emoji} {plantTitle(n.b, lang)}
                    </b>{' '}
                    ({n.gap < 0.05 ? tt('layout.touch') : tt('layout.cm', { cm: Math.round(n.gap * 100) })}
                    {n.sameBed ? '' : `, ${tt('layout.otherBed', { name: data.beds.find((b) => b.id === (n.a.bedId === bed.id ? n.b.bedId : n.a.bedId))?.name ?? '' })}`}) — {n.why[lang]}
                    {n.evidence === 'tradition' ? ` ${tt('layout.tradition')}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-2 text-[11px] leading-snug" style={{ color: INK500 }}>
            {tt('layout.hint')}
          </p>
        </>
      )}
    </section>
  );
}
