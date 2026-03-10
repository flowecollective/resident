import { T } from "../../theme";

export const Avatar = ({ name, size = 36 }) => {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 600,
        color: T.white,
        fontFamily: T.fontD,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};
