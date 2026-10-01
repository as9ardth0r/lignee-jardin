/* Tests du moteur melon : npm test */
import { MelonEngine, kosambi, sizeClassOf } from '../../src/ateliers/melon/engine/melon/engine.ts';
import { MELON_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/melon/engine/melon/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/melon/engine/melon/loci.ts';
import { runProgram } from '../../src/ateliers/melon/engine/melon/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/melon/engine/melon/garden.ts';
import { melonNutrientPlan } from '../../src/ateliers/melon/engine/melon/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new MelonEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));

// 1. Catalogue
check(`catalogue (${MELON_VARIETIES.length} variétés)`, MELON_VARIETIES.length >= 55);
check('ids uniques', new Set(MELON_VARIETIES.map((v) => v.id)).size === MELON_VARIETIES.length);
check('variantes connues', MELON_VARIETIES.every((v) => v.variants.every((x) => VARIANT_ALLELE[x])));
let badF = 0;
for (const v of MELON_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightKg / v.weightKg;
  const sh = f.pheno.shapeRatio / v.shapeRatio;
  const st = f.pheno.storageDays / v.storageDays;
  if ((!v.hybrid && !e.isFixed(f)) || w < 0.7 || w > 1.4 || sh < 0.78 || sh > 1.3 || st < 0.55 || st > 1.8 || Math.abs(f.pheno.brix - v.brix) > 1.8) {
    badF++;
    console.log('   écart', v.name, { w: w.toFixed(2), sh: sh.toFixed(2), st: st.toFixed(2), brix: f.pheno.brix, cible: v.brix });
  }
}
check('fondateurs fidèles à leur fiche (pléiotropies comprises)', badF === 0);

// 2. Apparence
const exp: Array<[string, string, string, string?]> = [
  ['charentais', 'orange', 'green', 'round'],
  ['honeydew', 'green', 'cream'],
  ['piel-de-sapo', 'white', 'green', 'oval'],
  ['jaune-canari', 'white', 'yellow', 'elongated'],
  ['galia', 'green', 'yellow'],
  ['armenian-cucumber', 'white', 'green', 'snake'],
  ['crenshaw', 'orange', 'yellow'],
];
for (const [id, flesh, rind, shape] of exp) {
  const a = e.appearance(F(id));
  check(`${id} : chair ${flesh}, écorce ${rind}${shape ? `, ${shape}` : ''}`, a.flesh === flesh && a.rind === rind && (!shape || a.shape === shape), `${a.flesh}/${a.rind}/${a.shape}`);
}
check('Charentais : sutures, se détache', e.appearance(F('charentais')).sutures && e.appearance(F('charentais')).slips);
check('Piel de Sapo : marbré, ne se détache pas, se conserve', e.appearance(F('piel-de-sapo')).mottled && !e.appearance(F('piel-de-sapo')).slips && F('piel-de-sapo').pheno.storageDays > 60);
check('Galia brodé', e.appearance(F('galia')).netted);

// 3. Type floral
check('Charentais ancien andromonoïque (à castrer)', e.sexType(F('charentais')) === 'andromonoecious' && e.needsEmasculation(F('charentais')));
check('Charentais F1 moderne monoïque', e.sexType(F('cezanne')) === 'monoecious' && !e.needsEmasculation(F('cezanne')));
check('melon serpent monoïque', e.sexType(F('armenian-cucumber')) === 'monoecious');
const gyn = e.createCustom({ label: 'gyn', variants: ['g'], targets: {} });
const herm = e.createCustom({ label: 'herm', variants: ['a', 'g'], targets: {} });
check('A_gg gynoïque, aagg hermaphrodite', e.sexType(gyn) === 'gynoecious' && e.sexType(herm) === 'hermaphrodite');
check('gynoïque : pas de pollen (ni père, ni autofécondation)', e.cross(gyn, gyn, 10).length === 0 && e.cross(F('charentais'), gyn, 10).length === 0 && e.cross(gyn, F('charentais'), 10).length === 10);
const f1s = e.cross(F('charentais'), F('armenian-cucumber'), 10);
check('F1 andromonoïque × monoïque = monoïque (A dominant)', f1s.every((x) => e.sexType(x) === 'monoecious'));
const f2s = e.cross(f1s[0], f1s[0], 4000);
const pa = f2s.filter((x) => e.sexType(x) === 'andromonoecious').length / f2s.length;
check(`F2 : ¼ andromonoïques (${pa.toFixed(3)})`, Math.abs(pa - 0.25) < 0.025);
// pléiotropie : les monoïques ont des fruits plus allongés
const rMono = f2s.filter((x) => e.sexType(x) === 'monoecious').reduce((s, x) => s + x.pheno.shapeRatio, 0) / f2s.filter((x) => e.sexType(x) === 'monoecious').length;
const rAndro = f2s.filter((x) => e.sexType(x) === 'andromonoecious').reduce((s, x) => s + x.pheno.shapeRatio, 0) / f2s.filter((x) => e.sexType(x) === 'andromonoecious').length;
check(`pléiotropie a : fruits monoïques plus allongés (${rMono.toFixed(2)} vs ${rAndro.toFixed(2)})`, rMono > rAndro * 1.15);

// 4. Couleur de chair (modèle simplifié) : orange dominant
const f1c = e.cross(F('charentais'), F('honeydew'), 10);
check('Charentais × Honeydew : F1 orange', f1c.every((x) => e.appearance(x).flesh === 'orange'));
const f2c = e.cross(f1c[0], f1c[0], 4000);
const pg = f2c.filter((x) => e.appearance(x).flesh === 'green').length / f2c.length;
check(`F2 : ¼ chair verte (${pg.toFixed(3)})`, Math.abs(pg - 0.25) < 0.025);

// 5. Liaison : Fom-1 et Prv (≈ 2 cM)
const donor = e.createCustom({ label: 'd', variants: ['Fom1', 'Prv'], targets: {} });
const f1l = e.cross(donor, F('charentais'), 1)[0];
let rec = 0;
let recU = 0;
const N = 20000;
const f1u = e.cross(e.createCustom({ label: 'u', variants: ['Fom1', 'Fom2'], targets: {} }), F('charentais'), 1)[0];
for (let i = 0; i < N; i++) {
  const g = e.gamete(f1l);
  if ((g.fom1 === 'Fom1') !== (g.prv === 'Prv')) rec++;
  const h = e.gamete(f1u);
  if ((h.fom1 === 'Fom1') !== (h.fom2 === 'Fom2')) recU++;
}
check(`Fom-1–Prv liés : ${((rec / N) * 100).toFixed(1)} % de recombinants (attendu ${(kosambi(2) * 100).toFixed(1)} %)`, Math.abs(rec / N - kosambi(2)) < 0.006);
check(`Fom-1 (IX) et Fom-2 (XI) indépendants : ${(recU / N).toFixed(3)}`, Math.abs(recU / N - 0.5) < 0.015);

// 6. Acide et amer : dominants
const f1w = e.cross(F('charentais'), F('melon-sauvage'), 20);
check('Charentais × melon sauvage : F1 acide et amère', f1w.every((x) => e.isSour(x) && e.isBitter(x)));
check('non climactérique récessif : F1 Charentais × Piel de Sapo se détache', e.cross(F('charentais'), F('piel-de-sapo'), 10).every((x) => e.appearance(x).slips));

// 7. Programme : Charentais résistant à la fusariose race 1 (Fom-2 depuis Cézanne) + chair orange + sutures
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 15; i++) {
  const eng = new MelonEngine();
  eng.reseed(500 + i);
  const r = runProgram(eng, eng.createFromVariety(V('charentais')), eng.createFromVariety(V('pi-161375')), { notBitter: true, notSour: true, resistances: ['Vat'], flesh: 'orange', sutures: true, slips: true }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
  gens.push(r.final.generation);
}
check(`programme : Charentais résistant aux pucerons (Vat) fixé (${ok}/15)`, ok >= 12, gens.join(','));

// 8. Jardin
const g0 = { ...DEFAULT_GARDEN, fusarium: '1' as const };
const lossF = (id: string, garden = g0) => gardenOutcome(e, F(id), garden).losses.find((l) => l.cause === 'fusarium')?.pct ?? 0;
check('fusariose race 1 : Fom-2 protège, Fom-1 non', lossF('cezanne') < 0.05 && lossF('doublon') > 0.5);
check('fusariose race 2 : Fom-1 protège', lossF('doublon', { ...DEFAULT_GARDEN, fusarium: '2' }) < 0.05);
check('fusariose race 1.2 : aucune protection simple', lossF('etchabi', { ...DEFAULT_GARDEN, fusarium: '1.2' }) > 0.5);
const vir = (id: string) => gardenOutcome(e, F(id), { ...DEFAULT_GARDEN, virus: true }).losses.find((l) => l.cause === 'virus')!.pct;
check('virus : Vat bloque la transmission', vir('pi-161375') < 0.05 && vir('charentais') > 0.3);
const cha = F('charentais');
const oce = gardenOutcome(e, cha, { ...DEFAULT_GARDEN, climate: 'oceanic' });
const med = gardenOutcome(e, cha, DEFAULT_GARDEN);
check(`climat frais : moins de sucres (${oce.brix}° vs ${med.brix}°)`, oce.brix < med.brix - 1);

// 9. Nutriments
const nut = melonNutrientPlan(e, F('charentais'));
check('nutriments : K₂O ≈ 1,8 × N', Math.abs(nut.season.K2O / nut.season.N - 7.3 / 4) < 0.05);
check('tailles', sizeClassOf(0.3) === 'mini' && sizeClassOf(5) === 'giant');

// 10. Sauvegarde incomplète
const old = JSON.parse(JSON.stringify(F('charentais')));
delete old.genotype.nsv;
delete old.haps.shape;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.nsv) && Array.isArray(n.haps.shape));

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
