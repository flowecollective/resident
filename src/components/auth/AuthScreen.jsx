import { useState } from "react";
import { T, iSt } from "../../theme";
import { Card, FormField } from "../ui";

export const AuthScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const go = () => {
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      onLogin(
        email.toLowerCase().includes("admin")
          ? { id: "a1", name: "Flowe Educator", email, role: "admin" }
          : { id: "r1", name: "Cheyenne Rollins", email, role: "resident", cohort: "Spring 2026" }
      );
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.cream,
        padding: 20,
        backgroundImage: `radial-gradient(circle at 20% 50%, ${T.goldMuted} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${T.goldMuted} 0%, transparent 40%)`,
      }}
    >
      <div className="fade-up" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: T.fontD, fontSize: "1.6rem", fontWeight: 500, letterSpacing: "0.15em", color: T.charcoal, textDecoration: "none" }}>FLOWE</span>
          </div>
          <p style={{ color: T.gold, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase" }}>Training Portal</p>
        </div>
        <Card style={{ padding: 36 }}>
          <h3 style={{ fontFamily: T.fontD, fontSize: "22px", fontWeight: 500, textAlign: "center", marginBottom: 4 }}>Welcome back</h3>
          <p style={{ color: T.textMuted, fontSize: "13px", textAlign: "center", marginBottom: 28 }}>Sign in to continue</p>
          <FormField label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@flowecollective.com" style={iSt} onKeyDown={(e) => e.key === "Enter" && go()} />
          </FormField>
          <FormField label="Password">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" style={iSt} onKeyDown={(e) => e.key === "Enter" && go()} />
          </FormField>
          <button
            onClick={go}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: T.radiusSm,
              background: T.charcoal,
              color: T.cream,
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </Card>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: "11px", color: T.textMuted }}>
          <b>Demo:</b> any email = trainee · "admin" in email = educator
        </p>
      </div>
    </div>
  );
};
