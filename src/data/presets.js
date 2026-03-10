import { ALL_SKILL_IDS } from "./masterProgram";

export const INIT_PRESETS = [
  { id: "p1", name: "Full Program", skillIds: [...ALL_SKILL_IDS] },
  {
    id: "p2",
    name: "Color Specialist",
    skillIds: ["sk8", "sk9", "sk10", "sk11", "sk12", "sk13", "sk14", "sk19", "sk20"],
  },
  {
    id: "p3",
    name: "Cutting Track",
    skillIds: ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk15", "sk16", "sk17", "sk19"],
  },
  {
    id: "p4",
    name: "Foundations Only",
    skillIds: ["sk1", "sk2", "sk9", "sk15", "sk19", "sk23", "sk27", "sk28"],
  },
];
