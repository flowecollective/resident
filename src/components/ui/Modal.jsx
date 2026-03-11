import { useState, useEffect } from "react";
import { T } from "../../theme";
import { Icon } from "./Icon";

export const Modal = ({ open, onClose, title, children, width = 500 }) => {
  useEffect(() => {
    if (open) {
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
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
