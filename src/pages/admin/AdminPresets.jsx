import { useState } from "react";
import { T, iSt } from "../../theme";
import { useData } from "../../context";
import { uid } from "../../utils";
import { Card, Badge, Btn, Modal, FormField, Icon, SectionTitle } from "../../components/ui";

export const AdminPresets = () => {
  const { presets, setPresets, masterProgram, showToast } = useData();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selIds, setSelIds] = useState(new Set());
  const [editId, setEditId] = useState(null);

  const openNew = () => {
    setEditId(null);
    setName("");
    setSelIds(new Set());
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setName(p.name);
    setSelIds(new Set(p.skillIds));
    setOpen(true);
  };

  const toggleSk = (sid) => {
    const next = new Set(selIds);
    if (next.has(sid)) next.delete(sid);
    else next.add(sid);
    setSelIds(next);
  };

  const toggleCat = (cat) => {
    const catIds = cat.skills.map((s) => s.id);
    const allSelected = catIds.every((id) => selIds.has(id));
    const next = new Set(selIds);
    if (allSelected) {
      catIds.forEach((id) => next.delete(id));
    } else {
      catIds.forEach((id) => next.add(id));
    }
    setSelIds(next);
  };

  const save = () => {
    if (!name.trim()) return;
    const preset = {
      id: editId || uid(),
      name: name.trim(),
      skillIds: [...selIds],
    };
    if (editId) {
      setPresets(presets.map((p) => (p.id === editId ? preset : p)));
      showToast("Preset updated");
    } else {
      setPresets([...presets, preset]);
      showToast("Preset created");
    }
    setOpen(false);
  };

  const rem = (id) => {
    setPresets(presets.filter((p) => p.id !== id));
    showToast("Preset removed");
  };

  return (
    <div>
      <SectionTitle sub="Skill preset templates" action={<Btn onClick={openNew}><Icon name="plus" size={16} /> New Preset</Btn>}>
        Presets
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {presets.map((p) => {
          const catCounts = masterProgram.map((c) => ({
            name: c.name,
            color: c.color,
            count: c.skills.filter((s) => p.skillIds.includes(s.id)).length,
          })).filter((c) => c.count > 0);

          return (
            <Card key={p.id} style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600 }}>{p.name}</h3>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(p)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Icon name="edit" size={16} color={T.textMuted} />
                  </button>
                  <button onClick={() => rem(p.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Icon name="trash" size={16} color={T.danger} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: 12 }}>{p.skillIds.length} skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {catCounts.map((c) => (
                  <Badge key={c.name} color={c.color}>{c.name} ({c.count})</Badge>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit Preset" : "New Preset"} width={560}>
        <FormField label="Preset Name">
          <input value={name} onChange={(e) => setName(e.target.value)} style={iSt} placeholder="e.g. Color Specialist" />
        </FormField>

        <FormField label={`Skills (${selIds.size} selected)`}>
          <div style={{ maxHeight: 360, overflow: "auto", border: `1px solid ${T.lightLine}`, borderRadius: T.radiusSm }}>
            {masterProgram.map((cat) => {
              const catIds = cat.skills.map((s) => s.id);
              const allSelected = catIds.every((id) => selIds.has(id));
              const someSelected = catIds.some((id) => selIds.has(id));

              return (
                <div key={cat.id} style={{ borderBottom: `1px solid ${T.lightLine}` }}>
                  <div
                    onClick={() => toggleCat(cat)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      background: someSelected ? cat.color + "08" : "transparent",
                    }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `2px solid ${allSelected ? cat.color : T.lightLine}`,
                      background: allSelected ? cat.color : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {allSelected && <Icon name="check" size={12} color={T.white} />}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: cat.color }}>{cat.name}</span>
                    <span style={{ fontSize: "11px", color: T.textMuted, marginLeft: "auto" }}>{catIds.filter((id) => selIds.has(id)).length}/{catIds.length}</span>
                  </div>
                  <div style={{ paddingLeft: 28 }}>
                    {cat.skills.map((sk) => (
                      <div
                        key={sk.id}
                        onClick={() => toggleSk(sk.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 14px",
                          cursor: "pointer",
                          fontSize: "13px",
                          color: selIds.has(sk.id) ? T.charcoal : T.textMuted,
                        }}
                      >
                        <div style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: `2px solid ${selIds.has(sk.id) ? T.gold : T.lightLine}`,
                          background: selIds.has(sk.id) ? T.gold : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          {selIds.has(sk.id) && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.white }} />}
                        </div>
                        {sk.name}
                        <Badge color={sk.type === "service" ? T.gold : T.textMuted} style={{ marginLeft: "auto" }}>{sk.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </FormField>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <Btn onClick={save}>{editId ? "Update" : "Create Preset"}</Btn>
          <Btn variant="outline" onClick={() => setOpen(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
};
