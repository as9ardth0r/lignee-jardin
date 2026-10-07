/**
 * Travaux de saison au potager, mois par mois (repère : moitié nord de la
 * France ; avancer de 2 à 3 semaines en climat doux, retarder en montagne).
 */
type T = { fr: string; en: string };

export const MONTH_WORKS: Record<number, T[]> = {
  1: [
    { fr: 'Commander les graines et faire l’inventaire du stock (test de germination des vieux lots).', en: 'Order seeds and take stock (germination test for old lots).' },
    { fr: 'Tailler pommiers et poiriers hors gel ; nettoyer et affûter les outils.', en: 'Prune apples and pears outside frosts; clean and sharpen tools.' },
    { fr: 'Étaler du compost mûr sur les planches libres ; laisser le paillis en place.', en: 'Spread mature compost on empty beds; leave mulch in place.' },
  ],
  2: [
    { fr: 'Premiers semis au chaud : piments, poivrons, aubergines (lumière forte indispensable).', en: 'First warm sowings: chillies, peppers, aubergines (strong light essential).' },
    { fr: 'Planter ail, échalotes et petits fruits si le sol n’est pas détrempé.', en: 'Plant garlic, shallots and soft fruit if the soil is not waterlogged.' },
    { fr: 'Traitement d’hiver des pêchers contre la cloque (bouillie bordelaise) au gonflement des bourgeons.', en: 'Winter spray of peaches against leaf curl (copper) as buds swell.' },
  ],
  3: [
    { fr: 'Semer tomates à l’abri ; en pleine terre : radis, épinards, pois, fèves, carottes hâtives.', en: 'Sow tomatoes under cover; outdoors: radishes, spinach, peas, broad beans, early carrots.' },
    { fr: 'Planter pommes de terre primeur sous voile, oignons et échalotes.', en: 'Plant early potatoes under fleece, onion and shallot sets.' },
    { fr: 'Ameublir le sol sans retourner, désherber avant la levée des adventices.', en: 'Loosen the soil without turning it, weed before weeds take off.' },
  ],
  4: [
    { fr: 'Semer courges, courgettes et concombres en godets au chaud ; carottes, betteraves, salades dehors.', en: 'Sow squash, courgettes and cucumbers in warm pots; carrots, beetroot, lettuces outdoors.' },
    { fr: 'Repiquer les jeunes plants, commencer l’endurcissement.', en: 'Prick out seedlings, start hardening off.' },
    { fr: 'Surveiller les gelées tardives : voile prêt pour les fruitiers en fleurs.', en: 'Watch for late frosts: fleece ready for blossoming fruit trees.' },
  ],
  5: [
    { fr: 'Après les Saints de glace : planter tomates, courges, haricots, basilic.', en: 'After mid-May frosts: plant out tomatoes, squash, beans, basil.' },
    { fr: 'Pailler dès que le sol est réchauffé ; installer tuteurs et arrosage.', en: 'Mulch once the soil has warmed; set up stakes and watering.' },
    { fr: 'Semer engrais verts d’été sur les planches libres (phacélie, sarrasin).', en: 'Sow summer green manures on empty beds (phacelia, buckwheat).' },
  ],
  6: [
    { fr: 'Arroser au pied, le matin, et pailler pour limiter l’évaporation.', en: 'Water at the base, in the morning, and mulch to limit evaporation.' },
    { fr: 'Ébourgeonner les tomates, palisser, surveiller le mildiou après les orages.', en: 'Side-shoot tomatoes, tie in, watch for blight after storms.' },
    { fr: 'Semer carottes et poireaux d’hiver, chicorées, choux de printemps suivant.', en: 'Sow winter carrots and leeks, chicories, cabbages for next spring.' },
  ],
  7: [
    { fr: 'Récolter régulièrement (courgettes, haricots) pour que ça continue à produire.', en: 'Pick regularly (courgettes, beans) to keep plants producing.' },
    { fr: 'Arroser copieusement et moins souvent ; ombrer les semis.', en: 'Water deeply and less often; shade seedlings.' },
    { fr: 'Récolter et sécher ail et échalotes ; semer navets et radis d’automne.', en: 'Lift and dry garlic and shallots; sow turnips and autumn radishes.' },
  ],
  8: [
    { fr: 'Garder les graines des plus beaux plants (tomates, haricots, laitues montées).', en: 'Save seed from the best plants (tomatoes, beans, bolted lettuces).' },
    { fr: 'Semer mâche, épinards, oignons blancs et engrais verts d’automne.', en: 'Sow lamb’s lettuce, spinach, salad onions and autumn green manures.' },
    { fr: 'Tailler les framboisiers après récolte ; prendre des boutures.', en: 'Prune raspberries after picking; take cuttings.' },
  ],
  9: [
    { fr: 'Récolter courges avant les pluies, faire mûrir au sec ; conserver les récoltes.', en: 'Harvest squash before the rains, cure them dry; store crops.' },
    { fr: 'Semer engrais verts (seigle, vesce, moutarde) sur les planches libérées.', en: 'Sow green manures (rye, vetch, mustard) on cleared beds.' },
    { fr: 'Planter fraisiers et bulbes de printemps ; diviser les vivaces.', en: 'Plant strawberries and spring bulbs; divide perennials.' },
  ],
  10: [
    { fr: 'Planter ail d’automne et échalotes grises ; rentrer les agrumes et plantes gélives.', en: 'Plant autumn garlic and grey shallots; bring in citrus and tender plants.' },
    { fr: 'Ramasser les feuilles mortes pour le paillis et le terreau de feuilles.', en: 'Collect fallen leaves for mulch and leaf mould.' },
    { fr: 'Nettoyer les planches finies sans laisser le sol nu (paillis, engrais vert).', en: 'Clear finished beds without leaving soil bare (mulch, green manure).' },
  ],
  11: [
    { fr: 'Planter arbres fruitiers et haies à racines nues (Sainte-Catherine).', en: 'Plant bare-root fruit trees and hedges.' },
    { fr: 'Protéger artichauts et plantes fragiles (paillis épais, voile).', en: 'Protect artichokes and tender plants (thick mulch, fleece).' },
    { fr: 'Retourner le compost ; récolter poireaux, choux et racines au fil des besoins.', en: 'Turn the compost; harvest leeks, cabbages and roots as needed.' },
  ],
  12: [
    { fr: 'Faire le bilan de la saison et préparer le plan de rotation.', en: 'Review the season and prepare the rotation plan.' },
    { fr: 'Vérifier les récoltes stockées et les graines (au sec et au frais).', en: 'Check stored crops and seeds (dry and cool).' },
    { fr: 'Pailler les planches nues ; planter fruitiers par temps doux.', en: 'Mulch bare beds; plant fruit trees in mild spells.' },
  ],
};
