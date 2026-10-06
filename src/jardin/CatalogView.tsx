import { useMemo, useState } from 'react';
import { SPECIES, SPECIES_BY_ID } from './data/species';
import { CROP_TYPES, type CropType, type Family, type MonthRange } from './model';
import { cropCalendar, inWindow, isPlanted, shiftWindows } from './engine/crop';
import { monthName } from './format';
import { useJT, type JKey } from './i18n';
import { useNav } from './nav';
import { useGarden } from './store';
import { Button, Card, Chip, Empty, INK500, INK700, Notice, Sheet } from './ui';
import { companionsOf, SPECIES_EXTRA } from './data/speciesExtra';
import { speciesWithType, typesOf } from './data/speciesTypes';
import { COLOR_HEX, FLOWER_COLORS, FLOWER_INFO, isFlower, type FlowerColor } from './data/flowers';
import { ORCHARD_MONTHS } from './data/orchard';
import { COVER_INFO } from './data/covers';
import { FLOWER_VARIETIES } from './data/flowerVarieties';
import { uid } from './model';
import { seedState } from './engine/season';
import { SeedsPanel } from './Seeds';
import { FloreView } from './Flore';
import { GnisSection } from './Gnis';
import { StocksView } from './Stocks';
import { PhotoStrip, SpeciesHero, SpeciesIcon, useCachedSpecies } from './Photos';

export function CatalogView() {
  const { tt } = useJT();
  const [mode, setMode] = useState<'species' | 'flore' | 'seeds' | 'stocks'>('species');
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={mode === 'species'} onClick={() => setMode('species')}>
          📖 {tt('catalog.modeSpecies')}
        </Chip>
        <Chip active={mode === 'flore'} onClick={() => setMode('flore')}>
          🌿 {tt('catalog.modeFlore')}
        </Chip>
        <Chip active={mode === 'seeds'} onClick={() => setMode('seeds')}>
          🌰 {tt('catalog.modeSeeds')}
        </Chip>
        <Chip active={mode === 'stocks'} onClick={() => setMode('stocks')}>
          📦 {tt('catalog.modeStocks')}
        </Chip>
      </div>
      {mode === 'species' && <SpeciesList />}
      {mode === 'flore' && <FloreView />}
      {mode === 'seeds' && (
        <Card title={tt('seeds.title')}>
          <SeedsPanel />
        </Card>
      )}
      {mode === 'stocks' && <StocksView />}
    </>
  );
}

type FlowerGroup = 'annual' | 'biennial' | 'perennial' | 'bulb';
const FLOWER_GROUPS: FlowerGroup[] = ['annual', 'biennial', 'perennial', 'bulb'];
function flowerGroup(life: 'annual' | 'biennial' | 'perennial', bulb?: boolean): FlowerGroup {
  return bulb ? 'bulb' : life;
}

