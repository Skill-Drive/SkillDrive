interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function Icon({ name, size = 18, stroke = 1.6, style, className }: IconProps) {
  const p = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
    className,
  };
  switch (name) {
    case 'search':
      return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'pin':
      return <svg {...p}><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'star':
      return <svg {...p} fill="currentColor" stroke="none"><path d="M12 2.5l2.9 6.1 6.6.6-5 4.6 1.5 6.6L12 17l-6 3.4 1.5-6.6-5-4.6 6.6-.6z"/></svg>;
    case 'shield':
      return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'car':
      return <svg {...p}><path d="M3 14l2-6h14l2 6"/><rect x="3" y="14" width="18" height="5" rx="1.5"/><circle cx="7.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></svg>;
    case 'calendar':
      return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'clock':
      return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'check':
      return <svg {...p}><path d="M4 12l5 5L20 6"/></svg>;
    case 'chev-right':
      return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chev-left':
      return <svg {...p}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'chev-down':
      return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case 'arrow':
      return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'user':
      return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>;
    case 'close':
      return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'filter':
      return <svg {...p}><path d="M4 5h16M7 12h10M10 19h4"/></svg>;
    case 'settings':
      return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2.1-1.2l-.4-2.5h-4l-.4 2.5a7 7 0 00-2.1 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002.1 1.2l.4 2.5h4l.4-2.5a7 7 0 002.1-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>;
    case 'spark':
      return <svg {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/></svg>;
    case 'lock':
      return <svg {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>;
    case 'phone':
      return <svg {...p}><path d="M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a2 2 0 01-2 2A17 17 0 013 6a2 2 0 012-2z"/></svg>;
    case 'lang':
      return <svg {...p}><path d="M4 5h10M9 3v2M4 5c0 6 4 9 8 9M14 14L9 5M14 21l5-10 5 10M16 18h6"/></svg>;
    case 'play':
      return <svg {...p}><path d="M7 5l12 7-12 7z" fill="currentColor"/></svg>;
    case 'wallet':
      return <svg {...p}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M17 15h2"/></svg>;
    case 'trend':
      return <svg {...p}><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h7v7"/></svg>;
    case 'graduation':
      return <svg {...p}><path d="M2 9l10-4 10 4-10 4-10-4z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/><path d="M22 9v6"/></svg>;
    default:
      return null;
  }
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="var(--ink)"/>
      <path d="M10 26c0-6 4-9 9-9h4" stroke="var(--cobalt)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M19 13l4 4-4 4" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="28" cy="28" r="3" fill="var(--signal)"/>
    </svg>
  );
}
