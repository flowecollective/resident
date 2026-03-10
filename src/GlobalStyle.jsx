import { T } from "./theme";

export const GlobalStyle = () => {
  const css = [
    "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600;700&display=swap');",
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}",
    "body{font-family:" + T.font + ";background:" + T.cream + ";color:" + T.text + ";-webkit-font-smoothing:antialiased}",
    "::selection{background:" + T.goldLight + ";color:" + T.charcoal + "}",
    "input,textarea,select,button{font-family:inherit}",
    "@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}",
    "@keyframes fadeIn{from{opacity:0}to{opacity:1}}",
    "@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}",
    ".fade-up{animation:fadeUp .5s ease both}",
    ".fade-in{animation:fadeIn .4s ease both}",
    ".slide-in{animation:slideIn .4s ease both}",
    ".st1{animation-delay:.05s}.st2{animation-delay:.1s}.st3{animation-delay:.15s}.st4{animation-delay:.2s}.st5{animation-delay:.25s}",
    "::-webkit-scrollbar{width:6px}",
    "::-webkit-scrollbar-track{background:transparent}",
    "::-webkit-scrollbar-thumb{background:" + T.goldLight + ";border-radius:3px}",
    // Responsive: mobile breakpoint at 768px
    "@media(max-width:768px){",
    "  .sidebar-root{transform:translateX(-100%)}",
    "  .sidebar-root[style*='left: 0']{transform:translateX(0) !important}",
    "  .sidebar-close{display:flex !important}",
    "  .mobile-header{display:flex !important}",
    "  .app-main{margin-left:0 !important}",
    "  .app-main main{padding:16px !important}",
    "  .r-grid{grid-template-columns:1fr !important}",
    "  .r-grid-2{grid-template-columns:1fr !important}",
    "}",
    ".sop-content ol,[contenteditable] ol{padding-left:18px;margin:4px 0}.sop-content ul,[contenteditable] ul{padding-left:16px;margin:4px 0}",
    ".sop-content li,[contenteditable] li{margin-bottom:3px}.sop-content p,[contenteditable] p{margin-bottom:6px}",
    ".sop-content h1,[contenteditable] h1{font-size:18px;font-weight:700;margin:12px 0 6px}",
    ".sop-content h2,[contenteditable] h2{font-size:15px;font-weight:600;margin:10px 0 4px}",
    ".sop-content h3,[contenteditable] h3{font-size:13px;font-weight:600;margin:8px 0 4px}",
    ".sop-content h4,[contenteditable] h4{font-size:12px;font-weight:600;margin:6px 0 3px}",
    ".sop-content b,.sop-content strong,[contenteditable] b,[contenteditable] strong{font-weight:600}",
    "details summary::-webkit-details-marker{display:none}",
    "details summary::marker{display:none;content:''}",
    "details[open] summary .arrow-down{transform:rotate(180deg)}",
  ].join("\n");
  return <style>{css}</style>;
};
