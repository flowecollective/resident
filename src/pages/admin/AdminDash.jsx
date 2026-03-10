import { T } from "../../theme";
import { useData } from "../../context";
import { getProgress } from "../../utils";
import { Card, Avatar, ProgressBar, Icon } from "../../components/ui";

export const AdminDash = () => {
  const { schedule, presets, docs, residents, masterProgram } = useData();

  const stats = [
    { label: "Trainees", value: residents.length, icon: "users", color: T.gold },
    { label: "Events", value: schedule.length, icon: "calendar", color: T.success },
    { label: "Presets", value: presets.length, icon: "template", color: "#8B6AAE" },
    { label: "Documents", value: docs.length, icon: "file", color: T.warn },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: T.radiusSm, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={18} color={s.color} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted }}>{s.label}</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: T.fontD, color: T.charcoal }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 24 }}>
        <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>Trainee Progress</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {residents.map((r) => {
            const prog = getProgress(r, masterProgram);
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.lightLine}` }}>
                <Avatar name={r.name} size={32} />
                <span style={{ fontSize: "14px", fontWeight: 500, minWidth: 120 }}>{r.name}</span>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={prog.pct} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: T.gold, minWidth: 40, textAlign: "right" }}>{prog.pct}%</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
