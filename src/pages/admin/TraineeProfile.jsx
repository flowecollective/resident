import { useState } from "react";
import { T, TC, TECHNIQUE_STAGES, TIMING_STAGES, TECHNIQUE_COLORS, TIMING_COLORS, iSt, selSt } from "../../theme";
import { useData } from "../../context";
import { getProgress, getSkillProgress, getSkillPct, isSkillComplete, getTraineeCats } from "../../utils";
import { Card, Badge, Avatar, ProgressBar, Btn, Modal, FormField, Icon } from "../../components/ui";
import { TrackBuilder } from "./TrackBuilder";

export const TraineeProfile = ({ traineeId, onNav }) => {
  const { residents, setResidents, masterProgram, schedule, setSchedule, showToast } = useData();
  const trainee = residents.find((r) => r.id === traineeId);

  const [tab, setTab] = useState("overview");

  // Schedule modal
  const [schedModal, setSchedModal] = useState(false);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedType, setSchedType] = useState("skill");

  // Edit log modal
  const [editLogModal, setEditLogModal] = useState(false);
  const [editLogSkillId, setEditLogSkillId] = useState(null);
  const [editLogIdx, setEditLogIdx] = useState(null);
  const [editLogMinutes, setEditLogMinutes] = useState("");
  const [editLogNote, setEditLogNote] = useState("");
  const [editLogCritique, setEditLogCritique] = useState("");

  if (!trainee) {
    return (
      <Card style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: T.textMuted, fontSize: "14px" }}>Trainee not found.</p>
        <Btn variant="outline" onClick={() => onNav("trainees")} style={{ marginTop: 12 }}>
          <Icon name="back" size={14} /> Back to Trainees
        </Btn>
      </Card>
    );
  }

  const progress = getProgress(trainee, masterProgram);
  const categories = getTraineeCats(trainee, masterProgram);
  const tuition = trainee.tuition || { plan: "monthly", total: 4950, payments: [] };
  const paid = tuition.payments.reduce((a, p) => a + p.amount, 0);
  const remaining = Math.max(0, tuition.total - paid);
  const paidPct = tuition.total ? Math.round((paid / tuition.total) * 100) : 0;

  const today = "2026-03-05";
  const myEvents = schedule
    .filter((e) => e.assignTo === "all" || e.assignTo === trainee.id)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const upcomingEvents = myEvents.filter((e) => e.date >= today).slice(0, 8);

  const updateTrainee = (updater) => {
    setResidents(residents.map((r) => (r.id === traineeId ? updater(r) : r)));
  };

  const setTechniqueStage = (skillId, stage) => {
    updateTrainee((r) => ({
      ...r,
      progress: {
        ...r.progress,
        [skillId]: {
          ...getSkillProgress(r, skillId),
          technique: stage,
        },
      },
    }));
    showToast("Technique stage updated");
  };

  const setTimingStage = (skillId, stage) => {
    updateTrainee((r) => ({
      ...r,
      progress: {
        ...r.progress,
        [skillId]: {
          ...getSkillProgress(r, skillId),
          timing: stage,
        },
      },
    }));
    showToast("Timing stage updated");
  };

  const toggleKnowledgeDone = (skillId) => {
    const p = getSkillProgress(trainee, skillId);
    updateTrainee((r) => ({
      ...r,
      progress: {
        ...r.progress,
        [skillId]: { done: !p.done },
      },
    }));
    showToast(p.done ? "Marked incomplete" : "Marked complete");
  };

  const openQuickSchedule = () => {
    setSchedTitle("");
    setSchedDate("");
    setSchedTime("");
    setSchedType("skill");
    setSchedModal(true);
  };

  const saveSchedule = () => {
    if (!schedTitle.trim() || !schedDate || !schedTime) return;
    const ev = {
      id: Date.now(),
      title: schedTitle.trim(),
      time: schedTime,
      date: schedDate,
      type: schedType,
      assignTo: trainee.id,
      skillId: null,
    };
    setSchedule([...schedule, ev]);
    setSchedModal(false);
    showToast("Event scheduled for " + trainee.name.split(" ")[0]);
  };

  const openEditLog = (skillId, idx) => {
    const logs = trainee.timingLogs?.[skillId] || [];
    const log = logs[idx];
    if (!log) return;
    setEditLogSkillId(skillId);
    setEditLogIdx(idx);
    setEditLogMinutes(log.minutes?.toString() || "");
    setEditLogNote(log.note || "");
    setEditLogCritique("");
    setEditLogModal(true);
  };

  const saveEditLog = () => {
    if (editLogSkillId == null || editLogIdx == null) return;
    updateTrainee((r) => {
      const logs = [...(r.timingLogs?.[editLogSkillId] || [])];
      const existing = logs[editLogIdx];
      const newComments = [...(existing.comments || [])];
      if (editLogCritique.trim()) {
        newComments.push({
          from: "educator",
          text: editLogCritique.trim(),
          ts: new Date().toISOString(),
          name: "Admin",
        });
      }
      logs[editLogIdx] = {
        ...existing,
        minutes: parseInt(editLogMinutes) || existing.minutes,
        note: editLogNote,
        comments: newComments,
      };
      return {
        ...r,
        timingLogs: { ...r.timingLogs, [editLogSkillId]: logs },
      };
    });
    setEditLogModal(false);
    showToast(editLogCritique.trim() ? "Feedback added" : "Log entry updated");
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "builder", label: "Track Builder" },
  ];

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => onNav("trainees")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <Icon name="back" size={20} color={T.textMuted} />
        </button>
        <Avatar name={trainee.name} size={48} />
        <div>
          <h2 style={{ fontFamily: T.fontD, fontSize: "24px", fontWeight: 600, color: T.charcoal }}>
            {trainee.name}
          </h2>
          <p style={{ fontSize: "13px", color: T.textMuted }}>
            {trainee.cohort} &middot; {trainee.email}
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Badge color={T.gold}>{progress.pct}% complete</Badge>
          <Badge color={progress.done === progress.total && progress.total > 0 ? T.success : T.textMuted}>
            {progress.done}/{progress.total} skills
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid " + T.lightLine }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid " + T.charcoal : "2px solid transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? T.charcoal : T.textMuted,
              transition: "all .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {tab === "overview" && (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
                Progress
              </p>
              <p style={{ fontSize: "28px", fontWeight: 700, fontFamily: T.fontD, color: T.gold }}>{progress.pct}%</p>
            </Card>
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
                Skills Done
              </p>
              <p style={{ fontSize: "28px", fontWeight: 700, fontFamily: T.fontD, color: T.charcoal }}>{progress.done}</p>
            </Card>
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
                Assigned
              </p>
              <p style={{ fontSize: "28px", fontWeight: 700, fontFamily: T.fontD, color: T.charcoal }}>{progress.total}</p>
            </Card>
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
                Tuition
              </p>
              <p style={{ fontSize: "28px", fontWeight: 700, fontFamily: T.fontD, color: remaining <= 0 ? T.success : T.warn }}>
                {paidPct}%
              </p>
            </Card>
          </div>

          {/* Tuition Summary */}
          <Card style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>Tuition Summary</h4>
              <Badge color={remaining <= 0 ? T.success : T.warn}>
                {remaining <= 0 ? "Paid in Full" : `$${remaining.toLocaleString()} remaining`}
              </Badge>
            </div>
            <ProgressBar value={paidPct} color={remaining <= 0 ? T.success : T.gold} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: "12px", color: T.textMuted }}>${paid.toLocaleString()} paid</span>
              <span style={{ fontSize: "12px", color: T.textMuted }}>${tuition.total.toLocaleString()} total ({tuition.plan})</span>
            </div>
          </Card>

          {/* Quick Schedule */}
          <Card style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>Upcoming Sessions</h4>
              <Btn variant="outline" onClick={openQuickSchedule} style={{ fontSize: "12px", padding: "6px 14px" }}>
                <Icon name="plus" size={13} color={T.textMuted} /> Schedule
              </Btn>
            </div>
            {upcomingEvents.length === 0 ? (
              <p style={{ color: T.textMuted, fontSize: "13px" }}>No upcoming sessions.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcomingEvents.map((ev) => (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: T.radiusSm, background: T.cream }}>
                    <div style={{ width: 4, height: 28, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                      <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.date} &middot; {ev.time}</p>
                    </div>
                    <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Full Skill Progress */}
          <Card style={{ padding: 20 }}>
            <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600, marginBottom: 16 }}>
              Skill Progress
            </h4>
            {categories.length === 0 ? (
              <p style={{ color: T.textMuted, fontSize: "13px" }}>No skills assigned yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color }} />
                      <h5 style={{ fontFamily: T.fontD, fontSize: "15px", fontWeight: 600, color: cat.color }}>
                        {cat.name}
                      </h5>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {cat.skills.map((sk) => {
                        const sp = getSkillProgress(trainee, sk.id);
                        const pct = getSkillPct(trainee, sk.id, masterProgram);
                        const complete = isSkillComplete(trainee, sk.id, masterProgram);
                        const isService = sk.type === "service";
                        const logs = trainee.timingLogs?.[sk.id] || [];

                        return (
                          <div
                            key={sk.id}
                            style={{
                              padding: "14px 16px",
                              background: complete ? T.successBg : T.cream,
                              borderRadius: T.radiusSm,
                              border: "1px solid " + (complete ? T.success + "30" : T.lightLine),
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: "13px", fontWeight: 600 }}>{sk.name}</span>
                                <Badge color={sk.type === "service" ? T.gold : T.textMuted}>
                                  {sk.type}
                                </Badge>
                                {complete && <Badge color={T.success}>Complete</Badge>}
                              </div>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: T.gold }}>{pct}%</span>
                            </div>

                            {isService ? (
                              <>
                                {/* Technique stages */}
                                <div style={{ marginBottom: 8 }}>
                                  <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
                                    Technique
                                  </p>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    {TECHNIQUE_STAGES.map((stage, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setTechniqueStage(sk.id, i)}
                                        style={{
                                          flex: 1,
                                          padding: "6px 4px",
                                          fontSize: "10px",
                                          fontWeight: sp.technique >= i ? 600 : 400,
                                          background: sp.technique >= i ? TECHNIQUE_COLORS[i] : T.white,
                                          color: sp.technique >= i ? T.white : T.textMuted,
                                          border: "1px solid " + (sp.technique >= i ? TECHNIQUE_COLORS[i] : T.lightLine),
                                          borderRadius: T.radiusSm,
                                          cursor: "pointer",
                                          transition: "all .15s",
                                        }}
                                      >
                                        {stage}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Timing stages */}
                                <div style={{ marginBottom: logs.length > 0 ? 8 : 0 }}>
                                  <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
                                    Timing
                                  </p>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    {TIMING_STAGES.map((stage, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setTimingStage(sk.id, i)}
                                        style={{
                                          flex: 1,
                                          padding: "6px 4px",
                                          fontSize: "10px",
                                          fontWeight: sp.timing >= i ? 600 : 400,
                                          background: sp.timing >= i ? TIMING_COLORS[i] : T.white,
                                          color: sp.timing >= i ? T.white : T.textMuted,
                                          border: "1px solid " + (sp.timing >= i ? TIMING_COLORS[i] : T.lightLine),
                                          borderRadius: T.radiusSm,
                                          cursor: "pointer",
                                          transition: "all .15s",
                                        }}
                                      >
                                        {stage}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Timing logs */}
                                {logs.length > 0 && (
                                  <div style={{ borderTop: "1px solid " + T.lightLine, paddingTop: 8 }}>
                                    <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>
                                      Practice Log ({logs.length} entries)
                                    </p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                      {logs.map((log, idx) => (
                                        <div
                                          key={idx}
                                          style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 10,
                                            padding: "8px 10px",
                                            background: T.white,
                                            borderRadius: T.radiusSm,
                                            border: "1px solid " + T.lightLine,
                                            fontSize: "12px",
                                          }}
                                        >
                                          <div style={{ minWidth: 50, fontWeight: 600, color: T.gold }}>
                                            {log.minutes}m
                                          </div>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                                              <Badge color={TC[log.type] || T.textMuted}>{log.type}</Badge>
                                              <span style={{ color: T.textMuted, fontSize: "11px" }}>{log.date}</span>
                                            </div>
                                            {log.note && (
                                              <p style={{ color: T.charcoal, fontSize: "12px" }}>{log.note}</p>
                                            )}
                                            {(log.comments || []).length > 0 && (
                                              <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                                                {(log.comments || []).slice(-2).map((c, ci) => (
                                                  <p key={ci} style={{ fontSize: "11px", color: c.from === "educator" ? T.educator : T.textMuted, fontStyle: c.from === "educator" ? "italic" : "normal" }}>
                                                    {c.name || (c.from === "educator" ? "Educator" : "Trainee")}: {c.text}
                                                  </p>
                                                ))}
                                                {(log.comments || []).length > 2 && (
                                                  <span style={{ fontSize: "10px", color: T.textMuted }}>+{(log.comments || []).length - 2} more</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => openEditLog(sk.id, idx)}
                                            style={{ background: "none", border: "none", cursor: "pointer", padding: 3 }}
                                          >
                                            <Icon name="edit" size={13} color={T.textMuted} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Timing target */}
                                {sk.targetMin && (
                                  <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 6 }}>
                                    Target: {sk.targetMin}–{sk.maxMin} min
                                  </p>
                                )}
                              </>
                            ) : (
                              /* Knowledge skill: toggle done */
                              <button
                                onClick={() => toggleKnowledgeDone(sk.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 14px",
                                  background: sp.done ? T.successBg : T.white,
                                  border: "1px solid " + (sp.done ? T.success + "40" : T.lightLine),
                                  borderRadius: T.radiusSm,
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: sp.done ? T.success : T.textMuted,
                                  width: "100%",
                                }}
                              >
                                <Icon name="check" size={16} color={sp.done ? T.success : T.lightLine} />
                                {sp.done ? "Completed" : "Mark as Complete"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* ===== SCHEDULE TAB ===== */}
      {tab === "schedule" && (
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>
              {trainee.name.split(" ")[0]}'s Schedule
            </h4>
            <Btn onClick={openQuickSchedule} style={{ fontSize: "12px", padding: "8px 14px" }}>
              <Icon name="plus" size={13} color={T.cream} /> Add Event
            </Btn>
          </div>
          {myEvents.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No events scheduled.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myEvents.map((ev) => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: T.radiusSm, background: ev.date < today ? T.charcoalMuted : T.cream, opacity: ev.date < today ? 0.6 : 1 }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                    <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.date} &middot; {ev.time}</p>
                  </div>
                  <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
                  {ev.date < today && <Badge color={T.textMuted}>Past</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ===== BUILDER TAB ===== */}
      {tab === "builder" && (
        <TrackBuilder traineeId={traineeId} onNav={onNav} embedded />
      )}

      {/* ---- Schedule Modal ---- */}
      <Modal open={schedModal} onClose={() => setSchedModal(false)} title="Quick Schedule">
        <FormField label="Event Title">
          <input
            style={iSt}
            value={schedTitle}
            onChange={(e) => setSchedTitle(e.target.value)}
            placeholder="e.g. 1-on-1 Coaching"
          />
        </FormField>
        <FormField label="Date">
          <input
            style={iSt}
            type="date"
            value={schedDate}
            onChange={(e) => setSchedDate(e.target.value)}
          />
        </FormField>
        <FormField label="Time">
          <input
            style={iSt}
            value={schedTime}
            onChange={(e) => setSchedTime(e.target.value)}
            placeholder="e.g. 10:00 AM"
          />
        </FormField>
        <FormField label="Type">
          <select style={selSt} value={schedType} onChange={(e) => setSchedType(e.target.value)}>
            <option value="skill">Skill</option>
            <option value="general">General</option>
            <option value="mannequin">Mannequin</option>
            <option value="model">Model</option>
            <option value="coaching">Coaching</option>
            <option value="assessment">Assessment</option>
          </select>
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setSchedModal(false)}>Cancel</Btn>
          <Btn onClick={saveSchedule} disabled={!schedTitle.trim() || !schedDate || !schedTime}>Schedule</Btn>
        </div>
      </Modal>

      {/* ---- Edit Log Modal ---- */}
      <Modal open={editLogModal} onClose={() => setEditLogModal(false)} title="Edit Practice Entry">
        <FormField label="Minutes">
          <input
            style={iSt}
            type="number"
            value={editLogMinutes}
            onChange={(e) => setEditLogMinutes(e.target.value)}
          />
        </FormField>
        <FormField label="Trainee Note">
          <input
            style={iSt}
            value={editLogNote}
            onChange={(e) => setEditLogNote(e.target.value)}
            placeholder="Trainee's note"
          />
        </FormField>
        {/* Existing conversation */}
        {editLogSkillId && editLogIdx != null && (() => {
          const log = trainee.timingLogs?.[editLogSkillId]?.[editLogIdx];
          const comments = log?.comments || [];
          if (comments.length === 0) return null;
          return (
            <div style={{ marginBottom: 12, padding: 12, background: T.cream, borderRadius: T.radiusSm, maxHeight: 180, overflowY: "auto" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 8 }}>Conversation</p>
              {comments.map((c, ci) => (
                <div key={ci} style={{ marginBottom: 6, fontSize: "12px" }}>
                  <span style={{ fontWeight: 600, color: c.from === "educator" ? T.educator : T.textMuted }}>{c.name || c.from}: </span>
                  <span style={{ color: T.charcoal }}>{c.text}</span>
                  <span style={{ fontSize: "9px", color: T.textMuted, marginLeft: 6 }}>{new Date(c.ts).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          );
        })()}
        <FormField label="Add Feedback (appends to conversation)">
          <textarea
            style={{ ...iSt, minHeight: 80, resize: "vertical" }}
            value={editLogCritique}
            onChange={(e) => setEditLogCritique(e.target.value)}
            placeholder="Add feedback, corrections, or observations..."
          />
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setEditLogModal(false)}>Cancel</Btn>
          <Btn onClick={saveEditLog}>Save</Btn>
        </div>
      </Modal>
    </div>
  );
};
