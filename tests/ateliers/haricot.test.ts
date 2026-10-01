/* Tests du moteur haricot : npm test */
import { BeanEngine, kosambi, sizeClassOf } from '../../src/ateliers/haricot/engine/haricot/engine.ts';
import { BEAN_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/haricot/engine/haricot/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/haricot/engine/haricot/loci.ts';
import { runProgram } from '../../src/ateliers/haricot/engine/haricot/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/haricot/engine/haricot/garden.ts';
import { beanNutrientPlan } from '../../src/ateliers/haricot/engine/haricot/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new BeanEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const frac = <T,>(list: T[], f: (x: T) => boolean) => list.filter(f).length / list.length;

// 1. Catalogue
check(`catalogue (${BEAN_VARIETIES.length} variétés)`, BEAN_VARIETIES.length >= 60);
check('ids uniques', new Set(BEAN_VARIETIES.map((v) => v.id)).size === BEAN_VARIETIES.length);
check('variantes connues', BEAN_VARIETIES.every((v) => v.variants.every((x) => VARIANT_ALLELE[x])));
check('les 5 espèces sont représentées', new Set(BEAN_VARIETIES.map((v) => v.species)).size === 5);
let bad = 0;
for (const v of BEAN_VARIETIES) {
  const f = e.createFromVariety(v);
  const s = f.pheno.seed100 / v.seed100;
  const pl = f.pheno.podCm / v.podCm;
  const h = f.pheno.heightCm / v.heightCm;
  if (!e.isFixed(f) || s < 0.75 || s > 1.33 || pl < 0.75 || pl > 1.33 || h < 0.7 || h > 1.4 || Math.abs(f.pheno.days - v.days) > 10) {
    bad++;
    console.log('   écart', v.name, { s: s.toFixed(2), pl: pl.toFixed(2), h: h.toFixed(2), days: f.pheno.days });
  }
}
check('fondateurs fixés et fidèles à leur fiche (port nain compris)', bad === 0);

// 2. Apparence
const exp: Array<[string, Partial<ReturnType<typeof e.appearance>>]> = [
  ['blue-lake-274', { seed: 'white', flower: 'white', bush: true, stringless: true }],
  ['black-turtle', { seed: 'black', flower: 'purple' }],
  ['provider', { seed: 'violet' }],
  ['dark-red-kidney', { seed: 'red', flower: 'white' }],
  ['mayocoba', { seed: 'yellow' }],
  ['pinto', { seed: 'brown', pattern: 'marbled' }],
  ['coco-de-prague', { pattern: 'marbled', podStreaked: true, bush: false }],
  ['yellow-eye', { pattern: 'eye', seed: 'yellow' }],
  ['orca', { pattern: 'eye', seed: 'black' }],
  ['rocquencourt', { pod: 'yellow' }],
  ['royal-burgundy', { pod: 'purple' }],
  ['dragon-langerie', { pod: 'yellow', podStreaked: true }],
  ['scarlet-emperor', { flower: 'scarlet' }],
  ['painted-lady', { flower: 'bicolor' }],
  ['white-emergo', { flower: 'white', seed: 'white' }],
  ['kentucky-wonder', { stringless: false, bush: false }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}

// 3. P épistatique : blanc × noir → F1 noire, F2 = 9 noir : 3 violet : 4 blanc... (P, V fixés ; G B → noir)
const f1 = e.cross(F('navy'), F('black-turtle'), 20);
check('Navy (blanc, p) × Black Turtle : F1 noire à fleurs violettes', f1.every((x) => e.appearance(x).seed === 'black' && e.appearance(x).flower === 'purple'));
const f2 = e.cross(f1[0], f1[0], 6000);
const white = frac(f2, (x) => e.appearance(x).seed === 'white');
check(`F2 : ¼ de graines blanches (p épistatique) (${white.toFixed(3)})`, Math.abs(white - 0.25) < 0.02);
check('fleur blanche ⇔ graine blanche chez p/p', f2.filter((x) => e.appearance(x).seed === 'white').every((x) => e.appearance(x).flower === 'white'));

// 4. Interaction G × B (avec v) : jaune × olive → F1 brune, F2 9 brun : 3 jaune : 3 olive : 1 chamois
const yellow = e.createCustom({ label: 'y', species: 'vulgaris', variants: ['v', 'G'], targets: {} });
const olive = e.createCustom({ label: 'o', species: 'vulgaris', variants: ['v', 'B'], targets: {} });
const f1c = e.cross(yellow, olive, 10);
check('Jaune (G) × olive (B) : F1 brune', f1c.every((x) => e.appearance(x).seed === 'brown'));
const f2c = e.cross(f1c[0], f1c[0], 8000);
const obs = ['brown', 'yellow', 'olive', 'buff'].map((c) => frac(f2c, (x) => e.appearance(x).seed === c));
const expd = [9 / 16, 3 / 16, 3 / 16, 1 / 16];
const chi2 = obs.reduce((s, o, i) => s + ((o - expd[i]) * 8000) ** 2 / (expd[i] * 8000), 0);
check(`F2 9:3:3:1 (χ² = ${chi2.toFixed(2)})`, chi2 < 11.3, obs.map((x) => x.toFixed(3)).join(' '));

// 5. Port nain : pléiotropie sur la hauteur
const f1n = e.cross(F('blue-lake-274'), F('blue-lake'), 10);
check('Nain × rames : F1 à rames', f1n.every((x) => !e.appearance(x).bush && x.pheno.heightCm > 150));
const f2n = e.cross(f1n[0], f1n[0], 4000);
const bushes = f2n.filter((x) => e.appearance(x).bush);
check(`F2 : ¼ de nains (${(bushes.length / 4000).toFixed(3)}), tous < 100 cm`, Math.abs(bushes.length / 4000 - 0.25) < 0.02 && bushes.every((x) => x.pheno.heightCm < 100));

// 6. Liaison B–I (1 cM) et indépendance B–Co2
const d = e.createCustom({ label: 'd', species: 'vulgaris', variants: ['B', 'I', 'Co2'], targets: {} });
const het = e.cross(d, F('navy'), 1)[0];
let rec = 0;
let recU = 0;
const N = 20000;
for (let i = 0; i < N; i++) {
  const g = e.gamete(het);
  if ((g.b === 'B') !== (g.i === 'I')) rec++;
  if ((g.b === 'B') !== (g.co2 === 'Co2')) recU++;
}
check(`B–I liés à 1 cM : ${((rec / N) * 100).toFixed(2)} % de recombinants (attendu ${(kosambi(1) * 100).toFixed(2)} %)`, Math.abs(rec / N - kosambi(1)) < 0.004);
check(`B (Pv02) et Co-2 (Pv11) indépendants : ${(recU / N).toFixed(3)}`, Math.abs(recU / N - 0.5) < 0.015);

// 7. Barrières entre espèces
const nv = F('navy');
const sc = F('scarlet-emperor');
const vc = e.cross(nv, sc, 3000);
check(`vulgaris ♀ × coccineus ♂ : ~30 % de graines (${(vc.length / 3000).toFixed(2)}), hybrides à ~45 %`, Math.abs(vc.length / 3000 - 0.3) < 0.03 && vc[0].fertility === 0.45);
const cv = e.cross(sc, nv, 3000);
check(`coccineus ♀ × vulgaris ♂ : presque rien (${cv.length}/3000)`, cv.length < 160);
check('Lima × haricot commun : impossible', e.crossCheck(F('henderson-bush'), nv).level === 'blocked' && e.cross(nv, F('henderson-bush'), 50).length === 0);
check('tépari ♀ × vulgaris ♂ : impossible ; vulgaris ♀ × tépari ♂ : très rare', e.crossCheck(F('tepary-white'), nv).level === 'blocked' && e.crossCheck(nv, F('tepary-white')).effectiveSeedSet < 0.02);
check('coccineus × dumosus : espèces proches', e.crossCheck(sc, F('frijol-de-ano')).level === 'related');

// 8. Programme : haricot vert nain sans fil résistant à l’anthracnose, graines blanches
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 12; i++) {
  const eng = new BeanEngine();
  eng.reseed(700 + i);
  const r = runProgram(eng, eng.createFromVariety(V('blue-lake-274')), eng.createFromVariety(V('cornell-49242')), { notDeciduous: false, seed: 'white', bush: true, stringless: true, resistances: ['Co2'] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
  gens.push(r.final.generation);
}
check(`programme : filet nain blanc sans fil Co-2 fixé (${ok}/12)`, ok >= 10, gens.join(','));
check('programme impossible avec un Lima', runProgram(e, nv, F('henderson-bush'), { notDeciduous: false, resistances: ['I'] }).stopped === 'blocked');

// 9. Jardin
const loss = (id: string, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, F(id), g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('mosaïque BCMV : I protège', loss('imuna', 'mosaic', { ...DEFAULT_GARDEN, mosaic: 'BCMV' }) < 0.05 && loss('navy', 'mosaic', { ...DEFAULT_GARDEN, mosaic: 'BCMV' }) > 0.2);
check('souche nécrotique BCMNV : I seul → racine noire, bc-3 protège', loss('imuna', 'blackroot', { ...DEFAULT_GARDEN, mosaic: 'BCMNV' }) > 0.6 && loss('ivt-7214', 'mosaic', { ...DEFAULT_GARDEN, mosaic: 'BCMNV' }) < 0.05);
check('anthracnose : Co-2 protège', loss('cornell-49242', 'anthracnose', { ...DEFAULT_GARDEN, anthracnose: true }) < 0.05 && loss('black-turtle', 'anthracnose', { ...DEFAULT_GARDEN, anthracnose: true }) > 0.3);
check('haricot d’Espagne : coulure en climat chaud, sans bourdons en serre', loss('scarlet-emperor', 'heat', { ...DEFAULT_GARDEN, climate: 'mediterranean' }) > 0.25 && loss('scarlet-emperor', 'pollination', { ...DEFAULT_GARDEN, climate: 'greenhouse' }) > 0.3);
check('Lima : souffre du frais', loss('henderson-bush', 'cool', { ...DEFAULT_GARDEN, climate: 'mountain' }) > loss('navy', 'cool', { ...DEFAULT_GARDEN, climate: 'mountain' }) * 1.8);

// 10. Nutriments, classes
const nut = beanNutrientPlan(e, nv);
check('nutriments : azote à apporter = 60 % du besoin (fixation)', Math.abs(nut.nToApply / nut.season.N - 0.6) < 0.05);
check('classes de taille de graine', sizeClassOf(13) === 'mini' && sizeClassOf(200) === 'giant');

// 11. Sauvegarde incomplète
const old = JSON.parse(JSON.stringify(nv));
delete old.genotype.pse1;
delete old.haps.height;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.pse1) && Array.isArray(n.haps.height));

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
