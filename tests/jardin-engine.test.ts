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
import { mergeGardens, photoIdsOf, pruneDeleted, stampChanges } from '../src/jardin/engine/sync';
import { addReadings, moistureToFraction, parseDateTime, parseReadingsCSV, tankStatus, tankTarget, toMinutes } from '../src/jardin/engine/sensors';
import { notificationId, planNotifications } from '../src/jardin/engine/notify';
import { forecast, forecastByMonth, multiYear, reportData } from '../src/jardin/engine/report';
import type { Sensor } from '../src/jardin/model';
import { planCalendar, planSeason, planToPlants, wishesFromYear, windowDate } from '../src/jardin/engine/planner';
import { growthReport, harvestProgress, referenceHeight, MATURE_HEIGHT } from '../src/jardin/engine/growth';
import { countablePests, pestStatuses, pestTasks } from '../src/jardin/engine/pests';
import { autoShopping, bestLot, convert, seedLevel, seedsUsedBy, stockForProduct, stockLevel } from '../src/jardin/engine/stock';
import { caoApplied, estimateCEC, interpret, limeAdvice, nCredit, phMismatches, soilFor } from '../src/jardin/engine/soil';

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
  ok(allowedProducts(PRODUCTS, { practices: ['conventional'] }).length === PRODUCTS.filter((p) => p.kind !== 'amendment').length, 'conventionnel : tous les engrais');
  ok(!allowedProducts(PRODUCTS, { practices: ['conventional'] }).some((p) => p.kind === 'amendment'), 'pas d’amendement calcaire dans les engrais');
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
  const fr = parseLigneeVarieties(JSON.stringify({ app: 'lignee', crop: 'fraise', kind: 'varieties', version: 1, varieties: [{ id: 'my-2', name: 'Remontante blanche', species: 'ananassa', early: 50, variants: ['myb10'], het: ['PFRU'] }] }));
  ok(fr.length === 1 && fr[0].speciesId === 'strawberry' && fr[0].origin === 'lignee:fraise', 'fraise');
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

// --- Phase 3 : jardin partagé ----------------------------------------------------

test('partage : horodatage, auteur et traces de suppression', () => {
  const b1 = bed({ id: 'b1' });
  const b2 = bed({ id: 'b2', name: 'B2' });
  const prev = data({ beds: [b1, b2] });
  const next = { ...prev, beds: [{ ...b1, name: 'Nord' }] };
  const out = stampChanges(prev, next, '2026-10-01T10:00:00.000Z', 'Camille');
  ok(out.beds[0].mod === '2026-10-01T10:00:00.000Z' && out.beds[0].by === 'Camille', 'modif datée et signée');
  ok(out.deleted.b2 === '2026-10-01T10:00:00.000Z', 'suppression notée');
  const same = stampChanges(out, { ...out }, '2026-10-02T00:00:00.000Z', 'X');
  ok(same.beds[0].mod === '2026-10-01T10:00:00.000Z', 'inchangé = pas de nouvelle date');
  ok(Object.keys(pruneDeleted({ a: '2024-01-01T00:00:00Z', b: '2026-09-01T00:00:00Z' }, '2026-10-01T00:00:00Z')).join() === 'b', 'vieilles traces oubliées');
});

test('partage : fusion, la plus récente gagne, suppressions comprises', () => {
  const t = (h: number) => `2026-10-01T${String(h).padStart(2, '0')}:00:00.000Z`;
  const local = data({
    beds: [bed({ id: 'b1', name: 'Local', mod: t(10), by: 'A' }), bed({ id: 'b3', name: 'À supprimer', mod: t(8) })],
    plants: [plant({ id: 'p1', mod: t(9) })],
    readings: { s1: [[100, 1], [200, 2]] },
  });
  const remote = data({
    beds: [bed({ id: 'b1', name: 'Distant', mod: t(11), by: 'B' }), bed({ id: 'b2', name: 'Nouvelle', mod: t(9) })],
    plants: [plant({ id: 'p1', count: 99, mod: t(8) })],
    readings: { s1: [[200, 2], [300, 3]] },
    deleted: { b3: t(9) },
  });
  const { data: m, stats } = mergeGardens(local, remote);
  ok(m.beds.find((b) => b.id === 'b1')?.name === 'Distant', 'plus récente');
  ok(m.beds.some((b) => b.id === 'b2'), 'ajout');
  ok(!m.beds.some((b) => b.id === 'b3'), 'suppression plus récente appliquée');
  ok(m.plants[0].count === 6, 'version locale plus récente gardée');
  ok(m.readings.s1.map((r) => r[0]).join() === '100,200,300', 'relevés additionnés');
  ok(stats.added === 1 && stats.updated === 1 && stats.removed === 1 && stats.conflicts === 1, JSON.stringify(stats));
  // Idempotence : refusionner la même copie ne change rien.
  const again = mergeGardens(m, remote);
  ok(again.stats.added === 0 && again.stats.updated === 0 && again.data.beds.length === m.beds.length, 'idempotent');
  // Une modification postérieure à la suppression fait revivre la fiche.
  const revived = mergeGardens(data({ beds: [bed({ id: 'b3', mod: t(12) })] }), remote);
  ok(revived.data.beds.some((b) => b.id === 'b3'), 'modif plus récente que la suppression');
});

