#!/usr/bin/env python3
"""
Construit src/jardin/data/flore.json à partir d'un export CSV de la BDTFX
(référentiel de la flore de France, Tela Botanica, licence CC BY-SA 4.0).

Usage : python3 scripts/build-flore.py chemin/vers/export.csv [date de l'export]

Garde les espèces et sous-espèces retenues (rangs 290 et 320) avec leur nom
français, leur famille (remontée par les taxons supérieurs) et leur statut en
France, plus les synonymes qui y renvoient. Colonnes de l'export utilisées
(numérotées à partir de 0) : 0 num_nom, 1 num_nom_retenu, 2 num_tax_sup,
3 rang, 4 nom_sci, 31 nom_francais, 32 présence en France, 33 statut
d'origine, 34 statut d'introduction, 35 statut de culture.
"""
import csv, json, sys

src = sys.argv[1]
date = sys.argv[2] if len(sys.argv) > 2 else ''
rows = list(csv.reader(open(src, encoding='utf-8'), delimiter=';'))
by = {r[0]: r for r in rows}
KEEP = ('290', '320')


def family(r):
    for _ in range(15):
        if r is None:
            return None
        if r[3] == '180':
            return r[4]
        if r[2]:
            r = by.get(r[2])
        elif r[1] != r[0]:
            r = by.get(r[1])
        else:
            return None
    return None


fams, fam_idx, taxa = [], {}, []
for r in rows:
    if r[0] != r[1] or r[3] not in KEEP:
        continue
    f = family(r) or '?'
    if f not in fam_idx:
        fam_idx[f] = len(fams)
        fams.append(f)
    flags = 0
    if r[32].startswith('P'):
        flags |= 1  # présente en France
    if r[33].startswith('N') or r[33].startswith('E'):
        flags |= 2  # indigène
    if r[34] == 'I':
        flags |= 4  # introduite
    if r[35] == 'C':
        flags |= 8  # cultivée
    taxa.append([int(r[0]), r[4], r[31], fam_idx[f], flags])

kept = {t[0] for t in taxa}
syn = sorted({(r[4], int(r[1])) for r in rows if r[0] != r[1] and r[3] in KEEP and r[1].isdigit() and int(r[1]) in kept and r[4] != by[r[1]][4]})
out = {'source': 'BDTFX (Tela Botanica), CC BY-SA 4.0', 'date': date, 'fam': fams, 't': taxa, 's': [list(s) for s in syn]}
dst = 'src/jardin/data/flore.json'
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'{len(taxa)} taxons, {len(syn)} synonymes, {len(fams)} familles → {dst}')
