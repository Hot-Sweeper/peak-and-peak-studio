export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Peak Studio logo"
      role="img"
    >
      <rect width="32" height="32" rx="8" fill="#000000" />
      {/* EQ bars — red · white · red */}
      <rect x="5"  y="14" width="5" height="14" rx="2.5" fill="#FF2D55" />
      <rect x="14" y="6"  width="5" height="22" rx="2.5" fill="#FF2D55" />
      <rect x="23" y="10" width="5" height="18" rx="2.5" fill="#FF2D55" />
    </svg>
  );
}

export function LogoWide({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Logo />
      <span className="font-black tracking-tight text-white text-lg leading-none">
        PEAK <span className="text-accent">STUDIO</span>
      </span>
    </span>
  );
}
