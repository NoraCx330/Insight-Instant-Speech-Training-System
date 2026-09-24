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
  const { archive, xp, level, streak, resetAll } = useStore();
  const [filter, setFilter] = useState<ActivityKind | 'ALL'>('ALL');
  const [discipline, setDiscipline] = useState<Discipline | 'ALL'>('ALL');
  const [focusCardId, setFocusCardId] = useState<number | null>(getQueryCardId);

  const seenIds = useMemo(() => new Set(archive.flatMap(r => r.cardIds)), [archive]);

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
          <h2 className="text-sm tracking-[0.3em] text-[#C9A45C]">CARD CODEX · 卡牌图鉴（{seenIds.size}/{ALL_CARDS.length} 已相遇）</h2>
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
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => setFocusCardId(c.id)}
                className="group relative flex flex-col items-center gap-2.5"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.35 }}
              >
                <TarotCardFace card={c} size="md" className={seen ? '' : 'opacity-45 grayscale-[0.3]'} />
                <span className={`text-[9px] tracking-[0.2em] ${seen ? 'text-[#C9A45C]' : 'text-[#5f5848]'}`}>
                  {seen ? '已相遇' : '未相遇'}
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
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#8F8672]">
                  {focusCard.numeral} · {DISCIPLINE_META[focusCard.discipline].en}
                </p>
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
