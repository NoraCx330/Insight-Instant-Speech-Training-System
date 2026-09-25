// 本地状态层：每日牌 / XP / Streak / 档案 / 成就，全部 localStorage，无后端依赖
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ALL_CARDS } from '../data';
import type { Discipline } from '../data';

const STORAGE_KEY = 'insight-deck:v1';

export type DailyScope = Discipline | 'ALL';

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
  scope: DailyScope;   // 本次抽卡使用的学科范围
  variant: number;     // 0 = 当日首抽；>0 = 第 N 次重抽结果
}

interface PersistState {
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  daily: DailyDraw | null;
  archive: ActivityRecord[];
  litCardIds: number[];                // 已点亮成就的卡牌 id
  dailyScope: DailyScope;              // 抽卡范围偏好（跨日保留）
  redraw: { date: string; used: boolean } | null; // 当日重抽机会
}

const DEFAULT_STATE: PersistState = {
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  daily: null,
  archive: [],
  litCardIds: [],
  dailyScope: 'ALL',
  redraw: null,
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

// FNV-1a 字符串哈希
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 以「日期 + 范围 + 变体」为种子，从对应卡池确定性选牌
function pickCardId(date: string, scope: DailyScope, variant: number): number {
  const pool = scope === 'ALL' ? ALL_CARDS : ALL_CARDS.filter(c => c.discipline === scope);
  const h = hashStr(`${date}|${scope}|${variant}`);
  return pool[h % pool.length].id;
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
    return {
      ...DEFAULT_STATE,
      ...parsed,
      litCardIds: Array.isArray(parsed.litCardIds) ? parsed.litCardIds : [],
      dailyScope: parsed.dailyScope ?? 'ALL',
      redraw: parsed.redraw ?? null,
    };
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
  litCardIds: number[];
  dailyScope: DailyScope;
  redrawUsed: boolean;
  ensureDaily: () => DailyDraw;
  setDailyScope: (scope: DailyScope) => void;
  redrawDaily: () => boolean;
  markCardLit: (cardId: number) => void;
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

  // 生成当日首抽（新的一天：scope 取用户偏好，variant 0）
  const buildTodayDraw = useCallback((date: string, scope: DailyScope, prev?: DailyDraw | null): DailyDraw => {
    let variant = 0;
    let cardId = pickCardId(date, scope, variant);
    // 兼容旧数据无 scope；以及保证同日重抽不与当前牌重复
    const currentId = prev && prev.date === date ? prev.cardId : undefined;
    while (currentId !== undefined && cardId === currentId && variant < 6) {
      variant += 1;
      cardId = pickCardId(date, scope, variant);
    }
    return { date, cardId, scope, variant };
  }, []);

  const ensureDaily = useCallback((): DailyDraw => {
    const t = todayStr();
    if (state.daily && state.daily.date === t) {
      // 迁移：旧记录没有 scope 字段时补全
      if (!state.daily.scope) {
        const migrated: DailyDraw = { ...state.daily, scope: 'ALL', variant: state.daily.variant ?? 0 };
        setState(s => ({ ...s, daily: migrated }));
        return migrated;
      }
      return state.daily;
    }
    const draw = buildTodayDraw(t, state.dailyScope, state.daily);
    setState(s => ({ ...s, daily: draw }));
    return draw;
  }, [state.daily, state.dailyScope, buildTodayDraw]);

  // 切换抽卡范围：记住偏好，并立即以该范围重算今日之牌（variant 0，不消耗重抽机会）
  const setDailyScope = useCallback((scope: DailyScope) => {
    const t = todayStr();
    setState(s => {
      const base: DailyDraw | null = s.daily && s.daily.date === t ? s.daily : null;
      const draw = base
        ? { date: t, cardId: pickCardId(t, scope, 0), scope, variant: 0 }
        : buildTodayDraw(t, scope, s.daily);
      return { ...s, dailyScope: scope, daily: draw };
    });
  }, [buildTodayDraw]);

  // 每日一次重抽：消耗机会，在当前范围内抽一张不同的牌
  const redrawDaily = useCallback((): boolean => {
    const t = todayStr();
    if (state.redraw?.date === t && state.redraw.used) return false;
    if (!state.daily || state.daily.date !== t) return false;
    const scope = state.daily.scope;
    let variant = state.daily.variant + 1;
    let cardId = pickCardId(t, scope, variant);
    while (cardId === state.daily.cardId && variant < 12) {
      variant += 1;
      cardId = pickCardId(t, scope, variant);
    }
    setState(s => ({
      ...s,
      daily: { date: t, cardId, scope, variant },
      redraw: { date: t, used: true },
    }));
    return true;
  }, [state.redraw, state.daily]);

  const markCardLit = useCallback((cardId: number) => {
    setState(s => s.litCardIds.includes(cardId) ? s : { ...s, litCardIds: [...s.litCardIds, cardId] });
  }, []);

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
  const redrawUsed = state.redraw?.date === todayStr() ? state.redraw.used : false;

  const value = useMemo<StoreApi>(
    () => ({
      xp: state.xp, level, streak: state.streak, daily: state.daily, archive: state.archive,
      litCardIds: state.litCardIds, dailyScope: state.dailyScope, redrawUsed,
      ensureDaily, setDailyScope, redrawDaily, markCardLit, recordActivity, resetAll,
    }),
    [state.xp, level, state.streak, state.daily, state.archive, state.litCardIds, state.dailyScope, redrawUsed,
      ensureDaily, setDailyScope, redrawDaily, markCardLit, recordActivity, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
