import { formatTime, type TimerState } from '../engine/useCountdown';

interface TimerDisplayProps {
  remaining: number;
  total: number;
  state: TimerState;
  /** 阶段英文标签，如 RESEARCH · 5:00 */
  label: string;
}

const URGENT_SECONDS = 10;

/**
 * 统一的仪式感计时器：
 * running 大号金色辉光；最后 10 秒金红脉冲；paused 金色冻结；idle 灰金小号。
 */
export function TimerDisplay({ remaining, total, state, label }: TimerDisplayProps) {
  const urgent = state === 'running' && remaining <= URGENT_SECONDS && total > URGENT_SECONDS;

  const sizeCls =
    state === 'running'
      ? 'text-6xl sm:text-7xl'
      : state === 'paused'
        ? 'text-5xl sm:text-6xl'
        : 'text-3xl sm:text-4xl';

  const colorCls =
    state === 'running'
      ? urgent
        ? 'text-[#D86B4A] timer-urgent'
        : 'text-[#E8CE96] timer-glow'
      : state === 'paused'
        ? 'text-[#C9A45C]'
        : 'text-[#7A6538]';

  return (
    <div className="flex flex-col items-center">
      <p className={`font-display font-semibold tabular-nums leading-none transition-colors duration-500 ${sizeCls} ${colorCls}`}>
        {formatTime(remaining)}
      </p>
      <p className="mt-3 h-4 text-[9px] uppercase tracking-[0.34em] text-[#C9A45C]">
        {state === 'paused' ? '◈ PAUSED · 已暂停' : label}
      </p>
      {state === 'running' && urgent && (
        <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-[#D86B4A]">FINAL BREATH · 最后十秒</p>
      )}
    </div>
  );
}
