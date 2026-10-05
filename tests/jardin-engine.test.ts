/**
 * Tests des moteurs de Lignée Jardin (catalogue, dates, stades, nutrition,
 * eau, tâches, rotation, sauvegarde). Lancement : npm test
 */
import { CLIMATES, CLIMATE_IDS, AWC_MM_PER_CM } from '../src/jardin/data/climate';
import { PRODUCTS, PRODUCT_BY_ID } from '../src/jardin/data/products';
import { SPECIES, SPECIES_BY_ID, VEGETABLES } from '../src/jardin/data/species';
import { FLOWERS, FLOWER_INFO, FLOWER_USES } from '../src/jardin/data/flowers';
import { HERBS } from '../src/jardin/data/herbs';
import { ORCHARD } from '../src/jardin/data/orchard';
import { MORE_VEGETABLES } from '../src/jardin/data/vegMore';
import { mulchMassKgM2, mulchReleasedM2 } from '../src/jardin/engine/mulch';
import { bedCropsOfYear, bedGroupOfYear, bedRotationIssues, rotationGroup } from '../src/jardin/engine/rotation';
import { forecast as forecastRows } from '../src/jardin/engine/report';
import { seasonNeed as needOf } from '../src/jardin/engine/nutrition';
import { harvestProgress as hp } from '../src/jardin/engine/growth';
import { FAMILIES } from '../src/jardin/model';
import { DEFAULT_SETTINGS, EMPTY_DATA, type Bed, type GardenData, type Plant } from '../src/jardin/model';
import { addDays, dayOfYear, diffDays, weekKey } from '../src/jardin/engine/dates';
import { cropCalendar, inWindow, kcAt, plantArea, shiftWindows, stageInfo } from '../src/jardin/engine/crop';
import { bestProduct, doseFor, nutrientStatus, seasonNeed, shareOf, NUTRIENTS, allowedProducts } from '../src/jardin/engine/nutrition';
import { simulateBed, waterAdvice } from '../src/jardin/engine/water';
import { generateTasks } from '../src/jardin/engine/tasks';
import { rotationWarning } from '../src/jardin/engine/rotation';
import { ALERT, suggestClimate, mergeWeather, needsRefresh, normalDay, parseOpenMeteo, recentContext, weatherAlerts, weatherURL } from '../src/jardin/engine/weather';
import { eqAge, referenceStart, speciesFactor, timeline } from '../src/jardin/engine/phenology';
import { bedSun, exposureOf, heightAt, inShadow, shadowPolygon, sunPosition, sunMismatch } from '../src/jardin/engine/sun';
import { diagnose } from '../src/jardin/engine/diagnosis';
import { germRate, seasonSummary, seedState, seedsFor } from '../src/jardin/engine/season';
import { PROBLEMS, REMEDY_BY_ID } from '../src/jardin/data/problems';
import { SPECIES_EXTRA, COMPANIONS } from '../src/jardin/data/speciesExtra';
import type { WeatherCache, WeatherDay } from '../src/jardin/model';
import { demoGarden, parseBackup, parseLigneeVarieties, serializeBackup, toCSV } from '../src/jardin/engine/backup';
import { addCatalogNames, buildFlore, catalogLinks, searchFlore, type FloreData } from '../src/jardin/engine/flore';
import { FLORE_ALIASES } from '../src/jardin/data/floreAlias';
import { readFileSync } from 'node:fs';
import { FLOWER_VARIETIES } from '../src/jardin/data/flowerVarieties';
import { nurseryStatus, sowIndoorNow } from '../src/jardin/engine/nursery';
import { mergeGardens, mergeSynced, photoIdsOf, pruneDeleted, stampChanges } from '../src/jardin/engine/sync';
import { addReadings, moistureToFraction, parseDateTime, parseReadingsCSV, tankStatus, tankTarget, toMinutes } from '../src/jardin/engine/sensors';
import { notificationId, planNotifications } from '../src/jardin/engine/notify';
import { forecast, forecastByMonth, multiYear, reportData } from '../src/jardin/engine/report';
import type { Sensor } from '../src/jardin/model';
import { planCalendar, planSeason, planToPlants, wishesFromYear, windowDate } from '../src/jardin/engine/planner';
import { growthReport, harvestProgress, referenceHeight, MATURE_HEIGHT } from '../src/jardin/engine/growth';
import { countablePests, pestStatuses, pestTasks } from '../src/jardin/engine/pests';
import { autoShopping, bestLot, convert, seedLevel, seedsUsedBy, stockForProduct, stockLevel } from '../src/jardin/engine/stock';
import { ATELIERS, ATELIER_BY_ID } from '../src/ateliers/registry';
import { bedResults, cutFlowers, harvestCandidates, plantResults, seasonReview, wishesFromReview } from '../src/jardin/engine/bilan';
import { cnAdvice, heapCN, heapStatus } from '../src/jardin/engine/compost';
import { coverCredit } from '../src/jardin/engine/nutrition';
import { tankStatus as rainTankStatus } from '../src/jardin/engine/rainTank';
import { bedSurfaceCN, litersToDepth } from '../src/jardin/engine/mulch';
import { clampPos, defaultFootprint, freeArea, layoutBed, neighbours, overlaps } from '../src/jardin/engine/layout';
import { clockHourOf, compassPoint, dayOfYear as doyOfDate, equationOfTime, solarHourAt } from '../src/jardin/engine/sun';
import { SPECIES_TYPES, speciesWithType } from '../src/jardin/data/speciesTypes';
import { seasonalType, speciesOf } from '../src/jardin/engine/crop';
import { plantTitle } from '../src/jardin/format';
import { moonDay, moonPosition } from '../src/jardin/engine/moon';
import { pendingVarieties } from '../src/ateliers/pending';
import { LIGNEE_CROPS } from '../src/jardin/engine/backup';
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

