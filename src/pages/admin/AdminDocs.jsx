import { useState, useRef } from "react";
import { T, iSt, selSt } from "../../theme";
import { useData } from "../../context";
import { Card, Badge, Btn, Modal, FormField, Icon, SectionTitle } from "../../components/ui";

const DOC_CATEGORIES = ["Onboarding", "Resources", "Forms", "Policies", "Other"];

export const AdminDocs = () => {
  const { docs, setDocs, showToast } = useData();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Onboarding");
  const [link, setLink] = useState("");
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileType, setFileType] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size > 1048576 ? (file.size / 1048576).toFixed(1) + " MB" : (file.size / 1024).toFixed(0) + " KB");
    const ext = file.name.split(".").pop().toLowerCase();
    setFileType(ext === "pdf" ? "pdf" : ["png", "jpg", "jpeg", "gif", "svg"].includes(ext) ? "image" : "file");
    if (!name) setName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (ev) => setFileData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const openModal = () => {
    setName("");
    setCategory("Onboarding");
    setLink("");
    setFileData(null);
    setFileName("");
    setFileSize("");
    setFileType("");
    setOpen(true);
  };

  const add = () => {
    if (!name.trim()) return;
    const doc = {
      id: Date.now(),
      name: name.trim(),
      category,
      date: new Date().toISOString().slice(0, 10),
      ...(fileData
        ? { fileData, fileName, size: fileSize, type: fileType }
        : { link, size: null, type: "link" }),
    };
    setDocs([...docs, doc]);
    showToast("Document added");
    setOpen(false);
  };

  const rem = (id) => {
    setDocs(docs.filter((d) => d.id !== id));
    showToast("Document removed");
  };

  return (
    <div>
      <SectionTitle sub="Manage documents & resources" action={<Btn onClick={openModal}><Icon name="plus" size={16} /> Upload</Btn>}>
        Documents
      </SectionTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {docs.map((d) => (
          <Card key={d.id} style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: T.radiusSm, background: T.goldMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="file" size={18} color={T.gold} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{d.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <Badge color={T.textMuted}>{d.category}</Badge>
                  {d.type === "link" || d.link ? (
                    <Badge color={T.success}>Link</Badge>
                  ) : (
                    <Badge color={T.gold}>File</Badge>
                  )}
                  {d.size && <span style={{ fontSize: "11px", color: T.textMuted }}>{d.size}</span>}
                  <span style={{ fontSize: "11px", color: T.textMuted }}>{d.date}</span>
                </div>
              </div>
              <button onClick={() => rem(d.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="trash" size={16} color={T.danger} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Upload Document">
        <FormField label="File Upload">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${T.lightLine}`,
              borderRadius: T.radiusSm,
              padding: "28px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: T.cream,
              transition: "border-color .2s",
            }}
          >
            {fileName ? (
              <div>
                <Icon name="file" size={24} color={T.gold} />
                <div style={{ fontSize: "13px", fontWeight: 500, marginTop: 8 }}>{fileName}</div>
                <div style={{ fontSize: "11px", color: T.textMuted, marginTop: 2 }}>{fileSize}</div>
              </div>
            ) : (
              <div>
                <Icon name="download" size={24} color={T.textMuted} />
                <div style={{ fontSize: "13px", color: T.textMuted, marginTop: 8 }}>Click to select a file</div>
              </div>
            )}
          </div>
        </FormField>

        <FormField label="Or External Link">
          <input value={link} onChange={(e) => setLink(e.target.value)} style={iSt} placeholder="https://..." />
        </FormField>

        <FormField label="Document Name">
          <input value={name} onChange={(e) => setName(e.target.value)} style={iSt} placeholder="Document name" />
        </FormField>

        <FormField label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={selSt}>
            {DOC_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <Btn onClick={add}>Upload</Btn>
          <Btn variant="outline" onClick={() => setOpen(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
};
