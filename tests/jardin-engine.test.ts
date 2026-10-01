/**
 * Tests des moteurs de Lignée Jardin (catalogue, dates, stades, nutrition,
 * eau, tâches, rotation, sauvegarde). Lancement : npm test
 */
import { CLIMATES, CLIMATE_IDS, AWC_MM_PER_CM } from '../src/jardin/data/climate';
import { PRODUCTS, PRODUCT_BY_ID } from '../src/jardin/data/products';
import { SPECIES, SPECIES_BY_ID } from '../src/jardin/data/species';
import { DEFAULT_SETTINGS, EMPTY_DATA, type Bed, type GardenData, type Plant } from '../src/jardin/model';
import { addDays, dayOfYear, diffDays, weekKey } from '../src/jardin/engine/dates';
import { cropCalendar, inWindow, kcAt, plantArea, shiftWindows, stageInfo } from '../src/jardin/engine/crop';
import { bestProduct, doseFor, nutrientStatus, seasonNeed, shareOf, NUTRIENTS, allowedProducts } from '../src/jardin/engine/nutrition';
import { simulateBed, waterAdvice } from '../src/jardin/engine/water';
import { generateTasks } from '../src/jardin/engine/tasks';
import { rotationWarning } from '../src/jardin/engine/rotation';
import { ALERT, suggestClimate, mergeWeather, needsRefresh, normalDay, parseOpenMeteo, recentContext, weatherAlerts, weatherURL } from '../src/jardin/engine/weather';
import { eqAge, referenceStart, speciesFactor, timeline } from '../src/jardin/engine/phenology';
import { bedSun, exposureOf, inShadow, shadowPolygon, sunPosition, sunMismatch } from '../src/jardin/engine/sun';
import { diagnose } from '../src/jardin/engine/diagnosis';
import { germRate, seasonSummary, seedState, seedsFor } from '../src/jardin/engine/season';
import { PROBLEMS, REMEDY_BY_ID } from '../src/jardin/data/problems';
import { SPECIES_EXTRA, COMPANIONS } from '../src/jardin/data/speciesExtra';
import type { WeatherCache, WeatherDay } from '../src/jardin/model';
import { demoGarden, parseBackup, parseLigneeVarieties, serializeBackup, toCSV } from '../src/jardin/engine/backup';

let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n     ${(e as Error).message}`);
  }
}
function ok(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

const bed = (over: Partial<Bed> = {}): Bed => ({ id: 'b1', name: 'B1', kind: 'bed', x: 0, y: 0, w: 4, h: 1, mulch: false, drip: false, createdAt: '2026-01-01', ...over });
const plant = (over: Partial<Plant>): Plant => ({
  id: 'p1', speciesId: 'tomato', bedId: 'b1', count: 6, indoor: false, status: 'growing', sowDate: '2026-03-01', createdAt: '2026-03-01', ...over,
});
const data = (over: Partial<GardenData>): GardenData => ({ ...EMPTY_DATA, settings: { ...DEFAULT_SETTINGS, onboarded: true }, ...over });

// --- Catalogue ------------------------------------------------------------

test('catalogue : 42 espèces, identifiants uniques', () => {
  ok(SPECIES.length === 42, `${SPECIES.length} espèces`);
  ok(new Set(SPECIES.map((s) => s.id)).size === SPECIES.length, 'doublon');
});

test('catalogue : valeurs cohérentes', () => {
  for (const s of SPECIES) {
    ok(s.stages[0][1] === 0, `${s.id} : premier stade non nul`);
    for (let i = 1; i < s.stages.length; i++) ok(s.stages[i][1] > s.stages[i - 1][1], `${s.id} : stades non triés`);
    ok(s.daysToHarvest[0] <= s.daysToHarvest[1] && s.daysToHarvest[1] <= s.season, `${s.id} : récolte hors saison`);
    ok(s.kc.every((k) => k >= 0.2 && k <= 1.3), `${s.id} : Kc`);
    ok(s.yieldM2[0] < s.yieldM2[1], `${s.id} : rendement`);
    ok(s.pH[0] < s.pH[1] && s.pH[0] >= 5 && s.pH[1] <= 8, `${s.id} : pH`);
    ok(s.rootDepth >= 0.15 && s.rootDepth <= 1, `${s.id} : racines`);
    ok(s.sowIndoor || s.sowOutdoor || s.plantOut, `${s.id} : aucun calendrier`);
    for (const r of [...(s.sowIndoor ?? []), ...(s.sowOutdoor ?? []), ...(s.plantOut ?? [])]) ok(r.every((m) => m >= 1 && m <= 12), `${s.id} : mois`);
    ok(s.exports.N > 0 && s.exports.K2O > 0, `${s.id} : exportations`);
    ok(s.note.fr && s.note.en, `${s.id} : note`);
  }
});

test('produits : teneurs plausibles', () => {
  for (const p of PRODUCTS) {
    ok(p.N <= 50 && p.P2O5 <= 60 && p.K2O <= 60, p.id);
    ok(p.nAvail >= 0 && p.nAvail <= 1, p.id);
  }
  ok(PRODUCT_BY_ID.horn.N === 13, 'corne');
});

test('climats : 12 mois, gelées ordonnées', () => {
  for (const id of CLIMATE_IDS) {
    const c = CLIMATES[id];
    ok(c.et0.length === 12 && c.rain.length === 12, id);
    ok(c.lastFrost < c.firstFrost, id);
    ok(Math.max(...c.et0) === c.et0[6] || Math.max(...c.et0) === c.et0[5], `${id} : pic d'ET₀ en été`);
  }
  ok(AWC_MM_PER_CM.siltLoam > AWC_MM_PER_CM.sand, 'réserve utile');
});

