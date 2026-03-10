import { useState } from "react";
import { T } from "../../theme";
import { useData } from "../../context";
import { DEMO_GCAL_EVENTS } from "../../data/gcalEvents";
import { Card, Badge, Btn, Icon, SectionTitle } from "../../components/ui";

export const SettingsPage = () => {
  const { showToast } = useData();
  const [gcalConnected, setGcalConnected] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const toggleGcal = () => {
    setGcalConnected(!gcalConnected);
    showToast(gcalConnected ? "Google Calendar disconnected" : "Google Calendar connected (demo)");
    if (!gcalConnected) setShowEvents(true);
  };

  const portalInfo = [
    { label: "Portal Version", value: "1.0.0-beta" },
    { label: "Platform", value: "Flowe Collective" },
    { label: "Environment", value: "Demo / Preview" },
    { label: "Data Persistence", value: "Session only (in-memory)" },
    { label: "Last Updated", value: "March 2026" },
    { label: "Stack", value: "React + Vite" },
  ];

  return (
    <div className="fade-up">
      <SectionTitle sub="Portal configuration and integrations">
        Settings
      </SectionTitle>

      {/* Google Calendar Integration */}
      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: T.radiusSm,
                background: gcalConnected ? T.successBg : T.cream,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="calendar" size={22} color={gcalConnected ? T.success : T.textMuted} />
            </div>
            <div>
              <h4 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 4 }}>
                Google Calendar
              </h4>
              <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.5, maxWidth: 460 }}>
                Connect your salon's Google Calendar to sync appointments, detect scheduling conflicts,
                and auto-populate trainee schedules. Events from your calendar will appear alongside training sessions.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <Badge color={gcalConnected ? T.success : T.textMuted} bg={gcalConnected ? T.successBg : T.charcoalMuted}>
                  {gcalConnected ? "Connected" : "Not connected"}
                </Badge>
                {gcalConnected && (
                  <span style={{ fontSize: "11px", color: T.textMuted }}>
                    {DEMO_GCAL_EVENTS.length} events synced
                  </span>
                )}
              </div>
            </div>
          </div>
          <Btn
            variant={gcalConnected ? "outline" : "primary"}
            onClick={toggleGcal}
            style={{ fontSize: "12px", padding: "8px 18px", flexShrink: 0 }}
          >
            <Icon name={gcalConnected ? "x" : "zap"} size={14} color={gcalConnected ? T.textMuted : T.cream} />
            {gcalConnected ? "Disconnect" : "Connect"}
          </Btn>
        </div>

        {/* Demo events preview */}
        {gcalConnected && showEvents && (
          <div style={{ marginTop: 20, borderTop: "1px solid " + T.lightLine, paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted }}>
                Synced Events (Demo)
              </p>
              <button
                onClick={() => setShowEvents(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
              >
                <Icon name="x" size={14} color={T.textMuted} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DEMO_GCAL_EVENTS.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: T.cream,
                    borderRadius: T.radiusSm,
                    border: "1px solid " + T.lightLine,
                  }}
                >
                  <div style={{ width: 4, height: 24, borderRadius: 2, background: "#4285f4" }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                    <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.date} &middot; {ev.time}</p>
                  </div>
                  <Badge color="#4285f4">GCal</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Conflict Detection */}
      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: T.radiusSm,
              background: T.warnBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="alert" size={22} color={T.warn} />
          </div>
          <div>
            <h4 style={{ fontFamily: T.fontD, fontSize: "17px", fontWeight: 600, marginBottom: 4 }}>
              Conflict Detection
            </h4>
            <p style={{ fontSize: "13px", color: T.textMuted, lineHeight: 1.5, maxWidth: 520 }}>
              When Google Calendar is connected, the scheduler will automatically detect conflicts between
              salon appointments and training sessions. Overlapping events will be flagged with a warning
              so you can reschedule before the day-of.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <Badge
                color={gcalConnected ? T.success : T.textMuted}
                bg={gcalConnected ? T.successBg : T.charcoalMuted}
              >
                {gcalConnected ? "Active" : "Requires Calendar Connection"}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Portal Info */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid " + T.lightLine }}>
          <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>Portal Information</h4>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {portalInfo.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "16px 20px",
                borderBottom: i < portalInfo.length - 3 ? "1px solid " + T.lightLine : "none",
                borderRight: (i + 1) % 3 !== 0 ? "1px solid " + T.lightLine : "none",
              }}
            >
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
                {item.label}
              </p>
              <p style={{ fontSize: "14px", fontWeight: 500, color: T.charcoal }}>{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
