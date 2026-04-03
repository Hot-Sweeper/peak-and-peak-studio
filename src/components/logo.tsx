export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="16" fill="url(#paint0_linear)" />
      {/* Soundwaves forming a peak/mountain */}
      <path
        d="M9 19L11 12L13 22L16 8L19 24L21 15L23 19"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_0_3px_rgba(255,255,255,0.7)]"
      />
      <defs>
        <linearGradient
          id="paint0_linear"
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF2D55" />
          <stop offset="1" stopColor="#B30B2C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
