import type { ReactNode } from 'react';

// 概念象征图库：炼金手稿式金色线描，全部 100x100 viewBox，stroke = currentColor
interface GlyphProps {
  name: string;
  strokeWidth?: number;
  className?: string;
}

const S = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Group({ children, sw, className }: { children: ReactNode; sw: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill={S.fill}
      stroke="currentColor" strokeWidth={sw}
      strokeLinecap={S.strokeLinecap} strokeLinejoin={S.strokeLinejoin}
      aria-hidden="true">
      {children}
    </svg>
  );
}

const GLYPHS: Record<string, ReactNode> = {
  // 冰山：水面之上一角，水下庞大
  iceberg: (<>
    <path d="M50 18 L64 46 L36 46 Z" />
    <path d="M18 78 L36 46 H64 L82 78 Z" />
    <line x1="14" y1="46" x2="86" y2="46" strokeDasharray="3 5" opacity="0.7" />
    <line x1="50" y1="30" x2="50" y2="42" opacity="0.6" />
  </>),
  // 梯子：逐级攀登
  ladder: (<>
    <line x1="34" y1="12" x2="34" y2="88" />
    <line x1="66" y1="12" x2="66" y2="88" />
    <line x1="34" y1="26" x2="66" y2="26" /><line x1="34" y1="40" x2="66" y2="40" />
    <line x1="34" y1="54" x2="66" y2="54" /><line x1="34" y1="68" x2="66" y2="68" /><line x1="34" y1="82" x2="66" y2="82" />
  </>),
  // 面具：微笑假面
  mask: (<>
    <path d="M22 30 C22 24 40 22 50 22 C60 22 78 24 78 30 L72 58 C68 72 60 78 50 78 C40 78 32 72 28 58 Z" />
    <path d="M36 42 h8 M56 42 h8" />
    <path d="M42 56 q8 6 16 0" />
  </>),
  // 锚
  anchor: (<>
    <circle cx="50" cy="22" r="7" />
    <line x1="50" y1="29" x2="50" y2="80" />
    <line x1="34" y1="40" x2="66" y2="40" />
    <path d="M26 58 C26 74 38 82 50 82 C62 82 74 74 74 58" />
    <path d="M26 58 l-7 3 M74 58 l7 3" />
  </>),
  // 悲喜双面
  masks: (<>
    <path d="M18 28 C18 24 32 22 42 24 L38 52 C34 64 26 68 20 60 C17 54 18 40 18 28 Z" />
    <path d="M25 38 h5 M27 52 q5 4 10 -1" />
    <path d="M58 24 C68 22 82 24 82 28 C82 40 83 54 80 60 C74 68 66 64 62 52 Z" />
    <path d="M70 38 h5 M63 51 q5 5 10 1" />
  </>),
  // 天平
  scale: (<>
    <line x1="50" y1="16" x2="50" y2="78" />
    <line x1="28" y1="28" x2="72" y2="28" />
    <path d="M28 28 L18 52 H38 Z" />
    <path d="M72 28 L62 52 H82 Z" />
    <path d="M38 78 h24" />
    <circle cx="50" cy="21" r="2.5" />
  </>),
  // 沉船 / 沉没
  sunkship: (<>
    <path d="M20 62 h60 l-8 14 H28 Z" />
    <line x1="50" y1="62" x2="50" y2="40" />
    <path d="M50 40 C62 42 66 52 66 62" />
    <path d="M30 76 l-3 8 M44 76 l-2 9 M58 76 l2 9 M70 76 l3 8" opacity="0.7" />
    <line x1="16" y1="34" x2="84" y2="34" strokeDasharray="3 5" opacity="0.6" />
  </>),
  // 岔路机会
  opportunity: (<>
    <circle cx="50" cy="18" r="5" />
    <path d="M50 23 L50 44 L30 66 V84" />
    <path d="M50 44 L70 66 V84" />
    <circle cx="30" cy="84" r="3" /><circle cx="70" cy="84" r="3" />
  </>),
  // 手
  hand: (<>
    <path d="M34 84 V44 M34 44 V28 M34 44 C34 36 42 36 42 44 V30 C42 24 50 24 50 30 V44 C50 36 58 36 58 44 V52 C58 44 66 44 66 52 V66 C66 80 56 86 46 86 Z" />
  </>),
  // 循环箭头
  circleArrows: (<>
    <path d="M22 50 a28 28 0 0 1 48 -19" />
    <path d="M70 24 l2 9 -9 1" />
    <path d="M78 50 a28 28 0 0 1 -48 19" />
    <path d="M30 76 l-2 -9 9 -1" />
  </>),
  // 钟形曲线
  bellcurve: (<>
    <path d="M14 78 C26 78 32 76 40 58 C45 46 55 46 60 58 C68 76 74 78 86 78" />
    <line x1="14" y1="82" x2="86" y2="82" />
    <line x1="50" y1="30" x2="50" y2="82" strokeDasharray="3 4" opacity="0.6" />
  </>),
  // 蜡烛排
  candles: (<>
    <line x1="28" y1="40" x2="28" y2="80" /><line x1="50" y1="30" x2="50" y2="80" /><line x1="72" y1="48" x2="72" y2="80" />
    <line x1="22" y1="80" x2="78" y2="80" />
    <path d="M28 40 q-4 -8 0 -14 q4 6 0 14 Z M50 30 q-4 -8 0 -14 q4 6 0 14 Z M72 48 q-4 -8 0 -14 q4 6 0 14 Z" />
  </>),
  // 契约卷轴
  contract: (<>
    <path d="M28 26 h44 v48 H28 Z" />
    <path d="M28 26 a8 8 0 0 0 -8 8 a8 8 0 0 0 8 8 M72 26 a8 8 0 0 1 8 8 a8 8 0 0 1 -8 8" />
    <line x1="36" y1="42" x2="64" y2="42" /><line x1="36" y1="52" x2="64" y2="52" /><line x1="36" y1="62" x2="54" y2="62" />
  </>),
  // 全视之眼
  eye: (<>
    <path d="M16 50 C30 30 70 30 84 50 C70 70 30 70 16 50 Z" />
    <circle cx="50" cy="50" r="10" />
    <circle cx="50" cy="50" r="3" fill="currentColor" stroke="none" />
  </>),
  // 钟摆
  pendulum: (<>
    <line x1="50" y1="14" x2="50" y2="22" />
    <path d="M50 22 L28 66" />
    <circle cx="28" cy="70" r="7" />
    <path d="M30 80 a22 22 0 0 0 40 0" opacity="0.6" />
  </>),
  // 王冠
  crowne: (<>
    <path d="M20 68 L24 32 L38 50 L50 26 L62 50 L76 32 L80 68 Z" />
    <line x1="20" y1="74" x2="80" y2="74" />
    <circle cx="24" cy="30" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="50" cy="24" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="76" cy="30" r="2.5" fill="currentColor" stroke="none" />
  </>),
  // 蛛网
  web: (<>
    <path d="M50 12 L50 88 M18 24 L82 76 M82 24 L18 76" />
    <path d="M50 26 L66 34 M50 26 L34 34" />
    <path d="M50 44 L76 50 M50 44 L24 50" />
    <path d="M50 64 L68 70 M50 64 L32 70" />
  </>),
  // 马蹄铁
  horseshoe: (<>
    <path d="M30 16 C24 30 24 58 34 72 C40 80 44 84 50 84 C56 84 60 80 66 72 C76 58 76 30 70 16" />
    <line x1="30" y1="16" x2="38" y2="22" /><line x1="70" y1="16" x2="62" y2="22" />
    <circle cx="40" cy="46" r="2" fill="currentColor" stroke="none" /><circle cx="60" cy="46" r="2" fill="currentColor" stroke="none" />
    <circle cx="44" cy="64" r="2" fill="currentColor" stroke="none" /><circle cx="56" cy="64" r="2" fill="currentColor" stroke="none" />
  </>),
  // 舞台聚光
  stage: (<>
    <path d="M50 10 L14 64 H86 Z" opacity="0.5" />
    <line x1="10" y1="64" x2="90" y2="64" />
    <circle cx="50" cy="74" r="6" /><path d="M50 80 v6 M38 88 h24" />
  </>),
  // 铁笼
  cage: (<>
    <rect x="22" y="18" width="56" height="64" />
    <line x1="33" y1="18" x2="33" y2="82" /><line x1="44" y1="18" x2="44" y2="82" /><line x1="56" y1="18" x2="56" y2="82" /><line x1="67" y1="18" x2="67" y2="82" />
    <line x1="22" y1="38" x2="78" y2="38" /><line x1="22" y1="60" x2="78" y2="60" />
  </>),
  // 靶
  target: (<>
    <circle cx="50" cy="50" r="34" /><circle cx="50" cy="50" r="22" /><circle cx="50" cy="50" r="10" />
    <circle cx="50" cy="50" r="2.5" fill="currentColor" stroke="none" />
  </>),
  // 山
  mountain: (<>
    <path d="M12 78 L38 34 L52 52 L62 40 L88 78 Z" />
    <path d="M30 46 l8 -12 l6 9" opacity="0.7" />
    <line x1="12" y1="78" x2="88" y2="78" />
  </>),
  // 气泡茧房
  bubble: (<>
    <circle cx="50" cy="48" r="26" /><circle cx="50" cy="48" r="14" />
    <circle cx="24" cy="26" r="6" /><circle cx="78" cy="72" r="8" /><circle cx="76" cy="24" r="4" />
  </>),
  // 人群流动
  peopleArrows: (<>
    <circle cx="26" cy="28" r="6" /><path d="M14 58 C14 46 38 46 38 58" />
    <circle cx="74" cy="28" r="6" /><path d="M62 58 C62 46 86 46 86 58" />
    <path d="M38 34 h28 M60 28 l6 6 -6 6" />
  </>),
  // 资本柱
  capital: (<>
    <line x1="50" y1="14" x2="50" y2="82" />
    <circle cx="50" cy="22" r="6" />
    <path d="M34 82 h32" />
    <path d="M30 46 h40 v10 c-10 6 -30 6 -40 10 Z" opacity="0.85" />
  </>),
  // 忒修斯之船
  ship: (<>
    <path d="M16 60 h68 l-10 16 H26 Z" />
    <line x1="50" y1="60" x2="50" y2="26" />
    <path d="M50 28 C62 30 66 42 66 58" />
    <path d="M28 44 h18 M30 36 h14" opacity="0.7" />
  </>),
  // 洞穴
  cavern: (<>
    <path d="M14 84 C14 56 30 30 50 30 C70 30 86 56 86 84" />
    <path d="M34 84 C34 66 42 54 50 54 C58 54 66 66 66 84" />
    <circle cx="50" cy="20" r="4" fill="currentColor" stroke="none" />
  </>),
  // 电车轨道
  trolley: (<>
    <line x1="20" y1="14" x2="46" y2="86" /><line x1="80" y1="14" x2="54" y2="86" />
    <line x1="30" y1="44" x2="70" y2="44" /><line x1="35" y1="60" x2="65" y2="60" />
    <circle cx="50" cy="44" r="4" fill="currentColor" stroke="none" />
  </>),
  // 马 / 简化马头
  horse: (<>
    <path d="M62 14 L74 20 L70 40 L74 60 L64 58 L58 72 L50 72 L54 56 C40 58 30 50 30 38 C30 26 44 16 56 22 Z" />
    <circle cx="64" cy="28" r="2" fill="currentColor" stroke="none" />
  </>),
  // 河流
  river: (<>
    <path d="M14 34 C30 26 40 42 50 34 C60 26 70 42 86 34" />
    <path d="M14 52 C30 44 40 60 50 52 C60 44 70 60 86 52" />
    <path d="M14 70 C30 62 40 78 50 70 C60 62 70 78 86 70" />
  </>),
  // 柱状图 / 断头台
  barchart: (<>
    <line x1="20" y1="82" x2="82" y2="82" /><line x1="20" y1="82" x2="20" y2="18" />
    <rect x="32" y="52" width="10" height="30" /><rect x="50" y="38" width="10" height="44" /><rect x="68" y="26" width="10" height="56" />
    <path d="M24 26 h20" opacity="0.7" />
  </>),
  // 无穷
  infinity: (<>
    <path d="M28 50 C28 38 42 38 50 50 C58 62 72 62 72 50 C72 38 58 38 50 50 C42 62 28 62 28 50 Z" />
  </>),
  // 三角
  triangle: (<>
    <path d="M50 16 L82 76 H18 Z" />
    <path d="M50 40 L62 64 H38 Z" opacity="0.7" />
    <circle cx="50" cy="56" r="2.5" fill="currentColor" stroke="none" />
  </>),
  // 缠绕结
  tangle: (<>
    <path d="M30 30 C50 10 70 50 50 70 C30 90 10 70 30 50 C50 30 70 50 70 50" />
  </>),
  // 点带
  dots: (<>
    <line x1="14" y1="50" x2="86" y2="50" strokeDasharray="0.1 10" />
    <circle cx="50" cy="50" r="14" /><circle cx="50" cy="50" r="3" fill="currentColor" stroke="none" />
    <path d="M28 26 h14 M58 26 h14 M28 74 h14 M58 74 h14" opacity="0.6" />
  </>),
  // 蝴蝶
  butterfly: (<>
    <path d="M50 30 v40" />
    <path d="M50 38 C38 20 20 26 22 42 C24 54 40 52 50 46 Z" />
    <path d="M50 38 C62 20 80 26 78 42 C76 54 60 52 50 46 Z" />
    <path d="M50 70 C42 60 34 66 40 74 C44 80 50 74 50 70 Z M50 70 C58 60 66 66 60 74 C56 80 50 74 50 70 Z" opacity="0.8" />
    <path d="M48 30 l-4 -8 M52 30 l4 -8" />
  </>),
  // 分形树
  fractal: (<>
    <path d="M50 86 V66 M50 66 L36 50 M50 66 L64 50 M36 50 L27 38 M36 50 L44 38 M64 50 L56 38 M64 50 L73 38" />
    <circle cx="27" cy="36" r="2" fill="currentColor" stroke="none" /><circle cx="44" cy="36" r="2" fill="currentColor" stroke="none" />
    <circle cx="56" cy="36" r="2" fill="currentColor" stroke="none" /><circle cx="73" cy="36" r="2" fill="currentColor" stroke="none" />
  </>),
  // 楼梯
  stairs: (<>
    <path d="M20 78 H34 V64 H48 V50 H62 V36 H80" />
    <path d="M20 78 V86 H80" opacity="0.5" />
    <circle cx="82" cy="30" r="3" fill="currentColor" stroke="none" />
  </>),
  // 柏拉图主义星体
  platonist: (<>
    <circle cx="50" cy="50" r="28" /><path d="M50 22 L74 66 H26 Z" />
    <path d="M50 78 L26 34 H74 Z" opacity="0.6" />
  </>),
  // 光束
  lightbeam: (<>
    <circle cx="24" cy="30" r="7" />
    <path d="M30 34 L70 66 M33 27 L80 46 M28 40 L64 80" opacity="0.75" />
    <path d="M66 62 l10 2 -3 9 Z" />
  </>),
  // 粒子云
  particles: (<>
    <circle cx="30" cy="34" r="4" /><circle cx="66" cy="30" r="3" /><circle cx="52" cy="54" r="5" />
    <circle cx="28" cy="66" r="3" /><circle cx="70" cy="68" r="4" /><circle cx="50" cy="76" r="2.5" />
    <path d="M34 36 l12 14 M63 33 l-8 18 M31 63 l16 -7 M66 65 l-10 -8" opacity="0.5" />
  </>),
  // 双猫
  twoCats: (<>
    <circle cx="36" cy="52" r="18" /><path d="M26 40 l-3 -10 11 5 M46 40 l3 -10 -11 5" />
    <circle cx="31" cy="51" r="2" fill="currentColor" stroke="none" /><circle cx="41" cy="51" r="2" fill="currentColor" stroke="none" />
    <circle cx="68" cy="52" r="18" opacity="0.55" /><path d="M58 40 l-3 -10 11 5 M78 40 l3 -10 -11 5" opacity="0.55" />
    <path d="M63 59 q5 4 10 0" opacity="0.55" />
  </>),
  // 纠缠粒子
  entangle: (<>
    <circle cx="24" cy="30" r="6" /><circle cx="76" cy="70" r="6" />
    <path d="M24 30 C60 30 40 70 76 70 M24 30 C-12 30 8 70 76 70" opacity="0.8" />
    <circle cx="24" cy="70" r="3" opacity="0.5" /><circle cx="76" cy="30" r="3" opacity="0.5" />
  </>),
  // 温度计
  thermo: (<>
    <path d="M42 58 V30 a8 8 0 0 1 16 0 v28 a14 14 0 1 1 -16 0 Z" />
    <line x1="50" y1="30" x2="50" y2="62" />
    <circle cx="50" cy="68" r="5" fill="currentColor" stroke="none" />
    <path d="M64 24 h14 M68 34 h10" opacity="0.6" />
  </>),
  // 双向箭头
  arrows: (<>
    <path d="M14 36 h60 M66 28 l8 8 -8 8" />
    <path d="M86 64 H26 M34 56 l-8 8 8 8" />
  </>),
  // 人择星
  anthropic: (<>
    <circle cx="50" cy="50" r="6" />
    <circle cx="50" cy="50" r="20" opacity="0.7" /><circle cx="50" cy="50" r="34" opacity="0.4" />
    <path d="M50 8 v10 M50 82 v10 M8 50 h10 M82 50 h10" />
  </>),
  // 网络
  network: (<>
    <circle cx="28" cy="28" r="6" /><circle cx="72" cy="28" r="6" /><circle cx="50" cy="52" r="7" />
    <circle cx="28" cy="74" r="6" /><circle cx="72" cy="74" r="6" />
    <path d="M33 32 l11 16 M67 32 l-11 16 M31 69 l14 -14 M69 69 l-14 -14 M34 28 h32 M34 74 h32" opacity="0.7" />
  </>),
  // 层级
  layers: (<>
    <path d="M50 20 L80 34 L50 48 L20 34 Z" />
    <path d="M20 46 L50 60 L80 46" opacity="0.8" />
    <path d="M20 58 L50 72 L80 58" opacity="0.55" />
  </>),
  // 书与脑
  bookBrain: (<>
    <path d="M16 30 C28 24 42 26 50 32 V80 C42 74 28 72 16 78 Z" />
    <path d="M84 30 C72 24 58 26 50 32 V80 C58 74 72 72 84 78 Z" />
    <path d="M24 42 c8 -2 14 0 20 4 M56 46 c6 -4 12 -6 20 -4" opacity="0.7" />
  </>),
  // 注意力放射
  attention: (<>
    <circle cx="50" cy="50" r="8" />
    <path d="M50 14 V30 M50 70 v16 M14 50 h16 M70 50 h16 M25 25 l11 11 M64 64 l11 11 M75 25 L64 36 M36 64 L25 75" />
  </>),
  // AI 天平
  scaleAI: (<>
    <rect x="34" y="16" width="32" height="20" rx="3" />
    <line x1="42" y1="26" x2="58" y2="26" /><circle cx="50" cy="46" r="5" />
    <line x1="50" y1="51" x2="50" y2="62" />
    <path d="M26 62 h48 M50 62 L34 78 M50 62 L66 78" />
  </>),
  // 机器人
  robot: (<>
    <rect x="28" y="30" width="44" height="36" rx="6" />
    <line x1="50" y1="30" x2="50" y2="20" /><circle cx="50" cy="17" r="3" />
    <circle cx="40" cy="46" r="4" /><circle cx="60" cy="46" r="4" />
    <path d="M42 58 h16" />
    <line x1="28" y1="46" x2="20" y2="46" /><line x1="72" y1="46" x2="80" y2="46" />
    <line x1="38" y1="66" x2="38" y2="78" /><line x1="62" y1="66" x2="62" y2="78" />
  </>),
  // 中文房间
  chamber: (<>
    <rect x="20" y="18" width="60" height="64" />
    <line x1="20" y1="40" x2="80" y2="40" />
    <path d="M32 52 h10 v18 h-10 Z M50 52 l6 18 M66 52 h0 v18" opacity="0.85" />
    <path d="M30 29 h40" opacity="0.6" />
  </>),
};

export function Glyph({ name, strokeWidth = 1.6, className }: GlyphProps) {
  const node = GLYPHS[name] ?? GLYPHS.eye;
  return <Group sw={strokeWidth} className={className}>{node}</Group>;
}