test('partage : la sauvegarde garde capteurs, relevés et traces', () => {
  const d = data({ sensors: [{ id: 's', name: 'Sonde', kind: 'soilMoisture', source: 'manual', bedId: 'b1' }], readings: { s: [[1, 20], [2, 'x' as unknown as number]] }, deleted: { z: '2026-01-01T00:00:00Z' }, tankChanges: [{ id: 't', bedId: 'b1', date: '2026-09-01' }] });
  const back = parseBackup(serializeBackup(d, [])).data;
  const legacy = parseBackup(serializeBackup(data({ sensors: [{ id: 'e', name: 'E', kind: 'soilMoisture', source: 'ecowitt', channel: '1' }] }), [])).data;
  ok(legacy.sensors[0].source === 'manual' && legacy.sensors[0].channel === undefined, 'ancien capteur Ecowitt lu comme saisie manuelle');
  ok(back.sensors.length === 1 && back.readings.s.length === 1 && back.deleted.z && back.tankChanges.length === 1, JSON.stringify(back.readings));
});

// --- Phase 3 : capteurs -------------------------------------------------------------

test('capteurs : dates et CSV (séparateurs, virgule décimale, en-tête, colonnes)', () => {
  ok(parseDateTime('2026-09-30 14:05')!.getHours() === 14, 'heure locale');
  ok(parseDateTime('2026-09-30T12:00:00Z')!.toISOString() === '2026-09-30T12:00:00.000Z', 'UTC');
  ok(parseDateTime('2026-09-30T14:00:00+02:00')!.toISOString() === '2026-09-30T12:00:00.000Z', 'fuseau');
  ok(parseDateTime('30/09/2026 08:30')!.getDate() === 30, 'jj/mm/aaaa');
  ok(parseDateTime('1790000000')!.getUTCFullYear() === 2026, 'horodatage Unix');
  ok(parseDateTime('hier') === null, 'invalide');
  const fr = parseReadingsCSV('Date;Temp;Humidité\n2026-09-30 10:00;18,5;35,2\n2026-09-30 11:00;19;36\nmauvaise;ligne;x\n', 'soilMoisture');
  ok(fr.columns.join() === '1,2' && fr.readings.length === 2 && fr.skipped === 1 && fr.header?.[2] === 'Humidité', JSON.stringify(fr));
  const col2 = parseReadingsCSV('Date;Temp;Humidité\n2026-09-30 10:00;18,5;35,2\n', 'soilMoisture', 2);
  ok(col2.readings[0][1] === 35.2, 'colonne choisie');
  const en = parseReadingsCSV('2026-09-30T10:00:00Z,6.2\n2026-09-30T11:00:00Z,15\n', 'ph');
  ok(en.readings.length === 1 && en.skipped === 1, 'pH hors bornes rejeté');
});

test('capteurs : série (doublons, écart minimal, ordre)', () => {
  const r = addReadings([[100, 1]], [[105, 2], [130, 3], [90, 0], [130, 9]]);
  ok(r.list.map((x) => x[0]).join() === '90,130' || r.list.map((x) => x[0]).join() === '90,100,130', r.list.map((x) => x[0]).join());
  ok(r.list.every((x, i) => i === 0 || x[0] - r.list[i - 1][0] >= 10), 'écart de 10 min');
});

