/**
 * Loci mendéliens de la tomate (Solanum lycopersicum, 2n = 24).
 *
 * Ce sont tous de VRAIS gènes, clonés ou cartographiés et documentés
 * (TGRC — Tomato Genetics Resource Center, UC Davis). Simplification : un
 * gène par caractère, deux allèles (trois pour PSY1 et CYC-B, voir `extra`).
 *
 * LIAISON GÉNÉTIQUE : les gènes situés sur le même chromosome sont
 * transmis ensemble plus souvent qu'au hasard. Chaque locus porte une
 * position `cM` sur son chromosome ; la méiose (engine.ts) tire les
 * crossing-over avec la fonction de Kosambi. ATTENTION : les chromosomes
 * sont exacts, mais les positions en cM sont APPROXIMATIVES (ordre de
 * grandeur ±10–15 cM, reconstitué d'après les cartes classiques) : la
 * liaison est réaliste dans son principe (ex. sp, c, B et Mi sur le 6 ;
 * Ve, Tm-2² et Ph-3 sur le 9), pas au centimorgan près. `chromosome: 0`
 * = position non renseignée ici → ségrégation indépendante.
 *
 * Convention d'écriture :
 *  - mutation récessive  → allèle sauvage en majuscule (R), mutant en minuscule (r) ;
 *  - allèle d'intérêt DOMINANT (résistances, Aft, sun, B) → « + » = allèle standard.
 */

export type TomatoLocusId =
  | 'r'
  | 't'
  | 'gf'
  | 'y'
  | 'gs'
  | 'Aft'
  | 'atv'
  | 'u'
  | 'sp'
  | 'd'
  | 'c'
  | 'o'
  | 'fas'
  | 'sun'
  | 'Ve'
  | 'I'
  | 'Mi'
  | 'Tm2'
  | 'Ph3'
  | 'B'
  | 'p'
  | 'alc';

/** Identifiant d'allèle d'intérêt utilisable dans une variété : un locus,
 * ou un allèle supplémentaire d'un locus multi-allélique. */
export type VariantId = TomatoLocusId | 'bic' | 'og';

/** Allèles supplémentaires : { id de variante → [locus, allèle] }. */
export const EXTRA_ALLELES: Record<'bic' | 'og', [TomatoLocusId, string]> = {
  bic: ['r', 'bic'],
  og: ['B', 'og'],
};

export type LocusCategory = 'color' | 'plant' | 'shape' | 'resistance';

export interface LocusDef {
  id: TomatoLocusId;
  /** Allèle standard (le plus courant chez la tomate cultivée « de base »). */
  standard: string;
  /** Allèle d'intérêt (mutation de couleur, de forme, gène de résistance…). */
  variant: string;
  /** L'allèle d'intérêt s'exprime-t-il à l'état hétérozygote ? */
  variantDominant: boolean;
  chromosome: number;
  /** Position approximative sur le chromosome (cM), pour la liaison. */
  cM: number;
  /** Troisième allèle (récessif) : id de variante, nom et effet. */
  extra?: { id: 'bic' | 'og'; allele: string; name: { fr: string; en: string }; effect: { fr: string; en: string } };
  /** Gène/protéine sous-jacent, quand il est identifié. */
  gene: string;
  category: LocusCategory;
  name: { fr: string; en: string };
  /** Effet de l'allèle d'intérêt quand il est exprimé. */
  effect: { fr: string; en: string };
}

