// Minimal local flag glyphs — flags are a visual accent only, language
// code/name is always shown alongside (see language-switcher.tsx).

export function FlagID({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="8" fill="#F87171" />
      <rect width="24" height="8" y="8" fill="#ffffff" />
    </svg>
  );
}

export function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#0A17A7" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="2.6" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#DC143C" strokeWidth="1" />
      <path d="M12,0 V16 M0,8 H24" stroke="#fff" strokeWidth="4.2" />
      <path d="M12,0 V16 M0,8 H24" stroke="#DC143C" strokeWidth="2.4" />
    </svg>
  );
}
