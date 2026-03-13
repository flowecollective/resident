import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { T, TC, CAT_COLORS, TECHNIQUE_STAGES, TIMING_STAGES, TECHNIQUE_COLORS, TIMING_COLORS, iSt, selSt } from "./theme";
import { GlobalStyle } from "./GlobalStyle";
import { Icon } from "./components/Icon";
import { Card, Badge, ProgressBar, Avatar, SectionTitle, FormField, Btn, Modal, Toast } from "./components/ui";
import { supabase } from "./lib/supabase";
import { AgreementPage } from "./components/AgreementPage";

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

const COHORT_RING_COLORS = CAT_COLORS;
let _cohortColorMap = {};
try { _cohortColorMap = JSON.parse(localStorage.getItem("cohort_colors") || "{}"); } catch {}
const setCohortColorMap = (map) => {
  _cohortColorMap = map;
  localStorage.setItem("cohort_colors", JSON.stringify(map));
  // Persist to Supabase settings table
  supabase.from("settings").upsert({ key: "cohort_colors", value: map });
};
const cohortColor = (cohort) => {
  if (!cohort) return undefined;
  if (_cohortColorMap[cohort]) return _cohortColorMap[cohort];
  let h = 0;
  for (let i = 0; i < cohort.length; i++) h = ((h << 5) - h + cohort.charCodeAt(i)) | 0;
  return COHORT_RING_COLORS[Math.abs(h) % COHORT_RING_COLORS.length];
};

// ════════════════════════════════════════════
//  TRAINEE LABEL (customizable display name)
// ════════════════════════════════════════════
let _traineeLabel = { singular: "Trainee", plural: "Trainees" };
try { const saved = JSON.parse(localStorage.getItem("trainee_label") || "null"); if (saved) _traineeLabel = saved; } catch {}
const TL = {
  get s() { return _traineeLabel.singular; },            // "Trainee" / "Resident" / "Student"
  get p() { return _traineeLabel.plural; },              // "Trainees" / "Residents" / "Students"
  get sl() { return _traineeLabel.singular.toLowerCase(); },  // "trainee"
  get pl() { return _traineeLabel.plural.toLowerCase(); },    // "trainees"
  get pos() { return _traineeLabel.singular + "'s"; },        // "Trainee's"
};
const setTraineeLabel = (label) => {
  _traineeLabel = label;
  localStorage.setItem("trainee_label", JSON.stringify(label));
  supabase.from("settings").upsert({ key: "trainee_label", value: label });
};

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
            {mode === "login" ? "Sign in to continue" : `Set up your ${TL.sl} account`}
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
    supabase.from("profiles").select("agreement_signed, enrollment_completed, gusto_completed, onboarding_steps").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        const enabled = data.onboarding_steps || ["agreement", "enrollment", "gusto"];
        const done = (!enabled.includes("agreement") || !!data.agreement_signed)
          && (!enabled.includes("enrollment") || !!data.enrollment_completed)
          && (!enabled.includes("gusto") || !!data.gusto_completed);
        setOnboardingDone(done);
      }
    });
  }, [isA, user?.id, page]);

  const items = isA
    ? [
        { id: "a-dash", label: "Dashboard", icon: "dashboard", badge: unreviewedCount },
        { id: "a-sched", label: "Schedule", icon: "calendar" },
        { id: "a-master", label: "Master Program", icon: "template" },
        { id: "a-trainees", label: TL.p, icon: "users" },
        { id: "a-tuition", label: "Tuition", icon: "dollar" },
        { id: "a-docs", label: "Documents", icon: "file" },
        { id: "a-msg", label: "Messages", icon: "message" },
        { id: "a-settings", label: "Settings", icon: "settings" },
      ]
    : [
        { id: "dash", label: "Dashboard", icon: "dashboard" },
        ...(!onboardingDone ? [{ id: "onboarding", label: "Onboarding", icon: "clipboard", dot: true }] : []),
        { id: "sched", label: "Schedule", icon: "calendar" },
        { id: "skills", label: "My Skills", icon: "check" },
        { id: "tuition", label: "My Tuition", icon: "dollar" },
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
              {isA ? "Educator" : TL.s} Portal
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
const ReplyInput = ({ skillId, logIdx, logId, me, setResidents, showToast }) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const submit = async () => {
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
    if (logId) {
      await supabase.from("log_comments").insert({
        log_id: logId, from_role: "resident", author_name: me.name?.split(" ")[0] || "", text: text.trim(),
      });
    }
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
const TraineeOnboarding = ({ user, onNav }) => {
  const { showToast, setUser } = useData();
  const [ob, setOb] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load onboarding fields from profiles table
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("profiles")
        .select("agreement_signed, agreement_date, agreement_url, agreement_countersigned, agreement_data, enrollment_completed, enrollment_date, enrollment_plan, gusto_completed, gusto_date, gusto_invite_url, onboarding_steps")
        .eq("id", user.id).single();
      if (data) {
        setOb(data);
      } else {
        setOb({ agreement_signed: false, agreement_countersigned: false, agreement_data: {}, enrollment_completed: false, gusto_completed: false, gusto_invite_url: null, onboarding_steps: ["agreement", "enrollment", "gusto"] });
      }
      setLoading(false);
    };
    load();
  }, [user.id]);

  const updateOb = async (updates) => {
    const { data } = await supabase.from("profiles").update(updates).eq("id", user.id).select("agreement_signed, agreement_date, agreement_url, agreement_countersigned, agreement_data, enrollment_completed, enrollment_date, enrollment_plan, gusto_completed, gusto_date, gusto_invite_url").single();
    if (data) setOb(data);
    return data;
  };

  if (loading || !ob) return (
    <div className="fade-up">
      <SectionTitle sub="Loading...">Onboarding</SectionTitle>
      <Card style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.textMuted, fontSize: "13px" }}>Loading your onboarding status...</p></Card>
    </div>
  );

  const enabled = ob.onboarding_steps || ["agreement", "enrollment", "gusto"];
  const steps = [
    { id: "agreement", label: "Sign Residency Agreement", icon: "shield", done: ob.agreement_signed },
    { id: "enrollment", label: "Enroll & Pay Tuition", icon: "dollar", done: ob.enrollment_completed },
    { id: "gusto", label: "Complete Payroll Setup", icon: "clipboard", done: ob.gusto_completed },
  ].filter((s) => enabled.includes(s.id));

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  const handleAgreement = () => {
    if (ob.agreement_signed && ob.agreement_url) {
      window.open(ob.agreement_url, "_blank");
    } else {
      if (onNav) onNav("agreement");
    }
  };

  const STRIPE_LINKS = {
    A: "https://buy.stripe.com/00wcN4dmoetn7Y0aLU9EI07",
    B: "https://buy.stripe.com/4gM8wObegetnemo6vE9EI08",
  };

  const handleEnroll = () => {
    const payOpt = ob?.agreement_data?.paymentOption || "B";
    const link = STRIPE_LINKS[payOpt] || STRIPE_LINKS.B;
    const params = new URLSearchParams({
      client_reference_id: user.id,
      prefilled_email: user.email,
    });
    window.open(`${link}?${params}`, "_blank");
  };

  const markEnrolled = async () => {
    const payOpt = ob?.agreement_data?.paymentOption || "B";
    const plan = payOpt === "A" ? "full" : "monthly";
    const now = localDate();
    await updateOb({ enrollment_completed: true, enrollment_date: now, enrollment_plan: plan });
    showToast("Enrollment confirmed!");
  };

  // Gusto is handled entirely by admin — trainee just sees status

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
            <button onClick={handleEnroll} style={{ padding: "8px 16px", borderRadius: T.radiusSm, border: "none", background: T.charcoal, fontSize: "12px", fontWeight: 500, cursor: "pointer", color: T.cream }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="dollar" size={14} color={T.cream} /> Enroll & Pay</span>
            </button>
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
                : "Check your email for a Gusto invite to set up payroll"
              }
            </p>
          </div>
          {ob.gusto_completed ? (
            <Badge color={T.success} bg={T.successBg}>Complete</Badge>
          ) : (
            <Badge color={T.textMuted}>Waiting for invite</Badge>
          )}
        </div>
      </Card>
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
                        <ReplyInput skillId={fb.skillId} logIdx={fb.idx} logId={fb.log.id} me={me} setResidents={setResidents} showToast={showToast} />
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
          const td = new Date(); const isToday = cell.date === `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, "0")}-${String(td.getDate()).padStart(2, "0")}`;
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
                border: isSelected ? "2px solid " + T.gold : "1px solid " + (cell.current ? T.lightLine : "transparent"),
                background: isSelected ? T.goldMuted : cell.current ? T.white : "transparent",
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

const parseTime12 = (str) => {
  if (!str) return null;
  const m = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h + min / 60;
};

const parseTimeRange = (timeStr) => {
  if (!timeStr || timeStr === "All day") return { start: 8, end: 9 };
  const parts = timeStr.split("–").map((s) => s.trim());
  if (parts.length === 2) return { start: parseTime12(parts[0]) ?? 8, end: parseTime12(parts[1]) ?? 9 };
  const s = parseTime12(timeStr);
  return { start: s ?? 8, end: (s ?? 8) + 1 };
};

