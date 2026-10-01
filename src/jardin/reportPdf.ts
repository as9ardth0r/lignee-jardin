/**
 * Rapport de saison en PDF (mode pro), mis en page avec jsPDF, chargé à la
 * demande. Polices standard du PDF (Helvetica) : les caractères hors
 * Windows-1252 (indices, flèches…) sont remplacés.
 */
import { PRODUCT_BY_ID } from './data/products';
import { PROBLEM_BY_ID, REMEDY_BY_ID } from './data/problems';
import { fmtDate, fmtNum, plantTitle, speciesName } from './format';
import { makeTT, type JKey } from './i18n';
import type { GardenData } from './model';
import { reportData } from './engine/report';

const clean = (s: string) =>
  s
    .replace(/₂/g, '2')
    .replace(/₅/g, '5')
    .replace(/²/g, '2')
    .replace(/[→⇒]/g, '->')
    .replace(/≈/g, '~')
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿]️?/gu, '')
    .replace(/ | /g, ' ');

export async function buildReportPdf(data: GardenData, year: number, today: string, lang: 'fr' | 'en'): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const tt = makeTT(lang);
  const r = reportData(data, year, today);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 16;
  let y = M;
  const ink = (c: [number, number, number]) => doc.setTextColor(...c);
  const pageBreak = (need: number) => {
    if (y + need > 297 - M - 6) {
      doc.addPage();
      y = M;
    }
  };
  const text = (s: string, x: number, size = 10, style: 'normal' | 'bold' = 'normal', align: 'left' | 'right' = 'left') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.text(clean(s), x, y, { align });
  };
  const heading = (s: string) => {
    pageBreak(14);
    y += 4;
    ink([47, 94, 42]);
    text(s, M, 13, 'bold');
    ink([30, 30, 30]);
    y += 2;
    doc.setDrawColor(200, 190, 160);
    doc.line(M, y, W - M, y);
    y += 6;
  };
  /** Tableau simple : largeurs en mm, colonnes alignées à droite marquées. */
  const table = (head: string[], widths: number[], rows: string[][], right: boolean[] = []) => {
    const draw = (cells: string[], bold: boolean) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      const lines = cells.map((c, i) => doc.splitTextToSize(clean(c), widths[i] - 2) as string[]);
      const h = Math.max(...lines.map((l) => l.length)) * 3.8 + 1.5;
      pageBreak(h);
      let x = M;
      lines.forEach((l, i) => {
        doc.text(l, right[i] ? x + widths[i] - 1 : x + 1, y, { align: right[i] ? 'right' : 'left' });
        x += widths[i];
      });
      if (bold) {
        // Filet sous l'en-tête, entre la ligne de base et la ligne suivante.
        doc.setDrawColor(220, 214, 196);
        doc.line(M, y + 1.6, M + widths.reduce((a, b) => a + b, 0), y + 1.6);
        y += 1.2;
      }
      y += h;
    };
    draw(head, true);
    for (const row of rows) draw(row, false);
    y += 2;
  };
  const kg = (g: number) => (g >= 1000 ? `${fmtNum(g / 1000, lang, 1)} kg` : `${Math.round(g)} g`);
  const eur = (v: number) => `${fmtNum(v, lang, 2)} EUR`;
  const bedName = (id?: string) => data.beds.find((b) => b.id === id)?.name ?? '';

  // En-tête
  ink([47, 94, 42]);
  text('Lignée Jardin', M, 10, 'bold');
  ink([120, 110, 90]);
  text(tt('report.generated', { date: fmtDate(r.generated, lang, true) }), W - M, 9, 'normal', 'right');
  y += 9;
  ink([20, 30, 20]);
  text(tt('report.title', { year }), M, 20, 'bold');
  y += 7;
  text(r.gardenName, M, 12);
  y += 4;

  heading(tt('report.summary'));
  const facts: Array<[string, string]> = [
    [tt('report.beds'), String(r.beds)],
    [tt('report.crops'), String(r.plants)],
    [tt('season.harvested'), kg(r.season.grams)],
    [tt('season.value'), eur(r.season.value)],
    [tt('season.inputs'), eur(r.season.inputsCost)],
    [tt('report.irrigation'), `${Math.round(r.waterLiters)} L`],
    [tt('report.rain'), `${fmtNum(r.rainMm, lang, 0)} mm`],
  ];
  for (const [k, v] of facts) {
    pageBreak(6);
    text(k, M, 10);
    text(v, M + 80, 10, 'bold');
    y += 5.5;
  }

  heading(tt('report.harvests'));
  if (r.season.rows.length) {
    table(
      [tt('season.col.crop'), tt('season.col.weight'), tt('season.col.perM2'), tt('season.col.price'), tt('season.col.value')],
      [62, 30, 30, 26, 30],
      r.season.rows.map((x) => [speciesName(x.speciesId, lang), kg(x.grams), x.area > 0 ? `${fmtNum(x.grams / 1000 / x.area, lang, 1)} kg` : '-', fmtNum(x.priceKg, lang, 2), eur(x.value)]),
      [false, true, true, true, true],
    );
  } else {
    text(tt('report.none'), M, 9);
    y += 6;
  }

  if (r.forecast.length) {
    heading(tt('report.forecast'));
    table(
      [tt('season.col.crop'), tt('report.bed'), tt('report.window'), tt('report.expected'), tt('report.remaining')],
      [52, 32, 44, 25, 25],
      r.forecast.map((f) => {
        const p = data.plants.find((x) => x.id === f.plantId);
        return [p ? plantTitle(p, lang) : speciesName(f.speciesId, lang), bedName(f.bedId), `${fmtDate(f.from, lang, f.from.slice(0, 4) !== String(year))} - ${fmtDate(f.to, lang, f.to.slice(0, 4) !== String(year))}`, `${fmtNum(f.expectedKg, lang, 1)} kg`, `${fmtNum(f.remainingKg, lang, 1)} kg`];
      }),
      [false, false, false, true, true],
    );
  }

  heading(tt('report.feeds'));
  if (r.applications.length) {
    table(
      [tt('csv.date'), tt('report.bed'), tt('csv.product'), tt('csv.amount'), tt('csv.cost')],
      [24, 36, 62, 30, 26],
      r.applications.map((a) => [fmtDate(a.date, lang), bedName(a.bedId), PRODUCT_BY_ID[a.productId]?.name[lang] ?? a.productId, `${a.amount} ${PRODUCT_BY_ID[a.productId]?.kind === 'liquid' ? 'mL' : 'g'}`, a.cost ? eur(a.cost) : '']),
      [false, false, false, true, true],
    );
  } else {
    text(tt('report.none'), M, 9);
    y += 6;
  }

  heading(tt('report.treatments'));
  if (r.treatments.length) {
    table(
      [tt('csv.date'), tt('csv.plant'), tt('csv.problem'), tt('csv.method'), tt('csv.note')],
      [22, 40, 42, 44, 30],
      r.treatments.map((t) => {
        const p = data.plants.find((x) => x.id === t.plantId);
        return [fmtDate(t.date, lang), p ? plantTitle(p, lang) : bedName(t.bedId), PROBLEM_BY_ID[t.problemId]?.name[lang] ?? t.problemId, t.remedyId ? REMEDY_BY_ID[t.remedyId]?.name[lang] ?? '' : tt(`method.${t.method}` as JKey), t.note ?? ''];
      }),
    );
  } else {
    text(tt('report.none'), M, 9);
    y += 6;
  }

  pageBreak(20);
  y += 4;
  ink([120, 110, 90]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(clean(tt('report.disclaimer')), W - 2 * M) as string[], M, y);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    ink([150, 140, 120]);
    doc.text(clean(`${r.gardenName} - ${year}`), M, 297 - 8);
    doc.text(`${i} / ${pages}`, W - M, 297 - 8, { align: 'right' });
  }
  return doc.output('blob');
}
