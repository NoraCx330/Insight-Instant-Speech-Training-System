import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_CARDS, type Card } from '../data';
import { TarotCardFace } from '../components/TarotCard';
import { GoldParticles } from '../components/GoldParticles';
import { useCountdown, formatTime } from '../engine/useCountdown';
import { analyzeThinking } from '../engine/report';
import { ReportView } from '../components/ReportView';
import { createSpeechSession, isSpeechSupported } from '../engine/speech';
import { useStore } from '../store/useStore';
import type { ThinkingReport } from '../engine/report';

type PhaseName = 'ready' | 'research' | 'reset' | 'express' | 'done';

const PHASES: Record<Exclude<PhaseName, 'ready' | 'done'>, { seconds: number; zh: string; en: string; hint: string }> = {
  research: { seconds: 300, zh: '研究', en: 'RESEARCH · 5:00', hint: '围绕卡牌写下：定义 → 成因或机制 → 一个真实案例 → 你的疑问。' },
  reset: { seconds: 30, zh: '重置', en: 'RESET · 0:30', hint: '合上笔记，深呼吸。让信息沉淀，不要准备逐字稿。' },
  express: { seconds: 180, zh: '表达', en: 'EXPRESS · 3:00', hint: '脱稿讲 3 分钟：它是什么、为什么成立、对谁重要、你的判断。' },
};

