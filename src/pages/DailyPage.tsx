import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getCard } from '../data';
import { useStore } from '../store/useStore';
import { TarotCardBack, TarotCardFace } from '../components/TarotCard';
import { analyzeThinking } from '../engine/report';
import { ReportView } from '../components/ReportView';
import type { ThinkingReport } from '../engine/report';

export function DailyPage() {
  const { daily, ensureDaily, archive, recordActivity } = useStore();
  const draw = daily ?? ensureDaily();
  const card = getCard(draw.cardId);
  const [flipped, setFlipped] = useState(false);
  const [reflection, setReflection] = useState('');
  const [report, setReport] = useState<ThinkingReport | null>(null);

  const alreadyDone = useMemo(
    () => archive.some(r => r.date === draw.date && r.kind === 'DAILY_INSIGHT'),
    [archive, draw.date],
  );
  const existingReport = useMemo(
    () => archive.find(r => r.date === draw.date && r.kind === 'DAILY_INSIGHT' && r.totalScore !== undefined),
    [archive, draw.date],
  );

  if (!card) return null;

  const submit = () => {
    if (!reflection.trim()) return;
    const r = analyzeThinking({
      text: reflection,
      keywords: card.keywords,
      targetSeconds: 180,
      kind: 'write',
    });
    setReport(r);
    if (!alreadyDone) recordActivity('DAILY_INSIGHT', [card.id], r.total);
  };

  return (
    <div className="flex flex-col items-center pt-8 sm:pt-10">
      <p className="text-[10px] uppercase tracking-[0.42em] text-[#8F8672]">{draw.date} · DAILY INSIGHT</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-[#E8CE96]">每 日 洞 见</h1>

      <div className="mt-8 grid w-full items-start gap-10 md:grid-cols-[auto_1fr] md:gap-14">
        {/* 翻牌区 */}
        <div className="flex flex-col items-center gap-5">
          <motion.button
            type="button"
            onClick={() => setFlipped(f => !f)}
            className="flip-3d relative aspect-[2/3] w-[min(74vw,300px)]"
            style={{ perspective: 1200 }}
            animate={{ rotateY: flipped ? 0 : 180 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            aria-label="翻转卡牌"
          >
            <div className="flip-face absolute inset-0">
              <TarotCardFace card={card} size="lg" />
            </div>
            <div className="flip-face flip-back absolute inset-0">
              <TarotCardBack size="lg" />
            </div>
          </motion.button>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#7A6538]">TAP TO REVEAL / CONCEAL</span>
        </div>

        {/* 文本区 */}
        <motion.section
          className="panel flex w-full flex-col gap-5 p-5 sm:p-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A45C]">ESSENCE · 要义</p>
            <p className="mt-3 text-sm leading-7 text-[#E9DFC8]">{card.essence}</p>
          </div>
          <div className="border-t hairline pt-5">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#C9A45C]">TODAY&rsquo;S QUESTION · 今日之问</p>
            <p className="mt-3 text-sm font-medium leading-7 text-[#E8CE96]">{card.thinkPrompt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {card.keywords.map((k: string) => (
              <span key={k} className="border border-[#C9A45C]/30 px-2.5 py-1 text-[10px] tracking-[0.18em] text-[#C9A45C]">{k}</span>
            ))}
          </div>
          <div>
            <label htmlFor="daily-reflection" className="text-[10px] uppercase tracking-[0.32em] text-[#C9A45C]">
              YOUR REFLECTION · 写下你的回答
            </label>
            <textarea
              id="daily-reflection"
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              rows={6}
              placeholder="至少 80 字：先解释概念，再联系自己的经验……"
              className="mt-3 w-full resize-y border hairline bg-black/40 p-3.5 text-sm leading-7 text-[#E9DFC8] outline-none transition-colors placeholder:text-[#5f5848] focus:border-[#C9A45C]/60"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-[#7A6538]">{(reflection.match(/[\u4e00-\u9fa5]/g) ?? []).length} 字</span>
              <button
                type="button"
                onClick={submit}
                disabled={alreadyDone || reflection.trim().length < 20}
                className="btn-gold px-7 py-2.5 text-[10px] uppercase"
              >
                {alreadyDone ? 'RECORDED' : 'REVEAL INSIGHT'}
              </button>
            </div>
            {alreadyDone && !report && (
              <p className="mt-3 text-[11px] text-[#7A6538]">
                今日之问已记录{existingReport ? ` · 当时评级总分 ${existingReport.totalScore}` : ''}（次日自动更新）。
              </p>
            )}
          </div>
        </motion.section>
      </div>

      {report && <ReportView report={report} />}
    </div>
  );
}
