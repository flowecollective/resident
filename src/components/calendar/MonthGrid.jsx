import { useState, useEffect } from "react";
import { T, TC } from "../../theme";
import { DAY_HEADERS } from "./useCalendar";

export const MonthGrid = ({ cal, schedule, onDayClick, gcalEvents = [] }) => {
  const { cells, selectedDate } = cal;
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 2 }}>
        {DAY_HEADERS.map((d) => (
          <div key={d} style={{ textAlign: "center", padding: isMobile ? "4px 0" : "8px 0", fontSize: isMobile ? "9px" : "11px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {isMobile ? d[0] : d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 1 : 2 }}>
        {cells.map((cell, i) => {
          const eventsOnDay = cell.date ? schedule.filter((e) => e.date === cell.date) : [];
          const gcalOnDay = cell.date ? gcalEvents.filter((e) => e.date === cell.date) : [];
          const hasConflict = eventsOnDay.length > 0 && gcalOnDay.length > 0;
          const isSelected = cell.date && cell.date === selectedDate;
          const isToday = cell.date === "2026-03-05";
          const hasEvents = eventsOnDay.length > 0;
          const hasGcal = gcalOnDay.length > 0;

          return (
            <button
              key={i}
              onClick={() => cell.current && cell.date && onDayClick(cell.date)}
              style={{
                padding: isMobile ? "4px 2px" : "6px 4px",
                minHeight: isMobile ? 40 : 72,
                borderRadius: T.radiusSm,
                border: isSelected ? "2px solid " + T.gold : hasConflict ? "2px solid " + T.warn : "1px solid " + (cell.current ? (T.lightLine) : "transparent"),
                background: isSelected ? T.goldMuted : hasConflict ? T.warnBg : cell.current ? T.white : "transparent",
                cursor: cell.current ? "pointer" : "default",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: isMobile ? "center" : "flex-start",
                transition: "all .15s",
                position: "relative",
              }}
            >
              {hasConflict && !isMobile && (
                <div style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, borderRadius: "50%", background: T.warn, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: T.white, fontSize: "9px", fontWeight: 800 }}>!</span>
                </div>
              )}
              <span style={{
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: isToday ? 700 : 500,
                color: cell.current ? (isToday ? T.gold : T.charcoal) : T.creamDark,
                marginBottom: isMobile ? 2 : 4,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: isToday ? (isMobile ? 20 : 22) : "auto",
                height: isToday ? (isMobile ? 20 : 22) : "auto",
                borderRadius: "50%",
                background: isToday ? T.goldMuted : "transparent",
              }}>
                {cell.day}
              </span>

              {isMobile && (hasEvents || hasGcal) && (
                <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                  {hasEvents && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.gold }} />}
                  {hasGcal && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4285f4" }} />}
                  {hasConflict && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.warn }} />}
                </div>
              )}

              {!isMobile && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                  {eventsOnDay.slice(0, 2).map((ev) => (
                    <div key={ev.id} style={{
                      fontSize: "9px", fontWeight: 500, padding: "2px 4px", borderRadius: 3,
                      background: (TC[ev.type] || T.gold) + "20", color: TC[ev.type] || T.gold,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {ev.title}
                    </div>
                  ))}
                  {gcalOnDay.length > 0 && (
                    <div style={{
                      fontSize: "9px", fontWeight: 500, padding: "2px 4px", borderRadius: 3,
                      background: "#4285f420", color: "#4285f4",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {gcalOnDay.length} salon
                    </div>
                  )}
                  {eventsOnDay.length > 2 && (
                    <span style={{ fontSize: "9px", color: T.textMuted }}>+{eventsOnDay.length - 2} more</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
