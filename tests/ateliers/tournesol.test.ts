/* Tests du moteur tournesol (atelier intégré) */
import { HaEngine, heightClassOf } from '../../src/ateliers/tournesol/engine/tournesol/engine.ts';
import { HA_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/tournesol/engine/tournesol/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/tournesol/engine/tournesol/loci.ts';
import { runProgram } from '../../src/ateliers/tournesol/engine/tournesol/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/tournesol/engine/tournesol/garden.ts';
import { haNutrientPlan } from '../../src/ateliers/tournesol/engine/tournesol/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new HaEngine();
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
check(`catalogue (${HA_VARIETIES.length} variétés)`, HA_VARIETIES.length >= 30);
check('ids uniques', new Set(HA_VARIETIES.map((v) => v.id)).size === HA_VARIETIES.length);
check('variantes connues', HA_VARIETIES.every((v) => [...v.variants, ...(v.het ?? [])].every((x) => VARIANT_ALLELE[x])));
check('les 6 espèces sont représentées', new Set(HA_VARIETIES.map((v) => v.species)).size === 6);
let bad = 0;
for (const v of HA_VARIETIES) {
  const f = e.createFromVariety(v);
  const h = f.pheno.heightCm / v.heightCm;
  const d = f.pheno.florets / v.florets;
  if (h < 0.75 || h > 1.33 || d < 0.7 || d > 1.4 || Math.abs(f.pheno.days - v.days) > 10 || Math.abs(f.pheno.scent - v.scent) > 1.5) {
    bad++;
    console.log('   écart', v.name, { h: h.toFixed(2), d: d.toFixed(2), days: f.pheno.days, scent: f.pheno.scent });
  }
}
check('fondateurs fidèles à leur fiche', bad === 0);

// 2. Aspect
const exp: Array<[string, Record<string, unknown>]> = [
  ['mammoth', { color: 'yellow', face: true, veins: false, flecked: false, shape: 'normal' }],
  ['procut-orange', { color: 'orange', veins: true }],
  ['procut-lemon', { color: 'lemon' }],
  ['procut-bicolor', { color: 'bronze' }],
  ['procut-red', { color: 'red' }],
  ['claret', { color: 'mahogany' }],
  ['vincents-fresh', { face: false }],
  ['white-nite', { color: 'cream', face: false }],
  ['lemon-queen', { color: 'lemon', flecked: true }],
  ['teddy-bear', { shape: 'peloric', flecked: true }],
  ['double-dandy', { shape: 'semi', color: 'red', veins: true }],
  ['wild-annuus', { selfIncompatible: true, flecked: true }],
];
for (const [id, want] of exp) {
  const a = app(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}
check('nain : Big Smile < 100 cm', F('big-smile').pheno.heightCm < 100 && e.heightClass(F('big-smile')) === 'dwarf' && heightClassOf(300) === 'tall');
check('tige unique : 1 capitule ; ramifié : beaucoup', F('mammoth').pheno.stems === 1 && F('lemon-queen').pheno.stems >= 10);

// 3. Dominance incomplète du rouge : 1 rouge : 2 bronze : 1 jaune
const f1 = e.cross(F('ha-89'), F('velvet-queen'), 10);
check('F1 jaune × rouge : toute bronze', f1.every((x) => app(x).color === 'bronze'));
const f2 = e.cross(f1[0], f1[0], 2000);
const rb = ['red', 'bronze', 'yellow'].map((c) => f2.filter((x) => app(x).color === c).length);
const x2r = chi2(rb, [1, 2, 1]);
check(`F2 1 : 2 : 1 (${rb.join(' : ')}, χ² = ${x2r.toFixed(2)})`, x2r < 9.2);
check('F2 : ramifiés récessifs ≈ 1/4', Math.abs(f2.filter((x) => app(x).flecked).length / f2.length - 0.25) < 0.04);

// 4. Dihybride indépendant : citron et cœur clair, 9 : 3 : 3 : 1
const d1 = e.cross(F('mammoth'), F('lab-lemon-light'), 5);
const d2 = e.cross(d1[0], d1[0], 3200);
const cls = (x: ReturnType<typeof F>) => `${app(x).color === 'lemon' ? 'l' : 'Y'}${app(x).face ? 'P' : 'p'}`;
const cnt = ['YP', 'Yp', 'lP', 'lp'].map((k) => d2.filter((x) => cls(x) === k).length);
const x2d = chi2(cnt, [9, 3, 3, 1]);
check(`F2 9 : 3 : 3 : 1 (${cnt.join(' : ')}, χ² = ${x2d.toFixed(2)})`, x2d < 11.3);
const pred = e.predict(d1[0], d1[0]);
const plp = pred.filter((c) => c.app.color === 'lemon' && !c.app.face).reduce((s, c) => s + c.p, 0);
check('prédiction exacte 1/16 citron à cœur clair', Math.abs(plp - 1 / 16) < 1e-9);

// 5. Fleurs doubles : 1 double : 2 semi : 1 simple
const db = e.cross(F('teddy-bear'), F('mammoth'), 5);
check('Teddy Bear × simple : F1 semi-double', db.every((x) => app(x).shape === 'semi'));

// 6. Sans pollen, auto-incompatibilité, espèces
const ms = F('procut-orange');
check('sans pollen : ne peut pas être père ni s’autoféconder', e.crossCheck(F('mammoth'), ms).reason === 'pollenless' && e.cross(ms, ms, 10).length === 0 && e.cross(ms, F('mammoth'), 10).length === 10);
check('sans pollen × doré : F1 avec pollen (ms récessif)', e.cross(F('lab-ms1'), F('mammoth'), 10).every((x) => !app(x).veins));
const w = F('wild-annuus');
check('sauvage : auto-incompatible', e.crossCheck(w, w).reason === 'selfIncompatible' && e.cross(w, w, 10).length === 0);
check('cultivé : auto-compatible, ~50 % de graines croisées', e.isSelfCompatible(F('mammoth')) && e.outcrossingRate(F('mammoth')) === 0.5);
check('H. argophyllus : croisement facile', e.crossCheck(F('mammoth'), F('argophyllus')).level === 'related');
check('topinambour : impossible', e.crossCheck(F('mammoth'), F('tuberosus')).level === 'blocked');
check('H. petiolaris : difficile, hybrides peu fertiles', e.crossCheck(F('mammoth'), F('petiolaris')).level === 'difficult');

// 7. Vigueur hybride
const hyb = e.cross(F('ha-89'), F('rha-271'), 20);
check('HA 89 × RHA 271 : F1 à tige unique et plus vigoureuse', hyb.every((x) => !app(x).flecked) && e.vigor(hyb[0].haps) > e.vigor(F('ha-89').haps) + 0.1);

// 8. Programme : tournesol rouge nain à partir de Velvet Queen × Big Smile
let ok = 0;
for (let i = 0; i < 8; i++) {
  const eng = new HaEngine();
  eng.reseed(500 + i);
  const r = runProgram(eng, eng.createFromVariety(V('velvet-queen')), eng.createFromVariety(V('big-smile')), { color: 'red', height: 'dwarf', flecked: false, resistances: [] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
}
check(`programme : tournesol rouge nain à tige unique (${ok}/8)`, ok >= 6);
const eng = new HaEngine();
eng.reseed(7);
const bi = runProgram(eng, eng.createFromVariety(V('ha-89')), eng.createFromVariety(V('velvet-queen')), { color: 'bronze', resistances: [] }, { familySize: 30, maxGenerations: 5 });
check('programme : un bicolore (Rd/rd) ne se fixe pas', !bi.fixed || !bi.goalReached);

// 9. Jardin, nutriments, sauvegarde
const res = gardenOutcome(e, F('ha-335'), { ...DEFAULT_GARDEN, rust: true });
const sus = gardenOutcome(e, F('ha-89'), { ...DEFAULT_GARDEN, rust: true });
check('Pl protège du mildiou', res.totalLoss < sus.totalLoss);
const hot = gardenOutcome(e, F('mammoth'), { ...DEFAULT_GARDEN, climate: 'mediterranean' });
const cool = gardenOutcome(e, F('mammoth'), { ...DEFAULT_GARDEN, climate: 'mountain' });
check('chaleur : meilleur au soleil du Midi qu’en montagne', hot.realized > cool.realized);
const pinch = gardenOutcome(e, F('procut-orange'), { ...DEFAULT_GARDEN, pinch: true });
check('pincement : plusieurs tiges à couper', pinch.potential > 1);
const nut = haNutrientPlan(e, F('mammoth'));
check('gourmand en potasse', nut.season.K2O > nut.season.N && nut.appetite !== 'light');
const old = JSON.parse(JSON.stringify(F('mammoth')));
delete old.genotype.dw;
delete old.haps.scent;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.dw) && Array.isArray(n.haps.scent));

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
