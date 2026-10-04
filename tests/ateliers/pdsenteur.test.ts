/* Tests du moteur pois de senteur (atelier intégré) */
import { LoEngine, heightClassOf } from '../../src/ateliers/pdsenteur/engine/pdsenteur/engine.ts';
import { LO_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/pdsenteur/engine/pdsenteur/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/pdsenteur/engine/pdsenteur/loci.ts';
import { runProgram } from '../../src/ateliers/pdsenteur/engine/pdsenteur/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/pdsenteur/engine/pdsenteur/garden.ts';
import { loNutrientPlan } from '../../src/ateliers/pdsenteur/engine/pdsenteur/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new LoEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const chi2 = (obs: number[], ratio: number[]) => {
  const n = obs.reduce((a, b) => a + b, 0);
  const t = ratio.reduce((a, b) => a + b, 0);
  return obs.reduce((s, o, i) => s + (o - (n * ratio[i]) / t) ** 2 / ((n * ratio[i]) / t), 0);
};
const app = (x: ReturnType<typeof F>) => e.appearance(x);

// 1. Catalogue
check(`catalogue (${LO_VARIETIES.length} variétés)`, LO_VARIETIES.length >= 30);
check('ids uniques', new Set(LO_VARIETIES.map((v) => v.id)).size === LO_VARIETIES.length);
check('variantes connues', LO_VARIETIES.every((v) => [...v.variants, ...(v.het ?? [])].every((x) => VARIANT_ALLELE[x])));
check('les 6 espèces sont représentées', new Set(LO_VARIETIES.map((v) => v.species)).size === 6);
let bad = 0;
for (const v of LO_VARIETIES) {
  const f = e.createFromVariety(v);
  const h = f.pheno.heightCm / v.heightCm;
  if (h < 0.75 || h > 1.33 || Math.abs(f.pheno.florets - v.florets) > 1 || Math.abs(f.pheno.days - v.days) > 10 || Math.abs(f.pheno.scent - v.scent) > 1.2) {
    bad++;
    console.log('   écart', v.name, { h: h.toFixed(2), fl: f.pheno.florets, days: f.pheno.days, scent: f.pheno.scent });
  }
}
check('fondateurs fidèles à leur fiche', bad === 0);

// 2. Aspect
const exp: Array<[string, Record<string, unknown>]> = [
  ['cupani', { color: 'maroon', face: true, shape: 'normal' }],
  ['painted-lady', { color: 'pink', face: true }],
  ['dorothy-eckford', { color: 'white' }],
  ['lord-nelson', { color: 'purple' }],
  ['flora-norton', { color: 'lavender' }],
  ['king-edward', { color: 'red' }],
  ['mrs-bolton', { color: 'blush', shape: 'semi' }],
  ['hooded', { shape: 'peloric' }],
  ['cupid-white', { flecked: true }],
  ['red-round', { color: 'red', veins: false }],
  ['purple-long', { color: 'purple', veins: true }],
  ['belinensis', { color: 'orange' }],
];
for (const [id, want] of exp) {
  const a = app(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}
check('Cupid est nain', F('cupid-pink').pheno.heightCm < 40 && e.heightClass(F('cupid-pink')) === 'dwarf' && heightClassOf(200) === 'tall');

// 3. Complémentation : blanc c × blanc r → F1 pourpre, F2 9 : 7
const f1 = e.cross(F('emily-henderson'), F('white-r'), 20);
check('F1 blanc × blanc : colorée (C et R complémentaires)', f1.length === 20 && f1.every((x) => app(x).color !== 'white'));
const f2 = e.cross(f1[0], f1[0], 3200);
const col = [f2.filter((x) => app(x).color !== 'white').length, f2.filter((x) => app(x).color === 'white').length];
const x2a = chi2(col, [9, 7]);
check(`F2 : 9 colorées : 7 blanches (${col.join(' : ')}, χ² = ${x2a.toFixed(2)})`, x2a < 6.6);
const p97 = e.predict(f1[0], f1[0]);
const pw = p97.filter((c) => c.app.color === 'white').reduce((s, c) => s + c.p, 0);
check('prédiction exacte 7/16 de blancs', Math.abs(pw - 7 / 16) < 1e-9);

// 4. Liaison de Bateson et Punnett : B–L
const lf1 = e.cross(F('purple-long'), F('red-round'), 10);
const lf2 = e.cross(lf1[0], lf1[0], 6000);
const isRed = (c: string) => c === 'red' || c === 'pink' || c === 'blush';
const cls = (x: ReturnType<typeof F>) => `${isRed(app(x).color) ? 'r' : 'p'}${app(x).veins ? 'L' : 'l'}`;
const counts = ['pL', 'pl', 'rL', 'rl'].map((k) => lf2.filter((x) => cls(x) === k).length);
const x2ind = chi2(counts, [9, 3, 3, 1]);
check(`F2 très éloignée de 9 : 3 : 3 : 1 (${counts.join(' : ')}, χ² = ${x2ind.toFixed(0)})`, x2ind > 200);
const rl = counts[3] / lf2.length;
check(`rouges à pollen rond ≈ 19 % (liaison en couplage) : ${(rl * 100).toFixed(1)} %`, rl > 0.16 && rl < 0.23);
const pred = e.predict(lf1[0], lf1[0]);
const prl = pred.filter((c) => isRed(c.app.color) && !c.app.veins).reduce((s, c) => s + c.p, 0);
check(`prédiction avec liaison : ${(prl * 100).toFixed(1)} % de rouges à pollen rond`, prl > 0.18 && prl < 0.21);

// 5. Autogamie, espèces
check('autogame : moins de 2 % de croisements naturels', e.outcrossingRate(F('cupani')) < 0.02 && e.isSelfCompatible(F('cupani')));
check('L. belinensis : croisement possible', e.crossCheck(F('cupani'), F('belinensis')).level === 'difficult' && e.cross(F('cupani'), F('belinensis'), 40).length > 5);
check('pois vivace et gesse : impossible', e.crossCheck(F('cupani'), F('latifolius')).level === 'blocked' && e.crossCheck(F('cupani'), F('sativus')).level === 'blocked');

// 6. Programme : Spencer bicolore bordeaux à partir de Cupani × Midnight
let ok = 0;
for (let i = 0; i < 8; i++) {
  const eng = new LoEngine();
  eng.reseed(500 + i);
  const r = runProgram(eng, eng.createFromVariety(V('cupani')), eng.createFromVariety(V('midnight')), { color: 'maroon', face: true, shape: 'semi', resistances: [], minScent: 7 }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
}
check(`programme : Spencer bicolore parfumé (${ok}/8)`, ok >= 6);

// 7. Jardin, nutriments, sauvegarde
const hot = gardenOutcome(e, F('cupani'), { ...DEFAULT_GARDEN, climate: 'mediterranean' });
const cool = gardenOutcome(e, F('cupani'), DEFAULT_GARDEN);
check('chaleur : moins de tiges dans le Midi', hot.realized < cool.realized);
const nut = loNutrientPlan(e, F('cupani'));
check('légumineuse : peu d’azote, plus de potasse', nut.season.N < nut.season.K2O);
const old = JSON.parse(JSON.stringify(F('cupani')));
delete old.genotype.cu;
delete old.haps.scent;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.cu) && Array.isArray(n.haps.scent));

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
