/**
 * Dictionnaires de traduction FR/EN pour l'interface de « Lignée ».
 *
 * Ne couvre QUE le texte d'interface (labels, boutons, titres, info-bulles,
 * messages d'état). Le contenu de la bibliothèque de variétés
 * (STRAIN_PRESETS dans src/engine/genetics.ts — noms, descriptions, fiches
 * de culture en texte libre) reste volontairement hors périmètre et
 * s'affiche en français dans les deux langues.
 *
 * Structure : un dictionnaire plat clé → chaîne, organisé par préfixe de
 * section (ex. `founder.*`, `cross.*`, `selectionProgram.*`). Les chaînes
 * paramétrées utilisent la syntaxe `{{nom}}`, remplacée par `t()`
 * (voir LanguageContext.tsx).
 */

export type Language = 'fr' | 'en';

export const translations = {
  fr: {
    // --- App shell / en-tête -------------------------------------------
    'app.eyebrow': 'Génétique quantitative appliquée au cannabis',
    'app.title': 'Lignée',
    'app.subtitle':
      "Un atelier de croisement pour observer, génération après génération, comment le chimiotype se transmet.",
    'app.description':
      "Plantez des fondateurs, croisez-les, et suivez la ségrégation du locus B (THCA/CBDA synthase) sur vos lignées — un modèle simplifié du moteur de génétique quantitative complet.",
    'app.footer.disclaimer':
      "Lignée — simulation pédagogique de génétique quantitative. Ne constitue pas un guide de culture ou de production.",

    // --- Bande de chiffres clés (en-tête) ---------------------------------
    'app.stats.varieties_one': '{{n}} variété cataloguée',
    'app.stats.varieties_other': '{{n}} variétés cataloguées',
    'app.stats.chemotypes_one': '{{n}} chimiotype modélisé',
    'app.stats.chemotypes_other': '{{n}} chimiotypes modélisés',
    'app.stats.loci_one': '{{n}} locus génétique simulé',
    'app.stats.loci_other': '{{n}} loci génétiques simulés',

    // --- Sélecteur de langue ---------------------------------------------
    'languageSwitcher.french': 'Français',
    'languageSwitcher.english': 'Anglais',

    // --- Catalogue (colonne gauche) --------------------------------------
    'founder.panel.title': 'Nouveau fondateur',
    'catalog.export': '💾 Sauvegarder (.json)',
    'catalog.import': '📂 Charger (.json)',
    'catalog.import.success': '{{n}} spécimens chargés.',
    'catalog.import.error': 'Import impossible : {{message}}',
    'catalog.deleteMode.enter': '🗑 Supprimer des spécimens',
    'catalog.deleteMode.cancel': 'Annuler la suppression',
    'catalog.deleteMode.confirm': 'Supprimer ({{n}})',
    'catalog.archived.show': '📦 Voir les archivés ({{n}})',
    'catalog.archived.hide': 'Masquer les archivés',
    'catalog.count_one': "{{n}} spécimen au catalogue — cliquez pour sélectionner un parent (jusqu'à deux) et voir le détail",
    'catalog.count_other': "{{n}} spécimens au catalogue — cliquez pour sélectionner un parent (jusqu'à deux) et voir le détail",
    'catalog.generation': 'Génération {{n}}',
    'catalog.empty.title': 'Le catalogue est vide',
    'catalog.empty.step1': 'Plantez un fondateur ci-dessus',
    'catalog.empty.step2': 'Sélectionnez deux parents et croisez-les',
    'catalog.empty.step3': "Observez la ségrégation d'une génération à l'autre",

    // --- Croisement --------------------------------------------------------
    'cross.title': 'Croisement',
    'cross.chooseSpecimen': 'Choisir un spécimen',
    'cross.sameSexWarning':
      "Les deux parents sélectionnés sont du même sexe — un croisement réel exige un mâle et une femelle. La simulation reste possible (génotype seul) mais ne représente pas une pollinisation biologique.",
    'cross.reversedFemaleNote':
      "L'une des deux femelles est marquée « retournée » (pollen simulé) — la descendance sera 100% femelle, comme lors d'un vrai retournement chimique. Le moteur le calcule automatiquement à partir du sexe XX des deux parentes.",
    'cross.offspringLabel': 'Descendants',
    'cross.pollinateButton': 'Polliniser',

    // --- Dernière portée -----------------------------------------------
    'lastBatch.title': 'Dernière portée',
    'lastBatch.count': '{{n}} descendants — ségrégation observée au locus B',

    // --- Fiche du spécimen (colonne droite) --------------------------------
    'specimen.sheetTitle': 'Fiche du spécimen',
    'specimen.pigment.label': 'Pigment {{a}}/{{b}}',
    'specimen.pigment.expressed': 'violette exprimée',
    'specimen.pigment.carrier': 'porteur masqué',
    'specimen.pigment.green': 'vert',
    'specimen.autoflower': 'auto-floraison',
    'specimen.portraitCaption': 'Portrait généré à partir du génotype — illustration, pas une photo',
    'specimen.vigorTraitDescription':
      "Trait polygénique de démonstration (8 loci additifs + bruit environnemental) — illustre l'hérédité quantitative, par opposition à la ségrégation mendélienne simple du locus B.",
    'specimen.cultivationSheet.title': 'Fiche de culture',
    'specimen.cultivationSheet.openLibrary':
      "Variété « {{name}} » de la bibliothèque ouverte — pas encore de fiche de culture vérifiée (seul le chimiotype a été retenu depuis un dataset public). Voir le README pour la compléter à la main.",
    'specimen.cultivationSheet.hybrid':
      "Hybride issu d'un croisement — pas de fiche de culture propre. Ses caractéristiques de culture réelles dépendraient d'une sélection sur plusieurs générations, pas seulement du génotype des parents.",
    'specimen.cultivationSheet.customFounder': 'Fondateur personnalisé — pas de fiche de culture associée.',
    'specimen.nutrients.title': 'Besoins nutritionnels',
    'specimen.yield.title': 'Rendement estimé',
    'specimen.notes.title': 'Note rapide',
    'specimen.notes.placeholder': 'Un mot-clé, un rappel — pour un vrai suivi daté, voir le carnet de bord ci-dessous.',
    'journal.title': 'Carnet de bord',
    'journal.form.open': '+ Ajouter une observation',
    'journal.form.cancel': 'Annuler',
    'journal.form.date': 'Date',
    'journal.form.stage': 'Stade',
    'journal.form.stageUnset': '—',
    'journal.form.height': 'Hauteur mesurée (cm)',
    'journal.form.heightPlaceholder': 'ex. 42',
    'journal.form.issues': 'Anomalies observées',
    'journal.form.issuesPlaceholder': 'ex. carence en azote, feuilles jaunissantes',
    'journal.form.actions': 'Actions prises',
    'journal.form.actionsPlaceholder': 'ex. ajustement EC, taille des feuilles basses',
    'journal.form.text': 'Observation',
    'journal.form.textPlaceholder': 'Description libre de l\'état de la plante, du contexte, des mesures…',
    'journal.form.submit': 'Enregistrer cette observation',
    'journal.empty': 'Aucune observation enregistrée pour ce spécimen.',
    'journal.deleteEntry': 'Supprimer cette observation',
    'journal.export': '💾 Exporter le carnet (.txt)',
    'journal.export.header': 'Carnet de bord — {{name}}',
    'journal.export.genotype': 'Génotype',
    'specimen.cloneButton': '🌿 Bouturer',
    'specimen.cloneButtonTitle': 'Créer une copie génétique exacte (bouture) de ce spécimen',
    'specimen.deleteButton': '🗑',
    'specimen.deleteButtonTitle': 'Supprimer ce spécimen du catalogue',
    'specimen.archiveButton': '📦 Archiver',
    'specimen.archiveButtonTitle': "Masquer ce spécimen de la vue par défaut sans le supprimer",
    'specimen.unarchiveButton': 'Désarchiver',
    'specimen.unarchiveButtonTitle': 'Faire réapparaître ce spécimen dans la vue par défaut',
    'specimen.archivedNote': 'Archivé — masqué de la vue par défaut du catalogue.',
    'specimen.clonedFrom': 'Bouture de {{name}} — génotype identique',
    'specimen.ancestry.title': 'Ascendance',
    'specimen.selectPrompt': 'Sélectionnez un spécimen dans le catalogue pour afficher sa fiche et son ascendance.',
    'specimen.selectPrompt.emptyCatalog': "Aucun spécimen encore planté — commencez par le formulaire « {{formTitle}} » dans la colonne de gauche.",

    // --- Formulaire de fondateur --------------------------------------------
    'founderForm.variety.label': 'Variété',
    'founderForm.variety.exactRateUnpublished': 'taux exact non publié',
    'founderForm.variety.openLibraryNote':
      "Variété de la bibliothèque ouverte — pas de fiche de culture vérifiée pour l'instant (seul le chimiotype est retenu). Chimiotype : {{chemotype}}.",
    'founderForm.chemotype.label': 'Chimiotype',
    'founderForm.chemotype.short.I': 'THC dominant',
    'founderForm.chemotype.short.II': 'mixte',
    'founderForm.chemotype.short.III': 'CBD dominant',
    'founderForm.chemotype.short.IV': 'CBG dominant',
    'founderForm.chemotype.short.V': 'chanvre fibre',
    'founderForm.chemotype.short.VI': 'CBC dominant',
    'founderForm.sex.label': 'Sexe',
    'founderForm.sex.female': 'Femelle ♀',
    'founderForm.sex.male': 'Mâle ♂',
    'founderForm.autoflowerCheckbox': 'Génétique ruderalis (auto-floraison)',
    'founderForm.violetCheckbox': 'Pigmentation violette (v/v, récessive)',
    'founderForm.propylCheckbox': 'Série propyl / "varin" — THCV/CBDV (pr/pr, récessive)',
    'founderForm.reversedFemaleCheckbox':
      'Retournée chimiquement (argent colloïdal / STS) — produit du pollen à la place d\'un mâle',
    'founderForm.name.label': 'Nom du spécimen',
    'founderForm.name.placeholder': 'ex. Mère du lot A',
    'founderForm.submitButton': 'Planter ce fondateur',

    // --- Formulaire d'ajout de souche personnalisée -------------------------
    'addStrainForm.panel.title': 'Ajouter une souche',
    'addStrainForm.intro':
      "Enregistrez une variété avec sa fiche complète — elle apparaîtra en priorité dans la recherche de variété, avec les autres souches vérifiées. Stockée uniquement dans ce navigateur (exportable en .json ci-dessous).",
    'addStrainForm.name.label': 'Nom de la variété',
    'addStrainForm.name.placeholder': 'ex. Ma sélection maison',
    'addStrainForm.description.label': 'Description courte',
    'addStrainForm.description.placeholder': 'ex. Hybride résineux, THC dominant',
    'addStrainForm.origin.label': 'Origine / lignée',
    'addStrainForm.origin.placeholder': 'ex. Variété A × Variété B',
    'addStrainForm.climate.label': 'Climat',
    'addStrainForm.climate.placeholder': 'ex. tempéré, nuits fraîches en fin de floraison',
    'addStrainForm.tempPreference.label': 'Préférence de température',
    'addStrainForm.floweringWeeks.label': 'Floraison (semaines)',
    'addStrainForm.totalCycleWeeks.label': 'Cycle total (semaines)',
    'addStrainForm.min': 'min',
    'addStrainForm.max': 'max',
    'addStrainForm.auto': 'auto',
    'addStrainForm.heightRange.label': 'Hauteur',
    'addStrainForm.heightRange.placeholder': 'ex. 1 à 1,5 m (taille moyenne)',
    'addStrainForm.difficulty.label': 'Difficulté de culture',
    'addStrainForm.environment.label': 'Environnement',
    'addStrainForm.error.nameRequired': 'Le nom de la variété est obligatoire.',
    'addStrainForm.error.floweringRequired': 'La durée de floraison (au moins le minimum) est obligatoire.',
    'addStrainForm.defaultDescription': '{{chemotype}}, souche personnalisée',
    'addStrainForm.defaultOrigin': 'Lignée non précisée',
    'addStrainForm.defaultHeight': 'non documentée',
    'addStrainForm.submitButton': 'Enregistrer cette souche',
    'addStrainForm.success': '« {{name}} » ajoutée à vos souches.',
    'addStrainForm.import.success': '{{n}} souche(s) importée(s).',
    'addStrainForm.list.count_one': '{{n}} souche personnalisée',
    'addStrainForm.list.count_other': '{{n}} souches personnalisées',
    'addStrainForm.list.deleteTitle': 'Supprimer « {{name}} »',

    // --- Programme de sélection --------------------------------------------
    'selectionProgram.title': 'Programme de sélection',
    'selectionProgram.description':
      "Choisissez un objectif : le moteur enchaîne rétrocroisements et croisements de fratrie sur plusieurs générations pour s'en approcher, et journalise chaque étape (A × B = C, C × A = D, …).",
    'selectionProgram.chooseSpecimen': 'Choisir un spécimen',
    'selectionProgram.targetChemotype.label': 'Chimiotype visé',
    'selectionProgram.indifferent': 'indifférent',
    'selectionProgram.minCbd.label': 'CBD minimum visé',
    'selectionProgram.minThc.label': 'THC minimum visé',
    'selectionProgram.minCbg.label': 'CBG minimum visé',
    'selectionProgram.minCbc.label': 'CBC minimum visé',
    'selectionProgram.chemotypeVNote':
      'Chimiotype V : cannabinoïdes quasi absents par définition (locus P en pp) — aucun seuil à régler.',
    'selectionProgram.autoflowerCheckbox': 'Auto-floraison',
    'selectionProgram.violetCheckbox': 'Pigmentation violette exprimée',
    'selectionProgram.varinCheckbox': 'Série propyl / "varin" exprimée (THCV/CBDV)',
    'selectionProgram.trait.height.label': 'Hauteur',
    'selectionProgram.trait.height.low': 'compacte',
    'selectionProgram.trait.height.high': 'haute',
    'selectionProgram.trait.cold.label': 'Résistance au froid',
    'selectionProgram.trait.cold.low': 'faible',
    'selectionProgram.trait.cold.high': 'rustique',
    'selectionProgram.trait.sun.label': 'Besoin de lumière',
    'selectionProgram.trait.sun.low': "tolère l'ombre",
    'selectionProgram.trait.sun.high': 'plein soleil',
    'selectionProgram.trait.mold.label': 'Résistance moisissure/oïdium',
    'selectionProgram.trait.mold.low': 'sensible',
    'selectionProgram.trait.mold.high': 'résistante',
    'selectionProgram.trait.option.indifferent': 'Indifférent',
    'selectionProgram.trait.option.medium': 'moyenne',
    'selectionProgram.runButton': 'Lancer le programme',
    'selectionProgram.runButton.running': 'Sélection en cours…',
    'selectionProgram.result.goalReached': 'Objectif atteint en {{n}} étape(s).',
    'selectionProgram.result.plateau': 'Programme stoppé (stagnation) après {{n}} étape(s) — meilleur résultat conservé.',
    'selectionProgram.result.generationLimit': 'Limite de générations atteinte ({{n}}) — meilleur résultat conservé.',
    'selectionProgram.export.txt': 'Télécharger la lignée (.txt)',
    'selectionProgram.export.json': 'Télécharger la lignée (.json)',
    'selectionProgram.export.png': "Télécharger l'arbre (.png)",
    'selectionProgram.parentSlot.female': 'femelle ♀',
    'selectionProgram.parentSlot.male': 'mâle ♂',
    'selectionProgram.step.cannabinoids': 'cannabinoïdes {{value}}%',
    'selectionProgram.step.autoflowerAbbr': 'auto',
    'selectionProgram.step.violetExpressed': 'violette',
    'selectionProgram.step.violetCarrier': 'porteur v',
    'selectionProgram.step.varinExpressed': 'varin',
    'selectionProgram.step.varinCarrier': 'porteur pr',
    'selectionProgram.step.height': 'hauteur {{value}}%',
    'selectionProgram.step.cold': 'froid {{value}}%',
    'selectionProgram.step.sun': 'lumière {{value}}%',
    'selectionProgram.step.mold': 'moisissure {{value}}%',
    'selectionProgram.step.score': 'score',

    // --- Fiche de culture (StrainInfoPanel) ---------------------------------
    'strainInfo.origin': 'Origine',
    'strainInfo.climate': 'Climat',
    'strainInfo.flowering': 'Floraison',
    'strainInfo.totalCycle': 'Cycle complet',
    'strainInfo.height': 'Hauteur',
    'strainInfo.environment': 'Environnement',
    'strainInfo.difficulty': 'Difficulté',
    'strainInfo.weeks': 'semaines',
    'strainInfo.temperaturePreference': 'Préférence {{temp}}',

    // --- Sélecteur de variété (VarietyPicker) -------------------------------
    'varietyPicker.searchPlaceholder': 'Rechercher parmi 2 800+ variétés…',
    'varietyPicker.clearSelection': 'Effacer la sélection',
    'varietyPicker.results_one': '{{n}} résultat',
    'varietyPicker.results_other': '{{n}} résultats',
    'varietyPicker.allVarieties': 'Toutes les variétés ({{n}}) — documentées en premier',
    'varietyPicker.noMatch': 'Aucune variété ne correspond.',
    'varietyPicker.fullSheet': 'fiche complète',
    'varietyPicker.showMore': 'Voir {{shown}} de plus ({{remaining}} restantes)…',

    // --- Ascendance (PedigreeTree) ------------------------------------------
    'pedigree.generationAbbr': 'gén. {{n}}',
    'pedigree.selfPollination': 'auto-fécondation',

    // --- Carte de spécimen (SpecimenCard) -----------------------------------
    'specimenCard.generationAbbr': 'Gén. {{n}}',
    'specimenCard.autoflowerAbbr': 'auto',
    'specimenCard.reversedFemaleAbbr': 'retournée',
    'specimenCard.archivedAbbr': 'archivé',
    'specimenCard.violet.expressedTitle': 'Pigmentation violette exprimée (v/v)',
    'specimenCard.violet.carrierTitle': 'Porteur masqué du trait violet (V/v)',
    'specimenCard.violet.expressed': 'violette',
    'specimenCard.violet.carrier': 'porteur v',

    // --- Résine (ResinSwatch) ------------------------------------------------
    'resinSwatch.residual': 'THC/CBD résiduels',
    'resinSwatch.cannabinoidsApprox': 'Cannabinoïdes ≈ {{value}}%',
    'resinSwatch.hempFiber': 'chanvre fibre',

    // --- Jauge de vigueur (VigorGauge) ---------------------------------------
    'vigorGauge.label': 'Vigueur',
    'vigorGauge.rawValueTitle': 'Valeur brute simulée : {{value}}',

    // --- Distribution de vigueur (VigorDistribution) -------------------------
    'vigorDistribution.title': 'Distribution de la vigueur',
    'vigorDistribution.mean': 'moyenne {{value}}%',
    'vigorDistribution.low': 'faible',
    'vigorDistribution.high': 'élevée',
    'vigorDistribution.bucketTitle_one': '{{lo}}–{{hi}}% — {{n}} spécimen',
    'vigorDistribution.bucketTitle_other': '{{lo}}–{{hi}}% — {{n}} spécimens',

    // --- Valeurs d'enum (bibliothèque de variétés) — closed set, safe à traduire
    'enum.tempPreference.fraîche': 'fraîche',
    'enum.tempPreference.tempérée': 'tempérée',
    'enum.tempPreference.chaude': 'chaude',
    'enum.difficulty.débutant': 'débutant',
    'enum.difficulty.intermédiaire': 'intermédiaire',
    'enum.difficulty.avancé': 'avancé',
    'enum.environment.intérieur': 'intérieur',
    'enum.environment.extérieur': 'extérieur',
    'enum.environment.intérieur/extérieur': 'intérieur/extérieur',
    'enum.terpene.myrcene': 'Myrcène',
    'enum.terpene.limonene': 'Limonène',
    'enum.terpene.pinene': 'Pinène',
    'enum.terpene.linalool': 'Linalol',
    'enum.terpene.caryophyllene': 'Caryophyllène',
    'enum.terpene.humulene': 'Humulène',
    'enum.terpene.terpinolene': 'Terpinolène',

    // --- Profil terpénique / chemovar (TerpeneProfile) -----------------------
    'terpeneProfile.title': 'Profil terpénique',
    'terpeneProfile.chemovarLabel': 'Chemovar',
    'terpeneProfile.terpinoleneDominantNote':
      'Terpinolène dominant (t/t) — trait récessif rare, présent chez environ 14% des cultivars.',
    'terpeneProfile.terpinoleneCarrierNote': 'Porteur masqué du terpinolène dominant (T/t).',
    'terpeneProfile.randomDisclaimer':
      'Profil généré/hérité par le moteur (traits polygéniques + locus simulés) — aucune donnée de laboratoire réelle par variété.',
    'terpeneProfile.otherTerpenes': 'Autres : {{list}}',

    // --- Programme de sélection — objectif terpénique -------------------------
    'selectionProgram.terpeneTarget.label': 'Terpène dominant visé',

    // --- Bande "Les six chimiotypes" (bas de page) ---------------------------
    'chemotypeShowcase.title': 'Les six chimiotypes modélisés',
    'chemotypeShowcase.description':
      "Le locus B (synthase THCA/CBDA), ses deux loci épistatiques en amont (O et P), et le locus C (CBC-synthase, indépendant) déterminent six profils cannabinoïdes distincts, tous représentés dans le moteur de croisement.",
    'chemotypeShowcase.thcMean': 'THC moyen ≈ {{value}}%',
    'chemotypeShowcase.cbnNote.title': 'Et le CBN (cannabinol) ?',
    'chemotypeShowcase.cbnNote.description':
      "Le CBN n'est volontairement modélisé nulle part ici : ce n'est pas un cannabinoïde produit par une synthase du plant, mais le produit d'une dégradation OXYDATIVE NON ENZYMATIQUE du THC après récolte. L'oxygène — accéléré par la lumière, la chaleur et un pH acide — transforme progressivement le THC en CBN pendant le séchage et le stockage de la fleur (≈2,5% de conversion après 1 an de stockage à température ambiante, ≈14% après 4 ans). Deux plants génétiquement identiques peuvent donc afficher un taux de CBN très différent selon la seule façon dont leur récolte a été séchée et stockée — ce n'est pas un trait héréditaire, donc pas un chimiotype simulable par croisement.",
  },

  en: {
    // --- App shell / header -------------------------------------------
    'app.eyebrow': 'Applied quantitative genetics for cannabis',
    'app.title': 'Lignée',
    'app.subtitle': 'A crossbreeding workshop to watch, generation after generation, how chemotype is inherited.',
    'app.description':
      'Plant founders, cross them, and track the segregation of the B locus (THCA/CBDA synthase) across your lineages — a simplified model of the full quantitative genetics engine.',
    'app.footer.disclaimer':
      'Lignée — an educational simulation of quantitative genetics. Not a cultivation or production guide.',

    // --- Key stats strip (header) ---------------------------------
    'app.stats.varieties_one': '{{n}} catalogued variety',
    'app.stats.varieties_other': '{{n}} catalogued varieties',
    'app.stats.chemotypes_one': '{{n}} modeled chemotype',
    'app.stats.chemotypes_other': '{{n}} modeled chemotypes',
    'app.stats.loci_one': '{{n}} simulated genetic locus',
    'app.stats.loci_other': '{{n}} simulated genetic loci',

    // --- Language switcher ---------------------------------------------
    'languageSwitcher.french': 'French',
    'languageSwitcher.english': 'English',

    // --- Catalog (left column) --------------------------------------
    'founder.panel.title': 'New founder',
    'catalog.export': '💾 Save (.json)',
    'catalog.import': '📂 Load (.json)',
    'catalog.import.success': '{{n}} specimens loaded.',
    'catalog.import.error': 'Could not import: {{message}}',
    'catalog.deleteMode.enter': '🗑 Delete specimens',
    'catalog.deleteMode.cancel': 'Cancel deletion',
    'catalog.deleteMode.confirm': 'Delete ({{n}})',
    'catalog.archived.show': '📦 Show archived ({{n}})',
    'catalog.archived.hide': 'Hide archived',
    'catalog.count_one': '{{n}} specimen in the catalog — click to select a parent (up to two) and view its detail',
    'catalog.count_other': '{{n}} specimens in the catalog — click to select a parent (up to two) and view its detail',
    'catalog.generation': 'Generation {{n}}',
    'catalog.empty.title': 'The catalog is empty',
    'catalog.empty.step1': 'Plant a founder above',
    'catalog.empty.step2': 'Select two parents and cross them',
    'catalog.empty.step3': 'Watch segregation unfold across generations',

    // --- Cross --------------------------------------------------------
    'cross.title': 'Cross',
    'cross.chooseSpecimen': 'Choose a specimen',
    'cross.sameSexWarning':
      'Both selected parents are the same sex — a real-world cross needs a male and a female. The simulation still runs (genotype only) but does not represent biological pollination.',
    'cross.reversedFemaleNote':
      "One of the two females is marked as 'reversed' (simulated pollen) — offspring will be 100% female, just like a real chemical reversal. The engine computes this automatically from both parents' XX sex.",
    'cross.offspringLabel': 'Offspring',
    'cross.pollinateButton': 'Pollinate',

    // --- Latest batch -----------------------------------------------
    'lastBatch.title': 'Latest batch',
    'lastBatch.count': '{{n}} offspring — segregation observed at the B locus',

    // --- Specimen sheet (right column) --------------------------------
    'specimen.sheetTitle': 'Specimen sheet',
    'specimen.pigment.label': 'Pigment {{a}}/{{b}}',
    'specimen.pigment.expressed': 'purple expressed',
    'specimen.pigment.carrier': 'hidden carrier',
    'specimen.pigment.green': 'green',
    'specimen.autoflower': 'autoflowering',
    'specimen.portraitCaption': 'Portrait generated from the genotype — an illustration, not a photo',
    'specimen.vigorTraitDescription':
      'Demonstration polygenic trait (8 additive loci + environmental noise) — illustrates quantitative inheritance, as opposed to simple Mendelian segregation at the B locus.',
    'specimen.cultivationSheet.title': 'Cultivation sheet',
    'specimen.cultivationSheet.openLibrary':
      'Variety "{{name}}" from the open library — no verified cultivation sheet yet (only the chemotype was kept from a public dataset). See the README to fill it in by hand.',
    'specimen.cultivationSheet.hybrid':
      'Hybrid resulting from a cross — no cultivation sheet of its own. Its real growing characteristics would depend on selection over several generations, not just the parents\' genotype.',
    'specimen.cultivationSheet.customFounder': 'Custom founder — no associated cultivation sheet.',
    'specimen.nutrients.title': 'Nutrient needs',
    'specimen.yield.title': 'Estimated yield',
    'specimen.notes.title': 'Quick note',
    'specimen.notes.placeholder': "A keyword, a reminder — for real dated tracking, see the journal below.",
    'journal.title': 'Journal',
    'journal.form.open': '+ Add an observation',
    'journal.form.cancel': 'Cancel',
    'journal.form.date': 'Date',
    'journal.form.stage': 'Stage',
    'journal.form.stageUnset': '—',
    'journal.form.height': 'Measured height (cm)',
    'journal.form.heightPlaceholder': 'e.g. 42',
    'journal.form.issues': 'Issues observed',
    'journal.form.issuesPlaceholder': 'e.g. nitrogen deficiency, yellowing leaves',
    'journal.form.actions': 'Actions taken',
    'journal.form.actionsPlaceholder': 'e.g. EC adjustment, lower leaves trimmed',
    'journal.form.text': 'Observation',
    'journal.form.textPlaceholder': "Free description of the plant's state, context, measurements…",
    'journal.form.submit': 'Save this observation',
    'journal.empty': 'No observation recorded for this specimen yet.',
    'journal.deleteEntry': 'Delete this observation',
    'journal.export': '💾 Export journal (.txt)',
    'journal.export.header': 'Journal — {{name}}',
    'journal.export.genotype': 'Genotype',
    'specimen.cloneButton': '🌿 Clone',
    'specimen.cloneButtonTitle': 'Create an exact genetic copy (clone/cutting) of this specimen',
    'specimen.deleteButton': '🗑',
    'specimen.deleteButtonTitle': 'Delete this specimen from the catalog',
    'specimen.archiveButton': '📦 Archive',
    'specimen.archiveButtonTitle': 'Hide this specimen from the default view without deleting it',
    'specimen.unarchiveButton': 'Unarchive',
    'specimen.unarchiveButtonTitle': 'Bring this specimen back into the default view',
    'specimen.archivedNote': 'Archived — hidden from the catalog\'s default view.',
    'specimen.clonedFrom': 'Clone of {{name}} — identical genotype',
    'specimen.ancestry.title': 'Ancestry',
    'specimen.selectPrompt': 'Select a specimen in the catalog to see its sheet and ancestry.',
    'specimen.selectPrompt.emptyCatalog': 'No specimen planted yet — start with the "{{formTitle}}" form in the left column.',

    // --- Founder form --------------------------------------------
    'founderForm.variety.label': 'Variety',
    'founderForm.variety.exactRateUnpublished': 'exact rate not published',
    'founderForm.variety.openLibraryNote':
      'Variety from the open library — no verified cultivation sheet for now (only the chemotype is kept). Chemotype: {{chemotype}}.',
    'founderForm.chemotype.label': 'Chemotype',
    'founderForm.chemotype.short.I': 'THC dominant',
    'founderForm.chemotype.short.II': 'mixed',
    'founderForm.chemotype.short.III': 'CBD dominant',
    'founderForm.chemotype.short.IV': 'CBG dominant',
    'founderForm.chemotype.short.V': 'fiber hemp',
    'founderForm.chemotype.short.VI': 'CBC dominant',
    'founderForm.sex.label': 'Sex',
    'founderForm.sex.female': 'Female ♀',
    'founderForm.sex.male': 'Male ♂',
    'founderForm.autoflowerCheckbox': 'Ruderalis genetics (autoflowering)',
    'founderForm.violetCheckbox': 'Purple pigmentation (v/v, recessive)',
    'founderForm.propylCheckbox': 'Propyl / "varin" series — THCV/CBDV (pr/pr, recessive)',
    'founderForm.reversedFemaleCheckbox':
      'Chemically reversed (colloidal silver / STS) — produces pollen instead of a male',
    'founderForm.name.label': 'Specimen name',
    'founderForm.name.placeholder': 'e.g. Batch A mother',
    'founderForm.submitButton': 'Plant this founder',

    // --- Custom strain form ---------------------------------------------
    'addStrainForm.panel.title': 'Add a strain',
    'addStrainForm.intro':
      "Save a variety with its full grow sheet — it will show up first in the variety search, alongside the verified strains. Stored only in this browser (exportable as .json below).",
    'addStrainForm.name.label': 'Variety name',
    'addStrainForm.name.placeholder': 'e.g. My house selection',
    'addStrainForm.description.label': 'Short description',
    'addStrainForm.description.placeholder': 'e.g. Resinous hybrid, THC dominant',
    'addStrainForm.origin.label': 'Origin / lineage',
    'addStrainForm.origin.placeholder': 'e.g. Variety A × Variety B',
    'addStrainForm.climate.label': 'Climate',
    'addStrainForm.climate.placeholder': 'e.g. temperate, cool nights late in flowering',
    'addStrainForm.tempPreference.label': 'Temperature preference',
    'addStrainForm.floweringWeeks.label': 'Flowering (weeks)',
    'addStrainForm.totalCycleWeeks.label': 'Total cycle (weeks)',
    'addStrainForm.min': 'min',
    'addStrainForm.max': 'max',
    'addStrainForm.auto': 'auto',
    'addStrainForm.heightRange.label': 'Height',
    'addStrainForm.heightRange.placeholder': 'e.g. 3 to 5 ft (medium size)',
    'addStrainForm.difficulty.label': 'Growing difficulty',
    'addStrainForm.environment.label': 'Environment',
    'addStrainForm.error.nameRequired': 'The variety name is required.',
    'addStrainForm.error.floweringRequired': 'Flowering time (at least the minimum) is required.',
    'addStrainForm.defaultDescription': '{{chemotype}}, custom strain',
    'addStrainForm.defaultOrigin': 'Lineage not specified',
    'addStrainForm.defaultHeight': 'not documented',
    'addStrainForm.submitButton': 'Save this strain',
    'addStrainForm.success': '"{{name}}" added to your strains.',
    'addStrainForm.import.success': '{{n}} strain(s) imported.',
    'addStrainForm.list.count_one': '{{n}} custom strain',
    'addStrainForm.list.count_other': '{{n}} custom strains',
    'addStrainForm.list.deleteTitle': 'Delete "{{name}}"',

    // --- Selection program --------------------------------------------
    'selectionProgram.title': 'Selection program',
    'selectionProgram.description':
      'Choose a goal: the engine chains backcrosses and sibling crosses over several generations to approach it, and logs every step (A × B = C, C × A = D, …).',
    'selectionProgram.chooseSpecimen': 'Choose a specimen',
    'selectionProgram.targetChemotype.label': 'Target chemotype',
    'selectionProgram.indifferent': 'no preference',
    'selectionProgram.minCbd.label': 'Target minimum CBD',
    'selectionProgram.minThc.label': 'Target minimum THC',
    'selectionProgram.minCbg.label': 'Target minimum CBG',
    'selectionProgram.minCbc.label': 'Target minimum CBC',
    'selectionProgram.chemotypeVNote':
      'Chemotype V: cannabinoids virtually absent by definition (P locus at pp) — no threshold to set.',
    'selectionProgram.autoflowerCheckbox': 'Autoflowering',
    'selectionProgram.violetCheckbox': 'Purple pigmentation expressed',
    'selectionProgram.varinCheckbox': 'Propyl / "varin" series expressed (THCV/CBDV)',
    'selectionProgram.trait.height.label': 'Height',
    'selectionProgram.trait.height.low': 'compact',
    'selectionProgram.trait.height.high': 'tall',
    'selectionProgram.trait.cold.label': 'Cold tolerance',
    'selectionProgram.trait.cold.low': 'low',
    'selectionProgram.trait.cold.high': 'hardy',
    'selectionProgram.trait.sun.label': 'Light requirement',
    'selectionProgram.trait.sun.low': 'shade tolerant',
    'selectionProgram.trait.sun.high': 'full sun',
    'selectionProgram.trait.mold.label': 'Mold/mildew resistance',
    'selectionProgram.trait.mold.low': 'susceptible',
    'selectionProgram.trait.mold.high': 'resistant',
    'selectionProgram.trait.option.indifferent': 'No preference',
    'selectionProgram.trait.option.medium': 'medium',
    'selectionProgram.runButton': 'Run the program',
    'selectionProgram.runButton.running': 'Selecting…',
    'selectionProgram.result.goalReached': 'Goal reached in {{n}} step(s).',
    'selectionProgram.result.plateau': 'Program stopped (plateau) after {{n}} step(s) — best result kept.',
    'selectionProgram.result.generationLimit': 'Generation limit reached ({{n}}) — best result kept.',
    'selectionProgram.export.txt': 'Download the lineage (.txt)',
    'selectionProgram.export.json': 'Download the lineage (.json)',
    'selectionProgram.export.png': 'Download the tree (.png)',
    'selectionProgram.parentSlot.female': 'female ♀',
    'selectionProgram.parentSlot.male': 'male ♂',
    'selectionProgram.step.cannabinoids': 'cannabinoids {{value}}%',
    'selectionProgram.step.autoflowerAbbr': 'auto',
    'selectionProgram.step.violetExpressed': 'purple',
    'selectionProgram.step.violetCarrier': 'carrier v',
    'selectionProgram.step.varinExpressed': 'varin',
    'selectionProgram.step.varinCarrier': 'carrier pr',
    'selectionProgram.step.height': 'height {{value}}%',
    'selectionProgram.step.cold': 'cold {{value}}%',
    'selectionProgram.step.sun': 'light {{value}}%',
    'selectionProgram.step.mold': 'mold {{value}}%',
    'selectionProgram.step.score': 'score',

    // --- Cultivation sheet (StrainInfoPanel) ---------------------------------
    'strainInfo.origin': 'Origin',
    'strainInfo.climate': 'Climate',
    'strainInfo.flowering': 'Flowering',
    'strainInfo.totalCycle': 'Total cycle',
    'strainInfo.height': 'Height',
    'strainInfo.environment': 'Environment',
    'strainInfo.difficulty': 'Difficulty',
    'strainInfo.weeks': 'weeks',
    'strainInfo.temperaturePreference': '{{temp}} preference',

    // --- Variety picker (VarietyPicker) -------------------------------
    'varietyPicker.searchPlaceholder': 'Search among 2,800+ varieties…',
    'varietyPicker.clearSelection': 'Clear selection',
    'varietyPicker.results_one': '{{n}} result',
    'varietyPicker.results_other': '{{n}} results',
    'varietyPicker.allVarieties': 'All varieties ({{n}}) — documented first',
    'varietyPicker.noMatch': 'No variety matches.',
    'varietyPicker.fullSheet': 'full sheet',
    'varietyPicker.showMore': 'Show {{shown}} more ({{remaining}} left)…',

    // --- Ancestry (PedigreeTree) ------------------------------------------
    'pedigree.generationAbbr': 'gen. {{n}}',
    'pedigree.selfPollination': 'self-pollination',

    // --- Specimen card (SpecimenCard) -----------------------------------
    'specimenCard.generationAbbr': 'Gen. {{n}}',
    'specimenCard.autoflowerAbbr': 'auto',
    'specimenCard.reversedFemaleAbbr': 'reversed',
    'specimenCard.archivedAbbr': 'archived',
    'specimenCard.violet.expressedTitle': 'Purple pigmentation expressed (v/v)',
    'specimenCard.violet.carrierTitle': 'Hidden carrier of the purple trait (V/v)',
    'specimenCard.violet.expressed': 'purple',
    'specimenCard.violet.carrier': 'carrier v',

    // --- Resin (ResinSwatch) ------------------------------------------------
    'resinSwatch.residual': 'residual THC/CBD',
    'resinSwatch.cannabinoidsApprox': 'Cannabinoids ≈ {{value}}%',
    'resinSwatch.hempFiber': 'fiber hemp',

    // --- Vigor gauge (VigorGauge) ---------------------------------------
    'vigorGauge.label': 'Vigor',
    'vigorGauge.rawValueTitle': 'Simulated raw value: {{value}}',

    // --- Vigor distribution (VigorDistribution) -------------------------
    'vigorDistribution.title': 'Vigor distribution',
    'vigorDistribution.mean': 'mean {{value}}%',
    'vigorDistribution.low': 'low',
    'vigorDistribution.high': 'high',
    'vigorDistribution.bucketTitle_one': '{{lo}}–{{hi}}% — {{n}} specimen',
    'vigorDistribution.bucketTitle_other': '{{lo}}–{{hi}}% — {{n}} specimens',

    // --- Enum values (variety library) — closed set, safe to translate
    'enum.tempPreference.fraîche': 'cool',
    'enum.tempPreference.tempérée': 'temperate',
    'enum.tempPreference.chaude': 'warm',
    'enum.difficulty.débutant': 'beginner',
    'enum.difficulty.intermédiaire': 'intermediate',
    'enum.difficulty.avancé': 'advanced',
    'enum.environment.intérieur': 'indoor',
    'enum.environment.extérieur': 'outdoor',
    'enum.environment.intérieur/extérieur': 'indoor/outdoor',
    'enum.terpene.myrcene': 'Myrcene',
    'enum.terpene.limonene': 'Limonene',
    'enum.terpene.pinene': 'Pinene',
    'enum.terpene.linalool': 'Linalool',
    'enum.terpene.caryophyllene': 'Caryophyllene',
    'enum.terpene.humulene': 'Humulene',
    'enum.terpene.terpinolene': 'Terpinolene',

    // --- Terpene profile / chemovar (TerpeneProfile) -----------------------
    'terpeneProfile.title': 'Terpene profile',
    'terpeneProfile.chemovarLabel': 'Chemovar',
    'terpeneProfile.terpinoleneDominantNote':
      'Dominant terpinolene (t/t) — a rare recessive trait, found in roughly 14% of cultivars.',
    'terpeneProfile.terpinoleneCarrierNote': 'Hidden carrier of dominant terpinolene (T/t).',
    'terpeneProfile.randomDisclaimer':
      'Profile generated/inherited by the engine (polygenic traits + simulated loci) — no real lab data per variety.',
    'terpeneProfile.otherTerpenes': 'Other: {{list}}',

    // --- Selection program — terpene goal -------------------------
    'selectionProgram.terpeneTarget.label': 'Target dominant terpene',

    // --- "Six chemotypes" strip (page footer) ---------------------------
    'chemotypeShowcase.title': 'The six modeled chemotypes',
    'chemotypeShowcase.description':
      'The B locus (THCA/CBDA synthase), its two upstream epistatic loci (O and P), and the C locus (CBC synthase, independent) produce six distinct cannabinoid profiles, all represented in the crossbreeding engine.',
    'chemotypeShowcase.thcMean': 'Average THC ≈ {{value}}%',
    'chemotypeShowcase.cbnNote.title': 'What about CBN (cannabinol)?',
    'chemotypeShowcase.cbnNote.description':
      "CBN is deliberately modeled nowhere here: it is not a cannabinoid produced by a synthase in the living plant, but the product of NON-ENZYMATIC OXIDATIVE degradation of THC after harvest. Oxygen — accelerated by light, heat and an acidic pH — gradually converts THC into CBN while the flower is dried and stored (≈2.5% conversion after 1 year of storage at room temperature, ≈14% after 4 years). Two genetically identical plants can therefore show very different CBN levels depending solely on how their harvest was dried and stored — it is not a heritable trait, so not a chemotype that crossbreeding can simulate.",
  },
} as const satisfies Record<Language, Record<string, string>>;

export type TranslationKey = keyof (typeof translations)['fr'];
