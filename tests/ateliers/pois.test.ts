/* Tests du moteur pois : npm test */
import { PsEngine, sizeClassOf, kosambi } from '../../src/ateliers/pois/engine/pois/engine.ts';
import { PS_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/pois/engine/pois/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/pois/engine/pois/loci.ts';
import { runProgram } from '../../src/ateliers/pois/engine/pois/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/pois/engine/pois/garden.ts';
import { psNutrientPlan } from '../../src/ateliers/pois/engine/pois/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new PsEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const frac = <T,>(list: T[], f: (x: T) => boolean) => list.filter(f).length / list.length;
const chi2 = (obs: number[], ratio: number[]) => {
  const n = obs.reduce((a, b) => a + b, 0);
  const t = ratio.reduce((a, b) => a + b, 0);
  return obs.reduce((s, o, i) => s + (o - (n * ratio[i]) / t) ** 2 / ((n * ratio[i]) / t), 0);
};

// 1. Catalogue
check(`catalogue (${PS_VARIETIES.length} variétés)`, PS_VARIETIES.length >= 45);
check('ids uniques', new Set(PS_VARIETIES.map((v) => v.id)).size === PS_VARIETIES.length);
check('variantes connues', PS_VARIETIES.every((v) => [...v.variants, ...(v.het ?? [])].every((x) => VARIANT_ALLELE[x])));
check('les 4 espèces sont représentées', new Set(PS_VARIETIES.map((v) => v.species)).size === 4);
let bad = 0;
for (const v of PS_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightG / v.weightG;
  const h = f.pheno.heightCm / v.heightCm;
  if (w < 0.75 || w > 1.33 || h < 0.75 || h > 1.33 || Math.abs(f.pheno.days - v.days) > 10 || Math.abs(f.pheno.seed100 - v.seed100) > 3) {
    bad++;
    console.log('   écart', v.name, { w: w.toFixed(2), h: h.toFixed(2), days: f.pheno.days, seed: f.pheno.seed100 });
  }
}
check('fondateurs fidèles à leur fiche', bad === 0);

// 2. Aspect
const exp: Array<[string, Record<string, unknown>]> = [
  ['mendel-rond-jaune', { seedShape: 'round', cotyledon: 'yellow', flower: 'white', pod: 'shelling', podColor: 'green', terminal: false, dwarf: false }],
  ['mendel-ride-vert', { seedShape: 'wrinkled', cotyledon: 'green' }],
  ['mendel-pourpre', { flower: 'purple', coat: 'grey' }],
  ['mendel-nain', { dwarf: true }],
  ['mendel-terminal', { terminal: true }],
  ['golden-sweet', { pod: 'snow', podColor: 'yellow', flower: 'purple' }],
  ['sugar-snap', { pod: 'snap' }],
  ['markana', { leaf: 'afila' }],
  ['pois-persil', { leaf: 'parsley' }],
  ['pois-acacia', { leaf: 'acacia' }],
  ['isard', { winter: true, leaf: 'afila' }],
  ['fulvum', { flower: 'tawny' }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}
check('pois nain : environ trois fois plus court', F('mendel-nain').pheno.heightCm < F('mendel-rond-jaune').pheno.heightCm * 0.4);

// 3. Monohybridisme et dihybridisme
const ry = F('mendel-rond-jaune');
const wg = F('mendel-ride-vert');
const f1 = e.cross(ry, wg, 30);
check('F1 : toutes rondes et jaunes (dominance)', f1.length === 30 && f1.every((x) => e.appearance(x).seedShape === 'round' && e.appearance(x).cotyledon === 'yellow'));
const f2 = e.cross(f1[0], f1[0], 8000);
const cls = [0, 0, 0, 0];
for (const x of f2) {
  const a = e.appearance(x);
  cls[(a.seedShape === 'round' ? 0 : 2) + (a.cotyledon === 'yellow' ? 0 : 1)]++;
}
const x2 = chi2(cls, [9, 3, 3, 1]);
check(`F2 : 9 : 3 : 3 : 1 (${cls.join(' : ')}, χ² = ${x2.toFixed(2)})`, x2 < 16.27);
check(`F2 : 3 : 1 pour la forme (${(frac(f2, (x) => e.appearance(x).seedShape === 'wrinkled') * 100).toFixed(1)} % ridées)`, Math.abs(frac(f2, (x) => e.appearance(x).seedShape === 'wrinkled') - 0.25) < 0.02);
const tester = F('mendel-testeur');
const bc = e.cross(tester, f1[0], 4000);
check(`rétrocroisement : 1 : 1 (${(frac(bc, (x) => e.appearance(x).seedShape === 'wrinkled') * 100).toFixed(1)} % ridées)`, Math.abs(frac(bc, (x) => e.appearance(x).seedShape === 'wrinkled') - 0.5) < 0.03);

// 4. Tégument : tissu maternel
const purple = F('mendel-pourpre');
const fromWhiteMother = e.cross(ry, purple, 20);
check('graines récoltées sur une mère blanche : tégument clair, mais plantes à fleurs pourpres', fromWhiteMother.every((x) => x.seedCoat === 'clear' && e.appearance(x).flower === 'purple'));
const fromPurpleMother = e.cross(purple, ry, 20);
check('… et sur une mère pourpre : tégument gris', fromPurpleMother.every((x) => x.seedCoat === 'grey'));

// 5. Liaison Le–V (~12 cM) et indépendance R–I
const lv = e.cross(ry, tester, 1)[0];
const test = e.cross(tester, lv, 6000);
const recLV = frac(test, (x) => e.appearance(x).dwarf !== (e.appearance(x).pod !== 'shelling'));
const recRI = frac(test, (x) => (e.appearance(x).seedShape === 'wrinkled') !== (e.appearance(x).cotyledon === 'green'));
check(`liaison Le–V : ${(recLV * 100).toFixed(1)} % de recombinants (attendu ${(kosambi(12) * 100).toFixed(1)} %)`, Math.abs(recLV - kosambi(12)) < 0.025);
check(`R et I indépendants : ${(recRI * 100).toFixed(1)} % de recombinants`, Math.abs(recRI - 0.5) < 0.03);

// 6. Autogamie, espèces
const self = e.crossCheck(ry, ry);
check('autofécondation naturelle', self.level === 'same' && self.reason === 'selfNatural' && self.effectiveSeedSet === 1);
check('cultivé ♀ × sauvage elatius : normal', e.crossCheck(ry, F('elatius')).effectiveSeedSet === 1);
const ful = e.crossCheck(ry, F('fulvum'));
check(`cultivé ♀ × fulvum ♂ : ~40 % (${(ful.effectiveSeedSet * 100).toFixed(0)} %), hybrides demi-stériles`, Math.abs(ful.effectiveSeedSet - 0.4) < 0.01 && ful.f1Fertility === 0.5);
check('fulvum ♀ × cultivé ♂ : bien plus difficile', e.crossCheck(F('fulvum'), ry).effectiveSeedSet < 0.1);
const hyb = e.cross(ry, F('fulvum'), 200);
check(`hybrides fulvum : fertilité 50 %, Er3 transmis (${hyb.length})`, hyb.length > 50 && hyb.every((x) => x.fertility === 0.5 && e.resistances(x).includes('er3')));

// 7. Programme
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 10; i++) {
  const eng = new PsEngine();
  eng.reseed(700 + i);
  const r = runProgram(eng, eng.createFromVariety(V('golden-sweet')), eng.createFromVariety(V('ambassador')), { pod: 'snow', podColor: 'yellow', resistances: ['er1'] }, { familySize: 100, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
  gens.push(r.final.generation);
}
check(`programme : mangetout jaune résistant à l’oïdium, fixé (${ok}/10)`, ok >= 8, gens.join(','));

// 8. Jardin
const lossOf = (x: ReturnType<typeof F>, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, x, g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('oïdium : er1 protège', lossOf(F('ambassador'), 'mildew', { ...DEFAULT_GARDEN, mildew: true }) < 0.05 && lossOf(F('kelvedon-wonder'), 'mildew', { ...DEFAULT_GARDEN, mildew: true }) > 0.2);
check('fusariose : Fw protège', lossOf(F('onward'), 'fusarium', { ...DEFAULT_GARDEN, fusarium: true }) < 0.05 && lossOf(F('kelvedon-wonder'), 'fusarium', { ...DEFAULT_GARDEN, fusarium: true }) > 0.3);
const aut = { ...DEFAULT_GARDEN, climate: 'continental' as const, autumn: true };
check('semis d’automne : le pois d’hiver (Hr) passe, le pois de printemps gèle', lossOf(F('isard'), 'frost', aut) < 0.2 && lossOf(F('kayanne'), 'frost', aut) > 0.5);
check('virus : sbm1 protège', lossOf(F('pi193586'), 'virus', { ...DEFAULT_GARDEN, virus: true }) === 0);

// 9. Nutriments, classes, sauvegarde
const nut = psNutrientPlan(e, ry);
check('nutriments : l’essentiel de l’azote vient des nodosités', nut.fixedNG > nut.season.N * 0.5);
check('classes de taille', sizeClassOf(5) === 'mini' && sizeClassOf(100) === 'giant');
const old = JSON.parse(JSON.stringify(ry));
delete old.genotype.sbm;
delete old.haps.seed;
delete old.seedCoat;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.sbm) && Array.isArray(n.haps.seed) && n.seedCoat === 'clear');

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