test('capteurs : humidité du sol → réserve utile, recalage du bilan hydrique', () => {
  ok(near(moistureToFraction({}, 20.5, 'loam'), 0.5, 1e-9), 'texture');
  ok(moistureToFraction({ dry: 300, wet: 700 }, 500, 'loam') === 0.5 && moistureToFraction({ dry: 300, wet: 700 }, 900, 'loam') === 1, 'étalonnage');
  const p = plant({ speciesId: 'lettuce', sowDate: '2026-06-01' });
  const b = bed();
  const base = data({ beds: [b], plants: [p], settings: { ...DEFAULT_SETTINGS, rainSource: 'manual' } });
  const dry = waterAdvice(b, base, '2026-07-20');
  ok(dry.water && !dry.sensorToday, 'sans sonde : arroser');
  const at = toMinutes(new Date(2026, 6, 20, 9, 0));
  const wet = { ...base, sensors: [{ id: 's', name: 's', kind: 'soilMoisture' as const, source: 'manual' as const, bedId: 'b1' }], readings: { s: [[at, 27]] as [number, number][] } };
  const adv = waterAdvice(b, wet, '2026-07-20');
  ok(adv.sensorToday && !adv.water && adv.ratio > 0.85, `sonde humide : ratio ${adv.ratio}`);
});

// --- Phase 3 : hydroponie -------------------------------------------------------------

test('hydroponie : cibles communes, état du bac et tâches', () => {
  const t = tankTarget(['lettuce', 'basil'])!;
  ok(t.ec[0] === 1.0 && t.ec[1] === 1.2 && t.ph[0] === 5.5 && t.ph[1] === 6.5, JSON.stringify(t));
  ok(tankTarget(['carrot']) === null, 'pas de cible connue');
  const conflicting = tankTarget(['lettuce', 'tomato'])!;
  ok(conflicting.ec[0] <= conflicting.ec[1], 'plages disjointes : plage prudente');
  const b = bed({ id: 'h', kind: 'hydro', name: 'Bac' });
  const at = toMinutes(new Date(2026, 8, 30, 9));
  const d = data({
    beds: [b],
    plants: [plant({ id: 'l', speciesId: 'lettuce', bedId: 'h', sowDate: '2026-09-01' })],
    sensors: [{ id: 'ec', name: 'EC', kind: 'ec', bedId: 'h', source: 'manual' }, { id: 'ph', name: 'pH', kind: 'ph', bedId: 'h', source: 'manual' }],
    readings: { ec: [[at, 1.6]], ph: [[at, 6.0]] },
    tankChanges: [{ id: 'c', bedId: 'h', date: '2026-09-10' }],
  });
  const st = tankStatus('h', d, '2026-10-01');
  ok(st.ec?.state === 'high' && st.ph?.state === 'ok' && st.renewDue && st.daysSinceChange === 21, JSON.stringify(st));
  const tasks = generateTasks(d, '2026-10-01');
  ok(tasks.some((x) => x.kind === 'tank' && x.vars.what === 'ecHigh'), 'EC trop haute');
  ok(tasks.some((x) => x.kind === 'tank' && x.vars.what === 'renew'), 'renouvellement');
  ok(!tasks.some((x) => x.kind === 'water'), 'pas d’arrosage pour un bac');
  const old = generateTasks(d, '2026-10-10');
  ok(!old.some((x) => x.vars.what === 'ecHigh'), 'mesure trop ancienne ignorée');
});

// --- Phase 3 : notifications ------------------------------------------------------------

test('notifications : matin, veille de gel, rappel de sauvegarde, plafond', () => {
  ok(notificationId('a') !== notificationId('b') && notificationId('a') === notificationId('a') && notificationId('x') > 0 && notificationId('x') < 2 ** 31, 'identifiants');
  const now = new Date(2026, 4, 9, 7, 0);
  const days = series('2026-02-08', 100, (i, date) => (date === '2026-05-11' ? { tmin: -2, tmax: 9 } : {}));
  const d = data({
    beds: [bed()],
    plants: [plant({ id: 't', speciesId: 'tomato', sowDate: '2026-04-20', transplantDate: '2026-05-05', indoor: true })],
    settings: { ...DEFAULT_SETTINGS, onboarded: true, notify: true, notifyHour: 8, notifyMax: 3, weather: true, lat: 48.8, lon: 2.3 },
    weather: cacheFrom(days),
  });
  const plan = planNotifications(d, now);
  ok(plan.some((n) => n.kind === 'morning' && n.at.getHours() === 8 && n.at.getDate() === 9), 'résumé du matin');
  const frost = plan.find((n) => n.kind === 'alert');
  ok(frost && frost.at.getDate() === 10 && frost.at.getHours() === 18, `alerte la veille : ${frost?.at}`);
  ok(plan.some((n) => n.kind === 'backup'), 'jamais sauvegardé : rappel');
  ok(plan.every((n) => n.at > now), 'rien dans le passé');
  const capped = planNotifications({ ...d, settings: { ...d.settings, notifyMax: 1 } }, now);
  const perDay = new Map<number, number>();
  for (const n of capped) perDay.set(n.at.getDate(), (perDay.get(n.at.getDate()) ?? 0) + 1);
  ok([...perDay.values()].every((v) => v <= 1), 'plafond quotidien');
  ok(capped.find((n) => n.at.getDate() === 10)?.kind === 'alert', 'l’alerte passe avant le résumé');
  ok(!planNotifications({ ...d, settings: { ...d.settings, lastBackup: '2026-05-01' } }, now).some((n) => n.kind === 'backup'), 'sauvegarde récente : pas de rappel');
  ok(planNotifications({ ...d, settings: { ...d.settings, notify: false } }, now).length === 0, 'désactivées');
});

