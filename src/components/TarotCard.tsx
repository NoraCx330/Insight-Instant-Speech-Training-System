import { memo } from 'react';
import { Glyph } from './Glyph';
import { DISCIPLINE_META, type Card } from '../data';

interface TarotCardProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DIMS = {
  sm: 'w-32 text-[9px]',
  md: 'w-52 text-[11px]',
  lg: 'w-[min(78vw,320px)] text-xs',
} as const;

function CornerStars() {
  return (
    <>
      <path d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z" />
    </>
  );
}

export const TarotCardFace = memo(function TarotCardFace({ card, size = 'md', className = '' }: TarotCardProps) {
  const meta = DISCIPLINE_META[card.discipline];
  return (
    <div
      className={`relative aspect-[2/3] select-none overflow-hidden border border-[#C9A45C]/60
        bg-gradient-to-b from-[#15120c] via-[#0a0908] to-[#13100a]
        shadow-[0_18px_60px_rgba(0,0,0,0.85),inset_0_0_40px_rgba(201,164,92,0.06)] ${DIMS[size]} ${className}`}
    >
      {/* 外细框 */}
      <div className="pointer-events-none absolute inset-[7px] border border-[#C9A45C]/35" />
      <div className="card-engrave pointer-events-none absolute inset-0" />

      {/* 四角星 */}
      <svg className="absolute left-2.5 top-2.5 h-2.5 w-2.5 text-[#C9A45C]/70" viewBox="-5 -5 10 10" aria-hidden="true">
        <CornerStars />
      </svg>
      <svg className="absolute right-2.5 top-2.5 h-2.5 w-2.5 text-[#C9A45C]/70" viewBox="-5 -5 10 10" aria-hidden="true">
        <CornerStars />
      </svg>
      <svg className="absolute bottom-2.5 left-2.5 h-2.5 w-2.5 text-[#C9A45C]/70" viewBox="-5 -5 10 10" aria-hidden="true">
        <CornerStars />
      </svg>
      <svg className="absolute bottom-2.5 right-2.5 h-2.5 w-2.5 text-[#C9A45C]/70" viewBox="-5 -5 10 10" aria-hidden="true">
        <CornerStars />
      </svg>

      <div className="relative flex h-full flex-col items-center justify-between px-5 py-5">
        {/* 顶部：罗马数字 + 学科 */}
        <div className="flex w-full flex-col items-center gap-1">
          <span className="font-display text-base font-semibold leading-none text-[#E8CE96]">{card.numeral}</span>
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#8F8672]">{meta.en}</span>
        </div>

        {/* 中央象征图 */}
        <div className="relative flex flex-1 items-center justify-center py-2">
          <div className="pointer-events-none absolute h-[78%] w-[78%] rounded-full border border-[#C9A45C]/25" />
          <Glyph name={card.glyph} strokeWidth={1.5} className="w-[62%] text-[#C9A45C]" />
        </div>

        {/* 标题 */}
        <div className="flex w-full flex-col items-center gap-1.5">
          <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#C9A45C]/70 to-transparent" />
          <h3 className="text-center text-lg font-semibold leading-tight text-[#E9DFC8]">{card.titleZh}</h3>
          <p className="text-center text-[9px] uppercase leading-snug tracking-[0.18em] text-[#8F8672]">{card.titleEn}</p>
        </div>
      </div>
    </div>
  );
});

export function TarotCardBack({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <div
      className={`relative aspect-[2/3] select-none overflow-hidden border border-[#C9A45C]/55
        shadow-[0_18px_60px_rgba(0,0,0,0.85)] ${DIMS[size]} ${className}`}
    >
      <div className="card-back-pattern absolute inset-0" />
      <div className="absolute inset-[8px] border border-[#C9A45C]/40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="-12 -12 24 24" className="h-10 w-10 text-[#C9A45C]/80" aria-hidden="true">
          <path d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="0" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}