/** Variétés courantes du commerce d'une fleur : couleur, groupe, floraison ; à garder dans « mes variétés » ou à planter. */
function VarietyList({ speciesId }: { speciesId: string }) {
  const store = useGarden();
  const { tt, lang } = useJT();
  const nav = useNav();
  const [color, setColor] = useState<FlowerColor | 'all'>('all');
  const all = FLOWER_VARIETIES[speciesId] ?? [];
  const colors = FLOWER_COLORS.filter((c) => all.some((v) => v.colors.includes(c)));
  const list = all.filter((v) => color === 'all' || v.colors.includes(color));
  const mine = new Set(store.data.varieties.filter((v) => v.speciesId === speciesId).map((v) => v.name.toLowerCase()));
  return (
    <section>
      <h3 className="mb-1 font-display text-base">{tt('fvar.title', { n: all.length })}</h3>
      {colors.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Chip active={color === 'all'} onClick={() => setColor('all')}>
            {tt('flowerGroup.anyColor')}
          </Chip>
          {colors.map((c) => (
            <Chip key={c} active={color === c} onClick={() => setColor(c)}>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: COLOR_HEX[c], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />
              {tt(`color.${c}` as JKey)}
            </Chip>
          ))}
        </div>
      )}
      <ul className="space-y-1.5">
        {list.map((v) => {
          const kept = mine.has(v.name.toLowerCase());
          return (
            <li key={v.name} className="rounded px-2.5 py-2" style={{ background: 'var(--color-paper-200)' }}>
              <div className="flex items-center gap-2">
                <span className="flex shrink-0 gap-0.5">
                  {v.colors.map((c) => (
                    <span key={c} className="inline-block h-3 w-3 rounded-full" style={{ background: COLOR_HEX[c], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />
                  ))}
                </span>
                <p className="min-w-0 flex-1 text-sm font-medium">{v.name}</p>
              </div>
              <p className="mt-0.5 text-xs leading-snug" style={{ color: INK700 }}>
                {v.note[lang]}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Button small kind="ghost" onClick={() => nav.open({ type: 'addPlant', speciesId, varietyName: v.name })}>
                  + {tt('fvar.plant')}
                </Button>
                <Button
                  small
                  kind="ghost"
                  disabled={kept}
                  onClick={() => {
                    store.saveVarieties([...store.data.varieties, { id: uid('var'), speciesId, name: v.name, origin: 'catalogue', note: v.note[lang] }]);
                    nav.toast(tt('fvar.kept', { name: v.name }));
                  }}
                >
                  {kept ? `✓ ${tt('fvar.inMine')}` : `☆ ${tt('fvar.keep')}`}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: INK500 }}>
        {tt('fvar.note')}
      </p>
    </section>
  );
}

type BloomSeason = 'spring' | 'summer' | 'autumn' | 'winter';
const BLOOM_SEASONS: Array<{ id: BloomSeason; icon: string; months: number[] }> = [
  { id: 'spring', icon: '🌷', months: [3, 4, 5] },
  { id: 'summer', icon: '☀', months: [6, 7, 8] },
  { id: 'autumn', icon: '🍂', months: [9, 10, 11] },
  { id: 'winter', icon: '❄', months: [12, 1, 2] },
];
const bloomsIn = (bloom: MonthRange[], season: BloomSeason) => BLOOM_SEASONS.find((x) => x.id === season)!.months.some((m) => inWindow(m, bloom));

function SpeciesList() {
  const { tt, lang } = useJT();
  const nav = useNav();
  const [q, setQ] = useState('');
  const [type, setType] = useState<CropType | 'all'>('all');
  const [group, setGroup] = useState<FlowerGroup | 'all'>('all');
  const [color, setColor] = useState<FlowerColor | 'all'>('all');
  const [inBloom, setInBloom] = useState(false);
  const [season, setSeason] = useState<BloomSeason | 'all'>('all');
  const month = new Date().getMonth() + 1;
  const flowers = type === 'flower';
  const pics = useCachedSpecies();
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return SPECIES.filter((s) => {
      if (type !== 'all' && s.type !== type) return false;
      if (ql && !s.name[lang].toLowerCase().includes(ql) && !s.latin.toLowerCase().includes(ql)) return false;
      if (!flowers) return true;
      const fl = FLOWER_INFO[s.id];
      if (!fl) return false;
      if (group !== 'all' && flowerGroup(s.life, fl.bulb) !== group) return false;
      if (color !== 'all' && !fl.colors.includes(color)) return false;
      if (season !== 'all' && !bloomsIn(fl.bloom, season)) return false;
      if (inBloom && !fl.bloom.some(([a, b]) => (a <= b ? month >= a && month <= b : month >= a || month <= b))) return false;
      return true;
    }).sort((a, b) => a.name[lang].localeCompare(b.name[lang]));
  }, [q, type, lang, flowers, group, color, inBloom, month, season]);
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
      {flowers && (
        <div className="mt-2 space-y-1.5 rounded p-2" style={{ background: 'var(--color-paper-200)' }}>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...FLOWER_GROUPS] as Array<FlowerGroup | 'all'>).map((g) => (
              <Chip key={g} active={group === g} onClick={() => setGroup(g)}>
                {tt(`flowerGroup.${g}` as JKey)}
              </Chip>
            ))}
            <Chip active={inBloom} onClick={() => setInBloom((v) => !v)}>
              🌸 {tt('flowerGroup.inBloom')}
            </Chip>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={season === 'all'} onClick={() => setSeason('all')}>
              {tt('flowerGroup.anySeason')}
            </Chip>
            {BLOOM_SEASONS.map((x) => (
              <Chip key={x.id} active={season === x.id} onClick={() => setSeason(x.id)}>
                {x.icon} {tt(`bloomSeason.${x.id}` as JKey)}
              </Chip>
            ))}
          </div>
          {group === 'bulb' && (
            <p className="text-[11px] leading-snug" style={{ color: INK700 }}>
              {tt('flowerGroup.bulbHint')}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <Chip active={color === 'all'} onClick={() => setColor('all')}>
              {tt('flowerGroup.anyColor')}
            </Chip>
            {FLOWER_COLORS.map((c) => (
              <Chip key={c} active={color === c} onClick={() => setColor(c)}>
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: COLOR_HEX[c], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />
                {tt(`color.${c}` as JKey)}
              </Chip>
            ))}
          </div>
          <p className="text-[11px]" style={{ color: INK500 }}>
            {tt('flowerGroup.count', { n: list.length })}
          </p>
        </div>
      )}
      <div className="mt-3">
        {list.length === 0 ? (
          <Empty>{tt('catalog.none')}</Empty>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => nav.open({ type: 'species', id: s.id })} className="flex h-full w-full items-center gap-2 rounded px-2.5 py-2 text-left" style={{ background: 'var(--color-paper-200)' }}>
                  <SpeciesIcon species={s} have={pics.has(s.id)} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{s.name[lang]}</span>
                    <span className="flex items-center gap-1 truncate text-[11px]" style={{ color: INK500 }}>
                      {isFlower(s) && FLOWER_INFO[s.id]
                        ? FLOWER_INFO[s.id].colors.slice(0, 4).map((c) => <span key={c} className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR_HEX[c], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />)
                        : null}
                      <span className="truncate">{tt(`family.${s.family}` as JKey)}</span>
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
  const store = useGarden();
  const { data, today } = store;
  const { tt, lang } = useJT();
  const nav = useNav();
  const s = SPECIES_BY_ID[id];
  const extra = SPECIES_EXTRA[id];
  const comps = companionsOf(id);
  const lots = data.seeds.filter((l) => l.speciesId === id);
  if (!s) return null;
  const cal = cropCalendar(s, data.settings.climate);
  const varieties = data.varieties.filter((v) => v.speciesId === s.id);
  const fl = isFlower(s) ? FLOWER_INFO[s.id] : undefined;
  const cv = COVER_INFO[s.id];
  const rows: Array<[string, string]> = [
    [tt('sp.family'), tt(`family.${s.family as Family}` as JKey)],
    [tt('sp.type'), `${tt(`type.${s.type}` as JKey)} · ${tt(`life.${s.life}` as JKey)}`],
    [tt('sp.sun'), tt(`sun.${s.sun}` as JKey)],
    [tt('sp.frost'), tt(`frost.${s.frost}` as JKey)],
    [tt('sp.temp'), tt('sp.tempV', { lo: s.tOpt[0], hi: s.tOpt[1], base: s.tBase })],
    [tt('sp.pH'), `${s.pH[0]} – ${s.pH[1]}`],
    [tt('sp.spacing'), tt('add.spacing', { row: s.spacing.row, inRow: s.spacing.inRow })],
    ...(fl
      ? ([
          [tt('sp.height'), tt('sp.heightV', { lo: fl.height[0], hi: fl.height[1] })],
          [tt('sp.bloomDays'), tt(isPlanted(s) ? 'sp.bloomDaysPlanted' : 'sp.bloomDaysSown', { lo: s.daysToHarvest[0], hi: s.daysToHarvest[1] })],
        ] as Array<[string, string]>)
      : cv && s.type === 'cover'
        ? ([
            [tt('cover.destroyAfter'), tt('cover.destroyDays', { lo: s.daysToHarvest[0], hi: s.daysToHarvest[1] })],
            [tt('cover.biomass'), tt('sp.yieldV', { lo: s.yieldM2[0], hi: s.yieldM2[1] })],
          ] as Array<[string, string]>)
        : ([
          [tt('sp.harvest'), ORCHARD_MONTHS[s.id] ? tt('sp.harvestOrchard', { years: Math.max(1, Math.round(s.daysToHarvest[0] / 365)), from: monthName(ORCHARD_MONTHS[s.id][0], lang, 'long'), to: monthName(ORCHARD_MONTHS[s.id][1], lang, 'long') }) : tt(isPlanted(s) ? 'types.harvestPlanted' : 'types.harvestSown', { lo: s.daysToHarvest[0], hi: s.daysToHarvest[1] })],
          [tt('sp.yield'), tt('sp.yieldV', { lo: s.yieldM2[0], hi: s.yieldM2[1] })],
          [tt('sp.exports'), tt('sp.exportsV', { n: s.exports.N, p: s.exports.P2O5, k: s.exports.K2O })],
        ] as Array<[string, string]>)),
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
        <SpeciesHero species={s} />
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
              ...(fl ? [{ label: tt('cal.bloom'), ranges: shiftWindows(fl.bloom, data.settings.climate), color: '#c8547e' }] : []),
              ...(ORCHARD_MONTHS[s.id] ? [{ label: tt('cal.harvest'), ranges: shiftWindows([ORCHARD_MONTHS[s.id]], data.settings.climate), color: '#c0612e' }] : []),
            ]}
          />
        </section>
        {cv && (
          <section className="space-y-1.5 rounded px-3 py-2 text-sm" style={{ background: '#e6efdc', color: '#2f4a22' }}>
            <p className="font-medium">🌾 {tt('cover.title')}</p>
            <p>{tt(cv.fixes ? 'cover.fixes' : 'cover.recycles', { n: cv.nReturn })}</p>
            <p>✂ {cv.destroy[lang]}</p>
            {cv.frostKilled && <p>❄ {tt('cover.frostKilled')}</p>}
            {cv.caution && <p>⚠ {cv.caution[lang]}</p>}
          </section>
        )}
        {fl && (
          <section className="space-y-2">
            {fl.toxic && <Notice tone="warn">☠ {fl.toxic[lang]}</Notice>}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {fl.colors.map((c) => (
                <span key={c} className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: 'var(--color-paper-200)' }}>
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLOR_HEX[c], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />
                  {tt(`color.${c}` as JKey)}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {fl.uses.map((u) => (
                <span key={u} className="rounded-full px-2 py-0.5" style={{ background: '#e6efdc', color: '#2f4a22' }} title={tt(`use.${u}.hint` as JKey)}>
                  {tt(`use.${u}` as JKey)}
                </span>
              ))}
            </div>
            {(fl.deadhead || fl.lift) && (
              <p className="text-xs leading-relaxed" style={{ color: INK700 }}>
                {fl.deadhead && `✂ ${tt('flower.deadhead')} `}
                {fl.lift && `❄ ${tt('flower.lift')}`}
              </p>
            )}
          </section>
        )}
        {FLOWER_VARIETIES[s.id] && <VarietyList speciesId={s.id} />}
        <GnisSection speciesId={s.id} />
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
            <p className="mb-2 text-xs" style={{ color: INK700 }}>
              {tt('photo.varietyHint')}
            </p>
            <ul className="space-y-3 text-sm">
              {varieties.map((v) => (
                <li key={v.id} className="space-y-1.5">
                  <p>
                    {v.name} <span className="text-xs" style={{ color: INK500 }}>({v.origin.startsWith('lignee:') ? tt('sp.fromLignee') : tt('sp.mine')})</span>
                  </p>
                  <PhotoStrip
                    ids={v.photoIds ?? []}
                    onChange={(ids, _added, removed) => {
                      store.saveVarieties([{ ...v, photoIds: ids.length ? ids : undefined }]);
                      if (removed.length) store.removePhotos(removed);
                    }}
                  />
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
              {extra.pollination === 'vegetative'
                ? tt('seeds.vegetativeV')
                : tt('seeds.savingV', { poll: tt(`pollination.${extra.pollination}` as JKey), m: extra.isolation, life: extra.seedLife })}
            </p>
            {extra.trueToSeed && extra.pollination !== 'vegetative' && (
              <p className="mt-1 text-sm" style={{ color: INK700 }}>
                <b>{tt(`seeds.true.${extra.trueToSeed}` as JKey)}</b>
              </p>
            )}
            {extra.seedTip && (
              <p className="mt-1 text-sm leading-relaxed" style={{ color: INK700 }}>
                💡 {extra.seedTip[lang]}
              </p>
            )}
            {extra.f1Common && (
              <div className="mt-2">
                <Notice tone="warn">{tt('seeds.f1Warning')}</Notice>
              </div>
            )}
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

