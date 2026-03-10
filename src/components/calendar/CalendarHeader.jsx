import { T } from "../../theme";
import { MONTH_NAMES } from "./useCalendar";

export const CalendarHeader = ({ cal }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <button onClick={cal.prev} style={{ background: T.cream, border: "none", borderRadius: T.radiusSm, padding: "8px 12px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: T.charcoal }}>
      ←
    </button>
    <h3 style={{ fontFamily: T.fontD, fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 600 }}>
      {MONTH_NAMES[cal.month]} {cal.year}
    </h3>
    <button onClick={cal.next} style={{ background: T.cream, border: "none", borderRadius: T.radiusSm, padding: "8px 12px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: T.charcoal }}>
      →
    </button>
  </div>
);
