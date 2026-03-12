import { useState, useEffect } from "react";
import { T, TC } from "../../theme";
import { useData } from "../../context";
import { getProgress, getSkillPct, isSkillComplete, getTraineeCats } from "../../utils";
import { Card, Badge, ProgressBar, SectionTitle } from "../../components/ui";
import { supabase } from "../../lib/supabase";

export const TraineeDash = ({ user }) => {
  const { schedule, residents, masterProgram } = useData();
  const me = residents.find((r) => r.id === user.id) || residents[0];
  const progress = getProgress(me, masterProgram);
  const categories = getTraineeCats(me, masterProgram);

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("to_id", me.id)
        .eq("read", false);
      setUnread(count || 0);
    };
    loadUnread();
  }, [me.id]);

  const today = "2026-03-05";
  const todayEvents = schedule.filter(
    (e) => e.date === today && (e.assignTo === "all" || e.assignTo === me.id)
  );
  const upcoming = schedule
    .filter((e) => e.date > today && (e.assignTo === "all" || e.assignTo === me.id))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);
  const firstName = me.name.split(" ")[0];

  return (
    <div className="fade-up">
      <SectionTitle sub="Your training overview at a glance">
        Welcome back, {firstName}
      </SectionTitle>

      {/* Stat Cards */}
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>
            Skill Progress
          </p>
          <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: T.fontD, color: T.gold }}>
            {progress.pct}%
          </p>
          <p style={{ fontSize: "12px", color: T.textMuted }}>
            {progress.done} of {progress.total} complete
          </p>
        </Card>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>
            Today's Sessions
          </p>
          <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: T.fontD, color: T.charcoal }}>
            {todayEvents.length}
          </p>
          <p style={{ fontSize: "12px", color: T.textMuted }}>
            scheduled for today
          </p>
        </Card>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: T.textMuted, marginBottom: 6 }}>
            Unread Messages
          </p>
          <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: T.fontD, color: unread > 0 ? T.warn : T.charcoal }}>
            {unread}
          </p>
          <p style={{ fontSize: "12px", color: T.textMuted }}>
            messages waiting
          </p>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="r-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 14 }}>
            Today's Schedule
          </h3>
          {todayEvents.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No sessions today.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {todayEvents.map((ev) => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: T.radiusSm, background: T.cream }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                    <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.time}</p>
                  </div>
                  <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: 20 }}>
          <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 14 }}>
            Upcoming Events
          </h3>
          {upcoming.length === 0 ? (
            <p style={{ color: T.textMuted, fontSize: "13px" }}>No upcoming events.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map((ev) => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: T.radiusSm, background: T.cream }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: TC[ev.type] || T.gold }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500 }}>{ev.title}</p>
                    <p style={{ fontSize: "11px", color: T.textMuted }}>{ev.date} &middot; {ev.time}</p>
                  </div>
                  <Badge color={TC[ev.type] || T.gold}>{ev.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Skill Progress by Category */}
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontFamily: T.fontD, fontSize: "18px", fontWeight: 600, marginBottom: 16 }}>
          Skill Progress by Category
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {categories.map((cat) => {
            const total = cat.skills.length;
            const done = cat.skills.filter((sk) => isSkillComplete(me, sk.id, masterProgram)).length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={cat.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: cat.color }}>{cat.name}</span>
                  <span style={{ fontSize: "12px", color: T.textMuted }}>
                    {done}/{total} &middot; {pct}%
                  </span>
                </div>
                <ProgressBar value={pct} color={cat.color} />
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
};
