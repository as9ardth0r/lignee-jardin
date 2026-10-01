/* Tests du moteur pomme de terre : npm test */
import { PtEngine, sizeClassOf } from '../../src/ateliers/patate/engine/patate/engine.ts';
import { PT_VARIETIES, VARIETY_BY_ID, type PtVariety } from '../../src/ateliers/patate/engine/patate/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/patate/engine/patate/loci.ts';
import { runProgram } from '../../src/ateliers/patate/engine/patate/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/patate/engine/patate/garden.ts';
import { ptNutrientPlan } from '../../src/ateliers/patate/engine/patate/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new PtEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const frac = <T,>(list: T[], f: (x: T) => boolean) => list.filter(f).length / list.length;
const mk = (over: Partial<PtVariety>): PtVariety => ({ id: 'x', name: 'x', species: 'tuberosum', alleles: {}, weightKg: 1, days: 110, dm: 20, frostC: -1, kinds: [], source: 'curated', ...over });

// 1. Catalogue
check(`catalogue (${PT_VARIETIES.length} variétés)`, PT_VARIETIES.length >= 50);
check('ids uniques', new Set(PT_VARIETIES.map((v) => v.id)).size === PT_VARIETIES.length);
check('variantes connues', PT_VARIETIES.every((v) => Object.keys(v.alleles).every((x) => VARIANT_ALLELE[x as keyof typeof VARIANT_ALLELE])));
check('les 10 espèces sont représentées', new Set(PT_VARIETIES.map((v) => v.species)).size === 10);
let bad = 0;
for (const v of PT_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightKg / v.weightKg;
  if (w < 0.7 || w > 1.4 || Math.abs(f.pheno.days - v.days) > 12 || Math.abs(f.pheno.dm - v.dm) > 1.5 || Math.abs(f.pheno.frostC - v.frostC) > 0.8) {
    bad++;
    console.log('   écart', v.name, { w: w.toFixed(2), days: f.pheno.days, dm: f.pheno.dm, frost: f.pheno.frostC });
  }
}
check('fondateurs fidèles à leur fiche', bad === 0);

