export const MASTER_PROGRAM = [
  {
    id: "c1",
    name: "Cutting & Styling",
    color: "#8C7A55",
    videos: [
      { id: "cv1", title: "Intro to Cutting at Flowe", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "12:30" },
    ],
    skills: [
      { id: "sk1", name: "Basic Layered Cut", type: "service", targetMin: 45, maxMin: 75, videos: [
        { id: "sv1", title: "Layered Cut Breakdown", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "18:45" },
        { id: "sv2", title: "Sectioning for Layers", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "8:20" },
      ], sop: {
        steps: "<ol><li>Section hair into 4 quadrants — crown, sides, nape</li><li>Establish guide length at the nape center</li><li>Work upward using 90° elevation for uniform layers</li><li>Cross-check by pulling sections vertically</li><li>Refine perimeter and face frame</li><li>Texturize ends with point cutting if needed</li></ol>",
        mistakes: "<ul><li>Over-elevating at the perimeter — creates unwanted shortness</li><li>Inconsistent tension between panels</li><li>Skipping the cross-check — layers won't blend</li></ul>",
        consultation: "<ul><li>Assess natural growth patterns and cowlicks</li><li>Discuss desired length vs. face shape</li><li>Check hair density — affects layering approach</li><li>Ask about styling routine and maintenance commitment</li></ul>",
        tips: "<p>Use the comb as your elevation guide — if you can see the comb through the hair, your sections are clean. <b>Always cut dry check</b> before the client leaves. Layers look different wet vs. dry.</p>",
        tools: "<ul><li>Shears (6\" or 6.5\")</li><li>Cutting comb</li><li>Sectioning clips (4+)</li><li>Spray bottle</li><li>Thinning shears (optional)</li></ul>",
      }},
      { id: "sk2", name: "Bob & Lob Variations", type: "service", targetMin: 40, maxMin: 65, videos: [
        { id: "sv3", title: "The Flowe Bob Method", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "22:10" },
      ], sop: {
        steps: "<ol><li>Establish the desired length and weight line</li><li>Section nape and begin cutting from center back</li><li>Work in horizontal sections, maintaining zero elevation</li><li>Graduate or stack as needed for shape</li><li>Connect sides to back length</li><li>Detail face frame and check symmetry</li></ol>",
        mistakes: "<ul><li>Not accounting for natural head shape — bobs magnify asymmetry</li><li>Cutting too much on one side before checking the other</li><li>Ignoring the client's neck length and hairline</li></ul>",
        consultation: "<ul><li>Face shape assessment — critical for bob length</li><li>Hair texture — straight vs. wavy bobs cut differently</li><li>Discuss maintenance — bobs need regular trims</li></ul>",
        tips: "<p>The secret to a great bob is the <b>weight line</b>. Spend more time on the first section than any other — everything builds from there.</p>",
        tools: "<ul><li>Shears</li><li>Cutting comb</li><li>Duck bill clips</li><li>Neck strip + cape positioned carefully</li></ul>",
      }},
      { id: "sk3", name: "Texturizing Techniques", type: "service", targetMin: 30, maxMin: 50, videos: [] },
      { id: "sk4", name: "Clipper Fades", type: "service", targetMin: 35, maxMin: 55, videos: [] },
      { id: "sk5", name: "Razor Cutting", type: "service", targetMin: 40, maxMin: 60, videos: [] },
      { id: "sk6", name: "Dry Cutting", type: "service", targetMin: 35, maxMin: 55, videos: [] },
      { id: "sk7", name: "Curly & Textured Cuts", type: "service", targetMin: 50, maxMin: 80, videos: [] },
    ],
  },
  {
    id: "c2",
    name: "Color Services",
    color: "#6B4D94",
    videos: [],
    skills: [
      { id: "sk8", name: "Color Wheel Theory", type: "knowledge", videos: [
        { id: "sv4", title: "Color Theory Fundamentals", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration: "15:00" },
      ]},
      { id: "sk9", name: "Single-Process Color", type: "service", targetMin: 45, maxMin: 70, videos: [] },
      { id: "sk10", name: "Foil Highlights", type: "service", targetMin: 75, maxMin: 120, videos: [] },
      { id: "sk11", name: "Balayage & Painting", type: "service", targetMin: 90, maxMin: 140, videos: [] },
      { id: "sk12", name: "Vivid & Fashion Colors", type: "service", targetMin: 120, maxMin: 180, videos: [] },
      { id: "sk13", name: "Color Correction", type: "service", targetMin: 120, maxMin: 200, videos: [] },
      { id: "sk14", name: "Developer & Timing", type: "knowledge", videos: [] },
    ],
  },
  {
    id: "c3",
    name: "Blow-Dry & Finishing",
    color: "#C9A96E",
    videos: [],
    skills: [
      { id: "sk15", name: "Round Brush Blowout", type: "service", targetMin: 30, maxMin: 50, videos: [] },
      { id: "sk16", name: "Flat Iron Styling", type: "service", targetMin: 25, maxMin: 40, videos: [] },
      { id: "sk17", name: "Curling Techniques", type: "service", targetMin: 30, maxMin: 45, videos: [] },
      { id: "sk18", name: "Updos & Formal Styles", type: "service", targetMin: 45, maxMin: 75, videos: [] },
    ],
  },
  {
    id: "c4",
    name: "Client Experience",
    color: "#3D6B5E",
    videos: [],
    skills: [
      { id: "sk19", name: "Consultation Framework", type: "knowledge", videos: [] },
      { id: "sk20", name: "Upselling & Retail", type: "knowledge", videos: [] },
      { id: "sk21", name: "Conflict Resolution", type: "knowledge", videos: [] },
      { id: "sk22", name: "Client Retention", type: "knowledge", videos: [] },
    ],
  },
  {
    id: "c5",
    name: "Business & Brand",
    color: "#B07156",
    videos: [],
    skills: [
      { id: "sk23", name: "Social Media Portfolio", type: "knowledge", videos: [] },
      { id: "sk24", name: "Pricing Your Services", type: "knowledge", videos: [] },
      { id: "sk25", name: "Building a Clientele", type: "knowledge", videos: [] },
      { id: "sk26", name: "Personal Brand Identity", type: "knowledge", videos: [] },
    ],
  },
  {
    id: "c6",
    name: "Health & Safety",
    color: "#4A6FA5",
    videos: [],
    skills: [
      { id: "sk27", name: "Sanitation Protocols", type: "knowledge", videos: [] },
      { id: "sk28", name: "Chemical Safety", type: "knowledge", videos: [] },
      { id: "sk29", name: "Ergonomics & Self-Care", type: "knowledge", videos: [] },
    ],
  },
];

export const ALL_SKILL_IDS = MASTER_PROGRAM.flatMap((c) => c.skills.map((s) => s.id));
