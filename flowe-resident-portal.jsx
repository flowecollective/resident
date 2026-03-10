import { useState, useEffect, useRef, createContext, useContext } from "react";

const T = {
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

const TC = {
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

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const GlobalStyle = () => {
  const css = [
    "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600;700&display=swap');",
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}",
    "body{font-family:" + T.font + ";background:" + T.cream + ";color:" + T.text + ";-webkit-font-smoothing:antialiased}",
    "::selection{background:" + T.goldLight + ";color:" + T.charcoal + "}",
    "input,textarea,select,button{font-family:inherit}",
    "@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}",
    "@keyframes fadeIn{from{opacity:0}to{opacity:1}}",
    "@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}",
    ".fade-up{animation:fadeUp .5s ease both}",
    ".fade-in{animation:fadeIn .4s ease both}",
    ".slide-in{animation:slideIn .4s ease both}",
    ".st1{animation-delay:.05s}.st2{animation-delay:.1s}.st3{animation-delay:.15s}.st4{animation-delay:.2s}.st5{animation-delay:.25s}",
    "::-webkit-scrollbar{width:6px}",
    "::-webkit-scrollbar-track{background:transparent}",
    "::-webkit-scrollbar-thumb{background:" + T.goldLight + ";border-radius:3px}",
    // Responsive: mobile breakpoint at 768px
    "@media(max-width:768px){",
    "  .sidebar-root{transform:translateX(-100%)}",
    "  .sidebar-root[style*='left: 0']{transform:translateX(0) !important}",
    "  .sidebar-close{display:flex !important}",
    "  .mobile-header{display:flex !important}",
    "  .app-main{margin-left:0 !important}",
    "  .app-main main{padding:16px !important}",
    "  .r-grid{grid-template-columns:1fr !important}",
    "  .r-grid-2{grid-template-columns:1fr !important}",
    "}",
    ".sop-content ol{padding-left:18px;margin:4px 0}.sop-content ul{padding-left:16px;margin:4px 0}",
    ".sop-content li{margin-bottom:3px}.sop-content p{margin-bottom:6px}",
    ".sop-content h3{font-size:13px;font-weight:600;margin:8px 0 4px}",
    ".sop-content b,.sop-content strong{font-weight:600}",
    "details summary::-webkit-details-marker{display:none}",
    "details summary::marker{display:none;content:''}",
    "details[open] summary .arrow-down{transform:rotate(180deg)}",
  ].join("\n");
  return <style>{css}</style>;
};

const Ctx = createContext(null);
const useData = () => useContext(Ctx);

// ── Master Program ──
const CAT_COLORS = ["#8C7A55", "#6B4D94", "#C9A96E", "#3D6B5E", "#B07156", "#4A6FA5", "#8B6AAE", "#C26A6A"];

const MASTER_PROGRAM = [
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

const ALL_SKILL_IDS = MASTER_PROGRAM.flatMap((c) => c.skills.map((s) => s.id));

const INIT_PRESETS = [
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

const INIT_RESIDENTS = [
  {
    id: "r1",
    name: "Maya Johnson",
    cohort: "Spring 2026",
    email: "maya@flowecollective.com",
    skillIds: [...ALL_SKILL_IDS],
    progress: { sk1: {technique:3,timing:3}, sk2: {technique:3,timing:2}, sk8: {done:true}, sk9: {technique:3,timing:2}, sk15: {technique:2,timing:0}, sk19: {done:true}, sk27: {done:true} },
    tuition: { plan: "monthly", total: 4950, payments: [
      { id: "pay1", amount: 1650, date: "2026-01-15", note: "Month 1" },
      { id: "pay2", amount: 1650, date: "2026-02-15", note: "Month 2" },
    ]},
    timingLogs: {
      sk1: [
        { minutes: 68, type: "mannequin", date: "2026-02-10", note: "First attempt", critique: "" },
        { minutes: 55, type: "mannequin", date: "2026-02-17", note: "Better blending", critique: "Watch elevation at the crown — you're over-directing" },
        { minutes: 52, type: "model", date: "2026-02-24", note: "First live cut", critique: "Great consultation. Tension was inconsistent on the left side" },
        { minutes: 48, type: "model", date: "2026-03-03", note: "Feeling confident", critique: "" },
      ],
      sk2: [
        { minutes: 60, type: "mannequin", date: "2026-02-12", note: "", critique: "" },
        { minutes: 50, type: "mannequin", date: "2026-02-20", note: "Lob went well", critique: "Weight line is clean. Try graduating the back next time" },
      ],
      sk9: [
        { minutes: 72, type: "mannequin", date: "2026-02-15", note: "", critique: "" },
        { minutes: 65, type: "model", date: "2026-02-28", note: "Root touch-up", critique: "" },
      ],
    },
  },
  {
    id: "r2",
    name: "Aisha Williams",
    cohort: "Spring 2026",
    email: "aisha@flowecollective.com",
    skillIds: ["sk8", "sk9", "sk10", "sk11", "sk12", "sk13", "sk14", "sk19", "sk20"],
    progress: { sk8: {done:true}, sk9: {technique:2,timing:1}, sk14: {done:true} },
    tuition: { plan: "full", total: 4500, payments: [
      { id: "pay3", amount: 4500, date: "2026-01-10", note: "Paid in full" },
    ]},
  },
  {
    id: "r3",
    name: "Jasmine Reyes",
    cohort: "Spring 2026",
    email: "jasmine@flowecollective.com",
    skillIds: ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk15", "sk16", "sk17", "sk19"],
    progress: { sk1: {technique:3,timing:3}, sk2: {technique:3,timing:2}, sk3: {technique:1,timing:0} },
    tuition: { plan: "monthly", total: 4950, payments: [
      { id: "pay4", amount: 1650, date: "2026-01-15", note: "Month 1" },
    ]},
  },
  {
    id: "r4",
    name: "Zara Mitchell",
    cohort: "Spring 2026",
    email: "zara@flowecollective.com",
    skillIds: ["sk1", "sk2", "sk9", "sk15", "sk19", "sk23", "sk27", "sk28"],
    progress: { sk1: {technique:3,timing:3}, sk2: {technique:3,timing:3}, sk9: {technique:3,timing:3}, sk15: {technique:3,timing:3}, sk19: {done:true}, sk23: {done:true}, sk27: {done:true}, sk28: {done:true} },
    tuition: { plan: "monthly", total: 4950, payments: [
      { id: "pay5", amount: 1650, date: "2026-01-15", note: "Month 1" },
      { id: "pay6", amount: 1650, date: "2026-02-15", note: "Month 2" },
      { id: "pay7", amount: 1650, date: "2026-03-15", note: "Month 3" },
    ]},
  },
];

const INIT_SCHEDULE = [
  { id: 1, title: "Morning Circle", time: "8:00 AM", date: "2026-03-05", type: "general", assignTo: "all", skillId: null },
  { id: 2, title: "Basic Layered Cut", time: "10:30 AM", date: "2026-03-05", type: "skill", assignTo: "all", skillId: "sk1" },
  { id: 3, title: "1-on-1 Coaching", time: "2:00 PM", date: "2026-03-05", type: "general", assignTo: "r1", skillId: null },
  { id: 4, title: "Single-Process Color", time: "10:00 AM", date: "2026-03-06", type: "skill", assignTo: "all", skillId: "sk9" },
  { id: 5, title: "Mannequin Practice", time: "1:00 PM", date: "2026-03-06", type: "mannequin", assignTo: "all", skillId: null },
  { id: 6, title: "Blow-Dry Masterclass", time: "10:00 AM", date: "2026-03-07", type: "skill", assignTo: "all", skillId: "sk15" },
  { id: 7, title: "Live Model Day", time: "9:00 AM", date: "2026-03-10", type: "model", assignTo: "all", skillId: null },
  { id: 8, title: "Balayage Session", time: "10:00 AM", date: "2026-03-10", type: "skill", assignTo: "r2", skillId: "sk11" },
  { id: 9, title: "Foil Highlights Practice", time: "1:00 PM", date: "2026-03-11", type: "skill", assignTo: "r2", skillId: "sk10" },
  { id: 10, title: "Clipper Fades", time: "10:00 AM", date: "2026-03-11", type: "skill", assignTo: "r3", skillId: "sk4" },
];

const INIT_DOCS = [
  { id: 1, name: "Trainee Handbook", category: "Onboarding", size: "2.4 MB", date: "2026-01-15" },
  { id: 2, name: "Salon Standards", category: "Onboarding", size: "840 KB", date: "2026-01-15" },
  { id: 3, name: "Color Formulation Guide", category: "Resources", size: "3.2 MB", date: "2026-02-10" },
  { id: 4, name: "Client Intake Forms", category: "Forms", size: "520 KB", date: "2026-02-20" },
];

const INIT_MESSAGES = [
  { id: 1, from: "a1", to: "r1", text: "Welcome to Flowe! First week is all about getting comfortable.", time: "2026-03-01T10:00:00", read: true },
  { id: 2, from: "r1", to: "a1", text: "Thank you! Should I bring my own shears?", time: "2026-03-01T10:15:00", read: true },
  { id: 3, from: "a1", to: "r1", text: "Yes — bring your kit. Tool check on day one.", time: "2026-03-01T10:20:00", read: true },
];

// ── Helpers ──
// Progress stages (service skills only)
const TECHNIQUE_STAGES = ["Not Started", "Theory", "Mannequin", "Competent"];
const TIMING_STAGES = ["Not Started", "Slow", "On Pace", "Floor Ready"];
const TECHNIQUE_COLORS = [T.creamDark, "#D4C5A9", "#B8A47E", "#8C7A55"];
const TIMING_COLORS = [T.creamDark, "#C9B8DC", "#9B7EC0", "#6B4D94"];

// Lookup skill type from master program (falls back to knowledge)
const findSkill = (masterProgram, sid) => {
  for (const cat of masterProgram) {
    const sk = cat.skills.find((s) => s.id === sid);
    if (sk) return sk;
  }
  return null;
};

const getSkillProgress = (trainee, sid) => {
  const p = trainee.progress?.[sid];
  if (!p) return { technique: 0, timing: 0, done: false };
  if (typeof p === "boolean" || p.done !== undefined) return { technique: 0, timing: 0, done: p === true || p.done === true };
  return { technique: p.technique || 0, timing: p.timing || 0, done: false };
};

const isSkillComplete = (trainee, sid, masterProgram) => {
  const sk = findSkill(masterProgram, sid);
  const p = getSkillProgress(trainee, sid);
  if (!sk || sk.type === "knowledge") return p.done;
  return p.technique >= 3 && p.timing >= 3;
};

const getSkillPct = (trainee, sid, masterProgram) => {
  const sk = findSkill(masterProgram, sid);
  const p = getSkillProgress(trainee, sid);
  if (!sk || sk.type === "knowledge") return p.done ? 100 : 0;
  return Math.round(((p.technique + p.timing) / 6) * 100);
};

const getTraineeCats = (trainee, masterProgram) => {
  const sids = new Set(trainee.skillIds || []);
  return masterProgram.map((c) => ({ ...c, skills: c.skills.filter((s) => sids.has(s.id)) })).filter(
    (c) => c.skills.length > 0
  );
};

const getProgress = (trainee, masterProgram) => {
  const t = trainee.skillIds?.length || 0;
  if (t === 0) return { total: 0, done: 0, pct: 0 };
  let totalPoints = 0;
  let earnedPoints = 0;
  let done = 0;
  (trainee.skillIds || []).forEach((sid) => {
    const sk = findSkill(masterProgram, sid);
    const isService = sk && sk.type === "service";
    if (isService) {
      totalPoints += 6;
      const p = getSkillProgress(trainee, sid);
      earnedPoints += p.technique + p.timing;
      if (p.technique >= 3 && p.timing >= 3) done++;
    } else {
      totalPoints += 1;
      const p = getSkillProgress(trainee, sid);
      if (p.done) { earnedPoints += 1; done++; }
    }
  });
  return { total: t, done, pct: totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0 };
};

// ── Icons ──
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const p = { fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" {...p} />
        <rect x="14" y="3" width="7" height="7" rx="1.5" {...p} />
        <rect x="3" y="14" width="7" height="7" rx="1.5" {...p} />
        <rect x="14" y="14" width="7" height="7" rx="1.5" {...p} />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" {...p} />
        <line x1="16" y1="2" x2="16" y2="6" {...p} />
        <line x1="8" y1="2" x2="8" y2="6" {...p} />
        <line x1="3" y1="10" x2="21" y2="10" {...p} />
      </>
    ),
    check: (
      <>
        <path d="M9 12l2 2 4-4" {...p} strokeWidth="2" />
        <circle cx="12" cy="12" r="9" {...p} />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" {...p} />
        <polyline points="14,2 14,8 20,8" {...p} />
      </>
    ),
    message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" {...p} />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" {...p} />
        <polyline points="16,17 21,12 16,7" {...p} />
        <line x1="21" y1="12" x2="9" y2="12" {...p} />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" {...p} />
        <polygon points="22,2 15,22 11,13 2,9" {...p} />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" {...p} strokeWidth="2" />
        <line x1="5" y1="12" x2="19" y2="12" {...p} strokeWidth="2" />
      </>
    ),
    trash: (
      <>
        <polyline points="3,6 5,6 21,6" {...p} />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" {...p} />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" {...p} />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" {...p} />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" {...p} strokeWidth="2" />
        <line x1="6" y1="6" x2="18" y2="18" {...p} strokeWidth="2" />
      </>
    ),
    flower: (
      <>
        <circle cx="12" cy="12" r="3" fill={color} opacity="0.3" stroke="none" />
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="12" cy="7" rx="2.5" ry="4" {...p} strokeWidth="1.2" transform={`rotate(${r} 12 12)`} />
        ))}
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...p} />
        <circle cx="9" cy="7" r="4" {...p} />
      </>
    ),
    template: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" {...p} />
        <line x1="3" y1="9" x2="21" y2="9" {...p} />
        <line x1="9" y1="21" x2="9" y2="9" {...p} />
      </>
    ),
    back: (
      <>
        <line x1="19" y1="12" x2="5" y2="12" {...p} />
        <polyline points="12,19 5,12 12,5" {...p} />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" {...p} />
        <polyline points="7,10 12,15 17,10" {...p} />
        <line x1="12" y1="15" x2="12" y2="3" {...p} />
      </>
    ),
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...p} />
        <circle cx="12" cy="12" r="3" {...p} />
      </>
    ),
    play: (
      <>
        <circle cx="12" cy="12" r="10" {...p} />
        <polygon points="10,8 16,12 10,16" fill={color} stroke="none" />
      </>
    ),
    grip: (
      <>
        {[6, 12, 18].map((y) => (
          <g key={y}>
            <circle cx="9" cy={y} r="1.2" fill={color} stroke="none" />
            <circle cx="15" cy={y} r="1.2" fill={color} stroke="none" />
          </g>
        ))}
      </>
    ),
    zap: <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" {...p} />,
    dollar: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" {...p} />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" {...p} />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" {...p} />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...p} />
      </>
    ),
    alert: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" {...p} />
        <line x1="12" y1="9" x2="12" y2="13" {...p} />
        <line x1="12" y1="17" x2="12.01" y2="17" {...p} />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      {icons[name] || null}
    </svg>
  );
};

