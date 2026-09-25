// Web Speech API 语音转写封装（可选能力，浏览器不支持时退化为手动输入）

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  transcript: string;
}

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechErrorEvent {
  error: string;
  message?: string;
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SRStatic {
  new (): RecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SRStatic;
    webkitSpeechRecognition?: SRStatic;
  }
}

export interface SpeechErrorInfo {
  error: string;
  message: string;
  /** 是否无法恢复（需降级为手动输入） */
  fatal: boolean;
}

export interface SpeechSession {
  readonly supported: boolean;
  /** 启动转写；已在运行时调用会被忽略。onError 仅作提示，fatal 时调用方应切换文本模式 */
  start: (
    onPartial: (text: string) => void,
    onError?: (info: SpeechErrorInfo) => void,
  ) => void;
  stop: () => void;
  isActive: () => boolean;
}

// 错误码 → 文案 / 是否致命
const ERROR_MAP: Record<string, { message: string; fatal: boolean }> = {
  'not-allowed': { message: '麦克风权限被拒绝 · 请改用手动输入', fatal: true },
  'service-not-allowed': { message: '语音服务不允许使用 · 请改用手动输入', fatal: true },
  'audio-capture': { message: '未检测到可用的麦克风 · 请改用手动输入', fatal: true },
  network: { message: '语音服务网络中断', fatal: false },
  'no-speech': { message: '没有捕捉到语音，请继续说', fatal: false },
  aborted: { message: '语音转写已中断', fatal: false },
  'language-not-supported': { message: '不支持当前语言', fatal: true },
};

const MAX_AUTO_RESTARTS = 6;
const RESTART_DELAY = 220;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

export function createSpeechSession(): SpeechSession {
  const Ctor = typeof window !== 'undefined'
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;
  if (!Ctor) {
    return {
      supported: false,
      start: () => undefined,
      stop: () => undefined,
      isActive: () => false,
    };
  }

  const rec = new Ctor();
  rec.lang = 'zh-CN';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let wanted = false;          // 用户是否希望保持转写
  let starting = false;        // 已调 start 等 onstart，防 InvalidStateError
  let active = false;          // 识别器是否实际在运行
  let restarts = 0;
  let restartTimer: number | null = null;
  let onPartial: ((text: string) => void) | null = null;
  let onError: ((info: SpeechErrorInfo) => void) | null = null;
  const finalChunks: string[] = []; // 按 result 索引存放的定版片段

  const clearRestartTimer = (): void => {
    if (restartTimer !== null) {
      window.clearTimeout(restartTimer);
      restartTimer = null;
    }
  };

  const emit = (): void => {
    if (onPartial) onPartial(finalChunks.join(''));
  };

  const notifyError = (error: string): { fatal: boolean } => {
    const meta = ERROR_MAP[error] ?? { message: `语音转写异常 (${error})`, fatal: false };
    if (onError) onError({ error, message: meta.message, fatal: meta.fatal });
    return meta;
  };

  const beginRecognition = (): void => {
    if (!wanted || active || starting) return;
    starting = true;
    try {
      rec.start();
    } catch {
      // InvalidStateError：识别器已在启动/运行中，忽略即可
      starting = false;
    }
  };

  const scheduleRestart = (): void => {
    if (!wanted) return;
    if (restarts >= MAX_AUTO_RESTARTS) {
      wanted = false;
      if (onError) {
        onError({
          error: 'unstable',
          message: '语音连接不稳定 · 已切换为手动输入',
          fatal: true,
        });
      }
      return;
    }
    restarts += 1;
    clearRestartTimer();
    restartTimer = window.setTimeout(() => {
      restartTimer = null;
      beginRecognition();
    }, RESTART_DELAY);
  };

  rec.onstart = () => {
    starting = false;
    active = true;
    restarts = 0;
  };

  rec.onresult = (e) => {
    const base = typeof e.resultIndex === 'number' ? e.resultIndex : 0;
    let interim = '';
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i];
      if (i >= base && r.isFinal) {
        finalChunks[i] = r.transcript;
      } else if (!r.isFinal && i >= base) {
        interim += r.transcript;
      }
    }
    if (onPartial) onPartial(finalChunks.join('') + interim);
  };

  rec.onerror = (e) => {
    starting = false;
    active = false;
    const meta = notifyError(e.error);
    if (e.error === 'no-speech' || e.error === 'aborted') {
      // 非致命：onend 会随后触发并尝试续连
      return;
    }
    if (meta.fatal) {
      wanted = false;
      clearRestartTimer();
      try { rec.abort(); } catch { /* noop */ }
      return;
    }
    // network 等可恢复错误：尝试续连
    scheduleRestart();
  };

  rec.onend = () => {
    starting = false;
    active = false;
    emit();
    if (wanted) scheduleRestart();
  };

  return {
    supported: true,

    start(nextOnPartial, nextOnError) {
      onPartial = nextOnPartial;
      onError = nextOnError ?? null;
      if (wanted && (active || starting)) return; // 防重复启动
      wanted = true;
      restarts = 0;
      beginRecognition();
    },

    stop() {
      wanted = false;
      clearRestartTimer();
      starting = false;
      active = false;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    },

    isActive() {
      return wanted && (active || starting);
    },
  };
}