// --- Dates ----------------------------------------------------------------

test('dates : ajout, écarts, années bissextiles, semaines', () => {
  ok(addDays('2028-02-28', 1) === '2028-02-29', 'bissextile');
  ok(addDays('2026-12-31', 1) === '2027-01-01', 'nouvel an');
  ok(diffDays('2026-03-01', '2026-05-10') === 70, 'écart');
  ok(dayOfYear('2026-04-15') === 105, 'jour de l’année');
  ok(weekKey('2026-10-01') === '2026-09-28', 'lundi');
});

// --- Calendrier et stades ------------------------------------------------------

test('calendrier : décalé selon le climat', () => {
  const tomato = SPECIES_BY_ID.tomato;
  ok(JSON.stringify(shiftWindows(tomato.plantOut, 'parisian')) === '[[5,6]]', 'référence');
  ok(JSON.stringify(cropCalendar(tomato, 'mediterranean').plantOut) === '[[4,5]]', `méditerranée ${JSON.stringify(cropCalendar(tomato, 'mediterranean').plantOut)}`);
  ok(JSON.stringify(cropCalendar(tomato, 'mountain').plantOut) === '[[6,7]]', 'montagne');
  ok(inWindow(12, [[10, 3]]) && inWindow(2, [[10, 3]]) && !inWindow(6, [[10, 3]]), 'fenêtre à cheval sur l’année');
});

test('stades : tomate semée le 1er mars', () => {
  const p = plant({});
  ok(stageInfo(p, '2026-03-05').stage === 'germination', 'germination');
  ok(stageInfo(p, '2026-04-15').stage === 'vegetative', 'végétatif');
  ok(stageInfo(p, '2026-05-10').stage === 'flowering', 'floraison');
  ok(stageInfo(p, '2026-07-01').stage === 'fruiting', 'fructification');
  ok(stageInfo({ ...p, status: 'planned' }, '2026-07-01').stage === 'planned', 'prévue');
  const info = stageInfo(p, '2026-07-01');
  ok(info.harvestFrom === addDays('2026-03-01', 110), 'début de récolte');
  const early = stageInfo(p, '2026-07-01', { daysToHarvest: 88 });
  ok(early.harvestFrom === addDays('2026-03-01', 88), 'variété précoce');
});

test('Kc : début, plein développement, fin', () => {
  const t = SPECIES_BY_ID.tomato;
  ok(near(kcAt(t, 0), 0.6), 'initial');
  ok(near(kcAt(t, 100), 1.15), 'plein développement');
  ok(near(kcAt(t, t.season + 5), 0.8), 'fin');
  ok(kcAt(t, 35) > 0.6 && kcAt(t, 35) < 1.15, 'montée');
});

test('surface : nombre de pieds × espacement', () => {
  ok(near(plantArea(plant({ count: 6 })), 2.4), 'tomates');
  ok(near(plantArea(plant({ area: 3 })), 3), 'surface saisie');
});

// --- Nutrition --------------------------------------------------------------

test('nutrition : besoins de la saison', () => {
  const p = plant({});
  const { need, yieldKg } = seasonNeed(p);
  ok(near(yieldKg, 2.4 * 5.5), `rendement ${yieldKg}`);
  ok(near(need.N, 2.8 * yieldKg) && near(need.K2O, 4.5 * yieldKg), 'exportations');
  const bean = seasonNeed(plant({ speciesId: 'bean', count: 40 }));
  ok(bean.legume && bean.need.N < SPECIES_BY_ID.bean.exports.N * bean.yieldKg * 0.2, 'légumineuse');
});

test('nutrition : la répartition par stade retombe sur le total', () => {
  for (const s of SPECIES) {
    const st = nutrientStatus(plant({ speciesId: s.id, count: 10 }), data({}), '2026-06-01');
    for (const n of NUTRIENTS) {
      const sum = st.byStage.reduce((a, b) => a + b.need[n], 0);
      ok(near(sum, st.need[n], 1e-6), `${s.id} ${n}`);
    }
  }
});

test('nutrition : la potasse arrive surtout en fructification', () => {
  const st = nutrientStatus(plant({}), data({}), '2026-06-01');
  const fr = st.byStage.find((s) => s.stage === 'fruiting')!;
  ok(fr.need.K2O / st.need.K2O > 0.5, 'K');
  ok(fr.need.N / st.need.N < 0.5, 'N');
});

