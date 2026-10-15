export function Crown({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 34"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M5 28 L3 8 L15 17 L24 4 L33 17 L45 8 L43 28 Z" />
      <path d="M7 31 H41" />
    </svg>
  );
}

export function Wordmark({
  className = "",
  size = "text-4xl",
  crown = true,
}: {
  className?: string;
  size?: string;
  crown?: boolean;
}) {
  return (
    <span className={`inline-flex items-end gap-1 leading-none ${className}`}>
      {crown ? <Crown className="mb-[0.55em] h-[0.5em] w-auto -mr-1 self-start mt-[0.1em]" /> : null}
      <span className={`script ${size}`}>Clars</span>
    </span>
  );
}

export function Instagram({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
    </svg>
  );
}