// --- Phase 3 : mode pro ------------------------------------------------------------------

test('mode pro : récoltes prévues, répartition par mois, bilan pluriannuel, rapport', () => {
  const p = plant({ id: 'p', speciesId: 'lettuce', count: 12, sowDate: '2026-05-01' });
  const obs = (id: string, date: string, g: number, plantId = 'p') => ({ id, plantId, bedId: 'b1', date, note: '', harvestG: g, photoIds: [] });
  const d = data({
    beds: [bed()],
    plants: [p, plant({ id: 'old', speciesId: 'tomato', status: 'ended', sowDate: '2025-04-01', endDate: '2025-10-01' })],
    observations: [obs('a', '2026-06-20', 500), obs('b', '2025-08-01', 4000, 'old')],
    applications: [{ id: 'x', bedId: 'b1', productId: 'blood', amount: 100, date: '2025-05-01', cost: 3 }],
  });
  const f = forecast(d, '2026-06-21');
  ok(f.length === 1 && near(f[0].harvestedKg, 0.5) && near(f[0].remainingKg, f[0].expectedKg - 0.5), JSON.stringify(f));
  const months = forecastByMonth(f, '2026-06-21');
  ok(near(months.reduce((s, m) => s + m.kg, 0), f[0].remainingKg, 1e-6), 'tout est réparti');
  const my = multiYear(d);
  ok(my.years.join() === '2025,2026' && my.inputs[2025] === 3 && my.rows.find((r) => r.year === 2025)?.grams === 4000, JSON.stringify(my));
  const r = reportData(d, 2026, '2026-06-21');
  ok(r.season.grams === 500 && r.forecast.length === 1 && r.applications.length === 0, 'rapport 2026');
});

// --- Phase 4 : analyse de sol ---------------------------------------------------------

test('sol : niveaux P/K/Mg, CEC estimée, facteurs de correction', () => {
  ok(near(estimateCEC(20, 3), 16), 'CEC estimée');
  const r = interpret({ id: 't', date: '2026-03-01', pH: 6.0, om: 3, pMethod: 'olsen', P2O5: 30, K2O: 250, MgO: 400, cec: 12 }, 'loam');
  ok(r.P?.level === 'low' && r.factor.P2O5 === 1.5, `P ${r.P?.level}`);
  ok(r.K?.level === 'ok' && r.factor.K2O === 1, `K ${r.K?.level} ${r.K?.range}`);
  ok(r.Mg?.level === 'high', `Mg ${r.Mg?.level}`);
  ok(r.nPerYear === 12 && r.ph?.state === 'acid', 'azote et pH');
  const rich = interpret({ id: 't', date: '2026-03-01', pMethod: 'joretHebert', P2O5: 900, K2O: 900, cec: 12 }, 'loam');
  ok(rich.factor.P2O5 === 0 && rich.factor.K2O === 0, 'très riche : impasse');
  const est = interpret({ id: 't', date: '2026-03-01', pMethod: 'olsen', om: 2 }, 'clay');
  ok(est.cecEstimated && near(est.cec, 26.5), `CEC argileuse ${est.cec}`);
});

