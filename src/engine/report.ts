// 本地启发式分析引擎（mock AI）：对文本/转写内容做六维度评分
// 无网络、无 API Key；结果由文本真实特征 + 稳定哈希扰动产生，同文同分。

export interface DimensionScore {
  key: string;
  zh: string;
  en: string;
  score: number;
  comment: string;
}

export interface ThinkingReport {
  total: number;
  grade: string;
  summary: string;
  dimensions: DimensionScore[];
  strengths: string[];
  improvements: string[];
  metrics: {
    chars: number;
    sentences: number;
    keywordHits: string[];
    connectors: number;
    examples: number;
    fillers: number;
  };
}

export interface AnalyzeInput {
  text: string;
  keywords: string[];
  targetSeconds: number; // 目标表达时长 / 写作时长
  kind: 'speak' | 'write';
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 同维度同文本的稳定扰动 (-jitter ~ +jitter)
function jitterFor(text: string, key: string, jitter: number): number {
  const h = hashStr(`${key}:${text}`);
  return ((h % 1000) / 1000 - 0.5) * 2 * jitter;
}

function clamp(v: number, min = 35, max = 98): number {
  return Math.round(Math.max(min, Math.min(max, v)));
}

function bandComment(score: number, bands: [number, string][]): string {
  for (const [threshold, text] of bands) {
    if (score >= threshold) return text;
  }
  return bands[bands.length - 1][1];
}

export function analyzeThinking(input: AnalyzeInput): ThinkingReport {
  const { text, keywords, targetSeconds, kind } = input;
  const clean = text.trim();

  const cjkChars = (clean.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const latinWords = (clean.match(/[a-zA-Z]+/g) ?? []).length;
  const chars = cjkChars + latinWords;

  const sentences = Math.max(1, (clean.match(/[。！？!?\n]+/g) ?? []).length);
  const avgSentenceLen = chars / sentences;

  const keywordHits = keywords.filter(k => clean.includes(k));

  const connectorMarkers = ['因为', '所以', '因此', '但是', '然而', '不过', '如果', '那么', '首先', '其次', '最后', '一方面', '另一方面', '于是', '结果', '因果', '前提', '结论', 'although', 'because', 'however'];
  const connectors = connectorMarkers.reduce((n, m) => n + ((clean.toLowerCase().match(new RegExp(m, 'g')) ?? []).length), 0);

  const exampleMarkers = ['比如', '例如', '譬如', '具体', '举个', '就像', '好比', '以', '数据', '%', '年', '我观察', '我经历', '有一次'];
  const examples = exampleMarkers.reduce((n, m) => n + ((clean.match(new RegExp(m, 'g')) ?? []).length), 0);

  const fillerMarkers = ['嗯', '呃', '啊', '那个那个', '就是就是', '然后然后', '怎么说', 'umm', 'uhh', 'like like'];
  const fillers = fillerMarkers.reduce((n, m) => n + ((clean.toLowerCase().match(new RegExp(m, 'g')) ?? []).length), 0);

  const hedgeMarkers = ['可能', '也许', '大概', '应该是', '感觉', '好像'];
  const hedges = hedgeMarkers.reduce((n, m) => n + ((clean.match(new RegExp(m, 'g')) ?? []).length), 0);

  const analogyMarkers = ['像', '类比', '相当于', '类似', '相似', '如同'];
  const analogies = analogyMarkers.reduce((n, m) => n + ((clean.match(new RegExp(m, 'g')) ?? []).length), 0);

  // 完成度：口语约每秒 3.2 字，写作按每秒 1.2 字
  const rate = kind === 'speak' ? 3.2 : 1.2;
  const targetChars = targetSeconds * rate;
  const completion = Math.min(1, chars / Math.max(40, targetChars));

  const j = (key: string, n: number) => jitterFor(clean, key, n);

  // 1. 概念准确度
  const conceptScore = clamp(
    48 + keywordHits.length * 13 + Math.min(20, completion * 20) - hedges * 1.2 + j('concept', 4),
  );
  // 2. 跨学科联结
  const connectScore = clamp(
    50 + analogies * 7 + connectors * 2.2 + (keywordHits.length >= 2 ? 12 : 0) + j('connect', 5),
  );
  // 3. 论证结构
  const structureScore = clamp(
    44 + Math.min(24, sentences * 5) + Math.min(18, connectors * 4)
      - (avgSentenceLen > 60 ? 10 : 0)
      - (sentences <= 2 && chars > 80 ? 8 : 0) + j('structure', 4),
  );
  // 4. 例证具体性
  const exampleScore = clamp(42 + Math.min(34, examples * 8) + (/\d/.test(clean) ? 8 : 0) + j('example', 5));
  // 5. 语言表达
  const expressionScore = clamp(
    52 + Math.min(22, completion * 22) - fillers * 5
      + (avgSentenceLen >= 8 && avgSentenceLen <= 45 ? 12 : 0) + j('expression', 4),
  );
  // 6. 批判与原创
  const critiqueMarkers = ['质疑', '问题', '局限', '反例', '不一定', '真的吗', '前提是', '我认为', '另一种'];
  const critiques = critiqueMarkers.reduce((n, m) => n + ((clean.match(new RegExp(m, 'g')) ?? []).length), 0);
  const critiqueScore = clamp(50 + critiques * 7 + (hedges <= 2 && chars > 120 ? 8 : 0) + j('critique', 5));

  const dims: DimensionScore[] = [
    {
      key: 'concept', zh: '概念准确度', en: 'CONCEPTUAL CLARITY', score: conceptScore,
      comment: bandComment(conceptScore, [
        [85, '核心概念被准确调用，定义与边界清晰。'],
        [70, '概念基本到位，可再明确其定义边界。'],
        [55, '概念有触及，但表述模糊或夹带猜测。'],
        [0, '概念尚未被真正使用，建议重读卡面要义。'],
      ]),
    },
    {
      key: 'connect', zh: '跨学科联结', en: 'CROSS-DISCIPLINE LINK', score: connectScore,
      comment: bandComment(connectScore, [
        [85, '联结自然且有解释力，概念之间产生了新意义。'],
        [70, '存在有效类比，联结链条可再补一环。'],
        [55, '有联结意图，但类比停在表面相似。'],
        [0, '暂未建立跨概念的联结。'],
      ]),
    },
    {
      key: 'structure', zh: '论证结构', en: 'STRUCTURE & LOGIC', score: structureScore,
      comment: bandComment(structureScore, [
        [85, '起承转合完整，因果链条可被跟随。'],
        [70, '结构可见，部分转折缺少过渡。'],
        [55, '观点并列堆叠，主次尚未拉开。'],
        [0, '内容呈碎片状，缺少推进线。'],
      ]),
    },
    {
      key: 'example', zh: '例证具体性', en: 'CONCRETE EVIDENCE', score: exampleScore,
      comment: bandComment(exampleScore, [
        [85, '例证具体可感，细节与数字增强了说服力。'],
        [70, '有例证支撑，可再加入具体场景。'],
        [55, '停留在抽象陈述，例子笼统。'],
        [0, '缺少例证，观点悬空。'],
      ]),
    },
    {
      key: 'expression', zh: '语言表达', en: 'EXPRESSION & DELIVERY', score: expressionScore,
      comment: bandComment(expressionScore, [
        [85, '语句流畅有节奏，语气词极少，听感清晰。'],
        [70, '表达通顺，个别口头禅可清理。'],
        [55, '时长或句长失衡，影响跟随。'],
        [0, '表达断续，填充词过多。'],
      ]),
    },
    {
      key: 'critique', zh: '批判与原创', en: 'CRITICAL ORIGINALITY', score: critiqueScore,
      comment: bandComment(critiqueScore, [
        [85, '出现了自己的判断与对前提的追问。'],
        [70, '有立场表达，可再挑战一次隐含前提。'],
        [55, '以复述为主，个人声音偏弱。'],
        [0, '暂未看到独立判断。'],
      ]),
    },
  ];

  const total = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
  const grade = total >= 90 ? 'S' : total >= 82 ? 'A' : total >= 72 ? 'B' : total >= 60 ? 'C' : 'D';

  const sorted = [...dims].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 2).map(d => `${d.zh} · ${d.comment}`);
  const improvements = sorted
    .slice(-2)
    .reverse()
    .map(d => `${d.zh} · ${d.score < 60 ? '优先补强：' : '继续打磨：'}${d.comment}`);

  const summary = bandComment(total, [
    [90, '一次近乎完成的思维演出：概念、结构与个人判断同时在线。'],
    [82, '表现扎实，已具备清晰的思考骨架与表达节奏。'],
    [72, '一次有效的训练，观点成立，再补例证与联结会更完整。'],
    [60, '完成了思考的启动，结构与具体性是下一步的着力点。'],
    [0, '这是一次低完成度的尝试，先追求说满、写满，再追求说好。'],
  ]);

  return {
    total,
    grade,
    summary,
    dimensions: dims,
    strengths,
    improvements,
    metrics: { chars, sentences, keywordHits, connectors, examples, fillers },
  };
}
