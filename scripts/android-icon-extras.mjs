/**
 * Complète l'icône adaptative générée par capacitor-assets :
 * - ajoute une couche « monochrome » (icônes à thème d'Android 13+),
 *   tirée de assets/icon-monochrome.png (silhouette blanche sur fond
 *   transparent, même cadrage que l'avant-plan).
 * - crée la petite icône des notifications (`ic_stat_notify`, silhouette
 *   blanche recadrée, 24 dp aux cinq densités).
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
const sharp = (await import('sharp')).default;
const trimmed = await sharp(SRC).trim().toBuffer();
for (const [dir, px] of [['mdpi', 24], ['hdpi', 36], ['xhdpi', 48], ['xxhdpi', 72], ['xxxhdpi', 96]]) {
  const pad = Math.round(px / 12);
  mkdirSync(`${RES}/drawable-${dir}`, { recursive: true });
  await sharp(trimmed)
    .resize(px - 2 * pad, px - 2 * pad, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`${RES}/drawable-${dir}/ic_stat_notify.png`);
}
console.log('Icône monochrome (Android 13+) et icône de notification ajoutées.');