test('sol : chaulage (dose, plafond, produit, déduction des apports)', () => {
  const b = bed({ id: 'b1', w: 5, h: 2 });
  const d = data({ beds: [b], soilTests: [{ id: 's', date: '2026-02-01', pH: 5.8, pMethod: 'olsen', MgO: 50, cec: 15 }] });
  const r = soilFor(d, 'b1')!;
  const lime = limeAdvice(r, d, b)!;
  ok(near(lime.caoPerM2, 18.2 * 0.7 * 15, 1e-6), `CaO ${lime.caoPerM2}`);
  ok(lime.nowPerM2 === 191.1 || near(lime.nowPerM2, 191.1, 0.01), `maintenant ${lime.nowPerM2}`);
  ok(lime.product.id === 'dolomite', 'magnésie basse : dolomie');
  ok(near(lime.productTotal, (lime.nowPerM2 / 0.52) * 10, 1e-6), 'quantité pour la planche');
  const limed = { ...d, applications: [{ id: 'a', bedId: 'b1', productId: 'dolomite', amount: 3000, date: '2026-03-01' }] };
  ok(near(caoApplied(limed, '2026-02-01', 'b1'), 156, 1e-6), 'CaO apporté');
  ok(near(limeAdvice(soilFor(limed, 'b1'), limed, b)!.caoPerM2, 191.1 - 156, 0.01), 'déduit');
  const ok65 = data({ beds: [b], soilTests: [{ id: 's', date: '2026-02-01', pH: 6.5, pMethod: 'olsen' }] });
  ok(limeAdvice(soilFor(ok65, 'b1'), ok65, b) === null, 'pH correct : rien');
  ok(soilFor(data({ beds: [b], soilTests: [{ id: 'g', date: '2026-01-01', pH: 7, pMethod: 'olsen' }, { id: 'p', bedId: 'b1', date: '2025-01-01', pH: 5.5, pMethod: 'olsen' }] }), 'b1')!.test.id === 'p', 'analyse de la planche d’abord');
  const tasks = generateTasks({ ...d, plants: [] }, '2026-11-05');
  ok(tasks.some((t) => t.kind === 'lime'), 'tâche de chaulage en automne');
  ok(!generateTasks({ ...d, plants: [] }, '2026-06-05').some((t) => t.kind === 'lime'), 'pas en été');
});

test('sol : correction des besoins de la culture, crédit d’azote, pH des cultures', () => {
  const p = plant({ id: 'p', speciesId: 'tomato', count: 6, sowDate: '2026-03-01' });
  const plain = data({ beds: [bed()], plants: [p] });
  const tested = { ...plain, soilTests: [{ id: 's', date: '2026-02-01', pMethod: 'olsen' as const, om: 3, P2O5: 120, K2O: 100, cec: 12 }] };
  const a = nutrientStatus(p, plain, '2026-05-01');
  const b2 = nutrientStatus(p, tested, '2026-05-01');
  ok(b2.soil && near(b2.need.P2O5, a.need.P2O5 * 0.5) && near(b2.need.K2O, a.need.K2O * 1.5), 'P riche ×0,5, K pauvre ×1,5');
  ok(b2.need.N < a.need.N && b2.need.N >= a.need.N * 0.3 - 1e-9 && near(b2.soil.nCredit, a.need.N - b2.need.N), `azote ${a.need.N} → ${b2.need.N}`);
  ok(nCredit(interpret({ id: 'x', date: '2026-01-01', pMethod: 'olsen' }, 'loam'), p, 2, 10) === 0, 'sans MO : pas de crédit');
  ok(!nutrientStatus(p, { ...plain, settings: { ...plain.settings, pH: 6.2 } }, '2026-05-01').soil, 'pH seul : pas de correction');
  const acid = interpret({ id: 'x', date: '2026-01-01', pMethod: 'olsen', pH: 5.2 }, 'loam');
  ok(phMismatches(acid, [plant({ speciesId: 'cabbage' })]).length === 1, 'chou hors pH');
});

// --- Phase 4 : planificateur -------------------------------------------------------------

