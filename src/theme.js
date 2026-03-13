export const T = {
  cream: "#FAF6F0",
  creamDark: "#F0EBE2",
  gold: "#C9A96E",
  goldLight: "#E8D5B0",
  goldDark: "#A8884D",
  goldMuted: "rgba(201,169,110,0.12)",
  charcoal: "#1A1A1A",
  charcoalMid: "#2C2C2C",
  charcoalMuted: "rgba(26,26,26,0.06)",
  text: "#1A1A1A",
  textMuted: "#6B6460",
  white: "#FFFFFF",
  lightLine: "#E0DAD0",
  success: "#5E8B6A",
  successBg: "rgba(94,139,106,0.1)",
  warn: "#D4915E",
  warnBg: "rgba(212,145,94,0.1)",
  danger: "#C26A6A",
  dangerBg: "rgba(194,106,106,0.1)",
  radius: "0px",
  radiusSm: "0px",
  shadow: "0 2px 16px rgba(0,0,0,0.04)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.08)",
  font: "'Outfit', sans-serif",
  fontD: "'Cormorant Garamond', Georgia, serif",
  // Role colors
  educator: "#3D6B5E",
  educatorLight: "#3D6B5E18",
  educatorMid: "#3D6B5E30",
  resident: "#1A1A1A",
  residentLight: "#1A1A1A10",
};

export const TC = {
  skill: T.gold,
  mannequin: "#8B6AAE",
  model: T.success,
  general: T.charcoal,
  workshop: T.success,
  coaching: T.warn,
  ritual: T.gold,
  community: T.charcoal,
  creative: "#8B6AAE",
  assessment: T.danger,
};

export const CAT_COLORS = [
  "#C26A6A", // red / rose
  "#B07156", // orange / terracotta
  "#C9A96E", // yellow / gold
  "#3D6B5E", // green / sage
  "#2C7A7B", // teal
  "#4A6FA5", // blue / slate
  "#6B4D94", // indigo / plum
  "#8C7A55", // neutral / warm brown
];

export const TECHNIQUE_STAGES = ["Not Started", "Learning", "Mannequin", "Competent"];
export const TIMING_STAGES = ["Not Started", "Building", "On Pace", "Floor Ready"];
export const TECHNIQUE_COLORS = [T.creamDark, "#D4C5A9", "#B8A47E", "#8C7A55"];
export const TIMING_COLORS = [T.creamDark, "#C9B8DC", "#9B7EC0", "#6B4D94"];

export const iSt = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: T.radiusSm,
  border: `1.5px solid ${T.creamDark}`,
  background: T.cream,
  fontSize: "13px",
  outline: "none",
};

export const selSt = { ...iSt, appearance: "none", cursor: "pointer" };
