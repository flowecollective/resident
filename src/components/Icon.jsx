export const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const p = { fill: "none", stroke: color, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" {...p} />
        <rect x="14" y="3" width="7" height="7" rx="1.5" {...p} />
        <rect x="3" y="14" width="7" height="7" rx="1.5" {...p} />
        <rect x="14" y="14" width="7" height="7" rx="1.5" {...p} />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" {...p} />
        <line x1="16" y1="2" x2="16" y2="6" {...p} />
        <line x1="8" y1="2" x2="8" y2="6" {...p} />
        <line x1="3" y1="10" x2="21" y2="10" {...p} />
      </>
    ),
    check: (
      <>
        <path d="M9 12l2 2 4-4" {...p} strokeWidth="2" />
        <circle cx="12" cy="12" r="9" {...p} />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" {...p} />
        <polyline points="14,2 14,8 20,8" {...p} />
      </>
    ),
    message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" {...p} />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" {...p} />
        <polyline points="16,17 21,12 16,7" {...p} />
        <line x1="21" y1="12" x2="9" y2="12" {...p} />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" {...p} />
        <polygon points="22,2 15,22 11,13 2,9" {...p} />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" {...p} strokeWidth="2" />
        <line x1="5" y1="12" x2="19" y2="12" {...p} strokeWidth="2" />
      </>
    ),
    trash: (
      <>
        <polyline points="3,6 5,6 21,6" {...p} />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" {...p} />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" {...p} />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" {...p} />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" {...p} strokeWidth="2" />
        <line x1="6" y1="6" x2="18" y2="18" {...p} strokeWidth="2" />
      </>
    ),
    flower: (
      <>
        <circle cx="12" cy="12" r="3" fill={color} opacity="0.3" stroke="none" />
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="12" cy="7" rx="2.5" ry="4" {...p} strokeWidth="1.2" transform={`rotate(${r} 12 12)`} />
        ))}
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...p} />
        <circle cx="9" cy="7" r="4" {...p} />
      </>
    ),
    template: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" {...p} />
        <line x1="3" y1="9" x2="21" y2="9" {...p} />
        <line x1="9" y1="21" x2="9" y2="9" {...p} />
      </>
    ),
    back: (
      <>
        <line x1="19" y1="12" x2="5" y2="12" {...p} />
        <polyline points="12,19 5,12 12,5" {...p} />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" {...p} />
        <polyline points="7,10 12,15 17,10" {...p} />
        <line x1="12" y1="15" x2="12" y2="3" {...p} />
      </>
    ),
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...p} />
        <circle cx="12" cy="12" r="3" {...p} />
      </>
    ),
    play: (
      <>
        <circle cx="12" cy="12" r="10" {...p} />
        <polygon points="10,8 16,12 10,16" fill={color} stroke="none" />
      </>
    ),
    grip: (
      <>
        {[6, 12, 18].map((y) => (
          <g key={y}>
            <circle cx="9" cy={y} r="1.2" fill={color} stroke="none" />
            <circle cx="15" cy={y} r="1.2" fill={color} stroke="none" />
          </g>
        ))}
      </>
    ),
    zap: <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" {...p} />,
    dollar: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" {...p} />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" {...p} />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" {...p} />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" {...p} />
      </>
    ),
    archive: (
      <>
        <path d="M21 8v13H3V8" {...p} />
        <path d="M1 3h22v5H1z" {...p} />
        <path d="M10 12h4" {...p} />
      </>
    ),
    alert: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" {...p} />
        <line x1="12" y1="9" x2="12" y2="13" {...p} />
        <line x1="12" y1="17" x2="12.01" y2="17" {...p} />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" {...p} />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" {...p} />
      </>
    ),
    clipboard: (
      <>
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" {...p} />
        <rect x="8" y="2" width="8" height="4" rx="1" {...p} />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />
      </>
    ),
    brain: (
      <>
        <path d="M12 2C8.5 2 5 4.5 5 9c0 2 .5 3.5 1.5 5C8 16 9 18 9 20v1h6v-1c0-2 1-4 2.5-6 1-1.5 1.5-3 1.5-5 0-4.5-3.5-7-7-7z" {...p} />
        <path d="M9 21h6" {...p} />
        <path d="M10 22h4" {...p} />
        <path d="M8 8c2 0 3 1.5 4 1.5S14 8 16 8" {...p} />
        <path d="M8.5 12c2 0 2.5-1.5 3.5-1.5s1.5 1.5 3.5 1.5" {...p} />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="10" {...p} />
        <circle cx="12" cy="12" r="6" {...p} />
        <circle cx="12" cy="12" r="2" {...p} />
      </>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, pointerEvents: "none" }}>
      {icons[name] || null}
    </svg>
  );
};
