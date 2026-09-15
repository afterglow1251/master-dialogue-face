import type { WsSpeechChunk } from "@shared/types/websocket";
import { mouthShapeAt, spokenTextAt, type MouthShape } from "@/utils/visemes";

const AUDIO_MIME_TYPE = "audio/mpeg";

export interface SpeechPlayerCallbacks {
  readonly onChunkStart: (chunk: WsSpeechChunk) => void;
  readonly onSpokenText: (text: string) => void;
  readonly onQueueDrained: () => void;
}

interface PlayingChunk {
  readonly chunk: WsSpeechChunk;
  readonly url: string;
}

function joinSentences(prefix: string, sentence: string): string {
  if (prefix.length === 0) return sentence;
  if (sentence.length === 0) return prefix;
  return `${prefix} ${sentence}`;
}

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: AUDIO_MIME_TYPE });
}

export class SpeechPlayer {
  private readonly audio = new Audio();
  private readonly queue: WsSpeechChunk[] = [];
  private current: PlayingChunk | null = null;
  private spokenPrefix = "";
  private lastSpokenText = "";
  private frameId = 0;

  constructor(private readonly callbacks: SpeechPlayerCallbacks) {
    this.audio.addEventListener("ended", () => this.finishCurrent());
  }

  get isBusy(): boolean {
    return this.current !== null || this.queue.length > 0;
  }

  enqueue(chunk: WsSpeechChunk): void {
    this.queue.push(chunk);
    if (!this.current) this.playNext();
  }

  reset(): void {
    this.stopProgressLoop();
    this.audio.pause();
    this.releaseCurrent();
    this.queue.length = 0;
    this.spokenPrefix = "";
    this.lastSpokenText = "";
  }

  currentMouthShape(): MouthShape | null {
    if (!this.current || this.audio.paused) return null;
    return mouthShapeAt(this.current.chunk.alignment, this.audio.currentTime);
  }

  private playNext(): void {
    const chunk = this.queue.shift();
    if (!chunk) {
      this.stopProgressLoop();
      this.callbacks.onQueueDrained();
      return;
    }

    const url = URL.createObjectURL(base64ToBlob(chunk.audioBase64));
    this.current = { chunk, url };
    this.audio.src = url;
    this.callbacks.onChunkStart(chunk);

    this.audio.play().catch((error: unknown) => {
      const interrupted =
        error instanceof DOMException && error.name === "AbortError";
      if (interrupted) return;
      console.error("Speech playback failed:", error);
      this.finishCurrent();
    });
    this.startProgressLoop();
  }

  private finishCurrent(): void {
    if (!this.current) return;
    this.spokenPrefix = joinSentences(
      this.spokenPrefix,
      this.current.chunk.text,
    );
    this.emitSpokenText(this.spokenPrefix);
    this.releaseCurrent();
    this.playNext();
  }

  private releaseCurrent(): void {
    if (!this.current) return;
    URL.revokeObjectURL(this.current.url);
    this.current = null;
  }

  private emitSpokenText(text: string): void {
    if (text === this.lastSpokenText) return;
    this.lastSpokenText = text;
    this.callbacks.onSpokenText(text);
  }

  private startProgressLoop(): void {
    if (this.frameId !== 0) return;
    const tick = () => {
      if (this.current) {
        const partial = spokenTextAt(
          this.current.chunk.alignment,
          this.audio.currentTime,
        );
        this.emitSpokenText(joinSentences(this.spokenPrefix, partial));
      }
      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }

  private stopProgressLoop(): void {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }
}