export const TOMATO_LOCI: LocusDef[] = [
  // --- Couleur du fruit ------------------------------------------------
  {
    id: 'r',
    standard: 'R',
    variant: 'r',
    variantDominant: false,
    chromosome: 3,
    cM: 90,
    extra: {
      id: 'bic',
      allele: 'bic',
      name: { fr: 'Bicolore (PSY1 faible)', en: 'Bicolour (weak PSY1)' },
      effect: {
        fr: 'Allèle de PSY1 à expression réduite (délétion dans le promoteur) : chair jaune marbrée de rouge. Récessif face à R ; bic/r donne une chair jaune.',
        en: 'Reduced-expression PSY1 allele (promoter deletion): yellow flesh marbled red. Recessive to R; bic/r gives yellow flesh.',
      },
    },
    gene: 'PSY1 (phytoène synthase)',
    category: 'color',
    name: { fr: 'Chair jaune', en: 'Yellow flesh' },
    effect: {
      fr: 'Pas de lycopène : chair jaune. Épistatique sur t (rien à isomériser en aval).',
      en: 'No lycopene: yellow flesh. Epistatic over t (nothing to isomerise downstream).',
    },
  },
  {
    id: 't',
    standard: 'T',
    variant: 't',
    variantDominant: false,
    chromosome: 10,
    cM: 45,
    gene: 'CRTISO (caroténoïde isomérase)',
    category: 'color',
    name: { fr: 'Tangerine', en: 'Tangerine' },
    effect: {
      fr: 'Accumule du tétra-cis-lycopène au lieu du lycopène : chair orange.',
      en: 'Accumulates tetra-cis-lycopene instead of lycopene: orange flesh.',
    },
  },
  {
    id: 'gf',
    standard: 'Gf',
    variant: 'gf',
    variantDominant: false,
    chromosome: 8,
    cM: 50,
    gene: 'SGR1 (stay-green)',
    category: 'color',
    name: { fr: 'Chair verte (stay-green)', en: 'Green flesh (stay-green)' },
    effect: {
      fr: 'La chlorophylle ne se dégrade pas : rouge + vert = « noire » (brun-acajou) ; jaune + vert = verte à maturité.',
      en: 'Chlorophyll is retained: red + green = "black" (mahogany); yellow + green = green-when-ripe.',
    },
  },
  {
    id: 'y',
    standard: 'Y',
    variant: 'y',
    variantDominant: false,
    chromosome: 1,
    cM: 70,
    gene: 'MYB12',
    category: 'color',
    name: { fr: 'Peau incolore', en: 'Colourless skin' },
    effect: {
      fr: 'Pas de naringénine-chalcone jaune dans la peau : une chair rouge paraît rose.',
      en: 'No yellow naringenin chalcone in the skin: red flesh looks pink.',
    },
  },
  {
    id: 'gs',
    standard: 'Gs',
    variant: 'gs',
    variantDominant: false,
    chromosome: 7,
    cM: 40,
    gene: 'gs (green stripe)',
    category: 'color',
    name: { fr: 'Fruit rayé', en: 'Striped fruit' },
    effect: {
      fr: 'Rayures longitudinales plus claires/plus sombres sur le fruit.',
      en: 'Lighter/darker longitudinal stripes on the fruit.',
    },
  },
  {
    id: 'Aft',
    standard: '+',
    variant: 'Aft',
    variantDominant: true,
    chromosome: 10,
    cM: 60,
    gene: 'ANT1-like (MYB, introgressé de S. chilense)',
    category: 'color',
    name: { fr: 'Anthocyanes du fruit', en: 'Anthocyanin fruit' },
    effect: {
      fr: 'Taches d’anthocyanes violettes sur la peau exposée au soleil.',
      en: 'Purple anthocyanin patches on sun-exposed skin.',
    },
  },
  {
    id: 'atv',
    standard: 'Atv',
    variant: 'atv',
    variantDominant: false,
    chromosome: 7,
    cM: 65,
    gene: 'MYBATV (introgressé de S. cheesmaniae)',
    category: 'color',
    name: { fr: 'Atroviolacée', en: 'Atroviolacea' },
    effect: {
      fr: 'Lève un frein à la synthèse d’anthocyanes. Seul : tiges violacées. Avec Aft : peau indigo (type Indigo Rose).',
      en: 'Removes a brake on anthocyanin synthesis. Alone: purplish stems. With Aft: indigo skin (Indigo Rose type).',
    },
  },
  {
    id: 'u',
    standard: 'U',
    variant: 'u',
    variantDominant: false,
    chromosome: 10,
    cM: 25,
    gene: 'GLK2',
    category: 'color',
    name: { fr: 'Maturation uniforme', en: 'Uniform ripening' },
    effect: {
      fr: 'Pas de collet vert. Mais moins de chloroplastes dans le fruit, donc un peu moins de sucres (Powell et al., Science 2012).',
      en: 'No green shoulder. But fewer fruit chloroplasts, so slightly less sugar (Powell et al., Science 2012).',
    },
  },

  // --- Plante ----------------------------------------------------------
  {
    id: 'sp',
    standard: 'Sp',
    variant: 'sp',
    variantDominant: false,
    chromosome: 6,
    cM: 85,
    gene: 'SELF-PRUNING (famille CETS)',
    category: 'plant',
    name: { fr: 'Port déterminé', en: 'Determinate habit' },
    effect: {
      fr: 'Tiges terminées par une inflorescence : plante buissonnante, récolte groupée.',
      en: 'Shoots end in an inflorescence: bushy plant, concentrated harvest.',
    },
  },
  {
    id: 'd',
    standard: 'D',
    variant: 'd',
    variantDominant: false,
    chromosome: 2,
    cM: 70,
    gene: 'DWARF (C-6 oxydase des brassinostéroïdes)',
    category: 'plant',
    name: { fr: 'Nain (feuille rugueuse)', en: 'Dwarf (rugose leaf)' },
    effect: {
      fr: 'Entre-nœuds très courts et feuillage épais, rugueux et vert foncé : plante trapue (type Dwarf Tomato Project).',
      en: 'Very short internodes and thick, rugose dark-green leaves: stocky plant (Dwarf Tomato Project type).',
    },
  },
  {
    id: 'c',
    standard: 'C',
    variant: 'c',
    variantDominant: false,
    chromosome: 6,
    cM: 55,
    gene: 'C (MYB, potato leaf)',
    category: 'plant',
    name: { fr: 'Feuille de pomme de terre', en: 'Potato leaf' },
    effect: {
      fr: 'Folioles larges à bord lisse au lieu de folioles dentelées.',
      en: 'Broad smooth-edged leaflets instead of serrated ones.',
    },
  },

  // --- Forme -----------------------------------------------------------
  {
    id: 'o',
    standard: 'O',
    variant: 'o',
    variantDominant: false,
    chromosome: 2,
    cM: 50,
    gene: 'OVATE',
    category: 'shape',
    name: { fr: 'Fruit ovale / piriforme', en: 'Ovate / pear fruit' },
    effect: {
      fr: 'Fruit ovale, en poire sur les petits calibres.',
      en: 'Oval fruit, pear-shaped on small fruit.',
    },
  },
  {
    id: 'fas',
    standard: 'Fas',
    variant: 'fas',
    variantDominant: false,
    chromosome: 11,
    cM: 70,
    gene: 'CLV3 (fasciated)',
    category: 'shape',
    name: { fr: 'Fascié (multiloculaire)', en: 'Fasciated (many locules)' },
    effect: {
      fr: 'Beaucoup de loges : gros fruit aplati et côtelé (type cœur de bœuf/beefsteak).',
      en: 'Many locules: large flattened, ribbed fruit (beefsteak type).',
    },
  },
  {
    id: 'sun',
    standard: '+',
    variant: 'Sun',
    variantDominant: true,
    chromosome: 7,
    cM: 20,
    gene: 'SUN (duplication par rétrotransposon)',
    category: 'shape',
    name: { fr: 'Fruit allongé', en: 'Elongated fruit' },
    effect: {
      fr: 'Fruit nettement allongé (type San Marzano). Dominant.',
      en: 'Clearly elongated fruit (San Marzano type). Dominant.',
    },
  },

  // --- Résistances (toutes dominantes) ---------------------------------
  {
    id: 'Ve',
    standard: '+',
    variant: 'Ve',
    variantDominant: true,
    chromosome: 9,
    cM: 30,
    gene: 'Ve1 (récepteur LRR)',
    category: 'resistance',
    name: { fr: 'Verticilliose (V)', en: 'Verticillium wilt (V)' },
    effect: { fr: 'Résistance à Verticillium dahliae race 1.', en: 'Resistance to Verticillium dahliae race 1.' },
  },
  {
    id: 'I',
    standard: '+',
    variant: 'I',
    variantDominant: true,
    chromosome: 11,
    cM: 40,
    gene: 'I (I-1)',
    category: 'resistance',
    name: { fr: 'Fusariose race 1 (F)', en: 'Fusarium wilt race 1 (F)' },
    effect: {
      fr: 'Résistance à Fusarium oxysporum f. sp. lycopersici race 1.',
      en: 'Resistance to Fusarium oxysporum f. sp. lycopersici race 1.',
    },
  },
  {
    id: 'Mi',
    standard: '+',
    variant: 'Mi',
    variantDominant: true,
    chromosome: 6,
    cM: 30,
    gene: 'Mi-1.2 (NBS-LRR)',
    category: 'resistance',
    name: { fr: 'Nématodes à galles (N)', en: 'Root-knot nematodes (N)' },
    effect: {
      fr: 'Résistance aux nématodes Meloidogyne (inefficace au-delà de ~28 °C de sol).',
      en: 'Resistance to Meloidogyne nematodes (breaks down above ~28 °C soil).',
    },
  },
  {
    id: 'Tm2',
    standard: '+',
    variant: 'Tm-2²',
    variantDominant: true,
    chromosome: 9,
    cM: 55,
    gene: 'Tm-2² (NBS-LRR)',
    category: 'resistance',
    name: { fr: 'Virus de la mosaïque (ToMV)', en: 'Mosaic virus (ToMV)' },
    effect: { fr: 'Résistance durable au ToMV/TMV.', en: 'Durable resistance to ToMV/TMV.' },
  },
  {
    id: 'Ph3',
    standard: '+',
    variant: 'Ph-3',
    variantDominant: true,
    chromosome: 9,
    cM: 110,
    gene: 'Ph-3 (CC-NBS-LRR)',
    category: 'resistance',
    name: { fr: 'Mildiou (Ph-3)', en: 'Late blight (Ph-3)' },
    effect: {
      fr: 'Résistance partielle au mildiou (Phytophthora infestans), contournée par certaines souches.',
      en: 'Partial resistance to late blight (Phytophthora infestans), overcome by some strains.',
    },
  },
  // --- Ajouts : Beta / crimson, peau pêche, longue conservation -------------
  {
    id: 'B',
    standard: '+',
    variant: 'B',
    variantDominant: true,
    chromosome: 6,
    cM: 70,
    extra: {
      id: 'og',
      allele: 'og',
      name: { fr: 'Crimson (old-gold)', en: 'Crimson (old-gold)' },
      effect: {
        fr: 'Allèle nul de CYC-B, récessif : plus de lycopène, chair rouge profond (et fleurs fauves). og/og = « crimson ».',
        en: 'Null CYC-B allele, recessive: more lycopene, deep red flesh (and tawny flowers). og/og = "crimson".',
      },
    },
    gene: 'CYC-B (lycopène β-cyclase des chromoplastes)',
    category: 'color',
    name: { fr: 'Beta (orange β-carotène)', en: 'Beta (orange β-carotene)' },
    effect: {
      fr: 'Dominant : le lycopène est converti en β-carotène, chair orange (types « Caro Rich »). Sans effet sur une chair jaune (r).',
      en: 'Dominant: lycopene is turned into β-carotene, orange flesh ("Caro Rich" types). No effect on yellow flesh (r).',
    },
  },
  {
    id: 'p',
    standard: 'P',
    variant: 'p',
    variantDominant: false,
    chromosome: 0,
    cM: 0,
    gene: 'p (peach)',
    category: 'color',
    name: { fr: 'Peau « pêche » (duveteuse)', en: '"Peach" skin (fuzzy)' },
    effect: {
      fr: 'Récessif : peau couverte d’un fin duvet, aspect mat et velouté (types « Peach », « Fuzzy »).',
      en: 'Recessive: skin covered with fine fuzz, matte velvety look ("Peach", "Fuzzy" types).',
    },
  },
  {
    id: 'alc',
    standard: '+',
    variant: 'alc',
    variantDominant: false,
    chromosome: 10,
    cM: 75,
    gene: 'NOR (allèle alcobaca)',
    category: 'plant',
    name: { fr: 'Longue conservation (alcobaca)', en: 'Long shelf life (alcobaca)' },
    effect: {
      fr: 'Allèle de NOR, récessif : maturation ralentie, fruits qui se conservent des semaines à des mois (types « longkeeper », tomates d’hiver).',
      en: 'NOR allele, recessive: slowed ripening, fruit that keeps for weeks to months (long-keeper, winter tomatoes).',
    },
  },
];

export const LOCUS_BY_ID: Record<TomatoLocusId, LocusDef> = Object.fromEntries(
  TOMATO_LOCI.map((l) => [l.id, l])
) as Record<TomatoLocusId, LocusDef>;

export const LOCUS_IDS: TomatoLocusId[] = TOMATO_LOCI.map((l) => l.id);

/** Libellé, nom et effet d'un allèle d'intérêt (locus ou allèle supplémentaire). */
export function variantInfo(id: VariantId): { label: string; name: { fr: string; en: string }; effect: { fr: string; en: string } } {
  if (id === 'bic' || id === 'og') {
    const def = LOCUS_BY_ID[EXTRA_ALLELES[id][0]];
    return { label: def.extra!.allele, name: def.extra!.name, effect: def.extra!.effect };
  }
  const def = LOCUS_BY_ID[id];
  return { label: def.variant, name: def.name, effect: def.effect };
}
