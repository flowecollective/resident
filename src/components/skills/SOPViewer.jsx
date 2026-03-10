import { useState } from "react";
import { T } from "../../theme";
import { Icon } from "../ui";

export const SOP_SECTIONS = [
  { key: "steps", label: "Key Steps", icon: "check", color: T.gold },
  { key: "mistakes", label: "Common Mistakes", icon: "alert", color: T.danger },
  { key: "consultation", label: "Consultation Notes", icon: "message", color: "#4285f4" },
  { key: "tips", label: "Pro Tips", icon: "zap", color: "#8B6AAE" },
  { key: "tools", label: "Tools Required", icon: "template", color: T.textMuted },
];

export const SOPViewer = ({ sop }) => {
  const [activeTab, setActiveTab] = useState(null);
  if (!sop) return null;
  const sections = SOP_SECTIONS.filter((s) => sop[s.key]);
  if (sections.length === 0) return null;

  return (
    <div style={{ marginTop: 8, borderTop: "1px solid " + T.lightLine, paddingTop: 8 }}>
      <p style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 8 }}>Curriculum</p>
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
