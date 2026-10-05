/**
 * Variétés de fleurs courantes du commerce (surtout bulbes), avec leur
 * couleur, leur groupe et leur époque de floraison. Choisies parmi des
 * classiques largement diffusés ; les dates sont celles de la région
 * parisienne et se décalent avec le climat.
 */
import type { Txt } from '../model';
import type { FlowerColor } from './flowers';

export interface CatalogVariety {
  name: string;
  colors: FlowerColor[];
  /** Groupe, époque de floraison, hauteur, particularité. */
  note: Txt;
}

const v = (name: string, colors: FlowerColor[], fr: string, en: string): CatalogVariety => ({ name, colors, note: { fr, en } });

export const FLOWER_VARIETIES: Record<string, CatalogVariety[]> = {
  tulip: [
    v('Apricot Beauty', ['orange', 'pink'], 'Simple hâtive, abricot rosé, début avril, 40 cm.', 'Single early, apricot-pink, early April, 40 cm.'),
    v('Purissima', ['white'], 'Fosteriana, blanc crème, début avril, 40 cm ; refleurit bien.', 'Fosteriana, creamy white, early April, 40 cm; reliable perennial.'),
    v('Strong Gold', ['yellow'], 'Triomphe, jaune d’or, mi-avril, 45 cm.', 'Triumph, golden yellow, mid-April, 45 cm.'),
    v('Negrita', ['purple'], 'Triomphe, pourpre, fin avril, 45 cm.', 'Triumph, purple, late April, 45 cm.'),
    v('Apeldoorn', ['red'], 'Darwin hybride, rouge vif, fin avril, 55 cm ; refleurit plusieurs années.', 'Darwin hybrid, bright red, late April, 55 cm; flowers again for years.'),
    v('Pink Impression', ['pink'], 'Darwin hybride, rose soutenu, fin avril, 55 cm.', 'Darwin hybrid, deep pink, late April, 55 cm.'),
    v('Ballerina', ['orange'], 'Fleur de lys, orange, parfumée, mai, 55 cm.', 'Lily-flowered, orange, scented, May, 55 cm.'),
    v('White Triumphator', ['white'], 'Fleur de lys, blanc pur, mai, 60 cm.', 'Lily-flowered, pure white, May, 60 cm.'),
    v('Queen of Night', ['purple'], 'Simple tardive, pourpre presque noir, mai, 60 cm.', 'Single late, near-black purple, May, 60 cm.'),
    v('Angélique', ['pink'], 'Double tardive (fleur de pivoine), rose pâle, mai, 40 cm.', 'Double late (peony-flowered), pale pink, May, 40 cm.'),
    v('Black Parrot', ['purple'], 'Perroquet, pourpre noir aux pétales frangés, mai, 50 cm.', 'Parrot, black-purple with fringed petals, May, 50 cm.'),
    v('Tulipa tarda', ['yellow', 'white'], 'Botanique, étoiles jaunes bordées de blanc, avril, 10 cm ; se naturalise.', 'Species tulip, yellow stars tipped white, April, 10 cm; naturalises.'),
  ],
  hyacinth: [
    v('Delft Blue', ['blue'], 'Bleu porcelaine, mars-avril, 25 cm, très parfumée.', 'Porcelain blue, March–April, 25 cm, very fragrant.'),
    v('Blue Jacket', ['blue'], 'Bleu marine, mars-avril, 25 cm.', 'Navy blue, March–April, 25 cm.'),
    v('Pink Pearl', ['pink'], 'Rose vif, mars-avril, 25 cm.', 'Bright pink, March–April, 25 cm.'),
    v('Carnegie', ['white'], 'Blanc pur, avril, 25 cm.', 'Pure white, April, 25 cm.'),
    v('Jan Bos', ['red'], 'Rouge framboise, mars-avril, 25 cm.', 'Raspberry red, March–April, 25 cm.'),
    v('Gipsy Queen', ['orange', 'pink'], 'Saumon abricot, avril, 25 cm.', 'Salmon apricot, April, 25 cm.'),
    v('Woodstock', ['purple'], 'Pourpre bordeaux, avril, 25 cm.', 'Beetroot purple, April, 25 cm.'),
    v('City of Haarlem', ['yellow'], 'Jaune primevère, avril, 25 cm.', 'Primrose yellow, April, 25 cm.'),
  ],
  daffodil: [
    v('Tête-à-Tête', ['yellow'], 'Nain, jaune, février-mars, 15 cm ; idéal en pot.', 'Dwarf, yellow, February–March, 15 cm; ideal in pots.'),
    v('February Gold', ['yellow'], 'Cyclamineus, jaune, février-mars, 30 cm ; se naturalise.', 'Cyclamineus, yellow, February–March, 30 cm; naturalises.'),
    v('Jetfire', ['yellow', 'orange'], 'Cyclamineus, jaune à trompette orange, mars, 25 cm.', 'Cyclamineus, yellow with orange trumpet, March, 25 cm.'),
    v('Carlton', ['yellow'], 'Grande couronne, jaune, mars-avril, 45 cm.', 'Large-cupped, yellow, March–April, 45 cm.'),
    v('Ice Follies', ['white', 'yellow'], 'Grande couronne, blanc à coupe jaune pâle, mars-avril, 40 cm.', 'Large-cupped, white with pale yellow cup, March–April, 40 cm.'),
    v('Mount Hood', ['white'], 'Trompette, blanc ivoire, avril, 45 cm.', 'Trumpet, ivory white, April, 45 cm.'),
    v('Thalia', ['white'], 'Triandrus, blanc pur, 2 à 3 fleurs par tige, avril, 35 cm.', 'Triandrus, pure white, 2–3 flowers per stem, April, 35 cm.'),
    v('Geranium', ['white', 'orange'], 'Tazetta, blanc à petite coupe orange, très parfumé, avril, 40 cm.', 'Tazetta, white with small orange cup, very fragrant, April, 40 cm.'),
    v('Actaea', ['white', 'red'], 'Poeticus, blanc à œil cerclé de rouge, parfumé, fin avril-mai, 45 cm.', 'Poeticus, white with red-rimmed eye, fragrant, late April–May, 45 cm.'),
  ],
  crocus: [
    v('Ruby Giant', ['purple'], 'C. tommasinianus, violet rubis, février, 8 cm ; se naturalise dans la pelouse.', 'C. tommasinianus, ruby purple, February, 8 cm; naturalises in lawns.'),
    v('Golden Yellow', ['yellow'], 'Jaune d’or, février-mars, 10 cm.', 'Golden yellow, February–March, 10 cm.'),
    v('Jeanne d’Arc', ['white'], 'Blanc pur, mars, 12 cm.', 'Pure white, March, 12 cm.'),
    v('Pickwick', ['purple', 'white'], 'Rayé lilas et blanc, mars, 12 cm.', 'Striped lilac and white, March, 12 cm.'),
    v('Flower Record', ['purple'], 'Violet profond, mars, 12 cm.', 'Deep violet, March, 12 cm.'),
  ],
  muscari: [
    v('Muscari armeniacum', ['blue'], 'Bleu vif, mars-avril, 15 cm ; tapis sous les arbres.', 'Bright blue, March–April, 15 cm; carpets under trees.'),
    v('Valerie Finnis', ['blue'], 'Bleu ciel, avril, 15 cm.', 'Sky blue, April, 15 cm.'),
    v('Muscari botryoides Album', ['white'], 'Blanc, avril, 15 cm.', 'White, April, 15 cm.'),
    v('Muscari latifolium', ['blue', 'purple'], 'Bicolore bleu nuit et bleu clair, avril, 20 cm.', 'Two-tone, navy and light blue, April, 20 cm.'),
  ],
  ornamentalallium: [
    v('Purple Sensation', ['purple'], 'A. hollandicum, boules violettes, mai, 70 cm.', 'A. hollandicum, purple globes, May, 70 cm.'),
    v('Allium giganteum', ['purple'], 'Grosses boules violettes, juin, 120 cm.', 'Big purple globes, June, 120 cm.'),
    v('Mount Everest', ['white'], 'Boules blanches, juin, 100 cm.', 'White globes, June, 100 cm.'),
    v('Allium cristophii', ['purple'], 'Étoile de Perse, grosses sphères violet métallique, juin, 50 cm ; superbe sec.', 'Star of Persia, large metallic-violet spheres, June, 50 cm; great dried.'),
    v('Allium sphaerocephalon', ['purple', 'red'], 'Petites têtes ovales pourpres, juillet, 60 cm ; adoré des abeilles.', 'Small oval purple heads, July, 60 cm; loved by bees.'),
  ],
  dahlia: [
    v('Café au Lait', ['white', 'pink'], 'Décoratif géant, crème rosé, août-octobre, 120 cm.', 'Giant decorative, blush cream, August–October, 120 cm.'),
    v('Bishop of Llandaff', ['red'], 'Simple, rouge écarlate, feuillage pourpre, juillet-octobre, 90 cm ; mellifère.', 'Single, scarlet, purple foliage, July–October, 90 cm; good for bees.'),
    v('David Howard', ['orange'], 'Décoratif, orange, feuillage bronze, juillet-octobre, 90 cm.', 'Decorative, orange, bronze foliage, July–October, 90 cm.'),
    v('Arabian Night', ['red', 'purple'], 'Décoratif, bordeaux presque noir, juillet-octobre, 100 cm.', 'Decorative, near-black burgundy, July–October, 100 cm.'),
    v('Nuit d’Été', ['red', 'purple'], 'Semi-cactus, pourpre noir, juillet-octobre, 110 cm.', 'Semi-cactus, black-red, July–October, 110 cm.'),
    v('Wizard of Oz', ['pink'], 'Pompon, rose pâle, juillet-octobre, 100 cm.', 'Pompon, pale pink, July–October, 100 cm.'),
  ],
  gladiolus: [
    v('Gladiolus communis subsp. byzantinus', ['purple', 'pink'], 'Magenta, juin, 60 cm ; rustique, reste en terre.', 'Magenta, June, 60 cm; hardy, stays in the ground.'),
    v('Priscilla', ['white', 'pink'], 'Blanc bordé de rose, juillet-août, 100 cm.', 'White edged pink, July–August, 100 cm.'),
    v('Green Star', ['yellow'], 'Vert anis, juillet-août, 100 cm.', 'Lime green, July–August, 100 cm.'),
    v('Nova Lux', ['yellow'], 'Jaune vif, juillet-août, 100 cm.', 'Bright yellow, July–August, 100 cm.'),
  ],
  lily: [
    v('Lilium regale', ['white'], 'Lis royal, blanc à revers pourpré, très parfumé, juillet, 120 cm.', 'Regal lily, white flushed purple outside, very fragrant, July, 120 cm.'),
    v('Lilium candidum', ['white'], 'Lis de la Madone, blanc pur, parfumé, juin, 100 cm ; planter au ras du sol en août.', 'Madonna lily, pure white, fragrant, June, 100 cm; plant at soil level in August.'),
    v('Lilium martagon', ['pink', 'purple'], 'Martagon, rose pourpré en turban, juin, 120 cm ; mi-ombre, se naturalise.', 'Martagon, purplish-pink turk’s caps, June, 120 cm; part shade, naturalises.'),
    v('Stargazer', ['pink'], 'Oriental, rose taché de pourpre, parfumé, juillet-août, 90 cm.', 'Oriental, pink spotted crimson, fragrant, July–August, 90 cm.'),
    v('Casa Blanca', ['white'], 'Oriental, blanc pur, très parfumé, août, 100 cm.', 'Oriental, pure white, very fragrant, August, 100 cm.'),
  ],
  snowdrop: [
    v('Galanthus nivalis', ['white'], 'Perce-neige commun, février, 10 cm ; se naturalise.', 'Common snowdrop, February, 10 cm; naturalises.'),
    v('Flore Pleno', ['white'], 'Fleurs doubles, février, 10 cm.', 'Double flowers, February, 10 cm.'),
    v('Galanthus elwesii', ['white'], 'Grand perce-neige, janvier-février, 20 cm.', 'Giant snowdrop, January–February, 20 cm.'),
  ],
  poppyanemone: [
    v('De Caen (mélange)', ['red', 'blue', 'purple', 'pink', 'white'], 'Simples, toutes couleurs, avril-juin selon la plantation, 30 cm.', 'Single, mixed colours, April–June depending on planting, 30 cm.'),
    v('Mr Fokker', ['blue', 'purple'], 'Bleu violet, 30 cm.', 'Violet blue, 30 cm.'),
    v('The Bride', ['white'], 'Blanc pur, 30 cm.', 'Pure white, 30 cm.'),
    v('Sylphide', ['pink', 'purple'], 'Rose mauve, 30 cm.', 'Mauve pink, 30 cm.'),
    v('Hollandia', ['red'], 'Rouge écarlate, 30 cm.', 'Scarlet red, 30 cm.'),
  ],
  ranunculus: [v('Tecolote (mélange)', ['red', 'orange', 'yellow', 'pink', 'white'], 'Fleurs très doubles, mai-juin, 40 cm ; griffes à tremper avant plantation.', 'Very double flowers, May–June, 40 cm; soak the claws before planting.')],
  fritillary: [
    v('Fritillaria meleagris', ['purple'], 'Clochettes en damier pourpre, avril, 25 cm ; sol frais.', 'Purple chequered bells, April, 25 cm; moist soil.'),
    v('Alba', ['white'], 'Clochettes blanches, avril, 25 cm.', 'White bells, April, 25 cm.'),
  ],
  crownimperial: [
    v('Rubra Maxima', ['orange', 'red'], 'Orange rouge, avril, 100 cm.', 'Orange-red, April, 100 cm.'),
    v('Lutea', ['yellow'], 'Jaune, avril, 90 cm.', 'Yellow, April, 90 cm.'),
  ],
  crocosmia: [
    v('Lucifer', ['red'], 'Rouge vif, juillet-août, 100 cm.', 'Bright red, July–August, 100 cm.'),
    v('Emily McKenzie', ['orange'], 'Orange à cœur acajou, août-septembre, 60 cm.', 'Orange with mahogany centre, August–September, 60 cm.'),
  ],
  colchicum: [
    v('Colchicum autumnale', ['pink'], 'Rose lilas, septembre, 15 cm.', 'Lilac pink, September, 15 cm.'),
    v('Waterlily', ['pink', 'purple'], 'Double, rose lilas, septembre-octobre, 15 cm.', 'Double, lilac pink, September–October, 15 cm.'),
  ],
  irisreticulata: [
    v('Harmony', ['blue'], 'Bleu roi taché de jaune, février-mars, 10 cm.', 'Royal blue marked yellow, February–March, 10 cm.'),
    v('Iris danfordiae', ['yellow'], 'Jaune citron, février, 10 cm.', 'Lemon yellow, February, 10 cm.'),
  ],
  anemoneblanda: [
    v('Blue Shades', ['blue'], 'Bleu, mars-avril, 12 cm.', 'Blue, March–April, 12 cm.'),
    v('White Splendour', ['white'], 'Blanc, mars-avril, 12 cm.', 'White, March–April, 12 cm.'),
  ],
};
