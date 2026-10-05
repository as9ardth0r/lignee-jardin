# Lignée · Jardin

**Le carnet de bord du potager** — phases 1 à 5 d'une application de suivi du
jardin pour jardiniers confirmés et semi-pros : chaque plante, chaque
planche et chaque apport suivis, avec des conseils d'eau et d'engrais
chiffrés mais honnêtes sur leurs marges d'erreur. Application web
autonome (React + TypeScript, PWA installable, APK Android via
Capacitor), **hors-ligne d'abord**, sans compte ni serveur : les données
vivent dans IndexedDB sur l'appareil. Seule exception, facultative : la
météo locale (coordonnées arrondies à ~1 km envoyées à Open-Meteo).
Application sœur des apps *Lignée* de sélection (tomate, carotte, pois…),
dont elle importe les variétés fixées.

> **Ordres de grandeur.** Besoins NPK, rendements, coefficients culturaux,
> réserve utile des sols, calendriers et climats sont compilés à la main
> (FAO-56, guides de fertilisation, pratiques courantes) : ce sont des
> repères à confronter à vos observations, affichés avec une fourchette
> et un « pourquoi » dépliable. Sans analyse de sol, l'app le dit.

## Ce que fait la phase 1

- **Onboarding en cinq questions** : climat (cinq climats français de
  référence), type de jardin, pratiques culturales (classique, sol
  vivant, permaculture, bio, hors-sol — elles filtrent les produits
  proposés), texture du sol (avec le test du boudin) et pH, arrosage et
  pluviomètre. Jardin vide ou jardin d'exemple.
- **Aujourd'hui** : tâches générées par des règles (semis et plantations
  prévus, repiquage, arrosage, fertilisation au bon stade, fenêtre de
  récolte, rappel d'observation, gelées tardives) + tâches libres ;
  « fait » et « reporter » mémorisés par clé stable, nombre affiché
  plafonné. Jauges d'eau des planches, cultures en cours.
- **Plan du jardin** : planches, pots et serres déplaçables au doigt
  (pas de 10 cm), quadrillage d'un mètre, paillage et goutte-à-goutte.
- **Cultures** : espèce, variété (libre ou importée), planche, nombre de
  pieds ou surface, semis à l'abri puis repiquage, dates prévues ;
  alerte de rotation (même famille trop tôt) et de période hors saison
  pour le climat ; frise des stades avec la fenêtre de récolte.
- **Journal** : observations datées avec photos (compressées en WebP sur
  l'appareil, position GPS retirée), hauteur, fleurs/fruits, récolte,
  état sanitaire.
- **Nutrition** : besoins de la saison (exportations × récolte attendue,
  ± 25 %), répartition par stade selon le type de culture, apports déjà
  faits (azote organique compté à sa part disponible l'année de
  l'apport, apports de planche partagés au prorata des surfaces), dose
  conseillée en g et g/m² pour le produit choisi (avec alerte d'excès),
  produit le mieux adapté proposé, légumineuses à part.
- **Eau** : bilan hydrique quotidien par planche (FAO-56 simplifié :
  Kc × ET₀ du climat, paillage, pluie notée ou moyenne, arrosages),
  réserve utile selon la texture et la profondeur des racines, conseil
  « arroser ou non » plafonné à 20 L/m² par arrosage, courbe des 30
  derniers jours avec lecture au survol.
- **Catalogue** : 42 espèces (légumes, aromatiques, fraisier, rhubarbe)
  avec calendrier décalé selon le climat, stades, Kc, exportations,
  rotation, conseils.
- **Réglages** : sauvegarde complète JSON (photos comprises) et
  restauration, exports CSV (cultures, journal, registre des apports),
  import des « Mes lignées » des apps Lignée, mode terrain (texte plus
  grand, cibles de 48 px), FR/EN.

## Ce qu'ajoute la phase 2

- **Lieu et météo locale** (Open-Meteo, sans clé) : position de
  l'appareil, recherche de commune ou coordonnées ; climat de référence
  suggéré d'après la latitude, la longitude et l'altitude. 92 jours
  passés + 10 jours de prévisions mis en cache (500 jours gardés),
  actualisés à l'ouverture, toutes les heures et au retour du réseau ;
  sans connexion, l'app retombe sur les normales du climat.
- **Alertes** gel, chaleur, rafales, fortes pluies sur aujourd'hui + 3
  jours, transformées en tâches seulement pour les cultures concernées
  (gel : cultures frileuses en pleine terre).
- **Eau** : ET₀ et pluie réelles quand la météo est active, **report de
  l'arrosage** si plus de 8 mm sont annoncés et que la réserve le
  permet, **durée de goutte-à-goutte** d'après le débit de la planche.
- **Degrés-jours** : chaque culture avance selon la chaleur reçue
  (base de l'espèce, plafond 30 °C ; semis abrité 22/15 °C, serre
  +4 °C), comparée à une culture de référence ; stades, fenêtre de
  récolte, Kc et besoins d'engrais en découlent. **Recalage** : noter un
  stade observé (1re fleur, 1re récolte…) corrige toutes les cultures de
  l'espèce (rapport de degrés-jours, moyenne géométrique bornée ×0,6–1,6).
- **Ensoleillement** : obstacles sur le plan (bâtiment, mur, arbre, haie,
  avec leur hauteur), orientation du plan, ombres portées au jour et à
  l'heure choisis, heures de soleil direct par planche (21 juin,
  équinoxes, moyenne avril–septembre) et exposition ; alerte quand une
  culture manque de soleil.
- **Diagnostic et lutte intégrée** : organe, 34 signes, conditions
  récentes (pré-remplies par la météo) → trois hypothèses classées parmi
  29 problèmes (carences, maladies, ravageurs, accidents), avec ce qui
  concorde, ce qui manque, quoi vérifier, seuil d'intervention et moyens
  d'action autorisés aux amateurs (méthodes d'abord ; produits de
  biocontrôle, faible risque, UAB ou PNPP seulement, « voir l'étiquette »
  pour dose et délai avant récolte). **Registre des interventions** par
  culture, export CSV.
- **Graines** : grainothèque (année, quantité, provenance), état d'après
  la durée de germination de l'espèce, test de germination et nombre de
  graines à semer ; conservation des semences (fécondation, distance
  d'isolement).
- **Voisinage** : 14 associations favorables ou déconseillées, avec le
  niveau de preuve (« tradition » ou « quelques études »), signalées à la
  plantation.
- **Bilan de saison** : récoltes pesées par espèce, rendement au m²,
  valeur au prix de détail (modifiable), coût des intrants.

## Ce qu'ajoute la phase 3

- **Notifications locales** (plugin Capacitor, aucun serveur) : résumé
  du matin à l'heure choisie s'il y a quelque chose à faire, alerte la
  veille à 18 h pour un gel ou un épisode sévère, rappel de sauvegarde
  si la dernière date de plus de 30 jours ; plafond quotidien (alertes
  d'abord). Reprogrammées à chaque changement, trois jours d'avance.
  Dans un navigateur : seulement tant que l'app est ouverte.
- **Plusieurs jardins** sur l'appareil (sélecteur en haut de l'écran),
  chacun avec ses données et ses photos ; le jardin d'origine est repris
  tel quel.
- **Jardin partagé sans serveur** : chaque fiche est datée et signée
  (prénom) à chaque modification, les suppressions laissent une trace ;
  on s'envoie le fichier du jardin et on le fusionne fiche par fiche
  (la plus récente gagne, suppressions comprises, relevés additionnés,
  photos manquantes ajoutées, réglages locaux conservés).
- **Capteurs** : humidité et température du sol, température et
  humidité de l'air, EC, pH ; saisie à la main, import CSV de
  n'importe quel enregistreur (séparateur, virgule décimale, en-tête et
  colonne détectés). Une sonde d'humidité
  (étalonnable sol sec / sol ressuyé) **recale le bilan hydrique** de sa
  planche.
- **Bacs hydroponiques** : nouveau type de planche, plages EC/pH par
  culture (plage commune quand plusieurs cultures partagent un bac),
  tâches « EC trop haute / pH trop bas » et renouvellement de la
  solution tous les 14 jours.
- **Mode pro** : récoltes à venir par culture et par mois (rendement
  visé × surface − déjà pesé, réparti sur la fenêtre prévue par
  degrés-jours), **rapport de saison en PDF** (synthèse, récoltes,
  prévisions, apports, interventions sanitaires) et **bilan pluriannuel**
  en tableur.
- **Exports dans l'APK** : la WebView Android ne télécharge pas ; les
  fichiers (sauvegarde, CSV, PDF) passent par le partage Android
  (Drive, e-mail, « Enregistrer dans Fichiers »). Les CSV utilisent le
  point-virgule et la virgule décimale (tableurs en français).

## Ce qu'ajoute la phase 4 (agronomie)

- **Analyse de sol** (par planche ou pour tout le jardin) : pH, matière
  organique, P₂O₅ (Olsen, Joret-Hébert ou Dyer), K₂O, MgO, CEC
  (estimée d'après l'argile et la MO si absente). Niveaux faible /
  satisfaisant / élevé / très élevé, **correction des doses** de P et K
  (×1,5, ×1, ×0,5, impasse) et **crédit d'azote** du sol (≈ 4 g N/m²
  par an et par point de MO, plafonné à 70 % du besoin) dans le module
  nutrition.
