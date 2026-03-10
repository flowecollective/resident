import { T } from "../../theme";

export const Btn = ({ children, onClick, variant = "primary", style: s, disabled }) => {
  const v = {
    primary: { background: T.charcoal, color: T.cream, border: "none" },
    outline: { background: "transparent", color: T.charcoal, border: `1.5px solid ${T.creamDark}` },
    gold: { background: T.goldMuted, color: T.gold, border: "none" },
    danger: { background: T.dangerBg, color: T.danger, border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 20px",
        borderRadius: T.radiusSm,
        fontSize: "13px",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 6,
        ...v[variant],
        ...s,
      }}
    >
      {children}
    </button>
  );
};
