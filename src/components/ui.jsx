import { useState, useEffect } from "react";
import { T } from "../theme";
import { Icon } from "./Icon";

export const Card = ({ children, style, className = "", onClick }) => (
  <div
    className={className}
    onClick={onClick}
    style={{ background: T.white, borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.lightLine}`, ...style }}
  >
    {children}
  </div>
);

export const Badge = ({ children, color = T.gold, bg }) => (
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

export const Avatar = ({ name, size = 36, photo }) => {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
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

export const SectionTitle = ({ children, sub, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
    <div>
      <h2 style={{ fontFamily: T.fontD, fontSize: "26px", fontWeight: 600, color: T.charcoal, lineHeight: 1.2 }}>{children}</h2>
      {sub && <p style={{ color: T.textMuted, fontSize: "13px", marginTop: 4 }}>{sub}</p>}
    </div>
    {action}
  </div>
);

export const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: T.textMuted, marginBottom: 6 }}>
      {label}
    </label>
    {children}
  </div>
);

export const Btn = ({ children, onClick, variant = "primary", style: s, disabled }) => {
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

export const Modal = ({ open, onClose, title, children, width = 500 }) => {
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

export const Toast = ({ message, visible }) => (
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
