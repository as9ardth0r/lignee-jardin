import { forwardRef } from 'react';
import type { ProgramStep } from '../engine/selectionProgram';

interface Props {
  steps: ProgramStep[];
  bestLabel?: string;
}

interface LayoutNode {
  label: string;
  col: number;
  row: 0 | 1;
  sex?: 'F' | 'M';
  isFounder: boolean;
  matchesGoal: boolean;
}

interface LayoutEdge {
  from: string;
  to: string;
}

const COL_WIDTH = 128;
const ROW_HEIGHT = 56;
const BOX_W = 108;
const BOX_H = 32;
const MARGIN = 16;

const sexSymbol: Record<string, string> = { F: '♀', M: '♂' };

/**
 * Construit une mise en page en grille (colonne = étape, ligne = 0
 * "principal" / 1 "fratrie") à partir de la chaîne linéaire du
 * programme de sélection — pas un algorithme de layout générique,
 * la structure produite par runSelectionProgram est assez régulière
 * (au plus 2 individus nouveaux par étape) pour s'en passer.
 */
function buildLayout(steps: ProgramStep[]) {
  const nodes = new Map<string, LayoutNode>();
  const edges: LayoutEdge[] = [];
  if (steps.length === 0) return { nodes, edges, cols: 0 };

  nodes.set(steps[0].parentALabel, {
    label: steps[0].parentALabel,
    col: 0,
    row: 0,
    isFounder: true,
    matchesGoal: false,
  });
  nodes.set(steps[0].parentBLabel, {
    label: steps[0].parentBLabel,
    col: 0,
    row: 1,
    isFounder: true,
    matchesGoal: false,
  });

  steps.forEach((s, i) => {
    const col = i + 1;
    if (!nodes.has(s.label)) {
      nodes.set(s.label, {
        label: s.label,
        col,
        row: 0,
        sex: s.individual.sex,
        isFounder: false,
        matchesGoal: s.matchesGoal,
      });
    }
    edges.push({ from: s.parentALabel, to: s.label });
    edges.push({ from: s.parentBLabel, to: s.label });

    if (s.siblingPartnerLabel && !nodes.has(s.siblingPartnerLabel)) {
      nodes.set(s.siblingPartnerLabel, {
        label: s.siblingPartnerLabel,
        col,
        row: 1,
        isFounder: false,
        matchesGoal: false,
      });
      edges.push({ from: s.parentALabel, to: s.siblingPartnerLabel });
      edges.push({ from: s.parentBLabel, to: s.siblingPartnerLabel });
    }
  });

  const cols = Math.max(...Array.from(nodes.values()).map((n) => n.col)) + 1;
  return { nodes, edges, cols };
}

function center(node: LayoutNode) {
  return {
    x: MARGIN + node.col * COL_WIDTH + BOX_W / 2,
    y: MARGIN + node.row * ROW_HEIGHT + BOX_H / 2,
  };
}

/**
 * Arbre généalogique visuel du programme de sélection : fondateurs à
 * gauche, chaque génération dans sa propre colonne, ligne du bas
 * réservée aux partenaires "fratrie" — pour voir d'un coup d'œil
 * d'où vient chaque individu plutôt que de reconstituer la chaîne à
 * partir du texte étape par étape.
 */
export const ProgramPedigreeDiagram = forwardRef<SVGSVGElement, Props>(function ProgramPedigreeDiagram(
  { steps, bestLabel },
  ref
) {
  const { nodes, edges, cols } = buildLayout(steps);
  if (nodes.size === 0) return null;

  const width = MARGIN * 2 + cols * COL_WIDTH;
  const height = MARGIN * 2 + 2 * ROW_HEIGHT;

  return (
    <div className="overflow-x-auto rounded" style={{ background: 'var(--color-canopy-950)' }}>
      <svg ref={ref} width={width} height={height} role="img" aria-label="Arbre généalogique du programme de sélection">
        {edges.map((e, i) => {
          const from = nodes.get(e.from);
          const to = nodes.get(e.to);
          if (!from || !to) return null;
          const p1 = center(from);
          const p2 = center(to);
          const midX = (p1.x + p2.x) / 2;
          return (
            <path
              key={i}
              d={`M ${p1.x + BOX_W / 2} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x - BOX_W / 2} ${p2.y}`}
              fill="none"
              stroke="var(--color-canopy-600)"
              strokeWidth={1.5}
            />
          );
        })}
        {Array.from(nodes.values()).map((n) => {
          const c = center(n);
          const isBest = bestLabel != null && n.label === bestLabel;
          const fill = n.isFounder
            ? 'var(--color-canopy-700)'
            : n.matchesGoal
              ? 'var(--color-leaf-500)'
              : 'var(--color-canopy-800)';
          const textColor = n.matchesGoal && !n.isFounder ? 'var(--color-ink-900)' : 'var(--color-paper-100)';
          return (
            <g key={n.label}>
              <rect
                x={c.x - BOX_W / 2}
                y={c.y - BOX_H / 2}
                width={BOX_W}
                height={BOX_H}
                rx={6}
                fill={fill}
                stroke={isBest ? 'var(--color-resin-500)' : 'transparent'}
                strokeWidth={isBest ? 2 : 0}
              />
              <text
                x={c.x}
                y={c.y + 4}
                textAnchor="middle"
                fontSize={10.5}
                fill={textColor}
              >
                {n.label.length > 14 ? `${n.label.slice(0, 13)}…` : n.label}
                {n.sex ? ` ${sexSymbol[n.sex]}` : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

/**
 * Sérialise un noeud <svg> vers un PNG téléchargeable — résout
 * d'abord les `var(--color-...)` en valeurs calculées, car un SVG
 * exporté seul (hors du DOM de l'app) ne voit plus les variables CSS
 * définies dans la feuille de style de l'app et les perdrait sinon.
 * Rendu à échelle ×2 pour rester net une fois imprimé/zoomé.
 */
export async function exportPedigreePng(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const rootStyle = getComputedStyle(document.documentElement);
  const resolveVars = (value: string) =>
    value.replace(/var\((--[a-z0-9-]+)\)/gi, (_, name) => rootStyle.getPropertyValue(name).trim() || '#000');

  clone.querySelectorAll('[fill], [stroke]').forEach((el) => {
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    if (fill && fill.includes('var(')) el.setAttribute('fill', resolveVars(fill));
    if (stroke && stroke.includes('var(')) el.setAttribute('stroke', resolveVars(stroke));
  });
  const bg = rootStyle.getPropertyValue('--color-canopy-950').trim() || '#0a1a0a';

  const width = Number(svg.getAttribute('width')) || svg.clientWidth;
  const height = Number(svg.getAttribute('height')) || svg.clientHeight;
  const scale = 2;

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = svgUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
