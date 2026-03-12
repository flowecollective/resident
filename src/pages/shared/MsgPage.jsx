import { useState, useEffect, useRef } from "react";
import { T } from "../../theme";
import { useData } from "../../context";
import { Card, Icon, SectionTitle } from "../../components/ui";
import { supabase } from "../../lib/supabase";

export const MsgPage = ({ user }) => {
  const { residents } = useData();
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const isAdmin = user.role === "admin";

  // Set default active chat
  useEffect(() => {
    if (isAdmin && residents.length > 0 && !activeChat) {
      setActiveChat(residents[0].id);
    } else if (!isAdmin && !activeChat) {
      setActiveChat("a1");
    }
  }, [isAdmin, residents, activeChat]);

  // Load messages from Supabase
  useEffect(() => {
    if (!activeChat) return;

    const partnerId = activeChat;
    const myId = user.id;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(from_id.eq.${myId},to_id.eq.${partnerId}),and(from_id.eq.${partnerId},to_id.eq.${myId})`
        )
        .order("time", { ascending: true });

      if (data) setMessages(data);
    };

    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${myId}-${partnerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new;
          const relevant =
            (m.from_id === myId && m.to_id === partnerId) ||
            (m.from_id === partnerId && m.to_id === myId);
          if (relevant) {
            setMessages((prev) => [...prev, m]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeChat, user.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (!activeChat || messages.length === 0) return;
    const unread = messages.filter(
      (m) => m.to_id === user.id && !m.read
    );
    if (unread.length > 0) {
      supabase
        .from("messages")
        .update({ read: true })
        .in("id", unread.map((m) => m.id))
        .then();
    }
  }, [messages, activeChat, user.id]);

  const send = async () => {
    if (!msg.trim() || !activeChat || sending) return;
    setSending(true);

    const newMsg = {
      from_id: user.id,
      to_id: activeChat,
      text: msg.trim(),
      channel: "portal",
      read: false,
    };

    const { error } = await supabase.from("messages").insert(newMsg);

    if (!error) {
      // If admin is replying, also send SMS
      if (isAdmin) {
        fetch("/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to_user_id: activeChat,
            text: msg.trim(),
          }),
        }).catch(() => {});
      }
      setMsg("");
    }

    setSending(false);
  };

  const getPartnerName = (id) => {
    if (id === "a1") return "Flowe Educator";
    const r = residents.find((r) => r.id === id);
    return r?.name || id;
  };

  // Get unread counts per resident (admin only)
  const [unreadCounts, setUnreadCounts] = useState({});
  useEffect(() => {
    if (!isAdmin) return;

    const loadUnread = async () => {
      const { data } = await supabase
        .from("messages")
        .select("from_id")
        .eq("to_id", "a1")
        .eq("read", false);

      if (data) {
        const counts = {};
        data.forEach((m) => {
          counts[m.from_id] = (counts[m.from_id] || 0) + 1;
        });
        setUnreadCounts(counts);
      }
    };

    loadUnread();
  }, [isAdmin, messages]);

  const partnerName = activeChat ? getPartnerName(activeChat) : "";

  return (
    <div className="fade-up">
      <SectionTitle sub={isAdmin ? "Resident conversations" : `Conversation with ${partnerName}`}>
        Messages
      </SectionTitle>

      <div style={{ display: "flex", gap: 16 }}>
        {/* Admin conversation list */}
        {isAdmin && (
          <Card style={{ width: 220, padding: 0, flexShrink: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.lightLine}` }}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", color: T.textMuted, textTransform: "uppercase" }}>
                Residents
              </p>
            </div>
            <div style={{ maxHeight: 440, overflowY: "auto" }}>
              {residents.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setActiveChat(r.id)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: activeChat === r.id ? T.cream : "transparent",
                    borderLeft: activeChat === r.id ? `3px solid ${T.educator}` : "3px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.15s",
                  }}
                >
                  <p style={{ fontSize: "13px", fontWeight: activeChat === r.id ? 600 : 400 }}>
                    {r.name}
                  </p>
                  {unreadCounts[r.id] > 0 && (
                    <span
                      style={{
                        background: T.educator,
                        color: T.white,
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 10,
                        minWidth: 18,
                        textAlign: "center",
                      }}
                    >
                      {unreadCounts[r.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Chat thread */}
        <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${T.lightLine}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <p style={{ fontSize: "14px", fontWeight: 600 }}>{partnerName}</p>
            {isAdmin && activeChat && (
              <span style={{ fontSize: "10px", color: T.textMuted, background: T.cream, padding: "2px 8px", borderRadius: 8 }}>
                SMS + Portal
              </span>
            )}
          </div>

          {/* Thread */}
          <div
            style={{
              height: 380,
              overflowY: "auto",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: T.cream,
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: T.textMuted, fontSize: "13px", textAlign: "center", marginTop: 40 }}>
                No messages yet. Start the conversation!
              </p>
            )}
            {messages.map((m) => {
              const isSelf = m.from_id === user.id;
              const isEducator = m.from_id === "a1";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: isSelf ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: T.radiusSm,
                      background: isSelf ? T.charcoalMuted : T.white,
                      borderLeft: !isSelf && isEducator ? `3px solid ${T.educator}` : undefined,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    {!isSelf && isEducator && (
                      <p
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "0.8px",
                          color: T.educator,
                          marginBottom: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        EDUCATOR
                      </p>
                    )}
                    <p style={{ fontSize: "13px", lineHeight: 1.5 }}>{m.text}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
                      {m.channel === "sms" && (
                        <span style={{ fontSize: "9px", color: T.textMuted, fontStyle: "italic" }}>
                          via SMS
                        </span>
                      )}
                      <span style={{ fontSize: "10px", color: T.textMuted }}>
                        {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 20px",
              borderTop: `1px solid ${T.lightLine}`,
              background: T.white,
            }}
          >
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={isAdmin ? "Reply (also sent as SMS)..." : "Type a message..."}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: T.radiusSm,
                border: `1.5px solid ${T.creamDark}`,
                background: T.cream,
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={sending}
              style={{
                width: 40,
                height: 40,
                borderRadius: T.radiusSm,
                background: isAdmin ? T.educator : T.charcoal,
                border: "none",
                cursor: sending ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: sending ? 0.6 : 1,
              }}
            >
              <Icon name="send" size={18} color={T.white} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