const DayEventList = ({ date, schedule, gcalEvents = [], masterProgram = [] }) => {
  const events = schedule.filter((e) => e.date === date);
  const gcal = gcalEvents.filter((e) => e.date === date);
  if (!date) return null;
  const parts = date.split("-");
  const label = MONTH_NAMES[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10);

  // Build unified timeline items
  const allItems = [
    ...events.map((ev) => {
      const r = parseTimeRange(ev.time);
      return { ...ev, startH: r.start, endH: r.end, source: "training", color: getEvColor(ev, masterProgram) };
    }),
    ...gcal.map((ev, i) => {
      const r = parseTimeRange(ev.time);
      return { ...ev, id: `gcal-${i}`, startH: r.start, endH: r.end, source: "salon", color: "#4285f4" };
    }),
  ];

  if (allItems.length === 0) {
    return (
      <div style={{ marginTop: 20 }}>
        <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>{label}</h4>
        <p style={{ color: T.textMuted, fontSize: "13px" }}>No sessions on this day.</p>
      </div>
    );
  }

  // Find hour range
  const minH = Math.floor(Math.min(...allItems.map((e) => e.startH)));
  const maxH = Math.ceil(Math.max(...allItems.map((e) => e.endH)));
  const startHour = Math.max(0, minH - 1);
  const endHour = Math.min(24, maxH + 1);
  const totalHours = endHour - startHour;
  const hourHeight = 60;

  // Compute columns for overlapping events
  const sorted = [...allItems].sort((a, b) => a.startH - b.startH || a.endH - b.endH);
  const columns = [];
  sorted.forEach((ev) => {
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      const last = columns[c][columns[c].length - 1];
      if (ev.startH >= last.endH - 0.01) { columns[c].push(ev); ev._col = c; placed = true; break; }
    }
    if (!placed) { ev._col = columns.length; columns.push([ev]); }
  });
  const totalCols = columns.length || 1;

  const formatHour = (h) => {
    const hr = Math.floor(h);
    const ampm = hr >= 12 ? "PM" : "AM";
    const display = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
    return `${display} ${ampm}`;
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600 }}>{label}</h4>
        <div style={{ display: "flex", gap: 12, fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold }} /> Training</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4285f4" }} /> Salon</div>
        </div>
      </div>
      <div style={{ position: "relative", height: totalHours * hourHeight, borderLeft: `1px solid ${T.lightLine}` }}>
        {/* Hour grid lines */}
        {Array.from({ length: totalHours + 1 }, (_, i) => (
          <div key={i} style={{ position: "absolute", top: i * hourHeight, left: 0, right: 0, display: "flex", alignItems: "flex-start" }}>
            <span style={{ fontSize: "10px", color: T.textMuted, width: 48, textAlign: "right", paddingRight: 8, marginTop: -6, flexShrink: 0 }}>
              {formatHour(startHour + i)}
            </span>
            <div style={{ flex: 1, borderTop: `1px solid ${i === 0 ? "transparent" : T.lightLine}` }} />
          </div>
        ))}
        {/* Event blocks */}
        {sorted.map((ev) => {
          const top = (ev.startH - startHour) * hourHeight;
          const height = Math.max((ev.endH - ev.startH) * hourHeight, 24);
          const colWidth = (100 - 8) / totalCols; // 8% for time labels
          const left = 52 + ev._col * ((100 - 8) / totalCols) * 0.01 * (typeof window !== "undefined" ? 1 : 1);
          const isSalon = ev.source === "salon";
          return (
            <div
              key={ev.id}
              style={{
                position: "absolute",
                top,
                left: `calc(52px + ${ev._col * colWidth}%)`,
                width: `calc(${colWidth}% - 4px)`,
                height,
                borderRadius: 6,
                padding: "4px 8px",
                background: isSalon ? "#4285f412" : (ev.color || T.gold) + "18",
                borderLeft: `3px solid ${ev.color || T.gold}`,
                overflow: "hidden",
                cursor: "default",
                fontSize: "11px",
                lineHeight: 1.3,
              }}
            >
              <p style={{ fontWeight: 600, color: isSalon ? "#4285f4" : T.charcoal, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</p>
              {height > 30 && <p style={{ color: T.textMuted, fontSize: "10px" }}>{ev.time}</p>}
              {height > 46 && ev.type && !isSalon && <p style={{ color: ev.color || T.gold, fontSize: "9px", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>{ev.type}</p>}
            </div>
          );
        })}
      </div>
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
      ...(skill.archived ? { opacity: 0.6 } : {}),
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isService ? 8 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: complete ? T.success : T.text }}>{skill.name}</span>
          {skill.archived && <span style={{ fontSize: "8px", fontWeight: 600, padding: "2px 5px", borderRadius: 4, background: T.creamDark, color: T.textMuted }}>ARCHIVED</span>}
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

  const replyToLog = async (skillId, logIdx, text) => {
    const entries = (me.timingLogs || {})[skillId] || [];
    const logEntry = entries[logIdx];
    if (!logEntry) return;
    const newComment = { from: "resident", text, ts: new Date().toISOString(), name: me.name?.split(" ")[0] };
    // Optimistic update
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const ents = [...(logs[skillId] || [])];
      if (ents[logIdx]) {
        ents[logIdx] = { ...ents[logIdx], comments: [...(ents[logIdx].comments || []), newComment] };
      }
      logs[skillId] = ents;
      return { ...r, timingLogs: logs };
    }));
    showToast("Reply sent");
    // Persist to Supabase
    if (logEntry.id) {
      await supabase.from("log_comments").insert({
        log_id: logEntry.id, from_role: "resident", author_name: me.name?.split(" ")[0] || "", text,
      });
    }
  };

  const openAddLog = (skill) => {
    setLogSkill(skill);
    setLogMinutes("");
    setLogType("mannequin");
    setLogNote("");
    setLogModal(true);
  };

  const saveLog = async () => {
    if (!logMinutes || !logSkill) return;
    const mins = parseInt(logMinutes);
    if (isNaN(mins) || mins <= 0) return;
    const dateStr = localDate();
    // Insert to Supabase first to get the ID
    const { data: inserted, error } = await supabase.from("timing_logs").insert({
      user_id: me.id, skill_id: logSkill.id, minutes: mins, type: logType, date: dateStr, note: logNote.trim(),
    }).select().single();
    if (error) { console.error(error); showToast("Error saving log"); return; }
    // Update local state with the real ID
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const existing = logs[logSkill.id] || [];
      logs[logSkill.id] = [...existing, {
        id: inserted.id, minutes: mins, type: logType, date: dateStr, note: logNote.trim(), comments: [],
      }];
      return { ...r, timingLogs: logs };
    }));
    // Create notification for admin
    await supabase.from("notifications").insert({
      resident_id: me.id, skill_id: logSkill.id, log_id: inserted.id,
    });
    showToast("Practice logged — " + logMinutes + " min");
    setLogModal(false);
  };

  const deleteLog = async (skillId, logIdx) => {
    const entries = (me.timingLogs || {})[skillId] || [];
    const logEntry = entries[logIdx];
    // Optimistic update
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const existing = [...(logs[skillId] || [])];
      existing.splice(logIdx, 1);
      logs[skillId] = existing;
      return { ...r, timingLogs: logs };
    }));
    showToast("Entry deleted");
    // Delete from Supabase
    if (logEntry?.id) {
      await supabase.from("timing_logs").delete().eq("id", logEntry.id);
    }
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
                    <Card key={sk.id} style={{ padding: 0, overflow: "hidden", borderLeft: `4px solid ${cc}`, ...(sk.archived ? { opacity: 0.6 } : {}) }}>
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <p style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 2 }}>{sk.name}</p>
                              {sk.archived && <span style={{ fontSize: "8px", fontWeight: 600, padding: "2px 5px", borderRadius: 4, background: T.creamDark, color: T.textMuted }}>ARCHIVED</span>}
                            </div>
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
    { type: "li", items: ["A personalized skill track assigned by your educator", "Hands-on practice on mannequins and live models", "Regular coaching sessions and progress evaluations", "Access to your personal training portal", `A supportive community of fellow ${TL.pl} and mentors`] },
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
    { type: "p", text: `As a ${TL.sl} at Flowe Collective, you are a representative of our brand. The following policies apply to all ${TL.pl} while on the salon floor.` },
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
    { type: "p", text: `Tuition is non-refundable after the first week. ${TL.p} who withdraw within the first 5 business days may request a partial refund minus a $500 administrative fee.` },
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
    { type: "li", items: [`Treat all staff, ${TL.pl}, and clients with respect`, "Phones on silent and out of sight during sessions", "Social media use only for portfolio content, with client consent"] },
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
      <SectionTitle sub="Your complete guide to the Flowe training program">{TL.s} Handbook</SectionTitle>
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
  const [showHandbook, setShowHandbook] = useState(false);
  const [handbookSection, setHandbookSection] = useState("welcome");

  // Refresh docs on mount — show docs visible to this trainee
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("documents").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (!data) return;
      const visible = data.filter((d) =>
        d.uploaded_by === user.id ||
        d.visibility === "all" || !d.visibility ||
        (d.visibility === "specific" && d.assigned_to?.includes(user.id))
      );
      setDocs(visible);
    });
  }, []);
  const cats = ["All", ...new Set(docs.map((d) => d.category))];
  const fd = f === "All" ? docs : docs.filter((d) => d.category === f);

  const renderHandbookContent = (content) => content.map((block, i) => {
    if (block.type === "p") return <p key={i} style={{ fontSize: "13px", lineHeight: 1.7, color: T.text, marginBottom: 12 }}>{block.text}</p>;
    if (block.type === "h3") return <h4 key={i} style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600, color: T.gold, marginTop: 16, marginBottom: 8 }}>{block.text}</h4>;
    if (block.type === "li") return <ul key={i} style={{ paddingLeft: 20, marginBottom: 12 }}>{block.items.map((item, j) => <li key={j} style={{ fontSize: "13px", lineHeight: 1.7, color: T.text, marginBottom: 4 }}>{item}</li>)}</ul>;
    return null;
  });

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

  if (showHandbook) return (
    <div className="fade-up">
      <SectionTitle sub="Your complete guide to the training program" action={
        <Btn variant="outline" onClick={() => setShowHandbook(false)}><Icon name="back" size={14} color={T.textMuted} /> Back to Documents</Btn>
      }>Handbook</SectionTitle>
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>
        <Card style={{ padding: 16, position: "sticky", top: 20 }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 10 }}>Contents</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {HANDBOOK_SECTIONS.map((sec) => (
              <button key={sec.id} onClick={() => setHandbookSection(sec.id)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: T.radiusSm,
                border: "none", background: handbookSection === sec.id ? T.goldMuted : "transparent",
                cursor: "pointer", textAlign: "left", fontSize: "11px",
                color: handbookSection === sec.id ? T.charcoal : T.textMuted,
                fontWeight: handbookSection === sec.id ? 600 : 400,
              }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: T.gold, minWidth: 18 }}>{sec.num}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sec.title}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card style={{ padding: 32 }}>
          {HANDBOOK_SECTIONS.filter((s) => s.id === handbookSection).map((sec) => (
            <div key={sec.id}>
              <span style={{ fontSize: "36px", fontFamily: T.fontD, fontWeight: 600, color: T.goldLight }}>{sec.num}</span>
              <h2 style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600, color: T.charcoal, marginBottom: 4 }}>{sec.title}</h2>
              <div style={{ height: 2, width: 60, background: T.gold, borderRadius: 1, marginBottom: 20 }} />
              {renderHandbookContent(sec.content)}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );

  return (
    <div className="fade-up">
      <SectionTitle sub="Training materials and resources">Documents</SectionTitle>
      {/* Handbook banner */}
      <Card onClick={() => setShowHandbook(true)} style={{ padding: "16px 22px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderLeft: `4px solid ${T.gold}`, transition: "box-shadow .2s" }}>
        <div style={{ width: 40, height: 40, borderRadius: T.radiusSm, background: T.goldMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="file" size={18} color={T.gold} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: 600 }}>{TL.s} Handbook</p>
          <p style={{ fontSize: "11px", color: T.textMuted }}>Program guide, policies, and expectations</p>
        </div>
        <Icon name="back" size={16} color={T.textMuted} style={{ transform: "rotate(180deg)" }} />
      </Card>

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
  const { residents, showToast } = useData();
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [sending, setSending] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedMessages, setArchivedMessages] = useState([]);
  const bottomRef = useRef(null);

  const isAdmin = user.role === "admin";

  // Look up the admin's UUID for resident-side chat
  const [adminId, setAdminId] = useState(null);
  useEffect(() => {
    if (isAdmin) return;
    supabase.from("profiles").select("id").eq("role", "admin").limit(1).single()
      .then(({ data }) => { if (data) setAdminId(data.id); });
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && residents.length > 0 && !activeChat) {
      setActiveChat(residents[0].id);
    } else if (!isAdmin && adminId && !activeChat) {
      setActiveChat(adminId);
    }
  }, [isAdmin, residents, activeChat, adminId]);

  useEffect(() => {
    if (!activeChat) return;
    const partnerId = activeChat;
    const myId = user.id;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(from_id.eq.${myId},to_id.eq.${partnerId}),and(from_id.eq.${partnerId},to_id.eq.${myId})`
        )
        .neq("archived", true)
        .order("time", { ascending: true });
      if (data) setMessages(data);
    };

    loadMessages();

    const channel = supabase
      .channel(`messages-${myId}-${partnerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new;
          const relevant =
            (m.from_id === myId && m.to_id === partnerId) ||
            (m.from_id === partnerId && m.to_id === myId);
          if (relevant) setMessages((prev) => [...prev, m]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeChat, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeChat || messages.length === 0) return;
    const unread = messages.filter((m) => m.to_id === user.id && !m.read);
    if (unread.length > 0) {
      supabase
        .from("messages")
        .update({ read: true })
        .in("id", unread.map((m) => m.id))
        .then();
    }
  }, [messages, activeChat, user.id]);

  const send = async () => {
    if (!msg.trim() || !activeChat || sending) return;
    setSending(true);

    const newMsg = {
      from_id: user.id,
      to_id: activeChat,
      text: msg.trim(),
      channel: "portal",
      read: false,
    };

    const { error } = await supabase.from("messages").insert(newMsg);

    if (!error) {
      if (isAdmin) {
        const smsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`;
        console.log("Sending SMS via:", smsUrl, "to_user_id:", activeChat);
        try {
          const res = await fetch(smsUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ to_user_id: activeChat, text: msg.trim() }),
          });
          const result = await res.text();
          console.log("SMS response:", res.status, result);
          if (!res.ok) alert("SMS failed: " + result);
        } catch (err) {
          console.error("SMS send error:", err);
          alert("SMS error: " + err.message);
        }
      } else {
        console.log("Not admin, skipping SMS. role:", user.role);
      }
      setMsg("");
    }

    setSending(false);
  };

  const archiveConversation = async () => {
    if (!activeChat) return;
    const ids = messages.map((m) => m.id);
    if (ids.length === 0) return;
    await supabase.from("messages").update({ archived: true }).in("id", ids);
    setMessages([]);
    setArchiveConfirm(false);
    showToast("Conversation archived");
  };

  const loadArchived = async () => {
    if (!activeChat) return;
    const myId = user.id;
    const partnerId = activeChat;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(from_id.eq.${myId},to_id.eq.${partnerId}),and(from_id.eq.${partnerId},to_id.eq.${myId})`)
      .eq("archived", true)
      .order("time", { ascending: true });
    setArchivedMessages(data || []);
    setShowArchive(true);
  };

  const unarchiveConversation = async () => {
    const ids = archivedMessages.map((m) => m.id);
    if (ids.length === 0) return;
    await supabase.from("messages").update({ archived: false }).in("id", ids);
    setMessages((prev) => [...prev, ...archivedMessages].sort((a, b) => a.time.localeCompare(b.time)));
    setArchivedMessages([]);
    setShowArchive(false);
    showToast("Messages restored");
  };

  const getPartnerName = (id) => {
    if (id === adminId) return "Flowe Educator";
    const r = residents.find((r) => r.id === id);
    return r?.name || id;
  };

  const [unreadCounts, setUnreadCounts] = useState({});
  useEffect(() => {
    if (!isAdmin) return;
    const loadUnread = async () => {
      const { data } = await supabase
        .from("messages")
        .select("from_id")
        .eq("to_id", user.id)
        .eq("read", false);
      if (data) {
        const counts = {};
        data.forEach((m) => { counts[m.from_id] = (counts[m.from_id] || 0) + 1; });
        setUnreadCounts(counts);
      }
    };
    loadUnread();
  }, [isAdmin, messages]);

  const partnerName = activeChat ? getPartnerName(activeChat) : "";

  return (
    <div className="fade-up">
      <SectionTitle sub={isAdmin ? `${TL.s} conversations` : `Conversation with ${partnerName}`}>
        Messages
      </SectionTitle>

      <div style={{ display: "flex", gap: 16 }}>
        {isAdmin && (
          <Card style={{ width: 220, padding: 0, flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.lightLine}` }}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", color: T.textMuted, textTransform: "uppercase" }}>
                Residents
              </p>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {residents.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setActiveChat(r.id)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: activeChat === r.id ? T.cream : "transparent",
                    borderLeft: activeChat === r.id ? `3px solid ${T.educator}` : "3px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.15s",
                  }}
                >
                  <p style={{ fontSize: "13px", fontWeight: activeChat === r.id ? 600 : 400 }}>
                    {r.name}
                  </p>
                  {unreadCounts[r.id] > 0 && (
                    <span style={{ background: T.educator, color: T.white, fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: 10, minWidth: 18, textAlign: "center" }}>
                      {unreadCounts[r.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {activeChat && (
              <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.lightLine}` }}>
                <button onClick={loadArchived} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: T.textMuted, padding: "6px 0", textAlign: "center", opacity: 0.6, transition: "opacity .15s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}>
                  View Archived
                </button>
              </div>
            )}
          </Card>
        )}

        <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.lightLine}`, display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ fontSize: "14px", fontWeight: 600 }}>{partnerName}</p>
            {isAdmin && activeChat && (
              <>
                <span style={{ fontSize: "10px", color: T.textMuted, background: T.cream, padding: "2px 8px", borderRadius: 8 }}>
                  SMS + Portal
                </span>
                {messages.length > 0 && (
                  <button onClick={() => setArchiveConfirm(true)} title="Clear & Archive" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, opacity: 0.4, transition: "opacity .15s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}>
                    <Icon name="trash" size={14} color={T.textMuted} />
                  </button>
                )}
              </>
            )}
          </div>

          <div style={{ height: 380, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12, background: T.cream }}>
            {messages.length === 0 && (
              <p style={{ color: T.textMuted, fontSize: "13px", textAlign: "center", marginTop: 40 }}>
                No messages yet. Start the conversation!
              </p>
            )}
            {messages.map((m) => {
              const isSelf = m.from_id === user.id;
              const isEducator = isAdmin ? false : m.from_id === adminId;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: isSelf ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: T.radiusSm,
                      background: isSelf ? T.charcoalMuted : T.white,
                      borderLeft: !isSelf && isEducator ? `3px solid ${T.educator}` : undefined,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    {!isSelf && isEducator && (
                      <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.8px", color: T.educator, marginBottom: 4, textTransform: "uppercase" }}>
                        EDUCATOR
                      </p>
                    )}
                    <p style={{ fontSize: "13px", lineHeight: 1.5 }}>{m.text}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
                      {m.channel === "sms" && (
                        <span style={{ fontSize: "9px", color: T.textMuted, fontStyle: "italic" }}>via SMS</span>
                      )}
                      <span style={{ fontSize: "10px", color: T.textMuted }}>
                        {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderTop: `1px solid ${T.lightLine}`, background: T.white }}>
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={isAdmin ? "Reply (also sent as SMS)..." : "Type a message..."}
              style={{ flex: 1, padding: "10px 14px", borderRadius: T.radiusSm, border: `1.5px solid ${T.creamDark}`, background: T.cream, fontSize: "13px", outline: "none" }}
            />
            <button
              onClick={send}
              disabled={sending}
              style={{ width: 40, height: 40, borderRadius: T.radiusSm, background: isAdmin ? T.educator : T.charcoal, border: "none", cursor: sending ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: sending ? 0.6 : 1 }}
            >
              <Icon name="send" size={18} color={T.white} />
            </button>
          </div>
        </Card>
      </div>

      {/* Archived messages viewer */}
      <Modal open={showArchive} onClose={() => setShowArchive(false)} title={`Archived — ${partnerName}`}>
        {archivedMessages.length === 0 ? (
          <p style={{ fontSize: "13px", color: T.textMuted, textAlign: "center", padding: "20px 0" }}>No archived messages with this resident.</p>
        ) : (
          <>
            <div style={{ maxHeight: 350, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {archivedMessages.map((m) => {
                const isSelf = m.from_id === user.id;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isSelf ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "75%", padding: "8px 12px", borderRadius: T.radiusSm, background: isSelf ? T.charcoalMuted : T.cream, opacity: 0.8 }}>
                      <p style={{ fontSize: "12px", lineHeight: 1.5 }}>{m.text}</p>
                      <p style={{ fontSize: "10px", color: T.textMuted, textAlign: "right", marginTop: 2 }}>
                        {new Date(m.time).toLocaleDateString()} {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "11px", color: T.textMuted }}>{archivedMessages.length} message{archivedMessages.length !== 1 ? "s" : ""}</p>
              <Btn onClick={unarchiveConversation}>Restore Messages</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* Archive confirmation dialog */}
      <Modal open={archiveConfirm} onClose={() => setArchiveConfirm(false)} title="Clear & Archive Conversation">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0 16px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.warn}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="alert-triangle" size={18} color={T.warn} />
          </div>
          <div>
            <p style={{ fontSize: "13px", lineHeight: 1.5, marginBottom: 6 }}>
              This will clear <strong>{messages.length} message{messages.length !== 1 ? "s" : ""}</strong> from the conversation with <strong>{partnerName}</strong>.
            </p>
            <p style={{ fontSize: "12px", color: T.textMuted, lineHeight: 1.5 }}>
              Messages will be archived in the database and can be retrieved if needed, but will no longer appear in the chat.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="outline" onClick={() => setArchiveConfirm(false)}>Cancel</Btn>
          <Btn onClick={archiveConversation} style={{ background: T.warn, borderColor: T.warn }}>Clear & Archive</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: DASHBOARD
// ════════════════════════════════════════════
const AdminDash = ({ onNav }) => {
  const { schedule, setSchedule, residents, setResidents, masterProgram, messages, showToast, notifications, setNotifications } = useData();
  const [pendingAgreements, setPendingAgreements] = useState([]);
  const [gustoResidents, setGustoResidents] = useState([]);
  const [noteModal, setNoteModal] = useState(false);
  const [noteTarget, setNoteTarget] = useState(null); // { residentId, skillId? }
  const [noteText, setNoteText] = useState("");
  const [reviewModal, setReviewModal] = useState(null); // notification object
  const [reviewText, setReviewText] = useState("");
  const [advanceTech, setAdvanceTech] = useState(false);
  const [advanceTiming, setAdvanceTiming] = useState(false);
  const [expandedTrainee, setExpandedTrainee] = useState(null);

  // Fetch agreements pending countersign + Gusto status from Supabase
  const loadPending = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, agreement_signed, agreement_date, agreement_countersigned")
      .eq("role", "resident")
      .eq("agreement_signed", true)
      .or("agreement_countersigned.is.null,agreement_countersigned.eq.false");
    setPendingAgreements(data || []);

    const { data: gusto } = await supabase
      .from("profiles")
      .select("id, name, email, gusto_completed")
      .eq("role", "resident");
    setGustoResidents(gusto || []);
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

  const saveNote = async () => {
    if (!noteText.trim() || !noteTarget) return;
    if (noteTarget.skillId) {
      // Insert timing log as a note entry, then add comment
      const { data: inserted, error } = await supabase.from("timing_logs").insert({
        user_id: noteTarget.residentId, skill_id: noteTarget.skillId, minutes: 0, type: "mannequin", date: today, note: "",
      }).select().single();
      if (error) { console.error(error); showToast("Error saving note"); return; }
      await supabase.from("log_comments").insert({
        log_id: inserted.id, from_role: "educator", author_name: "Admin", text: noteText.trim(),
      });
      // Update local state
      setResidents((p) => p.map((x) => {
        if (x.id !== noteTarget.residentId) return x;
        const logs = { ...(x.timingLogs || {}) };
        const existing = [...(logs[noteTarget.skillId] || [])];
        existing.push({ id: inserted.id, minutes: 0, type: "mannequin", date: today, note: "", comments: [{ from: "educator", text: noteText.trim(), ts: new Date().toISOString(), name: "Admin" }] });
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
    // Persist to Supabase
    if (notif.id) supabase.from("notifications").update({ read: true }).eq("id", notif.id).then();
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    const { residentId, skillId, logIdx } = reviewModal;
    const r2 = residents.find((x) => x.id === residentId);
    const entries = (r2?.timingLogs || {})[skillId] || [];
    const logEntry = entries[logIdx];
    // Optimistic local update
    setResidents((prev) => prev.map((r) => {
      if (r.id !== residentId) return r;
      const logs = { ...(r.timingLogs || {}) };
      const ents = [...(logs[skillId] || [])];
      if (ents[logIdx] !== undefined) {
        const prevComments = ents[logIdx].comments || [];
        const newComment = reviewText.trim() ? { from: "educator", text: reviewText.trim(), ts: new Date().toISOString(), name: "Admin" } : null;
        ents[logIdx] = { ...ents[logIdx], comments: newComment ? [...prevComments, newComment] : prevComments };
      }
      logs[skillId] = ents;
      let prog = { ...(r.progress || {}) };
      const cur = prog[skillId] || { technique: 0, timing: 0 };
      if (advanceTech && cur.technique < 3) cur.technique++;
      if (advanceTiming && cur.timing < 3) cur.timing++;
      prog[skillId] = cur;
      return { ...r, timingLogs: logs, progress: prog };
    }));
    setNotifications((prev) => prev.map((n) => n.id === reviewModal.id ? { ...n, reviewed: true } : n));
    // Persist to Supabase
    if (reviewModal.id) supabase.from("notifications").update({ reviewed: true }).eq("id", reviewModal.id).then();
    showToast("Review submitted");
    setReviewModal(null);
    // Persist to Supabase
    if (logEntry?.id && reviewText.trim()) {
      await supabase.from("log_comments").insert({
        log_id: logEntry.id, from_role: "educator", author_name: "Admin", text: reviewText.trim(),
      });
    }
    // Advance stages in Supabase
    if (advanceTech || advanceTiming) {
      const r3 = residents.find((x) => x.id === residentId);
      const cur = r3?.progress?.[skillId] || { technique: 0, timing: 0 };
      const newTech = advanceTech && cur.technique < 3 ? cur.technique + 1 : cur.technique;
      const newTiming = advanceTiming && cur.timing < 3 ? cur.timing + 1 : cur.timing;
      await supabase.from("resident_skills").upsert({
        user_id: residentId, skill_id: skillId, technique: newTech, timing: newTiming,
      }, { onConflict: "user_id,skill_id" });
    }
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
                <Avatar name={r.name} size={32} photo={r.photo} ringColor={cohortColor(r.cohort)} />
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
              <Avatar name={r.name} size={48} photo={r.photo} ringColor={cohortColor(r.cohort)} />
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
                          <Icon name="target" size={10} color={T.gold} />
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

      {/* Gusto Payroll Setup */}
      {gustoResidents.filter((r) => !r.gusto_completed).length > 0 && (
        <Card style={{ padding: 22, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="clipboard" size={18} color={T.charcoal} /> Payroll Setup
            </h3>
            <Badge color={T.textMuted}>{gustoResidents.filter((r) => !r.gusto_completed).length} pending</Badge>
          </div>
          <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: 12 }}>
            Add employees in Gusto — they'll receive an email invite automatically. Mark complete once they finish.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gustoResidents.filter((r) => !r.gusto_completed).map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: T.radiusSm, background: T.cream, border: `1px solid ${T.creamDark}` }}>
                <Avatar name={r.name} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500 }}>{r.name}</p>
                  <p style={{ fontSize: "11px", color: T.textMuted }}>{r.email}</p>
                </div>
                <button
                  onClick={async () => {
                    const now = localDate();
                    await supabase.from("profiles").update({ gusto_completed: true, gusto_date: now }).eq("id", r.id);
                    loadPending();
                    showToast("Marked as complete");
                  }}
                  style={{ background: T.charcoal, color: T.cream, border: "none", borderRadius: T.radiusSm, padding: "6px 12px", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
                >Mark Complete</button>
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
              <Icon name="target" size={18} color={T.gold} /> Active Focus
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
                  <Avatar name={r?.name} size={28} photo={r?.photo} ringColor={cohortColor(r?.cohort)} />
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
                          <Avatar name={t.resident.name} size={22} photo={t.resident.photo} ringColor={cohortColor(t.resident.cohort)} />
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
                  <Avatar name={r.name} size={36} photo={r.photo} ringColor={cohortColor(r.cohort)} />
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
                          {isFocus && <Icon name="target" size={9} color={T.gold} />}
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
                <Avatar name={r?.name} size={28} photo={r?.photo} ringColor={cohortColor(r?.cohort)} />
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
                <Avatar name={r?.name} size={32} photo={r?.photo} ringColor={cohortColor(r?.cohort)} />
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
  const [form, setForm] = useState({ title: "", date: localDate(), time: "9:00 AM", duration: "60", type: "skill", assignTo: "all", skillId: "", repeat: "none", repeatUntil: "", repeatDays: [] });
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
    setForm({ title: "", date: date || localDate(), time: "9:00 AM", duration: "60", type: "skill", assignTo: "all", skillId: "", repeat: "none", repeatUntil: "", repeatDays: [] });
    setEditId(null);
    setModal(true);
  };
  const openEdit = (ev) => {
    const timeParts = ev.time?.split("–").map((s) => s.trim()) || [];
    const startTime = timeParts[0] || ev.time || "9:00 AM";
    const dur = timeParts.length === 2 ? (() => { const s = parseTime12(timeParts[0]), e = parseTime12(timeParts[1]); return s != null && e != null ? String(Math.round((e - s) * 60)) : "60"; })() : "60";
    setForm({ title: ev.title, date: ev.date, time: startTime, duration: dur, type: ev.type, assignTo: ev.assignTo || "all", skillId: ev.skillId || "" });
    setEditId(ev.id);
    setModal(true);
  };

  // Auto-fill title when skill is selected
  const handleSkillChange = (skillId) => {
    const sk = allSkills.find((s) => s.id === skillId);
    setForm((f) => ({ ...f, skillId, title: sk ? sk.name : f.title }));
  };

  const buildTimeRange = (startStr, durationMin) => {
    const startH = parseTime12(startStr);
    if (startH == null) return startStr;
    const endH = startH + durationMin / 60;
    const fmt = (h) => {
      const hr = Math.floor(h);
      const min = Math.round((h - hr) * 60);
      const ampm = hr >= 12 ? "PM" : "AM";
      const display = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
      return `${display}:${String(min).padStart(2, "0")} ${ampm}`;
    };
    return `${fmt(startH)} – ${fmt(endH)}`;
  };

  const save = async () => {
    if (!form.title.trim()) return;
    const timeStr = buildTimeRange(form.time, parseInt(form.duration, 10) || 60);
    const baseEvent = { title: form.title.trim(), time: timeStr, type: form.type, assignTo: form.assignTo, skillId: form.type === "skill" ? (form.skillId || null) : null };

    if (editId) {
      const row = { title: baseEvent.title, date: form.date, time: timeStr, type: baseEvent.type, assign_to: baseEvent.assignTo, skill_id: baseEvent.skillId, notes: null };
      await supabase.from("schedule").update(row).eq("id", editId);
      setSchedule((p) => p.map((e) => (e.id === editId ? { ...e, ...baseEvent, date: form.date } : e)));
      showToast("Event updated");
    } else {
      // Generate dates for recurring events
      const dates = [form.date];
      if (form.repeat !== "none" && form.repeatUntil) {
        const start = new Date(form.date + "T00:00:00");
        const end = new Date(form.repeatUntil + "T00:00:00");
        const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (form.repeat === "custom" && form.repeatDays.length > 0) {
          // Custom days of week: 0=Sun, 1=Mon, ..., 6=Sat
          let cursor = new Date(start);
          cursor.setDate(cursor.getDate() + 1);
          while (cursor <= end) {
            if (form.repeatDays.includes(cursor.getDay())) dates.push(fmtDate(cursor));
            cursor.setDate(cursor.getDate() + 1);
          }
        } else {
          const intervalDays = form.repeat === "daily" ? 1 : form.repeat === "weekly" ? 7 : 14;
          let cursor = new Date(start);
          cursor.setDate(cursor.getDate() + intervalDays);
          while (cursor <= end) {
            dates.push(fmtDate(cursor));
            cursor.setDate(cursor.getDate() + intervalDays);
          }
        }
      }

      const seriesId = dates.length > 1 ? uid() : null;
      const rows = dates.map((date) => ({ title: baseEvent.title, date, time: timeStr, type: baseEvent.type, assign_to: baseEvent.assignTo, skill_id: baseEvent.skillId, notes: null, series_id: seriesId }));
      const { data } = await supabase.from("schedule").insert(rows).select();
      if (data) {
        const newEvents = data.map((d) => ({ id: d.id, title: d.title, date: d.date, time: d.time, type: d.type || "general", assignTo: d.assign_to || "all", skillId: d.skill_id, seriesId: d.series_id }));
        setSchedule((p) => [...p, ...newEvents]);
      }
      showToast(dates.length > 1 ? `${dates.length} events added` : "Event added");
    }
    setModal(false);
  };
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, seriesId }
  const rem = async (id) => {
    await supabase.from("schedule").delete().eq("id", id);
    setSchedule((p) => p.filter((e) => e.id !== id));
    setDeleteConfirm(null);
    showToast("Event removed");
  };
  const remSeries = async (seriesId) => {
    await supabase.from("schedule").delete().eq("series_id", seriesId);
    setSchedule((p) => p.filter((e) => e.seriesId !== seriesId));
    setDeleteConfirm(null);
    showToast("Series removed");
  };
  const handleDayClick = (date) => { cal.setSelectedDate(date); };
  const selectedEvents = cal.selectedDate ? schedule.filter((e) => e.date === cal.selectedDate) : [];

  const getAssignLabel = (ev) => {
    if (ev.assignTo === "all") return `All ${TL.pl}`;
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Btn variant="gold" onClick={() => openNew(cal.selectedDate)}>
              <Icon name="plus" size={14} color={T.gold} /> Add to this day
            </Btn>
          </div>
          <DayEventList date={cal.selectedDate} schedule={schedule} gcalEvents={gcalEvents} masterProgram={masterProgram} />
          {/* Editable event list below timeline */}
          {selectedEvents.length > 0 && (
            <div style={{ marginTop: 20, borderTop: `1px solid ${T.lightLine}`, paddingTop: 16 }}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 8 }}>Manage Events</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedEvents.map((ev) => (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: T.radiusSm, background: T.cream, fontSize: "12px" }}>
                    <div style={{ width: 3, height: 24, borderRadius: 2, background: getEvColor(ev, masterProgram) }} />
                    <span style={{ flex: 1, fontWeight: 500 }}>{ev.title}</span>
                    <span style={{ color: T.textMuted }}>{ev.time}</span>
                    {ev.seriesId && <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: T.charcoalMuted, color: T.textMuted }}>SERIES</span>}
                    <button onClick={() => openEdit(ev)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color={T.textMuted} /></button>
                    <button onClick={() => ev.seriesId ? setDeleteConfirm({ id: ev.id, seriesId: ev.seriesId, title: ev.title }) : rem(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="trash" size={14} color={T.danger} /></button>
                  </div>
                ))}
              </div>
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
              {masterProgram.filter((c) => !c.archived).map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.skills.filter((s) => !s.archived).map((sk) => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
                </optgroup>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Event Title">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={form.type === "mannequin" ? "Mannequin Practice" : form.type === "model" ? "Live Model Day" : "Event name"} style={iSt} />
        </FormField>

        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <FormField label="Date"><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={iSt} /></FormField>
          <FormField label="Start Time"><input value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="10:00 AM" style={iSt} /></FormField>
          <FormField label="Duration">
            <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} style={selSt}>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hr</option>
              <option value="90">1.5 hr</option>
              <option value="120">2 hr</option>
              <option value="180">3 hr</option>
              <option value="240">4 hr</option>
              <option value="360">6 hr</option>
              <option value="480">8 hr (all day)</option>
            </select>
          </FormField>
        </div>

        {/* Assign to */}
        <FormField label="Assign To">
          <select value={form.assignTo} onChange={(e) => setForm((f) => ({ ...f, assignTo: e.target.value }))} style={selSt}>
            <option value="all">All {TL.p} (Cohort-wide)</option>
            {residents.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </FormField>

        {/* Repeat (new events only) */}
        {!editId && (
          <>
            <div className="r-grid" style={{ display: "grid", gridTemplateColumns: form.repeat !== "none" ? "1fr 1fr" : "1fr", gap: 12 }}>
              <FormField label="Repeat">
                <select value={form.repeat} onChange={(e) => setForm((f) => ({ ...f, repeat: e.target.value, repeatDays: [] }))} style={selSt}>
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="custom">Custom days...</option>
                </select>
              </FormField>
              {form.repeat !== "none" && (
                <FormField label="Repeat until">
                  <input type="date" value={form.repeatUntil} onChange={(e) => setForm((f) => ({ ...f, repeatUntil: e.target.value }))} style={iSt} />
                </FormField>
              )}
            </div>
            {form.repeat === "custom" && (
              <FormField label="Days of the week">
                <div style={{ display: "flex", gap: 6 }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => {
                    const active = form.repeatDays.includes(i);
                    return (
                      <button key={day} onClick={() => setForm((f) => ({ ...f, repeatDays: active ? f.repeatDays.filter((d) => d !== i) : [...f.repeatDays, i] }))} style={{
                        width: 40, height: 36, borderRadius: T.radiusSm, fontSize: "11px", fontWeight: 600, cursor: "pointer",
                        border: active ? `2px solid ${T.gold}` : `1px solid ${T.creamDark}`,
                        background: active ? T.gold + "20" : T.cream,
                        color: active ? T.charcoal : T.textMuted,
                      }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </FormField>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={save}>{editId ? "Save Changes" : "Add Event"}</Btn>
        </div>
      </Modal>

      {/* Delete series confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Event" width={400}>
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 16 }}>
          <strong>{deleteConfirm?.title}</strong> is part of a recurring series.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn variant="outline" onClick={() => rem(deleteConfirm?.id)}>Delete this event only</Btn>
          <Btn variant="danger" onClick={() => remSeries(deleteConfirm?.seriesId)}>Delete entire series</Btn>
          <Btn variant="outline" onClick={() => setDeleteConfirm(null)} style={{ color: T.textMuted }}>Cancel</Btn>
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
  // Filter out archived items for the admin editing view
  const activeProgram = masterProgram.filter((c) => !c.archived).map((c) => ({ ...c, skills: c.skills.filter((s) => !s.archived) }));
  const [masterTab, setMasterTab] = useState("program");
  const [catModal, setCatModal] = useState(false);
  const [skModal, setSkModal] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newCatColor, setNewCatColor] = useState(null);
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
    while (i < len) {
      const row = [];
      let inRow = true;
      while (inRow && i < len) {
        if (text[i] === '"') {
          // Quoted field — read until closing quote (handles newlines inside quotes)
          i++; let val = "";
          while (i < len) {
            if (text[i] === '"') {
              if (i + 1 < len && text[i + 1] === '"') { val += '"'; i += 2; }
              else { i++; break; }
            } else { val += text[i]; i++; }
          }
          row.push(val);
        } else {
          // Unquoted field
          let val = "";
          while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") { val += text[i]; i++; }
          row.push(val);
        }
        // After field: comma = next field, newline = end of row, EOF = end
        if (i < len && text[i] === ",") { i++; }
        else { inRow = false; }
      }
      // Skip line ending
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
        const hdr = rows[0].map((h) => h.trim().replace(/^\uFEFF/, "").toLowerCase());
        const catIdx = hdr.findIndex((h) => h === "category" || h === "cat");
        const nameIdx = hdr.findIndex((h) => h === "skill name" || h === "name" || h === "skill");
        if (catIdx === -1 || nameIdx === -1) { setCsvError(`CSV must have 'Category' and 'Skill Name' columns. Found headers: ${rows[0].map((h) => h.trim()).join(", ")}`); return; }
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

  const confirmCsvImport = async () => {
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
    // Build updated program with DB persistence
    const next = masterProgram.map((c) => ({ ...c, skills: [...c.skills] }));
    for (const csvCat of csvPreview.categories) {
      let existing = next.find((c) => c.name.toLowerCase() === csvCat.name.toLowerCase());
      if (!existing) {
        const nextColor = CAT_COLORS[(next.length) % CAT_COLORS.length];
        const { data: catData } = await supabase.from("categories").insert({ name: csvCat.name, color: nextColor, videos: [], sort_order: next.length }).select().single();
        if (!catData) continue;
        existing = { id: catData.id, name: catData.name, color: catData.color, videos: [], skills: [] };
        next.push(existing);
      }
      for (const csvSk of csvCat.skills) {
        const existSk = existing.skills.find((s) => s.name.toLowerCase() === csvSk.name.toLowerCase());
        const sop = {
          steps: wrapOl(csvSk.steps), mistakes: wrapList(csvSk.mistakes),
          consultation: wrapList(csvSk.consultation), tips: `<p>${csvSk.tips || ""}</p>`,
          tools: wrapList(csvSk.tools),
        };
        if (existSk) {
          const mergedSop = { ...existSk.sop, ...Object.fromEntries(Object.entries(sop).filter(([, v]) => v && v !== "<p></p>")) };
          Object.assign(existSk, {
            type: csvSk.type || existSk.type,
            targetMin: csvSk.targetMin || existSk.targetMin,
            maxMin: csvSk.maxMin || existSk.maxMin,
            sop: mergedSop,
          });
          await supabase.from("skills").update({ type: existSk.type, target_min: existSk.targetMin, max_min: existSk.maxMin, sop: mergedSop }).eq("id", existSk.id);
        } else {
          const { data: skData } = await supabase.from("skills").insert({
            name: csvSk.name, type: csvSk.type || "service", target_min: csvSk.targetMin || 0, max_min: csvSk.maxMin || 0,
            videos: [], sop, category_id: existing.id, sort_order: existing.skills.length,
          }).select().single();
          if (skData) {
            existing.skills.push({ id: skData.id, name: skData.name, type: skData.type, targetMin: skData.target_min, maxMin: skData.max_min, videos: [], sop: skData.sop });
          }
        }
      }
    }
    setMasterProgram(next);
    const parts = [];
    if (csvPreview.newCatCount) parts.push(`${csvPreview.newCatCount} new categories`);
    if (csvPreview.newSkCount) parts.push(`${csvPreview.newSkCount} new skills`);
    if (csvPreview.updateSkCount) parts.push(`${csvPreview.updateSkCount} skills updated`);
    showToast("Imported: " + parts.join(", "));
    setCsvImportModal(false); setCsvPreview(null); setCsvError("");
  };

  const addCat = async () => {
    if (!newCat.trim()) return;
    const color = newCatColor || CAT_COLORS[masterProgram.length % CAT_COLORS.length];
    const { data } = await supabase.from("categories").insert({ name: newCat.trim(), color, videos: [], sort_order: masterProgram.length }).select().single();
    if (data) setMasterProgram((p) => [...p, { id: data.id, name: data.name, color: data.color, videos: data.videos || [], skills: [] }]);
    setNewCat(""); setNewCatColor(null); setCatModal(false); showToast("Category added");
  };

  // Delete confirmation + archive
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: "cat"|"skill", catId, skillId?, name, details }
  const [showArchive, setShowArchive] = useState(false);
  const [archived, setArchived] = useState([]);

  // Load archived items from DB on mount
  useEffect(() => {
    (async () => {
      const mapSkill = (s) => ({ id: s.id, name: s.name, type: s.type, targetMin: s.target_min, maxMin: s.max_min, videos: s.videos || [], sop: s.sop });
      const [{ data: arCats }, { data: arSkills }, { data: allSkillsForArCats }] = await Promise.all([
        supabase.from("categories").select("*").not("archived_at", "is", null).order("archived_at"),
        supabase.from("skills").select("*").not("archived_at", "is", null).order("archived_at"),
        // Get ALL skills (including archived) that belong to archived categories
        supabase.from("skills").select("*").order("sort_order"),
      ]);
      const archivedCatIds = new Set((arCats || []).map((c) => c.id));
      const items = [
        ...(arCats || []).map((c) => {
          // Include all skills that belong to this archived category
          const catSkills = (allSkillsForArCats || []).filter((s) => s.category_id === c.id);
          return { id: c.id, name: c.name, color: c.color, videos: c.videos || [],
            skills: catSkills.map(mapSkill), archivedAt: c.archived_at.split("T")[0], archiveType: "category" };
        }),
        // Individual archived skills (not part of archived categories)
        ...(arSkills || []).filter((s) => !archivedCatIds.has(s.category_id)).map((s) => {
          return { ...mapSkill(s), fromCategory: null, archivedAt: s.archived_at.split("T")[0], archiveType: "skill" };
        }),
      ];
      if (items.length) setArchived(items);
    })();
  }, []);

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
  const executeDelete = async () => {
    if (!deleteTarget) return;
    const now = new Date().toISOString();
    if (deleteTarget.type === "cat") {
      const cat = masterProgram.find((c) => c.id === deleteTarget.catId);
      if (cat) setArchived((p) => [...p, { ...cat, archivedAt: localDate(), archiveType: "category" }]);
      setMasterProgram((p) => p.filter((c) => c.id !== deleteTarget.catId));
      // Soft-delete: set archived_at on category and its skills
      await supabase.from("skills").update({ archived_at: now }).eq("category_id", deleteTarget.catId);
      await supabase.from("categories").update({ archived_at: now }).eq("id", deleteTarget.catId);
      showToast("Category archived");
    } else {
      const cat = masterProgram.find((c) => c.id === deleteTarget.catId);
      const sk = cat?.skills.find((s) => s.id === deleteTarget.skillId);
      if (sk) setArchived((p) => [...p, { ...sk, fromCategory: cat?.name, archivedAt: localDate(), archiveType: "skill" }]);
      setMasterProgram((p) => p.map((c) => c.id === deleteTarget.catId ? { ...c, skills: c.skills.filter((s) => s.id !== deleteTarget.skillId) } : c));
      await supabase.from("skills").update({ archived_at: now }).eq("id", deleteTarget.skillId);
      showToast("Skill archived");
    }
    setDeleteModal(false);
    setDeleteTarget(null);
  };
  const restoreItem = async (item, idx) => {
    if (item.archiveType === "category") {
      // Clear archived_at on category and its skills
      await supabase.from("categories").update({ archived_at: null }).eq("id", item.id);
      await supabase.from("skills").update({ archived_at: null }).eq("category_id", item.id);
      const { archivedAt, archiveType, ...cat } = item;
      setMasterProgram((p) => [...p, cat]);
    } else {
      // Clear archived_at on skill
      await supabase.from("skills").update({ archived_at: null }).eq("id", item.id);
      const { fromCategory, archivedAt, archiveType, ...sk } = item;
      const targetCatObj = masterProgram.find((c) => c.name === fromCategory) || masterProgram[0];
      if (targetCatObj) {
        setMasterProgram((p) => p.map((c) => c.id === targetCatObj.id ? { ...c, skills: [...c.skills, sk] } : c));
      }
    }
    setArchived((p) => p.filter((_, i) => i !== idx));
    showToast("Restored");
  };
  const permanentDelete = async (item, idx) => {
    if (item.archiveType === "category") {
      await supabase.from("skills").delete().eq("category_id", item.id);
      await supabase.from("categories").delete().eq("id", item.id);
    } else {
      await supabase.from("skills").delete().eq("id", item.id);
    }
    setArchived((p) => p.filter((_, i) => i !== idx));
    showToast("Permanently deleted");
  };

  const openAddSk = (cid) => { setTargetCat(cid); setNewSk(""); setNewSkType("service"); setEditTarget(""); setEditMax(""); setNewSkSop({ steps: "", mistakes: "", consultation: "", tips: "", tools: "" }); setNewSkSopTab("steps"); setSkModal(true); };
  const addSk = async () => {
    if (!newSk.trim() || !targetCat) return;
    const targetCatObj = masterProgram.find((c) => c.id === targetCat);
    const row = {
      name: newSk.trim(), type: newSkType, videos: [],
      target_min: newSkType === "service" ? (parseInt(editTarget) || 0) : 0,
      max_min: newSkType === "service" ? (parseInt(editMax) || 0) : 0,
      category_id: targetCat,
      sort_order: targetCatObj ? targetCatObj.skills.length : 0,
    };
    const hasSop = Object.values(newSkSop).some((v) => v && v.trim());
    if (hasSop) row.sop = { ...newSkSop };
    const { data } = await supabase.from("skills").insert(row).select().single();
    if (data) {
      const skill = { id: data.id, name: data.name, type: data.type, targetMin: data.target_min, maxMin: data.max_min, videos: data.videos || [], sop: data.sop };
      setMasterProgram((p) => p.map((c) => c.id === targetCat ? { ...c, skills: [...c.skills, skill] } : c));
    }
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
  const saveEditSkill = async () => {
    if (!editSkillData || !editSkillCatId) return;
    const t = parseInt(editTarget) || 0;
    const m = parseInt(editMax) || 0;
    const hasSop = Object.values(sopData).some((v) => v && v.trim());
    const updates = { target_min: t, max_min: m };
    if (hasSop) updates.sop = { ...sopData };
    setMasterProgram((p) => p.map((c) => c.id === editSkillCatId
      ? { ...c, skills: c.skills.map((s) => s.id === editSkillData.id ? { ...s, targetMin: t, maxMin: m, sop: hasSop ? { ...sopData } : s.sop } : s) }
      : c
    ));
    await supabase.from("skills").update(updates).eq("id", editSkillData.id);
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
  const saveRename = async () => {
    if (!renameName.trim()) return;
    if (renameType === "cat") {
      setMasterProgram((p) => p.map((c) => c.id === renameCatId ? { ...c, name: renameName.trim(), color: renameColor } : c));
      await supabase.from("categories").update({ name: renameName.trim(), color: renameColor }).eq("id", renameCatId);
      showToast("Category updated");
    } else {
      setMasterProgram((p) => p.map((c) => c.id === renameCatId
        ? { ...c, skills: c.skills.map((s) => s.id === renameSkillId ? { ...s, name: renameName.trim() } : s) }
        : c
      ));
      await supabase.from("skills").update({ name: renameName.trim() }).eq("id", renameSkillId);
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
  const saveVideo = async () => {
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
    // Persist video array to DB
    if (videoTarget.type === "cat") {
      const cat = masterProgram.find((c) => c.id === videoTarget.catId);
      await supabase.from("categories").update({ videos: [...(cat?.videos || []), vid] }).eq("id", videoTarget.catId);
    } else {
      const cat = masterProgram.find((c) => c.id === videoTarget.catId);
      const sk = cat?.skills.find((s) => s.id === videoTarget.skillId);
      await supabase.from("skills").update({ videos: [...(sk?.videos || []), vid] }).eq("id", videoTarget.skillId);
    }
    showToast("Video added");
    setVideoModal(false);
  };
  const removeVideo = async (catId, skillId, videoId) => {
    setMasterProgram((p) => p.map((c) => {
      if (c.id !== catId) return c;
      if (!skillId) return { ...c, videos: (c.videos || []).filter((v) => v.id !== videoId) };
      return { ...c, skills: c.skills.map((s) => s.id === skillId ? { ...s, videos: (s.videos || []).filter((v) => v.id !== videoId) } : s) };
    }));
    // Persist updated video array to DB
    if (!skillId) {
      const cat = masterProgram.find((c) => c.id === catId);
      await supabase.from("categories").update({ videos: (cat?.videos || []).filter((v) => v.id !== videoId) }).eq("id", catId);
    } else {
      const cat = masterProgram.find((c) => c.id === catId);
      const sk = cat?.skills.find((s) => s.id === skillId);
      await supabase.from("skills").update({ videos: (sk?.videos || []).filter((v) => v.id !== videoId) }).eq("id", skillId);
    }
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
      // Persist sort order to DB
      arr.forEach((c, i) => supabase.from("categories").update({ sort_order: i }).eq("id", c.id));
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
      const result = updated.map((c) => {
        if (c.id !== targetCatId) return c;
        const arr = [...c.skills];
        if (targetSkId) {
          const toIdx = arr.findIndex((s) => s.id === targetSkId);
          if (toIdx !== -1) { arr.splice(toIdx, 0, skill); return { ...c, skills: arr }; }
        }
        arr.push(skill);
        return { ...c, skills: arr };
      });
      // Persist: update category_id if moved across categories, and sort_order for affected categories
      const movedAcross = dragSkCatId !== targetCatId;
      if (movedAcross) supabase.from("skills").update({ category_id: targetCatId }).eq("id", dragSkId);
      result.forEach((c) => {
        if (c.id === targetCatId || (movedAcross && c.id === dragSkCatId)) {
          c.skills.forEach((s, i) => supabase.from("skills").update({ sort_order: i }).eq("id", s.id));
        }
      });
      return result;
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

  const totalSk = activeProgram.reduce((a, c) => a + c.skills.length, 0);

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
  const savePreset = async () => {
    if (!presetName.trim()) return;
    const sids = [...presetSelIds];
    if (presetEditId) {
      await supabase.from("presets").update({ name: presetName.trim(), skill_ids: sids }).eq("id", presetEditId);
      setPresets((p) => p.map((pr) => (pr.id === presetEditId ? { ...pr, name: presetName.trim(), skillIds: sids } : pr)));
      showToast("Preset updated");
    } else {
      const { data } = await supabase.from("presets").insert({ name: presetName.trim(), skill_ids: sids }).select().single();
      if (data) setPresets((p) => [...p, { id: data.id, name: data.name, skillIds: data.skill_ids || [] }]);
      showToast("Preset created");
    }
    setPresetModal(false);
  };
  const removePreset = async (id) => {
    await supabase.from("presets").delete().eq("id", id);
    setPresets((p) => p.filter((pr) => pr.id !== id));
    showToast("Preset removed");
  };

  return (
    <div className="fade-up">
      <SectionTitle sub={masterTab === "program" ? `${activeProgram.length} categories · ${totalSk} total skills` : `${presets.length} presets · Quick-assign skill combinations`}>
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
              <Btn variant={showArchive ? "gold" : "outline"} onClick={() => setShowArchive(!showArchive)}>
                <Icon name="archive" size={14} color={showArchive ? T.charcoal : T.textMuted} /> Archive ({archived.length})
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
                <Btn variant="danger" onClick={() => permanentDelete(item, idx)} style={{ padding: "4px 10px", fontSize: "10px" }}>
                  Delete
                </Btn>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {activeProgram.map((cat) => {
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
                {activeProgram.map((cat) => {
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
              {activeProgram.map((cat) => {
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
        <FormField label="Category Name"><input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Texture & Perming" style={iSt} onKeyDown={(e) => e.key === "Enter" && addCat()} autoFocus /></FormField>
        <FormField label="Color">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CAT_COLORS.map((c) => (
              <button key={c} onClick={() => setNewCatColor(c)} style={{
                width: 28, height: 28, borderRadius: "50%", border: newCatColor === c ? "2.5px solid " + T.charcoal : "2.5px solid transparent",
                background: c, cursor: "pointer", transition: "border .15s",
              }} />
            ))}
            <label style={{
              width: 28, height: 28, borderRadius: "50%", border: newCatColor && !CAT_COLORS.includes(newCatColor) ? "2.5px solid " + T.charcoal : "2.5px solid " + T.lightLine,
              background: `conic-gradient(#C26A6A, #C9A96E, #3D6B5E, #4A6FA5, #6B4D94, #C26A6A)`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
            }} title="Custom color">
              <input type="color" value={newCatColor || "#C9A96E"} onChange={(e) => setNewCatColor(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </label>
          </div>
        </FormField>
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
              {sec.key === "mistakes" && `Common mistakes ${TL.pl} make. Use bullet list.`}
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
  const [form, setForm] = useState({ name: "", email: "", cohort: "", phone: "", photo: null, onboarding: { agreement: true, enrollment: true, gusto: true } });
  const [photoCropOpen, setPhotoCropOpen] = useState(false);
  const [cohortModal, setCohortModal] = useState(false);
  const [newCohort, setNewCohort] = useState("");
  const [newCohortColor, setNewCohortColor] = useState(null);
  const [editingCohortColor, setEditingCohortColor] = useState(null);
  const [, forceUpdate] = useState(0);
  const [cohorts, setCohorts] = useState([]);

  // Load cohorts from Supabase settings (source of truth), then ensure any resident cohorts are included
  useEffect(() => {
    supabase.from("settings").select("value").eq("key", "cohorts").maybeSingle().then(({ data }) => {
      const saved = data?.value || [];
      const fromResidents = [...new Set(residents.map((r) => r.cohort).filter(Boolean))];
      // Saved list is authoritative — only add resident cohorts not already tracked
      const merged = [...new Set([...saved, ...fromResidents])].sort();
      setCohorts(merged);
      // Persist any newly discovered resident cohorts back to settings
      if (merged.length > saved.length) persistCohorts(merged);
    });
  }, []);

  const persistCohorts = async (list) => {
    const { error } = await supabase.from("settings").upsert({ key: "cohorts", value: list });
    if (error) console.error("Cohort persist error:", error);
  };

  const addCohort = () => {
    const name = newCohort.trim();
    if (!name || cohorts.includes(name)) return;
    if (newCohortColor) setCohortColorMap({ ..._cohortColorMap, [name]: newCohortColor });
    const updated = [...cohorts, name].sort();
    setCohorts(updated);
    persistCohorts(updated);
    setNewCohort("");
    setNewCohortColor(null);
    setCohortModal(false);
    showToast(`Cohort "${name}" created`);
  };

  const removeCohort = (name) => {
    const inUse = residents.some((r) => r.cohort === name);
    if (inUse) { showToast(`Remove all ${TL.pl} from this cohort first`); return; }
    const updated = cohorts.filter((c) => c !== name);
    setCohorts(updated);
    persistCohorts(updated);
    setConfirmRemove(null);
    showToast("Cohort removed");
  };

  const [saving, setSaving] = useState(false);
  const openNew = (cohort) => { setForm({ name: "", email: "", cohort: cohort || "", phone: "", photo: null, onboarding: { agreement: true, enrollment: true, gusto: true } }); setModal(true); };
  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-trainee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: "create",
          name: form.name.trim(), email: form.email.trim(), cohort: form.cohort, photo: form.photo,
          onboarding_steps: Object.entries(form.onboarding).filter(([, v]) => v).map(([k]) => k),
        }),
      });
      const data = await res.json();
      console.log("invite-trainee response:", res.status, data);
      if (!res.ok) throw new Error(data.error || data.detail || `Failed to add ${TL.sl}`);
      const p = data.profile;
      // Save phone number to contacts if provided
      if (form.phone.trim()) {
        const raw = form.phone.trim().replace(/\D/g, "").replace(/^1/, "");
        if (raw.length === 10) {
          await supabase.from("contacts").upsert({ user_id: p.id, name: p.name, phone: `+1${raw}` }, { onConflict: "user_id" });
        }
      }
      setResidents((prev) => [...prev, { id: p.id, name: p.name, email: p.email, cohort: p.cohort || "", photo: p.photo, skillIds: [], progress: {}, focusSkills: [], timingLogs: {} }]);
      showToast(`${TL.s} created — send them an invite when ready`);
      setModal(false);
    } catch (err) {
      showToast(err.message || `Failed to add ${TL.sl}`);
    }
    setSaving(false);
  };
  const sendInvite = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-trainee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ action: "invite", user_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      showToast("Invite sent!");
    } catch (err) {
      showToast(err.message || "Failed to send invite");
    }
  };
  const [confirmRemove, setConfirmRemove] = useState(null); // { type: "resident"|"cohort", id?, name }
  const deactivate = async (id) => {
    await supabase.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    setResidents((p) => p.filter((r) => r.id !== id));
    setConfirmRemove(null);
    showToast(`${TL.s} deactivated`);
  };

  const changeCohort = async (residentId, newCohortName) => {
    setResidents((p) => p.map((r) => r.id === residentId ? { ...r, cohort: newCohortName } : r));
    await supabase.from("profiles").update({ cohort: newCohortName }).eq("id", residentId);
    showToast("Moved to " + newCohortName);
  };

  const unassigned = residents.filter((r) => !r.cohort || !cohorts.includes(r.cohort));

  return (
    <div className="fade-up">
      <SectionTitle sub={`Organize ${TL.pl} by cohort`} action={
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="outline" onClick={() => setCohortModal(true)}><Icon name="plus" size={16} color={T.charcoal} /> New Cohort</Btn>
          <Btn onClick={() => openNew("")}><Icon name="plus" size={16} color={T.cream} /> Add Trainee</Btn>
        </div>
      }>
        Trainee Manager
      </SectionTitle>

      {/* Cohort groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {cohorts.map((cohort) => {
          const members = residents.filter((r) => r.cohort === cohort);
          return (
            <Card key={cohort} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.lightLine}`, background: T.cream }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <button onClick={(e) => { e.stopPropagation(); setEditingCohortColor(editingCohortColor === cohort ? null : cohort); }} style={{ width: 14, height: 14, borderRadius: "50%", background: cohortColor(cohort), border: "2px solid " + T.white, boxShadow: "0 0 0 1px " + T.creamDark, cursor: "pointer", padding: 0 }} title="Change color" />
                    {editingCohortColor === cohort && (
                      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 22, left: 0, zIndex: 50, background: T.white, borderRadius: T.radiusSm, boxShadow: T.shadowLg, padding: 10, display: "flex", gap: 5, flexWrap: "wrap", width: 180 }}>
                        {CAT_COLORS.map((c) => (
                          <button key={c} onClick={() => { setCohortColorMap({ ..._cohortColorMap, [cohort]: c }); setEditingCohortColor(null); forceUpdate((n) => n + 1); }} style={{
                            width: 24, height: 24, borderRadius: "50%", border: cohortColor(cohort) === c ? "2.5px solid " + T.charcoal : "2.5px solid transparent",
                            background: c, cursor: "pointer", transition: "border .15s",
                          }} />
                        ))}
                        <label style={{
                          width: 24, height: 24, borderRadius: "50%", border: !CAT_COLORS.includes(cohortColor(cohort)) ? "2.5px solid " + T.charcoal : "2.5px solid " + T.lightLine,
                          background: `conic-gradient(#C26A6A, #C9A96E, #3D6B5E, #4A6FA5, #6B4D94, #C26A6A)`,
                          cursor: "pointer", position: "relative", overflow: "hidden",
                        }}>
                          <input type="color" value={cohortColor(cohort) || "#C9A96E"} onChange={(e) => { setCohortColorMap({ ..._cohortColorMap, [cohort]: e.target.value }); forceUpdate((n) => n + 1); }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                        </label>
                      </div>
                    )}
                  </div>
                  <h3 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>{cohort}</h3>
                  <span style={{ fontSize: "11px", color: T.textMuted, background: T.white, padding: "2px 8px", borderRadius: 10 }}>{members.length} {members.length !== 1 ? TL.pl : TL.sl}</span>
                </div>
                {members.length === 0 && (
                  <button onClick={() => setConfirmRemove({ type: "cohort", name: cohort })} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Icon name="trash" size={14} color={T.danger} />
                  </button>
                )}
              </div>
              {members.length === 0 ? (
                <div style={{ padding: "20px 22px", textAlign: "center" }}>
                  <p style={{ fontSize: "12px", color: T.textMuted }}>No {TL.pl} in this cohort yet</p>
                </div>
              ) : (
                <div>
                  {members.map((r, i) => {
                    const { pct, done, total } = getProgress(r, masterProgram);
                    return (
                      <div key={r.id} style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 14, borderBottom: i < members.length - 1 ? `1px solid ${T.lightLine}` : "none" }}>
                        <Avatar name={r.name} size={36} photo={r.photo} ringColor={cohortColor(r.cohort)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 500 }}>{r.name}</p>
                          <p style={{ fontSize: "11px", color: T.textMuted }}>{r.email}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 60 }}><ProgressBar value={pct} height={5} /></div>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: T.gold, minWidth: 30, textAlign: "right" }}>{pct}%</span>
                        </div>
                        <button onClick={() => onNav(`a-trainees:${r.id}`)} style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>
                          <Icon name="eye" size={12} color={T.gold} /> View
                        </button>
                        <button onClick={() => setConfirmRemove({ type: "resident", id: r.id, name: r.name })} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="trash" size={14} color={T.danger} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}

        {/* Unassigned trainees */}
        {unassigned.length > 0 && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.lightLine}`, background: T.cream }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600, color: T.textMuted }}>Unassigned</h3>
                <span style={{ fontSize: "11px", color: T.textMuted, background: T.white, padding: "2px 8px", borderRadius: 10 }}>{unassigned.length}</span>
              </div>
            </div>
            <div>
              {unassigned.map((r, i) => {
                const { pct, done, total } = getProgress(r, masterProgram);
                return (
                  <div key={r.id} style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 14, borderBottom: i < unassigned.length - 1 ? `1px solid ${T.lightLine}` : "none" }}>
                    <Avatar name={r.name} size={36} photo={r.photo} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500 }}>{r.name}</p>
                      <p style={{ fontSize: "11px", color: T.textMuted }}>{r.email}</p>
                    </div>
                    <select
                      value=""
                      onChange={(e) => changeCohort(r.id, e.target.value)}
                      style={{ fontSize: "11px", border: `1px solid ${T.creamDark}`, borderRadius: 4, padding: "3px 6px", background: T.cream, color: T.textMuted, cursor: "pointer" }}
                    >
                      <option value="" disabled>Assign cohort</option>
                      {cohorts.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => onNav(`a-trainees:${r.id}`)} style={{ background: T.goldMuted, border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="eye" size={12} color={T.gold} /> View
                    </button>
                    <button onClick={() => setConfirmRemove({ type: "resident", id: r.id, name: r.name })} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="trash" size={14} color={T.danger} /></button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {cohorts.length === 0 && unassigned.length === 0 && (
          <Card style={{ padding: 48, textAlign: "center" }}>
            <p style={{ color: T.textMuted, marginBottom: 12 }}>No cohorts yet. Create one to get started.</p>
            <Btn onClick={() => setCohortModal(true)}><Icon name="plus" size={16} color={T.cream} /> Create Cohort</Btn>
          </Card>
        )}
      </div>

      {/* New Cohort Modal */}
      <Modal open={cohortModal} onClose={() => setCohortModal(false)} title="Create Cohort">
        <FormField label="Cohort Name">
          <input value={newCohort} onChange={(e) => setNewCohort(e.target.value)} placeholder="e.g. Fall 2026" style={iSt} autoFocus onKeyDown={(e) => { if (e.key === "Enter") addCohort(); }} />
        </FormField>
        <FormField label="Color">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CAT_COLORS.map((c) => (
              <button key={c} onClick={() => setNewCohortColor(c)} style={{
                width: 28, height: 28, borderRadius: "50%", border: newCohortColor === c ? "2.5px solid " + T.charcoal : "2.5px solid transparent",
                background: c, cursor: "pointer", transition: "border .15s",
              }} />
            ))}
            <label style={{
              width: 28, height: 28, borderRadius: "50%", border: newCohortColor && !CAT_COLORS.includes(newCohortColor) ? "2.5px solid " + T.charcoal : "2.5px solid " + T.lightLine,
              background: `conic-gradient(#C26A6A, #C9A96E, #3D6B5E, #4A6FA5, #6B4D94, #C26A6A)`,
              cursor: "pointer", position: "relative", overflow: "hidden",
            }} title="Custom color">
              <input type="color" value={newCohortColor || "#C9A96E"} onChange={(e) => setNewCohortColor(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </label>
          </div>
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setCohortModal(false)}>Cancel</Btn>
          <Btn onClick={addCohort}>Create</Btn>
        </div>
      </Modal>

      {/* Add Trainee Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Add ${TL.s}`}>
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
          <FormField label="Phone"><input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" style={iSt} /></FormField>
        </div>
        <FormField label="Cohort">
          <select value={form.cohort} onChange={(e) => setForm((f) => ({ ...f, cohort: e.target.value }))} style={iSt}>
            <option value="">Select cohort</option>
            {cohorts.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <details style={{ marginTop: 16, border: `1px solid ${T.lightLine}`, borderRadius: 8, padding: "0" }}>
          <summary style={{ padding: "10px 14px", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: T.text, listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Onboarding Steps</span>
            <span style={{ fontSize: "11px", fontWeight: 400, color: T.textMuted }}>
              {Object.values(form.onboarding).filter(Boolean).length} of 3 enabled
            </span>
          </summary>
          <div style={{ padding: "4px 14px 12px", borderTop: `1px solid ${T.lightLine}` }}>
            {[
              { key: "agreement", label: "Residency Agreement", desc: "Sign the salon residency agreement" },
              { key: "enrollment", label: "Tuition Enrollment", desc: "Enroll and set up tuition payments" },
              { key: "gusto", label: "Payroll Setup", desc: "Complete payroll onboarding via Gusto" },
            ].map(({ key, label, desc }) => (
              <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", cursor: "pointer", borderBottom: key !== "gusto" ? `1px solid ${T.cream}` : "none" }}>
                <input type="checkbox" checked={form.onboarding[key]} onChange={() => setForm((f) => ({ ...f, onboarding: { ...f.onboarding, [key]: !f.onboarding[key] } }))} style={{ marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: T.text }}>{label}</p>
                  <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 1 }}>{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </details>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving ? "Inviting…" : `Add ${TL.s}`}</Btn></div>
      </Modal>
      <PhotoCropModal
        open={photoCropOpen}
        onClose={() => setPhotoCropOpen(false)}
        currentPhoto={form.photo}
        onSave={(dataUrl) => setForm((f) => ({ ...f, photo: dataUrl }))}
      />
      {/* Confirm Remove Modal */}
      <Modal open={!!confirmRemove} onClose={() => setConfirmRemove(null)} title={confirmRemove?.type === "resident" ? `Deactivate ${TL.s}` : "Remove Cohort"}>
        <p style={{ fontSize: 14, color: T.text, marginBottom: 20 }}>
          {confirmRemove?.type === "resident"
            ? <>Are you sure you want to deactivate <strong>{confirmRemove?.name}</strong>? They will be removed from the active roster but their data will be preserved.</>
            : <>Are you sure you want to remove the <strong>{confirmRemove?.name}</strong> cohort? {TL.p} in this cohort will become unassigned.</>}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="outline" onClick={() => setConfirmRemove(null)}>Cancel</Btn>
          <Btn style={{ background: confirmRemove?.type === "resident" ? T.warning || T.gold : T.danger }} onClick={() => {
            if (confirmRemove?.type === "resident") deactivate(confirmRemove.id);
            else if (confirmRemove?.type === "cohort") removeCohort(confirmRemove.name);
          }}>{confirmRemove?.type === "resident" ? "Deactivate" : "Remove"}</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════
//  ADMIN: TRAINEE PROFILE (overview + track builder tabs)
// ════════════════════════════════════════════
const TraineeProfile = ({ traineeId, onNav }) => {
  const { residents, setResidents, masterProgram, schedule, setSchedule, showToast } = useData();
  const [editField, setEditField] = useState(null); // "cohort" | "phone" | null
  const [cohortVal, setCohortVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
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

  // Load phone from contacts table
  useEffect(() => {
    supabase.from("contacts").select("phone").eq("user_id", traineeId).single()
      .then(({ data }) => {
        if (data?.phone) { setSavedPhone(data.phone); setPhoneVal(data.phone); }
      });
  }, [traineeId]);

  const savePhone = async () => {
    const raw = phoneVal.trim().replace(/\D/g, "").replace(/^1/, "");
    if (!raw || raw.length !== 10) { showToast("Enter a valid 10-digit number"); return; }
    const phone = `+1${raw}`;
    if (savedPhone) {
      await supabase.from("contacts").update({ phone }).eq("user_id", traineeId);
    } else {
      const r2 = residents.find((x) => x.id === traineeId);
      await supabase.from("contacts").insert({ user_id: traineeId, name: r2?.name || "", phone });
    }
    setSavedPhone(phone);
    setEditField(null);
    showToast("Phone updated");
  };

  const saveCohort = async () => {
    const v = cohortVal.trim() || r?.cohort;
    setResidents((p) => p.map((x) => x.id === traineeId ? { ...x, cohort: v } : x));
    await supabase.from("profiles").update({ cohort: v }).eq("id", traineeId);
    setEditField(null);
    showToast("Cohort updated");
  };

  const cohortOptions = [...new Set(residents.map((x) => x.cohort).filter(Boolean))];

  const formatPhone = (p) => {
    if (!p) return "---";
    const digits = p.replace(/\D/g, "").replace(/^1/, "");
    if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    return p;
  };

  const r = residents.find((x) => x.id === traineeId);

  if (!r) {
    return (
      <div>
        <Btn variant="outline" onClick={() => onNav("a-trainees")}><Icon name="back" size={16} /> Back</Btn>
        <p style={{ marginTop: 16, color: T.textMuted }}>{TL.s} not found.</p>
      </div>
    );
  }

  const { total, done, pct } = getProgress(r, masterProgram);
  const cats = getTraineeCats(r, masterProgram);
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
  const saveSchedule = async () => {
    if (!schedForm.title.trim()) return;
    const row = {
      title: schedForm.title, date: schedForm.date, time: schedForm.time,
      type: schedForm.type, assign_to: traineeId,
      skill_id: schedForm.type === "skill" ? schedForm.skillId : null,
    };
    const { data } = await supabase.from("schedule").insert(row).select().single();
    if (data) {
      setSchedule((p) => [...p, {
        id: data.id, title: data.title, date: data.date, time: data.time,
        type: data.type || "general", assignTo: data.assign_to || "all", skillId: data.skill_id,
      }]);
    }
    showToast("Scheduled for " + r.name.split(" ")[0]);
    setSchedModal(false);
  };

  // Progress management
  const setStage = async (sid, dimension, value) => {
    // Optimistic local update
    setResidents((p) => p.map((x) => {
      if (x.id !== traineeId) return x;
      const current = x.progress?.[sid] || { technique: 0, timing: 0 };
      return { ...x, progress: { ...x.progress, [sid]: { ...current, [dimension]: value } } };
    }));
    showToast(dimension === "technique" ? TECHNIQUE_STAGES[value] : TIMING_STAGES[value]);
    // Persist to Supabase
    const r2 = residents.find((x) => x.id === traineeId);
    const current = r2?.progress?.[sid] || { technique: 0, timing: 0 };
    const updated = { ...current, [dimension]: value };
    await supabase.from("resident_skills").upsert({
      user_id: traineeId, skill_id: sid,
      technique: updated.technique || 0, timing: updated.timing || 0, done: false,
    }, { onConflict: "user_id,skill_id" });
  };
  const toggleKnowledge = async (sid) => {
    const r2 = residents.find((x) => x.id === traineeId);
    const current = r2?.progress?.[sid];
    const isDone = current && (current === true || current.done === true);
    const newDone = !isDone;
    // Optimistic local update
    setResidents((p) => p.map((x) => {
      if (x.id !== traineeId) return x;
      return { ...x, progress: { ...x.progress, [sid]: { done: newDone } } };
    }));
    showToast("Updated");
    // Persist to Supabase
    await supabase.from("resident_skills").upsert({
      user_id: traineeId, skill_id: sid,
      technique: 0, timing: 0, done: newDone,
    }, { onConflict: "user_id,skill_id" });
  };
  const openEditLog = (skillId, logIdx, log) => {
    setEditLogSkillId(skillId); setEditLogIdx(logIdx);
    setEditLogMinutes(String(log.minutes)); setEditLogType(log.type); setEditLogNote(log.note || ""); setEditLogCritique("");
    setEditLogModal(true);
  };
  const saveEditLog = async () => {
    if (!editLogMinutes || editLogSkillId === null || editLogIdx === null) return;
    const mins = parseInt(editLogMinutes);
    if (isNaN(mins) || mins <= 0) return;
    const r2 = residents.find((x) => x.id === traineeId);
    const entries = (r2?.timingLogs || {})[editLogSkillId] || [];
    const logEntry = entries[editLogIdx];
    // Optimistic update
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
    // Persist to Supabase
    if (logEntry?.id) {
      await supabase.from("timing_logs").update({ minutes: mins, type: editLogType, note: editLogNote.trim() }).eq("id", logEntry.id);
      if (editLogCritique.trim()) {
        await supabase.from("log_comments").insert({
          log_id: logEntry.id, from_role: "educator", author_name: "Admin", text: editLogCritique.trim(),
        });
      }
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "builder", label: "Edit Track" },
  ];

  return (
    <div className="fade-up">
      {/* Back button */}
      <button onClick={() => onNav("a-trainees")} style={{ background: T.goldMuted, border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 16 }}>
        <Icon name="back" size={18} color={T.gold} />
      </button>

      {/* Profile Card */}
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        {/* Identity row */}
        <div style={{ padding: "20px 28px", display: "flex", gap: 16, alignItems: "center", borderBottom: `1px solid ${T.lightLine}` }}>
          <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setPhotoModal(true)}>
            <Avatar name={r.name} size={48} photo={r.photo} ringColor={cohortColor(r.cohort)} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 600 }}>{r.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", color: T.textMuted, marginTop: 2 }}>
              <span>{r.email}</span>
              <span style={{ opacity: 0.3 }}>|</span>
              {editField === "cohort" ? (
                <select
                  value={cohortVal}
                  onChange={(e) => setCohortVal(e.target.value)}
                  onBlur={() => { if (cohortVal) saveCohort(); else setEditField(null); }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: "12px", border: `1px solid ${T.creamDark}`, borderRadius: 4, padding: "1px 4px", background: T.cream }}
                >
                  <option value="">Select</option>
                  {cohortOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <span onClick={() => { setCohortVal(r.cohort || ""); setEditField("cohort"); }} style={{ cursor: "pointer" }}>{r.cohort || "No cohort"}</span>
              )}
              <span style={{ opacity: 0.3 }}>|</span>
              {editField === "phone" ? (
                <input
                  value={phoneVal}
                  onChange={(e) => setPhoneVal(e.target.value)}
                  placeholder="(XXX) XXX-XXXX"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") savePhone();
                    if (e.key === "Escape") setEditField(null);
                  }}
                  onBlur={() => { if (phoneVal.trim()) savePhone(); else setEditField(null); }}
                  style={{ fontSize: "12px", border: `1px solid ${T.creamDark}`, borderRadius: 4, padding: "1px 6px", width: 120, background: T.cream }}
                />
              ) : (
                <span onClick={() => { setPhoneVal(savedPhone); setEditField("phone"); }} style={{ cursor: "pointer" }}>{formatPhone(savedPhone)}</span>
              )}
            </div>
          </div>
        </div>
        {/* Progress stats — prominent */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { label: "Overall Progress", value: `${pct}%`, sub: `${done}/${total} skills`, color: T.gold },
            { label: "Services", value: `${completedServices}/${serviceSkills.length}`, sub: "mastered", color: T.success },
            { label: "Knowledge", value: `${completedKnowledge}/${knowledgeSkills.length}`, sub: "complete", color: completedKnowledge === knowledgeSkills.length ? T.success : T.warn },
            { label: "Time Logs", value: `${totalLogEntries}`, sub: `${modelEntries} on models`, color: T.charcoal },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "18px 24px", textAlign: "center", borderRight: i < 3 ? `1px solid ${T.lightLine}` : "none" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: T.textMuted, marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontFamily: T.fontD, fontSize: "26px", fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 4 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </Card>

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
          {/* Current Focus */}
          <Card style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="target" size={16} color={T.gold} /> Current Focus
              </h4>
              <span style={{ fontSize: "10px", color: T.textMuted }}>{(r.focusSkills || []).length}/3 pinned</span>
            </div>
            {(r.focusSkills || []).length === 0 ? (
              <p style={{ fontSize: "12px", color: T.textMuted }}>No focus skills pinned. Use the <Icon name="target" size={11} color={T.textMuted} /> icon on skills below to pin up to 3.</p>
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
                      <button onClick={async () => {
                        const newFocus = (r.focusSkills || []).filter((id) => id !== fsId);
                        setResidents((p) => p.map((x) => x.id !== traineeId ? x : { ...x, focusSkills: newFocus }));
                        showToast("Focus removed");
                        await supabase.from("profiles").update({ focus_skills: newFocus }).eq("id", traineeId);
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
                        const toggleFocus = async () => {
                          const fs = r.focusSkills || [];
                          let newFocus;
                          if (fs.includes(sk.id)) {
                            newFocus = fs.filter((id) => id !== sk.id);
                          } else if (fs.length >= 3) {
                            return;
                          } else {
                            newFocus = [...fs, sk.id];
                          }
                          setResidents((prev) => prev.map((x) => x.id !== traineeId ? x : { ...x, focusSkills: newFocus }));
                          showToast(isFocus ? "Focus removed" : "Pinned as focus");
                          await supabase.from("profiles").update({ focus_skills: newFocus }).eq("id", traineeId);
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
                                {sk.archived && <span style={{ fontSize: "8px", fontWeight: 600, padding: "2px 5px", borderRadius: 4, background: T.creamDark, color: T.textMuted }}>ARCHIVED</span>}
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
                                    <Icon name="target" size={14} color={isFocus ? T.gold : T.textMuted} />
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
            <FormField label={`${TL.pos} Notes`}>
              <input value={editLogNote} onChange={(e) => setEditLogNote(e.target.value)} placeholder={`${TL.pos} note`} style={{ ...iSt, background: T.cream }} disabled />
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
        <p style={{ marginTop: 16, color: T.textMuted }}>{TL.s} not found.</p>
      </div>
    );
  }

  const assigned = new Set(r.skillIds || []);
  const { total, done, pct } = getProgress(r, masterProgram);
  const assignedCats = getTraineeCats(r, masterProgram);

  const toggleSkill = async (sid) => {
    const sids = new Set(r.skillIds || []);
    const removing = sids.has(sid);
    if (removing) { sids.delete(sid); } else { sids.add(sid); }
    const newIds = [...sids];
    // Optimistic update
    setResidents((p) => p.map((x) => x.id !== traineeId ? x : { ...x, skillIds: newIds }));
    // Persist to Supabase
    if (removing) {
      await supabase.from("resident_skills").delete().eq("user_id", traineeId).eq("skill_id", sid);
    } else {
      await supabase.from("resident_skills").insert({
        user_id: traineeId, skill_id: sid, sort_order: newIds.length - 1,
      });
    }
  };

  const applyPreset = async (pr) => {
    const existingIds = new Set(r.skillIds || []);
    const newIds = pr.skillIds.filter((sid) => !existingIds.has(sid));
    const allIds = [...existingIds, ...newIds];
    // Optimistic update
    setResidents((p) => p.map((x) => x.id !== traineeId ? x : { ...x, skillIds: allIds }));
    showToast(`Applied "${pr.name}"`);
    setPresetModal(false);
    // Persist new assignments to Supabase
    if (newIds.length > 0) {
      const rows = newIds.map((sid, i) => ({
        user_id: traineeId, skill_id: sid, sort_order: existingIds.size + i,
      }));
      await supabase.from("resident_skills").insert(rows);
    }
  };

  const clearAll = async () => {
    setResidents((p) => p.map((x) => (x.id === traineeId ? { ...x, skillIds: [], progress: {} } : x)));
    showToast("Track cleared");
    await supabase.from("resident_skills").delete().eq("user_id", traineeId);
  };

  // Reorder: drag skill within the assigned track
  const handleReorderDrop = async (targetId) => {
    if (!reorderDragId || reorderDragId === targetId) { setReorderDragId(null); setReorderOverId(null); return; }
    const ids = [...(r.skillIds || [])];
    const fromIdx = ids.indexOf(reorderDragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) { setReorderDragId(null); setReorderOverId(null); return; }
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, reorderDragId);
    setResidents((p) => p.map((x) => x.id !== traineeId ? x : { ...x, skillIds: ids }));
    setReorderDragId(null);
    setReorderOverId(null);
    // Update sort_order in Supabase
    const updates = ids.map((sid, i) => supabase.from("resident_skills").update({ sort_order: i }).eq("user_id", traineeId).eq("skill_id", sid));
    await Promise.all(updates);
  };

  return (
    <div className={embedded ? "" : "fade-up"}>
      {!embedded && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => onNav("a-trainees")} style={{ background: T.goldMuted, border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="back" size={18} color={T.gold} />
          </button>
          <Avatar name={r.name} size={44} photo={r.photo} ringColor={cohortColor(r.cohort)} />
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
            {masterProgram.filter((c) => !c.archived).map((cat) => {
              const cc = cat.color || T.gold;
              return (
                <Card key={cat.id} style={{ padding: 0, overflow: "hidden", borderLeft: `5px solid ${cc}` }}>
                  <div style={{ padding: 16, background: `linear-gradient(135deg, ${cc}08, ${cc}03)` }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: cc, flexShrink: 0 }} />
                      {cat.name}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {cat.skills.filter((s) => !s.archived).map((sk) => {
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
  const { user, docs, setDocs, residents, showToast } = useData();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Resources", url: "", visibility: "all", assigned_to: [] });
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileType, setFileType] = useState("");
  const [editDoc, setEditDoc] = useState(null);
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
    const now = localDate();
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
      visibility: form.visibility,
      assigned_to: form.visibility === "specific" ? form.assigned_to : [],
    }).select().single();

    if (insErr) { console.error("Doc insert error:", insErr); showToast("Error uploading"); return; }
    setDocs((p) => [inserted, ...p]);
    setForm({ name: "", category: "Resources", url: "", visibility: "all", assigned_to: [] });
    setFileData(null); setFileName(""); setFileSize(""); setFileType("");
    setModal(false);
    showToast("Document uploaded");
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    const updates = {
      name: form.name.trim(),
      category: form.category,
      visibility: form.visibility,
      assigned_to: form.visibility === "specific" ? form.assigned_to : [],
    };
    const { error } = await supabase.from("documents").update(updates).eq("id", editDoc.id);
    if (error) { showToast("Error updating"); return; }
    setDocs((p) => p.map((d) => d.id === editDoc.id ? { ...d, ...updates } : d));
    setEditDoc(null);
    setModal(false);
    showToast("Document updated");
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setForm({ name: doc.name, category: doc.category, url: doc.url || "", visibility: doc.visibility || "all", assigned_to: doc.assigned_to || [] });
    setFileData(null); setFileName(""); setFileSize(""); setFileType("");
    setModal(true);
  };

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);

  const rem = async (doc) => {
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) { showToast("Error deleting document"); return; }
    setDocs((p) => p.filter((d) => d.id !== doc.id));
    setConfirmDelete(null);
    showToast("Document removed");
  };

  const openModal = () => {
    setEditDoc(null);
    setForm({ name: "", category: "Resources", url: "", visibility: "all", assigned_to: [] });
    setFileData(null); setFileName(""); setFileSize(""); setFileType("");
    setModal(true);
  };

  return (
    <div className="fade-up">
      <SectionTitle sub={`Upload files or add links for your ${TL.pl}`} action={<Btn onClick={openModal}><Icon name="plus" size={16} color={T.cream} /> Upload Document</Btn>}>
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
              {(doc.visibility === "specific" && doc.assigned_to?.length > 0) && (
                <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: T.charcoalMuted, color: T.textMuted }}>
                  {doc.assigned_to.length} trainee{doc.assigned_to.length !== 1 ? "s" : ""}
                </span>
              )}
              {doc.url && (
                <button onClick={() => setViewDoc(doc)} title="View" style={{ background: T.goldMuted, border: "none", borderRadius: 4, padding: 6, cursor: "pointer", position: "relative", zIndex: 2 }}>
                  <Icon name="eye" size={14} color={T.gold} />
                </button>
              )}
              <button onClick={() => openEdit(doc)} title="Edit" style={{ background: T.goldMuted, border: "none", borderRadius: 4, padding: 6, cursor: "pointer", position: "relative", zIndex: 2 }}>
                <Icon name="edit" size={14} color={T.gold} />
              </button>
              <button onClick={() => setConfirmDelete(doc)} title="Delete" style={{ background: "#fee", border: "none", borderRadius: 4, padding: 6, cursor: "pointer", position: "relative", zIndex: 2 }}>
                <Icon name="trash" size={16} color={T.danger} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditDoc(null); }} title={editDoc ? "Edit Document" : "Upload Document"} width={480}>
        {/* File Upload Zone — only show for new uploads */}
        {!editDoc && <>
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
        </>}

        <FormField label="Document Name">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Color Formulation Guide" style={iSt} />
        </FormField>
        <FormField label="Category">
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={selSt}>
            {["Onboarding", "Schedule", "Resources", "Forms", "Policies"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Visible To">
          <select value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))} style={selSt}>
            <option value="all">All {TL.p}</option>
            <option value="specific">Specific {TL.p}</option>
          </select>
        </FormField>
        {form.visibility === "specific" && (
          <FormField label="Assign To">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto", padding: "8px 0" }}>
              {residents.map((r) => (
                <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.assigned_to.includes(r.id)}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        assigned_to: e.target.checked
                          ? [...f.assigned_to, r.id]
                          : f.assigned_to.filter((id) => id !== r.id),
                      }));
                    }}
                  />
                  {r.name}
                  {r.cohort && <span style={{ fontSize: "10px", color: T.textMuted }}>({r.cohort})</span>}
                </label>
              ))}
              {residents.length === 0 && <p style={{ fontSize: "12px", color: T.textMuted }}>No {TL.pl} yet</p>}
            </div>
          </FormField>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => { setModal(false); setEditDoc(null); }}>Cancel</Btn>
          {editDoc ? (
            <Btn onClick={saveEdit} disabled={!form.name.trim()}>Save</Btn>
          ) : (
            <Btn onClick={add} disabled={!form.name.trim() && !fileData}>Upload</Btn>
          )}
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
  const [tuition, setTuition] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: tData }, { data: pData }] = await Promise.all([
        supabase.from("tuition").select("*").eq("user_id", user.id).single(),
        supabase.from("payments").select("*").eq("user_id", user.id).order("date", { ascending: true }),
      ]);
      setTuition(tData || { plan: "monthly", total: 4950 });
      setPayments(pData || []);
      setLoading(false);
    };
    load();
  }, [user.id]);

  if (loading) return (
    <div className="fade-up">
      <SectionTitle sub="Loading...">My Tuition</SectionTitle>
      <Card style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.textMuted, fontSize: "13px" }}>Loading tuition data...</p></Card>
    </div>
  );

  const paid = payments.reduce((a, p) => a + Number(p.amount), 0);
  const total = Number(tuition.total);
  const remaining = Math.max(0, total - paid);
  const paidPct = total ? Math.round((paid / total) * 100) : 0;
  const status = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  const st = STATUS_STYLES[status];

  return (
    <div className="fade-up">
      <SectionTitle sub="Your payment plan and history">My Tuition</SectionTitle>

      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: T.textMuted, marginBottom: 4 }}>Payment Plan</p>
            <h3 style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600 }}>{tuition.plan === "full" ? "Pay in Full" : "Monthly Plan"}</h3>
            <p style={{ fontSize: "13px", color: T.textMuted, marginTop: 2 }}>{tuition.plan === "full" ? "$4,500 one-time" : "$1,650/mo × 3 ($4,950)"}</p>
          </div>
          <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
        </div>

        <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
          <div style={{ padding: 16, borderRadius: T.radiusSm, background: T.cream, textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Total</p>
            <p style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600 }}>${total.toLocaleString()}</p>
          </div>
          <div style={{ padding: 16, borderRadius: T.radiusSm, background: T.successBg, textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: T.success, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Paid</p>
            <p style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600, color: T.success }}>${paid.toLocaleString()}</p>
          </div>
          <div style={{ padding: 16, borderRadius: T.radiusSm, background: remaining > 0 ? T.warnBg : T.successBg, textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: remaining > 0 ? T.warn : T.success, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Remaining</p>
            <p style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600, color: remaining > 0 ? T.warn : T.success }}>${remaining.toLocaleString()}</p>
          </div>
        </div>

        <ProgressBar value={paidPct} height={10} color={status === "paid" ? T.success : T.gold} />
        <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 6, textAlign: "right" }}>{paidPct}% paid</p>
      </Card>

      <Card style={{ padding: 24 }}>
        <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>Payment History</h4>
        {payments.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: "13px" }}>No payments recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payments.map((pay) => (
              <div key={pay.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: T.radiusSm, background: T.cream }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.successBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="check" size={16} color={T.success} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500 }}>{pay.note || "Payment"}</p>
                  <p style={{ fontSize: "11px", color: T.textMuted }}>{pay.date}{pay.method ? ` · ${pay.method}` : ""}</p>
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: T.success }}>+${Number(pay.amount).toLocaleString()}</p>
                {pay.receipt_url && (
                  <a href={pay.receipt_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: T.gold, fontWeight: 500, textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>
                    Receipt
                  </a>
                )}
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
  const { showToast } = useData();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payDate, setPayDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadData = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, name, email, photo, enrollment_completed").eq("role", "resident");
    if (!profiles) { setLoading(false); return; }
    const [{ data: tuitionData }, { data: paymentsData }] = await Promise.all([
      supabase.from("tuition").select("*"),
      supabase.from("payments").select("*").order("date", { ascending: true }),
    ]);
    const tMap = {}; (tuitionData || []).forEach((t) => { tMap[t.user_id] = t; });
    const pMap = {}; (paymentsData || []).forEach((p) => { if (!pMap[p.user_id]) pMap[p.user_id] = []; pMap[p.user_id].push(p); });
    setResidents(profiles.map((p) => {
      const t = tMap[p.id] || { plan: "monthly", total: 4950 };
      const pays = pMap[p.id] || [];
      const paid = pays.reduce((a, pay) => a + Number(pay.amount), 0);
      const total = Number(t.total);
      const remaining = Math.max(0, total - paid);
      const paidPct = total ? Math.round((paid / total) * 100) : 0;
      const status = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
      return { ...p, enrollment_completed: p.enrollment_completed, tuition: t, payments: pays, paid, total, remaining, paidPct, status };
    }));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="fade-up">
      <SectionTitle sub="Loading...">Tuition Manager</SectionTitle>
      <Card style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.textMuted, fontSize: "13px" }}>Loading tuition data...</p></Card>
    </div>
  );

  const totalRevenue = residents.reduce((a, r) => a + r.total, 0);
  const totalPaid = residents.reduce((a, r) => a + r.paid, 0);
  const totalRemaining = totalRevenue - totalPaid;
  const target = residents.find((r) => r.id === targetId);

  const openPay = (r) => { setTargetId(r.id); setPayAmount(""); setPayNote(""); setPayDate(localDate()); setPayModal(true); };
  const recordPayment = async () => {
    if (!payAmount || !targetId) { showToast("Please enter an amount"); return; }
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) { showToast("Amount must be greater than 0"); return; }
    const date = payDate || localDate();

    // Ensure tuition record exists
    const { error: tErr } = await supabase.from("tuition").upsert(
      { user_id: targetId, plan: target?.tuition?.plan || "monthly", total: target?.total || 4950 },
      { onConflict: "user_id" }
    );
    if (tErr) { console.error("Tuition upsert error:", tErr); showToast("Error: " + tErr.message); return; }

    const { error } = await supabase.from("payments").insert({
      user_id: targetId, amount: amt, date,
      note: payNote || "Payment",
    });
    if (error) { console.error("Payment insert error:", error); showToast("Error: " + error.message); return; }

    // Auto-mark enrollment complete if not already
    if (!target?.enrollment_completed) {
      await supabase.from("profiles").update({
        enrollment_completed: true,
        enrollment_date: date,
        enrollment_plan: target?.tuition?.plan || "monthly",
      }).eq("id", targetId);
    }

    showToast("Payment recorded");
    setPayModal(false);
    await loadData();
  };

  const openPlan = (r) => { setTargetId(r.id); setPlanModal(true); };
  const savePlan = async (plan) => {
    if (!targetId) return;
    const total = plan === "full" ? 4500 : 4950;
    const { error } = await supabase.from("tuition").upsert({ user_id: targetId, plan, total }, { onConflict: "user_id" });
    if (error) { console.error(error); return; }
    showToast("Plan updated to " + (plan === "full" ? "Pay in Full" : "Monthly"));
    setPlanModal(false);
    await loadData();
  };

  return (
    <div className="fade-up">
      <SectionTitle sub={`Overview of all ${TL.sl} payments`}>Tuition Manager</SectionTitle>

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
        {residents.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: "13px" }}>No residents enrolled yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {residents.map((r) => {
              const st = STATUS_STYLES[r.status];
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: T.radiusSm, background: T.cream }}>
                  <Avatar name={r.name} size={40} photo={r.photo} ringColor={cohortColor(r.cohort)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: "14px", fontWeight: 500 }}>{r.name}</p>
                      <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
                      <span style={{ fontSize: "11px", color: T.textMuted }}>{r.tuition?.plan === "full" ? "Pay in Full" : "Monthly"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}><ProgressBar value={r.paidPct} height={6} color={r.status === "paid" ? T.success : T.gold} /></div>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: T.textMuted, minWidth: 100, textAlign: "right" }}>
                        ${r.paid.toLocaleString()} / ${r.total.toLocaleString()}
                      </span>
                    </div>
                    {r.payments.length > 0 && (
                      <>
                        <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0 0", display: "flex", alignItems: "center", gap: 4, fontSize: "11px", color: T.textMuted }}>
                          <span style={{ transform: expandedId === r.id ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block" }}>▸</span>
                          {r.payments.length} payment{r.payments.length !== 1 ? "s" : ""}
                        </button>
                        {expandedId === r.id && (
                          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                            {r.payments.map((p) => (
                              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "11px", padding: "4px 10px", background: T.white, borderRadius: T.radiusSm }}>
                                <span style={{ fontWeight: 600, color: T.text, minWidth: 60 }}>${Number(p.amount).toLocaleString()}</span>
                                <span style={{ color: T.textMuted }}>{p.date}</span>
                                {p.note && <span style={{ color: T.textLight, fontStyle: "italic" }}>{p.note}</span>}
                                {p.receipt_url && <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: T.gold, fontWeight: 500, textDecoration: "none", marginLeft: "auto" }} onClick={(e) => e.stopPropagation()}>Receipt</a>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
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
        )}
      </Card>

      {/* Record Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title={"Record Payment — " + (target?.name || "")} width={420}>
        {target && (
          <>
            <div style={{ padding: 14, borderRadius: T.radiusSm, background: T.cream, marginBottom: 16 }}>
              <p style={{ fontSize: "12px", color: T.textMuted }}>Balance remaining: <b style={{ color: target.remaining > 0 ? T.warn : T.success }}>${target.remaining.toLocaleString()}</b></p>
            </div>
            {!target.enrollment_completed && (
              <div style={{ padding: 10, borderRadius: T.radiusSm, background: T.warnBg, marginBottom: 12 }}>
                <p style={{ fontSize: "11px", color: T.warn, fontWeight: 500 }}>This will also mark enrollment as complete.</p>
              </div>
            )}
            <FormField label="Amount ($)">
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={target.tuition?.plan === "monthly" ? "1650" : "4500"} style={iSt} />
            </FormField>
            <FormField label="Date">
              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} style={iSt} />
            </FormField>
            <FormField label="Note (optional)">
              <input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="e.g. Month 1 — manual entry" style={iSt} />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <Btn variant="outline" onClick={() => setPayModal(false)}>Cancel</Btn>
              <Btn onClick={recordPayment}>Record Payment</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* Change Plan Modal */}
      <Modal open={planModal} onClose={() => setPlanModal(false)} title={"Payment Plan — " + (target?.name || "")} width={440}>
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 16 }}>Choose the payment plan for this trainee. Existing payments are preserved.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => savePlan("full")} style={{
            flex: 1, padding: "20px 16px", borderRadius: T.radiusSm, textAlign: "center", cursor: "pointer",
            border: "2px solid " + ((target?.tuition?.plan === "full") ? T.gold : T.creamDark),
            background: (target?.tuition?.plan === "full") ? T.goldMuted : T.cream,
          }}>
            <p style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 600, marginBottom: 4 }}>$4,500</p>
            <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: 2 }}>Pay in Full</p>
            <p style={{ fontSize: "11px", color: T.textMuted }}>One-time payment</p>
          </button>
          <button onClick={() => savePlan("monthly")} style={{
            flex: 1, padding: "20px 16px", borderRadius: T.radiusSm, textAlign: "center", cursor: "pointer",
            border: "2px solid " + ((target?.tuition?.plan === "monthly") ? T.gold : T.creamDark),
            background: (target?.tuition?.plan === "monthly") ? T.goldMuted : T.cream,
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
    if (uploadErr) { console.error("Photo upload error:", uploadErr); showToast("Error uploading photo"); return; }
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

  const [calSources, setCalSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cal_sources") || "[]"); } catch { return []; }
  });
  const [icalUrl, setIcalUrl] = useState("");
  const [icalLabel, setIcalLabel] = useState("");
  const [icalLoading, setIcalLoading] = useState(false);

  const saveCalSources = (sources) => {
    setCalSources(sources);
    localStorage.setItem("cal_sources", JSON.stringify(sources));
    // Persist to profile (strip access tokens — refresh token is stored separately)
    const safe = sources.map(({ token, ...rest }) => rest);
    if (user?.id) supabase.from("profiles").update({ cal_sources: safe }).eq("id", user.id);
  };

  const refreshAllCalendars = async (sources) => {
    const all = [];
    for (const src of sources) {
      if (src.type === "google" && src.token) {
        const events = await fetchGcalEvents(src.token);
        if (events) all.push(...events.map((e) => ({ ...e, _source: src.label })));
      } else if (src.type === "ical" && src.url) {
        const events = await fetchIcalEvents(src.url);
        if (events) all.push(...events.map((e) => ({ ...e, _source: src.label })));
      }
    }
    setGcalConnected(all.length > 0 || sources.length > 0);
    setGcalEvents(all);
  };

  const handleConnect = () => {
    startGcalOAuth();
  };

  const handleIcalConnect = async () => {
    if (!icalUrl.trim()) { showToast("Paste a calendar URL"); return; }
    setIcalLoading(true);
    const events = await fetchIcalEvents(icalUrl.trim());
    if (events) {
      const label = icalLabel.trim() || `Calendar ${calSources.length + 1}`;
      const newSrc = { id: uid(), type: "ical", label, url: icalUrl.trim() };
      const updated = [...calSources, newSrc];
      saveCalSources(updated);
      setIcalUrl(""); setIcalLabel("");
      await refreshAllCalendars(updated);
      showToast(`Added "${label}" — ${events.length} events`);
    } else {
      showToast("Could not fetch calendar — check the URL");
    }
    setIcalLoading(false);
  };

  const removeCalSource = async (id) => {
    const updated = calSources.filter((s) => s.id !== id);
    // Also clean up google token if removing a google source
    const removing = calSources.find((s) => s.id === id);
    if (removing?.type === "google") {
      localStorage.removeItem("gcal_token"); localStorage.removeItem("gcal_refresh_token");
      if (user?.id) supabase.from("profiles").update({ gcal_refresh_token: null }).eq("id", user.id);
    }
    saveCalSources(updated);
    await refreshAllCalendars(updated);
    showToast("Calendar removed");
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
            <Badge color={T.educator}>{user?.role === "admin" ? "Educator" : TL.s}</Badge>
          </div>
        </div>
        <FormField label="Display Name">
          <div style={{ display: "flex", gap: 12 }}>
            <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ ...iSt, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && saveProfile()} />
            <Btn onClick={saveProfile} style={{ opacity: profileSaving ? 0.7 : 1 }}>
              {profileSaving ? "Saving..." : "Save"}
            </Btn>
          </div>
        </FormField>
      </Card>

      <PhotoCropModal open={photoCropOpen} onClose={() => setPhotoCropOpen(false)} onSave={handlePhotoSave} currentPhoto={user?.photo} />

      {/* Display Labels — admin only */}
      {user?.role === "admin" && (() => {
        const presets = [
          { singular: "Trainee", plural: "Trainees" },
          { singular: "Resident", plural: "Residents" },
          { singular: "Student", plural: "Students" },
          { singular: "Apprentice", plural: "Apprentices" },
        ];
        const isCustom = !presets.some((p) => p.singular === TL.s);
        return (
        <Card style={{ padding: 24, marginBottom: 20 }}>
          <h4 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 12 }}>Display Labels</h4>
          <p style={{ fontSize: "12px", color: T.textMuted, marginBottom: 12 }}>Customize what your members are called throughout the portal.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {presets.map((opt) => (
              <button
                key={opt.singular}
                onClick={() => { setTraineeLabel(opt); showToast(`Label updated to "${opt.plural}" — reload to see changes`); }}
                style={{
                  padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500,
                  background: TL.s === opt.singular ? T.charcoal : T.cream,
                  color: TL.s === opt.singular ? T.cream : T.textMuted,
                }}
              >
                {opt.plural}
              </button>
            ))}
            <button
              onClick={() => { const el = document.getElementById("custom-label-form"); if (el) el.style.display = el.style.display === "none" ? "inline-flex" : "none"; }}
              style={{
                padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500,
                background: isCustom ? T.charcoal : T.cream,
                color: isCustom ? T.cream : T.textMuted,
              }}
            >
              {isCustom ? TL.p : "Custom"}
            </button>
            <form id="custom-label-form" onSubmit={(e) => {
              e.preventDefault();
              const s = e.target.singular.value.trim();
              const p = e.target.plural.value.trim();
              if (s && p) { setTraineeLabel({ singular: s, plural: p }); showToast(`Label updated to "${p}" — reload to see changes`); }
            }} style={{ display: isCustom ? "inline-flex" : "none", gap: 6, alignItems: "center" }}>
              <input name="singular" placeholder="Singular" defaultValue={isCustom ? TL.s : ""} style={{ ...iSt, width: 90, fontSize: "12px", padding: "6px 10px" }} />
              <input name="plural" placeholder="Plural" defaultValue={isCustom ? TL.p : ""} style={{ ...iSt, width: 90, fontSize: "12px", padding: "6px 10px" }} />
              <button type="submit" style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600, background: T.gold, color: T.cream }}>Save</button>
            </form>
          </div>
        </Card>
        );
      })()}

      {/* Calendar Sync */}
      <Card style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h4 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 2 }}>Calendar Sync</h4>
            <p style={{ fontSize: "12px", color: T.textMuted }}>Detect scheduling conflicts with external calendars</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleConnect} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "#4285f4", color: T.white, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              <Icon name="link" size={12} color={T.white} /> Google
            </button>
            <button onClick={() => setIcalUrl(icalUrl || " ")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "#d93025", color: T.white, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              <Icon name="link" size={12} color={T.white} /> iCal
            </button>
          </div>
        </div>

        {/* iCal URL input — shown when iCal button clicked */}
        {icalUrl && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={icalLabel} onChange={(e) => setIcalLabel(e.target.value)} placeholder="Label" style={{ ...iSt, width: 130, fontSize: "12px" }} />
            <input value={icalUrl === " " ? "" : icalUrl} onChange={(e) => setIcalUrl(e.target.value || " ")} placeholder="Paste iCal URL..." style={{ ...iSt, flex: 1, fontSize: "12px" }} autoFocus />
            <Btn onClick={handleIcalConnect} style={{ opacity: icalLoading ? 0.7 : 1, whiteSpace: "nowrap", fontSize: "12px" }}>
              {icalLoading ? "..." : "Add"}
            </Btn>
            <button onClick={() => { setIcalUrl(""); setIcalLabel(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Icon name="x" size={14} color={T.textMuted} />
            </button>
          </div>
        )}

        {/* Connected calendars */}
        {calSources.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {calSources.map((src) => (
              <div key={src.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: T.radiusSm, background: T.cream }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: src.type === "google" ? "#4285f4" : "#d93025" }} />
                <span style={{ fontSize: "13px", fontWeight: 500, flex: 1 }}>{src.label}</span>
                <span style={{ fontSize: "10px", color: T.textMuted }}>{src.type === "google" ? "Google" : "iCal"}</span>
                <button onClick={() => removeCalSource(src.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <Icon name="x" size={12} color={T.danger} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "12px", color: T.textMuted, textAlign: "center", padding: "8px 0" }}>No calendars connected</p>
        )}
      </Card>

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

  const handleSaveLog = async () => {
    if (!linkedSkill || seconds === 0) return;
    const mins = Math.round(seconds / 60);
    if (mins === 0) { showToast("Timer too short to log"); return; }
    const dateStr = localDate();
    // Insert to Supabase first
    const { data: inserted, error } = await supabase.from("timing_logs").insert({
      user_id: me.id, skill_id: linkedSkill.id, minutes: mins, type: logType, date: dateStr, note: logNote.trim(),
    }).select().single();
    if (error) { console.error(error); showToast("Error saving log"); return; }
    // Update local state
    setResidents((p) => p.map((r) => {
      if (r.id !== me.id) return r;
      const logs = { ...(r.timingLogs || {}) };
      const existing = logs[linkedSkill.id] || [];
      logs[linkedSkill.id] = [...existing, {
        id: inserted.id, minutes: mins, type: logType, date: dateStr, note: logNote.trim(), comments: [],
      }];
      return { ...r, timingLogs: logs };
    }));
    // Create notification for admin
    await supabase.from("notifications").insert({
      resident_id: me.id, skill_id: linkedSkill.id, log_id: inserted.id,
    });
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
//  GOOGLE CALENDAR HELPERS
// ════════════════════════════════════════════
const GCAL_CLIENT_ID = "469032916510-oj46e6opk4emi6n15vvedg8ghiahlsnb.apps.googleusercontent.com";
const GCAL_SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const GCAL_AUTH_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gcal-auth`;

const startGcalOAuth = () => {
  const redirect = window.location.origin + window.location.pathname;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GCAL_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${encodeURIComponent(GCAL_SCOPES)}&access_type=offline&prompt=consent`;
  window.location.href = url;
};

const exchangeGcalCode = async (code) => {
  const redirect = window.location.origin + window.location.pathname;
  const res = await fetch(GCAL_AUTH_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ code, redirect_uri: redirect }),
  });
  if (!res.ok) { console.error("Code exchange failed:", res.status); return null; }
  return res.json();
};

