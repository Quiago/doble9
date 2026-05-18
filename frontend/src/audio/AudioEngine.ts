// audio/AudioEngine.ts — placeholder SFX from week 1 (CLAUDE.md §4.5, §15).
// Synthesised via Web Audio (no asset files yet); Howler stays a dependency
// for when real samples land. Decoupled: subscribes to the Dispatcher bus
// like Phaser does (ADR-001) — never called by React/Phaser directly.
// AGENT: Frontend.
import { dispatcher } from "@/store/dispatcher";
import { useUiStore } from "@/store/uiStore";
import type {
  TilePlacedPayload,
  SpecialPlayPayload,
  ChatMessagePayload,
} from "@shared/game";
import { dlog } from "@/lib/debug";

type Wave = OscillatorType;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private started = false;

  /** Lazily create the context on the first user gesture (autoplay policy). */
  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  /** Wire bus subscriptions + unlock-on-gesture + mute sync. Idempotent. */
  start() {
    if (this.started) return;
    this.started = true;

    this.enabled = useUiStore.getState().audioEnabled;
    useUiStore.subscribe((s) => {
      this.enabled = s.audioEnabled;
    });

    const unlock = () => {
      this.ensure()?.resume();
    };
    window.addEventListener("pointerdown", unlock, { once: true });

    dispatcher.on("TILE_PLAYED", () => this.click());
    dispatcher.on("tile_placed", (p) =>
      this.tilePlace((p as TilePlacedPayload).tile.ends),
    );
    dispatcher.on("PASS", () => this.passStamp());
    dispatcher.on("turn_changed", () => this.blip(420, "triangle", 0.05));
    dispatcher.on("special_play", (p) =>
      (p as SpecialPlayPayload).type === "CAPICUA"
        ? this.celebrate(false)
        : this.celebrate(true),
    );
    dispatcher.on("chat_message", (p) =>
      this.chatPing((p as ChatMessagePayload).bySeat),
    );

    dlog("ui", "AudioEngine wired (synth placeholders)");
  }

  /** UI click — call from button handlers via useAudio. */
  click() {
    this.blip(880, "square", 0.04, 0.18);
  }

  private tilePlace(ends: [number, number]) {
    // pitch varies with the tile's pip sum (CLAUDE.md §4.5 "varied pitch").
    const base = 240 + (ends[0] + ends[1]) * 14;
    this.blip(base, "triangle", 0.07, 0.3);
    this.noise(0.05, 0.12, 600);
  }

  private passStamp() {
    this.blip(150, "square", 0.12, 0.32);
    this.noise(0.06, 0.18, 300);
  }

  private chatPing(seat: number) {
    // spatial: pan left→right by seat (CLAUDE.md §4.5 spatial chat).
    const pan = [-0.6, 0.6, 0, 0][seat] ?? 0;
    this.blip(660, "sine", 0.09, 0.22, pan);
  }

  private celebrate(big: boolean) {
    const notes = big ? [523, 659, 784, 1047] : [523, 659, 784];
    notes.forEach((f, i) =>
      setTimeout(() => this.blip(f, "sine", 0.18, 0.28), i * 90),
    );
  }

  // ── primitives ──
  private blip(
    freq: number,
    type: Wave,
    dur: number,
    vol = 0.25,
    pan = 0,
  ) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const pn = ctx.createStereoPanner();
    o.type = type;
    o.frequency.value = freq;
    pn.pan.value = pan;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(pn).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, cutoff: number) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) ch[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = cutoff;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur);
  }
}

export const audio = new AudioEngine();
