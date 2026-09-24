import { useState } from 'react';
import { motion } from 'framer-motion';
import { DrawCeremony, type DrawPhase } from '../components/DrawCeremony';
import { getCard, ALL_CARDS } from '../data';
import { useStore } from '../store/useStore';

interface Portal {
  hash: string;
  index: string;
  zh: string;
  en: string;
  desc: string;
}

const PORTALS: Portal[] = [
  { hash: '#/daily', index: 'I', zh: '每日洞见', en: 'DAILY INSIGHT', desc: '一张牌 · 一个问题 · 一次凝视' },
  { hash: '#/connect', index: 'II', zh: '双卡联结', en: 'CONNECT TWO', desc: '让两个遥远概念彼此通电' },
  { hash: '#/lab', index: 'III', zh: '思维实验室', en: 'THINKING LAB', desc: '90 秒即兴表达挑战' },
  { hash: '#/deep', index: 'IV', zh: '深度思考', en: 'DEEP THINK', desc: '研究 · 重置 · 表达的完整仪式' },
  { hash: '#/topics', index: 'V', zh: '热词推演', en: 'HOT TOPICS', desc: '用概念解剖正在发生的事' },
  { hash: '#/archive', index: 'VI', zh: '我的档案', en: 'ARCHIVE', desc: '记录、评级与思维轨迹' },
];

export function HomePage() {
  const { daily, ensureDaily } = useStore();
  const [phase, setPhase] = useState<DrawPhase>('idle');

  const beginCeremony = () => {
    const draw = ensureDaily();
    setPhase('floating');
    window.setTimeout(() => setPhase('shuffle'), 700);
    window.setTimeout(() => setPhase('gather'), 1900);
    window.setTimeout(() => setPhase('reveal'), 2300);
    // 揭示动画与粒子结束后进入每日页
    window.setTimeout(() => {
      window.location.hash = '#/daily';
      window.setTimeout(() => setPhase('idle'), 600);
    }, 4600);
  };

  const card = getCard(daily?.cardId ?? 1) ?? ALL_CARDS[0];

  return (
    <div className="flex flex-col items-center">
      {phase === 'idle' ? (
        <motion.div
          className="flex w-full flex-col items-center pt-8 sm:pt-12"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#8F8672]">A SOLO TRAINING RITUAL</p>
          <h1 className="mt-4 text-center font-display text-4xl font-semibold leading-tight text-[#E8CE96] sm:text-5xl">
            THE INSIGHT DECK
          </h1>
          <p className="mt-3 text-center text-sm tracking-[0.5em] text-[#C9A45C]">洞 见 牌</p>
          <p className="mt-5 max-w-md text-center text-sm leading-relaxed text-[#8F8672]">
            跨学科知识卡牌 × 即兴思维训练 × 口头表达训练
            <br />
            每天抽一张牌，向自己提出一个更好的问题。
          </p>

          <button
            type="button"
            onClick={beginCeremony}
            className="btn-gold mt-10 px-10 py-3.5 text-[11px] uppercase"
          >
            DRAW TODAY&rsquo;S CARD
          </button>
          {daily && (
            <a href="#/daily" className="mt-4 text-[10px] uppercase tracking-[0.3em] text-[#7A6538] transition-colors hover:text-[#C9A45C]">
              今日之牌已揭示 · 前往查看
            </a>
          )}

          {/* 六大入口 */}
          <div className="mt-14 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {PORTALS.map((p, i) => (
              <motion.a
                key={p.hash}
                href={p.hash}
                className="panel group relative flex flex-col gap-2 p-4 transition-all duration-500 hover:border-[#C9A45C]/55 hover:shadow-[0_0_30px_rgba(201,164,92,0.12)] sm:p-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.6 }}
              >
                <span className="font-display text-lg text-[#7A6538] transition-colors duration-500 group-hover:text-[#E8CE96]">{p.index}</span>
                <span className="text-sm font-semibold text-[#E9DFC8]">{p.zh}</span>
                <span className="text-[8.5px] uppercase tracking-[0.24em] text-[#8F8672]">{p.en}</span>
                <span className="mt-1 text-[11px] leading-relaxed text-[#8F8672]">{p.desc}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="pt-6">
          <p className="mb-2 text-center text-[10px] uppercase tracking-[0.42em] text-[#8F8672]">
            {phase === 'reveal' ? 'THE CARD REVEALS ITSELF' : 'THE DECK IS STIRRING'}
          </p>
          <DrawCeremony phase={phase} card={card} />
        </div>
      )}
    </div>
  );
}
