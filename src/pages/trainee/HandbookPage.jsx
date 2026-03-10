import { useState } from "react";
import { T } from "../../theme";
import { Card, SectionTitle } from "../../components/ui";
import { HANDBOOK_SECTIONS } from "../../data/handbook";

export const HandbookPage = () => {
  const [activeSection, setActiveSection] = useState("welcome");

  const current = HANDBOOK_SECTIONS.find((s) => s.id === activeSection) || HANDBOOK_SECTIONS[0];

  const renderContent = (content) =>
    content.map((block, i) => {
      if (block.type === "p") {
        return (
          <p key={i} style={{ fontSize: "14px", lineHeight: 1.7, color: T.text, marginBottom: 12 }}>
            {block.text}
          </p>
        );
      }
      if (block.type === "h3") {
        return (
          <h4 key={i} style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, color: T.charcoal, marginTop: 20, marginBottom: 8 }}>
            {block.text}
          </h4>
        );
      }
      if (block.type === "li") {
        return (
          <ul key={i} style={{ paddingLeft: 20, marginBottom: 12 }}>
            {block.items.map((item, j) => (
              <li key={j} style={{ fontSize: "13px", lineHeight: 1.7, color: T.text, marginBottom: 4 }}>
                {item}
              </li>
            ))}
          </ul>
        );
      }
      return null;
    });

  return (
    <div className="fade-up">
      <SectionTitle sub="Everything you need to know about the Flowe program">
        Trainee Handbook
      </SectionTitle>

      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        {/* TOC Sidebar */}
        <Card style={{ padding: 16, position: "sticky", top: 20, alignSelf: "start" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: T.textMuted, marginBottom: 12 }}>
            Table of Contents
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {HANDBOOK_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: T.radiusSm,
                  border: "none",
                  background: activeSection === sec.id ? T.goldMuted : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background .15s",
                  width: "100%",
                }}
              >
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: activeSection === sec.id ? T.gold : T.textMuted,
                  minWidth: 20,
                }}>
                  {sec.num}
                </span>
                <span style={{
                  fontSize: "13px",
                  fontWeight: activeSection === sec.id ? 600 : 400,
                  color: activeSection === sec.id ? T.gold : T.charcoal,
                }}>
                  {sec.title}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Content Panel */}
        <Card style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: "32px", fontWeight: 700, fontFamily: T.fontD, color: T.goldLight }}>
              {current.num}
            </span>
            <h3 style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 600, color: T.charcoal }}>
              {current.title}
            </h3>
          </div>
          {renderContent(current.content)}
        </Card>
      </div>
    </div>
  );
};
