import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_CARDS, getCard, type Card } from '../data';
import { TarotCardFace } from '../components/TarotCard';
import { GoldParticles } from '../components/GoldParticles';
import { useCountdown } from '../engine/useCountdown';
import { analyzeThinking } from '../engine/report';
import { ReportView } from '../components/ReportView';
import { TimerDisplay } from '../components/TimerDisplay';
import { createSpeechSession, isSpeechSupported } from '../engine/speech';
import { useStore } from '../store/useStore';
import type { ThinkingReport } from '../engine/report';

const CHALLENGE_SECONDS = 90;
const TIMER_KEY = 'insight-deck:v1:lab-timer';
const SESSION_KEY = 'insight-deck:v1:lab-session';

type Stage = 'ready' | 'speaking' | 'done';

interface PersistedLabSession {
  cardId: number;
  transcript: string;
}

function randomCard(excludeId?: number): Card {
  let c = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
  let n = 0;
  while (excludeId && c.id === excludeId && n < 10) {
    c = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
    n++;
  }
  return c;
}

function readSession(): PersistedLabSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<PersistedLabSession>;
    if (typeof data.cardId !== 'number' || typeof data.transcript !== 'string') return null;
    return { cardId: data.cardId, transcript: data.transcript };
  } catch {
    return null;
  }
}

