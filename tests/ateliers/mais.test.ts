/* Tests du moteur maïs : npm test */
import { MzEngine, kosambi, sizeClassOf, INBRED_VIGOR } from '../../src/ateliers/mais/engine/mais/engine.ts';
import { MZ_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/mais/engine/mais/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/mais/engine/mais/loci.ts';
import { runProgram } from '../../src/ateliers/mais/engine/mais/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/mais/engine/mais/garden.ts';
import { mzNutrientPlan } from '../../src/ateliers/mais/engine/mais/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new MzEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const frac = <T,>(list: T[], f: (x: T) => boolean) => list.filter(f).length / list.length;
const col = (m: ReturnType<typeof F>, x: ReturnType<typeof F>) => e.kernelOf(m.genotype, x.genotype);

// 1. Catalogue
check(`catalogue (${MZ_VARIETIES.length} variétés)`, MZ_VARIETIES.length >= 55);
check('ids uniques', new Set(MZ_VARIETIES.map((v) => v.id)).size === MZ_VARIETIES.length);
check('variantes connues', MZ_VARIETIES.every((v) => [...v.variants, ...(v.het ?? [])].every((x) => VARIANT_ALLELE[x])));
check('les 5 espèces sont représentées', new Set(MZ_VARIETIES.map((v) => v.species)).size === 5);
let bad = 0;
for (const v of MZ_VARIETIES) {
  const f = e.createFromVariety(v);
  const r = (a: number, b: number) => a / b;
  const ear = r(f.pheno.earCm, v.earCm);
  const k = r(f.pheno.kernel100, v.kernel100);
  const h = r(f.pheno.heightCm, v.heightCm);
  const fixedOk = v.inbred ? e.isFixed(f) : !e.isFixed(f) && e.vigor(f) > 0.85;
  if (!fixedOk || ear < 0.72 || ear > 1.38 || k < 0.75 || k > 1.33 || h < 0.75 || h > 1.33 || Math.abs(f.pheno.ears - v.ears) > Math.max(1, v.ears * 0.4) || Math.abs(f.pheno.days - v.days) > 10) {
    bad++;
    console.log('   écart', v.name, { ear: ear.toFixed(2), k: k.toFixed(2), h: h.toFixed(2), ears: f.pheno.ears, days: f.pheno.days, fixed: e.isFixed(f), vigor: e.vigor(f).toFixed(2) });
  }
}
check('fondateurs fidèles (lignées fixées, populations hétérozygotes et vigoureuses)', bad === 0);

// 2. Apparence
const exp: Array<[string, Record<string, unknown>]> = [
  ['b73', { color: 'yellow' }],
  ['w22', { color: 'purple' }],
  ['hopi-blue', { color: 'blue' }],
  ['bloody-butcher', { color: 'red' }],
  ['stock-pvv', { color: 'variegated' }],
  ['stock-ci', { color: 'yellow' }],
  ['stock-bz1', { color: 'bronze' }],
  ['stock-pr1', { color: 'red' }],
  ['boone-county-white', { color: 'white' }],
  ['stock-b1pl1', { plant: 'purple' }],
  ['parviglumis', { branched: true, fruitCase: 'encased' }],
  ['wf9-cmst', { maleSterile: true }],
  ['strawberry-pop', { popBarrier: true }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}
check('textures', e.appearance(F('golden-bantam')).kernel.texture === 'sugary' && e.appearance(F('illini-xtra-sweet')).kernel.texture === 'shrunken' && e.appearance(F('waxy-nuo')).kernel.texture === 'waxy' && e.appearance(F('obatanpa')).kernel.texture === 'opaque');

// 3. Xénie : l’épi de la mère montre le génotype des grains
const b73 = F('b73');
const w22 = F('w22');
const ear1 = e.cross(b73, w22, 200);
check('xénie : B73 (jaune) ♀ × W22 (violet) ♂ → épi de grains violets', ear1.every((x) => col(b73, x).aleurone === 'purple'));
const bb = F('bloody-butcher');
const ear2 = e.cross(bb, w22, 50);
check('péricarpe = tissu maternel : Bloody Butcher ♀ × W22 → épi rouge quand même', ear2.every((x) => col(bb, x).pericarp === 'red'));
const f1 = ear1[0];
const f2 = e.cross(f1, f1, 6000);
const purple = frac(f2, (x) => col(f1, x).aleurone === 'purple');
check(`épi F2 (R1/r1 autofécondé) : ¾ violets (${purple.toFixed(3)})`, Math.abs(purple - 0.75) < 0.02);
// 9:7 (A1 r1 × a1 R1)
const p1 = e.createCustom({ label: 'a', species: 'mays', variants: [], targets: {} });
const p2 = e.createCustom({ label: 'b', species: 'mays', variants: ['a1', 'R1'], targets: {} });
const h = e.cross(p1, p2, 1)[0];
check('A1 r1 × a1 R1 : F1 violette (complémentation)', col(h, h).aleurone === 'purple');
const f2b = e.cross(h, h, 8000);
const p97 = frac(f2b, (x) => col(h, x).aleurone === 'purple');
check(`F2 9 violets : 7 incolores (${p97.toFixed(3)})`, Math.abs(p97 - 9 / 16) < 0.02);
const sweet = F('golden-bantam');
const sx = e.cross(sweet, F('reids-yellow-dent'), 100);
check('maïs doux pollinisé par un denté : grains normaux (xénie au potager)', sx.every((x) => col(sweet, x).texture === 'normal'));
const bic = F('peaches-cream');
const bicEar = e.cross(bic, bic, 4000);
const white = frac(bicEar, (x) => col(bic, x).endosperm === 'white');
check(`maïs bicolore Y1/y1 : ¼ de grains blancs sur l’épi (${white.toFixed(3)})`, Math.abs(white - 0.25) < 0.02);

// 4. Liaisons : a1–sh2 (1 cM) et c1–wx1 (30 cM)
const s = F('stock-a1-sh2');
const hs = e.cross(w22, s, 1)[0];
let rec = 0;
let recW = 0;
const N = 20000;
for (let i = 0; i < N; i++) {
  const g = e.gamete(hs);
  if ((g.a1 === 'a1') !== (g.sh2 === 'sh2')) rec++;
}
check(`a1–sh2 : ${((rec / N) * 100).toFixed(2)} % de recombinants (≈ ${(kosambi(1) * 100).toFixed(1)} %)`, Math.abs(rec / N - kosambi(1)) < 0.004);
const hw = e.cross(w22, F('stock-c1-wx1'), 1)[0];
for (let i = 0; i < N; i++) {
  const g = e.gamete(hw);
  if ((g.c1 === 'c1') !== (g.wx1 === 'wx1')) recW++;
}
const r1 = kosambi(5);
const r2 = kosambi(25);
const expCW = r1 * (1 - r2) + r2 * (1 - r1);
check(`c1–wx1 (via bz1) : ${((recW / N) * 100).toFixed(1)} % (≈ ${(expCW * 100).toFixed(1)} %)`, Math.abs(recW / N - expCW) < 0.012);

// 5. P1-vv instable
const pv = F('stock-pvv');
const rev = e.cross(pv, pv, 20000);
const red = frac(rev, (x) => x.genotype.p1.includes('Prr'));
check(`P1-vv : ~2 % de descendants porteurs d’un P1-rr réverté (${(red * 100).toFixed(2)} %)`, red > 0.012 && red < 0.03);

// 6. Hétérosis et dépression de consanguinité
const mo = F('mo17');
const hyb = e.cross(b73, mo, 200);
const meanY = (l: typeof hyb) => l.reduce((a, x) => a + e.yieldKg(x), 0) / l.length;
const yH = meanY(hyb);
check(`hétérosis : B73 × Mo17 rend bien plus que ses parents (${(yH * 1000).toFixed(0)} g vs ${(e.yieldKg(b73) * 1000).toFixed(0)} / ${(e.yieldKg(mo) * 1000).toFixed(0)} g)`, yH > 1.4 * Math.max(e.yieldKg(b73), e.yieldKg(mo)));
const f2h = e.cross(hyb[0], hyb[0], 300);
check(`la F2 retombe (${(meanY(f2h) * 1000).toFixed(0)} g)`, meanY(f2h) < yH * 0.93);
const op = F('reids-yellow-dent');
let line = op;
for (let i = 0; i < 6; i++) line = e.cross(line, line, 1)[0];
check(`dépression de consanguinité : Reid’s après 6 autofécondations (vigueur ${e.vigor(line).toFixed(2)})`, e.vigor(line) < 0.75 && e.vigor(op) > 0.97 && INBRED_VIGOR < 0.7);

// 7. Stérilité mâle cytoplasmique T
const cms = F('wf9-cmst');
check('cms-T : pas d’autofécondation, mais bonne mère', e.cross(cms, cms, 10).length === 0 && e.cross(cms, mo, 10).length === 10);
check('cytoplasme maternel : cms-T × Mo17 → F1 stérile mâle', e.cross(cms, mo, 10).every((x) => x.cyto === 'T' && e.isMaleSterile(x)));
check('cms-T × restaurateur Rf1 → F1 fertile', e.cross(cms, F('rf1-line'), 10).every((x) => x.cyto === 'T' && e.canPollinate(x)));
check('père cms-T : impossible', e.crossCheck(mo, cms).level === 'blocked');

// 8. Barrière Ga1-s
const pop = F('strawberry-pop');
const pd = e.cross(pop, F('reids-yellow-dent'), 3000);
check(`pop-corn Ga1-s ♀ × denté ♂ : presque pas de grains (${pd.length}/3000)`, pd.length < 150);
check('denté ♀ × pop-corn ♂ : normal', e.cross(F('reids-yellow-dent'), pop, 100).length === 100);

// 9. Espèces
const teo = F('parviglumis');
check('maïs × téosinte de Balsas : fertile', e.crossCheck(b73, teo).level === 'related' && e.cross(b73, teo, 5)[0].fertility === 1);
check('téosinte mexicana ♀ × maïs ♂ : soies qui trient (Tcb1)', e.crossCheck(F('mexicana'), b73).effectiveSeedSet < 0.2 && e.crossCheck(b73, F('mexicana')).effectiveSeedSet > 0.8);
check('Tripsacum ♀ : impossible ; maïs ♀ × Tripsacum ♂ : très rare', e.crossCheck(F('tripsacum'), b73).level === 'blocked' && e.crossCheck(b73, F('tripsacum')).effectiveSeedSet < 0.03);
const mt = e.cross(b73, teo, 1)[0];
check('F1 maïs × téosinte : tige ramifiée ? non (tb1 récessif) ; grain à demi vêtu (tga1)', !e.appearance(mt).branched && e.appearance(mt).fruitCase === 'half');

// 10. Programme : un maïs bleu doux ; puis domestiquer un téosinte
let ok = 0;
for (let i = 0; i < 10; i++) {
  const eng = new MzEngine();
  eng.reseed(700 + i);
  const r = runProgram(eng, eng.createFromVariety(V('golden-bantam')), eng.createFromVariety(V('hopi-blue')), { domesticated: false, color: 'blue', texture: 'sugary', resistances: [] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
}
check(`programme : maïs doux bleu fixé (${ok}/10)`, ok >= 8);
let okD = 0;
for (let i = 0; i < 6; i++) {
  const eng = new MzEngine();
  eng.reseed(900 + i);
  const r = runProgram(eng, eng.createFromVariety(V('b73')), eng.createFromVariety(V('parviglumis')), { domesticated: true, resistances: [] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached) okD++;
}
check(`programme : refaire la domestication (grain nu, tige unique) (${okD}/6)`, okD >= 5);
check('programme impossible avec Tripsacum en mère', runProgram(e, F('tripsacum'), b73, { domesticated: false, resistances: ['Ht1'] }).stopped === 'blocked');

// 11. Jardin
const loss = (ind: ReturnType<typeof F>, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, ind, g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('helminthosporiose race T : seul le cytoplasme T souffre', loss(cms, 'raceT', { ...DEFAULT_GARDEN, raceT: true }) > 0.5 && loss(mo, 'raceT', { ...DEFAULT_GARDEN, raceT: true }) === 0);
check('Ht1 protège de l’helminthosporiose du Nord', loss(F('b73ht'), 'nlb', { ...DEFAULT_GARDEN, climate: 'oceanic' }) < loss(b73, 'nlb', { ...DEFAULT_GARDEN, climate: 'oceanic' }) / 3);
check('rouille : Rp1-D protège', loss(F('rp1d-line'), 'rust', { ...DEFAULT_GARDEN, rust: true }) < 0.05 && loss(b73, 'rust', { ...DEFAULT_GARDEN, rust: true }) > 0.2);
check('téosinte en jours longs : floraison trop tardive', loss(teo, 'photoperiod') > 0.5 && loss(teo, 'photoperiod', { ...DEFAULT_GARDEN, climate: 'tropical' }) === 0);

// 12. Nutriments, classes
const nut = mzNutrientPlan(e, hyb[0]);
check('nutriments : N ≈ K₂O, P plus faible', nut.season.N > 0 && nut.season.P2O5 < nut.season.N);
check('classes de taille d’épi', sizeClassOf(6) === 'mini' && sizeClassOf(30) === 'giant');

// 13. Sauvegarde incomplète
const old = JSON.parse(JSON.stringify(b73));
delete old.genotype.rp1;
delete old.haps.ears;
delete old.cyto;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.rp1) && Array.isArray(n.haps.ears) && n.cyto === 'N');

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
