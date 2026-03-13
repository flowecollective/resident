import { useState } from "react";
import { T, TC, iSt, selSt } from "../../theme";
import { useData } from "../../context";
import { Card, Badge, Btn, Modal, FormField, Icon, SectionTitle } from "../../components/ui";
import { localDate } from "../../utils";
import { useCalendar } from "../../components/calendar/useCalendar";
import { MonthGrid } from "../../components/calendar/MonthGrid";
import { CalendarHeader } from "../../components/calendar/CalendarHeader";

const EVENT_TYPES = [
  { key: "skill", label: "Skill Session", color: TC.skill },
  { key: "mannequin", label: "Mannequin", color: TC.mannequin },
  { key: "model", label: "Live Model", color: TC.model },
  { key: "general", label: "General", color: TC.general },
  { key: "workshop", label: "Workshop", color: TC.workshop },
  { key: "coaching", label: "Coaching", color: TC.coaching },
  { key: "assessment", label: "Assessment", color: TC.assessment },
];

export const AdminSchedule = () => {
  const { schedule, setSchedule, gcalEvents, masterProgram, residents, showToast } = useData();
  const cal = useCalendar(2026, 2);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("general");
  const [assignTo, setAssignTo] = useState("all");
  const [skillId, setSkillId] = useState("");
  const [repeat, setRepeat] = useState("none");
  const [repeatUntil, setRepeatUntil] = useState("");

  const allSkills = masterProgram.flatMap((c) => c.skills.map((s) => ({ ...s, catName: c.name })));

  const openNew = (date) => {
    setEditId(null);
    setTitle("");
    setTime("");
    setType("general");
    setAssignTo("all");
    setSkillId("");
    setRepeat("none");
    setRepeatUntil("");
    cal.setSelectedDate(date);
    setOpen(true);
  };

  const openEdit = (ev) => {
    setEditId(ev.id);
    setTitle(ev.title);
    setTime(ev.time);
    setType(ev.type);
    setAssignTo(ev.assignTo || "all");
    setSkillId(ev.skillId || "");
    setRepeat("none");
    setRepeatUntil("");
    setOpen(true);
  };

  const handleSkillChange = (sid) => {
    setSkillId(sid);
    if (sid) {
      const sk = allSkills.find((s) => s.id === sid);
      if (sk) setTitle(sk.name);
    }
  };

  const save = () => {
    if (!title.trim()) return;

    if (editId) {
      const ev = { id: editId, title: title.trim(), time, date: cal.selectedDate, type, assignTo, skillId: skillId || null };
      setSchedule(schedule.map((e) => (e.id === editId ? ev : e)));
      showToast("Event updated");
      setOpen(false);
      return;
    }

    // Generate dates for recurring events
    const dates = [cal.selectedDate];
    if (repeat !== "none" && repeatUntil) {
      const intervalDays = repeat === "weekly" ? 7 : 14;
      const start = new Date(cal.selectedDate + "T00:00:00");
      const end = new Date(repeatUntil + "T00:00:00");
      let cursor = new Date(start);
      cursor.setDate(cursor.getDate() + intervalDays);
      while (cursor <= end) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        dates.push(`${y}-${m}-${d}`);
        cursor.setDate(cursor.getDate() + intervalDays);
      }
    }

    const newEvents = dates.map((date) => ({
      id: Date.now() + Math.random(),
      title: title.trim(),
      time,
      date,
      type,
      assignTo,
      skillId: skillId || null,
    }));

    setSchedule([...schedule, ...newEvents]);
    showToast(newEvents.length > 1 ? `${newEvents.length} events added` : "Event added");
    setOpen(false);
  };

  const rem = (id) => {
    setSchedule(schedule.filter((e) => e.id !== id));
    showToast("Event removed");
  };

  const selectedEvents = schedule.filter((e) => e.date === cal.selectedDate);

  return (
    <div>
      <SectionTitle sub="Manage training schedule" action={<Btn onClick={() => openNew(cal.selectedDate || localDate())}><Icon name="plus" size={16} /> Add Event</Btn>} >
        Schedule
      </SectionTitle>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {EVENT_TYPES.map((et) => (
          <div key={et.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", color: T.textMuted }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: et.color }} />
            {et.label}
          </div>
        ))}
      </div>

      <Card style={{ padding: 20, marginBottom: 20 }}>
        <CalendarHeader cal={cal} />
        <MonthGrid cal={cal} schedule={schedule} gcalEvents={gcalEvents || []} onDayClick={(d) => cal.setSelectedDate(d)} />
      </Card>

      {cal.selectedDate && (
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600 }}>
              Events on {cal.selectedDate}
            </h3>
            <Btn variant="outline" onClick={() => openNew(cal.selectedDate)} style={{ padding: "6px 12px", fontSize: "12px" }}>
              <Icon name="plus" size={14} /> Add
            </Btn>
          </div>
          {selectedEvents.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No events scheduled</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedEvents.map((ev) => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: T.radiusSm, border: `1px solid ${T.lightLine}`, background: T.cream }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{ev.title}</div>
                    <div style={{ fontSize: "12px", color: T.textMuted }}>{ev.time} · <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge></div>
                  </div>
                  <button onClick={() => openEdit(ev)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Icon name="edit" size={16} color={T.textMuted} />
                  </button>
                  <button onClick={() => rem(ev.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Icon name="trash" size={16} color={T.danger} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit Event" : "New Event"}>
        <FormField label="Event Type">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EVENT_TYPES.map((et) => (
              <button
                key={et.key}
                onClick={() => setType(et.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: type === et.key ? `2px solid ${et.color}` : `1px solid ${T.lightLine}`,
                  background: type === et.key ? et.color + "18" : T.white,
                  color: type === et.key ? et.color : T.textMuted,
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {et.label}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Link Skill">
          <select value={skillId} onChange={(e) => handleSkillChange(e.target.value)} style={selSt}>
            <option value="">None</option>
            {allSkills.map((s) => (
              <option key={s.id} value={s.id}>{s.catName} → {s.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={iSt} placeholder="Event title" />
        </FormField>

        <FormField label="Time">
          <input value={time} onChange={(e) => setTime(e.target.value)} style={iSt} placeholder="e.g. 10:00 AM" />
        </FormField>

        <FormField label="Assign To">
          <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} style={selSt}>
            <option value="all">All Trainees</option>
            {residents.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </FormField>

        {!editId && (
          <>
            <FormField label="Repeat">
              <select value={repeat} onChange={(e) => setRepeat(e.target.value)} style={selSt}>
                <option value="none">Does not repeat</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
              </select>
            </FormField>

            {repeat !== "none" && (
              <FormField label="Repeat until">
                <input type="date" value={repeatUntil} onChange={(e) => setRepeatUntil(e.target.value)} style={iSt} />
              </FormField>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <Btn onClick={save}>{editId ? "Update" : "Add Event"}</Btn>
          <Btn variant="outline" onClick={() => setOpen(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
};
