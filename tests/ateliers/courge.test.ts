/* Tests du moteur courge : npm test */
import { SquashEngine, sizeClassOf } from '../../src/ateliers/courge/engine/courge/engine.ts';
import { SQUASH_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/courge/engine/courge/varieties.ts';
import { speciesCompat, crossInGarden } from '../../src/ateliers/courge/engine/courge/compat.ts';
import { SPECIES, VARIANT_ALLELE } from '../../src/ateliers/courge/engine/courge/loci.ts';
import { runProgram } from '../../src/ateliers/courge/engine/courge/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/courge/engine/courge/garden.ts';
import { squashNutrientPlan } from '../../src/ateliers/courge/engine/courge/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new SquashEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));

// 1. Catalogue cohérent
check(`catalogue (${SQUASH_VARIETIES.length} variétés)`, SQUASH_VARIETIES.length >= 80);
check('ids uniques', new Set(SQUASH_VARIETIES.map((v) => v.id)).size === SQUASH_VARIETIES.length);
check('toutes les espèces représentées', SPECIES.every((sp) => SQUASH_VARIETIES.some((v) => v.species === sp)));
check('toutes les variantes existent', SQUASH_VARIETIES.every((v) => v.variants.every((x) => VARIANT_ALLELE[x])));
for (const v of SQUASH_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightKg / v.weightKg;
  const okFix = v.hybrid ? true : e.isFixed(f);
  if (!okFix || w < 0.6 || w > 1.6 || Math.abs(f.pheno.days - v.days) > 15) check(`fondateur ${v.name}`, false, `poids ×${w.toFixed(2)} j ${f.pheno.days}/${v.days}`);
}
check('fondateurs fixés et proches de leur fiche', true);

// 2. Apparence
const expect: Array<[string, string, string?]> = [
  ['black-beauty', 'darkgreen', 'elongated'],
  ['patisson-blanc', 'white', 'disc'],
  ['waltham-butternut', 'tan', 'butternut'],
  ['longue-de-nice', 'tan', 'crookneck'],
  ['rouge-vif-detampes', 'red', 'flat'],
  ['blue-hubbard', 'blue', 'oval'],
  ['galeux-deysines', 'pink', 'flat'],
  ['spaghetti', 'yellow', 'oval'],
  ['musquee-de-provence', 'tan', 'flat'],
  ['potimarron', 'red', 'round'],
  ['long-of-naples', 'darkgreen', 'crookneck'],
  ['courge-de-siam', 'green', 'oval'],
  ['connecticut-field', 'orange', 'round'],
  ['buttercup', 'darkgreen', 'turban'],
  ['sucrine-du-berry', 'tan', 'pear'],
];
for (const [id, color, shape] of expect) {
  const a = e.appearance(F(id));
  check(`${id} = ${color}${shape ? ' / ' + shape : ''}`, a.rind === color && (!shape || a.shape === shape), `${a.rind} / ${a.shape}`);
}
check('Galeux verruqueux', e.appearance(F('galeux-deysines')).warty);
check('Yellow Crookneck verruqueux (Wt + Hr)', e.appearance(F('yellow-crookneck')).warty);
check('Styrie : graines nues', e.appearance(F('styrie')).hullless);
check('Delicata rayée', e.appearance(F('delicata')).striped);
check('coloquinte amère', e.isBitter(F('coloquinte-bicolore')));
check('courgettes non amères', !e.isBitter(F('black-beauty')));

// 3. Barrières entre espèces
check('pepo × maxima refusé', speciesCompat('pepo', 'maxima').level === 'blocked' && e.cross(F('black-beauty'), F('potimarron'), 50).length === 0);
check('courge de Siam isolée', SPECIES.filter((s) => s !== 'ficifolia').every((s) => speciesCompat('ficifolia', s).level === 'blocked' && speciesCompat(s, 'ficifolia').level === 'blocked'));
check('moschata ♀ × pepo ♂ : pas de graines', e.cross(F('waltham-butternut'), F('black-beauty'), 100).length === 0);
let tetsu = 0;
let f1mm: ReturnType<typeof e.cross> = [];
for (let i = 0; i < 20; i++) {
  const r = e.cross(F('delica'), F('waltham-butternut'), 20);
  tetsu += r.length;
  f1mm = f1mm.concat(r);
}
const rate = tetsu / 400;
check(`maxima ♀ × moschata ♂ : ~25 % de graines (${(rate * 100).toFixed(0)} %)`, rate > 0.18 && rate < 0.32);
check('hybride maxima × moschata stérile', f1mm.every((x) => x.fertility === 0 && x.hybridWith === 'moschata'));
check('hybride stérile : autofécondation refusée', e.crossCheck(f1mm[0], f1mm[0]).reason === 'sterileHybrid' && e.cross(f1mm[0], f1mm[0], 20).length === 0);
check('Tetsukabuto du catalogue stérile', F('tetsukabuto').fertility === 0 && e.crossCheck(F('tetsukabuto'), F('delica')).level === 'blocked');
const am = e.cross(F('green-striped-cushaw'), F('waltham-butternut'), 400);
check(`argyrosperma ♀ × moschata ♂ : ~50 % (${((am.length / 400) * 100).toFixed(0)} %)`, am.length > 160 && am.length < 240);
const am2 = e.cross(am[0], am[1], 400);
check(`F2 argyrosperma × moschata : fertilité réduite (${am2.length}/400)`, am2.length > 80 && am2.length < 300);
check('seul ce couple se croise au jardin', crossInGarden('moschata', 'argyrosperma') && !crossInGarden('pepo', 'maxima') && crossInGarden('pepo', 'pepo'));
check('même espèce : toutes les graines', e.cross(F('black-beauty'), F('styrie'), 30).length === 30);

// 4. Amertume dominante (danger des coloquintes)
const f1b = e.cross(F('black-beauty'), F('coloquinte-bicolore'), 30);
check('courgette × coloquinte : toute la F1 amère', f1b.every((x) => e.isBitter(x)));
check('prédiction : 100 % amère', e.predict(F('black-beauty'), F('coloquinte-bicolore')).find((p) => p.variant === 'Bi')?.pExpressed === 1);
const f2b = e.cross(f1b[0], f1b[0], 4000);
const pb = f2b.filter((x) => e.isBitter(x)).length / f2b.length;
check(`F2 : ¾ amères (${pb.toFixed(3)})`, Math.abs(pb - 0.75) < 0.03);

// 5. Dominances incomplètes
const f1bu = e.cross(F('black-beauty'), F('styrie'), 10);
check('Bu/bu = semi-buissonnant', f1bu.every((x) => e.bushLevel(x) === 'semi'));
const f1bl = e.cross(F('blue-hubbard'), F('delica'), 10);
check('Bl/bl = gris', f1bl.every((x) => e.appearance(x).rind === 'grey'));
const f2bl = e.cross(f1bl[0], f1bl[0], 4000);
const pbl = f2bl.filter((x) => e.appearance(x).rind === 'blue').length / f2bl.length;
check(`F2 : ¼ bleues (${pbl.toFixed(3)})`, Math.abs(pbl - 0.25) < 0.025);

// 6. Ségrégation 9:3:3:1 (graines nues n × disque Di)
const f1nd = e.cross(F('styrie'), F('patisson-blanc'), 5)[0];
const f2nd = e.cross(f1nd, f1nd, 4000);
const cls = [0, 0, 0, 0];
for (const x of f2nd) {
  const a = e.appearance(x);
  cls[(a.shape === 'disc' ? 0 : 2) + (a.hullless ? 1 : 0)]++;
}
const exp = [9, 3, 3, 1].map((k) => (k / 16) * f2nd.length);
const chi2 = cls.reduce((s, o, i) => s + (o - exp[i]) ** 2 / exp[i], 0);
check(`F2 disque × graines nues 9:3:3:1 (χ² = ${chi2.toFixed(2)})`, chi2 < 11.3, cls.join(':'));

// 7. Programme de sélection : courgette buissonnante à graines nues, vert foncé, non amère
let okProg = 0;
const gens: number[] = [];
for (let i = 0; i < 20; i++) {
  const eng = new SquashEngine(20260930);
  eng.reseed(1000 + i);
  const r = runProgram(eng, eng.createFromVariety(V('black-beauty')), eng.createFromVariety(V('styrie')), { notBitter: true, resistances: [], hullless: true, bush: true, color: 'darkgreen' }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) okProg++;
  gens.push(r.final.generation);
}
check(`programme : courgette à graines nues fixée (${okProg}/20)`, okProg >= 16, gens.join(','));
const rb = runProgram(e, F('black-beauty'), F('potimarron'), { notBitter: true, resistances: [] });
check('programme pepo × maxima : arrêt « impossible »', rb.stopped === 'blocked');
const rs = runProgram(e, F('delica'), F('waltham-butternut'), { notBitter: true, resistances: [], minBrix: 11 }, { familySize: 40 });
check('programme maxima × moschata : arrêt « F1 stérile »', rs.stopped === 'sterile');

// 8. Jardin
const pmHom = e.createCustom({ label: 'pm', species: 'pepo', variants: ['Pm0', 'Bu', 'D'], targets: { days: e.unitOfValue('days', 55) } });
const pmNo = e.createCustom({ label: 'no', species: 'pepo', variants: ['Bu', 'D'], targets: { days: e.unitOfValue('days', 55) } });
const mildew = (x: typeof pmNo) => gardenOutcome(e, x, DEFAULT_GARDEN).losses.find((l) => l.cause === 'mildew')?.pct ?? 0;
check('oïdium : Pm-0 réduit la perte', mildew(pmHom) < mildew(pmNo) * 0.3, `${mildew(pmNo)} → ${mildew(pmHom)}`);
const mountain = gardenOutcome(e, F('atlantic-giant'), { ...DEFAULT_GARDEN, climate: 'mountain' });
check('montagne : la géante ne mûrit pas toute', (mountain.losses.find((l) => l.cause === 'season')?.pct ?? 0) > 0.4);
const vir = gardenOutcome(e, F('nigerian-local'), { ...DEFAULT_GARDEN, virus: true }).losses.find((l) => l.cause === 'virus')!;
check('virus : Zym protège', vir.protectedBy === true && vir.pct < 0.05);
const serre = gardenOutcome(e, F('black-beauty'), { ...DEFAULT_GARDEN, climate: 'greenhouse' }).losses.find((l) => l.cause === 'pollination');
const serreMain = gardenOutcome(e, F('black-beauty'), { ...DEFAULT_GARDEN, climate: 'greenhouse', handPollination: true }).losses.find((l) => l.cause === 'pollination');
check('serre : pollinisation à la main utile', (serre?.pct ?? 0) > 0.3 && !serreMain);

// 9. Nutriments
const nut = squashNutrientPlan(e, F('rouge-vif-detampes'));
check('nutriments : K₂O > N (courges gourmandes en potasse)', nut.season.K2O > nut.season.N, JSON.stringify(nut.season));
check('tailles', sizeClassOf(0.3) === 'mini' && sizeClassOf(90) === 'giant');

// 10. Reprise d'une sauvegarde incomplète
const old = JSON.parse(JSON.stringify(F('potimarron')));
delete old.haps.ribs;
delete old.genotype.tu;
delete old.fertility;
const n = e.normalize(old);
check('normalisation', n.fertility === 1 && Array.isArray(n.genotype.tu) && Array.isArray(n.haps.ribs));

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
