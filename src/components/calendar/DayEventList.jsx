import { T, TC } from "../../theme";
import { Badge } from "../ui";
import { MONTH_NAMES } from "./useCalendar";

export const DayEventList = ({ date, schedule, gcalEvents = [] }) => {
  const events = schedule.filter((e) => e.date === date);
  const gcal = gcalEvents.filter((e) => e.date === date);
  if (!date) return null;
  const parts = date.split("-");
  const label = MONTH_NAMES[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10);
  return (
    <div style={{ marginTop: 20 }}>
      <h4 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 12 }}>{label}</h4>

      {gcal.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4285f4" }} />
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#4285f4" }}>Salon Calendar</p>
            {events.length > 0 && <Badge color={T.warn}>Potential Conflicts</Badge>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {gcal.map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: T.radiusSm, background: "#4285f408", border: "1px solid #4285f418" }}>
                <div style={{ width: 4, height: 30, borderRadius: 2, background: "#4285f4" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#4285f4" }}>{ev.title}</p>
                  <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.time}</p>
                </div>
                <Badge color="#4285f4">Salon</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold }} />
            <p style={{ fontSize: "12px", fontWeight: 600, color: T.gold }}>Training Events</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map((ev) => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: T.radiusSm, background: T.cream }}>
                <div style={{ width: 4, height: 36, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>{ev.title}</p>
                  <p style={{ fontSize: "12px", color: T.textMuted }}>{ev.time}</p>
                </div>
                <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && gcal.length === 0 && (
        <p style={{ color: T.textMuted, fontSize: "13px" }}>No sessions on this day.</p>
      )}
    </div>
  );
};
