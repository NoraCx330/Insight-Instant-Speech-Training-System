import { useCallback, useEffect, useRef, useState } from 'react';

interface CountdownApi {
  remaining: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: (sec?: number) => void;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useCountdown(initialSeconds: number, onEnd?: () => void): CountdownApi {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now();
    const base = remaining;
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const next = base - elapsed;
      if (next <= 0) {
        window.clearInterval(id);
        setRemaining(0);
        setRunning(false);
        endRef.current?.();
      } else {
        setRemaining(next);
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((sec?: number) => {
    setRunning(false);
    setRemaining(sec ?? initialSeconds);
  }, [initialSeconds]);

  return { remaining, running, start, pause, reset };
}
