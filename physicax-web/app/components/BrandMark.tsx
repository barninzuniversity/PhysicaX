type BrandMarkProps = {
  className?: string;
  decorative?: boolean;
  idPrefix?: string;
};

export function BrandMark({ className, decorative = false, idPrefix = "physicax-brand" }: BrandMarkProps) {
  const shellId = `${idPrefix}-shell`;
  const strokeId = `${idPrefix}-stroke`;
  const monoId = `${idPrefix}-mono`;
  const coreId = `${idPrefix}-core`;
  const glowId = `${idPrefix}-glow`;
  const shadowId = `${idPrefix}-shadow`;

  return (
    <svg
      viewBox="0 0 128 128"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : "PhysicaX brand mark"}
      className={className}
    >
      <defs>
        <linearGradient id={shellId} x1="18" y1="12" x2="109" y2="116" gradientUnits="userSpaceOnUse">
          <stop stopColor="#050c19" />
          <stop offset="0.5" stopColor="#10244A" />
          <stop offset="1" stopColor="#060d17" />
        </linearGradient>
        <linearGradient id={strokeId} x1="26" y1="18" x2="100" y2="107" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="0.48" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id={monoId} x1="34" y1="46" x2="97" y2="91" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fbff" />
          <stop offset="0.65" stopColor="#dbeafe" />
          <stop offset="1" stopColor="#e9d5ff" />
        </linearGradient>
        <radialGradient id={coreId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(49 47) rotate(44.2) scale(33 33)">
          <stop stopColor="#f8fbff" />
          <stop offset="0.33" stopColor="#93eaff" />
          <stop offset="1" stopColor="#1d4ed8" />
        </radialGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(78 33) rotate(131.4) scale(63 45)">
          <stop stopColor="#60a5fa" stopOpacity="0.48" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
        <filter id={shadowId} x="4" y="4" width="120" height="120" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#020617" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        <rect x="12" y="12" width="104" height="104" rx="30" fill={`url(#${shellId})`} />
        <rect x="12.75" y="12.75" width="102.5" height="102.5" rx="29.25" stroke="rgba(191,219,254,0.18)" />
        <circle cx="92" cy="34" r="36" fill={`url(#${glowId})`} />
        <circle cx="36" cy="33" r="2.2" fill="#dbeafe" fillOpacity="0.85" />
        <circle cx="98" cy="47" r="2.6" fill="#c4b5fd" fillOpacity="0.95" />
        <circle cx="86" cy="28" r="1.7" fill="#f8fbff" fillOpacity="0.75" />

        <path
          d="M28 90C35 72 50 61 67 57C82 53 94 47 102 35"
          stroke={`url(#${strokeId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        <g transform="rotate(-17 64 64)">
          <ellipse cx="66" cy="43" rx="35" ry="12.5" stroke={`url(#${strokeId})`} strokeWidth="4.5" />
          <ellipse cx="61" cy="83" rx="28" ry="10.5" stroke={`url(#${strokeId})`} strokeWidth="3" strokeOpacity="0.72" />
          <circle cx="97" cy="49" r="5.4" fill="#c4b5fd" />
        </g>

        <circle cx="49" cy="49" r="20.5" fill={`url(#${coreId})`} />
        <circle cx="43" cy="41.5" r="6.4" fill="#f8fbff" fillOpacity="0.82" />
        <circle cx="49" cy="49" r="25.5" stroke="rgba(147,234,255,0.18)" />

        <path
          d="M37 91V39.5H54.2C64.4 39.5 71 45 71 53.8C71 62.9 64.25 68.15 54.2 68.15H46.95V91H37ZM46.95 59.95H53.8C59.25 59.95 62.65 57.6 62.65 53.8C62.65 50.05 59.25 47.65 53.8 47.65H46.95V59.95Z"
          fill={`url(#${monoId})`}
        />
        <path
          d="M71.5 88.6L82.1 74.4L71.95 60.1H79.55L86.35 69.9L93.4 60.1H100.8L90.6 74.4L101.35 88.6H93.55L86.2 78.1L78.9 88.6H71.5Z"
          fill={`url(#${monoId})`}
        />
      </g>
    </svg>
  );
}
