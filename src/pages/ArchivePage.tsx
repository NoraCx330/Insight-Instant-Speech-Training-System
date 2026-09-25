import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_CARDS, DISCIPLINE_META, getCard, type Discipline } from '../data';
import { useStore, type ActivityKind } from '../store/useStore';
import { TarotCardFace } from '../components/TarotCard';

const KIND_LABEL: Record<ActivityKind, string> = {
  DAILY_INSIGHT: '每日洞见',
  CONNECT_TWO: '双卡联结',
  THINKING_LAB: '思维实验室',
  DEEP_THINK: '深度思考',
  HOT_TOPICS: '热词推演',
};

function getQueryCardId(): number | null {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?card=');
  if (qIndex < 0) return null;
  const id = parseInt(hash.slice(qIndex + 6), 10);
  return Number.isFinite(id) ? id : null;
}

export function ArchivePage() {
  const { archive, xp, level, streak, resetAll, litCardIds } = useStore();
  const [filter, setFilter] = useState<ActivityKind | 'ALL'>('ALL');
  const [discipline, setDiscipline] = useState<Discipline | 'ALL'>('ALL');
  const [focusCardId, setFocusCardId] = useState<number | null>(getQueryCardId);

  const seenIds = useMemo(() => new Set(archive.flatMap(r => r.cardIds)), [archive]);
  const litSet = useMemo(() => new Set(litCardIds), [litCardIds]);
  const litCount = litCardIds.length;
  const litPct = Math.round((litCount / ALL_CARDS.length) * 100);

  const filtered = useMemo(
    () => archive.filter(r => filter === 'ALL' || r.kind === filter),
    [archive, filter],
  );

  const bestScore = useMemo(() => {
    const scores = archive.map(r => r.totalScore).filter((n): n is number => typeof n === 'number');
    return scores.length ? Math.max(...scores) : null;
  }, [archive]);

  const focusCard = focusCardId ? getCard(focusCardId) : null;
  const cardHistory = focusCardId
    ? archive.filter(r => r.cardIds.includes(focusCardId))
    : [];

  const gridCards = discipline === 'ALL' ? ALL_CARDS : ALL_CARDS.filter(c => c.discipline === discipline);

  return (
    <div className="pt-8 sm:pt-10">
      <p className="text-center text-[10px] uppercase tracking-[0.42em] text-[#8F8672]">ARCHIVE · YOUR THINKING TRAIL</p>
      <h1 className="mt-2 text-center font-display text-2xl font-semibold text-[#E8CE96]">我 的 档 案</h1>

      {/* 数据概览 */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'TOTAL XP', value: xp },
          { label: 'LEVEL', value: level },
          { label: 'STREAK', value: `${streak} DAYS` },
          { label: 'BEST SCORE', value: bestScore ?? '—' },
        ].map(s => (
          <div key={s.label} className="panel flex flex-col items-center gap-2 p-4">
            <span className="font-display text-2xl text-[#E8CE96]">{s.value}</span>
            <span className="text-[9px] tracking-[0.3em] text-[#8F8672]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* 成就：卡牌点亮 */}
      <section className="panel relative mt-5 overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 achievement-halo" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#C9A45C]">DEEP THINK ACHIEVEMENTS · 深度成就</p>
            <p className="mt-2 font-display text-3xl font-semibold text-[#E8CE96]">
              {litCount}<span className="text-lg text-[#8F8672]"> / {ALL_CARDS.length}</span>
              <span className="ml-3 text-xs tracking-[0.2em] text-[#8F8672]">卡牌已点亮 · {litPct}%</span>
            </p>
            <p className="mt-2 text-[11px] leading-5 text-[#8F8672]">
              对一张卡牌完成完整 Deep Think（5 分钟研究 → 30 秒重置 → 3 分钟演讲并生成反馈），该卡牌即被点亮。
            </p>
          </div>
          <svg viewBox="0 0 40 40" className="h-14 w-14 shrink-0 text-[#C9A45C]" aria-hidden="true">
            <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <path d="M20 6 L23.2 15.2 L33 16 L25.4 22.2 L27.8 31.6 L20 26.6 L12.2 31.6 L14.6 22.2 L7 16 L16.8 15.2 Z"
              fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>
        <div className="relative mt-4 h-[3px] w-full bg-[#C9A45C]/12">
          <motion.div
            className="h-full bg-gradient-to-r from-[#7A6538] via-[#C9A45C] to-[#E8CE96]"
            initial={{ width: 0 }}
            animate={{ width: `${litPct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </section>

      {/* 训练记录 */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm tracking-[0.3em] text-[#C9A45C]">SESSION LOG · 训练记录</h2>
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'DAILY_INSIGHT', 'CONNECT_TWO', 'THINKING_LAB', 'DEEP_THINK', 'HOT_TOPICS'] as const).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`border px-3 py-1 text-[9px] uppercase tracking-[0.18em] transition-colors ${
                  filter === k ? 'border-[#E8CE96] text-[#E8CE96]' : 'border-[#C9A45C]/25 text-[#8F8672] hover:border-[#C9A45C]/55'
                }`}
              >
                {k === 'ALL' ? '全部' : KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 panel divide-y hairline">
          {filtered.length === 0 && (
            <p className="p-6 text-center text-xs text-[#7A6538]">暂无记录，去完成一次训练吧。</p>
          )}
          {filtered.map((r, i) => (
            <div key={`${r.ts}-${i}`} className="flex flex-wrap items-center gap-3 p-4 text-xs">
              <span className="text-[#8F8672]">{r.date}</span>
              <span className="border border-[#C9A45C]/30 px-2 py-0.5 text-[9px] tracking-[0.2em] text-[#C9A45C]">
                {KIND_LABEL[r.kind]}
              </span>
              <span className="flex flex-wrap gap-2">
                {r.cardIds.map(id => {
                  const c = getCard(id);
                  return c ? (
                    <button key={id} type="button" onClick={() => setFocusCardId(id)} className="text-[#8F8672] underline-offset-4 transition-colors hover:text-[#E8CE96] hover:underline">
                      {c.numeral} {c.titleZh}
                    </button>
                  ) : null;
                })}
              </span>
              <span className="ml-auto flex gap-4 text-[10px] text-[#8F8672]">
                {r.title && <span className="hidden max-w-[240px] truncate sm:inline">{r.title}</span>}
                {typeof r.totalScore === 'number' && <span className="text-[#E8CE96]">{r.totalScore} 分</span>}
                <span>+{r.xp} XP</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 卡牌图鉴 */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm tracking-[0.3em] text-[#C9A45C]">
            CARD CODEX · 卡牌图鉴（{seenIds.size}/{ALL_CARDS.length} 已相遇 · {litCount} 已点亮）
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setDiscipline('ALL')} className={`border px-3 py-1 text-[9px] tracking-[0.18em] ${discipline === 'ALL' ? 'border-[#E8CE96] text-[#E8CE96]' : 'border-[#C9A45C]/25 text-[#8F8672]'}`}>
              全部
            </button>
            {(Object.keys(DISCIPLINE_META) as Discipline[]).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDiscipline(d)}
                className={`border px-3 py-1 text-[9px] tracking-[0.18em] ${discipline === d ? 'border-[#E8CE96] text-[#E8CE96]' : 'border-[#C9A45C]/25 text-[#8F8672] hover:border-[#C9A45C]/55'}`}
              >
                {DISCIPLINE_META[d].zh}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {gridCards.map(c => {
            const seen = seenIds.has(c.id);
            const lit = litSet.has(c.id);
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => setFocusCardId(c.id)}
                className="group relative flex flex-col items-center gap-2.5"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.35 }}
              >
                <div className={`relative ${lit ? 'card-lit-wrap' : ''}`}>
                  <TarotCardFace
                    card={c}
                    size="md"
                    className={lit
                      ? 'card-lit'
                      : seen ? '' : 'opacity-40 grayscale-[0.35]'}
                  />
                  {lit && (
                    <span className="pointer-events-none absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#E8CE96] bg-[#0D0C0B] shadow-[0_0_14px_rgba(232,206,150,0.7)]">
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-[#E8CE96]" aria-hidden="true">
                        <path d="M10 2 L12 7.5 L18 8 L13.3 11.7 L14.8 17.5 L10 14.3 L5.2 17.5 L6.7 11.7 L2 8 L8 7.5 Z"
                          fill="currentColor" stroke="none" />
                      </svg>
                    </span>
                  )}
                </div>
                <span className={`text-[9px] tracking-[0.2em] ${
                  lit ? 'text-[#E8CE96]' : seen ? 'text-[#C9A45C]' : 'text-[#5f5848]'
                }`}>
                  {lit ? '已点亮 · LIT' : seen ? '已相遇' : '未相遇'}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 卡牌详情弹层 */}
      {focusCard && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setFocusCardId(null)}
          role="dialog" aria-modal="true"
        >
          <motion.div
            className="panel max-h-[88vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8"
            initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <TarotCardFace card={focusCard} size="md" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#8F8672]">
                  {focusCard.numeral} · {DISCIPLINE_META[focusCard.discipline].en}
                </p>
                {litSet.has(focusCard.id) && (
                  <span className="border border-[#E8CE96] bg-[#C9A45C]/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] text-[#E8CE96] shadow-[0_0_12px_rgba(232,206,150,0.4)]">
                    LIT · 深度成就
                  </span>
                )}
              </div>
                <h3 className="mt-2 text-lg font-semibold text-[#E8CE96]">{focusCard.titleZh}</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8F8672]">{focusCard.titleEn}</p>
                <p className="mt-3 text-xs leading-6 text-[#E9DFC8]">{focusCard.essence}</p>
                <p className="mt-3 text-xs leading-6 text-[#C9A45C]">{focusCard.thinkPrompt}</p>
              </div>
            </div>
            <div className="mt-6 border-t hairline pt-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#8F8672]">与这张牌相关的训练（{cardHistory.length}）</p>
              {cardHistory.length === 0 ? (
                <p className="mt-2 text-[11px] text-[#5f5848]">还没有与它相关的训练记录。</p>
              ) : (
                cardHistory.map((r, i) => (
                  <p key={`${r.ts}-${i}`} className="mt-2 text-[11px] text-[#8F8672]">
                    {r.date} · {KIND_LABEL[r.kind]} {typeof r.totalScore === 'number' ? ` · ${r.totalScore} 分` : ''} · +{r.xp} XP
                  </p>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setFocusCardId(null)} className="btn-gold px-6 py-2 text-[10px] uppercase">
                CLOSE
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('将清除全部 XP、连续天数与档案，确定吗？')) resetAll();
          }}
          className="text-[10px] uppercase tracking-[0.3em] text-[#5f5848] transition-colors hover:text-[#c98f5c]"
        >
          RESET ALL DATA
        </button>
      </div>
    </div>
  );
}
