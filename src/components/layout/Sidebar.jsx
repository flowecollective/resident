import { T } from "../../theme";
import { Icon, Avatar } from "../ui";

export const Sidebar = ({ user, page, onNav, onLogout, mobileOpen, setMobileOpen }) => {
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