const refreshGcalToken = async (refreshToken) => {
  const res = await fetch(GCAL_AUTH_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) { console.error("Token refresh failed:", res.status); return null; }
  return res.json();
};

const fetchGcalEvents = async (token) => {
  const now = new Date();
  const min = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const max = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
  let res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${min}&timeMax=${max}&singleEvents=true&orderBy=startTime&maxResults=250`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  // If 401, try refreshing the token
  if (res.status === 401) {
    const rt = localStorage.getItem("gcal_refresh_token");
    if (rt) {
      const refreshed = await refreshGcalToken(rt);
      if (refreshed?.access_token) {
        localStorage.setItem("gcal_token", refreshed.access_token);

        // Update the token in cal_sources too
        try {
          const sources = JSON.parse(localStorage.getItem("cal_sources") || "[]");
          const updated = sources.map((s) => s.type === "google" ? { ...s, token: refreshed.access_token } : s);
          localStorage.setItem("cal_sources", JSON.stringify(updated));
        } catch {}
        res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${min}&timeMax=${max}&singleEvents=true&orderBy=startTime&maxResults=250`,
          { headers: { Authorization: `Bearer ${refreshed.access_token}` } }
        );
      }
    }
  }
  if (!res.ok) { console.log("GCal fetch failed:", res.status); return null; }
  const data = await res.json();
  console.log("GCal events fetched:", data.items?.length || 0);
  return (data.items || []).map((ev) => {
    const start = ev.start?.dateTime || ev.start?.date || "";
    const end = ev.end?.dateTime || ev.end?.date || "";
    const date = start.slice(0, 10);
    const fmt = (iso) => { if (!iso.includes("T")) return ""; const d = new Date(iso); return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
    const time = fmt(start) && fmt(end) ? `${fmt(start)} – ${fmt(end)}` : "All day";
    return { title: ev.summary || "(No title)", time, date };
  });
};

