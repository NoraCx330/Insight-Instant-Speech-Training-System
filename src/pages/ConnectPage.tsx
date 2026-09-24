import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_CARDS, DISCIPLINE_META, type Card } from '../data';
import { TarotCardFace } from '../components/TarotCard';
import { analyzeThinking } from '../engine/report';
import { ReportView } from '../components/ReportView';
import { useStore } from '../store/useStore';
import type { ThinkingReport } from '../engine/report';

function pickTwo(exclude?: [number, number]): [Card, Card] {
  const pool = [...ALL_CARDS];
  let a: Card;
  let b: Card;
  do {
    a = pool[Math.floor(Math.random() * pool.length)];
  } while (exclude && a.id === exclude[0]);
  let tries = 0;
  do {
    b = pool[Math.floor(Math.random() * pool.length)];
    tries++;
  } while ((b.id === a.id || (exclude && b.id === exclude[1])) && tries < 20);
  return [a, b];
}

export function ConnectPage() {
  const { recordActivity } = useStore();
  const [pair, setPair] = useState<[Card, Card] | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [text, setText] = useState('');
  const [report, setReport] = useState<ThinkingReport | null>(null);
  const [done, setDone] = useState(false);

  const draw = useCallback(() => {
    setDrawing(true);
    setReport(null);
    setText('');
    setDone(false);
    window.setTimeout(() => {
      setPair(pickTwo(pair ? [pair[0].id, pair[1].id] : undefined));
      setDrawing(false);
    }, 900);
  }, [pair]);

  const keywords = useMemo(
    () => pair ? [...pair[0].keywords, ...pair[1].keywords] : [],
    [pair],
  );

  const submit = () => {
    if (!pair || text.trim().length < 40) return;
    const r = analyzeThinking({ text, keywords, targetSeconds: 240, kind: 'write' });
    setReport(r);
    if (!done) {
      recordActivity('CONNECT_TWO', [pair[0].id, pair[1].id], r.total);
      setDone(true);
    }
  };

  return (
    <div className="flex flex-col items-center pt-8 sm:pt-10">
      <p className="text-[10px] uppercase tracking-[0.42em] text-[#8F8672]">CONNECT TWO · CROSS-DISCIPLINE RITUAL</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-[#E8CE96]">双 卡 联 结</h1>
      <p className="mt-3 max-w-md text-center text-xs leading-6 text-[#8F8672]">
        两张来自不同学科的概念牌。请找出它们之间的隐藏通道：类比、因果、共同结构，或彼此修正。
      </p>

      <button type="button" onClick={draw} disabled={drawing} className="btn-gold mt-7 px-9 py-3 text-[10px] uppercase">
        {pair ? 'DRAW AGAIN' : 'DRAW TWO CARDS'}
      </button>

      <motion.div
        className="mt-9 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8"
        animate={drawing ? { opacity: 0.3, x: [0, -14, 14, 0] } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.9 }}
      >
        {pair ? pair.map((c, i) => (
          <motion.div
            key={`${c.id}-${i}`}
            initial={{ opacity: 0, y: 26, rotateY: 90 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: i * 0.18, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <TarotCardFace card={c} size="lg" className="animate-floaty" />
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#7A6538]">{DISCIPLINE_META[c.discipline].en}</span>
          </motion.div>
        )) : (
          <div className="flex gap-8 opacity-50">
            <div className="aspect-[2/3] w-[min(38vw,220px)] border border-dashed border-[#C9A45C]/30" />
            <div className="aspect-[2/3] w-[min(38vw,220px)] border border-dashed border-[#C9A45C]/30" />
          </div>
        )}
      </motion.div>

      {pair && (
        <motion.section
          className="panel mt-9 w-full p-5 sm:p-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A45C]">THE BRIDGE · 建造联结</p>
          <p className="mt-3 text-sm leading-7 text-[#E9DFC8]">
            <span className="text-[#E8CE96]">{pair[0].titleZh}</span>
            <span className="mx-3 text-[#7A6538]">⟷</span>
            <span className="text-[#E8CE96]">{pair[1].titleZh}</span>
          </p>
          <p className="mt-2 text-xs leading-6 text-[#8F8672]">
            引导：它们共享什么结构？一个概念能否解释另一个的成因或失效？举一个同时包含两者的现实场景。
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={7}
            placeholder="至少 100 字。例：如果把 X 看作一个 Y 系统，那么……"
            className="mt-4 w-full resize-y border hairline bg-black/40 p-3.5 text-sm leading-7 text-[#E9DFC8] outline-none placeholder:text-[#5f5848] focus:border-[#C9A45C]/60"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-[#7A6538]">{(text.match(/[\u4e00-\u9fa5]/g) ?? []).length} 字 · 完成本组 +40 XP</span>
            <button type="button" onClick={submit} disabled={done || text.trim().length < 40} className="btn-gold px-7 py-2.5 text-[10px] uppercase">
              {done ? 'RECORDED' : 'FORGE THE LINK'}
            </button>
          </div>
        </motion.section>
      )}

      {report && <ReportView report={report} />}
    </div>
  );
}
