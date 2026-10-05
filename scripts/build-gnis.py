#!/usr/bin/env python3
"""
Construit src/jardin/data/gnis.json à partir de l'export CSV de la base des
variétés du Catalogue officiel (GNIS / SEMAE) : uniquement les variétés
potagères (catalogue FR potagères, variétés anciennes pour amateurs dites
« sans valeur intrinsèque », variétés de conservation, et radiées encore
commercialisables des espèces potagères), rattachées aux espèces de l'app.

Usage : python3 scripts/build-gnis.py chemin/vers/Gnis_base_varietes.csv [date]
"""
import csv, json, sys

# Espèce GNIS → espèce de l'app.
SPECIES = {
    'TOMATE': 'tomato', 'LAITUE': 'lettuce', 'MELON': 'melon', 'CHOU-FLEUR': 'cauliflower',
    'PIMENT POIVRON': 'pepper', 'HARICOT NAIN': 'bean', 'HARICOT A RAMES': 'bean',
    'COURGETTE - COURGE': 'zucchini', 'CAROTTE': 'carrot', 'POIS POTAGERS (RIDE, ROND, MANGE-TOUT': 'pea',
    'OIGNON': 'onion', 'OIGNON (BULBILLES)': 'onion', 'AUBERGINE': 'eggplant',
    'CHICOREE FRISEE': 'endive', 'CHICOREE SCAROLE': 'endive', 'CHICOREE A LARGES FEUILLES': 'radicchio',
    'CHICOREE WITLOOF (ENDIVE)': 'witloof', 'CHOU BROCOLI': 'broccoli', 'CHOU CABUS': 'cabbage',
    'CHOU DE MILAN': 'cabbage', 'CHOU ROUGE': 'cabbage', 'CHOU FRISE': 'kale', 'CHOU CHINOIS': 'chinesecabbage',
    'CHOU DE BRUXELLES': 'brussels', 'CHOU NAVET RUTABAGA': 'swede', 'RADIS': 'radish', 'MAIS DOUX': 'sweetcorn',
    'AIL': 'garlic', 'CONCOMBRE': 'cucumber', 'CORNICHON': 'cucumber', 'FRAISIER (PLANTS)': 'strawberry',
    'NAVET': 'turnip', 'PASTEQUE (MELON D EAU)': 'watermelon', 'POIREAU': 'leek', 'FENOUIL': 'fennel',
    'POTIRON- POTIMARRON - GIRAUMON': 'squash', 'POIS CHICHE': 'chickpea',
    'ECHALOTE (MULTIPLICATION VEGETATIVE)': 'shallot', 'ECHALOTE (SEMENCES)': 'shallot', 'ECHALION (SEMENCES)': 'shallot',
    'EPINARD': 'spinach', 'MACHE': 'cornsalad', 'BETTERAVE POTAGERE': 'beet', 'ASPERGE (GRIFFES)': 'asparagus',
    'ASPERGE (SEMENCES)': 'asparagus', 'ARTICHAUT': 'artichoke', 'CELERI': 'celeriac', 'POIREE': 'chard',
    'PERSIL': 'parsley', 'CARDON': 'cardoon', 'CIBOULE': 'welshonion', 'CIBOULETTE': 'chives', 'FEVE': 'broadbean',
    'HARICOT D ESPAGNE': 'runnerbean', 'CERFEUIL': 'chervil', 'LENTILLE': 'lentil', 'POMMES DE TERRE': 'potato',
}
src = sys.argv[1]
date = sys.argv[2] if len(sys.argv) > 2 else ''
rows = list(csv.DictReader(open(src, encoding='utf-8'), delimiter=';'))
out, seen = [], set()
for r in rows:
    sp = SPECIES.get(r['Espèce'])
    liste = r['Liste']
    if not sp:
        continue
    pot = 'potag' in liste.lower() or liste.startswith('Variétés de conservation') or liste.startswith('Radiée')
    if not pot:
        continue
    name = r['Variété'].strip()
    key = (sp, name.upper())
    if not name or key in seen:
        continue
    seen.add(key)
    flags = 0
    if r['Informations complémentaire'] == 'HYBRIDE' or any(r.get(f'TYP_VAR{i}', '').startswith('HYBRIDE') for i in range(1, 6)):
        flags |= 1  # hybride F1
    if 'sans valeur intrinsèque' in liste:
        flags |= 2  # variété ancienne pour amateurs
    if liste.startswith('Variétés de conservation'):
        flags |= 4  # variété de conservation
    if liste.startswith('Radiée'):
        flags |= 8  # radiée, encore commercialisable
    year = int(r["Année d'inscription"] or 0)
    sub = r['Espèce'] if r['Espèce'] in ('HARICOT NAIN', 'HARICOT A RAMES', 'CHICOREE FRISEE', 'CHICOREE SCAROLE', 'CHOU DE MILAN', 'CHOU ROUGE', 'CORNICHON', 'OIGNON (BULBILLES)', 'CELERI') else ''
    out.append([sp, name, flags, year, r['Obtenteur'].strip(), sub])
out.sort(key=lambda v: (v[0], v[1].upper()))
dst = 'src/jardin/data/gnis.json'
json.dump({'source': 'Catalogue officiel français des variétés (GNIS / SEMAE)', 'date': date, 'v': out}, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(out)} variétés potagères → {dst}')
