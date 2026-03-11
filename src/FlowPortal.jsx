import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { T, TC, CAT_COLORS, TECHNIQUE_STAGES, TIMING_STAGES, TECHNIQUE_COLORS, TIMING_COLORS, iSt, selSt } from "./theme";
import { GlobalStyle } from "./GlobalStyle";
import { Icon } from "./components/Icon";
import { Card, Badge, ProgressBar, Avatar, SectionTitle, FormField, Btn, Modal, Toast } from "./components/ui";
import { supabase } from "./lib/supabase";
import { AgreementPage } from "./components/AgreementPage";

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ════════════════════════════════════════════
//  PHOTO CROP MODAL
//  Shows the full image scaled to fit a box.
//  User drags to pan and uses a zoom slider.
//  A circular mask overlay shows the crop area.
//  On save, the visible circle is rendered to a 400px canvas.
// ════════════════════════════════════════════
const PhotoCropModal = ({ open, onClose, onSave, currentPhoto }) => {
  const [src, setSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [natSize, setNatSize] = useState({ w: 1, h: 1 });
  const canvasRef = useRef(null);
  const boxSize = 300; // the viewport box
  const circleR = 130; // crop circle radius

  useEffect(() => {
    if (open) { setSrc(currentPhoto || null); setZoom(1); setPos({ x: 0, y: 0 }); }
  }, [open, currentPhoto]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setSrc(ev.target.result); setZoom(1); setPos({ x: 0, y: 0 }); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Compute base scale: fit the full image inside the box
  const baseScale = Math.min(boxSize / natSize.w, boxSize / natSize.h);
  const imgW = natSize.w * baseScale * zoom;
  const imgH = natSize.h * baseScale * zoom;

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
    const nx = e.clientX - dragStart.x;
    const ny = e.clientY - dragStart.y;
    // Clamp so the crop circle stays within the image
    const maxX = Math.max(0, (imgW - circleR * 2) / 2);
    const maxY = Math.max(0, (imgH - circleR * 2) / 2);
    setPos({ x: Math.max(-maxX, Math.min(maxX, nx)), y: Math.max(-maxY, Math.min(maxY, ny)) });
  };
  const handlePointerUp = () => setDragging(false);

  const cropAndSave = () => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const outSize = 400;
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext("2d");

      // Where does the crop circle sit relative to the displayed image?
      // Image is centered at (boxSize/2 + pos.x, boxSize/2 + pos.y)
      // Crop circle is centered at (boxSize/2, boxSize/2)
      // So crop center in image-display coords = (imgW/2 - pos.x, imgH/2 - pos.y)
      const cropCxOnImg = imgW / 2 - pos.x;
      const cropCyOnImg = imgH / 2 - pos.y;

      // Convert from display coords to natural image coords
      const displayToNat = 1 / (baseScale * zoom);
      const srcCx = cropCxOnImg * displayToNat;
      const srcCy = cropCyOnImg * displayToNat;
      const srcR = circleR * displayToNat;

      ctx.beginPath();
      ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw the portion of the source image that maps to the crop circle
      ctx.drawImage(
        img,
        srcCx - srcR, srcCy - srcR, srcR * 2, srcR * 2, // source rect
        0, 0, outSize, outSize // dest rect
      );

      onSave(canvas.toDataURL("image/jpeg", 0.85));
      onClose();
    };
    img.src = src;
  };

  if (!open) return null;

  // SVG mask: full box dimmed, circle cut out
  const maskId = "crop-mask-" + (open ? "1" : "0");

  return (
    <Modal open={open} onClose={onClose} title="Edit Photo" width={380}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {!src ? (
          <label style={{ width: 200, height: 200, borderRadius: "50%", border: `2px dashed ${T.creamDark}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: T.cream, gap: 8 }}>
            <Icon name="plus" size={32} color={T.textMuted} />
            <span style={{ fontSize: "12px", color: T.textMuted, fontWeight: 500 }}>Choose Photo</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </label>
        ) : (
          <>
            {/* Crop viewport */}
            <div
              style={{
                width: boxSize, height: boxSize, position: "relative", overflow: "hidden",
                borderRadius: T.radiusSm, background: "#111", cursor: dragging ? "grabbing" : "grab",
                userSelect: "none", touchAction: "none",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* The image, centered + offset by pan */}
              <img
                src={src}
                draggable={false}
                onLoad={(e) => setNatSize({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
                style={{
                  position: "absolute",
                  width: imgW, height: imgH,
                  left: (boxSize - imgW) / 2 + pos.x,
                  top: (boxSize - imgH) / 2 + pos.y,
                  pointerEvents: "none",
                }}
              />
              {/* Dark overlay with circle cutout */}
              <svg width={boxSize} height={boxSize} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                <defs>
                  <mask id={maskId}>
                    <rect width={boxSize} height={boxSize} fill="white" />
                    <circle cx={boxSize / 2} cy={boxSize / 2} r={circleR} fill="black" />
                  </mask>
                </defs>
                <rect width={boxSize} height={boxSize} fill="rgba(0,0,0,0.55)" mask={`url(#${maskId})`} />
                <circle cx={boxSize / 2} cy={boxSize / 2} r={circleR} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              </svg>
            </div>

            {/* Zoom slider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
              <span style={{ fontSize: "11px", color: T.textMuted }}>Zoom</span>
              <input
                type="range" min="1" max="3" step="0.02" value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: T.gold }}
              />
            </div>

            {/* Change photo */}
            <label style={{ fontSize: "12px", color: T.gold, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="edit" size={12} color={T.gold} /> Change Photo
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            </label>
          </>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ display: "flex", gap: 10, width: "100%", justifyContent: "flex-end", marginTop: 4 }}>
          {currentPhoto && src && (
            <Btn variant="danger" onClick={() => { onSave(null); onClose(); }} style={{ marginRight: "auto", fontSize: "12px", padding: "8px 14px" }}>Remove</Btn>
          )}
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          {src && <Btn onClick={cropAndSave}>Save Photo</Btn>}
        </div>
      </div>
    </Modal>
  );
};

const Ctx = createContext(null);
const useData = () => useContext(Ctx);

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
    name: "Cheyenne Rollins",
    cohort: "Spring 2026",
    email: "maya@flowecollective.com",
    skillIds: [...ALL_SKILL_IDS],
    focusSkills: [], photo: null,
    progress: { sk1: {technique:3,timing:3}, sk2: {technique:3,timing:2}, sk8: {done:true}, sk9: {technique:3,timing:2}, sk15: {technique:2,timing:0}, sk19: {done:true}, sk27: {done:true} },
    tuition: { plan: "monthly", total: 4950, payments: [
      { id: "pay1", amount: 1650, date: "2026-01-15", note: "Month 1" },
      { id: "pay2", amount: 1650, date: "2026-02-15", note: "Month 2" },
    ]},
    timingLogs: {
      sk1: [
        { minutes: 68, type: "mannequin", date: "2026-02-10", note: "First attempt", comments: [] },
        { minutes: 55, type: "mannequin", date: "2026-02-17", note: "Better blending", comments: [
          { from: "educator", text: "Watch elevation at the crown — you're over-directing", ts: "2026-02-18T09:00:00", name: "Admin" },
          { from: "resident", text: "Got it, will focus on keeping it flat next session", ts: "2026-02-18T11:30:00", name: "Avery" },
        ]},
        { minutes: 52, type: "model", date: "2026-02-24", note: "First live cut", comments: [
          { from: "educator", text: "Great consultation. Tension was inconsistent on the left side", ts: "2026-02-25T10:00:00", name: "Admin" },
        ]},
        { minutes: 48, type: "model", date: "2026-03-03", note: "Feeling confident", comments: [] },
      ],
      sk2: [
        { minutes: 60, type: "mannequin", date: "2026-02-12", note: "", comments: [] },
        { minutes: 50, type: "mannequin", date: "2026-02-20", note: "Lob went well", comments: [
          { from: "educator", text: "Weight line is clean. Try graduating the back next time", ts: "2026-02-21T14:00:00", name: "Admin" },
          { from: "resident", text: "Will try that, thanks!", ts: "2026-02-21T15:00:00", name: "Avery" },
          { from: "educator", text: "Let me know how it goes — I can demo the graduation technique Thursday", ts: "2026-02-21T15:15:00", name: "Admin" },
        ]},
      ],
      sk9: [
        { minutes: 72, type: "mannequin", date: "2026-02-15", note: "", comments: [] },
        { minutes: 65, type: "model", date: "2026-02-28", note: "Root touch-up", comments: [] },
      ],
    },
  },
  {
    id: "r2",
    name: "Aisha Williams",
    cohort: "Spring 2026",
    email: "aisha@flowecollective.com",
    skillIds: ["sk8", "sk9", "sk10", "sk11", "sk12", "sk13", "sk14", "sk19", "sk20"],
    focusSkills: [], photo: null,
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
    focusSkills: [], photo: null,
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
    focusSkills: [], photo: null,
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
// Lookup skill type from master program (falls back to knowledge)
const findSkill = (masterProgram, sid) => {
  for (const cat of masterProgram) {
    const sk = cat.skills.find((s) => s.id === sid);
    if (sk) return sk;
  }
  return null;
};

const findSkillCat = (masterProgram, sid) => {
  for (const cat of masterProgram) {
    if (cat.skills.some((s) => s.id === sid)) return cat;
  }
  return null;
};

// Get event color: use category color for skill-linked events, otherwise TC type color
const getEvColor = (ev, masterProgram) => {
  if (ev.skillId) {
    const cat = findSkillCat(masterProgram, ev.skillId);
    if (cat?.color) return cat.color;
  }
  return TC[ev.type] || T.gold;
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
  const [styleOpen, setStyleOpen] = useState(false);
  const [, forceUpdate] = useState(0);
  const getActiveBlock = () => {
    try {
      const block = document.queryCommandValue("formatBlock");
      if (block === "h1") return "Heading 1";
      if (block === "h2") return "Heading 2";
      if (block === "h3") return "Heading 3";
    } catch (e) {}
    return "Normal";
  };

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
    restoreSelection();
    document.execCommand(cmd, false, val || null);
    saveSelection();
    if (onChange) onChange(editorRef.current?.innerHTML || "");
    forceUpdate((n) => n + 1);
  };

  const handleInput = () => {
    if (onChange) onChange(editorRef.current?.innerHTML || "");
  };

  const isActive = (cmd) => { try { return document.queryCommandState(cmd); } catch (e) { return false; } };

  const toolbarBtn = (label, cmd, extraStyle = {}) => {
    const active = isActive(cmd);
    return (
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          exec(cmd);
        }}
        style={{
          height: 28, border: "none", background: active ? T.goldMuted : "transparent", cursor: "pointer",
          fontSize: "11px", color: active ? T.gold : T.charcoal, padding: "0 8px", display: "flex", alignItems: "center",
          borderRadius: 4, transition: "all .1s",
          ...extraStyle,
        }}
      >{label}</button>
    );
  };

  return (
    <div style={{ border: "1px solid " + T.lightLine, background: T.white }}>
      <div style={{ display: "flex", gap: 1, padding: "4px 6px", borderBottom: "1px solid " + T.lightLine, background: T.cream, flexWrap: "wrap", alignItems: "center" }}>
        {toolbarBtn("B", "bold", { fontWeight: 700, fontSize: "13px", width: 28, justifyContent: "center" })}
        {toolbarBtn("I", "italic", { fontStyle: "italic", fontSize: "13px", width: 28, justifyContent: "center" })}
        {toolbarBtn("U", "underline", { textDecoration: "underline", fontSize: "13px", width: 28, justifyContent: "center" })}
        <div style={{ width: 1, height: 18, background: T.lightLine, margin: "0 4px" }} />
        {toolbarBtn("1. List", "insertOrderedList")}
        {toolbarBtn("• List", "insertUnorderedList")}
        <div style={{ width: 1, height: 18, background: T.lightLine, margin: "0 4px" }} />
        <div style={{ position: "relative" }}>
          <button
            onMouseDown={(e) => { e.preventDefault(); setStyleOpen(!styleOpen); }}
            style={{ height: 28, border: "none", background: "transparent", cursor: "pointer", fontSize: "11px", color: T.charcoal, padding: "0 8px", display: "flex", alignItems: "center", fontWeight: 400 }}
          >{getActiveBlock()}</button>
          {styleOpen && (
            <div style={{ position: "absolute", top: 30, left: 0, zIndex: 20, background: T.white, border: "1px solid " + T.lightLine, boxShadow: T.shadowLg, minWidth: 130 }}>
              {[
                { label: "Heading 1", tag: "<h1>", style: { fontSize: "15px", fontWeight: 700 } },
                { label: "Heading 2", tag: "<h2>", style: { fontSize: "13px", fontWeight: 600 } },
                { label: "Heading 3", tag: "<h3>", style: { fontSize: "12px", fontWeight: 600 } },
                { label: "Normal", tag: "<p>", style: { fontSize: "12px", fontWeight: 400 } },
              ].map((item) => (
                <button key={item.tag} onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", item.tag); setStyleOpen(false); }} style={{
                  display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", ...item.style,
                }}>{item.label}</button>
              ))}
            </div>
          )}
        </div>
        <button onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }} style={{ height: 28, border: "none", background: "transparent", cursor: "pointer", fontSize: "11px", color: T.textMuted, padding: "0 8px", display: "flex", alignItems: "center" }}>Clear</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={() => { saveSelection(); forceUpdate((n) => n + 1); }}
        onKeyUp={() => { saveSelection(); forceUpdate((n) => n + 1); }}
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
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // "login" or "signup"

  const go = async () => {
    if (!email || !pw) { setError("Email and password required"); return; }
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { data: { name: email.split("@")[0], role: "resident" } },
        });
        if (signUpErr) throw signUpErr;
        setError("");
        setMode("login");
        setLoading(false);
        alert("Account created! Check your email to confirm, then sign in.");
        return;
      }
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (signInErr) throw signInErr;
      // Profile is fetched in App via onAuthStateChange
    } catch (err) {
      setError(err.message || "Sign in failed");
      setLoading(false);
    }
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
          <h3 style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 500, textAlign: "center", marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h3>
          <p style={{ color: T.textMuted, fontSize: "13px", textAlign: "center", marginBottom: 28 }}>
            {mode === "login" ? "Sign in to continue" : "Set up your resident account"}
          </p>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: T.radiusSm, background: "#fee", border: "1px solid #fcc", marginBottom: 16 }}>
              <p style={{ fontSize: "12px", color: "#c33" }}>{error}</p>
            </div>
          )}
          <FormField label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@flowecollective.com" style={iSt} onKeyDown={(e) => e.key === "Enter" && go()} />
          </FormField>
          <FormField label="Password">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" style={iSt} onKeyDown={(e) => e.key === "Enter" && go()} />
          </FormField>
          <button
            onClick={go}
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: T.radiusSm,
              background: T.charcoal,
              color: T.cream,
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "wait" : "pointer",
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign In" : "Create Account")}
          </button>
        </Card>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: "12px", color: T.textMuted }}>
          {mode === "login" ? (
            <>Don't have an account?{" "}<button onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>Sign up</button></>
          ) : (
            <>Already have an account?{" "}<button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: T.gold, cursor: "pointer", fontWeight: 600, fontSize: "12px" }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════
const Sidebar = ({ user, page, onNav, onLogout, mobileOpen, setMobileOpen }) => {
  const { notifications } = useData();
  const isA = user?.role === "admin";
  const unreviewedCount = isA ? (notifications || []).filter((n) => !n.reviewed).length : 0;

  // Check onboarding completion for residents
  const [onboardingDone, setOnboardingDone] = useState(true);
  useEffect(() => {
    if (isA || !user?.id) return;
    supabase.from("profiles").select("agreement_signed, enrollment_completed, gusto_completed").eq("id", user.id).single().then(({ data }) => {
      if (data) setOnboardingDone(!!data.agreement_signed && !!data.enrollment_completed && !!data.gusto_completed);
    });
  }, [isA, user?.id, page]);

  const items = isA
    ? [
        { id: "a-dash", label: "Dashboard", icon: "dashboard", badge: unreviewedCount },
        { id: "a-sched", label: "Schedule", icon: "calendar" },
        { id: "a-master", label: "Master Program", icon: "template" },
        { id: "a-trainees", label: "Trainees", icon: "users" },
        { id: "a-tuition", label: "Tuition", icon: "dollar" },
        { id: "a-docs", label: "Documents", icon: "file" },
        { id: "a-msg", label: "Messages", icon: "message" },
        { id: "a-settings", label: "Settings", icon: "settings" },
      ]
    : [
        { id: "dash", label: "Dashboard", icon: "dashboard" },
        { id: "onboarding", label: "Onboarding", icon: "clipboard", dot: !onboardingDone },
        { id: "sched", label: "Schedule", icon: "calendar" },
        { id: "skills", label: "My Skills", icon: "check" },
        { id: "tuition", label: "My Tuition", icon: "dollar" },
        { id: "handbook", label: "Handbook", icon: "file" },
        { id: "docs", label: "Documents", icon: "file" },
        { id: "msg", label: "Messages", icon: "message" },
        { id: "settings", label: "Settings", icon: "settings" },
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
                {it.badge > 0 && (
                  <span style={{
                    marginLeft: "auto",
                    background: T.danger,
                    color: T.white,
                    fontSize: "10px",
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                  }}>{it.badge}</span>
                )}
                {it.dot && (
                  <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: T.warn, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid " + T.lightLine }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Avatar name={user?.name} size={32} photo={user?.photo} />
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
    <Avatar name={user?.name} size={28} photo={user?.photo} />
  </div>
);

// ── Inline Reply (compact, for skill card logs) ──
const InlineReply = ({ onSend }) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "10px", color: T.gold, fontWeight: 500, marginTop: 3, padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
        <Icon name="message" size={10} color={T.gold} /> Reply
      </button>
    );
  }
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center" }}>
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onSend(text.trim()); setText(""); setOpen(false); }}} placeholder="Reply..." autoFocus style={{ flex: 1, padding: "5px 10px", borderRadius: 14, border: `1px solid ${T.creamDark}`, background: T.white, fontSize: "11px", outline: "none" }} />
      <button onClick={() => { if (text.trim()) { onSend(text.trim()); setText(""); setOpen(false); }}} style={{ background: T.charcoal, border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="send" size={10} color={T.cream} />
      </button>
    </div>
  );
};

