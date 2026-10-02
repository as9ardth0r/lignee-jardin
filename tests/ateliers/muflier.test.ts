/* Tests du moteur muflier (atelier intégré) */
import { AmEngine, heightClassOf } from '../../src/ateliers/muflier/engine/muflier/engine.ts';
import { AM_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/muflier/engine/muflier/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/muflier/engine/muflier/loci.ts';
import { runProgram } from '../../src/ateliers/muflier/engine/muflier/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/muflier/engine/muflier/garden.ts';
import { amNutrientPlan } from '../../src/ateliers/muflier/engine/muflier/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new AmEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const meanH = (l: { pheno: { florets: number } }[]) => l.reduce((s, x) => s + x.pheno.florets, 0) / l.length;
const chi2 = (obs: number[], ratio: number[]) => {
  const n = obs.reduce((a, b) => a + b, 0);
  const t = ratio.reduce((a, b) => a + b, 0);
  return obs.reduce((s, o, i) => s + (o - (n * ratio[i]) / t) ** 2 / ((n * ratio[i]) / t), 0);
};
const color = (x: ReturnType<typeof F>) => e.appearance(x).color;

// 1. Catalogue
check(`catalogue (${AM_VARIETIES.length} variétés)`, AM_VARIETIES.length >= 30);
check('ids uniques', new Set(AM_VARIETIES.map((v) => v.id)).size === AM_VARIETIES.length);
check('variantes connues', AM_VARIETIES.every((v) => [...v.variants, ...(v.het ?? [])].every((x) => VARIANT_ALLELE[x])));
check('les 6 espèces sont représentées', new Set(AM_VARIETIES.map((v) => v.species)).size === 6);
let bad = 0;
for (const v of AM_VARIETIES) {
  const f = e.createFromVariety(v);
  const h = f.pheno.heightCm / v.heightCm;
  const fl = f.pheno.florets / v.florets;
  if (h < 0.75 || h > 1.33 || fl < 0.7 || fl > 1.4 || Math.abs(f.pheno.days - v.days) > 10 || Math.abs(f.pheno.scent - v.scent) > 1.2) {
    bad++;
    console.log('   écart', v.name, { h: h.toFixed(2), fl: fl.toFixed(2), days: f.pheno.days, scent: f.pheno.scent });
  }
}
check('fondateurs fidèles à leur fiche', bad === 0);

// 2. Aspect
const exp: Array<[string, Record<string, unknown>]> = [
  ['rocket-red', { color: 'red', face: false, shape: 'normal', selfIncompatible: false }],
  ['rocket-white', { color: 'ivory' }],
  ['rocket-yellow', { color: 'yellow' }],
  ['rocket-rose', { color: 'pink' }],
  ['rocket-bronze', { color: 'orange' }],
  ['royal-bride', { color: 'white' }],
  ['liberty-cherry', { color: 'magenta' }],
  ['night-and-day', { color: 'red', face: true }],
  ['lab-rosea', { color: 'pale' }],
  ['lab-venosa', { color: 'pale', veins: true }],
  ['lab-palrec', { flecked: true, color: 'ivory' }],
  ['lab-cycloidea', { shape: 'semi' }],
  ['darwin-peloric', { shape: 'peloric' }],
  ['striatum', { color: 'yellow', veins: true, selfIncompatible: true }],
  ['pseudomajus', { color: 'magenta', selfIncompatible: true }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}
check('nain / grand', e.heightClass(F('tom-thumb')) === 'dwarf' && e.heightClass(F('rocket-red')) === 'tall' && heightClassOf(50) === 'medium');

// 3. Dominance incomplète : magenta × pâle → F1 rose, F2 1 : 2 : 1
const f1 = e.cross(F('lab-wild'), F('lab-rosea'), 20);
check('F1 magenta × pâle : toute rose', f1.every((x) => color(x) === 'pink'));
const f2 = e.cross(f1[0], f1[0], 4000);
const cls = ['magenta', 'pink', 'pale'].map((c) => f2.filter((x) => color(x) === c).length);
const x2a = chi2(cls, [1, 2, 1]);
check(`F2 : 1 : 2 : 1 (${cls.join(' : ')}, χ² = ${x2a.toFixed(2)})`, x2a < 9.2);
const pred = e.predict(f1[0], f1[0]);
const pp = (c: string) => pred.filter((x) => x.app.color === c).reduce((s, x) => s + x.p, 0);
check('prédiction exacte 1/4 : 1/2 : 1/4', Math.abs(pp('magenta') - 0.25) < 1e-9 && Math.abs(pp('pink') - 0.5) < 1e-9 && Math.abs(pp('pale') - 0.25) < 1e-9);

// 4. Épistasie : nivea blanc masque tout ; rouge = jaune + magenta
const nivRed = e.cross(F('lab-nivea'), F('lab-sulfurea'), 10);
check('F1 nivea × sulfurea : magenta (deux récessifs complémentés)', nivRed.every((x) => color(x) === 'magenta'));
const f2b = e.cross(nivRed[0], nivRed[0], 6400);
const c2 = [f2b.filter((x) => color(x) === 'magenta').length, f2b.filter((x) => color(x) === 'red').length, f2b.filter((x) => color(x) === 'white').length];
const x2b = chi2(c2, [9, 3, 4]);
check(`F2 : 9 magenta : 3 rouges : 4 blanches (${c2.join(' : ')}, χ² = ${x2b.toFixed(2)})`, x2b < 9.2);

// 5. Forme pélorique : deux gènes très liés → F2 ≈ 3 : 1 comme chez Darwin
const pel = F('lab-cyc-dich');
const norm = F('lab-wild');
const pf1 = e.cross(norm, pel, 10);
check('F1 normal × pélorique : normale (récessif)', pf1.every((x) => e.appearance(x).shape === 'normal'));
const pf2 = e.cross(pf1[0], pf1[0], 4000);
const pc = [pf2.filter((x) => e.appearance(x).shape !== 'peloric').length, pf2.filter((x) => e.appearance(x).shape === 'peloric').length];
const x2c = chi2(pc, [3, 1]);
check(`F2 normal : pélorique ≈ 3 : 1 grâce à la liaison (${pc.join(' : ')}, χ² = ${x2c.toFixed(2)})`, x2c < 6.6);
const semi = pf2.filter((x) => e.appearance(x).shape === 'semi').length / pf2.length;
check(`semi-péloriques rares (recombinants, ${(semi * 100).toFixed(2)} %)`, semi < 0.02);

// 6. Auto-incompatibilité
const ps = F('pseudomajus');
check('muflier sauvage : autofécondation impossible', e.crossCheck(ps, ps).level === 'blocked' && e.crossCheck(ps, ps).reason === 'selfIncompatible' && e.cross(ps, ps, 20).length === 0);
const twin = e.cloneOf(ps);
check('même allèles S (bouture) : croisement impossible', e.crossCheck(ps, twin).reason === 'sameS');
const half = e.createCustom({ label: 'S1 S3', species: 'pseudomajus', variants: [], targets: {}, sAlleles: ['S1', 'S3'] });
const hk = e.crossCheck(ps, half);
check('un allèle S en commun : moitié du pollen acceptée', hk.level !== 'blocked' && hk.sCompat === 0.5 && hk.reason === 'halfS');
const hp = e.cross(ps, half, 200);
check('… et aucun descendant ne porte le S1 du père', hp.length > 0 && hp.every((x) => x.genotype.s.filter((s) => s === 'S1').length <= 1) && hp.every((x) => x.genotype.s[1] === 'S3'));
check('muflier cultivé : auto-compatible', e.isSelfCompatible(F('rocket-red')) && e.cross(F('rocket-red'), F('rocket-red'), 10).length === 10);
const hyb = e.cross(F('lab-wild'), ps, 30);
check('cultivé × sauvage : F1 Sc/S, auto-compatible (pollen Sc accepté)', hyb.length > 0 && hyb.every((x) => e.isSelfCompatible(x)));

// 7. Espèces
check('linaire : autre genre, impossible', e.crossCheck(norm, F('linaria')).level === 'blocked');
check('A. hispanicum : difficile', e.crossCheck(norm, F('hispanicum')).level === 'difficult');
check('pseudomajus × striatum : sous-espèces', e.crossCheck(ps, F('striatum')).level === 'related');

// 8. Consanguinité et hybrides
const rr = F('rocket-rose');
const s1 = e.cross(rr, rr, 200);
const clones = Array.from({ length: 40 }, () => e.cloneOf(rr));
check(`dépression de consanguinité modérée : S1 ${meanH(s1).toFixed(1)} < clones ${meanH(clones).toFixed(1)} fleurs`, meanH(s1) < meanH(clones) && meanH(s1) > meanH(clones) * 0.75);

// 9. Programmes
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 10; i++) {
  const eng = new AmEngine();
  eng.reseed(700 + i);
  const r = runProgram(eng, eng.createFromVariety(V('rocket-red')), eng.createFromVariety(V('lab-cyc-dich')), { color: 'red', shape: 'peloric', resistances: [] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
  gens.push(r.final.generation);
}
check(`programme : muflier rouge pélorique, fixé (${ok}/10)`, ok >= 8, gens.join(','));
let okSi = 0;
let sibs = 0;
for (let i = 0; i < 6; i++) {
  const eng = new AmEngine();
  eng.reseed(900 + i);
  const r = runProgram(eng, eng.createFromVariety(V('pseudomajus')), eng.createFromVariety(V('striatum')), { color: 'orange', veins: false, resistances: [] }, { familySize: 40, maxGenerations: 12 });
  if (r.goalReached) okSi++;
  sibs += r.steps.filter((s) => s.kind === 'sib').length;
}
check(`programme auto-incompatible : repli frère × sœur (${okSi}/6, ${sibs} générations entre sœurs)`, okSi >= 4 && sibs > 0);
check('programme depuis un muflier sauvage seul : pas de sœur', runProgram(e, ps, null, { color: 'pale', resistances: [] }).stopped === 'no-mate');

// 10. Jardin
const lossOf = (x: ReturnType<typeof F>, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, x, g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('rouille : Pa protège', lossOf(F('monarch'), 'rust', { ...DEFAULT_GARDEN, rust: true }) < 0.05 && lossOf(F('rocket-red'), 'rust', { ...DEFAULT_GARDEN, rust: true }) > 0.2);
const pinch = gardenOutcome(e, F('rocket-red'), { ...DEFAULT_GARDEN, pinch: true });
const nopinch = gardenOutcome(e, F('rocket-red'), DEFAULT_GARDEN);
check('pincement : plus de tiges, floraison plus tardive', pinch.potential > nopinch.potential && pinch.days > nopinch.days);
check('nains : plus de tiges que les grands', F('tom-thumb').pheno.stems > F('rocket-red').pheno.stems);

// 11. Nutriments, sauvegarde
const nut = amNutrientPlan(e, F('rocket-red'));
check('nutriments : potasse > azote, quantités modestes', nut.season.K2O > nut.season.N && nut.season.N < 5);
const old = JSON.parse(JSON.stringify(F('rocket-red')));
delete old.genotype.pa;
delete old.haps.scent;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.pa) && Array.isArray(n.haps.scent));

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