test('nutrition : dose d’un produit (azote disponible)', () => {
  const d = doseFor(PRODUCT_BY_ID.horn, { N: 10, P2O5: 0, K2O: 0 }, 2)!;
  ok(near(d.amount, 10 / (0.13 * 0.5), 1e-6), `corne ${d.amount}`);
  ok(near(d.perM2, d.amount / 2), 'par m²');
  const k = doseFor(PRODUCT_BY_ID.potSulphate, { N: 0, P2O5: 0, K2O: 25 }, 1)!;
  ok(near(k.amount, 50) && k.drivenBy === 'K2O', 'potasse');
  ok(doseFor(PRODUCT_BY_ID.potSulphate, { N: 5, P2O5: 0, K2O: 0 }, 1) === null, 'produit inutile');
  const guano = doseFor(PRODUCT_BY_ID.guano, { N: 10, P2O5: 1, K2O: 1 }, 1)!;
  ok(guano.overshoot.includes('P2O5'), 'excès de phosphore signalé');
});

test('nutrition : un apport sur la planche est partagé au prorata des surfaces', () => {
  const a = plant({ id: 'a', count: 6 });
  const b = plant({ id: 'b', speciesId: 'lettuce', count: 10 });
  const app = { id: 'x', bedId: 'b1', productId: 'organicNPK', amount: 1000, date: '2026-04-01' };
  const sa = shareOf(app, a, [a, b]);
  const sb = shareOf(app, b, [a, b]);
  ok(near(sa + sb, 1), 'somme');
  ok(near(sa / sb, plantArea(a) / plantArea(b)), 'prorata');
  ok(shareOf({ ...app, plantId: 'a' }, b, [a, b]) === 0, 'apport ciblé');
});

test('nutrition : les apports réduisent ce qui est dû', () => {
  const p = plant({});
  const before = nutrientStatus(p, data({ plants: [p] }), '2026-05-10');
  const after = nutrientStatus(p, data({ plants: [p], applications: [{ id: 'x', bedId: 'b1', productId: 'blood', amount: 100, date: '2026-04-20' }] }), '2026-05-10');
  ok(near(after.applied.N, 100 * 0.12 * 0.8), `apporté ${after.applied.N}`);
  ok(after.dueNow.N < before.dueNow.N, 'dû');
  const big = nutrientStatus(p, data({ plants: [p], applications: [{ id: 'x', bedId: 'b1', productId: 'guano', amount: 5000, date: '2026-04-20' }] }), '2026-05-10');
  ok(big.excess.includes('P2O5'), 'excès');
});

test('nutrition : produit conseillé', () => {
  const inSeason = bestProduct(PRODUCTS, { N: 20, P2O5: 0, K2O: 30 }, 2, true)!;
  ok(inSeason.nAvail >= 0.5 && inSeason.id !== 'horn', `en saison : ${inSeason.id}`);
  const kOnly = bestProduct(PRODUCTS, { N: 0, P2O5: 0, K2O: 30 }, 2, true)!;
  ok(kOnly.N === 0, `potasse seule : ${kOnly.id}`);
});

test('nutrition : produits bio seulement en pratique bio', () => {
  ok(allowedProducts(PRODUCTS, { practices: ['organic'] }).every((p) => p.organicOK), 'bio');
  ok(allowedProducts(PRODUCTS, { practices: ['conventional'] }).length === PRODUCTS.length, 'conventionnel');
});

// --- Eau ------------------------------------------------------------------------

test('eau : planche nue, pas de conseil d’arrosage', () => {
  const adv = waterAdvice(bed(), data({ settings: { ...DEFAULT_SETTINGS, rainSource: 'manual' } }), '2026-07-15');
  ok(!adv.water && !adv.hasPlants, 'nue');
});

test('eau : la réserve baisse en été sans pluie et l’arrosage la remonte', () => {
  const p = plant({ speciesId: 'lettuce', count: 12, sowDate: '2026-06-01' });
  const d = data({ plants: [p], settings: { ...DEFAULT_SETTINGS, rainSource: 'manual' } });
  const adv = waterAdvice(bed(), d, '2026-07-10');
  ok(adv.water && adv.liters > 0, `ratio ${adv.ratio.toFixed(2)}`);
  ok(adv.liters <= 20 * 4 + 1e-6, `au plus 20 L/m² : ${adv.liters}`);
  const d2 = { ...d, water: [{ id: 'w', kind: 'irrigation' as const, amount: (adv.ru * 0.9 - adv.reserve) * 4, bedId: 'b1', date: '2026-07-10' }] };
  const adv2 = waterAdvice(bed(), d2, '2026-07-10');
  ok(!adv2.water && adv2.ratio > 0.8, `après arrosage ${adv2.ratio.toFixed(2)}`);
});

test('eau : le paillage réduit la consommation, la serre ignore la pluie', () => {
  const p = plant({ speciesId: 'lettuce', count: 12, sowDate: '2026-06-01' });
  const d = data({ plants: [p], settings: { ...DEFAULT_SETTINGS, rainSource: 'manual' } });
  const bare = simulateBed(bed(), d, '2026-06-01', '2026-06-30');
  const mulched = simulateBed(bed({ mulch: true }), d, '2026-06-01', '2026-06-30');
  ok(mulched[9].reserve > bare[9].reserve && mulched[9].etc < bare[9].etc, 'paillage');
  const rainy = { ...d, water: [{ id: 'r', kind: 'rain' as const, amount: 30, date: '2026-06-15' }] };
  const outside = simulateBed(bed(), rainy, '2026-06-01', '2026-06-30');
  const inside = simulateBed(bed({ kind: 'greenhouse' }), rainy, '2026-06-01', '2026-06-30');
  ok(outside[14].rain > 0 && inside[14].rain === 0, 'serre');
});

