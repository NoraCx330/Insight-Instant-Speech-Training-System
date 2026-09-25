# AGENTS.md — THE INSIGHT DECK｜洞见牌

## 项目概览
个人单人 Interactive MVP：跨学科知识卡牌 × 即兴思维训练 × 口头表达训练。
纯前端应用（无 API Key、无外部数据库），数据持久化全部走 `localStorage`。
视觉为黑金塔罗风格：背景 `#050505`、主金 `#C9A45C`、卡面严格 2:3，全部概念符号由 SVG 线描生成。

## 技术栈
- Vite 7 + React 19 + TypeScript 5（strict）
- Tailwind CSS 3（PostCSS）
- Framer Motion 11（翻牌 / 漂浮 / 洗牌 / 粒子 / 进度动画）
- Express 4 仅作为静态/开发容器（`server/`），业务逻辑不依赖服务端
- Web Speech API（语音转写，可选能力，不支持时退化为手动输入）

## 目录结构
```
├── server/                # Express 容器（健康检查 + Vite 中间件 + 静态服务）
│   ├── routes/index.ts    # /api/health,/api/hello,/api/data（基础设施接口）
│   ├── server.ts
│   └── vite.ts
├── src/
│   ├── components/
│   │   ├── Glyph.tsx      # 概念象征图库（SVG 线描，key 为符号名）
│   │   ├── TarotCard.tsx  # 卡面 / 卡背（aspect-[2/3]，罗马数字+符号+中英标题）
│   │   ├── DrawCeremony.tsx # 电影感抽卡序列（floating→shuffle→gather→reveal）
│   │   ├── GoldParticles.tsx # 金色粒子上浮
│   │   ├── ReportView.tsx # THINKING REPORT（六维条形 + 总分环）
│   │   └── Layout.tsx     # 顶栏（XP/LV/Streak）+ 桌面导航 + 移动底栏
│   ├── data/
│   │   ├── types.ts       # Card / Discipline / 学科元信息
│   │   ├── cards1.ts      # 第 1–28 张（心理/经济/政治/社会）
│   │   ├── cards2.ts      # 第 29–56 张（哲学/数学哲学/物理哲学/AI 技术）
│   │   └── index.ts       # ALL_CARDS、getCard、DISCIPLINE_META
│   ├── engine/
│   │   ├── report.ts      # 本地启发式分析：六维评分（同文同分，稳定哈希扰动）
│   │   ├── useCountdown.ts# 倒计时 hook（start/pause/reset/onEnd）
│   │   └── speech.ts      # Web Speech API 封装
│   ├── pages/
│   │   ├── HomePage.tsx       # 首页 + 仪式抽卡 + 六大入口
│   │   ├── DailyPage.tsx      # DAILY INSIGHT：当日固定牌 + 3D 翻牌 + 反思
│   │   ├── ConnectPage.tsx    # CONNECT TWO：随机双卡 + 联结写作
│   │   ├── LabPage.tsx        # THINKING LAB：90 秒即兴（转写/键入）
│   │   ├── DeepThinkPage.tsx  # DEEP THINK：5min 研究→30s 重置→3min 表达
│   │   ├── TopicsPage.tsx     # HOT TOPICS：6 议题 + 推荐分析牌
│   │   └── ArchivePage.tsx    # ARCHIVE：统计 + 记录筛选 + 56 张图鉴 + 卡牌详情
│   ├── store/useStore.tsx # StoreProvider / useStore：XP、Streak、每日牌、档案
│   ├── App.tsx           # hash 路由（#/daily 等）
│   ├── main.tsx          # React 入口
│   └── index.css         # Tailwind + 字体（fonts.googleapis.cn）+ 卡面暗纹/动效
└── .coze                 # 构建/运行入口（勿改）：scripts/*.sh
```

## 常用命令（仅 pnpm）
- 开发：`pnpm run dev`（端口由 `DEPLOY_RUN_PORT` 决定，本地默认 5000）
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint`
- 前端构建：`pnpm vite build`
- 完整构建（前端 + tsup 服务端）：`pnpm run build`
- 生产启动：`pnpm run start`

## 核心业务规则
- **每日牌**：以当地日期 `YYYY-MM-DD` 为哈希种子选牌，同日固定、次日自动更换；记录 key 为 `insight-deck:v1`。
- **XP**：DAILY 20 / CONNECT 40 / LAB 60 / DEEP 120 / TOPICS 30；等级 = `floor(xp/200)+1`。
- **Streak**：当日首次活动时，若上次活动为昨日则 +1，否则归 1。
- **六维评分**：概念准确度 / 跨学科联结 / 论证结构 / 例证具体性 / 语言表达 / 批判与原创；基于关键词命中、句数、连接词、例证、填充词、完成度等真实文本特征计算，同文本同结果（无随机性）。
- **计时**：Lab 90s；Deep Think 300s → 30s → 180s，阶段自动推进，也可手动提前进入。

## 编码规范
- TypeScript strict：禁止隐式 `any` / `as any`；函数参数与回调显式标注类型。
- React 19 项目不引入 `import React`，仅在用到 API 时按需 import。
- 标点半角；所有符号/组件使用前必须 import。
- 新增概念符号：在 `Glyph.tsx` 的 `GLYPHS` 中以 `name` 注册 100×100 viewBox 的线描节点，卡数据引用该 key。
- 新增卡牌：向 `cards1/cards2` 追加对象（id 连续、罗马数字、glyph key 已存在、中英标题、要义、今日之问、关键词）。

### Express × Vite 集成陷阱（勿再犯）
- `server/vite.ts` 创建 Vite 实例时**不要** `import viteConfig from '../vite.config'` 再展开传入，也不要在 inline 配置里重复给 plugins。否则 Vite 仍会加载磁盘上的 `vite.config.ts`，`mergeConfig` 把两份 plugins 数组拼接，导致 `$RefreshReg$` / `$RefreshSig$` / `inWebWorker` 重复声明（esbuild Transform failed）。当前做法：只传 `root/server/appType`，配置全部交给配置文件。
- 全局错误处理中间件必须 4 参数 `(err, req, res, next)`，3 参数会被 Express 当成普通中间件，报 `res.status is not a function`。
- 修改 `server/*.ts` 后由 `tsx watch` 自动重启；若个别文件改动未触发重启，可对入口 `server.ts` 做无害编辑强制重启。

## 验收操作路径
1. 首页点击 DRAW TODAY'S CARD，观察约 2–3s 洗牌→翻转→金色粒子序列，落于 `#/daily`。
2. Daily 页点击卡牌可正反面翻转；写 ≥20 字反思 → REVEAL INSIGHT → 出现六维报告并增加 20 XP。
3. 同日刷新页面牌面不变；修改本地日期到次日，牌面更换。
4. Connect：抽两张牌（跨学科），写 ≥40 字 → FORGE THE LINK（+40 XP）。
5. Lab：开始后倒计时 90s（最后 10s 变红），允许浏览器麦克风时实时转写，否则手动输入；结束 → GENERATE REPORT（+60 XP）。
6. Deep Think：研究 5:00 → 自动进重置 0:30 → 表达 3:00 → 生成报告（+120 XP）；各阶段均可手动提前。
7. Topics：6 个议题可选，推荐牌可点入图鉴，≥50 字提交（+30 XP）。
8. Archive：查看 XP/LV/Streak/最高分、按类型筛选记录、按学科浏览 56 张图鉴、点击卡片看详情与相关训练；支持一键清空。
9. 移动端：底部 7 项导航；桌面端：顶部导航；卡面在窄屏自适应缩窄。
