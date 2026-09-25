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
  start: () => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  reset: (sec?: number) => void;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
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
 * 倒计时：支持暂停/继续/重置。
 * 传入 storageKey 时，计时状态持久化；刷新或重开页面后，
 * running 状态按截止时间恢复（已超时则触发 onEnd），paused 状态冻结恢复。
 */
export function useCountdown(
  initialSeconds: number,
  onEnd?: () => void,
  storageKey?: string,
): CountdownApi {
  // 恢复初始状态（仅首渲染）
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
          if (remaining <= 0) {
            remaining = 0;
            state = 'running'; // 标记为运行，交由 effect 在挂载后触发 onEnd
          } else {
            state = 'running';
          }
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
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  const firedEndRef = useRef(false);

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

  // 运行驱动
  useEffect(() => {
    if (timerState !== 'running') return;

    // 恢复时已过期：挂载后触发一次 onEnd
    if (remaining <= 0) {
      if (!firedEndRef.current) {
        firedEndRef.current = true;
        setTimerState('idle');
        persist(null, 0, total);
        endRef.current?.();
      }
      return;
    }

    const deadline = Date.now() + remaining * 1000;
    persist('running', remaining, total);
    const id = window.setInterval(() => {
      const next = Math.ceil((deadline - Date.now()) / 1000);
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
  }, [timerState]);

  const start = useCallback((): void => {
    firedEndRef.current = false;
    setRemaining(initialSeconds);
    setTotal(initialSeconds);
    setTimerState('running');
  }, [initialSeconds]);

  const pause = useCallback((): void => {
    if (timerState !== 'running') return;
    setTimerState('paused');
    setRemaining((rem) => {
      persist('paused', rem, total);
      return rem;
    });
  }, [timerState, persist, total]);

  const resume = useCallback((): void => {
    if (timerState !== 'paused') return;
    firedEndRef.current = false;
    setTimerState('running');
  }, [timerState]);

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
