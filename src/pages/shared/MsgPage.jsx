import { useState, useEffect, useRef } from "react";
import { T } from "../../theme";
import { useData } from "../../context";
import { Card, Avatar, Icon, SectionTitle } from "../../components/ui";

export const MsgPage = ({ user }) => {
  const { messages, setMessages } = useData();
  const [msg, setMsg] = useState("");
  const bottomRef = useRef(null);

  const isAdmin = user.role === "admin";
  const partnerId = isAdmin ? "r1" : "a1";
  const partnerName = isAdmin ? "Cheyenne Rollins" : "Flowe Educator";

  const thread = messages.filter(
    (m) =>
      (m.from === user.id && m.to === partnerId) ||
      (m.from === partnerId && m.to === user.id)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!msg.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: user.id,
        to: partnerId,
        text: msg.trim(),
        time: new Date().toISOString(),
        read: false,
      },
    ]);
    setMsg("");
  };

  return (
    <div className="fade-up">
      <SectionTitle sub={`Conversation with ${partnerName}`}>
        Messages
      </SectionTitle>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Thread */}
        <div
          style={{
            height: 420,
            overflowY: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: T.cream,
          }}
        >
          {thread.length === 0 && (
            <p style={{ color: T.textMuted, fontSize: "13px", textAlign: "center", marginTop: 40 }}>
              No messages yet. Start the conversation!
            </p>
          )}
          {thread.map((m) => {
            const isSelf = m.from === user.id;
            const isEducator = m.from === "a1";
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
                  <p style={{ fontSize: "10px", color: T.textMuted, marginTop: 4, textAlign: "right" }}>
                    {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
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
            placeholder="Type a message..."
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
            style={{
              width: 40,
              height: 40,
              borderRadius: T.radiusSm,
              background: isAdmin ? T.educator : T.charcoal,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="send" size={18} color={T.white} />
          </button>
        </div>
      </Card>
    </div>
  );
};
