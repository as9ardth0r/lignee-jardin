/**
 * Feuille botanique en art linéaire, générée paramétriquement
 * (scripts/generate-leaf.mjs) — motif de la planche d'herbier,
 * réutilisé comme fioriture discrète (fond de section, filigrane).
 */
export function LeafMark({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="-220 -230 440 260"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden="true"
    >
      <g transform="rotate(-68)">
        <path d="M 0 0 L 8.6 -16.9 L 18.6 -33.7 L 9.5 -50.6 L 13.9 -67.4 L 5.2 -84.3 L 4.6 -101.1 L 0 -118 L 0 -118 L -4.6 -101.1 L -5.2 -84.3 L -13.9 -67.4 L -9.5 -50.6 L -18.6 -33.7 L -8.6 -16.9 L 0 0 Z" />
      </g>
      <g transform="rotate(-42)">
        <path d="M 0 0 L 10 -17.6 L 23.3 -35.1 L 13.2 -52.7 L 22.2 -70.2 L 10.3 -87.8 L 14.2 -105.3 L 5.2 -122.9 L 4.6 -140.4 L 0 -158 L 0 -158 L -4.6 -140.4 L -5.2 -122.9 L -14.2 -105.3 L -10.3 -87.8 L -22.2 -70.2 L -13.2 -52.7 L -23.3 -35.1 L -10 -17.6 L 0 0 Z" />
      </g>
      <g transform="rotate(-20)">
        <path d="M 0 0 L 11.6 -21.1 L 26.9 -42.2 L 15.3 -63.3 L 25.6 -84.4 L 11.8 -105.6 L 16.4 -126.7 L 6 -147.8 L 5.3 -168.9 L 0 -190 L 0 -190 L -5.3 -168.9 L -6 -147.8 L -16.4 -126.7 L -11.8 -105.6 L -25.6 -84.4 L -15.3 -63.3 L -26.9 -42.2 L -11.6 -21.1 L 0 0 Z" />
      </g>
      <g transform="rotate(0)">
        <path d="M 0 0 L 11.2 -18.6 L 27.2 -37.3 L 16.3 -55.9 L 29.2 -74.6 L 14.8 -93.2 L 23.4 -111.8 L 10.5 -130.5 L 14.3 -149.1 L 5.2 -167.7 L 4.6 -186.4 L 0 -205 L 0 -205 L -4.6 -186.4 L -5.2 -167.7 L -14.3 -149.1 L -10.5 -130.5 L -23.4 -111.8 L -14.8 -93.2 L -29.2 -74.6 L -16.3 -55.9 L -27.2 -37.3 L -11.2 -18.6 L 0 0 Z" />
      </g>
      <g transform="rotate(20)">
        <path d="M 0 0 L 11.6 -21.1 L 26.9 -42.2 L 15.3 -63.3 L 25.6 -84.4 L 11.8 -105.6 L 16.4 -126.7 L 6 -147.8 L 5.3 -168.9 L 0 -190 L 0 -190 L -5.3 -168.9 L -6 -147.8 L -16.4 -126.7 L -11.8 -105.6 L -25.6 -84.4 L -15.3 -63.3 L -26.9 -42.2 L -11.6 -21.1 L 0 0 Z" />
      </g>
      <g transform="rotate(42)">
        <path d="M 0 0 L 10 -17.6 L 23.3 -35.1 L 13.2 -52.7 L 22.2 -70.2 L 10.3 -87.8 L 14.2 -105.3 L 5.2 -122.9 L 4.6 -140.4 L 0 -158 L 0 -158 L -4.6 -140.4 L -5.2 -122.9 L -14.2 -105.3 L -10.3 -87.8 L -22.2 -70.2 L -13.2 -52.7 L -23.3 -35.1 L -10 -17.6 L 0 0 Z" />
      </g>
      <g transform="rotate(68)">
        <path d="M 0 0 L 8.6 -16.9 L 18.6 -33.7 L 9.5 -50.6 L 13.9 -67.4 L 5.2 -84.3 L 4.6 -101.1 L 0 -118 L 0 -118 L -4.6 -101.1 L -5.2 -84.3 L -13.9 -67.4 L -9.5 -50.6 L -18.6 -33.7 L -8.6 -16.9 L 0 0 Z" />
      </g>
    </svg>
  );
}
