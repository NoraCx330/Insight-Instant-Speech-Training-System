import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DISCIPLINE_META, getCard } from '../data';
import type { Discipline } from '../data';
import { useStore } from '../store/useStore';
import type { DailyScope } from '../store/useStore';
import { TarotCardBack, TarotCardFace } from '../components/TarotCard';
import { analyzeThinking } from '../engine/report';
import { ReportView } from '../components/ReportView';
import type { ThinkingReport } from '../engine/report';

const SCOPE_OPTIONS: DailyScope[] = [
  'ALL',
  'PSY',
  'ECO',
  'POL',
  'SOC',
  'PHI',
  'MPH',
  'PPH',
  'AIT',
];

export function DailyPage() {
  const { daily, ensureDaily, archive, recordActivity, dailyScope, setDailyScope, redrawDaily, redrawUsed } = useStore();
  const draw = daily ?? ensureDaily();
  const card = getCard(draw.cardId);
  const [flipped, setFlipped] = useState(false);
  const [reflection, setReflection] = useState('');
  const [report, setReport] = useState<ThinkingReport | null>(null);
  const [redrawFlash, setRedrawFlash] = useState(false);

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

  const handleScope = (scope: DailyScope) => {
    if (scope === dailyScope) return;
    setFlipped(false);
    setDailyScope(scope);
  };

  const handleRedraw = () => {
    if (redrawUsed) return;
    const ok = redrawDaily();
    if (!ok) return;
    setFlipped(false);
    setReport(null);
    setRedrawFlash(true);
    window.setTimeout(() => setRedrawFlash(false), 1800);
  };

  return (
    <div className="flex flex-col items-center pt-8 sm:pt-10">
      <p className="text-[10px] uppercase tracking-[0.42em] text-[#8F8672]">{draw.date} · DAILY INSIGHT</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-[#E8CE96]">每 日 洞 见</h1>

      {/* 抽卡范围选择 */}
      <section className="mt-7 w-full max-w-3xl">
        <p className="text-center text-[9px] uppercase tracking-[0.34em] text-[#8F8672]">DRAW SCOPE · 选择抽取范围</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {SCOPE_OPTIONS.map(scope => {
            const active = dailyScope === scope;
            const label = scope === 'ALL'
              ? '全部随机'
              : DISCIPLINE_META[scope as Discipline].zh;
            return (
              <button
                key={scope}
                type="button"
                onClick={() => handleScope(scope)}
                aria-pressed={active}
                className={`border px-3 py-1.5 text-[10px] tracking-[0.16em] transition-all duration-300 ${
                  active
                    ? 'border-[#E8CE96] bg-[#C9A45C]/10 text-[#E8CE96] shadow-[0_0_18px_rgba(201,164,92,0.25)]'
                    : 'border-[#C9A45C]/25 text-[#8F8672] hover:border-[#C9A45C]/60 hover:text-[#C9A45C]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-center text-[9px] tracking-[0.2em] text-[#5f5848]">
          当前范围：{dailyScope === 'ALL' ? 'ALL · 全部卡池' : DISCIPLINE_META[dailyScope as Discipline].en}
        </p>
      </section>

      <div className="mt-8 grid w-full items-start gap-10 md:grid-cols-[auto_1fr] md:gap-14">
        {/* 翻牌区 */}
        <div className="flex flex-col items-center gap-5">
          <motion.button
            key={draw.cardId}
            type="button"
            onClick={() => setFlipped(f => !f)}
            className="flip-3d relative aspect-[2/3] w-[min(74vw,300px)]"
            style={{ perspective: 1200 }}
            initial={{ rotateY: flipped ? 0 : 180, scale: 0.92, opacity: 0.6 }}
            animate={{ rotateY: flipped ? 0 : 180, scale: 1, opacity: 1 }}
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

          {/* 每日重抽 */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={handleRedraw}
              disabled={redrawUsed}
              className={`border px-6 py-2 text-[10px] uppercase tracking-[0.28em] transition-all duration-300 ${
                redrawUsed
                  ? 'cursor-not-allowed border-[#C9A45C]/15 text-[#5f5848]'
                  : 'border-[#C9A45C]/60 text-[#E8CE96] hover:bg-[#C9A45C]/10 hover:shadow-[0_0_18px_rgba(201,164,92,0.3)]'
              }`}
            >
              {redrawUsed ? 'REDRAW USED' : 'REDRAW · 重抽'}
            </button>
            <span className="text-[9px] tracking-[0.2em] text-[#7A6538]">
              {redrawUsed ? '今日重抽机会已用完 · 明日重置' : '每日一次重抽机会 · 本范围内'}
            </span>
          </div>
          <AnimatePresence>
            {redrawFlash && (
              <motion.p
                className="text-[10px] tracking-[0.24em] text-[#E8CE96]"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              >
                DESTINY REALIGNED · 牌已重定
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 文本区 */}
        <motion.section
          key={`panel-${draw.cardId}`}
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
              placeholder="至少 20 字：先解释概念，再联系自己的经验……"
              className="mt-3 w-full resize-y border hairline bg-black/40 p-3.5 text-sm leading-7 text-[#E9DFC8] outline-none transition-colors placeholder:text-[#5f5848] focus:border-[#C9A45C]/60"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-[#7A6538]">{reflection.trim().length} 字</span>
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
