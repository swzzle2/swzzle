'use client';

export function VitruvianMan({ color = '#00F5FF', size = 300 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="vitruvian-glow"
      style={{ filter: `drop-shadow(0 0 30px ${color}40) drop-shadow(0 0 60px ${color}20)` }}
    >
      {/* Circle */}
      <circle cx="200" cy="200" r="180" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="200" cy="200" r="160" stroke={color} strokeWidth="0.5" opacity="0.15" />

      {/* Square */}
      <rect x="60" y="40" width="280" height="320" stroke={color} strokeWidth="1" opacity="0.2" />

      {/* Head */}
      <circle cx="200" cy="95" r="25" stroke={color} strokeWidth="1.5" opacity="0.8" />

      {/* Spine */}
      <line x1="200" y1="120" x2="200" y2="250" stroke={color} strokeWidth="1.5" opacity="0.6" />

      {/* Arms spread */}
      <line x1="200" y1="150" x2="100" y2="170" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <line x1="200" y1="150" x2="300" y2="170" stroke={color} strokeWidth="1.5" opacity="0.6" />

      {/* Arms raised */}
      <line x1="200" y1="145" x2="120" y2="90" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="200" y1="145" x2="280" y2="90" stroke={color} strokeWidth="1" opacity="0.3" />

      {/* Legs */}
      <line x1="200" y1="250" x2="150" y2="360" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <line x1="200" y1="250" x2="250" y2="360" stroke={color} strokeWidth="1.5" opacity="0.6" />

      {/* Legs spread */}
      <line x1="200" y1="250" x2="120" y2="350" stroke={color} strokeWidth="1" opacity="0.3" />
      <line x1="200" y1="250" x2="280" y2="350" stroke={color} strokeWidth="1" opacity="0.3" />

      {/* Joint dots */}
      {[
        [200, 95], [200, 150], [200, 250],
        [100, 170], [300, 170],
        [150, 360], [250, 360],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill={color} opacity="0.6" />
      ))}

      {/* Energy lines */}
      <circle cx="200" cy="200" r="195" stroke={color} strokeWidth="0.5" opacity="0.1" strokeDasharray="4 8" />
    </svg>
  );
}
