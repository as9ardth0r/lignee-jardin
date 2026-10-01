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
  const p = plant({ sowDate: '2026-03-01' });
  const d = data({ beds: [bed()], plants: [p] });
  ok(generateTasks(d, '2026-05-10').some((t) => t.kind === 'feed'), 'proposée');
  const fed = { ...d, applications: [{ id: 'a', bedId: 'b1', productId: 'blood', amount: 30, date: '2026-05-05' }] };
  ok(!generateTasks(fed, '2026-05-10').some((t) => t.kind === 'feed'), 'espacée');
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

if (failed) {
  console.log(`\n${failed} test(s) en échec`);
  process.exit(1);
}
console.log('\nTous les tests passent');
