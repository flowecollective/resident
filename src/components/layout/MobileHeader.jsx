import { T } from "../../theme";
import { Avatar } from "../ui";

export const MobileHeader = ({ user, onMenuToggle }) => (
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
