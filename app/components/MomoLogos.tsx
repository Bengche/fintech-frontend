/**
 * MomoLogos — displays MTN Mobile Money and Orange Money payment method badges.
 * Used on the landing page hero and on the invoice payment page to build
 * immediate trust with Cameroonian users.
 */

interface MomoLogosProps {
  /** "dark" = renders on a dark navy background; "light" = renders on white/cloud */
  theme?: "dark" | "light";
  size?: "sm" | "md";
}

export default function MomoLogos({
  theme = "dark",
  size = "md",
}: MomoLogosProps) {
  const isLight = theme === "light";
  const isSm = size === "sm";

  const wrapStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: isSm ? "0.5rem" : "0.625rem",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: isSm ? "0.7rem" : "0.75rem",
    fontWeight: 600,
    color: isLight ? "var(--color-text-muted)" : "rgba(255,255,255,0.55)",
    marginRight: "0.25rem",
    whiteSpace: "nowrap",
  };

  const badgeBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: isSm ? "0.3rem" : "0.375rem",
    padding: isSm ? "0.25rem 0.55rem" : "0.3rem 0.65rem",
    borderRadius: "999px",
    fontSize: isSm ? "0.7rem" : "0.75rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  const mtnBadge: React.CSSProperties = {
    ...badgeBase,
    background: isLight ? "rgba(255,204,0,0.14)" : "rgba(255,204,0,0.18)",
    border: `1.5px solid rgba(255,204,0,${isLight ? "0.45" : "0.4"})`,
    color: isLight ? "#7a5c00" : "#FFE566",
  };

  const orangeBadge: React.CSSProperties = {
    ...badgeBase,
    background: isLight ? "rgba(255,102,0,0.10)" : "rgba(255,102,0,0.18)",
    border: `1.5px solid rgba(255,102,0,${isLight ? "0.35" : "0.38"})`,
    color: isLight ? "#8a2e00" : "#FFAA66",
  };

  return (
    <div style={wrapStyle}>
      <span style={labelStyle}>Pays via</span>

      {/* MTN Mobile Money */}
      <span style={mtnBadge}>
        <svg
          width={isSm ? 13 : 15}
          height={isSm ? 13 : 15}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="9" fill="#FFCC00" />
          <text
            x="10"
            y="14"
            textAnchor="middle"
            fontSize="7"
            fontWeight="900"
            fill="#0a0a0a"
            fontFamily="system-ui,sans-serif"
          >
            MTN
          </text>
        </svg>
        MTN MoMo
      </span>

      {/* Orange Money */}
      <span style={orangeBadge}>
        <svg
          width={isSm ? 13 : 15}
          height={isSm ? 13 : 15}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="9" fill="#FF6600" />
          <text
            x="10"
            y="14"
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="900"
            fill="#ffffff"
            fontFamily="system-ui,sans-serif"
          >
            OM
          </text>
        </svg>
        Orange Money
      </span>
    </div>
  );
}
