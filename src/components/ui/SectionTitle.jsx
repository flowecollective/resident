import { T } from "../../theme";

export const SectionTitle = ({ children, sub, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
    <div>
      <h2 style={{ fontFamily: T.fontD, fontSize: "26px", fontWeight: 600, color: T.charcoal, lineHeight: 1.2 }}>{children}</h2>
      {sub && <p style={{ color: T.textMuted, fontSize: "13px", marginTop: 4 }}>{sub}</p>}
    </div>
    {action}
  </div>
);