// ── Shared UI ──
const Card = ({ children, style, className = "" }) => (
  <div
    className={className}
    style={{ background: T.white, borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.lightLine}`, ...style }}
  >
    {children}
  </div>
);

const Badge = ({ children, color = T.gold, bg }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      color,
      background: bg || `${color}18`,
    }}
  >
    {children}
  </span>
);

const ProgressBar = ({ value, height = 6, color = T.gold }) => (
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

const Avatar = ({ name, size = 36 }) => {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 600,
        color: T.white,
        fontFamily: T.fontD,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

const SectionTitle = ({ children, sub, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
    <div>
      <h2 style={{ fontFamily: T.fontD, fontSize: "26px", fontWeight: 600, color: T.charcoal, lineHeight: 1.2 }}>{children}</h2>
      {sub && <p style={{ color: T.textMuted, fontSize: "13px", marginTop: 4 }}>{sub}</p>}
    </div>
    {action}
  </div>
);

const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: T.textMuted, marginBottom: 6 }}>
      {label}
    </label>
    {children}
  </div>
);

const iSt = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: T.radiusSm,
  border: `1.5px solid ${T.creamDark}`,
  background: T.cream,
  fontSize: "13px",
  outline: "none",
};

const selSt = { ...iSt, appearance: "none", cursor: "pointer" };

const Btn = ({ children, onClick, variant = "primary", style: s, disabled }) => {
  const v = {
    primary: { background: T.charcoal, color: T.cream, border: "none" },
    outline: { background: "transparent", color: T.charcoal, border: `1.5px solid ${T.creamDark}` },
    gold: { background: T.goldMuted, color: T.gold, border: "none" },
    danger: { background: T.dangerBg, color: T.danger, border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 20px",
        borderRadius: T.radiusSm,
        fontSize: "13px",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 6,
        ...v[variant],
        ...s,
      }}
    >
      {children}
    </button>
  );
};

const Modal = ({ open, onClose, title, children, width = 500 }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (open) {
      setScrollY(window.scrollY || window.pageYOffset || 0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: scrollY,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(43,43,43,0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          borderRadius: T.radius,
          width,
          maxWidth: "92vw",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: T.shadowLg,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: `1px solid ${T.lightLine}`,
            position: "sticky",
            top: 0,
            background: T.white,
            zIndex: 1,
          }}
        >
          <h3 style={{ fontFamily: T.fontD, fontSize: "20px", fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="x" size={20} color={T.textMuted} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const Toast = ({ message, visible }) => (
  <div
    style={{
      position: "fixed",
      bottom: visible ? 32 : -60,
      left: "50%",
      transform: "translateX(-50%)",
      background: T.charcoal,
      color: T.cream,
      padding: "12px 24px",
      borderRadius: 24,
      fontSize: "13px",
      fontWeight: 500,
      boxShadow: T.shadowLg,
      transition: "bottom .3s ease",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    <Icon name="check" size={16} color={T.gold} /> {message}
  </div>
);

// ════════════════════════════════════════════
//  AUTH SCREEN
// ════════════════════════════════════════════
// ── SOP Section Labels ──
const SOP_SECTIONS = [
  { key: "steps", label: "Key Steps", icon: "check", color: T.gold },
  { key: "mistakes", label: "Common Mistakes", icon: "alert", color: T.danger },
  { key: "consultation", label: "Consultation Notes", icon: "message", color: "#4285f4" },
  { key: "tips", label: "Pro Tips", icon: "zap", color: "#8B6AAE" },
  { key: "tools", label: "Tools Required", icon: "template", color: T.textMuted },
];

// ── Rich Text Editor (simple contentEditable with toolbar) ──
const RichEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const isInitRef = useRef(false);
  const savedRange = useRef(null);

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current && !isInitRef.current) {
      editorRef.current.innerHTML = value || "";
      isInitRef.current = true;
    }
  }, []);

  // Save selection before toolbar click steals focus
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (cmd, val) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(cmd, false, val || null);
    // Save content after command
    if (onChange) onChange(editorRef.current?.innerHTML || "");
  };

  const handleInput = () => {
    if (onChange) onChange(editorRef.current?.innerHTML || "");
  };

  const toolbarBtn = (label, onClickFn, extraStyle = {}) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClickFn();
      }}
      style={{
        height: 28, border: "none", background: "transparent", cursor: "pointer",
        fontSize: "11px", color: T.charcoal, padding: "0 8px", display: "flex", alignItems: "center",
        ...extraStyle,
      }}
    >{label}</button>
  );

  return (
    <div style={{ border: "1px solid " + T.lightLine, background: T.white }}>
      <div style={{ display: "flex", gap: 1, padding: "4px 6px", borderBottom: "1px solid " + T.lightLine, background: T.cream, flexWrap: "wrap", alignItems: "center" }}>
        {toolbarBtn("B", () => exec("bold"), { fontWeight: 700, fontSize: "13px", width: 28, justifyContent: "center" })}
        {toolbarBtn("I", () => exec("italic"), { fontStyle: "italic", fontSize: "13px", width: 28, justifyContent: "center" })}
        {toolbarBtn("U", () => exec("underline"), { textDecoration: "underline", fontSize: "13px", width: 28, justifyContent: "center" })}
        <div style={{ width: 1, height: 18, background: T.lightLine, margin: "0 4px" }} />
        {toolbarBtn("1. List", () => exec("insertOrderedList"))}
        {toolbarBtn("• List", () => exec("insertUnorderedList"))}
        <div style={{ width: 1, height: 18, background: T.lightLine, margin: "0 4px" }} />
        {toolbarBtn("H3", () => exec("formatBlock", "<h3>"), { fontWeight: 700 })}
        {toolbarBtn("¶", () => exec("formatBlock", "<p>"), { color: T.textMuted })}
        {toolbarBtn("Clear", () => exec("removeFormat"), { color: T.textMuted })}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        style={{
          minHeight: 120, padding: "12px 14px", fontSize: "13px", lineHeight: 1.7, color: T.charcoal, outline: "none",
        }}
      />
    </div>
  );
};

// ── SOP Viewer (read-only, collapsible) ──
const SOPViewer = ({ sop }) => {
  const [activeTab, setActiveTab] = useState(null);
  if (!sop) return null;
  const sections = SOP_SECTIONS.filter((s) => sop[s.key]);
  if (sections.length === 0) return null;

  return (
    <div style={{ marginTop: 8, borderTop: "1px solid " + T.lightLine, paddingTop: 8 }}>
      <p style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 8 }}>Curriculum</p>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: activeTab ? 8 : 0 }}>
        {sections.map((sec) => {
          const isActive = activeTab === sec.key;
          return (
            <button key={sec.key} onClick={() => setActiveTab(isActive ? null : sec.key)} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
              background: isActive ? sec.color + "15" : T.white,
              border: "1px solid " + (isActive ? sec.color + "40" : T.lightLine),
              cursor: "pointer", fontSize: "10px", fontWeight: 600,
              color: isActive ? sec.color : T.textMuted,
              transition: "all .15s",
            }}>
              <Icon name={sec.icon} size={10} color={isActive ? sec.color : T.textMuted} />
              {sec.label}
            </button>
          );
        })}
      </div>
      {/* Active content */}
      {activeTab && sop[activeTab] && (
        <div
          className="sop-content"
          dangerouslySetInnerHTML={{ __html: sop[activeTab] }}
          style={{
            padding: "10px 14px", fontSize: "12px", lineHeight: 1.7, color: T.charcoal,
            background: T.white, border: "1px solid " + T.lightLine,
          }}
        />
      )}
    </div>
  );
};

const AuthScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const go = () => {
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      onLogin(
        email.toLowerCase().includes("admin")
          ? { id: "a1", name: "Flowe Educator", email, role: "admin" }
          : { id: "r1", name: "Maya Johnson", email, role: "resident", cohort: "Spring 2026" }
      );
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.cream,
        padding: 20,
        backgroundImage: `radial-gradient(circle at 20% 50%, ${T.goldMuted} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${T.goldMuted} 0%, transparent 40%)`,
      }}
    >
      <div className="fade-up" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: T.fontD, fontSize: "1.6rem", fontWeight: 500, letterSpacing: "0.15em", color: T.charcoal, textDecoration: "none" }}>FLOWE</span>
          </div>
          <p style={{ color: T.gold, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase" }}>Training Portal</p>
        </div>
        <Card style={{ padding: 36 }}>
          <h3 style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 500, textAlign: "center", marginBottom: 4 }}>Welcome back</h3>
          <p style={{ color: T.textMuted, fontSize: "13px", textAlign: "center", marginBottom: 28 }}>Sign in to continue</p>
          <FormField label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@flowecollective.com" style={iSt} onKeyDown={(e) => e.key === "Enter" && go()} />
          </FormField>
          <FormField label="Password">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" style={iSt} onKeyDown={(e) => e.key === "Enter" && go()} />
          </FormField>
          <button
            onClick={go}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: T.radiusSm,
              background: T.charcoal,
              color: T.cream,
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </Card>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: "11px", color: T.textMuted }}>
          <b>Demo:</b> any email = trainee · "admin" in email = educator
        </p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════
const Sidebar = ({ user, page, onNav, onLogout, mobileOpen, setMobileOpen }) => {
  const isA = user?.role === "admin";
  const items = isA
    ? [
        { id: "a-dash", label: "Dashboard", icon: "dashboard" },
        { id: "a-sched", label: "Schedule", icon: "calendar" },
        { id: "a-master", label: "Master Program", icon: "template" },
        { id: "a-presets", label: "Presets", icon: "zap" },
        { id: "a-trainees", label: "Trainees", icon: "users" },
        { id: "a-tuition", label: "Tuition", icon: "dollar" },
        { id: "a-docs", label: "Documents", icon: "file" },
        { id: "a-msg", label: "Messages", icon: "message" },
        { id: "a-settings", label: "Settings", icon: "settings" },
      ]
    : [
        { id: "dash", label: "Dashboard", icon: "dashboard" },
        { id: "sched", label: "Schedule", icon: "calendar" },
        { id: "skills", label: "My Skills", icon: "check" },
        { id: "tuition", label: "My Tuition", icon: "dollar" },
        { id: "handbook", label: "Handbook", icon: "file" },
        { id: "docs", label: "Documents", icon: "file" },
        { id: "msg", label: "Messages", icon: "message" },
      ];

  const handleNav = (id) => {
    onNav(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="sidebar-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 199 }} />
      )}
      <div
        className="sidebar-root"
        style={{
          width: 240,
          minHeight: "100vh",
          background: T.white,
          borderRight: "1px solid " + T.lightLine,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: mobileOpen ? 0 : undefined,
          top: 0,
          zIndex: 200,
          transition: "transform .3s ease",
        }}
      >
        <div style={{ padding: "24px 20px", borderBottom: "1px solid " + T.lightLine, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: T.fontD, fontSize: "1.6rem", fontWeight: 500, letterSpacing: "0.15em", color: T.charcoal }}>FLOWE</span>
            </div>
            <p style={{ fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: isA ? T.educator : T.gold, marginTop: 4 }}>
              {isA ? "Educator" : "Resident"} Portal
            </p>
          </div>
          {/* Mobile close button */}
          <button className="sidebar-close" onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "none" }}>
            <Icon name="x" size={20} color={T.textMuted} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {items.map((it) => {
            const active = page === it.id || page.startsWith(it.id + ":");
            return (
              <button
                key={it.id}
                onClick={() => handleNav(it.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: T.radiusSm,
                  border: "none",
                  background: active ? T.goldMuted : "transparent",
                  color: active ? T.charcoal : T.textMuted,
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  transition: "all .2s",
                  marginBottom: 2,
                  textAlign: "left",
                }}
              >
                <Icon name={it.icon} size={18} color={active ? T.gold : T.textMuted} />
                {it.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid " + T.lightLine }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Avatar name={user?.name} size={32} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500 }}>{user?.name}</p>
              <p style={{ fontSize: "11px", color: T.textMuted }}>{isA ? "Educator" : user?.cohort}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: T.radiusSm,
              border: "none",
              background: "transparent",
              color: T.textMuted,
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            <Icon name="logout" size={16} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

// Mobile top bar
const MobileHeader = ({ user, onMenuToggle }) => (
  <div className="mobile-header" style={{
    display: "none",
    position: "sticky",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "12px 16px",
    background: "rgba(250,246,240,0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid " + T.lightLine,
    alignItems: "center",
    justifyContent: "space-between",
  }}>
    <button onClick={onMenuToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.charcoal} strokeWidth="1.5" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
    <span style={{ fontFamily: T.fontD, fontSize: "1.2rem", fontWeight: 500, letterSpacing: "0.15em", color: T.charcoal }}>FLOWE</span>
    <Avatar name={user?.name} size={28} />
  </div>
);

// ════════════════════════════════════════════
//  TRAINEE: DASHBOARD
// ════════════════════════════════════════════
const TraineeDash = ({ user }) => {
  const { schedule, residents, messages, masterProgram } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const { total, done, pct } = getProgress(me, masterProgram);
  const myEvents = schedule.filter((e) => e.assignTo === "all" || e.assignTo === me.id);
  const today = myEvents.filter((e) => e.date === "2026-03-05");
  const upcoming = myEvents.filter((e) => e.date > "2026-03-05").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const unread = messages.filter((m) => m.to === user.id && !m.read).length;
  const cats = getTraineeCats(me, masterProgram);
  const skillSessions = myEvents.filter((e) => e.type === "skill" && e.skillId);

  const getSkillName = (sid) => {
    for (const c of masterProgram) { const s = c.skills.find((sk) => sk.id === sid); if (s) return s.name; }
    return sid;
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: T.fontD, fontSize: "34px", fontWeight: 600, marginBottom: 4 }}>
          Good morning, {me.name.split(" ")[0]}
        </h1>
        <p style={{ color: T.textMuted, fontSize: "14px" }}>Here's your training overview.</p>
      </div>
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { l: "Skill Progress", v: `${pct}%`, s: `${done} of ${total} complete`, a: T.gold },
          { l: "Today's Sessions", v: today.length, s: "Scheduled for you", a: T.success },
          { l: "Unread Messages", v: unread, s: "From your educator", a: T.warn },
        ].map((s, i) => (
          <Card key={i} className={`fade-up st${i + 1}`} style={{ padding: 22 }}>
            <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 8 }}>{s.l}</p>
            <p style={{ fontFamily: T.fontD, fontSize: "36px", fontWeight: 600, color: s.a, lineHeight: 1 }}>{s.v}</p>
            <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 4 }}>{s.s}</p>
          </Card>
        ))}
      </div>
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Today + Upcoming */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>Today's Schedule</h3>
          {today.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No sessions today</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {today.map((ev) => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: T.radiusSm, background: T.cream }}>
                  <div style={{ width: 4, height: 36, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.time}</p>
                      {ev.skillId && <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: T.goldMuted, color: T.gold }}>SKILL</span>}
                    </div>
                  </div>
                  <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
                </div>
              ))}
            </div>
          )}
          {upcoming.length > 0 && (
            <>
              <h4 style={{ fontFamily: T.fontD, fontSize: "15px", fontWeight: 600, marginTop: 20, marginBottom: 10, color: T.textMuted }}>Coming Up</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {upcoming.map((ev) => (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: T.radiusSm, background: T.cream, fontSize: "12px" }}>
                    <div style={{ width: 3, height: 24, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                    <span style={{ fontWeight: 500, flex: 1 }}>{ev.title}</span>
                    <span style={{ color: T.textMuted, fontSize: "10px" }}>{ev.date.slice(5)} · {ev.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Skill Progress */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>Skill Progress</h3>
          {cats.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No tracks assigned yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {cats.map((cat) => {
                const catPct = Math.round(cat.skills.reduce((a, s) => a + getSkillPct(me, s.id, masterProgram), 0) / cat.skills.length);
                const catDone = cat.skills.filter((s) => isSkillComplete(me, s.id, masterProgram)).length;
                return (
                  <div key={cat.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500 }}>{cat.name}</p>
                      <p style={{ fontSize: "12px", color: T.textMuted }}>{catDone}/{cat.skills.length}</p>
                    </div>
                    <ProgressBar value={catPct} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//  TRAINEE: SCHEDULE
// ════════════════════════════════════════════
// ── Shared Month Calendar Logic ──
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_HEADERS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const useCalendar = (initialYear, initialMonth) => {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevMonthDays - firstDay + 1 + i, current: false, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push({ day: d, current: true, date: year + "-" + mm + "-" + dd });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, current: false, date: null });
    }
  }

  const prev = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); setSelectedDate(null); };
  const next = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); setSelectedDate(null); };

  return { year, month, cells, selectedDate, setSelectedDate, prev, next };
};

const MonthGrid = ({ cal, schedule, onDayClick, gcalEvents = [] }) => {
  const { cells, selectedDate } = cal;
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 2 }}>
        {DAY_HEADERS.map((d) => (
          <div key={d} style={{ textAlign: "center", padding: isMobile ? "4px 0" : "8px 0", fontSize: isMobile ? "9px" : "11px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {isMobile ? d[0] : d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 1 : 2 }}>
        {cells.map((cell, i) => {
          const eventsOnDay = cell.date ? schedule.filter((e) => e.date === cell.date) : [];
          const gcalOnDay = cell.date ? gcalEvents.filter((e) => e.date === cell.date) : [];
          const hasConflict = eventsOnDay.length > 0 && gcalOnDay.length > 0;
          const isSelected = cell.date && cell.date === selectedDate;
          const isToday = cell.date === "2026-03-05";
          const hasEvents = eventsOnDay.length > 0;
          const hasGcal = gcalOnDay.length > 0;

          return (
            <button
              key={i}
              onClick={() => cell.current && cell.date && onDayClick(cell.date)}
              style={{
                padding: isMobile ? "4px 2px" : "6px 4px",
                minHeight: isMobile ? 40 : 72,
                borderRadius: T.radiusSm,
                border: isSelected ? "2px solid " + T.gold : hasConflict ? "2px solid " + T.warn : "1px solid " + (cell.current ? (T.lightLine) : "transparent"),
                background: isSelected ? T.goldMuted : hasConflict ? T.warnBg : cell.current ? T.white : "transparent",
                cursor: cell.current ? "pointer" : "default",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: isMobile ? "center" : "flex-start",
                transition: "all .15s",
                position: "relative",
              }}
            >
              {hasConflict && !isMobile && (
                <div style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, borderRadius: "50%", background: T.warn, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: T.white, fontSize: "9px", fontWeight: 800 }}>!</span>
                </div>
              )}
              <span style={{
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: isToday ? 700 : 500,
                color: cell.current ? (isToday ? T.gold : T.charcoal) : T.creamDark,
                marginBottom: isMobile ? 2 : 4,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: isToday ? (isMobile ? 20 : 22) : "auto",
                height: isToday ? (isMobile ? 20 : 22) : "auto",
                borderRadius: "50%",
                background: isToday ? T.goldMuted : "transparent",
              }}>
                {cell.day}
              </span>

              {/* Mobile: dots only */}
              {isMobile && (hasEvents || hasGcal) && (
                <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                  {hasEvents && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.gold }} />}
                  {hasGcal && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4285f4" }} />}
                  {hasConflict && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.warn }} />}
                </div>
              )}

              {/* Desktop: event text pills */}
              {!isMobile && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                  {eventsOnDay.slice(0, 2).map((ev) => (
                    <div key={ev.id} style={{
                      fontSize: "9px", fontWeight: 500, padding: "2px 4px", borderRadius: 3,
                      background: (TC[ev.type] || T.gold) + "20", color: TC[ev.type] || T.gold,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {ev.title}
                    </div>
                  ))}
                  {gcalOnDay.length > 0 && (
                    <div style={{
                      fontSize: "9px", fontWeight: 500, padding: "2px 4px", borderRadius: 3,
                      background: "#4285f420", color: "#4285f4",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {gcalOnDay.length} salon
                    </div>
                  )}
                  {eventsOnDay.length > 2 && (
                    <span style={{ fontSize: "9px", color: T.textMuted }}>+{eventsOnDay.length - 2} more</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CalendarHeader = ({ cal }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <button onClick={cal.prev} style={{ background: T.cream, border: "none", borderRadius: T.radiusSm, padding: "8px 12px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: T.charcoal }}>
      ←
    </button>
    <h3 style={{ fontFamily: T.fontD, fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 600 }}>
      {MONTH_NAMES[cal.month]} {cal.year}
    </h3>
    <button onClick={cal.next} style={{ background: T.cream, border: "none", borderRadius: T.radiusSm, padding: "8px 12px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: T.charcoal }}>
      →
    </button>
  </div>
);

const DayEventList = ({ date, schedule, gcalEvents = [] }) => {
  const events = schedule.filter((e) => e.date === date);
  const gcal = gcalEvents.filter((e) => e.date === date);
  if (!date) return null;
  const parts = date.split("-");
  const label = MONTH_NAMES[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10);
  return (
    <div style={{ marginTop: 20 }}>
      <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>{label}</h4>

      {gcal.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4285f4" }} />
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#4285f4" }}>Salon Calendar</p>
            {events.length > 0 && <Badge color={T.warn}>Potential Conflicts</Badge>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {gcal.map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: T.radiusSm, background: "#4285f408", border: "1px solid #4285f418" }}>
                <div style={{ width: 4, height: 30, borderRadius: 2, background: "#4285f4" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#4285f4" }}>{ev.title}</p>
                  <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.time}</p>
                </div>
                <Badge color="#4285f4">Salon</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold }} />
            <p style={{ fontSize: "12px", fontWeight: 600, color: T.gold }}>Training Events</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map((ev) => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: T.radiusSm, background: T.cream }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>{ev.title}</p>
                  <p style={{ fontSize: "12px", color: T.textMuted }}>{ev.time}</p>
                </div>
                <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && gcal.length === 0 && (
        <p style={{ color: T.textMuted, fontSize: "13px" }}>No sessions on this day.</p>
      )}
    </div>
  );
};

const TraineeSchedule = ({ user }) => {
  const { schedule, gcalEvents, residents } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const mySchedule = schedule.filter((e) => e.assignTo === "all" || e.assignTo === me.id);
  const cal = useCalendar(2026, 2);

  return (
    <div className="fade-up">
      <SectionTitle sub="Your personal training calendar">Schedule</SectionTitle>
      <Card style={{ padding: 24 }}>
        <CalendarHeader cal={cal} />
        <MonthGrid cal={cal} schedule={mySchedule} gcalEvents={gcalEvents} onDayClick={(d) => cal.setSelectedDate(d)} />
      </Card>
      <DayEventList date={cal.selectedDate} schedule={mySchedule} gcalEvents={gcalEvents} />
    </div>
  );
};

// ════════════════════════════════════════════
//  TRAINEE: MY SKILLS
// ════════════════════════════════════════════
// ── Shared: Skill Progress Pill (view-only) ──
const StagePill = ({ label, stage, stages, colors }) => (
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

const SkillCard = ({ skill, trainee, masterProgram, onAddLog, onDeleteLog, onEditLog, onPlayVideo, timingLogs, role = "resident" }) => {
  const [expanded, setExpanded] = useState(false);
  const p = getSkillProgress(trainee, skill.id);
  const isService = skill.type === "service";
  const complete = isService ? (p.technique >= 3 && p.timing >= 3) : p.done;
  const skPct = getSkillPct(trainee, skill.id, masterProgram);
  const hasStandard = isService && skill.targetMin;
  const logs = timingLogs || [];
  const avgTime = logs.length ? Math.round(logs.reduce((a, l) => a + l.minutes, 0) / logs.length) : null;
  const mannequinLogs = logs.filter((l) => l.type === "mannequin");
  const modelLogs = logs.filter((l) => l.type === "model");
  const mannequinAvg = mannequinLogs.length ? Math.round(mannequinLogs.reduce((a, l) => a + l.minutes, 0) / mannequinLogs.length) : null;
  const modelAvg = modelLogs.length ? Math.round(modelLogs.reduce((a, l) => a + l.minutes, 0) / modelLogs.length) : null;

  return (
    <div style={{
      padding: "12px 14px", borderRadius: T.radiusSm,
      background: complete ? T.successBg : T.cream,
      border: complete ? "1px solid " + T.success + "30" : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isService ? 8 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: complete ? T.success : T.text }}>{skill.name}</span>
          <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: isService ? T.goldMuted : T.charcoalMuted, color: isService ? T.gold : T.textMuted }}>
            {isService ? "SERVICE" : "KNOWLEDGE"}
          </span>
        </div>
        {isService ? (
          <span style={{ fontSize: "11px", fontWeight: 600, color: complete ? T.success : T.gold }}>{skPct}%</span>
        ) : (
          <span style={{ fontSize: "11px", fontWeight: 600, color: complete ? T.success : T.textMuted }}>{complete ? "Complete" : "Not Complete"}</span>
        )}
      </div>
      {isService && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <StagePill label="Tech" stage={p.technique} stages={TECHNIQUE_STAGES} colors={TECHNIQUE_COLORS} />
          <StagePill label="Timing" stage={p.timing} stages={TIMING_STAGES} colors={TIMING_COLORS} />
          {hasStandard && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", width: 52, flexShrink: 0 }}>Goal</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: T.goldMuted }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: T.gold }}>{skill.targetMin}min</span>
                  <span style={{ fontSize: "9px", color: T.textMuted }}>target</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: T.charcoalMuted }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted }}>{skill.maxMin}min</span>
                  <span style={{ fontSize: "9px", color: T.textMuted }}>max</span>
                </div>
              </div>
            </div>
          )}

          {/* Video Lessons */}
          {(skill.videos || []).length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {skill.videos.map((v) => (
                  <button key={v.id} onClick={() => onPlayVideo && onPlayVideo(v)} style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 4,
                    background: "#8B6AAE10", fontSize: "10px", color: "#8B6AAE", fontWeight: 500,
                    border: "none", cursor: "pointer", transition: "background .2s",
                  }}>
                    <Icon name="play" size={10} color="#8B6AAE" />
                    {v.title}
                    <span style={{ color: T.textMuted, fontSize: "9px" }}>{v.duration}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Practice Log */}
          <div style={{ marginTop: 6, borderTop: "1px solid " + (complete ? T.success + "20" : T.lightLine), paddingTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Log button — left */}
              {role === "resident" && onAddLog && (
                <button onClick={() => onAddLog(skill)} style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "3px 10px",
                  background: T.goldMuted, border: "none",
                  cursor: "pointer", fontSize: "10px", fontWeight: 600, color: T.gold,
                }}>
                  <Icon name="plus" size={10} color={T.gold} /> Log Practice
                </button>
              )}
              {/* Averages — spelled out */}
              {mannequinAvg && (
                <span style={{ fontSize: "10px", color: T.textMuted }}>
                  Mannequin avg <b style={{ color: T.charcoal }}>{mannequinAvg} min</b>
                </span>
              )}
              {modelAvg && (
                <span style={{
                  fontSize: "10px",
                  color: hasStandard && modelAvg <= skill.targetMin ? T.success : hasStandard && modelAvg <= skill.maxMin ? T.warn : T.textMuted,
                }}>
                  Model avg <b>{modelAvg} min</b>
                </span>
              )}
              <span style={{ flex: 1 }} />
              {/* Expand — right */}
              {logs.length > 0 && (
                <button onClick={() => setExpanded(!expanded)} style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "3px 8px",
                  background: expanded ? T.goldMuted : T.white, border: "1px solid " + (expanded ? T.gold + "40" : T.lightLine),
                  cursor: "pointer", fontSize: "10px", fontWeight: 500, color: T.textMuted,
                }}>
                  {logs.length} {logs.length === 1 ? "entry" : "entries"}
                  <span style={{ fontSize: "8px", marginLeft: 2, transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "none" }}>▼</span>
                </button>
              )}
            </div>

            {/* Expanded log entries */}
            {expanded && logs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
                {[...logs].map((_, idx) => [...logs].length - 1 - idx).map((origIdx) => {
                  const log = logs[origIdx];
                  return (
                    <div key={origIdx} style={{ padding: "8px 10px", background: T.white, border: "1px solid " + T.lightLine }}>
                      {/* Top row: type, time, date, actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "11px" }}>
                        <span style={{
                          fontSize: "8px", fontWeight: 700, padding: "2px 6px",
                          background: log.type === "model" ? "#8B6AAE15" : T.goldMuted,
                          color: log.type === "model" ? "#8B6AAE" : T.gold,
                        }}>
                          {log.type === "model" ? "LIVE MODEL" : "MANNEQUIN"}
                        </span>
                        <span style={{ fontWeight: 600, color: T.charcoal }}>{log.minutes} min</span>
                        <span style={{ flex: 1 }} />
                        <span style={{ color: T.textMuted, fontSize: "10px" }}>{log.date}</span>
                        {role === "admin" && onEditLog && (
                          <button onClick={() => onEditLog(skill.id, origIdx, log)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                            <Icon name="edit" size={10} color={T.textMuted} />
                          </button>
                        )}
                        {role === "resident" && onDeleteLog && (
                          <button onClick={() => onDeleteLog(skill.id, origIdx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Delete entry">
                            <Icon name="x" size={10} color={T.danger} />
                          </button>
                        )}
                      </div>
                      {/* Trainee note */}
                      {log.note && (
                        <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 4, paddingLeft: 2 }}>
                          {log.note}
                        </p>
                      )}
                      {/* Educator critique */}
                      {log.critique && (
                        <div style={{ marginTop: 4, padding: "6px 10px", background: T.educatorLight, borderLeft: "3px solid " + T.educator, fontSize: "11px", display: "flex", gap: 6, alignItems: "flex-start" }}>
                          <span style={{ fontSize: "8px", fontWeight: 700, marginTop: 2, flexShrink: 0, color: T.educator }}>EDUCATOR</span>
                          <span style={{ color: T.charcoal, fontWeight: 400, lineHeight: 1.4 }}>{log.critique}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SOP / Curriculum — tab bar */}
          <SOPViewer sop={skill.sop} />
        </div>
      )}
    </div>
  );
};

const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
  if (match) return "https://www.youtube.com/embed/" + match[1] + "?autoplay=1&rel=0";
  // Vimeo
  match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return "https://player.vimeo.com/video/" + match[1] + "?autoplay=1";
  return null;
};

const TraineeSkills = ({ user }) => {
  const { residents, setResidents, masterProgram, showToast } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const cats = getTraineeCats(me, masterProgram);
  const { total, done, pct } = getProgress(me, masterProgram);
  const [logModal, setLogModal] = useState(false);
  const [logSkill, setLogSkill] = useState(null);
  const [logMinutes, setLogMinutes] = useState("");
  const [logType, setLogType] = useState("mannequin");
  const [logNote, setLogNote] = useState("");
  const [playingVideo, setPlayingVideo] = useState(null);

  const openAddLog = (skill) => {
    setLogSkill(skill);
    setLogMinutes("");
    setLogType("mannequin");
    setLogNote("");
    setLogModal(true);
  };

  const saveLog = () => {
    if (!logMinutes || !logSkill) return;
    const mins = parseInt(logMinutes);
    if (isNaN(mins) || mins <= 0) return;
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const existing = logs[logSkill.id] || [];
      logs[logSkill.id] = [...existing, {
        minutes: mins,
        type: logType,
        date: new Date().toISOString().split("T")[0],
        note: logNote.trim(),
      }];
      return { ...r, timingLogs: logs };
    }));
    showToast("Practice logged — " + logMinutes + " min");
    setLogModal(false);
  };

  const deleteLog = (skillId, logIdx) => {
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const existing = [...(logs[skillId] || [])];
      existing.splice(logIdx, 1);
      logs[skillId] = existing;
      return { ...r, timingLogs: logs };
    }));
    showToast("Entry deleted");
  };

  return (
    <div className="fade-up">
      <SectionTitle sub={`${done} of ${total} skills mastered`}>My Skills</SectionTitle>
      {cats.length === 0 ? (
        <Card style={{ padding: 48, textAlign: "center" }}>
          <p style={{ color: T.textMuted, fontSize: "15px" }}>No skills assigned yet.</p>
        </Card>
      ) : (() => {
        // Find "currently working on" skills — in progress but not complete, sorted by highest progress
        const allSkills = cats.flatMap((c) => c.skills.map((s) => ({ ...s, catName: c.name, catColor: c.color || T.gold })));
        const inProgress = allSkills
          .filter((s) => {
            const p = getSkillProgress(me, s.id);
            const complete = isSkillComplete(me, s.id, masterProgram);
            if (complete) return false;
            if (s.type === "service") return p.technique > 0 || p.timing > 0;
            return false; // knowledge items don't have "in progress"
          })
          .sort((a, b) => getSkillPct(me, b.id, masterProgram) - getSkillPct(me, a.id, masterProgram))
          .slice(0, 2);

        // If nothing in progress, pick the first incomplete service skills
        const focusSkills = inProgress.length > 0 ? inProgress : allSkills
          .filter((s) => s.type === "service" && !isSkillComplete(me, s.id, masterProgram))
          .slice(0, 2);

        return (
        <>
          {/* Overall progress — compact */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px 20px", background: T.white, border: "1px solid " + T.lightLine }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "conic-gradient(" + T.gold + " " + (pct * 3.6) + "deg, " + T.creamDark + " 0deg)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, color: T.gold }}>
                {pct}%
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 500 }}>Overall Progress</p>
              <p style={{ fontSize: "12px", color: T.textMuted }}>{done} of {total} mastered</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {cats.map((c) => {
                const cd = c.skills.filter((s) => isSkillComplete(me, s.id, masterProgram)).length;
                return (
                  <div key={c.id} style={{ textAlign: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color || T.gold, margin: "0 auto 4px" }} />
                    <p style={{ fontSize: "14px", fontWeight: 600, color: cd === c.skills.length ? T.success : (c.color || T.gold) }}>{cd}/{c.skills.length}</p>
                    <p style={{ fontSize: "9px", color: T.textMuted, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hero: Currently Working On */}
          {focusSkills.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: T.gold, marginBottom: 12 }}>Currently Working On</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {focusSkills.map((sk) => (
                  <Card key={sk.id} style={{ padding: 0, overflow: "hidden", borderLeft: "4px solid " + (sk.catColor || T.gold) }}>
                    <div style={{ padding: "16px 20px", background: (sk.catColor || T.gold) + "12", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: T.fontD, fontSize: "20px", fontWeight: 600 }}>{sk.name}</span>
                          <Badge color={sk.catColor || T.gold}>{sk.catName}</Badge>
                        </div>
                        {sk.targetMin && (
                          <p style={{ fontSize: "11px", color: T.textMuted }}>Target: {sk.targetMin}min · Max: {sk.maxMin}min</p>
                        )}
                      </div>
                      <span style={{ fontFamily: T.fontD, fontSize: "28px", fontWeight: 600, color: sk.catColor || T.gold }}>{getSkillPct(me, sk.id, masterProgram)}%</span>
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      <SkillCard
                        skill={sk}
                        trainee={me}
                        masterProgram={masterProgram}
                        onAddLog={openAddLog}
                        onDeleteLog={deleteLog}
                        onPlayVideo={(v) => setPlayingVideo(v)}
                        role="resident"
                        timingLogs={(me.timingLogs || {})[sk.id] || []}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Categories — accordion */}
          <p style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: T.textMuted, marginBottom: 12 }}>All Categories</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cats.map((cat) => {
              const catDone = cat.skills.filter((s) => isSkillComplete(me, s.id, masterProgram)).length;
              const catPct = Math.round(cat.skills.reduce((a, s) => a + getSkillPct(me, s.id, masterProgram), 0) / cat.skills.length);
              return (
                <Card key={cat.id} style={{ overflow: "hidden", borderLeft: "4px solid " + (cat.color || T.gold) }}>
                  <details>
                    <summary style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", cursor: "pointer", listStyle: "none" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <h3 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600 }}>{cat.name}</h3>
                          <Badge color={catDone === cat.skills.length ? T.success : (cat.color || T.gold)}>{catDone}/{cat.skills.length}</Badge>
                        </div>
                        <ProgressBar value={catPct} height={4} color={cat.color || T.gold} />
                      </div>
                      <span style={{ fontSize: "11px", color: T.textMuted }}>▼</span>
                    </summary>
                    <div style={{ padding: "0 20px 20px" }}>
                      {/* Category intro videos */}
                      {(cat.videos || []).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                          {cat.videos.map((v) => (
                            <button key={v.id} onClick={() => setPlayingVideo(v)} style={{
                              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 4,
                              background: "#8B6AAE10", fontSize: "11px", color: "#8B6AAE", fontWeight: 500,
                              border: "none", cursor: "pointer",
                            }}>
                              <Icon name="play" size={12} color="#8B6AAE" />
                              {v.title}
                              <span style={{ color: T.textMuted, fontSize: "10px" }}>{v.duration}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {cat.skills.map((sk) => (
                          <SkillCard
                            key={sk.id}
                            skill={sk}
                            trainee={me}
                            masterProgram={masterProgram}
                            onAddLog={openAddLog}
                            onDeleteLog={deleteLog}
                            onPlayVideo={(v) => setPlayingVideo(v)}
                            role="resident"
                            timingLogs={(me.timingLogs || {})[sk.id] || []}
                          />
                        ))}
                      </div>
                    </div>
                  </details>
                </Card>
              );
            })}
          </div>

          {/* Log Time Modal */}
          <Modal open={logModal} onClose={() => setLogModal(false)} title={"Log Practice — " + (logSkill?.name || "")} width={420}>
            {logSkill && logSkill.targetMin && (
              <div style={{ padding: 12, borderRadius: T.radiusSm, background: T.goldMuted, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <Icon name="zap" size={16} color={T.gold} />
                <span style={{ fontSize: "12px", color: T.gold }}>
                  Target: <b>{logSkill.targetMin}min</b> · Max: <b>{logSkill.maxMin}min</b>
                </span>
              </div>
            )}
            <FormField label="Time (minutes)">
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(e.target.value)}
                  placeholder="e.g. 55"
                  style={iSt}
                  autoFocus
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted }}>min</span>
              </div>
            </FormField>
            <FormField label="Practice Type">
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setLogType("mannequin")} style={{
                  flex: 1, padding: "12px 14px", borderRadius: T.radiusSm,
                  border: "2px solid " + (logType === "mannequin" ? T.gold : T.creamDark),
                  background: logType === "mannequin" ? T.goldMuted : T.cream,
                  cursor: "pointer", textAlign: "center",
                }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: logType === "mannequin" ? T.gold : T.text }}>Mannequin</p>
                  <p style={{ fontSize: "11px", color: T.textMuted }}>Practice head</p>
                </button>
                <button onClick={() => setLogType("model")} style={{
                  flex: 1, padding: "12px 14px", borderRadius: T.radiusSm,
                  border: "2px solid " + (logType === "model" ? "#8B6AAE" : T.creamDark),
                  background: logType === "model" ? "#8B6AAE15" : T.cream,
                  cursor: "pointer", textAlign: "center",
                }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: logType === "model" ? "#8B6AAE" : T.text }}>Live Model</p>
                  <p style={{ fontSize: "11px", color: T.textMuted }}>Real person</p>
                </button>
              </div>
            </FormField>
            <FormField label="Notes (optional)">
              <input value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder="e.g. Struggled with blending around crown" style={iSt} />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <Btn variant="outline" onClick={() => setLogModal(false)}>Cancel</Btn>
              <Btn onClick={saveLog}>Log Time</Btn>
            </div>
          </Modal>

          {/* Video Player Modal */}
          <Modal open={!!playingVideo} onClose={() => setPlayingVideo(null)} title={playingVideo?.title || "Video"} width={700}>
            {playingVideo && (() => {
              const url = playingVideo.url;
              const isDataUrl = url && (url.startsWith("data:") || url.startsWith("blob:"));
              const embedUrl = !isDataUrl ? getEmbedUrl(url) : null;

              if (isDataUrl) {
                // Direct upload — use HTML5 video player
                return (
                  <div>
                    <video controls autoPlay style={{ width: "100%", maxHeight: "70vh", background: T.charcoal }} src={url} />
                    <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "12px", color: T.textMuted }}>{playingVideo.duration}</p>
                      {playingVideo.fileName && <p style={{ fontSize: "11px", color: T.textMuted }}>{playingVideo.fileName}</p>}
                    </div>
                  </div>
                );
              }

              if (embedUrl) {
                // YouTube/Vimeo embed
                return (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                    <iframe
                      src={embedUrl}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }

              // Fallback for unrecognized URLs
              return (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <Icon name="play" size={48} color="#8B6AAE" />
                  <p style={{ fontSize: "14px", fontWeight: 500, marginTop: 12 }}>{playingVideo.title}</p>
                  <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 4, marginBottom: 16 }}>{playingVideo.duration}</p>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px",
                    background: "#8B6AAE", color: T.white, textDecoration: "none", fontSize: "13px", fontWeight: 500,
                  }}>
                    <Icon name="play" size={14} color={T.white} /> Open Video
                  </a>
                </div>
              );
            })()}
          </Modal>
        </>
        );
      })()}
    </div>
  );
};

// ════════════════════════════════════════════
//  TRAINEE: HANDBOOK
// ════════════════════════════════════════════
const HANDBOOK_SECTIONS = [
  { id: "welcome", num: "01", title: "Welcome & Program Overview", content: [
    { type: "p", text: "Welcome to Flowe Collective. You have been selected to join our stylist training program — a comprehensive, hands-on experience designed to prepare you for a successful career behind the chair." },
    { type: "p", text: "This program is built on three pillars: technical mastery, timing proficiency, and professional development. Over the next 12 weeks, you will work through a customized training track tailored to your career goals." },
    { type: "h3", text: "What to Expect" },
    { type: "li", items: ["A personalized skill track assigned by your educator", "Hands-on practice on mannequins and live models", "Regular coaching sessions and progress evaluations", "Access to your personal training portal", "A supportive community of fellow trainees and mentors"] },
    { type: "h3", text: "Your Training Portal" },
    { type: "p", text: "Your portal is your home base throughout the program. Use it to view your schedule, track your skill progress, log your practice times, access documents, message your educator, and monitor your tuition status." },
  ]},
  { id: "schedule", num: "02", title: "Schedule & Expectations", content: [
    { type: "p", text: "Your weekly schedule is managed through the training portal calendar. Your educator will post all sessions, workshops, and coaching appointments there. Check it daily." },
    { type: "h3", text: "Typical Weekly Structure" },
    { type: "li", items: ["Morning Sessions (9–12 PM): Workshops, technique demos, guided practice", "Afternoon Sessions (1–4 PM): Floor time, model appointments, 1-on-1 coaching", "Independent Practice: Additional mannequin time before and after sessions"] },
    { type: "h3", text: "Session Types" },
    { type: "li", items: ["Workshop — Group instruction on specific techniques", "Coaching — One-on-one time with your educator", "Ritual — Morning circles, reflections, community activities", "Assessment — Formal skill evaluations"] },
  ]},
  { id: "policies", num: "03", title: "Salon Policies & Standards", content: [
    { type: "p", text: "As a trainee at Flowe Collective, you are a representative of our brand. The following policies apply to all trainees while on the salon floor." },
    { type: "h3", text: "Workstation Standards" },
    { type: "li", items: ["Clean and sanitize your station before and after every session", "Disinfect all tools per state board requirements", "Store personal belongings in designated areas", "No food or open beverages at your workstation"] },
    { type: "h3", text: "Client-Facing Standards" },
    { type: "li", items: ["Greet every client warmly and professionally", "Maintain a positive, solution-oriented attitude", "Never speak negatively about other stylists or salons", "Consult your educator if unsure about a service"] },
  ]},
  { id: "dress", num: "04", title: "Dress Code & Appearance", content: [
    { type: "p", text: "Your appearance reflects the Flowe Collective brand. We expect a polished, professional look that inspires client confidence." },
    { type: "h3", text: "Required" },
    { type: "li", items: ["All-black attire (top and bottom)", "Closed-toe shoes", "Clean, styled hair — your hair is your business card", "Flowe Collective apron (provided) during floor time"] },
    { type: "h3", text: "Not Permitted" },
    { type: "li", items: ["Graphic tees, athleisure, or overly casual clothing", "Strong fragrances", "Excessively long nails that interfere with services"] },
  ]},
  { id: "tuition", num: "05", title: "Tuition & Payment Info", content: [
    { type: "p", text: "Flowe Collective offers two payment options: Pay in Full at $4,500 (one-time) or a Monthly Plan at $1,650/month for 3 months ($4,950 total)." },
    { type: "p", text: "Your payment status is visible in the 'My Tuition' section of your portal. You can view your balance and payment history at any time." },
    { type: "h3", text: "Refund Policy" },
    { type: "p", text: "Tuition is non-refundable after the first week. Trainees who withdraw within the first 5 business days may request a partial refund minus a $500 administrative fee." },
  ]},
  { id: "skills", num: "06", title: "Skill Progression Explained", content: [
    { type: "p", text: "Every service skill is evaluated on two dimensions: technique mastery and timing proficiency. Knowledge items are simply complete or not complete." },
    { type: "h3", text: "Technique Stages" },
    { type: "li", items: ["Not Started → Theory → Mannequin → Competent"] },
    { type: "h3", text: "Timing Stages" },
    { type: "li", items: ["Not Started → Slow → On Pace → Floor Ready"] },
    { type: "h3", text: "Logging Times" },
    { type: "p", text: "Use the timer in your portal to track practice sessions. Log mannequin and live model times separately. Your running averages help you and your educator track your improvement." },
    { type: "h3", text: "Who Controls What" },
    { type: "li", items: ["You: Log timing entries and delete accidental entries", "Your Educator: Sets technique/timing stage levels, edits timing entries"] },
  ]},
  { id: "clients", num: "07", title: "Client Interaction Guidelines", content: [
    { type: "p", text: "Client experience is as important as technical skill. Every interaction builds trust and demonstrates professionalism." },
    { type: "h3", text: "The Consultation" },
    { type: "li", items: ["Always start with a thorough consultation", "Ask open-ended questions", "Repeat back what you've heard to confirm", "Be honest about what's achievable", "Involve your educator for services beyond your level"] },
    { type: "h3", text: "Handling Difficult Situations" },
    { type: "p", text: "If a client is unhappy, stay calm and listen. Acknowledge their concern, then consult your educator before attempting a correction. Never argue or become defensive." },
  ]},
  { id: "safety", num: "08", title: "Health & Safety Protocols", content: [
    { type: "h3", text: "Sanitation" },
    { type: "li", items: ["Disinfect all tools between every client", "Wash hands before and after every service", "Use clean capes, towels, and neck strips for each client", "Clean your station and sweep after every appointment"] },
    { type: "h3", text: "Chemical Safety" },
    { type: "li", items: ["Always wear gloves for color and chemical treatments", "Perform patch tests when required", "Never mix chemicals not designed to be combined", "Report allergic reactions or burns immediately"] },
    { type: "h3", text: "Ergonomics" },
    { type: "p", text: "Maintain good posture, wear supportive shoes, stretch regularly, and take breaks. Your longevity in this industry depends on how well you care for yourself." },
  ]},
  { id: "attendance", num: "09", title: "Attendance & Conduct", content: [
    { type: "h3", text: "Attendance" },
    { type: "li", items: ["Attend all scheduled sessions on time", "Notify your educator at least 24 hours in advance for absences", "Two+ unexcused absences triggers a standing review", "Chronic tardiness (10+ min) counts as a partial absence"] },
    { type: "h3", text: "Professional Conduct" },
    { type: "li", items: ["Treat all staff, trainees, and clients with respect", "Phones on silent and out of sight during sessions", "Social media use only for portfolio content, with client consent"] },
    { type: "h3", text: "Grounds for Dismissal" },
    { type: "p", text: "Theft, violence, showing up under the influence, harassment, intentional property damage, or repeated policy violations may result in immediate removal." },
  ]},
  { id: "graduation", num: "10", title: "Graduation Requirements", content: [
    { type: "p", text: "To graduate from the Flowe Collective training program, you must meet all of the following:" },
    { type: "h3", text: "Requirements" },
    { type: "li", items: [
      "All service skills at Competent (technique) and On Pace or Floor Ready (timing)",
      "All knowledge items marked Complete",
      "Live model average at or below Maximum time for each service skill",
      "At least 3 live model timing entries per service skill",
      "All tuition payments current — no outstanding balance",
      "No more than 3 total absences across the program",
      "Pass the final comprehensive assessment",
    ]},
    { type: "h3", text: "What You Receive" },
    { type: "li", items: [
      "Flowe Collective Certificate of Completion",
      "Letter of recommendation from your educator",
      "Priority consideration for open positions at Flowe",
      "Lifetime access to the Flowe alumni network",
    ]},
  ]},
];

const HandbookPage = () => {
  const [activeSection, setActiveSection] = useState("welcome");

  const renderContent = (content) => content.map((block, i) => {
    if (block.type === "p") return <p key={i} style={{ fontSize: "13px", lineHeight: 1.7, color: T.text, marginBottom: 12 }}>{block.text}</p>;
    if (block.type === "h3") return <h4 key={i} style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600, color: T.gold, marginTop: 16, marginBottom: 8 }}>{block.text}</h4>;
    if (block.type === "li") return <ul key={i} style={{ paddingLeft: 20, marginBottom: 12 }}>{block.items.map((item, j) => <li key={j} style={{ fontSize: "13px", lineHeight: 1.7, color: T.text, marginBottom: 4 }}>{item}</li>)}</ul>;
    return null;
  });

  return (
    <div className="fade-up">
      <SectionTitle sub="Your complete guide to the Flowe training program">Trainee Handbook</SectionTitle>
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>
        {/* TOC sidebar */}
        <Card style={{ padding: 16, position: "sticky", top: 20 }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 10 }}>Contents</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {HANDBOOK_SECTIONS.map((sec) => (
              <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: T.radiusSm,
                border: "none", background: activeSection === sec.id ? T.goldMuted : "transparent",
                cursor: "pointer", textAlign: "left", fontSize: "11px",
                color: activeSection === sec.id ? T.charcoal : T.textMuted,
                fontWeight: activeSection === sec.id ? 600 : 400,
              }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: T.gold, minWidth: 18 }}>{sec.num}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sec.title}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Content */}
        <Card style={{ padding: 32 }}>
          {HANDBOOK_SECTIONS.filter((s) => s.id === activeSection).map((sec) => (
            <div key={sec.id}>
              <span style={{ fontSize: "36px", fontFamily: T.fontD, fontWeight: 600, color: T.goldLight }}>{sec.num}</span>
              <h2 style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600, color: T.charcoal, marginBottom: 4 }}>{sec.title}</h2>
              <div style={{ height: 2, width: 60, background: T.gold, borderRadius: 1, marginBottom: 20 }} />
              {renderContent(sec.content)}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//  TRAINEE: DOCS
// ════════════════════════════════════════════
const TraineeDocs = () => {
  const { docs } = useData();
  const [f, setF] = useState("All");
  const [viewDoc, setViewDoc] = useState(null);
  const cats = ["All", ...new Set(docs.map((d) => d.category))];
  const fd = f === "All" ? docs : docs.filter((d) => d.category === f);

  const handleOpen = (doc) => {
    if (doc.url) {
      window.open(doc.url, "_blank");
    } else if (doc.dataUrl) {
      setViewDoc(doc);
    }
  };

  const handleDownload = (doc) => {
    if (!doc.dataUrl) return;
    const a = document.createElement("a");
    a.href = doc.dataUrl;
    a.download = doc.name;
    a.click();
  };

  return (
    <div className="fade-up">
      <SectionTitle sub="Training materials and resources">Documents</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setF(c)} style={{
            padding: "8px 16px", borderRadius: 20, border: "none",
            background: f === c ? T.charcoal : T.white, color: f === c ? T.cream : T.textMuted,
            fontSize: "12px", fontWeight: 500, cursor: "pointer", boxShadow: f === c ? "none" : T.shadow,
          }}>{c}</button>
        ))}
      </div>
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {fd.map((doc) => (
          <Card key={doc.id} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: T.radiusSm, background: T.goldMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="file" size={20} color={T.gold} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
              <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>{doc.size} · {doc.date}</p>
            </div>
            <Badge color={T.textMuted}>{doc.category}</Badge>
            {(doc.dataUrl || doc.url) && (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => handleOpen(doc)} title="View" style={{ background: T.goldMuted, border: "none", borderRadius: 4, padding: 6, cursor: "pointer" }}>
                  <Icon name="eye" size={14} color={T.gold} />
                </button>
                {doc.dataUrl && (
                  <button onClick={() => handleDownload(doc)} title="Download" style={{ background: T.charcoalMuted, border: "none", borderRadius: 4, padding: 6, cursor: "pointer" }}>
                    <Icon name="download" size={14} color={T.textMuted} />
                  </button>
                )}
              </div>
            )}
          </Card>
        ))}
        {fd.length === 0 && <p style={{ color: T.textMuted, fontSize: "13px", gridColumn: "1 / -1", textAlign: "center", padding: 32 }}>No documents in this category.</p>}
      </div>

      {/* Document Viewer Modal */}
      <Modal open={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc?.name || ""} width={700}>
        {viewDoc && viewDoc.dataUrl && (
          <div>
            {viewDoc.fileType === "image" ? (
              <img src={viewDoc.dataUrl} alt={viewDoc.name} style={{ width: "100%", borderRadius: T.radiusSm }} />
            ) : viewDoc.fileType === "pdf" ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Icon name="file" size={48} color={T.gold} />
                <p style={{ fontSize: "14px", fontWeight: 500, marginTop: 12 }}>{viewDoc.name}</p>
                <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 4, marginBottom: 16 }}>{viewDoc.size}</p>
                <Btn onClick={() => handleDownload(viewDoc)} style={{ margin: "0 auto" }}>
                  <Icon name="download" size={14} color={T.cream} /> Download PDF
                </Btn>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Icon name="file" size={48} color={T.gold} />
                <p style={{ fontSize: "14px", fontWeight: 500, marginTop: 12 }}>{viewDoc.name}</p>
                <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 4, marginBottom: 16 }}>{viewDoc.size}</p>
                <Btn onClick={() => handleDownload(viewDoc)} style={{ margin: "0 auto" }}>
                  <Icon name="download" size={14} color={T.cream} /> Download File
                </Btn>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  MESSAGES (shared)
// ════════════════════════════════════════════
const MsgPage = ({ user }) => {
  const { messages, setMessages } = useData();
  const [msg, setMsg] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!msg.trim()) return;
    setMessages((p) => [...p, { id: Date.now(), from: user.id, to: user.role === "admin" ? "r1" : "a1", text: msg.trim(), time: new Date().toISOString(), read: false }]);
    setMsg("");
  };

  const partner = user.role === "admin" ? "Maya Johnson" : "Flowe Educator";

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      <SectionTitle sub={`Conversation with ${partner}`}>Messages</SectionTitle>
      <Card style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.lightLine}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={partner} size={32} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500 }}>{partner}</p>
            <p style={{ fontSize: "11px", color: T.educator }}>● Online</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m) => {
            const isMe = m.from === user.id;
            const isFromEducator = m.from === "a1";
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "12px 16px",
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                    background: isMe
                      ? (user.role === "admin" ? T.educator : T.charcoal)
                      : (isFromEducator ? T.educatorLight : T.cream),
                    color: isMe ? T.cream : T.text,
                    borderLeft: !isMe && isFromEducator ? "3px solid " + T.educator : "none",
                  }}
                >
                  {!isMe && (
                    <p style={{ fontSize: "9px", fontWeight: 600, color: isFromEducator ? T.educator : T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                      {isFromEducator ? "Educator" : "Resident"}
                    </p>
                  )}
                  <p style={{ fontSize: "13px", lineHeight: 1.5 }}>{m.text}</p>
                  <p style={{ fontSize: "10px", color: isMe ? "rgba(250,246,240,0.5)" : T.textMuted, marginTop: 4, textAlign: "right" }}>
                    {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={ref} />
        </div>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.lightLine}`, display: "flex", gap: 10 }}>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: `1.5px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", outline: "none" }}
          />
          <button onClick={send} style={{ width: 44, height: 44, borderRadius: "50%", background: user.role === "admin" ? T.educator : T.charcoal, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="send" size={18} color={T.cream} />
          </button>
        </div>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: DASHBOARD
// ════════════════════════════════════════════
const AdminDash = () => {
  const { schedule, presets, docs, residents, masterProgram } = useData();

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: T.fontD, fontSize: "34px", fontWeight: 600, marginBottom: 4 }}>Educator Dashboard</h1>
        <p style={{ color: T.textMuted, fontSize: "14px" }}>Your training program at a glance.</p>
      </div>
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)"}} className="grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { l: "Trainees", v: residents.length, i: "users", a: T.gold },
          { l: "Events", v: schedule.length, i: "calendar", a: T.success },
          { l: "Presets", v: presets.length, i: "zap", a: T.warn },
          { l: "Documents", v: docs.length, i: "file", a: "#8B6AAE" },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted }}>{s.l}</p>
              <Icon name={s.i} size={18} color={s.a} />
            </div>
            <p style={{ fontFamily: T.fontD, fontSize: "36px", fontWeight: 600, color: s.a, lineHeight: 1 }}>{s.v}</p>
          </Card>
        ))}
      </div>
      <Card style={{ padding: 24 }}>
        <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>Trainee Progress</h3>
        {residents.map((r, i) => {
          const { pct, done, total } = getProgress(r, masterProgram);
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < residents.length - 1 ? `1px solid ${T.lightLine}` : "none" }}>
              <Avatar name={r.name} size={36} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: 500 }}>{r.name}</p>
                <p style={{ fontSize: "11px", color: T.textMuted }}>{done}/{total} skills · {r.cohort}</p>
              </div>
              <div style={{ width: 120 }}><ProgressBar value={pct} /></div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: T.gold, minWidth: 36, textAlign: "right" }}>{pct}%</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: SCHEDULE
// ════════════════════════════════════════════
const AdminSchedule = () => {
  const { schedule, setSchedule, gcalEvents, masterProgram, residents, showToast } = useData();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", date: "2026-03-05", time: "9:00 AM", type: "skill", assignTo: "all", skillId: "" });
  const [editId, setEditId] = useState(null);
  const cal = useCalendar(2026, 2);

  const EVENT_TYPES = [
    { id: "skill", label: "Skill Session", desc: "Linked to a master program skill" },
    { id: "mannequin", label: "Mannequin Day", desc: "Practice head time" },
    { id: "model", label: "Model Day", desc: "Live model appointments" },
    { id: "general", label: "General", desc: "Meetings, coaching, etc." },
  ];

  const allSkills = masterProgram.flatMap((c) => c.skills.map((s) => ({ ...s, catName: c.name })));

  const openNew = (date) => {
    setForm({ title: "", date: date || "2026-03-05", time: "9:00 AM", type: "skill", assignTo: "all", skillId: "" });
    setEditId(null);
    setModal(true);
  };
  const openEdit = (ev) => {
    setForm({ title: ev.title, date: ev.date, time: ev.time, type: ev.type, assignTo: ev.assignTo || "all", skillId: ev.skillId || "" });
    setEditId(ev.id);
    setModal(true);
  };

  // Auto-fill title when skill is selected
  const handleSkillChange = (skillId) => {
    const sk = allSkills.find((s) => s.id === skillId);
    setForm((f) => ({ ...f, skillId, title: sk ? sk.name : f.title }));
  };

  const save = () => {
    if (!form.title.trim()) return;
    const event = { ...form };
    if (event.type !== "skill") event.skillId = null;
    if (editId) {
      setSchedule((p) => p.map((e) => (e.id === editId ? { ...e, ...event } : e)));
      showToast("Event updated");
    } else {
      setSchedule((p) => [...p, { id: Date.now(), ...event }]);
      showToast("Event added");
    }
    setModal(false);
  };
  const rem = (id) => { setSchedule((p) => p.filter((e) => e.id !== id)); showToast("Event removed"); };
  const handleDayClick = (date) => { cal.setSelectedDate(date); };
  const selectedEvents = cal.selectedDate ? schedule.filter((e) => e.date === cal.selectedDate) : [];

  const getAssignLabel = (ev) => {
    if (ev.assignTo === "all") return "All trainees";
    const r = residents.find((x) => x.id === ev.assignTo);
    return r ? r.name : ev.assignTo;
  };

  return (
    <div className="fade-up">
      <SectionTitle
        sub="Schedule skill sessions, mannequin days, model days, and general events"
        action={<Btn onClick={() => openNew(cal.selectedDate)}><Icon name="plus" size={16} color={T.cream} /> Add Event</Btn>}
      >
        Schedule Manager
      </SectionTitle>

      {/* Event type legend */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {EVENT_TYPES.map((et) => (
          <div key={et.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: T.white, fontSize: "11px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: TC[et.id] || T.gold }} />
            <span style={{ color: T.textMuted, fontWeight: 500 }}>{et.label}</span>
          </div>
        ))}
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <CalendarHeader cal={cal} />
        <MonthGrid cal={cal} schedule={schedule} gcalEvents={gcalEvents} onDayClick={handleDayClick} />
      </Card>

      {cal.selectedDate && (
        <Card className="fade-up" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600 }}>
              {MONTH_NAMES[parseInt(cal.selectedDate.split("-")[1], 10) - 1]} {parseInt(cal.selectedDate.split("-")[2], 10)}
            </h4>
            <Btn variant="gold" onClick={() => openNew(cal.selectedDate)}>
              <Icon name="plus" size={14} color={T.gold} /> Add to this day
            </Btn>
          </div>
          {selectedEvents.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No events on this day.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedEvents.map((ev) => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: T.radiusSm, background: T.cream }}>
                  <div style={{ width: 4, height: 40, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ fontSize: "14px", fontWeight: 500 }}>{ev.title}</p>
                      {ev.skillId && <span style={{ fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: T.goldMuted, color: T.gold }}>SKILL</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <p style={{ fontSize: "12px", color: T.textMuted }}>{ev.time}</p>
                      <span style={{ fontSize: "10px", color: T.textMuted }}>·</span>
                      <p style={{ fontSize: "11px", color: ev.assignTo === "all" ? T.textMuted : T.gold, fontWeight: ev.assignTo === "all" ? 400 : 500 }}>{getAssignLabel(ev)}</p>
                    </div>
                  </div>
                  <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
                  <button onClick={() => openEdit(ev)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Icon name="edit" size={16} color={T.textMuted} /></button>
                  <button onClick={() => rem(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Icon name="trash" size={16} color={T.danger} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Event" : "Schedule Event"} width={520}>
        {/* Event Type Picker */}
        <FormField label="Event Type">
          <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {EVENT_TYPES.map((et) => (
              <button key={et.id} onClick={() => setForm((f) => ({ ...f, type: et.id }))} style={{
                padding: "10px 12px", borderRadius: T.radiusSm, border: "2px solid " + (form.type === et.id ? TC[et.id] || T.gold : T.creamDark),
                background: form.type === et.id ? (TC[et.id] || T.gold) + "15" : T.cream,
                cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: TC[et.id] || T.gold }} />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: form.type === et.id ? T.charcoal : T.textMuted }}>{et.label}</span>
                </div>
                <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 2, marginLeft: 14 }}>{et.desc}</p>
              </button>
            ))}
          </div>
        </FormField>

        {/* Skill picker (only for skill type) */}
        {form.type === "skill" && (
          <FormField label="Link to Skill">
            <select value={form.skillId} onChange={(e) => handleSkillChange(e.target.value)} style={selSt}>
              <option value="">Select a skill...</option>
              {masterProgram.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.skills.map((sk) => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
                </optgroup>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Event Title">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={form.type === "mannequin" ? "Mannequin Practice" : form.type === "model" ? "Live Model Day" : "Event name"} style={iSt} />
        </FormField>

        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Date"><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={iSt} /></FormField>
          <FormField label="Time"><input value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="10:00 AM" style={iSt} /></FormField>
        </div>

        {/* Assign to */}
        <FormField label="Assign To">
          <select value={form.assignTo} onChange={(e) => setForm((f) => ({ ...f, assignTo: e.target.value }))} style={selSt}>
            <option value="all">All Trainees (Cohort-wide)</option>
            {residents.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </FormField>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save}>{editId ? "Save Changes" : "Add Event"}</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: MASTER PROGRAM
// ════════════════════════════════════════════
const AdminMaster = () => {
  const { masterProgram, setMasterProgram, showToast } = useData();
  const [catModal, setCatModal] = useState(false);
  const [skModal, setSkModal] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newSk, setNewSk] = useState("");
  const [newSkType, setNewSkType] = useState("service");
  const [newSkSop, setNewSkSop] = useState({ steps: "", mistakes: "", consultation: "", tips: "", tools: "" });
  const [newSkSopTab, setNewSkSopTab] = useState("steps");
  const [targetCat, setTargetCat] = useState(null);
  const [dragCatId, setDragCatId] = useState(null);
  const [dragOverCatId, setDragOverCatId] = useState(null);
  const [timingModal, setTimingModal] = useState(false);
  const [timingSkill, setTimingSkill] = useState(null);
  const [timingCatId, setTimingCatId] = useState(null);
  const [editTarget, setEditTarget] = useState("");
  const [editMax, setEditMax] = useState("");
  const [renameModal, setRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null); // "cat" or "skill"
  const [renameCatId, setRenameCatId] = useState(null);
  const [renameSkillId, setRenameSkillId] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [videoModal, setVideoModal] = useState(false);
  const [videoTarget, setVideoTarget] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoMode, setVideoMode] = useState("upload"); // "upload" or "link"
  const [sopModal, setSopModal] = useState(false);
  const [sopCatId, setSopCatId] = useState(null);
  const [sopSkillId, setSopSkillId] = useState(null);
  const [sopData, setSopData] = useState({ steps: "", mistakes: "", consultation: "", tips: "", tools: "" });
  const [sopTab, setSopTab] = useState("steps");

  const [colorPickerCatId, setColorPickerCatId] = useState(null);
  const setCatColor = (catId, color) => {
    setMasterProgram((p) => p.map((c) => c.id === catId ? { ...c, color } : c));
    setColorPickerCatId(null);
    showToast("Color updated");
  };

  const addCat = () => { if (!newCat.trim()) return; const nextColor = CAT_COLORS[masterProgram.length % CAT_COLORS.length]; setMasterProgram((p) => [...p, { id: `c_${uid()}`, name: newCat.trim(), color: nextColor, videos: [], skills: [] }]); setNewCat(""); setCatModal(false); showToast("Category added"); };

  // Delete confirmation + archive
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: "cat"|"skill", catId, skillId?, name, details }
  const [showArchive, setShowArchive] = useState(false);
  const [archived, setArchived] = useState([]);

  const confirmDeleteCat = (cat) => {
    const sopCount = cat.skills.filter((s) => s.sop && Object.values(s.sop).some((v) => v)).length;
    const videoCount = (cat.videos || []).length + cat.skills.reduce((a, s) => a + (s.videos || []).length, 0);
    setDeleteTarget({
      type: "cat", catId: cat.id, name: cat.name,
      details: `${cat.skills.length} skill${cat.skills.length !== 1 ? "s" : ""}${sopCount ? `, ${sopCount} with curriculum` : ""}${videoCount ? `, ${videoCount} video${videoCount !== 1 ? "s" : ""}` : ""}`,
    });
    setDeleteModal(true);
  };
  const confirmDeleteSk = (catId, sk) => {
    const hasSop = sk.sop && Object.values(sk.sop).some((v) => v);
    const videoCount = (sk.videos || []).length;
    setDeleteTarget({
      type: "skill", catId, skillId: sk.id, name: sk.name,
      details: `${hasSop ? "Has curriculum content" : "No curriculum"}${videoCount ? `, ${videoCount} video${videoCount !== 1 ? "s" : ""}` : ""}`,
    });
    setDeleteModal(true);
  };
  const executeDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "cat") {
      const cat = masterProgram.find((c) => c.id === deleteTarget.catId);
      if (cat) setArchived((p) => [...p, { ...cat, archivedAt: new Date().toISOString().split("T")[0], archiveType: "category" }]);
      setMasterProgram((p) => p.filter((c) => c.id !== deleteTarget.catId));
      showToast("Category archived");
    } else {
      const cat = masterProgram.find((c) => c.id === deleteTarget.catId);
      const sk = cat?.skills.find((s) => s.id === deleteTarget.skillId);
      if (sk) setArchived((p) => [...p, { ...sk, fromCategory: cat?.name, archivedAt: new Date().toISOString().split("T")[0], archiveType: "skill" }]);
      setMasterProgram((p) => p.map((c) => c.id === deleteTarget.catId ? { ...c, skills: c.skills.filter((s) => s.id !== deleteTarget.skillId) } : c));
      showToast("Skill archived");
    }
    setDeleteModal(false);
    setDeleteTarget(null);
  };
  const restoreItem = (item, idx) => {
    if (item.archiveType === "category") {
      const { archivedAt, archiveType, ...cat } = item;
      setMasterProgram((p) => [...p, cat]);
    } else {
      // Restore skill — try to find its original category, or put in first category
      const { fromCategory, archivedAt, archiveType, ...sk } = item;
      const targetCatObj = masterProgram.find((c) => c.name === fromCategory) || masterProgram[0];
      if (targetCatObj) {
        setMasterProgram((p) => p.map((c) => c.id === targetCatObj.id ? { ...c, skills: [...c.skills, sk] } : c));
      }
    }
    setArchived((p) => p.filter((_, i) => i !== idx));
    showToast("Restored");
  };

  const openAddSk = (cid) => { setTargetCat(cid); setNewSk(""); setNewSkType("service"); setEditTarget(""); setEditMax(""); setNewSkSop({ steps: "", mistakes: "", consultation: "", tips: "", tools: "" }); setNewSkSopTab("steps"); setSkModal(true); };
  const addSk = () => {
    if (!newSk.trim() || !targetCat) return;
    const skill = { id: `sk_${uid()}`, name: newSk.trim(), type: newSkType, videos: [] };
    if (newSkType === "service") {
      skill.targetMin = parseInt(editTarget) || 0;
      skill.maxMin = parseInt(editMax) || 0;
    }
    // Include SOP if any section has content
    const hasSop = Object.values(newSkSop).some((v) => v && v.trim());
    if (hasSop) skill.sop = { ...newSkSop };
    setMasterProgram((p) => p.map((c) => c.id === targetCat ? { ...c, skills: [...c.skills, skill] } : c));
    setNewSk(""); setSkModal(false); showToast("Skill added");
  };
  const openEditTiming = (cid, sk) => {
    setTimingCatId(cid);
    setTimingSkill(sk);
    setEditTarget(sk.targetMin ? String(sk.targetMin) : "");
    setEditMax(sk.maxMin ? String(sk.maxMin) : "");
    setTimingModal(true);
  };
  const saveTiming = () => {
    if (!timingSkill || !timingCatId) return;
    const t = parseInt(editTarget) || 0;
    const m = parseInt(editMax) || 0;
    setMasterProgram((p) => p.map((c) => c.id === timingCatId
      ? { ...c, skills: c.skills.map((s) => s.id === timingSkill.id ? { ...s, targetMin: t, maxMin: m } : s) }
      : c
    ));
    setTimingModal(false);
    showToast("Timing standard updated");
  };

  const openRenameCat = (cat) => {
    setRenameType("cat"); setRenameCatId(cat.id); setRenameSkillId(null);
    setRenameName(cat.name); setRenameModal(true);
  };
  const openRenameSk = (catId, sk) => {
    setRenameType("skill"); setRenameCatId(catId); setRenameSkillId(sk.id);
    setRenameName(sk.name); setRenameModal(true);
  };
  const saveRename = () => {
    if (!renameName.trim()) return;
    if (renameType === "cat") {
      setMasterProgram((p) => p.map((c) => c.id === renameCatId ? { ...c, name: renameName.trim() } : c));
      showToast("Category renamed");
    } else {
      setMasterProgram((p) => p.map((c) => c.id === renameCatId
        ? { ...c, skills: c.skills.map((s) => s.id === renameSkillId ? { ...s, name: renameName.trim() } : s) }
        : c
      ));
      showToast("Skill renamed");
    }
    setRenameModal(false);
  };

  const openAddVideo = (catId, skillId) => {
    setVideoTarget(skillId ? { type: "skill", catId, skillId } : { type: "cat", catId });
    setVideoTitle(""); setVideoUrl(""); setVideoDuration(""); setVideoFile(null); setVideoMode("upload"); setVideoUploading(false);
    setVideoModal(true);
  };
  const handleVideoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUploading(true);
    // Auto-fill title from filename
    if (!videoTitle) {
      const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setVideoTitle(name.charAt(0).toUpperCase() + name.slice(1));
    }
    // Read file for demo mode (dataUrl) + detect duration
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setVideoUrl(dataUrl);
      // Detect duration using a hidden video element
      const vid = document.createElement("video");
      vid.preload = "metadata";
      vid.onloadedmetadata = () => {
        const mins = Math.floor(vid.duration / 60);
        const secs = Math.floor(vid.duration % 60);
        setVideoDuration(mins + ":" + String(secs).padStart(2, "0"));
        setVideoUploading(false);
        URL.revokeObjectURL(vid.src);
      };
      vid.onerror = () => { setVideoUploading(false); };
      vid.src = URL.createObjectURL(file);
    };
    reader.onerror = () => { setVideoUploading(false); };
    reader.readAsDataURL(file);
  };
  const saveVideo = () => {
    if (!videoTitle.trim() || !videoUrl.trim() || !videoTarget) return;
    const isUpload = videoMode === "upload" && videoFile;
    const vid = {
      id: `v_${uid()}`,
      title: videoTitle.trim(),
      url: videoUrl,
      duration: videoDuration.trim() || "—",
      source: isUpload ? "upload" : "link",
      fileName: isUpload ? videoFile.name : null,
    };
    setMasterProgram((p) => p.map((c) => {
      if (c.id !== videoTarget.catId) return c;
      if (videoTarget.type === "cat") return { ...c, videos: [...(c.videos || []), vid] };
      return { ...c, skills: c.skills.map((s) => s.id === videoTarget.skillId ? { ...s, videos: [...(s.videos || []), vid] } : s) };
    }));
    showToast("Video added");
    setVideoModal(false);
  };
  const removeVideo = (catId, skillId, videoId) => {
    setMasterProgram((p) => p.map((c) => {
      if (c.id !== catId) return c;
      if (!skillId) return { ...c, videos: (c.videos || []).filter((v) => v.id !== videoId) };
      return { ...c, skills: c.skills.map((s) => s.id === skillId ? { ...s, videos: (s.videos || []).filter((v) => v.id !== videoId) } : s) };
    }));
    showToast("Video removed");
  };

  const openSop = (catId, sk) => {
    setSopCatId(catId);
    setSopSkillId(sk.id);
    setSopData({
      steps: sk.sop?.steps || "",
      mistakes: sk.sop?.mistakes || "",
      consultation: sk.sop?.consultation || "",
      tips: sk.sop?.tips || "",
      tools: sk.sop?.tools || "",
    });
    setSopTab("steps");
    setSopModal(true);
  };
  const saveSop = () => {
    setMasterProgram((p) => p.map((c) => c.id === sopCatId
      ? { ...c, skills: c.skills.map((s) => s.id === sopSkillId ? { ...s, sop: { ...sopData } } : s) }
      : c
    ));
    showToast("Curriculum updated");
    setSopModal(false);
  };

  // Drag-and-drop reorder
  const handleCatDragStart = (e, catId) => {
    setDragCatId(catId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleCatDragOver = (e, catId) => {
    e.preventDefault();
    if (catId !== dragCatId) setDragOverCatId(catId);
  };
  const handleCatDragLeave = () => { setDragOverCatId(null); };
  const handleCatDrop = (e, targetCatId) => {
    e.preventDefault();
    setDragOverCatId(null);
    if (!dragCatId || dragCatId === targetCatId) { setDragCatId(null); return; }
    setMasterProgram((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((c) => c.id === dragCatId);
      const toIdx = arr.findIndex((c) => c.id === targetCatId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    setDragCatId(null);
    showToast("Category reordered");
  };
  const handleCatDragEnd = () => { setDragCatId(null); setDragOverCatId(null); };

  const totalSk = masterProgram.reduce((a, c) => a + c.skills.length, 0);

  return (
    <div className="fade-up">
      <SectionTitle sub={`${masterProgram.length} categories · ${totalSk} total skills · Drag to reorder`} action={
        <div style={{ display: "flex", gap: 8 }}>
          {archived.length > 0 && (
            <Btn variant="outline" onClick={() => setShowArchive(!showArchive)}>
              <Icon name="back" size={14} color={T.textMuted} /> Archive ({archived.length})
            </Btn>
          )}
          <Btn onClick={() => setCatModal(true)}><Icon name="plus" size={16} color={T.cream} /> Add Category</Btn>
        </div>
      }>
        Master Program
      </SectionTitle>

      {/* Archive panel */}
      {showArchive && archived.length > 0 && (
        <Card style={{ padding: 20, marginBottom: 20, border: "1px dashed " + T.lightLine }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600, color: T.textMuted }}>Archived Items</h4>
            <button onClick={() => setShowArchive(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Icon name="x" size={16} color={T.textMuted} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {archived.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.cream, fontSize: "12px" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", background: item.archiveType === "category" ? T.goldMuted : T.charcoalMuted, color: item.archiveType === "category" ? T.gold : T.textMuted }}>
                  {item.archiveType === "category" ? "CATEGORY" : "SKILL"}
                </span>
                <span style={{ fontWeight: 500, flex: 1 }}>{item.name}</span>
                {item.fromCategory && <span style={{ fontSize: "10px", color: T.textMuted }}>from {item.fromCategory}</span>}
                <span style={{ fontSize: "10px", color: T.textMuted }}>{item.archivedAt}</span>
                <Btn variant="gold" onClick={() => restoreItem(item, idx)} style={{ padding: "4px 10px", fontSize: "10px" }}>
                  Restore
                </Btn>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {masterProgram.map((cat) => {
          const isDragging = dragCatId === cat.id;
          const isDragOver = dragOverCatId === cat.id;
          return (
            <div
              key={cat.id}
              draggable
              onDragStart={(e) => handleCatDragStart(e, cat.id)}
              onDragOver={(e) => handleCatDragOver(e, cat.id)}
              onDragLeave={handleCatDragLeave}
              onDrop={(e) => handleCatDrop(e, cat.id)}
              onDragEnd={handleCatDragEnd}
              style={{ transition: "all .2s" }}
            >
              <Card style={{
                padding: 22,
                opacity: isDragging ? 0.4 : 1,
                transform: isDragOver ? "scale(1.01)" : "none",
                borderColor: isDragOver ? T.gold : T.lightLine,
                borderLeft: "4px solid " + (cat.color || T.gold),
                boxShadow: isDragOver ? "0 4px 20px rgba(201,168,76,0.2)" : T.shadow,
                transition: "all .2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ cursor: "grab", padding: "4px 2px", display: "flex", alignItems: "center" }}>
                      <Icon name="grip" size={18} color={T.textMuted} />
                    </div>
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setColorPickerCatId(colorPickerCatId === cat.id ? null : cat.id)} style={{
                        width: 16, height: 16, borderRadius: "50%", border: "2px solid " + T.white,
                        background: cat.color || T.gold, cursor: "pointer", boxShadow: "0 0 0 1px " + T.lightLine,
                      }} title="Change color" />
                      {colorPickerCatId === cat.id && (
                        <div style={{
                          position: "absolute", top: 24, left: -4, zIndex: 50, background: T.white,
                          border: "1px solid " + T.lightLine, padding: 8, display: "flex", gap: 4, flexWrap: "wrap", width: 140,
                          boxShadow: T.shadowLg,
                        }}>
                          {CAT_COLORS.map((c) => (
                            <button key={c} onClick={() => setCatColor(cat.id, c)} style={{
                              width: 24, height: 24, borderRadius: "50%", border: cat.color === c ? "2px solid " + T.charcoal : "2px solid transparent",
                              background: c, cursor: "pointer",
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600 }}>{cat.name}</h3>
                    <button onClick={() => openRenameCat(cat)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", opacity: 0.5 }} title="Rename category">
                      <Icon name="edit" size={13} color={T.textMuted} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge color={T.gold}>{cat.skills.length} skills</Badge>
                    {(cat.videos || []).length > 0 && <Badge color="#8B6AAE">{cat.videos.length} video{cat.videos.length > 1 ? "s" : ""}</Badge>}
                    <button onClick={() => openAddVideo(cat.id, null)} style={{ background: "#8B6AAE15", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: "#8B6AAE", display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="play" size={12} color="#8B6AAE" /> Add Video
                    </button>
                    <button onClick={() => openAddSk(cat.id)} style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="plus" size={12} color={T.gold} /> Add Skill
                    </button>
                    <button onClick={() => confirmDeleteCat(cat)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
                      <Icon name="trash" size={16} color={T.danger} />
                    </button>
                  </div>
                </div>

                {/* Category-level videos */}
                {(cat.videos || []).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {cat.videos.map((v) => (
                      <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: "#8B6AAE10", fontSize: "11px" }}>
                        <Icon name="play" size={12} color="#8B6AAE" />
                        <span style={{ color: "#8B6AAE", fontWeight: 500 }}>{v.title}</span>
                        <span style={{ color: T.textMuted, fontSize: "10px" }}>{v.duration}</span>
                        <button onClick={() => removeVideo(cat.id, null, v.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                          <Icon name="x" size={10} color={T.textMuted} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cat.skills.map((sk) => (
                    <div key={sk.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: T.cream, fontSize: "12px" }}>
                      <span style={{ fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: sk.type === "service" ? T.goldMuted : T.charcoalMuted, color: sk.type === "service" ? T.gold : T.textMuted }}>
                        {sk.type === "service" ? "SVC" : "KN"}
                      </span>
                      <button onClick={() => openRenameSk(cat.id, sk)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "12px", color: T.text }} title="Rename skill">
                        {sk.name}
                      </button>
                      {(sk.videos || []).length > 0 && (
                        <span style={{ fontSize: "9px", fontWeight: 600, color: "#8B6AAE", display: "flex", alignItems: "center", gap: 2 }}>
                          <Icon name="play" size={9} color="#8B6AAE" />{sk.videos.length}
                        </span>
                      )}
                      {sk.type === "service" && sk.targetMin ? (
                        <span style={{ fontSize: "10px", color: T.textMuted, fontWeight: 500 }}>
                          {sk.targetMin}–{sk.maxMin}m
                        </span>
                      ) : null}
                      {sk.sop && Object.values(sk.sop).some((v) => v) && (
                        <span style={{ fontSize: "9px", fontWeight: 600, color: T.success, display: "flex", alignItems: "center", gap: 2 }}>
                          <Icon name="file" size={8} color={T.success} />SOP
                        </span>
                      )}
                      <button onClick={() => openSop(cat.id, sk)} title="Edit curriculum" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", opacity: 0.5 }}>
                        <Icon name="file" size={10} color={T.gold} />
                      </button>
                      <button onClick={() => openAddVideo(cat.id, sk.id)} title="Add video" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", opacity: 0.5 }}>
                        <Icon name="play" size={10} color="#8B6AAE" />
                      </button>
                      <button onClick={() => { if (sk.type === "service") openEditTiming(cat.id, sk); }} style={{ background: "none", border: "none", cursor: sk.type === "service" ? "pointer" : "default", padding: 0, display: "flex", opacity: sk.type === "service" ? 1 : 0 }}>
                        <Icon name="edit" size={10} color={T.textMuted} />
                      </button>
                      <button onClick={() => confirmDeleteSk(cat.id, sk)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                        <Icon name="x" size={12} color={T.textMuted} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
      <Modal open={catModal} onClose={() => setCatModal(false)} title="New Category" width={400}>
        <FormField label="Category Name"><input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Texture & Perming" style={iSt} onKeyDown={(e) => e.key === "Enter" && addCat()} /></FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setCatModal(false)}>Cancel</Btn><Btn onClick={addCat}>Add Category</Btn></div>
      </Modal>
      <Modal open={skModal} onClose={() => setSkModal(false)} title="Add Skill" width={680}>
        <FormField label="Skill Name"><input value={newSk} onChange={(e) => setNewSk(e.target.value)} placeholder="e.g. Spiral Perm" style={iSt} /></FormField>
        <FormField label="Skill Type">
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setNewSkType("service")} style={{
              flex: 1, padding: "12px 14px", borderRadius: T.radiusSm, border: "2px solid " + (newSkType === "service" ? T.gold : T.creamDark),
              background: newSkType === "service" ? T.goldMuted : T.cream, cursor: "pointer", textAlign: "left",
            }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: newSkType === "service" ? T.gold : T.text, marginBottom: 2 }}>Service Skill</p>
              <p style={{ fontSize: "11px", color: T.textMuted }}>Technique + Timing mastery stages</p>
            </button>
            <button onClick={() => setNewSkType("knowledge")} style={{
              flex: 1, padding: "12px 14px", borderRadius: T.radiusSm, border: "2px solid " + (newSkType === "knowledge" ? T.charcoal : T.creamDark),
              background: newSkType === "knowledge" ? T.charcoalMuted : T.cream, cursor: "pointer", textAlign: "left",
            }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: newSkType === "knowledge" ? T.charcoal : T.text, marginBottom: 2 }}>Knowledge Item</p>
              <p style={{ fontSize: "11px", color: T.textMuted }}>Simple complete / not complete</p>
            </button>
          </div>
        </FormField>
        {newSkType === "service" && (
          <div style={{ padding: 16, borderRadius: T.radiusSm, background: T.cream, marginBottom: 14 }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: T.charcoal, marginBottom: 10 }}>Timing Standard</p>
            <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Target (Floor Ready)">
                <div style={{ position: "relative" }}>
                  <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} placeholder="e.g. 45" style={iSt} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted }}>min</span>
                </div>
              </FormField>
              <FormField label="Max Acceptable">
                <div style={{ position: "relative" }}>
                  <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} placeholder="e.g. 75" style={iSt} />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted }}>min</span>
                </div>
              </FormField>
            </div>
            <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 4 }}>Target = speed they should hit. Max = slowest you'll accept on the floor.</p>
          </div>
        )}
        {/* Curriculum / SOP */}
        <div style={{ padding: 16, borderRadius: T.radiusSm, background: T.cream, marginBottom: 14 }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: T.charcoal, marginBottom: 10 }}>Curriculum (optional — can add later)</p>
          <div style={{ display: "flex", gap: 2, marginBottom: 10, flexWrap: "wrap" }}>
            {SOP_SECTIONS.map((sec) => (
              <button key={sec.key} onClick={() => setNewSkSopTab(sec.key)} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: "none", cursor: "pointer",
                background: newSkSopTab === sec.key ? sec.color + "15" : "transparent",
                color: newSkSopTab === sec.key ? sec.color : T.textMuted,
                fontSize: "10px", fontWeight: 600,
              }}>
                <Icon name={sec.icon} size={10} color={newSkSopTab === sec.key ? sec.color : T.textMuted} />
                {sec.label}
                {newSkSop[sec.key] && <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.success }} />}
              </button>
            ))}
          </div>
          <RichEditor value={newSkSop[newSkSopTab]} onChange={(html) => setNewSkSop((d) => ({ ...d, [newSkSopTab]: html }))} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setSkModal(false)}>Cancel</Btn><Btn onClick={addSk}>Add Skill</Btn></div>
      </Modal>
      <Modal open={timingModal} onClose={() => setTimingModal(false)} title={"Timing Standard — " + (timingSkill?.name || "")} width={420}>
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 16 }}>Set the time benchmarks for this service skill.</p>
        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Target (Floor Ready)">
            <div style={{ position: "relative" }}>
              <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} placeholder="e.g. 45" style={iSt} />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted }}>min</span>
            </div>
          </FormField>
          <FormField label="Max Acceptable">
            <div style={{ position: "relative" }}>
              <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} placeholder="e.g. 75" style={iSt} />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted }}>min</span>
            </div>
          </FormField>
        </div>
        <div style={{ padding: 12, borderRadius: T.radiusSm, background: T.cream, marginTop: 12 }}>
          <p style={{ fontSize: "11px", color: T.textMuted }}>
            <b>Target</b> = "Floor Ready" speed — the time a competent stylist should complete this in.
            <br /><b>Max</b> = Slowest acceptable — beyond this, the trainee needs more practice before taking clients.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setTimingModal(false)}>Cancel</Btn><Btn onClick={saveTiming}>Save Standard</Btn></div>
      </Modal>
      <Modal open={sopModal} onClose={() => setSopModal(false)} title="Edit Curriculum" width={680}>
        {/* SOP section tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 16, flexWrap: "wrap" }}>
          {SOP_SECTIONS.map((sec) => (
            <button key={sec.key} onClick={() => setSopTab(sec.key)} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", border: "none", cursor: "pointer",
              background: sopTab === sec.key ? sec.color + "15" : T.cream,
              color: sopTab === sec.key ? sec.color : T.textMuted,
              fontSize: "11px", fontWeight: 600, transition: "all .15s",
            }}>
              <Icon name={sec.icon} size={12} color={sopTab === sec.key ? sec.color : T.textMuted} />
              {sec.label}
              {sopData[sec.key] && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.success }} />}
            </button>
          ))}
        </div>
        {/* Active section editor */}
        {SOP_SECTIONS.filter((s) => s.key === sopTab).map((sec) => (
          <div key={sec.key}>
            <p style={{ fontSize: "11px", color: T.textMuted, marginBottom: 8 }}>
              {sec.key === "steps" && "Ordered steps for performing this service. Use numbered list for best results."}
              {sec.key === "mistakes" && "Common mistakes trainees make. Use bullet list."}
              {sec.key === "consultation" && "What to assess or ask the client before starting."}
              {sec.key === "tips" && "Your personal technique notes and insider knowledge."}
              {sec.key === "tools" && "Tools and products needed for this service."}
            </p>
            <RichEditor value={sopData[sec.key]} onChange={(html) => setSopData((d) => ({ ...d, [sec.key]: html }))} />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setSopModal(false)}>Cancel</Btn>
          <Btn onClick={saveSop}>Save Curriculum</Btn>
        </div>
      </Modal>
      <Modal open={videoModal} onClose={() => setVideoModal(false)} title="Add Video" width={480}>
        {/* Upload area — primary action */}
        {videoMode === "upload" && !videoFile && (
          <label style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "32px 20px", border: "2px dashed " + T.lightLine, cursor: "pointer",
            textAlign: "center", marginBottom: 16, transition: "all .2s",
          }}>
            <input type="file" accept="video/*" onChange={handleVideoFile} style={{ display: "none" }} />
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#8B6AAE15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="play" size={24} color="#8B6AAE" />
            </div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: T.charcoal, marginBottom: 4 }}>Choose from Camera Roll</p>
            <p style={{ fontSize: "12px", color: T.textMuted }}>Tap to select a video from your device</p>
            <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 8 }}>MP4, MOV, or WebM</p>
          </label>
        )}

        {/* Upload progress / preview */}
        {videoMode === "upload" && videoFile && (
          <div style={{ padding: 16, background: "#8B6AAE08", border: "1px solid #8B6AAE20", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#8B6AAE15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="play" size={16} color="#8B6AAE" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{videoFile.name}</p>
                <p style={{ fontSize: "10px", color: T.textMuted }}>
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                  {videoDuration ? " · " + videoDuration : ""}
                </p>
              </div>
              {videoUploading ? (
                <span style={{ fontSize: "10px", color: "#8B6AAE", fontWeight: 600 }}>Processing...</span>
              ) : (
                <span style={{ fontSize: "10px", color: T.success, fontWeight: 600 }}>Ready</span>
              )}
            </div>
            <button onClick={() => { setVideoFile(null); setVideoUrl(""); setVideoDuration(""); }} style={{
              background: "none", border: "none", cursor: "pointer", fontSize: "10px", color: T.textMuted, marginTop: 8, padding: 0,
            }}>Choose a different file</button>
          </div>
        )}

        {/* Link mode */}
        {videoMode === "link" && (
          <FormField label="Video URL">
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." style={iSt} />
          </FormField>
        )}

        {/* Title — auto-filled from filename but editable */}
        <FormField label="Title">
          <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="e.g. Layered Cut Breakdown" style={iSt} />
        </FormField>

        {/* Duration — auto-detected for uploads, manual for links */}
        {videoMode === "link" && (
          <FormField label="Duration">
            <input value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} placeholder="e.g. 18:45" style={iSt} />
          </FormField>
        )}

        {/* Mode toggle */}
        <button onClick={() => setVideoMode(videoMode === "upload" ? "link" : "upload")} style={{
          background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: T.textMuted, padding: "8px 0", textDecoration: "underline",
        }}>
          {videoMode === "upload" ? "Or paste a YouTube / Vimeo link instead" : "Or upload from your device instead"}
        </button>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          <Btn variant="outline" onClick={() => setVideoModal(false)}>Cancel</Btn>
          <Btn onClick={saveVideo} disabled={videoUploading}>
            {videoUploading ? "Processing..." : "Add Video"}
          </Btn>
        </div>
      </Modal>
      <Modal open={renameModal} onClose={() => setRenameModal(false)} title={renameType === "cat" ? "Rename Category" : "Rename Skill"} width={400}>
        <FormField label={renameType === "cat" ? "Category Name" : "Skill Name"}>
          <input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Enter new name"
            style={iSt}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            autoFocus
          />
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setRenameModal(false)}>Cancel</Btn>
          <Btn onClick={saveRename}>Save</Btn>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" width={440}>
        {deleteTarget && (
          <>
            <div style={{ padding: 16, background: T.dangerBg, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Icon name="alert" size={20} color={T.danger} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: T.danger, marginBottom: 4 }}>
                  Delete "{deleteTarget.name}"?
                </p>
                <p style={{ fontSize: "12px", color: T.textMuted }}>
                  {deleteTarget.details}
                </p>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.6, marginBottom: 8 }}>
              This {deleteTarget.type === "cat" ? "category and all its skills" : "skill"} will be moved to the <b>archive</b>. You can restore it later from the Archive panel.
            </p>
            <p style={{ fontSize: "11px", color: T.textMuted }}>
              Any trainees with {deleteTarget.type === "cat" ? "these skills" : "this skill"} assigned will keep their progress data, but the {deleteTarget.type === "cat" ? "skills" : "skill"} won't appear in their track.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <Btn variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Btn>
              <Btn variant="danger" onClick={executeDelete}>
                <Icon name="trash" size={14} color={T.danger} /> Archive & Remove
              </Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
// ════════════════════════════════════════════
//  ADMIN: PRESETS
// ════════════════════════════════════════════
const AdminPresets = () => {
  const { presets, setPresets, masterProgram, showToast } = useData();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [selIds, setSelIds] = useState(new Set());
  const [editId, setEditId] = useState(null);

  const openNew = () => { setName(""); setSelIds(new Set()); setEditId(null); setModal(true); };
  const openEdit = (pr) => { setName(pr.name); setSelIds(new Set(pr.skillIds)); setEditId(pr.id); setModal(true); };
  const toggleSk = (sid) => setSelIds((p) => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });
  const toggleCat = (cat) => {
    const ids = cat.skills.map((s) => s.id);
    const allIn = ids.every((id) => selIds.has(id));
    setSelIds((p) => { const n = new Set(p); ids.forEach((id) => (allIn ? n.delete(id) : n.add(id))); return n; });
  };
  const save = () => {
    if (!name.trim()) return;
    const sids = [...selIds];
    if (editId) { setPresets((p) => p.map((pr) => (pr.id === editId ? { ...pr, name: name.trim(), skillIds: sids } : pr))); showToast("Preset updated"); }
    else { setPresets((p) => [...p, { id: `p_${uid()}`, name: name.trim(), skillIds: sids }]); showToast("Preset created"); }
    setModal(false);
  };
  const rem = (id) => { setPresets((p) => p.filter((pr) => pr.id !== id)); showToast("Preset removed"); };

  return (
    <div className="fade-up">
      <SectionTitle sub="Save common skill combinations for quick assignment" action={<Btn onClick={openNew}><Icon name="plus" size={16} color={T.cream} /> New Preset</Btn>}>
        Presets
      </SectionTitle>
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {presets.map((pr) => (
          <Card key={pr.id} style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontFamily: T.fontD, fontSize: "19px", fontWeight: 600 }}>{pr.name}</h3>
                <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 2 }}>{pr.skillIds.length} skills</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(pr)} style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: T.gold }}>
                  <Icon name="edit" size={12} color={T.gold} /> Edit
                </button>
                <button onClick={() => rem(pr.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Icon name="trash" size={16} color={T.danger} /></button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {masterProgram.map((cat) => {
                const count = cat.skills.filter((s) => pr.skillIds.includes(s.id)).length;
                if (!count) return null;
                return <Badge key={cat.id} color={T.textMuted}>{cat.name} ({count})</Badge>;
              })}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Preset" : "New Preset"} width={560}>
        <FormField label="Preset Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Color Specialist" style={iSt} /></FormField>
        <FormField label={`Select Skills (${selIds.size} selected)`}>
          <div style={{ maxHeight: 360, overflowY: "auto", border: `1.5px solid ${T.creamDark}`, borderRadius: T.radiusSm, padding: 12 }}>
            {masterProgram.map((cat) => {
              const allIn = cat.skills.every((s) => selIds.has(s.id));
              const someIn = cat.skills.some((s) => selIds.has(s.id));
              return (
                <div key={cat.id} style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => toggleCat(cat)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: T.radiusSm, border: "none", background: allIn ? T.goldMuted : T.cream, cursor: "pointer", width: "100%", textAlign: "left", marginBottom: 6 }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${allIn ? T.gold : someIn ? T.goldLight : T.creamDark}`, background: allIn ? T.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {allIn && <span style={{ color: T.white, fontSize: "10px", fontWeight: 700 }}>✓</span>}
                      {someIn && !allIn && <span style={{ color: T.goldLight, fontSize: "10px", fontWeight: 700 }}>–</span>}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ fontSize: "11px", color: T.textMuted, marginLeft: "auto" }}>{cat.skills.filter((s) => selIds.has(s.id)).length}/{cat.skills.length}</span>
                  </button>
                  <div style={{ paddingLeft: 28, display: "flex", flexDirection: "column", gap: 4 }}>
                    {cat.skills.map((sk) => {
                      const on = selIds.has(sk.id);
                      return (
                        <button key={sk.id} onClick={() => toggleSk(sk.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: T.radiusSm, border: "none", background: on ? T.successBg : "transparent", cursor: "pointer", textAlign: "left", width: "100%" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${on ? T.success : T.creamDark}`, background: on ? T.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {on && <span style={{ color: T.white, fontSize: "9px", fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: "12px", color: on ? T.success : T.text }}>{sk.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={save}>{editId ? "Save Changes" : "Create Preset"}</Btn></div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: TRAINEES LIST
// ════════════════════════════════════════════
const AdminTrainees = ({ onNav }) => {
  const { residents, setResidents, masterProgram, showToast } = useData();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", cohort: "Spring 2026" });

  const openNew = () => { setForm({ name: "", email: "", cohort: "Spring 2026" }); setModal(true); };
  const save = () => {
    if (!form.name.trim()) return;
    setResidents((p) => [...p, { id: `r_${uid()}`, name: form.name, email: form.email, cohort: form.cohort, skillIds: [], progress: {} }]);
    showToast("Trainee added");
    setModal(false);
  };
  const rem = (id) => { setResidents((p) => p.filter((r) => r.id !== id)); showToast("Trainee removed"); };

  return (
    <div className="fade-up">
      <SectionTitle sub="Add trainees, then build their custom track" action={<Btn onClick={openNew}><Icon name="plus" size={16} color={T.cream} /> Add Trainee</Btn>}>
        Trainee Manager
      </SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {residents.map((r) => {
          const { pct, done, total } = getProgress(r, masterProgram);
          return (
            <Card key={r.id} style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar name={r.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 500 }}>{r.name}</p>
                <p style={{ fontSize: "12px", color: T.textMuted }}>{r.email} · {r.cohort}</p>
                <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>{total} skills assigned · {done} done</p>
              </div>
              <div style={{ width: 80 }}><ProgressBar value={pct} /></div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: T.gold, minWidth: 36, textAlign: "right" }}>{pct}%</span>
              <button onClick={() => onNav(`a-trainees:${r.id}`)} style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="eye" size={12} color={T.gold} /> View
              </button>
              <button onClick={() => rem(r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Icon name="trash" size={16} color={T.danger} /></button>
            </Card>
          );
        })}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Add Trainee">
        <FormField label="Full Name"><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Kayla Thompson" style={iSt} /></FormField>
        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Email"><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="kayla@flowecollective.com" style={iSt} /></FormField>
          <FormField label="Cohort"><input value={form.cohort} onChange={(e) => setForm((f) => ({ ...f, cohort: e.target.value }))} placeholder="Spring 2026" style={iSt} /></FormField>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={save}>Add Trainee</Btn></div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: TRAINEE PROFILE (overview + track builder tabs)
// ════════════════════════════════════════════
const TraineeProfile = ({ traineeId, onNav }) => {
  const { residents, setResidents, masterProgram, schedule, setSchedule, showToast } = useData();
  const [tab, setTab] = useState("overview");
  const [schedModal, setSchedModal] = useState(false);
  const [schedForm, setSchedForm] = useState({ skillId: "", title: "", date: "2026-03-05", time: "9:00 AM", type: "skill" });

  // Progress editing state
  const [editLogModal, setEditLogModal] = useState(false);
  const [editLogSkillId, setEditLogSkillId] = useState(null);
  const [editLogIdx, setEditLogIdx] = useState(null);
  const [editLogMinutes, setEditLogMinutes] = useState("");
  const [editLogType, setEditLogType] = useState("mannequin");
  const [editLogNote, setEditLogNote] = useState("");
  const [editLogCritique, setEditLogCritique] = useState("");

  const r = residents.find((x) => x.id === traineeId);

  if (!r) {
    return (
      <div>
        <Btn variant="outline" onClick={() => onNav("a-trainees")}><Icon name="back" size={16} /> Back</Btn>
        <p style={{ marginTop: 16, color: T.textMuted }}>Trainee not found.</p>
      </div>
    );
  }

  const { total, done, pct } = getProgress(r, masterProgram);
  const cats = getTraineeCats(r, masterProgram);
  const tuition = r.tuition || { plan: "monthly", total: 4950, payments: [] };
  const tuitionPaid = tuition.payments.reduce((a, p) => a + p.amount, 0);
  const tuitionRemaining = Math.max(0, tuition.total - tuitionPaid);

  const allLogs = Object.entries(r.timingLogs || {});
  const totalLogEntries = allLogs.reduce((a, [, logs]) => a + logs.length, 0);
  const modelEntries = allLogs.reduce((a, [, logs]) => a + logs.filter((l) => l.type === "model").length, 0);

  const serviceSkills = cats.flatMap((c) => c.skills.filter((s) => s.type === "service"));
  const knowledgeSkills = cats.flatMap((c) => c.skills.filter((s) => s.type === "knowledge"));
  const completedServices = serviceSkills.filter((s) => isSkillComplete(r, s.id, masterProgram)).length;
  const completedKnowledge = knowledgeSkills.filter((s) => isSkillComplete(r, s.id, masterProgram)).length;

  // This trainee's scheduled events
  const myEvents = schedule.filter((e) => e.assignTo === "all" || e.assignTo === traineeId).sort((a, b) => a.date.localeCompare(b.date));
  const upcomingEvents = myEvents.filter((e) => e.date >= "2026-03-05").slice(0, 8);

  const openQuickSchedule = (skill) => {
    setSchedForm({ skillId: skill.id, title: skill.name, date: "2026-03-05", time: "9:00 AM", type: "skill" });
    setSchedModal(true);
  };
  const openScheduleGeneral = (type) => {
    const titles = { mannequin: "Mannequin Practice", model: "Live Model Session", general: "" };
    setSchedForm({ skillId: "", title: titles[type] || "", date: "2026-03-05", time: "9:00 AM", type });
    setSchedModal(true);
  };
  const saveSchedule = () => {
    if (!schedForm.title.trim()) return;
    setSchedule((p) => [...p, {
      id: Date.now(),
      title: schedForm.title,
      date: schedForm.date,
      time: schedForm.time,
      type: schedForm.type,
      assignTo: traineeId,
      skillId: schedForm.type === "skill" ? schedForm.skillId : null,
    }]);
    showToast("Scheduled for " + r.name.split(" ")[0]);
    setSchedModal(false);
  };

  // Progress management
  const setStage = (sid, dimension, value) => {
    setResidents((p) => p.map((x) => {
      if (x.id !== traineeId) return x;
      const current = x.progress?.[sid] || { technique: 0, timing: 0 };
      return { ...x, progress: { ...x.progress, [sid]: { ...current, [dimension]: value } } };
    }));
    showToast(dimension === "technique" ? TECHNIQUE_STAGES[value] : TIMING_STAGES[value]);
  };
  const toggleKnowledge = (sid) => {
    setResidents((p) => p.map((x) => {
      if (x.id !== traineeId) return x;
      const current = x.progress?.[sid];
      const isDone = current && (current === true || current.done === true);
      return { ...x, progress: { ...x.progress, [sid]: { done: !isDone } } };
    }));
    showToast("Updated");
  };
  const openEditLog = (skillId, logIdx, log) => {
    setEditLogSkillId(skillId); setEditLogIdx(logIdx);
    setEditLogMinutes(String(log.minutes)); setEditLogType(log.type); setEditLogNote(log.note || ""); setEditLogCritique(log.critique || "");
    setEditLogModal(true);
  };
  const saveEditLog = () => {
    if (!editLogMinutes || editLogSkillId === null || editLogIdx === null) return;
    const mins = parseInt(editLogMinutes);
    if (isNaN(mins) || mins <= 0) return;
    setResidents((p) => p.map((x) => {
      if (x.id !== traineeId) return x;
      const logs = { ...(x.timingLogs || {}) };
      const existing = [...(logs[editLogSkillId] || [])];
      if (existing[editLogIdx]) existing[editLogIdx] = { ...existing[editLogIdx], minutes: mins, type: editLogType, note: editLogNote.trim(), critique: editLogCritique.trim() };
      logs[editLogSkillId] = existing;
      return { ...x, timingLogs: logs };
    }));
    showToast("Entry updated");
    setEditLogModal(false);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "builder", label: "Edit Track" },
  ];

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => onNav("a-trainees")} style={{ background: T.goldMuted, border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon name="back" size={18} color={T.gold} />
        </button>
        <Avatar name={r.name} size={48} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: T.fontD, fontSize: "28px", fontWeight: 600 }}>{r.name}</h2>
          <p style={{ color: T.textMuted, fontSize: "13px" }}>{r.email} · {r.cohort}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: T.fontD, fontSize: "32px", fontWeight: 600, color: T.gold, lineHeight: 1 }}>{pct}%</p>
          <p style={{ fontSize: "11px", color: T.textMuted }}>{done}/{total} complete</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: T.white, borderRadius: T.radiusSm, padding: 4, border: "1px solid " + T.charcoalMuted, width: "fit-content" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 20px", borderRadius: T.radiusSm, border: "none",
            background: tab === t.id ? T.charcoal : "transparent",
            color: tab === t.id ? T.cream : T.textMuted,
            fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all .2s",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="fade-up">
          {/* Stat Cards */}
          <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>Overall</p>
              <p style={{ fontFamily: T.fontD, fontSize: "28px", fontWeight: 600, color: T.gold, lineHeight: 1 }}>{pct}%</p>
              <div style={{ marginTop: 8 }}><ProgressBar value={pct} height={6} /></div>
            </Card>
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>Services</p>
              <p style={{ fontFamily: T.fontD, fontSize: "28px", fontWeight: 600, color: T.success, lineHeight: 1 }}>{completedServices}/{serviceSkills.length}</p>
              <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 4 }}>mastered</p>
            </Card>
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>Knowledge</p>
              <p style={{ fontFamily: T.fontD, fontSize: "28px", fontWeight: 600, color: completedKnowledge === knowledgeSkills.length ? T.success : T.warn, lineHeight: 1 }}>{completedKnowledge}/{knowledgeSkills.length}</p>
              <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 4 }}>complete</p>
            </Card>
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>Time Logs</p>
              <p style={{ fontFamily: T.fontD, fontSize: "28px", fontWeight: 600, color: T.charcoal, lineHeight: 1 }}>{totalLogEntries}</p>
              <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 4 }}>{modelEntries} on models</p>
            </Card>
          </div>

          {/* Tuition Summary */}
          <Card style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>Tuition</h4>
              <Badge color={tuitionRemaining <= 0 ? T.success : T.warn}>{tuitionRemaining <= 0 ? "Paid in Full" : "Balance Due"}</Badge>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}><ProgressBar value={tuition.total ? Math.round((tuitionPaid / tuition.total) * 100) : 0} height={8} color={tuitionRemaining <= 0 ? T.success : T.gold} /></div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: T.textMuted }}>${tuitionPaid.toLocaleString()} / ${tuition.total.toLocaleString()}</span>
            </div>
          </Card>

          {/* Quick schedule buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Btn variant="gold" onClick={() => openScheduleGeneral("mannequin")} style={{ fontSize: "11px", padding: "8px 14px" }}>
              <Icon name="plus" size={12} color={T.gold} /> Mannequin Day
            </Btn>
            <Btn variant="gold" onClick={() => openScheduleGeneral("model")} style={{ fontSize: "11px", padding: "8px 14px" }}>
              <Icon name="plus" size={12} color={T.gold} /> Model Day
            </Btn>
            <Btn variant="gold" onClick={() => openScheduleGeneral("general")} style={{ fontSize: "11px", padding: "8px 14px" }}>
              <Icon name="plus" size={12} color={T.gold} /> General Event
            </Btn>
          </div>

          {/* Skill Progress — full interactive controls */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: T.white, fontSize: "11px", color: T.textMuted }}>
              <span style={{ fontWeight: 600 }}>Technique:</span> Not Started → Theory → Mannequin → Competent
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: T.white, fontSize: "11px", color: T.textMuted }}>
              <span style={{ fontWeight: 600 }}>Timing:</span> Not Started → Slow → On Pace → Floor Ready
            </div>
          </div>

          {cats.length === 0 ? (
            <Card style={{ padding: 48, textAlign: "center" }}>
              <p style={{ color: T.textMuted }}>No skills assigned yet. Switch to "Edit Track" to build their program.</p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {cats.map((cat) => {
                const catDone = cat.skills.filter((s) => isSkillComplete(r, s.id, masterProgram)).length;
                const catPct = Math.round(cat.skills.reduce((a, s) => a + getSkillPct(r, s.id, masterProgram), 0) / (cat.skills.length || 1));
                return (
                  <Card key={cat.id} style={{ padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600 }}>{cat.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Badge color={catDone === cat.skills.length ? T.success : T.gold}>{catDone}/{cat.skills.length}</Badge>
                        <span style={{ fontSize: "11px", color: T.textMuted }}>{catPct}%</span>
                      </div>
                    </div>
                    <ProgressBar value={catPct} height={6} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                      {cat.skills.map((sk) => {
                        const p = getSkillProgress(r, sk.id);
                        const isService = sk.type === "service";
                        const complete = isSkillComplete(r, sk.id, masterProgram);
                        const skLogs = (r.timingLogs || {})[sk.id] || [];
                        const mdlLogs = skLogs.filter((l) => l.type === "model");
                        const manLogs = skLogs.filter((l) => l.type === "mannequin");
                        const mdlAvg = mdlLogs.length ? Math.round(mdlLogs.reduce((a, l) => a + l.minutes, 0) / mdlLogs.length) : null;
                        const manAvg = manLogs.length ? Math.round(manLogs.reduce((a, l) => a + l.minutes, 0) / manLogs.length) : null;
                        return (
                          <div key={sk.id} style={{
                            padding: "12px 14px", borderRadius: T.radiusSm,
                            background: complete ? T.successBg : T.cream,
                            border: complete ? "1px solid " + T.success + "30" : "none",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isService ? 10 : 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: isService ? T.goldMuted : T.charcoalMuted, color: isService ? T.gold : T.textMuted }}>
                                  {isService ? "SVC" : "KN"}
                                </span>
                                <span style={{ fontSize: "13px", fontWeight: 500, color: complete ? T.success : T.text }}>{sk.name}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {isService && !complete && (
                                  <button onClick={() => openQuickSchedule(sk)} title="Schedule" style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                                    <Icon name="calendar" size={13} color={T.gold} />
                                  </button>
                                )}
                                {!isService && (
                                  <button onClick={() => toggleKnowledge(sk.id)} style={{
                                    padding: "4px 10px", borderRadius: 4, border: "none", fontSize: "10px", fontWeight: 600, cursor: "pointer",
                                    background: p.done ? T.success : T.creamDark, color: p.done ? T.white : T.textMuted,
                                  }}>
                                    {p.done ? "Complete ✓" : "Mark Complete"}
                                  </button>
                                )}
                              </div>
                            </div>
                            {isService && (
                              <>
                                <div style={{ marginBottom: 6 }}>
                                  <p style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Technique</p>
                                  <div style={{ display: "flex", gap: 3 }}>
                                    {TECHNIQUE_STAGES.map((stage, si) => (
                                      <button key={si} onClick={() => setStage(sk.id, "technique", si)} style={{
                                        flex: 1, padding: "6px 2px", borderRadius: 4, border: "none",
                                        background: si <= p.technique - 1 ? TECHNIQUE_COLORS[si] : (si === p.technique ? T.creamDark : "transparent"),
                                        color: si <= p.technique - 1 ? T.white : (si === p.technique ? T.charcoal : T.textMuted),
                                        fontSize: "10px", fontWeight: 600, cursor: "pointer",
                                        outline: si === p.technique ? "2px solid " + (TECHNIQUE_COLORS[si] || T.creamDark) : "none",
                                        outlineOffset: 1,
                                      }}>{stage.split(" ").slice(-1)[0]}</button>
                                    ))}
                                  </div>
                                </div>
                                <div style={{ marginBottom: 6 }}>
                                  <p style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Timing</p>
                                  <div style={{ display: "flex", gap: 3 }}>
                                    {TIMING_STAGES.map((stage, si) => (
                                      <button key={si} onClick={() => setStage(sk.id, "timing", si)} style={{
                                        flex: 1, padding: "6px 2px", borderRadius: 4, border: "none",
                                        background: si <= p.timing - 1 ? TIMING_COLORS[si] : (si === p.timing ? T.creamDark : "transparent"),
                                        color: si <= p.timing - 1 ? T.white : (si === p.timing ? T.charcoal : T.textMuted),
                                        fontSize: "10px", fontWeight: 600, cursor: "pointer",
                                        outline: si === p.timing ? "2px solid " + (TIMING_COLORS[si] || T.creamDark) : "none",
                                        outlineOffset: 1,
                                      }}>{stage.split(" ").slice(-1)[0]}</button>
                                    ))}
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                  {sk.targetMin && <span style={{ fontSize: "10px", color: T.textMuted }}>Goal: <b style={{ color: T.gold }}>{sk.targetMin}m</b> target · <b>{sk.maxMin}m</b> max</span>}
                                  {manAvg && <span style={{ fontSize: "10px", color: T.textMuted }}>Mann: <b>{manAvg}m</b></span>}
                                  {mdlAvg && <span style={{ fontSize: "10px", color: sk.targetMin && mdlAvg <= sk.targetMin ? T.success : sk.targetMin && mdlAvg <= sk.maxMin ? T.warn : T.textMuted }}>Model: <b>{mdlAvg}m</b></span>}
                                  {skLogs.length > 0 && <span style={{ fontSize: "10px", color: T.textMuted }}>({skLogs.length} logs)</span>}
                                </div>
                                {skLogs.length > 0 && (
                                  <details style={{ marginTop: 8 }}>
                                    <summary style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, cursor: "pointer", textTransform: "uppercase" }}>View Timing Logs</summary>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6, maxHeight: 120, overflowY: "auto" }}>
                                      {skLogs.map((log, li) => (
                                        <div key={li} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "10px", padding: "4px 6px", borderRadius: 3, background: T.white }}>
                                          <span style={{ fontSize: "7px", fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: log.type === "model" ? "#8B6AAE20" : T.goldMuted, color: log.type === "model" ? "#8B6AAE" : T.gold }}>
                                            {log.type === "model" ? "MDL" : "MAN"}
                                          </span>
                                          <span style={{ fontWeight: 600 }}>{log.minutes}m</span>
                                          <span style={{ color: T.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.note || ""}</span>
                                          <span style={{ color: T.textMuted, fontSize: "9px" }}>{log.date}</span>
                                          <button onClick={() => openEditLog(sk.id, li, log)} style={{ background: "none", border: "none", cursor: "pointer", padding: 1 }}>
                                            <Icon name="edit" size={9} color={T.textMuted} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Edit Practice Entry */}
          <Modal open={editLogModal} onClose={() => setEditLogModal(false)} title="Edit Practice Entry" width={440}>
            <FormField label="Time (minutes)">
              <div style={{ position: "relative" }}>
                <input type="number" value={editLogMinutes} onChange={(e) => setEditLogMinutes(e.target.value)} style={iSt} />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted }}>min</span>
              </div>
            </FormField>
            <FormField label="Practice Type">
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditLogType("mannequin")} style={{ flex: 1, padding: "10px", borderRadius: T.radiusSm, border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: editLogType === "mannequin" ? T.goldMuted : T.cream, color: editLogType === "mannequin" ? T.gold : T.textMuted }}>Mannequin</button>
                <button onClick={() => setEditLogType("model")} style={{ flex: 1, padding: "10px", borderRadius: T.radiusSm, border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", background: editLogType === "model" ? "#8B6AAE15" : T.cream, color: editLogType === "model" ? "#8B6AAE" : T.textMuted }}>Live Model</button>
              </div>
            </FormField>
            <FormField label="Trainee's Notes">
              <input value={editLogNote} onChange={(e) => setEditLogNote(e.target.value)} placeholder="Trainee's note" style={{ ...iSt, background: T.cream }} disabled />
            </FormField>
            <FormField label="Educator Notes & Critique">
              <textarea value={editLogCritique} onChange={(e) => setEditLogCritique(e.target.value)} placeholder="Add feedback, corrections, or observations..." rows={3} style={{ ...iSt, resize: "vertical", minHeight: 72, borderLeft: "3px solid " + T.educator }} />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setEditLogModal(false)}>Cancel</Btn><Btn onClick={saveEditLog}>Save</Btn></div>
          </Modal>
        </div>
      )}

      {tab === "schedule" && (
        <div className="fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600 }}>{r.name.split(" ")[0]}'s Schedule</h4>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn variant="gold" onClick={() => openScheduleGeneral("skill")} style={{ fontSize: "11px", padding: "8px 12px" }}><Icon name="plus" size={12} color={T.gold} /> Skill Session</Btn>
              <Btn variant="gold" onClick={() => openScheduleGeneral("mannequin")} style={{ fontSize: "11px", padding: "8px 12px" }}><Icon name="plus" size={12} color={T.gold} /> Mannequin</Btn>
              <Btn variant="gold" onClick={() => openScheduleGeneral("model")} style={{ fontSize: "11px", padding: "8px 12px" }}><Icon name="plus" size={12} color={T.gold} /> Model</Btn>
            </div>
          </div>
          {upcomingEvents.length === 0 ? (
            <Card style={{ padding: 48, textAlign: "center" }}><p style={{ color: T.textMuted }}>No events scheduled for {r.name.split(" ")[0]}.</p></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcomingEvents.map((ev) => (
                <Card key={ev.id} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 4, height: 36, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                      {ev.skillId && <span style={{ fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: T.goldMuted, color: T.gold }}>SKILL</span>}
                      {ev.assignTo === "all" && <span style={{ fontSize: "8px", fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: T.charcoalMuted, color: T.textMuted }}>COHORT</span>}
                    </div>
                    <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>{ev.date} · {ev.time}</p>
                  </div>
                  <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "builder" && (
        <TrackBuilder traineeId={traineeId} onNav={onNav} embedded />
      )}

      {/* Quick Schedule Modal */}
      {schedModal && r && (() => {
        const sy = window.scrollY || window.pageYOffset || 0;
        return (
        <div style={{ position: "absolute", top: sy, left: 0, width: "100%", height: "100vh", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(43,43,43,0.4)" }} onClick={() => setSchedModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.white, borderRadius: T.radius, width: 460, maxWidth: "92vw", maxHeight: "80vh", overflow: "auto", boxShadow: T.shadowLg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid " + T.charcoalMuted }}>
              <h3 style={{ fontFamily: T.fontD, fontSize: "20px", fontWeight: 600 }}>Schedule for {r.name.split(" ")[0]}</h3>
              <button onClick={() => setSchedModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={20} color={T.textMuted} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <FormField label="Type">
                <div style={{ display: "flex", gap: 6 }}>
                  {["skill", "mannequin", "model", "general"].map((et) => (
                    <button key={et} onClick={() => setSchedForm((f) => ({ ...f, type: et }))} style={{
                      flex: 1, padding: "8px", borderRadius: T.radiusSm, border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      background: schedForm.type === et ? T.goldMuted : T.cream,
                      color: schedForm.type === et ? T.gold : T.textMuted,
                    }}>{et[0].toUpperCase() + et.slice(1)}</button>
                  ))}
                </div>
              </FormField>
              {schedForm.type === "skill" && (
                <FormField label="Link to Skill">
                  <select value={schedForm.skillId || ""} onChange={(e) => {
                    const allSk = masterProgram.flatMap((c) => c.skills);
                    const sk = allSk.find((s) => s.id === e.target.value);
                    setSchedForm((f) => ({ ...f, skillId: e.target.value, title: sk ? sk.name : f.title }));
                  }} style={iSt}>
                    <option value="">Select a skill...</option>
                    {masterProgram.flatMap((c) =>
                      c.skills.filter((s) => (r.skillIds || []).includes(s.id)).map((sk) => (
                        <option key={sk.id} value={sk.id}>{sk.name}</option>
                      ))
                    )}
                  </select>
                </FormField>
              )}
              <FormField label="Event Title">
                <input value={schedForm.title} onChange={(e) => setSchedForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event name" style={iSt} />
              </FormField>
              <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Date"><input type="date" value={schedForm.date} onChange={(e) => setSchedForm((f) => ({ ...f, date: e.target.value }))} style={iSt} /></FormField>
                <FormField label="Time"><input value={schedForm.time} onChange={(e) => setSchedForm((f) => ({ ...f, time: e.target.value }))} placeholder="10:00 AM" style={iSt} /></FormField>
              </div>
              <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 8 }}>Assigned to {r.name.split(" ")[0]} only.</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <Btn variant="outline" onClick={() => setSchedModal(false)}>Cancel</Btn>
                <Btn onClick={saveSchedule}>Schedule</Btn>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: TRACK BUILDER (drag + checkbox)
// ════════════════════════════════════════════
const TrackBuilder = ({ traineeId, onNav, embedded = false }) => {
  const { residents, setResidents, masterProgram, presets, showToast } = useData();
  const r = residents.find((x) => x.id === traineeId);
  const [dragSkill, setDragSkill] = useState(null);
  const [dropTarget, setDropTarget] = useState(false);
  const [mode, setMode] = useState("check");
  const [presetModal, setPresetModal] = useState(false);

  if (!r) {
    return (
      <div>
        <Btn variant="outline" onClick={() => onNav("a-trainees")}><Icon name="back" size={16} /> Back</Btn>
        <p style={{ marginTop: 16, color: T.textMuted }}>Trainee not found.</p>
      </div>
    );
  }

  const assigned = new Set(r.skillIds || []);
  const { total, done, pct } = getProgress(r, masterProgram);
  const assignedCats = getTraineeCats(r, masterProgram);

  const toggleSkill = (sid) => {
    setResidents((p) =>
      p.map((x) => {
        if (x.id !== traineeId) return x;
        const sids = new Set(x.skillIds || []);
        sids.has(sid) ? sids.delete(sid) : sids.add(sid);
        return { ...x, skillIds: [...sids] };
      })
    );
  };

  const applyPreset = (pr) => {
    setResidents((p) =>
      p.map((x) => {
        if (x.id !== traineeId) return x;
        const sids = new Set([...(x.skillIds || []), ...pr.skillIds]);
        return { ...x, skillIds: [...sids] };
      })
    );
    showToast(`Applied "${pr.name}"`);
    setPresetModal(false);
  };

  const clearAll = () => {
    setResidents((p) => p.map((x) => (x.id === traineeId ? { ...x, skillIds: [], progress: {} } : x)));
    showToast("Track cleared");
  };

  const onDragStart = (e, sid) => { setDragSkill(sid); e.dataTransfer.effectAllowed = "copy"; };
  const onDragOver = (e) => { e.preventDefault(); setDropTarget(true); };
  const onDragLeave = () => setDropTarget(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDropTarget(false);
    if (dragSkill && !assigned.has(dragSkill)) { toggleSkill(dragSkill); showToast("Skill added"); }
    setDragSkill(null);
  };

  return (
    <div className={embedded ? "" : "fade-up"}>
      {!embedded && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => onNav("a-trainees")} style={{ background: T.goldMuted, border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="back" size={18} color={T.gold} />
          </button>
          <Avatar name={r.name} size={44} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: T.fontD, fontSize: "26px", fontWeight: 600 }}>Build Track — {r.name}</h2>
            <p style={{ color: T.textMuted, fontSize: "13px" }}>{total} skills assigned · {pct}% complete</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", background: T.white, borderRadius: T.radiusSm, border: `1.5px solid ${T.creamDark}`, overflow: "hidden" }}>
          <button onClick={() => setMode("drag")} style={{ padding: "8px 16px", border: "none", background: mode === "drag" ? T.charcoal : "transparent", color: mode === "drag" ? T.cream : T.textMuted, fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="grip" size={14} color={mode === "drag" ? T.cream : T.textMuted} /> Drag & Drop
          </button>
          <button onClick={() => setMode("check")} style={{ padding: "8px 16px", border: "none", background: mode === "check" ? T.charcoal : "transparent", color: mode === "check" ? T.cream : T.textMuted, fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={14} color={mode === "check" ? T.cream : T.textMuted} /> Checkbox
          </button>
        </div>
        <Btn variant="gold" onClick={() => setPresetModal(true)}><Icon name="zap" size={14} color={T.gold} /> Apply Preset</Btn>
        {assigned.size > 0 && <Btn variant="danger" onClick={clearAll}><Icon name="trash" size={14} color={T.danger} /> Clear All</Btn>}
        <div style={{ marginLeft: "auto" }}><Badge color={T.gold}>{assigned.size} skills</Badge></div>
      </div>

      {/* Two panels */}
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* LEFT: Master Program */}
        <div>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>Master Program</h3>
          <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: 16 }}>
            {mode === "drag" ? "Drag skills to the right panel" : "Check skills to add them"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {masterProgram.map((cat) => (
              <Card key={cat.id} style={{ padding: 16 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: 8 }}>{cat.name}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {cat.skills.map((sk) => {
                    const isA = assigned.has(sk.id);
                    if (mode === "drag") {
                      return (
                        <div
                          key={sk.id}
                          draggable={!isA}
                          onDragStart={(e) => onDragStart(e, sk.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 10px",
                            borderRadius: T.radiusSm,
                            background: isA ? T.successBg : T.cream,
                            cursor: isA ? "default" : "grab",
                            opacity: isA ? 0.6 : 1,
                            fontSize: "12px",
                          }}
                        >
                          {!isA && <Icon name="grip" size={14} color={T.textMuted} />}
                          {isA && <Icon name="check" size={14} color={T.success} />}
                          <span style={{ color: isA ? T.success : T.text }}>{sk.name}</span>
                          {isA && <span style={{ marginLeft: "auto", fontSize: "10px", color: T.success, fontWeight: 600 }}>ADDED</span>}
                        </div>
                      );
                    } else {
                      return (
                        <button
                          key={sk.id}
                          onClick={() => toggleSkill(sk.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 10px",
                            borderRadius: T.radiusSm,
                            border: "none",
                            background: isA ? T.successBg : T.cream,
                            cursor: "pointer",
                            textAlign: "left",
                            width: "100%",
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              border: `2px solid ${isA ? T.success : T.creamDark}`,
                              background: isA ? T.success : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {isA && <span style={{ color: T.white, fontSize: "10px", fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: "12px", color: isA ? T.success : T.text }}>{sk.name}</span>
                        </button>
                      );
                    }
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* RIGHT: Trainee's Track */}
        <div>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>{r.name.split(" ")[0]}'s Track</h3>
          <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: 16 }}>Add or remove skills · Use the Progress tab to set mastery levels</p>

          {mode === "drag" && (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              style={{
                border: "2px dashed " + (dropTarget ? T.gold : T.creamDark),
                borderRadius: T.radius,
                padding: dropTarget ? 20 : 16,
                marginBottom: 16,
                textAlign: "center",
                background: dropTarget ? T.goldMuted : "transparent",
                transition: "all .2s",
              }}
            >
              <p style={{ fontSize: "13px", color: dropTarget ? T.gold : T.textMuted, fontWeight: 500 }}>
                {dropTarget ? "Drop to add skill" : "↓ Drop skills here"}
              </p>
            </div>
          )}

          {assignedCats.length === 0 ? (
            <Card style={{ padding: 48, textAlign: "center", border: "2px dashed " + T.creamDark }}>
              <Icon name="template" size={32} color={T.goldLight} />
              <p style={{ color: T.textMuted, fontSize: "14px", marginTop: 12 }}>No skills assigned yet</p>
              <p style={{ color: T.textMuted, fontSize: "12px", marginTop: 4 }}>
                {mode === "drag" ? "Drag from the left" : "Check skills on the left"}
              </p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {assignedCats.map((cat) => (
                <Card key={cat.id} style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600 }}>{cat.name}</p>
                    <Badge color={T.gold}>{cat.skills.length}</Badge>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {cat.skills.map((sk) => (
                      <div key={sk.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: T.radiusSm, background: T.cream }}>
                        <span style={{ fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: sk.type === "service" ? T.goldMuted : T.charcoalMuted, color: sk.type === "service" ? T.gold : T.textMuted }}>
                          {sk.type === "service" ? "SVC" : "KN"}
                        </span>
                        <span style={{ flex: 1, fontSize: "12px", fontWeight: 500 }}>{sk.name}</span>
                        <button onClick={() => { toggleSkill(sk.id); showToast("Skill removed"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                          <Icon name="x" size={12} color={T.textMuted} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preset Modal */}
      <Modal open={presetModal} onClose={() => setPresetModal(false)} title="Apply Preset" width={440}>
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 16 }}>Adds the preset's skills (won't remove existing ones).</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {presets.map((pr) => (
            <button
              key={pr.id}
              onClick={() => applyPreset(pr)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: T.radiusSm,
                border: `1.5px solid ${T.creamDark}`,
                background: T.cream,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <Icon name="zap" size={18} color={T.gold} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 500 }}>{pr.name}</p>
                <p style={{ fontSize: "11px", color: T.textMuted }}>{pr.skillIds.length} skills</p>
              </div>
              <Icon name="plus" size={16} color={T.gold} />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: DOCUMENTS
// ════════════════════════════════════════════
const AdminDocs = () => {
  const { docs, setDocs, showToast } = useData();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Resources", url: "" });
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileType, setFileType] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(sizeMB + " MB");

    // Determine type
    let ft = "other";
    if (file.type.startsWith("image/")) ft = "image";
    else if (file.type === "application/pdf") ft = "pdf";
    setFileType(ft);

    // Auto-fill name if empty
    if (!form.name) setForm((f) => ({ ...f, name: file.name.replace(/\.[^/.]+$/, "") }));

    // Read as data URL
    const reader = new FileReader();
    reader.onload = (ev) => setFileData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const add = () => {
    if (!form.name.trim()) return;
    const doc = {
      id: Date.now(),
      name: form.name.trim(),
      category: form.category,
      date: new Date().toISOString().split("T")[0],
      size: fileSize || "—",
      dataUrl: fileData || null,
      url: form.url.trim() || null,
      fileType: fileType || "other",
    };
    setDocs((p) => [...p, doc]);
    setForm({ name: "", category: "Resources", url: "" });
    setFileData(null); setFileName(""); setFileSize(""); setFileType("");
    setModal(false);
    showToast("Document uploaded");
  };

  const rem = (id) => { setDocs((p) => p.filter((d) => d.id !== id)); showToast("Document removed"); };

  const openModal = () => {
    setForm({ name: "", category: "Resources", url: "" });
    setFileData(null); setFileName(""); setFileSize(""); setFileType("");
    setModal(true);
  };

  return (
    <div className="fade-up">
      <SectionTitle sub="Upload files or add links for your trainees" action={<Btn onClick={openModal}><Icon name="plus" size={16} color={T.cream} /> Upload Document</Btn>}>
        Document Manager
      </SectionTitle>
      {docs.length === 0 ? (
        <Card style={{ padding: 48, textAlign: "center" }}><p style={{ color: T.textMuted }}>No documents yet. Upload your first one!</p></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {docs.map((doc) => (
            <Card key={doc.id} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: T.radiusSm, background: doc.dataUrl ? T.successBg : doc.url ? "#4285f415" : T.goldMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="file" size={18} color={doc.dataUrl ? T.success : doc.url ? "#4285f4" : T.gold} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: "11px", color: T.textMuted }}>{doc.size} · {doc.date}</span>
                  {doc.dataUrl && <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: T.successBg, color: T.success }}>FILE</span>}
                  {doc.url && !doc.dataUrl && <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: "#4285f415", color: "#4285f4" }}>LINK</span>}
                </div>
              </div>
              <Badge color={T.textMuted}>{doc.category}</Badge>
              <button onClick={() => rem(doc.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Icon name="trash" size={16} color={T.danger} /></button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Upload Document" width={480}>
        {/* File Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: fileData ? "16px" : "32px",
            borderRadius: T.radius,
            border: "2px dashed " + (fileData ? T.success : T.goldLight),
            background: fileData ? T.successBg : T.cream,
            cursor: "pointer",
            textAlign: "center",
            marginBottom: 16,
            transition: "all .2s",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.xlsx,.csv,.txt"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          {fileData ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
              <Icon name="check" size={20} color={T.success} />
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: T.success }}>{fileName}</p>
                <p style={{ fontSize: "11px", color: T.textMuted }}>{fileSize} · Click to change</p>
              </div>
            </div>
          ) : (
            <>
              <Icon name="plus" size={24} color={T.goldLight} />
              <p style={{ fontSize: "13px", fontWeight: 500, color: T.textMuted, marginTop: 8 }}>Click to upload a file</p>
              <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>PDF, images, Word, Excel, text</p>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: T.creamDark }} />
          <span style={{ fontSize: "11px", color: T.textMuted, fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: T.creamDark }} />
        </div>

        <FormField label="External Link (Google Drive, Dropbox, etc.)">
          <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://drive.google.com/..." style={iSt} />
        </FormField>

        <FormField label="Document Name">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Color Formulation Guide" style={iSt} />
        </FormField>
        <FormField label="Category">
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={selSt}>
            {["Onboarding", "Schedule", "Resources", "Forms", "Policies"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={add} disabled={!form.name.trim() && !fileData}>Upload</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  SETTINGS PAGE (Google Calendar Integration)
// ════════════════════════════════════════════
const DEMO_GCAL_EVENTS = [
  { title: "Client: Sarah — Balayage", time: "9:00 AM – 11:30 AM", date: "2026-03-05" },
  { title: "Client: Tina — Cut & Style", time: "1:00 PM – 2:00 PM", date: "2026-03-05" },
  { title: "Client: Monica — Color Touch-up", time: "10:00 AM – 11:00 AM", date: "2026-03-06" },
  { title: "Staff Meeting", time: "9:00 AM – 9:30 AM", date: "2026-03-07" },
  { title: "Client: Deja — Extensions", time: "11:00 AM – 2:00 PM", date: "2026-03-07" },
  { title: "Client: Keisha — Blow-Dry", time: "10:00 AM – 11:00 AM", date: "2026-03-10" },
  { title: "Vendor Delivery", time: "8:00 AM – 8:30 AM", date: "2026-03-12" },
  { title: "Client: Rae — Full Color", time: "9:00 AM – 12:00 PM", date: "2026-03-12" },
];

// ════════════════════════════════════════════
//  TUITION: Helpers
// ════════════════════════════════════════════
const getTuitionInfo = (trainee) => {
  const t = trainee.tuition || { plan: "monthly", total: 4950, payments: [] };
  const paid = t.payments.reduce((a, p) => a + p.amount, 0);
  const remaining = Math.max(0, t.total - paid);
  const paidPct = t.total ? Math.round((paid / t.total) * 100) : 0;
  const status = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  return { ...t, paid, remaining, paidPct, status };
};

const STATUS_STYLES = {
  paid: { color: T.success, label: "Paid in Full", bg: T.successBg },
  partial: { color: T.warn, label: "Balance Due", bg: T.warnBg },
  unpaid: { color: T.danger, label: "Unpaid", bg: T.dangerBg },
};

// ════════════════════════════════════════════
//  TUITION: Trainee View (My Tuition)
// ════════════════════════════════════════════
const TraineeTuition = ({ user }) => {
  const { residents } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const info = getTuitionInfo(me);
  const st = STATUS_STYLES[info.status];

  return (
    <div className="fade-up">
      <SectionTitle sub="Your payment plan and history">My Tuition</SectionTitle>

      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 4 }}>Payment Plan</p>
            <h3 style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600 }}>{info.plan === "full" ? "Pay in Full" : "Monthly Plan"}</h3>
            <p style={{ fontSize: "13px", color: T.textMuted, marginTop: 2 }}>{info.plan === "full" ? "$4,500 one-time" : "$1,650/mo × 3 ($4,950)"}</p>
          </div>
          <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
        </div>

        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
          <div style={{ padding: 16, borderRadius: T.radiusSm, background: T.cream, textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Total</p>
            <p style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600 }}>${info.total.toLocaleString()}</p>
          </div>
          <div style={{ padding: 16, borderRadius: T.radiusSm, background: T.successBg, textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: T.success, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Paid</p>
            <p style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600, color: T.success }}>${info.paid.toLocaleString()}</p>
          </div>
          <div style={{ padding: 16, borderRadius: T.radiusSm, background: info.remaining > 0 ? T.warnBg : T.successBg, textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: info.remaining > 0 ? T.warn : T.success, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Remaining</p>
            <p style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600, color: info.remaining > 0 ? T.warn : T.success }}>${info.remaining.toLocaleString()}</p>
          </div>
        </div>

        <ProgressBar value={info.paidPct} height={10} color={info.status === "paid" ? T.success : T.gold} />
        <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 6, textAlign: "right" }}>{info.paidPct}% paid</p>
      </Card>

      <Card style={{ padding: 24 }}>
        <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>Payment History</h4>
        {info.payments.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: "13px" }}>No payments recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {info.payments.map((pay) => (
              <div key={pay.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: T.radiusSm, background: T.cream }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.successBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="check" size={16} color={T.success} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500 }}>{pay.note}</p>
                  <p style={{ fontSize: "11px", color: T.textMuted }}>{pay.date}</p>
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: T.success }}>+${pay.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════
//  TUITION: Admin Overview
// ════════════════════════════════════════════
const AdminTuition = ({ onNav }) => {
  const { residents, setResidents, showToast } = useData();
  const [payModal, setPayModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [targetResident, setTargetResident] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const totalRevenue = residents.reduce((a, r) => a + getTuitionInfo(r).total, 0);
  const totalPaid = residents.reduce((a, r) => a + getTuitionInfo(r).paid, 0);
  const totalRemaining = totalRevenue - totalPaid;

  const openPay = (r) => { setTargetResident(r); setPayAmount(""); setPayNote(""); setPayModal(true); };
  const recordPayment = () => {
    if (!payAmount || !targetResident) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    setResidents((p) => p.map((r) => {
      if (r.id !== targetResident.id) return r;
      const t = r.tuition || { plan: "monthly", total: 4950, payments: [] };
      return { ...r, tuition: { ...t, payments: [...t.payments, { id: `pay_${uid()}`, amount: amt, date: new Date().toISOString().split("T")[0], note: payNote || "Payment" }] } };
    }));
    showToast("Payment recorded");
    setPayModal(false);
  };

  const openPlan = (r) => { setTargetResident(r); setPlanModal(true); };
  const setPlan = (plan) => {
    if (!targetResident) return;
    const total = plan === "full" ? 4500 : 4950;
    setResidents((p) => p.map((r) => {
      if (r.id !== targetResident.id) return r;
      const t = r.tuition || { plan: "monthly", total: 4950, payments: [] };
      return { ...r, tuition: { ...t, plan, total } };
    }));
    showToast("Plan updated to " + (plan === "full" ? "Pay in Full" : "Monthly"));
    setPlanModal(false);
  };

  return (
    <div className="fade-up">
      <SectionTitle sub="Overview of all trainee payments">Tuition Manager</SectionTitle>

      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <Card style={{ padding: 22 }}>
          <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 8 }}>Total Revenue</p>
          <p style={{ fontFamily: T.fontD, fontSize: "32px", fontWeight: 600, color: T.charcoal, lineHeight: 1 }}>${totalRevenue.toLocaleString()}</p>
        </Card>
        <Card style={{ padding: 22 }}>
          <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 8 }}>Collected</p>
          <p style={{ fontFamily: T.fontD, fontSize: "32px", fontWeight: 600, color: T.success, lineHeight: 1 }}>${totalPaid.toLocaleString()}</p>
        </Card>
        <Card style={{ padding: 22 }}>
          <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 8 }}>Outstanding</p>
          <p style={{ fontFamily: T.fontD, fontSize: "32px", fontWeight: 600, color: totalRemaining > 0 ? T.warn : T.success, lineHeight: 1 }}>${totalRemaining.toLocaleString()}</p>
        </Card>
      </div>

      <Card style={{ padding: 24 }}>
        <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>Trainee Accounts</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {residents.map((r) => {
            const info = getTuitionInfo(r);
            const st = STATUS_STYLES[info.status];
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: T.radiusSm, background: T.cream }}>
                <Avatar name={r.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: "14px", fontWeight: 500 }}>{r.name}</p>
                    <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
                    <span style={{ fontSize: "11px", color: T.textMuted }}>{info.plan === "full" ? "Pay in Full" : "Monthly"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}><ProgressBar value={info.paidPct} height={6} color={info.status === "paid" ? T.success : T.gold} /></div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: T.textMuted, minWidth: 100, textAlign: "right" }}>
                      ${info.paid.toLocaleString()} / ${info.total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openPlan(r)} style={{ background: T.charcoalMuted, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 500, color: T.textMuted }}>
                    Plan
                  </button>
                  <button onClick={() => openPay(r)} style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="plus" size={12} color={T.gold} /> Payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Record Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title={"Record Payment — " + (targetResident?.name || "")} width={420}>
        {targetResident && (() => {
          const info = getTuitionInfo(targetResident);
          return (
            <>
              <div style={{ padding: 14, borderRadius: T.radiusSm, background: T.cream, marginBottom: 16 }}>
                <p style={{ fontSize: "12px", color: T.textMuted }}>Balance remaining: <b style={{ color: info.remaining > 0 ? T.warn : T.success }}>${info.remaining.toLocaleString()}</b></p>
              </div>
              <FormField label="Amount ($)">
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={info.plan === "monthly" ? "1650" : "4500"} style={iSt} />
              </FormField>
              <FormField label="Note (optional)">
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="e.g. Month 2, Cash payment" style={iSt} />
              </FormField>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <Btn variant="outline" onClick={() => setPayModal(false)}>Cancel</Btn>
                <Btn onClick={recordPayment}>Record Payment</Btn>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Change Plan Modal */}
      <Modal open={planModal} onClose={() => setPlanModal(false)} title={"Payment Plan — " + (targetResident?.name || "")} width={440}>
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 16 }}>Choose the payment plan for this trainee. Existing payments are preserved.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setPlan("full")} style={{
            flex: 1, padding: "20px 16px", borderRadius: T.radiusSm, textAlign: "center", cursor: "pointer",
            border: "2px solid " + ((targetResident?.tuition?.plan === "full") ? T.gold : T.creamDark),
            background: (targetResident?.tuition?.plan === "full") ? T.goldMuted : T.cream,
          }}>
            <p style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 600, marginBottom: 4 }}>$4,500</p>
            <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: 2 }}>Pay in Full</p>
            <p style={{ fontSize: "11px", color: T.textMuted }}>One-time payment</p>
          </button>
          <button onClick={() => setPlan("monthly")} style={{
            flex: 1, padding: "20px 16px", borderRadius: T.radiusSm, textAlign: "center", cursor: "pointer",
            border: "2px solid " + ((targetResident?.tuition?.plan === "monthly") ? T.gold : T.creamDark),
            background: (targetResident?.tuition?.plan === "monthly") ? T.goldMuted : T.cream,
          }}>
            <p style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 600, marginBottom: 4 }}>$1,650<span style={{ fontSize: "14px", fontWeight: 400 }}>/mo</span></p>
            <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: 2 }}>Monthly Plan</p>
            <p style={{ fontSize: "11px", color: T.textMuted }}>3 payments · $4,950 total</p>
          </button>
        </div>
      </Modal>
    </div>
  );
};

const SettingsPage = () => {
  const { gcalConnected, setGcalConnected, setGcalEvents, showToast } = useData();
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    // In production: OAuth flow → Google Calendar API → fetch events
    // Demo: simulate loading real events
    setTimeout(() => {
      setGcalConnected(true);
      setGcalEvents(DEMO_GCAL_EVENTS);
      setLoading(false);
      showToast("Google Calendar connected!");
    }, 1200);
  };

  const handleDisconnect = () => {
    setGcalConnected(false);
    setGcalEvents([]);
    showToast("Google Calendar disconnected");
  };

  return (
    <div className="fade-up">
      <SectionTitle sub="Manage integrations and portal settings">Settings</SectionTitle>

      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: T.radius,
            background: gcalConnected ? "#4285f415" : T.cream,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke={gcalConnected ? "#4285f4" : T.textMuted} strokeWidth="1.5" />
              <line x1="3" y1="9" x2="21" y2="9" stroke={gcalConnected ? "#4285f4" : T.textMuted} strokeWidth="1.5" />
              <line x1="8" y1="3" x2="8" y2="6" stroke={gcalConnected ? "#4285f4" : T.textMuted} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="3" x2="16" y2="6" stroke={gcalConnected ? "#4285f4" : T.textMuted} strokeWidth="1.5" strokeLinecap="round" />
              {gcalConnected && <circle cx="12" cy="15" r="2" fill="#4285f4" />}
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontFamily: T.fontD, fontSize: "20px", fontWeight: 600 }}>Google Calendar</h3>
              {gcalConnected && <Badge color={T.success}>Connected</Badge>}
            </div>
            <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.5, marginBottom: 16 }}>
              {gcalConnected
                ? "Your salon calendar is synced. Training schedule pages now show conflict badges when salon bookings overlap with training events."
                : "Connect your Google Calendar to see salon bookings alongside training events. Your salon CMS syncs to Google Calendar, so we'll read that data to detect scheduling conflicts."
              }
            </p>
            {gcalConnected ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Btn variant="danger" onClick={handleDisconnect}>
                  <Icon name="x" size={14} color={T.danger} /> Disconnect
                </Btn>
                <p style={{ fontSize: "12px", color: T.textMuted }}>Last synced just now</p>
              </div>
            ) : (
              <Btn onClick={handleConnect} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? "Connecting..." : "Connect Google Calendar"}
              </Btn>
            )}
          </div>
        </div>
      </Card>

      {gcalConnected && (
        <Card className="fade-up" style={{ padding: 24 }}>
          <h4 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 4 }}>How Conflict Detection Works</h4>
          <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
            When your Google Calendar has events on the same day as a training session, you'll see:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: T.radiusSm, background: T.cream }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.warn, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: T.white, fontSize: "11px", fontWeight: 800 }}>!</span>
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500 }}>Orange conflict badge on calendar days</p>
                <p style={{ fontSize: "11px", color: T.textMuted }}>Days with both salon and training events get flagged</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: T.radiusSm, background: T.cream }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#4285f4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="2" /></svg>
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500 }}>Blue salon events in day detail</p>
                <p style={{ fontSize: "11px", color: T.textMuted }}>Click any day to see salon bookings alongside training sessions</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card style={{ padding: 24, marginTop: 20 }}>
        <h4 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 12 }}>Portal Info</h4>
        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Portal URL", value: "resident.flowecollective.com" },
            { label: "Auth Provider", value: "Supabase" },
            { label: "Current Cohort", value: "Spring 2026" },
            { label: "Calendar Sync", value: gcalConnected ? "Google Calendar" : "Not connected" },
          ].map((item, i) => (
            <div key={i} style={{ padding: 14, borderRadius: T.radiusSm, background: T.cream }}>
              <p style={{ fontSize: "11px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: "14px", fontWeight: 500 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════
//  FLOATING TIMER (trainee only)
// ════════════════════════════════════════════
const FloatingTimer = ({ user, onNav }) => {
  const { residents, setResidents, masterProgram, showToast } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [linkedSkill, setLinkedSkill] = useState(null);
  const [logType, setLogType] = useState("mannequin");
  const [logNote, setLogNote] = useState("");
  const [showSave, setShowSave] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  };

  const handleStart = () => { setRunning(true); setShowSave(false); };
  const handleStop = () => { setRunning(false); if (seconds > 0) setShowSave(true); };
  const handleReset = () => { setRunning(false); setSeconds(0); setShowSave(false); setLinkedSkill(null); setLogNote(""); };

  const handleSaveLog = () => {
    if (!linkedSkill || seconds === 0) return;
    const mins = Math.round(seconds / 60);
    if (mins === 0) { showToast("Timer too short to log"); return; }
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const existing = logs[linkedSkill.id] || [];
      logs[linkedSkill.id] = [...existing, {
        minutes: mins,
        type: logType,
        date: new Date().toISOString().split("T")[0],
        note: logNote.trim(),
      }];
      return { ...r, timingLogs: logs };
    }));
    showToast("Logged " + mins + "min to " + linkedSkill.name);
    handleReset();
    setExpanded(false);
  };

  // Get service skills for linking
  const serviceSkills = masterProgram.flatMap((c) =>
    c.skills.filter((s) => s.type === "service" && (me.skillIds || []).includes(s.id)).map((s) => ({ ...s, catName: c.name }))
  );

  if (user.role === "admin") return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 500,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8,
    }}>
      {/* Expanded panel */}
      {expanded && (
        <Card className="fade-up" style={{
          width: 300, padding: 20, boxShadow: T.shadowLg,
          border: running ? "2px solid " + T.gold : "1px solid " + T.charcoalMuted,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted }}>Session Timer</p>
            <button onClick={() => setExpanded(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              <Icon name="x" size={16} color={T.textMuted} />
            </button>
          </div>

          {/* Timer display */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{
              fontFamily: T.fontD, fontSize: "48px", fontWeight: 600, lineHeight: 1,
              color: running ? T.gold : T.charcoal,
              letterSpacing: "2px",
            }}>
              {formatTime(seconds)}
            </p>
            {linkedSkill && (
              <p style={{ fontSize: "12px", color: T.gold, fontWeight: 500, marginTop: 6 }}>{linkedSkill.name}</p>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
            {!running ? (
              <button onClick={handleStart} style={{
                padding: "10px 24px", borderRadius: 24, border: "none",
                background: T.charcoal, color: T.cream, fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>
                {seconds > 0 ? "Resume" : "Start"}
              </button>
            ) : (
              <button onClick={handleStop} style={{
                padding: "10px 24px", borderRadius: 24, border: "none",
                background: T.warn, color: T.white, fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>
                Stop
              </button>
            )}
            {seconds > 0 && !running && (
              <button onClick={handleReset} style={{
                padding: "10px 16px", borderRadius: 24, border: "1.5px solid " + T.creamDark,
                background: "transparent", color: T.textMuted, fontSize: "13px", fontWeight: 500, cursor: "pointer",
              }}>
                Reset
              </button>
            )}
          </div>

          {/* Link to skill */}
          <FormField label="Link to Skill">
            <select
              value={linkedSkill?.id || ""}
              onChange={(e) => {
                const sk = serviceSkills.find((s) => s.id === e.target.value);
                setLinkedSkill(sk || null);
              }}
              style={selSt}
            >
              <option value="">Select a service skill...</option>
              {serviceSkills.map((sk) => (
                <option key={sk.id} value={sk.id}>{sk.name} ({sk.catName})</option>
              ))}
            </select>
          </FormField>

          {/* Save section — shows after stopping */}
          {showSave && linkedSkill && (
            <div style={{ borderTop: "1px solid " + T.charcoalMuted, paddingTop: 12, marginTop: 4 }}>
              <FormField label="Practice Type">
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setLogType("mannequin")} style={{
                    flex: 1, padding: "8px", borderRadius: T.radiusSm, border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    background: logType === "mannequin" ? T.goldMuted : T.cream, color: logType === "mannequin" ? T.gold : T.textMuted,
                  }}>Mannequin</button>
                  <button onClick={() => setLogType("model")} style={{
                    flex: 1, padding: "8px", borderRadius: T.radiusSm, border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    background: logType === "model" ? "#8B6AAE15" : T.cream, color: logType === "model" ? "#8B6AAE" : T.textMuted,
                  }}>Live Model</button>
                </div>
              </FormField>
              <FormField label="Notes (optional)">
                <input value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder="Quick note..." style={iSt} />
              </FormField>
              <button onClick={handleSaveLog} style={{
                width: "100%", padding: "10px", borderRadius: T.radiusSm, border: "none",
                background: T.charcoal, color: T.cream, fontSize: "13px", fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Icon name="check" size={14} color={T.gold} /> Log {Math.round(seconds / 60)} min Practice
              </button>
            </div>
          )}
          {showSave && !linkedSkill && (
            <p style={{ fontSize: "11px", color: T.warn, textAlign: "center", marginTop: 4 }}>Link a skill above to save this time</p>
          )}
        </Card>
      )}

      {/* Floating button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: running ? "auto" : 52, height: 52, borderRadius: running ? 26 : "50%",
          background: running ? T.charcoal : T.gold,
          border: "none", cursor: "pointer", boxShadow: T.shadowLg,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: running ? "0 20px" : 0,
          animation: running ? "none" : "none",
          transition: "all .3s ease",
        }}
      >
        {running ? (
          <>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold, animation: "pulse 1.5s infinite" }} />
            <span style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, color: T.cream, letterSpacing: "1px" }}>
              {formatTime(seconds)}
            </span>
          </>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke={T.white} strokeWidth="1.5" />
            <polyline points="12,7 12,12 15,14" stroke={T.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
};

// ════════════════════════════════════════════
//  APP SHELL
// ════════════════════════════════════════════
const App = () => {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dash");
  const [masterProgram, setMasterProgram] = useState(MASTER_PROGRAM);
  const [presets, setPresets] = useState(INIT_PRESETS);
  const [residents, setResidents] = useState(INIT_RESIDENTS);
  const [schedule, setSchedule] = useState(INIT_SCHEDULE);
  const [docs, setDocs] = useState(INIT_DOCS);
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalEvents, setGcalEvents] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = (msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  const login = (u) => { setUser(u); setPage(u.role === "admin" ? "a-dash" : "dash"); };
  const logout = () => { setUser(null); setPage("dash"); };

  if (!user) return <><GlobalStyle /><AuthScreen onLogin={login} /></>;

  const data = { masterProgram, setMasterProgram, presets, setPresets, residents, setResidents, schedule, setSchedule, docs, setDocs, messages, setMessages, gcalConnected, setGcalConnected, gcalEvents, setGcalEvents, showToast };

  let content;
  if (page.startsWith("a-trainees:")) {
    content = <TraineeProfile traineeId={page.split(":")[1]} onNav={setPage} />;
  } else {
    const map = {
      dash: <TraineeDash user={user} />,
      sched: <TraineeSchedule user={user} />,
      skills: <TraineeSkills user={user} />,
      tuition: <TraineeTuition user={user} />,
      handbook: <HandbookPage />,
      docs: <TraineeDocs />,
      msg: <MsgPage user={user} />,
      "a-dash": <AdminDash />,
      "a-sched": <AdminSchedule />,
      "a-master": <AdminMaster />,
      "a-presets": <AdminPresets />,
      "a-trainees": <AdminTrainees onNav={setPage} />,
      "a-tuition": <AdminTuition onNav={setPage} />,
      "a-docs": <AdminDocs />,
      "a-msg": <MsgPage user={user} />,
      "a-settings": <SettingsPage />,
    };
    content = map[page] || map["dash"];
  }

  return (
    <Ctx.Provider value={data}>
      <GlobalStyle />
      <div style={{ display: "flex", minHeight: "100vh", background: T.cream }}>
        <Sidebar user={user} page={page} onNav={setPage} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div style={{ flex: 1, marginLeft: 240, display: "flex", flexDirection: "column", minHeight: "100vh" }} className="app-main">
          <MobileHeader user={user} onMenuToggle={() => setMobileOpen(true)} />
          <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1060 }}>{content}</main>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
      {user.role !== "admin" && <FloatingTimer user={user} onNav={setPage} />}
    </Ctx.Provider>
  );
};

export default App;