// ════════════════════════════════════════════
//  ICAL HELPERS
// ════════════════════════════════════════════
const fetchIcalEvents = async (icalUrl) => {
  try {
    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ical-proxy`;
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ url: icalUrl }),
    });
    if (!res.ok) { console.log("iCal proxy error:", res.status); return null; }
    const json = await res.json();
    const text = json.data;
    if (!text) return null;
    const events = [];
    const clean = text.replace(/\r\n /g, "").replace(/\r/g, ""); // unfold long lines + strip \r
    const blocks = clean.split("BEGIN:VEVENT");
    const now = new Date();
    const minDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const maxDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i].split("END:VEVENT")[0];
      const get = (key) => { const m = b.match(new RegExp(`${key}[^:\\n]*:(.*)`, "m")); return m ? m[1].trim() : ""; };
      const rawSummary = get("SUMMARY").replace(/\\n/g, " · ").replace(/\\,/g, ",");
      const summary = rawSummary.replace(/\s*·\s*Phone:.*$/, ""); // strip phone numbers
      const dtstart = get("DTSTART");
      const dtend = get("DTEND");
      const parseIcalDate = (s) => {
        if (!s) return null;
        const v = s.replace(/Z$/, "");
        if (v.length === 8) return new Date(v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6, 8));
        if (v.includes("T")) return new Date(v.slice(0, 4) + "-" + v.slice(4, 6) + "-" + v.slice(6, 8) + "T" + v.slice(9, 11) + ":" + v.slice(11, 13) + ":" + v.slice(13, 15));
        return new Date(v);
      };
      const startD = parseIcalDate(dtstart);
      const endD = parseIcalDate(dtend);
      if (!startD || isNaN(startD.getTime()) || startD < minDate || startD > maxDate) continue;
      const date = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, "0")}-${String(startD.getDate()).padStart(2, "0")}`;
      const fmt = (d) => d && !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
      const isAllDay = dtstart.length === 8;
      const time = isAllDay ? "All day" : (fmt(startD) && fmt(endD) ? `${fmt(startD)} – ${fmt(endD)}` : "All day");
      events.push({ title: summary || "(No title)", time, date });
    }
    console.log("iCal events parsed:", events.length);
    return events;
  } catch { return null; }
};

