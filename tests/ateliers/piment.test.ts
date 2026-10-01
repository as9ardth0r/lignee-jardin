/* Tests du moteur piment : npm test */
import { PepperEngine, kosambi, heatClassOf, sizeClassOf } from '../../src/ateliers/piment/engine/piment/engine.ts';
import { PEPPER_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/piment/engine/piment/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/piment/engine/piment/loci.ts';
import { runProgram } from '../../src/ateliers/piment/engine/piment/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/piment/engine/piment/garden.ts';
import { pepperNutrientPlan } from '../../src/ateliers/piment/engine/piment/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new PepperEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const frac = <T,>(list: T[], f: (x: T) => boolean) => list.filter(f).length / list.length;

// 1. Catalogue
check(`catalogue (${PEPPER_VARIETIES.length} variétés)`, PEPPER_VARIETIES.length >= 85);
check('ids uniques', new Set(PEPPER_VARIETIES.map((v) => v.id)).size === PEPPER_VARIETIES.length);
check('variantes connues', PEPPER_VARIETIES.every((v) => v.variants.every((x) => VARIANT_ALLELE[x])));
check('les 5 espèces sont représentées', new Set(PEPPER_VARIETIES.map((v) => v.species)).size === 5);
let bad = 0;
for (const v of PEPPER_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightKg / v.weightKg;
  const sh = f.pheno.shapeRatio / v.shapeRatio;
  const heatOk = v.shu === 0 ? f.pheno.shu === 0 : f.pheno.shu / v.shu > 0.5 && f.pheno.shu / v.shu < 2;
  if ((!v.hybrid && !e.isFixed(f)) || w < 0.62 || w > (v.hybrid ? 1.65 : 1.45) || sh < 0.78 || sh > 1.3 || !heatOk || Math.abs(f.pheno.days - v.days) > 15) {
    bad++;
    console.log('   écart', v.name, { w: w.toFixed(2), sh: sh.toFixed(2), shu: f.pheno.shu, cible: v.shu, days: f.pheno.days });
  }
}
check('fondateurs fidèles à leur fiche', bad === 0);

// 2. Apparence
const exp: Array<[string, Partial<ReturnType<typeof e.appearance>>]> = [
  ['california-wonder', { ripe: 'red', shape: 'bell', sweet: true }],
  ['golden-california-wonder', { ripe: 'yellow' }],
  ['orange-sun', { ripe: 'orange' }],
  ['sweet-chocolate', { ripe: 'brown' }],
  ['purple-beauty', { unripe: 'purple', ripe: 'red' }],
  ['albino-bell', { unripe: 'ivory' }],
  ['habanero-white', { ripe: 'white' }],
  ['aji-cristal', { ripe: 'lemon' }],
  ['cayenne', { shape: 'thin', heat: 'hot' }],
  ['tabasco', { erect: true }],
  ['cayenne-bouquet', { clustered: true, erect: true }],
  ['rocoto-red', { blackSeeds: true, flower: 'purple' }],
  ['chiltepin', { deciduous: true }],
  ['carolina-reaper', { heat: 'extreme' }],
  ['topepo-rosso', { shape: 'flat' }],
  ['lamuyo', { shape: 'lamuyo' }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}

// 3. Piquant : Pun1 dominant
const f1h = e.cross(F('california-wonder'), F('cayenne'), 20);
check('Poivron × Cayenne : F1 toute piquante', f1h.every((x) => x.pheno.shu > 0));
const f2h = e.cross(f1h[0], f1h[0], 4000);
const ps = frac(f2h, (x) => x.pheno.shu === 0);
check(`F2 : ¼ de doux (${ps.toFixed(3)})`, Math.abs(ps - 0.25) < 0.025);

// 4. Couleur mûre à trois gènes : y × c2 → F1 rouge, F2 9:3:3:1
const f1c = e.cross(F('golden-california-wonder'), F('orange-sun'), 20);
check('Jaune (y) × Orange (c2) : F1 rouge', f1c.every((x) => e.appearance(x).ripe === 'red'));
const f2c = e.cross(f1c[0], f1c[0], 8000);
const col = (c: string) => frac(f2c, (x) => e.appearance(x).ripe === c);
const obs = [col('red'), col('orange'), col('yellow'), col('cream')];
const expd = [9 / 16, 3 / 16, 3 / 16, 1 / 16];
const chi2 = obs.reduce((s, o, i) => s + ((o - expd[i]) * 8000) ** 2 / (expd[i] * 8000), 0);
check(`F2 9:3:3:1 rouge/orange/jaune/crème (χ² = ${chi2.toFixed(2)})`, chi2 < 11.3, obs.map((x) => x.toFixed(3)).join(' '));
const f1b = e.cross(F('sweet-chocolate'), F('golden-california-wonder'), 5);
const f2b = e.cross(f1b[0], f1b[0], 4000);
const green = frac(f2b, (x) => e.appearance(x).ripe === 'green');
check(`Chocolat (cl) × Jaune (y) : 1/16 de fruits mûrs verts (${green.toFixed(3)})`, Math.abs(green - 1 / 16) < 0.015);

// 5. Série allélique L
const f1l = e.cross(F('l4-line'), F('yolo-wonder'), 10);
check('L4 × L1 : F1 L4', f1l.every((x) => e.lLevel(x) === 4));
const f2l = e.cross(f1l[0], f1l[0], 4000);
const l4 = frac(f2l, (x) => e.lLevel(x) === 4);
check(`F2 : ¾ L4, ¼ L1 (${l4.toFixed(3)})`, Math.abs(l4 - 0.75) < 0.025 && f2l.every((x) => e.lLevel(x) >= 1));

// 6. Liaison : Pvr4 (80 cM) et Tsw (95 cM) sur le chromosome 10
const donor = e.createCustom({ label: 'd', species: 'annuum', variants: ['Pvr4', 'Tsw', 'Me3'], targets: {} });
const het = e.cross(donor, F('california-wonder'), 1)[0];
let rec = 0;
let recU = 0;
const N = 20000;
for (let i = 0; i < N; i++) {
  const g = e.gamete(het);
  if ((g.pvr4 === 'Pvr4') !== (g.tsw === 'Tsw')) rec++;
  if ((g.pvr4 === 'Pvr4') !== (g.me3 === 'Me3')) recU++;
}
check(`Pvr4–Tsw liés : ${((rec / N) * 100).toFixed(1)} % de recombinants (attendu ${(kosambi(15) * 100).toFixed(1)} %)`, Math.abs(rec / N - kosambi(15)) < 0.012);
check(`Pvr4 (chr 10) et Me3 (chr 9) indépendants : ${(recU / N).toFixed(3)}`, Math.abs(recU / N - 0.5) < 0.015);

// 7. Barrières entre espèces
const cw = F('california-wonder');
check('Poivron × rocoto : impossible', e.crossCheck(cw, F('rocoto-red')).level === 'blocked' && e.cross(cw, F('rocoto-red'), 20).length === 0);
const ac = e.cross(cw, F('habanero-orange'), 2000);
check(`annuum ♀ × chinense ♂ : ~55 % de graines viables (${(ac.length / 2000).toFixed(2)}), F1 fertiles à ~55 %`, Math.abs(ac.length / 2000 - 0.55) < 0.04 && ac[0].fertility === 0.55 && ac[0].hybridWith === 'chinense');
check('chinense × frutescens : très proches', e.crossCheck(F('habanero-orange'), F('tabasco')).level === 'related');
const ab = e.cross(cw, F('aji-amarillo'), 2000);
check(`annuum × baccatum : peu de graines (${ab.length}/2000)`, ab.length > 60 && ab.length < 260);
const back = e.cross(ac[0], ac[0], 2000);
check(`hybride annuum × chinense autofécondé : graines réduites (${back.length}/2000)`, back.length > 900 && back.length < 1300);

// 8. Stérilité mâle cytoplasmique
const A = F('cms-a-line');
const B = F('cms-b-line');
const C = F('rf-c-line');
check('Lignée A : pas de pollen, pas besoin de castrer', !e.canPollinate(A) && !e.needsEmasculation(A) && e.needsEmasculation(B));
check('Lignée A : ni autofécondation ni père', e.cross(A, A, 10).length === 0 && e.cross(B, A, 10).length === 0);
const AB = e.cross(A, B, 50);
check('A × B (mainteneuse) : 100 % stériles, cytoplasme S hérité de la mère', AB.length === 50 && AB.every((x) => x.cyto === 'S' && !e.canPollinate(x)));
const AC = e.cross(A, C, 50);
check('A × C (Rf) : 100 % fertiles', AC.every((x) => e.canPollinate(x)));
const CA = e.cross(C, B, 50);
check('C × B : cytoplasme normal (N) de la mère', CA.every((x) => x.cyto === 'N'));
const f2cms = e.cross(AC[0], AC[0], 4000);
const st = frac(f2cms, (x) => !e.canPollinate(x));
check(`F2 de A × C : ¼ sans pollen (${st.toFixed(3)})`, Math.abs(st - 0.25) < 0.025);
const gochu = F('korean-gochu');
check('F1 coréen (CMS) : fertile mais porteur, cytoplasme S', gochu.cyto === 'S' && e.canPollinate(gochu) && e.dose(gochu.genotype, 'Rf') === 1);

// 9. Programme : poivron rouge doux résistant au virus Y (Pvr4 venu d’un piment)
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 12; i++) {
  const eng = new PepperEngine();
  eng.reseed(900 + i);
  const r = runProgram(eng, eng.createFromVariety(V('california-wonder')), eng.createFromVariety(V('cm334')), { notDeciduous: true, sweet: true, ripe: 'red', resistances: ['Pvr4'] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
  gens.push(r.final.generation);
}
check(`programme : poivron doux Pvr4 fixé (${ok}/12)`, ok >= 10, gens.join(','));
const rb = runProgram(e, F('california-wonder'), F('rocoto-red'), { notDeciduous: true, resistances: ['L1'] });
check('programme impossible entre poivron et rocoto', rb.stopped === 'blocked');
const rs = runProgram(e, F('cms-a-line'), null, { notDeciduous: true, resistances: [], sweet: false });
check('programme arrêté sur une lignée sans pollen', rs.stopped === 'sterile');

// 10. Jardin
const loss = (id: string, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, F(id), g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('tobamovirus P1.2 : L2 (Tabasco) ne suffit pas, L3 protège', loss('tabasco', 'tobamo', { ...DEFAULT_GARDEN, tobamo: 'P1.2' }) > 0.3 && loss('pi-159236', 'tobamo', { ...DEFAULT_GARDEN, tobamo: 'P1.2' }) < 0.05);
check('maladie bronzée : Tsw protège', loss('pi-152225', 'tswv', { ...DEFAULT_GARDEN, tswv: true }) < 0.1 && loss('habanero-orange', 'tswv', { ...DEFAULT_GARDEN, tswv: true }) > 0.3);
check('virus Y : Pvr4 > pvr2 > rien', loss('cm334', 'pvy', { ...DEFAULT_GARDEN, pvy: true }) < loss('yolo-y', 'pvy', { ...DEFAULT_GARDEN, pvy: true }) && loss('yolo-y', 'pvy', { ...DEFAULT_GARDEN, pvy: true }) < loss('california-wonder', 'pvy', { ...DEFAULT_GARDEN, pvy: true }));
const hab = F('habanero-orange');
const med = gardenOutcome(e, hab, { ...DEFAULT_GARDEN, climate: 'mediterranean' });
const mtn = gardenOutcome(e, hab, { ...DEFAULT_GARDEN, climate: 'mountain' });
check(`montagne : habanero moins piquant (${mtn.shu} vs ${med.shu}) et saison trop courte`, mtn.shu < med.shu * 0.85 && mtn.losses.some((l) => l.cause === 'season'));
const roc = gardenOutcome(e, F('rocoto-red'), { ...DEFAULT_GARDEN, climate: 'oceanic' }).losses.find((l) => l.cause === 'cool')!.pct;
const chi = gardenOutcome(e, hab, { ...DEFAULT_GARDEN, climate: 'oceanic' }).losses.find((l) => l.cause === 'cool')!.pct;
check('le rocoto supporte mieux le frais que le habanero', roc < chi);

// 11. Nutriments, classes
const nut = pepperNutrientPlan(e, cw);
check('nutriments : K₂O ≈ 1,67 × N', Math.abs(nut.season.K2O / nut.season.N - 7.5 / 4.5) < 0.05);
check('classes de piquant et de taille', heatClassOf(0) === 'sweet' && heatClassOf(5000) === 'medium' && heatClassOf(1_600_000) === 'extreme' && sizeClassOf(0.2) === 'giant');

// 12. Sauvegarde incomplète
const old = JSON.parse(JSON.stringify(cw));
delete old.genotype.me3;
delete old.cyto;
delete old.haps.height;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.me3) && n.cyto === 'N' && Array.isArray(n.haps.height));

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
