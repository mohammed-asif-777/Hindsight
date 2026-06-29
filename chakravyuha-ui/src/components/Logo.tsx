"use client";

/**
 * Chakravyuha AI Logo — Ashoka-style wheel with balance scales center + AI circuit nodes.
 * Matches the brand: Indian Law | Artificial Intelligence.
 */
export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Chakravyuha AI logo"
    >
      {/* Outer glow */}
      <defs>
        <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d9e8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00d9e8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wheelGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00d9e8" />
          <stop offset="50%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#00d9e8" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <circle cx="50" cy="50" r="48" fill="url(#logoGlow)" />

      {/* Outer circle (Ashoka wheel rim) */}
      <circle cx="50" cy="50" r="42" stroke="url(#wheelGrad)" strokeWidth="1.5" fill="none" opacity="0.8" />

      {/* Spokes (24 like Ashoka Chakra) */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const x1 = 50 + 20 * Math.cos(angle);
        const y1 = 50 + 20 * Math.sin(angle);
        const x2 = 50 + 40 * Math.cos(angle);
        const y2 = 50 + 40 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#00d9e8"
            strokeWidth={i % 3 === 0 ? "1" : "0.4"}
            opacity={i % 3 === 0 ? 0.7 : 0.3}
          />
        );
      })}

      {/* AI circuit nodes on rim (8 nodes) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const cx = 50 + 44 * Math.cos(angle);
        const cy = 50 + 44 * Math.sin(angle);
        return (
          <g key={`node-${i}`}>
            <circle cx={cx} cy={cy} r="2.5" fill="#050d1a" stroke="#00d9e8" strokeWidth="1" />
            <circle cx={cx} cy={cy} r="1" fill="#00d9e8" />
          </g>
        );
      })}

      {/* Inner circle */}
      <circle cx="50" cy="50" r="18" stroke="#f5c842" strokeWidth="1" fill="rgba(5,13,26,0.9)" opacity="0.8" />

      {/* Balance scales — the center symbol */}
      {/* Pillar */}
      <line x1="50" y1="37" x2="50" y2="58" stroke="#f5c842" strokeWidth="1.5" strokeLinecap="round" />
      {/* Top triangle */}
      <polygon points="50,36 47,39 53,39" fill="#f5c842" />
      {/* Beam */}
      <line x1="38" y1="44" x2="62" y2="44" stroke="#f5c842" strokeWidth="1.2" strokeLinecap="round" />
      {/* Left pan */}
      <path d="M 35 44 Q 35 51, 41 51 Q 38 48, 38 44" stroke="#f5c842" strokeWidth="0.8" fill="none" />
      <path d="M 35 44 L 41 44 Q 41 50, 38 51 Q 35 50, 35 44 Z" fill="#f5c842" opacity="0.2" />
      {/* Right pan */}
      <path d="M 59 44 Q 59 51, 65 51 Q 62 48, 62 44" stroke="#f5c842" strokeWidth="0.8" fill="none" />
      <path d="M 59 44 L 65 44 Q 65 50, 62 51 Q 59 50, 59 44 Z" fill="#f5c842" opacity="0.2" />
      {/* Chains */}
      <line x1="38" y1="44" x2="35" y2="44" stroke="#f5c842" strokeWidth="0.6" />
      <line x1="38" y1="44" x2="41" y2="44" stroke="#f5c842" strokeWidth="0.6" />
      <line x1="62" y1="44" x2="59" y2="44" stroke="#f5c842" strokeWidth="0.6" />
      <line x1="62" y1="44" x2="65" y2="44" stroke="#f5c842" strokeWidth="0.6" />
      {/* Base */}
      <line x1="46" y1="58" x2="54" y2="58" stroke="#f5c842" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Hero-size logo with animated rings (used in HeroSection).
 */
export function HeroLogo() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outermost glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: "200px",
          height: "200px",
          border: "1px solid rgba(0, 217, 232, 0.1)",
          animation: "pulse-ring-slow 3s ease-in-out infinite",
        }}
      />
      {/* Middle ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: "155px",
          height: "155px",
          border: "1px solid rgba(245, 200, 66, 0.15)",
          animation: "pulse-ring 2.5s ease-in-out infinite 0.3s",
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: "115px",
          height: "115px",
          border: "1px solid rgba(0, 217, 232, 0.25)",
          animation: "pulse-ring 2s ease-in-out infinite 0.15s",
        }}
      />

      {/* Main logo orb */}
      <div
        className="relative flex items-center justify-center w-24 h-24 rounded-full animate-float"
        style={{
          background: "radial-gradient(circle at 35% 35%, rgba(0, 217, 232, 0.15) 0%, rgba(5, 13, 26, 0.95) 70%)",
          border: "1.5px solid rgba(0, 217, 232, 0.4)",
          boxShadow: "0 0 50px rgba(0, 217, 232, 0.3), 0 0 100px rgba(0, 217, 232, 0.1), inset 0 0 40px rgba(0, 217, 232, 0.05)",
        }}
      >
        <Logo size={72} />
      </div>
    </div>
  );
}
