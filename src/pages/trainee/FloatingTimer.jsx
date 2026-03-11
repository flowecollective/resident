import { useState, useEffect, useRef } from "react";
import { T } from "../../theme";
import { useData } from "../../context";
import { Card, FormField, Icon } from "../../components/ui";
import { localDate } from "../../utils";
import { iSt, selSt } from "../../theme";

export const FloatingTimer = ({ user, onNav }) => {
  const { residents, setResidents, masterProgram, showToast } = useData();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [linkedSkill, setLinkedSkill] = useState("");
  const [logType, setLogType] = useState("mannequin");
  const [logNote, setLogNote] = useState("");
  const [showSave, setShowSave] = useState(false);
  const intervalRef = useRef(null);

  if (user.role === "admin") return null;

  const me = residents.find((r) => r.id === user.id) || residents[0];

  const serviceSkills = masterProgram
    .flatMap((c) => c.skills)
    .filter((sk) => sk.type === "service" && me.skillIds.includes(sk.id));

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleStart = () => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStop = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setShowSave(true);
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(0);
    setShowSave(false);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setLinkedSkill("");
    setLogType("mannequin");
    setLogNote("");
  };

  const handleSaveLog = () => {
    if (!linkedSkill) {
      showToast("Please link a skill to save the log.");
      return;
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) {
      showToast("Timer must be at least 1 minute.");
      return;
    }
    const today = localDate();
    setResidents((prev) =>
      prev.map((r) => {
        if (r.id !== me.id) return r;
        const logs = r.timingLogs || {};
        const skillLogs = logs[linkedSkill] || [];
        return {
          ...r,
          timingLogs: {
            ...logs,
            [linkedSkill]: [
              ...skillLogs,
              {
                minutes,
                type: logType,
                date: today,
                note: logNote,
                comments: [],
              },
            ],
          },
        };
      })
    );
    showToast(`Saved ${minutes} min to ${serviceSkills.find((s) => s.id === linkedSkill)?.name || "skill"}`);
    handleReset();
    setExpanded(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: running ? "auto" : 56,
          height: 56,
          minWidth: 56,
          borderRadius: 28,
          background: T.charcoal,
          color: T.cream,
          border: "none",
          cursor: "pointer",
          boxShadow: T.shadowLg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: running ? "0 18px" : 0,
          zIndex: 500,
          transition: "all .3s ease",
        }}
      >
        {running ? (
          <>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: T.gold,
                animation: "fadeIn 1s ease infinite alternate",
              }}
            />
            <span style={{ fontSize: "14px", fontWeight: 600, fontFamily: T.font, letterSpacing: "0.5px" }}>
              {formatTime(seconds)}
            </span>
          </>
        ) : (
          <Icon name="zap" size={22} color={T.gold} />
        )}
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: 320,
            zIndex: 500,
          }}
        >
          <Card style={{ padding: 20, boxShadow: T.shadowLg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>Practice Timer</h4>
              <button
                onClick={() => setExpanded(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
              >
                <Icon name="x" size={16} color={T.textMuted} />
              </button>
            </div>

            {/* Timer Display */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <p
                style={{
                  fontSize: "48px",
                  fontWeight: 700,
                  fontFamily: T.fontD,
                  color: running ? T.gold : T.charcoal,
                  letterSpacing: "2px",
                  lineHeight: 1,
                }}
              >
                {formatTime(seconds)}
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
              {!running && seconds === 0 && (
                <button
                  onClick={handleStart}
                  style={{
                    padding: "8px 20px",
                    borderRadius: T.radiusSm,
                    background: T.educator,
                    color: T.white,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Start
                </button>
              )}
              {running && (
                <button
                  onClick={handleStop}
                  style={{
                    padding: "8px 20px",
                    borderRadius: T.radiusSm,
                    background: T.danger,
                    color: T.white,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  Stop
                </button>
              )}
              {!running && seconds > 0 && (
                <>
                  <button
                    onClick={handleStart}
                    style={{
                      padding: "8px 20px",
                      borderRadius: T.radiusSm,
                      background: T.educator,
                      color: T.white,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Resume
                  </button>
                  <button
                    onClick={handleReset}
                    style={{
                      padding: "8px 20px",
                      borderRadius: T.radiusSm,
                      background: T.charcoalMuted,
                      color: T.charcoal,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* Skill Linker */}
            <FormField label="Link to Skill">
              <select
                value={linkedSkill}
                onChange={(e) => setLinkedSkill(e.target.value)}
                style={selSt}
              >
                <option value="">Select a skill...</option>
                {serviceSkills.map((sk) => (
                  <option key={sk.id} value={sk.id}>
                    {sk.name}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Practice Type */}
            <FormField label="Practice Type">
              <div style={{ display: "flex", gap: 8 }}>
                {["mannequin", "model"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setLogType(type)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: T.radiusSm,
                      border: `1.5px solid ${logType === type ? T.gold : T.creamDark}`,
                      background: logType === type ? T.goldMuted : T.cream,
                      color: logType === type ? T.charcoal : T.textMuted,
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: logType === type ? 600 : 400,
                      textTransform: "capitalize",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Save Section */}
            {showSave && (
              <>
                <FormField label="Note (optional)">
                  <input
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="How did it go?"
                    style={iSt}
                  />
                </FormField>
                <button
                  onClick={handleSaveLog}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: T.radiusSm,
                    background: T.gold,
                    color: T.white,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  Save Practice Log
                </button>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
};