test('planificateur : rotation, succession des exigences, serre, échelonnement, dérobée', () => {
  ok(windowDate([3, 4], 2027, 0) === '2027-03-01' && windowDate([3, 4], 2027, 1) === '2027-04-30', 'fenêtre');
  const b1 = bed({ id: 'b1', w: 4, h: 1 });
  const b2 = bed({ id: 'b2', w: 4, h: 1, x: 5 });
  const gh = bed({ id: 'gh', kind: 'greenhouse', w: 3, h: 2, x: 0, y: 3 });
  const past = [
    plant({ id: 'old1', speciesId: 'tomato', bedId: 'b1', sowDate: '2026-03-01', status: 'ended', endDate: '2026-10-01' }),
    plant({ id: 'old2', speciesId: 'bean', bedId: 'b2', sowDate: '2026-05-01', status: 'ended', endDate: '2026-09-01' }),
  ];
  const d = data({ beds: [b1, b2, gh], plants: past });
  const r = planSeason(d, { year: 2027, wishes: [{ speciesId: 'potato', area: 3, sowings: 1 }, { speciesId: 'tomato', area: 2, sowings: 1 }, { speciesId: 'lettuce', area: 1.5, sowings: 3 }] });
  const potato = r.crops.find((c) => c.speciesId === 'potato')!;
  ok(potato.bedId === 'b2' && potato.reasons.some((n) => n.code === 'afterLegume'), `pomme de terre après haricot : ${potato.bedId}`);
  const tomato = r.crops.find((c) => c.speciesId === 'tomato' && c.role === 'main')!;
  ok(tomato.bedId === 'gh' && tomato.indoor && tomato.transplantDate! >= '2027-05-01', `tomate sous serre, plantée après les gelées : ${tomato.bedId} ${tomato.transplantDate}`);
  ok(!r.crops.some((c) => c.speciesId === 'potato' && c.bedId === 'b1'), 'pas de solanacée derrière la tomate');
  const lettuces = r.crops.filter((c) => c.speciesId === 'lettuce' && c.role === 'succession');
  ok(lettuces.length === 3 && lettuces[0].sowDate < lettuces[1].sowDate && lettuces[1].sowDate < lettuces[2].sowDate && near(lettuces.reduce((s, c) => s + c.area, 0), 1.5, 0.02), 'trois semis échelonnés');
  ok(r.crops.some((c) => c.role === 'catch' && c.bedId === 'gh'), 'dérobée avant la tomate');
  ok(r.usage.every((u) => u.used <= u.area + 1e-9), 'capacité respectée');
  const cal = planCalendar(r);
  ok(cal.every((a, i) => i === 0 || a.date >= cal[i - 1].date) && cal.some((a) => a.kind === 'transplant'), 'calendrier trié');
  let n = 0;
  const pl = planToPlants(r, '2026-10-01', (p) => `${p}${n++}`);
  ok(pl.length === r.crops.length && pl.every((p) => p.status === 'planned' && p.count >= 1), 'cultures prévues');
  const big = planSeason(d, { year: 2027, wishes: [{ speciesId: 'squash', area: 40, sowings: 1 }] });
  ok(big.unplaced.length === 1 && big.unplaced[0].area > 20, 'trop grand : signalé');
  const w = wishesFromYear(d, 2026);
  ok(w.length === 2 && w.find((x) => x.speciesId === 'bean')?.sowings === 3, 'envies reprises de l’an dernier');
});

// --- Phase 4 : croissance --------------------------------------------------------------

test('croissance : courbe de référence, avance ou retard, récolte cumulée', () => {
  ok(SPECIES.every((sp) => MATURE_HEIGHT[sp.id] > 0), 'hauteur pour chaque espèce');
  ok(referenceHeight('tomato', 0) < 4 && near(referenceHeight('tomato', 1e4), 160, 0.01), 'courbe en S');
  ok(referenceHeight('tomato', 40) < referenceHeight('tomato', 60), 'croissante');
  const p = plant({ id: 'p', speciesId: 'lettuce', count: 10, sowDate: '2026-04-01' });
  const obs = (id: string, date: string, extra: object) => ({ id, plantId: 'p', bedId: 'b1', date, note: '', photoIds: [], ...extra });
  const base = data({ beds: [bed()], plants: [p] });
  const refAt = growthReport(p, { ...base, observations: [obs('a', '2026-05-10', { heightCm: 10 })] }, '2026-05-10').latest!.reference;
  const tall = growthReport(p, { ...base, observations: [obs('a', '2026-05-10', { heightCm: refAt * 1.5 })] }, '2026-05-10');
  const short = growthReport(p, { ...base, observations: [obs('a', '2026-05-10', { heightCm: refAt * 0.5 })] }, '2026-05-10');
  const fine = growthReport(p, { ...base, observations: [obs('a', '2026-05-10', { heightCm: refAt * 1.05 })] }, '2026-05-10');
  ok(tall.latest?.state === 'ahead' && short.latest?.state === 'behind' && fine.latest?.state === 'normal', 'états');
  ok(tall.curve.length > 3 && tall.curve[0].date === '2026-04-01', 'courbe datée');
  ok(harvestProgress(p, base, '2026-04-20') === null, 'avant la récolte : rien');
  const tl = timeline(p, base, '2026-07-01');
  const mid = addDays(tl.harvestFrom, Math.round(diffDays(tl.harvestFrom, tl.harvestTo) / 2));
  const hp = harvestProgress(p, { ...base, observations: [obs('h', tl.harvestFrom, { harvestG: 100 })] }, mid)!;
  ok(near(hp.harvestedKg, 0.1) && hp.dueKg > 0 && hp.state === 'behind', `récolte en retard ${hp.dueKg}`);
});

