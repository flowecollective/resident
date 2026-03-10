import { useState } from "react";
import { T, TECHNIQUE_STAGES, TIMING_STAGES, TECHNIQUE_COLORS, TIMING_COLORS } from "../../theme";
import { Icon } from "../ui";
import { StagePill } from "./StagePill";
import { SOPViewer } from "./SOPViewer";
import { getSkillProgress, getSkillPct } from "../../utils";

export const SkillCard = ({ skill, trainee, masterProgram, onAddLog, onDeleteLog, onEditLog, onPlayVideo, timingLogs, role = "resident" }) => {
  const [expanded, setExpanded] = useState(false);

  const p = getSkillProgress(trainee, skill.id);
  const isService = skill.type === "service";
  const complete = isService ? p.technique >= 3 && p.timing >= 3 : p.done;
  const skPct = getSkillPct(trainee, skill.id, masterProgram);

  const logs = timingLogs || [];
  const mannequinLogs = logs.filter((l) => l.type === "mannequin");
  const modelLogs = logs.filter((l) => l.type === "model");
  const mannequinAvg = mannequinLogs.length > 0 ? Math.round(mannequinLogs.reduce((s, l) => s + l.minutes, 0) / mannequinLogs.length) : null;
  const modelAvg = modelLogs.length > 0 ? Math.round(modelLogs.reduce((s, l) => s + l.minutes, 0) / modelLogs.length) : null;

  const hasStandard = isService && skill.targetMin;
  const hasVideos = skill.videos && skill.videos.length > 0;

  return (
    <div style={{
      padding: "16px 18px",
      background: complete ? "rgba(94,139,106,0.06)" : T.white,
      border: "1px solid " + (complete ? T.success + "30" : T.lightLine),
      borderRadius: T.radius,
      transition: "all .2s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: isService ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: T.charcoal }}>{skill.name}</span>
          <span style={{
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
            padding: "2px 6px",
            background: isService ? T.goldMuted : T.charcoalMuted,
            color: isService ? T.goldDark : T.textMuted,
            borderRadius: T.radiusSm,
          }}>
            {isService ? "SERVICE" : "KNOWLEDGE"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {complete ? (
            <span style={{ fontSize: "10px", fontWeight: 700, color: T.success, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Complete
            </span>
          ) : (
            <span style={{ fontSize: "11px", fontWeight: 600, color: skPct > 0 ? T.gold : T.textMuted }}>
              {skPct}%
            </span>
          )}
        </div>
      </div>

      {/* Service skill details */}
      {isService && (
        <>
          {/* Stage pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            <StagePill label="Technique" stage={p.technique} stages={TECHNIQUE_STAGES} colors={TECHNIQUE_COLORS} />
            <StagePill label="Timing" stage={p.timing} stages={TIMING_STAGES} colors={TIMING_COLORS} />
          </div>

          {/* Goal times */}
          {hasStandard && (
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: "10px", color: T.textMuted }}>
                Goal: <strong>{skill.targetMin} min</strong>
              </span>
              <span style={{ fontSize: "10px", color: T.textMuted }}>
                Max: <strong>{skill.maxMin} min</strong>
              </span>
              {mannequinAvg !== null && (
                <span style={{ fontSize: "10px", color: "#8B6AAE" }}>
                  Mannequin avg: <strong>{mannequinAvg} min</strong>
                </span>
              )}
              {modelAvg !== null && (
                <span style={{ fontSize: "10px", color: T.success }}>
                  Model avg: <strong>{modelAvg} min</strong>
                </span>
              )}
            </div>
          )}

          {/* Video buttons */}
          {hasVideos && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
              {skill.videos.map((v) => (
                <button key={v.id} onClick={() => onPlayVideo && onPlayVideo(v)} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", fontSize: "10px", fontWeight: 600,
                  background: T.cream, border: "1px solid " + T.lightLine,
                  cursor: "pointer", color: T.textMuted, borderRadius: T.radiusSm,
                  transition: "all .15s",
                }}>
                  <Icon name="play" size={10} color={T.textMuted} />
                  {v.title}
                  {v.duration && <span style={{ color: T.goldDark, marginLeft: 2 }}>{v.duration}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Practice log section */}
          <div style={{ borderTop: "1px solid " + T.lightLine, paddingTop: 8, marginTop: 2 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: expanded && logs.length > 0 ? 8 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  Practice Log
                </span>
                {logs.length > 0 && (
                  <span style={{ fontSize: "10px", color: T.textMuted }}>({logs.length})</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {onAddLog && (
                  <button onClick={() => onAddLog(skill.id)} style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "3px 8px", fontSize: "10px", fontWeight: 600,
                    background: T.goldMuted, border: "1px solid " + T.goldLight,
                    cursor: "pointer", color: T.goldDark, borderRadius: T.radiusSm,
                  }}>
                    <Icon name="plus" size={10} color={T.goldDark} />
                    Add
                  </button>
                )}
                {logs.length > 0 && (
                  <button onClick={() => setExpanded(!expanded)} style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "3px 8px", fontSize: "10px", fontWeight: 600,
                    background: "transparent", border: "1px solid " + T.lightLine,
                    cursor: "pointer", color: T.textMuted, borderRadius: T.radiusSm,
                  }}>
                    {expanded ? "Hide" : "Show"}
                  </button>
                )}
              </div>
            </div>

            {/* Expanded log entries */}
            {expanded && logs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...logs].reverse().map((log, i) => {
                  const idx = logs.length - 1 - i;
                  const isMannequin = log.type === "mannequin";
                  return (
                    <div key={idx} style={{
                      padding: "10px 12px",
                      background: T.cream,
                      border: "1px solid " + T.creamDark,
                      borderRadius: T.radiusSm,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: log.note || (log.comments || []).length > 0 ? 6 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                            padding: "2px 6px",
                            background: isMannequin ? "#8B6AAE18" : T.successBg,
                            color: isMannequin ? "#8B6AAE" : T.success,
                            borderRadius: T.radiusSm,
                          }}>
                            {log.type}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: T.charcoal }}>{log.minutes} min</span>
                          <span style={{ fontSize: "10px", color: T.textMuted }}>{log.date}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {onEditLog && (role === "educator" || role === "admin") && (
                            <button onClick={() => onEditLog(skill.id, idx)} style={{
                              padding: 4, background: "transparent", border: "none",
                              cursor: "pointer", opacity: 0.5,
                            }}>
                              <Icon name="edit" size={12} color={T.textMuted} />
                            </button>
                          )}
                          {onDeleteLog && (role === "educator" || role === "admin") && (
                            <button onClick={() => onDeleteLog(skill.id, idx)} style={{
                              padding: 4, background: "transparent", border: "none",
                              cursor: "pointer", opacity: 0.5,
                            }}>
                              <Icon name="trash" size={12} color={T.danger} />
                            </button>
                          )}
                        </div>
                      </div>
                      {log.note && (
                        <p style={{ fontSize: "11px", color: T.textMuted, marginBottom: (log.comments || []).length > 0 ? 4 : 0 }}>{log.note}</p>
                      )}
                      {(log.comments || []).length > 0 && (
                        <div style={{
                          marginTop: 4, padding: "6px 10px",
                          background: T.white, border: "1px solid " + T.lightLine,
                          borderRadius: T.radiusSm,
                          display: "flex", flexDirection: "column", gap: 4,
                        }}>
                          {(log.comments || []).slice(-2).map((c, ci) => (
                            <div key={ci} style={{ fontSize: "11px" }}>
                              <span style={{ fontWeight: 600, color: c.from === "educator" ? T.educator : T.textMuted }}>{c.name || c.from}: </span>
                              <span style={{ color: T.charcoal }}>{c.text}</span>
                            </div>
                          ))}
                          {(log.comments || []).length > 2 && (
                            <span style={{ fontSize: "9px", color: T.textMuted }}>+{(log.comments || []).length - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SOP Viewer */}
          <SOPViewer sop={skill.sop} />
        </>
      )}
    </div>
  );
};
