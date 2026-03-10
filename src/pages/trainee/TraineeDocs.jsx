import { useState } from "react";
import { T } from "../../theme";
import { useData } from "../../context";
import { Card, Badge, Icon, Modal, Btn, SectionTitle } from "../../components/ui";

export const TraineeDocs = () => {
  const { docs } = useData();

  const [filter, setFilter] = useState("All");
  const [viewDoc, setViewDoc] = useState(null);

  const categories = ["All", ...new Set(docs.map((d) => d.category))];
  const filtered = filter === "All" ? docs : docs.filter((d) => d.category === filter);

  return (
    <div className="fade-up">
      <SectionTitle sub="Access your training documents and resources">
        Documents
      </SectionTitle>

      {/* Category Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "8px 16px",
              borderRadius: T.radiusSm,
              border: `1.5px solid ${filter === cat ? T.gold : T.creamDark}`,
              background: filter === cat ? T.goldMuted : T.white,
              color: filter === cat ? T.gold : T.charcoal,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {filtered.map((doc) => (
          <Card key={doc.id} style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: T.radiusSm, background: T.goldMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="file" size={20} color={T.gold} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 500, marginBottom: 4 }}>{doc.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Badge color={T.charcoal}>{doc.category}</Badge>
                  <span style={{ fontSize: "11px", color: T.textMuted }}>{doc.size}</span>
                  <span style={{ fontSize: "11px", color: T.textMuted }}>{doc.date}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <Btn variant="outline" onClick={() => setViewDoc(doc)} style={{ fontSize: "12px", padding: "6px 12px" }}>
                <Icon name="eye" size={14} /> View
              </Btn>
              <Btn variant="outline" style={{ fontSize: "12px", padding: "6px 12px" }}>
                <Icon name="download" size={14} /> Download
              </Btn>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card style={{ padding: 24, textAlign: "center" }}>
          <p style={{ color: T.textMuted, fontSize: "13px" }}>No documents in this category.</p>
        </Card>
      )}

      {/* Document Viewer Modal */}
      <Modal open={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc?.name || "Document"} width={640}>
        {viewDoc && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <Badge color={T.charcoal}>{viewDoc.category}</Badge>
              <span style={{ fontSize: "12px", color: T.textMuted }}>{viewDoc.size}</span>
              <span style={{ fontSize: "12px", color: T.textMuted }}>Uploaded: {viewDoc.date}</span>
            </div>
            <div style={{ padding: 40, background: T.cream, borderRadius: T.radiusSm, textAlign: "center" }}>
              <Icon name="file" size={48} color={T.goldLight} />
              <p style={{ color: T.textMuted, fontSize: "13px", marginTop: 12 }}>
                Document preview would appear here.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <Btn variant="outline" onClick={() => setViewDoc(null)}>Close</Btn>
              <Btn>
                <Icon name="download" size={14} /> Download
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
