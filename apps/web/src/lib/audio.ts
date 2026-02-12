// ─── PCM16 Decode ────────────────────────────────────────

/**
 * Base64-encoded PCM16 verisini Float32Array'e çevirir.
 * fal.ai TTS streaming, 16-bit signed int, mono, 16kHz döner.
 */
export function decodePCM16(base64: string): Float32Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i]! / 32768;
  }
  return float32;
}

// ─── Audio Queue Player ──────────────────────────────────

const SAMPLE_RATE = 16_000;

export class AudioQueuePlayer {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime = 0;
  private playing = false;

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  enqueue(pcmFloat32: Float32Array): void {
    if (!this.ctx || !this.gainNode) return;

    const buffer = this.ctx.createBuffer(1, pcmFloat32.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(pcmFloat32);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    const now = this.ctx.currentTime;
    const startAt = Math.max(now, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;
    this.playing = true;

    source.onended = () => {
      if (this.ctx && this.ctx.currentTime >= this.nextStartTime - 0.01) {
        this.playing = false;
      }
    };
  }

  flush(): void {
    if (!this.ctx) return;
    // Recreate context to immediately stop all queued audio
    const oldCtx = this.ctx;
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
    this.nextStartTime = 0;
    this.playing = false;
    oldCtx.close();
  }

  isPlaying(): boolean {
    return this.playing;
  }

  setVolume(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  destroy(): void {
    this.ctx?.close();
    this.ctx = null;
    this.gainNode = null;
  }
}

// ─── Volume Meter ────────────────────────────────────────

export function createVolumeMeter(
  stream: MediaStream,
  onVolume: (rms: number) => void,
): { stop: () => void } {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const data = new Float32Array(analyser.fftSize);
  let running = true;

  function tick() {
    if (!running) return;
    analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i]! * data[i]!;
    }
    const rms = Math.sqrt(sum / data.length);
    onVolume(rms);
    requestAnimationFrame(tick);
  }

  tick();

  return {
    stop() {
      running = false;
      source.disconnect();
      ctx.close();
    },
  };
}