// Parse Google OAuth callback — now uses code flow (query param, not hash)
const _gcalCallbackToken = (() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return null;
  // Don't block — exchange async and store
  (async () => {
    const data = await exchangeGcalCode(code);
    if (data?.access_token) {
      localStorage.setItem("gcal_token", data.access_token);

      if (data.refresh_token) localStorage.setItem("gcal_refresh_token", data.refresh_token);
      // Update cal_sources
      try {
        const sources = JSON.parse(localStorage.getItem("cal_sources") || "[]");
        const exists = sources.some((s) => s.type === "google");
        if (!exists) {
          sources.push({ id: `g_${Date.now()}`, type: "google", label: "Google Calendar", token: data.access_token });
        } else {
          sources.forEach((s) => { if (s.type === "google") s.token = data.access_token; });
        }
        localStorage.setItem("cal_sources", JSON.stringify(sources));
      } catch {}
      // Persist refresh token + cal_sources to profile
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const safe = JSON.parse(localStorage.getItem("cal_sources") || "[]").map(({ token, ...rest }) => rest);
        const updates = { cal_sources: safe };
        if (data.refresh_token) updates.gcal_refresh_token = data.refresh_token;
        supabase.from("profiles").update(updates).eq("id", authUser.id);
      }
    }
  })();
  // Clean the code from URL
  window.history.replaceState(null, "", window.location.pathname);
  return true;
})();

