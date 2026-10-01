import { TomatoEngine } from '../../src/ateliers/tomate/engine/tomato/engine.ts';
import { TOMATO_VARIETIES, loadExtendedVarieties } from '../../src/ateliers/tomate/engine/tomato/varieties.ts';
import { LOCUS_IDS } from '../../src/ateliers/tomate/engine/tomato/loci.ts';
import { runProgram, conforms } from '../../src/ateliers/tomate/engine/tomato/program.ts';
import { tomatoNutrientPlan } from '../../src/ateliers/tomate/engine/tomato/nutrients.ts';
import { gardenOutcome, DEFAULT_GARDEN } from '../../src/ateliers/tomate/engine/tomato/garden.ts';
import { kosambi } from '../../src/ateliers/tomate/engine/tomato/engine.ts';

let fail = 0;
const check = (name: string, ok: boolean, info = '') => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${name} ${info}`); if (!ok) fail++; };
const e = new TomatoEngine(42);
const V = (id: string) => TOMATO_VARIETIES.find((v) => v.id === id)!;

// 1. Fondateurs : homozygotes, phénotype proche de la fiche
for (const v of TOMATO_VARIETIES) {
  const ws: number[] = [], bs: number[] = [], ds: number[] = [];
  for (let i = 0; i < 200; i++) { const f = e.createFromVariety(v); ws.push(f.pheno.weightG); bs.push(f.pheno.brix); ds.push(f.pheno.days);
    if (e.heterozygosity(f) !== 0) { check('homozygote ' + v.name, false); break; } }
  const med = (a: number[]) => a.sort((x, y) => x - y)[a.length >> 1];
  const okW = Math.abs(Math.log(med(ws) / v.weightG)) < 0.35, okB = Math.abs(med(bs) - v.brix) < 0.8, okD = Math.abs(med(ds) - v.days) < 7;
  check(`fondateur ${v.name}`, okW && okB && okD, `poids ${med(ws)}/${v.weightG} brix ${med(bs)}/${v.brix} jours ${med(ds)}/${v.days}`);
}

// 2. Apparence attendue
const app = (id: string) => e.appearance(e.createFromVariety(V(id)));
check('Cherokee = pourpre', app('cherokee-purple').colorKey === 'purple');
check('Noire de Crimée = noire', app('noire-de-crimee').colorKey === 'black');
check('Green Zebra = verte rayée', app('green-zebra').colorKey === 'green' && app('green-zebra').striped);
check('Brandywine = rose', app('brandywine').colorKey === 'pink');
check('Moonglow = orange', app('moonglow').colorKey === 'orange');
check('Indigo Rose = indigo', app('indigo-rose').anthocyanin === 'indigo');
check('San Marzano = allongée', app('san-marzano').shape === 'elongated');
check('Cœur de bœuf = cœur', app('coeur-de-boeuf').shape === 'heart');
check('Yellow Pear = poire jaune', app('yellow-pear').shape === 'pear' && app('yellow-pear').colorKey === 'yellow');

// 3. F1 Moneymaker × Cherokee Purple : tout rouge, hétérozygote ; F2 : 9:3:3:1 sur gf & y
const mm = e.createFromVariety(V('moneymaker')), cp = e.createFromVariety(V('cherokee-purple'));
const f1 = e.cross(mm, cp, 50);
check('F1 uniforme rouge', f1.every((x) => e.appearance(x).colorKey === 'red'));
check('F1 porteuse gf', f1.every((x) => e.isCarrier(x.genotype, 'gf')));
const f2 = e.cross(f1[0], f1[0], 16000);
const cnt: Record<string, number> = {};
for (const x of f2) { const k = e.appearance(x).colorKey; cnt[k] = (cnt[k] || 0) + 1; }
const exp = { red: 9 / 16, pink: 3 / 16, black: 3 / 16, purple: 1 / 16 } as Record<string, number>;
let chi = 0; for (const k of Object.keys(exp)) { const o = cnt[k] || 0, ex = exp[k] * f2.length; chi += (o - ex) ** 2 / ex; }
check('F2 9:3:3:1 (χ² < 11.3, p>0.01)', chi < 11.3, JSON.stringify(cnt) + ' χ²=' + chi.toFixed(2));

// 4. Prédiction = observation
const pred = e.predict(f1[0], f1[0]);
const pgf = pred.find((p) => p.locus === 'gf')!.pExpressed;
check('prédiction gf = 0.25', Math.abs(pgf - 0.25) < 1e-9);

// 5. Autofécondation : hétérozygotie ~ divisée par 2 par génération
let line = f1[0]; const hs: number[] = [];
for (let g = 0; g < 7; g++) { const kids = e.cross(line, line, 200); hs.push(kids.reduce((s, k) => s + e.heterozygosity(k), 0) / kids.length); line = kids[0]; }
console.log('   hétérozygotie moyenne F2..F8 :', hs.map((h) => h.toFixed(3)).join(' '));
check('hétérozygotie décroît', hs[6] < hs[0] / 8);

// 6. Hétérosis : F1 entre lignées éloignées > moyenne des parents en rendement (en moyenne)
const a = e.createFromVariety(V('moneymaker')), b = e.createFromVariety(V('gardeners-delight'));
const kids = e.cross(a, b, 400); const mean = kids.reduce((s, k) => s + k.pheno.yieldKg, 0) / kids.length;
console.log('   rendement F1', mean.toFixed(2), 'parents', a.pheno.yieldKg, b.pheno.yieldKg);

// 7. Dominance Sun et résistance
const sm = e.createFromVariety(V('san-marzano')), roma = e.createFromVariety(V('roma-vf'));
const f1b = e.cross(sm, roma, 20);
check('F1 SM × Roma allongée (Sun dominant)', f1b.every((x) => e.appearance(x).shape === 'elongated'));
check('F1 SM × Roma résistante VF', f1b.every((x) => e.resistanceCode(x) === 'V F'));
check('code génotype', e.genotypeCode(f1b[0]).includes('Ve/+'), e.genotypeCode(f1b[0]));

// 8. Catalogue élargi (TOMATObase) : loci valides, phénotypes cohérents
const ext = await loadExtendedVarieties();
check(`catalogue élargi chargé (${ext.length})`, ext.length > 400);
const bad = ext.filter((v) => v.variants.some((l) => !LOCUS_IDS.includes(l as never) && l !== 'bic' && l !== 'og'));
check('tous les allèles existent dans le moteur', bad.length === 0, bad.slice(0, 3).map((v) => v.name).join(', '));
check('ids uniques', new Set([...TOMATO_VARIETIES, ...ext].map((v) => v.id)).size === TOMATO_VARIETIES.length + ext.length);
const byName = (n: string) => ext.find((v) => v.name === n);
const look = (n: string) => { const v = byName(n); return v ? e.appearance(e.createFromVariety(v)) : null; };
check('Evergreen = verte à maturité', look('(Emerald) Evergreen')?.colorKey === 'green');
check('Black Zebra = noire rayée', look('Black Zebra')?.colorKey === 'black' && look('Black Zebra')!.striped === true);
const dw = ext.find((v) => v.variants.includes('d'));
check('naine reconnue', Boolean(dw) && e.isDwarf(e.createFromVariety(dw!)), dw?.name);
let ok = true;
for (const v of ext.filter((x) => !x.hybrid)) { const f = e.createFromVariety(v); if (e.heterozygosity(f) !== 0 || !Number.isFinite(f.pheno.weightG)) { ok = false; break; } }
check('chaque variété élargie donne un fondateur fixé valide', ok);

// 9. Bouture : génotype identique, même génération
const mother = f2[3]; const cl = e.cloneOf(mother);
check('bouture = même génotype', e.genotypeCode(cl) === e.genotypeCode(mother) && cl.generation === mother.generation && cl.clonedFromId === mother.id);

// 10. Programme : pourpre + feuille de pomme de terre + précoce (≤ 65 j)
let reached = 0; const gens: number[] = [];
for (let k = 0; k < 30; k++) {
  const ek = new TomatoEngine(1000 + k * 7919);
  const res = runProgram(ek, ek.createFromVariety(V('cherokee-purple')), ek.createFromVariety(V('stupice')), { color: 'purple', leaf: 'potato', maxDays: 65, resistances: [] });
  if (res.goalReached && res.fixed) reached++;
  gens.push(res.final.generation);
}
console.log('   programme : objectif fixé', reached, '/30 — générations finales', gens.join(','));
check('programme atteint et fixe l\'objectif (≥ 23/30, ~85–90 % attendu)', reached >= 23);
const res = runProgram(e, e.createFromVariety(V('cherokee-purple')), e.createFromVariety(V('stupice')), { color: 'purple', leaf: 'potato', resistances: [] });
const selfKids = e.cross(res.final, res.final, 60);
check('la variété obtenue se ressème à l\'identique', selfKids.every((x) => conforms(e, x, { color: 'purple', leaf: 'potato', resistances: [] })));

// 11. Variété perso : rejoue les haplotypes exacts
const vf = e.fixedVariants(res.final)!;
const hp = { weight: res.final.haps.weight[0], brix: res.final.haps.brix[0], days: res.final.haps.days[0], yield: res.final.haps.yield[0] };
const custom = { id: 'custom-x', name: 'X', origin: '', variants: vf, weightG: 0, brix: 0, days: 0, yieldKg: 0, source: 'custom' as const, haps: hp };
const re = e.createFromVariety(custom);
check('variété perso = même génotype que la lignée', e.genotypeCode(re) === e.genotypeCode(res.final) && e.traits.weight.score(re.haps.weight[0], re.haps.weight[1]) === e.traits.weight.score(hp.weight, hp.weight));

// 12. Nutriments : besoins proportionnels au rendement, K total conservé, cul noir
const sm2 = e.createFromVariety(V('san-marzano')); const gd = e.createFromVariety(V('gardeners-delight'));
const pl = tomatoNutrientPlan(e, sm2);
check('N saison = 2,9 g/kg de fruits', Math.abs(pl.season.N - 2.9 * sm2.pheno.yieldKg) < 0.11, `${pl.season.N} g pour ${sm2.pheno.yieldKg} kg`);
check('K₂O réparti = K₂O saison', Math.abs(pl.stages.reduce((s, x) => s + x.k2oG, 0) - pl.season.K2O) < 0.3);
check('rapport K/N croissant au fil des phases', pl.stages.every((x, i) => i === 0 || x.k2oG / x.nG >= pl.stages[i - 1].k2oG / pl.stages[i - 1].nG - 1e-9));
check('San Marzano (allongée) : risque cul noir élevé', pl.berRisk === 'high');
check("Gardener's Delight (cerise ronde) : risque faible", tomatoNutrientPlan(e, gd).berRisk === 'low');
console.log('   San Marzano', JSON.stringify(pl.season), '→', pl.generic436G, 'g de 4-3-6');

// 13. Liaison génétique : Mi (chr 6, 30 cM) et c (chr 6, 55 cM) en couplage
const mc = e.createCustom({ label: 'Mi c', variants: ['Mi', 'c'], targets: {} });
const plain = e.createCustom({ label: 'std', variants: [], targets: {} });
const f1mc = e.cross(mc, plain, 1)[0];
let rec = 0, recUnlinked = 0; const N = 20000;
const f1mi = e.cross(e.createCustom({ label: 'Mi I', variants: ['Mi', 'I'], targets: {} }), plain, 1)[0];
for (let i = 0; i < N; i++) {
  const g = e.gamete(f1mc); if ((g.Mi === 'Mi') !== (g.c === 'c')) rec++;
  const h = e.gamete(f1mi); if ((h.Mi === 'Mi') !== (h.I === 'I')) recUnlinked++;
}
const expected = kosambi(25);
check(`liaison Mi–c : ${(rec / N).toFixed(3)} recombinants (attendu ${expected.toFixed(3)})`, Math.abs(rec / N - expected) < 0.015);
check(`Mi (chr 6) et I (chr 11) indépendants : ${(recUnlinked / N).toFixed(3)} ≈ 0,5`, Math.abs(recUnlinked / N - 0.5) < 0.015);

// 14. Nouveaux gènes de couleur
check('Big Rainbow = bicolore', e.appearance(e.createFromVariety(V('big-rainbow'))).colorKey === 'bicolor');
check('Caro Rich = orange (Beta)', e.appearance(e.createFromVariety(V('caro-rich'))).colorKey === 'orange');
check('Garden Peach = peau pêche', e.appearance(e.createFromVariety(V('garden-peach'))).fuzzy === true);
const crim = e.createCustom({ label: 'og', variants: ['og'], targets: {} });
check('og/og = crimson', e.appearance(crim).colorKey === 'crimson');
const rB = e.createCustom({ label: 'rB', variants: ['r', 'B'], targets: {} });
check('r masque Beta (chair jaune)', e.appearance(rB).colorKey === 'yellow');
const bicF1 = e.cross(e.createFromVariety(V('big-rainbow')), e.createFromVariety(V('moneymaker')), 1)[0];
check('F1 bicolore × rouge = rouge (bic récessif)', e.appearance(bicF1).colorKey === 'red');
const bicF2 = e.cross(bicF1, bicF1, 8000);
const nBic = bicF2.filter((x) => e.appearance(x).colorKey === 'bicolor').length / bicF2.length;
check(`F2 : ¼ bicolores (${nBic.toFixed(3)})`, Math.abs(nBic - 0.25) < 0.02);
check('Long Keeper se conserve > 45 j', e.createFromVariety(V('long-keeper')).pheno.shelfDays > 45);

// 15. Hybride F1 : hétérozygote, sa descendance ségrège
const hyb = ext.find((v) => v.hybrid && v.name.startsWith('SunGold'))!;
const hf = e.createFromVariety(hyb);
check(`hybride ${hyb.name} hétérozygote`, e.heterozygosity(hf) > 0.1 && hf.hybridFounder === true);
const hkids = e.cross(hf, hf, 200);
const wSpread = Math.max(...hkids.map((k) => k.pheno.weightG)) / Math.min(...hkids.map((k) => k.pheno.weightG));
check(`graines d'hybride : poids variables (×${wSpread.toFixed(1)})`, wSpread > 1.8);