test('eau : pluie moyenne du climat les jours sans relevé', () => {
  const p = plant({ speciesId: 'lettuce', count: 12, sowDate: '2026-06-01' });
  const avg = simulateBed(bed(), data({ plants: [p] }), '2026-06-01', '2026-06-10');
  ok(avg.every((x) => x.rain > 0), 'moyenne');
});

// --- Tâches ------------------------------------------------------------------

test('tâches : semis prévu, fait, reporté', () => {
  const p = plant({ status: 'planned', sowDate: '2026-04-02' });
  const d = data({ beds: [bed()], plants: [p] });
  ok(generateTasks(d, '2026-04-01').some((t) => t.kind === 'sow'), 'semis');
  ok(!generateTasks({ ...d, taskStates: [{ key: 'sow:p1', done: '2026-04-01' }] }, '2026-04-01').some((t) => t.kind === 'sow'), 'fait');
  ok(!generateTasks({ ...d, taskStates: [{ key: 'sow:p1', snoozeUntil: '2026-04-03' }] }, '2026-04-01').some((t) => t.kind === 'sow'), 'reporté');
  ok(generateTasks({ ...d, taskStates: [{ key: 'sow:p1', snoozeUntil: '2026-04-03' }] }, '2026-04-03').some((t) => t.kind === 'sow'), 'revient');
});

test('tâches : repiquage, arrosage, gelées tardives', () => {
  const seedling = plant({ id: 's', indoor: true, sowDate: '2026-02-20' });
  const d = data({ beds: [bed()], plants: [seedling] });
  ok(generateTasks(d, '2026-04-12').some((t) => t.kind === 'transplant'), 'repiquage');
  const lettuce = plant({ id: 'l', speciesId: 'lettuce', count: 12, sowDate: '2026-06-01' });
  const dry = data({ beds: [bed()], plants: [lettuce], settings: { ...DEFAULT_SETTINGS, rainSource: 'manual' } });
  ok(generateTasks(dry, '2026-07-10').some((t) => t.kind === 'water'), 'arrosage');
  const tomato = plant({ id: 't', sowDate: '2026-04-01' });
  ok(generateTasks(data({ beds: [bed()], plants: [tomato] }), '2026-04-14').some((t) => t.kind === 'frost'), 'gelée');
  ok(!generateTasks(data({ beds: [bed({ kind: 'greenhouse' })], plants: [tomato] }), '2026-04-14').some((t) => t.kind === 'frost'), 'pas en serre');
});

test('tâches : fertilisation proposée puis espacée', () => {
  // Tomate semée à l'abri le 1er mars, repiquée le 25 avril : en juin, elle a besoin d'azote.
  const p = plant({ sowDate: '2026-03-01', indoor: true, transplantDate: '2026-04-25' });
  const d = data({ beds: [bed()], plants: [p] });
  ok(generateTasks(d, '2026-06-10').some((t) => t.kind === 'feed'), 'proposée');
  const fed = { ...d, applications: [{ id: 'a', bedId: 'b1', productId: 'blood', amount: 30, date: '2026-06-05' }] };
  ok(!generateTasks(fed, '2026-06-10').some((t) => t.kind === 'feed'), 'espacée');
});

test('tâches : jardin d’exemple sans erreur', () => {
  const today = '2026-07-01';
  const d = demoGarden(today);
  const tasks = generateTasks(d, today);
  ok(tasks.length > 0, 'des tâches');
  ok(tasks.every((t) => t.key && t.kind), 'clés');
});

// --- Rotation ------------------------------------------------------------

test('rotation : solanacées trop tôt sur la même planche', () => {
  const potato = plant({ id: 'old', speciesId: 'potato', sowDate: '2025-04-01', endDate: '2025-08-01', status: 'ended' });
  const w = rotationWarning('b1', SPECIES_BY_ID.tomato, [potato], '2026-05-01');
  ok(w && w.wanted === 3 && w.years < 1, 'alerte');
  ok(rotationWarning('b1', SPECIES_BY_ID.lettuce, [potato], '2026-05-01') === null, 'autre famille');
  ok(rotationWarning('b1', SPECIES_BY_ID.tomato, [{ ...potato, endDate: '2021-08-01', sowDate: '2021-04-01' }], '2026-05-01') === null, 'assez ancien');
});

// --- Sauvegarde --------------------------------------------------------------

test('sauvegarde : aller-retour et rejet des fichiers étrangers', () => {
  const d = demoGarden('2026-07-01');
  const raw = serializeBackup(d, [{ meta: { id: 'ph', date: '2026-07-01', width: 10, height: 10 }, full: 'data:image/webp;base64,AA', thumb: 'data:image/webp;base64,AA' }]);
  const back = parseBackup(raw);
  ok(back.data.plants.length === d.plants.length && back.photos.length === 1, 'aller-retour');
  let threw = false;
  try {
    parseBackup(JSON.stringify({ app: 'autre', data: {} }));
  } catch {
    threw = true;
  }
  ok(threw, 'rejet');
  const bad = parseBackup(JSON.stringify({ app: 'lignee-jardin', data: { plants: [{ id: 'x', speciesId: 'licorne', sowDate: '2026-01-01' }] } }));
  ok(bad.data.plants.length === 0, 'espèce inconnue écartée');
});

