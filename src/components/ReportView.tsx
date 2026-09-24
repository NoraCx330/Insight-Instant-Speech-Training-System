import { motion } from 'framer-motion';
import type { ThinkingReport } from '../engine/report';

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(201,164,92,0.18)" strokeWidth="4" />
      <motion.circle
        cx="40" cy="40" r={r} fill="none" stroke="#C9A45C" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * score) / 100 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

export function ReportView({ report }: { report: ThinkingReport }) {
  return (
    <motion.section
      className="panel mt-8 p-5 sm:p-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <ScoreRing score={report.total} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-semibold leading-none text-[#E8CE96]">{report.total}</span>
              <span className="text-[9px] tracking-[0.3em] text-[#8F8672]">{report.grade}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.38em] text-[#8F8672]">THINKING REPORT</p>
            <h3 className="mt-2 max-w-xs text-base leading-relaxed text-[#E9DFC8]">{report.summary}</h3>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-5 gap-y-1 text-[10px] text-[#8F8672] sm:text-right">
          <span>字数 {report.metrics.chars}</span>
          <span>连接词 {report.metrics.connectors}</span>
          <span>例证 {report.metrics.examples}</span>
          <span>句子 {report.metrics.sentences}</span>
          <span>填充 {report.metrics.fillers}</span>
          <span>关键词命中 {report.metrics.keywordHits.length}</span>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {report.dimensions.map((d, i) => (
          <motion.div
            key={d.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[#E9DFC8]">{d.zh}</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#8F8672]">{d.en} · {d.score}</span>
            </div>
            <div className="mt-2 h-[3px] w-full bg-[#C9A45C]/12">
              <motion.div
                className="h-full bg-gradient-to-r from-[#7A6538] via-[#C9A45C] to-[#E8CE96]"
                initial={{ width: 0 }}
                animate={{ width: `${d.score}%` }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#8F8672]">{d.comment}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-7 grid gap-4 border-t hairline pt-5 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A45C]">STRENGTHS</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#8F8672]">
            {report.strengths.map(s => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A45C]">TO IMPROVE</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#8F8672]">
            {report.improvements.map(s => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}