export function DeepThinkPage() {
  const { recordActivity, markCardLit } = useStore();
  const [card, setCard] = useState<Card | null>(null);
  const [phase, setPhase] = useState<PhaseName>('ready');
  const [notes, setNotes] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [particles, setParticles] = useState(false);
  const [report, setReport] = useState<ThinkingReport | null>(null);
  const speechSupported = useMemo(() => isSpeechSupported(), []);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const session = useMemo(() => createSpeechSession(), []);
  useEffect(() => () => session.stop(), [session]);

  const goReset = () => {
    session.stop();
    setPhase('reset');
    timer.reset(PHASES.reset.seconds);
    timer.start();
  };

  const goExpress = () => {
    setSpeechText('');
    setPhase('express');
    timer.reset(PHASES.express.seconds);
    timer.start();
    session.start(t => setSpeechText(t));
  };

  const finishAll = () => {
    session.stop();
    setPhase('done');
    setParticles(true);
    window.setTimeout(() => setParticles(false), 2400);
  };

  const timer = useCountdown(PHASES.research.seconds, () => {
    const current = phaseRef.current;
    if (current === 'research') goReset();
    else if (current === 'reset') goExpress();
    else if (current === 'express') finishAll();
  });

  const begin = () => {
    setReport(null);
    setNotes('');
    setSpeechText('');
    const c = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
    setCard(c);
    setPhase('research');
    timer.reset(PHASES.research.seconds);
    timer.start();
  };

  const submit = () => {
    if (!card) return;
    const combined = `${notes}\n${speechText}`;
    if (combined.trim().length < 40) return;
    const r = analyzeThinking({
      text: combined,
      keywords: card.keywords,
      targetSeconds: PHASES.express.seconds,
      kind: 'speak',
    });
    setReport(r);
    recordActivity('DEEP_THINK', [card.id], r.total);
    // 完成 3 分钟演讲模拟并进入反馈 → 点亮该卡牌的深度成就
    markCardLit(card.id);
  };

  const currentMeta = phase === 'research' || phase === 'reset' || phase === 'express' ? PHASES[phase] : null;
  const totalPhaseSeconds = currentMeta ? currentMeta.seconds : 1;
  const phaseProgress = 1 - timer.remaining / totalPhaseSeconds;

  return (
    <div className="flex flex-col items-center pt-8 sm:pt-10">
      <p className="text-[10px] uppercase tracking-[0.42em] text-[#8F8672]">DEEP THINK · THE FULL RITUAL</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-[#E8CE96]">深 度 思 考</h1>

      {/* 阶段指示 */}
      <div className="mt-7 flex items-center gap-2 sm:gap-4">
        {(['research', 'reset', 'express'] as const).map((p, i) => {
          const order = { research: 0, reset: 1, express: 2 } as const;
          const activeIdx = phase === 'ready' ? -1 : phase === 'done' ? 3 : order[phase];
          const stateCls = i < activeIdx || phase === 'done'
            ? 'text-[#E8CE96] border-[#C9A45C]/70'
            : i === activeIdx
              ? 'text-[#E8CE96] border-[#E8CE96]'
              : 'text-[#7A6538] border-[#C9A45C]/20';
          return (
            <div key={p} className="flex items-center gap-2 sm:gap-4">
              <span className={`border px-3 py-1.5 text-[9px] uppercase tracking-[0.26em] transition-colors duration-500 ${stateCls}`}>
                {PHASES[p].zh}
              </span>
              {i < 2 && <span className="h-px w-5 bg-[#C9A45C]/30 sm:w-9" />}
            </div>
          );
        })}
      </div>

      {currentMeta && (
        <div className="mt-6 flex flex-col items-center">
          <p className={`font-display text-4xl font-semibold tabular-nums ${timer.remaining <= 10 ? 'text-[#c98f5c]' : 'text-[#E8CE96]'}`}>
            {formatTime(timer.remaining)}
          </p>
          <p className="mt-2 text-[9px] uppercase tracking-[0.34em] text-[#8F8672]">{currentMeta.en}</p>
          <div className="mt-3 h-[2px] w-64 bg-[#C9A45C]/15">
            <motion.div className="h-full bg-gradient-to-r from-[#7A6538] to-[#E8CE96]" animate={{ width: `${phaseProgress * 100}%` }} />
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <>
          <p className="mt-5 max-w-lg text-center text-xs leading-6 text-[#8F8672]">
            完整仪式：5 分钟研究卡牌 → 30 秒重置呼吸 → 3 分钟脱稿口头表达。
            全程约 8.5 分钟，完成后生成 THINKING REPORT，奖励 120 XP。
          </p>
          <button type="button" onClick={begin} className="btn-gold mt-8 px-10 py-3 text-[10px] uppercase">
            BEGIN THE RITUAL
          </button>
        </>
      )}

      {card && phase !== 'ready' && (
        <div className="mt-8 grid w-full items-start gap-8 md:grid-cols-[auto_1fr] md:gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto">
            <TarotCardFace card={card} size="lg" className={phase === 'express' ? 'animate-floaty' : ''} />
          </motion.div>

          <div className="flex w-full flex-col gap-5">
            <div className="panel p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A45C]">{currentMeta?.zh} · {currentMeta?.hint}</p>

              {phase === 'research' && (
                <>
                  <p className="mt-3 text-sm leading-7 text-[#E9DFC8]">{card.essence}</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={8}
                    placeholder="定义 → 机制 → 案例 → 疑问……"
                    className="mt-4 w-full resize-y border hairline bg-black/40 p-3.5 text-sm leading-7 text-[#E9DFC8] outline-none placeholder:text-[#5f5848] focus:border-[#C9A45C]/60"
                  />
                  <div className="mt-3 flex justify-end">
                    <button type="button" onClick={goReset} className="btn-gold px-6 py-2 text-[10px] uppercase">
                      PROCEED TO RESET
                    </button>
                  </div>
                </>
              )}

              {phase === 'reset' && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <motion.svg
                    viewBox="0 0 60 60" className="h-14 w-14 text-[#C9A45C]"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    aria-hidden="true"
                  >
                    <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="30" cy="30" r="2.5" fill="currentColor" stroke="none" />
                  </motion.svg>
                  <p className="text-xs text-[#8F8672]">深呼吸，让刚才的研究沉下去。</p>
                  <button type="button" onClick={goExpress} className="btn-gold px-6 py-2 text-[10px] uppercase">
                    BEGIN EXPRESSION
                  </button>
                </div>
              )}

              {(phase === 'express' || phase === 'done') && (
                <>
                  <label htmlFor="deep-speech" className="text-[10px] uppercase tracking-[0.3em] text-[#C9A45C]">
                    {speechSupported ? 'EXPRESSION · 语音转写' : 'EXPRESSION · 手动输入表达内容'}
                  </label>
                  <textarea
                    id="deep-speech"
                    value={speechText}
                    onChange={e => setSpeechText(e.target.value)}
                    rows={8}
                    placeholder="脱稿讲 3 分钟……"
                    className="mt-3 w-full resize-y border hairline bg-black/40 p-3.5 text-sm leading-7 text-[#E9DFC8] outline-none placeholder:text-[#5f5848] focus:border-[#C9A45C]/60"
                  />
                  {phase === 'express' && (
                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={finishAll} className="btn-gold px-6 py-2 text-[10px] uppercase">
                        FINISH NOW
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {phase === 'done' && (
              <div className="flex items-center justify-between panel p-4">
                <span className="text-[11px] text-[#8F8672]">
                  研究 {notes.length} 字符 · 表达 {(speechText.match(/[\u4e00-\u9fa5]/g) ?? []).length} 字
                </span>
                <button type="button" onClick={submit} disabled={(notes + speechText).trim().length < 40} className="btn-gold px-7 py-2.5 text-[10px] uppercase">
                  GENERATE THINKING REPORT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <GoldParticles active={particles} count={56} />
      {report && <ReportView report={report} />}
    </div>
  );
}
