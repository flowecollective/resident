import { T } from "../../theme";

export const ProgressBar = ({ value, height = 6, color = T.gold }) => (
  <div style={{ width: "100%", height, borderRadius: height, background: T.creamDark, overflow: "hidden" }}>
    <div
      style={{
        width: `${Math.min(100, value)}%`,
        height: "100%",
        borderRadius: height,
        background: `linear-gradient(90deg, ${color}, ${T.goldLight})`,
        transition: "width .6s ease",
      }}
    />
  </div>
);