test('import Lignée : carotte → catalogue', () => {
  const raw = JSON.stringify({ app: 'lignee', crop: 'carotte', kind: 'varieties', version: 1, varieties: [{ id: 'my-1', name: 'Violette fixée', days: 95, variants: [] }] });
  const v = parseLigneeVarieties(raw);
  ok(v.length === 1 && v[0].speciesId === 'carrot' && v[0].daysToHarvest === 95 && v[0].origin === 'lignee:carotte', 'carotte');
  const tom = parseLigneeVarieties(JSON.stringify({ app: 'lignee', species: 'tomato', kind: 'varieties', varieties: [{ name: 'X' }] }));
  ok(tom[0].speciesId === 'tomato', 'tomate');
});

test('CSV : séparateur point-virgule et échappement', () => {
  const s = toCSV([['a', 'b;c'], [1, 'say "hi"']]);
  ok(s.includes('"b;c"') && s.includes('"say ""hi"""'), s);
});

// --- Phase 2 : météo ------------------------------------------------------------

const wday = (date: string, o: Partial<WeatherDay> = {}): WeatherDay => ({ date, tmax: 20, tmin: 10, rain: 0, et0: 3, wind: 10, gust: 20, ...o });
function cacheFrom(days: WeatherDay[]): WeatherCache {
  return { lat: 48.85, lon: 2.35, fetchedAt: '2026-07-10T08:00:00Z', days };
}
function series(from: string, n: number, f: (i: number, date: string) => Partial<WeatherDay>): WeatherDay[] {
  return Array.from({ length: n }, (_, i) => { const d = addDays(from, i); return wday(d, f(i, d)); });
}

test('météo : URL arrondie, lecture Open-Meteo, jours incomplets écartés', () => {
  const url = weatherURL(48.856613, 2.352222);
  ok(url.includes('latitude=48.86') && url.includes('longitude=2.35') && url.includes('past_days=92') && url.includes('et0_fao_evapotranspiration'), url);
  const days = parseOpenMeteo({ daily: { time: ['2026-07-01', '2026-07-02'], temperature_2m_max: [25.1, null], temperature_2m_min: [14, 13], precipitation_sum: [2.5, 0], et0_fao_evapotranspiration: [4.2, 4], wind_speed_10m_max: [12, 10], wind_gusts_10m_max: [30, 25] } });
  ok(days.length === 1 && days[0].tmax === 25.1 && days[0].rain === 2.5 && days[0].et0 === 4.2, JSON.stringify(days));
  let threw = false;
  try { parseOpenMeteo({}); } catch { threw = true; }
  ok(threw, 'format');
});

test('météo : fusion du cache, prévision remplacée par la mesure, changement de lieu', () => {
  const a = mergeWeather(undefined, 48.85, 2.35, [wday('2026-07-01', { rain: 5 }), wday('2026-07-02', { rain: 9 })], '2026-07-01T06:00:00Z');
  const b = mergeWeather(a, 48.851, 2.352, [wday('2026-07-02', { rain: 1 }), wday('2026-07-03')], '2026-07-02T06:00:00Z');
  ok(b.days.length === 3 && b.days[1].rain === 1 && b.days[0].rain === 5, 'fusion');
  const c = mergeWeather(b, 43.3, 5.4, [wday('2026-07-03')], '2026-07-03T06:00:00Z');
  ok(c.days.length === 1, 'nouveau lieu');
  ok(!needsRefresh(b, 48.85, 2.35, new Date('2026-07-02T08:00:00Z')) && needsRefresh(b, 48.85, 2.35, new Date('2026-07-02T10:30:00Z')), 'rafraîchissement');
  ok(needsRefresh(b, 45, 2.35, new Date('2026-07-02T07:00:00Z')), 'autre lieu');
});

test('météo : normales continues d’un mois à l’autre', () => {
  const a = normalDay('parisian', '2026-01-31');
  const b = normalDay('parisian', '2026-02-01');
  ok(Math.abs(a.tmax - b.tmax) < 0.2 && Math.abs(a.et0 - b.et0) < 0.05, `${a.tmax} / ${b.tmax}`);
  ok(normalDay('parisian', '2026-07-15').tmax > normalDay('parisian', '2026-01-15').tmax + 10, 'été');
});

test('météo : alertes gel, canicule, vent, pluie (4 jours)', () => {
  const c = cacheFrom([wday('2026-04-10', { tmin: 1 }), wday('2026-04-11', { tmin: -2 }), wday('2026-04-12', { tmax: 36 }), wday('2026-04-13', { gust: 85, rain: 25 }), wday('2026-04-20', { tmin: -8 })]);
  const al = weatherAlerts(c, '2026-04-10');
  const frost = al.find((a) => a.kind === 'frost')!;
  ok(frost && frost.value === -2 && frost.severe && frost.date === '2026-04-11', 'gel, le plus fort');
  ok(al.some((a) => a.kind === 'heat' && a.severe) && al.some((a) => a.kind === 'wind' && a.severe) && al.some((a) => a.kind === 'rain' && !a.severe), 'autres');
  ok(!al.some((a) => a.value === -8), 'au-delà de 4 jours ignoré');
  ok(ALERT.frost > ALERT.frostSevere, 'seuils');
});