// 16. Jardin : Ph-3 protège du mildiou, Mi cède en sol chaud
const susc = e.createFromVariety(V('moneymaker'));
const ph3 = e.createCustom({ label: 'Ph3', variants: ['Ph3'], targets: { days: e.unitOfValue('days', susc.pheno.days) } });
const oce = { ...DEFAULT_GARDEN, climate: 'oceanic' as const };
const lossOf = (ind: typeof susc, cause: string, g = oce) => gardenOutcome(e, ind, g).losses.find((l) => l.cause === cause)?.pct ?? 0;
check('mildiou : Ph-3 divise la perte', lossOf(ph3, 'blight') < lossOf(susc, 'blight') * 0.5, `${lossOf(susc, 'blight')} → ${lossOf(ph3, 'blight')}`);
const miPlant = e.createCustom({ label: 'Mi', variants: ['Mi'], targets: {} });
const nemM = { ...DEFAULT_GARDEN, climate: 'mediterranean' as const, nematodes: true };
const nemO = { ...DEFAULT_GARDEN, climate: 'oceanic' as const, nematodes: true };
check('nématodes : Mi efficace en sol frais, contourné en sol chaud', lossOf(miPlant, 'nematodes', nemO) < 0.06 && gardenOutcome(e, miPlant, nemM).losses.find((l) => l.cause === 'nematodes')!.brokenDown === true);
check('fusariose : gène I protège', lossOf(e.createFromVariety(V('roma-vf')), 'fusarium', { ...oce, fusarium: true }) < 0.05 && lossOf(susc, 'fusarium', { ...oce, fusarium: true }) > 0.3);

// 17. Ancienne sauvegarde (sans nouveaux traits ni loci) : normalisée
const old = JSON.parse(JSON.stringify(susc));
for (const k of ['acidity', 'crack', 'shelf', 'heat', 'cold']) delete old.haps[k];
for (const k of ['acidity', 'crack', 'shelfDays', 'heat', 'cold']) delete old.pheno[k];
delete old.genotype.B; delete old.genotype.p; delete old.genotype.alc;
const nrm = e.normalize(old);
check('ancienne sauvegarde normalisée', Boolean(nrm.haps.cold && nrm.genotype.alc && typeof nrm.pheno.shelfDays === 'number' && e.cross(nrm, nrm, 2).length === 2));

console.log(fail ? `\n${fail} ÉCHEC(S)` : '\nTous les tests passent');
process.exit(fail ? 1 : 0);
