import { T } from "../../theme";

export const Card = ({ children, style, className = "", onClick }) => (
  <div
    className={className}
    onClick={onClick}
    style={{ background: T.white, borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.lightLine}`, ...style }}
  >
    {children}
  </div>
);