test('météo : climat suggéré par la position', () => {
  ok(suggestClimate(48.11, -1.68) === 'oceanic', 'Rennes');
  ok(suggestClimate(48.85, 2.35) === 'parisian', 'Paris');
  ok(suggestClimate(48.58, 7.75) === 'continental', 'Strasbourg');
  ok(suggestClimate(43.3, 5.37) === 'mediterranean', 'Marseille');
  ok(suggestClimate(45.9, 6.1, 1050) === 'mountain', 'altitude');
  ok(suggestClimate(44.84, -0.58) === 'oceanic', 'Bordeaux');
});

test('météo : contexte des 7 derniers jours', () => {
  const wet = recentContext(cacheFrom(series('2026-06-01', 7, () => ({ rain: 5 }))), '2026-06-07')!;
  ok(wet.humid && !wet.dry, 'humide');
  const hot = recentContext(cacheFrom(series('2026-07-01', 7, () => ({ tmax: 33, et0: 5 }))), '2026-07-07')!;
  ok(hot.hot && hot.dry, 'chaud et sec');
});

// --- Phase 2 : degrés-jours ------------------------------------------------------

test('degrés-jours : semis de référence et âge équivalent', () => {
  ok(referenceStart(SPECIES_BY_ID.tomato).date === '2026-03-16' && referenceStart(SPECIES_BY_ID.tomato).indoorDays === 50, 'tomate');
  ok(referenceStart(SPECIES_BY_ID.carrot).date === '2026-05-16', `carotte ${referenceStart(SPECIES_BY_ID.carrot).date}`);
  // Semée à la date de référence, sans météo, en région parisienne : âge équivalent ≈ âge réel.
  const p = plant({ speciesId: 'carrot', count: 50, sowDate: '2026-05-16' });
  const d = data({ beds: [bed()], plants: [p] });
  const eq = eqAge(p, d, '2026-07-15');
  ok(Math.abs(eq - 60) < 2, `âge équivalent ${eq}`);
});

test('degrés-jours : un printemps froid retarde, la serre avance', () => {
  const p = plant({ speciesId: 'zucchini', count: 3, sowDate: '2026-05-01' });
  const out = eqAge(p, data({ beds: [bed()], plants: [p] }), '2026-06-15');
  const gh = eqAge(p, data({ beds: [bed({ kind: 'greenhouse' })], plants: [p] }), '2026-06-15');
  ok(gh > out + 5, `serre ${gh} > dehors ${out}`);
  const mountain = eqAge(p, data({ beds: [bed()], plants: [p], settings: { ...DEFAULT_SETTINGS, climate: 'mountain' } }), '2026-06-15');
  ok(mountain < out, `montagne ${mountain} < ${out}`);
});

test('degrés-jours : la météo mesurée prime sur les normales', () => {
  const p = plant({ speciesId: 'bean', count: 40, sowDate: '2026-06-01' });
  const hot = cacheFrom(series('2026-06-01', 40, () => ({ tmax: 32, tmin: 20 })));
  const base = data({ beds: [bed()], plants: [p] });
  const withWx = { ...base, weather: hot, settings: { ...base.settings, weather: true } };
  const off = { ...base, weather: hot, settings: { ...base.settings, weather: false } };
  ok(eqAge(p, withWx, '2026-07-05') > eqAge(p, base, '2026-07-05') + 5, 'été chaud');
  ok(Math.abs(eqAge(p, off, '2026-07-05') - eqAge(p, base, '2026-07-05')) < 1e-9, 'météo désactivée');
  const tl = timeline(p, withWx, '2026-07-05');
  ok(tl.harvestFrom < timeline(p, base, '2026-07-05').harvestFrom, 'récolte avancée');
});

test('degrés-jours : recalage par les stades observés', () => {
  const p = plant({ id: 'c1', speciesId: 'zucchini', count: 3, sowDate: '2026-05-01' });
  const d = data({ beds: [bed()], plants: [p] });
  const predicted = timeline(p, d, '2026-06-01').starts.find((s) => s.stage === 'flowering')!.date;
  const early = addDays(predicted, -10);
  const d2 = { ...d, phenoEvents: [{ id: 'e', plantId: 'c1', stage: 'flowering' as const, date: early }] };
  const f = speciesFactor('zucchini', d2);
  ok(f.n === 1 && f.factor > 1, `facteur ${f.factor}`);
  const after = timeline(p, d2, '2026-06-01').starts.find((s) => s.stage === 'flowering')!.date;
  ok(Math.abs(diffDays(after, early)) <= 2, `recalée ${after} vs ${early}`);
  const absurd = { ...d, phenoEvents: [{ id: 'e', plantId: 'c1', stage: 'flowering' as const, date: '2026-05-12' }] };
  ok(speciesFactor('zucchini', absurd).factor <= 1.6, 'borné');
  // Floraison notée en retard : le stade tombe à sa date et la culture est bien « en fleur » ce jour-là.
  const late = addDays(predicted, 12);
  const d3 = { ...d, phenoEvents: [{ id: 'e', plantId: 'c1', stage: 'flowering' as const, date: late }] };
  const t3 = timeline(p, d3, late);
  ok(Math.abs(diffDays(t3.starts.find((s) => s.stage === 'flowering')!.date, late)) <= 1 && t3.stage === 'flowering', `retard ${t3.stage}`);
});