- **Chaulage** : CaO à apporter pour atteindre pH 6,5 (≈ 18 g/m² par
  unité de pH et par point de CEC), 200 g CaO/m² au plus par apport,
  dolomie si la magnésie est basse, déduction des amendements déjà
  notés, tâche d'octobre à mars ; cultures hors de leur plage de pH.
- **Planificateur de saison** : liste d'envies (espèce, surface, semis
  échelonnés), proposition planche par planche avec ses raisons et ses
  avertissements (rotation, gourmande après légumineuse, soleil, serre
  pour les cultures de chaleur, voisinage, pH), cultures dérobées
  rapides avant une plantation tardive, dates calées sur le calendrier
  du climat (semis à l'abri calé en arrière de la mise en place),
  calendrier des gestes, puis ajout au jardin en cultures prévues.
- **Courbe de croissance** : hauteurs du journal comparées à une courbe
  en S sur l'âge en degrés-jours (hauteurs adultes de référence par
  espèce), « en avance / dans la norme / en retard » ; récolte cumulée
  comparée à la récolte attendue sur la fenêtre prévue.
- **Comptages de ravageurs** (pucerons, aleurodes, acariens, thrips,
  altises, limaces, chenilles, doryphores) avec seuils indicatifs,
  tendance et **auxiliaires vus** : intervenir, attendre que les
  auxiliaires travaillent, ou recompter dans 5 jours (tâches).
- **Lecture Ecowitt retirée**, et avec elle l'autorisation du HTTP en
  clair dans l'APK ; les capteurs créés avec deviennent des capteurs à
  saisie manuelle.

## Ce qu'ajoute la phase 5

- **Stocks** (Catalogue → Stocks) : engrais et amendements du catalogue,
  terreaux, matériel ; quantité au dernier inventaire, les apports notés
  depuis sont **déduits automatiquement** (g ou mL convertis dans
  l'unité de l'article), seuil de rachat, prix. Le module nutrition
  affiche le stock du produit conseillé.
- **Graines comptées** : un lot peut porter son nombre de graines ; une
  culture semée avec ce lot en consomme (plants ÷ taux de germination),
  les cultures prévues sont réservées ; le meilleur lot est proposé à la
  création d'une culture.
- **Liste de courses** : stocks sous leur seuil, graines manquantes,
  trop vieilles ou insuffisantes et plants ou bulbes pour les cultures
  prévues des 4 prochains mois, produit du chaulage conseillé, plus des
  lignes libres ; partage ou copie en texte.
- **Notes vocales** dans le journal (micro de l'appareil, 2 minutes au
  plus, trois par observation), rangées avec les photos : sauvegarde,
  fusion et suppression comprises. L'APK demande la permission
  « micro » seulement au premier enregistrement.

Pas fait (hors du cahier des charges réalisable ici) : synchronisation
automatique par serveur (hébergement et cadre RGPD), capteurs
Bluetooth, widget Android, transcription des notes vocales,
identification par photo (Pl@ntNet).

### Tests

