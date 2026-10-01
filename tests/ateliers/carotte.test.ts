/* Tests du moteur carotte : npm test */
import { DcEngine, sizeClassOf } from '../../src/ateliers/carotte/engine/carotte/engine.ts';
import { DC_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/carotte/engine/carotte/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/carotte/engine/carotte/loci.ts';
import { runProgram } from '../../src/ateliers/carotte/engine/carotte/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/carotte/engine/carotte/garden.ts';
import { dcNutrientPlan } from '../../src/ateliers/carotte/engine/carotte/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new DcEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const mean = (l: { pheno: { weightG: number } }[]) => l.reduce((s, x) => s + x.pheno.weightG, 0) / l.length;
const chi2 = (obs: number[], ratio: number[]) => {
  const n = obs.reduce((a, b) => a + b, 0);
  const t = ratio.reduce((a, b) => a + b, 0);
  return obs.reduce((s, o, i) => s + (o - (n * ratio[i]) / t) ** 2 / ((n * ratio[i]) / t), 0);
};

// 1. Catalogue
check(`catalogue (${DC_VARIETIES.length} variétés)`, DC_VARIETIES.length >= 40);
check('ids uniques', new Set(DC_VARIETIES.map((v) => v.id)).size === DC_VARIETIES.length);
check('variantes connues', DC_VARIETIES.every((v) => [...v.variants, ...(v.het ?? [])].every((x) => VARIANT_ALLELE[x])));
check('les 5 espèces sont représentées', new Set(DC_VARIETIES.map((v) => v.species)).size === 5);
let bad = 0;
for (const v of DC_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightG / v.weightG;
  const l = f.pheno.lengthCm / v.lengthCm;
  if (w < 0.7 || w > 1.4 || l < 0.75 || l > 1.33 || Math.abs(f.pheno.days - v.days) > 10 || Math.abs(f.pheno.brix - v.brix) > 1) {
    bad++;
    console.log('   écart', v.name, { w: w.toFixed(2), l: l.toFixed(2), days: f.pheno.days, brix: f.pheno.brix });
  }
}
check('fondateurs fidèles à leur fiche', bad === 0);

// 2. Aspect
const exp: Array<[string, Record<string, unknown>]> = [
  ['nantaise-2', { color: 'orange', annual: false, maleSterile: false }],
  ['jaune-doubs', { color: 'yellow' }],
  ['blanche-collet-vert', { color: 'white' }],
  ['kintoki', { color: 'red' }],
  ['purple-haze', { color: 'purple', purple: 'outer', core: 'orange', maleSterile: true, sterility: 'petaloid' }],
  ['black-nebula', { purple: 'full' }],
  ['pusa-asita', { annual: true }],
  ['lignee-ba', { maleSterile: true, sterility: 'brownAnther' }],
  ['lignee-b', { maleSterile: false }],
  ['carotte-sauvage', { color: 'white' }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}
check('Grelot : racine ronde ; Flakkee : longue', e.rootShape(F('grelot')) === 'round' && e.rootShape(F('flakkee')) === 'long');

// 3. Épistasie : blanc × jaune → F2 12 blanches : 3 jaunes : 1 orange
const whiteY2 = e.createCustom({ label: 'blanche y2', species: 'sativus', variants: ['Y', 'y2'], targets: {} });
const f1 = e.cross(whiteY2, F('solar-yellow'), 20);
check('F1 blanc × jaune : toutes blanches (Y dominant)', f1.every((x) => e.appearance(x).color === 'white'));
const f2 = e.cross(f1[0], f1[0], 6400);
const cls = [f2.filter((x) => e.appearance(x).color === 'white').length, f2.filter((x) => e.appearance(x).color === 'yellow').length, f2.filter((x) => e.appearance(x).color === 'orange').length];
const x2 = chi2(cls, [12, 3, 1]);
check(`F2 : 12 : 3 : 1 (${cls.join(' : ')}, χ² = ${x2.toFixed(2)})`, x2 < 13.8);
check('pollen de carotte sauvage : F1 à racine blanche', e.cross(F('nantaise-2'), F('carotte-sauvage'), 20).every((x) => e.appearance(x).color === 'white'));
check('violet dominant (P1)', e.cross(F('nantaise-2'), F('cosmic-purple'), 20).every((x) => e.appearance(x).purple === 'outer'));

// 4. Stérilité mâle cytoplasmique
const sp = F('lignee-sp');
const b = F('lignee-b');
const spB = e.cross(sp, b, 30);
check('Sp × mainteneur : F1 toutes mâles stériles (cytoplasme maternel)', spB.length === 30 && spB.every((x) => x.cyto === 'Sp' && e.isMaleSterile(x)));
check('Sp × restaurateur Rfp : F1 fertiles', e.cross(sp, F('lignee-rfp'), 20).every((x) => !e.isMaleSterile(x)));
check('mère pétaloïde en père : impossible', e.crossCheck(b, sp).level === 'blocked' && e.crossCheck(b, sp).reason === 'petaloidFather');
check('hybride F1 du commerce (Sp) : pas de pollen', !e.canPollinate(F('napoli')));

// 5. Consanguinité et hybrides
const nant = F('nantaise-2');
const s1 = e.cross(nant, nant, 200);
const clones = Array.from({ length: 40 }, () => e.cloneOf(nant));
check(`dépression de consanguinité : S1 ${mean(s1).toFixed(0)} g < clones ${mean(clones).toFixed(0)} g`, mean(s1) < mean(clones) * 0.9);
const hyb = e.cross(b, F('lignee-rfp'), 60);
check(`vigueur hybride : lignées ${b.pheno.weightG} g, F1 ${mean(hyb).toFixed(0)} g`, mean(hyb) > b.pheno.weightG * 1.5);

// 6. Espèces
check('D. pusillus (2n = 22) : impossible', e.crossCheck(nant, F('pusillus')).level === 'blocked');
check('D. capillifolius : difficile', e.crossCheck(nant, F('capillifolius')).level === 'difficult');
check('carotte sauvage : même espèce', e.crossCheck(nant, F('carotte-sauvage')).level === 'related');

// 7. Programme : carotte rouge à peau violette
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 10; i++) {
  const eng = new DcEngine();
  eng.reseed(700 + i);
  const r = runProgram(eng, eng.createFromVariety(V('kintoki')), eng.createFromVariety(V('cosmic-purple')), { core: 'red', purple: 'outer', resistances: [] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
  gens.push(r.final.generation);
}
check(`programme : carotte rouge à peau violette, fixée (${ok}/10)`, ok >= 8, gens.join(','));
check('programme avec une mère F1 pétaloïde : descendance sans pollen', runProgram(e, F('flyaway'), F('kintoki'), { core: 'red', resistances: ['cf'] }).stopped === 'sterile');

// 8. Jardin
const lossOf = (x: ReturnType<typeof F>, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, x, g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('carotte annuelle (Vrn1) : monte en graines', lossOf(F('pusa-asita'), 'bolting') > 0.5 && lossOf(nant, 'bolting') === 0);
check('nématodes : Mj-1 protège', lossOf(F('brasilia'), 'nematode', { ...DEFAULT_GARDEN, nematode: true }) < 0.05 && lossOf(nant, 'nematode', { ...DEFAULT_GARDEN, nematode: true }) > 0.2);
check('mouche : cf réduit les dégâts', lossOf(F('flyaway'), 'fly', { ...DEFAULT_GARDEN, fly: true }) < lossOf(nant, 'fly', { ...DEFAULT_GARDEN, fly: true }));

// 9. Nutriments, classes, sauvegarde
const nut = dcNutrientPlan(e, nant);
check('nutriments : potasse > azote', nut.season.K2O > nut.season.N);
check('classes de taille', sizeClassOf(20) === 'mini' && sizeClassOf(400) === 'giant');
const old = JSON.parse(JSON.stringify(nant));
delete old.genotype.cf;
delete old.haps.brix;
delete old.cyto;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.cf) && Array.isArray(n.haps.brix) && n.cyto === 'N');

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
