import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getCard, type Card } from '../data';
import { useStore } from '../store/useStore';
import { analyzeThinking } from '../engine/report';
import { ReportView } from '../components/ReportView';
import type { ThinkingReport } from '../engine/report';

interface Topic {
  id: string;
  text: string;
  prompt: string;
}

const TOPICS: Topic[] = [
  { id: 't1', text: 'AI 正在取代初级白领工作', prompt: '用至少两张牌的视角分析：谁的「比较优势」在消失，「确认偏误」如何加剧了恐慌？' },
  { id: 't2', text: '短视频平台的推荐算法', prompt: '从「信息茧房」与「注意力机制」出发：平台优化的是谁的奖励函数？' },
  { id: 't3', text: '年轻人延迟婚育', prompt: '用「机会成本」「稀缺」与「社会契约」解释这一选择的理性与代价。' },
  { id: 't4', text: '舆论场上的立场极化', prompt: '串联「群体极化」「马蹄铁效应」与「钟摆」，描述一条新闻的 72 小时。' },
  { id: 't5', text: '远程办公与组织信任', prompt: '「全景敞视」式监控打卡能否换来生产力？用「囚徒困境」分析劳资双方。' },
  { id: 't6', text: '知识付费与「学会」的幻觉', prompt: '结合「邓宁-克鲁格效应」与「中文房间」：收藏课为什么不等于掌握？' },
];

// 每个议题默认推荐分析用牌
const SUGGESTED: Record<string, number[]> = {
  t1: [11, 1, 51],
  t2: [26, 53, 54],
  t3: [9, 14, 16],
  t4: [27, 21, 18],
  t5: [17, 13, 15],
  t6: [4, 56, 3],
};

export function TopicsPage() {
  const { recordActivity } = useStore();
  const [active, setActive] = useState<Topic | null>(null);
  const [text, setText] = useState('');
  const [report, setReport] = useState<ThinkingReport | null>(null);
  const [done, setDone] = useState(false);

  const suggestedCards = useMemo(
    () => active ? SUGGESTED[active.id].map(getCard).filter((c): c is Card => Boolean(c)) : [],
    [active],
  );

  const keywords = useMemo(() => suggestedCards.flatMap(c => c.keywords), [suggestedCards]);

  const choose = (t: Topic) => {
    setActive(t);
    setText('');
    setReport(null);
    setDone(false);
  };

  const submit = () => {
    if (!active || text.trim().length < 50) return;
    const r = analyzeThinking({ text, keywords, targetSeconds: 240, kind: 'write' });
    setReport(r);
    if (!done) {
      recordActivity('HOT_TOPICS', suggestedCards.map(c => c.id), r.total, active.text);
      setDone(true);
    }
  };

  return (
    <div className="flex flex-col items-center pt-8 sm:pt-10">
      <p className="text-[10px] uppercase tracking-[0.42em] text-[#8F8672]">HOT TOPICS · CONCEPTS MEET THE NEWS</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-[#E8CE96]">热 词 推 演</h1>
      <p className="mt-3 max-w-md text-center text-xs leading-6 text-[#8F8672]">
        选一个正在发生的议题，用牌组中的概念做一次结构化推演，而不是表达情绪。
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {TOPICS.map((t, i) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => choose(t)}
            className={`panel p-4 text-left transition-all duration-500 hover:border-[#C9A45C]/55 hover:shadow-[0_0_26px_rgba(201,164,92,0.1)] ${
              active?.id === t.id ? 'border-[#C9A45C]/70' : ''
            }`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
          >
            <span className="font-display text-sm text-[#E8CE96]">{t.text}</span>
            <span className="mt-2 block text-[10px] leading-5 text-[#8F8672]">{t.prompt}</span>
          </motion.button>
        ))}
      </div>

      {active && (
        <motion.section className="panel mt-8 w-full p-5 sm:p-7" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A45C]">SUGGESTED FRAMES · 推荐分析牌</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedCards.map(c => (
              <a key={c.id} href={`#/archive?card=${c.id}`} className="border border-[#C9A45C]/35 px-3 py-1.5 text-[11px] text-[#C9A45C] transition-colors hover:border-[#E8CE96] hover:text-[#E8CE96]">
                {c.numeral} · {c.titleZh}
              </a>
            ))}
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
            placeholder="用「概念 → 机制 → 证据 → 判断」的顺序完成推演，至少 120 字……"
            className="mt-5 w-full resize-y border hairline bg-black/40 p-3.5 text-sm leading-7 text-[#E9DFC8] outline-none placeholder:text-[#5f5848] focus:border-[#C9A45C]/60"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-[#7A6538]">{(text.match(/[\u4e00-\u9fa5]/g) ?? []).length} 字 · 完成推演 +30 XP</span>
            <button type="button" onClick={submit} disabled={done || text.trim().length < 50} className="btn-gold px-7 py-2.5 text-[10px] uppercase">
              {done ? 'RECORDED' : 'DELIVER ANALYSIS'}
            </button>
          </div>
        </motion.section>
      )}

      {report && <ReportView report={report} />}
    </div>
  );
}
