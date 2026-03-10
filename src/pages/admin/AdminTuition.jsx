import { useState } from "react";
import { T, iSt } from "../../theme";
import { useData } from "../../context";
import { uid } from "../../utils";
import { Card, Badge, Avatar, ProgressBar, Btn, Modal, FormField, Icon, SectionTitle } from "../../components/ui";
import { getTuitionInfo, STATUS_STYLES } from "../../components/tuition/tuitionHelpers";

export const AdminTuition = ({ onNav }) => {
  const { residents, setResidents, showToast } = useData();

  // Payment modal
  const [payModal, setPayModal] = useState(false);
  const [payTraineeId, setPayTraineeId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payDate, setPayDate] = useState("");

  // Plan modal
  const [planModal, setPlanModal] = useState(false);
  const [planTraineeId, setPlanTraineeId] = useState(null);
  const [planType, setPlanType] = useState("monthly");
  const [planTotal, setPlanTotal] = useState("");

  // Revenue calculations
  const allTuition = residents.map((r) => getTuitionInfo(r));
  const totalRevenue = allTuition.reduce((a, t) => a + t.paid, 0);
  const totalOutstanding = allTuition.reduce((a, t) => a + t.remaining, 0);
  const totalExpected = allTuition.reduce((a, t) => a + t.total, 0);
  const paidInFull = allTuition.filter((t) => t.status === "paid").length;

  const openRecordPayment = (traineeId) => {
    setPayTraineeId(traineeId);
    setPayAmount("");
    setPayNote("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayModal(true);
  };

  const savePayment = () => {
    if (!payTraineeId || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;
    setResidents(residents.map((r) => {
      if (r.id !== payTraineeId) return r;
      const tuition = r.tuition || { plan: "monthly", total: 4950, payments: [] };
      return {
        ...r,
        tuition: {
          ...tuition,
          payments: [
            ...tuition.payments,
            { id: uid(), amount, date: payDate || new Date().toISOString().split("T")[0], note: payNote.trim() || "Payment" },
          ],
        },
      };
    }));
    setPayModal(false);
    showToast("Payment recorded");
  };

  const openChangePlan = (traineeId) => {
    const r = residents.find((r) => r.id === traineeId);
    const t = r?.tuition || { plan: "monthly", total: 4950 };
    setPlanTraineeId(traineeId);
    setPlanType(t.plan);
    setPlanTotal(t.total?.toString() || "4950");
    setPlanModal(true);
  };

  const savePlan = () => {
    if (!planTraineeId) return;
    const total = parseFloat(planTotal) || 4950;
    setResidents(residents.map((r) => {
      if (r.id !== planTraineeId) return r;
      const tuition = r.tuition || { plan: "monthly", total: 4950, payments: [] };
      return {
        ...r,
        tuition: { ...tuition, plan: planType, total },
      };
    }));
    setPlanModal(false);
    showToast("Plan updated");
  };

  return (
    <div className="fade-up">
      <SectionTitle sub="Revenue overview and trainee payment accounts">
        Tuition & Payments
      </SectionTitle>

      {/* Revenue Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
            Total Collected
          </p>
          <p style={{ fontSize: "30px", fontWeight: 700, fontFamily: T.fontD, color: T.success }}>
            ${totalRevenue.toLocaleString()}
          </p>
          <p style={{ fontSize: "11px", color: T.textMuted }}>
            of ${totalExpected.toLocaleString()} expected
          </p>
        </Card>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
            Outstanding
          </p>
          <p style={{ fontSize: "30px", fontWeight: 700, fontFamily: T.fontD, color: totalOutstanding > 0 ? T.warn : T.success }}>
            ${totalOutstanding.toLocaleString()}
          </p>
          <p style={{ fontSize: "11px", color: T.textMuted }}>
            across {allTuition.filter((t) => t.remaining > 0).length} trainee{allTuition.filter((t) => t.remaining > 0).length !== 1 ? "s" : ""}
          </p>
        </Card>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
            Paid in Full
          </p>
          <p style={{ fontSize: "30px", fontWeight: 700, fontFamily: T.fontD, color: T.charcoal }}>
            {paidInFull}/{residents.length}
          </p>
          <p style={{ fontSize: "11px", color: T.textMuted }}>
            trainees fully paid
          </p>
        </Card>
      </div>

      {/* Trainee Accounts */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid " + T.lightLine }}>
          <h4 style={{ fontFamily: T.fontD, fontSize: "16px", fontWeight: 600 }}>Trainee Accounts</h4>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {residents.map((r) => {
            const info = getTuitionInfo(r);
            const st = STATUS_STYLES[info.status];
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderBottom: "1px solid " + T.lightLine,
                }}
              >
                <Avatar name={r.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span
                      style={{ fontSize: "14px", fontWeight: 500, cursor: "pointer", color: T.charcoal }}
                      onClick={() => onNav && onNav("trainee", r.id)}
                    >
                      {r.name}
                    </span>
                    <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
                    <Badge color={T.textMuted}>{info.plan}</Badge>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={info.paidPct} color={info.status === "paid" ? T.success : T.gold} />
                    </div>
                    <span style={{ fontSize: "12px", color: T.textMuted, whiteSpace: "nowrap" }}>
                      ${info.paid.toLocaleString()} / ${info.total.toLocaleString()}
                    </span>
                  </div>
                  {/* Payment history */}
                  {info.payments.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {info.payments.map((p) => (
                        <span
                          key={p.id}
                          style={{
                            fontSize: "10px",
                            padding: "3px 8px",
                            background: T.cream,
                            borderRadius: T.radiusSm,
                            color: T.textMuted,
                          }}
                        >
                          ${p.amount.toLocaleString()} &middot; {p.date} {p.note ? `— ${p.note}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn
                    variant="gold"
                    onClick={() => openRecordPayment(r.id)}
                    style={{ fontSize: "11px", padding: "7px 12px" }}
                  >
                    <Icon name="dollar" size={13} color={T.gold} />
                    Record
                  </Btn>
                  <Btn
                    variant="outline"
                    onClick={() => openChangePlan(r.id)}
                    style={{ fontSize: "11px", padding: "7px 12px" }}
                  >
                    <Icon name="edit" size={13} color={T.textMuted} />
                    Plan
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Record Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment">
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 14 }}>
          Recording payment for <strong>{residents.find((r) => r.id === payTraineeId)?.name}</strong>
        </p>
        <FormField label="Amount ($)">
          <input
            style={iSt}
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="e.g. 1650"
          />
        </FormField>
        <FormField label="Date">
          <input
            style={iSt}
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
          />
        </FormField>
        <FormField label="Note">
          <input
            style={iSt}
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
            placeholder="e.g. Month 3"
          />
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setPayModal(false)}>Cancel</Btn>
          <Btn onClick={savePayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>Record Payment</Btn>
        </div>
      </Modal>

      {/* Change Plan Modal */}
      <Modal open={planModal} onClose={() => setPlanModal(false)} title="Change Plan">
        <p style={{ fontSize: "13px", color: T.textMuted, marginBottom: 14 }}>
          Updating plan for <strong>{residents.find((r) => r.id === planTraineeId)?.name}</strong>
        </p>
        <FormField label="Payment Plan">
          <div style={{ display: "flex", gap: 8 }}>
            {["monthly", "full", "custom"].map((p) => (
              <button
                key={p}
                onClick={() => setPlanType(p)}
                style={{
                  padding: "8px 18px",
                  background: planType === p ? T.charcoal : T.cream,
                  color: planType === p ? T.cream : T.charcoal,
                  border: "1.5px solid " + (planType === p ? T.charcoal : T.creamDark),
                  borderRadius: T.radiusSm,
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Total Tuition ($)">
          <input
            style={iSt}
            type="number"
            value={planTotal}
            onChange={(e) => setPlanTotal(e.target.value)}
            placeholder="e.g. 4950"
          />
        </FormField>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Btn variant="outline" onClick={() => setPlanModal(false)}>Cancel</Btn>
          <Btn onClick={savePlan}>Save Plan</Btn>
        </div>
      </Modal>
    </div>
  );
};
