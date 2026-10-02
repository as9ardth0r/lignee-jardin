import { useMemo, useState } from 'react';
import { SPECIES, SPECIES_BY_ID } from './data/species';
import { CROP_TYPES, type CropType, type Family, type MonthRange } from './model';
import { cropCalendar, inWindow, isPlanted } from './engine/crop';
import { monthName } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Chip, Empty, INK500, INK700, Sheet } from './ui';
import { companionsOf, SPECIES_EXTRA } from './data/speciesExtra';
import { speciesWithType, typesOf } from './data/speciesTypes';
import { seedState } from './engine/season';
import { SeedsPanel } from './Seeds';
import { StocksView } from './Stocks';

export function CatalogView() {
  const { tt } = useJT();
  const [mode, setMode] = useState<'species' | 'seeds' | 'stocks'>('species');
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={mode === 'species'} onClick={() => setMode('species')}>
          📖 {tt('catalog.modeSpecies')}
        </Chip>
        <Chip active={mode === 'seeds'} onClick={() => setMode('seeds')}>
          🌰 {tt('catalog.modeSeeds')}
        </Chip>
        <Chip active={mode === 'stocks'} onClick={() => setMode('stocks')}>
          📦 {tt('catalog.modeStocks')}
        </Chip>
      </div>
      {mode === 'species' && <SpeciesList />}
      {mode === 'seeds' && (
        <Card title={tt('seeds.title')}>
          <SeedsPanel />
        </Card>
      )}
      {mode === 'stocks' && <StocksView />}
    </>
  );
}

function SpeciesList() {
  const { tt, lang } = useJT();
  const nav = useNav();
  const [q, setQ] = useState('');
  const [type, setType] = useState<CropType | 'all'>('all');
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return SPECIES.filter((s) => (type === 'all' || s.type === type) && (!ql || s.name[lang].toLowerCase().includes(ql) || s.latin.toLowerCase().includes(ql))).sort((a, b) => a.name[lang].localeCompare(b.name[lang]));
  }, [q, type, lang]);
  return (
    <Card title={tt('catalog.title', { n: SPECIES.length })}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tt('catalog.search')} aria-label={tt('catalog.search')} className="field w-full rounded px-2.5 py-2 text-sm outline-none" style={{ background: 'var(--color-paper-200)', boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }} />
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip active={type === 'all'} onClick={() => setType('all')}>
          {tt('catalog.all')}
        </Chip>
        {CROP_TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>
            {tt(`type.${t}` as JKey)}
          </Chip>
        ))}
      </div>
      <div className="mt-3">
        {list.length === 0 ? (
          <Empty>{tt('catalog.none')}</Empty>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => nav.open({ type: 'species', id: s.id })} className="flex h-full w-full items-center gap-2 rounded px-2.5 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                  <span className="text-2xl" aria-hidden="true">
                    {s.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{s.name[lang]}</span>
                    <span className="block truncate text-[11px]" style={{ color: INK500 }}>
                      {tt(`family.${s.family}` as JKey)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('catalog.note')}
      </p>
    </Card>
  );
}