// --- Phase 2 : eau avec météo ---------------------------------------------------

test('eau : pluie et ET₀ de la météo, report si pluie annoncée, goutte-à-goutte', () => {
  const p = plant({ speciesId: 'lettuce', count: 12, sowDate: '2026-06-01' });
  const dry = cacheFrom(series('2026-06-01', 45, (i) => ({ et0: 5, rain: 0 })));
  const base = data({ beds: [bed({ drip: true, dripFlow: 40 })], plants: [p] });
  const d = { ...base, weather: dry, settings: { ...base.settings, weather: true, rainSource: 'average' as const } };
  const adv = waterAdvice(bed({ drip: true, dripFlow: 40 }), d, '2026-07-05');
  ok(adv.water && adv.history.every((x) => x.measured) && adv.history[3].et0 === 5, 'météo sèche');
  ok(adv.dripMinutes !== undefined && Math.abs(adv.dripMinutes - Math.round((adv.liters / 40) * 60)) <= 1, `goutte-à-goutte ${adv.dripMinutes}`);
  // Premier jour où il faudrait arroser (réserve juste sous la moitié) : une pluie annoncée fait reporter.
  let day = '2026-06-05';
  while (!waterAdvice(bed(), d, day).water) day = addDays(day, 1);
  const rainy = { ...d, weather: cacheFrom([...dry.days.filter((x) => x.date <= day), wday(addDays(day, 1), { rain: 15 }), wday(addDays(day, 2), { rain: 5 })]) };
  const adv2 = waterAdvice(bed(), rainy, day);
  ok(adv2.postponed && !adv2.water && adv2.rainExpected >= 8, `reporté (${day}, ${adv2.ratio.toFixed(2)})`);
  ok(!waterAdvice(bed(), rainy, addDays(day, 12)).postponed, 'pas de report quand la réserve est vide');
  const wet = { ...d, weather: cacheFrom(series('2026-06-01', 45, () => ({ et0: 3, rain: 6 }))) };
  ok(waterAdvice(bed(), wet, '2026-07-05').ratio > 0.9, 'pluie de la météo comptée');
  const manual = { ...wet, settings: { ...wet.settings, rainSource: 'manual' as const } };
  ok(waterAdvice(bed(), manual, '2026-07-05').ratio < 0.5, 'pluviomètre seul');
});

test('tâches : alerte de gel prévue pour une culture frileuse dehors', () => {
  const t = plant({ id: 't', speciesId: 'tomato', sowDate: '2026-04-01' });
  const c = cacheFrom([wday('2026-05-02', { tmin: -1 })]);
  const d = data({ beds: [bed()], plants: [t], weather: c, settings: { ...DEFAULT_SETTINGS, onboarded: true, weather: true } });
  ok(generateTasks(d, '2026-05-01').some((x) => x.kind === 'alert' && x.vars.alert === 'frost'), 'alerte');
  ok(!generateTasks(d, '2026-05-01').some((x) => x.kind === 'frost'), 'pas de doublon climatologique');
  const gh = { ...d, beds: [bed({ kind: 'greenhouse' })] };
  ok(!generateTasks(gh, '2026-05-01').some((x) => x.kind === 'alert'), 'serre épargnée');
});

// --- Phase 2 : soleil et ombres ----------------------------------------------------

test('soleil : position à midi au solstice et le matin', () => {
  const noon = sunPosition(47, 172, 12);
  ok(Math.abs(noon.alt - (90 - 47 + 23.44)) < 0.6 && Math.abs(noon.az - 180) < 1, `midi ${noon.alt} ${noon.az}`);
  const morning = sunPosition(47, 172, 8);
  ok(morning.az > 60 && morning.az < 130 && morning.alt > 15, `matin ${morning.az}`);
  ok(sunPosition(47, 355, 12).alt < 22, 'hiver');
});

