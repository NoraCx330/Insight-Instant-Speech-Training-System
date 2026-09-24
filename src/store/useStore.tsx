// 本地状态层：每日牌 / XP / Streak / 档案，全部 localStorage，无后端依赖
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ALL_CARDS } from '../data';

const STORAGE_KEY = 'insight-deck:v1';

export type ActivityKind = 'DAILY_INSIGHT' | 'CONNECT_TWO' | 'THINKING_LAB' | 'DEEP_THINK' | 'HOT_TOPICS';

export interface ActivityRecord {
  date: string;        // YYYY-MM-DD
  ts: number;
  kind: ActivityKind;
  cardIds: number[];
  xp: number;
  totalScore?: number; // 六维总分（有报告时）
  title?: string;
}

export interface DailyDraw {
  date: string;
  cardId: number;
}

interface PersistState {
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  daily: DailyDraw | null;
  archive: ActivityRecord[];
}

const DEFAULT_STATE: PersistState = {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  daily: null,
  archive: [],
};

export const XP_REWARD: Record<ActivityKind, number> = {
  DAILY_INSIGHT: 20,
  CONNECT_TWO: 40,
  THINKING_LAB: 60,
  DEEP_THINK: 120,
  HOT_TOPICS: 30,
};

export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 以当地日期为种子选牌：同一天结果固定，次日自动更换
export function cardForDate(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) {
    h = (h * 31 + date.charCodeAt(i)) >>> 0;
  }
  return ALL_CARDS[h % ALL_CARDS.length].id;
}

function isYesterday(prev: string, current: string): boolean {
  const d = new Date(`${current}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return todayStr(d) === prev;
}

function loadState(): PersistState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

interface StoreApi {
  xp: number;
  level: number;
  streak: number;
  daily: DailyDraw | null;
  archive: ActivityRecord[];
  ensureDaily: () => DailyDraw;
  recordActivity: (kind: ActivityKind, cardIds: number[], totalScore?: number, title?: string) => number;
  resetAll: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistState>(DEFAULT_STATE);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (state === DEFAULT_STATE) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 存储满或隐私模式时静默降级
    }
  }, [state]);

  const ensureDaily = useCallback((): DailyDraw => {
    const t = todayStr();
    if (state.daily && state.daily.date === t) return state.daily;
    const draw: DailyDraw = { date: t, cardId: cardForDate(t) };
    setState(s => ({ ...s, daily: draw }));
    return draw;
  }, [state.daily]);

  const recordActivity = useCallback(
    (kind: ActivityKind, cardIds: number[], totalScore?: number, title?: string): number => {
      const t = todayStr();
      const xp = XP_REWARD[kind];
      const rec: ActivityRecord = { date: t, ts: Date.now(), kind, cardIds, xp, totalScore, title };
      setState(s => {
        const isFirstToday = !s.archive.some(r => r.date === t);
        let streak = s.streak;
        if (isFirstToday) {
          streak = s.lastActiveDate && isYesterday(s.lastActiveDate, t)
            ? s.streak + 1
            : 1;
        }
        return {
          ...s,
          xp: s.xp + xp,
          streak,
          lastActiveDate: t,
          archive: [rec, ...s.archive].slice(0, 300),
        };
      });
      return xp;
    },
    [],
  );

  const resetAll = useCallback(() => setState(DEFAULT_STATE), []);

  const level = Math.floor(state.xp / 200) + 1;

  const value = useMemo<StoreApi>(
    () => ({ xp: state.xp, level, streak: state.streak, daily: state.daily, archive: state.archive, ensureDaily, recordActivity, resetAll }),
    [state.xp, level, state.streak, state.daily, state.archive, ensureDaily, recordActivity, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
