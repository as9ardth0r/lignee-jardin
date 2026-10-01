# Lignée · Jardin

**Le carnet de bord du potager** — phase 1 d'une application de suivi du
jardin pour jardiniers confirmés et semi-pros : chaque plante, chaque
planche et chaque apport suivis, avec des conseils d'eau et d'engrais
chiffrés mais honnêtes sur leurs marges d'erreur. Application web
autonome (React + TypeScript, PWA installable, APK Android via
Capacitor), **hors-ligne d'abord**, sans compte ni serveur : les données
vivent dans IndexedDB sur l'appareil, rien n'est envoyé nulle part.
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

Le cahier des charges complet (phases 2 et 3 : météo locale, degrés-jours,
diagnostic, ensoleillement, capteurs, mode pro) est tenu à part.

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
└── jardin/
    ├── model.ts              # Types : espèces, produits, réglages, planches, cultures, journal…
    ├── data/
    │   ├── species.ts        # 42 espèces
    │   ├── products.ts       # 16 engrais et amendements
    │   └── climate.ts        # 5 climats (ET₀, pluie, gelées), réserve utile par texture
    ├── engine/
    │   ├── dates.ts          # Jours de jardin (ISO, UTC)
    │   ├── crop.ts           # Calendrier, stades, Kc, surfaces
    │   ├── nutrition.ts      # Besoins NPK, apports, doses, produit conseillé
    │   ├── water.ts          # Bilan hydrique par planche
    │   ├── tasks.ts          # Tâches du jour
    │   ├── rotation.ts       # Retour d'une famille sur une planche
    │   └── backup.ts         # Sauvegarde, CSV, import Lignée, jardin d'exemple
    ├── store.tsx             # IndexedDB (données + photos), état partagé
    ├── JardinApp.tsx, nav.tsx, ui.tsx, format.ts, i18n.ts
    ├── Onboarding.tsx, TodayView.tsx, GardenView.tsx, PlantsView.tsx
    ├── NutritionPanel.tsx, Forms.tsx, CatalogView.tsx, SettingsView.tsx
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
3. `npm run android:assets` pour décliner les icônes et splashs Android.

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
- Loi Labbé (produits phytosanitaires interdits aux jardiniers amateurs depuis le 1er janvier 2019) pour le cadre du futur module santé.

## Avertissement

Lignée Jardin est un **outil d'aide** : besoins, doses, réserve en eau,
calendriers et dates de récolte sont des ordres de grandeur calculés à
partir de valeurs de référence et de moyennes climatiques, pas de
mesures de votre jardin. La météo réelle, l'analyse de sol et vos
observations priment. Les données restent sur l'appareil : exportez une
sauvegarde régulièrement.