test('catalogue : 85 légumes, 32 aromatiques, 40 fruitiers, 161 fleurs et 12 engrais verts, identifiants uniques', () => {
  ok(VEGETABLES.length + MORE_VEGETABLES.length === 85 && HERBS.length === 32 && ORCHARD.length === 40 && FLOWERS.length === 161 && SPECIES.filter((x) => x.type === 'cover').length === 12 && SPECIES.length === 330, `${VEGETABLES.length} + ${MORE_VEGETABLES.length} + ${HERBS.length} + ${ORCHARD.length} + ${FLOWERS.length} espèces`);
  ok(MORE_VEGETABLES.every((v) => SPECIES_EXTRA[v.id]?.seedTip && MATURE_HEIGHT[v.id] > 0), 'nouveaux légumes : fiches complètes');
  ok(ORCHARD.every((f) => f.type === 'orchard' && f.life === 'perennial' && SPECIES_EXTRA[f.id]?.seedTip && MATURE_HEIGHT[f.id] > 0), 'fruitiers : fiches complètes');
  ok(HERBS.every((h) => h.type === 'herb' && SPECIES_EXTRA[h.id]?.seedTip && MATURE_HEIGHT[h.id] > 0), 'aromatiques : fiches complètes');
  ok(new Set(SPECIES.map((s) => s.id)).size === SPECIES.length, 'doublon');
});

