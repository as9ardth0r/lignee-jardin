/**
 * Types de culture : pour certaines espèces, la période de semis ou de
 * plantation dépend du type choisi (ail d'automne ou de printemps, oignon
 * de printemps ou d'hiver, pois rond ou ridé…). Chaque type remplace le
 * calendrier et la durée de culture de l'espèce ; tout le reste (besoins,
 * espacement, rotation…) reste celui de l'espèce.
 *
 * Calendrier de référence : région parisienne, décalé ensuite selon le
 * climat comme celui des espèces. Durées : jours après le semis ou la
 * plantation ; pour les cultures qui passent l'hiver en terre, la
 * croissance réelle suit les degrés-jours (lente en hiver).
 * Sources : calendriers des semenciers (Vilmorin, Ducrettet, Graines
 * Baumaux), Rustica, fiches techniques du GNIS.
 */
import type { Species, SpeciesType } from '../model';
import { SPECIES_BY_ID } from './species';

export const SPECIES_TYPES: Record<string, SpeciesType[]> = {
  garlic: [
    {
      id: 'autumn',
      name: { fr: 'Ail blanc ou violet (d’automne)', en: 'White or purple garlic (autumn)' },
      examples: 'Messidrôme, Thermidrôme, Violet de Cadours',
      note: {
        fr: 'Se plante d’octobre à décembre : il passe l’hiver en terre et se récolte en juin-juillet. Se garde jusqu’en janvier-février.',
        en: 'Planted October to December: overwinters in the ground, harvested June–July. Keeps until January–February.',
      },
      plantOut: [[10, 12]],
      daysToHarvest: [200, 240],
      season: 250,
      stages: [['vegetative', 0], ['bulking', 170]],
    },
    {
      id: 'spring',
      name: { fr: 'Ail rose (de printemps)', en: 'Pink garlic (spring)' },
      examples: 'Rose de Lautrec, Printanor, Flavor',
      note: {
        fr: 'Se plante de janvier à mars, quand la terre n’est plus gelée ; récolte en juillet. C’est l’ail qui se conserve le plus longtemps (jusqu’au printemps suivant).',
        en: 'Planted January to March, once the ground is no longer frozen; harvested in July. The longest-keeping garlic (until the following spring).',
      },
      plantOut: [[1, 3]],
      daysToHarvest: [140, 170],
      season: 180,
      stages: [['vegetative', 0], ['bulking', 100]],
    },
  ],

  onion: [
    {
      id: 'springSets',
      name: { fr: 'Oignon de printemps – bulbilles', en: 'Spring onion – sets' },
      examples: 'Jaune paille des Vertus, Stuttgart, Rouge de Brunswick',
      note: {
        fr: 'Bulbilles plantées de février à avril, pointe affleurante ; récolte en juillet-août. Oignons de garde. Dans les régions aux hivers doux, ces variétés se plantent aussi en octobre (risque de montée en graines).',
        en: 'Sets planted February to April, tip at soil level; harvested July–August. Storage onions. Where winters are mild, these varieties can also be planted in October (risk of bolting).',
      },
      plantOut: [[2, 4]],
      daysToHarvest: [110, 150],
      season: 160,
      stages: [['vegetative', 0], ['bulking', 70]],
    },
    {
      id: 'springSeed',
      name: { fr: 'Oignon de printemps – semis', en: 'Spring onion – seed' },
      examples: 'Jaune paille des Vertus, Rouge de Brunswick, Rosé de Roscoff',
      note: {
        fr: 'Semé en place de février à avril, éclairci à 8-10 cm ; récolte en août. Moins cher que les bulbilles, mais plus long.',
        en: 'Sown in place February to April, thinned to 8–10 cm; harvested in August. Cheaper than sets, but slower.',
      },
      sowOutdoor: [[2, 4]],
      daysToHarvest: [140, 170],
      season: 180,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 90]],
    },
    {
      id: 'winterSets',
      name: { fr: 'Oignon d’hiver – bulbilles', en: 'Winter onion – sets' },
      examples: 'Radar, Senshyu jaune, Troy',
      note: {
        fr: 'Bulbilles d’hiver plantées de septembre à octobre ; récolte en mai-juin, avant les oignons de printemps. Se conserve quelques mois seulement.',
        en: 'Winter sets planted September to October; harvested May–June, before spring onions. Keeps only a few months.',
      },
      plantOut: [[9, 10]],
      daysToHarvest: [220, 260],
      season: 270,
      stages: [['vegetative', 0], ['bulking', 190]],
    },
    {
      id: 'winterSeed',
      name: { fr: 'Oignon blanc d’hiver – semis', en: 'White winter onion – seed' },
      examples: 'Blanc hâtif de Paris, Blanc de la Reine',
      note: {
        fr: 'Semé fin août-septembre, il passe l’hiver jeune plant et se récolte au printemps, frais ou en botte.',
        en: 'Sown late August–September, overwinters as a young plant and is harvested in spring, fresh or in bunches.',
      },
      sowOutdoor: [[8, 9]],
      daysToHarvest: [200, 250],
      season: 260,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 180]],
    },
  ],

  shallot: [
    {
      id: 'grey',
      name: { fr: 'Échalote grise (d’automne)', en: 'Grey shallot (autumn)' },
      examples: 'Grise de la Drôme, Griselle',
      note: {
        fr: 'Se plante en octobre-novembre et se récolte en juin-juillet ; la plus parfumée, de conservation moyenne.',
        en: 'Planted October–November, harvested June–July; the most aromatic, medium keeping.',
      },
      plantOut: [[10, 11]],
      daysToHarvest: [230, 260],
      season: 270,
      stages: [['vegetative', 0], ['bulking', 190]],
    },
    {
      id: 'spring',
      name: { fr: 'Échalote de Jersey ou longue (de printemps)', en: 'Jersey or long shallot (spring)' },
      examples: 'Jersey, Longor, Mikor',
      note: {
        fr: 'Se plante de février à mars, récolte en juillet ; se garde tout l’hiver.',
        en: 'Planted February to March, harvested in July; keeps all winter.',
      },
      plantOut: [[2, 3]],
      daysToHarvest: [120, 150],
      season: 160,
      stages: [['vegetative', 0], ['bulking', 80]],
    },
  ],

  pea: [
    {
      id: 'round',
      name: { fr: 'Pois à grain rond', en: 'Round-seeded pea' },
      examples: 'Petit provençal, Douce Provence, Express à longue cosse',
      note: {
        fr: 'Résiste au froid : semis de février à mars, ou en octobre-novembre dans les régions aux hivers doux. Grain moins sucré.',
        en: 'Cold-hardy: sown February to March, or October–November where winters are mild. Less sweet.',
      },
      sowOutdoor: [[2, 3], [10, 11]],
      daysToHarvest: [80, 100],
      season: 120,
      stages: [['germination', 0], ['vegetative', 12], ['flowering', 55], ['fruiting', 70]],
    },
    {
      id: 'wrinkled',
      name: { fr: 'Pois à grain ridé', en: 'Wrinkled-seeded pea' },
      examples: 'Kelvedon Wonder, Téléphone, Merveille de Kelvedon',
      note: {
        fr: 'Plus sucré mais craint le froid et pourrit en terre froide : semis de mars à mai.',
        en: 'Sweeter but dislikes cold and rots in cold soil: sown March to May.',
      },
      sowOutdoor: [[3, 5]],
      daysToHarvest: [75, 95],
      season: 110,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 50], ['fruiting', 65]],
    },
  ],

  broadbean: [
    {
      id: 'spring',
      name: { fr: 'Fève de printemps', en: 'Spring broad bean' },
      examples: 'Aguadulce, Précoce d’Aquitaine',
      note: { fr: 'Semis de février à mars, récolte en juin.', en: 'Sown February to March, harvested in June.' },
      sowOutdoor: [[2, 3]],
      daysToHarvest: [100, 130],
      season: 150,
      stages: [['germination', 0], ['vegetative', 15], ['flowering', 70], ['fruiting', 95]],
    },
    {
      id: 'autumn',
      name: { fr: 'Fève d’automne (hivers doux)', en: 'Autumn broad bean (mild winters)' },
      examples: 'Aguadulce, Super Aguadulce',
      note: {
        fr: 'Semis en octobre-novembre là où il gèle peu (jusqu’à -5 °C environ) ; récolte dès mai, avant les pucerons noirs.',
        en: 'Sown October–November where frost is light (down to about −5 °C); harvested from May, before blackfly.',
      },
      sowOutdoor: [[10, 11]],
      daysToHarvest: [190, 220],
      season: 240,
      stages: [['germination', 0], ['vegetative', 20], ['flowering', 150], ['fruiting', 175]],
    },
  ],

  lettuce: [
    {
      id: 'season',
      name: { fr: 'Laitue de printemps et d’été', en: 'Spring and summer lettuce' },
      examples: 'Batavia, Reine de Mai, Merveille des quatre saisons',
      note: {
        fr: 'Semis échelonnés de février (à l’abri) à août, toutes les 3 semaines pour en avoir sans interruption. Choisissez des variétés lentes à monter pour l’été.',
        en: 'Staggered sowings from February (under cover) to August, every 3 weeks for a continuous supply. Pick slow-bolting varieties for summer.',
      },
      sowIndoor: [[2, 4]],
      sowOutdoor: [[3, 8]],
      plantOut: [[3, 9]],
      transplantAfter: 30,
      daysToHarvest: [50, 75],
      season: 80,
      stages: [['germination', 0], ['vegetative', 8], ['harvest', 50]],
    },
    {
      id: 'winter',
      name: { fr: 'Laitue d’hiver', en: 'Winter lettuce' },
      examples: 'Merveille d’hiver, Passion brune, Val d’Orge',
      note: {
        fr: 'Semée en septembre, plantée en octobre, elle passe l’hiver et pomme en mars-avril. Protégez-la d’un voile par grand froid.',
        en: 'Sown in September, planted in October, it overwinters and hearts in March–April. Cover with fleece in hard frost.',
      },
      sowOutdoor: [[9, 9]],
      plantOut: [[10, 10]],
      transplantAfter: 30,
      daysToHarvest: [180, 210],
      season: 220,
      stages: [['germination', 0], ['vegetative', 8], ['harvest', 180]],
    },
  ],

  spinach: [
    {
      id: 'spring',
      name: { fr: 'Épinard de printemps', en: 'Spring spinach' },
      examples: 'Géant d’hiver, Matador',
      note: { fr: 'Semis de mars à avril ; il monte en graines dès les jours longs de juin.', en: 'Sown March to April; bolts once days lengthen in June.' },
      sowOutdoor: [[3, 4]],
      daysToHarvest: [40, 60],
      season: 70,
      stages: [['germination', 0], ['vegetative', 8], ['harvest', 40]],
    },
    {
      id: 'autumn',
      name: { fr: 'Épinard d’automne et d’hiver', en: 'Autumn and winter spinach' },
      examples: 'Géant d’hiver, Monstrueux de Viroflay',
      note: { fr: 'Semis d’août à septembre ; récoltes de feuilles de l’automne à la fin de l’hiver.', en: 'Sown August to September; leaves picked from autumn to the end of winter.' },
      sowOutdoor: [[8, 9]],
      daysToHarvest: [50, 80],
      season: 180,
      stages: [['germination', 0], ['vegetative', 8], ['harvest', 50]],
    },
  ],

  cabbage: [
    {
      id: 'summer',
      name: { fr: 'Chou d’été (hâtif)', en: 'Summer cabbage (early)' },
      examples: 'Cœur de bœuf, Express, Copenhague',
      note: { fr: 'Semis à l’abri en février-mars, plantation en avril-mai, récolte en juin-juillet.', en: 'Sown under cover February–March, planted April–May, harvested June–July.' },
      sowIndoor: [[2, 3]],
      plantOut: [[4, 5]],
      transplantAfter: 40,
      daysToHarvest: [90, 120],
      season: 130,
      stages: [['germination', 0], ['vegetative', 10], ['bulking', 60]],
    },
    {
      id: 'autumn',
      name: { fr: 'Chou d’automne', en: 'Autumn cabbage' },
      examples: 'Quintal d’Alsace, Brunswick, chou rouge',
      note: { fr: 'Semis en avril-mai, plantation en juin, récolte de septembre à novembre.', en: 'Sown April–May, planted in June, harvested September to November.' },
      sowIndoor: [[4, 5]],
      plantOut: [[5, 7]],
      transplantAfter: 40,
      daysToHarvest: [120, 160],
      season: 180,
      stages: [['germination', 0], ['vegetative', 10], ['bulking', 70]],
    },
    {
      id: 'winter',
      name: { fr: 'Chou d’hiver (Milan)', en: 'Winter cabbage (Savoy)' },
      examples: 'Milan de Pontoise, Milan de Vertus, Chou de Saint-Denis',
      note: { fr: 'Semis en mai-juin, plantation en juillet-août ; résiste au gel et se récolte tout l’hiver.', en: 'Sown May–June, planted July–August; frost-hardy, harvested all winter.' },
      sowIndoor: [[5, 6]],
      plantOut: [[7, 8]],
      transplantAfter: 40,
      daysToHarvest: [130, 200],
      season: 220,
      stages: [['germination', 0], ['vegetative', 10], ['bulking', 80]],
    },
  ],

  leek: [
    {
      id: 'summer',
      name: { fr: 'Poireau d’été et d’automne', en: 'Summer and autumn leek' },
      examples: 'Long d’été, Gros long d’été, Jaune gros du Poitou',
      note: { fr: 'Semis à l’abri en février-mars, plantation en mai, récolte d’août à novembre ; craint les grands froids.', en: 'Sown under cover February–March, planted in May, harvested August to November; dislikes hard frost.' },
      sowIndoor: [[2, 3]],
      plantOut: [[4, 5]],
      transplantAfter: 70,
      daysToHarvest: [140, 180],
      season: 200,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 100]],
    },
    {
      id: 'winter',
      name: { fr: 'Poireau d’hiver', en: 'Winter leek' },
      examples: 'Bleu de Solaise, Monstrueux de Carentan, Géant d’hiver',
      note: { fr: 'Semis en mars-avril, plantation en juin-juillet ; résiste au gel et se récolte de novembre à mars.', en: 'Sown March–April, planted June–July; frost-hardy, harvested November to March.' },
      sowIndoor: [[3, 4]],
      sowOutdoor: [[4, 5]],
      plantOut: [[6, 7]],
      transplantAfter: 70,
      daysToHarvest: [200, 300],
      season: 320,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 140]],
    },
  ],

  carrot: [
    {
      id: 'early',
      name: { fr: 'Carotte primeur', en: 'Early carrot' },
      examples: 'Nantaise hâtive, Amsterdam, Marché de Paris',
      note: { fr: 'Semis de février (sous voile) à avril, récolte en juin ; racine courte et tendre, à consommer vite.', en: 'Sown February (under fleece) to April, harvested in June; short tender root, eat soon.' },
      sowOutdoor: [[2, 4]],
      daysToHarvest: [60, 85],
      season: 100,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 45]],
    },
    {
      id: 'main',
      name: { fr: 'Carotte de saison', en: 'Main-crop carrot' },
      examples: 'Nantaise améliorée, Touchon',
      note: { fr: 'Semis d’avril à juin, récolte de l’été à l’automne.', en: 'Sown April to June, harvested summer to autumn.' },
      sowOutdoor: [[4, 6]],
      daysToHarvest: [80, 110],
      season: 130,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 55]],
    },
    {
      id: 'storage',
      name: { fr: 'Carotte de garde', en: 'Storage carrot' },
      examples: 'Colmar à cœur rouge, Chantenay, Flakkee',
      note: { fr: 'Semis de mai à juillet, récolte en octobre-novembre ; se garde tout l’hiver en cave ou en silo.', en: 'Sown May to July, harvested October–November; keeps all winter in a cellar or clamp.' },
      sowOutdoor: [[5, 7]],
      daysToHarvest: [110, 150],
      season: 170,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 70]],
    },
  ],

  potato: [
    {
      id: 'early',
      name: { fr: 'Pomme de terre primeur', en: 'Early potato' },
      examples: 'Sirtema, Belle de Fontenay, Rosabelle',
      note: { fr: 'Plantation de fin février à avril (tubercules germés), récolte en juin ; à consommer rapidement.', en: 'Planted late February to April (chitted tubers), harvested in June; eat soon.' },
      plantOut: [[3, 4]],
      daysToHarvest: [70, 95],
      season: 100,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 45]],
    },
    {
      id: 'main',
      name: { fr: 'Pomme de terre de saison', en: 'Main-crop potato' },
      examples: 'Charlotte, Ratte, Amandine',
      note: { fr: 'Plantation d’avril à mai, récolte de juillet à août.', en: 'Planted April to May, harvested July to August.' },
      plantOut: [[4, 5]],
      daysToHarvest: [100, 120],
      season: 130,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 55]],
    },
    {
      id: 'storage',
      name: { fr: 'Pomme de terre de conservation', en: 'Storage potato' },
      examples: 'Bintje, Agria, Désirée, Mona Lisa',
      note: { fr: 'Plantation d’avril à mai, récolte en septembre quand le feuillage est sec ; se garde jusqu’au printemps.', en: 'Planted April to May, harvested in September when the foliage has died back; keeps until spring.' },
      plantOut: [[4, 5]],
      daysToHarvest: [120, 150],
      season: 160,
      stages: [['germination', 0], ['vegetative', 20], ['bulking', 65]],
    },
  ],

  radish: [
    {
      id: 'spring',
      name: { fr: 'Radis de tous les mois', en: 'Summer radish' },
      examples: 'Rond écarlate, Flamboyant, 18 jours',
      note: { fr: 'Semis de mars à septembre toutes les 2 semaines ; récolte en 3 à 5 semaines.', en: 'Sown March to September every 2 weeks; harvested in 3 to 5 weeks.' },
      sowOutdoor: [[3, 5], [8, 9]],
      daysToHarvest: [25, 35],
      season: 40,
      stages: [['germination', 0], ['vegetative', 5], ['bulking', 15]],
    },
    {
      id: 'winter',
      name: { fr: 'Radis d’hiver', en: 'Winter radish' },
      examples: 'Noir gros long d’hiver, Rose de Chine, Blanc de Munich',
      note: { fr: 'Semis de juillet à août, récolte d’octobre à décembre ; se garde plusieurs semaines.', en: 'Sown July to August, harvested October to December; keeps for weeks.' },
      sowOutdoor: [[7, 8]],
      daysToHarvest: [60, 90],
      season: 110,
      stages: [['germination', 0], ['vegetative', 8], ['bulking', 30]],
    },
  ],

  // --- Fleurs ------------------------------------------------------------------
  sweetpea: [
    {
      id: 'spring',
      name: { fr: 'Pois de senteur – semis de printemps', en: 'Sweet pea – spring sowing' },
      note: { fr: 'Semis à l’abri en février-mars (ou en place en mars-avril), floraison de juin à août.', en: 'Sown under cover February–March (or in place March–April), flowers June to August.' },
      sowIndoor: [[2, 3]],
      sowOutdoor: [[3, 4]],
      plantOut: [[4, 4]],
      transplantAfter: 40,
      daysToHarvest: [100, 170],
      season: 180,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 100]],
    },
    {
      id: 'autumn',
      name: { fr: 'Pois de senteur – semis d’automne', en: 'Sweet pea – autumn sowing' },
      note: { fr: 'Semé en octobre-novembre en godets profonds, hiverné sous châssis froid, planté en mars : fleurit dès mai, plus longtemps et sur des tiges plus longues.', en: 'Sown October–November in deep pots, overwintered in a cold frame, planted out in March: flowers from May, longer and on longer stems.' },
      sowIndoor: [[10, 11]],
      plantOut: [[3, 3]],
      transplantAfter: 130,
      daysToHarvest: [200, 270],
      season: 280,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 200]],
    },
  ],
  calendula: [
    {
      id: 'spring',
      name: { fr: 'Souci – semis de printemps', en: 'Pot marigold – spring sowing' },
      note: { fr: 'Semé de mars à mai, fleurit de juin aux gelées.', en: 'Sown March to May, flowers from June until frost.' },
      sowOutdoor: [[3, 5]],
      daysToHarvest: [55, 170],
      season: 190,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 55]],
    },
    {
      id: 'autumn',
      name: { fr: 'Souci – semis d’automne', en: 'Pot marigold – autumn sowing' },
      note: { fr: 'Semé en septembre, il passe l’hiver et fleurit dès avril.', en: 'Sown in September, it overwinters and flowers from April.' },
      sowOutdoor: [[9, 9]],
      daysToHarvest: [190, 280],
      season: 300,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 190]],
    },
  ],
  cornflower: [
    {
      id: 'spring',
      name: { fr: 'Bleuet – semis de printemps', en: 'Cornflower – spring sowing' },
      note: { fr: 'Semé de mars à mai, floraison en été.', en: 'Sown March to May, flowers in summer.' },
      sowOutdoor: [[3, 5]],
      daysToHarvest: [65, 120],
      season: 140,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 65]],
    },
    {
      id: 'autumn',
      name: { fr: 'Bleuet – semis d’automne', en: 'Cornflower – autumn sowing' },
      note: { fr: 'Semé en septembre-octobre : plantes plus fortes, floraison dès mai.', en: 'Sown September–October: sturdier plants, flowering from May.' },
      sowOutdoor: [[9, 10]],
      daysToHarvest: [210, 270],
      season: 290,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 210]],
    },
  ],
  nigella: [
    {
      id: 'spring',
      name: { fr: 'Nigelle – semis de printemps', en: 'Love-in-a-mist – spring sowing' },
      note: { fr: 'Semée de mars à mai, en place.', en: 'Sown March to May, in place.' },
      sowOutdoor: [[3, 5]],
      daysToHarvest: [75, 120],
      season: 150,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 75]],
    },
    {
      id: 'autumn',
      name: { fr: 'Nigelle – semis d’automne', en: 'Love-in-a-mist – autumn sowing' },
      note: { fr: 'Semée en septembre, elle fleurit plus tôt (mai-juin).', en: 'Sown in September, it flowers earlier (May–June).' },
      sowOutdoor: [[9, 9]],
      daysToHarvest: [230, 280],
      season: 300,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 230]],
    },
  ],
  pansy: [
    {
      id: 'winter',
      name: { fr: 'Pensée d’hiver', en: 'Winter pansy' },
      note: { fr: 'Semée en été, plantée en septembre-octobre : fleurit à l’automne, s’arrête par grand froid et repart au printemps.', en: 'Sown in summer, planted September–October: flowers in autumn, pauses in hard frost and restarts in spring.' },
      sowIndoor: [[6, 8]],
      plantOut: [[9, 10]],
      transplantAfter: 60,
      daysToHarvest: [100, 300],
      season: 320,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 100]],
    },
    {
      id: 'summer',
      name: { fr: 'Pensée d’été', en: 'Summer pansy' },
      note: { fr: 'Semée à l’abri en janvier-février, plantée en avril : fleurit de mai à juillet, craint la chaleur.', en: 'Sown under cover January–February, planted in April: flowers May to July, dislikes heat.' },
      sowIndoor: [[1, 2]],
      plantOut: [[4, 4]],
      transplantAfter: 70,
      daysToHarvest: [100, 170],
      season: 180,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 100]],
    },
  ],
  dahlia: [
    {
      id: 'tubers',
      name: { fr: 'Dahlia – tubercules', en: 'Dahlia – tubers' },
      examples: 'Café au lait, Bishop of Llandaff, dahlias cactus et pompons',
      note: { fr: 'Tubercules plantés en avril-mai, floraison de juillet aux gelées ; la variété est conservée à l’identique.', en: 'Tubers planted April–May, flowers July until frost; the variety stays true.' },
      plantOut: [[4, 5]],
      daysToHarvest: [80, 170],
      season: 180,
      stages: [['vegetative', 0], ['flowering', 80]],
    },
    {
      id: 'seed',
      name: { fr: 'Dahlia – semis', en: 'Dahlia – from seed' },
      examples: 'Dahlias nains « Figaro », simples « Bishop’s Children »',
      note: { fr: 'Semé à l’abri en mars-avril, fleurit dès la première année ; chaque plant est différent.', en: 'Sown under cover March–April, flowers the first year; each plant is different.' },
      sowIndoor: [[3, 4]],
      plantOut: [[5, 5]],
      transplantAfter: 45,
      daysToHarvest: [100, 180],
      season: 190,
      stages: [['germination', 0], ['vegetative', 10], ['flowering', 100]],
    },
  ],
  lily: [
    {
      id: 'autumn',
      name: { fr: 'Lys – plantation d’automne', en: 'Lily – autumn planting' },
      note: { fr: 'Bulbes plantés en octobre-novembre : meilleur enracinement, floraison en juin-juillet.', en: 'Bulbs planted October–November: better rooting, flowers June–July.' },
      plantOut: [[10, 11]],
      daysToHarvest: [230, 270],
      season: 290,
      stages: [['vegetative', 0], ['flowering', 230]],
    },
    {
      id: 'spring',
      name: { fr: 'Lys – plantation de printemps', en: 'Lily – spring planting' },
      note: { fr: 'Bulbes plantés en mars-avril, floraison en juillet-août.', en: 'Bulbs planted March–April, flowers July–August.' },
      plantOut: [[3, 4]],
      daysToHarvest: [100, 140],
      season: 160,
      stages: [['vegetative', 0], ['flowering', 100]],
    },
  ],
};