// ════════════════════════════════════════════
//  APP SHELL
// ════════════════════════════════════════════
const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dash");
  const [masterProgram, setMasterProgram] = useState([]);
  const [presets, setPresets] = useState([]);
  const [residents, setResidents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [docs, setDocs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [gcalConnected, setGcalConnected] = useState(!!localStorage.getItem("gcal_token"));
  const [gcalEvents, setGcalEvents] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [notifications, setNotifications] = useState([]);

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
        tenant_id: profile.tenant_id,
      });
      setPage(profile.role === "admin" ? "a-dash" : "dash");

      // Hydrate calendar sources from profile → localStorage (so calendar useEffect picks them up)
      if (profile.cal_sources?.length) {
        const existing = JSON.parse(localStorage.getItem("cal_sources") || "[]");
        if (!existing.length) {
          // Restore saved sources; re-attach access token if we have one locally
          const token = localStorage.getItem("gcal_token");
          const hydrated = profile.cal_sources.map((s) => s.type === "google" && token ? { ...s, token } : s);
          localStorage.setItem("cal_sources", JSON.stringify(hydrated));
        }
      }
      if (profile.gcal_refresh_token && !localStorage.getItem("gcal_refresh_token")) {
        localStorage.setItem("gcal_refresh_token", profile.gcal_refresh_token);
      }

      // Fetch documents from Supabase
      const { data: docsData } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (profile.role === "admin") {
        setDocs(docsData || []);
      } else {
        // Trainees see: their own uploads + all-visibility docs + docs assigned to them
        setDocs((docsData || []).filter((d) =>
          d.uploaded_by === profile.id ||
          d.visibility === "all" || !d.visibility ||
          (d.visibility === "specific" && d.assigned_to?.includes(profile.id))
        ));
      }

      // Load cohort colors from Supabase (fall back to localStorage)
      const { data: cohortSetting } = await supabase.from("settings").select("value").eq("key", "cohort_colors").maybeSingle();
      if (cohortSetting?.value) {
        _cohortColorMap = cohortSetting.value;
        localStorage.setItem("cohort_colors", JSON.stringify(cohortSetting.value));
      }

      // Load trainee label setting
      const { data: labelSetting } = await supabase.from("settings").select("value").eq("key", "trainee_label").maybeSingle();
      if (labelSetting?.value) {
        _traineeLabel = labelSetting.value;
        localStorage.setItem("trainee_label", JSON.stringify(labelSetting.value));
      }

      // Load master program from Supabase (active + archived with flags)
      const [{ data: catsData }, { data: skillsData }, { data: archCatsData }, { data: archSkillsData }] = await Promise.all([
        supabase.from("categories").select("*").is("archived_at", null).order("sort_order"),
        supabase.from("skills").select("*").is("archived_at", null).order("sort_order"),
        supabase.from("categories").select("*").not("archived_at", "is", null),
        supabase.from("skills").select("*").not("archived_at", "is", null),
      ]);
      if (catsData) {
        const mapSkill = (s, archived) => ({
          id: s.id, name: s.name, type: s.type, targetMin: s.target_min, maxMin: s.max_min, videos: s.videos || [], sop: s.sop,
          ...(archived ? { archived: true } : {}),
        });
        // Active categories with active + archived skills merged in
        const activeCatIds = new Set(catsData.map((c) => c.id));
        const program = catsData.map((c) => {
          const activeSkills = (skillsData || []).filter((s) => s.category_id === c.id).map((s) => mapSkill(s, false));
          const archivedInCat = (archSkillsData || []).filter((s) => s.category_id === c.id).map((s) => mapSkill(s, true));
          return { id: c.id, name: c.name, color: c.color, videos: c.videos || [], skills: [...activeSkills, ...archivedInCat] };
        });
        // Archived categories with their skills
        const archCats = (archCatsData || []).map((c) => ({
          id: c.id, name: c.name, color: c.color, videos: c.videos || [], archived: true,
          skills: (archSkillsData || []).filter((s) => s.category_id === c.id).map((s) => mapSkill(s, true)),
        }));
        setMasterProgram([...program, ...archCats]);
      }

      // Load presets from Supabase
      const { data: presetData } = await supabase.from("presets").select("*").order("created_at");
      if (presetData) {
        setPresets(presetData.map((p) => ({ id: p.id, name: p.name, skillIds: p.skill_ids || [] })));
      }

      // Load schedule from Supabase
      const { data: schedData } = await supabase.from("schedule").select("*").order("date");
      if (schedData) {
        setSchedule(schedData.map((s) => ({
          id: s.id, title: s.title, date: s.date, time: s.time,
          type: s.type || "general", assignTo: s.assign_to || "all",
          skillId: s.skill_id, notes: s.notes, seriesId: s.series_id,
        })));
      }

      // Load residents (profiles + skill assignments + timing logs)
      const buildTimingLogs = (logs, comments) => {
        const tl = {};
        (logs || []).forEach((l) => {
          if (!tl[l.skill_id]) tl[l.skill_id] = [];
          const myComments = (comments || []).filter((c) => c.log_id === l.id)
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((c) => ({ id: c.id, from: c.from_role, text: c.text, ts: c.created_at, name: c.author_name }));
          tl[l.skill_id].push({ id: l.id, minutes: l.minutes, type: l.type, date: l.date, note: l.note || "", comments: myComments });
        });
        return tl;
      };

      if (profile.role === "admin") {
        const [{ data: resProfiles }, { data: rSkills }, { data: tLogs }, { data: tComments }] = await Promise.all([
          supabase.from("profiles").select("*").eq("role", "resident").is("deleted_at", null),
          supabase.from("resident_skills").select("*"),
          supabase.from("timing_logs").select("*").order("created_at"),
          supabase.from("log_comments").select("*").order("created_at"),
        ]);
        const resList = (resProfiles || []).map((p) => {
          const mySkills = (rSkills || []).filter((rs) => rs.user_id === p.id);
          const skillIds = mySkills.sort((a, b) => a.sort_order - b.sort_order).map((rs) => rs.skill_id);
          const progress = {};
          mySkills.forEach((rs) => {
            if (rs.done) {
              progress[rs.skill_id] = { done: true };
            } else if (rs.technique > 0 || rs.timing > 0) {
              progress[rs.skill_id] = { technique: rs.technique, timing: rs.timing };
            }
          });
          const myLogs = (tLogs || []).filter((l) => l.user_id === p.id);
          const myLogIds = new Set(myLogs.map((l) => l.id));
          const myComments = (tComments || []).filter((c) => myLogIds.has(c.log_id));
          return {
            id: p.id, name: p.name, email: p.email, cohort: p.cohort || "Spring 2026",
            photo: p.photo, skillIds, progress, focusSkills: p.focus_skills || [],
            timingLogs: buildTimingLogs(myLogs, myComments),
          };
        });
        setResidents(resList);

        // Load notifications from Supabase
        const { data: notifData } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
        if (notifData) {
          setNotifications(notifData.map((n) => {
            // Find the log index for this notification
            const r = resList.find((x) => x.id === n.resident_id);
            const entries = (r?.timingLogs || {})[n.skill_id] || [];
            const logIdx = entries.findIndex((e) => e.id === n.log_id);
            return {
              id: n.id,
              residentId: n.resident_id,
              skillId: n.skill_id,
              logId: n.log_id,
              logIdx: logIdx >= 0 ? logIdx : 0,
              ts: n.created_at,
              read: n.read,
              reviewed: n.reviewed,
            };
          }));
        }
      } else {
        // Resident: load own skills + logs
        const [{ data: rSkills }, { data: tLogs }, { data: tComments }] = await Promise.all([
          supabase.from("resident_skills").select("*").eq("user_id", profile.id),
          supabase.from("timing_logs").select("*").eq("user_id", profile.id).order("created_at"),
          supabase.from("log_comments").select("*").order("created_at"),
        ]);
        const mySkills = rSkills || [];
        const skillIds = mySkills.sort((a, b) => a.sort_order - b.sort_order).map((rs) => rs.skill_id);
        const progress = {};
        mySkills.forEach((rs) => {
          if (rs.done) {
            progress[rs.skill_id] = { done: true };
          } else if (rs.technique > 0 || rs.timing > 0) {
            progress[rs.skill_id] = { technique: rs.technique, timing: rs.timing };
          }
        });
        const myLogIds = new Set((tLogs || []).map((l) => l.id));
        const myComments = (tComments || []).filter((c) => myLogIds.has(c.log_id));
        setResidents([{
          id: profile.id, name: profile.name, email: profile.email, cohort: profile.cohort || "Spring 2026",
          photo: profile.photo, skillIds, progress, focusSkills: profile.focus_skills || [],
          timingLogs: buildTimingLogs(tLogs, myComments),
        }]);
      }
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

  // Handle calendar restore: Google OAuth callback + load all saved sources
  useEffect(() => {
    const loadAll = async () => {
      let sources = [];
      try { sources = JSON.parse(localStorage.getItem("cal_sources") || "[]"); } catch {}

      // If returning from Google OAuth code flow, wait a moment for async exchange to finish
      if (_gcalCallbackToken) {
        await new Promise((r) => setTimeout(r, 1500));
        try { sources = JSON.parse(localStorage.getItem("cal_sources") || "[]"); } catch {}
      }

      // Also check for legacy/current single-source token
      const savedToken = localStorage.getItem("gcal_token");
      if (savedToken && !sources.some((s) => s.type === "google")) {
        sources = [...sources, { id: `g_${Date.now()}`, type: "google", label: "Google Calendar", token: savedToken }];
        localStorage.setItem("cal_sources", JSON.stringify(sources));
      }

      // Fetch all events from all sources
      if (sources.length === 0) { setGcalConnected(false); return; }
      const all = [];
      for (const src of sources) {
        if (src.type === "google") {
          const token = src.token || savedToken;
          if (!token) continue;
          const events = await fetchGcalEvents(token);
          if (events) all.push(...events.map((e) => ({ ...e, _source: src.label })));
        } else if (src.type === "ical" && src.url) {
          const events = await fetchIcalEvents(src.url);
          if (events) all.push(...events.map((e) => ({ ...e, _source: src.label })));
        }
      }
      setGcalConnected(sources.length > 0);
      setGcalEvents(all);
    };
    loadAll();
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
      // handbook now lives inside TraineeDocs
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