function writeSession(data: PersistedLabSession | null): void {
  try {
    if (data) localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function LabPage() {
  const { recordActivity } = useStore();

  // 仅在首渲染决定初始 stage / card / transcript
  const init = useRef<{ stage: Stage; card: Card | null; transcript: string } | null>(null);
  if (init.current === null) {
    const persisted = readSession();
    if (persisted) {
      const c = getCard(persisted.cardId);
      init.current = {
        stage: 'speaking',
        card: c ?? null,
        transcript: persisted.transcript,
      };
    } else {
      init.current = { stage: 'ready', card: null, transcript: '' };
    }
  }

  const [card, setCard] = useState<Card | null>(init.current.card);
  const [stage, setStage] = useState<Stage>(init.current.stage);
  const [transcript, setTranscript] = useState<string>(init.current.transcript);
  const [particles, setParticles] = useState(false);
  const [report, setReport] = useState<ThinkingReport | null>(null);
  const [speechLive, setSpeechLive] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const [notice, setNotice] = useState<string>('');
  const speechSupported = useMemo(() => isSpeechSupported(), []);

  const finish = useMemo(
    () => () => {
      setStage('done');
      setSpeechLive(false);
      setParticles(true);
      window.setTimeout(() => setParticles(false), 2200);
    },
    [],
  );

  const timer = useCountdown(CHALLENGE_SECONDS, finish, TIMER_KEY);

  // 恢复时，若计时器已 idle 但 session 存在（计时在关闭期间走完），进入 done
  useEffect(() => {
    if (stage === 'speaking' && timer.timerState === 'idle' && timer.remaining === 0) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const session = useMemo(() => createSpeechSession(), []);

  useEffect(() => () => session.stop(), [session]);

  // 会话持久化（cardId/transcript 在 speaking 阶段同步保存）
  useEffect(() => {
    if (stage !== 'speaking' || !card) {
      if (stage === 'done') writeSession(null);
      return;
    }
    writeSession({ cardId: card.id, transcript });
  }, [stage, card, transcript]);

  const showNotice = (msg: string): void => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 2400);
  };

  const startSpeech = (): void => {
    if (!speechSupported) return;
    session.start(
      t => setTranscript(t),
      (info) => {
        showNotice(info.message);
        if (info.fatal) {
          setSpeechLive(false);
          setSpeechUnavailable(true);
        }
      },
    );
    setSpeechLive(true);
  };

  const startChallenge = (): void => {
    setReport(null);
    setTranscript('');
    setSpeechUnavailable(false);
    const c = card ?? randomCard();
    setCard(c);
    setStage('speaking');
    timer.start(CHALLENGE_SECONDS);
    startSpeech();
  };

  const pauseChallenge = (): void => {
    session.stop();
    setSpeechLive(false);
    timer.pause();
    showNotice('TIME SUSPENDED · 计时已冻结');
  };

  const resumeChallenge = (): void => {
    timer.resume();
    if (!speechUnavailable) startSpeech();
  };

  const resetChallenge = (): void => {
    session.stop();
    setSpeechLive(false);
    timer.reset(CHALLENGE_SECONDS);
    showNotice('CLOCK RESTORED · 计时已回到 90 秒');
  };

  const stopEarly = (): void => {
    session.stop();
    setSpeechLive(false);
    timer.reset();
    finish();
  };

  const submit = (): void => {
    if (!card || transcript.trim().length < 20) return;
    const r = analyzeThinking({
      text: transcript,
      keywords: card.keywords,
      targetSeconds: CHALLENGE_SECONDS,
      kind: 'speak',
    });
    setReport(r);
    writeSession(null);
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
      <div className="mt-7">
        <TimerDisplay
          remaining={timer.remaining}
          total={CHALLENGE_SECONDS}
          state={stage === 'speaking' ? timer.timerState : 'idle'}
          label={notice}
        />
      </div>
      <div className="mt-3 h-[2px] w-64 bg-[#C9A45C]/15">
        <motion.div
          className="h-full bg-gradient-to-r from-[#7A6538] to-[#E8CE96]"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 计时控制 */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {stage !== 'speaking' ? (
          <button type="button" onClick={startChallenge} className="btn-gold px-9 py-3 text-[10px] uppercase">
            {card && stage === 'done' ? 'START AGAIN WITH SAME CARD' : 'DRAW A CARD & START'}
          </button>
        ) : (
          <>
            {timer.running ? (
              <button type="button" onClick={pauseChallenge} className="btn-gold px-7 py-2.5 text-[10px] uppercase">
                Pause
              </button>
            ) : (
              <button type="button" onClick={resumeChallenge} className="btn-gold px-7 py-2.5 text-[10px] uppercase">
                Resume
              </button>
            )}
            <button type="button" onClick={resetChallenge} className="btn-line px-7 py-2.5 text-[10px] uppercase">
              Reset
            </button>
            <button type="button" onClick={stopEarly} className="btn-line px-7 py-2.5 text-[10px] uppercase">
              Finish Early
            </button>
          </>
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
            <TarotCardFace
              card={card}
              size="lg"
              className={stage === 'speaking' && timer.running ? 'animate-floaty' : ''}
            />
            <p className="mt-3 max-w-[300px] text-center text-[11px] leading-5 text-[#8F8672]">{card.thinkPrompt}</p>
          </motion.div>
        )}

        <div className="panel w-full p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <label htmlFor="lab-transcript" className="text-[10px] uppercase tracking-[0.32em] text-[#C9A45C]">
              {!speechSupported || speechUnavailable
                ? 'MANUAL INPUT · 手动输入模式'
                : 'LIVE TRANSCRIPT · 语音转写中'}
            </label>
            {speechLive && (
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
            placeholder={
              stage === 'speaking'
                ? '对着卡牌开口吧，文字会出现在这里（也可直接键入）……'
                : '完成 90 秒表达后，内容会出现在这里，随后生成报告。'
            }
            className="mt-3 w-full resize-y border hairline bg-black/40 p-3.5 text-sm leading-7 text-[#E9DFC8] outline-none placeholder:text-[#5f5848] focus:border-[#C9A45C]/60"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[0.62rem] text-[#7A6538]">
              {(transcript.match(/[\u4e00-\u9fa5]/g) ?? []).length} 字 · 完成挑战 +60 XP
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={stage !== 'done' || transcript.trim().length < 20}
              className="btn-gold px-7 py-2.5 text-[10px] uppercase"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <GoldParticles active={particles} count={50} />
      {report && <ReportView report={report} />}
    </div>
  );
}
