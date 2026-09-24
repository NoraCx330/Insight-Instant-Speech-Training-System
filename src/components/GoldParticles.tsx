import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
}

// 金色粒子迸发上浮：像烛光里飞起的金尘
export function GoldParticles({ count = 44, active = true }: { count?: number; active?: boolean }) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, () => ({
      x: 50 + (Math.random() - 0.5) * 55,
      y: 45 + Math.random() * 20,
      size: 1.5 + Math.random() * 3,
      delay: Math.random() * 0.7,
      duration: 1.6 + Math.random() * 1.6,
      drift: (Math.random() - 0.5) * 60,
      opacity: 0.5 + Math.random() * 0.5,
    }));
  }, [count]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-[#E8CE96]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            boxShadow: '0 0 8px rgba(232,206,150,0.9)',
          }}
          initial={{ opacity: 0, scale: 0.4, y: 0, x: 0 }}
          animate={{
            opacity: [0, p.opacity, p.opacity * 0.8, 0],
            scale: [0.4, 1, 0.8],
            y: -window.innerHeight * (0.35 + Math.random() * 0.35),
            x: p.drift,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}
