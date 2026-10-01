# Données tomate issues de Tatiana's TOMATObase

`tomatoes-tomatobase.json` est dérivé des fiches de variétés de
**Tatiana's TOMATObase** — https://tatianastomatobase.com — dont le
contenu est publié sous **GNU Free Documentation License 1.2**.

Ce fichier est donc lui-même distribué sous **GNU FDL 1.2**, avec
attribution aux auteurs de Tatiana's TOMATObase (voir l'historique des
pages sur le site source).

## Modifications apportées (exigées par la GFDL)

- Extraction des propriétés : couleur, forme, calibre, usage, port,
  feuille, précocité, pays.
- Exclusion des lignées instables en ségrégation et des noms mal encodés ;
  les hybrides F1 sont conservés et marqués (`x: 1`).
- **Déduction d'un génotype** aux loci du moteur Lignée à partir du
  phénotype déclaré, et **estimation** du poids, des jours, du °Brix et
  du rendement à partir des classes de calibre et de précocité (règles :
  `scripts/tomatobase_to_json.py`).
- Déductions supplémentaires : allèle bicolore de PSY1 (couleur
  « bicolor »), peau pêche (nom contenant peach / fuzzy…), gène Beta
  (oranges « Caro »), alcobaça (long keepers), résistances Ve / I / Mi /
  Tm-2² d'après le code de résistance en fin de nom (V, F, N, T…).
- Dédoublonnage avec les fiches détaillées de `src/engine/tomato/varieties.ts`.

Les photos du site ne sont PAS reprises (leur usage commercial exige
l'accord de chaque auteur).
