import { useState, useEffect } from "react";
import { T } from "../../theme";
import { supabase } from "../../lib/supabase";
import { Card, Badge, ProgressBar, SectionTitle, Icon } from "../../components/ui";
import { STATUS_STYLES } from "../../components/tuition/tuitionHelpers";

export const TraineeTuition = ({ user }) => {
  const [tuition, setTuition] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: tData }, { data: pData }] = await Promise.all([
        supabase.from("tuition").select("*").eq("user_id", user.id).single(),
        supabase.from("payments").select("*").eq("user_id", user.id).order("date", { ascending: true }),
      ]);
      setTuition(tData || { plan: "monthly", total: 4950 });
      setPayments(pData || []);
      setLoading(false);
    };
    load();
  }, [user.id]);

  if (loading) return (
    <div className="fade-up">
      <SectionTitle sub="Loading...">My Tuition</SectionTitle>
      <Card style={{ padding: 40, textAlign: "center" }}><p style={{ color: T.textMuted, fontSize: "13px" }}>Loading tuition data...</p></Card>
    </div>
  );

  const paid = payments.reduce((a, p) => a + Number(p.amount), 0);
  const total = Number(tuition.total);
  const remaining = Math.max(0, total - paid);
  const paidPct = total ? Math.round((paid / total) * 100) : 0;
  const status = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  const statusStyle = STATUS_STYLES[status];

  return (
    <div className="fade-up">
      <SectionTitle sub="View your payment plan and history">
        My Tuition
      </SectionTitle>

      {/* Plan Type */}
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 4 }}>
              Payment Plan
            </p>
            <p style={{ fontSize: "18px", fontWeight: 600, fontFamily: T.fontD }}>
              {tuition.plan === "full" ? "Paid in Full" : "Monthly Installments"}
            </p>
          </div>
          <Badge color={statusStyle.color} bg={statusStyle.bg}>
            {statusStyle.label}
          </Badge>
        </div>
      </Card>

      {/* Stat Boxes */}
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <Card style={{ padding: 18, textAlign: "center" }}>
          <Icon name="dollar" size={20} color={T.charcoal} />
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginTop: 8, marginBottom: 4 }}>
            Total Tuition
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: T.fontD }}>
            ${total.toLocaleString()}
          </p>
        </Card>
        <Card style={{ padding: 18, textAlign: "center" }}>
          <Icon name="check" size={20} color={T.success} />
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginTop: 8, marginBottom: 4 }}>
            Amount Paid
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: T.fontD, color: T.success }}>
            ${paid.toLocaleString()}
          </p>
        </Card>
        <Card style={{ padding: 18, textAlign: "center" }}>
          <Icon name="alert" size={20} color={remaining > 0 ? T.warn : T.success} />
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginTop: 8, marginBottom: 4 }}>
            Remaining
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: T.fontD, color: remaining > 0 ? T.warn : T.success }}>
            ${remaining.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: "13px", fontWeight: 500 }}>Payment Progress</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: T.gold }}>{paidPct}%</span>
        </div>
        <ProgressBar value={paidPct} height={8} />
      </Card>

      {/* Payment History */}
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 14 }}>
          Payment History
        </h3>
        {payments.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: "13px" }}>No payments recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {payments.map((pay) => (
              <div key={pay.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: T.radiusSm, background: T.cream }}>
                <Icon name="check" size={16} color={T.success} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>${Number(pay.amount).toLocaleString()}</p>
                  {pay.note && <p style={{ fontSize: "11px", color: T.textMuted }}>{pay.note}</p>}
                </div>
                <span style={{ fontSize: "12px", color: T.textMuted }}>{pay.date}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
