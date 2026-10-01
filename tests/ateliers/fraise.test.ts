/* Tests du moteur fraise : npm test */
import { FaEngine } from '../../src/ateliers/fraise/engine/fraise/engine.ts';
import { FA_VARIETIES, VARIETY_BY_ID } from '../../src/ateliers/fraise/engine/fraise/varieties.ts';
import { VARIANT_ALLELE, SPECIES_INFO } from '../../src/ateliers/fraise/engine/fraise/loci.ts';
import { speciesCompat } from '../../src/ateliers/fraise/engine/fraise/compat.ts';
import { runProgram } from '../../src/ateliers/fraise/engine/fraise/program.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/fraise/engine/fraise/garden.ts';
import { faNutrientPlan } from '../../src/ateliers/fraise/engine/fraise/nutrients.ts';
import { varietyFromIndividual } from '../../src/ateliers/fraise/fraise/myVarieties.ts';

let fail = 0;
function check(name: string, ok: boolean, info = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`);
  if (!ok) fail++;
}
const e = new FaEngine();
e.reseed(Number(process.env.SEED ?? 12345));
const V = (id: string) => {
  const x = VARIETY_BY_ID[id];
  if (!x) throw new Error(`variété inconnue ${id}`);
  return x;
};
const F = (id: string) => e.createFromVariety(V(id));
const share = <T>(l: T[], f: (x: T) => boolean) => l.filter(f).length / l.length;
const chi2 = (obs: number[], ratio: number[]) => {
  const n = obs.reduce((a, b) => a + b, 0);
  const t = ratio.reduce((a, b) => a + b, 0);
  return obs.reduce((s, o, i) => s + (o - (n * ratio[i]) / t) ** 2 / ((n * ratio[i]) / t), 0);
};

// 1. Catalogue
check(`catalogue (${FA_VARIETIES.length} variétés)`, FA_VARIETIES.length >= 30);
check('ids uniques', new Set(FA_VARIETIES.map((v) => v.id)).size === FA_VARIETIES.length);
check('variantes connues', FA_VARIETIES.every((v) => [...v.variants, ...(v.het ?? [])].every((x) => VARIANT_ALLELE[x])));
check('les 5 espèces sont représentées', new Set(FA_VARIETIES.map((v) => v.species)).size === 5);
check('ploïdies 8x, 6x, 2x', SPECIES_INFO.ananassa.ploidy === 8 && SPECIES_INFO.moschata.ploidy === 6 && SPECIES_INFO.vesca.ploidy === 2);
let bad = 0;
for (const v of FA_VARIETIES) {
  const f = e.createFromVariety(v);
  const w = f.pheno.weightG / v.weightG;
  if (w < 0.6 || w > 1.6 || Math.abs(f.pheno.early - v.early) > 10 || Math.abs(f.pheno.brix - v.brix) > 1.2 || Math.abs(f.pheno.firmness - v.firmness) > 1.2) {
    bad++;
    console.log('   écart', v.id, f.pheno, { w: v.weightG, e: v.early, b: v.brix, f: v.firmness });
  }
}
check('fondateurs proches de leur fiche', bad <= 2, `${bad} écarts`);

// 2. Phénotypes attendus
const expect: Array<[string, Partial<ReturnType<FaEngine['appearance']>>]> = [
  ['gariguette', { color: 'red', everbearing: false, maleSterile: false }],
  ['mara-des-bois', { everbearing: true, peach: true }],
  ['pineberry', { color: 'white' }],
  ['yellow-wonder', { color: 'yellow', everbearing: true, runnerless: true }],
  ['reine-des-vallees', { everbearing: true, runnerless: true }],
  ['fraise-des-bois', { everbearing: false, runnerless: false }],
  ['chili-frezier', { maleSterile: true }],
  ['virginiana-femelle', { maleSterile: true }],
  ['virginiana-glauca', { everbearing: true }],
];
for (const [id, want] of expect) {
  const app = e.appearance(F(id));
  const ok = Object.entries(want).every(([k, v]) => (app as unknown as Record<string, unknown>)[k] === v);
  check(`phénotype ${id}`, ok, ok ? '' : JSON.stringify(app));
}

// 3. Clones : une variété est hétérozygote, son stolon est identique
const gar = F('gariguette');
check('Gariguette hétérozygote (clone)', e.heterozygosity(gar) > 0.2, `${Math.round(e.heterozygosity(gar) * 100)} %`);
check('Gariguette pleine vigueur', e.vigor(gar.haps, 'ananassa') > 0.85, `${Math.round(e.vigor(gar.haps, 'ananassa') * 100)} %`);
const st = e.cloneOf(gar);
check('stolon = clone exact', JSON.stringify(st.genotype) === JSON.stringify(gar.genotype) && JSON.stringify(st.haps) === JSON.stringify(gar.haps) && st.cloneBy === 'runner' && st.clonedFromId === gar.id);
const rdv = F('reine-des-vallees');
check('fraisier des bois sans stolons : division', e.cloneOf(rdv).cloneBy === 'division');
check('Reine des vallées : lignée fixée', e.isFixed(rdv));
const gSeeds = e.cross(gar, F('gariguette'), 200);
check('semis de Gariguette : descendance variée', new Set(gSeeds.map((x) => Math.round(x.pheno.weightG))).size > 10);
check('croiser un clone avec lui-même = autofécondation', e.crossCheck(gar, st).reason === 'selfInbreeding');

// 4. Remontée : PFRU dominant (octoploïdes), sfl récessif (fraisier des bois)
const mara = F('mara-des-bois');
const m1 = e.cross(F('senga-sengana'), mara, 400);
const ev = m1.filter((x) => e.appearance(x).everbearing).length;
check('PFRU/+ × +/+ : ~1/2 remontantes', chi2([ev, 400 - ev], [1, 1]) < 6.6, `${ev}/400`);
const vF1 = e.cross(F('fraise-des-bois'), F('reine-des-vallees'), 50);
check('sfl récessif : F1 des bois × quatre-saisons non remontante', vF1.every((x) => !e.appearance(x).everbearing));
const vF2 = e.cross(vF1[0], vF1[1], 400);
const evF2 = vF2.filter((x) => e.appearance(x).everbearing).length;
check('sfl : F2 ~1/4 remontantes', chi2([evF2, 400 - evF2], [1, 3]) < 6.6, `${evF2}/400`);
check('F1 vesca × vesca : stolons de retour (r récessif)', vF1.every((x) => !e.appearance(x).runnerless));

// 5. Fruit blanc MYB10 récessif
const pw = e.cross(F('pineberry'), F('pineberry'), 100);
check('Pineberry × Pineberry : tout blanc', pw.every((x) => e.appearance(x).color === 'white'));
const pr = e.cross(F('pineberry'), F('elsanta'), 100);
check('Pineberry × rouge : F1 rouge', pr.every((x) => e.appearance(x).color === 'red'));
const pr2 = e.cross(pr[0], pr[1], 400);
const wh = pr2.filter((x) => e.appearance(x).color === 'white').length;
check('F2 : ~1/4 blanches', chi2([wh, 400 - wh], [1, 3]) < 6.6, `${wh}/400`);

// 6. Sexe : plantes femelles
const chili = F('chili-frezier');
check('femelle : pas de pollen', !e.canPollinate(chili));
check('femelle en père : bloqué', e.crossCheck(F('virginiana'), chili).level === 'blocked' && e.crossCheck(F('virginiana'), chili).reason === 'femaleFather');
const ch = e.cross(chili, F('virginiana'), 400);
const fem = ch.filter((x) => e.appearance(x).maleSterile).length;
check('Chili ♀ × Virginie : ~1/2 femelles (F dominant)', chi2([fem, 400 - fem], [1, 1]) < 6.6, `${fem}/400`);
check('Chili × Virginie : même ploïdie, fertile', e.crossCheck(chili, F('virginiana')).level === 'related' && ch.every((x) => x.fertility === 1));
check('femelle sans voisin : perte de pollinisation', gardenOutcome(e, chili, DEFAULT_GARDEN).losses.some((l) => l.cause === 'pollination'));

// 7. Barrières de ploïdie
check('8x × 8x : related', speciesCompat('ananassa', 'chiloensis').level === 'related');
check('8x × 2x : difficile, hybrides stériles', speciesCompat('ananassa', 'vesca').level === 'difficult' && speciesCompat('ananassa', 'vesca').hybridFertility === 0);
const pent = e.cross(gar, F('fraise-des-bois'), 400);
check('Gariguette × fraisier des bois : peu de graines', pent.length > 0 && pent.length < 120, `${pent.length}/400`);
check('… et toutes stériles', pent.every((x) => x.fertility === 0 && e.appearance(x).sterileHybrid));
if (pent[0]) {
  check('hybride stérile : croisement bloqué', e.crossCheck(pent[0], gar).level === 'blocked');
  check('hybride stérile : clonable par stolon', e.cloneOf(pent[0]).fertility === 0);
}
check('Capron (6x) × ananassa : difficile', e.crossCheck(gar, F('capron-royal')).level === 'difficult');

// 8. Consanguinité
let line = gar;
for (let i = 0; i < 4; i++) line = e.cross(line, line, 1)[0];
check('ananassa autofécondée 4 fois : vigueur < 70 %', e.vigor(line.haps, 'ananassa') < 0.7, `${Math.round(e.vigor(line.haps, 'ananassa') * 100)} %`);
check('fraisier des bois fixé : vigueur ≥ 90 %', e.vigor(rdv.haps, 'vesca') >= 0.9);

// 9. Résistances et jardin
const red = F('redgauntlet');
const g1 = { ...DEFAULT_GARDEN, redStele: true };
const lossOf = (ind: typeof gar, c: string, g = g1) => gardenOutcome(e, ind, g).losses.find((l) => l.cause === c)?.pct ?? 0;
check('Rpf1 protège de la stèle rouge', lossOf(red, 'redStele') < lossOf(gar, 'redStele') / 5);
const birds = { ...DEFAULT_GARDEN, birds: true };
check('oiseaux : fraise blanche épargnée', lossOf(F('pineberry'), 'birds', birds) < lossOf(gar, 'birds', birds));
const med = { ...DEFAULT_GARDEN, climate: 'mediterranean' as const };
check('climat méditerranéen : récolte plus précoce', gardenOutcome(e, gar, med).days < gardenOutcome(e, gar, DEFAULT_GARDEN).days);
check('botrytis plus fort sur fruit tendre', lossOf(F('madame-moutot'), 'botrytis', DEFAULT_GARDEN) > lossOf(F('camarosa'), 'botrytis', DEFAULT_GARDEN));

// 10. Nutriments
const plan = faNutrientPlan(e, gar);
check('nutriments : K₂O > N', plan.season.K2O > plan.season.N);
check('remontante : fructification gourmande', (() => {
  const p = faNutrientPlan(e, mara);
  return p.stages.find((s) => s.stage === 'fruiting')!.k2oG > p.stages.find((s) => s.stage === 'start')!.k2oG;
})());

// 11. Programme : remontante blanche
const res = runProgram(e, F('pineberry'), mara, { color: 'white', everbearing: true, resistances: [] }, { familySize: 80, maxGenerations: 6 });
check('programme : remontante blanche obtenue', res.goalReached && e.appearance(res.final).color === 'white' && e.appearance(res.final).everbearing, `${res.stopped} F${res.final.generation}`);
check('programme : essai clonal présent', res.steps.some((s) => s.kind === 'clone'));
const swapped = runProgram(e, gar, chili, { color: 'red', resistances: [] }, { familySize: 30, maxGenerations: 1 });
check('programme : plante femelle mise en mère', swapped.stopped !== 'blocked' && swapped.steps[0]?.chosen.parentIds?.[0] === chili.id);
const twoFemales = runProgram(e, chili, F('virginiana-femelle'), { color: 'red', resistances: [] });
check('programme : deux femelles → impossible', twoFemales.stopped === 'sterile' && twoFemales.totalGrown === 0);

// 12. Mes variétés : un clone conserve son génotype exact
const saved = varietyFromIndividual(e, res.final, 'Test blanche');
check('enregistrer un clone', saved !== null && saved.clone !== undefined);
if (saved) {
  const back = e.createFromVariety(saved);
  const norm = (g: Record<string, string[]>) => JSON.stringify(Object.keys(g).sort().map((k) => [...g[k]].sort()));
  check('clone ré-importé : même génotype et mêmes haplotypes', norm(back.genotype) === norm(res.final.genotype) && JSON.stringify(back.haps) === JSON.stringify(res.final.haps));
}
const vescaSeg = e.cross(F('fraise-des-bois'), F('reine-des-vallees'), 1)[0];
check('fraisier des bois non fixé : pas enregistrable', varietyFromIndividual(e, vescaSeg, 'x') === null);

console.log(fail ? `\n${fail} échec(s)` : '\nTout est OK');
process.exit(fail ? 1 : 0);