// ── Reply Input (shared between trainee + admin views) ──
const ReplyInput = ({ skillId, logIdx, me, setResidents, showToast }) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const submit = () => {
    if (!text.trim()) return;
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const entries = [...(logs[skillId] || [])];
      if (entries[logIdx]) {
        const prev = entries[logIdx].comments || [];
        entries[logIdx] = { ...entries[logIdx], comments: [...prev, { from: "resident", text: text.trim(), ts: new Date().toISOString(), name: me.name?.split(" ")[0] }] };
      }
      logs[skillId] = entries;
      return { ...r, timingLogs: logs };
    }));
    setText("");
    setOpen(false);
    showToast("Reply sent");
  };
  if (!open) {
    return (
      <div style={{ padding: "6px 14px 10px", borderTop: `1px solid ${T.lightLine}` }}>
        <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: T.gold, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
          <Icon name="message" size={12} color={T.gold} /> Reply...
        </button>
      </div>
    );
  }
  return (
    <div style={{ padding: "8px 14px 10px", borderTop: `1px solid ${T.lightLine}`, display: "flex", gap: 8, alignItems: "flex-end" }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Write a reply..."
        autoFocus
        style={{ flex: 1, padding: "8px 12px", borderRadius: 20, border: `1.5px solid ${T.creamDark}`, background: T.cream, fontSize: "12px", outline: "none" }}
      />
      <button onClick={submit} disabled={!text.trim()} style={{ background: T.charcoal, border: "none", borderRadius: "50%", width: 30, height: 30, cursor: text.trim() ? "pointer" : "not-allowed", opacity: text.trim() ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name="send" size={13} color={T.cream} />
      </button>
    </div>
  );
};

// ════════════════════════════════════════════
//  TRAINEE: ONBOARDING
// ════════════════════════════════════════════
const GUSTO_FIELDS = [
  { key: "legalName", label: "Legal Full Name", type: "text", placeholder: "First Last" },
  { key: "ssn", label: "SSN", type: "password", placeholder: "XXX-XX-XXXX" },
  { key: "dob", label: "Date of Birth", type: "date", placeholder: "" },
  { key: "address", label: "Home Address", type: "text", placeholder: "Street, City, State ZIP" },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "(555) 555-0000" },
  { key: "emergencyName", label: "Emergency Contact Name", type: "text", placeholder: "Full Name" },
  { key: "emergencyPhone", label: "Emergency Contact Phone", type: "tel", placeholder: "(555) 555-0000" },
  { key: "bankRouting", label: "Bank Routing Number", type: "password", placeholder: "9 digits" },
  { key: "bankAccount", label: "Bank Account Number", type: "password", placeholder: "Account number" },
];

const TraineeOnboarding = ({ user, onNav }) => {
  const { showToast, setUser } = useData();
  const [ob, setOb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gustoOpen, setGustoOpen] = useState(false);
  const [gustoFields, setGustoFields] = useState({});

  // Load onboarding fields from profiles table
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles")
        .select("agreement_signed, agreement_date, agreement_url, agreement_countersigned, enrollment_completed, enrollment_date, enrollment_plan, gusto_completed, gusto_date, gusto_fields")
        .eq("id", user.id).single();
      if (data) {
        setOb(data);
        setGustoFields(data.gusto_fields || {});
      } else {
        setOb({ agreement_signed: false, agreement_countersigned: false, enrollment_completed: false, gusto_completed: false, gusto_fields: {} });
      }
      setLoading(false);
    };
    load();
  }, [user.id]);

  const updateOb = async (updates) => {
    const { data } = await supabase.from("profiles").update(updates).eq("id", user.id).select("agreement_signed, agreement_date, agreement_url, agreement_countersigned, enrollment_completed, enrollment_date, enrollment_plan, gusto_completed, gusto_date, gusto_fields").single();
    if (data) setOb(data);
    return data;
  };

  if (loading || !ob) return (
    <div className="fade-up">
      <SectionTitle sub="Loading...">Onboarding</SectionTitle>
      <Card style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.textMuted, fontSize: "13px" }}>Loading your onboarding status...</p></Card>
    </div>
  );

  const steps = [
    { id: "agreement", label: "Sign Residency Agreement", icon: "shield", done: ob.agreement_signed },
    { id: "enrollment", label: "Enroll & Pay Tuition", icon: "dollar", done: ob.enrollment_completed },
    { id: "gusto", label: "Complete Payroll Setup", icon: "clipboard", done: ob.gusto_completed },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  const handleAgreement = () => {
    if (ob.agreement_signed && ob.agreement_url) {
      window.open(ob.agreement_url, "_blank");
    } else {
      if (onNav) onNav("agreement");
    }
  };

  const handleEnroll = () => {
    window.open("https://jordanwangco.com/enroll", "_blank");
  };

  const markEnrolled = async () => {
    const now = new Date().toISOString().split("T")[0];
    await updateOb({ enrollment_completed: true, enrollment_date: now, enrollment_plan: "monthly" });
    showToast("Enrollment confirmed!");
  };

  const saveGusto = async () => {
    const required = ["legalName", "dob", "address", "phone", "emergencyName", "emergencyPhone"];
    const missing = required.filter((k) => !gustoFields[k]);
    if (missing.length > 0) {
      showToast("Please fill out all required fields");
      return;
    }
    const now = new Date().toISOString().split("T")[0];
    await updateOb({ gusto_completed: true, gusto_date: now, gusto_fields: gustoFields });
    setGustoOpen(false);
    showToast("Payroll information saved!");
  };

  return (
    <div className="fade-up">
      <SectionTitle sub={allDone ? "All steps completed — you're all set!" : `${completedCount} of ${steps.length} steps completed`}>
        Onboarding
      </SectionTitle>

      {/* Progress bar */}
      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: "13px", fontWeight: 500 }}>
            {allDone ? "Onboarding Complete" : "Complete these steps to get started"}
          </p>
          <Badge color={allDone ? T.success : T.gold} bg={allDone ? T.successBg : T.goldMuted}>
            {completedCount}/{steps.length}
          </Badge>
        </div>
        <ProgressBar value={Math.round((completedCount / steps.length) * 100)} height={8} color={allDone ? T.success : T.gold} />
      </Card>

      {/* Step 1: Agreement */}
      <Card style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: ob.agreement_signed ? T.successBg : T.goldMuted,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {ob.agreement_signed
              ? <Icon name="check" size={20} color={T.success} />
              : <Icon name="shield" size={20} color={T.gold} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              Sign Residency Agreement
              {ob.agreement_signed && !ob.agreement_countersigned && (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.warn, display: "inline-block", flexShrink: 0 }} title="Pending countersign" />
              )}
            </p>
            <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 2 }}>
              {ob.agreement_signed
                ? ob.agreement_countersigned
                  ? `Signed on ${ob.agreement_date} · Countersigned ✓`
                  : `Signed on ${ob.agreement_date} · Pending countersign`
                : "Review and sign the Flowe Collective residency agreement"
              }
            </p>
          </div>
          <button onClick={handleAgreement} style={{
            padding: "8px 16px", borderRadius: T.radiusSm,
            border: ob.agreement_signed ? `1px solid ${T.lightLine}` : "none",
            background: ob.agreement_signed ? T.white : T.charcoal,
            fontSize: "12px", fontWeight: 500, cursor: "pointer",
            color: ob.agreement_signed ? T.textMuted : T.cream,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={ob.agreement_signed ? "eye" : "edit"} size={14} color={ob.agreement_signed ? T.textMuted : T.cream} />
              {ob.agreement_signed ? "View" : "Review & Sign"}
            </span>
          </button>
        </div>
      </Card>

      {/* Step 2: Enrollment */}
      <Card style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: ob.enrollment_completed ? T.successBg : T.goldMuted,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {ob.enrollment_completed
              ? <Icon name="check" size={20} color={T.success} />
              : <Icon name="dollar" size={20} color={T.gold} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: 600 }}>Enroll & Pay Tuition</p>
            <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 2 }}>
              {ob.enrollment_completed
                ? `Enrolled on ${ob.enrollment_date} · ${ob.enrollment_plan === "full" ? "Paid in Full" : "Monthly Plan"}`
                : "Choose your tuition plan and complete payment to secure your spot"
              }
            </p>
          </div>
          {ob.enrollment_completed ? (
            <Badge color={T.success} bg={T.successBg}>Enrolled</Badge>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleEnroll} style={{ padding: "8px 16px", borderRadius: T.radiusSm, border: `1px solid ${T.lightLine}`, background: T.white, fontSize: "12px", fontWeight: 500, cursor: "pointer", color: T.charcoal }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="link" size={14} color={T.charcoal} /> Enroll</span>
              </button>
              <button onClick={markEnrolled} style={{ padding: "8px 16px", borderRadius: T.radiusSm, border: "none", background: T.charcoal, fontSize: "12px", fontWeight: 500, cursor: "pointer", color: T.cream }}>
                Confirm
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Step 3: Gusto / Payroll */}
      <Card style={{ padding: 0, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: ob.gusto_completed ? T.successBg : T.goldMuted,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {ob.gusto_completed
              ? <Icon name="check" size={20} color={T.success} />
              : <Icon name="clipboard" size={20} color={T.gold} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", fontWeight: 600 }}>Complete Payroll Setup</p>
            <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 2 }}>
              {ob.gusto_completed
                ? `Completed on ${ob.gusto_date}`
                : "Fill out your tax, banking, and emergency contact information"
              }
            </p>
          </div>
          {ob.gusto_completed ? (
            <button onClick={() => { setGustoFields(ob.gusto_fields || {}); setGustoOpen(true); }} style={{ padding: "8px 16px", borderRadius: T.radiusSm, border: `1px solid ${T.lightLine}`, background: T.white, fontSize: "12px", fontWeight: 500, cursor: "pointer", color: T.textMuted }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="edit" size={14} color={T.textMuted} /> Edit</span>
            </button>
          ) : (
            <button onClick={() => setGustoOpen(true)} style={{ padding: "8px 16px", borderRadius: T.radiusSm, border: "none", background: T.charcoal, fontSize: "12px", fontWeight: 500, cursor: "pointer", color: T.cream }}>
              Fill Out
            </button>
          )}
        </div>
      </Card>

      {/* Gusto Form Modal */}
      <Modal open={gustoOpen} onClose={() => setGustoOpen(false)} title="Payroll & Tax Information" width={520}>
        <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: 20 }}>
          This information is used for payroll processing through Gusto. All data is encrypted and stored securely.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {GUSTO_FIELDS.map((f) => (
            <FormField key={f.key} label={f.label}>
              <input
                type={f.type}
                value={gustoFields[f.key] || ""}
                onChange={(e) => setGustoFields({ ...gustoFields, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                style={iSt}
              />
            </FormField>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button onClick={() => setGustoOpen(false)} style={{ padding: "10px 20px", borderRadius: T.radiusSm, border: `1px solid ${T.lightLine}`, background: T.white, fontSize: "13px", cursor: "pointer" }}>
            Cancel
          </button>
          <Btn onClick={saveGusto}>Save Information</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  TRAINEE: DASHBOARD
// ════════════════════════════════════════════
const TraineeDash = ({ user }) => {
  const { schedule, residents, setResidents, messages, masterProgram, showToast } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const { total, done, pct } = getProgress(me, masterProgram);
  const myEvents = schedule.filter((e) => e.assignTo === "all" || e.assignTo === me.id);
  const today = myEvents.filter((e) => e.date === "2026-03-05");
  const upcoming = myEvents.filter((e) => e.date > "2026-03-05").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const unread = messages.filter((m) => m.to === user.id && !m.read).length;
  const cats = getTraineeCats(me, masterProgram);
  const skillSessions = myEvents.filter((e) => e.type === "skill" && e.skillId);

  // Count unread feedback (educator comments where the last comment is from educator = awaiting reply)
  const unreadFeedback = cats.flatMap((cat) =>
    cat.skills.flatMap((sk) => {
      const logs = me.timingLogs?.[sk.id] || [];
      return logs.filter((log) => {
        const c = log.comments || [];
        return c.length > 0 && c[c.length - 1]?.from === "educator";
      });
    })
  ).length;

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
          { l: "Unread Feedback", v: unreadFeedback, s: "Awaiting your reply", a: T.educator },
          { l: "Unread Messages", v: unread, s: "From your educator", a: T.warn },
        ].map((s, i) => (
          <Card key={i} className={`fade-up st${i + 1}`} style={{ padding: 22 }}>
            <p style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 8 }}>{s.l}</p>
            <p style={{ fontFamily: T.fontD, fontSize: "36px", fontWeight: 600, color: s.a, lineHeight: 1 }}>{s.v}</p>
            <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 4 }}>{s.s}</p>
          </Card>
        ))}
      </div>

      {/* Current Focus */}
      {(() => {
        const allSkills = cats.flatMap((c) => c.skills);
        const focus = allSkills
          .filter((sk) => { const p = getSkillPct(me, sk.id, masterProgram); return p > 0 && p < 100; })
          .sort((a, b) => getSkillPct(me, b.id, masterProgram) - getSkillPct(me, a.id, masterProgram))
          .slice(0, 2);
        if (focus.length === 0) return null;
        return (
          <Card style={{ padding: 22, marginBottom: 16 }}>
            <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 14 }}>Current Focus</h3>
            <div className="r-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${focus.length}, 1fr)`, gap: 14 }}>
              {focus.map((sk) => {
                const skPct = getSkillPct(me, sk.id, masterProgram);
                const sp = getSkillProgress(me, sk.id);
                const cat = cats.find((c) => c.skills.some((s) => s.id === sk.id));
                const cc = cat?.color || T.gold;
                const logs = me.timingLogs?.[sk.id] || [];
                const totalMin = logs.reduce((a, l) => a + (l.minutes || 0), 0);
                return (
                  <div key={sk.id} style={{ padding: 16, borderRadius: T.radiusSm, background: T.cream, borderLeft: `4px solid ${cc}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 600 }}>{sk.name}</p>
                        {cat && <p style={{ fontSize: "11px", color: cc, marginTop: 2 }}>{cat.name}</p>}
                      </div>
                      <span style={{ fontFamily: T.fontD, fontSize: "20px", fontWeight: 700, color: cc }}>{skPct}%</span>
                    </div>
                    <ProgressBar value={skPct} color={cc} />
                    {sk.type === "service" && (
                      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                        {[
                          { label: "Technique", stage: sp.technique, stages: TECHNIQUE_STAGES, colors: TECHNIQUE_COLORS },
                          { label: "Timing", stage: sp.timing, stages: TIMING_STAGES, colors: TIMING_COLORS },
                        ].map((track) => (
                          <div key={track.label} style={{ flex: 1, padding: "10px 12px", borderRadius: T.radiusSm, background: T.white, border: `1px solid ${T.lightLine}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted }}>{track.label}</span>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: track.colors[track.stage] }}>{track.stages[track.stage]}</span>
                            </div>
                            {/* Step dots */}
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              {track.stages.map((_, si) => (
                                <div key={si} style={{ flex: 1, height: 4, borderRadius: 2, background: si <= track.stage ? track.colors[track.stage] : T.lightLine, transition: "background .2s" }} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: "11px", color: T.textMuted }}>
                      <span>{logs.length} sessions logged</span>
                      <span>{totalMin} min total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

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
                  <div style={{ width: 4, height: 36, borderRadius: 2, background: getEvColor(ev, masterProgram) }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.time}</p>
                      {ev.skillId && <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: T.goldMuted, color: T.gold }}>SKILL</span>}
                    </div>
                  </div>
                  <Badge color={getEvColor(ev, masterProgram)}>{ev.type}</Badge>
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
                    <div style={{ width: 3, height: 24, borderRadius: 2, background: getEvColor(ev, masterProgram) }} />
                    <span style={{ fontWeight: 500, flex: 1 }}>{ev.title}</span>
                    <span style={{ color: T.textMuted, fontSize: "10px" }}>{ev.date.slice(5)} · {ev.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Feedback */}
        {(() => {
          const recentFeedback = cats.flatMap((cat) =>
            cat.skills.flatMap((sk) => {
              const logs = me.timingLogs?.[sk.id] || [];
              return logs.map((log, idx) => (log.comments || []).length > 0 ? { skill: sk, cat, log, idx, skillId: sk.id } : null).filter(Boolean);
            })
          ).sort((a, b) => {
            const aLast = a.log.comments[a.log.comments.length - 1]?.ts || a.log.date;
            const bLast = b.log.comments[b.log.comments.length - 1]?.ts || b.log.date;
            return bLast.localeCompare(aLast);
          }).slice(0, 5);
          return (
            <Card style={{ padding: 24 }}>
              <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="message" size={18} color={T.gold} /> Feedback
              </h3>
              {recentFeedback.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: "13px" }}>No feedback yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {recentFeedback.map((fb, i) => {
                    const cc = fb.cat.color || T.gold;
                    const comments = fb.log.comments || [];
                    const lastEducator = [...comments].reverse().find((c) => c.from === "educator");
                    const needsReply = lastEducator && comments[comments.length - 1]?.from === "educator";
                    return (
                      <div key={i} style={{ borderRadius: T.radiusSm, border: `1px solid ${cc}25`, overflow: "hidden" }}>
                        <div style={{ padding: "8px 14px", background: `${cc}10`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cc }} />
                            <span style={{ fontSize: "12px", fontWeight: 600, color: cc }}>{fb.skill.name}</span>
                            <span style={{ fontSize: "10px", color: T.textMuted }}>{fb.log.minutes}min {fb.log.type} · {fb.log.date}</span>
                          </div>
                          {needsReply && <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: `${T.gold}20`, color: T.gold }}>REPLY</span>}
                        </div>
                        {fb.log.note && (
                          <div style={{ padding: "8px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <Avatar name={me.name} size={22} photo={me.photo} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted }}>You</span>
                              <p style={{ fontSize: "12px", lineHeight: 1.5, marginTop: 2 }}>{fb.log.note}</p>
                            </div>
                          </div>
                        )}
                        {comments.map((c, j) => (
                          <div key={j} style={{ padding: "8px 14px", background: c.from === "educator" ? `${T.educator}06` : "transparent", display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: c.from === "educator" ? T.educator : T.goldLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: "9px", fontWeight: 700, color: c.from === "educator" ? T.white : T.charcoal }}>{c.name?.[0] || "?"}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: "10px", fontWeight: 600, color: c.from === "educator" ? T.educator : T.textMuted }}>{c.name || (c.from === "educator" ? "Educator" : "You")}</span>
                                <span style={{ fontSize: "9px", color: T.textMuted }}>{new Date(c.ts).toLocaleDateString()}</span>
                              </div>
                              <p style={{ fontSize: "12px", lineHeight: 1.5, marginTop: 2 }}>{c.text}</p>
                            </div>
                          </div>
                        ))}
                        <ReplyInput skillId={fb.skillId} logIdx={fb.idx} me={me} setResidents={setResidents} showToast={showToast} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })()}
      </div>

      {/* Skill Progress — full width */}
      <Card style={{ padding: 24, marginTop: 16 }}>
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

const MonthGrid = ({ cal, schedule, onDayClick, gcalEvents = [], masterProgram = [] }) => {
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
                      background: getEvColor(ev, masterProgram) + "20", color: getEvColor(ev, masterProgram),
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

const DayEventList = ({ date, schedule, gcalEvents = [], masterProgram = [] }) => {
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
                <div style={{ width: 4, height: 36, borderRadius: 2, background: getEvColor(ev, masterProgram) }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>{ev.title}</p>
                  <p style={{ fontSize: "12px", color: T.textMuted }}>{ev.time}</p>
                </div>
                <Badge color={getEvColor(ev, masterProgram)}>{ev.type}</Badge>
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
  const { schedule, gcalEvents, residents, masterProgram } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const mySchedule = schedule.filter((e) => e.assignTo === "all" || e.assignTo === me.id);
  const cal = useCalendar(2026, 2);

  return (
    <div className="fade-up">
      <SectionTitle sub="Your personal training calendar">Schedule</SectionTitle>
      <Card style={{ padding: 24 }}>
        <CalendarHeader cal={cal} />
        <MonthGrid cal={cal} schedule={mySchedule} gcalEvents={gcalEvents} onDayClick={(d) => cal.setSelectedDate(d)} masterProgram={masterProgram} />
      </Card>
      <DayEventList date={cal.selectedDate} schedule={mySchedule} gcalEvents={gcalEvents} masterProgram={masterProgram} />
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

const SkillCard = ({ skill, trainee, masterProgram, onAddLog, onDeleteLog, onEditLog, onPlayVideo, onReply, timingLogs, role = "resident" }) => {
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
      {/* Video Lessons — all skill types */}
      {(skill.videos || []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {skill.videos.map((v) => (
            <button key={v.id} onClick={() => onPlayVideo && onPlayVideo(v)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 4,
              background: "#8B6AAE10", fontSize: "10px", color: "#8B6AAE", fontWeight: 500,
              border: "none", cursor: "pointer",
            }}>
              <Icon name="play" size={11} color="#8B6AAE" />
              {v.title}
              <span style={{ color: T.textMuted, fontSize: "9px" }}>{v.duration}</span>
            </button>
          ))}
        </div>
      )}
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
                  <span style={{ fontSize: "8px", marginLeft: 2, transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "none" }}>▲</span>
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
                      {/* Conversation thread */}
                      {(log.comments || []).length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                          {log.comments.map((c, ci) => (
                            <div key={ci} style={{
                              padding: "5px 10px",
                              background: c.from === "educator" ? T.educatorLight : `${T.gold}08`,
                              borderLeft: `3px solid ${c.from === "educator" ? T.educator : T.goldLight}`,
                              fontSize: "11px", display: "flex", gap: 6, alignItems: "flex-start",
                            }}>
                              <span style={{ fontSize: "8px", fontWeight: 700, marginTop: 2, flexShrink: 0, color: c.from === "educator" ? T.educator : T.gold }}>
                                {c.name || (c.from === "educator" ? "EDUCATOR" : "YOU")}
                              </span>
                              <span style={{ color: T.charcoal, fontWeight: 400, lineHeight: 1.4, flex: 1 }}>{c.text}</span>
                              <span style={{ fontSize: "8px", color: T.textMuted, flexShrink: 0 }}>{c.ts ? new Date(c.ts).toLocaleDateString() : ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Inline reply for resident */}
                      {role === "resident" && onReply && (log.comments || []).length > 0 && (
                        <InlineReply onSend={(text) => onReply(skill.id, origIdx, text)} />
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
  const { residents, setResidents, masterProgram, notifications, setNotifications, showToast } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const cats = getTraineeCats(me, masterProgram);
  const { total, done, pct } = getProgress(me, masterProgram);
  const [logModal, setLogModal] = useState(false);
  const [logSkill, setLogSkill] = useState(null);
  const [logMinutes, setLogMinutes] = useState("");
  const [logType, setLogType] = useState("mannequin");
  const [logNote, setLogNote] = useState("");
  const [playingVideo, setPlayingVideo] = useState(null);

  const replyToLog = (skillId, logIdx, text) => {
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const entries = [...(logs[skillId] || [])];
      if (entries[logIdx]) {
        const prev = entries[logIdx].comments || [];
        entries[logIdx] = { ...entries[logIdx], comments: [...prev, { from: "resident", text, ts: new Date().toISOString(), name: me.name?.split(" ")[0] }] };
      }
      logs[skillId] = entries;
      return { ...r, timingLogs: logs };
    }));
    showToast("Reply sent");
  };

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
    const newLogIdx = ((me.timingLogs || {})[logSkill.id] || []).length;
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const existing = logs[logSkill.id] || [];
      logs[logSkill.id] = [...existing, {
        minutes: mins,
        type: logType,
        date: new Date().toISOString().split("T")[0],
        note: logNote.trim(),
        comments: [],
      }];
      return { ...r, timingLogs: logs };
    }));
    setNotifications((p) => [...p, {
      id: `n_${uid()}`, type: "practice", residentId: me.id, skillId: logSkill.id,
      logIdx: newLogIdx, read: false, reviewed: false, ts: new Date().toISOString(),
    }]);
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
        const adminFocus = (me.focusSkills || []).length > 0;
        const inProgress = adminFocus
          ? (me.focusSkills || []).map((fid) => allSkills.find((s) => s.id === fid)).filter(Boolean)
          : allSkills
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
        const focusSkills = adminFocus ? inProgress : (inProgress.length > 0 ? inProgress : allSkills
          .filter((s) => s.type === "service" && !isSkillComplete(me, s.id, masterProgram))
          .slice(0, 2));

        return (
        <>
          {/* Overall progress */}
          <Card style={{ padding: "16px 20px", marginBottom: 24 }}>
            <div className="skills-progress-row" style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: `conic-gradient(${T.gold} ${pct * 3.6}deg, ${T.creamDark} 0deg)`,
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
              <div style={{ display: "flex", gap: 16 }}>
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
          </Card>

          {/* Currently Working On */}
          {focusSkills.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: T.gold, marginBottom: 12 }}>{adminFocus ? "Assigned Focus" : "Currently Working On"}</p>
              <div className="skill-focus-grid" style={{ display: "grid", gridTemplateColumns: focusSkills.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
                {focusSkills.map((sk) => {
                  const skPct = getSkillPct(me, sk.id, masterProgram);
                  const sp = getSkillProgress(me, sk.id);
                  const cc = sk.catColor || T.gold;
                  const logs = (me.timingLogs || {})[sk.id] || [];
                  const totalMin = logs.reduce((a, l) => a + (l.minutes || 0), 0);
                  const techLabel = TECHNIQUE_STAGES[sp.technique];
                  const timeLabel = TIMING_STAGES[sp.timing];
                  return (
                    <Card key={sk.id} style={{ padding: 0, overflow: "hidden", borderLeft: `4px solid ${cc}` }}>
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <p style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 2 }}>{sk.name}</p>
                            <p style={{ fontSize: "11px", color: cc }}>{sk.catName}</p>
                          </div>
                          <span style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 700, color: cc }}>{skPct}%</span>
                        </div>
                        <ProgressBar value={skPct} height={6} color={cc} />

                        {/* Stage indicators */}
                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: T.radiusSm, background: T.cream }}>
                            <p style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: T.textMuted, marginBottom: 4 }}>Technique</p>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: TECHNIQUE_COLORS[sp.technique] }}>{techLabel}</p>
                            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                              {TECHNIQUE_STAGES.map((_, si) => (
                                <div key={si} style={{ flex: 1, height: 3, borderRadius: 2, background: si <= sp.technique ? TECHNIQUE_COLORS[sp.technique] : T.lightLine }} />
                              ))}
                            </div>
                          </div>
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: T.radiusSm, background: T.cream }}>
                            <p style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: T.textMuted, marginBottom: 4 }}>Timing</p>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: TIMING_COLORS[sp.timing] }}>{timeLabel}</p>
                            <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                              {TIMING_STAGES.map((_, si) => (
                                <div key={si} style={{ flex: 1, height: 3, borderRadius: 2, background: si <= sp.timing ? TIMING_COLORS[sp.timing] : T.lightLine }} />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Quick stats + action */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                          <span style={{ fontSize: "11px", color: T.textMuted }}>{logs.length} sessions · {totalMin} min</span>
                          <button onClick={() => openAddLog(sk)} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "6px 14px", fontSize: "12px", fontWeight: 600,
                            background: cc, color: T.white, border: "none",
                            borderRadius: T.radiusSm, cursor: "pointer",
                          }}>
                            <Icon name="plus" size={12} color={T.white} /> Log Time
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Categories */}
          <p style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: T.textMuted, marginBottom: 12 }}>All Categories</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cats.map((cat) => {
              const catDone = cat.skills.filter((s) => isSkillComplete(me, s.id, masterProgram)).length;
              const catPct = Math.round(cat.skills.reduce((a, s) => a + getSkillPct(me, s.id, masterProgram), 0) / cat.skills.length);
              const cc = cat.color || T.gold;
              return (
                <Card key={cat.id} style={{ overflow: "hidden", borderLeft: `4px solid ${cc}` }}>
                  <details>
                    <summary style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", cursor: "pointer", listStyle: "none" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <h3 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600 }}>{cat.name}</h3>
                          <Badge color={catDone === cat.skills.length ? T.success : cc}>{catDone}/{cat.skills.length}</Badge>
                        </div>
                        <ProgressBar value={catPct} height={4} color={cc} />
                      </div>
                      <span className="arrow-down" style={{ fontSize: "11px", color: T.textMuted, transition: "transform .2s" }}>▲</span>
                    </summary>
                    <div style={{ padding: "0 16px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {cat.skills.map((sk) => {
                          const sp = getSkillProgress(me, sk.id);
                          const skPct = getSkillPct(me, sk.id, masterProgram);
                          const isService = sk.type === "service";
                          const complete = isService ? sp.technique >= 3 && sp.timing >= 3 : sp.done;
                          const logs = (me.timingLogs || {})[sk.id] || [];
                          const hasComments = logs.some((l) => (l.comments || []).length > 0);
                          return (
                            <details key={sk.id}>
                              <summary style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                                background: complete ? `${T.success}08` : T.cream,
                                border: `1px solid ${complete ? T.success + "25" : T.lightLine}`,
                                borderRadius: T.radiusSm, cursor: "pointer", listStyle: "none",
                              }}>
                                {/* Status dot */}
                                <div style={{
                                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                                  background: complete ? T.success : skPct > 0 ? cc : T.lightLine,
                                }} />
                                {/* Name + type */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: "14px", fontWeight: 600 }}>{sk.name}</p>
                                  {isService && !complete && (
                                    <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>
                                      {TECHNIQUE_STAGES[sp.technique]} · {TIMING_STAGES[sp.timing]}
                                    </p>
                                  )}
                                  {complete && <p style={{ fontSize: "11px", color: T.success, fontWeight: 500, marginTop: 2 }}>Complete</p>}
                                  {!isService && !complete && <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>Knowledge</p>}
                                </div>
                                {/* Right side */}
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                  {hasComments && <Icon name="message" size={12} color={T.gold} />}
                                  {logs.length > 0 && <span style={{ fontSize: "10px", color: T.textMuted }}>{logs.length} logs</span>}
                                  {!complete && skPct > 0 && <span style={{ fontSize: "13px", fontWeight: 700, color: cc }}>{skPct}%</span>}
                                </div>
                              </summary>
                              {/* Expanded detail */}
                              <div style={{ padding: "12px 14px", borderLeft: `3px solid ${cc}`, marginLeft: 5, marginTop: 4 }}>
                                {isService && (
                                  <>
                                    {/* Stage progress */}
                                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                      <div style={{ flex: 1, padding: "8px 10px", borderRadius: T.radiusSm, background: T.white, border: `1px solid ${T.lightLine}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                          <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: T.textMuted }}>Technique</span>
                                          <span style={{ fontSize: "12px", fontWeight: 700, color: TECHNIQUE_COLORS[sp.technique] }}>{TECHNIQUE_STAGES[sp.technique]}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 3 }}>
                                          {TECHNIQUE_STAGES.map((_, si) => (
                                            <div key={si} style={{ flex: 1, height: 4, borderRadius: 2, background: si <= sp.technique ? TECHNIQUE_COLORS[sp.technique] : T.lightLine }} />
                                          ))}
                                        </div>
                                      </div>
                                      <div style={{ flex: 1, padding: "8px 10px", borderRadius: T.radiusSm, background: T.white, border: `1px solid ${T.lightLine}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                          <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: T.textMuted }}>Timing</span>
                                          <span style={{ fontSize: "12px", fontWeight: 700, color: TIMING_COLORS[sp.timing] }}>{TIMING_STAGES[sp.timing]}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 3 }}>
                                          {TIMING_STAGES.map((_, si) => (
                                            <div key={si} style={{ flex: 1, height: 4, borderRadius: 2, background: si <= sp.timing ? TIMING_COLORS[sp.timing] : T.lightLine }} />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Target times */}
                                    {sk.targetMin && (
                                      <p style={{ fontSize: "11px", color: T.textMuted, marginBottom: 10 }}>
                                        Goal: <strong>{sk.targetMin}min</strong> · Max: <strong>{sk.maxMin}min</strong>
                                      </p>
                                    )}
                                    {/* Videos */}
                                    {sk.videos && sk.videos.length > 0 && (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                        {sk.videos.map((v) => (
                                          <button key={v.id} onClick={() => setPlayingVideo(v)} style={{
                                            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                                            borderRadius: T.radiusSm, background: "#8B6AAE10", fontSize: "12px", color: "#8B6AAE",
                                            fontWeight: 500, border: "none", cursor: "pointer",
                                          }}>
                                            <Icon name="play" size={12} color="#8B6AAE" /> {v.title}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    {/* Practice logs */}
                                    {logs.length > 0 && (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                                        <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px", color: T.textMuted }}>Practice Log ({logs.length})</p>
                                        {[...logs].reverse().slice(0, 3).map((log, li) => {
                                          const idx = logs.length - 1 - li;
                                          const comments = log.comments || [];
                                          return (
                                            <div key={idx} style={{ padding: "8px 10px", background: T.white, borderRadius: T.radiusSm, border: `1px solid ${T.lightLine}` }}>
                                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: log.note || comments.length > 0 ? 6 : 0 }}>
                                                <span style={{ fontSize: "13px", fontWeight: 600 }}>{log.minutes}min</span>
                                                <Badge color={log.type === "model" ? T.success : "#8B6AAE"}>{log.type}</Badge>
                                                <span style={{ fontSize: "11px", color: T.textMuted, marginLeft: "auto" }}>{log.date}</span>
                                              </div>
                                              {log.note && <p style={{ fontSize: "12px", color: T.textMuted }}>{log.note}</p>}
                                              {comments.length > 0 && (
                                                <div style={{ marginTop: 4, padding: "6px 8px", background: T.cream, borderRadius: T.radiusSm }}>
                                                  {comments.slice(-2).map((c, ci) => (
                                                    <p key={ci} style={{ fontSize: "11px", marginBottom: 2 }}>
                                                      <span style={{ fontWeight: 600, color: c.from === "educator" ? T.educator : T.textMuted }}>{c.name}: </span>
                                                      {c.text}
                                                    </p>
                                                  ))}
                                                  {comments.length > 2 && <p style={{ fontSize: "9px", color: T.textMuted }}>+{comments.length - 2} more</p>}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                        {logs.length > 3 && <p style={{ fontSize: "10px", color: T.textMuted, textAlign: "center" }}>+{logs.length - 3} older entries</p>}
                                      </div>
                                    )}
                                    {/* Log button */}
                                    <button onClick={() => openAddLog(sk)} style={{
                                      width: "100%", padding: "10px 0", fontSize: "13px", fontWeight: 600,
                                      background: cc, color: T.white, border: "none",
                                      borderRadius: T.radiusSm, cursor: "pointer",
                                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    }}>
                                      <Icon name="plus" size={14} color={T.white} /> Log Practice
                                    </button>
                                  </>
                                )}
                              </div>
                            </details>
                          );
                        })}
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
                <span style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted, pointerEvents: "none" }}>min</span>
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
  const { user, docs, setDocs } = useData();
  const [f, setF] = useState("All");
  const [viewDoc, setViewDoc] = useState(null);

  // Refresh docs on mount
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("documents").select("*").eq("uploaded_by", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setDocs(data);
    });
  }, []);
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

  const partner = user.role === "admin" ? "Cheyenne Rollins" : "Flowe Educator";

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
const AdminDash = ({ onNav }) => {
  const { schedule, setSchedule, residents, setResidents, masterProgram, messages, showToast, notifications, setNotifications } = useData();
  const [pendingAgreements, setPendingAgreements] = useState([]);
  const [noteModal, setNoteModal] = useState(false);
  const [noteTarget, setNoteTarget] = useState(null); // { residentId, skillId? }
  const [noteText, setNoteText] = useState("");
  const [reviewModal, setReviewModal] = useState(null); // notification object
  const [reviewText, setReviewText] = useState("");
  const [advanceTech, setAdvanceTech] = useState(false);
  const [advanceTiming, setAdvanceTiming] = useState(false);
  const [expandedTrainee, setExpandedTrainee] = useState(null);

  // Fetch agreements pending countersign from Supabase
  const loadPending = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, agreement_signed, agreement_date, agreement_countersigned")
      .eq("role", "resident")
      .eq("agreement_signed", true)
      .or("agreement_countersigned.is.null,agreement_countersigned.eq.false");
    setPendingAgreements(data || []);
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  // Re-fetch when window regains focus (e.g. after countersign)
  useEffect(() => {
    const onFocus = () => loadPending();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadPending]);

  const today = "2026-03-05";
  const todayEvents = schedule.filter((e) => e.date === today).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const upcomingEvents = schedule.filter((e) => e.date > today).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")).slice(0, 6);

  // All focus skills across all trainees
  const allFocus = residents.flatMap((r) => {
    const fs = r.focusSkills || [];
    return fs.map((sid) => {
      const cat = masterProgram.find((c) => c.skills.some((s) => s.id === sid));
      const sk = cat ? cat.skills.find((s) => s.id === sid) : null;
      const p = getSkillProgress(r, sid);
      return sk ? { resident: r, skill: sk, cat, progress: p } : null;
    }).filter(Boolean);
  });

  // Trainees needing attention: low progress or stalled
  const traineeStatus = residents.map((r) => {
    const { pct, done, total } = getProgress(r, masterProgram);
    const cats = getTraineeCats(r, masterProgram);
    const inProgress = cats.flatMap((c) => c.skills.filter((s) => {
      const p = getSkillProgress(r, s.id);
      return s.type === "service" ? (p.technique > 0 || p.timing > 0) && !(p.technique >= 3 && p.timing >= 3) : false;
    }));
    const tuition = r.tuition || { total: 0, payments: [] };
    const paid = tuition.payments.reduce((a, p) => a + p.amount, 0);
    return { ...r, pct, done, total, inProgress, tuitionPaid: paid, tuitionTotal: tuition.total };
  });

  const getAssignLabel = (ev) => {
    if (ev.assignTo === "all") return "All";
    const r = residents.find((x) => x.id === ev.assignTo);
    return r ? r.name.split(" ")[0] : "";
  };

  const openNote = (residentId, skillId) => {
    setNoteTarget({ residentId, skillId });
    setNoteText("");
    setNoteModal(true);
  };

  const saveNote = () => {
    if (!noteText.trim() || !noteTarget) return;
    // Add as a timing log critique / general note
    if (noteTarget.skillId) {
      setResidents((p) => p.map((x) => {
        if (x.id !== noteTarget.residentId) return x;
        const logs = { ...(x.timingLogs || {}) };
        const existing = [...(logs[noteTarget.skillId] || [])];
        existing.push({ minutes: 0, type: "mannequin", date: today, note: "", comments: [{ from: "educator", text: noteText.trim(), ts: new Date().toISOString(), name: "Admin" }] });
        logs[noteTarget.skillId] = existing;
        return { ...x, timingLogs: logs };
      }));
    }
    showToast("Note saved");
    setNoteModal(false);
  };

  // Pending reviews from notifications
  const pendingReviews = (notifications || [])
    .filter((n) => !n.reviewed)
    .sort((a, b) => b.ts.localeCompare(a.ts));

  const openReview = (notif) => {
    setReviewModal(notif);
    setReviewText("");
    setAdvanceTech(false);
    setAdvanceTiming(false);
    // Mark as read
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
  };

  const submitReview = () => {
    if (!reviewModal) return;
    const { residentId, skillId, logIdx } = reviewModal;
    // Add comment to the log entry
    setResidents((prev) => prev.map((r) => {
      if (r.id !== residentId) return r;
      const logs = { ...(r.timingLogs || {}) };
      const entries = [...(logs[skillId] || [])];
      if (entries[logIdx] !== undefined) {
        const prevComments = entries[logIdx].comments || [];
        const newComment = reviewText.trim() ? { from: "educator", text: reviewText.trim(), ts: new Date().toISOString(), name: "Admin" } : null;
        entries[logIdx] = { ...entries[logIdx], comments: newComment ? [...prevComments, newComment] : prevComments };
      }
      logs[skillId] = entries;

      // Optionally advance stages
      let prog = { ...(r.progress || {}) };
      const cur = prog[skillId] || { technique: 0, timing: 0 };
      if (advanceTech && cur.technique < 3) cur.technique++;
      if (advanceTiming && cur.timing < 3) cur.timing++;
      prog[skillId] = cur;

      return { ...r, timingLogs: logs, progress: prog };
    }));
    // Mark notification as reviewed
    setNotifications((prev) => prev.map((n) => n.id === reviewModal.id ? { ...n, reviewed: true } : n));
    showToast("Review submitted");
    setReviewModal(null);
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: T.fontD, fontSize: "34px", fontWeight: 600, marginBottom: 4 }}>Educator Dashboard</h1>
        <p style={{ color: T.textMuted, fontSize: "14px" }}>Command center — focus, schedule, feedback.</p>
      </div>

      {/* Top stats row */}
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {traineeStatus.map((r) => {
          const focusCount = (r.focusSkills || []).length;
          const isExpanded = expandedTrainee === r.id;
          const pColor = r.pct >= 80 ? T.success : r.pct >= 40 ? T.gold : T.warn;
          return (
            <Card key={r.id} style={{ padding: 18, cursor: "pointer", border: isExpanded ? `1.5px solid ${T.gold}` : undefined, transition: "border .2s" }} onClick={() => setExpandedTrainee(isExpanded ? null : r.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Avatar name={r.name} size={32} photo={r.photo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
                  <p style={{ fontSize: "10px", color: T.textMuted }}>{r.done}/{r.total} skills</p>
                </div>
                <span style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 600, color: pColor }}>{r.pct}%</span>
              </div>
              <ProgressBar value={r.pct} height={5} color={pColor} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                {focusCount > 0 && <Badge color={T.gold}>{focusCount} focus</Badge>}
                {r.inProgress.length > 0 && <span style={{ fontSize: "10px", color: T.textMuted }}>{r.inProgress.length} in progress</span>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Expanded trainee summary */}
      {expandedTrainee && (() => {
        const r = residents.find((x) => x.id === expandedTrainee);
        if (!r) return null;
        const cats = getTraineeCats(r, masterProgram);
        const focusSkills = r.focusSkills || [];
        const { pct, done, total } = getProgress(r, masterProgram);
        // Recent practice logs across all skills
        const recentLogs = cats.flatMap((cat) =>
          cat.skills.flatMap((sk) => {
            const logs = r.timingLogs?.[sk.id] || [];
            return logs.map((log, idx) => ({ skill: sk, cat, log, idx }));
          })
        ).sort((a, b) => (b.log.date || "").localeCompare(a.log.date || "")).slice(0, 4);

        return (
          <Card className="fade-up" style={{ padding: 22, marginBottom: 24 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <Avatar name={r.name} size={48} photo={r.photo} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 600 }}>{r.name}</h3>
                <p style={{ fontSize: "12px", color: T.textMuted }}>{r.cohort} · {r.email}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onNav("trainee:" + r.id); }}
                style={{ background: T.goldMuted, border: "none", borderRadius: T.radiusSm, padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="eye" size={14} color={T.gold} /> Full Profile
              </button>
              <button onClick={() => setExpandedTrainee(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={18} color={T.textMuted} />
              </button>
            </div>

            <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {/* Category progress */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 10 }}>Category Progress</p>
                {cats.length === 0 ? (
                  <p style={{ fontSize: "12px", color: T.textMuted }}>No tracks assigned</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {cats.map((cat) => {
                      const catDone = cat.skills.filter((s) => isSkillComplete(r, s.id, masterProgram)).length;
                      const catPct = Math.round(cat.skills.reduce((a, s) => a + getSkillPct(r, s.id, masterProgram), 0) / cat.skills.length);
                      const cc = cat.color || T.gold;
                      return (
                        <div key={cat.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: "12px", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cc, display: "inline-block" }} />
                              {cat.name}
                            </span>
                            <span style={{ fontSize: "10px", color: T.textMuted }}>{catDone}/{cat.skills.length}</span>
                          </div>
                          <ProgressBar value={catPct} height={4} color={cc} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Focus skills */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 10 }}>Focus Skills</p>
                {focusSkills.length === 0 ? (
                  <p style={{ fontSize: "12px", color: T.textMuted }}>No skills pinned</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {focusSkills.map((sid) => {
                      const cat = masterProgram.find((c) => c.skills.some((s) => s.id === sid));
                      const sk = cat ? cat.skills.find((s) => s.id === sid) : null;
                      if (!sk) return null;
                      const cc = cat.color || T.gold;
                      const p = getSkillProgress(r, sid);
                      return (
                        <div key={sid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: T.radiusSm, background: `${cc}08`, borderLeft: `2px solid ${cc}` }}>
                          <Icon name="brain" size={10} color={T.gold} />
                          <span style={{ fontSize: "11px", fontWeight: 500, flex: 1 }}>{sk.name}</span>
                          <span style={{ fontSize: "9px", color: T.textMuted }}>{TECHNIQUE_STAGES[p.technique]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 10 }}>Recent Practice</p>
                {recentLogs.length === 0 ? (
                  <p style={{ fontSize: "12px", color: T.textMuted }}>No practice logged yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {recentLogs.map((entry, i) => {
                      const cc = entry.cat.color || T.gold;
                      const hasReview = (entry.log.comments || []).length > 0;
                      return (
                        <div key={i} onClick={(e) => {
                          e.stopPropagation();
                          openReview({ id: `inline-${r.id}-${entry.skill.id}-${entry.idx}`, residentId: r.id, skillId: entry.skill.id, logIdx: entry.idx, ts: entry.log.date });
                        }} style={{ fontSize: "11px", padding: "5px 8px", borderRadius: T.radiusSm, background: T.cream, cursor: "pointer", transition: "background .15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = `${cc}12`}
                          onMouseLeave={(e) => e.currentTarget.style.background = T.cream}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 500, color: cc }}>{entry.skill.name}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ color: T.textMuted, fontSize: "10px" }}>{entry.log.date?.slice(5)}</span>
                              <Icon name="message" size={10} color={hasReview ? T.success : T.warn} />
                            </div>
                          </div>
                          <span style={{ color: T.textMuted }}>{entry.log.minutes}min · {entry.log.type}</span>
                          {hasReview && <span style={{ color: T.success, marginLeft: 6 }}>reviewed</span>}
                          {!hasReview && <span style={{ color: T.warn, marginLeft: 6 }}>give feedback</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); openNote(r.id, null); }}
                  style={{ marginTop: 10, width: "100%", background: T.goldMuted, border: "none", borderRadius: T.radiusSm, padding: "7px 0", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                >
                  <Icon name="message" size={12} color={T.gold} /> Quick Feedback
                </button>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Pending Agreement Countersigns */}
      {pendingAgreements.length > 0 && (
        <Card style={{ padding: 22, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="clipboard" size={18} color={T.warn} /> Pending Countersigns
            </h3>
            <Badge color={T.warn}>{pendingAgreements.length}</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingAgreements.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: T.radiusSm, background: T.cream, border: `1px solid ${T.creamDark}` }}>
                <Avatar name={r.name} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500 }}>{r.name}</p>
                  <p style={{ fontSize: "11px", color: T.textMuted }}>Signed {r.agreement_date || "recently"}</p>
                </div>
                <button
                  onClick={() => onNav("a-countersign:" + r.id)}
                  style={{ background: T.gold, color: T.white, border: "none", borderRadius: T.radiusSm, padding: "7px 16px", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="shield" size={12} color={T.white} /> Countersign
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main grid: Focus + Schedule side by side */}
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24, alignItems: "start" }}>
        {/* Current Focus — all trainees */}
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="brain" size={18} color={T.gold} /> Active Focus
            </h3>
            <Badge color={T.gold}>{allFocus.length} skills</Badge>
          </div>
          {allFocus.length === 0 ? (
            <p style={{ fontSize: "12px", color: T.textMuted, padding: "16px 0" }}>No focus skills pinned for any trainee. Pin them from trainee profiles.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {residents.filter((r) => (r.focusSkills || []).length > 0).map((r) => {
                const fs = r.focusSkills || [];
                return (
                  <div key={r.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Avatar name={r.name} size={22} photo={r.photo} />
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>{r.name}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 30 }}>
                      {fs.map((sid) => {
                        const cat = masterProgram.find((c) => c.skills.some((s) => s.id === sid));
                        const sk = cat ? cat.skills.find((s) => s.id === sid) : null;
                        if (!sk) return null;
                        const cc = cat.color || T.gold;
                        const p = getSkillProgress(r, sid);
                        const stageName = TECHNIQUE_STAGES[p.technique] || "Not Started";
                        return (
                          <div key={sid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: T.radiusSm, background: `${cc}08`, borderLeft: `3px solid ${cc}` }}>
                            <span style={{ flex: 1, fontSize: "12px", fontWeight: 500 }}>{sk.name}</span>
                            <span style={{ fontSize: "10px", color: T.textMuted }}>{stageName}</span>
                            <button onClick={() => openNote(r.id, sid)} title="Add feedback" style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                              <Icon name="message" size={12} color={T.gold} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Today's Schedule */}
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="calendar" size={18} color={T.success} /> Today
            </h3>
            <Badge color={T.success}>{todayEvents.length} events</Badge>
          </div>
          {todayEvents.length === 0 ? (
            <p style={{ fontSize: "12px", color: T.textMuted, padding: "16px 0" }}>No events scheduled for today.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todayEvents.map((ev) => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: T.radiusSm, background: T.cream }}>
                  <div style={{ width: 3, height: 32, borderRadius: 2, background: getEvColor(ev, masterProgram), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</p>
                    <p style={{ fontSize: "10px", color: T.textMuted }}>{ev.time} · {getAssignLabel(ev)}</p>
                  </div>
                  <Badge color={getEvColor(ev, masterProgram)}>{ev.type}</Badge>
                </div>
              ))}
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <>
              <div style={{ borderTop: `1px solid ${T.lightLine}`, marginTop: 16, paddingTop: 12, marginBottom: 8 }}>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted }}>Upcoming</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {upcomingEvents.map((ev) => (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: T.radiusSm, fontSize: "11px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: getEvColor(ev, masterProgram), flexShrink: 0 }} />
                    <span style={{ color: T.textMuted, minWidth: 60 }}>{ev.date.slice(5)}</span>
                    <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</span>
                    <span style={{ color: T.textMuted }}>{getAssignLabel(ev)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <Card style={{ padding: 22, marginBottom: 24, borderLeft: `3px solid ${T.danger}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="alert" size={18} color={T.danger} /> Pending Reviews
            </h3>
            <Badge color={T.danger}>{pendingReviews.length} awaiting</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pendingReviews.map((notif) => {
              const r = residents.find((x) => x.id === notif.residentId);
              const sk = findSkill(masterProgram, notif.skillId);
              const cat = findSkillCat(masterProgram, notif.skillId);
              const logEntry = r?.timingLogs?.[notif.skillId]?.[notif.logIdx];
              const cc = cat?.color || T.gold;
              return (
                <div key={notif.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  borderRadius: T.radiusSm, background: notif.read ? T.white : `${T.danger}06`,
                  border: `1px solid ${notif.read ? T.lightLine : T.danger + "20"}`,
                  cursor: "pointer",
                }} onClick={() => openReview(notif)}>
                  <Avatar name={r?.name} size={28} photo={r?.photo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: 500 }}>
                      <span style={{ fontWeight: 600 }}>{r?.name?.split(" ")[0]}</span> logged practice
                      {sk && <span style={{ color: cc }}> — {sk.name}</span>}
                    </p>
                    <p style={{ fontSize: "10px", color: T.textMuted }}>
                      {logEntry ? `${logEntry.minutes}min ${logEntry.type}` : ""}
                      {logEntry?.note ? ` · "${logEntry.note}"` : ""}
                      {" · "}{new Date(notif.ts).toLocaleDateString()}
                    </p>
                  </div>
                  {!notif.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.danger, flexShrink: 0 }} />}
                  <Btn variant="gold" style={{ padding: "5px 12px", fontSize: "11px" }}>Review</Btn>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Feedback — across all trainees */}
      {(() => {
        const allThreads = residents.flatMap((r) => {
          const rCats = getTraineeCats(r, masterProgram);
          return rCats.flatMap((cat) =>
            cat.skills.flatMap((sk) => {
              const logs = r.timingLogs?.[sk.id] || [];
              return logs.map((log, idx) => {
                const comments = log.comments || [];
                if (comments.length === 0) return null;
                const lastComment = comments[comments.length - 1];
                const needsEducator = lastComment.from !== "educator";
                return { resident: r, skill: sk, cat, log, idx, skillId: sk.id, comments, lastComment, needsEducator };
              }).filter(Boolean);
            })
          );
        }).sort((a, b) => {
          // Threads needing educator response first, then by recency
          if (a.needsEducator !== b.needsEducator) return a.needsEducator ? -1 : 1;
          return (b.lastComment.ts || b.log.date).localeCompare(a.lastComment.ts || a.log.date);
        }).slice(0, 6);
        return (
          <Card style={{ padding: 22, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="message" size={18} color={T.gold} /> Recent Feedback
              </h3>
              {allThreads.filter((t) => t.needsEducator).length > 0 && (
                <Badge color={T.warn}>{allThreads.filter((t) => t.needsEducator).length} need response</Badge>
              )}
            </div>
            {allThreads.length === 0 ? (
              <p style={{ color: T.textMuted, fontSize: "13px" }}>No feedback threads yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {allThreads.map((t, i) => {
                  const cc = t.cat.color || T.gold;
                  return (
                    <div key={i} style={{ borderRadius: T.radiusSm, border: `1px solid ${t.needsEducator ? T.warn + "40" : cc + "25"}`, overflow: "hidden" }}>
                      {/* Header */}
                      <div style={{ padding: "8px 14px", background: t.needsEducator ? `${T.warn}08` : `${cc}08`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={t.resident.name} size={22} photo={t.resident.photo} />
                          <span style={{ fontSize: "12px", fontWeight: 600 }}>{t.resident.name.split(" ")[0]}</span>
                          <span style={{ fontSize: "11px", color: cc, fontWeight: 500 }}>{t.skill.name}</span>
                          <span style={{ fontSize: "10px", color: T.textMuted }}>{t.log.minutes}min {t.log.type} · {t.log.date}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {t.needsEducator && <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: `${T.warn}20`, color: T.warn }}>NEEDS RESPONSE</span>}
                          <button onClick={() => openReview({ id: `fb-${t.resident.id}-${t.skillId}-${t.idx}`, residentId: t.resident.id, skillId: t.skillId, logIdx: t.idx, ts: t.log.date })} style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "10px", fontWeight: 600, color: T.gold }}>
                            Review
                          </button>
                        </div>
                      </div>
                      {/* Last 2 messages */}
                      {t.comments.slice(-2).map((c, j) => (
                        <div key={j} style={{ padding: "6px 14px", background: c.from === "educator" ? `${T.educator}06` : "transparent", display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: c.from === "educator" ? T.educator : T.goldLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "8px", fontWeight: 700, color: c.from === "educator" ? T.white : T.charcoal }}>{c.name?.[0] || "?"}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: "10px", fontWeight: 600, color: c.from === "educator" ? T.educator : T.textMuted }}>{c.name || c.from}</span>
                            <p style={{ fontSize: "12px", lineHeight: 1.4, marginTop: 1 }}>{c.text}</p>
                          </div>
                        </div>
                      ))}
                      {t.comments.length > 2 && (
                        <p style={{ padding: "2px 14px 6px", fontSize: "10px", color: T.textMuted }}>+{t.comments.length - 2} earlier messages</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })()}

      {/* Trainee Progress + Quick Feedback */}
      <Card style={{ padding: 22 }}>
        <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>Trainee Progress</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {traineeStatus.map((r, i) => {
            const cats = getTraineeCats(r, masterProgram);
            const focusSkills = r.focusSkills || [];
            return (
              <div key={r.id} style={{ padding: "14px 0", borderBottom: i < traineeStatus.length - 1 ? `1px solid ${T.lightLine}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar name={r.name} size={36} photo={r.photo} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 500 }}>{r.name}</p>
                    <p style={{ fontSize: "11px", color: T.textMuted }}>{r.done}/{r.total} skills · {r.cohort}</p>
                  </div>
                  <div style={{ width: 120 }}><ProgressBar value={r.pct} /></div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: T.gold, minWidth: 36, textAlign: "right" }}>{r.pct}%</span>
                  <button onClick={() => openNote(r.id, null)} title="Send feedback" style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "11px", fontWeight: 600, color: T.gold }}>
                    <Icon name="message" size={12} color={T.gold} /> Note
                  </button>
                </div>
                {/* In-progress skills */}
                {r.inProgress.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, marginLeft: 50, flexWrap: "wrap" }}>
                    {r.inProgress.slice(0, 4).map((sk) => {
                      const p = getSkillProgress(r, sk.id);
                      const isFocus = focusSkills.includes(sk.id);
                      const cat = masterProgram.find((c) => c.skills.some((s) => s.id === sk.id));
                      const cc = cat?.color || T.gold;
                      return (
                        <span key={sk.id} onClick={() => openNote(r.id, sk.id)} style={{
                          fontSize: "10px", fontWeight: 500, padding: "3px 8px", borderRadius: 12,
                          background: isFocus ? `${T.gold}18` : `${cc}10`,
                          border: isFocus ? `1.5px solid ${T.gold}40` : `1px solid ${cc}20`,
                          color: isFocus ? T.gold : T.text,
                          display: "flex", alignItems: "center", gap: 4,
                          cursor: "pointer",
                        }}>
                          {isFocus && <Icon name="brain" size={9} color={T.gold} />}
                          {sk.name}
                          <span style={{ color: T.textMuted, fontWeight: 400 }}>{TECHNIQUE_STAGES[p.technique].split(" ").slice(-1)[0]}</span>
                        </span>
                      );
                    })}
                    {r.inProgress.length > 4 && <span style={{ fontSize: "10px", color: T.textMuted, alignSelf: "center" }}>+{r.inProgress.length - 4} more</span>}
                  </div>
                )}
                {/* Recent practice logs for this trainee */}
                {(() => {
                  const allLogs = cats.flatMap((cat) =>
                    cat.skills.flatMap((sk) => {
                      const logs = r.timingLogs?.[sk.id] || [];
                      return logs.map((log, idx) => ({ skill: sk, cat, log, idx }));
                    })
                  ).sort((a, b) => (b.log.date || "").localeCompare(a.log.date || "")).slice(0, 3);
                  if (allLogs.length === 0) return null;
                  return (
                    <div style={{ marginTop: 8, marginLeft: 50, display: "flex", flexDirection: "column", gap: 3 }}>
                      {allLogs.map((entry, j) => {
                        const cc = entry.cat.color || T.gold;
                        const hasReview = (entry.log.comments || []).length > 0;
                        return (
                          <div key={j} onClick={() => openReview({ id: `prog-${r.id}-${entry.skill.id}-${entry.idx}`, residentId: r.id, skillId: entry.skill.id, logIdx: entry.idx, ts: entry.log.date })} style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "4px 8px",
                            borderRadius: T.radiusSm, background: T.cream, cursor: "pointer", fontSize: "10px",
                            transition: "background .15s",
                          }}
                            onMouseEnter={(e) => e.currentTarget.style.background = `${cc}12`}
                            onMouseLeave={(e) => e.currentTarget.style.background = T.cream}
                          >
                            <span style={{ fontWeight: 500, color: cc }}>{entry.skill.name}</span>
                            <span style={{ color: T.textMuted }}>{entry.log.minutes}min · {entry.log.type}</span>
                            <span style={{ color: T.textMuted, marginLeft: "auto" }}>{entry.log.date?.slice(5)}</span>
                            <Icon name="message" size={10} color={hasReview ? T.success : T.warn} />
                            <span style={{ fontSize: "9px", color: hasReview ? T.success : T.warn }}>{hasReview ? "reviewed" : "feedback"}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Note Modal */}
      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Quick Feedback" width={440}>
        {noteTarget && (() => {
          const r = residents.find((x) => x.id === noteTarget.residentId);
          const sk = noteTarget.skillId ? findSkill(masterProgram, noteTarget.skillId) : null;
          return (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "10px 12px", borderRadius: T.radiusSm, background: T.cream }}>
                <Avatar name={r?.name} size={28} photo={r?.photo} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500 }}>{r?.name}</p>
                  {sk && <p style={{ fontSize: "11px", color: T.gold }}>{sk.name}</p>}
                </div>
              </div>
              <FormField label="Note / Feedback">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={sk ? `Feedback on ${sk.name}...` : `General note for ${r?.name?.split(" ")[0]}...`}
                  rows={4}
                  style={{ ...iSt, resize: "vertical" }}
                />
              </FormField>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <Btn variant="outline" onClick={() => setNoteModal(false)}>Cancel</Btn>
                <Btn onClick={saveNote} disabled={!noteText.trim()}>Save Note</Btn>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Review Practice Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Review Practice Log" width={480}>
        {reviewModal && (() => {
          const r = residents.find((x) => x.id === reviewModal.residentId);
          const sk = findSkill(masterProgram, reviewModal.skillId);
          const cat = findSkillCat(masterProgram, reviewModal.skillId);
          const logEntry = r?.timingLogs?.[reviewModal.skillId]?.[reviewModal.logIdx];
          const p = r ? getSkillProgress(r, reviewModal.skillId) : { technique: 0, timing: 0 };
          const cc = cat?.color || T.gold;
          return (
            <>
              {/* Trainee + Skill header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "12px 14px", borderRadius: T.radiusSm, background: `${cc}08`, borderLeft: `3px solid ${cc}` }}>
                <Avatar name={r?.name} size={32} photo={r?.photo} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600 }}>{r?.name}</p>
                  <p style={{ fontSize: "12px", color: cc, fontWeight: 500 }}>{sk?.name || "Unknown skill"}</p>
                </div>
              </div>

              {/* Log details */}
              {logEntry && (
                <div style={{ padding: "12px 14px", borderRadius: T.radiusSm, background: T.cream, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: logEntry.note ? 8 : 0 }}>
                    <div><span style={{ fontSize: "10px", color: T.textMuted, textTransform: "uppercase" }}>Duration</span><p style={{ fontSize: "13px", fontWeight: 600 }}>{logEntry.minutes} min</p></div>
                    <div><span style={{ fontSize: "10px", color: T.textMuted, textTransform: "uppercase" }}>Type</span><p style={{ fontSize: "13px", fontWeight: 500, textTransform: "capitalize" }}>{logEntry.type}</p></div>
                    <div><span style={{ fontSize: "10px", color: T.textMuted, textTransform: "uppercase" }}>Date</span><p style={{ fontSize: "13px", fontWeight: 500 }}>{logEntry.date}</p></div>
                  </div>
                  {logEntry.note && (
                    <div style={{ borderTop: `1px solid ${T.lightLine}`, paddingTop: 8 }}>
                      <span style={{ fontSize: "10px", color: T.textMuted, textTransform: "uppercase" }}>Trainee Notes</span>
                      <p style={{ fontSize: "12px", marginTop: 2 }}>{logEntry.note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Current stages */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: "10px 12px", borderRadius: T.radiusSm, border: `1px solid ${T.lightLine}` }}>
                  <span style={{ fontSize: "10px", color: T.textMuted, textTransform: "uppercase" }}>Technique</span>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: TECHNIQUE_COLORS[p.technique] }}>{TECHNIQUE_STAGES[p.technique]}</p>
                </div>
                <div style={{ flex: 1, padding: "10px 12px", borderRadius: T.radiusSm, border: `1px solid ${T.lightLine}` }}>
                  <span style={{ fontSize: "10px", color: T.textMuted, textTransform: "uppercase" }}>Timing</span>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: TIMING_COLORS[p.timing] }}>{TIMING_STAGES[p.timing]}</p>
                </div>
              </div>

              {/* Advance toggles */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {p.technique < 3 && (
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px", cursor: "pointer" }}>
                    <input type="checkbox" checked={advanceTech} onChange={(e) => setAdvanceTech(e.target.checked)} />
                    Advance technique → {TECHNIQUE_STAGES[p.technique + 1]}
                  </label>
                )}
                {p.timing < 3 && (
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px", cursor: "pointer" }}>
                    <input type="checkbox" checked={advanceTiming} onChange={(e) => setAdvanceTiming(e.target.checked)} />
                    Advance timing → {TIMING_STAGES[p.timing + 1]}
                  </label>
                )}
              </div>

              {/* Feedback text */}
              <FormField label="Feedback / Critique">
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share feedback on this practice session..."
                  rows={3}
                  style={{ ...iSt, resize: "vertical" }}
                />
              </FormField>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <Btn variant="outline" onClick={() => setReviewModal(null)}>Skip</Btn>
                <Btn onClick={submitReview}>Submit Review</Btn>
              </div>
            </>
          );
        })()}
      </Modal>
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
        <MonthGrid cal={cal} schedule={schedule} gcalEvents={gcalEvents} onDayClick={handleDayClick} masterProgram={masterProgram} />
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
                  <div style={{ width: 4, height: 40, borderRadius: 2, background: getEvColor(ev, masterProgram) }} />
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
                  <Badge color={getEvColor(ev, masterProgram)}>{ev.type}</Badge>
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
  const { masterProgram, setMasterProgram, presets, setPresets, showToast } = useData();
  const [masterTab, setMasterTab] = useState("program");
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
  const [editSkillModal, setEditSkillModal] = useState(false);
  const [editSkillCatId, setEditSkillCatId] = useState(null);
  const [editSkillData, setEditSkillData] = useState(null);
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
  const [sopData, setSopData] = useState({ steps: "", mistakes: "", consultation: "", tips: "", tools: "" });
  const [sopTab, setSopTab] = useState("steps");

  const [renameColor, setRenameColor] = useState(null);

  // CSV import/export state
  const [csvImportModal, setCsvImportModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null); // { categories: [...], newCatCount, newSkCount, updateSkCount }
  const [csvError, setCsvError] = useState("");

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/li>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{2,}/g, "\n").trim();
  };

  const escapeCsvField = (val) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const handleCsvExport = () => {
    const headers = ["Category", "Skill Name", "Type", "Target Min", "Max Min", "Key Steps", "Common Mistakes", "Consultation Notes", "Pro Tips", "Tools Required"];
    const rows = [headers.map(escapeCsvField).join(",")];
    masterProgram.forEach((cat) => {
      if (cat.skills.length === 0) {
        rows.push([escapeCsvField(cat.name), "", "", "", "", "", "", "", "", ""].join(","));
      } else {
        cat.skills.forEach((sk) => {
          const sop = sk.sop || {};
          rows.push([
            escapeCsvField(cat.name), escapeCsvField(sk.name), escapeCsvField(sk.type || "service"),
            escapeCsvField(sk.targetMin || ""), escapeCsvField(sk.maxMin || ""),
            escapeCsvField(stripHtml(sop.steps)), escapeCsvField(stripHtml(sop.mistakes)),
            escapeCsvField(stripHtml(sop.consultation)), escapeCsvField(stripHtml(sop.tips)),
            escapeCsvField(stripHtml(sop.tools)),
          ].join(","));
        });
      }
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "master_program.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV downloaded");
  };

  const parseCsvText = (text) => {
    const result = [];
    let i = 0;
    const len = text.length;
    const parseField = () => {
      if (i >= len || text[i] === "\n" || text[i] === "\r") return "";
      if (text[i] === '"') {
        i++; let val = "";
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') { val += '"'; i += 2; }
            else { i++; break; }
          } else { val += text[i]; i++; }
        }
        if (i < len && text[i] === ",") i++;
        return val;
      }
      let val = "";
      while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") { val += text[i]; i++; }
      if (i < len && text[i] === ",") i++;
      return val;
    };
    while (i < len) {
      const row = [];
      while (i < len && text[i] !== "\n" && text[i] !== "\r") {
        row.push(parseField());
        if (i < len && text[i] !== "\n" && text[i] !== "\r" && text[i] !== ",") break;
      }
      // handle stray commas at end of quoted fields spanning lines
      if (i < len && text[i] === "\r") i++;
      if (i < len && text[i] === "\n") i++;
      result.push(row);
    }
    return result;
  };

  const handleCsvFile = (e) => {
    setCsvError("");
    setCsvPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCsvText(ev.target.result);
        if (rows.length < 2) { setCsvError("CSV file is empty or has no data rows."); return; }
        const hdr = rows[0].map((h) => h.trim().toLowerCase());
        const catIdx = hdr.indexOf("category");
        const nameIdx = hdr.indexOf("skill name");
        if (catIdx === -1 || nameIdx === -1) { setCsvError("CSV must have 'Category' and 'Skill Name' columns."); return; }
        const typeIdx = hdr.indexOf("type");
        const tgtIdx = hdr.indexOf("target min");
        const maxIdx = hdr.indexOf("max min");
        const stepsIdx = hdr.indexOf("key steps");
        const mistIdx = hdr.indexOf("common mistakes");
        const consIdx = hdr.indexOf("consultation notes");
        const tipsIdx = hdr.indexOf("pro tips");
        const toolsIdx = hdr.indexOf("tools required");
        const g = (row, idx) => idx >= 0 && idx < row.length ? row[idx].trim() : "";
        const catMap = {};
        let newCatCount = 0, newSkCount = 0, updateSkCount = 0;
        const existingCatNames = new Set(masterProgram.map((c) => c.name.toLowerCase()));
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          if (row.every((c) => !c.trim())) continue;
          const catName = g(row, catIdx);
          if (!catName) continue;
          if (!catMap[catName]) {
            catMap[catName] = { name: catName, skills: [], isNew: !existingCatNames.has(catName.toLowerCase()) };
            if (catMap[catName].isNew) newCatCount++;
          }
          const skName = g(row, nameIdx);
          if (!skName) continue;
          const existCat = masterProgram.find((c) => c.name.toLowerCase() === catName.toLowerCase());
          const existSk = existCat?.skills.find((s) => s.name.toLowerCase() === skName.toLowerCase());
          if (existSk) updateSkCount++; else newSkCount++;
          catMap[catName].skills.push({
            name: skName, type: g(row, typeIdx) || "service",
            targetMin: parseInt(g(row, tgtIdx)) || undefined,
            maxMin: parseInt(g(row, maxIdx)) || undefined,
            steps: g(row, stepsIdx), mistakes: g(row, mistIdx),
            consultation: g(row, consIdx), tips: g(row, tipsIdx), tools: g(row, toolsIdx),
            isUpdate: !!existSk,
          });
        }
        const categories = Object.values(catMap);
        if (categories.length === 0) { setCsvError("No valid data rows found in CSV."); return; }
        setCsvPreview({ categories, newCatCount, newSkCount, updateSkCount });
      } catch (err) { setCsvError("Failed to parse CSV: " + err.message); }
    };
    reader.readAsText(file);
  };

  const confirmCsvImport = () => {
    if (!csvPreview) return;
    const wrapList = (text) => {
      if (!text) return "";
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length <= 1) return `<p>${text}</p>`;
      return "<ul>" + lines.map((l) => `<li>${l}</li>`).join("") + "</ul>";
    };
    const wrapOl = (text) => {
      if (!text) return "";
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length <= 1) return `<p>${text}</p>`;
      return "<ol>" + lines.map((l) => `<li>${l}</li>`).join("") + "</ol>";
    };
    setMasterProgram((prev) => {
      const next = prev.map((c) => ({ ...c, skills: [...c.skills] }));
      csvPreview.categories.forEach((csvCat) => {
        let existing = next.find((c) => c.name.toLowerCase() === csvCat.name.toLowerCase());
        if (!existing) {
          const nextColor = CAT_COLORS[(next.length) % CAT_COLORS.length];
          existing = { id: `c_${uid()}`, name: csvCat.name, color: nextColor, videos: [], skills: [] };
          next.push(existing);
        }
        csvCat.skills.forEach((csvSk) => {
          const existSk = existing.skills.find((s) => s.name.toLowerCase() === csvSk.name.toLowerCase());
          const sop = {
            steps: wrapOl(csvSk.steps), mistakes: wrapList(csvSk.mistakes),
            consultation: wrapList(csvSk.consultation), tips: `<p>${csvSk.tips || ""}</p>`,
            tools: wrapList(csvSk.tools),
          };
          if (existSk) {
            Object.assign(existSk, {
              type: csvSk.type || existSk.type,
              targetMin: csvSk.targetMin || existSk.targetMin,
              maxMin: csvSk.maxMin || existSk.maxMin,
              sop: { ...existSk.sop, ...Object.fromEntries(Object.entries(sop).filter(([, v]) => v && v !== "<p></p>")) },
            });
          } else {
            existing.skills.push({
              id: `sk_${uid()}`, name: csvSk.name, type: csvSk.type || "service",
              targetMin: csvSk.targetMin, maxMin: csvSk.maxMin, videos: [], sop,
            });
          }
        });
      });
      return next;
    });
    const parts = [];
    if (csvPreview.newCatCount) parts.push(`${csvPreview.newCatCount} new categories`);
    if (csvPreview.newSkCount) parts.push(`${csvPreview.newSkCount} new skills`);
    if (csvPreview.updateSkCount) parts.push(`${csvPreview.updateSkCount} skills updated`);
    showToast("Imported: " + parts.join(", "));
    setCsvImportModal(false); setCsvPreview(null); setCsvError("");
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
  const openEditSkill = (cid, sk) => {
    setEditSkillCatId(cid);
    setEditSkillData(sk);
    setEditTarget(sk.targetMin ? String(sk.targetMin) : "");
    setEditMax(sk.maxMin ? String(sk.maxMin) : "");
    setSopData({
      steps: sk.sop?.steps || "",
      mistakes: sk.sop?.mistakes || "",
      consultation: sk.sop?.consultation || "",
      tips: sk.sop?.tips || "",
      tools: sk.sop?.tools || "",
    });
    setSopTab("steps");
    setEditSkillModal(true);
  };
  const saveEditSkill = () => {
    if (!editSkillData || !editSkillCatId) return;
    const t = parseInt(editTarget) || 0;
    const m = parseInt(editMax) || 0;
    const hasSop = Object.values(sopData).some((v) => v && v.trim());
    setMasterProgram((p) => p.map((c) => c.id === editSkillCatId
      ? { ...c, skills: c.skills.map((s) => s.id === editSkillData.id ? { ...s, targetMin: t, maxMin: m, sop: hasSop ? { ...sopData } : s.sop } : s) }
      : c
    ));
    setEditSkillModal(false);
    showToast("Skill updated");
  };

  const openRenameCat = (cat) => {
    setRenameType("cat"); setRenameCatId(cat.id); setRenameSkillId(null);
    setRenameName(cat.name); setRenameColor(cat.color || T.gold); setRenameModal(true);
  };
  const openRenameSk = (catId, sk) => {
    setRenameType("skill"); setRenameCatId(catId); setRenameSkillId(sk.id);
    setRenameName(sk.name); setRenameModal(true);
  };
  const saveRename = () => {
    if (!renameName.trim()) return;
    if (renameType === "cat") {
      setMasterProgram((p) => p.map((c) => c.id === renameCatId ? { ...c, name: renameName.trim(), color: renameColor } : c));
      showToast("Category updated");
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


  // Drag-and-drop reorder
  const handleCatDragStart = (e, catId) => {
    setDragCatId(catId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleCatDragOver = (e, catId) => {
    e.preventDefault();
    if (dragSkId) return; // skill drag in progress, ignore
    if (catId !== dragCatId) setDragOverCatId(catId);
  };
  const handleCatDragLeave = () => { setDragOverCatId(null); };
  const handleCatDrop = (e, targetCatId) => {
    e.preventDefault();
    setDragOverCatId(null);
    if (dragSkId) return; // skill drag in progress, ignore category drop
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

  // Skill reorder within category
  const [dragSkId, setDragSkId] = useState(null);
  const [dragSkCatId, setDragSkCatId] = useState(null);
  const [dragOverSkId, setDragOverSkId] = useState(null);
  const handleSkDragStart = (e, catId, skId) => {
    e.stopPropagation();
    setDragSkId(skId);
    setDragSkCatId(catId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleSkDragOver = (e, skId) => {
    e.preventDefault();
    e.stopPropagation();
    if (skId !== dragSkId) setDragOverSkId(skId);
  };
  const handleSkDragLeave = (e) => { e.stopPropagation(); setDragOverSkId(null); };
  const handleSkDrop = (e, targetCatId, targetSkId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSkId(null);
    setDragOverDropCatId(null);
    if (!dragSkId || !dragSkCatId) { setDragSkId(null); setDragSkCatId(null); return; }
    if (dragSkCatId === targetCatId && dragSkId === targetSkId) { setDragSkId(null); setDragSkCatId(null); return; }
    setMasterProgram((prev) => {
      const sourceCat = prev.find((c) => c.id === dragSkCatId);
      if (!sourceCat) return prev;
      const skill = sourceCat.skills.find((s) => s.id === dragSkId);
      if (!skill) return prev;
      // Remove from source
      const updated = prev.map((c) => c.id === dragSkCatId ? { ...c, skills: c.skills.filter((s) => s.id !== dragSkId) } : c);
      // Insert into target
      return updated.map((c) => {
        if (c.id !== targetCatId) return c;
        const arr = [...c.skills];
        if (targetSkId) {
          const toIdx = arr.findIndex((s) => s.id === targetSkId);
          if (toIdx !== -1) { arr.splice(toIdx, 0, skill); return { ...c, skills: arr }; }
        }
        arr.push(skill);
        return { ...c, skills: arr };
      });
    });
    setDragSkId(null);
    setDragSkCatId(null);
    showToast(dragSkCatId === targetCatId ? "Skill reordered" : "Skill moved");
  };
  // Allow dropping a skill onto an empty category area
  const [dragOverDropCatId, setDragOverDropCatId] = useState(null);
  const handleSkDropOnCat = (e, catId) => {
    e.preventDefault();
    setDragOverDropCatId(null);
    if (!dragSkId || !dragSkCatId) return;
    if (dragSkCatId === catId) { setDragSkId(null); setDragSkCatId(null); return; }
    handleSkDrop(e, catId, null);
  };
  const handleSkDragEnd = () => { setDragSkId(null); setDragSkCatId(null); setDragOverSkId(null); };

  const totalSk = masterProgram.reduce((a, c) => a + c.skills.length, 0);

  // Preset state (inline)
  const [presetModal, setPresetModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetSelIds, setPresetSelIds] = useState(new Set());
  const [presetEditId, setPresetEditId] = useState(null);
  const openNewPreset = () => { setPresetName(""); setPresetSelIds(new Set()); setPresetEditId(null); setPresetModal(true); };
  const openEditPreset = (pr) => { setPresetName(pr.name); setPresetSelIds(new Set(pr.skillIds)); setPresetEditId(pr.id); setPresetModal(true); };
  const togglePresetSk = (sid) => setPresetSelIds((p) => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });
  const togglePresetCat = (cat) => {
    const ids = cat.skills.map((s) => s.id);
    const allIn = ids.every((id) => presetSelIds.has(id));
    setPresetSelIds((p) => { const n = new Set(p); ids.forEach((id) => (allIn ? n.delete(id) : n.add(id))); return n; });
  };
  const savePreset = () => {
    if (!presetName.trim()) return;
    const sids = [...presetSelIds];
    if (presetEditId) { setPresets((p) => p.map((pr) => (pr.id === presetEditId ? { ...pr, name: presetName.trim(), skillIds: sids } : pr))); showToast("Preset updated"); }
    else { setPresets((p) => [...p, { id: `p_${uid()}`, name: presetName.trim(), skillIds: sids }]); showToast("Preset created"); }
    setPresetModal(false);
  };
  const removePreset = (id) => { setPresets((p) => p.filter((pr) => pr.id !== id)); showToast("Preset removed"); };

  return (
    <div className="fade-up">
      <SectionTitle sub={masterTab === "program" ? `${masterProgram.length} categories · ${totalSk} total skills` : `${presets.length} presets · Quick-assign skill combinations`}>
        Master Program
      </SectionTitle>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid " + T.lightLine }}>
          {[{ key: "program", label: "Program" }, { key: "presets", label: "Presets" }].map((t) => (
            <button key={t.key} onClick={() => setMasterTab(t.key)} style={{
              padding: "10px 20px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600,
              background: "transparent", color: masterTab === t.key ? T.charcoal : T.textMuted,
              borderBottom: masterTab === t.key ? "2px solid " + T.gold : "2px solid transparent",
              marginBottom: -2, transition: "all .15s",
            }}>{t.label}{t.key === "presets" && presets.length > 0 ? ` (${presets.length})` : ""}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {masterTab === "program" && <>
            {archived.length > 0 && (
              <Btn variant="outline" onClick={() => setShowArchive(!showArchive)}>
                <Icon name="back" size={14} color={T.textMuted} /> Archive ({archived.length})
              </Btn>
            )}
            <Btn variant="outline" onClick={handleCsvExport}><Icon name="download" size={14} color={T.textMuted} /> Export</Btn>
            <Btn variant="outline" onClick={() => { setCsvImportModal(true); setCsvPreview(null); setCsvError(""); }}><Icon name="file" size={14} color={T.textMuted} /> Import</Btn>
            <Btn onClick={() => setCatModal(true)}><Icon name="plus" size={16} color={T.cream} /> Add Category</Btn>
          </>}
          {masterTab === "presets" && <Btn onClick={openNewPreset}><Icon name="plus" size={16} color={T.cream} /> New Preset</Btn>}
        </div>
      </div>

      {masterTab === "program" && <>
      <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 4, background: T.goldMuted, border: `1px solid ${T.gold}40`, display: "inline-block" }} />
          <span style={{ fontSize: "11px", fontWeight: 500, color: T.textMuted }}>Service Skill</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 4, background: T.charcoalMuted, border: `1px solid ${T.charcoal}20`, display: "inline-block" }} />
          <span style={{ fontSize: "11px", fontWeight: 500, color: T.textMuted }}>Knowledge</span>
        </div>
      </div>

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
                padding: 0,
                opacity: isDragging ? 0.4 : 1,
                transform: isDragOver ? "scale(1.01)" : "none",
                borderColor: isDragOver ? T.gold : T.lightLine,
                borderLeft: `6px solid ${cat.color || T.gold}`,
                boxShadow: isDragOver ? "0 4px 20px rgba(201,168,76,0.2)" : T.shadow,
                transition: "all .2s",
                overflow: "hidden",
              }}>
                <div style={{ background: `linear-gradient(135deg, ${cat.color || T.gold}12 0%, transparent 60%)`, padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ cursor: "grab", padding: "4px 2px", display: "flex", alignItems: "center" }}>
                      <Icon name="grip" size={18} color={T.textMuted} />
                    </div>
                    <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600 }}>{cat.name}</h3>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: (cat.color || T.gold) + "20", color: cat.color || T.gold, fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{cat.skills.length}</span>
                    {(cat.videos || []).length > 0 && <Badge color="#8B6AAE">{cat.videos.length} video{cat.videos.length > 1 ? "s" : ""}</Badge>}
                    <button onClick={() => openRenameCat(cat)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", opacity: 0.5 }} title="Edit category">
                      <Icon name="edit" size={13} color={T.textMuted} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => openAddVideo(cat.id, null)} style={{ background: "#8B6AAE15", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: "#8B6AAE", display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="plus" size={12} color="#8B6AAE" /> Intro Video
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

                <div
                  onDragOver={(e) => { if (dragSkId) { e.preventDefault(); e.stopPropagation(); setDragOverDropCatId(cat.id); } }}
                  onDragLeave={() => setDragOverDropCatId(null)}
                  onDrop={(e) => { if (dragSkId) handleSkDropOnCat(e, cat.id); }}
                  style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 32, padding: dragOverDropCatId === cat.id && dragSkCatId !== cat.id ? 8 : 0, border: dragOverDropCatId === cat.id && dragSkCatId !== cat.id ? `2px dashed ${T.gold}` : "2px dashed transparent", borderRadius: 8, transition: "all .15s" }}>
                  {cat.skills.map((sk) => {
                    const hasSop = sk.sop && Object.values(sk.sop).some((v) => v);
                    const hasVids = (sk.videos || []).length > 0;
                    return (
                      <div key={sk.id} draggable
                        onDragStart={(e) => handleSkDragStart(e, cat.id, sk.id)}
                        onDragOver={(e) => handleSkDragOver(e, sk.id)}
                        onDragLeave={handleSkDragLeave}
                        onDrop={(e) => handleSkDrop(e, cat.id, sk.id)}
                        onDragEnd={handleSkDragEnd}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: sk.type === "service" ? T.goldMuted : T.charcoalMuted, fontSize: "12px", cursor: "grab", opacity: dragSkId === sk.id ? 0.4 : 1, outline: dragOverSkId === sk.id ? `2px dashed ${T.gold}` : "none", transition: "opacity .15s" }}>
                        <Icon name="grip" size={10} color={T.textMuted} />
                        <button onClick={() => openEditSkill(cat.id, sk)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "12px", color: T.text, fontWeight: 500 }} title="Edit skill">
                          {sk.name}
                        </button>
                        {sk.type === "service" && sk.targetMin ? (
                          <span style={{ fontSize: "10px", color: T.textMuted }}>{sk.targetMin}–{sk.maxMin}m</span>
                        ) : null}
                        {(hasSop || hasVids) && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            {hasSop && <Icon name="file" size={8} color={T.success} />}
                            {hasVids && <><Icon name="play" size={8} color="#8B6AAE" /><span style={{ fontSize: "9px", color: "#8B6AAE" }}>{sk.videos.length}</span></>}
                          </span>
                        )}
                        <button onClick={() => confirmDeleteSk(cat.id, sk)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                          <Icon name="x" size={11} color={T.textMuted} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
      </>}

      {masterTab === "presets" && <>
        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {presets.map((pr) => (
            <Card key={pr.id} style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontFamily: T.fontD, fontSize: "19px", fontWeight: 600 }}>{pr.name}</h3>
                  <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 2 }}>{pr.skillIds.length} skills</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEditPreset(pr)} style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: T.gold }}>
                    <Icon name="edit" size={12} color={T.gold} /> Edit
                  </button>
                  <button onClick={() => removePreset(pr.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}><Icon name="trash" size={16} color={T.danger} /></button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {masterProgram.map((cat) => {
                  const count = cat.skills.filter((s) => pr.skillIds.includes(s.id)).length;
                  if (!count) return null;
                  return <Badge key={cat.id} color={cat.color || T.textMuted}>{cat.name} ({count})</Badge>;
                })}
              </div>
            </Card>
          ))}
          {presets.length === 0 && (
            <p style={{ fontSize: "13px", color: T.textMuted, gridColumn: "1 / -1" }}>No presets yet. Create one to quickly assign skill sets to trainees.</p>
          )}
        </div>
        <Modal open={presetModal} onClose={() => setPresetModal(false)} title={presetEditId ? "Edit Preset" : "New Preset"} width={560}>
          <FormField label="Preset Name"><input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="e.g. Color Specialist" style={iSt} /></FormField>
          <FormField label={`Select Skills (${presetSelIds.size} selected)`}>
            <div style={{ maxHeight: 360, overflowY: "auto", border: `1.5px solid ${T.creamDark}`, borderRadius: T.radiusSm, padding: 12 }}>
              {masterProgram.map((cat) => {
                const allIn = cat.skills.every((s) => presetSelIds.has(s.id));
                const someIn = cat.skills.some((s) => presetSelIds.has(s.id));
                return (
                  <div key={cat.id} style={{ marginBottom: 12 }}>
                    <button
                      onClick={() => togglePresetCat(cat)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: T.radiusSm, border: "none", background: allIn ? T.goldMuted : T.cream, cursor: "pointer", width: "100%", textAlign: "left", marginBottom: 6 }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${allIn ? T.gold : someIn ? T.goldLight : T.creamDark}`, background: allIn ? T.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {allIn && <span style={{ color: T.white, fontSize: "10px", fontWeight: 700 }}>✓</span>}
                        {someIn && !allIn && <span style={{ color: T.goldLight, fontSize: "10px", fontWeight: 700 }}>–</span>}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>{cat.name}</span>
                      <span style={{ fontSize: "11px", color: T.textMuted, marginLeft: "auto" }}>{cat.skills.filter((s) => presetSelIds.has(s.id)).length}/{cat.skills.length}</span>
                    </button>
                    <div style={{ paddingLeft: 28, display: "flex", flexDirection: "column", gap: 4 }}>
                      {cat.skills.map((sk) => {
                        const on = presetSelIds.has(sk.id);
                        return (
                          <button key={sk.id} onClick={() => togglePresetSk(sk.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: T.radiusSm, border: "none", background: on ? T.successBg : "transparent", cursor: "pointer", textAlign: "left", width: "100%" }}>
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setPresetModal(false)}>Cancel</Btn><Btn onClick={savePreset}>{presetEditId ? "Save Changes" : "Create Preset"}</Btn></div>
        </Modal>
      </>}

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
                  <span style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted, pointerEvents: "none" }}>min</span>
                </div>
              </FormField>
              <FormField label="Max Acceptable">
                <div style={{ position: "relative" }}>
                  <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} placeholder="e.g. 75" style={iSt} />
                  <span style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted, pointerEvents: "none" }}>min</span>
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
      <Modal open={editSkillModal} onClose={() => setEditSkillModal(false)} title={editSkillData?.name || "Edit Skill"} width={680}>
        {editSkillData && editSkillData.type === "service" && (
          <div style={{ padding: 16, borderRadius: T.radiusSm, background: T.cream, marginBottom: 16 }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: T.charcoal, marginBottom: 10 }}>Timing Standard</p>
            <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Target (Floor Ready)">
                <div style={{ position: "relative" }}>
                  <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} placeholder="e.g. 45" style={iSt} />
                  <span style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted, pointerEvents: "none" }}>min</span>
                </div>
              </FormField>
              <FormField label="Max Acceptable">
                <div style={{ position: "relative" }}>
                  <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} placeholder="e.g. 75" style={iSt} />
                  <span style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted, pointerEvents: "none" }}>min</span>
                </div>
              </FormField>
            </div>
            <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 4 }}>Target = speed they should hit. Max = slowest you'll accept on the floor.</p>
          </div>
        )}
        {/* Curriculum / SOP */}
        <p style={{ fontSize: "12px", fontWeight: 600, color: T.charcoal, marginBottom: 10 }}>Curriculum</p>
        <div style={{ display: "flex", gap: 2, marginBottom: 12, flexWrap: "wrap" }}>
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
        {/* Videos */}
        {editSkillData && (() => {
          const cat = masterProgram.find((c) => c.id === editSkillCatId);
          const sk = cat?.skills.find((s) => s.id === editSkillData.id);
          const vids = sk?.videos || [];
          return (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: T.charcoal }}>Videos</p>
                <button onClick={() => { openAddVideo(editSkillCatId, editSkillData.id); }} style={{ background: "#8B6AAE15", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: "#8B6AAE", display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="plus" size={10} color="#8B6AAE" /> Add Video
                </button>
              </div>
              {vids.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {vids.map((v) => (
                    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: "#8B6AAE10", fontSize: "11px" }}>
                      <Icon name="play" size={12} color="#8B6AAE" />
                      <span style={{ color: "#8B6AAE", fontWeight: 500 }}>{v.title}</span>
                      <span style={{ color: T.textMuted, fontSize: "10px" }}>{v.duration}</span>
                      <button onClick={() => removeVideo(editSkillCatId, editSkillData.id, v.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                        <Icon name="x" size={10} color={T.textMuted} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "11px", color: T.textMuted }}>No videos yet.</p>
              )}
            </div>
          );
        })()}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setEditSkillModal(false)}>Cancel</Btn>
          <Btn onClick={saveEditSkill}>Save</Btn>
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
      <Modal open={renameModal} onClose={() => setRenameModal(false)} title={renameType === "cat" ? "Edit Category" : "Rename Skill"} width={400}>
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
        {renameType === "cat" && (
          <FormField label="Color">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CAT_COLORS.map((c) => (
                <button key={c} onClick={() => setRenameColor(c)} style={{
                  width: 28, height: 28, borderRadius: "50%", border: renameColor === c ? "2.5px solid " + T.charcoal : "2.5px solid transparent",
                  background: c, cursor: "pointer", transition: "border .15s",
                }} />
              ))}
              <label style={{
                width: 28, height: 28, borderRadius: "50%", border: !CAT_COLORS.includes(renameColor) ? "2.5px solid " + T.charcoal : "2.5px solid " + T.lightLine,
                background: `conic-gradient(#C26A6A, #C9A96E, #3D6B5E, #4A6FA5, #6B4D94, #C26A6A)`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
              }} title="Custom color">
                <input type="color" value={renameColor || "#C9A96E"} onChange={(e) => setRenameColor(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
              </label>
            </div>
          </FormField>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setRenameModal(false)}>Cancel</Btn>
          <Btn onClick={saveRename}>Save</Btn>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={csvImportModal} onClose={() => setCsvImportModal(false)} title="Import CSV" width={640}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
            Upload a CSV file with columns: Category, Skill Name, Type, Target Min, Max Min, Key Steps, Common Mistakes, Consultation Notes, Pro Tips, Tools Required.
            Existing skills will be updated; new ones will be added.
          </p>
          <input type="file" accept=".csv" onChange={handleCsvFile} style={{ ...iSt, padding: 10, cursor: "pointer" }} />
        </div>
        {csvError && (
          <div style={{ padding: 12, background: T.dangerBg || "#fde8e8", borderRadius: T.radiusSm, marginBottom: 16 }}>
            <p style={{ fontSize: "13px", color: T.danger, margin: 0 }}>{csvError}</p>
          </div>
        )}
        {csvPreview && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <Badge>{csvPreview.categories.length} categories</Badge>
              {csvPreview.newCatCount > 0 && <Badge>{csvPreview.newCatCount} new</Badge>}
              <Badge>{csvPreview.newSkCount + csvPreview.updateSkCount} skills</Badge>
              {csvPreview.newSkCount > 0 && <Badge>{csvPreview.newSkCount} new</Badge>}
              {csvPreview.updateSkCount > 0 && <Badge>{csvPreview.updateSkCount} updates</Badge>}
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${T.lightLine}`, borderRadius: T.radiusSm, marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: T.cream, position: "sticky", top: 0 }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", color: T.text, fontWeight: 600, borderBottom: `1px solid ${T.lightLine}` }}>Category</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", color: T.text, fontWeight: 600, borderBottom: `1px solid ${T.lightLine}` }}>Skill</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", color: T.text, fontWeight: 600, borderBottom: `1px solid ${T.lightLine}` }}>Type</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", color: T.text, fontWeight: 600, borderBottom: `1px solid ${T.lightLine}` }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.categories.map((cat) => cat.skills.map((sk, si) => (
                    <tr key={cat.name + si} style={{ borderBottom: `1px solid ${T.lightLine}` }}>
                      <td style={{ padding: "6px 10px", color: T.text }}>{si === 0 ? cat.name : ""}</td>
                      <td style={{ padding: "6px 10px", color: T.text }}>{sk.name}</td>
                      <td style={{ padding: "6px 10px", color: T.textMuted }}>{sk.type}</td>
                      <td style={{ padding: "6px 10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: sk.isUpdate ? T.gold : "#2a7d4f", background: sk.isUpdate ? T.goldMuted : "#e6f4ec", padding: "2px 8px", borderRadius: 10 }}>
                          {sk.isUpdate ? "Update" : "New"}
                        </span>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn variant="outline" onClick={() => setCsvImportModal(false)}>Cancel</Btn>
              <Btn onClick={confirmCsvImport}>Confirm Import</Btn>
            </div>
          </>
        )}
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
//  ADMIN: TRAINEES LIST
// ════════════════════════════════════════════
const AdminTrainees = ({ onNav }) => {
  const { residents, setResidents, masterProgram, showToast } = useData();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", cohort: "Spring 2026", photo: null });
  const [photoCropOpen, setPhotoCropOpen] = useState(false);

  const openNew = () => { setForm({ name: "", email: "", cohort: "Spring 2026", photo: null }); setModal(true); };
  const save = () => {
    if (!form.name.trim()) return;
    setResidents((p) => [...p, { id: `r_${uid()}`, name: form.name, email: form.email, cohort: form.cohort, photo: form.photo, skillIds: [], progress: {}, focusSkills: [], timingLogs: {} }]);
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
              <Avatar name={r.name} size={40} photo={r.photo} />
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
        {/* Photo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ cursor: "pointer" }} onClick={() => setPhotoCropOpen(true)}>
            {form.photo ? (
              <img src={form.photo} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px dashed ${T.creamDark}`, display: "flex", alignItems: "center", justifyContent: "center", background: T.cream }}>
                <Icon name="plus" size={18} color={T.textMuted} />
              </div>
            )}
          </div>
          <span style={{ fontSize: "12px", color: T.textMuted }}>{form.photo ? "Click to change" : "Add photo"}</span>
        </div>
        <FormField label="Full Name"><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Kayla Thompson" style={iSt} /></FormField>
        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Email"><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="kayla@flowecollective.com" style={iSt} /></FormField>
          <FormField label="Cohort"><input value={form.cohort} onChange={(e) => setForm((f) => ({ ...f, cohort: e.target.value }))} placeholder="Spring 2026" style={iSt} /></FormField>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={save}>Add Trainee</Btn></div>
      </Modal>
      <PhotoCropModal
        open={photoCropOpen}
        onClose={() => setPhotoCropOpen(false)}
        currentPhoto={form.photo}
        onSave={(dataUrl) => setForm((f) => ({ ...f, photo: dataUrl }))}
      />
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
  const [photoModal, setPhotoModal] = useState(false);

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
    setEditLogMinutes(String(log.minutes)); setEditLogType(log.type); setEditLogNote(log.note || ""); setEditLogCritique("");
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
      if (existing[editLogIdx]) {
        const updated = { ...existing[editLogIdx], minutes: mins, type: editLogType, note: editLogNote.trim() };
        if (editLogCritique.trim()) {
          const prev = updated.comments || [];
          updated.comments = [...prev, { from: "educator", text: editLogCritique.trim(), ts: new Date().toISOString(), name: "Admin" }];
        }
        existing[editLogIdx] = updated;
      }
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
        <div style={{ cursor: "pointer" }} onClick={() => setPhotoModal(true)}>
          <Avatar name={r.name} size={48} photo={r.photo} />
        </div>
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

          {/* Current Focus */}
          <Card style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="brain" size={16} color={T.gold} /> Current Focus
              </h4>
              <span style={{ fontSize: "10px", color: T.textMuted }}>{(r.focusSkills || []).length}/3 pinned</span>
            </div>
            {(r.focusSkills || []).length === 0 ? (
              <p style={{ fontSize: "12px", color: T.textMuted }}>No focus skills pinned. Use the <Icon name="brain" size={11} color={T.textMuted} /> icon on skills below to pin up to 3.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(r.focusSkills || []).map((fsId) => {
                  const fsCat = cats.find((c) => c.skills.some((s) => s.id === fsId));
                  const fsSk = fsCat ? fsCat.skills.find((s) => s.id === fsId) : null;
                  if (!fsSk) return null;
                  const cc = fsCat.color || T.gold;
                  return (
                    <div key={fsId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: T.radiusSm, background: `${cc}10`, border: `1.5px solid ${cc}30` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>{fsSk.name}</span>
                        <span style={{ fontSize: "10px", color: T.textMuted }}>{fsCat.name}</span>
                      </div>
                      <button onClick={() => {
                        setResidents((p) => p.map((x) => x.id !== traineeId ? x : { ...x, focusSkills: (x.focusSkills || []).filter((id) => id !== fsId) }));
                        showToast("Focus removed");
                      }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Icon name="x" size={14} color={T.danger} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
            <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {cats.map((cat) => {
                const cc = cat.color || T.gold;
                const catDone = cat.skills.filter((s) => isSkillComplete(r, s.id, masterProgram)).length;
                const catPct = Math.round(cat.skills.reduce((a, s) => a + getSkillPct(r, s.id, masterProgram), 0) / (cat.skills.length || 1));
                return (
                  <Card key={cat.id} style={{ padding: 0, overflow: "hidden", borderLeft: `5px solid ${cc}` }}>
                    <div style={{ padding: 22, background: `linear-gradient(135deg, ${cc}08, ${cc}03)` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                        {cat.name}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Badge color={catDone === cat.skills.length ? T.success : cc}>{catDone}/{cat.skills.length}</Badge>
                        <span style={{ fontSize: "11px", color: T.textMuted }}>{catPct}%</span>
                      </div>
                    </div>
                    <ProgressBar value={catPct} height={6} color={cc} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                      {cat.skills.map((sk) => {
                        const p = getSkillProgress(r, sk.id);
                        const isService = sk.type === "service";
                        const complete = isSkillComplete(r, sk.id, masterProgram);
                        const isFocus = (r.focusSkills || []).includes(sk.id);
                        const focusCount = (r.focusSkills || []).length;
                        const skLogs = (r.timingLogs || {})[sk.id] || [];
                        const mdlLogs = skLogs.filter((l) => l.type === "model");
                        const manLogs = skLogs.filter((l) => l.type === "mannequin");
                        const mdlAvg = mdlLogs.length ? Math.round(mdlLogs.reduce((a, l) => a + l.minutes, 0) / mdlLogs.length) : null;
                        const manAvg = manLogs.length ? Math.round(manLogs.reduce((a, l) => a + l.minutes, 0) / manLogs.length) : null;
                        const toggleFocus = () => {
                          setResidents((prev) => prev.map((x) => {
                            if (x.id !== traineeId) return x;
                            const fs = x.focusSkills || [];
                            if (fs.includes(sk.id)) return { ...x, focusSkills: fs.filter((id) => id !== sk.id) };
                            if (fs.length >= 3) return x;
                            return { ...x, focusSkills: [...fs, sk.id] };
                          }));
                          showToast(isFocus ? "Focus removed" : "Pinned as focus");
                        };
                        return (
                          <div key={sk.id} style={{
                            padding: "12px 14px", borderRadius: T.radiusSm,
                            background: isFocus ? `${T.gold}12` : complete ? T.successBg : T.cream,
                            border: isFocus ? `2px solid ${T.gold}50` : complete ? "1px solid " + T.success + "30" : "2px solid transparent",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isService ? 10 : 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: isService ? T.goldMuted : T.charcoalMuted, color: isService ? T.gold : T.textMuted }}>
                                  {isService ? "SVC" : "KN"}
                                </span>
                                <span style={{ fontSize: "13px", fontWeight: 500, color: complete ? T.success : T.text }}>{sk.name}</span>
                                {isFocus && <Badge color={T.gold}>Focus</Badge>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {!complete && (
                                  <button
                                    onClick={toggleFocus}
                                    title={isFocus ? "Remove focus" : focusCount >= 3 ? "Max 3 focus skills" : "Pin as focus"}
                                    style={{
                                      background: isFocus ? T.goldMuted : "none", border: "none", cursor: focusCount >= 3 && !isFocus ? "not-allowed" : "pointer",
                                      padding: 3, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                                      opacity: focusCount >= 3 && !isFocus ? 0.3 : 1,
                                    }}
                                  >
                                    <Icon name="brain" size={14} color={isFocus ? T.gold : T.textMuted} />
                                  </button>
                                )}
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
                    </div>
                  </Card>
                );
              })}
            </div>
            </>
          )}

          {/* Edit Practice Entry */}
          <Modal open={editLogModal} onClose={() => setEditLogModal(false)} title="Edit Practice Entry" width={440}>
            <FormField label="Time (minutes)">
              <div style={{ position: "relative" }}>
                <input type="number" value={editLogMinutes} onChange={(e) => setEditLogMinutes(e.target.value)} style={iSt} />
                <span style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: T.textMuted, pointerEvents: "none" }}>min</span>
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
            <FormField label="Add Feedback (appends to conversation)">
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
                  <div style={{ width: 4, height: 36, borderRadius: 2, background: getEvColor(ev, masterProgram) }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                      {ev.skillId && <span style={{ fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: T.goldMuted, color: T.gold }}>SKILL</span>}
                      {ev.assignTo === "all" && <span style={{ fontSize: "8px", fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: T.charcoalMuted, color: T.textMuted }}>COHORT</span>}
                    </div>
                    <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>{ev.date} · {ev.time}</p>
                  </div>
                  <Badge color={getEvColor(ev, masterProgram)}>{ev.type}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "builder" && (
        <TrackBuilder traineeId={traineeId} onNav={onNav} embedded />
      )}

      {/* Photo Crop Modal */}
      <PhotoCropModal
        open={photoModal}
        onClose={() => setPhotoModal(false)}
        currentPhoto={r?.photo}
        onSave={(dataUrl) => {
          setResidents((p) => p.map((x) => x.id !== traineeId ? x : { ...x, photo: dataUrl }));
          showToast(dataUrl ? "Photo updated" : "Photo removed");
        }}
      />

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
  const [presetModal, setPresetModal] = useState(false);
  const [reorderDragId, setReorderDragId] = useState(null);
  const [reorderOverId, setReorderOverId] = useState(null);

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

  // Reorder: drag skill within the assigned track
  const handleReorderDrop = (targetId) => {
    if (!reorderDragId || reorderDragId === targetId) { setReorderDragId(null); setReorderOverId(null); return; }
    setResidents((p) => p.map((x) => {
      if (x.id !== traineeId) return x;
      const ids = [...(x.skillIds || [])];
      const fromIdx = ids.indexOf(reorderDragId);
      const toIdx = ids.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return x;
      ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, reorderDragId);
      return { ...x, skillIds: ids };
    }));
    setReorderDragId(null);
    setReorderOverId(null);
  };

  return (
    <div className={embedded ? "" : "fade-up"}>
      {!embedded && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => onNav("a-trainees")} style={{ background: T.goldMuted, border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="back" size={18} color={T.gold} />
          </button>
          <Avatar name={r.name} size={44} photo={r.photo} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: T.fontD, fontSize: "26px", fontWeight: 600 }}>Build Track — {r.name}</h2>
            <p style={{ color: T.textMuted, fontSize: "13px" }}>{total} skills assigned · {pct}% complete</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <Btn variant="gold" onClick={() => setPresetModal(true)}><Icon name="zap" size={14} color={T.gold} /> Apply Preset</Btn>
        {assigned.size > 0 && <Btn variant="danger" onClick={clearAll}><Icon name="trash" size={14} color={T.danger} /> Clear All</Btn>}
        <div style={{ marginLeft: "auto" }}><Badge color={T.gold}>{assigned.size} skills</Badge></div>
      </div>

      {/* Two panels */}
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* LEFT: Master Program — checkbox selection */}
        <div>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>Master Program</h3>
          <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: 16 }}>Check skills to add them</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {masterProgram.map((cat) => {
              const cc = cat.color || T.gold;
              return (
                <Card key={cat.id} style={{ padding: 0, overflow: "hidden", borderLeft: `5px solid ${cc}` }}>
                  <div style={{ padding: 16, background: `linear-gradient(135deg, ${cc}08, ${cc}03)` }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                      {cat.name}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {cat.skills.map((sk) => {
                        const isA = assigned.has(sk.id);
                        return (
                          <button
                            key={sk.id}
                            onClick={() => toggleSkill(sk.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                              borderRadius: T.radiusSm, border: "none",
                              background: isA ? T.successBg : T.cream, cursor: "pointer", textAlign: "left", width: "100%",
                            }}
                          >
                            <div style={{
                              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                              border: `2px solid ${isA ? T.success : T.creamDark}`,
                              background: isA ? T.success : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {isA && <span style={{ color: T.white, fontSize: "10px", fontWeight: 700 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: "12px", color: isA ? T.success : T.text }}>{sk.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Trainee's Track — drag to reorder */}
        <div>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>{r.name.split(" ")[0]}'s Track</h3>
          <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: 16 }}>Drag to reorder sequence · Click ✕ to remove</p>

          {assignedCats.length === 0 ? (
            <Card style={{ padding: 48, textAlign: "center", border: "2px dashed " + T.creamDark }}>
              <Icon name="template" size={32} color={T.goldLight} />
              <p style={{ color: T.textMuted, fontSize: "14px", marginTop: 12 }}>No skills assigned yet</p>
              <p style={{ color: T.textMuted, fontSize: "12px", marginTop: 4 }}>Check skills on the left</p>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {assignedCats.map((cat) => {
                const cc = cat.color || T.gold;
                return (
                  <Card key={cat.id} style={{ padding: 0, overflow: "hidden", borderLeft: `5px solid ${cc}` }}>
                    <div style={{ padding: 16, background: `linear-gradient(135deg, ${cc}08, ${cc}03)` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                          {cat.name}
                        </p>
                        <Badge color={cc}>{cat.skills.length}</Badge>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {cat.skills.map((sk) => (
                          <div
                            key={sk.id}
                            draggable
                            onDragStart={() => setReorderDragId(sk.id)}
                            onDragOver={(e) => { e.preventDefault(); setReorderOverId(sk.id); }}
                            onDrop={() => handleReorderDrop(sk.id)}
                            onDragEnd={() => { setReorderDragId(null); setReorderOverId(null); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                              borderRadius: T.radiusSm, background: T.cream, cursor: "grab",
                              border: reorderOverId === sk.id && reorderDragId ? `2px dashed ${T.gold}` : "2px solid transparent",
                              opacity: reorderDragId === sk.id ? 0.5 : 1,
                            }}
                          >
                            <Icon name="grip" size={14} color={T.textMuted} />
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
                    </div>
                  </Card>
                );
              })}
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
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                borderRadius: T.radiusSm, border: `1.5px solid ${T.creamDark}`,
                background: T.cream, cursor: "pointer", textAlign: "left", width: "100%",
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
  const { user, docs, setDocs, showToast } = useData();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Resources", url: "" });
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileType, setFileType] = useState("");
  const fileInputRef = useRef(null);

  // Refresh docs on mount (picks up countersigned agreements, etc.)
  useEffect(() => {
    supabase.from("documents").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setDocs(data);
    });
  }, []);

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

  const add = async () => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString().split("T")[0];
    let uploadUrl = form.url.trim() || null;
    let storagePath = null;

    // Upload file to Supabase Storage if file selected
    if (fileData) {
      const ext = fileName.split(".").pop() || "bin";
      const path = `uploads/${Date.now()}-${fileName}`;
      const base64 = fileData.split(",")[1];
      const blob = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const { error: upErr } = await supabase.storage.from("documents").upload(path, blob, { contentType: fileData.split(";")[0].split(":")[1] || "application/octet-stream", upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        uploadUrl = urlData?.publicUrl || null;
        storagePath = "documents/" + path;
      }
    }

    const { data: inserted, error: insErr } = await supabase.from("documents").insert({
      name: form.name.trim(),
      category: form.category,
      date: now,
      size: fileSize || "—",
      url: uploadUrl,
      storage_path: storagePath,
      uploaded_by: user.id,
    }).select().single();

    if (insErr) { console.error("Doc insert error:", insErr); showToast("Error uploading"); return; }
    setDocs((p) => [inserted, ...p]);
    setForm({ name: "", category: "Resources", url: "" });
    setFileData(null); setFileName(""); setFileSize(""); setFileType("");
    setModal(false);
    showToast("Document uploaded");
  };

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);

  const rem = async (doc) => {
    // Delete file from storage bucket if it has a storage_path
    if (doc.storage_path) {
      const bucket = doc.storage_path.split("/")[0];
      const path = doc.storage_path.split("/").slice(1).join("/");
      await supabase.storage.from(bucket).remove([path]);
    }
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocs((p) => p.filter((d) => d.id !== doc.id));
    setConfirmDelete(null);
    showToast("Document removed");
  };

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
            <div key={doc.id} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, background: T.white, borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.lightLine}` }}>
              <div style={{ width: 40, height: 40, borderRadius: T.radiusSm, background: doc.url ? "#4285f415" : T.goldMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="file" size={18} color={doc.url ? "#4285f4" : T.gold} />
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
              {doc.url && (
                <button onClick={() => setViewDoc(doc)} title="View" style={{ background: T.goldMuted, border: "none", borderRadius: 4, padding: 6, cursor: "pointer", position: "relative", zIndex: 2 }}>
                  <Icon name="eye" size={14} color={T.gold} />
                </button>
              )}
              <button onClick={() => setConfirmDelete(doc)} title="Delete" style={{ background: "#fee", border: "none", borderRadius: 4, padding: 6, cursor: "pointer", position: "relative", zIndex: 2 }}>
                <Icon name="trash" size={16} color={T.danger} />
              </button>
            </div>
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

      {/* Document Viewer Modal */}
      <Modal open={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc?.name || ""} width={700}>
        {viewDoc && viewDoc.url && (
          <div>
            {viewDoc.url.match(/\.(png|jpg|jpeg|gif|webp)/i) ? (
              <img src={viewDoc.url} alt={viewDoc.name} style={{ width: "100%", borderRadius: T.radiusSm }} />
            ) : viewDoc.url.match(/\.pdf/i) || viewDoc.url.includes("/agreements/") ? (
              <div style={{ height: 500, borderRadius: T.radiusSm, overflow: "hidden" }}>
                <iframe src={viewDoc.url} style={{ width: "100%", height: "100%", border: "none" }} title={viewDoc.name} />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 32 }}>
                <Icon name="file" size={48} color={T.gold} />
                <p style={{ fontSize: "14px", fontWeight: 500, marginTop: 12 }}>{viewDoc.name}</p>
                <p style={{ fontSize: "12px", color: T.textMuted, marginTop: 4, marginBottom: 16 }}>{viewDoc.size}</p>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <Btn variant="outline" onClick={() => setViewDoc(null)}>Close</Btn>
              <Btn onClick={() => window.open(viewDoc.url, "_blank")}>
                <Icon name="eye" size={14} color={T.cream} /> Open in New Tab
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Document" width={400}>
        <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
          Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This action is permanent and cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={() => rem(confirmDelete)}>Delete</Btn>
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
                <Avatar name={r.name} size={40} photo={r.photo} />
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
  const { user, setUser, gcalConnected, setGcalConnected, setGcalEvents, showToast } = useData();
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoCropOpen, setPhotoCropOpen] = useState(false);

  const saveProfile = async () => {
    if (!profileName.trim()) return;
    setProfileSaving(true);
    const { error } = await supabase.from("profiles").update({ name: profileName.trim() }).eq("id", user.id);
    if (!error) {
      setUser((prev) => ({ ...prev, name: profileName.trim() }));
      showToast("Profile updated!");
    } else {
      showToast("Error saving profile");
    }
    setProfileSaving(false);
  };

  const handlePhotoSave = async (dataUrl) => {
    // Upload to Supabase Storage
    const fileName = `avatars/${user.id}.jpg`;
    const base64 = dataUrl.split(",")[1];
    const blob = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const { error: uploadErr } = await supabase.storage.from("documents").upload(fileName, blob, { contentType: "image/jpeg", upsert: true });
    if (uploadErr) { showToast("Error uploading photo"); return; }
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
    const photoUrl = urlData?.publicUrl || dataUrl;
    // Save to profile
    const { error } = await supabase.from("profiles").update({ photo: photoUrl }).eq("id", user.id);
    if (!error) {
      setUser((prev) => ({ ...prev, photo: photoUrl }));
      showToast("Photo updated!");
    } else {
      // Fallback: use data URL locally
      setUser((prev) => ({ ...prev, photo: dataUrl }));
      showToast("Photo saved locally");
    }
  };

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
      <SectionTitle sub="Manage your profile, integrations, and portal settings">Settings</SectionTitle>

      {/* Profile */}
      <Card style={{ padding: 28, marginBottom: 20 }}>
        <h4 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 16 }}>Profile</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setPhotoCropOpen(true)}>
            <Avatar name={user?.name} size={64} photo={user?.photo} />
            <div style={{
              position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: "50%",
              background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${T.white}`,
            }}>
              <Icon name="edit" size={12} color={T.white} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: 4 }}>{user?.email}</p>
            <Badge color={T.educator}>{user?.role === "admin" ? "Educator" : "Resident"}</Badge>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <FormField label="Display Name">
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={iSt} onKeyDown={(e) => e.key === "Enter" && saveProfile()} />
            </FormField>
          </div>
          <Btn onClick={saveProfile} style={{ marginBottom: 2, opacity: profileSaving ? 0.7 : 1 }}>
            {profileSaving ? "Saving..." : "Save"}
          </Btn>
        </div>
      </Card>

      <PhotoCropModal open={photoCropOpen} onClose={() => setPhotoCropOpen(false)} onSave={handlePhotoSave} currentPhoto={user?.photo} />

      {/* Google Calendar */}
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
  const { residents, setResidents, masterProgram, setNotifications, showToast } = useData();
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
    const newLogIdx = ((me.timingLogs || {})[linkedSkill.id] || []).length;
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const existing = logs[linkedSkill.id] || [];
      logs[linkedSkill.id] = [...existing, {
        minutes: mins,
        type: logType,
        date: new Date().toISOString().split("T")[0],
        note: logNote.trim(),
        comments: [],
      }];
      return { ...r, timingLogs: logs };
    }));
    setNotifications((p) => [...p, {
      id: `n_${uid()}`, type: "practice", residentId: me.id, skillId: linkedSkill.id,
      logIdx: newLogIdx, read: false, reviewed: false, ts: new Date().toISOString(),
    }]);
    showToast("Logged " + mins + "min to " + linkedSkill.name);
    handleReset();
    setExpanded(false);
  };

  // Get service skills for linking — focus skills first
  const focusSet = new Set(me.focusSkills || []);
  const serviceSkills = masterProgram.flatMap((c) =>
    c.skills.filter((s) => s.type === "service" && (me.skillIds || []).includes(s.id)).map((s) => ({ ...s, catName: c.name, isFocus: focusSet.has(s.id) }))
  ).sort((a, b) => (b.isFocus ? 1 : 0) - (a.isFocus ? 1 : 0));

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
                <option key={sk.id} value={sk.id}>{sk.isFocus ? "★ " : ""}{sk.name} ({sk.catName})</option>
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
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dash");
  const [masterProgram, setMasterProgram] = useState(MASTER_PROGRAM);
  const [presets, setPresets] = useState(INIT_PRESETS);
  const [residents, setResidents] = useState(INIT_RESIDENTS);
  const [schedule, setSchedule] = useState(INIT_SCHEDULE);
  const [docs, setDocs] = useState([]);
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalEvents, setGcalEvents] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [notifications, setNotifications] = useState([
    { id: "n1", type: "practice", residentId: "r1", skillId: "sk1", logIdx: 3, read: false, reviewed: false, ts: "2026-03-03T14:30:00" },
    { id: "n2", type: "practice", residentId: "r1", skillId: "sk2", logIdx: 1, read: false, reviewed: false, ts: "2026-03-04T11:00:00" },
  ]);

  const showToast = (msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  // Fetch profile from Supabase after auth
  const loadProfile = async (authUser) => {
    if (!authUser) { setUser(null); setAuthLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
    if (profile) {
      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        cohort: profile.cohort,
        photo: profile.photo,
      });
      setPage(profile.role === "admin" ? "a-dash" : "dash");
      // Fetch documents from Supabase
      const docsQuery = profile.role === "admin"
        ? supabase.from("documents").select("*").order("created_at", { ascending: false })
        : supabase.from("documents").select("*").eq("uploaded_by", profile.id).order("created_at", { ascending: false });
      const { data: docsData } = await docsQuery;
      setDocs(docsData || []);
    } else {
      // Profile not created yet (trigger may not have fired) — use auth metadata
      const meta = authUser.user_metadata || {};
      setUser({
        id: authUser.id,
        name: meta.name || authUser.email.split("@")[0],
        email: authUser.email,
        role: meta.role || "resident",
        cohort: meta.cohort || "Spring 2026",
      });
      setPage((meta.role || "resident") === "admin" ? "a-dash" : "dash");
    }
    setAuthLoading(false);
  };

  // Listen for Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("dash");
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.cream }}>
      <GlobalStyle />
      <div style={{ textAlign: "center" }}>
        <span style={{ fontFamily: T.fontD, fontSize: "1.6rem", fontWeight: 500, letterSpacing: "0.15em", color: T.charcoal }}>FLOWE</span>
        <p style={{ color: T.textMuted, fontSize: "13px", marginTop: 8 }}>Loading...</p>
      </div>
    </div>
  );

  if (!user) return <><GlobalStyle /><AuthScreen /></>;

  const data = { user, setUser, masterProgram, setMasterProgram, presets, setPresets, residents, setResidents, schedule, setSchedule, docs, setDocs, messages, setMessages, gcalConnected, setGcalConnected, gcalEvents, setGcalEvents, notifications, setNotifications, showToast };

  // User photo comes from Supabase profile now
  const enrichedUser = user;

  let content;
  if (page.startsWith("a-countersign:")) {
    content = <AgreementPage user={user} onNav={setPage} mode="countersign" residentId={page.split(":")[1]} />;
  } else if (page.startsWith("a-trainees:")) {
    content = <TraineeProfile traineeId={page.split(":")[1]} onNav={setPage} />;
  } else {
    const map = {
      dash: <TraineeDash user={user} />,
      onboarding: <TraineeOnboarding user={user} onNav={setPage} />,
      agreement: <AgreementPage user={user} onNav={setPage} />,
      sched: <TraineeSchedule user={user} />,
      skills: <TraineeSkills user={user} />,
      tuition: <TraineeTuition user={user} />,
      handbook: <HandbookPage />,
      docs: <TraineeDocs />,
      msg: <MsgPage user={user} />,
      settings: <SettingsPage />,
      "a-dash": <AdminDash onNav={setPage} />,
      "a-sched": <AdminSchedule />,
      "a-master": <AdminMaster />,
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
        <Sidebar user={enrichedUser} page={page} onNav={setPage} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div style={{ flex: 1, marginLeft: 240, display: "flex", flexDirection: "column", minHeight: "100vh" }} className="app-main">
          <MobileHeader user={enrichedUser} onMenuToggle={() => setMobileOpen(true)} />
          <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1060 }}>{content}</main>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
      {user.role !== "admin" && <FloatingTimer user={user} onNav={setPage} />}
    </Ctx.Provider>
  );
};

export default App;
