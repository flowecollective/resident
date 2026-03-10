import { T } from "../../theme";

export const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: T.textMuted, marginBottom: 6 }}>
      {label}
    </label>
    {children}
  </div>
);