// --- Phase 4 : ravageurs ----------------------------------------------------------------

test('ravageurs : seuil, tendance, auxiliaires, tâches', () => {
  ok(countablePests('solanaceae').includes('coloradoBeetle') && !countablePests('brassicaceae').includes('coloradoBeetle'), 'selon la famille');
  const pc = (id: string, date: string, value: number, beneficials: string[] = [], pestId = 'aphids') => ({ id, plantId: 'p', bedId: 'b1', date, pestId, value, beneficials });
  const st = (list: ReturnType<typeof pc>[]) => pestStatuses(list, { plantId: 'p' })[0];
  ok(st([pc('a', '2026-06-01', 10), pc('b', '2026-06-05', 20)]).advice === 'watch', 'monte sous le seuil : surveiller');
  ok(st([pc('a', '2026-06-01', 20), pc('b', '2026-06-05', 45)]).advice === 'act', 'au-delà : intervenir');
  ok(st([pc('a', '2026-06-01', 50), pc('b', '2026-06-05', 45, ['ladybird'])]).advice === 'beneficials', 'auxiliaires présents : attendre');
  ok(st([pc('a', '2026-06-01', 20), pc('b', '2026-06-05', 60, ['ladybird'])]).advice === 'act', 'auxiliaires débordés');
  ok(st([pc('a', '2026-06-01', 3, ['ladybird'], 'slugs'), pc('b', '2026-06-05', 6, ['groundBeetle'], 'slugs')]).advice === 'act', 'limaces : auxiliaires ne suffisent pas');
  ok(st([pc('a', '2026-06-01', 12, [], 'whitefly'), pc('b', '2026-06-08', 30, [], 'whitefly')]).over, 'piège : population qui double');
  const d = data({ beds: [bed()], plants: [plant({ id: 'p', speciesId: 'zucchini' })], pestCounts: [pc('a', '2026-06-01', 20), pc('b', '2026-06-05', 45)] });
  ok(pestTasks(d, '2026-06-06').some((t) => t.key === 'pest:b'), 'tâche intervenir');
  ok(pestTasks(d, '2026-06-30').length === 0, 'comptage trop ancien');
  const w = { ...d, pestCounts: [pc('a', '2026-06-01', 50), pc('b', '2026-06-05', 45, ['ladybird'])] };
  ok(pestTasks(w, '2026-06-06').length === 0 && pestTasks(w, '2026-06-10').some((t) => t.key === 'pestRecount:b'), 'recompter après 5 jours');
  ok(generateTasks(d, '2026-06-06').some((t) => t.kind === 'pest'), 'dans les tâches du jour');
});

// --- Phase 5 : stocks et notes vocales ---------------------------------------------------

test('stocks : déduction des apports, unités, seuil', () => {
  ok(convert(2.5, 'kg', 'g') === 2500 && convert(500, 'mL', 'L') === 0.5, 'conversions');
  const item = { id: 's', kind: 'product' as const, productId: 'organicNPK', name: 'NPK', qty: 2, unit: 'kg' as const, since: '2026-04-01', min: 1 };
  const apps = [
    { id: 'a', bedId: 'b1', productId: 'organicNPK', amount: 600, date: '2026-05-01' },
    { id: 'b', bedId: 'b1', productId: 'organicNPK', amount: 300, date: '2026-03-01' },
    { id: 'c', bedId: 'b1', productId: 'blood', amount: 100, date: '2026-05-01' },
  ];
  const lv = stockLevel(item, { applications: apps });
  ok(near(lv.used, 0.6) && near(lv.remaining, 1.4) && !lv.low, `restant ${lv.remaining}`);
  const lv2 = stockLevel(item, { applications: [...apps, { id: 'd', bedId: 'b1', productId: 'organicNPK', amount: 500, date: '2026-06-01' }] });
  ok(lv2.low && near(lv2.remaining, 0.9), 'sous le seuil');
  const over = stockLevel(item, { applications: [{ id: 'e', bedId: 'b1', productId: 'organicNPK', amount: 3000, date: '2026-06-01' }] });
  ok(over.remaining === 0 && over.negative, 'inventaire à refaire');
  const liquid = stockLevel({ ...item, productId: 'nettle', unit: 'L', qty: 10 }, { applications: [{ id: 'f', bedId: 'b1', productId: 'nettle', amount: 2500, date: '2026-05-01' }] });
  ok(near(liquid.remaining, 7.5), 'liquide en litres');
  ok(stockForProduct({ stocks: [item, { ...item, id: 'new', since: '2026-05-15', qty: 5 }], applications: apps }, 'organicNPK')!.item.id === 'new', 'inventaire le plus récent');
});