/** Calendrier sur 12 mois : une ligne par geste, une case par mois (avec texte, pas seulement la couleur). */
function YearCalendar({ rows }: { rows: Array<{ label: string; ranges: MonthRange[]; color: string }> }) {
  const { lang } = useJT();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-separate text-[10px]" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th style={{ width: '4.75rem' }} />
            {months.map((m) => (
              <th key={m} className="font-normal" style={{ color: INK500 }}>
                {monthName(m, lang, 'narrow')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((r) => r.ranges.length)
            .map((r) => (
              <tr key={r.label}>
                <th className="pr-1 text-left text-[11px] font-medium leading-tight" style={{ color: INK700 }}>
                  {r.label}
                </th>
                {months.map((m) => {
                  const on = inWindow(m, r.ranges);
                  return <td key={m} className="h-4 rounded-sm" style={{ background: on ? r.color : 'var(--color-paper-200)' }} aria-label={on ? `${r.label} ${monthName(m, lang, 'long')}` : undefined} />;
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export function SpeciesSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, today } = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const s = SPECIES_BY_ID[id];
  const extra = SPECIES_EXTRA[id];
  const comps = companionsOf(id);
  const lots = data.seeds.filter((l) => l.speciesId === id);
  if (!s) return null;
  const cal = cropCalendar(s, data.settings.climate);
  const varieties = data.varieties.filter((v) => v.speciesId === s.id);
  const rows: Array<[string, string]> = [
    [tt('sp.family'), tt(`family.${s.family as Family}` as JKey)],
    [tt('sp.type'), `${tt(`type.${s.type}` as JKey)} · ${tt(`life.${s.life}` as JKey)}`],
    [tt('sp.sun'), tt(`sun.${s.sun}` as JKey)],
    [tt('sp.frost'), tt(`frost.${s.frost}` as JKey)],
    [tt('sp.temp'), tt('sp.tempV', { lo: s.tOpt[0], hi: s.tOpt[1], base: s.tBase })],
    [tt('sp.pH'), `${s.pH[0]} – ${s.pH[1]}`],
    [tt('sp.spacing'), tt('add.spacing', { row: s.spacing.row, inRow: s.spacing.inRow })],
    [tt('sp.harvest'), tt('sp.harvestV', { lo: s.daysToHarvest[0], hi: s.daysToHarvest[1] })],
    [tt('sp.yield'), tt('sp.yieldV', { lo: s.yieldM2[0], hi: s.yieldM2[1] })],
    [tt('sp.exports'), tt('sp.exportsV', { n: s.exports.N, p: s.exports.P2O5, k: s.exports.K2O })],
    [tt('sp.feeding'), tt(`feeding.${s.feeding}` as JKey)],
    [tt('sp.kc'), `${s.kc[0]} → ${s.kc[1]} → ${s.kc[2]}`],
    [tt('sp.root'), `${Math.round(s.rootDepth * 100)} cm`],
    [tt('sp.rotation'), tt('sp.rotationV', { n: s.returnYears })],
  ];
  return (
    <Sheet
      title={
        <span>
          {s.emoji} {s.name[lang]}
        </span>
      }
      onClose={onClose}
      closeLabel={tt('common.close')}
    >
      <div className="space-y-4">
        <p className="text-sm italic" style={{ color: INK700 }}>
          {s.latin}
        </p>
        <p className="text-sm leading-relaxed">💡 {s.note[lang]}</p>
        <section>
          <h3 className="mb-1 font-display text-base">{tt('sp.calendar', { climate: tt(`climate.${data.settings.climate}` as JKey) })}</h3>
          <YearCalendar
            rows={[
              { label: tt('cal.sowIndoor'), ranges: cal.sowIndoor, color: '#c89b3c' },
              { label: tt('cal.sowOutdoor'), ranges: cal.sowOutdoor, color: '#6c9256' },
              { label: tt('cal.plantOut'), ranges: cal.plantOut, color: '#4a7f36' },
            ]}
          />
        </section>
        {typesOf(s.id).length > 0 && (
          <section>
            <h3 className="mb-1 font-display text-base">{tt('types.title')}</h3>
            <p className="mb-2 text-xs leading-relaxed" style={{ color: INK700 }}>
              {tt('types.lead')}
            </p>
            <ul className="space-y-3">
              {typesOf(s.id).map((t) => {
                const ts = speciesWithType(s, t.id);
                const tc = cropCalendar(ts, data.settings.climate);
                return (
                  <li key={t.id} className="rounded p-2.5" style={{ boxShadow: 'inset 0 0 0 1px var(--color-paper-300)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{t.name[lang]}</p>
                      <Button small kind="ghost" onClick={() => nav.open({ type: 'addPlant', speciesId: s.id, typeId: t.id })}>
                        + {tt('types.grow')}
                      </Button>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed" style={{ color: INK700 }}>
                      {t.note[lang]}
                    </p>
                    {t.examples && (
                      <p className="mt-0.5 text-[11px] italic" style={{ color: INK500 }}>
                        {tt('types.examples', { list: t.examples })}
                      </p>
                    )}
                    <div className="mt-1.5">
                      <YearCalendar
                        rows={[
                          { label: tt('cal.sowIndoor'), ranges: tc.sowIndoor, color: '#c89b3c' },
                          { label: tt('cal.sowOutdoor'), ranges: tc.sowOutdoor, color: '#6c9256' },
                          { label: tt('cal.plantOut'), ranges: tc.plantOut, color: '#4a7f36' },
                        ]}
                      />
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: INK500 }}>
                      {tt(isPlanted(ts) ? 'types.harvestPlanted' : 'types.harvestSown', { lo: t.daysToHarvest[0], hi: t.daysToHarvest[1] })}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <section>
          <h3 className="mb-1 font-display text-base">{tt('sp.stages')}</h3>
          <p className="text-xs" style={{ color: INK700 }}>
            {s.stages.map(([st, d]) => `${tt(`stage.${st}` as JKey)} (${tt('sp.dayN', { n: d })})`).join(' → ')}
          </p>
        </section>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt style={{ color: INK500 }}>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {varieties.length > 0 && (
          <section>
            <h3 className="mb-1 font-display text-base">{tt('sp.varieties')}</h3>
            <ul className="space-y-0.5 text-sm">
              {varieties.map((v) => (
                <li key={v.id}>
                  {v.name} <span className="text-xs" style={{ color: INK500 }}>({v.origin.startsWith('lignee:') ? tt('sp.fromLignee') : tt('sp.mine')})</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {comps.length > 0 && (
          <section>
            <h3 className="mb-1 font-display text-base">{tt('sp.companions')}</h3>
            <ul className="space-y-1 text-sm">
              {comps.map((c) => (
                <li key={c.other}>
                  {c.effect === 'good' ? '👍' : '👎'} <b>{SPECIES_BY_ID[c.other]?.name[lang] ?? c.other}</b>{' '}
                  <span className="text-xs" style={{ color: INK700 }}>
                    — {c.why[lang]} <i>({tt(`evidence.${c.evidence}` as JKey)})</i>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {extra && (
          <section>
            <h3 className="mb-1 font-display text-base">🌰 {tt('seeds.saving')}</h3>
            <p className="text-sm leading-relaxed" style={{ color: INK700 }}>
              {tt('seeds.savingV', { poll: tt(`pollination.${extra.pollination}` as JKey), m: extra.isolation, life: extra.seedLife })}
            </p>
            {lots.length > 0 && (
              <p className="mt-1 text-xs">
                {tt('sp.myLots')}{' '}
                {lots.map((l) => `${l.year}${l.varietyName ? ` ${l.varietyName}` : ''} (${tt(`seeds.state.${seedState(l, today).state}` as JKey)})`).join(', ')}
              </p>
            )}
            <div className="mt-2">
              <Button small kind="ghost" onClick={() => nav.open({ type: 'seed', speciesId: s.id })}>
                + {tt('seeds.add')}
              </Button>
            </div>
          </section>
        )}
        <p className="text-[11px] leading-snug" style={{ color: INK500 }}>
          {tt('catalog.note')}
        </p>
        <Button kind="primary" onClick={() => nav.open({ type: 'addPlant', speciesId: s.id })}>
          + {tt('sp.plantIt')}
        </Button>
      </div>
    </Sheet>
  );
}