// 2. Aspect
const exp: Array<[string, Record<string, unknown>]> = [
  ['charlotte', { skin: 'buff', flesh: 'yellow', shape: 'oval', ploidy: 4, selfCompatible: true }],
  ['russet-burbank', { flesh: 'white', shape: 'long' }],
  ['bintje', { flesh: 'cream' }],
  ['ratte', { shape: 'long', flesh: 'yellow' }],
  ['roseval', { skin: 'red', flesh: 'yellow' }],
  ['vitelotte', { skin: 'purple', flesh: 'purple', deepEyes: true }],
  ['highland-burgundy', { skin: 'red', flesh: 'red' }],
  ['yema-de-huevo', { flesh: 'orange', ploidy: 2, selfCompatible: false }],
  ['papa-criolla', { shape: 'round', longDay: false }],
  ['m6', { selfCompatible: true }],
  ['ps-stock', { twoNPollen: true }],
  ['stoloniferum', { maleSterile: true, ebn: 2, ploidy: 4 }],
  ['demissum', { ploidy: 6, ebn: 4 }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}

// 3. Ségrégation tétrasomique : YYyy autofécondé → 1/36 de chair blanche
const duplex = e.createFromVariety(mk({ alleles: { Y: 2, Cdf: 4 } }));
const s1 = e.cross(duplex, duplex, 7200);
const white = frac(s1, (x) => e.appearance(x).flesh === 'white');
check(`YYyy ⊗ : 1/36 de yyyy (${white.toFixed(4)})`, Math.abs(white - 1 / 36) < 0.008 && s1.length > 6000);
const pred = e.predict(duplex, duplex).find((p) => p.variant === 'Y');
check('prédiction de Mendel 35/36', !!pred && Math.abs(pred.pExpressed - 35 / 36) < 1e-9);
const simplexD = e.createFromVariety(mk({ species: 'chacoense', alleles: { Sli: 2, Y: 1 }, s: ['S3'] }));
const d1 = e.cross(simplexD, simplexD, 4000);
check(`diploïde Yy ⊗ (Sli) : 1/4 de yy (${frac(d1, (x) => e.appearance(x).flesh === 'white').toFixed(3)})`, Math.abs(frac(d1, (x) => e.appearance(x).flesh === 'white') - 0.25) < 0.025);

// 4. EBN, gamètes 2n, ploïdie
const cha = F('charlotte');
const crio = F('papa-criolla');
const ps = F('ps-stock');
const c1 = e.crossCheck(cha, crio);
const c2 = e.crossCheck(cha, ps);
check(`4x × 2x sans ps : presque rien (${(c1.effectiveSeedSet * 100).toFixed(1)} %)`, c1.effectiveSeedSet < 0.06);
check(`4x × 2x ps/ps : graines par pollen 2n (${(c2.effectiveSeedSet * 100).toFixed(0)} %)`, c2.effectiveSeedSet > 0.15 && c2.viaTwoN === true && c2.childPloidy === 4);
const kids = e.cross(cha, ps, 600);
check(`descendants tétraploïdes 4EBN (${kids.length})`, kids.length > 60 && kids.every((x) => x.ploidy === 4 && x.ebn === 4));
const blb = F('bulbocastanum');
check('pomme de terre × S. bulbocastanum (1EBN) : impossible', e.crossCheck(cha, blb).level === 'blocked' && e.crossCheck(cha, blb).reason === 'ebn');
const blb4 = e.doubleChromosomes(blb);
check('bulbocastanum doublé : 4x 2EBN', blb4.ploidy === 4 && blb4.ebn === 2);
const bridge = e.cross(blb4, F('chacoense'), 400);
check(`pont : bulbocastanum 4x × chacoense 2x → triploïdes (${bridge.length})`, bridge.length > 50 && bridge.every((x) => x.ploidy === 3 && x.fertility < 0.1));
const pent = e.cross(F('demissum'), cha, 300);
check(`S. demissum (6x 4EBN) × pomme de terre → pentaploïdes (${pent.length})`, pent.length > 30 && pent.every((x) => x.ploidy === 5));

// 5. Auto-incompatibilité gamétophytique
check('Phureja S1S2 autofécondée : rejet', e.crossCheck(crio, crio).level === 'blocked' && e.crossCheck(crio, crio).reason === 'siSelf');
const semi = e.createFromVariety(mk({ species: 'phureja', alleles: {}, s: ['S1', 'S3'] }));
const cs = e.crossCheck(crio, semi);
check(`un allèle S commun : la moitié du pollen arrêtée, graines quand même (${(cs.effectiveSeedSet * 100).toFixed(0)} %)`, Math.abs((cs.siRejected ?? 0) - 0.5) < 0.12 && cs.effectiveSeedSet > 0.7);
check('M6 (Sli) s’autoféconde', e.cross(F('m6'), F('m6'), 50).length > 40);
check('tétraploïde autocompatible', e.cross(cha, cha, 50).length > 40);

// 6. Cytoplasme W, inducteur
const sto = F('stoloniferum');
check('S. stoloniferum (W) en père : pas de pollen', e.crossCheck(cha, sto).level === 'blocked' && e.crossCheck(cha, sto).reason === 'wFather');
const ind = e.cross(cha, F('ivp101'), 2000);
const dih = ind.filter((x) => x.dihaploidOf === cha.id);
check(`IVP101 : dihaploïdes (${dih.length}) 2x 2EBN`, dih.length > 40 && dih.every((x) => x.ploidy === 2 && x.ebn === 2));

// 7. Consanguinité, clonage, dégénérescence
const selfed = e.cross(cha, cha, 200);
const mean = (l: { pheno: { weightKg: number } }[]) => l.reduce((s, x) => s + x.pheno.weightKg, 0) / l.length;
const clones = Array.from({ length: 30 }, () => e.cloneOf(cha));
check(`dépression de consanguinité : S1 ${mean(selfed).toFixed(2)} kg < clones ${mean(clones).toFixed(2)} kg`, mean(selfed) < mean(clones) * 0.92);
check('DM1-3 homozygote et chétive', e.isFixed(F('dm1-3')) && F('dm1-3').pheno.weightKg < 0.2);
const cl = e.cloneOf(cha);
check('clone : génotype identique, une génération de tubercule de plus', JSON.stringify(cl.genotype) === JSON.stringify(cha.genotype) && cl.tuberGen === 1);
const vir = { ...DEFAULT_GARDEN, blight: false, virus: true };
const lossOf = (x: typeof cha, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, x, g).losses.find((l) => l.cause === cause)?.pct ?? 0;
let old = cha;
for (let i = 0; i < 4; i++) old = e.cloneOf(old);
check('virus Y : dégénérescence au fil des replantations', lossOf(old, 'virus', vir) > lossOf(cha, 'virus', vir) + 0.3);
check('Ry protège', lossOf(F('pirola'), 'virus', vir) === 0);

// 8. Jardin
const bl = { ...DEFAULT_GARDEN, blight: true };
check('mildiou : Rpi-blb protège, R1 contourné, Bintje sensible', lossOf(F('bionica'), 'blight', bl) < 0.05 && lossOf(F('kennebec'), 'blight', bl) > 0.3 && lossOf(F('bintje'), 'blight', bl) > 0.4);
check('andigena sans Cdf : ne tubérise pas en jours longs', lossOf(F('cpc1673'), 'photoperiod') > 0.5 && lossOf(F('cpc1673'), 'photoperiod', { ...DEFAULT_GARDEN, climate: 'andes' }) === 0);
check('nématode : H1 protège', lossOf(F('maris-piper'), 'nematode', { ...DEFAULT_GARDEN, nematode: true }) < 0.05 && lossOf(F('bintje'), 'nematode', { ...DEFAULT_GARDEN, nematode: true }) > 0.3);

// 9. Programme : une Charlotte à chair violette, clonée
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 10; i++) {
  const eng = new PtEngine();
  eng.reseed(700 + i);
  const r = runProgram(eng, eng.createFromVariety(V('charlotte')), eng.createFromVariety(V('vitelotte')), { flesh: 'purple', shape: 'oval', resistances: ['H1'] }, { familySize: 60, maxGenerations: 8 });
  if (r.goalReached && r.fixed && r.final.tuberGen === 1) ok++;
  gens.push(r.steps.length);
}
check(`programme : pomme de terre violette ovale H1, clonée (${ok}/10)`, ok >= 8, gens.join(','));
check('programme bloqué (EBN)', runProgram(e, cha, blb, { resistances: ['Rpi-blb1'] }).stopped === 'blocked');

// 10. Nutriments, classes, sauvegarde
const nut = ptNutrientPlan(e, cha);
check('nutriments : potasse > azote', nut.season.K2O > nut.season.N);
check('classes de taille', sizeClassOf(0.1) === 'mini' && sizeClassOf(2.5) === 'giant');
const o = JSON.parse(JSON.stringify(cha));
delete o.genotype.ry;
delete o.haps.dm;
delete o.tuberGen;
const n = e.normalize(o);
check('normalisation', n.genotype.ry.length === 4 && n.haps.dm.length === 4 && n.tuberGen === 0);

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