test('ombres : une maison au sud ombre la planche juste au nord', () => {
  // Nord en haut : la maison (y = 6) est au sud de la planche (y = 4,5).
  const house = { id: 'h', name: 'Maison', kind: 'building' as const, x: 0, y: 6, w: 8, h: 2, height: 7 };
  const eq = sunPosition(47, 80, 12);
  ok(inShadow(4, 5, eq, [house], 0), 'à l’ombre en mars');
  ok(!inShadow(4, 0.5, sunPosition(47, 172, 12), [house], 0), 'loin au nord, au soleil en juin');
  const near = bedSun({ x: 1, y: 4.5, w: 4, h: 1 }, [house], 47, 0);
  const far = bedSun({ x: 1, y: 0.2, w: 4, h: 1 }, [house], 47, 0);
  ok(near.season < far.season && far.exposure === 'full', `${near.season.toFixed(1)} < ${far.season.toFixed(1)}`);
  const alone = bedSun({ x: 1, y: 0.2, w: 4, h: 1 }, [], 47, 0);
  ok(Math.abs(alone.season - alone.open) < 1e-9 && alone.season > 10, 'sans obstacle');
  ok(far.june > near.june, 'juin');
  // Plan tourné : nord à droite, la maison est alors à l'ouest de la planche.
  ok(bedSun({ x: 1, y: 4.5, w: 4, h: 1 }, [house], 47, 90).season > near.season, 'orientation');
  ok(shadowPolygon(house, eq, 0).length >= 4, 'contour');
  ok(exposureOf(7) === 'full' && exposureOf(4) === 'partial' && exposureOf(1) === 'shade', 'catégories');
  ok(sunMismatch('full', 'partial') && !sunMismatch('partial', 'partial') && sunMismatch('partial', 'shade'), 'besoins');
});

// --- Phase 2 : diagnostic ----------------------------------------------------------

test('diagnostic : données cohérentes', () => {
  for (const p of PROBLEMS) {
    ok(Object.keys(p.signs).length > 0 && p.remedies.length > 0, p.id);
    for (const r of p.remedies) ok(REMEDY_BY_ID[r], `${p.id} → ${r}`);
  }
});

test('diagnostic : oïdium, cul noir, chlorose, hernie selon la famille', () => {
  ok(diagnose({ organ: 'leaves', signs: ['whitePowder'], context: [], family: 'cucurbitaceae' })[0].problem.id === 'powderyMildew', 'oïdium');
  ok(diagnose({ organ: 'fruits', signs: ['blossomEndRot'], context: ['dry'], family: 'solanaceae' })[0].problem.id === 'ber', 'cul noir');
  ok(diagnose({ organ: 'leaves', signs: ['interveinal', 'yellowYoung'], context: [] })[0].problem.id === 'feDef', 'chlorose ferrique');
  ok(diagnose({ organ: 'leaves', signs: ['interveinal', 'yellowOld'], context: [] })[0].problem.id === 'mgDef', 'magnésium');
  const cab = diagnose({ organ: 'roots', signs: ['rootGalls'], context: [], family: 'brassicaceae' }).map((h) => h.problem.id);
  const tom = diagnose({ organ: 'roots', signs: ['rootGalls'], context: [], family: 'solanaceae' }).map((h) => h.problem.id);
  ok(cab.includes('clubroot') && !tom.includes('clubroot') && tom[0] === 'rootKnot', `${cab} / ${tom}`);
  const h = diagnose({ organ: 'leaves', signs: ['oilySpots', 'spotsBrown'], context: ['humid'], family: 'solanaceae' });
  ok(h[0].problem.id === 'lateBlight' && h[0].contextMatched.includes('humid'), 'mildiou');
  ok(Math.abs(h.reduce((s, x) => s + x.confidence, 0) - 1) < 1e-9, 'confiances');
  ok(diagnose({ signs: [], context: [] }).length === 0, 'rien coché');
});

// --- Phase 2 : graines et saison ------------------------------------------------------

test('graines : faculté germinative, test de germination', () => {
  ok(Object.keys(SPECIES_EXTRA).length === SPECIES.length && SPECIES.every((s) => SPECIES_EXTRA[s.id]), 'données complètes');
  ok(COMPANIONS.every((c) => SPECIES_BY_ID[c.a] && SPECIES_BY_ID[c.b]), 'associations');
  const lot = { id: 'l', speciesId: 'carrot', year: 2023 };
  ok(seedState(lot, '2026-03-01').state === 'lastYear', 'dernière année');
  ok(seedState({ ...lot, year: 2025 }, '2026-03-01').state === 'ok', 'récent');
  ok(seedState({ ...lot, year: 2020 }, '2026-03-01').state === 'old', 'ancien');
  ok(seedState({ ...lot, year: 2020, germRate: 0.85, germTested: '2026-02-01' }, '2026-03-01').state === 'ok', 'test récent');
  ok(germRate(20, 15) === 0.75 && seedsFor(30, 0.75) === 40, 'calculs');
});

test('saison : récoltes, valeur, coût des intrants', () => {
  const p = plant({ id: 'p', speciesId: 'tomato', count: 6 });
  const obs = (id: string, date: string, g: number) => ({ id, plantId: 'p', bedId: 'b1', date, note: '', harvestG: g, photoIds: [] });
  const d = data({ beds: [bed()], plants: [p], observations: [obs('o1', '2026-08-01', 2000), obs('o2', '2026-08-15', 3000), obs('o3', '2025-08-15', 999)], applications: [{ id: 'a', bedId: 'b1', productId: 'blood', amount: 100, date: '2026-05-01', cost: 4.5 }], prices: { tomato: 4 } });
  const s = seasonSummary(d, 2026);
  ok(s.grams === 5000 && near(s.value, 20) && s.inputsCost === 4.5, JSON.stringify(s));
  ok(near(s.rows[0].area, plantArea(p)), 'surface comptée une fois');
});

if (failed) {
  console.log(`\n${failed} test(s) en échec`);
  process.exit(1);
}
console.log('\nTous les tests passent');
