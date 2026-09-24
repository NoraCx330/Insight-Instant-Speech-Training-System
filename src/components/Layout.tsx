import { type ReactNode } from 'react';
import { useStore } from '../store/useStore';

interface NavItem {
  hash: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { hash: '#/', label: 'HOME' },
  { hash: '#/daily', label: 'DAILY' },
  { hash: '#/connect', label: 'CONNECT' },
  { hash: '#/lab', label: 'LAB' },
  { hash: '#/deep', label: 'DEEP' },
  { hash: '#/topics', label: 'TOPICS' },
  { hash: '#/archive', label: 'ARCHIVE' },
];

export function Layout({ children, route }: { children: ReactNode; route: string }) {
  const { xp, level, streak } = useStore();
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[1180px] flex-col px-4 pb-28 pt-5 sm:px-8 sm:pb-12">
      <header className="flex items-center justify-between gap-4">
        <a href="#/" className="group flex items-center gap-3">
          <svg viewBox="-12 -12 24 24" className="h-7 w-7 text-[#C9A45C] transition-transform duration-700 group-hover:rotate-90" aria-hidden="true">
            <path d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="0" cy="0" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          <div className="leading-tight">
            <p className="font-display text-base font-semibold tracking-[0.22em] text-[#E8CE96]">THE INSIGHT DECK</p>
            <p className="text-[10px] tracking-[0.42em] text-[#8F8672]">洞 见 牌</p>
          </div>
        </a>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-[#8F8672] sm:gap-5">
          <span className="hidden sm:inline">
            LV <span className="text-[#E8CE96]">{level}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#C9A45C]" aria-hidden="true">
              <path d="M8 1.5 L9.6 6 L14.5 6 L10.5 8.8 L12 13.5 L8 10.6 L4 13.5 L5.5 8.8 L1.5 6 L6.4 6 Z" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-[#E8CE96]">{xp}</span> XP
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#C9A45C]" aria-hidden="true">
              <path d="M8 2 C5.5 4.5 5.5 7 8 9 C10.5 7 10.5 4.5 8 2 Z M5 9 C3 10.5 3 13 5 14.5 M11 9 C13 10.5 13 13 11 14.5" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            {streak}d
          </span>
        </div>
      </header>

      {/* 桌面导航 */}
      <nav className="mt-5 hidden items-center gap-1 border-y hairline py-2 md:flex" aria-label="Primary">
        {NAV_ITEMS.map(item => {
          const active = item.hash === '#/' ? route === '/' : route.startsWith(item.hash.slice(2));
          return (
            <a
              key={item.hash}
              href={item.hash}
              className={`px-4 py-1.5 text-[10px] tracking-[0.3em] transition-colors duration-300 ${
                active ? 'text-[#E8CE96]' : 'text-[#8F8672] hover:text-[#C9A45C]'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <main className="flex-1">{children}</main>

      {/* 移动端底部导航 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t hairline bg-[#080706]/95 backdrop-blur md:hidden"
        aria-label="Mobile"
      >
        <div className="flex items-stretch justify-between px-1 py-1">
          {NAV_ITEMS.map(item => {
            const active = item.hash === '#/' ? route === '/' : route.startsWith(item.hash.slice(2));
            return (
              <a
                key={item.hash}
                href={item.hash}
                className={`flex-1 px-1 py-2 text-center text-[8.5px] tracking-[0.14em] transition-colors duration-300 ${
                  active ? 'text-[#E8CE96]' : 'text-[#8F8672]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
