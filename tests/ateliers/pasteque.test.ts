/* Tests du moteur pastèque : npm test */
import { WmEngine, kosambi, sizeClassOf } from '../../src/ateliers/pasteque/engine/pasteque/engine.ts';
import { WM_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/pasteque/engine/pasteque/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/pasteque/engine/pasteque/loci.ts';
import { runProgram } from '../../src/ateliers/pasteque/engine/pasteque/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/pasteque/engine/pasteque/garden.ts';
import { wmNutrientPlan } from '../../src/ateliers/pasteque/engine/pasteque/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new WmEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const frac = <T,>(list: T[], f: (x: T) => boolean) => list.filter(f).length / list.length;

// 1. Catalogue
check(`catalogue (${WM_VARIETIES.length} variétés)`, WM_VARIETIES.length >= 55);
check('ids uniques', new Set(WM_VARIETIES.map((v) => v.id)).size === WM_VARIETIES.length);
check('variantes connues', WM_VARIETIES.every((v) => v.variants.every((x) => VARIANT_ALLELE[x])));
check('les 5 espèces sont représentées', new Set(WM_VARIETIES.map((v) => v.species)).size === 5);
check('des triploïdes sans pépins au catalogue', WM_VARIETIES.filter((v) => v.ploidy === 3).length >= 2);
let bad = 0;
for (const v of WM_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightKg / v.weightKg;
  const fr = f.pheno.fruits / v.fruits;
  const fixedOk = v.hybrid || e.isFixed(f);
  if (!fixedOk || w < 0.7 || w > 1.4 || Math.abs(f.pheno.fruits - v.fruits) > Math.max(1, v.fruits * 0.4) || Math.abs(f.pheno.brix - v.brix) > 1.3 || Math.abs(f.pheno.days - v.days) > 10) {
    bad++;
    console.log('   écart', v.name, { w: w.toFixed(2), fr: fr.toFixed(2), brix: f.pheno.brix, days: f.pheno.days, fixed: e.isFixed(f) });
  }
}
check('fondateurs fixés et fidèles à leur fiche (nain et triploïdes compris)', bad === 0);

// 2. Apparence
const exp: Array<[string, Partial<ReturnType<typeof e.appearance>>]> = [
  ['crimson-sweet', { flesh: 'red', rind: 'striped', shape: 'round', seed: 'black' }],
  ['charleston-gray', { rind: 'light', shape: 'long' }],
  ['sugar-baby', { rind: 'dark', shape: 'round' }],
  ['yellow-doll', { flesh: 'canary' }],
  ['orangeglo', { flesh: 'orange' }],
  ['golden-honey', { flesh: 'salmon' }],
  ['cream-of-saskatchewan', { flesh: 'white' }],
  ['moon-and-stars', { spotted: true, rind: 'dark', seed: 'tan' }],
  ['golden-midget', { golden: true }],
  ['bush-sugar-baby', { bush: true }],
  ['klondike-striped', { explosive: true }],
  ['egusi', { egusi: true, seed: 'white', flesh: 'white' }],
  ['citron-red-seed', { seed: 'red', flesh: 'white' }],
  ['colocynth', { bitter: true }],
  ['tri-x-313', { seedless: true, ploidy: 3 }],
  ['sugar-baby-gms', { maleSterile: true }],
  ['andro-line', { sex: 'andromonoecious' }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}

// 3. Épistasie de la chair
const f1w = e.cross(F('cream-of-saskatchewan'), F('crimson-sweet'), 20);
check('chair blanche (Wf) × rouge : F1 blanche', f1w.every((x) => e.appearance(x).flesh === 'white'));
const f2w = e.cross(f1w[0], f1w[0], 6000);
check(`F2 : ¾ blanche (${frac(f2w, (x) => e.appearance(x).flesh === 'white').toFixed(3)})`, Math.abs(frac(f2w, (x) => e.appearance(x).flesh === 'white') - 0.75) < 0.02);
const f1y = e.cross(F('early-moonbeam'), F('crimson-sweet'), 20);
check('jaune canari (C) × rouge : F1 jaune', f1y.every((x) => e.appearance(x).flesh === 'canary'));
const f1o = e.cross(F('orangeglo'), F('golden-honey'), 20);
check('orange (y-o) × saumon (y) : F1 orange', f1o.every((x) => e.appearance(x).flesh === 'orange'));
const f2o = e.cross(f1o[0], f1o[0], 6000);
const salmon = frac(f2o, (x) => e.appearance(x).flesh === 'salmon');
check(`F2 orange × saumon : ¼ saumon (${salmon.toFixed(3)})`, Math.abs(salmon - 0.25) < 0.02);
check('rouge × orange : F1 rouge (Y dominant)', e.cross(F('crimson-sweet'), F('orangeglo'), 10).every((x) => e.appearance(x).flesh === 'red'));

// 4. Forme : dominance incomplète 1:2:1
const f1s = e.cross(F('sugar-baby'), F('charleston-gray'), 20);
check('rond × long : F1 ovale', f1s.every((x) => e.appearance(x).shape === 'oval'));
check('vert foncé (G) × vert clair : F1 vert foncé', f1s.every((x) => e.appearance(x).rind === 'dark'));
const f2s = e.cross(f1s[0], f1s[0], 8000);
const shp = ['round', 'oval', 'long'].map((c) => frac(f2s, (x) => e.appearance(x).shape === c));
const chi = shp.reduce((s, o, i) => s + ((o - [0.25, 0.5, 0.25][i]) * 8000) ** 2 / ([0.25, 0.5, 0.25][i] * 8000), 0);
check(`F2 1 rond : 2 ovales : 1 long (χ² = ${chi.toFixed(2)})`, chi < 13.8, shp.map((x) => x.toFixed(3)).join(' '));
check('rayée × vert clair : F1 rayée', e.cross(F('crimson-sweet'), F('charleston-gray'), 10).every((x) => e.appearance(x).rind === 'striped'));

// 5. Liaison Bi–Y (chromosome 1, 25 cM) et indépendance Bi–C
const d = e.createCustom({ label: 'd', species: 'lanatus', variants: ['Bi', 'y', 'C'], targets: {} });
const het = e.cross(d, F('crimson-sweet'), 1)[0];
let rec = 0;
let recU = 0;
const N = 20000;
for (let i = 0; i < N; i++) {
  const g = e.gamete(het);
  if ((g.bi === 'Bi') !== (g.y === 'y')) rec++;
  if ((g.bi === 'Bi') !== (g.c === 'C')) recU++;
}
check(`Bi–Y liés (25 cM) : ${((rec / N) * 100).toFixed(1)} % de recombinants (attendu ${(kosambi(25) * 100).toFixed(1)} %)`, Math.abs(rec / N - kosambi(25)) < 0.012);
check(`Bi (Chr1) et C (Chr4) indépendants : ${(recU / N).toFixed(3)}`, Math.abs(recU / N - 0.5) < 0.015);

// 6. Barrières entre espèces
const cs = F('crimson-sweet');
check('pastèque × égousi : espèces proches', e.crossCheck(cs, F('egusi')).level === 'related');
const lc = e.cross(cs, F('colocynth'), 3000);
check(`pastèque × coloquinte : ~50 % de graines (${(lc.length / 3000).toFixed(2)}), F1 à fertilité réduite`, Math.abs(lc.length / 3000 - 0.5) < 0.04 && lc[0].fertility === 0.35);
check('l’hybride avec la coloquinte est amer (Bi dominant)', lc.every((x) => e.appearance(x).bitter));
check('pastèque × citre : hybrides fertiles à ~75 %', e.cross(cs, F('citron-red-seed'), 5)[0].fertility === 0.75);

// 7. Ploïdie : pastèques sans pépins
const tetra = e.doubleChromosomes(cs);
check('doublement : 4x, fertilité réduite', tetra.ploidy === 4 && tetra.fertility < 1 && e.canPollinate(tetra));
const trip = e.cross(tetra, F('sugar-baby'), 3000);
check(`4x ♀ × 2x ♂ : graines triploïdes (${(trip.length / 3000).toFixed(2)})`, trip.length > 1200 && trip.every((x) => x.ploidy === 3 && x.fertility === 0 && e.appearance(x).seedless));
const rev = e.cross(F('sugar-baby'), tetra, 3000);
check(`2x ♀ × 4x ♂ : presque rien (${rev.length}/3000)`, rev.length < 150);
check('triploïde : ni pollen, ni graines, ni autofécondation', !e.canPollinate(trip[0]) && e.crossCheck(trip[0], cs).level === 'blocked' && e.crossCheck(cs, trip[0]).level === 'blocked' && e.cross(trip[0], trip[0], 10).length === 0);
check('4x × 4x : graines tétraploïdes', e.cross(tetra, tetra, 400).every((x) => x.ploidy === 4));

// 8. Fleurs : gms et andromonoécie
const gms = F('sugar-baby-gms');
check('gms : pas d’autofécondation, mais bonne mère sans castration', e.cross(gms, gms, 10).length === 0 && e.cross(gms, cs, 10).length === 10 && !e.needsEmasculation(gms));
check('monoïque : rien à castrer ; andromonoïque : castration', !e.needsEmasculation(cs) && e.needsEmasculation(F('andro-line')));
const f2g = e.cross(e.cross(gms, cs, 1)[0], e.cross(gms, cs, 1)[0], 4000);
check(`gms récessif : ¼ de mâles stériles en F2 (${frac(f2g, (x) => !e.canPollinate(x)).toFixed(3)})`, Math.abs(frac(f2g, (x) => !e.canPollinate(x)) - 0.25) < 0.02);

// 9. Programme : une Sugar Baby à chair jaune
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 12; i++) {
  const eng = new WmEngine();
  eng.reseed(700 + i);
  const r = runProgram(eng, eng.createFromVariety(V('sugar-baby')), eng.createFromVariety(V('early-moonbeam')), { notBitter: false, flesh: 'canary', rind: 'dark', shape: 'round', resistances: [] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
  gens.push(r.final.generation);
}
check(`programme : Sugar Baby à chair jaune fixée (${ok}/12)`, ok >= 10, gens.join(','));
let okB = 0;
for (let i = 0; i < 6; i++) {
  const eng = new WmEngine();
  eng.reseed(900 + i);
  const r = runProgram(eng, eng.createFromVariety(V('crimson-sweet')), eng.createFromVariety(V('colocynth')), { notBitter: true, flesh: 'red', resistances: [] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && !eng.appearance(r.final).bitter) okB++;
}
check(`programme : éliminer l’amertume après un croisement avec la coloquinte (${okB}/6)`, okB >= 5);
check('programme impossible avec un triploïde', runProgram(e, F('tri-x-313'), cs, { notBitter: false, resistances: ['Fo1'] }).stopped === 'blocked');

// 10. Jardin
const loss = (ind: ReturnType<typeof F>, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, ind, g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('fusariose : Fo-1 protège', loss(cs, 'fusarium', { ...DEFAULT_GARDEN, fusarium: true }) < 0.1 && loss(F('sugar-baby'), 'fusarium', { ...DEFAULT_GARDEN, fusarium: true }) > 0.4);
check('ZYMV : zym protège', loss(F('pi-595203'), 'zymv', { ...DEFAULT_GARDEN, zymv: true }) < 0.1 && loss(cs, 'zymv', { ...DEFAULT_GARDEN, zymv: true }) > 0.3);
check('fruit amer : immangeable', gardenOutcome(e, F('colocynth'), DEFAULT_GARDEN).realizedKg === 0);
check('triploïde sans pollinisateur : pas de fruits', loss(trip[0], 'triploid', { ...DEFAULT_GARDEN, pollinizer: false }) > 0.8 && loss(trip[0], 'triploid') === 0);
check('climat frais : pertes', loss(cs, 'cool', { ...DEFAULT_GARDEN, climate: 'mountain' }) > 0.3);

// 11. Nutriments, classes
const nut = wmNutrientPlan(e, cs);
check('nutriments : la potasse domine', nut.season.K2O > nut.season.N * 1.5 && nut.season.N > 0);
check('classes de taille', sizeClassOf(1.5) === 'mini' && sizeClassOf(25) === 'giant');

// 12. Sauvegarde incomplète
const old = JSON.parse(JSON.stringify(cs));
delete old.genotype.zym;
delete old.haps.fruits;
delete old.ploidy;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.zym) && Array.isArray(n.haps.fruits) && n.ploidy === 2);

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
