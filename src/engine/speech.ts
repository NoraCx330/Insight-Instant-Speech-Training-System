// Web Speech API 语音转写封装（可选能力，浏览器不支持时退化为手动输入）
export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  transcript: string;
}

export interface SpeechSession {
  start: (onPartial: (text: string) => void) => void;
  stop: () => void;
  supported: boolean;
}

interface SRStatic {
  new (): {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((e: { results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
  };
}

declare global {
  interface Window {
    SpeechRecognition?: SRStatic;
    webkitSpeechRecognition?: SRStatic;
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

export function createSpeechSession(): SpeechSession {
  const Ctor = typeof window !== 'undefined'
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;
  if (!Ctor) {
    return { supported: false, start: () => undefined, stop: () => undefined };
  }
  const rec = new Ctor();
  rec.lang = 'zh-CN';
  rec.continuous = true;
  rec.interimResults = true;

  return {
    supported: true,
    start(onPartial) {
      let finalText = '';
      rec.onresult = e => {
        let interim = '';
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r.transcript;
          else interim += r.transcript;
        }
        onPartial(finalText + interim);
      };
      rec.onerror = () => {
        rec.onend = null;
        try { rec.abort(); } catch { /* noop */ }
      };
      try {
        rec.start();
      } catch {
        // 重复 start 时忽略
      }
    },
    stop() {
      try { rec.stop(); } catch { /* noop */ }
    },
  };
}
