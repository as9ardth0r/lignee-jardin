/* Tests du moteur chou : npm test */
import { BrEngine, sizeClassOf } from '../../src/ateliers/chou/engine/chou/engine.ts';
import { BR_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/chou/engine/chou/varieties.ts';
import { VARIANT_ALLELE } from '../../src/ateliers/chou/engine/chou/loci.ts';
import { runProgram } from '../../src/ateliers/chou/engine/chou/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/chou/engine/chou/garden.ts';
import { brNutrientPlan } from '../../src/ateliers/chou/engine/chou/nutrients.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new BrEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const frac = <T,>(list: T[], f: (x: T) => boolean) => list.filter(f).length / list.length;

// 1. Catalogue
check(`catalogue (${BR_VARIETIES.length} variétés)`, BR_VARIETIES.length >= 60);
check('ids uniques', new Set(BR_VARIETIES.map((v) => v.id)).size === BR_VARIETIES.length);
check('variantes connues', BR_VARIETIES.every((v) => [...v.variants, ...(v.het ?? [])].every((x) => VARIANT_ALLELE[x])));
check('les 8 espèces sont représentées', new Set(BR_VARIETIES.map((v) => v.species)).size === 8);
let bad = 0;
for (const v of BR_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightKg / v.weightKg;
  const h = f.pheno.heightCm / v.heightCm;
  if (w < 0.7 || w > 1.4 || h < 0.75 || h > 1.33 || Math.abs(f.pheno.days - v.days) > 16 || Math.abs(f.pheno.frostC - v.frostC) > 2) {
    bad++;
    console.log('   écart', v.name, { w: w.toFixed(2), h: h.toFixed(2), days: f.pheno.days, frost: f.pheno.frostC });
  }
}
check('fondateurs fidèles à leur fiche', bad === 0);

// 2. Morphotypes
const exp: Array<[string, Record<string, unknown>]> = [
  ['quintal-alsace', { morphotype: 'cabbage', purple: false }],
  ['tete-noire', { morphotype: 'cabbage', purple: true }],
  ['milan-pontoise', { morphotype: 'cabbage', savoy: true }],
  ['frise-nord', { morphotype: 'kale', curly: true }],
  ['merveille-saisons', { morphotype: 'cauliflower', curd: 'white' }],
  ['cheddar', { morphotype: 'cauliflower', curd: 'orange' }],
  ['graffiti', { morphotype: 'cauliflower', curd: 'purple', maleSterile: true }],
  ['romanesco', { morphotype: 'romanesco', curd: 'green' }],
  ['calabrese', { morphotype: 'broccoli', annual: true }],
  ['long-island', { morphotype: 'sprouts' }],
  ['vienne', { morphotype: 'kohlrabi' }],
  ['navet-milan', { morphotype: 'turnip', genome: 'AA' }],
  ['chou-chinois', { morphotype: 'cabbage', genome: 'AA' }],
  ['rutabaga', { morphotype: 'turnip', genome: 'AACC', selfCompatible: true }],
  ['daikon', { morphotype: 'radish', genome: 'RR' }],
  ['radis-ogura', { maleSterile: true }],
  ['colza-ogura', { maleSterile: false }],
];
for (const [id, want] of exp) {
  const a = e.appearance(F(id)) as unknown as Record<string, unknown>;
  const ok = Object.entries(want).every(([k, val]) => a[k] === val);
  check(`${id} : ${JSON.stringify(want)}`, ok, ok ? '' : JSON.stringify(a));
}

// 3. Une seule espèce : chou pommé × chou-fleur
const cab = F('quintal-alsace');
const cau = F('snowball');
const f1 = e.cross(cab, cau, 30);
check('chou pommé × chou-fleur : F1 à pomme lâche (He/he, cu récessif)', f1.length > 20 && f1.every((x) => e.appearance(x).morphotype === 'looseHead'));
const f2 = e.cross(f1[0], f1[0], 6000);
const cf = frac(f2, (x) => e.appearance(x).morphotype === 'cauliflower');
check(`F2 : ¼ de choux-fleurs (${cf.toFixed(3)})`, Math.abs(cf - 0.25) < 0.025);
const heads = frac(f2.filter((x) => !e.has(x.genotype, 'cu')), (x) => e.appearance(x).morphotype === 'cabbage');
check(`F2 (hors choux-fleurs) : ¼ de choux pommés (dominance incomplète) (${heads.toFixed(3)})`, Math.abs(heads - 0.25) < 0.025);
const red = e.cross(F('tete-noire'), cab, 20);
check('rouge × blanc : F1 rouge (BoMYB2 dominant)', red.every((x) => e.appearance(x).purple));

// 4. Auto-incompatibilité
const selfCheck = e.crossCheck(cab, cab);
check('chou auto-incompatible : autofécondation en boutons seulement (~40 %)', selfCheck.budSelf === true && Math.abs(selfCheck.effectiveSeedSet - 0.4) < 0.01);
const self = e.cross(cab, cab, 2000);
check(`… ${self.length} graines sur 2000 boutons`, self.length > 700 && self.length < 900);
check('rutabaga (Sf/Sf) : autofécondation normale', e.crossCheck(F('rutabaga'), F('rutabaga')).effectiveSeedSet === 1);
const sib1 = e.createCustom({ label: 'x', species: 'oleracea', variants: ['S2', 'S4'], targets: {} });
const sib2 = e.createCustom({ label: 'y', species: 'oleracea', variants: ['S4', 'S5'], targets: {} });
const sib3 = e.createCustom({ label: 'z', species: 'oleracea', variants: ['S1', 'S3'], targets: {} });
check('deux plantes avec un allèle S commun : presque pas de graines', e.crossCheck(sib1, sib2).effectiveSeedSet < 0.1 && e.crossCheck(sib1, sib2).sharedS?.[0] === 'S4');
check('allèles S tous différents : croisement normal', e.crossCheck(sib1, sib3).effectiveSeedSet === 1);

// 5. Ogura
const ogu = F('ogura-cabbage');
check('chou Ogura : mâle stérile, pas d’autofécondation, bonne mère', !e.canPollinate(ogu) && e.cross(ogu, ogu, 10).length === 0 && e.cross(ogu, F('copenhagen'), 10).length === 10);
check('cytoplasme maternel : F1 Ogura stériles (pas de Rfo chez le chou)', e.cross(ogu, F('copenhagen'), 10).every((x) => x.cyto === 'Ogu' && !e.canPollinate(x)));
check('colza Ogura + Rfo : fertile', e.canPollinate(F('colza-ogura')));

// 6. Triangle de U et Karpechenko
const nav = F('navet-milan');
const ac = e.crossCheck(nav, F('copenhagen'));
check(`navet ♀ × chou ♂ : rares graines (${(ac.effectiveSeedSet * 100).toFixed(0)} %), hybrides AC presque stériles`, ac.effectiveSeedSet < 0.08 && ac.childGenome === 'AC' && ac.f1Fertility < 0.05);
const cop = F('copenhagen');
const hyb = e.cross(nav, cop, 2000).filter((x) => x.genome === 'AC');
check(`hybrides AC obtenus (${hyb.length})`, hyb.length > 20 && hyb.every((x) => x.fertility < 0.05 && e.canDouble(x)));
const syn = e.doubleChromosomes(hyb[0]);
check('doublement : AC → AACC = colza de synthèse, fertile', syn.genome === 'AACC' && syn.species === 'napus' && syn.fertility >= 0.6 && !e.canDouble(syn));
const kar = e.cross(F('daikon'), F('golden-acre'), 4000).filter((x) => x.genome === 'CR');
check(`radis ♀ × chou ♂ : hybrides CR (${kar.length})`, kar.length > 20);
const rb = e.doubleChromosomes(kar[0]);
check('doublement : CR → CCRR = radis-chou de Karpechenko', rb.genome === 'CCRR' && rb.species === 'raphanobrassica');
check('chou × colza : pont possible (génome C commun)', e.crossCheck(cab, F('rutabaga')).level === 'difficult' && e.crossCheck(cab, F('rutabaga')).effectiveSeedSet > 0.2);

// 7. Programme : un chou-fleur violet à partir d’un chou rouge et d’un chou-fleur blanc
let ok = 0;
const gens: number[] = [];
for (let i = 0; i < 10; i++) {
  const eng = new BrEngine();
  eng.reseed(700 + i);
  const r = runProgram(eng, eng.createFromVariety(V('merveille-saisons')), eng.createFromVariety(V('tete-noire')), { domesticated: false, morphotype: 'cauliflower', purple: true, resistances: [] }, { familySize: 40, maxGenerations: 10 });
  if (r.goalReached && r.fixed) ok++;
  gens.push(r.final.generation);
}
check(`programme : chou-fleur violet fixé (${ok}/10)`, ok >= 8, gens.join(','));
check('programme impossible avec une mère Ogura stérile en autofécondation', runProgram(e, ogu, null, { domesticated: false, resistances: ['Foc1'] }).stopped === 'sterile');

// 8. Jardin
const loss = (ind: ReturnType<typeof F>, cause: string, g = DEFAULT_GARDEN) => gardenOutcome(e, ind, g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('hernie : CRa protège', loss(F('kilaxy'), 'clubroot', { ...DEFAULT_GARDEN, clubroot: true }) < 0.1 && loss(cab, 'clubroot', { ...DEFAULT_GARDEN, clubroot: true }) > 0.5);
check('fusariose : FOC1 protège', loss(F('wisconsin-all-seasons'), 'fusarium', { ...DEFAULT_GARDEN, fusarium: true }) < 0.05 && loss(cab, 'fusarium', { ...DEFAULT_GARDEN, fusarium: true }) > 0.2);
check('hiver continental : le kale tient, le chou-fleur gèle', loss(F('frise-nord'), 'frost', { ...DEFAULT_GARDEN, climate: 'continental', winter: true }) === 0 && loss(cau, 'frost', { ...DEFAULT_GARDEN, climate: 'continental', winter: true }) > 0.5);

// 9. Nutriments, classes
const nut = brNutrientPlan(e, cab);
check('nutriments : potasse > azote, soufre compté', nut.season.K2O > nut.season.N && nut.sulfurG > 0);
check('classes de taille', sizeClassOf(0.1) === 'mini' && sizeClassOf(4) === 'giant');

// 10. Sauvegarde incomplète
const old = JSON.parse(JSON.stringify(cab));
delete old.genotype.gr;
delete old.haps.frost;
delete old.genome;
const n = e.normalize(old);
check('normalisation', Array.isArray(n.genotype.gr) && Array.isArray(n.haps.frost) && n.genome === 'CC');

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
