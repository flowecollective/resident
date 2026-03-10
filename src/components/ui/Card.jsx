import { T } from "../../theme";

export const Card = ({ children, style, className = "" }) => (
  <div
    className={className}
    style={{ background: T.white, borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.lightLine}`, ...style }}
  >
    {children}
  </div>
);
