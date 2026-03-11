import { useState, useEffect } from "react";
import { T, iSt } from "../../theme";
import { supabase } from "../../lib/supabase";
import { Card, Badge, Avatar, ProgressBar, Btn, Modal, FormField, Icon, SectionTitle } from "../../components/ui";
import { STATUS_STYLES } from "../../components/tuition/tuitionHelpers";
import { localDate } from "../../utils";

export const AdminTuition = ({ onNav }) => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    // Fetch all resident profiles
    const { data: profiles } = await supabase.from("profiles").select("id, name, email, photo").eq("role", "resident");
    if (!profiles) { setLoading(false); return; }

    // Fetch all tuition records and payments
    const [{ data: tuitionData }, { data: paymentsData }] = await Promise.all([
      supabase.from("tuition").select("*"),
      supabase.from("payments").select("*").order("date", { ascending: true }),
    ]);

    const tuitionMap = {};
    (tuitionData || []).forEach((t) => { tuitionMap[t.user_id] = t; });

    const paymentsMap = {};
    (paymentsData || []).forEach((p) => {
      if (!paymentsMap[p.user_id]) paymentsMap[p.user_id] = [];
      paymentsMap[p.user_id].push(p);
    });

    const enriched = profiles.map((p) => {
      const t = tuitionMap[p.id] || { plan: "monthly", total: 4950 };
      const pays = paymentsMap[p.id] || [];
      const paid = pays.reduce((a, pay) => a + Number(pay.amount), 0);
      const total = Number(t.total);
      const remaining = Math.max(0, total - paid);
      const paidPct = total ? Math.round((paid / total) * 100) : 0;
      const status = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
      return { ...p, tuition: t, payments: pays, paid, total, remaining, paidPct, status };
    });

    setResidents(enriched);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="fade-up">
      <SectionTitle sub="Loading...">Tuition & Payments</SectionTitle>
      <Card style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.textMuted, fontSize: "13px" }}>Loading tuition data...</p></Card>
    </div>
  );

  // Revenue calculations
  const totalRevenue = residents.reduce((a, r) => a + r.paid, 0);
  const totalOutstanding = residents.reduce((a, r) => a + r.remaining, 0);
  const totalExpected = residents.reduce((a, r) => a + r.total, 0);
  const paidInFull = residents.filter((r) => r.status === "paid").length;

  const openRecordPayment = (traineeId) => {
    setPayTraineeId(traineeId);
    setPayAmount("");
    setPayNote("");
    setPayDate(localDate());
    setPayModal(true);
  };

  const savePayment = async () => {
    if (!payTraineeId || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    const { error } = await supabase.from("payments").insert({
      user_id: payTraineeId,
      amount,
      date: payDate || localDate(),
      note: payNote.trim() || "Payment",
    });

    if (error) { console.error("Payment insert error:", error); return; }
    setPayModal(false);
    await loadData();
  };

  const openChangePlan = (traineeId) => {
    const r = residents.find((r) => r.id === traineeId);
    setPlanTraineeId(traineeId);
    setPlanType(r?.tuition?.plan || "monthly");
    setPlanTotal(r?.total?.toString() || "4950");
    setPlanModal(true);
  };

  const savePlan = async () => {
    if (!planTraineeId) return;
    const total = parseFloat(planTotal) || 4950;

    // Upsert tuition record
    const { error } = await supabase.from("tuition").upsert({
      user_id: planTraineeId,
      plan: planType,
      total,
    }, { onConflict: "user_id" });

    if (error) { console.error("Plan update error:", error); return; }
    setPlanModal(false);
    await loadData();
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
            across {residents.filter((r) => r.remaining > 0).length} trainee{residents.filter((r) => r.remaining > 0).length !== 1 ? "s" : ""}
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
        {residents.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No residents enrolled yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {residents.map((r) => {
              const st = STATUS_STYLES[r.status];
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
                  <Avatar name={r.name} size={36} photo={r.photo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: T.charcoal }}>
                        {r.name}
                      </span>
                      <Badge color={st.color} bg={st.bg}>{st.label}</Badge>
                      <Badge color={T.textMuted}>{r.tuition?.plan || "monthly"}</Badge>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={r.paidPct} color={r.status === "paid" ? T.success : T.gold} />
                      </div>
                      <span style={{ fontSize: "12px", color: T.textMuted, whiteSpace: "nowrap" }}>
                        ${r.paid.toLocaleString()} / ${r.total.toLocaleString()}
                      </span>
                    </div>
                    {/* Payment history */}
                    {r.payments.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.payments.map((p) => (
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
                            ${Number(p.amount).toLocaleString()} &middot; {p.date} {p.note ? `— ${p.note}` : ""}
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
        )}
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
            {["monthly", "full"].map((p) => (
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
                {p === "full" ? "Paid in Full" : "Monthly"}
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
