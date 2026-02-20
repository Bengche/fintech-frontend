/**
 * FonlokLogo — the official Fonlok brand mark.
 *
 * The icon is a navy rounded square with a geometric custom "F":
 *   - Amber (#F59E0B) top horizontal crossbar — the signature element
 *   - White vertical stroke and middle crossbar
 *
 * The wordmark is "Fonlok" with the F mirroring the amber accent.
 *
 * variant="dark"  → wordmark in navy  (use on white/light backgrounds)
 * variant="light" → wordmark in white (use on navy/dark backgrounds)
 */

interface FonlokLogoProps {
  variant?: "dark" | "light";
  /** Height of the icon mark in px. The wordmark scales to match. Default: 32 */
  iconSize?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function FonlokLogo({
  variant = "dark",
  iconSize = 32,
  style,
  className,
}: FonlokLogoProps) {
  const textColor = variant === "light" ? "#ffffff" : "#0F1F3D";
  const fontSize = iconSize * 0.6875; // 22 / 32 ratio

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: iconSize * 0.3125 + "px", // 10 / 32 ratio
        ...style,
      }}
      className={className}
    >
      {/* ── Icon mark ── */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Background — navy rounded square */}
        <rect width="48" height="48" rx="11" fill="#0F1F3D" />

        {/* Amber top crossbar — the signature brand element */}
        <rect
          x="12.5"
          y="10"
          width="22.5"
          height="7.5"
          rx="3.75"
          fill="#F59E0B"
        />

        {/* White middle crossbar — drawn before vertical so vertical covers left rounded corner */}
        <rect
          x="12.5"
          y="21.5"
          width="15"
          height="5.5"
          rx="2.75"
          fill="#FFFFFF"
        />

        {/* White vertical stroke — drawn last, covers left rounded corners of both crossbars */}
        <rect x="12.5" y="10" width="6.5" height="27.5" rx="3" fill="#FFFFFF" />
      </svg>

      {/* ── Wordmark ── */}
      <span
        style={{
          fontWeight: 800,
          fontSize: fontSize + "px",
          letterSpacing: "-0.025em",
          lineHeight: 1,
          userSelect: "none",
        }}
        aria-label="Fonlok"
      >
        <span style={{ color: "#F59E0B" }}>F</span>
        <span style={{ color: textColor }}>onlok</span>
      </span>
    </span>
  );
}
