import { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../theme";
import { supabase } from "../lib/supabase";
import { Btn } from "./ui";
import { Icon } from "./Icon";

/* ─── signature‑pad helper ─── */
function initCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const state = { drawing: false, hasSig: false, lastX: 0, lastY: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    let img = null;
    if (state.hasSig) {
      img = new Image();
      img.src = canvas.toDataURL();
    }
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1A1A1A";
    if (img && state.hasSig) {
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
    }
  }
  resize();
  window.addEventListener("resize", resize);

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }
  function startDraw(e) {
    e.preventDefault();
    state.drawing = true;
    const pos = getPos(e);
    state.lastX = pos.x;
    state.lastY = pos.y;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }
  function draw(e) {
    if (!state.drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    state.hasSig = true;
  }
  function endDraw(e) {
    if (state.drawing) {
      e.preventDefault();
      state.drawing = false;
      ctx.beginPath();
    }
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", endDraw, { passive: false });

  return {
    state,
    clear() {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      state.hasSig = false;
    },
    destroy() {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", endDraw);
      canvas.removeEventListener("mouseleave", endDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", endDraw);
    },
  };
}

/* ─── SigPad (defined outside so React never remounts it) ─── */
const SigPad = ({ canvasRef, padRef, label }) => {
  const attachRef = useCallback((el) => {
    canvasRef.current = el;
    if (el && !padRef.current) {
      padRef.current = initCanvas(el);
    }
  }, [canvasRef, padRef]);

  return (
    <div className="sig-block" style={{ marginTop: 12 }}>
      <span className="ag-label">{label}</span>
      <div className="sig-canvas-wrap">
        <canvas ref={attachRef} />
        <div className="sig-line" />
        <span className="sig-x">&times;</span>
      </div>
      <button
        className="clear-sig-btn"
        onClick={() => padRef.current?.clear()}
        style={{
          marginTop: 6,
          background: "none",
          border: "none",
          color: T.textMuted,
          fontSize: 12,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Clear signature
      </button>
    </div>
  );
};

/* ─── CSS scoped to .agreement-page ─── */
const AGREEMENT_CSS = `
.agreement-page {
  max-width: 850px;
  margin: 0 auto;
  padding: 32px 24px 60px;
  font-family: ${T.font};
  color: ${T.charcoal};
  line-height: 1.7;
  font-size: 14px;
}
.agreement-page h1 {
  font-family: ${T.fontD};
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
  color: ${T.charcoal};
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
.agreement-page .ag-subtitle {
  text-align: center;
  color: ${T.textMuted};
  font-size: 14px;
  margin-bottom: 36px;
}
.agreement-page h2 {
  font-family: 'Outfit', sans-serif !important;
  font-size: 11px;
  font-weight: 700;
  margin: 0 0 16px;
  padding: 8px 16px;
  border-bottom: none;
  border-radius: 4px;
  background: ${T.gold};
  color: ${T.white};
  text-transform: uppercase;
  letter-spacing: 0.15em;
}
.agreement-page h3 {
  font-family: ${T.fontD};
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 8px;
  color: ${T.charcoal};
}
.agreement-page p, .agreement-page li {
  margin: 6px 0;
}
.agreement-page ul {
  padding-left: 22px;
  margin: 8px 0;
}
.agreement-page .ag-card {
  background: ${T.white};
  border: 1px solid ${T.lightLine};
  border-radius: ${T.radiusSm};
  padding: 28px 32px;
  margin-bottom: 20px;
  box-shadow: ${T.shadow};
}
.agreement-page .ag-address {
  white-space: pre-line;
  color: ${T.textMuted};
  font-size: 13px;
  line-height: 1.6;
}
.agreement-page .ag-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${T.creamDark};
  border-radius: ${T.radiusSm};
  background: ${T.cream};
  font-size: 13px;
  font-family: ${T.font};
  outline: none;
  box-sizing: border-box;
}
.agreement-page .ag-input:focus {
  border-color: ${T.gold};
}
.agreement-page .ag-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${T.textMuted};
  margin-bottom: 6px;
}
.agreement-page .ag-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 12px 0;
}
.agreement-page .ag-radio-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1.5px solid ${T.creamDark};
  border-radius: ${T.radiusSm};
  cursor: pointer;
  font-size: 14px;
  transition: border-color .2s, background .2s;
}
.agreement-page .ag-radio-label.selected {
  border-color: ${T.gold};
  background: ${T.goldMuted};
}
.agreement-page .ag-radio-label input[type="radio"] {
  accent-color: ${T.gold};
}
.agreement-page .sig-block {
  margin-top: 16px;
}
.agreement-page .sig-canvas-wrap {
  position: relative;
  border: 1.5px solid ${T.creamDark};
  border-radius: ${T.radiusSm};
  background: ${T.white};
  margin-top: 6px;
}
.agreement-page .sig-canvas-wrap canvas {
  display: block;
  width: 100%;
  height: 120px;
  cursor: crosshair;
}
.agreement-page .sig-line {
  position: absolute;
  bottom: 30px;
  left: 20px;
  right: 20px;
  border-bottom: 1px dashed ${T.lightLine};
  pointer-events: none;
}
.agreement-page .sig-x {
  position: absolute;
  bottom: 32px;
  left: 20px;
  font-size: 14px;
  color: ${T.lightLine};
  pointer-events: none;
}
.agreement-page .ag-dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 12px 0;
}
.agreement-page .ag-lock-box {
  background: ${T.cream};
  border: 1.5px solid ${T.creamDark};
  border-radius: ${T.radiusSm};
  padding: 24px;
  text-align: center;
}
.agreement-page .ag-lock-row {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 12px;
}
.agreement-page .ag-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
  justify-content: center;
}
.agreement-page .ag-filled-value {
  display: none;
  font-weight: 500;
  padding: 2px 0;
}
.agreement-page .ag-sig-image {
  display: none;
  max-height: 100px;
}

/* PDF prep: hide interactive, show filled */
.agreement-page.pdf-mode .ag-input,
.agreement-page.pdf-mode .ag-radio-group,
.agreement-page.pdf-mode .sig-canvas-wrap,
.agreement-page.pdf-mode .ag-actions,
.agreement-page.pdf-mode .ag-lock-box,
.agreement-page.pdf-mode .ag-lock-row,
.agreement-page.pdf-mode .clear-sig-btn,
.agreement-page.pdf-mode .ag-back-btn {
  display: none !important;
}
.agreement-page.pdf-mode .ag-filled-value {
  display: block !important;
}
.agreement-page.pdf-mode .ag-sig-image {
  display: block !important;
}
.agreement-page.pdf-mode .exhibit-a {
  page-break-before: always;
  break-before: page;
}

/* success overlay */
.ag-success-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(43,43,43,0.5);
  backdrop-filter: blur(6px);
}
.ag-success-box {
  background: ${T.white};
  border-radius: ${T.radiusSm};
  padding: 48px 40px;
  max-width: 440px;
  width: 90%;
  text-align: center;
  box-shadow: ${T.shadowLg};
}
.ag-success-box h2 {
  border: none;
  text-align: center;
  margin: 16px 0 8px;
}
.ag-success-box p {
  color: ${T.textMuted};
  font-size: 14px;
}
.ag-success-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 600px) {
  .agreement-page {
    padding: 20px 12px 40px;
  }
  .agreement-page .ag-card {
    padding: 20px 16px;
  }
  .agreement-page .ag-dates {
    grid-template-columns: 1fr;
  }
  .agreement-page h1 { font-size: 22px; }
  .agreement-page h2 { font-size: 11px; }
}

@media print {
  .agreement-page .ag-input,
  .agreement-page .ag-radio-group,
  .agreement-page .sig-canvas-wrap,
  .agreement-page .ag-actions,
  .agreement-page .ag-lock-box,
  .agreement-page .ag-lock-row,
  .agreement-page .clear-sig-btn,
  .agreement-page .ag-back-btn {
    display: none !important;
  }
  .agreement-page .ag-filled-value {
    display: block !important;
  }
  .agreement-page .ag-sig-image {
    display: block !important;
  }
}
`;

/* ─── component ─── */
// mode: "sign" (resident signs) or "countersign" (admin countersigns)
// residentId: when countersigning, the resident's profile ID
export const AgreementPage = ({ user, onNav, mode = "sign", residentId }) => {
  const isCountersign = mode === "countersign";

  /* refs */
  const wrapRef = useRef(null);
  const residentSigRef = useRef(null);
  const companySigRef = useRef(null);
  const exhibitSigRef = useRef(null);
  const residentPad = useRef(null);
  const companyPad = useRef(null);
  const exhibitPad = useRef(null);

  /* form state */
  const [residentName, setResidentName] = useState(isCountersign ? "" : (user?.name || ""));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentOption, setPaymentOption] = useState("");
  const [photoConsent, setPhotoConsent] = useState("");
  const [residentPrintedName, setResidentPrintedName] = useState(isCountersign ? "" : (user?.name || ""));
  const [residentDate, setResidentDate] = useState("");
  const [exhibitPrintedName, setExhibitPrintedName] = useState(isCountersign ? "" : (user?.name || ""));
  const [exhibitDate, setExhibitDate] = useState("");
  const [companyDate, setCompanyDate] = useState("");

  /* company lock */
  const [companyUnlocked, setCompanyUnlocked] = useState(isCountersign);
  const [companyPass, setCompanyPass] = useState("");
  const [passError, setPassError] = useState(false);

  /* ui state */
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: "" });
  const [success, setSuccess] = useState(null); // { url, fileName }
  const [errors, setErrors] = useState([]);
  const [residentProfile, setResidentProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(isCountersign);

  /* load resident profile in countersign mode */
  useEffect(() => {
    if (!isCountersign || !residentId) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", residentId).single();
      if (data) {
        setResidentProfile(data);
        setResidentName(data.name || "");
        setResidentPrintedName(data.name || "");
        setExhibitPrintedName(data.name || "");
      }
      setLoadingProfile(false);
    };
    load();
  }, [isCountersign, residentId]);

  /* load html2pdf CDN */
  useEffect(() => {
    if (!document.querySelector('script[src*="html2pdf"]')) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      document.head.appendChild(s);
    }
  }, []);

  /* company pad was previously init'd via useEffect; now handled by callback ref in SigPad */

  /* cleanup */
  useEffect(() => {
    return () => {
      residentPad.current?.destroy();
      companyPad.current?.destroy();
      exhibitPad.current?.destroy();
    };
  }, []);

  /* auto-calc end date */
  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate + "T00:00:00");
      d.setMonth(d.getMonth() + 3);
      setEndDate(d.toISOString().split("T")[0]);
    } else {
      setEndDate("");
    }
  }, [startDate]);

  /* show toast */
  const flash = useCallback((msg) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: "" }), 3000);
  }, []);

  /* unlock company */
  const handleUnlock = () => {
    if (companyPass === "flowe2026") {
      setCompanyUnlocked(true);
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  /* ─── validation ─── */
  const validate = () => {
    const errs = [];
    if (isCountersign) {
      // Only validate company signature in countersign mode
      if (!companyPad.current?.state.hasSig) errs.push("Company signature is required.");
      if (!companyDate) errs.push("Company signature date is required.");
    } else {
      if (!residentName.trim()) errs.push("Resident name is required.");
      if (!startDate) errs.push("Start date is required.");
      if (!paymentOption) errs.push("Please select a payment option.");
      if (!photoConsent) errs.push("Please select a photo consent option.");
      if (!residentPrintedName.trim()) errs.push("Resident printed name (signatures section) is required.");
      if (!residentDate) errs.push("Resident signature date is required.");
      if (!residentPad.current?.state.hasSig) errs.push("Resident signature is required.");
      if (!exhibitPrintedName.trim()) errs.push("Exhibit A printed name is required.");
      if (!exhibitDate) errs.push("Exhibit A date is required.");
      if (!exhibitPad.current?.state.hasSig) errs.push("Exhibit A signature is required.");
      // Company signature is optional for resident — admin countersigns later
    }
    return errs;
  };

  /* ─── submit ─── */
  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      flash("Please fix errors before submitting.");
      return;
    }
    setErrors([]);
    setSubmitting(true);

    try {
      /* ── Countersign mode: just update profile, no new PDF ── */
      if (isCountersign) {
        const now = new Date().toISOString().split("T")[0];
        const { error: profErr } = await supabase
          .from("profiles")
          .update({
            agreement_countersigned: true,
            agreement_countersigned_date: now,
          })
          .eq("id", residentId);
        if (profErr) {
          console.error("Profile update error:", profErr);
          throw profErr;
        }
        setSuccess({ url: residentProfile?.agreement_url || "", fileName: "" });
        return;
      }

      /* ── Sign mode: generate PDF, upload, update profile ── */
      const el = wrapRef.current;

      /* prepare filled values */
      el.querySelectorAll(".ag-filled-value").forEach((fv) => {
        const key = fv.dataset.key;
        if (key === "residentName") fv.textContent = residentName;
        if (key === "startDate") fv.textContent = startDate;
        if (key === "endDate") fv.textContent = endDate;
        if (key === "paymentOption")
          fv.textContent =
            paymentOption === "A"
              ? "Option A. $4,500 Paid in Full"
              : "Option B. $1,650 per month (3 payments)";
        if (key === "photoConsent")
          fv.textContent = photoConsent === "yes" ? "I consent" : "I do not consent";
        if (key === "residentPrintedName") fv.textContent = residentPrintedName;
        if (key === "residentDate") fv.textContent = residentDate;
        if (key === "exhibitPrintedName") fv.textContent = exhibitPrintedName;
        if (key === "exhibitDate") fv.textContent = exhibitDate;
        if (key === "companyDate") fv.textContent = companyDate;
      });

      /* render canvas → images */
      el.querySelectorAll(".ag-sig-image").forEach((img) => {
        const key = img.dataset.key;
        if (key === "residentSig" && residentSigRef.current)
          img.src = residentSigRef.current.toDataURL("image/png");
        if (key === "companySig" && companySigRef.current)
          img.src = companySigRef.current.toDataURL("image/png");
        if (key === "exhibitSig" && exhibitSigRef.current)
          img.src = exhibitSigRef.current.toDataURL("image/png");
      });

      /* toggle pdf mode */
      el.classList.add("pdf-mode");

      const sanitized = residentName.trim().replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").toLowerCase();
      const ts = Date.now();
      const fileName = `${sanitized}-${startDate}-${ts}.pdf`;

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: fileName,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], before: [".exhibit-a"], avoid: [".sig-block", ".day"] },
      };

      /* generate PDF blob */
      // eslint-disable-next-line no-undef
      const pdfBlob = await html2pdf().set(opt).from(el).outputPdf("blob");

      el.classList.remove("pdf-mode");

      /* upload to supabase storage */
      const { error: uploadErr } = await supabase.storage
        .from("agreements")
        .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        throw uploadErr;
      }

      /* get public url */
      const { data: urlData } = supabase.storage.from("agreements").getPublicUrl(fileName);
      const publicUrl = urlData?.publicUrl || "";
      console.log("PDF uploaded:", publicUrl);

      const now = new Date().toISOString().split("T")[0];

      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          agreement_signed: true,
          agreement_date: now,
          agreement_url: publicUrl,
        })
        .eq("id", user.id);
      if (profErr) console.error("Profile update error:", profErr);

      const { error: docErr } = await supabase.from("documents").insert({
        name: "Residency Agreement \u2014 Signed",
        category: "Agreements",
        size: "PDF",
        date: now,
        url: publicUrl,
        storage_path: "agreements/" + fileName,
        uploaded_by: user.id,
      });
      if (docErr) console.error("Document insert error:", docErr);

      setSuccess({ url: publicUrl, fileName });
    } catch (err) {
      console.error("Agreement submit error:", err);
      flash("Error submitting agreement. Please try again.");
      wrapRef.current?.classList.remove("pdf-mode");
    } finally {
      setSubmitting(false);
    }
  };

  /* print */
  const handlePrint = () => {
    const el = wrapRef.current;
    el.querySelectorAll(".ag-filled-value").forEach((fv) => {
      const key = fv.dataset.key;
      if (key === "residentName") fv.textContent = residentName;
      if (key === "startDate") fv.textContent = startDate;
      if (key === "endDate") fv.textContent = endDate;
      if (key === "paymentOption")
        fv.textContent =
          paymentOption === "A"
            ? "Option A. $4,500 Paid in Full"
            : "Option B. $1,650 per month (3 payments)";
      if (key === "photoConsent")
        fv.textContent = photoConsent === "yes" ? "I consent" : "I do not consent";
      if (key === "residentPrintedName") fv.textContent = residentPrintedName;
      if (key === "residentDate") fv.textContent = residentDate;
      if (key === "exhibitPrintedName") fv.textContent = exhibitPrintedName;
      if (key === "exhibitDate") fv.textContent = exhibitDate;
      if (key === "companyDate") fv.textContent = companyDate;
    });
    el.querySelectorAll(".ag-sig-image").forEach((img) => {
      const key = img.dataset.key;
      if (key === "residentSig" && residentSigRef.current)
        img.src = residentSigRef.current.toDataURL("image/png");
      if (key === "companySig" && companySigRef.current)
        img.src = companySigRef.current.toDataURL("image/png");
      if (key === "exhibitSig" && exhibitSigRef.current)
        img.src = exhibitSigRef.current.toDataURL("image/png");
    });
    window.print();
  };

  /* ─────────────────────── JSX ─────────────────────── */
  return (
    <>
      <style>{AGREEMENT_CSS}</style>

      {/* toast */}
      <div
        style={{
          position: "fixed",
          bottom: toast.visible ? 32 : -60,
          left: "50%",
          transform: "translateX(-50%)",
          background: T.charcoal,
          color: T.cream,
          padding: "12px 24px",
          borderRadius: 24,
          fontSize: 13,
          fontWeight: 500,
          boxShadow: T.shadowLg,
          transition: "bottom .3s ease",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name="check" size={16} color={T.gold} /> {toast.msg}
      </div>

      {/* success overlay */}
      {success && (
        <div className="ag-success-overlay">
          <div className="ag-success-box">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: T.goldMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <Icon name="check" size={28} color={T.gold} />
            </div>
            <h2>{isCountersign ? "Agreement Countersigned" : "Agreement Submitted"}</h2>
            <p>{isCountersign
              ? `The agreement for ${residentName} has been countersigned and saved.`
              : "Your signed residency agreement has been submitted and saved to your documents."
            }</p>
            <div className="ag-success-actions">
              <Btn
                variant="primary"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = success.url;
                  a.download = success.fileName;
                  a.target = "_blank";
                  a.click();
                }}
              >
                Download PDF
              </Btn>
              <Btn variant="outline" onClick={() => { setSuccess(null); if (onNav) onNav(isCountersign ? "a-dash" : "onboarding"); }}>
                {isCountersign ? "Back to Dashboard" : "Back to Onboarding"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* loading state for countersign */}
      {loadingProfile && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <p style={{ color: T.textMuted, fontSize: 13 }}>Loading agreement...</p>
        </div>
      )}

      {/* ── COUNTERSIGN MODE: show signed PDF + company sig ── */}
      {isCountersign && !loadingProfile && (
        <div className="agreement-page" ref={wrapRef}>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => onNav && onNav("a-dash")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: T.textMuted, fontSize: 13 }}>
              <Icon name="back" size={16} color={T.textMuted} /> Back to Dashboard
            </button>
            <div style={{ background: T.goldMuted, borderRadius: T.radiusSm, padding: "12px 16px", marginTop: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: T.charcoal }}>
                Countersigning agreement for <strong>{residentName}</strong>
              </p>
              <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                Review the signed agreement below, then add your company signature.
              </p>
            </div>
          </div>

          <h1>FLOWE COLLECTIVE</h1>
          <p className="ag-subtitle">Stylist Residency Program Agreement</p>

          {/* Embed the signed PDF */}
          {residentProfile?.agreement_url ? (
            <div style={{ marginBottom: 24 }}>
              <iframe
                src={residentProfile.agreement_url}
                style={{ width: "100%", height: 800, border: `1px solid ${T.lightLine}`, borderRadius: T.radiusSm }}
                title="Signed Agreement"
              />
              <a href={residentProfile.agreement_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: T.gold, marginTop: 8, display: "inline-block" }}>
                Open PDF in new tab
              </a>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: "center", color: T.textMuted, fontSize: 13, background: T.cream, borderRadius: T.radiusSm, marginBottom: 24 }}>
              No signed agreement PDF found for this resident.
            </div>
          )}

          {/* errors */}
          {errors.length > 0 && (
            <div style={{ background: T.dangerBg, border: `1px solid ${T.danger}`, borderRadius: T.radiusSm, padding: "16px 20px", marginBottom: 20 }}>
              <strong style={{ color: T.danger, fontSize: 13 }}>Please fix the following:</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {errors.map((e, i) => <li key={i} style={{ color: T.danger, fontSize: 13 }}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Company signature */}
          <div className="ag-card">
            <h2>Company Countersignature</h2>
            <h3>Company &mdash; Flowe Beauty Interests LLC / Jordan Wang</h3>
            <SigPad canvasRef={companySigRef} padRef={companyPad} label="Signature" />
            <div style={{ marginTop: 12 }}>
              <label className="ag-label">Date</label>
              <input
                className="ag-input"
                type="date"
                value={companyDate}
                onChange={(e) => setCompanyDate(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="ag-actions">
            <Btn variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Countersigning..." : "Countersign Agreement"}
            </Btn>
          </div>
        </div>
      )}

      {/* ── SIGN MODE: full agreement form ── */}
      {!isCountersign && !loadingProfile && (
      <div className="agreement-page" ref={wrapRef}>
        <h1>FLOWE COLLECTIVE</h1>
        <p className="ag-subtitle">Stylist Residency Program Agreement</p>

        {/* errors */}
        {errors.length > 0 && (
          <div
            style={{
              background: T.dangerBg,
              border: `1px solid ${T.danger}`,
              borderRadius: T.radiusSm,
              padding: "16px 20px",
              marginBottom: 20,
            }}
          >
            <strong style={{ color: T.danger, fontSize: 13 }}>Please fix the following:</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {errors.map((e, i) => (
                <li key={i} style={{ color: T.danger, fontSize: 13 }}>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Section 1 ── */}
        <div className="ag-card">
          <h2>1. Parties</h2>
          <p>This Agreement is entered into between:</p>
          <p className="ag-address">
            <strong>Flowe Beauty Interests LLC</strong>{"\n"}
            d/b/a Flowe Collective{"\n"}
            1207 W 34th St, Suite 400{"\n"}
            Houston, TX 77018{"\n"}
            (&ldquo;Company&rdquo;)
          </p>
          <p>and</p>
          <label className="ag-label" style={{ marginTop: 12 }}>Resident Name</label>
          <input
            className="ag-input"
            value={residentName}
            onChange={(e) => { setResidentName(e.target.value); setResidentPrintedName(e.target.value); setExhibitPrintedName(e.target.value); }}
            placeholder="Full legal name"
          />
          <div className="ag-filled-value" data-key="residentName" />
          <p>(&ldquo;Resident&rdquo;)</p>
        </div>

        {/* ── Section 2 ── */}
        <div className="ag-card">
          <h2>2. Definitions</h2>
          <p>For purposes of this Agreement, the following terms have the meanings set forth below:</p>
          <ul>
            <li><strong>&ldquo;Agreement&rdquo;</strong> means this Stylist Residency Program Agreement, including all exhibits attached hereto.</li>
            <li><strong>&ldquo;Company&rdquo;</strong> means Flowe Beauty Interests LLC, doing business as Flowe Collective.</li>
            <li><strong>&ldquo;Resident&rdquo;</strong> means the individual enrolled in the Stylist Residency Program and employed by the Company under the terms of this Agreement.</li>
            <li><strong>&ldquo;Program&rdquo;</strong> means the Flowe Collective Stylist Residency Program described in this Agreement and in Exhibit A.</li>
            <li><strong>&ldquo;Program Term&rdquo;</strong> means the three (3) month duration of the Program as defined in Section 4.</li>
            <li><strong>&ldquo;Exhibit A&rdquo;</strong> means the Residency Program Structure attached to and incorporated into this Agreement.</li>
          </ul>
        </div>

        {/* ── Section 3 ── */}
        <div className="ag-card">
          <h2>3. Program Description</h2>
          <p>
            The Flowe Collective Stylist Residency Program (&ldquo;Program&rdquo;) is a structured three (3) month educational training program designed to provide licensed cosmetologists with advanced technical development, business education, and supervised salon experience.
          </p>
          <p>The Program includes:</p>
          <ul>
            <li>Technical skill refinement in a chosen specialty area</li>
            <li>Business structure, pricing strategy, and career development education</li>
            <li>Direct mentorship from Jordan Wang</li>
            <li>Supervised salon floor experience with real clients and models</li>
            <li>Participation in training sessions and demonstrations</li>
            <li>Access to salon facilities, tools, and products during program hours</li>
          </ul>
          <p>
            The primary purpose of the Program is education and professional development. Any services performed during the Program are intended to support the Resident&rsquo;s learning and are performed under supervision. The general structure of the Program schedule and training activities is outlined in Exhibit A (Residency Program Structure) attached to this Agreement.
          </p>
        </div>

        {/* ── Section 4 ── */}
        <div className="ag-card">
          <h2>4. Program Term</h2>
          <div className="ag-dates">
            <div>
              <label className="ag-label">Start Date</label>
              <input
                className="ag-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <div className="ag-filled-value" data-key="startDate" />
            </div>
            <div>
              <label className="ag-label">End Date (auto-calculated)</label>
              <input className="ag-input" type="date" value={endDate} readOnly style={{ opacity: 0.7 }} />
              <div className="ag-filled-value" data-key="endDate" />
            </div>
          </div>
          <p>Total duration: Three (3) months</p>
          <p>Completion of the Program does not guarantee employment with Flowe Collective beyond the Program term.</p>
        </div>

        {/* ── Section 5 ── */}
        <div className="ag-card">
          <h2>5. Tuition and Payment</h2>
          <p>Total tuition for the Program is $4,500 (Four Thousand Five Hundred Dollars).</p>
          <p>Payment may be made under one of the following options:</p>
          <p><strong>Option A.</strong> Paid in Full &mdash; $4,500 due prior to Program start.</p>
          <p><strong>Option B.</strong> Installment Plan &mdash; Three monthly payments of $1,650 ($4,950 total) beginning at enrollment. Installment pricing includes a $450 financing fee.</p>
          <p>All payments are processed through Stripe.</p>
          <p style={{ marginTop: 16 }}><strong>Selected payment option:</strong></p>
          <div className="ag-radio-group">
            <label className={`ag-radio-label${paymentOption === "A" ? " selected" : ""}`}>
              <input
                type="radio"
                name="payment"
                checked={paymentOption === "A"}
                onChange={() => setPaymentOption("A")}
              />
              Option A. $4,500 Paid in Full
            </label>
            <label className={`ag-radio-label${paymentOption === "B" ? " selected" : ""}`}>
              <input
                type="radio"
                name="payment"
                checked={paymentOption === "B"}
                onChange={() => setPaymentOption("B")}
              />
              Option B. $1,650 per month (3 payments)
            </label>
          </div>
          <div className="ag-filled-value" data-key="paymentOption" />
          <p>Tuition covers the educational components of the Program including instruction, mentorship, and training resources.</p>
        </div>

        {/* ── Section 6 ── */}
        <div className="ag-card">
          <h2>6. Employment During Program</h2>
          <p>Concurrent with enrollment in the Program, the Resident is employed by the Company as a Salon Assistant.</p>
          <p>As an employee, the Resident will:</p>
          <ul>
            <li>Be classified as a W-2 employee</li>
            <li>Be compensated at $7.25 per hour for all approved hours worked</li>
            <li>Receive wages according to the Company&rsquo;s normal payroll schedule</li>
          </ul>
          <p>
            Residents will record all required Program hours using the Company&rsquo;s designated timekeeping system. The Resident is responsible for accurately clocking in and out for all required Program activities. The Resident will be compensated at the hourly wage specified in this Agreement for all required Program hours, including training sessions, shadowing, model practice, clinic participation, and assistant shifts.
          </p>
          <p>Employment duties may include:</p>
          <ul>
            <li>Assisting stylists</li>
            <li>Preparing color or supplies</li>
            <li>Shampooing clients</li>
            <li>Performing supervised services</li>
            <li>Supporting daily salon operations</li>
          </ul>
          <p>Employment status is distinct from, but concurrent with, enrollment in the Program.</p>
        </div>

        {/* ── Section 7 ── */}
        <div className="ag-card">
          <h2>7. No Offset Between Tuition and Wages</h2>
          <p>The Resident acknowledges that tuition payments and wages earned during employment are separate and independent financial obligations.</p>
          <ul>
            <li>Tuition is payment for educational instruction and participation in the Program.</li>
            <li>Wages are compensation for approved hours worked as a salon employee.</li>
          </ul>
          <p>Under no circumstances will tuition payments or financing fees be deducted from wages or used to offset wages owed.</p>
        </div>

        {/* ── Section 8 ── */}
        <div className="ag-card">
          <h2>8. Training Activities</h2>
          <p>Training activities during the Program may include:</p>
          <ul>
            <li>Shadowing senior stylists</li>
            <li>Performing supervised services on models or clients</li>
            <li>Assisting in color preparation or service setup</li>
            <li>Observing consultations and service execution</li>
            <li>Participating in training workshops and demonstrations</li>
            <li>Completing assigned educational exercises</li>
          </ul>
          <p>These activities are designed primarily to enhance the Resident&rsquo;s professional skills and experience.</p>
        </div>

        {/* ── Section 9 ── */}
        <div className="ag-card">
          <h2>9. Training Priority and Educational Acknowledgment</h2>
          <p>
            The Resident acknowledges and agrees that the primary purpose of the Stylist Residency Program is education, mentorship, and professional development. The Resident understands that any services performed during the Program are conducted for training purposes under supervision and may be offered at reduced pricing or as practice services.
          </p>
          <p>The Resident further acknowledges that:</p>
          <ul>
            <li>The Program is designed to provide hands-on learning opportunities</li>
            <li>Participation in services or model work is intended to improve skills</li>
            <li>The Resident is not guaranteed a client book, commission structure, or stylist-level income during the Program</li>
          </ul>
          <p>The Resident agrees that the training and mentorship received through the Program constitute substantial educational benefit.</p>
        </div>

        {/* ── Section 10 ── */}
        <div className="ag-card">
          <h2>10. Resident Expectations</h2>
          <p>Residents agree to:</p>
          <ul>
            <li>Attend all scheduled sessions and training activities</li>
            <li>Arrive on time and prepared</li>
            <li>Maintain professional conduct</li>
            <li>Follow sanitation and safety standards</li>
            <li>Respect clients, staff, and fellow Residents</li>
            <li>Participate actively in the curriculum</li>
          </ul>
          <p>Repeated absences or unprofessional behavior may result in dismissal from the Program.</p>
        </div>

        {/* ── Section 11 ── */}
        <div className="ag-card">
          <h2>11. Flowe Collective Obligations</h2>
          <p>Flowe Collective agrees to:</p>
          <ul>
            <li>Provide curriculum, mentorship, and supervised training</li>
            <li>Maintain a professional and safe learning environment</li>
            <li>Provide constructive feedback throughout the Program</li>
            <li>Offer access to salon tools and facilities during training hours</li>
          </ul>
        </div>

        {/* ── Section 12 ── */}
        <div className="ag-card">
          <h2>12. Failed or Late Payments</h2>
          <p>
            If a scheduled tuition payment fails, the Resident will have five (5) business days to resolve the payment. Failure to resolve payment within this period may result in suspension or termination from the Program. No refund will be issued for completed portions of the Program.
          </p>
        </div>

        {/* ── Section 13 ── */}
        <div className="ag-card">
          <h2>13. Refund and Cancellation Policy</h2>
          <p>All tuition payments are non-refundable once the Program begins.</p>
          <p>If the Resident cancels enrollment before the Program start date:</p>
          <ul>
            <li>More than 14 days before start date: Full refund minus a $250 administrative fee</li>
            <li>14 days or fewer before start date: 50% refund</li>
            <li>After the Program start date: No refund</li>
          </ul>
        </div>

        {/* ── Section 14 ── */}
        <div className="ag-card">
          <h2>14. At-Will Employment</h2>
          <p>
            The Resident&rsquo;s employment with the Company is at-will. Either the Company or the Resident may terminate the employment relationship at any time, with or without cause or advance notice. Termination of employment will concurrently result in termination of participation in the Program.
          </p>
        </div>

        {/* ── Section 15 ── */}
        <div className="ag-card">
          <h2>15. Workplace Safety</h2>
          <p>Residents acknowledge that salon work involves:</p>
          <ul>
            <li>Sharp tools</li>
            <li>Heated styling equipment</li>
            <li>Chemical products</li>
            <li>Close interaction with clients</li>
          </ul>
          <p>Residents agree to follow all safety protocols and sanitation guidelines. Workplace injuries will be handled according to applicable Texas employment laws.</p>
        </div>

        {/* ── Section 16 ── */}
        <div className="ag-card">
          <h2>16. Confidentiality</h2>
          <p>The Resident agrees to maintain confidentiality regarding:</p>
          <ul>
            <li>Client information</li>
            <li>Business operations</li>
            <li>Pricing strategies</li>
            <li>Proprietary techniques</li>
            <li>Internal training materials</li>
          </ul>
          <p>This obligation survives termination of the Agreement.</p>
        </div>

        {/* ── Section 17 ── */}
        <div className="ag-card">
          <h2>17. Intellectual Property</h2>
          <p>
            All curriculum materials, frameworks, systems, and educational content used during the Program are the exclusive intellectual property of Flowe Collective. Residents may not reproduce, distribute, or commercially use these materials without prior written consent.
          </p>
        </div>

        {/* ── Section 18 ── */}
        <div className="ag-card">
          <h2>18. Photo and Content Release</h2>
          <p>
            The Resident grants Flowe Collective permission to photograph or record the Resident during the Program for use in marketing, social media, and educational materials.
          </p>
          <div className="ag-radio-group">
            <label className={`ag-radio-label${photoConsent === "yes" ? " selected" : ""}`}>
              <input
                type="radio"
                name="photoConsent"
                checked={photoConsent === "yes"}
                onChange={() => setPhotoConsent("yes")}
              />
              I consent
            </label>
            <label className={`ag-radio-label${photoConsent === "no" ? " selected" : ""}`}>
              <input
                type="radio"
                name="photoConsent"
                checked={photoConsent === "no"}
                onChange={() => setPhotoConsent("no")}
              />
              I do not consent
            </label>
          </div>
          <div className="ag-filled-value" data-key="photoConsent" />
          <p>Consent may be revoked in writing at any time.</p>
        </div>

        {/* ── Section 19 ── */}
        <div className="ag-card">
          <h2>19. Non-Solicitation of Clients and Staff</h2>
          <p>
            During the Program and for a period of twelve (12) months following the Resident&rsquo;s termination of employment or completion of the Program, the Resident agrees not to directly or indirectly:
          </p>
          <ul>
            <li>Solicit or attempt to solicit clients of Flowe Collective for competing salon services</li>
            <li>Encourage or attempt to encourage any employee, stylist, or independent contractor of Flowe Collective to leave their relationship with the Company</li>
            <li>Use client contact information obtained during the Program to provide competing services outside of Flowe Collective</li>
          </ul>
          <p>Nothing in this section prevents the Resident from working in the cosmetology industry after leaving the Program.</p>
        </div>

        {/* ── Section 20 ── */}
        <div className="ag-card">
          <h2>20. Professional Development Disclaimer</h2>
          <p>
            The Resident acknowledges that the Stylist Residency Program is designed to provide professional education, mentorship, and hands-on experience.
          </p>
          <p>Flowe Collective does not guarantee any specific outcome including:</p>
          <ul>
            <li>Mastery of specific techniques</li>
            <li>Income levels or earning potential</li>
            <li>Development of a personal client base</li>
            <li>Employment opportunities after completion of the Program</li>
            <li>Business success in the cosmetology industry</li>
          </ul>
          <p>
            The Resident understands that professional growth and skill development depend on individual effort, practice, and experience beyond the scope of the Program. Participation in the Program does not guarantee any particular professional result.
          </p>
        </div>

        {/* ── Section 21 ── */}
        <div className="ag-card">
          <h2>21. Governing Law</h2>
          <p>
            This Agreement shall be governed by the laws of the State of Texas. Any disputes arising from this Agreement shall be resolved in the courts of Harris County, Texas.
          </p>
        </div>

        {/* ── Section 22 ── */}
        <div className="ag-card">
          <h2>22. Entire Agreement</h2>
          <p>
            This Agreement represents the entire understanding between the parties and supersedes all prior discussions or agreements. Any modifications must be made in writing and signed by both parties.
          </p>
        </div>

        {/* ── Section 23 ── */}
        <div className="ag-card">
          <h2>23. Chargeback and Payment Dispute Agreement</h2>
          <p>
            The Resident acknowledges that tuition payments are made for enrollment in a structured professional training program and represent payment for educational services provided by Flowe Collective.
          </p>
          <p>
            By signing this Agreement, the Resident agrees not to initiate a chargeback, payment reversal, or dispute with their credit card provider or financial institution for tuition payments that were authorized under this Agreement.
          </p>
          <p>If a chargeback or payment dispute is initiated, the Company reserves the right to:</p>
          <ul>
            <li>Immediately terminate participation in the Program</li>
            <li>Pursue recovery of unpaid tuition</li>
            <li>Recover any fees, costs, or damages incurred by the Company as a result of the chargeback</li>
          </ul>
          <p>The Resident agrees that this signed Agreement may be used as evidence in resolving any payment dispute.</p>
        </div>

        {/* ── Section 24 ── */}
        <div className="ag-card">
          <h2>24. Early Withdrawal</h2>
          <p>If the Resident voluntarily withdraws from the Program before completion:</p>
          <ul>
            <li>Tuition remains fully owed and non-refundable once the Program has begun</li>
            <li>Withdrawal from the Program does not cancel any outstanding payment obligations</li>
            <li>If the Resident is on a payment plan, remaining payments will continue according to the agreed schedule</li>
          </ul>
          <p>
            The Resident understands that Program tuition reflects enrollment in the Program as a whole and is not based on attendance or completion of individual training sessions.
          </p>
        </div>

        {/* ── SIGNATURES ── */}
        <div className="ag-card">
          <h2>Signatures</h2>

          {/* Resident signature */}
          <h3>Resident</h3>
          <div style={{ marginTop: 8 }}>
            <label className="ag-label">Printed Name</label>
            <input
              className="ag-input"
              value={residentPrintedName}
              onChange={(e) => setResidentPrintedName(e.target.value)}
              placeholder="Full legal name"
            />
            <div className="ag-filled-value" data-key="residentPrintedName" />
          </div>
          <SigPad canvasRef={residentSigRef} padRef={residentPad} label="Signature" />
          <img className="ag-sig-image" data-key="residentSig" alt="Resident Signature" />
          <div style={{ marginTop: 12 }}>
            <label className="ag-label">Date</label>
            <input
              className="ag-input"
              type="date"
              value={residentDate}
              onChange={(e) => setResidentDate(e.target.value)}
            />
            <div className="ag-filled-value" data-key="residentDate" />
          </div>

          {/* Company signature */}
          <h3 style={{ marginTop: 32 }}>Company &mdash; Flowe Beauty Interests LLC / Jordan Wang</h3>

          {!companyUnlocked ? (
            <div className="ag-lock-box">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <p style={{ color: T.textMuted, fontSize: 13, margin: "8px 0 0" }}>
                Enter the company password to unlock this section.
              </p>
              <div className="ag-lock-row">
                <input
                  className="ag-input"
                  type="password"
                  value={companyPass}
                  onChange={(e) => {
                    setCompanyPass(e.target.value);
                    setPassError(false);
                  }}
                  placeholder="Password"
                  style={{ maxWidth: 220 }}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                />
                <Btn variant="primary" onClick={handleUnlock} style={{ whiteSpace: "nowrap" }}>
                  Unlock
                </Btn>
              </div>
              {passError && (
                <p style={{ color: T.danger, fontSize: 12, marginTop: 8 }}>Incorrect password.</p>
              )}
            </div>
          ) : (
            <div>
              <SigPad canvasRef={companySigRef} padRef={companyPad} label="Signature" />
              <img className="ag-sig-image" data-key="companySig" alt="Company Signature" />
              <div style={{ marginTop: 12 }}>
                <label className="ag-label">Date</label>
                <input
                  className="ag-input"
                  type="date"
                  value={companyDate}
                  onChange={(e) => setCompanyDate(e.target.value)}
                />
                <div className="ag-filled-value" data-key="companyDate" />
              </div>
            </div>
          )}
        </div>

        {/* ── EXHIBIT A ── */}
        <div className="ag-card exhibit-a">
          <h2>Exhibit A &mdash; Residency Program Structure</h2>
          <p>
            The following schedule represents a general example of the training structure used in the Flowe Collective Stylist Residency Program. The Program runs for twelve (12) weeks and meets four (4) days per week.
          </p>
          <p>
            The schedule is provided for illustrative purposes only and may be modified by the Company based on salon operations, educator availability, training needs, client scheduling, or program development. The Company reserves the right to adjust the structure, sequence, or timing of training activities while maintaining the overall educational purpose of the Program.
          </p>

          <div className="day" style={{ marginTop: 20 }}>
            <h3>Monday: Education + Technical Development</h3>
            <p>
              Structured education including: technical demonstrations, color theory and formulation, consultation strategy, pricing and business development, product knowledge, and salon systems.
            </p>
          </div>

          <div className="day">
            <h3>Wednesday: Model Practice Lab</h3>
            <p>
              Residents perform services on live models under direct supervision to develop and refine technical skills.
            </p>
          </div>

          <div className="day">
            <h3>Friday: Salon Integration / Assisting</h3>
            <p>
              Residents integrate onto the salon floor to assist senior stylists, prepare color and supplies, shampoo clients, and support daily salon operations.
            </p>
          </div>

          <div className="day">
            <h3>Saturday: Emerging Artist Clinic</h3>
            <p>
              Residents perform services on clients under supervision during designated clinic hours. Services may be offered at reduced pricing and are intended for supervised skill development and building confidence on the floor.
            </p>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>Program Flexibility</h3>
            <p>Schedules may vary depending on salon operations, educator availability, or training needs.</p>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Compensation Acknowledgment</h3>
            <p>
              As outlined in Section 6 of this Agreement, the Resident will record all required Program hours using the Company&rsquo;s designated timekeeping system. This includes hours spent participating in required education, Model Practice Labs, Friday salon integration/assisting shifts, and Emerging Artist Clinic activities. All approved Program hours will be compensated at the hourly wage specified in this Agreement.
            </p>
          </div>
        </div>

        {/* ── Exhibit A acknowledgment ── */}
        <div className="ag-card">
          <h2>Resident Acknowledgment of Exhibit A</h2>
          <p>
            The Resident acknowledges that they have reviewed Exhibit A (Residency Program Structure) and understand the general format of the training program.
          </p>
          <div style={{ marginTop: 16 }}>
            <label className="ag-label">Printed Name</label>
            <input
              className="ag-input"
              value={exhibitPrintedName}
              onChange={(e) => setExhibitPrintedName(e.target.value)}
              placeholder="Full legal name"
            />
            <div className="ag-filled-value" data-key="exhibitPrintedName" />
          </div>
          <SigPad canvasRef={exhibitSigRef} padRef={exhibitPad} label="Signature" />
          <img className="ag-sig-image" data-key="exhibitSig" alt="Exhibit A Signature" />
          <div style={{ marginTop: 12 }}>
            <label className="ag-label">Date</label>
            <input
              className="ag-input"
              type="date"
              value={exhibitDate}
              onChange={(e) => setExhibitDate(e.target.value)}
            />
            <div className="ag-filled-value" data-key="exhibitDate" />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="ag-actions">
          <Btn variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Agreement"}
          </Btn>
          <Btn variant="outline" onClick={handlePrint}>
            Print
          </Btn>
        </div>
      </div>
      )}
    </>
  );
};
