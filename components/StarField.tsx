'use client';

export function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Nebula gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-neon-cyan/[0.02] rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/6 w-[500px] h-[500px] bg-neon-purple/[0.03] rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-neon-red/[0.02] rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '3s' }} />

      {/* Stars via CSS */}
      <div className="absolute inset-0">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[1px] h-[1px] bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.1,
              animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              width: `${Math.random() > 0.8 ? 2 : 1}px`,
              height: `${Math.random() > 0.8 ? 2 : 1}px`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
