/**
 * Fruitiers et petits fruits, suite : fruits « oubliés », fruits à coque,
 * fruitiers méditerranéens et baies de terre acide.
 *
 * Mêmes conventions que orchard.ts : plantation en repos de végétation,
 * daysToHarvest = première récolte comptée depuis une plantation de début
 * décembre (≈ 210 j = juillet de l'année suivante, +365 j par année
 * d'attente). Rendements en kg de fruits (ou de noix sèches) par m² occupé
 * par la plante adulte : ordres de grandeur. Mois de récolte pour la région
 * parisienne ; pour les espèces méditerranéennes (olivier, grenadier,
 * néflier du Japon, citronnier) la note précise ce qu'on peut en attendre
 * au nord de la Loire.
 * Sources : catalogues de pépiniéristes (Pépinières Lepage, Promesse de
 * fleurs, Fruitiers.net), fiches Inrae et CTIFL, Ctifl/Invenio (fruits à
 * coque), Afidol (olivier), Société pomologique, Royal Horticultural Society.
 */
import type { Family, Feeding, Frost, MonthRange, Species, SpeciesExtra, Sun, Txt } from '../model';

const T = (fr: string, en: string): Txt => ({ fr, en });

interface Def {
  id: string;
  name: Txt;
  latin: string;
  emoji: string;
  family: Family;
  sun: Sun;
  frost: Frost;
  pH?: [number, number];
  /** Espacement (cm) entre rangs et sur le rang. */
  spacing: [number, number];
  plantOut?: MonthRange[];
  /** Première récolte [début, fin] en jours depuis la plantation. */
  harvest: [number, number];
  yieldM2: [number, number];
  feeding: Feeding;
  root: number;
  height: number;
  /** Mois de récolte (rappel, région parisienne). */
  months: MonthRange;
  note: Txt;
  /** Multiplication : prix (€/kg), conseil. */
  prop: [number, string, string];
}

function fruit(d: Def): { species: Species; extra: SpeciesExtra; height: number } {
  const [h0, h1] = d.harvest;
  return {
    species: {
      id: d.id,
      name: d.name,
      latin: d.latin,
      emoji: d.emoji,
      family: d.family,
      type: 'orchard',
      life: 'perennial',
      sun: d.sun,
      frost: d.frost,
      tBase: d.frost === 'hardy' ? 6 : 8,
      tOpt: [18, 26],
      pH: d.pH ?? [6, 7.5],
      spacing: { row: d.spacing[0], inRow: d.spacing[1] },
      plantOut: d.plantOut ?? [[11, 3]],
      daysToHarvest: d.harvest,
      season: h1 + 30,
      stages: [['vegetative', 0], ['flowering', Math.max(30, h0 - 100)], ['fruiting', Math.max(60, h0 - 60)], ['harvest', h0]],
      kc: [0.5, 0.95, 0.75],
      rootDepth: d.root,
      yieldM2: d.yieldM2,
      exports: { N: 1.0, P2O5: 0.4, K2O: 2.0 },
      feeding: d.feeding,
      returnYears: 6,
      note: d.note,
    },
    extra: { seedLife: 0, pollination: 'vegetative', isolation: 0, priceKg: d.prop[0], trueToSeed: 'no', seedTip: { fr: d.prop[1], en: d.prop[2] } },
    height: d.height,
  };
}

