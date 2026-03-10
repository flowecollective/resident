import { T } from "../../theme";
import { useData } from "../../context";
import { Card, Badge, ProgressBar, SectionTitle, Icon } from "../../components/ui";
import { getTuitionInfo, STATUS_STYLES } from "../../components/tuition/tuitionHelpers";

export const TraineeTuition = ({ user }) => {
  const { residents } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const info = getTuitionInfo(me);
  const statusStyle = STATUS_STYLES[info.status];

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
              {info.plan === "full" ? "Paid in Full" : "Monthly Installments"}
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
            ${info.total.toLocaleString()}
          </p>
        </Card>
        <Card style={{ padding: 18, textAlign: "center" }}>
          <Icon name="check" size={20} color={T.success} />
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginTop: 8, marginBottom: 4 }}>
            Amount Paid
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: T.fontD, color: T.success }}>
            ${info.paid.toLocaleString()}
          </p>
        </Card>
        <Card style={{ padding: 18, textAlign: "center" }}>
          <Icon name="alert" size={20} color={info.remaining > 0 ? T.warn : T.success} />
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginTop: 8, marginBottom: 4 }}>
            Remaining
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: T.fontD, color: info.remaining > 0 ? T.warn : T.success }}>
            ${info.remaining.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: "13px", fontWeight: 500 }}>Payment Progress</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: T.gold }}>{info.paidPct}%</span>
        </div>
        <ProgressBar value={info.paidPct} height={8} />
      </Card>

      {/* Payment History */}
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 14 }}>
          Payment History
        </h3>
        {info.payments.length === 0 ? (
          <p style={{ color: T.textMuted, fontSize: "13px" }}>No payments recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {info.payments.map((pay) => (
              <div key={pay.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: T.radiusSm, background: T.cream }}>
                <Icon name="check" size={16} color={T.success} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500 }}>${pay.amount.toLocaleString()}</p>
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
