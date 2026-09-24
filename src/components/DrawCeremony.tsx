import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ALL_CARDS, type Card } from '../data';
import { TarotCardBack, TarotCardFace } from './TarotCard';
import { GoldParticles } from './GoldParticles';

type Phase = 'idle' | 'floating' | 'shuffle' | 'gather' | 'reveal';

interface DrawCeremonyProps {
  phase: Phase;
  card: Card;
  onRevealed?: () => void;
}

// 电影感抽卡序列：牌堆漂浮 → 洗牌飞掠 → 归位 → 单牌翻转放大 → 粒子
export function DrawCeremony({ phase, card, onRevealed }: DrawCeremonyProps) {
  const [showParticles, setShowParticles] = useState(false);
  const deck = ALL_CARDS.slice(0, 7);

  useEffect(() => {
    if (phase === 'reveal') {
      setShowParticles(true);
      const t = setTimeout(() => {
        setShowParticles(false);
        onRevealed?.();
      }, 2400);
      return () => clearTimeout(t);
    }
  }, [phase, onRevealed]);

  return (
    <div className="relative flex h-[min(70vh,460px)] w-full items-center justify-center" aria-live="polite">
      <AnimatePresence mode="wait">
        {phase === 'floating' && (
          <motion.div
            key="stack"
            className="relative"
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="animate-floaty relative">
              {deck.map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  initial={{ x: 0, y: 0, rotate: 0 }}
                  animate={{ x: (i - 3) * 6, y: (i - 3) * 4, rotate: (i - 3) * 2 }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                >
                  <TarotCardBack size="lg" />
                </motion.div>
              ))}
              <TarotCardBack size="lg" className="relative" />
            </div>
          </motion.div>
        )}

        {phase === 'shuffle' && (
          <div key="shuffle" className="relative h-full w-full overflow-hidden">
            {deck.map((c, i) => (
              <motion.div
                key={c.id}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ x: (i - 3) * 10, y: 0, rotate: (i - 3) * 3, opacity: 1 }}
                animate={{
                  x: [
                    (i - 3) * 10,
                    i % 2 === 0 ? -340 : 340,
                    i % 2 === 0 ? 260 : -260,
                    0,
                  ],
                  y: [-0, -30 - Math.random() * 40, -10, 0],
                  rotate: [0, i % 2 === 0 ? -16 : 16, i % 2 === 0 ? 12 : -12, 0],
                  opacity: [1, 0.95, 0.95, 1],
                }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <TarotCardBack size="lg" />
              </motion.div>
            ))}
          </div>
        )}

        {phase === 'gather' && (
          <motion.div
            key="gather"
            initial={{ opacity: 0.9, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <TarotCardBack size="lg" className="gold-sheen" />
          </motion.div>
        )}

        {phase === 'reveal' && (
          <motion.div
            key="reveal"
            className="flip-3d relative"
            style={{ perspective: 1200 }}
            initial={{ rotateY: 180, scale: 0.85, opacity: 0 }}
            animate={{ rotateY: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            <TarotCardFace card={card} size="lg" className="gold-sheen" />
          </motion.div>
        )}
      </AnimatePresence>

      <GoldParticles active={showParticles} />
    </div>
  );
}

export type { Phase as DrawPhase };
