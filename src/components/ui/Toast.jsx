import { T } from "../../theme";
import { Icon } from "./Icon";

export const Toast = ({ message, visible }) => (
  <div
    style={{
      position: "fixed",
      bottom: visible ? 32 : -60,
      left: "50%",
      transform: "translateX(-50%)",
      background: T.charcoal,
      color: T.cream,
      padding: "12px 24px",
      borderRadius: 24,
      fontSize: "13px",
      fontWeight: 500,
      boxShadow: T.shadowLg,
      transition: "bottom .3s ease",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    <Icon name="check" size={16} color={T.gold} /> {message}
  </div>
);