```bash
npm test
```

Catalogue cohérent, dates (bissextiles, semaines), calendrier décalé par
climat, stades et fenêtre de récolte (variétés précoces), Kc par
segments, surfaces, besoins et répartition par stade, doses (azote
disponible, excès), partage des apports, produit conseillé, bilan
hydrique (sol nu, été sec, arrosage, paillage, serre, pluie moyenne),
tâches (semis, report, repiquage, arrosage, gelées, fertilisation
espacée, rappels plafonnés), rotation, sauvegarde et import Lignée, CSV.
Phase 2 : lecture et fusion de la météo, alertes, suggestion de climat,
degrés-jours et recalage, eau avec météo (report, goutte-à-goutte),
tâches d'alerte, position du soleil et ombres, diagnostic, graines,
bilan de saison.
Phase 3 : horodatage et fusion de jardins (idempotente, suppressions,
conflits), CSV de relevés, humidité du sol et bilan hydrique, bacs hydroponiques,
notifications (matin, veille de gel, sauvegarde, plafond), prévisions
et bilan pluriannuel.
Phase 4 : interprétation d'analyse, chaulage (dose, plafond, dolomie,
déduction), correction des besoins et crédit d'azote, planificateur
(rotation, légumineuse puis gourmande, serre, échelonnement, dérobée,
capacité), courbe de croissance et récolte cumulée, comptages de
ravageurs (seuil, tendance, auxiliaires, tâches).
Phase 5 : stocks (déduction des apports, unités, seuil, inventaire le
plus récent), graines restantes et réservées, lot conseillé, liste de
courses automatique, notes vocales dans la sauvegarde.
Types de culture : calendriers et durées cohérents, ail d'automne
récolté en juin-juillet et ail rose en juillet, type proposé selon la
saison, titre et sauvegarde.
Lune : phases sur des éclipses connues, déclinaison maximale de
l'arrêt lunaire de 2025, alternance montante / descendante (~13,7 j),
option désactivée par défaut.
Ateliers : 16 ateliers et cultures reconnues, « Mes lignées » ajoutées
au jardin sans doublon (stockage corrompu ignoré).

```bash
npm run test:ateliers
```