export function typesOf(speciesId: string): SpeciesType[] {
  return SPECIES_TYPES[speciesId] ?? [];
}

export function typeOf(speciesId: string, typeId?: string): SpeciesType | undefined {
  return typeId ? typesOf(speciesId).find((t) => t.id === typeId) : undefined;
}

const merged = new Map<string, Species>();

/**
 * L'espèce avec le calendrier et la durée de culture de son type. Sans type
 * (ou type inconnu), l'espèce telle quelle, qui couvre tous ses types.
 */
export function speciesWithType(sp: Species, typeId?: string): Species {
  const t = typeOf(sp.id, typeId);
  if (!t) return sp;
  const key = `${sp.id}:${t.id}`;
  let m = merged.get(key);
  if (!m) {
    m = {
      ...sp,
      typeId: t.id,
      sowIndoor: t.sowIndoor,
      sowOutdoor: t.sowOutdoor,
      plantOut: t.plantOut,
      transplantAfter: t.transplantAfter ?? sp.transplantAfter,
      daysToHarvest: t.daysToHarvest,
      season: t.season,
      stages: t.stages,
    };
    merged.set(key, m);
  }
  return m;
}

/** Raccourci : l'espèce d'une culture, avec son type. */
export function plantSpecies(p: { speciesId: string; typeId?: string }): Species | undefined {
  const sp = SPECIES_BY_ID[p.speciesId];
  return sp ? speciesWithType(sp, p.typeId) : undefined;
}
