import { useState, useEffect } from "react";
import { T, CAT_COLORS, iSt } from "../../theme";
import { useData } from "../../context";
import { uid } from "../../utils";
import { supabase } from "../../lib/supabase";
import { Card, Badge, Btn, Modal, FormField, Icon, SectionTitle } from "../../components/ui";
import { RichEditor } from "../../components/skills/RichEditor";
import { SOPViewer, SOP_SECTIONS } from "../../components/skills/SOPViewer";

export const AdminMaster = () => {
  const { masterProgram, setMasterProgram, showToast } = useData();

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState("");

  // Skill modal
  const [skModal, setSkModal] = useState(false);
  const [newSk, setNewSk] = useState("");
  const [newSkType, setNewSkType] = useState("service");
  const [newSkSop, setNewSkSop] = useState({});
  const [newSkSopTab, setNewSkSopTab] = useState("steps");
  const [targetCat, setTargetCat] = useState(null);

  // Drag reorder
  const [dragCatId, setDragCatId] = useState(null);
  const [dragOverCatId, setDragOverCatId] = useState(null);

  // Timing modal
  const [timingModal, setTimingModal] = useState(false);
  const [timingSkill, setTimingSkill] = useState(null);
  const [timingCatId, setTimingCatId] = useState(null);
  const [editTarget, setEditTarget] = useState("");
  const [editMax, setEditMax] = useState("");

  // Rename modal
  const [renameModal, setRenameModal] = useState(false);
  const [renameType, setRenameType] = useState("category");
  const [renameCatId, setRenameCatId] = useState(null);
  const [renameSkillId, setRenameSkillId] = useState(null);
  const [renameName, setRenameName] = useState("");

  // Video modal
  const [videoModal, setVideoModal] = useState(false);
  const [videoTarget, setVideoTarget] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoMode, setVideoMode] = useState("url");

  // SOP modal
  const [sopModal, setSopModal] = useState(false);
  const [sopCatId, setSopCatId] = useState(null);
  const [sopSkillId, setSopSkillId] = useState(null);
  const [sopData, setSopData] = useState({});
  const [sopTab, setSopTab] = useState("steps");

  // Color picker
  const [colorPickerCatId, setColorPickerCatId] = useState(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Archive (local only — soft delete)
  const [showArchive, setShowArchive] = useState(false);
  const [archived, setArchived] = useState([]);

  /* ---- Helper to reload program from Supabase ---- */
  const loadProgram = async () => {
    const [{ data: cats }, { data: skills }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("skills").select("*").order("sort_order"),
    ]);
    const program = (cats || []).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      videos: c.videos || [],
      skills: (skills || []).filter((s) => s.category_id === c.id).map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        targetMin: s.target_min,
        maxMin: s.max_min,
        videos: s.videos || [],
        sop: s.sop,
      })),
    }));
    setMasterProgram(program);
  };

  /* ---- CRUD Functions ---- */

  const addCat = async () => {
    if (!newCat.trim()) return;
    const id = uid();
    const color = CAT_COLORS[masterProgram.length % CAT_COLORS.length];
    const { error } = await supabase.from("categories").insert({
      id,
      name: newCat.trim(),
      color,
      videos: [],
      sort_order: masterProgram.length,
    });
    if (error) { console.error(error); showToast("Error adding category"); return; }

    setMasterProgram([...masterProgram, { id, name: newCat.trim(), color, videos: [], skills: [] }]);
    setNewCat("");
    setCatModal(false);
    showToast("Category added");
  };

  const confirmDeleteCat = (catId) => {
    const cat = masterProgram.find((c) => c.id === catId);
    setDeleteTarget({ type: "category", id: catId, name: cat?.name || "Category" });
    setDeleteModal(true);
  };

  const confirmDeleteSk = (catId, skId) => {
    const cat = masterProgram.find((c) => c.id === catId);
    const sk = cat?.skills.find((s) => s.id === skId);
    setDeleteTarget({ type: "skill", catId, id: skId, name: sk?.name || "Skill" });
    setDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") {
      const cat = masterProgram.find((c) => c.id === deleteTarget.id);
      // Delete from Supabase (cascade deletes skills)
      const { error } = await supabase.from("categories").delete().eq("id", deleteTarget.id);
      if (error) { console.error(error); showToast("Error deleting"); return; }

      if (cat) setArchived((prev) => [...prev, { ...cat, archivedType: "category", archivedAt: new Date().toISOString() }]);
      setMasterProgram(masterProgram.filter((c) => c.id !== deleteTarget.id));
      showToast("Category archived");
    } else {
      const cat = masterProgram.find((c) => c.id === deleteTarget.catId);
      const sk = cat?.skills.find((s) => s.id === deleteTarget.id);
      // Delete skill from Supabase
      const { error } = await supabase.from("skills").delete().eq("id", deleteTarget.id);
      if (error) { console.error(error); showToast("Error deleting"); return; }

      if (sk) setArchived((prev) => [...prev, { ...sk, parentCatId: deleteTarget.catId, parentCatName: cat?.name, archivedType: "skill", archivedAt: new Date().toISOString() }]);
      setMasterProgram(masterProgram.map((c) =>
        c.id === deleteTarget.catId ? { ...c, skills: c.skills.filter((s) => s.id !== deleteTarget.id) } : c
      ));
      showToast("Skill archived");
    }
    setDeleteModal(false);
    setDeleteTarget(null);
  };

  const restoreItem = async (idx) => {
    const item = archived[idx];
    if (!item) return;
    if (item.archivedType === "category") {
      const { archivedType, archivedAt, ...cat } = item;
      // Re-insert category
      const { error } = await supabase.from("categories").insert({
        id: cat.id, name: cat.name, color: cat.color, videos: cat.videos || [], sort_order: masterProgram.length,
      });
      if (error) { console.error(error); showToast("Error restoring"); return; }
      // Re-insert skills
      if (cat.skills?.length > 0) {
        const skillRows = cat.skills.map((s, i) => ({
          id: s.id, category_id: cat.id, name: s.name, type: s.type,
          target_min: s.targetMin || null, max_min: s.maxMin || null,
          videos: s.videos || [], sop: s.sop || null, sort_order: i,
        }));
        await supabase.from("skills").insert(skillRows);
      }
      setMasterProgram([...masterProgram, cat]);
      showToast("Category restored");
    } else {
      const { archivedType, archivedAt, parentCatId, parentCatName, ...sk } = item;
      const catExists = masterProgram.find((c) => c.id === parentCatId);
      if (!catExists) { showToast("Parent category no longer exists"); return; }
      // Re-insert skill
      const { error } = await supabase.from("skills").insert({
        id: sk.id, category_id: parentCatId, name: sk.name, type: sk.type,
        target_min: sk.targetMin || null, max_min: sk.maxMin || null,
        videos: sk.videos || [], sop: sk.sop || null, sort_order: catExists.skills.length,
      });
      if (error) { console.error(error); showToast("Error restoring"); return; }
      setMasterProgram(masterProgram.map((c) =>
        c.id === parentCatId ? { ...c, skills: [...c.skills, sk] } : c
      ));
      showToast("Skill restored to " + catExists.name);
    }
    setArchived(archived.filter((_, i) => i !== idx));
  };

  const openAddSk = (catId) => {
    setTargetCat(catId);
    setNewSk("");
    setNewSkType("service");
    setNewSkSop({});
    setNewSkSopTab("steps");
    setSkModal(true);
  };

  const addSk = async () => {
    if (!newSk.trim() || !targetCat) return;
    const id = uid();
    const cat = masterProgram.find((c) => c.id === targetCat);
    const sopCleaned = {};
    Object.keys(newSkSop).forEach((k) => { if (newSkSop[k]?.trim()) sopCleaned[k] = newSkSop[k]; });
    const hasSop = Object.keys(sopCleaned).length > 0;

    const { error } = await supabase.from("skills").insert({
      id,
      category_id: targetCat,
      name: newSk.trim(),
      type: newSkType,
      target_min: newSkType === "service" ? 45 : null,
      max_min: newSkType === "service" ? 75 : null,
      videos: [],
      sop: hasSop ? sopCleaned : null,
      sort_order: cat?.skills.length || 0,
    });
    if (error) { console.error(error); showToast("Error adding skill"); return; }

    const sk = {
      id,
      name: newSk.trim(),
      type: newSkType,
      videos: [],
      ...(newSkType === "service" ? { targetMin: 45, maxMin: 75 } : {}),
      ...(hasSop ? { sop: sopCleaned } : {}),
    };
    setMasterProgram(masterProgram.map((c) =>
      c.id === targetCat ? { ...c, skills: [...c.skills, sk] } : c
    ));
    setSkModal(false);
    setNewSk("");
    setNewSkSop({});
    showToast("Skill added");
  };

  const openEditTiming = (catId, skill) => {
    setTimingCatId(catId);
    setTimingSkill(skill);
    setEditTarget(skill.targetMin?.toString() || "");
    setEditMax(skill.maxMin?.toString() || "");
    setTimingModal(true);
  };

  const saveTiming = async () => {
    if (!timingSkill || !timingCatId) return;
    const tgt = parseInt(editTarget) || 0;
    const mx = parseInt(editMax) || 0;

    const { error } = await supabase.from("skills").update({ target_min: tgt, max_min: mx }).eq("id", timingSkill.id);
    if (error) { console.error(error); showToast("Error saving timing"); return; }

    setMasterProgram(masterProgram.map((c) =>
      c.id === timingCatId
        ? { ...c, skills: c.skills.map((s) => s.id === timingSkill.id ? { ...s, targetMin: tgt, maxMin: mx } : s) }
        : c
    ));
    setTimingModal(false);
    showToast("Timing updated");
  };

  const openRenameCat = (catId) => {
    const cat = masterProgram.find((c) => c.id === catId);
    setRenameType("category");
    setRenameCatId(catId);
    setRenameSkillId(null);
    setRenameName(cat?.name || "");
    setRenameModal(true);
  };

  const openRenameSk = (catId, skId) => {
    const cat = masterProgram.find((c) => c.id === catId);
    const sk = cat?.skills.find((s) => s.id === skId);
    setRenameType("skill");
    setRenameCatId(catId);
    setRenameSkillId(skId);
    setRenameName(sk?.name || "");
    setRenameModal(true);
  };

  const saveRename = async () => {
    if (!renameName.trim()) return;
    if (renameType === "category") {
      const { error } = await supabase.from("categories").update({ name: renameName.trim() }).eq("id", renameCatId);
      if (error) { console.error(error); showToast("Error renaming"); return; }
      setMasterProgram(masterProgram.map((c) =>
        c.id === renameCatId ? { ...c, name: renameName.trim() } : c
      ));
      showToast("Category renamed");
    } else {
      const { error } = await supabase.from("skills").update({ name: renameName.trim() }).eq("id", renameSkillId);
      if (error) { console.error(error); showToast("Error renaming"); return; }
      setMasterProgram(masterProgram.map((c) =>
        c.id === renameCatId
          ? { ...c, skills: c.skills.map((s) => (s.id === renameSkillId ? { ...s, name: renameName.trim() } : s)) }
          : c
      ));
      showToast("Skill renamed");
    }
    setRenameModal(false);
  };

  const openAddVideo = (target) => {
    setVideoTarget(target);
    setVideoTitle("");
    setVideoUrl("");
    setVideoDuration("");
    setVideoFile(null);
    setVideoUploading(false);
    setVideoMode("url");
    setVideoModal(true);
  };

  const handleVideoFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (!videoTitle) setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const saveVideo = () => {
    if (!videoTitle.trim()) return;
    if (videoMode === "url" && !videoUrl.trim()) return;
    if (videoMode === "file" && !videoFile) return;

    const video = {
      id: uid(),
      title: videoTitle.trim(),
      url: videoMode === "url" ? videoUrl.trim() : URL.createObjectURL(videoFile),
      duration: videoDuration.trim() || "0:00",
    };

    if (videoUploading) return;
    if (videoMode === "file") {
      setVideoUploading(true);
      setTimeout(() => {
        applyVideo(video);
        setVideoUploading(false);
      }, 800);
    } else {
      applyVideo(video);
    }
  };

  const applyVideo = async (video) => {
    if (!videoTarget) return;
    if (videoTarget.type === "category") {
      const cat = masterProgram.find((c) => c.id === videoTarget.catId);
      const newVideos = [...(cat?.videos || []), video];
      const { error } = await supabase.from("categories").update({ videos: newVideos }).eq("id", videoTarget.catId);
      if (error) { console.error(error); showToast("Error saving video"); return; }
      setMasterProgram(masterProgram.map((c) =>
        c.id === videoTarget.catId ? { ...c, videos: newVideos } : c
      ));
    } else {
      const cat = masterProgram.find((c) => c.id === videoTarget.catId);
      const sk = cat?.skills.find((s) => s.id === videoTarget.skId);
      const newVideos = [...(sk?.videos || []), video];
      const { error } = await supabase.from("skills").update({ videos: newVideos }).eq("id", videoTarget.skId);
      if (error) { console.error(error); showToast("Error saving video"); return; }
      setMasterProgram(masterProgram.map((c) =>
        c.id === videoTarget.catId
          ? { ...c, skills: c.skills.map((s) => s.id === videoTarget.skId ? { ...s, videos: newVideos } : s) }
          : c
      ));
    }
    setVideoModal(false);
    showToast("Video added");
  };

  const removeVideo = async (catId, skId, videoId) => {
    if (skId) {
      const cat = masterProgram.find((c) => c.id === catId);
      const sk = cat?.skills.find((s) => s.id === skId);
      const newVideos = (sk?.videos || []).filter((v) => v.id !== videoId);
      const { error } = await supabase.from("skills").update({ videos: newVideos }).eq("id", skId);
      if (error) { console.error(error); showToast("Error removing video"); return; }
      setMasterProgram(masterProgram.map((c) =>
        c.id === catId
          ? { ...c, skills: c.skills.map((s) => s.id === skId ? { ...s, videos: newVideos } : s) }
          : c
      ));
    } else {
      const cat = masterProgram.find((c) => c.id === catId);
      const newVideos = (cat?.videos || []).filter((v) => v.id !== videoId);
      const { error } = await supabase.from("categories").update({ videos: newVideos }).eq("id", catId);
      if (error) { console.error(error); showToast("Error removing video"); return; }
      setMasterProgram(masterProgram.map((c) =>
        c.id === catId ? { ...c, videos: newVideos } : c
      ));
    }
    showToast("Video removed");
  };

  const openSop = (catId, skId) => {
    const cat = masterProgram.find((c) => c.id === catId);
    const sk = cat?.skills.find((s) => s.id === skId);
    setSopCatId(catId);
    setSopSkillId(skId);
    setSopData(sk?.sop ? { ...sk.sop } : {});
    setSopTab("steps");
    setSopModal(true);
  };

  const saveSop = async () => {
    const cleaned = {};
    Object.keys(sopData).forEach((k) => {
      if (sopData[k]?.trim()) cleaned[k] = sopData[k];
    });
    const sopVal = Object.keys(cleaned).length > 0 ? cleaned : null;

    const { error } = await supabase.from("skills").update({ sop: sopVal }).eq("id", sopSkillId);
    if (error) { console.error(error); showToast("Error saving curriculum"); return; }

    setMasterProgram(masterProgram.map((c) =>
      c.id === sopCatId
        ? { ...c, skills: c.skills.map((s) => s.id === sopSkillId ? { ...s, sop: sopVal || undefined } : s) }
        : c
    ));
    setSopModal(false);
    showToast("Curriculum saved");
  };

  const setCatColor = async (catId, color) => {
    const { error } = await supabase.from("categories").update({ color }).eq("id", catId);
    if (error) { console.error(error); return; }
    setMasterProgram(masterProgram.map((c) =>
      c.id === catId ? { ...c, color } : c
    ));
    setColorPickerCatId(null);
  };

  /* ---- Drag handlers ---- */

  const handleCatDragStart = (e, catId) => {
    setDragCatId(catId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCatDragOver = (e, catId) => {
    e.preventDefault();
    if (catId !== dragCatId) setDragOverCatId(catId);
  };

  const handleCatDragLeave = () => {
    setDragOverCatId(null);
  };

  const handleCatDrop = async (e, targetId) => {
    e.preventDefault();
    if (!dragCatId || dragCatId === targetId) {
      setDragCatId(null);
      setDragOverCatId(null);
      return;
    }
    const items = [...masterProgram];
    const fromIdx = items.findIndex((c) => c.id === dragCatId);
    const toIdx = items.findIndex((c) => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);

    // Update sort_order in Supabase
    const updates = items.map((c, i) => supabase.from("categories").update({ sort_order: i }).eq("id", c.id));
    await Promise.all(updates);

    setMasterProgram(items);
    setDragCatId(null);
    setDragOverCatId(null);
    showToast("Category reordered");
  };

  const handleCatDragEnd = () => {
    setDragCatId(null);
    setDragOverCatId(null);
  };

  /* ---- UI ---- */

  return (
    <div className="fade-up">
      <SectionTitle
        sub="Manage categories, skills, videos, and curriculum"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="outline"
              onClick={() => setShowArchive(!showArchive)}
              style={{ fontSize: "12px", padding: "8px 14px" }}
            >
              <Icon name="trash" size={14} color={T.textMuted} />
              Archive ({archived.length})
            </Btn>
            <Btn onClick={() => setCatModal(true)}>
              <Icon name="plus" size={14} color={T.cream} />
              Add Category
            </Btn>
          </div>
        }
      >
        Master Program
      </SectionTitle>

      {/* Archive Panel */}
      {showArchive && (
        <Card style={{ padding: 20, marginBottom: 20, border: `1.5px dashed ${T.lightLine}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>Archived Items</h4>
            <button
              onClick={() => setShowArchive(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              <Icon name="x" size={16} color={T.textMuted} />
            </button>
          </div>
          {archived.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No archived items.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {archived.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: T.cream,
                    borderRadius: T.radiusSm,
                  }}
                >
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>{item.name}</span>
                    <Badge
                      color={T.textMuted}
                      bg={T.creamDark}
                    >
                      {item.archivedType}
                    </Badge>
                    {item.parentCatName && (
                      <span style={{ fontSize: "11px", color: T.textMuted, marginLeft: 8 }}>
                        from {item.parentCatName}
                      </span>
                    )}
                  </div>
                  <Btn
                    variant="outline"
                    onClick={() => restoreItem(idx)}
                    style={{ fontSize: "11px", padding: "6px 12px" }}
                  >
                    Restore
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Category Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {masterProgram.map((cat) => (
          <Card
            key={cat.id}
            style={{
              padding: 0,
              opacity: dragCatId === cat.id ? 0.5 : 1,
              border: dragOverCatId === cat.id ? `2px dashed ${T.gold}` : undefined,
              borderLeft: `4px solid ${cat.color}`,
              transition: "opacity .2s, border .2s",
            }}
            draggable
            onDragStart={(e) => handleCatDragStart(e, cat.id)}
            onDragOver={(e) => handleCatDragOver(e, cat.id)}
            onDragLeave={handleCatDragLeave}
            onDrop={(e) => handleCatDrop(e, cat.id)}
            onDragEnd={handleCatDragEnd}
          >
            {/* Category Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: `1px solid ${T.lightLine}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ cursor: "grab", padding: "0 4px" }}>
                  <Icon name="grip" size={16} color={T.textMuted} />
                </div>

                {/* Color Picker Dot */}
                <div style={{ position: "relative" }}>
                  <div
                    onClick={() => setColorPickerCatId(colorPickerCatId === cat.id ? null : cat.id)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: cat.color,
                      cursor: "pointer",
                      border: "2px solid " + T.white,
                      boxShadow: "0 0 0 1px " + T.lightLine,
                    }}
                  />
                  {colorPickerCatId === cat.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: 24,
                        left: 0,
                        zIndex: 20,
                        background: T.white,
                        border: "1px solid " + T.lightLine,
                        borderRadius: T.radiusSm,
                        padding: 8,
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        width: 140,
                        boxShadow: T.shadowLg,
                      }}
                    >
                      {CAT_COLORS.map((c) => (
                        <div
                          key={c}
                          onClick={() => setCatColor(cat.id, c)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: c,
                            cursor: "pointer",
                            border: c === cat.color ? "2px solid " + T.charcoal : "2px solid transparent",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <h3
                  style={{
                    fontFamily: T.fontD,
                    fontSize: "18px",
                    fontWeight: 600,
                    color: T.charcoal,
                  }}
                >
                  {cat.name}
                </h3>
                <Badge color={cat.color}>{cat.skills.length} skills</Badge>
                {(cat.videos || []).length > 0 && (
                  <Badge color="#8B6AAE">{cat.videos.length} videos</Badge>
                )}
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => openAddVideo({ type: "category", catId: cat.id })}
                  title="Add video"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                  }}
                >
                  <Icon name="play" size={16} color={T.textMuted} />
                </button>
                <button
                  onClick={() => openRenameCat(cat.id)}
                  title="Rename"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                  }}
                >
                  <Icon name="edit" size={16} color={T.textMuted} />
                </button>
                <button
                  onClick={() => confirmDeleteCat(cat.id)}
                  title="Archive"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                  }}
                >
                  <Icon name="trash" size={16} color={T.danger} />
                </button>
              </div>
            </div>

            {/* Category Videos */}
            {(cat.videos || []).length > 0 && (
              <div style={{ padding: "10px 20px", borderBottom: "1px solid " + T.lightLine, background: T.cream }}>
                <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>
                  Category Videos
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {cat.videos.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        background: T.white,
                        border: "1px solid " + T.lightLine,
                        borderRadius: T.radiusSm,
                        fontSize: "11px",
                      }}
                    >
                      <Icon name="play" size={12} color="#8B6AAE" />
                      <span style={{ fontWeight: 500 }}>{v.title}</span>
                      <span style={{ color: T.textMuted }}>{v.duration}</span>
                      <button
                        onClick={() => removeVideo(cat.id, null, v.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                      >
                        <Icon name="x" size={12} color={T.danger} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {cat.skills.map((sk) => (
                  <div
                    key={sk.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      background: T.cream,
                      borderRadius: T.radiusSm,
                      border: "1px solid " + T.lightLine,
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{sk.name}</span>

                    {/* Type badge */}
                    <Badge
                      color={sk.type === "service" ? T.gold : T.textMuted}
                      bg={sk.type === "service" ? T.goldMuted : T.charcoalMuted}
                    >
                      {sk.type}
                    </Badge>

                    {/* Video count badge */}
                    {(sk.videos || []).length > 0 && (
                      <Badge color="#8B6AAE">
                        <Icon name="play" size={10} color="#8B6AAE" />
                        {sk.videos.length}
                      </Badge>
                    )}

                    {/* Timing badge */}
                    {sk.type === "service" && sk.targetMin && (
                      <Badge color={T.success}>
                        {sk.targetMin}-{sk.maxMin}m
                      </Badge>
                    )}

                    {/* SOP badge */}
                    {sk.sop && (
                      <Badge color="#4285f4">SOP</Badge>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 2, marginLeft: 4 }}>
                      <button
                        onClick={() => openAddVideo({ type: "skill", catId: cat.id, skId: sk.id })}
                        title="Add video"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 3 }}
                      >
                        <Icon name="play" size={13} color={T.textMuted} />
                      </button>
                      {sk.type === "service" && (
                        <button
                          onClick={() => openEditTiming(cat.id, sk)}
                          title="Edit timing"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 3 }}
                        >
                          <Icon name="zap" size={13} color={T.textMuted} />
                        </button>
                      )}
                      <button
                        onClick={() => openSop(cat.id, sk.id)}
                        title="Edit curriculum"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 3 }}
                      >
                        <Icon name="file" size={13} color={T.textMuted} />
                      </button>
                      <button
                        onClick={() => openRenameSk(cat.id, sk.id)}
                        title="Rename"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 3 }}
                      >
                        <Icon name="edit" size={13} color={T.textMuted} />
                      </button>
                      <button
                        onClick={() => confirmDeleteSk(cat.id, sk.id)}
                        title="Archive"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 3 }}
                      >
                        <Icon name="trash" size={13} color={T.danger} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add skill button */}
                <button
                  onClick={() => openAddSk(cat.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: "transparent",
                    border: "1.5px dashed " + T.lightLine,
                    borderRadius: T.radiusSm,
                    cursor: "pointer",
                    fontSize: "12px",
                    color: T.textMuted,
                    fontWeight: 500,
                  }}
                >
                  <Icon name="plus" size={13} color={T.textMuted} />
                  Add Skill
                </button>
              </div>

              {/* Skill-level videos (inline under the skill pills) */}
              {cat.skills.filter((sk) => (sk.videos || []).length > 0).map((sk) => (
                <div key={sk.id + "-vids"} style={{ marginTop: 10 }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>
                    {sk.name} Videos
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {sk.videos.map((v) => (
                      <div
                        key={v.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          background: T.white,
                          border: "1px solid " + T.lightLine,
                          borderRadius: T.radiusSm,
                          fontSize: "11px",
                        }}
                      >
                        <Icon name="play" size={12} color="#8B6AAE" />
                        <span style={{ fontWeight: 500 }}>{v.title}</span>
                        <span style={{ color: T.textMuted }}>{v.duration}</span>
                        <button
                          onClick={() => removeVideo(cat.id, sk.id, v.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                        >
                          <Icon name="x" size={12} color={T.danger} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* SOP Viewer inline for skills that have SOPs */}
              {cat.skills.filter((sk) => sk.sop).map((sk) => (
                <div key={sk.id + "-sop"} style={{ marginTop: 8 }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, color: T.textMuted, marginBottom: 2 }}>{sk.name}</p>
                  <SOPViewer sop={sk.sop} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {masterProgram.length === 0 && (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <Icon name="template" size={40} color={T.lightLine} />
          <p style={{ color: T.textMuted, fontSize: "14px", marginTop: 12 }}>
            No categories yet. Add your first category to start building the master program.
          </p>
        </Card>
      )}

      {/* ---- MODAL 1: Add Category ---- */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Add Category">
        <FormField label="Category Name">
          <input
            style={iSt}
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="e.g. Cutting & Styling"
            onKeyDown={(e) => e.key === "Enter" && addCat()}
          />
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setCatModal(false)}>Cancel</Btn>
          <Btn onClick={addCat} disabled={!newCat.trim()}>Add Category</Btn>
        </div>
      </Modal>

      {/* ---- MODAL 2: Add Skill (with SOP editor) ---- */}
      <Modal open={skModal} onClose={() => setSkModal(false)} title="Add Skill" width={620}>
        <FormField label="Skill Name">
          <input
            style={iSt}
            value={newSk}
            onChange={(e) => setNewSk(e.target.value)}
            placeholder="e.g. Basic Layered Cut"
          />
        </FormField>
        <FormField label="Skill Type">
          <div style={{ display: "flex", gap: 8 }}>
            {["service", "knowledge"].map((t) => (
              <button
                key={t}
                onClick={() => setNewSkType(t)}
                style={{
                  padding: "8px 18px",
                  background: newSkType === t ? T.charcoal : T.cream,
                  color: newSkType === t ? T.cream : T.charcoal,
                  border: "1.5px solid " + (newSkType === t ? T.charcoal : T.creamDark),
                  borderRadius: T.radiusSm,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </FormField>

        {/* SOP Editor Tabs */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", color: T.textMuted, marginBottom: 8 }}>
            Curriculum (Optional)
          </p>
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 10 }}>
            {SOP_SECTIONS.map((sec) => (
              <button
                key={sec.key}
                onClick={() => setNewSkSopTab(sec.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  background: newSkSopTab === sec.key ? sec.color + "15" : T.white,
                  border: "1px solid " + (newSkSopTab === sec.key ? sec.color + "40" : T.lightLine),
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: newSkSopTab === sec.key ? sec.color : T.textMuted,
                }}
              >
                <Icon name={sec.icon} size={11} color={newSkSopTab === sec.key ? sec.color : T.textMuted} />
                {sec.label}
              </button>
            ))}
          </div>
          <RichEditor
            value={newSkSop[newSkSopTab] || ""}
            onChange={(val) => setNewSkSop({ ...newSkSop, [newSkSopTab]: val })}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setSkModal(false)}>Cancel</Btn>
          <Btn onClick={addSk} disabled={!newSk.trim()}>Add Skill</Btn>
        </div>
      </Modal>

      {/* ---- MODAL 3: Edit Timing ---- */}
      <Modal open={timingModal} onClose={() => setTimingModal(false)} title="Edit Timing Goals">
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 16 }}>
          Set target and maximum minutes for <strong>{timingSkill?.name}</strong>.
        </p>
        <FormField label="Target Minutes">
          <input
            style={iSt}
            type="number"
            value={editTarget}
            onChange={(e) => setEditTarget(e.target.value)}
            placeholder="e.g. 45"
          />
        </FormField>
        <FormField label="Maximum Minutes">
          <input
            style={iSt}
            type="number"
            value={editMax}
            onChange={(e) => setEditMax(e.target.value)}
            placeholder="e.g. 75"
          />
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setTimingModal(false)}>Cancel</Btn>
          <Btn onClick={saveTiming}>Save</Btn>
        </div>
      </Modal>

      {/* ---- MODAL 4: Rename ---- */}
      <Modal open={renameModal} onClose={() => setRenameModal(false)} title={renameType === "category" ? "Rename Category" : "Rename Skill"}>
        <FormField label="New Name">
          <input
            style={iSt}
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            placeholder="Enter new name"
          />
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setRenameModal(false)}>Cancel</Btn>
          <Btn onClick={saveRename} disabled={!renameName.trim()}>Save</Btn>
        </div>
      </Modal>

      {/* ---- MODAL 5: Video Upload ---- */}
      <Modal open={videoModal} onClose={() => setVideoModal(false)} title="Add Video" width={520}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["url", "file"].map((m) => (
            <button
              key={m}
              onClick={() => setVideoMode(m)}
              style={{
                padding: "8px 18px",
                background: videoMode === m ? T.charcoal : T.cream,
                color: videoMode === m ? T.cream : T.charcoal,
                border: "1.5px solid " + (videoMode === m ? T.charcoal : T.creamDark),
                borderRadius: T.radiusSm,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              {m === "url" ? "URL / Embed" : "Upload File"}
            </button>
          ))}
        </div>
        <FormField label="Video Title">
          <input
            style={iSt}
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="e.g. Layered Cut Breakdown"
          />
        </FormField>
        {videoMode === "url" ? (
          <FormField label="Video URL">
            <input
              style={iSt}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube, Vimeo, or direct URL"
            />
          </FormField>
        ) : (
          <FormField label="Video File">
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoFile}
              style={{ fontSize: "13px" }}
            />
            {videoFile && (
              <p style={{ fontSize: "11px", color: T.textMuted, marginTop: 4 }}>
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </FormField>
        )}
        <FormField label="Duration">
          <input
            style={iSt}
            value={videoDuration}
            onChange={(e) => setVideoDuration(e.target.value)}
            placeholder="e.g. 12:30"
          />
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setVideoModal(false)}>Cancel</Btn>
          <Btn onClick={saveVideo} disabled={!videoTitle.trim() || videoUploading}>
            {videoUploading ? "Uploading..." : "Add Video"}
          </Btn>
        </div>
      </Modal>

      {/* ---- MODAL 6: SOP Edit ---- */}
      <Modal open={sopModal} onClose={() => setSopModal(false)} title="Edit Curriculum" width={640}>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 14 }}>
          {SOP_SECTIONS.map((sec) => (
            <button
              key={sec.key}
              onClick={() => setSopTab(sec.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                background: sopTab === sec.key ? sec.color + "15" : T.white,
                border: "1px solid " + (sopTab === sec.key ? sec.color + "40" : T.lightLine),
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 600,
                color: sopTab === sec.key ? sec.color : T.textMuted,
              }}
            >
              <Icon name={sec.icon} size={11} color={sopTab === sec.key ? sec.color : T.textMuted} />
              {sec.label}
              {sopData[sec.key]?.trim() && (
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: sec.color, display: "inline-block", marginLeft: 2,
                }} />
              )}
            </button>
          ))}
        </div>
        <RichEditor
          key={sopTab}
          value={sopData[sopTab] || ""}
          onChange={(val) => setSopData({ ...sopData, [sopTab]: val })}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setSopModal(false)}>Cancel</Btn>
          <Btn onClick={saveSop}>Save Curriculum</Btn>
        </div>
      </Modal>

      {/* ---- MODAL 7: Delete Confirmation ---- */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Archive">
        <p style={{ fontSize: "14px", color: T.charcoal, lineHeight: 1.6, marginBottom: 8 }}>
          Are you sure you want to archive <strong>{deleteTarget?.name}</strong>?
        </p>
        <p style={{ fontSize: "12px", color: T.textMuted, lineHeight: 1.6 }}>
          {deleteTarget?.type === "category"
            ? "All skills in this category will also be archived. You can restore them from the archive panel."
            : "You can restore this skill from the archive panel."
          }
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Btn>
          <Btn variant="danger" onClick={executeDelete}>
            <Icon name="trash" size={14} color={T.danger} />
            Archive
          </Btn>
        </div>
      </Modal>
    </div>
  );
};