test('catalogue : valeurs cohérentes', () => {
  for (const s of SPECIES) {
    ok(s.stages[0][1] === 0, `${s.id} : premier stade non nul`);
    for (let i = 1; i < s.stages.length; i++) ok(s.stages[i][1] > s.stages[i - 1][1], `${s.id} : stades non triés`);
    ok(s.daysToHarvest[0] <= s.daysToHarvest[1] && s.daysToHarvest[1] <= s.season, `${s.id} : récolte hors saison`);
    ok(s.kc.every((k) => k >= 0.2 && k <= 1.3), `${s.id} : Kc`);
    ok(s.yieldM2[0] < s.yieldM2[1], `${s.id} : rendement`);
    ok(s.pH[0] < s.pH[1] && s.pH[0] >= 4.5 && s.pH[1] <= 8.5, `${s.id} : pH`);
    ok(s.rootDepth >= 0.15 && s.rootDepth <= (s.type === 'orchard' ? 2 : 1), `${s.id} : racines`);
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
  // Tomate dehors : endurcissement d'abord, mise en place une fois les gelées passées ; en serre, plus tôt.
  ok(generateTasks(d, '2026-04-12').some((t) => t.kind === 'nursery' && t.vars.what === 'harden') && !generateTasks(d, '2026-04-12').some((t) => t.kind === 'transplant'), 'endurcissement avant les gelées');
  ok(generateTasks(d, '2026-04-22').some((t) => t.kind === 'transplant'), 'repiquage après les gelées');
  ok(generateTasks(data({ beds: [bed({ kind: 'greenhouse' })], plants: [seedling] }), '2026-04-12').some((t) => t.kind === 'transplant'), 'repiquage en serre sans attendre');
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

test('ateliers : 16 ateliers, cultures reconnues par l’import du jardin', () => {
  ok(ATELIERS.length === 16 && new Set(ATELIERS.map((a) => a.id)).size === 16, 'ids');
  for (const a of ATELIERS) if (a.myVarieties) ok(Boolean(LIGNEE_CROPS[a.myVarieties.crop]) && Boolean(SPECIES_BY_ID[LIGNEE_CROPS[a.myVarieties.crop]]), a.id);
});

test('ateliers : « Mes lignées » ajoutées au jardin sans doublon', () => {
  const store: Record<string, string> = { 'lignee.fraise.myvarieties.v1': JSON.stringify([{ id: 'my-1', name: 'Remontante blanche', species: 'ananassa', variants: [] }, { id: 'my-2', name: 'Remontante blanche', variants: [] }, { name: 'Précoce' }]) };
  (globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => store[k] ?? null } };
  const first = pendingVarieties(ATELIER_BY_ID.fraise, []);
  ok(first.length === 2 && first.every((v) => v.speciesId === 'strawberry' && v.origin === 'lignee:fraise'), `${first.length}`);
  ok(pendingVarieties(ATELIER_BY_ID.fraise, first).length === 0, 'déjà au jardin');
  ok(pendingVarieties(ATELIER_BY_ID.tomate, []).length === 0, 'rien enregistré');
  ok(pendingVarieties(ATELIER_BY_ID.cannabis, []).length === 0, 'cannabis : pas d’espèce au jardin');
  store['lignee.muflier.myvarieties.v1'] = JSON.stringify({ app: 'lignee', crop: 'muflier', kind: 'varieties', version: 1, varieties: [{ id: 'my-m', name: 'Rouge pélorique', species: 'majus', variants: ['sulf', 'cyc', 'dich'], days: 112 }] });
  const muf = pendingVarieties(ATELIER_BY_ID.muflier, []);
  ok(muf.length === 1 && muf[0].speciesId === 'snapdragon' && muf[0].origin === 'lignee:muflier', 'muflier → catalogue fleurs');
  store['lignee.pdsenteur.myvarieties.v1'] = JSON.stringify({ app: 'lignee', crop: 'pdsenteur', kind: 'varieties', version: 1, varieties: [{ id: 'my-p', name: 'Spencer bordeaux', species: 'odoratus', variants: ['wav', 'Bi'], days: 110 }] });
  const pds = pendingVarieties(ATELIER_BY_ID.pdsenteur, []);
  ok(pds.length === 1 && pds[0].speciesId === 'sweetpea' && pds[0].origin === 'lignee:pdsenteur', 'pois de senteur → catalogue fleurs');
  store['lignee.tournesol.myvarieties.v1'] = JSON.stringify({ app: 'lignee', crop: 'tournesol', kind: 'varieties', version: 1, varieties: [{ id: 'my-t', name: 'Rouge nain', species: 'annuus', variants: ['Rd', 'dw'], days: 70 }] });
  const trn = pendingVarieties(ATELIER_BY_ID.tournesol, []);
  ok(trn.length === 1 && trn[0].speciesId === 'sunflower' && trn[0].origin === 'lignee:tournesol', 'tournesol → catalogue fleurs');
  store['lignee.tomato.myvarieties.v1'] = '{corrompu';
  ok(pendingVarieties(ATELIER_BY_ID.tomate, []).length === 0, 'stockage corrompu ignoré');
});

test('types de culture : valeurs cohérentes', () => {
  for (const [id, list] of Object.entries(SPECIES_TYPES)) {
    ok(Boolean(SPECIES_BY_ID[id]), `${id} : espèce inconnue`);
    ok(new Set(list.map((t) => t.id)).size === list.length, `${id} : types en double`);
    for (const t of list) {
      ok(Boolean(t.sowIndoor || t.sowOutdoor || t.plantOut), `${id}/${t.id} : pas de calendrier`);
      ok(t.stages[0][1] === 0, `${id}/${t.id} : premier stade`);
      for (let i = 1; i < t.stages.length; i++) ok(t.stages[i][1] > t.stages[i - 1][1], `${id}/${t.id} : stades non triés`);
      ok(t.stages[t.stages.length - 1][1] <= t.daysToHarvest[0] && t.daysToHarvest[0] <= t.daysToHarvest[1] && t.daysToHarvest[1] <= t.season, `${id}/${t.id} : durées`);
      if (t.sowIndoor) ok(Boolean(t.plantOut), `${id}/${t.id} : semis à l'abri sans plantation`);
      ok(Boolean(t.name.fr && t.name.en && t.note.fr && t.note.en), `${id}/${t.id} : textes`);
    }
  }
});

test('types de culture : l’ail d’automne et l’ail de printemps', () => {
  const autumn = plant({ speciesId: 'garlic', typeId: 'autumn', count: 30, sowDate: '2026-10-20' });
  const spring = plant({ id: 'p2', speciesId: 'garlic', typeId: 'spring', count: 30, sowDate: '2027-02-15' });
  const d = data({ beds: [bed()], plants: [autumn, spring] });
  const ha = timeline(autumn, d, '2026-11-01').harvestFrom;
  const hs = timeline(spring, d, '2027-03-01').harvestFrom;
  ok(ha >= '2027-05-15' && ha <= '2027-07-31', `ail d'automne récolté ${ha}`);
  ok(hs >= '2027-06-15' && hs <= '2027-08-15', `ail rose récolté ${hs}`);
  ok(speciesOf(autumn).plantOut?.[0][0] === 10 && speciesOf(spring).plantOut?.[0][0] === 1, 'calendriers');
  ok(speciesOf({ speciesId: 'garlic' }) === SPECIES_BY_ID.garlic && speciesOf({ speciesId: 'garlic', typeId: 'licorne' }) === SPECIES_BY_ID.garlic, 'sans type : espèce telle quelle');
  ok(speciesWithType(SPECIES_BY_ID.garlic, 'autumn') === speciesWithType(SPECIES_BY_ID.garlic, 'autumn'), 'objet stable (caches)');
});

test('types de culture : type proposé selon la saison', () => {
  ok(seasonalType('garlic', '2026-10-02', 'parisian') === 'autumn', 'ail en octobre');
  ok(seasonalType('garlic', '2027-02-01', 'parisian') === 'spring', 'ail en février');
  ok(seasonalType('onion', '2026-10-02', 'parisian') === 'winterSets', 'oignon en octobre');
  ok(seasonalType('onion', '2027-03-10', 'parisian') === 'springSets', 'oignon en mars');
  ok(seasonalType('shallot', '2026-06-15', 'parisian') !== '', 'hors saison : le prochain type');
  ok(seasonalType('tomato', '2026-04-01', 'parisian') === '', 'espèce sans types');
});

test('types de culture : titre et sauvegarde', () => {
  const p = plant({ speciesId: 'garlic', typeId: 'spring' });
  ok(plantTitle(p, 'fr') === 'Ail rose (de printemps)', plantTitle(p, 'fr'));
  ok(plantTitle({ ...p, varietyName: 'Lautrec' }, 'fr') === 'Ail · Lautrec', 'variété prioritaire');
  const back = parseBackup(serializeBackup(data({ beds: [bed()], plants: [p] }), []));
  ok(back.data.plants[0].typeId === 'spring', 'typeId conservé');
});

test('Lune : phases et lune montante (calcul hors ligne)', () => {
  // Éclipses connues : nouvelle lune 8/4/2024 18 h 21 UTC, pleine lune 14/3/2025 6 h 55 UTC, nouvelle lune 12/8/2026 17 h 37 UTC.
  const off = (iso: string, target: number) => {
    const e = moonPosition(Date.parse(iso)).elong;
    return Math.min(Math.abs(e - target), 360 - Math.abs(e - target));
  };
  ok(off('2024-04-08T18:21:00Z', 0) < 1 && off('2025-03-14T06:55:00Z', 180) < 1 && off('2026-08-12T17:37:00Z', 0) < 1, 'éclipses');
  ok(moonDay('2026-08-01').nextNew === '2026-08-12' && moonDay('2026-03-01').nextFull === '2026-03-03', 'prochaines phases');
  ok(moonDay('2025-03-14').phase === 'full' && moonDay('2026-08-12').phase === 'new', 'nom de la phase');
  let max = 0;
  for (let t = Date.parse('2025-01-01'); t < Date.parse('2026-01-01'); t += 6 * 3600e3) max = Math.max(max, Math.abs(moonPosition(t).dec));
  ok(max > 28 && max < 29.2, `déclinaison max 2025 ${max.toFixed(2)}° (arrêt lunaire majeur)`);
  // Montante puis descendante, en alternance d'environ 13,7 jours.
  const turns: string[] = [];
  let d = '2026-01-01';
  for (let k = 0; k < 6; k++) {
    d = moonDay(d).turnDate;
    turns.push(d);
  }
  const gaps = turns.slice(1).map((x, k) => diffDays(turns[k], x));
  ok(gaps.every((g) => g >= 12 && g <= 15), gaps.join(','));
  ok(moonDay(turns[0]).ascending !== moonDay(turns[1]).ascending, 'alternance');
  ok(DEFAULT_SETTINGS.moon === false, 'désactivé par défaut');
});

test('fleurs : fiches complètes', () => {
  for (const f of FLOWERS) {
    const info = FLOWER_INFO[f.id];
    ok(Boolean(info) && info.bloom.length > 0 && info.colors.length > 0 && info.uses.length > 0, `${f.id} : fiche`);
    ok(info.height[0] > 0 && info.height[0] <= info.height[1], `${f.id} : hauteur`);
    ok(info.uses.every((u) => FLOWER_USES.includes(u)), `${f.id} : usages`);
    ok(f.type === 'flower' && FAMILIES.includes(f.family), `${f.id} : type et famille`);
    const ex = SPECIES_EXTRA[f.id];
    ok(Boolean(ex && ex.seedTip && ex.trueToSeed), `${f.id} : graines`);
    if (ex?.pollination === 'vegetative') ok(ex.trueToSeed === 'no', `${f.id} : multiplication végétative`);
  }
  ok(COMPANIONS.every((c) => SPECIES_BY_ID[c.a] && SPECIES_BY_ID[c.b]), 'associations : espèces connues');
  ok(Boolean(FLOWER_INFO.foxglove.toxic && FLOWER_INFO.daffodil.toxic && FLOWER_INFO.lily.toxic && FLOWER_INFO.sweetpea.toxic), 'toxicité signalée');
  ok(['colchicum', 'lilyofthevalley', 'delphinium', 'hellebore', 'daylily'].every((id) => FLOWER_INFO[id]?.toxic), 'toxicité des nouvelles fleurs');
  ok(['tulip', 'dahlia', 'hyacinth', 'canna', 'ranunculus'].every((id) => FLOWER_INFO[id]?.bulb), 'bulbes repérés');
  ok(FLOWERS.every((f) => FLOWER_INFO[f.id].lift === undefined || f.frost !== 'hardy'), 'à rentrer : seulement des fleurs gélives');
});

test('vivaces et fruitiers : la récolte revient chaque année', () => {
  const app = plant({ id: 'o1', speciesId: 'apple', count: 1, sowDate: '2022-12-01' });
  const rasp = plant({ id: 'o2', speciesId: 'raspberry', count: 5, sowDate: '2024-12-01' });
  const d = data({ beds: [bed()], plants: [app, rasp] });
  const tl = timeline(app, d, '2026-09-01');
  ok(tl.harvestFrom.slice(0, 4) === '2026' || tl.harvestTo.slice(0, 4) === '2026', `pommier ${tl.harvestFrom} → ${tl.harvestTo}`);
  ok(timeline(app, d, '2023-06-01').harvestFrom > '2025-01-01', 'pas de pommes la première année');
  const rt = timeline(rasp, d, '2026-08-05');
  ok(generateTasks(d, '2026-08-05').some((t) => t.kind === 'harvest' && t.plantId === 'o2'), `framboises en août, 2 ans après la plantation (${rt.harvestFrom} → ${rt.harvestTo})`);
});

test('rotation : couleurs du plan et ail après ail', () => {
  const g1 = plant({ id: 'r1', speciesId: 'garlic', count: 40, sowDate: '2024-10-20', endDate: '2025-07-01', status: 'ended' });
  const g2 = plant({ id: 'r2', speciesId: 'onion', count: 60, sowDate: '2026-10-10', status: 'planned' });
  const t1 = plant({ id: 'r3', speciesId: 'tomato', count: 6, sowDate: '2024-03-01', endDate: '2024-10-01', status: 'ended' });
  const ap = plant({ id: 'r4', speciesId: 'apple', count: 1, sowDate: '2023-12-01' });
  const plants = [g1, g2, t1, ap];
  ok(bedGroupOfYear('b1', [g1, g2, t1], 2024) === 'alliums' && bedGroupOfYear('b1', [t1], 2024) === 'solanaceae' && bedGroupOfYear('b1', [g1, g2, t1], 2026) === 'alliums', 'groupe dominant');
  ok(rotationGroup(SPECIES_BY_ID.apple) === 'perennial' && rotationGroup(SPECIES_BY_ID.cosmos) === 'flowers' && rotationGroup(SPECIES_BY_ID.lettuce) === 'leafy', 'groupes');
  ok(bedCropsOfYear('b1', plants, 2026).some((p) => p.id === 'r4'), 'le pommier compte chaque année');
  const issues = bedRotationIssues('b1', plants, 2026);
  ok(issues.length === 1 && issues[0].plant.id === 'r2' && issues[0].warning.previous.id === 'r1', `oignon après ail signalé (${issues.length})`);
});

test('paillage : broyat d’herbe et trèfle, paille, azote crédité', () => {
  const meadow = { id: 'm1', bedId: 'b1', date: '2026-01-15', material: 'meadow' as const, depthCm: 10 };
  const straw = { id: 'm2', bedId: 'b1', date: '2026-01-15', material: 'straw' as const, depthCm: 10 };
  const yr = mulchReleasedM2(meadow, '2026-01-15', '2027-01-15');
  ok(Math.abs(mulchMassKgM2(meadow) - 6) < 1e-9 && yr.N > 15 && yr.N < 25, `broyat 10 cm : ${yr.N.toFixed(1)} g N/m²/an`);
  ok(mulchReleasedM2(straw, '2026-01-15', '2027-01-15').N === 0, 'la paille ne libère pas d’azote');
  const half = mulchReleasedM2(meadow, '2026-01-15', '2026-05-01').N;
  ok(half > yr.N * 0.5 && half < yr.N, `libération rapide au printemps (${half.toFixed(1)} g)`);
  const tom = plant({ id: 'mp', speciesId: 'tomato', count: 4, sowDate: '2026-05-10' });
  const d0 = data({ beds: [bed()], plants: [tom] });
  const d1 = data({ beds: [bed()], plants: [tom], mulches: [meadow] });
  const s0 = nutrientStatus(tom, d0, '2026-07-01');
  const s1 = nutrientStatus(tom, d1, '2026-07-01');
  ok(s1.mulch.N > 0 && s1.applied.N > s0.applied.N && s1.remaining.N < s0.remaining.N, `azote du paillage compté (${s1.mulch.N.toFixed(1)} g)`);
  ok(parseBackup(serializeBackup(d1, [])).data.mulches.length === 1, 'sauvegarde');
});

test('fleurs : floraison, rappels et besoins', () => {
  const cos = plant({ id: 'f1', speciesId: 'cosmos', count: 10, indoor: true, sowDate: '2026-04-01', transplantDate: '2026-05-15' });
  const dah = plant({ id: 'f2', speciesId: 'dahlia', typeId: 'tubers', count: 5, sowDate: '2026-04-20' });
  const tom = plant({ id: 'f3', speciesId: 'tomato', count: 6, sowDate: '2026-03-01' });
  const d = data({ beds: [bed()], plants: [cos, dah, tom] });
  const tl = timeline(cos, d, '2026-08-01');
  ok(tl.harvestFrom >= '2026-06-15' && tl.harvestFrom <= '2026-07-31', `cosmos fleurit ${tl.harvestFrom}`);
  const aug = generateTasks(d, '2026-08-05');
  ok(aug.some((t) => t.kind === 'bloom' && t.plantId === 'f1'), 'rappel fleurs fanées');
  ok(!aug.some((t) => t.kind === 'harvest' && (t.plantId === 'f1' || t.plantId === 'f2')), 'pas de « récolte » pour les fleurs');
  const oct = generateTasks(d, '2026-10-20');
  ok(oct.some((t) => t.kind === 'lift' && t.plantId === 'f2'), 'rentrer les dahlias avant les gelées');
  ok(!generateTasks(d, '2026-07-01').some((t) => t.kind === 'lift'), 'pas de rappel en été');
  const n = needOf(cos).need;
  ok(n.N > 0 && n.N < 20 && n.K2O > n.N, `besoins cosmos N ${n.N.toFixed(1)} g`);
  ok(forecastRows(d, '2026-08-01').every((r) => r.speciesId === 'tomato'), 'prévisions de récolte sans les fleurs');
  ok(hp(cos, d, '2026-08-01') === null, 'pas de récolte cumulée pour une fleur');
});

// --- Bilan de saison ------------------------------------------------------------

test('bilan : fleurs coupées, planches, ce qui a marché', () => {
  const d = demoGarden('2026-07-01');
  const f = cutFlowers(d, 2026);
  ok(f.stems === 65 && f.rows[0].speciesId === 'zinnia', `${f.stems} tiges`);
  const beds = bedResults(d, 2026, '2026-07-01');
  ok(beds.find((b) => b.bedId === 'demo-b2')?.stems === 65, 'tiges sur la planche 2');
  const tom = plant({ id: 't', speciesId: 'tomato', count: 4, sowDate: '2026-03-01', status: 'ended', endDate: '2026-09-30' });
  const car = plant({ id: 'c', speciesId: 'carrot', count: 100, sowDate: '2026-04-01', status: 'ended', endDate: '2026-08-30' });
  const lea = plant({ id: 'l', speciesId: 'leek', count: 50, sowDate: '2026-04-01', status: 'ended', endDate: '2026-09-30' });
  const g = data({
    beds: [bed()],
    plants: [tom, car, lea],
    observations: [
      { id: 'o1', plantId: 't', bedId: 'b1', date: '2026-08-10', note: '', harvestG: 30_000, photoIds: [] },
      { id: 'o2', plantId: 'c', bedId: 'b1', date: '2026-08-20', note: '', harvestG: 200, photoIds: [] },
    ],
    treatments: [{ id: 'tr', plantId: 'c', bedId: 'b1', problemId: 'carrotFly', method: 'manual', date: '2026-06-01' }],
  });
  const res = plantResults(g, 2026, '2026-10-04');
  const rv = seasonReview(res);
  ok(rv.worked.some((r) => r.plant.id === 't'), 'tomates réussies');
  const c = rv.review.find((r) => r.plant.id === 'c');
  ok(Boolean(c && c.verdict === 'poor' && c.causes.includes('problems')), 'carottes décevantes, problème noté');
  ok(rv.review.some((r) => r.plant.id === 'l' && r.causes.includes('unweighed')), 'poireaux jamais pesés');
});

// --- Ombres à l'heure du téléphone ----------------------------------------------------

test('soleil : heure du téléphone → heure solaire', () => {
  ok(Math.abs(equationOfTime(307)) > 15 && Math.abs(equationOfTime(43)) > 13, 'équation du temps (novembre +16 min, février −14 min)');
  const d = new Date(Date.UTC(2026, 5, 21, 12, 0));
  ok(Math.abs(solarHourAt(d, 0) - 12) < 0.05, 'Greenwich, midi UTC ≈ midi solaire');
  ok(Math.abs(solarHourAt(d, 2.35) - 12.13) < 0.05, 'Paris : midi UTC = 12 h 08 solaire');
  const back = clockHourOf(solarHourAt(d, 2.35), doyOfDate(d), 2.35, 2026);
  ok(Math.abs(back - (d.getHours() + d.getMinutes() / 60)) < 0.02, 'aller-retour horloge ↔ soleil');
  ok(compassPoint(180) === 'S' && compassPoint(225) === 'SW' && compassPoint(359) === 'N', 'points cardinaux');
});

// --- Engrais verts, compost, récoltes rapides, jardin d'exemple ---------------------------

test('engrais vert : azote rendu à la culture suivante', () => {
  const vetch = plant({ id: 'v', speciesId: 'commonvetch', count: 1, area: 4, sowDate: '2025-10-01', status: 'ended', endDate: '2026-04-20' });
  const squash = plant({ id: 's', speciesId: 'squash', count: 2, area: 2, sowDate: '2026-04-25', indoor: true, transplantDate: '2026-05-20' });
  const g = data({ beds: [bed()], plants: [vetch, squash] });
  ok(coverCredit(squash, g) === 16, `${coverCredit(squash, g)} g N`);
  ok(coverCredit({ ...squash, bedId: 'b2' }, g) === 0, 'autre planche');
  const tasks = generateTasks(data({ beds: [bed()], plants: [{ ...vetch, status: 'growing', endDate: undefined }] }), '2026-03-25');
  ok(tasks.some((t) => t.kind === 'cover'), 'tâche « faucher »');
});

test('compost : C/N, maturité, tâches', () => {
  const heap = { id: 'h', name: 'Tas', kind: 'heap' as const, started: '2026-03-01', inputs: [{ date: '2026-03-01', material: 'grass' as const, liters: 300 }], turns: [], temps: [] };
  ok(cnAdvice(heapCN(heap)!) === 'tooGreen', `tonte seule : C/N ${heapCN(heap)}`);
  const mixed = { ...heap, inputs: [...heap.inputs, { date: '2026-03-01', material: 'leaves' as const, liters: 400 }] };
  ok(cnAdvice(heapCN(mixed)!) === 'good', `tonte + feuilles : C/N ${heapCN(mixed)}`);
  const slow = heapStatus(mixed, '2026-06-01');
  const fast = heapStatus({ ...mixed, turns: ['2026-04-01', '2026-05-01'], temps: [{ date: '2026-03-20', c: 60 }] }, '2026-06-01');
  ok(fast.readyOn! < slow.readyOn!, 'retourné et chaud : plus vite mûr');
  ok(slow.turnDue, 'à retourner');
  ok(generateTasks(data({ beds: [bed()], compost: [mixed] }), '2026-06-01').some((t) => t.kind === 'compost'), 'tâche compost');
});

test('récolte rapide et jardin d’exemple hors saison', () => {
  const d = demoGarden('2026-07-01');
  const c = harvestCandidates(d, '2026-07-01');
  ok(c.some((x) => x.plant.speciesId === 'zinnia' && x.unit === 'stems'), 'fleurs en floraison');
  ok(c.some((x) => x.plant.speciesId === 'zucchini' && x.unit === 'g'), 'courgettes en récolte');
  const off = demoGarden('2026-10-04');
  ok(off.plants.find((p) => p.speciesId === 'bean')!.sowDate === '2027-05-10', 'haricots au printemps prochain');
  ok(off.plants.filter((p) => p.status === 'ended').length === 4, 'cultures d’été terminées');
  const w = wishesFromReview(off, 2026, '2026-10-04');
  ok(w.some((x) => x.speciesId === 'tomato') && w.length >= 4, `envies ${w.length}`);
});

// --- Disposition sur la planche et voisinages -------------------------------------------

test('disposition : emplacements, place libre, voisins', () => {
  const long = bed({ id: 'L', w: 25, h: 1 });
  const fp = defaultFootprint({ speciesId: 'tomato', count: 6 }, long);
  ok(fp.h === 1 && fp.w > 1, `planche étroite : bande de ${fp.w} × ${fp.h} m`);
  const tom = plant({ id: 't', speciesId: 'tomato', bedId: 'L', count: 6 });
  const pot = plant({ id: 'p', speciesId: 'potato', bedId: 'L', count: 10, pos: { x: 20, y: 0, w: 3, h: 1 } });
  const bas = plant({ id: 'b', speciesId: 'basil', bedId: 'L', count: 4 });
  const g = data({ beds: [long], plants: [tom, pot, bas] });
  const laid = layoutBed(g, long);
  ok(laid.length === 3 && laid.find((l) => l.plant.id === 'p')!.auto === false && laid.find((l) => l.plant.id === 'p')!.pos.x === 20 && laid.filter((l) => l.auto).every((l) => l.pos.x < 5), 'placés à gauche, la pomme de terre reste où on l’a mise');
  ok(overlaps(laid).length === 0, 'aucun chevauchement');
  ok(Math.abs(freeArea(long, laid) - (25 - laid.reduce((s, l) => s + l.pos.w * l.pos.h, 0))) < 0.05, 'surface libre');
  const n = neighbours(g);
  ok(n.some((x) => x.effect === 'good' && [x.a.id, x.b.id].sort().join() === 'b,t'), 'tomate + basilic voisins');
  ok(!n.some((x) => x.effect === 'bad'), 'pomme de terre loin des tomates : pas d’alerte');
  const g2 = data({ beds: [long], plants: [tom, { ...pot, pos: { x: 2.5, y: 0, w: 3, h: 1 } }] });
  ok(neighbours(g2).some((x) => x.effect === 'bad'), 'pomme de terre collée aux tomates : alerte');
  ok(clampPos({ x: 30, y: 2, w: 2, h: 3 }, long).x === 23 && clampPos({ x: 30, y: 2, w: 2, h: 3 }, long).h === 1, 'reste dans la planche');
});

test('récupérateur d’eau : pluie sur le toit, arrosages puisés, débordement', () => {
  const tank = { id: 'rt', name: 'Cuve', capacityL: 300, roofM2: 20, level: 100, since: '2026-06-01' };
  const g = data({
    beds: [bed()],
    rainTanks: [tank],
    water: [
      { id: 'r1', kind: 'rain', amount: 10, date: '2026-06-02' },
      { id: 'i1', kind: 'irrigation', amount: 50, bedId: 'b1', date: '2026-06-03', tankId: 'rt' },
      { id: 'i2', kind: 'irrigation', amount: 40, bedId: 'b1', date: '2026-06-03' },
      { id: 'r2', kind: 'rain', amount: 30, date: '2026-06-04' },
    ],
    settings: { ...DEFAULT_SETTINGS, onboarded: true, rainSource: 'manual' },
  });
  const st = rainTankStatus(tank, g, '2026-06-05');
  ok(st.history[0].level === 260, `pluie de 10 mm : 100 + 160 L = ${st.history[0].level}`);
  ok(st.history[1].level === 210, 'arrosage puisé dans la cuve (pas celui au réseau)');
  ok(st.level === 300 && st.overflowL === 390, `pleine et débordement ${st.overflowL} L`);
});

test('carré en compostage en place : restes de cuisine et broyat', () => {
  const sq = bed({ id: 'sq', w: 1.2, h: 1.2 });
  ok(litersToDepth(14.4, sq) === 1, '14,4 L sur 1,44 m² = 1 cm');
  const g = data({ beds: [sq], mulches: [{ id: 'm1', bedId: 'sq', date: '2026-05-01', material: 'kitchen', depthCm: 2 }] });
  ok(bedSurfaceCN(sq, g, '2026-06-01')!.cn < 22, 'restes seuls : trop vert');
  const g2 = data({ beds: [sq], mulches: [...g.mulches, { id: 'm2', bedId: 'sq', date: '2026-05-02', material: 'woodChips', depthCm: 4 }] });
  ok(bedSurfaceCN(sq, g2, '2026-06-01')!.cn > bedSurfaceCN(sq, g, '2026-06-01')!.cn, 'broyat : rééquilibre');
});

test('synchronisation PC ↔ téléphone : réglages partagés et propres à l’appareil', () => {
  const phone = data({ beds: [bed()], settings: { ...DEFAULT_SETTINGS, onboarded: true, planW: 15, notify: true, author: 'Joel', sync: { url: 'http://pc:8787', code: 'ABCD-1234' } } });
  const pcFresh = data({ settings: { ...DEFAULT_SETTINGS, onboarded: false } });
  // Un PC neuf adopte le jardin et ses réglages, mais garde les siens pour l'appareil.
  const a = mergeSynced(pcFresh, phone).data;
  ok(a.settings.onboarded && a.settings.planW === 15 && a.beds.length === 1, 'PC neuf : jardin et réglages adoptés');
  ok(!a.settings.notify && a.settings.author === undefined && a.settings.sync === undefined, 'notifications, auteur et connexion restent propres à l’appareil');
  // Une modification des réglages partagés est datée et l'emporte de l'autre côté.
  const edited = stampChanges(a, { ...a, settings: { ...a.settings, planW: 18 } }, '2026-10-04T18:00:00Z', undefined);
  ok(edited.settingsMod === '2026-10-04T18:00:00Z', 'réglage partagé daté');
  const back = mergeSynced(phone, edited).data;
  ok(back.settings.planW === 18 && back.settings.notify && back.settings.sync?.code === 'ABCD-1234', 'le téléphone reçoit la nouvelle taille et garde sa connexion');
  // Changer un réglage propre à l'appareil ne date pas les réglages partagés.
  const n = stampChanges(back, { ...back, settings: { ...back.settings, notifyHour: 6 } }, '2026-10-04T19:00:00Z', undefined);
  ok(n.settingsMod === back.settingsMod, 'heure des notifications : pas de date partagée');
  // L'ancien réglage ne revient pas écraser le récent.
  ok(mergeSynced(edited, phone).data.settings.planW === 18, 'les réglages les plus récents gagnent');
});

test('maison à toit à deux pans : ombre plus courte qu’un bloc plein', () => {
  // Maison 14 × 8 m (grand côté est-ouest), gouttière 3 m, faîtage 7 m ; soleil plein sud à 30°.
  const box = { id: 'h', name: 'Maison', kind: 'building' as const, x: 0, y: 10, w: 14, h: 8, height: 7 };
  const gable = { ...box, roof: 'gable' as const, eaveHeight: 3 };
  const sun = { alt: 30, az: 180 };
  ok(heightAt(gable, 7, 14) === 7 && heightAt(gable, 7, 10) === 3 && Math.abs(heightAt(gable, 7, 12) - 5) < 1e-9, 'hauteur : 3 m à la gouttière, 7 m au faîtage');
  // Ombre au nord : bloc plein ≈ 12,1 m, toit à deux pans ≈ 8,1 m (le faîtage est à 4 m en retrait).
  ok(inShadow(7, 10 - 10, sun, [box], 0) && !inShadow(7, 0, sun, [gable], 0), 'à 10 m au nord : ombre du bloc, soleil avec le toit');
  ok(inShadow(7, 10 - 7, sun, [gable], 0), 'à 7 m au nord : toujours à l’ombre du faîtage');
  ok(!inShadow(7, 10 - 8.5, sun, [gable], 0), 'à 8,5 m : au soleil');
  // Faîtage dans l'autre sens : pignon face au soleil, l'ombre du faîtage s'allonge au milieu.
  const turned = { ...gable, ridge: 'short' as const };
  ok(inShadow(7, 0, sun, [turned], 0) && !inShadow(0.5, 0, sun, [turned], 0), 'faîtage nord-sud : longue ombre au milieu, courte au bord');
  const area = (p: Array<[number, number]>) => Math.abs(p.reduce((s, [x, y], i) => s + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0)) / 2;
  const reach = (p: Array<[number, number]>) => 10 - Math.min(...p.map(([, y]) => y));
  ok(Math.abs(reach(shadowPolygon(gable, sun, 0)) - 8.12) < 0.05 && Math.abs(reach(shadowPolygon(box, sun, 0)) - 12.12) < 0.05, `ombre dessinée : ${reach(shadowPolygon(gable, sun, 0)).toFixed(1)} m au lieu de ${reach(shadowPolygon(box, sun, 0)).toFixed(1)} m`);
  ok(area(shadowPolygon(gable, sun, 0)) < area(shadowPolygon(box, sun, 0)), 'ombre dessinée plus petite');
  ok(!inShadow(7, 30, sun, [gable], 0) && !inShadow(20, 5, sun, [gable], 0), 'au sud et à côté : soleil');
});

test('coin semis : levée, godets, endurcissement, mise en place', () => {
  const tom = plant({ id: 'n1', indoor: true, sowDate: '2026-03-01' });
  const d = data({ beds: [bed()], plants: [tom], settings: { ...DEFAULT_SETTINGS, climate: 'parisian' } });
  const s0 = nurseryStatus(tom, d, '2026-03-05');
  ok(s0.stage === 'sown' && s0.germFrom === '2026-03-07' && s0.germTo === '2026-03-13' && !s0.noGerm, `semé : levée attendue du ${s0.germFrom} au ${s0.germTo}`);
  ok(nurseryStatus(tom, d, '2026-03-25').noGerm && generateTasks(d, '2026-03-25').some((t) => t.kind === 'nursery' && t.vars.what === 'noGerm'), 'pas de levée : signalé');
  const up = { ...tom, germDate: '2026-03-09' };
  const d1 = { ...d, plants: [up] };
  const s1 = nurseryStatus(up, d1, '2026-03-15');
  ok(s1.stage === 'seedling' && s1.potUpDue === '2026-03-23', `levée : godets vers le ${s1.potUpDue}`);
  ok(generateTasks(d1, '2026-03-22').some((t) => t.kind === 'nursery' && t.vars.what === 'potUp'), 'tâche de repiquage en godets');
  const potted = { ...up, potUpDate: '2026-03-24' };
  const s2 = nurseryStatus(potted, { ...d, plants: [potted] }, '2026-04-01');
  ok(s2.stage === 'potted' && s2.frostDelay && s2.outDate >= '2026-04-01', `en godets ; dehors après les gelées (${s2.outDate})`);
  ok(nurseryStatus(potted, { ...d, plants: [potted] }, addDays(s2.outDate, -3)).stage === 'hardening' && nurseryStatus(potted, { ...d, plants: [potted] }, s2.outDate).stage === 'ready', 'endurcissement puis prêt');
  // Nuit fraîche annoncée pendant l'endurcissement.
  const day = addDays(s2.outDate, -3);
  const cold = { ...d, plants: [potted], weather: { lat: 48.8, lon: 2.3, fetchedAt: `${day}T06:00:00Z`, days: [{ date: addDays(day, 1), tmax: 15, tmin: 4, rain: 0, et0: 2, wind: 10, gust: 20 }] } };
  ok(nurseryStatus(potted, cold, day).coldNight?.tmin === 4 && generateTasks(cold, day).some((t) => t.vars.what === 'hardenCold'), 'nuit à 4 °C : rentrer les plants');
  // Une ancienne culture à l'abri sans levée notée n'est pas signalée comme ratée.
  ok(!nurseryStatus(tom, d, '2026-04-20').noGerm, 'levée supposée après un mois');
  // À semer en ce moment.
  const { now } = sowIndoorNow(d, '2026-03-10', SPECIES);
  ok(now.some((s) => s.id === 'tomato') && !now.some((s) => s.id === 'carrot'), 'tomate à semer à l’abri en mars, pas la carotte');
});

test('fleurs : variétés du commerce et bulbes de chaque saison', () => {
  for (const [id, list] of Object.entries(FLOWER_VARIETIES)) {
    ok(Boolean(SPECIES_BY_ID[id]) && FLOWER_INFO[id]?.bulb === true, `variétés rattachées à un bulbe connu : ${id}`);
    ok(list.every((v) => v.colors.length > 0 && v.note.fr && v.note.en) && new Set(list.map((v) => v.name)).size === list.length, `${id} : couleurs, notes, noms uniques`);
  }
  const bulbs = SPECIES.filter((s) => FLOWER_INFO[s.id]?.bulb);
  const season = (months: number[]) => bulbs.filter((s) => FLOWER_INFO[s.id].bloom.some(([a, b]) => months.some((m) => (a <= b ? m >= a && m <= b : m >= a || m <= b))));
  ok(season([12, 1, 2]).length >= 4 && season([9, 10, 11]).length >= 4 && season([3, 4, 5]).length >= 10 && season([6, 7, 8]).length >= 6, 'des bulbes pour chaque saison');
});

test('flore de France (BDTFX) : recherche, synonymes, lien avec le catalogue', () => {
  const flore = addCatalogNames(buildFlore(JSON.parse(readFileSync(new URL('../src/jardin/data/flore.json', import.meta.url), 'utf8')) as FloreData, FLORE_ALIASES), SPECIES);
  ok(flore.unresolved.length === 0, `noms courants tous rattachés ${flore.unresolved.join(', ')}`);
  ok(searchFlore(flore, 'trefle')[0]?.taxon.sci === 'Trifolium repens' && searchFlore(flore, 'plantain lanc')[0]?.taxon.sci === 'Plantago lanceolata', 'noms courants en tête');
  ok(searchFlore(flore, 'tomate')[0]?.taxon.sci === 'Solanum lycopersicum', 'noms du catalogue');
  ok(flore.taxa.length > 20000 && flore.taxa.every((t) => t.family && t.family !== '?'), `${flore.taxa.length} plantes, toutes avec une famille`);
  const rep = searchFlore(flore, 'trifolium repens')[0];
  ok(rep?.taxon.sci === 'Trifolium repens' && rep.taxon.family === 'Fabaceae' && rep.taxon.native && rep.taxon.present, 'trèfle blanc : Fabaceae, indigène');
  ok(searchFlore(flore, 'pissenlit').some((h) => h.taxon.sci.startsWith('Taraxacum')), 'pissenlit par son nom français');
  ok(searchFlore(flore, 'ortie dioique')[0]?.taxon.sci === 'Urtica dioica', 'sans accents');
  const old = searchFlore(flore, 'Lycopersicon esculentum')[0];
  ok(old?.taxon.sci === 'Solanum lycopersicum' && Boolean(old.via), 'tomate trouvée par son ancien nom');
  const links = catalogLinks(flore, SPECIES);
  ok(links.get(old!.taxon.nn)?.id === 'tomato' && links.size > 100, `${links.size} espèces du catalogue reliées à la flore`);
  ok(searchFlore(flore, 'x').length === 0, 'au moins 2 lettres');
});

if (failed) {
  console.log(`\n${failed} test(s) en échec`);
  process.exit(1);
}
console.log('\nTous les tests passent');
