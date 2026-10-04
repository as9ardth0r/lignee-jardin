/**
 * Étiquettes de sachets de graines en PDF (planche A4 de 3 × 7 étiquettes
 * de 63,5 × 38,1 mm, format courant des planches autocollantes) : espèce,
 * variété, année de récolte, provenance, faculté germinative, durée de
 * conservation, et pour les lignées créées dans un atelier Lignée, leur
 * origine et leur fiche. jsPDF chargé à la demande, polices standard.
 */
import { SPECIES_BY_ID } from './data/species';
import { SPECIES_EXTRA } from './data/speciesExtra';
import { makeTT } from './i18n';
import type { GardenData, SeedLot } from './model';

const clean = (s: string) =>
  s
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿]️?/gu, '')
    .replace(/[“”«»]/g, '"')
    .replace(/ | /g, ' ')
    .trim();

export async function buildSeedLabelsPdf(data: GardenData, lots: SeedLot[], lang: 'fr' | 'en'): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const tt = makeTT(lang);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const cols = 3;
  const rows = 7;
  const W = 63.5;
  const H = 38.1;
  const left = (210 - cols * W) / 2 - 1.25;
  const top = (297 - rows * H) / 2;
  lots.forEach((lot, i) => {
    const k = i % (cols * rows);
    if (i > 0 && k === 0) doc.addPage();
    const x = left + (k % cols) * (W + 1.25);
    const y = top + Math.floor(k / cols) * H;
    const sp = SPECIES_BY_ID[lot.speciesId];
    const extra = SPECIES_EXTRA[lot.speciesId];
    const variety = data.varieties.find((v) => v.speciesId === lot.speciesId && v.name === lot.varietyName);
    // Cadre discret (repère de découpe si l'on imprime sur papier ordinaire).
    doc.setDrawColor(215, 205, 180);
    doc.setLineWidth(0.2);
    doc.roundedRect(x + 1.5, y + 1.5, W - 3, H - 3, 2, 2);
    doc.setFillColor(47, 94, 42);
    doc.rect(x + 1.5, y + 1.5, 2, H - 3, 'F');
    let ty = y + 7.5;
    doc.setTextColor(25, 35, 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const title = clean(lot.varietyName || sp?.name[lang] || lot.speciesId);
    doc.text((doc.splitTextToSize(title, W - 10) as string[]).slice(0, 1), x + 6, ty);
    ty += 4.5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 85, 70);
    doc.text(clean(`${lot.varietyName ? `${sp?.name[lang] ?? ''} - ` : ''}${sp?.latin ?? ''}`).slice(0, 52), x + 6, ty);
    ty += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);
    const line1 = [tt('label.harvest', { year: lot.year }), lot.source ? clean(lot.source) : ''].filter(Boolean).join(' - ');
    doc.text((doc.splitTextToSize(line1, W - 10) as string[]).slice(0, 1), x + 6, ty);
    ty += 3.8;
    const life = extra?.seedLife;
    const line2 = [life ? tt('label.keep', { year: lot.year + life }) : '', lot.germRate !== undefined ? tt('label.germ', { pct: Math.round(lot.germRate * 100) }) : '', lot.quantity ? clean(lot.quantity) : ''].filter(Boolean).join(' - ');
    if (line2) {
      const l2 = (doc.splitTextToSize(line2, W - 10) as string[]).slice(0, 2);
      doc.text(l2, x + 6, ty);
      ty += 3.4 * l2.length + 0.4;
    }
    const origin = variety?.origin?.startsWith('lignee:') ? tt('label.lignee') : '';
    const note = clean([origin, variety?.note ?? ''].filter(Boolean).join(' : '));
    if (note) {
      doc.setFontSize(6.5);
      doc.setTextColor(90, 85, 70);
      const lines = (doc.splitTextToSize(note, W - 10) as string[]).slice(0, Math.max(1, Math.floor((y + H - 3.5 - ty) / 2.8)));
      doc.text(lines, x + 6, ty);
    }
  });
  return doc.output('blob');
}
