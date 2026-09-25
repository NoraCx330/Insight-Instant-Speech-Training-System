import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerState = 'idle' | 'running' | 'paused';

interface PersistedTimer {
  /** paused: 剩余秒数；running: 截止时间戳(ms) */
  mode: 'paused' | 'running';
  value: number;
  total: number;
  savedAt: number;
}

interface CountdownApi {
  remaining: number;
  total: number;
  timerState: TimerState;
  running: boolean;
  paused: boolean;
  /** 以 sec（缺省为挂载时长）立即开始新一轮倒计时 */
  start: (sec?: number) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  /** 回到该阶段初始时长并停止；不自动开始 */
  reset: (sec?: number) => void;
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function readPersist(key: string): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedTimer;
    if (
      typeof data.mode !== 'string' ||
      typeof data.value !== 'number' ||
      typeof data.total !== 'number'
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writePersist(key: string, data: PersistedTimer | null): void {
  try {
    if (data) localStorage.setItem(key, JSON.stringify(data));
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/**
 * 倒计时：暂停 / 继续 / 重置 / 换阶段重启。
 * 实现：running 期间持有【唯一一个】1s setInterval（保存在 ref），
 * 绝对截止时间 deadlineRef 为唯一真相源，每秒从它计算剩余并同步显示；
 * start(sec) 换阶段时先清旧 interval 再以新 deadline 重建。
 * 全部状态读写走 ref，避免闭包陈旧值与 StrictMode 双 effect 重复定时器。
 */
export function useCountdown(
  initialSeconds: number,
  onEnd?: () => void,
  storageKey?: string,
): CountdownApi {
  const init = useRef<{ remaining: number; state: TimerState; total: number } | null>(null);
  if (init.current === null) {
    let remaining = initialSeconds;
    let state: TimerState = 'idle';
    let total = initialSeconds;
    if (storageKey) {
      const data = readPersist(storageKey);
      if (data) {
        total = data.total > 0 ? data.total : initialSeconds;
        if (data.mode === 'running') {
          remaining = Math.ceil((data.value - Date.now()) / 1000);
          state = 'running';
          if (remaining < 0) remaining = 0;
        } else {
          remaining = Math.max(0, Math.min(data.value, total));
          state = 'paused';
        }
      }
    }
    init.current = { remaining, state, total };
  }

  const [remaining, setRemaining] = useState<number>(init.current.remaining);
  const [timerState, setTimerState] = useState<TimerState>(init.current.state);
  const [total, setTotal] = useState<number>(init.current.total);

  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  const deadlineRef = useRef<number>(0);
  const totalRef = useRef<number>(init.current.total);
  const stateRef = useRef<TimerState>(init.current.state);
  const endedRef = useRef<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  // 首渲染恢复 running 时从持久化带出 deadline
  if (stateRef.current === 'running' && deadlineRef.current === 0 && storageKey) {
    const data = readPersist(storageKey);
    if (data && data.mode === 'running') {
      totalRef.current = data.total;
      deadlineRef.current = data.value;
    }
  }

  const clearIntervalSafe = useCallback((): void => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const persistNow = useCallback(
    (mode: 'paused' | 'running' | null, rem: number, tot: number): void => {
      if (!storageKey) return;
      if (mode === null) {
        writePersist(storageKey, null);
        return;
      }
      writePersist(storageKey, {
        mode,
        value: mode === 'running' ? Date.now() + rem * 1000 : rem,
        total: tot,
        savedAt: Date.now(),
      });
    },
    [storageKey],
  );

  // 每秒一拍的稳定函数（不依赖任何 state，身份恒定）
  const tick = useCallback((): void => {
    const next = Math.ceil((deadlineRef.current - Date.now()) / 1000);
    if (next <= 0) {
      if (endedRef.current) return;
      endedRef.current = true;
      clearIntervalSafe();
      deadlineRef.current = 0;
      stateRef.current = 'idle';
      setRemaining(0);
      setTimerState('idle');
      persistNow(null, 0, totalRef.current);
      endRef.current?.();
      return;
    }
    setRemaining(next);
  }, [clearIntervalSafe, persistNow]);

  // 建立唯一 interval（先清旧的）
  const startInterval = useCallback((): void => {
    clearIntervalSafe();
    intervalRef.current = window.setInterval(tick, 1000);
  }, [clearIntervalSafe, tick]);

  // 以 seconds 开始全新一轮
  const beginRun = useCallback(
    (seconds: number): void => {
      endedRef.current = false;
      totalRef.current = seconds;
      deadlineRef.current = Date.now() + seconds * 1000;
      stateRef.current = 'running';
      setTotal(seconds);
      setRemaining(seconds);
      setTimerState('running');
      persistNow('running', seconds, seconds);
      startInterval();
    },
    [persistNow, startInterval],
  );

  // 挂载后若恢复为 running：沿用 deadline 继续；已过期则立即结束
  useEffect(() => {
    if (stateRef.current !== 'running') return undefined;
    if (deadlineRef.current === 0) {
      endedRef.current = true;
      stateRef.current = 'idle';
      setTimerState('idle');
      return undefined;
    }
    const left = Math.ceil((deadlineRef.current - Date.now()) / 1000);
    if (left <= 0) {
      endedRef.current = true;
      stateRef.current = 'idle';
      setRemaining(0);
      setTimerState('idle');
      persistNow(null, 0, totalRef.current);
      endRef.current?.();
      return undefined;
    }
    setRemaining(left);
    startInterval();
    return clearIntervalSafe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(
    (sec?: number): void => {
      beginRun(sec ?? initialSeconds);
    },
    [beginRun, initialSeconds],
  );

  const pause = useCallback((): void => {
    if (stateRef.current !== 'running') return;
    const rem = Math.max(1, Math.ceil((deadlineRef.current - Date.now()) / 1000));
    clearIntervalSafe();
    stateRef.current = 'paused';
    setRemaining(rem);
    setTimerState('paused');
    persistNow('paused', rem, totalRef.current);
  }, [clearIntervalSafe, persistNow]);

  const resume = useCallback((): void => {
    if (stateRef.current !== 'paused') return;
    const startRem = remaining > 0 ? remaining : totalRef.current;
    endedRef.current = false;
    deadlineRef.current = Date.now() + startRem * 1000;
    stateRef.current = 'running';
    setTimerState('running');
    persistNow('running', startRem, totalRef.current);
    startInterval();
  }, [clearIntervalSafe, persistNow, remaining, startInterval]);

  const toggle = useCallback((): void => {
    if (stateRef.current === 'running') pause();
    else if (stateRef.current === 'paused') resume();
  }, [pause, resume]);

  const reset = useCallback(
    (sec?: number): void => {
      const nextTotal = sec ?? initialSeconds;
      clearIntervalSafe();
      endedRef.current = false;
      deadlineRef.current = 0;
      stateRef.current = 'idle';
      setTimerState('idle');
      setRemaining(nextTotal);
      setTotal(nextTotal);
      totalRef.current = nextTotal;
      persistNow(null, nextTotal, nextTotal);
    },
    [clearIntervalSafe, initialSeconds, persistNow],
  );

  return {
    remaining,
    total,
    timerState,
    running: timerState === 'running',
    paused: timerState === 'paused',
    start,
    pause,
    resume,
    toggle,
    reset,
  };
}