Lance les tests moteur d'origine de chacun des douze ateliers de
légumes et fruits (l'app cannabis d'origine n'avait pas de tests).

## Types de culture

Pour douze espèces, la période de semis ou de plantation dépend du
**type** : ail blanc ou violet (automne) / ail rose (printemps) ; oignon
de printemps (bulbilles ou semis) / oignon d'hiver (bulbilles ou semis) ;
échalote grise / de Jersey ; pois rond / ridé ; fève de printemps /
d'automne ; laitue de saison / d'hiver ; épinard de printemps /
d'automne ; chou d'été / d'automne / d'hiver ; poireau d'été / d'hiver ;
carotte primeur / de saison / de garde ; pomme de terre primeur / de
saison / de conservation ; radis de tous les mois / d'hiver
(`src/jardin/data/speciesTypes.ts`).

- La fiche d'espèce du catalogue montre chaque type avec son calendrier
  (décalé selon le climat), des exemples de variétés et un bouton
  « Cultiver ».
- En ajoutant une culture, le type de la saison est proposé d'office
  (l'ail d'automne en octobre, l'ail rose en février) ; il fixe les
  fenêtres, la durée, les stades, les degrés-jours, les tâches et les
  rappels de la culture. « Non précisé » garde le calendrier général de
  l'espèce.

## Légumes complémentaires

17 légumes s'ajoutent aux 42 de départ : vivaces du potager (artichaut,
asperge, oseille, raifort, topinambour), cardon, céleri branche, chou
chinois, pak-choï, pourpier, tétragone, pissenlit, physalis, gombo,
scorsonère, haricot d'Espagne et pois chiche. Les vivaces retrouvent
leur récolte chaque année (asperge : rien les deux premières années).

## Rotation et paillage

**Rotation** : dans l'onglet Jardin, « 🔄 Rotation des cultures » colore
chaque planche selon le groupe qui y a dominé l'année choisie
(solanacées, cucurbitacées, choux, légumineuses, alliums, ombellifères,
feuilles, vivaces, fleurs) et entoure de rouge les planches où une
famille revient trop tôt. La fiche de chaque planche montre son
historique sur 4 ans.

**Paillage et broyat** : dans la fiche d'une planche, notez chaque
couche (broyat d'herbe et de trèfle, tonte, foin, feuilles, paille,
broyat de branches, compost en surface) avec sa date et son épaisseur.
L'app estime l'azote et la potasse que la couche libère (rapide pour un
broyat vert riche en trèfle, presque nul pour la paille ou le bois), les
compte dans les apports des cultures de la planche et réduit
l'évaporation dans le calcul d'arrosage pendant un an.

## Ombres à l'heure du téléphone

Dans l'onglet Jardin, « ☀ Ombres » s'ouvre sur **Maintenant** : les
ombres des obstacles (maison, arbres, murs, haies) sont calculées pour la
date et l'heure du téléphone, mises à jour chaque minute. L'heure du
téléphone est convertie en heure solaire vraie au jardin (heure UTC +
longitude / 15 + équation du temps ; l'heure d'été est déjà comprise dans
l'horloge). Un petit soleil au bord du plan montre d'où viennent les
rayons, et la ligne sous le curseur donne sa hauteur et sa direction ; la
nuit, le plan s'assombrit. Les boutons 20 mars, 21 juin, 23 sept. et
21 déc. et le curseur (au quart d'heure) passent en mode manuel ; le
curseur affiche l'heure telle qu'elle serait au téléphone ce jour-là.
Sans localisation du jardin, la position de Paris est utilisée.

## Bilan de fin de saison

Cultures → « 🧺 Récoltes et bilan » :

- **Fleurs coupées** : une observation sur une fleur propose le champ
  « Tiges coupées » ; le bilan les totalise par espèce (par pied, par m²).
- **Résultats par planche** : poids récolté, kg/m², tiges, récolte comparée
  à l'attendu, heures de soleil, paillage, problèmes notés.
- **Ce qui a marché / à revoir** : chaque culture potagère terminée est
  comparée à son rendement attendu (≥ 90 % : réussie ; < 50 % ou jamais
  pesée : à revoir), avec des causes probables tirées du carnet :
  manque de soleil sur la planche (calculé sur le plan), rotation non
  respectée, problèmes sanitaires notés, récolte jamais pesée.
- **Rapport PDF de fin d'année** : synthèse, récoltes, fleurs coupées,
  résultats par planche, ce qui a marché et ce qui est à revoir, récoltes
  encore attendues, apports et interventions sanitaires.

## Toits à deux pans

Un bâtiment peut avoir un toit plat (bloc plein, comme avant) ou un toit à deux pans. On renseigne alors la hauteur sous gouttière, la hauteur au faîtage et le sens du faîtage (parallèle au grand côté ou au petit côté). Les heures de soleil des planches et l'ombre dessinée suivent la vraie forme du toit : l'ombre est plus courte côté gouttières et plus longue côté pignons. Le faîtage est tracé sur le plan.

## Version ordinateur synchronisée avec le téléphone

La version ordinateur est la même application, servie par votre PC, qui sert aussi de relais. Les modifications faites sur le PC arrivent sur le téléphone en quelques secondes, et inversement, dès que le téléphone est sur le même Wi-Fi. Il n'y a ni compte ni service en ligne : le jardin reste chez vous.

**Lancer la version ordinateur** (dans le dossier du projet, après `npm install`) :

```bash
npm run pc
```

Ouvrez ensuite http://localhost:8787 dans le navigateur du PC. Le terminal affiche l'adresse du PC sur le réseau et un code (par exemple `http://192.168.1.20:8787` et `K7QM-2XPA`). Ils sont aussi rappelés dans Réglages → « Synchronisation avec le PC » de la version ordinateur.

**Relier le téléphone** : dans l'app, ouvrez Réglages → « Synchronisation avec le PC », saisissez l'adresse et le code, puis touchez **Connecter**. C'est tout. Le jardin du téléphone part sur le PC, et un PC neuf adopte ce jardin avec ses réglages (taille du plan, lieu, climat).

**Fonctionnement**
- Chaque appareil garde une copie complète et fonctionne seul : sans Wi-Fi ou PC éteint, rien ne se perd, et l'échange reprend au retour.
- Les deux copies sont fusionnées fiche par fiche, et la modification la plus récente gagne. Si une même fiche est modifiée des deux côtés entre deux échanges, c'est la plus récente qui reste.
- Les réglages propres à l'appareil (notifications, auteur, connexion) ne sont pas échangés.
- Les photos et les notes vocales restent sur l'appareil où elles ont été prises.
- La copie de référence est enregistrée dans `~/.lignee-jardin/jardin.json`, et le code dans `~/.lignee-jardin/config.json`. Supprimez ce dernier pour obtenir un nouveau code.
- Le navigateur du PC n'a pas besoin du code. Tout autre appareil le doit.
- Pare-feu : autorisez le port 8787 (`sudo ufw allow 8787/tcp` si ufw est actif).
- Hors de la maison, un réseau privé comme Tailscale permet de garder la synchronisation : utilisez l'adresse Tailscale du PC.
- Autre port : `JARDIN_PORT=9000 npm run pc`. Autre dossier : `JARDIN_DIR=…`. Une fois l'app construite, `npm run pc:start` relance le serveur sans reconstruire.

**Démarrage automatique (facultatif)** : un service utilisateur systemd, `~/.config/systemd/user/lignee-jardin.service` :

```ini
[Unit]
Description=Lignée Jardin (version ordinateur)

[Service]
WorkingDirectory=%h/Téléchargements/lignee-jardin
ExecStart=/usr/bin/env npm run pc:start
Restart=on-failure

[Install]
WantedBy=default.target
```

Activez-le ensuite avec `systemctl --user enable --now lignee-jardin`.

## Plan du jardin : zoom et herbe

Le plan s'ouvre cadré sur ce qui est dessiné (planches et obstacles). On zoome en pinçant avec deux doigts, avec les boutons − et +, d'un double-clic sur l'herbe ou avec Ctrl + molette. On se déplace en faisant glisser l'herbe. « Planches » recadre sur les planches et « Tout » montre le terrain entier. Une barre d'échelle indique la longueur réelle. De près, le quadrillage passe à 50 cm puis à 10 cm, et chaque planche montre ses cultures à leur place, avec leur nom quand il tient. Le fond est en herbe, les planches en terre avec un cadre en bois, et la dernière vue est gardée quand on change d'onglet.

## Disposition sur la planche, voisinages, eau de pluie

- **Disposition** : la fiche d'une planche dessine ses cultures en rectangles à l'échelle. On les fait glisser (pas de 5 cm) et on les agrandit par le coin ; la surface de la culture suit, donc ses besoins et sa récolte attendue aussi. Les cultures pas encore placées sont posées par l'app à la première place libre (pointillés) ; « Garder les places proposées » les enregistre. Surface libre, chevauchements et manque de place sont signalés.
- **Voisinages** : les bons et mauvais compagnons connus à moins de 50 cm, sur la même planche ou d'une planche voisine. Les rectangles placés à la main apparaissent sur le plan du jardin, entourés de rouge en cas de mauvais voisin. Beaucoup d'associations sont des traditions de jardinier : l'app le dit quand l'effet n'est pas démontré.
- **Compostage en place** : dans le paillage, « restes de cuisine » et « fumier » s'ajoutent aux matériaux, avec une saisie en litres pour les petits carrés et une estimation de l'équilibre carbone/azote de ce qui est en surface (conseil : ajouter du broyat ou des tontes).
- **Récupérateurs d'eau de pluie** : chaque cuve (capacité, surface de toit) a un niveau estimé : pluie du pluviomètre ou de la météo × toit × 0,8, moins les arrosages notés « puisés dans la cuve ». L'app indique les jours de réserve, les débordements et une tâche quand la cuve est presque vide. Un relevé du niveau recale l'estimation.

## Engrais verts, compost, récoltes rapides

- **Engrais verts** (catalogue → « Engrais vert ») : moutarde, radis
  fourrager, seigle, avoine, ray-grass, vesce, mélange seigle-vesce,
  trèfles, luzerne, sainfoin, pois fourrager. Tâche « à faucher » dans la
  fenêtre de destruction ; une fois la culture marquée terminée, l'azote
  rendu (3 à 12 g/m² selon l'espèce) est compté dans les apports de la
  culture suivante sur la même planche.
- **Compost** (onglet Jardin) : tas, bacs et lombricomposteurs ; apports
  par matière (verts / bruns), C/N estimé avec la correction à faire,
  retournements, température, date de maturité estimée ; le compost tamisé
  passe au stock. Tâches « retourner » et « tamiser ».
- **🧺 Récolte** (écran Aujourd'hui) : les cultures en récolte et les fleurs
  en floraison, un champ par culture (g, kg ou tiges), tout s'enregistre
  d'un coup.
- **Préparer l'an prochain** depuis le bilan : le planificateur reprend les
  cultures de l'année, réduit de moitié celles qui ont déçu et choisit des
  planches mieux exposées et en bonne rotation.
- **Étiquettes de graines** (catalogue → Mes graines) : planche A4 de
  3 × 7 étiquettes (variété, année, conservation, germination, origine
  Lignée).
- **Localisation et boussole** : « 📍 Localiser le jardin » (GPS) et
  « 🧭 Orienter avec la boussole » près des ombres et dans Réglages.

## Les aromatiques

21 aromatiques s'ajoutent au basilic, au persil et à la ciboulette :
méditerranéennes de sol sec (thym, romarin, sauge, origan, marjolaine,
sarriette, hysope, laurier-sauce), aromatiques fraîches (menthe,
mélisse, estragon, livèche, verveine citronnelle), annuelles à semer
(coriandre, aneth, cerfeuil, camomille, shiso) et plus exotiques
(citronnelle, stévia, ail des ours). Chacune a son calendrier, sa
cueillette, sa multiplication (boutures, division ou graines) et ses
pièges : menthe envahissante, estragon français sans graines,
confusions mortelles de l'ail des ours avec le muguet et le colchique.

## Fruitiers et petits fruits

17 fruitiers (onglet « Fruitiers » du catalogue) : framboisier, mûrier
sans épines, groseilliers à grappes et à maquereau, cassissier,
myrtillier, kiwi, vigne de table, pommier, poirier, prunier, cerisier,
pêcher, abricotier, figuier, cognassier, noisetier. Chaque fiche donne la
taille, la pollinisation (variété pollinisatrice ou autofertile), les
maladies et la multiplication (bouture, marcotte, greffe). La première
récolte vient l'été suivant pour les petits fruits, 2 à 4 ans après la
plantation pour les arbres ; ensuite l'app propose la récolte chaque
année aux bons mois (décalés selon le climat). Plus généralement, toutes
les vivaces (rhubarbe, fraisier, aromatiques, fleurs vivaces) retrouvent
leur fenêtre de récolte ou de floraison d'une année sur l'autre.

## Les fleurs

Le catalogue compte **141 fleurs** à côté des 42 légumes : annuelles
(cosmos, zinnia, souci, capucine, bleuet, nigelle, pois de senteur,
muflier, tournesol, célosie, statice, ipomée, coquelicot…), engrais verts
fleuris (phacélie, sarrasin, trèfle incarnat), bisannuelles, vivaces et
arbustes à fleurs (delphinium, lupin, hellébore, phlox, hémérocalle,
hortensia, arbre aux papillons…), plantes de balcon (géranium,
bégonia, impatiens, fuchsia), bulbes et tubercules (tulipe, narcisse,
jacinthe, muscari, perce-neige, renoncule, dahlia, balisier, muguet…).
Dans le catalogue, l’onglet Fleurs se filtre par groupe (annuelles,
bisannuelles, vivaces, bulbes), par couleur et « en fleur ce mois-ci ». Chaque fiche donne la
floraison (à la place de la récolte), les couleurs, les usages
(bouquet, mellifère, comestible, séchage…), la hauteur, la toxicité
éventuelle et deux rappels propres aux fleurs : couper les fleurs
fanées et rentrer les bulbes gélifs avant les gelées. Types de culture
pour le pois de senteur, le souci, le bleuet, la nigelle, la pensée, le
dahlia (tubercules ou semis) et le lis.

**Graines de fleurs** : pour chaque fleur, l'app indique si elle se
ressème fidèlement, si les variétés du commerce sont souvent des F1,
comment récolter et conserver les graines, et quand la multiplication
se fait plutôt par bulbes, tubercules ou boutures.

**Atelier Muflier** : la génétique des fleurs se pratique dans
l'atelier 🌺 Muflier de l'onglet Sélection (couleurs à dominance
incomplète, gène sauteur, fleur pélorique de Darwin,
auto-incompatibilité des mufliers sauvages). Ses « Mes lignées »
arrivent au jardin comme variétés de muflier.

**Atelier Pois de senteur** : l'atelier 🌸 Pois de senteur rejoue les
expériences de Bateson et Punnett (deux blancs complémentaires donnant
une F1 pourpre, liaison entre couleur et forme du pollen), avec les
formes Spencer, capuchon et naine Cupid et les hybrides avec
*L. belinensis*. Ses « Mes lignées » arrivent au jardin comme variétés
de pois de senteur.

**Atelier Tournesol** : l'atelier 🌻 Tournesol montre la dominance
incomplète du rouge (jaune × rouge = bicolore), les fleurs doubles
« nounours », la ramification du tournesol sauvage, les plantes sans
pollen pour la fleur coupée et la vigueur hybride. Ses « Mes lignées »
arrivent au jardin comme variétés de tournesol.

## La Lune (option, tradition jardinière)

Réglages → Affichage → « Afficher la Lune » (désactivé par défaut) :
l'écran « Aujourd'hui » montre la phase, la fraction éclairée, la lune
montante ou descendante et la date du prochain changement, les
prochaines nouvelle et pleine lunes, et les conseils de la tradition
(semer en lune montante, planter et travailler le sol en lune
descendante). Calcul hors ligne (séries abrégées de Meeus,
`src/jardin/engine/moon.ts`), vérifié sur des éclipses connues.

Aucune étude contrôlée n'a montré d'effet de la Lune sur les cultures :
la carte le dit, et l'app ne s'en sert jamais pour ses dates, ses
tâches ni ses conseils.

## Les ateliers de sélection (onglet « Sélection »)

Lignée Jardin est l'app principale : les seize apps Lignée de
génétique y sont réunies comme **ateliers**, chacun ouvert depuis
l'onglet 🧬 **Sélection** : tomate, piment et poivron, courge, melon,
pastèque, haricot, pois, maïs, chou, carotte, pomme de terre, fraise,
muflier, pois de senteur, tournesol et cannabis.

- Chaque atelier est l'app d'origine, **copiée telle quelle** dans
  `src/ateliers/<id>/` (moteur, interface, textes FR/EN, tests) : mêmes
  fonctions, mêmes données (clés `lignee.<culture>.*`), même couleur
  d'accent. Seuls la langue (partagée avec le jardin) et le sélecteur
  de langue sont branchés sur l'app hôte ; l'atelier cannabis garde son
  système de traduction, relié à la langue du jardin.
- **Chargement à la demande** : un atelier n'est chargé qu'à son
  ouverture (un fichier JS par atelier), mais tout est précaché par la
  PWA et dans l'APK : tout marche hors ligne.
- Barre du haut : **← Jardin** pour revenir (le bouton retour d'Android
  aussi), et **🌱 Au jardin (n)** qui ajoute au catalogue du jardin les
  variétés enregistrées dans « Mes lignées » de l'atelier, sans
  doublon. Depuis la liste, « Ajouter toutes mes lignées au jardin » le
  fait pour tous les ateliers d'un coup. L'atelier cannabis reste une
  simulation (pas d'espèce correspondante au jardin).
- Les apps Lignée installées séparément gardent leurs propres données
  (chaque application Android a son stockage) : pour les reprendre,
  exporter la planche ou « Mes lignées » depuis l'app séparée et
  importer le fichier dans l'atelier.

Mettre à jour un atelier : recopier le dossier `src/` de l'app d'origine
dans `src/ateliers/<id>/` (sans `main.tsx`, `Root.tsx`, `index.css`),
puis remettre les deux fichiers de raccord `i18n/LanguageContext.tsx` et
`components/LanguageSwitcher.tsx` (une ligne d'export chacun) ; tests :
recopier `tests/<culture>-engine.test.ts` dans `tests/ateliers/<id>.test.ts`
en remplaçant `../src/` par `../../src/ateliers/<id>/`.

## Installation

Nécessite Node.js 18+.

```bash
npm install
npm run dev
```

L'application est servie sur `http://localhost:5173`.

## Build de production

```bash
npm run build
```

Le résultat est généré dans `dist/` — un ensemble de fichiers
statiques (HTML/CSS/JS) prêt à déployer sur n'importe quel hébergeur
statique.

Pour prévisualiser ce build localement :

```bash
npm run preview
```

## Déploiement

L'app est 100% statique (aucune API, aucune base de données) : elle se
déploie sur n'importe quel hébergeur de fichiers statiques.

**Vercel / Netlify** — le plus simple : connectez le dépôt, avec la
commande de build `npm run build` et le dossier de sortie `dist`.
Aucune variable d'environnement requise.

**Hébergement manuel** (ex. un VPS, un bucket S3, GitHub Pages) :
construisez avec `npm run build`, puis déposez le contenu de `dist/`
sur votre hébergeur. Comme l'app est une page unique sans routage
côté client, aucune règle de réécriture d'URL n'est nécessaire.

## Installation sur Android (PWA)

L'app est une *Progressive Web App* (`vite-plugin-pwa`) : une fois
hébergée en HTTPS (voir Déploiement ci-dessus), elle s'installe comme
une app native depuis Chrome Android — icône sur l'écran d'accueil,
plein écran sans barre d'adresse, et **fonctionne hors-ligne** après
la première visite (toutes les données vivent dans IndexedDB sur
l'appareil, donc aucune perte de fonctionnalité sans réseau).

1. Construire (`npm run build`) et héberger `dist/` quelque part en
   HTTPS — le plus simple avec ce qu'on a déjà : **GitHub Pages** sur
   le dépôt existant (Settings → Pages → déployer depuis `dist/` ou
   via une action `gh-pages`), ou glisser `dist/` sur **Netlify Drop**
   (netlify.com/drop, aucun compte requis, gratuit).
2. Sur le téléphone Android, ouvrir l'URL dans Chrome.
3. Menu ⋮ → **« Installer l'application »** (ou « Ajouter à l'écran
   d'accueil » selon la version de Chrome) → l'icône Lignée apparaît
   sur l'écran d'accueil et l'app s'ouvre en plein écran, comme une
   app native.

## Compiler un vrai .apk (Capacitor) — guide Ubuntu

Le projet contient déjà tout le nécessaire : Capacitor est installé
(`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`), configuré
(`capacitor.config.ts`) et le dossier `android/` a été généré avec les
icônes de l'app (`npm run android:assets`, déjà fait — à relancer
seulement si vous changez l'icône dans `public/favicon.svg`). Il ne
reste que l'installation des outils Android sur votre machine, qui n'a
pas pu être faite ici (pas de SDK Android dans cet environnement).

### 1. Installer Android Studio

C'est le moyen le plus simple d'obtenir à la fois le SDK Android, les
outils de build et un JDK compatible, en un seul paquet.

```bash
sudo snap install android-studio --classic
```

(Ou téléchargez le `.tar.gz` depuis developer.android.com/studio et
lancez `android-studio/bin/studio.sh` si vous préférez ne pas utiliser
snap.)

Au premier lancement, l'assistant **Setup Wizard** propose une
installation "Standard" — acceptez-la : elle installe le SDK Android
(dans `~/Android/Sdk` par défaut), les *build-tools*, une image
d'émulateur et un JDK embarqué. Laissez-le terminer (quelques minutes,
plusieurs Go téléchargés).

### 2. Ouvrir le projet Android

Depuis le dossier du projet (celui de ce README) :

```bash
npm install          # si pas déjà fait sur cette machine
npm run android:sync # build web (npm run build) + copie dans android/
npm run android:open # ouvre android/ dans Android Studio
```

`npm run android:open` lance Android Studio directement sur le
sous-dossier `android/`. La première ouverture déclenche une
synchronisation Gradle (barre de progression en bas de la fenêtre) —
patientez jusqu'à ce qu'elle se termine sans erreur.

### 3. Générer un .apk installable (débogage)

Le plus rapide pour tester sur votre téléphone, sans compte
développeur ni signature :

- Dans Android Studio : menu **Build → Build App Bundle(s) / APK(s) →
  Build APK(s)**.
- Une fois terminé, une notification en bas à droite propose
  **« locate »** : elle pointe vers
  `android/app/build/outputs/apk/debug/app-debug.apk`.

Ou en ligne de commande, depuis `android/` :

```bash
cd android
./gradlew assembleDebug
```

L'APK est généré au même chemin
(`android/app/build/outputs/apk/debug/app-debug.apk`). Copiez ce
fichier sur votre téléphone (câble USB, ou envoyez-le vous-même par
email/Drive) et ouvrez-le depuis un gestionnaire de fichiers Android
pour l'installer — Android demandera d'autoriser **« Installer des
applications inconnues »** pour l'app utilisée (Fichiers, Chrome...)
la première fois, c'est normal pour un APK hors Play Store.

### 4. Tester directement depuis Android Studio (optionnel, plus rapide en itération)

Branchez le téléphone en USB avec le **débogage USB** activé
(Paramètres → À propos du téléphone → tapoter 7 fois sur "Numéro de
build" pour révéler les options développeur, puis Options
développeur → Débogage USB), ou créez un émulateur (**Device
Manager** dans Android Studio). Ensuite, bouton ▶️ **Run** dans
Android Studio : ça installe et lance l'app directement, sans passer
par un fichier `.apk` à transférer à la main.

### 5. APK signé pour une diffusion plus large (release)

Un APK de *debug* (ci-dessus) suffit pour votre propre usage. Pour le
distribuer plus largement (même hors Play Store), il faut un APK
*release* signé avec votre propre clé :

```bash
cd android
keytool -genkey -v -keystore lignee-release.keystore -alias lignee -keyalg RSA -keysize 2048 -validity 10000
```

(répondez aux questions, notez bien le mot de passe — il faudra ce
même fichier `.keystore` pour toute mise à jour future signée avec la
même identité). Puis dans Android Studio : **Build → Generate Signed
Bundle / APK → APK**, sélectionnez ce keystore, et choisissez
`release` comme *build variant*. L'APK signé sort dans
`android/app/build/outputs/apk/release/`.

### À chaque changement de l'app

Après une modification du code (nouvelle variété, nouveau composant,
etc.), il suffit de relancer :

```bash
npm run android:sync
```

puis de reconstruire l'APK (étape 3) — pas besoin de repasser par
`npx cap add android`, déjà fait une fois pour toutes.

### Pourquoi pas directement ici ?

Cet environnement de développement (le bac à sable où je travaille)
n'a pas le SDK Android installé, et le télécharger (plusieurs Go,
servi par les serveurs Google) est bloqué par les règles réseau de cet
environnement — d'où ce guide plutôt qu'un `.apk` livré directement.
Le dossier `android/` et les icônes sont en revanche déjà prêts dans
l'archive : il ne reste que la partie qui doit se faire sur votre
machine.

## Structure

```
src/
├── Root.tsx, main.tsx, i18n/LanguageContext.tsx, components/LanguageSwitcher.tsx
├── utils/download.ts
├── ateliers/
│   ├── registry.ts           # Les 16 ateliers : nom, couleur, chargement à la demande, « Mes lignées »
│   ├── pending.ts            # Variétés d'un atelier pas encore au jardin
│   └── tomate/, piment/, courge/, melon/, pasteque/, haricot/, pois/,
│       mais/, chou/, carotte/, patate/, fraise/, muflier/, cannabis/   # apps d'origine
└── jardin/
    ├── model.ts              # Types : espèces, produits, réglages, planches, cultures, journal…
    ├── data/
    │   ├── species.ts        # 42 espèces
    │   ├── products.ts       # 16 engrais et amendements
    │   ├── climate.ts        # 5 climats (ET₀, pluie, gelées, températures), réserve utile par texture
    │   ├── problems.ts       # Signes, 29 problèmes, moyens d'action autorisés aux amateurs
    │   └── speciesExtra.ts   # Graines (durée, fécondation, isolement), prix, voisinage
    ├── engine/
    │   ├── dates.ts          # Jours de jardin (ISO, UTC)
    │   ├── crop.ts           # Calendrier, stades, Kc, surfaces
    │   ├── nutrition.ts      # Besoins NPK, apports, doses, produit conseillé
    │   ├── water.ts          # Bilan hydrique par planche
    │   ├── tasks.ts          # Tâches du jour
    │   ├── rotation.ts       # Retour d'une famille sur une planche
    │   ├── weather.ts        # Open-Meteo, cache, alertes, contexte récent
    │   ├── phenology.ts      # Degrés-jours, courbe de référence, recalage
    │   ├── sun.ts            # Position du soleil, ombres, heures de soleil, heure du téléphone → heure solaire
    │   ├── bilan.ts          # Bilan de fin de saison : fleurs coupées, planches, ce qui a marché
    │   ├── diagnosis.ts      # Classement des hypothèses
    │   ├── season.ts         # Graines, bilan de saison
    │   ├── sync.ts           # Horodatage, traces de suppression, fusion de jardins
    │   ├── sensors.ts        # Relevés, CSV, humidité du sol, EC/pH
    │   ├── soil.ts           # Analyse de sol, chaulage, correction des doses
    │   ├── planner.ts        # Planificateur de saison
    │   ├── growth.ts         # Courbe de croissance, récolte cumulée
    │   ├── pests.ts          # Comptages de ravageurs, seuils, auxiliaires
    │   ├── stock.ts          # Stocks, graines restantes, liste de courses
    │   ├── notify.ts         # Notifications à programmer (plafond quotidien)
    │   └── report.ts         # Prévisions de récolte, bilan pluriannuel, rapport
    │   └── backup.ts         # Sauvegarde, CSV, import Lignée, jardin d'exemple
    ├── store.tsx             # IndexedDB (données + photos), état partagé
    ├── JardinApp.tsx, Ateliers.tsx (onglet Sélection), nav.tsx, ui.tsx, format.ts, i18n.ts
    ├── Onboarding.tsx, TodayView.tsx, GardenView.tsx, PlantsView.tsx
    ├── NutritionPanel.tsx, Forms.tsx, CatalogView.tsx, SettingsView.tsx
    ├── Weather.tsx, Health.tsx, Seeds.tsx, Sensors.tsx, ProSettings.tsx
    ├── Soil.tsx, Planner.tsx, Growth.tsx, Pests.tsx, Stocks.tsx, Voice.tsx
    ├── notifications.ts      # Plugin natif ou API du navigateur
    ├── reportPdf.ts          # Rapport de saison (jsPDF, chargé à la demande)
    ├── taskText.ts           # Texte des tâches (écran, notifications)
tests/jardin-engine.test.ts
```

## Icônes et écran de démarrage

L'emblème est une jeune pousse dont la tige est une double hélice d'ADN,
sortant d'une butte de terre, avec une goutte d'eau et trois grains N, P,
K. L'application Android s'appelle « Lignée Jardin », identifiant
`app.lignee.jardin` : elle s'installe à côté des apps Lignée sans les
remplacer. Tout part de `scripts/generate-brand.mjs`, qui écrit les SVG
sources dans `assets/brand/` et `public/favicon.svg`.

Pour régénérer les images après une modification de l'emblème :

1. `node scripts/generate-brand.mjs`
2. convertir les SVG en PNG/JPG avec un navigateur sans tête (la police
   Fraunces doit être disponible pour le texte du splash) : `public/icon-192.png`, `public/icon-512.png`,
   `public/icon-maskable-512.png`, `public/splash-hero.png` (1080², fond transparent — le dégradé est en CSS dans `index.html`),
   `assets/icon-only.png`, `assets/icon-foreground.png`,
   `assets/icon-background.png` (1024²), `assets/splash.jpg` et
   `assets/splash-dark.jpg` (2732²) ;
   `assets/icon-monochrome.png` (432², silhouette blanche de l'avant-plan
   sur fond transparent, pour les icônes à thème d'Android 13+) ;
3. `npm run android:assets` pour décliner les icônes et splashs Android ;
   la commande ajoute ensuite la couche monochrome à l'icône adaptative
   (`scripts/android-icon-extras.mjs`).

L'avant-plan de l'icône adaptative est dessiné à l'échelle 0,84 :
capacitor-assets l'insère déjà dans la vue de 72 dp, et le lanceur y
applique son masque (cercle, carré arrondi) ; à cette échelle l'emblème
remplit la vue sans sortir du cercle de sécurité de 66 dp.

## Design

- **Palette** : feuillage sombre (fond), papier parchemin (fiches), vert
  feuille (accent), or résine ; bleu pour l'eau, trois teintes pour N,
  P₂O₅ et K₂O toujours accompagnées de leur nom.
- **Typographie** : Fraunces (titres) + IBM Plex Sans (interface) + IBM
  Plex Mono (chiffres).
- **Mode terrain** : texte agrandi de 12,5 %, boutons et champs de 48 px
  au moins, contraste renforcé.
- **Stack** : Vite, React 19, TypeScript, Tailwind CSS v4, IndexedDB.

## Sources principales

- Allen R.G., Pereira L.S., Raes D. & Smith M. (1998), *Crop evapotranspiration — Guidelines for computing crop water requirements*, FAO Irrigation and Drainage Paper 56 (méthode du Kc, tableaux des Kc et des profondeurs racinaires).
- Guides de fertilisation des légumes (CTIFL, Yara) : exportations N-P₂O₅-K₂O par tonne récoltée, ordres de grandeur.
- Normales climatiques de villes représentatives (Brest, Paris, Strasbourg, Marseille, une station de moyenne montagne) pour ET₀, pluie et gelées, arrondies.
- Loi Labbé (n° 2014-110, modifiée par la loi de transition énergétique de 2015) : depuis le 1er janvier 2019, les jardiniers amateurs ne peuvent utiliser que des produits de biocontrôle, à faible risque, utilisables en agriculture biologique ou des PNPP ; catalogue E-Phy de l'Anses pour chaque produit commercial.
- Open-Meteo (open-meteo.com) : API de prévision et de géocodage, données sous licence CC BY 4.0, gratuite pour un usage non commercial (10 000 appels par jour).
- Degrés-jours de croissance (méthode de la moyenne avec seuil de base et plafond) ; position du soleil par les formules usuelles de déclinaison et d'angle horaire.
- Plages EC/pH des tableaux courants de culture hors-sol (ordres de grandeur, à affiner selon variété, stade et eau de départ).
- Humidité volumique à la capacité au champ et au point de flétrissement par texture (valeurs usuelles de pédologie), pour lire une sonde non étalonnée.
- Tableaux usuels de durée germinative des semences potagères et distances d'isolement des guides de production de semences au jardin.

## Avertissement

Lignée Jardin est un **outil d'aide** : besoins, doses, réserve en eau,
calendriers et dates de récolte sont des ordres de grandeur calculés à
partir de valeurs de référence et de moyennes climatiques, pas de
mesures de votre jardin. La météo réelle, l'analyse de sol et vos
observations priment. Les données restent sur l'appareil : exportez une
sauvegarde régulièrement.

Le diagnostic propose des **hypothèses**, pas des certitudes : vérifiez
avant d'agir, et lisez toujours l'étiquette d'un produit. Les ombres
sont calculées avec des obstacles en forme de blocs, sans relief ni
nuages ; les degrés-jours partent d'une courbe de référence calée sur
des normales parisiennes et d'hypothèses (abri 22/15 °C, serre +4 °C)
que vos stades observés corrigent peu à peu.

Phase 4 : seuils d'analyse, chaulage, hauteurs adultes et seuils de
ravageurs sont des ordres de grandeur ; l'interprétation de votre
laboratoire et votre œil priment. Le planificateur propose un brouillon
à relire, il ne connaît ni vos goûts ni vos contraintes de temps.

Phase 3 : les notifications d'un
navigateur ne partent que si l'app est ouverte. La fusion de jardins
garde la version la plus récente d'une fiche modifiée des deux côtés :
l'autre version est perdue (l'app le signale).
