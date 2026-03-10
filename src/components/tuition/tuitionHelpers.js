import { T } from "../../theme";

export const getTuitionInfo = (trainee) => {
  const t = trainee.tuition || { plan: "monthly", total: 4950, payments: [] };
  const paid = t.payments.reduce((a, p) => a + p.amount, 0);
  const remaining = Math.max(0, t.total - paid);
  const paidPct = t.total ? Math.round((paid / t.total) * 100) : 0;
  const status = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  return { ...t, paid, remaining, paidPct, status };
};

export const STATUS_STYLES = {
  paid: { color: T.success, label: "Paid in Full", bg: T.successBg },
  partial: { color: T.warn, label: "Balance Due", bg: T.warnBg },
  unpaid: { color: T.danger, label: "Unpaid", bg: T.dangerBg },
};
