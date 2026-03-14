import { createGlobalStyle } from "styled-components";

export const T = {
  cream: "#FAF8F5",
  creamDark: "#EDE8E0",
  white: "#FFFFFF",
  charcoal: "#2C2C2C",
  charcoalMuted: "#2C2C2C10",
  text: "#333",
  textMuted: "#888",
  gold: "#8C7A55",
  goldLight: "#B8A47E",
  goldMuted: "#8C7A5510",
  lightLine: "#E8E4DE",
  danger: "#d93025",
  success: "#2d8a4e",
  successBg: "#e6f4ea",
  warn: "#e37400",
  educator: "#6B4D94",
  educatorLight: "#EDE5F5",
  fontD: "'Cormorant Garamond', serif",
  fontB: "'Inter', system-ui, sans-serif",
  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "20px",
  shadow: "0 1px 3px rgba(44,44,44,.06)",
  shadowMd: "0 2px 8px rgba(44,44,44,.08)",
};

export const TC = {
  service: { bg: "#8C7A5512", border: "#8C7A5530", text: "#8C7A55" },
  knowledge: { bg: "#2C2C2C08", border: "#2C2C2C20", text: "#666" },
};

export const CAT_COLORS = [
  "#8C7A55",
  "#6B4D94",
  "#2D8A4E",
  "#D4A373",
  "#4A7C7C",
  "#B85C38",
  "#5B7BA5",
  "#9B8EC4",
  "#C4956A",
  "#7BA587",
];

export const iSt = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid " + T.lightLine,
  borderRadius: T.radiusSm,
  fontSize: "14px",
  fontFamily: T.fontB,
  outline: "none",
  transition: "border .15s",
  background: T.white,
};
export const selSt = { ...iSt, appearance: "none", cursor: "pointer" };

export const TECHNIQUE_STAGES = ["Not Started", "Learning", "Mannequin", "Model", "Competent", "Floor Ready"];
export const TIMING_STAGES = ["Not Started", "Building", "On Pace", "Competent", "Floor Ready"];
export const TECHNIQUE_COLORS = [T.creamDark, "#D4C5A9", "#B8A47E", "#A08C6A", "#7A6B4A", "#8C7A55"];
export const TIMING_COLORS = [T.creamDark, "#C9B8DC", "#9B7EC0", "#7B5EA6", "#6B4D94"];
