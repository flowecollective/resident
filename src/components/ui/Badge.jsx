import { T } from "../../theme";

export const Badge = ({ children, color = T.gold, bg }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      color,
      background: bg || `${color}18`,
    }}
  >
    {children}
  </span>
);