test('stocks : graines restantes, lot conseillé, liste de courses', () => {
  const lot = { id: 'l1', speciesId: 'carrot', year: 2026, seeds: 500, germRate: 0.5 };
  const sown = plant({ id: 'p1', speciesId: 'carrot', count: 100, seedLotId: 'l1' });
  const planned = plant({ id: 'p2', speciesId: 'carrot', count: 50, seedLotId: 'l1', status: 'planned', sowDate: '2026-07-01' });
  ok(seedsUsedBy(sown, lot) === 200 && seedsUsedBy(plant({ speciesId: 'potato', count: 8 }), lot) === 8, 'graines semées');
  const lv = seedLevel(lot, [sown, planned]);
  ok(lv.used === 200 && lv.reserved === 100 && lv.remaining === 200, JSON.stringify(lv));
  ok(seedLevel({ ...lot, seeds: undefined }, [sown]).remaining === undefined, 'nombre inconnu');
  const lots = [lot, { id: 'l0', speciesId: 'carrot', year: 2020 }, { id: 'l2', speciesId: 'carrot', year: 2026, seeds: 10 }];
  const best = bestLot({ seeds: lots, plants: [plant({ speciesId: 'carrot', count: 10, seedLotId: 'l2' })] }, 'carrot', '2026-06-01');
  ok(best?.id === 'l1', `meilleur lot ${best?.id}`);
  const d = data({
    beds: [bed()],
    plants: [plant({ id: 'x1', speciesId: 'leek', count: 30, status: 'planned', sowDate: '2026-07-01' }), plant({ id: 'x2', speciesId: 'garlic', count: 20, status: 'planned', sowDate: '2026-08-01' }), plant({ id: 'x3', speciesId: 'tomato', count: 6, status: 'planned', sowDate: '2027-03-01' })],
    seeds: [{ id: 'old', speciesId: 'leek', year: 2019 }],
    stocks: [{ id: 'st', kind: 'substrate', name: 'Terreau', qty: 10, unit: 'L', since: '2026-05-01', min: 20 }],
  });
  const shop = autoShopping(d, '2026-06-01');
  ok(shop.some((l) => l.kind === 'seeds' && l.speciesId === 'leek' && l.reason === 'old'), 'poireau : lot trop vieux');
  ok(shop.some((l) => l.kind === 'plants' && l.speciesId === 'garlic'), 'ail : caïeux');
  ok(!shop.some((l) => 'speciesId' in l && l.speciesId === 'tomato'), 'trop loin : pas encore');
  ok(shop.some((l) => l.kind === 'stock'), 'terreau sous le seuil');
  const acid = { ...d, plants: [], stocks: [], soilTests: [{ id: 't', date: '2026-01-01', pH: 5.6, pMethod: 'olsen' as const, cec: 12 }] };
  ok(autoShopping(acid, '2026-06-01').some((l) => l.kind === 'lime'), 'chaux à acheter');
});

test('notes vocales : sauvegardées et fusionnées avec les photos', () => {
  const d = data({ observations: [{ id: 'o', plantId: 'p', bedId: 'b1', date: '2026-06-01', note: '', photoIds: ['ph1'], audioIds: ['au1'] }] });
  const ids = photoIdsOf(d);
  ok(ids.has('ph1') && ids.has('au1'), 'médias de l’observation');
  ok(parseBackup(serializeBackup(d, [])).data.observations[0].audioIds?.[0] === 'au1', 'gardées dans la sauvegarde');
});

if (failed) {
  console.log(`\n${failed} test(s) en échec`);
  process.exit(1);
}
console.log('\nTous les tests passent');
