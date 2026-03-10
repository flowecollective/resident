import { T } from "../../theme";

export const StagePill = ({ label, stage, stages, colors }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
    <span style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", width: 52, flexShrink: 0 }}>{label}</span>
    <div style={{ display: "flex", gap: 3, flex: 1 }}>
      {stages.map((s, i) => (
        <div key={i} style={{
          flex: 1, height: 6, borderRadius: 3,
          background: i <= stage - 1 ? colors[i] || T.gold : T.creamDark,
          transition: "background .3s",
        }} />
      ))}
    </div>
    <span style={{ fontSize: "10px", fontWeight: 500, color: stage > 0 ? colors[stage - 1] : T.textMuted, minWidth: 60, textAlign: "right" }}>
      {stages[stage]}
    </span>
  </div>
);
