import { useEffect, useMemo, useState } from 'react';
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

const CHALLENGE_SECONDS = 90;

type Stage = 'ready' | 'speaking' | 'done';

function randomCard(excludeId?: number): Card {
  let c = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
  let n = 0;
  while (excludeId && c.id === excludeId && n < 10) {
    c = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
    n++;
  }
  return c;
}

export function LabPage() {
  const { recordActivity } = useStore();
  const [card, setCard] = useState<Card | null>(null);
  const [stage, setStage] = useState<Stage>('ready');
  const [transcript, setTranscript] = useState('');
  const [particles, setParticles] = useState(false);
  const [report, setReport] = useState<ThinkingReport | null>(null);
  const speechSupported = useMemo(() => isSpeechSupported(), []);

  const finish = useMemo(() => () => {
    setStage('done');
    setParticles(true);
    window.setTimeout(() => setParticles(false), 2200);
  }, []);

  const timer = useCountdown(CHALLENGE_SECONDS, finish);

  const session = useMemo(() => createSpeechSession(), []);

  useEffect(() => () => session.stop(), [session]);

  const startChallenge = () => {
    setReport(null);
    setTranscript('');
    const c = randomCard(card?.id);
    setCard(c);
    setStage('speaking');
    timer.reset(CHALLENGE_SECONDS);
    timer.start();
    session.start(t => setTranscript(t));
  };

  const stopEarly = () => {
    session.stop();
    timer.pause();
    finish();
  };

  const submit = () => {
    if (!card || transcript.trim().length < 20) return;
    const r = analyzeThinking({
      text: transcript,
      keywords: card.keywords,
      targetSeconds: CHALLENGE_SECONDS,
      kind: 'speak',
    });
    setReport(r);
    recordActivity('THINKING_LAB', [card.id], r.total);
  };

  const progress = 1 - timer.remaining / CHALLENGE_SECONDS;

  return (
    <div className="flex flex-col items-center pt-8 sm:pt-10">
      <p className="text-[10px] uppercase tracking-[0.42em] text-[#8F8672]">THINKING LAB · 90-SECOND CHALLENGE</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-[#E8CE96]">思 维 实 验 室</h1>
      <p className="mt-3 max-w-md text-center text-xs leading-6 text-[#8F8672]">
        抽一张牌，90 秒内不停顿地解释它、举例它、并给出你自己的判断。说满比说好更重要。
      </p>

      {/* 计时器 */}
      <div className={`mt-7 font-display text-5xl font-semibold tabular-nums transition-colors duration-500 ${timer.remaining <= 10 && stage === 'speaking' ? 'text-[#c98f5c]' : 'text-[#E8CE96]'}`}>
        {formatTime(timer.remaining)}
      </div>
      <div className="mt-3 h-[2px] w-64 bg-[#C9A45C]/15">
        <motion.div className="h-full bg-gradient-to-r from-[#7A6538] to-[#E8CE96]" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <div className="mt-6 flex gap-4">
        {stage !== 'speaking' ? (
          <button type="button" onClick={startChallenge} className="btn-gold px-9 py-3 text-[10px] uppercase">
            {card ? 'DRAW ANOTHER & START' : 'DRAW A CARD & START'}
          </button>
        ) : (
          <button type="button" onClick={stopEarly} className="btn-gold px-9 py-3 text-[10px] uppercase">
            FINISH EARLY
          </button>
        )}
      </div>

      <div className="mt-9 grid w-full items-start gap-8 md:grid-cols-[auto_1fr] md:gap-12">
        {card && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto"
          >
            <TarotCardFace card={card} size="lg" className={stage === 'speaking' ? 'animate-floaty' : ''} />
            <p className="mt-3 max-w-[300px] text-center text-[11px] leading-5 text-[#8F8672]">{card.thinkPrompt}</p>
          </motion.div>
        )}

        <div className="panel w-full p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <label htmlFor="lab-transcript" className="text-[10px] uppercase tracking-[0.32em] text-[#C9A45C]">
              {speechSupported ? 'LIVE TRANSCRIPT · 语音转写中' : 'MANUAL INPUT · 当前浏览器不支持转写'}
            </label>
            {stage === 'speaking' && speechSupported && (
              <span className="flex items-center gap-2 text-[10px] text-[#C9A45C]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#C9A45C]" /> REC
              </span>
            )}
          </div>
          <textarea
            id="lab-transcript"
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            rows={9}
            placeholder={stage === 'speaking'
              ? '对着卡牌开口吧，文字会出现在这里（也可直接键入）……'
              : '完成 90 秒表达后，内容会出现在这里，随后生成报告。'}
            className="mt-3 w-full resize-y border hairline bg-black/40 p-3.5 text-sm leading-7 text-[#E9DFC8] outline-none placeholder:text-[#5f5848] focus:border-[#C9A45C]/60"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-[#7A6538]">
              {(transcript.match(/[\u4e00-\u9fa5]/g) ?? []).length} 字 · 完成挑战 +60 XP
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={stage !== 'done' || transcript.trim().length < 20}
              className="btn-gold px-7 py-2.5 text-[10px] uppercase"
            >
              GENERATE REPORT
            </button>
          </div>
        </div>
      </div>

      <GoldParticles active={particles} count={50} />
      {report && <ReportView report={report} />}
    </div>
  );
}
