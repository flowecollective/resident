import { useState } from "react";
import { T } from "../../theme";
import { useData } from "../../context";
import { getProgress, getTraineeCats } from "../../utils";
import { Card, Badge, Avatar, Btn, Modal, Icon } from "../../components/ui";

export const TrackBuilder = ({ traineeId, onNav, embedded = false }) => {
  const { residents, setResidents, masterProgram, presets, showToast } = useData();
  const trainee = residents.find((r) => r.id === traineeId);

  const [presetModal, setPresetModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [dragSkillId, setDragSkillId] = useState(null);

  if (!trainee) {
    return (
      <Card style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: T.textMuted, fontSize: "14px" }}>Trainee not found.</p>
      </Card>
    );
  }

  const assigned = new Set(trainee.skillIds || []);
  const progress = getProgress(trainee, masterProgram);
  const traineeCats = getTraineeCats(trainee, masterProgram);

  const toggleSkill = (skillId) => {
    const newIds = assigned.has(skillId)
      ? [...assigned].filter((id) => id !== skillId)
      : [...assigned, skillId];
    setResidents(residents.map((r) =>
      r.id === traineeId ? { ...r, skillIds: newIds } : r
    ));
    showToast(assigned.has(skillId) ? "Skill removed" : "Skill added");
  };

  const applyPreset = () => {
    if (!selectedPreset) return;
    const preset = presets.find((p) => p.id === selectedPreset);
    if (!preset) return;
    setResidents(residents.map((r) =>
      r.id === traineeId ? { ...r, skillIds: [...preset.skillIds] } : r
    ));
    setPresetModal(false);
    setSelectedPreset(null);
    showToast("Preset applied: " + preset.name);
  };

  const clearAll = () => {
    setResidents(residents.map((r) =>
      r.id === traineeId ? { ...r, skillIds: [] } : r
    ));
    showToast("All skills cleared");
  };

  const handleDragStart = (e, skillId) => {
    setDragSkillId(skillId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setDragSkillId(null);
  };

  const handleDropOnTrack = (e) => {
    e.preventDefault();
    if (dragSkillId && !assigned.has(dragSkillId)) {
      toggleSkill(dragSkillId);
    }
    setDragSkillId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  return (
    <div className={embedded ? "" : "fade-up"}>
      {!embedded && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => onNav("trainees")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <Icon name="back" size={20} color={T.textMuted} />
          </button>
          <Avatar name={trainee.name} size={36} />
          <div>
            <h3 style={{ fontFamily: T.fontD, fontSize: "20px", fontWeight: 600 }}>
              Track Builder — {trainee.name}
            </h3>
            <p style={{ fontSize: "12px", color: T.textMuted }}>
              {progress.done}/{progress.total} skills assigned &middot; {progress.pct}% complete
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Btn variant="outline" onClick={() => { setSelectedPreset(null); setPresetModal(true); }} style={{ fontSize: "12px", padding: "8px 14px" }}>
          <Icon name="template" size={14} color={T.textMuted} />
          Apply Preset
        </Btn>
        <Btn variant="outline" onClick={clearAll} style={{ fontSize: "12px", padding: "8px 14px" }}>
          <Icon name="x" size={14} color={T.textMuted} />
          Clear All
        </Btn>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Badge color={T.gold}>{assigned.size} skills assigned</Badge>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: Master Program */}
        <Card style={{ padding: 0, maxHeight: "70vh", overflow: "auto" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid " + T.lightLine, position: "sticky", top: 0, background: T.white, zIndex: 2 }}>
            <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>Master Program</h4>
            <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>Click or drag skills to assign</p>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {masterProgram.map((cat) => (
              <div key={cat.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color }} />
                  <h5 style={{ fontFamily: T.fontD, fontSize: "14px", fontWeight: 600, color: cat.color }}>
                    {cat.name}
                  </h5>
                  <span style={{ fontSize: "11px", color: T.textMuted }}>
                    ({cat.skills.filter((s) => assigned.has(s.id)).length}/{cat.skills.length})
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cat.skills.map((sk) => {
                    const isAssigned = assigned.has(sk.id);
                    return (
                      <div
                        key={sk.id}
                        draggable={!isAssigned}
                        onDragStart={(e) => handleDragStart(e, sk.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => toggleSkill(sk.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          background: isAssigned ? cat.color + "15" : T.cream,
                          border: "1px solid " + (isAssigned ? cat.color + "40" : T.lightLine),
                          borderRadius: T.radiusSm,
                          cursor: isAssigned ? "pointer" : "grab",
                          fontSize: "12px",
                          fontWeight: isAssigned ? 600 : 400,
                          color: isAssigned ? cat.color : T.charcoal,
                          opacity: dragSkillId === sk.id ? 0.4 : 1,
                          transition: "all .15s",
                        }}
                      >
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: T.radiusSm,
                            border: "1.5px solid " + (isAssigned ? cat.color : T.lightLine),
                            background: isAssigned ? cat.color : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isAssigned && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12l5 5L19 7" stroke={T.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        {sk.name}
                        <Badge
                          color={sk.type === "service" ? T.gold : T.textMuted}
                          bg={sk.type === "service" ? T.goldMuted : T.charcoalMuted}
                        >
                          {sk.type === "service" ? "S" : "K"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Trainee Track */}
        <Card
          style={{ padding: 0, maxHeight: "70vh", overflow: "auto", border: dragSkillId ? "2px dashed " + T.gold : undefined }}
          onDrop={handleDropOnTrack}
          onDragOver={handleDragOver}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid " + T.lightLine, position: "sticky", top: 0, background: T.white, zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={trainee.name} size={28} />
              <div>
                <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>
                  {trainee.name.split(" ")[0]}'s Track
                </h4>
                <p style={{ fontSize: "11px", color: T.textMuted }}>
                  {assigned.size} skills &middot; {progress.pct}% complete
                </p>
              </div>
            </div>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {traineeCats.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Icon name="template" size={32} color={T.lightLine} />
                <p style={{ color: T.textMuted, fontSize: "13px", marginTop: 10 }}>
                  {dragSkillId ? "Drop here to add" : "No skills assigned. Select from the master program or apply a preset."}
                </p>
              </div>
            ) : (
              traineeCats.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: cat.color }}>{cat.name}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cat.skills.map((sk) => (
                      <div
                        key={sk.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 10px",
                          background: T.cream,
                          border: "1px solid " + T.lightLine,
                          borderRadius: T.radiusSm,
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{sk.name}</span>
                        <button
                          onClick={() => toggleSkill(sk.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                        >
                          <Icon name="x" size={12} color={T.danger} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Preset Modal */}
      <Modal open={presetModal} onClose={() => setPresetModal(false)} title="Apply Preset">
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 16 }}>
          This will replace {trainee.name.split(" ")[0]}'s current skill assignments with the preset.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: selectedPreset === preset.id ? T.goldMuted : T.cream,
                border: "1.5px solid " + (selectedPreset === preset.id ? T.gold : T.lightLine),
                borderRadius: T.radiusSm,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500 }}>{preset.name}</p>
                <p style={{ fontSize: "11px", color: T.textMuted }}>{preset.skillIds.length} skills</p>
              </div>
              {selectedPreset === preset.id && (
                <Icon name="check" size={20} color={T.gold} />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="outline" onClick={() => setPresetModal(false)}>Cancel</Btn>
          <Btn onClick={applyPreset} disabled={!selectedPreset}>Apply Preset</Btn>
        </div>
      </Modal>
    </div>
  );
};
