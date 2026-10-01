/**
 * Emblème de Lignée · Jardin : une jeune pousse à deux feuilles dont la
 * tige est une courte double hélice d'ADN (la « lignée »), sortant d'une
 * butte de terre striée comme une planche de potager, avec une goutte
 * d'eau (le bilan hydrique) et trois grains N, P, K.
 * Génère les SVG sources de toutes les icônes et du splash ; le rendu
 * PNG/JPG se fait ensuite avec un navigateur sans tête (voir README,
 * section « Icônes »).
 *
 *   node scripts/generate-brand.mjs  →  assets/brand/*.svg + public/favicon.svg
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const C = {
  bg: '#152218',
  bgDeep: '#0f1a12',
  gold: '#d9ae52',
  leaf: '#6fa35a',
  leafLight: '#a8cf86',
  leafDeep: '#3f6a34',
  soil: '#8a6a44',
  soilDeep: '#5a4329',
  soilLight: '#a8865c',
  water: '#5a9ac8',
  waterLight: '#9cc8e8',
  paper: '#faf7ee',
};

/** Emblème seul, dans un repère 512×512 centré. */
export function emblem() {
  // Butte de terre (une planche vue de profil), sillons clairs.
  const mound = `<path d="M 70 430 C 120 360 392 360 442 430 Z" fill="${C.soil}" stroke="${C.soilDeep}" stroke-width="5" stroke-linejoin="round"/>
    ${[0, 1, 2].map((i) => `<path d="M ${140 + i * 10} ${412 - i * 16} C ${200} ${398 - i * 16} ${312} ${398 - i * 16} ${372 - i * 10} ${412 - i * 16}" fill="none" stroke="${C.soilLight}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`).join('')}`;

  // Tige en double hélice, de la butte jusqu'aux feuilles.
  const hx = 256;
  const hTop = 196;
  const hBottom = 372;
  const amp = 15;
  const turns = 1.8;
  const strand = (phase) => {
    const p = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const y = hBottom - t * (hBottom - hTop);
      const x = hx + amp * (1 - t * 0.35) * Math.sin(phase + t * turns * 2 * Math.PI);
      p.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return 'M' + p.join(' L');
  };
  const rungs = [];
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    const y = hBottom - t * (hBottom - hTop);
    const a = amp * (1 - t * 0.35);
    const sn = Math.sin(t * turns * 2 * Math.PI);
    if (Math.abs(sn) < 0.45) continue;
    rungs.push(`<line x1="${(hx + a * sn).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(hx - a * sn).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.gold}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>`);
  }

  // Deux cotylédons charnus.
  const leaf = (dir) => {
    const s = dir;
    return `<g transform="translate(256 200) scale(${s} 1)">
      <path d="M 0 0 C 30 -70 110 -96 176 -78 C 160 -10 84 34 0 0 Z" fill="${C.leaf}" stroke="${C.leafDeep}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M 6 -4 C 60 -30 112 -54 160 -72" fill="none" stroke="${C.leafLight}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
    </g>`;
  };

  // Goutte d'eau et trois grains N, P, K.
  const drop = `<g transform="translate(372 286) scale(0.85)">
      <path d="M 0 -40 C 18 -14 30 2 30 20 C 30 38 16 50 0 50 C -16 50 -30 38 -30 20 C -30 2 -18 -14 0 -40 Z" fill="${C.water}" stroke="#2f6a96" stroke-width="4"/>
      <path d="M -14 18 C -14 8 -8 0 -2 -8" fill="none" stroke="${C.waterLight}" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  const grains = [
    [140, 378, C.leafDeep],
    [172, 372, '#b4561a'],
    [156, 349, '#7a5aa8'],
  ]
    .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="15" fill="${c}" stroke="${C.paper}" stroke-width="3"/>`)
    .join('');

  return `
  <g>
    <ellipse cx="256" cy="440" rx="200" ry="12" fill="#000" opacity="0.28"/>
    ${drop}
    ${rungs.join('\n    ')}
    <path d="${strand(Math.PI)}" fill="none" stroke="${C.leafDeep}" stroke-width="11" stroke-linecap="round"/>
    <path d="${strand(0)}" fill="none" stroke="${C.gold}" stroke-width="11" stroke-linecap="round"/>
    ${leaf(-1)}${leaf(1)}
    ${mound}
    ${grains}
  </g>`;
}

const bgDefs = `<defs><radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0%" stop-color="#22382a"/><stop offset="100%" stop-color="${C.bgDeep}"/></radialGradient></defs>`;

/** Icône carrée : fond + emblème, `scale` < 1 pour les zones de sécurité. */
function icon({ rounded = true, scale = 1, background = true } = {}) {
  const k = scale;
  const off = 256 * (1 - k);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${bgDefs}
  ${background ? `<rect width="512" height="512" rx="${rounded ? 96 : 0}" fill="url(#g)"/>` : ''}
  <g transform="translate(${off} ${off - 10 * k}) scale(${k})">${emblem()}</g>
</svg>`;
}

/** Splash carré : emblème + nom + sous-titre (fond optionnel). */
function splash(background = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs><radialGradient id="s" cx="50%" cy="42%" r="75%"><stop offset="0%" stop-color="#20362a"/><stop offset="100%" stop-color="${C.bgDeep}"/></radialGradient></defs>
  ${background ? '<rect width="1080" height="1080" fill="url(#s)"/>' : ''}
  <g transform="translate(258 170) scale(1.1)">${emblem()}</g>
  <text x="540" y="790" text-anchor="middle" font-family="Fraunces" font-size="120" fill="${C.paper}" letter-spacing="1">Lignée</text>
  <text x="540" y="856" text-anchor="middle" font-family="Fraunces" font-style="italic" font-size="36" fill="${C.gold}">le carnet de bord</text>
  <text x="540" y="900" text-anchor="middle" font-family="Fraunces" font-style="italic" font-size="36" fill="${C.gold}">du potager</text>
</svg>`;
}

mkdirSync('assets/brand', { recursive: true });
writeFileSync('assets/brand/icon.svg', icon());
writeFileSync('assets/brand/icon-square.svg', icon({ rounded: false }));
writeFileSync('assets/brand/icon-maskable.svg', icon({ rounded: false, scale: 0.72 }));
// Avant-plan de l'icône adaptative Android : capacitor-assets l'insère
// déjà à 16,7 % (il occupe la vue de 72 dp) et le lanceur y applique un
// masque (cercle, carré arrondi…). L'emblème est donc dessiné grand
// (0,84) : assez pour remplir la vue, assez petit pour rester dans le
// cercle de sécurité de 66 dp quel que soit le masque.
writeFileSync('assets/brand/icon-foreground.svg', icon({ rounded: false, scale: 0.84, background: false }));
writeFileSync(
  'assets/brand/icon-background.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${bgDefs}<rect width="512" height="512" fill="url(#g)"/></svg>`
);
writeFileSync('assets/brand/splash.svg', splash());
writeFileSync('assets/brand/splash-transparent.svg', splash(false));
writeFileSync('public/favicon.svg', icon({ scale: 1 }));
console.log('SVG générés dans assets/brand/ et public/favicon.svg');
