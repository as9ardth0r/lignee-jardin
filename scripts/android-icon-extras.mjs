/**
 * Complète l'icône adaptative générée par capacitor-assets :
 * - ajoute une couche « monochrome » (icônes à thème d'Android 13+),
 *   tirée de assets/icon-monochrome.png (silhouette blanche sur fond
 *   transparent, même cadrage que l'avant-plan).
 * À lancer après `npx capacitor-assets generate` (voir `npm run android:assets`).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const RES = 'android/app/src/main/res';
const SRC = 'assets/icon-monochrome.png';
if (!existsSync(SRC)) {
  console.error(`${SRC} manquant : régénérez les images (README, section « Icônes »).`);
  process.exit(1);
}
mkdirSync(`${RES}/drawable-nodpi`, { recursive: true });
copyFileSync(SRC, `${RES}/drawable-nodpi/ic_launcher_monochrome.png`);

for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const path = `${RES}/mipmap-anydpi-v26/${name}`;
  if (!existsSync(path)) continue;
  let xml = readFileSync(path, 'utf8');
  if (!xml.includes('<monochrome>')) {
    xml = xml.replace(
      '</adaptive-icon>',
      '    <monochrome>\n        <inset android:drawable="@drawable/ic_launcher_monochrome" android:inset="16.7%" />\n    </monochrome>\n</adaptive-icon>',
    );
    writeFileSync(path, xml);
  }
}
console.log('Icône monochrome ajoutée (Android 13+).');
