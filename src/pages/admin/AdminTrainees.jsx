import { useState } from "react";
import { T, iSt } from "../../theme";
import { useData } from "../../context";
import { uid, getProgress } from "../../utils";
import { Card, Avatar, ProgressBar, Btn, Modal, FormField, Icon, SectionTitle } from "../../components/ui";

export const AdminTrainees = ({ onNav }) => {
  const { residents, setResidents, masterProgram, showToast } = useData();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cohort, setCohort] = useState("");

  const openNew = () => {
    setName("");
    setEmail("");
    setCohort("");
    setOpen(true);
  };

  const save = () => {
    if (!name.trim()) return;
    const newResident = {
      id: uid(),
      name: name.trim(),
      email: email.trim(),
      cohort: cohort.trim(),
      skillIds: [],
      progress: {},
    };
    setResidents([...residents, newResident]);
    showToast("Trainee added");
    setOpen(false);
  };

  const rem = (id) => {
    setResidents(residents.filter((r) => r.id !== id));
    showToast("Trainee removed");
  };

  return (
    <div>
      <SectionTitle sub="Manage trainees" action={<Btn onClick={openNew}><Icon name="plus" size={16} /> Add Trainee</Btn>}>
        Trainees
      </SectionTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {residents.map((r) => {
          const prog = getProgress(r, masterProgram);
          return (
            <Card key={r.id} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Avatar name={r.name} size={42} />
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: "12px", color: T.textMuted }}>{r.email}</div>
                  {r.cohort && <div style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>{r.cohort}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "11px", color: T.textMuted }}>{prog.done}/{prog.total} skills</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: T.gold }}>{prog.pct}%</span>
                  </div>
                  <ProgressBar value={prog.pct} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="outline" onClick={() => onNav("a-trainees:" + r.id)} style={{ padding: "8px 14px", fontSize: "12px" }}>
                    <Icon name="eye" size={14} /> View
                  </Btn>
                  <button onClick={() => rem(r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Icon name="trash" size={16} color={T.danger} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Trainee">
        <FormField label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} style={iSt} placeholder="Full name" />
        </FormField>
        <FormField label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={iSt} placeholder="email@example.com" />
        </FormField>
        <FormField label="Cohort">
          <input value={cohort} onChange={(e) => setCohort(e.target.value)} style={iSt} placeholder="e.g. Spring 2026" />
        </FormField>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <Btn onClick={save}>Add Trainee</Btn>
          <Btn variant="outline" onClick={() => setOpen(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
};
