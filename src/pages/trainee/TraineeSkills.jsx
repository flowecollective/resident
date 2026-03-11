import { useState } from "react";
import { T } from "../../theme";
import { useData } from "../../context";
import { getProgress, getSkillPct, isSkillComplete, getSkillProgress, getTraineeCats, getEmbedUrl, localDate } from "../../utils";
import { Card, Badge, ProgressBar, SectionTitle, Btn, Modal, FormField, Icon, Avatar } from "../../components/ui";
import { iSt } from "../../theme";
import { SkillCard } from "../../components/skills/SkillCard";

export const TraineeSkills = ({ user }) => {
  const { residents, setResidents, masterProgram, showToast } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const categories = getTraineeCats(me, masterProgram);
  const progress = getProgress(me, masterProgram);

  // Log modal state
  const [logModal, setLogModal] = useState(false);
  const [logSkill, setLogSkill] = useState(null);
  const [logMinutes, setLogMinutes] = useState("");
  const [logType, setLogType] = useState("mannequin");
  const [logNote, setLogNote] = useState("");

  // Reply state
  const [replyTarget, setReplyTarget] = useState(null); // { skillId, logIdx }
  const [replyText, setReplyText] = useState("");

  // Video player state
  const [playingVideo, setPlayingVideo] = useState(null);

  const openAddLog = (skill) => {
    setLogSkill(skill);
    setLogMinutes("");
    setLogType("mannequin");
    setLogNote("");
    setLogModal(true);
  };

  const saveLog = () => {
    if (!logSkill || !logMinutes) return;
    const entry = {
      minutes: parseInt(logMinutes, 10),
      type: logType,
      date: localDate(),
      note: logNote,
      comments: [],
    };
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id !== me.id) return r;
        const logs = { ...(r.timingLogs || {}) };
        logs[logSkill.id] = [...(logs[logSkill.id] || []), entry];
        return { ...r, timingLogs: logs };
      })
    );
    setLogModal(false);
    if (showToast) showToast("Time logged for " + logSkill.name);
  };

  const sendReply = () => {
    if (!replyTarget || !replyText.trim()) return;
    const { skillId, logIdx } = replyTarget;
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id !== me.id) return r;
        const logs = { ...(r.timingLogs || {}) };
        const arr = [...(logs[skillId] || [])];
        arr[logIdx] = {
          ...arr[logIdx],
          comments: [...(arr[logIdx].comments || []), {
            from: "trainee",
            text: replyText.trim(),
            ts: new Date().toISOString(),
            name: me.name.split(" ")[0],
          }],
        };
        logs[skillId] = arr;
        return { ...r, timingLogs: logs };
      })
    );
    setReplyTarget(null);
    setReplyText("");
    if (showToast) showToast("Reply sent");
  };

  const deleteLog = (skillId, idx) => {
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id !== me.id) return r;
        const logs = { ...(r.timingLogs || {}) };
        logs[skillId] = (logs[skillId] || []).filter((_, i) => i !== idx);
        return { ...r, timingLogs: logs };
      })
    );
    if (showToast) showToast("Log entry deleted");
  };

  // Find top 2 in-progress skills
  const allSkills = categories.flatMap((c) => c.skills);
  const inProgress = allSkills
    .filter((sk) => {
      const pct = getSkillPct(me, sk.id, masterProgram);
      return pct > 0 && pct < 100;
    })
    .sort((a, b) => getSkillPct(me, b.id, masterProgram) - getSkillPct(me, a.id, masterProgram))
    .slice(0, 2);

  const ringPct = progress.pct;
  const ringBg = `conic-gradient(${T.gold} ${ringPct * 3.6}deg, ${T.creamDark} ${ringPct * 3.6}deg)`;

  return (
    <div className="fade-up">
      <SectionTitle sub="Track your technique and timing progression">
        My Skills
      </SectionTitle>

      {/* Overall Progress Ring */}
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: ringBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  background: T.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <span style={{ fontSize: "22px", fontWeight: 700, fontFamily: T.fontD, color: T.gold }}>
                  {ringPct}%
                </span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: T.fontD, fontSize: "20px", fontWeight: 600, marginBottom: 6 }}>
              Overall Progress
            </h3>
            <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 8 }}>
              {progress.done} of {progress.total} skills complete
            </p>
            <ProgressBar value={progress.pct} height={8} />
          </div>
        </div>
      </Card>

      {/* Currently Working On */}
      {inProgress.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 14, color: T.charcoal }}>
            Currently Working On
          </h3>
          <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {inProgress.map((sk) => {
              const pct = getSkillPct(me, sk.id, masterProgram);
              const p = getSkillProgress(me, sk.id);
              const cat = categories.find((c) => c.skills.some((s) => s.id === sk.id));
              return (
                <Card key={sk.id} style={{ padding: 18, border: `2px solid ${T.goldMuted}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600 }}>{sk.name}</p>
                      {cat && <p style={{ fontSize: "11px", color: cat.color }}>{cat.name}</p>}
                    </div>
                    <Badge color={T.gold}>{pct}%</Badge>
                  </div>
                  <ProgressBar value={pct} height={6} color={cat?.color || T.gold} />
                  {sk.type === "service" && (
                    <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: "11px", color: T.textMuted }}>
                      <span>Technique: Stage {p.technique}/3</span>
                      <span>Timing: Stage {p.timing}/3</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Categories Accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {categories.map((cat) => (
          <details key={cat.id} style={{ background: T.white, border: `1px solid ${T.lightLine}`, borderRadius: T.radius, boxShadow: T.shadow }}>
            <summary
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                listStyle: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: cat.color }} />
                <span style={{ fontSize: "15px", fontWeight: 600 }}>{cat.name}</span>
                <Badge color={cat.color}>
                  {cat.skills.filter((sk) => isSkillComplete(me, sk.id, masterProgram)).length}/{cat.skills.length}
                </Badge>
              </div>
              <span className="arrow-down" style={{ transition: "transform .2s", fontSize: "14px", color: T.textMuted }}>
                ▼
              </span>
            </summary>
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {cat.skills.map((sk) => {
                const pct = getSkillPct(me, sk.id, masterProgram);
                const complete = isSkillComplete(me, sk.id, masterProgram);
                const p = getSkillProgress(me, sk.id);
                const logs = me.timingLogs?.[sk.id] || [];

                return (
                  <Card key={sk.id} style={{ padding: 16, border: complete ? `1.5px solid ${T.success}30` : undefined, background: complete ? T.successBg : undefined }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {complete && <Icon name="check" size={16} color={T.success} />}
                          <p style={{ fontSize: "14px", fontWeight: 500 }}>{sk.name}</p>
                        </div>
                        <Badge color={sk.type === "service" ? T.gold : T.charcoal}>
                          {sk.type}
                        </Badge>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: complete ? T.success : T.gold }}>
                        {pct}%
                      </span>
                    </div>

                    {sk.type === "service" && (
                      <>
                        <ProgressBar value={pct} height={5} color={cat.color} />
                        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "11px", color: T.textMuted }}>
                          <span>Technique: Stage {p.technique}/3</span>
                          <span>Timing: Stage {p.timing}/3</span>
                        </div>

                        {/* Practice Logs with Conversation Threads */}
                        {logs.length > 0 && (
                          <div style={{ marginTop: 12, borderTop: `1px solid ${T.lightLine}`, paddingTop: 10 }}>
                            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>
                              Practice Log
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {logs.map((log, idx) => {
                                const comments = log.comments || [];
                                const needsReply = comments.length > 0 && comments[comments.length - 1]?.from === "educator";
                                const isReplying = replyTarget?.skillId === sk.id && replyTarget?.logIdx === idx;
                                return (
                                  <div key={idx} style={{ borderRadius: T.radiusSm, border: `1px solid ${T.lightLine}`, overflow: "hidden" }}>
                                    {/* Log header */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: T.cream, fontSize: "12px" }}>
                                      <span style={{ fontWeight: 600 }}>{log.minutes} min</span>
                                      <Badge color={log.type === "model" ? T.success : T.gold}>{log.type}</Badge>
                                      <span style={{ color: T.textMuted, flex: 1 }}>{log.date}</span>
                                      {needsReply && <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: `${T.gold}20`, color: T.gold }}>REPLY</span>}
                                      <button
                                        onClick={() => deleteLog(sk.id, idx)}
                                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                                      >
                                        <Icon name="trash" size={14} color={T.danger} />
                                      </button>
                                    </div>
                                    {/* Trainee's note as first message */}
                                    {log.note && (
                                      <div style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                                        <Avatar name={me.name} size={22} />
                                        <div style={{ flex: 1 }}>
                                          <span style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted }}>You</span>
                                          <p style={{ fontSize: "12px", lineHeight: 1.5, marginTop: 2 }}>{log.note}</p>
                                        </div>
                                      </div>
                                    )}
                                    {/* Comment thread */}
                                    {comments.map((c, j) => (
                                      <div key={j} style={{ padding: "8px 12px", background: c.from === "educator" ? `${T.educator}06` : "transparent", display: "flex", gap: 8, alignItems: "flex-start" }}>
                                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: c.from === "educator" ? T.educator : `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                          <span style={{ fontSize: "9px", fontWeight: 700, color: T.white }}>{c.name?.[0] || "?"}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ fontSize: "10px", fontWeight: 600, color: c.from === "educator" ? T.educator : T.textMuted }}>{c.name || (c.from === "educator" ? "Educator" : "You")}</span>
                                            <span style={{ fontSize: "9px", color: T.textMuted }}>{new Date(c.ts).toLocaleDateString()}</span>
                                          </div>
                                          <p style={{ fontSize: "12px", lineHeight: 1.5, marginTop: 2 }}>{c.text}</p>
                                        </div>
                                      </div>
                                    ))}
                                    {/* Reply input */}
                                    {comments.length > 0 && (
                                      isReplying ? (
                                        <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.lightLine}`, display: "flex", gap: 8 }}>
                                          <input
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Write a reply..."
                                            style={{ ...iSt, flex: 1, fontSize: "12px", padding: "6px 10px" }}
                                            onKeyDown={(e) => e.key === "Enter" && sendReply()}
                                            autoFocus
                                          />
                                          <Btn onClick={sendReply} style={{ fontSize: "11px", padding: "6px 12px" }}>Send</Btn>
                                          <Btn variant="outline" onClick={() => { setReplyTarget(null); setReplyText(""); }} style={{ fontSize: "11px", padding: "6px 10px" }}>Cancel</Btn>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => { setReplyTarget({ skillId: sk.id, logIdx: idx }); setReplyText(""); }}
                                          style={{ width: "100%", padding: "6px 12px", background: "none", border: "none", borderTop: `1px solid ${T.lightLine}`, cursor: "pointer", fontSize: "11px", fontWeight: 500, color: T.gold, display: "flex", alignItems: "center", gap: 4 }}
                                        >
                                          <Icon name="message" size={12} color={T.gold} /> Reply
                                        </button>
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Log Time Button */}
                        <div style={{ marginTop: 10 }}>
                          <Btn variant="outline" onClick={() => openAddLog(sk)} style={{ fontSize: "12px", padding: "6px 12px" }}>
                            <Icon name="plus" size={14} /> Log Time
                          </Btn>
                        </div>
                      </>
                    )}

                    {/* Videos */}
                    {sk.videos && sk.videos.length > 0 && (
                      <div style={{ marginTop: 10, borderTop: `1px solid ${T.lightLine}`, paddingTop: 10 }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>
                          Videos
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {sk.videos.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => setPlayingVideo(v)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 10px",
                                borderRadius: T.radiusSm,
                                background: T.cream,
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 500,
                                color: T.charcoal,
                                width: "100%",
                                textAlign: "left",
                              }}
                            >
                              <Icon name="play" size={14} color={T.gold} />
                              <span style={{ flex: 1 }}>{v.title}</span>
                              {v.duration && <span style={{ color: T.textMuted, fontSize: "11px" }}>{v.duration}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </details>
        ))}
      </div>

      {/* Log Time Modal */}
      <Modal open={logModal} onClose={() => setLogModal(false)} title={logSkill ? `Log Time — ${logSkill.name}` : "Log Time"}>
        <FormField label="Minutes">
          <input
            type="number"
            value={logMinutes}
            onChange={(e) => setLogMinutes(e.target.value)}
            placeholder="e.g. 45"
            style={iSt}
          />
        </FormField>
        <FormField label="Type">
          <select value={logType} onChange={(e) => setLogType(e.target.value)} style={{ ...iSt, appearance: "none", cursor: "pointer" }}>
            <option value="mannequin">Mannequin</option>
            <option value="model">Live Model</option>
          </select>
        </FormField>
        <FormField label="Note (optional)">
          <input
            type="text"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            placeholder="Any notes about this session"
            style={iSt}
          />
        </FormField>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setLogModal(false)}>Cancel</Btn>
          <Btn onClick={saveLog} disabled={!logMinutes}>Save Log</Btn>
        </div>
      </Modal>

      {/* Video Player Modal */}
      <Modal open={!!playingVideo} onClose={() => setPlayingVideo(null)} title={playingVideo?.title || "Video"} width={720}>
        {playingVideo && (() => {
          const embedUrl = getEmbedUrl(playingVideo.url);
          if (embedUrl) {
            return (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: T.radiusSm }}>
                <iframe
                  src={embedUrl}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            );
          }
          if (playingVideo.url && playingVideo.url.startsWith("data:")) {
            return (
              <video controls autoPlay style={{ width: "100%", borderRadius: T.radiusSm }}>
                <source src={playingVideo.url} />
              </video>
            );
          }
          return <p style={{ color: T.textMuted, fontSize: "13px" }}>Unable to load video.</p>;
        })()}
      </Modal>
    </div>
  );
};