const DEFS: Def[] = [
  // --- Petits fruits ------------------------------------------------------------------
  {
    id: 'jostaberry', name: T('Casseillier', 'Jostaberry'), latin: 'Ribes × nidigrolaria', emoji: '🫐', family: 'grossulariaceae', sun: 'partial', frost: 'hardy',
    spacing: [200, 150], harvest: [215, 245], yieldM2: [0.8, 1.5], feeding: 'medium', root: 0.5, height: 180, months: [7, 7],
    note: T('Croisement cassis × groseille à maquereau : sans épines, très vigoureux, résistant à l’oïdium et à la rouille. Gros fruits noirs au goût de cassis adouci. Tailler en hiver les branches de plus de 3 ans.', 'Blackcurrant × gooseberry cross: thornless, very vigorous, resistant to mildew and rust. Large black berries with a mellow blackcurrant taste. In winter, remove branches older than 3 years.'),
    prop: [12, 'Boutures de bois sec de 20 cm en novembre, comme le cassis : reprise quasi certaine.', '20 cm hardwood cuttings in November, as for blackcurrant: rooting is almost certain.'],
  },
  {
    id: 'honeyberry', name: T('Camérisier', 'Honeyberry'), latin: 'Lonicera caerulea', emoji: '🫐', family: 'caprifoliaceae', sun: 'full', frost: 'hardy', pH: [5.5, 7],
    spacing: [150, 120], harvest: [540, 570], yieldM2: [0.3, 0.8], feeding: 'light', root: 0.4, height: 150, months: [5, 6],
    note: T('Le premier petit fruit de l’année, fin mai, avant les fraises. Rustique jusqu’à −40 °C, fleurs insensibles aux gelées. Planter au moins deux variétés différentes : il est autostérile.', 'The first soft fruit of the year, late May, before strawberries. Hardy to −40 °C, flowers shrug off frost. Plant at least two different varieties: it is self-sterile.'),
    prop: [20, 'Boutures de bois vert en juin ou de bois sec en hiver ; marcottage facile.', 'Softwood cuttings in June or hardwood in winter; layers easily.'],
  },
  {
    id: 'goji', name: T('Goji', 'Goji'), latin: 'Lycium barbarum', emoji: '🔴', family: 'solanaceae', sun: 'full', frost: 'hardy', pH: [6.5, 8],
    spacing: [200, 150], harvest: [610, 700], yieldM2: [0.5, 1], feeding: 'light', root: 0.8, height: 200, months: [8, 10],
    note: T('Arbuste sarmenteux qui préfère un sol pauvre, sec et calcaire : trop d’engrais donne des feuilles, pas de fruits. Palisser et rabattre les tiges à 50 cm pour faire ramifier. Drageonne : le contenir.', 'Scrambling shrub that likes poor, dry, limy soil: too much feeding gives leaves, not fruit. Tie in and cut stems back to 50 cm to make it branch. Suckers: keep it in check.'),
    prop: [20, 'Boutures ou drageons ; le semis est facile mais donne des plants variables.', 'Cuttings or suckers; seed is easy but gives variable plants.'],
  },
  {
    id: 'elderberry', name: T('Sureau noir', 'Elderberry'), latin: 'Sambucus nigra', emoji: '🫐', family: 'viburnaceae', sun: 'partial', frost: 'hardy',
    spacing: [400, 300], harvest: [640, 670], yieldM2: [0.5, 1.2], feeding: 'light', root: 0.8, height: 400, months: [8, 9],
    note: T('Fleurs en juin pour le sirop et les beignets, baies noires fin août. Baies crues légèrement toxiques : toujours les cuire (gelée, sirop), sans les rafles. Pousse partout, même en haie.', 'Flowers in June for cordial and fritters, black berries in late August. Raw berries are mildly toxic: always cook them (jelly, syrup) and remove the stalks. Grows anywhere, even in a hedge.'),
    prop: [10, 'Boutures de bois sec de 30 cm en hiver : reprise très facile.', '30 cm hardwood cuttings in winter: roots very easily.'],
  },
  {
    id: 'seabuckthorn', name: T('Argousier', 'Sea buckthorn'), latin: 'Hippophae rhamnoides', emoji: '🟠', family: 'elaeagnaceae', sun: 'full', frost: 'hardy', pH: [6, 8.5],
    spacing: [300, 200], harvest: [1005, 1035], yieldM2: [0.3, 0.8], feeding: 'light', root: 1, height: 300, months: [9, 10],
    note: T('Plants mâles et femelles séparés : 1 mâle pour 5 à 6 femelles, seules les femelles portent les baies. Fixe l’azote, supporte sable, sel et sécheresse. Baies très acides et riches en vitamine C : couper les rameaux chargés et les congeler pour égrener.', 'Separate male and female plants: 1 male for 5–6 females, only females bear berries. Fixes nitrogen, tolerates sand, salt and drought. Very sour berries rich in vitamin C: cut laden twigs and freeze them to strip the fruit.'),
    prop: [25, 'Drageons ou boutures ; acheter des pieds sexés (le sexe ne se voit qu’à la floraison).', 'Suckers or cuttings; buy sexed plants (sex only shows at flowering).'],
  },
  {
    id: 'aronia', name: T('Aronia', 'Aronia'), latin: 'Aronia melanocarpa', emoji: '🫐', family: 'rosaceae', sun: 'full', frost: 'hardy', pH: [5, 7],
    spacing: [200, 150], harvest: [610, 640], yieldM2: [0.5, 1], feeding: 'light', root: 0.5, height: 200, months: [8, 9],
    note: T('Arbuste très rustique et sans maladie, beau feuillage rouge à l’automne. Baies astringentes crues : en jus, confiture ou mélangées à d’autres fruits. Autofertile.', 'Very hardy, disease-free shrub with fine red autumn colour. Berries are astringent raw: use for juice, jam or mixed with other fruit. Self-fertile.'),
    prop: [20, 'Drageons au pied ou boutures de bois vert en juin.', 'Suckers at the base or softwood cuttings in June.'],
  },
  {
    id: 'cranberry', name: T('Canneberge', 'Cranberry'), latin: 'Vaccinium macrocarpon', emoji: '🔴', family: 'ericaceae', sun: 'full', frost: 'hardy', pH: [4.5, 5.5],
    spacing: [30, 30], harvest: [670, 700], yieldM2: [0.3, 0.8], feeding: 'light', root: 0.2, height: 20, months: [9, 10],
    note: T('Couvre-sol rampant de tourbière : terre très ACIDE et toujours humide (bac de terre de bruyère et sable, arrosé à l’eau de pluie). Les baies se gardent des semaines au frais.', 'Creeping bog ground cover: very ACID, always moist soil (tub of ericaceous compost and sand, watered with rainwater). Berries keep for weeks in the cool.'),
    prop: [30, 'Les stolons s’enracinent seuls : couper et repiquer au printemps.', 'Runners root by themselves: cut and replant in spring.'],
  },
  {
    id: 'lingonberry', name: T('Airelle rouge', 'Lingonberry'), latin: 'Vaccinium vitis-idaea', emoji: '🔴', family: 'ericaceae', sun: 'partial', frost: 'hardy', pH: [4.5, 5.5],
    spacing: [30, 30], harvest: [610, 670], yieldM2: [0.2, 0.5], feeding: 'light', root: 0.2, height: 30, months: [8, 10],
    note: T('Petit arbrisseau persistant de sol ACIDE, humifère et frais, à mi-ombre. Certaines variétés (Red Pearl, Koralle) donnent deux récoltes. Baies acidulées pour la confiture d’accompagnement.', 'Small evergreen for ACID, humus-rich, moist soil in part shade. Some varieties (Red Pearl, Koralle) crop twice. Tart berries for the classic relish.'),
    prop: [30, 'Division des touffes ou rhizomes au printemps.', 'Divide clumps or rhizomes in spring.'],
  },
  {
    id: 'tayberry', name: T('Tayberry', 'Tayberry'), latin: 'Rubus fruticosus × R. idaeus', emoji: '🍓', family: 'rosaceae', sun: 'full', frost: 'hardy', pH: [5.5, 7],
    spacing: [250, 250], harvest: [575, 610], yieldM2: [1, 2], feeding: 'medium', root: 0.5, height: 200, months: [7, 8],
    note: T('Hybride mûre × framboise, gros fruits rouge pourpre très parfumés. Fructifie sur les tiges de l’année précédente : palisser comme la mûre et couper au sol les tiges qui ont produit. Épineux (Buckingham est sans épines).', 'Blackberry × raspberry hybrid, large, very aromatic purple-red fruit. Fruits on last year’s canes: train like a blackberry and cut fruited canes to the ground. Thorny (Buckingham is thornless).'),
    prop: [15, 'Marcotter la pointe d’une tige en été.', 'Tip-layer a cane in summer.'],
  },
  {
    id: 'wineberry', name: T('Ronce du Japon', 'Japanese wineberry'), latin: 'Rubus phoenicolasius', emoji: '🍓', family: 'rosaceae', sun: 'partial', frost: 'hardy',
    spacing: [200, 150], harvest: [575, 610], yieldM2: [0.5, 1], feeding: 'medium', root: 0.4, height: 200, months: [7, 8],
    note: T('Tiges couvertes de poils rouges décoratifs, petites framboises orange vif et sucrées. Conduite comme la mûre. Se marcotte toute seule : surveiller qu’elle ne s’échappe pas.', 'Canes covered in ornamental red bristles, small bright orange, sweet berries. Grow like a blackberry. Tip-layers by itself: watch it does not escape.'),
    prop: [15, 'Marcottage naturel des pointes : déterrer et replanter en hiver.', 'Natural tip layers: dig up and replant in winter.'],
  },

  // --- Arbres fruitiers ----------------------------------------------------------------
  {
    id: 'nectarine', name: T('Nectarinier', 'Nectarine'), latin: 'Prunus persica var. nucipersica', emoji: '🍑', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [400, 400], harvest: [600, 660], yieldM2: [1.5, 3], feeding: 'medium', root: 0.8, height: 350, months: [7, 9],
    note: T('Pêche à peau lisse : même taille annuelle et autofertile, mais plus sensible à la cloque et à la moniliose. Contre un mur au sud au nord de la Loire. Éclaircir à un fruit tous les 15 cm.', 'Smooth-skinned peach: same annual pruning and self-fertile, but more prone to leaf curl and brown rot. Against a south wall north of the Loire. Thin to one fruit every 15 cm.'),
    prop: [4, 'Greffe sur pêcher franc ou prunier ; le noyau ne redonne pas forcément un nectarinier.', 'Grafted on peach seedling or plum; the stone may not give a nectarine.'],
  },
  {
    id: 'mirabelle', name: T('Mirabellier', 'Mirabelle plum'), latin: 'Prunus domestica subsp. syriaca', emoji: '🟡', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [500, 500], harvest: [985, 1010], yieldM2: [1.5, 3], feeding: 'medium', root: 1, height: 450, months: [8, 9],
    note: T('Mirabelle de Nancy et de Metz : autofertiles, très productives, petites prunes jaunes pour tartes, confitures et eau-de-vie. Taille légère en été. Gauler ou secouer au-dessus d’une bâche.', 'Mirabelle de Nancy and de Metz: self-fertile, very productive, small yellow plums for tarts, jam and brandy. Light summer pruning. Shake the tree over a sheet.'),
    prop: [3, 'Greffe sur prunier Saint-Julien ou myrobolan ; drageons possibles sur franc.', 'Grafted on St Julien or myrobalan plum; suckers if on own roots.'],
  },
  {
    id: 'medlar', name: T('Néflier', 'Medlar'), latin: 'Mespilus germanica', emoji: '🟤', family: 'rosaceae', sun: 'full', frost: 'hardy',
    spacing: [400, 400], harvest: [1065, 1095], yieldM2: [1, 2], feeding: 'light', root: 0.8, height: 400, months: [10, 11],
    note: T('Petit arbre tortueux, autofertile, presque sans soin. Cueillir les nèfles dures après les premières gelées puis les laisser « blettir » 2 à 3 semaines sur de la paille : la chair devient brune et sucrée.', 'Small gnarled, self-fertile tree needing almost no care. Pick the hard fruit after the first frosts and let them “blet” for 2–3 weeks on straw: the flesh turns brown and sweet.'),
    prop: [5, 'Greffe sur aubépine, cognassier ou poirier.', 'Grafted on hawthorn, quince or pear.'],
  },
  {
    id: 'persimmon', name: T('Plaqueminier (kaki)', 'Persimmon'), latin: 'Diospyros kaki', emoji: '🟠', family: 'ebenaceae', sun: 'full', frost: 'hardy',
    spacing: [500, 500], harvest: [1430, 1460], yieldM2: [1.5, 3], feeding: 'light', root: 1.2, height: 500, months: [10, 11],
    note: T('Rustique vers −15 °C une fois installé, fleurit tard et échappe aux gelées. Variétés astringentes (Muscat) à manger blettes, non astringentes (Fuyu, Jiro) croquantes. Cueillir après la chute des feuilles, finir à l’intérieur.', 'Hardy to about −15 °C once established, flowers late and escapes frosts. Astringent varieties (Muscat) eaten very soft, non-astringent (Fuyu, Jiro) eaten crisp. Pick after leaf fall, finish indoors.'),
    prop: [5, 'Greffe sur Diospyros lotus ou kaki franc ; les variétés cultivées donnent des fruits sans pollinisation.', 'Grafted on Diospyros lotus or kaki seedling; cultivated varieties set fruit without pollination.'],
  },
  {
    id: 'mulberry', name: T('Mûrier', 'Mulberry'), latin: 'Morus nigra, M. alba', emoji: '🫐', family: 'moraceae', sun: 'full', frost: 'hardy',
    spacing: [600, 600], harvest: [1310, 1370], yieldM2: [0.5, 1.5], feeding: 'light', root: 1.2, height: 600, months: [7, 8],
    note: T('Mûrier noir : fruits les plus parfumés mais lent à se mettre à fruit ; mûrier blanc plus rustique et plus rapide. Autofertile. Les mûres tachent : éviter de le planter au-dessus d’une terrasse.', 'Black mulberry: the most flavourful fruit but slow to start cropping; white mulberry hardier and quicker. Self-fertile. Mulberries stain: avoid planting it above a patio.'),
    prop: [6, 'Grosses boutures de bois de 2 ans en hiver, ou marcottage.', 'Large two-year-wood cuttings in winter, or layering.'],
  },

  // --- Fruits à coque -----------------------------------------------------------------
  {
    id: 'walnut', name: T('Noyer', 'Walnut'), latin: 'Juglans regia', emoji: '🌰', family: 'juglandaceae', sun: 'full', frost: 'hardy', pH: [6, 8],
    spacing: [1000, 1000], harvest: [1735, 1765], yieldM2: [0.1, 0.3], feeding: 'light', root: 2, height: 1200, months: [9, 10],
    note: T('Grand arbre : prévoir 10 m dans toutes les directions. Choisir une variété à débourrement tardif (Franquette, Lara, Fernor) contre les gelées de printemps. Ses racines et feuilles (juglone) gênent beaucoup de légumes : le tenir à l’écart du potager.', 'Large tree: allow 10 m in every direction. Choose a late-leafing variety (Franquette, Lara, Fernor) against spring frosts. Its roots and leaves (juglone) hinder many vegetables: keep it away from the kitchen garden.'),
    prop: [5, 'Les noix germent facilement mais ne redonnent pas la variété : greffe en placage ou en flûte au printemps.', 'Nuts sprout easily but do not come true: patch or ring grafting in spring.'],
  },
  {
    id: 'almond', name: T('Amandier', 'Almond'), latin: 'Prunus dulcis', emoji: '🌰', family: 'rosaceae', sun: 'full', frost: 'hardy', pH: [6.5, 8.5],
    spacing: [500, 500], harvest: [975, 1005], yieldM2: [0.1, 0.3], feeding: 'light', root: 1.2, height: 500, months: [8, 9],
    note: T('L’arbre résiste au froid mais fleurit dès février : en région parisienne, les gelées détruisent souvent la récolte. Choisir une variété tardive et autofertile (Lauranne, Mandaline) et un emplacement abrité au sud. Sol calcaire, sec et drainé.', 'The tree is cold-hardy but flowers from February: around Paris, frosts often wipe out the crop. Choose a late, self-fertile variety (Lauranne, Mandaline) and a sheltered south-facing spot. Limy, dry, well-drained soil.'),
    prop: [6, 'Greffe en écusson sur amandier franc ou pêcher × amandier (GF 677).', 'Bud-grafted on almond seedling or peach × almond (GF 677).'],
  },
  {
    id: 'chestnut', name: T('Châtaignier', 'Sweet chestnut'), latin: 'Castanea sativa', emoji: '🌰', family: 'fagaceae', sun: 'full', frost: 'hardy', pH: [4.5, 6.5],
    spacing: [800, 800], harvest: [1765, 1795], yieldM2: [0.2, 0.4], feeding: 'light', root: 2, height: 1000, months: [10, 10],
    note: T('Exige un sol ACIDE et léger : il dépérit en terre calcaire. Planter au moins deux variétés compatibles (ex. Bouche de Bétizac et Marigoule) pour la pollinisation. Ramasser les bogues tombées chaque jour.', 'Needs ACID, light soil: it fails on limy ground. Plant at least two compatible varieties (e.g. Bouche de Bétizac and Marigoule) for pollination. Gather fallen burrs daily.'),
    prop: [5, 'Greffe en flûte ou en placage au printemps ; les semis de châtaignes donnent des fruits variables.', 'Ring or patch grafting in spring; seedlings give variable nuts.'],
  },

  // --- Fruitiers méditerranéens et subtropicaux ---------------------------------------
  {
    id: 'olive', name: T('Olivier', 'Olive'), latin: 'Olea europaea', emoji: '🫒', family: 'oleaceae', sun: 'full', frost: 'half', pH: [6.5, 8.5], plantOut: [[3, 5]],
    spacing: [600, 600], harvest: [1405, 1430], yieldM2: [0.3, 1], feeding: 'light', root: 1, height: 400, months: [10, 11],
    note: T('Climat méditerranéen : récolte d’octobre (olives vertes) à décembre (noires). En région parisienne, il survit vers −10 °C en sol très drainé ou en pot rentré l’hiver, mais les olives mûrissent rarement. Les olives crues sont amères : saumure ou désamérisation.', 'Mediterranean climate: harvest from October (green olives) to December (black). Around Paris it survives about −10 °C in very free-draining soil or in a pot brought in for winter, but olives rarely ripen. Raw olives are bitter: brine-cure them.'),
    prop: [8, 'Boutures semi-aoûtées en été sous brumisation, ou greffe.', 'Semi-ripe cuttings in summer under mist, or grafting.'],
  },
  {
    id: 'lemon', name: T('Citronnier', 'Lemon'), latin: 'Citrus × limon', emoji: '🍋', family: 'rutaceae', sun: 'full', frost: 'tender', pH: [6, 7], plantOut: [[5, 5]],
    spacing: [150, 150], harvest: [670, 790], yieldM2: [1.5, 3], feeding: 'heavy', root: 0.5, height: 150, months: [11, 3],
    note: T('En pot hors région méditerranéenne : sortir en mai au soleil, rentrer en octobre dans une pièce lumineuse hors gel (5 à 12 °C). Engrais agrumes d’avril à septembre, arrosage à l’eau de pluie. Les fruits mettent 6 à 9 mois à mûrir ; Meyer et 4 Saisons sont les plus faciles.', 'In a pot outside the Mediterranean: put out in May in sun, bring in by October to a bright frost-free room (5–12 °C). Citrus feed April–September, water with rainwater. Fruit take 6–9 months to ripen; Meyer and Four Seasons are the easiest.'),
    prop: [15, 'Boutures semi-aoûtées en été à l’étouffée ; les pépins donnent des arbres qui fructifient au bout de 8 à 10 ans.', 'Semi-ripe cuttings in summer under cover; pips give trees that fruit only after 8–10 years.'],
  },
  {
    id: 'pomegranate', name: T('Grenadier', 'Pomegranate'), latin: 'Punica granatum', emoji: '🔴', family: 'lythraceae', sun: 'full', frost: 'half', pH: [6, 8], plantOut: [[3, 5]],
    spacing: [400, 300], harvest: [1405, 1430], yieldM2: [1, 2], feeding: 'light', root: 1, height: 300, months: [10, 10],
    note: T('Fruits mûrs en octobre en climat méditerranéen. Rustique vers −12 °C, il fleurit bien en région parisienne contre un mur chaud mais les grenades y mûrissent mal. Autofertile, aime la chaleur et un sol drainé.', 'Fruit ripens in October in a Mediterranean climate. Hardy to about −12 °C, it flowers well around Paris against a warm wall but the fruit seldom ripens there. Self-fertile, loves heat and well-drained soil.'),
    prop: [10, 'Boutures de bois sec en hiver ou drageons ; les graines germent mais la variété n’est pas fidèle.', 'Hardwood cuttings in winter or suckers; seeds germinate but do not come true.'],
  },
  {
    id: 'feijoa', name: T('Feijoa', 'Feijoa'), latin: 'Acca sellowiana', emoji: '🟢', family: 'myrtaceae', sun: 'full', frost: 'half', pH: [5.5, 7], plantOut: [[3, 5]],
    spacing: [300, 300], harvest: [1420, 1460], yieldM2: [0.5, 1.5], feeding: 'light', root: 0.8, height: 300, months: [11, 11],
    note: T('Arbuste persistant rustique vers −12 °C. Planter deux variétés pour bien fructifier (Apollo et Coolidge sont autofertiles). Fruits verts au goût d’ananas-goyave, ramassés tombés en novembre ; les pétales charnus se mangent aussi.', 'Evergreen shrub hardy to about −12 °C. Plant two varieties for good crops (Apollo and Coolidge are self-fertile). Green fruit tasting of pineapple and guava, gathered as they drop in November; the fleshy petals are edible too.'),
    prop: [15, 'Boutures semi-aoûtées en été ou marcottage ; le semis est lent et variable.', 'Semi-ripe cuttings in summer or layering; seed is slow and variable.'],
  },
  {
    id: 'loquat', name: T('Néflier du Japon', 'Loquat'), latin: 'Eriobotrya japonica', emoji: '🟡', family: 'rosaceae', sun: 'full', frost: 'half', plantOut: [[3, 5]],
    spacing: [500, 500], harvest: [1255, 1285], yieldM2: [0.5, 1.5], feeding: 'medium', root: 1, height: 500, months: [5, 6],
    note: T('Climat méditerranéen : fleurit en hiver, récolte en mai-juin. L’arbre tient −12 °C mais fleurs et jeunes fruits gèlent vers −3 °C : en région parisienne, beau feuillage persistant et récolte rare. Autofertile.', 'Mediterranean climate: flowers in winter, harvested in May–June. The tree takes −12 °C but flowers and young fruit freeze around −3 °C: around Paris, fine evergreen foliage and an occasional crop. Self-fertile.'),
    prop: [10, 'Les noyaux germent facilement mais fructifient après 6 à 8 ans : greffer les bonnes variétés.', 'Seeds sprout easily but fruit only after 6–8 years: graft good varieties.'],
  },
  // --- Agrumes : en pot au nord de la Loire (rentrés hors gel d'octobre à mai), en pleine terre sur la côte méditerranéenne et en Corse.
  {
    id: 'orange', name: T('Oranger', 'Orange'), latin: 'Citrus × sinensis', emoji: '🍊', family: 'rutaceae', sun: 'full', frost: 'tender', pH: [6, 7], plantOut: [[5, 5]],
    spacing: [400, 400], harvest: [760, 880], yieldM2: [1.5, 3], feeding: 'heavy', root: 0.6, height: 300, months: [12, 3],
    note: T('Pleine terre seulement là où il gèle à peine (−3 °C au plus) ; ailleurs en grand pot, sorti au soleil de mai à octobre et hiverné lumineux à 5–12 °C. Les fruits mettent 10 à 12 mois à mûrir et ne sont sucrés qu’avec un été chaud. Navel (sans pépins, précoce), Valencia (tardive), Maltaise ou orange sanguine. Engrais agrumes d’avril à septembre, eau de pluie.', 'Outdoors only where frosts barely reach −3 °C; elsewhere in a large pot, out in the sun May–October and wintered bright at 5–12 °C. Fruit takes 10–12 months to ripen and is only sweet after a hot summer. Navel (seedless, early), Valencia (late), Maltaise or blood orange. Citrus feed April–September, rainwater.'),
    prop: [3, 'Greffe sur Poncirus ou bigaradier pour la vigueur et la rusticité ; les pépins fructifient après 8 à 12 ans.', 'Graft onto Poncirus or sour orange for vigour and hardiness; pips fruit only after 8–12 years.'],
  },
  {
    id: 'mandarin', name: T('Mandarinier (satsuma)', 'Mandarin (satsuma)'), latin: 'Citrus reticulata', emoji: '🍊', family: 'rutaceae', sun: 'full', frost: 'half', pH: [6, 7], plantOut: [[5, 5]],
    spacing: [300, 300], harvest: [730, 820], yieldM2: [1.5, 3], feeding: 'heavy', root: 0.6, height: 250, months: [10, 12],
    note: T('Le plus rustique des agrumes doux : les satsumas (Okitsu, Miyagawa) tiennent −7 °C à −8 °C un court moment et mûrissent dès octobre–novembre, avant les grands froids. En pleine terre sur la façade atlantique abritée et le Midi, en pot ailleurs. Fruits sans pépins, faciles à peler.', 'The hardiest sweet citrus: satsumas (Okitsu, Miyagawa) take −7 to −8 °C briefly and ripen as early as October–November, before hard frosts. In the ground on the sheltered Atlantic coast and in the south, in pots elsewhere. Seedless, easy-peel fruit.'),
    prop: [3, 'Greffe sur Poncirus (rusticité) ; boutures semi-aoûtées possibles mais lentes.', 'Graft onto Poncirus (hardiness); semi-ripe cuttings possible but slow.'],
  },
  {
    id: 'clementine', name: T('Clémentinier', 'Clementine'), latin: 'Citrus × clementina', emoji: '🍊', family: 'rutaceae', sun: 'full', frost: 'tender', pH: [6, 7], plantOut: [[5, 5]],
    spacing: [300, 300], harvest: [740, 830], yieldM2: [1.5, 3], feeding: 'heavy', root: 0.6, height: 250, months: [11, 1],
    note: T('La clémentine de Corse se récolte de novembre à janvier, avec ses feuilles. Tient −4 °C environ : pleine terre en Corse et sur la côte, pot ailleurs. Fructifie mieux avec un autre agrume à proximité (fruits sans pépins si elle est isolée).', 'Corsican clementines are picked November to January, with their leaves. Hardy to about −4 °C: in the ground in Corsica and on the coast, in pots elsewhere. Crops better with another citrus nearby (seedless fruit when grown alone).'),
    prop: [3, 'Greffe sur bigaradier ou Poncirus.', 'Graft onto sour orange or Poncirus.'],
  },
  {
    id: 'kumquat', name: T('Kumquat', 'Kumquat'), latin: 'Citrus japonica', emoji: '🟠', family: 'rutaceae', sun: 'full', frost: 'half', pH: [6, 7], plantOut: [[5, 5]],
    spacing: [200, 200], harvest: [700, 820], yieldM2: [1, 2], feeding: 'medium', root: 0.5, height: 200, months: [12, 3],
    note: T('Petit agrume qui se mange entier, peau sucrée et chair acidulée. L’un des plus rustiques (−8 à −10 °C bien aoûté) et des plus faciles en pot : il entre en repos l’hiver et fleurit en plein été. Confit, en marmelade ou cru.', 'Small citrus eaten whole: sweet peel, tart flesh. One of the hardiest (−8 to −10 °C when ripened wood) and easiest in pots: it rests in winter and flowers in midsummer. Candied, in marmalade or raw.'),
    prop: [10, 'Greffe sur Poncirus ; marcottage aérien.', 'Graft onto Poncirus; air layering.'],
  },
  {
    id: 'grapefruit', name: T('Pamplemoussier (pomelo)', 'Grapefruit'), latin: 'Citrus × paradisi', emoji: '🟡', family: 'rutaceae', sun: 'full', frost: 'tender', pH: [6, 7], plantOut: [[5, 5]],
    spacing: [500, 500], harvest: [800, 900], yieldM2: [2, 4], feeding: 'heavy', root: 0.7, height: 400, months: [12, 4],
    note: T('Le plus exigeant en chaleur : fruits juteux et peu amers seulement dans le Midi. Gèle vers −3 °C. En pot, prévoir un très grand bac et beaucoup de lumière l’hiver. Star Ruby (chair rouge), Marsh (blanc).', 'The most heat-hungry: juicy, mild fruit only in the south. Damaged around −3 °C. In pots, use a very large tub and plenty of winter light. Star Ruby (red flesh), Marsh (white).'),
    prop: [3, 'Greffe sur bigaradier ou citrange.', 'Graft onto sour orange or citrange.'],
  },
  {
    id: 'lime', name: T('Limettier (citron vert)', 'Lime'), latin: 'Citrus × latifolia', emoji: '🟢', family: 'rutaceae', sun: 'full', frost: 'tender', pH: [6, 7], plantOut: [[5, 5]],
    spacing: [300, 300], harvest: [680, 790], yieldM2: [1.5, 3], feeding: 'heavy', root: 0.5, height: 250, months: [8, 12],
    note: T('Le citron vert de Tahiti, sans pépins, fleurit plusieurs fois par an et se cueille encore vert. Très frileux (0 à −2 °C) : en pot partout sauf sur la Côte d’Azur. Le combava (Citrus hystrix) se cultive pareil, surtout pour ses feuilles.', 'Seedless Tahiti lime flowers several times a year and is picked while still green. Very frost-tender (0 to −2 °C): in a pot everywhere except the Riviera. Kaffir lime (Citrus hystrix) is grown the same way, mainly for its leaves.'),
    prop: [10, 'Boutures semi-aoûtées à l’étouffée (reprend bien) ou greffe.', 'Semi-ripe cuttings under cover (root well) or grafting.'],
  },
  {
    id: 'yuzu', name: T('Yuzu', 'Yuzu'), latin: 'Citrus junos', emoji: '🟡', family: 'rutaceae', sun: 'full', frost: 'half', pH: [6, 7], plantOut: [[4, 5]],
    spacing: [300, 300], harvest: [1100, 1250], yieldM2: [0.5, 1.5], feeding: 'medium', root: 0.6, height: 300, months: [11, 12],
    note: T('Agrume japonais très parfumé, cultivé pour son zeste et son jus. Rustique jusque vers −10 à −12 °C : il se tente en pleine terre contre un mur abrité dans l’ouest et le sud, même au nord de la Loire en situation chaude. Épineux, lent à se mettre à fruits.', 'Highly fragrant Japanese citrus grown for its zest and juice. Hardy to about −10 to −12 °C: worth trying in the ground against a sheltered wall in the west and south, even north of the Loire in a warm spot. Thorny, slow to start cropping.'),
    prop: [15, 'Greffe sur Poncirus ; les semis (souvent fidèles) fructifient tard.', 'Graft onto Poncirus; seedlings (often true) fruit late.'],
  },
  {
    id: 'citron', name: T('Cédratier (main de Bouddha)', 'Citron (Buddha’s hand)'), latin: 'Citrus medica', emoji: '🍋', family: 'rutaceae', sun: 'full', frost: 'tender', pH: [6, 7], plantOut: [[5, 5]],
    spacing: [300, 300], harvest: [700, 820], yieldM2: [1, 2], feeding: 'heavy', root: 0.5, height: 250, months: [10, 2],
    note: T('Gros fruit à peau très épaisse et parfumée, confite ou en liqueur (cédrat corse) ; la « main de Bouddha » est une forme digitée sans pulpe. Frileux (−3 °C) : en pot, rentré tôt.', 'Large, thick-skinned, fragrant fruit, candied or made into liqueur (Corsican citron); “Buddha’s hand” is a fingered form with no pulp. Frost-tender (−3 °C): in a pot, brought in early.'),
    prop: [10, 'Boutures semi-aoûtées : reprennent facilement.', 'Semi-ripe cuttings root easily.'],
  },
  {
    id: 'bitterorange', name: T('Bigaradier (orange amère)', 'Seville orange'), latin: 'Citrus × aurantium', emoji: '🍊', family: 'rutaceae', sun: 'full', frost: 'half', pH: [6, 7.5], plantOut: [[5, 5]],
    spacing: [400, 400], harvest: [760, 880], yieldM2: [1.5, 3], feeding: 'medium', root: 0.6, height: 350, months: [1, 3],
    note: T('L’orange de la marmelade, de l’eau de fleur d’oranger (fleurs) et du Cointreau (écorces). Plus rustique que l’oranger doux (−7 °C environ), arbre d’alignement sur la Côte d’Azur. En pot, il fleurit abondamment et sent merveilleusement.', 'The marmalade orange, source of orange-flower water (blossom) and orange liqueurs (peel). Hardier than sweet orange (about −7 °C), a street tree on the Riviera. In pots it flowers profusely and smells wonderful.'),
    prop: [5, 'Les pépins donnent des plants fidèles, aussi utilisés comme porte-greffes.', 'Pips come true and are also used as rootstocks.'],
  },
  {
    id: 'poncirus', name: T('Citronnier épineux (Poncirus)', 'Trifoliate orange'), latin: 'Citrus trifoliata', emoji: '🟡', family: 'rutaceae', sun: 'full', frost: 'hardy', pH: [5.5, 7], plantOut: [[11, 3]],
    spacing: [200, 100], harvest: [1300, 1400], yieldM2: [0.5, 1], feeding: 'light', root: 0.6, height: 300, months: [10, 11],
    note: T('Le seul agrume vraiment rustique (−20 °C), caduc, aux énormes épines : haie défensive, porte-greffe des agrumes. Petits fruits jaunes duveteux très acides et résineux, pour sirop, marmelade ou zestes, pas à croquer.', 'The only truly hardy citrus (−20 °C), deciduous with huge thorns: a defensive hedge and the citrus rootstock. Small fuzzy yellow fruit, very sour and resinous, for syrup, marmalade or zest, not for eating raw.'),
    prop: [5, 'Semis des pépins à l’automne : plants fidèles.', 'Sow the pips in autumn: they come true.'],
  },
  // --- Autres fruitiers
  {
    id: 'sourcherry', name: T('Griottier (cerisier acide)', 'Sour cherry'), latin: 'Prunus cerasus', emoji: '🍒', family: 'rosaceae', sun: 'full', frost: 'hardy', pH: [6, 7.5],
    spacing: [400, 400], harvest: [580, 620], yieldM2: [1, 2], feeding: 'medium', root: 0.8, height: 400, months: [7, 7],
    note: T('Cerises acidulées pour clafoutis, confitures, cerises à l’eau-de-vie. Autofertile (Montmorency, Griotte du Nord), il supporte un mur au nord et fructifie jeune. Taille légère après récolte.', 'Tart cherries for pies, jam and brandied cherries. Self-fertile (Montmorency, Morello), it tolerates a north wall and crops young. Light pruning after harvest.'),
    prop: [4, 'Drageons ou greffe ; les noyaux donnent des arbres variables.', 'Suckers or grafting; stones give variable trees.'],
  },
  {
    id: 'nashi', name: T('Nashi (poirier asiatique)', 'Asian pear'), latin: 'Pyrus pyrifolia', emoji: '🍐', family: 'rosaceae', sun: 'full', frost: 'hardy', pH: [6, 7.5],
    spacing: [400, 400], harvest: [600, 680], yieldM2: [1.5, 3], feeding: 'medium', root: 0.8, height: 400, months: [8, 9],
    note: T('Fruit rond, croquant et très juteux comme une pomme, goût de poire. Fleurit tôt : planter deux variétés de nashi (Kosui, Hosui, Nijisseiki) ou un poirier européen précoce pour la pollinisation. Éclaircir à un fruit par bouquet.', 'Round fruit, crisp and very juicy like an apple, tasting of pear. Flowers early: plant two nashi varieties (Kosui, Hosui, Nijisseiki) or an early European pear for pollination. Thin to one fruit per cluster.'),
    prop: [4, 'Greffe sur franc ou cognassier.', 'Graft onto seedling pear or quince.'],
  },
  {
    id: 'kiwai', name: T('Kiwaï (kiwi de Sibérie)', 'Hardy kiwi (kiwiberry)'), latin: 'Actinidia arguta', emoji: '🥝', family: 'actinidiaceae', sun: 'partial', frost: 'hardy', pH: [5.5, 7],
    spacing: [300, 300], harvest: [940, 1020], yieldM2: [1.5, 3], feeding: 'medium', root: 0.6, height: 500, months: [9, 10],
    note: T('Petits kiwis à peau lisse qui se croquent entiers, très sucrés. Liane rustique à −25 °C, mais jeunes pousses sensibles aux gelées de printemps. Il faut un pied mâle pour 6 femelles (Issai est autofertile). Palisser sur pergola ou grillage solide.', 'Small smooth-skinned kiwis eaten whole, very sweet. Vine hardy to −25 °C, but young shoots are sensitive to spring frosts. One male per 6 females (Issai is self-fertile). Train on a pergola or sturdy wire.'),
    prop: [10, 'Boutures semi-aoûtées en été ou marcottage.', 'Semi-ripe cuttings in summer or layering.'],
  },
  {
    id: 'passionfruit', name: T('Fruit de la passion (passiflore)', 'Passion fruit'), latin: 'Passiflora edulis', emoji: '🟣', family: 'passifloraceae', sun: 'full', frost: 'tender', pH: [6, 7.5], plantOut: [[5, 5]],
    spacing: [200, 200], harvest: [500, 600], yieldM2: [1, 3], feeding: 'medium', root: 0.5, height: 400, months: [9, 11],
    note: T('Liane tropicale qui fructifie dès la deuxième année : en serre, en véranda ou en grand pot sorti l’été, rentrée hors gel (−2 °C au plus). Fruits mûrs quand ils tombent ou se rident. La passiflore bleue (P. caerulea), rustique, donne des fruits orange comestibles mais fades.', 'Tropical vine that fruits from the second year: in a greenhouse, conservatory or large pot outdoors in summer, brought in frost-free (−2 °C at most). Ripe when the fruit drops or wrinkles. Hardy blue passionflower (P. caerulea) gives edible but bland orange fruit.'),
    prop: [10, 'Semis frais au chaud (25 °C) ou boutures de tiges en été.', 'Sow fresh seed warm (25 °C) or take stem cuttings in summer.'],
  },
  {
    id: 'jujube', name: T('Jujubier', 'Jujube'), latin: 'Ziziphus jujuba', emoji: '🟤', family: 'rhamnaceae', sun: 'full', frost: 'hardy', pH: [6, 8.5],
    spacing: [400, 400], harvest: [940, 1030], yieldM2: [1, 2], feeding: 'light', root: 1, height: 500, months: [9, 10],
    note: T('Arbre de soleil, rustique à −20 °C et très résistant à la sécheresse, qui débourre tard (pas de gel des fleurs). Les jujubes se croquent comme une pomme quand elles brunissent, ou se sèchent comme des dattes. Li et Lang sont les variétés les plus productives ; fructifie bien seulement avec des étés chauds.', 'Sun-loving tree hardy to −20 °C and very drought-tolerant, leafing out late (no flower frost). Jujubes are eaten crisp like an apple as they turn brown, or dried like dates. Li and Lang crop best; fruits well only with hot summers.'),
    prop: [10, 'Drageons ou greffe ; noyaux lents et variables.', 'Suckers or grafting; stones slow and variable.'],
  },
  {
    id: 'pawpaw', name: T('Asiminier', 'Pawpaw'), latin: 'Asimina triloba', emoji: '🥭', family: 'annonaceae', sun: 'partial', frost: 'hardy', pH: [5.5, 7],
    spacing: [400, 300], harvest: [1300, 1500], yieldM2: [1, 2], feeding: 'medium', root: 1, height: 500, months: [9, 10],
    note: T('Fruit nord-américain à chair crémeuse au goût de banane-mangue. Rustique à −25 °C ; jeunes plants à mi-ombre. Planter deux variétés différentes (Sunflower, Prima 1216) pour la pollinisation, aidée au pinceau au besoin. Fruits très fragiles, à consommer vite.', 'North American fruit with creamy flesh tasting of banana and mango. Hardy to −25 °C; young plants in part shade. Plant two different varieties (Sunflower, Prima 1216) for pollination, helped with a brush if needed. Very perishable fruit, eat quickly.'),
    prop: [10, 'Graines fraîches stratifiées 3 mois au froid ; greffe pour les variétés.', 'Fresh seed cold-stratified 3 months; graft for named varieties.'],
  },
  {
    id: 'strawberrytree', name: T('Arbousier', 'Strawberry tree'), latin: 'Arbutus unedo', emoji: '🔴', family: 'ericaceae', sun: 'full', frost: 'hardy', pH: [5, 7.5],
    spacing: [300, 300], harvest: [940, 1100], yieldM2: [0.5, 1.5], feeding: 'light', root: 0.8, height: 400, months: [10, 12],
    note: T('Arbuste persistant méditerranéen, rustique vers −15 °C, qui porte en même temps fleurs et fruits rouges granuleux. Les arbouses mûres se mangent fraîches (fades) ou en confiture et liqueur. Supporte calcaire léger et sécheresse.', 'Mediterranean evergreen shrub hardy to about −15 °C, carrying flowers and red grainy fruit at the same time. Ripe fruit is eaten fresh (mild) or in jam and liqueur. Tolerates light lime and drought.'),
    prop: [10, 'Semis après stratification ou boutures semi-aoûtées.', 'Sow after stratification or take semi-ripe cuttings.'],
  },
  {
    id: 'cornelian', name: T('Cornouiller mâle', 'Cornelian cherry'), latin: 'Cornus mas', emoji: '🔴', family: 'cornaceae', sun: 'full', frost: 'hardy', pH: [6, 8],
    spacing: [400, 300], harvest: [1300, 1500], yieldM2: [0.5, 1.5], feeding: 'light', root: 0.8, height: 400, months: [8, 9],
    note: T('Fleurs jaunes en février, précieuses pour les abeilles, puis cornouilles rouges en forme d’olive, acides, à cueillir très mûres (molles, tombées) pour gelées, sirops ou à la manière des olives. Très rustique, sans maladie, supporte le calcaire. Lent à fructifier.', 'Yellow flowers in February, precious for bees, then red olive-shaped cornels, sour, picked very ripe (soft, fallen) for jelly, syrup or pickled like olives. Very hardy, disease-free, lime-tolerant. Slow to start fruiting.'),
    prop: [8, 'Semis (2 hivers de stratification) ou marcottage ; greffe pour les variétés à gros fruits.', 'Seed (2 winters of stratification) or layering; graft large-fruited varieties.'],
  },
  {
    id: 'guava', name: T('Goyavier-fraise', 'Strawberry guava'), latin: 'Psidium cattleianum', emoji: '🔴', family: 'myrtaceae', sun: 'full', frost: 'half', pH: [5, 7], plantOut: [[4, 5]],
    spacing: [200, 200], harvest: [700, 800], yieldM2: [1, 2], feeding: 'medium', root: 0.5, height: 250, months: [9, 11],
    note: T('Arbuste persistant à petites goyaves rouges au goût de fraise et de fruit de la passion. Tient −5 à −7 °C : pleine terre dans le Midi et sur la côte atlantique, sinon en pot. Autofertile, fructifie jeune.', 'Evergreen shrub with small red guavas tasting of strawberry and passion fruit. Takes −5 to −7 °C: in the ground in the south and on the Atlantic coast, otherwise in a pot. Self-fertile, crops young.'),
    prop: [10, 'Semis frais (fidèle) ou boutures semi-aoûtées.', 'Fresh seed (comes true) or semi-ripe cuttings.'],
  },
  {
    id: 'serviceberry', name: T('Amélanchier', 'Serviceberry (juneberry)'), latin: 'Amelanchier alnifolia', emoji: '🫐', family: 'rosaceae', sun: 'partial', frost: 'hardy', pH: [5.5, 7.5],
    spacing: [250, 200], harvest: [560, 600], yieldM2: [0.5, 1.5], feeding: 'light', root: 0.6, height: 300, months: [6, 7],
    note: T('Arbuste très rustique couvert de fleurs blanches en avril, puis de baies bleu-noir au goût d’amande et de myrtille, en juin. Les oiseaux en raffolent : filet utile. Variétés à fruits : Saskatoon, Smoky, Northline. Beau feuillage d’automne.', 'Very hardy shrub smothered in white flowers in April, then blue-black berries tasting of almond and blueberry in June. Birds love them: a net helps. Fruiting varieties: Saskatoon, Smoky, Northline. Fine autumn colour.'),
    prop: [8, 'Drageons, marcottage ou semis stratifié.', 'Suckers, layering or stratified seed.'],
  },
  {
    id: 'pistachio', name: T('Pistachier', 'Pistachio'), latin: 'Pistacia vera', emoji: '🟢', family: 'anacardiaceae', sun: 'full', frost: 'half', pH: [7, 8.5],
    spacing: [600, 600], harvest: [2400, 2600], yieldM2: [0.05, 0.15], feeding: 'light', root: 1.5, height: 500, months: [9, 9],
    note: T('Arbre des étés longs et secs : ne fructifie qu’en climat méditerranéen chaud (Provence, Languedoc). Rustique vers −12 à −15 °C. Espèce dioïque : un pied mâle (Peter) pour 8 à 10 femelles (Kerman). Premières récoltes après 6 à 7 ans.', 'A tree for long dry summers: only crops in a hot Mediterranean climate (Provence, Languedoc). Hardy to about −12 to −15 °C. Dioecious: one male (Peter) for 8–10 females (Kerman). First crops after 6–7 years.'),
    prop: [20, 'Greffe sur Pistacia terebinthus ou atlantica.', 'Graft onto Pistacia terebinthus or atlantica.'],
  },
  {
    id: 'servicetree', name: T('Cormier (sorbier domestique)', 'Service tree'), latin: 'Sorbus domestica', emoji: '🟤', family: 'rosaceae', sun: 'full', frost: 'hardy', pH: [6, 8],
    spacing: [800, 800], harvest: [3500, 4000], yieldM2: [0.3, 0.8], feeding: 'light', root: 1.5, height: 1200, months: [10, 10],
    note: T('Fruitier oublié, très longévif. Les cormes, petites poires ou pommes rousses, se mangent blettes comme les nèfles, ou en cidre (« cormé »). Très rustique, aime le calcaire. Patience : 10 ans et plus avant les fruits.', 'A forgotten, very long-lived fruit tree. Sorbs, small russet pears or apples, are eaten bletted like medlars or made into cider. Very hardy, likes lime. Patience: 10 years or more before fruit.'),
    prop: [10, 'Semis stratifié ou greffe sur aubépine ou poirier.', 'Stratified seed or graft onto hawthorn or pear.'],
  },
];

const BUILT = DEFS.map(fruit);
export const MORE_ORCHARD: Species[] = BUILT.map((b) => b.species);
export const MORE_ORCHARD_EXTRA: Record<string, SpeciesExtra> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.extra]));
export const MORE_ORCHARD_HEIGHT: Record<string, number> = Object.fromEntries(BUILT.map((b) => [b.species.id, b.height]));
/** Mois de récolte d'un fruitier adulte. */
export const MORE_ORCHARD_MONTHS: Record<string, MonthRange> = Object.fromEntries(DEFS.map((d) => [d.id, d.months]));
