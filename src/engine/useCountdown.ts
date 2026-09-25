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
 * start(sec) 可传入新阶段时长，内部以 runId 强制重建驱动，
 * 避免「reset + start 同批次、effect 不重建」导致的不走字。
 */
export function useCountdown(
  initialSeconds: number,
  onEnd?: () => void,
  storageKey?: string,
): CountdownApi {
  // 仅首渲染恢复持久化状态
  const initial = useRef<{ remaining: number; state: TimerState; total: number } | null>(null);
  if (initial.current === null) {
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
          if (remaining <= 0) remaining = 0;
        } else {
          remaining = Math.max(0, Math.min(data.value, total));
          state = 'paused';
        }
      }
    }
    initial.current = { remaining, state, total };
  }

  const [remaining, setRemaining] = useState<number>(initial.current.remaining);
  const [timerState, setTimerState] = useState<TimerState>(initial.current.state);
  const [total, setTotal] = useState<number>(initial.current.total);
  const [runId, setRunId] = useState<number>(0);

  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const firedEndRef = useRef(false);
  const deadlineRef = useRef<number>(0);

  const persist = useCallback(
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

  // 驱动：running 且 runId 变化时重建；rem 为本轮起点
  useEffect(() => {
    if (timerState !== 'running') return;

    // 恢复时已过期：触发一次 onEnd
    if (remaining <= 0) {
      if (!firedEndRef.current) {
        firedEndRef.current = true;
        setTimerState('idle');
        persist(null, 0, total);
        endRef.current?.();
      }
      return;
    }

    deadlineRef.current = Date.now() + remaining * 1000;
    persist('running', remaining, total);

    const id = window.setInterval(() => {
      const next = Math.ceil((deadlineRef.current - Date.now()) / 1000);
      if (next <= 0) {
        window.clearInterval(id);
        setRemaining(0);
        setTimerState('idle');
        firedEndRef.current = true;
        persist(null, 0, total);
        endRef.current?.();
      } else {
        setRemaining(next);
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerState, runId]);

  const start = useCallback(
    (sec?: number): void => {
      const nextTotal = sec ?? initialSeconds;
      firedEndRef.current = false;
      setTotal(nextTotal);
      setRemaining(nextTotal);
      setTimerState('running');
      setRunId((n) => n + 1);
    },
    [initialSeconds],
  );

  const pause = useCallback((): void => {
    setTimerState((cur) => {
      if (cur !== 'running') return cur;
      const rem = Math.max(
        1,
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
      );
      setTotal((tot) => {
        persist('paused', rem, tot);
        return tot;
      });
      setRemaining(rem);
      return 'paused';
    });
  }, [persist]);

  const resume = useCallback((): void => {
    setTimerState((cur) => {
      if (cur !== 'paused') return cur;
      firedEndRef.current = false;
      setRunId((n) => n + 1);
      return 'running';
    });
  }, []);

  const toggle = useCallback((): void => {
    if (timerState === 'running') pause();
    else if (timerState === 'paused') resume();
  }, [timerState, pause, resume]);

  const reset = useCallback(
    (sec?: number): void => {
      const nextTotal = sec ?? initialSeconds;
      firedEndRef.current = false;
      setTimerState('idle');
      setRemaining(nextTotal);
      setTotal(nextTotal);
      persist(null, nextTotal, nextTotal);
    },
    [initialSeconds, persist],
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
