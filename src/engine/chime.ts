// 纯本地 Web Audio 合成钟声：无需外部音频文件
let audioCtx: AudioContext | null = null;
let lastPlayAt = 0;

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

function getCtx(): AudioContext | null {
  if (audioCtx) return audioCtx;
  try {
    const Ctor = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  } catch {
    return null;
  }
  return audioCtx;
}

// 浏览器要求用户手势后才能出声；点击按钮时调用解锁
export function unlockAudio(): void {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
}

function strike(ctx: AudioContext, freq: number, startAt: number, peakGain: number): void {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startAt);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.01, startAt);

  // 钟槌瞬态：极短攻击后长尾衰减，模拟铜钟余韵
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 3.4);

  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(peakGain * 0.18, startAt);
  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.8);

  osc.connect(gain);
  osc2.connect(overtoneGain);
  overtoneGain.gain.setValueAtTime(peakGain * 0.18, startAt);
  gain.connect(ctx.destination);
  overtoneGain.connect(ctx.destination);

  osc.start(startAt);
  osc2.start(startAt);
  osc.stop(startAt + 3.6);
  osc2.stop(startAt + 2.0);
}

/**
 * 播放倒计时结束钟声
 * @param times 响数：普通阶段结束 2 响，全部仪式完成 3 响
 */
export function playChime(times = 2): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

  // 节流：1s 内的重复调用忽略，防止自动推进与手动按钮叠加响成一片
  const now = ctx.currentTime;
  if (now - lastPlayAt < 1) return;
  lastPlayAt = now;

  for (let i = 0; i < times; i += 1) {
    strike(ctx, 392, now + i * 1.15, i === 0 ? 0.22 : 0.16);
  }
}
